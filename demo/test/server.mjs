// ใช้: cd demo/test && npm i busboy && MOCK=gemini|fast|error node server.mjs  (ต้องมี pdftotext/pdfinfo)
// เซิร์ฟเวอร์จำลอง n8n (port 5678) — เสิร์ฟ WF_Demo.json ด้วย mini executor + CSP sandbox แบบเดียวกับ n8n 2.39
import http from 'node:http';
import fs from 'node:fs';
import Busboy from 'busboy';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const DEMO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTDIR = path.join(DEMO, 'test', 'out');
import { loadWf, run, pdfText } from './harness.mjs';

const WF = process.env.WF || path.join(DEMO, 'WF_Demo.json');
const MODE = process.env.MOCK || 'gemini';
const DATA = JSON.parse(fs.readFileSync(path.join(DEMO, 'build', 'demo_data.json'), 'utf8'));
const CSP = 'sandbox allow-downloads allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-scripts allow-top-navigation-by-user-activation allow-top-navigation-to-custom-protocols';
fs.mkdirSync(OUTDIR, { recursive: true });

const OCR_SOURCE = path.join(DEMO, 'samples', 'resume_AI_ML_Engineer.pdf');
const tok = (s) => new Set(String(s).toLowerCase().match(/[a-z][a-z+#.-]{2,}/g) || []);
const STOP = new Set('and the for with from that this into using used other such information work'.split(' '));
function mockAnalyst(body) {
  const prompt = body.contents[0].parts[0].text;
  const roleId = prompt.match(/OCCUPATION CODE: (\S+)/)[1];
  const resume = prompt.split('RESUME START\n')[1].split('\nRESUME END')[0];
  const role = DATA.roles[roleId];
  const lines = resume.split('\n').map((l) => l.trim()).filter((l) => l.length >= 25);
  let hallucinated = 0;
  const assessments = role.requirements.map((r) => {
    const T = new Set([...tok(r.name + ' ' + r.desc + ' ' + r.aliases.split('|').join(' '))].filter((x) => !STOP.has(x)));
    let best = null, bs = 0;
    for (const l of lines) { const L = tok(l); let s = 0; L.forEach((x) => { if (T.has(x)) s++; }); if (s > bs) { bs = s; best = l; } }
    if (bs >= 2) return { requirement_id: r.id, status: /\d/.test(best) ? 'evidenced' : 'partially', quotes: [best.slice(0, 160)], evidence_type: 'action', confidence: 0.8 };
    if (hallucinated === 0) { hallucinated++; return { requirement_id: r.id, status: 'evidenced', quotes: ['Led a national research lab and published twelve peer-reviewed papers on this topic.'], confidence: 0.7 }; }
    if (hallucinated === 1 && lines.length) { hallucinated++; return { requirement_id: r.id, status: 'partially', quotes: [lines.find((l) => /University|Institute/.test(l)) || lines[0]], confidence: 0.5 }; }
    return { requirement_id: r.id, status: 'missing', quotes: [], confidence: 0.6 };
  });
  const certLine = resume.split('\n').map((l) => l.replace(/^-\s*/, '').trim()).filter((l) => /Certified|Certificate|PSM|ITIL|CCNA|NSE/.test(l));
  const profile = {
    current_role: resume.split('\n').map((x) => x.trim()).filter(Boolean)[1] || '',
    years_experience: null,
    certifications: [...certLine.slice(0, 2), 'TensorFlow Developer Certificate'],
    headline_th: 'ผู้สมัครมีประสบการณ์ทำงานจริงที่เกี่ยวข้องกับอาชีพเป้าหมายบางส่วน และมีจุดที่ต้องพัฒนาเพิ่มเติม',
    summary_th: 'ผู้สมัครมีจุดแข็งด้านการทำงานจริงและการใช้เครื่องมือที่เกี่ยวข้อง มีผลงานที่วัดผลได้ชัดเจน แต่ยังขาดหลักฐานในบางองค์ความรู้หลักของอาชีพเป้าหมาย ควรเสริมด้วยคอร์สและใบรับรองตามแผนด้านล่าง',
  };
  // DEC-59: actor จำลอง — บรรทัดที่ขึ้นต้นด้วย Led/Managed/Oversaw ฯลฯ = led · อื่น ๆ = performed
  const actorOfLine = (q) => (/^(led|managed|oversaw|directed|supervised)/i.test(q || '') ? 'led' : 'performed');
  const actors = assessments.filter((a) => a.quotes && a.quotes.length).map((a) => ({ id: a.requirement_id, actor: actorOfLine(a.quotes[0]) }));
  const task_assessments = (role.signal_tasks || []).map((t, i) => ({ task_id: t.task_id, status: i < 3 && lines[i] ? 'partially' : 'missing', quotes: i < 3 && lines[i] ? [lines[i].slice(0, 160)] : [], confidence: 0.6 }));
  const text = JSON.stringify({ schema_version: 'analyst_v1.1', role_id: roleId, assessments, task_assessments, actors: actors.concat((role.signal_tasks || []).map((t, i) => (i < 3 && lines[i] ? { id: t.task_id, actor: actorOfLine(lines[i]) } : null)).filter(Boolean)), profile });
  return { candidates: [{ content: { parts: [{ text }], role: 'model' }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: prompt.length / 4 | 0, candidatesTokenCount: text.length / 4 | 0, thoughtsTokenCount: 120, totalTokenCount: (prompt.length / 4 | 0) + (text.length / 4 | 0) + 120 }, modelVersion: 'gemini-3.8-flash (mock)' };
}
const mocks = {
  extract: async (item) => { const b = Buffer.from(item.binary.resume.data, 'base64'); const t = pdfText(b); return { json: { ...item.json, ...t }, binary: item.binary }; },
  http: async (name, url, body) => {
    if (!/generativelanguage\.googleapis\.com\/v1beta\/models\/[\w.-]+:generateContent/.test(url)) throw new Error('bad url ' + url);
    await new Promise((r) => setTimeout(r, MODE === 'fast' ? 50 : 1500));
    if (MODE === 'error') return { error: { message: '403 - API key not valid (mock)' } };
    if (name === 'Gemini OCR') {
      if (!body.contents[0].parts[0].inlineData.data) throw new Error('OCR no data');
      return { candidates: [{ content: { parts: [{ text: pdfText(fs.readFileSync(OCR_SOURCE)).text }] }, finishReason: 'STOP' }] };
    }
    if (name === 'Gemini Verifier') {
      // ผู้ตรวจจำลอง: ข้อความที่มีตัวเลข = supports · มีชื่อสถาบัน = unrelated · อื่น ๆ = partially_supports
      const p = body.contents[0].parts[0].text;
      const list = JSON.parse(p.slice(p.indexOf('CHECKS (JSON):') + 14).trim());
      const text = JSON.stringify({ schema_version: 'verifier_v1.0', checks: list.map((c) => ({ check_id: c.check_id, verdict: /University|Institute|research lab/.test(c.quote) ? 'unrelated' : /\d/.test(c.quote) ? 'supports' : 'partially_supports' })) });
      return { candidates: [{ content: { parts: [{ text }], role: 'model' }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: p.length / 4 | 0, candidatesTokenCount: text.length / 4 | 0, totalTokenCount: (p.length / 4 | 0) + (text.length / 4 | 0) }, modelVersion: 'gemini-3.8-flash (mock)' };
    }
    return mockAnalyst(body);
  },
  drive: async (item) => { const p = path.join(OUTDIR, 'drive_' + item.json.file_name); fs.writeFileSync(p, Buffer.from(item.binary.pdf.data, 'base64')); return { id: 'TEST_FILE_ID_123', name: item.json.file_name, webViewLink: 'https://drive.google.com/file/d/TEST_FILE_ID_123/view' }; },
};

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const bb = Busboy({ headers: req.headers, limits: { fileSize: 30 * 1024 * 1024 } });
    const body = {}, binary = {};
    bb.on('field', (k, v) => { body[k] = v; });
    bb.on('file', (k, s, info) => { const ch = []; s.on('data', (d) => ch.push(d)); s.on('end', () => { binary[k] = { data: Buffer.concat(ch).toString('base64'), mimeType: info.mimeType, fileName: info.filename }; }); });
    bb.on('close', () => resolve({ body, binary })); bb.on('error', reject);
    req.pipe(bb);
  });
}

const wfo = loadWf(WF);
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:5678');
  const origin = req.headers.origin;
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET'); res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || ''); res.end(); return; }
  try {
    let start, item;
    if (req.method === 'GET' && u.pathname === '/webhook/is-demo') { start = 'GET /is-demo'; item = { json: { query: Object.fromEntries(u.searchParams), headers: req.headers } }; }
    else if (req.method === 'GET' && u.pathname === '/webhook/is-demo-version') { start = 'GET /is-demo-version'; item = { json: { query: {} } }; }
    else if (req.method === 'POST' && /^\/webhook(-test)?\/is-demo-analyze$/.test(u.pathname)) { const m = await parseMultipart(req); start = 'POST /is-demo-analyze'; item = { json: { body: m.body }, binary: m.binary }; }
    else if (req.method === 'POST' && u.pathname === '/webhook/is-demo-save-pdf') { const m = await parseMultipart(req); start = 'POST /is-demo-save-pdf'; item = { json: { body: m.body }, binary: m.binary }; }
    else { res.statusCode = 404; res.end('{"code":404,"message":"not registered"}'); return; }
    const t0 = Date.now();
    const out = await run(wfo, start, item, mocks);
    console.log(req.method, u.pathname, '→', out.response && out.response.code, (Date.now() - t0) + 'ms', out.trace.join(' > '));
    if (!out.response) { res.statusCode = 500; res.end('{"message":"Workflow did not respond"}'); return; }
    res.setHeader('Content-Security-Policy', CSP);
    Object.entries(out.response.headers).forEach(([k, v]) => res.setHeader(k, v));
    if (!out.response.headers['Content-Type']) res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = out.response.code; res.end(out.response.body);
    if (start === 'POST /is-demo-analyze') fs.writeFileSync(path.join(OUTDIR, 'last_report.json'), out.response.body);
  } catch (e) { console.error(e); res.statusCode = 500; res.end(JSON.stringify({ message: String(e.message) })); }
}).listen(5678, () => console.log('mock n8n on :5678 mode=' + MODE));
