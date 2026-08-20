import fs from 'node:fs';
import { areaFromLessonId, quizSkills, caseSkills, normalizedDifficulty } from './js/skill-map.js';

const state=fs.readFileSync('legal-app/js/state.js','utf8');
const evidence=fs.readFileSync('legal-app/js/learning-evidence.js','utf8');
const confidence=fs.readFileSync('legal-app/js/confidence.js','utf8');
const analytics=fs.readFileSync('legal-app/js/analytics.js','utf8');
const migration=fs.readFileSync('legal-app/supabase/migrations/20260820213759_lexifrance_confidence_event_projection.sql','utf8');
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
check(state.includes("eligibleForSkill:q.attempts===1"),'only first Quiz attempt is eligible for current skill evidence');
check(state.includes("emitLearning('case_stage_completed'")&&state.includes("emitLearning('question_answered'"),'Quiz and SOLVE emit structured learning events');
check(evidence.includes("const QUEUE_KEY = 'lexifrance-skill-evidence-queue-v1'")&&evidence.includes('MAX_QUEUE = 240'),'skill evidence has a bounded offline queue');
check(evidence.includes('const confidence = detail.confidence ?? consumeQuizConfidence(detail.questionId);\n  const pack = await quizPack')&&evidence.includes('const confidence = detail.confidence ?? consumeCaseConfidence();\n  const caseData = await oneCase'),'confidence is consumed synchronously before asynchronous content retrieval');
check(evidence.includes("type: 'confidently_wrong'")&&evidence.includes('confidence >= 4 && score < 50'),'confidently-wrong detection has an explicit behavioral rule');
check(confidence.includes('difficulty < 7')&&confidence.includes("/\\b(Applied|Expert)\\b/i"),'confidence prompt is limited to complex Quiz and Applied/Expert SOLVE');
check(confidence.includes("event.stopImmediatePropagation()")&&confidence.includes('data-confidence-required'),'complex answers cannot submit before confidence selection');
check(migration.includes('insert into public.confidence_events')&&migration.includes('on conflict (user_id,event_id) do nothing'),'accepted confidence evidence is persisted idempotently server-side');
check(analytics.includes("disable_session_recording: true")&&analytics.includes('autocapture: false')&&analytics.includes("person_profiles: 'identified_only'"),'analytics foundation disables automatic sensitive capture');
check(!analytics.includes('search_query')&&!analytics.includes('query_text'),'analytics module does not transmit raw search text');
check(analytics.includes("'confidence_submitted'")&&analytics.includes("'confidently_wrong'"),'privacy-safe confidence events are available to analytics');
check(analytics.includes("CONSENT_KEY = 'lexifrance-analytics-consent-v1'")&&analytics.includes('consentGranted()'),'analytics requires explicit local consent before capture');
check(analytics.includes("ALLOWED_HOSTS = new Set(['https://eu.i.posthog.com', 'https://us.i.posthog.com'])"),'PostHog ingestion is restricted to explicit regional hosts');
if(failures.length){console.error(`\n${failures.length} Skill Graph foundation QA failure(s)`);process.exit(1)}
console.log('\nSkill Graph foundation integrity passed');
