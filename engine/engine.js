/* =============================================================================
 * engine.js — ตรรกะเดียวของระบบ IS 68076026 (หัวข้อ 3.4.5 ของเล่ม)
 *
 * กติกา: ไม่เรียกไลบรารีภายนอก · ไม่ติดต่อเครือข่าย · ไม่เก็บสถานะ
 *   - สคริปต์ scripts/build_workflows.mjs ฝังไฟล์นี้ทั้งไฟล์ลงใน Code node ที่ต้องใช้
 *     และบันทึก engine_sha256 ไว้ในไฟล์ workflow
 *   - ชุดทดสอบ (tests/*.test.mjs) และ scripts/run_local.mjs เรียกฟังก์ชันจากไฟล์นี้โดยตรง
 *   - ตัวตรวจ (scripts/validate_workflows.mjs) เทียบโค้ดที่ฝังกับไฟล์นี้ทีละไบต์
 *
 * อ้างอิงเล่ม: 3.5.1 เตรียมข้อความ/ปิดบัง PII · 3.5.2 prompt · 3.5.3 สถานะ · 3.5.4 กฎ R0–R4
 *              3.5.5 รวมผล · 3.5.6 สมการ 3.2–3.6 · 3.6 สมการ 3.7–3.8 และรายงาน · ตาราง 3.22 ข้อผิดพลาด
 * การตัดสินใจ: DEC-20 (gap coverage สองค่า) · DEC-21 (ข้อผิดพลาดของข้อมูลอ้างอิง) · DEC-34 (quote_text_version)
 * ========================================================================== */
