import fs from 'node:fs';
import { areaFromLessonId, quizSkills, caseSkills, normalizedDifficulty } from './js/skill-map.js';
import { SKILL_DEFINITIONS } from './js/skill-cache.js';

const state=fs.readFileSync('legal-app/js/state.js','utf8');
const evidence=fs.readFileSync('legal-app/js/learning-evidence.js','utf8');
const analytics=fs.readFileSync('legal-app/js/analytics.js','utf8');
const skillCache=fs.readFileSync('legal-app/js/skill-cache.js','utf8');
const pages=fs.readFileSync('legal-app/js/pages.js','utf8');
const cloud=fs.readFileSync('legal-app/js/cloud.js','utf8');
const app=fs.readFileSync('legal-app/app.js','utf8');
const sw=fs.readFileSync('legal-app/service-worker.js','utf8');
const migration=fs.readFileSync('legal-app/supabase/migrations/20260820184750_lexifrance_skill_evidence_integrity_hardening.sql','utf8');
const failures=[];
const check=(value,message)=>{if(value)console.log(`PASS: ${message}`);else{failures.push(message);console.error(`FAIL: ${message}`)}};

check(areaFromLessonId('corp-02')==='Corporate','Corporate lesson maps to Corporate skill area');
check(areaFromLessonId('tax-04')==='Tax','Tax lesson maps to Tax skill area');
check(areaFromLessonId('imm-06')==='Immigration','Immigration lesson maps to Immigration skill area');
check(areaFromLessonId('re-03')==='Real Estate','Real Estate lesson maps to Real Estate skill area');

const integrated=quizSkills({cognitiveLevel:'integrated'}).map(row=>row.skillId);
check(integrated.includes('strategy')&&integrated.includes('professional_judgment'),'integrated Quiz maps to strategy and professional judgment');
const issue=caseSkills({category:'Issue spotting'}).map(row=>row.skillId);
check(issue.includes('issue_spotting')&&issue.includes('fact_analysis'),'Issue Spotting SOLVE stage maps to issue and fact analysis');
const explicit=quizSkills({skillsMeasured:['drafting','argumentation'],skillWeights:{drafting:3,argumentation:1}});
check(explicit.length===2&&Math.abs(explicit[0].weight-.75)<.001,'explicit future skillWeights override fallback mappings');
check(normalizedDifficulty(99)===10&&normalizedDifficulty(0,4)===4,'difficulty is normalized to the 1-10 model');
check(SKILL_DEFINITIONS.length===20&&new Set(SKILL_DEFINITIONS.map(row=>row.id)).size===20,'local Skill Graph catalog contains 20 unique registered skills');

check(state.includes('xpLedger:{}')&&state.includes('claimXp(`lesson:${lessonId}`')&&state.includes('claimXp(`case:${c.id}`'),'lesson and case XP use stable ledger keys');
check(state.includes("eligibleForSkill:q.attempts===1"),'only first local Quiz attempt is eligible for current skill evidence');
check(state.includes("STUDY_TIME_ZONE='Europe/Paris'")&&state.includes('dateInStudyZone'),'streak boundaries use the France study day instead of UTC midnight');
check(state.includes("emitLearning('case_stage_completed'")&&state.includes("emitLearning('question_answered'"),'Quiz and SOLVE emit structured learning events');
check(evidence.includes("const QUEUE_KEY = 'lexifrance-skill-evidence-queue-v1'")&&evidence.includes('MAX_QUEUE = 240'),'skill evidence has a bounded offline queue');

check(migration.includes("where source_type = 'quiz'")&&migration.includes('skill_evidence_quiz_once_idx'),'database enforces one Quiz source/skill evidence across devices');
check(migration.includes('on conflict do nothing'),'RPC treats retry and cross-device uniqueness conflicts idempotently');
check(migration.includes("when v_source_seen = 1 then 0.60")&&migration.includes("when v_source_seen = 2 then 0.35")&&migration.includes('else 0.20'),'repeated SOLVE stages use deterministic diminishing evidence weight');
check(migration.includes("p_weight <= 0 or p_weight > 1")&&migration.includes("not in ('quiz','solve_stage')"),'RPC rejects unbounded weights and unknown current evidence source types');
check(migration.includes('security invoker')&&migration.includes('auth.uid()'),'Skill Evidence RPC remains caller-scoped and RLS-compatible');

check(skillCache.includes("CACHE_PREFIX='lexifrance-skill-cache-v1:'")&&skillCache.includes('cacheKey(userId')&&skillCache.includes('activeUserId'),'offline Skill Graph cache is scoped to the active cloud user');
check(cloud.includes("from('skill_mastery').select")&&cloud.includes('replaceSkillCache')&&cloud.includes('mergeSkillResult'),'cloud hydrates and incrementally refreshes the Skill Graph read model');
check(cloud.includes('clearSkillCache(previousUserId)'),'sign-out removes the active user Skill Graph cache');
check(pages.includes("section('02','Skill Graph'")&&pages.includes('Proven')&&pages.includes('Calibrated')&&pages.includes('Freshness'),'Profile explains Proven, calibrated competence and freshness separately');
check(app.includes("lexifrance:skill-cache-updated")&&app.includes("page==='profile'"),'Profile refreshes when synchronized skill evidence changes');

check(analytics.includes("disable_session_recording: true")&&analytics.includes('autocapture: false')&&analytics.includes("person_profiles: 'identified_only'"),'analytics foundation disables automatic sensitive capture');
check(!analytics.includes('search_query')&&!analytics.includes('query_text'),'analytics module does not transmit raw search text');
check(analytics.includes("CONSENT_KEY = 'lexifrance-analytics-consent-v1'")&&analytics.includes('consentGranted()'),'analytics requires explicit local consent before capture');
check(analytics.includes('opt_out_capturing')&&analytics.includes('opt_in_capturing'),'analytics consent can be revoked and granted again without a stuck opt-out state');
check(pages.includes('trackSearch(rows.length,query.length)')&&!pages.includes('trackSearch(rows.length,query)'),'Search analytics transmits count and query length, never the legal search text');
check(pages.includes('data-analytics=')&&pages.includes('setAnalyticsConsent'),'Profile provides an explicit analytics consent control');
check(analytics.includes("ALLOWED_HOSTS = new Set(['https://eu.i.posthog.com', 'https://us.i.posthog.com'])"),'PostHog ingestion is restricted to explicit regional hosts');
check(sw.includes("'./js/skill-cache.js'")&&sw.includes("'./skill.css?v=12'"),'PWA shell includes the Skill Graph read model and styles');

if(failures.length){console.error(`\n${failures.length} Skill Graph foundation QA failure(s)`);process.exit(1)}
console.log('\nSkill Graph foundation integrity passed');
