# -*- coding: utf-8 -*-
"""
metrics.py — ตัวชี้วัดของ RQ1/RQ2 ตามหัวข้อ 3.9 ของเล่มและ docs/research_tools/Analysis_Plan_v1.0.md
ไม่มี dependency นอก standard library · ทุกฟังก์ชันคืนตัวเศษและตัวหารดิบพร้อมค่า

RQ1: confusion 3×4 · P/R/F1 รายสถานะ · Macro-F1 หลัก (บนข้อที่สรุปได้) · Macro-F1 ประกอบ (abstained = ผิด)
     · อัตราการไม่สรุป · Cohen's kappa (รหัสก่อนหาข้อยุติ)
RQ2: ความตรงประเด็น · ความครอบคลุมช่องว่าง · ความถูกต้องข้อมูลรายการ · ความเป็นไปได้ด้านเวลา · สถิติรายข้อของแบบประเมิน
"""
from collections import Counter, defaultdict
import math

REF = ["evidenced", "partially", "missing"]
SYS = REF + ["abstained"]


def confusion(pairs):
    """pairs: [(reference_status, system_status)] -> dict[ref][sys] = n  (3 แถว × 4 คอลัมน์)"""
    m = {r: {s: 0 for s in SYS} for r in REF}
    for r, s in pairs:
        if r not in REF or s not in SYS: raise ValueError(f"สถานะไม่ถูกต้อง: {r}, {s}")
        m[r][s] += 1
    return m


def per_status(m, supplementary=False):
    """P/R/F1 รายสถานะ
    หลัก: ตัดข้อ abstained ออกจากทั้งตัวเศษและตัวหาร
    ประกอบ: precision เท่าเดิม แต่ recall หารด้วยจำนวนในเฉลยทั้งแถว (abstained นับเป็นการระบุผิด)
    นโยบายตัวหารศูนย์ (3.9.3): เฉลยไม่มีสถานะนั้น -> N/A ไม่นำเข้าเฉลี่ย · ระบบไม่เคยให้สถานะที่เฉลยมี -> F1 = 0
    """
    out = {}
    for k in REF:
        tp = m[k][k]
        pred = sum(m[r][k] for r in REF)
        ref_decided = sum(m[k][s] for s in REF)
        ref_all = ref_decided + m[k]["abstained"]
        denom_r = ref_all if supplementary else ref_decided
        if (ref_all if supplementary else ref_decided) == 0:
            out[k] = dict(precision=None, recall=None, f1=None, tp=tp, pred=pred, ref=denom_r, note="N/A: เฉลยไม่มีสถานะนี้")
            continue
        p = tp / pred if pred else None
        r = tp / denom_r
        if pred == 0: f1 = 0.0
        else: f1 = 0.0 if (p + r) == 0 else 2 * p * r / (p + r)
        out[k] = dict(precision=p, recall=r, f1=f1, tp=tp, pred=pred, ref=denom_r)
    return out


def macro_f1(m, supplementary=False):
    ps = per_status(m, supplementary)
    vals = [v["f1"] for v in ps.values() if v["f1"] is not None]
    return dict(macro_f1=(sum(vals) / len(vals)) if vals else None, n_statuses=len(vals), per_status=ps)


def abstain_rate(m):
    ab = sum(m[r]["abstained"] for r in REF); tot = sum(sum(m[r].values()) for r in REF)
    return dict(value=(ab / tot) if tot else None, numerator=ab, denominator=tot)


def rq1(rows):
    """rows: [{run_id, reference_status, final_status}] -> ผลรวม + รายผู้เข้าร่วม (ค่าหลัก = เฉลี่ยรายผู้เข้าร่วม)"""
    by = defaultdict(list)
    for r in rows: by[r["run_id"]].append((r["reference_status"], r["final_status"]))
    per = {}
    for rid, pairs in by.items():
        m = confusion(pairs)
        per[rid] = dict(macro_f1=macro_f1(m)["macro_f1"], macro_f1_supp=macro_f1(m, True)["macro_f1"], abstain=abstain_rate(m)["value"])
    pooled = confusion([(r["reference_status"], r["final_status"]) for r in rows])
    vals = [v["macro_f1"] for v in per.values() if v["macro_f1"] is not None]
    return dict(
        primary_mean_macro_f1=(sum(vals) / len(vals)) if vals else None, n_participants_in_mean=len(vals),
        n_participants=len(per), pooled=macro_f1(pooled), pooled_supplementary=macro_f1(pooled, True),
        abstain_pooled=abstain_rate(pooled), confusion=pooled, per_participant=per,
    )


