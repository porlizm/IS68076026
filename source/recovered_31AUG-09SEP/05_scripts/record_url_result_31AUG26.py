
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
import csv, sys, datetime, os
CSV="url_verification_31AUG26.csv"
rows=list(csv.DictReader(open(CSV,encoding="utf-8-sig")))
idx={r["url"]:r for r in rows}
now=datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
n=0; miss=[]
for line in sys.stdin.read().splitlines():
    line=line.strip()
    if not line or line.startswith("#"): continue
    parts=[p.strip() for p in line.split("\t")]
    url, verdict = parts[0], parts[1]
    title = parts[2] if len(parts)>2 else ""
    note  = parts[3] if len(parts)>3 else ""
    r=idx.get(url)
    if not r: miss.append(url); continue
    r["verdict"]=verdict; r["page_title"]=title; r["note"]=note; r["checked_at"]=now; n+=1
with open(CSV,"w",encoding="utf-8-sig",newline="") as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
done=sum(1 for r in rows if r["verdict"])
print(f"บันทึก {n} รายการ · ตรวจแล้วสะสม {done}/{len(rows)}")
if miss: print("!! ไม่พบ URL เหล่านี้ในไฟล์:"); [print("   ",u) for u in miss]
