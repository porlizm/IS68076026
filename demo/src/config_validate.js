// ─────────────────────────────────────────────────────────────────────────────
// Config & Validate · ค่าตั้งของ Demo + ตรวจข้อมูลจากฟอร์ม (UC-01 · ตาราง 3.10)
// แก้ค่าได้ที่ CONFIG ด้านล่างเท่านั้น · ค่ากฎตรวจหลักฐานมาจาก config/project.json (PROJECT · ฝังตอน build)
// ─────────────────────────────────────────────────────────────────────────────
const PROJECT = /*@@PROJECT_CFG@@*/{};
const STAMP = /*@@STAMP@@*/{};   // ตราประทับรุ่นของ workflow (ฝังตอน build · DEC-59) — ทุกโหนดหลักฝังชุดเดียวกัน แล้วตรวจกันตอน run
const CONFIG = {
  GEMINI_MODEL_ANALYST: 'gemini-3.8-flash',   // โมเดลวิเคราะห์หลักฐาน (เปลี่ยนได้ เช่น gemini-3.5-flash)
  GEMINI_MODEL_OCR: 'gemini-3.8-flash',       // โมเดลอ่านเอกสารสแกน/รูปภาพ
  GEMINI_THINKING_LEVEL: 'medium',            // low | medium | high | '' (ไม่ส่งค่า) · DEC-53 ใช้ medium ให้พิจารณาทักษะพื้นฐานจากกิจกรรม
  GEMINI_MAX_OUTPUT_TOKENS: 16384,
  ANALYST_RUNS: 3,                            // DEC-58 · เรียก Gemini วิเคราะห์ 3 รอบแล้วโหวต (แทน R1 ของ 3 โมเดล) · 1 = เร็ว/ประหยัดโควตา
  USE_GEMINI_ANALYST: true,                   // false = ใช้กฎสำรอง (ไม่เรียก LLM) — ใช้ตอนอินเทอร์เน็ตมีปัญหา
  USE_GEMINI_VERIFIER: true,                  // DEC-51 · R3b ให้ Gemini อีกรอบตรวจความหมายของข้อความที่คำไม่ตรง (false = ข้อเหล่านั้นเป็น "ยังยืนยันไม่ได้")
  GEMINI_MODEL_VERIFIER: 'gemini-3.8-flash',
  GEMINI_VERIFIER_THINKING_LEVEL: 'low',
  VERIFIER_CACHE: true,                       // DEC-59 · D4 จำคำตัดสิน R3b ของคู่ (ข้อกำหนด, ข้อความ) ไว้ใช้ซ้ำ ผลจึงคงที่ข้ามการรัน (ใช้ได้เมื่อ Publish แล้ว)
  VERIFIER_BATCH: 30,                         // D4 · จำนวนคู่ต่อการเรียกผู้ตรวจ 1 ครั้ง
  QUOTE_REUSE_CAP: 2,                         // D5 · ข้อความเดียวเป็นหลักฐานเต็ม (มีหลักฐาน) ได้ไม่เกินกี่ข้อ ส่วนเกินลดเป็น "บางส่วน"
  FIT_WEIGHT_T: 0.5,                          // D1 · Role-Fit = (1 − w) · R_role + w · T
  FIT_HIGH_MIN: 75, FIT_HIGH_T_MIN: 60, FIT_MID_MIN: 50,   // ป้ายแสดงผล (ไม่ใช่เกณฑ์ของงานวิจัย)
  H_MIN_TECH: 10,                             // D6 · อาชีพที่มีเทคโนโลยีที่ตลาดต้องการน้อยกว่านี้ → H แสดง "ข้อมูลไม่พอ"
  PRICE_PER_1M_INPUT_USD: null,               // D7 · ราคาโทเค็น (USD ต่อ 1 ล้าน) ใส่จากหน้าราคาของ Google · null = ไม่คำนวณค่าใช้จ่าย
  PRICE_PER_1M_OUTPUT_USD: null,              //      (ราคา output รวมโทเค็นการคิด thinking)
  SUPPLEMENT_MAX_CHARS: 4000,                 // DEC-58 · หลักฐานเพิ่มเติมที่ผู้เรียนพิมพ์เอง (Open Learner Model)
  OCR_MIN_CHARS: 300,                         // ข้อความจาก text layer น้อยกว่านี้ → ส่ง OCR
  MAX_FILE_BYTES: 10485760,                   // 10 MB (ตาราง 3.10)
  MAX_PAGES: 5,
  ALLOWED_MONTHS: [6, 12, 18, 24],
  MAX_HOURS_PER_WEEK: 60,
  WEEKS_PER_MONTH: 4.33,                      // สมการ 3.7
  THETA: 0.15,                                // R3
  OVERLAP_CAP: 25,                            // สมการ 3.2
  ALIAS_MIN_LEN: 4,
  ROLES: ['R07', 'R15', 'R19', 'R20'],
  MODES: ['both', 'course_only', 'certification_only'],
};

