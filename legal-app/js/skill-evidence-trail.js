import { SKILL_DEFINITIONS } from './skill-cache.js';
import { cloudRuntimeAllowed } from './cloud-gate.js?v=14';

const SUPABASE_URL='https://nnexhmzebviispxkpclx.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_91vY-4O1RkByvFz7IB_QPg_vwLt5AKN';
const SDK_URL='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.3';
const META_KEY='lexifrance-cloud-v1';
const CACHE_PREFIX='lexifrance-practice-evidence-trail-v1:';
const safeParse=(value,fallback)=>{try{return JSON.parse(value||'')??fallback}catch{return fallback}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const skillById=new Map(SKILL_DEFINITIONS.map(row=>[row.id,row]));
let client=null,sdkPromise=null,practiceTitles=null,observer=null,started=false,refreshTimer=null,lastFetchAt=0;

function cloudMeta(){return safeParse(localStorage.getItem(META_KEY),{})}
function cacheKey(userId){return userId?`${CACHE_PREFIX}${userId}`:null}
function readCache(userId){const key=cacheKey(userId);if(!key)return[];const value=safeParse(localStorage.getItem(key),{});return Array.isArray(value.rows)?value.rows:[]}
function writeCache(userId,rows){const key=cacheKey(userId);if(!key)return;localStorage.setItem(key,JSON.stringify({userId,updatedAt:new Date().toISOString(),rows:Array.isArray(rows)?rows.slice(0,80):[]}));window.dispatchEvent(new CustomEvent('lexifrance:evidence-trail-updated',{detail:{userId,count:rows.length}}))}
async function ensureSdk(){
  if(window.supabase?.createClient)return window.supabase;
  if(sdkPromise)return sdkPromise;
  sdkPromise=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-lexifrance-supabase-sdk]');
    const done=()=>window.supabase?.createClient?resolve(window.supabase):reject(new Error('SUPABASE_SDK_UNAVAILABLE'));
    if(existing){if(window.supabase?.createClient)return resolve(window.supabase);existing.addEventListener('load',done,{once:true});existing.addEventListener('error',()=>reject(new Error('SUPABASE_SDK_LOAD_FAILED')),{once:true});return}
    const script=document.createElement('script');script.src=SDK_URL;script.async=true;script.crossOrigin='anonymous';script.dataset.lexifranceSupabaseSdk='1';script.addEventListener('load',done,{once:true});script.addEventListener('error',()=>reject(new Error('SUPABASE_SDK_LOAD_FAILED')),{once:true});document.head.appendChild(script);
  });
  return sdkPromise;
}
async function getClient(){if(client)return client;const sdk=await ensureSdk();client=sdk.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return client}
async function taskTitles(){
  if(practiceTitles)return practiceTitles;
  practiceTitles=new Map();
  try{const response=await fetch('./content/practice/index.json',{cache:'no-store'});if(response.ok){const data=await response.json();for(const task of data.tasks||[])practiceTitles.set(task.id,task.title)}}catch{}
  return practiceTitles;
}
function formatDate(value){try{return new Intl.DateTimeFormat('ru-RU',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value))}catch{return String(value||'')}}
async function fetchEvidence(){
  if(!cloudRuntimeAllowed()||!navigator.onLine)return false;
  const meta=cloudMeta();if(!meta.userId)return false;
  const c=await getClient();const session=await c.auth.getSession();if(session.error||!session.data.session||session.data.session.user.id!==meta.userId)return false;
  const res=await c.from('skill_evidence').select('event_id,skill_id,area,source_type,source_id,difficulty,raw_score,confidence,weight,created_at').eq('source_type','practice').order('created_at',{ascending:false}).limit(80);
  if(res.error)throw res.error;writeCache(meta.userId,res.data||[]);lastFetchAt=Date.now();await render();return true;
}
function evidenceRow(row,titles){const skill=skillById.get(row.skill_id)||{title:row.skill_id};const taskTitle=titles.get(row.source_id)||row.source_id;const confidence=row.confidence==null?'не измерена':`${row.confidence}/5`;return `<article class="card evidence-trail-row"><div class="evidence-trail-head"><div><span class="tag">Practice Evidence · ${esc(row.area)}</span><h3>${esc(taskTitle)}</h3></div><b>${Math.round(Number(row.raw_score)||0)}/100</b></div><div class="evidence-trail-grid"><div><span>Навык</span><strong>${esc(skill.title)}</strong></div><div><span>Difficulty</span><strong>${Math.round(Number(row.difficulty)||0)}/10</strong></div><div><span>Confidence</span><strong>${esc(confidence)}</strong></div><div><span>Вес evidence</span><strong>${Math.round((Number(row.weight)||0)*100)}%</strong></div></div><p class="small">Accepted evidence от ${esc(formatDate(row.created_at))}. Эта запись участвует в расчете Proven/Calibrated для навыка «${esc(skill.title)}». Повтор той же Practice-задачи для этого навыка сервером повторно не засчитывается.</p></article>`}
async function render(){
  if((location.hash||'#home')!=='#profile')return;
  const root=document.querySelector('#root');if(!root)return;
  root.querySelector('[data-evidence-trail]')?.remove();
  const meta=cloudMeta();const rows=readCache(meta.userId);const titles=await taskTitles();
  const skillSection=[...root.querySelectorAll('.section')].find(section=>section.querySelector('.skill-list')||/Skill Graph/i.test(section.textContent||''));if(!skillSection)return;
  const body=rows.length?`<div class="evidence-trail-list">${rows.slice(0,8).map(row=>evidenceRow(row,titles)).join('')}</div>`:`<div class="card legal-card empty-state"><h3>Practice Evidence пока нет</h3><p>После первой синхронизированной Practice-задачи здесь появится точная запись: какая задача, какой навык, score, difficulty и confidence повлияли на Skill Graph.</p></div>`;
  skillSection.insertAdjacentHTML('afterend',`<section class="section evidence-trail" data-evidence-trail><div class="section-head"><div class="section-title"><div class="section-num">P3</div><h2>Practice Evidence trail</h2></div><div class="section-meta">${rows.length?`${rows.length} accepted`:'Explainability'}</div></div><p class="page-copy">Skill Graph не является «черным ящиком»: ниже показаны сервером принятые Practice Evidence, которые реально участвуют в расчете навыков.</p>${body}</section>`)
}
function schedule(ms=300){clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{render();if(Date.now()-lastFetchAt>1500)fetchEvidence().catch(error=>console.warn('LexiFrance evidence trail deferred',error))},ms)}
export function initSkillEvidenceTrail(){
  if(started)return;started=true;
  observer=new MutationObserver(()=>{if((location.hash||'#home')==='#profile')schedule(100)});observer.observe(document.querySelector('#root')||document.body,{childList:true,subtree:true});
  window.addEventListener('hashchange',()=>schedule(120));window.addEventListener('online',()=>schedule(200));window.addEventListener('lexifrance:skill-cache-updated',()=>schedule(100));window.addEventListener('lexifrance:evidence-queued',()=>schedule(900));
  [1000,2600,6000].forEach(ms=>setTimeout(()=>schedule(0),ms));render();
}
export async function refreshSkillEvidenceTrail(){return fetchEvidence()}
