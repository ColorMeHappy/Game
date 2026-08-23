# Phase 5-8 server state

Live Supabase professional foundation at release-candidate time:

- 2 Virtual Client scenarios / 20 hidden facts / 20 embeddings.
- 4 Drafting Lab tasks with private rubrics.
- 2 Cold Case tasks / 32 evaluator concepts / 32 embeddings.
- 3 Adversarial/Judge scenarios / 9 verified challenges / 9 embeddings.
- Edge Functions: `lexifrance-virtual-client`, `lexifrance-drafting`, `lexifrance-evaluator`, `lexifrance-adversarial` with JWT verification enabled.
- Temporary embedding backfill endpoints are retired with HTTP 410 and still require JWT.
- Private fact/rubric/evaluator/challenge tables have browser grants revoked.
- User attempts are ownership-controlled by RLS.
- Skill Evidence uses server-side source-type/id/skill uniqueness to prevent repeated evidence farming.
- Legal evaluation validates CURRENT/UPDATED official effective sources before returning trusted scores.
