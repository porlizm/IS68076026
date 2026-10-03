// workflow: ตัวตรวจเชิงโครงสร้าง + รัน Code node จริงใน sandbox เพื่อทดสอบบั๊กถดถอย B1–B11 (Spec ส่วน B)
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import fs from 'node:fs';
import { ROOT, ENGINE as E, loadRefs } from '../scripts/lib/refs.mjs';
import { loadWorkflows, validate } from '../scripts/validate_workflows.mjs';
import { runCase } from '../scripts/run_local.mjs';

const refs = loadRefs();
const wfs = loadWorkflows();
const node = (wf, name) => wfs[wf].nodes.find((n) => n.name === name);

// ตัวรัน Code node แบบย่อ: จำลอง $input, $(), $env, this.helpers
async function runCode(wf, name, { input = [], nodes = {}, env = {}, helpers = {}, itemIndex = 0 } = {}) {
  const n = node(wf, name);
  const items = input.map((j) => (j && j.json ? j : { json: j }));
  const $ = (nm) => {
    if (!(nm in nodes)) throw new Error('node ' + nm + ' ยังไม่ได้ทำงาน');
    const arr = nodes[nm].map((j) => (j && j.json ? j : { json: j }));
    return { all: () => arr, first: () => arr[0], item: arr[itemIndex] || arr[0] };
  };
  const $input = { all: () => items, first: () => items[0], item: items[itemIndex] };
  const sandbox = { $, $input, $env: env, $itemIndex: itemIndex, console, Buffer, Date, JSON, Math, Promise, Object, Array, String, Number, Set, Map, Error, RegExp, URL, encodeURIComponent };
  vm.createContext(sandbox);
  const fn = vm.runInContext('(async function(){' + n.parameters.jsCode + '\n})', sandbox);
  const res = await fn.call({ helpers });
  return res === undefined ? res : JSON.parse(JSON.stringify(res)); // ตัดขอบเขต realm ของ vm
}

test('ตัวตรวจ workflow ผ่านทุกข้อ (A14, B1, B3, B5, B6, B7, B9, B10, C6)', () => {
  assert.deepEqual(validate(wfs), []);
});

test('ตัวตรวจจับ engine ที่ถูกแก้ใน workflow ได้ (C6)', () => {
  const bad = JSON.parse(JSON.stringify(wfs));
  const n = bad.WF_SUB_Decide.nodes.find((x) => x.name === 'Decide & Plan');
  n.parameters.jsCode = n.parameters.jsCode.replace('theta', 'theta ');
  assert.ok(validate(bad).some((e) => /ไม่ตรงกับ engine/.test(e)));
  const bad2 = JSON.parse(JSON.stringify(wfs));
  bad2.WF_SUB_Deliver.nodes.find((x) => x.name === 'Upload PDF').parameters.authentication = 'serviceAccount';
  assert.ok(validate(bad2).some((e) => /B10/.test(e)));
  const bad3 = JSON.parse(JSON.stringify(wfs));
  bad3.WF_SUB_Deliver.connections['Export PDF'].main[1] = [];
  assert.ok(validate(bad3).some((e) => /B9/.test(e)));
});

function formRow(i, consent = 'ยินยอม') {
  const cols = refs.sheetsCfg.tabs.form_responses.columns;
  return { [cols[0]]: `2026-10-01 09:0${i}:00`, [cols[1]]: `p${i}@mail.test`, [cols[2]]: `https://drive.google.com/open?id=1FileIdForTesting00000000000000${i}`, [cols[3]]: 'R01 วิศวกรซอฟต์แวร์', [cols[4]]: '6', [cols[5]]: '10', [cols[6]]: 'ทั้งสองประเภท', [cols[7]]: consent };
}

test('B6 + B1: trigger 3 แถวได้ 3 งาน · IF ได้ค่า boolean จริง · ไม่ยินยอมถูกปฏิเสธ', async () => {
  const out = await runCode('WF_Main_Intake', 'Parse & Validate', { nodes: { 'Form Row Trigger': [formRow(1), formRow(2), formRow(3, 'ไม่ยินยอม')], 'Read Runs': [{}] } });
  assert.equal(out.length, 3);
  assert.equal(new Set(out.map((o) => o.json.run_id)).size, 3);
  for (const o of out) { assert.equal(typeof o.json.valid, 'boolean'); assert.equal(typeof o.json.not_duplicate, 'boolean'); }
  assert.deepEqual(out.map((o) => o.json.valid), [true, true, false]);
  assert.equal(out[2].json.audit.event, 'rejected_input');
  assert.ok(!out[0].json.audit.detail.includes('@'), 'audit ไม่เก็บอีเมล');
});

