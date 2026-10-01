# -*- coding: utf-8 -*-
"""
build_onet_requirements_28AUG26.py
Regenerates the frozen role-requirement set from Data_Set.xlsx.

Policy (frozen 28 AUG 2026):
  DEC-03  Stratified Top-30 per role.
  DEC-07  Domain quota runs over FOUR competency domains
          (Essential Skills, Transferable Skills, Knowledge, Work Activities).
          O*NET "Abilities" (1.A.*) are excluded from the requirement set by policy;
          see onet_requirements_excluded_28AUG26.csv for the full audit trail.
  Selection:  top 3 per domain by IM  (4 x 3 = 12 rows, selected_reason=domain_quota)
              then fill by IM descending to 30 (selected_reason=top_rank)
  Tie-break:  IM desc, then element_id ascending  (deterministic)
  Weights:    weight_renormalized = IM / sum(IM of the selected 30)

Verification: with EXCLUDE_DOMAINS=() this script reproduces the 28 AUG 2026
pre-DEC-07 file (onet_requirements.csv) exactly, 600/600 rows.
"""
import hashlib, json, datetime, os
import pandas as pd, numpy as np
from aliases import ALIASES

SRC = os.environ.get("IS_SRC", "Data_Set.xlsx")
OUT = os.environ.get("IS_OUT", "out/")
TOP_N            = 30
DOMAIN_QUOTA     = 3
EXCLUDE_DOMAINS  = ("Abilities",)          # DEC-07 - set to () to revert to the 5-domain baseline
SNAPSHOT_VERSION = "ONET31.0-IS68076026-v1.0"
SOURCE_VERSION   = "O*NET 31.0 Database (August 2026 Release)"
FROZEN_AT        = "2026-08-28T00:00:00+07:00"

cm   = pd.read_excel(SRC, sheet_name="02_Competency_Master")
rw   = pd.read_excel(SRC, sheet_name="03_Readiness_Weights")
rm   = pd.read_excel(SRC, sheet_name="01_Role_Master")

pool = cm[cm.include_in_requirements == "Y"].copy()          # IM >= 3.0 candidate pool
assert not (pool.recommend_suppress == "Y").any(), "recommend_suppress=Y row reached the pool"
pool = pool.merge(rw[["role_id", "element_id", "rank_in_role"]], on=["role_id", "element_id"], how="left")
pool = pool.merge(rm[["role_id", "role_name_en"]], on="role_id", how="left")

kept, dropped = [], []
for rid, g in pool.groupby("role_id"):
    dropped.append(g[g.domain.isin(EXCLUDE_DOMAINS)])
    g = g[~g.domain.isin(EXCLUDE_DOMAINS)].sort_values(["importance_im", "element_id"],
                                                       ascending=[False, True])
    quota = [e for _, gd in g.groupby("domain") for e in gd.head(DOMAIN_QUOTA).element_id]
    fill  = g[~g.element_id.isin(quota)].head(TOP_N - len(quota)).element_id
    sel   = g[g.element_id.isin(quota) | g.element_id.isin(fill)].copy()
    assert len(sel) == TOP_N, f"{rid}: got {len(sel)}"
    sel["selected_reason"]      = np.where(sel.element_id.isin(quota), "domain_quota", "top_rank")
    sel["weight_renormalized"]  = (sel.importance_im / sel.importance_im.sum()).round(6)
    sel["weight_share_of_pool"] = round(sel.importance_im.sum() / g.importance_im.sum(), 4)
    kept.append(sel)

df = pd.concat(kept, ignore_index=True).sort_values(["role_id", "importance_im", "element_id"],
                                                    ascending=[True, False, True])
df["requirement_id"]  = "REQ-" + df.role_id + "-" + df.element_id
df["element_aliases"] = df.element_id.map(lambda e: "|".join(ALIASES[e]))
df["snapshot_version"] = SNAPSHOT_VERSION
df["source_version"]   = SOURCE_VERSION
df = df.rename(columns={"role_name_en": "target_role", "onet_soc_code": "soc_code"})

