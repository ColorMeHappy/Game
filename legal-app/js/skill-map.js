const AREA_BY_PREFIX = {
  corp: 'Corporate',
  tax: 'Tax',
  imm: 'Immigration',
  re: 'Real Estate'
};

const QUIZ_FALLBACK = {
  recognition: [['rule_identification', 1]],
  recall: [['rule_identification', 1]],
  understanding: [['legal_qualification', 0.65], ['rule_identification', 0.35]],
  application: [['legal_qualification', 0.45], ['decision_making', 0.55]],
  analysis: [['fact_analysis', 0.55], ['risk_analysis', 0.45]],
  exceptions: [['rule_identification', 0.5], ['risk_analysis', 0.5]],
  'multi-factor': [['issue_spotting', 0.4], ['fact_analysis', 0.3], ['legal_qualification', 0.3]],
  integrated: [['strategy', 0.4], ['decision_making', 0.3], ['professional_judgment', 0.3]]
};

function normalizeSkillRows(skillsMeasured, skillWeights) {
  const ids = Array.isArray(skillsMeasured) ? skillsMeasured : [];
  const weights = skillWeights && typeof skillWeights === 'object' ? skillWeights : {};
  if (!ids.length) return [];
  const rows = ids.map(id => [String(id), Math.max(0.01, Number(weights[id]) || 1)]);
  const total = rows.reduce((sum, row) => sum + row[1], 0) || 1;
  return rows.map(([skillId, weight]) => ({ skillId, weight: weight / total }));
}

function rowsFromPairs(pairs) {
  return (pairs || []).map(([skillId, weight]) => ({ skillId, weight }));
}

export function areaFromLessonId(lessonId) {
  const prefix = String(lessonId || '').split('-')[0];
  return AREA_BY_PREFIX[prefix] || 'General';
}

export function quizSkills(question = {}) {
  const explicit = normalizeSkillRows(question.skillsMeasured, question.skillWeights);
  if (explicit.length) return explicit;
  const level = String(question.cognitiveLevel || 'understanding').toLowerCase();
  return rowsFromPairs(QUIZ_FALLBACK[level] || QUIZ_FALLBACK.understanding);
}

export function caseSkills(task = {}) {
  const explicit = normalizeSkillRows(task.skillsMeasured, task.skillWeights);
  if (explicit.length) return explicit;

  const category = String(task.category || '').toLowerCase();
  if (category.includes('issue')) return rowsFromPairs([['issue_spotting', 0.65], ['fact_analysis', 0.35]]);
  if (category.includes('qual')) return rowsFromPairs([['legal_qualification', 0.65], ['rule_identification', 0.35]]);
  if (category.includes('evidence') || category.includes('document')) return rowsFromPairs([['evidence_analysis', 0.55], ['document_analysis', 0.45]]);
  if (category.includes('deadline')) return rowsFromPairs([['deadline_calculation', 0.6], ['procedural_reasoning', 0.4]]);
  if (category.includes('procedure')) return rowsFromPairs([['procedural_reasoning', 0.7], ['decision_making', 0.3]]);
  if (category.includes('calculation') || category.includes('numeric') || category.includes('tax calc')) return rowsFromPairs([['numerical_calculation', 1]]);
  if (category.includes('strategy') || category.includes('risk')) return rowsFromPairs([['strategy', 0.55], ['risk_analysis', 0.45]]);
  if (category.includes('argument')) return rowsFromPairs([['argumentation', 0.65], ['counterargument', 0.35]]);
  if (category.includes('final') || category.includes('reason')) return rowsFromPairs([['strategy', 0.4], ['decision_making', 0.35], ['professional_judgment', 0.25]]);
  return rowsFromPairs([['decision_making', 0.6], ['professional_judgment', 0.4]]);
}

export function normalizedDifficulty(value, fallback = 5) {
  const number = Math.round(Number(value) || fallback);
  return Math.max(1, Math.min(10, number));
}
