// validate_workflows.mjs — ตัวตรวจ workflow ทั้งห้า (ตาราง 3.9 · Spec A14 · บั๊ก B1 B3 B5 B6 B7 B9 B10 · C6) + WF_Final_IS (DEC-37)
//   node scripts/validate_workflows.mjs   (exit 1 ถ้าไม่ผ่าน)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ENGINE } from './lib/refs.mjs';
import { buildAll, buildFinal } from './build_workflows.mjs';

export const EXPECTED_NODES = { WF_Main_Intake: 17, WF_SUB_GapEngine: 11, WF_SUB_Decide: 13, WF_SUB_Deliver: 13, WF_Error: 6 };
const BEGIN = '// ==== ENGINE BEGIN (engine/engine.js · ห้ามแก้ในนี้ แก้ที่ไฟล์ต้นทางแล้ว build ใหม่) ====\n';
const END = '\n// ==== ENGINE END ====\n';

// DEC-38: ชุด 5 ไฟล์ไม่อยู่ใน workflows/ แล้ว — สร้างในหน่วยความจำจากแหล่งเดียวกัน (build_workflows.mjs) เพื่อตรวจบั๊ก B1–B11 และเทียบกับ WF_Final_IS
export function loadWorkflows() {
  return JSON.parse(JSON.stringify(buildAll()));
}

// ตรวจรายโหนด (ใช้ร่วมกันระหว่างชุด 5 ไฟล์และ WF_Final_IS)
function nodeChecks(w, engineSrc, E, opts) {
  for (const n of w.nodes) {
    const p = n.parameters || {};
    // C6 engine ฝังตรงทุกไบต์
    if (n.type === 'n8n-nodes-base.code') {
      const js = p.jsCode || '';
      if (js.includes('ENGINE.')) {
        const a = js.indexOf(BEGIN); const b = js.indexOf(END);
        if (a !== 0 || b < 0) E(`${n.name}: ไม่พบ engine ที่ฝังไว้`);
        else if (js.slice(BEGIN.length, b) !== engineSrc) E(`${n.name}: engine ที่ฝังไม่ตรงกับ engine/engine.js`);
      }
      try { new Function('return (async function(){' + js + '\n})'); } catch (e) { E(`${n.name}: JavaScript syntax ${e.message}`); }
    }
    // B1 IF: boolean operator แบบ singleValue + strict
    if (n.type === 'n8n-nodes-base.if') {
      const conds = (p.conditions && p.conditions.conditions) || [];
      if (!conds.length || conds.some((c) => !(c.operator && c.operator.type === 'boolean' && c.operator.singleValue === true && c.operator.operation === 'true')))
        E(`${n.name}: IF ต้องใช้ operator boolean/true แบบ singleValue (บั๊ก B1)`);
      if (!p.conditions.options || p.conditions.options.typeValidation !== 'strict') E(`${n.name}: typeValidation ต้องเป็น strict`);
    }
    // B3 Google Sheets / Drive (อ่าน) / Trigger ต้องใช้ serviceAccount
    if (['n8n-nodes-base.googleSheets', 'n8n-nodes-base.googleSheetsTrigger'].includes(n.type) && p.authentication !== 'serviceAccount')
      E(`${n.name}: Google Sheets ต้อง authentication=serviceAccount (บั๊ก B3)`);
    if (n.type === 'n8n-nodes-base.googleDrive') {
      if (p.operation === 'download' && p.authentication !== 'serviceAccount') E(`${n.name}: ดาวน์โหลดไฟล์แบบฟอร์มต้องใช้ serviceAccount`);
      if (p.operation === 'upload' && p.authentication !== 'oAuth2') E(`${n.name}: อัปโหลดต้องใช้ Drive OAuth2 ของผู้วิจัย (บั๊ก B10)`);
    }
    if (n.type === 'n8n-nodes-base.httpRequest' && /upload\/drive|drive\/v3\/files/.test(String(p.url)) && p.nodeCredentialType !== 'googleDriveOAuth2Api')
      E(`${n.name}: Drive API ต้องใช้ googleDriveOAuth2Api (บั๊ก B10)`);
    if (n.type === 'n8n-nodes-base.httpRequest' && /documentai/.test(String(p.url)) && p.nodeCredentialType !== 'googleApi')
      E(`${n.name}: Document AI ต้องใช้บัญชีบริการ googleApi`);
    // Gmail: เฉพาะ Deliver/Error · OAuth2 (3.6.3)
    if (n.type === 'n8n-nodes-base.gmail') {
      if (!opts.gmailAllowed(n)) E(`${n.name}: email node อยู่ได้เฉพาะ Deliver/Error`);
      if (p.authentication !== 'oAuth2') E(`${n.name}: Gmail ต้องใช้ OAuth2`);
    }
    // B9 onError=continueErrorOutput ต้องต่อ error output
    if (n.onError === 'continueErrorOutput') {
      const outs = (w.connections[n.name] || { main: [] }).main;
      if (!outs[1] || outs[1].length === 0) E(`${n.name}: onError=continueErrorOutput แต่ไม่ได้ต่อ error output (บั๊ก B9)`);
    }
    // B6 execute workflow ต้องทำงานทีละ item และรอผล
    if (n.type === 'n8n-nodes-base.executeWorkflow') {
      if (p.mode !== 'each') E(`${n.name}: mode ต้องเป็น each (บั๊ก B6)`);
      if (!(p.options && p.options.waitForSubWorkflow)) E(`${n.name}: ต้องรอ sub-workflow`);
      if (!opts.ids.has(p.workflowId.value)) E(`${n.name}: workflowId ${p.workflowId.value} ไม่มีในชุด`);
    }
  }
}

