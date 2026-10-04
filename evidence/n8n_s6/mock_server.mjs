// S6 mock services for WF_IS_68076026_01OCT26 — Google (OAuth token, Sheets v4, Drive v3, Gmail v1, Document AI),
// OpenAI / Anthropic / Gemini, local OCR. HTTPS :443 (SNI cert signed by test CA) + control API http://127.0.0.1:8999
// ไม่ใช่บริการจริง: ใช้เพื่อทดสอบกลไกของ n8n (ลูป · Merge · Error Trigger · โหนด Google) ใน n8n 2.39.9 จริง
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.env.FIS_ROOT || '/home/claude/fis';
const CERT = process.env.CERT_DIR || '/home/claude/s6/certs';
const LOG = process.env.MOCK_LOG || '/home/claude/s6/mock/requests.log';
const sheetsCfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/sheets.json'), 'utf8'));

// ------------------------------------------------------------------ CSV
function parseCSV(txt) {
  const rows = []; let row = []; let cur = ''; let q = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) { if (ch === '"') { if (txt[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; continue; }
    if (ch === '"') q = true; else if (ch === ',') { row.push(cur); cur = ''; } else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else if (ch !== '\r') cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.length > 1 || r[0] !== '');
}
// การนำเข้า CSV ของ Google Sheets แปลงข้อความที่เป็นตัวเลขเป็นตัวเลข
const autoType = (v) => (/^-?\d+(\.\d+)?$/.test(v) && !/^0\d/.test(v) ? Number(v) : v);

// ------------------------------------------------------------------ state
let S;
function reset() {
  S = { sheets: {}, files: {}, mail: [], docai: [], models: [], faults: {}, seq: 1, log: [] };
  let sid = 100;
  for (const [tab, def] of Object.entries(sheetsCfg.tabs)) {
    let rows = [def.columns.slice()];
    const csv = path.join(ROOT, 'sheets_import', tab + '.csv');
    if (fs.existsSync(csv) && def.group === 'reference') rows = parseCSV(fs.readFileSync(csv, 'utf8')).map((r, i) => (i === 0 ? r : r.map(autoType)));
    S.sheets[tab] = { sheetId: sid++, rows, rowCount: Math.max(1000, rows.length + 10), colCount: Math.max(26, def.columns.length) };
  }
  // ไฟล์เรซูเมสังเคราะห์ใน "Drive" (โฟลเดอร์รับไฟล์ของแบบฟอร์ม)
  for (const c of ['A', 'B', 'C', 'D']) {
    const meta = JSON.parse(fs.readFileSync(path.join(ROOT, `synthetic/case_${c}/meta.json`), 'utf8'));
    const pdf = c === 'C' ? 'resume_scanned.pdf' : 'resume_text.pdf';
    addFile(meta.file_id, `resume_${c}.pdf`, 'application/pdf', fs.readFileSync(path.join(ROOT, `synthetic/case_${c}/${pdf}`)), ['FORM_FOLDER']);
  }
  if (fs.existsSync('/home/claude/s6/fixtures/six_pages_objstm.pdf')) addFile('SYNTH_FILE_SIXOBJSTM_00000000000000', 'six_objstm.pdf', 'application/pdf', fs.readFileSync('/home/claude/s6/fixtures/six_pages_objstm.pdf'), ['FORM_FOLDER']);
  if (fs.existsSync('/home/claude/s6/fixtures/six_pages.pdf')) addFile('SYNTH_FILE_SIXPAGES_000000000000000', 'six.pdf', 'application/pdf', fs.readFileSync('/home/claude/s6/fixtures/six_pages.pdf'), ['FORM_FOLDER']);
}
function addFile(id, name, mimeType, buf, parents) { S.files[id] = { id, name, mimeType, body: buf, parents: parents || [], createdTime: new Date().toISOString() }; return S.files[id]; }
const newId = (p) => p + crypto.randomBytes(14).toString('hex');

// ------------------------------------------------------------------ A1
const colToN = (s) => { let n = 0; for (const ch of s.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64); return n; };
function parseRange(raw) {
  let r = decodeURIComponent(raw);
  let sheet; let area = '';
  const m = r.match(/^'((?:[^']|'')*)'(?:!(.*))?$/) || r.match(/^([^!]+?)(?:!(.*))?$/);
  sheet = m[1].replace(/''/g, "'"); area = m[2] || '';
  if (!area && /^'.*!.*'$/.test(r)) { const inner = r.slice(1, -1); [sheet, area] = inner.split('!'); }
  const a = { sheet, c1: 1, r1: 1, c2: Infinity, r2: Infinity };
  if (area) {
    const [p, q] = area.split(':');
    const cell = (x) => { const mm = (x || '').match(/^([A-Za-z]*)(\d*)$/) || ['', '', '']; return { c: mm[1] ? colToN(mm[1]) : null, r: mm[2] ? Number(mm[2]) : null }; };
    const A = cell(p); const B = q !== undefined ? cell(q) : A;
    a.c1 = A.c || 1; a.r1 = A.r || 1; a.c2 = B.c || Infinity; a.r2 = B.r || Infinity;
    if (q === undefined) { a.c2 = A.c || Infinity; a.r2 = A.r || Infinity; }
  }
  return a;
}
function trimRows(vals) {
  const out = vals.map((r) => { const x = r.slice(); while (x.length && (x[x.length - 1] === '' || x[x.length - 1] === undefined || x[x.length - 1] === null)) x.pop(); return x; });
  while (out.length && out[out.length - 1].length === 0) out.pop();
  return out;
}
function readArea(a, render, dtRender) {
  const sh = S.sheets[a.sheet]; if (!sh) return null;
  const vals = [];
  const r2 = Math.min(a.r2, sh.rows.length);
  for (let r = a.r1; r <= r2; r++) {
    const row = sh.rows[r - 1] || [];
    const c2 = Math.min(a.c2, Math.max(row.length, 0));
    const out = [];
    for (let c = a.c1; c <= c2; c++) {
      let v = row[c - 1]; if (v === undefined || v === null) v = '';
      if (v && typeof v === 'object' && v.__date) v = (render === 'FORMATTED_VALUE' || dtRender === 'FORMATTED_STRING') ? v.text : v.serial;
      else if (render === 'FORMATTED_VALUE' && typeof v !== 'string') v = String(v);
      out.push(v);
    }
    vals.push(out);
  }
  return trimRows(vals);
}
function writeArea(sheet, startRow, startCol, values) {
  const sh = S.sheets[sheet];
  values.forEach((vr, i) => {
    const r = startRow + i - 1;
    while (sh.rows.length <= r) sh.rows.push([]);
    const row = sh.rows[r];
    vr.forEach((v, j) => { const c = startCol + j - 1; while (row.length < c) row.push(''); row[c] = v === null ? '' : v; });
  });
  if (sh.rows.length > sh.rowCount) sh.rowCount = sh.rows.length + 10;
}
const lastUsedRow = (sh) => { let n = sh.rows.length; while (n > 0 && trimRows([sh.rows[n - 1]]).length === 0) n--; return n; };

