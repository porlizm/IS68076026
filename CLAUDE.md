# CLAUDE.md · กติกาการทำงานใน Final_IS (IS 68076026)

> Claude ต้องอ่านก่อนเริ่มทุก session · งาน: *A Multi-Model Generative-AI Framework for Reducing Hallucination in Resume-Based Skill-Gap Analysis and Personalized Learning Pathways* · ผู้วิจัย: ดนุสรณ์ อนันตกาล (68076026) · ITM · KMITL · ภาษาหลัก: ไทย

## เริ่ม session
1. อ่าน `docs/LOG.md` หัวข้อ "ทำต่อจากตรงนี้" แล้ว `NEXT_STEPS.md`
2. ถ้าจะแก้ระบบหรือเล่ม อ่าน `docs/Spec_Acceptance_Checklist.md` และ `docs/DECISIONS.md`
3. `git status` ต้องสะอาด ถ้าไม่สะอาดให้ถามผู้วิจัยก่อน
4. `bash scripts/run_all_checks.sh` ต้องผ่านก่อนเริ่มแก้

## จบ session (ห้ามข้าม)
1. เพิ่มบันทึกใน `docs/LOG.md` (ทำอะไร พบอะไร ค้างอะไร ข้อถัดไป) และติ๊ก `NEXT_STEPS.md`
2. `bash scripts/run_all_checks.sh` ผ่าน
3. `git add -A && git commit -m "<วันที่>: <สรุป>" && git push`
4. เอกสารที่ session บน claude.ai ต้องใช้ ให้บันทึกลง Project "Research ITM"

## แหล่งความจริง
| เรื่อง | ไฟล์ |
|---|---|
| สเปกระบบและเล่มฉบับขอสอบ | `docs/baseline/IS_68076026_ExamSubmission_21SEP26.pdf` (read-only · sha256 ใน `docs/baseline/SHA256.txt`) |
| เล่ม Final (DEC-44) | `book/*.md` (ต้นฉบับ · เขียนใหม่ 1 ต.ค. 2569) → `scripts/build_book.py` → `build/IS_68076026_Final_<DDMMMYY>.docx` → `scripts/export_pdf.py` → `.pdf` |
| ข้อมูลอ้างอิง | `data/` สร้างด้วย `scripts/build_data_all.py` จาก `source/` เท่านั้น |
| ตรรกะ | `engine/engine.js` (ไฟล์เดียว ฝังลง workflow และ WF_Demo) · `engine-2.1.0-03OCT26` |
| ค่าควบคุม | `config/project.json`, `config/models.json`, `config/sheets.json` |
| การตัดสินใจ | `docs/DECISIONS.md` |
| แผน | `docs/Plan_IS_30SEP26.md` + `NEXT_STEPS.md` |

## หมายเหตุ
- `run_all_checks.sh` เขียน `evidence/test_report.tap` และ `evidence/coverage_diagnostics.json` ใหม่ทุกครั้ง → `git checkout` สองไฟล์นี้ก่อน commit ถ้าไม่ได้ตั้งใจเปลี่ยน
- ข้อความเรซูเมจริงของผู้วิจัยใช้ได้เฉพาะใน `private/` (ไม่เข้า git) · ในเล่มใช้ตัวเลขสรุปเท่านั้น

