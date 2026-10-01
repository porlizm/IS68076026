// WF_SUB_GapEngine · Call Model C — เรียกครั้งเดียวต่องาน + เรียกซ้ำ ≤ max_attempts เมื่อ 429/timeout (บั๊ก B5, ตาราง 3.10)
const KEY = 'C';
const d = $('Build Prompt').first().json;
const req = ENGINE.buildProviderRequest(KEY, CFG.models, d.prompt, $env);
const apiKey = $env[req.key_env] || '';
const send = async (r, timeout) => {
  const t0 = Date.now();
  const headers = {};
  for (const [k, v] of Object.entries(r.headers)) headers[k] = String(v).replace('{{KEY}}', apiKey);
  const json = await this.helpers.httpRequest({ method: r.method, url: r.url, headers, body: r.body, json: true, timeout });
  return { json, latency_ms: Date.now() - t0 };
};
const res = await ENGINE.callModelWithRetry(KEY, CFG.models, req, send, d.ctx.run_id, () => new Date().toISOString());
return [{ json: { model_key: KEY, result: res } }];
