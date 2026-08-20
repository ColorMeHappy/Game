import { state, applyPrefs } from './state.js';
import { evidenceQueue, replaceEvidenceQueue } from './learning-evidence.js';

const SUPABASE_URL = 'https://nnexhmzebviispxkpclx.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_91vY-4O1RkByvFz7IB_QPg_vwLt5AKN';
const SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.3';
const META_KEY = 'lexifrance-cloud-v1';
const QUEUE_KEY = 'lexifrance-sync-queue-v1';
const STATE_KEY = 'lexifrance-state-v5';
const MAX_QUEUE = 24;
const MAX_EVIDENCE_PER_FLUSH = 48;

const clone = value => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const safeParse = (value, fallback) => { try { return JSON.parse(value || '') ?? fallback; } catch { return fallback; } };
const iso = () => new Date().toISOString();
const uuid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
const baseMeta = () => ({ deviceId: uuid(), userId: null, isAnonymous: null, email: null, version: 0, status: 'local', pending: 0, lastSyncAt: null, lastError: null, contentRelease: null, initialized: false });

let meta = { ...baseMeta(), ...safeParse(localStorage.getItem(META_KEY), {}) };
let client = null;
let starting = null;
let flushTimer = null;
let contentRelease = null;
let hydrateCallback = null;
let suppressQueue = false;
let originalSetItem = Storage.prototype.setItem;
let observer = null;
let sdkPromise = null;
let listenersInstalled = false;
let lastInitOptions = {};
const listeners = new Set();

function stateSnapshot() { return clone(state); }
function replaceLiveState(next) {
  suppressQueue = true;
  try {
    for (const key of Object.keys(state)) delete state[key];
    Object.assign(state, clone(next || {}));
    originalSetItem.call(localStorage, STATE_KEY, JSON.stringify(state));
    applyPrefs();
  } finally {
    suppressQueue = false;
  }
}

function installStateBridge() {
  if (window.__lexifranceCloudBridge) return;
  window.__lexifranceCloudBridge = true;
  Storage.prototype.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    if (this === localStorage && key === STATE_KEY && !suppressQueue) {
      window.dispatchEvent(new CustomEvent('lexifrance:state-saved', { detail: { at: iso() } }));
    }
  };
}
installStateBridge();

function queue() {
  const rows = safeParse(localStorage.getItem(QUEUE_KEY), []);
  return Array.isArray(rows) ? rows : [];
}
function totalPending() { return queue().length + evidenceQueue().length; }
function persistMeta() {
  meta.pending = totalPending();
  originalSetItem.call(localStorage, META_KEY, JSON.stringify(meta));
  for (const fn of listeners) { try { fn(getCloudStatus()); } catch {} }
  mountCloudPanel();
}
function writeQueue(rows) {
  const out = rows.slice(-MAX_QUEUE);
  originalSetItem.call(localStorage, QUEUE_KEY, JSON.stringify(out));
  meta.pending = totalPending();
  persistMeta();
}
function setStatus(status, error) {
  meta.status = status;
  meta.lastError = error ? String(error?.message || error) : null;
  persistMeta();
}
function localHasLearning(value) {
  return Number(value?.xp) > 0 || (value?.completed || []).length > 0 || Object.keys(value?.lessonProgress || {}).length > 0 || Object.keys(value?.caseV2History || {}).length > 0;
}
function latest(a, b) { if (!a) return b; if (!b) return a; return String(a) > String(b) ? a : b; }
function earliest(a, b) { if (!a) return b; if (!b) return a; return String(a) < String(b) ? a : b; }

function normalizedXpLedger(snapshot = {}) {
  const ledger = snapshot.xpLedger && typeof snapshot.xpLedger === 'object' ? clone(snapshot.xpLedger) : {};
  let nonBaseline = 0;
  for (const [key, row] of Object.entries(ledger)) {
    if (key !== 'legacy:baseline') nonBaseline += Math.max(0, Number(row?.amount) || 0);
  }
  const existingBaseline = Math.max(0, Number(ledger['legacy:baseline']?.amount) || 0);
  const inferredBaseline = Math.max(0, (Number(snapshot.xp) || 0) - nonBaseline);
  const baseline = Math.max(existingBaseline, inferredBaseline);
  if (baseline > 0) ledger['legacy:baseline'] = { amount: baseline, awardedAt: ledger['legacy:baseline']?.awardedAt || 'legacy' };
  return ledger;
}
function mergeXp(local = {}, remote = {}) {
  const a = normalizedXpLedger(local);
  const b = normalizedXpLedger(remote);
  const ledger = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const ar = a[key];
    const br = b[key];
    const amount = Math.max(Number(ar?.amount) || 0, Number(br?.amount) || 0);
    if (amount <= 0) continue;
    ledger[key] = { amount, awardedAt: earliest(ar?.awardedAt, br?.awardedAt) || 'legacy' };
  }
  const xp = Object.values(ledger).reduce((sum, row) => sum + Math.max(0, Number(row?.amount) || 0), 0);
  return { xp, xpLedger: ledger };
}

