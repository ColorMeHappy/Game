import{boot,idx}from'./js/data.js';
import{migrateCourseIds}from'./js/state.js';
import{shell,loading,errorBox}from'./js/ui.js';
import{home,bindHome,learn,bindLearn,solve,bindSolve,searchPage,bindSearch,profile,bindProfile}from'./js/pages.js?v=7';
import{openLesson}from'./js/lesson.js';
import{openCase}from'./js/case.js';

function lockViewportZoom(){
  const stop=e=>e.preventDefault();
  document.addEventListener('gesturestart',stop,{passive:false});
  document.addEventListener('gesturechange',stop,{passive:false});
  document.addEventListener('gestureend',stop,{passive:false});
  document.addEventListener('touchmove',e=>{if(e.touches&&e.touches.length>1)e.preventDefault()},{passive:false});
  document.addEventListener('dblclick',stop,{passive:false});
  let last=0;
  document.addEventListener('touchend',e=>{if(e.changedTouches?.length!==1)return;const now=Date.now();if(now-last<300)e.preventDefault();last=now},{passive:false});
}
lockViewportZoom();

const appRoot=document.querySelector('#root');
let page=(location.hash||'#home').slice(1);
const allowed=new Set(['home','learn','solve','search','profile']);
if(!allowed.has(page))page='home';
const ctx={refresh:()=>render(),openLesson:id=>openLesson(id,ctx),openCase:id=>openCase(id,ctx),navigate};

function navigate(p){
  if(!allowed.has(p))p='home';
  page=p;
  if(location.hash!==`#${p}`)history.pushState(null,'',`#${p}`);
  render();
}

async function render(){
  let body='';
  try{
    if(page==='home')body=await home(ctx);
    if(page==='learn')body=await learn(ctx);
    if(page==='solve')body=await solve(ctx);
    if(page==='search')body=searchPage(ctx);
    if(page==='profile')body=await profile(ctx);
    shell(appRoot,page,body);
    appRoot.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>navigate(b.dataset.nav));
    if(page==='home')bindHome(appRoot,ctx);
    if(page==='learn')bindLearn(appRoot,ctx);
    if(page==='solve')bindSolve(appRoot,ctx);
    if(page==='search')bindSearch(appRoot,ctx);
    if(page==='profile')bindProfile(appRoot,ctx);
  }catch(e){
    console.error(e);
    shell(appRoot,page,errorBox(e));
  }
}

window.addEventListener('hashchange',()=>{const p=(location.hash||'#home').slice(1);if(allowed.has(p)){page=p;render()}});
appRoot.innerHTML=loading('Загрузка LexiFrance...');
try{
  await boot();
  migrateCourseIds(idx().legacyLessonMap||{});
  await render();
}catch(e){
  console.error(e);
  appRoot.innerHTML=`<main style="padding:20px">${errorBox(e)}</main>`;
}

if('serviceWorker'in navigator){
  let refreshing=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload()});
  window.addEventListener('load',async()=>{
    try{
      const reg=await navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'});
      await reg.update();
    }catch(e){console.error(e)}
  });
}
