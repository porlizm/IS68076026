# NEXT STEPS: ลำดับงาน IS 68076026 (อัปเดต 3 ต.ค. 2569 · Final_IS · Gap_03OCT26)

> ติ๊ก `[x]` เมื่อเสร็จ และเขียนหลักฐานสั้น ๆ ต่อท้าย · รหัสระยะตาม `docs/Plan_IS_30SEP26.md`
> 👤 = ผู้วิจัยทำ · 🤖 = Claude ทำได้ · ⛔ = ต้องรอสิ่งอื่นก่อน

---

## ขั้น 0B: แผน Plan_03OCT26_v2 (engine 2.1 และเครื่องมือวิจัย) · DEC-60, DEC-61

- [x] A1. 🤖 engine 2.1: R7 (actor, LV, quote ซ้ำ), Role-Fit, H คงที่, ตราประทับรุ่น, ที่เก็บคำตัดสิน, prompt analyst_v1.2 และ verifier_v1.1 · workflow 79 โหนดและ WF_Demo ฝัง engine เดียวกัน · tests 93/93
- [x] A2. 🤖 ผู้ให้รหัสคนเดียว: `coding_sheets.py` (ให้รหัสซ้ำ ห่าง 14 วัน สลับแถว) และ Gold-R3 สองรอบ
- [x] A3. 🤖 `analysis/component_analysis.py` พร้อมเทสต์ และซ้อมด้วยข้อมูลสังเคราะห์
- [x] A4. 🤖 เอกสารเครื่องมือวิจัย แบบประเมิน 5 ข้อ เอกสารจริยธรรม 6 ฉบับ และร่างอีเมลอาจารย์ เขียนใหม่
- [ ] A5. 👤 อ่านร่างอีเมล ส่งอาจารย์ แล้วบันทึกคำตอบลง DECISIONS
- [x] A6. 🤖 ไฟล์ prompt เก่าย้ายเข้า `archive/03OCT26/prompts/` และลบจากโฟลเดอร์ใช้งานแล้ว
- [ ] A7. 👤🤖 ขั้นที่ต้องใช้บริการจริง: smoke test โมเดล, ชุดตรวจความตรงของคะแนน (K1 K2 S1 T3 และ recall R3) กับระบบเต็ม, ให้ป้าย Gold-R3 สองรอบห่างกัน 14 วัน, ซ้อมให้รหัสกับเรซูเมสังเคราะห์สองรอบ
- [ ] A8. 👤 ปรับเล่มตามหัวข้อที่ DEC-60 และ DEC-61 ระบุ (ทำแยกหลังขั้นนี้)

---

## ขั้น 0A: แก้ Gap_03OCT26 (คะแนน Demo ต่ำกับเรซูเมจริง) · DEC-51–58

