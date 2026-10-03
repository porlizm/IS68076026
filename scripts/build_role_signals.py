# -*- coding: utf-8 -*-
"""
build_role_signals.py — ข้อมูลอ้างอิงชุดที่ 3 (DEC-54, DEC-55 · 3 ต.ค. 2569) จาก Data_Set.xlsx (O*NET 31.0)

  data/role_tasks.csv       งานหลัก (Core) ของแต่ละอาชีพ 8 ข้อแรกตาม IM ของงาน  → ดัชนีงานหลัก T (DEC-55)
  data/role_technology.csv  เทคโนโลยีที่ตลาดต้องการ (In Demand = Y) + คำค้นแบบทั้งคำ → ดัชนีเทคโนโลยี H (DEC-55)
  data/skill_links.csv      ความเชื่อมโยงทักษะ → กิจกรรมการทำงานของ O*NET (F13 Essential · F15 Transferable) → กฎ R6 (DEC-54)

นโยบาย: เลือกงาน task_type = Core เรียง task_importance_im มากไปน้อย ตัดสินเท่ากันด้วย task_id น้อยไปมาก
        คำค้นเทคโนโลยี: ชื่อเต็ม · ตัดคำว่า software · ตัดชื่อผู้ผลิตนำหน้า · ตัวย่อตัวพิมพ์ใหญ่ ≥ 2 ตัว · ไม่ใช้คำยาว 1 ตัวอักษร (C, R)
ใช้:  python scripts/build_role_signals.py [--src source/project_files/Data_Set.xlsx]
"""
import argparse, os, re
import pandas as pd

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA = os.path.join(ROOT, "data")
N_TASKS = 8
VENDORS = {"microsoft", "atlassian", "amazon", "oracle", "google", "apache", "ibm", "adobe", "red", "cisco", "sap", "the"}
GENERIC = {"software", "web", "services", "service", "microsoft", "office", "the", "database", "language", "structured", "query"}


def tech_keys(name):
    n = re.sub(r"\s+", " ", str(name)).strip()
    keys = [n]
    base = re.sub(r"\s+software$", "", n, flags=re.I).strip()
    keys.append(base)
    words = base.split(" ")
    if len(words) > 1 and words[0].lower() in VENDORS:
        rest = " ".join(words[1:])
        if rest.lower() not in GENERIC and len(rest) > 1: keys.append(rest)
    for w in words:
        if re.fullmatch(r"[A-Z][A-Z0-9#+.]{1,}", w) and w.lower() not in GENERIC: keys.append(w)
    out = []
    for k in keys:
        k = k.strip()
        if len(k) >= 2 and k.lower() not in [x.lower() for x in out]: out.append(k)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=os.path.join(ROOT, "source", "project_files", "Data_Set.xlsx"))
    a = ap.parse_args()
    roles = sorted(pd.read_csv(os.path.join(DATA, "requirements.csv"), dtype=str).role_id.unique())
    t = pd.read_excel(a.src, "05_Role_Tasks")
    t = t[(t.task_type == "Core") & t.role_id.isin(roles)].copy()
    t["task_id_int"] = t.task_id.astype(int)
    t = t.sort_values(["role_id", "task_importance_im", "task_id_int"], ascending=[True, False, True])
    rows = []
    for rid, g in t.groupby("role_id"):
        for rank, (_, r) in enumerate(g.head(N_TASKS).iterrows(), 1):
            rows.append({"task_id": f"TASK-{rid}-{int(r.task_id)}", "role_id": rid, "onet_task_id": int(r.task_id),
                         "task_text": str(r.task).strip(), "task_type": r.task_type, "task_importance_im": r.task_importance_im,
                         "rank_in_role": rank, "source_version": "O*NET 31.0 Database (August 2026 Release)"})
    tasks = pd.DataFrame(rows)
    assert set(tasks.role_id) == set(roles) and tasks.groupby("role_id").size().min() == N_TASKS, "ทุกอาชีพต้องมีงานหลักครบ"
    tasks.to_csv(os.path.join(DATA, "role_tasks.csv"), index=False, encoding="utf-8", lineterminator="\n")

    h = pd.read_excel(a.src, "04_Role_Technology")
    h = h[(h.in_demand == "Y") & h.role_id.isin(roles)].drop_duplicates(["role_id", "technology_example"])
    trows = []
    for _, r in h.sort_values(["role_id", "technology_example"]).iterrows():
        trows.append({"role_id": r.role_id, "technology": r.technology_example, "category": r.technology_category,
                      "hot_technology": r.hot_technology, "in_demand": r.in_demand, "match_keys": "|".join(tech_keys(r.technology_example))})
    tech = pd.DataFrame(trows)
    tech.to_csv(os.path.join(DATA, "role_technology.csv"), index=False, encoding="utf-8", lineterminator="\n")

    links = []
    for sheet, dom in [("F13_EssSkills_to_WorkAct", "Essential Skills"), ("F15_TrfSkills_to_WorkAct", "Transferable Skills")]:
        f = pd.read_excel(a.src, sheet)
        for _, r in f.iterrows():
            links.append({"skill_element_id": r.iloc[0], "skill_element_name": r.iloc[1], "skill_domain": dom,
                          "activity_element_id": r.iloc[2], "activity_element_name": r.iloc[3], "source": sheet})
    pd.DataFrame(links).sort_values(["skill_element_id", "activity_element_id"]).to_csv(
        os.path.join(DATA, "skill_links.csv"), index=False, encoding="utf-8", lineterminator="\n")
    print(f"role_tasks {len(tasks)} แถว · role_technology {len(tech)} แถว · skill_links {len(links)} แถว")


if __name__ == "__main__":
    main()
