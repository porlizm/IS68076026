# -*- coding: utf-8 -*-
"""
build_sheets_import.py — สร้างไฟล์นำเข้า Google Sheets ตาม config/sheets.json

  sheets_import/ref_roles.csv · ref_requirements.csv · ref_corpus.csv · ref_mappings.csv  (มีข้อมูล)
  sheets_import/headers/<tab>.csv                                                           (หัวคอลัมน์ของทุกแท็บ 16 แท็บ)
  sheets_import/IS68076026_Sheets_Template.xlsx                                              (16 แท็บ พร้อมนำเข้าครั้งเดียว)

ref_mappings.mapping_status ถูก merge จาก data/mapping_review.csv (DEC-21) และสคริปต์หยุดถ้า
แถวที่ผ่านการตรวจน้อยกว่า 90% ของแถวชั้น L1
"""
import csv, json, os, sys
import pandas as pd

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA, OUT = os.path.join(ROOT, "data"), os.path.join(ROOT, "sheets_import")


def rd(n):
    return pd.read_csv(os.path.join(DATA, n), encoding="utf-8", dtype=str, keep_default_na=False)


def main():
    cfg = json.load(open(os.path.join(ROOT, "config", "sheets.json"), encoding="utf-8"))["tabs"]
    roles = pd.DataFrame(json.load(open(os.path.join(DATA, "roles.json"), encoding="utf-8"))["roles"])
    req, corpus, maps = rd("requirements.csv"), rd("corpus.csv"), rd("mappings.csv")
    rv_path = os.path.join(DATA, "mapping_review.csv")
    if not os.path.exists(rv_path):
        sys.exit("ข้อผิดพลาดของข้อมูลอ้างอิง: ไม่พบ data/mapping_review.csv — รัน python scripts/review_mappings.py ก่อน")
    rv = rd("mapping_review.csv").set_index("map_id")
    maps["mapping_status"] = maps.map_id.map(rv.mapping_status)
    if maps.mapping_status.isna().any():
        sys.exit("ข้อผิดพลาดของข้อมูลอ้างอิง: mapping_review.csv ไม่ครบทุก map_id")
    n_l1 = (maps.coverage_layer == "L1_researcher_tagged").sum()
    n_ok = (maps.mapping_status == "source_checked_by_script").sum()
    if n_ok < 0.9 * n_l1:
        sys.exit(f"ข้อผิดพลาดของข้อมูลอ้างอิง: แถว L1 {n_l1} แต่ผ่านการตรวจเพียง {n_ok} (< 90%)")

    frames = {
        "ref_roles": roles, "ref_requirements": req, "ref_corpus": corpus, "ref_mappings": maps,
    }
    os.makedirs(os.path.join(OUT, "headers"), exist_ok=True)
    counts = {}
    with pd.ExcelWriter(os.path.join(OUT, "IS68076026_Sheets_Template.xlsx")) as xw:
        for tab, spec in cfg.items():
            cols = spec["columns"]
            with open(os.path.join(OUT, "headers", f"{tab}.csv"), "w", encoding="utf-8", newline="") as fh:
                csv.writer(fh, lineterminator="\n").writerow(cols)
            if tab in frames:
                df = frames[tab][cols]
                df.to_csv(os.path.join(OUT, f"{tab}.csv"), index=False, encoding="utf-8", lineterminator="\n")
            else:
                df = pd.DataFrame(columns=cols)
            df.to_excel(xw, sheet_name=tab, index=False)
            counts[tab] = {"rows": len(df), "columns": len(cols)}
    with open(os.path.join(OUT, "sheets_import_counts.json"), "w", encoding="utf-8") as fh:
        json.dump(counts, fh, ensure_ascii=False, indent=2); fh.write("\n")
    for t, c in counts.items():
        print(f"  {t:22s} {c['rows']:>6,} แถว  {c['columns']:>3} คอลัมน์")


if __name__ == "__main__":
    main()