function mergeQuestion(a = {}, b = {}) {
  return { ...a, ...b, solved: !!(a.solved || b.solved), attempts: Math.max(a.attempts || 0, b.attempts || 0), wrongAttempts: Math.max(a.wrongAttempts || 0, b.wrongAttempts || 0), firstAttemptCorrect: a.firstAttemptCorrect ?? b.firstAttemptCorrect ?? null, lastAnsweredAt: latest(a.lastAnsweredAt, b.lastAnsweredAt), solvedAt: earliest(a.solvedAt, b.solvedAt) };
}
function mergeLesson(a = {}, b = {}) {
  const questions = {};
  for (const id of new Set([...Object.keys(a.questions || {}), ...Object.keys(b.questions || {})])) questions[id] = mergeQuestion(a.questions?.[id], b.questions?.[id]);
  const reviews = [...(a.reviews || []), ...(b.reviews || [])];
  const seen = new Set();
  return { ...a, ...b, opened: !!(a.opened || b.opened), openedAt: earliest(a.openedAt, b.openedAt), questions, xpClaimed: !!(a.xpClaimed || b.xpClaimed), lastAnsweredAt: latest(a.lastAnsweredAt, b.lastAnsweredAt), masteredAt: earliest(a.masteredAt, b.masteredAt), lastReviewAt: latest(a.lastReviewAt, b.lastReviewAt), nextReviewAt: latest(a.nextReviewAt, b.nextReviewAt), reviewIntervalIndex: Math.max(a.reviewIntervalIndex || 0, b.reviewIntervalIndex || 0), reviews: reviews.filter(row => { const key = `${row?.date || ''}|${row?.score || 0}|${row?.firstTry || 0}`; if (seen.has(key)) return false; seen.add(key); return true; }).sort((x, y) => String(x?.date || '').localeCompare(String(y?.date || ''))) };
}
function mergeCase(a = {}, b = {}) {
  const runs = [a.activeRun, b.activeRun].filter(Boolean).sort((x, y) => String(x.lastActionAt || x.startedAt || '').localeCompare(String(y.lastActionAt || y.startedAt || '')));
  const active = runs.length ? runs[runs.length - 1] : null;
  return { ...a, ...b, views: Math.max(a.views || 0, b.views || 0), attempts: Math.max(a.attempts || 0, b.attempts || 0), completedRuns: Math.max(a.completedRuns || 0, b.completedRuns || 0), bestScore: Math.max(a.bestScore || 0, b.bestScore || 0), lastScore: String(a.lastCompletedAt || '') > String(b.lastCompletedAt || '') ? (a.lastScore || 0) : (b.lastScore || 0), xpAwarded: !!(a.xpAwarded || b.xpAwarded), completed: !!(a.completed || b.completed), lastViewedAt: latest(a.lastViewedAt, b.lastViewedAt), lastCompletedAt: latest(a.lastCompletedAt, b.lastCompletedAt), activeRun: active };
}

export function mergeProgress(local = {}, remote = {}) {
  const localLearning = localHasLearning(local);
  const remoteLearning = localHasLearning(remote);
  if (!localLearning && !remoteLearning) return clone(local);
  if (!localLearning && remoteLearning) {
    const out = { ...clone(local), ...clone(remote), theme: local.theme || remote.theme, font: local.font || remote.font, currentPath: local.currentPath || remote.currentPath };
    Object.assign(out, mergeXp(local, remote));
    return out;
  }
  const out = { ...clone(remote), ...clone(local) };
  Object.assign(out, mergeXp(local, remote));
  out.streak = Math.max(local.streak || 0, remote.streak || 0);
  out.lastStudyDay = latest(local.lastStudyDay, remote.lastStudyDay);
  out.completed = [...new Set([...(remote.completed || []), ...(local.completed || [])])];
  out.saved = [...new Set([...(remote.saved || []), ...(local.saved || [])])];
  out.lessonProgress = {};
  for (const id of new Set([...Object.keys(remote.lessonProgress || {}), ...Object.keys(local.lessonProgress || {})])) out.lessonProgress[id] = mergeLesson(remote.lessonProgress?.[id], local.lessonProgress?.[id]);
  out.caseV2History = {};
  for (const id of new Set([...Object.keys(remote.caseV2History || {}), ...Object.keys(local.caseV2History || {})])) out.caseV2History[id] = mergeCase(remote.caseV2History?.[id], local.caseV2History?.[id]);
  out.quizRuns = { ...(remote.quizRuns || {}), ...(local.quizRuns || {}) };
  out.legacyMastery = { ...(remote.legacyMastery || {}), ...(local.legacyMastery || {}) };
  out.legacyCaseHistory = { ...(remote.legacyCaseHistory || {}), ...(local.legacyCaseHistory || {}) };
  return out;
}

