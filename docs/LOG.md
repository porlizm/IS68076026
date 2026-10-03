# LOG: IS 68076026 (บันทึกความคืบหน้าและจุดทำต่อ)

> ไฟล์นี้คือจุดเริ่มของทุก session ให้อ่านหัวข้อ **ทำต่อจากตรงนี้** ก่อน
> อัปเดตล่าสุด: 3 ต.ค. 2569 · ระยะปัจจุบัน: **แก้ Gap_03OCT26 ครบ (engine 2.0 · DEC-51–58) · เล่ม 84 หน้า · รอทดสอบกับ Gemini/โมเดลจริง + ผู้ให้ป้ายคนที่ 2 + G-600 + จริยธรรม**
> ประวัติถึง 23 ก.ย. อยู่ใน Project `claude/LOG_Final_IS.md`

---

## ▶ ทำต่อจากตรงนี้

0. 👤 ถ้าใช้ MacBook: คัดลอก `.env` + `private/` จากเครื่อง Windows · `python3 -m venv ~/venv_is` ตาม Setup_Guide ข้อ 0
1. 👤🤖 **T1 (DEC-57)** เปิด WF_Demo รุ่นใหม่ (`node demo/build_wf_demo.mjs .` → `bash demo/run_demo_mac.sh`) แล้วรัน `node scripts/validate_scoring.mjs` (ค่าเริ่มต้น `--base http://localhost:5678/webhook`) กับ Gemini จริง → `evidence/scoring_validation_<วันที่>.md` · ลองเรซูเมจริงของผู้วิจัยซ้ำ (R19 ต้องสูงกว่า R15)
2. 👤 ให้ป้าย Gold-R3 คนที่ 2 (`evidence/r3_gold/gold_pairs_synthetic.csv` + ชุดจริงใน `private/`) → `node scripts/r3_gold.mjs eval`
3. 👤 อาจารย์ยืนยัน DEC-54 (R6) และเกณฑ์ผ่าน DEC-57 · ทำ NEXT_STEPS ขั้น 0 (F1–F3) → 🤖 F4 Gate G-600
4. 👤🤖 นำเข้า `WF_IS_68076026_01OCT26.json` รุ่น 79 โหนดใน n8n จริง (บริการจำลอง `evidence/n8n_s6/` ต้องเพิ่ม case D + mock verifier) · สเปรดชีตเพิ่มแท็บ `role_task_decisions` และคอลัมน์ใหม่ (นำเข้า `sheets_import/` ใหม่)

---

## ประวัติ session

