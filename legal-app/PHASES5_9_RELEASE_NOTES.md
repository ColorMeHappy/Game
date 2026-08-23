# LexiFrance Phases 5-9 release candidate

This branch contains the Phase 5-9 professional-practice foundation.

- Phase 5: Virtual Client with server-only hidden facts, semantic question matching, confidence calibration and Skill Evidence.
- Phase 6: Drafting Lab with autosave, deterministic provisional rubric and verified final evaluation.
- Phase 7: Cold Case + structured source-validated evaluator. No answer/rubric is returned before Submit.
- Phase 8: Legal Sparring / Administration / Judge with pre-verified challenges and source validation.
- Phase 9: Base44 LexiFrance Legal Studio foundation with content workflow, claim-level sourcing and impact analysis. Base44 is not a runtime dependency of the public app.

Private training answers, hidden facts, private rubrics and evaluator aliases are intentionally not committed to this public repository. They are server-side content and must be imported through the controlled legal-content pipeline with human legal approval.

Release gates: static integrity, Chromium mobile, WebKit/iPhone, WCAG, offline fallback, live anonymous Auth, RLS cross-user isolation, prompt-injection protection, fail-closed source validation, Skill Evidence idempotency, and Supabase advisors.
