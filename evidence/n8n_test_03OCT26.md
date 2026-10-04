# ทดสอบ WF_IS_68076026_01OCT26 รุ่น 79 โหนด ใน n8n 2.39.9 จริง (DEC-48 · DEC-60)

> สถานะ: **✅ ผ่าน 15/15 กรณี · 83/83 จุดตรวจ** · 3 ต.ค. 2569 · n8n 2.39.9 (npm) · Node 24.21.0 · task runner ค่าเริ่มต้น · SQLite
> บริการภายนอกเป็น**บริการจำลอง**ทั้งหมด (Google OAuth/Sheets/Drive/Gmail/Document AI · OpenAI · Anthropic · Gemini · OCR ในเครื่อง) ด้วย `evidence/n8n_s6/mock_server.mjs` · n8n เรียกโดเมนจริง (`sheets.googleapis.com` ฯลฯ) ผ่าน HTTPS โดยใช้ `/etc/hosts` เฉพาะ process ของ n8n และ CA ทดสอบ (`NODE_EXTRA_CA_CERTS`) · โหนด Google ของ n8n จึงทำงานจริงทุกขั้น (JWT ของบัญชีบริการ · OAuth2 · resumable upload · values:append)
> ยังไม่ได้ยืนยัน: บัญชี Google จริง · Google Forms จริง · โมเดลจริงทั้งสาม (P1 smoke test) · temperature 0

## วิธีทดสอบ

1. ติดตั้ง `n8n@2.39.9` บน Node 24 · env ตาม `config/env_template.env` (`N8N_BLOCK_ENV_ACCESS_IN_NODE=false`, `N8N_CONCURRENCY_PRODUCTION_LIMIT=1`)
2. `n8n import:credentials` 4 ชุด (id ตรง placeholder `CRED_*` ใน workflow) · `n8n import:workflow --input=workflows/WF_IS_68076026_01OCT26.json` · เปิดใช้งานผ่าน public API
3. แต่ละกรณี: ตั้ง fault ของบริการจำลอง → เพิ่มแถวในแท็บ form_responses → รอ Google Sheets Trigger (poll ทุก 1 นาที) → รอทุก execution จบ → ตรวจแถวที่เกิดในทุกแท็บ ไฟล์ใน Drive และอีเมล (`evidence/n8n_s6/s6_suite.py`)

## ผลรายกรณี

