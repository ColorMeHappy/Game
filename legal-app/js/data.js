import { rankSearch } from './search-core.js';

let index = null;
const catalogs = new Map();
const lessons = new Map();
const quizzes = new Map();
const caseBundles = new Map();
const cases = new Map();
let caseIndex = null;
let updates = null;
let searchData = null;

async function get(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`LOAD ${url} ${response.status}`);
  return response.json();
}

function normalizeMeta(data) {
  if (!data || typeof data !== 'object') return data;
  if (!data.schemaVersion) data.schemaVersion = (index && index.schemaVersion) || data.version || '5.1.0';
  if (!data.contentRelease) data.contentRelease = (index && index.contentRelease) || data.contentVersion || 'unknown';
  delete data.version;
  delete data.contentVersion;
  return data;
}

function normalizeLessonIds(raw) {
  const source = Array.isArray(raw) ? raw : [];
  return Array.from(new Set(source.map(mapLessonId)));
}

function normalizeCase(raw) {
  const item = Object.assign({}, raw);
  item.linkedLessons = normalizeLessonIds(raw && raw.linkedLessons);
  return normalizeMeta(item);
}

function prepareCase(caseData) {
  const tasks = Array.isArray(caseData.tasks) ? caseData.tasks : [];
  for (const task of tasks) {
    if (task.kind !== 'order' || Array.isArray(task.initialOrder)) continue;
    const items = Array.isArray(task.items) ? task.items : [];
    const ids = items.map(item => item.id);
    task.initialOrder = ids.length > 1 ? ids.slice(1).concat(ids[0]) : ids;
  }
  return caseData;
}

export async function boot() {
  index = normalizeMeta(await get('./content/app-index.json'));
  return index;
}

export function idx() {
  return index;
}

export function contentRelease() {
  return index ? index.contentRelease : 'unknown';
}

export function mapLessonId(id) {
  if (!index || !index.legacyLessonMap) return id;
  return index.legacyLessonMap[id] || id;
}

export function pathForLesson(rawId) {
  const id = mapLessonId(rawId);
  const found = index.paths.find(path => path.lessonIds.includes(id));
  return found ? found.id : 'Corporate';
}

export async function catalog(pathId) {
  if (catalogs.has(pathId)) return catalogs.get(pathId);
  const pathData = index.paths.find(item => item.id === pathId);
  if (!pathData) return [];
  const rows = [];
  for (const file of pathData.catalogFiles) {
    const data = normalizeMeta(await get(`./${file}`));
    const items = Array.isArray(data.items) ? data.items : [];
    for (const item of items) rows.push(normalizeMeta(item));
  }
  catalogs.set(pathId, rows);
  return rows;
}

export async function catalogItem(rawId) {
  const id = mapLessonId(rawId);
  const pathId = pathForLesson(id);
  const rows = await catalog(pathId);
  return rows.find(item => item.id === id);
}

export async function lesson(rawId) {
  const id = mapLessonId(rawId);
  if (lessons.has(id)) return lessons.get(id);
  const item = normalizeMeta(await get(`./${index.lessonBase}${id}.json`));
  lessons.set(id, item);
  return item;
}

export async function quizPack(rawId) {
  const id = mapLessonId(rawId);
  if (quizzes.has(id)) return quizzes.get(id);
  const pack = normalizeMeta(await get(`./${index.quizBase}${id}.json`));
  if (pack.lessonId !== id) throw new Error(`QUIZ ID ${id}`);
  if (!Array.isArray(pack.questions) || pack.questions.length !== 10) throw new Error(`QUIZ COUNT ${id}`);
  quizzes.set(id, pack);
  return pack;
}

export async function casesList() {
  if (caseIndex) return caseIndex;
  const data = normalizeMeta(await get(`./${index.caseIndexFile}`));
  const rows = Array.isArray(data.cases) ? data.cases : [];
  caseIndex = rows.map(normalizeCase);
  return caseIndex;
}

async function loadCaseBundle(file) {
  if (caseBundles.has(file)) return caseBundles.get(file);
  const data = normalizeMeta(await get(`./${file}`));
  const rows = Array.isArray(data.cases) ? data.cases : [];
  for (const raw of rows) {
    const item = prepareCase(normalizeCase(raw));
    cases.set(item.id, item);
  }
  caseBundles.set(file, data);
  return data;
}

export async function oneCase(id) {
  if (cases.has(id)) return cases.get(id);
  const list = await casesList();
  const item = list.find(entry => entry.id === id);
  if (!item) throw new Error(`CASE ${id}`);
  await loadCaseBundle(item.bundle);
  const result = cases.get(id);
  if (!result) throw new Error(`CASE BUNDLE ${id}`);
  return result;
}

export function usableStatus(status) {
  return status === 'CURRENT' || status === 'UPDATED';
}

export async function legalUpdates() {
  if (updates) return updates;
  const data = normalizeMeta(await get(`./${index.updatesFile}`));
  const rows = Array.isArray(data.updates) ? data.updates : [];
  updates = rows.map(normalizeMeta);
  return updates;
}

export async function updatesForLesson(rawId) {
  const id = mapLessonId(rawId);
  const rows = await legalUpdates();
  return rows.filter(update => {
    const affected = normalizeLessonIds(update.affectedLessons);
    return affected.includes(id) && usableStatus(update.status);
  });
}

export async function searchIndex() {
  if (searchData) return searchData;
  const out = [];
  const files = Array.isArray(index.searchFiles) ? index.searchFiles : [];
  for (const file of files) {
    const data = normalizeMeta(await get(`./${file}`));
    const items = Array.isArray(data.items) ? data.items : [];
    for (const raw of items) {
      const item = normalizeMeta(raw);
      out.push(Object.assign({}, item, { type: 'lesson' }));
    }
  }
  const caseRows = await casesList();
  for (const item of caseRows) out.push(Object.assign({}, item, { type: 'case' }));
  searchData = out;
  return out;
}

export async function search(query) {
  const rows = await searchIndex();
  const ranked = rankSearch(rows, query, 18);
  return ranked.map(result => ({ type: result.entry.type, item: result.entry, score: result.score }));
}

export async function relatedCases(ids) {
  const list = await casesList();
  const wanted = Array.isArray(ids) ? ids : [];
  return list.filter(item => wanted.includes(item.id));
}

export async function relatedLessons(ids) {
  const out = [];
  for (const raw of (Array.isArray(ids) ? ids : [])) {
    const id = mapLessonId(raw);
    try {
      const item = await catalogItem(id);
      if (item && !out.some(existing => existing.id === item.id)) out.push(item);
    } catch (_) {}
  }
  return out;
}

export async function recommendedCase(weakTargets = []) {
  const list = (await casesList()).filter(item => usableStatus(item.status));
  if (weakTargets.length) {
    const hit = list.find(item => {
      const topics = Array.isArray(item.relatedSubtopics) ? item.relatedSubtopics : [];
      return topics.some(topic => {
        const target = topic && typeof topic === 'object' ? topic.target : topic;
        return weakTargets.includes(target);
      });
    });
    if (hit) return hit;
  }
  return list.find(item => item.id === index.homeCase) || list[0] || null;
}
