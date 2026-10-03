# Gap_demo_03OCT26 · เรซูเม PM ได้คะแนนอาชีพอื่นสูงกว่า PM (WF_Demo รุ่น DEC-58)

> **งาน** IS 68076026 · Skill-Gap Navigator · **ขอบเขต: WF_Demo เท่านั้น (PoC)** ยังไม่แตะ engine ของระบบเต็มและเล่ม
> **ข้อมูลที่ใช้** รายงาน PDF จาก WF_Demo 4 ฉบับ (3 ต.ค. 2569 14:26–14:33 · gemini-3.8-flash × 3 รอบ + Gemini Verifier · prompt analyst_v1.1+demo_profile · RULES-IS68076026-v2.0) เรซูเมฉบับเดียวกัน (IT Project Manager ของผู้วิจัย)
> – `DEMO-20261003072530-P99U` R07 ML/AI Engineer · `…072940-GU9O` R15 Network Engineer · `…073046-ZC4Y` R20 IT/IS Manager · `…073246-91ZP` R19 IT Project Manager
> **ไฟล์ที่ตรวจ** `data/requirements.csv` · `engine/engine.js` (collectClaims, applyFloors, evaluateRun) · `prompts/verifier_v1.0.txt` · `demo/src/build_prompt.js`, `verify_prepare.js`, `verify_evidence.js`, `build_report.js`, `app.js`
> **ทำซ้ำได้** สถานะรายข้อถอดจาก PDF (OCR + ตรวจด้วยตา) แล้วคำนวณซ้ำด้วยสูตรเดียวกับรายงาน ได้ R ตรงกับรายงานทั้ง 4 ฉบับ (83.6/85.3/92.0/87.2) · สคริปต์และข้อมูลอยู่ใน `private/gap_demo_03OCT26/` (มีข้อความจากเรซูเมจริง จึงไม่เข้า git)
> **สถานะ** เอกสารวิเคราะห์ · ยังไม่ได้แก้โค้ด · การแก้ต้องมี DEC-59 (Demo PoC) ก่อน

---

## 0. สรุปหนึ่งหน้า

| อาชีพที่เลือก | R (หัวรายงาน) | T งานหลัก | H เทคโนโลยี | ข้อมีหลักฐาน/บางส่วน/ช่องว่าง | R3 ตัดทิ้ง | ถ้าใช้ R3 คำซ้ำอย่างเดียว |
|---|---:|---:|---:|---|---:|---:|
| R07 ML/AI Engineer | **92** | 75 | 6/34 | 25 / 3 / 1 (+1 ยืนยันไม่ได้) | 1 | 23 |
| R15 Network Engineer | **87** | **0** | 4/13 | 24 / 4 / 2 | 0 | 20 |
| R20 IT/IS Manager | **85** | 81 | 1/3 | 21 / 9 / 0 | 0 | 29 |
| R19 IT Project Manager | **84** | 81 | 4/10 | 24 / 2 / 4 | 8 | 20 |

**อาการ** หลังแก้ Gap_03OCT26 คะแนนกลับด้านจากเดิม: เดิมต่ำทุกอาชีพ (10–11) ตอนนี้สูงทุกอาชีพ (84–92) และอาชีพของตัวเอง (R19) ได้ต่ำสุด · R15 ขึ้น "พร้อมสูง" ทั้งที่ T = 0 (ไม่มีงานหลักด้านเครือข่ายเลยสักงาน)

**สาเหตุหลัก 3 ข้อ (เรียงตามผลกระทบ)**

