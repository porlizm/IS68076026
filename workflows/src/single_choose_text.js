// WF_IS68076026 · Choose Text Source (runOnceForEachItem) — ใช้ชั้นข้อความของ PDF ถ้ามีข้อความพอ ไม่เช่นนั้นส่งไป OCR (DEC-42)
// ขาเข้าคือผลของ Extract Text Layer (onError = continueRegularOutput: PDF ที่อ่านชั้นข้อความไม่ได้จะมาเป็น { error })
const base = $('Check PDF File').item.json;
const j = $input.item.json || {};
const text = typeof j.text === 'string' ? j.text : '';
const nonSpace = text.replace(/\s+/g, '').length;
const use = !j.error && nonSpace >= CFG.project.text_layer_min_chars;
return { json: { ctx: base.ctx, pdf_b64: base.pdf_b64, use_text_layer: use,
  text: use ? text : undefined, engine: use ? 'pdf_text_layer' : undefined, engine_version: use ? 'n8n extractFromFile (pdf)' : undefined,
  text_layer_chars: nonSpace } };
