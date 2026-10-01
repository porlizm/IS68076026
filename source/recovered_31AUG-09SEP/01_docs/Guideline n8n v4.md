# Guideline n8n v4.md
## คู่มือพัฒนาระบบ (ฉบับ Baseline) — **การตัดสินใจปิดครบแล้ว**

**งาน:** A Multi-Model Generative-AI Framework for Reducing Hallucination in Resume-Based Skill-Gap Analysis and Personalized Learning Pathways
**ผู้วิจัย:** ดนุสรณ์ อนันตกาล (68076026) · ITM · KMITL · อาจารย์ที่ปรึกษา: ผศ.ดร.สุภกิจ นุตยะสกุล
**เอกสารฐาน:** `IS_68076026(28AUG26).docx` · `Data_Set.xlsx` (O\*NET 31.0 · ส.ค. 2026 · CC BY 4.0)
**เอกสารประกอบ:** `System Architecture v3.md` · `onet_requirements.csv` (600 แถว สร้างแล้ว)
**วันที่:** 28 สิงหาคม 2026 · **สถานะ:** Baseline — เริ่มพัฒนาได้ทันที

---

# 0. บันทึกการตัดสินใจ (ปิดครบแล้ว)

| # | คำถาม | **ผลการตัดสิน** | ผลที่ตามมา |
|---|---|---|---|
| **DEC-01** | GLM 5.2 หรือ 5.3 | **GLM 5.2 + ปิด reasoning** | ได้ config parity · ⚠ ต้องผ่าน GATE-01 เรื่อง EOL (§9) |
| **DEC-02** | รายชื่อ 20 บทบาท | **ยึด `Data_Set.xlsx` → `01_Role_Master`** | ภาคผนวก ก สร้างใหม่แล้ว + เพิ่ม ก.2 proxy log |
| **DEC-03** | จำนวน requirement ต่อบทบาท | **Stratified Top-30** | 600 แถว · ครอบคลุมน้ำหนักเฉลี่ย 52.2% · ทุก domain ครบ |
| **DEC-04** | temperature ของ analyst | **0** (ตามภาคผนวก ข) | แก้ System Architecture v3 §15 จาก 0.2 → 0 |
| **DEC-05** | ชื่อคอลัมน์ corpus | **ตามภาคผนวก ค** | `item_id`, `item_type`, `provider`, `title`, `source_url`, `competency_ids`, `researcher_notes` |
| **DEC-06** | Recommendation metric | **แยก 5 ตัวตามภาคผนวก ง** | ไม่รวมเป็น `RECOMMENDATION_VALIDITY` ตัวเดียว |

**เอกสารทั้งสามฉบับสอดคล้องกันแล้ว:** Proposal `28AUG26` ↔ System Architecture v3 (+ แก้ 3 จุดตาม DEC-04/05/06) ↔ Guideline นี้

---

# 1. Model Assignment (ฉบับสุดท้าย)

| ขั้นตอน | โมเดล | Model ID | Vendor | Temp | Reasoning |
|---|---|---|---|---|---|
| OCR | Google Document AI | — | Google | — | non-generative |
| **P1 Parse** | GPT-5.6 Terra | `gpt-5.6-terra` ⚠ ห้ามใช้ alias `gpt-5.6` | OpenAI | 0.2 | — |
| **P2 Analyst A** | GLM 5.2 | `glm-5.2` | Zhipu | **0** | `thinking:{"type":"disabled"}` |
| **P2 Analyst B** | Claude Sonnet 5 | `claude-sonnet-5` | Anthropic | **0** | extended thinking off |
| **P2 Analyst C** | Gemini 3.7 Flash | `gemini-3.7-flash` | Google | **0** | `thinkingLevel:"minimal"` |
| **Cross-Validation** | **Code เท่านั้น** | — | — | — | — |
| **P3 Rank** | Claude Sonnet 5 | `claude-sonnet-5` | Anthropic | 0 | off |
| **Pathway** | **Code เท่านั้น** | — | — | — | — |
| **P4 Report** | GPT-5.6 Terra | `gpt-5.6-terra` | OpenAI | 0.2 | — |

**LLM calls/submission = 6** · **4 vendors** · analyst ทั้งสามคนละค่าย ✅

