# -*- coding: utf-8 -*-
"""
pdf_to_markdown.py — ขั้น B1: แยกเล่มฉบับขอสอบ (PDF) เป็น Markdown รายบท + รูป 24 รูป + สมการ LaTeX

  python scripts/pdf_to_markdown.py --pdf docs/baseline/IS_68076026_ExamSubmission_21SEP26.pdf --out book/baseline_21SEP26

ผลลัพธ์เป็น "ฉบับถอดจาก PDF" (อ่านอย่างเดียว ใช้เทียบ) · ฉบับที่แก้ต่อคือ book/*.md
ตรวจ: ข้อความทุกย่อหน้าต้องมาจาก PDF (ไม่มีการเรียบเรียงใหม่) · scripts/check_book_vs_pdf.py เทียบซ้ำได้
"""
import argparse, os, re
import pymupdf

EQ = {
    "3.1": r"w_i = \frac{IM_i}{\sum_{j=1}^{30} IM_j}",
    "3.2": r"\mathrm{ov}(q, r) = \frac{|T(q) \cap T(r)|}{\min(|T(q)|,\ 25)}",
    "3.3": r"a_i = \frac{n_i^{\mathrm{agree}}}{m_i}",
    "3.4": r"R = \frac{\sum_{i \in D} s_i w_i}{\sum_{i \in D} w_i} \times 100",
    "3.5": r"C = \frac{\sum_{i \in D} w_i}{\sum_{i \in A} w_i}",
    "3.6": r"U = \frac{n_{\mathrm{rejected}}}{n_{\mathrm{claims}}}",
    "3.7": r"H_{\max} = M \times 4.33 \times h",
    "3.8": r"d_k = \frac{\sum_{i \in (G_k \cap G_{\mathrm{gap}}) \setminus S} w_i}{h_k}",
}
PARTS = [("00_front", 1, 7), ("01_chapter1", 12, 17), ("02_chapter2", 18, 22), ("03_chapter3", 23, 86),
         ("04_references", 87, 88), ("05_appendix_a_d", 89, 104), ("06_appendix_e", 105, 112)]
MATH = re.compile(r"[\U0001D400-\U0001D7FF∑]")


def in_rect(b, r, tol=2):
    return b[0] >= r[0] - tol and b[1] >= r[1] - tol and b[2] <= r[2] + tol and b[3] <= r[3] + tol


def join_lines(parts):
    out = ""
    for t in parts:
        t = t.rstrip("\n")
        if out and not out.endswith(" ") and re.match(r"[A-Za-z0-9(\[]", t[:1] or "") and re.search(r"[A-Za-z0-9)\],.;:]$", out):
            out += " "
        out += t
    return re.sub(r"\s+", " ", out).strip()


def md_table(rows):
    rows = [[(c or "").replace("\n", " ").replace("|", "\\|").strip() for c in r] for r in rows]
    n = max(len(r) for r in rows)
    rows = [r + [""] * (n - len(r)) for r in rows]
    out = ["| " + " | ".join(rows[0]) + " |", "|" + "---|" * n]
    out += ["| " + " | ".join(r) + " |" for r in rows[1:]]
    return out


def page_elements(page, pno, figdir, figcount):
    els = []
    tabs = page.find_tables().tables
    lines = []
    for b in page.get_text("dict")["blocks"]:
        if b["type"] == 0:
            for l in b["lines"]:
                lines.append((l["bbox"], "".join(s["text"] for s in l["spans"])))
    for t in tabs:
        rows = []
        for row in t.rows:
            cells = []
            for cb in row.cells:
                if cb is None: cells.append(""); continue
                txt = [tx for bb, tx in lines if cb[0] - 1 <= (bb[0] + bb[2]) / 2 <= cb[2] + 1 and cb[1] - 1 <= (bb[1] + bb[3]) / 2 <= cb[3] + 1]
                cells.append(join_lines(txt))
            rows.append(cells)
        els.append(dict(kind="table", y=t.bbox[1], rows=rows, ncol=t.col_count, bbox=t.bbox))
    for img in page.get_images(full=True):
        xref = img[0]
        for r in page.get_image_rects(xref):
            if r.width < 80 or r.height < 60: continue
            figcount[0] += 1
            name = f"fig_p{pno:03d}_{figcount[0]:02d}.png"
            pix = page.get_pixmap(dpi=200, clip=r)
            pix.save(os.path.join(figdir, name))
            els.append(dict(kind="image", y=r.y0, file=name))
    for b in page.get_text("dict")["blocks"]:
        if b["type"] != 0: continue
        for l in b["lines"]:
            text = "".join(s["text"] for s in l["spans"])
            if not text.strip(): continue
            y = l["bbox"][1]
            if y < 60 or y > 790: continue          # เลขหน้า/หัวกระดาษ
            if any(in_rect(l["bbox"], t["bbox"]) for t in els if t["kind"] == "table"): continue
            sp = l["spans"][0]
            els.append(dict(kind="line", y=y, x=l["bbox"][0], size=round(sp["size"]), bold=bool(sp["flags"] & 16), text=text))
    return sorted(els, key=lambda e: (round(e["y"]), e.get("x", 0)))


