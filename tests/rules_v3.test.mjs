// กฎรุ่น 2.1 (3 ต.ค. 2569 · DEC-60): R7 ผู้ลงมือทำ · ระดับ LV · ข้อความซ้ำ · Role-Fit · H ตัวส่วนคงที่ · ตราประทับรุ่น · cache ผู้ตรวจ · token
// ข้อความและข้อกำหนดในเทสต์เป็นของสมมติ ไม่ใช่ข้อมูลของบุคคลจริง
import test from 'node:test';
import assert from 'node:assert/strict';
import { ENGINE as E, loadRefs, signalsFor } from '../scripts/lib/refs.mjs';

const refs = loadRefs();
const cfg = refs.projectCfg;
const mkReq = (n, element_id, alias, lv, w = 0.25) => ({ requirement_id: 'REQ-R01-' + element_id, element_id, element_name: 'Skill ' + n, element_description: 'Description ' + n,
  element_aliases: alias, domain: 'Knowledge', level_lv: String(lv), weight_renormalized: String(w) });
const out = (role, assessments, tasks) => ({ status: 'ok', output: { text: JSON.stringify({ schema_version: 'analyst_v1.2', role_id: role, assessments, task_assessments: tasks || [] }) } });
const all3 = (role, a, t) => ({ A: out(role, a, t), B: out(role, a, t), C: out(role, a, t) });
const TEXT = 'Built Kubernetes clusters and Terraform modules for production workloads across three regions.\nDirected teams of 12 engineers and owned the annual budget.';
const Q1 = 'Built Kubernetes clusters and Terraform modules for production workloads across three regions.';
const Q2 = 'Directed teams of 12 engineers and owned the annual budget.';
const run = (reqs, assessments, extra = {}) => E.evaluateRun({ runId: 'R', roleId: 'R01', requirements: reqs, text: TEXT, modelResults: all3('R01', assessments, extra.tasks), verifierResults: {},
  projectCfg: { ...cfg, ...(extra.cfg || {}) }, specificity: extra.spec, roleTasks: extra.roleTasks, nowIso: 'x' });
const st = (ev, id) => ev.decisions.find((d) => d.element_id === id);

test('R7 ผู้ลงมือทำ: ข้อเชิงปฏิบัติรับเฉพาะ performed · LV ≥ 5 ต้องอย่างน้อย led · actor ไม่ระบุไม่ลดสถานะแต่ติดป้าย', () => {
  const reqs = [mkReq(1, '2.C.3.a', 'kubernetes', 4), mkReq(2, '2.C.3.b', 'terraform', 4), mkReq(3, '4.A.4.b.4', 'directed teams', 5.5), mkReq(4, '4.A.4.a.1', 'annual budget', 3)];
  const a = (actors) => reqs.map((r, i) => ({ requirement_id: r.requirement_id, status: 'evidenced', quotes: [i < 2 ? Q1 : Q2], actor: actors[i], confidence: 0.9 }));
  const ev = run(reqs, a(['led', 'performed', 'oversaw', 'mentioned']), { cfg: { quote_reuse: { enabled: false } } });
  assert.equal(st(ev, '2.C.3.a').final_status, 'partially'); assert.match(st(ev, '2.C.3.a').rule_flags, /R7_actor:led/);
  assert.equal(st(ev, '2.C.3.b').final_status, 'evidenced'); assert.equal(st(ev, '2.C.3.b').actor, 'performed');
  assert.equal(st(ev, '4.A.4.b.4').final_status, 'partially', 'LV 5.5 และ oversaw ต่ำกว่า led');
  assert.equal(st(ev, '4.A.4.a.1').final_status, 'evidenced', 'ข้อไม่เชิงปฏิบัติและ LV ต่ำ ไม่ถูกจำกัด');
  assert.equal(ev.scores.n_r7_actor, 2);
  const led = run(reqs, a(['led', 'led', 'led', 'led']), { cfg: { quote_reuse: { enabled: false } } });
  assert.equal(st(led, '4.A.4.b.4').final_status, 'evidenced', 'led พอสำหรับ LV สูงที่ไม่ใช่ข้อเชิงปฏิบัติ');
  const unknown = run(reqs, a(['', '', '', '']), { cfg: { quote_reuse: { enabled: false } } });
  assert.equal(st(unknown, '2.C.3.a').final_status, 'evidenced'); assert.match(st(unknown, '2.C.3.a').rule_flags, /R7_actor_unknown/);
  assert.equal(unknown.scores.n_actor_unknown, 3);
  const off = run(reqs, a(['oversaw', 'oversaw', 'oversaw', 'oversaw']), { cfg: { actor_rules: { ...cfg.actor_rules, enabled: false }, quote_reuse: { enabled: false } } });
  assert.equal(off.decisions.filter((d) => d.final_status === 'evidenced').length, 4, 'ปิด R7 ได้ (ใช้เป็นเงื่อนไขเปรียบเทียบ)');
  assert.ok(off.scores.readiness_pct >= ev.scores.readiness_pct);
  assert.equal(ev.scores.ablation.before_r7, 100, 'ค่าก่อน R7 บันทึกไว้เปรียบเทียบ');
});

