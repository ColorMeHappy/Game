# LexiFrance - Phase 1 + Phase 2 completion checkpoint

Date: 2026-08-22
Branch: `lexifrance-next-phase2-foundation`

## Phase 1 - Cloud Foundation

Status: COMPLETE.

Verified foundations:
- local-first app boot independent of Supabase availability
- anonymous Supabase identity is enabled and works as the cloud guest identity
- local -> cloud migration through `user_state`
- CAS/state-version conflict handling in `save_user_state`
- idempotent sync receipts and replay protection
- XP ledger merge prevents multi-device XP farming
- offline queue + reconnect synchronization
- account upgrade path keeps the same user owner when email is attached
- ownership RLS on user-owned tables
- production client contains only the publishable Supabase key, never service-role credentials
- normal localhost/CI execution is local-only; live cloud auth is opt-in with `?cloud=live`

## Phase 2 - Skill Graph

Status: COMPLETE.

Verified foundations:
- 20 registered professional legal skills
- Quiz first-attempt -> Skill Evidence
- SOLVE finalized stage -> Skill Evidence
- stable event IDs and duplicate protection
- Proven Score, confidence-adjusted score and Freshness are separate signals
- confidence calibration on difficult Quiz and Applied/Expert SOLVE
- confidently-wrong signal without changing Lesson Mastery
- account-scoped local Skill cache
- server-side confidence projection only from accepted Skill Evidence
- Skill Graph explanations in Profile

## Backend integrity checkpoint

Live Supabase audit before Phase 3:
- QA anonymous users/sessions removed after verification
- `auth.users = 0`, `profiles = 0`, `user_state = 0`, `sync_receipts = 0`, `private.user_roles = 0` after cleanup
- Security Advisor has no RLS ownership defect. Its anonymous-policy warnings are expected because LexiFrance intentionally uses Supabase Anonymous Sign-In and anonymous users use the `authenticated` database role while still being restricted by `auth.uid()` ownership predicates.
- Leaked-password warning is not used as an authorization bypass; the current permanent-account flow is email verification / magic-link based.
- Performance Advisor reports only an informational unused Skill Mastery index; it is retained because the dataset has not yet accumulated production usage.

## Invariants carried into Phase 3

- Lesson Mastery semantics stay unchanged: 10% open + 9% per unique solved question, maximum 100%.
- SOLVE and Practice never directly mutate Lesson Mastery.
- deterministic core works offline.
- no duplicate XP or Skill Evidence farming.
- verified legal-source metadata remains mandatory for legal practice content.
- portrait-only iPhone behavior, PWA/offline, accessibility and WebKit regression remain release gates.

Phase 3 may now start.
