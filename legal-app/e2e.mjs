import fs from 'node:fs';
import {chromium} from 'playwright';

const BASE='http://127.0.0.1:4173/legal-app/';
const quiz=JSON.parse(fs.readFileSync('legal-app/content/quizzes/corp-01.json','utf8'));
const case1=JSON.parse(fs.readFileSync('legal-app/content/cases/case1.json','utf8'));
const case3=JSON.parse(fs.readFileSync('legal-app/content/cases/case3.json','utf8'));
const failures=[];
const check=(v,m)=>{if(v)console.log(`PASS: ${m}`);else{failures.push(m);console.error(`FAIL: ${m}`)}};
const readState=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('lexifrance-state-v5')||'null'));
const masteryOf=(s,id)=>{const p=s?.lessonProgress?.[id];if(!p)return 0;return Math.min(100,(p.opened?10:0)+Object.values(p.questions||{}).filter(q=>q?.solved).length*9)};
const browser=await chromium.launch({headless:true});

async function smoke(width,height,label){
  const c=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
  const p=await c.newPage();p.setDefaultTimeout(7000);const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(BASE+'#home',{waitUntil:'networkidle'});await p.waitForSelector('.top');
  check(!(await p.locator('body').innerText()).includes('Загрузка LexiFrance...'),`${label}: app boots`);
  check((await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth))<=1,`${label}: no horizontal overflow`);
  check(!(await p.locator('body').innerText()).toUpperCase().includes('PETR'),`${label}: no hardcoded Petr`);
  await p.locator('.nav [data-nav="learn"]').click();await p.waitForSelector('.lesson-row');
  check(await p.locator('.lesson-row').count()===5,`${label}: Corporate keeps 5 full lessons`);
  await p.locator('.nav [data-nav="solve"]').click();await p.waitForSelector('.case-row');
  check(await p.locator('.case-row').count()===11,`${label}: 11 SOLVE cases render`);
  check(errs.length===0,`${label}: no runtime page errors`);await c.close();
}
await smoke(375,812,'small iPhone');await smoke(390,844,'standard iPhone');await smoke(430,932,'Pro Max');await smoke(844,390,'landscape');

