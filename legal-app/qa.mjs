import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('legal-app');
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const exists=(p)=>fs.existsSync(path.join(root,p));
const errors=[];
const ok=(cond,msg)=>{if(!cond)errors.push(msg)};

const index=read('content/app-index.json');
const lessonIds=index.paths.flatMap(p=>p.lessonIds);
const expectedCounts={Corporate:5,Tax:4,Immigration:6,'Real Estate':5};
ok(lessonIds.length===20,`Expected 20 lessons, got ${lessonIds.length}`);
ok(new Set(lessonIds).size===lessonIds.length,'Lesson IDs are not unique');
for(const p of index.paths)ok(p.lessonIds.length===expectedCounts[p.id],`${p.id}: expected ${expectedCounts[p.id]} lessons, got ${p.lessonIds.length}`);

const allQuestionIds=new Set();
let questionCount=0;
let microCount=0;
for(const id of lessonIds){
  ok(exists(`content/lessons/${id}.json`),`${id}: lesson file missing`);
  ok(exists(`content/quizzes/${id}.json`),`${id}: quiz file missing`);
  if(!exists(`content/lessons/${id}.json`)||!exists(`content/quizzes/${id}.json`))continue;
  const lesson=read(`content/lessons/${id}.json`);
  const quiz=read(`content/quizzes/${id}.json`);
  ok(lesson.id===id,`${id}: lesson.id mismatch`);
  ok(quiz.lessonId===id,`${id}: quiz.lessonId mismatch`);
  ok(['CURRENT','UPDATED','PENDING_REVIEW','OUTDATED','ARCHIVED'].includes(lesson.status),`${id}: invalid status ${lesson.status}`);
  ok(typeof lesson.contentVersion==='string'&&lesson.contentVersion.length>0,`${id}: missing contentVersion`);
  ok(typeof lesson.verifiedAt==='string'&&lesson.verifiedAt.length>=10,`${id}: missing verifiedAt`);
  ok(Array.isArray(lesson.subtopics)&&lesson.subtopics.length>=1,`${id}: no subtopics`);
  const targets=new Set((lesson.subtopics||[]).map((_,i)=>`${id}-subtopic-${i+1}`));
  ok(Array.isArray(quiz.questions)&&quiz.questions.length===10,`${id}: expected exactly 10 questions`);
  const qtexts=new Set();
  (quiz.questions||[]).forEach((q,i)=>{
    questionCount++;
    const expectedId=`${id}-q${String(i+1).padStart(2,'0')}`;
    ok(q.id===expectedId,`${id}: question ${i+1} id must be ${expectedId}, got ${q.id}`);
    ok(!allQuestionIds.has(q.id),`${id}: duplicate global question id ${q.id}`);
    allQuestionIds.add(q.id);
    ok(q.difficulty===i+1,`${q.id}: difficulty must be ${i+1}, got ${q.difficulty}`);
    ok(typeof q.question==='string'&&q.question.trim().length>=18,`${q.id}: question too short`);
    ok(!qtexts.has(q.question.trim().toLowerCase()),`${q.id}: duplicate question text in lesson`);
    qtexts.add(q.question.trim().toLowerCase());
    ok(Array.isArray(q.answers)&&q.answers.length>=3,`${q.id}: need at least 3 answer options`);
    ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<(q.answers||[]).length,`${q.id}: invalid correct index`);
    ok(typeof q.explanation==='string'&&q.explanation.trim().length>=20,`${q.id}: explanation too short`);
    ok(typeof q.wrongExplanation==='string'&&q.wrongExplanation.trim().length>=20,`${q.id}: wrongExplanation too short`);
    ok(targets.has(q.reviewTarget),`${q.id}: reviewTarget ${q.reviewTarget} does not exist`);
  });
  const micros=quiz.microDecisions||[];
  microCount+=micros.length;
  ok(micros.length>=2&&micros.length<=3,`${id}: expected 2-3 micro decisions, got ${micros.length}`);
  const microIds=new Set();
  micros.forEach(m=>{
    ok(typeof m.id==='string'&&!microIds.has(m.id),`${id}: duplicate/invalid micro id ${m.id}`);microIds.add(m.id);
    ok(Number.isInteger(m.afterSubtopic)&&m.afterSubtopic>=1&&m.afterSubtopic<=lesson.subtopics.length,`${m.id}: invalid afterSubtopic`);
    ok(Array.isArray(m.answers)&&m.answers.length>=2,`${m.id}: not enough answers`);
    ok(Number.isInteger(m.correct)&&m.correct>=0&&m.correct<m.answers.length,`${m.id}: invalid correct`);
    ok(typeof m.explanation==='string'&&m.explanation.trim().length>=15,`${m.id}: explanation too short`);
  });
}

