# -*- coding: utf-8 -*-
"""
build_data_all.py — สร้างข้อมูลอ้างอิงทั้งหมดใหม่ในคำสั่งเดียว (ใช้หลังแก้ url_manual_check.csv หรือเมื่อไฟล์หาย)

  python scripts/build_data_all.py            (ค่าเริ่มต้นอ่านต้นทางจาก source/)
  python scripts/build_data_all.py --corpus-version v1.4   (ถ้าอาจารย์เลือก D1 = ก.)

ลำดับ: requirements/roles/aliases → corpus/mappings → mapping_review → role_tasks/role_technology/skill_links (DEC-54/55) → sheets_import → manifest
"""
import argparse, os, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ap = argparse.ArgumentParser()
ap.add_argument("--dataset", default=os.path.join(ROOT, "source", "project_files", "Data_Set.xlsx"))
ap.add_argument("--frozen-req", default=os.path.join(ROOT, "source", "recovered_31AUG-09SEP", "02_dataset", "onet_requirements_28AUG26.csv"))
ap.add_argument("--corpus-dir", default=os.path.join(ROOT, "source", "recovered_31AUG-09SEP", "03_corpus"))
ap.add_argument("--corpus-version", default="v1.5", choices=["v1.4", "v1.5"])
ap.add_argument("--close-r14-repair", action="store_true")
a = ap.parse_args()
py = sys.executable
steps = [
    [py, "scripts/build_reference_data.py", "--src", a.dataset, "--check-against", a.frozen_req],
    [py, "scripts/build_corpus.py", "--src-dir", a.corpus_dir, "--version", a.corpus_version]
    + (["--close-r14-repair"] if a.close_r14_repair else []),
    [py, "scripts/review_mappings.py"],
    [py, "scripts/build_role_signals.py", "--src", a.dataset],
    [py, "scripts/build_sheets_import.py"],
    [py, "scripts/update_manifest.py"],
]
for s in steps:
    print("▶", " ".join(os.path.relpath(x, ROOT) if os.path.isabs(x) else x for x in s[1:2]))
    r = subprocess.run(s, cwd=ROOT)
    if r.returncode: sys.exit(r.returncode)
print("✔ ข้อมูลอ้างอิงครบ · ต่อด้วย: node --test tests/")