COLS = ["requirement_id", "role_id", "target_role", "soc_code", "domain",
        "element_id", "element_name", "element_description",
        "importance_im", "level_lv", "rank_in_role", "weight_renormalized",
        "weight_share_of_pool", "selected_reason", "element_aliases",
        "snapshot_version", "source_version"]
df = df[COLS]

assert df.requirement_id.is_unique and len(df) == 20 * TOP_N
for rid, g in df.groupby("role_id"):
    assert abs(g.weight_renormalized.sum() - 1) < 1e-5, rid

df.to_csv(OUT + "onet_requirements_28AUG26.csv", index=False, encoding="utf-8-sig")

# ---- audit: what the policy removed ----
ex = pd.concat(dropped, ignore_index=True)[
    ["role_id", "domain", "element_id", "element_name", "importance_im", "level_lv"]]
ex["excluded_by"]     = "DEC-07"
ex["exclusion_reason"] = ("O*NET Abilities (1.A.*) are enduring natural talents, not acquired "
                          "competencies; not evidenceable from a resume and not addressable by "
                          "any item in the frozen recommendation corpus.")
ex.sort_values(["role_id", "element_id"]).to_csv(
    OUT + "onet_requirements_excluded_28AUG26.csv", index=False, encoding="utf-8-sig")

# ---- alias lexicon as its own frozen artefact ----
al = (df[["domain", "element_id", "element_name"]].drop_duplicates()
        .sort_values(["domain", "element_id"]))
al["n_aliases"]     = al.element_id.map(lambda e: len(ALIASES[e]))
al["element_aliases"] = al.element_id.map(lambda e: "|".join(ALIASES[e]))
al["alias_source"]  = "A1 element name+description | A2 F11 IWA (WA) | A3 F13/F15 crosswalk (skills) | A4 curated resume surface forms"
al.to_csv(OUT + "element_aliases_28AUG26.csv", index=False, encoding="utf-8-sig")

# ---- freeze manifest ----
def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()

cov = df.groupby("role_id").weight_share_of_pool.first()
manifest = {
  "snapshot_version": SNAPSHOT_VERSION, "source_version": SOURCE_VERSION,
  "source_license": "CC BY 4.0 - U.S. Department of Labor / ETA. O*NET is a trademark of USDOL/ETA.",
  "frozen_at": FROZEN_AT, "frozen_by": "Danusorn Anantakan, 68076026",
  "policy": {"selection": "Stratified Top-30 (DEC-03)", "top_n": TOP_N,
             "domain_quota_per_domain": DOMAIN_QUOTA,
             "domains_in_quota": ["Essential Skills", "Transferable Skills", "Knowledge", "Work Activities"],
             "excluded_domains": list(EXCLUDE_DOMAINS), "excluded_by": "DEC-07",
             "tie_break": "importance_im DESC, element_id ASC",
             "im_threshold": 3.0, "theta_evidence_overlap": 0.15},
  "coverage_of_candidate_pool_weight": {"mean": round(float(cov.mean()), 4),
                                        "min": round(float(cov.min()), 4),
                                        "max": round(float(cov.max()), 4)},
  "files": []}
for f, n in [(SRC, None),
             (OUT + "onet_requirements_28AUG26.csv", len(df)),
             (OUT + "onet_requirements_excluded_28AUG26.csv", len(ex)),
             (OUT + "element_aliases_28AUG26.csv", len(al))]:
    manifest["files"].append({"file": os.path.basename(f), "sha256": sha(f), "row_count": n})
manifest["generated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
with open(OUT + "dataset_version_log_regenerated.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(json.dumps(manifest["files"], ensure_ascii=False, indent=2))
print("coverage", manifest["coverage_of_candidate_pool_weight"])
print("rows", len(df), "| unique elements", df.element_id.nunique(),
      "| excluded rows", len(ex), "| domains", df.domain.value_counts().to_dict())
