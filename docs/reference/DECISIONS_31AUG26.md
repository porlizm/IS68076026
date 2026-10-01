# DECISIONS — ทะเบียนการตัดสินใจเชิงออกแบบ

**งาน:** A Multi-Model Generative-AI Framework for Reducing Hallucination in Resume-Based Skill-Gap Analysis and Personalized Learning Pathways
**ผู้วิจัย:** ดนุสรณ์ อนันตกาล (68076026) · ITM · KMITL
**ฉบับ:** 31 สิงหาคม 2026
**ขอบเขตของเอกสารนี้:** DEC-09 ถึง DEC-11 ที่ตัดสินในรอบนี้ · DEC-01 ถึง DEC-08 อยู่ใน `Guideline n8n v4.md` §0 และ `Gap_Closure_28AUG26.md` §1 (ต้องรวมเข้ามาในไฟล์นี้เมื่อทำ Phase 0 ข้อ 0.1)

---

## DEC-09 · ปิดช่องว่าง 57 requirement ด้วย professional-skills track

**สถานะ:** ตัดสินแล้ว · นำไปใช้แล้วใน `Course_Career_31AUG26.xlsx`
**วันที่:** 31 สิงหาคม 2026

### ปัญหา

ตัวตรวจอิสระ `check_corpus_31AUG26.py` พบว่า corpus รุ่น v0.9 (400 รายการ) ไม่มีรายการใดรองรับ **57 จาก 600 requirement (9.5%)** และเมื่อแยกตามโดเมนพบว่าเป็นสมรรถนะเชิงมนุษยสัมพันธ์และการสื่อสารเกือบทั้งหมด

| โดเมน | จำนวน |
|---|---:|
| Work Activities | 37 |
| Essential Skills | 14 |
| Knowledge | 4 |
| Transferable Skills | 2 |

สมรรถนะที่ขาดบ่อยที่สุดคือ Active Listening (6 บทบาท) · Communicating with Supervisors, Peers, or Subordinates (6) · Interpreting the Meaning of Information for Others (5) · Communicating with People Outside the Organization (4) · Establishing and Maintaining Interpersonal Relationships (4) · Speaking (4)

**ผลถ้าไม่แก้:** เมื่อผู้เข้าร่วมมีช่องว่างในสมรรถนะกลุ่มนี้ ระบบจะบันทึก `no_candidate_found` ทำให้ตัวชี้วัด **Gap coverage** (1 ใน 5 ตัวของ Recommendation validity ตาม DEC-06) ต่ำลงโดยโครงสร้างของคลังข้อมูล ไม่ใช่เพราะความสามารถของแบบจำลอง ซึ่งจะทำให้ผลของ RQ3 ตีความผิด

### ทางเลือกที่พิจารณา

| ทาง | เนื้อหา | เหตุผลที่รับ/ไม่รับ |
|---|---|---|
| A | ประกาศว่าเป็นข้อจำกัดของ closed-world corpus แล้วปล่อยให้เป็น `no_candidate_found` | ตรงไปตรงมา แต่ยกตัวชี้วัดหลักของ RQ3 ทิ้งไป 9.5% โดยไม่จำเป็น เพราะหลักสูตรที่สอนสมรรถนะกลุ่มนี้มีอยู่จริงและเข้าถึงได้ |
| B | ตัดสมรรถนะกลุ่มนี้ออกจากชุด 30 เหมือนที่ DEC-07 ทำกับ Abilities | **ไม่รับ** — ขัดกับเหตุผลของ DEC-07 เอง สมรรถนะกลุ่มนี้ "เรียนรู้ได้" และเรซูเมพิสูจน์ได้ จึงอยู่ในขอบเขตคำถามวิจัย ต่างจาก Abilities ที่เป็นคุณลักษณะติดตัว |
| **C** | **เพิ่ม professional-skills track เข้า corpus** | **รับ** — รักษาความหมายของ Gap coverage ไว้ครบ และสอดคล้องกับข้อเท็จจริงว่าหลักสูตรกลุ่มนี้มีอยู่จริง |

### สิ่งที่ทำ

เพิ่ม **25 รายการ** ใน 15 บทบาท จากคลังหลักสูตร 10 รายการที่ยืนยันการมีอยู่ด้วยการค้นเว็บเมื่อ 31 ส.ค. 2026

