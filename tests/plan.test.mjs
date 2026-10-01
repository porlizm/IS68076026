// การจัดแผน สมการ 3.7–3.8 · DEC-20 · DEC-21 (Spec A10, C1, C2)
import test from 'node:test';
import assert from 'node:assert/strict';
import { ENGINE as E } from '../scripts/lib/refs.mjs';

const cfg = { weeks_per_month: 4.33, approved_mapping_statuses: ['source_checked_by_script', 'expert_reviewed'] };
const dec = (id, st, w) => ({ requirement_id: id, final_status: st, weight: w });
const item = (id, h, mode = 'course_only|both', v = 'verified') => ({ item_id: id, item_type: 'course', title: id, provider: 'P', source_url: 'https://example.org/' + id, estimated_hours: String(h), recommendation_mode: mode, verification_status: v, phase: 'core' });
const map = (item_id, req, st = 'source_checked_by_script', layer = 'L1_researcher_tagged') => ({ item_id, requirement_id: req, mapping_status: st, coverage_layer: layer, role_id: 'R01' });

test('สมการ 3.7: Hmax = M × 4.33 × h', () => {
  assert.equal(E.capacityHours(6, 10, cfg), 259.8);
  assert.equal(E.capacityHours(6, 5, cfg), 129.9);
});

test('ตัวอย่างในเล่ม 3.6.2: Hmax 150 → เลือกรายการ 2 แล้ว 1 · รวม 140 ชม.', () => {
  // ช่องว่าง g1..g4 · รายการที่ 1: 100 ชม. น้ำหนัก 0.10 · รายการที่ 2: 40 ชม. 0.06 · รายการที่ 3: 30 ชม. 0.03 ซ้อนกับรายการที่ 2
  const decisions = [dec('g1', 'missing', 0.10), dec('g2', 'partially', 0.03), dec('g3', 'missing', 0.03), dec('ok', 'evidenced', 0.5)];
  const corpus = [item('I1', 100), item('I2', 40), item('I3', 30)];
  const mappings = [map('I1', 'g1'), map('I2', 'g2'), map('I2', 'g3'), map('I3', 'g2')];
  const p = E.buildPlan({ decisions, corpus, mappings, mode: 'both', months: 150 / (4.33 * 1), hoursPerWeek: 1, projectCfg: cfg });
  assert.deepEqual(p.items.map((i) => i.item_id), ['I2', 'I1']);
  assert.equal(p.total_hours, 140);
  assert.equal(p.items[0].d_k, 0.0015);
});

test('ค่า dk เท่ากันตัดสินด้วย item_id · ข้ามรายการที่เกินเพดานแล้วเลือกต่อ · ชั่วโมงนับครั้งเดียว', () => {
  const decisions = [dec('a', 'missing', 0.1), dec('b', 'missing', 0.1), dec('c', 'missing', 0.02)];
  const corpus = [item('Z', 10), item('Y', 10), item('BIG', 500), item('S', 5)];
  const mappings = [map('Z', 'a'), map('Y', 'b'), map('BIG', 'a'), map('BIG', 'b'), map('BIG', 'c'), map('S', 'c')];
  const p = E.buildPlan({ decisions, corpus, mappings, mode: 'both', months: 1, hoursPerWeek: 30 / 4.33, projectCfg: cfg });
  assert.deepEqual(p.items.map((i) => i.item_id), ['Y', 'Z', 'S']);
  assert.ok(p.total_hours <= p.Hmax);
});

