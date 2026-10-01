#!/usr/bin/env node
/**
 * build_wf_demo.mjs — ประกอบ demo/WF_Demo.json จากไฟล์ต้นฉบับใน demo/src/
 *   1) ฝังฟังก์ชันจาก engine/engine.js แบบตรงทุกไบต์ (marker //@@ENGINE:a,b,c@@)
 *   2) ฝัง demo_data.json (ข้อมูลจริงจาก Data_Set.xlsx + data/*.csv) ลงโหนด Load Role Data
 *   3) ฝังหน้าเว็บ app.html + app.css + app.js ลงโหนด Render App HTML
 *   4) ตรวจ: syntax ของ Code node ทุกตัว · $('ชื่อโหนด') ที่อ้างถึงมีจริง · connection ครบ
 * ใช้:  node demo/build_wf_demo.mjs [ROOT=.]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.argv[2] || '.';
const DEMO = path.join(ROOT, 'demo');
const SRC = path.join(DEMO, 'src');
const rd = (p) => fs.readFileSync(p, 'utf8');

// ── engine extraction ──────────────────────────────────────────────────────
const ENGINE_PATH = fs.existsSync(path.join(ROOT, 'engine/engine.js')) ? path.join(ROOT, 'engine/engine.js') : path.join(DEMO, 'src_in/engine/engine.js');
const engine = rd(ENGINE_PATH);
const engineLines = engine.split('\n');
function extract(name) {
  const iFn = engineLines.findIndex((l) => l.startsWith('  function ' + name + '('));
  const iConst = engineLines.findIndex((l) => l.startsWith('  const ' + name + ' '));
  const start = iFn >= 0 ? iFn : iConst;
  if (start < 0) throw new Error('engine: ไม่พบ ' + name);
  const out = [engineLines[start]];
  if (iFn >= 0) {
    for (let i = start + 1; i < engineLines.length; i++) { out.push(engineLines[i]); if (engineLines[i] === '  }') break; }
  } else if (!engineLines[start].trimEnd().endsWith(';')) {
    for (let i = start + 1; i < engineLines.length; i++) {
      const l = engineLines[i]; const ind = l.length - l.trimStart().length;
      if (ind === 2 && l.trim()) { if (/^[\]\)}]/.test(l.trim())) out.push(l); break; }
      out.push(l);
    }
  }
  return out.map((l) => l.slice(2)).join('\n');
}
function withEngine(src) {
  return src.replace(/\/\/@@ENGINE:([^@]+)@@/g, (_, list) =>
    '// ---- คัดลอกจาก engine/engine.js (' + path.basename(ENGINE_PATH) + ' sha256 ' + sha(engine).slice(0, 12) + ') ----\n' +
    list.split(',').map((n) => extract(n.trim())).join('\n') + '\n// ---- จบส่วนที่คัดลอก ----');
}
function sha(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function uuid(seed) { const h = sha('IS68-WF_Demo-' + seed); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`; }

// ── data + html ────────────────────────────────────────────────────────────
const DATA = JSON.parse(rd(path.join(DEMO, 'build/demo_data.json')));
const PROMPT = rd(fs.existsSync(path.join(ROOT, 'prompts/analyst_v1.0.txt')) ? path.join(ROOT, 'prompts/analyst_v1.0.txt') : path.join(DEMO, 'src_in/prompts/analyst_v1.0.txt'));
const BUILD_ID = 'WF_Demo-' + new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 16).replace(/[-:T]/g, ''); // เวลาไทย
const appHtml = rd(path.join(SRC, 'app.html'))
  .replace('/*@@APP_CSS@@*/', () => rd(path.join(SRC, 'app.css')))
  .replace('/*@@APP_JS@@*/', () => rd(path.join(SRC, 'app.js')));
const roleCards = Object.values(DATA.roles).map((r) => ({
  role_id: r.role_id, label_th: r.label_th, name_en: r.name_en, name_th: r.name_th, soc: r.soc, job_zone: r.job_zone,
  mapping_type: r.mapping_type, mapping_note_th: r.mapping_note_th, icon: r.icon, n_items: r.items.length,
}));

