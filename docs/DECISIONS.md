# ทะเบียนการตัดสินใจ (DECISIONS) · IS 68076026

> ฉบับรวม เริ่มใหม่ 1 ต.ค. 2569 ใน `Final_IS/` · ทุก DEC ใหม่ต้องมี **ปัญหา → การตัดสินใจ → ไฟล์ที่กระทบ → ผลต่อเล่ม → วิธีย้อนกลับ**
> ห้ามแก้ DEC เก่า ถ้าเปลี่ยนใจให้เพิ่ม DEC ใหม่ที่อ้างถึง · ต้นฉบับ DEC-09–17 อยู่ที่ `docs/reference/DECISIONS_31AUG26.md`

## สรุปทั้งหมด

| DEC | วันที่ | เรื่อง | สถานะใน Final_IS |
|---|---|---|---|
| 01–08 | ก่อน 31 ส.ค. | นโยบายชุดข้อกำหนด (DEC-03 Stratified Top-30 · DEC-07 ไม่ใช้ Abilities) และการตั้งค่าเริ่มต้น | ✅ ใช้ผ่าน `scripts/build_reference_data.py` (สร้างซ้ำได้ตรงไฟล์ตรึง 28AUG26 ทุกค่า) |
| 09 | 31 ส.ค. | professional-skills track ปิดช่องว่าง 57 ข้อ | ✅ อยู่ในคลัง v1.3 |
| 10 | 31 ส.ค. | รายการสั้นให้ R06/R07 | ✅ อยู่ในคลัง v1.3 |
| 11 | 31 ส.ค. | ตัวจัดแผนใช้ mapping ชั้น L1 เท่านั้น | ✅ `engine.js` (L1_LAYER กำหนดในโค้ด) |
| 14–15 | 31 ส.ค. | ซ่อมลิงก์ที่ย้ายที่ · รายการทดแทนใบรับรองที่ยกเลิก | ✅ อยู่ในคลัง v1.3 |
| 16 | 1 ก.ย. | cross-role track · **ห้ามเดา URL** | ✅ หลักถาวร |
| 17 | 1 ก.ย. | แยก temperature ของขั้น parse กับ report | ⚪ ไม่ใช้ (ระบบตามเล่มเรียกโมเดลเฉพาะขั้นวิเคราะห์ 3 ครั้ง) |
| 18 | 19 ก.ย. | foundation track 6 รายการ | ✅ ทำซ้ำใน DEC-29 |
| 19 | 19 ก.ย. | promote 17 คู่ L2 → L1 · REQ-R14-4.A.3.b.5 ไม่ปิด | ✅ ทำซ้ำใน DEC-29 |
| 20 | 19 ก.ย. | gap coverage สองค่า | ✅ `engine.buildPlan` + เทสต์ |
| 21 | 19 ก.ย. | ห้ามทำงานต่อเงียบ ๆ เมื่อขาด mapping_review | ✅ `mergeMappingReview` + `refs.mjs` + Decide node + เทสต์ |
| 22 | ~21–23 ก.ย. | (ไม่มีต้นฉบับ) รวมเป็น workflow เดียว | ❌ ถูกแทนด้วย DEC-30 |
| 23 | 23 ก.ย. | baseline/manifest ใช้รหัสรุ่นตามเล่ม | ✅ หลักการใช้ใน `data/manifest.json` |
| 24 | 23 ก.ย. | analysis toolkit + เครื่องมือวิจัย (สูญหาย) | ✅ สร้างใหม่ใน `analysis/` และ `docs/research_tools/` |
| 25 | 23 ก.ย. | ห้ามย้าย/เปลี่ยนชื่อไฟล์ Read-only บน Windows | ✅ กติกาถาวรใน `CLAUDE.md` |
| 26 | 23 ก.ย. | แก้ข้อสังเกต Master Data | ✅ หลักการ |
| 27 | 1 ต.ค. | สร้างโครงการใหม่จาก PDF + คลัง v1.3 | ✅ ด้านล่าง |
| 28 | — | D0 สถานะการสอบ | ✅ ปิดด้วย DEC-40 |
| 29 | 1 ต.ค. | D1 คลัง v1.5R | ✅ ผู้วิจัยเลือก · ⏳ รออาจารย์ยืนยัน |
| 30 | 1 ต.ค. | D2 5 workflow ตามเล่ม | ✅ สร้างแล้ว |
| 31 | 1 ต.ค. | D3 ชื่อรุ่นคลัง | ✅ |
| 32 | 1 ต.ค. | D4 เพิ่ม κ + PDPA ในเล่ม | ✅ แก้เล่มแล้ว · ⏳ รออาจารย์ยืนยัน |
| 33 | 1 ต.ค. | D5 เล่มเป็น Markdown + สคริปต์ | ✅ |
| 34 | 1 ต.ค. | เพิ่ม 4 คอลัมน์ที่เล่มระบุว่าต้องเพิ่มก่อนเก็บข้อมูลหลัก | ✅ |
| 35 | 1 ต.ค. | การเรียกโมเดลซ้ำและการเรียกโมเดลใน Code node | ✅ |
| 36 | 1 ต.ค. | แก้ข้อบกพร่องในเล่มที่ไม่ต้องตัดสินใจ | ✅ |
| 37 | 1 ต.ค. | รวม 5 workflow เป็นไฟล์เดียว `WF_Final_IS` (ชุด 5 ไฟล์ยังสร้างและตรวจคู่กัน) | ✅ สร้างแล้ว · ⏳ S6 ใน n8n · ⏳ ผลต่อเล่ม 3.4/ตาราง 3.9 รอตัดสิน |
| 38 | 1 ต.ค. | ย้ายชุด 5 workflow เดิมออกจาก `workflows/` ไป archive · `workflows/` เหลือ WF_Final_IS ไฟล์เดียว | ✅ |
| 39 | 1 ต.ค. | Demo รอบที่ 1 `demo/WF_Demo.json` (งานนอกเล่ม) | ✅ |
| 40 | 1 ต.ค. | D0 ยังไม่เคยสอบ ไม่มีข้อเสนอแนะกรรมการ (ปิด DEC-28) | ✅ ผู้วิจัยยืนยัน |
| 41 | 1 ต.ค. | D1 คลัง v1.5 ต้องครอบคลุม 600/600 ทั้งคลังและแผนจำลอง (ต่อจาก DEC-29) | ✅ ผู้วิจัยตัดสิน · ดำเนินการใน Phase 1 |
| 42 | 1 ต.ค. | D2 workflow เดียว `WF_IS68076026.json` ครอบคลุมทุกขั้น (แทน DEC-30, DEC-37) | ✅ ผู้วิจัยตัดสิน · ดำเนินการใน Phase 2 |
| 43 | 1 ต.ค. | D3 ชื่อรุ่นคลัง `CORPUS_IS68076026-v1.5-01OCT26` (แทนชื่อใน DEC-31) | ✅ |
| 44 | 1 ต.ค. | WF_Demo ไม่ใส่ในเล่ม (DEC-39 เป็นงานนอกเล่ม) · เขียนเล่มใหม่ทั้งหมดจาก fact sheet | ✅ |
| 45 | 1 ต.ค. | รายการพื้นฐาน DEC-18 map กับทุกอาชีพที่มีองค์ประกอบเดียวกัน | ✅ ใช้แล้ว · 👤 ผู้วิจัยยืนยัน |
| 46 | 1 ต.ค. | coverage track: รายการเรียนรู้ใหม่ 14 รายการใน `data/corpus_additions.csv` เข้าคลังเมื่อผู้วิจัยยืนยัน | ⏳ รอผู้วิจัยยืนยันทุกรายการ |
| 47 | 1 ต.ค. | วิธีเลือกรายการคง weighted_greedy (สมการ d_k) หลังเทียบ coverage_first และ ILP | ✅ |
| 48 | 1 ต.ค. | workflow ใช้งานจริง `WF_IS_68076026_01OCT26` (ต่อยอด DEC-42) หลังทดสอบใน n8n 2.39.9 จริงกับบริการจำลอง | ✅ ผ่านใน n8n จริง (บริการจำลอง) · ⏳ บัญชี Google/โมเดลจริง |
| 49 | (จอง) | temperature ของโมเดลที่ไม่รับค่า 0 (รอ smoke test T1 · Plan_03OCT26) | ⏳ |
| 50 | (จอง) | ผลทดสอบกับบริการจริง P1 (Plan_03OCT26) | ⏳ |
| 51 | 3 ต.ค. | R3 สองชั้น: R3a คำซ้ำแบบตัดคำต่อท้าย → R3b ให้โมเดลอื่นตรวจความหมาย (verifier_v1.0) · เสียงที่ตรวจไม่ได้ = unverified ไม่นับใน R1 | ✅ engine 2.0 · ⏳ ยืนยันกับโมเดลจริง (T1–T2) |
| 52 | 3 ต.ค. | R2 ซ่อม quote: ใช้ข้อความจริงจากเรซูเมเมื่อคำตรงกัน ≥ 90% | ✅ |
| 53 | 3 ต.ค. | prompt analyst_v1.1 (quote ≤ 2 ชิ้น ≤ 160 ตัวอักษร · evidence_type · ทักษะพื้นฐานจากกิจกรรม · งานหลัก) · เพดาน output 16,384 | ✅ · ⏳ smoke test |
| 54 | 3 ต.ค. | ฐานขั้นต่ำ R5 ใบรับรองในคลังที่พบในเรซูเม · R6 Essential Skill จากกิจกรรมที่เชื่อมกันตาม O*NET → อย่างน้อย partially | ✅ · 👤 อาจารย์ยืนยัน R6 |
| 55 | 3 ต.ค. | ดัชนีเฉพาะอาชีพ T (งาน Core 8 งาน) และ H (เทคโนโลยีที่ตลาดต้องการ) รายงานแยกจาก R | ✅ |
| 56 | 3 ต.ค. | แผนตามระดับผู้เรียน: ประสบการณ์ ≥ 5 ปี ไม่ใช้รายการ Beginner กับข้อ partially | ✅ |
| 57 | 3 ต.ค. | ชุดตรวจความตรงของคะแนน: Gold-R3 · known-group · style-invariance · stability · เกณฑ์ผ่าน | ✅ เครื่องมือ · ⏳ รันกับ Gemini จริง + ผู้ให้ป้ายคนที่ 2 |
| 58 | 3 ต.ค. | WF_Demo: engine.js ทั้งไฟล์ · วิเคราะห์ 3 รอบ + Gemini Verifier · ป้าย "ยังยืนยันไม่ได้" · ตัด "หลังเรียนจบ → 100" · Open Learner Model | ✅ |

---

## DEC-27 · สร้างโครงการใหม่จากเล่มฉบับขอสอบและคลัง v1.3 หลังไฟล์ Local สูญหาย

