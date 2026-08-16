import fs from 'node:fs';
import {chromium} from 'playwright';

const BASE='http://127.0.0.1:4173/legal-app/';
const quiz=JSON.parse(fs.readFileSync('legal-app/content/quizzes/corp-01.json','utf8'));
const case1=JSON.parse(fs.readFileSync('legal-app/content/cases/case1.json','utf8'));
const case3=JSON.parse(fs.readFileSync('legal-app/content/cases/case3.json','utf8'));
const failures=[];
const check=(condition,message)=>{if(!condition){failures.push(message);console.error(`FAIL: ${message}`)}else console.log(`PASS: ${message}`)};
const readState=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('lexifrance-state-v5')||'null'));
const masteryOf=(s,id)=>{const p=s?.lessonProgress?.[id];if(!p)return 0;const solved=Object.values(p.questions||{}).filter(q=>q?.solved).length;return Math.min(100,(p.opened?10:0)+solved*9)};

const browser=await chromium.launch({headless:true});

async function smokeViewport(width,height,label){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'#home',{waitUntil:'networkidle'});
  await page.waitForSelector('.top',{timeout:15000});
  check(!(await page.locator('body').innerText()).includes('Загрузка LexiFrance...'),`${label}: app boots`);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  check(overflow<=1,`${label}: no horizontal overflow`);
  check(!(await page.locator('body').innerText()).includes('PETR'),`${label}: no hardcoded Petr`);
  await page.locator('[data-nav="learn"]').click();
  await page.waitForSelector('.lesson-row');
  check(await page.locator('.lesson-row').count()===5,`${label}: Corporate keeps 5 full lessons`);
  await page.locator('[data-nav="solve"]').click();
  await page.waitForSelector('.case-row');
  check(await page.locator('.case-row').count()===11,`${label}: 11 SOLVE cases render`);
  check(errors.length===0,`${label}: no runtime page errors${errors.length?` (${errors.join('; ')})`:''}`);
  await context.close();
}

await smokeViewport(375,812,'small iPhone');
await smokeViewport(390,844,'standard iPhone');
await smokeViewport(430,932,'Pro Max');
await smokeViewport(844,390,'landscape');

const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage();
const consoleErrors=[];
page.on('pageerror',e=>consoleErrors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('Failed to load resource'))consoleErrors.push(m.text())});
await page.goto(BASE+'#learn',{waitUntil:'networkidle'});
await page.waitForSelector('.lesson-row');
await page.locator('[data-lesson="corp-01"]').click();
await page.waitForSelector('.modal');
let s=await readState(page);
check(masteryOf(s,'corp-01')===10,'opening a new lesson gives exactly 10% Mastery');

await page.locator('#corp-01-quiz').scrollIntoViewIfNeeded();
await page.waitForSelector('#quiz-question-corp-01-q01');
await page.locator(`#quiz-question-corp-01-q01 [data-answer="${quiz.questions[0].correct}"]`).click();
s=await readState(page);
check(masteryOf(s,'corp-01')===19,'first unique correct answer gives Mastery 19%');
await page.locator('#quiz-question-corp-01-q01 .quiz-next button').click();

const q2=quiz.questions[1];
const wrong2=q2.answers.findIndex((_,i)=>i!==q2.correct);
await page.locator(`#quiz-question-${q2.id} [data-answer="${wrong2}"]`).click();
s=await readState(page);
check(masteryOf(s,'corp-01')===19,'wrong answer does not increase Mastery');
await page.waitForSelector(`#${q2.reviewTarget}.review-highlight`,{timeout:5000});
check(await page.locator(`#${q2.reviewTarget} .review-return`).isVisible(),'wrong answer highlights exact subtopic and shows return action');
await page.locator(`#${q2.reviewTarget} .review-return`).click();
await page.locator(`#quiz-question-${q2.id} [data-answer="${q2.correct}"]`).click();
s=await readState(page);
check(masteryOf(s,'corp-01')===28,'correcting a previously wrong unique question gives +9 once');
await page.locator(`#quiz-question-${q2.id} .quiz-next button`).click();

for(let i=2;i<quiz.questions.length;i++){
  const q=quiz.questions[i];
  await page.waitForSelector(`#quiz-question-${q.id}`);
  await page.locator(`#quiz-question-${q.id} [data-answer="${q.correct}"]`).click();
  await page.locator(`#quiz-question-${q.id} .quiz-next button`).click();
}
await page.waitForSelector('.quiz-summary');
s=await readState(page);
check(masteryOf(s,'corp-01')===100,'10 unique correct questions plus open reaches exactly 100%');
const xpAt100=s.xp;
check((s.lessonProgress['corp-01']?.questions&&Object.values(s.lessonProgress['corp-01'].questions).filter(q=>q.solved).length)===10,'all 10 solved question IDs persist');

await page.locator('[data-repeat]').click();
await page.waitForSelector('#quiz-question-corp-01-q01');
await page.locator(`#quiz-question-corp-01-q01 [data-answer="${quiz.questions[0].correct}"]`).click();
s=await readState(page);
check(masteryOf(s,'corp-01')===100,'retake cannot farm Mastery above 100%');
check(s.xp===xpAt100,'retake cannot farm full lesson XP');

