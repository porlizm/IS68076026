// validate_workflows.mjs — ตัวตรวจ workflow ทั้งห้า (ตาราง 3.9 · Spec A14 · บั๊ก B1 B3 B5 B6 B7 B9 B10 · C6) + WF_Final_IS (DEC-37)
//   node scripts/validate_workflows.mjs   (exit 1 ถ้าไม่ผ่าน)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ENGINE } from './lib/refs.mjs';
import { buildAll } from './build_workflows.mjs';

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

export function loadFinal() { return JSON.parse(fs.readFileSync(path.join(ROOT, 'workflows', FINAL_FILE), 'utf8')); }

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

if (import.meta.url === `file://${process.argv[1]}`) {
  const wfs = loadWorkflows();
  const errs = [...validate(wfs), ...validateFinal(loadFinal(), wfs)];
  if (errs.length) { console.error('ไม่ผ่าน:\n  ' + errs.join('\n  ')); process.exit(1); }
  // DEC-38: workflows/ ต้องมี workflow JSON ไฟล์เดียว กันนำเข้าผิด
  const extra = fs.readdirSync(path.join(ROOT, 'workflows')).filter((f) => f.endsWith('.json') && !['WF_Final_IS.json', 'manifest.json'].includes(f));
  if (extra.length) { console.error('ไม่ผ่าน: workflows/ มีไฟล์ workflow อื่นนอกจาก WF_Final_IS.json: ' + extra.join(', ') + ' (ย้ายเข้า archive/ ตาม DEC-38)'); process.exit(1); }
  console.log('ผ่าน · workflow 5 ไฟล์ (สร้างในหน่วยความจำ · ไม่ใช้งาน) · node 17/11/13/13/6 · engine ฝังตรงทุกไบต์ · บั๊ก B1 B3 B5 B6 B7 B9 B10 ผ่านการตรวจเชิงโครงสร้าง');
  console.log(`ผ่าน · WF_Final_IS ${EXPECTED_FINAL_NODES} node · ไม่มีการเรียกข้าม workflow · โหนดเดิมตรงชุด 5 ไฟล์ · ไม่มีการอ้างค่าข้ามรอบใน Loop Over Runs (DEC-37)`);
}
