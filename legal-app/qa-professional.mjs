import fs from'node:fs';
const r='legal-app',fail=[];const bad=m=>{fail.push(m);console.error('FAIL',m)},ok=m=>console.log('PASS',m),read=p=>fs.readFileSync(`${r}/${p}`,'utf8'),json=p=>JSON.parse(read(p));
const idx=json('content/app-index.json'),html=read('index.html'),sw=read('service-worker.js'),api=read('js/professional-api.js'),hub=read('js/professional-hub.js'),conf=read('js/professional-client-confidence.js');
if(idx.runtimeVersion!=='22'||idx.professionalRelease!=='2026.08.22.9')bad('professional runtime metadata');else ok('professional runtime metadata');
for(const k of['virtualClient','drafting','coldCase','adversarial','evaluation'])if(!idx.professionalPlatform?.[k])bad(`missing professionalPlatform.${k}`);else ok(`professionalPlatform.${k}`);
if(idx.professionalPlatform?.genericAiChatbot!==false||idx.professionalPlatform?.fictionalTrainingDataOnly!==true)bad('professional product guardrails');else ok('fictional/no generic chatbot guardrails');
if(!idx.legalStudio?.appId||idx.legalStudio?.runtimeDependency!==false||idx.legalStudio?.humanLegalApprovalRequired!==true)bad('Phase 9 Studio metadata');else ok('Phase 9 Studio metadata');
for(const token of['Client Interview','Drafting Lab','Cold Case','Legal Sparring / Judge'])if(!hub.includes(token))bad(`missing UI ${token}`);else ok(`UI ${token}`);
if(!hub.includes('solutionHiddenUntilSubmit')&&hub.includes('related lesson')){} // text-only guard below
if(!hub.includes('До Submit решение и rubric скрыты.'))bad('Cold Case no-hints message');else ok('Cold Case no-hints message');
if(!hub.includes("invokeProfessional('lexifrance-evaluator'")||!hub.includes("invokeProfessional('lexifrance-adversarial'")||!hub.includes("invokeProfessional('lexifrance-virtual-client'")||!hub.includes("invokeProfessional('lexifrance-drafting'"))bad('professional Edge routing');else ok('professional Edge routing');
if(!conf.includes('confidence')||!conf.includes("op:'submit'"))bad('Client Interview confidence');else ok('Client Interview confidence');
if(api.includes('service_role')||api.includes('SUPABASE_SERVICE_ROLE'))bad('service role leaked to browser');else ok('no service role in browser');
for(const secret of['19 августа 2026','45 000','compte courant d’associé créditeur'])if((html+hub+api+conf).includes(secret))bad(`hidden fact leaked: ${secret}`);else ok(`no hidden fact leak: ${secret}`);
if(!html.includes('professional.css?v=22')||!html.includes('professional-hub.js?v=22')||!html.includes('professional-client-confidence.js?v=22'))bad('professional assets in HTML');else ok('professional assets in HTML');
if(!sw.includes("const VERSION='v22'")||!sw.includes('./professional.css?v=22')||!sw.includes('./js/professional-api.js')||!sw.includes('./js/professional-hub.js?v=22')||!sw.includes('./js/professional-client-confidence.js?v=22'))bad('professional assets in offline shell');else ok('professional assets in offline shell');
if(!fs.existsSync(`${r}/PHASES5_9_RELEASE_NOTES.md`)||!fs.existsSync(`${r}/PHASE9_BASE44_STUDIO.md`)||!fs.existsSync(`${r}/PRIVATE_PROFESSIONAL_CONTENT.md`))bad('phase documentation');else ok('phase documentation');
if(fail.length){console.error(`PROFESSIONAL QA FAILED ${fail.length}`);process.exit(1)}console.log('PHASES 5-9 PROFESSIONAL INTEGRITY PASSED');
