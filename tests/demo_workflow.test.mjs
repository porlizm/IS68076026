// WF_Demo (DEC-58): รันโค้ดของทุกโหนดจาก demo/WF_Demo.json ด้วยตัวจำลอง n8n (demo/test/harness.mjs) + Gemini จำลองแบบ oracle
// ใช้กรณี D (R19 เรซูมแบบเน้นผลงาน · สมมติ) — ตรวจว่า Demo ใช้กฎรุ่น 2 จาก engine.js ตัวเดียวกับระบบเต็ม
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../scripts/lib/refs.mjs';
import { loadWf, run, staticData } from '../demo/test/harness.mjs';
import { oracleVerifierText } from '../scripts/run_local.mjs';

const wfo = loadWf(path.join(ROOT, 'demo', 'WF_Demo.json'));
const caseDir = path.join(ROOT, 'synthetic', 'case_D');
const resume = fs.readFileSync(path.join(caseDir, 'resume.txt'), 'utf8');
const pdf = fs.readFileSync(path.join(caseDir, 'resume_text.pdf'));
const analystText = (k) => JSON.parse(fs.readFileSync(path.join(caseDir, 'mock_responses', k + '.json'), 'utf8')).text;
const gem = (text) => ({ candidates: [{ content: { parts: [{ text }], role: 'model' }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 }, modelVersion: 'gemini-mock' });
function mocks({ fail = false, patch = null } = {}) {
  const calls = [];
  return { calls, extract: async (item) => ({ json: { ...item.json, text: resume, numpages: 1 }, binary: item.binary }),
    http: async (name, url, body, i) => {
      calls.push(name);
      if (fail) return { error: { message: '403 - API key not valid (mock)' } };
      const prompt = body.contents[0].parts[0].text;
      if (name === 'Gemini Verifier') return gem(oracleVerifierText(caseDir, 'B', prompt));
      let t = analystText(['A', 'B', 'C'][i]);
      if (patch) t = patch(t);
      const o = JSON.parse(t); o.profile = { current_role: 'Senior IT Project Manager', years_experience: 12, certifications: ['Project Management Professional (PMP)'], headline_th: 'ผู้จัดการโครงการไอที', summary_th: 'สรุป' };
      return gem(JSON.stringify(o));
    }, drive: async () => ({}) };
}
const post = (body) => ({ json: { body: { role_id: 'R19', months: '12', hours_per_week: '10', mode: 'both', consent: 'true', ...body } }, binary: { resume: { data: pdf.toString('base64'), mimeType: 'application/pdf', fileName: 'resume_D.pdf' } } });

test('WF_Demo กรณี D (R19): วิเคราะห์ 3 รอบ + ผู้ตรวจความหมาย → คะแนนสูง · มีดัชนี T/H · ไม่มีคะแนนคาดการณ์หลังเรียนจบ', async () => {
  const m = mocks();
  const out = await run(wfo, 'POST /is-demo-analyze', post({}), m);
  assert.equal(out.response.code, 200);
  const r = JSON.parse(out.response.body);
  assert.equal(r.analyst.source, 'gemini'); assert.equal(r.analyst.runs_usable, 3);
  assert.deepEqual(m.calls.filter((x) => x === 'Gemini Analyst').length, 3);
  assert.ok(m.calls.includes('Gemini Verifier'), 'ส่งข้อที่คำไม่ตรงให้ตรวจความหมาย');
  assert.ok(r.scores.readiness_pct >= 75, 'R ' + r.scores.readiness_pct);
  assert.ok(r.scores.ablation.r3_lexical_only < r.scores.readiness_pct - 30, 'ถ้าใช้ R3 คำซ้ำอย่างเดียวคะแนนจะต่ำมาก');
  assert.ok(r.scores.role_task_index >= 75); assert.equal(r.tasks.length, 8);
  assert.ok(r.tech.found.includes('Atlassian JIRA'));
  assert.ok(r.guard.n_repaired >= 1 && r.guard.n_semantic_pass > 0);
  assert.equal(r.plan.projected_readiness_pct, undefined);
  assert.equal(r.plan.learner.level_filter_applied, true);
});

test('WF_Demo: Gemini ล้ม → กฎสำรอง (R3 คำซ้ำ) ยังตอบ 200 และติดป้าย', async () => {
  const out = await run(wfo, 'POST /is-demo-analyze', post({}), mocks({ fail: true }));
  assert.equal(out.response.code, 200);
  const r = JSON.parse(out.response.body);
  assert.equal(r.analyst.source, 'offline_rules'); assert.match(r.analyst.fallback_reason, /403/);
  assert.equal(r.verifier.called, false);
});

test('WF_Demo Open Learner Model + R5: หลักฐานที่ผู้เรียนพิมพ์เพิ่มติดที่มา "ผู้เรียนเพิ่ม" · ใบรับรองในเรซูเมเป็นฐานขั้นต่ำ', async () => {
  const sup = 'Delivered business english presentations to regional clients every quarter.';
  const patch = (t) => { const o = JSON.parse(t); o.assessments = o.assessments.map((a) => (a.requirement_id === 'REQ-R19-2.C.7.a' ? { ...a, status: 'evidenced', quotes: [sup] }
    : a.requirement_id === 'REQ-R19-2.B.5.a' ? { ...a, status: 'missing', quotes: [] } : a)); return JSON.stringify(o); };
  const out = await run(wfo, 'POST /is-demo-analyze', post({ supplement: sup }), mocks({ patch }));
  const r = JSON.parse(out.response.body);
  const en = r.requirements.find((q) => q.element_id === '2.C.7.a');
  assert.equal(en.status, 'evidenced'); assert.equal(en.source, 'learner');
  assert.equal(r.candidate.supplement_chars, sup.length);
  const tm = r.requirements.find((q) => q.element_id === '2.B.5.a');
  assert.deepEqual([tm.status, tm.source], ['partially', 'credential'], 'R5: ทุกรอบตอบ missing แต่มี PMP ในเรซูเม → บางส่วน');
});

test('WF_Demo ฝัง engine.js รุ่นปัจจุบัน (ต้อง build demo ใหม่หลังแก้ engine · DEC-58)', async () => {
  const { createHash } = await import('node:crypto');
  const eng = fs.readFileSync(path.join(ROOT, 'engine', 'engine.js'), 'utf8');
  assert.equal(wfo.wf.meta.is68.engine_sha256, createHash('sha256').update(eng).digest('hex'), 'รัน node demo/build_wf_demo.mjs .');
});

// ── DEC-59 ───────────────────────────────────────────────────────────────────
test('DEC-59 version: ทุกโหนดฝังตราเดียวกับ WF_Demo.json · client_build ตรง/ไม่ตรง · endpoint /is-demo-version', async () => {
  const meta = wfo.wf.meta.is68;
  assert.ok(meta.wf_version && meta.build_id && meta.engine_version);
  const out = await run(wfo, 'POST /is-demo-analyze', post({ client_build: meta.build_id }), mocks());
  const r = JSON.parse(out.response.body);
  assert.equal(r.version.build_id, meta.build_id); assert.equal(r.version.wf_version, meta.wf_version);
  assert.equal(r.version.client_match, true); assert.deepEqual(r.ver_issues, []);
  const bad = JSON.parse((await run(wfo, 'POST /is-demo-analyze', post({ client_build: 'WF_Demo-OLD' }), mocks())).response.body);
  assert.equal(bad.version.client_match, false);
  const v = JSON.parse((await run(wfo, 'GET /is-demo-version', { json: { query: {} } }, mocks())).response.body);
  assert.equal(v.build_id, meta.build_id); assert.equal(v.engine_version, meta.engine_version);
});

test('DEC-59 version: โหนดที่ฝังตราต่างรุ่นถูกจับได้ (ver_issues)', async () => {
  const stale = JSON.parse(JSON.stringify(wfo.wf));
  const n = stale.nodes.find((x) => x.name === 'Plan Pathway (Eq 3.7–3.8)');
  n.parameters.jsCode = n.parameters.jsCode.replace(/"build_id":"[^"]+"/, '"build_id":"WF_Demo-STALE"');
  const out = await run(loadWfObj(stale), 'POST /is-demo-analyze', post({}), mocks());
  const r = JSON.parse(out.response.body);
  assert.ok(r.ver_issues.some((x) => /STALE/.test(x)), JSON.stringify(r.ver_issues));
});
function loadWfObj(wf) { return { wf, byName: Object.fromEntries(wf.nodes.map((n) => [n.name, n])) }; }

test('DEC-59 Role-Fit + token + actor: รายงานมี F/R_role/T · tokens รวมถูก · actor "led" ทำให้ข้อ hands-on เหลือบางส่วน', async () => {
  delete staticData.global;
  const r = JSON.parse((await run(wfo, 'POST /is-demo-analyze', post({}), mocks())).response.body);
  const S = r.scores;
  assert.ok(typeof S.role_fit === 'number' && typeof S.r_role === 'number');
  assert.ok(Math.abs(S.role_fit - (0.5 * S.r_role + 0.5 * S.role_task_index)) < 0.02);
  assert.ok(r.tokens.total.calls >= 4); assert.equal(r.tokens.stages.reduce((a, x) => a + x.input, 0), r.tokens.total.input);
  // บังคับ actor = oversaw ทุกข้อ → ไม่มีข้อ hands-on ที่เป็น evidenced
  const patch = (t) => { const o = JSON.parse(t); o.assessments.forEach((a) => { a.actor = 'oversaw'; }); (o.task_assessments || []).forEach((a) => { a.actor = 'oversaw'; }); return JSON.stringify(o); };
  const r2 = JSON.parse((await run(wfo, 'POST /is-demo-analyze', post({}), mocks({ patch }))).response.body);
  assert.equal(r2.requirements.filter((q) => q.hands_on && q.status === 'evidenced').length, 0);
  assert.ok(r2.scores.adjust.n_actor >= 1 || r2.requirements.filter((q) => q.hands_on).length === 0);
  assert.ok(r2.scores.role_fit <= S.role_fit);
});

test('DEC-59 D5: ข้อความเดียวเป็นหลักฐานเต็มได้ไม่เกิน QUOTE_REUSE_CAP ข้อ', async () => {
  const r = JSON.parse((await run(wfo, 'POST /is-demo-analyze', post({}), mocks())).response.body);
  const full = r.requirements.filter((q) => q.status === 'evidenced' && q.quote && q.source !== 'learner');
  const cnt = {}; full.forEach((q) => { cnt[q.quote] = (cnt[q.quote] || 0) + 1; });
  assert.ok(Math.max(0, ...Object.values(cnt)) <= 2, JSON.stringify(cnt).slice(0, 300));
});

test('DEC-59 D4: verifier cache — รันซ้ำด้วยเรซูเมเดิมไม่เรียกผู้ตรวจซ้ำ และผลเท่าเดิม', async () => {
  delete staticData.global;
  const m1 = mocks(); const a = JSON.parse((await run(wfo, 'POST /is-demo-analyze', post({}), m1)).response.body);
  const m2 = mocks(); const b = JSON.parse((await run(wfo, 'POST /is-demo-analyze', post({}), m2)).response.body);
  assert.ok(m1.calls.includes('Gemini Verifier'));
  assert.equal(m2.calls.filter((x) => x === 'Gemini Verifier').length, 0);
  assert.equal(b.tokens.fresh_checks, 0); assert.ok(b.tokens.cached_checks > 0);
  assert.deepEqual(a.requirements.map((q) => q.status), b.requirements.map((q) => q.status));
  assert.equal(a.scores.role_fit, b.scores.role_fit);
});
