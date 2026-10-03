# Setup Guide · ติดตั้งและทดสอบระบบ (S5–S6, P1)

> ใช้กับ n8n 2.39.9 · Node.js 24 · Windows (PowerShell) หรือ macOS/Linux · ทุกค่าลับอยู่ใน `.env` เท่านั้น

## 0. เครื่องมือในเครื่อง
| เครื่องมือ | ใช้ทำ | ตรวจ |
|---|---|---|
| Node.js ≥ 22 (แนะนำ 24) | เทสต์ engine/workflow · n8n | `node -v` |
| Python ≥ 3.10 + `pandas openpyxl python-docx pymupdf reportlab pythainlp pulp` | สร้างข้อมูล เล่ม และวิเคราะห์ | `pip install -r requirements.txt` |
| pandoc ≥ 3 | สร้างเล่ม docx | `pandoc --version` |
| ฟอนต์ TH Sarabun New | เปิดเล่มใน Word | — |
| git + GitHub private repo | backup (บังคับ) | `git remote -v` |

**macOS / Linux:** ใช้ virtualenv แทนการติดตั้งลงระบบ · `python3 -m venv ~/venv_is && . ~/venv_is/bin/activate && pip install -r requirements.txt` · ต้องเปิด venv ก่อนรัน `bash scripts/run_all_checks.sh` ทุกครั้ง (สคริปต์เรียก `python3`) · `.env` และ `private/` ไม่อยู่ใน git ต้องคัดลอกจากเครื่องเดิมเอง · `build/` สร้างใหม่ด้วย `scripts/build_book.py`

## 1. ตรวจว่าทุกอย่างสร้างซ้ำได้
```powershell
python scripts/build_data_all.py         # ข้อมูลอ้างอิงทั้งหมดจาก source/
bash scripts/run_all_checks.sh           # หรือรันทีละคำสั่งใน PowerShell ตามไฟล์นั้น
python scripts/build_book.py             # เล่ม -> build/IS_68076026_latest.docx
```

## 2. ตรวจ URL ที่ค้าง (ก่อน freeze)
1. เปิด `data/url_manual_check.csv` (ห้ามเปิดแล้ว Save ด้วย Excel — ใช้ VS Code หรือ LibreOffice แบบ CSV UTF-8)
2. เปิดแต่ละ URL ในเบราว์เซอร์ ถ้าหน้าตรงชื่อรายการ กรอก `researcher_result=LIVE` · ถ้าย้ายที่ กรอก `corrected_url` (https เท่านั้น ห้ามเดา) · ถ้าไม่มีแล้ว `DEAD` + note
3. กรอก `checked_by`, `checked_at` แล้วรัน `python scripts/build_data_all.py` และ `bash scripts/run_all_checks.sh`

## 3. Google Cloud และ Workspace (บัญชีผู้วิจัย)
1. สร้าง GCP project → เปิด Document AI API, Google Sheets API, Google Drive API, Gmail API
2. Document AI → สร้าง processor ชนิด **Document OCR** → จด `GCP_PROJECT_ID`, `DOCAI_LOCATION`, `DOCAI_PROCESSOR_ID`
3. สร้าง service account + JSON key (เก็บใน `private/`, ห้าม commit) · แชร์ให้ service account: สเปรดชีตฐานข้อมูล (Editor) และโฟลเดอร์รับไฟล์ของแบบฟอร์ม (Viewer)
4. สร้างสเปรดชีตจาก `sheets_import/IS68076026_Sheets_Template.xlsx` (17 แท็บ) → จด `SHEET_ID` · ตรวจแท็บ `ref_mappings` ต้องมีแถว `source_checked_by_script` ≥ ค่า `approved_rows` ใน `data/manifest.json` · **ถ้าสร้างสเปรดชีตไว้ก่อน 3 ต.ค. 2569** (engine 2.0 · DEC-51–55) ให้เพิ่มแท็บ `role_task_decisions` และคอลัมน์ใหม่ตามหัวตารางใน `sheets_import/headers/` (runs: `role_task_index`, `tech_match_pct` · model_calls: `call_purpose` · findings: `target_kind` … `final_vote` · decisions: `evidence_source` · ref_corpus: `level`, `exam_code`) หรือสร้างใหม่จากไฟล์แม่แบบแล้วนำเข้าแท็บอ้างอิงซ้ำ
5. Google Forms: เปิด "Collect verified email" + แนบไฟล์ (PDF, 10 MB, 1 ไฟล์) + คำถามตาม `config/sheets.json → form_responses` (ชื่อคอลัมน์ต้องตรงทุกตัวอักษร) · ตัวเลือกอาชีพขึ้นต้นด้วยรหัส เช่น "R01 วิศวกรซอฟต์แวร์…" · ตัวเลือกประเภท "หลักสูตร / ใบรับรอง / ทั้งสองประเภท" · ความยินยอมใช้ข้อความ "ข้าพเจ้ายินยอมตามข้อ 1 และข้อ 2" · ผูกคำตอบกับแท็บ `form_responses`
6. แบบประเมินแยกอีกฟอร์ม ผูกกับแท็บ `evaluation_responses` (ไม่เก็บอีเมล)
7. Drive: สร้างโฟลเดอร์ `reports` และ `masked_text` (ส่วนตัว) → จด id

