// WF_Final_IS (DEC-37): ตัวตรวจโครงสร้าง + รัน Code node ของไฟล์รวมใน sandbox ให้ได้ผลเท่ากับชุด 5 ไฟล์
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import fs from 'node:fs';
import { ROOT, loadRefs } from '../scripts/lib/refs.mjs';
import { loadWorkflows, loadFinal, validateFinal, EXPECTED_FINAL_NODES } from '../scripts/validate_workflows.mjs';
import { runCase } from '../scripts/run_local.mjs';

const refs = loadRefs();
const wfs = loadWorkflows();
const fin = loadFinal();
const clone = (o) => JSON.parse(JSON.stringify(o));

async function runNode(w, name, { input = [], nodes = {}, env = {}, helpers = {}, itemIndex = 0 } = {}) {
  const n = w.nodes.find((x) => x.name === name);
  if (!n) throw new Error('ไม่มีโหนด ' + name);
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
  return res === undefined ? res : JSON.parse(JSON.stringify(res));
}
const J = (r) => r[0].json;

test('WF_Final_IS ผ่านตัวตรวจ: 59 node · ไม่มี Execute Workflow · โหนดเดิมตรงชุด 5 ไฟล์ · ไม่อ้างค่าข้ามรอบ', () => {
  assert.deepEqual(validateFinal(fin, wfs), []);
  assert.equal(EXPECTED_FINAL_NODES, 59);
  assert.equal(fin.settings.errorWorkflow, undefined);
});

test('ตัวตรวจจับข้อผิดพลาดที่พบบ่อยหลังรวมไฟล์ได้', () => {
  const a = clone(fin); // อ้างผลของโหนดที่อาจไม่ได้ทำงานในรอบนี้
  a.nodes.find((n) => n.name === 'Record Delivery').parameters.jsCode += "\nconst x = $('Upload PDF').first();";
  assert.ok(validateFinal(a, wfs).some((e) => /อาจไม่ได้ทำงานในรอบนี้/.test(e)));
  const b = clone(fin); // ลืมวนกลับ
  b.connections['Update Run Delivered'].main[0] = [];
  assert.ok(validateFinal(b, wfs).some((e) => /Update Run Delivered/.test(e)));
  const c = clone(fin); // อ้างชื่อโหนดที่ไม่มี
  c.nodes.find((n) => n.name === 'Build Prompt').parameters.jsCode += "\n$('When Called by Main');";
  assert.ok(validateFinal(c, wfs).some((e) => /When Called by Main/.test(e)));
  const d = clone(fin); // แก้ตรรกะของโหนดเดิมเงียบ ๆ
  d.nodes.find((n) => n.name === 'Decide & Plan').parameters.jsCode += '\n// edit';
  assert.ok(validateFinal(d, wfs).some((e) => /Decide & Plan: พารามิเตอร์ต่าง/.test(e)));
  const e = clone(fin); // ตั้ง error workflow ชี้ไฟล์อื่น
  e.settings.errorWorkflow = 'is68ErrorWF00001';
  assert.ok(validateFinal(e, wfs).some((x) => /errorWorkflow/.test(x)));
});

