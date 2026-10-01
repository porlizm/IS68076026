# -*- coding: utf-8 -*-
"""
update_manifest.py — ทะเบียน sha256 ของไฟล์อ้างอิง 8 ไฟล์ (DEC-21 ข้อ 4)

  python scripts/update_manifest.py            เขียน data/manifest.json ใหม่ (frozen ต้องเป็น false)
  python scripts/update_manifest.py --check    ตรวจว่า sha ตรงทุกไฟล์ (exit 1 ถ้าไม่ตรง)
  python scripts/update_manifest.py --freeze   ตรึงรุ่น (frozen=true) ใช้หลังนำร่องเท่านั้น (P3) และต้องมี DEC

ห้ามแก้ไฟล์ใน data/ หลัง freeze · ถ้าต้องแก้ให้ออก DEC และรุ่นใหม่
"""
import hashlib, json, os, sys, datetime
import pandas as pd

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA = os.path.join(ROOT, "data")
FILES = ["requirements.csv", "roles.json", "aliases.csv", "corpus.csv", "mappings.csv",
         "mapping_review.csv", "corpus_gap_request.csv", "url_manual_check.csv"]
MAN = os.path.join(DATA, "manifest.json")


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()


def rows(p):
    if p.endswith(".json"):
        return len(json.load(open(p, encoding="utf-8"))["roles"])
    return len(pd.read_csv(p, encoding="utf-8", dtype=str))


def build(frozen=False):
    corpus = pd.read_csv(os.path.join(DATA, "corpus.csv"), dtype=str, keep_default_na=False)
    rv = pd.read_csv(os.path.join(DATA, "mapping_review.csv"), dtype=str, keep_default_na=False)
    pending = int((corpus.verification_status != "verified").sum())
    blockers = []
    if pending: blockers.append(f"รายการรอตรวจ URL {pending} รายการ (data/url_manual_check.csv)")
    blockers.append("ยังไม่ผ่านการทดสอบนำร่อง 5 คน (P3) และยังไม่ได้หนังสือรับรองจริยธรรม (G2)")
    blockers.append("ยังไม่ได้ smoke test โมเดลจริงและบันทึกรหัสรุ่นในตารางที่ 3.8")
    return {
        "project": "IS 68076026",
        "dataset_version": "ONET31.0-IS68076026-v1.0",
        "corpus_version": corpus.corpus_version.iloc[0],
        "rules_version": "RULES-IS68076026-v1.0",
        "prompt_version": "analyst_v1.0",
        "updated_at": datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).isoformat(timespec="seconds"),
        "frozen": frozen,
        "freeze_blockers": [] if frozen else blockers,
        "approved_rows": int((rv.mapping_status == "source_checked_by_script").sum()),
        "files": {f: {"sha256": sha(os.path.join(DATA, f)), "rows": rows(os.path.join(DATA, f))} for f in FILES},
    }


def main():
    arg = sys.argv[1] if len(sys.argv) > 1 else ""
    if arg == "--check":
        m = json.load(open(MAN, encoding="utf-8"))
        bad = [f for f in FILES if sha(os.path.join(DATA, f)) != m["files"][f]["sha256"]]
        if bad: print("MANIFEST DRIFT:", *bad); sys.exit(1)
        print(f"manifest OK · {len(FILES)} ไฟล์ · frozen={m['frozen']}"); return
    if os.path.exists(MAN) and json.load(open(MAN, encoding="utf-8")).get("frozen") and arg != "--freeze":
        sys.exit("manifest ถูก freeze แล้ว ห้ามเขียนทับ (ออก DEC และรุ่นใหม่ก่อน)")
    m = build(frozen=(arg == "--freeze"))
    with open(MAN, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(m, fh, ensure_ascii=False, indent=2); fh.write("\n")
    print(f"เขียน manifest · frozen={m['frozen']} · approved_rows={m['approved_rows']}")


if __name__ == "__main__":
    main()
