# LOG: IS 68076026 (บันทึกความคืบหน้าและจุดทำต่อ)

> ไฟล์นี้คือจุดเริ่มของทุก session ให้อ่านหัวข้อ **ทำต่อจากตรงนี้** ก่อน
> อัปเดตล่าสุด: 1 ต.ค. 2569 · ระยะปัจจุบัน: **R0 backup + E จริยธรรม + รอยืนยันจากอาจารย์** (D, S1–S5, B1–B4, I สร้างเสร็จแล้ว)
> ประวัติถึง 23 ก.ย. อยู่ใน Project `claude/LOG_Final_IS.md`

---

## ▶ ทำต่อจากตรงนี้

1. 👤 สร้าง GitHub private repo แล้ว `git remote add origin … && git push -u origin main --tags` (NEXT_STEPS ข้อ 2–3)
2. 👤 ตรวจ URL 28 รายการใน `data/url_manual_check.csv` → `python scripts/build_data_all.py` → `bash scripts/run_all_checks.sh` (ข้อ 16)
3. 👤 ส่งอีเมล `docs/Advisor_Email_D0-D5.md` + แนบเล่ม docx และร่างจริยธรรม (ข้อ 7–8)
4. 👤 กรอกช่อง ⚠ ในเอกสาร `docs/ethics/` + อบรมจริยธรรม (ข้อ 9, 13)
5. 👤🤖 S6 ทดสอบ `workflows/WF_Final_IS.json` (ไฟล์เดียว · DEC-37) ใน n8n 2.39.9 ตาม `docs/Setup_Guide.md` ข้อ 4–5 (ข้อ 25) แล้วตัดสินผลต่อเล่ม (ข้อ 25b)

---

## ประวัติ session

### 1 ต.ค. 2569 · Session 11: Demo รอบที่ 1 สำหรับคณะกรรมการ (DEC-39)
**ทำอะไร** `demo/WF_Demo.json` 28 โหนด: หน้าเว็บ glassmorphism (Light/Dark, ฟอร์ม 4 อาชีพ, 6/12/18/24 เดือน, ชม./สัปดาห์, อัปโหลด) → OCR (text layer / Gemini) → ปิดบัง PII → Gemini + R0·R2·R3 → แผน (3.7–3.8) → รายงาน + ดาวน์โหลด PDF + บันทึก Google Drive · ข้อมูลจริง hardcode (O*NET 31.0 + คลัง v1.5R verified) · เรซูเมสมมติ 4 อาชีพ + ไฟล์สแกนใน `demo/samples/` · คู่มือ `demo/README_Demo.md`
**พบอะไร** n8n 2.39 เสิร์ฟ HTML ของ webhook ใต้ CSP sandbox → html2pdf ใช้ไม่ได้ (แก้ด้วย html-to-image + jsPDF) · ทดสอบบน n8n 2.39.9 จริง (import/publish/รันครบ, CORS null ถูกต้อง) แต่ยังไม่ได้ทดสอบกับ Gemini/Drive จริง
**ค้าง** 👤 ใส่ Gemini API key + Drive credential แล้วซ้อมตาม README ก่อนวันโชว์ · commit `demo/`

### 1 ต.ค. 2569 · Session 10 (ต่อ): จัดระเบียบโฟลเดอร์แม่ `Documents\IS - n8n resume analysis`
- รากโฟลเดอร์เหลือ `Final_IS/` + `archive/` + `README.md` (ชี้มาที่ Final_IS)
- ย้าย 15 รายการ (01_docs–07_sheets_import, IS_Files_01OCT26, Data_Set.xlsx และ PDF ฉบับขอสอบที่ sha ตรงกับใน Final_IS, README/MOVE_LOG เดิม, .work, .agents และ .git ว่าง) ไป `archive/2026-10_pre_Final_IS/` · บันทึก `archive/MOVE_LOG_01OCT26.csv` · ไม่มีสคริปต์ใน Final_IS อ้างไฟล์นอกโฟลเดอร์
- ยังมีสำเนาเก่าอีกชุดที่ `Downloads\IS - n8n resume analysis` (ไม่ได้แตะ)

### 1 ต.ค. 2569 · Session 10 (ต่อ): ย้ายชุด 5 workflow เดิมเข้า archive (DEC-38)
- ย้าย 5 ไฟล์ไป `archive/01OCT26/workflows_5wf_DEC-30/` + MOVE_LOG + README "ไม่ใช้งาน" · `workflows/` เหลือ `WF_Final_IS.json` + `manifest.json` + `src/`
- build เขียนเฉพาะ WF_Final_IS (`--legacy <dir>` สร้างชุดเดิมได้ ตรวจแล้ว sha ตรงไฟล์ที่ย้าย) · validator/tests สร้างชุดเดิมในหน่วยความจำ และไม่ผ่านถ้ามี workflow อื่นใน `workflows/`

