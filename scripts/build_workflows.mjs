// build_workflows.mjs — สร้าง workflow ทั้งห้าตามตารางที่ 3.9 จากแหล่งเดียว (ห้ามแก้ JSON ด้วยมือ)
//   node scripts/build_workflows.mjs  -> workflows/WF_Final_IS.json (DEC-37 ไฟล์เดียวที่ใช้งาน) + workflows/manifest.json
//   ชุด 5 ไฟล์เดิม (DEC-30) สร้างในหน่วยความจำเพื่อตรวจเทียบ · เขียนไฟล์เฉพาะเมื่อสั่ง --legacy <โฟลเดอร์> (DEC-38)
// Code node ที่ต้องใช้ตรรกะฝัง engine/engine.js ทั้งไฟล์ระหว่างเครื่องหมาย ENGINE BEGIN/END (ตรวจทีละไบต์ใน validate_workflows.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ENGINE, loadRefs, refsForRun } from './lib/refs.mjs';

const refs = loadRefs();
const ENGINE_SRC = fs.readFileSync(path.join(ROOT, 'engine', 'engine.js'), 'utf8');
const ENGINE_SHA = ENGINE.sha256Hex(ENGINE_SRC);
const SRC = (f) => fs.readFileSync(path.join(ROOT, 'workflows', 'src', f), 'utf8');
export const IDS = { WF_Main_Intake: 'is68MainIntake01', WF_SUB_GapEngine: 'is68GapEngine001', WF_SUB_Decide: 'is68Decide000001', WF_SUB_Deliver: 'is68Deliver00001', WF_Error: 'is68ErrorWF00001' };
const CRED = {
  sa: { googleApi: { id: 'CRED_GOOGLE_SERVICE_ACCOUNT', name: 'IS68 Google Service Account' } },
  drive: { googleDriveOAuth2Api: { id: 'CRED_DRIVE_OAUTH2', name: 'IS68 Drive OAuth2 (researcher)' } },
  gmail: { gmailOAuth2: { id: 'CRED_GMAIL_OAUTH2', name: 'IS68 Gmail OAuth2 (researcher)' } },
  n8n: { n8nApi: { id: 'CRED_N8N_API', name: 'IS68 n8n API' } },
};
const roleRefs = refsForRun(refs, 'R01');
const CFG = {
  project: refs.projectCfg, models: refs.modelsCfg, sheets: refs.sheetsCfg, prompt: refs.prompt,
  roleIds: refs.roles.map((r) => r.role_id), roleNames: Object.fromEntries(refs.roles.map((r) => [r.role_id, r.role_name_th])),
  refs: { manifest_files: roleRefs.manifest_files, prompt_sha256: roleRefs.prompt_sha256, dataset_version: roleRefs.dataset_version, corpus_version: roleRefs.corpus_version, prompt_version: roleRefs.prompt_version, rules_version: roleRefs.rules_version },
  expected: { corpus_rows: refs.corpus.length, mapping_rows: refs.rawMappings.length },
};
const CFG_JSON = JSON.stringify(CFG);
export const ENGINE_BEGIN = '// ==== ENGINE BEGIN (engine/engine.js · ห้ามแก้ในนี้ แก้ที่ไฟล์ต้นทางแล้ว build ใหม่) ====\n';
export const ENGINE_END = '\n// ==== ENGINE END ====\n';
const code = (glueFile, withEngine = true) =>
  (withEngine ? ENGINE_BEGIN + ENGINE_SRC + ENGINE_END : '') + 'const CFG = ' + CFG_JSON + ';\n// ==== NODE GLUE: workflows/src/' + glueFile + ' ====\n' + SRC(glueFile);