const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage();page.setDefaultTimeout(7000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
await page.goto(BASE+'#learn',{waitUntil:'networkidle'});await page.waitForSelector('.lesson-row');

for(const [path,count] of [['Corporate',5],['Tax',4],['Immigration',6],['Real Estate',5]]){
  await page.locator(`[data-path="${path}"]`).click();await page.waitForSelector('.lesson-row');
  check(await page.locator('.lesson-row').count()===count,`${path}: expected ${count} full lessons`);
}
await page.locator('[data-path="Corporate"]').click();await page.waitForSelector('[data-lesson="corp-01"]');
await page.locator('[data-lesson="corp-01"]').click();await page.waitForSelector('.modal');
let s=await readState(page);check(masteryOf(s,'corp-01')===10,'new lesson open gives exactly 10% Mastery');

await page.locator('#corp-01-quiz').scrollIntoViewIfNeeded();await page.waitForSelector('#quiz-question-corp-01-q01');
await page.locator(`#quiz-question-corp-01-q01 [data-answer="${quiz.questions[0].correct}"]`).click();s=await readState(page);check(masteryOf(s,'corp-01')===19,'Q1 unique correct gives 19%');
await page.locator('#quiz-question-corp-01-q01 .quiz-next button').click();
const q2=quiz.questions[1],wrong=q2.answers.findIndex((_,i)=>i!==q2.correct);
await page.locator(`#quiz-question-${q2.id} [data-answer="${wrong}"]`).click();s=await readState(page);check(masteryOf(s,'corp-01')===19,'wrong Q2 gives no Mastery');
await page.waitForSelector(`#${q2.reviewTarget}.review-highlight`);check(await page.locator(`#${q2.reviewTarget} .review-return`).isVisible(),'wrong answer highlights exact subtopic and offers return');
await page.locator(`#${q2.reviewTarget} .review-return`).click();await page.locator(`#quiz-question-${q2.id} [data-answer="${q2.correct}"]`).click();s=await readState(page);check(masteryOf(s,'corp-01')===28,'corrected Q2 gives +9 once');
await page.locator(`#quiz-question-${q2.id} .quiz-next button`).click();
for(let i=2;i<10;i++){const q=quiz.questions[i];await page.waitForSelector(`#quiz-question-${q.id}`);await page.locator(`#quiz-question-${q.id} [data-answer="${q.correct}"]`).click();await page.locator(`#quiz-question-${q.id} .quiz-next button`).click()}
await page.waitForSelector('.quiz-summary');s=await readState(page);check(masteryOf(s,'corp-01')===100,'Q10 completes exact 100% Mastery');check(Object.values(s.lessonProgress['corp-01'].questions).filter(q=>q.solved).length===10,'10 solved question IDs persist');
const xp100=s.xp;await page.locator('[data-repeat]').click();await page.waitForSelector('#quiz-question-corp-01-q01');await page.locator(`#quiz-question-corp-01-q01 [data-answer="${quiz.questions[0].correct}"]`).click();s=await readState(page);check(masteryOf(s,'corp-01')===100,'Repeat Quiz cannot farm Mastery');check(s.xp===xp100,'Repeat Quiz cannot farm full lesson XP');
await page.locator('[data-save]').click();await page.locator('[data-close]').click();await page.locator('.nav [data-nav="profile"]').click();await page.waitForSelector('.saved-list');check(await page.locator('[data-saved-lesson="corp-01"]').count()===1,'Saved lesson appears in Profile');
await page.reload({waitUntil:'networkidle'});s=await readState(page);check(masteryOf(s,'corp-01')===100,'Mastery persists after reload');check(s.saved.includes('corp-01'),'Saved persists after reload');

await page.locator('.nav [data-nav="solve"]').click();await page.waitForSelector('[data-case="case1"]');await page.locator('[data-case="case1"]').click();await page.waitForSelector('#caseStage');
const wrongCase=case1.options.findIndex((_,i)=>i!==case1.correct);await page.locator(`[data-option="${wrongCase}"]`).click();await page.locator(`[data-option="${case1.correct}"]`).click();await page.locator('#finishSingle').click();s=await readState(page);check(s.caseHistory.case1.completed,'single case completes');check(!s.caseHistory.case1.perfectRun,'error keeps current run non-perfect');check(s.caseHistory.case1.wrongAnswers>=1,'case wrong answer history persists');
await page.locator('[data-restart]').click();await page.locator(`[data-option="${case1.correct}"]`).click();await page.locator('#finishSingle').click();s=await readState(page);check(s.caseHistory.case1.perfectRun,'clean new run can earn Perfect');const xpCase=s.xp;await page.locator('[data-restart]').click();await page.locator(`[data-option="${case1.correct}"]`).click();await page.locator('#finishSingle').click();s=await readState(page);check(s.xp===xpCase,'case Perfect XP cannot be farmed');check(masteryOf(s,'corp-01')===100,'SOLVE never changes lesson Mastery');await page.locator('[data-close]').click();
await page.locator('[data-case="case3"]').click();await page.waitForSelector('#caseStage');for(const step of case3.steps){await page.locator(`[data-step-option="${step.correct}"]`).click();await page.locator('#nextStep').click()}await page.waitForSelector('[data-restart]');s=await readState(page);check(s.caseHistory.case3.completed&&s.caseHistory.case3.perfectRun,'multi-step case tracks genuine perfect run');await page.locator('[data-close]').click();

await page.locator('.nav [data-nav="search"]').click();await page.waitForSelector('#searchInput');
const searches=[['какую фирму открыть','corp-01'],['micro или sasu','corp-01'],['могу ли я дать деньги sci','corp-02'],['заем своей компании','corp-02'],['партнер блокирует решение','corp-03'],['как вывести деньги из фирмы','corp-04'],['зарплата или дивиденды','corp-04'],['как закрыть sasu','corp-05'],['как продать фирму','corp-05'],['что такое is','tax-01'],['когда появляется tva','tax-02'],['pfu 2026','tax-03'],['sci ir или is','tax-04'],['после студента открыть ип','imm-02'],['сколько можно работать студенту','imm-02'],['какой внж для ип','imm-03'],['дает ли pacs внж','imm-04'],['как получить гражданство','imm-05'],['получил oqtf что делать','imm-06'],['не возвращают залог','re-02']];
for(const [query,id] of searches){await page.locator('#searchInput').fill(query);await page.waitForTimeout(230);check(await page.locator(`[data-lesson="${id}"]`).count()>0,`Search "${query}" -> ${id}`)}

await page.locator('.nav [data-nav="home"]').click();await page.waitForSelector('.top');
const sw=await page.evaluate(async()=>{
  try{
    const reg=await navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'});
    const w=reg.installing||reg.waiting||reg.active;
    if(!w)return{ok:false,error:'no-worker'};
    if(w.state!=='activated')await Promise.race([new Promise((resolve,reject)=>{const on=()=>{if(w.state==='activated')resolve();if(w.state==='redundant')reject(new Error('redundant'))};w.addEventListener('statechange',on)}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('activation-timeout')),8000))]);
    return{ok:true,state:(reg.active||w).state};
  }catch(e){return{ok:false,error:String(e)}}
});
check(sw.ok&&sw.state==='activated',`Service Worker activates (${sw.state||sw.error})`);
if(sw.ok){
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('.top');
  const controlled=await page.evaluate(()=>!!navigator.serviceWorker.controller);check(controlled,'page is controlled by Service Worker after reload');
  if(controlled){await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('.top');check(!(await page.locator('body').innerText()).includes('Загрузка LexiFrance...'),'offline launch boots');await page.locator('.nav [data-nav="learn"]').click();await page.waitForSelector('[data-lesson="corp-01"]');await page.locator('[data-lesson="corp-01"]').click();await page.waitForSelector('.offline-copy');check((await page.locator('.offline-copy').innerText()).includes('verified'),'offline lesson shows verified date');await context.setOffline(false)}
}
check(errs.length===0,`full flow has no runtime page errors${errs.length?`: ${errs.join('; ')}`:''}`);
await context.close();await browser.close();
if(failures.length){for(const f of failures)console.error(`::error file=legal-app/e2e.mjs::${f}`);console.error(`E2E FAILED: ${failures.length}`);process.exit(1)}
console.log('LexiFrance mobile/offline E2E PASSED');
