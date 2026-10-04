# -*- coding: utf-8 -*-
"""
component_analysis.py - วิเคราะห์องค์ประกอบของระบบแบบพรรณนา (ไม่ใช่การทดลอง)

คำนวณจาก log ของรอบเดียวกันที่ระบบเก็บอยู่แล้ว (แท็บ findings และ decisions) เทียบกับชุดคำตอบอ้างอิงชุดเดียวกัน
ไม่เรียกโมเดลเพิ่ม ไม่เก็บข้อมูลผู้เข้าร่วมเพิ่ม

เงื่อนไขที่รายงาน
  full            ผลของระบบจริง (3 โมเดล , R2 R3 , R1 , R5/R6 , R7)
  full_no_r7      ผลจริงโดยคืนข้อที่ R7 ลดสถานะกลับเป็น evidenced
  rules_3models   3 โมเดล R2 R3a R3b R1 ไม่มี R5/R6/R7 (คำนวณจาก final_vote)
  lexical_only    3 โมเดล R3 คำซ้ำอย่างเดียว (ไม่มีผู้ตรวจความหมาย)
  r2_only         3 โมเดล ตรวจแค่ว่า quote มีในเรซูเม
  raw_claims      3 โมเดล ใช้คำตอบดิบ ไม่ตรวจอะไร
  single_A/B/C    โมเดลเดียวพร้อมกฎ R2 R3 (ไม่มีการโหวตข้ามโมเดล)

ข้อควรระวังในการอ่านผล: โมเดลเดี่ยวในตารางนี้ไม่ได้ถูก prompt ให้ทำงานคนเดียว จึงเป็นเพียงการดูว่าผลของแต่ละโมเดล
ในรอบที่รันร่วมกันเป็นอย่างไร ไม่ใช่การเปรียบเทียบเชิงเหตุและผล

  python analysis/component_analysis.py --exports private/exports/<วันที่> --out analysis/output/component
  python analysis/component_analysis.py --synthetic --out analysis/output/component_rehearsal
"""
import argparse, csv, json, os, sys
from collections import defaultdict
sys.path.insert(0, os.path.dirname(__file__))
from metrics import confusion, macro_f1, abstain_rate, REF  # noqa: E402
from bootstrap import bootstrap_ci, mean_of  # noqa: E402

TIE_ORDER = ["missing", "partially", "evidenced"]  # ตรงกับ engine.js
MODELS = ["A", "B", "C"]
MIN_USABLE, NEED = 2, 2
CONDITIONS = ["full", "full_no_r7", "rules_3models", "lexical_only", "r2_only", "raw_claims", "single_A", "single_B", "single_C"]


def rd(p):
    with open(p, encoding="utf-8-sig", newline="") as f: return list(csv.DictReader(f))


def flags_of(f): return set(str(f.get("rule_flags", "")).split("|")) - {""}


def vote_hybrid(f): return f["final_vote"]


def vote_lexical(f):
    return f["claimed_status"] if f["claimed_status"] != "missing" and f.get("r3_layer") == "lexical" else "missing"


def vote_r2(f):
    if f["claimed_status"] == "missing": return "missing"
    return "missing" if "R2_quote_not_found" in flags_of(f) else f["claimed_status"]


def vote_raw(f): return f["claimed_status"]


def r1(votes):
    """กฎ R1 ตาม engine.js: เสียงที่ unverified ไม่นับ , ต้องมีสถานะเดียวกันอย่างน้อย NEED เสียง , เสมอใช้ลำดับ missing < partially < evidenced"""
    counted = [v for v in votes if v in REF]
    cnt = {s: counted.count(s) for s in REF}
    mx = max(cnt.values()) if counted else 0
    if mx < NEED: return "abstained"
    tied = [s for s in REF if cnt[s] == mx]
    return tied[0] if len(tied) == 1 else next(s for s in TIE_ORDER if s in tied)


def statuses(cond, run, req_ids, dec, fnd):
    """คืน {requirement_id: สถานะของระบบ} ของผู้เข้าร่วมหนึ่งคนภายใต้เงื่อนไขหนึ่ง"""
    if cond in ("full", "full_no_r7"):
        out = {}
        for rid in req_ids:
            d = dec.get(rid)
            if d is None: continue
            s = d["final_status"]
            if cond == "full_no_r7" and ("R7_actor" in d.get("rule_flags", "") or "R7_reuse" in d.get("rule_flags", "")): s = "evidenced"
            out[rid] = s
        return out
    by_req = defaultdict(dict)
    for f in fnd: by_req[f["requirement_id"]][f["model_key"]] = f
    usable = {f["model_key"] for f in fnd}
    if cond.startswith("single_"):
        k = cond[-1]
        return {rid: (lambda v: v if v in REF else "abstained")(by_req[rid][k]["final_vote"]) if k in by_req[rid] else "abstained" for rid in req_ids}
    fn = dict(rules_3models=vote_hybrid, lexical_only=vote_lexical, r2_only=vote_r2, raw_claims=vote_raw)[cond]
    if len(usable) < MIN_USABLE: return {rid: "abstained" for rid in req_ids}
    return {rid: r1([fn(f) for f in by_req[rid].values()]) for rid in req_ids}


def false_evidence(pairs):
    """ระบบสรุปว่า evidenced แต่คำตอบอ้างอิงเป็น missing / ข้อที่ระบบสรุป evidenced ทั้งหมด"""
    pos = [(r, s) for r, s in pairs if s == "evidenced"]
    return (sum(1 for r, _ in pos if r == "missing") / len(pos)) if pos else None


