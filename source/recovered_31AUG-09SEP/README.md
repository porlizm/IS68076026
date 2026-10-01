# IS 68076026 — แผนที่โฟลเดอร์

**งาน:** A Multi-Model Generative-AI Framework for Reducing Hallucination in Resume-Based Skill-Gap Analysis and Personalized Learning Pathways
**ผู้วิจัย:** ดนุสรณ์ อนันตกาล (68076026) · ITM · KMITL
**จัดระเบียบโฟลเดอร์:** 31 สิงหาคม 2026 — ทุกการย้ายบันทึกไว้ใน `_MOVE_LOG_31AUG26.csv` (ย้ายอย่างเดียว ไม่มีการลบไฟล์ใด)

---

## กติกาข้อเดียวที่ต้องจำ

> **หนึ่งประเภทเอกสาร มีฉบับปัจจุบันได้ไฟล์เดียว** ไฟล์รุ่นเก่าย้ายเข้า `archive/` ทันทีที่มีรุ่นใหม่
> ทุกไฟล์ตั้งชื่อลงท้ายด้วยวันที่ `DDMMMYY` เพื่อให้รู้รุ่นจากชื่อไฟล์

---

## โครงสร้าง

```
01_docs/          เอกสารฉบับปัจจุบัน — เปิดอ่านที่นี่
02_dataset/       ชุดข้อมูลอ้างอิง O*NET ที่ตรึงแล้ว (ห้ามแก้)
03_corpus/        คลังหลักสูตรและใบรับรอง ฉบับปัจจุบัน v1.2
04_master_data/   ทะเบียนโมเดล prompt ค่าคงที่ ตัวชี้วัด นโยบายผู้ให้บริการ
05_scripts/       สคริปต์ทั้งหมด — รันจากที่ไหนก็ได้
06_workflows/     n8n ฉบับปัจจุบัน (ยังว่าง ดูหัวข้อ "ไฟล์ที่ยังไม่มีในเครื่อง")
archive/          ของเก่า แยกตามช่วงเวลา ไม่ต้องเปิดเว้นแต่ต้องย้อนดู
```

### `01_docs/` — เอกสารฉบับปัจจุบัน

| ไฟล์ | คืออะไร |
|---|---|
| `IS_68076026(29AUG26)_v3.docx` | **เล่ม IS ฉบับปัจจุบัน** บทที่ 1–3 + ภาคผนวก ก–จ |
| `DECISIONS_31AUG26.md` | ทะเบียนการตัดสินใจ DEC-09 ถึง DEC-15 พร้อมวิธีย้อนกลับ |
| `Development_Process_31AUG26.md` | แผนงาน 17 สัปดาห์ · GATE ทั้ง 6 · ทะเบียนความเสี่ยง |
| `Codebook_GroundTruth_31AUG26.md` | เกณฑ์ให้รหัส evidenced / partially / missing |
| `URL_Verification_Report_31AUG26.md` | ผลตรวจ URL 331 รายการ |
| `Guideline n8n v4.md` | ⚠ **ยังไม่ได้ตามแก้** ตาม change order §4.1 ของ Gap Closure |
| `System Architecture v3.md` | ⚠ **ยังไม่ได้ตามแก้** ตาม change order §4.2 |

### `02_dataset/` — 🧊 ตรึงแล้ว ห้ามแก้

`onet_requirements_28AUG26.csv` (600 แถว · แหล่งความจริงของชุดข้อกำหนด) · `element_aliases_28AUG26.csv` (61) · `onet_requirements_excluded_28AUG26.csv` (354) · `role_map_28AUG26.json` (20 บทบาท) · `dataset_version_log_28AUG26.json` · `Data_Set.xlsx` (56 ชีต) · `db_31_0_excel/` (ต้นฉบับ O*NET) · สคริปต์สร้าง `build_onet_requirements_28AUG26.py` + `aliases.py`

### `03_corpus/` — ฉบับปัจจุบัน `CORPUS-IS68076026-v1.2-31AUG26`

`Course_Career_v12_31AUG26.xlsx` (431 รายการ · 13 ชีต) · `corpus_master_v12_31AUG26.csv` · `item_competency_map_31AUG26.csv` (6,543 แถว) · `corpus_change_log_v12_31AUG26.csv` · `url_verification_31AUG26.csv` · `url_action_list_31AUG26.csv` · `corpus_qa_v12_31AUG26/` (รายงานผลตรวจ) · `corpus_version_log_v12_31AUG26.json`

### `04_master_data/` — `RULES-IS68076026-v1.0-31AUG26`

`Master_Data_31AUG26.xlsx` (12 ชุด) · `master_data_csv_31AUG26/` (CSV สำหรับนำเข้า Google Sheets) · แบบฟอร์ม ground truth 2 ไฟล์ · `rules_version_log_31AUG26.json`

### `05_scripts/` — รันจากที่ไหนก็ได้

ทุกสคริปต์มี bootstrap ที่หารากโปรเจกต์เองและค้นไฟล์ให้อัตโนมัติ ไม่ต้อง `cd` เข้าโฟลเดอร์ไหนก่อน

