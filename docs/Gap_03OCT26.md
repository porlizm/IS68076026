# Gap_03OCT26 · ทำไมคะแนนความพร้อมต่ำผิดปกติ และต้องแก้อะไรบ้าง

> **งาน** IS 68076026 · Skill-Gap Navigator (WF_Demo + engine ของ WF_IS_68076026_01OCT26)
> **ข้อมูลที่ใช้** รายงาน PDF ที่ export จาก WF_Demo 2 ฉบับ (3 ต.ค. 2569 · gemini-3.8-flash · prompt analyst_v1.0+demo_profile) ใช้เรซูเมฉบับเดียวกัน (`IT Project Manager_Danusorn Anantakan.pdf`)
> – `DEMO-20261003043007-5K7G` อาชีพเป้าหมาย R19 IT Project Manager → **10 / 100**
> – `DEMO-20261003042155-6HY0` อาชีพเป้าหมาย R15 Network Engineer/Architect → **11 / 100**
> **โค้ดที่ตรวจ** `engine/engine.js` (ruleR2, tokenize, overlapScore, evaluateRun) · `demo/src/verify_evidence.js` · `build_prompt.js` · `config_validate.js` · `plan_pathway.js` · `prompts/analyst_v1.0.txt` · `data/requirements.csv` · `source/project_files/Data_Set.xlsx`
> **ไฟล์ทดลองซ้ำได้** `private/gap_03OCT26_sim/` (claims.json, sim.py, score.py · อยู่ใน `private/` เพราะมีข้อความจากเรซูเมจริง · ไม่เข้า git)
> **สถานะ (อัปเดต 3 ต.ค. 2569 ช่วงบ่าย)** ✅ แก้ครบ S1–S9 แล้วใน engine 2.0 · DEC-51–58 · ดูหัวข้อ 7 · ⏳ ยังต้องยืนยันกับ Gemini/โมเดลจริง (S9 · DEC-57)

---

## 0. สรุปหนึ่งหน้า

**คำตอบสั้น** คะแนน 10 กับ 11 ไม่ได้บอกว่าผู้สมัครพร้อมแค่ไหน สิ่งที่มันวัดได้จริงคือ "ประโยคในเรซูเมใช้คำเดียวกับคำอธิบาย O\*NET มากแค่ไหน" ระบบตัดหลักฐานจริงทิ้งเกือบหมด แล้วนับข้อที่ถูกตัดเป็น 0 คะแนน

ทำซ้ำคะแนนจากโค้ดได้ตรงกับรายงาน: **R19 = 10.3 · R15 = 10.9**

| ชั้น | สาเหตุ | หลักฐาน (จาก 2 รายงาน) | น้ำหนักต่อคะแนน |
|---|---|---|---|
| **RC1** | กฎ R3 วัด "คำที่ซ้ำกัน" ไม่ได้วัด "ความหมาย" | R3 ตัด 13/19 และ 14/18 ข้อสรุป · หลักฐานที่ R3 ตัดทิ้ง **ราว 23 จาก 27 ข้อเป็นหลักฐานที่ถูกต้อง** · recall ของ R3 = **0.26** | **หลัก** (10 → ~46) |
| **RC2** | ข้อที่ไม่ผ่าน R2/R3 ถูกนับเป็น `missing` = 0 คะแนน | ข้อที่ "ยังยืนยันไม่ได้" กับข้อที่ "ไม่มีจริง" ได้ค่าเดียวกัน | ทำให้ RC1 ลากคะแนนลงตรง ๆ |
| **RC3** | โมเดลตอบ `missing` เองมาก และผลไม่คงที่ | R19 ตอบ missing เอง 11 ข้อ เช่น Coordination, Time Management, Critical Thinking · Coordination ในรอบ R15 ได้ evidenced จากเรซูเมเดียวกัน | รอง |
| **RC4** | ข้อกำหนด 30 ข้อของแต่ละอาชีพคล้ายกันมาก | R19 กับ R15 ใช้ element ร่วมกัน 19/30 ข้อ (63% ของน้ำหนัก) · เฉลี่ยทุกคู่อาชีพใช้ร่วมกัน 76% | **ทำให้ PM ไม่ชนะ Network** |
| RC5 | ใบรับรองและวุฒิที่ตรวจพบไม่ถูกนับเป็นหลักฐาน | ใบรับรองที่ผ่าน R2 6 ใบ ไม่เชื่อมกับข้อกำหนดข้อไหนเลย | รอง |
| RC6 | ชุดทดสอบเดิมไม่เคยตรวจความถูกต้องของคะแนน | 14/14 กรณีใช้โมเดลจำลอง · เรซูเมสังเคราะห์เขียนด้วยคำแบบ O\*NET · θ ปรับจากชุดนี้ (เล่ม 3.4.4) | ต้นเหตุที่ไม่เจอปัญหาก่อนหน้านี้ |
| RC7 | ช่องว่างที่ผิดพาแผนเรียนผิดไปด้วย | PM 8 ปีได้แผน "Research Methods", "Write Professional Emails in English", CAPM สำหรับ Reading Comprehension · 475 ชม. · $2,087 · แสดงว่า "10 → 100" | ผลต่อผู้ใช้ |

**ทำไม Network Engineer ได้มากกว่า** มีสองเหตุ
(1) ข้อสรุป 3 ข้อของ R15 บังเอิญมีคำพ้องตรงตัว ได้แก่ `analytics`, `python`, `coordination` จึงได้ ov = 1.0 ส่วน R19 มีแค่ 1 ข้อที่ผ่านแบบ evidenced
(2) **ถึงตัด R3 ออกทั้งหมด R15 ก็ยังได้ 56.0 ส่วน R19 ได้ 47.0** เพราะโมเดลตอบ missing เองกับข้อแบบ PM หลายข้อ และข้อกำหนดของ R15 มีข้อทั่วไปอย่าง Complex Problem Solving, Systems Analysis, Programming ที่เรซูเมสาย PM ฝั่งเทคนิคมีหลักฐานรองรับ
ดังนั้นแก้ R3 อย่างเดียวไม่พอ ต้องแก้ RC3 และ RC4 ด้วย

**ลำดับที่แนะนำให้แก้**

1. **P0 (ก่อนรัน T กับบริการจริง)** ใช้ R3 แบบสองชั้น (คำซ้ำ → ถ้าไม่ผ่านจึงให้โมเดลอีกตัวตรวจความหมาย) · ซ่อม quote ใน R2 · แยกสถานะ "ยังยืนยันไม่ได้" ออกจาก missing · ปรับ prompt เป็น v1.1 · สร้างชุด gold ที่มีป้ายกำกับเพื่อเลือก θ/τ
2. **P1** นับใบรับรอง/วุฒิเป็นหลักฐาน `partially` · ใช้ crosswalk ของ O\*NET กับ Essential Skills · เพิ่มดัชนีเฉพาะอาชีพ (Core Tasks + Hot Technology) · ปรับแผนให้ดูระดับประสบการณ์ · ตัดตัวเลข "→ 100"
3. **P2** ให้ผู้เรียนยืนยันหรือโต้แย้งช่องว่างได้ (Open Learner Model) · ใช้การวัดความคงที่และกรณีทดสอบ known-group เป็น regression test

