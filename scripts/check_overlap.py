# -*- coding: utf-8 -*-
"""
check_overlap.py — ตรวจความซ้ำของเล่มใหม่กับเล่มเดิม (Prompt_Report หัวข้อ 10 ข้อ ง)

  python scripts/check_overlap.py                   -> evidence/overlap_check.json + รายงานบนจอ
  python scripts/check_overlap.py --min 40          -> ความยาวขั้นต่ำของข้อความที่ตรงกัน (อักขระ ไม่นับช่องว่าง)

เทียบข้อความเล่มใหม่ (docx ล่าสุดใน build/build_info.json) กับ
  (1) book/baseline_21SEP26/*.md  (2) docs/baseline/IS_68076026_ExamSubmission_21SEP26.pdf (pdftotext)
  (3) archive/01OCT26/book_draft_v0/*.md (ร่างเดิม ใช้เป็นข้อมูลประกอบ ไม่นับในเกณฑ์)
วิธี: ตัดช่องว่าง ZWSP และเครื่องหมาย markdown แล้วหาช่วงข้อความที่ตรงกันยาว ≥ 40 อักขระ ซึ่งมีอักษรไทยอย่างน้อยร้อยละ 70
ไม่นับ: รายการอ้างอิง · สมการ · หัวตาราง · ชื่อเรื่องงานวิจัย ชื่อหลักสูตร ชื่อสถาบัน ชื่อกฎหมาย (EXEMPT)
ข้อยกเว้นที่รายงานแยก (ไม่นับในเกณฑ์ แต่บันทึกใน evidence/overlap_check.json พร้อมเหตุผล)
  formal     ข้อความคำถามการวิจัยและวัตถุประสงค์ (ถ้อยคำทางการตามข้อเสนอโครงการ)
  instrument ข้อคำถามของแบบประเมินในตารางที่ ช.1 (เครื่องมือวิจัย คงถ้อยคำจนผ่าน IOC)
  data       ข้อความจากไฟล์ข้อมูลโดยตรง เช่น ชื่ออาชีพและเหตุผลการเทียบรหัสใน data/roles.json
"""
import argparse, glob, json, os, re, subprocess, sys, unicodedata, zipfile
from lxml import etree

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
q = lambda t: "{%s}%s" % (W, t)
TITLE = "กรอบการทำงานปัญญาประดิษฐ์เชิงสร้างสรรค์แบบหลายโมเดลเพื่อลดความคลาดเคลื่อนของข้อมูลในการวิเคราะห์ช่องว่างทักษะจากเรซูเมและการกำหนดเส้นทางการเรียนรู้เฉพาะบุคคล"
DATA_TXT = []
EXEMPT = [TITLE, "หลักสูตรวิทยาศาสตรมหาบัณฑิตสาขาวิชาเทคโนโลยีสารสนเทศ", "สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง",
          "แขนงวิชาการจัดการเทคโนโลยีสารสนเทศ", "พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคลพ.ศ.2562"]


def norm(s):
    s = unicodedata.normalize("NFC", s)
    s = s.replace("ํา", "ำ")  # นิคหิต + สระอา จาก PDF → สระอำ
    return re.sub(r"[\s​ *_`#|>\-]+", "", s)


def new_text(path):
    z = zipfile.ZipFile(path); doc = etree.fromstring(z.read("word/document.xml"))
    st = etree.fromstring(z.read("word/styles.xml"))
    sid = {s.get(q("styleId")): s.find(q("name")).get(q("val")) for s in st.iter(q("style")) if s.find(q("name")) is not None}
    roles = json.load(open(os.path.join(ROOT, "data", "roles.json"), encoding="utf-8"))["roles"]
    global DATA_TXT
    data_txt = DATA_TXT[:] = [norm(r.get(k) or "") for r in roles for k in ("role_name_th", "mapping_rationale_th") if r.get(k)]
    out = []
    for p in doc.iter(q("p")):
        ps = p.find(q("pPr") + "/" + q("pStyle")); name = sid.get(ps.get(q("val")), "") if ps is not None else ""
        if name in ("เอกสารอ้างอิง", "สมการ", "เลขสมการ"): continue
        tr = next(p.iterancestors(q("tr")), None)
        if tr is not None and tr.getparent().find(q("tr")) is tr: continue  # หัวตาราง
        t = "".join(x.text or "" for x in p.iter(q("t")))
        if not t.strip(): continue
        ctx = None; nt = norm(t)
        if re.match(r"(คำถามที่[12]|[12]\.เพื่อ)", nt): ctx = "formal"
        tbl = next(p.iterancestors(q("tbl")), None)
        if tbl is not None:
            cap = tbl.getprevious()
            ct = norm("".join(x.text or "" for x in cap.iter(q("t")))) if cap is not None else ""
            if ct.startswith("ตารางที่ช.1"): ctx = "instrument"
        if any(nt and (nt in d or d in nt) for d in data_txt if len(d) >= 10): ctx = "data"
        out.append((t, ctx))
    return out


