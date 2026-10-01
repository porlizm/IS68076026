# -*- coding: utf-8 -*-
"""
build_book.py — ขั้น B2: สร้างเล่ม .docx จาก book/*.md (ห้ามแก้ docx ด้วยมือ)

  python scripts/book_numbers.py && python scripts/build_book.py            -> build/IS_68076026_<วันที่>.docx
  python scripts/build_book.py --check                                       -> ตรวจว่าไม่มี {{placeholder}} ค้าง และภาพ/สมการครบ

ขั้นตอน: แทนตัวเลขจาก book/numbers.json → แปลงเป็น pandoc markdown พร้อม custom-style ตามแม่แบบคณะ
         (เนื้อหาทั่วไป · ชื่อตาราง · ชื่อรูป) → pandoc (สมการเป็น OMML, สารบัญเป็นฟิลด์) → ปรับหน้า/เลขหน้า/ภาษาไทย
ต้องมี pandoc ≥ 3 และ python-docx · ถ้ามี pythainlp จะแทรก ZWSP ระหว่างคำไทยเพื่อให้ Word ตัดบรรทัดถูก
ฟอนต์ TH Sarabun New ต้องติดตั้งในเครื่องที่เปิดไฟล์ · เปิดใน Word แล้วกด "อัปเดตฟิลด์" ครั้งแรกเพื่อเติมเลขหน้าสารบัญ
"""
import argparse, datetime, glob, json, os, re, shutil, subprocess, sys, tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BOOK = os.path.join(ROOT, "book")
OUT = os.path.join(ROOT, "build")
PARTS = ["01_chapter1.md", "02_chapter2.md", "03_chapter3.md", "04_references.md", "05_appendix_a_d.md", "06_appendix_e.md", "07_appendix_f.md"]
FONT = "TH Sarabun New"
PAGEBREAK = '```{=openxml}\n<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n```'

try:
    from pythainlp.tokenize import word_tokenize
    def zwsp(s):
        out = []
        for chunk in re.split(r"([฀-๿]+)", s):
            if chunk and re.match(r"[฀-๿]", chunk):
                out.append("​".join(word_tokenize(chunk, engine="newmm", keep_whitespace=True)))
            else:
                out.append(chunk)
        return "".join(out)
except Exception:  # pythainlp ไม่มี
    def zwsp(s): return s


def field(instr):
    return ('```{=openxml}\n<w:p><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r><w:r><w:instrText xml:space="preserve"> '
            + instr + ' </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>(คลิกขวา → อัปเดตฟิลด์)</w:t></w:r>'
            '<w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>\n```')


def div(style, text):
    return f'::: {{custom-style="{style}"}}\n{text}\n:::'


def load_numbers():
    return json.load(open(os.path.join(BOOK, "numbers.json"), encoding="utf-8"))


def resolve(text, nums, fname):
    def rep(m):
        k = m.group(1)
        if k not in nums: raise SystemExit(f"{fname}: ไม่มีค่า {{{{{k}}}}} ใน book/numbers.json (รัน python scripts/book_numbers.py)")
        return str(nums[k])
    return re.sub(r"\{\{([a-zA-Z0-9_]+)\}\}", rep, text)


def convert_block(block):
    b = block.strip()
    if not b or b.startswith("<!--"): return None
    if b.startswith("# "):
        title = b[2:].strip()
        return PAGEBREAK + "\n\n# " + title
    if b.startswith("## ภาคผนวก"): return PAGEBREAK + "\n\n" + b
    if b.startswith("#"): return b
    if b.startswith("$$"):
        m = re.match(r"\$\$\s*(.*?)\s*\\tag\{([^}]*)\}\s*\$\$", b, re.S)
        if m: return f"$$ {m.group(1)} \\qquad \\text{{({m.group(2)})}} $$"
        return b
    if b.startswith("**ตารางที่") or b.startswith("**ตาราง "):
        return div("ชื่อตาราง", b.strip("*"))
    if b.startswith("!["):
        m = re.match(r"!\[[^\]]*\]\(([^)]+)\)", b)
        return f"![]({os.path.join(BOOK, m.group(1))}){{width=15.5cm}}"
    if b.startswith("*รูปที่"):
        return div("ชื่อรูป", b.strip("*"))
    if b.startswith("|"):
        rows = [r for r in b.split("\n") if r.strip()]
        return "\n".join(rows)
    if b.startswith("["):  # เอกสารอ้างอิง
        return div("เอกสารอ้างอิง", b)
    return div("เนื้อหาทั่วไป", zwsp(b))


