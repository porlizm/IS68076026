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
 *             DEC-51 (R3 สองชั้น) · DEC-52 (ซ่อม quote) · DEC-53 (analyst_v1.1) · DEC-54 (R5/R6) · DEC-55 (T/H) · DEC-56 (แผนตามระดับ)
 *             DEC-60 (R7 ผู้ลงมือทำ · ระดับ LV · quote ซ้ำ · Role-Fit · H คงที่ · ตราประทับรุ่น · cache · token)
 * ========================================================================== */
const ENGINE = (function () {
  'use strict';

  const ENGINE_VERSION = 'engine-2.1.0-03OCT26'; // 2.1: R7 ผู้ลงมือทำ/ระดับ LV/quote ซ้ำ + Role-Fit + H ตัวส่วนคงที่ + ตราประทับรุ่น + cache ผู้ตรวจ + token (DEC-60) · 2.0: R3 สองชั้น + ซ่อม quote + analyst_v1.1 + ฐานขั้นต่ำ R5/R6 + ดัชนี T/H + แผนตามระดับผู้เรียน (DEC-51–56) · 1.1: plan_strategy (DEC-47)
  const STATUSES = ['evidenced', 'partially', 'missing'];
  const FINAL_STATUSES = ['evidenced', 'partially', 'missing', 'abstained'];
  const STATUS_SCORE = { evidenced: 1, partially: 0.5, missing: 0 };
  const TIE_ORDER = ['missing', 'partially', 'evidenced']; // ลำดับสำรองเมื่อเสียงเท่ากัน (3.5.5)
  const R0_CODES = ['no_output', 'invalid_json', 'schema_mismatch', 'role_mismatch', 'incomplete_coverage'];
  const L1_LAYER = 'L1_researcher_tagged'; // กำหนดในโค้ดโดยตั้งใจ ไม่ให้แก้ผ่าน config
  const SCHEMA_VERSION = 'analyst_v1.2';
  const SCHEMA_VERSIONS = ['analyst_v1.2', 'analyst_v1.1', 'analyst_v1.0']; // รับรุ่นก่อนหน้าได้เพื่อย้อนกลับ (DEC-53 · DEC-60)
  const VERIFIER_SCHEMA = 'verifier_v1.1';
  const VERIFIER_SCHEMAS = ['verifier_v1.1', 'verifier_v1.0'];
  const ACTORS = ['performed', 'led', 'oversaw', 'mentioned'];
  const ACTOR_RANK = { performed: 3, led: 2, oversaw: 1, mentioned: 0 };
  const VERDICTS = ['supports', 'partially_supports', 'unrelated'];
  const EVIDENCE_TYPES = ['action', 'result', 'tool_list', 'credential', 'education', 'other'];
  const MAX_QUOTES = 2;
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
  function buildPrompt(template, roleId, requirements, maskedText, roleTasks) {
    // ไม่ส่งคำพ้อง (element_aliases) และไม่ส่งน้ำหนักเข้า prompt (3.5.2) · งานหลักของอาชีพส่งเฉพาะรหัสและข้อความ (DEC-55)
    const reqList = requirements.map((r) => ({
      requirement_id: r.requirement_id, element_name: r.element_name, element_description: r.element_description,
    }));
    const taskList = (roleTasks || []).map((t) => ({ task_id: t.task_id, task: t.task_text }));
    return String(template)
      .split('{{ROLE_ID}}').join(roleId)
      .split('{{REQUIREMENTS_JSON}}').join(JSON.stringify(reqList, null, 1))
      .split('{{TASKS_JSON}}').join(JSON.stringify(taskList, null, 1))
      .split('{{RESUME_TEXT}}').join(maskedText);
  }
  function buildProviderRequest(modelKey, modelsCfg, prompt, env, opts) {
    const m = modelsCfg.models[modelKey];
    const modelId = (env && env[m.model_env]) || '';
    const common = Object.assign({}, modelsCfg.defaults, opts && opts.maxTokens ? { max_output_tokens: opts.maxTokens } : {});
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
      const text = ((c.content || {}).parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
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
  // 4) กฎตรวจหลักฐาน R0 → R2 → R3 (R3a คำซ้ำ · R3b ตรวจความหมายข้ามโมเดล) → R1 → R4 → R5/R6
  //    (3.4.4–3.4.6 · DEC-51 R3 สองชั้น · DEC-52 ซ่อม quote · DEC-53 analyst_v1.1 · DEC-54 ฐานขั้นต่ำ · DEC-55 T/H)
  // ----------------------------------------------------------------------------------------------
  function stripFences(s) {
    const t = String(s || '').trim();
    const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return m ? m[1] : t;
  }
  // อ่านรายการผลรายข้อ (assessments หรือ task_assessments) · คืน null ถ้าผิดรูปแบบ
  function parseAssessmentList(list, idKey, ids) {
    const allowed = new Set(ids);
    const seen = new Set();
    const out = [];
    for (const a of list) {
      if (!a || typeof a !== 'object' || !allowed.has(a[idKey]) || seen.has(a[idKey]) || !STATUSES.includes(a.status)) return null;
      let quotes = null;
      if (Array.isArray(a.quotes)) { if (a.quotes.some((q) => typeof q !== 'string')) return null; quotes = a.quotes; }
      else if (typeof a.quote === 'string') quotes = [a.quote];
      if (a.status !== 'missing' && quotes === null) return null;
      seen.add(a[idKey]);
      const qs = (quotes || []).filter((q) => q.trim() !== '').slice(0, MAX_QUOTES);
      const conf = typeof a.confidence === 'number' && a.confidence >= 0 && a.confidence <= 1 ? a.confidence : null;
      out.push({ id: a[idKey], status: a.status, quotes: a.status === 'missing' ? [] : qs, evidence_type: EVIDENCE_TYPES.includes(a.evidence_type) ? a.evidence_type : '',
        actor: a.status !== 'missing' && ACTORS.includes(a.actor) ? a.actor : '', confidence: conf });
    }
    return out;
  }
  function ruleR0(rawText, roleId, requirementIds, taskIds) {
    if (rawText === null || rawText === undefined || String(rawText).trim() === '') return { usable: false, reason_code: 'no_output', assessments: [], task_assessments: [], tasks_ok: false };
    let obj;
    try { obj = JSON.parse(stripFences(rawText)); } catch (e) { return { usable: false, reason_code: 'invalid_json', assessments: [], task_assessments: [], tasks_ok: false }; }
    const bad = (code) => ({ usable: false, reason_code: code, assessments: [], task_assessments: [], tasks_ok: false });
    if (!obj || typeof obj !== 'object' || !SCHEMA_VERSIONS.includes(obj.schema_version) || !Array.isArray(obj.assessments)) return bad('schema_mismatch');
    if (obj.role_id !== roleId) return bad('role_mismatch');
    const out = parseAssessmentList(obj.assessments, 'requirement_id', requirementIds);
    if (out === null) return bad('schema_mismatch');
    if (out.length < requirementIds.length / 2) return bad('incomplete_coverage');
    // งานหลัก (DEC-55): ผิดรูปแบบไม่ทำให้ผลข้อกำหนดใช้ไม่ได้ · งานหลักทั้งหมดของโมเดลนั้นไม่นับ
    let tasks = []; let tasksOk = false;
    if (taskIds && taskIds.length && Array.isArray(obj.task_assessments)) {
      const t = parseAssessmentList(obj.task_assessments, 'task_id', taskIds);
      if (t !== null && t.length >= taskIds.length / 2) { tasks = t; tasksOk = true; }
    }
    return { usable: true, reason_code: '', assessments: out, task_assessments: tasks, tasks_ok: tasksOk, schema_version: obj.schema_version };
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
  // ตัดคำต่อท้ายแบบเบา (DEC-51): directed/directing → direct · coordination/coordinated → coordinat · planning/planned → plan
  const STEM_RULES = [['izations', 'iz'], ['ization', 'iz'], ['ations', 'at'], ['ation', 'at'], ['itions', 'it'], ['ition', 'it'], ['ions', ''], ['ion', ''],
    ['ments', ''], ['ment', ''], ['nesses', ''], ['ness', ''], ['ities', ''], ['ity', ''], ['ings', ''], ['ing', ''], ['ies', 'y'], ['ied', 'y'],
    ['ers', ''], ['er', ''], ['ed', ''], ['es', ''], ['ly', ''], ['s', '']];
  function stem(word) {
    let s = String(word || '').toLowerCase();
    if (s.length <= 3 || /\d/.test(s)) return s;
    for (const [suf, rep] of STEM_RULES) {
      if (s.endsWith(suf) && s.length - suf.length >= 3) { s = s.slice(0, s.length - suf.length) + rep; break; }
    }
    if (s.length > 4 && s.endsWith('e')) s = s.slice(0, -1);
    if (/([b-df-hj-np-tv-z])\1$/.test(s) && !/(ll|ss|zz)$/.test(s)) s = s.slice(0, -1);
    return s;
  }
  // คำในข้อความพร้อมตำแหน่ง (ใช้ซ่อม quote และเทียบคำพ้องแบบตัดคำต่อท้าย)
  function wordSpans(s) {
    const out = []; const re = /[A-Za-z0-9]+(?:[.'+#][A-Za-z0-9+#]+)*/g; let m;
    const src = String(s || '');
    while ((m = re.exec(src))) out.push({ t: m[0].toLowerCase(), s: m.index, e: m.index + m[0].length });
    return out;
  }
  function lcsLen(a, b) {
    const n = a.length, m = b.length; if (!n || !m) return 0;
    let prev = new Array(m + 1).fill(0);
    for (let i = 1; i <= n; i++) {
      const cur = new Array(m + 1).fill(0);
      for (let j = 1; j <= m; j++) cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
      prev = cur;
    }
    return prev[m];
  }
  // DEC-52: หา span ในเรซูเมที่คำ (หลังตัดคำต่อท้าย) ตรงกับ quote ≥ minSim · คืนตำแหน่งในข้อความจริง
  function repairQuote(quote, text, minSim, minTokens) {
    const Q = wordSpans(quote); const n = Q.length;
    if (n < (minTokens || 5)) return null;
    const T = wordSpans(text); if (T.length < n - 1) return null;
    const qs = Q.map((x) => stem(x.t)); const ts = T.map((x) => stem(x.t));
    const qCount = {}; qs.forEach((x) => { qCount[x] = (qCount[x] || 0) + 1; });
    let best = null;
    for (const L of [n, n - 1, n + 1]) {
      if (L < 1 || L > ts.length) continue;
      const need = Math.ceil(minSim * Math.max(n, L));
      const win = {}; let hits = 0;
      const addTok = (x, d) => { const before = Math.min(win[x] || 0, qCount[x] || 0); win[x] = (win[x] || 0) + d; const after = Math.min(win[x], qCount[x] || 0); hits += after - before; };
      for (let j = 0; j < L; j++) addTok(ts[j], 1);
      for (let i = 0; i + L <= ts.length; i++) {
        if (i > 0) { addTok(ts[i - 1], -1); addTok(ts[i + L - 1], 1); }
        if (hits < need) continue;
        const sim = lcsLen(qs, ts.slice(i, i + L)) / Math.max(n, L);
        if (sim >= minSim && (!best || sim > best.sim + 1e-12)) best = { sim, i, L };
      }
    }
    if (!best) return null;
    const start = T[best.i].s; let end = T[best.i + best.L - 1].e;
    const lastQ = String(quote).trim().slice(-1);
    if (/[.,;:!?)%]/.test(lastQ) && text[end] === lastQ) end += 1;
    return { start, end, sim: round(best.sim, 4) };
  }
  function ruleR2(quote, text, cfg) {
    const q = String(quote || '');
    const none = { verified: false, start: -1, end: -1, text_version: '', matched_text: '' };
    if (q.trim() === '') return none;
    const i = text.indexOf(q);
    if (i >= 0) return { verified: true, start: i, end: i + q.length, text_version: 'normalized', matched_text: q };
    const T = collapseWs(text); const Q = collapseWs(q).text.trim();
    if (!Q) return none;
    const j = T.text.indexOf(Q);
    // ตำแหน่งอ้างอิงข้อความรุ่นที่ยุบช่องว่างแล้ว (3.5.4) และบันทึก quote_text_version ตาม DEC-34
    if (j >= 0) return { verified: true, start: j, end: j + Q.length, text_version: 'whitespace_collapsed', matched_text: Q };
    if (cfg && cfg.r2_repair_min_similarity) {
      const r = repairQuote(q, text, cfg.r2_repair_min_similarity, cfg.r2_repair_min_tokens);
      if (r) return { verified: true, start: r.start, end: r.end, text_version: 'repaired', matched_text: text.slice(r.start, r.end), similarity: r.sim };
    }
    return none;
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
  function stemTokens(s) {
    const out = new Set();
    for (const t of tokenize(s)) {
      out.add(stem(t));
      if (/[-/.]/.test(t)) for (const p of t.split(/[-/.]+/)) if (p.length > 1 && !STOP_WORDS.has(p)) out.add(stem(p));
    }
    return out;
  }
  function targetText(req) {
    if (req.task_text !== undefined) return String(req.task_text || '');
    return [req.element_name, req.element_description, splitList(req.element_aliases).join(' ')].join(' ');
  }
  function targetTokens(req, stemmed) {
    return stemmed ? stemTokens(targetText(req)) : tokenize(targetText(req));
  }
  function aliasHit(quote, req, minLen, stemmed) {
    const q = ' ' + String(quote || '').toLowerCase().replace(/\s+/g, ' ') + ' ';
    const aliases = splitList(req.element_aliases);
    for (const a of aliases) {
      const al = a.toLowerCase().trim();
      if (al.length < minLen) continue;
      const re = new RegExp('(^|[^a-z0-9])' + al.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])');
      if (re.test(q)) return al;
    }
    if (stemmed) {
      const qs = ' ' + wordSpans(quote).map((w) => stem(w.t)).join(' ') + ' ';
      for (const a of aliases) {
        const al = a.toLowerCase().trim();
        if (al.length < minLen) continue;
        const as = wordSpans(al).map((w) => stem(w.t)).join(' ');
        if (as && qs.indexOf(' ' + as + ' ') >= 0) return al;
      }
    }
    return null;
  }
  function overlapScore(quote, req, cfg) {
    const stemmed = cfg.r3_stemming === true;
    const hit = aliasHit(quote, req, cfg.alias_min_length, stemmed);
    if (hit) return { score: 1, alias: hit };
    const Tq = stemmed ? stemTokens(quote) : tokenize(quote); const Tr = targetTokens(req, stemmed);
    if (Tq.size === 0 || Tr.size === 0) return { score: 0, alias: null };
    let inter = 0; for (const t of Tq) if (Tr.has(t)) inter++;
    return { score: inter / Math.min(Tq.size, cfg.overlap_denominator_cap), alias: null }; // สมการ 3.2 · ไม่ตัดเพดานที่ 1
  }

  // ---- R3b ตรวจความหมายข้ามโมเดล (DEC-51) ----
  function chooseVerifier(claimant, available, cfg) {
    const rot = (cfg && cfg.verifier_rotation) || { A: 'B', B: 'C', C: 'A' };
    const order = [rot[claimant]].concat(MODEL_KEYS.filter((k) => k !== claimant && k !== rot[claimant]));
    for (const k of order) if (k && k !== claimant && available.includes(k)) return k;
    if (cfg && cfg.allow_self_verification && available.includes(claimant)) return claimant;
    return '';
  }
  function judgeQuotes(quotes, target, text, cfg) {
    return quotes.map((raw, qi) => {
      const r2 = ruleR2(raw, text, cfg);
      let ov = null;
      if (r2.verified) ov = overlapScore(r2.matched_text, target, cfg);
      return { qi, raw, r2, matched: r2.matched_text || '', score: ov ? ov.score : null, alias: ov ? ov.alias : null, r3a: !!ov && ov.score >= cfg.theta };
    });
  }
  // รวบรวมข้อสรุปของทุกโมเดล + ข้อความที่ต้องให้โมเดลอื่นตรวจความหมาย (ลำดับคงที่ จึงเรียกซ้ำได้ผลเดิม)
  function collectClaims(input) {
    const { roleId, requirements, text, modelResults } = input; const cfg = input.projectCfg;
    const tasks = input.roleTasks || [];
    const reqIds = requirements.map((r) => r.requirement_id); const taskIds = tasks.map((t) => t.task_id);
    const targets = Object.fromEntries(requirements.map((r) => [r.requirement_id, r]).concat(tasks.map((t) => [t.task_id, t])));
    const available = MODEL_KEYS.filter((k) => modelResults[k] && modelResults[k].status === 'ok' && modelResults[k].output);
    const perModel = {}; const checks = [];
    for (const k of MODEL_KEYS) {
      const mr = modelResults[k];
      if (!mr) continue;
      const raw = mr.status === 'ok' && mr.output ? mr.output.text : null;
      const r0 = ruleR0(raw, roleId, reqIds, taskIds);
      const pm = { r0, call_status: mr.status, claims: [] };
      perModel[k] = pm;
      if (!r0.usable) continue;
      const lists = [['requirement', r0.assessments]].concat(r0.tasks_ok ? [['task', r0.task_assessments]] : []);
      for (const [kind, list] of lists) {
        for (const a of list) {
          const target = targets[a.id];
          const qs = a.status === 'missing' ? [] : judgeQuotes(a.quotes, target, text, cfg);
          const claim = { kind, id: a.id, a, qs, checks: [] };
          const needCheck = a.status !== 'missing' && qs.some((q) => q.r2.verified) && !qs.some((q) => q.r3a);
          if (needCheck && cfg.r3_mode === 'hybrid') {
            const vk = chooseVerifier(k, available, cfg);
            for (const q of qs.filter((x) => x.r2.verified)) {
              const c = { check_id: '', claimant: k, verifier: vk, kind, target_id: a.id, qi: q.qi, quote: q.matched,
                target_text: kind === 'task' ? target.task_text : target.element_name + ': ' + target.element_description,
                level: kind === 'task' ? null : (Number.isFinite(Number(target.level_lv)) && target.level_lv !== '' ? Number(target.level_lv) : null),
                hands_on: kind === 'task' ? taskNeedsPerformed(input.roleId, cfg) : needsPerformed(target, cfg) };
              checks.push(c); claim.checks.push(c);
            }
          }
          pm.claims.push(claim);
        }
      }
    }
    checks.forEach((c, i) => { c.check_id = 'c' + String(i + 1).padStart(3, '0'); });
    return { perModel, checks, available };
  }
  function buildVerifierPrompt(template, checks) {
    // verifier_v1.1 ส่ง level (LV ของ O*NET) และ hands_on ให้ผู้ตรวจแยก "ลงมือทำเอง" ออกจาก "กำกับ/ส่งมอบ" (DEC-60)
    const list = checks.map((c) => ({ check_id: c.check_id, target: c.target_text, level: c.level === undefined ? null : c.level, hands_on: !!c.hands_on, quote: c.quote }));
    return String(template).split('{{CHECKS_JSON}}').join(JSON.stringify(list, null, 1));
  }
  // คืนคำขอตรวจแยกตามโมเดลผู้ตรวจ { A: {check_ids, prompt}, ... } · ไม่มีข้อให้ตรวจ = ไม่มี key นั้น
  function prepareVerification(input) {
    const col = collectClaims(input);
    const cc = cacheCfg(input.projectCfg); const cin = input.cache || {};
    const on = cc.enabled === true && cin.enabled !== false && !!cin.entries;
    const keys = {}; const cached = {};
    for (const c of col.checks) {
      if (!c.verifier) continue;
      const key = verifierCacheKey({ prompt: cin.prompt_id || VERIFIER_SCHEMA, model: (cin.model_ids || {})[c.verifier] || '', target_id: c.target_id, quote: c.quote });
      keys[c.check_id] = key;
      if (on && cin.entries[key] && VERDICTS.includes(cin.entries[key].v)) { cached[c.check_id] = cin.entries[key].v; c.cached = true; }
    }
    const requests = {};
    for (const vk of MODEL_KEYS) {
      const cs = col.checks.filter((c) => c.verifier === vk && !c.cached);
      if (cs.length) requests[vk] = { check_ids: cs.map((c) => c.check_id), n_checks: cs.length, prompt: buildVerifierPrompt(input.verifierTemplate, cs) };
    }
    return { checks: col.checks, requests, n_unassigned: col.checks.filter((c) => !c.verifier).length, cached, cache_keys: keys, cache_on: on, n_cached: Object.keys(cached).length };
  }
  function parseVerifierOutput(rawText, expectedIds) {
    const res = { ok: false, reason: '', verdicts: {} };
    if (rawText === null || rawText === undefined || String(rawText).trim() === '') { res.reason = 'no_output'; return res; }
    let obj;
    try { obj = JSON.parse(stripFences(rawText)); } catch (e) { res.reason = 'invalid_json'; return res; }
    if (!obj || !VERIFIER_SCHEMAS.includes(obj.schema_version) || !Array.isArray(obj.checks)) { res.reason = 'schema_mismatch'; return res; }
    const allowed = new Set(expectedIds);
    for (const c of obj.checks) {
      if (c && allowed.has(c.check_id) && VERDICTS.includes(c.verdict) && !(c.check_id in res.verdicts)) res.verdicts[c.check_id] = c.verdict;
    }
    res.ok = true;
    if (Object.keys(res.verdicts).length < expectedIds.length) res.reason = 'incomplete';
    return res;
  }

  // ---- R7 ผู้ลงมือทำ · ระดับ LV · ข้อความซ้ำ (DEC-60) ----
  function actorCfg(cfg) {
    return Object.assign({ enabled: true, hands_on_prefixes: [], expert_lv_min: 5, expert_min_actor: 'led', task_min_actor_default: 'performed', task_min_actor_by_role: {} }, (cfg && cfg.actor_rules) || {});
  }
  function reuseCfg(cfg) { return Object.assign({ enabled: true, max_full_evidence_per_quote: 2, overlap_min: 0.6 }, (cfg && cfg.quote_reuse) || {}); }
  function needsPerformed(req, cfg) {
    const a = actorCfg(cfg);
    return a.enabled !== false && (a.hands_on_prefixes || []).some((p) => String((req && req.element_id) || '').startsWith(p));
  }
  // ระดับต่ำสุดของผู้ลงมือทำที่ยอมให้เป็นหลักฐานเต็ม: ข้อเชิงปฏิบัติ = performed · ข้อที่ LV ≥ expert_lv_min = expert_min_actor · อื่น ๆ ไม่จำกัด
  function requirementMinActor(req, cfg) {
    const a = actorCfg(cfg);
    if (a.enabled === false) return 0;
    if (needsPerformed(req, cfg)) return ACTOR_RANK.performed;
    const lv = Number(req && req.level_lv);
    if (req && req.level_lv !== '' && req.level_lv !== null && req.level_lv !== undefined && Number.isFinite(lv) && lv >= a.expert_lv_min) return ACTOR_RANK[a.expert_min_actor];
    return 0;
  }
  function taskMinActor(roleId, cfg) {
    const a = actorCfg(cfg);
    return ACTOR_RANK[(a.task_min_actor_by_role || {})[roleId] || a.task_min_actor_default];
  }
  function taskNeedsPerformed(roleId, cfg) { return actorCfg(cfg).enabled !== false && taskMinActor(roleId, cfg) === ACTOR_RANK.performed; }
  // ผู้ลงมือทำของข้อหนึ่ง = ค่าที่พบมากที่สุดในโมเดลที่ลงคะแนนตรงกับสถานะสุดท้าย (เท่ากันใช้ค่าที่อ่อนกว่า)
  function majorityActor(entries, finalStatus) {
    const cnt = {};
    for (const x of entries) if (x.v.vote === finalStatus && x.actor) cnt[x.actor] = (cnt[x.actor] || 0) + 1;
    const ks = Object.keys(cnt);
    if (!ks.length) return '';
    return ks.sort((a, b) => (cnt[b] - cnt[a]) || (ACTOR_RANK[a] - ACTOR_RANK[b]))[0];
  }
  function specOf(spec, elementId) {
    const e = spec && spec.by_element && spec.by_element[elementId];
    return e || { df: 1, idf: 1 };
  }
  // ความเฉพาะอาชีพของแต่ละองค์ประกอบ: df = จำนวนอาชีพที่มีองค์ประกอบนี้ในข้อกำหนด · idf = ln((N+1)/(df+0.5))
  function buildSpecificity(requirementRows) {
    const roles = new Set(); const per = {};
    for (const r of requirementRows) { roles.add(r.role_id); (per[r.element_id] = per[r.element_id] || new Set()).add(r.role_id); }
    const n = roles.size; const by = {};
    for (const el of Object.keys(per).sort()) by[el] = { df: per[el].size, idf: round(Math.log((n + 1) / (per[el].size + 0.5)), 4) };
    return { n_roles: n, by_element: by };
  }
  function applyR7(rows, ctx) {
    const { reqById, votesById, cfg, spec } = ctx;
    const stats = { n_actor: 0, n_reuse: 0, n_actor_unknown: 0 };
    for (const r of rows) {
      r.actor = '';
      if ((r.final !== 'evidenced' && r.final !== 'partially') || r.ev.source !== 'models') continue;
      r.actor = majorityActor(votesById[r.id] || [], r.final);
      if (r.final !== 'evidenced') continue;
      const need = requirementMinActor(reqById[r.id], cfg);
      if (!need) continue;
      if (!r.actor) { r.flags.push('R7_actor_unknown'); stats.n_actor_unknown++; continue; }
      if (ACTOR_RANK[r.actor] < need) { r.final = 'partially'; r.flags.push('R7_actor:' + r.actor); stats.n_actor++; }
    }
    const rc = reuseCfg(cfg);
    if (rc.enabled !== false) {
      const cand = rows.filter((r) => r.final === 'evidenced' && r.ev.source === 'models' && r.ev.start >= 0);
      const par = cand.map((_, i) => i); const find = (i) => (par[i] === i ? i : (par[i] = find(par[i])));
      const ovl = (a, b) => Math.max(0, Math.min(a.ev.end, b.ev.end) - Math.max(a.ev.start, b.ev.start)) / Math.max(1, Math.min(a.ev.end - a.ev.start, b.ev.end - b.ev.start));
      for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) if (ovl(cand[i], cand[j]) >= rc.overlap_min) par[find(j)] = find(i);
      const groups = {}; cand.forEach((r, i) => { (groups[find(i)] = groups[find(i)] || []).push(r); });
      for (const g of Object.values(groups)) {
        if (g.length <= rc.max_full_evidence_per_quote) continue;
        g.sort((a, b) => (specOf(spec, reqById[a.id].element_id).df - specOf(spec, reqById[b.id].element_id).df)
          || (Number(reqById[b.id].weight_renormalized) - Number(reqById[a.id].weight_renormalized)) || (a.id < b.id ? -1 : 1));
        g.slice(rc.max_full_evidence_per_quote).forEach((r) => { r.final = 'partially'; r.flags.push('R7_reuse'); stats.n_reuse++; });
      }
    }
    return stats;
  }
  // Role-Fit (DEC-60 · ตัวชี้วัดเสริมในรายงานผู้เรียน ไม่ใช่ตัวชี้วัดของคำถามวิจัย): R_role ถ่วงน้ำหนักด้วย idf แล้วผสมกับ T
  function roleFitCfg(cfg) { return Object.assign({ weight_task: 0.5, high_min: 75, high_task_min: 60, mid_min: 50 }, (cfg && cfg.role_fit) || {}); }
  function computeRoleFit(items, taskIndex, cfg) {
    const rf = roleFitCfg(cfg);
    const D = items.filter((d) => d.final_status !== 'abstained');
    const den = D.reduce((s0, d) => s0 + d.weight * d.idf, 0);
    if (!D.length || den === 0) return { readiness_role_pct: 'N/A', role_fit: 'N/A', role_fit_band: 'N/A' };
    const rRole = (D.reduce((s0, d) => s0 + d.weight * d.idf * STATUS_SCORE[d.final_status], 0) / den) * 100;
    const t = typeof taskIndex === 'number' ? taskIndex : null;
    const f = t === null ? rRole : (1 - rf.weight_task) * rRole + rf.weight_task * t;
    let band = 'low';
    if (f >= rf.high_min && t !== null && t >= rf.high_task_min) band = 'high'; else if (f >= rf.mid_min) band = 'mid';
    return { readiness_role_pct: round(rRole, 2), role_fit: round(f, 2), role_fit_band: band };
  }

  // ---- ตราประทับรุ่น (DEC-60 · ข้อ S5) ----
  function buildStamp(p) {
    const x = p || {};
    return { wf_version: x.wf_version || '', build_id: x.build_id || '', engine_version: ENGINE_VERSION, analyst_prompt: x.analyst_prompt || '', verifier_prompt: x.verifier_prompt || '',
      rules_version: x.rules_version || '', data_sha: x.data_sha || '' };
  }
  // คืนรายการเหตุที่ต้องปฏิเสธรอบ: engine ในโหนดไม่ตรงกับตราประทับ · โหนดต่างรุ่นกัน · build ไม่ตรงกับรุ่นที่ freeze
  function versionIssues(local, others, freeze) {
    const bad = []; const l = local || {};
    if (l.engine_version !== ENGINE_VERSION) bad.push('engine ' + ENGINE_VERSION + ' ≠ ' + l.engine_version);
    for (const o of others || []) if (o && o.build_id !== l.build_id) bad.push('build ' + l.build_id + ' ≠ ' + o.build_id);
    if (freeze && freeze.frozen === true && l.build_id !== freeze.build_id) bad.push('build ' + l.build_id + ' ไม่ตรงกับรุ่นที่ freeze (' + freeze.build_id + ')');
    return bad;
  }
  // ---- token รายขั้น (DEC-60) ----
  function tokenSummary(calls, pricing) {
    const by = {}; const tot = { calls: 0, input: 0, output: 0 }; let cost = 0; let costOk = !!pricing;
    for (const c of calls || []) {
      const key = c.call_purpose === 'verifier' ? 'verifier' : 'analyst';
      const b = by[key] = by[key] || { calls: 0, input: 0, output: 0 };
      const i = Number(c.input_tokens) || 0; const o = Number(c.output_tokens) || 0;
      b.calls++; b.input += i; b.output += o; tot.calls++; tot.input += i; tot.output += o;
      const pr = pricing && pricing.models && pricing.models[c.model_key];
      if (pr && typeof pr.input_per_1m === 'number' && typeof pr.output_per_1m === 'number') cost += (i * pr.input_per_1m + o * pr.output_per_1m) / 1e6; else costOk = false;
    }
    return { by_purpose: by, total: tot, cost_usd: costOk && tot.calls ? round(cost, 4) : null };
  }
  function modelIdsSummary(calls) {
    const seen = {};
    for (const c of calls || []) if (c.status === 'ok' && c.model_id) (seen[c.model_key] = seen[c.model_key] || new Set()).add(c.model_id);
    return Object.keys(seen).sort().map((k) => k + ':' + [...seen[k]].sort().join('/')).join(';');
  }
  // ---- cache คำตัดสินของผู้ตรวจ (DEC-60 · เก็บเฉพาะ hash ไม่เก็บข้อความ) ----
  function cacheCfg(cfg) { return Object.assign({ enabled: false, max_entries: 3000 }, (cfg && cfg.verifier_cache) || {}); }
  function verifierCacheKey(p) { return sha256Hex([p.prompt || '', p.model || '', p.target_id || '', sha256Hex(p.quote || '')].join('|')); }
  function mergeVerifierCache(old, additions, maxEntries) {
    const merged = Object.assign({}, old || {}, additions || {});
    const keys = Object.keys(merged);
    if (keys.length > maxEntries) keys.sort((a, b) => merged[a].t - merged[b].t).slice(0, keys.length - maxEntries).forEach((k) => delete merged[k]);
    return merged;
  }
  function newCacheEntries(freshVerdicts, cacheKeys, nowMs) {
    const out = {};
    for (const id of Object.keys(freshVerdicts || {})) if (cacheKeys && cacheKeys[id]) out[cacheKeys[id]] = { v: freshVerdicts[id], t: nowMs };
    return out;
  }

  // ---- ฐานขั้นต่ำจากหลักฐานที่โปรแกรมตรวจได้เอง (DEC-54) ----
  const CREDENTIAL_EXCLUDE = /\b(prep|preparation|course|training|studying|in progress|candidate|planned|pursuing|expected)\b|กำลัง|เตรียมสอบ/i;
  function textLines(text) {
    const out = []; const re = /[^\n|•;]+/g; let m;
    while ((m = re.exec(text))) { const raw = m[0]; const lead = raw.length - raw.trimStart().length; const t = raw.trim(); if (t) out.push({ t, s: m.index + lead, e: m.index + lead + t.length }); }
    return out;
  }
  function credentialKeys(item) {
    const keys = [];
    const title = normalizeText(item.title || '');
    if (item.exam_code && /^[A-Za-z0-9-]{3,}$/.test(item.exam_code)) keys.push(item.exam_code);
    (title.match(/\(([^)]+)\)/g) || []).forEach((p) => { const k = p.slice(1, -1).trim(); if (/^[A-Z0-9][A-Za-z0-9 .+-]{1,19}$/.test(k) && /[A-Z]{2}/.test(k)) keys.push(k); });
    const bare = title.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
    if (bare.length >= 12) keys.push(bare);
    return keys;
  }
  // R5: ใบรับรองในคลัง (mapping L1 ที่ผ่านตรวจของอาชีพนี้) ที่ชื่อ/รหัสสอบปรากฏในเรซูเม → ข้อกำหนดที่ mapping ระบุได้อย่างน้อย partially
  function credentialEvidence(input) {
    const { text, corpus, mappings, roleId, projectCfg } = input;
    const out = {};
    if (!corpus || !mappings) return out;
    const approved = new Set(projectCfg.approved_mapping_statuses);
    const items = Object.fromEntries(corpus.map((c) => [c.item_id, c]));
    const byItem = {};
    for (const m of mappings) {
      if (m.role_id !== roleId || m.coverage_layer !== L1_LAYER || !approved.has(m.mapping_status)) continue;
      (byItem[m.item_id] = byItem[m.item_id] || []).push(m.requirement_id);
    }
    const lines = textLines(text);
    for (const id of Object.keys(byItem).sort()) {
      const it = items[id];
      if (!it || it.item_type !== 'certification') continue;
      let hit = null;
      for (const k of credentialKeys(it)) {
        const re = new RegExp('(^|[^A-Za-z0-9])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^A-Za-z0-9])', 'i');
        hit = lines.find((l) => re.test(l.t) && !CREDENTIAL_EXCLUDE.test(l.t));
        if (hit) { hit = Object.assign({ key: k }, hit); break; }
      }
      if (!hit) continue;
      for (const rid of byItem[id]) if (!out[rid]) out[rid] = { item_id: id, title: it.title, key: hit.key, quote: hit.t, start: hit.s, end: hit.e };
    }
    return out;
  }
  // H (DEC-55): เทคโนโลยีที่ตลาดต้องการของอาชีพที่พบแบบทั้งคำในเรซูเม (ไม่ใช้โมเดล)
  function techMatch(text, techRows, nFixed) {
    // DEC-60: ตัวส่วนคงที่ (nFixed รายการแรกของอาชีพ) ให้ H เทียบข้ามอาชีพได้ · อาชีพที่มีน้อยกว่า nFixed → N/A
    const all = techRows || [];
    const rows = nFixed ? all.slice(0, nFixed) : all;
    const found = [];
    for (const r of rows) {
      for (const k of splitList(r.match_keys)) {
        if (k.length < 2) continue;
        const re = new RegExp('(^|[^A-Za-z0-9+#])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^A-Za-z0-9+#])', 'i');
        const m = re.exec(text);
        if (m) { const s = m.index + m[1].length; found.push({ technology: r.technology, key: k, start: s, end: s + k.length }); break; }
      }
    }
    const sufficient = !nFixed || all.length >= nFixed;
    return { n_total: rows.length, n_found: found.length, sufficient, pct: rows.length && sufficient ? round((found.length / rows.length) * 100, 2) : 'N/A', found };
  }

  // ---- เสียงของโมเดลหนึ่งต่อข้อหนึ่ง (3 แบบ: กฎหลัก · R3 คำซ้ำอย่างเดียว · ไม่มี R3 → ใช้ทำ ablation) ----
  const VERDICT_RANK = { supports: 3, partially_supports: 2, unrelated: 1 };
  function voteFor(claim, verdicts, cfg) {
    const a = claim.a; const flags = [];
    const v = { vote: a.status, vote_lex: a.status, vote_nor3: a.status, flags, best: null, score: null, r3_layer: '', verifier_key: '', verdict: '', rejected: false, downgraded: false, unverified: false, repaired: false };
    if (a.status === 'missing') { flags.push('model_missing'); return v; }
    const ok = claim.qs.filter((q) => q.r2.verified);
    if (!ok.length) { flags.push('R2_quote_not_found'); v.vote = v.vote_lex = v.vote_nor3 = 'missing'; v.rejected = true; return v; }
    if (ok.some((q) => q.r2.text_version === 'repaired')) { flags.push('R2_repaired'); v.repaired = true; }
    if (ok.some((q) => q.r2.text_version === 'whitespace_collapsed')) flags.push('R2_whitespace_collapsed');
    const lex = ok.filter((q) => q.r3a).sort((x, y) => (y.score - x.score) || (x.matched.length - y.matched.length) || (x.qi - y.qi));
    if (lex.length) {
      v.best = lex[0]; v.score = lex[0].score; v.r3_layer = 'lexical';
      if (lex[0].alias) flags.push('R3_alias_hit');
      return v;
    }
    v.vote_lex = 'missing';
    const top = ok.slice().sort((x, y) => (y.score - x.score) || (x.qi - y.qi))[0];
    v.score = top.score;
    if (cfg.r3_mode !== 'hybrid') { flags.push('R3_low_overlap'); v.vote = 'missing'; v.rejected = true; v.best = top; return v; }
    flags.push('R3a_low_overlap');
    v.r3_layer = 'semantic';
    let bestC = null;
    for (const c of claim.checks) {
      const vd = verdicts[c.check_id];
      if (vd && (!bestC || VERDICT_RANK[vd] > VERDICT_RANK[bestC.vd])) bestC = { c, vd };
      if (c.verifier) v.verifier_key = c.verifier;
    }
    if (!bestC) { flags.push('R3b_unavailable'); v.vote = 'unverified'; v.unverified = true; v.best = top; return v; }
    v.verdict = bestC.vd; v.best = ok.find((q) => q.qi === bestC.c.qi) || top;
    if (bestC.vd === 'supports') flags.push('R3b_supports');
    else if (bestC.vd === 'partially_supports') { flags.push('R3b_partial'); if (a.status === 'evidenced') { v.vote = 'partially'; v.downgraded = true; } }
    else { flags.push('R3b_unrelated'); v.vote = 'missing'; v.rejected = true; }
    return v;
  }
  // R1 + R4: รวมเสียงของโมเดลที่ผ่าน R0 (เสียง unverified ไม่นับ) · field = vote | vote_lex | vote_nor3
  function aggregate(ids, votesById, haltAll, field, need) {
    const minVotes = need || 2; // R1: สถานะต้องได้อย่างน้อย 2 เสียง (Demo โมเดลเดียวรอบเดียวตั้ง min_agreeing_votes = 1)
    return ids.map((id) => {
      const votes = votesById[id] || [];
      const counted = votes.filter((x) => x.v[field] !== 'unverified');
      const mi = counted.length; const flags = [];
      let final = 'abstained';
      if (haltAll) flags.push('R1_min_models_not_met');
      else {
        const cnt = { evidenced: 0, partially: 0, missing: 0 };
        counted.forEach((x) => cnt[x.v[field]]++);
        const max = Math.max(cnt.evidenced, cnt.partially, cnt.missing);
        if (max >= minVotes) {
          const tied = STATUSES.filter((s) => cnt[s] === max);
          final = tied.length === 1 ? tied[0] : TIE_ORDER.find((s) => tied.includes(s));
          if (tied.length > 1) flags.push('R1_tie_break');
        } else { flags.push('R1_no_two_votes'); if (votes.some((x) => x.v[field] === 'unverified')) flags.push('R1_unverified'); }
      }
      const agree = final === 'abstained' ? 0 : counted.filter((x) => x.v[field] === final).length;
      const ai = mi === 0 || final === 'abstained' ? 0 : agree / mi;
      let ev = { quote: '', start: -1, end: -1, source: '' };
      if (final === 'evidenced' || final === 'partially') {
        const cands = counted.filter((x) => x.v[field] === final && x.v.best)
          .sort((p, q) => ((q.v.score || 0) - (p.v.score || 0)) || (p.v.best.matched.length - q.v.best.matched.length) || (p.k < q.k ? -1 : 1));
        if (cands.length) ev = { quote: cands[0].v.best.matched, start: cands[0].v.best.r2.start, end: cands[0].v.best.r2.end, source: 'models' };
      }
      if (field === 'vote') votes.forEach((x) => x.v.flags.forEach((f) => { if (/^R2_quote|^R3_low|^R3b_/.test(f)) flags.push(x.k + ':' + f); }));
      return { id, final, ai, mi, flags, ev };
    });
  }
  function applyFloors(rows, ctx) {
    // R5 ใบรับรอง แล้ว R6 ความเชื่อมโยงทักษะ–กิจกรรม (เฉพาะข้อที่ยัง missing/abstained · ไม่ใช้เมื่อหยุดสรุปทั้งฉบับ)
    const { cred, links, reqById, cfg } = ctx;
    const floors = cfg.evidence_floors || {};
    const byElement = {};
    rows.forEach((r) => { byElement[reqById[r.id].element_id] = r; });
    const modelEvidenced = new Set(rows.filter((r) => r.final === 'evidenced').map((r) => reqById[r.id].element_id));
    for (const r of rows) {
      if (!(r.final === 'missing' || r.final === 'abstained') || r.flags.includes('R1_min_models_not_met')) continue;
      const c = floors.credential && cred[r.id];
      if (c) { r.final = 'partially'; r.flags.push('R5_credential:' + c.item_id); r.ev = { quote: c.quote, start: c.start, end: c.end, source: 'credential' }; continue; }
      const req = reqById[r.id];
      if (floors.linkage && (floors.linkage_domains || []).includes(req.domain)) {
        const acts = (links || []).filter((l) => l.skill_element_id === req.element_id && modelEvidenced.has(l.activity_element_id)).map((l) => l.activity_element_id).sort();
        if (acts.length) {
          const src = byElement[acts[0]];
          r.final = 'partially'; r.flags.push('R6_linkage:' + acts.join('+')); r.ev = { quote: src.ev.quote, start: src.ev.start, end: src.ev.end, source: 'linkage' };
        }
      }
    }
    return rows;
  }

  /**
   * ตรวจและรวมผลทั้งรอบ (UC-04)
   * modelResults:    { A: {status:'ok'|'failed', output:{text}|null}, B:..., C:... }   ผลของ prompt analyst
   * verifierResults: { A: {status, output:{text}} ... } ผลของ prompt verifier แยกตามโมเดลผู้ตรวจ (R3b · ไม่มี = R3b_unavailable)
   * roleTasks / roleTech / skillLinks / corpus / mappings: ไม่บังคับ (DEC-54/55)
   */
  function evaluateRun(input) {
    const { runId, roleId, requirements, text, modelResults, nowIso } = input; const projectCfg = input.projectCfg;
    const roleTasks = input.roleTasks || [];
    const reqById = Object.fromEntries(requirements.map((r) => [r.requirement_id, r]));
    const col = collectClaims(input);
    // คำตอบของโมเดลผู้ตรวจ
    const verdicts = {}; const verification = {}; const freshVerdicts = {}; const cachedV = input.cachedVerdicts || {};
    for (const vk of MODEL_KEYS) {
      const ids = col.checks.filter((c) => c.verifier === vk).map((c) => c.check_id);
      if (!ids.length) continue;
      const cachedIds = ids.filter((id) => VERDICTS.includes(cachedV[id]));
      const freshIds = ids.filter((id) => !cachedIds.includes(id));
      cachedIds.forEach((id) => { verdicts[id] = cachedV[id]; });
      if (!freshIds.length) { verification[vk] = { n_checks: ids.length, n_answered: ids.length, n_cached: cachedIds.length, call_status: 'cached', reason: '' }; continue; }
      const vr = (input.verifierResults || {})[vk];
      const raw = vr && vr.status === 'ok' && vr.output ? vr.output.text : null;
      const p = parseVerifierOutput(raw, freshIds);
      Object.assign(verdicts, p.verdicts); Object.assign(freshVerdicts, p.verdicts);
      verification[vk] = { n_checks: ids.length, n_answered: cachedIds.length + Object.keys(p.verdicts).length, n_cached: cachedIds.length, call_status: vr ? vr.status : 'not_called', reason: p.reason };
    }
    const perModel = {}; const findings = [];
    const reqVotes = {}; const taskVotes = {};
    for (const k of MODEL_KEYS) {
      const pm0 = col.perModel[k];
      if (!pm0) continue;
      const r0 = pm0.r0;
      perModel[k] = { key: k, call_status: pm0.call_status, r0_usable: r0.usable, r0_reason: r0.usable ? '' : (pm0.call_status === 'ok' ? r0.reason_code : 'no_output'),
        tasks_ok: !!r0.tasks_ok, n_claims: 0, n_rejected: 0, n_missing_direct: 0, n_downgraded: 0, n_unverified: 0, n_repaired: 0 };
      if (!r0.usable) continue;
      for (const claim of pm0.claims) {
        const v = voteFor(claim, verdicts, projectCfg);
        const pm = perModel[k];
        if (claim.kind === 'requirement') {
          if (claim.a.status === 'missing') pm.n_missing_direct++;
          else {
            pm.n_claims++;
            if (v.rejected) pm.n_rejected++;
            if (v.rejected || v.downgraded) pm.n_downgraded++;
            if (v.unverified) pm.n_unverified++;
            if (v.repaired) pm.n_repaired++;
          }
          (reqVotes[claim.id] = reqVotes[claim.id] || []).push({ k, v, actor: claim.a.actor || '' });
        } else (taskVotes[claim.id] = taskVotes[claim.id] || []).push({ k, v, actor: claim.a.actor || '' });
        const q = v.best || (claim.qs[0] || null);
        findings.push({ run_id: runId, requirement_id: claim.id, model_key: k, claimed_status: claim.a.status, quote: q ? q.raw : '',
          quote_char_start: q && q.r2.verified ? q.r2.start : -1, quote_char_end: q && q.r2.verified ? q.r2.end : -1, quote_text_version: q ? q.r2.text_version : '',
          quote_verified: claim.a.status === 'missing' ? '' : !!(q && q.r2.verified), overlap_score: v.score === null || v.score === undefined ? '' : round(v.score, 4),
          model_confidence: claim.a.confidence === null ? '' : claim.a.confidence, rule_flags: v.flags.join('|'), created_at: nowIso,
          target_kind: claim.kind, quote_index: q ? q.qi : '', evidence_type: claim.a.evidence_type || '', actor: claim.a.actor || '', r3_layer: v.r3_layer, verifier_key: v.verifier_key, verifier_verdict: v.verdict, final_vote: v.vote });
      }
    }
    const usable = MODEL_KEYS.filter((k) => perModel[k] && perModel[k].r0_usable);
    const m = usable.length;
    const haltAll = m < projectCfg.min_usable_models;
    const reqIds = requirements.map((r) => r.requirement_id);
    const cred = credentialEvidence({ text, corpus: input.corpus, mappings: input.mappings, roleId, projectCfg });
    const floorCtx = { cred, links: input.skillLinks, reqById, cfg: projectCfg };
    const need = projectCfg.min_agreeing_votes || 2;
    const rows = applyFloors(aggregate(reqIds, reqVotes, haltAll, 'vote', need), floorCtx);
    const spec = input.specificity || null;
    const rBeforeR7 = computeScores(rows.map((r) => ({ final_status: r.final, weight: Number(reqById[r.id].weight_renormalized) })), {}).readiness_pct;
    const r7 = haltAll ? { n_actor: 0, n_reuse: 0, n_actor_unknown: 0 } : applyR7(rows, { reqById, votesById: reqVotes, cfg: projectCfg, spec });
    const decisions = rows.map((r) => {
      const req = reqById[r.id];
      return { run_id: runId, requirement_id: r.id, element_id: req.element_id, element_name: req.element_name, domain: req.domain, weight: Number(req.weight_renormalized),
        idf: specOf(spec, req.element_id).idf, df: specOf(spec, req.element_id).df, actor: r.actor || '',
        final_status: r.final, agreement_level: round(r.ai, 4), n_usable_models: r.mi, rule_flags: r.flags.join('|'), evidence_quote: r.ev.quote,
        evidence_char_start: r.ev.start, evidence_char_end: r.ev.end, evidence_source: r.final === 'evidenced' || r.final === 'partially' ? r.ev.source : '', created_at: nowIso };
    });
    // งานหลักของอาชีพ (DEC-55) · กฎเดียวกันแต่ไม่มีฐานขั้นต่ำ · ไม่รวมใน R
    const taskHalt = haltAll || usable.filter((k) => perModel[k].tasks_ok).length < projectCfg.min_usable_models;
    const taskAgg = aggregate(roleTasks.map((t) => t.task_id), taskVotes, taskHalt, 'vote', need);
    const tMin = taskMinActor(roleId, projectCfg); let nTaskActor = 0;
    for (const r of taskAgg) {
      r.actor = '';
      if (r.final !== 'evidenced' && r.final !== 'partially') continue;
      r.actor = majorityActor(taskVotes[r.id] || [], r.final);
      if (actorCfg(projectCfg).enabled !== false && r.final === 'evidenced' && r.actor && ACTOR_RANK[r.actor] < tMin) { r.final = 'partially'; r.flags.push('R7_actor:' + r.actor); nTaskActor++; }
    }
    const taskRows = taskAgg.map((r, i) => ({ run_id: runId, task_id: r.id, task_text: roleTasks[i].task_text, actor: r.actor,
      final_status: r.final, agreement_level: round(r.ai, 4), n_usable_models: r.mi, rule_flags: r.flags.join('|'), evidence_quote: r.ev.quote,
      evidence_char_start: r.ev.start, evidence_char_end: r.ev.end, created_at: nowIso }));
    const tech = techMatch(text, input.roleTech, projectCfg.h_tech_n);
    const scores = computeScores(decisions, perModel);
    const T = taskRows.filter((t) => t.final_status !== 'abstained');
    scores.role_task_index = T.length ? round((T.reduce((s, t) => s + STATUS_SCORE[t.final_status], 0) / T.length) * 100, 2) : 'N/A';
    scores.n_role_tasks = taskRows.length; scores.n_role_tasks_decided = T.length;
    scores.tech_match_pct = tech.pct; scores.n_tech_found = tech.n_found; scores.n_tech_total = tech.n_total;
    // ablation (3.8): R ภายใต้กฎ R3 แบบต่าง ๆ จากผลเรียกโมเดลชุดเดียวกัน · ไม่ใช้ฐานขั้นต่ำ
    const rOf = (field) => computeScores(aggregate(reqIds, reqVotes, haltAll, field, need).map((r) => ({ final_status: r.final, weight: Number(reqById[r.id].weight_renormalized) })), {}).readiness_pct;
    scores.ablation = { r3_hybrid_no_floors: rOf('vote'), r3_lexical_only: rOf('vote_lex'), no_r3: rOf('vote_nor3') };
    scores.ablation.before_r7 = rBeforeR7;
    scores.n_r7_actor = r7.n_actor; scores.n_r7_reuse = r7.n_reuse; scores.n_r7_task_actor = nTaskActor; scores.n_actor_unknown = r7.n_actor_unknown;
    Object.assign(scores, computeRoleFit(decisions, scores.role_task_index, projectCfg));
    scores.n_floor_credential = decisions.filter((d) => d.evidence_source === 'credential').length;
    scores.n_floor_linkage = decisions.filter((d) => d.evidence_source === 'linkage').length;
    return { m, halted: haltAll, per_model: perModel, findings, decisions, task_decisions: taskRows, tech, verification, n_checks: col.checks.length, fresh_verdicts: freshVerdicts, scores };
  }

  // สมการ 3.4 (R) · 3.5 (C) · 3.6 (U)
  function computeScores(decisions, perModel) {
    const D = decisions.filter((d) => d.final_status !== 'abstained');
    const wA = decisions.reduce((s, d) => s + d.weight, 0);
    const wD = D.reduce((s, d) => s + d.weight, 0);
    const num = D.reduce((s, d) => s + d.weight * STATUS_SCORE[d.final_status], 0);
    const R = D.length === 0 || wD === 0 ? null : (num / wD) * 100;
    const C = wA === 0 ? null : wD / wA;
    let claims = 0, rejected = 0, unverified = 0, repaired = 0; const Uper = {};
    for (const k of Object.keys(perModel || {})) {
      const p = perModel[k];
      if (!p.r0_usable) continue;
      claims += p.n_claims; rejected += p.n_rejected; unverified += p.n_unverified || 0; repaired += p.n_repaired || 0;
      Uper[k] = { n_claims: p.n_claims, n_rejected: p.n_rejected, U: p.n_claims ? round(p.n_rejected / p.n_claims, 4) : null, n_missing_direct: p.n_missing_direct, n_downgraded: p.n_downgraded, n_unverified: p.n_unverified || 0, n_repaired: p.n_repaired || 0 };
    }
    const n = (s) => decisions.filter((d) => d.final_status === s).length;
    return {
      readiness_pct: R === null ? 'N/A' : round(R, 2), weighted_coverage: C === null ? 'N/A' : round(C, 4),
      n_decided: D.length, n_evidenced: n('evidenced'), n_partially: n('partially'), n_missing: n('missing'), n_abstained: n('abstained'),
      unsupported_claims: rejected, n_claims: claims, U: claims ? round(rejected / claims, 4) : null, U_per_model: Uper,
      n_unverified_votes: unverified, n_repaired_quotes: repaired,
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
  // ปีประสบการณ์โดยประมาณจากช่วงปีในเรซูเม (DEC-56 · ใช้เลือกระดับรายการเรียนรู้เท่านั้น ไม่ใช้คำนวณ R)
  function estimateYearsExperience(text, refYear) {
    const now = Number(refYear) || new Date().getFullYear();
    const spans = [];
    const re = /((?:19|20)\d{2})\s*(?:-|to|ถึง)\s*((?:19|20)\d{2}|present|current|now|ปัจจุบัน)/gi;
    let m;
    while ((m = re.exec(String(text || '')))) { const a = +m[1]; const b = /\d/.test(m[2]) ? +m[2] : now; if (b >= a && b - a < 45 && b <= now) spans.push([a, b]); }
    if (!spans.length) return null;
    spans.sort((x, y) => x[0] - y[0]);
    let total = 0; let [s0, e0] = spans[0];
    for (const [a, b] of spans.slice(1)) { if (a <= e0) e0 = Math.max(e0, b); else { total += e0 - s0; s0 = a; e0 = b; } }
    return total + (e0 - s0);
  }
  function buildPlan(input) {
    const { decisions, corpus, mappings, mode, months, hoursPerWeek, projectCfg, roleId } = input;
    const learner = input.learner || {};
    const experienced = projectCfg.plan_level_filter === true && typeof learner.years_experience === 'number' && learner.years_experience >= projectCfg.plan_experienced_years;
    const statusOf = Object.fromEntries(decisions.map((d) => [d.requirement_id, d.final_status]));
    const levelFiltered = new Set();
    const approved = new Set(projectCfg.approved_mapping_statuses);
    const Hmax = capacityHours(months, hoursPerWeek, projectCfg);
    const w = Object.fromEntries(decisions.map((d) => [d.requirement_id, d.weight]));
    const gaps = decisions.filter((d) => d.final_status === 'missing' || d.final_status === 'partially').map((d) => d.requirement_id);
    const gapSet = new Set(gaps);
    const items = Object.fromEntries(corpus.map((c) => [c.item_id, c]));
    const approvedRows = mappings.filter((m) => approved.has(m.mapping_status) && m.coverage_layer === L1_LAYER);
    const result = { Hmax, n_gaps: gaps.length, items: [], total_hours: 0, notice: '', reference_data_error: false,
      learner: { years_experience: typeof learner.years_experience === 'number' ? learner.years_experience : null, level_filter_applied: experienced } };
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
      // DEC-56: ผู้มีประสบการณ์ไม่ใช้รายการระดับ Beginner ปิดข้อที่มีหลักฐานบางส่วนแล้ว
      if (experienced && statusOf[m.requirement_id] === 'partially' && String(it.level || '').toLowerCase() === 'beginner') { levelFiltered.add(m.requirement_id); continue; }
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
    result.uncovered_level_filtered = gaps.filter((g) => levelFiltered.has(g) && !covered.has(g)).sort();
    result.uncovered_over_capacity = gaps.filter((g) => candByReq[g] && !covered.has(g) && !levelFiltered.has(g)).sort();
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
      schema: 'report-v2.1', engine_version: ENGINE_VERSION, run_id: ctx.run_id, role_id: ctx.role_id, role_name_th: refs.role_name_th || '',
      mode: ctx.mode, timeline_months: ctx.timeline_months, hours_per_week: ctx.hours_per_week,
      ocr_engine: ocr.engine, ocr_engine_version: ocr.engine_version || '', m: evalResult.m,
      scores: evalResult.scores, decisions: evalResult.decisions, plan,
      role_tasks: evalResult.task_decisions || [], technology: evalResult.tech || null, verification: evalResult.verification || {},
      model_calls: (modelCalls || []).map((c) => ({ model_key: c.model_key, call_purpose: c.call_purpose || 'analyst', provider: c.provider, model_id: c.model_id, attempt: c.attempt, status: c.status, error_code: c.error_code, latency_ms: c.latency_ms, input_tokens: c.input_tokens, output_tokens: c.output_tokens })),
      versions: { dataset: refs.dataset_version || '', corpus: refs.corpus_version || '', prompt: refs.prompt_version || '', rules: refs.rules_version || '' },
      stamp: refs.stamp || null, tokens: tokenSummary(modelCalls, refs.pricing || null), model_ids: modelIdsSummary(modelCalls),
      hashes,
    };
    payload.report_hash = sha256Hex(canonicalJSON(payload));
    return payload;
  }
  const STATUS_TH = { evidenced: 'พบหลักฐานตามเกณฑ์', partially: 'พบหลักฐานบางส่วน', missing: 'ไม่พบหลักฐานที่ผ่านเกณฑ์', abstained: 'ระบบยังสรุปไม่ได้' };
  const SOURCE_TH = { models: 'ข้อความที่โมเดลยกและผ่านการตรวจ', credential: 'ใบรับรองที่พบในเรซูเม (R5)', linkage: 'เชื่อมจากกิจกรรมการทำงานที่มีหลักฐาน (R6)' };
  function renderReportHTML(p, cfg) {
    const e = escapeHtml; const s = p.scores;
    const fmt = (x, d) => (x === 'N/A' || x === null || x === undefined ? 'N/A' : Number(x).toFixed(d));
    const reqName = Object.fromEntries(p.decisions.map((d) => [d.requirement_id, d.element_name]));
    let h = '<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>รายงานผลวิเคราะห์ ' + e(p.run_id) + '</title>'
      + '<style>body{font-family:"Sarabun","TH Sarabun New",Tahoma,sans-serif;font-size:14pt;line-height:1.5}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:4px;vertical-align:top}th{background:#eee}.q{font-family:monospace;font-size:11pt}</style></head><body>';
    h += '<h1>รายงานผลวิเคราะห์ช่องว่างทักษะจากเรซูเมและแผนการเรียนรู้</h1>';
    h += '<p>รหัสงาน: <b>' + e(p.run_id) + '</b> · อาชีพเป้าหมาย: ' + e(p.role_id) + ' ' + e(p.role_name_th) + ' · กรอบเวลา ' + e(p.timeline_months) + ' เดือน · ' + e(p.hours_per_week) + ' ชั่วโมงต่อสัปดาห์ · ประเภทคำแนะนำ ' + e(p.mode) + '</p>';
    // ส่วนที่ 1
    h += '<h2>ส่วนที่ 1 สรุปตัวเลข</h2><table><tr><th>คะแนนหลักฐานตามข้อกำหนดอ้างอิง (R)</th><th>สัดส่วนน้ำหนักของข้อที่สรุปได้ (C)</th><th>ข้อสรุปที่ไม่ผ่านเกณฑ์ตรวจหลักฐาน (U)</th><th>จำนวนโมเดลที่ใช้ได้</th></tr>';
    h += '<tr><td>' + e(fmt(s.readiness_pct, 2)) + '</td><td>' + e(fmt(s.weighted_coverage, 3)) + ' (สรุปได้ ' + e(s.n_decided) + ' จาก ' + e(p.decisions.length) + ' ข้อ)</td><td>' + e(s.unsupported_claims) + ' จาก ' + e(s.n_claims) + '</td><td>' + e(p.m) + ' จาก 3</td></tr></table>';
    h += '<p>คะแนน R สะท้อนหลักฐานที่ปรากฏในเรซูเมภายใต้เกณฑ์ของการศึกษา ไม่ใช่ผลทดสอบทักษะหรือความน่าจะเป็นที่พร้อมทำงาน และต้องอ่านคู่กับค่า C เสมอ</p>';
    if (s.role_task_index !== undefined) {
      h += '<table><tr><th>ดัชนีงานหลักของอาชีพ (T)</th><th>เทคโนโลยีที่ตลาดต้องการที่พบในเรซูเม (H)</th></tr><tr><td>' + e(fmt(s.role_task_index, 2)) + ' (สรุปได้ ' + e(s.n_role_tasks_decided) + ' จาก ' + e(s.n_role_tasks) + ' งาน)</td><td>' + e(s.n_tech_found) + ' จาก ' + e(s.n_tech_total) + ' รายการ</td></tr></table>';
      h += '<p>T และ H อ่านแยกจาก R และไม่รวมเป็นคะแนนเดียว T วัดหลักฐานของงานหลักเฉพาะอาชีพนี้ H นับชื่อเทคโนโลยีที่ปรากฏตรงตัวในเรซูเม</p>';
    }
    if (s.role_fit !== undefined && s.role_fit !== 'N/A') {
      const BAND_TH = { high: 'สูง', mid: 'ปานกลาง', low: 'ต่ำ' };
      h += '<table><tr><th>ความตรงกับอาชีพ (Role-Fit)</th><th>ระดับ</th><th>คะแนนหลักฐานเฉพาะอาชีพ (R_role)</th></tr><tr><td>' + e(fmt(s.role_fit, 2)) + '</td><td>' + e(BAND_TH[s.role_fit_band] || s.role_fit_band) + '</td><td>' + e(fmt(s.readiness_role_pct, 2)) + '</td></tr></table>';
      h += '<p>Role-Fit ให้น้ำหนักข้อกำหนดที่เฉพาะกับอาชีพนี้มากกว่าทักษะที่แทบทุกอาชีพไอทีต้องใช้ และรวมกับ T เป็นภาพรวมอ่านง่ายขึ้น ใช้ประกอบการอ่านเท่านั้น ไม่ใช่ตัวชี้วัดของการศึกษาและไม่ใช่คะแนนความสามารถ</p>';
    }
    // ส่วนที่ 2
    h += '<h2>ส่วนที่ 2 ผลรายข้อกำหนด</h2>';
    for (const st of FINAL_STATUSES) {
      const rows = p.decisions.filter((d) => d.final_status === st);
      h += '<h3>' + e(STATUS_TH[st]) + ' (' + rows.length + ' ข้อ)</h3>';
      if (!rows.length) continue;
      h += '<table><tr><th>รหัสข้อกำหนด</th><th>องค์ประกอบ</th><th>ความเห็นตรงกัน</th><th>ข้อความที่ใช้ตัดสิน [ตำแหน่งตัวอักษร]</th></tr>';
      for (const d of rows) {
        const q = d.evidence_quote ? '<span class="q">' + e(d.evidence_quote) + '</span> [' + e(d.evidence_char_start) + '–' + e(d.evidence_char_end) + ')' + (d.evidence_source && d.evidence_source !== 'models' ? '<br>ที่มา: ' + e(SOURCE_TH[d.evidence_source] || d.evidence_source) : '') : '—';
        h += '<tr><td>' + e(d.requirement_id) + '</td><td>' + e(d.element_name) + '</td><td>' + e(fmt(d.agreement_level, 2)) + '</td><td>' + q + '</td></tr>';
      }
      h += '</table>';
    }
    if ((p.role_tasks || []).length) {
      h += '<h3>งานหลักของอาชีพ (O*NET Core Tasks)</h3><table><tr><th>งาน</th><th>ผล</th><th>ข้อความที่ใช้ตัดสิน</th></tr>';
      for (const t of p.role_tasks) h += '<tr><td>' + e(t.task_text) + '</td><td>' + e(STATUS_TH[t.final_status] || t.final_status) + '</td><td>' + (t.evidence_quote ? '<span class="q">' + e(t.evidence_quote) + '</span>' : '—') + '</td></tr>';
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
    if ((pl.uncovered_level_filtered || []).length) h += '<p>ช่องว่างที่มีหลักฐานบางส่วนแล้วและคลังมีเฉพาะรายการระดับเริ่มต้น (ไม่ใส่ในแผนเพราะท่านมีประสบการณ์ ' + e(pl.learner && pl.learner.years_experience) + ' ปี): ' + pl.uncovered_level_filtered.map(e).join(', ') + '</p>';
    h += '<p>ลำดับนี้เป็นลำดับความสำคัญสำหรับวางแผน ไม่ใช่ลำดับความรู้พื้นฐานที่ต้องมีก่อนเรียน และชั่วโมงเป็นค่าประมาณสำหรับวางแผน</p>';
    // ส่วนที่ 4
    h += '<h2>ส่วนที่ 4 รายละเอียดการเรียกโมเดลเพื่อการตรวจสอบย้อนหลัง</h2><p>ข้อมูลนี้ไม่ใช้จัดอันดับว่าโมเดลใดดีกว่า · บริการอ่านข้อความ: ' + e(p.ocr_engine) + ' ' + e(p.ocr_engine_version) + '</p>';
    h += '<table><tr><th>โมเดล</th><th>หน้าที่</th><th>ผู้ให้บริการ</th><th>รหัสรุ่น</th><th>ครั้งที่</th><th>ผล</th><th>รหัสข้อผิดพลาด</th></tr>';
    for (const c of p.model_calls) h += '<tr><td>' + e(c.model_key) + '</td><td>' + e(c.call_purpose === 'verifier' ? 'ตรวจความเกี่ยวข้อง' : 'วิเคราะห์') + '</td><td>' + e(c.provider) + '</td><td>' + e(c.model_id) + '</td><td>' + e(c.attempt) + '</td><td>' + e(c.status) + '</td><td>' + e(c.error_code) + '</td></tr>';
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
      ...(s.role_fit !== undefined && s.role_fit !== 'N/A' ? ['- ความตรงกับอาชีพ (Role-Fit): ' + fmt(s.role_fit, 2)] : []),
      ...(s.role_task_index !== undefined ? ['- ดัชนีงานหลักของอาชีพ (T): ' + fmt(s.role_task_index, 2) + ' · เทคโนโลยีที่ตลาดต้องการที่พบ (H): ' + s.n_tech_found + ' จาก ' + s.n_tech_total + ' รายการ'] : []),
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
      unsupported_claims: x.unsupported_claims === undefined ? '' : x.unsupported_claims,
      role_task_index: x.role_task_index === undefined ? '' : x.role_task_index, tech_match_pct: x.tech_match_pct === undefined ? '' : x.tech_match_pct, report_hash: x.report_hash || '',
      pdf_file_id: x.pdf_file_id || '', email_status: x.email_status || '', error_code: x.error_code || '',
      wf_version: x.stamp ? x.stamp.wf_version : '', build_id: x.stamp ? x.stamp.build_id : '', engine_version: x.stamp ? x.stamp.engine_version : '',
      prompt_ids: x.stamp ? (x.stamp.analyst_prompt + '+' + x.stamp.verifier_prompt) : '', rules_version: x.stamp ? x.stamp.rules_version : '', data_sha: x.stamp ? x.stamp.data_sha : '',
      model_ids: x.model_ids || '', tokens_input: x.tokens ? x.tokens.total.input : '', tokens_output: x.tokens ? x.tokens.total.output : '',
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
    const ev = evaluateRun({ runId: ctx.run_id, roleId: ctx.role_id, requirements, text, modelResults, verifierResults: input.verifierResults,
      roleTasks: input.roleTasks, roleTech: input.roleTech, skillLinks: input.skillLinks, specificity: input.specificity, cachedVerdicts: input.cachedVerdicts, corpus, mappings, projectCfg, nowIso });
    const learner = { years_experience: estimateYearsExperience(text, String(nowIso || '').slice(0, 4)) };
    const plan = buildPlan({ decisions: ev.decisions, corpus, mappings, mode: ctx.mode, months: ctx.timeline_months, hoursPerWeek: ctx.hours_per_week, projectCfg, roleId: ctx.role_id, learner });
    return { eval: ev, plan, planRows: planRowsFrom(ctx, plan) };
  }
  // แถว role_task_decisions (DEC-55)
  function taskRowsFrom(ev) {
    return (ev.task_decisions || []).map((t) => ({ run_id: t.run_id, task_id: t.task_id, task_text: t.task_text, actor: t.actor || '', final_status: t.final_status, agreement_level: t.agreement_level, n_usable_models: t.n_usable_models, rule_flags: t.rule_flags, evidence_quote: t.evidence_quote, created_at: t.created_at }));
  }
  // แถว plan_items ของแผนหนึ่งแผน (ใช้ร่วมกันระหว่าง decideAndPlan และโหนด Build Learning Plan ของ WF_IS68076026)
  function planRowsFrom(ctx, plan) {
    return plan.items.map((i) => ({ run_id: ctx.run_id, rank: i.rank, item_id: i.item_id, item_type: i.item_type, title: i.title, provider: i.provider, source_url: i.source_url, estimated_hours: i.estimated_hours, cumulative_hours: i.cumulative_hours, covers_requirements: i.covers_requirements, n_new_requirements: i.n_new_requirements, new_weight_covered: i.new_weight_covered, mapping_status: i.mapping_status, phase: i.phase }));
  }

  return {
    ENGINE_VERSION, STATUSES, FINAL_STATUSES, PLAN_STRATEGIES, R0_CODES, L1_LAYER, SCHEMA_VERSION, SCHEMA_VERSIONS, VERIFIER_SCHEMA, VERIFIER_SCHEMAS, VERDICTS, MODEL_KEYS, ACTORS, ACTOR_RANK,
    sha256Hex, canonicalJSON, escapeHtml, safeHttpsUrl,
    parseFormRow, responseId, makeRunId, validateIntake, checkFile, isDuplicate,
    normalizeText, maskPII, prepareText,
    buildPrompt, buildProviderRequest, parseProviderResponse, callModelWithRetry, isRetryable,
    ruleR0, ruleR2, tokenize, stem, stemTokens, wordSpans, repairQuote, targetTokens, aliasHit, overlapScore, chooseVerifier,
    collectClaims, prepareVerification, buildVerifierPrompt, parseVerifierOutput, credentialEvidence, techMatch, evaluateRun, computeScores,
    estimateYearsExperience, capacityHours, buildPlan, decideAndPlan, planRowsFrom, taskRowsFrom, mergeMappingReview,
    freezeReport, renderReportHTML, buildEmail, nextStage, runRowFrom, modelStatusSummary,
    needsPerformed, requirementMinActor, taskMinActor, majorityActor, buildSpecificity, applyR7, computeRoleFit, buildStamp, versionIssues, tokenSummary, modelIdsSummary,
    verifierCacheKey, mergeVerifierCache, newCacheEntries, cacheCfg,
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = ENGINE;
