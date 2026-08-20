const CACHE_PREFIX='lexifrance-skill-cache-v1:';
const CLOUD_META_KEY='lexifrance-cloud-v1';

export const SKILL_DEFINITIONS=[
  {id:'issue_spotting',title:'Issue Spotting',description:'Находит юридически значимые проблемы в фактах.',category:'Reasoning'},
  {id:'fact_analysis',title:'Fact Analysis',description:'Отделяет юридически значимые факты от второстепенных.',category:'Reasoning'},
  {id:'missing_facts',title:'Missing Facts Detection',description:'Определяет, каких фактов не хватает для надежного вывода.',category:'Reasoning'},
  {id:'legal_qualification',title:'Legal Qualification',description:'Правильно квалифицирует факты и правоотношения.',category:'Knowledge/Application'},
  {id:'rule_identification',title:'Rule Identification',description:'Определяет применимые нормы, условия и исключения.',category:'Knowledge/Application'},
  {id:'evidence_analysis',title:'Evidence Analysis',description:'Оценивает доказательственную ценность и пробелы.',category:'Evidence'},
  {id:'document_analysis',title:'Document Analysis',description:'Анализирует юридические документы и их последствия.',category:'Evidence'},
  {id:'procedural_reasoning',title:'Procedural Reasoning',description:'Выстраивает корректную процессуальную последовательность.',category:'Procedure'},
  {id:'deadline_calculation',title:'Deadline Calculation',description:'Распознает и рассчитывает юридические сроки.',category:'Procedure'},
  {id:'numerical_calculation',title:'Numerical / Tax Calculation',description:'Корректно выполняет юридические и налоговые расчеты.',category:'Calculation'},
  {id:'strategy',title:'Strategy',description:'Строит последовательную и реалистичную legal strategy.',category:'Strategy'},
  {id:'risk_analysis',title:'Risk Analysis',description:'Выявляет и приоритизирует юридические риски.',category:'Strategy'},
  {id:'legal_research',title:'Legal Research',description:'Формулирует и проводит юридический поиск.',category:'Research'},
  {id:'source_selection',title:'Source Selection',description:'Выбирает релевантные и надежные источники права.',category:'Research'},
  {id:'argumentation',title:'Argumentation',description:'Строит юридически обоснованную позицию.',category:'Advocacy'},
  {id:'counterargument',title:'Counterargument',description:'Выявляет и отвечает на сильные контраргументы.',category:'Advocacy'},
  {id:'drafting',title:'Drafting',description:'Готовит структурированные юридические тексты.',category:'Communication'},
  {id:'client_communication',title:'Client Communication',description:'Собирает и объясняет юридически значимую информацию клиенту.',category:'Communication'},
  {id:'decision_making',title:'Decision Making',description:'Принимает решение на основании права, фактов и рисков.',category:'Judgment'},
  {id:'professional_judgment',title:'Professional Judgment',description:'Калибрует выводы, неопределенность и альтернативные решения.',category:'Judgment'}
];

const byId=new Map(SKILL_DEFINITIONS.map(row=>[row.id,row]));
const safeParse=(value,fallback)=>{try{return JSON.parse(value||'')??fallback}catch{return fallback}};
const clamp=value=>Math.max(0,Math.min(100,Number(value)||0));
const activeUserId=()=>safeParse(localStorage.getItem(CLOUD_META_KEY),{}).userId||null;
const cacheKey=userId=>userId?`${CACHE_PREFIX}${userId}`:null;

function normalize(row={}){
  const skillId=String(row.skillId||row.skill_id||'');
  const definition=byId.get(skillId)||{id:skillId,title:skillId,description:'',category:'Other'};
  return{
    skillId,
    title:definition.title,
    description:definition.description,
    category:definition.category,
    area:String(row.area||'General'),
    score:clamp(row.score??row.confidenceAdjustedScore??row.confidence_adjusted_score),
    provenScore:clamp(row.provenScore??row.proven_score),
    confidenceAdjustedScore:clamp(row.confidenceAdjustedScore??row.confidence_adjusted_score??row.score),
    freshnessScore:clamp(row.freshnessScore??row.freshness_score),
    evidenceCount:Math.max(0,Number(row.evidenceCount??row.evidence_count)||0),
    updatedAt:row.updatedAt||row.updated_at||new Date().toISOString()
  };
}

function read(userId=activeUserId()){
  const key=cacheKey(userId);
  if(!key)return{userId:null,rows:[],updatedAt:null};
  const value=safeParse(localStorage.getItem(key),{});
  return{userId,rows:Array.isArray(value.rows)?value.rows.map(normalize):[],updatedAt:value.updatedAt||null};
}

function write(userId,rows){
  const key=cacheKey(userId);
  if(!key)return;
  const payload={userId,rows:rows.map(normalize),updatedAt:new Date().toISOString()};
  localStorage.setItem(key,JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('lexifrance:skill-cache-updated',{detail:{userId,count:payload.rows.length}}));
}

export function replaceSkillCache(rows,userId=activeUserId()){
  if(!userId)return;
  const deduped=new Map();
  for(const row of Array.isArray(rows)?rows:[]){const normalized=normalize(row);if(normalized.skillId)deduped.set(`${normalized.skillId}|${normalized.area}`,normalized)}
  write(userId,[...deduped.values()]);
}

export function mergeSkillResult(row,userId=activeUserId()){
  if(!userId||!row)return;
  const current=read(userId).rows;
  const normalized=normalize(row);
  const key=`${normalized.skillId}|${normalized.area}`;
  const next=current.filter(item=>`${item.skillId}|${item.area}`!==key);
  next.push(normalized);
  write(userId,next);
}

export function skillRows(userId=activeUserId()){
  return read(userId).rows.sort((a,b)=>b.evidenceCount-a.evidenceCount||b.provenScore-a.provenScore||a.title.localeCompare(b.title));
}

export function skillCacheInfo(userId=activeUserId()){
  const value=read(userId);
  return{userId:value.userId,count:value.rows.length,updatedAt:value.updatedAt};
}

export function clearSkillCache(userId=activeUserId()){
  const key=cacheKey(userId);
  if(key)localStorage.removeItem(key);
}
