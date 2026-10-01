# ชุดข้อมูลงานวิจัยฉบับสมบูรณ์ + คู่มือนำเข้า Google Sheets

**แพ็กเกจ:** `SHEETS-IS68076026-v1.2-01SEP26` · **ไฟล์:** `IS68076026_ResearchData_01SEP26.xlsx`
**32 แท็บ · 141,715 เซลล์** · ครบทุกกลุ่มตาม SA v3 §5
**เวอร์ชันข้อมูล:** O\*NET `ONET31.0-IS68076026-v1.0` (ตรึงแล้ว ไม่เปลี่ยน) · corpus `CORPUS-IS68076026-v1.3-01SEP26` · rules `RULES-IS68076026-v1.0-31AUG26`

---

## 1 · สถานะหลังรอบแก้ 1 กันยายน

รอบนี้แก้ปัญหา Gap coverage ตาม **DEC-16** และความไม่ตรงกันของ temperature ตาม **DEC-17** รายละเอียดเต็มพร้อมวิธีย้อนกลับอยู่ใน `01_docs/DECISIONS_31AUG26.md`

| ตัวชี้วัด | ก่อนแก้ (v1.2) | **หลังแก้ (v1.3)** |
|---|---:|---:|
| จำนวนรายการใน corpus | 431 | **499** (+68) |
| mapping | 6,543 | **6,780** (+237) |
| **ครอบคลุม verified + L1 — ที่ Workflow F ใช้จริง** | 364/600 · 60.7% | **479/600 · 79.8%** |
| ครอบคลุม verified ทุกชั้น | 592/600 · 98.7% | **599/600 · 99.8%** |
| ช่องว่างที่เหลือ | 236 คู่ | **121 คู่ ใน 23 element** |
| ตัวตรวจ corpus 18 ข้อ | ค้าง CHK-06 | **ผ่าน 17 ข้อ · เหลือ CHK-17 ที่ต้องใช้คน** |
| หัวคอลัมน์ Sheets ตรงกับที่ n8n เขียน | ไม่เคยตรวจ | **ตรงครบทั้ง 6 แท็บ** |

### สิ่งที่แก้ไปแล้ว

**DEC-16 · ปิดช่องว่างชั้น L1 โดยไม่สร้างรายการใหม่**
เพิ่มคอลัมน์ `competency_ids_l1` ทำให้ DEC-11 บังคับใช้ได้จริง แล้วขยาย 68 แถวจากรายการที่ `verified` แล้ว คงชื่อ ผู้ให้บริการ URL ชั่วโมง ค่าใช้จ่าย และรหัสสอบเดิมทุกค่า **ไม่มี URL ที่เดาขึ้นแม้แถวเดียว** เกณฑ์ความเหมาะสมมาจากการที่ผู้วิจัยเคยจัดรายการนั้นให้ข้ามบทบาทอยู่แล้ว ไม่ใช่วิจารณญาณของเครื่อง

**แก้โค้ด pre-filter ให้ทำตามที่คอมเมนต์บอก** — เดิมโหนด `Pre-filter Corpus & Build Rank Prompt` เขียนว่าใช้ DEC-11 แล้ว แต่กรองแค่ `verification_status` ตอนนี้ใช้ `competency_ids_l1` จริง และ `pipeline_run` แยกเป็น `gap_coverage_l1` กับ `gap_coverage_any` ตามที่ §3.8 บังคับให้รายงานสองค่าเสมอ

**DEC-17 · แยก temperature ของ parse ออกจาก report** — `CFG-12 PARSE_TEMPERATURE = 0` และ `CFG-12b REPORT_TEMPERATURE = 0.2` · `model_registry` MDL-02 → 0 ตรงกับ workflow แล้ว

**เติมคอลัมน์กันเพดาน 50,000 ตัวอักษรของ Google Sheets** — `raw_response_sha256` · `raw_response_truncated` · `report_markdown_sha256` และเพิ่ม `reasoning_tokens` ที่ PROTOCOL-01 ต้องใช้

---

## 2 · ช่องว่างที่เหลือ 121 คู่ — ทำไมไม่ปิดด้วยวิธีเดียวกัน

รายการเดียวใน corpus ที่ถูก L1-tag ให้ element เหล่านี้เป็นคอร์สเทคนิคเฉพาะสาย — `Critical Thinking` มีแต่ Data Structures and Algorithms กับ CS50 · `English Language` มีแต่ ISTQB และ CompTIA Security+ (เพราะข้อสอบเป็นภาษาอังกฤษ) **การขยายรายการเหล่านี้ข้ามบทบาทจะให้คำแนะนำที่แย่กว่าการบอกว่าไม่มีรายการ** ซึ่งขัดกับเจตนาทั้งหมดของงานวิจัยนี้ จึงหยุดไว้แล้วบันทึกเป็นคำขอแทน