def front_matter():
    t = open(os.path.join(BOOK, "00_front.md"), encoding="utf-8").read()
    _, y, body = t.split("---", 2)
    meta = dict(re.findall(r'^(\w+):\s*"(.*)"\s*$', y, re.M))
    cov = []
    for s, txt in [("ปก", meta["title_th"]), ("ปก", meta["title_en"]), ("ปกเล็ก", "โดย"), ("ปก", meta["author_th"]), ("ปก", meta["author_en"]),
                   ("ปกเล็ก", "รหัสนักศึกษา " + meta["student_id"]), ("ปกเล็ก", "อาจารย์ที่ปรึกษา"), ("ปก", meta["advisor_th"]),
                   ("ปกเล็ก", "รายงานนี้เป็นส่วนหนึ่งของ" + meta["course_th"]), ("ปกเล็ก", meta["program_th"]), ("ปกเล็ก", meta["major_th"]),
                   ("ปกเล็ก", meta["faculty_th"]), ("ปกเล็ก", meta["institute_th"]), ("ปกเล็ก", meta["term_th"])]:
        cov.append(div(s, txt))
    parts = ["\n\n".join(cov)]
    for sec in re.split(r"^# ", body.strip(), flags=re.M):
        if not sec.strip(): continue
        head, _, rest = sec.partition("\n")
        blocks = [div("หัวเรื่องหน้าต้น", head.strip())]
        for p in re.split(r"\n\s*\n", rest.strip()):
            blocks.append(div("เนื้อหาทั่วไป", zwsp(p.strip())))
        parts.append(PAGEBREAK + "\n\n" + "\n\n".join(blocks))
    parts.append(PAGEBREAK + "\n\n" + div("หัวเรื่องหน้าต้น", "สารบัญ") + "\n\n" + field('TOC \\o "1-3" \\h \\z \\u'))
    parts.append(PAGEBREAK + "\n\n" + div("หัวเรื่องหน้าต้น", "สารบัญตาราง") + "\n\n" + field('TOC \\h \\z \\t "ชื่อตาราง,1"'))
    parts.append(PAGEBREAK + "\n\n" + div("หัวเรื่องหน้าต้น", "สารบัญรูป") + "\n\n" + field('TOC \\h \\z \\t "ชื่อรูป,1"'))
    return "\n\n".join(parts), meta


def reference_docx(path):
    import docx
    from docx.shared import Pt, Cm
    from docx.enum.style import WD_STYLE_TYPE
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement
    subprocess.run(["pandoc", "-o", path, "--print-default-data-file", "reference.docx"], check=True, stdout=open(path, "wb"))
    d = docx.Document(path)

    def font(st, size, bold=False):
        st.font.name = FONT; st.font.size = Pt(size); st.font.bold = bold
        rpr = st.element.get_or_add_rPr()
        rf = rpr.find(qn("w:rFonts"))
        rf = rf if rf is not None else OxmlElement("w:rFonts")
        for a in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"): rf.set(qn(a), FONT)
        rpr.append(rf)
        lang = OxmlElement("w:lang"); lang.set(qn("w:val"), "en-US"); lang.set(qn("w:bidi"), "th-TH"); rpr.append(lang)
        szcs = OxmlElement("w:szCs"); szcs.set(qn("w:val"), str(size * 2)); rpr.append(szcs)
        if bold: rpr.append(OxmlElement("w:bCs"))
        st.paragraph_format.space_after = Pt(0); st.paragraph_format.space_before = Pt(0); st.paragraph_format.line_spacing = 1.0

    def pstyle(name, size, bold=False, align=None, indent=None, before=0):
        st = next((x for x in d.styles if x.name == name), None) or d.styles.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
        font(st, size, bold)
        if align is not None: st.paragraph_format.alignment = align
        if indent is not None: st.paragraph_format.first_line_indent = indent
        st.paragraph_format.space_before = Pt(before)
        return st

    for n in ["Normal", "Body Text", "First Paragraph", "Compact"]: pstyle(n, 16)
    h1 = pstyle("Heading 1", 20, True, WD_ALIGN_PARAGRAPH.CENTER); h1.paragraph_format.space_after = Pt(18)
    pstyle("Heading 2", 18, True, WD_ALIGN_PARAGRAPH.LEFT, before=12)
    pstyle("Heading 3", 16, True, WD_ALIGN_PARAGRAPH.LEFT, before=6)
    for h in ["Heading 1", "Heading 2", "Heading 3"]:
        next(x for x in d.styles if x.name == h).font.color.rgb = None
    body = pstyle("เนื้อหาทั่วไป", 16, False, WD_ALIGN_PARAGRAPH.JUSTIFY, Cm(1.65))
    jc = OxmlElement("w:jc"); jc.set(qn("w:val"), "thaiDistribute"); body.element.get_or_add_pPr().append(jc)
    pstyle("ชื่อตาราง", 16, True, WD_ALIGN_PARAGRAPH.LEFT, before=6)
    pstyle("ชื่อรูป", 16, True, WD_ALIGN_PARAGRAPH.CENTER)
    pstyle("หัวเรื่องหน้าต้น", 20, True, WD_ALIGN_PARAGRAPH.CENTER).paragraph_format.space_after = Pt(12)
    pstyle("ปก", 20, True, WD_ALIGN_PARAGRAPH.CENTER).paragraph_format.space_after = Pt(6)
    pstyle("ปกเล็ก", 16, True, WD_ALIGN_PARAGRAPH.CENTER)
    ref = pstyle("เอกสารอ้างอิง", 16, False, WD_ALIGN_PARAGRAPH.LEFT)
    ref.paragraph_format.left_indent = Cm(1.0); ref.paragraph_format.first_line_indent = Cm(-1.0)
    for n, sz in [("Table", 14), ("Compact", 14), ("TOC Heading", 16), ("toc 1", 16), ("toc 2", 16), ("toc 3", 16)]:
        st = next((x for x in d.styles if x.name == n), None)
        if st is not None and st.type == WD_STYLE_TYPE.PARAGRAPH: font(st, sz)
    s = d.sections[0]
    s.page_width, s.page_height = Cm(21.0), Cm(29.7)
    s.left_margin, s.right_margin, s.top_margin, s.bottom_margin = Cm(3.81), Cm(2.54), Cm(2.54), Cm(2.54)
    d.save(path)


