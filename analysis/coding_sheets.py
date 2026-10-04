# -*- coding: utf-8 -*-
"""
coding_sheets.py — ไฟล์งานให้รหัสแบบไม่เห็นผลระบบ และการรวมรหัส (ผู้วิจัยให้รหัสคนเดียว · ความน่าเชื่อถือวัดจากการให้รหัสซ้ำของตัวเอง)

  python analysis/coding_sheets.py make  --exports <โฟลเดอร์ CSV ที่ export จากสเปรดชีต> --out private/coding
  python analysis/coding_sheets.py merge --coding private/coding [--resolutions private/coding/resolutions.csv] [--min-days 14]

make:  coder_all.csv     ผู้เข้าร่วมกลุ่มหลักทุกคน (รอบที่ 1)
       recode_sample.csv สุ่มแบบเป็นระบบ ≥ 20% (อย่างน้อย 6 คน) + ทุกคนที่แจ้งไม่เห็นด้วย · ไม่มีรหัสรอบที่ 1 และสลับลำดับแถว (รอบที่ 2)
       ไฟล์ทั้งสองมีเฉพาะ run_id, file_id, ข้อกำหนดและช่องกรอก ไม่มีคอลัมน์ผลของระบบ (ตรวจด้วย assert)
merge: รวมรหัสสองรอบ → ground_truth_import.csv (คอลัมน์ตรงแท็บ ground_truth) + disagreements.csv + agreement.json (κ ก่อนหาข้อยุติ)
       ต้องกรอก coded_on ทั้งสองรอบ และรอบที่ 2 ต้องห่างจากรอบที่ 1 อย่างน้อย --min-days วัน (ค่าเริ่มต้น 14)
"""
import argparse, csv, datetime, json, math, os, random, sys
sys.path.insert(0, os.path.dirname(__file__))
from metrics import cohen_kappa, REF  # noqa: E402

SEED = 68076026
MIN_DAYS = 14
FORBIDDEN = {"final_status", "claimed_status", "evidence_quote_system", "readiness_pct", "agreement_level", "rule_flags", "overlap_score"}
GT_COLS = ["run_id", "requirement_id", "reference_status", "evidence_quote", "coder_status", "recode_status", "recode_at",
           "recode_agreement", "resolution_note", "participant_disagreed", "coded_at"]
SHEET_COLS = ["run_id", "file_id", "requirement_id", "element_name", "element_description", "status", "evidence_quote", "ocr_issue", "coder_note", "coded_on"]


def rd(p):
    with open(p, encoding="utf-8-sig", newline="") as f: return list(csv.DictReader(f))


def wr(p, rows, cols):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, lineterminator="\n"); w.writeheader(); [w.writerow({k: r.get(k, "") for k in cols}) for r in rows]


def systematic_sample(run_ids, k, seed=SEED):
    n = len(run_ids)
    if n <= k: return list(run_ids)
    step = n / k
    start = random.Random(seed).random() * step
    return [run_ids[int(start + i * step)] for i in range(k)]


def make(exports, out, disagreed=()):
    runs = [r for r in rd(os.path.join(exports, "runs.csv")) if r.get("stage") == "delivered"]
    runs.sort(key=lambda r: r["created_at"])
    reqs = rd(os.path.join(exports, "ref_requirements.csv"))
    by_role = {}
    for q in reqs: by_role.setdefault(q["role_id"], []).append(q)
    assert not (set(SHEET_COLS) & FORBIDDEN), "ไฟล์งานต้องไม่มีผลของระบบ"

    def rows_for(rs):
        return [dict(run_id=r["run_id"], file_id=r["file_id"], requirement_id=q["requirement_id"], element_name=q["element_name"],
                     element_description=q["element_description"]) for r in rs for q in by_role[r["role_id"]]]
    wr(os.path.join(out, "coder_all.csv"), rows_for(runs), SHEET_COLS)
    k = max(1, math.ceil(0.2 * len(runs)))
    sample = systematic_sample([r["run_id"] for r in runs], k)
    sample += [x for x in disagreed if x not in sample]
    rows = rows_for([r for r in runs if r["run_id"] in sample])
    random.Random(SEED + 1).shuffle(rows)  # สลับลำดับ ไม่ให้นึกย้อนถึงรอบที่ 1 จากลำดับข้อ
    wr(os.path.join(out, "recode_sample.csv"), rows, SHEET_COLS)
    json.dump(dict(n_runs=len(runs), sample_k=k, sample=sample, seed=SEED, min_days=MIN_DAYS), open(os.path.join(out, "sample.json"), "w"), indent=1)
    return sample