test('R7 ข้อความซ้ำ: quote เดียวเป็นหลักฐานเต็มได้ไม่เกิน 2 ข้อ · เก็บข้อที่เฉพาะอาชีพ (df ต่ำ) ไว้ก่อน', () => {
  const reqs = [mkReq(1, '4.A.4.a.1', 'kubernetes', 3), mkReq(2, '4.A.4.a.2', 'terraform', 3), mkReq(3, '4.A.4.a.3', 'production workloads', 3), mkReq(4, '4.A.4.a.4', 'three regions', 3)];
  const a = reqs.map((r) => ({ requirement_id: r.requirement_id, status: 'evidenced', quotes: [Q1], actor: 'performed' }));
  const spec = { n_roles: 20, by_element: { '4.A.4.a.1': { df: 5, idf: 1 }, '4.A.4.a.2': { df: 1, idf: 2 }, '4.A.4.a.3': { df: 3, idf: 1 }, '4.A.4.a.4': { df: 2, idf: 1 } } };
  const ev = run(reqs, a, { spec });
  const full = ev.decisions.filter((d) => d.final_status === 'evidenced').map((d) => d.element_id).sort();
  assert.deepEqual(full, ['4.A.4.a.2', '4.A.4.a.4']);
  assert.equal(ev.decisions.filter((d) => /R7_reuse/.test(d.rule_flags)).length, 2); assert.equal(ev.scores.n_r7_reuse, 2);
  const free = run(reqs, a, { spec, cfg: { quote_reuse: { enabled: false } } });
  assert.equal(free.decisions.filter((d) => d.final_status === 'evidenced').length, 4);
  const loose = run(reqs, a, { spec, cfg: { quote_reuse: { ...cfg.quote_reuse, max_full_evidence_per_quote: 3 } } });
  assert.equal(loose.decisions.filter((d) => d.final_status === 'evidenced').length, 3);
});

test('R7 งานหลัก: อาชีพเทคนิคต้อง performed · R19/R20 รับ led', () => {
  const tasks = [{ task_id: 'TASK-R01-1', task_text: 'Direct teams of engineers on delivery of software projects' }];
  const ta = (actor) => [{ task_id: 'TASK-R01-1', status: 'evidenced', quotes: [Q2], actor, confidence: 0.8 }];
  const reqs = [mkReq(1, '4.A.4.a.1', 'annual budget', 3)];
  const base = [{ requirement_id: reqs[0].requirement_id, status: 'missing', quotes: [] }];
  const r01 = run(reqs, base, { tasks: ta('led'), roleTasks: tasks });
  assert.equal(r01.task_decisions[0].final_status, 'partially'); assert.match(r01.task_decisions[0].rule_flags, /R7_actor:led/); assert.equal(r01.scores.n_r7_task_actor, 1);
  const okPerf = run(reqs, base, { tasks: ta('performed'), roleTasks: tasks });
  assert.equal(okPerf.task_decisions[0].final_status, 'evidenced');
  const mgr = E.evaluateRun({ runId: 'R', roleId: 'R19', requirements: [{ ...reqs[0], requirement_id: 'REQ-R19-4.A.4.a.1' }], text: TEXT,
    modelResults: all3('R19', [{ requirement_id: 'REQ-R19-4.A.4.a.1', status: 'missing', quotes: [] }], [{ task_id: 'TASK-R19-1', status: 'evidenced', quotes: [Q2], actor: 'led' }]),
    verifierResults: {}, projectCfg: cfg, roleTasks: [{ task_id: 'TASK-R19-1', task_text: tasks[0].task_text }], nowIso: 'x' });
  assert.equal(mgr.task_decisions[0].final_status, 'evidenced', 'R19 รับ led');
});

