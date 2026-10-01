# Development Process — แผนพัฒนางานวิจัยอย่างเป็นระบบ

**งาน:** A Multi-Model Generative-AI Framework for Reducing Hallucination in Resume-Based Skill-Gap Analysis and Personalized Learning Pathways
**ผู้วิจัย:** ดนุสรณ์ อนันตกาล (68076026) · ITM · KMITL · อาจารย์ที่ปรึกษา: ผศ.ดร.สุภกิจ นุตยะสกุล
**จัดทำ:** 29 สิงหาคม 2026 · **ปรับสถานะ:** 31 สิงหาคม 2026 (ปิด D-6 · เพิ่ม DEC-09/10/11 ดู `DECISIONS_31AUG26.md`)
**กรอบเวลา:** 31 ส.ค. 2026 → 27 ธ.ค. 2026 (**17 สัปดาห์**) · กำหนดส่งสิ้นปี 2026
**สถานะเอกสารนี้:** แผนปฏิบัติการ — ใช้เป็นไกด์ไลน์เดียวในการเดินงาน ติ๊ก checklist ตามจริงและอัปเดตทุกสัปดาห์

---

## วิธีใช้เอกสารนี้

| สัญลักษณ์ | ความหมาย |
|---|---|
| 🚦 **GATE** | ด่านที่ต้องผ่านก่อน จะข้ามไปทำขั้นถัดไปไม่ได้ — ถ้าไม่ผ่านต้องใช้แผนสำรอง |
| 🔴 | อยู่บน critical path — ช้า 1 วันคือทั้งโครงการช้า 1 วัน |
| 🟡 | ทำคู่ขนานได้ ไม่บล็อกใคร |
| ⏱ | ประมาณการแรงงาน (ชั่วโมงคน) |
| 🧊 **FREEZE** | จุดตรึง ห้ามแก้หลังจากนี้ — ถ้าแก้ต้องบันทึกเป็น deviation และรายงานในเล่ม |

**สมมติฐานของแผน:** ทำงานได้ **~24 ชั่วโมง/สัปดาห์** ตลอด 17 สัปดาห์ (รวม ~408 ชม.) · แผนนี้ใช้ไป **~390 ชม.** เหลือ buffer เพียง 4% ซึ่ง **น้อยมาก** จึงต้องรักษาวินัยของ GATE อย่างเคร่งครัด ดูข้อ 8 ว่าจะตัดอะไรถ้าไม่ทัน

---

# ส่วนที่ 1 · สถานะปัจจุบัน (ตรวจจากไฟล์จริง 29 ส.ค. 2026)

## 1.1 สิ่งที่เสร็จแล้วจริง — ไม่ต้องทำซ้ำ

| # | สิ่งที่มี | หลักฐาน |
|---|---|---|
| 1 | **การตัดสินใจเชิงออกแบบปิดครบ 8 ข้อ** DEC-01 ถึง DEC-08 | `Guideline n8n v4.md` §0 · `Gap_Closure_28AUG26.md` §1 |
| 2 | **ชุดข้อมูลอ้างอิง O\*NET 31.0 สกัดเสร็จ** — `Data_Set.xlsx` 56 ชีต (Role Master 20 · Competency 3,220 · Readiness Weights 1,296 · Role Technology 4,797 · Tasks 428 + ข้อมูลดิบ R01–R23, F01–F22) | เปิดไฟล์ตรวจแล้ว ครบตามที่เอกสารอ้างทุกตัวเลข |
| 3 | **ชุด requirement 600 แถว** พร้อม `weight_renormalized` และ `selected_reason` | `onet_requirements.csv` (600 แถว ตรวจแล้ว) |
| 4 | **ฉบับแก้ครบตาม Gap Closure อยู่ใน Project** — `onet_requirements_28AUG26.csv` (17 คอลัมน์ มี `requirement_id` + alias ครบ) · `element_aliases_28AUG26.csv` (61 element · 509 alias) · `onet_requirements_excluded_28AUG26.csv` (354 แถว) · `role_map_28AUG26.json` · `dataset_version_log_28AUG26.json` · `build_onet_requirements_28AUG26.py` (reproducible มีสวิตช์ย้อนกลับ) | Project docs |
| 5 | **สเปกสถาปัตยกรรมระดับ node ครบทุก workflow** A–I | `System Architecture v3.md` §6–§13 |
| 6 | **แผนการประเมินครบ 10 conditions + 12 วิธีวิเคราะห์** | `System Architecture v3.md` §12 |
| 7 | **เล่ม บทที่ 1–3 + ภาคผนวก ก–ง เขียนครบ** พร้อมภาพที่ 3.1–3.3 ฝังแล้ว | `IS_68076026(29AUG26)_v1.docx` — 303 ย่อหน้า 7 ตาราง |
| 8 | **สคริปต์วิเคราะห์ตั้งต้น** Wilcoxon + effect size + recall cost | `N8N Flow Files/analysis.py` |

## 1.2 🔴 ข้อค้นพบที่ต้องแก้ก่อนอื่นใด — เอกสารแตกเป็นสองสาย

จากการตรวจไฟล์จริง พบว่า **งานเดินไปสองสายที่ไม่รู้จักกัน** และถ้าไม่รวมสายก่อน ทุกอย่างที่สร้างต่อจากนี้จะผิดฐาน

| สาย | ไฟล์ | เนื้อหา |
|---|---|---|
| **สาย A — Project (28 ส.ค.)** | `Gap_Closure_28AUG26.md` + CSV/JSON 6 ไฟล์ | ปิด G-01…G-10 · **DEC-07 ตัดกลุ่ม Abilities → 4 โดเมน · w-share 70.3%** · มี `requirement_id` · alias ครบ · dataset version log ครบ |
| **สาย B — เครื่อง (28–29 ส.ค.)** | `IS_68076026(28AUG26)_v2.docx` → `IS_68076026(29AUG26)_v1.docx` | แก้ชื่อโมเดลให้ทันสมัย (GPT-5.6 Terra / Gemini 3.7 Flash / ตัด Hybrid Verifier) และวาดภาพ 3.1–3.3 ใหม่ แต่ **ยังเป็นฉบับ 5 โดเมน · w-share 52.2 / 41.1 / 64.4 · ไม่มี DEC-07 · ไม่มี ภาคผนวก จ · ไม่มี THETA · ไม่มี `weight_share_of_pool`** |

**ตรวจยืนยันแล้วในไฟล์ Word ฉบับล่าสุด:** คำว่า `DEC-07` = 0 ครั้ง · `70.3` = 0 ครั้ง · `52.2` = 1 ครั้ง · `ภาคผนวก จ` = 0 ครั้ง · ข้อความ §3.5.1 ยังเขียนว่า *"เลือกสามอันดับแรกของแต่ละกลุ่มสมรรถนะทั้งห้ากลุ่ม ... Abilities ..."*

**การตัดสินใจที่ยืนยันแล้ว:** เดินตาม **DEC-07** แล้ว merge สาย A เข้าสาย B (ดู Phase 0)

## 1.3 🔴 ช่องว่างอื่นที่ตรวจพบ

| # | ช่องว่าง | หลักฐาน | ผลถ้าไม่แก้ |
|---|---|---|---|
| D-1 | **ไฟล์ที่แก้แล้วอยู่แต่ใน Project ไม่มีในเครื่อง** — `onet_requirements.csv` ในโฟลเดอร์ยังเป็นฉบับเดิม `element_aliases` **ว่าง 600/600 แถว** | ตรวจ CSV ในเครื่องแล้ว | เขียน `SUB_GapEngine` ผิดฐาน · Evidence Relevance Rule ทำงานไม่ได้ |
| D-2 | **`Guideline n8n v4.md` และ `System Architecture v3.md` ยังไม่ถูกตามแก้** ตาม change order §4.1/§4.2 ของ Gap Closure | Guideline §5 ยังเขียน *"⚠ `element_aliases` ว่างอยู่"* · §3 ยังเป็นโควตา 5 โดเมน 15:15 | สเปกที่ใช้เขียน workflow ขัดกับข้อมูลจริง |
| D-3 | **ไฟล์ n8n JSON ทั้ง 4 เป็นสถาปัตยกรรมคนละรุ่น** — `WF1_Main_Pipeline.json` เป็น monolith 44 nodes ใช้ ChatGPT 5.5 / Gemini 3.1 / Claude Hybrid Verifier ขณะที่ SA v3 กำหนด 8 workflow แยก + cross-validation ด้วยโค้ดล้วน | อ่าน JSON ทั้ง 4 ไฟล์แล้ว | ถ้าเอามาแก้ต่อจะเหลือร่องรอยของ verifier แบบเก่าซึ่งขัดกับ RQ2 |
| D-4 | **`analysis.py` ล้าสมัย** — baseline เขียนเป็น `ChatGPT-5.5`/`Gemini-3.1` · ไม่มี Holm, bootstrap CI, Fleiss' κ, repeat-run, calibration, C7–C10 | อ่านไฟล์แล้ว | ตาราง บทที่ 4 ขาดสถิติที่ SA v3 §12.4 บังคับ 6 จาก 12 ข้อ |
| D-5 | **ยังไม่มีอะไรเลยฝั่ง "คน"** — ไม่พบเอกสารขอจริยธรรม แบบสอบถาม เอกสารยินยอม แผนรับสมัคร หรือ codebook ในโฟลเดอร์ | `device_list_dir` ทั้งโฟลเดอร์ | **นี่คือ critical path ตัวจริงของแผน 17 สัปดาห์** ไม่ใช่การเขียนโค้ด |
| D-6 | ~~ยังไม่มี corpus~~ ✅ **ปิดแล้ว 31 ส.ค. 2026** — `Course_Career_31AUG26.xlsx` 431 รายการ · 20 บทบาท · ครอบคลุม requirement 600/600 · ผ่านตัวตรวจอิสระ 17 จาก 18 ข้อ | `corpus_qa_v10_31AUG26/qa_summary.csv` | เหลือเพียงการตรวจ URL ด้วยมือก่อน FREEZE |
| D-7 | **ยังไม่ได้ตรวจ ⚠ 10 ข้อกับ documentation จริง** (GATE-01 EOL ของ glm-5.2 · model id · thinking config · ราคา · SOC proxy · n8n version · Document AI region) | `Guideline` §10 · SA v3 §20 ยังไม่ติ๊กสักข้อ | เสี่ยงต้องรื้อกลางทาง |
| D-8 | **ไม่มี version control** — โฟลเดอร์มี `.git` แต่ไม่มี commit เลย และมีไฟล์ Word 4 รุ่นวางปนกัน + ไฟล์ล็อก `~$...docx` ค้าง | `git log` ว่าง | สาย A/B แตกกันได้ตั้งแต่แรกเพราะเหตุนี้ |

