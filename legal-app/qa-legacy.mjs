import fs from'node:fs';
const r='legal-app',fail=[];const bad=m=>{fail.push(m);console.error('FAIL',m)};
for(const p of['content/cases/index-1.json',...Array.from({length:11},(_,i)=>`content/cases/case${i+1}.json`)])if(fs.existsSync(`${r}/${p}`))bad(`legacy file ${p}`);
const caseJs=fs.readFileSync(`${r}/js/case.js`,'utf8'),state=fs.readFileSync(`${r}/js/state.js`,'utf8'),pages=fs.readFileSync(`${r}/js/pages.js`,'utf8');
for(const m of['beginCaseRun','recordCaseAnswer','finishCaseRun','c.mode===','data-step-option','finishSingle'])if(caseJs.includes(m))bad(`legacy Case v1 marker ${m}`);
if(state.includes('caseHistory:{'))bad('active Case v1 history in default state');
const uses=[...state.matchAll(/state\.caseHistory/g)].length;if(uses>2)bad(`unexpected active caseHistory references: ${uses}`);
if(!state.includes('legacyCaseHistory'))bad('legacy case history migration missing');
if(pages.includes("['Applied','Применяете'")||pages.includes('Mastery Applied'))bad('legacy Applied mastery wording');
if(pages.includes('>=37')||pages.includes('<37'))bad('37 unlock remains');
for(const f of fs.readdirSync(`${r}/content/lessons`).filter(x=>x.endsWith('.json'))){const l=JSON.parse(fs.readFileSync(`${r}/content/lessons/${f}`,'utf8'));if(Array.isArray(l.quiz))bad(`${f}: embedded legacy quiz`)}
if(fail.length){console.error(`LEGACY QA FAILED ${fail.length}`);process.exit(1)}console.log('LEGACY QA PASSED');