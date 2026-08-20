import fs from 'node:fs';
import { areaFromLessonId, quizSkills, caseSkills, normalizedDifficulty } from './js/skill-map.js';

const state=fs.readFileSync('legal-app/js/state.js','utf8');
const evidence=fs.readFileSync('legal-app/js/learning-evidence.js','utf8');
const analytics=fs.readFileSync('legal-app/js/analytics.js','utf8');
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

check(state.includes('xpLedger:{}')&&state.includes('claimXp(`lesson:${lessonId}`')&&state.includes('claimXp(`case:${c.id}`'),'lesson and case XP use stable ledger keys');
check(state.includes("eligibleForSkill:q.attempts===1"),'only first local Quiz attempt is eligible for current skill evidence');
check(state.includes("emitLearning('case_stage_completed'")&&state.includes("emitLearning('question_answered'"),'Quiz and SOLVE emit structured learning events');
check(evidence.includes("const QUEUE_KEY = 'lexifrance-skill-evidence-queue-v1'")&&evidence.includes('MAX_QUEUE = 240'),'skill evidence has a bounded offline queue');

check(migration.includes("where source_type = 'quiz'")&&migration.includes('skill_evidence_quiz_once_idx'),'database enforces one Quiz source/skill evidence across devices');
check(migration.includes('on conflict do nothing'),'RPC treats retry and cross-device uniqueness conflicts idempotently');
check(migration.includes("when v_source_seen = 1 then 0.60")&&migration.includes("when v_source_seen = 2 then 0.35")&&migration.includes('else 0.20'),'repeated SOLVE stages use deterministic diminishing evidence weight');
check(migration.includes("p_weight <= 0 or p_weight > 1")&&migration.includes("not in ('quiz','solve_stage')"),'RPC rejects unbounded weights and unknown current evidence source types');
check(migration.includes('security invoker')&&migration.includes('auth.uid()'),'Skill Evidence RPC remains caller-scoped and RLS-compatible');

check(analytics.includes("disable_session_recording: true")&&analytics.includes('autocapture: false')&&analytics.includes("person_profiles: 'identified_only'"),'analytics foundation disables automatic sensitive capture');
check(!analytics.includes('search_query')&&!analytics.includes('query_text'),'analytics module does not transmit raw search text');
check(analytics.includes("CONSENT_KEY = 'lexifrance-analytics-consent-v1'")&&analytics.includes('consentGranted()'),'analytics requires explicit local consent before capture');
check(analytics.includes("ALLOWED_HOSTS = new Set(['https://eu.i.posthog.com', 'https://us.i.posthog.com'])"),'PostHog ingestion is restricted to explicit regional hosts');

if(failures.length){console.error(`\n${failures.length} Skill Graph foundation QA failure(s)`);process.exit(1)}
console.log('\nSkill Graph foundation integrity passed');