### 1 ต.ค. 2569 · Session 10: รวม 5 workflow เป็นไฟล์เดียว WF_Final_IS (DEC-37)
**ทำอะไร** `buildFinal` ใน `build_workflows.mjs` สร้าง `workflows/WF_Final_IS.json` 59 node + โน้ต 5 ช่วง จากโหนดชุดเดิม · ตัด Execute Workflow/When Called by Main → `<Stage> Input` · Loop Over Runs (batch 1) · Error Trigger ในไฟล์ · `validateFinal` (dominator check กันค่าข้ามรอบ) · tests 46 → 51 · ชุด 5 ไฟล์ยังสร้างได้ (เปลี่ยนเฉพาะโค้ด Classify Error ใน WF_Error)
**พบอะไร** ชุด 5 ไฟล์มีสองจุดเสี่ยง: findings ว่าง (โมเดลล้มทั้งหมด) ทำให้ Decide หยุดก่อนอัปเดต runs · Upload PDF ล้ม + Send Email สำเร็จ ทำให้ Record Delivery ทำงานสองครั้ง → แก้ใน WF_Final_IS แล้ว ชุด 5 ไฟล์ยังไม่แก้
**ค้าง** S6 ใน n8n จริง (sandbox ไม่ใช่ n8n) · ผลต่อเล่ม 3.4/ตาราง 3.9 (NEXT_STEPS 25b)

### 1 ต.ค. 2569 · Session 9: สร้างโครงการ Final_IS ใหม่ทั้งหมด (Cowork บนคลาวด์ + เชื่อมเครื่อง)
**ทำอะไร**
- ข้อมูล: `requirements.csv` 600 (343/104/77/76, ตรง onet_requirements_28AUG26 ทุกแถว) · `roles.json` 20 · aliases · คลัง v1.3 → v1.4R (ผล URL ตรวจเดิม) → **v1.5R** (foundation 6 → 72 แถว/103 L1, promote 17 ตาม item_id) = 571 รายการ / 6,883 mapping / L1 2,076 / ครอบคลุม 599 ข้อ (ขาด REQ-R14-4.A.3.b.5) · mapping_review ตามเกณฑ์ C1–C5: ผ่าน 1,942 แถว, 535 รายการ, 598 ข้อ, 29–30 ข้อต่ออาชีพ · manifest 8 ไฟล์ (frozen=false) · sheets_import 16 แท็บ
- ระบบ: `engine/engine.js` (R0–R4, 3.1–3.8, แผน, รายงาน, อีเมล, retry, DEC-20, DEC-21) · prompt analyst_v1.0 + schema · synthetic A/B/C · 5 workflow (17/11/13/13/6 node) + build + validator · tests 46/46 (รวมบั๊ก B1–B11 ใน vm sandbox) · config + env_template + Setup Guide
- ผลจำลอง (ภาคผนวก ค ใหม่): A R 66.25 แผน 5 รายการ 156 ชม. · B R 19.63, 11 รายการ 225 ชม. · C (m=2) R 38.57, 9 รายการ 166 ชม. · coverage 6 เดือน 10 ชม. = 489/600 (5 ชม. = 389, cert_only = 195)
- เล่ม: PDF → `book/*.md` + 24 รูป + สมการ LaTeX · `build_book.py` → docx (OMML 8 สมการ, ZWSP, สารบัญฟิลด์) · ตัวเลขเป็น `{{key}}` จาก `book_numbers.py` · แก้ 23 จุด (ดู `evidence/book_changes_vs_baseline.md`) + ภาคผนวก ฉ ใหม่
- เครื่องมือวิจัย: Coding Manual / Analysis Plan / Questionnaire+IOC v1.0-draft (แก้อ้างอิงตาราง, ตัวอย่างคำนวณเองเป็นเป้า unit test: macro-F1 0.7635, κ 0.7015) · `analysis/` + tests 8/8
- จริยธรรม: 6 ไฟล์ร่าง v1.0 ใน `docs/ethics/`
- DECISIONS: DEC-27 (สร้างใหม่ + sha256) · DEC-28 D0 รอ · DEC-29–33 D1–D5 (ผู้วิจัยเลือก รออาจารย์ยืนยัน) · DEC-34 คอลัมน์ใหม่ · DEC-35 retry · DEC-36 แก้ข้อบกพร่องเล่ม

**พบอะไร**
- v1.3 → เล่ม v1.4 ต่าง 1 แถว mapping ที่ระบุตัวไม่ได้ เก็บไว้และบันทึกใน DEC-29
- URL 36 แถว (28 URL) ตรวจอัตโนมัติไม่ได้ (403/หน้า JS/404/redirect) → `data/url_manual_check.csv` · รายการเหล่านี้ไม่ผ่าน C1 จึงไม่เข้าแผน ตัวเลขในเล่มจะอัปเดตเองหลังตรวจ (ถ้าผ่านทั้งหมด coverage ≈ 493/600)
- เล่มเดิม: สารบัญไม่มีภาคผนวก จ, "เรซูเม่/เรซูเม" ไม่ตรงกัน, ประโยค "× 100" หลุดตอนถอด (แก้แล้ว)

**ค้าง** ดู "ทำต่อจากตรงนี้" + `NEXT_STEPS.md`

### 1 ต.ค. 2569 · Session 8: สร้างชุดส่งต่องาน IS_Files_01OCT26
- START_HERE, CLAUDE.md, NEXT_STEPS 40 ข้อ, DECISIONS ฉบับรวม, Spec Checklist, ร่างอีเมลอาจารย์, Ethics Rebuild Kit, สคริปต์ R0

### 30 ก.ย. 2569 · Session 7: ไฟล์ Local สูญหาย + วางแผนใหม่
- ทำ `Plan_IS_30SEP26.md` ที่ยึด PDF ฉบับขอสอบเป็นสเปก

### ก่อนหน้า
ดู Project `claude/LOG_Final_IS.md` และ `claude/Plan_23SEP26.md`
