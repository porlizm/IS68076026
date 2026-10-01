# -*- coding: utf-8 -*-
"""
run_analysis.py — วิเคราะห์ RQ1/RQ2 จาก CSV ที่ export จากสเปรดชีต (Analysis Plan v1.0 หัวข้อ 7)

  python analysis/run_analysis.py --exports private/exports/<YYYY-MM-DD> --out analysis/output/main --label MAIN
  python analysis/run_analysis.py --synthetic --out analysis/output/rehearsal   (ซ้อมด้วยข้อมูลสังเคราะห์ 30+5)

ผลลัพธ์: results.json · report.md (ตารางพร้อมตัวเศษ/ตัวหาร) · criteria.json (เกณฑ์อ่านผลที่ประกาศล่วงหน้า)
"""
import argparse, csv, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from metrics import rq1, rq2, cohen_kappa, likert_items, REF  # noqa: E402
from bootstrap import bootstrap_ci, mean_of  # noqa: E402

CRITERIA = {  # ต้องตรงกับ Analysis Plan v1.0 หัวข้อ 6 · ห้ามแก้หลังเห็นข้อมูลกลุ่มหลัก
    "rq1_macro_f1_mean_min": 0.70, "rq1_abstain_rate_max": 0.20, "kappa_min": 0.61,
    "rq2_relevance_min": 0.80, "rq2_item_accuracy_eq": 1.0, "rq2_time_feasibility_eq": 1.0, "rq2_likert_mean_min": 3.5,
}
EVAL_KEYS = ["ข้อ 1 ช่วยระบุสิ่งที่ควรเริ่มเรียน", "ข้อ 2 ช่วยจัดลำดับการพัฒนาทักษะ", "ข้อ 3 เหมาะกับเวลาที่จัดสรรได้"]


def rd(p):
    with open(p, encoding="utf-8-sig", newline="") as f: return list(csv.DictReader(f))


def analyse(t, cohort=None):
    main = set(cohort) if cohort else {r["run_id"] for r in t["runs"] if r.get("stage") == "delivered"}
    dec = {(d["run_id"], d["requirement_id"]): d["final_status"] for d in t["decisions"] if d["run_id"] in main}
    gt = [g for g in t["ground_truth"] if g["run_id"] in main]
    rows = [dict(run_id=g["run_id"], reference_status=g["reference_status"], final_status=dec[(g["run_id"], g["requirement_id"])]) for g in gt if (g["run_id"], g["requirement_id"]) in dec]
    r1 = rq1(rows)
    units = [dict(run_id=k, **v) for k, v in r1["per_participant"].items()]
    r1["ci_macro_f1_mean"] = bootstrap_ci(units, mean_of("macro_f1"))
    r1["ci_abstain_mean"] = bootstrap_ci(units, mean_of("abstain"))
    pairs = [(g["coder_1_status"], g["coder_2_status"]) for g in gt if g.get("coder_2_status") in REF and g.get("coder_1_status") in REF]
    kap = cohen_kappa([a for a, _ in pairs], [b for _, b in pairs]) if pairs else None
    corpus = {c["item_id"]: c for c in t["ref_corpus"]}
    plans = {}
    for p in t["plan_items"]:
        if p["run_id"] in main: plans.setdefault(p["run_id"], []).append(p)
    for rid in main: plans.setdefault(rid, [])
    ref_gaps = {}
    for g in gt:
        if g["reference_status"] in ("missing", "partially"): ref_gaps.setdefault(g["run_id"], set()).add(g["requirement_id"])
    hmax = {r["run_id"]: float(r["timeline_months"]) * 4.33 * float(r["hours_per_week"]) for r in t["runs"] if r["run_id"] in main}
    reviews = [r for r in t["pathway_review"] if r["run_id"] in main]
    r2 = rq2(plans, reviews, ref_gaps, corpus, hmax)
    ev = [e for e in t["evaluation_responses"] if e.get("รหัสงานที่ปรากฏในรายงาน") in main]
    r2["perceived_usefulness"] = likert_items(ev, EVAL_KEYS)
    r2["non_response"] = len(main) - len({e["รหัสงานที่ปรากฏในรายงาน"] for e in ev})
    crit = {
        "rq1_macro_f1": r1["primary_mean_macro_f1"] is not None and r1["primary_mean_macro_f1"] >= CRITERIA["rq1_macro_f1_mean_min"],
        "rq1_abstain": r1["abstain_pooled"]["value"] is not None and r1["abstain_pooled"]["value"] <= CRITERIA["rq1_abstain_rate_max"],
        "kappa": kap is not None and kap["kappa"] is not None and kap["kappa"] >= CRITERIA["kappa_min"],
        "rq2_relevance": (r2["relevance"]["value"] or 0) >= CRITERIA["rq2_relevance_min"],
        "rq2_item_accuracy": r2["item_accuracy"]["value"] == 1.0, "rq2_time": r2["time_feasibility"]["value"] == 1.0,
        "rq2_likert": {k: (v["mean"] or 0) >= CRITERIA["rq2_likert_mean_min"] for k, v in r2["perceived_usefulness"].items()},
    }
    return dict(n_main=len(main), rq1=r1, kappa=kap, rq2=r2, criteria=CRITERIA, criteria_met=crit)


