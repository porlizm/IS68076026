// ข้อมูลอ้างอิงและ manifest (Spec A3, A11, C3, C4, C5 · ตาราง 3.2, 3.3, 3.6, 3.20)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ENGINE as E, loadRefs, readCSV, readJSON } from '../scripts/lib/refs.mjs';

const refs = loadRefs();

test('ข้อกำหนด 600 = 20 × 30 · 343/104/77/76 · น้ำหนักรวมอาชีพละ 1 · โควตาโดเมนละ ≥ 3 (ตาราง 3.3)', () => {
  const r = refs.requirements;
  assert.equal(r.length, 600);
  const by = (k) => r.reduce((m, x) => ((m[x[k]] = (m[x[k]] || 0) + 1), m), {});
  assert.deepEqual(by('domain'), { 'Work Activities': 343, 'Essential Skills': 104, 'Transferable Skills': 77, Knowledge: 76 });
  for (const [rid, n] of Object.entries(by('role_id'))) {
    assert.equal(n, 30, rid);
    const g = r.filter((x) => x.role_id === rid);
    assert.ok(Math.abs(g.reduce((s, x) => s + Number(x.weight_renormalized), 0) - 1) < 1e-5);
    for (const d of ['Work Activities', 'Essential Skills', 'Transferable Skills', 'Knowledge']) assert.ok(g.filter((x) => x.domain === d).length >= 3, rid + d);
    assert.ok(g.every((x) => Number(x.importance_im) >= 3.0));
  }
  const wsp = [...new Set(r.map((x) => Number(x.weight_share_of_pool)))];
  assert.equal(Math.min(...wsp), 0.5128); assert.equal(Math.max(...wsp), 0.9749);
});

test('อาชีพ 20 · SOC ตรงตาราง 3.2 · proxy 5 อาชีพ (ภาคผนวก ก)', () => {
  const soc = { R01: '15-1252.00', R02: '15-1254.00', R03: '15-1251.00', R04: '15-1253.00', R05: '15-1255.00', R06: '15-2051.00', R07: '15-1221.00', R08: '15-1243.00', R09: '15-2051.01', R10: '15-1242.00', R11: '15-1212.00', R12: '15-1299.05', R13: '15-1299.04', R14: '15-1299.06', R15: '15-1241.00', R16: '15-1299.08', R17: '15-1244.00', R18: '15-1211.00', R19: '15-1299.09', R20: '11-3021.00' };
  assert.equal(refs.roles.length, 20);
  for (const r of refs.roles) assert.equal(r.soc_code, soc[r.role_id], r.role_id);
  assert.deepEqual(refs.roles.filter((r) => r.mapping_type === 'proxy').map((r) => r.role_id), ['R03', 'R07', 'R08', 'R16', 'R17']);
});

test('คลัง: https ทุกแถว · item_id ไม่ซ้ำ · C5 item.role_id == mapping.role_id · C4 L1 ตรง competency_ids_l1', () => {
  const items = Object.fromEntries(refs.corpus.map((c) => [c.item_id, c]));
  assert.equal(Object.keys(items).length, refs.corpus.length);
  assert.ok(refs.corpus.every((c) => c.source_url.startsWith('https://')));
  const reqSet = new Set(refs.requirements.map((r) => r.role_id + '|' + r.requirement_id));
  const l1 = {};
  for (const m of refs.rawMappings) {
    assert.equal(items[m.item_id].role_id, m.role_id, m.map_id);
    assert.ok(reqSet.has(m.role_id + '|' + m.requirement_id), m.map_id);
    assert.equal(m.mapping_status, 'pending_review', 'mappings.csv คงสถานะ pending_review ทุกแถว (3.3.2)');
    if (m.coverage_layer === E.L1_LAYER) (l1[m.item_id] = l1[m.item_id] || new Set()).add(m.requirement_id);
  }
  for (const c of refs.corpus) {
    const want = new Set(c.competency_ids_l1.split('|').filter(Boolean));
    assert.deepEqual([...(l1[c.item_id] || [])].sort(), [...want].sort(), c.item_id);
  }
});

test('mapping_review: ผ่าน ≥ 90% ของ L1 และทุกข้อกำหนดมีรายการรองรับ ยกเว้นที่อยู่ใน corpus_gap_request หรือรอตรวจ URL', () => {
  const ok = refs.mappings.filter((m) => m.mapping_status === 'source_checked_by_script');
  const l1 = refs.mappings.filter((m) => m.coverage_layer === E.L1_LAYER);
  assert.ok(ok.length >= 0.9 * l1.length);
  assert.ok(ok.every((m) => m.coverage_layer === E.L1_LAYER));
  const covered = new Set(ok.map((m) => m.requirement_id));
  const gapReq = new Set(readCSV('data', 'corpus_gap_request.csv').map((g) => g.requirement_id));
  const pendingItems = new Set(refs.corpus.filter((c) => c.verification_status !== 'verified').map((c) => c.item_id));
  const pendingOnly = new Set(l1.filter((m) => pendingItems.has(m.item_id)).map((m) => m.requirement_id));
  const unexplained = refs.requirements.filter((r) => !covered.has(r.requirement_id) && !gapReq.has(r.requirement_id) && !pendingOnly.has(r.requirement_id));
  assert.deepEqual(unexplained.map((r) => r.requirement_id), []);
});

test('manifest: sha256 ครบ 11 ไฟล์และตรงกับไฟล์จริง (DEC-21 ข้อ 4 · DEC-54/55)', () => {
  const m = readJSON('data', 'manifest.json');
  assert.equal(Object.keys(m.files).length, 11);
  for (const [f, v] of Object.entries(m.files)) {
    const buf = fs.readFileSync(path.join(ROOT, 'data', f));
    assert.equal(E.sha256Hex(new Uint8Array(buf)), v.sha256, 'drift: ' + f);
  }
  assert.equal(typeof m.frozen, 'boolean');
});

test('sheets_import: 17 แท็บ · จำนวนคอลัมน์และแถวตามตาราง 3.20 (A11 · DEC-51/55)', () => {
  const cfg = refs.sheetsCfg.tabs;
  assert.equal(Object.keys(cfg).length, 17);
  const cols = Object.fromEntries(Object.entries(cfg).map(([k, v]) => [k, v.columns.length]));
  assert.deepEqual(cols, { runs: 26, ocr_results: 9, model_calls: 13, findings: 20, decisions: 15, role_task_decisions: 9, plan_items: 14, deliveries: 9, audit_log: 5, ground_truth: 12, pathway_review: 10, ref_roles: 7, ref_requirements: 10, ref_corpus: 12, ref_mappings: 7, form_responses: 8, evaluation_responses: 6 });
  const counts = readJSON('sheets_import', 'sheets_import_counts.json');
  assert.equal(counts.ref_roles.rows, 20); assert.equal(counts.ref_requirements.rows, 600);
  assert.equal(counts.ref_corpus.rows, refs.corpus.length); assert.equal(counts.ref_mappings.rows, refs.rawMappings.length);
});