function enqueueSnapshot(reason = 'state_change') {
  if (suppressQueue) return;
  const rows = queue();
  const last = rows.length ? rows[rows.length - 1] : null;
  const event = { eventId: uuid(), entityType: 'state', entityId: 'lexifrance', operation: 'replace_state', payload: stateSnapshot(), createdAt: iso(), syncStatus: 'pending', reason, localRevision: (last?.localRevision || 0) + 1 };
  const compact = rows.filter(item => item.entityType !== 'state' || item.syncStatus !== 'pending');
  compact.push(event);
  writeQueue(compact);
  scheduleFlush();
}
function scheduleFlush(ms = 450) { clearTimeout(flushTimer); flushTimer = setTimeout(() => { flushCloud().catch(() => {}); }, ms); }

function ensureSdkScript() {
  if (window.supabase && typeof window.supabase.createClient === 'function') return Promise.resolve(window.supabase);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-lexifrance-supabase-sdk]');
    const done = () => { if (window.supabase && typeof window.supabase.createClient === 'function') resolve(window.supabase); else reject(new Error('Supabase SDK loaded without createClient')); };
    if (existing) { existing.addEventListener('load', done, { once: true }); existing.addEventListener('error', () => reject(new Error('Supabase SDK failed to load')), { once: true }); return; }
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.lexifranceSupabaseSdk = '1';
    script.addEventListener('load', done, { once: true });
    script.addEventListener('error', () => reject(new Error('Supabase SDK failed to load')), { once: true });
    document.head.appendChild(script);
  });
  return sdkPromise;
}
async function loadSdk() { if (client) return client; const sdk = await ensureSdkScript(); client = sdk.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }); return client; }
async function establishSession() {
  const c = await loadSdk();
  let result = await c.auth.getSession();
  if (result.error) throw result.error;
  let session = result.data.session;
  if (!session) { const anonymous = await c.auth.signInAnonymously(); if (anonymous.error) throw anonymous.error; session = anonymous.data.session; }
  if (!session) throw new Error('Supabase session unavailable');
  meta.userId = session.user.id;
  meta.isAnonymous = !!session.user.is_anonymous;
  meta.email = session.user.email || null;
  persistMeta();
  return session;
}
async function hydrate() {
  const c = await loadSdk();
  const res = await c.from('user_state').select('state,state_version,updated_at,content_release').maybeSingle();
  if (res.error) throw res.error;
  const local = stateSnapshot();
  if (!res.data) { enqueueSnapshot('initial_local_migration'); return; }
  meta.version = Number(res.data.state_version) || 0;
  const merged = mergeProgress(local, res.data.state || {});
  replaceLiveState(merged);
  if (hydrateCallback) hydrateCallback();
  if (JSON.stringify(merged) !== JSON.stringify(res.data.state || {})) enqueueSnapshot('merge_local_cloud'); else { meta.lastSyncAt = iso(); persistMeta(); }
}

async function flushStateQueue() {
  if (!navigator.onLine || !client || !meta.userId) return false;
  let rows = queue();
  for (let guard = 0; guard < 8 && rows.length; guard++) {
    const event = rows[0];
    try {
      const res = await client.rpc('save_user_state', { p_expected_version: Number(meta.version) || 0, p_event_id: event.eventId, p_payload: event.payload, p_device_id: meta.deviceId, p_content_release: contentRelease || meta.contentRelease });
      if (res.error) throw res.error;
      const data = res.data;
      if (!data) throw new Error('Empty sync response');
      if (data.status === 'conflict') {
        meta.version = Number(data.version) || 0;
        const merged = mergeProgress(event.payload, data.state || {});
        replaceLiveState(merged);
        if (hydrateCallback) hydrateCallback();
        event.eventId = uuid(); event.payload = merged; event.createdAt = iso(); event.syncStatus = 'pending'; event.reason = 'conflict_merge'; rows[0] = event; writeQueue(rows); continue;
      }
      if (data.status === 'ok' || data.status === 'duplicate') { meta.version = Number(data.version) || meta.version; meta.lastSyncAt = iso(); rows.shift(); writeQueue(rows); continue; }
      throw new Error(`Unknown sync status: ${data.status}`);
    } catch (error) { event.syncStatus = 'pending'; rows[0] = event; writeQueue(rows); throw error; }
  }
  return rows.length === 0;
}

