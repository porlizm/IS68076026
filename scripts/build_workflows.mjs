// build_workflows.mjs — สร้าง workflow ทั้งห้าตามตารางที่ 3.9 จากแหล่งเดียว (ห้ามแก้ JSON ด้วยมือ)
//   node scripts/build_workflows.mjs  -> workflows/WF_*.json + workflows/manifest.json
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

export function buildAll() {
  seq = 0;
  return { WF_Error: buildError(), WF_SUB_GapEngine: buildGap(), WF_SUB_Decide: buildDecide(), WF_SUB_Deliver: buildDeliver(), WF_Main_Intake: buildMain() };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const all = buildAll();
  const man = { built_at: new Date().toISOString(), engine_sha256: ENGINE_SHA, engine_version: ENGINE.ENGINE_VERSION, n8n_version: '2.39.9', node_version: '24', import_order: ['WF_Error', 'WF_SUB_GapEngine', 'WF_SUB_Decide', 'WF_SUB_Deliver', 'WF_Main_Intake'], workflows: {} };
  for (const [k, w] of Object.entries(all)) {
    const file = k + '.json';
    const txt = JSON.stringify(w, null, 2) + '\n';
    fs.writeFileSync(path.join(ROOT, 'workflows', file), txt);
    man.workflows[k] = { file, id: w.id, nodes: w.nodes.length, sha256: ENGINE.sha256Hex(txt) };
    console.log(`${k.padEnd(18)} ${w.nodes.length} nodes`);
  }
  fs.writeFileSync(path.join(ROOT, 'workflows', 'manifest.json'), JSON.stringify(man, null, 2) + '\n');
  console.log('engine_sha256', ENGINE_SHA);
}