---

## 1. อาการที่เห็นในรายงาน

| ตัวชี้วัด | R19 IT PM | R15 Network |
|---|---:|---:|
| คะแนนความพร้อม R | **10** | **11** |
| ข้อกำหนดที่มีหลักฐาน (evidenced/partially) | 1 / 4 | 3 / 1 |
| ข้อสรุปที่โมเดลอ้างว่ามีหลักฐาน | 19 | 18 |
| โมเดลตอบ missing เอง | 11 | 12 |
| R2 ตัด (quote ไม่ตรงตัว) | 1 | 0 |
| **R3 ตัด (overlap < θ 0.15)** | **13** | **14** |
| ผ่านการตรวจ | 5 | 4 |
| U (สัดส่วนที่ถูกตัด) | 73.7% | 77.8% |
| ความพร้อมรายโดเมน Essential / Transferable / Knowledge / Work Act. | 0 / 0 / 17 / 12 | 0 / 24 / 0 / 12 |
| แผน: ชั่วโมง · ค่าใช้จ่าย | 475 ชม. · $2,087 | 492 ชม. · $640 |
| "หลังเรียนจบแผน" | 10 → 100 | 11 → 100 |

**สิ่งที่บอกได้ทันที** โมเดลหาหลักฐานได้ราว 60% ของข้อ แต่ตัวกรองตัดทิ้งราว 75% U ที่สูงขนาดนี้ไม่ได้แปลว่าโมเดลแต่งข้อมูลเยอะ ส่วนใหญ่เป็นตัวกรองที่ตัดผิด (หัวข้อ 2.1)

---

## 2. สาเหตุ

### RC1 · R3 ใช้ lexical overlap ซึ่งเข้ากับภาษาของเรซูเมจริงไม่ได้ (สาเหตุหลัก)

สูตรตอนนี้ (สมการ 3.2, `overlapScore`)

```
ov(q, r) = |T(q) ∩ T(r)| / min(|T(q)|, 25)        ผ่านเมื่อ ov ≥ 0.15 หรือมีคำพ้องตรงทั้งวลี
T(r) = คำจาก element_name + element_description + element_aliases
```

**ตัวอย่างที่ถูกตัดทั้งที่เป็นหลักฐานชัดเจน**

| ข้อกำหนด | quote ที่อยู่ในเรซูเมจริง (ผ่าน R2) | ov | ทำไมได้ 0 |
|---|---|---:|---|
| Guiding, Directing, and Motivating Subordinates | "Directed 6 System Analysts, 12 Developers, and 3 QA engineers under CMMI Level 3, running performance evaluation and training needs analysis for each." | 0.067 | `directed` ≠ `directing` (ไม่มี stemming) · ตรงกันแค่ `performance` |
| Management of Personnel Resources | quote เดียวกัน | 0.000 | O\*NET ใช้คำ "motivating, developing, directing people" ส่วนเรซูเมใช้ "directed … performance evaluation … training needs" |
| Monitoring and Controlling Resources | "…THB 2.5M delivery cost against contract value, a 75% delivery margin." | 0.000 | O\*NET พูดถึง "spending of money" ส่วนเรซูเมพูดถึง "cost / margin" |
| Organizing, Planning, and Prioritizing Work | "Ran the full Agile SDLC … owning backlog, sprint cadence…" | 0.111 | คำพ้อง `backlog grooming` และ `sprint planning` ต้องตรงทั้งวลี |
| Computers and Electronics | "LLM (GPT, Gemini, Claude…), RAG …, SQL, NoSQL, AWS, Python, Golang" | 0.000 | คำพ้องของ element นี้ไม่มี python/sql/aws แต่ Programming มี `python` จึงผ่านได้ 1.0 |
| Making Decisions and Solving Problems | "Cut procurement cycle time from 45 days to 15, a 67% reduction…" | 0.000 | เป็นหลักฐานแบบผลลัพธ์ (STAR) ไม่มีคำว่า decision หรือ problem |

**สาเหตุย่อย 5 ข้อ**

1. **ไม่มี stemming** `directed/directing`, `certified/certification`, `coordinated/coordination` จึงไม่ถูกนับว่าตรงกัน ทั้งที่ `WF_SUB_GapEngine_28AUG26` เคยมี light stemmer และให้คำพ้องผ่านเมื่อพบ token ครบ ความสามารถนี้หายไปตอนเขียน engine ใหม่ **(เป็น regression)**
2. **prompt กับ R3 ขัดกันเอง** prompt ข้อ 3–4 ขอ "concrete task, tool or result" ยาว 20–300 ตัวอักษร แต่ R3 หารด้วยจำนวนคำของ quote (สูงสุด 25) quote ที่ยาวและมีรายละเอียดจึงยิ่งถูกลดคะแนน คือยิ่งทำตาม prompt ยิ่งตกเกณฑ์
3. **T(r) มีแต่คำนิยามกลางของ O\*NET** ไม่มีคำจากงานจริงของอาชีพนั้น เช่น Task statements, DWA, Technology ทั้งที่ข้อมูลนี้มีอยู่แล้วใน `Data_Set.xlsx` (R14, R16, 04_Role_Technology, F11)
4. **คำพ้องน้อยและเป็นคำทั่วไป** (62 element · ราว 8–11 คำ/ข้อ) และต้องตรงทั้งวลี
5. **ผลขึ้นกับว่าโมเดลตัด quote ตรงไหน** หลักฐานชุด BAAC ข้อ Analyzing Data: รอบ R15 ยกมาทั้งประโยค มีคำว่า `analytics` จึงผ่านที่ 1.0 ส่วนรอบ R19 ยกมาแค่ครึ่งท้าย จึงได้ 0 ทั้งที่เป็นหลักฐานเดียวกัน

#### 2.1 วัดผลกระทบ (ทดลองแบบออฟไลน์กับข้อสรุป 36 ข้อจาก 2 รายงาน)

ป้ายกำกับเป็นการตัดสิน**เบื้องต้นของ Claude** (Y = quote เกี่ยวกับข้อกำหนดจริง 31 ข้อ · N = ไม่เกี่ยว 3 ข้อ · ? = กำกวม 2 ข้อ) **ต้องให้ผู้วิจัยหรือผู้เชี่ยวชาญยืนยันก่อนนำไปใช้ในเล่ม** "อัตราผ่านคู่ที่ไม่เกี่ยว" คือการนำ quote เดียวกันไปเทียบกับข้อกำหนดอื่นอีก 29 ข้อของอาชีพนั้น (744 คู่) ซึ่งเป็นค่าประมาณขอบบนของการรับหลักฐานผิด

