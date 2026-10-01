// ─────────────────────────────────────────────────────────────────────────────
// Verify Evidence (R0·R2·R3) · กรองคำตอบของโมเดลด้วยกฎของงานวิจัย (หัวข้อ 3.5.4)
//   R0 โครงสร้าง JSON ถูกต้อง · R2 quote ต้องพบ "ตรงตัวอักษร" ในเรซูเม · R3 quote ต้องเกี่ยวกับข้อกำหนด (θ)
//   Demo รอบแรกใช้โมเดลเดียว จึงไม่มี R1 (โหวต ≥ 2 โมเดล) — ระบบเต็มใช้ 3 โมเดล
//   ถ้า Gemini ล้ม/ปิดไว้ → ใช้ "กฎสำรอง" จับคู่คำพ้อง (ไม่ใช้ LLM) และติดป้ายให้เห็นในรายงาน
// ─────────────────────────────────────────────────────────────────────────────
const STATUSES = ['evidenced', 'partially', 'missing'];
const STATUS_SCORE = { evidenced: 1, partially: 0.5, missing: 0 };
const SCHEMA_VERSION = 'analyst_v1.0';
//@@ENGINE:STOP_WORDS,round,splitList,stripFences,ruleR0,collapseWs,ruleR2,tokenize,targetTokens,aliasHit,overlapScore@@

const cfg = $('Config & Validate').first().json.cfg;
const role = $('Load Role Data (O*NET 31.0)').first().json.role;
const prep = $('Clean Text & Mask PII').first().json;
const bp = $('Build Analyst Prompt').first().json;
const text = prep.text;
const inp = $input.first().json || {};
const projectCfg = { alias_min_length: cfg.ALIAS_MIN_LEN, overlap_denominator_cap: cfg.OVERLAP_CAP, theta: cfg.THETA };
const reqs = role.requirements.map((r) => ({ ...r, requirement_id: r.id, element_name: r.name, element_description: r.desc, element_aliases: r.aliases }));
const reqIds = reqs.map((r) => r.id);

// ── 1) อ่านคำตอบ Gemini ─────────────────────────────────────────────────────
let source = 'gemini';
let rawText = null, modelError = '', finishReason = '', usage = null, modelVersion = '';
if (!bp.use_gemini) {
  source = 'offline_rules';
  modelError = 'ปิดการเรียก Gemini ใน Config (USE_GEMINI_ANALYST=false)';
} else if (inp.error) {
  modelError = String((inp.error && (inp.error.message || inp.error.description)) || inp.error).slice(0, 240);
} else {
  const c = (inp.candidates || [])[0] || {};
  rawText = ((c.content || {}).parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
  finishReason = c.finishReason || '';
  usage = inp.usageMetadata || null;
  modelVersion = inp.modelVersion || '';
}
let r0 = { usable: false, reason_code: 'no_output', assessments: [] };
if (source === 'gemini' && !modelError) r0 = ruleR0(rawText, role.role_id, reqIds);

let profile = null;
if (r0.usable) {
  try { profile = (JSON.parse(stripFences(rawText)) || {}).profile || null; } catch (e) { profile = null; }
}

// ── 2) กฎสำรอง (ไม่ใช้ LLM) ────────────────────────────────────────────────
function offlineAnalyst() {
  // ใช้เฉพาะบรรทัดที่เป็นประโยค/รายการ (≥ 7 คำ) — ไม่อนุมานจากชื่อตำแหน่ง ชื่อบริษัท หรือสถาบัน (กฎข้อ 2 ของ prompt)
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length >= 20 && l.split(/\s+/).length >= 7);
  // ให้คะแนนทุกบรรทัดด้วยตัววัดเดียวกับ R3 (คำพ้อง = 1 · ไม่งั้นสัดส่วนคำร่วม) แล้วเลือกบรรทัดที่ดีที่สุด
  return reqs.map((r) => {
    let best = null;
    for (const l of lines) {
      const ov = overlapScore(l, r, projectCfg);
      if (!best || ov.score > best.score) best = { l, score: ov.score, alias: ov.alias };
    }
    if (!best || best.score < cfg.THETA) return { requirement_id: r.id, status: 'missing', quote: '', confidence: null };
    let l = best.l;
    if (l.length > 300) { const i = best.alias ? Math.max(0, l.toLowerCase().indexOf(best.alias) - 100) : 0; l = l.slice(i, i + 300).trim(); }
    const concrete = /\b(built|developed|designed|managed|led|configured|delivered|implemented|deployed|created|analy[sz]ed|wrote|planned|coordinated|negotiated|maintained|monitored|led|trained)\b/i.test(l);
    const status = best.score >= 0.3 && concrete ? 'evidenced' : 'partially';
    return { requirement_id: r.id, status, quote: l, confidence: null };
  });
}
let assessments, fallbackReason = '';
if (r0.usable) assessments = r0.assessments;
else {
  fallbackReason = modelError || ('คำตอบของโมเดลไม่ผ่าน R0: ' + r0.reason_code + (finishReason ? ' (finishReason ' + finishReason + ')' : ''));
  source = 'offline_rules';
  assessments = offlineAnalyst();
}

