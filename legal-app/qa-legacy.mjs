import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('legal-app');
const failures=[];
const fail=m=>failures.push(m);
const lessonDir=path.join(root,'content/lessons');
for(const name of fs.readdirSync(lessonDir).filter(x=>x.endsWith('.json'))){
  const data=JSON.parse(fs.readFileSync(path.join(lessonDir,name),'utf8'));
  if(Object.prototype.hasOwnProperty.call(data,'quiz'))fail(`${name}: legacy embedded quiz field remains`);
}
const state=fs.readFileSync(path.join(root,'js/state.js'),'utf8');
const caseJs=fs.readFileSync(path.join(root,'js/case.js'),'utf8');
const lessonJs=fs.readFileSync(path.join(root,'js/lesson.js'),'utf8');
if(/75\s*\)?\s*;/.test(state)&&/mastery/i.test(state))fail('Possible legacy 75% case-to-mastery logic remains');
if(/caseResult\s*\(/.test(state))fail('Legacy caseResult API remains');
if(/quizResult\s*\(/.test(state))fail('Legacy quizResult API remains');
if(/\b(?:l|lesson)\.quiz\b/.test(lessonJs))fail('lesson runtime still references embedded lesson.quiz');
if(!/quizPack/.test(lessonJs))fail('lesson runtime does not use separate quiz pack');
if(/mastery\s*\(/.test(caseJs)&&!/lessonMastery/.test(caseJs))fail('Case runtime may directly mutate lesson mastery');
console.log(JSON.stringify({legacyFailures:failures},null,2));
if(failures.length){for(const x of failures)console.error(`::error file=legal-app/qa-legacy.mjs::${x}`);process.exit(1)}
console.log('LexiFrance legacy cleanup QA PASSED');
