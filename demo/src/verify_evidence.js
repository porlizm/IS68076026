// ─────────────────────────────────────────────────────────────────────────────
// Verify Evidence (R0·R2·R3·R1·R5·R6) · ตัดสินด้วย engine.evaluateRun ตัวเดียวกับระบบเต็ม (หัวข้อ 3.4.4–3.4.6 · DEC-51–55)
//   R2 quote ต้องพบในเรซูเม (ตรงตัว · ยุบช่องว่าง · ซ่อมรูปคำ ≥ 90%) · R3a คำซ้ำ · R3b Gemini ตรวจความหมาย
//   R1 โหวตระหว่างรอบ (ANALYST_RUNS) · R5 ใบรับรองในคลัง · R6 ทักษะพื้นฐานจากกิจกรรมที่มีหลักฐาน · T งานหลัก · H เทคโนโลยี
// ─────────────────────────────────────────────────────────────────────────────
//@@ENGINE_ALL@@
const STAMP = /*@@STAMP@@*/{};
const v = $('Config & Validate').first().json;
const cfg = v.cfg;
const rd = $('Load Role Data (O*NET 31.0)').first().json;
const role = rd.role;
const prepTxt = $('Clean Text & Mask PII').first().json;
const bp = $('Build Analyst Prompt').first().json;
const pre = $('Prepare Relevance Checks').first().json;
const text = prepTxt.text;
const verIssue = (() => { const c = v.version || {}; const bad = [];
  if (STAMP.build_id !== c.build_id) bad.push('build ' + STAMP.build_id + ' ≠ ' + c.build_id);
  if (ENGINE.ENGINE_VERSION !== STAMP.engine_version) bad.push('engine ' + ENGINE.ENGINE_VERSION + ' ≠ ' + STAMP.engine_version);
  return bad.length ? 'Verify Evidence: ' + bad.join(' · ') : ''; })();
const reqs = role.requirements.map((r) => ({ requirement_id: r.id, element_id: r.element_id, element_name: r.name, element_description: r.desc, element_aliases: r.aliases, domain: r.domain, weight_renormalized: r.w }));

// ── 1) คำตอบของผู้ตรวจ (R3b) · รวมคำตัดสินจาก cache + การเรียกใหม่ทุก batch (DEC-59 D4) ───────────────
const verifier = { called: !!pre.use_verifier, n_checks: pre.n_checks, n_cached: pre.n_cached || 0, n_fresh: pre.n_fresh || 0, cache_enabled: !!pre.cache_enabled,
  model: pre.use_verifier ? pre.model : '', error: '', finish_reason: '', usage: null, self_verification: true, batches: [] };
