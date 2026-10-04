# 00_fact_sheet · ข้อเท็จจริงที่ใช้เขียนเล่ม IS 68076026

> สร้าง 1 ต.ค. 2569 (Phase 0 · DEC-44) · เขียนเล่มจากไฟล์นี้ + `book/numbers.json` + `workflows/WF_IS_68076026_01OCT26.json` เท่านั้น (DEC-48 · เดิม WF_IS68076026.json)
> แต่ละข้อสั้นไม่เกิน 2 บรรทัด และมีแหล่งที่มาใน [ ] · ตัวเลขผลลัพธ์อยู่ใน numbers.json ไม่พิมพ์ที่นี่
> ย่อแหล่ง: PDF = `docs/baseline/IS_68076026_ExamSubmission_21SEP26.pdf` · E = `engine/engine.js` · P = `config/project.json` · M = `config/models.json` · S = `config/sheets.json`

## F1 ข้อมูลโครงการ
- ชื่อไทย: กรอบการทำงานปัญญาประดิษฐ์เชิงสร้างสรรค์แบบหลายโมเดล เพื่อลดความคลาดเคลื่อนของข้อมูลในการวิเคราะห์ช่องว่างทักษะจากเรซูเม และการกำหนดเส้นทางการเรียนรู้เฉพาะบุคคล [Prompt_Report §3 · DEC-36 ข้อ 1]
- ชื่ออังกฤษ: A Multi-Model Generative-AI Framework for Reducing Hallucination in Resume-Based Skill-Gap Analysis and Personalized Learning Pathways [P.title_en]
- ผู้วิจัย นายดนุสรณ์ อนันตกาล (Danusorn Anantakan) รหัส 68076026 [PDF ปก]
- อาจารย์ที่ปรึกษา ผศ.ดร. สุภกิจ นุตยะสกุล (Asst. Prof. Dr. Supakit Nootyaskool) [PDF ปก]
- วท.ม. เทคโนโลยีสารสนเทศ แขนงการจัดการเทคโนโลยีสารสนเทศ คณะเทคโนโลยีสารสนเทศ สจล. [PDF ปก]
- รายวิชาการศึกษาอิสระ 1 · ภาคเรียนที่ 1 ปีการศึกษา 2569 [PDF ปก]
- ยังไม่เคยสอบ ไม่มีข้อเสนอแนะกรรมการ [DEC-40]
- ใช้คำว่า "เรซูเม" ทั้งเล่มรวมปก [DEC-44 · DEC-36 ข้อ 1]

## F2 ปัญหา
- โมเดลภาษาอาจสรุปว่าผู้เรียนมีทักษะ ทั้งที่เอกสารไม่มีข้อความรองรับ [PDF บทที่ 1 · Ji et al.]
- ระบบส่วนใหญ่ไม่แยก "ยังสรุปไม่ได้" ออกจาก "ไม่พบหลักฐาน" ทั้งที่ต้องปฏิบัติต่างกัน [PDF 1.2]
- GPT-4 ให้คะแนนเรซูเม 736 ฉบับ สัมพันธ์กับคะแนนมนุษย์ในระดับต่ำ [ref Vaishampayan 2025]
- โมเดลต่างตระกูลสกัดข้อมูลเรซูเมได้ผลต่างกันอย่างมีนัยสำคัญ (6 โมเดล, zero/one-shot) [ref de Quadros 2025]
- ไม่มีข้อความอ้างอิง ผู้ใช้ตรวจที่มาของข้อสรุปไม่ได้ [PDF 1.1 · Rashkin AIS]

## F3 คำถามการวิจัย
- RQ1: ระบบระบุสถานะผลการตรวจหลักฐานรายข้อกำหนดได้ถูกต้องเพียงใด เทียบชุดคำตอบอ้างอิงที่ให้รหัสโดยไม่เห็นผลระบบ [PDF 1.2]
- RQ2: แผนการเรียนรู้ที่ระบบจัดเหมาะสมเพียงใดใน 5 มิติ [PDF 1.2]
- 5 มิติ: ความตรงประเด็น · ความครอบคลุมช่องว่าง · ความถูกต้องของข้อมูลรายการ · ความเป็นไปได้ด้านเวลา · ประโยชน์ที่ผู้เรียนรับรู้ [PDF 3.9.2]
- ไม่มีเงื่อนไขเทียบโมเดลเดี่ยว ไม่มี ablation จึงไม่สรุปเชิงสาเหตุว่าหลายโมเดลดีกว่า [PDF 1.2, 3.1.1]