def _day(s):
    try: return datetime.date.fromisoformat(str(s).strip()[:10])
    except ValueError: return None


def merge(coding, resolutions=None, min_days=MIN_DAYS):
    c1 = {(r["run_id"], r["requirement_id"]): r for r in rd(os.path.join(coding, "coder_all.csv"))}
    c2p = os.path.join(coding, "recode_sample.csv")
    c2 = {(r["run_id"], r["requirement_id"]): r for r in rd(c2p)} if os.path.exists(c2p) else {}
    res = {(r["run_id"], r["requirement_id"]): r for r in rd(resolutions)} if resolutions and os.path.exists(resolutions) else {}
    gt, dis, a, b = [], [], [], []
    for key, r1 in sorted(c1.items()):
        s1 = r1["status"].strip()
        if s1 not in REF: raise SystemExit(f"รหัสไม่ครบ/ไม่ถูกต้อง: {key} = {s1!r}")
        row = dict(run_id=key[0], requirement_id=key[1], evidence_quote=r1["evidence_quote"], coder_status=s1,
                   coded_at=str(r1.get("coded_on", "")).strip(), participant_disagreed="false")
        if key in c2 and c2[key]["status"].strip():
            d1, d2 = _day(r1.get("coded_on")), _day(c2[key].get("coded_on"))
            if d1 is None or d2 is None: raise SystemExit(f"ต้องกรอก coded_on (YYYY-MM-DD) ทั้งสองรอบ: {key}")
            if (d2 - d1).days < min_days: raise SystemExit(f"รอบที่ 2 ห่างจากรอบที่ 1 เพียง {(d2 - d1).days} วัน (ขั้นต่ำ {min_days}): {key}")
            s2 = c2[key]["status"].strip(); a.append(s1); b.append(s2)
            row.update(recode_status=s2, recode_at=d2.isoformat(), recode_agreement=str(s1 == s2).lower())
            if s1 != s2:
                if key in res and res[key].get("reference_status") in REF:
                    row.update(reference_status=res[key]["reference_status"], resolution_note=res[key].get("resolution_note", ""))
                else:
                    dis.append(dict(run_id=key[0], requirement_id=key[1], coder_status=s1, recode_status=s2)); continue
            else: row["reference_status"] = s1
        else:
            row["reference_status"] = s1
        gt.append(row)
    wr(os.path.join(coding, "ground_truth_import.csv"), gt, GT_COLS)
    wr(os.path.join(coding, "disagreements.csv"), dis, ["run_id", "requirement_id", "coder_status", "recode_status"])
    k = cohen_kappa(a, b) if a else None
    json.dump(dict(kappa=k, kind="intra_rater", threshold=0.61, pass_threshold=(k is not None and k["kappa"] is not None and k["kappa"] >= 0.61),
                   unresolved=len(dis)), open(os.path.join(coding, "agreement.json"), "w"), indent=1, ensure_ascii=False)
    return gt, dis, k


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest="cmd", required=True)
    m = sub.add_parser("make"); m.add_argument("--exports", required=True); m.add_argument("--out", default="private/coding"); m.add_argument("--disagreed", nargs="*", default=[])
    g = sub.add_parser("merge"); g.add_argument("--coding", default="private/coding"); g.add_argument("--resolutions"); g.add_argument("--min-days", type=int, default=MIN_DAYS)
    x = ap.parse_args()
    if x.cmd == "make": print("sample", make(x.exports, x.out, x.disagreed))
    else:
        gt, dis, k = merge(x.coding, x.resolutions, x.min_days); print(f"ground_truth {len(gt)} · ยังไม่ยุติ {len(dis)} · kappa {k}")