def baseline_texts():
    src = {}
    for f in sorted(glob.glob(os.path.join(ROOT, "book", "baseline_21SEP26", "*.md"))):
        src[os.path.relpath(f, ROOT)] = open(f, encoding="utf-8").read()
    pdf = os.path.join(ROOT, "docs", "baseline", "IS_68076026_ExamSubmission_21SEP26.pdf")
    if os.path.exists(pdf):
        src[os.path.relpath(pdf, ROOT)] = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True).stdout
    for f in sorted(glob.glob(os.path.join(ROOT, "archive", "01OCT26", "book_draft_v0", "*.md"))):
        src[os.path.relpath(f, ROOT)] = open(f, encoding="utf-8").read()
    return src


def matches(new_paras, base, n):
    """คืนช่วงที่ตรงกันยาว ≥ n ของแต่ละย่อหน้า (ขยายจาก shingle ยาว n)"""
    shingles = set(base[i:i + n] for i in range(0, max(0, len(base) - n + 1)))
    ex = [norm(e) for e in EXEMPT]
    found = []
    for para, ctx in new_paras:
        t = norm(para); i = 0
        while i + n <= len(t):
            if t[i:i + n] in shingles:
                j = i + n
                while j < len(t) and t[i:j + 1] in base: j += 1
                span = t[i:j]
                thai = len(re.findall(r"[฀-๿]", span))
                exempt = any(span in e or (e in span and len(span) - len(e) < n) for e in ex)
                if ctx is None and any(span in dt for dt in DATA_TXT): ctx = "data"
                if thai / len(span) >= 0.7 and not exempt:
                    found.append(dict(length=len(span), text=span, exempt=ctx, paragraph=para.replace("​", "")[:120]))
                i = j
            else:
                i += 1
    return found


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--min", type=int, default=40); ap.add_argument("file", nargs="?"); a = ap.parse_args()
    f = a.file or json.load(open(os.path.join(ROOT, "build", "build_info.json"), encoding="utf-8"))["file"]
    paras = new_text(f if os.path.isabs(f) else os.path.join(ROOT, f))
    res = {}
    for name, txt in baseline_texts().items():
        res[name] = matches(paras, norm(txt), a.min)
    must = {k: [m for m in v if not m["exempt"]] for k, v in res.items() if "book_draft_v0" not in k}
    total = sum(len(v) for v in must.values())
    exempt = sorted({(m["exempt"], m["text"]) for k, v in res.items() if "book_draft_v0" not in k for m in v if m["exempt"]})
    out = dict(min_chars=a.min, new_paragraphs=len(paras), matches_required_sources=total,
               per_source={k: len(v) for k, v in must.items()}, draft_v0_info={k: len(v) for k, v in res.items() if "book_draft_v0" in k},
               exempt=[dict(reason=a, text=b) for a, b in exempt], details=res)
    json.dump(out, open(os.path.join(ROOT, "evidence", "overlap_check.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for k, v in must.items():
        print(f"{k}: {len(v)} จุด")
        for m in v[:10]: print(f"   [{m['length']}] {m['text'][:90]}")
    print(f"ข้อยกเว้นที่มีเหตุผล {len(exempt)} ช่วง: " + ", ".join(sorted({a for a, _ in exempt})))
    print(f"\nสรุป: ข้อความไทยตรงกัน ≥ {a.min} อักขระกับเล่มเดิม (baseline + PDF) = {total} จุด")
    sys.exit(1 if total else 0)


if __name__ == "__main__":
    main()
