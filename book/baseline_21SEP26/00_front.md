<!-- ถอดจาก PDF ฉบับขอสอบ หน้า 1–7 โดย scripts/pdf_to_markdown.py -->

กรอบการทำงานปัญญาประดิษฐ์เชิงสร้างสรรค์แบบหลายโมเดล เพื่อลดความคลาดเคลื่อนของข้อมูลในการวิเคราะห์ช่องว่างทักษะจากเรซูเม่

และการกำหนดเส้นทางการเรียนรู้เฉพาะบุคคล

## A Multi-Model Generative-AI Framework for Reducing Hallucination

## in Resume-Based Skill-Gap Analysis and Personalized Learning

## Pathways

โดย

ดนุสรณ์  อนันตกาล

Danusorn  Anantakan

รหัสนักศึกษา 68076026

อาจารย์ที่ปรึกษา

ผศ.ดร. สุภกิจ  นุตยะสกุล

รายงานนี้เป็นส่วนหนึ่งของวิชาการศึกษาอิสระ 1

หลักสูตรวิทยาศาสตรมหาบัณฑิต สาขาวิชาเทคโนโลยีสารสนเทศ

แขนงวิชาการจัดการเทคโนโลยีสารสนเทศ

คณะเทคโนโลยีสารสนเทศ

สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง

ภาคเรียนที่ 1 ปีการศึกษา 2569

A MULTI-MODEL GENERATIVE-AI FRAMEWORK FOR REDUCING HALLUCINATION IN RESUME-BASED SKILL-GAP ANALYSIS

AND PERSONALIZED LEARNING PATHWAYS

BY

DANUSORN  ANANTAKAN

STUDENT ID 68076026

ADVISOR

ASST. PROF. DR. SUPAKIT  NOOTYASKOOL

A REPORT SUBMITTED IN PARTIAL FULFILLMENT OF THE REQUIREMENTS

OF THE COURSE INDEPENDENT STUDY 1

MASTER OF SCIENCE PROGRAM IN INFORMATION TECHNOLOGY

MAJOR IN INFORMATION TECHNOLOGY MANAGEMENT

SCHOOL OF INFORMATION TECHNOLOGY

KING MONGKUT’S INSTITUTE OF TECHNOLOGY LADKRABANG

SEMESTER 1, ACADEMIC YEAR 2026

COPYRIGHT 2026

SCHOOL OF INFORMATION TECHNOLOGY

KING MONGKUT’S INSTITUTE OF TECHNOLOGY LADKRABANG หัวข้อ

กรอบการทำงานปัญญาประดิษฐ์เชิงสร้างสรรค์

แบบหลายโมเดล เพื่อลด

ความคลาดเคลื่อนของข้อมูลในการวิเคราะห์

ช่องว่างทักษะจากเรซูเม่ และการกำหนด

เส้นทางการเรียนรู้เฉพาะบุคคล รหัสนักศึกษา นักศึกษา

นายดนุสรณ์  อนันตกาล ปริญญา

วิทยาศาสตรมหาบัณฑิต สาขาวิชา

เทคโนโลยีสารสนเทศ แขนงวิชา

การจัดการเทคโนโลยีสารสนเทศ ปีการศึกษา อาจารย์ที่ปรึกษา

ผศ.ดร. สุภกิจ  นุตยะสกุล

บทคัดย่อ

การวางแผนพัฒนาทักษะจากเรซูเมต้องเทียบว่าสิ่งที่ผู้เรียนบันทึกไว้ตรงกับข้อกำหนดของอาชีพเป้าหมายเพียงใด การนำโมเดลภาษาขนาดใหญ่มารับงานนี้พบปัญหาสองด้าน คือข้อสรุปของโมเดลอาจไม่มีข้อความในเอกสารรองรับ และระบบมักไม่แยกกรณีที่ยังสรุปไม่ได้ออกจากกรณีที่ไม่พบหลักฐาน การศึกษานี้จึงพัฒนาและประเมินกรอบการทำงานที่ใช้ Generative AI หลายโมเดลร่วมกับกฎตรวจหลักฐาน เพื่อวิเคราะห์ช่องว่างทักษะและจัดลำดับรายการเรียนรู้ตามเวลาที่ผู้เรียนจัดสรรได้

กรอบการทำงานให้โมเดลสามโมเดลอ่านเรซูเมชุดเดียวกันโดยไม่เห็นผลของกันและกัน และบังคับให้ทุกข้อสรุปมาพร้อมข้อความที่ยกมาจากเอกสาร โปรแกรมตรวจว่าข้อความนั้นปรากฏจริงและเกี่ยวข้องกับข้อกำหนดตามกฎที่ตรึงไว้ล่วงหน้า ก่อนรวมผลด้วยเกณฑ์เสียงตรงกันอย่างน้อยสองโมเดล ข้อที่ไม่ผ่านเกณฑ์จะถูกรายงานว่ายังสรุปไม่ได้แทนการเดา ผู้เรียนเลือกอาชีพเป้าหมายได้ 20 อาชีพด้านเทคโนโลยีสารสนเทศ อาชีพละ 30 ข้อกำหนดจาก O*NET รุ่น 31.0 แล้วระบบจัดลำดับรายการเรียนรู้จากคลังที่ตรึงไว้ภายในกรอบเวลา 6 เดือน

