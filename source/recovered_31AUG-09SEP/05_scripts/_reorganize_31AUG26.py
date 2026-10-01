#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""จัดระเบียบโฟลเดอร์โครงการ · 31 ส.ค. 2026 · ย้ายอย่างเดียว ไม่ลบไฟล์ใด ๆ"""
import os, shutil, csv, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
LOG  = []

DIRS = ["01_docs","01_docs/assets","02_dataset","03_corpus","04_master_data","05_scripts","06_workflows",
        "archive","archive/2026-07_proposal","archive/2026-08_book_versions",
        "archive/2026-08_corpus_versions","archive/2026-08_dataset_pre_dec07",
        "archive/2026-08_n8n_legacy","archive/_trash"]

PLAN = {
 # ---------- 01_docs : เอกสารฉบับปัจจุบัน ----------
 "01_docs": ["IS_68076026(29AUG26)_v3.docx","Guideline n8n v4.md","System Architecture v3.md",
             "Development_Process_31AUG26.md","DECISIONS_31AUG26.md",
             "URL_Verification_Report_31AUG26.md","Codebook_GroundTruth_31AUG26.md"],
 "01_docs/assets": [],
 # ---------- 02_dataset : ชุดข้อมูลอ้างอิงที่ตรึงแล้ว ----------
 "02_dataset": ["Data_Set.xlsx","onet_requirements_28AUG26.csv","onet_requirements_excluded_28AUG26.csv",
                "element_aliases_28AUG26.csv","dataset_version_log_28AUG26.json",
                "build_onet_requirements_28AUG26.py","aliases.py","db_31_0_excel"],
 # ---------- 03_corpus : คลังหลักสูตรฉบับปัจจุบัน ----------
 "03_corpus": ["Course_Career_v12_31AUG26.xlsx","corpus_master_v12_31AUG26.csv",
               "item_competency_map_31AUG26.csv","corpus_version_log_v12_31AUG26.json",
               "corpus_change_log_v12_31AUG26.csv","url_verification_31AUG26.csv",
               "url_action_list_31AUG26.csv","corpus_qa_v10_31AUG26"],
 # ---------- 04_master_data ----------
 "04_master_data": ["Master_Data_31AUG26.xlsx","rules_version_log_31AUG26.json",
                    "master_data_csv_31AUG26","ground_truth_template_31AUG26.csv",
                    "ground_truth_extraction_template_31AUG26.csv"],
 # ---------- 05_scripts ----------
 "05_scripts": ["check_consistency.py","check_corpus_31AUG26.py","build_corpus_v10_31AUG26.py",
                "build_corpus_v12_31AUG26.py","apply_url_verification_31AUG26.py",
                "build_master_data_31AUG26.py","record_url_result_31AUG26.py"],
 # ---------- archive ----------
 "archive/2026-07_proposal": [
    "Research Proposal (thai) v2.docx","Research Proposal - Danusorn Anantakan - Revised 10JUL26.md",
    "Research Proposal - Danusorn Anantakan - Revised Complete 10JUL26.docx","make_thai_proposal_docx.py",
    "System Architecture.md","System Architecture.svg","System_Architecture_Proposal_1.md",
    "extracted_docx_text.txt","translated_pasted_text.txt","IS1 - 68076026 v.2.docx",
    "system-flow-glassmorphism.png"],
 "archive/2026-08_book_versions": [
    "IS_68076026(28AUG26).docx","IS_68076026(28AUG26)_v2.docx",
    "IS_68076026(29AUG26)_v1.docx","IS_68076026(29AUG26)_v2.docx","Development_Process.md"],
 "archive/2026-08_corpus_versions": [
    "Course_Career.xlsx","Course_Career_31AUG26.xlsx","Course_Career_v11_31AUG26.xlsx",
    "corpus_master.csv","corpus_master_31AUG26.csv","corpus_master_v11_31AUG26.csv",
    "item_competency_map.csv","corpus_version_log_31AUG26.json","corpus_version_log_v11_31AUG26.json",
    "corpus_qa_31AUG26"],
 "archive/2026-08_dataset_pre_dec07": [
    "onet_requirements.csv","dataset_version_log_regenerated.json","Occupation_list.md"],
 "archive/2026-08_n8n_legacy": ["N8N Flow Files"],
 "archive/_trash": ["~$ample - Paper - IS1-67076010.docx","__pycache__"],
}

for d in DIRS:
    os.makedirs(os.path.join(ROOT, d), exist_ok=True)

missing = []
for dest, names in PLAN.items():
    for name in names:
        src = os.path.join(ROOT, name)
        if not os.path.exists(src):
            missing.append(name); continue
        dst = os.path.join(ROOT, dest, os.path.basename(name))
        if os.path.abspath(src) == os.path.abspath(dst): continue
        shutil.move(src, dst)
        LOG.append([name, dest + "/" + os.path.basename(name),
                    "โฟลเดอร์" if os.path.isdir(dst) else "ไฟล์"])

with open(os.path.join(ROOT, "_MOVE_LOG_31AUG26.csv"), "w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f)
    w.writerow(["ที่อยู่เดิม","ที่อยู่ใหม่","ชนิด"])
    w.writerows(sorted(LOG))

left = sorted(x for x in os.listdir(ROOT)
              if not x.startswith((".", "_")) and x not in [d.split("/")[0] for d in DIRS])
print(f"ย้ายแล้ว {len(LOG)} รายการ")
if missing: print("ไม่พบ (ข้ามไป):", ", ".join(missing))
print("\nเหลือที่ราก:", ", ".join(left) if left else "ไม่มี")
print("\nโครงสร้างใหม่:")
for d in DIRS:
    p = os.path.join(ROOT, d)
    n = len(os.listdir(p)) if os.path.isdir(p) else 0
    print(f"   {d:<36}{n:>3} รายการ")