**วันที่** 1 ต.ค. 2569
**ปัญหา** 30 ก.ย. 2569 ไฟล์ `Final_IS/` เดิม (ถึง 23 ก.ย.) สูญหายทั้งหมด เหลือ (1) PDF ฉบับขอสอบ 112 หน้า 21 ก.ย. (2) โฟลเดอร์ 31 ส.ค.–9 ก.ย. ในเครื่อง (3) เอกสารใน Project "Research ITM" · เล่มเป็นสิ่งเดียวที่เคยเสนอต่อผู้อื่น
**การตัดสินใจ**
1. PDF ฉบับขอสอบเป็นสเปกของระบบใหม่ แก้เล่มเฉพาะเมื่อ (ก) ทำตามไม่ได้ (ข) ข้อมูลเปลี่ยนจริง (ค) ประเด็นที่กรรมการ/จริยธรรมน่าจะถาม และทุกการแก้มี DEC
2. สร้างทุกอย่างใหม่ด้วยสคริปต์ที่ทำซ้ำได้จากต้นทาง (`source/`) ไม่คัดลอกผลลัพธ์เก่า
3. ตัวเลขในเล่มเขียนเป็นตัวแปร `{{key}}` ที่คำนวณจากไฟล์จริงตอน build (`scripts/book_numbers.py`) เพื่อไม่ให้เล่มกับข้อมูลเลื่อนออกจากกัน
**ไฟล์** `docs/baseline/IS_68076026_ExamSubmission_21SEP26.pdf` sha256 `216d76be809dcf7ef68f1716303efd36744af73b2fb451d4131598bcc6099be6` · Data_Set.xlsx sha256 `665d149951f0f5c50f60f490045e685a4eb2ee5c7f22a178244d302ebbc475cd` · corpus_master_v13 `6bb7b6e2…2300` · item_competency_map_v13 `07a8a9ce…b8f`
**ผลต่อเล่ม** เล่มใหม่อยู่ที่ `book/*.md` · ฉบับถอดจาก PDF ที่ไม่แก้อยู่ที่ `book/baseline_21SEP26/` (ตรวจแล้วทุกย่อหน้าพบใน PDF)
**วิธีย้อนกลับ** ไม่มี (ต้นฉบับเดิมไม่เหลือ)

## DEC-28 · D0 สถานะการสอบ — รอคำตอบ
ถ้าสอบแล้วและกรรมการมีข้อเสนอแนะ ข้อเสนอแนะมาก่อนทุก DEC ด้านล่าง ให้บันทึกที่นี่พร้อมรายการแก้

## DEC-29 · D1 ใช้คลังรุ่น v1.5R สร้างซ้ำจาก v1.3
**วันที่** 1 ต.ค. 2569 · ผู้วิจัยเลือก ⏳ รออาจารย์ยืนยัน
**ปัญหา** เล่มใช้คลัง v1.4 (499 / 6,779 / L1 1,955 / 479 ข้อ) ซึ่งตัวจัดแผน 6 เดือนครอบคลุมได้ราว 396/600 ข้อแบบแย่ที่สุด รุ่น v1.5 (19 ก.ย.) แก้ได้แต่ไฟล์สูญหาย
**การตัดสินใจ** สร้างคลังใหม่ด้วย `scripts/build_corpus.py`: v1.3 → (ตรวจ URL ตาม `data/url_manual_check.csv`) → เพิ่ม foundation track ตาม DEC-18 (72 แถว / 103 L1) → promote 17 คู่ตาม DEC-19 (ระบุด้วย item_id) · รหัสรุ่น `CORPUS-IS68076026-v1.5R-01OCT26`
**ข้อเท็จจริงที่ต้องบันทึก**
1. **หนึ่งแถว mapping ที่ v1.4 ตัดออกจาก v1.3 ระบุไม่ได้** เพราะหลักฐานรอบ v1.4 สูญหาย จึงคงไว้ ทำให้ได้ 6,883 แถว / L1 2,076 (รุ่น 19 ก.ย. 6,882 / 2,075) · ไม่มีแถวซ้ำและทุกแถวผ่านกฎ C4/C5
2. **URL 36 รายการ (28 URL) ยังค้างตรวจ** ตรวจอัตโนมัติ 1 ต.ค. แล้วยืนยันไม่ได้ (403 กันบอท, หน้า JavaScript, 404 หนึ่งรายการ) จึงคงสถานะ `pending_verification` ตาม DEC-16 · ระบบไม่แนะนำรายการเหล่านี้จนผู้วิจัยตรวจด้วยตาและกรอก `researcher_result`
3. URL ของ foundation 6 รายการเปิดตรวจซ้ำ 1 ต.ค. ตรงชื่อ ผู้ให้บริการ และชั่วโมงตาม DEC-18 ทุกรายการ (F4 ใช้ `critical-thinking-skills-for-professionals` · F6 ใช้ `project-planning-google`)
**ไฟล์** `data/corpus.csv` · `data/mappings.csv` · `data/mapping_review.csv` · `data/corpus_change_log.csv` · `data/corpus_gap_request.csv` · `data/url_manual_check.csv` · `data/manifest.json`
**ตัวเลขปัจจุบัน** 571 รายการ (353/218) · 6,883 mapping · ผ่านตรวจ 1,942 (93.5% ของ L1) · ข้อกำหนดที่มีรายการรองรับ 598/600 → **599/600 หลังตรวจ URL ครบ** · แผน 6 เดือน 10 ชม./สัปดาห์ 489/600 (493 หลังตรวจ URL)
**ผลต่อเล่ม** 1.4 · ตาราง 3.1 · 3.3.2 (+ย่อหน้าประเภทรายการ) · ตาราง 3.6 · ตาราง 3.20 · 3.11 · ภาคผนวก ง · **ภาคผนวก ฉ ใหม่** — ตัวเลขทั้งหมดเป็นตัวแปรจาก `book/numbers.json`
**วิธีย้อนกลับ** `python scripts/build_data_all.py --corpus-version v1.4` แล้ว build เล่มใหม่ (ตัวเลขในเล่มเปลี่ยนตามอัตโนมัติ แต่ต้องลบย่อหน้าประเภทรายการใน 3.3.2 และภาคผนวก ฉ ด้วยมือ)

## DEC-30 · D2 ใช้ 5 workflow ตามเล่ม (แทนที่ DEC-22)
**การตัดสินใจ** สร้าง WF_Main_Intake 17 · WF_SUB_GapEngine 11 · WF_SUB_Decide 13 · WF_SUB_Deliver 13 · WF_Error 6 node ด้วย `scripts/build_workflows.mjs` · บั๊ก 11 ข้อของรุ่นเดิมเป็นเทสต์ (`tests/workflows.test.mjs` รัน Code node จริงใน sandbox + `scripts/validate_workflows.mjs`)
**ผลต่อเล่ม** ไม่มี (หัวข้อ 3.4 ใช้ได้) ยกเว้นตาราง 3.10 ที่อ้าง WF_SUB_Plan (DEC-36)
**ยังต้องทำ** S6 นำเข้า n8n 2.39.9 จริงและบันทึกผล (Setup Guide) เพราะ sandbox ไม่ใช่ n8n

## DEC-31 · D3 ชื่อรุ่น
ชุดข้อกำหนดคงเดิม `ONET31.0-IS68076026-v1.0` · คลังใช้ `CORPUS-IS68076026-v1.5R-01OCT26` (R = rebuilt) เพื่อแยกจากรุ่น 19 ก.ย. ที่สูญหายและมีตัวเลขต่างกัน 1 แถว · rules `RULES-IS68076026-v1.0` · prompt `analyst_v1.0` · ทั้งหมดถูกบันทึกในชุดข้อมูลรายงานทุกฉบับ (`freezeReport.versions`)

## DEC-32 · D4 เพิ่ม Cohen's κ และฐานกฎหมาย PDPA ในเล่ม
**การตัดสินใจ** 3.8.2 เพิ่ม κ ≥ 0.61 (Cohen [19], Landis & Koch [20]) · 3.10 เพิ่มย่อหน้า "ฐานทางกฎหมาย" อ้าง พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 [21] ม.19, 23, 28, 37(4) พร้อมระบุว่าต้องผ่านการพิจารณาของคณะกรรมการ · เอกสารอ้างอิงเพิ่ม [19]–[21]
**วิธีย้อนกลับ** ลบสองย่อหน้าและอ้างอิง [19]–[21] ใน `book/03_chapter3.md`, `book/04_references.md`

## DEC-33 · D5 เล่มเป็น Markdown + สคริปต์
`scripts/pdf_to_markdown.py` (ถอด) → `book/*.md` (ต้นฉบับ) → `scripts/book_numbers.py` + `scripts/build_book.py` (pandoc → docx: สมการ OMML, สารบัญเป็นฟิลด์, ZWSP ด้วย pythainlp, TH Sarabun New 16) · `scripts/check_book_vs_pdf.py` รายงานทุกจุดที่ต่างจากฉบับขอสอบ → `evidence/book_changes_vs_baseline.md`

## DEC-34 · เพิ่มคอลัมน์ที่เล่มระบุว่า "ต้องเพิ่มก่อนเก็บข้อมูลกลุ่มหลัก"
**ปัญหา** เล่ม 3.5.4, 3.11 และภาคผนวก ง ระบุสามจุดที่ยังขาด
**การตัดสินใจ** `ocr_results.masked_text_file_id` (เก็บข้อความหลังปิดบังเป็นไฟล์ใน Drive ส่วนตัว) · `findings.quote_text_version` (normalized / whitespace_collapsed) · `ground_truth.coder_1_status`, `coder_2_status` · จำนวนคอลัมน์ในตาราง 3.20 เปลี่ยนเป็น 9 / 13 / 12
**ไฟล์** `config/sheets.json` · `engine/engine.js` (`ruleR2.text_version`) · `workflows/src/main_prepare_text.js` · `analysis/coding_sheets.py`
**ผลต่อเล่ม** 3.5.4 · 3.11 · ตาราง 3.20 · ภาคผนวก ง

## DEC-35 · การเรียกโมเดลซ้ำทำใน Code node และบันทึกทุกครั้ง
**ปัญหา** เล่มกำหนดเรียกซ้ำ ≤ 2 ครั้งเมื่อ 429/หมดเวลา และบันทึกทุกครั้งใน model_calls · retry ของ HTTP node ใน n8n ไม่บันทึกรายครั้งและเรียกซ้ำทุกข้อผิดพลาด
**การตัดสินใจ** `engine.callModelWithRetry` เรียกซ้ำเฉพาะ 429 และหมดเวลา สูงสุด 2 ครั้งหลังครั้งแรก (รวม 3) บันทึกแถว model_calls ทุกครั้ง · Code node ใช้ `this.helpers.httpRequest` และอ่านรหัสรุ่น/คีย์จาก `$env` (ต้องตั้ง `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`) · temperature ส่งได้หรือไม่ส่งด้วย `send_temperature` ต่อโมเดล (รอ smoke test)
**ผลต่อเล่ม** ตาราง 3.10 แถว max_attempts/timeout_ms อธิบายให้ชัด (ค่าเดิม)

## DEC-36 · แก้ข้อบกพร่องในเล่มที่ไม่ต้องตัดสินใจ
1. "เขตข้อมูล" → "คอลัมน์" (JSON ใช้ "ฟิลด์") · "เรซูเม่" → "เรซูเม" ทั้งเล่ม (⏳ ยืนยันกับชื่อที่ลงทะเบียน)
2. ตาราง 3.10 อ้าง workflow `WF_SUB_Plan` ที่ไม่มี → WF_SUB_Decide / WF_Main_Intake · เพิ่มแถวชั้นความเชื่อมโยงที่กำหนดในโค้ด
3. ตาราง 3.1 สถานะเป็นปัจจุบัน (ไม่อ้าง "รายงานลงวันที่ 10 ก.ย.") · เพิ่มแถวทดสอบใน n8n และการยื่นจริยธรรม
4. 3.7 จำนวนทดสอบเป็นตัวแปร `{{tests_total}}` แทน "29"
5. ภาคผนวก ค ใช้ผลรันใหม่ (เรซูเมสังเคราะห์สร้างใหม่ทั้งหมด) และอธิบายข้อที่ไม่ตรงเฉลย
6. สารบัญสร้างจากหัวข้อจริง จึงมีภาคผนวก จ และ ฉ · "ค่ามัชฌิมมัธยฐาน" → "ค่ามัธยฐาน" · แยกเอกสารอ้างอิงเป็นรายการ
7. ตรวจรูป จ.7 แล้ว ถูกต้อง (R1 ตัดสิน R4 บันทึก) ข้อสังเกตเดิมว่าเขียน "สรุปสถานะด้วย R4" ไม่พบในรูปของ PDF ฉบับนี้

