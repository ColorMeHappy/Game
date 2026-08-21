const clamp=v=>Math.max(0,Math.min(100,Math.round(Number(v)||0)));

export function pairwiseOrderScore(order=[],correct=[]){
  let good=0,total=0;const pos=new Map(order.map((id,i)=>[id,i]));
  for(let i=0;i<correct.length;i++)for(let j=i+1;j<correct.length;j++){total++;if((pos.get(correct[i])??999)<(pos.get(correct[j])??-1))good++}
  return total?clamp(good/total*100):0;
}

export function evaluatePractice(task={},session={}){
  if(task.kind==='multi'){
    const correct=new Set((task.options||[]).filter(o=>o.correct).map(o=>o.id));
    const selected=session.selected instanceof Set?session.selected:new Set(Array.isArray(session.selected)?session.selected:[]);
    const tp=[...selected].filter(id=>correct.has(id)).length,fp=[...selected].filter(id=>!correct.has(id)).length;
    const recall=correct.size?tp/correct.size:1,precision=selected.size?tp/selected.size:0;
    return{score:clamp((recall*.55+precision*.45)*100),answer:[...selected],breakdown:{correctSelected:tp,incorrectSelected:fp,correctTotal:correct.size,recall:clamp(recall*100),precision:clamp(precision*100)}};
  }
  if(task.kind==='order')return{score:pairwiseOrderScore(session.order||[],task.correctOrder||[]),answer:[...(session.order||[])],breakdown:{pairwise:true}};
  if(task.kind==='date'){
    const value=String(session.input||''),correct=String(task.correctDate||'');let score=value&&value===correct?100:0;
    if(value&&correct&&score===0){const delta=Math.abs(new Date(`${value}T00:00:00Z`)-new Date(`${correct}T00:00:00Z`))/86400000;if(delta===1)score=50}
    return{score,answer:value,breakdown:{correctDate:correct}};
  }
  if(task.kind==='number'){
    const value=Number(session.input),correct=Number(task.correctValue),tolerance=Math.max(0,Number(task.tolerance)||0),distance=Number.isFinite(value)?Math.abs(value-correct):Infinity;let score=distance<=tolerance?100:0;
    if(score===0&&Number.isFinite(value)){const band=Math.max(Math.abs(correct)*.05,tolerance*5,1);if(distance<=band)score=60}
    return{score,answer:Number.isFinite(value)?value:null,breakdown:{correctValue:correct,tolerance}};
  }
  throw new Error(`PRACTICE_KIND ${task.kind||'missing'}`);
}

export function correctPracticeAnswer(task={}){
  if(task.kind==='multi')return(task.options||[]).filter(o=>o.correct).map(o=>o.text).join(' · ');
  if(task.kind==='order'){const byId=new Map((task.items||[]).map(i=>[i.id,i.text]));return(task.correctOrder||[]).map((id,i)=>`${i+1}. ${byId.get(id)||id}`).join(' → ')}
  if(task.kind==='date')return String(task.correctDate||'');
  if(task.kind==='number')return `${task.correctValue}${task.unit?` ${task.unit}`:''}`;
  return'';
}

export function validatePracticeTask(task={}){
  const errors=[];
  if(!/^practice-[a-z0-9-]+$/.test(String(task.id||'')))errors.push('stable id');
  if(!['issue_spotting','missing_facts','procedural_ordering','document_selection','deadline_lab','calculation_lab','strategy_lab'].includes(task.type))errors.push('type');
  if(!['multi','order','date','number'].includes(task.kind))errors.push('kind');
  if(!['Corporate','Tax','Immigration','Real Estate'].includes(task.area))errors.push('area');
  if(!(Number(task.difficulty)>=1&&Number(task.difficulty)<=10))errors.push('difficulty');
  if(!Array.isArray(task.skillsMeasured)||!task.skillsMeasured.length)errors.push('skillsMeasured');
  const sum=(task.skillsMeasured||[]).reduce((n,id)=>n+(Number(task.skillWeights?.[id])||0),0);if(Math.abs(sum-1)>.001)errors.push('skillWeights');
  if(!Array.isArray(task.remediation)||!task.remediation.length||task.remediation.some(r=>!r.lessonId||!r.target))errors.push('remediation');
  if(!Array.isArray(task.sources)||!task.sources.length||task.sources.some(s=>!/^https:\/\//.test(String(s.url||''))))errors.push('sources');
  if(!['CURRENT','UPDATED'].includes(task.status))errors.push('status');
  if(task.kind==='multi'&&(!(task.options||[]).some(o=>o.correct)||(task.options||[]).every(o=>o.correct)))errors.push('multi options');
  if(task.kind==='order'&&((task.correctOrder||[]).length!==(task.items||[]).length||new Set(task.correctOrder||[]).size!==(task.items||[]).length))errors.push('order');
  if(task.kind==='date'&&!/^\d{4}-\d{2}-\d{2}$/.test(String(task.correctDate||'')))errors.push('date');
  if(task.kind==='number'&&!Number.isFinite(Number(task.correctValue)))errors.push('number');
  return errors;
}