- [x] G1. 🤖 วิเคราะห์สาเหตุ → `docs/Gap_03OCT26.md` (ข้อสรุปจริง 36 ข้อ · R3 recall 0.24)
- [x] G2. 🤖 engine 2.0: R2 ซ่อม quote (DEC-52) · R3a/R3b (DEC-51) · R5/R6 (DEC-54) · T/H (DEC-55) · แผนตามระดับ (DEC-56) · prompt analyst_v1.1 + verifier_v1.0 (DEC-53) · tests 78/78
- [x] G3. 🤖 ข้อมูลสัญญาณอาชีพ `role_tasks` / `role_technology` / `skill_links` · manifest 11 · Sheets 17 แท็บ
- [x] G4. 🤖 workflow 79 โหนด (verifier A/B/C) · validator + traceability ผ่าน
- [x] G5. 🤖 WF_Demo รุ่นใหม่ (DEC-58) · harness + Playwright ผ่าน
- [x] G6. 🤖 ชุดตรวจความตรง (DEC-57): เรซูเมสมมติ 12 ไฟล์ · `validate_scoring.mjs` · `r3_gold.mjs`
- [x] G7. 🤖 เล่มบท 3/บทคัดย่อ/ภาคผนวก → `build/IS_68076026_Final_03OCT26.docx/.pdf` 84 หน้า · format 33/33 · overlap 0
- [x] G7b. 🤖 วิเคราะห์ผล Demo 4 อาชีพ → `docs/Gap_demo_03OCT26.md` (Role-Fit · actor/LV · token)
- [x] G7c-1. 🤖 สร้าง PoC ใน WF_Demo v2.1.0 (DEC-59) + ตราประทับรุ่น · tests 9/9
- [ ] G7c-2. 👤🤖 รัน Gemini จริง 4 อาชีพ (`bash demo/run_demo_mac.sh`) เทียบเกณฑ์ P1–P6 แล้วบันทึกเลขใน LOG
- [ ] G8. 👤🤖 รัน `node scripts/validate_scoring.mjs` กับ WF_Demo + Gemini จริง → `evidence/scoring_validation_<วันที่>.md` · ถ้าไม่ผ่าน K1/K2/S1/T3 ส่งผลให้ Claude ปรับ (เกณฑ์ใน DEC-57)
- [ ] G9. 👤 ทดสอบเรซูเมจริงของตัวเองใน Demo อีกครั้ง (R19 vs R15) แล้วบันทึกเลขใน LOG
- [ ] G10. 👤 ผู้ให้ป้ายคนที่ 2 สำหรับ Gold-R3 → `node scripts/r3_gold.mjs eval` (κ) · ใส่ผลในตาราง 3.18
- [ ] G11. 👤 อาจารย์ยืนยัน R6 (DEC-54) และเกณฑ์ผ่าน DEC-57
- [ ] G12. 👤🤖 ทดสอบ workflow 79 โหนดใน n8n 2.39.9 จริง (ปรับ `evidence/n8n_s6/` ให้มี case D + mock verifier) → แทน `evidence/n8n_test_01OCT26.md`
- [ ] G13. 👤 สเปรดชีตจริง: เพิ่มแท็บ `role_task_decisions` + คอลัมน์ใหม่ (หรือสร้างใหม่จาก `sheets_import/IS68076026_Sheets_Template.xlsx` 17 แท็บ)
- [ ] G14. 👤 เปิด `build/IS_68076026_Final_03OCT26.docx` ใน Word → อัปเดตฟิลด์ สารบัญ เลขตาราง 3.18–3.21

---

## ขั้น 0: งานค้างจาก Final_IS 1 ต.ค. 2569 (Prompt_Report v2.0) · ทำก่อน

- [ ] F1. 👤 เปิดตรวจรายการเรียนรู้ใหม่ 14 รายการใน `data/corpus_additions.csv` (ชื่อ ผู้ให้บริการ ชั่วโมง ราคา เนื้อหา) แล้วกรอก `researcher_result` = LIVE/OK หรือเหตุผลที่ไม่ผ่าน · ตัดองค์ประกอบที่ไม่เห็นด้วยในคอลัมน์ `elements` ได้
- [ ] F2. 👤 ยืนยัน URL 28 รายการใน `data/url_manual_check.csv` (Claude บันทึกผลเปิดหน้าไว้ในคอลัมน์ note แล้ว)
- [ ] F3. 👤 ยืนยัน DEC-45 (ใช้รายการพื้นฐานกับทุกอาชีพที่มีองค์ประกอบเดียวกัน) · ย้อนได้ด้วย `--foundation-uncovered-only`
- [ ] F4. 🤖 หลัง F1–F3: `python scripts/build_data_all.py && bash scripts/run_all_checks.sh && python scripts/build_book.py && python scripts/export_pdf.py && python scripts/check_docx_format.py && python scripts/check_overlap.py` → Gate G-600 · commit + tag `gate-600`
- [x] F5. 🤖 ทดสอบใน n8n 2.39.9 จริงกับบริการจำลอง → `WF_IS_68076026_01OCT26.json` (DEC-48) · ผลใน `evidence/n8n_test_01OCT26.md` · 3.6.3 ใส่ผลแล้ว
- [ ] F5b. 👤 นำเข้า `workflows/WF_IS_68076026_01OCT26.json` ใน n8n บนเครื่อง (ทับรุ่นเดิมได้ เพราะ id เดียวกัน) · credential googleApi เปิด "Set up for use in HTTP Request node" + scope · env `N8N_CONCURRENCY_PRODUCTION_LIMIT=1`, `N8N_API_URL` · ทดสอบกับบัญชี Google จริง (Setup Guide ข้อ 5)
- [ ] F6. 👤 (แทนด้วย G14 · ฉบับ 03OCT26) เปิด `build/IS_68076026_Final_01OCT26.docx` ใน Word → ยืนยันอัปเดตฟิลด์ → ตรวจสารบัญ เลขหน้า สมการ
- [ ] F7. 👤 หาผู้เชี่ยวชาญ IOC 3 คน (ภาคผนวก ช) · ยื่นจริยธรรม · remote backup (ข้อ 2–3)