## 4. n8n
```powershell
copy config\env_template.env .env      # แล้วกรอกค่า
npx n8n@2.39.9                          # หรือ Docker n8nio/n8n:2.39.9 พร้อม --env-file .env
```
- Credentials 4 ชุด: **Google Service Account** (googleApi · เปิด **Set up for use in HTTP Request node** และใส่ Scope `https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly` เพราะโหนด Run Document AI OCR เป็น HTTP Request — ถ้าไม่เปิด n8n จะไม่แนบ token · DEC-48) · **Drive OAuth2 (researcher)** · **Gmail OAuth2 (researcher)** · **n8n API** (สร้าง API key ใน n8n และตั้ง `N8N_API_URL=http://localhost:5678`)
- **DEC-48: นำเข้า workflow เดียว** `n8n import:workflow --input=workflows/WF_IS_68076026_01OCT26.json` (หรือ n8n → Import from File) · ใช้ id เดิมของ WF_IS68076026 (DEC-42) จึงนำเข้าทับรุ่นก่อนได้เลย · เปิดใช้งาน (Publish/Activate) หลังตั้ง credential · การ poll ครั้งแรกหลังเปิดใช้งานจำตำแหน่งแถวล่าสุดเท่านั้น แถวที่อยู่ก่อนเปิดใช้งานจะไม่ถูกประมวลผล · **หยุด n8n ก่อนใช้ `n8n import:workflow`** (หรือนำเข้าผ่านหน้า UI) — ทดสอบแล้วว่านำเข้าด้วย CLI ขณะ server ทำงานแล้วเปิดใช้งานซ้ำ ทำให้มี poller สองตัวอ่านแถวเดียวกัน (ระบบกันงานซ้ำได้ด้วย response_id แต่ไม่ควรเกิด) · ไม่ต้องตั้ง Error Workflow ใน Settings เพราะมี Error Trigger อยู่ในไฟล์ · ตั้ง credential 4 ชุดในไฟล์เดียว (โน้ตสีบอกว่าแต่ละช่วงใช้ credential/env อะไร) · **ห้ามนำเข้าหรือเปิดใช้งานชุด 5 ไฟล์พร้อมกัน**
- ชุด 5 ไฟล์เดิม (DEC-30) เลิกใช้และย้ายไป `archive/01OCT26/workflows_5wf_DEC-30/` แล้ว (DEC-38) · `workflows/` มี workflow ไฟล์เดียวคือ `WF_IS_68076026_01OCT26.json` (WF_IS68076026 ย้ายไป `archive/01OCT26/WF_IS68076026_DEC-42/` ตาม DEC-48 · WF_Final_IS อยู่ที่ `archive/01OCT26/WF_Final_IS_DEC-37/`) · ใช้โหนด Extract From File (มากับ n8n) อ่านชั้นข้อความก่อน OCR · ถ้าต้องย้อนกลับ: `node scripts/build_workflows.mjs --legacy <โฟลเดอร์>`
- เปิดแต่ละ node ที่ใช้ credential แล้วเลือก credential จริง (placeholder ชื่อ `CRED_*`)
- **ห้ามแก้ Code node ใน n8n** ถ้าต้องแก้ ให้แก้ `engine/engine.js` หรือ `workflows/src/*.js` แล้ว `node scripts/build_workflows.mjs` + `node scripts/validate_workflows.mjs` และนำเข้าใหม่

## 5. S6 ทดสอบใน n8n ด้วยบริการจำลอง (Gate G1-sys)
> DEC-48: Claude รันชุดนี้ใน n8n 2.39.9 จริงแล้ว 1 ต.ค. 2569 (บริการ Google/โมเดลจำลองบนคลาวด์ · ผลใน `evidence/n8n_test_01OCT26.md` · ชุดเครื่องมือใน `evidence/n8n_s6/`) · ข้างล่างคือการทดสอบซ้ำบนเครื่องผู้วิจัยกับบัญชี Google จริง
1. ตั้ง `email_enabled=false` (ค่าเริ่มต้น: รายงานส่งให้ `RESEARCHER_EMAIL`)
2. ส่งฟอร์มด้วย `synthetic/case_A/resume_text.pdf`, `case_B/resume_text.pdf`, `case_C/resume_scanned.pdf`
3. ใช้ mock โมเดล: ตั้ง endpoint ใน `config/models.json` ชี้ไปบริการจำลองในเครื่องที่คืน `synthetic/case_*/mock_responses/*.json` (หรือใช้ pinData ใน n8n) แล้ว build workflow ใหม่
4. ตรวจในสเปรดชีต: runs.stage = delivered · decisions 30 แถว · model_calls (กรณี C ต้องมีโมเดล C 3 แถว 429 ห่างกัน ≥ 5 และ ≥ 15 วินาที) · deliveries 1 แถว · ไม่มีอีเมลซ้ำ (B5, B7)
5. ทดสอบข้อผิดพลาด: ไฟล์ 6 หน้า · ไม่ยินยอม · ส่งซ้ำ · ลบสิทธิ์โฟลเดอร์ → ต้องได้ failed + audit_log + อีเมลถึงผู้วิจัย (B11)
6. บันทึกผลใน `evidence/S6_n8n_test_<วันที่>.md` (ภาพหน้าจอ + execution id) แล้วแทน "ทดสอบ workflow ใน n8n" ในตาราง 3.1

## 6. P1 Smoke test โมเดลจริง (Gate G2-sys)
- ตั้ง `MODEL_A/B/C_ID` ตามรุ่นที่ใช้ได้ ณ วันทดสอบ · เรียกด้วยเรซูเมสังเคราะห์ 3 ฉบับ
- บันทึกต่อโมเดล: model id ที่ตอบกลับจริง · latency · token · JSON valid · ผ่าน R0 · **ผลเมื่อส่ง temperature 0** (ถ้า HTTP 400 ให้ตั้ง `send_temperature=false` + DEC + แก้ตาราง 3.7/3.10)
- กรอก `config/models.json → verified*` และตาราง 3.8 ในเล่ม · กรอกราคาใน `config/pricing.json` จากหน้าราคาจริง
- ทดสอบส่งอีเมลถึงตนเองแล้วจึงตั้ง `email_enabled=true` (ออก DEC)