## DEC-37 · รวม 5 workflow เป็น workflow เดียว `WF_Final_IS` (ต่อจาก DEC-30)
**ปัญหา** ผู้วิจัยกังวลว่าการส่งข้อมูลข้าม workflow (Execute Workflow 3 จุด) จะผิดพลาด และการตั้งค่า 5 ไฟล์ (workflowId, error workflow, ลำดับนำเข้า, credential ต่อไฟล์) สับสน · ข้อสังเกตเพิ่มเติมจากการตรวจ: (ก) ถ้าโมเดลใช้ไม่ได้ทั้งสามตัว findings จะว่างและ WF_SUB_Decide หยุดก่อนอัปเดต runs (ข) ถ้า Upload PDF ล้มแต่ Send Email สำเร็จ Record Delivery ทำงานสองครั้ง
**การตัดสินใจ**
1. `scripts/build_workflows.mjs#buildFinal` สร้าง `workflows/WF_Final_IS.json` จากโหนดของ 5 workflow เดิม **ชุดเดียวกัน** (โค้ดใน Code node และ engine ฝังตรงทุกไบต์) · 59 node + sticky note 5 ช่วง (Intake · GapEngine · Decide · Deliver · Error)
2. ตัด Execute Workflow 3 โหนด และ "When Called by Main" 3 โหนด → แทนด้วย Code node `GapEngine Input` / `Decide Input` / `Deliver Input` ที่คืน `{ payload }` รูปเดิม (สัญญาข้อมูลไม่เปลี่ยน)
3. `Loop Over Runs` (Split in Batches v3, batch 1) แทน `mode=each` ของ Execute Workflow (บั๊ก B6): ทำทีละงาน วนกลับจาก `Update Run Delivered`
4. Error เป็นสาขาในไฟล์เดียวกัน (Error Trigger) ไม่ตั้ง `settings.errorWorkflow` — n8n ใช้ workflow ที่มี Error Trigger เป็น error workflow ของตัวเองโดยปริยาย · `error_classify.js` หา run_id จากรอบล่าสุดของ Loop Over Runs ก่อน (execution เดียวอาจมีหลายงาน) แล้วจึงใช้วิธีเดิม — ชุด 5 ไฟล์ไม่มีโหนดนี้จึงทำงานเหมือนเดิม
5. ปรับให้ปลอดภัยในลูป (เฉพาะ WF_Final_IS): Decide ส่งแถว findings เป็นสาขาข้าง (แก้ข้อ ก) · Upload PDF / Send Email ใช้ `continueRegularOutput` เข้า Merge แล้ว `Collect Delivery Result` → `Record Delivery` (แก้ข้อ ข) · Record Delivery ใช้ `final_deliver_record.js` ที่อ่านจาก `$input` เท่านั้น เพื่อไม่หยิบผลของงานก่อนหน้า · ลบไฟล์ชั่วคราวไม่ได้ = ส่งสำเร็จแต่บันทึก `temp_doc_delete_failed`
6. ตัวตรวจ `validateFinal` ตรวจเพิ่ม: ไม่มี Execute Workflow · ทุก `$('ชื่อโหนด')` มีจริง · โหนดเดิมพารามิเตอร์ตรงชุด 5 ไฟล์ยกเว้นที่ระบุ · ไม่อ้างผลของโหนดในลูปที่อาจไม่ได้ทำงานในรอบนี้ (ตรวจด้วย dominator) · ลูปวนกลับครบ · tests `tests/final_workflow.test.mjs` 5 กรณี (ผลกรณี A/B/C เท่ากับชุด 5 ไฟล์)
**ไฟล์** `scripts/build_workflows.mjs` · `scripts/validate_workflows.mjs` · `workflows/src/final_*.js` (5 ไฟล์ใหม่) · `workflows/src/error_classify.js` · `workflows/WF_Final_IS.json` · `workflows/WF_Error.json` (โค้ด Classify Error) · `workflows/manifest.json` (`single_workflow`) · `tests/final_workflow.test.mjs` · `docs/Setup_Guide.md`
**ผลต่อเล่ม** ⏳ รอตัดสิน: หัวข้อ 3.4 และตารางที่ 3.9 ระบุ "5 workflow" — ถ้าใช้ WF_Final_IS ให้แก้เป็น "workflow เดียว แบ่งเป็น 5 ส่วนตามหน้าที่" (ชื่อส่วนและหน้าที่เดิม) · ตาราง 3.10 ที่อ้างชื่อ workflow ใช้ชื่อส่วนได้ตามเดิม · จำนวนเทสต์ `{{tests_total}}` อัปเดตอัตโนมัติ (46 → 51)
**ข้อควรระวัง** นำเข้าเฉพาะ `WF_Final_IS.json` · ห้ามเปิดใช้งานพร้อมชุด 5 ไฟล์ (trigger สองตัวอ่านแถวเดียวกัน) · ถ้างานหนึ่งล้มกลางลูป งานที่เหลือใน execution เดียวกันจะไม่ถูกประมวลผล (เหมือนชุด 5 ไฟล์ที่ Main หยุดทั้ง execution) ต้องส่งใหม่
**วิธีย้อนกลับ** นำเข้าชุด 5 ไฟล์ตาม `import_order` ใน `workflows/manifest.json` (ยังสร้างและผ่านตัวตรวจทุกครั้ง) · ลบ `buildFinal` และ `validateFinal` ถ้าไม่ใช้แล้ว

## DEC-38 · ย้ายชุด 5 workflow เดิมออกจาก `workflows/` (ต่อจาก DEC-37)
**ปัญหา** `workflows/` มีทั้ง WF_Final_IS และชุด 5 ไฟล์ เสี่ยงเปิดหรือนำเข้าผิดไฟล์
**การตัดสินใจ** ย้าย `WF_Main_Intake/WF_SUB_GapEngine/WF_SUB_Decide/WF_SUB_Deliver/WF_Error.json` ไป `archive/01OCT26/workflows_5wf_DEC-30/` (บันทึก `archive/MOVE_LOG.csv` + README "ไม่ใช้งาน") · `build_workflows.mjs` เขียนเฉพาะ `WF_Final_IS.json` · ชุด 5 ไฟล์ยังสร้างในหน่วยความจำ (`loadWorkflows()` เรียก `buildAll()`) เพื่อให้เทสต์บั๊ก B1–B11 และการเทียบโหนดของ `validateFinal` ทำงานเหมือนเดิม · `validate_workflows.mjs` ไม่ผ่านถ้า `workflows/` มี workflow JSON อื่นนอกจาก WF_Final_IS · `manifest.json` เปลี่ยนเป็น `import` + `workflow` + `legacy_5wf` (sha ของชุดเดิมยังบันทึกไว้)
**ไฟล์** `scripts/build_workflows.mjs` · `scripts/validate_workflows.mjs` · `workflows/manifest.json` · `archive/01OCT26/workflows_5wf_DEC-30/` · `archive/MOVE_LOG.csv` · `docs/Setup_Guide.md` · `README.md`
**ผลต่อเล่ม** ไม่มีเพิ่มจาก DEC-37
**วิธีย้อนกลับ** `node scripts/build_workflows.mjs --legacy <โฟลเดอร์>` สร้างชุด 5 ไฟล์ล่าสุด (ตรวจแล้ว sha ตรงกับไฟล์ที่ย้าย) แล้วนำเข้าตาม `legacy_5wf.import_order`



## DEC-39 · Demo รอบที่ 1 สำหรับคณะกรรมการ `demo/WF_Demo.json` (1 ต.ค. 2569)
**ปัญหา** ต้องมีระบบที่โชว์ได้ทันทีบน n8n ในเครื่อง ตั้งแต่ฟอร์มถึงรายงาน โดยไม่ต้องตั้ง Google Sheets/Document AI/3 โมเดลแบบ `WF_Final_IS`
**การตัดสินใจ**
- workflow แยก `demo/WF_Demo.json` (28 โหนด) ไม่แตะ `workflows/` · หน้าเว็บเสิร์ฟจาก Webhook (`/webhook/is-demo`) · วิเคราะห์ที่ `/webhook/is-demo-analyze` · บันทึก PDF ที่ `/webhook/is-demo-save-pdf`
- 4 อาชีพ R07 R15 R19 R20 · ข้อมูลจริงแบบ hardcode จาก `Data_Set.xlsx` + `data/requirements.csv` + `data/corpus.csv` (verified) + mapping L1 ผ่านตรวจ → `demo/build_demo_data.py`
- Gemini โมเดลเดียว (ผู้วิจัยเลือก) ทำ OCR (เฉพาะไฟล์สแกน/รูป) + วิเคราะห์ด้วย prompt `analyst_v1.0` + ส่วนเสริม profile สำหรับแสดงผล · ตรวจ R0/R2/R3 ด้วยฟังก์ชันจาก `engine.js` ตรงทุกไบต์ · ไม่มี R1/R4 · ไม่ส่ง temperature (Gemini 3 แนะนำค่าเริ่มต้น)
- Gemini ล้ม → กฎสำรองจับคู่คำพ้อง (ติดป้ายบนรายงาน) · แผนใช้ตรรกะ `buildPlan` (สมการ 3.7–3.8)
- PDF ทำฝั่งเบราว์เซอร์ด้วย html-to-image + jsPDF เพราะ n8n 2.39 ใส่ CSP sandbox ทำให้ html2pdf/html2canvas ใช้ไม่ได้ · ส่งขึ้น Drive ผ่าน webhook (ผู้วิจัยเลือก)
**ไฟล์ที่กระทบ** `demo/` เท่านั้น (ไม่เปลี่ยน engine/data/workflows/เล่ม)
**ผลต่อเล่ม** ไม่มี (เป็นเครื่องมือสาธิต) · ถ้าจะอ้างในเล่มต้องระบุว่าเป็นรุ่นสาธิตโมเดลเดียว
**ย้อนกลับ** ลบโฟลเดอร์ `demo/` หรือ unpublish workflow ใน n8n


## DEC-40 · D0 ยังไม่เคยสอบ (ปิด DEC-28)
**วันที่** 1 ต.ค. 2569 · ผู้วิจัยยืนยัน
**ปัญหา** DEC-28 ค้างคำถามว่าสอบแล้วหรือยัง ถ้าสอบแล้วต้องจัดลำดับงานตามข้อเสนอแนะของกรรมการ
**การตัดสินใจ** ยังไม่เคยสอบ ไม่มีข้อเสนอแนะจากกรรมการ · เล่มฉบับขอสอบ 21 ก.ย. ยังไม่เคยนำเสนอ จึงเขียนเล่มใหม่ทั้งหมดได้โดยไม่ต้องรักษาถ้อยคำ โครง หรือเลขหัวข้อเดิม
**ไฟล์ที่กระทบ** `docs/DECISIONS.md` · `NEXT_STEPS.md` (ข้อ 8)
**ผลต่อเล่ม** เล่มเขียนใหม่ทั้งเล่มตาม `Prompt_Report.md` v2.0 (ดู DEC-44) · ไม่มีส่วน "การแก้ไขตามข้อเสนอแนะ"
**วิธีย้อนกลับ** ถ้าภายหลังมีข้อเสนอแนะ ให้เพิ่ม DEC ใหม่ที่อ้าง DEC-40 และจัดลำดับแก้ตามข้อเสนอแนะ