## 1.4 บทสรุปสถานะ

> **งานฝั่งข้อมูลและสถาปัตยกรรมเสร็จไปแล้วประมาณ 70% และมีคุณภาพสูงผิดปกติสำหรับ IS ระดับปริญญาโท** — การตัดสินใจถูกบันทึกพร้อมเหตุผลและย้อนกลับได้ ตัวเลขทุกตัวตรวจสอบกลับได้ถึงไฟล์ต้นทาง
>
> **แต่งานฝั่งการนำไปปฏิบัติเสร็จประมาณ 5%** — ยังไม่มี workflow ที่ใช้ได้จริงสักตัว ไม่มี corpus ไม่มีเอกสารจริยธรรม ไม่มีผู้เข้าร่วม
>
> **ความเสี่ยงอันดับ 1 ของแผน 17 สัปดาห์ไม่ใช่เรื่องเทคนิค แต่คือการอนุมัติจริยธรรมและการหาผู้เข้าร่วม 30 คน** ซึ่งเป็นสิ่งเดียวในแผนที่เร่งด้วยการทำงานหนักขึ้นไม่ได้ จึงต้องเริ่มในสัปดาห์แรกโดยไม่มีข้อยกเว้น

---

# ส่วนที่ 2 · หลักการวางแผนและ Critical Path

## 2.1 หลักการ 5 ข้อ

1. **ตรึงก่อน สร้างทีหลัง** — ทุกอย่างที่ workflow อ้างถึง (requirement set, alias, THETA, corpus, prompt) ต้อง FREEZE ก่อนที่ workflow นั้นจะถูกเขียนเสร็จ ไม่ใช่หลังจากนั้น
2. **งานที่ขึ้นกับคนอื่นเริ่มก่อนเสมอ** — จริยธรรม การรับสมัคร การยืนยัน EOL จากผู้ให้บริการ อยู่ต้นแผนทั้งหมด เพราะเวลารอไม่ใช่เวลาที่เราควบคุมได้
3. **ทุก GATE มีแผนสำรองที่เขียนไว้ล่วงหน้า** — ห้ามถึงหน้างานแล้วค่อยคิด
4. **แหล่งความจริงมีหนึ่งเดียวต่อหนึ่งเรื่อง** — ตามตารางข้อ 2.4 ถ้าสองไฟล์ขัดกัน ให้ไฟล์ที่กำหนดชนะทันทีโดยไม่ต้องถกเถียง
5. **ทุกการตัดสินใจได้เลขรหัส** — DEC-nn บันทึกใน `DECISIONS.md` พร้อมวันที่ เหตุผล และวิธีย้อนกลับ

## 2.2 Critical Path (เส้นที่ช้าไม่ได้)

```
[P0] รวมสายเอกสาร + DEC-07
  ↓
[GATE-E] ส่งขอจริยธรรม ────────────────────┐ (รอ 3–6 สัปดาห์ ทำอย่างอื่นคู่ขนาน)
  ↓                                        │
[P1] FREEZE ชุดข้อมูล + GATE-01 (EOL)       │
  ↓                                        │
[P2] สร้าง 8 workflow + FREEZE corpus       │
  ↓                                        │
[P3] pilot 5 คน → FREEZE THETA + prompt     │
  ↓                                        ▼
[GATE-D] ─────────── ต้องได้ทั้งสองอย่าง ───→ เริ่มเก็บข้อมูล
  ↓
[P4] เก็บข้อมูลจริง n=30 ภายใน ≤ 3 สัปดาห์
  ↓
[P5] วิเคราะห์ + C10
  ↓
[P6] เขียน บทที่ 4–5 + artifact → ส่ง
```

**เส้นคู่ขนานที่ห้ามลืม:** รับสมัครผู้เข้าร่วม (เริ่ม W6) · ทวนสอบ corpus ด้วยมือ (W5–W7) · หาผู้ตรวจคนที่สองสำหรับ inter-rater (W8)

## 2.3 🚦 GATE ทั้ง 6 ด่าน

| GATE | ชื่อ | ต้องผ่านก่อน | เกณฑ์ผ่าน | แผนสำรองถ้าไม่ผ่าน |
|---|---|---|---|---|
| **GATE-0** | Baseline Merge | เริ่ม P1 | เอกสาร 5 ฉบับพูดตรงกันเรื่อง DEC-07 · ผ่านสคริปต์ตรวจความสอดคล้อง | ห้ามข้าม — เป็นเงื่อนไขของทุกอย่าง |
| **GATE-01** | EOL ของ `glm-5.2` | เริ่ม P2 | มีคำยืนยันเป็นลายลักษณ์อักษรจาก Z.ai ว่ารุ่นนี้ยังให้บริการถึงอย่างน้อย ก.พ. 2027 | พลิกไป **GLM 5.3 + reasoning ระดับ low** ตาม SA v3 §2.3.2 แล้วบันทึกใน §3.5.1 ว่า parity ได้ 0/3 ต้องพิสูจน์ด้วย PROTOCOL-01 แทน |
| **GATE-E** | จริยธรรมอนุมัติ | เริ่ม P4 | หนังสืออนุมัติจากคณะกรรมการ | ถ้าเลย W9 ยังไม่ได้ → ตัดการเก็บข้อมูลจากคนจริง เปลี่ยนเป็น **synthetic resume + annotation โดยผู้วิจัย** แล้วลด RQ3 เป็น expert review (ต้องปรึกษาอาจารย์ก่อน — เปลี่ยนขอบเขตงาน) |
| **GATE-C** | Corpus พร้อม | เริ่ม P3 | ~~≈400 รายการ~~ **431 รายการ ครบ 20 บทบาท ✅** · ทุกแถวมี URL/`competency_ids`/`estimated_hours` ✅ · ผ่าน Completeness Gate ✅ · **เหลือ: ตรวจ URL 431 แถว → `verified` แล้วจึง 🧊 FREEZE** | ลดเป้าเป็น 300 รายการ (15/บทบาท) แล้วรายงานข้อจำกัดใน §5.3 ของเล่ม |
| **GATE-P** | Pilot ผ่าน | เริ่ม P4 | `evidence_verified_ratio` ≥ 0.90 · PROTOCOL-01 `reasoning_tokens` ≤ 5% ของ output token · THETA ตรึงแล้ว · pipeline รันจบ 5/5 ราย | ถ้า ratio < 0.90 ให้ยกระดับโมเดล parse ตาม SA v3 §2.4.1 · ถ้า reasoning_tokens เกิน ให้บันทึกเป็นข้อจำกัดแล้วเดินต่อ (ห้ามหยุดงาน) |
| **GATE-D** | ปิดการเก็บข้อมูล | เริ่ม P5 | n ≥ 30 คู่ที่สมบูรณ์ · ground truth ยืนยันครบ · 🧊 FREEZE ห้ามรับเพิ่ม | ถ้า n < 30 ให้รายงาน n จริงพร้อม sensitivity analysis (SA v3 §12.4 ข้อ 9) — **ห้ามยืดเวลาเก็บเกิน 3 สัปดาห์** เพราะจะเสีย temporal validity |

## 2.4 แหล่งความจริง (Single Source of Truth)

| เรื่อง | แหล่งความจริง | ทุกไฟล์อื่นต้องตาม |
|---|---|---|
| 20 บทบาท · SOC · exact/proxy | `Occupation_list_28AUG26.md` §3, §5 | เล่ม ก.1/ก.2 · `role_map.json` · dropdown |
| ชุด requirement 30 ข้อ · น้ำหนัก · alias | `onet_requirements_28AUG26.csv` | prompt analyst · corpus whitelist · replay harness |
| นิยามวิชาการ · สูตร · ตัวชี้วัด | `IS_68076026(...)docx` ฉบับล่าสุด | Guideline · SA |
| ค่า config เชิงปฏิบัติ | `Guideline n8n v4_MERGED.md` | SA · workflow JSON |
| สเปก node · schema Sheets | `System Architecture v3_MERGED.md` | workflow JSON |
| เมตาดาตาการตรึง | `dataset_version_log.json` | ทุกฉบับ |

---

# ส่วนที่ 3 · Checklist ตามลำดับการทำงาน

> ทำจากบนลงล่าง ห้ามข้าม 🔴 · 🟡 แทรกเมื่อว่างได้

## Phase 0 · รวมสายเอกสารและตั้งฐาน (W1 · 31 ส.ค. – 6 ก.ย.) ⏱ 20 ชม.

**เป้าหมาย:** ทำให้เอกสารทุกฉบับพูดเรื่องเดียวกัน ก่อนที่จะสร้างอะไรต่อ

### 0.1 ตั้งระบบจัดการไฟล์ ⏱ 3 ชม. 🔴

- [ ] `git init` แล้ว commit สถานะปัจจุบันเป็น `baseline-29AUG26` (ก่อนแก้อะไรทั้งสิ้น)
- [ ] เพิ่ม `.gitignore` — `.work/`, `db_31_0_excel/`, `~$*.docx`, `__pycache__/`
- [ ] ลบไฟล์ล็อกค้าง `~$ample - Paper - IS1-67076010.docx`
- [ ] ย้ายไฟล์รุ่นเก่าเข้า `archive/` — `IS1 - 68076026 v.2.docx`, `System Architecture.md`, `System_Architecture_Proposal_1.md`, `Research Proposal (thai) v2.docx`, `extracted_docx_text.txt`, `translated_pasted_text.txt`
- [ ] ตั้งกติกาชื่อไฟล์: `<ชื่อ>_v<n>_<DDMMMYY>.<ext>` และ **มีไฟล์ "ปัจจุบัน" ได้ฉบับเดียวต่อประเภท**
- [ ] สร้าง `DECISIONS.md` ย้าย DEC-01…DEC-08 มาไว้ที่เดียว พร้อมคอลัมน์ "วิธีย้อนกลับ"

### 0.2 ดึงฉบับแก้จาก Project ลงเครื่อง ✅ **เสร็จแล้ว 29 ส.ค. 2026** (ปิด D-1)

**วิธีที่ใช้:** แทนที่จะคัดลอก CSV ลงมาตรง ๆ ใช้วิธีดึง `build_onet_requirements_28AUG26.py` กับ `aliases.py` ลงเครื่อง แล้ว **รันสร้างชุดข้อมูลใหม่จาก `Data_Set.xlsx`** ซึ่งพิสูจน์ reproducibility ไปในตัว