const ENGINE = (function () {
  'use strict';

  const ENGINE_VERSION = 'engine-1.0.0-01OCT26';
  const STATUSES = ['evidenced', 'partially', 'missing'];
  const FINAL_STATUSES = ['evidenced', 'partially', 'missing', 'abstained'];
  const STATUS_SCORE = { evidenced: 1, partially: 0.5, missing: 0 };
  const TIE_ORDER = ['missing', 'partially', 'evidenced']; // ลำดับสำรองเมื่อเสียงเท่ากัน (3.5.5)
  const R0_CODES = ['no_output', 'invalid_json', 'schema_mismatch', 'role_mismatch', 'incomplete_coverage'];
  const L1_LAYER = 'L1_researcher_tagged'; // กำหนดในโค้ดโดยตั้งใจ ไม่ให้แก้ผ่าน config
  const SCHEMA_VERSION = 'analyst_v1.0';
  const STOP_WORDS = new Set(('a an and are as at be by for from has have in into is it its of on or that the their this ' +
    'to was were will with using used use via per over under within across our we i my me you your they them ' +
    'he she his her also etc including include includes such other than more most very well both each all any')
    .split(' '));
  const MODEL_KEYS = ['A', 'B', 'C'];
  const PLAN_STRATEGIES = ['weighted_greedy', 'coverage_first'];

  // ----------------------------------------------------------------------------------------------
  // 0) ยูทิลิตี: SHA-256 (บริสุทธิ์), canonical JSON, escape HTML
  // ----------------------------------------------------------------------------------------------
  function utf8Bytes(str) {
    const out = [];
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
        const d = str.charCodeAt(i + 1);
        if (d >= 0xdc00 && d <= 0xdfff) { c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00); i++; }
      }
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }
  const K256 = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
    0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
    0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  function sha256Hex(input) {
    const bytes = typeof input === 'string' ? utf8Bytes(input) : Array.from(input);
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    const hi = Math.floor(bitLen / 0x100000000), lo = bitLen >>> 0;
    bytes.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255, (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);
    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    const w = new Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let off = 0; off < bytes.length; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = (bytes[off + 4 * i] << 24) | (bytes[off + 4 * i + 1] << 16) | (bytes[off + 4 * i + 2] << 8) | bytes[off + 4 * i + 3];
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K256[i] + w[i]) | 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
    }
    return [h0, h1, h2, h3, h4, h5, h6, h7].map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }
  function canonicalJSON(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return '[' + v.map(canonicalJSON).join(',') + ']';
    return '{' + Object.keys(v).sort().filter((k) => v[k] !== undefined)
      .map((k) => JSON.stringify(k) + ':' + canonicalJSON(v[k])).join(',') + '}';
  }
  function escapeHtml(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function safeHttpsUrl(u) {
    const s = String(u || '').trim();
    return /^https:\/\/[^\s"'<>]+$/i.test(s) ? s : null;
  }
  const round = (x, d) => (x === null || x === undefined || Number.isNaN(x) ? null : Math.round(x * 10 ** d) / 10 ** d);
  const splitList = (s) => (Array.isArray(s) ? s : String(s || '').split('|').map((x) => x.trim()).filter(Boolean));

  // ----------------------------------------------------------------------------------------------
  // 1) ข้อมูลเข้า (UC-01, ตาราง 3.10, 3.22)
  // ----------------------------------------------------------------------------------------------
  function parseFormRow(row, sheetsCfg) {
    const cols = sheetsCfg.tabs.form_responses.columns;
    const maps = sheetsCfg.form_value_maps;
    const get = (i) => (row[cols[i]] === undefined ? '' : String(row[cols[i]]).trim());
    const roleRaw = get(3);
    const roleMatch = roleRaw.match(/\bR(0[1-9]|1\d|20)\b/);
    const modeRaw = get(6);
    const mode = maps.mode[modeRaw] || (['course_only', 'certification_only', 'both'].includes(modeRaw) ? modeRaw : '');
    const fileLink = get(2);
    const fileIdMatch = fileLink.match(/[-\w]{25,}/);
    const consentRaw = get(7);
    return {
      timestamp: get(0),
      email: get(1).toLowerCase(),
      file_link: fileLink,
      file_id: fileIdMatch ? fileIdMatch[0] : '',
      role_id: roleMatch ? roleMatch[0] : '',
      timeline_months: Number(String(get(4)).replace(/[^\d.]/g, '')) || 0,
      hours_per_week: Number(String(get(5)).replace(/[^\d.]/g, '')) || 0,
      mode,
      consent: maps.consent_yes.some((y) => consentRaw.indexOf(y) === 0) || consentRaw === 'true' || row[cols[7]] === true,
    };
  }
  function responseId(ctx) {
    return sha256Hex([ctx.timestamp, String(ctx.email).toLowerCase(), ctx.file_id].join('|'));
  }
  function makeRunId(respId, createdAtIso) {
    const d = String(createdAtIso || '').replace(/[-:TZ.]/g, '').slice(0, 14);
    return 'RUN-' + d + '-' + String(respId).slice(0, 8);
  }
  function validateIntake(ctx, projectCfg, roleIds) {
    const errors = [];
    if (!ctx.consent) errors.push('consent_not_given');
    if (!ctx.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ctx.email)) errors.push('email_not_verified');
    if (!ctx.file_id) errors.push('file_missing');
    if (!roleIds.includes(ctx.role_id)) errors.push('role_invalid');
    if (!projectCfg.allowed_modes.includes(ctx.mode)) errors.push('mode_invalid');
    if (!projectCfg.allowed_months.includes(Number(ctx.timeline_months))) errors.push('timeline_invalid');
    if (!(ctx.hours_per_week > 0 && ctx.hours_per_week <= projectCfg.max_hours_per_week)) errors.push('hours_invalid');
    return { ok: errors.length === 0, errors };
  }
  function checkFile(meta, projectCfg) {
    // meta: {mime, bytes, pages}
    if (meta.mime && meta.mime !== 'application/pdf') return { ok: false, error_code: 'file_not_pdf' };
    if (!(meta.bytes > 0)) return { ok: false, error_code: 'file_download_failed' };
    if (meta.bytes > projectCfg.max_file_bytes) return { ok: false, error_code: 'file_too_large' };
    if (meta.pages !== undefined && meta.pages !== null && meta.pages > projectCfg.max_pages) return { ok: false, error_code: 'too_many_pages' };
    return { ok: true, error_code: '' };
  }
  function isDuplicate(respId, runsRows) {
    return (runsRows || []).some((r) => r.response_id === respId && ['running', 'ready', 'delivered'].includes(r.stage));
  }

  // ----------------------------------------------------------------------------------------------
  // 2) เตรียมข้อความ 5 กฎ + ปิดบัง PII 4 รูปแบบ (3.5.1)
  // ----------------------------------------------------------------------------------------------
  function normalizeText(text) {
    let t = String(text || '');
    t = t.replace(/\r\n?/g, '\n');                                                   // 1 รวมรูปแบบการขึ้นบรรทัด
    t = t.replace(/[   -   　\t\f\v]/g, ' ')       // 2 ช่องว่างพิเศษ -> ช่องว่างปกติ
      .replace(/[​‌‍﻿]/g, '');
    t = t.replace(/[‐-―−]/g, '-')                                     // 3 ขีดและอัญประกาศแบบเดียว
      .replace(/[‘’‚‛′]/g, "'").replace(/[“”„‟″]/g, '"');
    t = t.replace(/ {2,}/g, ' ').replace(/ +\n/g, '\n').replace(/\n +/g, '\n');       // 4 ยุบช่องว่างซ้ำ
    t = t.replace(/\n{4,}/g, '\n\n\n');                                             // 5 บรรทัดว่างไม่เกินสองบรรทัด
    return t.trim();
  }
  const PII_PATTERNS = [
    ['EMAIL', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g],
    ['URL', /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+|\b(?:linkedin\.com|github\.com|gitlab\.com|facebook\.com)\/[^\s<>"')\]]+/gi],
    ['ID', /(?<!\d)\d[- ]?\d{4}[- ]?\d{5}[- ]?\d{2}[- ]?\d(?!\d)/g],
    ['PHONE', /(?<![\w\d])(?:\+?66[- ]?|0)\d(?:[- ]?\d){7,8}(?!\d)|(?<![\w\d])\+\d{1,3}[- ]?(?:\(?\d{1,4}\)?[- ]?){2,4}\d{2,4}(?!\d)/g],
  ];
  function maskPII(text) {
    let t = String(text || '');
    const counts = { EMAIL: 0, URL: 0, ID: 0, PHONE: 0 };
    for (const [tok, re] of PII_PATTERNS) {
      t = t.replace(re, () => { counts[tok]++; return '[' + tok + ']'; });
    }
    return { text: t, counts, total: counts.EMAIL + counts.URL + counts.ID + counts.PHONE };
  }
  function prepareText(rawText) {
    const norm = normalizeText(rawText);
    const m = maskPII(norm);
    return { text: m.text, pii_masked_count: m.total, pii_counts: m.counts, char_count: m.text.length, text_sha256: sha256Hex(m.text) };
  }

  // ----------------------------------------------------------------------------------------------
  // 3) prompt และคำขอไปยังผู้ให้บริการ (3.5.2, ตาราง 3.7–3.8)
  // ----------------------------------------------------------------------------------------------
  function buildPrompt(template, roleId, requirements, maskedText) {
    // ไม่ส่งคำพ้อง (element_aliases) และไม่ส่งน้ำหนักเข้า prompt (3.5.2)
    const reqList = requirements.map((r) => ({
      requirement_id: r.requirement_id, element_name: r.element_name, element_description: r.element_description,
    }));
    return String(template)
      .split('{{ROLE_ID}}').join(roleId)
      .split('{{REQUIREMENTS_JSON}}').join(JSON.stringify(reqList, null, 1))
      .split('{{RESUME_TEXT}}').join(maskedText);
  }
  function buildProviderRequest(modelKey, modelsCfg, prompt, env) {
    const m = modelsCfg.models[modelKey];
    const modelId = (env && env[m.model_env]) || '';
    const common = modelsCfg.defaults;
    const temp = m.send_temperature === false ? undefined : common.temperature;
    if (m.api === 'openai_chat_completions') {
      const body = { model: modelId, messages: [{ role: 'user', content: prompt }], max_completion_tokens: common.max_output_tokens, response_format: { type: 'json_object' } };
      if (temp !== undefined) body.temperature = temp;
      return { method: 'POST', url: m.endpoint, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer {{KEY}}' }, key_env: m.key_env, body, model_id: modelId };
    }
    if (m.api === 'anthropic_messages') {
      const body = { model: modelId, max_tokens: common.max_output_tokens, messages: [{ role: 'user', content: prompt }] };
      if (temp !== undefined) body.temperature = temp;
      return { method: 'POST', url: m.endpoint, headers: { 'Content-Type': 'application/json', 'x-api-key': '{{KEY}}', 'anthropic-version': m.anthropic_version || '2023-06-01' }, key_env: m.key_env, body, model_id: modelId };
    }
    if (m.api === 'google_generative_language') {
      const gen = { maxOutputTokens: common.max_output_tokens, responseMimeType: 'application/json' };
      if (temp !== undefined) gen.temperature = temp;
      return { method: 'POST', url: m.endpoint.replace(/\/$/, '') + '/' + encodeURIComponent(modelId) + ':generateContent', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': '{{KEY}}' }, key_env: m.key_env, body: { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: gen }, model_id: modelId };
    }
    throw new Error('unknown api ' + m.api);
  }
  function parseProviderResponse(api, json) {
    const j = json || {};
    if (api === 'openai_chat_completions') {
      const c = (j.choices || [])[0] || {};
      return { text: (c.message && c.message.content) || '', input_tokens: (j.usage || {}).prompt_tokens || 0, output_tokens: (j.usage || {}).completion_tokens || 0, finish_reason: c.finish_reason || '', model_id: j.model || '' };
    }
    if (api === 'anthropic_messages') {
      const text = (j.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
      return { text, input_tokens: (j.usage || {}).input_tokens || 0, output_tokens: (j.usage || {}).output_tokens || 0, finish_reason: j.stop_reason || '', model_id: j.model || '' };
    }
    if (api === 'google_generative_language') {
      const c = (j.candidates || [])[0] || {};
      const text = ((c.content || {}).parts || []).map((p) => p.text || '').join('');
      return { text, input_tokens: (j.usageMetadata || {}).promptTokenCount || 0, output_tokens: (j.usageMetadata || {}).candidatesTokenCount || 0, finish_reason: c.finishReason || '', model_id: j.modelVersion || '' };
    }
    throw new Error('unknown api ' + api);
  }
  function isRetryable(err, modelsCfg) {
    const s = err && (err.httpCode || err.statusCode || (err.response && err.response.status));
    if (s && modelsCfg.defaults.retry_on_status.includes(Number(s))) return true;
    const msg = String((err && (err.code || err.message)) || '').toLowerCase();
    return /timeout|timedout|etimedout|econnaborted|aborted/.test(msg);
  }
  function errorCodeOf(err) {
    const s = err && (err.httpCode || err.statusCode || (err.response && err.response.status));
    if (s) return String(s);
    const msg = String((err && (err.code || err.message)) || '').toLowerCase();
    return /timeout|timedout|aborted/.test(msg) ? 'timeout' : (msg.slice(0, 60) || 'error');
  }
  /**
   * เรียกโมเดลหนึ่งโมเดลพร้อมการเรียกซ้ำ (ตาราง 3.10 max_attempts = จำนวนครั้งที่เรียกซ้ำ ≤ 2)
   * sendFn(request) => Promise<{json, latency_ms}> — ฝั่ง n8n ใช้ this.helpers.httpRequest · ฝั่งเทสต์ใช้ mock
   * คืน { calls: [แถว model_calls], output: {text,...}|null, status }
   */
  async function callModelWithRetry(modelKey, modelsCfg, request, sendFn, runId, nowFn) {
    const m = modelsCfg.models[modelKey];
    const maxRetries = modelsCfg.defaults.max_attempts;
    const calls = [];
    for (let attempt = 1; attempt <= 1 + maxRetries; attempt++) {
      const t0 = Date.now();
      try {
        const res = await sendFn(request, modelsCfg.defaults.timeout_ms);
        const out = parseProviderResponse(m.api, res.json);
        calls.push({ run_id: runId, model_key: modelKey, provider: m.provider, model_id: out.model_id || request.model_id, attempt, status: 'ok', latency_ms: res.latency_ms !== undefined ? res.latency_ms : Date.now() - t0, input_tokens: out.input_tokens, output_tokens: out.output_tokens, finish_reason: out.finish_reason, error_code: '', created_at: nowFn() });
        return { calls, output: out, status: 'ok' };
      } catch (err) {
        const code = errorCodeOf(err);
        calls.push({ run_id: runId, model_key: modelKey, provider: m.provider, model_id: request.model_id, attempt, status: code === 'timeout' ? 'timeout' : 'error', latency_ms: Date.now() - t0, input_tokens: 0, output_tokens: 0, finish_reason: '', error_code: code, created_at: nowFn() });
        if (!isRetryable(err, modelsCfg) || attempt === 1 + maxRetries) return { calls, output: null, status: 'failed', error_code: code };
      }
    }
    return { calls, output: null, status: 'failed' };
  }

  // ----------------------------------------------------------------------------------------------
  // 4) กฎ R0 R2 R3 R1 R4 (3.5.4–3.5.5, ตาราง 3.24–3.25)
  // ----------------------------------------------------------------------------------------------
  function stripFences(s) {
    const t = String(s || '').trim();
    const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return m ? m[1] : t;
  }
  function ruleR0(rawText, roleId, requirementIds) {
    if (rawText === null || rawText === undefined || String(rawText).trim() === '') return { usable: false, reason_code: 'no_output', assessments: [] };
    let obj;
    try { obj = JSON.parse(stripFences(rawText)); } catch (e) { return { usable: false, reason_code: 'invalid_json', assessments: [] }; }
    if (!obj || typeof obj !== 'object' || obj.schema_version !== SCHEMA_VERSION || !Array.isArray(obj.assessments)) return { usable: false, reason_code: 'schema_mismatch', assessments: [] };
    if (obj.role_id !== roleId) return { usable: false, reason_code: 'role_mismatch', assessments: [] };
    const allowed = new Set(requirementIds);
    const seen = new Set();
    const out = [];
    for (const a of obj.assessments) {
      if (!a || typeof a !== 'object' || !allowed.has(a.requirement_id) || seen.has(a.requirement_id) || !STATUSES.includes(a.status)) return { usable: false, reason_code: 'schema_mismatch', assessments: [] };
      if (a.status !== 'missing' && typeof a.quote !== 'string') return { usable: false, reason_code: 'schema_mismatch', assessments: [] };
      seen.add(a.requirement_id);
      const conf = typeof a.confidence === 'number' && a.confidence >= 0 && a.confidence <= 1 ? a.confidence : null;
      out.push({ requirement_id: a.requirement_id, status: a.status, quote: typeof a.quote === 'string' ? a.quote : '', confidence: conf });
    }
    if (out.length < requirementIds.length / 2) return { usable: false, reason_code: 'incomplete_coverage', assessments: [] };
    return { usable: true, reason_code: '', assessments: out };
  }
  function collapseWs(s) {
    // ยุบช่องว่างซ้ำ (รวมขึ้นบรรทัด) ให้เหลือช่องว่างเดียว พร้อมตารางตำแหน่งกลับไปข้อความเดิม
    const src = String(s || '');
    let out = ''; const map = []; let prevWs = false;
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (/\s/.test(ch)) { if (!prevWs) { out += ' '; map.push(i); } prevWs = true; } else { out += ch; map.push(i); prevWs = false; }
    }
    return { text: out, map };
  }
  function ruleR2(quote, text) {
    const q = String(quote || '');
    if (q.trim() === '') return { verified: false, start: -1, end: -1, text_version: '' };
    const i = text.indexOf(q);
    if (i >= 0) return { verified: true, start: i, end: i + q.length, text_version: 'normalized' };
    const T = collapseWs(text); const Q = collapseWs(q).text.trim();
    if (!Q) return { verified: false, start: -1, end: -1, text_version: '' };
    const j = T.text.indexOf(Q);
    // ตำแหน่งอ้างอิงข้อความรุ่นที่ยุบช่องว่างแล้ว (3.5.4) และบันทึก quote_text_version ตาม DEC-34
    if (j >= 0) return { verified: true, start: j, end: j + Q.length, text_version: 'whitespace_collapsed' };
    return { verified: false, start: -1, end: -1, text_version: '' };
  }
  function tokenize(s) {
    const m = String(s || '').toLowerCase().match(/[a-z0-9][a-z0-9+#.\-/]*/g) || [];
    const out = new Set();
    for (let t of m) {
      t = t.replace(/[.\-/]+$/g, '');
      if (t.length <= 1 || STOP_WORDS.has(t)) continue;
      out.add(t);
    }
    return out;
  }
  function targetTokens(req) {
    return tokenize([req.element_name, req.element_description, splitList(req.element_aliases).join(' ')].join(' '));
  }
  function aliasHit(quote, req, minLen) {
    const q = ' ' + String(quote || '').toLowerCase().replace(/\s+/g, ' ') + ' ';
    for (const a of splitList(req.element_aliases)) {
      const al = a.toLowerCase().trim();
      if (al.length < minLen) continue;
      const re = new RegExp('(^|[^a-z0-9])' + al.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])');
      if (re.test(q)) return al;
    }
    return null;
  }
  function overlapScore(quote, req, cfg) {
    const hit = aliasHit(quote, req, cfg.alias_min_length);
    if (hit) return { score: 1, alias: hit };
    const Tq = tokenize(quote); const Tr = targetTokens(req);
    if (Tq.size === 0 || Tr.size === 0) return { score: 0, alias: null };
    let inter = 0; for (const t of Tq) if (Tr.has(t)) inter++;
    return { score: inter / Math.min(Tq.size, cfg.overlap_denominator_cap), alias: null }; // สมการ 3.2 · ไม่ตัดเพดานที่ 1
  }

  /**
   * ตรวจและรวมผลทั้งรอบ (UC-04)
   * modelResults: { A: {status:'ok'|'failed', output:{text}|null}, B:..., C:... }
   */
  function evaluateRun(input) {
    const { runId, roleId, requirements, text, modelResults, projectCfg, nowIso } = input;
    const reqIds = requirements.map((r) => r.requirement_id);
    const reqById = Object.fromEntries(requirements.map((r) => [r.requirement_id, r]));
    const perModel = {};
    const findings = [];
    for (const k of MODEL_KEYS) {
      const mr = modelResults[k];
      if (!mr) continue;
      const raw = mr.status === 'ok' && mr.output ? mr.output.text : null;
      const r0 = ruleR0(raw, roleId, reqIds);
      perModel[k] = { key: k, call_status: mr.status, r0_usable: r0.usable, r0_reason: r0.usable ? '' : (mr.status === 'ok' ? r0.reason_code : 'no_output'), votes: {}, n_claims: 0, n_rejected: 0, n_missing_direct: 0, n_downgraded: 0 };
      if (!r0.usable) continue;
      for (const a of r0.assessments) {
        const req = reqById[a.requirement_id];
        const flags = [];
        let vote = a.status, start = -1, end = -1, ver = '', verified = false, score = null;
        if (a.status === 'missing') {
          perModel[k].n_missing_direct++;
          flags.push('model_missing');
        } else {
          perModel[k].n_claims++;
          const r2 = ruleR2(a.quote, text);
          verified = r2.verified; start = r2.start; end = r2.end; ver = r2.text_version;
          if (!r2.verified) { flags.push('R2_quote_not_found'); vote = 'missing'; }
          else {
            const ov = overlapScore(a.quote, req, projectCfg);
            score = ov.score;
            if (ov.alias) flags.push('R3_alias_hit');
            if (ov.score < projectCfg.theta) { flags.push('R3_low_overlap'); vote = 'missing'; }
          }
          if (vote === 'missing') { perModel[k].n_rejected++; perModel[k].n_downgraded++; }
          if (r2.verified && r2.text_version === 'whitespace_collapsed') flags.push('R2_whitespace_collapsed');
        }
        perModel[k].votes[a.requirement_id] = { vote, quote: a.quote, start, end, score, verified, flags };
        findings.push({ run_id: runId, requirement_id: a.requirement_id, model_key: k, claimed_status: a.status, quote: a.quote, quote_char_start: start, quote_char_end: end, quote_text_version: ver, quote_verified: a.status === 'missing' ? '' : verified, overlap_score: score === null ? '' : round(score, 4), model_confidence: a.confidence === null ? '' : a.confidence, rule_flags: flags.join('|'), created_at: nowIso });
      }
    }
    const usable = MODEL_KEYS.filter((k) => perModel[k] && perModel[k].r0_usable);
    const m = usable.length;
    const haltAll = m < projectCfg.min_usable_models;
    const decisions = requirements.map((req) => {
      const rid = req.requirement_id;
      const votes = usable.map((k) => ({ k, v: perModel[k].votes[rid] })).filter((x) => x.v);
      const mi = votes.length;
      let final = 'abstained'; const flags = [];
      if (haltAll) flags.push('R1_min_models_not_met');
      else {
        const cnt = { evidenced: 0, partially: 0, missing: 0 };
        votes.forEach((x) => cnt[x.v.vote]++);
        const max = Math.max(cnt.evidenced, cnt.partially, cnt.missing);
        if (max >= 2) {
          const tied = STATUSES.filter((s) => cnt[s] === max);
          final = tied.length === 1 ? tied[0] : TIE_ORDER.find((s) => tied.includes(s));
          if (tied.length > 1) flags.push('R1_tie_break');
        } else flags.push('R1_no_two_votes');
      }
      const agree = final === 'abstained' ? 0 : votes.filter((x) => x.v.vote === final).length;
      const ai = mi === 0 || final === 'abstained' ? 0 : agree / mi;
      let ev = { quote: '', start: -1, end: -1 };
      if (final === 'evidenced' || final === 'partially') {
        const cands = votes.filter((x) => x.v.vote === final && x.v.verified)
          .sort((a, b) => (b.v.score - a.v.score) || (a.v.quote.length - b.v.quote.length) || (a.k < b.k ? -1 : 1));
        if (cands.length) ev = { quote: cands[0].v.quote, start: cands[0].v.start, end: cands[0].v.end };
      }
      votes.forEach((x) => x.v.flags.forEach((f) => { if (f.startsWith('R2_') || f.startsWith('R3_low')) flags.push(x.k + ':' + f); }));
      return { run_id: runId, requirement_id: rid, element_id: req.element_id, element_name: req.element_name, domain: req.domain, weight: Number(req.weight_renormalized), final_status: final, agreement_level: round(ai, 4), n_usable_models: mi, rule_flags: flags.join('|'), evidence_quote: ev.quote, evidence_char_start: ev.start, evidence_char_end: ev.end, created_at: nowIso };
    });
    const scores = computeScores(decisions, perModel);
    return { m, halted: haltAll, per_model: perModel, findings, decisions, scores };
  }

  // สมการ 3.4 (R) · 3.5 (C) · 3.6 (U)
  function computeScores(decisions, perModel) {
    const D = decisions.filter((d) => d.final_status !== 'abstained');
    const wA = decisions.reduce((s, d) => s + d.weight, 0);
    const wD = D.reduce((s, d) => s + d.weight, 0);
    const num = D.reduce((s, d) => s + d.weight * STATUS_SCORE[d.final_status], 0);
    const R = D.length === 0 || wD === 0 ? null : (num / wD) * 100;
    const C = wA === 0 ? null : wD / wA;
    let claims = 0, rejected = 0; const Uper = {};
    for (const k of Object.keys(perModel || {})) {
      const p = perModel[k];
      if (!p.r0_usable) continue;
      claims += p.n_claims; rejected += p.n_rejected;
      Uper[k] = { n_claims: p.n_claims, n_rejected: p.n_rejected, U: p.n_claims ? round(p.n_rejected / p.n_claims, 4) : null, n_missing_direct: p.n_missing_direct, n_downgraded: p.n_downgraded };
    }
    const n = (s) => decisions.filter((d) => d.final_status === s).length;
    return {
      readiness_pct: R === null ? 'N/A' : round(R, 2), weighted_coverage: C === null ? 'N/A' : round(C, 4),
      n_decided: D.length, n_evidenced: n('evidenced'), n_partially: n('partially'), n_missing: n('missing'), n_abstained: n('abstained'),
      unsupported_claims: rejected, n_claims: claims, U: claims ? round(rejected / claims, 4) : null, U_per_model: Uper,
    };
  }

  // ----------------------------------------------------------------------------------------------
  // 5) จัดแผน (3.6.1–3.6.2 สมการ 3.7–3.8, DEC-20, DEC-21)
  // ----------------------------------------------------------------------------------------------
  function capacityHours(months, hoursPerWeek, projectCfg) {
    return round(months * projectCfg.weeks_per_month * hoursPerWeek, 4); // สมการ 3.7
  }
  function modeAllows(itemModes, userMode) {
    return splitList(itemModes).includes(userMode);
  }
  function buildPlan(input) {
    const { decisions, corpus, mappings, mode, months, hoursPerWeek, projectCfg, roleId } = input;
    const approved = new Set(projectCfg.approved_mapping_statuses);
    const Hmax = capacityHours(months, hoursPerWeek, projectCfg);
    const w = Object.fromEntries(decisions.map((d) => [d.requirement_id, d.weight]));
    const gaps = decisions.filter((d) => d.final_status === 'missing' || d.final_status === 'partially').map((d) => d.requirement_id);
    const gapSet = new Set(gaps);
    const items = Object.fromEntries(corpus.map((c) => [c.item_id, c]));
    const approvedRows = mappings.filter((m) => approved.has(m.mapping_status) && m.coverage_layer === L1_LAYER);
    const result = { Hmax, n_gaps: gaps.length, items: [], total_hours: 0, notice: '', reference_data_error: false };
    if (approvedRows.length === 0) {
      result.reference_data_error = true;
      result.notice = 'ข้อผิดพลาดของข้อมูลอ้างอิง: ไม่มีความเชื่อมโยงที่ผ่านการตรวจแม้แต่แถวเดียว ให้ตรวจการนำเข้า data/mapping_review.csv และแท็บ ref_mappings';
    }
    // candidate ตามนิยามภาคผนวก ง: ผ่านตรวจ + L1 + เป็นช่องว่าง + verified + ชั่วโมง > 0 (ไม่จำกัดเวลา)
    const Gk = {}; const candByReq = {};
    for (const m of approvedRows) {
      if (roleId && m.role_id !== roleId) continue;
      if (!gapSet.has(m.requirement_id)) continue;
      const it = items[m.item_id];
      if (!it || it.verification_status !== 'verified' || !(Number(it.estimated_hours) > 0)) continue;
      candByReq[m.requirement_id] = true;
      if (!modeAllows(it.recommendation_mode, mode)) continue;
      (Gk[m.item_id] = Gk[m.item_id] || new Set()).add(m.requirement_id);
    }
    const covered = new Set(); let cum = 0; let rank = 0;
    const pool = Object.keys(Gk).sort();
    const EPS = 1e-12;
    // วิธีเลือก (DEC-47): weighted_greedy = น้ำหนักช่องว่างใหม่ต่อชั่วโมง · coverage_first = จำนวนช่องว่างใหม่ต่อชั่วโมง (เท่ากันใช้น้ำหนักต่อชั่วโมง)
    const strategy = input.strategy || projectCfg.plan_strategy || 'weighted_greedy';
    if (!PLAN_STRATEGIES.includes(strategy)) throw new Error('plan_strategy ไม่รู้จัก: ' + strategy);
    result.strategy = strategy;
    for (;;) {
      let best = null;
      for (const id of pool) {
        const h = Number(items[id].estimated_hours);
        if (cum + h > Hmax + EPS) continue;
        const add = [...Gk[id]].filter((r) => !covered.has(r));
        if (add.length === 0) continue;
        const wsum = add.reduce((s, r) => s + w[r], 0);
        const dk = wsum / h;                                                  // d_k น้ำหนักต่อชั่วโมง
        const ck = add.length / h;                                            // c_k จำนวนข้อต่อชั่วโมง
        const key = strategy === 'coverage_first' ? [ck, dk] : [dk, ck];
        const better = !best || key[0] > best.key[0] + EPS
          || (Math.abs(key[0] - best.key[0]) <= EPS && (key[1] > best.key[1] + EPS
            || (Math.abs(key[1] - best.key[1]) <= EPS && id < best.id)));
        if (better) best = { id, dk, ck, key, add, wsum, h };
      }
      if (!best) break;
      rank++; cum += best.h; best.add.forEach((r) => covered.add(r));
      const it = items[best.id];
      result.items.push({ rank, item_id: best.id, item_type: it.item_type, title: it.title, provider: it.provider, source_url: safeHttpsUrl(it.source_url) || '', estimated_hours: best.h, cumulative_hours: round(cum, 2), covers_requirements: best.add.sort().join('|'), n_new_requirements: best.add.length, new_weight_covered: round(best.wsum, 6), d_k: round(best.dk, 8), c_k: round(best.ck, 8), mapping_status: 'source_checked_by_script', phase: it.phase });
    }
    result.total_hours = round(cum, 2);
    const withCand = gaps.filter((g) => candByReq[g]);
    result.n_gap_requirements_with_candidate = withCand.length;
    result.n_covered = covered.size;
    result.gap_coverage = gaps.length ? round(covered.size / gaps.length, 4) : 'N/A';
    result.gap_coverage_with_candidate = withCand.length ? round(covered.size / withCand.length, 4) : 'N/A';
    result.uncovered_no_candidate = gaps.filter((g) => !candByReq[g]).sort();
    result.uncovered_over_capacity = gaps.filter((g) => candByReq[g] && !covered.has(g)).sort();
    if (!result.reference_data_error) {
      if (gaps.length === 0) result.notice = 'ไม่พบช่องว่างทักษะจากข้อกำหนดที่ระบบสรุปได้ จึงไม่มีรายการเรียนรู้ในแผน';
      else if (result.items.length === 0) result.notice = 'ยังไม่มีรายการที่ผ่านการตรวจความเชื่อมโยงและอยู่ภายในเวลาที่จัดสรรได้สำหรับช่องว่างชุดนี้';
    }
    return result;
  }

  // ----------------------------------------------------------------------------------------------
  // 6) ชุดข้อมูลรายงานรุ่นคงที่ + รายงาน HTML + อีเมล (3.6.3, UC-06)
  // ----------------------------------------------------------------------------------------------
  function freezeReport(input) {
    const { ctx, ocr, evalResult, plan, modelCalls, refs } = input;
    const hashes = {
      text_sha256: ocr.text_sha256,
      reference_manifest_sha256: sha256Hex(canonicalJSON(refs.manifest_files || {})),
      prompt_sha256: refs.prompt_sha256 || '',
      decisions_sha256: sha256Hex(canonicalJSON(evalResult.decisions.map((d) => [d.requirement_id, d.final_status, d.evidence_quote, d.evidence_char_start, d.evidence_char_end]))),
      plan_sha256: sha256Hex(canonicalJSON(plan.items.map((i) => [i.rank, i.item_id, i.estimated_hours]))),
    };
    const payload = {
      schema: 'report-v1.0', engine_version: ENGINE_VERSION, run_id: ctx.run_id, role_id: ctx.role_id, role_name_th: refs.role_name_th || '',
      mode: ctx.mode, timeline_months: ctx.timeline_months, hours_per_week: ctx.hours_per_week,
      ocr_engine: ocr.engine, ocr_engine_version: ocr.engine_version || '', m: evalResult.m,
      scores: evalResult.scores, decisions: evalResult.decisions, plan,
      model_calls: (modelCalls || []).map((c) => ({ model_key: c.model_key, provider: c.provider, model_id: c.model_id, attempt: c.attempt, status: c.status, error_code: c.error_code, latency_ms: c.latency_ms, input_tokens: c.input_tokens, output_tokens: c.output_tokens })),
      versions: { dataset: refs.dataset_version || '', corpus: refs.corpus_version || '', prompt: refs.prompt_version || '', rules: refs.rules_version || '' },
      hashes,
    };
    payload.report_hash = sha256Hex(canonicalJSON(payload));
    return payload;
  }
  const STATUS_TH = { evidenced: 'พบหลักฐานตามเกณฑ์', partially: 'พบหลักฐานบางส่วน', missing: 'ไม่พบหลักฐานที่ผ่านเกณฑ์', abstained: 'ระบบยังสรุปไม่ได้' };
  function renderReportHTML(p, cfg) {
    const e = escapeHtml; const s = p.scores;
    const fmt = (x, d) => (x === 'N/A' || x === null || x === undefined ? 'N/A' : Number(x).toFixed(d));
    const reqName = Object.fromEntries(p.decisions.map((d) => [d.requirement_id, d.element_name]));
    let h = '<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>รายงานผลวิเคราะห์ ' + e(p.run_id) + '</title>'
      + '<style>body{font-family:"Sarabun","TH Sarabun New",Tahoma,sans-serif;font-size:14pt;line-height:1.5}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:4px;vertical-align:top}th{background:#eee}.q{font-family:monospace;font-size:11pt}</style></head><body>';
    h += '<h1>รายงานผลวิเคราะห์ช่องว่างทักษะจากเรซูเมและแผนการเรียนรู้</h1>';
    h += '<p>รหัสงาน: <b>' + e(p.run_id) + '</b> · อาชีพเป้าหมาย: ' + e(p.role_id) + ' ' + e(p.role_name_th) + ' · กรอบเวลา ' + e(p.timeline_months) + ' เดือน · ' + e(p.hours_per_week) + ' ชั่วโมงต่อสัปดาห์ · ประเภทคำแนะนำ ' + e(p.mode) + '</p>';
    // ส่วนที่ 1
    h += '<h2>ส่วนที่ 1 สรุปตัวเลข</h2><table><tr><th>คะแนนหลักฐานตามข้อกำหนดอ้างอิง (R)</th><th>สัดส่วนน้ำหนักของข้อที่สรุปได้ (C)</th><th>ข้อสรุปที่ไม่ผ่านเกณฑ์ตรวจหลักฐาน</th><th>จำนวนโมเดลที่ใช้ได้</th></tr>';
    h += '<tr><td>' + e(fmt(s.readiness_pct, 2)) + '</td><td>' + e(fmt(s.weighted_coverage, 3)) + ' (สรุปได้ ' + e(s.n_decided) + ' จาก ' + e(p.decisions.length) + ' ข้อ)</td><td>' + e(s.unsupported_claims) + ' จาก ' + e(s.n_claims) + '</td><td>' + e(p.m) + ' จาก 3</td></tr></table>';
    h += '<p>คะแนน R สะท้อนหลักฐานที่ปรากฏในเรซูเมภายใต้เกณฑ์ของการศึกษา ไม่ใช่ผลทดสอบทักษะหรือความน่าจะเป็นที่พร้อมทำงาน และต้องอ่านคู่กับค่า C เสมอ</p>';
    // ส่วนที่ 2
    h += '<h2>ส่วนที่ 2 ผลรายข้อกำหนด</h2>';
    for (const st of FINAL_STATUSES) {
      const rows = p.decisions.filter((d) => d.final_status === st);
      h += '<h3>' + e(STATUS_TH[st]) + ' (' + rows.length + ' ข้อ)</h3>';
      if (!rows.length) continue;
      h += '<table><tr><th>รหัสข้อกำหนด</th><th>องค์ประกอบ</th><th>ความเห็นตรงกัน</th><th>ข้อความที่ใช้ตัดสิน [ตำแหน่งตัวอักษร]</th></tr>';
      for (const d of rows) {
        const q = d.evidence_quote ? '<span class="q">' + e(d.evidence_quote) + '</span> [' + e(d.evidence_char_start) + '–' + e(d.evidence_char_end) + ')' : '—';
        h += '<tr><td>' + e(d.requirement_id) + '</td><td>' + e(d.element_name) + '</td><td>' + e(fmt(d.agreement_level, 2)) + '</td><td>' + q + '</td></tr>';
      }
      h += '</table>';
    }
    // ส่วนที่ 3
    const pl = p.plan;
    h += '<h2>ส่วนที่ 3 แผนการเรียนรู้</h2><p>จำนวนชั่วโมงเรียนสูงสุด ' + e(fmt(pl.Hmax, 1)) + ' ชั่วโมง · ใช้จริง ' + e(fmt(pl.total_hours, 1)) + ' ชั่วโมง · ครอบคลุมช่องว่าง ' + e(pl.n_covered) + ' จาก ' + e(pl.n_gaps) + ' ข้อ (มีรายการรองรับในคลัง ' + e(pl.n_gap_requirements_with_candidate) + ' ข้อ)</p>';
    if (pl.notice) h += '<p><b>' + e(pl.notice) + '</b></p>';
    if (pl.items.length) {
      h += '<table><tr><th>ลำดับ</th><th>รายการ</th><th>ผู้ให้บริการ</th><th>ชั่วโมง</th><th>ชั่วโมงสะสม</th><th>ช่องว่างที่ครอบคลุมเพิ่ม</th><th>เหตุผล</th></tr>';
      for (const i of pl.items) {
        const url = safeHttpsUrl(i.source_url);
        const title = url ? '<a href="' + e(url) + '">' + e(i.title) + '</a>' : e(i.title);
        const why = 'ครอบคลุมน้ำหนักช่องว่างเพิ่ม ' + Number(i.new_weight_covered).toFixed(4) + ' ต่อ ' + i.estimated_hours + ' ชม.';
        h += '<tr><td>' + e(i.rank) + '</td><td>' + title + ' (' + e(i.item_id) + ')</td><td>' + e(i.provider) + '</td><td>' + e(i.estimated_hours) + '</td><td>' + e(i.cumulative_hours) + '</td><td>' + splitList(i.covers_requirements).map((r) => e(r) + ' ' + e(reqName[r] || '')).join('<br>') + '</td><td>' + e(why) + '</td></tr>';
      }
      h += '</table>';
    }
    if (pl.uncovered_no_candidate.length) h += '<p>ช่องว่างที่คลังยังไม่มีรายการรองรับ: ' + pl.uncovered_no_candidate.map(e).join(', ') + '</p>';
    if (pl.uncovered_over_capacity.length) h += '<p>ช่องว่างที่มีรายการรองรับแต่เกินเวลาที่จัดสรรได้: ' + pl.uncovered_over_capacity.map(e).join(', ') + '</p>';
    h += '<p>ลำดับนี้เป็นลำดับความสำคัญสำหรับวางแผน ไม่ใช่ลำดับความรู้พื้นฐานที่ต้องมีก่อนเรียน และชั่วโมงเป็นค่าประมาณสำหรับวางแผน</p>';
    // ส่วนที่ 4
    h += '<h2>ส่วนที่ 4 รายละเอียดการเรียกโมเดลเพื่อการตรวจสอบย้อนหลัง</h2><p>ข้อมูลนี้ไม่ใช้จัดอันดับว่าโมเดลใดดีกว่า · บริการอ่านข้อความ: ' + e(p.ocr_engine) + ' ' + e(p.ocr_engine_version) + '</p>';
    h += '<table><tr><th>โมเดล</th><th>ผู้ให้บริการ</th><th>รหัสรุ่น</th><th>ครั้งที่</th><th>ผล</th><th>รหัสข้อผิดพลาด</th></tr>';
    for (const c of p.model_calls) h += '<tr><td>' + e(c.model_key) + '</td><td>' + e(c.provider) + '</td><td>' + e(c.model_id) + '</td><td>' + e(c.attempt) + '</td><td>' + e(c.status) + '</td><td>' + e(c.error_code) + '</td></tr>';
    h += '</table>';
    // ส่วนที่ 5
    h += '<h2>ส่วนที่ 5 ข้อจำกัดของผลและค่าแฮช</h2><ul><li>ผลนี้อ่านจากข้อความในเอกสารเท่านั้น ผู้ที่มีความสามารถแต่ไม่ได้ระบุไว้ในเรซูเมอาจได้สถานะไม่พบหลักฐาน</li><li>สถานะยังสรุปไม่ได้ไม่ใช่ข้อสรุปเกี่ยวกับตัวท่าน และไม่นับเป็นช่องว่างทักษะ</li><li>ระบบไม่ใช้ผลนี้จัดอันดับหรือคัดเลือกบุคคล</li><li>ขอลบข้อมูลก่อนครบ ' + e(cfg.retention_days) + ' วันได้ที่ ' + e(cfg.deletion_contact) + '</li></ul>';
    h += '<p class="q">report_hash ' + e(p.report_hash) + '<br>' + Object.entries(p.hashes).map(([k, v]) => e(k) + ' ' + e(v)).join('<br>') + '<br>versions ' + e(canonicalJSON(p.versions)) + '</p>';
    h += '</body></html>';
    return h;
  }
  function buildEmail(p, to, cfg) {
    const s = p.scores;
    const fmt = (x, d) => (x === 'N/A' || x === null ? 'N/A' : Number(x).toFixed(d));
    const subject = '[IS68076026] รายงานผลวิเคราะห์ช่องว่างทักษะและแผนการเรียนรู้ ' + p.run_id;
    const body = [
      'เรียนผู้เข้าร่วมวิจัย', '',
      'ระบบได้วิเคราะห์เรซูเมของท่านเทียบกับอาชีพเป้าหมาย ' + p.role_id + ' ' + (p.role_name_th || '') + ' แล้ว สรุปดังนี้',
      '- คะแนนหลักฐานตามข้อกำหนดอ้างอิง (R): ' + fmt(s.readiness_pct, 2),
      '- สัดส่วนน้ำหนักของข้อที่สรุปได้ (C): ' + fmt(s.weighted_coverage, 3) + ' (สรุปได้ ' + s.n_decided + ' จาก ' + p.decisions.length + ' ข้อ)',
      '- รายการเรียนรู้ในแผน: ' + p.plan.items.length + ' รายการ รวม ' + p.plan.total_hours + ' ชั่วโมง',
      '', 'ผลนี้อ่านจากข้อความในเอกสารเท่านั้น ไม่ใช่การวัดความสามารถของท่าน รายละเอียดอยู่ในไฟล์รายงานที่แนบมา',
      'หลังอ่านรายงาน โปรดตอบแบบประเมินโดยใช้รหัสงาน ' + p.run_id + (cfg.evaluation_form_url ? ' ที่ ' + cfg.evaluation_form_url : ''),
      'ท่านขอให้ลบข้อมูลก่อนครบ ' + cfg.retention_days + ' วันได้ทางอีเมล ' + cfg.deletion_contact,
      '', 'ขอบคุณที่ร่วมการวิจัย', cfg.researcher_name_th,
    ].join('\n');
    return { to, subject, body, attachment_name: 'IS68076026_' + p.run_id + '.pdf' };
  }

  // ----------------------------------------------------------------------------------------------
  // 7) สถานะงาน (รูป 3.8) และสรุปแถว runs
  // ----------------------------------------------------------------------------------------------
  const STAGE_NEXT = { running: ['ready', 'failed'], ready: ['delivered', 'failed'], delivered: [], failed: [] };
  function nextStage(current, target) {
    if (!current) { if (target !== 'running') throw new Error('stage ต้องเริ่มที่ running'); return target; }
    if (!(STAGE_NEXT[current] || []).includes(target)) throw new Error('เปลี่ยน stage ไม่ได้: ' + current + ' -> ' + target);
    return target;
  }
  function runRowFrom(ctx, extra) {
    const x = extra || {};
    return {
      run_id: ctx.run_id, response_id: ctx.response_id, created_at: ctx.created_at, updated_at: x.updated_at || ctx.created_at,
      email: ctx.email, role_id: ctx.role_id, mode: ctx.mode, timeline_months: ctx.timeline_months, hours_per_week: ctx.hours_per_week,
      file_id: ctx.file_id, stage: x.stage || 'running', ocr_engine: x.ocr_engine || '', model_status: x.model_status || '',
      readiness_pct: x.readiness_pct === undefined ? '' : x.readiness_pct, weighted_coverage: x.weighted_coverage === undefined ? '' : x.weighted_coverage,
      n_evidenced: x.n_evidenced === undefined ? '' : x.n_evidenced, n_partially: x.n_partially === undefined ? '' : x.n_partially,
      n_missing: x.n_missing === undefined ? '' : x.n_missing, n_abstained: x.n_abstained === undefined ? '' : x.n_abstained,
      unsupported_claims: x.unsupported_claims === undefined ? '' : x.unsupported_claims, report_hash: x.report_hash || '',
      pdf_file_id: x.pdf_file_id || '', email_status: x.email_status || '', error_code: x.error_code || '',
    };
  }
  function modelStatusSummary(evalResult) {
    return 'm=' + evalResult.m + ';' + MODEL_KEYS.map((k) => {
      const p = evalResult.per_model[k];
      return k + ':' + (!p ? 'absent' : p.r0_usable ? 'ok' : (p.call_status === 'ok' ? 'R0_' + p.r0_reason : 'call_failed'));
    }).join(';');
  }

  // ----------------------------------------------------------------------------------------------
  // 8) ข้อมูลอ้างอิง: merge mapping_review (DEC-21)
  // ----------------------------------------------------------------------------------------------
  function mergeMappingReview(mappings, reviewRows, minShare) {
    if (!reviewRows || reviewRows.length === 0) throw new Error('ข้อผิดพลาดของข้อมูลอ้างอิง: ไม่พบ mapping_review (รัน python scripts/review_mappings.py แล้วนำเข้าใหม่)');
    const st = new Map(reviewRows.map((r) => [r.map_id, r.mapping_status]));
    const out = mappings.map((m) => Object.assign({}, m, { mapping_status: st.get(m.map_id) || 'pending_review' }));
    const nL1 = out.filter((m) => m.coverage_layer === L1_LAYER).length;
    const nOk = out.filter((m) => m.mapping_status === 'source_checked_by_script' || m.mapping_status === 'expert_reviewed').length;
    if (nOk === 0) throw new Error('ข้อผิดพลาดของข้อมูลอ้างอิง: ไม่มีแถวที่ผ่านการตรวจ');
    if (nOk < (minShare === undefined ? 0.9 : minShare) * nL1) throw new Error('ข้อผิดพลาดของข้อมูลอ้างอิง: แถวชั้น L1 ในคลัง ' + nL1 + ' แถว แต่มีสถานะผ่านการตรวจเพียง ' + nOk + ' แถว');
    return out;
  }

  // ----------------------------------------------------------------------------------------------
  // 9) เส้นทางเต็ม (ใช้ร่วมกันระหว่าง run_local, เทสต์ และ Code node ใน WF_SUB_Decide — บั๊ก B4)
  // ----------------------------------------------------------------------------------------------
  function decideAndPlan(input) {
    const { ctx, requirements, text, modelResults, corpus, mappings, projectCfg, nowIso } = input;
    const ev = evaluateRun({ runId: ctx.run_id, roleId: ctx.role_id, requirements, text, modelResults, projectCfg, nowIso });
    const plan = buildPlan({ decisions: ev.decisions, corpus, mappings, mode: ctx.mode, months: ctx.timeline_months, hoursPerWeek: ctx.hours_per_week, projectCfg, roleId: ctx.role_id });
    const planRows = plan.items.map((i) => ({ run_id: ctx.run_id, rank: i.rank, item_id: i.item_id, item_type: i.item_type, title: i.title, provider: i.provider, source_url: i.source_url, estimated_hours: i.estimated_hours, cumulative_hours: i.cumulative_hours, covers_requirements: i.covers_requirements, n_new_requirements: i.n_new_requirements, new_weight_covered: i.new_weight_covered, mapping_status: i.mapping_status, phase: i.phase }));
    return { eval: ev, plan, planRows };
  }

  return {
    ENGINE_VERSION, STATUSES, FINAL_STATUSES, PLAN_STRATEGIES, R0_CODES, L1_LAYER, SCHEMA_VERSION, MODEL_KEYS,
    sha256Hex, canonicalJSON, escapeHtml, safeHttpsUrl,
    parseFormRow, responseId, makeRunId, validateIntake, checkFile, isDuplicate,
    normalizeText, maskPII, prepareText,
    buildPrompt, buildProviderRequest, parseProviderResponse, callModelWithRetry, isRetryable,
    ruleR0, ruleR2, tokenize, targetTokens, overlapScore, evaluateRun, computeScores,
    capacityHours, buildPlan, decideAndPlan, mergeMappingReview,
    freezeReport, renderReportHTML, buildEmail, nextStage, runRowFrom, modelStatusSummary,
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = ENGINE;