// ------------------------------------------------------------------ helpers
function send(res, status, body, headers = {}) {
  const isBuf = Buffer.isBuffer(body);
  const data = isBuf ? body : (typeof body === 'string' ? body : JSON.stringify(body));
  res.writeHead(status, { 'Content-Type': isBuf ? (headers['Content-Type'] || 'application/octet-stream') : 'application/json; charset=UTF-8', ...headers });
  res.end(data);
}
const gErr = (res, status, message) => send(res, status, { error: { code: status, message, status: status === 404 ? 'NOT_FOUND' : status === 403 ? 'PERMISSION_DENIED' : status === 429 ? 'RESOURCE_EXHAUSTED' : 'INVALID_ARGUMENT' } });
function readBody(req) { return new Promise((ok) => { const ch = []; req.on('data', (c) => ch.push(c)); req.on('end', () => ok(Buffer.concat(ch))); }); }
function parseMultipart(buf, ctype) {
  const b = (ctype.match(/boundary="?([^";]+)"?/) || [])[1]; if (!b) return [];
  const parts = []; const sep = Buffer.from('--' + b);
  let idx = buf.indexOf(sep);
  while (idx !== -1) {
    const next = buf.indexOf(sep, idx + sep.length); if (next === -1) break;
    const chunk = buf.subarray(idx + sep.length, next);
    const he = chunk.indexOf('\r\n\r\n');
    if (he !== -1) {
      const head = chunk.subarray(0, he).toString();
      let body = chunk.subarray(he + 4); if (body.subarray(-2).toString() === '\r\n') body = body.subarray(0, -2);
      parts.push({ type: ((head.match(/content-type:\s*([^\r\n;]+)/i) || [])[1] || '').trim(), body });
    }
    idx = next;
  }
  return parts;
}
// PDF ง่าย ๆ 1 หน้า (แทนผลส่งออกของ Google Docs)
function tinyPdf(label) {
  const t = String(label).replace(/[()\\]/g, '');
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>', null, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const stream = `BT /F1 12 Tf 50 800 Td (${t}) Tj ET`; objs[3] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  let out = '%PDF-1.4\n'; const off = [];
  objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length; out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + off.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}