| รหัส | รายการ | ผู้ให้บริการ | ชม. | สมรรถนะที่ปิด |
|---|---|---|---:|---|
| COMM | Improving Communication Skills | University of Pennsylvania (Wharton) | 10 | Active Listening · Speaking · Interpreting Meaning for Others · Communicating with Supervisors/Outside · Establishing Relationships · Providing Consultation |
| WRITE | Google Technical Writing Courses (One and Two) | Google | 16 | Writing · Documenting/Recording Information |
| PM | Foundations of Project Management | Google | 26 | Judgment and Decision Making · Developing Objectives and Strategies · Coordination · Thinking Creatively |
| SRE | SRE: Measuring and Managing Reliability | Google Cloud | 15 | Monitoring · Monitoring Processes · Inspecting Equipment/Structures |
| UXR | Conduct UX Research and Test Early Concepts | Google | 24 | Monitoring Processes (บริบทงานออกแบบ) |
| NEGO | Successful Negotiation | University of Michigan | 17 | Resolving Conflicts and Negotiating with Others |
| LEAD | Leading Teams | University of Michigan | 15 | Developing and Building Teams · Training and Teaching Others |
| ITIL | ITIL 4 Foundation | PeopleCert (AXELOS) | 30 | Customer and Personal Service |
| STAT | Introduction to Statistics | Stanford University | 15 | Mathematics (บทบาทสายวิเคราะห์) |
| MATHML | Mathematics for Machine Learning | Imperial College London | 80 | Mathematics (บทบาทสายข้อมูล) |

### ผลลัพธ์

| ตัวชี้วัด | ก่อน (v0.9) | หลัง (v1.0) |
|---|---:|---:|
| จำนวนรายการ | 400 | 431 |
| requirement ที่ไม่มีรายการรองรับ | 57 (9.5%) | **0** |
| ความครอบคลุม L1+L2 | 90.5% | **100.0%** |
| ความครอบคลุมชั้น L1 เท่านั้น | 52.2% | **62.0%** |
| ครอบคลุมเมื่อกรอง `course_only` | 83.2% | **92.7%** |
| ครอบคลุมเมื่อกรอง `certification_only` | 86.0% | 86.3% |

### วิธีย้อนกลับ

กรองแถวที่ `batch = v1.0_gap_closure` ออกจาก `corpus_master` แล้วรัน `check_corpus_31AUG26.py` ใหม่ จะได้ตัวเลขของ v0.9 กลับมาทุกค่า

### ข้อจำกัดที่ต้องเขียนในเล่ม (§5.3)

รายการกลุ่มนี้เป็นหลักสูตรทั่วไปที่ไม่จำเพาะกับบทบาท จึงปิดช่องว่างได้ในระดับสมรรถนะ ไม่ใช่ระดับบริบทงานเฉพาะทาง ต้องรายงานแยกว่าส่วนใดของ Gap coverage มาจาก professional-skills track

---

## DEC-10 · เพิ่มรายการสั้นให้ R06 และ R07 แก้ข้อจำกัดความจุการเรียน

**สถานะ:** ตัดสินแล้ว · นำไปใช้แล้ว
**วันที่:** 31 สิงหาคม 2026

### ปัญหา

ความจุการเรียนคำนวณจาก `timeline × 4.33 × ชั่วโมงต่อสัปดาห์` ที่กรอบเวลาแคบที่สุดของแบบฟอร์ม (6 เดือน × 5 ชม./สัปดาห์) ได้ **129 ชั่วโมง** แต่ R06 (Data Scientist) มีเวลาเรียนมัธยฐาน 120 ชม./รายการ และ R07 (ML/AI Engineer) 110 ชม./รายการ ทำให้ทั้งสองบทบาทจัดแผนได้เพียง **2 รายการ** ซึ่งกระทบตัวชี้วัด **Timeline feasibility** โดยตรง และทำให้รายงานของผู้เข้าร่วมสองบทบาทนี้บางผิดปกติเมื่อเทียบกับบทบาทอื่น

### สิ่งที่ทำ

เพิ่มรายการสั้นที่ไม่มีค่าใช้จ่าย บทบาทละ 3 รายการ

| บทบาท | รายการ | ชม. |
|---|---|---:|
| R06 | Kaggle Learn: Intro to Machine Learning · Pandas · Feature Engineering | 3 · 4 · 5 |
| R07 | Kaggle Learn: Intro to Deep Learning · Intermediate Machine Learning · ChatGPT Prompt Engineering for Developers (DeepLearning.AI) | 4 · 4 · 2 |

