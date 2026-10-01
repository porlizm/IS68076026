# -*- coding: utf-8 -*-
"""
review_mappings.py  (IS 68076026 · Final_IS)

ตรวจความสอดคล้องของความเชื่อมโยงตามเกณฑ์ห้าข้อในหัวข้อ 3.3.2 แล้วเขียน data/mapping_review.csv
  C1 รายการมี verification_status = verified และ source_url ขึ้นต้น https://
  C2 requirement_id อยู่ในชุด 30 ข้อของอาชีพนั้นจริง (และ item.role_id == mapping.role_id)
  C3 coverage_layer = L1_researcher_tagged
  C4 requirement_id ปรากฏใน competency_ids_l1 ของรายการ (ข้อมูลสองแหล่งตรงกัน)
  C5 estimated_hours > 0 และ recommendation_mode ไม่ว่าง

แถวที่ผ่านทุกข้อ -> source_checked_by_script · ไม่ผ่าน -> pending_review + review_flags
mappings.csv ไม่ถูกแก้ (คง pending_review ทุกแถว) · สถานะที่ใช้จริงอยู่ในไฟล์นี้เท่านั้น (DEC-21)
พิมพ์สรุปในรูปแบบตารางที่ 3.6 และเขียน evidence/mapping_review_summary.json
"""
import json, os
import pandas as pd

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA = os.path.join(ROOT, "data")


def rd(n):
    return pd.read_csv(os.path.join(DATA, n), encoding="utf-8", dtype=str, keep_default_na=False)


def main():
    req, corpus, maps = rd("requirements.csv"), rd("corpus.csv"), rd("mappings.csv")
    ci = corpus.set_index("item_id")
    reqset = set(zip(req.role_id, req.requirement_id))
    out = []
    for _, m in maps.iterrows():
        it = ci.loc[m.item_id]
        f = []
        if not (it.verification_status == "verified" and it.source_url.startswith("https://")): f.append("C1_item_not_verified")
        if (m.role_id, m.requirement_id) not in reqset or it.role_id != m.role_id: f.append("C2_requirement_not_in_role")
        if m.coverage_layer != "L1_researcher_tagged": f.append("C3_not_L1")
        if m.requirement_id not in it.competency_ids_l1.split("|"): f.append("C4_not_in_competency_ids_l1")
        try: h = float(it.estimated_hours)
        except ValueError: h = 0
        if not (h > 0 and it.recommendation_mode.strip()): f.append("C5_hours_or_mode")
        out.append(dict(map_id=m.map_id, item_id=m.item_id, role_id=m.role_id, requirement_id=m.requirement_id,
                        coverage_layer=m.coverage_layer,
                        mapping_status="pending_review" if f else "source_checked_by_script",
                        review_flags="|".join(f), reviewed_by="scripts/review_mappings.py", reviewed_at="2026-10-01"))
    rv = pd.DataFrame(out)
    rv.to_csv(os.path.join(DATA, "mapping_review.csv"), index=False, encoding="utf-8", lineterminator="\n")

    ok = rv[rv.mapping_status == "source_checked_by_script"]
    per_role = ok.groupby("role_id").requirement_id.nunique()
    fail_l2 = rv[(rv.mapping_status != "source_checked_by_script") & rv.review_flags.str.contains("C3")]
    fail_other = rv[(rv.mapping_status != "source_checked_by_script") & ~rv.review_flags.str.contains("C3")]
    s = dict(
        corpus_version=corpus.corpus_version.iloc[0],
        rows_total=len(rv), rows_passed=len(ok), rows_failed_not_L1=len(fail_l2),
        rows_failed_L1_other=len(fail_other),
        failed_L1_reasons=fail_other.review_flags.value_counts().to_dict(),
        items_in_passed_rows=int(ok.item_id.nunique()), items_total=len(corpus),
        requirements_with_passed_item=int(ok.requirement_id.nunique()), requirements_total=len(req),
        roles_passed=int(per_role.size), per_role_min=int(per_role.min()), per_role_max=int(per_role.max()),
        L1_rows=int((rv.coverage_layer == "L1_researcher_tagged").sum()),
    )
    s["passed_share_of_L1"] = round(s["rows_passed"] / s["L1_rows"], 4)
    os.makedirs(os.path.join(ROOT, "evidence"), exist_ok=True)
    with open(os.path.join(ROOT, "evidence", "mapping_review_summary.json"), "w", encoding="utf-8") as fh:
        json.dump(s, fh, ensure_ascii=False, indent=2); fh.write("\n")
    print("ตารางที่ 3.6 (คำนวณจากไฟล์จริง)")
    print(f"  แถวความเชื่อมโยงทั้งหมดที่นำเข้าตรวจ            {s['rows_total']:,}")
    print(f"  แถวที่ผ่านเกณฑ์ (source_checked_by_script)        {s['rows_passed']:,}")
    print(f"  แถวที่ไม่ผ่านเพราะไม่ใช่ชั้น L1                    {s['rows_failed_not_L1']:,}")
    print(f"  แถวชั้น L1 ที่ไม่ผ่านด้วยเหตุอื่น                 {s['rows_failed_L1_other']:,} {s['failed_L1_reasons']}")
    print(f"  รายการที่ปรากฏในแถวที่ผ่าน                       {s['items_in_passed_rows']} จาก {s['items_total']}")
    print(f"  ข้อกำหนดที่มีรายการรองรับ                         {s['requirements_with_passed_item']} จาก 600 (รายอาชีพ {s['per_role_min']}–{s['per_role_max']})")
    print(f"  อาชีพที่ผ่านการตรวจครบ                            {s['roles_passed']} จาก 20")


if __name__ == "__main__":
    main()