export function validate(wfs) {
  const errors = [];
  const E = (wf, msg) => errors.push(`${wf}: ${msg}`);
  const engineSrc = fs.readFileSync(path.join(ROOT, 'engine', 'engine.js'), 'utf8');
  const engineSha = ENGINE.sha256Hex(engineSrc);
  const ids = new Set(Object.values(wfs).map((w) => w.id));
  for (const [name, w] of Object.entries(wfs)) {
    // A14 จำนวน node
    if (w.nodes.length !== EXPECTED_NODES[name]) E(name, `มี ${w.nodes.length} node (ต้อง ${EXPECTED_NODES[name]})`);
    const byName = Object.fromEntries(w.nodes.map((n) => [n.name, n]));
    if (Object.keys(byName).length !== w.nodes.length) E(name, 'ชื่อ node ซ้ำ');
    if (w.settings.executionOrder !== 'v1') E(name, 'executionOrder ต้องเป็น v1');
    if (name !== 'WF_Error' && w.settings.errorWorkflow !== wfs.WF_Error.id) E(name, 'errorWorkflow ต้องชี้ WF_Error');
    // connections อ้าง node ที่มีจริง
    const incoming = {};
    for (const [from, c] of Object.entries(w.connections)) {
      if (!byName[from]) E(name, `connection จาก node ที่ไม่มี: ${from}`);
      (c.main || []).forEach((outs, oi) => (outs || []).forEach((t) => {
        if (!byName[t.node]) E(name, `connection ไป node ที่ไม่มี: ${t.node}`);
        (incoming[t.node] = incoming[t.node] || []).push({ from, oi, ii: t.index });
      }));
    }
    nodeChecks(w, engineSrc, (msg) => E(name, msg), { ids, gmailAllowed: () => ['WF_SUB_Deliver', 'WF_Error'].includes(name) });
    // B5 fan-in: node ที่มีหลายขาเข้าต้องเป็น Merge หรือประกาศว่าเป็นทางแยกที่ไม่เกิดพร้อมกัน
    const allowed = (w.meta && w.meta.is68 && w.meta.is68.exclusive_fan_in) || {};
    for (const [node, ins] of Object.entries(incoming)) {
      const srcs = new Set(ins.map((x) => x.from + '#' + x.oi));
      if (srcs.size > 1 && byName[node].type !== 'n8n-nodes-base.merge' && !allowed[node]) E(name, `${node}: มี ${srcs.size} ขาเข้าแต่ไม่ใช่ Merge และไม่ได้ประกาศ exclusive_fan_in (บั๊ก B5)`);
    }
    if (w.meta.is68.engine_sha256 !== engineSha) E(name, 'engine_sha256 ใน meta ไม่ตรงกับ engine/engine.js');
  }
  // B7: Gmail ใน Deliver ต้องได้ binary จาก Export PDF โดยตรง และแนบ property data
  const D = wfs.WF_SUB_Deliver;
  const gm = D.nodes.find((n) => n.type === 'n8n-nodes-base.gmail');
  const toGmail = Object.entries(D.connections).filter(([, c]) => (c.main[0] || []).some((t) => t.node === gm.name)).map(([f]) => f);
  if (JSON.stringify(toGmail) !== JSON.stringify(['Export PDF'])) E('WF_SUB_Deliver', `Send Email ต้องรับข้อมูลจาก Export PDF โดยตรง (ได้ ${toGmail}) (บั๊ก B7)`);
  const att = ((gm.parameters.options || {}).attachmentsUi || {}).attachmentsBinary || [];
  const exp = D.nodes.find((n) => n.name === 'Export PDF');
  if (!att.some((a) => a.property === 'data') || exp.parameters.options.response.response.outputPropertyName !== 'data') E('WF_SUB_Deliver', 'ไฟล์แนบต้องใช้ binary property data (บั๊ก B7)');
  // จำนวน email node ต่อเส้นทาง: Deliver 1 · Error 1
  if (D.nodes.filter((n) => n.type === 'n8n-nodes-base.gmail').length !== 1) E('WF_SUB_Deliver', 'ต้องมี email node เดียว');
  return errors;
}

