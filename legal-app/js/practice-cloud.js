import { mergePracticeRows } from './practice-state.js';

const SUPABASE_URL='https://nnexhmzebviispxkpclx.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_91vY-4O1RkByvFz7IB_QPg_vwLt5AKN';
const SDK_URL='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.3';
const META_KEY='lexifrance-cloud-v1';
const QUEUE_KEY='lexifrance-practice-run-queue-v1';
const MAX_QUEUE=80;
let client=null,sdkPromise=null,started=false,retryTimer=null;
const safeParse=(value,fallback)=>{try{return JSON.parse(value||'')??fallback}catch{return fallback}};
const cloudMeta=()=>safeParse(localStorage.getItem(META_KEY),{});
const queue=()=>{const value=safeParse(localStorage.getItem(QUEUE_KEY),[]);return Array.isArray(value)?value:[]};
const writeQueue=rows=>localStorage.setItem(QUEUE_KEY,JSON.stringify(rows.slice(-MAX_QUEUE)));

function ensureSdk(){
  if(window.supabase?.createClient)return Promise.resolve(window.supabase);
  if(sdkPromise)return sdkPromise;
  sdkPromise=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-lexifrance-supabase-sdk]');
    const done=()=>window.supabase?.createClient?resolve(window.supabase):reject(new Error('SUPABASE_SDK_UNAVAILABLE'));
    if(existing){if(window.supabase?.createClient)return resolve(window.supabase);existing.addEventListener('load',done,{once:true});existing.addEventListener('error',()=>reject(new Error('SUPABASE_SDK_LOAD_FAILED')),{once:true});return}
    const script=document.createElement('script');script.src=SDK_URL;script.async=true;script.crossOrigin='anonymous';script.dataset.lexifranceSupabaseSdk='1';script.addEventListener('load',done,{once:true});script.addEventListener('error',()=>reject(new Error('SUPABASE_SDK_LOAD_FAILED')),{once:true});document.head.appendChild(script);
  });
  return sdkPromise;
}
async function getClient(){
  if(client)return client;
  const sdk=await ensureSdk();
  client=sdk.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return client;
}
function enqueue(detail){
  const rows=queue();
  if(rows.some(row=>row.eventId===detail.eventId))return;
  rows.push({eventId:detail.eventId,taskId:detail.taskId,practiceType:detail.practiceType,area:detail.area,difficulty:detail.difficulty,score:detail.score,confidence:detail.confidence,result:{taskId:detail.taskId,type:detail.practiceType,area:detail.area,answer:detail.answer,breakdown:detail.breakdown,remediation:detail.remediation,contentRelease:detail.contentRelease},createdAt:detail.completedAt||new Date().toISOString()});
  writeQueue(rows);
  schedule(250);
}
async function session(){
  const meta=cloudMeta();
  if(!meta.userId)return null;
  const c=await getClient();
  const res=await c.auth.getSession();
  if(res.error)throw res.error;
  return res.data.session||null;
}
export async function hydratePracticeRuns(){
  if(!navigator.onLine||!cloudMeta().userId)return false;
  const s=await session();if(!s)return false;
  const c=await getClient();
  const res=await c.from('practice_runs').select('event_id,practice_type,area,source_id,difficulty,score,confidence,result,created_at').order('created_at',{ascending:true}).limit(200);
  if(res.error)throw res.error;
  mergePracticeRows(res.data||[]);
  return true;
}
export async function flushPracticeRuns(){
  if(!navigator.onLine||!cloudMeta().userId||!queue().length)return false;
  const s=await session();if(!s)return false;
  const c=await getClient();
  let rows=queue();
  for(let guard=0;guard<MAX_QUEUE&&rows.length;guard++){
    const row=rows[0];
    const payload={user_id:s.user.id,event_id:row.eventId,practice_type:row.practiceType,area:row.area,source_id:row.taskId,difficulty:row.difficulty,score:row.score,confidence:row.confidence,result:row.result};
    const res=await c.from('practice_runs').insert(payload);
    if(res.error&&res.error.code!=='23505')throw res.error;
    rows.shift();writeQueue(rows);
  }
  return rows.length===0;
}
async function sync(){
  try{await hydratePracticeRuns();await flushPracticeRuns()}catch(error){console.warn('LexiFrance practice cloud deferred',error)}
}
function schedule(ms=1200){clearTimeout(retryTimer);retryTimer=setTimeout(()=>sync(),ms)}
function onLearning(event){const detail=event?.detail||{};if(detail.type==='practice_completed')enqueue(detail)}
export function initPracticeCloud(){
  if(started)return;started=true;
  window.addEventListener('lexifrance:learning-event',onLearning);
  window.addEventListener('online',()=>schedule(250));
  window.addEventListener('lexifrance:skill-cache-updated',()=>schedule(100));
  [900,2200,5000,10000].forEach(ms=>setTimeout(()=>{if(cloudMeta().userId)sync()},ms));
}
export function practiceCloudQueue(){return queue()}
