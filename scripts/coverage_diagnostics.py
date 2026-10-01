# -*- coding: utf-8 -*-
"""
coverage_diagnostics.py — Phase 1.3 (DEC-41) วินิจฉัยความครอบคลุม 600 ข้อกำหนด

  python scripts/coverage_diagnostics.py      -> evidence/coverage_diagnostics.json + ตารางสรุปบนจอ
ต้องรัน node scripts/simulate_coverage.mjs และ --what-if ก่อน (ใช้ผลของ engine.buildPlan ตัวจริง)

รายงาน
  (ก) ข้อกำหนดที่ไม่มีรายการ L1 ผ่าน C1–C5 รองรับ (ความครอบคลุมของคลัง)
  (ข) ต่ออาชีพ: ข้อกำหนดที่แผนจำลองไม่ครอบคลุม และสาเหตุ
       no_item = ไม่มีรายการ · hours = มีรายการแต่แม้เลือกแบบเหมาะที่สุด (ILP) ก็เกิน Hmax
       selection = ILP ครอบคลุมได้ภายใน Hmax แต่ลำดับการเลือกของ greedy ไม่ได้เลือก
  (ค) ชั่วโมงขั้นต่ำที่ครอบคลุมทุกข้อที่มีรายการ (weighted set cover, ILP ด้วย PuLP/CBC) เทียบ Hmax 6 เดือน 10 ชม.
กรณีเลวร้ายที่สุด: ทั้ง 30 ข้อเป็นช่องว่าง · mode = both · candidate ตามนิยามเดียวกับ engine.buildPlan
"""
import json, os, collections
import pandas as pd
import pulp

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
D = lambda *p: os.path.join(ROOT, *p)
rd = lambda n: pd.read_csv(D("data", n), dtype=str, keep_default_na=False)
APPROVED = {"source_checked_by_script", "expert_reviewed"}
L1 = "L1_researcher_tagged"


def candidates(url=False, add=False):
    c, m, rv, req = rd("corpus.csv"), rd("mappings.csv"), rd("mapping_review.csv"), rd("requirements.csv")
    st = dict(zip(rv.map_id, rv.mapping_status)); fl = dict(zip(rv.map_id, rv.review_flags))
    hours = dict(zip(c.item_id, c.estimated_hours.astype(float)))
    ver = dict(zip(c.item_id, c.verification_status == "verified"))
    modes = dict(zip(c.item_id, c.recommendation_mode))
    G = collections.defaultdict(lambda: collections.defaultdict(set))
    for r in m.itertuples():
        ok = st.get(r.map_id) in APPROVED or (url and fl.get(r.map_id) == "C1_item_not_verified")
        if not ok or r.coverage_layer != L1: continue
        if not (ver[r.item_id] or url) or not hours[r.item_id] > 0 or "both" not in modes[r.item_id].split("|"): continue
        G[r.role_id][r.item_id].add(r.requirement_id)
    if add:
        a = rd("corpus_additions.csv")
        for f in a.itertuples():
            if f.researcher_result.strip().upper() in ("LIVE", "OK", "VERIFIED"): continue
            for q in req[req.element_id.isin(f.elements.split("|"))].itertuples():
                iid = f"CRS-{q.role_id}-{f.key}"; G[q.role_id][iid].add(q.requirement_id); hours[iid] = float(f.estimated_hours)
    return req, G, hours


