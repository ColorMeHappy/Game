create extension if not exists vector with schema extensions;

create table if not exists public.legal_sources (
  id text primary key,
  jurisdiction text not null default 'FR' check (jurisdiction = 'FR'),
  source_type text not null,
  publisher text not null,
  title text not null,
  url text not null,
  article text,
  legal_area text not null check (legal_area in ('Corporate','Tax','Immigration','Real Estate','Cross-domain')),
  effective_from date,
  effective_until date,
  last_verified_at timestamptz not null default now(),
  status text not null check (status in ('CURRENT','UPDATED','PENDING_REVIEW','OUTDATED')),
  content_hash text not null,
  official boolean not null default true,
  published boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists legal_sources_url_article_uidx on public.legal_sources(url, coalesce(article,''));

create table if not exists public.legal_source_chunks (
  id text primary key,
  source_id text not null references public.legal_sources(id) on delete cascade,
  section text not null,
  content text not null,
  embedding extensions.vector(1536),
  effective_from date,
  effective_until date,
  tags text[] not null default '{}',
  jurisdiction text not null default 'FR' check (jurisdiction = 'FR'),
  legal_area text not null check (legal_area in ('Corporate','Tax','Immigration','Real Estate','Cross-domain')),
  status text not null check (status in ('CURRENT','UPDATED','PENDING_REVIEW','OUTDATED')),
  content_hash text not null,
  verified_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  fts tsvector generated always as (
    to_tsvector('simple'::regconfig, coalesce(section,'') || ' ' || coalesce(content,''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists legal_source_chunks_fts_idx on public.legal_source_chunks using gin(fts);
create index if not exists legal_source_chunks_area_status_idx on public.legal_source_chunks(legal_area,status,verified_at desc);
create index if not exists legal_source_chunks_effective_idx on public.legal_source_chunks(effective_from,effective_until);
create index if not exists legal_source_chunks_embedding_hnsw_idx on public.legal_source_chunks using hnsw (embedding extensions.vector_cosine_ops) where embedding is not null;

alter table public.legal_sources enable row level security;
alter table public.legal_source_chunks enable row level security;

drop policy if exists legal_sources_public_current on public.legal_sources;
create policy legal_sources_public_current on public.legal_sources for select to anon,authenticated using (
  published = true and official = true and status in ('CURRENT','UPDATED')
);

drop policy if exists legal_source_chunks_public_current on public.legal_source_chunks;
create policy legal_source_chunks_public_current on public.legal_source_chunks for select to anon,authenticated using (
  status in ('CURRENT','UPDATED')
  and exists (
    select 1 from public.legal_sources s where s.id = source_id and s.published = true and s.official = true and s.status in ('CURRENT','UPDATED')
  )
);

grant select on public.legal_sources, public.legal_source_chunks to anon,authenticated;

create or replace function public.hybrid_legal_search(
  p_query_text text,
  p_query_embedding extensions.vector(1536) default null,
  p_legal_area text default null,
  p_as_of date default current_date,
  p_official_only boolean default true,
  p_limit integer default 8
)
returns table (
  chunk_id text,
  source_id text,
  source_title text,
  source_url text,
  source_article text,
  section text,
  content text,
  legal_area text,
  source_status text,
  verified_at timestamptz,
  lexical_score double precision,
  semantic_score double precision,
  combined_score double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with q as (
    select nullif(trim(p_query_text),'') as text,
           case when nullif(trim(p_query_text),'') is null then null else plainto_tsquery('simple', trim(p_query_text)) end as tsq
  ), candidates as (
    select c.*, s.title as s_title, s.url as s_url, s.article as s_article, s.official,
      greatest(
        case when q.text is not null and c.content ilike '%' || q.text || '%' then 1.0 else 0.0 end,
        case when q.tsq is null then 0.0 else least(1.0, (ts_rank_cd(c.fts,q.tsq) * 6.0)::double precision) end
      ) as lex,
      case when p_query_embedding is null or c.embedding is null then 0.0
           else greatest(0.0, least(1.0, (1.0 - (c.embedding <=> p_query_embedding))::double precision)) end as sem
    from public.legal_source_chunks c
    join public.legal_sources s on s.id = c.source_id
    cross join q
    where q.text is not null
      and c.status in ('CURRENT','UPDATED') and s.status in ('CURRENT','UPDATED')
      and s.published = true
      and (not p_official_only or s.official = true)
      and (p_legal_area is null or c.legal_area = p_legal_area)
      and (coalesce(c.effective_from,s.effective_from) is null or coalesce(c.effective_from,s.effective_from) <= p_as_of)
      and (coalesce(c.effective_until,s.effective_until) is null or coalesce(c.effective_until,s.effective_until) >= p_as_of)
      and (
        (q.tsq is not null and c.fts @@ q.tsq)
        or (q.text is not null and c.content ilike '%' || q.text || '%')
        or (p_query_embedding is not null and c.embedding is not null)
      )
  )
  select id, source_id, s_title, s_url, s_article, section, content, legal_area, status, verified_at,
    lex, sem,
    case when p_query_embedding is null then lex * 0.95 + 0.05
         else lex * 0.55 + sem * 0.40 + 0.05 end as combined
  from candidates
  order by combined desc, verified_at desc, id
  limit greatest(1,least(coalesce(p_limit,8),20));
$$;

grant execute on function public.hybrid_legal_search(text,extensions.vector,text,date,boolean,integer) to anon,authenticated;