## F4 วัตถุประสงค์
- O1 พัฒนาและประเมินความถูกต้องของระบบ 3 โมเดล + กฎตรวจหลักฐาน ที่แสดงข้อความตรวจย้อนได้ [PDF 1.3]
- O2 พัฒนาและประเมินความเหมาะสมของแผนจากคลังที่ตรึงไว้ ภายใต้เวลาที่ผู้เรียนมี [PDF 1.3]

## F5 ขอบเขต
- 20 อาชีพไอที × 30 ข้อกำหนด = 600 ข้อ จาก O*NET 31.0 [data/requirements.csv · roles.json]
- เรซูเมภาษาอังกฤษ PDF ≤ 10,485,760 ไบต์ ≤ 5 หน้า [P.max_file_bytes, max_pages]
- รับผ่าน Google Forms (ต้องลงชื่อเข้า Google · ยินยอมก่อนประมวลผล) ส่งรายงานภาษาไทยทาง Gmail รายบุคคล [PDF 1.4 · E.validateIntake]
- กรอบเวลา 6/12/18/24 เดือน · การประเมินหลักใช้ 6 เดือน [P.allowed_months, primary_evaluation_months]
- ชั่วโมงต่อสัปดาห์ > 0 และ ≤ 60 [P.max_hours_per_week · E.validateIntake]
- ประเภทคำแนะนำ course_only / certification_only / both [P.allowed_modes]
- ไม่ติดตามผลการเรียน การได้งาน หรือทักษะระยะยาว [PDF 1.4]
- ผลรายอาชีพเป็นข้อมูลพรรณนา ไม่เปรียบเทียบระหว่างอาชีพ [PDF 1.4, 3.9.4]

## F6 นิยาม
- ข้อกำหนดอ้างอิง (requirement) = องค์ประกอบ O*NET หนึ่งรายการที่คัดให้อาชีพหนึ่ง พร้อมน้ำหนัก [PDF 1.6]
- หลักฐาน (evidence) / ข้อความอ้างอิง (quote) = ข้อความที่โมเดลคัดลอกจากเรซูเมหลังปิดบัง [PDF 1.6 · E.ruleR2]
- ช่องว่างทักษะ = ข้อที่สถานะสุดท้าย missing หรือ partially · abstained ไม่นับ [E.buildPlan]
- เส้นทางการเรียนรู้ = รายการเรียงตามลำดับความสำคัญภายใต้ Hmax ไม่ใช่ลำดับ prerequisite [PDF 1.6]
- ความคลาดเคลื่อนของข้อมูล (hallucination) ในงานนี้ = ข้อสรุปที่ quote ไม่พบ (R2) หรือไม่เกี่ยวข้อง (R3) [PDF 1.6]
- คะแนน R สะท้อนหลักฐานในเอกสาร ไม่ใช่ผลทดสอบทักษะ · ฟิลด์ readiness_pct [PDF 1.6 · S.runs]
- คลังรายการเรียนรู้ (corpus) = หลักสูตรและใบรับรองที่ตรึงไว้ ระบบไม่สร้างชื่อรายการเอง [PDF 1.6]
- ความครอบคลุมของคลัง = ข้อกำหนดที่มีรายการรองรับ ≥ 1 (L1 · ผ่าน C1–C5 · URL ตรวจแล้ว) เป้า 600 [DEC-41]
- ความครอบคลุมของแผนจำลอง = ผลรวม 20 อาชีพที่แผนครอบคลุม กรณีขาด 30 ข้อ 6 เดือน 10 ชม./สัปดาห์ both [DEC-41]

