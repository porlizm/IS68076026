# Final_IS · IS 68076026

**กรอบการทำงานปัญญาประดิษฐ์เชิงสร้างสรรค์แบบหลายโมเดล เพื่อลดความคลาดเคลื่อนของข้อมูลในการวิเคราะห์ช่องว่างทักษะจากเรซูเม และการกำหนดเส้นทางการเรียนรู้เฉพาะบุคคล**
ดนุสรณ์ อนันตกาล (68076026) · อาจารย์ที่ปรึกษา ผศ.ดร. สุภกิจ นุตยะสกุล · ITM · KMITL

โฟลเดอร์งานที่สร้างใหม่ทั้งหมดเมื่อ 1 ต.ค. 2569 จากเล่มฉบับขอสอบ (PDF 21 ก.ย.) + Data_Set.xlsx + คลัง v1.3 ที่กู้ได้ (DEC-27) · ทุกไฟล์ใน `data/`, `workflows/`, `sheets_import/`, `evidence/` และเล่ม docx **สร้างซ้ำได้ด้วยสคริปต์**

## เริ่มตรงไหน
1. `NEXT_STEPS.md` — งานที่เหลือเรียงลำดับ (👤 ผู้วิจัย · 🤖 Claude)
2. `docs/LOG.md` — ทำอะไรไปแล้ว และทำต่อจากตรงไหน
3. `CLAUDE.md` — กติกาสำหรับ Claude ทุก session
4. `docs/Setup_Guide.md` — ติดตั้ง n8n / Google / ทดสอบ

## โครงสร้าง
```
Final_IS/
├─ CLAUDE.md · README.md · NEXT_STEPS.md · package.json · requirements.txt · .gitignore
├─ docs/
│  ├─ baseline/          PDF ฉบับขอสอบ (read-only) + SHA256.txt
│  ├─ DECISIONS.md       ทะเบียน DEC-01–36
│  ├─ LOG.md · Plan_IS_30SEP26.md · Spec_Acceptance_Checklist.md · Setup_Guide.md
│  ├─ Advisor_Email_D0-D5.md · Project_Docs_Index.md · session_end_checklist.md
│  ├─ ethics/            เอกสารจริยธรรม 6 ไฟล์ (ร่าง v1.0)
│  ├─ research_tools/    Coding Manual · Analysis Plan · Questionnaire+IOC (ร่าง v1.0)
│  └─ reference/         เอกสารเดิมที่ใช้อ้างอิง (DECISIONS_31AUG26, START_HERE)
├─ source/               ต้นทางที่ห้ามแก้ (project_files/ + recovered_31AUG-09SEP/)
├─ data/                 requirements 600 · roles 20 · aliases · corpus 571 · mappings 6,883 · mapping_review · manifest (8 ไฟล์ sha256)
├─ sheets_import/        CSV + XLSX 16 แท็บสำหรับสเปรดชีตฐานข้อมูล
├─ engine/engine.js      ตรรกะเดียว (R0–R4, สมการ 3.1–3.8, จัดแผน, รายงาน, อีเมล)
├─ prompts/              analyst_v1.0 + JSON schema
├─ config/               project · models · sheets · pricing · env_template.env
├─ workflows/            WF_Final_IS 59 (ไฟล์เดียว · แนะนำ · DEC-37) · ชุดเดิม Main 17 · GapEngine 11 · Decide 13 · Deliver 13 · Error 6 + src/ + manifest
├─ synthetic/            เรซูเมสังเคราะห์ 3 กรณี (เฉลย · PDF ข้อความ/สแกน · ผลตอบกลับจำลอง)
├─ tests/                Node test 51 กรณี (engine · data · pipeline · workflow sandbox บั๊ก B1–B11)
├─ analysis/             metrics · bootstrap · coding_sheets · run_analysis · ข้อมูลซ้อม 30+5 · tests 8 กรณี
├─ book/                 เล่มเป็น Markdown (ต้นฉบับ) + figures 24 รูป + baseline_21SEP26 (ฉบับถอดเทียบ)
├─ scripts/              สร้างข้อมูล · คลัง · manifest · workflow · validator · เล่ม · ตรวจทั้งหมด
├─ evidence/             ผล run_local · mapping review · coverage simulation · test report · การแก้เล่ม
├─ build/                docx ที่สร้าง (ไม่เข้า git)
├─ archive/MOVE_LOG.csv  · private/ (ไม่เข้า git)
```

## คำสั่งหลัก
```bash
python scripts/build_data_all.py       # data/ + sheets_import/ + manifest จาก source/
bash   scripts/run_all_checks.sh       # manifest · run_local · coverage · workflows · tests · analysis · numbers
node   scripts/build_workflows.mjs     # สร้าง workflow ใหม่หลังแก้ engine หรือ workflows/src
python scripts/build_book.py           # เล่ม -> build/IS_68076026_latest.docx
```

## สถานะ (1 ต.ค. 2569)
| ส่วน | สถานะ |
|---|---|
| ข้อมูลอ้างอิง | ✅ สร้างแล้ว · ⏳ URL 28 รายการ (36 แถว) รอผู้วิจัยตรวจด้วยตา |
| engine + tests | ✅ 46/46 · analysis 8/8 |
| workflow 5 ไฟล์ | ✅ validator ผ่าน · ⏳ S6 ทดสอบใน n8n จริง |
| เล่ม | ✅ Markdown + docx · ⏳ อาจารย์ยืนยัน D1/D4 · ตรวจหน้าตาใน Word |
| จริยธรรม | ✅ ร่าง 6 ไฟล์ · ⏳ ผู้วิจัยกรอกช่อง ⚠ → อาจารย์ตรวจ → ยื่น |
| backup | ⏳ ต้องสร้าง GitHub private + push (NEXT_STEPS ข้อ 2–3) |
