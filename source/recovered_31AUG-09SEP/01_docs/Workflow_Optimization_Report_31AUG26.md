# รายงานวิเคราะห์และปรับปรุง n8n Workflow

**งาน:** IS 68076026 · ดนุสรณ์ อนันตกาล · ITM KMITL
**วันที่:** 31 สิงหาคม 2026
**ของเดิม:** `archive/2026-08_n8n_legacy/N8N Flow Files/` 4 ไฟล์ · รวม 71 โหนด
**ของใหม่:** `06_workflows/` 3 ไฟล์ · รวม 44 โหนด · สร้างด้วย `05_scripts/build_workflows_31AUG26.py`

---

## 1. ผลการวิเคราะห์ของเดิม

| ไฟล์ | โหนด | สภาพ |
|---|---:|---|
| `WF1_Main_Pipeline.json` | 44 | monolith เส้นเดียว · Code 16 โหนด 422 บรรทัด · Sheets 11 โหนด · HTTP 6 |
| `WF2_Evaluation_Metrics.json` | 10 | คำนวณตัวชี้วัดแยกต่างหาก · Code 87 บรรทัด |
| `WFC_Corpus_Builder.json` | 15 | สร้าง corpus ด้วย LLM |
| `WF_ERR_Notifier.json` | 2 | แจ้งเตือน แต่ไม่ได้ผูกเป็น error workflow ของใคร |

### 🔴 ปัญหาเชิงระเบียบวิธี 3 ข้อ ที่ทำให้ของเดิมใช้ไม่ได้

**ข้อ 1 — ใช้ LLM เป็นผู้ตัดสินชั้น validation**

ลำดับโหนดจริงคือ `Rule Pre-Validation` → `Build Verifier Prompt` → **`Claude Sonnet 5 Verifier`** → `Finalize Validated Output` แปลว่าข้อสรุปสุดท้ายมาจากการเรียก `https://api.anthropic.com/v1/messages`

ขัดกับ RQ2 โดยตรง ซึ่งกำหนดให้ cross-validation เป็นโค้ดล้วน และยังเป็นการวนกลับในตัวเอง เพราะในสถาปัตยกรรมปัจจุบัน Claude Sonnet 5 คือ analyst B — โมเดลเดียวกันทั้งเสนอและตัดสิน ตัวเลข hallucination rate ที่ได้จึงตีความไม่ได้

**ข้อ 2 — เป็น monolith แยกทดสอบไม่ได้**

44 โหนดอยู่ในไฟล์เดียวเป็นเส้นตรง ขณะที่ §3.5.3 กำหนดว่าต้องทดสอบกฎ validation แยกจาก pipeline ได้ เมื่อแยกไม่ได้ก็เขียน unit test ของกฎ R0–R3 ไม่ได้ และต้องรัน pipeline ทั้งเส้น (เสียค่า API ทุกครั้ง) เพื่อทดสอบตรรกะบรรทัดเดียว

**ข้อ 3 — เก็บผลดิบไม่ครบ เงื่อนไขการทดลองจึงคำนวณย้อนหลังไม่ได้**

ของเดิมมีโหนด `Log Model Results` แต่ไม่ได้ผลิตแถวของ `condition_result` และไม่มีคอลัมน์ ablation ทำให้เงื่อนไข C1–C3 (baseline เดี่ยว) และ C7–C9 (ablation ladder) ต้องรันใหม่ทั้งหมด — ทั้งที่ทั้งเจ็ดเงื่อนไขคำนวณจาก raw response ชุดเดียวกันได้

### ปัญหารองที่พบ