**Parity ที่ได้จริง: ปิดสนิท 2 จาก 3** — Gemini 3.x ปิด reasoning สนิทไม่ได้ ระดับ `minimal` เป็นค่าต่ำสุดที่มี ต้องพิสูจน์ด้วยตัวเลขตาม PROTOCOL-01 (System Architecture v3 §2.3.3) ไม่ใช่อ้างจากชื่อพารามิเตอร์

---

# 2. `Data_Set.xlsx` — Workflow A เสร็จแล้ว

## 2.1 ชีตที่ระบบใช้จริง

| ชีต | แถว | ใช้ทำอะไร |
|---|---|---|
| `01_Role_Master` | 20 | dropdown ในฟอร์ม · role→SOC · `corpus_courses_target`/`corpus_certifications_target` = 10/10 |
| `02_Competency_Master` | 3,220 | `element_description` · `include_in_requirements` · `recommend_suppress` |
| `03_Readiness_Weights` | 1,296 | เฉพาะ IM ≥ 3.0 พร้อม `weight_raw_im`, `weight_share`, `rank_in_role` |
| `04_Role_Technology` | 4,797 | ⭐ เทคโนโลยีจริงพร้อมธง `hot_technology`/`in_demand` → prompt สร้าง corpus + ฐานของ `element_aliases` |
| `05_Role_Tasks` | 428 | งาน Core/Supplemental พร้อม IM → ใส่ในบริบทของ prompt |
| `09_Proxy_Mapping_Log` | 5 | → ภาคผนวก ก.2 และ transparency page |
| `10_Data_Dictionary` | 56 | provenance สำหรับ artifact release |
| `R01`–`R23`, `F01`–`F22` | — | ข้อมูลดิบ O\*NET สำหรับ audit |

## 2.2 🔴 ต้องทำก่อน freeze (README ระบุไว้เอง)

- [ ] **ยืนยันรหัส proxy ของ R07** (`15-1221.00` Computer and Information Research Scientists) **และ R17** (`15-1244.00` Network and Computer Systems Administrators)
- [ ] **คำนวณ SHA-256 ของไฟล์** → `dataset_version_log.checksum`
- [ ] **บันทึกวันที่ตรึง** (ปัจจุบัน "— ยังไม่ตรึง —")
- [ ] ตรวจว่าไม่มีแถว `recommend_suppress = Y` หลุดเข้า requirement set
- [ ] ใส่ข้อความอ้างอิง O\*NET CC BY 4.0 ในรายงานและ artifact

---

# 3. DEC-03: Stratified Top-30 (นโยบายที่ใช้จริง)

## 3.1 อัลกอริทึม

```
สำหรับแต่ละ role_id ใน 01_Role_Master:
  V = 03_Readiness_Weights ของบทบาทนั้น (IM ≥ 3.0) เรียงตาม rank_in_role
  S = []
  ขั้นที่ 1 (domain quota) : เลือก 3 อันดับแรกของแต่ละ domain ทั้ง 5  → 15 รายการ
      domains = [Essential Skills, Transferable Skills, Knowledge, Abilities, Work Activities]
  ขั้นที่ 2 (top-up)       : เติมจาก V ตาม rank_in_role ที่ยังไม่ถูกเลือก จนครบ 30
  ขั้นที่ 3 (renormalize)  : w'ᵢ = weight_raw_imᵢ / Σ(weight_raw_im ของ S)
  ขั้นที่ 4 (log)          : selected_reason ∈ {domain_quota, top_rank}
เขียนผล 600 แถวลง onet_requirements แล้ว FREEZE
```

## 3.2 ผลจริงต่อบทบาท (คำนวณแล้ว — อยู่ใน `onet_requirements.csv`)

