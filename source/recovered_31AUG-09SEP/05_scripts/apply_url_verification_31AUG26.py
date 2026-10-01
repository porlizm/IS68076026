#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
apply_url_verification_31AUG26.py — นำผลการตรวจ URL กลับเข้า corpus
IS 68076026 · 31 สิงหาคม 2026 · GATE-C

อินพุต : url_verification_31AUG26.csv (ผลตรวจ 331 URL) · corpus_master_31AUG26.csv (v1.0)
เอาต์พุต: corpus_master_v11_31AUG26.csv · Course_Career_v11_31AUG26.xlsx
          url_action_list_31AUG26.csv (รายการที่ต้องตัดสินใจด้วยคน)
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
import csv, json, hashlib, collections, datetime
import openpyxl
from openpyxl.styles import Font, PatternFill

TODAY   = "2026-08-31"
VER     = "CORPUS-IS68076026-v1.1-31AUG26"
VERIFIER= "ผู้วิจัย (ตรวจด้วยการดึงหน้าเว็บ 31 ส.ค. 2026)"
SRC_XLSX= "Course_Career_31AUG26.xlsx"
OUT_XLSX= "Course_Career_v11_31AUG26.xlsx"
OUT_CSV = "corpus_master_v11_31AUG26.csv"

# URL ที่ยืนยันปลายทางใหม่แล้วว่าใช้งานได้ → แก้ให้อัตโนมัติ
REDIRECTS = {
 "https://resources.github.com/learn/certifications/": "https://learn.github.com/certifications",
 "https://www.interaction-design.org/courses": "https://ixdf.org/courses",
 "https://education.oracle.com/": "https://www.oracle.com/education/",
 "https://security.ine.com/certifications/ejpt-certification/": "https://ine.com/security/certifications/ejpt-certification",
 "https://security.ine.com/certifications/ecppt-certification/": "https://ine.com/security/certifications/ecppt-certification",
 "https://securityblue.team/certifications/blue-team-level-1/": "https://www.centri.org/certifications/blue-team-level-1",
 "https://www.cloudskillsboost.google/": "https://www.skills.google/",
 "https://www.cloudskillsboost.google/paths/17": "https://www.skills.google/paths/17",
 "https://www.ireb.org/en/cpre/": "https://cpre.ireb.org/en",
}
# URL ที่เปลี่ยนเส้นทางแต่ยืนยันปลายทางไม่ได้ → ต้องให้คนตัดสิน
REDIRECT_UNVERIFIED = {
 "https://www.cloudskillsboost.google/paths/34": "https://www.skills.google/paths/34 (ตอบ 403 ยืนยันไม่ได้)",
 "https://www.juniper.net/us/en/training/certification.html": "learningportal.juniper.net (หน้าแสดงเนื้อหา HPE Aruba)",
 "https://www.tableau.com/learn/certification/certified-data-analyst": "trailheadacademy.salesforce.com (ยืนยันไม่ได้)",
 "https://www.tableau.com/learn/certification/desktop-specialist": "trailheadacademy.salesforce.com (ยืนยันไม่ได้)",
}
PASS   = {"LIVE"}
BLOCK  = {"RETIRED", "DEAD_404", "SPAM_TAKEOVER", "GONE"}          # ต้องเปลี่ยน/ลบรายการ
REVIEW = {"RETIRING", "WRONG_CONTENT", "UNCLEAR", "FETCH_ERROR"}   # ต้องคนตัดสิน

def rd(p):
    with open(p, encoding="utf-8-sig", newline="") as f: return list(csv.DictReader(f))

ver = {r["url"]: r for r in rd("url_verification_31AUG26.csv")}
corpus = rd("corpus_master_31AUG26.csv")
HEADER = list(corpus[0].keys())

stat = collections.Counter(); actions = []; n_redir = 0
for r in corpus:
    u = r["source_url"].strip()
    v = ver.get(u)
    r["corpus_version"] = VER
    if not v:
        stat["ไม่มีผลตรวจ"] += 1; continue
    verdict = v["verdict"]

    if verdict == "REDIRECT" and u in REDIRECTS:
        r["source_url"] = REDIRECTS[u]
        r["verification_status"] = "verified"
        r["verification_date"] = TODAY; r["verified_by"] = VERIFIER
        r["researcher_notes"] = (r["researcher_notes"] + " · แก้ URL ตามการเปลี่ยนเส้นทางที่ยืนยันแล้วเมื่อ " + TODAY).strip(" ·")
        stat["verified (แก้ URL ตาม redirect)"] += 1; n_redir += 1
        continue

    if verdict in PASS:
        r["verification_status"] = "verified"
        r["verification_date"] = TODAY; r["verified_by"] = VERIFIER
        stat["verified"] += 1
        continue

    # ที่เหลือคงสถานะ pending และเข้ารายการงาน
    r["verification_status"] = "rejected" if verdict in BLOCK else "pending_verification"
    tag = "ต้องเปลี่ยนหรือลบรายการ" if verdict in BLOCK else "ต้องตรวจด้วยคน"
    r["researcher_notes"] = (r["researcher_notes"] + f" · [{verdict}] {v['note']}").strip(" ·")
    stat[f"{tag} ({verdict})"] += 1
    actions.append([r["item_id"], r["role_id"], r["item_type"], r["title"], r["provider"],
                    u, verdict, tag, v["note"] or REDIRECT_UNVERIFIED.get(u, "")])

