revoke insert, update, delete, truncate, references, trigger on public.legal_sources from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.legal_source_chunks from anon, authenticated;
grant select on public.legal_sources, public.legal_source_chunks to anon, authenticated;