1. **R วัด "ความเป็นมืออาชีพไอทีทั่วไป" ไม่ใช่ "ความเหมาะกับอาชีพ"** ข้อกำหนด Top-30 ตาม IM ของ O\*NET เป็นทักษะ/กิจกรรมที่อาชีพไอทีแทบทุกอาชีพมีร่วมกัน น้ำหนัก 58–69% ของ R มาจากข้อที่อยู่ใน Top-30 ของ ≥ 15 จาก 20 อาชีพ (R07 สูงสุด 68.6% และมีข้อเฉพาะ ≤ 5 อาชีพเพียง 1 ข้อ) คนที่มีประสบการณ์กว้างจึงได้ R สูงทุกอาชีพ
2. **ตัวตรวจความหมาย (R3b) ผ่อนเกิน ไม่ดูว่าใครเป็นคนทำ และไม่ดูระดับ** 60–65 ชิ้นต่อฉบับผ่านด้วยความหมาย ถ้าใช้คำซ้ำอย่างเดียว R จะเหลือ 20–29 · ตัวอย่าง: *Telecommunications* ← "Directed National Broadcast Operations: 500+ live episodes" (งานผลิตรายการทีวี) · *Computers and Electronics* (LV 6.1) ← "Owned SAP Business One integration…" · งานหลัก R07 "Analyze problems to develop solutions involving computer hardware and software" ← งานเดียวกัน · การ "กำกับ/ส่งมอบ" ระบบ AI ถูกนับเป็นหลักฐานว่า "ทำ" งานวิศวกร AI ได้
3. **ผลการตรวจไม่คงที่ระหว่างรอบ** quote และข้อกำหนดเดียวกันได้คำตัดสินต่างกัน เช่น *Critical Thinking* ← "rebuilding the requisition-to-payment flow…" ถูกตัด (unrelated) ในรอบ R19 แต่ผ่าน (partially) ในรอบ R15 · รอบ R19 ถูกตัด 8 ชิ้น อีกสามรอบตัด 0–1 ชิ้น R19 จึงเสียคะแนนจากความบังเอิญของรอบนั้น

**แนวทาง (PoC ใน Demo)** แยก "ความพร้อมทั่วไป" ออกจาก "ความเหมาะกับอาชีพ" และให้คะแนนหัวรายงานเป็น **Role-Fit = ½·R_role + ½·T** (R_role ถ่วงน้ำหนักตามความเฉพาะของข้อกำหนด) · เพิ่ม **บทบาทผู้ทำ (actor)** และ **ระดับ (LV)** ในการตรวจหลักฐาน · **cache คำตัดสิน** ของคู่ quote–ข้อกำหนดเดียวกัน · จำกัดการใช้ quote ซ้ำ · **แสดง token ทุกการเรียก** (ข้อมูลมีอยู่แล้วใน payload แต่ยังไม่แสดง)

**ผลที่คาดจากการจำลอง** (หัวข้อ 6 · สมมติฐานระบุชัด) Role-Fit: R20 85 · **R19 83** · R07 67 · R15 29 · จากเดิมที่ R07 > R15 > R20 > R19 · ลำดับ PM ≈ IT Manager > AI Engineer ≫ Network Engineer สอดคล้องกับเรซูเมมากกว่า

---

## 1. ข้อมูลที่ใช้และวิธีอ่าน

- ถอดสถานะทั้ง 120 ข้อ (4 × 30) จาก PDF ด้วย OCR + ตรวจด้วยตาในหน้าที่ OCR อ่านผิด จับคู่กับ `data/requirements.csv` ด้วยน้ำหนัก w ที่แสดงในรายงาน
- คำนวณ R ซ้ำด้วยสมการ 3.4 (evidenced = 1 · partially = 0.5 · missing = 0 · ไม่นับ abstained) ได้ 92.0 / 87.2 / 85.3 / 83.6 ตรงกับหัวรายงาน → ข้อมูลที่ถอดถูกต้องพอสำหรับจำลอง
- ความเฉพาะของข้อกำหนด (df) = จำนวนอาชีพจาก 20 อาชีพที่มีองค์ประกอบนั้นใน Top-30 ของตัวเอง

## 2. อาการที่เห็นในรายงาน

| สิ่งที่เห็น | R07 | R15 | R20 | R19 |
|---|---|---|---|---|
| ป้าย | พร้อมสูง | **พร้อมสูง (T = 0)** | พร้อมสูง | พร้อมสูง |
| คำกล่าวอ้าง → ผ่านการตรวจ | 87 → 86 | 84 → 84 | 90 → 90 | 83 → 75 |
| ผ่านด้วยความหมาย (R3b) | 60 | 64 | 65 | 56 |
| R ถ้าใช้คำซ้ำอย่างเดียว | 23 | 20 | 29 | 20 |
| ช่องว่างที่เหลือ | English Language | English, Inspecting Equipment | — | Developing Objectives, English, Customer Service, Resolving Conflicts |
| สรุปผู้สมัคร (Gemini) | "ยังมีช่องว่างสำคัญ … การเขียนโปรแกรมและพัฒนาอัลกอริทึม" | "ไม่มีประสบการณ์และทักษะด้านวิศวกรรมเครือข่าย" | "โดดเด่น…" | "ยังมีช่องว่าง…การเจรจาต่อรอง" |

