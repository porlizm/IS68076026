// WF_Demo (DEC-58): รันโค้ดของทุกโหนดจาก demo/WF_Demo.json ด้วยตัวจำลอง n8n (demo/test/harness.mjs) + Gemini จำลองแบบ oracle
// ใช้กรณี D (R19 เรซูมแบบเน้นผลงาน · สมมติ) — ตรวจว่า Demo ใช้กฎรุ่น 2 จาก engine.js ตัวเดียวกับระบบเต็ม
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../scripts/lib/refs.mjs';
import { loadWf, run } from '../demo/test/harness.mjs';
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