แผนการประเมินใช้นักศึกษาปริญญาโทด้านเทคโนโลยีสารสนเทศ 30 คน และกลุ่มนำร่องอีก 5 คน คำถามข้อแรกวัดความถูกต้องของสถานะผลการตรวจหลักฐานเทียบกับชุดคำตอบอ้างอิงที่จัดทำโดยไม่เห็นผลของระบบ ข้อที่สองวัดความเหมาะสมของแผนการเรียนรู้ในห้ามิติ คือความตรงประเด็น ความครอบคลุมช่องว่าง ความถูกต้องของข้อมูลรายการ ความเป็นไปได้ด้านเวลา และประโยชน์ที่ผู้เรียนรับรู้ เอกสารฉบับนี้ครอบคลุมบทที่ 1 ถึงบทที่ 3 ผลส่วนที่เกี่ยวกับผู้เข้าร่วมจึงเป็นแผน ไม่ใช่ผลที่ดำเนินการแล้ว คำสำคัญ: Generative AI, การวิเคราะห์เรซูเม, ช่องว่างทักษะ, เส้นทางการเรียนรู้เฉพาะบุคคล, O*NET, ความคลาดเคลื่อนของข้อมูล Title

A Multi-Model Generative-AI Framework

for Reducing Hallucination in Resume-

Based Skill-Gap Analysis and

Personalized Learning Pathways Student

Mr. Danusorn Anantakan Student ID Degree

Master of Science Program

Information Technology Major

Information Technology Management Academic Year Advisor

Asst. Prof. Dr. Supakit Nootyaskool

ABSTRACT

Skill development planning from a resume depends on how far the evidence a learner has documented matches the requirements of a target occupation. Applying large language models to this task raises two problems: a model may assert a conclusion that no text in the document supports, and systems rarely separate a case that cannot yet be decided from one in which supporting evidence is absent. This study develops and evaluates a framework that pairs several generative-AI models with deterministic verification rules to analyse skill gaps from resume data and to order learning resources within the study time a learner can commit.

Three models read the same resume without seeing one another's output, and every conclusion must carry text quoted from the document. A program confirms that the quoted text occurs in the document and relates to the requirement under rules fixed in advance, then combines the results when at least two models agree. Requirements that fail this test are reported as undecided rather than guessed. Learners choose one of 20 information technology occupations, each carrying 30 requirements from a frozen snapshot of the O*NET 31.0 database, and the system schedules items from a pre-frozen catalogue across a six-month horizon.

The evaluation plan covers 30 master's students in information technology and a pilot group of five. The first research question measures the accuracy of evidence-state identification against a reference set coded without sight of system output. The second measures the appropriateness of the resulting plans on five dimensions: relevance, gap coverage, item data accuracy, time feasibility, and perceived usefulness. Because this document covers Chapters 1 to 3, results involving participants are presented as a plan rather than as completed findings. Keywords: generative AI; resume analysis; skill gaps; personalized learning pathways; O*NET; hallucination

สารบัญ

หน้า บทที่ 1 บทนำ ................................................................................................................................. 12 1.1 ความเป็นมาและความสำคัญของปัญหา .................................................................................... 12 1.2 คำถามการวิจัย ......................................................................................................................... 12 1.3 วัตถุประสงค์ของการวิจัย .......................................................................................................... 13 1.4 ขอบเขตของการวิจัย ................................................................................................................. 13 1.5 ผลที่คาดว่าจะได้รับ .................................................................................................................. 14 1.6 นิยามศัพท์เฉพาะ ...................................................................................................................... 14 1.7 ข้อจำกัดของการวิจัย ................................................................................................................ 16 บทที่ 2 เอกสารและงานวิจัยที่เกี่ยวข้อง .......................................................................................... 18 2.1 ข้อมูลในเรซูเมกับการวางแผนพัฒนาทักษะ .............................................................................. 18 2.2 การอ่านข้อความจากเอกสารด้วย OCR .................................................................................... 18 2.3 การใช้ LLM วิเคราะห์ข้อความและข้อจำกัดด้านหลักฐาน ........................................................ 19 2.4 การรวมผลจากหลายโมเดล ...................................................................................................... 19 2.5 ข้อมูลอ้างอิงอาชีพจากฐานข้อมูล O*NET ................................................................................. 20 2.6 การแนะนำรายการเรียนรู้และประโยชน์ที่ผู้เรียนรับรู้................................................................ 20 2.7 การสังเคราะห์งานที่เกี่ยวข้องและกรอบแนวคิดของการศึกษา .................................................. 21 บทที่ 3 วิธีดำเนินการวิจัย ................................................................................................................ 23 3.1 รูปแบบและขั้นตอนการวิจัย ..................................................................................................... 23 3.1.1 แนวทางการวิจัย .................................................................................................................... 23 3.1.2 ลำดับขั้นตอนการดำเนินงาน ................................................................................................. 23 3.1.3 สถานะของการดำเนินงาน ..................................................................................................... 23 3.2 กลุ่มตัวอย่างและหน่วยวิเคราะห์ ............................................................................................... 26 3.2.1 กลุ่มตัวอย่าง .......................................................................................................................... 26 3.2.2 หน่วยวิเคราะห์ ...................................................................................................................... 26 3.3 ข้อมูลและเครื่องมือที่ใช้ ............................................................................................................ 26 3.3.1 ข้อกำหนดอ้างอิงของอาชีพ.................................................................................................... 26 3.3.2 คลังรายการเรียนรู้และความเชื่อมโยง .................................................................................... 32 3.3.3 โมเดล Generative AI และบริการอ่านข้อความ.................................................................... 35 3.3.4 เครื่องมือเก็บข้อมูล ................................................................................................................ 36
