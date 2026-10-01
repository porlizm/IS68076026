---
title_th: "กรอบการทำงานปัญญาประดิษฐ์เชิงสร้างสรรค์แบบหลายโมเดล เพื่อลดความคลาดเคลื่อนของข้อมูลในการวิเคราะห์ช่องว่างทักษะจากเรซูเม และการกำหนดเส้นทางการเรียนรู้เฉพาะบุคคล"
title_th_note: "เล่มฉบับขอสอบใช้ 'เรซูเม่' ในชื่อเรื่องและ 'เรซูเม' ในเนื้อความ · ฉบับนี้ใช้ 'เรซูเม' ทั้งเล่ม ต้องยืนยันกับชื่อที่ลงทะเบียนไว้กับคณะ (NEXT_STEPS ข้อ 27)"
title_en: "A Multi-Model Generative-AI Framework for Reducing Hallucination in Resume-Based Skill-Gap Analysis and Personalized Learning Pathways"
author_th: "ดนุสรณ์ อนันตกาล"
author_en: "Danusorn Anantakan"
student_id: "68076026"
advisor_th: "ผศ.ดร. สุภกิจ นุตยะสกุล"
advisor_en: "Asst. Prof. Dr. Supakit Nootyaskool"
course_th: "วิชาการศึกษาอิสระ 1"
program_th: "หลักสูตรวิทยาศาสตรมหาบัณฑิต สาขาวิชาเทคโนโลยีสารสนเทศ"
major_th: "แขนงวิชาการจัดการเทคโนโลยีสารสนเทศ"
faculty_th: "คณะเทคโนโลยีสารสนเทศ"
institute_th: "สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง"
term_th: "ภาคเรียนที่ 1 ปีการศึกษา 2569"
term_en: "SEMESTER 1, ACADEMIC YEAR 2026"
---

# บทคัดย่อ

การวางแผนพัฒนาทักษะจากเรซูเมต้องเทียบว่าสิ่งที่ผู้เรียนบันทึกไว้ตรงกับข้อกำหนดของอาชีพเป้าหมายเพียงใด การนำโมเดลภาษาขนาดใหญ่มารับงานนี้พบปัญหาสองด้าน คือข้อสรุปของโมเดลอาจไม่มีข้อความในเอกสารรองรับ และระบบมักไม่แยกกรณีที่ยังสรุปไม่ได้ออกจากกรณีที่ไม่พบหลักฐาน การศึกษานี้จึงพัฒนาและประเมินกรอบการทำงานที่ใช้ Generative AI หลายโมเดลร่วมกับกฎตรวจหลักฐาน เพื่อวิเคราะห์ช่องว่างทักษะและจัดลำดับรายการเรียนรู้ตามเวลาที่ผู้เรียนจัดสรรได้

กรอบการทำงานให้โมเดลสามโมเดลอ่านเรซูเมชุดเดียวกันโดยไม่เห็นผลของกันและกัน และบังคับให้ทุกข้อสรุปมาพร้อมข้อความที่ยกมาจากเอกสาร โปรแกรมตรวจว่าข้อความนั้นปรากฏจริงและเกี่ยวข้องกับข้อกำหนดตามกฎที่ตรึงไว้ล่วงหน้า ก่อนรวมผลด้วยเกณฑ์เสียงตรงกันอย่างน้อยสองโมเดล ข้อที่ไม่ผ่านเกณฑ์จะถูกรายงานว่ายังสรุปไม่ได้แทนการเดา ผู้เรียนเลือกอาชีพเป้าหมายได้ 20 อาชีพด้านเทคโนโลยีสารสนเทศ อาชีพละ 30 ข้อกำหนดจาก O*NET รุ่น 31.0 แล้วระบบจัดลำดับรายการเรียนรู้จากคลังที่ตรึงไว้ภายในกรอบเวลา 6 เดือน

แผนการประเมินใช้นักศึกษาปริญญาโทด้านเทคโนโลยีสารสนเทศ 30 คน และกลุ่มนำร่องอีก 5 คน คำถามข้อแรกวัดความถูกต้องของสถานะผลการตรวจหลักฐานเทียบกับชุดคำตอบอ้างอิงที่จัดทำโดยไม่เห็นผลของระบบ ข้อที่สองวัดความเหมาะสมของแผนการเรียนรู้ในห้ามิติ คือความตรงประเด็น ความครอบคลุมช่องว่าง ความถูกต้องของข้อมูลรายการ ความเป็นไปได้ด้านเวลา และประโยชน์ที่ผู้เรียนรับรู้ เอกสารฉบับนี้ครอบคลุมบทที่ 1 ถึงบทที่ 3 ผลส่วนที่เกี่ยวกับผู้เข้าร่วมจึงเป็นแผน ไม่ใช่ผลที่ดำเนินการแล้ว

**คำสำคัญ:** Generative AI, การวิเคราะห์เรซูเม, ช่องว่างทักษะ, เส้นทางการเรียนรู้เฉพาะบุคคล, O*NET, ความคลาดเคลื่อนของข้อมูล

# ABSTRACT

Skill development planning from a resume depends on how far the evidence a learner has documented matches the requirements of a target occupation. Applying large language models to this task raises two problems: a model may assert a conclusion that no text in the document supports, and systems rarely separate a case that cannot yet be decided from one in which supporting evidence is absent. This study develops and evaluates a framework that pairs several generative-AI models with deterministic verification rules to analyse skill gaps from resume data and to order learning resources within the study time a learner can commit.

Three models read the same resume without seeing one another's output, and every conclusion must carry text quoted from the document. A program confirms that the quoted text occurs in the document and relates to the requirement under rules fixed in advance, then combines the results when at least two models agree. Requirements that fail this test are reported as undecided rather than guessed. Learners choose one of 20 information technology occupations, each carrying 30 requirements from a frozen snapshot of the O*NET 31.0 database, and the system schedules items from a pre-frozen catalogue across a six-month horizon.

The evaluation plan covers 30 master's students in information technology and a pilot group of five. The first research question measures the accuracy of evidence-state identification against a reference set coded without sight of system output. The second measures the appropriateness of the resulting plans on five dimensions: relevance, gap coverage, item data accuracy, time feasibility, and perceived usefulness. Because this document covers Chapters 1 to 3, results involving participants are presented as a plan rather than as completed findings.

**Keywords:** generative AI; resume analysis; skill gaps; personalized learning pathways; O*NET; hallucination