const answers = Object.assign({}, pre.cached || {});
const newCache = {};
if (pre.use_verifier) {
  const resp = $input.all().map((i) => i.json || {});
  (pre.batches || []).forEach((b, i) => {
    const inp = resp[i] || {};
    const bi = { index: i, n_checks: b.check_ids.length, n_answered: 0, error: '', finish_reason: '', usage: null };
    if (inp.error || !Array.isArray(inp.candidates)) bi.error = String((inp.error && (inp.error.message || inp.error.description)) || inp.error || 'ไม่มีผลตอบกลับ').slice(0, 240);
    else {
      const c = inp.candidates[0] || {};
      const t = ((c.content || {}).parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
      bi.finish_reason = c.finishReason || ''; bi.usage = inp.usageMetadata || null;
      const pr = ENGINE.parseVerifierOutput(t, b.check_ids);
      for (const [id, vd] of Object.entries(pr.verdicts)) { answers[id] = vd; newCache[pre.cache_keys[id]] = { v: vd, t: Date.now() }; bi.n_answered++; }
      if (!pr.ok) bi.error = 'ผู้ตรวจตอบผิดรูปแบบ (' + pr.reason + ')';
    }
    verifier.batches.push(bi);
  });
  verifier.error = verifier.batches.filter((b) => b.error).map((b) => 'batch ' + (b.index + 1) + ': ' + b.error).join(' · ');
  verifier.finish_reason = (verifier.batches.find((b) => b.finish_reason) || {}).finish_reason || '';
}
if (Object.keys(newCache).length) {
  try {
    const sd = $getWorkflowStaticData('global');
    const merged = Object.assign({}, sd.verifierCache || {}, newCache);
    const keys = Object.keys(merged); if (keys.length > 3000) keys.sort((x, y) => merged[x].t - merged[y].t).slice(0, keys.length - 3000).forEach((k) => delete merged[k]);
    if (pre.cache_enabled) sd.verifierCache = merged;
  } catch (e) { /* ไม่อยู่ในโหมด production → ไม่มี cache */ }
}
const verifierResults = {};
const answerText = JSON.stringify({ schema_version: 'verifier_v1.0', checks: Object.entries(answers).map(([check_id, verdict]) => ({ check_id, verdict })) });
for (const k of pre.verifier_keys || []) verifierResults[k] = Object.keys(answers).length ? { status: 'ok', output: { text: answerText } } : { status: 'failed', output: null };

// ── 2) ตัดสิน ───────────────────────────────────────────────────────────────
const corpus = role.items.map((it) => ({ item_id: it.id, item_type: it.type, title: it.title, exam_code: it.exam_code, level: it.level }));
const mappings = role.items.flatMap((it) => (it.covers_l1 || []).map((rid) => ({ role_id: role.role_id, item_id: it.id, requirement_id: rid, coverage_layer: ENGINE.L1_LAYER, mapping_status: 'source_checked_by_script' })));
const ev = ENGINE.evaluateRun({ runId: v.run_id, roleId: role.role_id, requirements: reqs, text, modelResults: pre.model_results, verifierResults,
  roleTasks: role.signal_tasks || [], roleTech: role.signal_tech || [], skillLinks: rd.skill_links || [], corpus, mappings, projectCfg: pre.project_cfg, nowIso: new Date().toISOString() });

// ── 3) แถวรายข้อสำหรับหน้าเว็บ ──────────────────────────────────────────────
const supOff = prepTxt.supplement_offset;
const fBy = {};
ev.findings.filter((f) => f.target_kind === 'requirement').forEach((f) => { (fBy[f.requirement_id] = fBy[f.requirement_id] || []).push(f); });
const dBy = Object.fromEntries(ev.decisions.map((d) => [d.requirement_id, d]));
const rows = role.requirements.map((r) => {
  const d = dBy[r.id]; const fs = fBy[r.id] || [];
  const claims = fs.filter((f) => f.claimed_status !== 'missing');
  const flags = [...new Set(String(d.rule_flags || '').split('|').filter(Boolean).map((x) => x.replace(/^[ABC]:/, '')).concat(fs.flatMap((f) => String(f.rule_flags).split('|').filter(Boolean))))];
  const ovs = claims.map((f) => f.overlap_score).filter((x) => x !== '');
  const confs = fs.map((f) => f.model_confidence).filter((x) => x !== '');
  let source = d.evidence_source || '';
  if (source && supOff >= 0 && d.evidence_char_start >= supOff) source = 'learner';
  return { id: r.id, element_id: r.element_id, name: r.name, desc: r.desc, domain: r.domain, w: r.w, im: r.im, lv: r.lv, rank: r.rank,
    df: r.df, idf: r.idf, hands_on: !!r.hands_on, ev_start: d.evidence_char_start, ev_end: d.evidence_char_end, status_engine: d.final_status, actor: '', adjust: '',
    claimed: claims.length ? claims.map((f) => f.claimed_status).join('/') : (fs.length ? 'missing' : null), status: d.final_status, quote: d.evidence_quote, source,
    verified: claims.length ? claims.some((f) => f.quote_verified === true) : null, overlap: ovs.length ? Math.max(...ovs) : null,
    r3_layer: claims.some((f) => f.r3_layer === 'lexical') ? 'lexical' : (claims.some((f) => f.r3_layer === 'semantic') ? 'semantic' : ''),
    verdicts: claims.map((f) => f.verifier_verdict).filter(Boolean), agreement: d.agreement_level, n_votes: d.n_usable_models, n_runs: fs.length,
    confidence: confs.length ? Math.round((confs.reduce((s, x) => s + Number(x), 0) / confs.length) * 100) / 100 : null, flags };
});


// ── 3b) DEC-59 · actor (ใครเป็นผู้ทำ) + จำกัดการใช้ข้อความซ้ำ — ปรับสถานะหลังตัดสินด้วย engine · เหลือเฉพาะ "มีหลักฐาน" → "บางส่วน" ─────────
const ACTOR_RANK = { performed: 3, led: 2, oversaw: 1, mentioned: 0 };
const actorsBy = {};   // id → { runKey: actor }
for (const k of Object.keys(pre.model_results || {})) {
  const mr = pre.model_results[k]; if (!mr || mr.status !== 'ok' || !mr.output) continue;
  try {
    const o = JSON.parse(String(mr.output.text).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    (Array.isArray(o.actors) ? o.actors : []).forEach((a) => { if (a && typeof a.id === 'string' && a.actor in ACTOR_RANK) (actorsBy[a.id] = actorsBy[a.id] || {})[k] = a.actor; });
  } catch (e) { /* ไม่มี actors → ไม่ปรับ */ }
}
// actor ของข้อหนึ่ง = ค่าเสียงข้างมากของรอบที่ตอบ "มีหลักฐาน" (เสมอ → ค่าที่อ่อนกว่า)
function actorOf(id, findings) {
  const runs = findings.filter((f) => f.requirement_id === id && f.final_vote === 'evidenced').map((f) => f.model_key);
  const use = runs.length ? runs : findings.filter((f) => f.requirement_id === id && f.final_vote === 'partially').map((f) => f.model_key);
  const labels = use.map((k) => (actorsBy[id] || {})[k]).filter(Boolean);
  if (!labels.length) return '';
  const cnt = {}; labels.forEach((x) => { cnt[x] = (cnt[x] || 0) + 1; });
  return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || ACTOR_RANK[a] - ACTOR_RANK[b])[0];
}
const findingsAll = ev.findings;
let nAdjActor = 0, nAdjReuse = 0, nActorKnown = 0;
for (const r of rows) {
  r.actor = r.status === 'missing' || r.status === 'abstained' ? '' : actorOf(r.id, findingsAll);
  if (r.actor) nActorKnown++;
  if (r.status === 'evidenced' && r.hands_on && r.actor && ACTOR_RANK[r.actor] < ACTOR_RANK.performed) { r.status = 'partially'; r.adjust = 'D3_actor'; nAdjActor++; }
}
// D5: ข้อความเดียว (หรือซ้อนทับกัน ≥ 60%) เป็นหลักฐานเต็มได้ไม่เกิน QUOTE_REUSE_CAP ข้อ · เลือกข้อที่เฉพาะอาชีพ (df ต่ำ) น้ำหนักสูงไว้ก่อน
const cap = Number(cfg.QUOTE_REUSE_CAP) || 2;
const ovl = (a, b) => Math.max(0, Math.min(a.ev_end, b.ev_end) - Math.max(a.ev_start, b.ev_start)) / Math.max(1, Math.min(a.ev_end - a.ev_start, b.ev_end - b.ev_start));
const cand = rows.filter((r) => r.status === 'evidenced' && r.ev_start >= 0 && r.source !== 'learner');
const par = cand.map((_, i) => i); const find = (i) => (par[i] === i ? i : (par[i] = find(par[i])));
for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) if (ovl(cand[i], cand[j]) >= 0.6) par[find(j)] = find(i);
const groups = {}; cand.forEach((r, i) => { (groups[find(i)] = groups[find(i)] || []).push(r); });
for (const g of Object.values(groups)) {
  if (g.length <= cap) continue;
  g.sort((a, b) => a.df - b.df || b.w - a.w).slice(cap).forEach((r) => { r.status = 'partially'; r.adjust = 'D5_reuse'; nAdjReuse++; });
}
// งานหลัก (T): ใช้กฎ actor เดียวกัน · อาชีพเชิงเทคนิคต้อง performed · อาชีพบริหารรับ led
const minActor = ACTOR_RANK[role.task_min_actor] === undefined ? 3 : ACTOR_RANK[role.task_min_actor];
const tasksAdj = ev.task_decisions.map((t) => {
  const fs = ev.findings.filter((f) => f.target_kind === 'task' && f.requirement_id === t.task_id);
  const runs = fs.filter((f) => f.final_vote === 'evidenced').map((f) => f.model_key);
  const labels = (runs.length ? runs : fs.filter((f) => f.final_vote === 'partially').map((f) => f.model_key)).map((k) => (actorsBy[t.task_id] || {})[k]).filter(Boolean);
  let actor = '';
  if (labels.length) { const cnt = {}; labels.forEach((x) => { cnt[x] = (cnt[x] || 0) + 1; }); actor = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || ACTOR_RANK[a] - ACTOR_RANK[b])[0]; }
  let status = t.final_status, adjust = '';
  if (status === 'evidenced' && actor && ACTOR_RANK[actor] < minActor) { status = 'partially'; adjust = 'D3_actor'; nAdjActor++; }
  return { ...t, status, adjust, actor };
});