แท็บ `corpus_gap_request` (และ `03_corpus/corpus_gap_request_01SEP26.csv`) เรียงตามน้ำหนักที่เสียไป พร้อมช่อง `item_needed` · `provider` · `source_url` · `estimated_hours` · `verified_date` ให้กรอก

| element | บทบาทที่ขาด | น้ำหนักรวมที่เสียไป |
|---|---:|---:|
| English Language | 15 | 47.1% |
| Getting Information | 14 | 52.5% |
| Updating and Using Relevant Knowledge | 14 | 50.5% |
| Identifying Objects, Actions, and Events | 13 | 44.7% |
| Organizing, Planning, and Prioritizing Work | 8 | 25.3% |
| Processing Information | 7 | 24.0% |

**สี่ element แรกปิดได้ด้วยรายการจริงเพียง 4 รายการ** เช่น คอร์สภาษาอังกฤษเชิงธุรกิจหนึ่งตัวปิด English Language ได้ครบ 15 บทบาททันที และจะดันความครอบคลุมขึ้นไปราว 89% ใช้เวลาหาและยืนยันราว 2 ชั่วโมง

---

## 3 · สิ่งที่อยู่ในสมุด

| กลุ่ม | แท็บ (แถว) |
|---|---|
| **DatasetMaster** | `onet_requirements` (600) · `element_aliases` (61) · `onet_requirements_excluded` (354) · `role_map` (20) |
| **CorpusMaster** | `recommendation_master` (499) · `item_competency_map` (6,780) · `corpus_build_errors` (0) · `corpus_gap_request` (23) |
| **MasterData** | `model_registry` (7) · `prompt_registry` (6) · `config_master` (24) · `pii_masking_rules` (10) · `proxy_mapping_log` (5) · `mode_rules` (3) · `timeline_master` (4) · `conditions_master` (10) · `metric_registry` (14) · `enum_exclusion_reason` (7) · `enum_error_type` (13) · `provider_policy_register` (5) |
| **PipelineData** | `pipeline_run` · `gap_result` · `condition_result` · `recommendation_result` · `model_call_log` · `audit_log` — เปล่า มีแต่หัวคอลัมน์ |
| **ResearchEval** | `ground_truth` · `ground_truth_extraction` · `evaluation_metrics` — เปล่า มีแต่หัวคอลัมน์ |
| **Review** | `corpus_pending_verification` (36) · `alias_collision_review` (23) — สองงานที่ต้องทำด้วยมือก่อน FREEZE |

---

## 4 · ขั้นตอนนำเข้า

### 4.1 สร้าง Spreadsheet และตั้งค่าก่อน (5 นาที ห้ามข้าม)

1. **Google Drive** → สร้างโฟลเดอร์ `IS68076026_Research`
2. ลาก **`IS68076026_ResearchData_01SEP26.xlsx`** เข้าไป
3. **คลิกขวาที่ไฟล์ → Open with → Google Sheets** — อย่าดับเบิลคลิก เพราะจะเปิดเป็นตัวอย่างแบบอ่านอย่างเดียว
4. **File → Save as Google Sheets** จะได้ไฟล์ใหม่ที่ไม่มี `.xlsx` ต่อท้าย **ไฟล์ใหม่นี้คือของจริง**
5. เปลี่ยนชื่อเป็น `IS68076026_ResearchData_v1`
6. ย้าย `.xlsx` ต้นฉบับเข้าโฟลเดอร์ย่อย `_import_source/` เก็บเป็นหลักฐาน แต่ต้องไม่วางปนกับตัวจริง
7. **File → Settings** ตั้งสามค่านี้

| ค่า | ต้องตั้งเป็น | ทำไม |
|---|---|---|
| **Locale** | **United States** | ไม่ใช่ Thailand — locale ไทยตีความวันที่เป็น `dd/mm/yyyy` ส่วน n8n ส่ง ISO 8601 มา ถ้าไม่ตรง `consent_at` `access_date` `completed_at` จะเพี้ยนโดยไม่ error · ตัวเลขไม่กระทบ ทั้งสอง locale ใช้จุดเป็นทศนิยมเหมือนกัน |
| **Time zone** | **(GMT+07:00) Bangkok** | ให้เวลาที่ Sheets เติมเองตรงกับเวลาที่ผู้เข้าร่วมส่งจริง |
| **Recalculation** | **On change** | ไม่ให้สูตรตรวจสอบในข้อ 4.2 คำนวณค้าง |

### 4.2 ตรวจหลังนำเข้า

