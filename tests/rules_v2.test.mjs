// กฎรุ่น 2 (3 ต.ค. 2569 · DEC-51–56): ตัดคำต่อท้าย · ซ่อม quote · R3 สองชั้น · ผู้ตรวจ · R5/R6 · T/H · แผนตามระดับผู้เรียน
// ข้อความทดสอบเป็นข้อความสมมติที่เลียนรูปแบบเรซูเมจริงที่พบใน Gap_03OCT26 (ไม่ใช่ข้อความของบุคคลจริง)
import test from 'node:test';
import assert from 'node:assert/strict';
import { ENGINE as E, loadRefs, signalsFor } from '../scripts/lib/refs.mjs';

const refs = loadRefs();
const cfg = refs.projectCfg;
const reqOf = (rid, el) => refs.requirements.find((r) => r.role_id === rid && r.element_id === el);

test('stem: รูปคำต่างกันของคำเดียวกันได้รากเดียว', () => {
  const same = [['directed', 'directing', 'direction'], ['coordination', 'coordinated', 'coordinating'], ['planning', 'planned', 'plans'], ['scheduling', 'schedule'], ['management', 'managed', 'manager'], ['monitoring', 'monitored']];
  for (const g of same) assert.equal(new Set(g.map(E.stem)).size, 1, g.join(','));
  assert.equal(E.stem('aws'), 'aws'); assert.equal(E.stem('2020'), '2020');
});

test('R2 ซ่อม quote (DEC-52): เปลี่ยนรูปกริยา/ตัวพิมพ์ → ใช้ข้อความจริงจากเรซูเม · ข้อความที่ไม่มีจริงยังไม่ผ่าน', () => {
  const text = 'Delivered 300+ live shows, directing cross-functional teams of 40+ against fixed broadcast slots.\nOther line here.';
  const r = E.ruleR2('Directed cross-functional teams of 40+ against fixed broadcast slots.', text, cfg);
  assert.equal(r.verified, true); assert.equal(r.text_version, 'repaired');
  assert.equal(r.matched_text, 'directing cross-functional teams of 40+ against fixed broadcast slots.');
  assert.equal(text.slice(r.start, r.end), r.matched_text);
  assert.equal(E.ruleR2('Managed a global team of 400 engineers across nine countries.', text, cfg).verified, false);
  assert.equal(E.ruleR2('teams of 40+', text, cfg).text_version, 'normalized');
  assert.equal(E.ruleR2('Directed teams', text, { ...cfg, r2_repair_min_similarity: 0 }).verified, false, 'ปิดการซ่อมได้');
});

test('R3a ตัดคำต่อท้าย: directed ↔ directing · คำพ้องหลายคำแบบรากเดียวกัน', () => {
  const g = reqOf('R19', '4.A.4.b.4');
  const q = 'Directed 5 system analysts and 9 developers, running performance reviews for each.';
  const lex = E.overlapScore(q, g, { ...cfg, r3_stemming: false }).score;
  const st = E.overlapScore(q, g, cfg).score;
  assert.ok(st > lex, `stemming ต้องเพิ่มคะแนน (${lex} → ${st})`);
  const sched = reqOf('R19', '4.A.2.b.5');
  assert.ok(E.aliasHit('Owned the sprint schedules for two squads', sched, 4, true), 'คำพ้อง sprint schedule ตรงแบบรากคำ');
});

const mkOut = (role, assessments, tasks) => ({ status: 'ok', output: { text: JSON.stringify({ schema_version: 'analyst_v1.1', role_id: role, assessments, task_assessments: tasks || [] }) } });

