#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check_consistency.py — ตรวจว่าเอกสารทุกฉบับพูดตรงกัน
IS 68076026 · ดนุสรณ์ อนันตกาล · สร้าง 31 สิงหาคม 2026

รันก่อน commit ทุกครั้ง และทุกวันศุกร์ตาม Cadence ในแผนงาน

ตรวจ 5 ชั้น
  L1 คำต้องห้าม  — ถ้อยคำจากฉบับก่อน DEC-07 ที่ต้องไม่เหลืออยู่
  L2 คำที่ต้องมี — ถ้อยคำที่ฉบับปัจจุบันต้องมี
  L3 ค่าคงที่     — ตัวเลขในเอกสารต้องตรงกับ config_master ของ Master_Data
  L4 เวอร์ชัน     — corpus_version / snapshot_version / rules_version ต้องสอดคล้องกัน
  L5 ไฟล์ซ้ำรุ่น  — เตือนเมื่อมีไฟล์ประเภทเดียวกันหลายรุ่นอยู่นอก archive/

การใช้งาน
  python3 check_consistency.py            ตรวจทั้งโฟลเดอร์
  python3 check_consistency.py --list     แสดงรายชื่อไฟล์ที่จะตรวจแล้วออก
exit code 0 = ผ่าน · 1 = พบข้อผิดพลาด
"""
import csv, os, re, sys, glob, json, collections

ROOT = os.path.dirname(os.path.abspath(__file__))
while not os.path.isdir(os.path.join(ROOT, "02_dataset")) and os.path.dirname(ROOT) != ROOT:
    ROOT = os.path.dirname(ROOT)          # ขึ้นไปหารากโปรเจกต์
MASTER_CFG = os.path.join(ROOT, "04_master_data", "master_data_csv_31AUG26", "config_master_31AUG26.csv")

# ---------- ไฟล์ที่ถือว่าเป็น "ฉบับปัจจุบัน" ----------
INCLUDE = ["*.md", "*.docx"]
EXCLUDE_DIRS = {"archive", ".work", ".git", "db_31_0_excel", "__pycache__", ".agents",
                "master_data_csv_31AUG26", "corpus_qa_31AUG26", "corpus_qa_v10_31AUG26",
                "corpus_qa_v12_31AUG26", "05_scripts"}
EXCLUDE_FILES = {"Occupation_list.md"}          # ฉบับเลิกใช้ ถูกแทนด้วย Occupation_list_28AUG26.md
EXCLUDE_PATTERNS = ["~$", "Research Proposal", "System_Architecture_Proposal", "System Architecture.md",
                    "IS1 - 68076026", "translated_pasted_text", "extracted_docx_text"]

# ---------- L1 คำต้องห้าม ----------
FORBIDDEN = [
 (r"52\.2\s*%|w-share\s*52\.2|เฉลี่ย\s*52\.2", "ค่า w-share ฉบับก่อน DEC-07 (52.2%) — ต้องเป็น 70.3%",
  ["Corpus_v1.1","Corpus_v1.2","URL_Verification","DECISIONS","qa_summary","Gap_28AUG26","Gap_Closure","Development_Process","README"]),
 (r"ทั้งห้ากลุ่ม|ห้ากลุ่มสมรรถนะ|5 โดเมน", "ชุดข้อกำหนดเป็น 4 โดเมนตาม DEC-07",
  ["Gap_28AUG26","Gap_Closure","DECISIONS","Development_Process","README"]),
 (r"ChatGPT\s*5\.5|GPT-5\.5", "ชื่อโมเดลรุ่นเก่า — ต้องเป็น GPT-5.6 Terra",
  ["Development_Process","DECISIONS","Gap_Closure","README"]),   # เอกสารเหล่านี้อ้างถึงไฟล์รุ่นเก่าโดยตั้งใจ
 (r"Gemini\s*3\.1", "ชื่อโมเดลรุ่นเก่า — ต้องเป็น Gemini 3.7 Flash",
  ["Development_Process","DECISIONS","Gap_Closure","README"]),
 (r"Hybrid Verifier", "สถาปัตยกรรมเก่าที่ขัดกับ RQ2 (cross-validation ต้องเป็นโค้ดล้วน)",
  ["Development_Process","Gap_Closure","DECISIONS","README"]),
 (r"50[–-]82", "ช่วง candidate pool ฉบับก่อน DEC-07 — ต้องเป็น 31–65",
  ["Gap_28AUG26","Gap_Closure","DECISIONS","Development_Process","README"]),
 (r"15\s*:\s*15", "โควตาโดเมนฉบับเก่า — ต้องเป็น 12 : 18",
  ["Gap_28AUG26","Gap_Closure","DECISIONS","Development_Process","README"]),
 (r"element_aliases\s*ว่าง", "ข้อความที่บอกว่า alias ยังว่าง — เติมครบแล้วตั้งแต่ 28 ส.ค.",
  ["Gap_28AUG26","Gap_Closure","Development_Process","DECISIONS","README"]),
 (r"อนันตกานต์", "สะกดชื่อผู้วิจัยผิด — ต้องเป็น ดนุสรณ์ อนันตกาล", ["Gap_Closure","DECISIONS"]),
]

# ---------- L2 คำที่ต้องมี (ต่อไฟล์ที่ระบุ) ----------
REQUIRED = [
 ("IS_68076026", [r"DEC-07", r"70\.3", r"requirement_id", r"THETA", r"ภาคผนวก จ", r"weight_share_of_pool"]),
 ("Guideline n8n", [r"requirement_id", r"70\.3|12\s*:\s*18"]),
 ("System Architecture v", [r"requirement_id"]),
 ("DECISIONS_31AUG26", [r"DEC-09", r"DEC-10", r"DEC-11", r"DEC-14", r"DEC-15"]),
]

# ---------- L4 เวอร์ชันที่ต้องสอดคล้อง ----------
VERSIONS = {
 "snapshot_version": "ONET31.0-IS68076026-v1.0",
 "corpus_version_current": "CORPUS-IS68076026-v1.3-01SEP26",
 "rules_version_current": "RULES-IS68076026-v1.0-31AUG26",
}

# ---------- L5 ประเภทไฟล์ที่ควรมีฉบับปัจจุบันเดียว ----------
ONE_CURRENT = {
 "เล่ม IS": r"^IS_68076026.*\.docx$",
 "Guideline n8n": r"^Guideline n8n.*\.md$",
 "System Architecture": r"^System Architecture v.*\.md$",
 "Development Process": r"^Development_Process.*\.md$",
 "corpus workbook": r"^Course_Career.*\.xlsx$",
}

problems, warnings = [], []

def read_text(path):
    if path.endswith(".md"):
        return open(path, encoding="utf-8", errors="ignore").read()
    if path.endswith(".docx"):
        try:
            import docx
        except ImportError:
            warnings.append((os.path.basename(path), "L0", "ไม่มีไลบรารี python-docx จึงข้ามไฟล์ Word"))
            return ""
        d = docx.Document(path)
        parts = [p.text for p in d.paragraphs]
        for t in d.tables:
            for row in t.rows:
                parts += [c.text for c in row.cells]
        return "\n".join(parts)
    return ""

def collect():
    files = []
    for pat in INCLUDE:
        for p in glob.glob(os.path.join(ROOT, "**", pat), recursive=True):
            rel = os.path.relpath(p, ROOT)
            if any(part in EXCLUDE_DIRS for part in rel.split(os.sep)): continue
            if os.path.basename(p) in EXCLUDE_FILES: continue
            if any(x in rel for x in EXCLUDE_PATTERNS): continue
            files.append(p)
    return sorted(files)

files = collect()
if "--list" in sys.argv:
    print(f"ไฟล์ที่จะตรวจ {len(files)} ไฟล์")
    for f in files: print("  ", os.path.relpath(f, ROOT))
    sys.exit(0)

print(f"ตรวจ {len(files)} ไฟล์\n")
texts = {}
for p in files:
    texts[p] = read_text(p)

# ===== L1 =====
for p, txt in texts.items():
    base = os.path.basename(p)
    for pattern, why, exempt in FORBIDDEN:
        if any(e in base for e in exempt): continue
        m = re.search(pattern, txt)
        if m:
            line = txt[:m.start()].count("\n") + 1
            problems.append((base, "L1", f'พบ "{m.group()[:40]}" (บรรทัด ~{line}) — {why}'))

# ===== L2 =====
for key, patterns in REQUIRED:
    targets = [p for p in texts if key in os.path.basename(p)]
    if not targets:
        warnings.append((key, "L2", "ไม่พบไฟล์ที่ต้องตรวจ — ข้ามไป"))
        continue
    newest = max(targets, key=os.path.getmtime)
    txt = texts[newest]
    for pat in patterns:
        if not re.search(pat, txt):
            problems.append((os.path.basename(newest), "L2", f'ขาดถ้อยคำที่ต้องมี: {pat}'))

# ===== L3 ค่าคงที่ต้องตรงกับ config_master =====
# config_id -> รูปแบบที่ยอมรับได้ (ผ่านถ้าตรงรูปแบบใดรูปแบบหนึ่ง)
CHECK_VALUES = {
 "CFG-01": [r"THETA", r"0\.15"],
 "CFG-10": [r"4\.33"],
 "CFG-16": [r"ร้อยละ\s*10", r"10\s*%", r"0\.10"],
 "CFG-19": [r"0\.70", r"ร้อยละ\s*70"],
}
if os.path.exists(MASTER_CFG):
    cfg = {r["config_id"]: r for r in csv.DictReader(open(MASTER_CFG, encoding="utf-8-sig"))}
    book = [p for p in texts if os.path.basename(p).startswith("IS_68076026")]
    if book:
        newest = max(book, key=os.path.getmtime); txt = texts[newest]
        for cid, pats in CHECK_VALUES.items():
            if cid not in cfg: continue
            want = str(cfg[cid]["value"]).strip()
            if not any(re.search(pt, txt) for pt in pats):
                problems.append((os.path.basename(newest), "L3",
                                 f"เล่มไม่ได้ระบุค่า {cfg[cid]['parameter']} = {want} ที่ config_master กำหนดไว้ "
                                 f"(ที่มา: {cfg[cid]['source_of_truth']})"))
else:
    warnings.append(("config_master", "L3", "ยังไม่มีไฟล์ config_master — ข้ามการตรวจค่าคงที่"))

# ===== L4 เวอร์ชัน =====
for p, txt in texts.items():
    base = os.path.basename(p)
    for m in re.finditer(r"ONET31\.0-IS68076026-v[\d.]+", txt):
        if m.group() != VERSIONS["snapshot_version"]:
            problems.append((base, "L4", f"snapshot_version ไม่ตรง: {m.group()}"))
    for m in re.finditer(r"CORPUS-IS68076026-v[\d.]+[-\w]*", txt):
        if m.group() not in (VERSIONS["corpus_version_current"], "CORPUS-IS68076026-v0.9-draft",
                             "CORPUS-IS68076026-v1.0-31AUG26", "CORPUS-IS68076026-v1.1-31AUG26",
                             "CORPUS-IS68076026-v1.2-31AUG26"):
            warnings.append((base, "L4", f"พบ corpus_version ที่ไม่รู้จัก: {m.group()}"))

# ===== L5 ไฟล์ซ้ำรุ่น =====
top = []
for _d in ("01_docs", "02_dataset", "03_corpus", "04_master_data", "."):
    _p = os.path.join(ROOT, _d)
    if os.path.isdir(_p): top += [f for f in os.listdir(_p) if os.path.isfile(os.path.join(_p, f))]
for label, pat in ONE_CURRENT.items():
    hits = [f for f in top if re.match(pat, f) and not f.startswith("~$")]
    if len(hits) > 1:
        warnings.append((label, "L5", f"มี {len(hits)} รุ่นอยู่นอก archive/ : " + ", ".join(sorted(hits))))

# ===== รายงาน =====
W = collections.Counter(w[1] for w in warnings)
P = collections.Counter(p[1] for p in problems)
if problems:
    print("=" * 78); print("ข้อผิดพลาดที่ต้องแก้")
    print("=" * 78)
    for base, lv, msg in problems: print(f"  [{lv}] {base}\n        {msg}")
if warnings:
    print("\n" + "-" * 78); print("คำเตือน (ไม่บล็อก commit)")
    print("-" * 78)
    for base, lv, msg in warnings: print(f"  [{lv}] {base}\n        {msg}")

print("\n" + "=" * 78)
if problems:
    print(f"ไม่ผ่าน — ข้อผิดพลาด {len(problems)} ข้อ {dict(P)} · คำเตือน {len(warnings)} ข้อ")
    print("=" * 78); sys.exit(1)
print(f"ผ่าน — ไม่มีข้อผิดพลาด · คำเตือน {len(warnings)} ข้อ {dict(W)}")
print("=" * 78); sys.exit(0)