function caseOf(text) {
  for (const c of ['A', 'B', 'C', 'D']) { const m = JSON.parse(fs.readFileSync(path.join(ROOT, `synthetic/case_${c}/meta.json`), 'utf8')); if (text.includes(`REQ-${m.role_id}-`)) return c; }
  return 'A';
}
// DEC-51/60 · ผู้ตรวจความหมาย (R3b): ตอบตามเฉลยของกรณี เหมือน scripts/run_local.mjs oracleVerifierText
function textOf(o) { if (typeof o === 'string') return o; if (Array.isArray(o)) return o.map(textOf).join('\n'); if (o && typeof o === 'object') return Object.values(o).map(textOf).join('\n'); return ''; }
function rowsOf(file) { if (!fs.existsSync(file)) return []; const r = parseCSV(fs.readFileSync(file, 'utf8')); const h = r[0]; return r.slice(1).map((x) => Object.fromEntries(h.map((k, i) => [k, x[i]]))); }
function mockVerifier(key, text) {
  const list = JSON.parse(text.slice(text.indexOf('CHECKS (JSON):') + 'CHECKS (JSON):'.length).trim());
  let c = 'A';
  for (const cc of ['A', 'B', 'C', 'D']) { const rt = fs.readFileSync(path.join(ROOT, `synthetic/case_${cc}/resume.txt`), 'utf8'); if (list.length && list.every((x) => rt.replace(/\s+/g, ' ').includes(String(x.quote).replace(/\s+/g, ' ').slice(0, 40)))) { c = cc; break; } }
  if (S.faults.models_all_fail) return { status: 401, text: null, c, verifier: true };
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, `synthetic/case_${c}/mock_responses/verifier.json`), 'utf8'));
  if ((cfg.invalid_for || []).includes(key)) return { status: 200, text: 'I think most quotes are fine.', c, verifier: true };
  const k = [...rowsOf(path.join(ROOT, `synthetic/case_${c}/answer_key.csv`)), ...rowsOf(path.join(ROOT, `synthetic/case_${c}/task_key.csv`))];
  const out = { schema_version: 'verifier_v1.0', checks: list.map((x) => { const ws = (t) => String(t).replace(/\s+/g, ' ').trim(); const r = k.find((r) => r.evidence_sentence && (ws(x.quote).includes(ws(r.evidence_sentence)) || ws(r.evidence_sentence).includes(ws(x.quote))) && (r.element_name ? String(x.target).startsWith(r.element_name + ':') : x.target === r.task_text));
    return { check_id: x.check_id, verdict: !r ? 'unrelated' : (r.expected_status === 'evidenced' ? 'supports' : r.expected_status === 'partially' ? 'partially_supports' : 'unrelated') }; }) };
  return { status: 200, text: JSON.stringify(out), c, verifier: true };
}
function mockModel(key, promptText) {
  if (promptText.includes('CHECKS (JSON):')) return mockVerifier(key, promptText);
  const c = caseOf(promptText);
  const f = path.join(ROOT, `synthetic/case_${c}/mock_responses/${key}.json`);
  const mock = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { simulate: 'http_error', status: 500 };
  if (S.faults.models_all_fail) return { status: 401, text: null, c };
  if (mock.simulate === 'http_error') return { status: mock.status, text: null, c };
  return { status: 200, text: mock.text, c };
}