ข้อสังเกตสำคัญ: **ข้อความสรุปของ Gemini เองบอกว่าไม่เหมาะกับ R15 และ R07** แต่คะแนนที่คำนวณจากหลักฐานรายข้อกลับสูง → ปัญหาอยู่ที่วิธีรวมหลักฐานเป็นคะแนน ไม่ใช่ที่โมเดลอ่านเรซูเมไม่ออก

## 3. สาเหตุ

### C1 · ข้อกำหนด Top-30 ส่วนใหญ่เป็นทักษะร่วมของอาชีพไอที

| อาชีพ | ข้อที่อยู่ใน Top-30 ของ ≥ 15/20 อาชีพ | น้ำหนักรวมของข้อเหล่านั้น | ข้อเฉพาะ (≤ 5 อาชีพ) | ข้อร่วมกับ R19 |
|---|---:|---:|---:|---:|
| R07 ML/AI | 20 | **68.6%** | 1 | 19/30 |
| R15 Network | 19 | 64.9% | 2 | 19/30 |
| R19 IT PM | 18 | 60.2% | 9 | — |
| R20 IT Manager | 17 | 58.4% | 7 | 21/30 |

- ข้อร่วม เช่น Working with Computers, Getting Information, Making Decisions, Reading Comprehension, Critical Thinking ใช้ quote เดียวกันได้ทุกอาชีพ คะแนนส่วนนี้จึงเท่ากันทุกอาชีพ
- R19 มีข้อเฉพาะของงานบริหารโครงการ 9 ข้อ (Coordinating the Work of Others, Scheduling, Monitoring and Controlling Resources, Resolving Conflicts, Time Management ฯลฯ) ซึ่งต้องการหลักฐานเฉพาะเจาะจงกว่า เมื่อขาดเพียงไม่กี่ข้อ R19 จึงเสียคะแนนมากกว่าอาชีพที่มีแต่ข้อทั่วไป
- เป็นผลจากการออกแบบ (DEC เดิม: Top-30 ตาม IM) ซึ่งถูกต้องในฐานะ "ข้อกำหนดของอาชีพ" แต่ **ไม่ได้ออกแบบให้แยกอาชีพ** · T (DEC-55) ถูกเพิ่มเพื่อแก้เรื่องนี้แต่ไม่ได้ใช้ในคะแนนหัวรายงาน

### C2 · ไม่แยก "ทำเอง" กับ "กำกับให้คนอื่นทำ" และไม่ดูระดับที่อาชีพต้องการ

| ข้อกำหนด (อาชีพ · LV) | quote ที่ถูกนับเป็น "มีหลักฐาน" | ปัญหา |
|---|---|---|
| Telecommunications (R15 · LV 5.0) | "Directed National Broadcast Operations: Delivered 500+ live episodes…" | คนละความหมาย (broadcast รายการ ≠ ระบบโทรคมนาคม) |
| Computers and Electronics (R07 · LV 6.1) | "Owned SAP Business One integration using an asynchronous post-and-confirm API pattern…" | เป็นเจ้าของงาน integration ไม่ได้แสดงความรู้ฮาร์ดแวร์/ซอฟต์แวร์ในระดับวิศวกร |
| Engineering and Technology (R15) | "Ran the full Agile SDLC across the internal platform and 6 concurrent client projects…" | บริหารกระบวนการ ไม่ใช่วิศวกรรม |
| Updating and Using Relevant Knowledge (R07) | "Master of Science in Information Technology Management" | วุฒิ = partially ตามกติกาเอง แต่ผ่านเป็น evidenced |
| งานหลัก R07: Apply theoretical expertise… to create or apply new technology | "Pioneered Applied AI Across Three Industries: Delivered production AI systems…" | ส่งมอบในบทบาท PM ไม่ใช่ผู้สร้างโมเดล |
| งานหลัก R07: Analyze problems to develop solutions involving computer hardware and software | "Owned SAP Business One integration…" | เช่นเดียวกัน |

