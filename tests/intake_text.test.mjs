// ข้อมูลเข้า การเตรียมข้อความ PII การเรียกซ้ำ ผู้ให้บริการ สถานะงาน (Spec A1, A2, A5, A6, A12)
import test from 'node:test';
import assert from 'node:assert/strict';
import { ENGINE as E, loadRefs } from '../scripts/lib/refs.mjs';

const refs = loadRefs();

test('normalizeText: กฎคงที่ห้าข้อ (3.5.1)', () => {
  const t = E.normalizeText('A\r\nB\rC D E – “q” ’s   x\n\n\n\n\n\nY  \n');
  assert.equal(t, "A\nB\nC D E - \"q\" 's x\n\n\nY");
});

test('maskPII: สี่รูปแบบ [EMAIL] [URL] [PHONE] [ID] และนับจำนวน · เลขปีไม่ถูกปิด', () => {
  const m = E.maskPII('a.b@x.co.th | https://github.com/me | 081-234-5678 | 1-2345-67890-12-3 | 2019-2024 | linkedin.com/in/x');
  assert.equal(m.text, '[EMAIL] | [URL] | [PHONE] | [ID] | 2019-2024 | [URL]');
  assert.deepEqual(m.counts, { EMAIL: 1, URL: 2, ID: 1, PHONE: 1 });
  const p = E.prepareText('Tel  +66 81 234 5678');
  assert.equal(p.text, 'Tel [PHONE]');
  assert.equal(p.pii_masked_count, 1);
  assert.equal(p.text_sha256, E.sha256Hex('Tel [PHONE]'));
});

test('parseFormRow + validateIntake: ต้องยินยอม · 20 อาชีพ · โหมด · 6/12/18/24 เดือน (A1, A2)', () => {
  const cols = refs.sheetsCfg.tabs.form_responses.columns;
  const row = Object.fromEntries(cols.map((c) => [c, '']));
  Object.assign(row, { [cols[0]]: '2026-10-01 09:00:00', [cols[1]]: 'User@Mail.test', [cols[2]]: 'https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrStUvWxYz012345', [cols[3]]: 'R06 นักวิทยาศาสตร์ข้อมูล', [cols[4]]: '6', [cols[5]]: '10', [cols[6]]: 'ทั้งสองประเภท', [cols[7]]: 'ยินยอม' });
  const ctx = E.parseFormRow(row, refs.sheetsCfg);
  assert.equal(ctx.role_id, 'R06'); assert.equal(ctx.mode, 'both'); assert.equal(ctx.email, 'user@mail.test');
  assert.equal(ctx.file_id, '1AbCdEfGhIjKlMnOpQrStUvWxYz012345'); assert.equal(ctx.consent, true);
  const roleIds = refs.roles.map((r) => r.role_id);
  assert.equal(E.validateIntake(ctx, refs.projectCfg, roleIds).ok, true);
  assert.deepEqual(E.validateIntake({ ...ctx, consent: false, timeline_months: 7 }, refs.projectCfg, roleIds).errors, ['consent_not_given', 'timeline_invalid']);
  const noConsent = E.parseFormRow({ ...row, [cols[7]]: 'ไม่ยินยอม' }, refs.sheetsCfg);
  assert.equal(noConsent.consent, false);
});

