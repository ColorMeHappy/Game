# Private professional content boundary

The public repository intentionally does not contain:
- Virtual Client hidden fact values or response bank;
- evaluator answer aliases / negative-pattern answer keys;
- private drafting rubrics used for legal scoring;
- adversarial answer-key details that would reveal the expected response.

These are stored server-side in Supabase tables with browser grants revoked. Edge Functions read them with server privileges only after authenticating the user and validating ownership of the user-owned run/attempt.

Public GitHub contains only the client runtime, generic evaluator mechanics, schema contract, QA, and non-secret legal source registry metadata. This prevents users from solving Cold Case or Client Interview by inspecting the frontend bundle or repository.
