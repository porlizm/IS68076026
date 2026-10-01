# ทดสอบ WF_IS_68076026_01OCT26 ใน n8n 2.39.9 จริง (DEC-48)

> สถานะ: **✅ ผ่าน 14/14 กรณี · 71/71 จุดตรวจ** · 1 ต.ค. 2569 · n8n 2.39.9 (npm) · Node 24.21.0 · task runner ค่าเริ่มต้น · SQLite
> บริการภายนอกเป็น**บริการจำลอง**ทั้งหมด (Google OAuth/Sheets/Drive/Gmail/Document AI · OpenAI · Anthropic · Gemini · OCR ในเครื่อง) ด้วย `evidence/n8n_s6/mock_server.mjs` · n8n เรียกโดเมนจริง (`sheets.googleapis.com` ฯลฯ) ผ่าน HTTPS โดยใช้ `/etc/hosts` เฉพาะ process ของ n8n และ CA ทดสอบ (`NODE_EXTRA_CA_CERTS`) · โหนด Google ของ n8n จึงทำงานจริงทุกขั้น (JWT ของบัญชีบริการ · OAuth2 · resumable upload · values:append)
> ยังไม่ได้ยืนยัน: บัญชี Google จริง · Google Forms จริง · โมเดลจริงทั้งสาม (P1 smoke test) · temperature 0

## วิธีทดสอบ

1. ติดตั้ง `n8n@2.39.9` บน Node 24 · env ตาม `config/env_template.env` (`N8N_BLOCK_ENV_ACCESS_IN_NODE=false`, `N8N_CONCURRENCY_PRODUCTION_LIMIT=1`)
2. `n8n import:credentials` 4 ชุด (id ตรง placeholder `CRED_*` ใน workflow) · `n8n import:workflow --input=workflows/WF_IS_68076026_01OCT26.json` · เปิดใช้งานผ่าน public API
3. แต่ละกรณี: ตั้ง fault ของบริการจำลอง → เพิ่มแถวในแท็บ form_responses → รอ Google Sheets Trigger (poll ทุก 1 นาที) → รอทุก execution จบ → ตรวจแถวที่เกิดในทุกแท็บ ไฟล์ใน Drive และอีเมล (`evidence/n8n_s6/s6_suite.py`)

## ผลรายกรณี

| # | กรณี | ผล | execution (mode/status) | จุดตรวจ |
|---|---|---|---|---|
| 1 | นำเข้าและเปิดใช้งาน (import:workflow + activate) | ผ่าน | — | ✅ ชื่อ WF_IS_68076026_01OCT26<br>✅ 69 โหนด + 7 sticky note<br>✅ active=true (n8n ตรวจพารามิเตอร์ trigger ผ่าน) |
| 2 | เรซูเม A มีชั้นข้อความ | ผ่าน | #75 trigger/success | ✅ execution trigger สำเร็จ ไม่มี error execution<br>✅ runs.stage = delivered<br>✅ deliveries 1 แถว<br>✅ decisions 30 แถว<br>✅ อีเมลแนบ PDF 1 ฉบับ<br>✅ ocr_results.engine = pdf_text_layer<br>✅ pdf_file_id=mockpdf_93ef212617712189ae18502464bb error_code=''<br>✅ R = 66.25 (ตรง run_local 66.25)<br>✅ plan_items 7 (ตรง run_local 7)<br>✅ ลบ Google Doc ชั่วคราวแล้ว |
| 3 | เรซูเม C สแกน + โมเดล C ตอบ 429 ทุกครั้ง | ผ่าน | #76 trigger/success | ✅ execution trigger สำเร็จ ไม่มี error execution<br>✅ runs.stage = delivered<br>✅ deliveries 1 แถว<br>✅ decisions 30 แถว<br>✅ อีเมลแนบ PDF 1 ฉบับ<br>✅ ocr engine = google_document_ai<br>✅ model_calls C: [(1, '429'), (2, '429'), (3, '429')]<br>✅ ช่วงรอก่อนเรียกซ้ำ [5.0, 15.0] วินาที (retry_backoff_ms 5000/15000)<br>✅ model_status m=2;A:ok;B:ok;C:call_failed<br>✅ R = 38.57 (ตรง run_local 38.57) |
| 4 | สองแถวในการ poll เดียว | ผ่าน | #77 trigger/success | ✅ execution เดียวทำครบสองงาน<br>✅ runs [('35270d13', 'delivered'), ('f9984a6a', 'delivered')]<br>✅ deliveries 2 · decisions 60<br>✅ R ของสองงาน [66.25, 19.63] (ไม่ปนกัน) |
| 5 | ไม่ให้ความยินยอม | ผ่าน | #78 trigger/success | ✅ ไม่มีแถว runs (0)<br>✅ audit ['rejected_input']<br>✅ ไม่ส่งอีเมล |
| 6 | ไฟล์ 6 หน้า | ผ่าน | #79 trigger/error · #80 error/success | ✅ trigger=['error'] error=['success']<br>✅ runs failed / too_many_pages<br>✅ แจ้งผู้วิจัย 1 ฉบับ |
| 7 | ล้มกลางลูป (สองงาน · อ่าน ref_corpus ไม่ได้) | ผ่าน | #81 trigger/error · #82 error/success | ✅ trigger ล้ม · Error Trigger ทำงานสำเร็จ<br>✅ งานที่ล้ม [('aed03536', 'failed', 'unexpected_error')]<br>✅ งานที่ยังไม่เริ่ม [('feab1c47', 'failed', 'batch_aborted')]<br>✅ audit_log workflow_error ระบุ run_id ของงานที่ล้ม<br>✅ อีเมลแจ้งผู้วิจัย 1 ฉบับ |
| 8 | โมเดลล้มครบสามตัว (401) | ผ่าน | #83 trigger/success | ✅ execution trigger สำเร็จ ไม่มี error execution<br>✅ runs.stage = delivered<br>✅ deliveries 1 แถว<br>✅ decisions 30 แถว<br>✅ อีเมลแนบ PDF 1 ฉบับ<br>✅ abstained 30 · R N/A<br>✅ model_calls 3 (401 ไม่เรียกซ้ำ) · findings 0 |
| 9 | อัปโหลด PDF ล้ม (Drive ตอบ 403 quota ที่ขั้นอัปโหลด PDF) | ผ่าน | #84 trigger/success | ✅ execution trigger สำเร็จ ไม่มี error execution<br>✅ runs.stage = delivered<br>✅ deliveries 1 แถว<br>✅ decisions 30 แถว<br>✅ อีเมลแนบ PDF 1 ฉบับ<br>✅ error_code pdf_upload_failed email sent |
| 10 | Document AI ล้ม → OCR ในเครื่อง | ผ่าน | #85 trigger/success | ✅ execution trigger สำเร็จ ไม่มี error execution<br>✅ runs.stage = delivered<br>✅ deliveries 1 แถว<br>✅ decisions 30 แถว<br>✅ อีเมลแนบ PDF 1 ฉบับ<br>✅ ocr engine = local_ocr |
| 11 | OCR ล้มทั้งหลักและสำรอง | ผ่าน | #86 trigger/error · #87 error/success | ✅ runs failed / ocr_failed |
| 13 | โฟลเดอร์รายงานผิด (สร้าง Doc ชั่วคราวไม่ได้ → ไม่มี PDF) | ผ่าน | #88 trigger/success | ✅ execution สำเร็จ (ส่งไม่สำเร็จไม่ใช่ error ของ n8n)<br>✅ runs failed / email failed<br>✅ deliveries 1 แถว (บันทึกครั้งเดียว)<br>✅ แจ้งผู้วิจัย [('researcher@mail.test', False)] |
| 14 | trigger อ่านชีตไม่ได้ต่อเนื่อง ~3 นาที | ผ่าน | #89 trigger/error · #90 error/success · #91 trigger/error · #92 error/success | ✅ poll ล้ม 2 ครั้ง<br>✅ Error Trigger ทำงาน 2 ครั้ง สำเร็จทุกครั้ง<br>✅ ไม่มีแถว runs ปลอม (0)<br>✅ audit_log 2 แถว<br>✅ อีเมลถึงผู้วิจัย 0 ฉบับในรอบนี้ — ฉบับแรกส่งไปแล้วในการรันแยก 21:36 น. (case14.out: 3 poll ล้ม → 1 ฉบับ) จึงอยู่ในช่วงพัก 1 ชั่วโมงของ Is Alert Due? (static data คงอยู่ข้าม execution) |
| 12 | PDF 6 หน้าแบบ object stream | ผ่าน | #93 trigger/error · #94 error/success | ✅ trigger=['error'] error=['success']<br>✅ runs failed / too_many_pages<br>✅ แจ้งผู้วิจัย 1 ฉบับ<br>✅ ตรวจพบที่ Choose Text Source: [run_id=RUN-20261001145936-eea52e7d] too_many_pages: pages=6 (extractFromFile) [line 9] |

