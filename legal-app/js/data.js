let index=null;const catalogs=new Map(),lessons=new Map(),details=new Map(),cases=new Map();let caseIndex=null,updates=null,searchData=null;
async function get(url){const r=await fetch(url);if(!r.ok)throw new Error(`LOAD ${url} ${r.status}`);return r.json()}
export async function boot(){index=await get('./content/app-index.json');return index}
export const idx=()=>index;
export function pathForLesson(id){return index.paths.find(p=>p.lessonIds.includes(id))?.id||'Corporate'}
export async function catalog(path){if(catalogs.has(path))return catalogs.get(path);const p=index.paths.find(x=>x.id===path);if(!p)return[];const rows=[];for(const f of p.catalogFiles){const d=await get(`./${f}`);rows.push(...d.items)}catalogs.set(path,rows);return rows}
export async function catalogItem(id){const p=pathForLesson(id);return(await catalog(p)).find(x=>x.id===id)}
export async function lesson(id){if(lessons.has(id))return lessons.get(id);const l=await get(`./${index.lessonBase}${id}.json`);lessons.set(id,l);return l}
export async function lessonDetails(l){if(!l.detailFiles?.length)return{sections:l.sections||[],numbers:l.numbers||[],learningObjectives:l.learningObjectives||[],sourceUrls:l.sourceUrls||[l.sourceUrl].filter(Boolean)};if(details.has(l.id))return details.get(l.id);const out={sections:[],numbers:[],learningObjectives:[],sourceUrls:[]};for(const f of l.detailFiles){const d=await get(`./${f}`);for(const k of Object.keys(out))if(d[k])out[k].push(...d[k])}details.set(l.id,out);return out}
export async function casesList(){if(caseIndex)return caseIndex;const out=[];for(const f of index.caseIndexFiles){const d=await get(`./${f}`);out.push(...d.cases)}caseIndex=out;return out}
export async function oneCase(id){if(cases.has(id))return cases.get(id);const c=await get(`./${index.caseBase}${id}.json`);cases.set(id,c);return c}
export async function legalUpdates(){if(updates)return updates;updates=(await get(`./${index.updatesFile}`)).updates||[];return updates}
export async function searchIndex(){if(searchData)return searchData;const out=[];for(const f of index.searchFiles){const d=await get(`./${f}`);out.push(...d.items)}searchData=out;return out}
const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zа-яё0-9%€]+/gi,' ').trim();
export async function search(q){const query=norm(q);if(!query)return[];const words=query.split(/\s+/).filter(x=>x.length>1),rows=await searchIndex(),cs=await casesList();const score=(r)=>{const title=norm(r.title),summary=norm(r.summary||r.prompt),aliases=norm([r.keywords,...(r.synonyms||[]),...(r.tags||[]),...(r.scenarios||[])].join(' '));let s=title.includes(query)?18:0;s+=summary.includes(query)?10:0;s+=aliases.includes(query)?14:0;for(const w of words){if(title.includes(w))s+=5;if(summary.includes(w))s+=2;if(aliases.includes(w))s+=4}return s};return[...rows.map(r=>({type:'lesson',item:r,score:score(r)})),...cs.map(r=>({type:'case',item:r,score:score(r)}))].filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,18)}
export async function relatedCases(ids){const list=await casesList();return list.filter(c=>ids.includes(c.id))}
export async function relatedLessons(ids){const out=[];for(const id of ids||[]){try{out.push(await catalogItem(id))}catch{}}return out.filter(Boolean)}
export async function recommendedCase(){const list=await casesList();return list.find(c=>c.id===index.homeCase)||list[0]}