## DEC-41 · D1 คลัง v1.5 ต้องครอบคลุม 600/600 (ต่อจาก DEC-29)
**วันที่** 1 ต.ค. 2569 · ผู้วิจัยตัดสิน
**ปัญหา** คลัง v1.5R (DEC-29) ครอบคลุม 598/600 ข้อ (599 หลังตรวจ URL) และแผนจำลอง 6 เดือน 10 ชม./สัปดาห์ครอบคลุม 489/600 ทำให้ผู้เรียนบางอาชีพได้แผนที่ขาดข้อกำหนดแม้มีเวลาพอ
**การตัดสินใจ** ใช้คลังรุ่น v1.5 และกำหนดเป้า **600/600** สองตัวชี้วัด
1. ความครอบคลุมของคลัง = จำนวนข้อกำหนดที่มีรายการรองรับ ≥ 1 รายการ (L1 · ผ่าน C1–C5 · URL ผ่านการตรวจ)
2. ความครอบคลุมของแผนจำลอง = ผลรวม 20 อาชีพ ของข้อกำหนดที่แผนครอบคลุมในกรณีเลวร้ายที่สุด (ขาดทั้ง 30 ข้อ) ที่ 6 เดือน 10 ชม./สัปดาห์ แบบ both
ห้ามนับ L2 หรือรายการ `pending_verification` (DEC-11, DEC-16, DEC-21) · ตัวชี้วัดรอง (5/15/20 ชม., 12/18/24 เดือน, course_only, certification_only) รายงานตามจริง
**ไฟล์ที่กระทบ** `scripts/build_corpus.py` · `scripts/coverage_diagnostics.py` (ใหม่) · `scripts/simulate_coverage.mjs` · `engine/engine.js` (ถ้าเปลี่ยนวิธีเลือก มี DEC แยก) · `data/corpus_change_log.csv` · `data/corpus_gap_request.csv` · `evidence/coverage_600_<วันที่>.md`
**ผลต่อเล่ม** หัวข้อข้อมูลอ้างอิงในบทที่ 3 นิยามสองตัวชี้วัดและรายงานค่าจาก `book/numbers.json`
**วิธีย้อนกลับ** ใช้เป้าเดิมของ DEC-29 (รายงานตามจริง ไม่บังคับ 600)

## DEC-42 · D2 workflow เดียว `WF_IS68076026.json` (แทน DEC-30, DEC-37)
**วันที่** 1 ต.ค. 2569 · ผู้วิจัยตัดสิน
**ปัญหา** ชุด 5 workflow (DEC-30) ส่งข้อมูลข้ามไฟล์และตั้งค่ายาก · `WF_Final_IS` (DEC-37) รวมไฟล์แล้วแต่ยังจัดโหนดตามชุดเดิม อ่านยาก และไม่ได้ออกแบบให้ครอบคลุมทุกขั้นของงานวิจัยในที่เดียว
**การตัดสินใจ** สร้าง `workflows/WF_IS68076026.json` ไฟล์เดียว จัดแบบ WF_Demo (อ่านซ้ายไปขวา แบ่งช่วงด้วย sticky note 7 ช่วง ตั้งชื่อโหนดเป็นกริยา + กรรม) ใช้ n8n 2.39.9 · ฝังฟังก์ชันจาก `engine.js` ตรงทุกไบต์ · อ่านค่าควบคุมจาก `config/` เท่านั้น · สร้างด้วย `scripts/build_workflows.mjs` · ย้าย `WF_Final_IS.json` ไป archive
**ไฟล์ที่กระทบ** `scripts/build_workflows.mjs` · `scripts/validate_workflows.mjs` · `workflows/` · `tests/` · `evidence/WF_analysis.md` · `docs/Setup_Guide.md`
**ผลต่อเล่ม** บทที่ 3 อธิบายระบบเป็น workflow เดียว จำนวนโหนดและชื่อช่วงอ่านจาก `workflows/manifest.json`
**วิธีย้อนกลับ** นำ `WF_Final_IS.json` จาก archive กลับมาใช้ตาม DEC-37

## DEC-43 · D3 ชื่อรุ่นคลัง (แทนชื่อใน DEC-31)
**วันที่** 1 ต.ค. 2569
**การตัดสินใจ** รหัสรุ่นคลังเป็น `CORPUS_IS68076026-v1.5-01OCT26` (ขีดล่างหลัง CORPUS · ไม่มี R) ใช้ตัวสะกดนี้ตรงทุกตัวอักษรในสคริปต์ manifest config engine sheets_import และเล่ม · ชื่อรุ่นอื่นคงเดิม: `ONET31.0-IS68076026-v1.0` · `RULES-IS68076026-v1.0` · `analyst_v1.0`
**ผลต่อเล่ม** ทะเบียนรุ่นข้อมูลในภาคผนวก
**วิธีย้อนกลับ** เปลี่ยนค่าคงที่ใน `scripts/build_corpus.py` กลับเป็น `CORPUS-IS68076026-v1.5R-01OCT26` แล้วรัน `build_data_all.py`

## DEC-44 · เขียนเล่มใหม่ทั้งหมด และไม่ใส่ WF_Demo ในเล่ม
**วันที่** 1 ต.ค. 2569 · ผู้วิจัยตัดสิน (ยืนยัน DEC-32 κ/PDPA และ DEC-36 ข้อ 1 "เรซูเม")
**ปัญหา** เล่มเดิมถอดจาก PDF ฉบับขอสอบแล้วแก้ทีละจุด อ่านยาก และยังอธิบายระบบแบบ 5 workflow
**การตัดสินใจ** (1) ย้ายร่างเดิม `book/*.md`, `book/figures/`, `build/*.docx` ไป `archive/01OCT26/book_draft_v0/` (2) สกัดข้อเท็จจริงเป็น `book/00_fact_sheet.md` แล้วเขียนเล่มจากไฟล์นี้ + `book/numbers.json` + workflow จริงเท่านั้น (3) ใช้ Source Trace (`evidence/Source_Trace.md`) แทน Change Log (4) ตรวจความซ้ำกับเล่มเดิมด้วย `scripts/check_overlap.py` (5) WF_Demo (DEC-39) เป็นงานนอกเล่ม ไม่กล่าวถึงในเล่ม
**ไฟล์ที่กระทบ** `book/` · `archive/01OCT26/book_draft_v0/` · `scripts/build_book.py` · `scripts/check_docx_format.py` · `scripts/check_overlap.py` · `evidence/`
**ผลต่อเล่ม** ทั้งเล่ม
**วิธีย้อนกลับ** คัดลอก `archive/01OCT26/book_draft_v0/*.md` กลับไป `book/`

## DEC-45 · รายการพื้นฐาน (DEC-18) ใช้กับทุกอาชีพที่มีองค์ประกอบเดียวกัน
**วันที่** 1 ต.ค. 2569 · Claude เสนอและใช้ใน build · 👤 ผู้วิจัยยืนยันการตีความ
**ปัญหา** DEC-18 map รายการพื้นฐาน 6 รายการ (URL ตรวจแล้ว ชั่วโมง 6–21) เฉพาะข้อที่ตอนนั้นยังไม่มี L1 อาชีพอื่นที่มีองค์ประกอบเดียวกันจึงเหลือแต่ใบรับรองยาว 40–300 ชม. ทำให้ ILP พบว่าไม่มีอาชีพใดครอบคลุม 30 ข้อได้ภายใน Hmax 259.8 ชม.
**การตัดสินใจ** ใช้รายการองค์ประกอบของแต่ละรายการตาม DEC-18 เดิม แต่ map กับทุกอาชีพที่มีองค์ประกอบนั้นในชุด 30 ข้อ (ชั้น L1 · mapping_method foundation_track) · บันทึกแถวที่เพิ่มเป็น `foundation_L1_extended` ใน `data/corpus_change_log.csv`
**ผล** คลัง 571 → 602 รายการ · L1 เพิ่ม 129 แถว · แผนจำลอง 6 เดือน 10 ชม. 489 → 538/600 · ความครอบคลุมของคลังคง 598
**ไฟล์ที่กระทบ** `scripts/build_corpus.py` · `data/corpus.csv` · `data/mappings.csv` · `data/mapping_review.csv` · `data/corpus_change_log.csv` · `data/manifest.json` · `sheets_import/`
**ผลต่อเล่ม** ตัวเลขคลังและความครอบคลุมเปลี่ยนตาม `book/numbers.json`
**วิธีย้อนกลับ** `python scripts/build_data_all.py` โดยแก้ขั้น build_corpus ให้ใส่ `--foundation-uncovered-only`

## DEC-46 · coverage track: รายการเรียนรู้ใหม่ที่สั้นและครอบคลุมหลายข้อ
**วันที่** 1 ต.ค. 2569 · ⏳ รอผู้วิจัยยืนยันทุกรายการ (DEC-16)
**ปัญหา** หลัง DEC-45 ยังขาด 2 ข้อในคลัง และแผนจำลองขาด 62 ข้อ · ILP ระบุว่าสาเหตุหลักคือชั่วโมงไม่พอ (43 ข้อ) ไม่ใช่ลำดับการเลือก (17 ข้อ)
**การตัดสินใจ** Claude เปิดหน้าเว็บจริงด้วยเบราว์เซอร์ 1 ต.ค. 2569 แล้วเสนอ 14 หลักสูตร (Coursera · ผู้ให้บริการ Google, IBM, Duke, Michigan, UC Irvine, UVA, Imperial, Board Infinity, Coursera) ชั่วโมง 2–23 (ใช้ค่าที่มากกว่าระหว่างชั่วโมงที่หน้าเว็บระบุกับผลรวมโมดูล) ลงใน `data/corpus_additions.csv` พร้อมองค์ประกอบ O*NET ที่สอน · `build_corpus.py` นำเข้าคลังเฉพาะแถวที่ผู้วิจัยกรอก `researcher_result` = LIVE · แถวที่ยังไม่ยืนยันไม่เข้าคลังเลย จึงไม่กระทบเกณฑ์ 90% ของ DEC-21
**ผล (จำลอง ไม่ใช่ผล)** ถ้ายืนยันครบ: คลัง 600/600 · แผนจำลอง 600/600 · ILP ทุกอาชีพอยู่ใน Hmax (166–236 ชม.) · ปิด REQ-R14-4.A.3.b.5 ด้วย Technical Support Fundamentals แทน `--close-r14-repair`
**ไฟล์ที่กระทบ** `data/corpus_additions.csv` (ใหม่ · ผู้วิจัยแก้ได้ด้วยโปรแกรมแก้ข้อความ) · `scripts/build_corpus.py` · `data/corpus_gap_request.csv` (คอลัมน์ proposed_items) · `scripts/simulate_coverage.mjs --what-if` · `scripts/coverage_diagnostics.py` · `evidence/coverage_600_01OCT26.md`
**ผลต่อเล่ม** เล่มรายงานค่าที่นับได้จริงจาก numbers.json และประโยค `{{cov_status_note}}` ที่หายเองเมื่อถึง 600
**วิธีย้อนกลับ** ลบแถวใน `data/corpus_additions.csv` หรือใส่ `--no-additions`

## DEC-47 · วิธีเลือกรายการเรียนรู้คงสมการ d_k (weighted_greedy)
**วันที่** 1 ต.ค. 2569
**ปัญหา** Prompt_Report ข้อ 1.4(1) ให้เทียบ coverage-first greedy กับ ILP สำหรับอาชีพที่แผนไม่ครบทั้งที่ ILP ทำได้
**การตัดสินใจ** เพิ่มตัวเลือก `strategy` ใน `engine.buildPlan` (weighted_greedy · coverage_first) และ ILP ใน `scripts/coverage_diagnostics.py` เป็นตัวเทียบ · ผล 6 เดือน 10 ชม.: ข้อมูลปัจจุบัน 538 / 539 / ILP 549 · ถ้ายืนยันรายการใหม่ 600 / 600 / 600 · ต่างกันไม่เกิน 1 ข้อระหว่างสองวิธี greedy และ ILP ทำใน Code node ไม่ได้ จึงคง weighted_greedy (`config/project.json` plan_strategy) ตามสมการเดิม
**ไฟล์ที่กระทบ** `engine/engine.js` (strategy, c_k) · `config/project.json` · `scripts/simulate_coverage.mjs`
**ผลต่อเล่ม** หัวข้อการจัดแผนอธิบายผลการเทียบหนึ่งย่อหน้า
**วิธีย้อนกลับ** ตั้ง plan_strategy = coverage_first

