// WF_IS68076026 (DEC-42): ตัวตรวจโครงสร้าง + รัน Code node ใน sandbox · ภาคผนวก ข ของ Prompt_Report v2.0 (traceability ใน evidence/WF_analysis.md)
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import fs from 'node:fs';
import { ROOT, loadRefs } from '../scripts/lib/refs.mjs';
import { loadSingle, validateSingle, EXPECTED_SINGLE_NODES } from '../scripts/validate_workflows.mjs';
import { runCase } from '../scripts/run_local.mjs';

const refs = loadRefs();
const one = loadSingle();
const clone = (o) => JSON.parse(JSON.stringify(o));
async function runNode(w, name, { input = [], nodes = {}, env = {}, helpers = {}, itemIndex = 0 } = {}) {
  const n = w.nodes.find((x) => x.name === name);
  if (!n) throw new Error('ไม่มีโหนด ' + name);
  const items = input.map((j) => (j && (j.json || j.binary) ? { json: j.json || {}, binary: j.binary } : { json: j }));
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
const J = (r) => (Array.isArray(r) ? r[0].json : r.json);
const cols = refs.sheetsCfg.tabs.form_responses.columns;
const formRow = (i, consent = 'ยินยอม') => ({ [cols[0]]: `2026-10-01 09:0${i}:00`, [cols[1]]: `p${i}@mail.test`, [cols[2]]: `https://drive.google.com/open?id=1FileIdForTesting00000000000000${i}`, [cols[3]]: 'R01 วิศวกรซอฟต์แวร์', [cols[4]]: '6', [cols[5]]: '10', [cols[6]]: 'ทั้งสองประเภท', [cols[7]]: consent });
const ENV = { MODEL_A_ID: 'a', MODEL_B_ID: 'b', MODEL_C_ID: 'c', OPENAI_API_KEY: 'k', ANTHROPIC_API_KEY: 'k', GOOGLE_API_KEY: 'k', RESEARCHER_EMAIL: 'researcher@mail.test', DRIVE_REPORT_FOLDER_ID: 'FOLDER', DRIVE_MASKED_TEXT_FOLDER_ID: 'MASK' };
const corpusSheet = () => refs.corpus.map((c) => Object.fromEntries(refs.sheetsCfg.tabs.ref_corpus.columns.map((k) => [k, c[k]])));
const mapsSheet = () => refs.mappings.map((m) => Object.fromEntries(refs.sheetsCfg.tabs.ref_mappings.columns.map((k) => [k, m[k]])));

test(`WF_IS68076026 ผ่านตัวตรวจ: ${EXPECTED_SINGLE_NODES} โหนด · 7 ช่วง · ไม่มี Execute Workflow · ไม่อ้างค่าข้ามรอบ · CFG ตรง config/`, () => {
  assert.deepEqual(validateSingle(one), []);
  assert.equal(one.settings.errorWorkflow, undefined);
  assert.deepEqual(one.meta.is68.sections.map((s) => s.th), ['รับข้อมูล', 'อ่านและปิดบังข้อมูล', 'วิเคราะห์ 3 โมเดล', 'ตรวจและรวมผล', 'จัดแผน', 'ส่งรายงาน', 'บันทึกและข้อผิดพลาด']);
});

test('ตัวตรวจจับข้อผิดพลาดหลังแก้ workflow ได้', () => {
  const a = clone(one); a.nodes.find((n) => n.name === 'Build Delivery Record').parameters.jsCode += "\nconst x = $('Upload Report PDF').first();";
  assert.ok(validateSingle(a).some((e) => /อาจไม่ได้ทำงานในรอบนี้/.test(e)));
  const b = clone(one); b.connections['Mark Run Delivered'].main[0] = [];
  assert.ok(validateSingle(b).some((e) => /Mark Run Delivered/.test(e)));
  const c = clone(one); c.nodes.find((n) => n.name === 'Build Prompt').parameters.jsCode += "\n$('When Called by Main');";
  assert.ok(validateSingle(c).some((e) => /When Called by Main/.test(e)));
  const d = clone(one); const ar = d.nodes.find((n) => n.name === 'Apply Rules R0-R4'); ar.parameters.jsCode = ar.parameters.jsCode.replace('"theta":0.15', '"theta":0.3');
  assert.ok(validateSingle(d).some((e) => /CFG.project ไม่ตรง/.test(e)));
  const e = clone(one); e.nodes.push({ ...clone(one.nodes[0]), name: 'Call Sub', type: 'n8n-nodes-base.executeWorkflow', parameters: { mode: 'each', options: { waitForSubWorkflow: true }, workflowId: { value: 'x' } } });
  assert.ok(validateSingle(e).some((x) => /เรียกข้าม workflow/.test(x)));
});

function httpFor(caseDir, k, failAll = false) {
  const mock = JSON.parse(fs.readFileSync(path.join(caseDir, 'mock_responses', k + '.json'), 'utf8')); let n = 0;
  return async (opts) => { n++;
    if (failAll || (mock.simulate === 'http_error' && n <= mock.times)) { const e = new Error('HTTP 429'); e.httpCode = '429'; throw e; }
    const txt = mock.text;
    if (/openai/.test(opts.url)) return { choices: [{ message: { content: txt }, finish_reason: 'stop' }], usage: { prompt_tokens: 1, completion_tokens: 1 }, model: 'mock-a' };
    if (/anthropic/.test(opts.url)) return { content: [{ type: 'text', text: txt }], usage: { input_tokens: 1, output_tokens: 1 }, stop_reason: 'end_turn', model: 'mock-b' };
    return { candidates: [{ content: { parts: [{ text: txt }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 }, modelVersion: 'mock-c' }; };
}
// เดินช่วง 3 → 6 ด้วยโค้ดจริงของโหนด
async function flow(cid, { failAll = false } = {}) {
  const caseDir = path.join(ROOT, 'synthetic', 'case_' + cid);
  const meta = JSON.parse(fs.readFileSync(path.join(caseDir, 'meta.json'), 'utf8'));
  const local = await runCase(caseDir, refs);
  const ctx = { ...local.ctx, ocr_engine: 'fixture', ocr_engine_version: 'fixture' };
  const mask = { ctx, gap_input: { ctx, text: local.prep.text, text_sha256: local.prep.text_sha256 } };
  const reqs = refs.requirements.filter((r) => r.role_id === meta.role_id).map((r) => Object.fromEntries(refs.sheetsCfg.tabs.ref_requirements.columns.map((c) => [c, r[c]])));
  const sIn = await runNode(one, 'Start Analysis', { nodes: { 'Mask Personal Data': [mask] } });
  const built = await runNode(one, 'Build Prompt', { nodes: { 'Start Analysis': sIn, 'Load Requirements': reqs } });
  const merged = [];
  for (const k of ['A', 'B', 'C']) merged.push(J(await runNode(one, 'Call Model ' + k, { nodes: { 'Build Prompt': built }, env: ENV, helpers: { httpRequest: httpFor(caseDir, k, failAll) } })));
  const calls = await runNode(one, 'Build Model Call Rows', { nodes: { 'Wait for All Models': merged } });
  const col = await runNode(one, 'Collect Model Results', { nodes: { 'Build Prompt': built, 'Wait for All Models': merged } });
  const eIn = await runNode(one, 'Start Evidence Check', { input: col });
  const rules = await runNode(one, 'Apply Rules R0-R4', { nodes: { 'Start Evidence Check': eIn } });
  const fRows = await runNode(one, 'Build Finding Rows', { nodes: { 'Apply Rules R0-R4': rules } });
  const dRows = await runNode(one, 'Build Decision Rows', { nodes: { 'Apply Rules R0-R4': rules } });
  const plan = await runNode(one, 'Build Learning Plan', { nodes: { 'Apply Rules R0-R4': rules, 'Load Corpus': corpusSheet(), 'Load Mappings': mapsSheet() } });
  const pRows = await runNode(one, 'Build Plan Rows', { nodes: { 'Build Learning Plan': plan } });
  const frz = await runNode(one, 'Freeze Report Payload', { nodes: { 'Build Learning Plan': plan } });
  const dIn = await runNode(one, 'Start Delivery', { input: frz });
  const ren = await runNode(one, 'Render Thai Report', { nodes: { 'Start Delivery': dIn, 'Read Deliveries Sheet': [{}] }, env: ENV });
  return { local, calls, rules: J(rules), fRows, dRows, plan: J(plan), pRows, frz: J(frz), ren: J(ren) };
}

test('เรซูเมสังเคราะห์ A B C: ผลของ workflow เดียวตรงกับ engine (run_local) ทุกข้อ', async () => {
  for (const cid of ['A', 'B', 'C']) {
    const r = await flow(cid);
    const o = r.local.out;
    assert.deepEqual(r.dRows.map((x) => [x.json.requirement_id, x.json.final_status, x.json.evidence_char_start]), o.eval.decisions.map((d) => [d.requirement_id, d.final_status, d.evidence_char_start]), cid + ': decisions');
    assert.equal(r.fRows.length, o.eval.findings.length, cid + ': findings');
    assert.deepEqual(r.pRows.map((x) => x.json.item_id), o.planRows.map((p) => p.item_id), cid + ': แผน');
    assert.equal(r.plan.run_row.readiness_pct, o.eval.scores.readiness_pct, cid + ': R');
    assert.equal(r.plan.run_row.stage, 'ready');
    assert.deepEqual(r.frz.report_payload.versions, { dataset: refs.manifest.dataset_version, corpus: refs.manifest.corpus_version, prompt: 'analyst_v1.0', rules: 'RULES-IS68076026-v1.0' }, cid + ': freezeReport.versions');
    assert.equal(r.ren.not_yet_delivered, true);
    assert.ok(r.calls.length >= 3, cid + ': model_calls ทุกครั้ง');
  }
});

test('โมเดลล้มครบสามตัว: ทุกข้อ abstained · findings ว่าง (สาขาข้างจบ) · สาขาหลักเดินต่อจนสร้างรายงานได้', async () => {
  const r = await flow('A', { failAll: true });
  assert.equal(r.rules.eval.m, 0);
  assert.equal(r.fRows.length, 0);
  assert.ok(r.dRows.every((x) => x.json.final_status === 'abstained'));
  assert.equal(r.plan.run_row.readiness_pct, 'N/A');
  assert.equal(r.pRows.length, 0);
  assert.equal(r.calls.length, 9, '3 โมเดล x (1 + เรียกซ้ำ 2) บันทึกครบ');
  assert.ok(/ไม่พบช่องว่าง/.test(r.frz.report_payload.plan.notice));
  assert.equal(r.ren.not_yet_delivered, true);
});

test('ฟอร์มสองแถวในการ poll เดียว: ได้สองงานแยก run_id · แถวซ้ำในรอบเดียวกันถูกกัน · ไม่ให้ความยินยอมถูกปฏิเสธ', async () => {
  const two = await runNode(one, 'Validate Form Rows', { nodes: { 'Watch Form Responses': [formRow(1), formRow(2)], 'Read Runs Sheet': [{}] } });
  assert.equal(two.length, 2);
  assert.equal(new Set(two.map((o) => o.json.run_id)).size, 2);
  assert.deepEqual(two.map((o) => [o.json.valid, o.json.not_duplicate]), [[true, true], [true, true]]);
  const dup = await runNode(one, 'Validate Form Rows', { nodes: { 'Watch Form Responses': [formRow(1), formRow(1)], 'Read Runs Sheet': [{}] } });
  assert.deepEqual(dup.map((o) => o.json.not_duplicate), [true, false]);
  const no = await runNode(one, 'Validate Form Rows', { nodes: { 'Watch Form Responses': [formRow(3, 'ไม่ยินยอม')], 'Read Runs Sheet': [{}] } });
  assert.equal(no[0].json.valid, false); assert.match(no[0].json.reject_reason, /consent_not_given/); assert.equal(no[0].json.audit.event, 'rejected_input');
  // ลูปทำทีละงาน: splitInBatches batch 1 ขา loop → Create Run Row · วนกลับจาก Mark Run Delivered
  const loop = one.nodes.find((n) => n.name === 'Loop Over Requests');
  assert.equal(loop.parameters.batchSize, 1);
  assert.equal(one.connections['Mark Run Delivered'].main[0][0].node, 'Loop Over Requests');
});

test('ไฟล์เกินขนาด / เกินหน้า / ไม่ใช่ PDF ถูกปฏิเสธพร้อม run_id และรหัสสาเหตุ', async () => {
  const ctx = { run_id: 'RUN-20261001090000-aaaaaaaa' };
  const mk = (buf, mimeType = 'application/pdf') => ({ input: [{ json: {}, binary: { data: { mimeType } } }], nodes: { 'Validate Form Rows': [ctx] }, helpers: { getBinaryDataBuffer: async () => buf } });
  const big = Buffer.concat([Buffer.from('%PDF-1.7\n/Type /Page\n'), Buffer.alloc(10485761 - 20)]);
  await assert.rejects(runNode(one, 'Check PDF File', mk(big)), /\[run_id=RUN-20261001090000-aaaaaaaa\] file_too_large/);
  const pages = Buffer.from('%PDF-1.7\n' + '/Type /Page\n'.repeat(6));
  await assert.rejects(runNode(one, 'Check PDF File', mk(pages)), /too_many_pages: bytes=\d+ pages=6/);
  await assert.rejects(runNode(one, 'Check PDF File', mk(Buffer.from('hello'), 'text/plain')), /file_not_pdf/);
  const ok = await runNode(one, 'Check PDF File', mk(Buffer.from('%PDF-1.7\n/Type /Page\n')));
  assert.equal(ok.json.ctx.page_count, 1); assert.ok(ok.binary.data, 'ส่ง binary ต่อให้ Extract Text Layer');
});

test('อ่านข้อความ: มีชั้นข้อความ → ใช้ชั้นข้อความ · ไม่มี/อ่านไม่ได้ → ส่ง Document AI · ปิดบังข้อมูลส่วนบุคคลก่อนส่งโมเดล', async () => {
  const base = { ctx: { run_id: 'RUN-20261001090000-bbbbbbbb', page_count: 1 }, pdf_b64: 'JVBERi0=' };
  const text = 'Software engineer. Contact me at someone@mail.test or 081-234-5678. '.repeat(5);
  const yes = await runNode(one, 'Choose Text Source', { input: [{ text }], nodes: { 'Check PDF File': [base] } });
  assert.equal(yes.json.use_text_layer, true); assert.equal(yes.json.engine, 'pdf_text_layer');
  const no = await runNode(one, 'Choose Text Source', { input: [{ text: '  ' }], nodes: { 'Check PDF File': [base] } });
  assert.equal(no.json.use_text_layer, false); assert.equal(no.json.pdf_b64, base.pdf_b64);
  const err = await runNode(one, 'Choose Text Source', { input: [{ error: { message: 'bad xref' } }], nodes: { 'Check PDF File': [base] } });
  assert.equal(err.json.use_text_layer, false);
  const m = await runNode(one, 'Mask Personal Data', { input: [yes.json], nodes: { 'Check PDF File': [base] }, env: ENV });
  assert.equal(m.json.ocr_row.engine, 'pdf_text_layer');
  assert.ok(!/someone@mail\.test|081-234-5678/.test(m.json.gap_input.text));
  assert.match(m.json.ocr_row.text_sha256, /^[0-9a-f]{64}$/);
  assert.ok(m.json.masked_upload.body.includes('"parents":["MASK"]'), 'เก็บข้อความหลังปิดบังในโฟลเดอร์ส่วนตัว');
});

test('ส่งรายงาน: อัปโหลด PDF ล้มแต่อีเมลส่งสำเร็จ → delivered ครั้งเดียว · กรณีอื่นบันทึกถูก · ไม่หยิบผลของงานก่อนหน้า', async () => {
  const R = { run_id: 'RUN-20261001090000-cccccccc', report_hash: 'h'.repeat(64), file_name: 'IS68076026_RUN.pdf', email_to: 'researcher@mail.test', prior: null };
  const rec = async (collectInput, up, em) => {
    const col = J(await runNode(one, 'Collect Delivery Result', { input: [collectInput], nodes: { 'Upload Report PDF': [up], 'Send Report Email': [em] } }));
    return J(await runNode(one, 'Build Delivery Record', { input: [col], nodes: { 'Render Thai Report': [R] } }));
  };
  const ok = await rec({}, { id: 'PDF1', webViewLink: 'https://drive.google.com/file/d/PDF1' }, { id: 'MSG1' });
  assert.deepEqual([ok.run_update.stage, ok.delivery_row.pdf_file_id, ok.delivery_row.error_code], ['delivered', 'PDF1', '']);
  const upFail = await rec({}, { error: { message: 'quota' } }, { id: 'MSG2' });
  assert.deepEqual([upFail.run_update.stage, upFail.delivery_row.email_status, upFail.delivery_row.error_code], ['delivered', 'sent', 'pdf_upload_failed']);
  const emFail = await rec({}, { id: 'P' }, { error: { message: 'gmail' } });
  assert.deepEqual([emFail.run_update.stage, emFail.delivery_row.error_code], ['failed', 'email_failed']);
  const delFail = await rec({ error: { message: '404' } }, { id: 'P' }, { id: 'M' });
  assert.deepEqual([delFail.run_update.stage, delFail.delivery_row.error_code], ['delivered', 'temp_doc_delete_failed']);
  // งานก่อนหน้าส่งสำเร็จ (โหนด Upload/Send มีค่าค้าง) แต่งานนี้ Export ล้ม → ต้องไม่ได้ PDF ของงานก่อน
  const stale = J(await runNode(one, 'Build Delivery Record', { input: [{ error: { message: 'Export failed 500' } }], nodes: { 'Render Thai Report': [R], 'Upload Report PDF': [{ id: 'PDF1' }], 'Send Report Email': [{ id: 'MSG1' }] } }));
  assert.deepEqual([stale.run_update.stage, stale.delivery_row.pdf_file_id], ['failed', '']);
  const P = { ...R, prior: { pdf_file_id: 'OLD', web_view_link: 'https://drive.google.com/file/d/OLD' } };
  const again = J(await runNode(one, 'Build Delivery Record', { input: [P], nodes: { 'Render Thai Report': [P] } }));
  assert.equal(again.delivery_row.error_code, 'reused_prior_delivery');
  // บันทึกครั้งเดียว: ทุกเส้นทางเข้าที่ Build Delivery Record (executeOnce) → Record Delivery → Mark Run Delivered
  const bdr = one.nodes.find((n) => n.name === 'Build Delivery Record');
  assert.equal(bdr.executeOnce, true);
  assert.deepEqual(one.connections['Build Delivery Record'].main[0].map((t) => t.node), ['Record Delivery']);
});

test('ล้มกลางลูป: Error Trigger ในไฟล์เดียวกันหา run_id ของงานล่าสุด · ทำเครื่องหมาย failed · แจ้งผู้วิจัย', async () => {
  const runData = { 'Loop Over Requests': [{ data: { main: [[], [{ json: { run_id: 'RUN-20261001090100-11111111' } }]] } }, { data: { main: [[], [{ json: { run_id: 'RUN-20261001090100-22222222' } }]] } }] };
  const trig = [{ execution: { id: '90', error: { message: 'Request failed with status code 500' }, lastNodeExecuted: 'Record Decisions' }, workflow: { name: 'WF_IS68076026' } }];
  const out = J(await runNode(one, 'Classify Error', { nodes: { 'Catch Workflow Error': trig, 'Get Failed Execution': [{ data: { resultData: { runData } } }] } }));
  assert.equal(out.run_update.run_id, 'RUN-20261001090100-22222222');
  assert.equal(out.run_update.stage, 'failed');
  assert.match(out.alert.subject, /\[IS68076026\]\[ERROR\] RUN-20261001090100-22222222/);
  const t2 = [{ execution: { id: '91', error: { message: '[run_id=RUN-20261001090100-33333333] file_too_large: bytes=1' } }, workflow: { name: 'WF_IS68076026' } }];
  const o2 = J(await runNode(one, 'Classify Error', { nodes: { 'Catch Workflow Error': t2, 'Get Failed Execution': [{}] } }));
  assert.deepEqual([o2.run_update.run_id, o2.run_update.error_code], ['RUN-20261001090100-33333333', 'file_too_large']);
  assert.deepEqual(one.connections['Catch Workflow Error'].main[0].map((t) => t.node), ['Get Failed Execution']);
  assert.deepEqual(one.connections['Log Error'].main[0].map((t) => t.node), ['Notify Researcher']);
});