actions.sort(key=lambda x: (x[7], x[6], x[1]))
with open("url_action_list_31AUG26.csv", "w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f)
    w.writerow(["item_id","role_id","item_type","title","provider","source_url","verdict","การดำเนินการ","หมายเหตุ"])
    w.writerows(actions)
with open(OUT_CSV, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=HEADER); w.writeheader()
    for r in corpus: w.writerow({k: r.get(k, "") for k in HEADER})

# ---- สร้าง xlsx ใหม่จากต้นฉบับ v1.0 โดยแทนชีต corpus_master และเพิ่มชีต url_verification
wb = openpyxl.load_workbook(SRC_XLSX)
del wb["corpus_master"]
HEAD_FILL = PatternFill("solid", fgColor="1F3864"); HEAD_FONT = Font(color="FFFFFF", bold=True)
def add(name, header, rows, at=None):
    ws = wb.create_sheet(name, at); ws.append(list(header))
    for c in ws[1]: c.fill = HEAD_FILL; c.font = HEAD_FONT
    for r in rows: ws.append(list(r))
    ws.freeze_panes = "A2"
    for i, h in enumerate(header, 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = min(max(12, len(str(h)) + 3), 42)
add("corpus_master", HEADER, [[r.get(k, "") for k in HEADER] for r in corpus], 1)
add("url_verification", ["url","domain","n_rows","item_ids","expected_title","provider","item_type",
                         "batch","page_title","verdict","checked_at","note"],
    [[v["url"], v["domain"], v["n_rows"], v["item_ids"], v["expected_title"], v["provider"],
      v["item_type"], v["batch"], v["page_title"], v["verdict"], v["checked_at"], v["note"]]
     for v in ver.values()])
add("url_action_list", ["item_id","role_id","item_type","title","provider","source_url","verdict","การดำเนินการ","หมายเหตุ"], actions)

# ปรับ qa_checks ข้อ QA-10 ให้สะท้อนผลจริง
ws = wb["qa_checks"]
nver = sum(1 for r in corpus if r["verification_status"] == "verified")
for row in ws.iter_rows(min_row=2):
    if row[0].value == "QA-10":
        row[3].value = str(len(corpus) - nver)
        row[4].value = "PASS" if nver == len(corpus) else "REVIEW"
        row[5].value = f"ตรวจ URL แล้วทั้ง 331 URL · verified {nver}/{len(corpus)} แถว · เหลือ {len(actions)} แถวที่ต้องแก้"
wb.save(OUT_XLSX)

def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()
log = json.load(open("corpus_version_log_31AUG26.json", encoding="utf-8"))
log.update({"corpus_version": VER, "previous_version": "CORPUS-IS68076026-v1.0-31AUG26",
    "url_verification": {"urls_checked": len(ver), "rows_verified": nver,
                         "rows_needing_action": len(actions), "redirects_fixed": n_redir,
                         "checked_at": TODAY, "method": "ดึงหน้าเว็บทีละหน้าและอ่านชื่อหลักสูตรจากหน้าจริง"},
    "sha256": {f: sha(f) for f in (OUT_XLSX, OUT_CSV, "url_verification_31AUG26.csv", "onet_requirements_28AUG26.csv")}})
json.dump(log, open("corpus_version_log_v11_31AUG26.json", "w", encoding="utf-8"), indent=2, ensure_ascii=False)

print(f"ผลรวม {len(corpus)} แถว")
for k, v in sorted(stat.items(), key=lambda x: -x[1]): print(f"  {v:>4}  {k}")
print(f"\nverified {nver}/{len(corpus)} แถว ({100*nver/len(corpus):.1f}%) · ต้องแก้ {len(actions)} แถว")
print(f"เขียนแล้ว: {OUT_XLSX} · {OUT_CSV} · url_action_list_31AUG26.csv · corpus_version_log_v11_31AUG26.json")
