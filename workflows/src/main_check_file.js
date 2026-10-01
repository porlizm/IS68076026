// WF_Main_Intake · Check File (runOnceForEachItem) — ตรวจชนิด ขนาด จำนวนหน้า (ตาราง 3.10, 3.22)
const ctx = $('Parse & Validate').item.json;
const bin = $input.item.binary && $input.item.binary.data;
if (!bin) throw new Error(`[run_id=${ctx.run_id}] file_download_failed: ไม่มีไฟล์จาก Drive (ตรวจการแชร์โฟลเดอร์ของแบบฟอร์มให้บัญชีบริการ)`);
const buf = await this.helpers.getBinaryDataBuffer($itemIndex, 'data');
const latin = buf.toString('latin1');
const pages = (latin.match(/\/Type\s*\/Page(?!s)/g) || []).length;
const mime = bin.mimeType || (latin.startsWith('%PDF') ? 'application/pdf' : 'unknown');
const chk = ENGINE.checkFile({ mime: latin.startsWith('%PDF') ? 'application/pdf' : mime, bytes: buf.length, pages }, CFG.project);
if (!chk.ok) throw new Error(`[run_id=${ctx.run_id}] ${chk.error_code}: bytes=${buf.length} pages=${pages}`);
return { json: { ctx: { ...ctx, page_count: pages, file_bytes: buf.length }, pdf_b64: buf.toString('base64') } };
