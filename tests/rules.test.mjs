// กฎ R0 → R2 → R3 → R1 → R4 และสมการ 3.2–3.6 (Spec A7–A9, A13)
import test from 'node:test';
import assert from 'node:assert/strict';
import { ENGINE as E } from '../scripts/lib/refs.mjs';

const cfg = { theta: 0.15, overlap_denominator_cap: 25, alias_min_length: 4, min_usable_models: 2 };
const REQ = (id, name, desc, aliases, w = 1 / 3) => ({ requirement_id: id, element_id: id.split('-').slice(2).join('-'), element_name: name, element_description: desc, element_aliases: aliases, domain: 'Transferable Skills', weight_renormalized: String(w) });
const prog = REQ('REQ-R01-2.B.3.e', 'Programming', 'Writing computer programs for various purposes.', 'programming|coding|software development|python');
const crit = REQ('REQ-R01-2.A.2.a', 'Critical Thinking', 'Using logic and reasoning to identify strengths and weaknesses.', 'critical thinking|root cause analysis');
const math = REQ('REQ-R01-2.C.4.a', 'Mathematics', 'Knowledge of arithmetic, algebra, geometry, calculus, statistics.', 'mathematics|statistics');
const reqs = [prog, crit, math];
const ids = reqs.map((r) => r.requirement_id);
const TEXT = 'Built and deployed a Python programming service for batch data processing\nFamiliar with database concepts\nCoursework in statistics and algebra.';
const J = (o) => JSON.stringify(o);
const ok = (as, role = 'R01') => J({ schema_version: 'analyst_v1.0', role_id: role, assessments: as });

test('R0: รหัสสาเหตุห้ารหัส (ตาราง 3.25)', () => {
  assert.equal(E.ruleR0('', 'R01', ids).reason_code, 'no_output');
  assert.equal(E.ruleR0(null, 'R01', ids).reason_code, 'no_output');
  assert.equal(E.ruleR0('{not json', 'R01', ids).reason_code, 'invalid_json');
  assert.equal(E.ruleR0(J({ schema_version: 'x', role_id: 'R01', assessments: [] }), 'R01', ids).reason_code, 'schema_mismatch');
  assert.equal(E.ruleR0(ok([{ requirement_id: 'REQ-R01-9.9', status: 'missing' }]), 'R01', ids).reason_code, 'schema_mismatch');
  assert.equal(E.ruleR0(ok([{ requirement_id: ids[0], status: 'maybe' }]), 'R01', ids).reason_code, 'schema_mismatch');
  assert.equal(E.ruleR0(ok([], 'R02'), 'R01', ids).reason_code, 'role_mismatch');
  assert.equal(E.ruleR0(ok([{ requirement_id: ids[0], status: 'missing', quote: '' }]), 'R01', ids).reason_code, 'incomplete_coverage');
  const r = E.ruleR0('```json\n' + ok(ids.map((i) => ({ requirement_id: i, status: 'missing', quote: '' }))) + '\n```', 'R01', ids);
  assert.equal(r.usable, true);
  assert.deepEqual(E.R0_CODES, ['no_output', 'invalid_json', 'schema_mismatch', 'role_mismatch', 'incomplete_coverage']);
});

test('R2: ค้นตรงตัวก่อน แล้วค่อยยุบช่องว่าง · ตำแหน่ง start นับจาก 0 end ไม่รวม', () => {
  const q = 'Built and deployed a Python programming service';
  const r = E.ruleR2(q, TEXT);
  assert.deepEqual([r.verified, r.start, r.end, r.text_version], [true, 0, q.length, 'normalized']);
  assert.equal(TEXT.slice(r.start, r.end), q);
  const r2 = E.ruleR2('batch data  processing Familiar  with', TEXT);
  assert.equal(r2.verified, true); assert.equal(r2.text_version, 'whitespace_collapsed');
  assert.equal(E.ruleR2('Designed a Kubernetes platform', TEXT).verified, false);
  assert.equal(E.ruleR2('', TEXT).verified, false);
});

test('R3: คำพ้องยาว ≥ 4 ตัวอักษรปรากฏตรงตัว = 1 · ไม่เช่นนั้นใช้สมการ 3.2', () => {
  assert.equal(E.overlapScore('Built and deployed a Python programming service for batch data processing', prog, cfg).score, 1);
  const low = E.overlapScore('Familiar with database concepts', prog, cfg).score;
  assert.ok(low < 0.15, 'ตัวอย่างในเล่ม: ไม่ผ่าน R3');
  assert.equal(E.overlapScore('the and for with using', prog, cfg).score, 0, 'เซตว่างหลังตัด stop words = 0');
  // |T(q) ∩ T(r)| / min(|T(q)|, 25)
  const r = REQ('REQ-R01-x', 'Alpha beta', 'gamma delta', 'zz');
  assert.equal(E.overlapScore('alpha gamma omega sigma', r, cfg).score, 2 / 4);
  const many = Array.from({ length: 30 }, (_, i) => 'w' + i).join(' ');
  const r30 = REQ('REQ-R01-y', many, '', 'zz');
  assert.ok(E.overlapScore(many, r30, cfg).score > 1, 'ไม่จำกัดเพดานที่ 1 (ภาคผนวก ง)');
  assert.deepEqual([...E.tokenize('C++ and C# on Node.js, a b')], ['c++', 'c#', 'node.js']);
});