- [x] วางสคริปต์ `build_onet_requirements_28AUG26.py` และ `aliases.py` ในโฟลเดอร์
- [x] รันสคริปต์ ได้ `onet_requirements_28AUG26.csv` (600 แถว) · `onet_requirements_excluded_28AUG26.csv` (354 แถว) · `element_aliases_28AUG26.csv` (61 แถว)
- [x] วาง `dataset_version_log_28AUG26.json`
- [x] **SHA-256 ทั้ง 4 ไฟล์ตรงกับ ภาคผนวก จ ทุกตัว** — `Data_Set.xlsx` 665d1499…c475cd · requirements 8ab70032…6e77c · excluded bac5592c…95c0b1 · aliases ea60e46f…1bcf01
- [x] coverage เฉลี่ย 0.7026 · ต่ำสุด 0.5128 · สูงสุด 0.9749 ตรงกับที่เล่มระบุ
- [ ] เปลี่ยนชื่อ `onet_requirements.csv` เดิม (ฉบับ 5 โดเมน alias ว่าง) → `archive/onet_requirements_pre_DEC07.csv`
- [ ] ลบไฟล์ชั่วคราว `dataset_version_log_regenerated.json` ที่สคริปต์สร้างไว้เป็นหลักฐานการตรวจ

### 0.3 🚦 ยืนยัน DEC-07 กับอาจารย์ที่ปรึกษา ⏱ 2 ชม. 🔴

- [ ] ทำสรุป 1 หน้า: ทำไมตัดกลุ่ม Abilities (เหตุผล 3 ข้อ) · ผลต่อ w-share 52.2% → 70.3% · ย้อนกลับได้ด้วย `EXCLUDE_DOMAINS = ()`
- [ ] นัดคุย/ส่งอีเมล ขอความเห็นชอบเป็นลายลักษณ์อักษร
- [ ] บันทึกผลลง `DECISIONS.md` (ถ้าอาจารย์ไม่เห็นด้วย → ตั้ง `EXCLUDE_DOMAINS = ()` แล้วกลับไปแผน 5 โดเมน + ทางเลือก C ของ Gap §4)

### 0.4 Merge สาย A เข้าเล่ม Word ✅ **เสร็จแล้ว 29 ส.ค. 2026** (ปิด D-2 ครึ่งแรก)

**ผลลัพธ์:** `IS_68076026(29AUG26)_v2.docx` — สร้างด้วย `.work/revise_is_v3_merge.py` · ตรวจด้วย `.work/qa_29aug_v2.py` ผ่านครบ 60 ข้อ · ภาพ 3.1–3.3 และโครง Word เดิมคงอยู่ · `pool` ทั้ง 20 บทบาทตรวจกลับกับ `Data_Set.xlsx` แล้วตรงทุกค่า · SHA-256 ของ `Data_Set.xlsx` คำนวณซ้ำแล้วตรงกับ ภาคผนวก จ

- [x] §3.5.1 — เปลี่ยน "ทั้งห้ากลุ่ม" → **สี่กลุ่ม** · เพิ่มย่อหน้า "ขอบเขตของกลุ่มสมรรถนะ" เหตุผล DEC-07 3 ข้อ · แก้ pool `50–82` → **`31–65`** · แก้ w-share `52.2 / 41.1 / 64.4` → **`70.3 / 51.3 / 97.5`** · เพิ่ม tie-break `element_id` ASC
- [x] §3.5.1 — เพิ่มย่อหน้า "การระบุตัวข้อกำหนด" (`requirement_id = REQ-<role_id>-<element_id>`)
- [x] §3.5.1 — เพิ่มย่อหน้า "alias ของสมรรถนะ" พร้อมที่มา 4 ชั้น A1–A4
- [x] §3.5.4 — เพิ่มนิยาม out-of-scope ตาม **DEC-08** ("นอกชุด 30 ที่ตรึงไว้") · ระบุ `THETA = 0.15`
- [x] §3.6 — เพิ่ม `weight_share_of_pool` และการตีความ Readiness หลัง DEC-07
- [x] §3.8 **ตารางที่ 3.1** — ปัจจุบันในเล่มมีเพียง **6 ตัวชี้วัด** ต้องเป็น **11 ตัว** → เพิ่ม Out-of-scope claim rate · แตก Recommendation validity เป็น 5 แถว (Whitelist / Mode / Gap coverage / Timeline / Report-reference) · เพิ่มย่อหน้ากำกับว่าต้องรายงานแยกทั้ง 5
- [x] §3.8 — เพิ่มย่อหน้าเกณฑ์ตีความ a priori (hallucination ต่ำกว่าทุก baseline **และ** recall cost ≤ 10%) และย่อหน้า ablation 3 ระดับ
- [x] §3.11 — ระบุองค์ประกอบ 4 อย่างของ dataset version log
- [x] ภาคผนวก ก.1 — เพิ่มคอลัมน์ `pool` และ `w-share` (ปัจจุบันมี 5 คอลัมน์ ต้องเป็น 7)
- [x] ภาคผนวก ข.1 — **เก็บโครง 8 แถวของเล่มไว้** (มีคอลัมน์ reasoning · model id · แถว Deterministic Code — ดีกว่าฉบับ Project) แล้ว **เพิ่มแถว Document OCR (Google Document AI)** ซึ่งขาดอยู่ · เพิ่มย่อหน้านำระบุ LLM calls = 6
- [x] ภาคผนวก ง.1 — เพิ่ม Out-of-scope claim rate · Evidence verified ratio (ปัจจุบัน 12 ตัว ต้องเป็น 14)
- [x] **ภาคผนวก จ — Dataset Freeze Manifest (ใหม่ทั้งภาคผนวก)**
- [x] 🔴 **เอกสารอ้างอิง — เพิ่ม [20] O\*NET 31.0 Database + ข้อความ CC BY 4.0** (เล่มปัจจุบันมีแค่ [1]–[19] และไม่มีคำอ้างอิงสัญญาอนุญาตเลย ซึ่งเป็นเงื่อนไขของ CC BY ไม่ใช่แค่ความสมบูรณ์)
- [x] อัปเดตสารบัญและเลขหน้าใน Word หนึ่งครั้ง
- [x] บันทึกเป็น `IS_68076026_v3_06SEP26.docx`

> **ทำแล้วอย่างไร:** ใช้ `IS_68076026(29AUG26)_v1.docx` เป็นฐาน (ภาพ 3.1–3.3 จริง · โครง Word/สารบัญ · ภาคผนวก ข.1 ที่มีคอลัมน์ reasoning และแถว Deterministic Code) แล้วยกเนื้อหา 12 บล็อกจาก `claude/IS_68076026_28AUG26.md` เข้ามา ผ่านสคริปต์ที่ทำซ้ำได้ ไม่ใช่แก้ด้วยมือ
>
> **🔴 เหลือทำใน Word ด้วยมือ 2 อย่าง:**
>
> - [ ] เปิด `IS_68076026(29AUG26)_v2.docx` ใน Word แล้ว **ตรวจเลขหน้าในสารบัญ / สารบัญตาราง** — เนื้อหาที่เพิ่มเข้ามาทำให้หน้าเลื่อน และสารบัญของเล่มนี้เป็นข้อความคงที่ ไม่ใช่ field ที่อัปเดตเองได้ (บรรทัด `ภาคผนวก จ` และ `ตารางที่ จ.1` ใส่ไว้เป็น 36 ต้องแก้ให้ตรงจริง)
> - [ ] ตรวจการจัดหน้าของ **ตารางที่ ก.1** ซึ่งเพิ่มจาก 5 เป็น 7 คอลัมน์ — ถ้าล้นขอบให้ลดขนาดฟอนต์ในตารางเป็น 12 pt หรือตั้งเป็นแนวนอนเฉพาะหน้านั้น

### 0.4b ปรับภาษาให้อ่านง่าย ✅ **เสร็จแล้ว 29 ส.ค. 2026**

**ผลลัพธ์:** `IS_68076026(29AUG26)_v3.docx` — เขียนใหม่ 115 ย่อหน้าใน บทที่ 1 ถึง 3 บทคัดย่อภาษาไทย หัวข้อย่อย คำบรรยายภาพ และภาคผนวก โดยไม่แตะตัวเลข ชื่อโมเดล ชื่อตัวชี้วัด รหัส DEC ภาพ หรือโครงสร้างตาราง

- ศัพท์อังกฤษในเนื้อความลดจาก 1,385 คำ เหลือ 648 คำ (ลดลง 53%)
- ชื่อฟิลด์แบบ snake_case ในเนื้อความลดจาก 83 เหลือ 12 ครั้ง (เหลือเฉพาะที่ต้องอ้างชื่อจริง)
- ตัด backtick ยัติภังค์ยาว ลูกศร เครื่องหมายมากกว่าเท่ากับ จุดกลาง และอัฒภาค ออกจากเนื้อความไทยทั้งหมด
- สคริปต์ `.work/rewrite_part1.py` · `.work/rewrite_part2.py` · `.work/run_rewrite.py` · ตรวจด้วย `.work/qa_29aug_v3.py` ผ่านครบทุกข้อ

> **ฉบับที่ใช้เป็น baseline ต่อจากนี้คือ `IS_68076026(29AUG26)_v3.docx`** ส่วน v2 เก็บไว้เทียบว่าการปรับภาษาไม่ได้เปลี่ยนสาระ

### 0.5 ตามแก้ Guideline และ System Architecture ⏱ 5 ชม. 🟡 (ปิด D-2 ครึ่งหลัง)

- [ ] `Guideline n8n v4.md` — แก้ 11 จุดตาม Gap_Closure §4.1 → บันทึกเป็น `Guideline_n8n_v5_06SEP26.md`
- [ ] `System Architecture v3.md` — แก้ 13 จุดตาม Gap_Closure §4.2 (รวม §15 temp = 0 · §5.1 ตัด `skill_id`/`criticality` · §9.5 กฎ R0 ตรวจ prefix · แก้เลขอ้างอิงข้ามหัวข้อ 4 จุด) → บันทึกเป็น `System_Architecture_v4_06SEP26.md`
- [ ] เขียนสคริปต์ `check_consistency.py` — grep หาคำที่ห้ามมี (`52.2`, `ห้ากลุ่ม`, `ChatGPT 5.5`, `Gemini 3.1`, `Hybrid Verifier`) และคำที่ต้องมี (`70.3`, `DEC-07`, `requirement_id`, `THETA`) ในทุกไฟล์ **รันทุกครั้งก่อน commit**

