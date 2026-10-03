# WF_Demo · Skill-Gap Navigator (Demo รอบที่ 1 สำหรับคณะกรรมการ)

IS 68076026 · ดนุสรณ์ อนันตกาล · ITM KMITL · สร้าง 1 ต.ค. 2569

Workflow เดียวบน **n8n ในเครื่อง** ทำงานตั้งแต่หน้าฟอร์มจนถึงหน้ารายงาน:

```
หน้าเว็บ (n8n)  →  อัปโหลดเรซูเม  →  OCR  →  ปิดบัง PII  →  Gemini วิเคราะห์ 30 ข้อกำหนด O*NET
               →  Gemini Verifier  →  ตรวจหลักฐาน R0–R6 + ดัชนี T/H  →  จัดแผนคอร์ส/ใบรับรอง (สมการ 3.7–3.8)  →  รายงานบนหน้าเว็บ
               →  ดาวน์โหลด PDF / บันทึกลง Google Drive
```

## ไฟล์ในโฟลเดอร์นี้

| ไฟล์ | คืออะไร |
|---|---|
| `WF_Demo.json` | **ไฟล์ที่นำเข้า n8n** (28 โหนด + sticky note 6 ช่อง) |
| `samples/` | เรซูเมสมมติ 4 อาชีพ + ไฟล์สแกน (`*_scanned.pdf`, `*_scan.png`) สำหรับโชว์เส้นทาง OCR |
| `preview/` | ภาพหน้าจอจากการทดสอบ (Light/Dark · ฟอร์ม · ระหว่างประมวลผล · รายงาน · PDF) |
| `src/` | ต้นฉบับโค้ดทุกโหนด + หน้าเว็บ (`app.html` `app.css` `app.js`) |
| `build_demo_data.py` | ดึงข้อมูลจริงของ 4 อาชีพจาก `Data_Set.xlsx` + `data/*.csv` → `build/demo_data.json` |
| `build_wf_demo.mjs` | ประกอบ `WF_Demo.json` (ฝังฟังก์ชันจาก `engine/engine.js` ตรงทุกไบต์ + ตรวจ syntax/การอ้างโหนด) |
| `Setup_wf_demo.md` · `run_demo_mac.sh` | คู่มือติดตั้งจนรันได้ · สคริปต์เปิด Demo บน macOS (Node 24 + n8n 2.39.9) |
| `make_sample_resumes.py` | สร้างเรซูเมสมมติใน `samples/` |
| `test/` | ตัวจำลอง n8n + Playwright ที่ใช้ทดสอบก่อนส่ง (ไม่จำเป็นต่อการโชว์) |

แก้หน้าเว็บหรือโค้ด → แก้ใน `src/` แล้วรัน (จากโฟลเดอร์ `Final_IS`):

```bash
python demo/build_demo_data.py          # เฉพาะเมื่อข้อมูลใน data/ หรือ Data_Set.xlsx เปลี่ยน
node   demo/build_wf_demo.mjs            # สร้าง demo/WF_Demo.json ใหม่
```

---

## ตั้งค่าครั้งแรก (ประมาณ 10 นาที)

> **คู่มือละเอียดทีละขั้น (ติดตั้ง Node 24 → n8n → credential → Drive OAuth → ทดสอบ → แก้ปัญหา): `demo/Setup_wf_demo.md`** · บน macOS ใช้สคริปต์ `bash demo/run_demo_mac.sh` ทำข้อ 1–4 ให้อัตโนมัติ

1. **นำเข้า** — n8n → *Workflows* → *Import from File* → `demo/WF_Demo.json` (หรือ `n8n import:workflow --input=demo/WF_Demo.json` · id `is68WFDemo000001`)
2. **Gemini API key** — *Credentials* → *New* → **Header Auth**
   - Name: `x-goog-api-key` · Value: API key จาก Google AI Studio
   - ตั้งชื่อ credential ว่า `Gemini API Key (x-goog-api-key)` แล้วเลือกในโหนด **Gemini OCR** **Gemini Analyst** และ **Gemini Verifier**
3. **Google Drive** — *Credentials* → **Google Drive OAuth2 API** (ใช้ตัวเดิมของ `WF_Final_IS` ได้) → เลือกในโหนด **Upload PDF to Drive**
   - ช่อง *Folder* ตั้งไว้ `root` (My Drive) → เปลี่ยนเป็น Folder ID ของโฟลเดอร์รายงาน เช่น ค่า `DRIVE_REPORT_FOLDER_ID`