| role_id | บทบาท | สมรรถนะ IM≥3.0 ทั้งหมด | เลือก | สัดส่วนน้ำหนักที่ครอบคลุม |
|---|---|---:|---:|---:|
| R01 | Software Engineer (Backend/Full-stack) | 53 | 30 | 0.608 |
| R02 | Web Developer | 59 | 30 | 0.554 |
| R03 | Application / Mobile Developer | 61 | 30 | 0.546 |
| R04 | QA & Test Automation Engineer | 62 | 30 | 0.539 |
| R05 | UX/UI & Digital Product Designer | 52 | 30 | 0.623 |
| R06 | Data Scientist | 50 | 30 | 0.644 |
| R07 | Machine Learning / AI Engineer | 69 | 30 | 0.490 |
| R08 | Data Engineer | 69 | 30 | 0.487 |
| R09 | Data / BI Analyst | 57 | 30 | 0.577 |
| R10 | Database Administrator | 66 | 30 | 0.504 |
| R11 | Information Security / SOC Analyst | 61 | 30 | 0.540 |
| R12 | Security Engineer | 62 | 30 | 0.531 |
| R13 | Penetration Tester | 66 | 30 | 0.508 |
| R14 | Digital Forensics & Incident Response | 56 | 30 | 0.579 |
| R15 | Network Engineer / Architect | 78 | 30 | 0.438 |
| R16 | Cloud Engineer / Solutions Architect | 76 | 30 | 0.448 |
| R17 | DevOps / Site Reliability Engineer | 66 | 30 | 0.511 |
| R18 | Systems / Business Analyst (IT) | 72 | 30 | 0.469 |
| R19 | IT Project Manager | 82 | 30 | 0.411 |
| R20 | IT / IS Manager | 79 | 30 | 0.423 |

**สรุป: เฉลี่ย 0.522 · ต่ำสุด 0.411 (R19) · สูงสุด 0.644 (R06) · ทุกบทบาทมีครบทั้ง 5 domain**

→ **ตารางนี้ต้องใส่เป็นภาคผนวกของเล่ม** เพราะตอบคำถาม *"ตัดออกไปเยอะไหม"* ได้ทันทีด้วยตัวเลข

## 3.3 ทำไมต้อง stratified

ถ้าเรียง top-30 ตรง ๆ โดยไม่มี domain quota **Transferable Skills จะหายไปจาก 5 บทบาท** เพราะ Work Activities และ Abilities มีค่า IM สูงกว่าโดยธรรมชาติ (ในชุด 1,296 แถว: Work Activities 458 · Abilities 354 · Transferable 198 · Essential 161 · Knowledge 125) การให้โควตาขั้นต่ำ 3 รายการต่อ domain แก้ปัญหานี้โดยเสียสัดส่วนน้ำหนักเพียง 0.001 (0.523 → 0.522)

## 3.4 ผลพลอยได้ที่สำคัญ

| ด้าน | ก่อน (ใช้ทั้งหมด) | หลัง (Top-30) |
|---|---|---|
| Ground truth ที่ผู้วิจัย annotate | 30 × 64 ≈ **1,920** | **900** |
| รวม intra + inter rater 20% | ≈ 2,700 การตัดสิน | ≈ **1,260** |
| ผู้เข้าร่วมยืนยันต่อคน | 64 ข้อ (25–40 นาที) | **30 ข้อ (12–15 นาที)** |
| ตัวส่วนของ Gap accuracy | ไม่เท่ากัน (50–82) | **เท่ากันทุกคน = 30** |
| ขนาด prompt ของ analyst | ใหญ่ เสี่ยง JSON ถูกตัด | เล็กลงกว่าครึ่ง |

**ความเสี่ยงที่แก้ได้จริงคือข้อ 3** — ผู้เข้าร่วมที่ต้องยืนยัน 64 ข้อมีแนวโน้มกดผ่านโดยไม่อ่าน ซึ่งจะทำลาย ground truth ทั้งชุดโดยที่เราไม่มีทางรู้

---

# 4. Readiness (ฉบับสุดท้าย)

```
w'ᵢ = weight_raw_imᵢ / Σ(weight_raw_im ของ 30 รายการที่เลือก)

Readiness (%) = 100 × Σ(w'ᵢ · sᵢ) / Σw'ᵢ    เหนือ validated items เท่านั้น
                s: evidenced = 1 · partially = 0.5 · missing = 0
                excluded ไม่เข้าทั้งเศษและส่วน
```

**ต้องรายงานคู่กันเสมอ 3 ค่า:** `readiness`, `n_validated` / `n_excluded`, และ **สัดส่วนน้ำหนักที่ชุด 30 ข้อครอบคลุม** ของบทบาทนั้น (จากตาราง §3.2)