const code = {
  config: rd(path.join(SRC, 'config_validate.js')),
  textcheck: rd(path.join(SRC, 'text_layer_check.js')),
  clean: withEngine(rd(path.join(SRC, 'clean_text.js'))),
  load: rd(path.join(SRC, 'load_role_data.js')).replace('/*@@DEMO_DATA@@*/null', () => JSON.stringify(DATA)),
  prompt: rd(path.join(SRC, 'build_prompt.js')).replace("/*@@PROMPT_ANALYST@@*/''", () => JSON.stringify(PROMPT)),
  verify: withEngine(rd(path.join(SRC, 'verify_evidence.js'))),
  plan: rd(path.join(SRC, 'plan_pathway.js')),
  report: rd(path.join(SRC, 'build_report.js')),
  render: rd(path.join(SRC, 'render_app.js'))
    .replace("/*@@APP_HTML@@*/''", () => JSON.stringify(appHtml))
    .replace('/*@@ROLE_CARDS@@*/[]', () => JSON.stringify(roleCards))
    .replace("/*@@BUILD_ID@@*/''", () => JSON.stringify(BUILD_ID)),
  checkpdf: rd(path.join(SRC, 'check_pdf.js')),
  driveres: rd(path.join(SRC, 'drive_result.js')),
};

// ── node factories ─────────────────────────────────────────────────────────
const nodes = [];
const add = (n) => { nodes.push({ id: uuid(n.name), ...n }); return n.name; };
const codeNode = (name, js, pos, extra = {}) => add({ name, type: 'n8n-nodes-base.code', typeVersion: 2, position: pos, parameters: { jsCode: js }, ...extra });
const ifNode = (name, left, pos) => add({
  name, type: 'n8n-nodes-base.if', typeVersion: 2.2, position: pos,
  parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
    conditions: [{ id: uuid(name + '-c'), leftValue: left, rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} },
});
const webhook = (name, method, p, pos) => add({
  name, type: 'n8n-nodes-base.webhook', typeVersion: 2.1, position: pos, webhookId: uuid('wh-' + p),
  parameters: { httpMethod: method, path: p, responseMode: 'responseNode', options: {} },
});
const respond = (name, params, pos) => add({ name, type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.5, position: pos, parameters: params });
const GEMINI_CRED = { httpHeaderAuth: { id: 'REPLACE_GEMINI_CRED', name: 'Gemini API Key (x-goog-api-key)' } };
const geminiHttp = (name, urlExpr, bodyExpr, pos) => add({
  name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: pos,
  retryOnFail: true, maxTries: 3, waitBetweenTries: 3000, onError: 'continueRegularOutput',
  parameters: { method: 'POST', url: urlExpr, authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
    sendBody: true, specifyBody: 'json', jsonBody: bodyExpr, options: { timeout: 150000 } },
  credentials: GEMINI_CRED,
});
const sticky = (name, content, pos, w, h, color) => add({ name, type: 'n8n-nodes-base.stickyNote', typeVersion: 1, position: pos, parameters: { content, width: w, height: h, color } });

const Y_UI = 0, Y_A = 420, Y_S = 1000, X = (i) => 220 * i;
// UI
const nGet = webhook('GET /is-demo', 'GET', 'is-demo', [X(0), Y_UI]);
const nRender = codeNode('Render App HTML', code.render, [X(1), Y_UI]);
const nRespHtml = respond('Respond HTML', { respondWith: 'text', responseBody: '={{ $json.html }}',
  options: { responseHeaders: { entries: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }, { name: 'Cache-Control', value: 'no-store' }] } } }, [X(2), Y_UI]);
