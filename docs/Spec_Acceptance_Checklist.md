# Spec & Acceptance Checklist · สถานะ 1 ต.ค. 2569

> ที่มา: หัวข้อ 2 ของ `Plan_IS_30SEP26.md` (ดึงจาก PDF ฉบับขอสอบ) + บั๊ก 11 ข้อของรุ่นเดิม + DEC-20/21
> ✅ = มีเทสต์อัตโนมัติผ่าน · 🟡 = ผ่านในเทสต์/sandbox แต่ต้องยืนยันใน n8n จริง (S6) หรือบริการจริง (P1) · ⏳ = ยังไม่ได้ทำ
> รันตรวจทั้งหมด: `bash scripts/run_all_checks.sh`

## A. สเปกตามเล่ม

| # | สเปก | เทสต์ / หลักฐาน | ✓ |
|---|---|---|---|
| A1 | PDF ≤ 10,485,760 ไบต์ · ≤ 5 หน้า · ต้องยินยอม · อีเมลยืนยันตัวตน | `intake_text.test.mjs` (checkFile, validateIntake) · `workflows.test.mjs` (Check File, Parse & Validate) | ✅ |
| A2 | 20 อาชีพ · 3 โหมด · 6/12/18/24 เดือน · ชม./สัปดาห์ | `intake_text.test.mjs` · `data.test.mjs` | ✅ |
| A3 | 600 = 20 × 30 · IM ≥ 3 · 4 โดเมน · โควตา ≥ 3 · สมการ 3.1 · 343/104/77/76 | `data.test.mjs` · `build_reference_data.py` ตรงไฟล์ตรึง 28AUG26 ทุกค่า | ✅ |
| A4 | Document AI หลัก · OCR สำรอง · บันทึกบริการ/รุ่น | `workflows.test.mjs` (Prepare Text ทั้งสองทาง) | 🟡 P1 |
| A5 | ปิดบัง PII 4 รูปแบบ + นับจำนวน | `intake_text.test.mjs` | ✅ |
| A6 | 3 ผู้ให้บริการ · MODEL_A/B/C_ID · 4,096 · 90 s · retry ≤ 2 (429/timeout) · temperature 0 | `intake_text.test.mjs` (buildProviderRequest, callModelWithRetry) · กรณี C (429 × 3) | 🟡 temperature รอ smoke test |
| A7 | ลำดับ R0 → R2 → R3 → R1 → R4 · รหัส R0 ห้ารหัส · θ 0.15 · 2 เสียง | `rules.test.mjs` (ตาราง 3.25, 3.26) | ✅ |
| A8 | 4 สถานะ | `rules.test.mjs` | ✅ |
| A9 | สมการ 3.2–3.6 | `rules.test.mjs` (ตัวอย่าง 72.50 / 0.20) | ✅ |
| A10 | Hmax · greedy dk · ค่าเท่ากันตัดด้วย item_id · ข้ามรายการเกินเพดาน · L1 ที่ผ่านตรวจเท่านั้น | `plan.test.mjs` (ตัวอย่างในเล่ม 140 ชม.) | ✅ |
| A11 | 16 แท็บ จำนวนคอลัมน์ตามตาราง 3.20 (หลัง DEC-34) | `data.test.mjs` | ✅ |
| A12 | runs.stage ตามรูป 3.8 · กันงานซ้ำด้วย response_id | `intake_text.test.mjs` · `workflows.test.mjs` | ✅ |
| A13 | ข้อผิดพลาด 9 กรณี · m < 2 → abstained ทั้งฉบับ R = N/A | `rules.test.mjs` · `pipeline.test.mjs` · `workflows.test.mjs` (WF_Error) | 🟡 S6 |
| A14 | 5 workflow 17/11/13/13/6 node | `validate_workflows.mjs` | ✅ |
| A15 | อีเมลรายบุคคล · รายงานไทย · Drive · 90 วัน | `pipeline.test.mjs` (รายงาน 5 ส่วน, escape, https) · env `EXECUTIONS_DATA_MAX_AGE` | 🟡 P1 + ขั้นตอนลบ |
| A16 | เก็บข้อความหลังปิดบังที่ผู้วิจัยเข้าถึงได้ | `workflows.test.mjs` (masked_upload) · DEC-34 | ✅ |