### ผลลัพธ์

| บทบาท | รายการที่จัดแผนได้ที่ 6 เดือน 5 ชม./สัปดาห์ | ก่อน | หลัง |
|---|---|---:|---:|
| R06 | — | 2 | **6** |
| R07 | — | 2 | **6** |

ทั้ง 20 บทบาทผ่านเกณฑ์ "จัดแผนได้อย่างน้อย 3 รายการที่กรอบเวลาแคบสุด" แล้ว (QA-16 · CHK-16)

### วิธีย้อนกลับ

กรองแถวที่ `batch = v1.0_short_item` ออก

---

## DEC-11 · Pre-filter ของ Workflow F ใช้ mapping ชั้น L1 เท่านั้น

**สถานะ:** ตัดสินแล้ว · **ยังไม่นำไปใช้ในโค้ด** — ต้องนำไปเขียนใน `SUB_GapEngine`/Workflow F ตอนสร้าง workflow
**วันที่:** 31 สิงหาคม 2026

### ปัญหา

`item_competency_map` มีสองชั้น: **L1** ผู้วิจัยจับคู่รายรายการ และ **L2** เติมด้วยกฎที่ประกาศล่วงหน้า 21 ข้อ ในรุ่น v0.9 ชั้น L2 คิดเป็น 4,824 จาก 6,450 แถว และทั้งหมดมี `coverage_strength = incidental` — กฎอย่าง R01-tech และ R04-read ผูกกับ *ทุกแถว* ของคลัง

ผลคือถ้าตัวกรองก่อนจัดอันดับใช้ทั้ง L1 และ L2 ระบบจะเสนอ **AWS Certified Developer เพื่อปิดช่องว่าง Reading Comprehension** ได้อย่างถูกต้องตามข้อมูล แต่ผิดอย่างชัดเจนในสายตาผู้อ่านรายงาน ซึ่งจะกลายเป็นข้อโจมตีตัวชี้วัด Recommendation validity ทั้งชุด

### สิ่งที่ตัดสิน

1. **Pre-filter ของ Workflow F ใช้เฉพาะ mapping ที่ `coverage_layer = L1_researcher_tagged`** (`coverage_strength` เป็น `primary` หรือ `supporting`) เท่านั้น
2. **ชั้น L2 ใช้เพื่อรายงานความครอบคลุมเป็นขอบบนเท่านั้น** ห้ามใช้ขับเคลื่อนข้อเสนอแนะ
3. **รายงาน Gap coverage สองค่าเสมอ** — L1 เท่านั้น (อนุรักษ์นิยม, ปัจจุบัน 62.0%) และ L1+L2 (ขอบบน, ปัจจุบัน 100.0%)
4. รายการที่เพิ่มในรุ่น v1.0 มี **เฉพาะ mapping ชั้น L1** (กฎ R22-sup) เพื่อไม่ให้ความครอบคลุมเชิงกฎเฟ้อขึ้นจากรายการที่เพิ่มเข้ามาเอง

### สิ่งที่ต้องตามแก้

- [ ] `System Architecture v3.md` §9.3 / Workflow F — ระบุเงื่อนไข pre-filter `coverage_layer = L1_researcher_tagged`
- [ ] เล่ม §3.5.5 — เพิ่มประโยคว่าตัวกรองใช้ชั้น L1
- [ ] เล่ม §3.8 และ ภาคผนวก ง — ระบุว่า Gap coverage ต้องรายงานสองค่า
- [ ] `WF_Main` โหนด `Load Corpus` — กรองด้วยคอลัมน์ `coverage_layer`

### วิธีย้อนกลับ

เปลี่ยนตัวกรองกลับเป็นรับทุกชั้น แล้วบันทึกว่า Gap coverage ที่รายงานเป็นค่าขอบบน

---

## บันทึกการแก้ไขข้อมูลเดิมในรอบนี้

| แถว | สิ่งที่แก้ | เหตุผล |
|---|---|---|
| `CRT-R19-09` · `CRT-R20-04` | `source_url` เปลี่ยนจากหน้ารวมใบรับรอง ITIL เป็นหน้าใบรับรอง ITIL 4 Foundation โดยตรง | ยืนยันหน้าปลายทางด้วยการค้นเว็บเมื่อ 31 ส.ค. 2026 · บันทึกไว้ใน `researcher_notes` ของทั้งสองแถว |