### 3 ต.ค. 2569 · แก้ Gap_03OCT26 ทั้งระบบ (engine 2.0 · DEC-51–58)
- **ที่มา** Demo ให้เรซูเมจริงของผู้วิจัย (IT PM) ได้ R19 = 10 แต่ R15 = 11 · วิเคราะห์ใน `docs/Gap_03OCT26.md`: ข้อสรุปจริง 36 ข้อ ถูก R3 ตัด 27 · R3 แบบคำซ้ำมี recall 0.24 (สังเคราะห์ 0.72) เพราะเรซูเมเขียนแบบผลงาน ไม่ใช่ภาษา O*NET · quote ถูกเปลี่ยนรูปคำ · ไม่มีหลักฐานใบรับรอง/ทักษะพื้นฐาน · ข้อกำหนด 30 ข้อซ้ำกันระหว่างอาชีพ 19/30 · แผนแนะนำคอร์ส Beginner ให้คนมีประสบการณ์ · "หลังเรียนจบ → 100" เกินจริง · ไม่มีชุดตรวจความตรง
- **ทำ (ระบบ)** `engine-2.0.0-03OCT26` · กฎ R0 → R2 (ตรง/ช่องว่าง/ซ่อม LCS ≥ 0.9) → R3a (คำซ้ำ + stemming θ 0.15) → R3b (โมเดลอื่นตรวจความหมาย A→B→C→A · verifier_v1.0 · ไม่มีคำตอบ = unverified ไม่นับ) → R1 → R4 → R5 ใบรับรอง / R6 Essential Skills ผ่าน O*NET → ดัชนี T (งาน Core 8 งาน) และ H (Hot Technology) · ablation (lexical-only, no-R3) · prompt `analyst_v1.1` (+schema, เก่าไป archive) · max output 16,384 / verifier 4,096 · แผนกรองระดับ (≥ 5 ปี ไม่ใช้ Beginner กับ partially) · รายงาน `report-v2.0`
- **ทำ (ข้อมูล)** `scripts/build_role_signals.py` → `data/role_tasks.csv` 160 · `role_technology.csv` 375 · `skill_links.csv` 232 · manifest 11 ไฟล์ · Sheets 17 แท็บ (+`role_task_decisions`, คอลัมน์ใหม่ใน runs/model_calls/findings/decisions/ref_corpus)
- **ทำ (workflow)** `WF_IS_68076026_01OCT26.json` 69 → **79 โหนด** (Prepare Relevance Checks → Call Verifier A/B/C → Collect → Apply Rules R0–R6 → task rows) · validator + traceability 39 แถว 79/79
- **ทำ (Demo · DEC-58)** ฝัง engine ทั้งไฟล์ · Gemini วิเคราะห์ 3 รอบ (โหวต R1) + Gemini Verifier · ป้าย "ยังยืนยันไม่ได้" เมื่อ C < 0.6 · ตัด "หลังเรียนจบ → 100" · การ์ด T/H · Open Learner Model (ผู้ใช้เพิ่มข้อความหลักฐาน) · Playwright ผ่าน
- **ทำ (ตรวจความตรง · DEC-57)** `scripts/make_validation_resumes.py` (4 อาชีพ × 3 สไตล์) · `scripts/validate_scoring.mjs` (K1 K2 S1 T3) · `scripts/r3_gold.mjs` (82 คู่สังเคราะห์) · `evidence/r3_gold/summary_03OCT26.json` · กรณีสังเคราะห์ D (เรซูเมแบบผลงาน): R 88.14 เทียบ lexical-only 31.48
- **ทำ (เล่ม)** บท 3 หัวข้อ 3.1.3, 3.3, 3.4.2–3.4.6 (ตาราง 3.12 กฎ 7 ข้อ), 3.5.2, 3.6 (4 กรณี + 3.6.4 ตาราง 3.18 ชุดตรวจความตรง · เลขตารางเดิม 3.18–3.20 → 3.19–3.21), 3.7.4, 3.9 · บทคัดย่อ · ภาคผนวก · fact sheet · รูป 4 รูป → `build/IS_68076026_Final_03OCT26.docx/.pdf` 84 หน้า · format 33/33 · overlap 0 · Source_Trace 118 key · `evidence/QA_Final_03OCT26.md` (QA 01OCT26 ไป archive)
- **ผล** tests 78/78 · run_all_checks ผ่าน · A 67.72 · B 23.12 · C 43.58 · D 88.14
- **ไม่ได้ทำ/ค้าง** ทดสอบ workflow 79 โหนดใน n8n จริง (harness `evidence/n8n_s6/` ยังเป็นรุ่น 69 โหนด ต้องใช้ Node 24) · ยังไม่ได้รันกับ Gemini/โมเดลจริง (ต้องใช้ API key บนเครื่องผู้วิจัย) · ป้าย Gold-R3 เป็นของ Claude คนเดียว · ตัวเลขในเล่มเป็นผลจากกรณีสังเคราะห์และ oracle ระบุชัดในเล่มแล้ว
- **ข้อมูลส่วนบุคคล** ข้อความเรซูเมจริงอยู่ใน `private/gap_03OCT26_sim/` เท่านั้น (ไม่เข้า git)

