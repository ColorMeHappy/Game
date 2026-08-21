import{boot,idx}from'./js/data.js';
import{migrateCourseV5,migrateSolveV2}from'./js/state.js';
import{initLearningEvidence}from'./js/learning-evidence.js';
import{initPracticeEvidence}from'./js/practice-evidence.js?v=15';
import{initPracticeCloud}from'./js/practice-cloud.js?v=15';
import{initPracticeLab}from'./js/practice.js?v=15';
import{initProductAnalytics,trackPage}from'./js/analytics.js';
import{initCloudGate}from'./js/cloud-gate.js?v=14';
import{shell,loading,errorBox}from'./js/ui.js';
import{home,bindHome,learn,bindLearn,solve,bindSolve,searchPage,bindSearch,profile,bindProfile}from'./js/pages.js?v=10';
import{openLesson}from'./js/lesson.js?v=10';
import{openCase}from'./js/case.js?v=10';
import{enhanceLesson}from'./js/legal-enhance.js?v=10';
const appRoot=document.querySelector('#root');
initLearningEvidence();
initPracticeEvidence();
initPracticeCloud();
function setGuarded(node,active){if(!node)return;if('inert'in node)node.inert=active;if(active)node.setAttribute('aria-hidden','true');else node.removeAttribute('aria-hidden')}
function portraitGuard(){let guard=document.querySelector('#portraitGuard');if(!guard){guard=document.createElement('div');guard.id='portraitGuard';guard.className='portrait-guard';guard.setAttribute('role','dialog');guard.setAttribute('aria-modal','true');guard.innerHTML='<div class="portrait-card"><div class="phone-turn" aria-hidden="true"><div></div></div><h1>Поверните телефон вертикально</h1><p>LexiFrance работает в portrait mode. Ваш текущий урок, Quiz, Practice или dossier останется на том же месте.</p></div>';document.body.appendChild(guard)}const coarse=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;const phone=Math.min(window.innerWidth,window.innerHeight)<=600;const landscape=window.innerWidth>window.innerHeight;const active=coarse&&phone&&landscape;guard.classList.toggle('active',active);document.body.classList.toggle('portrait-guard-active',active);setGuarded(appRoot,active);document.querySelectorAll('.modal').forEach(m=>setGuarded(m,active));return active}
async function requestPortraitLock(){try{if(screen.orientation?.lock)await screen.orientation.lock('portrait-primary')}catch{}}
portraitGuard();requestPortraitLock();window.addEventListener('orientationchange',()=>requestAnimationFrame(portraitGuard));window.addEventListener('resize',portraitGuard,{passive:true});screen.orientation?.addEventListener?.('change',portraitGuard);document.addEventListener('visibilitychange',()=>{if(!document.hidden){portraitGuard();requestPortraitLock()}});
let page=(location.hash||'#home').slice(1);const allowed=new Set(['home','learn','solve','search','profile']);if(!allowed.has(page))page='home';
const ctx={refresh:()=>render(),openLesson:async(id,target)=>{await openLesson(id,ctx);await enhanceLesson(id);portraitGuard();if(target){requestAnimationFrame(()=>{const el=document.getElementById(target);if(el){el.classList.add('review-highlight');el.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>el.classList.remove('review-highlight'),4200)}})}},openCase:async id=>{await openCase(id,ctx);portraitGuard()},navigate};
function navigate(p){if(!allowed.has(p))p='home';page=p;if(location.hash!==`#${p}`)history.pushState(null,'',`#${p}`);render();trackPage(page)}
async function render(){let body='';try{if(page==='home')body=await home(ctx);if(page==='learn')body=await learn(ctx);if(page==='solve')body=await solve(ctx);if(page==='search')body=searchPage(ctx);if(page==='profile')body=await profile(ctx);shell(appRoot,page,body);appRoot.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>navigate(b.dataset.nav));if(page==='home')bindHome(appRoot,ctx);if(page==='learn')bindLearn(appRoot,ctx);if(page==='solve')bindSolve(appRoot,ctx);if(page==='search')bindSearch(appRoot,ctx);if(page==='profile')bindProfile(appRoot,ctx);portraitGuard()}catch(e){console.error(e);shell(appRoot,page,errorBox(e));portraitGuard()}}
window.addEventListener('hashchange',()=>{const p=(location.hash||'#home').slice(1);if(allowed.has(p)){page=p;render();trackPage(page)}});
window.addEventListener('lexifrance:skill-cache-updated',()=>{if(page==='profile')render()});
window.addEventListener('lexifrance:open-review',event=>{const detail=event?.detail||{};if(detail.lessonId)ctx.openLesson(detail.lessonId,detail.target).catch(error=>console.error(error))});
appRoot.innerHTML=loading('Загрузка LexiFrance...');
try{await boot();migrateCourseV5(idx().legacyLessonMap||{});migrateSolveV2();await render();initPracticeLab();await initProductAnalytics({contentRelease:idx().contentRelease});trackPage(page);initCloudGate({contentRelease:idx().contentRelease,onHydrate:()=>render()}).catch(e=>console.warn('LexiFrance cloud unavailable',e))}catch(e){console.error(e);appRoot.innerHTML=`<main style="padding:20px">${errorBox(e)}</main>`}
if('serviceWorker'in navigator){let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload()});window.addEventListener('load',async()=>{try{const reg=await navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'});await reg.update();requestPortraitLock()}catch(e){console.error(e)}})}