test('ผู้ตรวจ verifier_v1.1: prompt ส่ง level และ hands_on ของแต่ละข้อ · ข้อมูลเฉพาะอาชีพนับ df/idf ตามสูตร', () => {
  const reqs = [mkReq(1, '2.C.3.a', 'zzzz', 6), mkReq(2, '4.A.4.a.1', 'yyyy', 3)];
  const a = reqs.map((r) => ({ requirement_id: r.requirement_id, status: 'evidenced', quotes: [Q2], actor: 'performed' }));
  const pv = E.prepareVerification({ roleId: 'R01', requirements: reqs, text: TEXT, modelResults: all3('R01', a), projectCfg: cfg, verifierTemplate: refs.verifierPrompt });
  const sent = Object.values(pv.requests).map((r) => r.prompt).join('\n');
  assert.match(sent, /"level": 6/); assert.match(sent, /"hands_on": true/); assert.match(sent, /"hands_on": false/);
  assert.ok(refs.verifierPrompt.includes('verifier_v1.1') && /hands_on/.test(refs.verifierPrompt));
  const sp = E.buildSpecificity(refs.requirements);
  assert.equal(sp.n_roles, 20);
  const el = Object.keys(sp.by_element)[0];
  const df = new Set(refs.requirements.filter((r) => r.element_id === el).map((r) => r.role_id)).size;
  assert.equal(sp.by_element[el].df, df);
  assert.equal(sp.by_element[el].idf, Math.round(Math.log(21 / (df + 0.5)) * 1e4) / 1e4);
});

test('Role-Fit: ถ่วง idf แล้วผสม T · ป้ายระดับตามเกณฑ์ใน config', () => {
  const items = [{ final_status: 'evidenced', weight: 0.5, idf: 3 }, { final_status: 'missing', weight: 0.5, idf: 1 }, { final_status: 'abstained', weight: 0.2, idf: 9 }];
  const f = E.computeRoleFit(items, 80, cfg);
  assert.equal(f.readiness_role_pct, 75);
  assert.equal(f.role_fit, 77.5); assert.equal(f.role_fit_band, 'high');
  assert.equal(E.computeRoleFit(items, 40, cfg).role_fit_band, 'mid');
  assert.equal(E.computeRoleFit(items, null, cfg).role_fit, 75);
  assert.equal(E.computeRoleFit([], 50, cfg).role_fit, 'N/A');
});

test('H ตัวส่วนคงที่ 10 รายการ · อาชีพที่มีน้อยกว่านี้ได้ N/A', () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({ technology: 'T' + i, match_keys: 'tech' + i }));
  const h = E.techMatch('uses tech0 and tech1 and tech11', rows, 10);
  assert.equal(h.n_total, 10); assert.equal(h.n_found, 2); assert.equal(h.pct, 20);
  const few = E.techMatch('uses tech0', rows.slice(0, 3), 10);
  assert.equal(few.pct, 'N/A'); assert.equal(few.sufficient, false);
  assert.equal(cfg.h_tech_n, 10);
  for (const rid of ['R19', 'R20']) assert.ok(signalsFor(refs, rid).roleTech.length >= 0);
});

