// WF_SUB_Deliver · Record Delivery — บั๊ก B8: อ่านผลจากเส้นทางสำเร็จ ไม่ใช่จาก error branch
const r = $('Render Report').first().json;
const j = $input.first().json || {};
const now = new Date().toISOString();
const tryNode = (name) => { try { return $(name).first().json; } catch (e) { return null; } };
let email_status = 'failed'; let pdf_file_id = ''; let web_view_link = ''; let error_code = '';
if (r.prior) {
  email_status = 'sent'; pdf_file_id = r.prior.pdf_file_id; web_view_link = r.prior.web_view_link; error_code = 'reused_prior_delivery';
} else {
  const up = tryNode('Upload PDF');
  if (up && up.id && !up.error) { pdf_file_id = up.id; web_view_link = up.webViewLink || ''; }
  const sent = tryNode('Send Email');
  if (j.error) error_code = String((j.error && (j.error.message || j.error.description)) || j.error).slice(0, 120);
  else if (sent && !sent.error && pdf_file_id) email_status = 'sent';
  else if (!pdf_file_id) error_code = 'pdf_upload_failed';
  else error_code = 'email_failed';
}
const delivered = email_status === 'sent';
return [{ json: {
  delivery_row: { run_id: r.run_id, report_hash: r.report_hash, pdf_file_id, web_view_link, file_name: r.file_name, email_to: r.email_to, email_status, error_code, sent_at: delivered ? now : '' },
  run_update: { run_id: r.run_id, updated_at: now, stage: delivered ? 'delivered' : 'failed', pdf_file_id, email_status, error_code },
} }];
