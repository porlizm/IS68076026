# -*- coding: utf-8 -*-
"""
coding_sheets.py — ไฟล์งานให้รหัสแบบไม่เห็นผลระบบ (หัวข้อ 3.8.2, UC-08) และการรวมรหัส

  python analysis/coding_sheets.py make  --exports <โฟลเดอร์ CSV ที่ export จากสเปรดชีต> --out private/coding
  python analysis/coding_sheets.py merge --coding private/coding [--resolutions private/coding/resolutions.csv]

make: coder1_all.csv (ทุกคนในกลุ่มหลัก) · coder2_sample.csv (สุ่มแบบเป็นระบบ ≥ 20% = 6 คน + ทุกคนที่แจ้งไม่เห็นด้วย)
      ไฟล์มีเฉพาะ run_id, file_id, ข้อกำหนด 30 ข้อ และช่องกรอก — ไม่มีคอลัมน์ผลของระบบ (ตรวจด้วย assert)
merge: รวมรหัส → ground_truth_import.csv (คอลัมน์ตรงแท็บ ground_truth) + disagreements.csv + agreement.json (κ ก่อนหาข้อยุติ)
"""
import argparse, csv, json, math, os, random, sys
sys.path.insert(0, os.path.dirname(__file__))
from metrics import cohen_kappa, REF  # noqa: E402

SEED = 68076026
FORBIDDEN = {"final_status", "claimed_status", "evidence_quote_system", "readiness_pct", "agreement_level", "rule_flags", "overlap_score"}
GT_COLS = ["run_id", "requirement_id", "reference_status", "evidence_quote", "coder_1", "coder_1_status", "coder_2", "coder_2_status",
           "agreement", "resolution_note", "participant_disagreed", "coded_at"]


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
    cols = ["run_id", "file_id", "requirement_id", "element_name", "element_description", "status", "evidence_quote", "ocr_issue", "coder_note"]
    assert not (set(cols) & FORBIDDEN), "ไฟล์งานต้องไม่มีผลของระบบ"

    def rows_for(rs):
        return [dict(run_id=r["run_id"], file_id=r["file_id"], requirement_id=q["requirement_id"], element_name=q["element_name"],
                     element_description=q["element_description"]) for r in rs for q in by_role[r["role_id"]]]
    wr(os.path.join(out, "coder1_all.csv"), rows_for(runs), cols)
    k = max(1, math.ceil(0.2 * len(runs)))
    sample = systematic_sample([r["run_id"] for r in runs], k)
    sample += [x for x in disagreed if x not in sample]
    wr(os.path.join(out, "coder2_sample.csv"), rows_for([r for r in runs if r["run_id"] in sample]), cols)
    json.dump(dict(n_runs=len(runs), sample_k=k, sample=sample, seed=SEED), open(os.path.join(out, "sample.json"), "w"), indent=1)
    return sample


def merge(coding, resolutions=None, coder1="coder_1", coder2="coder_2"):
    c1 = {(r["run_id"], r["requirement_id"]): r for r in rd(os.path.join(coding, "coder1_all.csv"))}
    c2p = os.path.join(coding, "coder2_sample.csv")
    c2 = {(r["run_id"], r["requirement_id"]): r for r in rd(c2p)} if os.path.exists(c2p) else {}
    res = {(r["run_id"], r["requirement_id"]): r for r in rd(resolutions)} if resolutions and os.path.exists(resolutions) else {}
    gt, dis, a, b = [], [], [], []
    for key, r1 in sorted(c1.items()):
        s1 = r1["status"].strip()
        if s1 not in REF: raise SystemExit(f"รหัสไม่ครบ/ไม่ถูกต้อง: {key} = {s1!r}")
        row = dict(run_id=key[0], requirement_id=key[1], evidence_quote=r1["evidence_quote"], coder_1=coder1, coder_1_status=s1, participant_disagreed="false")
        if key in c2 and c2[key]["status"].strip():
            s2 = c2[key]["status"].strip(); a.append(s1); b.append(s2)
            row.update(coder_2=coder2, coder_2_status=s2, agreement=str(s1 == s2).lower())
            if s1 != s2:
                if key in res and res[key].get("reference_status") in REF:
                    row.update(reference_status=res[key]["reference_status"], resolution_note=res[key].get("resolution_note", ""))
                else:
                    dis.append(dict(run_id=key[0], requirement_id=key[1], coder_1_status=s1, coder_2_status=s2)); continue
            else: row["reference_status"] = s1
        else:
            row["reference_status"] = s1
        gt.append(row)
    wr(os.path.join(coding, "ground_truth_import.csv"), gt, GT_COLS)
    wr(os.path.join(coding, "disagreements.csv"), dis, ["run_id", "requirement_id", "coder_1_status", "coder_2_status"])
    k = cohen_kappa(a, b) if a else None
    json.dump(dict(kappa=k, threshold=0.61, pass_threshold=(k is not None and k["kappa"] is not None and k["kappa"] >= 0.61),
                   unresolved=len(dis)), open(os.path.join(coding, "agreement.json"), "w"), indent=1, ensure_ascii=False)
    return gt, dis, k


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest="cmd", required=True)
    m = sub.add_parser("make"); m.add_argument("--exports", required=True); m.add_argument("--out", default="private/coding"); m.add_argument("--disagreed", nargs="*", default=[])
    g = sub.add_parser("merge"); g.add_argument("--coding", default="private/coding"); g.add_argument("--resolutions")
    x = ap.parse_args()
    if x.cmd == "make": print("sample", make(x.exports, x.out, x.disagreed))
    else:
        gt, dis, k = merge(x.coding, x.resolutions); print(f"ground_truth {len(gt)} · ยังไม่ยุติ {len(dis)} · kappa {k}")