test('ตราประทับรุ่น: ปฏิเสธเมื่อ engine ไม่ตรง · โหนดต่างรุ่น · build ไม่ตรงรุ่นที่ freeze', () => {
  const s = E.buildStamp({ wf_version: '2.1.0', build_id: 'WF_IS-aaa', analyst_prompt: 'analyst_v1.2', verifier_prompt: 'verifier_v1.1', rules_version: 'r', data_sha: 'd' });
  assert.equal(s.engine_version, E.ENGINE_VERSION);
  assert.deepEqual(E.versionIssues(s, [s], { frozen: false }), []);
  assert.deepEqual(E.versionIssues(s, [s], { frozen: true, build_id: 'WF_IS-aaa' }), []);
  assert.match(E.versionIssues(s, [], { frozen: true, build_id: 'WF_IS-bbb' })[0], /freeze/);
  assert.match(E.versionIssues(s, [{ ...s, build_id: 'WF_IS-old' }], null)[0], /WF_IS-old/);
  assert.match(E.versionIssues({ ...s, engine_version: 'engine-1.0.0' }, [], null)[0], /engine/);
  const row = E.runRowFrom({ run_id: 'x', response_id: 'y', created_at: 't', email: 'e', role_id: 'R01', mode: 'both', timeline_months: 6, hours_per_week: 5, file_id: 'f' }, { stamp: s, model_ids: 'A:m', tokens: { total: { input: 5, output: 6 } } });
  assert.equal(row.build_id, 'WF_IS-aaa'); assert.equal(row.prompt_ids, 'analyst_v1.2+verifier_v1.1'); assert.equal(row.tokens_input, 5);
  for (const c of refs.sheetsCfg.tabs.runs.columns) assert.ok(c in row, 'runs.' + c);
});

test('token รายขั้นและรหัสรุ่นโมเดลที่ตอบกลับจริง', () => {
  const calls = [{ model_key: 'A', call_purpose: 'analyst', input_tokens: 1000, output_tokens: 500, status: 'ok', model_id: 'm-a-1' }, { model_key: 'A', call_purpose: 'verifier', input_tokens: 200, output_tokens: 20, status: 'ok', model_id: 'm-a-1' },
    { model_key: 'B', call_purpose: 'analyst', input_tokens: 900, output_tokens: 400, status: 'ok', model_id: 'm-b-2' }, { model_key: 'C', call_purpose: 'analyst', input_tokens: 0, output_tokens: 0, status: 'error', model_id: 'm-c' }];
  const t = E.tokenSummary(calls, null);
  assert.deepEqual(t.by_purpose.analyst, { calls: 3, input: 1900, output: 900 }); assert.deepEqual(t.by_purpose.verifier, { calls: 1, input: 200, output: 20 });
  assert.equal(t.total.input, 2100); assert.equal(t.cost_usd, null);
  const price = { models: { A: { input_per_1m: 2, output_per_1m: 10 }, B: { input_per_1m: 1, output_per_1m: 5 }, C: { input_per_1m: 1, output_per_1m: 1 } } };
  assert.equal(E.tokenSummary(calls, price).cost_usd, Math.round(((1200 * 2 + 520 * 10 + 900 * 1 + 400 * 5) / 1e6) * 1e4) / 1e4);
  assert.equal(E.modelIdsSummary(calls), 'A:m-a-1;B:m-b-2');
});