4. **Publish** workflow (ปุ่มขวาบน) → เปิด **http://localhost:5678/webhook/is-demo**
5. ซ้อมด้วยไฟล์ใน `samples/` อย่างน้อย 1 รอบ แล้วกด *ดาวน์โหลด PDF* และ *บันทึกลง Google Drive*

> โมเดลตั้งต้นคือ `gemini-3.8-flash` (thinking level `low`) — เปลี่ยนได้ที่ `CONFIG` ในโหนด **Config & Validate**
> ถ้า API key ใช้ไม่ได้ ระบบไม่ล่ม: จะใช้ **กฎสำรอง** (จับคู่คำพ้องจาก O*NET ไม่ใช้ LLM) และแสดงป้ายเตือนบนรายงาน
> ยกเว้นไฟล์สแกน/รูปภาพ ซึ่งต้องใช้ Gemini OCR

## สองโหมดสำหรับวันโชว์

| โหมด | เปิด URL | ใช้เมื่อ |
|---|---|---|
| **Production** | `http://localhost:5678/webhook/is-demo` | โชว์หน้าเว็บอย่างเดียว ดูผลย้อนหลังที่แท็บ *Executions* |
| **Canvas (โหนดวิ่งให้เห็น)** | `http://localhost:5678/webhook/is-demo?test=1` | เปิด editor ไว้อีกจอ กด **Execute workflow** ก่อน แล้วค่อยกดส่งฟอร์ม → โหนดจะเขียวทีละตัวบน canvas (รับได้ 1 ครั้งต่อการกด) |

ทั้งสองโหมดต้อง Publish ก่อน (หน้าเว็บและปุ่มบันทึก Drive ใช้ URL production เสมอ)

## ลำดับโชว์ที่แนะนำ (ประมาณ 5 นาที)

1. เปิดหน้าเว็บ → ชี้ 4 การ์ดอาชีพ (SOC · Job Zone · ป้าย *proxy* ของ ML/AI พร้อมเหตุผลเมื่อชี้เมาส์)
2. เลือก 12 เดือน / 10 ชม. → ชี้กล่อง **Hmax = 12 × 4.33 × 10 = 519.6** (สมการ 3.7 คำนวณสด)
3. อัปโหลด `samples/resume_IT_Project_Manager.pdf` → กดวิเคราะห์ (สลับจอให้เห็นโหนดบน canvas ถ้าใช้ `?test=1`)
4. หน้ารายงาน: คะแนนความพร้อม → KPI → สรุปผู้สมัคร → ความพร้อมรายโดเมน
5. **ตัวกรอง Hallucination**: ชี้ว่าคำกล่าวอ้างกี่ข้อถูก R2/R3 ตัดทิ้ง และ quote ที่ถูกขีดฆ่า (จุดขายของงานวิจัย)
6. เส้นทางการเรียนรู้: Gantt ตามเดือน · ทุกรายการมี URL ที่ตรวจแล้ว · d_k · ช่องว่างที่ยังไม่มีคอร์ส
7. สลับ Light/Dark → กด **ดาวน์โหลด PDF** → กด **บันทึกลง Google Drive** แล้วคลิกลิงก์ใน toast
8. (ถ้ามีเวลา) อัปโหลด `samples/resume_AI_ML_Engineer_scan.png` ให้เห็นเส้นทาง **Gemini OCR**

---

## โครงสร้าง workflow

| ช่วง | โหนด | อ้างอิงเล่ม |
|---|---|---|
| หน้าเว็บ | `GET /is-demo` → **Render App HTML** → Respond HTML | — |
| รับไฟล์ | `POST /is-demo-analyze` → **Config & Validate** → Input OK? | ตาราง 3.10 (≤ 10 MB · 6/12/18/24 เดือน · ≤ 60 ชม.) |
| OCR | Is PDF? → **Extract PDF Text** (≤ 5 หน้า) → **Text Layer Check** → Need OCR? → **Gemini OCR** | ข้อความ < 300 ตัวอักษร หรือเป็นรูป → OCR |
| เตรียมข้อความ | **Clean Text & Mask PII** → Text OK? | 3.5.1 (normalize 5 กฎ · PII 4 รูปแบบ) — ฟังก์ชันจาก `engine.js` |
| ข้อมูลจริง | **Load Role Data (O*NET 31.0)** | Top-30 · น้ำหนักสมการ 3.1 · คลัง verified · mapping L1 ผ่านตรวจ |
| วิเคราะห์ | **Build Analyst Prompt** → Use Gemini? → **Gemini Analyst** × `ANALYST_RUNS` | prompt `analyst_v1.1` (ข้อกำหนด 30 + งานหลัก 8) + ส่วนเสริม `profile` สำหรับแสดงผล |
| ตรวจหลักฐาน | **Prepare Relevance Checks** → Need Verification? → **Gemini Verifier** → **Verify Evidence (R0–R6)** | 3.4.4–3.4.6 · `evaluateRun` จาก `engine.js` ทั้งไฟล์ (R2 ซ่อม quote · R3a/R3b · R1 โหวตระหว่างรอบ · R5/R6 · T/H) |
| วางแผน | **Plan Pathway (Eq 3.7–3.8)** → **Build Report** → Respond Report | 3.6 · ตรรกะเดียวกับ `engine.buildPlan` |
| บันทึก PDF | `POST /is-demo-save-pdf` → Check PDF → **Upload PDF to Drive** → Drive Result | — |

