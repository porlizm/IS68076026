// simulate_coverage.mjs — ความครอบคลุมของแผนจำลอง (DEC-41): ถือว่าทั้ง 30 ข้อของทุกอาชีพเป็นช่องว่าง (กรณีเลวร้ายที่สุด)
// ใช้ buildPlan ของ engine ตัวเดียวกับระบบ · ผลใช้ใน book/numbers.json และ evidence/
//   node scripts/simulate_coverage.mjs                       -> evidence/coverage_simulation.json (ข้อมูลจริง)
//   node scripts/simulate_coverage.mjs --what-if             -> evidence/coverage_whatif.json (สถานการณ์สมมติ ห้ามใช้เป็นผลในเล่ม)
// สถานการณ์: before_track = คลังก่อนเพิ่มรายการ coverage track (ฐานของการวินิจฉัยในเล่ม) · url = รายการรอตรวจ URL ผ่านทั้งหมด · add = รายการใน data/corpus_additions.csv ที่ผู้วิจัยยังไม่ยืนยันผ่านทั้งหมด
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ENGINE as E, loadRefs, readCSV } from './lib/refs.mjs';

const refs = loadRefs();
const APPROVED = 'source_checked_by_script';

export function scenario(refs, { url = false, add = false, base = false } = {}) {
  let corpus = refs.corpus; let mappings = refs.mappings;
  if (base) { // ก่อนเพิ่มรายการ coverage track (DEC-46): ตัดรายการ batch v1.5_coverage_track ที่ยืนยันแล้วออก เพื่อให้ตัวเลขวินิจฉัยในเล่มคงที่
    const drop = new Set(corpus.filter((c) => c.batch === 'v1.5_coverage_track').map((c) => c.item_id));
    corpus = corpus.filter((c) => !drop.has(c.item_id)); mappings = mappings.filter((m) => !drop.has(m.item_id));
  }
  if (url) {
    corpus = corpus.map((c) => ({ ...c, verification_status: 'verified' }));
    const rv = new Map(refs.review.map((r) => [r.map_id, r]));
    mappings = mappings.map((m) => { const r = rv.get(m.map_id); return r && r.review_flags === 'C1_item_not_verified' ? { ...m, mapping_status: APPROVED } : m; });
  }
  if (add) {
    const adds = readCSV('data', 'corpus_additions.csv').filter((a) => !/^(LIVE|OK|VERIFIED)$/i.test(a.researcher_result.trim()));
    const extraC = []; const extraM = [];
    for (const a of adds) {
      const els = new Set(a.elements.split('|').filter(Boolean));
      const byRole = {};
      for (const q of refs.requirements) if (els.has(q.element_id)) (byRole[q.role_id] = byRole[q.role_id] || []).push(q);
      for (const [rid, qs] of Object.entries(byRole)) {
        const id = `CRS-${rid}-${a.key}`;
        extraC.push({ item_id: id, item_type: 'course', role_id: rid, title: a.title, provider: a.provider, source_url: a.source_url, estimated_hours: a.estimated_hours, recommendation_mode: 'course_only|both', verification_status: 'verified', phase: 'foundation' });
        for (const q of qs) extraM.push({ map_id: `${id}|${q.requirement_id}`, item_id: id, role_id: rid, requirement_id: q.requirement_id, coverage_layer: E.L1_LAYER, mapping_status: APPROVED });
      }
    }
    corpus = corpus.concat(extraC); mappings = mappings.concat(extraM);
  }
  return { corpus, mappings };
}

