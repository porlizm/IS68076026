// validate_workflows.mjs — ตัวตรวจ workflow ทั้งห้า (ตาราง 3.9 · Spec A14 · บั๊ก B1 B3 B5 B6 B7 B9 B10 · C6)
//   node scripts/validate_workflows.mjs   (exit 1 ถ้าไม่ผ่าน)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ENGINE } from './lib/refs.mjs';

export const EXPECTED_NODES = { WF_Main_Intake: 17, WF_SUB_GapEngine: 11, WF_SUB_Decide: 13, WF_SUB_Deliver: 13, WF_Error: 6 };
const BEGIN = '// ==== ENGINE BEGIN (engine/engine.js · ห้ามแก้ในนี้ แก้ที่ไฟล์ต้นทางแล้ว build ใหม่) ====\n';
const END = '\n// ==== ENGINE END ====\n';

export function loadWorkflows() {
  return Object.fromEntries(Object.keys(EXPECTED_NODES).map((k) => [k, JSON.parse(fs.readFileSync(path.join(ROOT, 'workflows', k + '.json'), 'utf8'))]));
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
    for (const n of w.nodes) {
      const p = n.parameters || {};
      // C6 engine ฝังตรงทุกไบต์
      if (n.type === 'n8n-nodes-base.code') {
        const js = p.jsCode || '';
        if (js.includes('ENGINE.')) {
          const a = js.indexOf(BEGIN); const b = js.indexOf(END);
          if (a !== 0 || b < 0) E(name, `${n.name}: ไม่พบ engine ที่ฝังไว้`);
          else if (js.slice(BEGIN.length, b) !== engineSrc) E(name, `${n.name}: engine ที่ฝังไม่ตรงกับ engine/engine.js`);
        }
        try { new Function('return (async function(){' + js + '\n})'); } catch (e) { E(name, `${n.name}: JavaScript syntax ${e.message}`); }
      }
      // B1 IF: boolean operator แบบ singleValue + strict
      if (n.type === 'n8n-nodes-base.if') {
        const conds = (p.conditions && p.conditions.conditions) || [];
        if (!conds.length || conds.some((c) => !(c.operator && c.operator.type === 'boolean' && c.operator.singleValue === true && c.operator.operation === 'true')))
          E(name, `${n.name}: IF ต้องใช้ operator boolean/true แบบ singleValue (บั๊ก B1)`);
        if (!p.conditions.options || p.conditions.options.typeValidation !== 'strict') E(name, `${n.name}: typeValidation ต้องเป็น strict`);
      }
      // B3 Google Sheets / Drive (อ่าน) / Trigger ต้องใช้ serviceAccount
      if (['n8n-nodes-base.googleSheets', 'n8n-nodes-base.googleSheetsTrigger'].includes(n.type) && p.authentication !== 'serviceAccount')
        E(name, `${n.name}: Google Sheets ต้อง authentication=serviceAccount (บั๊ก B3)`);
      if (n.type === 'n8n-nodes-base.googleDrive') {
        if (p.operation === 'download' && p.authentication !== 'serviceAccount') E(name, `${n.name}: ดาวน์โหลดไฟล์แบบฟอร์มต้องใช้ serviceAccount`);
        if (p.operation === 'upload' && p.authentication !== 'oAuth2') E(name, `${n.name}: อัปโหลดต้องใช้ Drive OAuth2 ของผู้วิจัย (บั๊ก B10)`);
      }
      if (n.type === 'n8n-nodes-base.httpRequest' && /upload\/drive|drive\/v3\/files/.test(String(p.url)) && p.nodeCredentialType !== 'googleDriveOAuth2Api')
        E(name, `${n.name}: Drive API ต้องใช้ googleDriveOAuth2Api (บั๊ก B10)`);
      if (n.type === 'n8n-nodes-base.httpRequest' && /documentai/.test(String(p.url)) && p.nodeCredentialType !== 'googleApi')
        E(name, `${n.name}: Document AI ต้องใช้บัญชีบริการ googleApi`);
      // Gmail: เฉพาะ Deliver/Error · OAuth2 (3.6.3)
      if (n.type === 'n8n-nodes-base.gmail') {
        if (!['WF_SUB_Deliver', 'WF_Error'].includes(name)) E(name, `${n.name}: email node อยู่ได้เฉพาะ Deliver/Error`);
        if (p.authentication !== 'oAuth2') E(name, `${n.name}: Gmail ต้องใช้ OAuth2`);
      }
      // B9 onError=continueErrorOutput ต้องต่อ error output
      if (n.onError === 'continueErrorOutput') {
        const outs = (w.connections[n.name] || { main: [] }).main;
        if (!outs[1] || outs[1].length === 0) E(name, `${n.name}: onError=continueErrorOutput แต่ไม่ได้ต่อ error output (บั๊ก B9)`);
      }
      // B6 execute workflow ต้องทำงานทีละ item และรอผล
      if (n.type === 'n8n-nodes-base.executeWorkflow') {
        if (p.mode !== 'each') E(name, `${n.name}: mode ต้องเป็น each (บั๊ก B6)`);
        if (!(p.options && p.options.waitForSubWorkflow)) E(name, `${n.name}: ต้องรอ sub-workflow`);
        if (!ids.has(p.workflowId.value)) E(name, `${n.name}: workflowId ${p.workflowId.value} ไม่มีในชุด`);
      }
    }
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const errs = validate(loadWorkflows());
  if (errs.length) { console.error('ไม่ผ่าน:\n  ' + errs.join('\n  ')); process.exit(1); }
  console.log('ผ่าน · workflow 5 ไฟล์ · node 17/11/13/13/6 · engine ฝังตรงทุกไบต์ · บั๊ก B1 B3 B5 B6 B7 B9 B10 ผ่านการตรวจเชิงโครงสร้าง');
}