---

## ไฟล์ที่เกี่ยวข้องกับการตัดสินใจรอบนี้

| ไฟล์ | บทบาท |
|---|---|
| `build_corpus_v10_31AUG26.py` | สคริปต์สร้าง corpus v1.0 จาก v0.9 · ทำซ้ำได้ · คลังรายการที่เพิ่มประกาศไว้ในตัวสคริปต์ |
| `check_corpus_31AUG26.py` | ตัวตรวจอิสระ 18 ข้อ · รับ argv[1] argv[2] เพื่อชี้ไฟล์ที่จะตรวจ |
| `Course_Career_31AUG26.xlsx` | corpus v1.0 · 11 ชีต |
| `corpus_master_31AUG26.csv` · `item_competency_map_31AUG26.csv` | ตารางหลักสำหรับนำเข้า Google Sheets |
| `corpus_version_log_31AUG26.json` | SHA-256 · row count · ความครอบคลุม · `frozen_at` ยังเป็น null |
| `corpus_qa_v10_31AUG26/` | รายงานผลตรวจ 11 ไฟล์ |

---

## สิ่งที่ยังค้างก่อน 🧊 FREEZE corpus (GATE-C)

1. **ตรวจ URL ทั้ง 431 แถว** แล้วเปลี่ยน `verification_status` เป็น `verified` พร้อมกรอก `verification_date` และ `verified_by` — เป็นข้อเดียวที่เหลือและเป็นงานที่ต้องใช้คน (QA-10 · CHK-17)
2. ยืนยันค่าสอบและอายุใบรับรองของ ITIL 4 Foundation ณ วันตรวจ
3. คำนวณ SHA-256 ซ้ำ บันทึก `frozen_at` จริง แล้วแนบ manifest เข้า ภาคผนวก จ ของเล่ม

---

## บันทึกเพิ่มเติม · การตรวจสอบ URL ตาม GATE-C (31 ส.ค. 2026)

ตรวจ 331 URL ที่ไม่ซ้ำกันครบทุกรายการ ด้วยการดึงหน้าเว็บจริงและอ่านชื่อหลักสูตรจากหน้าปลายทาง

| ผล | แถว |
|---|---:|
| verified | 350 จาก 431 (81.2%) |
| ต้องเปลี่ยนหรือลบ | 43 |
| ต้องตรวจด้วยตา | 38 |

**สิ่งที่พบและต้องบันทึกในเล่ม**

- ใบรับรอง 7 รายการถูกผู้ให้บริการยกเลิกแล้ว (Microsoft 3 · AWS 1 · TensorFlow 1 · OpenJS 2)
- 1 รายการ (MITRE MAD) หน้าเว็บถูกแทนที่ด้วยเนื้อหาโฆษณาการพนัน ต้องลบทันที
- ใบรับรอง 3 รายการมีกำหนดยกเลิกระหว่างช่วงเก็บข้อมูล รวมถึง 2 รายการที่ยกเลิกวันนี้
- **อัตราลิงก์เสีย 10.0% ภายใน 1 วันหลังสร้าง corpus** เป็นหลักฐานเชิงประจักษ์ที่สนับสนุนข้อโต้แย้งหลักของงานวิจัยว่าคลังข้อมูลที่ร่างด้วย AI ต้องผ่านการตรวจสอบด้วยมนุษย์ก่อนเข้า runtime

**การตัดสินใจ:** แถวที่ตรวจแล้วไม่ผ่านตั้งเป็น `verification_status = rejected` แต่**คงแถวไว้ใน corpus** เพื่อความสามารถในการตรวจสอบย้อนกลับ ตัวกรองของ Workflow F ต้องรับเฉพาะแถวที่ `verification_status = verified` เท่านั้น (เพิ่มเงื่อนไขนี้เข้ากับ DEC-11)

รายละเอียดเต็มอยู่ใน `URL_Verification_Report_31AUG26.md` และ `url_action_list_31AUG26.csv`

---

## DEC-14 · ซ่อมลิงก์ที่ย้ายที่ แทนการเปลี่ยนรายการ

**สถานะ:** ตัดสินแล้ว · นำไปใช้แล้วใน `Course_Career_v12_31AUG26.xlsx`
**วันที่:** 31 สิงหาคม 2026

### หลักการ

