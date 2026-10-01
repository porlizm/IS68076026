# -*- coding: utf-8 -*-
"""
check_docx_format.py — ตรวจเล่ม .docx ตาม Prompt_Report หัวข้อ 9 และ 10 ข้อ ก ข ค (ไม่แก้ไฟล์)

  python scripts/check_docx_format.py                 -> ตรวจไฟล์ใน build/build_info.json · เขียน evidence/format_check.json
  python scripts/check_docx_format.py build/<ไฟล์>.docx

คืนค่า 0 เมื่อผ่านทุกข้อที่บังคับ · ข้อที่เป็นคำเตือนแสดงแต่ไม่ทำให้ล้ม
"""
import collections, json, os, re, sys, zipfile
from lxml import etree

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
M = "http://schemas.openxmlformats.org/officeDocument/2006/math"
WP = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
q = lambda t: "{%s}%s" % (W, t)
FONT = "TH Sarabun New"
TEXT_W = 8306  # twips = 14.65 ซม.
EMU_CM = 360000
BANNED = {"เรซูเม่": "เรซูเม่", "เวิร์กโฟลว์": "เวิร์กโฟลว์", "การจับคู่": "การจับคู่", "เอไอ": "เอไอ", "ข้อมูลหลอน": "ข้อมูลหลอน",
          "คลังหลักสูตร": "คลังหลักสูตร", "เขตข้อมูล": "เขตข้อมูล", "ทักษะเป้าหมาย": "ทักษะเป้าหมาย", "ในยุคปัจจุบัน": "ในยุคปัจจุบัน",
          "ไม่เพียงแต่": "ไม่เพียงแต่", "อันจะนำไปสู่": "อันจะนำไปสู่", "ยกระดับ": "ยกระดับ", "อย่างมีประสิทธิภาพ": "อย่างมีประสิทธิภาพ",
          "อย่างมีนัยสำคัญ": "อย่างมีนัยสำคัญ", "บทบาทสำคัญอย่างยิ่ง": "บทบาทสำคัญอย่างยิ่ง", "em dash": "—",
          "ข้อกำหนด (ไม่มีอ้างอิง)": r"ข้อกำหนด(?!อ้างอิง)", "AI เดี่ยว": r"(?<!Generative )(?<!generative )(?<!Document )(?<!/ )(?<![A-Za-z/-])AI(?![A-Za-z])"}
CLICHE = ["ทั้งนี้", "กล่าวคือ", "นอกจากนี้", "อย่างไรก็ตาม"]
PLAN_PAST = [r"ผู้เข้าร่วม[^。\n]{0,30}(ได้ทำ|ได้ตอบ|ตอบแล้ว|ประเมินแล้ว)", r"ผลการประเมินพบว่า", r"ผู้เข้าร่วมทั้ง \d+ คน(ได้|ให้)"]


def text_of(el):
    return "".join(t.text or "" for t in el.iter(q("t"))).replace("​", "")