### 3 ต.ค. 2569 · คู่มือและสคริปต์เปิด WF_Demo บน n8n ในเครื่อง (macOS)
- **ทำ** `demo/run_demo_mac.sh` (ตรวจ Node ≥ 24 → หยุด n8n ที่พอร์ต 5678 → สร้าง credential Gemini/Drive เฉพาะที่ยังไม่มี ด้วย id `REPLACE_*_CRED` ที่ workflow อ้าง → import + publish `is68WFDemo000001` → start ที่ 127.0.0.1 → รอ webhook 200 → เปิดเบราว์เซอร์) · `demo/Setup_wf_demo.md` คู่มือ 12 หัวข้อ (Node 24, Gemini key, สคริปต์, owner, Drive OAuth, ทดสอบ, ใช้งานซ้ำ, แก้ค่าตั้ง, PDPA, แก้ปัญหา, Windows) · ชี้จาก `README_Demo.md` · `.gitignore` เพิ่ม `demo/n8n_demo.log`
- **พบ** n8n 2.39.9 ต้องการ Node **≥ 24** (Node 22 ไม่เริ่ม) · webhook ลงทะเบียนหลัง `/healthz` ตอบ ok ราว 2–10 วินาที (ต้องรอหน้า Demo 200 ไม่ใช่แค่ healthz) · isolated-vm มีไฟล์สำเร็จรูป darwin-arm64 สำหรับ Node 24 · `gemini-3.8-flash` เป็น GA รับ thinkingLevel low/medium/high (ไม่รับ minimal) และไม่ควรส่ง temperature (ตรงกับ Demo)
- **ทดสอบ** บนคลาวด์ (Linux · Node 24.21 · n8n 2.39.9 · `~/.n8n` ว่าง): รันครั้งแรก → หน้า 200 · POST analyze R19/12/10 → 200 (กฎสำรอง: readiness 29.38 · แผน 12) · รันซ้ำไม่ทับ credential
- **ไม่ได้แตะ** engine · workflow · เล่ม · ข้อมูล (ไม่ต้องมี DEC)
- **ค้าง** 👤 ติดตั้ง Node 24 บน Mac → รันสคริปต์ → ซ้อมตาม `Setup_wf_demo.md` หัวข้อ 6.2 กับ Gemini จริง (+ Drive OAuth ถ้าจะโชว์) แล้วบันทึกผล

### 3 ต.ค. 2569 · ย้ายมาทำงานบน MacBook (Cowork)
- **ทำ** push ขึ้น GitHub `porlizm/IS68076026` จาก Windows สำเร็จ · clone (HTTPS) ลง MacBook · `run_all_checks.sh` ผ่านทั้งหมด (manifest 8 · tests 65 · analysis 8 · coverage 598/600) · เพิ่ม `pulp` ใน `requirements.txt` (สคริปต์ `coverage_diagnostics.py` ใช้แต่ไม่ได้ประกาศ) · เพิ่มหมายเหตุ macOS/virtualenv ใน `docs/Setup_Guide.md` · ติ๊ก NEXT_STEPS ข้อ 2–3
- **พบ** `evidence/test_report.tap` ถูกเขียนทับทุกครั้งที่รันเช็ก (เปลี่ยนเฉพาะ duration_ms) ทำให้ `git status` ไม่สะอาด · ใช้ `git checkout evidence/test_report.tap` ก่อน commit
- **ไม่ได้แตะ** เนื้อหาเล่ม ข้อมูล engine workflow (ไม่ต้องมี DEC)
- **ค้าง** remote เป็น HTTPS บน Mac ต้องล็อกอิน GitHub ตอน push ครั้งแรก · สำเนาสำรอง OneDrive/ไดรฟ์ภายนอก

### 1 ต.ค. 2569 · Phase 3–5 Final_IS (Prompt_Report v2.0)