| รุ่น R3 | Recall (Y ที่ผ่าน) | N ที่ผ่าน | อัตราผ่านคู่ที่ไม่เกี่ยว |
|---|---:|---:|---:|
| V0 ปัจจุบัน | **0.26** (8/31) | 1/3 | 6.2% |
| V1 + stemming | 0.35 | 1/3 | 7.5% |
| V2 + stemming + DWA/Task/Technology ของอาชีพ | 0.55 | 1/3 | 22.4% |
| V3 + stemming + DWA ทั่วไปทั้ง GWA (F11) | 0.61 | 1/3 | 34.8% |
| V4 = V2 + เพดานตัวหาร 10 | 0.58 | 1/3 | 29.8% |
| V5 แบบ 28AUG26 (stemmer + token-subset alias) | 0.19 | 0/3 | 5.9% |
| ปรับแค่ θ ของ V0 เป็น 0.05 | 0.45 | – | 16% |

**ข้อสรุป** การจับคู่คำมีเพดาน ถ้าจะได้ recall เกิน 0.6 ต้องยอมให้คู่ที่ไม่เกี่ยวผ่าน 1 ใน 3 การปรับ θ หรือเพิ่มคำพ้องจึง**แก้ไม่ได้** ต้องเพิ่มการตรวจเชิงความหมาย (S1) ข้อนี้ตรงกับที่ `Review_IS_18SEP.md` หัวข้อ 3.5 เตือนไว้ว่า R3 จะเป็นจุดที่ถูกโจมตีหนักที่สุด

**R3 ก็จับได้ถูกบางข้อ** "Delivered 500+ live episodes…" ถูกอ้างเป็นหลักฐาน **Telecommunications** ซึ่งเป็นการตีความเกินของโมเดล R3 ตัดทิ้งถูกต้อง แต่ "rebuilding the requisition-to-payment flow…" ผ่าน R3 (0.17) เป็น **Customer and Personal Service** ซึ่งไม่เกี่ยว จึงเป็นการรับผิด ชั้นคำซ้ำจึงควรเก็บไว้เป็นด่านแรกที่ราคาถูก แต่ไม่ควรเป็นด่านเดียว

#### 2.2 คะแนนจะเป็นเท่าไรถ้าเปลี่ยน R3

| เงื่อนไข | R19 IT PM | R15 Network |
|---|---:|---:|
| ปัจจุบัน (คำนวณซ้ำ ตรงกับรายงาน) | 10.3 | 10.9 |
| V2 (stemming + เพิ่มคำจาก O\*NET ของอาชีพ) | 28.8 | 25.5 |
| R2 อย่างเดียว ไม่มี R3 | 47.0 | **56.0** |
| R2 + R3 ที่คนตัดสิน (ตัดเฉพาะ N) | 45.4 | **48.9** |

แม้ R3 จะสมบูรณ์ R15 ก็ยังสูงกว่า R19 จึงต้องดู RC3 และ RC4 ต่อ

### RC2 · ข้อที่ไม่ผ่าน R2/R3 ได้ค่าเท่ากับข้อที่ไม่มีหลักฐานจริง

`evaluateRun` และ `verify_evidence.js` เปลี่ยนเสียงที่ไม่ผ่าน R2 หรือ R3 เป็น `missing` (คะแนน 0) แล้วรวมเข้า D (เล่ม 3.4.4 ระบุว่าเป็น "การเลือกเชิงออกแบบ") แต่สองกรณีนี้หมายถึงคนละอย่าง

- **R2 ไม่ผ่าน** โมเดลยกข้อความที่ไม่มีในเรซูเม เป็นสัญญาณ hallucination การนับเป็น missing จึงสมเหตุสมผล
- **R3 ไม่ผ่าน** ข้อความมีอยู่จริง แต่ตัววัดยืนยันความเกี่ยวข้องไม่ได้ จึงเป็นความไม่แน่นอนของตัววัด ไม่ใช่หลักฐานว่าผู้สมัครขาดทักษะ

ใน Demo ที่ใช้โมเดลเดียว การตัดสินของตัวกรองหนึ่งครั้งกลายเป็นสถานะสุดท้ายเลย ในระบบ 3 โมเดล R3 จะเปลี่ยนเสียงของทุกโมเดลเป็น missing แล้ว R1 ก็จะได้ missing ตามเสียงข้างมาก ปัญหาจึงเกิดเหมือนกัน

### RC3 · โมเดลตอบ missing เองมาก และผลไม่คงที่

- รอบ R19 โมเดลตอบ missing เอง 11 ข้อ ได้แก่ Developing Objectives and Strategies, Establishing and Maintaining Interpersonal Relationships, English Language, Identifying Objects/Actions/Events, Resolving Conflicts and Negotiating, Critical Thinking, Monitoring Processes, Reading Comprehension, Active Listening, **Coordination**, **Time Management** สำหรับ PM 8 ปีที่มี PSPO และ Google PM Certificate ผลนี้ไม่น่าเชื่อ
- **ผลไม่คงที่** Coordination ในรอบ R15 ได้ evidenced ("…stakeholder coordination…" มีคำพ้องตรง) แต่ในรอบ R19 ได้ missing ทั้งที่เรซูเมเหมือนกัน รายการข้อกำหนดที่ส่งไปต่างกันทำให้โมเดลให้ความสนใจต่างกัน ร่วมกับการสุ่ม (ไม่ได้ส่ง temperature · thinking = low · ตอบรอบเดียว)
- **prompt เข้มเกิน** ข้อ 2 "Do not infer a skill from a job title…" และข้อ 3 "Merely listing the skill name is not enough" ทำให้โมเดลไม่กล้าให้ทักษะพื้นฐาน (Reading Comprehension, Active Listening, Critical Thinking) ซึ่งเรซูเมแทบไม่เคยเขียนตรง ๆ **ทุกคนจึงจะได้ Essential Skills ใกล้ 0% เสมอ** เป็นความลำเอียงเชิงโครงสร้าง
- English Language ได้ missing ทั้งที่เรซูเมเขียนเป็นภาษาอังกฤษทั้งฉบับและมีวุฒิ MSc ตามกฎปัจจุบันถือว่าถูก แต่ผู้ใช้อ่านแล้วไม่เข้าใจ
- R2 ตัด 1 ข้อเพราะโมเดลแก้คำ เรซูเมเขียน "…directing cross-functional teams of 50+…" แต่โมเดลส่ง "Directed cross-functional teams of 50+…" R2 ทำงานถูกต้อง แต่หลักฐานจริงหายไปทั้งข้อ

