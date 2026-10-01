# -*- coding: utf-8 -*-
"""
build_reference_data.py  (IS 68076026 · Final_IS · 01OCT26)

สร้างข้อมูลอ้างอิงชุดที่ 1 จาก Data_Set.xlsx (O*NET 31.0 snapshot) ตามหัวข้อ 3.3.1 ของเล่ม
  data/requirements.csv   600 แถว (20 อาชีพ x 30 ข้อ)
  data/roles.json         20 อาชีพ + เหตุผล proxy (ภาคผนวก ก)
  data/aliases.csv        คำพ้องรายองค์ประกอบ (ใช้เฉพาะกฎ R3 ฝั่งโปรแกรม)

นโยบาย (ตรึงแล้ว ห้ามเปลี่ยนเงียบ ๆ):
  IM >= 3.0 · 4 โดเมน (ไม่ใช้ Abilities, DEC-07) · โควตาโดเมนละ >= 3 (DEC-03)
  เรียง IM มากไปน้อย ตัดสินเท่ากันด้วย element_id · เลือก 30 ข้อแรก
  w_i = IM_i / sum(IM ของ 30 ข้อ)  (สมการ 3.1)

ตรวจในตัว: ผลต้องเท่ากับ source/.../onet_requirements_28AUG26.csv ทุกค่า (ถ้ามีไฟล์)
          600 แถว · 343/104/77/76 · weight_share_of_pool 0.5128-0.9749

ใช้:  python scripts/build_reference_data.py --src <Data_Set.xlsx> [--check-against <onet_requirements_28AUG26.csv>]
"""
import argparse, json, os, sys
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "lib"))
from aliases import ALIASES  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA = os.path.join(ROOT, "data")

TOP_N, DOMAIN_QUOTA, IM_MIN = 30, 3, 3.0
DOMAINS = ["Essential Skills", "Transferable Skills", "Knowledge", "Work Activities"]
SNAPSHOT_VERSION = "ONET31.0-IS68076026-v1.0"
SOURCE_VERSION = "O*NET 31.0 Database (August 2026 Release)"

# ชื่อไทยและสายงานตามตารางที่ 3.2 ของเล่ม (สเปก)
ROLE_TH = {
    "R01": "วิศวกรซอฟต์แวร์หรือนักพัฒนาซอฟต์แวร์", "R02": "นักพัฒนาเว็บ",
    "R03": "นักพัฒนาแอปพลิเคชันและโมบายล์", "R04": "วิศวกรทดสอบและ QA Automation",
    "R05": "นักออกแบบ UX/UI", "R06": "นักวิทยาศาสตร์ข้อมูล",
    "R07": "วิศวกรแมชชีนเลิร์นนิงและปัญญาประดิษฐ์", "R08": "วิศวกรข้อมูล",
    "R09": "นักวิเคราะห์ข้อมูลเชิงธุรกิจ", "R10": "ผู้ดูแลฐานข้อมูล",
    "R11": "นักวิเคราะห์ความมั่นคงปลอดภัยสารสนเทศ", "R12": "วิศวกรความมั่นคงปลอดภัย",
    "R13": "ผู้ทดสอบเจาะระบบ", "R14": "นักนิติวิทยาศาสตร์ดิจิทัลและการรับมือเหตุการณ์",
    "R15": "วิศวกรและสถาปนิกเครือข่าย", "R16": "วิศวกรและสถาปนิกระบบคลาวด์",
    "R17": "วิศวกร DevOps และ SRE", "R18": "นักวิเคราะห์ระบบและนักวิเคราะห์ธุรกิจสายไอที",
    "R19": "ผู้จัดการโครงการไอที", "R20": "ผู้จัดการฝ่ายสารสนเทศ",
}
TRACK = {"R01": "software", "R02": "software", "R03": "software", "R04": "software", "R05": "software",
         "R06": "data", "R07": "data", "R08": "data", "R09": "analytics", "R10": "data",
         "R11": "security", "R12": "security", "R13": "security", "R14": "security",
         "R15": "network", "R16": "cloud", "R17": "cloud", "R18": "analytics",
         "R19": "management", "R20": "management"}

REQ_COLS = ["requirement_id", "role_id", "target_role", "soc_code", "domain", "element_id",
            "element_name", "element_description", "importance_im", "level_lv", "rank_in_role",
            "weight_renormalized", "weight_share_of_pool", "selected_reason", "element_aliases",
            "snapshot_version", "source_version"]


def build(src):
    cm = pd.read_excel(src, sheet_name="02_Competency_Master")
    rw = pd.read_excel(src, sheet_name="03_Readiness_Weights")
    rm = pd.read_excel(src, sheet_name="01_Role_Master")

    pool = cm[(cm.include_in_requirements == "Y")].copy()
    assert (pool.importance_im >= IM_MIN).all(), "IM < 3.0 อยู่ใน pool"
    assert not (pool.recommend_suppress == "Y").any()
    pool = pool.merge(rw[["role_id", "element_id", "rank_in_role"]], on=["role_id", "element_id"], how="left")
    pool = pool.merge(rm[["role_id", "role_name_en"]], on="role_id", how="left")

    kept, pools = [], {}
    for rid, g in pool.groupby("role_id"):
        g = g[g.domain.isin(DOMAINS)].sort_values(["importance_im", "element_id"], ascending=[False, True])
        pools[rid] = (len(pool[pool.role_id == rid]), len(g))
        quota = [e for _, gd in g.groupby("domain") for e in gd.head(DOMAIN_QUOTA).element_id]
        fill = g[~g.element_id.isin(quota)].head(TOP_N - len(quota)).element_id
        sel = g[g.element_id.isin(quota) | g.element_id.isin(fill)].copy()
        assert len(sel) == TOP_N, rid
        sel["selected_reason"] = np.where(sel.element_id.isin(quota), "domain_quota", "top_rank")
        sel["weight_renormalized"] = (sel.importance_im / sel.importance_im.sum()).round(6)
        sel["weight_share_of_pool"] = round(sel.importance_im.sum() / g.importance_im.sum(), 4)
        kept.append(sel)

    df = pd.concat(kept, ignore_index=True).sort_values(
        ["role_id", "importance_im", "element_id"], ascending=[True, False, True])
    df["requirement_id"] = "REQ-" + df.role_id + "-" + df.element_id
    df["element_aliases"] = df.element_id.map(lambda e: "|".join(ALIASES[e]))
    df["snapshot_version"] = SNAPSHOT_VERSION
    df["source_version"] = SOURCE_VERSION
    df = df.rename(columns={"role_name_en": "target_role", "onet_soc_code": "soc_code"})[REQ_COLS]
    return df.reset_index(drop=True), rm, pools


