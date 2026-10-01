// ─────────────────────────────────────────────────────────────────────────────
// Text Layer Check · ตัดสินว่าต้องส่ง OCR หรือไม่
//   PDF ที่มี text layer พอ → ใช้ข้อความตรง (แม่นยำ 100% · ไม่เสีย token)
//   PDF สแกน / รูปภาพ / ข้อความน้อยกว่า OCR_MIN_CHARS → Gemini OCR
// ─────────────────────────────────────────────────────────────────────────────
const v = $('Config & Validate').first().json;
const cfg = v.cfg;
const inp = $input.first().json || {};

let raw = '';
let pages = null;
let reason = '';
if (v.file.is_pdf) {
  if (inp.error) reason = 'อ่าน text layer ไม่ได้ (' + String(inp.error.message || inp.error).slice(0, 80) + ')';
  raw = String(inp.text || '');
  pages = inp.numpages || (inp.info && inp.info.numpages) || null;
} else {
  reason = 'ไฟล์รูปภาพ ต้องใช้ OCR';
}
// นับเฉพาะตัวอักษรที่มีความหมาย (ตัด whitespace/สัญลักษณ์ซ้ำ)
const meaningful = (raw.match(/[A-Za-z0-9฀-๿]/g) || []).length;
const needOcr = meaningful < cfg.OCR_MIN_CHARS;
if (needOcr && !reason) reason = 'ข้อความใน PDF มีเพียง ' + meaningful + ' ตัวอักษร (น่าจะเป็นไฟล์สแกน)';
// หมายเหตุ: Extract PDF Text อ่านสูงสุด MAX_PAGES หน้า (ตาราง 3.10) หน้าที่เกินจะไม่ถูกวิเคราะห์

const OCR_PROMPT = [
  'You are an OCR engine. Transcribe ALL text in this resume document exactly as written.',
  'Rules: keep the original language and spelling; keep reading order (top-to-bottom, left column before right column);',
  'put each line or bullet on its own line; keep bullet text intact; do not summarise, translate, correct or add anything;',
  'do not use markdown or code fences. Output plain text only.',
].join(' ');

const gen = { maxOutputTokens: 8192 };
if (cfg.GEMINI_THINKING_LEVEL) gen.thinkingConfig = { thinkingLevel: 'minimal' };

return [{
  json: {
    ok: true,
    need_ocr: needOcr,
    ocr_reason: needOcr ? reason : '',
    raw_text: needOcr ? '' : raw,
    text_layer_chars: meaningful,
    pages,
    ocr_prompt: OCR_PROMPT,
    ocr_generation_config: gen,
  },
}];