test('R3b ผู้ตรวจข้ามโมเดล (DEC-51): หมุนเวียน A→B→C→A · ข้ามโมเดลที่ล้ม · ไม่ตรวจตัวเอง · คำตัดสินเปลี่ยนเสียง', () => {
  assert.equal(E.chooseVerifier('A', ['A', 'B', 'C'], cfg), 'B');
  assert.equal(E.chooseVerifier('C', ['A', 'B', 'C'], cfg), 'A');
  assert.equal(E.chooseVerifier('A', ['A', 'C'], cfg), 'C');
  assert.equal(E.chooseVerifier('A', ['A'], cfg), '');
  assert.equal(E.chooseVerifier('A', ['A'], { ...cfg, allow_self_verification: true }), 'A');
  const reqs = refs.requirements.filter((r) => r.role_id === 'R19');
  const text = 'Cut purchase-order cycle time from 30 days to 9 by redesigning the requisition-to-payment flow.\nSenior IT Project Manager, Example Co., 2019-present';
  const q1 = 'Cut purchase-order cycle time from 30 days to 9 by redesigning the requisition-to-payment flow.';
  const q2 = 'Senior IT Project Manager, Example Co., 2019-present';
  const base = reqs.map((r) => ({ requirement_id: r.requirement_id, status: 'missing', quotes: [] }));
  const set = (arr, el, st, q) => arr.map((a) => (a.requirement_id === 'REQ-R19-' + el ? { ...a, status: st, quotes: [q] } : a));
  const A = set(set(base, '4.A.2.b.1', 'evidenced', q1), '2.C.1.e', 'evidenced', q2);
  const mr = { A: mkOut('R19', A), B: mkOut('R19', base), C: mkOut('R19', base) };
  const pv = E.prepareVerification({ roleId: 'R19', requirements: reqs, text, modelResults: mr, projectCfg: cfg, verifierTemplate: refs.verifierPrompt });
  assert.equal(pv.checks.length, 2); assert.deepEqual(Object.keys(pv.requests), ['B']);
  assert.ok(pv.requests.B.prompt.includes('"check_id": "c001"') && !pv.requests.B.prompt.includes('RESUME START'), 'ผู้ตรวจไม่เห็นเรซูเมทั้งฉบับ');
  const verdict = (vs) => ({ B: { status: 'ok', output: { text: JSON.stringify({ schema_version: 'verifier_v1.0', checks: vs }) } } });
  const ev = E.evaluateRun({ runId: 'R', roleId: 'R19', requirements: reqs, text, modelResults: mr, verifierResults: verdict([{ check_id: 'c001', verdict: 'supports' }, { check_id: 'c002', verdict: 'unrelated' }]), projectCfg: cfg, nowIso: 'x' });
  const f = Object.fromEntries(ev.findings.filter((x) => x.model_key === 'A' && x.claimed_status !== 'missing').map((x) => [x.requirement_id, x]));
  assert.equal(f['REQ-R19-4.A.2.b.1'].final_vote, 'evidenced'); assert.match(f['REQ-R19-4.A.2.b.1'].rule_flags, /R3b_supports/);
  assert.equal(f['REQ-R19-2.C.1.e'].final_vote, 'missing'); assert.match(f['REQ-R19-2.C.1.e'].rule_flags, /R3b_unrelated/);
  assert.equal(ev.per_model.A.n_rejected, 1);
  const bad = E.evaluateRun({ runId: 'R', roleId: 'R19', requirements: reqs, text, modelResults: mr, verifierResults: { B: { status: 'ok', output: { text: 'not json' } } }, projectCfg: cfg, nowIso: 'x' });
  assert.equal(bad.per_model.A.n_unverified, 2); assert.equal(bad.per_model.A.n_rejected, 0, 'ผู้ตรวจล้มไม่นับเป็น hallucination');
  const lex = E.evaluateRun({ runId: 'R', roleId: 'R19', requirements: reqs, text, modelResults: mr, projectCfg: { ...cfg, r3_mode: 'lexical' }, nowIso: 'x' });
  assert.equal(lex.per_model.A.n_rejected, 2, 'โหมด lexical (ablation) ตัดทั้งสองข้อ');
});

