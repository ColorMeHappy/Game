create or replace function public.record_skill_evidence(
  p_event_id uuid,
  p_skill_id text,
  p_area text,
  p_source_type text,
  p_source_id text,
  p_difficulty smallint,
  p_raw_score numeric,
  p_confidence smallint default null,
  p_weight numeric default 1,
  p_content_release text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_base_weight numeric;
  v_proven numeric;
  v_confidence_adjusted numeric;
  v_freshness numeric;
  v_count integer;
  v_inserted integer := 0;
  v_source_seen integer := 0;
  v_repeat_factor numeric := 1;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_event_id is null then raise exception 'EVENT_ID_REQUIRED'; end if;
  if not exists (select 1 from public.skill_definitions where id = p_skill_id and active) then raise exception 'UNKNOWN_SKILL'; end if;
  if coalesce(trim(p_area),'') not in ('Corporate','Tax','Immigration','Real Estate','General') then raise exception 'INVALID_AREA'; end if;
  if coalesce(trim(p_source_type),'') not in ('quiz','solve_stage') then raise exception 'INVALID_SOURCE_TYPE'; end if;
  if coalesce(trim(p_source_id),'') = '' then raise exception 'SOURCE_REQUIRED'; end if;
  if p_difficulty < 1 or p_difficulty > 10 then raise exception 'INVALID_DIFFICULTY'; end if;
  if p_raw_score < 0 or p_raw_score > 100 then raise exception 'INVALID_SCORE'; end if;
  if p_confidence is not null and (p_confidence < 1 or p_confidence > 5) then raise exception 'INVALID_CONFIDENCE'; end if;
  if p_weight <= 0 or p_weight > 1 then raise exception 'INVALID_WEIGHT'; end if;

  if p_source_type = 'solve_stage' then
    select count(*)::integer into v_source_seen
    from public.skill_evidence
    where user_id = v_user_id
      and source_type = 'solve_stage'
      and source_id = trim(p_source_id)
      and skill_id = p_skill_id;
    v_repeat_factor := case
      when v_source_seen = 0 then 1
      when v_source_seen = 1 then 0.60
      when v_source_seen = 2 then 0.35
      else 0.20
    end;
  end if;

  v_base_weight := p_weight * (0.75 + (p_difficulty::numeric * 0.05)) * v_repeat_factor;

  insert into public.skill_evidence(
    event_id,user_id,skill_id,area,source_type,source_id,difficulty,
    raw_score,confidence,weight,effective_score,content_release
  ) values (
    p_event_id,v_user_id,p_skill_id,trim(p_area),trim(p_source_type),trim(p_source_id),p_difficulty,
    p_raw_score,p_confidence,v_base_weight,p_raw_score,p_content_release
  )
  on conflict do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 1 and p_confidence is not null then
    insert into public.confidence_events(event_id,user_id,source_type,source_id,correct,confidence)
    values (p_event_id,v_user_id,trim(p_source_type),trim(p_source_id),p_raw_score >= 50,p_confidence)
    on conflict (user_id,event_id) do nothing;
  end if;

  select
    coalesce(round(sum(raw_score * weight) / nullif(sum(weight),0),2),0),
    coalesce(round(
      sum(raw_score * weight * case
        when confidence is null then 1
        when raw_score < 50 and confidence >= 4 then 1.50
        when raw_score < 50 and confidence = 3 then 1.20
        when raw_score >= 80 and confidence <= 2 then 0.85
        else 1
      end)
      / nullif(sum(weight * case
        when confidence is null then 1
        when raw_score < 50 and confidence >= 4 then 1.50
        when raw_score < 50 and confidence = 3 then 1.20
        when raw_score >= 80 and confidence <= 2 then 0.85
        else 1
      end),0),2),0),
    count(*)::integer,
    case
      when max(created_at) >= now() - interval '7 days' then 100
      when max(created_at) >= now() - interval '30 days' then 85
      when max(created_at) >= now() - interval '90 days' then 65
      when max(created_at) >= now() - interval '180 days' then 45
      else 25
    end::numeric
  into v_proven,v_confidence_adjusted,v_count,v_freshness
  from public.skill_evidence
  where user_id=v_user_id and skill_id=p_skill_id and area=trim(p_area);

  insert into public.skill_mastery(
    user_id,skill_id,area,score,proven_score,freshness_score,evidence_count,confidence_adjusted_score,updated_at
  ) values (
    v_user_id,p_skill_id,trim(p_area),v_confidence_adjusted,v_proven,v_freshness,v_count,v_confidence_adjusted,now()
  )
  on conflict (user_id,skill_id,area) do update set
    score=excluded.score,
    proven_score=excluded.proven_score,
    freshness_score=excluded.freshness_score,
    evidence_count=excluded.evidence_count,
    confidence_adjusted_score=excluded.confidence_adjusted_score,
    updated_at=excluded.updated_at;

  return jsonb_build_object(
    'status', case when v_inserted=1 then 'ok' else 'duplicate' end,
    'skillId', p_skill_id,
    'area', trim(p_area),
    'score', v_confidence_adjusted,
    'provenScore', v_proven,
    'freshnessScore', v_freshness,
    'evidenceCount', v_count,
    'repeatFactor', v_repeat_factor,
    'appliedWeight', case when v_inserted=1 then v_base_weight else 0 end,
    'confidenceRecorded', (v_inserted=1 and p_confidence is not null)
  );
end;
$$;
