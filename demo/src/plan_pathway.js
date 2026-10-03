// ─────────────────────────────────────────────────────────────────────────────
// Plan Pathway (สมการ 3.7–3.8) · ตรรกะเดียวกับ engine.buildPlan
//   Hmax = M × 4.33 × h                         (3.7)
//   d_k  = Σ w(ข้อกำหนดช่องว่างใหม่ที่ k ปิดได้) / ชั่วโมง_k   (3.8)  เลือกมากสุดทีละรายการจนเต็ม Hmax
//   ใช้เฉพาะคลังที่ verified + ความเชื่อมโยง L1 ที่ผ่านตรวจ (DEC-16, DEC-21) → ไม่มี URL ที่โมเดลแต่งขึ้น
//   Demo เพิ่ม: ตัดใบรับรองที่ผู้สมัครมีแล้ว · จัดตารางเรียนรายสัปดาห์ตามลำดับ phase
//   DEC-56: ผู้มีประสบการณ์ ≥ plan_experienced_years ปี ไม่ใช้รายการระดับ Beginner กับข้อที่มีหลักฐานบางส่วนแล้ว
//   ข้อ "ยังยืนยันไม่ได้" (abstained) ไม่ใส่ในแผน — ผู้เรียนเพิ่มหลักฐานแล้ววิเคราะห์ใหม่ได้ (DEC-58)
// ─────────────────────────────────────────────────────────────────────────────
const STAMP = /*@@STAMP@@*/{};   // DEC-59 · ตราประทับรุ่น ฝังตอน build ตรวจกับโหนด Config & Validate ตอน run
const verIssue = (() => { const c = ($('Config & Validate').first().json.version) || {}; const bad = [];
  if (STAMP.build_id !== c.build_id) bad.push('build ' + STAMP.build_id + ' ≠ ' + c.build_id);
  
  return bad.length ? 'Plan Pathway: ' + bad.join(' · ') : ''; })();
const round = (x, d) => (x === null || x === undefined || Number.isNaN(x) ? null : Math.round(x * 10 ** d) / 10 ** d);
const v = $('Config & Validate').first().json;
const cfg = v.cfg;
const { months, hours_per_week: h, mode } = v.input;
const role = $('Load Role Data (O*NET 31.0)').first().json.role;
const text = $('Clean Text & Mask PII').first().json.text;
const ev = $input.first().json;
const rows = ev.requirements;

const Hmax = round(months * cfg.WEEKS_PER_MONTH * h, 4);                       // สมการ 3.7
const w = Object.fromEntries(rows.map((r) => [r.id, r.w]));
const nameOf = Object.fromEntries(rows.map((r) => [r.id, r.name]));
const gaps = rows.filter((r) => r.status === 'missing' || r.status === 'partially').map((r) => r.id);
const gapSet = new Set(gaps);
const statusOf = Object.fromEntries(rows.map((r) => [r.id, r.status]));
const pc = v.project_cfg || {};
const years = ev.candidate ? ev.candidate.years_experience : null;
const experienced = pc.plan_level_filter === true && typeof years === 'number' && years >= (pc.plan_experienced_years || 5);
const levelFiltered = new Set();

// ใบรับรองที่มีอยู่แล้ว (ค้นในเรซูเมแบบตรงคำ)
const lines = text.toLowerCase().split(/\n|,|;|\||•/).map((l) => ' ' + l.replace(/\s+/g, ' ') + ' ');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function owned(it) {
  if (it.type !== 'certification') return null;
  const keys = [];
  if (it.exam_code && /^[A-Za-z0-9-]{3,}$/.test(it.exam_code)) keys.push(it.exam_code);
  (it.title.match(/\(([^)]+)\)/g) || []).forEach((p) => { const k = p.slice(1, -1).trim(); if (k.length >= 3 && k.length <= 20) keys.push(k); });
  keys.push(it.title.replace(/\s*\([^)]*\)\s*/g, ' ').trim());
  for (const k of keys) {
    const re = new RegExp('(^|[^a-z0-9])' + esc(k.toLowerCase()) + '($|[^a-z0-9])');
    // ตรวจทีละบรรทัด และตัดกรณี "PMP preparation course" / "studying for CCNA" — ยังไม่ได้ใบรับรองจริง
    for (const line of lines) {
      if (re.test(line) && !/prep|preparation|course|training|studying|in progress|candidate|planned|กำลัง|เตรียมสอบ/.test(line)) return k;
    }
  }
  return null;
}
const ownedItems = [];
const Gk = {}; const candByReq = {};
for (const it of role.items) {
  let cov = (it.covers_l1 || []).filter((r) => gapSet.has(r));
  if (experienced && String(it.level || '').toLowerCase() === 'beginner') {
    cov.filter((r) => statusOf[r] === 'partially').forEach((r) => levelFiltered.add(r));
    cov = cov.filter((r) => statusOf[r] !== 'partially');
  }
  const o = owned(it);
  if (o) { ownedItems.push({ id: it.id, title: it.title, matched: o }); continue; }
  if (!cov.length) continue;
  cov.forEach((r) => { candByReq[r] = true; });
  if (!it.modes.includes(mode)) continue;
  Gk[it.id] = new Set(cov);
}
const items = Object.fromEntries(role.items.map((i) => [i.id, i]));
const covered = new Set(); let cum = 0; const chosen = [];
const pool = Object.keys(Gk).sort(); const EPS = 1e-12;
for (;;) {
  let best = null;
  for (const id of pool) {
    const hk = items[id].hours;
    if (cum + hk > Hmax + EPS) continue;
    const add = [...Gk[id]].filter((r) => !covered.has(r));
    if (!add.length) continue;
    const wsum = add.reduce((s, r) => s + w[r], 0);
    const dk = wsum / hk;                                                       // สมการ 3.8
    if (!best || dk > best.dk + EPS || (Math.abs(dk - best.dk) <= EPS && id < best.id)) best = { id, dk, add, wsum, hk };
  }
  if (!best) break;
  cum += best.hk; best.add.forEach((r) => covered.add(r));
  chosen.push({ ...best, rank: chosen.length + 1 });
}

