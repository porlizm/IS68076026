# ทดสอบ WF_IS68076026 ใน n8n 2.39.9 จริง (Phase 2.7)

> สถานะ: **⏳ รอข้อมูล: ผลรันใน n8n 2.39.9 จริง** — sandbox ของ Claude รันโค้ดของ Code node ได้ (tests/single_workflow.test.mjs) แต่ไม่ใช่ n8n จึงยังไม่ได้ยืนยัน: การนำเข้าไฟล์ · พฤติกรรม Loop/Merge/Error Trigger ของ n8n · Extract From File (pdf) · credential จริง
> 👤🤖 ผู้วิจัยรันตามขั้นด้านล่างบนเครื่องที่มี n8n แล้วกรอกตาราง (หรือเปิด session ใหม่ให้ Claude ช่วยผ่าน computer use)

## ขั้นตอน
1. `n8n import:workflow --input=workflows/WF_IS68076026.json` · ตั้ง env ตาม `config/env_template.env` · ใช้ Sheets ทดสอบที่นำเข้าจาก `sheets_import/IS68076026_Sheets_Template.xlsx`
2. ตั้ง credential 4 ชุด (Service Account · Drive OAuth2 · Gmail OAuth2 · n8n API) · `email_enabled=false` (อีเมลไปผู้วิจัย)
3. บริการจำลอง: ให้ MODEL_*_ID ชี้ endpoint จำลอง หรือใช้คีย์จริงกับเรซูเมสังเคราะห์ A/B/C (`synthetic/case_*/resume_text.pdf`)
4. รันกรณีในตาราง แล้วบันทึก execution id และแถวที่เกิดในแต่ละแท็บ

| # | กรณี | วิธีทำ | สิ่งที่ต้องเห็น | ผล |
|---|---|---|---|---|
| 1 | นำเข้า | import:workflow | 63 โหนด + 7 โน้ต ไม่มี error ตอนเปิด | ⏳ |
| 2 | เรซูเม A (มีชั้นข้อความ) | ส่งฟอร์ม 1 แถว | ocr_results.engine = pdf_text_layer · runs = delivered · deliveries 1 แถว | ⏳ |
| 3 | เรซูเม C (สแกน) | ส่งฟอร์ม 1 แถว | ocr_results.engine = google_document_ai · m = 2 | ⏳ |
| 4 | สองแถวในการ poll เดียว | ส่งฟอร์ม 2 แถวภายใน 1 นาที | runs 2 แถว run_id ต่างกัน ทั้งสองถึง delivered | ⏳ |
| 5 | ไม่ให้ความยินยอม | ตอบ "ไม่ยินยอม" | audit_log rejected_input · ไม่มีแถว runs | ⏳ |
| 6 | ไฟล์ 6 หน้า | แนบ PDF 6 หน้า | runs = failed error_code too_many_pages · อีเมลแจ้งผู้วิจัย | ⏳ |
| 7 | ล้มกลางลูป | ทำให้ Load Corpus ล้ม (ปิดสิทธิ์ชีตชั่วคราว) | runs ของงานนั้น = failed · run_id ถูกงาน | ⏳ |
| 8 | โมเดลล้มครบสามตัว | ใส่คีย์ผิดทั้งสาม | decisions abstained ทั้งหมด · รายงาน R = N/A · ส่งได้ | ⏳ |
| 9 | อัปโหลด PDF ล้ม | ตั้ง DRIVE_REPORT_FOLDER_ID ผิด | อีเมลส่ง · deliveries 1 แถว error_code pdf_upload_failed | ⏳ |