// Analyze
const nPost = webhook('POST /is-demo-analyze', 'POST', 'is-demo-analyze', [X(0), Y_A]);
const nCfg = codeNode('Config & Validate', code.config, [X(1), Y_A]);
const nOk1 = ifNode('Input OK?', '={{ $json.ok }}', [X(2), Y_A]);
const nIsPdf = ifNode('Is PDF?', '={{ $json.file.is_pdf }}', [X(3), Y_A - 20]);
const nExtract = add({ name: 'Extract PDF Text', type: 'n8n-nodes-base.extractFromFile', typeVersion: 1.1, position: [X(4), Y_A - 120], onError: 'continueRegularOutput',
  parameters: { operation: 'pdf', binaryPropertyName: 'resume', options: { joinPages: true, maxPages: 5, keepSource: 'both' } } });
const nTl = codeNode('Text Layer Check', code.textcheck, [X(5), Y_A]);
const nNeedOcr = ifNode('Need OCR?', '={{ $json.need_ocr }}', [X(6), Y_A]);
const nOcr = geminiHttp('Gemini OCR',
  "=https://generativelanguage.googleapis.com/v1beta/models/{{ $('Config & Validate').first().json.cfg.GEMINI_MODEL_OCR }}:generateContent",
  "={{ JSON.stringify({ contents: [{ role: 'user', parts: [ { inlineData: { mimeType: $('Config & Validate').first().json.file.mime, data: $('Config & Validate').first().json.file_b64 } }, { text: $json.ocr_prompt } ] }], generationConfig: $json.ocr_generation_config }) }}",
  [X(7), Y_A - 120]);
const nClean = codeNode('Clean Text & Mask PII', code.clean, [X(8), Y_A]);
const nOk2 = ifNode('Text OK?', '={{ $json.ok }}', [X(9), Y_A]);
const nLoad = codeNode('Load Role Data (O*NET 31.0)', code.load, [X(10), Y_A]);
const nPrompt = codeNode('Build Analyst Prompt', code.prompt, [X(11), Y_A]);
const nUseG = ifNode('Use Gemini?', '={{ $json.use_gemini }}', [X(12), Y_A]);
const nAnalyst = geminiHttp('Gemini Analyst',
  '=https://generativelanguage.googleapis.com/v1beta/models/{{ $json.model }}:generateContent',
  '={{ JSON.stringify($json.gemini_request) }}', [X(13), Y_A - 120]);
const nVerify = codeNode('Verify Evidence (R0·R2·R3)', code.verify, [X(14), Y_A]);
const nPlan = codeNode('Plan Pathway (Eq 3.7–3.8)', code.plan, [X(15), Y_A]);
const nReport = codeNode('Build Report', code.report, [X(16), Y_A]);
const nRespRep = respond('Respond Report', { respondWith: 'firstIncomingItem', options: { responseCode: 200, responseHeaders: { entries: [{ name: 'Cache-Control', value: 'no-store' }] } } }, [X(17), Y_A]);
const nRespErr = respond('Respond Error', { respondWith: 'json',
  responseBody: '={{ JSON.stringify({ ok: false, stage: $json.stage, errors: $json.errors }) }}',
  options: { responseCode: '={{ $json.http_status || 400 }}' } }, [X(10), Y_A + 260]);
// Save PDF
const nSave = webhook('POST /is-demo-save-pdf', 'POST', 'is-demo-save-pdf', [X(0), Y_S]);
const nChk = codeNode('Check PDF', code.checkpdf, [X(1), Y_S]);
const nOk3 = ifNode('PDF OK?', '={{ $json.ok }}', [X(2), Y_S]);
const nDrive = add({ name: 'Upload PDF to Drive', type: 'n8n-nodes-base.googleDrive', typeVersion: 3, position: [X(3), Y_S - 100], onError: 'continueRegularOutput',
  parameters: { authentication: 'oAuth2', operation: 'upload', name: '={{ $json.file_name }}',
    driveId: { __rl: true, mode: 'list', value: 'My Drive' },
    folderId: { __rl: true, mode: 'id', value: 'root' },
    inputDataFieldName: 'pdf', options: { simplifyOutput: false } },
  credentials: { googleDriveOAuth2Api: { id: 'REPLACE_DRIVE_CRED', name: 'Google Drive OAuth2' } } });
