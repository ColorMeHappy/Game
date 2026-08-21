import { practiceSummary, recordPractice, practiceCompletedCount } from './practice-state.js';
import { evaluatePractice, correctPracticeAnswer } from './practice-core.js';

const PACK_URL='./content/practice/index.json';
const TYPE_LABELS={issue_spotting:'Issue Spotting',missing_facts:'Missing Facts',procedural_ordering:'Procedural Ordering',document_selection:'Document Selection',deadline_lab:'Deadline Lab',calculation_lab:'Calculation Lab',strategy_lab:'Strategy Lab'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uuid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`;
let pack=null,observer=null,mounted=false;

async function loadPack(){
  if(pack)return pack;
  const response=await fetch(PACK_URL,{cache:'no-store'});
  if(!response.ok)throw new Error(`PRACTICE LOAD ${response.status}`);
  const data=await response.json();
  if(!Array.isArray(data.tasks)||data.tasks.length<7)throw new Error('PRACTICE SCHEMA');
  for(const task of data.tasks)task.contentRelease=task.contentRelease||data.contentRelease;
  pack=data;return data;
}
function modeCount(tasks,type){return tasks.filter(task=>task.type===type).length}
function practiceSection(tasks){
  const completed=practiceCompletedCount();
  const modes=Object.keys(TYPE_LABELS);
  return `<section class="section practice-lab" data-practice-lab><div class="section-head"><div class="section-title"><div class="section-num">P3</div><h2>Practice Lab</h2></div><div class="section-meta">${completed}/${tasks.length} выполнено</div></div><p class="page-copy practice-copy">Короткие детерминированные тренажеры юридического мышления. Оценка считается по фиксированным правилам, не меняет Lesson Mastery и не использует генеративный AI.</p><div class="practice-mode-strip">${modes.map(type=>`<span>${TYPE_LABELS[type]} · ${modeCount(tasks,type)}</span>`).join('')}</div><div class="practice-grid">${tasks.map(task=>{const h=practiceSummary(task.id);return `<button type="button" class="card practice-card" data-practice="${esc(task.id)}"><span class="tag">${esc(TYPE_LABELS[task.type]||task.type)} · ${esc(task.area)} · D${task.difficulty}</span><b>${esc(task.title)}</b><span>${esc(task.prompt)}</span><small>${h.completedRuns?`Best ${h.bestScore}/100 · ${h.completedRuns} попыт.`:`+${task.xp||0} XP за первую завершенную попытку`}</small></button>`}).join('')}</div></section>`;
}
async function mount(){
  if((location.hash||'#home')!=='#solve')return;
  const root=document.querySelector('#root');if(!root||root.querySelector('[data-practice-lab]'))return;
  const copy=root.querySelector('.page-copy');if(!copy)return;
  try{const data=await loadPack();copy.insertAdjacentHTML('afterend',practiceSection(data.tasks));bindSection(root)}catch(error){console.error(error)}
}
function bindSection(root){root.querySelectorAll('[data-practice]').forEach(button=>{button.onclick=()=>openPractice(button.dataset.practice)})}
function selectionHTML(task){return `<div class="practice-options" role="group" aria-label="Варианты ответа">${task.options.map(option=>`<button type="button" class="option practice-option" data-practice-option="${esc(option.id)}" aria-pressed="false">${esc(option.text)}</button>`).join('')}</div>`}
function orderHTML(task,order){const byId=new Map(task.items.map(item=>[item.id,item]));return `<div class="practice-order" data-practice-order>${order.map((id,index)=>`<div class="order-item" data-order-id="${esc(id)}"><span>${index+1}</span><b>${esc(byId.get(id)?.text||id)}</b><div><button type="button" data-order-up="${index}" aria-label="Поднять выше">↑</button><button type="button" data-order-down="${index}" aria-label="Опустить ниже">↓</button></div></div>`).join('')}</div>`}
function answerHTML(task,session){
  if(task.kind==='multi')return selectionHTML(task);
  if(task.kind==='order')return orderHTML(task,session.order);
  if(task.kind==='date')return `<label class="practice-field"><span>Дата</span><input type="date" data-practice-input></label>`;
  return `<label class="practice-field"><span>Ответ ${task.unit?`(${esc(task.unit)})`:''}</span><input type="number" step="any" inputmode="decimal" data-practice-input></label>`;
}
function confidenceHTML(){return `<div class="confidence-calibration practice-confidence"><div class="tag">Confidence Calibration</div><p>Насколько вы уверены до проверки?</p><div class="confidence-scale" role="group" aria-label="Уверенность от 1 до 5">${[1,2,3,4,5].map(v=>`<button type="button" class="secondary" data-practice-confidence="${v}" aria-pressed="false">${v}</button>`).join('')}</div><div class="micro" data-practice-confidence-message>1 - почти угадываю · 5 - полностью уверен</div></div>`}
function sourcesHTML(task){return `<div class="card source-box"><div class="tag">Проверенные источники</div>${(task.sources||[]).map(source=>`<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}</a>`).join('')}</div>`}
function renderModal(task,session){return `<div class="modal practice-modal" role="dialog" aria-modal="true" aria-label="Practice Lab: ${esc(task.title)}"><div class="modal-head"><button type="button" class="back" data-practice-close aria-label="Закрыть">‹</button><div><div class="tag">${esc(TYPE_LABELS[task.type]||task.type)} · ${esc(task.area)}</div><b>${esc(task.title)}</b></div></div><div class="modal-body"><div class="card practice-brief"><span class="tag">Difficulty ${task.difficulty}/10</span><h2>${esc(task.prompt)}</h2><p>Оценивается детерминированно. Повтор улучшает практику, но не может повторно фармить XP или Skill Evidence.</p></div><div class="card practice-task" data-practice-task>${answerHTML(task,session)}${confidenceHTML()}<button type="button" class="primary practice-submit" data-practice-submit>Проверить решение</button><div class="small practice-message" data-practice-message></div></div>${sourcesHTML(task)}</div></div>`}
function resultHTML(task,result,record){const needsReview=result.score<80;return `<div class="practice-result"><div class="practice-score"><span>Practice Score</span><b>${result.score}/100</b><strong>${result.score>=80?'Уверенное решение':result.score>=50?'Есть основа':'Нужна отработка'}</strong></div><div class="card legal-card"><h3>Разбор</h3><p>${esc(task.explanation)}</p><p class="small"><b>Эталон:</b> ${esc(correctPracticeAnswer(task))}</p></div>${needsReview&&task.remediation?.length?`<div class="card legal-card"><h3>Точная коррекция</h3><p>Вернитесь к конкретным подтемам, затем повторите задачу. Повтор не увеличит Lesson Mastery автоматически.</p><div class="review-links">${task.remediation.map(row=>`<button type="button" class="secondary" data-practice-review="${esc(row.lessonId)}" data-practice-target="${esc(row.target)}">${esc(row.lessonId)} · ${esc(row.target)}</button>`).join('')}</div></div>`:''}<div class="card legal-card"><h3>Evidence</h3><p>${record.eligibleForSkill?'Первая завершенная попытка отправлена как Skill Evidence.':'Повтор сохранен как практика, но новое Skill Evidence не начисляется локально.'} ${record.earned?`Получено ${record.earned} XP.`:'XP за эту задачу уже был получен.'}</p></div><button type="button" class="primary" data-practice-retry>Повторить задачу</button></div>`}
async function openPractice(taskId){
  const data=await loadPack();const task=data.tasks.find(row=>row.id===taskId);if(!task)return;
  const initial=task.kind==='order'?task.correctOrder.slice(1).concat(task.correctOrder[0]):[];
  const session={eventId:uuid(),selected:new Set(),order:initial,input:'',confidence:null,submitted:false};
  const holder=document.createElement('div');holder.innerHTML=renderModal(task,session);const modal=holder.firstElementChild;document.body.appendChild(modal);window.dispatchEvent(new Event('resize'));
  const close=()=>{modal.remove();window.dispatchEvent(new Event('resize'));mount()};
  modal.querySelector('[data-practice-close]').onclick=close;
  function bindOrder(){modal.querySelectorAll('[data-order-up]').forEach(btn=>btn.onclick=()=>{const i=Number(btn.dataset.orderUp);if(i>0){[session.order[i-1],session.order[i]]=[session.order[i],session.order[i-1]];modal.querySelector('[data-practice-order]').outerHTML=orderHTML(task,session.order);bindOrder()}});modal.querySelectorAll('[data-order-down]').forEach(btn=>btn.onclick=()=>{const i=Number(btn.dataset.orderDown);if(i<session.order.length-1){[session.order[i+1],session.order[i]]=[session.order[i],session.order[i+1]];modal.querySelector('[data-practice-order]').outerHTML=orderHTML(task,session.order);bindOrder()}})}
  if(task.kind==='order')bindOrder();
  modal.querySelectorAll('[data-practice-option]').forEach(button=>button.onclick=()=>{const id=button.dataset.practiceOption;if(session.selected.has(id))session.selected.delete(id);else session.selected.add(id);const on=session.selected.has(id);button.classList.toggle('sel',on);button.setAttribute('aria-pressed',on?'true':'false')});
  const input=modal.querySelector('[data-practice-input]');if(input)input.oninput=()=>{session.input=input.value};
  modal.querySelectorAll('[data-practice-confidence]').forEach(button=>button.onclick=()=>{session.confidence=Number(button.dataset.practiceConfidence);modal.querySelectorAll('[data-practice-confidence]').forEach(node=>{const on=node===button;node.classList.toggle('selected',on);node.setAttribute('aria-pressed',on?'true':'false')});modal.querySelector('[data-practice-confidence-message]').textContent=`Уверенность сохранена: ${session.confidence}/5`});
  const submit=modal.querySelector('[data-practice-submit]');submit.onclick=()=>{if(session.submitted)return;const message=modal.querySelector('[data-practice-message]');if(session.confidence==null){message.textContent='Сначала оцените уверенность от 1 до 5.';modal.querySelector('.practice-confidence').scrollIntoView({behavior:'smooth',block:'center'});return}if(task.kind==='multi'&&!session.selected.size){message.textContent='Выберите хотя бы один вариант.';return}if((task.kind==='number'||task.kind==='date')&&!session.input){message.textContent='Введите ответ.';return}session.submitted=true;const result=evaluatePractice(task,session);const record=recordPractice(task,{eventId:session.eventId,score:result.score,confidence:session.confidence,answer:result.answer,breakdown:result.breakdown,contentRelease:data.contentRelease});const taskBox=modal.querySelector('[data-practice-task]');taskBox.innerHTML=resultHTML(task,result,record);taskBox.querySelectorAll('[data-practice-review]').forEach(button=>button.onclick=()=>{window.dispatchEvent(new CustomEvent('lexifrance:open-review',{detail:{lessonId:button.dataset.practiceReview,target:button.dataset.practiceTarget}}));close()});taskBox.querySelector('[data-practice-retry]').onclick=()=>{close();openPractice(task.id)};};
}
export function initPracticeLab(){
  if(mounted)return;mounted=true;
  observer=new MutationObserver(()=>mount());observer.observe(document.querySelector('#root')||document.body,{childList:true,subtree:true});
  window.addEventListener('hashchange',()=>setTimeout(mount,0));
  mount();
}
export { openPractice };
