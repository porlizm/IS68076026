// ─────────────────────────────────────────────────────────────────────────────
// Build Analyst Prompt · prompt ของงานวิจัย (config/project.json prompt_version · ไม่แก้ข้อความ) + งานหลัก 8 งานของอาชีพ (DEC-55)
//   + DEMO ADDENDUM ขอ "profile" สำหรับแสดงผลเท่านั้น (ไม่ใช้คำนวณคะแนน)
//   ไม่ส่งคำพ้องและน้ำหนักเข้า prompt (3.5.2) · DEC-58: ส่ง ANALYST_RUNS รายการ (Gemini วิเคราะห์หลายรอบแล้วโหวต)
// ─────────────────────────────────────────────────────────────────────────────
//@@ENGINE_ALL@@
const TEMPLATE = /*@@PROMPT_ANALYST@@*/'';
const PROMPT_VERSION = /*@@PROMPT_VERSION@@*/'';
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
const v = $('Config & Validate').first().json;
const cfg = v.cfg;

const reqList = role.requirements.map((r) => ({ requirement_id: r.id, element_name: r.name, element_description: r.desc }));
const prompt = ENGINE.buildPrompt(TEMPLATE, role.role_id, reqList, text, role.signal_tasks || []) + '\n' + ADDENDUM;

const generationConfig = { maxOutputTokens: cfg.GEMINI_MAX_OUTPUT_TOKENS, responseMimeType: 'application/json' };
if (cfg.GEMINI_THINKING_LEVEL) generationConfig.thinkingConfig = { thinkingLevel: cfg.GEMINI_THINKING_LEVEL };
const KEYS = ['A', 'B', 'C'];
return KEYS.slice(0, v.runs).map((k) => ({
  json: {
    run_key: k,
    use_gemini: cfg.USE_GEMINI_ANALYST !== false,
    model: cfg.GEMINI_MODEL_ANALYST,
    prompt_version: PROMPT_VERSION + '+demo_profile',
    prompt_chars: prompt.length,
    gemini_request: { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig },
  },
}));
