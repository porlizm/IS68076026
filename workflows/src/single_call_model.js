// WF_IS_68076026_01OCT26 · Call Model __KEY__ (DEC-48) — เรียกครั้งเดียวต่องาน + เรียกซ้ำ ≤ max_attempts เมื่อ 429/หมดเวลา (ตาราง 3.10 · engine.callModelWithRetry)
// n8n 2.x รัน Code node ใน task runner: ข้อผิดพลาดของ this.helpers.httpRequest ที่ส่งกลับข้าม RPC ไม่มีรหัส HTTP (ทดสอบใน n8n 2.39.9 จริง 1 ต.ค. 2569)
// จึงขอ response เต็ม (returnFullResponse + ignoreHttpStatusErrors) แล้วสร้าง error ที่มี httpCode เอง · จับเวลาเองด้วย Promise.race · รอก่อนเรียกซ้ำตาม retry_backoff_ms หรือ Retry-After
const KEY = '__KEY__';
const d = $('Build Prompt').first().json;
const req = ENGINE.buildProviderRequest(KEY, CFG.models, d.prompt, $env);
const apiKey = $env[req.key_env] || '';
const backoff = CFG.models.defaults.retry_backoff_ms || [];
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
let attempt = 0; let retryAfterMs = 0;
const send = async (r, timeout) => {
  attempt += 1;
  if (attempt > 1) await sleep(Math.max(retryAfterMs, Number(backoff[Math.min(attempt - 2, backoff.length - 1)] || 0)));
  retryAfterMs = 0;
  const t0 = Date.now();
  const headers = {};
  for (const [k, v] of Object.entries(r.headers)) headers[k] = String(v).replace('{{KEY}}', apiKey);
  let timer;
  const expire = new Promise((_, no) => { timer = setTimeout(() => { const e = new Error('timeout after ' + timeout + ' ms'); e.code = 'ETIMEDOUT'; no(e); }, timeout + 1000); });
  let res;
  try {
    res = await Promise.race([this.helpers.httpRequest({ method: r.method, url: r.url, headers, body: r.body, json: true, timeout, returnFullResponse: true, ignoreHttpStatusErrors: true }), expire]);
  } catch (e) {
    const err = new Error(String((e && (e.message || e.code)) || 'request_failed'));
    err.httpCode = e && (e.httpCode || e.statusCode || (e.response && e.response.status));
    err.code = e && e.code;
    throw err;
  } finally { clearTimeout(timer); }
  const full = res && typeof res === 'object' && typeof res.statusCode === 'number';
  const status = full ? res.statusCode : 200;
  let json = full ? res.body : res;
  if (typeof json === 'string') { try { json = JSON.parse(json); } catch (e) { /* ให้ R0 ตัดสินเป็น no_output/invalid_json */ } }
  if (status >= 400) {
    const ra = full && res.headers ? Number(res.headers['retry-after']) : NaN;
    if (ra > 0) retryAfterMs = Math.min(ra * 1000, 30000);
    const err = new Error('HTTP ' + status); err.httpCode = status; throw err;
  }
  return { json, latency_ms: Date.now() - t0 };
};
const res = await ENGINE.callModelWithRetry(KEY, CFG.models, req, send, d.ctx.run_id, () => new Date().toISOString());
return [{ json: { model_key: KEY, result: res } }];
