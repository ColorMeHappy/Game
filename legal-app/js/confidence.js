import { questionProgress } from './state.js';

const quizSelections = new Map();
let caseSelection = null;
let scheduled = false;

function lessonIdFromQuestion(questionId) {
  return String(questionId || '').replace(/-q\d+$/i, '');
}

function calibrationHTML() {
  return `<div class="confidence-calibration" data-confidence-box><div class="tag">Confidence Calibration</div><p>Насколько вы уверены до ответа?</p><div class="confidence-scale" role="group" aria-label="Уверенность от 1 до 5">${[1,2,3,4,5].map(value=>`<button type="button" class="secondary" data-confidence="${value}" aria-label="Уверенность ${value} из 5">${value}</button>`).join('')}</div><div class="micro" data-confidence-message>1 - почти угадываю · 5 - полностью уверен</div></div>`;
}

function bindBox(box, onSelect) {
  box.querySelectorAll('[data-confidence]').forEach(button => {
    button.addEventListener('click', () => {
      const value = Math.max(1, Math.min(5, Number(button.dataset.confidence) || 1));
      box.dataset.confidenceSelected = String(value);
      box.querySelectorAll('[data-confidence]').forEach(node => {
        const selected = node === button;
        node.classList.toggle('selected', selected);
        node.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
      const message = box.querySelector('[data-confidence-message]');
      if (message) message.textContent = `Уверенность сохранена: ${value}/5`;
      onSelect(value);
    });
  });
}

function instrumentQuiz(card) {
  if (!card || card.dataset.confidenceInstrumented) return;
  card.dataset.confidenceInstrumented = '1';
  const questionId = String(card.id || '').replace(/^quiz-question-/, '');
  const lessonId = lessonIdFromQuestion(questionId);
  const levelText = card.querySelector('.quiz-topline')?.textContent || '';
  const difficulty = Number(levelText.match(/Уровень\s+(\d+)\/10/i)?.[1] || 0);
  if (!questionId || difficulty < 7 || questionProgress(lessonId, questionId).attempts > 0) return;
  const options = card.querySelector('.quiz-options');
  if (!options) return;
  options.insertAdjacentHTML('beforebegin', calibrationHTML());
  const box = card.querySelector('[data-confidence-box]');
  card.dataset.confidenceRequired = '1';
  bindBox(box, value => quizSelections.set(questionId, value));
}

function instrumentCase(card) {
  if (!card || card.dataset.confidenceInstrumented) return;
  card.dataset.confidenceInstrumented = '1';
  if (card.classList.contains('answered')) return;
  const modal = card.closest('.modal');
  const levelText = modal?.querySelector('.meta-chips')?.textContent || '';
  if (!/\b(Applied|Expert)\b/i.test(levelText)) return;
  const submit = card.querySelector('#submitCaseTask');
  if (!submit) return;
  submit.insertAdjacentHTML('beforebegin', calibrationHTML());
  const box = card.querySelector('[data-confidence-box]');
  card.dataset.confidenceRequired = '1';
  caseSelection = null;
  bindBox(box, value => { caseSelection = value; });
}

function scan() {
  document.querySelectorAll('.quiz-one').forEach(instrumentQuiz);
  document.querySelectorAll('.solve-task').forEach(instrumentCase);
}

function scheduleScan() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => { scheduled = false; scan(); });
}

document.addEventListener('click', event => {
  const quizAnswer = event.target.closest?.('[data-answer]');
  if (quizAnswer) {
    const card = quizAnswer.closest('.quiz-one[data-confidence-required="1"]');
    const box = card?.querySelector('[data-confidence-box]');
    if (card && box && !box.dataset.confidenceSelected) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const message = box.querySelector('[data-confidence-message]');
      if (message) message.textContent = 'Сначала оцените уверенность от 1 до 5.';
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
  }
  const caseSubmit = event.target.closest?.('#submitCaseTask');
  if (caseSubmit) {
    const card = caseSubmit.closest('.solve-task[data-confidence-required="1"]');
    const box = card?.querySelector('[data-confidence-box]');
    if (card && box && !box.dataset.confidenceSelected) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const message = box.querySelector('[data-confidence-message]');
      if (message) message.textContent = 'Сначала оцените уверенность от 1 до 5.';
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}, true);

new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true });
scan();

export function consumeQuizConfidence(questionId) {
  const value = quizSelections.get(questionId) ?? null;
  quizSelections.delete(questionId);
  return value;
}

export function consumeCaseConfidence() {
  const value = caseSelection;
  caseSelection = null;
  return value;
}
