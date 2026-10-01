# หลักฐานการครอบคลุม 600 ข้อกำหนด · 01OCT26

> สร้างด้วย `python scripts/coverage_report.py` จาก `evidence/coverage_simulation.json`, `coverage_whatif.json`, `coverage_diagnostics.json` และ `book/numbers.json`
> นิยาม (DEC-41): **ความครอบคลุมของคลัง** = ข้อกำหนดที่มีรายการ L1 ผ่าน C1–C5 และ URL ผ่านการตรวจ ≥ 1 รายการ · **ความครอบคลุมของแผนจำลอง** = ผลรวม 20 อาชีพของข้อที่แผนครอบคลุมเมื่อขาดทั้ง 30 ข้อ ที่ 6 เดือน 10 ชม./สัปดาห์ (Hmax 259.8 ชม.) แบบ both

## 1 · สรุป Gate G-600

| ตัวชี้วัด | ก่อน Phase 1 | ปัจจุบัน (นับได้จริง) | ถ้าผู้วิจัยยืนยันรายการใหม่ + URL ค้าง | เป้า |
|---|---|---|---|---|
| ความครอบคลุมของคลัง | 598 | 598 | 600 | 600 |
| ความครอบคลุมของแผนจำลอง | 489 | 538 | 600 | 600 |

**Gate G-600: ยังไม่ผ่าน** · ยังไม่ถึงเป้า เพราะรายการเรียนรู้ใหม่ 14 รายการยังรอผู้วิจัยเปิดตรวจยืนยัน ระบบจึงยังไม่นับรายการเหล่านี้ เมื่อยืนยันครบ การจำลองชุดเดียวกันให้ความครอบคลุมของคลัง 600 ข้อ และของแผนจำลอง 600 ข้อ

ตามกติกาข้อ 2–3 ของ Prompt_Report รายการใหม่ยังไม่นับจนผู้วิจัยเปิดหน้าเว็บยืนยันเอง ตัวเลขในคอลัมน์ขวาสุดเป็นการจำลองเพื่อวางแผน ห้ามรายงานเป็นผลในเล่ม

## 2 · สิ่งที่เปลี่ยนใน Phase 1

1. **DEC-43** รหัสรุ่นคลัง `CORPUS_IS68076026-v1.5-01OCT26`
2. **DEC-45** รายการพื้นฐาน 6 รายการ (DEC-18, URL ตรวจแล้ว) map กับทุกอาชีพที่มีองค์ประกอบเดียวกัน ไม่ใช่เฉพาะข้อที่ยังว่าง · เพิ่มความเชื่อมโยง L1 129 แถว · คลัง 602 รายการ / mapping 7,012 / ผ่านตรวจ 2,071
3. **DEC-46** coverage track: รายการเรียนรู้ใหม่ 14 รายการ (ชั่วโมง 2–23) ที่ Claude เปิดหน้าเว็บจริง 1 ต.ค. 2569 · ยืนยันแล้ว 0 · รอผู้วิจัย 14 (`data/corpus_additions.csv`)
4. **DEC-47** เทียบวิธีเลือก weighted_greedy / coverage_first / ILP แล้วคงสมการ d_k (weighted_greedy)
5. ตรวจ URL ค้าง 28 URL ด้วยเบราว์เซอร์ → `evidence/url_check/url_check_01OCT26.md` (รอผู้วิจัยกรอก researcher_result 28 URL)

## 3 · เทียบวิธีเลือกรายการ (แผนจำลอง 6 เดือน 10 ชม./สัปดาห์ both)

| สถานการณ์ | weighted_greedy | coverage_first | ILP (สูงสุดตามทฤษฎี) |
|---|---|---|---|
| current | 538 | 539 | 549 |
| url_verified | 540 | 541 | 550 |
| additions_confirmed | 600 | 600 | 600 |
| url_and_additions | 600 | 600 | 600 |

ILP ใช้เป็นตัวเทียบเท่านั้น เพราะ Code node ใน n8n ไม่มีตัวแก้ ILP และเมื่อมีรายการสั้นครบ ทั้งสองวิธีให้ผลเท่า ILP

## 4 · ตัวชี้วัดรอง (ข้อมูลปัจจุบัน · รายงานตามจริง ไม่บังคับ 600)