| # | กรณี | ผล | execution (mode/status) | จุดตรวจ |
|---|---|---|---|---|
| 1 | นำเข้าและเปิดใช้งาน (import:workflow + activate) | ผ่าน | — | ✅ ชื่อ WF_IS_68076026_01OCT26<br>✅ 79 โหนด + 7 sticky note<br>✅ active=true (n8n ตรวจพารามิเตอร์ trigger ผ่าน) |
| 2 | เรซูเม A มีชั้นข้อความ | ผ่าน | #62 trigger/success | ✅ execution trigger สำเร็จ ไม่มี error execution<br>✅ runs.stage = delivered<br>✅ deliveries 1 แถว<br>✅ decisions 30 แถว<br>✅ อีเมลแนบ PDF 1 ฉบับ<br>✅ ocr_results.engine = pdf_text_layer<br>✅ pdf_file_id=mockpdf_20ea22a059e1aeead2c7c2b1bfbc error_code=''<br>✅ R = 67.72 (ตรง run_local 67.72)<br>✅ plan_items 6 (ตรง run_local 6 · คลัง v1.6)<br>✅ ลบ Google Doc ชั่วคราวแล้ว<br>✅ เรียกผู้ตรวจความหมาย (R3b) 3 ครั้ง<br>✅ ตราประทับรุ่น build_id=WF_IS-d904c1152bbf engine=engine-2.1.0-03OCT26<br>✅ role_task_decisions 8 แถว (ดัชนี T) |
| 3 | เรซูเม C สแกน + โมเดล C ตอบ 429 ทุกครั้ง | ผ่าน | #63 trigger/success | ✅ execution trigger สำเร็จ ไม่มี error execution<br>✅ runs.stage = delivered<br>✅ deliveries 1 แถว<br>✅ decisions 30 แถว<br>✅ อีเมลแนบ PDF 1 ฉบับ<br>✅ ocr engine = google_document_ai<br>✅ model_calls C: [(1, '429'), (2, '429'), (3, '429')]<br>✅ ช่วงรอก่อนเรียกซ้ำ [5.0, 15.0] วินาที (retry_backoff_ms 5000/15000)<br>✅ model_status m=2;A:ok;B:ok;C:call_failed<br>✅ R = 43.58 (ตรง run_local 43.58) |
| 4 | สองแถวในการ poll เดียว | ผ่าน | #64 trigger/success | ✅ execution เดียวทำครบสองงาน<br>✅ runs [('25d3a9d5', 'delivered'), ('f61ae36a', 'delivered')]<br>✅ deliveries 2 · decisions 60<br>✅ R ของสองงาน [67.72, 23.12] (ไม่ปนกัน) |
| 5 | ไม่ให้ความยินยอม | ผ่าน | #65 trigger/success | ✅ ไม่มีแถว runs (0)<br>✅ audit ['rejected_input']<br>✅ ไม่ส่งอีเมล |
| 6 | ไฟล์ 6 หน้า | ผ่าน | #66 trigger/error · #67 error/success | ✅ trigger=['error'] error=['success']<br>✅ runs failed / too_many_pages<br>✅ แจ้งผู้วิจัย 1 ฉบับ |
| 7 | ล้มกลางลูป (สองงาน · อ่าน ref_corpus ไม่ได้) | ผ่าน | #68 trigger/error · #69 error/success | ✅ trigger ล้ม · Error Trigger ทำงานสำเร็จ<br>✅ งานที่ล้ม [('e49d9fbc', 'failed', 'unexpected_error')]<br>✅ งานที่ยังไม่เริ่ม [('477e88fd', 'failed', 'batch_aborted')]<br>✅ audit_log workflow_error ระบุ run_id ของงานที่ล้ม<br>✅ อีเมลแจ้งผู้วิจัย 1 ฉบับ |
| 8 | โมเดลล้มครบสามตัว (401) | ผ่าน | #70 trigger/success | ✅ execution trigger สำเร็จ ไม่มี error execution<br>✅ runs.stage = delivered<br>✅ deliveries 1 แถว<br>✅ decisions 30 แถว<br>✅ อีเมลแนบ PDF 1 ฉบับ<br>✅ abstained 30 · R N/A<br>✅ model_calls 3 (401 ไม่เรียกซ้ำ) · findings 0 |
| 9 | อัปโหลด PDF ล้ม (Drive ตอบ 403 quota ที่ขั้นอัปโหลด PDF) | ผ่าน | #71 trigger/success | ✅ execution trigger สำเร็จ ไม่มี error execution<br>✅ runs.stage = delivered<br>✅ deliveries 1 แถว<br>✅ decisions 30 แถว<br>✅ อีเมลแนบ PDF 1 ฉบับ<br>✅ error_code pdf_upload_failed email sent |
| 10 | Document AI ล้ม → OCR ในเครื่อง | ผ่าน | #72 trigger/success | ✅ execution trigger สำเร็จ ไม่มี error execution<br>✅ runs.stage = delivered<br>✅ deliveries 1 แถว<br>✅ decisions 30 แถว<br>✅ อีเมลแนบ PDF 1 ฉบับ<br>✅ ocr engine = local_ocr |
| 11 | OCR ล้มทั้งหลักและสำรอง | ผ่าน | #73 trigger/error · #74 error/success | ✅ runs failed / ocr_failed |
| 13 | โฟลเดอร์รายงานผิด (สร้าง Doc ชั่วคราวไม่ได้ → ไม่มี PDF) | ผ่าน | #75 trigger/success | ✅ execution สำเร็จ (ส่งไม่สำเร็จไม่ใช่ error ของ n8n)<br>✅ runs failed / email failed<br>✅ deliveries 1 แถว (บันทึกครั้งเดียว)<br>✅ แจ้งผู้วิจัย [('researcher@mail.test', False)] |
| 15 | เรซูเม D ผู้จัดการโครงการ (R7 · ผู้ตรวจ C ตอบผิดรูปแบบ) | ผ่าน | #76 trigger/success | ✅ execution trigger สำเร็จ ไม่มี error execution<br>✅ runs.stage = delivered<br>✅ deliveries 1 แถว<br>✅ decisions 30 แถว<br>✅ อีเมลแนบ PDF 1 ฉบับ<br>✅ เรียกผู้ตรวจความหมาย (R3b) 1 ครั้ง<br>✅ ตราประทับรุ่น build_id=WF_IS-d904c1152bbf engine=engine-2.1.0-03OCT26<br>✅ role_task_decisions 8 แถว (ดัชนี T)<br>✅ R = 84.77 (ตรง run_local 84.77) |
| 14 | trigger อ่านชีตไม่ได้ต่อเนื่อง ~3 นาที | ผ่าน | #89 trigger/error · #90 error/success · #91 trigger/error · #92 error/success · #93 trigger/error · #94 error/success | ✅ poll ล้ม 3 ครั้ง<br>✅ Error Trigger ทำงาน 3 ครั้ง สำเร็จทุกครั้ง<br>✅ ไม่มีแถว runs ปลอม (0)<br>✅ audit_log 3 แถว<br>✅ อีเมลถึงผู้วิจัย 1 ฉบับ (ไม่เกินชั่วโมงละครั้ง) |
| 12 | PDF 6 หน้าแบบ object stream | ผ่าน | #83 trigger/error · #84 error/success | ✅ trigger=['error'] error=['success']<br>✅ runs failed / too_many_pages<br>✅ แจ้งผู้วิจัย 1 ฉบับ<br>✅ ตรวจพบที่ Choose Text Source: [run_id=RUN-20261003175242-9862b251] too_many_pages: pages=6 (extractFromFile) [line 10] |