def ilp(G, hours, reqs, Hmax):
    items = sorted(G); cov = sorted(set().union(*[G[i] for i in items])) if items else []
    # (ค) ชั่วโมงขั้นต่ำครอบคลุมทุกข้อที่มีรายการ
    p = pulp.LpProblem("min", pulp.LpMinimize); x = {i: pulp.LpVariable(f"x{n}", cat="Binary") for n, i in enumerate(items)}
    p += pulp.lpSum(hours[i] * x[i] for i in items)
    for r in cov: p += pulp.lpSum(x[i] for i in items if r in G[i]) >= 1
    p.solve(pulp.PULP_CBC_CMD(msg=0)); hmin = round(pulp.value(p.objective) or 0, 1)
    # ครอบคลุมสูงสุดภายใน Hmax (ตัดสินเท่ากันด้วยชั่วโมงน้อย)
    q = pulp.LpProblem("max", pulp.LpMaximize); y = {i: pulp.LpVariable(f"y{n}", cat="Binary") for n, i in enumerate(items)}
    z = {r: pulp.LpVariable(f"z{n}", cat="Binary") for n, r in enumerate(cov)}
    q += 1000 * pulp.lpSum(z.values()) - pulp.lpSum(hours[i] * y[i] for i in items)
    q += pulp.lpSum(hours[i] * y[i] for i in items) <= Hmax
    for r in cov: q += z[r] <= pulp.lpSum(y[i] for i in items if r in G[i])
    q.solve(pulp.PULP_CBC_CMD(msg=0))
    best = {r for r in cov if z[r].value() > 0.5}
    return dict(coverable=len(cov), no_item=sorted(set(reqs) - set(cov)), ilp_min_hours=hmin, ilp_max_covered=len(best),
                ilp_uncovered=sorted(set(cov) - best), ilp_items=sorted(i for i in items if y[i].value() > 0.5))


def main():
    proj = json.load(open(D("config", "project.json"), encoding="utf-8"))
    Hmax = round(6 * proj["weeks_per_month"] * 10, 4)
    sim = json.load(open(D("evidence", "coverage_simulation.json"), encoding="utf-8"))
    wi = json.load(open(D("evidence", "coverage_whatif.json"), encoding="utf-8"))
    strat = proj.get("plan_strategy", "weighted_greedy")
    out = dict(Hmax=Hmax, strategy=strat, scenarios={})
    for name, opt in dict(current={}, url_verified=dict(url=True), additions_confirmed=dict(add=True),
                          url_and_additions=dict(url=True, add=True)).items():
        req, G, hours = candidates(**opt)
        eng = {r["role_id"]: r for r in wi["scenarios"][name][strat]["primary_6m10h_both"]["per_role"]}
        roles, tot = [], collections.Counter()
        for rid, R in req.groupby("role_id"):
            reqs = list(R.requirement_id); d = ilp(G[rid], hours, reqs, Hmax); e = eng[rid]
            plan_cov = e["covered"]; miss = set(e["uncovered_no_candidate"]) | set(e["uncovered_over_capacity"])
            cause = {}
            for r in miss:
                cause[r] = "no_item" if r in d["no_item"] else ("hours" if r in d["ilp_uncovered"] else "selection")
            roles.append(dict(role_id=rid, plan_covered=plan_cov, ilp_max_covered=d["ilp_max_covered"],
                              ilp_min_hours_all=d["ilp_min_hours"], fits_Hmax=d["ilp_min_hours"] <= Hmax,
                              coverable=d["coverable"], uncovered=dict(sorted(cause.items()))))
            tot["plan"] += plan_cov; tot["ilp"] += d["ilp_max_covered"]; tot["coverable"] += d["coverable"]
            for v in cause.values(): tot["cause_" + v] += 1
        out["scenarios"][name] = dict(totals=dict(tot), roles=roles)
        print(f"{name:20s} คลัง {tot['coverable']}/600 · แผน (engine {strat}) {tot['plan']}/600 · ILP สูงสุด {tot['ilp']}/600 · "
              f"สาเหตุ no_item {tot['cause_no_item']} hours {tot['cause_hours']} selection {tot['cause_selection']} · "
              f"อาชีพที่ ILP ≤ Hmax {sum(r['fits_Hmax'] for r in roles)}/20")
    out["corpus_coverage_current"] = sim.get("corpus_coverage")
    json.dump(out, open(D("evidence", "coverage_diagnostics.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
