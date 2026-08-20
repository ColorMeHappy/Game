# LexiFrance Supabase Cloud Foundation

Project ref: `nnexhmzebviispxkpclx`
Region: `eu-west-3`

## Applied migrations

1. `20260819181508_lexifrance_cloud_foundation`
2. `20260819182309_lexifrance_cloud_security_hardening`
3. `20260819183813_lexifrance_skill_fk_indexes`
4. `20260820153000_lexifrance_skill_evidence_aggregator`
5. `20260820154735_lexifrance_skill_confidence_aggregation_fix`

The authoritative SQL is tracked by Supabase migration history. Do not bypass migrations with ad-hoc production DDL.

## Phase 1 state model

`public.user_state` is the cloud snapshot source of truth for the current LexiFrance state model. Existing localStorage state remains the offline/optimistic representation of the same business state.

Writes use `public.save_user_state(...)` with:

- authenticated `auth.uid()` ownership
- expected `state_version` compare-and-swap
- `event_id` idempotency through `sync_receipts`
- explicit `ok`, `duplicate`, or `conflict` result
- no service-role credential in the browser

Runtime v12 adds an idempotent XP award ledger. Legacy XP is preserved as a baseline while new lesson/case awards use stable keys. When two devices earn different awards offline, cloud conflict merge unions those award keys instead of using `max(xp)` and losing one device's earned XP.

## Phase 2 Skill Evidence foundation

`public.record_skill_evidence(...)` is a `SECURITY INVOKER` RPC available only to authenticated users.

It validates:

- active skill ID
- area/source metadata
- difficulty 1-10
- score 0-100
- optional confidence 1-5
- positive weight

Evidence is idempotent on `(user_id, event_id, skill_id)`.

Current deterministic client mapping converts existing Quiz cognitive levels and SOLVE stage categories into the 20 registered legal skills. Quiz evidence is accepted from the first attempt only so repeating the same question cannot inflate evidence count. SOLVE stage evidence is emitted only after a stage is finalized.

The aggregator keeps separate concepts:

- `proven_score` - result weighted by task/skill weight and difficulty
- `confidence_adjusted_score` - the same evidence with extra weight for confidently-wrong answers and reduced weight for high-score/low-confidence answers
- `freshness_score` - recency indicator that does not erase permanent proven competence
- `evidence_count` - count of unique accepted evidence rows

A confidently-wrong result therefore lowers calibrated competence more strongly without rewriting the underlying proven score.

## RLS

All user-owned public tables have RLS enabled. Ownership uses `auth.uid()` against the row owner. Update policies include both `USING` and `WITH CHECK`. Child case records also verify ownership of their parent `case_runs` row.

Authorization roles for future reviewer/editor/admin flows live outside editable user metadata in `private.user_roles`.

## Authentication

Frontend is prepared for soft authentication:

Guest/local -> anonymous Supabase user -> permanent account.

Anonymous users use Supabase's `authenticated` PostgreSQL role and remain isolated through `auth.uid()` RLS.

Live browser Auth QA must still prove the complete fresh-browser anonymous -> cloud -> offline/reconnect -> permanent-account sequence before Phase 1 is considered fully closed.

## Offline sync

The browser writes local progress first. A compact state sync queue stores:

- `eventId`
- `entityType`
- `entityId`
- `operation`
- `payload`
- `createdAt`
- `syncStatus`

Skill evidence has a separate bounded offline queue. Reconnect flushes state through the CAS RPC and evidence through `record_skill_evidence(...)`. Both use stable event IDs for retry safety.

## Security gate

Supabase Security Advisor returned no findings after the Phase 2 evidence migrations. The frontend uses only a publishable key.
