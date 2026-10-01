# n8n Workflows — ฉบับปรับปรุง 31 สิงหาคม 2026

**สร้างจาก:** `05_scripts/build_workflows_31AUG26.py` (ทำซ้ำได้ · แก้ที่สคริปต์แล้วรันใหม่ ห้ามแก้ JSON ด้วยมือ)
**แทนที่:** ชุดเดิม 4 ไฟล์ใน `archive/2026-08_n8n_legacy/`
**ตรวจด้วย:** `python3 05_scripts/check_workflows_31AUG26.py`

| ไฟล์ | โหนด | หน้าที่ |
|---|---:|---|
| `WF_SUB_GapEngine_31AUG26.json` | 15 | **แกนงานวิจัย** — analyst 3 ตัว + validation R0–R4 ด้วยโค้ดล้วน + readiness + ablation + เงื่อนไข C1–C4 |
| `WF_Main_31AUG26.json` | 25 | intake → parse → เรียก sub → rank → pathway → report |
| `WF_ERR_Notifier_31AUG26.json` | 4 | error workflow กลาง แปลงข้อความผิดพลาดเป็นรหัสตาม `enum_error_type` |

---

## ลำดับการติดตั้ง

1. import `WF_ERR_Notifier_31AUG26.json` → คัดลอก workflow ID
2. import `WF_SUB_GapEngine_31AUG26.json` → คัดลอก workflow ID
3. import `WF_Main_31AUG26.json`
4. แทนค่า placeholder ทั้งหมด (รันตัวตรวจเพื่อดูรายการ)

| Placeholder | ใส่อะไร |
|---|---|
| `__SET_GOOGLE_SHEET_ID__` | Spreadsheet ID (ทุกโหนด Google Sheets) |
| `__SET_SUB_GAPENGINE_WORKFLOW_ID__` | ID จากข้อ 2 |
| `__SET_ERROR_WORKFLOW_ID__` | ID จากข้อ 1 (อยู่ใน `settings.errorWorkflow` ของทั้งสองตัว) |
| `__SET_GCP_PROJECT__` · `__SET_PROCESSOR_ID__` | Document AI |
| `__SET_RESEARCHER_EMAIL__` | อีเมลผู้วิจัย |

**Credential** — Header Auth 5 ชุด: `Authorization: Bearer <OPENAI>` · `x-api-key: <ANTHROPIC>` · `x-goog-api-key: <GOOGLE_AI>` · `Authorization: Bearer <ZHIPU>` · `Authorization: Bearer <GCP_TOKEN>` · บวก Google Sheets OAuth2 และ Gmail OAuth2

**Google Sheets** ต้องมี 8 แท็บ — อ่าน: `onet_requirements` (600 แถว) · `recommendation_master` (431 แถว) · `proxy_mapping_log` (5 แถว) · เขียน: `pipeline_run` · `gap_result` · `condition_result` · `recommendation_result` · `model_call_log` · `audit_log` (หัวคอลัมน์อยู่ในฟิลด์ `_note` ของแต่ละโหนด)

---

## สิ่งที่ต้องรู้ก่อนใช้

1. **โมเดลไม่เคยเป็นผู้ตัดสิน** — ชั้น validation เป็น Code node เดียวล้วน ๆ ไม่มี LLM ชุดเดิมมีโหนด `Claude Sonnet 5 Verifier` ซึ่งขัดกับ RQ2 โดยตรง และถูกถอดออกแล้ว
2. **เรียก analyst ชุดเดียว ได้ครบ 7 มุมมอง** — baseline 3 ตัว + framework + ablation 3 ระดับ คำนวณจาก raw response ชุดเดียวกัน ประหยัดค่า API ราว 4 เท่า และตัดความผันแปรระหว่างการเรียกออกจากการเปรียบเทียบ
3. **ตัวกรอง corpus รับเฉพาะ `verification_status = verified`** ตาม DEC-11 และ GATE-C
4. **ค่าคงที่ทุกตัวมาจาก `config` ที่ฉีดในโหนด `Init Submission & Gate`** ไม่ฝังกระจายตามโหนด — เปลี่ยนค่าให้แก้ที่ `config_master` แล้วอัปเดตที่เดียว
5. **รับเฉพาะ PDF** (CFG-21) · **PII ปิดบังก่อนทุก LLM call** ตาม `pii_masking_rules` โดยเลขบัตรประชาชนแทนที่ก่อนเบอร์โทรเสมอ
6. `Merge Analyst Outputs` ใช้ combineByPosition และรับ 3 อินพุต — **ห้ามวาง Merge ไว้บนกิ่งของ IF**

---

## งานที่เหลือก่อนรันจริง

- [ ] แทนค่า placeholder 5 ตัว และผูก credential
- [ ] ยืนยัน `typeVersion` ของทุกโหนดกับ n8n instance จริง (ต้อง ≥ 1.95.1 เพื่อให้มี Evaluations)
- [ ] เขียน prompt จริงทั้ง 6 ตัวลง `prompts/` แล้วแทนที่ prompt ที่ฝังอยู่ในโหนด Code
- [ ] เขียน unit test ของกฎ R0–R3 ด้วย fixture 10 เคส **ก่อน** ต่อ API จริง
- [ ] ทดสอบ end-to-end 3 รอบด้วยเรซูเมของผู้วิจัยเอง ต่างบทบาท ต่าง mode ต่าง timeline