def postprocess(path):
    import docx
    from docx.shared import Pt, Cm
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    d = docx.Document(path)
    for s in d.sections:
        s.page_width, s.page_height = Cm(21.0), Cm(29.7)
        s.left_margin, s.right_margin, s.top_margin, s.bottom_margin = Cm(3.81), Cm(2.54), Cm(2.54), Cm(2.54)
        p = s.header.paragraphs[0] if s.header.paragraphs else s.header.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r = p.add_run()
        for typ, txt in (("begin", None), (None, " PAGE "), ("end", None)):
            if typ:
                fc = OxmlElement("w:fldChar"); fc.set(qn("w:fldCharType"), typ); r._r.append(fc)
            else:
                it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = txt; r._r.append(it)
        r.font.name = FONT; r.font.size = Pt(16)
    # ตารางทุกตาราง: เส้นขอบ + ฟอนต์ 14
    for t in d.tables:
        tblPr = t._tbl.tblPr
        b = OxmlElement("w:tblBorders")
        for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
            e = OxmlElement(f"w:{side}"); e.set(qn("w:val"), "single"); e.set(qn("w:sz"), "4"); e.set(qn("w:color"), "000000"); b.append(e)
        tblPr.append(b)
        w = tblPr.find(qn("w:tblW"))
        if w is None: w = OxmlElement("w:tblW"); tblPr.append(w)
        w.set(qn("w:type"), "pct"); w.set(qn("w:w"), "5000")
        for row in t.rows:
            for c in row.cells:
                for p in c.paragraphs:
                    for r in p.runs: r.font.size = Pt(14); r.font.name = FONT
    st = d.settings.element
    uf = OxmlElement("w:updateFields"); uf.set(qn("w:val"), "true"); st.append(uf)
    d.core_properties.title = "IS 68076026"
    d.core_properties.author = "Danusorn Anantakan"
    d.save(path)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--check", action="store_true"); a = ap.parse_args()
    nums = load_numbers()
    front, meta = front_matter()
    body = []
    for f in PARTS:
        t = resolve(open(os.path.join(BOOK, f), encoding="utf-8").read(), nums, f)
        for blk in re.split(r"\n\s*\n", t):
            c = convert_block(blk)
            if c: body.append(c)
    md = front + "\n\n" + "\n\n".join(body) + "\n"
    imgs = re.findall(r"!\[\]\(([^)]+)\)", md)
    missing = [i for i in imgs if not os.path.exists(i)]
    eqs = len(re.findall(r"^\$\$", md, re.M))
    if missing: raise SystemExit(f"ภาพหาย: {missing}")
    ntab = md.count('custom-style="ชื่อตาราง"')
    print(f"ตรวจ: ภาพ {len(imgs)} · สมการ {eqs} · ชื่อตาราง {ntab} · ไม่มี placeholder ค้าง")
    if a.check: return
    os.makedirs(OUT, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        ref = os.path.join(tmp, "reference.docx"); reference_docx(ref)
        src = os.path.join(tmp, "book.md"); open(src, "w", encoding="utf-8").write(md)
        out = os.path.join(OUT, f"IS_68076026_{datetime.date.today().strftime('%d%b%y').upper()}.docx")
        subprocess.run(["pandoc", src, "-f", "markdown+pipe_tables+tex_math_dollars+fenced_divs+raw_attribute", "-t", "docx",
                        "--reference-doc", ref, "-o", out], check=True)
        postprocess(out)
    shutil.copy(out, os.path.join(OUT, "IS_68076026_latest.docx"))
    print("เขียน", os.path.relpath(out, ROOT))


if __name__ == "__main__":
    main()