สร้างแท็บ `_verify` แล้ววางสูตรเหล่านี้ ทุกบรรทัดต้องได้ผลตามที่ระบุ

| # | สูตร | ต้องได้ |
|---|---|---|
| V1 | `=COUNTA(onet_requirements!A2:A)` | **600** |
| V2 | `=COUNTA(element_aliases!B2:B)` | **61** |
| V3 | `=COUNTA(onet_requirements_excluded!A2:A)` | **354** |
| V4 | `=COUNTA(role_map!A2:A)` | **20** |
| V5 | `=COUNTA(recommendation_master!A2:A)` | **499** |
| V6 | `=COUNTA(item_competency_map!A2:A)` | **6780** |
| V7 | `=COUNTUNIQUE(recommendation_master!A2:A)` | **499** |
| V8 | `=ROUND(SUMIF(onet_requirements!B:B,"R01",onet_requirements!L:L),4)` | **1** — ไล่ให้ครบ R01 ถึง R20 |
| V9 | `=COUNTIF(onet_requirements!E:E,"Abilities")` | **0** |
| V10 | `=COUNTIF(recommendation_master!AQ:AQ,"verified")` | **463** |
| V11 | `=COUNTIF(recommendation_master!AW:AW,"v1.3_crossrole")` | **68** |
| V12 | `=COUNTBLANK(recommendation_master!Y2:Y500)` | **0** — ทุกแถวต้องมี `competency_ids_l1` ไม่งั้น pre-filter จะกรองทิ้งหมด |

ถ้า V8 ของบทบาทใดไม่เท่ากับ 1 แปลว่า import ตัดคอลัมน์หรือแถวหาย **หยุดแล้ว import ใหม่ ห้ามแก้ด้วยมือ**

ตรวจด้วยตาอีกสามอย่าง — `soc_code` ต้องเห็น `15-1252.00` ไม่ใช่ `15-1252` หรือวันที่ · `role_name_th` ต้องอ่านภาษาไทยออก ไม่ใช่ `?????` · `element_aliases` ต้องเห็น `|` คั่นครบ ไม่ถูกตัดท้าย

### 4.3 ล็อกและแชร์

**ป้องกันแท็บที่ตรึงแล้ว** — เลือกแท็บ → คลิกขวาที่ชื่อแท็บ → **Protect sheet** → **Set permissions** → **Show a warning when editing this range** ทำกับ `onet_requirements` · `element_aliases` · `onet_requirements_excluded` · `role_map` · `item_competency_map`

ใช้ warning ไม่ใช่ restrict เพราะ service account ต้องอ่านได้ และการเตือนก็พอกันการแก้โดยบังเอิญ

**แชร์ให้ Service Account** — Share → ใส่อีเมลรูปแบบ `xxx@yyy.iam.gserviceaccount.com` สิทธิ์ **Editor** และ **เอาเครื่องหมายถูกออกจาก "Notify people"** เพราะไม่ใช่อีเมลจริง

**จด Spreadsheet ID** จาก URL `https://docs.google.com/spreadsheets/d/`**`<ID>`**`/edit` แล้วเก็บลง `config_master` เป็นค่าเดียว — n8n ทุกโหนดอ้างค่านี้ ไม่ควรพิมพ์ URL ซ้ำหลายจุด

---

## 5 · เรื่องที่จะทำให้ n8n พังเงียบ ๆ

1. **ชื่อแท็บต้องตรงทุกตัวอักษร** รวมขีดล่าง ไม่มีเว้นวรรคหน้าหลัง — n8n Google Sheets node อ้างด้วยชื่อแท็บ พิมพ์ `pipeline run` แทน `pipeline_run` จะได้ error ที่ไม่บอกสาเหตุ
2. **หัวคอลัมน์ต้องอยู่แถวที่ 1 เท่านั้น** ห้ามแทรกแถวว่างหรือแถวหัวเรื่องข้างบน
3. **ห้ามมีช่องว่างนำหรือตามในชื่อคอลัมน์** — `submission_id ` กับ `submission_id` เป็นคนละคอลัมน์ในสายตา n8n
4. **หัวคอลัมน์ทั้ง 6 แท็บถูกตรวจแล้วว่าตรงกับที่ `build_workflows_31AUG26.py` เขียนจริงทุกตัว** — ถ้าแก้ workflow ในอนาคต ต้องรัน `build_gsheets_01SEP26.py` ใหม่ด้วย ไม่งั้นค่าจะหายโดยไม่ error
5. **`item_competency_map` 6,780 แถว** อ่านทั้งแท็บทุกครั้งจะช้าและกิน quota — ถ้าโหนดไหนต้องใช้ ให้ filter ฝั่ง Sheets ด้วย `role_id` ไม่ใช่ดึงทั้งหมดมากรองใน Code node
6. **Google Sheets API มี quota 300 read/นาที ต่อโปรเจกต์** — pipeline หนึ่งรอบอ่าน Sheets 6 ครั้ง ถ้ารันขนานหลายรายพร้อมกันตอนเก็บข้อมูลจริงอาจชน ควรใส่ retry แบบ exponential backoff ในโหนด Sheets ทุกตัว