// ── 3) ตรวจทีละข้อ R2 → R3 ──────────────────────────────────────────────────
const byId = Object.fromEntries(assessments.map((a) => [a.requirement_id, a]));
let nClaims = 0, nR2 = 0, nR3 = 0;
const rejected = [];
const rows = reqs.map((r) => {
  const a = byId[r.id];
  const row = { id: r.id, element_id: r.element_id, name: r.name, desc: r.desc, domain: r.domain, w: r.w, im: r.im, lv: r.lv, rank: r.rank,
    claimed: a ? a.status : null, status: 'abstained', quote: '', verified: null, overlap: null, alias: null, confidence: a ? a.confidence : null, flags: [] };
  if (!a) { row.flags.push('not_assessed'); return row; }
  if (a.status === 'missing') { row.status = 'missing'; row.flags.push('model_missing'); return row; }
  nClaims++;
  const r2 = ruleR2(a.quote, text);
  row.verified = r2.verified;
  if (!r2.verified) {
    nR2++; row.status = 'missing'; row.flags.push('R2_quote_not_found');
    rejected.push({ id: r.id, name: r.name, claimed: a.status, quote: a.quote, rule: 'R2', reason: 'ไม่พบข้อความนี้ในเรซูเมแบบตรงตัวอักษร' });
    return row;
  }
  if (r2.text_version === 'whitespace_collapsed') row.flags.push('R2_whitespace_collapsed');
  const ov = overlapScore(a.quote, r, projectCfg);
  row.overlap = round(ov.score, 4); row.alias = ov.alias;
  if (ov.alias) row.flags.push('R3_alias_hit');
  if (ov.score < cfg.THETA) {
    nR3++; row.status = 'missing'; row.flags.push('R3_low_overlap');
    rejected.push({ id: r.id, name: r.name, claimed: a.status, quote: a.quote, rule: 'R3', reason: 'ข้อความไม่เกี่ยวกับข้อกำหนด (overlap ' + round(ov.score, 3) + ' < θ ' + cfg.THETA + ')' });
    return row;
  }
  row.status = a.status; row.quote = a.quote;
  return row;
});

// ── 4) คะแนน สมการ 3.4 (R) · 3.5 (C) · 3.6 (U) + รายโดเมน ───────────────────
function score(list) {
  const D = list.filter((d) => d.status !== 'abstained');
  const wA = list.reduce((s, d) => s + d.w, 0), wD = D.reduce((s, d) => s + d.w, 0);
  const num = D.reduce((s, d) => s + d.w * STATUS_SCORE[d.status], 0);
  return { R: wD ? round((num / wD) * 100, 2) : null, C: wA ? round(wD / wA, 4) : null, wA };
}
const all = score(rows);
const DOMAINS = ['Essential Skills', 'Transferable Skills', 'Knowledge', 'Work Activities'];
const by_domain = DOMAINS.map((d) => {
  const L = rows.filter((x) => x.domain === d);
  const s = score(L);
  return { domain: d, n: L.length, readiness_pct: s.R, weight_share: round(s.wA, 4),
    n_evidenced: L.filter((x) => x.status === 'evidenced').length, n_partially: L.filter((x) => x.status === 'partially').length,
    n_missing: L.filter((x) => x.status === 'missing').length };
}).filter((d) => d.n > 0);
const count = (s) => rows.filter((x) => x.status === s).length;

