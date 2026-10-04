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

<!-- ส่วนหน้า · บทคัดย่อเขียนใหม่ 4 ต.ค. 2569 · บทคัดย่อเขียนหลังบทที่ 1 ถึง 3 · ตัวเลขผ่านตัวแทนค่าใน numbers.json เท่านั้น · ไม่เกิน 300 คำ (ตรวจด้วย check_docx_format.py) -->

# บทคัดย่อ

โมเดลภาษาขนาดใหญ่ที่วิเคราะห์เรซูเมอาจสรุปทักษะที่ไม่มีข้อความในเอกสารรองรับ การศึกษานี้พัฒนากรอบการทำงานที่ให้โมเดลปัญญาประดิษฐ์เชิงสร้างสรรค์ (Generative AI) สามโมเดลจากสามผู้ให้บริการอ่านเรซูเมฉบับเดียวกันแยกกัน ทุกข้อสรุปต้องยกข้อความจากเรซูเมประกอบ และผ่านกฎตรวจหลักฐาน R0 ถึง R7 ที่กำหนดไว้ล่วงหน้า ซึ่งตรวจว่าข้อความมีอยู่จริง เกี่ยวข้องกับข้อกำหนดอ้างอิง และแสดงว่าเจ้าของเรซูเมลงมือทำเอง หากถ้อยคำไม่ตรงกัน โมเดลอีกตัวจะตรวจความหมาย ระบบกำหนดสถานะเมื่อโมเดลอย่างน้อยสองโมเดลเห็นตรงกัน มิฉะนั้นรายงานว่า "งดสรุป" แล้วจัดแผนการเรียนรู้ภายในเวลาที่ผู้เรียนมี

คำว่า "ลด" ในชื่อเรื่องหมายถึงจุดมุ่งหมายของการออกแบบ การศึกษานี้ไม่ได้ทดสอบเชิงเหตุผลว่าระบบลดความคลาดเคลื่อนได้เท่าใดเมื่อเทียบกับวิธีอื่น

ระบบใช้ข้อกำหนดอ้างอิงจาก O*NET 31.0 จำนวน 20 อาชีพ อาชีพละ 30 ข้อ และคลังรายการเรียนรู้ {{corpus_items}} รายการ ทำงานใน workflow เดียวบน n8n ผลเบื้องต้นจากข้อมูลสังเคราะห์และบริการจำลองคือ การทดสอบอัตโนมัติผ่าน {{tests_pass}} จาก {{tests_total}} กรณี การรัน workflow ผ่าน {{n8n_pass}} จาก {{n8n_cases}} กรณี คลังรองรับข้อกำหนดอ้างอิง {{cov_corpus}} จาก 600 ข้อ และแผนจำลองที่ 6 เดือน 10 ชั่วโมงต่อสัปดาห์ครอบคลุม {{cov_plan}} ข้อ ยังไม่ได้ทดสอบกับโมเดลจริง

แผนการประเมินเป็นแบบกลุ่มเดียว ใช้นักศึกษาระดับปริญญาโทสาขาเทคโนโลยีสารสนเทศ 30 คน และกลุ่มนำร่อง 5 คน คำถามวิจัยข้อแรกวัดความถูกต้องของสถานะเทียบกับชุดคำตอบอ้างอิงที่ผู้วิจัยลงรหัสโดยไม่เห็นผลของระบบ และวัดความเที่ยงด้วยค่า kappa ของการลงรหัสซ้ำ ข้อที่สองวัดความเหมาะสมของแผนการเรียนรู้ ยังไม่มีผลจากผู้เข้าร่วม

**คำสำคัญ:** ปัญญาประดิษฐ์เชิงสร้างสรรค์, เรซูเม, ช่องว่างทักษะ, การตรวจหลักฐาน, แผนการเรียนรู้เฉพาะบุคคล, O*NET

# ABSTRACT

A large language model reading a resume may report skills that no sentence in the document supports. This study develops a framework in which three generative AI models from three providers read the same resume independently. Every claim must quote the resume and pass pre-specified evidence rules R0 to R7, which check that the quote exists, relates to the reference requirement and shows the candidate doing the work; another model judges relevance when the wording differs. A status is accepted only when at least two models agree; otherwise the requirement is reported as abstained. The system then orders learning items within the learner's available time.

The word "reducing" in the title denotes a design aim: the evaluation is single-arm and does not test causally how much the framework reduces unsupported claims relative to other methods.

The system uses 30 O*NET 31.0 requirements for each of 20 occupations and a learning-item catalogue of {{corpus_items}} items inside one n8n workflow. Preliminary results come from synthetic data and mock services: the automated test suite passes {{tests_pass}} of {{tests_total}} cases, and n8n runs against mock Google and model services pass {{n8n_pass}} of {{n8n_cases}} cases. The catalogue supports {{cov_corpus}} of 600 requirements by design, and simulated six-month plans at ten hours a week cover {{cov_plan}}. The three real models have not yet been tested.

The planned single-arm evaluation involves 30 master's students in information technology and a pilot group of five. The first research question measures status accuracy against a reference set coded by the researcher alone, blind to system output, with intra-rater kappa as the reliability check. The second rates the appropriateness of the learning plan. No participant results exist yet.

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
| IOC | Index of Item-Objective Congruence | ดัชนีความสอดคล้องของข้อคำถามกับสิ่งที่ต้องการวัด งานนี้ไม่ใช้เพราะหาผู้เชี่ยวชาญไม่ได้ |
| LLM | Large Language Model | โมเดลภาษาขนาดใหญ่ |
| LV | Level | ระดับความซับซ้อนของข้อกำหนดอ้างอิงตามมาตรของ O\*NET ที่ R7 ใช้ตัดสิน |
| OCR | Optical Character Recognition | การอ่านตัวอักษรจากภาพ |
| O\*NET | Occupational Information Network | ฐานข้อมูลอาชีพของสหรัฐอเมริกาที่ใช้เป็นที่มาของข้อกำหนดอ้างอิง |
| PDPA | Personal Data Protection Act | พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 |
| PII | Personally Identifiable Information | ข้อมูลที่ระบุตัวบุคคลได้ |
| R0 ถึง R7 | Evidence Rules R0 to R7 | กฎตรวจหลักฐานที่กำหนดไว้ล่วงหน้า ({{rules_label}}) |
| R7 | Rule 7: Actor and Quote Reuse | กฎที่ตรวจว่าผู้เขียนลงมือทำเอง ข้อกำหนดอ้างอิงที่ LV ตั้งแต่ 5.0 ต้องมีหลักฐานระดับนำงาน และข้อความหนึ่งเป็นหลักฐานเต็มได้ไม่เกิน 2 ข้อ |
| Role-Fit | Role-Fit Score | คะแนนความตรงกับอาชีพในรายงานผู้เรียน คำนวณจาก (1 − w)·R_role + w·T เมื่อ w = 0.5 ไม่เป็นตัวชี้วัดของคำถามวิจัย |
| SOC | Standard Occupational Classification | ระบบรหัสอาชีพที่ O\*NET ใช้ |
| URL | Uniform Resource Locator | ที่อยู่ของหน้าเว็บ |