test('checkFile: PDF ≤ 10,485,760 ไบต์ · ≤ 5 หน้า (A1)', () => {
  const c = refs.projectCfg;
  assert.equal(E.checkFile({ mime: 'application/pdf', bytes: 10485760, pages: 5 }, c).ok, true);
  assert.equal(E.checkFile({ mime: 'application/pdf', bytes: 10485761, pages: 1 }, c).error_code, 'file_too_large');
  assert.equal(E.checkFile({ mime: 'application/pdf', bytes: 100, pages: 6 }, c).error_code, 'too_many_pages');
  assert.equal(E.checkFile({ mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', bytes: 100 }, c).error_code, 'file_not_pdf');
});

test('response_id = sha256(เวลาส่ง|อีเมล|รหัสไฟล์) · กันงานซ้ำเมื่อ running/ready/delivered (A12)', () => {
  const ctx = { timestamp: 't', email: 'A@B.c', file_id: 'f' };
  assert.equal(E.responseId(ctx), E.sha256Hex('t|a@b.c|f'));
  const rid = E.responseId(ctx);
  assert.equal(E.isDuplicate(rid, [{ response_id: rid, stage: 'failed' }]), false);
  for (const st of ['running', 'ready', 'delivered']) assert.equal(E.isDuplicate(rid, [{ response_id: rid, stage: st }]), true);
});

test('runs.stage: running → ready → delivered หรือ failed เท่านั้น (รูป 3.8)', () => {
  assert.equal(E.nextStage('', 'running'), 'running');
  assert.equal(E.nextStage('running', 'ready'), 'ready');
  assert.equal(E.nextStage('ready', 'delivered'), 'delivered');
  assert.equal(E.nextStage('running', 'failed'), 'failed');
  assert.throws(() => E.nextStage('running', 'delivered'));
  assert.throws(() => E.nextStage('delivered', 'failed'));
});

test('buildProviderRequest: 3 ผู้ให้บริการ · รหัสรุ่นจาก env · 16,384 token (DEC-53) · temperature 0 (A6)', () => {
  const env = { MODEL_A_ID: 'a1', MODEL_B_ID: 'b1', MODEL_C_ID: 'c1' };
  const a = E.buildProviderRequest('A', refs.modelsCfg, 'P', env);
  const b = E.buildProviderRequest('B', refs.modelsCfg, 'P', env);
  const c = E.buildProviderRequest('C', refs.modelsCfg, 'P', env);
  assert.equal(a.url, 'https://api.openai.com/v1/chat/completions'); assert.equal(a.body.model, 'a1'); assert.equal(a.body.temperature, 0); assert.equal(a.body.max_completion_tokens, 16384);
  assert.equal(b.url, 'https://api.anthropic.com/v1/messages'); assert.equal(b.body.max_tokens, 16384); assert.equal(b.body.temperature, 0);
  assert.equal(c.url, 'https://generativelanguage.googleapis.com/v1beta/models/c1:generateContent'); assert.equal(c.body.generationConfig.maxOutputTokens, 16384);
  assert.equal(E.buildProviderRequest('A', refs.modelsCfg, 'P', env, { maxTokens: 4096 }).body.max_completion_tokens, 4096, 'ผู้ตรวจใช้เพดานของตัวเอง');
  assert.equal(new Set([a.url, b.url, c.url].map((u) => new URL(u).host)).size, 3, 'ห้ามเรียกผู้ให้บริการรายเดียวสามครั้ง');
  const noT = JSON.parse(JSON.stringify(refs.modelsCfg)); noT.models.B.send_temperature = false;
  assert.equal(E.buildProviderRequest('B', noT, 'P', env).body.temperature, undefined);
});

test('parseProviderResponse: แปลงผลของแต่ละผู้ให้บริการ', () => {
  assert.equal(E.parseProviderResponse('anthropic_messages', { content: [{ type: 'text', text: '{}' }], usage: { input_tokens: 5, output_tokens: 2 }, stop_reason: 'end_turn', model: 'm' }).text, '{}');
  const g = E.parseProviderResponse('google_generative_language', { candidates: [{ content: { parts: [{ text: '{"x":1}' }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 4 } });
  assert.deepEqual([g.text, g.input_tokens, g.output_tokens, g.finish_reason], ['{"x":1}', 3, 4, 'STOP']);
});

test('callModelWithRetry: เรียกซ้ำ ≤ 2 ครั้งเมื่อ 429/timeout · ไม่เรียกซ้ำเมื่อ 400 · บันทึกทุกครั้ง (A6, ตาราง 3.22)', async () => {
  const req = { model_id: 'x' };
  const cfg = JSON.parse(JSON.stringify(refs.modelsCfg)); cfg.models.A.api = 'openai_chat_completions';
  const okJson = { json: { choices: [{ message: { content: '{}' }, finish_reason: 'stop' }], usage: {} }, latency_ms: 5 };
  const seq = (arr) => { let i = 0; return async () => { const x = arr[i++]; if (x instanceof Error) throw x; return x; }; };
  const e429 = () => Object.assign(new Error('rate'), { httpCode: 429 });
  let r = await E.callModelWithRetry('A', cfg, req, seq([e429(), e429(), okJson]), 'RUN', () => 't');
  assert.equal(r.status, 'ok'); assert.equal(r.calls.length, 3); assert.deepEqual(r.calls.map((c) => c.attempt), [1, 2, 3]);
  r = await E.callModelWithRetry('A', cfg, req, seq([e429(), e429(), e429(), okJson]), 'RUN', () => 't');
  assert.equal(r.status, 'failed'); assert.equal(r.calls.length, 3); assert.equal(r.calls[2].error_code, '429');
  r = await E.callModelWithRetry('A', cfg, req, seq([Object.assign(new Error('bad'), { httpCode: 400 }), okJson]), 'RUN', () => 't');
  assert.equal(r.status, 'failed'); assert.equal(r.calls.length, 1);
  r = await E.callModelWithRetry('A', cfg, req, seq([Object.assign(new Error('ETIMEDOUT'), { code: 'ETIMEDOUT' }), okJson]), 'RUN', () => 't');
  assert.equal(r.status, 'ok'); assert.equal(r.calls[0].status, 'timeout');
});

test('buildPrompt: ไม่ส่งคำพ้องและน้ำหนักเข้า prompt (3.5.2)', () => {
  const reqs = refs.requirements.filter((r) => r.role_id === 'R01');
  const p = E.buildPrompt(refs.prompt, 'R01', reqs, 'TEXT');
  assert.ok(p.includes('REQ-R01-2.B.3.e'));
  assert.ok(!p.includes('weight_renormalized') && !p.includes('element_aliases'));
  assert.ok(!p.includes('wrote code'), 'คำพ้องของ Programming ต้องไม่อยู่ใน prompt');
  assert.ok(!p.includes('{{'));
});
