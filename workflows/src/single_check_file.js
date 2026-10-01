// WF_IS68076026 · Check PDF File (runOnceForEachItem) — ตรวจชนิด ขนาด จำนวนหน้า แล้วส่ง binary ต่อให้ Extract Text Layer (DEC-42)
const ctx = $('Validate Form Rows').item.json;
const bin = $input.item.binary && $input.item.binary.data;
if (!bin) throw new Error(`[run_id=${ctx.run_id}] file_download_failed: ไม่มีไฟล์จาก Drive (ตรวจการแชร์โฟลเดอร์ของแบบฟอร์มให้บัญชีบริการ)`);
const buf = await this.helpers.getBinaryDataBuffer($itemIndex, 'data');
const latin = buf.toString('latin1');
const pages = (latin.match(/\/Type\s*\/Page(?!s)/g) || []).length;
const mime = bin.mimeType || (latin.startsWith('%PDF') ? 'application/pdf' : 'unknown');
const chk = ENGINE.checkFile({ mime: latin.startsWith('%PDF') ? 'application/pdf' : mime, bytes: buf.length, pages }, CFG.project);
if (!chk.ok) throw new Error(`[run_id=${ctx.run_id}] ${chk.error_code}: bytes=${buf.length} pages=${pages}`);
return { json: { ctx: { ...ctx, page_count: pages, file_bytes: buf.length }, pdf_b64: buf.toString('base64') }, binary: $input.item.binary };