| เงื่อนไข | ครอบคลุม |
|---|---|
| 6 เดือน 5 ชม./สัปดาห์ both | 460 |
| 6 เดือน 10 ชม./สัปดาห์ both | 538 |
| 6 เดือน 15 ชม./สัปดาห์ both | 577 |
| 6 เดือน 20 ชม./สัปดาห์ both | 589 |
| 12 เดือน 10 ชม./สัปดาห์ both | 589 |
| 18 เดือน 10 ชม./สัปดาห์ both | 598 |
| 24 เดือน 10 ชม./สัปดาห์ both | 598 |
| 6 เดือน 10 ชม. course_only | 526 |
| 6 เดือน 10 ชม. certification_only | 195 |

## 5 · ILP รายอาชีพ (ข้อมูลปัจจุบัน)

| อาชีพ | ข้อที่มีรายการรองรับ | แผนจำลองครอบคลุม | ชั่วโมงของแผน | ชั่วโมงขั้นต่ำเพื่อครบทุกข้อ (ILP) |
|---|---|---|---|---|
| R01 | 30 | 25 | 210 | 501 |
| R02 | 30 | 28 | 202 | 677 |
| R03 | 30 | 26 | 197 | 437 |
| R04 | 30 | 29 | 212 | 332 |
| R05 | 30 | 25 | 180 | 505 |
| R06 | 30 | 28 | 230 | 370 |
| R07 | 30 | 24 | 182 | 430 |
| R08 | 30 | 28 | 252 | 467 |
| R09 | 30 | 25 | 252 | 727 |
| R10 | 30 | 26 | 252 | 452 |
| R11 | 30 | 25 | 212 | 622 |
| R12 | 30 | 29 | 252 | 322 |
| R13 | 30 | 27 | 216 | 536 |
| R14 | 29 | 27 | 241 | 296 |
| R15 | 30 | 29 | 252 | 312 |
| R16 | 30 | 28 | 231 | 351 |
| R17 | 30 | 28 | 212 | 322 |
| R18 | 30 | 27 | 170 | 285 |
| R19 | 30 | 28 | 225 | 285 |
| R20 | 29 | 26 | 201 | 606 |

ชั่วโมงขั้นต่ำเพื่อครอบคลุมทุกข้อของอาชีพหนึ่งอยู่ที่ 285–727 ชม. ทุกอาชีพเกิน Hmax (0/20 อาชีพอยู่ใน Hmax) · ถ้ายืนยันรายการใหม่ครบจะเหลือ 166–236 ชม. (20/20)

สาเหตุของข้อที่แผนจำลองยังไม่ครอบคลุม (ข้อมูลปัจจุบัน): ไม่มีรายการ 2 · ชั่วโมงไม่พอแม้เลือกแบบเหมาะที่สุด 43 · ลำดับการเลือก 17

## 6 · รายการใหม่ที่รอผู้วิจัยยืนยัน (👤)