export function simulate(refs, sc, months, h, mode, strategy) {
  let covered = 0, cand = 0, hours = 0, items = 0; const per_role = [];
  for (const role of refs.roles) {
    const decisions = refs.requirements.filter((r) => r.role_id === role.role_id).map((r) => ({ requirement_id: r.requirement_id, final_status: 'missing', weight: Number(r.weight_renormalized) }));
    const p = E.buildPlan({ decisions, corpus: sc.corpus, mappings: sc.mappings, mode, months, hoursPerWeek: h, projectCfg: refs.projectCfg, roleId: role.role_id, strategy });
    covered += p.n_covered; cand += p.n_gap_requirements_with_candidate; hours += p.total_hours; items += p.items.length;
    per_role.push({ role_id: role.role_id, covered: p.n_covered, with_candidate: p.n_gap_requirements_with_candidate, hours: p.total_hours, items: p.items.map((i) => i.item_id), uncovered_no_candidate: p.uncovered_no_candidate, uncovered_over_capacity: p.uncovered_over_capacity });
  }
  return { covered, with_candidate: cand, total: 600, pct: +(covered / 6).toFixed(1), mean_items_per_plan: +(items / 20).toFixed(1), mean_hours_per_plan: +(hours / 20).toFixed(1), per_role };
}

function run(sc, strategy) {
  const out = { strategy, by_capacity: [], by_mode_6m10h: [], by_months_10h: [] };
  const strip = (x) => { const { per_role, ...r } = x; return r; };
  for (const h of [5, 10, 15, 20]) out.by_capacity.push({ months: 6, hours_per_week: h, Hmax: E.capacityHours(6, h, refs.projectCfg), ...strip(simulate(refs, sc, 6, h, 'both', strategy)) });
  for (const m of [12, 18, 24]) out.by_months_10h.push({ months: m, hours_per_week: 10, Hmax: E.capacityHours(m, 10, refs.projectCfg), ...strip(simulate(refs, sc, m, 10, 'both', strategy)) });
  for (const mode of ['both', 'course_only', 'certification_only']) out.by_mode_6m10h.push({ mode, ...strip(simulate(refs, sc, 6, 10, mode, strategy)) });
  out.primary_6m10h_both = simulate(refs, sc, 6, 10, 'both', strategy);
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const strategy = refs.projectCfg.plan_strategy || 'weighted_greedy';
  if (process.argv.includes('--what-if')) {
    const res = { note: 'สถานการณ์สมมติเพื่อวางแผน (ห้ามรายงานเป็นผลในเล่ม)', corpus_version: refs.manifest.corpus_version, scenarios: {} };
    for (const [name, opt] of Object.entries({ before_track: { base: true }, current: {}, url_verified: { url: true }, additions_confirmed: { add: true }, url_and_additions: { url: true, add: true } })) {
      const sc = scenario(refs, opt);
      res.scenarios[name] = {};
      for (const st of E.PLAN_STRATEGIES) res.scenarios[name][st] = run(sc, st);
    }
    fs.writeFileSync(path.join(ROOT, 'evidence', 'coverage_whatif.json'), JSON.stringify(res, null, 1) + '\n');
    for (const [n, v] of Object.entries(res.scenarios)) console.log(n.padEnd(20), E.PLAN_STRATEGIES.map((st) => st + ' ' + v[st].primary_6m10h_both.covered).join(' · '));
  } else {
    const sc = scenario(refs, {});
    const out = { corpus_version: refs.manifest.corpus_version, ...run(sc, strategy) };
    // ความครอบคลุมของคลัง (DEC-41): ข้อกำหนดที่มีรายการ L1 ผ่าน C1–C5 รองรับอย่างน้อย 1 รายการ
    const ok = new Set(sc.mappings.filter((m) => m.mapping_status === APPROVED && m.coverage_layer === E.L1_LAYER).map((m) => m.requirement_id));
    out.corpus_coverage = ok.size;
    fs.writeFileSync(path.join(ROOT, 'evidence', 'coverage_simulation.json'), JSON.stringify(out, null, 1) + '\n');
    console.log('corpus coverage', ok.size, '/600 · plan 6m10h both', out.primary_6m10h_both.covered, '/600 (' + strategy + ')');
  }
}
