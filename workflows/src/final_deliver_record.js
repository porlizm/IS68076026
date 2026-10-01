// WF_Final_IS · Record Delivery (DEC-37) — ตรรกะเดียวกับ deliver_record.js (บั๊ก B8) แต่อ่านผลจาก $input เท่านั้น
// ไม่อ่านผลของโหนด Upload PDF / Send Email ด้วย $() ตรง ๆ เพราะใน Loop Over Runs ถ้ารอบนี้ล้มก่อนถึงสองโหนดนั้น จะได้ผลของรอบก่อน
// ขาเข้า (ไม่เกิดพร้อมกัน): Not Yet Delivered? false (เคยส่งแล้ว) · error output ของ Upload as Google Doc / Export PDF · Collect Delivery Result (สำเร็จ)
const r = $('Render Report').first().json;
const j = $input.first().json || {};
const now = new Date().toISOString();
let email_status = 'failed'; let pdf_file_id = ''; let web_view_link = ''; let error_code = '';
if (r.prior) {
  email_status = 'sent'; pdf_file_id = r.prior.pdf_file_id; web_view_link = r.prior.web_view_link; error_code = 'reused_prior_delivery';
} else if (j.delivery_path === 'success') {
  const up = j.upload || {}; const sent = j.email || {};
  if (up.id && !up.error) { pdf_file_id = up.id; web_view_link = up.webViewLink || ''; }
  if (!pdf_file_id) error_code = 'pdf_upload_failed';
  else if (sent.error) error_code = 'email_failed';
  else { email_status = 'sent'; if (!j.temp_doc_deleted) error_code = 'temp_doc_delete_failed'; }
} else {
  error_code = String((j.error && (j.error.message || j.error.description)) || j.error || 'delivery_failed').slice(0, 120);
}
const delivered = email_status === 'sent';
return [{ json: {
  delivery_row: { run_id: r.run_id, report_hash: r.report_hash, pdf_file_id, web_view_link, file_name: r.file_name, email_to: r.email_to, email_status, error_code, sent_at: delivered ? now : '' },
  run_update: { run_id: r.run_id, updated_at: now, stage: delivered ? 'delivered' : 'failed', pdf_file_id, email_status, error_code },
} }];
