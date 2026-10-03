// เส้นทางเต็มกับชุดทดสอบสังเคราะห์ 3 กรณี + รายงาน (Spec A13, A15, ภาคผนวก ค)
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { ROOT, ENGINE as E, loadRefs } from '../scripts/lib/refs.mjs';
import { runCase } from '../scripts/run_local.mjs';

const refs = loadRefs();
const run = (c) => runCase(path.join(ROOT, 'synthetic', 'case_' + c), refs);

test('กรณี A: 3 โมเดลใช้ได้ · สรุปได้ 30 ข้อ · แผนไม่เกิน Hmax · เรียกโมเดลตัวละ 1 ครั้ง', async () => {
  const r = await run('A');
  assert.equal(r.summary.usable_models, 3);
  assert.equal(r.summary.decided, 30);
  assert.ok(r.summary.accuracy_on_decided >= 0.9);
  assert.ok(r.summary.plan_hours <= r.summary.Hmax);
  assert.equal(r.summary.send_calls - r.summary.verifier_calls, 3, 'บั๊ก B5: 1 งานต้องเรียกแต่ละโมเดลวิเคราะห์ครั้งเดียวเมื่อไม่มีข้อผิดพลาด');
  assert.ok(r.summary.verifier_calls <= 3, 'DEC-51: ผู้ตรวจแต่ละโมเดลเรียกได้ครั้งเดียว');
  assert.equal(r.summary.pii_masked, 3);
});

test('กรณี B: หลักฐานน้อย → ช่องว่างมาก คะแนน R ต่ำ', async () => {
  const r = await run('B');
  assert.ok(r.summary.gaps >= 25);
  assert.ok(r.summary.R < 30);
});

test('กรณี C: โมเดล C ตอบ 429 ทุกครั้ง → เรียก 3 ครั้งแล้วเหลือ m = 2 · มีข้อ abstained จากเสียงไม่ตรงกัน', async () => {
  const r = await run('C');
  assert.equal(r.summary.usable_models, 2);
  const c = r.modelCalls.filter((x) => x.model_key === 'C');
  assert.equal(c.length, 3); assert.ok(c.every((x) => x.error_code === '429'));
  assert.equal(r.summary.total - r.summary.decided, 2);
  assert.ok(r.out.eval.decisions.filter((d) => d.final_status === 'abstained').every((d) => /R1_no_two_votes/.test(d.rule_flags)));
});

test('ผลเหมือนเดิมทุกครั้งที่ข้อมูลเข้าเหมือนกัน (report_hash คงที่)', async () => {
  const a = await run('A'); const b = await run('A');
  assert.equal(a.payload.report_hash, b.payload.report_hash);
  assert.equal(a.payload.report_hash.length, 64);
  assert.equal(Object.keys(a.payload.hashes).length, 5, 'ชุดข้อมูลรายงานมีค่าแฮช 5 ค่า (UC-03)');
});

test('รายงาน HTML: ห้าส่วน · escape ข้อความ · ลิงก์ https เท่านั้น (3.6.3)', async () => {
  const r = await run('A');
  for (let i = 1; i <= 5; i++) assert.ok(r.html.includes('ส่วนที่ ' + i));
  const p = JSON.parse(JSON.stringify(r.payload));
  p.decisions[0].final_status = 'evidenced'; p.decisions[0].evidence_quote = '<script>alert(1)</script>';
  p.plan.items = [{ ...p.plan.items[0], source_url: 'javascript:alert(1)', title: '<b>x</b>' }];
  const h = E.renderReportHTML(p, refs.projectCfg);
  assert.ok(!h.includes('<script>alert')); assert.ok(h.includes('&lt;script&gt;'));
  assert.ok(!h.includes('href="javascript:'));
  const mail = E.buildEmail(r.payload, 'user@mail.test', refs.projectCfg);
  assert.match(mail.body, /อ่านจากข้อความในเอกสารเท่านั้น/);
  assert.match(mail.body, /ขอให้ลบข้อมูล/);
});