---

## 6 · งานที่เหลือก่อน FREEZE

| ลำดับ | งาน | ⏱ |
|---|---|---:|
| 1 | เปิด 5 URL ปิดช่องว่าง 8 requirement — PSD I (R01,R03) · PSPO I (R05,R18) · MongoDB Associate Developer (R02) · University of London Responsive Web (R02) | 20 นาที |
| 2 | หารายการจริง 4 ตัวปิด element ใหญ่ตาม `corpus_gap_request` → ความครอบคลุมขึ้นเป็น ~89% | 2 ชม. |
| 3 | ทบทวน mapping ของแถว `batch = v1.3_crossrole` ทั้ง 68 แถว (`mapping_status = pending_review`) | 1.5 ชม. |
| 4 | ตรวจ `alias_collision_review` 23 แถว — `networking` เป็นตัวที่ต้องตัดสินก่อน | 45 นาที |
| 5 | ทบทวน mapping 17 รายการที่เปลี่ยนใบรับรองตาม DEC-15 | 2 ชม. |
| 6 | ตรวจ URL ที่เหลืออีก 31 แถว | 1.5 ชม. |
| 7 | แก้ `Guideline n8n v4.md` และ `System Architecture v3.md` ตาม change order + เพิ่มค่า 4.33 เข้า §3.5.5 ของเล่ม (7 ข้อที่ `check_consistency.py` ยังฟ้อง) | 5 ชม. |
| 8 | 🧊 FREEZE ทั้ง corpus และชุด O\*NET · บันทึก `frozen_at` · แนบ manifest เข้าภาคผนวก จ | 1 ชม. |

---

## 7 · ผลตรวจ

**ฝั่ง O\*NET 24 ข้อ ผ่านทั้งหมด** — 600 แถว · 20 บทบาท × 30 · `requirement_id` ไม่ซ้ำและรูปแบบถูก · `weight_renormalized` รวมเป็น 1 ทุกบทบาท · ไม่มี Abilities หลงเหลือ · โควตา 3 ต่อโดเมนครบ 80 คู่ · IM ต่ำสุด 3.0 · alias ครบ 61 element · `weight_share_of_pool` คำนวณใหม่จาก `Data_Set.xlsx` ตรงทุกบทบาท ผิดพลาด 0.000000

**ฝั่ง corpus — `check_corpus_31AUG26.py` ผ่าน 17 จาก 18 ข้อ** เหลือ CHK-17 ที่เป็นงานตรวจ URL ด้วยคน · CHK-06 (corpus ↔ map ตรงกันทุกคู่) · CHK-10 (role_index) · CHK-11 (uncovered) กลับมาผ่านหลังสร้าง `Course_Career_v13_01SEP26.xlsx`

**หัวคอลัมน์ Sheets ตรงกับที่ n8n เขียนจริงครบทั้ง 6 แท็บ** — ตรวจโดยดึงรายชื่อคอลัมน์จาก `sheets_append(...)` ใน `build_workflows_31AUG26.py` มาเทียบกับหัวแท็บในสมุดตรง ๆ

**ความปลอดภัยตอนนำเข้า Sheets** — สแกน 141,715 เซลล์ใน 32 แท็บ · 0 เซลล์ขึ้นต้นด้วย `=` `+` `@` หรือ `-` ตามด้วยตัวอักษร · 0 เซลล์เสี่ยงถูกแปลงเป็นวันที่ · 0 เซลล์เสียเลขศูนย์นำหน้า · 0 เซลล์เกิน 50,000 ตัวอักษร (ยาวสุด 922)

**SHA-256 ของไฟล์ต้นทางตรงกับ manifest ทุกตัว** และ `Data_Set.xlsx` → CSV ทั้งสามไฟล์ regenerate แล้วได้ค่าตรงกับที่พิมพ์ในภาคผนวก จ ไม่ผิดแม้แต่ไบต์เดียว

---

*ปรับปรุง 1 กันยายน 2026 รอบที่ 2 · สร้างด้วย `05_scripts/build_corpus_v13_01SEP26.py` และ `05_scripts/build_gsheets_01SEP26.py` ทำซ้ำได้ · ตัวเลขทุกตัวคำนวณใหม่จากไฟล์จริง*
