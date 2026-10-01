# รายงานการตรวจสอบ URL ของ Corpus — GATE-C

**งาน:** IS 68076026 · ดนุสรณ์ อนันตกาล · ITM KMITL
**วันที่ตรวจ:** 31 สิงหาคม 2026
**ขอบเขต:** 431 แถวของ `Course_Career_31AUG26.xlsx` (v1.0) · **331 URL ที่ไม่ซ้ำกัน** ใน 93 โดเมน
**วิธีตรวจ:** ดึงหน้าเว็บจริงทีละหน้า อ่านชื่อหลักสูตรหรือใบรับรองจากหน้าปลายทาง แล้วเทียบกับชื่อที่บันทึกไว้ใน corpus พร้อมตรวจข้อความประกาศยกเลิกบนหน้า
**ผลลัพธ์:** `corpus_master_v11_31AUG26.csv` · `Course_Career_v11_31AUG26.xlsx` (`CORPUS-IS68076026-v1.1-31AUG26`)

---

## 1. สรุปผล

| ผลการตรวจ | แถว | สัดส่วน |
|---|---:|---:|
| **verified** — หน้าเปิดได้และชื่อตรง | **339** | 78.7% |
| **verified** — แก้ URL ตามการเปลี่ยนเส้นทางที่ยืนยันปลายทางแล้ว | **11** | 2.6% |
| **รวม verified** | **350** | **81.2%** |
| ต้องเปลี่ยนหรือลบรายการ | 43 | 10.0% |
| ต้องตรวจด้วยตาอีกครั้ง | 38 | 8.8% |

**ความครอบคลุมถ้าตัดแถวที่ยังไม่ผ่านออกทั้งหมด:** 588 จาก 600 requirement (98.0%) — เสียไป 12 รายการ กระจุกที่ R03 (6 รายการ)

---

## 2. รายการที่ต้องเปลี่ยนหรือลบ 43 แถว

### 2.1 ใบรับรองที่ผู้ให้บริการยกเลิกแล้ว (7 แถว) — ร้ายแรงที่สุด

รายการเหล่านี้ยังปรากฏบนหน้าเว็บ แต่หน้านั้นประกาศชัดเจนว่าเลิกให้บริการแล้ว ถ้าปล่อยไว้ ระบบจะแนะนำใบรับรองที่ผู้เข้าร่วมสมัครสอบไม่ได้

| รายการ | บทบาท | สิ่งที่หน้าเว็บระบุ |
|---|---|---|
| Microsoft Certified: Azure Developer Associate | R01 | "This certification and the renewal assessment are retired" (14 ม.ค. 2026) |
| Microsoft Certified: Azure Data Scientist Associate | R06 | ประกาศยกเลิกแล้ว |
| Microsoft Certified: Azure AI Engineer Associate | R07 | ประกาศยกเลิกแล้ว |
| AWS Certified Machine Learning – Specialty | R06 | วันสอบวันสุดท้าย 31 มี.ค. 2026 (ผ่านไปแล้ว) |
| TensorFlow Developer Certificate | R06 | โครงการใบรับรองยุติแล้ว |
| OpenJS Node.js Application Developer (JSNAD) | R02 | ยกเลิกแล้ว |
| OpenJS Node.js Services Developer (JSNSD) | R02 | ยกเลิกตั้งแต่ 30 ก.ย. 2025 |

### 2.2 หน้าถูกยึดโดยเนื้อหาโฆษณา (1 แถว) — ต้องลบทันที

| รายการ | บทบาท | สิ่งที่พบ |
|---|---|---|
| MITRE ATT&CK Defender (MAD) – ATT&CK Fundamentals | R11 | `mitre-engenuity.org/cybersecurity/mad/` แสดงหน้า **"Best Crypto Casinos Ranked for 2026"** |

นี่คือเหตุผลที่ระเบียบวิธีกำหนดให้ตรวจ URL ก่อนตรึงข้อมูล ถ้าไม่ตรวจ ระบบจะส่งลิงก์เว็บพนันให้ผู้เข้าร่วมงานวิจัย

### 2.3 หน้าไม่พบ 404 (28 แถว) และหน้าไม่มีเนื้อหาแล้ว (7 แถว)

รวม 35 แถว ครอบคลุม 26 รายการที่ไม่ซ้ำกัน — ดูรายชื่อเต็มใน `url_action_list_31AUG26.csv` ตัวอย่างที่กระทบมาก:

- Certiport: App Development with Swift (R03 · 2 แถว) และ Adobe Certified Professional (R05)
- Human Factors International: CUA และ CXA (R05 · 2 แถว)
- Coursera 8 รายการที่ถูกถอด: Palo Alto Networks (2), DevSecOps Essentials, Incident Response, Networking Basics Cisco, IBM Business Analyst, UCI Project Risk Management, Scrum Master Training, Cybersecurity for Managers, Snowflake Data Engineering
- Cisco DevNet Associate (R15) · HPE Aruba ACSA (R15) · BCS Business Analysis (R18) · TOGAF Practitioner (R20)
- Cellebrite CCO และ AccessData ACE (R14) · Volatility Training (R14) · EDB PostgreSQL (R10) · dbt Certification (R08) · MIT MicroMasters (R06)

---

## 3. รายการที่ต้องตรวจด้วยตา 38 แถว