### RC4 · ข้อกำหนด 30 ข้อแยกอาชีพในกลุ่ม IT ได้น้อย (ปัญหา construct validity)

- R19 กับ R15 ใช้ element ร่วมกัน **19/30 ข้อ** (63% ของน้ำหนัก R19) · ทุกคู่ของ 20 อาชีพใช้ร่วมกันเฉลี่ย **76%** (ต่ำสุด 57% สูงสุด 90%)
- สิ่งที่ทำให้ IT PM ต่างจาก Network Engineer อยู่ใน **Core Tasks** ("Manage project execution to ensure adherence to budget, schedule, and scope" IM 4.48) และ **Hot Technology** (JIRA, MS Project, ServiceNow) ซึ่งรายงานแสดงไว้ท้ายฉบับ **แต่ไม่ได้ใช้คำนวณคะแนน**
- ผลคือ R สะท้อน "ความสามารถด้าน IT ทั่วไปที่เขียนให้ตรวจได้" มากกว่าความพร้อมสำหรับอาชีพที่เลือก เรซูเม PM ที่มีงานเทคนิคมาก (SAP integration, forecasting engine, LLM/RAG) จึงได้คะแนนจาก element เทคนิคของ R15 (Systems Analysis, Systems Evaluation, Complex Problem Solving, Programming)
- **known-group validity ยังไม่เคยทดสอบ** เรซูเมของคนที่ทำอาชีพนั้นอยู่แล้วควรได้คะแนนอาชีพนั้นสูงกว่าอาชีพอื่น กรณีนี้ไม่ผ่าน

### RC5 · ใบรับรองและวุฒิไม่ถูกนับเป็นหลักฐาน

- `verify_evidence.js` ตรวจใบรับรอง 6 ใบผ่าน R2 แล้วแสดงในหน้ารายงานเท่านั้น
- `plan_pathway.js` ใช้ใบรับรองเพียงเพื่อตัดรายการที่มีอยู่แล้วออกจากแผน (Google Project Management Professional Certificate)
- ไม่มีทางไหนเชื่อมใบรับรองหรือวุฒิเข้ากับข้อกำหนด ทั้งที่ prompt ข้อ 3 กำหนดเองว่า "course/training" = `partially` ข้อมูล `covers_l1` ของรายการใน corpus ก็ทำหน้าที่เป็น mapping ได้อยู่แล้ว

### RC6 · ช่องว่างในการทดสอบ จึงไม่พบปัญหานี้ก่อนหน้า

| การทดสอบเดิม | ตรวจอะไร | ตรวจไม่ได้ |
|---|---|---|
| tests 61/61 · analysis 8/8 | สูตรและตรรกะถูกต้องตามสเปก | ว่าสเปกให้ผลที่สมเหตุสมผลหรือไม่ |
| n8n 14/14 กรณี (DEC-48) | การส่งข้อมูลระหว่างโหนด · โมเดลจำลองตอบตามที่ออกแบบไว้ | พฤติกรรมของโมเดลจริง |
| Demo (Setup_wf_demo) | ใช้กฎสำรองเพราะเครื่องทดสอบบล็อก Gemini (readiness 29.38) | Gemini จริงไม่เคยรันจนถึงวันนี้ |
| เรซูเมสังเคราะห์ (`make_sample_resumes.py`) | ประโยคสั้นใช้กริยาแบบ O\*NET ("Coordinated with…", "Planned two-week sprints…") | เรซูเมจริงที่เขียนแบบเน้นผลลัพธ์และตัวเลข (distribution shift) |

θ = 0.15 "เลือกจากการทดลองกับเรซูเมสังเคราะห์" (เล่ม 3.4.4) **ผู้สร้างข้อมูล ผู้ตั้งเกณฑ์ และผู้ประเมินเป็นคนเดียวกัน** (Review_IS_18SEP 3.5 ข้อ 2) ผลวันนี้เป็นหลักฐานเชิงประจักษ์ครั้งแรกว่าเกณฑ์นี้ใช้กับเรซูเมจริงไม่ได้

### RC7 · ช่องว่างที่ผิดพาแผนเรียนผิดไปด้วย (มุม EdTech)

- แผนทำงานถูกตามสมการ 3.7–3.8 แต่รับช่องว่างผิดเข้ามา PM 8 ปีที่มีวุฒิ MSc จึงได้คอร์ส Beginner: Understanding Research Methods (สำหรับ Getting Information), Write Professional Emails in English, Learning How to Learn, Critical Thinking Skills, CAPM (สำหรับ Reading Comprehension), PMP Exam Prep (สำหรับ Time Management)
- **แผนไม่ดูระดับผู้เรียน** ไม่ใช้ `level_lv` ของข้อกำหนด จำนวนปีประสบการณ์ หรือสถานะ partially ในการเลือกระดับคอร์ส
- **"หลังเรียนจบแผน 10 → 100" อ้างเกินจริง** โค้ดสมมติว่าเรียนจบ = evidenced ซึ่งขัดกับนิยาม evidenced ของงานวิจัยเอง (prompt ข้อ 3 กำหนดว่าคอร์ส = partially) และเป็นการเอา completion มาแทน competence
- ผู้เรียนโต้แย้งผลไม่ได้ ทำให้ความเชื่อใจและการยอมรับ (TAM/UTAUT) ลดลง ข้อนี้กระทบโดยตรงกับแบบประเมินความพึงพอใจของผู้เข้าร่วม 30 คน

### RC8 · การสื่อสารในรายงาน

- ป้าย "ต้องพัฒนาเพิ่ม" พร้อมวงแหวน 10/100 ทำให้ผู้ใช้เข้าใจว่าตัวเองไม่พร้อม ทั้งที่ระบบแค่ยืนยันหลักฐานไม่ได้
- หน้าแรกไม่แสดง C (สัดส่วนที่สรุปได้) คู่กับ R ตามที่เล่ม 3.4.6 กำหนดว่าต้องรายงานคู่กันเสมอ
- รายการที่ R3 ตัดแสดงเป็นตัวขีดฆ่าพร้อมคำว่า "ข้อความไม่เกี่ยวกับข้อกำหนด" ผู้ใช้อ่านแล้วรู้สึกว่าระบบผิด เพราะข้อความเหล่านั้นเกี่ยวจริง

---

## 3. แนวทางแก้

ลำดับความสำคัญ: P0 = ทำก่อนรัน T กับบริการจริง · P1 = ก่อนแก้เล่มรอบ B · P2 = ก่อนนำร่อง (pilot)

### S1 (P0) · R3 แบบสองชั้น: ตรวจคำซ้ำก่อน แล้วจึงให้โมเดลอีกตัวตรวจความหมาย