// จัดตารางเรียน: foundation → core → advanced/cert prep แล้วตามลำดับที่ถูกเลือก
const PHASE_ORDER = { foundation: 0, core_gap_closure: 1, advanced_or_cert_prep: 2 };
const PHASE_TH = { foundation: 'ปูพื้นฐาน', core_gap_closure: 'ปิดช่องว่างหลัก', advanced_or_cert_prep: 'ขั้นสูง / เตรียมสอบใบรับรอง' };
const ordered = chosen.slice().sort((a, b) => (PHASE_ORDER[items[a.id].phase] ?? 1) - (PHASE_ORDER[items[b.id].phase] ?? 1) || a.rank - b.rank);
let t = 0;
const planItems = ordered.map((c, i) => {
  const it = items[c.id];
  const startW = t / h; t += c.hk; const endW = t / h;
  return {
    seq: i + 1, pick_rank: c.rank, id: it.id, type: it.type, title: it.title, provider: it.provider, platform: it.platform,
    url: /^https:\/\/[^\s"'<>]+$/i.test(it.url) ? it.url : '', level: it.level, difficulty: it.difficulty, delivery: it.delivery,
    language: it.language, outcome_th: it.outcome_th, skills: it.skills, hours: c.hk, cost_cat: it.cost_cat, cost_usd: it.cost_usd,
    exam_code: it.exam_code, validity_years: it.validity_years, phase: it.phase, phase_th: PHASE_TH[it.phase] || it.phase,
    portfolio: it.portfolio, verified_on: it.verified_on,
    covers: c.add.sort().map((r) => ({ id: r, name: nameOf[r] })), new_weight: round(c.wsum, 6), d_k: round(c.dk, 8),
    start_week: round(startW, 2), end_week: round(endW, 2),
    start_month: round(startW / cfg.WEEKS_PER_MONTH, 2), end_month: round(endW / cfg.WEEKS_PER_MONTH, 2),
  };
});

// DEC-58: ไม่คาดการณ์คะแนนหลังเรียนจบ (การเรียนจบไม่ใช่หลักฐานการทำงาน · ตามนิยามของงานวิจัยคอร์ส/ใบรับรองได้อย่างมาก "บางส่วน")
// รายงานเฉพาะสัดส่วนช่องว่างที่แผนครอบคลุม และน้ำหนักของช่องว่างเหล่านั้น
const withCand = gaps.filter((g) => candByReq[g]);
let notice = '';
if (!gaps.length) notice = 'ไม่พบช่องว่างทักษะจากข้อกำหนดที่ระบบสรุปได้ จึงไม่มีรายการเรียนรู้ในแผน';
else if (!planItems.length) notice = 'ยังไม่มีรายการที่ผ่านการตรวจความเชื่อมโยงและอยู่ภายในเวลาที่จัดสรรได้ ลองเพิ่มชั่วโมงต่อสัปดาห์หรือระยะเวลา';

return [{
  json: {
    ...ev,
    ver_issues: (ev.ver_issues || []).concat(verIssue ? [verIssue] : []),
    plan: {
      months, hours_per_week: h, mode, Hmax, total_hours: round(cum, 2), utilization: Hmax ? round(cum / Hmax, 4) : null,
      weeks_needed: round(cum / h, 1), n_gaps: gaps.length, n_covered: covered.size,
      gap_coverage: gaps.length ? round(covered.size / gaps.length, 4) : null,
      gap_coverage_with_candidate: withCand.length ? round(covered.size / withCand.length, 4) : null,
      uncovered_no_candidate: gaps.filter((g) => !candByReq[g]).map((r) => ({ id: r, name: nameOf[r] })),
      uncovered_over_capacity: gaps.filter((g) => candByReq[g] && !covered.has(g) && !levelFiltered.has(g)).map((r) => ({ id: r, name: nameOf[r] })),
      uncovered_level_filtered: gaps.filter((g) => levelFiltered.has(g) && !covered.has(g)).map((r) => ({ id: r, name: nameOf[r] })),
      learner: { years_experience: typeof years === 'number' ? years : null, level_filter_applied: experienced },
      n_unverified: rows.filter((r) => r.status === 'abstained').length,
      owned: ownedItems,
      items: planItems,
      n_courses: planItems.filter((p) => p.type === 'course').length,
      n_certs: planItems.filter((p) => p.type === 'certification').length,
      cost_usd: planItems.reduce((s, p) => s + (p.cost_usd || 0), 0),
      covered_gap_weight: round([...covered].reduce((s, r) => s + w[r], 0), 6), gap_weight: round(gaps.reduce((s, r) => s + w[r], 0), 6),
      notice,
    },
  },
}];