## ห้ามทำ
- ห้ามแก้หรือย้าย `docs/baseline/` และ `source/` (ของต้นฉบับ)
- ห้ามย้าย/เปลี่ยนชื่อไฟล์ Read-only บน Windows (DEC-25) ถ้าจำเป็นให้ `attrib -R` ก่อน
- ห้ามลบไฟล์ ถ้าเลิกใช้ให้ย้ายเข้า `archive/<วันที่>/` และบันทึก `archive/MOVE_LOG.csv`
- ห้ามแก้ workflow JSON หรือ Code node ใน n8n ด้วยมือ → แก้ `engine/engine.js` หรือ `workflows/src/` แล้ว build + validate
- ห้ามแก้ไฟล์ใน `data/` ด้วยมือ หรือเปิด CSV ด้วย Excel แล้ว Save (sha256 จะไม่ตรง manifest) · ยกเว้นกรอก `data/url_manual_check.csv` ด้วยโปรแกรมแก้ข้อความ แล้วรัน `build_data_all.py`
- ห้ามพิมพ์ตัวเลขจากข้อมูลลงเล่มตรง ๆ → ใช้ `{{key}}` จาก `scripts/book_numbers.py`
- ห้าม commit `.env`, `private/` หรือข้อมูลผู้เข้าร่วม
- ห้ามเดา URL ของคอร์ส (DEC-16)
- ห้ามเปลี่ยนเกณฑ์อ่านผล ตัวชี้วัด θ prompt หรือคลังหลัง freeze (P3)

## การเปลี่ยนแปลงที่ต้องมี DEC
แก้เล่ม · เปลี่ยนคลัง/mapping · เปลี่ยน engine/prompt/workflow/schema · เปลี่ยนค่าคงที่ · เปลี่ยนแผน
รูปแบบ: **ปัญหา → การตัดสินใจ → ไฟล์ที่กระทบ → ผลต่อเล่ม → วิธีย้อนกลับ**

## ค่าคงที่ตามเล่ม (อย่าเปลี่ยนเงียบ ๆ)
600 = 20 × 30 · IM ≥ 3.0 · 4 โดเมน 343/104/77/76 · θ = 0.15 · cap 25 · คำพ้อง ≥ 4 ตัวอักษร · โมเดลที่ใช้ได้ขั้นต่ำ 2 · ลำดับกฎ R0 → R2 → R3a/R3b → R1 → R4 → R5/R6 → R7 (DEC-51–54, DEC-60) · ซ่อม quote ≥ 0.9 · prompt analyst_v1.2 + verifier_v1.1 · max output 16,384 (verifier 4,096) · timeout 90 s · retry ≤ 2 (429/timeout) · temperature 0 (รอ smoke test) · Hmax = M × 4.33 × h · L1 ที่ผ่านตรวจเท่านั้น · PDF ≤ 10,485,760 ไบต์ ≤ 5 หน้า · เก็บ 90 วัน · n8n 2.39.9 / Node 24

## คำสั่งตรวจ
```
bash scripts/run_all_checks.sh                 # ทั้งหมด
node --test tests/*.test.mjs                   # engine + data + workflow เดียว + demo (93)
node scripts/validate_workflows.mjs            # WF_IS_68076026_01OCT26 (DEC-48/51) · 79 โหนด
python -m unittest discover -s analysis/tests -t .   # analysis (11)
python scripts/build_book.py --check           # เล่ม: ไม่มี {{key}}/[@key] ค้าง ภาพ/สมการ/อ้างอิงครบ
python scripts/check_docx_format.py            # รูปแบบตาม Prompt_Report หัวข้อ 9–10 (33 ข้อ)
python scripts/check_overlap.py                # ความซ้ำกับเล่มเดิม ≥ 40 อักขระ ต้อง 0
python scripts/source_trace.py                 # evidence/Source_Trace.md
node demo/build_wf_demo.mjs .                  # demo/WF_Demo.json (engine ทั้งไฟล์ · DEC-58)
node scripts/r3_gold.mjs eval                  # Gold-R3 (DEC-57)
node scripts/validate_scoring.mjs              # ความตรงของคะแนนกับ WF_Demo + Gemini จริง (DEC-57)
```

## สไตล์เอกสาร
ภาษาไทยเป็นหลัก · "เรซูเม" (รอยืนยันกับชื่อที่ลงทะเบียน) · "คอลัมน์" แทน "เขตข้อมูล" · JSON ใช้ "ฟิลด์" · ชื่อไฟล์ลงท้าย `DDMMMYY` เมื่อเป็นเอกสารรายวัน · หนึ่งประเภทเอกสารมีฉบับปัจจุบันได้ไฟล์เดียว