## F7 สี่สถานะ
- evidenced = พบหลักฐานตามเกณฑ์: ระบุงาน เครื่องมือ หรือผลงานตรงองค์ประกอบ [PDF ตาราง 3.23 · E.STATUS_TH]
- partially = พบหลักฐานบางส่วน: บางองค์ประกอบ หรือแค่รายวิชา/อบรม/ชื่อทักษะ [PDF ตาราง 3.23]
- missing = ไม่พบหลักฐานที่ผ่านเกณฑ์: ไม่มีข้อความ หรือ quote ไม่ผ่าน R2/R3 [PDF ตาราง 3.23]
- abstained = ระบบยังสรุปไม่ได้: m < 2 หรือไม่มีสถานะใดได้ ≥ 2 เสียง · เป็นผลระดับระบบ [E.evaluateRun]
- ชุดคำตอบอ้างอิงใช้ 3 สถานะแรกเท่านั้น [PDF 3.5.3]
- สถานะ 3 ระดับ: ที่โมเดลเสนอ (findings) → หลังตรวจรายโมเดล → สถานะสุดท้าย (decisions) [PDF 3.5.3 · S]

## F8 ข้อกำหนด 600 ข้อ
- ชุดข้อมูล `ONET31.0-IS68076026-v1.0` จาก O*NET 31.0 (CC BY 4.0) [data/manifest.json · ref O*NET]
- กฎคัด: IM ≥ 3.0 · 4 โดเมน (ไม่ใช้ Abilities) · โควตาโดเมนละ ≥ 3 · เรียง IM ↓ ตัดเท่ากันด้วย element_id · 30 ข้อแรก [scripts/build_reference_data.py · DEC-03, DEC-07]
- โดเมน: Work Activities 343 · Essential Skills 104 · Transferable Skills 77 · Knowledge 76 [tests/data.test.mjs]
- weight_share_of_pool 0.5128–0.9749 ข้าม 20 อาชีพ [build_reference_data.py]
- คำพ้อง (element_aliases) ใช้ใน R3 เท่านั้น ไม่ส่งเข้า prompt [E.buildPrompt]
- อาชีพ 20 อาชีพ R01–R20 พร้อม SOC และสายงาน 7 สาย [data/roles.json]
- Abilities ไม่ใช้เพราะเป็นความสามารถเชิงจิตวิทยาที่ไม่ปรากฏเป็นข้อความในเรซูเม [PDF 2.5]

## F9 คลังรายการเรียนรู้
- รหัสรุ่น `CORPUS_IS68076026-v1.5-01OCT26` [DEC-43]
- สร้างจาก v1.3 → ตรวจ URL → foundation track (DEC-18) → promote 17 คู่ L2→L1 (DEC-19) [DEC-29 · scripts/build_corpus.py]
- ความเชื่อมโยง 2 ชั้น: L1 ผู้วิจัยกำกับ · L2 กฎขยายผล · ตัวจัดแผนใช้ L1 เท่านั้น (กำหนดในโค้ด) [E.L1_LAYER · DEC-11]
- เกณฑ์ตรวจ C1 verified + https · C2 ข้อกำหนดอยู่ในอาชีพ · C3 L1 · C4 อยู่ใน competency_ids_l1 · C5 ชั่วโมง > 0 + mode [scripts/review_mappings.py]
- ผ่านตรวจ = source_checked_by_script (ตรวจความสอดคล้องข้อมูล ไม่ใช่ผู้เชี่ยวชาญรับรองเนื้อหา) [PDF 3.3.2]
- ระบบหยุดถ้าไม่มี mapping_review หรือผ่าน < 90% ของ L1 [E.mergeMappingReview · P.min_approved_share_of_L1 · DEC-21]
- ห้ามเดา URL รายการใหม่ต้องเปิดหน้าจริงและผู้วิจัยยืนยัน [DEC-16]
- ชั่วโมงในคลังเป็นค่าประมาณเพื่อวางแผน ไม่ใช่ค่าที่ผู้ให้บริการรับรอง [PDF 1.7]
- ตัวเลขคลัง/mapping/ความครอบคลุม → `{{corpus_items}}` ฯลฯ ใน numbers.json [scripts/book_numbers.py]

