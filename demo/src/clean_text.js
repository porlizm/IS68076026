// ─────────────────────────────────────────────────────────────────────────────
// Clean Text & Mask PII · เตรียมข้อความ 5 กฎ + ปิดบัง PII 4 รูปแบบ (หัวข้อ 3.5.1)
// ฟังก์ชันด้านล่างคัดลอกจาก engine/engine.js ทุกไบต์ (build_wf_demo.mjs ตรวจให้)
// ─────────────────────────────────────────────────────────────────────────────
//@@ENGINE:normalizeText,PII_PATTERNS,maskPII@@

const tl = $('Text Layer Check').first().json;
const inp = $input.first().json || {};
let raw = tl.raw_text || '';
let method = 'text_layer';
let ocrError = '';
let ocrTokens = null;

if (tl.need_ocr) {
  method = 'gemini_ocr';
  if (inp.error) {
    ocrError = String((inp.error && (inp.error.message || inp.error.description)) || inp.error).slice(0, 200);
  } else {
    const c = (inp.candidates || [])[0] || {};
    raw = ((c.content || {}).parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
    raw = raw.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '');
    ocrTokens = inp.usageMetadata || null;
    if (!raw.trim()) ocrError = 'OCR ไม่คืนข้อความ (finishReason: ' + (c.finishReason || 'unknown') + ')';
  }
}

const norm = normalizeText(raw);
const m = maskPII(norm);
// DEC-58 Open Learner Model: หลักฐานที่ผู้เรียนพิมพ์เพิ่ม ต่อท้ายข้อความเรซูเม (ปิดบัง PII เหมือนกัน) · ตำแหน่งเริ่มใช้แยกที่มาในรายงาน
const sup = String($('Config & Validate').first().json.supplement || '').trim();
let supplementOffset = -1;
if (sup) {
  const sm = maskPII(normalizeText(sup));
  const head = m.text + '\n\nADDITIONAL EVIDENCE PROVIDED BY THE LEARNER (self-reported)\n';
  supplementOffset = head.length;
  m.text = head + sm.text;
  for (const k of Object.keys(m.counts)) m.counts[k] += sm.counts[k];
  m.total += sm.total;
}
const meaningful = (m.text.match(/[A-Za-z0-9฀-๿]/g) || []).length;
const errors = [];
if (ocrError) errors.push('อ่านเอกสารไม่สำเร็จ: ' + ocrError + ' — ตรวจ Gemini API Key หรือใช้ PDF ที่มีข้อความ');
else if (meaningful < 80) errors.push('อ่านข้อความจากเรซูเมได้น้อยเกินไป (' + meaningful + ' ตัวอักษร)');

return [{
  json: {
    ok: errors.length === 0,
    http_status: errors.length ? 422 : 200,
    stage: 'ocr',
    errors,
    text: m.text,
    char_count: m.text.length,
    supplement_offset: supplementOffset,
    pii_masked_count: m.total,
    pii_counts: m.counts,
    ocr: { method, reason: tl.ocr_reason || '', pages: tl.pages, text_layer_chars: tl.text_layer_chars, usage: ocrTokens },
  },
}];