// ── 4) ตัวกรอง + คะแนน ──────────────────────────────────────────────────────
const rf = ev.findings.filter((f) => f.target_kind === 'requirement' && f.claimed_status !== 'missing');
const has = (f, k) => String(f.rule_flags).split('|').includes(k);
const nameOf = Object.fromEntries(role.requirements.map((r) => [r.id, r.name]));
const rejected = rf.filter((f) => has(f, 'R2_quote_not_found') || has(f, 'R3_low_overlap') || has(f, 'R3b_unrelated')).map((f) => ({
  id: f.requirement_id, name: nameOf[f.requirement_id], claimed: f.claimed_status, quote: f.quote, run: f.model_key,
  rule: has(f, 'R2_quote_not_found') ? 'R2' : 'R3',
  reason: has(f, 'R2_quote_not_found') ? 'ไม่พบข้อความนี้ในเรซูเม (แม้ซ่อมรูปคำแล้ว)' : has(f, 'R3b_unrelated') ? 'ตรวจความหมายแล้วไม่เกี่ยวกับข้อกำหนด (R3b)' : 'คำไม่ตรงกับข้อกำหนด (overlap ' + f.overlap_score + ' < θ ' + pre.project_cfg.theta + ')' }));
const nR2 = rf.filter((f) => has(f, 'R2_quote_not_found')).length;
const nR3 = rf.filter((f) => has(f, 'R3_low_overlap') || has(f, 'R3b_unrelated')).length;
const nUnv = rf.filter((f) => has(f, 'R3b_unavailable')).length;
const nSem = rf.filter((f) => has(f, 'R3b_supports') || has(f, 'R3b_partial')).length;
const nRep = rf.filter((f) => has(f, 'R2_repaired')).length;
const S = ev.scores;
const num = (x) => (x === 'N/A' || x === null || x === undefined ? null : x);
const DOMAINS = ['Essential Skills', 'Transferable Skills', 'Knowledge', 'Work Activities'];
const SC = { evidenced: 1, partially: 0.5, missing: 0 };
const by_domain = DOMAINS.map((dn) => {
  const L = rows.filter((x) => x.domain === dn); const D = L.filter((x) => x.status !== 'abstained');
  const wD = D.reduce((s, x) => s + x.w, 0); const wA = L.reduce((s, x) => s + x.w, 0);
  return { domain: dn, n: L.length, readiness_pct: wD ? Math.round((D.reduce((s, x) => s + x.w * SC[x.status], 0) / wD) * 10000) / 100 : null, weight_share: Math.round(wA * 10000) / 10000,
    n_evidenced: L.filter((x) => x.status === 'evidenced').length, n_partially: L.filter((x) => x.status === 'partially').length, n_missing: L.filter((x) => x.status === 'missing').length, n_abstained: L.filter((x) => x.status === 'abstained').length };
}).filter((d) => d.n > 0);


