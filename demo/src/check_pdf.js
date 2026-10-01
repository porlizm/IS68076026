// Check PDF · รับไฟล์ PDF ที่หน้าเว็บสร้าง (html2pdf) ก่อนส่งขึ้น Google Drive
const item = $input.first();
const body = (item.json && item.json.body) || {};
const bin = item.binary || {};
const key = bin.pdf ? 'pdf' : Object.keys(bin)[0];
const errors = [];
let size = 0;
if (!key) errors.push('ไม่พบไฟล์ PDF');
else {
  const buf = await this.helpers.getBinaryDataBuffer(0, key);
  size = buf.length;
  if (buf.slice(0, 5).toString('latin1') !== '%PDF-') errors.push('ไฟล์ที่ส่งมาไม่ใช่ PDF');
  if (size > 25 * 1024 * 1024) errors.push('PDF ใหญ่เกิน 25 MB');
}
const safe = (s) => String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').slice(0, 120);
const fileName = safe(body.filename) || ('IS68076026_Report_' + new Date().toISOString().slice(0, 10) + '.pdf');
const out = { json: { ok: errors.length === 0, http_status: errors.length ? 400 : 200, errors, file_name: /\.pdf$/i.test(fileName) ? fileName : fileName + '.pdf', size, run_id: safe(body.run_id) } };
if (key) out.binary = { pdf: { ...bin[key], fileName: out.json.file_name, mimeType: 'application/pdf' } };
return [out];