// ------------------------------------------------------------------ WF_Final_IS (DEC-37)
export const FINAL_FILE = 'WF_Final_IS.json';
const DROPPED = ['Call GapEngine', 'Call Decide', 'Call Deliver', 'When Called by Main'];
export const NEW_FINAL_NODES = ['Loop Over Runs', 'GapEngine Input', 'Decide Input', 'Deliver Input', 'Collect Delivery Result'];
export const EXPECTED_FINAL_NODES = Object.values(EXPECTED_NODES).reduce((a, b) => a + b, 0) - 6 + NEW_FINAL_NODES.length; // 59
const STAGE_INPUT = { WF_SUB_GapEngine: 'GapEngine Input', WF_SUB_Decide: 'Decide Input', WF_SUB_Deliver: 'Deliver Input' };
// โหนดที่ตั้งใจเปลี่ยนจากชุด 5 ไฟล์ (ต้องตรงกับ DEC-37)
const CHANGED = { 'Record Delivery': 'jsCode', 'Upload PDF': 'onError', 'Send Email': 'onError', 'Findings Rows': 'position', 'Append findings': 'position' };

// DEC-42: WF_Final_IS ย้ายไป archive แล้ว — สร้างในหน่วยความจำจากแหล่งเดียวกันเพื่อเทสต์เทียบ
export function loadFinal() { return JSON.parse(JSON.stringify(buildFinal(buildAll()))); }