| สคริปต์ | ทำอะไร | เขียนผลลงที่ |
|---|---|---|
| `check_consistency.py` | ตรวจว่าเอกสารทุกฉบับพูดตรงกัน (5 ชั้น) | หน้าจอ |
| `check_corpus_31AUG26.py` | ตรวจ corpus อิสระ 18 ข้อ | `03_corpus/corpus_qa_v12_31AUG26/` |
| `build_corpus_v12_31AUG26.py` | สร้าง corpus v1.2 จาก v1.1 | `03_corpus/` |
| `build_master_data_31AUG26.py` | สร้าง Master Data | `04_master_data/` |
| `build_corpus_v10_31AUG26.py` · `apply_url_verification_31AUG26.py` · `record_url_result_31AUG26.py` | สคริปต์ประวัติ เก็บไว้เพื่อ reproducibility | `03_corpus/` |

**สองคำสั่งที่ใช้บ่อย**

```
python3 "05_scripts/check_consistency.py"        # ก่อน commit ทุกครั้ง
python3 "05_scripts/check_corpus_31AUG26.py"     # ทุกครั้งที่แก้ corpus
```

---

## 🔴 ไฟล์ที่ยังไม่มีในเครื่อง — อยู่ใน Project เท่านั้น

ตรวจพบระหว่างจัดระเบียบว่าไฟล์สำคัญบางตัวมีอยู่แค่ใน Project บน claude.ai และไม่เคยถูกดาวน์โหลดลงเครื่อง

| ไฟล์ใน Project | ทำไมสำคัญ | ควรอยู่ที่ |
|---|---|---|
| `WF_Main_28AUG26.json` (42 โหนด) | **workflow ฉบับปัจจุบัน** — ที่อยู่ในเครื่องเป็นสถาปัตยกรรมเก่า 4 ไฟล์ซึ่งย้ายเข้า archive แล้ว | `06_workflows/` |
| `WF_SUB_GapEngine_28AUG26.json` (22 โหนด) | แกนของงานวิจัย กฎ R0–R4 | `06_workflows/` |
| `sheet_headers_28AUG26.csv` | หัวคอลัมน์ของ 6 แท็บใน Google Sheets | `06_workflows/` |
| `n8n_README_28AUG26.md` | คู่มือติดตั้งและตรรกะสำคัญ 4 จุด | `06_workflows/` |
| `Occupation_list_28AUG26.md` | แหล่งความจริงของบทบาท 20 อาชีพ (ฉบับในเครื่องเป็นรุ่นก่อน DEC-07 ย้ายเข้า archive แล้ว) | `01_docs/` |
| `Gap_Closure_28AUG26.md` · `Gap_28AUG26.md` | บันทึกการปิดช่องว่าง G-01…G-10 และที่มาของ DEC-07/08 | `01_docs/` |
| `IS_68076026_28AUG26.md` | เล่มฉบับ markdown ใช้ค้นข้อความได้เร็วกว่า .docx | `01_docs/` |

`role_map_28AUG26.json` ดึงลงมาให้แล้วเมื่อ 31 ส.ค. อยู่ใน `02_dataset/`

---

## ผล `check_consistency.py` ล่าสุด — เหลือ 7 ข้อที่ต้องแก้จริง

| ระดับ | ไฟล์ | ปัญหา |
|---|---|---|
| L1 | `Guideline n8n v4.md` | ยังมี `เฉลี่ย 52.2` และ `50–82` ซึ่งเป็นตัวเลขก่อน DEC-07 |
| L2 | `Guideline n8n v4.md` | ไม่มีคำว่า `requirement_id` และไม่มี `70.3` หรือโควตา `12 : 18` |
| L1 | `System Architecture v3.md` | ยังมี `ChatGPT 5.5` และ `Gemini 3.1` |
| L3 | `IS_68076026(29AUG26)_v3.docx` | **ไม่ได้ระบุค่า 4.33 และสูตร capacity ใน §3.5.5** ทั้งที่ Timeline feasibility เป็นตัวชี้วัดของ RQ3 |

ทั้งหมดคือ change order §4.1 และ §4.2 ของ Gap Closure ที่ยังไม่ได้ทำ บวกกับข้อ L3 ที่เพิ่งค้นพบ

---

## สถานะโดยรวม ณ 31 ส.ค. 2026

| ด้าน | สถานะ |
|---|---|
| ชุดข้อมูล O*NET | 🧊 ตรึงแล้ว 600 แถว |
| Corpus | v1.2 · 431 รายการ · ครอบคลุม 600/600 · verified 395/431 (91.6%) |
| Master Data | มีครบ 12 ชุด · ยังไม่ตรึง (รอ pilot) |
| Codebook ground truth | ร่าง v0.9 |
| เอกสาร | เล่มปัจจุบันคือ v3 · Guideline และ SA ยังไม่ตามแก้ |
| n8n workflow | ⚠ ฉบับปัจจุบันยังไม่อยู่ในเครื่อง |
| จริยธรรม | ⬜ ยังไม่เริ่ม — **critical path ตัวจริงของโครงการ** |
| git | ⚠ มี `.git` แต่ยังไม่มี commit สักตัว |