def convert(pdf, outdir):
    doc = pymupdf.open(pdf)
    figdir = os.path.join(outdir, "figures")
    os.makedirs(figdir, exist_ok=True)
    figcount = [0]
    report = {}
    for part, a, b in PARTS:
        md, para, last_table, pending_img, eq_buf = [], [], None, None, False
        chapter_buf = []

        def flush():
            nonlocal para
            if para:
                md.append("".join(para).strip()); md.append(""); para = []

        for pno in range(a, b + 1):
            for e in page_elements(doc[pno - 1], pno, figdir, figcount):
                if e["kind"] == "table":
                    flush()
                    rows = e["rows"]
                    if last_table is not None and last_table["ncol"] == e["ncol"] and md and md[-1] == "":
                        # ตารางต่อจากหน้าก่อน: ตัดหัวตารางที่ซ้ำ
                        if [c or "" for c in rows[0]] == [c or "" for c in last_table["rows"][0]]: rows = rows[1:]
                        md.pop()
                        md.extend(md_table([last_table["rows"][0]] + rows)[2:])
                        last_table = dict(ncol=e["ncol"], rows=[last_table["rows"][0]] + rows)
                    else:
                        md.extend(md_table(rows)); last_table = dict(ncol=e["ncol"], rows=rows)
                    md.append("")
                    continue
                if e["kind"] == "image":
                    flush(); pending_img = e["file"]; continue
                t, s = e["text"], e["size"]
                if MATH.search(t) or re.fullmatch(r"\s*[𝑖𝑗\d=\s]+\s*", t):
                    m = re.search(r"\((3\.\d)\)", t)
                    if m:
                        flush(); md += ["$$ " + EQ[m.group(1)] + " \\tag{" + m.group(1) + "} $$", ""]
                    continue
                if re.fullmatch(r"\s*\((3\.\d)\)\s*", t):
                    k = t.strip()[1:-1]
                    flush(); md += ["$$ " + EQ[k] + " \\tag{" + k + "} $$", ""]; continue
                if s >= 20 and e["bold"]:
                    flush(); chapter_buf.append(t.strip())
                    if len(chapter_buf) == 2 or not t.strip().startswith("บทที่"):
                        md += ["# " + " ".join(chapter_buf), ""]; chapter_buf = []
                    continue
                if (s >= 18 and e["bold"]) or (e["bold"] and re.match(r"^\d+\.\d+\.\d+ ", t.strip())):
                    flush(); h = t.strip()
                    lvl = "###" if re.match(r"^\d+\.\d+\.\d+ ", h) else "##"
                    md += [f"{lvl} {h}", ""]; last_table = None; continue
                st = t.strip()
                if st.startswith("รูปที่ "):
                    flush()
                    if pending_img:
                        md += [f"![{st}](figures/{pending_img})", "", f"*{st}*", ""]; pending_img = None
                    else:
                        md += [f"*{st}*", ""]
                    continue
                if st.startswith("ตารางที่ ") and e["bold"]:
                    flush(); md += [f"**{st}**", ""]; last_table = None; continue
                if e["x"] > 140 or re.match(r"^\s*\d+\. ", t) or st.startswith("ที่มา "):
                    flush()
                para.append(t if not t.endswith(" ") or True else t)
            # สิ้นหน้า: ย่อหน้ายังต่อได้
        flush()
        if pending_img: md += [f"![](figures/{pending_img})", ""]
        text = "\n".join(md)
        text = re.sub(r"[ \t]+\n", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        with open(os.path.join(outdir, part + ".md"), "w", encoding="utf-8", newline="\n") as fh:
            fh.write(f"<!-- ถอดจาก PDF ฉบับขอสอบ หน้า {a}–{b} โดย scripts/pdf_to_markdown.py -->\n\n" + text.strip() + "\n")
        report[part] = dict(pages=f"{a}-{b}", chars=len(text))
    report["figures"] = figcount[0]
    return report


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--pdf", required=True); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    print(convert(a.pdf, a.out))
