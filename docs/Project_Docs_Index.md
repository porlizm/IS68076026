# ดัชนีเอกสารใน Project "Research ITM" (ณ 1 ต.ค. 2569)

> Claude Desktop ที่เปิดงานใน Project นี้อ่านไฟล์ได้ด้วย `project_read("<path>")` จึงไม่ต้องคัดลอกทุกไฟล์ลงเครื่อง
> ถ้าต้องใช้ไฟล์ใดบนเครื่อง ให้ Claude อ่านจาก Project แล้วเขียนลง `Final_IS/docs/reference/`
>
> **สถานะ** 🟢 ใช้ต่อ · 🔵 อ้างอิง (ข้อมูล/เหตุผลยังถูก แต่ต้องปรับให้ตรง PDF) · ⚪ ประวัติ (ถูกแทนที่แล้ว) · ⚠ อ้างเล่มผิดฉบับ

## ไฟล์แนบ (6) → คัดลอกไว้ใน `source_from_project/` แล้ว 4 ไฟล์

| ไฟล์ | สถานะ | ใน zip |
|---|---|---|
| `Data_Set.xlsx` (56 ชีต) | 🟢 ต้นทางของ requirements/roles | ✅ |
| `onet_requirements.csv` (600 แถว) | 🟢 ใช้เทียบผล requirements.csv | ✅ |
| `_MOVE_LOG_31AUG26.csv` | 🔵 | ✅ |
| `systemflowglassmorphism.png` | ⚪ ภาพระบบรุ่นแรก | ✅ |
| `Research Pthways.pdf` (2 ชุด) | 🔵 เอกสารอ้างอิงงานวิจัย | ❌ Project เก็บเป็นข้อความ ให้ดาวน์โหลดจาก claude.ai |

## ใช้บ่อยที่สุด (อ่านก่อน)

| Path | ใช้ทำอะไร | สถานะ |
|---|---|---|
| `claude/Plan_23SEP26.md` | Gate G0–G6, WBS P0–P7, n8n checklist, traceability, risk (แผน 30SEP ยังใช้เกณฑ์ Gate จากไฟล์นี้) | 🔵 |
| `claude/LOG_Final_IS.md` | ประวัติ Session 1–6 (23 ก.ย.) | ⚪ |
| `claude/DECISIONS_19SEP26.md` | DEC-18–21 ฉบับเต็ม (สรุปไว้ใน `docs/DECISIONS.md`) | 🟢 |
| `claude/Workflow_Single_21SEP26.md` | บั๊ก 11 ข้อ (ย้ายไป Spec Checklist ส่วน B แล้ว) | 🔵 |
| `claude/Coding_Manual_v0.9.md` | คู่มือให้รหัส | ⚠ อ้าง "ตาราง 3.24" ต้องเป็น 3.23 |
| `claude/Analysis_Plan_v0.9.md` | แผนวิเคราะห์ | ⚠ อ้างตาราง 3.31, 3.33–3.34 และ κ 0.789 ที่ไม่มีใน PDF |
| `claude/Master_Data_23SEP26.md` | Master Data 64 แท็บ (สรุป) | 🔵 |
| `claude/Fix_plan_corpus_19SEP26.md` | สูตรทำคลัง v1.5 (ใช้ถ้า D1 = ข.) | 🔵 |
| `claude/Change_Order_Book_19SEP26.md` | จุดแก้เล่มถ้าเลือก v1.5 (~7 ชม.) | 🔵 |
| `claude/make_is_docx_28AUG26.py` | ต้นแบบสคริปต์ docx (TH Sarabun New, ตาราง, heading) ใช้ต่อยอดเป็น `build_book.py` | 🔵 |

## ช่วง 19–23 ก.ย. (งานหลังเล่มขอสอบ: ใช้ประกอบการตัดสินใจ D1/D2/D4)