def roles_json(df, rm, pools):
    roles = []
    for _, r in rm.sort_values("role_id").iterrows():
        rid = r.role_id
        g = df[df.role_id == rid]
        roles.append({
            "role_id": rid,
            "role_name_th": ROLE_TH[rid],
            "target_role": r.role_name_en,
            "soc_code": r.onet_soc_code,
            "onet_title": r.onet_title,
            "track": TRACK[rid],
            "mapping_type": r.mapping_type,
            "mapping_rationale_th": (None if r.mapping_type == "exact" else str(r.mapping_rationale_th)),
            "job_zone": int(r.job_zone),
            "candidate_pool_im_ge_3": pools[rid][0],
            "candidate_pool_4_domains": pools[rid][1],
            "n_requirements_selected": int(len(g)),
            "weight_share_of_pool": float(g.weight_share_of_pool.iloc[0]),
            "requirement_id_prefix": f"REQ-{rid}-",
        })
    return {
        "schema_version": "3.0",
        "snapshot_version": SNAPSHOT_VERSION,
        "source_version": SOURCE_VERSION,
        "license": "O*NET 31.0 Database · CC BY 4.0 · O*NET is a trademark of USDOL/ETA",
        "policy": {"top_n": TOP_N, "domain_quota_per_domain": DOMAIN_QUOTA, "im_threshold": IM_MIN,
                   "domains": DOMAINS, "excluded_domains": ["Abilities"],
                   "tie_break": "importance_im DESC, element_id ASC", "weight": "eq 3.1 IM_i / sum(IM_1..30)"},
        "roles": roles,
    }


def aliases_csv(df):
    al = df[["domain", "element_id", "element_name"]].drop_duplicates().sort_values(["domain", "element_id"])
    al["n_aliases"] = al.element_id.map(lambda e: len(ALIASES[e]))
    al["element_aliases"] = al.element_id.map(lambda e: "|".join(ALIASES[e]))
    return al


def verify(df, roles, check_against=None):
    errs = []
    if len(df) != 600: errs.append(f"rows {len(df)} != 600")
    dc = df.domain.value_counts().to_dict()
    want = {"Work Activities": 343, "Essential Skills": 104, "Transferable Skills": 77, "Knowledge": 76}
    if dc != want: errs.append(f"domain {dc} != {want}")
    ws = df.groupby("role_id").weight_share_of_pool.first()
    if (round(ws.min(), 4), round(ws.max(), 4)) != (0.5128, 0.9749): errs.append(f"wsp {ws.min()}..{ws.max()}")
    for rid, g in df.groupby("role_id"):
        if abs(g.weight_renormalized.sum() - 1) > 1e-5: errs.append(f"{rid} weight sum")
        for d in DOMAINS:
            if (g.domain == d).sum() < DOMAIN_QUOTA: errs.append(f"{rid} quota {d}")
    proxy = [r["role_id"] for r in roles["roles"] if r["mapping_type"] == "proxy"]
    if proxy != ["R03", "R07", "R08", "R16", "R17"]: errs.append(f"proxy {proxy}")
    if check_against and os.path.exists(check_against):
        old = pd.read_csv(check_against, encoding="utf-8-sig", dtype=str).fillna("")
        new = df.astype(str).fillna("")
        a = old.sort_values("requirement_id").reset_index(drop=True)
        b = new.sort_values("requirement_id").reset_index(drop=True)
        for c in ["requirement_id", "role_id", "domain", "element_id", "selected_reason", "element_aliases"]:
            if not (a[c] == b[c]).all(): errs.append(f"diff vs frozen file in {c}")
        for c in ["importance_im", "weight_renormalized", "weight_share_of_pool"]:
            if not np.allclose(a[c].astype(float), b[c].astype(float), atol=1e-6): errs.append(f"diff {c}")
    return errs


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--check-against", default=None)
    a = ap.parse_args()
    df, rm, pools = build(a.src)
    roles = roles_json(df, rm, pools)
    errs = verify(df, roles, a.check_against)
    if errs:
        print("FAIL", *errs, sep="\n  "); sys.exit(1)
    os.makedirs(DATA, exist_ok=True)
    df.to_csv(os.path.join(DATA, "requirements.csv"), index=False, encoding="utf-8", lineterminator="\n")
    aliases_csv(df).to_csv(os.path.join(DATA, "aliases.csv"), index=False, encoding="utf-8", lineterminator="\n")
    with open(os.path.join(DATA, "roles.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(roles, f, ensure_ascii=False, indent=2); f.write("\n")
    print("OK requirements 600 · 343/104/77/76 · wsp 0.5128–0.9749 · proxy R03 R07 R08 R16 R17"
          + (" · ตรงกับไฟล์ตรึง 28AUG26 ทุกค่า" if a.check_against else ""))