export async function flushSkillEvidence() {
  if (!navigator.onLine || !client || !meta.userId) return false;
  const snapshot = evidenceQueue().slice(0, MAX_EVIDENCE_PER_FLUSH);
  if (!snapshot.length) return true;
  for (const row of snapshot) {
    const res = await client.rpc('record_skill_evidence', { p_event_id: row.eventId, p_skill_id: row.skillId, p_area: row.area, p_source_type: row.sourceType, p_source_id: row.sourceId, p_difficulty: row.difficulty, p_raw_score: row.rawScore, p_confidence: row.confidence, p_weight: row.weight, p_content_release: row.contentRelease || contentRelease || meta.contentRelease });
    if (res.error) throw res.error;
    if (!res.data || !['ok', 'duplicate'].includes(res.data.status)) throw new Error('Unexpected skill evidence response');
    const current = evidenceQueue();
    const index = current.findIndex(item => item.eventId === row.eventId && item.skillId === row.skillId);
    if (index >= 0) { current.splice(index, 1); replaceEvidenceQueue(current); }
    persistMeta();
  }
  return evidenceQueue().length === 0;
}

export async function flushCloud() {
  if (!navigator.onLine || !client || !meta.userId) return false;
  if (!totalPending()) { setStatus('synced'); return true; }
  setStatus('syncing');
  try {
    const stateOk = await flushStateQueue();
    const evidenceOk = await flushSkillEvidence();
    const done = stateOk && evidenceOk && totalPending() === 0;
    setStatus(done ? 'synced' : 'pending');
    return done;
  } catch (error) { setStatus('error', error); return false; }
}

function cloudPanelHTML() {
  const current = getCloudStatus();
  const label = current.mode === 'account' ? 'Аккаунт' : current.mode === 'anonymous' ? 'Облачный гость' : 'Локально';
  const sync = current.status === 'synced' ? 'Синхронизировано' : current.status === 'syncing' ? 'Синхронизация...' : current.status === 'offline' ? 'Offline' : current.pending ? `В очереди: ${current.pending}` : 'Cloud готов';
  const detail = current.mode === 'account' ? (current.email || 'Постоянный аккаунт подключен') : current.mode === 'anonymous' ? 'Прогресс уже имеет cloud ID. Добавьте email, чтобы восстановить доступ на другом устройстве.' : current.status === 'local_only' ? 'Cloud Auth пока недоступен. Все функции продолжают работать локально.' : 'Локальный режим работает независимо от сети.';
  return `<section class="section cloud-account" data-cloud-panel><div class="section-head"><div class="section-title"><div class="section-num">00</div><h2>Облачный прогресс</h2></div><div class="section-meta">${sync}</div></div><div class="card legal-card"><div class="tag">${label}</div><h3>${detail}</h3><p class="small">${current.lastSyncAt ? `Последняя синхронизация: ${new Date(current.lastSyncAt).toLocaleString('ru-RU')}` : 'Сначала сохраняется локально, затем синхронизируется.'}</p><button class="secondary" data-cloud-sync>Синхронизировать сейчас</button>${current.mode !== 'account' ? `<div style="margin-top:14px"><label class="small" for="cloudEmail">Постоянный аккаунт</label><div class="search-box" style="margin-top:6px"><input id="cloudEmail" type="email" inputmode="email" autocomplete="email" placeholder="email@example.com"></div><button class="primary" data-cloud-upgrade style="margin-top:8px">Привязать email</button><div class="small" data-cloud-message style="margin-top:6px"></div></div>` : ''}</div></section>`;
}
function bindCloudPanel(panel) {
  const sync = panel.querySelector('[data-cloud-sync]');
  if (sync) sync.onclick = async () => { sync.disabled = true; sync.textContent = 'Синхронизация...'; enqueueSnapshot('manual_profile'); const ok = await flushCloud(); sync.textContent = ok ? 'Синхронизировано' : 'Сохранено локально'; setTimeout(() => { sync.disabled = false; }, 700); };
  const upgrade = panel.querySelector('[data-cloud-upgrade]');
  const email = panel.querySelector('#cloudEmail');
  const message = panel.querySelector('[data-cloud-message]');
  if (upgrade && email) upgrade.onclick = async () => { upgrade.disabled = true; if (message) message.textContent = 'Отправляем подтверждение...'; try { await requestAccountUpgrade(email.value); if (message) message.textContent = 'Проверьте email. После подтверждения текущий прогресс сохранится.'; } catch (error) { if (message) message.textContent = error?.message || 'Не удалось отправить письмо. Локальный прогресс сохранен.'; } finally { upgrade.disabled = false; } };
}
function mountCloudPanel() {
  if ((location.hash || '#home') !== '#profile') return;
  const root = document.querySelector('#root');
  const anchor = root?.querySelector('.profile-grid');
  if (!anchor || root.querySelector('[data-cloud-panel]')) return;
  anchor.insertAdjacentHTML('afterend', cloudPanelHTML());
  const panel = root.querySelector('[data-cloud-panel]');
  if (panel) bindCloudPanel(panel);
}
function observeProfile() {
  if (observer) return;
  observer = new MutationObserver(() => mountCloudPanel());
  observer.observe(document.querySelector('#root') || document.body, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => setTimeout(mountCloudPanel, 0));
  mountCloudPanel();
}
function installCloudListeners() {
  if (listenersInstalled) return;
  listenersInstalled = true;
  window.addEventListener('lexifrance:state-saved', () => enqueueSnapshot('local_save'));
  window.addEventListener('lexifrance:evidence-queued', () => scheduleFlush(120));
  window.addEventListener('online', () => { setStatus('connecting'); starting = null; initCloud(lastInitOptions).then(() => flushCloud()).catch(() => {}); });
  window.addEventListener('offline', () => setStatus('offline'));
}