---

## ขั้น 1: กันไฟล์หายซ้ำ (R0) · ต้องเสร็จก่อนงานอื่น

- [ ] 1. 👤 zip โฟลเดอร์ที่กู้มา + `Final_IS` เก็บ 2 แห่ง (OneDrive + ไดรฟ์ภายนอก)
- [x] 2. 👤 สร้าง GitHub repo `IS68076026` · `porlizm/IS68076026` (02OCT26)
- [x] 3. 🤖 สร้าง `Final_IS/` + git init + `.gitignore` + PDF ฐานที่ `docs/baseline/` (sha256 `216d76be…99be6`, read-only) + `source/` + `archive/MOVE_LOG.csv` + commit แรก + tag `r0-01OCT26` — push ขึ้น `git@github.com:porlizm/IS68076026.git` แล้ว (HEAD `7d3ee99` ตรงกับเครื่องเดิม) · clone บน MacBook ที่ `~/Documents/Final_IS` แล้ว (03OCT26)
- [x] 4. 🤖 ตรวจ corpus v1.3: 499 / 6,780 / L1 1,956 / 479 ข้อ ✔ (DEC-27)
- [ ] 5. 👤 ใช้ `docs/session_end_checklist.md` ทุกครั้งที่จบ session
- [ ] 6. 👤 ตั้ง Claude Desktop ให้เปิดงานใน Project "Research ITM" แล้วลิงก์โฟลเดอร์ `Final_IS`

**Gate G0′** remote backup ✔ (GitHub) · PDF เป็นฐาน ✔ · ⏳ ยังเหลือสำเนา OneDrive + ไดรฟ์ภายนอก (ข้อ 1)

---

## ขั้น 2: เส้นทางวิกฤต (E + การตัดสินใจ)

- [ ] 7. 👤 ส่งอีเมล `docs/Advisor_Email.md` + แนบเล่มล่าสุด (PDF) + ร่างจริยธรรม 6 ฉบับ
- [ ] 8. 👤 **ตอบ D0 ว่าสอบแล้วหรือยัง** ถ้ามีข้อเสนอแนะกรรมการ ส่งให้ Claude จัดลำดับใหม่
- [ ] 9. 👤 อบรมจริยธรรมการวิจัยในมนุษย์ (ถ้ายังไม่ได้ทำ)
- [x] 10. 🤖 เขียนเอกสารจริยธรรม 6 ไฟล์ใหม่ใน `docs/ethics/` ตามขอบเขตที่ลดลง (DEC-61) · เหลือ 👤 กรอกช่อง [กรอก: ...] (อีเมลติดต่อ เบอร์ ข้อมูลคณะกรรมการ นโยบายผู้ให้บริการ)
- [x] 11. 🤖 DEC-27 พร้อม sha256 จริงของ PDF และคลัง v1.3
- [ ] 12. 👤 ยืนยัน D0–D5 กับอาจารย์ → แก้ DEC-28–33 จาก "ผู้วิจัยเลือก" เป็น "อาจารย์ยืนยัน (วันที่)"
- [ ] 13. 👤 อาจารย์ตรวจเอกสารจริยธรรม → **ยื่นภายในสัปดาห์ที่ 2 ของ ต.ค.** → Gate G1

---