## F10 ระบบ
- n8n 2.39.9 บน Node.js 24 ติดตั้งในเครื่องผู้วิจัย · ไม่มีเซิร์ฟเวอร์ที่พัฒนาเอง [CLAUDE.md · PDF 3.4.1]
- workflow เดียว `WF_IS_68076026_01OCT26.json` 7 ช่วง (รับข้อมูล → อ่านและปิดบัง → วิเคราะห์ 3 โมเดล → ตรวจและรวมผล → จัดแผน → ส่งรายงาน → บันทึก/ข้อผิดพลาด) [DEC-42 → DEC-48]
- ทดสอบใน n8n 2.39.9 จริงกับบริการจำลอง 1 ต.ค. 2569 · พบและแก้: รหัส HTTP หายผ่าน task runner (ไม่เรียกซ้ำเมื่อ 429) · นับหน้า PDF แบบ object stream · งานที่เหลือในรอบที่ล้มหายเงียบ · ส่งไม่สำเร็จไม่แจ้งผู้วิจัย [DEC-48 · evidence/n8n_test_01OCT26.md]
- จำนวนโหนดและชื่อช่วงอ่านจาก `workflows/manifest.json` [DEC-42]
- ตรรกะทั้งหมดอยู่ใน engine.js ไฟล์เดียว ฝังลง Code node ตรงทุกไบต์ ตัวตรวจเทียบ sha [E header · scripts/validate_workflows.mjs]
- ค่าควบคุมอ่านจาก config/ เท่านั้น [DEC-42]
- ฐานข้อมูล Google Sheets · ไฟล์ใน Google Drive · ฟอร์ม Google Forms · อีเมล Gmail (OAuth2) [S · PDF 3.6.3 · ref n8n Google credentials]
- แท็บ operational 8: runs, ocr_results, model_calls, findings, decisions, plan_items, deliveries, audit_log [S.tabs]
- แท็บประเมิน: ground_truth และ plan_evaluation · ref 4 แท็บ: ref_roles, ref_requirements, ref_corpus, ref_mappings [S.tabs · sheets_import/]
- สถานะงาน running → ready → delivered หรือ failed [E.nextStage]
- กันงานซ้ำด้วย response_id = sha256(timestamp|email|file_id) [E.responseId, isDuplicate]
- run_id = RUN-<เวลา 14 หลัก>-<8 ตัวแรกของ response_id> [E.makeRunId]
- รหัสข้อผิดพลาดข้อมูลเข้า: consent_not_given, email_not_verified, file_missing, role_invalid, mode_invalid, timeline_invalid, hours_invalid [E.validateIntake]
- รหัสข้อผิดพลาดไฟล์: file_not_pdf, file_download_failed, file_too_large, too_many_pages [E.checkFile]
- กรณีใช้งาน 8 กรณี UC-01–UC-08 ผู้กระทำ 4 ราย (ผู้เข้าร่วม ผู้วิจัย บริการอ่านข้อความ ผู้ให้บริการโมเดล) [PDF 3.4.2 ตาราง 3.11]

## F11 อ่านข้อความและปิดบัง
- อ่านจาก text layer หรือ Google Document AI (OCR) · สำรอง OCR ภายในเครื่อง · บันทึกชื่อบริการและรุ่นทุกรอบ [P.ocr · S.ocr_results]
- ปรับรูปข้อความ 5 กฎ: ขึ้นบรรทัด · ช่องว่างพิเศษ · ขีด/อัญประกาศ · ยุบช่องว่างซ้ำ · บรรทัดว่าง ≤ 2 [E.normalizeText]
- ปิดบัง 4 รูปแบบ: [EMAIL] [URL] [ID] (13 หลัก) [PHONE] [E.maskPII]
- ชื่อบุคคล ที่อยู่ ชื่อบริษัท สถาบัน ไม่ถูกปิดบัง (ข้อจำกัด) [PDF 3.5.1]
- เก็บข้อความหลังปิดบังเป็นไฟล์ใน Drive ส่วนตัว (masked_text_file_id) + sha256 [DEC-34 · S.ocr_results]
- บริการอ่านข้อความได้ไฟล์ PDF ต้นฉบับทั้งไฟล์ (ก่อนปิดบัง) [PDF 3.10]