```
R3a lexical (คงไว้เป็นด่านแรก ราคาถูก ทำซ้ำได้)
    ov ≥ θ หรือพบคำพ้อง  → ผ่าน (flag R3a_pass)
    เพิ่ม: light stemming ทั้งสองฝั่ง + คำพ้องผ่านเมื่อพบ stem ครบทุกตัว (คืนความสามารถของ 28AUG26)
R3b semantic (เรียกเฉพาะข้อที่ไม่ผ่าน R3a)
    ทางเลือก A (แนะนำ · ตรงกับกรอบหลายโมเดล): cross-model verifier
        โมเดลที่ไม่ใช่โมเดลที่อ้าง ตอบรวดเดียวทุกข้อ:
        {"checks":[{"requirement_id","verdict":"supports|partially_supports|unrelated","reason_en"}]}
        ผ่านเมื่อ verdict ≠ unrelated · ถ้าได้ partially_supports ให้ลดสถานะเป็น partially
    ทางเลือก B: embedding cosine(quote, element_name + description + DWA ของอาชีพ) ≥ τ
        τ ปรับจากชุด gold (S9) · ต้องตรึงรุ่น embedding
R3 ไม่ผ่านทั้งสองชั้น → สถานะ unverified (S3)
```

- **Demo (โมเดลเดียว)** เพิ่มโหนด `Verify Relevance (Gemini judge)` ต่อจาก `Verify Evidence` ใช้ prompt คนละชุดและ thinking = medium ระบุในรายงานว่า "self-verification · ระบบเต็มใช้โมเดลคนละผู้ให้บริการ"
- **ระบบเต็ม** ให้เสียงของโมเดล A ตรวจโดย B, ของ B ตรวจโดย C, ของ C ตรวจโดย A (หมุนเวียน) ใช้การเรียกที่มีอยู่แล้ว 3 ครั้ง + เรียกตรวจอีก 3 ครั้งที่สั้นกว่า
- **ข้อดีต่องานวิจัย** ได้ ablation ใหม่ "R3 lexical vs R3 hybrid" ที่คำนวณย้อนหลังจาก `findings` ได้ ตอบคำถามข้อ 3 และ 5 ใน Review_IS_18SEP โดยตรง
- **ไฟล์** `engine/engine.js` (overlapScore, evaluateRun, เพิ่ม `stem`, `ruleR3b`) · `prompts/verifier_v1.0.txt` + schema · `workflows/src/*` (โหนดตรวจ) · `demo/src/verify_evidence.js` + โหนดใหม่ใน `build_wf_demo.mjs` · `config/project.json` (`r3_mode`, `tau`) · tests

### S2 (P0) · ซ่อม quote ใน R2 (span repair) โดยยังคงหลักว่าหลักฐานทุกชิ้นต้องตรงกับเรซูเม

ถ้าไม่พบ quote แบบตรงตัวหรือยุบช่องว่าง ให้ค้นแบบไม่สนตัวพิมพ์และเครื่องหมาย (`’ ' – - …`) แล้วเลื่อนหน้าต่างหา span ที่ token-level similarity ≥ 0.90 ถ้าพบ ให้ **แทน quote ด้วยข้อความจริงจากเรซูเม** ติด flag `R2_repaired` และนับใน U แยกไว้ ข้อความที่แสดงในรายงานยังคงตรงกับเรซูเม 100%

กรณีนี้ "Directed cross-functional teams…" จะได้ span จริง "directing cross-functional teams of 50+ against fixed, unmovable air times."

### S3 (P0) · แยกสถานะ "ยังยืนยันไม่ได้" ออกจาก missing

| ผลการตรวจ | สถานะเสียงตอนนี้ | เสนอ |
|---|---|---|
| R2 ไม่ผ่าน (หลังซ่อมแล้ว) | missing | **missing** (ยังเป็นสัญญาณ hallucination · นับใน U) |
| R3a และ R3b ไม่ผ่าน | missing | **unverified** ไม่นับใน D ของ R แต่ทำให้ C ลดลง · นับใน U |
| R3b = partially_supports | evidenced/partially เดิม | **partially** |

รายงาน R ไว้คู่กันสองค่าเป็นการวิเคราะห์ความไว (sensitivity) คือ R_strict (กฎเดิม) และ R_verified (กฎใหม่) แล้วให้อาจารย์เลือกว่าตัวไหนเป็นตัวหลักใน DEC

### S4 (P0) · prompt analyst_v1.1

1. **quote สั้นลง** ขอ "the shortest contiguous span that shows the requirement (20–160 chars)" ให้ R3a ทำงานได้ดีขึ้นและอ่านง่ายขึ้น
2. **ให้ quote ได้สูงสุด 2 ชิ้นต่อข้อ** (`quotes: []`) ลดผลจากการเลือกจุดตัด quote (RC1 ข้อย่อย 5)
3. **อธิบายข้อ 2 ให้ชัดขึ้น** ห้ามอนุมานจาก *ชื่อตำแหน่ง ชื่อบริษัท จำนวนปี* แต่ **อนุญาต** ให้ใช้กิจกรรมที่บรรยายไว้เป็นหลักฐานของทักษะพื้นฐาน เช่น "led requirement elicitation workshops" → Active Listening = partially
4. **เพิ่ม `evidence_type`** (`action | result | tool_list | credential | education`) ใช้แยกวิเคราะห์ และใช้กับกฎ partially
5. **ใช้ structured output** (`responseSchema` ของ Gemini, `response_format`/tool schema ของผู้ให้บริการอื่น) ลด R0 fail
6. **ความคงที่** thinking = medium · ส่ง temperature 0 ถ้ารับได้ (ผูกกับ DEC-49) · Demo เรียก 3 ครั้งแล้วโหวตข้างมาก (self-consistency) ใช้แทน R1 ในโหมดโมเดลเดียว
7. **แบ่งข้อกำหนดเป็น 2 ชุด ชุดละ 15 ข้อ** ถ้า T1 พบว่าความครบหรือความคงที่ยังต่ำ

### S5 (P1) · นับใบรับรองและวุฒิเป็นหลักฐาน partially

- นำใบรับรองที่ผ่าน R2 ไปจับคู่กับ `corpus` (exact title / exam_code / alias) แล้วใช้ `covers_l1` ของรายการนั้นตั้งข้อที่ครอบคลุมเป็น `partially` (`evidence_type=credential`) ตาม prompt ข้อ 3 ไม่ต้องสร้าง mapping ใหม่
- ข้อ Updating and Using Relevant Knowledge: ใบรับรองที่มีปี ≥ 1 ใบในช่วง 3 ปีล่าสุด หรือวุฒิสูงกว่าปริญญาตรีในสาขาที่เกี่ยวข้อง → partially
- ใบรับรองที่ไม่อยู่ใน corpus ส่งเข้า R3b โดยใช้ชื่อใบรับรองเป็น quote

