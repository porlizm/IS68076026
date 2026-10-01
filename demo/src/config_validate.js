// ─────────────────────────────────────────────────────────────────────────────
// Config & Validate · ค่าตั้งของ Demo + ตรวจข้อมูลจากฟอร์ม (UC-01 · ตาราง 3.10)
// แก้ค่าได้ที่ CONFIG ด้านล่างเท่านั้น
// ─────────────────────────────────────────────────────────────────────────────
const CONFIG = {
  GEMINI_MODEL_ANALYST: 'gemini-3.8-flash',   // โมเดลวิเคราะห์หลักฐาน (เปลี่ยนได้ เช่น gemini-3.5-flash)
  GEMINI_MODEL_OCR: 'gemini-3.8-flash',       // โมเดลอ่านเอกสารสแกน/รูปภาพ
  GEMINI_THINKING_LEVEL: 'low',               // minimal | low | medium | high | '' (ไม่ส่งค่า)
  GEMINI_MAX_OUTPUT_TOKENS: 16384,
  USE_GEMINI_ANALYST: true,                   // false = ใช้กฎสำรอง (ไม่เรียก LLM) — ใช้ตอนอินเทอร์เน็ตมีปัญหา
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
const bin = item.binary || {};
const fileKey = bin.resume ? 'resume' : Object.keys(bin)[0];
const file = fileKey ? bin[fileKey] : null;
const errors = [];

const roleId = String(body.role_id || '').trim();
const months = Number(body.months);
const hours = Number(body.hours_per_week);
const mode = String(body.mode || 'both').trim();
const consent = ['true', 'on', '1', 'yes'].includes(String(body.consent || '').toLowerCase());

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
    input: { role_id: roleId, months, hours_per_week: hours, mode, consent },
    file: { name, mime, size, is_pdf: isPdf, is_image: isImage, binary_key: fileKey || '' },
    file_b64: b64,
  },
};
if (file && fileKey) out.binary = { resume: file };
return [out];
