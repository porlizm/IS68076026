# -*- coding: utf-8 -*-
"""
check_book_vs_pdf.py — ขั้น B2 (ตรวจ):
  1) ความครบของการถอด: ทุกย่อหน้าใน book/baseline_21SEP26/*.md ต้องพบในข้อความ PDF ฉบับขอสอบ (หลังตัดช่องว่าง)
  2) รายงานการแก้: ย่อหน้าใน book/*.md ที่ต่างจากฉบับถอด → evidence/book_changes_vs_baseline.md (ใช้ผูก DEC)

  python scripts/check_book_vs_pdf.py
"""
import difflib, glob, os, re, sys
import pymupdf

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PDF = os.path.join(ROOT, "docs", "baseline", "IS_68076026_ExamSubmission_21SEP26.pdf")
norm = lambda s: re.sub(r"[\s​|*#`>-]+", "", s)


def paras(path):
    t = open(path, encoding="utf-8").read()
    return [p.strip() for p in re.split(r"\n\s*\n", t) if p.strip() and not p.startswith("<!--") and not p.startswith("![") and not p.startswith("$$") and not p.startswith("|")]


def main():
    parts = []
    for pg in pymupdf.open(PDF):
        for b in pg.get_text("dict")["blocks"]:
            for l in b.get("lines", []):
                if 60 <= l["bbox"][1] <= 790: parts.append("".join(sp["text"] for sp in l["spans"]))
    pdf = norm("".join(parts))
    miss = []
    for f in sorted(glob.glob(os.path.join(ROOT, "book", "baseline_21SEP26", "0[1-6]*.md"))):
        for p in paras(f):
            if "\n|" in p: p = p.split("\n|")[0]
            q = norm(p)
            if len(q) > 12 and q not in pdf: miss.append((os.path.basename(f), p[:90]))
    print(f"1) ย่อหน้าในฉบับถอดที่ไม่พบใน PDF: {len(miss)}")
    for m in miss[:15]: print("   ", m)
    out = ["# การแก้เล่มเทียบฉบับขอสอบ (สร้างอัตโนมัติ)", "", "ย่อหน้าที่ต่างจากฉบับถอด PDF · ใช้ตรวจว่าทุกการแก้มี DEC รองรับ (docs/DECISIONS.md)", ""]
    n = 0
    for f in sorted(glob.glob(os.path.join(ROOT, "book", "0[1-7]*.md"))):
        base = os.path.join(ROOT, "book", "baseline_21SEP26", os.path.basename(f))
        a = paras(base) if os.path.exists(base) else []
        b = paras(f)
        sm = difflib.SequenceMatcher(a=[norm(x) for x in a], b=[norm(x) for x in b], autojunk=False)
        for op, i1, i2, j1, j2 in sm.get_opcodes():
            if op == "equal": continue
            n += 1
            out += [f"## {os.path.basename(f)} · {op}", ""]
            for x in a[i1:i2]: out.append("- เดิม: " + x[:400].replace("\n", " "))
            for x in b[j1:j2]: out.append("- ใหม่: " + x[:400].replace("\n", " "))
            out.append("")
    os.makedirs(os.path.join(ROOT, "evidence"), exist_ok=True)
    open(os.path.join(ROOT, "evidence", "book_changes_vs_baseline.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
    print(f"2) จุดที่แก้จากฉบับขอสอบ: {n} จุด → evidence/book_changes_vs_baseline.md")
    if miss: sys.exit(1)


if __name__ == "__main__":
    main()