def report_md(res, label):
    f = lambda x: "N/A" if x is None else f"{x:.3f}"
    r1, r2 = res["rq1"], res["rq2"]
    L = [f"# ผลการวิเคราะห์ ({label})", "", f"ผู้เข้าร่วมกลุ่มหลัก {res['n_main']} คน", "", "## RQ1",
         f"- Macro-F1 เฉลี่ยรายผู้เข้าร่วม (ค่าหลัก): {f(r1['primary_mean_macro_f1'])} · 95% CI [{f(r1['ci_macro_f1_mean']['lower'])}, {f(r1['ci_macro_f1_mean']['upper'])}] · n = {r1['n_participants_in_mean']}",
         f"- Macro-F1 จากข้อมูลรวม: {f(r1['pooled']['macro_f1'])} (เฉลี่ย {r1['pooled']['n_statuses']} สถานะ) · ค่าประกอบ (abstained = ผิด): {f(r1['pooled_supplementary']['macro_f1'])}",
         f"- อัตราการไม่สรุป: {f(r1['abstain_pooled']['value'])} ({r1['abstain_pooled']['numerator']}/{r1['abstain_pooled']['denominator']})",
         "", "| เฉลย \\ ระบบ | evidenced | partially | missing | abstained |", "|---|---|---|---|---|"]
    for r in REF: L.append(f"| {r} | " + " | ".join(str(r1["confusion"][r][s]) for s in ["evidenced", "partially", "missing", "abstained"]) + " |")
    k = res["kappa"]
    L += ["", f"- Cohen's kappa: {f(k['kappa']) if k else 'N/A'} (n = {k['n'] if k else 0}) · เกณฑ์ ≥ 0.61", "", "## RQ2"]
    for key in ["relevance", "gap_coverage", "item_accuracy", "time_feasibility"]:
        v = r2[key]; L.append(f"- {key}: {f(v['value'])} ({v['numerator']}/{v['denominator']})")
    L.append(f"- กรณีพิเศษ: {r2['special_cases']} · ไม่ตอบแบบประเมิน {r2['non_response']} คน")
    for q, v in r2["perceived_usefulness"].items():
        L.append(f"- {q}: ค่าเฉลี่ย {f(v['mean'])} SD {f(v['sd'])} n {v['n']} · ประเมินไม่ได้ {v['cannot_assess']}")
    L += ["", "## เกณฑ์อ่านผลที่ประกาศล่วงหน้า", "```", json.dumps(res["criteria_met"], ensure_ascii=False, indent=1), "```"]
    return "\n".join(L) + "\n"


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--exports"); ap.add_argument("--synthetic", action="store_true")
    ap.add_argument("--out", required=True); ap.add_argument("--label", default="MAIN")
    a = ap.parse_args()
    if a.synthetic:
        from synth_data import make_tables
        tables, cohort = make_tables()
    else:
        tabs = ["runs", "decisions", "ground_truth", "plan_items", "pathway_review", "ref_corpus", "evaluation_responses"]
        tables = {t: rd(os.path.join(a.exports, t + ".csv")) for t in tabs}
        cp = os.path.join(a.exports, "cohort.csv")
        cohort = [r["run_id"] for r in rd(cp) if r["cohort"] == "main"] if os.path.exists(cp) else None
    res = analyse(tables, cohort)
    os.makedirs(a.out, exist_ok=True)
    json.dump(res, open(os.path.join(a.out, "results.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1, default=list)
    json.dump(res["criteria_met"], open(os.path.join(a.out, "criteria.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(os.path.join(a.out, "report.md"), "w", encoding="utf-8").write(report_md(res, a.label))
    print(report_md(res, a.label))