- prompt analyst_v1.1 มี `evidence_type` แต่ไม่มีมิติ **ใครเป็นผู้ทำ** (ทำเอง / นำทีม / กำกับดูแล / แค่ระบุชื่อ)
- verifier_v1.0 กฎข้อ 2 นับ "achieving a result that clearly requires the target" เป็น supports — ผลงานของทีมที่ PM บริหารจึง "ต้องใช้" ทักษะวิศวกรเสมอ
- ไม่มีการใช้ `level_lv` ของ O\*NET ใน R3 ทั้งที่ข้อกำหนดด้านเทคนิคของ R07/R15 มี LV 5–6 (ระดับผู้เชี่ยวชาญ)

### C3 · ตัวตรวจความหมายผ่อนเกินและไม่คงที่

- ในการเรียกครั้งเดียว Gemini Verifier ตัดสิน 82–87 คู่ (รวมทุกรอบ ทุกข้อกำหนดและงานหลัก) และ Demo เป็นการตรวจตัวเอง (โมเดลเดียวกับผู้วิเคราะห์ · DEC-58)
- คู่เดียวกันได้คำตัดสินต่างกันระหว่างการรันคนละอาชีพ (Critical Thinking ← "rebuilding the requisition-to-payment flow…": R19 = unrelated · R15 = partially) · รอบ R19 ถูกตัด 8 ชิ้น อีกสามรอบตัด 0–1 ชิ้น
- ไม่ส่ง temperature (Gemini 3 แนะนำค่าเริ่มต้น) + thinking ทำให้ผลแกว่งได้ · ไม่มี cache ของคำตัดสิน

### C4 · quote เดียวถูกใช้เป็นหลักฐานหลายข้อ

- R15: "Converted ambiguous business needs into structured technical specifications as the sole interface between client stakeholders and engineering" ถูกใช้เป็นหลักฐาน 6 ข้อ (Getting Information, Reading Comprehension, Documenting/Recording, Active Listening, Writing, Interpreting the Meaning…) ≈ 19% ของน้ำหนัก
- R19: quote เดียวกันใช้กับ 7 ข้อ · ประโยคกว้างหนึ่งประโยคจึงทำให้ได้หลายข้อพร้อมกัน

### C5 · คะแนนหัวรายงานและป้ายใช้ R อย่างเดียว

- T อยู่ในการ์ดเล็กขวาบน "อ่านแยกจากคะแนนความพร้อม" · ป้าย "พร้อมสูง ≥ 75" ใช้ R อย่างเดียว → R15 ได้ "พร้อมสูง" แม้ T = 0
- ผู้ใช้อ่านตัวเลขใหญ่ตัวเดียว (84–92) จึงสรุปว่าเหมาะทุกอาชีพ

### C6 · H มีตัวหารไม่คงที่

- R07 34 รายการ · R15 13 · R19 10 · R20 **3** → R20 ได้ 1/3 ทำให้ H เทียบข้ามอาชีพไม่ได้ (ข้อมูล Hot Technology ของบางอาชีพน้อย)

### C7 · ข้อกำหนดเฉพาะ PM บางข้อหาหลักฐานยากจริง

- Resolving Conflicts and Negotiating (df 2) · Customer and Personal Service · Developing Objectives and Strategies ไม่มีประโยคตรงในเรซูเม หรือถูกตัดในรอบนั้น → เป็นช่องว่างที่ถูกต้องบางส่วน (Gemini เองสรุปว่าขาดการเจรจาต่อรอง) แต่เพราะ C1 ข้อเหล่านี้ทำให้อาชีพตัวเองเสียคะแนน ขณะที่อาชีพอื่นไม่มีข้อแบบนี้ให้เสีย

### C8 · ไม่แสดงจำนวน token

- payload มี `analyst.run_info[].usage`, `verifier.usage`, `ocr.usage` (usageMetadata ของ Gemini) อยู่แล้ว แต่ `build_report.js` / `app.js` ไม่แสดง และไม่มีผลรวมหรือค่าใช้จ่ายต่อการรัน

## 4. ทำไม R19 ต่ำกว่า R07 ทั้งที่เป็นอาชีพของตัวเอง

1. R07 มีแต่ข้อกว้าง (C1) และข้อเทคนิคถูกนับจากงานที่ PM กำกับ (C2) → แทบไม่มีข้อให้เสียคะแนน
2. R19 มีข้อเฉพาะ PM 9 ข้อ ซึ่งเรซูเมเขียนในรูปผลงานไม่ใช่คำของ O\*NET → ขาด 4 ข้อ (C7)
3. รอบ R19 ตัวตรวจเข้มกว่ารอบอื่นโดยบังเอิญ (C3)
4. ทั้งหมดถูกรวมเป็นตัวเลขเดียวที่ไม่ใช้ T (C5)

