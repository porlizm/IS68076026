// Mini n8n executor สำหรับทดสอบ WF_Demo.json แบบออฟไลน์ (รันโค้ดในโหนดจริงจากไฟล์ workflow)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export function loadWf(p) {
  const wf = JSON.parse(fs.readFileSync(p, 'utf8'));
  const byName = Object.fromEntries(wf.nodes.map((n) => [n.name, n]));
  return { wf, byName };
}

function evalExpr(expr, ctx) {
  if (typeof expr !== 'string' || !expr.startsWith('=')) return expr;
  const s = expr.slice(1);
  const one = s.match(/^\{\{([\s\S]*)\}\}$/);
  const f = (code) => new Function('$json', '$', 'return (' + code + ');')(ctx.$json, ctx.$);
  if (one && !one[1].includes('}}')) return f(one[1]);
  return s.replace(/\{\{([\s\S]*?)\}\}/g, (_, c) => String(f(c)));
}

export async function run(wfObj, startNode, startItem, mocks, log = () => {}) {
  const { wf, byName } = wfObj;
  const outputs = {};
  const $ = (name) => {
    const o = outputs[name];
    if (!o) throw new Error('$(' + name + ') ยังไม่ถูกรัน');
    return { first: () => o[0], item: o[0], all: () => o };
  };
  let queue = [[startNode, [startItem]]];
  let response = null;
  const trace = [];
  while (queue.length) {
    const [name, items] = queue.shift();
    const node = byName[name];
    const t0 = Date.now();
    let outs; // array of output branches
    const ctx = { $json: items[0] && items[0].json, $ };
    switch (node.type) {
      case 'n8n-nodes-base.webhook': outs = [items]; break;
      case 'n8n-nodes-base.code': {
        const fn = new AsyncFunction('$input', '$', '$json', node.parameters.jsCode);
        const thisCtx = { helpers: { getBinaryDataBuffer: async (i, k) => {
          const b = items[i].binary && items[i].binary[k]; if (!b) throw new Error('no binary ' + k);
          return Buffer.from(b.data, 'base64'); } } };
        const res = await fn.call(thisCtx, { first: () => items[0], all: () => items, item: items[0] }, $, items[0].json);
        outs = [res];
        break;
      }
      case 'n8n-nodes-base.if': {
        const c = node.parameters.conditions.conditions[0];
        const v = evalExpr(c.leftValue, ctx);
        outs = v === true || v === 'true' ? [items, []] : [[], items];
        break;
      }
      case 'n8n-nodes-base.extractFromFile': outs = [[await mocks.extract(items[0])]]; break;
      case 'n8n-nodes-base.httpRequest': {
        // n8n ส่งคำขอหนึ่งครั้งต่อหนึ่ง item (Gemini Analyst ได้ ANALYST_RUNS items · DEC-58)
        const res = [];
        for (const it of items) {
          const c = { $json: it.json, $ };
          const url = evalExpr(node.parameters.url, c);
          const body = JSON.parse(evalExpr(node.parameters.jsonBody, c));
          res.push({ json: await mocks.http(name, url, body, res.length) });
        }
        outs = [res];
        break;
      }
      case 'n8n-nodes-base.googleDrive': outs = [[{ json: await mocks.drive(items[0]) }]]; break;
      case 'n8n-nodes-base.respondToWebhook': {
        const p = node.parameters; let body, code = 200, headers = {};
        const opt = p.options || {};
        if (opt.responseCode !== undefined) code = Number(evalExpr(String(opt.responseCode), ctx)) || 200;
        (opt.responseHeaders && opt.responseHeaders.entries || []).forEach((e) => { headers[e.name] = e.value; });
        if (p.respondWith === 'firstIncomingItem') body = JSON.stringify(items[0].json);
        else if (p.respondWith === 'json') body = evalExpr(p.responseBody, ctx);
        else if (p.respondWith === 'text') body = evalExpr(p.responseBody, ctx);
        response = { code, headers, body, node: name };
        outs = [items];
        break;
      }
      default: throw new Error('unsupported ' + node.type);
    }
    outputs[name] = outs[0].length ? outs[0] : (outs[1] || []);
    trace.push(name + ' (' + (Date.now() - t0) + 'ms)');
    log(name);
    const conn = (wf.connections[name] || { main: [] }).main;
    conn.forEach((targets, idx) => {
      const its = outs[idx] || [];
      if (!its.length) return;
      targets.forEach((t) => queue.push([t.node, its]));
    });
  }
  return { response, trace, outputs };
}

// ---------- default mocks ----------
export function pdfText(buf) {
  const tmp = path.join(os.tmpdir(), 'h_' + Math.random().toString(36).slice(2) + '.pdf');
  fs.writeFileSync(tmp, buf);
  const text = execFileSync('pdftotext', ['-l', '5', tmp, '-']).toString();
  const info = execFileSync('pdfinfo', [tmp]).toString();
  const pages = Number((info.match(/Pages:\s+(\d+)/) || [])[1] || 1);
  return { text, numpages: pages };
}