| # | ปัญหา |
|---|---|
| 1 | ชื่อโมเดลล้าสมัยทั้งหมด — `gpt-5.5`, `gemini-3.1` และ endpoint `.../models/gemini-3.1` |
| 2 | ไม่มีกฎ R0 (ขอบเขต) ตาม DEC-08 · ไม่มี R3 (THETA) · ไม่มี `exclusion_reason` → คำนวณ recall cost ไม่ได้ |
| 3 | ไม่มีการคำนวณ Readiness และ `weight_share_of_pool` |
| 4 | อ่าน corpus จากสองแท็บ `Read Course Master` + `Read Cert Master` ซึ่งเป็น schema ก่อน `recommendation_master` |
| 5 | `Match Recommendations` 29 บรรทัด ไม่มีการตรวจ whitelist ซ้ำ ไม่มีการบังคับ mode และไม่มีการตัดตามความจุการเรียน |
| 6 | ไม่มีหน้าโปร่งใสของบทบาท proxy · ไม่มี reference check ของรายงาน |
| 7 | `WF_ERR_Notifier` ไม่ได้ผูกเป็น `errorWorkflow` ของ workflow ใดเลย |
| 8 | ค่าคงที่ฝังกระจายใน Code 16 โหนด แก้ที่เดียวไม่ได้ |
| 9 | Sheets 11 โหนดต่อกันเป็นลูกโซ่ ทุกโหนดคือหนึ่ง round trip |

---

## 2. สิ่งที่ทำในฉบับใหม่

### 2.1 แยกเป็นสองไฟล์ตามหน้าที่

`WF_SUB_GapEngine` (15 โหนด) คือแกนงานวิจัย เรียกแยกได้ ทดสอบแยกได้ ส่วน `WF_Main` (25 โหนด) คือ pipeline ที่เหลือ และ `WF_ERR` (4 โหนด) ผูกเป็น `errorWorkflow` ของทั้งสองตัวแล้วผ่าน `settings.errorWorkflow`

### 2.2 ถอด LLM ออกจากชั้นตัดสิน

โหนด `Deterministic Validation (R0–R4)` เป็น Code node เดียวที่ทำครบทุกอย่างด้วยโค้ดล้วน

| กฎ | ทำอะไร |
|---|---|
| **R0** | `requirement_id.startsWith('REQ-' + role_id + '-')` และต้องอยู่ในชุด 30 ที่ตรึงไว้ — ตัดออกก่อนนับเสียง ทำให้ out-of-scope rate ของกรอบเป็น 0 โดยโครงสร้าง (DEC-08) |
| **R1** | เสียงข้างมาก แยกสถานะ `EX-R1-TIED` ออกจาก `EX-R1-NO-MAJORITY` |
| **R2** | ตรวจ evidence quote แบบ substring กับข้อความนิรนาม |
| **R3** | `overlap ≥ THETA OR alias_hit` · overlap หารด้วย `min()` · token ผ่าน light stemmer |
| **R4** | tier `high` เมื่อ 3/3 และไม่มีโมเดลล้ม · `medium` เมื่อ 2/3 หรือมีโมเดลล้ม (CFG-08) |

ทุกรายการที่ถูกตัดได้รหัสจาก `enum_exclusion_reason` จึงจัดกลุ่มย้อนหลังเพื่อคำนวณ recall cost ได้

### 2.3 เรียก analyst ชุดเดียว ได้ครบ 7 มุมมอง

โหนดเดียวกันผลิตพร้อมกัน — baseline `glm_only` `sonnet_only` `gemini_only` · `framework` · ablation `A1` `A2` `A3` (คอลัมน์ในทุกแถวของ `gap_result`) ประหยัดค่า API ราว 4 เท่าเทียบกับการรันแยกเงื่อนไข และรับประกันว่าทุกเงื่อนไขได้อินพุตเดียวกันตามที่ §3.8 บังคับ

### 2.4 ค่าคงที่รวมศูนย์

โหนด `Init Submission & Gate` ฉีดอ็อบเจ็กต์ `config` เข้า item เดียวจบ (THETA · evidence ratio ขั้นต่ำ · ความหนาแน่นข้อความ · 4.33 · rules_version) โหนดปลายทางอ่านจาก `j.config` ทั้งหมด ต้องการเปลี่ยนค่าให้แก้ที่ `config_master` แล้วซิงก์ที่เดียว