### DEC-42 (บันทึกผลการดำเนินการ 1 ต.ค. 2569)
- `workflows/WF_IS68076026.json` 63 โหนด + sticky note 7 แผ่น (ช่วง 10/8/11/6/8/14/6) สร้างด้วย `buildSingle` · `WF_Final_IS.json` ย้ายไป `archive/01OCT26/WF_Final_IS_DEC-37/`
- ต่างจาก WF_Final_IS: (1) อ่านชั้นข้อความ PDF ก่อน (Extract From File · `config/project.json` text_layer_min_chars = 200) แล้วจึง Document AI → OCR ในเครื่อง (2) แยก Decide & Plan เป็น Apply Rules R0-R4 กับ Build Learning Plan (`engine.planRowsFrom` · engine 1.1.0) (3) อัปโหลด PDF ล้มแต่อีเมลสำเร็จ = delivered + error_code pdf_upload_failed (4) ตัวตรวจ `validateSingle` ตรวจชื่อโหนด กริยา + กรรม · 7 ช่วง · CFG ตรง config/ · dominator ของลูป (5) traceability `evidence/WF_analysis.md` ตรวจด้วย `scripts/check_traceability.mjs`
- เทสต์ใหม่ `tests/single_workflow.test.mjs` 9 กรณี + plan_strategy 1 กรณี → รวม 61/61 · ⏳ ทดสอบใน n8n จริง (`evidence/n8n_test_01OCT26.md`)
- รูปสำหรับเล่มจาก workflow จริง: `scripts/make_figures.py` (TH Sarabun New จาก `assets/fonts/`)


## DEC-48 · workflow ใช้งานจริง `WF_IS_68076026_01OCT26` (ต่อยอด DEC-42)
**วันที่** 1 ต.ค. 2569 · ผู้วิจัยสั่ง ("รวม 5 workflow เป็น 1 ที่ใช้งานจริง ชื่อ WF_IS_68076026_01OCT26 อ้างอิงเล่ม IS_68076026_Final_01OCT26") และเลือกแนวทาง "ต่อยอดเป็นรุ่นใช้งานจริง + ทดสอบใน n8n 2.39.9 บนคลาวด์กับบริการจำลอง"
**ปัญหา** WF_IS68076026 (DEC-42) รวม 5 workflow แล้วและตรงเล่มบท 3.3 แต่ไม่เคยรันใน n8n จริง (เล่ม 3.6.3 และ `evidence/n8n_test_01OCT26.md` ยัง ⏳) · เทสต์ใน sandbox รันโค้ดของโหนดแต่ไม่ได้รันกลไกของ n8n
**การตัดสินใจ**
1. ติดตั้ง n8n 2.39.9 บน Node 24 แล้วรัน workflow จริงกับบริการจำลองของ Google/OpenAI/Anthropic/Gemini (`evidence/n8n_s6/`) · ผลใน `evidence/n8n_test_01OCT26.md` และ `evidence/n8n_test_summary.json`
2. แก้จุดที่พบ (ไม่แตะ engine.js · ตรรกะการวิจัยเดิม):
   - Call Model A/B/C → `workflows/src/single_call_model.js`: task runner ของ n8n 2.x ส่ง error ของ `this.helpers.httpRequest` ข้าม RPC โดยไม่มีรหัส HTTP ทำให้ 429 ไม่ถูกเรียกซ้ำ → ใช้ returnFullResponse + ignoreHttpStatusErrors สร้าง error ที่มี httpCode เอง · จับเวลาด้วย Promise.race · รอก่อนเรียกซ้ำตาม `config/models.json defaults.retry_backoff_ms` = [5000, 15000] หรือ Retry-After (≤ 30 วินาที)
   - Choose Text Source ตรวจ `numpages` ของ Extract From File (PDF แบบ object stream นับหน้าด้วย regex ไม่ได้)
   - Run Local OCR = continueRegularOutput → `ocr_failed` พร้อม run_id
   - Google Sheets append ทุกโหนดใช้ `useAppend` (values:append) · env `N8N_CONCURRENCY_PRODUCTION_LIMIT=1`
   - ช่วง 6 เพิ่ม Is Delivery Failed? → Notify Delivery Failure (ส่งไม่สำเร็จไม่ใช่ error ของ n8n จึงไม่มีใครรู้)
   - ช่วง 7 `single_error_classify.js` + Is Run Known? + Is Alert Due? + Build Aborted Rows + Record Aborted Requests: งานที่ยังไม่ได้เริ่มในรอบที่ล้มบันทึก failed/batch_aborted · trigger ล้ม (ไม่มีงาน) ไม่เขียนแถว runs ปลอมและแจ้งไม่เกินชั่วโมงละครั้ง
3. ชื่อ workflow/ไฟล์ `WF_IS_68076026_01OCT26` · ใช้ id เดิม `is68Single000001` เพื่อให้นำเข้าแทนที่รุ่น DEC-42 ใน n8n (กัน trigger สองตัว) · 69 โหนด + sticky note 7 แผ่น (ช่วง 10/8/11/6/8/16/10) · ย้าย `WF_IS68076026.json` ไป `archive/01OCT26/WF_IS68076026_DEC-42/`
**ไฟล์ที่กระทบ** `scripts/build_workflows.mjs` · `scripts/validate_workflows.mjs` (EXPECTED 69 + กฎ DEC-48) · `workflows/src/single_call_model.js` `single_choose_text.js` `single_error_classify.js` `single_aborted_rows.js` `single_deliver_record.js` `single_build_plan.js` (ชื่อ actor) · `config/models.json` (retry_backoff_ms) · `config/env_template.env` · `tests/single_workflow.test.mjs` (+4 เทสต์ · mock เป็น response เต็มแบบ n8n) · `scripts/book_numbers.py` `make_figures.py` `check_traceability.mjs` `source_trace.py` (อ่านชื่อไฟล์จาก manifest) · `evidence/WF_analysis.md` · `evidence/n8n_test_01OCT26.md` · `evidence/n8n_test_summary.json` · `evidence/n8n_s6/` · `docs/Setup_Guide.md` · `book/03_chapter3.md` · `book/00_fact_sheet.md`
**ผลต่อเล่ม** {{wf_name}} {{wf_nodes}} {{wf_s6_nodes}} {{wf_s7_nodes}} {{tests_total}} อัปเดตเอง · ตาราง 3.1 แยกแถว "ทดสอบใน n8n กับบริการจำลอง" (ทำแล้ว) กับ "เชื่อมบริการจริง" (ยังไม่ทำ) · 3.3.2 ช่วง 6 แจ้งผู้วิจัยเมื่อส่งไม่สำเร็จ · ช่วง 7 batch_aborted · 3.3.5 เวลารอก่อนเรียกซ้ำ {{retry_backoff_text}} · ตาราง 3.9 แถว retry_backoff_ms · 3.6.3 แทน ⏳ ด้วยผล {{n8n_pass}}/{{n8n_cases}} กรณี
**หมายเหตุ** config/models.json เปลี่ยน จึง sha ของชุด 5 ไฟล์/WF_Final_IS ที่สร้างในหน่วยความจำต่างจากไฟล์ใน archive (ไม่กระทบการใช้งาน)
**วิธีย้อนกลับ** นำ `archive/01OCT26/WF_IS68076026_DEC-42/WF_IS68076026.json` กลับไป `workflows/` · `git revert` commit ของ DEC-48 · ลบ retry_backoff_ms ใน config/models.json แล้ว build ใหม่


## DEC-51 · R3 สองชั้น: คำซ้ำ (R3a) แล้วจึงให้โมเดลอื่นตรวจความหมาย (R3b)
**วันที่** 3 ต.ค. 2569 · ผู้วิจัยสั่ง ("ดำเนินการแก้ไขจาก Gap ที่พบให้สมบูรณ์ที่สุด · ยังไม่เคยส่งเล่ม แก้ได้เหมือนเริ่มใหม่")
**ปัญหา** (`docs/Gap_03OCT26.md`) ทดลอง WF_Demo กับเรซูเมจริงของผู้วิจัย (ผู้จัดการโครงการไอที 8 ปี) ได้ R19 = 10 และ R15 = 11 · R3 แบบ lexical overlap ตัด 27 จาก 36 ข้อสรุปที่ผ่าน R2 ทั้งที่ราว 23 ข้อเป็นหลักฐานจริง (recall 0.24 บนป้ายเบื้องต้น) · เรซูเมจริงเขียนแบบเน้นผลงาน คำไม่ตรงคำอธิบาย O*NET · θ = 0.15 ปรับจากเรซูเมสังเคราะห์ที่เขียนด้วยคำของ O*NET (วงจรปิด) · ทดลองเพิ่มคำพ้อง/ตัดคำต่อท้าย/ปรับ θ แล้ว recall เกิน 0.6 ไม่ได้โดยไม่ให้คู่ที่ไม่เกี่ยวผ่าน ≥ 22%
**การตัดสินใจ**
1. R3a = สมการ 3.2 เดิมแต่ตัดคำต่อท้ายทั้งสองฝั่ง (`engine.stem`) และคำพ้องตรงได้แบบรากคำ (`r3_stemming = true`) · θ = 0.15 · เพดาน 25 คงเดิม
2. ข้อความที่ผ่าน R2 แต่ไม่ผ่าน R3a ส่งให้โมเดลอื่นตรวจ (`prompts/verifier_v1.0.txt` · หมุนเวียน A→B · B→C · C→A · ถ้าผู้ตรวจล้มตอนวิเคราะห์ใช้โมเดลที่เหลือ · ห้ามตรวจตัวเองในระบบเต็ม) · ผู้ตรวจเห็นเฉพาะข้อความที่ยกมาและข้อกำหนด ไม่เห็นเรซูเมทั้งฉบับ
3. คำตัดสิน supports = คงสถานะ · partially_supports = ลดเป็น partially · unrelated = missing (นับใน U) · ไม่มีคำตอบที่ถูกต้อง = เสียง **unverified** ไม่นับใน R1 (ข้อนั้นอาจเป็น abstained) และไม่นับเป็น hallucination
4. `r3_mode = lexical` ใช้เป็นเงื่อนไขเปรียบเทียบ (ablation) · `scores.ablation` รายงาน R ภายใต้ R3 คำซ้ำอย่างเดียว / ไม่มี R3 / ไม่มีฐานขั้นต่ำ จากการเรียกโมเดลชุดเดียวกัน
5. workflow: ช่วง 4 เพิ่ม Prepare Relevance Checks → Call Verifier A/B/C → Wait for All Verifiers → Collect Verifier Results (+ Build Verifier Call Rows → Record Verifier Calls · `model_calls.call_purpose`) · Apply Rules R0-R4 → **Apply Rules R0-R6** · 69 → 79 โหนด
**หลักฐาน** กรณีสังเคราะห์ D (R19 เรซูมแบบเน้นผลงาน): R = 88.14 · ถ้า R3 คำซ้ำอย่างเดียว 31.48 · Gold-R3 สังเคราะห์ 82 คู่ (ผู้ตรวจจำลองจากเฉลย · ไม่ใช่ผลของโมเดลจริง) recall 0.72 → 0.97 · ข้อสรุปจริง 36 ข้อ R3a ตัดคำต่อท้าย recall 0.24 → 0.33 (ส่วนที่เหลือต้องพึ่ง R3b)
**ไฟล์ที่กระทบ** `engine/engine.js` (2.0.0) · `prompts/verifier_v1.0.txt` + schema · `config/project.json` · `config/models.json` · `config/sheets.json` · `scripts/build_workflows.mjs` · `scripts/validate_workflows.mjs` · `workflows/src/single_prepare_checks.js` `single_call_verifier.js` `single_verifier_rows.js` `single_collect_verifiers.js` `single_apply_rules.js` `single_task_rows.js` `single_build_plan.js` · `scripts/run_local.mjs` · `tests/*`
**ผลต่อเล่ม** 3.3.2 ช่วง 4 · 3.4.4 (R3 สองชั้น · สมการ 3.2 ใช้กับ R3a) · ตาราง 3.10/3.12 · รูป 3.6 · 3.8 เงื่อนไขเปรียบเทียบ · 3.11 ข้อจำกัด (ผู้ตรวจเป็น LLM)
**วิธีย้อนกลับ** `r3_mode = lexical` และ `r3_stemming = false` ใน config/project.json แล้ว build ใหม่ (ได้พฤติกรรม engine 1.1 ยกเว้นการซ่อม quote)

