---
title_th: "กรอบการทำงานปัญญาประดิษฐ์เชิงสร้างสรรค์แบบหลายโมเดล เพื่อลดความคลาดเคลื่อนของข้อมูลในการวิเคราะห์ช่องว่างทักษะจากเรซูเม และการกำหนดเส้นทางการเรียนรู้เฉพาะบุคคล"
title_en: "A Multi-Model Generative-AI Framework for Reducing Hallucination in Resume-Based Skill-Gap Analysis and Personalized Learning Pathways"
author_th: "นายดนุสรณ์ อนันตกาล"
author_en: "Danusorn Anantakan"
student_id: "68076026"
advisor_th: "ผศ.ดร. สุภกิจ นุตยะสกุล"
advisor_en: "Asst. Prof. Dr. Supakit Nootyaskool"
course_th: "รายงานการศึกษาอิสระ 1"
course_en: "INDEPENDENT STUDY 1 REPORT"
program_th: "หลักสูตรวิทยาศาสตรมหาบัณฑิต สาขาวิชาเทคโนโลยีสารสนเทศ"
program_en: "MASTER OF SCIENCE PROGRAM IN INFORMATION TECHNOLOGY"
major_th: "แขนงวิชาการจัดการเทคโนโลยีสารสนเทศ"
major_en: "INFORMATION TECHNOLOGY MANAGEMENT"
faculty_th: "คณะเทคโนโลยีสารสนเทศ"
faculty_en: "FACULTY OF INFORMATION TECHNOLOGY"
institute_th: "สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง"
institute_en: "KING MONGKUT'S INSTITUTE OF TECHNOLOGY LADKRABANG"
term_th: "ภาคเรียนที่ 1 ปีการศึกษา 2569"
term_en: "SEMESTER 1, ACADEMIC YEAR 2026"
---

<!-- ส่วนหน้า · เขียนใหม่ 1 ต.ค. 2569 (DEC-44) · บทคัดย่อเขียนหลังบทที่ 1–3 · ตัวเลขผ่าน {{key}} เท่านั้น · ไม่เกิน 300 คำ (ตรวจด้วย check_docx_format.py) -->

# บทคัดย่อ

เรซูเมบอกได้ว่าผู้เรียนบันทึกหลักฐานของทักษะใดไว้แล้ว แต่เมื่อให้โมเดลภาษาขนาดใหญ่อ่าน โมเดลอาจสรุปทักษะที่เอกสารไม่มีข้อความรองรับ และระบบส่วนใหญ่ไม่แยกข้อที่ยังตัดสินไม่ได้ออกจากข้อที่ไม่พบหลักฐาน การศึกษานี้พัฒนาระบบที่ให้โมเดลปัญญาประดิษฐ์เชิงสร้างสรรค์ (Generative AI) สามโมเดลอ่านเรซูเมฉบับเดียวกันแยกจากกัน แต่ละข้อสรุปต้องมีข้อความที่ยกจากเรซูเม แล้วกฎที่ตรึงไว้ล่วงหน้าตรวจว่าข้อความนั้นมีอยู่จริงและเกี่ยวข้องกับข้อกำหนดอ้างอิง โดยให้โมเดลอีกตัวตรวจความหมายเมื่อคำไม่ตรง จากนั้นระบบรวมผลเมื่อโมเดลอย่างน้อยสองโมเดลเห็นตรงกัน ข้อที่ไม่ถึงเกณฑ์นี้ได้สถานะระบบยังสรุปไม่ได้ 

ระบบใช้ข้อกำหนดอ้างอิงจาก O*NET 31.0 จำนวน 20 อาชีพ อาชีพละ 30 ข้อ และจัดแผนการเรียนรู้จากคลังรายการเรียนรู้ {{corpus_items}} รายการภายในเวลาที่ผู้เรียนมี ทั้งหมดทำงานใน workflow เดียวบน n8n

ผลที่มีแล้วมาจากข้อมูลสังเคราะห์และการจำลอง ชุดทดสอบผ่าน {{tests_pass}} จาก {{tests_total}} ชุด การรันกับเรซูเมสังเคราะห์สี่กรณีด้วยผลตอบกลับจำลองของโมเดลยืนยันว่าระบบคำนวณสถานะ คะแนน และแผนตามนิยาม คลังรองรับข้อกำหนดอ้างอิง {{cov_corpus}} จาก 600 ข้อ และแผนจำลองที่ 6 เดือน 10 ชั่วโมงต่อสัปดาห์ครอบคลุม {{cov_plan}} ข้อ การวินิจฉัยด้วยกำหนดการเชิงเส้นจำนวนเต็มพบว่าข้อที่ขาดส่วนใหญ่เกิดจากชั่วโมงไม่พอ