จาก 43 แถวที่ตรวจแล้วไม่ผ่าน พบว่า **29 แถวไม่ได้ตายจริง** ผู้ให้บริการเพียงย้าย URL เปลี่ยนชื่อ หรือเปลี่ยนโดเมน การเปลี่ยนรายการทิ้งทั้งหมดจะทำให้เสียรายการที่ผ่านการคัดเลือกมาแล้วโดยไม่จำเป็น จึงกำหนดลำดับการจัดการดังนี้

1. ค้นหาหน้าทางการปัจจุบันของรายการนั้นก่อนเสมอ
2. ถ้าพบและยืนยันได้ → **แก้ URL และชื่อ** คง `item_id` และ competency mapping เดิมทั้งหมด
3. ถ้าผู้ให้บริการยกเลิกถาวร → จึงเปลี่ยนรายการตาม DEC-15

### สิ่งที่พบระหว่างการค้นหา (บันทึกไว้เพราะกระทบการตีความผล)

| ประเภทการเปลี่ยนแปลง | ตัวอย่าง |
|---|---|
| ย้ายโดเมนทั้งชุด | Google Cloud Skills Boost → `skills.google` · Oracle Education → `oracle.com/education` |
| ผู้ให้บริการเปลี่ยนชื่อบริษัท | Security Blue Team → **Centri** · Interaction Design Foundation → `ixdf.org` |
| โอนหลักสูตรให้ผู้ให้บริการรายใหม่ | MITRE ATT&CK Defender → **MAD20 Technologies** (โดเมนเดิมของ MITRE Engenuity ถูกแทนที่ด้วยเนื้อหาโฆษณา) |
| เปลี่ยนชื่อสายใบรับรอง | Cisco **DevNet** → **Automation** (DevNet Associate กลายเป็น CCNA Automation) · Aruba **ACSA** → **ACA-Switching** |
| เปลี่ยน slug ของหลักสูตร | Coursera 8 รายการ เช่น IBM Business Analyst · Palo Alto Networks · DevSecOps · Cyber Incident Response |

รวมแก้ **29 แถว** ทุกแถวยืนยันหน้าปลายทางด้วยการดึงหน้าเว็บจริง ยกเว้น ACA-Switching ของ HPE ที่หน้า datasheet ตอบช้าจนดึงไม่สำเร็จ จึงคงสถานะ `pending_verification` ไว้

---

## DEC-15 · รายการทดแทนสำหรับใบรับรองที่ถูกยกเลิกถาวร

**สถานะ:** ตัดสินแล้ว · นำไปใช้แล้ว
**วันที่:** 31 สิงหาคม 2026

### หลักเกณฑ์การเลือกตัวทดแทน

1. ต้องอยู่ใน **สายสมรรถนะเดียวกัน** กับรายการเดิม เพื่อให้คง competency mapping ได้อย่างสมเหตุสมผล
2. ต้อง **ไม่ซ้ำกับรายการอื่นในบทบาทเดียวกัน**
3. ถ้าผู้ให้บริการประกาศตัวทดแทนอย่างเป็นทางการ ให้ใช้ตัวนั้นก่อน
4. ทุกตัวต้องยืนยันหน้าเว็บจริงแล้ว

### รายการทดแทน 17 แถว