## 5. แนวทางแก้ (Demo PoC · DEC-59)

| # | แนวทาง | ทำที่ | ผลต่อ | ลำดับ |
|---|---|---|---|---|
| D1 | **Role-Fit เป็นคะแนนหัวรายงาน** F = ½·R_role + ½·T · ป้าย "พร้อมสูง" ต้อง F ≥ 75 **และ** T ≥ 60 · แสดง R เดิม (ความพร้อมทั่วไป) เป็นตัวรอง | `build_report.js`, `app.js` | C1, C5 | P0 |
| D2 | **R_role ถ่วงตามความเฉพาะ** w′ = w × idf · idf = ln((N + 1)/(df + 0.5)) · N = 20 · ข้อที่ทุกอาชีพมีเกือบไม่มีน้ำหนัก · คำนวณ df ตอน build demo data | `demo/build_demo_data.py`, `verify_evidence.js` | C1 | P0 |
| D3 | **actor + level** เพิ่มฟิลด์ `actor` = performed / led_team / oversaw / mentioned ใน DEMO ADDENDUM · ข้อเทคนิค (Knowledge ด้าน STEM, Programming, Systems Analysis/Evaluation, Working with Computers ที่ LV ≥ 5, Inspecting Equipment) ต้อง `performed` จึงเป็น evidenced · `led_team/oversaw` → partially · verifier รุ่น demo เพิ่มกฎ "การบริหารคนที่ทำ X ไม่ใช่หลักฐานว่าทำ X ได้" และส่ง LV ของข้อนั้นไปด้วย · ใช้กับงานหลัก (T) ด้วย | `build_prompt.js`, `prompts/verifier_v1.1_demo.txt` (ใหม่ · ไม่แตะ v1.0), `verify_evidence.js` | C2, C3 | P0 |
| D4 | **ความคงที่ของ R3b** คีย์ = element_id + sha1(quote) · เก็บคำตัดสินใน `$getWorkflowStaticData('global')` ใช้ซ้ำข้ามการรันในเครื่องเดียวกัน · แบ่ง batch ≤ 30 คู่ · `GEMINI_VERIFIER_THINKING_LEVEL` = low · ถ้าคู่เดียวกันได้คำตัดสินต่างกันให้ใช้ค่าที่เข้มกว่า | `verify_prepare.js`, `verify_evidence.js`, `build_wf_demo.mjs` | C3 | P0 |
| D5 | **จำกัดการใช้ quote ซ้ำ** span เดียวเป็น evidenced ได้ไม่เกิน 2 ข้อ (เลือกข้อที่ df ต่ำและน้ำหนักสูงก่อน) ข้อที่เกินเป็น partially | `verify_evidence.js` | C4 | P1 |
| D6 | **H คงที่** ใช้ Hot Technology 10 รายการแรกที่ In Demand ทุกอาชีพ ถ้ามีไม่ถึง 10 แสดง "ข้อมูลไม่พอ" แทนเปอร์เซ็นต์ | `build_demo_data.py`, `app.js` | C6 | P1 |
| D7 | **แผง Token** ต่อการเรียก (OCR · Analyst A/B/C · Verifier): input / output / thinking / total · เวลา · finishReason · รวมทั้งการรัน · ค่าใช้จ่ายประมาณจากราคาใน CONFIG (`PRICE_PER_1M_INPUT/OUTPUT`, ผู้วิจัยกรอกจากหน้าราคาของ Google) · แสดงในรายงาน + PDF + JSON | `verify_evidence.js` (รวม usage), `build_report.js`, `app.js`, `config_validate.js` | C8 | P0 |
| D8 | **โหมดเทียบอาชีพ** (ไม่บังคับ) ปุ่ม "เทียบ 4 อาชีพ" ใช้ข้อความเรซูเมเดิม วิเคราะห์ทุกอาชีพแล้วเรียง Role-Fit · token ×4 จึงเปิดเมื่อผู้ใช้ขอ | `app.js`, webhook ใหม่ | การนำเสนอ | P2 |