## DEC-52 · R2 ซ่อม quote ที่โมเดลเปลี่ยนรูปคำ
**วันที่** 3 ต.ค. 2569
**ปัญหา** โมเดลเปลี่ยน "directing cross-functional teams…" เป็น "Directed cross-functional teams…" R2 จึงตัดหลักฐานจริงทั้งข้อ
**การตัดสินใจ** ถ้าไม่พบแบบตรงตัวและแบบยุบช่องว่าง ให้หาช่วงในเรซูเมที่คำ (หลังตัดคำต่อท้าย) ตรงกับ quote ด้วย LCS ≥ 0.90 (`r2_repair_min_similarity`) และ quote ยาว ≥ 5 คำ (`r2_repair_min_tokens`) · **ใช้ข้อความจริงจากเรซูเมแทน quote ของโมเดล** (`quote_text_version = repaired` · flag `R2_repaired`) ข้อความในรายงานจึงตรงกับเรซูเมเสมอ · ข้อความที่ไม่มีจริงยังไม่ผ่าน
**ไฟล์ที่กระทบ** `engine/engine.js` (`repairQuote`, `ruleR2`) · `config/project.json` · `tests/rules_v2.test.mjs`
**ผลต่อเล่ม** 3.4.4 ย่อหน้า R2 · ตาราง 3.10
**วิธีย้อนกลับ** `r2_repair_min_similarity = 0`

## DEC-53 · prompt analyst_v1.1 และเพดาน output
**วันที่** 3 ต.ค. 2569
**ปัญหา** prompt v1.0 ขอ quote 20–300 ตัวอักษร (ยาวยิ่งตกสมการ 3.2) · ข้อ 2 ทำให้โมเดลไม่ให้ทักษะพื้นฐานจากกิจกรรมที่บรรยายไว้ (Essential Skills ได้ 0% ทุกคน) · quote ได้ชิ้นเดียว · ผลไม่คงที่ (Coordination ได้ evidenced ในรอบหนึ่ง missing ในอีกรอบ)
**การตัดสินใจ** `prompts/analyst_v1.1.txt`: quote 1–2 ชิ้น ยาว 20–160 ตัวอักษร เลือกช่วงที่สั้นที่สุด · ห้ามเปลี่ยนรูปกริยา · อนุญาตให้ใช้กิจกรรม/ผลลัพธ์/เครื่องมือ/คอร์ส/ใบรับรอง/วุฒิเป็นหลักฐาน รวมทักษะพื้นฐาน (ยังห้ามอนุมานจากชื่อตำแหน่ง ชื่อหน่วยงาน หรือจำนวนปี) · `evidence_type` · `task_assessments` สำหรับงานหลัก (DEC-55) · R0 รับ analyst_v1.0 ได้ (ย้อนกลับ) · เพดาน output 16,384 (token การคิดของโมเดลรุ่นใหม่นับรวม) · ผู้ตรวจ 4,096 · structured output (responseSchema) เลื่อนไปทดสอบใน T1
**ไฟล์ที่กระทบ** `prompts/analyst_v1.1.txt` + schema · `config/project.json` prompt_version · `config/models.json` · `engine.buildPrompt` · `scripts/make_synthetic_cases.py` (ผลจำลองเป็น v1.1)
**ผลต่อเล่ม** 3.4.2–3.4.3 · ภาคผนวก prompt · ตาราง 3.7/3.10 (เพดาน)
**วิธีย้อนกลับ** prompt_version = analyst_v1.0 · max_output_tokens = 4096

## DEC-54 · ฐานขั้นต่ำจากหลักฐานที่โปรแกรมตรวจได้เอง (R5 · R6)
**วันที่** 3 ต.ค. 2569 · 👤 ให้อาจารย์ยืนยัน R6 (เป็นการอนุมานจากความเชื่อมโยงของ O*NET ไม่ใช่ข้อความ)
**ปัญหา** ใบรับรอง 6 ใบที่ตรวจพบไม่ถูกนับเป็นหลักฐาน · Essential Skills แทบไม่เคยเขียนตรง ๆ ในเรซูเม
**การตัดสินใจ** หลัง R1 สำหรับข้อที่ยัง missing/abstained (ไม่ใช้เมื่อหยุดสรุปทั้งฉบับ):
- **R5** ใบรับรองในคลัง (mapping L1 ที่ผ่านตรวจของอาชีพนั้น) ที่ชื่อ/รหัสสอบ/ตัวย่อปรากฏแบบทั้งคำในเรซูเม และบรรทัดนั้นไม่ใช่ "เตรียมสอบ/กำลังเรียน" → ข้อกำหนดที่ mapping ระบุได้ `partially` · หลักฐาน = บรรทัดนั้น (`evidence_source = credential`)
- **R6** Essential Skill ที่ O*NET (F13) เชื่อมกับกิจกรรมการทำงานซึ่งอยู่ใน 30 ข้อของอาชีพเดียวกันและได้ `evidenced` จากโมเดล → `partially` · หลักฐาน = ข้อความของกิจกรรมนั้น (`evidence_source = linkage`)
- ห้ามยกขึ้นเป็น evidenced · รายงานจำนวนแยก (`n_floor_credential`, `n_floor_linkage`) · run_local รายงานความถูกต้องแบบไม่นับข้อที่อนุมาน (accuracy_direct)
**ไฟล์ที่กระทบ** `scripts/build_role_signals.py` → `data/skill_links.csv` · `engine` (`credentialEvidence`, `applyFloors`) · `config/project.json evidence_floors` · `config/sheets.json` (`decisions.evidence_source` · `ref_corpus` + level, exam_code) · workflow โหลดคลังก่อน Apply Rules
**ผลต่อเล่ม** 3.4.4–3.4.5 (กฎ R5 R6) · ตาราง 3.12 · 3.11
**วิธีย้อนกลับ** `evidence_floors.credential = false` / `linkage = false`

## DEC-55 · ดัชนีเฉพาะอาชีพ T และ H
**วันที่** 3 ต.ค. 2569
**ปัญหา** ข้อกำหนด 30 ข้อของแต่ละอาชีพเป็นองค์ประกอบทั่วไปของ O*NET ที่ใช้ร่วมกันมาก (R19 กับ R15 ใช้ร่วมกัน 19/30 · ทุกคู่เฉลี่ย 76%) · R จึงแยกอาชีพในกลุ่มไอทีได้น้อย · เรซูเม PM ได้ R15 สูงกว่า R19 แม้ตัด R3 ออก (56 กับ 47)
**การตัดสินใจ** ไม่เปลี่ยนวิธีเลือก 30 ข้อ (DEC-03 · G-600 คงเดิม) แต่เพิ่มดัชนีแยกที่รายงานคู่กับ R ไม่รวมเป็นตัวเลขเดียว:
- **T** งาน Core 8 งานแรกตาม IM ของงาน (O*NET 31.0 Task Statements) ประเมินใน prompt เดียวกัน (`task_assessments`) ด้วยกฎเดียวกัน (R2 · R3 สองชั้น · R1) ไม่มีฐานขั้นต่ำ · T = ค่าเฉลี่ยคะแนนสถานะของงานที่สรุปได้ × 100
- **H** เทคโนโลยีที่ O*NET ระบุว่าตลาดต้องการ (In Demand) ของอาชีพ นับแบบทั้งคำในเรซูเม (ไม่ใช้โมเดล) · รายงาน "พบ x จาก y"
- แท็บใหม่ `role_task_decisions` · `runs.role_task_index`, `runs.tech_match_pct`
**ไฟล์ที่กระทบ** `scripts/build_role_signals.py` → `data/role_tasks.csv` (160) · `data/role_technology.csv` (375) · `engine` (`techMatch`, `evaluateRun`) · workflow (SIGNALS ฝังในโหนดที่ใช้) · `config/sheets.json` · WF_Demo
**ผลต่อเล่ม** 3.2 (ข้อมูลอ้างอิงชุดที่ 3) · 3.4.6 (ตัวชี้วัด T และ H) · 3.6 รายงาน · ตารางแท็บ
**วิธีย้อนกลับ** ส่ง roleTasks/roleTech ว่าง (T, H = N/A)

## DEC-56 · แผนเรียนตามระดับผู้เรียน และไม่คาดการณ์คะแนนหลังเรียนจบ
**วันที่** 3 ต.ค. 2569
**ปัญหา** PM 8 ปีได้แผน Research Methods, Write Professional Emails in English, CAPM สำหรับ Reading Comprehension · Demo แสดง "หลังเรียนจบแผน 10 → 100" ซึ่งขัดนิยามของงานวิจัย (คอร์ส/ใบรับรอง = อย่างมาก partially)
**การตัดสินใจ** (1) `estimateYearsExperience` จากช่วงปีในเรซูเม (ใช้เลือกระดับเท่านั้น) · ถ้า ≥ 5 ปี (`plan_experienced_years`) ไม่ใช้รายการระดับ Beginner ปิดข้อที่เป็น partially (`uncovered_level_filtered` รายงานแยก) · ข้อ missing ยังใช้รายการทุกระดับ (2) ข้อ abstained ไม่ใส่ในแผน (3) Demo ตัดคะแนนคาดการณ์ เหลือ "แผนครอบคลุมช่องว่าง x/y ข้อ"
**ผลจำลอง** case A (7 ปี) gap coverage 0.92 → 0.69 เพราะ partially 6 ข้อไม่ใช้รายการเริ่มต้น · G-600 (simulate_coverage) ไม่กระทบ (ใช้ทุกข้อเป็น missing)
**ไฟล์ที่กระทบ** `engine.buildPlan` · `config/project.json` · `demo/src/plan_pathway.js` · `app.js`
**ผลต่อเล่ม** 3.5 การจัดแผน (ย่อหน้าระดับผู้เรียน)
**วิธีย้อนกลับ** `plan_level_filter = false`

