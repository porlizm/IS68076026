// WF_Main_Intake · Prepare Text & Mask PII (runOnceForEachItem) — 3.5.1 · บันทึกชื่อบริการที่ใช้จริงทุกครั้ง (A4)
const base = $('Check File').item.json;
const ctx = base.ctx;
const j = $input.item.json;
let rawText, engine, engineVersion;
if (j.document && typeof j.document.text === 'string') {
  rawText = j.document.text; engine = 'google_document_ai';
  engineVersion = 'processor:' + ($env.DOCAI_PROCESSOR_ID || '') + (j.document.revisions && j.document.revisions[0] ? ' rev:' + (j.document.revisions[0].id || '') : '');
} else if (typeof j.text === 'string') {
  rawText = j.text; engine = j.engine || 'local_ocr'; engineVersion = j.engine_version || '';
} else {
  throw new Error(`[run_id=${ctx.run_id}] ocr_failed: บริการอ่านข้อความทั้งหลักและสำรองไม่คืนข้อความ`);
}
const prep = ENGINE.prepareText(rawText);
const now = new Date().toISOString();
const boundary = 'is68mask' + prep.text_sha256.slice(0, 12);
const meta = { name: ctx.run_id + '_masked.txt', mimeType: 'text/plain', parents: [$env.DRIVE_MASKED_TEXT_FOLDER_ID] };
const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${prep.text}\r\n--${boundary}--`;
const fullCtx = { ...ctx, ocr_engine: engine, ocr_engine_version: engineVersion };
return { json: {
  ctx: fullCtx,
  ocr_row: { run_id: ctx.run_id, engine, engine_version: engineVersion, page_count: ctx.page_count, char_count: prep.char_count, pii_masked_count: prep.pii_masked_count, text_sha256: prep.text_sha256, created_at: now },
  masked_upload: { content_type: `multipart/related; boundary=${boundary}`, body },
  gap_input: { ctx: fullCtx, text: prep.text, text_sha256: prep.text_sha256 },
} };
