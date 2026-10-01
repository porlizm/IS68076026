// WF_SUB_Deliver · Render Report — HTML ที่ escape แล้ว ลิงก์ https เท่านั้น · กันส่งซ้ำด้วย report_hash (UC-06 6a)
const input = $('When Called by Main').first().json.payload;
const p = input.report_payload;
const prior = $('Read Deliveries').all().map((i) => i.json).find((d) => d.report_hash === p.report_hash && d.email_status === 'sent') || null;
const html = ENGINE.renderReportHTML(p, CFG.project);
// email_enabled = false จนกว่าจะทดสอบส่งผ่าน: ส่งให้ผู้วิจัยแทนผู้เข้าร่วม
const to = CFG.project.email_enabled ? input.ctx.email : ($env.RESEARCHER_EMAIL || '');
const mail = ENGINE.buildEmail(p, to, CFG.project);
const boundary = 'is68doc' + p.report_hash.slice(0, 12);
const meta = { name: 'IS68076026_' + p.run_id, mimeType: 'application/vnd.google-apps.document', parents: [$env.DRIVE_REPORT_FOLDER_ID] };
const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${html}\r\n--${boundary}--`;
return [{ json: { ctx: input.ctx, run_id: p.run_id, report_hash: p.report_hash, not_yet_delivered: prior === null, prior, mail,
  email_to: to, file_name: mail.attachment_name, doc_upload: { content_type: `multipart/related; boundary=${boundary}`, body } } }];