// ------------------------------------------------------------------ router
async function handle(req, res) {
  const host = (req.headers.host || '').split(':')[0];
  const u = new URL(req.url, `https://${host}`);
  const body = await readBody(req);
  const p = u.pathname;
  const entry = { t: new Date().toISOString(), host, method: req.method, path: p + u.search.slice(0, 160), len: body.length };
  S.log.push(entry); fs.appendFileSync(LOG, JSON.stringify(entry) + '\n');
  const auth = req.headers.authorization || '';
  try {
    // ---- OAuth token (service account JWT / refresh)
    if (host === 'oauth2.googleapis.com' && p === '/token') return send(res, 200, { access_token: 'ya29.mock-' + crypto.randomBytes(6).toString('hex'), expires_in: 3599, token_type: 'Bearer', scope: 'mock' });
    if (host.endsWith('googleapis.com') && !u.searchParams.get('upload_id') && !/^Bearer /.test(auth) && !u.searchParams.get('key') && !req.headers['x-goog-api-key']) return gErr(res, 401, 'missing bearer token');

    // ---- Sheets v4
    if (host === 'sheets.googleapis.com') {
      let m;
      if ((m = p.match(/^\/v4\/spreadsheets\/([^/:]+)$/)) && req.method === 'GET') {
        if (m[1] !== process.env.SHEET_ID) return gErr(res, 404, 'Requested entity was not found.');
        return send(res, 200, { spreadsheetId: m[1], sheets: Object.entries(S.sheets).map(([title, s], i) => ({ properties: { sheetId: s.sheetId, title, index: i, sheetType: 'GRID', gridProperties: { rowCount: s.rowCount, columnCount: s.colCount } } })) });
      }
      if ((m = p.match(/^\/v4\/spreadsheets\/([^/:]+):batchUpdate$/)) && req.method === 'POST') {
        const b = JSON.parse(body.toString() || '{}');
        for (const r of b.requests || []) if (r.appendDimension) { const sh = Object.values(S.sheets).find((s) => s.sheetId === r.appendDimension.sheetId); if (sh) { if (r.appendDimension.dimension === 'ROWS') sh.rowCount += r.appendDimension.length; else sh.colCount += r.appendDimension.length; } }
        return send(res, 200, { spreadsheetId: m[1], replies: (b.requests || []).map(() => ({})) });
      }
      if ((m = p.match(/^\/v4\/spreadsheets\/([^/:]+)\/values:batchUpdate$/)) && req.method === 'POST') {
        const b = JSON.parse(body.toString() || '{}'); let n = 0;
        for (const d of b.data || []) { const a = parseRange(d.range); if (!S.sheets[a.sheet]) return gErr(res, 400, 'Unable to parse range: ' + d.range); writeArea(a.sheet, a.r1, a.c1, d.values || []); n += (d.values || []).length; }
        return send(res, 200, { spreadsheetId: m[1], totalUpdatedRows: n, responses: [] });
      }
      if ((m = p.match(/^\/v4\/spreadsheets\/([^/:]+)\/values\/(.+?)(:append|:clear)?$/))) {
        const a = parseRange(m[2]);
        if (!S.sheets[a.sheet]) return gErr(res, 400, 'Unable to parse range: ' + decodeURIComponent(m[2]));
        const f = S.faults.sheet_read_fail; if (f && f === a.sheet && req.method === 'GET') return gErr(res, 403, 'The caller does not have permission');
        if (req.method === 'GET') return send(res, 200, { range: decodeURIComponent(m[2]), majorDimension: 'ROWS', values: readArea(a, u.searchParams.get('valueRenderOption') || 'FORMATTED_VALUE', u.searchParams.get('dateTimeRenderOption')) });
        const b = JSON.parse(body.toString() || '{}');
        if (m[3] === ':append') {
          const sh = S.sheets[a.sheet]; const start = Math.max(lastUsedRow(sh) + 1, a.r1 === 1 && a.r2 === Infinity ? 1 : a.r1);
          writeArea(a.sheet, start, a.c1, b.values || []);
          return send(res, 200, { spreadsheetId: m[1], updates: { updatedRange: `${a.sheet}!A${start}`, updatedRows: (b.values || []).length } });
        }
        if (m[3] === ':clear') return send(res, 200, {});
        if (req.method === 'PUT') { writeArea(a.sheet, a.r1, a.c1, b.values || []); return send(res, 200, { spreadsheetId: m[1], updatedRange: decodeURIComponent(m[2]), updatedRows: (b.values || []).length }); }
      }
    }

    // ---- Drive v3
    if (host === 'www.googleapis.com' && p.startsWith('/upload/drive/v3/files')) {
      const ut = u.searchParams.get('uploadType');
      if (ut === 'multipart') {
        const parts = parseMultipart(body, req.headers['content-type'] || '');
        const meta = JSON.parse(parts[0].body.toString() || '{}');
        if (S.faults.drive_bad_folder && (meta.parents || []).includes(S.faults.drive_bad_folder)) return gErr(res, 404, 'File not found: ' + S.faults.drive_bad_folder);
        const id = newId('mockfile_');
        const f = addFile(id, meta.name || 'untitled', meta.mimeType || parts[1].type, parts[1].body, meta.parents);
        f.sourceType = parts[1].type;
        return send(res, 200, { kind: 'drive#file', id, name: f.name, mimeType: f.mimeType });
      }
      if (ut === 'resumable' && !u.searchParams.get('upload_id')) {
        const meta = JSON.parse(body.toString() || '{}');
        const sess = newId('sess_'); S.files['__' + sess] = { meta, chunks: [] };
        return send(res, 200, {}, { Location: `https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=${sess}` });
      }
      const up = u.searchParams.get('upload_id');
      if (up && req.method === 'PUT') {
        const s = S.files['__' + up]; if (!s) return gErr(res, 404, 'session');
        if (S.faults.drive_bad_folder && (s.meta.parents || []).includes(S.faults.drive_bad_folder)) return gErr(res, 404, 'File not found: ' + S.faults.drive_bad_folder);
        if (S.faults.drive_pdf_upload_fail) return gErr(res, 403, 'The user has exceeded their Drive storage quota');
        s.chunks.push(body);
        const id = newId('mockpdf_'); addFile(id, s.meta.name, req.headers['content-type'] || 'application/pdf', Buffer.concat(s.chunks), s.meta.parents);
        delete S.files['__' + up];
        return send(res, 200, { kind: 'drive#file', id, name: s.meta.name });
      }
    }
    if (host === 'www.googleapis.com' && p.startsWith('/drive/v3/files')) {
      const m = p.match(/^\/drive\/v3\/files\/([^/]+)(\/export)?$/);
      if (m) {
        const f = S.files[m[1]];
        if (!f) return gErr(res, 404, 'File not found: ' + m[1]);
        if (req.method === 'DELETE') { delete S.files[m[1]]; res.writeHead(204); return res.end(); }
        if (m[2]) return send(res, 200, tinyPdf('IS68076026 report ' + f.name), { 'Content-Type': 'application/pdf' });
        if (req.method === 'PATCH') {
          const b = JSON.parse(body.toString() || '{}'); if (b.name) f.name = b.name;
          const add = u.searchParams.get('addParents'); if (add) f.parents = add.split(',');
          if (S.faults.drive_bad_folder && f.parents.includes(S.faults.drive_bad_folder)) return gErr(res, 404, 'File not found: ' + S.faults.drive_bad_folder);
          return send(res, 200, { kind: 'drive#file', id: f.id, name: f.name, mimeType: f.mimeType, parents: f.parents, webViewLink: `https://drive.google.com/file/d/${f.id}/view`, size: String(f.body.length) });
        }
        if (u.searchParams.get('alt') === 'media') return send(res, 200, f.body, { 'Content-Type': f.mimeType });
        return send(res, 200, { id: f.id, name: f.name, mimeType: f.mimeType });
      }
    }

    // ---- Gmail
    if (host === 'www.googleapis.com' && p === '/gmail/v1/users/me/messages/send') {
      const b = JSON.parse(body.toString() || '{}');
      const raw = Buffer.from(String(b.raw || '').replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
      const id = 'msg' + (S.seq++);
      S.mail.push({ id, to: (raw.match(/^To: (.*)$/mi) || [])[1] || '', subject: (raw.match(/^Subject: (.*)$/mi) || [])[1] || '', has_pdf: /application\/pdf/.test(raw), bytes: raw.length });
      return send(res, 200, { id, threadId: 't' + id, labelIds: ['SENT'] });
    }

    // ---- Document AI
    if (host === 'us-documentai.googleapis.com' && /:process$/.test(p)) {
      if (S.faults.docai_fail) return gErr(res, 503, 'The service is currently unavailable.');
      const b = JSON.parse(body.toString() || '{}');
      const pdf = Buffer.from(b.rawDocument.content, 'base64');
      const sha = crypto.createHash('sha256').update(pdf).digest('hex');
      let text = '';
      for (const c of ['A', 'B', 'C']) for (const fn of ['resume_text.pdf', 'resume_scanned.pdf']) {
        const fp = path.join(ROOT, `synthetic/case_${c}/${fn}`);
        if (fs.existsSync(fp) && crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex') === sha) text = fs.readFileSync(path.join(ROOT, `synthetic/case_${c}/resume.txt`), 'utf8');
      }
      S.docai.push({ sha, chars: text.length });
      return send(res, 200, { document: { text, pages: [{ pageNumber: 1 }], revisions: [{ id: 'mock-rev-1' }] } });
    }

    // ---- Local OCR (สำรอง)
    if (host === 'localocr.test' && p === '/ocr') {
      if (S.faults.local_ocr_fail) return send(res, 503, { error: 'down' });
      return send(res, 200, { text: fs.readFileSync(path.join(ROOT, 'synthetic/case_C/resume.txt'), 'utf8'), engine: 'local_ocr', engine_version: 'mock-tesseract' });
    }
    // ---- Models
    if (host === 'api.openai.com' && p === '/v1/chat/completions') {
      const b = JSON.parse(body.toString()); const r = mockModel('A', textOf(b.messages));
      S.models.push({ key: 'A', purpose: r.verifier ? 'verifier' : 'analyst', case: r.c, status: r.status, temperature: b.temperature, model: b.model });
      if (r.status !== 200) return send(res, r.status, { error: { message: 'mock error', type: 'mock', code: r.status } });
      return send(res, 200, { id: 'chatcmpl-mock', object: 'chat.completion', model: (b.model || 'gpt-mock') + '-2026-mock', choices: [{ index: 0, message: { role: 'assistant', content: r.text }, finish_reason: 'stop' }], usage: { prompt_tokens: 3000, completion_tokens: 900, total_tokens: 3900 } });
    }
    if (host === 'api.anthropic.com' && p === '/v1/messages') {
      const b = JSON.parse(body.toString()); const r = mockModel('B', (b.system ? textOf(b.system) + '\n' : '') + textOf(b.messages));
      S.models.push({ key: 'B', purpose: r.verifier ? 'verifier' : 'analyst', case: r.c, status: r.status, temperature: b.temperature, model: b.model, has_version: !!req.headers['anthropic-version'] });
      if (r.status !== 200) return send(res, r.status, { type: 'error', error: { type: 'mock_error', message: 'mock' } });
      return send(res, 200, { id: 'msg_mock', type: 'message', role: 'assistant', model: b.model, content: [{ type: 'text', text: r.text }], stop_reason: 'end_turn', usage: { input_tokens: 3100, output_tokens: 950 } });
    }
    if (host === 'generativelanguage.googleapis.com' && /:generateContent$/.test(p)) {
      const b = JSON.parse(body.toString()); const r = mockModel('C', textOf(b.systemInstruction || '') + '\n' + textOf(b.contents));
      S.models.push({ key: 'C', purpose: r.verifier ? 'verifier' : 'analyst', case: r.c, status: r.status, temperature: b.generationConfig && b.generationConfig.temperature, model: p });
      if (r.status !== 200) return send(res, r.status, { error: { code: r.status, message: 'Resource has been exhausted (mock)', status: 'RESOURCE_EXHAUSTED' } });
      return send(res, 200, { candidates: [{ content: { parts: [{ text: r.text }], role: 'model' }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 3050, candidatesTokenCount: 920 }, modelVersion: p.split('/').pop().replace(':generateContent', '') });
    }
    return send(res, 404, { error: { code: 404, message: 'mock: unknown endpoint ' + req.method + ' ' + host + p } });
  } catch (e) {
    fs.appendFileSync(LOG, JSON.stringify({ err: String(e.stack || e) }) + '\n');
    return send(res, 500, { error: { code: 500, message: 'mock crash: ' + e.message } });
  }
}

// ------------------------------------------------------------------ control API (test harness)
async function control(req, res) {
  const u = new URL(req.url, 'http://127.0.0.1');
  const body = await readBody(req);
  const b = body.length ? JSON.parse(body.toString()) : {};
  if (u.pathname === '/reset') { reset(); return send(res, 200, { ok: true }); }
  if (u.pathname === '/faults') { S.faults = b; return send(res, 200, S.faults); }
  if (u.pathname === '/form') { // เพิ่มแถวแบบฟอร์ม (Timestamp เป็นวันที่แบบ Google Forms)
    const cols = sheetsCfg.tabs.form_responses.columns;
    const rows = (b.rows || []).map((r) => cols.map((c) => r[c] === undefined ? '' : r[c]));
    rows.forEach((r) => { const d = new Date(); r[0] = { __date: true, serial: 25569 + (d.getTime() + 7 * 3600e3) / 86400e3, text: d.toLocaleString('en-US', { timeZone: 'Asia/Bangkok', hour12: false }).replace(',', '') }; });
    const sh = S.sheets.form_responses; writeArea('form_responses', lastUsedRow(sh) + 1, 1, rows);
    return send(res, 200, { ok: true, rows: rows.length });
  }
  if (u.pathname === '/state') {
    const tab = (t) => { const rows = S.sheets[t].rows; const h = rows[0]; return rows.slice(1).filter((r) => trimRows([r]).length).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] === undefined ? '' : r[i]]))); };
    const tabs = Object.fromEntries(Object.keys(S.sheets).filter((t) => sheetsCfg.tabs[t].group !== 'reference').map((t) => [t, tab(t)]));
    return send(res, 200, { tabs, files: Object.values(S.files).filter((f) => f.id && !f.id.startsWith('SYNTH')).map((f) => ({ id: f.id, name: f.name, mimeType: f.mimeType, parents: f.parents, bytes: f.body.length, sourceType: f.sourceType })), mail: S.mail, docai: S.docai, models: S.models, requests: S.log.length });
  }
  if (u.pathname === '/requests') return send(res, 200, S.log.slice(-Number(u.searchParams.get('n') || 200)));
  return send(res, 404, { error: 'unknown' });
}

reset();
fs.writeFileSync(LOG, '');
https.createServer({ key: fs.readFileSync(path.join(CERT, 'srv.key')), cert: fs.readFileSync(path.join(CERT, 'srv.crt')) }, handle).listen(443, process.env.MOCK_IP || '127.0.0.2', () => console.log('mock https ' + (process.env.MOCK_IP || '127.0.0.2') + ':443'));
http.createServer(handle).listen(80, process.env.MOCK_IP || '127.0.0.2');
http.createServer(control).listen(8999, '127.0.0.1', () => console.log('control :8999'));