## F12 prompt และโมเดล
- prompt `analyst_v1.1` ชุดเดียวทั้ง 3 โมเดล · กฎ 10 ข้อ · quote 1–2 ช่วง ช่วงละ 20–160 ตัวอักษร (R0 ไม่ตรวจความยาว) · evidence_type · task_assessments [prompts/analyst_v1.1.txt · P.quote_length_prompt · DEC-53]
- ห้ามอนุมานจากชื่อตำแหน่ง บริษัท สถาบัน หรือจำนวนปี · ใช้กิจกรรม/ผลงาน/เครื่องมือ/คอร์ส/ใบรับรอง/วุฒิเป็นหลักฐานได้ รวมทักษะพื้นฐาน [prompt rule 2 · DEC-53]
- prompt ผู้ตรวจ `verifier_v1.0` · 6 กฎ · supports / partially_supports / unrelated · เห็นเฉพาะ quote กับข้อกำหนด [prompts/verifier_v1.0.txt · DEC-51]
- confidence เป็นค่าที่โมเดลรายงานเอง ไม่ลบล้างการตรวจข้อความ [prompt rule 7]
- โมเดล A OpenAI chat completions · B Anthropic messages · C Google generative language [M.models]
- รหัสรุ่นอ่านจาก env MODEL_A/B/C_ID · verified = false จนผ่าน smoke test [M]
- temperature 0 (รอ smoke test) · max output 16,384 (ผู้ตรวจ 4,096) · timeout 90 วินาที · เรียกซ้ำ ≤ 2 ครั้งเฉพาะ 429/หมดเวลา [M.defaults · DEC-35]
- บันทึก model_calls ทุกครั้งรวมครั้งที่ล้ม [E.callModelWithRetry · DEC-35]
- ห้ามเรียกผู้ให้บริการรายเดียว 3 ครั้งแล้วรายงานว่าเป็น 3 โมเดล [M._comment]
- 3 ผู้ให้บริการ: เลขคี่ให้เสียงข้างมาก · ลดโอกาสผิดพร้อมกัน · ไม่พิสูจน์ว่าความผิดพลาดอิสระทางสถิติ [PDF 3.3.3]

## F13 กฎ R0–R6 (`RULES-IS68076026-v2.0` · DEC-51–54)
- ลำดับจริง R0 → R2 → R3 (R3a → R3b) → R1 → R4 → R5 → R6 [E.evaluateRun]
- R0 ระดับผลตอบกลับ: JSON · schema_version (v1.1 หรือ v1.0) · role_id · requirement_id ในชุด · ตอบ ≥ ครึ่ง · task_assessments ผิดรูปแบบไม่ทำให้ทั้งชุดใช้ไม่ได้ [E.ruleR0]
- รหัส R0: no_output, invalid_json, schema_mismatch, role_mismatch, incomplete_coverage [E.R0_CODES]
- R2: ตรงตัว → ยุบช่องว่าง → ซ่อมรูปคำ (LCS ของรากคำ ≥ 0.90 · ≥ 5 คำ) ใช้ข้อความจริงจากเรซูเม · quote_text_version normalized / whitespace_collapsed / repaired [E.ruleR2 · E.repairQuote · DEC-34 · DEC-52]
- R3a: ตัดคำต่อท้าย (stem) · คำพ้อง ≥ 4 ตัวอักษรปรากฏทั้งคำหรือรากคำ → ov = 1 · มิฉะนั้นสมการ ov · ผ่านเมื่อ ov ≥ θ = 0.15 [E.overlapScore · P.r3_stemming · P.theta]
- R3b: ไม่ผ่าน R3a → ผู้ตรวจหมุนเวียน A→B · B→C · C→A (ข้ามผู้ล้ม · ห้ามตรวจตัวเอง) · supports คงสถานะ · partially_supports ลดเป็น partially · unrelated → missing นับใน U · ไม่ตอบ → unverified ไม่นับใน R1 และไม่นับใน U [E.collectClaims · E.voteFor · DEC-51]
- R1 ระดับข้อกำหนด: ≥ 2 เสียงตรงกัน (ไม่นับ unverified) · m < 2 ทั้งรอบ abstained (min_usable_models = 2) [E.aggregate]
- ลำดับสำรองเมื่อเสมอ missing → partially → evidenced (ไม่เกิดเมื่อ 3 โมเดล) [E.TIE_ORDER]
- R4 บันทึกสัดส่วนความเห็นตรงกัน ไม่ปฏิเสธ [E.aggregate agreement_level]
- R5: ใบรับรองในคลัง (L1 ผ่านตรวจของอาชีพ) พบในเรซูเม ไม่ใช่บรรทัดเตรียมสอบ → ข้อที่ยัง missing/abstained ได้ partially [E.credentialEvidence · DEC-54]
- R6: Essential Skill ที่เชื่อมกับกิจกรรม (O*NET F13) ซึ่งได้ evidenced จากโมเดลในอาชีพเดียวกัน → partially · evidence_source = linkage [E.applyFloors · DEC-54]
- หลักฐานที่แสดง: จากโมเดลที่ตรงข้อสรุปและผ่าน R2 · ov สูงสุด → quote สั้นกว่า → รหัสโมเดล · ระบุ evidence_source [E.aggregate]
- ดัชนี T (งาน Core 8 งาน · ไม่มีฐานขั้นต่ำ) และ H (เทคโนโลยี In Demand ที่พบทั้งคำ) รายงานแยกจาก R [E.evaluateRun · E.techMatch · DEC-55]
- ablation: R ภายใต้ R3 คำซ้ำอย่างเดียว / ไม่มี R3 / ไม่มีฐานขั้นต่ำ จากการเรียกชุดเดียวกัน [scores.ablation]
- ผลทดลองกับเรซูเมจริงของผู้วิจัย 3 ต.ค.: R19 = 10 · R15 = 11 · R3 คำซ้ำตัด 27/36 [docs/Gap_03OCT26.md · evidence/r3_gold/summary_03OCT26.json]
- PII นอก 4 รูปแบบยังอาจคงอยู่ [PDF 3.5.1]
- เล่มนี้บทที่ 1–3 ผลผู้เข้าร่วมเป็นแผน [Prompt_Report §3]