const nDres = codeNode('Drive Result', code.driveres, [X(4), Y_S]);
const nRespDrive = respond('Respond Drive', { respondWith: 'json', responseBody: '={{ JSON.stringify($json) }}',
  options: { responseCode: '={{ $json.http_status || 200 }}' } }, [X(5), Y_S]);

// sticky notes
sticky('Note · Overview', [
  '# WF_Demo · Skill-Gap Navigator (IS 68076026)',
  'Demo รอบที่ 1 สำหรับคณะกรรมการ · ฟอร์ม → OCR → วิเคราะห์ → ตรวจหลักฐาน → วางแผน → แสดงผลบน n8n',
  '',
  '**ตั้งค่า (ครั้งเดียว)**',
  '1. Credential **Header Auth** ชื่อ `Gemini API Key (x-goog-api-key)` · Name = `x-goog-api-key` · Value = API key → เลือกในโหนด *Gemini OCR* และ *Gemini Analyst*',
  '2. Credential **Google Drive OAuth2** → เลือกในโหนด *Upload PDF to Drive* และใส่ Folder ID ปลายทาง',
  '3. กด **Publish** แล้วเปิด `http://localhost:5678/webhook/is-demo`',
  '',
  '**โหมดโชว์โหนดวิ่งบน canvas:** เปิด `.../webhook/is-demo?test=1` → กด *Execute workflow* → ส่งฟอร์ม',
  '**สำรองไม่มีเน็ต:** ตั้ง `USE_GEMINI_ANALYST: false` ในโหนด Config & Validate',
  '',
  'ข้อมูลอ้างอิงเป็นของจริงแบบ hardcode: O*NET 31.0 (Data_Set.xlsx) · คลังคอร์ส v1.5R ที่ verified · mapping L1 ที่ผ่านตรวจ',
  'build: `' + BUILD_ID + '` · ต้นฉบับ `demo/src/` → `node demo/build_wf_demo.mjs`',
].join('\n'), [X(4) - 40, Y_UI - 220], 900, 380, 5);
sticky('Note · UI', '## 🎨 หน้าเว็บ\nGET `/webhook/is-demo` → HTML (glassmorphism · Light/Dark · ฟอร์ม + รายงาน + Export PDF)', [X(0) - 40, Y_UI - 120], 700, 300, 7);
sticky('Note · Intake', '## 1 · รับไฟล์ + OCR\nตรวจข้อมูล (ตาราง 3.10) → PDF text layer ก่อน → ข้อความน้อย/รูปภาพ → **Gemini OCR** → ปิดบัง PII (3.5.1)', [X(0) - 40, Y_A - 240], 2020, 560, 7);
sticky('Note · Analyze', '## 2 · วิเคราะห์ + ตรวจหลักฐาน\nO*NET Top-30 ของอาชีพ → prompt **analyst_v1.0** → Gemini → **R0** (JSON) · **R2** (quote ตรงตัวอักษร) · **R3** (overlap ≥ θ) → R · C · U (สมการ 3.4–3.6)', [X(9) + 180, Y_A - 240], 1140, 560, 4);
sticky('Note · Plan', '## 3 · วางแผน + รายงาน\nHmax = M × 4.33 × h (3.7) · greedy d_k (3.8) · เฉพาะคลัง verified + L1 ผ่านตรวจ → JSON → หน้าเว็บ', [X(14) + 180, Y_A - 240], 940, 560, 6);
sticky('Note · Drive', '## ☁️ บันทึก PDF ลง Google Drive\nหน้าเว็บสร้าง PDF (html2pdf) → POST `/webhook/is-demo-save-pdf` → Google Drive → ลิงก์กลับไปที่หน้าเว็บ', [X(0) - 40, Y_S - 220], 1360, 400, 3);

