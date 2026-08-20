# LexiFrance Phase 3 Readiness - Deterministic Practice Lab

Phase 3 must start only after Phase 1 Cloud Foundation and Phase 2 Skill Graph are fully green.

## Existing foundations to reuse

- one local/cloud business state model with offline-first sync
- anonymous Supabase identity and permanent-account upgrade path
- CAS + idempotent state synchronization
- XP award ledger
- 20 registered legal skills
- idempotent `skill_evidence` pipeline
- Proven / Calibrated / Freshness skill model
- confidence calibration and confidently-wrong signals
- `practice_runs` table with ownership RLS
- deterministic legal content and official-source metadata
- Chromium, WebKit/iPhone, accessibility, PWA and security QA gates

## Phase 3 scope

Implement Practice Lab without generative AI first:

1. Issue Spotting
2. Missing Facts
3. Ordering / procedural sequence
4. Document Selection
5. Deadline Lab
6. Calculation Lab
7. Strategy Lab

Each task must define deterministic scoring, `skillsMeasured`, `skillWeights`, difficulty factors, stable IDs and exact review/remediation targets.

## Non-goals for Phase 3

Do not add Virtual Client, Drafting evaluator, Cold Case AI, Adversarial/Judge AI or free-form legal generation. Those remain dependent on later verified RAG and structured evaluation phases.

## Required entry/exit quality gates

- no change to Lesson Mastery semantics
- no XP/evidence farming
- offline completion + reconnect idempotency
- account-scoped practice state
- no real client/personal data
- source/currentness metadata for legally sensitive tasks
- Chromium + WebKit/iPhone + accessibility regression
- RLS/cross-user verification
- deterministic scoring fixtures for every Practice type
- Skill Graph explanation shows which Practice evidence changed a score

## Phase 4 dependency

Verified Legal Search/RAG begins only after deterministic Practice Lab is stable. Current deterministic Search remains authoritative and must not be removed.
