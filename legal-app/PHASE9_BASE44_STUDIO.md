# LexiFrance Legal Studio - Phase 9

Base44 app ID: `6a8a12f0f25c06459efc1f3b`.

The Studio is an internal editorial/control plane, not a dependency of the public LexiFrance runtime.

Models implemented:
- StudioContent
- LegalSource
- ContentClaim
- ImpactLink
- Rubric
- Evaluation
- PublicationReview
- User roles

Workflow:
`DRAFT -> AI_REVIEWED -> LEGAL_REVIEW -> APPROVED -> CURRENT`
with `UPDATED`, `PENDING_REVIEW`, and `OUTDATED` for legal-change lifecycle.

Roles: `user`, `reviewer`, `legal_editor`, `admin`.

Human legal approval is mandatory before verified legal content becomes CURRENT. Legal-source changes can be linked to affected lessons, quizzes, cases, practice tasks, drafting tasks, interview scenarios, cold cases and adversarial scenarios through ImpactLink.

The live Studio currently contains the verified source projection and impact examples for the professional-practice foundation. Private hidden facts and private evaluator answer banks stay in Supabase and are not mirrored into public/editorial content.