test('กันงานซ้ำด้วย response_id (A12)', async () => {
  const first = await runCode('WF_Main_Intake', 'Parse & Validate', { nodes: { 'Form Row Trigger': [formRow(1)], 'Read Runs': [{}] } });
  const again = await runCode('WF_Main_Intake', 'Parse & Validate', { nodes: { 'Form Row Trigger': [formRow(1), formRow(1)], 'Read Runs': [{ response_id: first[0].json.response_id, stage: 'running' }] } });
  assert.deepEqual(again.map((o) => o.json.not_duplicate), [false, false]);
});

// ข้อมูลจำลองสำหรับ GapEngine → Decide ของกรณี A
async function gapAndDecide(caseId) {
  const caseDir = path.join(ROOT, 'synthetic', 'case_' + caseId);
  const meta = JSON.parse(fs.readFileSync(path.join(caseDir, 'meta.json'), 'utf8'));
  const local = await runCase(caseDir, refs, { legacy: true });
  const ctx = { ...local.ctx, ocr_engine: 'fixture', ocr_engine_version: 'fixture' };
  const payload = { ctx, text: local.prep.text, text_sha256: local.prep.text_sha256 };
  const sheetReqs = refs.requirements.filter((r) => r.role_id === meta.role_id).map((r) => Object.fromEntries(refs.sheetsCfg.tabs.ref_requirements.columns.map((c) => [c, r[c]])));
  const built = await runCode('WF_SUB_GapEngine', 'Build Prompt', { nodes: { 'When Called by Main': [{ payload }], 'Read Requirements': sheetReqs } });
  const calls = { A: 0, B: 0, C: 0 };
  const models = {};
  for (const k of ['A', 'B', 'C']) {
    const mock = JSON.parse(fs.readFileSync(path.join(caseDir, 'mock_responses', k + '.json'), 'utf8'));
    let n = 0;
    const httpRequest = async (opts) => {
      calls[k]++; n++;
      if (mock.simulate === 'http_error' && n <= mock.times) { const e = new Error('HTTP 429'); e.httpCode = '429'; throw e; }
      const txt = mock.text;
      if (/openai/.test(opts.url)) return { choices: [{ message: { content: txt }, finish_reason: 'stop' }], usage: { prompt_tokens: 1, completion_tokens: 1 }, model: 'mock-a' };
      if (/anthropic/.test(opts.url)) return { content: [{ type: 'text', text: txt }], usage: { input_tokens: 1, output_tokens: 1 }, stop_reason: 'end_turn', model: 'mock-b' };
      return { candidates: [{ content: { parts: [{ text: txt }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 }, modelVersion: 'mock-c' };
    };
    const r = await runCode('WF_SUB_GapEngine', 'Call Model ' + k, { nodes: { 'Build Prompt': built }, env: { MODEL_A_ID: 'a', MODEL_B_ID: 'b', MODEL_C_ID: 'c', OPENAI_API_KEY: 'k', ANTHROPIC_API_KEY: 'k', GOOGLE_API_KEY: 'k' }, helpers: { httpRequest } });
    models[k] = r[0];
  }
  const merged = [models.A, models.B, models.C];
  const assembled = await runCode('WF_SUB_GapEngine', 'Assemble Model Results', { nodes: { 'Build Prompt': built, 'Wait for All Models': merged } });
  const corpus = refs.corpus.map((c) => Object.fromEntries(refs.sheetsCfg.tabs.ref_corpus.columns.map((k) => [k, c[k]])));
  const maps = refs.mappings.map((m) => Object.fromEntries(refs.sheetsCfg.tabs.ref_mappings.columns.map((k) => [k, m[k]])));
  const decided = await runCode('WF_SUB_Decide', 'Decide & Plan', { nodes: { 'When Called by Main': [{ payload: assembled[0].json }], 'Read Corpus': corpus, 'Read Mappings': maps } });
  return { local, assembled: assembled[0].json, decided: decided[0].json, calls };
}

test('B2 + B4 + B5: payload เข้า Decide มี requirements 30 ข้อพร้อมคำพ้อง · ผลเท่ากับ run_local · เรียกโมเดลตัวละครั้งเดียว', async () => {
  for (const c of ['A', 'B', 'C']) {
    const r = await gapAndDecide(c);
    assert.equal(r.assembled.requirements.length, 30);
    assert.ok(r.assembled.requirements.every((q) => q.element_aliases && q.element_aliases.length > 0), 'B4 คำพ้องต้องไปถึงกฎ R3');
    const wfDec = r.decided.decisions.map((d) => [d.requirement_id, d.final_status, d.evidence_char_start]);
    const locDec = r.local.out.eval.decisions.map((d) => [d.requirement_id, d.final_status, d.evidence_char_start]);
    assert.deepEqual(wfDec, locDec, 'B4: ผลของ workflow ต้องเท่ากับ run_local กรณี ' + c);
    assert.deepEqual(r.decided.plan_rows.map((p) => p.item_id), r.local.out.planRows.map((p) => p.item_id));
    if (c === 'C') assert.deepEqual(r.calls, { A: 1, B: 1, C: 3 }, 'C: 429 → เรียกซ้ำ 2 ครั้ง');
    else assert.deepEqual(r.calls, { A: 1, B: 1, C: 1 }, 'B5: เรียกตัวละ 1 ครั้ง');
    assert.equal(r.decided.run_row.stage, 'ready');
    assert.equal(r.decided.report_payload.report_hash.length, 64);
  }
});

test('B2: Decide หยุดพร้อมข้อความเมื่อ payload ไม่มี requirements', async () => {
  await assert.rejects(runCode('WF_SUB_Decide', 'Decide & Plan', { nodes: { 'When Called by Main': [{ payload: { ctx: { run_id: 'RUN-x' }, model_results: {} } }], 'Read Corpus': [], 'Read Mappings': [] } }), /requirements/);
});

test('DEC-21 ใน workflow: ref_mappings นำเข้าไม่ครบ → หยุดพร้อม "ข้อผิดพลาดของข้อมูลอ้างอิง"', async () => {
  const r = await gapAndDecide('A');
  const maps = refs.mappings.slice(0, 100);
  await assert.rejects(runCode('WF_SUB_Decide', 'Decide & Plan', { nodes: { 'When Called by Main': [{ payload: r.assembled }], 'Read Corpus': refs.corpus, 'Read Mappings': maps } }), /ข้อผิดพลาดของข้อมูลอ้างอิง/);
});

test('B7 + B8: ส่งสำเร็จต้องได้ delivered/sent · error branch ได้ failed · รายงานเดิมที่ส่งแล้วไม่ส่งซ้ำ', async () => {
  const r = await gapAndDecide('A');
  const payload = { ctx: r.decided.ctx, report_payload: r.decided.report_payload };
  const env = { RESEARCHER_EMAIL: 'researcher@mail.test', DRIVE_REPORT_FOLDER_ID: 'FOLDER' };
  const rendered = await runCode('WF_SUB_Deliver', 'Render Report', { nodes: { 'When Called by Main': [{ payload }], 'Read Deliveries': [{}] }, env });
  const R = rendered[0].json;
  assert.equal(R.not_yet_delivered, true);
  assert.equal(R.email_to, 'researcher@mail.test', 'email_enabled=false → ส่งให้ผู้วิจัย');
  assert.match(R.doc_upload.content_type, /^multipart\/related; boundary=/);
  assert.ok(R.doc_upload.body.includes('application/vnd.google-apps.document'));
  const ok = await runCode('WF_SUB_Deliver', 'Record Delivery', { input: [{ id: 'x' }], nodes: { 'Render Report': rendered, 'Upload PDF': [{ id: 'PDF1', webViewLink: 'https://drive.google.com/file/d/PDF1' }], 'Send Email': [{ id: 'MSG1', labelIds: ['SENT'] }] } });
  assert.equal(ok[0].json.delivery_row.email_status, 'sent');
  assert.equal(ok[0].json.run_update.stage, 'delivered');
  assert.equal(ok[0].json.delivery_row.pdf_file_id, 'PDF1');
  const bad = await runCode('WF_SUB_Deliver', 'Record Delivery', { input: [{ error: { message: 'Export failed 500' } }], nodes: { 'Render Report': rendered } });
  assert.equal(bad[0].json.delivery_row.email_status, 'failed');
  assert.equal(bad[0].json.run_update.stage, 'failed');
  const prior = [{ report_hash: R.report_hash, email_status: 'sent', pdf_file_id: 'OLD', web_view_link: 'https://drive.google.com/file/d/OLD' }];
  const again = await runCode('WF_SUB_Deliver', 'Render Report', { nodes: { 'When Called by Main': [{ payload }], 'Read Deliveries': prior }, env });
  assert.equal(again[0].json.not_yet_delivered, false);
  const reused = await runCode('WF_SUB_Deliver', 'Record Delivery', { input: [again[0].json], nodes: { 'Render Report': again } });
  assert.equal(reused[0].json.delivery_row.pdf_file_id, 'OLD');
  assert.equal(reused[0].json.delivery_row.error_code, 'reused_prior_delivery');
});

test('B11: WF_Error หา run_id ได้จาก execution ที่ล้มเหลว หรือจากข้อความ [run_id=...]', async () => {
  const trig = [{ execution: { id: '77', error: { message: 'Request failed with status code 404' }, lastNodeExecuted: 'Download Resume' }, workflow: { name: 'WF_Main_Intake' } }];
  const exec = [{ data: { resultData: { runData: { 'Parse & Validate': [{ data: { main: [[{ json: { run_id: 'RUN-20261001090100-abcdef12' } }]] } }] } } } }];
  const out = await runCode('WF_Error', 'Classify Error', { nodes: { 'Error Trigger': trig, 'Get Failed Execution': exec } });
  assert.equal(out[0].json.run_update.run_id, 'RUN-20261001090100-abcdef12');
  assert.equal(out[0].json.run_update.stage, 'failed');
  const trig2 = [{ execution: { id: '78', error: { message: '[run_id=RUN-20261001090200-12345678] too_many_pages: bytes=1 pages=9' } }, workflow: { name: 'WF_Main_Intake' } }];
  const out2 = await runCode('WF_Error', 'Classify Error', { nodes: { 'Error Trigger': trig2, 'Get Failed Execution': [{}] } });
  assert.equal(out2[0].json.run_update.run_id, 'RUN-20261001090200-12345678');
  assert.equal(out2[0].json.run_update.error_code, 'too_many_pages');
  assert.ok(!/@/.test(out2[0].json.alert.body.replace('ผู้เข้าร่วม', '')), 'แจ้งผู้วิจัยโดยไม่แนบอีเมลผู้เข้าร่วม');
});

test('Check File: ปฏิเสธไฟล์เกิน 5 หน้าพร้อม run_id (ตาราง 3.10)', async () => {
  const pages = Array.from({ length: 6 }, () => '<< /Type /Page >>').join('\n');
  const buf = Buffer.from('%PDF-1.4\n' + pages + '\n<< /Type /Pages >>');
  const ctx = { run_id: 'RUN-20261001090000-00000000' };
  const helpers = { getBinaryDataBuffer: async () => buf };
  await assert.rejects(runCode('WF_Main_Intake', 'Check File', { input: [{ json: {}, binary: { data: { mimeType: 'application/pdf' } } }], nodes: { 'Parse & Validate': [ctx] }, helpers }), /\[run_id=RUN-20261001090000-00000000\] too_many_pages/);
  const ok = Buffer.from('%PDF-1.4\n<< /Type /Page >>\n<< /Type /Pages >>');
  const r = await runCode('WF_Main_Intake', 'Check File', { input: [{ json: {}, binary: { data: { mimeType: 'application/pdf' } } }], nodes: { 'Parse & Validate': [ctx] }, helpers: { getBinaryDataBuffer: async () => ok } });
  assert.equal(r.json.ctx.page_count, 1);
});

test('Prepare Text: ใช้ Document AI เมื่อสำเร็จ · สำรองเมื่อหลักล้มเหลว · บันทึกชื่อบริการ (A4, A5, A16)', async () => {
  const base = [{ ctx: { run_id: 'RUN-1', page_count: 1 } }];
  const a = await runCode('WF_Main_Intake', 'Prepare Text & Mask PII', { input: [{ document: { text: 'Mail me a@b.co now' } }], nodes: { 'Check File': base }, env: { DOCAI_PROCESSOR_ID: 'P1', DRIVE_MASKED_TEXT_FOLDER_ID: 'F' } });
  assert.equal(a.json.ocr_row.engine, 'google_document_ai');
  assert.equal(a.json.gap_input.text, 'Mail me [EMAIL] now');
  assert.equal(a.json.ocr_row.pii_masked_count, 1);
  assert.ok(a.json.masked_upload.body.includes('Mail me [EMAIL] now'), 'เก็บข้อความหลังปิดบังไว้ใน Drive ของผู้วิจัย (DEC-34)');
  const b = await runCode('WF_Main_Intake', 'Prepare Text & Mask PII', { input: [{ text: 'x', engine: 'tesseract', engine_version: '5.4' }], nodes: { 'Check File': base }, env: {} });
  assert.equal(b.json.ocr_row.engine, 'tesseract');
  assert.equal(b.json.ctx.ocr_engine_version, '5.4');
});