## DEC-57 · ชุดตรวจความตรงของคะแนน
**วันที่** 3 ต.ค. 2569 · 👤 ยืนยันเกณฑ์กับอาจารย์ · ผู้ให้ป้ายคนที่ 2
**ปัญหา** ชุดทดสอบเดิมตรวจว่าสูตรถูกตามสเปก (tests 65) และ workflow เดินครบ (n8n 14/14 กับบริการจำลอง) แต่ไม่เคยตรวจว่าคะแนนสมเหตุสมผลกับเรซูเมจริง
**การตัดสินใจ**
| ชุด | เครื่องมือ | เกณฑ์ผ่าน (เสนอ) |
|---|---|---|
| Gold-R3 | `scripts/r3_gold.mjs build/eval` · `evidence/r3_gold/gold_pairs_synthetic.csv` (82 คู่) · ข้อสรุปจริง 36 คู่ใน `private/` (ไม่เข้า git) · ผู้ให้ป้าย 2 คน (rater_1/rater_2) | κ ≥ 0.61 · precision ≥ 0.90 · recall ≥ 0.75 บนคู่ที่ไม่ได้ใช้ปรับเกณฑ์ |
| Known-group | `scripts/make_validation_resumes.py` (4 บุคคลสมมติ × 3 สไตล์) + `scripts/validate_scoring.mjs` กับ WF_Demo + Gemini จริง | K1 T ของอาชีพตัวเองสูงสุด · K2 R ของอาชีพตัวเอง ≥ มัธยฐานอาชีพอื่น + 10 |
| Style-invariance | ชุดเดียวกัน | S1 \|R(onet) − R(star)\| ≤ 10 |
| Stability | ชุดเดียวกัน `--repeat 3` | T3 สถานะตรงกันทุกรอบ ≥ 85% |
| Regression | กรณี D + `tests/rules_v2.test.mjs` + `tests/demo_workflow.test.mjs` | ผ่านทุกครั้งก่อน commit |
**ผลต่อเล่ม** 3.7 (ชุดทดสอบระบบ) · 3.8 (เงื่อนไขเปรียบเทียบ R3) · ตาราง 3.1
**วิธีย้อนกลับ** —

## DEC-58 · WF_Demo รุ่น 3 ต.ค.
**วันที่** 3 ต.ค. 2569
**การตัดสินใจ** (1) ฝัง `engine/engine.js` ทั้งไฟล์ (`//@@ENGINE_ALL@@`) แล้วตัดสินด้วย `evaluateRun` ตัวเดียวกับระบบเต็ม · ค่ากฎจาก `config/project.json` (2) Gemini วิเคราะห์ `ANALYST_RUNS = 3` รอบแล้วโหวต (R1 · ถ้าเหลือรอบเดียวใช้ 1 เสียง) (3) โหนด Prepare Relevance Checks → Need Verification? → Gemini Verifier (R3b · self-verification ติดป้าย) → Verify Evidence (R0–R6) (4) ป้ายสถานะ "ยังยืนยันไม่ได้" (5) ตัด "หลังเรียนจบ → 100" แทนด้วยดัชนี T (6) Open Learner Model: ผู้เรียนพิมพ์หลักฐานเพิ่มรายข้อแล้ววิเคราะห์ใหม่ ข้อความต่อท้ายเรซูเม (ปิดบัง PII) ตรวจด้วยกฎเดียวกัน ติดที่มา "หลักฐานที่คุณเพิ่ม" (7) thinking = medium · ป้ายระดับไม่แสดงเมื่อ C < 0.6
**ไฟล์ที่กระทบ** `demo/src/*` · `demo/build_wf_demo.mjs` · `demo/build_demo_data.py` · `demo/test/harness.mjs` `server.mjs` · `tests/demo_workflow.test.mjs` · 27 → 31 โหนด
**ผลต่อเล่ม** ไม่มี (DEC-44 Demo อยู่นอกเล่ม)
**วิธีย้อนกลับ** `git checkout` รุ่นก่อน 3 ต.ค. ของ `demo/` แล้ว build

## DEC-59 · WF_Demo v2.1.0 — Role-Fit, actor, verifier cache, token panel, ตราประทับรุ่น
**วันที่** 3 ต.ค. 2569 · อ้าง `docs/Gap_demo_03OCT26.md`
**ปัญหา** ทดสอบ 4 อาชีพ (R07/R15/R19/R20) ด้วยเรซูเมสมัคร PM: R15 (Network Engineer, T=0) ได้ 87 ใกล้ PM (R19 84) เพราะ Top-30 ทักษะของหลายอาชีพซ้ำกัน (ทักษะกว้างน้ำหนัก 58–69%), ผู้ตรวจไม่ดูว่าใครเป็นผู้ลงมือ, verdict ไม่นิ่ง, ข้อความเดียวถูกใช้ซ้ำ 6–7 ข้อ, headline ใช้ R อย่างเดียว, ตัวส่วน H ต่างกัน, ไม่เห็นจำนวนโทเคน
**การตัดสินใจ** (D1) Role-Fit F = ½·R-role + ½·T · ป้าย "พร้อมสูง" ต้อง F ≥ 75 และ T ≥ 60 (D2) R-role ถ่วงน้ำหนักด้วย idf = ln((N+1)/(df+0.5)), N=20 (D3) analyst ระบุ actor (performed/led/oversaw/mentioned) · ข้อกำหนดแนวลงมือทำ (hands_on) และงานหลักต้องเป็น performed (อาชีพบริหาร R19/R20 รับ led ในงานหลัก) ไม่งั้นลดเป็นบางส่วน · verifier prompt `verifier_demo_v1.1` (กฎ managing ≠ doing, LV ≥ 5.0 ต้องมี hands-on) (D4) cache verdict ใน `$getWorkflowStaticData` (ใช้เมื่อ Publish) + แบ่ง batch ละ 30 ข้อ (D5) ข้อความเดียว/ที่ซ้อนทับ ≥ 60% เป็นหลักฐานเต็มได้ ≤ 2 ข้อ (เก็บข้อเฉพาะอาชีพ df ต่ำก่อน) (D6) H แสดง "ข้อมูลไม่พอ" ถ้าอาชีพมีเทคโนโลยี < 10 รายการ ตัวส่วนคงที่ 10 (D7) แผงโทเคนรายขั้น (OCR / วิเคราะห์ / ตรวจความหมาย) (D8 โหมดเปรียบเทียบอาชีพ = P2 ยังไม่ทำ)
**ตราประทับรุ่น** `STAMP` {wf_version, build_id, built_at, commit, engine_version/sha, prompt ids, rules_version, data_sha} ฝังในโหนด Config/Prompt/Prepare/Verify/Plan ตอน build · ทุกโหนดตรวจเทียบกับ Config → `ver_issues` · หน้าเว็บส่ง `client_build` · endpoint `GET /webhook/is-demo-version` · `run_demo_mac.sh` เทียบ build_id ที่ n8n เสิร์ฟกับไฟล์ ถ้าไม่ตรงหยุดทำงาน
**ไฟล์ที่กระทบ** `demo/src/*` · `demo/build_wf_demo.mjs` · `demo/build_demo_data.py` · `demo/prompts/verifier_demo_v1.1.txt` · `demo/version.json` · `demo/run_demo_mac.sh` · `demo/test/*` · `tests/demo_workflow.test.mjs` · 31 → 34 โหนด · ไม่แตะ `engine/engine.js` และ prompt ของระบบเต็ม
**ผลต่อเล่ม** ไม่มี (Demo อยู่นอกเล่ม · DEC-44) · ผลจริงต้องยืนยันด้วย Gemini บนเครื่องผู้ใช้ตามเกณฑ์ P1–P6 ใน Gap_demo
**วิธีย้อนกลับ** `git checkout a47c5a7 -- demo/` แล้ว build

## DEC-60 · engine 2.1: กฎ R7, Role-Fit, ตราประทับรุ่น, ที่เก็บคำตัดสิน
**วันที่** 3 ต.ค. 2569 · อ้าง `docs/Plan_03OCT26_v2.md` (S1, S5)
**ปัญหา** กฎที่พิสูจน์ใน WF_Demo (แยกผู้ลงมือทำ, จำกัดการใช้ quote ซ้ำ, Role-Fit, H ตัวส่วนคงที่) อยู่ในโหนดของ Demo เท่านั้น ระบบเต็มกับ Demo จึงใช้กฎไม่เหมือนกัน และผลรายคนย้อนตรวจรุ่นของระบบไม่ได้
**การตัดสินใจ** (1) เพิ่ม R7 ใน `engine/engine.js` ต่อจาก R5 และ R6 analyst ส่ง `actors` (performed, led, oversaw, mentioned) ข้อกำหนดเชิงปฏิบัติตามคำนำหน้า `actor_rules.hands_on_prefixes` ต้องเป็น performed ข้อที่ LV ตั้งแต่ 5.0 ต้องอย่างน้อย led งานหลักของ R19 และ R20 รับ led ถ้าต่ำกว่าเกณฑ์ ลด evidenced เป็น partially (2) quote หนึ่งเป็นหลักฐานเต็มได้ไม่เกิน 2 ข้อ เมื่อข้อความซ้อนกันตั้งแต่ร้อยละ 60 เรียงตาม df น้อย น้ำหนักมาก และรหัส (3) Role-Fit ใช้ในรายงานผู้เรียนเท่านั้น ไม่เป็นตัวชี้วัดของคำถามวิจัย (4) H ใช้ตัวส่วนคงที่ 10 เทคโนโลยี ถ้ามีน้อยกว่านั้นแสดง N/A (5) บันทึกตราประทับรุ่น (build_id, versionIssues, freeze config) และ token รายขั้นลงแท็บ runs (6) ที่เก็บคำตัดสินของผู้ตรวจใช้รหัสแฮชเป็นกุญแจ รวมรหัสรุ่นโมเดล และปิดตอนวัดความคงที่ (7) prompt ใหม่ analyst_v1.2 และ verifier_v1.1 R0 ยังรับ prompt รุ่นก่อนหน้า
**ไฟล์ที่กระทบ** `engine/engine.js` `config/project.json` `config/sheets.json` `prompts/*` `scripts/build_workflows.mjs` `workflows/src/*` `workflows/WF_IS_68076026_01OCT26.json` `demo/*` `tests/*` · Demo ฝัง engine ตัวเดียวกัน
**ผลต่อเล่ม** ต้องแก้ตอนปรับเล่ม (หัวข้อ 3.4.2, 3.4.4, 3.4.6, ตารางกฎ R0 ถึง R7, ภาคผนวก prompt) ยังไม่ได้แก้
**วิธีย้อนกลับ** `git checkout` ไฟล์ `engine/`, `config/`, `prompts/`, `workflows/src/`, `demo/` ของคอมมิตก่อนหน้า แล้ว build ใหม่

## DEC-61 · ลดขอบเขต: ผู้ให้รหัสคนเดียว ไม่มี IOC ไม่มีสัมภาษณ์
**วันที่** 3 ต.ค. 2569
**ปัญหา** หาผู้ให้รหัสคนที่สองและผู้เชี่ยวชาญ IOC ไม่ได้
**การตัดสินใจ** (1) ผู้วิจัยให้รหัสคนเดียว วัดความน่าเชื่อถือด้วยการให้รหัสซ้ำ (intra-rater) อย่างน้อยร้อยละ 20 ไม่น้อยกว่า 6 คน ห่างจากรอบแรกอย่างน้อย 14 วัน สลับแถว ไม่เห็นรหัสรอบแรกหรือผลระบบ เกณฑ์ kappa ไม่ต่ำกว่า 0.61 `coding_sheets.py merge` ปฏิเสธถ้าระยะห่างไม่ถึง (2) ป้ายของชุด Gold-R3 ใช้ผู้วิจัยคนเดียวสองรอบเช่นกัน (label_1, label_2) (3) ตัดการตรวจ IOC ใช้อาจารย์ที่ปรึกษาตรวจถ้อยคำและทดสอบความเข้าใจกับกลุ่มนำร่อง 5 คน (4) ไม่ทำสัมภาษณ์ (5) ไม่ทำโหมดเปรียบเทียบอาชีพและแดชบอร์ด (6) แบบประเมินเพิ่มเป็น 5 ข้อ สองข้อใหม่ (เข้าใจง่าย เชื่อถือหลักฐาน) ใช้อธิบายผล ไม่มีเกณฑ์ (7) เพิ่มการวิเคราะห์องค์ประกอบเชิงพรรณนา (`analysis/component_analysis.py`) (8) เขียนเอกสารเครื่องมือวิจัยและจริยธรรมใหม่ทั้งชุดตามขอบเขตนี้
**ไฟล์ที่กระทบ** `analysis/coding_sheets.py` `analysis/run_analysis.py` `analysis/component_analysis.py` `analysis/metrics.py` `analysis/synth_data.py` `scripts/r3_gold.mjs` `config/sheets.json` `docs/research_tools/*` `docs/ethics/*` `docs/Advisor_Email.md`
**ผลต่อเล่ม** ต้องแก้ตอนปรับเล่ม (ผู้ให้รหัส ข้อจำกัด แบบประเมินและภาคผนวก ข การตรวจเครื่องมือ) ยังไม่ได้แก้
**วิธีย้อนกลับ** ไฟล์เดิมอยู่ใน `archive/03OCT26/docs/` และประวัติ git