def analyse(t, cohort=None, b=2000):
    main = set(cohort) if cohort else {r["run_id"] for r in t["runs"] if r.get("stage") == "delivered"}
    ref = {(g["run_id"], g["requirement_id"]): g["reference_status"] for g in t["ground_truth"] if g["run_id"] in main}
    dec = defaultdict(dict); fnd = defaultdict(list)
    for d in t["decisions"]:
        if d["run_id"] in main: dec[d["run_id"]][d["requirement_id"]] = d
    for f in t["findings"]:
        if f["run_id"] in main and f.get("target_kind", "requirement") == "requirement": fnd[f["run_id"]].append(f)
    res = {"n_participants": len(main), "conditions": {}, "note": "ผลเสริมเชิงพรรณนา ไม่ใช่การทดลอง และไม่อ้างเหตุและผล"}
    per = {c: {} for c in CONDITIONS}; pooled = {c: [] for c in CONDITIONS}
    for run in sorted(main):
        req_ids = sorted(rid for (r, rid) in ref if r == run)
        for c in CONDITIONS:
            st = statuses(c, run, req_ids, dec[run], fnd[run])
            pairs = [(ref[(run, rid)], st[rid]) for rid in req_ids if rid in st]
            m = confusion(pairs)
            per[c][run] = dict(macro_f1=macro_f1(m)["macro_f1"], abstain=abstain_rate(m)["value"], false_evidence=false_evidence(pairs))
            pooled[c] += pairs
    for c in CONDITIONS:
        units = [dict(run_id=r, **v) for r, v in per[c].items()]
        # ผลต่างรายผู้เข้าร่วมเทียบ full (จับคู่) ใช้เฉพาะคนที่ทั้งสองเงื่อนไขนิยามค่า
        diff = [dict(d=(per[c][r]["macro_f1"] - per["full"][r]["macro_f1"])) for r in per[c] if per[c][r]["macro_f1"] is not None and per["full"][r]["macro_f1"] is not None]
        m = confusion(pooled[c])
        res["conditions"][c] = dict(
            macro_f1_mean=bootstrap_ci(units, mean_of("macro_f1"), b=b),
            abstain_mean=bootstrap_ci(units, mean_of("abstain"), b=b),
            false_evidence_mean=bootstrap_ci(units, mean_of("false_evidence"), b=b),
            macro_f1_pooled=macro_f1(m)["macro_f1"], abstain_pooled=abstain_rate(m),
            diff_vs_full=(bootstrap_ci(diff, mean_of("d"), b=b) if diff and c != "full" else None), n_pairs=len(pooled[c]))
    # U ระดับคำกล่าวอ้างของโมเดล: คำกล่าวอ้างที่ไม่ผ่าน R2 หรือ R3 / คำกล่าวอ้างทั้งหมด (ไม่ใช่ missing)
    claims = [f for r in main for f in fnd[r] if f["claimed_status"] != "missing"]
    rej = [f for f in claims if f["final_vote"] == "missing"]
    res["claim_level"] = dict(n_claims=len(claims), n_rejected_by_rules=len(rej), U=(len(rej) / len(claims)) if claims else None,
                              per_model={k: dict(n=sum(1 for f in claims if f["model_key"] == k), rejected=sum(1 for f in rej if f["model_key"] == k)) for k in MODELS})
    return res


def report_md(res, label):
    f = lambda x: "N/A" if x is None else f"{x:.3f}"
    ci = lambda d: "N/A" if not d or d["estimate"] is None else f"{d['estimate']:.3f} [{f(d['lower'])}, {f(d['upper'])}]"
    L = [f"# การวิเคราะห์องค์ประกอบ ({label})", "", f"ผู้เข้าร่วม {res['n_participants']} คน. {res['note']}", "",
         "| เงื่อนไข | Macro-F1 เฉลี่ย [95% CI] | ผลต่างจาก full [95% CI] | อัตราไม่สรุป | หลักฐานเท็จ |", "|---|---|---|---|---|"]
    for c in CONDITIONS:
        x = res["conditions"][c]
        L.append(f"| {c} | {ci(x['macro_f1_mean'])} | {ci(x['diff_vs_full'])} | {ci(x['abstain_mean'])} | {ci(x['false_evidence_mean'])} |")
    cl = res["claim_level"]
    L += ["", "หลักฐานเท็จ = สัดส่วนของข้อที่ระบบสรุปว่า evidenced แต่คำตอบอ้างอิงเป็น missing", "",
          f"คำกล่าวอ้างของโมเดล {cl['n_claims']} รายการ ไม่ผ่านกฎตรวจ {cl['n_rejected_by_rules']} รายการ (U = {f(cl['U'])})"]
    return "\n".join(L) + "\n"


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--exports"); ap.add_argument("--synthetic", action="store_true")
    ap.add_argument("--out", required=True); ap.add_argument("--label", default="MAIN")
    a = ap.parse_args()
    if a.synthetic:
        from synth_data import make_tables
        tables, cohort = make_tables(); tables["findings"] = tables.get("findings", [])
        label = "ซ้อมด้วยข้อมูลสังเคราะห์"
    else:
        tabs = ["runs", "decisions", "findings", "ground_truth"]
        tables = {t: rd(os.path.join(a.exports, t + ".csv")) for t in tabs}
        cp = os.path.join(a.exports, "cohort.csv")
        cohort = [r["run_id"] for r in rd(cp) if r["cohort"] == "main"] if os.path.exists(cp) else None
        label = a.label
    res = analyse(tables, cohort)
    os.makedirs(a.out, exist_ok=True)
    json.dump(res, open(os.path.join(a.out, "component_analysis.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(os.path.join(a.out, "component_analysis.md"), "w", encoding="utf-8").write(report_md(res, label))
    print(report_md(res, label))