## B. บั๊ก 11 ข้อของรุ่นเดิม (เทสต์ถดถอย)

| # | บั๊ก | เทสต์ | ✓ |
|---|---|---|---|
| B1 | IF เทียบ boolean กับ string | validator (boolean operator, strict) + Parse & Validate ส่ง boolean จริง | ✅ |
| B2 | Decide ไม่ได้ requirements | `workflows.test.mjs` (assembled.requirements 30 · Decide throw ถ้าไม่มี) | ✅ |
| B3 | Google node ไม่ใช้ serviceAccount | validator | ✅ |
| B4 | aliases ไม่ถึง R3 · ผลต่างจาก run_local | `workflows.test.mjs` เทียบ run_local ทั้ง 3 กรณี | ✅ |
| B5 | fan-in รันซ้ำ · เรียกโมเดล/ส่งอีเมลซ้ำ | validator (Merge หรือ exclusive_fan_in) · นับการเรียก A/B/C = 1/1/1 | 🟡 S6 |
| B6 | ประมวลผลเฉพาะแถวแรก | `workflows.test.mjs` (3 แถว → 3 งาน) · validator mode=each | ✅ |
| B7 | binary ไฟล์แนบหลุด | validator (Send Email รับจาก Export PDF + property data) | 🟡 S6 |
| B8 | สรุปการส่งอ่านจาก error branch | `workflows.test.mjs` (Record Delivery: success/error/reuse) | ✅ |
| B9 | error output ไม่ได้ต่อ | validator + เทสต์ตัวตรวจจับได้ | ✅ |
| B10 | service account ไม่มีโควตา Drive | validator (upload ใช้ OAuth2) | ✅ |
| B11 | WF_Error ไม่ได้ run_id | `workflows.test.mjs` (จาก execution และจากข้อความ) | ✅ |

## C. ข้อกำหนดจาก DEC

| # | ข้อกำหนด | เทสต์ | ✓ |
|---|---|---|---|
| C1 | DEC-20 gap coverage สองค่า + uncovered สองชนิด | `plan.test.mjs` | ✅ |
| C2 | DEC-21 throw เมื่อ mapping_review หาย/ว่าง/< 90% · ข้อความ "ข้อผิดพลาดของข้อมูลอ้างอิง" | `plan.test.mjs` · `workflows.test.mjs` | ✅ |
| C3 | sha256 ไฟล์อ้างอิง 8 ไฟล์ | `data.test.mjs` · `update_manifest.py --check` | ✅ |
| C4 | L1 ตรง competency_ids_l1 | `data.test.mjs` · `build_corpus.py` assert | ✅ |
| C5 | item.role_id == mapping.role_id | `data.test.mjs` | ✅ |
| C6 | engine ฝังตรงทุกไบต์ · email node เฉพาะ Deliver/Error | validator + เทสต์ตรวจจับการแก้ | ✅ |

## D. ตัวเลขอ้างอิง (เล่มดึงจาก `book/numbers.json` อัตโนมัติ)

| รายการ | เล่มฉบับขอสอบ | ระบบใหม่ 1 ต.ค. 2569 |
|---|---|---|
| คลัง | 499 · 6,779 · L1 1,955 · 479/600 | 571 · 6,883 · L1 2,076 · ผ่านตรวจ 1,942 · 598/600 (599 หลังตรวจ URL) |
| ภาคผนวก ค A/B/C | R 42.40/13.67/30.05 · แผน 7/9/7 · 415/369/230 ชม. | R 66.25/19.63/38.57 · แผน 5/11/9 · 156/225/166 ชม. (เรซูเมสังเคราะห์ชุดใหม่) |
| ทดสอบอัตโนมัติ | 29 กรณี | 46 (Node) + 8 (Python) |
