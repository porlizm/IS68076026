<!-- ต้นฉบับเล่ม · ภาคผนวก ฉ เพิ่มเมื่อ 1 ต.ค. 2569 ตาม DEC-29 (คลังรุ่น v1.5R) · ตาราง ฉ.3 สร้างจาก data/manifest.json ตอน build -->

## ภาคผนวก ฉ รายละเอียดคลังรายการเรียนรู้รุ่นที่ใช้เก็บข้อมูล

ภาคผนวกนี้บันทึกการเปลี่ยนแปลงของคลังรายการเรียนรู้จากรุ่นที่ใช้ในการพัฒนาระบบ ได้แก่ รายการพื้นฐานหกรายการ ความเชื่อมโยงที่ยกจากชั้น L2 เป็นชั้น L1 และค่าแฮชของไฟล์ข้อมูลอ้างอิงที่ใช้ยืนยันว่าข้อมูลไม่ถูกแก้หลังตรึงรุ่น ทุกการเปลี่ยนแปลงสร้างซ้ำได้ด้วยสคริปต์ของโครงการ และบันทึกเหตุผลรายแถวไว้ในไฟล์บันทึกการเปลี่ยนแปลงของคลัง

**ตาราง ฉ.1  รายการพื้นฐานหกรายการและองค์ประกอบที่ครอบคลุม**

| กลุ่ม | รายการ | ผู้ให้บริการ | ชั่วโมง | องค์ประกอบที่ครอบคลุม | ความเชื่อมโยงชั้น L1 | จำนวนอาชีพ |
|---|---|---|---|---|---|---|
| F1 | Write Professional Emails in English | Georgia Institute of Technology | 20 | English Language | 15 | 15 |
| F2 | Understanding Research Methods | University of London | 6 | Getting Information · Processing Information · Identifying Objects, Actions, and Events · Analyzing Data or Information | 35 | 20 |
| F3 | Learning How to Learn: Powerful mental tools to help you master tough subjects | Deep Teaching Solutions | 20 | Updating and Using Relevant Knowledge · Active Learning · Reading Comprehension | 26 | 15 |
| F4 | Critical Thinking Skills for the Professional | University of California, Davis | 9 | Critical Thinking · Complex Problem Solving · Making Decisions and Solving Problems | 13 | 8 |
| F5 | Work Smarter, Not Harder: Time Management for Personal & Professional Productivity | University of California, Irvine | 10 | Organizing, Planning, and Prioritizing Work · Scheduling Work and Activities | 10 | 10 |
| F6 | Project Planning: Putting It All Together | Google | 21 | Estimating the Quantifiable Characteristics of Products, Events, or Information | 4 | 4 |

เกณฑ์คัดเลือกที่กำหนดไว้ก่อนเลือกรายการมีห้าข้อ ได้แก่ ใช้เวลาสั้น (เป้าหมายไม่เกิน 15 ชั่วโมง โดย F1 F3 และ F6 เกินเล็กน้อยเพราะเป็นตัวเลือกที่น่าเชื่อถือที่สุดในกลุ่มนั้น) ลิงก์ต้นทางเปิดตรวจแล้ว ลงทะเบียนเรียนได้ฟรี ไม่ผูกกับสายเทคโนโลยีใด และจับคู่กับข้อกำหนดโดยผู้วิจัยเท่านั้นโดยไม่ใช้กฎเติมชั้น L2 ชั่วโมงใช้ตัวเลขที่หน้าหลักสูตรประกาศ ถ้าหน้าหลักสูตรระบุเป็นจำนวนสัปดาห์คูณชั่วโมงต่อสัปดาห์จะใช้ผลคูณนั้น และถือเป็นค่าประมาณสำหรับวางแผนเช่นเดียวกับรายการอื่นในคลัง

**ตาราง ฉ.2  ความเชื่อมโยงที่ยกจากชั้น L2 เป็นชั้น L1 จำนวน 17 คู่**