test('R1 ไม่นับเสียง unverified · ablation คำนวณจากผลชุดเดียวกัน', () => {
  const reqs = refs.requirements.filter((r) => r.role_id === 'R19');
  const text = 'Directed 5 system analysts and 9 developers, running performance reviews for each.';
  const q = text;
  const A = reqs.map((r) => ({ requirement_id: r.requirement_id, status: r.element_id === '2.B.5.d' ? 'evidenced' : 'missing', quotes: r.element_id === '2.B.5.d' ? [q] : [] }));
  const mr = { A: mkOut('R19', A), B: mkOut('R19', A), C: mkOut('R19', A) };
  const ev = E.evaluateRun({ runId: 'R', roleId: 'R19', requirements: reqs, text, modelResults: mr, verifierResults: {}, projectCfg: cfg, nowIso: 'x' });
  const d = ev.decisions.find((x) => x.element_id === '2.B.5.d');
  if (/R3a_low_overlap/.test(ev.findings[0].rule_flags + ev.findings.map((x) => x.rule_flags).join())) assert.equal(d.final_status, 'abstained');
  assert.ok('r3_lexical_only' in ev.scores.ablation && 'no_r3' in ev.scores.ablation);
});

test('R5 ใบรับรองในเรซูเม → ข้อที่ mapping L1 ระบุได้อย่างน้อย partially · ไม่นับบรรทัดเตรียมสอบ', () => {
  const ce = E.credentialEvidence({ text: 'CERTIFICATIONS\nProject Management Professional (PMP), PMI, 2023', corpus: refs.corpus, mappings: refs.mappings, roleId: 'R19', projectCfg: cfg });
  assert.ok(Object.keys(ce).length > 0); assert.ok(Object.values(ce).every((c) => c.item_id === 'CRT-R19-01'));
  const prep = E.credentialEvidence({ text: 'PMP Exam Prep course (in progress)', corpus: refs.corpus, mappings: refs.mappings, roleId: 'R19', projectCfg: cfg });
  assert.deepEqual(prep, {});
});

test('T และ H (DEC-55): งานหลัก 8 งานต่ออาชีพ · เทคโนโลยีนับแบบทั้งคำ', () => {
  const sig = signalsFor(refs, 'R19');
  assert.equal(sig.roleTasks.length, cfg.role_tasks_per_role);
  const h = E.techMatch('Tools: Jira, Confluence, SQL and Excel. Grew a team.', sig.roleTech);
  assert.deepEqual(h.found.map((x) => x.technology).sort(), ['Atlassian Confluence', 'Atlassian JIRA', 'Microsoft Excel', 'Structured query language SQL']);
  assert.equal(E.techMatch('Sapphire project', sig.roleTech).n_found, 0, 'SAP ต้องไม่ตรงคำว่า Sapphire');
  const p = E.buildPrompt(refs.prompt, 'R19', [], 'TXT', sig.roleTasks);
  assert.ok(p.includes('TASK-R19-16169') && !p.includes('{{TASKS_JSON}}'));
});

test('แผนตามระดับผู้เรียน (DEC-56): ประสบการณ์ ≥ 5 ปี ไม่ใช้รายการ Beginner กับข้อ partially', () => {
  assert.equal(E.estimateYearsExperience('Acme, 2016 - present\nFoo, 2012-2015', 2026), 13);
  assert.equal(E.estimateYearsExperience('no dates', 2026), null);
  const reqs = refs.requirements.filter((r) => r.role_id === 'R19');
  const decisions = reqs.map((r) => ({ requirement_id: r.requirement_id, final_status: 'partially', weight: Number(r.weight_renormalized) }));
  const base = { decisions, corpus: refs.corpus, mappings: refs.mappings, mode: 'both', months: 12, hoursPerWeek: 10, projectCfg: cfg, roleId: 'R19' };
  const junior = E.buildPlan({ ...base, learner: { years_experience: 1 } });
  const senior = E.buildPlan({ ...base, learner: { years_experience: 9 } });
  const lvl = Object.fromEntries(refs.corpus.map((c) => [c.item_id, c.level]));
  assert.ok(junior.items.some((i) => lvl[i.item_id] === 'Beginner'));
  assert.ok(senior.items.every((i) => lvl[i.item_id] !== 'Beginner'));
  assert.equal(senior.learner.level_filter_applied, true);
});
