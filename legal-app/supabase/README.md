# LexiFrance Supabase Cloud Foundation

Project ref: `nnexhmzebviispxkpclx`
Region: `eu-west-3`

## Applied migrations

1. `20260819181508_lexifrance_cloud_foundation`
2. `20260819182309_lexifrance_cloud_security_hardening`
3. `20260819183813_lexifrance_skill_fk_indexes`

The authoritative SQL is tracked by Supabase migration history. Do not bypass migrations with ad-hoc production DDL.

## Phase 1 state model

`public.user_state` is the cloud snapshot source of truth for the current LexiFrance state model. Existing localStorage state remains the offline/optimistic representation of the same business state.

Writes use `public.save_user_state(...)` with:

- authenticated `auth.uid()` ownership
- expected `state_version` compare-and-swap
- `event_id` idempotency through `sync_receipts`
- explicit `ok`, `duplicate`, or `conflict` result
- no service-role credential in the browser

## RLS

All user-owned public tables have RLS enabled. Ownership uses `auth.uid()` against the row owner. Update policies include both `USING` and `WITH CHECK`. Child case records also verify ownership of their parent `case_runs` row.

Authorization roles for future reviewer/editor/admin flows live outside editable user metadata in `private.user_roles`.

## Authentication

Frontend is prepared for soft authentication:

Guest/local -> anonymous Supabase user -> permanent account.

Anonymous users use Supabase's `authenticated` PostgreSQL role and remain isolated through `auth.uid()` RLS.

Current deployment gate: the Supabase project must have Anonymous Sign-Ins enabled before Phase 1 can be promoted to production. Live Auth QA must be rerun after that setting is enabled.

## Offline sync

The browser writes local progress first. A compact sync queue stores:

- `eventId`
- `entityType`
- `entityId`
- `operation`
- `payload`
- `createdAt`
- `syncStatus`

Reconnect flushes through the CAS RPC. A conflict merges the two state snapshots and retries with a fresh event id.

## Security gate

Supabase Security Advisor currently returns no findings after the Phase 1 hardening migration. The frontend uses only a publishable key.