| รหัส | ชื่อ | ผู้ให้บริการ | ชม. | องค์ประกอบ O*NET | ข้อกำหนดที่ได้ | สิ่งที่ Claude เห็นบนหน้าเว็บ |
|---|---|---|---|---|---|---|
| N01 | [Effective Problem-Solving and Decision-Making](https://www.coursera.org/learn/problem-solving) | University of California, Irvine | 8 | 2.B.4.e Judgment and Decision Making; 4.A.2.b.1 Making Decisions and Solving Problems; 2.B.2.i Complex Problem Solving | 51 | title ตรง · Offered by University of California, Irvine · modules: Identify the Problem / Generate Solutions / Make the Decision / Implement and Assess |
| N02 | [Creative Thinking: Techniques and Tools for Success](https://www.coursera.org/learn/creative-thinking-techniques-and-tools-for-success) | Imperial College London | 20 | 4.A.2.b.2 Thinking Creatively | 16 | title ตรง · Offered by Imperial College London · 7 modules (Creativity Tools / Thinking Styles / TRIZ / SCAMPER) |
| N03 | [Design Thinking for Innovation](https://www.coursera.org/learn/uva-darden-designbiz) | University of Virginia | 7 | 4.A.2.b.2 Thinking Creatively; 2.B.3.b Technology Design; 2.B.3.a Operations Analysis | 19 | URL เดิม uva-darden-design-thinking-innovation redirect มาที่ uva-darden-designbiz · title ตรง · Offered by University of Virginia |
| N04 | [Systems Thinking Basics](https://www.coursera.org/learn/systems-thinking-basics) | Coursera | 2 | 2.B.4.g Systems Analysis; 2.B.4.h Systems Evaluation | 20 | title ตรง · Offered by Coursera · What you'll learn: analyze complex systems / feedback loops |
| N05 | [Introduction to Systems Architecture](https://www.coursera.org/learn/introduction-to-systems-architecture) | IBM | 13 | 2.B.4.g Systems Analysis; 2.B.4.h Systems Evaluation; 2.B.3.b Technology Design; 2.B.3.a Operations Analysis | 23 | title ตรง · Offered by IBM · Module 2 Introduction to Systems Analysis and Architecture |
| N06 | [Data Science Math Skills](https://www.coursera.org/learn/datasciencemathskills) | Duke University | 13 | 2.C.4.a Mathematics; 2.A.1.e Mathematics | 11 | title ตรง · Instructors Daniel Egger (Duke) · modules 4+3+3+3 ชม. |
| N07 | [Quality Improvement and Management](https://www.coursera.org/learn/quality-improvement-and-management) | Board Infinity | 11 | 4.A.2.a.3 Evaluating Information to Determine Compliance with Standards; 2.B.3.m Quality Control Analysis; 4.A.2.a.1 Judging the Qualities of Objects, Services, or People; 4.A.1.a.2 Monitoring Processes, Materials, or Surroundings; 2.A.2.d Monitoring | 49 | title ตรง · Offered by Board Infinity · What you'll learn: ISO 9001 implementation / quality management systems and tools |
| N08 | [Introduction to Technical Writing](https://www.coursera.org/learn/technical-writing-introduction) | Board Infinity | 12 | 4.A.3.b.6 Documenting/Recording Information | 19 | title ตรง · Offered by Board Infinity · 4 modules x 3 ชม. |
| N09 | [The Bits and Bytes of Computer Networking](https://www.coursera.org/learn/computer-networking) | Google | 23 | 2.C.9.a Telecommunications | 6 | title ตรง · Offered by Google · 6 modules |
| N10 | [Technical Support Fundamentals](https://www.coursera.org/learn/technical-support-fundamentals) | Google | 20 | 2.C.3.a Computers and Electronics; 4.A.3.b.5 Repairing and Maintaining Electronic Equipment; 4.A.3.b.1 Working with Computers | 41 | title ตรง · Offered by Google · Module 2 Hardware / Module 6 Troubleshooting |
| N11 | [Programming for Everybody (Getting Started with Python)](https://www.coursera.org/learn/python) | University of Michigan | 20 | 2.B.3.e Programming; 4.A.3.b.1 Working with Computers | 32 | title ตรง · Offered by University of Michigan |
| N12 | [Introduction to Software Engineering](https://www.coursera.org/learn/introduction-to-software-engineering) | IBM | 20 | 2.C.3.b Engineering and Technology; 2.B.3.e Programming | 21 | title ตรง · Offered by IBM · 6 modules |
| N13 | [Foundations of Project Management](https://www.coursera.org/learn/project-management-foundations) | Google | 12 | 2.C.1.a Administration and Management; 4.A.2.b.6 Organizing, Planning, and Prioritizing Work; 4.A.2.b.4 Developing Objectives and Strategies; 4.A.4.b.1 Coordinating the Work and Activities of Others; 2.B.1.b Coordination; 2.B.5.a Time Management | 43 | title ตรง · Offered by Google · 4 modules |
| N14 | [Introduction to Relational Databases (RDBMS)](https://www.coursera.org/learn/introduction-to-relational-databases) | IBM | 20 | 2.C.3.c Design | 1 | title ตรง · Offered by IBM · What you'll learn: design a relational database with an Entity Relationship Diagram |

วิธียืนยัน: เปิด URL ด้วยตัวเอง ตรวจชื่อ ผู้ให้บริการ ชั่วโมง ราคา และเนื้อหาว่าสอนองค์ประกอบที่ระบุจริง → กรอก `researcher_result` = LIVE (หรือ DEAD) และ `researcher_checked_at` ใน `data/corpus_additions.csv` (แก้ด้วยโปรแกรมแก้ข้อความ) → ตัดองค์ประกอบที่ไม่เห็นด้วยออกจากคอลัมน์ `elements` ได้ → `python scripts/build_data_all.py` → `bash scripts/run_all_checks.sh` → `python scripts/coverage_report.py`
