// simulate_coverage.mjs — จำลองความครอบคลุมของแผนแบบแย่ที่สุด (ถือว่าทั้ง 30 ข้อของทุกอาชีพเป็นช่องว่าง)
// ใช้ buildPlan ของ engine ตัวเดียวกับระบบ · ผลใช้ในหัวข้อ 3.3.2/3.11 ของเล่มและ evidence/coverage_simulation.json
//   node scripts/simulate_coverage.mjs [--assume-all-verified]
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ENGINE as E, loadRefs } from './lib/refs.mjs';

const refs = loadRefs();
const allVerified = process.argv.includes('--assume-all-verified');
const corpus = allVerified ? refs.corpus.map((c) => ({ ...c, verification_status: 'verified' })) : refs.corpus;
let mappings = refs.mappings;
if (allVerified) {
  // สมมติว่า URL ที่รอตรวจผ่านทั้งหมด: แถว L1 ที่ตกเฉพาะเพราะ C1 จะผ่าน
  const rv = new Map(refs.review.map((r) => [r.map_id, r]));
  mappings = mappings.map((m) => { const r = rv.get(m.map_id); return r && r.review_flags === 'C1_item_not_verified' ? { ...m, mapping_status: 'source_checked_by_script' } : m; });
}
const scenarios = [[6, 5], [6, 10], [6, 15], [12, 10], [24, 10]];
const modes = ['both', 'course_only', 'certification_only'];
const out = { assume_all_verified: allVerified, corpus_version: refs.manifest.corpus_version, by_capacity: [], by_mode_6m10h: [] };
function total(months, h, mode) {
  let covered = 0, cand = 0, hours = 0, items = 0;
  for (const role of refs.roles) {
    const decisions = refs.requirements.filter((r) => r.role_id === role.role_id).map((r) => ({ requirement_id: r.requirement_id, final_status: 'missing', weight: Number(r.weight_renormalized) }));
    const p = E.buildPlan({ decisions, corpus, mappings, mode, months, hoursPerWeek: h, projectCfg: refs.projectCfg, roleId: role.role_id });
    covered += p.n_covered; cand += p.n_gap_requirements_with_candidate; hours += p.total_hours; items += p.items.length;
  }
  return { covered, with_candidate: cand, total: 600, pct: +(covered / 6).toFixed(1), mean_items_per_plan: +(items / 20).toFixed(1), mean_hours_per_plan: +(hours / 20).toFixed(1) };
}
for (const [m, h] of scenarios) out.by_capacity.push({ months: m, hours_per_week: h, Hmax: E.capacityHours(m, h, refs.projectCfg), ...total(m, h, 'both') });
for (const mode of modes) out.by_mode_6m10h.push({ mode, ...total(6, 10, mode) });
const f = path.join(ROOT, 'evidence', allVerified ? 'coverage_simulation_all_verified.json' : 'coverage_simulation.json');
fs.writeFileSync(f, JSON.stringify(out, null, 1) + '\n');
console.table(out.by_capacity); console.table(out.by_mode_6m10h);
