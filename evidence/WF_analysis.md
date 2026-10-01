# WF_analysis · รวมระบบเป็น workflow เดียว `WF_IS68076026` (Phase 2 · DEC-42)

> 1 ต.ค. 2569 · ที่มา: ชุด 5 workflow (DEC-30, `archive/01OCT26/workflows_5wf_DEC-30/`) · `WF_Final_IS` 59 โหนด (DEC-37, `archive/01OCT26/WF_Final_IS_DEC-37/`) · `demo/WF_Demo.json` 28 โหนด (DEC-39 ใช้เป็นแบบการจัดวางเท่านั้น)
> ผล: `workflows/WF_IS68076026.json` สร้างด้วย `node scripts/build_workflows.mjs` (ห้ามแก้ JSON ด้วยมือ) · ตรวจด้วย `node scripts/validate_workflows.mjs` · เทสต์ `tests/single_workflow.test.mjs`
> จำนวนโหนดและช่วงอ่านจาก `workflows/manifest.json` (ไม่พิมพ์ซ้ำที่นี่)

## 1 · วิเคราะห์ของเดิม

| หน้าที่ | อยู่ในโหนดใด (ของเดิม) | ปัญหาที่พบ | ทำอย่างไรใน workflow ใหม่ |
|---|---|---|---|
| ส่งงานข้ามขั้น | 5wf: Execute Workflow 3 จุด (Call GapEngine/Decide/Deliver) | ตั้งค่า workflowId · error workflow · ลำดับนำเข้า · credential ต่อไฟล์ สับสน (DEC-37) | ไม่มีการเรียกข้าม workflow · ตัวตรวจไม่ผ่านถ้าพบ executeWorkflow |
| วนทีละงาน | 5wf: Execute Workflow mode=each · Final: Loop Over Runs | ฟอร์มหลายแถวใน poll เดียว (บั๊ก B6) | Loop Over Requests (batch 1) วนกลับจาก Mark Run Delivered · ตรวจด้วย dominator ว่าไม่อ้างค่าของรอบก่อน |
| IF รับค่า boolean | Parse & Validate → IF | IF เทียบ boolean กับสตริง (บั๊ก B1) | Validate Form Rows ส่ง boolean · IF strict/singleValue (ตัวตรวจ) |
| ส่ง requirements ถึงขั้นตัดสิน | Assemble Model Results → Decide | Decide ไม่ได้ requirements (บั๊ก B2) | Collect Model Results ส่ง requirements · Apply Rules R0-R4 หยุดถ้าไม่ครบ 30 |
| สิทธิ์ Google | Sheets / Drive download | ไม่ใช้ service account (บั๊ก B3) · service account ไม่มีโควตา Drive (บั๊ก B10) | Sheets/Download ใช้ service account · อัปโหลดใช้ Drive OAuth2 ของผู้วิจัย (ตัวตรวจ) |
| คำพ้องถึง R3 | ref_requirements → engine | คำพ้องไม่ถึง R3 ผลต่างจาก run_local (บั๊ก B4) | อ่าน element_aliases จากแท็บ · เทสต์ A/B/C เทียบ engine |
| fan-in | Prepare Text, Record Delivery | โหนดหลายขาเข้ารันซ้ำ เรียกโมเดล/ส่งอีเมลซ้ำ (บั๊ก B5) | Merge หรือประกาศ exclusive_fan_in ทุกจุด (ตัวตรวจ) |
| แนบ PDF ในอีเมล | Export PDF → Send Email | binary หลุด (บั๊ก B7) | Send Report Email รับจาก Export Report PDF โดยตรง property data (ตัวตรวจ) |
| สรุปผลการส่ง | Record Delivery | อ่านจาก error branch (บั๊ก B8) · Upload PDF ล้มแต่ Send Email สำเร็จ → Record Delivery ทำงานสองครั้ง (DEC-37 ข้อ ข) | Collect Delivery Result → Build Delivery Record (executeOnce อ่านจาก $input) → Record Delivery ครั้งเดียว |
| อัปโหลดล้มแต่อีเมลสำเร็จ | final_deliver_record.js | WF_Final_IS บันทึกเป็น failed ทั้งที่ผู้เข้าร่วมได้อีเมลพร้อม PDF แล้ว | ใหม่: delivered + email_status sent + error_code pdf_upload_failed |
| error output | HTTP / Drive / Gmail | ตั้ง continueErrorOutput แต่ไม่ต่อ (บั๊ก B9) | ตัวตรวจไม่ผ่านถ้าไม่ต่อ |
| หา run_id ตอนล้ม | WF_Error / Classify Error | ไม่ได้ run_id (บั๊ก B11) · execution เดียวมีหลายงาน | Classify Error อ่าน [run_id=…] ในข้อความก่อน แล้วใช้งานล่าสุดของ Loop Over Requests |
| โมเดลล้มครบสามตัว | Decide → Findings Rows → Decision Rows (5wf) | findings ว่างทำให้สาขาหลักหยุดก่อนอัปเดต runs (DEC-37 ข้อ ก) | Build Finding Rows เป็นสาขาข้าง · สาขาหลักเดินต่อถึงรายงาน (ทุกข้อ abstained · R = N/A) |
| อ่านข้อความ | OCR Document AI ทุกไฟล์ (5wf/Final) · WF_Demo ใช้ Extract PDF Text ก่อน | ไฟล์ที่มีชั้นข้อความก็ส่ง OCR ทุกครั้ง เสียเวลาและค่าใช้จ่าย | Extract Text Layer → Choose Text Source (text_layer_min_chars ใน config) → Has Text Layer? → Document AI → สำรอง OCR ในเครื่อง |
| ตัดสินและจัดแผนในโหนดเดียว | Decide & Plan | อ่านยาก แยกช่วง "ตรวจและรวมผล" กับ "จัดแผน" ไม่ได้ | Apply Rules R0-R4 (ช่วง 4) และ Build Learning Plan (ช่วง 5) ใช้ engine.evaluateRun / buildPlan / planRowsFrom |
| การจัดวาง | 5 sticky note ตาม workflow เดิม | ชื่อโหนดไม่สม่ำเสมอ อ่านตามลำดับงานยาก | แบบ WF_Demo: ซ้ายไปขวา 7 ช่วง · ชื่อโหนดกริยา + กรรม (ตัวตรวจ) |
| ค่าควบคุม | CFG ฝังตอน build | ถ้าแก้ config แล้วไม่ build ใหม่ ค่าในโหนดเก่า | ตัวตรวจเทียบ CFG ทุก Code node กับ config/*.json ปัจจุบัน |
| WF_Demo | demo/ (Gemini โมเดลเดียว, R0·R2·R3) | ไม่ใช่ระบบวิจัย ไม่มี R1/R4 | ใช้เฉพาะแนวการจัดวาง · ไม่อยู่ใน workflows/ และไม่อยู่ในเล่ม (DEC-44) |

## 2 · Traceability ภาคผนวก ข → โหนด → เทสต์

> ตรวจอัตโนมัติด้วย `node scripts/check_traceability.mjs`: ทุกแถวต้องมีครบสามช่อง · ทุกชื่อโหนดในคอลัมน์โหนดต้องมีใน workflow · ทุกเทสต์ (ขึ้นต้น `T:`) ต้องตรงกับชื่อ test ใน `tests/*.test.mjs` · `V:` = กฎใน `validateSingle`

| ช่วง | ข้อกำหนด (ภาคผนวก ข) | โหนด | เทสต์ที่ยืนยัน |
|---|---|---|---|
| รับข้อมูล | ตรวจคำตอบใหม่จาก Google Forms | Watch Form Responses | V:ต้องมี Google Sheets Trigger 1 โหนด · T:ฟอร์มสองแถวในการ poll เดียว |
| รับข้อมูล | กันงานซ้ำ | Read Runs Sheet · Validate Form Rows · Is New Request? | T:ฟอร์มสองแถวในการ poll เดียว · T:B6 + B1 |
| รับข้อมูล | ตรวจความยินยอม | Validate Form Rows · Is Input Valid? · Log Skipped Request | T:ฟอร์มสองแถวในการ poll เดียว · T:parseFormRow + validateIntake |
| รับข้อมูล | ตรวจไฟล์ PDF ≤ 10 MB ≤ 5 หน้า | Download Resume · Check PDF File | T:ไฟล์เกินขนาด / เกินหน้า / ไม่ใช่ PDF |
| รับข้อมูล | สร้างแถว runs | Loop Over Requests · Create Run Row | T:ฟอร์มสองแถวในการ poll เดียว · V:ขา loop (output 1) ต้องไป Create Run Row |
| อ่านและปิดบัง | อ่านข้อความ (text layer หรือ Document AI) | Extract Text Layer · Choose Text Source · Has Text Layer? · Run Document AI OCR · Run Local OCR | T:อ่านข้อความ: มีชั้นข้อความ |
| อ่านและปิดบัง | ปิดบังข้อมูลระบุตัว | Mask Personal Data | T:อ่านข้อความ: มีชั้นข้อความ · T:maskPII |
| อ่านและปิดบัง | เก็บข้อความหลังปิดบังเป็นไฟล์ใน Drive ส่วนตัว | Mask Personal Data · Save Masked Text | T:อ่านข้อความ: มีชั้นข้อความ |
| อ่านและปิดบัง | บันทึก sha256 ของข้อความหลังปิดบัง | Mask Personal Data · Record OCR Result | T:อ่านข้อความ: มีชั้นข้อความ |
| วิเคราะห์ | โหลดข้อกำหนด 30 ข้อของอาชีพที่เลือก | Start Analysis · Load Requirements · Build Prompt | T:เรซูเมสังเคราะห์ A B C |
| วิเคราะห์ | ประกอบ prompt analyst_v1.0 | Build Prompt | T:เรซูเมสังเคราะห์ A B C · T:buildPrompt |
| วิเคราะห์ | เรียกโมเดล A/B/C แยกกัน | Call Model A · Call Model B · Call Model C · Wait for All Models · Collect Model Results | T:เรซูเมสังเคราะห์ A B C |
| วิเคราะห์ | เรียกซ้ำ ≤ 2 ครั้งเฉพาะ 429/หมดเวลา | Call Model A · Call Model B · Call Model C | T:โมเดลล้มครบสามตัว · T:callModelWithRetry |
| วิเคราะห์ | บันทึก model_calls ทุกครั้ง | Build Model Call Rows · Record Model Calls · Log Models Called | T:โมเดลล้มครบสามตัว |
| ตรวจและรวมผล | R0 → R2 → R3 (θ = 0.15) → R1 → R4 | Start Evidence Check · Apply Rules R0-R4 | T:เรซูเมสังเคราะห์ A B C · T:R0 |
| ตรวจและรวมผล | คำนวณคะแนนตามสมการ | Apply Rules R0-R4 · Build Decision Rows · Record Decisions | T:เรซูเมสังเคราะห์ A B C |
| ตรวจและรวมผล | โมเดลล้มครบสามตัวต้องไปสาขาข้างและปิดงานได้ | Build Finding Rows · Record Findings | T:โมเดลล้มครบสามตัว |
| จัดแผน | กำหนดช่องว่าง · Hmax จากเดือนและชั่วโมง | Build Learning Plan | T:เรซูเมสังเคราะห์ A B C · T:สมการ 3.7: Hmax |
| จัดแผน | เลือกรายการจาก mapping L1 ที่ผ่าน review ตามวิธีที่เลือกใน Phase 1 | Load Corpus · Load Mappings · Build Learning Plan | T:เรซูเมสังเคราะห์ A B C · T:plan_strategy: |
| จัดแผน | รองรับ course_only / certification_only / both | Build Learning Plan · Build Plan Rows · Record Plan Items | T:ใช้เฉพาะ L1 + สถานะผ่านตรวจ + verified + โหมดตรง |
| จัดแผน | อัปเดต runs เป็น ready และตรึงชุดข้อมูลรายงาน | Mark Run Ready · Log Decision · Freeze Report Payload | T:เรซูเมสังเคราะห์ A B C |
| ส่งรายงาน | สร้างรายงานภาษาไทย | Start Delivery · Read Deliveries Sheet · Render Thai Report | T:เรซูเมสังเคราะห์ A B C · T:รายงาน HTML: ห้าส่วน |
| ส่งรายงาน | PDF · อัปโหลด Drive | Upload Report as Google Doc · Export Report PDF · Upload Report PDF | T:ส่งรายงาน: อัปโหลด PDF ล้มแต่อีเมลส่งสำเร็จ · V:Drive API ต้องใช้ googleDriveOAuth2Api |
| ส่งรายงาน | ส่ง Gmail รายบุคคล | Send Report Email · Wait for Upload and Email | T:ส่งรายงาน: อัปโหลด PDF ล้มแต่อีเมลส่งสำเร็จ · V:Send Report Email ต้องรับข้อมูลจาก Export Report PDF |
| ส่งรายงาน | บันทึกการส่งครั้งเดียวแม้บางขั้นล้ม | Is Not Yet Delivered? · Collect Delivery Result · Build Delivery Record · Record Delivery · Mark Run Delivered | T:ส่งรายงาน: อัปโหลด PDF ล้มแต่อีเมลส่งสำเร็จ |
| ส่งรายงาน | ลบไฟล์ชั่วคราว | Delete Temp Doc | T:ส่งรายงาน: อัปโหลด PDF ล้มแต่อีเมลส่งสำเร็จ |
| บันทึกและข้อผิดพลาด | อัปเดต runs.stage ทุกช่วง (running → ready → delivered/failed) | Create Run Row · Mark Run Ready · Mark Run Delivered · Mark Run Failed | T:เรซูเมสังเคราะห์ A B C · T:ล้มกลางลูป · T:runs.stage: running |
| บันทึกและข้อผิดพลาด | Error Trigger ในไฟล์เดียวกัน | Catch Workflow Error · Get Failed Execution | T:ล้มกลางลูป · V:ต้องมี Error Trigger 1 โหนด |
| บันทึกและข้อผิดพลาด | ระบุ run_id | Classify Error | T:ล้มกลางลูป |
| บันทึกและข้อผิดพลาด | ทำเครื่องหมายงานล้มเหลว | Mark Run Failed · Log Error | T:ล้มกลางลูป |
| บันทึกและข้อผิดพลาด | แจ้งผู้วิจัย | Notify Researcher | T:ล้มกลางลูป |
| บันทึกและข้อผิดพลาด | บันทึก freezeReport.versions ทุกฉบับ | Build Learning Plan · Freeze Report Payload | T:เรซูเมสังเคราะห์ A B C |

## 3 · สิ่งที่ยังต้องทดสอบใน n8n จริง (👤🤖 Phase 2.7)

⏳ รอข้อมูล: ผลนำเข้า `WF_IS68076026.json` ใน n8n 2.39.9 กับบริการจำลอง (sandbox ของ Claude ไม่ใช่ n8n) · ขั้นตอนใน `evidence/n8n_test_01OCT26.md`
