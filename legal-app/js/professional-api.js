const SUPABASE_URL='https://nnexhmzebviispxkpclx.supabase.co';
const SUPABASE_KEY='sb_publishable_91vY-4O1RkByvFz7IB_QPg_vwLt5AKN';
const PROJECT_REF='nnexhmzebviispxkpclx';
const LOCAL=new Set(['localhost','127.0.0.1','::1']);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function tokenFromStorage(){for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i)||'';if(key!==`sb-${PROJECT_REF}-auth-token`&&!key.startsWith(`sb-${PROJECT_REF}-auth-token.`))continue;try{const p=JSON.parse(localStorage.getItem(key)||'null');for(const x of[p,p?.currentSession,p?.session,p?.data?.session])if(x?.access_token)return x.access_token}catch{}}return null}
export function professionalRemoteAllowed(){if(!navigator.onLine)return false;if(!LOCAL.has(location.hostname))return true;return new URLSearchParams(location.search).get('professional')==='live'}
export async function professionalToken(timeout=9000){const end=Date.now()+timeout;while(Date.now()<end){const t=tokenFromStorage();if(t)return t;await sleep(250)}return null}
export async function invokeProfessional(name,body={},opts={}){if(!professionalRemoteAllowed())throw new Error(navigator.onLine?'PROFESSIONAL_REMOTE_DISABLED':'OFFLINE');const token=await professionalToken(opts.timeout||9000);if(!token)throw new Error('AUTH_INITIALIZING');const r=await fetch(`${SUPABASE_URL}/functions/v1/${name}`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body),cache:'no-store'});const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch{data={error:text||`HTTP_${r.status}`}}if(!r.ok){const e=new Error(data?.error||`HTTP_${r.status}`);e.status=r.status;e.data=data;throw e}return data}
export const professionalEndpoint=name=>`${SUPABASE_URL}/functions/v1/${name}`;
