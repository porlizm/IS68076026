#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check_corpus_31AUG26.py — ตัวตรวจสอบอิสระของ Course/Certification Corpus
IS 68076026 · ดนุสรณ์ อนันตกาล

หน้าที่: คำนวณใหม่ทั้งหมดจากไฟล์อ้างอิงที่ตรึงแล้ว แล้วเทียบกับตัวเลขที่ Course_Career.xlsx ประกาศไว้
         ไม่เชื่อค่าใด ๆ ในชีต qa_checks / role_index / uncovered_requirements

อินพุต  : onet_requirements_28AUG26.csv (600 แถว, แหล่งความจริง)
          corpus_master_31AUG26.csv  (แทนที่ได้ด้วย argv[1])
          Course_Career_31AUG26.xlsx (แทนที่ได้ด้วย argv[2])
เอาต์พุต: โฟลเดอร์ corpus_qa_31AUG26/  (รายงาน CSV 7 ไฟล์)  +  สรุปบนหน้าจอ
exit code: 0 = ไม่มีข้อผิดพลาดที่บล็อกการ freeze · 1 = มี
"""

# ---------- bootstrap: ทำงานได้จากทุกที่หลังจัดระเบียบโฟลเดอร์ 31 ส.ค. 2026 ----------
import os as _os, builtins as _b
PROJECT_ROOT = _os.path.dirname(_os.path.abspath(__file__))
while not _os.path.isdir(_os.path.join(PROJECT_ROOT, "02_dataset")) and _os.path.dirname(PROJECT_ROOT) != PROJECT_ROOT:
    PROJECT_ROOT = _os.path.dirname(PROJECT_ROOT)
_SKIP = {".git", ".work", "__pycache__", "db_31_0_excel", ".agents"}
_INDEX = {}
for _pass in (0, 1):                      # รอบแรกไม่รวม archive รอบสองรวม เพื่อให้ไฟล์ปัจจุบันชนะเสมอ
    for _dp, _dn, _fn in _os.walk(PROJECT_ROOT):
        _dn[:] = [d for d in _dn if d not in _SKIP and (_pass or d != "archive")]
        for _f in _fn: _INDEX.setdefault(_f, _os.path.join(_dp, _f))
OUT_DIR = _os.path.join(PROJECT_ROOT, "03_corpus")
_os.makedirs(OUT_DIR, exist_ok=True)
_os.chdir(OUT_DIR)
__open = _b.open
def _resolve(f, mode):
    if isinstance(f, str) and not _os.path.isabs(f) and "/" not in f and "\\" not in f and not _os.path.exists(f):
        return _INDEX.get(f, f)
    return f
_b.open = lambda file, mode="r", *a, **k: __open(_resolve(file, mode), mode, *a, **k)
# ---------- จบ bootstrap ----------

import csv, os, sys, re, json, hashlib, collections
import openpyxl

REQ_FILE   = "onet_requirements_28AUG26.csv"
CORPUS_CSV = sys.argv[1] if len(sys.argv) > 1 else "corpus_master_v13_01SEP26.csv"
CORPUS_XLSX= sys.argv[2] if len(sys.argv) > 2 else "Course_Career_v13_01SEP26.xlsx"
OUTDIR     = "corpus_qa_v13_01SEP26"

SEP = "|"
ENUM = {
    "item_type":           {"course", "certification"},
    "level":               {"Beginner", "Intermediate", "Advanced", "Professional"},
    "cost_category":       {"free", "low-cost", "paid", "exam-fee-required"},
    "phase":               {"foundation", "core_gap_closure", "advanced_or_cert_prep"},
    "verification_status": {"pending_verification", "verified", "rejected"},
    "mapping_type":        {"exact", "proxy"},
}
MODES = ["course_only", "certification_only", "both"]

results = []   # (check_id, ชื่อ, ผลลัพธ์, รายละเอียด)
def chk(cid, name, ok, detail="", blocking=True):
    res = "PASS" if ok else ("FAIL" if blocking else "REVIEW")
    results.append((cid, name, res, detail))
    return ok

def rd(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))

def wr(name, header, rows):
    os.makedirs(OUTDIR, exist_ok=True)
    p = os.path.join(OUTDIR, name)
    with open(p, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f); w.writerow(header); w.writerows(rows)
    return p

def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()

def num(s, default=None):
    try:    return float(str(s).strip())
    except: return default

# ---------------------------------------------------------------- โหลดข้อมูล
req_rows = rd(REQ_FILE)
corpus   = rd(CORPUS_CSV)

REQ = {r["requirement_id"]: r for r in req_rows}
ROLE_REQS = collections.defaultdict(set)
ROLE_META = {}
for r in req_rows:
    ROLE_REQS[r["role_id"]].add(r["requirement_id"])
    ROLE_META.setdefault(r["role_id"], (r["target_role"], r["soc_code"]))
W = {rid: num(r["weight_renormalized"], 0.0) for rid, r in REQ.items()}

wb = openpyxl.load_workbook(CORPUS_XLSX, read_only=True, data_only=True)
def sheet(name):
    ws = wb[name]; it = ws.iter_rows(values_only=True); hdr = list(next(it))
    return [dict(zip(hdr, row)) for row in it if any(v is not None for v in row)]
imap       = sheet("item_competency_map")
role_index = sheet("role_index")
unc_sheet  = sheet("uncovered_requirements")

print(f"ไฟล์ที่ตรวจ: {CORPUS_CSV} · {CORPUS_XLSX}")
print(f"โหลดแล้ว: requirement {len(req_rows)} แถว · corpus {len(corpus)} แถว · mapping {len(imap)} แถว\n")

# ================================================================ ส่วนที่ 1 — PREFIX CHECKER
RE_REQ = re.compile(r"^REQ-(R\d{2})-(.+)$")
bad_format, bad_prefix, not_in_set, dup_in_item, count_mismatch = [], [], [], [], []
item_reqs = {}

for r in corpus:
    iid, role = r["item_id"], r["role_id"]
    ids = [x.strip() for x in r["competency_ids"].split(SEP) if x.strip()]
    item_reqs[iid] = ids
    seen = set()
    for q in ids:
        m = RE_REQ.match(q)
        if not m:
            bad_format.append((iid, role, q, "รูปแบบไม่ใช่ REQ-<role_id>-<element_id>")); continue
        if m.group(1) != role:
            bad_prefix.append((iid, role, q, f"prefix เป็น {m.group(1)} แต่แถวนี้เป็น {role}")); continue
        if q not in REQ:
            not_in_set.append((iid, role, q, "ไม่มีในชุด 600 แถวที่ตรึงไว้")); continue
        if q not in ROLE_REQS[role]:
            not_in_set.append((iid, role, q, "มีในไฟล์อ้างอิงแต่ไม่ใช่ชุด 30 ของบทบาทนี้")); continue
        if REQ[q]["element_id"] != m.group(2):
            bad_format.append((iid, role, q, "ส่วน element_id ไม่ตรงกับไฟล์อ้างอิง"))
        if q in seen:
            dup_in_item.append((iid, role, q, "ซ้ำภายในรายการเดียวกัน"))
        seen.add(q)
    n_declared = int(num(r.get("n_competencies"), -1))
    if n_declared != len(set(ids)):
        count_mismatch.append((iid, role, f"n_competencies={n_declared}", f"นับจริง={len(set(ids))}"))

chk("CHK-01", "รูปแบบ requirement_id ถูกต้องทุกค่า", not bad_format, f"{len(bad_format)} รายการผิด")
chk("CHK-02", "prefix ตรงกับ role_id ของแถวนั้น", not bad_prefix, f"{len(bad_prefix)} รายการผิด")
chk("CHK-03", "ทุก competency_id อยู่ในชุด 30 ของบทบาทนั้น", not not_in_set, f"{len(not_in_set)} รายการผิด")
chk("CHK-04", "ไม่มี requirement ซ้ำภายในรายการเดียว", not dup_in_item, f"{len(dup_in_item)} รายการซ้ำ")
chk("CHK-05", "n_competencies ตรงกับจำนวนจริง", not count_mismatch, f"{len(count_mismatch)} แถวไม่ตรง")

errs = [("ประเภท","item_id","role_id","ค่า","เหตุผล")]
for tag, lst in (("bad_format",bad_format),("bad_prefix",bad_prefix),("not_in_set",not_in_set),
                 ("dup_in_item",dup_in_item),("count_mismatch",count_mismatch)):
    for e in lst: errs.append((tag,)+tuple(str(x) for x in e))
wr("prefix_errors.csv", errs[0], errs[1:])

# --- corpus_master  ↔  item_competency_map  ต้องตรงกันสองทาง
map_pairs  = {(m["item_id"], m["requirement_id"]) for m in imap}
csv_pairs  = {(iid, q) for iid, ids in item_reqs.items() for q in ids}
only_csv, only_map = csv_pairs - map_pairs, map_pairs - csv_pairs
chk("CHK-06", "corpus_master กับ item_competency_map ตรงกันทุกคู่",
    not only_csv and not only_map, f"มีเฉพาะใน CSV {len(only_csv)} คู่ · มีเฉพาะใน map {len(only_map)} คู่")
wr("map_reconcile_diff.csv", ["อยู่ที่ไหน","item_id","requirement_id"],
   [("เฉพาะ corpus_master",)+p for p in sorted(only_csv)] + [("เฉพาะ item_competency_map",)+p for p in sorted(only_map)])

# --- ความสอดคล้องของ role/soc/item_id
meta_bad, id_bad = [], []
for r in corpus:
    tr, soc = ROLE_META.get(r["role_id"], ("",""))
    if r["target_role"] != tr or r["soc_code"] != soc:
        meta_bad.append((r["item_id"], r["role_id"], f"{r['target_role']} / {r['soc_code']}", f"ควรเป็น {tr} / {soc}"))
    pre = "CRS-" if r["item_type"] == "course" else "CRT-"
    if not r["item_id"].startswith(pre + r["role_id"] + "-"):
        id_bad.append((r["item_id"], r["role_id"], r["item_type"], "item_id ไม่ตรงกับ item_type/role_id"))
ids_all = [r["item_id"] for r in corpus]
dups_id = [k for k, v in collections.Counter(ids_all).items() if v > 1]
chk("CHK-07", "target_role / soc_code ตรงกับไฟล์อ้างอิง", not meta_bad, f"{len(meta_bad)} แถวไม่ตรง")
chk("CHK-08", "รูปแบบ item_id สอดคล้องกับ item_type และ role_id", not id_bad, f"{len(id_bad)} แถวไม่ตรง")
chk("CHK-09", "item_id ไม่ซ้ำ", not dups_id, f"ซ้ำ {len(dups_id)} รหัส")

# ================================================================ ส่วนที่ 2 — COVERAGE MATRIX
LAYER_L1 = "L1_researcher_tagged"
by_req = collections.defaultdict(lambda: collections.Counter())
for m in imap:
    q = m["requirement_id"]
    by_req[q]["items"] += 1
    by_req[q]["L1" if m["coverage_layer"] == LAYER_L1 else "L2"] += 1
    by_req[q]["course" if m["item_type"] == "course" else "cert"] += 1
    if str(m.get("coverage_strength")) == "primary": by_req[q]["primary"] += 1

item_by_id  = {r["item_id"]: r for r in corpus}
mode_pairs  = collections.defaultdict(lambda: collections.defaultdict(set))   # mode -> req -> {layer}
for m in imap:
    it = item_by_id.get(m["item_id"])
    if not it: continue
    modes = {x.strip() for x in str(it["recommendation_mode"]).split(SEP)}
    for md in MODES:
        if md in modes:
            mode_pairs[md][m["requirement_id"]].add("L1" if m["coverage_layer"] == LAYER_L1 else "L2")

rows = []
for r in req_rows:
    q = r["requirement_id"]; c = by_req.get(q, collections.Counter())
    rows.append([q, r["role_id"], r["domain"], r["element_name"], r["importance_im"],
                 f"{W[q]:.6f}", c["items"], c["course"], c["cert"], c["L1"], c["L2"], c["primary"],
                 "Y" if c["items"] else "N", "Y" if c["L1"] else "N",
                 *["Y" if q in mode_pairs[md] else "N" for md in MODES]])
wr("coverage_matrix.csv",
   ["requirement_id","role_id","domain","element_name","importance_im","weight_renormalized",
    "n_items","n_courses","n_certifications","n_L1","n_L2","n_primary",
    "covered_any","covered_L1","covered_course_only","covered_certification_only","covered_both"], rows)

# --- สรุปรายบทบาท + เทียบกับ role_index ที่ไฟล์ประกาศไว้
ri = {r["role_id"]: r for r in role_index}
role_rows, mismatches = [], []
for rid in sorted(ROLE_REQS):
    reqs = ROLE_REQS[rid]
    cov   = {q for q in reqs if by_req.get(q, {}).get("items")}
    covL1 = {q for q in reqs if by_req.get(q, {}).get("L1")}
    wcov  = sum(W[q] for q in cov); wcovL1 = sum(W[q] for q in covL1)
    md    = {m: len([q for q in reqs if q in mode_pairs[m]]) for m in MODES}
    role_rows.append([rid, ROLE_META[rid][0], len(reqs), len(cov), len(covL1), len(reqs)-len(cov),
                      f"{100*len(cov)/len(reqs):.1f}", f"{100*len(covL1)/len(reqs):.1f}",
                      f"{100*wcov:.1f}", f"{100*wcovL1:.1f}",
                      md["course_only"], md["certification_only"], md["both"]])
    x = ri.get(rid)
    if x:
        for field, mine in (("requirements_covered", len(cov)),
                            ("requirements_covered_l1", len(covL1)),
                            ("requirements_uncovered", len(reqs)-len(cov)),
                            ("corpus_gap_coverage_pct", round(100*len(cov)/len(reqs), 1))):
            theirs = num(x.get(field))
            if theirs is None or abs(theirs - mine) > 0.051:
                mismatches.append((rid, field, x.get(field), mine))
wr("coverage_by_role.csv",
   ["role_id","target_role","n_requirements","covered_any","covered_L1","uncovered",
    "gap_coverage_pct","gap_coverage_L1_pct","weight_coverage_pct","weight_coverage_L1_pct",
    "covered_under_course_only","covered_under_certification_only","covered_under_both"], role_rows)
wr("role_index_mismatch.csv", ["role_id","field","ค่าที่ไฟล์ประกาศ","ค่าที่คำนวณใหม่"], mismatches)
chk("CHK-10", "role_index ที่ไฟล์ประกาศตรงกับที่คำนวณใหม่", not mismatches, f"{len(mismatches)} ช่องไม่ตรง")

# --- uncovered ที่คำนวณใหม่ เทียบกับชีต uncovered_requirements
unc_mine   = {q for q in REQ if not by_req.get(q, {}).get("items")}
unc_theirs = {str(r["requirement_id"]) for r in unc_sheet}
wr("uncovered_recomputed.csv", ["requirement_id","role_id","domain","element_name","importance_im","weight_renormalized","อยู่ในชีต uncovered หรือไม่"],
   [[q, REQ[q]["role_id"], REQ[q]["domain"], REQ[q]["element_name"], REQ[q]["importance_im"],
     f"{W[q]:.6f}", "Y" if q in unc_theirs else "N"] for q in sorted(unc_mine)])
chk("CHK-11", "รายการ uncovered ตรงกับชีต uncovered_requirements",
    unc_mine == unc_theirs, f"คำนวณได้ {len(unc_mine)} · ในชีต {len(unc_theirs)} · ต่างกัน {len(unc_mine ^ unc_theirs)}")

# ================================================================ ส่วนที่ 3 — ความสมบูรณ์ · คำศัพท์ควบคุม · ตัวเลข
gate, enum_bad, num_bad = [], [], []
for r in corpus:
    for f in ("source_url", "competency_ids", "estimated_hours"):
        if not str(r.get(f, "")).strip():
            gate.append((r["item_id"], f, "ว่าง — Completeness Gate ตัดทิ้ง"))
    for f, allowed in ENUM.items():
        v = str(r.get(f, "")).strip()
        if v and v not in allowed:
            enum_bad.append((r["item_id"], f, v, "ไม่อยู่ในชุดค่าที่อนุญาต"))
    for m in str(r.get("recommendation_mode", "")).split(SEP):
        if m.strip() and m.strip() not in MODES:
            enum_bad.append((r["item_id"], "recommendation_mode", m.strip(), "ไม่อยู่ในชุดค่าที่อนุญาต"))
    h = num(r.get("estimated_hours"))
    if h is None or h <= 0 or h > 2000:
        num_bad.append((r["item_id"], "estimated_hours", r.get("estimated_hours"), "ต้องเป็นตัวเลข 1–2000"))
    wc = num(r.get("weight_covered"))
    if wc is None or not (0 <= wc <= 1.000001):
        num_bad.append((r["item_id"], "weight_covered", r.get("weight_covered"), "ต้องอยู่ระหว่าง 0–1"))
    g = num(r.get("expected_readiness_gain_pct"))
    if wc is not None and g is not None and abs(g - wc*100) > 0.06:
        num_bad.append((r["item_id"], "expected_readiness_gain_pct", g, f"ควรเป็น {wc*100:.2f}"))
    # ตรวจน้ำหนักที่ประกาศ เทียบกับผลรวมจริงของ requirement ที่จับคู่
    wsum = sum(W.get(q, 0.0) for q in set(item_reqs[r["item_id"]]))
    if wc is not None and abs(wsum - wc) > 0.0006:
        num_bad.append((r["item_id"], "weight_covered", wc, f"คำนวณใหม่ได้ {wsum:.6f}"))
    u = str(r.get("source_url", ""))
    if u and not u.startswith("https://"):
        num_bad.append((r["item_id"], "source_url", u[:60], "ไม่ใช่ https"))
    if str(r.get("item_type")) == "certification" and not str(r.get("exam_code", "")).strip():
        gate.append((r["item_id"], "exam_code", "ใบรับรองต้องมีรหัสข้อสอบ"))
chk("CHK-12", "ผ่าน Completeness Gate ทุกแถว", not gate, f"{len(gate)} ช่องว่าง")
chk("CHK-13", "คำศัพท์ควบคุมถูกต้องทุกฟิลด์", not enum_bad, f"{len(enum_bad)} ค่าไม่อยู่ในชุด")
chk("CHK-14", "ค่าตัวเลขและ URL สมเหตุสมผล", not num_bad, f"{len(num_bad)} ค่าผิด")
wr("field_errors.csv", ["item_id","field","ค่า","เหตุผล"],
   [list(x) + [""] * (4 - len(x)) for x in gate + enum_bad + num_bad])

# --- รายการซ้ำข้ามบทบาท (นโยบายตาม README ข้อ D — รายงานเพื่อความโปร่งใส ไม่ใช่ข้อผิดพลาด)
dupmap = collections.defaultdict(list)
for r in corpus:
    dupmap[(str(r["title"]).strip().lower(), str(r["provider"]).strip().lower())].append(r)
dups = {k: v for k, v in dupmap.items() if len(v) > 1}
wr("duplicate_items.csv", ["title","provider","n_rows","item_ids","roles","estimated_hours ที่ต่างกัน"],
   [[k[0], k[1], len(v), SEP.join(x["item_id"] for x in v), SEP.join(x["role_id"] for x in v),
     "Y" if len({x["estimated_hours"] for x in v}) > 1 else "N"] for k, v in sorted(dups.items())])
inconsistent = [k for k, v in dups.items() if len({x["estimated_hours"] for x in v}) > 1
                or len({x["source_url"] for x in v}) > 1]
chk("CHK-15", "รายการเดียวกันข้ามบทบาทให้ค่าตรงกัน (ชั่วโมง/URL)", not inconsistent,
    f"รายการไม่ซ้ำจริง {len(dupmap)} · ใช้ซ้ำข้ามบทบาท {len(dups)} · ให้ค่าขัดกัน {len(inconsistent)}", blocking=False)

# --- URL ซ้ำ
urlmap = collections.defaultdict(list)
for r in corpus: urlmap[str(r["source_url"]).strip()].append(r["item_id"])

# ================================================================ ส่วนที่ 4 — ความเป็นไปได้ของความจุการเรียน
cap_rows = []
for rid in sorted(ROLE_REQS):
    items = [r for r in corpus if r["role_id"] == rid]
    hrs = sorted(num(r["estimated_hours"], 0) for r in items)
    med = hrs[len(hrs)//2]
    row = [rid, len(items), int(min(hrs)), int(med), int(max(hrs)), int(sum(hrs))]
    for months, hpw in ((6,5),(6,10),(12,10),(24,10)):
        cap = months * 4.33 * hpw
        fit, acc = 0, 0.0
        for h in hrs:
            if acc + h <= cap: acc += h; fit += 1
        row += [int(cap), fit]
    cap_rows.append(row)
wr("capacity_check.csv",
   ["role_id","n_items","min_hours","median_hours","max_hours","total_hours",
    "cap_6m_5h","fit_6m_5h","cap_6m_10h","fit_6m_10h","cap_12m_10h","fit_12m_10h","cap_24m_10h","fit_24m_10h"],
   cap_rows)
tight = [r[0] for r in cap_rows if r[7] < 3]
chk("CHK-16", "ทุกบทบาทจัดรายการได้ ≥ 3 รายการที่กรอบเวลาแคบสุด (6 เดือน 5 ชม./สัปดาห์)",
    not tight, f"บทบาทที่จัดได้ < 3 รายการ: {', '.join(tight) or '-'}", blocking=False)

# ================================================================ ส่วนที่ 5 — ความพร้อม freeze
pend = collections.Counter(str(r.get("verification_status")) for r in corpus)
chk("CHK-17", "ตรวจ URL ครบทุกแถวแล้ว (verification_status = verified)",
    pend.get("verified", 0) == len(corpus),
    f"verified {pend.get('verified',0)}/{len(corpus)} · ค้างตรวจ {pend.get('pending_verification',0)}", blocking=False)
chk("CHK-18", "ไม่มี requirement ที่ไม่มีรายการรองรับ", not unc_mine,
    f"{len(unc_mine)} requirement จาก {len(REQ)} ยังไม่มีรายการ ({100*len(unc_mine)/len(REQ):.1f}%)", blocking=False)

sha = {f: sha256(f) for f in (REQ_FILE, CORPUS_CSV, CORPUS_XLSX) if os.path.exists(f)}
wr("qa_summary.csv", ["check_id","ชื่อการตรวจ","ผล","รายละเอียด"], results)
with open(os.path.join(OUTDIR, "sha256.json"), "w", encoding="utf-8") as f:
    json.dump(sha, f, indent=2, ensure_ascii=False)

# ================================================================ สรุปหน้าจอ
print("=" * 78)
print("ผลการตรวจสอบอิสระ · corpus 400 รายการ เทียบกับชุดข้อกำหนด 600 แถวที่ตรึงไว้")
print("=" * 78)
for cid, name, res, detail in results:
    mark = {"PASS": "  ผ่าน  ", "FAIL": " ไม่ผ่าน", "REVIEW": " ต้องดู "}[res]
    print(f"{cid} [{mark}] {name}")
    if detail: print(f"          {detail}")

tot_cov = sum(1 for q in REQ if by_req.get(q, {}).get("items"))
tot_l1  = sum(1 for q in REQ if by_req.get(q, {}).get("L1"))
print("\n" + "-" * 78)
print("ความครอบคลุมภาพรวม (คำนวณใหม่ ไม่ได้อ่านจากชีต role_index)")
print("-" * 78)
print(f"  requirement ที่มีรายการรองรับ (L1+L2) : {tot_cov}/{len(REQ)}  ({100*tot_cov/len(REQ):.1f}%)")
print(f"  requirement ที่มีรายการรองรับ (L1)    : {tot_l1}/{len(REQ)}  ({100*tot_l1/len(REQ):.1f}%)")
for md in MODES:
    n = len(mode_pairs[md])
    print(f"  ครอบคลุมเมื่อกรองด้วยโหมด {md:<20}: {n}/{len(REQ)}  ({100*n/len(REQ):.1f}%)")
print(f"\n  รายการไม่ซ้ำจริง (title+provider)      : {len(dupmap)} จาก {len(corpus)} แถว")
print(f"  ผู้ให้บริการที่ไม่ซ้ำ                    : {len({str(r['provider']).strip() for r in corpus})}")
print(f"  URL ที่ใช้ซ้ำมากกว่า 1 แถว              : {sum(1 for v in urlmap.values() if len(v) > 1)}")

blocking = [r for r in results if r[2] == "FAIL"]
print("\n" + "=" * 78)
print(f"รายงานทั้งหมดอยู่ในโฟลเดอร์ {OUTDIR}/  (7 ไฟล์)")
if blocking:
    print(f"สรุป: มีข้อผิดพลาดที่ต้องแก้ก่อน freeze {len(blocking)} ข้อ — " + ", ".join(r[0] for r in blocking))
else:
    print("สรุป: ไม่พบข้อผิดพลาดเชิงโครงสร้าง — เหลือเพียงงานที่ต้องใช้คน (ตรวจ URL) ก่อน freeze")
print("=" * 78)
sys.exit(1 if blocking else 0)