| สาเหตุ | แถว | ความหมาย |
|---|---:|---|
| `FETCH_ERROR` | 18 | เว็บมีระบบกันบอทหรือเซิร์ฟเวอร์ตอบผิดพลาด (403/500/timeout) — น่าจะยังใช้งานได้แต่ยืนยันไม่ได้: Oracle Education, PeopleCert PRINCE2, Scrum.org 3 รายการ, ISTQB Performance Testing, isqi |
| `UNCLEAR` | 10 | ดึงหน้าได้แต่หน้าไม่แสดงชื่อหลักสูตร: IAAP 2 รายการ, MongoDB 2 รายการ, ServiceNow, Tricentis, dbt Learn, netacad, OffSec WEB-200 |
| `WRONG_CONTENT` | 4 | หน้าปลายทางไม่ใช่รายการที่บันทึกไว้: Red Hat RHCE, Udacity Flutter, Coursera website-development, Juniper Learning Portal (แสดงเนื้อหา HPE Aruba) |
| `REDIRECT` ที่ยืนยันปลายทางไม่ได้ | 3 | Tableau 2 รายการ (ย้ายไป Salesforce Trailhead), Google Cloud Skills Boost `/paths/34` |
| `RETIRING` | 3 | ยังสอบได้แต่จะหมดอายุระหว่างงานวิจัย: **Microsoft Azure Security Engineer (ยกเลิก 31 ส.ค. 2026 คือวันนี้)**, Microsoft Power Platform Functional Consultant (วันนี้เช่นกัน), AWS Advanced Networking Specialty (31 ธ.ค. 2026) |

---

## 4. URL ที่แก้ให้อัตโนมัติแล้ว 11 แถว

ปลายทางใหม่ยืนยันแล้วว่าเปิดได้และเป็นรายการเดียวกัน

| เดิม | ใหม่ |
|---|---|
| `resources.github.com/learn/certifications/` | `learn.github.com/certifications` |
| `www.interaction-design.org/courses` | `ixdf.org/courses` |
| `education.oracle.com/` | `www.oracle.com/education/` |
| `security.ine.com/certifications/ejpt-certification/` | `ine.com/security/certifications/ejpt-certification` |
| `security.ine.com/certifications/ecppt-certification/` | `ine.com/security/certifications/ecppt-certification` |
| `securityblue.team/certifications/blue-team-level-1/` | `www.centri.org/certifications/blue-team-level-1` — **ผู้ให้บริการเปลี่ยนชื่อเป็น Centri** ต้องแก้คอลัมน์ `provider` ด้วย |
| `www.cloudskillsboost.google/` และ `/paths/17` | `www.skills.google/` — **Google ย้ายโดเมนแล้ว** |
| `www.ireb.org/en/cpre/` | `cpre.ireb.org/en` |

---

## 5. ข้อสังเกตเชิงระเบียบวิธีที่ควรเขียนลงเล่ม

1. **อัตราลิงก์เสียของ corpus ที่ร่างด้วย AI = 10.0% ภายในเวลา 1 วันหลังสร้าง** เป็นตัวเลขที่รายงานได้ตรง ๆ ในบทที่ 4 หรือ §5.3 และสนับสนุนข้อโต้แย้งหลักของงานว่าเหตุใดจึงต้องมีชั้นตรวจสอบด้วยมนุษย์ก่อนเข้า runtime
2. **ต้องระบุวันที่ตรวจ URL ในเล่ม** เพราะใบรับรอง 3 รายการมีกำหนดยกเลิกภายในช่วงเก็บข้อมูล การอ้างว่า "ตรวจแล้ว" โดยไม่ระบุวันจะตรวจสอบย้อนกลับไม่ได้
3. **ควรตรวจ URL ซ้ำอีกครั้งก่อนเริ่มเก็บข้อมูลจริง** (ประมาณสัปดาห์ที่ 10) แล้วบันทึกว่ามีรายการใดเปลี่ยนสถานะ — เป็นหลักฐานว่า corpus ยังใช้ได้ ณ เวลาที่ผู้เข้าร่วมได้รับรายงาน
4. **`verification_status = rejected` ไม่ควรถูกลบทิ้ง** ให้คงแถวไว้ใน corpus แต่กันออกจากตัวกรองของ Workflow F เพื่อให้ตรวจสอบย้อนกลับได้ว่ารายการใดถูกตัดออกด้วยเหตุผลใด

---

## 6. งานที่เหลือก่อน 🧊 FREEZE

- [ ] หารายการทดแทน 26 รายการที่ตายแล้ว (กระทบ 43 แถว) — ถ้าไม่หาทดแทน ความครอบคลุมจะเหลือ 98.0%
- [ ] ตรวจด้วยตา 38 แถวที่ระบบยืนยันไม่ได้
- [ ] แก้ `provider` ของ Blue Team Level 1 เป็น Centri
- [ ] ตัดสินใจเรื่องใบรับรอง 3 รายการที่กำลังจะยกเลิก — แนะนำให้ตัดออกเพราะจะยกเลิกระหว่างช่วงเก็บข้อมูล
- [ ] คำนวณ SHA-256 ซ้ำ บันทึก `frozen_at` แล้วแนบ manifest เข้าภาคผนวก จ