- **ทำ** เขียนเล่มใหม่ทั้งเล่ม `book/00_front.md`–`05_appendix.md` จาก fact sheet + numbers.json (DEC-44) · เอกสารอ้างอิง 23 รายการ ตรวจมีจริง (IEEE ตามลำดับอ้าง) · เพิ่ม key `cov_24m_note`, `cov_plan_cf`, `ilp_max_cov_now`, `additions_table` และฉาก `before_track` ใน simulate_coverage/coverage_diagnostics ให้ย่อหน้าวินิจฉัยคงที่หลังผู้วิจัยยืนยันรายการ
- **สคริปต์ใหม่** `build_book.py` (เขียนใหม่ตามหัวข้อ 9 · section ต่อบท · ฝังฟอนต์ · สมการตาราง 1×3 · ความกว้างคอลัมน์ตามข้อความ) · `export_pdf.py` (LibreOffice UNO อัปเดตสารบัญ) · `check_docx_format.py` (33 ข้อ) · `check_overlap.py` (≥ 40 อักขระ) · `source_trace.py`
- **พบ** ความซ้ำกับเล่มเดิมรอบแรก 195 จุด → เขียนต้นทางใหม่จนเหลือ 0 (ข้อยกเว้นมีเหตุผล 24 ช่วง: คำถามวิจัย/วัตถุประสงค์ แบบประเมิน ข้อความจาก roles.json) · ผู้อ่านทดสอบชี้ว่า 0.967 ในบทคัดย่อชวนเข้าใจผิด → ลบ · ขยายนิยามความครอบคลุมในหัวข้อ 1.6
- **ผล** `build/IS_68076026_Final_01OCT26.docx` + `.pdf` 74 หน้า · format 33/33 · overlap 0 · tests 61/61 · `evidence/QA_Final_01OCT26.md`, `evidence/Source_Trace.md`
- **ค้าง** G-600 ยังไม่ผ่าน (598/538) รอ 👤 ยืนยันรายการใหม่ 14 + URL 28 · ผล n8n จริง · IOC

### 1 ต.ค. 2569 · Session 13 · DEC-48 workflow ใช้งานจริง WF_IS_68076026_01OCT26
**ทำอะไร** ติดตั้ง n8n 2.39.9 + Node 24 บนคลาวด์ · บริการจำลอง Google/โมเดล (`evidence/n8n_s6/`) · นำเข้า WF_IS68076026 (DEC-42) แล้วรันจริง → พบ 7 จุด → แก้ใน build (ไม่แตะ engine) → `workflows/WF_IS_68076026_01OCT26.json` 69 โหนด · รันชุดทดสอบใน n8n จริงซ้ำ (ผลใน `evidence/n8n_test_01OCT26.md`) · tests 65/65 · traceability ครบ · เล่ม 3.1/3.3.2/3.3.5/3.6.3 + ตาราง 3.9
**พบอะไร** สำคัญที่สุด: task runner ของ n8n 2.x ทำให้รหัส HTTP ของ error หาย ระบบรุ่นก่อนจึงไม่เรียกซ้ำเมื่อ 429 (เทสต์ sandbox ผ่านเพราะ mock ใส่รหัสให้) · ระหว่างทดสอบ บริการจำลองที่ฟัง 127.0.0.1:443 ทำให้สะพานไปเครื่องผู้วิจัยใช้ไม่ได้ (แก้โดยใช้ 127.0.0.2 และ /etc/hosts เฉพาะ process ของ n8n)
**ค้าง** 👤 ทดสอบกับบัญชี Google/โมเดลจริง (F5b, ข้อ 31–33) · build เล่ม docx ใหม่ (ตัวเลข {{key}} อัปเดตแล้วใน numbers.json)

