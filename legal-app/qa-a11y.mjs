import { chromium, devices } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE=process.env.LEXIFRANCE_BASE_URL||'http://127.0.0.1:4173/legal-app/';
const routes=['home','learn','solve','search','profile'];
const blockingIds=new Set(['meta-viewport']);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({...devices['iPhone 15']});
const page=await context.newPage();
const failures=[];
let scans=0;

async function scan(label){
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  scans+=1;
  for(const violation of result.violations){
    if(blockingIds.has(violation.id)||violation.impact==='critical'||violation.impact==='serious'){
      failures.push({label,id:violation.id,impact:violation.impact,description:violation.description,nodes:violation.nodes.length,targets:violation.nodes.slice(0,6).map(node=>node.target)});
    }
  }
}

try{
  for(const route of routes){
    await page.goto(`${BASE}#${route}`,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('#root');
    await page.waitForTimeout(450);
    await scan(`${route}:light`);
    await page.evaluate(()=>document.body.classList.add('dark'));
    await scan(`${route}:dark`);
  }
  await page.goto(`${BASE}#learn`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('[data-lesson]');
  await page.locator('[data-lesson]').first().click();
  await page.waitForSelector('.modal');
  await scan('lesson-modal:light');
  await page.evaluate(()=>document.body.classList.add('dark'));
  await scan('lesson-modal:dark');
  const back=page.locator('.modal .back').first();if(await back.count())await back.click();
  await page.evaluate(()=>{document.body.classList.remove('dark');location.hash='#solve'});
  await page.waitForSelector('[data-case]');
  await page.locator('[data-case]').first().click();
  await page.waitForSelector('.modal');
  await scan('solve-modal:light');
  await page.evaluate(()=>document.body.classList.add('dark'));
  await scan('solve-modal:dark');
}finally{
  await context.close();
  await browser.close();
}

if(failures.length){console.error('A11Y BLOCKING FAILURES');console.error(JSON.stringify(failures,null,2));process.exit(1)}
console.log(`A11Y OK scans=${scans} blockingFailures=0`);