## สิ่งที่เปลี่ยนจากการทดสอบ 1 ต.ค. 2569

1. workflow รุ่น 79 โหนดทำงาน (เดิม 69) มีผู้ตรวจความหมาย Call Verifier A/B/C (R3b) กฎ R7 ตราประทับรุ่น และแท็บ role_task_decisions
2. บริการจำลองตอบคำขอของผู้ตรวจความหมายตามเฉลยของกรณี (เหมือน `scripts/run_local.mjs` oracleVerifierText) และรองรับกรณี D
3. เพิ่มกรณี 15 (เรซูเม D อาชีพ R19 · ผู้ตรวจ C ตอบผิดรูปแบบ) และจุดตรวจผู้ตรวจความหมาย ตราประทับรุ่น และแท็บ role_task_decisions ในกรณี 2 และ 15
4. ค่าคาดหวังปรับเป็นค่าของ engine 2.1.0 จาก run_local: R ของ A B C D = 67.72, 23.12, 43.58, 84.77 · แผนกรณี A 5 รายการ
5. กรณี 15 รอบแรกได้ R = 84.58 เพราะผู้ตรวจจำลองเทียบข้อความแบบตรงตัว ข้อความที่ซ่อมจากชั้นข้อความของ PDF มีการขึ้นบรรทัดต่างจาก resume.txt จึงถูกตัดสินว่าไม่เกี่ยวข้อง แก้ผู้ตรวจจำลองให้ยุบช่องว่างก่อนเทียบแล้วรันกรณีนี้ซ้ำ ได้ 84.77 ตรงกับ run_local ข้อนี้เป็นข้อจำกัดของบริการจำลอง ไม่ใช่ของ workflow
6. หน่วยความจำของ process หลักของ n8n หลังชุดทดสอบประมาณ 1.0 GB (RSS)

## สิ่งที่พบใน n8n จริงและแก้แล้ว (รุ่น DEC-42 → DEC-48)

รายละเอียดอยู่ใน `evidence/WF_analysis.md` หัวข้อ 3 · สรุป: (1) รหัส HTTP ของ error หายเมื่อส่งข้าม task runner → 429 ไม่ถูกเรียกซ้ำ (2) PDF แบบ object stream นับหน้าไม่ได้ (3) งานที่เหลือในรอบที่ล้มหายเงียบ (4) ส่งรายงานไม่สำเร็จไม่มีใครรู้ (5) trigger ล้มทุกนาทีเขียนแถว runs ปลอมและส่งอีเมลทุกนาที (6) OCR สำรองล้มไม่มีรหัสสาเหตุ (7) append ของ Sheets เสี่ยงเขียนทับเมื่อมีหลาย execution

กรณี "อัปโหลด PDF ล้ม" ในเอกสารฉบับก่อนให้ตั้ง `DRIVE_REPORT_FOLDER_ID` ผิด แต่โฟลเดอร์นั้นใช้สร้าง Google Doc ชั่วคราวด้วย จึงไม่มี PDF ให้แนบอีเมล (ทดสอบแยกเป็นกรณี 13) · กรณี 9 จึงจำลองให้ Drive ปฏิเสธเฉพาะขั้นอัปโหลด PDF

## ทำซ้ำบนเครื่องผู้วิจัยกับบริการจริง (👤)

ตาม `docs/Setup_Guide.md` ข้อ 3–5 · ใช้บัญชี Google จริงและ `email_enabled=false` · กรณี 2, 3, 4, 5, 6 ทำได้ทันทีด้วยแบบฟอร์มจริง · บันทึก execution id ต่อท้ายตารางนี้

## หมายเหตุการรัน (4 ต.ค. 2569)

รันชุดทดสอบเต็ม 15 กรณีบน corpus v1.6 และ build_id WF_IS-d904c1152bbf ได้ 82 จาก 83 จุดตรวจ จุดที่ไม่ผ่านคือกรณี 14 ข้อ "อีเมลถึงผู้วิจัย 1 ฉบับ" ซึ่งได้ 0 ฉบับ เพราะตัวหน่วงแจ้งเตือน (ไม่เกินชั่วโมงละครั้ง ค่า `last_unknown_error_alert` ใน static data) ยังนับจากอีเมลที่ส่งในการรันก่อนหน้าภายใน 1 ชั่วโมง ไม่ใช่ข้อบกพร่องของ workflow ผู้ทดสอบล้างค่าดังกล่าวแล้วรันกรณี 14 ซ้ำ ผ่านครบ 5 จาก 5 จุด ตารางข้างต้นจึงรวมผลรอบเต็มกับผลกรณี 14 ที่รันซ้ำ