await page.locator('[data-save]').click();
await page.locator('[data-close]').click();
await page.locator('[data-nav="profile"]').click();
await page.waitForSelector('.saved-list');
check(await page.locator('[data-saved-lesson="corp-01"]').count()===1,'saved lesson is discoverable in Profile');

await page.reload({waitUntil:'networkidle'});
s=await readState(page);
check(masteryOf(s,'corp-01')===100,'Mastery persists after reload');
check((s.saved||[]).includes('corp-01'),'saved materials persist after reload');

await page.locator('[data-nav="solve"]').click();
await page.waitForSelector('[data-case="case1"]');
await page.locator('[data-case="case1"]').click();
await page.waitForSelector('.modal #caseStage');
const wrongCase1=case1.options.findIndex((_,i)=>i!==case1.correct);
await page.locator(`[data-option="${wrongCase1}"]`).click();
await page.locator(`[data-option="${case1.correct}"]`).click();
await page.locator('#finishSingle').click();
s=await readState(page);
check(s.caseHistory.case1.completed===true,'single case completes after corrected answer');
check(s.caseHistory.case1.perfectRun===false,'wrong answer keeps first single run non-perfect');
check(s.caseHistory.case1.wrongAnswers>=1,'single case wrong answer persists in history');
await page.locator('[data-restart]').click();
await page.locator(`[data-option="${case1.correct}"]`).click();
await page.locator('#finishSingle').click();
s=await readState(page);
check(s.caseHistory.case1.perfectRun===true,'new clean single run can earn Perfect');
const xpAfterCase1=s.xp;
await page.locator('[data-restart]').click();
await page.locator(`[data-option="${case1.correct}"]`).click();
await page.locator('#finishSingle').click();
s=await readState(page);
check(s.xp===xpAfterCase1,'repeated perfect single case cannot farm XP');
check(masteryOf(s,'corp-01')===100,'SOLVE case does not modify lesson Mastery');
await page.locator('[data-close]').click();

await page.locator('[data-case="case3"]').click();
await page.waitForSelector('.modal #caseStage');
for(let i=0;i<case3.steps.length;i++){
  const step=case3.steps[i];
  await page.locator(`[data-step-option="${step.correct}"]`).click();
  await page.locator('#nextStep').click();
}
await page.waitForSelector('[data-restart]');
s=await readState(page);
check(s.caseHistory.case3.completed===true&&s.caseHistory.case3.perfectRun===true,'multi-step case tracks a genuine perfect run');
await page.locator('[data-close]').click();

await page.locator('[data-nav="search"]').click();
await page.waitForSelector('#searchInput');
const searchChecks=[
  ['какую фирму открыть','corp-01'],['micro или sasu','corp-01'],['могу ли я дать деньги sci','corp-02'],['заем своей компании','corp-02'],
  ['партнер блокирует решение','corp-03'],['что такое statuts','corp-03'],['как вывести деньги из фирмы','corp-04'],['зарплата или дивиденды','corp-04'],
  ['как закрыть sasu','corp-05'],['как продать фирму','corp-05'],['что такое is','tax-01'],['когда появляется tva','tax-02'],
  ['pfu 2026','tax-03'],['sci ir или is','tax-04'],['после студента открыть ип','imm-02'],['сколько можно работать студенту','imm-02'],
  ['какой внж для ип','imm-03'],['дает ли pacs внж','imm-04'],['как получить гражданство','imm-05'],['получил oqtf что делать','imm-06']
];
for(const [query,id] of searchChecks){
  const input=page.locator('#searchInput');
  await input.fill(query);
  await page.waitForTimeout(260);
  check(await page.locator(`[data-lesson="${id}"]`).count()>0,`Search: "${query}" finds ${id}`);
}

await page.locator('[data-nav="home"]').click();
await page.waitForSelector('.top');
await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)location.reload()});
await page.waitForSelector('.top',{timeout:15000});
await page.waitForTimeout(800);
await context.setOffline(true);
await page.reload({waitUntil:'domcontentloaded'});
await page.waitForSelector('.top',{timeout:15000});
check(!(await page.locator('body').innerText()).includes('Загрузка LexiFrance...'),'offline launch boots from cached shell/content');
await page.locator('[data-nav="learn"]').click();
await page.waitForSelector('[data-lesson="corp-01"]');
await page.locator('[data-lesson="corp-01"]').click();
await page.waitForSelector('.modal .offline-copy');
check((await page.locator('.offline-copy').innerText()).includes('verified'),'offline lesson exposes verified date transparency');
await context.setOffline(false);
check(consoleErrors.length===0,`full flow has no runtime errors${consoleErrors.length?` (${consoleErrors.join('; ')})`:''}`);

await context.close();
await browser.close();

if(failures.length){
  console.error(`\nE2E FAILED with ${failures.length} failure(s)`);
  failures.forEach(f=>console.error(`::error file=legal-app/e2e.mjs::${f}`));
  process.exit(1);
}
console.log('\nLexiFrance mobile/offline E2E PASSED');