def style_of(p, sid2name):
    ps = p.find(q("pPr") + "/" + q("pStyle"))
    return sid2name.get(ps.get(q("val")), ps.get(q("val"))) if ps is not None else "Normal"


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else json.load(open(os.path.join(ROOT, "build", "build_info.json"), encoding="utf-8"))["file"]
    path = src if os.path.isabs(src) else os.path.join(ROOT, src)
    z = zipfile.ZipFile(path)
    doc = etree.fromstring(z.read("word/document.xml"))
    styles = etree.fromstring(z.read("word/styles.xml"))
    settings = etree.fromstring(z.read("word/settings.xml"))
    fonttable = z.read("word/fontTable.xml").decode("utf-8")
    sid2name = {s.get(q("styleId")): s.find(q("name")).get(q("val")) for s in styles.iter(q("style")) if s.find(q("name")) is not None}
    name2s = {v: k for k, v in sid2name.items()}
    R = collections.OrderedDict()  # ชื่อข้อ -> (ผ่าน, รายละเอียด, บังคับ)

    def res(k, ok, detail, must=True): R[k] = dict(ok=bool(ok), detail=detail, must=must)

    body = doc.find(q("body"))
    # ---------- ค: ฟอนต์ ----------
    fonts = collections.Counter()
    for rf in doc.iter(q("rFonts")):
        inmath = any(a.tag.startswith("{%s}" % M) for a in rf.iterancestors())
        for a in ("ascii", "hAnsi", "cs", "eastAsia"):
            v = rf.get(q(a))
            if v: fonts[(v, "math" if inmath else "text")] += 1
        for a in rf.attrib:
            if a.endswith("Theme}") or "Theme" in a: fonts[("theme:" + rf.get(a), "text")] += 1
    bad = {k: v for k, v in fonts.items() if not (k[0] == FONT or (k[0] == "Cambria Math" and k[1] == "math"))}
    res("ฟอนต์ใน document.xml มีเฉพาะ TH Sarabun New และ Cambria Math ในสมการ", not bad, f"พบ {dict((f'{a}/{b}', c) for (a, b), c in fonts.items())}")
    sty_bad = []
    for s in styles.iter(q("rFonts")):
        for a, v in s.attrib.items():
            if ("Theme" in a) or (v not in (FONT, "Cambria Math")): sty_bad.append(f"{a.split('}')[1]}={v}")
    res("ฟอนต์ใน styles.xml เป็น TH Sarabun New", not sty_bad, f"ค่าที่ไม่ตรง {collections.Counter(sty_bad).most_common(5)}")
    nsz = mism = 0
    for rpr in doc.iter(q("rPr")):
        sz, szcs = rpr.find(q("sz")), rpr.find(q("szCs"))
        if sz is not None or szcs is not None:
            nsz += 1
            if sz is None or szcs is None or sz.get(q("val")) != szcs.get(q("val")): mism += 1
    res("sz = szCs ทุก run ที่กำหนดขนาด", mism == 0, f"{nsz} run · ไม่ตรง {mism}")
    lang_ok = any(l.get(q("bidi")) == "th-TH" for l in styles.iter(q("lang")))
    res("ภาษา bidi = th-TH ในสไตล์", lang_ok, "w:lang w:bidi=th-TH")
    emb = settings.find(q("embedTrueTypeFonts")) is not None
    nfont = len([n for n in z.namelist() if n.startswith("word/fonts/")])
    res("ฝังฟอนต์ TH Sarabun New 4 แบบ", emb and nfont == 4 and all(f"w:{t}" in fonttable for t in ("embedRegular", "embedBold", "embedItalic", "embedBoldItalic")),
        f"embedTrueTypeFonts={emb} · ไฟล์ฟอนต์ {nfont}")
    uf = settings.find(q("updateFields"))
    res("ตั้ง updateFields", uf is not None and uf.get(q("val")) == "true", "settings.xml")

    # ---------- ค: หน้า ----------
    sects = list(body.iter(q("sectPr")))
    pg_bad = []
    fmts = []
    for s in sects:
        sz, mar = s.find(q("pgSz")), s.find(q("pgMar"))
        if sz is None or mar is None or (int(sz.get(q("w"))), int(sz.get(q("h")))) != (11906, 16838): pg_bad.append("pgSz")
        elif [int(mar.get(q(k))) for k in ("top", "bottom", "left", "right")] != [1440, 1440, 2160, 1440]: pg_bad.append("pgMar")
        pn = s.find(q("pgNumType")); fmts.append(pn.get(q("fmt")) if pn is not None else None)
    res("A4 · ขอบ 2.54/2.54/3.81/2.54 ซม. ทุก section", not pg_bad, f"{len(sects)} section · ผิด {pg_bad}")
    res("เลขหน้า: ปกไม่มี · ส่วนหน้า ก ข ค · เนื้อหาเลขอารบิก", fmts[0] is None and fmts[1] == "thaiLetters" and all(f == "decimal" for f in fmts[2:]),
        f"รูปแบบต่อ section {fmts}")
    title_pg = sum(1 for s in sects[2:] if s.find(q("titlePg")) is not None)
    res("ไม่แสดงเลขหน้าในหน้าแรกของบท", title_pg == len(sects) - 2, f"{title_pg}/{len(sects) - 2} section ของเนื้อหาตั้ง titlePg")

    # ---------- ค: สไตล์ ----------
    def sty(name):
        s = styles.find(f".//{q('style')}[@{q('styleId')}='{name2s.get(name, name)}']")
        if s is None: return {}
        rpr, ppr = s.find(q("rPr")), s.find(q("pPr"))
        g = lambda e, t, a="val": (e.find(q(t)).get(q(a)) if e is not None and e.find(q(t)) is not None else None)
        return dict(sz=g(rpr, "sz"), b=rpr is not None and rpr.find(q("b")) is not None, jc=g(ppr, "jc"),
                    ind=(ppr.find(q("ind")).get(q("firstLine")) if ppr is not None and ppr.find(q("ind")) is not None else None),
                    keep=ppr is not None and ppr.find(q("keepNext")) is not None)
    spec = {"Heading 1": dict(sz="40", b=True, jc="center"), "Heading 2": dict(sz="36", b=True, jc="left", keep=True),
            "Heading 3": dict(sz="32", b=True, jc="left", keep=True), "เนื้อหาทั่วไป": dict(sz="32", jc="thaiDistribute", ind="936"),
            "ชื่อตาราง": dict(sz="32", jc="left", keep=True), "ชื่อรูป": dict(sz="32", jc="center"), "ที่มา": dict(sz="28")}
    sbad = []
    for n, exp in spec.items():
        got = sty(n)
        for k, v in exp.items():
            if k == "ind" and got.get(k) and abs(int(got[k]) - int(v)) <= 2: continue  # 1.65 ซม. = 935.4 twips
            if got.get(k) != v: sbad.append(f"{n}.{k}={got.get(k)} (ต้อง {v})")
    res("สไตล์หัวข้อ เนื้อความ ชื่อตาราง ชื่อรูป ตามสเปก", not sbad, "; ".join(sbad) or "20/18/16 pt หนา · เนื้อความ 16 pt ย่อหน้า 1.65 ซม. กระจายแบบไทย")

    # ---------- ค: ตาราง รูป สมการ ----------
    paras = list(body.iter(q("p")))
    tables = [t for t in body.iter(q("tbl"))]
    eq_t = [t for t in tables if (t.find(q("tblPr") + "/" + q("tblCaption")) is not None and t.find(q("tblPr") + "/" + q("tblCaption")).get(q("val")) == "equation")]
    ct = [t for t in tables if t not in eq_t]
    wide, nohdr, nocap, small = [], [], [], []
    first_h1 = next((p for p in body.iter(q("p")) if style_of(p, sid2name) == "Heading 1"), None)
    front_tbl = set(id(t) for t in ct if first_h1 is not None and t in first_h1.itersiblings(preceding=True))
    for i, t in enumerate(ct):
        g = sum(int(c.get(q("w"))) for c in t.find(q("tblGrid")).findall(q("gridCol")))
        if g > TEXT_W + 5: wide.append(i)
        tr0 = t.find(q("tr"))
        if tr0.find(q("trPr") + "/" + q("tblHeader")) is None: nohdr.append(i)
        prev = t.getprevious()
        cap = text_of(prev) if prev is not None and prev.tag == q("p") else ""
        if not cap.startswith("ตารางที่") and id(t) not in front_tbl: nocap.append(i)  # ตารางคำย่อในส่วนหน้าไม่มีเลขตาราง
        for r in t.iter(q("r")):
            s = r.find(q("rPr") + "/" + q("sz"))
            if r.find(q("t")) is not None and (s is None or s.get(q("val")) != "28"): small.append(i); break
    res("ตารางกว้างไม่เกิน 14.65 ซม.", not wide, f"{len(ct)} ตาราง · เกิน {wide}")
    res("หัวตารางซ้ำทุกหน้า", not nohdr, f"ไม่มี tblHeader {nohdr}")
    res("ทุกตารางมีชื่อตารางอยู่เหนือ", not nocap, f"ไม่มีชื่อ {nocap}")
    res("ข้อความในตาราง 14 pt", not small, f"ตารางที่มี run ไม่ใช่ 14 pt {small}")
    caps_t = [text_of(p) for p in paras if style_of(p, sid2name) == "ชื่อตาราง"]
    caps_f = [text_of(p) for p in paras if style_of(p, sid2name) == "ชื่อรูป"]
    def seq_ok(caps, word):
        nums = [re.match(word + r" ([0-9ก-ฮ]+)\.(\d+)", c) for c in caps]
        if not all(nums): return False, "รูปแบบชื่อไม่ตรง"
        seen, last = set(), {}
        for m in nums:
            k = (m.group(1), int(m.group(2)))
            if k in seen: return False, f"ซ้ำ {k}"
            seen.add(k)
            if m.group(1) in last and k[1] != last[m.group(1)] + 1: return False, f"ข้ามเลข {k}"
            last[m.group(1)] = k[1]
        return True, f"{len(caps)} รายการ"
    ok, d = seq_ok(caps_t, "ตารางที่"); res("เลขตารางต่อเนื่องไม่ซ้ำ", ok, d)
    ok, d = seq_ok(caps_f, "รูปที่"); res("เลขรูปต่อเนื่องไม่ซ้ำ", ok, d)
    bold_lbl = all(p.find(q("r") + "/" + q("rPr") + "/" + q("b")) is not None for p in paras if style_of(p, sid2name) in ("ชื่อตาราง", "ชื่อรูป"))
    res("คำว่า ตารางที่/รูปที่ ตัวหนาตามด้วยชื่อ", bold_lbl, "label หนา + NBSP 2 ตัว")
    pics = list(body.iter("{%s}inline" % WP)) + list(body.iter("{%s}anchor" % WP))
    pw = [round(int(p.find("{%s}extent" % WP).get("cx")) / EMU_CM, 2) for p in pics]
    alts = [p.find("{%s}docPr" % WP).get("descr", "") for p in pics]
    res("รูปกว้างไม่เกิน 14.65 ซม. และมี alt text", all(w <= 14.66 for w in pw) and all(alts), f"{len(pics)} รูป · กว้างสุด {max(pw) if pw else 0} ซม. · alt ว่าง {sum(not a for a in alts)}")
    nxt_cap = 0
    for p in paras:
        if p.find(".//{%s}inline" % WP) is not None and p.getparent().tag == q("body"):
            n = p.getnext()
            if n is not None and style_of(n, sid2name) == "ชื่อรูป": nxt_cap += 1
    res("ชื่อรูปอยู่ใต้รูป", nxt_cap == len(pics), f"{nxt_cap}/{len(pics)}")
    eqn = [text_of(t.findall(".//" + q("tc"))[2]) for t in eq_t]
    eq_ok = all(re.fullmatch(r"\(\d+\.\d+\)", e) for e in eqn) and len(set(eqn)) == len(eqn)
    omml = all(t.findall(".//" + q("tc"))[1].find(".//{%s}oMath" % M) is not None for t in eq_t)
    res("สมการเป็น OMML กึ่งกลาง เลขชิดขวา ไม่ซ้ำ", eq_ok and omml, f"{len(eq_t)} สมการ · {', '.join(eqn)}")
    after_eq = 0
    for t in eq_t:
        n = t.getnext()
        if n is not None and text_of(n).startswith("โดยที่"): after_eq += 1
    res("สมการตามด้วยย่อหน้า โดยที่", after_eq == len(eq_t), f"{after_eq}/{len(eq_t)}", must=False)
    toc = [i.text for i in body.iter(q("instrText")) if i.text and "TOC" in i.text]
    res("สารบัญ สารบัญตาราง สารบัญรูป เป็นฟิลด์", len(toc) == 3, f"{len(toc)} ฟิลด์")
    chap = [p for p in paras if style_of(p, sid2name) == "Heading 1"]
    chap_br = [p for p in chap if text_of(p).startswith("บทที่")]
    res("ชื่อบท: บทที่ N และชื่อบทคนละบรรทัด", chap_br and all(p.find(".//" + q("br")) is not None for p in chap_br), f"{len(chap_br)} บท")
    res("เอกสารอ้างอิงและภาคผนวกเป็น Heading 1", {"เอกสารอ้างอิง", "ภาคผนวก"} <= {text_of(p) for p in chap}, "Heading 1")

    # ---------- ข: ภาษา (ย่อหน้าเนื้อความทั้งเล่ม) ----------
    body_p = [p for p in paras if style_of(p, sid2name) in ("เนื้อหาทั่วไป",)]
    texts = [text_of(p) for p in body_p]
    long_p = [(len(t), t[:50]) for t in texts if len(t) > 700]
    res("ไม่มีย่อหน้าเกิน 700 อักขระ", not long_p, f"เกิน {len(long_p)} ย่อหน้า {long_p[:3]}")
    allt = "\n".join(text_of(p) for p in paras)
    hits = {}
    for k, pat in BANNED.items():
        n = len(re.findall(pat, allt))
        if n: hits[k] = n
    res("คำศัพท์ตามตาราง 8.4 และไม่มีสำนวนต้องห้าม", not hits, f"พบ {hits}" if hits else "ไม่พบ")
    pages = None
    try:
        info = json.load(open(os.path.join(ROOT, "build", "build_info.json"), encoding="utf-8")); pages = info.get("pdf_pages")
    except Exception: pass
    cl = {c: allt.count(c) for c in CLICHE}
    res("ทั้งนี้/กล่าวคือ/นอกจากนี้/อย่างไรก็ตาม ไม่เกินหนึ่งครั้งต่อหน้า", sum(cl.values()) <= (pages or 60) / 2, f"{cl} · หน้า PDF {pages}")
    past = [m.group(0) for p in PLAN_PAST for m in re.finditer(p, allt)]
    res("ไม่มีประโยคเขียนผลผู้เข้าร่วมเหมือนทำเสร็จแล้ว (คัดกรองด้วยรูปแบบ)", not past, f"{past[:5]}")
    thai_long = [t for p, t in zip(body_p, texts) if len(re.findall(r"[฀-๿]", t)) > 120]
    zw = sum(1 for p in body_p if len(re.findall(r"[฀-๿]", text_of(p))) > 120 and "​" in "".join(x.text or "" for x in p.iter(q("t"))))
    res("ZWSP อยู่ในทุกย่อหน้าไทยที่ยาวเกินหนึ่งบรรทัด", zw == len(thai_long), f"{zw}/{len(thai_long)} ย่อหน้า")
    res("ไม่มี {{key}} หรือ [@key] ค้าง", not re.search(r"\{\{|\[@", allt), "ค้นทั้งเอกสาร")
    res("ชื่อรุ่นคลังสะกดตรง", "CORPUS_IS68076026-v1.5-01OCT26" in allt and not re.search(r"CORPUS_IS68076026-v1\.5(?!-01OCT26)", allt), "CORPUS_IS68076026-v1.5-01OCT26")
    res("ไม่กล่าวถึง WF_Demo", "WF_Demo" not in allt and "WF Demo" not in allt, "ค้นทั้งเอกสาร")
    # บทคัดย่อ ≤ 300 คำ
    try:
        from pythainlp.tokenize import word_tokenize
        i0 = next(i for i, p in enumerate(paras) if text_of(p) == "บทคัดย่อ")
        i1 = next(i for i, p in enumerate(paras) if text_of(p) == "ABSTRACT")
        ab = " ".join(text_of(p) for p in paras[i0 + 1:i1] if not text_of(p).startswith("คำสำคัญ"))
        words = [w for w in word_tokenize(ab, engine="newmm", keep_whitespace=False) if re.search(r"[฀-๿A-Za-z0-9]", w)]
        j1 = next(i for i, p in enumerate(paras) if text_of(p) == "กิตติกรรมประกาศ")
        en = " ".join(text_of(p) for p in paras[i1 + 1:j1] if not text_of(p).startswith("Keywords"))
        res("บทคัดย่อไม่เกิน 300 คำ", len(words) <= 300, f"ไทย {len(words)} คำ · อังกฤษ {len(en.split())} คำ")
    except StopIteration:
        res("บทคัดย่อไม่เกิน 300 คำ", False, "หาหัวข้อบทคัดย่อไม่พบ")

    out = os.path.join(ROOT, "evidence", "format_check.json")
    json.dump(dict(file=os.path.relpath(path, ROOT), results=R), open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    fail = [k for k, v in R.items() if not v["ok"] and v["must"]]
    for k, v in R.items(): print(("ผ่าน " if v["ok"] else ("ไม่ผ่าน" if v["must"] else "เตือน ")), k, "·", v["detail"])
    print(f"\nสรุป {sum(v['ok'] for v in R.values())}/{len(R)} ผ่าน · ไม่ผ่าน (บังคับ) {len(fail)}")
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()
