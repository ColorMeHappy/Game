import fs from'node:fs';
const r='legal-app',idx=JSON.parse(fs.readFileSync(`${r}/content/app-index.json`,'utf8')),fail=[];const bad=m=>{fail.push(m);console.error('FAIL',m)};
const must=['index.html','app.css','quiz.css','solve2.css','skill.css','a11y.css','app.js','manifest.webmanifest','icon.svg','js/a11y.js','js/data.js','js/state.js','js/cloud-gate.js','js/cloud.js','js/learning-evidence.js','js/skill-map.js','js/skill-cache.js','js/analytics.js','js/ui.js','js/icons.js','js/pages.js','js/lesson.js','js/case.js','js/legal-enhance.js','js/search-core.js','content/app-index.json','content/updates.json','content/search/core.json','content/search/qa.json',idx.caseIndexFile,...idx.caseBundleFiles];
for(const p of must)if(!fs.existsSync(`${r}/${p}`))bad(`missing ${p}`);
for(const id of idx.paths.flatMap(p=>p.lessonIds)){for(const p of[`content/lessons/${id}.json`,`content/quizzes/${id}.json`])if(!fs.existsSync(`${r}/${p}`))bad(`missing ${p}`)}
const sw=fs.readFileSync(`${r}/service-worker.js`,'utf8');
for(const p of['./index.html','./app.css?v=11','./quiz.css?v=11','./solve2.css?v=11','./skill.css?v=13','./a11y.css?v=1','./app.js?v=13','./manifest.webmanifest','./js/a11y.js?v=1','./js/cloud-gate.js?v=13','./js/cloud.js','./js/learning-evidence.js','./js/skill-map.js','./js/skill-cache.js','./js/analytics.js'])if(!sw.includes(`'${p}'`))bad(`shell missing ${p}`);
for(const old of['./app.js?v=11','./app.js?v=12','./js/cloud.js?v=11','./js/cloud.js?v=12','styles/base.css','styles/components.css','styles/pages.css','styles/content.css'])if(sw.includes(`'${old}'`))bad(`stale precache ${old}`);
if(!sw.includes("const VERSION='v13'"))bad('service worker cache generation is not v13');
if(!sw.includes('Promise.allSettled'))bad('legal precache not best effort');
if(fail.length){console.error(`ASSET QA FAILED ${fail.length}`);process.exit(1)}console.log('ASSET QA PASSED');