## DEC-62 · ปรับคลังเป็นรุ่นปัจจุบัน (v1.6) และนับรายการเรียนรู้ใหม่ 14 รายการ
**วันที่** 3 ต.ค. 2569 · อ้าง `report_03OCT26/Gap_report_03OCT26.md` หัวข้อ 7
**ปัญหา** ใบรับรอง 46 จาก 162 รายการที่ไม่ซ้ำกันเปลี่ยนชื่อ รหัส หรือรุ่น (เช่น ITIL 4 เป็น ITIL Foundation (Version 5), PCNSE, SAFe 6 Agilist, AWS SOA-C02 เลิกแล้ว) และความครอบคลุมยังขาด 2 ข้อ (REQ-R14-4.A.3.b.5 และ REQ-R20-4.A.2.a.1) เมื่อไม่นับคอร์สใหม่ 14 รายการ
**การตัดสินใจ** (1) ผู้วิจัยมอบหมายให้ผู้ช่วยตรวจหน้าเว็บแทนการเปิดตรวจเอง บันทึก `verified_by` เป็น "Claude (ตรวจหน้าเว็บ 3 ต.ค. 2569) ตามที่ผู้วิจัยมอบหมาย" และผู้วิจัยสุ่มเปิดยืนยันซ้ำได้ (แก้กติกาข้อ 2-3 ของ Prompt_Report) (2) นับคอร์สใหม่ 14 รายการ (`corpus_additions.csv` researcher_result = LIVE) ใช้ชั่วโมงตามหน้าเว็บ ถ้าหน้าให้ตัวเลขสองแบบใช้ค่าที่สูงกว่า (3) กติกาความสดใหม่: ใช้รุ่นที่มีผลถึง 30 พ.ย. 2569 รุ่นที่มีผลหลังจากนั้นคงรุ่นเดิมและจดวันที่ไว้ใน `researcher_notes` (4) แก้คลังผ่าน `data/corpus_updates_03OCT26.csv` (66 แถว กลุ่ม ก 12 ข 27 ค 9 ง 10 จ 8) ที่ `build_corpus.py` อ่านหลังขั้น DEC-46 และจดทุกแถวใน `corpus_change_log.csv` (5) URL ค้าง 28 รายการ: 7 รายการผ่านตรวจ ที่เหลือคงสถานะรอตรวจและบันทึก URL ที่พบไว้ใน `url_manual_check.csv` (6) รายการที่เนื้อหาเปลี่ยนมาก (PCNSE เป็น NGFW Engineer, Fortinet NSE 4) ยังต้องตรวจความเชื่อมโยง L1 ใหม่ก่อนตรึงรุ่น (7) รหัสรุ่นคลัง CORPUS_IS68076026-v1.6-03OCT26 (8) เปลี่ยนชื่อโหนด Apply Rules R0-R6 เป็น R0-R7 ให้ตรงกฎจริง
**ไฟล์ที่กระทบ** `scripts/build_corpus.py` `data/corpus*.csv` `data/url_manual_check.csv` `data/mappings.csv` `sheets_import/*` `workflows/*` `scripts/build_workflows.mjs` `scripts/validate_workflows.mjs` `tests/*` `scripts/book_numbers.py`
**ผลต่อเล่ม** คลัง 812 แถว ครอบคลุม 600/600 ทั้งคลังและแผนจำลอง build_id ใหม่ ต้องปรับเล่มตามหัวข้อ 7 ของ Gap report (ทำแล้วใน book/*.md)
**วิธีย้อนกลับ** `python scripts/build_data_all.py` ด้วย `--no-updates` และ `--no-additions` หรือกู้ไฟล์จาก `archive/03OCT26/data/` และ `archive/03OCT26/WF_IS_68076026_01OCT26_before_DEC62.json`

## DEC-63 · ลดเล่ม IS_68076026 ตาม Analysis_doc_04OCT26 (4 ต.ค. 2569)
- **ปัญหา** เล่มยาวเกินเป้า ≤ 100 หน้า Word และมีเนื้อหาซ้ำ
- **ตัดสินใจ** ตัดและย้ายเนื้อหาบท 3 ไปภาคผนวก · รวมภาคผนวกเหลือ ก–ฏ (ก เดิม คำอธิบายกรณีใช้งานรายกรณี แยกไป `docs/Use_Cases_Detail.md`) · ย่อบท 1–2 และส่วนนำ · ไม่เปลี่ยนเกณฑ์ θ prompt หรือคลัง
- **ไฟล์** `book/01_chapter1.md` `02_chapter2.md` `03_chapter3.md` `05_appendix.md` · สคริปต์ `archive/04OCT26/shorten_book.py`
- **ผลต่อเล่ม** ตาราง 3.x เรียงใหม่ 22→15 · รูป 9→7 · สมการ 13→10 · ตัวอักษรภาคผนวกเปลี่ยน (ข→ก, ง→ข ฯลฯ) · PDF LibreOffice 96 หน้า (≈ 74 หน้า Word)
- **ย้อนกลับ** คัดลอก `archive/04OCT26/book/*.md` กลับ `book/` แล้ว build ใหม่

## DEC-64 · คงชื่อเรื่องและแบบแผน · ลงรหัสชุดคำตอบอ้างอิงคนเดียว (4 ต.ค. 2569)
- **ปัญหา** Gap_Report_04OCT26 ชี้ว่าแบบแผนไม่ได้ทดสอบคำว่า "ลด" ในชื่อเรื่อง และชุดคำตอบอ้างอิงมาจากผู้วิจัยคนเดียว
- **ตัดสินใจ (ผู้วิจัย)** (1) คงชื่อเรื่อง คำถามวิจัย และแบบแผนเดิม ไม่เพิ่ม RQ (2) ผู้วิจัยลงรหัสคนเดียว ต่อเนื่องจาก DEC-61
- **ไฟล์** ยังไม่แก้เล่ม · งานเขียนที่ตามมาอยู่ใน Gap_Report_04OCT26 หัวข้อ 3 H1–H2 และหัวข้อ 7 ข้อ 4–5
- **ผลต่อเล่ม** ต้องเขียนให้อ้างไม่เกินแบบแผน (อ่าน "เพื่อลด" เป็นจุดมุ่งหมาย · U = อัตราการแทรกแซงของกฎ · นิยามชุดอ้างอิงเดียว)
- **ย้อนกลับ** เพิ่ม RQ1b แบบจับคู่ หรือเพิ่มผู้ลงรหัสคนที่สอง ตามทางเลือกใน Gap_Report v1

## DEC-65 · ปรับปรุงเล่มตาม Gap_Report_04OCT26 แผนข้อ 4–10 (4 ต.ค. 2569)
- **ปัญหา** Gap_Report_04OCT26 ชี้ช่องโหว่ H1 H2 H3 H4 H5 H6 H7 และข้อบกพร่องด้านศัพท์ รหัสภายใน และรูปแบบ
- **ตัดสินใจ (ผู้วิจัย)** ยืนยันตาม DEC-64 · เปิดเผยการใช้เครื่องมือ Generative AI ตรง ๆ ด้วยคำเดียวทั้งเล่ม และผู้วิจัยตรวจซ้ำก่อนกำหนดรุ่นคงที่ · ทำแผนข้อ 4–10 ทั้งหมด
- **การเปลี่ยนแปลง** (1) H1 H2 ปิดด้วยการเขียน: "ลด" เป็นจุดมุ่งหมายการออกแบบ นิยาม hallucination สองส่วน U เป็นอัตราการแทรกแซงของกฎ นิยามชุดคำตอบอ้างอิงเดียว (2) H3 ตารางที่มาของพารามิเตอร์ นิยาม "ผ่านเกณฑ์" และการวิเคราะห์ความไว (3) H4 ตาราง RQ↔ตัวชี้วัดและสรุปบท 3 (4) H5 บท 2 เป็นการเปรียบเทียบเชิงวิพากษ์ เพิ่มอ้างอิง 2024–2025 ที่ตรวจข้อมูลบรรณานุกรมแล้ว 7 รายการ (huang2025halsurvey, dhuliawala2024cove, tang2024minicheck, verga2024poll, du2024debate, wen2025abstention, depa2025) และแก้ข้ออ้างทฤษฎีของ greedy ตาม Khuller และคณะ (5) H6 เปิดเผยการใช้เครื่องมือ AI ในบท 3 และตาราง ค.2 ญ (6) H7 เปิดเผยข้อจำกัดการปิดบังและไฟล์สแกนที่ส่ง Document AI ก่อนปิดบัง และเพิ่มภาคผนวก ฐ (7) ตัดรหัสภายใน ชื่อไฟล์ DEC และ snake_case ออกจากเนื้อความนอกภาคผนวก ก และ ฉ (8) บทคัดย่อเขียนใหม่ ตัวเลขผ่านตัวแทนค่า (9) เลขตารางบท 3 เรียงใหม่เป็น 3.1–3.20 (10) รูป: ชื่อขั้นตอนไทยใน workflow เพิ่มรูปเส้นทางข้อมูล (รูปที่ 3.8) ตัดชื่อไฟล์และจำนวนโหนด (11) ย่อหน้ายาวถูกแยก (12) check_docx_format: ตรวจชื่อคลังจาก numbers.json และยกเว้น "on AI"
- **ไฟล์** `book/00_front.md` `01_chapter1.md` `02_chapter2.md` `03_chapter3.md` `04_references.md` `05_appendix.md` `scripts/book_numbers.py` `scripts/make_figures.py` `scripts/check_docx_format.py` `docs/research_tools/Analysis_Plan.md` `book/figures/*`
- **ผลต่อเล่ม** build ผ่าน format 33/33 · 114 หน้า PDF · เทสต์ 93/93
- **ยังค้าง** ภาคผนวก ก (คอลัมน์ชื่อไทย แถว seed ของ bootstrap ตารางเทียบ C0–C8 กับชื่อสคริปต์) · ภาพรายงานใน ฏ (ต้องรัน n8n กรณี A ซ้ำ) · แบบประเมินใน จ และการตั้งชื่อกลุ่ม/รหัสกรณีใน ฎ · การเรียงสมการและตาราง ค.4 · ผู้วิจัยอ่านต้นฉบับอ้างอิง 7 รายการใหม่ และตรวจรายการเรียนรู้ซ้ำก่อนกำหนดรุ่นคงที่
- **ย้อนกลับ** `git revert` คอมมิตของ DEC-65 หรือกู้จากคอมมิต bb7e31a