let seq = 0;
const nid = (wf, n) => `${IDS[wf]}-${String(++seq).padStart(3, '0')}`;
const sheetDoc = { __rl: true, mode: 'id', value: '={{ $env.SHEET_ID }}' };
const sheetTab = (t) => ({ __rl: true, mode: 'name', value: t });
function mapCols(tab, prefix, cols) {
  const c = cols || refs.sheetsCfg.tabs[tab].columns;
  return { mappingMode: 'defineBelow', value: Object.fromEntries(c.map((k) => [k, `={{ ${prefix}${/^[A-Za-z_][\w]*$/.test(k) ? '.' + k : `["${k}"]`} }}`])), matchingColumns: [], schema: c.map((k) => ({ id: k, displayName: k, required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true })) };
}
const N = {
  code: (wf, name, glue, pos, extra = {}) => ({ id: nid(wf), name, type: 'n8n-nodes-base.code', typeVersion: 2, position: pos, parameters: { mode: extra.each ? 'runOnceForEachItem' : 'runOnceForAllItems', jsCode: code(glue, extra.engine !== false) }, ...(extra.executeOnce ? { executeOnce: true } : {}), ...(extra.alwaysOutputData ? { alwaysOutputData: true } : {}) }),
  sheetsRead: (wf, name, tab, pos, filter) => ({ id: nid(wf), name, type: 'n8n-nodes-base.googleSheets', typeVersion: 4.5, position: pos, executeOnce: true, alwaysOutputData: true,
    parameters: { authentication: 'serviceAccount', operation: 'read', documentId: sheetDoc, sheetName: sheetTab(tab), ...(filter ? { filtersUI: { values: [filter] } } : {}), options: {} }, credentials: CRED.sa }),
  sheetsWrite: (wf, name, tab, op, prefix, pos, extra = {}) => {
    const cols = extra.cols || refs.sheetsCfg.tabs[tab].columns;
    const columns = mapCols(tab, prefix, cols);
    if (op === 'appendOrUpdate') columns.matchingColumns = ['run_id'];
    return { id: nid(wf), name, type: 'n8n-nodes-base.googleSheets', typeVersion: 4.5, position: pos, ...(extra.executeOnce ? { executeOnce: true } : {}),
      parameters: { authentication: 'serviceAccount', operation: op, documentId: sheetDoc, sheetName: sheetTab(tab), columns, options: { cellFormat: 'RAW' } }, credentials: CRED.sa };
  },
  iff: (wf, name, field, pos) => ({ id: nid(wf), name, type: 'n8n-nodes-base.if', typeVersion: 2.2, position: pos,
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ id: 'c-' + field, leftValue: `={{ $json.${field} }}`, rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} } }),
  subTrigger: (wf, pos) => ({ id: nid(wf), name: 'When Called by Main', type: 'n8n-nodes-base.executeWorkflowTrigger', typeVersion: 1.1, position: pos, parameters: { inputSource: 'jsonExample', jsonExample: '{\n  "payload": {}\n}' } }),
  execWf: (wf, name, target, payloadExpr, pos) => ({ id: nid(wf), name, type: 'n8n-nodes-base.executeWorkflow', typeVersion: 1.2, position: pos,
    parameters: { workflowId: { __rl: true, mode: 'id', value: IDS[target], cachedResultName: target }, mode: 'each', workflowInputs: { mappingMode: 'defineBelow', value: { payload: payloadExpr }, matchingColumns: [], schema: [{ id: 'payload', displayName: 'payload', required: false, defaultMatch: false, display: true, type: 'object', canBeUsedToMatch: true }] }, options: { waitForSubWorkflow: true } } }),
  http: (wf, name, p, pos, extra = {}) => ({ id: nid(wf), name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: pos, ...(extra.onError ? { onError: extra.onError } : {}), parameters: p, ...(extra.credentials ? { credentials: extra.credentials } : {}) }),
};

function wf(name, nodes, connections, meta) {
  return { id: IDS[name], name, active: false, nodes, connections,
    settings: { executionOrder: 'v1', errorWorkflow: name === 'WF_Error' ? undefined : IDS.WF_Error, saveDataErrorExecution: 'all', saveDataSuccessExecution: 'all', timezone: 'Asia/Bangkok' },
    pinData: {}, tags: [{ name: 'IS68076026' }],
    meta: { is68: { engine_sha256: ENGINE_SHA, engine_version: ENGINE.ENGINE_VERSION, config_sha256: ENGINE.sha256Hex(CFG_JSON), built_by: 'scripts/build_workflows.mjs', spec: 'ตารางที่ 3.9', ...meta } } };
}
const link = (conns, from, to, outIdx = 0, inIdx = 0) => {
  conns[from] = conns[from] || { main: [] };
  while (conns[from].main.length <= outIdx) conns[from].main.push([]);
  conns[from].main[outIdx].push({ node: to, type: 'main', index: inIdx });
};

