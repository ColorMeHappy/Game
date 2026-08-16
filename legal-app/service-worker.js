const VERSION='v9';
const STATIC=`lexifrance-static-${VERSION}`;
const RUNTIME=`lexifrance-runtime-${VERSION}`;
const LEGAL=`lexifrance-legal-${VERSION}`;
const SHELL=['./','./index.html','./app.css?v=9','./quiz.css?v=9','./app.js?v=9','./manifest.webmanifest','./js/data.js','./js/state.js','./js/ui.js','./js/icons.js','./js/pages.js?v=9','./js/lesson.js?v=9','./js/case.js?v=9','./js/legal-enhance.js?v=9'];
const STATIC_ASSETS=['./icon.svg'];
const LESSONS=['corp-01','corp-02','corp-03','corp-04','corp-05','tax-01','tax-02','tax-03','tax-04','imm-01','imm-02','imm-03','imm-04','imm-05','imm-06','re-01','re-02','re-03','re-04','re-05'];
const CASES=['case1','case2','case3','case4','case5','case6','case7','case8','case9','case10','case11'];
const QUIZZES=[...LESSONS];
const LEGAL_BOOT=['./content/app-index.json','./content/updates.json','./content/catalog/corporate.json','./content/catalog/tax.json','./content/catalog/immigration.json','./content/catalog/real-estate.json','./content/search/core.json','./content/cases/index-1.json',...CASES.map(id=>`./content/cases/${id}.json`),...LESSONS.map(id=>`./content/lessons/${id}.json`),...QUIZZES.map(id=>`./content/quizzes/${id}.json`)];
self.addEventListener('install',e=>e.waitUntil(Promise.all([caches.open(RUNTIME).then(c=>c.addAll(SHELL)),caches.open(STATIC).then(c=>c.addAll(STATIC_ASSETS)),caches.open(LEGAL).then(c=>c.addAll(LEGAL_BOOT))]).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('lexifrance-')&&!([STATIC,RUNTIME,LEGAL].includes(k))).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function networkFirst(req,cacheName){const c=await caches.open(cacheName);try{const r=await fetch(req,{cache:'no-store'});if(r&&r.ok)await c.put(req,r.clone());return r}catch{const hit=await c.match(req);if(hit)return hit;throw new Error('offline-miss')}}
async function cacheFirst(req){const c=await caches.open(STATIC);const hit=await c.match(req);if(hit)return hit;const r=await fetch(req);if(r&&r.ok)await c.put(req,r.clone());return r}
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const url=new URL(e.request.url);if(url.origin!==self.location.origin)return;if(e.request.mode==='navigate'){e.respondWith(networkFirst(e.request,RUNTIME).catch(()=>caches.match('./index.html')));return}if(url.pathname.includes('/legal-app/content/')){e.respondWith(networkFirst(e.request,LEGAL));return}if(/\.(?:js|css)$/.test(url.pathname)){e.respondWith(networkFirst(e.request,RUNTIME));return}if(/\.(?:svg|png|jpg|jpeg|webp|ico)$/.test(url.pathname)){e.respondWith(cacheFirst(e.request));return}e.respondWith(networkFirst(e.request,RUNTIME))});