test('ใช้เฉพาะ L1 + สถานะผ่านตรวจ + verified + โหมดตรง · ข้อ abstained ไม่ใช่ช่องว่าง', () => {
  const decisions = [dec('a', 'missing', 0.2), dec('b', 'abstained', 0.2), dec('c', 'missing', 0.2), dec('d', 'missing', 0.2), dec('e', 'missing', 0.2)];
  const corpus = [item('L2', 5), item('PEND', 5), item('UNV', 5, 'course_only|both', 'pending_verification'), item('CERT', 5, 'certification_only|both'), item('OK', 5)];
  const mappings = [map('L2', 'a', 'source_checked_by_script', 'L2_rule_augmented'), map('PEND', 'c', 'pending_review'), map('UNV', 'd'), map('CERT', 'e'), map('OK', 'b')];
  const p = E.buildPlan({ decisions, corpus, mappings, mode: 'course_only', months: 6, hoursPerWeek: 10, projectCfg: cfg });
  assert.equal(p.items.length, 0);
  assert.equal(p.n_gaps, 4);
  // DEC-20: e มี candidate (certification) แต่โหมด course_only จึงไม่เข้าแผน · a, c, d ไม่มี candidate
  assert.deepEqual(p.uncovered_no_candidate, ['a', 'c', 'd']);
  assert.equal(p.n_gap_requirements_with_candidate, 1);
  assert.equal(p.gap_coverage, 0);
  assert.equal(p.gap_coverage_with_candidate, 0);
});

test('DEC-20: gap_coverage สองค่า + uncovered_over_capacity', () => {
  const decisions = [dec('a', 'missing', 0.5), dec('b', 'missing', 0.3), dec('c', 'missing', 0.2)];
  const corpus = [item('I1', 10), item('I2', 1000)];
  const mappings = [map('I1', 'a'), map('I2', 'b')];
  const p = E.buildPlan({ decisions, corpus, mappings, mode: 'both', months: 6, hoursPerWeek: 10, projectCfg: cfg });
  assert.equal(p.gap_coverage, 0.3333);
  assert.equal(p.gap_coverage_with_candidate, 0.5);
  assert.deepEqual(p.uncovered_no_candidate, ['c']);
  assert.deepEqual(p.uncovered_over_capacity, ['b']);
});

test('DEC-21: ไม่มี mapping ผ่านตรวจเลย → ข้อความขึ้นต้น "ข้อผิดพลาดของข้อมูลอ้างอิง"', () => {
  const p = E.buildPlan({ decisions: [dec('a', 'missing', 1)], corpus: [item('I', 1)], mappings: [map('I', 'a', 'pending_review')], mode: 'both', months: 6, hoursPerWeek: 10, projectCfg: cfg });
  assert.equal(p.reference_data_error, true);
  assert.match(p.notice, /^ข้อผิดพลาดของข้อมูลอ้างอิง/);
  const q = E.buildPlan({ decisions: [dec('a', 'evidenced', 1)], corpus: [item('I', 1)], mappings: [map('I', 'a')], mode: 'both', months: 6, hoursPerWeek: 10, projectCfg: cfg });
  assert.match(q.notice, /ไม่พบช่องว่าง/);
  assert.equal(q.gap_coverage, 'N/A');
});

test('DEC-21: mergeMappingReview โยนเมื่อไฟล์หาย ว่าง หรือผ่าน < 90% ของ L1', () => {
  const maps = Array.from({ length: 10 }, (_, i) => ({ map_id: 'm' + i, coverage_layer: 'L1_researcher_tagged' }));
  assert.throws(() => E.mergeMappingReview(maps, []), /ข้อผิดพลาดของข้อมูลอ้างอิง/);
  const rv = (n) => maps.map((m, i) => ({ map_id: m.map_id, mapping_status: i < n ? 'source_checked_by_script' : 'pending_review' }));
  assert.throws(() => E.mergeMappingReview(maps, rv(0)), /ไม่มีแถวที่ผ่านการตรวจ/);
  assert.throws(() => E.mergeMappingReview(maps, rv(8)), /10 แถว แต่มีสถานะผ่านการตรวจเพียง 8/);
  assert.equal(E.mergeMappingReview(maps, rv(9)).filter((m) => m.mapping_status === 'source_checked_by_script').length, 9);
});