---

# 5. `onet_requirements` — สร้างเสร็จแล้ว 600 แถว

ไฟล์ `onet_requirements.csv` พร้อม import เข้า Google Sheets ทันที

| คอลัมน์ | ที่มา |
|---|---|
| `role_id`, `target_role`, `soc_code` | `01_Role_Master` |
| `domain`, `element_id`, `element_name` | `03_Readiness_Weights` |
| `element_description` | `02_Competency_Master` |
| `importance_im`, `level_lv`, `rank_in_role` | `03_Readiness_Weights` |
| **`weight_renormalized`** | คำนวณตาม §4 (ผลรวมต่อบทบาท = 1.000) |
| **`selected_reason`** | `domain_quota` หรือ `top_rank` |
| `element_aliases` | ⚠ **ว่างอยู่ ต้องเติมก่อน freeze** (§6) |
| `snapshot_version` | `O*NET 31.0 (Aug 2026)` |

---

# 6. `element_aliases` — งานที่เหลือและวิธีทำให้เร็ว

Evidence Relevance Rule (SA v3 §9.6) ต้องใช้ alias แต่ O\*NET ไม่ให้มา

**วิธีที่แนะนำ — ใช้ `04_Role_Technology` เป็นแหล่งหลัก**

```
สำหรับ requirement ที่เป็น Knowledge / Essential Skills เชิงเทคนิค:
  alias += technology_example ของบทบาทนั้นที่ hot_technology='Y' ∨ in_demand='Y'
สำหรับ Work Activities:
  alias += คำสำคัญจาก 05_Role_Tasks ที่ task_type='Core' ของบทบาทนั้น
ที่เหลือ: ผู้วิจัยเติมด้วยมือ
```

**ข้อดีเชิงวิชาการ:** alias มาจาก O\*NET เอง ไม่ใช่ผู้วิจัยแต่งขึ้น → กันข้อครหาเรื่อง researcher bias ได้ตรง ๆ ต้องเขียนไว้ในเล่มว่า alias มาจากรายการเทคโนโลยีและงาน Core ของ O\*NET เป็นหลัก

**ต้อง freeze พร้อม snapshot** — ห้ามแก้หลังเริ่มเก็บข้อมูล

---

# 7. Workflow — สรุปฉบับสุดท้าย

| Workflow | Nodes | สถานะ |
|---|---:|---|
| **A** — O\*NET Dataset | **5** | ✅ ข้อมูลเสร็จแล้ว เหลือ import + freeze |
| **B+C** — Corpus Builder | 12 | ต้องพัฒนา · เป้าหมาย 400 รายการ |
| **D** — Intake & Parsing | 17 | ต้องพัฒนา |
| **E** — `SUB_GapEngine` | 11 | ต้องพัฒนา · แกนของงานวิจัย |
| **F** — Ranking & Pathway | 13 | ต้องพัฒนา |
| **G** — Report | 9 | ต้องพัฒนา |
| **H** — Evaluation | 11 | ต้องพัฒนา |
| **I** — Error Notifier | 2 | ต้องพัฒนา |

## 7.1 Workflow A (5 nodes)

| # | Node | หน้าที่ |
|---|---|---|
| A1 | Manual Trigger | รันครั้งเดียวก่อนเก็บข้อมูล |
| A2 | Read `03_Readiness_Weights` | 1,296 แถว |
| A3 | Select Requirements (Code) | Stratified Top-30 + renormalize (§3.1) |
| A4 | Write `onet_requirements` | 600 แถว |
| A5 | Freeze + Log Version | checksum · frozen_at · row_count |

> ทางลัด: `onet_requirements.csv` สร้างไว้ให้แล้ว import ตรงเข้า Sheets ได้เลย แล้วเก็บ A3 ไว้เป็นสคริปต์ประกอบ artifact เพื่อความ reproducible

## 7.2 Workflow B+C — ใช้ประโยชน์จาก Data_Set ให้เต็มที่

ใส่สามอย่างนี้ลง prompt สร้าง corpus:
1. **whitelist ของ 30 `element_id`** ของบทบาทนั้น
2. **เทคโนโลยี hot / in-demand** จาก `04_Role_Technology`
3. **งาน Core 5 อันดับแรก** จาก `05_Role_Tasks`

