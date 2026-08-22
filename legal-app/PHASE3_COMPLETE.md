# LexiFrance Phase 3 COMPLETE - Deterministic Practice Lab

Date: 2026-08-22
Runtime: 16
Practice content release: 2026.08.22.1
Branch: `lexifrance-next-phases3-9`

## Status

PHASE 3 COMPLETE.

Phase 3 adds a deterministic Practice Lab on top of the completed Cloud Foundation and Skill Graph. It does not replace LEARN, Quiz, SOLVE, Search or the existing deterministic legal-content model.

## Implemented Practice modes

14 verified fixtures, exactly two per mode:

1. Issue Spotting
2. Missing Facts Detection
3. Procedural Ordering
4. Document Selection
5. Deadline Lab
6. Calculation Lab
7. Strategy Lab

Every Practice task has:

- a stable task ID;
- FR jurisdiction and legal area;
- deterministic scoring;
- difficulty 1-10;
- `skillsMeasured` and normalized `skillWeights`;
- confidence calibration 1-5;
- exact lesson/subtopic remediation targets;
- current/updated legal status;
- official-source metadata;
- one-time XP award semantics;
- first-accepted-attempt Skill Evidence semantics.

No generative AI is used for Practice scoring.

## Deterministic scoring

The scoring engine is isolated in `js/practice-core.js` and is independent from UI code.

- Multi-selection: recall + precision based deterministic score.
- Ordering: pairwise-order correctness.
- Deadline/date: exact result with deterministic near-miss handling.
- Numeric calculation: exact/tolerance based deterministic result.

The content QA contains fixtures for every Practice mode and rejects invalid skill weights, missing official sources, invalid remediation targets or unsupported task schemas.

## Mastery isolation

Practice does NOT call or mutate:

- `openLessonProgress`;
- `answerQuestion`;
- Lesson `lessonProgress` Mastery rules.

The Lesson Mastery invariant remains unchanged:

- first allowed lesson open = 10%;
- each of 10 unique solved Quiz questions = +9%;
- maximum = 100%;
- next lesson unlock = 64%;
- Practice and SOLVE remain separate application evidence.

## XP anti-farming

Practice XP is keyed by the stable ledger key:

`practice:<taskId>`

A repeat is stored as practice history but cannot award the same task XP again.

## Skill Evidence anti-farming

Practice Skill Evidence uses:

- `source_type = practice`;
- stable `source_id = taskId`;
- skill ID;
- stable event ID for each run.

The live database additionally enforces a unique partial index for:

`(user_id, source_type, source_id, skill_id) WHERE source_type = 'practice'`

Therefore a second device cannot farm the same Practice task/skill by generating a new event ID.

The live `record_skill_evidence` function is SECURITY INVOKER and accepts `quiz`, `solve_stage` and `practice` evidence with validation for skill, area, difficulty, score, confidence and input weight.

## Explainability

Phase 3 now includes `Practice Evidence trail` in Profile after Skill Graph.

It reads only the current authenticated user's accepted `skill_evidence` rows through RLS and shows:

- Practice task;
- affected professional skill;
- legal area;
- raw score;
- difficulty;
- confidence;
- accepted evidence weight;
- accepted timestamp;
- explicit explanation that the record participates in Proven/Calibrated skill scoring.

The trail is account-scoped, cached per user and render-idempotent. It does not fetch cloud data in the normal localhost/local-only QA path.

## Cloud persistence

Practice runs use the existing `practice_runs` table with:

- ownership RLS;
- unique `(user_id, event_id)` idempotency;
- offline local queue;
- reconnect synchronization;
- hydration on the same cloud identity;
- local history merge without changing Lesson Mastery.

## Live backend gate - 2026-08-22

A transaction-scoped RLS/anti-farming verification was run against the live Supabase project using two temporary anonymous identities and then rolled back.

Verified results:

- user A can insert and read own Practice run: 1 row;
- first Practice Skill Evidence: `status = ok`;
- resulting Proven Score: 100 for the test fixture;
- resulting Freshness: 100;
- resulting Evidence Count: 1;
- second submission for the same Practice task + skill with a DIFFERENT event ID: `status = duplicate`;
- duplicate applied weight: 0;
- duplicate did not create another confidence record;
- database contains exactly one accepted row for that Practice task + skill;
- user B cross-read of user A Practice runs: 0 rows;
- user B cross-read of user A Practice Skill Evidence: 0 rows;
- user B forged cross-user Practice insert: blocked with SQLSTATE 42501.

After rollback/cleanup:

- `auth.users = 0`;
- `practice_runs = 0`;
- `skill_evidence = 0`;
- `confidence_events = 0`;
- `skill_mastery = 0`.

## Database integrity

Phase 3 migrations add Practice evidence support and tighten the stored effective evidence weight constraint to:

`weight > 0 AND weight <= 1.25`

This accommodates the intended maximum difficulty multiplier while preventing arbitrary high stored weights.

Supabase Security Advisor after the Phase 3 DDL shows no new Phase-3-specific RLS ownership defect. Anonymous-access warnings are expected by design because LexiFrance intentionally uses Supabase Anonymous Sign-In while ownership predicates remain `auth.uid()` scoped.

Supabase Performance Advisor reports only the informational unused `skill_mastery_skill_id_idx` on an empty/pre-production dataset. It is intentionally retained until production usage is available.

## Legal verification checkpoint

Legally sensitive deterministic fixtures were checked against current primary/official French sources before closure.

Examples:

- Code de la construction et de l'habitation, Article L271-1: non-professional residential-property buyer has a ten-day withdrawal period starting the day after the first presentation / qualifying direct delivery of the notified act. The current article remains in force in 2026.
- Current OQTF procedural teaching separates departure deadline from judicial filing deadline and distinguishes general procedure from assignation/rétention accelerated procedures.
- TVA fixtures distinguish general franchise-en-base thresholds from profession-specific rules and explicitly treat provided rates/amounts as exercise facts when appropriate.
- Residential deposit exercises distinguish the deposit from the final rent and require evidence/justification for deductions.

Practice content is educational and deliberately avoids pretending that a deterministic exercise replaces case-specific professional legal advice.

## QA gates encoded in repository

The Phase 3 release gate now includes:

- JavaScript syntax checks;
- module import/export integrity;
- core LexiFrance integrity;
- Cloud Foundation integrity;
- Skill Graph integrity;
- deterministic Practice schema/scoring integrity;
- Quiz editorial integrity;
- SOLVE 2.0 integrity;
- deterministic Search Top-1/Top-3 checks;
- PWA asset integrity;
- Service Worker fallback checks;
- legacy-code checks;
- Chromium/iPhone-size Practice E2E;
- Practice XP/evidence retry anti-farming E2E;
- Practice offline boot E2E;
- WCAG Practice list/modal light + dark regression;
- WebKit/iPhone Practice + portrait guard regression;
- live Supabase anonymous auth, Practice persistence, RLS, evidence explainability and server anti-farming gate.

## Offline/PWA

Runtime v16 caches the Practice scoring/state/evidence/cloud/explainability modules and Practice content.

The legal content cache remains Network First with verified-cache fallback. Practice is not allowed to break app startup when cloud is unavailable.

## Exit decision

All Phase 3 functional requirements are implemented and the live database security/idempotency invariants were independently re-verified before this checkpoint.

Phase 4 may begin only from this Phase 3 checkpoint and must preserve the deterministic Search and Practice fallback paths.
