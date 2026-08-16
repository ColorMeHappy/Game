let index=null;const catalogs=new Map(),lessons=new Map(),quizzes=new Map(),cases=new Map();let caseIndex=null,updates=null,searchData=null;
async function get(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`LOAD ${url} ${r.status}`);return r.json()}
export async function boot(){index=await get('./content/app-index.json');return index}
export const idx=()=>index;
export const contentVersion=()=>index?.contentVersion||index?.version||'unknown';
export function mapLessonId(id){return index?.legacyLessonMap?.[id]||id}
export function pathForLesson(id){id=mapLessonId(id);return index.paths.find(p=>p.lessonIds.includes(id))?.id||'Corporate'}
export async function catalog(path){if(catalogs.has(path))return catalogs.get(path);const p=index.paths.find(x=>x.id===path);if(!p)return[];const rows=[];for(const f of p.catalogFiles){const d=await get(`./${f}`);rows.push(...d.items)}catalogs.set(path,rows);return rows}
export async function catalogItem(id){id=mapLessonId(id);const p=pathForLesson(id);return(await catalog(p)).find(x=>x.id===id)}
export async function lesson(id){id=mapLessonId(id);if(lessons.has(id))return lessons.get(id);const l=await get(`./${index.lessonBase}${id}.json`);lessons.set(id,l);return l}
export async function quizPack(id){id=mapLessonId(id);if(quizzes.has(id))return quizzes.get(id);const q=await get(`./${index.quizBase||'content/quizzes/'}${id}.json`);if(q.lessonId!==id)throw new Error(`QUIZ ID ${id}`);if((q.questions||[]).length!==10)throw new Error(`QUIZ COUNT ${id}`);quizzes.set(id,q);return q}
export async function casesList(){if(caseIndex)return caseIndex;const out=[];for(const f of index.caseIndexFiles){const d=await get(`./${f}`);for(const raw of d.cases){const c={...raw,linkedLessons:[...new Set((raw.linkedLessons||[]).map(mapLessonId))]};out.push(c)}}caseIndex=out;return out}
export async function oneCase(id){if(cases.has(id))return cases.get(id);const c=await get(`./${index.caseBase}${id}.json`);c.linkedLessons=[...new Set((c.linkedLessons||[]).map(mapLessonId))];cases.set(id,c);return c}
export const usableStatus=s=>s==='CURRENT'||s==='UPDATED';
export async function legalUpdates(){if(updates)return updates;updates=(await get(`./${index.updatesFile}`)).updates||[];return updates}
export async function updatesForLesson(id){id=mapLessonId(id);return(await legalUpdates()).filter(u=>(u.affectedLessons||[]).map(mapLessonId).includes(id)&&usableStatus(u.status))}
export async function searchIndex(){if(searchData)return searchData;const out=[];if(index.searchFiles?.length){for(const f of index.searchFiles){const d=await get(`./${f}`);out.push(...d.items)}}else{for(const p of index.paths)out.push(...await catalog(p.id))}searchData=out;return out}
const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zа-яё0-9%€]+/gi,' ').trim();
export async function search(q){const query=norm(q);if(!query)return[];const words=query.split(/\s+/).filter(x=>x.length>1),rows=await searchIndex(),cs=await casesList();const score=r=>{const title=norm(r.title),summary=norm(r.summary||r.prompt),aliases=norm([r.keywords,...(r.synonyms||[]),...(r.tags||[]),...(r.scenarios||[]),...(r.userQuestions||[]),...(r.legalTerms||[])].join(' '));let s=title.includes(query)?22:0;s+=summary.includes(query)?12:0;s+=aliases.includes(query)?18:0;for(const w of words){if(title.includes(w))s+=6;if(summary.includes(w))s+=3;if(aliases.includes(w))s+=5}return s};return[...rows.map(r=>({type:'lesson',item:r,score:score(r)})),...cs.map(r=>({type:'case',item:r,score:score(r)}))].filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,18)}
export async function relatedCases(ids){const list=await casesList();return list.filter(c=>(ids||[]).includes(c.id))}
export async function relatedLessons(ids){const out=[];for(const raw of ids||[]){const id=mapLessonId(raw);try{const x=await catalogItem(id);if(x&&!out.some(y=>y.id===x.id))out.push(x)}catch{}}return out}
export async function recommendedCase(){const list=await casesList();return list.find(c=>c.id===index.homeCase&&usableStatus(c.status))||list.find(c=>usableStatus(c.status))||null}