| Path | สถานะ |
|---|---|
| `claude/Gap_IS_v4.md` · `claude/Changes_Applied_Gap_IS_v4.md` | 🔵 |
| `claude/GAP_IS_23SEP26_v3.md` · `claude/GAP_IS_23SEP26_v2.md` · `claude/Gap_IS_23SEP.md` | ⚪ |
| `claude/Changes_Applied_23SEP26.md` · `claude/Changes_Applied_23SEP26_v2.md` | 🔵 (น่าจะมี DEC-22) |
| `claude/Diagrams_22SEP26.md` · `claude/Book_v22SEP26_Applied.md` | 🔵 รายการรูปที่วาดใหม่ |
| `claude/Gap_IS_68076026_21SEP26_v3.md` · `claude/Format_Fix_v2_21SEP26.md` | 🔵 ZWSP, ฟอนต์, "คอลัมน์" |
| `claude/Demo_n8n_Gemini_19SEP26.md` | 🔵 |
| `claude/Paper_EdTech_Baseline_v3_18SEP26.md` · `claude/Suggest_Paper.md` · `claude/Suggest_Paper_2.md` · `claude/Gap_IS_and_Q1.md` | 🔵 งานตีพิมพ์ (ไม่อยู่ในเส้นทางวิกฤต) |
| `claude/Review_IS_18SEP.md` · `claude/Summary_comment_IS_18SEP26.md` · `claude/Changes_Applied_18SEP26.md` | 🔵 ความเห็นต่อเล่ม |

## ช่วง 28 ส.ค. – 12 ก.ย. (ประวัติ)

| Path | สถานะ |
|---|---|
| `claude/Gap_IS_12SEP29.md` · `claude/Rewrite_Applied_11SEP26.md` · `claude/IS_Draft2_v2.1_Build_11SEP26.md` · `claude/Diagrams_IS_Draft2_11SEP26.md` · `claude/IS_Draft1_Status_10SEP26.md` · `claude/IS_68076026_Build_Status_09SEP26.md` · `claude/Diagrams_IS_v2_08SEP26.md` · `claude/IS_Book_v4_07SEP26.md` | ⚪ |
| `claude/Dataset_Audit_01SEP26.md` · `claude/build_sheets_01SEP26.py` · `claude/dataset_version_log_01SEP26.json` · `claude/role_map_01SEP26.csv` · `claude/alias_collision_review_01SEP26.csv` · `claude/Sheets_Import_Guide_01SEP26.md` | 🔵 ใช้ตอนสร้าง requirements/roles (ข้อ 14–15) |
| `claude/n8n_Local_Test_Plan_01SEP26.md` · `claude/Workflow_v2_31AUG26.md` · `claude/WF_Main_28AUG26.json` · `claude/WF_SUB_GapEngine_28AUG26.json` · `claude/n8n_README_28AUG26.md` · `claude/sheet_headers_28AUG26.csv` | 🔵 workflow รุ่นแรก ใช้เป็นแนวทางตอนทำ S4 |
| `claude/Folder_Structure_31AUG26.md` · `claude/Master_Data_31AUG26.md` · `claude/Development_Process.md` | ⚪ |
| `claude/Corpus_v1.2_Repair_31AUG26.md` · `claude/Corpus_v1.1_URL_Verification_31AUG26.md` · `claude/Corpus_v1.0_Status_31AUG26.md` | 🔵 ประวัติคลัง |
| `claude/aliases.py` · `claude/build_onet_requirements_28AUG26.py` · `claude/dataset_version_log_28AUG26.json` · `claude/role_map_28AUG26.json` · `claude/onet_requirements_excluded_28AUG26.csv` · `claude/element_aliases_28AUG26.csv` · `claude/onet_requirements_28AUG26.csv` | 🟢 สคริปต์และข้อมูลต้นทางของ 600 ข้อ (ข้อ 14) |
| `claude/IS_68076026_28AUG26.md` · `claude/Occupation_list_28AUG26.md` · `claude/Gap_Closure_28AUG26.md` · `Gap_28AUG26.md` · `IS_68076026(28AUG26).docx` · `Occupation_list.md` | ⚪ / 🔵 (Occupation_list_28AUG26 คือแหล่งความจริงของ 20 อาชีพ) |
| `README.md` (อัปโหลด 30 ก.ย. เนื้อหาเป็นของ 31 ส.ค.) | ⚪ |

## ก่อน ส.ค.

| Path | สถานะ |
|---|---|
| `Research Proposal - Danusorn Anantakan - Revised 10JUL26.md` / `.docx` · `make_thai_proposal_docx.py` | ⚪ proposal |

## ไฟล์ที่แผนอ้างถึงแต่ไม่มีใน Project
- `Corpus_Recovery_Plan_30SEP26.md`: ถ้ามีในเครื่อง ให้วางไว้ที่ `Final_IS/docs/` ถ้าไม่มี ให้สร้างใหม่ตอนทำข้อ 16–17
- `Files_IS_List.md`: เช่นเดียวกัน
- แนะนำให้อัปโหลดทั้งสองไฟล์เข้า Project ด้วย
