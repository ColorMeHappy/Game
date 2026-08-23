# Professional security boundaries

- Browser contains publishable Supabase key only; never service role.
- Hidden facts, private rubrics, evaluator aliases and adversarial answer banks are server-side only.
- User-owned run/attempt tables use authenticated ownership RLS.
- Edge Functions authenticate JWT before any professional operation.
- Server-only reads of private training content happen only after user authentication.
- User input is data, never system policy; Virtual Client rejects meta prompts requesting hidden facts/system/database content.
- Verified evaluators fail closed when official source status/effective dates are invalid.
- Structured evaluation is validated before Skill Evidence is recorded.
- Repeated professional tasks cannot farm Skill Evidence because uniqueness is keyed by user + source type + source id + skill.
- Temporary embedding endpoints are retired after backfill.
