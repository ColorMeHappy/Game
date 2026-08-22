import fs from'node:fs';
const root='legal-app/supabase/migrations',fail=[];const bad=m=>{fail.push(m);console.error('FAIL',m)},ok=m=>console.log('PASS',m);const read=name=>fs.readFileSync(`${root}/${name}`,'utf8');
const expected=[
  '20260820184750_lexifrance_skill_evidence_integrity_hardening.sql',
  '20260820213759_lexifrance_confidence_event_projection.sql',
  '20260821222109_lexifrance_phase3_practice_evidence.sql',
  '20260822071328_lexifrance_phase3_practice_weight_bound.sql',
  '20260822071335_lexifrance_phase3_practice_weight_bound_tighten.sql'
];
for(const name of expected){if(!fs.existsSync(`${root}/${name}`))bad(`missing migration ${name}`);else ok(`migration present ${name}`)}
const practice=read('20260821222109_lexifrance_phase3_practice_evidence.sql');
if(!practice.includes("where source_type = 'practice'"))bad('Practice unique partial index predicate');else ok('Practice unique partial index');
if(!practice.includes("('quiz','solve_stage','practice')"))bad('record_skill_evidence Practice source type');else ok('Practice source accepted');
if(!/security\s+invoker/i.test(practice))bad('record_skill_evidence SECURITY INVOKER');else ok('SECURITY INVOKER');
if(!practice.includes('auth.uid()'))bad('record_skill_evidence auth ownership');else ok('auth.uid ownership');
if(!practice.includes("p_weight <= 0 or p_weight > 1"))bad('input weight validation');else ok('input weight <= 1');
const finalBound=read('20260822071335_lexifrance_phase3_practice_weight_bound_tighten.sql');
if(!finalBound.includes('weight > 0 and weight <= 1.25'))bad('final stored evidence weight bound');else ok('stored evidence weight <= 1.25');
const readme=fs.readFileSync('legal-app/supabase/README.md','utf8');for(const name of expected.slice(2).map(x=>x.replace(/\.sql$/,'')))if(!readme.includes(name.split('_').slice(0).join('_')))bad(`README migration history missing ${name}`);
if(fail.length){console.error(`SUPABASE MIGRATION QA FAILED ${fail.length}`);process.exit(1)}console.log('SUPABASE MIGRATION QA PASSED');