### 2.5 ตัวกรอง corpus ตาม DEC-11

`Pre-filter Corpus & Build Rank Prompt` รับเฉพาะแถวที่ `verification_status = verified` และตรงกับ mode ที่ผู้เข้าร่วมเลือก แล้วส่งเฉพาะ `item_id` ที่อนุญาตให้โมเดลจัดอันดับ · หลังโมเดลตอบ `Rank Post-Validation & Pathway` ตรวจ whitelist ซ้ำ เติมรายการที่ตกหล่นด้วยลำดับ deterministic ตัดตามความจุการเรียน และย้ายส่วนเกินไป deferred พร้อมเหตุผล

---

## 3. เทียบตัวเลข

| | เดิม | ใหม่ | ผล |
|---|---:|---:|---|
| จำนวนโหนดรวม | 71 | **44** | −38% |
| ไฟล์ workflow | 4 | 3 | corpus builder ไม่ต้องมีแล้ว (corpus ตรึงแล้ว) · WF2 แทนด้วย `condition_result` + `analysis_v5.py` |
| โหนดในเส้นทางหลัก | 44 | 25 | −43% |
| LLM ในชั้นตัดสิน | **1 (Claude Verifier)** | **0** | ปิดช่องที่ขัด RQ2 |
| กฎ validation ที่บังคับใช้ | 2 (agreement + evidence) | **5 (R0–R4)** | ครบตาม §3.5.4 |
| เงื่อนไขที่ได้จากการเรียก API หนึ่งชุด | 1 | **7** | ประหยัดค่า API ราว 4 เท่า |
| โหนด Google Sheets ในเส้นหลัก | 11 | 6 | −45% |
| บรรทัด JavaScript รวม | 588 | **423** | −28% ทั้งที่ตรรกะครบกว่าเดิมมาก |
| ผูก error workflow | ไม่ผูก | ผูกทั้ง 2 ตัว | — |

**ตรวจแล้ว** — โครงสร้างผ่าน (ไม่มีปลายทางที่ไม่มีอยู่จริง ไม่มีโหนดลอย) และไวยากรณ์ JavaScript ผ่านทั้ง 16 โหนด ด้วย `node --check`

---

## 4. ข้อจำกัดที่ต้องรู้

1. **`typeVersion` ของทุกโหนดต้องยืนยันกับ n8n instance จริง** — ตัวเลขที่ใส่ไว้อิงรุ่นที่ใช้กันทั่วไป ถ้า instance เป็นรุ่นอื่นต้องปรับ
2. **prompt ยังเป็นร่าง** ฝังอยู่ใน Code node · ต้องย้ายไป `prompts/` แล้วตรึงพร้อม `prompt_version` และ SHA-256 หลัง pilot
3. **ยังไม่ได้ทดสอบกับ API จริง** — ต้องเขียน unit test ของ R0–R3 ด้วย fixture ก่อน แล้วจึงทดสอบ end-to-end
4. **ไม่ได้ทำ `duplicate_log` และ `consent_log` แยก** — รวมไว้ใน `audit_log` และ `pipeline_run` เพื่อลดโหนด ถ้าคณะกรรมการจริยธรรมต้องการแยก ให้เพิ่มโหนด Sheets อีก 2 ตัว
5. **ไฟล์ฉบับ 28 ส.ค. ใน Project (`WF_Main_28AUG26.json` 42 โหนด · `WF_SUB_GapEngine_28AUG26.json` 22 โหนด) ยังไม่ถูกดาวน์โหลดลงเครื่อง** จึงยังไม่ได้เทียบทีละโหนด — ควรดึงลงมาเทียบก่อนทิ้งของเดิม เผื่อมีตรรกะบางส่วนที่ฉบับนี้ยังไม่ครอบคลุม