ผู้เข้าร่วมในการประเมินจะเป็นนักศึกษาระดับปริญญาโทสาขาเทคโนโลยีสารสนเทศกลุ่มหลัก 30 คน และกลุ่มนำร่อง 5 คน คำถามแรกวัดความถูกต้องของสถานะเทียบกับชุดคำตอบอ้างอิงที่ให้รหัสโดยไม่เห็นผลของระบบ คำถามที่สองวัดความเหมาะสมของแผนห้ามิติ

**คำสำคัญ:** ปัญญาประดิษฐ์เชิงสร้างสรรค์, เรซูเม, ช่องว่างทักษะ, การตรวจหลักฐาน, แผนการเรียนรู้เฉพาะบุคคล, O*NET

# ABSTRACT

A resume shows which skills a learner has already documented, yet a large language model reading it may report skills that no sentence in the document supports, and most systems do not separate requirements that cannot yet be decided from those with no evidence. This study builds a system in which three generative AI models read the same resume independently. Every claim must quote the resume, and fixed rules check that the quote exists and relates to the reference requirement before the results are combined; a second model checks relevance when wording differs. Quotes that fail are not counted as evidence, and requirements without agreement from at least two models are marked as undecided.

The system uses 30 reference requirements for each of 20 occupations from O*NET 31.0 and orders items from a catalogue of {{corpus_items}} learning resources within the time the learner has, all inside a single n8n workflow.

Current results come from synthetic data and simulation. The test suite passes {{tests_pass}} of {{tests_total}} tests, and runs on four synthetic resumes with simulated model responses confirm that statuses, scores and plans follow their definitions. The catalogue supports {{cov_corpus}} of 600 requirements, and simulated plans for six months at ten hours a week cover {{cov_plan}}. An integer linear programming diagnosis shows that most missing requirements are limited by hours rather than by the selection method.

The planned evaluation involves 30 master's students in information technology and a pilot group of five. The first research question measures status accuracy against a reference set coded without seeing system output; the second rates plan appropriateness on five dimensions.

**Keywords:** generative AI; resume; skill gap; evidence verification; personalized learning plan; O*NET

# กิตติกรรมประกาศ

ผู้วิจัยขอขอบพระคุณ ผศ.ดร. สุภกิจ นุตยะสกุล อาจารย์ที่ปรึกษา ที่ให้คำแนะนำตลอดการทำงาน และขอบคุณคณะเทคโนโลยีสารสนเทศ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง ที่เปิดโอกาสให้ทำการศึกษานี้

ข้อมูลอาชีพในเล่มนี้มาจากฐานข้อมูล O*NET 31.0 ของ National Center for O\*NET Development ซึ่งเผยแพร่ภายใต้สัญญาอนุญาต CC BY 4.0

<p align="right">ดนุสรณ์ อนันตกาล</p>

# คำอธิบายคำย่อ

| คำย่อ | คำเต็ม | ความหมายในเล่มนี้ |
|---|---|---|
| AIS | Attributable to Identified Sources | กรอบที่ถามว่าข้อความมีแหล่งที่ระบุได้รองรับหรือไม่ |
| API | Application Programming Interface | ช่องทางที่โปรแกรมเรียกใช้บริการของผู้ให้บริการ |
| ILP | Integer Linear Programming | กำหนดการเชิงเส้นจำนวนเต็ม ใช้หาคำตอบที่ดีที่สุดเพื่อเทียบกับตัวจัดแผน |
| LLM | Large Language Model | โมเดลภาษาขนาดใหญ่ |
| OCR | Optical Character Recognition | การอ่านตัวอักษรจากภาพ |
| O\*NET | Occupational Information Network | ฐานข้อมูลอาชีพของสหรัฐอเมริกาที่ใช้เป็นที่มาของข้อกำหนดอ้างอิง |
| PDPA | Personal Data Protection Act | พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 |
| PII | Personally Identifiable Information | ข้อมูลที่ระบุตัวบุคคลได้ |
| SOC | Standard Occupational Classification | ระบบรหัสอาชีพที่ O\*NET ใช้ |
| URL | Uniform Resource Locator | ที่อยู่ของหน้าเว็บ |