// ── 4b) DEC-59 · คำนวณดัชนีใหม่หลังปรับ: R (เดิม), R_role (ถ่วง idf), T, Role-Fit F, H ──────────────────────
const r2 = (x) => Math.round(x * 100) / 100;
const Dn = rows.filter((x) => x.status !== 'abstained');
const wsum = (f) => Dn.reduce((s, x) => s + f(x), 0);
const R_adj = wsum((x) => x.w) ? r2((wsum((x) => x.w * SC[x.status]) / wsum((x) => x.w)) * 100) : null;
const R_role = wsum((x) => x.w * x.idf) ? r2((wsum((x) => x.w * x.idf * SC[x.status]) / wsum((x) => x.w * x.idf)) * 100) : null;
const T_adj = tasksAdj.length ? r2((tasksAdj.reduce((s, t) => s + SC[t.status], 0) / tasksAdj.length) * 100) : null;
const wT = Number(cfg.FIT_WEIGHT_T); const wTT = isFinite(wT) ? wT : 0.5;
const F = R_role === null ? null : (T_adj === null ? R_role : r2((1 - wTT) * R_role + wTT * T_adj));
let fit_band = 'low';
if (F !== null) { if (F >= cfg.FIT_HIGH_MIN && T_adj !== null && T_adj >= cfg.FIT_HIGH_T_MIN) fit_band = 'high'; else if (F >= cfg.FIT_MID_MIN) fit_band = 'mid'; }
const techTotal = role.signal_tech_available !== undefined ? role.signal_tech_available : S.n_tech_total;
const h_sufficient = techTotal >= (cfg.H_MIN_TECH || 10);
// โทเคน (D7)
const sumU = (arr) => arr.reduce((a, u) => { if (!u) return a; a.input += u.promptTokenCount || 0; a.output += u.candidatesTokenCount || 0; a.thinking += u.thoughtsTokenCount || 0; a.total += u.totalTokenCount || 0; a.calls++; return a; }, { input: 0, output: 0, thinking: 0, total: 0, calls: 0 });
const stages = [
  { stage: 'อ่านไฟล์ (OCR)', ...sumU([((prepTxt.ocr || {}).usage) || null]) },
  { stage: 'วิเคราะห์เรซูเม (' + pre.run_info.length + ' รอบ)', ...sumU(pre.run_info.map((r) => r.usage)) },
  { stage: 'ตรวจความหมาย (' + (verifier.batches || []).length + ' batch)', ...sumU((verifier.batches || []).map((b) => b.usage)) },
];
const totU = stages.reduce((a, x) => ({ input: a.input + x.input, output: a.output + x.output, thinking: a.thinking + x.thinking, total: a.total + x.total, calls: a.calls + x.calls }), { input: 0, output: 0, thinking: 0, total: 0, calls: 0 });
const pin = Number(cfg.PRICE_PER_1M_INPUT_USD), pout = Number(cfg.PRICE_PER_1M_OUTPUT_USD);
const cost = cfg.PRICE_PER_1M_INPUT_USD != null && isFinite(pin) && isFinite(pout) ? Math.round(((totU.input * pin + (totU.output + totU.thinking) * pout) / 1e6) * 10000) / 10000 : null;
const tokens = { stages, total: totU, cost_usd: cost, cached_checks: verifier.n_cached, fresh_checks: verifier.n_fresh };
const counts = { evidenced: rows.filter((x) => x.status === 'evidenced').length, partially: rows.filter((x) => x.status === 'partially').length,
  missing: rows.filter((x) => x.status === 'missing').length, abstained: rows.filter((x) => x.status === 'abstained').length };