const item = $input.first();
const body = (item.json && item.json.body) || {};
const clientBuild = String(body.client_build || '').trim();
const bin = item.binary || {};
const fileKey = bin.resume ? 'resume' : Object.keys(bin)[0];
const file = fileKey ? bin[fileKey] : null;
const errors = [];

const roleId = String(body.role_id || '').trim();
const months = Number(body.months);
const hours = Number(body.hours_per_week);
const mode = String(body.mode || 'both').trim();
const consent = ['true', 'on', '1', 'yes'].includes(String(body.consent || '').toLowerCase());
const supplement = String(body.supplement || '').replace(/\r\n?/g, '\n').trim().slice(0, CONFIG.SUPPLEMENT_MAX_CHARS);

if (!CONFIG.ROLES.includes(roleId)) errors.push('กรุณาเลือกอาชีพเป้าหมาย 1 ใน 4 อาชีพ');
if (!CONFIG.ALLOWED_MONTHS.includes(months)) errors.push('ระยะเวลาเรียนต้องเป็น 6, 12, 18 หรือ 24 เดือน');
if (!(hours >= 1 && hours <= CONFIG.MAX_HOURS_PER_WEEK)) errors.push('ชั่วโมงเรียนต่อสัปดาห์ต้องอยู่ระหว่าง 1–' + CONFIG.MAX_HOURS_PER_WEEK);
if (!CONFIG.MODES.includes(mode)) errors.push('รูปแบบแผนไม่ถูกต้อง');
if (!consent) errors.push('ต้องยินยอมให้ประมวลผลเรซูเมก่อน');

let mime = '', size = 0, name = '', isPdf = false, isImage = false, b64 = '';
if (!file) {
  errors.push('ไม่พบไฟล์เรซูเม');
} else {
  mime = String(file.mimeType || '').toLowerCase();
  name = String(file.fileName || 'resume');
  if (!mime || mime === 'application/octet-stream') {
    if (/\.pdf$/i.test(name)) mime = 'application/pdf';
    else if (/\.png$/i.test(name)) mime = 'image/png';
    else if (/\.jpe?g$/i.test(name)) mime = 'image/jpeg';
  }
  isPdf = mime === 'application/pdf';
  isImage = ['image/png', 'image/jpeg', 'image/webp'].includes(mime);
  if (!isPdf && !isImage) errors.push('รองรับเฉพาะ PDF, PNG, JPG');
  const buf = await this.helpers.getBinaryDataBuffer(0, fileKey);
  size = buf.length;
  if (size === 0) errors.push('ไฟล์ว่างเปล่า');
  if (size > CONFIG.MAX_FILE_BYTES) errors.push('ไฟล์ใหญ่เกิน 10 MB');
  if (isPdf && buf.slice(0, 5).toString('latin1') !== '%PDF-') errors.push('ไฟล์ PDF เสียหายหรือไม่ใช่ PDF จริง');
  if (!errors.length) b64 = buf.toString('base64');
}

const runs = Math.max(1, Math.min(3, Number(CONFIG.ANALYST_RUNS) || 1));
// ค่ากฎของงานวิจัย (config/project.json) + ค่าที่ Demo ปรับ: θ/เพดาน/คำพ้องจาก CONFIG · ตรวจตัวเองได้ (โมเดลเดียว) · จำนวนเสียงตามจำนวนรอบ
const projectCfg = Object.assign({}, PROJECT, {
  theta: CONFIG.THETA, overlap_denominator_cap: CONFIG.OVERLAP_CAP, alias_min_length: CONFIG.ALIAS_MIN_LEN,
  allow_self_verification: true, min_usable_models: runs >= 2 ? 2 : 1, min_agreeing_votes: runs >= 2 ? 2 : 1,
});
const now = new Date();
const runId = 'DEMO-' + now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

const out = {
  json: {
    ok: errors.length === 0,
    http_status: errors.length ? 400 : 200,
    stage: 'validate',
    errors,
    run_id: runId,
    received_at: now.toISOString(),
    cfg: CONFIG,
    version: Object.assign({}, STAMP, { client_build: clientBuild, client_match: clientBuild ? clientBuild === STAMP.build_id : null }),
    project_cfg: projectCfg,
    runs,
    supplement,
    input: { role_id: roleId, months, hours_per_week: hours, mode, consent, supplement_chars: supplement.length },
    file: { name, mime, size, is_pdf: isPdf, is_image: isImage, binary_key: fileKey || '' },
    file_b64: b64,
  },
};
if (file && fileKey) out.binary = { resume: file };
return [out];