กฎกัน hallucination 4 ข้อ (ห้ามตัด): ประกาศว่าเป็น draft ให้มนุษย์ตรวจ · เลือก `competency_ids` จาก whitelist เท่านั้น · ไม่แน่ใจ URL/exam code ให้เว้นว่าง **ห้ามเดา** · ระบุ confidence + `researcher_notes`

**Completeness Gate:** แถวที่ `source_url` ว่าง ∨ `competency_ids` ว่าง ∨ `estimated_hours` ว่าง → `corpus_build_errors` ไม่เข้า master (ตาม §3.4 ของเล่ม)

## 7.3 `SUB_GapEngine` — สิ่งที่เปลี่ยนจาก v3

- requirement = **30 ข้อคงที่** → prompt สั้นลงกว่าครึ่ง ความเสี่ยง JSON ถูกตัดกลางลดลงมาก
- **นิยาม out-of-scope ขยาย:** สมรรถนะที่ไม่อยู่ในชุด 30 ข้อของบทบาทนั้น — ไม่ว่าจะมีอยู่ใน O\*NET หรือไม่ (ต้องเขียนนิยามนี้ให้ชัดในเล่ม)
- `temperature = 0` ทุกตัว (DEC-04)

## 7.4 Workflow D — transparency ของ proxy

ถ้าผู้ใช้เลือก **R03, R07, R08, R16, R17** รายงานต้องแสดงข้อความจาก `09_Proxy_Mapping_Log` คอลัมน์ "ความเสี่ยงที่ต้องรายงาน" ในหน้า transparency — ทำตามที่เล่มสัญญาไว้ใน §1.5(2) และภาคผนวก ก.2

---

# 8. ผลต่อการประเมิน

| ประเด็น | ผล |
|---|---|
| Gap accuracy | ตัวส่วน = 30 เท่ากันทุกคน → ค่าเฉลี่ยข้ามคนตีความตรงไปตรงมา ไม่ต้องถ่วงน้ำหนัก |
| Out-of-scope rate | นิยามใหม่ตาม §7.3 · ควรเป็น 0 สำหรับ FRAMEWORK โดยโครงสร้าง |
| Fleiss' kappa | คำนวณบน 30 คน × 30 requirement = 900 หน่วย → เสถียรพอ |
| Ground truth | 900 รายการ · intra 180 · inter 180 |
| Power | ไม่เปลี่ยน — หน่วยวิเคราะห์คือเรซูเม (n=30 คู่) ไม่ใช่ requirement |
| Recommendation metrics | **แยก 5 ตัวตามภาคผนวก ง** (DEC-06): whitelist compliance · mode compliance · gap coverage · timeline feasibility · report-reference validity |

---

# 9. Checklist ลงมือทำ

### เดือน 1 — ข้อมูลอ้างอิงและเอกสาร
- [ ] **GATE-01** ยืนยัน EOL ของ `glm-5.2` กับ Z.ai (ถ้ายืนยันไม่ได้ → พลิกไป GLM 5.3 + reasoning low ตาม SA v3 §2.3.2)
- [ ] ยืนยันรหัส proxy R07 และ R17
- [ ] คำนวณ SHA-256 ของ `Data_Set.xlsx` + บันทึกวันที่ตรึง
- [ ] import `onet_requirements.csv` (600 แถว) เข้า Sheets
- [ ] เติม `element_aliases` จาก `04_Role_Technology` + `05_Role_Tasks` แล้ว **freeze**
- [ ] แก้ System Architecture v3 ตาม DEC-04/05/06
- [ ] สร้าง Sheets 5 กลุ่ม + `model_registry`
- [ ] เอกสาร data governance ต่อผู้ให้บริการ → แนบคำขอจริยธรรม

### เดือน 2 — พัฒนาและ corpus
- [ ] สร้าง Workflow A, B+C, D, `SUB_GapEngine`, F, G, H, I
- [ ] รัน B+C ครบ 20 บทบาท → verify ~400 แถวด้วยมือ (2–3 วันทำงาน) → **freeze**
- [ ] ผูก Error Workflow ครบทุก workflow รวม `SUB_GapEngine`

