import {webkit} from 'playwright';
const BASE='http://127.0.0.1:4173/legal-app/';
const failures=[];const check=(v,m)=>{if(v)console.log(`PASS: ${m}`);else{failures.push(m);console.error(`FAIL: ${m}`)}};
const browser=await webkit.launch({headless:true});
for(const [width,height,label] of [[375,812,'small iPhone WebKit'],[390,844,'standard iPhone WebKit'],[430,932,'Pro Max WebKit']]){
  const c=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});const p=await c.newPage();p.setDefaultTimeout(7000);const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(BASE+'#home',{waitUntil:'domcontentloaded'});await p.waitForSelector('.top');
  check((await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth))<=1,`${label}: no horizontal overflow`);
  await p.locator('.nav [data-nav="learn"]').click();await p.waitForSelector('[data-lesson="corp-01"]');await p.locator('[data-lesson="corp-01"]').click();await p.waitForSelector('.modal');
  check(await p.locator('#corp-01-subtopic-1').count()===1,`${label}: lesson/subtopic renders`);
  await p.locator('[data-close]').click();await p.locator('.nav [data-nav="search"]').click();await p.waitForSelector('#searchInput');await p.locator('#searchInput').fill('как вывести деньги из фирмы');await p.waitForTimeout(300);check(await p.locator('[data-lesson="corp-04"]').count()>0,`${label}: Search input works`);
  check(errs.length===0,`${label}: no WebKit runtime page errors`);await c.close();
}
await browser.close();if(failures.length){for(const f of failures)console.error(`::error file=legal-app/webkit-smoke.mjs::${f}`);process.exit(1)}console.log('LexiFrance WebKit smoke PASSED');