### ข้อมูลจริงที่ hardcode (4 อาชีพ)

| ตัวเลือกบนฟอร์ม | role_id · SOC (O*NET 31.0) | Job Zone | คอร์ส/ใบรับรอง verified |
|---|---|---|---|
| AI / ML Engineer | R07 · 15-1221.00 *(proxy: Computer and Information Research Scientists)* | 5 | 30 |
| Network Engineer | R15 · 15-1241.00 | 4 | 26 |
| IT Project Manager | R19 · 15-1299.09 | 4 | 22 |
| IT Manager | R20 · 11-3021.00 | 4 | 25 |

แต่ละอาชีพมีข้อกำหนด 30 ข้อพร้อมน้ำหนัก/คำพ้อง, งานหลัก 6 ข้อ (แสดงผล) + งาน Core 8 งาน (ดัชนี T) · Hot Technology 18 รายการ (แสดงผล) + ชุดเทคโนโลยีสำหรับดัชนี H, ชื่อตำแหน่ง, ระดับการศึกษา (จาก `Data_Set.xlsx`)
และคอร์ส/ใบรับรองจาก `data/corpus.csv` (CORPUS v1.5R) ที่ `verification_status = verified` เท่านั้น — URL ไม่ได้มาจาก AI

### หน้าเว็บ

- ไม่มี build step — HTML/CSS/JS ล้วน ฝังอยู่ในโหนด Render App HTML · ฟอนต์ IBM Plex Sans Thai + Inter (Google Fonts)
- ดีไซน์ glassmorphism แนว component ของ 21st.dev ทำใหม่ด้วยมือ: aurora background · spotlight card · number ticker · shimmer button · segmented control แบบ pill เลื่อน · animated beam ของขั้นตอน · marquee · bento KPI
- Light/Dark: ตามระบบปฏิบัติการตอนเปิด และสลับได้ที่ปุ่มมุมขวาบน · รองรับ `prefers-reduced-motion` และจอมือถือ
- สีสถานะ: มีหลักฐาน = เขียว ✓ · บางส่วน = เหลือง ◐ · ช่องว่าง = แดง ⊖ (มีไอคอน + ข้อความกำกับทุกจุด ไม่ใช้สีอย่างเดียว)

### PDF และ Google Drive

n8n 2.x เสิร์ฟ HTML จาก webhook ภายใต้ CSP `sandbox` (ไม่มี `allow-same-origin`) ทำให้ไลบรารีที่โคลนหน้าเข้า iframe เช่น html2pdf/html2canvas **ใช้ไม่ได้**
(ทดสอบแล้วพบ *Blocked a frame with origin "null"*) Demo นี้จึงใช้ **html-to-image + jsPDF** (โหลดจาก cdnjs สำรองด้วย jsDelivr) และตัดหน้า A4 เองโดยไม่ตัดกลางการ์ดหรือแถว
ถ้าโหลดไลบรารีไม่ได้ จะเปิดหน้าพิมพ์ของเบราว์เซอร์ (Save as PDF) แทน — ปุ่ม Drive ส่งไฟล์ PDF เดียวกันไปที่ webhook `is-demo-save-pdf`

## ข้อจำกัดที่ควรบอกคณะกรรมการ

