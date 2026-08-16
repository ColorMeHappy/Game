import fs from'node:fs';
const r='legal-app',fail=[];const bad=(m,file='legal-app')=>{fail.push(m);console.error(`::error file=${file}::${m}`)};
for(const p of['content/cases/index-1.json',...Array.from({length:11},(_,i)=>`content/cases/case${i+1}.json`)])if(fs.existsSync(`${r}/${p}`))bad(`legacy file ${p}`,`legal-app/${p}`);
const caseJs=fs.readFileSync(`${r}/js/case.js`,'utf8'),state=fs.readFileSync(`${r}/js/state.js`,'utf8'),pages=fs.readFileSync(`${r}/js/pages.js`,'utf8');
for(const m of['beginCaseRun','recordCaseAnswer','finishCaseRun','c.mode===','data-step-option','finishSingle'])if(caseJs.includes(m))bad(`legacy Case v1 marker ${m}`,'legal-app/js/case.js');
if(state.includes('caseHistory:{'))bad('active Case v1 history in default state','legal-app/js/state.js');
const migrationMatch=state.match(/export function migrateSolveV2\(\)\{[\s\S]*?\}\nfunction studyDay/);if(!migrationMatch)bad('migrateSolveV2 migration missing','legal-app/js/state.js');const stateWithoutMigration=migrationMatch?state.replace(migrationMatch[0],'function studyDay'):state;if(stateWithoutMigration.includes('state.caseHistory'))bad('Case v1 state used outside migration','legal-app/js/state.js');
if(!state.includes('legacyCaseHistory'))bad('legacy case history migration missing','legal-app/js/state.js');
if(pages.includes("['Applied','Применяете'")||pages.includes('Mastery Applied'))bad('legacy Applied mastery wording','legal-app/js/pages.js');
if(pages.includes('>=37')||pages.includes('<37'))bad('37 unlock remains','legal-app/js/pages.js');
for(const f of fs.readdirSync(`${r}/content/lessons`).filter(x=>x.endsWith('.json'))){const l=JSON.parse(fs.readFileSync(`${r}/content/lessons/${f}`,'utf8'));if(Array.isArray(l.quiz))bad(`${f}: embedded legacy quiz`,`legal-app/content/lessons/${f}`)}
if(fail.length){console.error(`LEGACY QA FAILED ${fail.length}`);process.exit(1)}console.log('LEGACY QA PASSED');