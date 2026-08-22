drop index if exists public.legal_source_chunks_embedding_hnsw_idx;
drop function if exists public.hybrid_legal_search(text,extensions.vector,text,date,boolean,integer);

alter table public.legal_source_chunks add column if not exists embedding_model text;
update public.legal_source_chunks set embedding = null, embedding_model = null where embedding is not null or embedding_model is not null;
alter table public.legal_source_chunks alter column embedding type extensions.vector(384) using null::extensions.vector(384);

create index legal_source_chunks_embedding_hnsw_idx
  on public.legal_source_chunks using hnsw (embedding extensions.vector_ip_ops)
  where embedding is not null;

create or replace function public.hybrid_legal_search(
  p_query_text text,
  p_query_embedding extensions.vector(384) default null,
  p_legal_area text default null,
  p_as_of date default current_date,
  p_official_only boolean default true,
  p_limit integer default 8
)
returns table (
  chunk_id text, source_id text, source_title text, source_url text, source_article text,
  section text, content text, legal_area text, source_status text, verified_at timestamptz,
  lexical_score double precision, semantic_score double precision, combined_score double precision
)
language sql stable security invoker set search_path = public, extensions
as $$
with q as (
  select nullif(trim(p_query_text),'') as text,
         case when nullif(trim(p_query_text),'') is null then null else websearch_to_tsquery('simple', trim(p_query_text)) end as tsq
), candidates as (
  select c.*,s.title s_title,s.url s_url,s.article s_article,s.official,
    greatest(
      case when q.text is not null and (c.content ilike '%'||q.text||'%' or c.section ilike '%'||q.text||'%') then 1.0 else 0.0 end,
      case when q.tsq is null then 0.0 else least(1.0,(ts_rank_cd(c.fts,q.tsq)*5.0)::double precision) end
    ) lex,
    case when p_query_embedding is null or c.embedding is null or c.embedding_model<>'gte-small' then 0.0
         else greatest(0.0,least(1.0,((c.embedding <#> p_query_embedding)*-1.0)::double precision)) end sem
  from public.legal_source_chunks c join public.legal_sources s on s.id=c.source_id cross join q
  where q.text is not null
    and c.status in ('CURRENT','UPDATED') and s.status in ('CURRENT','UPDATED') and s.published=true
    and (not p_official_only or s.official=true)
    and (p_legal_area is null or c.legal_area=p_legal_area)
    and (coalesce(c.effective_from,s.effective_from) is null or coalesce(c.effective_from,s.effective_from)<=p_as_of)
    and (coalesce(c.effective_until,s.effective_until) is null or coalesce(c.effective_until,s.effective_until)>=p_as_of)
    and ((q.tsq is not null and c.fts@@q.tsq) or (q.text is not null and (c.content ilike '%'||q.text||'%' or c.section ilike '%'||q.text||'%')) or (p_query_embedding is not null and c.embedding is not null and c.embedding_model='gte-small'))
)
select id,source_id,s_title,s_url,s_article,section,content,legal_area,status,verified_at,lex,sem,
  case when p_query_embedding is null then lex*.95+.05 else lex*.42+sem*.53+.05 end
from candidates order by 13 desc,verified_at desc,id limit greatest(1,least(coalesce(p_limit,8),20));
$$;
grant execute on function public.hybrid_legal_search(text,extensions.vector,text,date,boolean,integer) to anon,authenticated;
