// ─────────────────────────────────────────────────────────────────────────────
// Verify Evidence (R0·R2·R3·R1·R5·R6) · ตัดสินด้วย engine.evaluateRun ตัวเดียวกับระบบเต็ม (หัวข้อ 3.4.4–3.4.6 · DEC-51–55)
//   R2 quote ต้องพบในเรซูเม (ตรงตัว · ยุบช่องว่าง · ซ่อมรูปคำ ≥ 90%) · R3a คำซ้ำ · R3b Gemini ตรวจความหมาย
//   R1 โหวตระหว่างรอบ (ANALYST_RUNS) · R5 ใบรับรองในคลัง · R6 ทักษะพื้นฐานจากกิจกรรมที่มีหลักฐาน · T งานหลัก · H เทคโนโลยี
// ─────────────────────────────────────────────────────────────────────────────
//@@ENGINE_ALL@@
const v = $('Config & Validate').first().json;
const cfg = v.cfg;
const rd = $('Load Role Data (O*NET 31.0)').first().json;
const role = rd.role;
const prepTxt = $('Clean Text & Mask PII').first().json;
const bp = $('Build Analyst Prompt').first().json;
const pre = $('Prepare Relevance Checks').first().json;
const text = prepTxt.text;
const inp = $input.first().json || {};
const reqs = role.requirements.map((r) => ({ requirement_id: r.id, element_id: r.element_id, element_name: r.name, element_description: r.desc, element_aliases: r.aliases, domain: r.domain, weight_renormalized: r.w }));

// ── 1) คำตอบของผู้ตรวจ (R3b) ───────────────────────────────────────────────
const verifier = { called: !!pre.use_verifier, n_checks: pre.n_checks, model: pre.use_verifier ? pre.model : '', error: '', finish_reason: '', usage: null, self_verification: true };
let vText = null;
if (pre.use_verifier) {
  if (inp.error || !Array.isArray(inp.candidates)) verifier.error = String((inp.error && (inp.error.message || inp.error.description)) || inp.error || 'ไม่มีผลตอบกลับ').slice(0, 240);
  else { const c = inp.candidates[0] || {}; vText = ((c.content || {}).parts || []).filter((p) => !p.thought).map((p) => p.text || '').join(''); verifier.finish_reason = c.finishReason || ''; verifier.usage = inp.usageMetadata || null; }
}
const verifierResults = {};
for (const k of pre.verifier_keys || []) verifierResults[k] = vText !== null ? { status: 'ok', output: { text: vText } } : { status: 'failed', output: null };

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
    claimed: claims.length ? claims.map((f) => f.claimed_status).join('/') : (fs.length ? 'missing' : null), status: d.final_status, quote: d.evidence_quote, source,
    verified: claims.length ? claims.some((f) => f.quote_verified === true) : null, overlap: ovs.length ? Math.max(...ovs) : null,
    r3_layer: claims.some((f) => f.r3_layer === 'lexical') ? 'lexical' : (claims.some((f) => f.r3_layer === 'semantic') ? 'semantic' : ''),
    verdicts: claims.map((f) => f.verifier_verdict).filter(Boolean), agreement: d.agreement_level, n_votes: d.n_usable_models, n_runs: fs.length,
    confidence: confs.length ? Math.round((confs.reduce((s, x) => s + Number(x), 0) / confs.length) * 100) / 100 : null, flags };
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
      readiness_pct: num(S.readiness_pct), weighted_coverage: num(S.weighted_coverage), n_evidenced: S.n_evidenced, n_partially: S.n_partially,
      n_missing: S.n_missing, n_abstained: S.n_abstained, by_domain,
      role_task_index: num(S.role_task_index), n_role_tasks: S.n_role_tasks, n_role_tasks_decided: S.n_role_tasks_decided,
      tech_match_pct: num(S.tech_match_pct), n_tech_found: S.n_tech_found, n_tech_total: S.n_tech_total,
      ablation: { r3_lexical_only: num(S.ablation.r3_lexical_only), no_r3: num(S.ablation.no_r3), hybrid_no_floors: num(S.ablation.r3_hybrid_no_floors) },
      n_floor_credential: S.n_floor_credential, n_floor_linkage: S.n_floor_linkage,
    },
    guard: { n_claims: rf.length, n_rejected_r2: nR2, n_rejected_r3: nR3, n_rejected: nR2 + nR3, n_unverified: nUnv, n_semantic_pass: nSem, n_repaired: nRep,
      n_passed: rf.length - nR2 - nR3 - nUnv, U: rf.length ? Math.round(((nR2 + nR3) / rf.length) * 10000) / 10000 : null, rejected },
    tasks: ev.task_decisions.map((t) => ({ task_id: t.task_id, task: t.task_text, status: t.final_status, quote: t.evidence_quote, agreement: t.agreement_level })),
    tech: { found: ev.tech.found.map((f) => f.technology), n_found: ev.tech.n_found, n_total: ev.tech.n_total, all: (role.signal_tech || []).map((t) => t.technology) },
    candidate,
  },
}];