test('cache ผู้ตรวจ: ข้อที่เคยตรวจใช้คำตัดสินเดิม ไม่เรียกซ้ำ · key เป็น hash ไม่มีข้อความ · ปิดได้ · คำตัดสินเปลี่ยนผลเหมือนเรียกจริง', () => {
  const reqs = refs.requirements.filter((r) => r.role_id === 'R19');
  const text = 'Cut purchase-order cycle time from 30 days to 9 by redesigning the requisition-to-payment flow.';
  const el = reqs.find((r) => r.element_id === '4.A.2.b.1');
  const A = reqs.map((r) => ({ requirement_id: r.requirement_id, status: r === el ? 'evidenced' : 'missing', quotes: r === el ? [text] : [] }));
  const base = reqs.map((r) => ({ requirement_id: r.requirement_id, status: 'missing', quotes: [] }));
  const mr = { A: out('R19', A), B: out('R19', base), C: out('R19', base) };
  const c1 = { ...cfg, verifier_cache: { enabled: true, max_entries: 100 } };
  const input = { roleId: 'R19', requirements: reqs, text, modelResults: mr, projectCfg: c1, verifierTemplate: refs.verifierPrompt };
  const cacheIn = (entries) => ({ enabled: true, entries, prompt_id: 'verifier_v1.1', model_ids: { A: 'a', B: 'b', C: 'c' } });
  const first = E.prepareVerification({ ...input, cache: cacheIn({}) });
  assert.equal(first.checks.length, 1); assert.equal(first.n_cached, 0); assert.deepEqual(Object.keys(first.requests), ['B']);
  const adds = E.newCacheEntries({ c001: 'supports' }, first.cache_keys, 123);
  const key = Object.keys(adds)[0];
  assert.match(key, /^[0-9a-f]{64}$/); assert.ok(!JSON.stringify(adds).includes('purchase-order'), 'cache ไม่เก็บข้อความเรซูเม');
  const second = E.prepareVerification({ ...input, cache: cacheIn(adds) });
  assert.equal(second.n_cached, 1); assert.deepEqual(second.requests, {}); assert.equal(second.cached.c001, 'supports');
  const off = E.prepareVerification({ ...input, projectCfg: { ...cfg, verifier_cache: { enabled: false } }, cache: cacheIn(adds) });
  assert.equal(off.n_cached, 0, 'ปิด cache ที่ config → เรียกผู้ตรวจทุกครั้ง');
  const other = E.prepareVerification({ ...input, cache: { ...cacheIn(adds), model_ids: { A: 'a', B: 'b2', C: 'c' } } });
  assert.equal(other.n_cached, 0, 'เปลี่ยนรหัสรุ่นผู้ตรวจ → ไม่ใช้ cache เดิม');
  const ev = E.evaluateRun({ runId: 'R', roleId: 'R19', requirements: reqs, text, modelResults: mr, cachedVerdicts: second.cached, verifierResults: {}, projectCfg: c1, nowIso: 'x' });
  const f = ev.findings.find((x) => x.model_key === 'A' && x.claimed_status !== 'missing');
  assert.equal(f.verifier_verdict, 'supports'); assert.equal(ev.verification.B.call_status, 'cached'); assert.equal(ev.verification.B.n_cached, 1);
  assert.deepEqual(ev.fresh_verdicts, {});
  assert.equal(Object.keys(E.mergeVerifierCache({ a: { v: 'supports', t: 1 }, b: { v: 'unrelated', t: 2 } }, { c: { v: 'supports', t: 3 } }, 2)).sort().join(), 'b,c', 'ตัดรายการเก่าสุดเมื่อเกินเพดาน');
});

test('ค่าควบคุมรุ่น 2.1 ใน config ครบ และ prompt analyst_v1.2 ขอ actor ทั้งข้อกำหนดและงานหลัก', () => {
  assert.equal(cfg.prompt_version, 'analyst_v1.2'); assert.equal(cfg.verifier_prompt_version, 'verifier_v1.1');
  assert.deepEqual(Object.keys(cfg.actor_rules).sort(), ['enabled', 'expert_lv_min', 'expert_min_actor', 'hands_on_prefixes', 'note', 'task_min_actor_by_role', 'task_min_actor_default']);
  assert.equal(cfg.quote_reuse.max_full_evidence_per_quote, 2);
  assert.equal(refs.prompt.match(/"actor": "performed\|led\|oversaw\|mentioned"/g).length, 2);
  assert.ok(refs.prompt.includes('analyst_v1.2'));
  assert.equal(cfg.freeze.frozen, false);
});