// connections
const conns = {};
const link = (a, b, out = 0) => { conns[a] = conns[a] || { main: [] }; while (conns[a].main.length <= out) conns[a].main.push([]); conns[a].main[out].push({ node: b, type: 'main', index: 0 }); };
link(nGet, nRender); link(nRender, nRespHtml);
link(nPost, nCfg); link(nCfg, nOk1); link(nOk1, nIsPdf, 0); link(nOk1, nRespErr, 1);
link(nIsPdf, nExtract, 0); link(nIsPdf, nTl, 1); link(nExtract, nTl);
link(nTl, nNeedOcr); link(nNeedOcr, nOcr, 0); link(nNeedOcr, nClean, 1); link(nOcr, nClean);
link(nClean, nOk2); link(nOk2, nLoad, 0); link(nOk2, nRespErr, 1);
link(nLoad, nPrompt); link(nPrompt, nUseG); link(nUseG, nAnalyst, 0); link(nUseG, nVerify, 1); link(nAnalyst, nVerify);
link(nVerify, nPlan); link(nPlan, nReport); link(nReport, nRespRep);
link(nSave, nChk); link(nChk, nOk3); link(nOk3, nDrive, 0); link(nOk3, nRespDrive, 1); link(nDrive, nDres); link(nDres, nRespDrive);

const wf = {
  id: 'is68WFDemo000001',
  name: 'WF_Demo · Skill-Gap Navigator (IS 68076026)',
  nodes, connections: conns, active: false, pinData: {},
  settings: { executionOrder: 'v1', saveDataSuccessExecution: 'all', saveDataErrorExecution: 'all', saveManualExecutions: true, timezone: 'Asia/Bangkok' },
  tags: [{ name: 'IS68076026' }, { name: 'demo' }],
  meta: { is68: { build_id: BUILD_ID, built_by: 'demo/build_wf_demo.mjs', engine_sha256: sha(engine), data_sha256: DATA.meta.sha256, onet: DATA.meta.onet_version, corpus: DATA.meta.corpus_version, n8n_target: '2.39.x' } },
};

// ── validation ─────────────────────────────────────────────────────────────
const names = new Set(nodes.map((n) => n.name));
const errs = [];
if (names.size !== nodes.length) errs.push('ชื่อโหนดซ้ำ');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
for (const n of nodes) {
  const p = JSON.stringify(n.parameters);
  for (const m of p.matchAll(/\$\(\s*\\?['"]([^'"\\]+)\\?['"]\s*\)/g)) if (!names.has(m[1])) errs.push(n.name + ': อ้างโหนดที่ไม่มี ' + m[1]);
  if (n.type === 'n8n-nodes-base.code') {
    try { new AsyncFunction('$input', '$', '$json', n.parameters.jsCode); } catch (e) { errs.push(n.name + ': syntax ' + e.message); }
    if (/@@[A-Z_:]+/.test(n.parameters.jsCode)) errs.push(n.name + ': marker ค้าง');
  }
}
for (const [a, c] of Object.entries(conns)) { if (!names.has(a)) errs.push('conn from ' + a); c.main.flat().forEach((x) => { if (!names.has(x.node)) errs.push('conn to ' + x.node); }); }
if (errs.length) { console.error('✗ validation\n  ' + errs.join('\n  ')); process.exit(1); }

const OUT = path.join(DEMO, 'WF_Demo.json');
fs.writeFileSync(OUT, JSON.stringify(wf, null, 2));
fs.mkdirSync(path.join(DEMO, 'build'), { recursive: true });
fs.writeFileSync(path.join(DEMO, 'build/app_preview.html'), appHtml.replace('"__BOOT__"', () => JSON.stringify({ roles: roleCards, test: false, paths: { analyze: 'is-demo-analyze', save: 'is-demo-save-pdf' }, build: BUILD_ID }).replace(/</g, '\\u003c')));
const nNodes = nodes.filter((n) => n.type !== 'n8n-nodes-base.stickyNote').length;
console.log('✓ ' + OUT + ' · ' + nNodes + ' nodes + ' + (nodes.length - nNodes) + ' notes · ' + (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB · ' + BUILD_ID);
