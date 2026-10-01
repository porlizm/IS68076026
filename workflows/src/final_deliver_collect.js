// WF_Final_IS · Collect Delivery Result (DEC-37)
// โหนดนี้อยู่บนเส้นทางสำเร็จเท่านั้น (Merge รอ Upload PDF + Send Email ของรอบนี้ครบแล้ว → Delete Temp Doc → โหนดนี้)
// จึงอ่านผลของสองโหนดได้โดยไม่ปนกับรอบก่อนของ Loop Over Runs แล้วส่งต่อทาง $input ให้ Record Delivery
const del = $input.first().json || {};
return [{ json: { delivery_path: 'success', upload: $('Upload PDF').first().json || {}, email: $('Send Email').first().json || {}, temp_doc_deleted: !del.error } }];