test('ไหลครบทุกช่วงในไฟล์เดียว: Intake → GapEngine → Decide → Deliver ได้ผลเท่ากับชุด 5 ไฟล์ (กรณี A B C)', async () => {
  for (const cid of ['A', 'B', 'C']) {
    const caseDir = path.join(ROOT, 'synthetic', 'case_' + cid);
    const meta = JSON.parse(fs.readFileSync(path.join(caseDir, 'meta.json'), 'utf8'));
    const local = await runCase(caseDir, refs, { legacy: true });
    const ctx = { ...local.ctx, ocr_engine: 'fixture', ocr_engine_version: 'fixture' };
    const prep = { ctx, gap_input: { ctx, text: local.prep.text, text_sha256: local.prep.text_sha256 } };
    const sheetReqs = refs.requirements.filter((r) => r.role_id === meta.role_id).map((r) => Object.fromEntries(refs.sheetsCfg.tabs.ref_requirements.columns.map((c) => [c, r[c]])));
    const env = { MODEL_A_ID: 'a', MODEL_B_ID: 'b', MODEL_C_ID: 'c', OPENAI_API_KEY: 'k', ANTHROPIC_API_KEY: 'k', GOOGLE_API_KEY: 'k', RESEARCHER_EMAIL: 'researcher@mail.test', DRIVE_REPORT_FOLDER_ID: 'FOLDER' };
    const httpFor = (k) => { const mock = JSON.parse(fs.readFileSync(path.join(caseDir, 'mock_responses', k + '.json'), 'utf8')); let n = 0;
      return async (opts) => { n++; if (mock.simulate === 'http_error' && n <= mock.times) { const e = new Error('HTTP 429'); e.httpCode = '429'; throw e; }
        const txt = mock.text;
        if (/openai/.test(opts.url)) return { choices: [{ message: { content: txt }, finish_reason: 'stop' }], usage: { prompt_tokens: 1, completion_tokens: 1 }, model: 'mock-a' };
        if (/anthropic/.test(opts.url)) return { content: [{ type: 'text', text: txt }], usage: { input_tokens: 1, output_tokens: 1 }, stop_reason: 'end_turn', model: 'mock-b' };
        return { candidates: [{ content: { parts: [{ text: txt }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 }, modelVersion: 'mock-c' }; }; };
    const corpus = refs.corpus.map((c) => Object.fromEntries(refs.sheetsCfg.tabs.ref_corpus.columns.map((k) => [k, c[k]])));
    const maps = refs.mappings.map((m) => Object.fromEntries(refs.sheetsCfg.tabs.ref_mappings.columns.map((k) => [k, m[k]])));

    // ---- WF_Final_IS (ไฟล์เดียว)
    const gIn = await runNode(fin, 'GapEngine Input', { nodes: { 'Prepare Text & Mask PII': [prep] } });
    const built = await runNode(fin, 'Build Prompt', { nodes: { 'GapEngine Input': gIn, 'Read Requirements': sheetReqs } });
    const merged = [];
    for (const k of ['A', 'B', 'C']) merged.push(J(await runNode(fin, 'Call Model ' + k, { nodes: { 'Build Prompt': built }, env, helpers: { httpRequest: httpFor(k) } })));
    const asm = await runNode(fin, 'Assemble Model Results', { nodes: { 'Build Prompt': built, 'Wait for All Models': merged } });
    const dIn = await runNode(fin, 'Decide Input', { input: asm });
    const dec = await runNode(fin, 'Decide & Plan', { nodes: { 'Decide Input': dIn, 'Read Corpus': corpus, 'Read Mappings': maps } });
    const ret = await runNode(fin, 'Return Report Payload', { nodes: { 'Decide & Plan': dec } });
    const vIn = await runNode(fin, 'Deliver Input', { input: ret });
    const ren = await runNode(fin, 'Render Report', { nodes: { 'Deliver Input': vIn, 'Read Deliveries': [{}] }, env });

    // ---- ชุด 5 ไฟล์ (สัญญาข้อมูลผ่าน Execute Workflow)
    const b5 = await runNode(wfs.WF_SUB_GapEngine, 'Build Prompt', { nodes: { 'When Called by Main': [{ payload: prep.gap_input }], 'Read Requirements': sheetReqs } });
    const m5 = [];
    for (const k of ['A', 'B', 'C']) m5.push(J(await runNode(wfs.WF_SUB_GapEngine, 'Call Model ' + k, { nodes: { 'Build Prompt': b5 }, env, helpers: { httpRequest: httpFor(k) } })));
    const a5 = await runNode(wfs.WF_SUB_GapEngine, 'Assemble Model Results', { nodes: { 'Build Prompt': b5, 'Wait for All Models': m5 } });
    const d5 = await runNode(wfs.WF_SUB_Decide, 'Decide & Plan', { nodes: { 'When Called by Main': [{ payload: J(a5) }], 'Read Corpus': corpus, 'Read Mappings': maps } });
    const r5 = await runNode(wfs.WF_SUB_Decide, 'Return Report Payload', { nodes: { 'Decide & Plan': d5 } });
    const v5 = await runNode(wfs.WF_SUB_Deliver, 'Render Report', { nodes: { 'When Called by Main': [{ payload: J(r5) }], 'Read Deliveries': [{}] }, env });

    const strip = (x) => JSON.parse(JSON.stringify(x, (k, v) => (/_at$|^ts$|latency_ms/.test(k) ? undefined : v)));
    assert.deepEqual(strip(J(dIn).payload.requirements), strip(J(a5).requirements), cid + ': requirements ที่ส่งเข้า Decide ต้องเท่ากัน');
    assert.deepEqual(J(dec).decisions.map((d) => [d.requirement_id, d.final_status, d.evidence_char_start]), J(d5).decisions.map((d) => [d.requirement_id, d.final_status, d.evidence_char_start]), cid + ': decisions');
    assert.deepEqual(J(dec).plan_rows.map((p) => p.item_id), local.out.planRows.map((p) => p.item_id), cid + ': แผนเท่ากับ run_local');
    assert.deepEqual(J(dec).run_row.readiness_pct, J(d5).run_row.readiness_pct, cid + ': readiness');
    assert.equal(J(ren).run_id, J(v5).run_id);
    assert.equal(J(ren).not_yet_delivered, true);
  }
});

test('Record Delivery (ไฟล์เดียว): สำเร็จ / ล้มกลางทาง / เคยส่งแล้ว · ไม่หยิบผลของงานก่อนหน้า', async () => {
  const R = { run_id: 'RUN-20261001090000-aaaaaaaa', report_hash: 'h'.repeat(64), file_name: 'IS68076026_RUN.pdf', email_to: 'researcher@mail.test', prior: null };
  const ok = J(await runNode(fin, 'Collect Delivery Result', { input: [{}], nodes: { 'Upload PDF': [{ id: 'PDF1', webViewLink: 'https://drive.google.com/file/d/PDF1' }], 'Send Email': [{ id: 'MSG1' }] } }));
  const s = J(await runNode(fin, 'Record Delivery', { input: [ok], nodes: { 'Render Report': [R] } }));
  assert.equal(s.run_update.stage, 'delivered'); assert.equal(s.delivery_row.pdf_file_id, 'PDF1'); assert.equal(s.delivery_row.error_code, '');
  // งานก่อนหน้าส่งสำเร็จ (Upload PDF มีค่าค้าง) แต่งานนี้ Export PDF ล้ม → ต้องไม่ได้ PDF1
  const stale = { 'Render Report': [R], 'Upload PDF': [{ id: 'PDF1' }], 'Send Email': [{ id: 'MSG1' }] };
  const f = J(await runNode(fin, 'Record Delivery', { input: [{ error: { message: 'Export failed 500' } }], nodes: stale }));
  assert.equal(f.run_update.stage, 'failed'); assert.equal(f.delivery_row.pdf_file_id, ''); assert.equal(f.delivery_row.error_code, 'Export failed 500');
  // Upload PDF ล้ม (continueRegularOutput) · Send Email ล้ม · ลบไฟล์ชั่วคราวไม่ได้
  const up = J(await runNode(fin, 'Collect Delivery Result', { input: [{}], nodes: { 'Upload PDF': [{ error: { message: 'quota' } }], 'Send Email': [{ id: 'M' }] } }));
  assert.equal(J(await runNode(fin, 'Record Delivery', { input: [up], nodes: { 'Render Report': [R] } })).delivery_row.error_code, 'pdf_upload_failed');
  const em = J(await runNode(fin, 'Collect Delivery Result', { input: [{}], nodes: { 'Upload PDF': [{ id: 'P' }], 'Send Email': [{ error: { message: 'gmail' } }] } }));
  assert.equal(J(await runNode(fin, 'Record Delivery', { input: [em], nodes: { 'Render Report': [R] } })).delivery_row.error_code, 'email_failed');
  const dl = J(await runNode(fin, 'Collect Delivery Result', { input: [{ error: { message: '404' } }], nodes: { 'Upload PDF': [{ id: 'P' }], 'Send Email': [{ id: 'M' }] } }));
  const dr = J(await runNode(fin, 'Record Delivery', { input: [dl], nodes: { 'Render Report': [R] } }));
  assert.equal(dr.run_update.stage, 'delivered'); assert.equal(dr.delivery_row.error_code, 'temp_doc_delete_failed');
  // เคยส่งแล้ว
  const P = { ...R, prior: { pdf_file_id: 'OLD', web_view_link: 'https://drive.google.com/file/d/OLD' } };
  const re = J(await runNode(fin, 'Record Delivery', { input: [P], nodes: { 'Render Report': [P] } }));
  assert.equal(re.delivery_row.pdf_file_id, 'OLD'); assert.equal(re.delivery_row.error_code, 'reused_prior_delivery');
});

test('Error (ไฟล์เดียว): execution มีหลายงาน → ใช้งานล่าสุดของ Loop Over Runs ไม่ใช่งานแรก', async () => {
  const runData = {
    'Parse & Validate': [{ data: { main: [[{ json: { run_id: 'RUN-20261001090100-11111111' } }, { json: { run_id: 'RUN-20261001090100-22222222' } }]] } }],
    'Loop Over Runs': [{ data: { main: [[], [{ json: { run_id: 'RUN-20261001090100-11111111' } }]] } }, { data: { main: [[], [{ json: { run_id: 'RUN-20261001090100-22222222' } }]] } }],
  };
  const trig = [{ execution: { id: '90', error: { message: 'Request failed with status code 500' }, lastNodeExecuted: 'Append decisions' }, workflow: { name: 'WF_Final_IS' } }];
  const out = J(await runNode(fin, 'Classify Error', { nodes: { 'Error Trigger': trig, 'Get Failed Execution': [{ data: { resultData: { runData } } }] } }));
  assert.equal(out.run_update.run_id, 'RUN-20261001090100-22222222');
  // ข้อความที่มี [run_id=...] ยังมาก่อน
  const trig2 = [{ execution: { id: '91', error: { message: '[run_id=RUN-20261001090100-33333333] ocr_failed: x' } }, workflow: { name: 'WF_Final_IS' } }];
  const out2 = J(await runNode(fin, 'Classify Error', { nodes: { 'Error Trigger': trig2, 'Get Failed Execution': [{ data: { resultData: { runData } } }] } }));
  assert.equal(out2.run_update.run_id, 'RUN-20261001090100-33333333');
  assert.equal(out2.run_update.error_code, 'ocr_failed');
});