> 🚦 **GATE-0** ผ่านเมื่อ `check_consistency.py` ผ่านทั้ง 5 ไฟล์ และอาจารย์ยืนยัน DEC-07 แล้ว

---

## Phase 1 · จริยธรรม ตรึงข้อมูล และโครงพื้นฐาน (W1–W3 · 31 ส.ค. – 20 ก.ย.) ⏱ 58 ชม.

**เป้าหมาย:** ยิงเอกสารจริยธรรมออกไปให้เร็วที่สุด แล้วตรึงทุกอย่างที่ระบบจะอ้างถึง

### 1.1 🔴🚦 ชุดเอกสารจริยธรรม — **เริ่มวันแรก ห้ามเลื่อน** ⏱ 20 ชม.

> นี่คือรายการที่ควบคุมวันจบของโครงการ ทุกวันที่ช้าในข้อนี้คือหนึ่งวันที่หายไปจากช่วงเก็บข้อมูล

- [ ] ตรวจแบบฟอร์มและรอบประชุมของคณะกรรมการจริยธรรม KMITL — จดวันประชุมรอบถัดไปและ deadline ส่ง
- [ ] โครงร่างวิจัยฉบับย่อสำหรับกรรมการ (ดึงจาก บทที่ 1 และ 3)
- [ ] **เอกสารชี้แจงผู้เข้าร่วม (PIS)** — วัตถุประสงค์ · สิ่งที่ต้องทำ (อัปโหลดเรซูเม + ยืนยัน 30 ข้อ ~15 นาที + แบบสอบถาม) · ความเสี่ยง · สิทธิถอนตัว
- [ ] **หนังสือแสดงความยินยอม (Consent form)** — ต้องระบุการส่งข้อมูลไปยัง API ของผู้ให้บริการต่างประเทศ 4 ราย
- [ ] **แผนคุ้มครองข้อมูล (PDPA)** — PII masking ก่อนทุก LLM call · เก็บเรซูเมกี่วัน · ลบเมื่อไร · ใครเข้าถึงได้
- [ ] **เอกสาร data governance ต่อผู้ให้บริการ** (SA v3 §14.3) — นโยบายการเก็บ/ใช้ข้อมูลของ OpenAI, Anthropic, Google, Z.ai พร้อมลิงก์และวันที่เข้าถึง
- [ ] แบบสอบถามฉบับร่าง 6 construct (Usefulness · Ease of Use · Trust · Explainability · Perceived Relevance · Intention to Act)
- [ ] **ส่งคำขอ** — บันทึกวันที่ส่งลง `DECISIONS.md` 🚦 GATE-E เริ่มนับ

### 1.2 🔴 GATE-01 และตรวจ documentation จริง 10 ข้อ ⏱ 6 ชม. (ปิด D-7)

- [ ] 🚦 **`glm-5.2` EOL** — ติดต่อ Z.ai/Zhipu ขอคำยืนยันเป็นลายลักษณ์อักษร (ส่งอีเมลวันแรก เพราะต้องรอตอบ)
- [ ] `glm-5.2` — `thinking:{"type":"disabled"}` ใช้ได้จริง ยืนยันด้วย `reasoning_tokens` = 0 **จากการยิง API จริง ไม่ใช่จากเอกสาร**
- [ ] `gpt-5.6-terra` — ยืนยัน model id (ห้าม alias `gpt-5.6`) + ราคาจริง/1M token
- [ ] `gemini-3.7-flash` — รองรับ `thinkingLevel:"minimal"` หรือไม่ (ถ้าไม่ ใช้ `low` แล้วบันทึก) · ห้ามส่ง `thinking_budget` คู่กัน
- [ ] `claude-sonnet-5` — `output_config.format` · ยืนยัน extended thinking ปิดเมื่อไม่ส่ง `thinking`
- [ ] SOC proxy R07 (`15-1221.00`) และ R17 (`15-1244.00`) กับ O\*NET Online
- [ ] O\*NET 31.0 license + ข้อความอ้างอิง CC BY 4.0 ที่ต้องแสดง
- [ ] n8n instance เวอร์ชัน ≥ 1.95.1 (ต้องมี Evaluations) + typeVersion ของ node ที่จะใช้
- [ ] Google Document AI — region + `processorId`
- [ ] คำนวณ **cost/submission** จากราคาจริงทั้ง 4 ค่าย × 6 calls × 30 ราย × (1 + repeat k=3 บน 20% + C10 30 calls) → บันทึกงบประมาณ

> 🚦 **GATE-01** ผ่าน = ได้คำยืนยัน EOL · ไม่ผ่าน = พลิกไป GLM 5.3 + reasoning low **ภายใน W3** (ห้ามรอเกินนี้)

### 1.3 🧊 FREEZE ชุดข้อมูลอ้างอิง ⏱ 6 ชม. 🔴

- [ ] ทวนสอบคลัง alias 61 element หนึ่งรอบด้วยตา (สุ่มตรวจว่า alias ไม่กว้างเกินจนทำให้ overlap ปลอม)
- [ ] คำนวณ SHA-256 ใหม่ของ 4 ไฟล์ ณ วันตรึงจริง
- [ ] บันทึก `frozen_at` = วันจริง · `row_count` 600 / 354 / 61
- [ ] 🧊 **FREEZE** — จากนี้ห้ามแก้ `onet_requirements`, `element_aliases`, `THETA`, `role_map` โดยเด็ดขาด
- [ ] แนบ manifest เข้า ภาคผนวก จ ของเล่ม

### 1.4 สร้างชั้นข้อมูล Google Sheets ⏱ 10 ชม. 🔴

- [ ] Spreadsheet เดียว 5 กลุ่มตาม SA v3 §5: **DatasetMaster** · **CorpusMaster** · **PipelineData** · **ResearchEval** · **ModelRegistry**
- [ ] import `onet_requirements_28AUG26.csv` (600) และ `element_aliases_28AUG26.csv` (61)
- [ ] import `role_map` 20 บทบาท
- [ ] สร้างชีตเปล่าพร้อมหัวคอลัมน์: `submission`, `resume_profile`, `model_a/b/c_result`, `validated_result`, `recommendation_master`, `report_log`, `audit_log`, `ground_truth`, `evaluation_metrics`, `corpus_build_errors`, `consent_log`, `duplicate_log`
- [ ] `model_registry` — 7 แถวตาม ภาคผนวก ข.1 (OCR · parser · analyst A/B/C · ranker · report writer) พร้อม `model_id`, `temperature`, `reasoning_config`, `access_date`
- [ ] ตั้งสิทธิ์เข้าถึงและสำรองข้อมูลอัตโนมัติ

### 1.5 Google Form และการรับสมัคร ⏱ 8 ชม. 🟡

- [ ] Form: consent (`equals` เท่านั้น) · upload PDF · dropdown 20 บทบาท · recommendation mode 3 แบบ · timeline **6/12/18/24 เดือน** · ชั่วโมง/สัปดาห์ที่ทุ่มได้
- [ ] ทดสอบว่า Form Trigger ส่ง binary property ชื่ออะไร (จดไว้ ใช้ในโหนด Reattach)
- [ ] ร่างประกาศรับสมัคร + ช่องทาง (กลุ่มนักศึกษา ITM, ศิษย์เก่า, ชุมชนสายไอที) — **ยังไม่โพสต์จนกว่าจริยธรรมอนุมัติ**
- [ ] เตรียมรายชื่อสำรอง ≥ 45 คน (คาดว่าตอบจริง ~65%)

### 1.6 Codebook สำหรับ ground truth ⏱ 8 ชม. 🟡

- [ ] นิยาม `evidenced` / `partially` / `missing` พร้อมตัวอย่างจริงอย่างละ 3 ตัวอย่าง
- [ ] กฎการตัดสินกรณีก้ำกึ่ง (เช่น หลักฐานอยู่ในหัวข้อ "ความสนใจ" ไม่ใช่ "ประสบการณ์")
- [ ] แบบฟอร์ม annotation พร้อมช่อง `annotator_id`, `annotated_at`, `note`
- [ ] แผน intra-rater (ผู้วิจัยตรวจซ้ำ 20% หลัง ≥ 2 สัปดาห์) และ inter-rater (คนที่สอง 20% อิสระ)
- [ ] **หาผู้ตรวจคนที่สอง** และนัดหมายล่วงหน้า (คนคือทรัพยากรที่จองยากที่สุด)

---

## Phase 2 · สร้างระบบและ Corpus (W3–W7 · 14 ก.ย. – 18 ต.ค.) ⏱ 132 ชม.

**เป้าหมาย:** ได้ pipeline ที่รันจบตั้งแต่ต้นจนจบ และ corpus ที่ตรึงแล้ว

### 2.0 ตัดสินใจเรื่องไฟล์ n8n เดิม ⏱ 1 ชม. 🔴 (ปิด D-3)

- [ ] ย้าย `N8N Flow Files/*.json` ทั้ง 4 ไป `archive/n8n_v4_legacy/` พร้อม README อธิบายว่าเป็นสถาปัตยกรรมก่อน SA v3
- [ ] **สร้างใหม่ทั้ง 8 workflow** ตาม SA v3 — เหตุผล: ไฟล์เดิมเป็น monolith 44 nodes ที่ฝัง Claude Hybrid Verifier ไว้ ซึ่งขัดกับ RQ2 ที่ต้องให้ cross-validation เป็นโค้ดล้วน การแก้จะเหลือร่องรอยที่หายาก
- [ ] แต่ **นำกลับมาใช้ซ้ำได้** 4 อย่างจากไฟล์เดิม: โหนด `Reattach Resume Binary` · `Density Check + PII Mask` · payload ของ Document AI · โครง error notifier

### 2.1 Workflow A — O\*NET Dataset (5 nodes) ⏱ 3 ชม. 🔴

- [ ] A1 Manual Trigger · A2 Read `03_Readiness_Weights` · A3 Select Requirements (Code) · A4 Write `onet_requirements` · A5 Freeze + Log Version
- [ ] ทางลัด: import CSV ตรง แล้วเก็บ A3 เป็นสคริปต์ประกอบ artifact เพื่อ reproducibility
- [ ] ตรวจ: 600 แถวเข้าครบ · ไม่มีแถว `recommend_suppress = Y`

### 2.2 Workflow B+C — Corpus Builder (12 nodes) ⏱ 14 ชม. 🔴