| อาชีพ | องค์ประกอบ | รายการ | ชั่วโมง | เหตุผลที่ผู้วิจัยยืนยัน |
|---|---|---|---|---|
| R07 | Engineering and Technology | NVIDIA-Certified Associate: Generative AI LLMs (CRT-R07-08) | 60 | ออกแบบและปรับแต่งระบบ LLM ระดับโปรดักชัน |
| R10 | Engineering and Technology | Database Management Essentials (CRS-R10-02) | 30 | ออกแบบสคีมาและโครงสร้างจัดเก็บข้อมูล |
| R11 | Engineering and Technology | CompTIA Security+ (CRT-R11-01) | 100 | ออกแบบสถาปัตยกรรมความมั่นคงปลอดภัย |
| R12 | Engineering and Technology | Introduction to Cybersecurity Tools & Cyberattacks (CRS-R12-06) | 25 | หลักการทำงานของกลไกป้องกันเชิงเทคนิค |
| R13 | Engineering and Technology | Penetration Testing Student (PTS) Learning Path (CRS-R13-05) | 80 | เข้าใจกลไกทางเทคนิคของระบบเป้าหมายจึงออกแบบการทดสอบได้ |
| R10 | Telecommunications | AWS Certified Solutions Architect – Associate (CRT-R10-10) | 120 | VPC การแบ่งซับเน็ต และการเชื่อมต่อระหว่างบริการ |
| R16 | Telecommunications | AWS Fundamentals Specialization (CRS-R16-08) | 60 | เครือข่ายบนคลาวด์และการกำหนดเส้นทาง |
| R17 | Telecommunications | Introduction to Linux (LFS101) (CRS-R17-05) | 60 | ตั้งค่าเครือข่ายระดับ OS และวินิจฉัยการเชื่อมต่อ |
| R02 | Operations Analysis | Meta Full-Stack Engineer Professional Certificate (CRS-R02-02) | 200 | เดินครบวงจรจากรับความต้องการไปถึงออกแบบระบบ |
| R04 | Coordinating the Work and Activities of Others | Agile with Atlassian Jira (CRS-R04-10) | 15 | จัดคิวงาน มอบหมายงาน และติดตามความคืบหน้าของทีม |
| R17 | Operations Monitoring | Site Reliability Engineering: Measuring and Managing Reliability (CRS-R17-02) | 15 | กำหนด SLI/SLO และเฝ้าระวังสถานะบริการต่อเนื่อง |
| R17 | Quality Control Analysis | HashiCorp Terraform Associate Learning Path (CRS-R17-06) | 30 | terraform validate/plan และการตรวจนโยบายก่อนขึ้นระบบจริง |
| R14 | Performing Administrative Activities | Magnet Certified Forensics Examiner (MCFE) (CRT-R14-10) | 50 | บริหารแฟ้มคดี รักษาสายการครอบครองพยานหลักฐาน และจัดทำรายงาน |
| R04 | Judging the Qualities of Objects, Services, or People | Introduction to Software Testing (CRS-R04-02) | 30 | ประเมินคุณภาพซอฟต์แวร์ด้วยเกณฑ์และกรณีทดสอบ |
| R07 | Judging the Qualities of Objects, Services, or People | Generative AI with Large Language Models (CRS-R07-10) | 20 | ประเมินคุณภาพผลลัพธ์ของโมเดลด้วยเกณฑ์และชุดทดสอบ |
| R18 | Judging the Qualities of Objects, Services, or People | IREB Certified Professional for Requirements Engineering – Foundation Level (CRT-R18-06) | 50 | IREB กำหนดเกณฑ์คุณภาพของข้อกำหนดและวิธีตรวจตามเกณฑ์นั้น |
| R20 | Judging the Qualities of Objects, Services, or People | ITIL 4 Foundation Training (CRS-R20-06) | 30 | กำหนดระดับบริการและประเมินคุณภาพบริการที่ส่งมอบ |

ทุกคู่ในตารางนี้อยู่ในสายงานของอาชีพนั้นอยู่แล้ว เพราะความเชื่อมโยงทุกแถวในคลังมีรหัสอาชีพตรงกับรหัสอาชีพของรายการ การยกระดับคงรหัสกฎที่เสนอความเชื่อมโยงเดิมไว้เพื่อให้ตรวจย้อนกลับได้ ข้อกำหนด REQ-R14-4.A.3.b.5 (Repairing and Maintaining Electronic Equipment) ไม่ถูกยกระดับ เพราะรายการที่กฎเสนอทั้งหมดเป็นหลักสูตรตอบสนองเหตุการณ์และกู้คืนระบบ ไม่ใช่การซ่อมบำรุงอุปกรณ์อิเล็กทรอนิกส์ ข้อกำหนดนี้จึงรายงานเป็นช่องว่างที่คลังไม่มีรายการรองรับ

**ตาราง ฉ.3  ไฟล์ข้อมูลอ้างอิงและค่าแฮชของรุ่นที่ใช้**

{{manifest_table}}

สถานะการตรึงรุ่น: {{manifest_frozen}} ไฟล์ทั้งแปดถูกตรวจค่าแฮชทุกครั้งที่รันชุดทดสอบ ถ้าไฟล์ใดถูกแก้หลังบันทึกค่าแฮช ชุดทดสอบจะไม่ผ่าน