## ขั้น 3: ข้อมูลอ้างอิง (D)

- [x] 14. 🤖 `data/requirements.csv` 600 แถว 343/104/77/76 · wsp 0.5128–0.9749 · ตรง onet_requirements ทุกแถว (`tests/data.test.mjs`)
- [x] 15. 🤖 `data/roles.json` 20 อาชีพ + proxy 5 บทบาท (R03 R07 R08 R16 R17)
- [ ] 16. 👤 **ตรวจ URL 28 รายการ (36 แถว)** ใน `data/url_manual_check.csv` ด้วยเบราว์เซอร์ ห้ามเดา → `python scripts/build_data_all.py` → `bash scripts/run_all_checks.sh` → `python scripts/build_book.py`
- [x] 17. 🤖 v1.5R = 571 / 6,883 / L1 2,076 / 599 ข้อ (DEC-29) · REQ-R14-4.A.3.b.5 ไม่ปิด (มีตัวเลือก `--close-r14-repair`)
- [x] 18. 🤖 `data/mapping_review.csv` ตาม C1–C5 → ผ่าน 1,942 แถว · ระบบหยุดถ้าไฟล์หายหรือ < 90% ของ L1 ที่ตรวจ (DEC-21)
- [x] 19. 🤖 `data/manifest.json` (8 ไฟล์ sha256, frozen=false) + `sheets_import/` 16 แท็บ

---

## ขั้น 4: ระบบ (S)

- [x] 20. 🤖 S1 engine — `tests/rules|plan|intake_text|pipeline.test.mjs`
- [x] 21. 🤖 S2 `prompts/analyst_v1.0.txt` + schema
- [x] 22. 🤖 S3 synthetic A/B/C (C = PDF สแกน + โมเดล C ตอบ 429 × 3)
- [x] 23. 🤖 S4 5 workflow 17/11/13/13/6 + build + validator · B1–B11 เป็นเทสต์ · retry 2 ครั้ง
- [x] 24. 🤖 S5 `config/` + `env_template.env` + `docs/Setup_Guide.md`
- [x] 24b. 🤖 DEC-37 รวมเป็น workflow เดียว `workflows/WF_Final_IS.json` (59 node) · validator + tests 51/51
- [ ] 25. 👤🤖 S6 นำเข้า n8n 2.39.9 + บริการจำลอง → `evidence/S6_n8n_test_<วันที่>.md` → **Gate G1-sys** · ใช้ `WF_Final_IS.json` ไฟล์เดียว และทดสอบเพิ่ม: ฟอร์ม 2 แถวในรอบ poll เดียว (ลูปต้องทำครบ 2 งาน) · ทำให้ล้มกลางทาง (Error Trigger ในไฟล์ต้องบันทึก run_id ถูกงาน)
- [ ] 25b. 👤 ตัดสินผลต่อเล่มของ DEC-37: แก้ 3.4/ตาราง 3.9 เป็น "workflow เดียว 5 ส่วน" หรือคงชุด 5 ไฟล์ · ✅ ย้ายชุด 5 ไฟล์เข้า `archive/01OCT26/workflows_5wf_DEC-30/` แล้ว (DEC-38)

## ขั้น 4 (ขนาน): เล่ม (B)

- [x] 26. 🤖 B1–B2 `book/*.md` + 24 รูป + สมการ → `scripts/build_book.py` → `build/IS_68076026_latest.docx` · ข้อความหายจาก PDF = 0 ย่อหน้า
- [x] 27. 🤖 B3 ข้อบกพร่อง 4 ข้อ (DEC-36) — *เหลือ 👤* ยืนยันการสะกดชื่อเรื่อง "เรซูเม/เรซูเม่" กับที่ลงทะเบียนกับคณะ
- [ ] 27b. 👤 เปิด docx ใน Word → อัปเดตสารบัญ (F9) → ตรวจหน้าตา ตาราง สมการ เลขหน้า

## ขั้น 4 (ขนาน): เครื่องมือวิจัย (I)