- [ ] อ่าน role + 30 requirement ของบทบาทนั้น
- [ ] Build prompt ที่ใส่ครบ 3 อย่าง: **whitelist 30 `requirement_id`** · เทคโนโลยี `hot_technology`/`in_demand` จาก `04_Role_Technology` · งาน Core 5 อันดับแรกจาก `05_Role_Tasks`
- [ ] ฝัง **กฎกัน hallucination 4 ข้อ** ห้ามตัด: ประกาศเป็น draft ให้มนุษย์ตรวจ · `competency_ids` เลือกจาก whitelist เท่านั้น · ไม่แน่ใจ URL/exam code ให้เว้นว่าง **ห้ามเดา** · ระบุ confidence + `researcher_notes`
- [ ] **Completeness Gate** — `source_url` ว่าง ∨ `competency_ids` ว่าง ∨ `estimated_hours` ว่าง → `corpus_build_errors`
- [ ] schema ตาม ภาคผนวก ค: `item_id`, `item_type`, `provider`, `title`, `source_url`, `competency_ids`, `estimated_hours`, `researcher_notes`
- [ ] รันครบ 20 บทบาท × (10 คอร์ส + 10 ใบรับรอง) = เป้า 400 รายการ

### 2.3 🔴 ทวนสอบ Corpus ด้วยมือ ⏱ 22 ชม. — **เริ่มทันทีที่ B+C รันเสร็จ** (ปิด D-6)

> งานนี้กินเวลาที่สุดในเฟส และทำคู่ขนานกับการเขียน workflow อื่นได้ — อย่าเก็บไว้ทำทีเดียว

- [ ] เปิด URL ทุกรายการเพื่อยืนยันว่ามีจริงและตรงเนื้อหา (~400 รายการ × ~3 นาที)
- [ ] ตรวจว่า `competency_ids` ทุกตัวอยู่ในชุด 30 ของบทบาทนั้นจริง (สคริปต์ตรวจอัตโนมัติ + สุ่มตรวจตา 10%)
- [ ] ตรวจ `estimated_hours` สมเหตุสมผล
- [ ] บันทึกอัตราการปฏิเสธ (rejected/generated) — **เป็นตัวเลขที่ต้องรายงานในเล่มว่า AI ร่างแล้วมนุษย์ตัดออกกี่ %**
- [ ] 🧊 **FREEZE corpus** พร้อม `snapshot_version` 🚦 GATE-C

### 2.4 Workflow D — Intake & Parsing (17 nodes) ⏱ 16 ชม. 🔴

- [ ] Form Trigger → Check Consent (`equals`) → Init Submission → Log Consent
- [ ] ตรวจซ้ำ submission → **Reattach Resume Binary** (บั๊กที่แก้แล้วห้ามหาย)
- [ ] Extract PDF Text → Density Check → ถ้าต่ำให้ไป Document AI OCR → Normalize
- [ ] **PII masking ก่อนทุก LLM call**
- [ ] Build Parse Prompt → GPT-5.6 Terra (temp 0.2) → Validate Profile → คำนวณ `evidence_verified_ratio`
- [ ] ถ้า ratio ต่ำมาก → แจ้งเตือนผู้วิจัย ไม่เดินต่อเงียบ ๆ
- [ ] **หน้า transparency ของ proxy** — ถ้าเลือก R03/R07/R08/R16/R17 ต้องดึงข้อความจาก `09_Proxy_Mapping_Log`

### 2.5 Workflow E — `SUB_GapEngine` (11 nodes) ⏱ 22 ชม. 🔴 **แกนของงานวิจัย**

- [ ] Build Gap Prompt เดียวกันทั้ง 3 โมเดล (30 requirement + profile + evidence corpus **ที่รวม profile JSON**)
- [ ] เรียก 3 analyst ขนาน: GLM 5.2 · Claude Sonnet 5 · Gemini 3.7 Flash — **temp = 0 ทุกตัว** (DEC-04) · บันทึก `reasoning_config` และ `reasoning_tokens` ทุกครั้ง
- [ ] Tag + Parse A/B/C แยกโหนด → Merge (⚠ **ห้ามใส่ Merge บน IF branch**)
- [ ] **Deterministic Cross-Validation ด้วยโค้ดล้วน** — ห้ามมี LLM ในชั้นนี้:
  - [ ] **R0 · Role membership** — `requirement_id.startswith("REQ-" + role_id + "-")` และอยู่ในชุด 30 → ถ้าไม่ ตัดออกเป็น out-of-scope **ก่อนนับเสียง**
  - [ ] **R1 · Agreement** — เสียงข้างมาก · แยกสถานะ `no_majority_agreement_tied` ออกจากกรณีอื่น
  - [ ] **R2 · Verbatim evidence** — substring check กับ evidence corpus
  - [ ] **R3 · Evidence Relevance** — overlap ระหว่างหลักฐานกับ `element_name + description + aliases` เทียบ `THETA`
- [ ] Confidence Tier · `excluded_reason` ทุกรายการที่ถูกตัด (ต้องใช้คำนวณ recall cost)
- [ ] **Readiness** — เหนือ validated เท่านั้น · excluded ไม่เข้าทั้งเศษและส่วน · รายงานคู่กับ `n_validated`/`n_excluded` และ `weight_share_of_pool`
- [ ] เขียน unit test ของกฎ R0–R3 ด้วย fixture ที่แต่งขึ้น (10 เคส) — **ทำก่อนต่อ API จริง**

### 2.6 Workflow F — Ranking & Pathway (13 nodes) ⏱ 14 ชม. 🔴

- [ ] Claude Sonnet 5 (temp 0) จัดอันดับ **จาก whitelist ของ corpus เท่านั้น**
- [ ] Code post-validation: ตัดรายการที่ไม่อยู่ใน corpus ทิ้งทันที (เป็นตัวชี้วัด whitelist compliance)
- [ ] Pathway ด้วยโค้ดล้วน — `capacity = timeline × 4.33 × ชม./สัปดาห์` · ห้ามเกิน mode/timeline/workload

### 2.7 Workflow G — Report (9 nodes) ⏱ 12 ชม. 🟡

- [ ] GPT-5.6 Terra (temp 0.2) เขียนรายงานจากข้อมูลที่ผ่าน validation แล้วเท่านั้น
- [ ] **คุมความแปรผัน** — word budget ต่อ section (สำคัญต่อ RQ3)
- [ ] **Reference Check** + fallback template ถ้ารายงานอ้างถึงสิ่งที่ไม่มีใน corpus
- [ ] หน้า transparency (proxy + ข้อจำกัด + คำอ้างอิง O\*NET CC BY 4.0)
- [ ] ส่งอีเมล + log

### 2.8 Workflow H — Evaluation (11 nodes) ⏱ 12 ชม. 🟡

- [ ] อ่าน ground truth + `model_a/b/c_result` + `validated_result` + `report_log`
- [ ] คำนวณ C1–C4 (baseline เดี่ยว 3 + framework) · C5 tradeoff · C6 extraction
- [ ] **C7–C9 ablation คำนวณจาก log ที่มีอยู่ ไม่เรียก API เพิ่ม**
- [ ] export CSV ให้สคริปต์วิเคราะห์

### 2.9 Workflow I — Error Notifier (2 nodes) + ผูกครบ ⏱ 2 ชม. 🔴

- [ ] Error Trigger → แจ้งเตือน
- [ ] **ผูกเป็น Error Workflow ในทุก workflow รวม `SUB_GapEngine`** · error แยกชีตต่างหาก

### 2.10 Replay Harness ⏱ 8 ชม. 🟡

- [ ] สคริปต์คำนวณผลใหม่จาก raw log **โดยไม่ต้องมี API key** — join ด้วย `requirement_id` ตรง ๆ
- [ ] เป็นเงื่อนไขของ artifact release และของ ablation C7–C9

### 2.11 ทดสอบ end-to-end ด้วยเรซูเมของตัวเอง ⏱ 6 ชม. 🔴

- [ ] รันจบตั้งแต่ Form → รายงานเข้าอีเมล อย่างน้อย 3 รอบ ต่างบทบาท ต่าง mode ต่าง timeline
- [ ] ตรวจว่า `audit_log` เก็บครบ: `model_id`, `prompt_version`, `reasoning_config`, token usage, `access_date`

---

## Phase 3 · Pilot และการปรับเทียบ (W8–W9 · 19 ต.ค. – 1 พ.ย.) ⏱ 52 ชม.

**เป้าหมาย:** ตรึงพารามิเตอร์ทุกตัวก่อนแตะข้อมูลจริง

### 3.1 🔴 PROTOCOL-01 — พิสูจน์ reasoning parity ด้วยตัวเลข ⏱ 6 ชม.

- [ ] ยิงชุด prompt เดียวกัน ≥ 20 ครั้งต่อโมเดล บันทึก `reasoning_tokens` จริง
- [ ] เกณฑ์: `reasoning_tokens` ≤ **5%** ของ output token
- [ ] ⚠ ระวังตัวเชื่อมที่แปลง `disabled` เป็น `low` เงียบ ๆ — ต้องดูตัวเลข ไม่ใช่ดูว่า API ไม่ error
- [ ] ทำตารางผลใส่ ภาคผนวก ข · ถ้าไม่ผ่านให้บันทึกเป็นข้อจำกัดใน §5.3 แล้วเดินต่อ

### 3.2 🔴 Pilot 5 คน (นอกกลุ่มตัวอย่างจริง) ⏱ 16 ชม.

- [ ] รับ 5 เรซูเมจริง ครอบคลุมอย่างน้อย 3 บทบาทและ 2 recommendation mode
- [ ] วัด `evidence_verified_ratio` — เกณฑ์ **≥ 0.90** 🚦 GATE-P
- [ ] ถ้าไม่ผ่าน → ยกระดับโมเดล parse ตาม SA v3 §2.4.1 แล้ววัดซ้ำ
- [ ] เก็บเวลาที่ผู้เข้าร่วมใช้ยืนยัน 30 ข้อจริง (เป้า 12–15 นาที) — ถ้าเกิน 20 นาทีต้องปรับ UI

### 3.3 🔴 จูนและ 🧊 FREEZE พารามิเตอร์ ⏱ 12 ชม.

