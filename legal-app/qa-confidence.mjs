import fs from 'node:fs';
import { chromium, devices } from 'playwright';

const BASE=process.env.LEXIFRANCE_BASE_URL||'http://127.0.0.1:4173/legal-app/';
const quiz=JSON.parse(fs.readFileSync('legal-app/content/quizzes/corp-01.json','utf8'));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({...devices['iPhone 15']});
const page=await context.newPage();
const fail=message=>{throw new Error(message)};

try{
  await page.goto(`${BASE}#learn`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('[data-lesson="corp-01"]');
  await page.click('[data-lesson="corp-01"]');
  await page.waitForSelector('.modal #quizStage');
  for(let index=0;index<6;index++){
    const q=quiz.questions[index],correct=q.answers.find(answer=>answer.correct);
    const card=page.locator(`#quiz-question-${q.id}`);
    await card.scrollIntoViewIfNeeded();
    await card.locator('[data-answer]').filter({hasText:correct.text}).first().click();
    await page.waitForSelector('.quiz-next button');
    await page.locator('.quiz-next button').click();
  }
  const complex=quiz.questions[6],complexCard=page.locator(`#quiz-question-${complex.id}`);
  await complexCard.waitFor();
  if(await complexCard.locator('[data-confidence-box]').count()!==1)fail('difficulty 7 Quiz has no confidence calibration');
  const wrong=complex.answers.find(answer=>!answer.correct);
  await complexCard.locator('[data-answer]').filter({hasText:wrong.text}).first().click();
  if(!(await complexCard.locator('.answer-feedback').evaluate(node=>node.classList.contains('hidden'))))fail('complex Quiz answered before confidence selection');
  await complexCard.locator('[data-confidence="5"]').click();
  await complexCard.locator('[data-answer]').filter({hasText:wrong.text}).first().click();
  await page.waitForTimeout(180);
  const quizEvidence=await page.evaluate(qid=>JSON.parse(localStorage.getItem('lexifrance-skill-evidence-queue-v1')||'[]').filter(row=>row.sourceId===qid),complex.id);
  if(!quizEvidence.length||quizEvidence.some(row=>row.confidence!==5||row.rawScore!==0))fail('Quiz confidence was not attached to first-attempt skill evidence');
  console.log('PASS: complex Quiz requires and records confidence');

  const back=page.locator('.modal .back').first();
  if(await back.count())await back.click();
  await page.evaluate(()=>{location.hash='#solve'});
  await page.waitForSelector('.case-row');
  const applied=page.locator('.case-row').filter({hasText:'Applied'}).first();
  if(await applied.count()!==1)fail('no Applied SOLVE case found for confidence QA');
  await applied.click();
  await page.waitForSelector('.modal .solve-task');
  const task=page.locator('.modal .solve-task').first();
  if(await task.locator('[data-confidence-box]').count()!==1)fail('Applied SOLVE stage has no confidence calibration');
  await task.locator('[data-confidence="4"]').click();
  const option=task.locator('[data-case-option]').first();
  if(await option.count())await option.click();
  await task.locator('#submitCaseTask').click();
  await page.waitForTimeout(180);
  const solveEvidence=await page.evaluate(()=>JSON.parse(localStorage.getItem('lexifrance-skill-evidence-queue-v1')||'[]').filter(row=>row.sourceType==='solve_stage'&&row.confidence===4));
  if(!solveEvidence.length)fail('SOLVE confidence was not attached to skill evidence');
  console.log('PASS: Applied SOLVE requires and records confidence');
}finally{
  await context.close();
  await browser.close();
}
console.log('CONFIDENCE QA PASSED');