function mk(as) { return { status: 'ok', output: { text: ok(as) } }; }
const A_ev = { requirement_id: prog.requirement_id, status: 'evidenced', quote: 'Built and deployed a Python programming service for batch data processing' };

test('ตาราง 3.26: evidenced 2 ใน 3 → final evidenced, a = 0.67', () => {
  const miss = (id) => ({ requirement_id: id, status: 'missing', quote: '' });
  const res = E.evaluateRun({ runId: 'T', roleId: 'R01', requirements: reqs, text: TEXT, projectCfg: cfg, nowIso: 'x',
    modelResults: { A: mk([A_ev, miss(crit.requirement_id), miss(math.requirement_id)]), B: mk([A_ev, miss(crit.requirement_id), miss(math.requirement_id)]), C: mk([miss(prog.requirement_id), miss(crit.requirement_id), miss(math.requirement_id)]) } });
  const d = res.decisions.find((x) => x.requirement_id === prog.requirement_id);
  assert.equal(d.final_status, 'evidenced');
  assert.equal(d.agreement_level, 0.6667);
  assert.equal(d.n_usable_models, 3);
  assert.equal(d.evidence_char_start, 0);
  assert.equal(res.m, 3);
});

test('R2/R3 ไม่ผ่าน → เสียงเปลี่ยนเป็น missing และนับใน U', () => {
  const bad = { requirement_id: prog.requirement_id, status: 'evidenced', quote: 'Familiar with database concepts' };
  const fake = { requirement_id: crit.requirement_id, status: 'partially', quote: 'Performed root cause analysis weekly' };
  const res = E.evaluateRun({ runId: 'T', roleId: 'R01', requirements: reqs, text: TEXT, projectCfg: cfg, nowIso: 'x',
    modelResults: { A: mk([bad, fake, { requirement_id: math.requirement_id, status: 'missing', quote: '' }]), B: mk([bad, fake]), C: { status: 'failed', output: null } } });
  const f = res.findings.filter((x) => x.model_key === 'A');
  assert.match(f[0].rule_flags, /R3_low_overlap/);
  assert.match(f[1].rule_flags, /R2_quote_not_found/);
  assert.equal(res.decisions[0].final_status, 'missing');
  assert.equal(res.scores.unsupported_claims, 4);
  assert.equal(res.scores.n_claims, 4);
  assert.equal(res.scores.U, 1);
  assert.equal(res.per_model.A.n_missing_direct, 1);
  assert.equal(res.per_model.A.n_downgraded, 2, 'แยกนับ missing โดยตรงกับที่ถูกปรับ (3.5.4)');
});

test('R1: สองเสียงไม่ตรงกันเมื่อเหลือ 2 โมเดล → abstained · m < 2 → abstained ทั้งหมดและ R = N/A (ตาราง 3.22)', () => {
  const p = { requirement_id: prog.requirement_id, status: 'partially', quote: A_ev.quote };
  const res = E.evaluateRun({ runId: 'T', roleId: 'R01', requirements: reqs, text: TEXT, projectCfg: cfg, nowIso: 'x',
    modelResults: { A: mk([A_ev, { requirement_id: crit.requirement_id, status: 'missing' }]), B: mk([p, { requirement_id: crit.requirement_id, status: 'missing' }]), C: { status: 'ok', output: { text: 'oops' } } } });
  assert.equal(res.m, 2);
  assert.equal(res.per_model.C.r0_reason, 'invalid_json');
  assert.equal(res.decisions[0].final_status, 'abstained');
  assert.equal(res.decisions[1].final_status, 'missing');
  assert.equal(res.decisions[2].final_status, 'abstained', 'ไม่มีโมเดลใดตอบ → m_i = 0');
  assert.equal(res.decisions[2].agreement_level, 0);
  const halt = E.evaluateRun({ runId: 'T', roleId: 'R01', requirements: reqs, text: TEXT, projectCfg: cfg, nowIso: 'x',
    modelResults: { A: mk([A_ev, { requirement_id: crit.requirement_id, status: 'missing' }]), B: { status: 'failed', output: null }, C: { status: 'failed', output: null } } });
  assert.equal(halt.m, 1);
  assert.ok(halt.decisions.every((d) => d.final_status === 'abstained'));
  assert.equal(halt.scores.readiness_pct, 'N/A');
});

test('สมการ 3.4–3.5: ตัวอย่างในเล่ม R = 72.50 · C = 0.20', () => {
  const D = [
    { final_status: 'evidenced', weight: 0.05 }, { final_status: 'evidenced', weight: 0.04 },
    { final_status: 'partially', weight: 0.04 }, { final_status: 'partially', weight: 0.04 }, { final_status: 'partially', weight: 0.03 },
    ...Array.from({ length: 25 }, () => ({ final_status: 'abstained', weight: 0.8 / 25 })),
  ];
  const s = E.computeScores(D, {});
  assert.equal(s.readiness_pct, 72.5);
  assert.equal(s.weighted_coverage, 0.2);
  assert.equal(s.n_decided, 5);
});