- Demo ใช้ **Gemini โมเดลเดียว** วิเคราะห์ 3 รอบแล้วโหวต (แทน R1 ของ 3 โมเดล) และ Gemini ตรวจความหมายเอง (self-verification) ต่างจากระบบเต็มที่ให้โมเดลอื่นตรวจ (`WF_IS_68076026_01OCT26`) → ใช้สาธิต ไม่ใช่ผลวิจัย
- Gemini 3 แนะนำให้คง temperature ค่าเริ่มต้น จึงไม่ได้ส่ง temperature = 0 ตามตาราง 3.10 (ระบบเต็มรอ smoke test อยู่แล้ว)
- ส่วน `profile` (สรุปภาษาไทย ตำแหน่ง ปีประสบการณ์) เป็นข้อความจาก AI เพื่อแสดงผล **ไม่ใช้คำนวณคะแนน** · ชื่อใบรับรองที่ AI อ้างถูกตรวจแบบตรงตัวอักษร (ไม่พบ = ขีดฆ่า)
- เกณฑ์ป้าย "พร้อมสูง ≥ 75 / ใกล้พร้อม 50–74 / ต้องพัฒนาเพิ่ม < 50" เป็นค่าสำหรับแสดงผลใน Demo ไม่ใช่เกณฑ์ของงานวิจัย · ไม่แสดง "คะแนนหลังเรียนจบแผน" แล้ว (DEC-56/58)
- ไม่บันทึกเรซูเมลง Google Sheets/Drive (ต่างจาก `WF_Final_IS`) · แต่ execution log ของ n8n เก็บข้อมูลที่ส่งเข้าไว้ ลบได้ที่แท็บ *Executions*
- ต้องต่ออินเทอร์เน็ต (Gemini · Google Fonts · cdnjs) — ถ้าไม่มีเน็ต ตั้ง `USE_GEMINI_ANALYST: false` และใช้ PDF ที่มีข้อความ

## แก้ปัญหา

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| หน้าเว็บขึ้น 404 | ยังไม่ได้ Publish หรือพิมพ์ path ผิด (`/webhook/is-demo`) |
| ส่งฟอร์มแล้วขึ้น "ยังไม่ได้กด Execute workflow" | ใช้ `?test=1` แต่ยังไม่กด *Execute workflow* หรือกดไปแล้ว 1 รอบ (กดใหม่) |
| รายงานขึ้นป้าย "โหมดสำรอง" | Gemini ตอบผิดพลาด — ดูข้อความในป้าย (เช่น 403 API key) และผลของโหนด Gemini Analyst |
| ไฟล์สแกนขึ้น "อ่านเอกสารไม่สำเร็จ" | Gemini OCR ใช้ไม่ได้ → ตรวจ credential หรือใช้ PDF ที่มีข้อความ |
| บันทึก Drive ไม่สำเร็จ | credential Drive หมดอายุ / Folder ID ผิด — ข้อความจาก Google จะแสดงใน toast |
| ชื่อโมเดลใช้ไม่ได้ (404 model not found) | เปลี่ยน `GEMINI_MODEL_ANALYST` / `GEMINI_MODEL_OCR` ใน Config & Validate เป็นรุ่นที่บัญชีใช้ได้ |

## การทดสอบที่ทำก่อนส่ง (1 ต.ค. 2569)

- `build_wf_demo.mjs`: syntax ของ Code node ทุกตัว · การอ้าง `$('โหนด')` · connection ครบ — ผ่าน
- รันโค้ดของทุกโหนดจาก `WF_Demo.json` จริงด้วยตัวจำลอง n8n (`test/harness.mjs`) + Gemini จำลอง: 4 อาชีพ × PDF ข้อความ, PDF สแกน, PNG, input ผิด (400), Gemini ล้ม → กฎสำรอง, OCR ล้ม (422) — ผ่าน
- Playwright (Chromium) เปิดหน้าเว็บภายใต้ CSP sandbox แบบเดียวกับ n8n 2.39: ฟอร์ม → รายงาน → Light/Dark → ดาวน์โหลด PDF (7–8 หน้า A4) → ส่ง PDF เข้า webhook Drive — ผ่าน ไม่มี console error · จอมือถือ 390 px ไม่ล้นขอบ
- **n8n 2.39.9 ของจริง** (Node 24 · SQLite · task runner): `import:workflow` + `publish:workflow` → หน้าเว็บเปิดได้พร้อม CSP sandbox · วิเคราะห์ PDF ข้อความได้ครบทั้งเส้นทาง (Gemini ถูกบล็อกในเครื่องทดสอบ จึงวิ่งเส้นทางกฎสำรอง) · input ผิด → 400 · ไฟล์สแกน/PNG ไม่มี Gemini → 422 · ส่ง PDF ไป Drive ด้วย credential ปลอม → 502 พร้อมข้อความ · CORS ตอบ `Access-Control-Allow-Origin: null` ถูกต้อง · Playwright บน n8n จริง: รายงาน + ดาวน์โหลด PDF ผ่าน
- ยังไม่ได้ทดสอบกับ **Gemini API จริง** และ **Google Drive จริง** → ต้องซ้อมตามขั้น "ตั้งค่าครั้งแรก" ข้อ 5 บนเครื่องผู้วิจัยก่อนวันโชว์