## F21 ชื่อรุ่น
- ข้อกำหนด `ONET31.0-IS68076026-v1.0` · คลัง `CORPUS_IS68076026-v1.5-01OCT26` · กฎ `RULES-IS68076026-v2.0` · prompt `analyst_v1.1` + `verifier_v1.0` [DEC-43 · DEC-51/53]
- engine `engine-2.0.0-03OCT26` · ชีต `sheets-v1.1-01OCT26` (+ role_task_decisions) · รายงาน `report-v2.0` [E.ENGINE_VERSION · S.schema_version]

## F22 เอกสารอ้างอิงที่ใช้ (ตรวจมีจริงใน Phase 3.4)
- Vaishampayan et al. 2025 NAACL Findings doi 10.18653/v1/2025.findings-naacl.270 [PDF รายการอ้างอิง · DEC-32]
- de Quadros et al. 2025 WEBIST [PDF รายการอ้างอิง · DEC-32]
- Ji et al. 2023 ACM CSUR doi 10.1145/3571730 [PDF รายการอ้างอิง · DEC-32]
- Rashkin et al. 2023 Computational Linguistics doi 10.1162/coli_a_00486 [PDF รายการอ้างอิง · DEC-32]
- O*NET 31.0 Database (onetcenter.org) [PDF รายการอ้างอิง · DEC-32]
- Smith 2007 Tesseract ICDAR [PDF รายการอ้างอิง · DEC-32]
- Google Cloud Document AI processors list [PDF รายการอ้างอิง · DEC-32]
- Min et al. 2023 FActScore EMNLP [PDF รายการอ้างอิง · DEC-32]
- Gao et al. 2023 RARR ACL [PDF รายการอ้างอิง · DEC-32]
- Wang et al. 2023 Self-consistency ICLR [PDF รายการอ้างอิง · DEC-32]
- Zheng et al. 2023 LLM-as-a-judge NeurIPS D&B [PDF รายการอ้างอิง · DEC-32]
- Magron et al. 2024 JOBSKAPE NLP4HR [PDF รายการอ้างอิง · DEC-32]
- Li et al. 2026 learning path KG survey Electronics doi 10.3390/electronics15010238 [PDF รายการอ้างอิง · DEC-32]
- Davis 1989 MIS Quarterly doi 10.2307/249008 [PDF รายการอ้างอิง · DEC-32]
- Hevner et al. 2004 MIS Quarterly doi 10.2307/25148625 [PDF รายการอ้างอิง · DEC-32]
- n8n Google credentials · Google Drive export MIME types [PDF รายการอ้างอิง · DEC-32]
- Cohen 1960 doi 10.1177/001316446002000104 · Landis & Koch 1977 doi 10.2307/2529310 [PDF รายการอ้างอิง · DEC-32]
- พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ราชกิจจานุเบกษา เล่ม 136 ตอน 69 ก [PDF รายการอ้างอิง · DEC-32]
