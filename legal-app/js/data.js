import{rankSearch}from'./search-core.js';
let index=null;const catalogs=new Map(),lessons=new Map(),quizzes=new Map(),caseBundles=new Map(),cases=new Map();let caseIndex=null,updates=null,searchData=null;
async function get(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`LOAD ${url} ${r.status}`);return r.json()}
const normalizeMeta=d=>{if(!d||typeof d!=='object')return d;if(!d.schemaVersion)d.schemaVersion=index?.schemaVersion||d.version||'5.1.0';if(!d.contentRelease)d.contentRelease=index?.contentRelease||d.contentVersion||'unknown';delete d.version;delete d.contentVersion;return d};
const prepareCase=c=>{for(const t of c.tasks||[]){if(t.kind==='order'&&!Array.isArray(t.initialOrder)){const ids=(t.items||[]).map(x=>x.id);t.initialOrder=ids.length>1?[...ids.slice(1),ids[0]]:ids}}return c};
export async function boot(){index=normalizeMeta(await get('./content/app-index.json'));return index}
export const idx=()=>index;
export const contentRelease=()=>index?.contentRelease||'unknown';
export function mapLessonId(id){return index?.legacyLessonMap?.[id]||id}
export function pathForLesson(id){id=mapLessonId(id);return index.paths.find(p=>p.lessonIds.includes(id))?.id||'Corporate'}
export async function catalog(path){if(catalogs.has(path))return catalogs.get(path);const p=index.paths.find(x=>x.id===path);if(!p)return[];const rows=[];for(const f of p.catalogFiles){const d=normalizeMeta(await get(`./${f}`));rows.push(...d.items.map(x=>normalizeMeta(x)))}catalogs.set(path,rows);return rows}
export async function catalogItem(id){id=mapLessonId(id);const p=pathForLesson(id);return(await catalog(p)).find(x=>x.id===id)}
export async function lesson(id){id=mapLessonId(id);if(lessons.has(id))return lessons.get(id);const l=normalizeMeta(await get(`./${index.lessonBase}${id}.json`));lessons.set(id,l);return l}
export async function quizPack(id){id=mapLessonId(id);if(quizzes.has(id))return quizzes.get(id);const q=normalizeMeta(await get(`./${index.quizBase}${id}.json`));if(q.lessonId!==id)throw new Error(`QUIZ ID ${id}`);if((q.questions||[]).length!==10)throw new Error(`QUIZ COUNT ${id}`);quizzes.set(id,q);return q}
export async function casesList(){if(caseIndex)return caseIndex;const d=normalizeMeta(await get(`./${index.caseIndexFile}`));caseIndex=(d.cases||[]).map(raw=>normalizeMeta({...raw,linkedLessons:[...new Set((raw.linkedLessons||[]).map(mapLessonId))]}));return caseIndex}
async function loadCaseBundle(file){if(caseBundles.has(file))return caseBundles.get(file);const d=normalizeMeta(await get(`./${file}`));for(const raw of d.cases||[]){const c=prepareCase(normalizeMeta({...raw,linkedLessons:[...new Set((raw.linkedLessons||[]).map(mapLessonId))]}));cases.set(c.id,c)}caseBundles.set(file,d);return d}
export async function oneCase(id){if(cases.has(id))return cases.get(id);const item=(await casesList()).find(c=>c.id===id);if(!item)throw new Error(`CASE ${id}`);await loadCaseBundle(item.bundle);const c=cases.get(id);if(!c)throw new Error(`CASE BUNDLE ${id}`);return c}
export const usableStatus=s=>s==='CURRENT'||s==='UPDATED';
export async function legalUpdates(){if(updates)return updates;const d=normalizeMeta(await get(`./${index.updatesFile}`));updates=(d.updates||[]).map(normalizeMeta);return updates}
export async function updatesForLesson(id){id=mapLessonId(id);return(await legalUpdates()).filter(u=>(u.affectedLessons||[]).map(mapLessonId).includes(id)&&usableStatus(u.status))}
export async function searchIndex(){if(searchData)return searchData;const out=[];for(const f of index.searchFiles||[]){const d=normalizeMeta(await get(`./${f}`));out.push(...(d.items||[]).map(x=>({...normalizeMeta(x),type:'lesson'}))}for(const c of await casesList())out.push({...c,type:'case'});searchData=out;return out}
export async function search(q){return(await rankSearch(await searchIndex(),q,18)).map(x=>({type:x.entry.type,item:x.entry,score:x.score}))}
export async function relatedCases(ids){const list=await casesList();return list.filter(c=>(ids||[]).includes(c.id))}
export async function relatedLessons(ids){const out=[];for(const raw of ids||[]){const id=mapLessonId(raw);try{const x=await catalogItem(id);if(x&&!out.some(y=>y.id===x.id))out.push(x)}catch{}}return out}
export async function recommendedCase(weakTargets=[]){const list=(await casesList()).filter(c=>usableStatus(c.status));if(weakTargets.length){const hit=list.find(c=>(c.relatedSubtopics||[]).some(x=>weakTargets.includes(x?.target||x)));if(hit)return hit}return list.find(c=>c.id===index.homeCase)||list[0]||null}