const refsIn = (s) => [...String(s).matchAll(/\$\(\s*'([^']+)'\s*\)/g)].map((m) => m[1]);
function nodeRefs(n) {
  const out = new Set();
  const walk = (v, key) => {
    if (typeof v === 'string') {
      if (key === 'jsCode') { const b = v.indexOf(END); refsIn(b >= 0 ? v.slice(b) : v).forEach((x) => out.add(x)); }
      else if (v.startsWith('=')) refsIn(v).forEach((x) => out.add(x));
    } else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  walk(n.parameters || {}, '');
  return out;
}

export function validateFinal(w, wfs) {
  const errors = [];
  const E = (msg) => errors.push(`WF_Final_IS: ${msg}`);
  const engineSrc = fs.readFileSync(path.join(ROOT, 'engine', 'engine.js'), 'utf8');
  const real = w.nodes.filter((n) => n.type !== 'n8n-nodes-base.stickyNote');
  const byName = Object.fromEntries(real.map((n) => [n.name, n]));
  if (real.length !== EXPECTED_FINAL_NODES) E(`มี ${real.length} node (ต้อง ${EXPECTED_FINAL_NODES})`);
  if (new Set(w.nodes.map((n) => n.name)).size !== w.nodes.length) E('ชื่อ node ซ้ำ');
  if (w.settings.executionOrder !== 'v1') E('executionOrder ต้องเป็น v1');
  if (w.settings.errorWorkflow) E('ไม่ต้องตั้ง errorWorkflow (ใช้ Error Trigger ในไฟล์เดียวกัน)');
  if (real.filter((n) => n.type === 'n8n-nodes-base.errorTrigger').length !== 1) E('ต้องมี Error Trigger 1 โหนด');
  if (real.filter((n) => n.type === 'n8n-nodes-base.googleSheetsTrigger').length !== 1) E('ต้องมี Google Sheets Trigger 1 โหนด');
  for (const n of real) if (/executeWorkflow/.test(n.type)) E(`${n.name}: ไม่ควรมีการเรียกข้าม workflow (${n.type})`);
  if (JSON.stringify(w).includes("$('When Called by Main')")) E("ยังมีการอ้าง $('When Called by Main')");
  // connections + fan-in
  const incoming = {}; const succ = {};
  for (const [from, c] of Object.entries(w.connections)) {
    if (!byName[from]) E(`connection จาก node ที่ไม่มี: ${from}`);
    (c.main || []).forEach((outs, oi) => (outs || []).forEach((t) => {
      if (!byName[t.node]) E(`connection ไป node ที่ไม่มี: ${t.node}`);
      (incoming[t.node] = incoming[t.node] || []).push({ from, oi, ii: t.index });
      (succ[from] = succ[from] || []).push({ to: t.node, oi });
    }));
  }
  nodeChecks({ ...w, nodes: real }, engineSrc, E, { ids: new Set(), gmailAllowed: (n) => ['Send Email', 'Notify Researcher'].includes(n.name) });
  const allowed = (w.meta && w.meta.is68 && w.meta.is68.exclusive_fan_in) || {};
  for (const [node, ins] of Object.entries(incoming)) {
    const srcs = new Set(ins.map((x) => x.from + '#' + x.oi));
    if (srcs.size > 1 && byName[node] && byName[node].type !== 'n8n-nodes-base.merge' && !allowed[node]) E(`${node}: มี ${srcs.size} ขาเข้าแต่ไม่ใช่ Merge และไม่ได้ประกาศ exclusive_fan_in (บั๊ก B5)`);
  }
  // ทุก $('X') อ้าง node ที่มีจริง
  for (const n of real) for (const r of nodeRefs(n)) if (!byName[r]) E(`${n.name}: อ้าง $('${r}') ที่ไม่มีในไฟล์`);
  // B7 Gmail รับ binary จาก Export PDF โดยตรง
  const toGmail = (incoming['Send Email'] || []).map((x) => x.from);
  if (JSON.stringify(toGmail) !== JSON.stringify(['Export PDF'])) E(`Send Email ต้องรับข้อมูลจาก Export PDF โดยตรง (ได้ ${toGmail}) (บั๊ก B7)`);
  const gm = byName['Send Email']; const exp = byName['Export PDF'];
  if (gm && exp) {
    const att = ((gm.parameters.options || {}).attachmentsUi || {}).attachmentsBinary || [];
    if (!att.some((a) => a.property === 'data') || exp.parameters.options.response.response.outputPropertyName !== 'data') E('ไฟล์แนบต้องใช้ binary property data (บั๊ก B7)');
  }
  // ลูป: batch 1 · ขา loop → Create Run Row · วนกลับจาก Update Run Delivered
  const loop = byName['Loop Over Runs'];
  if (!loop || loop.type !== 'n8n-nodes-base.splitInBatches' || loop.parameters.batchSize !== 1) E('Loop Over Runs ต้องเป็น splitInBatches batchSize=1');
  const lo = (w.connections['Loop Over Runs'] || { main: [] }).main;
  if (!lo[1] || lo[1].map((t) => t.node).join() !== 'Create Run Row') E('ขา loop (output 1) ต้องไป Create Run Row');
  const back = (incoming['Loop Over Runs'] || []).map((x) => x.from).sort().join();
  if (back !== 'Not Duplicate?,Update Run Delivered') E(`ขาเข้า Loop Over Runs ต้องมาจาก Not Duplicate? และ Update Run Delivered (ได้ ${back})`);
  // ตัวลูป = โหนดที่ไปถึงได้จากขา loop โดยไม่ผ่าน Loop Over Runs ซ้ำ
  const body = new Set(); const q = ['Create Run Row'];
  while (q.length) { const x = q.shift(); if (body.has(x) || x === 'Loop Over Runs') continue; body.add(x); (succ[x] || []).forEach((s) => q.push(s.to)); }
  if (!body.has('Update Run Delivered')) E('จากขา loop ต้องไปถึง Update Run Delivered ได้');
  // ห้ามอ้างผลของโหนดในลูปที่อาจไม่ได้ทำงานในรอบนี้ (จะได้ค่าของรอบก่อน): โหนดที่อ้างต้อง "ครอบ" (dominate) โหนดที่อ้างถึง
  // Merge = รอทุกขา (union) · ขาเข้าแบบ exclusive = ทางใดทางหนึ่ง (intersection)
  const order = [...body];
  const dom = Object.fromEntries(order.map((x) => [x, new Set(order)]));
  dom['Create Run Row'] = new Set(['Create Run Row']);
  for (let changed = true; changed;) {
    changed = false;
    for (const x of order) {
      if (x === 'Create Run Row') continue;
      const preds = (incoming[x] || []).map((i) => i.from).filter((p) => body.has(p));
      if (!preds.length) continue;
      let d;
      if (byName[x].type === 'n8n-nodes-base.merge') { d = new Set(); preds.forEach((p) => dom[p].forEach((v) => d.add(v))); }
      else { d = new Set(dom[preds[0]]); preds.slice(1).forEach((p) => { for (const v of d) if (!dom[p].has(v)) d.delete(v); }); }
      d.add(x);
      if (d.size !== dom[x].size || [...d].some((v) => !dom[x].has(v))) { dom[x] = d; changed = true; }
    }
  }
  for (const x of order) for (const r of nodeRefs(byName[x])) {
    if (body.has(r) && !dom[x].has(r)) E(`${x}: อ้าง $('${r}') ซึ่งอาจไม่ได้ทำงานในรอบนี้ของ Loop Over Runs (จะได้ค่าของงานก่อนหน้า)`);
  }
  // ตรรกะเดียวกับชุด 5 ไฟล์: ทุกโหนดเดิม (ยกเว้นที่ตัด) อยู่ครบ และพารามิเตอร์ตรงกัน ยกเว้นที่ประกาศใน CHANGED
  if (wfs) for (const [wfName, src] of Object.entries(wfs)) for (const o of src.nodes) {
    if (DROPPED.includes(o.name)) continue;
    const f = byName[o.name];
    if (!f) { E(`ไม่มีโหนด ${o.name} จาก ${wfName}`); continue; }
    if (f.type !== o.type) E(`${o.name}: ชนิดโหนดต่างจาก ${wfName}`);
    const p1 = JSON.parse(JSON.stringify(o.parameters)); const p2 = JSON.parse(JSON.stringify(f.parameters));
    if (o.type === 'n8n-nodes-base.code' && STAGE_INPUT[wfName]) p1.jsCode = p1.jsCode.split("$('When Called by Main')").join(`$('${STAGE_INPUT[wfName]}')`);
    if (CHANGED[o.name] === 'jsCode') { delete p1.jsCode; delete p2.jsCode; }
    if (JSON.stringify(p1) !== JSON.stringify(p2)) E(`${o.name}: พารามิเตอร์ต่างจาก ${wfName}`);
    if (CHANGED[o.name] !== 'onError' && (o.onError || '') !== (f.onError || '')) E(`${o.name}: onError ต่างจาก ${wfName}`);
    for (const k of ['executeOnce', 'alwaysOutputData']) if (Boolean(o[k]) !== Boolean(f[k])) E(`${o.name}: ${k} ต่างจาก ${wfName}`);
    if (JSON.stringify(o.credentials || {}) !== JSON.stringify(f.credentials || {})) E(`${o.name}: credentials ต่างจาก ${wfName}`);
  }
  for (const nm of ['Upload PDF', 'Send Email']) if (byName[nm] && byName[nm].onError !== 'continueRegularOutput') E(`${nm}: ต้องเป็น continueRegularOutput เพื่อให้ Merge ได้ครบสองขาเสมอ`);
  if (w.meta.is68.engine_sha256 !== ENGINE.sha256Hex(engineSrc)) E('engine_sha256 ใน meta ไม่ตรงกับ engine/engine.js');
  return errors;
}


// ------------------------------------------------------------------ WF_IS_68076026_01OCT26 (DEC-48 · ต่อยอด DEC-42)
export const SINGLE_NAME = 'WF_IS_68076026_01OCT26';
export const SINGLE_FILE = SINGLE_NAME + '.json';
export const EXPECTED_SINGLE_NODES = 79;
export function loadSingle() { return JSON.parse(fs.readFileSync(path.join(ROOT, 'workflows', SINGLE_FILE), 'utf8')); }
export function validateSingle(w) {
  const errors = [];
  const E = (msg) => errors.push(`${SINGLE_NAME}: ${msg}`);
  if (w.name !== SINGLE_NAME) E(`ชื่อ workflow ต้องเป็น ${SINGLE_NAME} (ได้ ${w.name})`);
  const engineSrc = fs.readFileSync(path.join(ROOT, 'engine', 'engine.js'), 'utf8');
  const real = w.nodes.filter((n) => n.type !== 'n8n-nodes-base.stickyNote');
  const notes = w.nodes.filter((n) => n.type === 'n8n-nodes-base.stickyNote');
  const byName = Object.fromEntries(real.map((n) => [n.name, n]));
  if (real.length !== EXPECTED_SINGLE_NODES) E(`มี ${real.length} node (ต้อง ${EXPECTED_SINGLE_NODES})`);
  if (new Set(w.nodes.map((n) => n.name)).size !== w.nodes.length) E('ชื่อ node ซ้ำ');
  if (w.settings.executionOrder !== 'v1') E('executionOrder ต้องเป็น v1');
  if (w.settings.errorWorkflow) E('ไม่ต้องตั้ง errorWorkflow (ใช้ Error Trigger ในไฟล์เดียวกัน)');
  if (real.filter((n) => n.type === 'n8n-nodes-base.errorTrigger').length !== 1) E('ต้องมี Error Trigger 1 โหนด');
  if (real.filter((n) => n.type === 'n8n-nodes-base.googleSheetsTrigger').length !== 1) E('ต้องมี Google Sheets Trigger 1 โหนด');
  for (const n of real) if (/executeWorkflow/.test(n.type)) E(`${n.name}: ไม่ควรมีการเรียกข้าม workflow (${n.type})`);
  // ภาคผนวก ข: 7 ช่วง · ทุกโหนดอยู่ในช่วงเดียว · sticky note ครบ
  const secs = (w.meta.is68.sections || []);
  if (secs.length !== 7 || notes.length !== 7) E(`ต้องมี 7 ช่วงและ sticky note 7 แผ่น (ได้ ${secs.length}/${notes.length})`);
  const inSec = secs.flatMap((s) => s.nodes);
  if (inSec.length !== real.length || new Set(inSec).size !== real.length || inSec.some((x) => !byName[x])) E('ทุกโหนดต้องอยู่ในช่วงเดียวพอดี');
  // ชื่อโหนดเป็นกริยา + กรรม (คำแรกเป็นคำกริยาภาษาอังกฤษ หรือคำถามของ IF)
  const VERBS = /^(Watch|Read|Validate|Is|Has|Log|Loop|Create|Download|Check|Extract|Choose|Run|Mask|Save|Record|Start|Load|Build|Call|Wait|Collect|Apply|Mark|Freeze|Render|Upload|Export|Send|Delete|Catch|Get|Classify|Notify|Prepare)\b/;
  for (const n of real) if (!VERBS.test(n.name)) E(`${n.name}: ชื่อโหนดควรขึ้นต้นด้วยคำกริยา`);
  // connections + fan-in
  const incoming = {}; const succ = {};
  for (const [from, c] of Object.entries(w.connections)) {
    if (!byName[from]) E(`connection จาก node ที่ไม่มี: ${from}`);
    (c.main || []).forEach((outs, oi) => (outs || []).forEach((t) => {
      if (!byName[t.node]) E(`connection ไป node ที่ไม่มี: ${t.node}`);
      (incoming[t.node] = incoming[t.node] || []).push({ from, oi, ii: t.index });
      (succ[from] = succ[from] || []).push({ to: t.node, oi });
    }));
  }
  for (const n of real) if (!incoming[n.name] && !/Trigger$/.test(n.type) && !['n8n-nodes-base.googleSheetsTrigger', 'n8n-nodes-base.errorTrigger'].includes(n.type)) E(`${n.name}: ไม่มีขาเข้า`);
  nodeChecks({ ...w, nodes: real }, engineSrc, E, { ids: new Set(), gmailAllowed: (n) => ['Send Report Email', 'Notify Researcher', 'Notify Delivery Failure'].includes(n.name) });
  const allowed = w.meta.is68.exclusive_fan_in || {};
  for (const [node, ins] of Object.entries(incoming)) {
    const srcs = new Set(ins.map((x) => x.from + '#' + x.oi));
    if (srcs.size > 1 && byName[node] && byName[node].type !== 'n8n-nodes-base.merge' && !allowed[node]) E(`${node}: มี ${srcs.size} ขาเข้าแต่ไม่ใช่ Merge และไม่ได้ประกาศ exclusive_fan_in (บั๊ก B5)`);
  }
  for (const n of real) for (const r of nodeRefs(n)) if (!byName[r]) E(`${n.name}: อ้าง $('${r}') ที่ไม่มีในไฟล์`);
  // ค่าควบคุมอ่านจาก config/ เท่านั้น: CFG ที่ฝังในทุก Code node ต้องเท่ากับไฟล์ config ปัจจุบัน
  const cfgNow = { project: JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'project.json'), 'utf8')), models: JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'models.json'), 'utf8')), sheets: JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'sheets.json'), 'utf8')) };
  for (const n of real.filter((x) => x.type === 'n8n-nodes-base.code')) {
    const m = n.parameters.jsCode.match(/(?:^|\n)const CFG = (\{.*\});\n\/\/ ==== NODE GLUE/);
    if (!m) { if (/CFG\./.test(n.parameters.jsCode)) E(`${n.name}: ใช้ CFG แต่ไม่ได้ฝังค่าจาก config/`); continue; }
    const cfg = JSON.parse(m[1]);
    for (const k of ['project', 'models', 'sheets']) if (JSON.stringify(cfg[k]) !== JSON.stringify(cfgNow[k])) E(`${n.name}: CFG.${k} ไม่ตรงกับ config/${k}.json (build ใหม่)`);
  }
  // B7 Gmail รับ binary จาก Export Report PDF โดยตรง
  const toGmail = (incoming['Send Report Email'] || []).map((x) => x.from);
  if (JSON.stringify(toGmail) !== JSON.stringify(['Export Report PDF'])) E(`Send Report Email ต้องรับข้อมูลจาก Export Report PDF โดยตรง (ได้ ${toGmail}) (บั๊ก B7)`);
  for (const nm of ['Upload Report PDF', 'Send Report Email']) if (byName[nm] && byName[nm].onError !== 'continueRegularOutput') E(`${nm}: ต้องเป็น continueRegularOutput เพื่อให้ Merge ได้ครบสองขาเสมอ`);
  // ลูป
  const loop = byName['Loop Over Requests'];
  if (!loop || loop.type !== 'n8n-nodes-base.splitInBatches' || loop.parameters.batchSize !== 1) E('Loop Over Requests ต้องเป็น splitInBatches batchSize=1');
  const lo = (w.connections['Loop Over Requests'] || { main: [] }).main;
  if (!lo[1] || lo[1].map((t) => t.node).join() !== 'Create Run Row') E('ขา loop (output 1) ต้องไป Create Run Row');
  const back = (incoming['Loop Over Requests'] || []).map((x) => x.from).sort().join();
  if (back !== 'Is Delivery Failed?,Is New Request?,Notify Delivery Failure') E(`ขาเข้า Loop Over Requests ต้องมาจาก Is New Request? · Is Delivery Failed? · Notify Delivery Failure (ได้ ${back})`);
  if (((w.connections['Mark Run Delivered'] || { main: [[]] }).main[0] || []).map((t) => t.node).join() !== 'Is Delivery Failed?') E('Mark Run Delivered ต้องต่อไป Is Delivery Failed? (DEC-48 แจ้งผู้วิจัยเมื่อส่งไม่สำเร็จ)');
  const body = new Set(); const q = ['Create Run Row'];
  while (q.length) { const x = q.shift(); if (body.has(x) || x === 'Loop Over Requests') continue; body.add(x); (succ[x] || []).forEach((s) => q.push(s.to)); }
  if (!body.has('Mark Run Delivered')) E('จากขา loop ต้องไปถึง Mark Run Delivered ได้');
  const order = [...body];
  const dom = Object.fromEntries(order.map((x) => [x, new Set(order)]));
  dom['Create Run Row'] = new Set(['Create Run Row']);
  for (let changed = true; changed;) {
    changed = false;
    for (const x of order) {
      if (x === 'Create Run Row') continue;
      const preds = (incoming[x] || []).map((i) => i.from).filter((p) => body.has(p));
      if (!preds.length) continue;
      let d;
      if (byName[x].type === 'n8n-nodes-base.merge') { d = new Set(); preds.forEach((p) => dom[p].forEach((v) => d.add(v))); }
      else { d = new Set(dom[preds[0]]); preds.slice(1).forEach((p) => { for (const v of d) if (!dom[p].has(v)) d.delete(v); }); }
      d.add(x);
      if (d.size !== dom[x].size || [...d].some((v) => !dom[x].has(v))) { dom[x] = d; changed = true; }
    }
  }
  for (const x of order) for (const r of nodeRefs(byName[x])) {
    if (body.has(r) && !dom[x].has(r)) E(`${x}: อ้าง $('${r}') ซึ่งอาจไม่ได้ทำงานในรอบนี้ของ Loop Over Requests (จะได้ค่าของงานก่อนหน้า)`);
  }
  if (w.meta.is68.engine_sha256 !== ENGINE.sha256Hex(engineSrc)) E('engine_sha256 ใน meta ไม่ตรงกับ engine/engine.js');
  // DEC-48: จุดที่พบจากการทดสอบใน n8n 2.39.9 จริง
  for (const k of ['A', 'B', 'C']) {
    const js = (byName['Call Model ' + k] || { parameters: {} }).parameters.jsCode || '';
    if (!/returnFullResponse: true, ignoreHttpStatusErrors: true/.test(js) || !js.includes(`const KEY = '${k}';`) || js.includes('__KEY__')) E(`Call Model ${k}: ต้องอ่านรหัส HTTP จาก response เต็ม (task runner ไม่ส่งรหัส HTTP ของ error ข้าม RPC) และ KEY = ${k}`);
  }
  // DEC-51: ผู้ตรวจความหมาย (R3b) ใช้กลไกเรียกเดียวกับ Call Model และไม่เรียกเมื่อไม่มีข้อให้ตรวจ · Apply Rules ต้องรับผลผู้ตรวจ + คลัง (R5)
  for (const k of ['A', 'B', 'C']) {
    const js = (byName['Call Verifier ' + k] || { parameters: {} }).parameters.jsCode || '';
    if (!/returnFullResponse: true, ignoreHttpStatusErrors: true/.test(js) || !js.includes(`const KEY = '${k}';`) || js.includes('__KEY__') || !/status: 'skipped'/.test(js)) E(`Call Verifier ${k}: ต้องใช้กลไกเรียกแบบ Call Model · KEY = ${k} · ข้ามเมื่อไม่มีข้อให้ตรวจ`);
  }
  const preRules = (incoming['Apply Rules R0-R6'] || []).map((x) => x.from).join();
  if (preRules !== 'Load Mappings') E(`Apply Rules R0-R6 ต้องรับจาก Load Mappings (ได้ ${preRules})`);
  for (const nm of ['Apply Rules R0-R6', 'Prepare Relevance Checks', 'Build Prompt']) if (!/const SIGNALS_FOR = /.test((byName[nm] || { parameters: {} }).parameters.jsCode || '')) E(`${nm}: ต้องฝัง SIGNALS (data/role_tasks.csv ฯลฯ · DEC-54/55)`);
  if (!byName['Run Local OCR'] || byName['Run Local OCR'].onError !== 'continueRegularOutput') E('Run Local OCR: ต้องเป็น continueRegularOutput ให้ Mask Personal Data แจ้ง ocr_failed พร้อม run_id');
  for (const n of real) if (n.type === 'n8n-nodes-base.googleSheets' && /^append/.test(n.parameters.operation) && !(n.parameters.options && n.parameters.options.useAppend === true)) E(`${n.name}: append ต้องตั้ง useAppend (values:append) กันเขียนทับแถวเมื่อมีหลาย execution`);
  const ab = (w.connections['Notify Researcher'] || { main: [] }).main;
  if (!ab[0] || ab[0].map((t) => t.node).join() !== 'Build Aborted Rows' || ((w.connections['Build Aborted Rows'] || { main: [[]] }).main[0] || []).map((t) => t.node).join() !== 'Record Aborted Requests') E('ต้องต่อ Notify Researcher → Build Aborted Rows → Record Aborted Requests (งานที่ยังไม่ได้เริ่มต้องไม่หายเงียบ)');
  if (!/\? \$json\.execution\.id : 'none'/.test(String((byName['Get Failed Execution'] || { parameters: {} }).parameters.url))) E('Get Failed Execution: ถ้าไม่มี execution.id (trigger ล้ม) ต้องไม่เรียก /api/v1/executions/ แบบรายการ (ดึงข้อมูลทุก execution จน n8n หน่วยความจำเต็ม)');
  if (!/numpages/.test((byName['Choose Text Source'] || { parameters: {} }).parameters.jsCode || '')) E('Choose Text Source: ต้องนับหน้าซ้ำด้วย numpages ของ Extract From File');
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const wfs = loadWorkflows();
  const errs = [...validate(wfs), ...validateFinal(loadFinal(), wfs), ...validateSingle(loadSingle())];
  if (errs.length) { console.error('ไม่ผ่าน:\n  ' + errs.join('\n  ')); process.exit(1); }
  // DEC-38/42: workflows/ ต้องมี workflow JSON ไฟล์เดียว กันนำเข้าผิด
  const extra = fs.readdirSync(path.join(ROOT, 'workflows')).filter((f) => f.endsWith('.json') && ![SINGLE_FILE, 'manifest.json'].includes(f));
  if (extra.length) { console.error('ไม่ผ่าน: workflows/ มีไฟล์ workflow อื่นนอกจาก ' + SINGLE_FILE + ': ' + extra.join(', ') + ' (ย้ายเข้า archive/ ตาม DEC-42/48)'); process.exit(1); }
  const one = loadSingle();
  console.log('ผ่าน · ชุด 5 ไฟล์และ WF_Final_IS (สร้างในหน่วยความจำ · ไม่ใช้งาน) · บั๊ก B1 B3 B5 B6 B7 B9 B10');
  console.log(`ผ่าน · ${SINGLE_NAME} ${EXPECTED_SINGLE_NODES} node · 7 ช่วง · ไม่มีการเรียกข้าม workflow · ทุก $('โหนด') มีจริง · ไม่อ้างค่าข้ามรอบ · CFG ตรง config/ · engine ฝังตรงทุกไบต์ (${one.meta.is68.engine_sha256.slice(0, 12)})`);
}