- [ ] จูน **THETA** ด้วย n8n Evaluations บน pilot — หาจุดที่ recall cost ต่ำสุดโดย hallucination ไม่ขึ้น
- [ ] จูน **word budget** ของรายงานให้ความยาวคงที่พอสำหรับ RQ3
- [ ] ตัดสินระดับโมเดลที่ใช้ parse ตามเกณฑ์ `evidence_verified_ratio`
- [ ] 🧊 **FREEZE prompt ทั้ง 6 ตัว** พร้อม `prompt_version` — ห้ามแก้หลังจากนี้
- [ ] 🧊 **FREEZE THETA** และบันทึกค่าลง `dataset_version_log`

### 3.4 Golden set และ n8n Evaluations ⏱ 8 ชม. 🟡

- [ ] สร้าง golden set 15–20 ชุด (input + expected output ที่ผู้วิจัยตรวจแล้ว)
- [ ] ตั้ง n8n Evaluation ให้รัน golden set ได้ตามสั่ง
- [ ] ⚠ **ข้อห้ามสำคัญที่สุด: ห้ามใช้ Evaluations กับข้อมูลของผู้เข้าร่วมจริง** — ใช้กับ pilot และ golden set เท่านั้น

### 3.5 Pilot แบบสอบถาม ⏱ 6 ชม. 🟡

- [ ] ให้ผู้ร่วม pilot 5 คนตอบแบบสอบถามจริง
- [ ] ตรวจความเข้าใจข้อคำถาม แก้ถ้อยคำที่กำกวม
- [ ] คำนวณ Cronbach's alpha เบื้องต้นต่อ construct (n=5 ยังตีความไม่ได้ แต่จับข้อที่พังได้)
- [ ] 🧊 FREEZE แบบสอบถาม

### 3.6 🔴 รับสมัครผู้เข้าร่วมจริง ⏱ 4 ชม. (เริ่ม W6 ถ้าจริยธรรมอนุมัติแล้ว)

- [ ] โพสต์ประกาศ · ตอบคำถาม · คัดกรองคุณสมบัติ
- [ ] ยืนยันนัดหมาย 30 คน + สำรอง 15 คน
- [ ] ส่ง PIS ล่วงหน้าให้อ่านก่อนวันจริง

---

## Phase 4 · เก็บข้อมูลจริง (W10–W12 · 2–22 พ.ย.) ⏱ 56 ชม.

**เป้าหมาย:** ได้ข้อมูล 30 คู่ที่สมบูรณ์ ภายในหน้าต่าง ≤ 3 สัปดาห์ตามที่เล่มสัญญาไว้

> 🚦 เข้าเฟสนี้ได้ก็ต่อเมื่อผ่าน **GATE-E** (จริยธรรม) **GATE-C** (corpus) และ **GATE-P** (pilot) ครบทั้งสาม

### 4.1 การเก็บข้อมูล ⏱ 16 ชม. 🔴

- [ ] เปิดรับ submission — ติดตามรายวัน ใครยังไม่ส่งให้ตามภายใน 48 ชม.
- [ ] ตรวจ `audit_log` ทุกวัน — execution ล้มเหลวต้องรู้ภายในวันนั้น
- [ ] เก็บ raw response ของทั้ง 3 โมเดลครบทุกราย (จำเป็นสำหรับ ablation)
- [ ] ผู้เข้าร่วมยืนยันชุด 30 ข้อ → นี่คือ ground truth ฝั่งผู้เข้าร่วม
- [ ] เก็บแบบสอบถามหลังได้รับรายงาน

### 4.2 🔴 Ground truth annotation โดยผู้วิจัย ⏱ 26 ชม.

- [ ] annotate 30 เรซูเม × 30 requirement = **900 การตัดสิน** (~1.5 นาที/ข้อ ≈ 23 ชม.)
- [ ] annotate ชุดสกัดทักษะสำหรับ C6 (extraction P/R/F1)
- [ ] **intra-rater** — ตรวจซ้ำ 20% (180 ข้อ) หลังเว้นระยะ ≥ 2 สัปดาห์ → Cohen's kappa
- [ ] **inter-rater** — ผู้ตรวจคนที่สอง 20% (180 ข้อ) อิสระ → Cohen's kappa
- [ ] 🧊 FREEZE ground truth

### 4.3 Repeat-run stability ⏱ 6 ชม. 🟡

- [ ] รันซ้ำ **k=3** ด้วย config เดียวกันบน **subsample 20%** (6 ราย)
- [ ] บันทึกความสอดคล้องระหว่างรอบ — จำเป็นแม้ปิด reasoning เพราะผู้ให้บริการไม่รับประกัน determinism

### 4.4 🧊 ปิดการเก็บข้อมูล ⏱ 8 ชม. 🔴

- [ ] ตรวจความครบถ้วน: ทุกรายมี profile · 3 model results · validated result · report · แบบสอบถาม
- [ ] ตัดรายที่ไม่สมบูรณ์ออกพร้อมบันทึกเหตุผล (ต้องรายงานใน บทที่ 4)
- [ ] 🚦 **GATE-D** — FREEZE ห้ามรับเพิ่ม
- [ ] สำรองข้อมูลทั้งหมด 2 ที่

---

## Phase 5 · วิเคราะห์ผล (W13–W14 · 23 พ.ย. – 6 ธ.ค.) ⏱ 46 ชม.

### 5.1 เขียน `analysis_v5.py` ⏱ 16 ชม. 🔴 (ปิด D-4)

ต่อยอดจาก `analysis.py` เดิม แต่ต้องเพิ่มให้ครบ 12 วิธีตาม SA v3 §12.4

- [ ] แก้ชื่อ baseline เป็น `GLM-5.2`, `Claude-Sonnet-5`, `Gemini-3.7-Flash`
- [ ] Wilcoxon signed-rank + effect size `r = Z/√n` (มีอยู่แล้ว)
- [ ] 🆕 **Holm–Bonferroni** — 3 การเปรียบเทียบ × 3 metric = 9 การทดสอบ **รายงานทั้ง p ดิบและ p ปรับแล้ว**
- [ ] 🆕 **Bootstrap 95% CI** — 10,000 รอบ seed ตรึง
- [ ] 🆕 **Fleiss' kappa** — inter-model agreement บน 30 × 30 = 900 หน่วย
- [ ] 🆕 **Confidence calibration** — confidence ที่โมเดลรายงาน vs ความถูกต้องจริง
- [ ] 🆕 **Repeat-run consistency**
- [ ] 🆕 **Power/sensitivity** — effect size ที่ n=30 ตรวจจับได้ที่ power 0.80
- [ ] 🆕 **Out-of-Scope Claim Rate** แยกรายงาน (ควรเป็น 0 สำหรับ FRAMEWORK)
- [ ] Cohen's kappa (intra + inter) · Cronbach's alpha · Spearman (trust ↔ intention)

### 5.2 รัน conditions ทั้งหมด ⏱ 10 ชม. 🔴

- [ ] C1–C6 จาก log ที่มี
- [ ] C7–C9 **ablation ladder** — agreement only → + evidence → + relevance (ไม่เรียก API)
- [ ] **C10 Robustness** — สุ่ม 10 เรซูเมด้วย seed ที่บันทึก · รัน 3 โมเดลด้วย reasoning เปิดต่ำสุด (30 API calls) · ผ่าน validation เดิม · เทียบทิศทาง
- [ ] ตรวจ **เกณฑ์ a priori**: hallucination rate ของ framework ต่ำกว่าทุก baseline **และ** recall cost ≤ 10%

### 5.3 ตารางและกราฟสำหรับ บทที่ 4 ⏱ 14 ชม. 🔴

- [ ] ตารางเปรียบเทียบ 4 conditions (mean ± SD · p ดิบ · p Holm · r · 95% CI)
- [ ] ตาราง ablation ladder
- [ ] ตาราง calibration
- [ ] ตาราง cost / latency ต่อ condition
- [ ] ตาราง Fleiss' κ · Cohen's κ (intra/inter)
- [ ] ตาราง 2×2 recall cost / false exclusion
- [ ] ผลแบบสอบถาม 6 construct + Cronbach's alpha + Spearman
- [ ] ตาราง w-share ต่อบทบาท (จาก Guideline §3.2 ฉบับหลัง DEC-07) → **ต้องอยู่ในภาคผนวก**

### 5.4 ตรวจสอบผล ⏱ 6 ชม. 🔴

- [ ] คำนวณ metric อย่างน้อย 2 ตัวซ้ำด้วยมือ/สคริปต์แยก เทียบกับผลของ Workflow H
- [ ] รัน replay harness แล้วยืนยันว่าได้ตัวเลขเดียวกันจาก raw log
- [ ] ตรวจว่าไม่มีค่าที่ขัดกันเองระหว่างตาราง

---

## Phase 6 · เรียบเรียงและส่ง (W15–W17 · 7–27 ธ.ค.) ⏱ 76 ชม.

### 6.1 บทที่ 4 ผลการวิจัย ⏱ 26 ชม. 🔴

- [ ] 4.1 ลักษณะกลุ่มตัวอย่างและอัตราการตอบกลับ
- [ ] 4.2 ผล RQ1 — extraction P/R/F1 · gap accuracy
- [ ] 4.3 ผล RQ2 — hallucination rate · out-of-scope rate · recall cost · false exclusion · Fleiss' κ · ablation
- [ ] 4.4 ผล RQ3 — recommendation validity 5 ตัว + acceptance 6 construct
- [ ] 4.5 ผลเสริม — calibration · repeat-run · cost/latency

### 6.2 บทที่ 5 สรุปและอภิปราย ⏱ 20 ชม. 🔴

- [ ] สรุปตาม RQ ทีละข้อ
- [ ] อภิปรายเทียบวรรณกรรม บทที่ 2
- [ ] **ย่อหน้า C10 robustness** (อยู่ใน Discussion ไม่ใช่ผลการวิจัย) — พร้อมข้อควรระวังว่า n=10 ไม่มี power
- [ ] ข้อจำกัด: n=30 · บริบทไทย · proxy 5 บทบาท · ตัดกลุ่ม Abilities (DEC-07) · ปิด reasoning · corpus 400 รายการ
- [ ] ข้อเสนอแนะ + เส้นทางสู่ enterprise (SA v3 §19)

### 6.3 Artifact และ DOI ⏱ 12 ชม. 🟡