หน่วยความจำของ process หลักของ n8n ตลอดชุดทดสอบสูงสุด 1,141 MB (RSS · `evidence/n8n_s6/mem.log` · heap ค่าเริ่มต้น) — ก่อนแก้ Get Failed Execution ชุดเดียวกันทำให้ n8n หน่วยความจำเต็มและล่มที่กรณี 14

## สิ่งที่พบใน n8n จริงและแก้แล้ว (รุ่น DEC-42 → DEC-48)

รายละเอียดอยู่ใน `evidence/WF_analysis.md` หัวข้อ 3 · สรุป: (1) รหัส HTTP ของ error หายเมื่อส่งข้าม task runner → 429 ไม่ถูกเรียกซ้ำ (2) PDF แบบ object stream นับหน้าไม่ได้ (3) งานที่เหลือในรอบที่ล้มหายเงียบ (4) ส่งรายงานไม่สำเร็จไม่มีใครรู้ (5) trigger ล้มทุกนาทีเขียนแถว runs ปลอมและส่งอีเมลทุกนาที (6) OCR สำรองล้มไม่มีรหัสสาเหตุ (7) append ของ Sheets เสี่ยงเขียนทับเมื่อมีหลาย execution (8) trigger ล้มแล้ว Get Failed Execution ดึงข้อมูลทุก execution จน n8n หน่วยความจำเต็ม (9) นำเข้าด้วย CLI ขณะ n8n ทำงานทำให้ poller ซ้อน

กรณี "อัปโหลด PDF ล้ม" ในเอกสารฉบับก่อนให้ตั้ง `DRIVE_REPORT_FOLDER_ID` ผิด แต่โฟลเดอร์นั้นใช้สร้าง Google Doc ชั่วคราวด้วย จึงไม่มี PDF ให้แนบอีเมล (ทดสอบแยกเป็นกรณี 13) · กรณี 9 จึงจำลองให้ Drive ปฏิเสธเฉพาะขั้นอัปโหลด PDF

## ทำซ้ำบนเครื่องผู้วิจัยกับบริการจริง (👤)

ตาม `docs/Setup_Guide.md` ข้อ 3–5 · ใช้บัญชี Google จริงและ `email_enabled=false` · กรณี 2, 3, 4, 5, 6 ทำได้ทันทีด้วยแบบฟอร์มจริง · บันทึก execution id ต่อท้ายตารางนี้
