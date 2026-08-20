const CONSENT_KEY = 'lexifrance-analytics-consent-v1';
const SDK_URL = 'https://cdn.jsdelivr.net/npm/posthog-js@1.417.1/+esm';
const ALLOWED_HOSTS = new Set(['https://eu.i.posthog.com', 'https://us.i.posthog.com']);

let posthog = null;
let initialized = false;
let release = null;

function config() {
  const value = globalThis.LEXIFRANCE_ANALYTICS;
  if (!value || typeof value !== 'object') return null;
  const apiHost = String(value.apiHost || '').replace(/\/$/, '');
  const token = String(value.token || '');
  if (!ALLOWED_HOSTS.has(apiHost) || !token.startsWith('phc_')) return null;
  return { apiHost, token };
}

function consentGranted() {
  return localStorage.getItem(CONSENT_KEY) === 'granted';
}

function safeProperties(detail = {}) {
  const type = detail.type;
  const common = { content_release: release || 'unknown' };
  if (type === 'lesson_started') return { ...common, lesson_id: detail.lessonId, first_open: !!detail.firstOpen };
  if (type === 'lesson_completed') return { ...common, lesson_id: detail.lessonId, mastery: detail.mastery, xp_earned: detail.xpEarned || 0 };
  if (type === 'question_answered') return { ...common, lesson_id: detail.lessonId, question_id: detail.questionId, correct: !!detail.correct, attempt_no: detail.attemptNo, first_attempt_evidence: !!detail.eligibleForSkill, mastery_after: detail.masteryAfter };
  if (type === 'review_completed') return { ...common, lesson_id: detail.lessonId, score: detail.score, errors: detail.errors, due_at_start: !!detail.dueAtStart };
  if (type === 'solve_started') return { ...common, case_id: detail.caseId, attempt_no: detail.attemptNo };
  if (type === 'case_stage_completed') return { ...common, case_id: detail.caseId, stage_id: detail.stageId, ratio: detail.ratio, category: detail.category, wrong_attempts: detail.wrongAttempts || 0 };
  if (type === 'solve_completed') return { ...common, case_id: detail.caseId, score: detail.score, xp_earned: detail.xpEarned || 0, wrong_attempts: detail.wrongAttempts || 0 };
  return common;
}

function capture(type, properties = {}) {
  if (!posthog || !initialized || !consentGranted()) return;
  try { posthog.capture(type, properties); } catch {}
}

function learningEvent(event) {
  const detail = event?.detail || {};
  const type = String(detail.type || '');
  const allowed = new Set(['lesson_started', 'lesson_completed', 'question_answered', 'review_completed', 'solve_started', 'case_stage_completed', 'solve_completed']);
  if (!allowed.has(type)) return;
  capture(type, safeProperties(detail));
}

export async function initProductAnalytics(options = {}) {
  release = options.contentRelease || release;
  if (initialized || !consentGranted()) return { enabled: false, reason: initialized ? 'already_initialized' : 'consent_required' };
  const cfg = config();
  if (!cfg) return { enabled: false, reason: 'regional_host_not_configured' };
  try {
    const module = await import(SDK_URL);
    posthog = module.default || module.posthog || module;
    posthog.init(cfg.token, {
      api_host: cfg.apiHost,
      person_profiles: 'identified_only',
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      persistence: 'localStorage',
      respect_dnt: true
    });
    initialized = true;
    window.addEventListener('lexifrance:learning-event', learningEvent);
    capture('analytics_started', { content_release: release || 'unknown' });
    return { enabled: true };
  } catch (error) {
    console.warn('LexiFrance analytics unavailable', error);
    return { enabled: false, reason: 'sdk_unavailable' };
  }
}

export function trackPage(route) {
  capture('page_viewed', { route: String(route || 'home').slice(0, 40), content_release: release || 'unknown' });
}

export function trackSearch(resultCount, queryLength) {
  const count = Math.max(0, Number(resultCount) || 0);
  capture('search_performed', { result_count: count, query_length: Math.max(0, Number(queryLength) || 0), content_release: release || 'unknown' });
  if (count === 0) capture('search_no_results', { query_length: Math.max(0, Number(queryLength) || 0), content_release: release || 'unknown' });
}

export function analyticsConsent() {
  return localStorage.getItem(CONSENT_KEY) || 'unset';
}

export async function setAnalyticsConsent(granted, options = {}) {
  localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
  if (!granted && posthog) {
    try { posthog.opt_out_capturing(); } catch {}
    return { enabled: false };
  }
  if (granted) return initProductAnalytics(options);
  return { enabled: false };
}