**สิ่งที่ไม่เปลี่ยน** สมการ 3.4 (R เดิม) ยังคำนวณและแสดงเพื่อเทียบกับระบบเต็ม · engine.js ไม่แก้ (ฟังก์ชันใหม่อยู่ใน demo/src) · prompt analyst_v1.1 และ verifier_v1.0 ไม่แก้ (Demo ใช้ addendum และไฟล์ verifier ของ Demo แยก)

### Token: สิ่งที่จะแสดง (D7)

| ฟิลด์ (Gemini `usageMetadata`) | แสดงเป็น |
|---|---|
| `promptTokenCount` | input |
| `candidatesTokenCount` | output |
| `thoughtsTokenCount` | thinking (คิดเงินเป็น output) |
| `totalTokenCount` | รวม |
| `cachedContentTokenCount` (ถ้ามี) | input ที่ cache |

**ประมาณการก่อนวัดจริง** prompt วิเคราะห์ ≈ 11,500 อักขระ + ความยาวเรซูเม (วัดจาก `buildPrompt` ของ 4 อาชีพ: 12,480–13,008 อักขระกับเรซูเมตัวอย่าง 1,445 อักขระ) ≈ 4–6 พัน token ต่อรอบ × 3 รอบ · verifier ≈ 80 คู่ × ~400 อักขระ ≈ 8–9 พัน token input · รวมทั้งการรันน่าจะอยู่ราว 35–60 พัน token (ขึ้นกับ thinking) **ต้องยืนยันด้วยตัวเลขจริงหลังทำ D7**

## 6. จำลองผลกับข้อมูล 4 ฉบับนี้

สมมติฐาน: (ก) ใช้สถานะรายข้อเดิมจาก PDF · (ข) D3: ข้อเทคนิคที่ได้ evidenced จากเรซูเมนี้มาจากงานที่ "กำกับ/ส่งมอบ" จึงลดเป็น partially (R07 7 ข้อ · R15 6 ข้อ · R19/R20 2 ข้อ คือ Working with Computers และ Computers and Electronics) และงานหลัก R07 ข้อ 1–2 ลดเป็น partially (T 75 → 62.5) · (ค) ยังไม่รวมผลของ D4/D5 (คาดว่าทำให้ R ของทุกอาชีพลดลงเล็กน้อยและ R19 คงที่ขึ้น)

| อาชีพ | R เดิม | R_role (D2) | R_role + actor (D2+D3) | T | **Role-Fit (D1)** | ป้ายใหม่ |
|---|---:|---:|---:|---:|---:|---|
| R20 IT/IS Manager | 85.3 | 89.4 | 89.2 | 81 | **85.1** | พร้อมสูง |
| R19 IT Project Manager | 83.6 | 84.5 | 84.4 | 81 | **82.7** | พร้อมสูง |
| R07 ML/AI Engineer | 92.0 | 90.7 | 71.3 | 62.5 | **66.9** | ใกล้พร้อม |
| R15 Network Engineer | 87.2 | 75.4 | 58.2 | 0 | **29.1** | ต้องพัฒนาเพิ่ม (T < 60) |

อ่านผล
- **D2 อย่างเดียวไม่พอ** (R07 ยัง 90.7) เพราะข้อเฉพาะของ R07 ก็ถูกนับผ่านจากงานที่กำกับ → ต้องมี D3 คู่กัน
- **D1 ทำให้ R15 ลงทันที** เพราะ T = 0 · ตรงกับที่ Gemini สรุปเองว่าไม่มีทักษะเครือข่าย
- R20 สูงกว่า R19 เล็กน้อยเป็นเรื่องสมเหตุสมผล (IT Manager เป็นอาชีพที่ต่อยอดจาก PM และเรซูเมมีการนำทีม 21 คน) · ช่องว่างของ R19 ที่เหลือ (Resolving Conflicts, Customer Service) เป็นเรื่องที่เรซูเมไม่ได้เขียนจริง ผู้ใช้เพิ่มหลักฐานได้ผ่าน Open Learner Model
- ตัวเลขเป็นการจำลองจากสมมติฐาน (ข) ต้องรันจริงหลังแก้

## 7. เกณฑ์ผ่านของ PoC (รันกับ Gemini จริง)

