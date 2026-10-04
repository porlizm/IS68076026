// ─────────────────────────────────────────────────────────────────────────────
// Prepare Relevance Checks · R0 → R2 → R3a ของทุกรอบที่ Gemini ตอบ แล้วรวบรวมข้อความที่คำไม่ตรงกับข้อกำหนด (DEC-51)
//   ส่ง Gemini อีกหนึ่งครั้งเพื่อตรวจ "ความหมาย" (R3b · prompt verifier_v1.0) — Demo โมเดลเดียวจึงเป็น self-verification (ติดป้ายในรายงาน)
//   ถ้า Gemini ล้ม/ปิดไว้ → "กฎสำรอง" จับคู่คำพ้อง (ไม่ใช้ LLM · R3 คำซ้ำอย่างเดียว) และติดป้ายให้เห็นในรายงาน
//   ตรรกะทั้งหมดมาจาก engine/engine.js (ฝังทั้งไฟล์ตอน build) — ตรงกับระบบเต็มทุกบรรทัด
// ─────────────────────────────────────────────────────────────────────────────
//@@ENGINE_ALL@@
const VERIFIER_TEMPLATE = /*@@PROMPT_VERIFIER@@*/'';   // prompts/verifier_v1.1.txt (ตัวเดียวกับระบบเต็ม)
const STAMP = /*@@STAMP@@*/{};
const v = $('Config & Validate').first().json;
const verIssue = (() => { const c = v.version || {}; const bad = [];
  if (STAMP.build_id !== c.build_id) bad.push('build ' + STAMP.build_id + ' ≠ ' + c.build_id);
  if (ENGINE.ENGINE_VERSION !== STAMP.engine_version) bad.push('engine ' + ENGINE.ENGINE_VERSION + ' ≠ ' + STAMP.engine_version);
  return bad.length ? 'Prepare Relevance Checks: ' + bad.join(' · ') : ''; })();
const cfg = v.cfg;
const role = $('Load Role Data (O*NET 31.0)').first().json.role;
const text = $('Clean Text & Mask PII').first().json.text;
const prompts = $('Build Analyst Prompt').all().map((i) => i.json);
const reqs = role.requirements.map((r) => ({ requirement_id: r.id, element_id: r.element_id, element_name: r.name, element_description: r.desc, element_aliases: r.aliases, domain: r.domain, weight_renormalized: r.w, level_lv: r.lv }));
const reqIds = reqs.map((r) => r.requirement_id);
const tasks = role.signal_tasks || [];

// ── 1) คำตอบของ Gemini แต่ละรอบ ─────────────────────────────────────────────
let source = 'gemini'; let fallbackReason = '';
const modelResults = {}; const runInfo = [];
const responses = prompts[0] && prompts[0].use_gemini ? $input.all().map((i) => i.json) : [];
responses.forEach((inp, i) => {
  const k = (prompts[i] && prompts[i].run_key) || ['A', 'B', 'C'][i];
  if (!inp || inp.error || !Array.isArray(inp.candidates)) {
    const msg = inp && inp.error ? String(inp.error.message || inp.error.description || inp.error).slice(0, 240) : 'ไม่มีผลตอบกลับ';
    modelResults[k] = { status: 'failed', output: null }; runInfo.push({ key: k, ok: false, error: msg }); return;
  }
  const c = inp.candidates[0] || {};
  const t = ((c.content || {}).parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
  modelResults[k] = { status: 'ok', output: { text: t } };
  const r0 = ENGINE.ruleR0(t, role.role_id, reqIds, tasks.map((x) => x.task_id));
  runInfo.push({ key: k, ok: r0.usable, r0_reason: r0.reason_code, finish_reason: c.finishReason || '', usage: inp.usageMetadata || null, model_version: inp.modelVersion || '' });
});
const usable = runInfo.filter((r) => r.ok).map((r) => r.key);
let projectCfg = Object.assign({}, v.project_cfg, { min_usable_models: Math.min(v.project_cfg.min_usable_models, Math.max(usable.length, 1)), min_agreeing_votes: usable.length >= 2 ? 2 : 1 });

// ── 2) กฎสำรอง (ไม่ใช้ LLM) ────────────────────────────────────────────────
function offlineAnalyst() {
  // ใช้เฉพาะบรรทัดที่เป็นประโยค/รายการ (≥ 7 คำ) — ไม่อนุมานจากชื่อตำแหน่ง ชื่อบริษัท หรือสถาบัน (กฎข้อ 2 ของ prompt)
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length >= 20 && l.split(/\s+/).length >= 7);
  return reqs.map((r) => {
    let best = null;
    for (const l of lines) {
      const ov = ENGINE.overlapScore(l, r, projectCfg);
      if (!best || ov.score > best.score) best = { l, score: ov.score, alias: ov.alias };
    }
    if (!best || best.score < projectCfg.theta) return { requirement_id: r.requirement_id, status: 'missing', quotes: [], confidence: null };
    let l = best.l;
    if (l.length > 300) { const i = best.alias ? Math.max(0, l.toLowerCase().indexOf(best.alias) - 100) : 0; l = l.slice(i, i + 300).trim(); }
    const concrete = /\b(built|developed|designed|managed|led|configured|delivered|implemented|deployed|created|analy[sz]ed|wrote|planned|coordinated|negotiated|maintained|monitored|trained)\b/i.test(l);
    return { requirement_id: r.requirement_id, status: best.score >= 0.3 && concrete ? 'evidenced' : 'partially', quotes: [l], confidence: null };
  });
}
if (!usable.length) {
  fallbackReason = !prompts[0] || !prompts[0].use_gemini ? 'ปิดการเรียก Gemini ใน Config (USE_GEMINI_ANALYST=false)'
    : (runInfo.map((r) => r.error || ('R0: ' + r.r0_reason + (r.finish_reason ? ' (finishReason ' + r.finish_reason + ')' : ''))).join(' · ') || 'ไม่มีผลตอบกลับ');
  source = 'offline_rules';
  for (const k of Object.keys(modelResults)) delete modelResults[k];
  modelResults.A = { status: 'ok', output: { text: JSON.stringify({ schema_version: 'analyst_v1.1', role_id: role.role_id, assessments: offlineAnalyst(), task_assessments: [] }) } };
  projectCfg = Object.assign({}, projectCfg, { r3_mode: 'lexical', min_usable_models: 1, min_agreeing_votes: 1 });
}

