import { quizPack, oneCase, contentRelease } from './data.js';
import { areaFromLessonId, quizSkills, caseSkills, normalizedDifficulty } from './skill-map.js';

const QUEUE_KEY = 'lexifrance-skill-evidence-queue-v1';
const MAX_QUEUE = 240;
const safeParse = (value, fallback) => { try { return JSON.parse(value || '') ?? fallback; } catch { return fallback; } };
const uuid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;

function readQueue() {
  const rows = safeParse(localStorage.getItem(QUEUE_KEY), []);
  return Array.isArray(rows) ? rows : [];
}

function writeQueue(rows) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(rows.slice(-MAX_QUEUE)));
  window.dispatchEvent(new CustomEvent('lexifrance:evidence-queued'));
}

function enqueueRows(base, skills) {
  if (!skills.length) return;
  const rows = readQueue();
  const eventId = base.eventId || uuid();
  for (const skill of skills) {
    rows.push({
      eventId,
      skillId: skill.skillId,
      area: base.area,
      sourceType: base.sourceType,
      sourceId: base.sourceId,
      difficulty: normalizedDifficulty(base.difficulty),
      rawScore: Math.max(0, Math.min(100, Number(base.rawScore) || 0)),
      confidence: base.confidence == null ? null : Math.max(1, Math.min(5, Number(base.confidence))),
      weight: Math.max(0.01, Number(skill.weight) || 1),
      contentRelease: base.contentRelease || contentRelease(),
      createdAt: new Date().toISOString()
    });
  }
  writeQueue(rows);
}

async function fromQuestion(detail) {
  if (!detail.eligibleForSkill) return;
  const pack = await quizPack(detail.lessonId);
  const question = (pack.questions || []).find(item => item.id === detail.questionId);
  if (!question) return;
  enqueueRows({
    eventId: detail.eventId,
    area: areaFromLessonId(detail.lessonId),
    sourceType: 'quiz',
    sourceId: detail.questionId,
    difficulty: question.difficulty,
    rawScore: detail.correct ? 100 : 0,
    confidence: detail.confidence,
    contentRelease: pack.contentRelease
  }, quizSkills(question));
}

async function fromCaseStage(detail) {
  const caseData = await oneCase(detail.caseId);
  const task = (caseData.tasks || []).find(item => item.id === detail.stageId);
  if (!task) return;
  enqueueRows({
    eventId: detail.eventId,
    area: caseData.area || 'General',
    sourceType: 'solve_stage',
    sourceId: `${detail.caseId}:${detail.stageId}`,
    difficulty: caseData.difficulty,
    rawScore: Math.round(Math.max(0, Math.min(1, Number(detail.ratio) || 0)) * 100),
    confidence: detail.confidence,
    contentRelease: caseData.contentRelease
  }, caseSkills(task));
}

async function handleLearningEvent(event) {
  const detail = event?.detail || {};
  try {
    if (detail.type === 'question_answered') await fromQuestion(detail);
    if (detail.type === 'case_stage_completed') await fromCaseStage(detail);
  } catch (error) {
    console.warn('LexiFrance evidence mapping failed', error);
  }
}

export function initLearningEvidence() {
  if (window.__lexifranceLearningEvidence) return;
  window.__lexifranceLearningEvidence = true;
  window.addEventListener('lexifrance:learning-event', handleLearningEvent);
}

export function evidenceQueue() {
  return readQueue();
}

export function replaceEvidenceQueue(rows) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(Array.isArray(rows) ? rows.slice(-MAX_QUEUE) : []));
}

export function evidenceQueueKey() {
  return QUEUE_KEY;
}