- [x] 28. 🤖 `docs/research_tools/Coding_Manual.md` และ `Analysis_Plan.md` เขียนใหม่ (actor, LV, R5/R6, ผู้ให้รหัสคนเดียว, องค์ประกอบ, เกณฑ์ความตรง)
- [ ] 29. 👤 อาจารย์ตรวจแบบประเมิน 5 ข้อ (`docs/research_tools/Questionnaire.md`) แทน IOC แล้วบันทึกวันที่และข้อเสนอแนะ
- [x] 30. 🤖 `analysis/` (metrics, bootstrap 2,000, coding sheets blind แบบให้รหัสซ้ำ, component_analysis, synthetic 30+5) · tests 11/11

---

## ขั้น 5: บริการจริงและปิดเล่ม (P1 + B4–B6)

- [ ] 31. 👤 Google Cloud (Document AI, Sheets, Drive, Gmail) + credential + Google Form ตาม `docs/Setup_Guide.md` ข้อ 3
- [ ] 32. 👤🤖 Smoke test โมเดลจริง 3 ราย + **ทดสอบ temperature 0** → `config/models.json verified` + ตาราง 3.8
- [ ] 33. 👤🤖 รันครบทางจากฟอร์มถึงอีเมลด้วยเรซูเมสังเคราะห์ 3 ฉบับ → **Gate G2-sys**
- [x] 34. 🤖 B4 แก้เล่มตาม D1/D4 + κ + PDPA + การเก็บข้อความ (ถ้าอาจารย์ไม่ยืนยัน ย้อนกลับตาม DEC-29/32)
- [ ] 35. 🤖 B5 ใส่ผลจริงในตาราง 3.1 (S6), 3.8 (P1) → B6 export PDF → 👤 ส่งอาจารย์

---

## ขั้น 6: หลังได้หนังสือรับรองจริยธรรม (G2) · พ.ย. เป็นต้นไป

- [ ] 36. P3 นำร่อง 5 คน → ปรับ → เอกสาร v1.0 → **FREEZE** (`python scripts/update_manifest.py --freeze` + `git tag freeze-v1.0`)
- [ ] 37. P4 เก็บข้อมูลหลัก 30 คน
- [ ] 38. P5 ให้รหัสแบบ blind (κ ≥ 0.61)
- [ ] 39. P6 วิเคราะห์ RQ1/RQ2 (`analysis/run_analysis.py`)
- [ ] 40. P7 บทที่ 4–5

---

### สิ่งที่ขวางทางอยู่ตอนนี้
1. **remote backup** (ข้อ 2–3) — ทำวันนี้
2. คำตอบ **D0 / ยืนยัน D1** จากอาจารย์ (ข้อ 8, 12)
3. **ยื่นจริยธรรม** (ข้อ 13) — งานกับคนจริงทั้งหมดรอสิ่งนี้
4. URL 36 แถว (ข้อ 16) — ต้องเสร็จก่อน freeze

- [ ] N1. 👤 เปิด build/IS_68076026_Final_03OCT26.docx ใน Word ตรวจจำนวนหน้าจริง (ประมาณ 74) แล้ว export PDF (export_pdf.py ใช้ไม่ได้ในเครื่องนี้)
- [ ] N2. 🤖 แก้ check_docx_format เทียบ corpus_version จาก numbers.json และจัดการคำ "ข้อกำหนด" 11 จุด · ตรวจ overlap 11 จุด · ตรวจเอกสารที่อ้างตัวอักษรภาคผนวกเดิม (เช่น "ภาคผนวก ช")
- [ ] N3. 👤 ใส่รูปรายงานกรณี A ในภาคผนวก ฏ (ยังไม่ได้ทำ)
- [ ] N4. 👤 ตัดสินใจ H6 ข้อความเปิดเผยการใช้ AI (ตาราง ค.2 เทียบ "ผู้ช่วยวิจัย")
- [ ] N5. 🤖 เขียนปิดช่องโหว่ H1/H2 ตาม docs/Gap_Report_04OCT26.md หัวข้อ 7 ข้อ 4–5 (DEC-64) แล้วต่อด้วยข้อ 6–10