ok(questionCount===200,`Expected 200 total questions, got ${questionCount}`);

const caseIndex=read('content/cases/index-1.json');
ok(caseIndex.cases.length===11,`Expected 11 cases, got ${caseIndex.cases.length}`);
const caseIds=new Set(caseIndex.cases.map(c=>c.id));
ok(caseIds.size===11,'Case IDs are not unique');
for(const item of caseIndex.cases){
  const p=`content/cases/${item.id}.json`;
  ok(exists(p),`${item.id}: case file missing`);if(!exists(p))continue;
  const c=read(p);
  ok(c.id===item.id,`${item.id}: case id mismatch`);
  ok(c.status===item.status,`${item.id}: index/file status mismatch`);
  ok(['CURRENT','UPDATED','PENDING_REVIEW','OUTDATED','ARCHIVED'].includes(c.status),`${item.id}: invalid status`);
  ok(typeof c.contentVersion==='string'&&c.contentVersion.length>0,`${item.id}: missing contentVersion`);
  ok(typeof c.verifiedAt==='string'&&c.verifiedAt.length>=10,`${item.id}: missing verifiedAt`);
  ok(typeof c.source==='string'&&/^https:\/\//.test(c.source),`${item.id}: missing official source URL`);
  for(const l of c.linkedLessons||[])ok(lessonIds.includes(l),`${item.id}: linked lesson ${l} does not exist`);
  if(c.mode==='multi')ok(Array.isArray(c.steps)&&c.steps.length>=3,`${item.id}: multi case needs >=3 steps`);
  else ok(Array.isArray(c.options)&&c.options.length>=3,`${item.id}: single case needs >=3 options`);
}

const updates=read('content/updates.json');
const legacyPattern=/^(?:c\d+|t\d+|i\d+|r\d+)$/;
for(const u of updates.updates||[]){
  ok(typeof u.contentVersion==='string'&&u.contentVersion.length>0,`${u.id}: update missing contentVersion`);
  ok(typeof u.lastVerifiedDate==='string'&&u.lastVerifiedDate.length>=10,`${u.id}: update missing lastVerifiedDate`);
  ok(['CURRENT','UPDATED','PENDING_REVIEW','OUTDATED','ARCHIVED'].includes(u.status),`${u.id}: invalid update status`);
  for(const id of u.affectedLessons||[]){ok(lessonIds.includes(id),`${u.id}: unknown affected lesson ${id}`);ok(!legacyPattern.test(id),`${u.id}: legacy lesson id remains ${id}`)}
  for(const id of u.affectedCases||[])ok(caseIds.has(id),`${u.id}: unknown affected case ${id}`);
}

const search=read('content/search/core.json');
const searchIds=new Set(search.items.map(x=>x.id));
for(const id of lessonIds)ok(searchIds.has(id),`${id}: missing from search index`);
for(const item of search.items){
  ok(lessonIds.includes(item.id),`${item.id}: unknown search lesson id`);
  for(const field of ['keywords','synonyms','userQuestions','scenarios','legalTerms'])ok(Array.isArray(item[field])&&item[field].length>0,`${item.id}: search field ${field} empty`);
}

const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
ok(sw.includes("url.pathname.includes('/legal-app/content/')"),'Service worker does not route legal content separately');
ok(/networkFirst\([^,]+,\s*LEGAL\)/.test(sw),'Legal content is not network-first');
ok(/fetch\([^,]+,\s*\{cache:'no-store'\}\)/.test(sw),'Network-first fetch does not bypass HTTP cache');
for(const id of lessonIds)ok(sw.includes(`'${id}'`),`SW missing lesson ${id}`);
for(const id of caseIds)ok(sw.includes(`'${id}'`),`SW missing case ${id}`);

const state=fs.readFileSync(path.join(root,'js/state.js'),'utf8');
ok(!state.includes('score=Math.min(100,Math.max(m.score||0,75))'),'Legacy case -> 75% mastery logic remains');
ok(!state.includes("name:'Petr'"),'Hardcoded Petr remains in state');
ok(/opened\?10:0/.test(state)&&/solved\*9/.test(state),'Exact 10 + 9*solved mastery formula missing');

const report={version:index.version,contentVersion:index.contentVersion,lessons:lessonIds.length,questions:questionCount,microDecisions:microCount,cases:caseIds.size,updates:(updates.updates||[]).length,searchItems:search.items.length,errors};
console.log(JSON.stringify(report,null,2));
if(errors.length){
  for(const e of errors)console.error(`::error file=legal-app/qa.mjs::${e}`);
  console.error(`\nQA FAILED with ${errors.length} issue(s)`);
  process.exit(1);
}
console.log('\nLexiFrance integrity QA PASSED');
