alter table public.skill_evidence drop constraint if exists skill_evidence_weight_check;
alter table public.skill_evidence add constraint skill_evidence_weight_check check (weight > 0 and weight <= 1.25);