### S6 (P1) · Essential Skills: ใช้ crosswalk ของ O\*NET แทนการบังคับให้ต้องเขียนไว้ตรง ๆ

`Data_Set.xlsx` มี **F13 EssSkills→WorkAct** และ **F15 TrfSkills→WorkAct** ซึ่งเป็น linkage ทางการของ O\*NET เสนอกฎ **R5-linkage** ถ้า work activity ที่เชื่อมกัน ≥ 1 ข้อมีสถานะ evidenced หลังตรวจ ให้ skill นั้นเป็น `partially` (ไม่ให้เป็น evidenced) ติด flag ให้เห็นในรายงาน ทางเลือกอีกทางคือรายงาน Essential Skills แยกว่า "สังเกตจากเรซูเมได้จำกัด" แล้วไม่นำมารวมใน R หลัก

### S7 (P1) · ดัชนีเฉพาะอาชีพ (role-specific fit)

| ทางเลือก | ทำอะไร | ผลต่อเล่ม |
|---|---|---|
| **A (แนะนำ)** เพิ่มดัชนีเสริม `R_role` | ตรวจหลักฐานกับ Core Tasks 6–10 ข้อ (IM สูงสุด) + Hot Technology ของอาชีพ ด้วยกฎเดียวกัน (R2 → R3 hybrid) · แสดงคู่กับ R ไม่รวมเป็นตัวเลขเดียว | เพิ่มหัวข้อย่อยในบทที่ 3 · R ตามสมการ 3.4 คงเดิม |
| B ถ่วงน้ำหนักตามความเฉพาะ | w′ = IM × (1 + IM_role − IM เฉลี่ยของ 20 อาชีพ) | เปลี่ยนสมการ 3.1 · ต้องทำ G-600 ใหม่ |
| C เปลี่ยนวิธีเลือก Top-30 | ใส่ Task เป็นโดเมนที่ 5 | เปลี่ยนคลัง/mapping มาก · ไม่แนะนำในรอบนี้ |

ใช้ **known-group test** (S9) เป็นเกณฑ์ตัดสินว่าทางเลือกไหนพอ

### S8 (P1–P2) · ปรับแผนเรียนและการสื่อสาร (EdTech)

1. **ระบุชนิดช่องว่าง** แผนรับเฉพาะ `missing` ที่ยืนยันแล้ว และ `partially` ส่วน `unverified` แสดงเป็น "ให้ผู้เรียนยืนยัน" ไม่ใส่ในแผนอัตโนมัติ
2. **ให้แผนดูระดับผู้เรียน** ถ้าข้อเป็น `partially` หรือผู้สมัครมีประสบการณ์ ≥ 5 ปี ให้ข้ามรายการระดับ Beginner ที่ไม่ใช่ใบรับรอง · ใช้ `level_lv` ของข้อกำหนดเทียบกับ `difficulty` ของรายการ
3. **ตัด "→ 100"** แทนด้วย "แผนครอบคลุมช่องว่าง x/y ข้อ" และคำอธิบายว่าการเรียนจบจะเปลี่ยนสถานะเป็นอย่างมากที่ partially จนกว่าจะมีผลงานจริง
4. **Open Learner Model** ผู้เรียนกด "ฉันมีประสบการณ์นี้" แล้วแนบข้อความหรือลิงก์ผลงานได้ ระบบนำไปตรวจผ่าน R2/R3 รอบสอง (negotiated learner modelling: Bull & Kay) ช่วยทั้งความถูกต้อง ความเชื่อใจ และ learner agency และวัดผลได้ในแบบประเมิน
5. **หน้าแรกของรายงาน** แสดง R + C + U คู่กันตามเล่ม 3.4.6 · ใช้สีสามระดับ ✓ ยืนยันแล้ว / ? ยังยืนยันไม่ได้ / ✕ ไม่พบ · เปลี่ยนคำในรายการที่ถูกตัดจาก "ข้อความไม่เกี่ยวกับข้อกำหนด" เป็น "ระบบยังยืนยันความเกี่ยวข้องไม่ได้"

### S9 (P0 สำหรับงานวิจัย) · ชุดตรวจความถูกต้องของคะแนน (เดิมยังไม่มี)

| ชุดทดสอบ | วิธี | เกณฑ์ผ่าน (เสนอ · ให้อาจารย์ยืนยัน) |
|---|---|---|
| **Gold-R3** (ใช้ปรับ θ/τ) | คู่ quote–ข้อกำหนด ≥ 150 คู่ จาก 36 คู่ในเอกสารนี้ + เรซูเมสังเคราะห์หลายสไตล์ · ผู้ให้ป้าย 2 คน (relevant / partial / unrelated) · แยก tuning กับ test ชัดเจน | κ ≥ 0.6 · precision ≥ 0.90 · recall ≥ 0.75 บนชุด test |
| **Known-group** | เรซูเมของคนที่ทำอาชีพนั้นอยู่แล้ว 4 อาชีพของ Demo × 2 ฉบับ รันกับทั้ง 4 อาชีพ | อาชีพเป้าหมายต้องอยู่อันดับ 1 หรือสูงกว่าอันดับรอง ≥ 10 คะแนน |
| **Style-invariance** | ข้อเท็จจริงชุดเดียวกันเขียน 3 สไตล์ (กริยาแบบ O\*NET / STAR เน้นตัวเลข / รายการทักษะ) | \|ΔR\| ≤ 10 ระหว่างสไตล์ |
| **Stability** (T3 เดิม) | รันซ้ำ 3 รอบ | สถานะตรงกัน ≥ 85% · Fleiss κ ≥ 0.7 |
| **Regression** | ทำ fixture จาก 36 ข้อสรุปนี้ (เก็บแบบปิดบัง) ใน `tests/` | ห้ามถดถอย |

ชุดนี้คือส่วน "evaluation" ที่ Review_IS_18SEP ระบุว่ายังขาด และ**ทำได้ก่อนได้หนังสือรับรองจริยธรรม** เพราะใช้เรซูเมสังเคราะห์และเรซูเมของผู้วิจัยเองเท่านั้น

---

## 4. ผลที่คาดไว้หลังแก้ (ต้องยืนยันด้วย S9)

| ขั้น | คาดผลต่อเรซูเมนี้ (R19 / R15) | ใช้ยืนยัน |
|---|---|---|
| ปัจจุบัน | 10 / 11 | – |
| + S2 + S1 (R3 hybrid) + S3 | ราว 45–50 / 45–55 (ใกล้ "R2 + human-judged") | Gold-R3 |
| + S4 + S5 + S6 | R19 สูงขึ้นจาก Coordination, Time Mgmt, Essential Skills, ใบรับรอง (คาด 60+) | Stability, Known-group |
| + S7 (R_role) | R_role ของ R19 > R15 อย่างชัดเจน (Core Tasks ของ PM ตรงกับเรซูเม) | **Known-group ผ่าน** |