def cohen_kappa(a, b, labels=REF):
    """a, b: รหัสก่อนหาข้อยุติของผู้ให้รหัสสองคน (ความยาวเท่ากัน)"""
    if len(a) != len(b) or not a: raise ValueError("ต้องมีรหัสคู่กันอย่างน้อยหนึ่งคู่")
    n = len(a)
    po = sum(1 for x, y in zip(a, b) if x == y) / n
    ca, cb = Counter(a), Counter(b)
    pe = sum((ca[l] / n) * (cb[l] / n) for l in labels)
    kappa = None if pe == 1 else (po - pe) / (1 - pe)
    return dict(kappa=kappa, observed_agreement=po, expected_agreement=pe, n=n, agree=int(round(po * n)))


def ratio(num, den):
    return dict(value=(num / den) if den else None, numerator=num, denominator=den)


def rq2(plans, reviews, reference_gaps, corpus, hmax):
    """plans: {run_id: [plan_item rows]} · reviews: [pathway_review rows] · reference_gaps: {run_id: set(req_id)}
    corpus: {item_id: row} · hmax: {run_id: Hmax} — คืนค่ารวมทุกแผนพร้อมตัวเศษ/ตัวหาร และกรณีพิเศษ"""
    rel_n = rel_d = acc_n = acc_d = cov_n = cov_d = time_n = time_d = 0
    special = Counter()
    rev_by = defaultdict(list)
    for r in reviews: rev_by[(r["run_id"], r["item_id"])].append(r)
    for rid, items in plans.items():
        gaps = reference_gaps.get(rid, set())
        uniq = {i["item_id"]: i for i in items}
        if not uniq:
            special["empty_plan_no_gap" if not gaps else "empty_plan_no_candidate"] += 1
            continue
        for iid, it in uniq.items():
            rv = rev_by.get((rid, iid), [])
            if rv:
                rel_d += 1; rel_n += int(any(str(x["relevant_to_reference_gap"]).lower() == "true" for x in rv))
            c = corpus.get(iid)
            acc_d += 1
            acc_n += int(bool(c) and all(str(c.get(k, "")) == str(it.get(k, "")) for k in ("title", "provider", "source_url")) and c.get("verification_status") == "verified")
        covered = set()
        for iid, it in uniq.items():
            rejected = {x["requirement_id"] for x in rev_by.get((rid, iid), []) if str(x["relevant_to_reference_gap"]).lower() == "false"}
            covered |= (set(filter(None, str(it.get("covers_requirements", "")).split("|"))) - rejected)
        if gaps:
            cov_d += len(gaps); cov_n += len(gaps & covered)
        total = sum(float(i["estimated_hours"]) for i in uniq.values())
        time_d += 1; time_n += int(total <= float(hmax[rid]) + 1e-9)
    return dict(relevance=ratio(rel_n, rel_d), gap_coverage=ratio(cov_n, cov_d), item_accuracy=ratio(acc_n, acc_d),
                time_feasibility=ratio(time_n, time_d), special_cases=dict(special))


def likert_items(responses, keys):
    """responses: [{key: '1'..'5' | 'ประเมินไม่ได้' | ''}] -> รายข้อ: mean, sd, n, ไม่สามารถประเมินได้ (นับแยก)"""
    out = {}
    for k in keys:
        vals = [int(r[k]) for r in responses if str(r.get(k, "")).strip() in {"1", "2", "3", "4", "5"}]
        cant = sum(1 for r in responses if str(r.get(k, "")).strip() == "ประเมินไม่ได้")
        n = len(vals)
        mean = sum(vals) / n if n else None
        sd = math.sqrt(sum((v - mean) ** 2 for v in vals) / (n - 1)) if n > 1 else None
        out[k] = dict(mean=mean, sd=sd, n=n, cannot_assess=cant, distribution={i: vals.count(i) for i in range(1, 6)})
    return out