// ------------------------------------------------------------------ WF_Main_Intake (17)
function buildMain() {
  const W = 'WF_Main_Intake'; const c = {};
  const n = [
    { id: nid(W), name: 'Form Row Trigger', type: 'n8n-nodes-base.googleSheetsTrigger', typeVersion: 1, position: [0, 300], parameters: { authentication: 'serviceAccount', pollTimes: { item: [{ mode: 'everyMinute' }] }, documentId: sheetDoc, sheetName: sheetTab('form_responses'), event: 'rowAdded', options: {} }, credentials: CRED.sa },
    N.sheetsRead(W, 'Read Runs', 'runs', [220, 300]),
    N.code(W, 'Parse & Validate', 'main_parse_validate.js', [440, 300], { executeOnce: true }),
    N.iff(W, 'Consent & Input Valid?', 'valid', [660, 300]),
    N.iff(W, 'Not Duplicate?', 'not_duplicate', [880, 200]),
    N.sheetsWrite(W, 'Log Skipped', 'audit_log', 'append', '$json.audit', [1100, 480]),
    N.sheetsWrite(W, 'Create Run Row', 'runs', 'appendOrUpdate', "$('Parse & Validate').item.json.run_row", [1100, 200]),
    { id: nid(W), name: 'Download Resume', type: 'n8n-nodes-base.googleDrive', typeVersion: 3, position: [1320, 200], parameters: { authentication: 'serviceAccount', operation: 'download', fileId: { __rl: true, mode: 'id', value: "={{ $('Parse & Validate').item.json.file_id }}" }, options: { binaryPropertyName: 'data' } }, credentials: CRED.sa },
    N.code(W, 'Check File', 'main_check_file.js', [1540, 200], { each: true }),
    N.http(W, 'OCR Document AI', { method: 'POST', url: '=https://{{ $env.DOCAI_LOCATION }}-documentai.googleapis.com/v1/projects/{{ $env.GCP_PROJECT_ID }}/locations/{{ $env.DOCAI_LOCATION }}/processors/{{ $env.DOCAI_PROCESSOR_ID }}:process', authentication: 'predefinedCredentialType', nodeCredentialType: 'googleApi', sendBody: true, specifyBody: 'json', jsonBody: "={{ JSON.stringify({ rawDocument: { content: $json.pdf_b64, mimeType: 'application/pdf' }, skipHumanReview: true }) }}", options: { timeout: 120000 } }, [1760, 200], { onError: 'continueErrorOutput', credentials: CRED.sa }),
    N.http(W, 'OCR Fallback Local', { method: 'POST', url: '={{ $env.LOCAL_OCR_URL }}', sendBody: true, specifyBody: 'json', jsonBody: "={{ JSON.stringify({ pdf_b64: $('Check File').item.json.pdf_b64, run_id: $('Check File').item.json.ctx.run_id }) }}", options: { timeout: 180000 } }, [1980, 380]),
    N.code(W, 'Prepare Text & Mask PII', 'main_prepare_text.js', [2200, 200], { each: true }),
    N.http(W, 'Save Masked Text', { method: 'POST', url: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDriveOAuth2Api', sendHeaders: true, headerParameters: { parameters: [{ name: 'Content-Type', value: '={{ $json.masked_upload.content_type }}' }] }, sendBody: true, contentType: 'raw', rawContentType: '={{ $json.masked_upload.content_type }}', body: '={{ $json.masked_upload.body }}', options: {} }, [2420, 200], { credentials: CRED.drive }),
    N.sheetsWrite(W, 'Append OCR Result', 'ocr_results', 'append', "$('Prepare Text & Mask PII').item.json.ocr_row", [2640, 200]),
    N.execWf(W, 'Call GapEngine', 'WF_SUB_GapEngine', "={{ $('Prepare Text & Mask PII').item.json.gap_input }}", [2860, 200]),
    N.execWf(W, 'Call Decide', 'WF_SUB_Decide', '={{ $json }}', [3080, 200]),
    N.execWf(W, 'Call Deliver', 'WF_SUB_Deliver', '={{ $json }}', [3300, 200]),
  ];
  // Append OCR Result: เติม masked_text_file_id จากผลของ Save Masked Text
  const ocr = n.find((x) => x.name === 'Append OCR Result');
  ocr.parameters.columns.value.masked_text_file_id = '={{ $json.id }}';
  const L = (a, b, o, i) => link(c, a, b, o, i);
  L('Form Row Trigger', 'Read Runs'); L('Read Runs', 'Parse & Validate'); L('Parse & Validate', 'Consent & Input Valid?');
  L('Consent & Input Valid?', 'Not Duplicate?', 0); L('Consent & Input Valid?', 'Log Skipped', 1);
  L('Not Duplicate?', 'Create Run Row', 0); L('Not Duplicate?', 'Log Skipped', 1);
  L('Create Run Row', 'Download Resume'); L('Download Resume', 'Check File'); L('Check File', 'OCR Document AI');
  L('OCR Document AI', 'Prepare Text & Mask PII', 0); L('OCR Document AI', 'OCR Fallback Local', 1); L('OCR Fallback Local', 'Prepare Text & Mask PII');
  L('Prepare Text & Mask PII', 'Save Masked Text'); L('Save Masked Text', 'Append OCR Result'); L('Append OCR Result', 'Call GapEngine');
  L('Call GapEngine', 'Call Decide'); L('Call Decide', 'Call Deliver');
  return wf(W, n, c, { exclusive_fan_in: { 'Log Skipped': 'false-branch ของ IF สองตัว แต่ละ item ผ่านได้ทางเดียว', 'Prepare Text & Mask PII': 'สำเร็จของ OCR หลัก หรือผลของ OCR สำรอง (ไม่เกิดพร้อมกัน)' } });
}

// ------------------------------------------------------------------ WF_SUB_GapEngine (11)
function buildGap() {
  const W = 'WF_SUB_GapEngine'; const c = {};
  const n = [
    N.subTrigger(W, [0, 300]),
    N.sheetsRead(W, 'Read Requirements', 'ref_requirements', [220, 300], { lookupColumn: 'role_id', lookupValue: '={{ $json.payload.ctx.role_id }}' }),
    N.code(W, 'Build Prompt', 'gap_build_prompt.js', [440, 300], { executeOnce: true }),
    N.code(W, 'Call Model A', 'gap_call_model_A.js', [660, 100], { executeOnce: true }),
    N.code(W, 'Call Model B', 'gap_call_model_B.js', [660, 300], { executeOnce: true }),
    N.code(W, 'Call Model C', 'gap_call_model_C.js', [660, 500], { executeOnce: true }),
    { id: nid(W), name: 'Wait for All Models', type: 'n8n-nodes-base.merge', typeVersion: 3, position: [880, 300], parameters: { numberInputs: 3 } },
    N.code(W, 'To model_calls Rows', 'gap_to_calls.js', [1100, 300], { executeOnce: true, engine: false }),
    N.sheetsWrite(W, 'Append model_calls', 'model_calls', 'append', '$json', [1320, 300]),
    N.sheetsWrite(W, 'Audit Models Called', 'audit_log', 'append', '$json.audit', [1540, 300], { executeOnce: true }),
    N.code(W, 'Assemble Model Results', 'gap_assemble.js', [1760, 300], { executeOnce: true, engine: false }),
  ];
  const aud = n.find((x) => x.name === 'Audit Models Called');
  aud.parameters.columns.value = { ts: '={{ $now.toISO() }}', actor: 'WF_SUB_GapEngine', run_id: "={{ $('Build Prompt').first().json.ctx.run_id }}", event: 'models_called', detail: "={{ JSON.stringify($('Wait for All Models').all().map(i => ({ k: i.json.model_key, s: i.json.result.status, n: i.json.result.calls.length }))) }}" };
  const L = (a, b, o, i) => link(c, a, b, o, i);
  L('When Called by Main', 'Read Requirements'); L('Read Requirements', 'Build Prompt');
  L('Build Prompt', 'Call Model A'); L('Build Prompt', 'Call Model B'); L('Build Prompt', 'Call Model C');
  L('Call Model A', 'Wait for All Models', 0, 0); L('Call Model B', 'Wait for All Models', 0, 1); L('Call Model C', 'Wait for All Models', 0, 2);
  L('Wait for All Models', 'To model_calls Rows'); L('To model_calls Rows', 'Append model_calls'); L('Append model_calls', 'Audit Models Called'); L('Audit Models Called', 'Assemble Model Results');
  return wf(W, n, c, { exclusive_fan_in: {} });
}

// ------------------------------------------------------------------ WF_SUB_Decide (13)
function buildDecide() {
  const W = 'WF_SUB_Decide'; const c = {};
  const n = [
    N.subTrigger(W, [0, 300]),
    N.sheetsRead(W, 'Read Corpus', 'ref_corpus', [220, 300]),
    N.sheetsRead(W, 'Read Mappings', 'ref_mappings', [440, 300]),
    N.code(W, 'Decide & Plan', 'decide_run.js', [660, 300], { executeOnce: true }),
    // สาขาแผน (วางด้านบน จึงทำงานก่อนตามลำดับ v1) — ถ้าแผนว่างสาขานี้จบโดยไม่กระทบสาขาหลัก
    N.code(W, 'Plan Rows', 'decide_rows_plan.js', [880, 80], { executeOnce: true, engine: false }),
    N.sheetsWrite(W, 'Append plan_items', 'plan_items', 'append', '$json', [1100, 80]),
    // สาขาหลัก
    N.code(W, 'Findings Rows', 'decide_rows_findings.js', [880, 300], { executeOnce: true, engine: false }),
    N.sheetsWrite(W, 'Append findings', 'findings', 'append', '$json', [1100, 300]),
    N.code(W, 'Decision Rows', 'decide_rows_decisions.js', [1320, 300], { executeOnce: true, engine: false }),
    N.sheetsWrite(W, 'Append decisions', 'decisions', 'append', '$json', [1540, 300]),
    N.sheetsWrite(W, 'Update Run Ready', 'runs', 'appendOrUpdate', "$('Decide & Plan').first().json.run_row", [1760, 300], { executeOnce: true }),
    N.sheetsWrite(W, 'Audit Decided', 'audit_log', 'append', "$('Decide & Plan').first().json.audit", [1980, 300], { executeOnce: true }),
    N.code(W, 'Return Report Payload', 'decide_return.js', [2200, 300], { executeOnce: true, engine: false }),
  ];
  const L = (a, b, o, i) => link(c, a, b, o, i);
  L('When Called by Main', 'Read Corpus'); L('Read Corpus', 'Read Mappings'); L('Read Mappings', 'Decide & Plan');
  L('Decide & Plan', 'Plan Rows'); L('Plan Rows', 'Append plan_items');
  L('Decide & Plan', 'Findings Rows'); L('Findings Rows', 'Append findings'); L('Append findings', 'Decision Rows'); L('Decision Rows', 'Append decisions');
  L('Append decisions', 'Update Run Ready'); L('Update Run Ready', 'Audit Decided'); L('Audit Decided', 'Return Report Payload');
  return wf(W, n, c, { exclusive_fan_in: {}, branch_order_note: 'Plan Rows อยู่ด้านบน (y=80) จึงทำงานก่อนสาขาหลักตาม executionOrder v1 · Return Report Payload เป็นโหนดสุดท้าย' });
}

// ------------------------------------------------------------------ WF_SUB_Deliver (13)
function buildDeliver() {
  const W = 'WF_SUB_Deliver'; const c = {};
  const n = [
    N.subTrigger(W, [0, 300]),
    N.sheetsRead(W, 'Read Deliveries', 'deliveries', [220, 300]),
    N.code(W, 'Render Report', 'deliver_render.js', [440, 300], { executeOnce: true }),
    N.iff(W, 'Not Yet Delivered?', 'not_yet_delivered', [660, 300]),
    N.http(W, 'Upload as Google Doc', { method: 'POST', url: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDriveOAuth2Api', sendBody: true, contentType: 'raw', rawContentType: '={{ $json.doc_upload.content_type }}', body: '={{ $json.doc_upload.body }}', options: {} }, [880, 200], { onError: 'continueErrorOutput', credentials: CRED.drive }),
    N.http(W, 'Export PDF', { method: 'GET', url: '=https://www.googleapis.com/drive/v3/files/{{ $json.id }}/export?mimeType=application/pdf', authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDriveOAuth2Api', options: { response: { response: { responseFormat: 'file', outputPropertyName: 'data' } } } }, [1100, 200], { onError: 'continueErrorOutput', credentials: CRED.drive }),
    { id: nid(W), name: 'Upload PDF', type: 'n8n-nodes-base.googleDrive', typeVersion: 3, position: [1320, 100], onError: 'continueErrorOutput', parameters: { authentication: 'oAuth2', operation: 'upload', name: "={{ $('Render Report').item.json.file_name }}", driveId: { __rl: true, mode: 'list', value: 'My Drive' }, folderId: { __rl: true, mode: 'id', value: '={{ $env.DRIVE_REPORT_FOLDER_ID }}' }, inputDataFieldName: 'data', options: { simplifyOutput: false } }, credentials: { googleDriveOAuth2Api: CRED.drive.googleDriveOAuth2Api } },
    { id: nid(W), name: 'Send Email', type: 'n8n-nodes-base.gmail', typeVersion: 2.1, position: [1320, 300], onError: 'continueErrorOutput', webhookId: 'is68-gmail-deliver', parameters: { authentication: 'oAuth2', resource: 'message', operation: 'send', sendTo: "={{ $('Render Report').item.json.email_to }}", subject: "={{ $('Render Report').item.json.mail.subject }}", emailType: 'text', message: "={{ $('Render Report').item.json.mail.body }}", options: { appendAttribution: false, attachmentsUi: { attachmentsBinary: [{ property: 'data' }] } } }, credentials: CRED.gmail },
    { id: nid(W), name: 'Wait Upload & Email', type: 'n8n-nodes-base.merge', typeVersion: 3, position: [1540, 200], parameters: { mode: 'combine', combineBy: 'combineByPosition', options: {} } },
    N.http(W, 'Delete Temp Doc', { method: 'DELETE', url: "=https://www.googleapis.com/drive/v3/files/{{ $('Upload as Google Doc').item.json.id }}", authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDriveOAuth2Api', options: {} }, [1760, 200], { onError: 'continueRegularOutput', credentials: CRED.drive }),
    N.code(W, 'Record Delivery', 'deliver_record.js', [1980, 300], { executeOnce: true, engine: false }),
    N.sheetsWrite(W, 'Append deliveries', 'deliveries', 'append', '$json.delivery_row', [2200, 300]),
    N.sheetsWrite(W, 'Update Run Delivered', 'runs', 'appendOrUpdate', "$('Record Delivery').first().json.run_update", [2420, 300], { executeOnce: true, cols: ['run_id', 'updated_at', 'stage', 'pdf_file_id', 'email_status', 'error_code'] }),
  ];
  const L = (a, b, o, i) => link(c, a, b, o, i);
  L('When Called by Main', 'Read Deliveries'); L('Read Deliveries', 'Render Report'); L('Render Report', 'Not Yet Delivered?');
  L('Not Yet Delivered?', 'Upload as Google Doc', 0); L('Not Yet Delivered?', 'Record Delivery', 1);
  L('Upload as Google Doc', 'Export PDF', 0); L('Upload as Google Doc', 'Record Delivery', 1);
  L('Export PDF', 'Upload PDF', 0); L('Export PDF', 'Send Email', 0); L('Export PDF', 'Record Delivery', 1);
  L('Upload PDF', 'Wait Upload & Email', 0, 0); L('Upload PDF', 'Record Delivery', 1);
  L('Send Email', 'Wait Upload & Email', 0, 1); L('Send Email', 'Record Delivery', 1);
  L('Wait Upload & Email', 'Delete Temp Doc'); L('Delete Temp Doc', 'Record Delivery');
  L('Record Delivery', 'Append deliveries'); L('Append deliveries', 'Update Run Delivered');
  return wf(W, n, c, { exclusive_fan_in: { 'Record Delivery': 'เส้นทางสำเร็จ (หลัง Merge) หรือ error output ของโหนดส่งออกโหนดใดโหนดหนึ่ง หรือ false-branch ของ IF · Record Delivery ตั้ง executeOnce จึงบันทึกครั้งเดียว' } });
}

// ------------------------------------------------------------------ WF_Error (6)
function buildError() {
  const W = 'WF_Error'; const c = {};
  const n = [
    { id: nid(W), name: 'Error Trigger', type: 'n8n-nodes-base.errorTrigger', typeVersion: 1, position: [0, 300], parameters: {} },
    N.http(W, 'Get Failed Execution', { method: 'GET', url: '={{ $env.N8N_API_URL }}/api/v1/executions/{{ $json.execution.id }}?includeData=true', authentication: 'predefinedCredentialType', nodeCredentialType: 'n8nApi', options: {} }, [220, 300], { onError: 'continueRegularOutput', credentials: CRED.n8n }),
    N.code(W, 'Classify Error', 'error_classify.js', [440, 300], { executeOnce: true, engine: false }),
    N.sheetsWrite(W, 'Mark Run Failed', 'runs', 'appendOrUpdate', '$json.run_update', [660, 300], { cols: ['run_id', 'updated_at', 'stage', 'error_code'] }),
    N.sheetsWrite(W, 'Append Audit', 'audit_log', 'append', "$('Classify Error').first().json.audit", [880, 300], { executeOnce: true }),
    { id: nid(W), name: 'Notify Researcher', type: 'n8n-nodes-base.gmail', typeVersion: 2.1, position: [1100, 300], onError: 'continueRegularOutput', webhookId: 'is68-gmail-error', parameters: { authentication: 'oAuth2', resource: 'message', operation: 'send', sendTo: '={{ $env.RESEARCHER_EMAIL }}', subject: "={{ $('Classify Error').first().json.alert.subject }}", emailType: 'text', message: "={{ $('Classify Error').first().json.alert.body }}", options: { appendAttribution: false } }, credentials: CRED.gmail },
  ];
  const L = (a, b) => link(c, a, b);
  L('Error Trigger', 'Get Failed Execution'); L('Get Failed Execution', 'Classify Error'); L('Classify Error', 'Mark Run Failed'); L('Mark Run Failed', 'Append Audit'); L('Append Audit', 'Notify Researcher');
  return wf(W, n, c, { exclusive_fan_in: {} });
}

// ------------------------------------------------------------------ WF_Final_IS (DEC-37)
// รวม 5 workflow ข้างบนเป็น workflow เดียว โดยใช้โหนดและโค้ดชุดเดียวกัน (ไม่เขียนตรรกะใหม่):
//   · ตัด Execute Workflow 3 โหนด และ "When Called by Main" 3 โหนด → แทนด้วย Code node "<Stage> Input" ที่คืน { payload } รูปเดิม
//   · Loop Over Runs (batch 1) แทน mode=each ของ Execute Workflow: ทำทีละงาน งานละ 1 รอบ แล้ววนกลับจาก Update Run Delivered
//   · WF_Error เป็นสาขาหนึ่งของไฟล์ (Error Trigger) — n8n ใช้ workflow ที่มี Error Trigger เป็น error workflow ของตัวเองโดยปริยาย
//   · ปรับให้ปลอดภัยในลูป: Decide ส่งแถว findings เป็นสาขาข้าง (findings ว่างได้เมื่อโมเดลใช้ไม่ได้ทั้งหมด) ·
//     Deliver ให้ Upload PDF / Send Email ส่งผลทางขาปกติเข้า Merge แล้ว Collect Delivery Result → Record Delivery (ขาเข้าไม่ซ้อนกัน)
export const FINAL = { name: 'WF_Final_IS', id: 'is68FinalIS00001' };
export const STAGE_INPUT = { WF_SUB_GapEngine: 'GapEngine Input', WF_SUB_Decide: 'Decide Input', WF_SUB_Deliver: 'Deliver Input' };
const glueOnly = (f) => '// ==== NODE GLUE: workflows/src/' + f + ' ====\n' + SRC(f);
const STAGES = [
  { wf: 'WF_Main_Intake', title: '1 · Intake (เดิม WF_Main_Intake)', color: 7, body: 'Google Sheets Trigger → ตรวจความยินยอม/ซ้ำ → Loop Over Runs (ทีละงาน) → ดาวน์โหลด PDF → OCR (Document AI / สำรอง) → ปิดบัง PII → บันทึก ocr_results\n\nCredential: Google Service Account · Drive OAuth2\nenv: SHEET_ID · DOCAI_* · GCP_PROJECT_ID · LOCAL_OCR_URL · DRIVE_MASKED_TEXT_FOLDER_ID' },
  { wf: 'WF_SUB_GapEngine', title: '2 · GapEngine (เดิม WF_SUB_GapEngine)', color: 4, body: 'อ่านข้อกำหนด 30 ข้อของอาชีพ → prompt ชุดเดียว → เรียกโมเดล A/B/C พร้อมกัน (retry ≤ 2) → บันทึก model_calls\n\nenv: MODEL_A/B/C_ID · OPENAI/ANTHROPIC/GOOGLE_API_KEY' },
  { wf: 'WF_SUB_Decide', title: '3 · Decide (เดิม WF_SUB_Decide)', color: 5, body: 'กฎ R0→R2→R3→R1→R4 · สมการ 3.1–3.8 · แผนการเรียนรู้ → findings / decisions / plan_items → runs (ready)' },
  { wf: 'WF_SUB_Deliver', title: '4 · Deliver (เดิม WF_SUB_Deliver)', color: 6, body: 'Render HTML → Google Doc → PDF → อัปโหลด + ส่งอีเมล → ลบไฟล์ชั่วคราว → deliveries / runs (delivered) → วนกลับ Loop Over Runs\n\nCredential: Drive OAuth2 · Gmail OAuth2 · env: DRIVE_REPORT_FOLDER_ID · RESEARCHER_EMAIL' },
  { wf: 'WF_Error', title: '5 · Error (เดิม WF_Error)', color: 3, body: 'ทำงานเมื่อ execution ของ workflow นี้ล้มเหลว (production เท่านั้น) → หา run_id → runs = failed → audit_log → แจ้งผู้วิจัย\n\nไม่ต้องตั้ง Error Workflow ใน Settings · Credential: n8n API · env: N8N_API_URL' },
];

function buildFinal(parts) {
  const P = JSON.parse(JSON.stringify(parts));
  // ตำแหน่ง: สี่ช่วงเรียงซ้ายไปขวา Error อยู่ด้านล่าง · dx ของ Main เลื่อนโหนดตั้งแต่ x=1100 ไป 220 เพื่อวาง Loop Over Runs
  const shift = { WF_Main_Intake: (x) => (x >= 1100 ? x + 220 : x), WF_SUB_GapEngine: (x) => x + 3080, WF_SUB_Decide: (x) => x + 5060,
    WF_SUB_Deliver: (x) => (x >= 1980 ? x + 220 : x) + 7480, WF_Error: (x) => x };
  const dy = { WF_Error: 1000 };
  const drop = new Set(['Call GapEngine', 'Call Decide', 'Call Deliver', 'When Called by Main']);
  let k = 0; const fid = () => `${FINAL.id}-${String(++k).padStart(3, '0')}`;
  const nodes = []; const stageOf = {};
  for (const st of STAGES) {
    for (const n of P[st.wf].nodes) {
      if (drop.has(n.name)) continue;
      n.id = fid();
      n.position = [shift[st.wf](n.position[0]), n.position[1] + (dy[st.wf] || 0)];
      if (n.type === 'n8n-nodes-base.code' && STAGE_INPUT[st.wf]) {
        const js = n.parameters.jsCode; const cut = js.indexOf(ENGINE_END); const at = cut < 0 ? 0 : cut + ENGINE_END.length;
        n.parameters.jsCode = js.slice(0, at) + js.slice(at).split("$('When Called by Main')").join(`$('${STAGE_INPUT[st.wf]}')`);
      }
      nodes.push(n); stageOf[n.name] = st.wf;
    }
  }
  const byName = (nm) => nodes.find((n) => n.name === nm);
  const add = (n, wf) => { n.id = fid(); nodes.push(n); stageOf[n.name] = wf; return n; };
  // โหนดใหม่ 5 โหนด (glue อยู่ใน workflows/src/final_*.js)
  add({ id: '', name: 'Loop Over Runs', type: 'n8n-nodes-base.splitInBatches', typeVersion: 3, position: [1100, 200], parameters: { batchSize: 1, options: {} } }, 'WF_Main_Intake');
  const codeNode = (name, file, pos, wf, withCfg = false) => add({ id: '', name, type: 'n8n-nodes-base.code', typeVersion: 2, position: pos, executeOnce: true,
    parameters: { mode: 'runOnceForAllItems', jsCode: withCfg ? code(file, false) : glueOnly(file) } }, wf);
  codeNode('GapEngine Input', 'final_gap_input.js', [3080, 300], 'WF_SUB_GapEngine');
  codeNode('Decide Input', 'final_decide_input.js', [5060, 300], 'WF_SUB_Decide');
  codeNode('Deliver Input', 'final_deliver_input.js', [7480, 300], 'WF_SUB_Deliver');
  codeNode('Collect Delivery Result', 'final_deliver_collect.js', [7480 + 1980, 200], 'WF_SUB_Deliver');
  // Record Delivery: ใช้ glue ของ WF_Final_IS (อ่านจาก $input) · Upload PDF / Send Email ส่ง error ทางขาปกติเข้า Merge
  const rec = byName('Record Delivery'); rec.parameters.jsCode = glueOnly('final_deliver_record.js');
  for (const nm of ['Upload PDF', 'Send Email']) byName(nm).onError = 'continueRegularOutput';
  // Decide: findings เป็นสาขาข้าง (ตำแหน่ง y ระหว่างแผนกับสาขาหลัก จึงทำงานก่อนสาขาหลักตาม v1)
  for (const nm of ['Findings Rows', 'Append findings']) byName(nm).position[1] = 180;
  // sticky notes ต่อช่วง
  for (const st of STAGES) {
    const ps = nodes.filter((n) => stageOf[n.name] === st.wf).map((n) => n.position);
    const x0 = Math.min(...ps.map((p) => p[0])) - 40; const x1 = Math.max(...ps.map((p) => p[0])) + 140;
    const y0 = Math.min(...ps.map((p) => p[1])) - 220; const y1 = Math.max(...ps.map((p) => p[1])) + 160;
    nodes.push({ id: fid(), name: 'Note ' + st.title.split(' ')[0] + ' ' + st.wf.replace(/^WF_(SUB_)?/, ''), type: 'n8n-nodes-base.stickyNote', typeVersion: 1, position: [x0, y0],
      parameters: { content: `## ${st.title}\n${st.body}`, width: x1 - x0, height: y1 - y0, color: st.color } });
  }
  // connections: รวมของเดิม ตัดเส้นที่เกี่ยวกับโหนดที่ตัดทิ้ง แล้วต่อเส้นใหม่
  const c = {};
  const removed = new Set([...drop]);
  for (const st of STAGES) for (const [from, cc] of Object.entries(P[st.wf].connections)) {
    if (removed.has(from)) continue;
    cc.main.forEach((outs, oi) => (outs || []).forEach((t) => { if (!removed.has(t.node)) link(c, from, t.node, oi, t.index); }));
  }
  const unlink = (from, to, oi) => { const outs = c[from].main[oi]; const i = outs.findIndex((t) => t.node === to); if (i < 0) throw new Error(`unlink ${from}->${to}`); outs.splice(i, 1); };
  const L = (a, b, o, i) => link(c, a, b, o, i);
  // Main: Not Duplicate? → Loop Over Runs → (loop) Create Run Row
  unlink('Not Duplicate?', 'Create Run Row', 0); L('Not Duplicate?', 'Loop Over Runs', 0); L('Loop Over Runs', 'Create Run Row', 1);
  // Main → GapEngine → Decide → Deliver
  L('Append OCR Result', 'GapEngine Input'); L('GapEngine Input', 'Read Requirements');
  L('Assemble Model Results', 'Decide Input'); L('Decide Input', 'Read Corpus');
  L('Return Report Payload', 'Deliver Input'); L('Deliver Input', 'Read Deliveries');
  // Decide: Decide & Plan → Decision Rows (สาขาหลัก) · Append findings ไม่ต่อไป Decision Rows แล้ว
  unlink('Append findings', 'Decision Rows', 0); L('Decide & Plan', 'Decision Rows');
  // Deliver: Upload PDF / Send Email ไม่มี error output · Delete Temp Doc → Collect Delivery Result → Record Delivery
  for (const nm of ['Upload PDF', 'Send Email']) { c[nm].main = c[nm].main.slice(0, 1); }
  unlink('Delete Temp Doc', 'Record Delivery', 0); L('Delete Temp Doc', 'Collect Delivery Result'); L('Collect Delivery Result', 'Record Delivery');
  // วนกลับ
  L('Update Run Delivered', 'Loop Over Runs');
  for (const v of Object.values(c)) while (v.main.length && v.main[v.main.length - 1].length === 0 && v.main.length > 1) v.main.pop();

  const w = wf('WF_Error', nodes, c, {
    source_workflows: Object.fromEntries(STAGES.map((s) => [s.wf, IDS[s.wf]])),
    stage_of_node: stageOf,
    exclusive_fan_in: {
      'Log Skipped': 'false-branch ของ IF สองตัว แต่ละ item ผ่านได้ทางเดียว',
      'Prepare Text & Mask PII': 'สำเร็จของ OCR หลัก หรือผลของ OCR สำรอง (ไม่เกิดพร้อมกัน)',
      'Loop Over Runs': 'ขาเข้าครั้งแรกจาก Not Duplicate? และขาวนกลับจาก Update Run Delivered (คนละรอบ)',
      'Record Delivery': 'false-branch ของ Not Yet Delivered? หรือ error output ของ Upload as Google Doc / Export PDF หรือ Collect Delivery Result (เส้นทางสำเร็จ) — ไม่เกิดพร้อมกัน',
    },
    loop: { node: 'Loop Over Runs', batch_size: 1, back_edge_from: 'Update Run Delivered' },
    spec: 'ตารางที่ 3.9 (5 ช่วงในไฟล์เดียว · DEC-37)',
  });
  w.id = FINAL.id; w.name = FINAL.name;
  delete w.settings.errorWorkflow; // ใช้ Error Trigger ในไฟล์เดียวกัน
  w.meta.is68.built_by = 'scripts/build_workflows.mjs#buildFinal';
  return w;
}

export { buildFinal };
export function buildAll() {
  seq = 0;
  return { WF_Error: buildError(), WF_SUB_GapEngine: buildGap(), WF_SUB_Decide: buildDecide(), WF_SUB_Deliver: buildDeliver(), WF_Main_Intake: buildMain() };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // DEC-38: เขียนเฉพาะ workflows/WF_Final_IS.json (ไฟล์ที่ใช้งาน) · ชุด 5 ไฟล์เดิมสร้างในหน่วยความจำเพื่อตรวจเทียบเท่านั้น
  //   ต้องการไฟล์ชุด 5 ไฟล์เพื่อย้อนกลับ: node scripts/build_workflows.mjs --legacy <โฟลเดอร์ปลายทาง นอก workflows/>
  const all = buildAll();
  const li = process.argv.indexOf('--legacy');
  const legacyDir = li > 0 ? path.resolve(process.argv[li + 1] || '') : null;
  if (legacyDir && path.resolve(legacyDir) === path.join(ROOT, 'workflows')) throw new Error('--legacy ห้ามเขียนลง workflows/ (DEC-38 กันนำเข้าผิดไฟล์)');
  const fin = buildFinal(all);
  const ftxt = JSON.stringify(fin, null, 2) + '\n';
  fs.writeFileSync(path.join(ROOT, 'workflows', FINAL.name + '.json'), ftxt);
  const real = fin.nodes.filter((n) => n.type !== 'n8n-nodes-base.stickyNote').length;
  const man = { built_at: new Date().toISOString(), engine_sha256: ENGINE_SHA, engine_version: ENGINE.ENGINE_VERSION, n8n_version: '2.39.9', node_version: '24',
    import: FINAL.name + '.json',
    note: 'นำเข้าไฟล์นี้ไฟล์เดียว: n8n import:workflow --input=workflows/WF_Final_IS.json (DEC-37) · ชุด 5 ไฟล์เดิมเลิกใช้และย้ายไป archive แล้ว (DEC-38)',
    workflow: { decision: 'DEC-37', file: FINAL.name + '.json', id: fin.id, nodes: real, sticky_notes: fin.nodes.length - real, sha256: ENGINE.sha256Hex(ftxt) },
    legacy_5wf: { status: 'ไม่ใช้ · ห้ามนำเข้าพร้อม WF_Final_IS', decision: 'DEC-30 → DEC-38', archived_copy: 'archive/01OCT26/workflows_5wf_DEC-30/',
      rebuild: 'node scripts/build_workflows.mjs --legacy <โฟลเดอร์>', import_order: ['WF_Error', 'WF_SUB_GapEngine', 'WF_SUB_Decide', 'WF_SUB_Deliver', 'WF_Main_Intake'], workflows: {} } };
  for (const [k, w] of Object.entries(all)) {
    const txt = JSON.stringify(w, null, 2) + '\n';
    man.legacy_5wf.workflows[k] = { id: w.id, nodes: w.nodes.length, sha256: ENGINE.sha256Hex(txt) };
    if (legacyDir) { fs.mkdirSync(legacyDir, { recursive: true }); fs.writeFileSync(path.join(legacyDir, k + '.json'), txt); console.log(`legacy ${k.padEnd(18)} ${w.nodes.length} nodes → ${legacyDir}`); }
  }
  console.log(`${FINAL.name.padEnd(18)} ${real} nodes + ${fin.nodes.length - real} sticky notes`);
  fs.writeFileSync(path.join(ROOT, 'workflows', 'manifest.json'), JSON.stringify(man, null, 2) + '\n');
  console.log('engine_sha256', ENGINE_SHA);
}