ตัวเลขช่วงในตารางนี้เป็นการคาดการณ์ ไม่ใช่ผลวัด ห้ามนำไปใส่ในเล่ม

---

## 5. ผลต่อเล่มและ DEC ที่ต้องเขียน

DEC-49 (temperature) และ DEC-50 (ผล P1) จองไว้แล้วใน `Plan_03OCT26` ข้อเสนอนี้จึงเริ่มที่ DEC-51

| DEC | เรื่อง | ส่วนของเล่มที่กระทบ |
|---|---|---|
| DEC-51 | R3 hybrid (stemming + token-subset alias + R3b verifier) · θ/τ จาก Gold-R3 | 3.4.4 (สมการ 3.2, ตาราง 3.12, รูป 3.6) · ตาราง 3.10 · 3.11 ข้อจำกัด · ภาคผนวก prompt |
| DEC-52 | R2 span repair | 3.4.4 ย่อหน้า R2 · ตาราง 3.12 |
| DEC-53 | สถานะ unverified · R_strict/R_verified | 3.4.4 ย่อหน้า "การเปลี่ยนเสียงเป็น missing" · 3.4.6 สมการ 3.4–3.6 |
| DEC-54 | prompt analyst_v1.1 + structured output + self-consistency (Demo) | 3.5 · ภาคผนวก prompt · ตาราง 3.7 |
| DEC-55 | credential linkage (S5) + R5-linkage (S6) | 3.4.4–3.4.6 · ตารางกฎ |
| DEC-56 | ดัชนีเสริม R_role (S7-A) | บทที่ 3 หัวข้อใหม่ · แบบรายงาน |
| DEC-57 | ชุดตรวจความถูกต้อง S9 · เกณฑ์ผ่าน | 3.6.3 · 3.8 การวิเคราะห์ · ตาราง 3.1 สถานะงาน |
| DEC-58 | Demo: ตัด "→100" · ป้ายสามระดับ · OLM | ไม่กระทบเล่ม (DEC-44: Demo อยู่นอกเล่ม) |

**ข้อควรระวังต่อจริยธรรม** ถ้าเพิ่มโมเดลตรวจ (R3b) หรือเปลี่ยนข้อมูลที่ส่งออกนอกเครื่อง ต้องแก้คำชี้แจงผู้เข้าร่วมใน `docs/ethics/` ก่อนยื่น ควรตัดสิน S1 ก่อนยื่นจริยธรรม

**ข้อดีของปัญหานี้** หลักฐานวันนี้ (R3 lexical recall 0.26 บนเรซูเมจริง) เป็น *ผลเชิงประจักษ์* ที่ใช้อธิบายเหตุผลของการออกแบบ R3 แบบ hybrid ในเล่มได้ทันที และตอบข้อวิจารณ์ "lexical overlap ≠ semantic relevance" ด้วยตัวเลข

---

## 6. ลำดับงาน (แทรกก่อนช่วง C/T ใน Plan_03OCT26)

| # | งาน | ผู้ทำ | ไฟล์ | เสร็จเมื่อ |
|---|---|---|---|---|
| Q0 | ยืนยันป้าย Y/N/? 36 ข้อในภาคผนวก A | 👤 | ภาคผนวก A | กรอกครบ |
| Q1 | DEC-51–53 ร่าง + ส่งอาจารย์พร้อมตาราง 2.1–2.2 | 🤖 → 👤 | `docs/DECISIONS.md` | อาจารย์รับทราบ |
| Q2 | stemming + token-subset alias + span repair + unverified ใน engine + tests | 🤖 | `engine/engine.js` · `tests/` | tests ผ่าน + fixture 36 ข้อ |
| Q3 | prompt v1.1 + verifier v1.0 + schema | 🤖 | `prompts/` | R0 ผ่านกับเรซูเม A/B/C |
| Q4 | Demo: โหนด Verify Relevance + self-consistency 3 รอบ + UI สามระดับ + ตัด "→100" | 🤖 | `demo/src/*` · `build_wf_demo.mjs` | รันเรซูเมนี้ใหม่ได้ R19 > R15 หรือบันทึกเหตุผล |
| Q5 | สร้างเรซูเมสังเคราะห์ 3 สไตล์ × 4 อาชีพ + ป้าย Gold-R3 | 🤖 + 👤 (ผู้ให้ป้ายคนที่ 2) | `synthetic/` · `evidence/` | κ ≥ 0.6 |
| Q6 | ปรับ θ/τ บน tuning set แล้วรายงานบน test set | 🤖 | `analysis/` | ตาราง precision/recall |
| Q7 | S5 + S6 + S7-A | 🤖 | engine · demo | known-group ผ่าน |
| Q8 | build workflow เต็ม → n8n จำลอง 14/14 (กันถดถอย) → ทำ T1–T3 ต่อตามแผนเดิม | 🤖 | `workflows/` | Gate C/T เดิม |

---

## 7. สถานะการแก้ (3 ต.ค. 2569)

| ข้อ | DEC | ทำแล้ว | ไฟล์หลัก | ค้าง |
|---|---|---|---|---|
| S1 R3 สองชั้น | 51 | R3a คำซ้ำ + stemming · R3b โมเดลอื่นตรวจความหมาย (verifier_v1.0 · หมุน A→B→C→A) | `engine/engine.js` · `prompts/verifier_v1.0.*` · workflow 79 โหนด | ยืนยันกับโมเดลจริง |
| S2 ซ่อม quote | 52 | R2 ตรง / ช่องว่าง / ซ่อม LCS ≥ 0.9 (≥ 5 คำ) ใช้ข้อความจริงจากเรซูเม | `engine.js#repairQuote` | — |
| S3 ยังยืนยันไม่ได้ | 51/58 | เสียง unverified ไม่นับใน R1 · Demo ป้าย "ยังยืนยันไม่ได้" เมื่อ C < 0.6 | `engine.js` · `demo/src/app.js` | — |
| S4 prompt v1.1 | 53 | quote ≤ 2 ชิ้น ≤ 160 ตัวอักษร · evidence_type · งานหลัก · max output 16,384 | `prompts/analyst_v1.1.*` · `config/models.json` | smoke test |
| S5 ใบรับรอง | 54 | R5 ใบรับรองในคลังที่พบในเรซูเม → อย่างน้อย partially | `engine.js#credentialEvidence` | — |
| S6 Essential Skills | 54 | R6 ผ่าน O*NET skill links → อย่างน้อย partially | `data/skill_links.csv` | อาจารย์ยืนยัน |
| S7 ดัชนีเฉพาะอาชีพ | 55 | T (งาน Core 8 งาน) · H (Hot Technology) รายงานแยกจาก R | `data/role_tasks.csv` · `role_technology.csv` | — |
| S8 แผนและการสื่อสาร | 56/58 | กรองระดับ (≥ 5 ปี) · ตัด "→ 100" · Open Learner Model | `engine.js#buildPlan` · demo | — |
| S9 ชุดตรวจความตรง | 57 | Gold-R3 82 คู่ · known-group · style-invariance · stability · กรณี D | `scripts/validate_scoring.mjs` · `scripts/r3_gold.mjs` · `synthetic/validation/` | รันกับ Gemini · ผู้ให้ป้ายคนที่ 2 |