// ── 5) ข้อมูลผู้สมัคร (แสดงผลเท่านั้น) ───────────────────────────────────────
function yearsFromText() {
  const now = new Date().getFullYear();
  const spans = [];
  const re = /((?:19|20)\d{2})\s*(?:-|–|—|to|ถึง)\s*((?:19|20)\d{2}|present|current|now|ปัจจุบัน)/gi;
  let m; while ((m = re.exec(text))) { const a = +m[1]; const b = /\d/.test(m[2]) ? +m[2] : now; if (b >= a && b - a < 45) spans.push([a, b]); }
  if (!spans.length) return null;
  spans.sort((x, y) => x[0] - y[0]);
  let total = 0, [s, e] = spans[0];
  for (const [a, b] of spans.slice(1)) { if (a <= e) e = Math.max(e, b); else { total += e - s; s = a; e = b; } }
  return total + (e - s);
}
const certNames = profile && Array.isArray(profile.certifications) ? profile.certifications : [];
const certs = certNames.filter((c) => typeof c === 'string' && c.trim()).slice(0, 12)
  .map((c) => ({ name: c.trim(), verified: ruleR2(c.trim(), text).verified }));
const firstLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
const top = rows.filter((x) => x.status === 'evidenced').sort((a, b) => b.w - a.w).slice(0, 3).map((x) => x.name);
const gaps = rows.filter((x) => x.status === 'missing').sort((a, b) => b.w - a.w).slice(0, 3).map((x) => x.name);
const candidate = {
  current_role: (profile && profile.current_role) || firstLines[1] || '',
  years_experience: profile && typeof profile.years_experience === 'number' ? profile.years_experience : yearsFromText(),
  headline_th: (profile && profile.headline_th) || '',
  summary_th: (profile && profile.summary_th) ||
    ('สรุปจากกฎสำรอง (ไม่ใช้ LLM): พบหลักฐานชัดเจน ' + count('evidenced') + ' ข้อ บางส่วน ' + count('partially') + ' ข้อ จาก 30 ข้อกำหนดของอาชีพ ' + role.name_en +
     (top.length ? ' · จุดแข็ง: ' + top.join(', ') : '') + (gaps.length ? ' · ช่องว่างสำคัญ: ' + gaps.join(', ') : '')),
  summary_source: profile ? 'gemini' : 'template',
  certifications: certs,
  pii_masked_count: prep.pii_masked_count,
  pii_counts: prep.pii_counts,
  char_count: prep.char_count,
};

return [{
  json: {
    analyst: { source, model: source === 'gemini' ? (modelVersion || bp.model) : 'rule-based alias matcher', requested_model: bp.model,
      prompt_version: bp.prompt_version, fallback_reason: fallbackReason, r0_reason: r0.usable ? '' : r0.reason_code,
      finish_reason: finishReason, usage, n_assessed: assessments.length },
    requirements: rows,
    scores: {
      readiness_pct: all.R, weighted_coverage: all.C, n_evidenced: count('evidenced'), n_partially: count('partially'),
      n_missing: count('missing'), n_abstained: count('abstained'), by_domain,
    },
    guard: { n_claims: nClaims, n_rejected_r2: nR2, n_rejected_r3: nR3, n_rejected: nR2 + nR3,
      n_passed: nClaims - nR2 - nR3, U: nClaims ? round((nR2 + nR3) / nClaims, 4) : null, rejected },
    candidate,
  },
}];