- [ ] workflow JSON ทั้ง 8 · prompt ทั้ง 6 ตัว พร้อม `prompt_version`
- [ ] `onet_requirements.csv` · `element_aliases.csv` · `excluded.csv` · `role_map.json` · `dataset_version_log.json`
- [ ] `build_onet_requirements.py` · `analysis_v5.py` · **replay harness**
- [ ] codebook + แบบสอบถาม (ฉบับที่เผยแพร่ได้)
- [ ] ข้อความอ้างอิง O\*NET CC BY 4.0
- [ ] ⚠ **ห้ามใส่ข้อมูลผู้เข้าร่วมหรือเรซูเม** — ใส่เฉพาะ log ที่ปกปิดแล้ว
- [ ] ฝากที่ Zenodo/OSF → ได้ DOI → ใส่ในเล่ม

### 6.4 ตรวจสอบและส่ง ⏱ 18 ชม. 🔴

- [ ] รัน `check_consistency.py` ครั้งสุดท้ายทุกไฟล์
- [ ] ตรวจว่าทุกตัวเลขในเล่มตรงกับตารางผล และตรงกับ CSV ต้นทาง
- [ ] ตรวจการอ้างอิงครบ ไม่มีเลขข้าม
- [ ] ตรวจภาพ 3.1–3.3 คมชัด มีคำบรรยาย และอ้างถึงในเนื้อความ
- [ ] อัปเดตสารบัญ/สารบัญตาราง/สารบัญภาพ
- [ ] ตรวจรูปแบบตามข้อกำหนดบัณฑิตวิทยาลัย KMITL
- [ ] ส่งอาจารย์ที่ปรึกษาอ่านรอบสุดท้าย → แก้ตามความเห็น
- [ ] **ส่ง** 🎓

---

# ส่วนที่ 4 · Timeline

## 4.1 ภาพรวมรายสัปดาห์

| W | วันที่ | Phase | งานหลัก | ⏱ |
|---|---|---|---|---:|
| **1** | 31 ส.ค. – 6 ก.ย. | P0 + P1 | 🔴 git/archive · ดึงไฟล์ Project ลงเครื่อง · **ยิงเอกสารจริยธรรม** · **อีเมล Z.ai เรื่อง EOL** | 26 |
| **2** | 7–13 ก.ย. | P0 + P1 | Merge DEC-07 เข้าเล่ม · แก้ Guideline + SA · `check_consistency.py` · ตรวจ documentation 10 ข้อ | 24 |
| **3** | 14–20 ก.ย. | P1 → **GATE-0, GATE-01** | 🧊 FREEZE ชุดข้อมูล · สร้าง Sheets 5 กลุ่ม + model_registry · Google Form | 26 |
| **4** | 21–27 ก.ย. | P2 | Workflow A · เริ่ม B+C · codebook | 24 |
| **5** | 28 ก.ย. – 4 ต.ค. | P2 | รัน B+C ครบ 20 บทบาท · **เริ่มทวนสอบ corpus** · Workflow D | 26 |
| **6** | 5–11 ต.ค. | P2 (+รับสมัคร) | `SUB_GapEngine` + unit test กฎ R0–R3 · ทวนสอบ corpus (ต่อ) · **เริ่มรับสมัคร** | 28 |
| **7** | 12–18 ต.ค. | P2 → **GATE-C** | Workflow F, G, H, I · replay harness · 🧊 FREEZE corpus · ทดสอบ end-to-end | 28 |
| **8** | 19–25 ต.ค. | P3 | PROTOCOL-01 · pilot 5 คน · หาผู้ตรวจคนที่สอง | 26 |
| **9** | 26 ต.ค. – 1 พ.ย. | P3 → **GATE-P** | จูน + 🧊 FREEZE THETA/prompt/word budget · golden set · pilot แบบสอบถาม | 26 |
| **10** | 2–8 พ.ย. | P4 → **GATE-D เริ่ม** | 🔴 เก็บข้อมูลสัปดาห์ที่ 1 (เป้า 12 ราย) · annotate ตามหลัง | 26 |
| **11** | 9–15 พ.ย. | P4 | 🔴 เก็บข้อมูลสัปดาห์ที่ 2 (เป้าสะสม 24 ราย) · annotate | 26 |
| **12** | 16–22 พ.ย. | P4 → **GATE-D ปิด** | 🔴 เก็บข้อมูลสัปดาห์ที่ 3 (ครบ 30) · repeat-run k=3 · 🧊 FREEZE | 22 |
| **13** | 23–29 พ.ย. | P4 + P5 | annotate ให้จบ · intra/inter-rater · เขียน `analysis_v5.py` | 26 |
| **14** | 30 พ.ย. – 6 ธ.ค. | P5 | รัน C1–C10 · สร้างตารางและกราฟ · ตรวจสอบผล | 26 |
| **15** | 7–13 ธ.ค. | P6 | 🔴 เขียน บทที่ 4 | 28 |
| **16** | 14–20 ธ.ค. | P6 | 🔴 เขียน บทที่ 5 · artifact + DOI | 28 |
| **17** | 21–27 ธ.ค. | P6 | ตรวจสอบทั้งเล่ม · แก้ตามอาจารย์ · **ส่ง** | 24 |
| | | | **รวม** | **~440** |

## 4.2 เส้นคู่ขนาน (Swimlane)

```
สัปดาห์   1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17
เอกสาร   ██ ██ ▓░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ██ ██ ██
จริยธรรม ██ ▒▒ ▒▒ ▒▒ ▒▒ ▒▒ ▒▒ ▒▒ →GATE-E (คาดอนุมัติ W6–W9)
ข้อมูล   ░░ ▓▓ 🧊 ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░
ระบบ     ░░ ░░ ▓▓ ██ ██ ██ ██ ▓▓ ▓▓ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░
corpus   ░░ ░░ ░░ ░░ ██ ██ 🧊 ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░
คน       ░░ ░░ ░░ ░░ ░░ ▓▓ ▓▓ ██ ██ ██ ██ ██ ▓▓ ░░ ░░ ░░ ░░
วิเคราะห์ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ░░ ▓▓ ██ ▓▓ ░░ ░░

██ งานหนัก   ▓▓ งานเบา/คู่ขนาน   ▒▒ รอผู้อื่น   🧊 จุดตรึง   ░░ ว่าง
```

## 4.3 สรุปแรงงานตามเฟส

| Phase | ชื่อ | ⏱ ชม. | % | สัปดาห์ |
|---|---|---:|---:|---|
| P0 | รวมสายเอกสาร | 20 | 5% | W1–W2 |
| P1 | จริยธรรม + ตรึงข้อมูล + โครงพื้นฐาน | 58 | 14% | W1–W3 |
| P2 | สร้างระบบ + corpus | 132 | 32% | W3–W7 |
| P3 | pilot + ปรับเทียบ | 52 | 13% | W8–W9 |
| P4 | เก็บข้อมูลจริง | 56 | 14% | W10–W13 |
| P5 | วิเคราะห์ | 46 | 11% | W13–W14 |
| P6 | เรียบเรียง + ส่ง | 76 | 18% | W15–W17 |
| | **รวม** | **~440** | 100% | 17 สัปดาห์ |

> **หมายเหตุความเป็นจริง:** 440 ชม. ÷ 17 สัปดาห์ = **~26 ชม./สัปดาห์** ซึ่งเท่ากับงานพาร์ทไทม์เต็มเวลา ไม่มี buffer สำหรับความล่าช้า ถ้าทำได้จริง ~20 ชม./สัปดาห์ ต้องตัดตามข้อ 8 ตั้งแต่ต้น ไม่ใช่ตอนเดือนธันวาคม

## 4.4 งานสามอย่างที่กินเวลามากที่สุด — วางแผนไว้ล่วงหน้า

| งาน | ⏱ | ทำไมนาน | วิธีลด |
|---|---:|---|---|
| ทวนสอบ corpus ด้วยมือ ~400 รายการ | 22 ชม. | ต้องเปิด URL ทุกอัน | แบ่งทำวันละ 30 รายการ 13 วัน · ทำคู่ขนานกับการเขียน workflow |
| Ground truth annotation 900 + 360 | 26 ชม. | ~1.5 นาที/ข้อ ห้ามรีบ | annotate ตามหลังการเก็บข้อมูลทันที ไม่รอครบ 30 คน |
| เขียน `SUB_GapEngine` + test | 22 ชม. | เป็นแกนของงานวิจัย ผิดไม่ได้ | เขียน unit test ของ R0–R3 ด้วย fixture ก่อนต่อ API จริง |

---

# ส่วนที่ 5 · Definition of Done ต่อเฟส

| Phase | ถือว่าเสร็จเมื่อ |
|---|---|
| **P0** | `check_consistency.py` ผ่านทั้ง 5 ไฟล์ · ไม่มีคำว่า `52.2`, `ห้ากลุ่ม`, `ChatGPT 5.5`, `Gemini 3.1`, `Hybrid Verifier` เหลืออยู่ในไฟล์ปัจจุบัน · อาจารย์ยืนยัน DEC-07 เป็นลายลักษณ์อักษร · git มี commit |
| **P1** | ส่งคำขอจริยธรรมแล้ว (มีเลขรับ) · GATE-01 ตัดสินแล้ว (ผ่านหรือพลิกไป 5.3) · `dataset_version_log` ครบ 4 องค์ประกอบ · Sheets 5 กลุ่ม + model_registry 7 แถวพร้อม · Form ทดสอบส่งได้จริง |
| **P2** | ทั้ง 8 workflow import เข้า n8n แล้วรันจบ · Error Workflow ผูกครบทุกตัว · corpus ≈400 รายการ ตรวจแล้ว 🧊 FREEZE · unit test R0–R3 ผ่าน · replay harness คำนวณผลจาก log ได้ · รัน end-to-end 3 รอบสำเร็จ |
| **P3** | PROTOCOL-01 มีตัวเลข · `evidence_verified_ratio` ≥ 0.90 · THETA + prompt 6 ตัว + word budget 🧊 FREEZE · golden set 15–20 ชุด · แบบสอบถามผ่าน pilot |
| **P4** | n ≥ 30 คู่สมบูรณ์ · ground truth 900 + intra 180 + inter 180 ครบ · repeat-run k=3 บน 6 ราย · 🧊 FREEZE · สำรอง 2 ที่ |
| **P5** | ครบ 12 วิธีวิเคราะห์ตาม §12.4 · C1–C10 ครบ · ตาราง 8 ชุด · replay harness ให้ตัวเลขตรงกับ Workflow H |
| **P6** | บทที่ 4–5 ครบ · artifact มี DOI · สารบัญอัปเดต · อาจารย์อนุมัติ · ส่ง |

---

# ส่วนที่ 6 · Cadence การทำงาน

