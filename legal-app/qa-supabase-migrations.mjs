import fs from'node:fs';
const root='legal-app/supabase/migrations',fail=[];const bad=m=>{fail.push(m);console.error('FAIL',m)},ok=m=>console.log('PASS',m);const read=name=>fs.readFileSync(`${root}/${name}`,'utf8');
const expected=[
  '20260820184750_lexifrance_skill_evidence_integrity_hardening.sql',
  '20260820213759_lexifrance_confidence_event_projection.sql',
  '20260821222109_lexifrance_phase3_practice_evidence.sql',
  '20260822071328_lexifrance_phase3_practice_weight_bound.sql',
  '20260822071335_lexifrance_phase3_practice_weight_bound_tighten.sql',
  '20260822220600_lexifrance_phase4_verified_legal_rag.sql',
  '20260822220700_lexifrance_phase4_verified_legal_seed.sql',
  '20260822220800_lexifrance_phase4_gte_semantic_search.sql',
  '20260822220900_lexifrance_phase4_pg_net_support.sql',
  '20260822221000_lexifrance_phase4_legal_registry_read_only.sql'
];
for(const name of expected){if(!fs.existsSync(`${root}/${name}`))bad(`missing migration ${name}`);else ok(`migration present ${name}`)}
const practice=read('20260821222109_lexifrance_phase3_practice_evidence.sql');
if(!practice.includes("where source_type = 'practice'"))bad('Practice unique partial index predicate');else ok('Practice unique partial index');
if(!practice.includes("('quiz','solve_stage','practice')"))bad('record_skill_evidence Practice source type');else ok('Practice source accepted');
if(!/security\s+invoker/i.test(practice))bad('record_skill_evidence SECURITY INVOKER');else ok('SECURITY INVOKER');
if(!practice.includes('auth.uid()'))bad('record_skill_evidence auth ownership');else ok('auth.uid ownership');
if(!practice.includes("p_weight <= 0 or p_weight > 1"))bad('input weight validation');else ok('input weight <= 1');
const finalBound=read('20260822071335_lexifrance_phase3_practice_weight_bound_tighten.sql');if(!finalBound.includes('weight > 0 and weight <= 1.25'))bad('final stored evidence weight bound');else ok('stored evidence weight <= 1.25');
const rag=read('20260822220600_lexifrance_phase4_verified_legal_rag.sql'),gte=read('20260822220800_lexifrance_phase4_gte_semantic_search.sql'),readOnly=read('20260822221000_lexifrance_phase4_legal_registry_read_only.sql');
if(!rag.includes('legal_sources')||!rag.includes('legal_source_chunks')||!/security\s+invoker/i.test(rag))bad('Phase 4 registry/RPC migration');else ok('Phase 4 registry/RPC migration');
if(!gte.includes('vector(384)')||!gte.includes("embedding_model='gte-small'"))bad('Phase 4 canonical embedding model');else ok('Phase 4 gte-small 384d');
if(!readOnly.includes('revoke insert, update, delete')||!readOnly.includes('grant select'))bad('Phase 4 read-only browser grants');else ok('Phase 4 registry read-only grants');
if(fail.length){console.error(`SUPABASE MIGRATION QA FAILED ${fail.length}`);process.exit(1)}console.log('SUPABASE MIGRATION QA PASSED');