| เดิม (ยกเลิกแล้ว) | ใหม่ | บทบาท | เหตุผล |
|---|---|---|---|
| Microsoft Azure Developer Associate (AZ-204) | **Microsoft Certified: Azure AI Cloud Developer Associate** (AI-200) | R01 R02 R03 R07 | Microsoft ระบุเป็นเส้นทางต่อเนื่องของนักพัฒนา Azure |
| Microsoft Azure AI Engineer Associate | **Microsoft Certified: Azure AI Apps and Agents Developer Associate** | R07 | ใบรับรองใหม่สายพัฒนาเอเจนต์ AI |
| Microsoft Azure Data Scientist Associate (DP-100) | **Databricks Certified Machine Learning Professional** | R06 | ใบรับรองระดับสูงสายวิทยาศาสตร์ข้อมูลที่ยังเปิดสอบ |
| Microsoft Azure Security Engineer (AZ-500, ยกเลิกวันนี้) | **Microsoft Certified: Cloud and AI Security Engineer Associate** (SC-500) | R12 | Microsoft ระบุเป็นตัวทดแทนโดยตรง |
| Microsoft Power Platform Functional Consultant (ยกเลิกวันนี้) | **IIBA Agile Analysis Certification (IIBA-AAC)** | R18 | ตรงกับบทบาทนักวิเคราะห์ระบบมากกว่าใบรับรองเฉพาะผลิตภัณฑ์ |
| AWS Certified Machine Learning – Specialty | **AWS Certified Generative AI Developer – Professional** (AIP-C01) | R06 R07 | AWS ประกาศชุดใบรับรอง AI ใหม่แทนของเดิม |
| AWS Certified Advanced Networking – Specialty (จะยกเลิก ธ.ค. 2026) | **Palo Alto Networks Certified Network Security Engineer (PCNSE)** | R15 | คงระดับความลึกด้านความปลอดภัยเครือข่ายไว้ |
| TensorFlow Developer Certificate (ยุติโครงการ) | **IAPP AI Governance Professional (AIGP)** / **Databricks Certified ML Associate** | R06 / R07 | ทดแทนด้วยใบรับรองที่ยังเปิดและสอดคล้องกับทิศทางปัจจุบัน |
| OpenJS JSNAD | **Certified Kubernetes Application Developer (CKAD)** | R02 | ผู้ให้บริการเดียวกัน สายพัฒนาฝั่งเซิร์ฟเวอร์เหมือนกัน |
| OpenJS JSNSD | **ISC2 CSSLP** | R02 | ครอบคลุมการพัฒนาบริการอย่างปลอดภัยซึ่งเป็นแกนเดิมของ JSNSD |
| AccessData Certified Examiner (ACE) | **GIAC Advanced Smartphone Forensics (GASF)** | R14 | ACE ไม่มีหน้าทางการหลัง Exterro เข้าซื้อกิจการ |
| MITx Statistics and Data Science MicroMasters | **HarvardX Data Science Professional Certificate** | R06 | edX แจ้งว่า MicroMasters เดิมไม่เปิดรับแล้ว |

### ข้อจำกัดที่ต้องบันทึก

รายการทดแทน **คง competency mapping ของรายการเดิมไว้** เพื่อรักษาความครอบคลุมของชุดข้อกำหนด และเพราะตัวทดแทนถูกเลือกให้อยู่ในสายสมรรถนะเดียวกัน แต่ **ต้องทบทวน mapping ทีละรายการอีกครั้งก่อนตรึง** ทุกแถวมีหมายเหตุกำกับไว้ใน `researcher_notes` แล้ว

### ผลรวมหลังซ่อม

| | v1.1 | v1.2 |
|---|---:|---:|
| verified | 350 (81.2%) | **395 (91.6%)** |
| ต้องเปลี่ยนหรือลบ | 43 | **0** |
| ต้องตรวจด้วยตา | 38 | 36 |
| ความครอบคลุมเมื่อนับเฉพาะแถว verified | 588/600 (98.0%) | **592/600 (98.7%)** |
| ความครอบคลุมเมื่อนับทุกแถว | 600/600 | **600/600** |

**requirement 8 รายการสุดท้ายที่ยังไม่ถึง 100% เมื่อนับเฉพาะ verified** ขึ้นกับรายการเพียง 3 ตัวที่เว็บมีระบบกันบอทจนดึงหน้าไม่ได้ — Professional Scrum Developer I (6 รายการของ R03), MongoDB Associate Developer (R02), IAAP Web Accessibility Specialist (R05) ทั้งสามน่าจะยังเปิดตามปกติ เปิดด้วยเบราว์เซอร์ยืนยันแล้วเปลี่ยนสถานะเป็น `verified` จะได้ครบ 600/600

---

## DEC-16 · Cross-role professional track — ปิดช่องว่างการครอบคลุมชั้น L1

**วันที่:** 1 กันยายน 2026 · **corpus_version:** `CORPUS-IS68076026-v1.3-01SEP26`

### ปัญหาที่พบ

DEC-11 กำหนดให้ pre-filter ของ Workflow F ใช้ mapping ชั้น **L1 เท่านั้น** และ GATE-C กำหนดให้ใช้เฉพาะแถวที่ `verification_status = verified` แต่เอกสารที่ผ่านมารายงานความครอบคลุมแยกกันสามค่า ไม่เคยรายงานค่าที่เป็นผลของทั้งสองเงื่อนไขพร้อมกัน ซึ่งเป็นสิ่งที่ระบบทำงานจริง