const adjust = { n_actor: nAdjActor, n_reuse: nAdjReuse, n_actor_known: nActorKnown };

// ── 5) ข้อมูลผู้สมัคร (แสดงผลเท่านั้น) ───────────────────────────────────────
let profile = null;
for (const k of Object.keys(pre.model_results)) {
  if (profile) break;
  const mr = pre.model_results[k];
  if (pre.source === 'gemini' && mr.status === 'ok') { try { profile = (JSON.parse(mr.output.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')) || {}).profile || null; } catch (e) { profile = null; } }
}
const certNames = profile && Array.isArray(profile.certifications) ? profile.certifications : [];
const certs = certNames.filter((c) => typeof c === 'string' && c.trim()).slice(0, 12).map((c) => ({ name: c.trim(), verified: ENGINE.ruleR2(c.trim(), text, pre.project_cfg).verified }));
const firstLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
const count = (s) => rows.filter((x) => x.status === s).length;
const top = rows.filter((x) => x.status === 'evidenced').sort((a, b) => b.w - a.w).slice(0, 3).map((x) => x.name);
const gaps = rows.filter((x) => x.status === 'missing').sort((a, b) => b.w - a.w).slice(0, 3).map((x) => x.name);
const yearsText = ENGINE.estimateYearsExperience(text, new Date().getFullYear());
const candidate = {
  current_role: (profile && profile.current_role) || firstLines[1] || '',
  years_experience: profile && typeof profile.years_experience === 'number' ? profile.years_experience : yearsText,
  years_from_dates: yearsText,
  headline_th: (profile && profile.headline_th) || '',
  summary_th: (profile && profile.summary_th) ||
    ('สรุปจากกฎสำรอง (ไม่ใช้ LLM): พบหลักฐานชัดเจน ' + count('evidenced') + ' ข้อ บางส่วน ' + count('partially') + ' ข้อ จาก 30 ข้อกำหนดของอาชีพ ' + role.name_en +
     (top.length ? ' · จุดแข็ง: ' + top.join(', ') : '') + (gaps.length ? ' · ช่องว่างสำคัญ: ' + gaps.join(', ') : '')),
  summary_source: profile ? 'gemini' : 'template',
  certifications: certs,
  pii_masked_count: prepTxt.pii_masked_count, pii_counts: prepTxt.pii_counts, char_count: prepTxt.char_count,
  supplement_chars: v.input.supplement_chars || 0,
};

return [{
  json: {
    analyst: { source: pre.source, model: pre.source === 'gemini' ? ((pre.run_info.find((r) => r.ok) || {}).model_version || bp.model) : 'rule-based alias matcher',
      requested_model: bp.model, prompt_version: bp.prompt_version, fallback_reason: pre.fallback_reason, runs_requested: v.runs,
      runs_usable: pre.run_info.filter((r) => r.ok).length, run_info: pre.run_info, n_assessed: rows.filter((r) => r.n_runs > 0).length },
    verifier,
    requirements: rows,
    scores: {
      readiness_pct: R_adj, readiness_pct_engine: num(S.readiness_pct), r_role: R_role, role_fit: F, fit_band, weighted_coverage: num(S.weighted_coverage),
      n_evidenced: counts.evidenced, n_partially: counts.partially, n_missing: counts.missing, n_abstained: counts.abstained, by_domain, adjust,
      role_task_index: T_adj, n_role_tasks: S.n_role_tasks, n_role_tasks_decided: S.n_role_tasks_decided,
      tech_match_pct: h_sufficient ? num(S.tech_match_pct) : null, h_sufficient, n_tech_found: S.n_tech_found, n_tech_total: techTotal,
      ablation: { r3_lexical_only: num(S.ablation.r3_lexical_only), no_r3: num(S.ablation.no_r3), hybrid_no_floors: num(S.ablation.r3_hybrid_no_floors) },
      n_floor_credential: S.n_floor_credential, n_floor_linkage: S.n_floor_linkage,
    },
    guard: { n_claims: rf.length, n_rejected_r2: nR2, n_rejected_r3: nR3, n_rejected: nR2 + nR3, n_unverified: nUnv, n_semantic_pass: nSem, n_repaired: nRep,
      n_passed: rf.length - nR2 - nR3 - nUnv, U: rf.length ? Math.round(((nR2 + nR3) / rf.length) * 10000) / 10000 : null, rejected },
    tasks: tasksAdj.map((t) => ({ task_id: t.task_id, task: t.task_text, status: t.status, status_engine: t.final_status, actor: t.actor, adjust: t.adjust, quote: t.evidence_quote, agreement: t.agreement_level })),
    tech: { found: ev.tech.found.map((f) => f.technology), n_found: ev.tech.n_found, n_total: ev.tech.n_total, all: (role.signal_tech || []).map((t) => t.technology) },
    candidate,
    tokens,
    version: { wf_version: STAMP.wf_version, build_id: STAMP.build_id, built_at: STAMP.built_at, engine_version: ENGINE.ENGINE_VERSION, commit: STAMP.commit },
    ver_issues: [verIssue, bp.ver_issue, pre.ver_issue].filter(Boolean),
  },
}];