| # | เกณฑ์ | วิธีตรวจ |
|---|---|---|
| P1 | เรซูเมผู้วิจัย: Role-Fit(R19) ≥ Role-Fit(R07) + 10 และ ≥ Role-Fit(R15) + 30 | รัน 4 อาชีพ |
| P2 | R15 ไม่ได้ป้าย "พร้อมสูง" | ป้าย |
| P3 | รันอาชีพเดิมซ้ำ 3 ครั้ง: Role-Fit ต่างกัน ≤ 5 · สถานะรายข้อตรงกัน ≥ 85% | `node scripts/validate_scoring.mjs --only stability` |
| P4 | known-group (K1/K2) ของเรซูเมสมมติ 4 คนผ่าน โดยใช้ Role-Fit แทน R | `validate_scoring.mjs` (เพิ่มฟิลด์ role_fit) |
| P5 | คู่ quote–ข้อกำหนดเดียวกันได้คำตัดสินเดียวกันทุกการรัน (หลังมี cache) | ตรวจ log ของ verifier |
| P6 | แผง token แสดงครบทุกการเรียก และผลรวมตรงกับผลบวกรายการ | ดูรายงาน + JSON |

## 8. ผลต่อระบบเต็มและเล่ม

- PoC นี้ไม่แก้ engine/เล่ม · ถ้าผ่าน P1–P5 ให้เขียน DEC แยกเพื่อย้าย D1–D3 เข้า engine 2.1 (กระทบสมการ 3.4, ตาราง 3.12, 3.4.6 และอาจต้องเพิ่มสมการ Role-Fit) · DEC-55 เดิมกำหนดให้ T "รายงานแยกจาก R" จะต้องทบทวน
- D3 (actor) สอดคล้องกับข้อสังเกตเชิงทฤษฎีเรื่อง *evidence of competence* ในงาน EdTech/Open Learner Model ว่าหลักฐานต้องแสดงการกระทำของผู้เรียนเอง ควรเพิ่มในข้อจำกัด/อภิปรายของบท 3 เมื่อย้ายเข้าระบบเต็ม

## 9. ไฟล์ที่ต้องแก้ (เมื่อได้ DEC-59)

`demo/src/build_prompt.js` (addendum actor) · `demo/src/verify_prepare.js` (batch + cache + LV) · `demo/src/verify_evidence.js` (actor rule, reuse cap, R_role, Role-Fit, token รวม) · `demo/src/build_report.js` · `demo/src/app.js` + `app.css` (หัวรายงาน, ป้าย, แผง token) · `demo/src/config_validate.js` (ราคา, ค่า D1–D5) · `demo/build_demo_data.py` (df, H 10 รายการ) · `prompts/verifier_v1.1_demo.txt` (ใหม่) · `demo/build_wf_demo.mjs` · `demo/test/server.mjs` + `tests/demo_workflow.test.mjs` · `demo/README_Demo.md`, `demo/Setup_wf_demo.md` · `docs/DECISIONS.md` (DEC-59) · `docs/LOG.md`

---

## ภาคผนวก A · สถานะที่ไม่ใช่ "มีหลักฐาน" ในแต่ละฉบับ

| อาชีพ | บางส่วน | ช่องว่าง | ยืนยันไม่ได้ |
|---|---|---|---|
| R07 | Mathematics · Programming · Evaluating Compliance | English Language | Identifying Objects, Actions, and Events |
| R15 | Evaluating Compliance · Identifying Objects · Programming · Speaking | English Language · Inspecting Equipment | — |
| R20 | Identifying Objects · Critical Thinking · Developing and Building Teams · Customer and Personal Service · Interpersonal Relationships · Speaking · Judgment and Decision Making · Monitoring Processes · Evaluating Compliance | — | — |
| R19 | Critical Thinking (R6) · Active Listening | Developing Objectives and Strategies · English Language · Customer and Personal Service · Resolving Conflicts and Negotiating | — |

## ภาคผนวก B · ข้อเทคนิคที่ใช้ในการจำลอง D3

element_id: 2.C.3.a Computers and Electronics · 2.C.3.b Engineering and Technology · 2.C.4.a Mathematics · 2.C.9.a Telecommunications · 2.B.3.e Programming · 2.B.4.g Systems Analysis · 2.B.4.h Systems Evaluation · 4.A.3.b.1 Working with Computers · 4.A.1.b.2 Inspecting Equipment · 4.A.1.b.3 Estimating Quantifiable Characteristics · 4.A.2.b.2 Thinking Creatively · (รายการจริงใน PoC ควรมาจาก O\*NET ร่วมกับ LV ≥ 5 ไม่ใช่รายการที่กำหนดด้วยมือ)
