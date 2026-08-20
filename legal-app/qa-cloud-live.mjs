import { chromium, devices } from 'playwright';
import { randomUUID } from 'node:crypto';

const BASE=process.env.LEXIFRANCE_BASE_URL||'http://127.0.0.1:4173/legal-app/';
const SUPABASE_URL='https://nnexhmzebviispxkpclx.supabase.co';
const SUPABASE_KEY='sb_publishable_91vY-4O1RkByvFz7IB_QPg_vwLt5AKN';
const PROJECT_REF='nnexhmzebviispxkpclx';
const failures=[];
let userA=null,userB=null;
const check=(value,message)=>{if(value)console.log(`PASS: ${message}`);else{failures.push(message);console.error(`FAIL: ${message}`)}};

async function cloudMeta(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('lexifrance-cloud-v1')||'{}'))}
async function waitSynced(page){await page.waitForFunction(()=>{try{const m=JSON.parse(localStorage.getItem('lexifrance-cloud-v1')||'{}');return !!m.userId&&m.initialized===true&&m.status==='synced'&&Number(m.pending||0)===0}catch{return false}},null,{timeout:30000});return cloudMeta(page)}
async function authSession(page){return page.evaluate(ref=>{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i)||'';if(key!==`sb-${ref}-auth-token`&&!key.startsWith(`sb-${ref}-auth-token.`))continue;try{const parsed=JSON.parse(localStorage.getItem(key)||'null');for(const row of [parsed,parsed?.currentSession,parsed?.session,parsed?.data?.session])if(row?.access_token)return{accessToken:row.access_token,refreshToken:row.refresh_token||null,userId:row.user?.id||null}}catch{}}return null},PROJECT_REF)}
async function rest(token,path,{method='GET',body=null,prefer='return=representation'}={}){const headers={apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`,Accept:'application/json'};if(body!==null)headers['Content-Type']='application/json';if(prefer)headers.Prefer=prefer;const response=await fetch(`${SUPABASE_URL}${path}`,{method,headers,body:body===null?undefined:JSON.stringify(body)});const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}if(!response.ok)throw new Error(`${method} ${path} -> ${response.status}: ${typeof data==='string'?data:JSON.stringify(data)}`);return{status:response.status,data}}
async function mutateName(page,value){await page.evaluate(async name=>{const mod=await import('./js/state.js');mod.state.name=name;mod.save()},value)}
async function ownState(token,userId){const result=await rest(token,`/rest/v1/user_state?select=user_id,state_version,state,content_release&user_id=eq.${encodeURIComponent(userId)}`);return Array.isArray(result.data)?result.data[0]:null}

const browser=await chromium.launch({headless:true});
const contextA=await browser.newContext({...devices['iPhone 15']});
const pageA=await contextA.newPage();pageA.setDefaultTimeout(15000);
let contextB=null;
try{
  await pageA.goto(`${BASE}?cloud=live#home`,{waitUntil:'domcontentloaded'});
  let metaA=await waitSynced(pageA);userA=metaA.userId;
  const sessionA=await authSession(pageA);
  check(!!userA&&!!sessionA?.accessToken,'fresh browser creates a real anonymous cloud session');
  check(sessionA?.userId===userA||!sessionA?.userId,'browser auth token belongs to cloud meta user');

  const marker=`Cloud QA ${Date.now()}`;
  await mutateName(pageA,marker);
  await waitSynced(pageA);
  let rowA=await ownState(sessionA.accessToken,userA);
  check(rowA?.state?.name===marker,'local progress synchronizes to user_state');

  await pageA.reload({waitUntil:'domcontentloaded'});
  metaA=await waitSynced(pageA);
  check(metaA.userId===userA,'reload preserves the same anonymous identity');
  check(await pageA.evaluate(()=>JSON.parse(localStorage.getItem('lexifrance-state-v5')||'{}').name)===marker,'reload preserves synchronized progress');

  await contextA.setOffline(true);
  const offlineMarker=`Cloud QA offline ${Date.now()}`;
  await mutateName(pageA,offlineMarker);
  await pageA.waitForTimeout(150);
  const offlineQueue=await pageA.evaluate(()=>JSON.parse(localStorage.getItem('lexifrance-sync-queue-v1')||'[]').length);
  check(offlineQueue>0,'offline state change enters the local sync queue');
  await contextA.setOffline(false);
  await waitSynced(pageA);
  rowA=await ownState(sessionA.accessToken,userA);
  check(rowA?.state?.name===offlineMarker,'offline change synchronizes after reconnect');

  const baseVersion=Number(rowA.state_version||0),eventId=randomUUID();
  const payload={...(rowA.state||{}),qaCasMarker:'first'};
  const first=(await rest(sessionA.accessToken,'/rest/v1/rpc/save_user_state',{method:'POST',body:{p_expected_version:baseVersion,p_event_id:eventId,p_payload:payload,p_device_id:'qa-cloud-live',p_content_release:'qa'}})).data;
  check(first?.status==='ok','CAS save accepts the current state version');
  const duplicate=(await rest(sessionA.accessToken,'/rest/v1/rpc/save_user_state',{method:'POST',body:{p_expected_version:baseVersion,p_event_id:eventId,p_payload:payload,p_device_id:'qa-cloud-live',p_content_release:'qa'}})).data;
  check(duplicate?.status==='duplicate','replayed event ID is idempotent');
  const conflict=(await rest(sessionA.accessToken,'/rest/v1/rpc/save_user_state',{method:'POST',body:{p_expected_version:baseVersion,p_event_id:randomUUID(),p_payload:{...payload,qaCasMarker:'stale'},p_device_id:'qa-cloud-live-2',p_content_release:'qa'}})).data;
  check(conflict?.status==='conflict','stale state version returns an explicit conflict');

  contextB=await browser.newContext({...devices['iPhone 15']});
  const pageB=await contextB.newPage();pageB.setDefaultTimeout(15000);
  await pageB.goto(`${BASE}?cloud=live#home`,{waitUntil:'domcontentloaded'});
  const metaB=await waitSynced(pageB);userB=metaB.userId;
  const sessionB=await authSession(pageB);
  check(!!userB&&userB!==userA,'second browser receives an isolated anonymous identity');
  const crossRead=await rest(sessionB.accessToken,`/rest/v1/user_state?select=user_id,state_version&user_id=eq.${encodeURIComponent(userA)}`);
  check(Array.isArray(crossRead.data)&&crossRead.data.length===0,'RLS blocks user B from reading user A state');
  const crossUpdate=await rest(sessionB.accessToken,`/rest/v1/user_state?user_id=eq.${encodeURIComponent(userA)}`,{method:'PATCH',body:{content_release:'qa-cross-user'},prefer:'return=representation'});
  check(Array.isArray(crossUpdate.data)&&crossUpdate.data.length===0,'RLS blocks user B from updating user A state');
  const afterCross=await ownState(sessionA.accessToken,userA);
  check(afterCross?.content_release!=='qa-cross-user','cross-user update cannot alter owner data');

  const qaEmail=`lexifrance-qa-${Date.now()}@example.com`;
  const upgrade=await pageA.evaluate(async email=>{try{const mod=await import('./js/cloud.js');const before=mod.getCloudStatus();await mod.requestAccountUpgrade(email);const after=mod.getCloudStatus();return{ok:true,before,after}}catch(error){return{ok:false,error:String(error?.message||error)}}},qaEmail);
  if(!upgrade.ok){failures.push(`anonymous -> permanent email linking failed: ${upgrade.error}`);console.error(`FAIL: anonymous -> permanent email linking failed: ${upgrade.error}`)}else{
    check(upgrade.before?.userId===userA&&upgrade.after?.userId===userA,'email upgrade initiation preserves the anonymous user ID and progress owner');
    check(upgrade.after?.email===qaEmail,'email upgrade request is attached to the same cloud account');
  }
} catch(error){failures.push(error.message||String(error));console.error('FAIL:',error)} finally {
  console.log(`QA_CLOUD_USERS A=${userA||'none'} B=${userB||'none'}`);
  if(contextB)await contextB.close();
  await contextA.close();
  await browser.close();
}
if(failures.length){console.error(`CLOUD LIVE QA FAILED ${failures.length}`);for(const failure of failures)console.error(` - ${failure}`);process.exit(1)}
console.log('CLOUD LIVE QA PASSED');
