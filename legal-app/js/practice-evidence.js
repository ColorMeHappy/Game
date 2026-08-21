import { evidenceQueue, replaceEvidenceQueue } from './learning-evidence.js';

const MAX_QUEUE=240;
const clampWeight=value=>Math.max(0.01,Math.min(1,Number(value)||1));

function normalizedSkills(ids=[],weights={}){
  const rows=(Array.isArray(ids)?ids:[]).map(skillId=>({skillId:String(skillId),weight:clampWeight(weights?.[skillId])})).filter(row=>row.skillId);
  const total=rows.reduce((sum,row)=>sum+row.weight,0)||1;
  return rows.map(row=>({...row,weight:row.weight/total}));
}
function enqueue(detail){
  const skills=normalizedSkills(detail.skillsMeasured,detail.skillWeights);
  if(!skills.length)return;
  const rows=evidenceQueue();
  for(const skill of skills){
    rows.push({
      eventId:detail.eventId,
      skillId:skill.skillId,
      area:detail.area||'General',
      sourceType:'practice',
      sourceId:detail.taskId,
      difficulty:Math.max(1,Math.min(10,Math.round(Number(detail.difficulty)||5))),
      rawScore:Math.max(0,Math.min(100,Number(detail.score)||0)),
      confidence:detail.confidence==null?null:Math.max(1,Math.min(5,Number(detail.confidence)||1)),
      weight:skill.weight,
      contentRelease:detail.contentRelease||null,
      createdAt:detail.completedAt||new Date().toISOString()
    });
  }
  replaceEvidenceQueue(rows.slice(-MAX_QUEUE));
  window.dispatchEvent(new CustomEvent('lexifrance:evidence-queued'));
}
function emitCalibration(detail){
  if(detail.confidence==null)return;
  const common={sourceType:'practice',sourceId:detail.taskId,confidence:detail.confidence,score:detail.score,practiceType:detail.practiceType};
  window.dispatchEvent(new CustomEvent('lexifrance:learning-event',{detail:{type:'confidence_submitted',eventId:detail.eventId,...common}}));
  if(Number(detail.confidence)>=4&&Number(detail.score)<50)window.dispatchEvent(new CustomEvent('lexifrance:learning-event',{detail:{type:'confidently_wrong',eventId:detail.eventId,...common}}));
}
function handle(event){
  const detail=event?.detail||{};
  if(detail.type!=='practice_completed')return;
  if(detail.eligibleForSkill!==false)enqueue(detail);
  emitCalibration(detail);
}
export function initPracticeEvidence(){
  if(window.__lexifrancePracticeEvidence)return;
  window.__lexifrancePracticeEvidence=true;
  window.addEventListener('lexifrance:learning-event',handle);
}