| จังหวะ | ทำอะไร | ⏱ |
|---|---|---|
| **ทุกวันที่ทำงาน** | เปิด checklist นี้ ติ๊กสิ่งที่เสร็จ จดสิ่งที่ติด | 5 นาที |
| **ทุกวันศุกร์** | รัน `check_consistency.py` · commit git พร้อมข้อความที่อ่านรู้เรื่อง · อัปเดต ⏱ จริงเทียบประมาณการ | 30 นาที |
| **ทุก 2 สัปดาห์** | รายงานอาจารย์ 1 หน้า: เสร็จอะไร · ติดอะไร · GATE ไหนใกล้ถึง | 1 ชม. |
| **ทุกจุด 🧊 FREEZE** | คำนวณ checksum · บันทึกวันที่ · commit tag · แจ้งอาจารย์ | 30 นาที |
| **ทุกครั้งที่ตัดสินใจ** | เพิ่ม DEC-nn ใน `DECISIONS.md` พร้อมเหตุผลและวิธีย้อนกลับ | 15 นาที |

---

# ส่วนที่ 7 · ทะเบียนความเสี่ยง

| # | ความเสี่ยง | โอกาส | ผลกระทบ | สัญญาณเตือนล่วงหน้า | แผนรับมือ |
|---|---|---|---|---|---|
| R-1 | **จริยธรรมอนุมัติช้ากว่า W9** | สูง | รุนแรงที่สุด | ยังไม่ได้เลขรับภายใน W2 · รอบประชุมกรรมการห่างเกิน 6 สัปดาห์ | ติดต่อเลขานุการกรรมการตั้งแต่ W1 ถามรอบประชุม · เตรียมแผน synthetic resume ไว้ตั้งแต่ W6 · ปรึกษาอาจารย์เรื่องลดขอบเขต RQ3 |
| R-2 | **หาผู้เข้าร่วมไม่ครบ 30 คน** | ปานกลาง | สูง | สมัครได้ < 20 คนภายในสิ้น W8 | รายชื่อสำรอง 45 คน · ขยายช่องทาง (ศิษย์เก่า ชุมชนออนไลน์) · ถ้า n < 30 ให้รายงาน sensitivity analysis แทนการยืดเวลา |
| R-3 | **`glm-5.2` ถูก retire กลางทาง** | ปานกลาง | สูง | ประกาศ EOL · error rate ขึ้น · latency แปลก | GATE-01 ตั้งแต่ W1 · Model Version Drift Policy (SA v3 §13.4) · ถ้าเกิดหลังเริ่มเก็บข้อมูลให้หยุดทันที บันทึกวัน แล้วรายงานเป็นข้อจำกัด **ห้ามผสมสองรุ่นในชุดข้อมูลเดียว** |
| R-4 | **corpus ทวนสอบไม่ทัน** | สูง | ปานกลาง | สิ้น W6 ตรวจได้ < 200 รายการ | เริ่มตรวจทันทีที่ B+C รันเสร็จ ไม่รอครบ · ลดเป้าเป็น 300 รายการแล้วรายงานข้อจำกัด |
| R-5 | **`evidence_verified_ratio` ต่ำกว่า 0.90** | ปานกลาง | สูง | pilot รายแรก ๆ ให้ค่า < 0.85 | ยกระดับโมเดล parse (SA v3 §2.4.1) · ปรับ prompt P1 · ตรวจว่า evidence corpus รวม profile JSON แล้วจริง |
| R-6 | **recall cost เกิน 10%** | ปานกลาง | ปานกลาง | pilot แสดง exclusion สูงผิดปกติ | จูน THETA ระหว่าง pilot · ตรวจว่า alias ครอบคลุมพอ · ถ้ายังเกินให้รายงานตรงไปตรงมาเป็นผลการวิจัย (เป็นข้อค้นพบ ไม่ใช่ความล้มเหลว) |
| R-7 | **งบ API เกิน** | ต่ำ | ปานกลาง | cost/submission จริงเกินประมาณการ 50% | คำนวณล่วงหน้าใน 1.2 · ตั้ง budget alert ทุกค่าย · C10 เป็นตัวเลือกแรกที่ตัดได้ |
| R-8 | **เอกสารแตกสายอีกรอบ** | ปานกลาง | สูง | มีไฟล์ชื่อคล้ายกันหลายรุ่นในโฟลเดอร์ | `check_consistency.py` ทุกศุกร์ · กติกา "หนึ่งไฟล์ปัจจุบันต่อประเภท" · git commit ทุกสัปดาห์ |
| R-9 | **ผู้วิจัยทำงานได้น้อยกว่า 26 ชม./สัปดาห์** | สูง | สูง | สิ้น W3 ยังไม่ผ่าน GATE-0 | ตัดตามข้อ 8 **ตั้งแต่ W4** ไม่ใช่รอถึงธันวาคม |

---

# ส่วนที่ 8 · ถ้าไม่ทัน จะตัดอะไร (เรียงลำดับ)

> เขียนไว้ล่วงหน้าเพื่อไม่ให้ตัดสินใจตอนตื่นตระหนก ตัดจากบนลงล่าง **ห้ามข้ามไปตัดข้อล่างก่อน**

| ลำดับ | ตัดอะไร | ประหยัด | ต้นทุน |
|---|---|---:|---|
| 1 | **C10 robustness check** | 6 ชม. | เสียการตอบข้อโต้แย้งเรื่องปิด reasoning ล่วงหน้า — ย้ายไป future work |
| 2 | **Confidence calibration** | 4 ชม. | ตัวชี้วัดเสริม ไม่ผูกกับ RQ ใด |
| 3 | **ลด corpus 400 → 300 รายการ** | 8 ชม. | gap coverage ต่ำลง ต้องรายงานเป็นข้อจำกัด |
| 4 | **Repeat-run k=3 → k=2** | 3 ชม. | ความมั่นใจเรื่อง determinism ลดลง |
| 5 | **inter-rater 20% → 10%** | 5 ชม. | ⚠ กระทบความน่าเชื่อถือของ ground truth — ตัดเป็นทางเลือกสุดท้าย |

**ห้ามตัดเด็ดขาด:** ablation C7–C9 (ตอบ RQ2 โดยตรงและไม่มีต้นทุน API) · intra-rater · Holm correction · out-of-scope claim rate · replay harness · หน้า transparency ของ proxy

---

# ส่วนที่ 9 · รายการสิ่งส่งมอบทั้งหมด

| # | สิ่งส่งมอบ | เฟส | สถานะวันนี้ |
|---|---|---|---|
| 1 | `DECISIONS.md` | P0 | 🟨 มี `DECISIONS_31AUG26.md` (DEC-09…11) · ต้องรวม DEC-01…08 เข้ามา |
| 2 | `check_consistency.py` | P0 | 🟨 มี `check_corpus_31AUG26.py` แล้วสำหรับฝั่ง corpus · ยังต้องเขียนตัวตรวจความสอดคล้องของเอกสาร |
| 3 | เล่มฉบับ merge DEC-07 | P0 | 🟨 มีฉบับ 29AUG26_v1 แต่ยังไม่ merge |
| 4 | `Guideline_n8n_v5` · `System_Architecture_v4` | P0 | 🟨 มีฉบับก่อนแก้ |
| 5 | ชุดเอกสารจริยธรรม (PIS · consent · PDPA · data governance) | P1 | ⬜ ยังไม่มี |
| 6 | `dataset_version_log.json` ฉบับตรึงจริง | P1 | 🟨 มีร่างใน Project · ยังไม่มี `frozen_at` จริง |
| 7 | Google Sheets 5 กลุ่ม + `model_registry` | P1 | ⬜ ยังไม่มี |
| 8 | Google Form | P1 | ⬜ ยังไม่มี |
| 9 | Codebook + แบบสอบถาม | P1 | ⬜ ยังไม่มี |
| 10 | Workflow JSON ทั้ง 8 (A, B+C, D, E, F, G, H, I) | P2 | 🟥 มีของสถาปัตยกรรมเก่า 4 ไฟล์ ต้องสร้างใหม่ |
| 11 | `recommendation_master` ~400 รายการ ตรวจแล้ว | P2 | 🟨 **มี 431 รายการแล้ว (31 ส.ค.)** · ตรวจโครงสร้างผ่านครบ · ยังไม่ตรวจ URL |
| 12 | Unit test กฎ R0–R3 | P2 | ⬜ ยังไม่มี |
| 13 | Replay harness | P2 | ⬜ ยังไม่มี |
| 14 | ตาราง PROTOCOL-01 | P3 | ⬜ ยังไม่มี |
| 15 | Prompt 6 ตัว ฉบับตรึง + `prompt_version` | P3 | 🟨 มีร่างในไฟล์ JSON เก่า |
| 16 | Golden set 15–20 ชุด | P3 | ⬜ ยังไม่มี |
| 17 | ข้อมูลดิบ 30 ราย + ground truth 900 | P4 | ⬜ ยังไม่มี |
| 18 | `analysis_v5.py` | P5 | 🟨 มี `analysis.py` ที่ล้าสมัย |
| 19 | ตารางผล 8 ชุด | P5 | ⬜ ยังไม่มี |
| 20 | เล่มฉบับสมบูรณ์ บทที่ 1–5 + ภาคผนวก ก–จ | P6 | 🟨 มี บทที่ 1–3 + ก–ง |
| 21 | Artifact + DOI | P6 | ⬜ ยังไม่มี |

---

# ส่วนที่ 10 · สามสิ่งที่ต้องทำก่อนปิดคอมพิวเตอร์วันนี้

1. **ส่งอีเมลถาม Z.ai เรื่อง EOL ของ `glm-5.2`** — ใช้เวลา 15 นาที แต่ผลตอบกลับใช้เวลาเป็นสัปดาห์ (GATE-01)
2. **ค้นหารอบประชุมและ deadline ส่งของคณะกรรมการจริยธรรม KMITL** — ตัวเลขนี้กำหนดวันจบของโครงการมากกว่าตัวแปรอื่นใด
3. **`git init` + commit `baseline-29AUG26`** — ก่อนแตะไฟล์ใด ๆ เพื่อให้ย้อนกลับได้เสมอ

---

*เอกสารนี้จัดทำจากการอ่านไฟล์จริงทั้งโฟลเดอร์ `IS - n8n resume analysis` และ Project docs ทั้ง 21 ฉบับเมื่อ 29 สิงหาคม 2026 · ตัวเลขทุกตัวตรวจสอบกลับได้ถึงไฟล์ต้นทาง · ปรับปรุงเอกสารนี้ทุกครั้งที่ผ่าน GATE*