ผลกับกรณีสังเคราะห์ (oracle verifier): D (เรซูเมแบบผลงาน) R 88.14 เทียบ lexical-only 31.48 · A 67.72 · B 23.12 · C 43.58 · tests 78/78 · เล่ม 84 หน้า (`evidence/QA_Final_03OCT26.md`)

---

## ภาคผนวก A · ข้อสรุป 36 ข้อ (ov ปัจจุบัน V0 / ov แบบ V2 · ป้ายเบื้องต้นของ Claude)

| # | อาชีพ | ข้อกำหนด | สถานะที่อ้าง | V0 | V2 | ป้าย | หมายเหตุ |
|---|---|---|---|---:|---:|:-:|---|
| 1 | R19 | Comm. w/ Supervisors, Peers… | partially | 0.33 | 0.33 | Y | ผ่าน |
| 2 | R19 | Developing and Building Teams | partially | 0.50 | 0.50 | Y | ผ่าน |
| 3 | R19 | Updating and Using Relevant Knowledge | partially | 0.20 | 0.20 | Y | ผ่าน (MSc) |
| 4 | R19 | Interpreting the Meaning of Info | evidenced | 0.19 | 0.19 | Y | ผ่าน |
| 5 | R19 | Customer and Personal Service | partially | 0.17 | 0.17 | **N** | **รับผิด** (procurement ≠ customer service) |
| 6 | R19 | Getting Information | partially | 0.00 | 0.50 | Y | "requirement elicitation" |
| 7 | R19 | Organizing, Planning, Prioritizing | evidenced | 0.11 | 0.18 | Y | Agile SDLC, backlog |
| 8 | R19 | Working with Computers | evidenced | 0.00 | 0.28 | Y | SAP B1 integration |
| 9 | R19 | Scheduling Work and Activities | evidenced | 0.06 | 0.06 | Y | sprint cadence (หลักฐานอ่อน) |
| 10 | R19 | Making Decisions and Solving Problems | partially | 0.00 | 0.00 | Y | "root cause analysis" |
| 11 | R19 | Monitoring and Controlling Resources | evidenced | 0.00 | 0.00 | Y | cost vs contract value |
| 12 | R19 | Guiding, Directing, Motivating Subordinates | evidenced | 0.07 | 0.27 | Y | directed 21 people |
| 13 | R19 | Computers and Electronics | evidenced | 0.00 | 0.25 | Y | รายการทักษะ (ควรเป็น partially) |
| 14 | R19 | Documenting/Recording Information | partially | 0.00 | 0.00 | Y | SRS |
| 15 | R19 | Analyzing Data or Information | partially | 0.00 | 0.00 | Y | quote ตัดครึ่ง (ดูข้อ 19) |
| 16 | R19 | Processing Information | evidenced | 0.00 | 0.00 | Y | reconciliation (อ่อน) |
| 17 | R19 | Comm. w/ People Outside the Org. | evidenced | 0.13 | 0.13 | Y | client stakeholders |
| 18 | R19 | Management of Personnel Resources | evidenced | 0.00 | 0.33 | Y | performance evaluation, TNA |
| 19 | R15 | Analyzing Data or Information | evidenced | 1.00 | 1.00 | Y | คำพ้อง "analytics" |
| 20 | R15 | Programming | partially | 1.00 | 1.00 | Y | คำพ้อง "python" |
| 21 | R15 | Coordination | evidenced | 1.00 | 1.00 | Y | คำพ้อง "coordination" |
| 22 | R15 | Interpreting the Meaning of Info | evidenced | 0.19 | 0.19 | Y | ผ่าน |
| 23 | R15 | Working with Computers | evidenced | 0.00 | 0.28 | Y | |
| 24 | R15 | Computers and Electronics | evidenced | 0.06 | 0.22 | Y | |
| 25 | R15 | Getting Information | partially | 0.00 | 0.11 | Y | |
| 26 | R15 | Engineering and Technology | evidenced | 0.06 | 0.18 | ? | SDLC ≈ engineering? |
| 27 | R15 | Telecommunications | evidenced | 0.00 | 0.08 | **N** | **R3 ตัดถูก** (TV episodes) |
| 28 | R15 | Evaluating Compliance with Standards | evidenced | 0.00 | 0.00 | **N** | R3 ตัดถูก |
| 29 | R15 | Making Decisions and Solving Problems | evidenced | 0.00 | 0.00 | Y | cut cycle time 45→15 |
| 30 | R15 | Comm. w/ Supervisors, Peers… | evidenced | 0.00 | 0.13 | ? | directing ≈ communicating? |
| 31 | R15 | Documenting/Recording Information | partially | 0.00 | 0.06 | Y | |
| 32 | R15 | Complex Problem Solving | evidenced | 0.00 | 0.00 | Y | |
| 33 | R15 | Systems Evaluation | evidenced | 0.00 | 0.06 | Y | forecast error 60%→8% |
| 34 | R15 | Processing Information | evidenced | 0.00 | 0.00 | Y | (อ่อน) |
| 35 | R15 | Systems Analysis | evidenced | 0.05 | 0.05 | Y | process redesign |
| 36 | R15 | Organizing, Planning, Prioritizing | evidenced | 0.11 | 0.18 | Y | |

ข้อสรุปที่ R2 ตัด (ไม่อยู่ในตาราง): R19 Coordinating the Work and Activities of Others โมเดลเปลี่ยน "directing" เป็น "Directed" → S2 แก้ได้

## ภาคผนวก B · ทำซ้ำได้

```
cd Final_IS/private/gap_03OCT26_sim
python3 sim.py     # recall / unrelated-pair pass ของ V0–V5 + θ sweep
python3 score.py   # คะแนน R ภายใต้เงื่อนไขในหัวข้อ 2.2 (ปัจจุบันได้ 10.3 / 10.9 ตรงกับรายงาน)
```
ต้องมี `openpyxl` · อ่าน `data/requirements.csv` และ `source/project_files/Data_Set.xlsx` (อ่านอย่างเดียว)
