# -*- coding: utf-8 -*-
"""
book_numbers.py — คำนวณตัวเลขทุกตัวที่เล่มอ้าง จากไฟล์จริง (ไม่พิมพ์ตัวเลขลงเล่มด้วยมือ)
  python scripts/book_numbers.py   -> book/numbers.json
แหล่ง: data/*.csv · data/manifest.json · evidence/mapping_review_summary.json · evidence/coverage_simulation.json
       evidence/run_local/case_*/summary.json · evidence/test_summary.json
ตัวเลขในเล่มเขียนเป็น {{key}} และ scripts/build_book.py แทนค่าตอน build ถ้าไม่มี key ใด build จะหยุด
"""
import json, os, datetime
import pandas as pd

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
J = lambda *p: json.load(open(os.path.join(ROOT, *p), encoding="utf-8"))
TH_MONTH = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]


def fmt(x, d=0):
    if isinstance(x, str): return x
    return f"{x:,.{d}f}"


def main():
    c = pd.read_csv(os.path.join(ROOT, "data", "corpus.csv"), dtype=str, keep_default_na=False)
    m = pd.read_csv(os.path.join(ROOT, "data", "mappings.csv"), dtype=str, keep_default_na=False)
    gap = pd.read_csv(os.path.join(ROOT, "data", "corpus_gap_request.csv"), dtype=str, keep_default_na=False)
    rv = J("evidence", "mapping_review_summary.json")
    man = J("data", "manifest.json")
    sim = J("evidence", "coverage_simulation.json")
    tests = J("evidence", "test_summary.json")
    h = c.estimated_hours.astype(float)
    n = {
        "corpus_version": man["corpus_version"], "corpus_items": fmt(len(c)),
        "corpus_courses": fmt((c.item_type == "course").sum()), "corpus_certs": fmt((c.item_type == "certification").sum()),
        "hours_min": fmt(h.min()), "hours_max": fmt(h.max()), "hours_median": fmt(h.median()),
        "cert_hours_mean": fmt(h[c.item_type == "certification"].mean()), "course_hours_mean": fmt(h[c.item_type == "course"].mean()),
        "map_total": fmt(len(m)), "map_L1": fmt((m.coverage_layer == "L1_researcher_tagged").sum()),
        "map_L2": fmt((m.coverage_layer == "L2_rule_augmented").sum()),
        "map_passed": fmt(rv["rows_passed"]), "map_failed_not_L1": fmt(rv["rows_failed_not_L1"]),
        "map_failed_L1_other": fmt(rv["rows_failed_L1_other"]), "items_in_passed": fmt(rv["items_in_passed_rows"]),
        "req_covered": fmt(rv["requirements_with_passed_item"]), "per_role_min": fmt(rv["per_role_min"]), "per_role_max": fmt(rv["per_role_max"]),
        "req_uncovered": fmt(600 - rv["requirements_with_passed_item"]),
        "req_uncovered_ids": ", ".join(gap.requirement_id) if len(gap) else "ไม่มี",
        "foundation_rows": fmt((c.batch == "v1.5_foundation").sum()), "foundation_maps": fmt((m.mapping_method == "foundation_track").sum()),
        "promoted": fmt((m.mapping_method == "researcher_promoted").sum()),
        "url_pending_items": fmt((c.verification_status != "verified").sum()),
        "tests_total": fmt(tests["pass"] + tests["fail"]), "tests_pass": fmt(tests["pass"]),
        "manifest_frozen": "ตรึงแล้ว" if man["frozen"] else "ยังไม่ตรึง (ตรึงหลังการทดสอบนำร่องตามหัวข้อ 3.7)",
    }
    d = datetime.date.fromisoformat(rv.get("reviewed_at", "2026-10-01")) if rv.get("reviewed_at") else datetime.date(2026, 10, 1)
    n["review_date_th"] = f"{d.day} {TH_MONTH[d.month]} {d.year + 543}"
    cap = {(s["months"], s["hours_per_week"]): s for s in sim["by_capacity"]}
    mode = {s["mode"]: s for s in sim["by_mode_6m10h"]}
    n["sim_both_6m10h"] = fmt(cap[(6, 10)]["covered"]); n["sim_both_6m5h"] = fmt(cap[(6, 5)]["covered"])
    n["sim_cert_6m10h"] = fmt(mode["certification_only"]["covered"]); n["sim_course_6m10h"] = fmt(mode["course_only"]["covered"])
    for k in "ABC":
        s = J("evidence", "run_local", f"case_{k}", "summary.json")
        R = s["R"]
        n.update({f"c{k}_m": fmt(s["usable_models"]), f"c{k}_decided": fmt(s["decided"]), f"c{k}_correct": fmt(s["correct_on_decided"]),
                  f"c{k}_acc": f"{s['accuracy_on_decided']:.3f}", f"c{k}_R": R if isinstance(R, str) else f"{R:.2f}",
                  f"c{k}_C": f"{float(s['C']):.3f}", f"c{k}_U": fmt(s["unsupported_claims"]), f"c{k}_items": fmt(s["plan_items"]),
                  f"c{k}_hours": fmt(s["plan_hours"]), f"c{k}_abstained": fmt(s["total"] - s["decided"]),
                  f"c{k}_gapcov": s["gap_coverage"] if isinstance(s["gap_coverage"], str) else f"{s['gap_coverage']:.2f}",
                  f"c{k}_nocand": fmt(s["uncovered_no_candidate"])})
    # ---------- ความครอบคลุม 600 (DEC-41) ----------
    n["cov_corpus"] = fmt(sim["corpus_coverage"]); n["cov_plan"] = fmt(cap[(6, 10)]["covered"])
    n["cov_corpus_gap"] = fmt(600 - sim["corpus_coverage"]); n["cov_plan_gap"] = fmt(600 - cap[(6, 10)]["covered"])
    n["plan_strategy"] = sim.get("strategy", "weighted_greedy")
    for h in (5, 15, 20): n[f"cov_plan_6m{h}h"] = fmt(cap[(6, h)]["covered"])
    mon = {s["months"]: s for s in sim.get("by_months_10h", [])}
    for mm in (12, 18, 24): n[f"cov_plan_{mm}m10h"] = fmt(mon[mm]["covered"]) if mm in mon else "N/A"
    n["cov_plan_mean_items"] = f"{cap[(6, 10)]['mean_items_per_plan']:.1f}"; n["cov_plan_mean_hours"] = f"{cap[(6, 10)]['mean_hours_per_plan']:.1f}"
    n["Hmax_6m10h"] = f"{cap[(6, 10)]['Hmax']:.1f}"; n["Hmax_6m5h"] = f"{cap[(6, 5)]['Hmax']:.1f}"
    dg = J("evidence", "coverage_diagnostics.json")
    cur, fut = dg["scenarios"]["current"], dg["scenarios"]["url_and_additions"]
    mins = [r["ilp_min_hours_all"] for r in cur["roles"]]; fmins = [r["ilp_min_hours_all"] for r in fut["roles"]]
    n["ilp_min_lo"], n["ilp_min_hi"] = fmt(min(mins)), fmt(max(mins)); n["ilp_fit_roles"] = fmt(sum(r["fits_Hmax"] for r in cur["roles"]))
    n["ilp_max_cov"] = fmt(cur["totals"]["ilp"]); n["ilp_min_lo_add"], n["ilp_min_hi_add"] = fmt(min(fmins)), fmt(max(fmins))
    n["ilp_fit_roles_add"] = fmt(sum(r["fits_Hmax"] for r in fut["roles"]))
    n["cause_hours"] = fmt(cur["totals"].get("cause_hours", 0)); n["cause_selection"] = fmt(cur["totals"].get("cause_selection", 0))
    n["cause_no_item"] = fmt(cur["totals"].get("cause_no_item", 0))
    adds = pd.read_csv(os.path.join(ROOT, "data", "corpus_additions.csv"), dtype=str, keep_default_na=False)
    conf = adds.researcher_result.str.strip().str.upper().isin(["LIVE", "OK", "VERIFIED"])
    n["add_total"] = fmt(len(adds)); n["add_confirmed"] = fmt(int(conf.sum())); n["add_pending"] = fmt(int((~conf).sum()))
    n["add_hours_lo"] = fmt(adds.estimated_hours.astype(float).min()); n["add_hours_hi"] = fmt(adds.estimated_hours.astype(float).max())
    n["foundation_ext_maps"] = fmt((pd.read_csv(os.path.join(ROOT, "data", "corpus_change_log.csv"), dtype=str).change == "foundation_L1_extended").sum())
    wi = J("evidence", "coverage_whatif.json")["scenarios"]["url_and_additions"][n["plan_strategy"]]["primary_6m10h_both"]["covered"]
    n["cov_whatif_plan"] = fmt(wi); n["cov_whatif_corpus"] = fmt(fut["totals"]["coverable"])
    if sim["corpus_coverage"] == 600 and cap[(6, 10)]["covered"] == 600:
        n["cov_status_note"] = "ทั้งสองตัวชี้วัดถึงเป้า 600 ข้อ"
    else:
        n["cov_status_note"] = (f"ยังไม่ถึงเป้า เพราะรายการเรียนรู้ใหม่ {n['add_pending']} รายการยังรอผู้วิจัยเปิดตรวจยืนยัน "
                                f"ระบบจึงยังไม่นับรายการเหล่านี้ เมื่อยืนยันครบ การจำลองชุดเดียวกันให้ความครอบคลุมของคลัง "
                                f"{n['cov_whatif_corpus']} ข้อ และของแผนจำลอง {n['cov_whatif_plan']} ข้อ")
    trow = ["| อาชีพ | ข้อที่มีรายการรองรับ | แผนจำลองครอบคลุม | ชั่วโมงของแผน | ชั่วโมงขั้นต่ำเพื่อครบทุกข้อ (ILP) |", "|---|---|---|---|---|"]
    per = {r["role_id"]: r for r in sim["primary_6m10h_both"]["per_role"]}
    for r in cur["roles"]:
        trow.append(f"| {r['role_id']} | {r['coverable']} | {per[r['role_id']]['covered']} | {per[r['role_id']]['hours']:,.0f} | {r['ilp_min_hours_all']:,.0f} |")
    n["coverage_role_table"] = "\n".join(trow)
    url = pd.read_csv(os.path.join(ROOT, "data", "url_manual_check.csv"), dtype=str, keep_default_na=False)
    n["url_pending_urls"] = fmt(int((~url.researcher_result.str.strip().str.upper().isin(["LIVE", "OK", "VERIFIED"])).sum()))
    wm = J("workflows", "manifest.json")
    n["wf_name"] = wm["workflow"]["file"].replace(".json", ""); n["wf_nodes"] = fmt(wm["workflow"]["nodes"]); n["wf_notes"] = fmt(wm["workflow"]["sticky_notes"])
    n["wf_sections"] = fmt(len(wm["workflow"]["sections"])); n["n8n_version"] = wm["n8n_version"]; n["engine_version"] = wm["engine_version"]
    for i, s_ in enumerate(wm["workflow"]["sections"], 1): n[f"wf_s{i}_nodes"] = fmt(s_["nodes"]); n[f"wf_s{i}_th"] = s_["th"]
    n["wf_final_nodes"] = fmt(wm["superseded"]["WF_Final_IS"]["nodes"])
    n["text_layer_min_chars"] = fmt(J("config", "project.json")["text_layer_min_chars"])
    import re as _re
    tr = open(os.path.join(ROOT, "evidence", "WF_analysis.md"), encoding="utf-8").read().split("## 2 · Traceability")[1].split("\n## ")[0]
    n["trace_rows"] = fmt(len([l for l in tr.split("\n") if l.startswith("| ") and not l.startswith("| ช่วง")]))
    rows = ["| ไฟล์ | จำนวนแถว | SHA-256 |", "|---|---|---|"]
    for f, v in man["files"].items(): rows.append(f"| {f} | {v['rows']:,} | {v['sha256']} |")
    n["manifest_table"] = "\n".join(rows)
    with open(os.path.join(ROOT, "book", "numbers.json"), "w", encoding="utf-8") as fh:
        json.dump(n, fh, ensure_ascii=False, indent=1); fh.write("\n")
    print(f"numbers.json · {len(n)} ค่า · corpus {n['corpus_items']} · map {n['map_total']} · passed {n['map_passed']} · req {n['req_covered']}/600 · tests {n['tests_total']}")


if __name__ == "__main__":
    main()
