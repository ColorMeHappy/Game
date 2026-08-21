import { state, save } from './state.js';

const clone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));
const iso=()=>new Date().toISOString();
const uuid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
const empty=()=>({attempts:0,completedRuns:0,bestScore:0,lastScore:0,xpAwarded:false,lastCompletedAt:null,events:{}});

function history(create=false){
  if(state.practiceHistory&&typeof state.practiceHistory==='object')return state.practiceHistory;
  if(!create)return null;
  state.practiceHistory={};
  return state.practiceHistory;
}
function normalized(row={}){
  return{...empty(),...row,events:row.events&&typeof row.events==='object'?row.events:{}};
}
function recalcXp(){
  state.xpLedger=state.xpLedger&&typeof state.xpLedger==='object'?state.xpLedger:{};
  state.xp=Object.values(state.xpLedger).reduce((sum,row)=>sum+Math.max(0,Number(row?.amount)||0),0);
}
function awardXp(taskId,amount){
  state.xpLedger=state.xpLedger&&typeof state.xpLedger==='object'?state.xpLedger:{};
  const key=`practice:${taskId}`;
  if(state.xpLedger[key]){recalcXp();return 0}
  const safe=Math.max(0,Number(amount)||0);
  if(!safe)return 0;
  state.xpLedger[key]={amount:safe,awardedAt:iso()};
  recalcXp();
  return safe;
}

export function practiceSummary(taskId){
  const h=history(false);
  return normalized(h?.[taskId]);
}

export function recordPractice(task,result={}){
  if(!task?.id)throw new Error('PRACTICE_TASK_REQUIRED');
  const h=history(true);
  const current=normalized(h[task.id]);
  const eventId=String(result.eventId||uuid());
  if(current.events[eventId])return{...clone(current.events[eventId]),duplicate:true,summary:clone(current)};
  const score=Math.max(0,Math.min(100,Math.round(Number(result.score)||0)));
  const confidence=result.confidence==null?null:Math.max(1,Math.min(5,Math.round(Number(result.confidence)||1)));
  const firstEvidence=current.completedRuns===0;
  const completedAt=iso();
  const run={eventId,taskId:task.id,type:task.type,area:task.area,score,confidence,answer:clone(result.answer),breakdown:clone(result.breakdown||{}),completedAt,contentRelease:task.contentRelease||result.contentRelease||null};
  current.events[eventId]=run;
  const eventRows=Object.values(current.events).sort((a,b)=>String(a.completedAt).localeCompare(String(b.completedAt)));
  while(eventRows.length>12){const removed=eventRows.shift();delete current.events[removed.eventId]}
  current.attempts+=1;
  current.completedRuns+=1;
  current.bestScore=Math.max(current.bestScore,score);
  current.lastScore=score;
  current.lastCompletedAt=completedAt;
  const earned=awardXp(task.id,task.xp||0);
  current.xpAwarded=current.xpAwarded||earned>0||!!state.xpLedger?.[`practice:${task.id}`];
  h[task.id]=current;
  save();
  const detail={
    type:'practice_completed',eventId,taskId:task.id,practiceType:task.type,area:task.area,
    difficulty:task.difficulty,score,confidence,answer:clone(result.answer),breakdown:clone(result.breakdown||{}),
    skillsMeasured:[...(task.skillsMeasured||[])],skillWeights:{...(task.skillWeights||{})},
    remediation:clone(task.remediation||[]),contentRelease:task.contentRelease||result.contentRelease||null,
    eligibleForSkill:firstEvidence,xpEarned:earned,completedAt
  };
  window.dispatchEvent(new CustomEvent('lexifrance:learning-event',{detail}));
  return{...run,earned,eligibleForSkill:firstEvidence,summary:clone(current)};
}

export function mergePracticeRows(rows=[]){
  if(!Array.isArray(rows)||!rows.length)return false;
  const h=history(true);
  let changed=false;
  for(const row of rows){
    const taskId=String(row.source_id||row.sourceId||row.result?.taskId||'');
    const eventId=String(row.event_id||row.eventId||'');
    if(!taskId||!eventId)continue;
    const current=normalized(h[taskId]);
    if(current.events[eventId])continue;
    const score=Math.max(0,Math.min(100,Math.round(Number(row.score)||0)));
    const completedAt=row.created_at||row.createdAt||iso();
    current.events[eventId]={eventId,taskId,type:row.practice_type||row.practiceType||row.result?.type||'practice',area:row.area||row.result?.area||'General',score,confidence:row.confidence??null,answer:clone(row.result?.answer||null),breakdown:clone(row.result?.breakdown||{}),completedAt,contentRelease:row.result?.contentRelease||null};
    current.completedRuns=Math.max(current.completedRuns+1,Object.keys(current.events).length);
    current.attempts=Math.max(current.attempts+1,current.completedRuns);
    current.bestScore=Math.max(current.bestScore,score);
    if(!current.lastCompletedAt||String(completedAt)>=String(current.lastCompletedAt)){current.lastCompletedAt=completedAt;current.lastScore=score}
    current.xpAwarded=current.xpAwarded||!!state.xpLedger?.[`practice:${taskId}`];
    h[taskId]=current;
    changed=true;
  }
  if(changed)save();
  return changed;
}

export function practiceCompletedCount(){
  const h=history(false)||{};
  return Object.values(h).filter(row=>Number(row?.completedRuns)>0).length;
}

export function practiceStateSnapshot(){return clone(history(false)||{})}