| ตัวกรอง | v1.2 |
|---|---:|
| ทุกแถว ทุกชั้น | 600/600 · 100.0% |
| verified อย่างเดียว | 592/600 · 98.7% |
| L1 อย่างเดียว | 372/600 · 62.0% |
| **verified + L1 (ที่ Workflow F ใช้จริง)** | **364/600 · 60.7%** |

มี 236 คู่ (บทบาท × ข้อกำหนด) ที่ไม่มีรายการ verified ในชั้น L1 รองรับเลย และตรวจพบด้วยว่า **โค้ดใน `Pre-filter Corpus & Build Rank Prompt` เขียนคอมเมนต์ว่าใช้ DEC-11 แล้ว แต่กรองแค่ `verification_status` ไม่ได้กรอง `coverage_layer`** เพราะ `corpus_master` ไม่มีข้อมูลชั้นให้กรอง

### การตัดสินใจ

**1. เพิ่มคอลัมน์ `competency_ids_l1`** ใน `corpus_master` เก็บชุด `requirement_id` ที่รายการนั้นครอบคลุมในชั้น L1 คำนวณจาก `item_competency_map` โดยตรง ทำให้ DEC-11 บังคับใช้ได้จริงโดยไม่ต้องอ่าน map 6,780 แถวทุกครั้ง

**2. ขยายรายการที่มีอยู่แล้วไปยังบทบาทที่ขาด** โดย **ไม่สร้างรายการใหม่และไม่มี URL ที่เดาขึ้น** ทุกแถวใหม่คัดลอกจากแถวที่ `verified` แล้ว คงชื่อ ผู้ให้บริการ URL ชั่วโมง ค่าใช้จ่าย และรหัสสอบเดิมทุกค่า

**เกณฑ์ความเหมาะสมมาจากการตัดสินใจที่ผู้วิจัยทำไว้เองแล้ว ไม่ใช่วิจารณญาณของเครื่อง**

- **T1 · คุณสมบัติของรายการ** — รายการนั้นถูกจัดให้อยู่ใน ≥ 2 track อยู่แล้วใน v1.2 หรืออยู่ใน batch `v1.0_gap_closure` ที่ DEC-09 สร้างขึ้นเพื่อสมรรถนะเชิงวิชาชีพโดยเฉพาะ
- **T2 · ขอบเขตการขยาย** — ขยายเข้า track ที่รายการนั้นยังไม่เคยอยู่ ทำได้เฉพาะเมื่อรายการอยู่ใน ≥ 3 track อยู่แล้ว หรืออยู่ใน batch `v1.0_gap_closure` — ข้อนี้กันไม่ให้ใบรับรองเฉพาะสาย เช่น CISSP ไปโผล่ในแผนของนักออกแบบ UX
- **เลือกแบบ greedy** ใช้จำนวนรายการน้อยที่สุดต่อบทบาท เมื่อเท่ากันเลือกรายการที่ใช้ชั่วโมงน้อยกว่า เพื่อไม่ให้กระทบ Timeline feasibility

**3. แถว mapping ใหม่ประกาศที่มาชัดเจน** — `mapping_rule = R23-crossrole` · `mapping_method = crossrole_extension` · `mapping_status = pending_review` · `coverage_layer` ยังเป็น `L1_researcher_tagged` เพราะการตัดสินว่า "รายการนี้สอน element นี้จริง" เป็นการตัดสินระดับ element ที่ผู้วิจัยทำไว้แล้ว ไม่ใช่การอนุมานของกฎ แต่ **ต้องทบทวนก่อน FREEZE**

### ผลลัพธ์

| | v1.2 | v1.3 |
|---|---:|---:|
| จำนวนรายการ | 431 | **499** (+68) |
| mapping | 6,543 | **6,780** (+237) |
| **ครอบคลุม verified + L1** | 364/600 · 60.7% | **479/600 · 79.8%** |
| ครอบคลุม verified ทุกชั้น | 592/600 · 98.7% | **599/600 · 99.8%** |
| ช่องว่างที่เหลือ | 236 คู่ | **121 คู่ ใน 23 element** |

### ช่องว่างที่เหลือ 121 คู่ — เหตุผลที่ไม่ปิดด้วยวิธีเดียวกัน

