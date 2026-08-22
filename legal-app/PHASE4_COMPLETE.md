# LexiFrance Phase 4 COMPLETE - Verified Legal Search / RAG

Date: 2026-08-22
Runtime: 17
Branch: `lexifrance-next-phases3-9`

## Status

PHASE 4 COMPLETE.

The existing deterministic Search remains authoritative and works offline. Phase 4 adds a verified official-source retrieval layer; it does not replace local Search.

## Backend

Supabase now contains:

- `public.legal_sources`
- `public.legal_source_chunks`
- pgvector
- full-text search index
- HNSW vector index
- `public.hybrid_legal_search(...)` as `SECURITY INVOKER`
- CURRENT / UPDATED filtering
- official/published filtering
- effective-from/effective-until filtering
- legal-area filtering

Browser roles have explicit SELECT-only privileges on the legal registry. INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES and TRIGGER are revoked for `anon` and `authenticated`.

## Semantic search

Canonical embedding model: Supabase Edge Runtime `gte-small`.

- vector dimensions: 384
- normalized embeddings
- inner-product HNSW search
- 20/20 initial verified chunks embedded
- authenticated Edge Function `lexifrance-legal-search`
- query embedding and document embedding use the same model

A temporary backfill endpoint was used only to populate the initial registry and was immediately retired. The deployed `lexifrance-legal-embed` function now requires JWT and returns 410; future embedding updates belong to the controlled Legal Studio publishing pipeline.

## Verified source seed

Initial registry: 12 official sources and 20 claim-level chunks covering the four existing areas:

- Corporate
- Tax
- Immigration
- Real Estate

Sources include Légifrance, Service-Public / Entreprendre.Service-Public, impots.gouv.fr and BOFiP. Time-sensitive chunks carry effective dates and verification dates.

## Live semantic proof

A real `gte-small` query embedding for `OQTF notification rétention délai` was generated in the Edge Runtime and passed to the live `hybrid_legal_search` RPC.

The top results were CURRENT CESEDA chunks, including:

- critical procedural facts;
- administrative detention;
- assignation à résidence;
- general appeal deadline.

Semantic scores were approximately 0.83-0.90, proving that the pgvector path is populated and active rather than a schema-only placeholder.

## Safety / hallucination boundary

Phase 4 does not generate substantive French law.

Retrieval returns only registry chunks satisfying:

- status CURRENT or UPDATED;
- official source requirement;
- published source requirement;
- effective date for the requested date;
- selected legal area when provided.

If semantic cloud retrieval is unavailable, LexiFrance falls back to verified lexical retrieval. If the whole cloud layer is unavailable, the original deterministic Search remains operational.

## Security QA

Live tests confirmed:

- current test chunk: returned;
- OUTDATED test chunk: excluded;
- expired effective-date test chunk: excluded;
- RPC is SECURITY INVOKER;
- anon/authenticated legal registry write privileges: explicitly false;
- temporary QA rows removed;
- final live registry: 12 sources / 20 chunks / 20 gte-small embeddings.

The Supabase Security Advisor reports only the existing Anonymous Sign-In warnings plus leaked-password-protection configuration; no Phase-4-specific write/RLS defect remains.

## Runtime / PWA

Runtime v17 adds `js/legal-search.js` to the offline shell.

Search UI now shows a separate Verified Sources section while keeping deterministic results above it. On localhost QA, remote retrieval is disabled unless explicitly requested, so ordinary regression tests remain deterministic and do not create cloud traffic.

## QA gates

Repository QA now includes:

- `qa-rag.mjs`
- `qa-rag-browser.mjs`
- Supabase migration reproducibility checks
- original deterministic Search Top-1/Top-3 QA
- PWA / Service Worker QA
- Chromium mobile regression

## Exit decision

Phase 4 is complete. Phase 5 Virtual Client may build only on this verified registry and must never allow the model to invent substantive dossier facts or unverified legal rules.