export async function initCloud(opts = {}) {
  lastInitOptions = opts;
  if (starting) return starting;
  contentRelease = opts.contentRelease || null;
  hydrateCallback = opts.onHydrate || null;
  meta.contentRelease = contentRelease;
  observeProfile();
  installCloudListeners();
  starting = (async () => {
    if (!navigator.onLine) { meta.initialized = true; setStatus('offline'); return getCloudStatus(); }
    try {
      setStatus('connecting');
      const c = await loadSdk();
      await establishSession();
      c.auth.onAuthStateChange((_event, session) => { if (session?.user) { meta.userId = session.user.id; meta.isAnonymous = !!session.user.is_anonymous; meta.email = session.user.email || null; persistMeta(); } else { meta.userId = null; meta.isAnonymous = null; meta.email = null; setStatus('local'); } });
      await hydrate();
      await flushCloud();
      meta.initialized = true;
      persistMeta();
      return getCloudStatus();
    } catch (error) { meta.initialized = true; setStatus('local_only', error); return getCloudStatus(); }
  })();
  return starting;
}

export async function requestAccountUpgrade(email) {
  const value = String(email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(value)) throw new Error('Введите корректный email');
  const c = await loadSdk();
  const sessionResult = await c.auth.getSession();
  if (sessionResult.error) throw sessionResult.error;
  const session = sessionResult.data.session;
  const redirectTo = `${location.origin}${location.pathname}`;
  let res;
  if (session) res = await c.auth.updateUser({ email: value }, { emailRedirectTo: redirectTo }); else res = await c.auth.signInWithOtp({ email: value, options: { emailRedirectTo: redirectTo, shouldCreateUser: true } });
  if (res.error) throw res.error;
  meta.email = value;
  setStatus('verification_sent');
  return true;
}
export async function signOutCloud() { if (!client) return; await flushCloud(); await client.auth.signOut(); meta = { ...baseMeta(), deviceId: meta.deviceId, contentRelease }; persistMeta(); setStatus('local'); }
export function getCloudStatus() { return { ...meta, pending: totalPending(), online: navigator.onLine, mode: meta.userId ? (meta.isAnonymous ? 'anonymous' : 'account') : 'local' }; }
export function subscribeCloud(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function queueStateForSync(reason = 'manual') { enqueueSnapshot(reason); return flushCloud(); }
export function cloudConfigured() { return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && !/service[_-]?role/i.test(SUPABASE_PUBLISHABLE_KEY)); }