// ── 3) ข้อที่ต้องให้ Gemini ตรวจความหมาย (R3b) · cache + แบ่ง batch (DEC-59 D4) ─────────────────
const pv = ENGINE.prepareVerification({ roleId: role.role_id, requirements: reqs, text, modelResults, projectCfg, verifierTemplate: VERIFIER_TEMPLATE, roleTasks: tasks });
const checks = pv.checks.filter((c) => c.verifier);
const cacheOn = cfg.VERIFIER_CACHE !== false;
let sd = null; try { sd = $getWorkflowStaticData('global'); } catch (e) { sd = null; }
const cache = (cacheOn && sd && sd.verifierCache) || {};
const keyOf = (c) => ENGINE.verifierCacheKey({ prompt: STAMP.verifier_prompt, model: cfg.GEMINI_MODEL_VERIFIER, target_id: c.target_id, quote: c.quote });
const cacheKeys = {}; const cached = {}; const fresh = [];
for (const c of checks) {
  const k = keyOf(c); cacheKeys[c.check_id] = k;
  if (cacheOn && cache[k] && cache[k].v) cached[c.check_id] = cache[k].v; else fresh.push(c);
}
const useVerifier = source === 'gemini' && cfg.USE_GEMINI_VERIFIER !== false && fresh.length > 0;
const gen = { maxOutputTokens: 8192, responseMimeType: 'application/json' };
if (cfg.GEMINI_VERIFIER_THINKING_LEVEL) gen.thinkingConfig = { thinkingLevel: cfg.GEMINI_VERIFIER_THINKING_LEVEL };
// prompt ผู้ตรวจ: engine ใส่ level (LV ของ O*NET) และ hands_on ไว้ในแต่ละข้อแล้ว (collectClaims) · ผู้ตรวจจึงแยก "ลงมือทำเอง" ออกจาก "กำกับ/ส่งมอบ" ได้
const promptOf = (batch) => ENGINE.buildVerifierPrompt(VERIFIER_TEMPLATE, batch);
const size = Math.max(5, Number(cfg.VERIFIER_BATCH) || 30);
const batches = []; if (useVerifier) for (let i = 0; i < fresh.length; i += size) batches.push(fresh.slice(i, i + size));
const common = {
  source, fallback_reason: fallbackReason, run_info: runInfo, model_results: modelResults, project_cfg: projectCfg,
  n_checks: checks.length, n_cached: Object.keys(cached).length, n_fresh: fresh.length, cached, cache_keys: cacheKeys, cache_enabled: cacheOn && !!sd,
  batches: batches.map((b, i) => ({ index: i, check_ids: b.map((c) => c.check_id) })),
  verifier_keys: Object.keys(pv.requests), use_verifier: useVerifier, model: cfg.GEMINI_MODEL_VERIFIER, ver_issue: verIssue,
};
if (!useVerifier) return [{ json: Object.assign({}, common, { gemini_request: null }) }];
return batches.map((b, i) => ({ json: i === 0
  ? Object.assign({}, common, { batch_index: 0, gemini_request: { contents: [{ role: 'user', parts: [{ text: promptOf(b) }] }], generationConfig: gen } })
  : { use_verifier: true, batch_index: i, model: cfg.GEMINI_MODEL_VERIFIER, gemini_request: { contents: [{ role: 'user', parts: [{ text: promptOf(b) }] }], generationConfig: gen } } }));