รายการเดียวใน corpus ที่ถูก L1-tag ให้ element เหล่านี้เป็นคอร์สเทคนิคเฉพาะสาย เช่น `2.A.2.a Critical Thinking` มีแต่ Data Structures and Algorithms และ CS50 ส่วน `2.C.7.a English Language` มีแต่ ISTQB และ CompTIA Security+ (เพราะสอบเป็นภาษาอังกฤษ) **การขยายรายการเหล่านี้ข้ามบทบาทจะให้คำแนะนำที่แย่กว่าการบอกว่าไม่มีรายการ** ซึ่งขัดกับเจตนาทั้งหมดของงานวิจัยนี้

จึงบันทึกเป็นคำขอให้หารายการจริงมาเพิ่มแทน อยู่ใน `03_corpus/corpus_gap_request_01SEP26.csv` เรียงตามน้ำหนักที่เสียไป — สี่ element แรก (English Language 15 บทบาท · Getting Information 14 · Updating and Using Relevant Knowledge 14 · Identifying Objects, Actions, and Events 13) ปิดได้ด้วยรายการจริงเพียง 4 รายการ และจะทำให้ความครอบคลุมขึ้นไปราว 89%

### วิธีย้อนกลับ

ลบแถวที่ `batch = v1.3_crossrole` ทั้ง 68 แถว และแถว map ที่ `mapping_rule = R23-crossrole` ทั้ง 237 แถว จะได้ v1.2 กลับมาทุกไบต์ · `competency_ids_l1` เป็นคอลัมน์ที่คำนวณได้ ลบทิ้งได้โดยไม่เสียข้อมูล แต่ถ้าลบต้องแก้ pre-filter กลับไปใช้ `competency_ids` ด้วย

### ไฟล์ที่แก้ตามในรอบนี้

`03_corpus/corpus_master_v13_01SEP26.csv` · `item_competency_map_v13_01SEP26.csv` · `corpus_version_log_v13_01SEP26.json` · `corpus_gap_request_01SEP26.csv` · `05_scripts/build_corpus_v13_01SEP26.py` · `05_scripts/build_workflows_31AUG26.py` (pre-filter ใช้ `competency_ids_l1` · pipeline_run แยก `gap_coverage_l1` และ `gap_coverage_any` · recommendation_result เพิ่ม `covers_requirement_ids_l1`) · `06_workflows/*.json` (regenerate แล้ว ตรวจผ่าน) · `07_sheets_import/*`

---

## DEC-17 · แยก temperature ของขั้น parse ออกจากขั้น report

**วันที่:** 1 กันยายน 2026 · **rules_version:** `RULES-IS68076026-v1.0-31AUG26`

`config_master` เดิมมีค่าเดียวคือ `CFG-12 PARSE_REPORT_TEMPERATURE = 0.2` ใช้ทั้งสองขั้น และ `model_registry` MDL-02 ก็ระบุ 0.2 แต่ **workflow ที่ regenerate เมื่อ 31 ส.ค. ตั้งขั้น parse เป็น 0 ไปแล้ว** ตาม Workflow v2 ข้อ 5 เพราะขั้นนี้ผลิต `evidence_text` ที่กฎ R2 ตรวจ verbatim และมี gate `evidence_verified_ratio ≥ 0.60` ถ้าไม่ deterministic การรันซ้ำจะได้ evidence คนละสตริง แล้วผลของทั้งเจ็ดเงื่อนไขจะขยับตาม

`config_master` ถูกประกาศเป็นแหล่งความจริงของค่าคงที่ และ `check_consistency.py` ชั้น L3 ตรวจกับตารางนี้ ปล่อยไว้จะได้ error ปลอม หรือแย่กว่านั้นคือมีคนแก้ workflow กลับเป็น 0.2 ตามตารางแล้วทำลาย reproducibility โดยไม่มีอะไรฟ้อง

**แก้เป็น** `CFG-12 PARSE_TEMPERATURE = 0` และ `CFG-12b REPORT_TEMPERATURE = 0.2` · `model_registry` MDL-02 → 0 (MDL-07 report writer ยังเป็น 0.2 ตามเดิม เพราะมี Reference Check คุมท้ายอยู่แล้ว) · แก้ที่ `05_scripts/build_master_data_31AUG26.py` แล้ว regenerate

**วิธีย้อนกลับ** — รวมสองแถวกลับเป็น `PARSE_REPORT_TEMPERATURE = 0.2` แล้วแก้ workflow ให้ parse เป็น 0.2 (ไม่แนะนำ ดูเหตุผลข้างต้น)
