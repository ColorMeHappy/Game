const KEY='lexifrance-state-v3';
const today=()=>new Date().toISOString().slice(0,10);
const days=(a,b=today())=>a?Math.floor((new Date(b)-new Date(a))/86400000):9999;
const base=()=>({xp:0,streak:0,lastStudyDay:null,completed:[],quizResults:{},saved:[],mastery:{},caseHistory:{},name:'Petr',theme:'light',font:16,currentPath:'Corporate',currentLesson:null});
function migrate(){let s=null;try{s=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}if(s)return {...base(),...s};for(const k of ['lexifrance-state-v2','lexifrance-state']){try{s=JSON.parse(localStorage.getItem(k)||'null')}catch{}if(s)break}if(!s)return base();const n={...base(),...s};n.lastStudyDay=s.lastStudyDay||s.lastDay||null;n.mastery=s.mastery||{};(s.completed||[]).forEach(id=>{if(!n.mastery[id])n.mastery[id]={score:45,attempts:1,reviews:0,errors:0,lastSuccess:n.lastStudyDay}});return n}
export const state=migrate();
export function save(){localStorage.setItem(KEY,JSON.stringify(state))}
export function applyPrefs(){document.body.classList.toggle('dark',state.theme==='dark');document.documentElement.style.setProperty('--body-size',`${state.font||16}px`)}
export function setTheme(v){state.theme=v;save();applyPrefs()}
export function setFont(delta){state.font=Math.max(16,Math.min(20,(state.font||16)+delta));save();applyPrefs()}
function studyDay(){const t=today();if(state.lastStudyDay===t)return;if(state.lastStudyDay&&days(state.lastStudyDay,t)===1)state.streak=(state.streak||0)+1;else state.streak=1;state.lastStudyDay=t}
export function mastery(id){return state.mastery[id]||{score:0,attempts:0,reviews:0,errors:0,lastSuccess:null}}
export function masteryLabel(score){if(score>=90)return['Mastered','Освоено',5];if(score>=75)return['Applied','Применено',4];if(score>=55)return['Practiced','Практика',3];if(score>=35)return['Understood','Понято',2];if(score>=10)return['Seen','Просмотрено',1];return['New','Не начато',0]}
export function seen(id){const m=mastery(id);if(m.score<10)state.mastery[id]={...m,score:10};state.currentLesson=id;save()}
export function quizResult(id,pct,xp){const m={...mastery(id)};const prev=m.lastSuccess;const pass=pct>=.66;m.attempts=(m.attempts||0)+1;m.errors=(m.errors||0)+Math.round((1-pct)*4);let earned=0;if(pass){const first=!state.completed.includes(id);let target=pct===1?55:45;if(prev&&days(prev)>=7){target=Math.max(target,(m.score||0)+15);m.reviews=(m.reviews||0)+1}else if(!first)target=Math.max(target,(m.score||0)+5);m.score=Math.min(100,Math.max(m.score||0,target));m.lastSuccess=today();if(first){state.completed.push(id);earned=xp||0;state.xp+=earned}studyDay()}state.mastery[id]=m;state.quizResults[id]={pct,at:today(),pass};save();return{pass,earned,score:m.score}}
export function caseResult(c,perfect){const h=state.caseHistory[c.id]||{attempts:0,completed:false};h.attempts++;let earned=0;if(perfect){if(!h.completed){earned=c.xp||0;state.xp+=earned}h.completed=true;h.lastSuccess=today();for(const id of c.linkedLessons||[]){const m={...mastery(id)};m.score=Math.min(100,Math.max(m.score||0,75));m.lastSuccess=m.lastSuccess||today();state.mastery[id]=m}studyDay()}state.caseHistory[c.id]=h;save();return{earned}}
export function toggleSaved(id){const i=state.saved.indexOf(id);if(i>=0)state.saved.splice(i,1);else state.saved.push(id);save();return i<0}
export function pathMastery(ids){if(!ids?.length)return 0;return Math.round(ids.reduce((a,id)=>a+(mastery(id).score||0),0)/ids.length)}
export function dueReviews(ids){return(ids||[]).filter(id=>{const m=mastery(id);return m.lastSuccess&&days(m.lastSuccess)>=7&&m.score<90})}
const levels=[['Débutant',0],['Initié',250],['Entrepreneur',700],['Gestionnaire',1400],['Stratège',2400],['Expert',3800],['Corporate Master',5600]];
export function level(){let idx=0;for(let i=0;i<levels.length;i++)if(state.xp>=levels[i][1])idx=i;const cur=levels[idx],next=levels[idx+1]||[cur[0],cur[1]+800],range=next[1]-cur[1];return{name:cur[0],number:idx+1,start:cur[1],next:next[1],pct:Math.min(100,Math.round((state.xp-cur[1])/range*100)),inside:state.xp-cur[1],range}}
export function allMastery(){return state.mastery}
applyPrefs();
