// Drive Result · สรุปผลอัปโหลดให้หน้าเว็บ (สำเร็จ → ลิงก์เปิดไฟล์ · ล้ม → ข้อความที่อ่านเข้าใจ)
const r = $input.first().json || {};
const meta = $('Check PDF').first().json;
if (r.error || !r.id) {
  const msg = String((r.error && (r.error.message || r.error.description)) || r.error || 'ไม่ได้รับ file id จาก Google Drive');
  return [{ json: { ok: false, http_status: 502, errors: ['อัปโหลดขึ้น Google Drive ไม่สำเร็จ: ' + msg.slice(0, 200) + ' — ตรวจ credential "Google Drive OAuth2" และ Folder ID ในโหนด Upload PDF to Drive'] } }];
}
return [{ json: { ok: true, http_status: 200, file_id: r.id, name: r.name || meta.file_name, size: meta.size,
  web_view_link: r.webViewLink || ('https://drive.google.com/file/d/' + r.id + '/view') } }];