### 1 ต.ค. 2569 · Session 12 · Phase 2 workflow เดียว WF_IS68076026
**ทำอะไร** `buildSingle` → `workflows/WF_IS68076026.json` 63 โหนด 7 ช่วง · `validateSingle` + `check_traceability.mjs` (32 แถว ครอบคลุม 63/63 โหนด) · `tests/single_workflow.test.mjs` (A/B/C ตรง engine · สองแถวต่อ poll · ล้มกลางลูป · โมเดลล้มครบ · อัปโหลดล้มแต่อีเมลสำเร็จ · ไฟล์เกินขนาด/หน้า · ไม่ยินยอม · ชั้นข้อความ) · tests 61/61 · ย้าย WF_Final_IS ไป archive · `evidence/WF_analysis.md` · `evidence/n8n_test_01OCT26.md` (⏳) · ฟอนต์ TH Sarabun New ใน `assets/fonts/` (ผู้วิจัยอนุญาตดาวน์โหลด) · รูป 3 รูปจาก workflow จริง
**Gate G-WF** ✅ validator + tests ผ่าน · traceability ครบ · ⏳ ผลใน n8n จริงระบุชัดใน evidence

### 1 ต.ค. 2569 · Session 12 · Phase 1 ข้อมูลอ้างอิงและการครอบคลุม 600
**ทำอะไร** รหัสรุ่น `CORPUS_IS68076026-v1.5-01OCT26` (DEC-43) · เปิด URL ค้าง 28 URL ด้วยเบราว์เซอร์ → `note` ใน url_manual_check.csv + `evidence/url_check/url_check_01OCT26.md` (ตรงชื่อ 8 · เปลี่ยนชื่อ/URL ใหม่ 7 · ไม่พบหน้า 4 · ยืนยันไม่ได้ 9) · `scripts/coverage_diagnostics.py` (ILP PuLP/CBC) · DEC-45 foundation map ทุกอาชีพ · DEC-46 รายการใหม่ 14 รายการ (`data/corpus_additions.csv`) · DEC-47 เทียบวิธีเลือก · `simulate_coverage.mjs --what-if` · `scripts/coverage_report.py` → `evidence/coverage_600_01OCT26.md` · numbers.json เพิ่มค่าความครอบคลุม (106 ค่า) และติดตามใน git
**พบอะไร** คลัง 598/600 · แผนจำลอง 489 → 538/600 · ILP ชั่วโมงขั้นต่ำต่ออาชีพ 285–727 ชม. (เกิน Hmax ทุกอาชีพ) · ถ้ายืนยันรายการใหม่ครบ 600/600 ทั้งสองตัวชี้วัด และทุกอาชีพอยู่ใน Hmax
**Gate G-600** ❌ ยังไม่ผ่าน (ไม่ปรับตัวเลข) · ต้องให้ผู้วิจัยยืนยันรายการใหม่ 14 รายการ + URL ค้าง 28 URL · ผู้วิจัยสั่งให้ทำต่อจนได้เล่ม (1 ต.ค.)

### 1 ต.ค. 2569 · Session 12 · Phase 0 ตาม Prompt_Report v2.0 (เขียนเล่มใหม่ทั้งหมด)
**ทำอะไร** commit งานค้าง (pre-Phase-0) · DEC-40–44 · ย้ายร่างเล่มเดิม (`book/0*.md`, `book/figures/`, docx) ไป `archive/01OCT26/book_draft_v0/` + MOVE_LOG · สร้าง `book/00_fact_sheet.md` 180 ข้อ ทุกข้อมีแหล่งที่มา ยาวสุด 205 อักขระ
**พบอะไร** git บนเครื่องลบ lock file ไม่ได้จนได้สิทธิ์ลบในโฟลเดอร์ (ให้สิทธิ์แล้วใน session นี้) · probe ILP: ภายใต้ Hmax 259.8 ชม. แม้เลือกแบบเหมาะที่สุดก็ครอบคลุมได้ราว 496/600 และชั่วโมงขั้นต่ำเพื่อครบ 30 ข้อต่ออาชีพอยู่ที่ 331–1,011 ชม. → ต้องเพิ่มรายการสั้นที่ครอบคลุมหลายข้อ (Phase 1)
**Gate G0** ผ่าน · DEC ครบ · ร่างเดิมอยู่ใน archive · fact sheet ผ่านการตรวจ

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
