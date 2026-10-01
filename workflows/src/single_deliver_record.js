// WF_IS_68076026_01OCT26 · Build Delivery Record — บันทึกการส่งครั้งเดียวต่องาน อ่านผลจาก $input เท่านั้น (ไม่หยิบผลของงานก่อนหน้าในลูป)
// ต่างจาก WF_Final_IS: ถ้าอัปโหลด PDF ล้มแต่อีเมล (ที่แนบ PDF จาก Export) ส่งสำเร็จ = ผู้เข้าร่วมได้รายงานแล้ว → delivered + error_code pdf_upload_failed (DEC-42)
const r = $('Render Thai Report').first().json;
const j = $input.first().json || {};
const now = new Date().toISOString();
let email_status = 'failed'; let pdf_file_id = ''; let web_view_link = ''; let error_code = '';
if (r.prior) {
  email_status = 'sent'; pdf_file_id = r.prior.pdf_file_id; web_view_link = r.prior.web_view_link; error_code = 'reused_prior_delivery';
} else if (j.delivery_path === 'success') {
  const up = j.upload || {}; const sent = j.email || {};
  if (up.id && !up.error) { pdf_file_id = up.id; web_view_link = up.webViewLink || ''; }
  if (sent.error) error_code = pdf_file_id ? 'email_failed' : 'pdf_upload_failed|email_failed';
  else { email_status = 'sent'; error_code = !pdf_file_id ? 'pdf_upload_failed' : (!j.temp_doc_deleted ? 'temp_doc_delete_failed' : ''); }
} else {
  error_code = String((j.error && (j.error.message || j.error.description)) || j.error || 'delivery_failed').slice(0, 120);
}
const delivered = email_status === 'sent';
return [{ json: {
  delivery_row: { run_id: r.run_id, report_hash: r.report_hash, pdf_file_id, web_view_link, file_name: r.file_name, email_to: r.email_to, email_status, error_code, sent_at: delivered ? now : '' },
  run_update: { run_id: r.run_id, updated_at: now, stage: delivered ? 'delivered' : 'failed', pdf_file_id, email_status, error_code },
  // DEC-48: ส่งไม่สำเร็จไม่ใช่ error ของ n8n (Error Trigger ไม่ทำงาน) จึงแจ้งผู้วิจัยจากสาขานี้ · ผู้เข้าร่วมไม่เห็นข้อความทางเทคนิค
  delivery_failed: !delivered,
  alert: { subject: `[IS68076026][DELIVERY] ${r.run_id} ${error_code || 'failed'}`, body: `ส่งรายงานไม่สำเร็จ\nrun_id: ${r.run_id}\nemail_to: ${r.email_to}\nerror_code: ${error_code}\nreport_hash: ${r.report_hash}\n\nตรวจแท็บ deliveries แล้วส่งรายงานซ้ำ (ผู้เข้าร่วมยังไม่ได้รับรายงาน)` },
} }];