### เดือน 3 — pilot และ freeze
- [ ] pilot 5 คน (นอกกลุ่มตัวอย่าง) → จูน `THETA` + word budget ด้วย n8n Evaluations → **freeze**
- [ ] **PROTOCOL-01** วัด `reasoning_tokens` จริงทั้งสามโมเดล (เกณฑ์ ≤ 5% ของ output token)
- [ ] ตัดสินระดับ GPT ที่ใช้ parse ตามเกณฑ์ `evidence_verified_ratio`
- [ ] golden set 15–20 ชุด · inter-rater 20%

### เดือน 4–6
- [ ] เก็บข้อมูลจริงในหน้าต่าง **≤ 3 สัปดาห์** · รันซ้ำ k=3 บน subsample 20%
- [ ] C10 robustness check (เปิด reasoning, 10 เรซูเม)
- [ ] Workflow H + `analysis_v5.py` · ตาราง ablation / calibration / cost / latency
- [ ] artifact + DOI: workflow JSON · prompt 6 ตัว · `onet_requirements.csv` · codebook · replay harness

**⚠ บั๊กที่แก้ไว้แล้วห้ามหาย:** Reattach Binary · Readiness เหนือ validated เท่านั้น · evidence corpus รวม profile JSON · `no_majority_agreement_tied` แยก · consent ใช้ `equals` · ไม่มี Merge บน IF branch · error แยกชีต

---

# 10. รายการ ⚠ ที่ต้องตรวจกับ documentation จริง

| # | ตรวจอะไร | ที่ไหน |
|---|---|---|
| 1 | `glm-5.2` — `thinking:{"type":"disabled"}` ใช้ได้จริง (ยืนยันด้วย `reasoning_tokens` ≈ 0 ไม่ใช่แค่ API ไม่ error) + **EOL date** | docs.z.ai |
| 2 | `gpt-5.6-terra` — model id (ห้ามใช้ alias `gpt-5.6` ซึ่งชี้ไป Sol) + ราคาจริง | platform.openai.com |
| 3 | `gemini-3.7-flash` — รองรับ `thinkingLevel:"minimal"` หรือไม่ (ถ้าไม่ ใช้ `low` แล้วบันทึก) + ห้ามส่ง `thinking_budget` คู่กัน | ai.google.dev |
| 4 | `claude-sonnet-5` — `output_config.format` + ยืนยันว่า extended thinking ปิดเมื่อไม่ส่ง `thinking` | platform.claude.com |
| 5 | รหัส proxy R07 / R17 | O\*NET Online |
| 6 | O\*NET 31.0 license + ข้อความอ้างอิงที่ต้องแสดง | onetcenter.org |
| 7 | n8n ≥ 1.95.1 (Evaluations) + typeVersion + ชื่อ binary property | instance ตัวเอง |
| 8 | Document AI region + processorId | Google Cloud Console |

---

# 11. สรุป

การตัดสินใจปิดครบทั้ง 6 ข้อแล้ว และเอกสารทั้งสามฉบับสอดคล้องกัน

**สิ่งที่พร้อมใช้ทันที:** `Data_Set.xlsx` ทำให้ Workflow A เหลือแค่ import + freeze และ `onet_requirements.csv` 600 แถวสร้างเสร็จแล้วพร้อมค่า `weight_renormalized` และ `selected_reason`

**สิ่งที่ Stratified Top-30 แก้ได้:** ตัวส่วนของ Gap accuracy เท่ากันทุกคน · ภาระ annotate ลดครึ่งหนึ่ง · และที่สำคัญที่สุดคือผู้เข้าร่วมยืนยัน 30 ข้อใน 12–15 นาที ซึ่งเป็นระดับที่คนอ่านจริงจนจบ แทนที่จะกดผ่าน 64 ข้อโดยไม่อ่าน

**งานที่เหลือก่อนเริ่มพัฒนา 3 อย่าง:** ผ่าน GATE-01 เรื่อง EOL ของ glm-5.2 · ยืนยันรหัส proxy R07/R17 · เติม `element_aliases` แล้ว freeze

---

*ขั้นถัดไป: สร้างไฟล์ JSON ของ n8n ทั้ง 8 workflow ตามสเปกใน `System Architecture v3.md` พร้อม import ได้ทันที*
