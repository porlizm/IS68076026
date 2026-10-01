// ─────────────────────────────────────────────────────────────────────────────
// Build Analyst Prompt · prompt analyst_v1.0 ของงานวิจัย (ไม่แก้ข้อความ)
//   + DEMO ADDENDUM ขอ "profile" สำหรับแสดงผลเท่านั้น (ไม่ใช้คำนวณคะแนน)
//   ไม่ส่งคำพ้องและน้ำหนักเข้า prompt (3.5.2)
// ─────────────────────────────────────────────────────────────────────────────
const TEMPLATE = /*@@PROMPT_ANALYST@@*/'';
const ADDENDUM = [
  '',
  'DEMO ADDENDUM (display only, never used for scoring):',
  'Add one more top-level field "profile" to the same JSON object:',
  '{"current_role": "<most recent job title exactly as written, or empty>",',
  ' "years_experience": <total years of work experience as a number, or null if unclear>,',
  ' "certifications": ["<each certification or certificate name copied exactly as written in the resume>"],',
  ' "headline_th": "<one Thai sentence (max 160 characters) describing who this candidate is>",',
  ' "summary_th": "<3-4 Thai sentences: main strengths and the most important gaps for the target occupation, based only on the resume>"}',
  'Do not put personal names, emails, phone numbers or URLs in profile. All other rules above still apply.',
].join('\n');

const role = $('Load Role Data (O*NET 31.0)').first().json.role;
const text = $('Clean Text & Mask PII').first().json.text;
const cfg = $('Config & Validate').first().json.cfg;

const reqList = role.requirements.map((r) => ({ requirement_id: r.id, element_name: r.name, element_description: r.desc }));
const prompt = String(TEMPLATE)
  .split('{{ROLE_ID}}').join(role.role_id)
  .split('{{REQUIREMENTS_JSON}}').join(JSON.stringify(reqList, null, 1))
  .split('{{RESUME_TEXT}}').join(text) + '\n' + ADDENDUM;

const generationConfig = { maxOutputTokens: cfg.GEMINI_MAX_OUTPUT_TOKENS, responseMimeType: 'application/json' };
if (cfg.GEMINI_THINKING_LEVEL) generationConfig.thinkingConfig = { thinkingLevel: cfg.GEMINI_THINKING_LEVEL };

return [{
  json: {
    use_gemini: cfg.USE_GEMINI_ANALYST !== false,
    model: cfg.GEMINI_MODEL_ANALYST,
    prompt_version: 'analyst_v1.0+demo_profile',
    prompt_chars: prompt.length,
    gemini_request: { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig },
  },
}];
