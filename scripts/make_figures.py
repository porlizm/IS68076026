# -*- coding: utf-8 -*-
import json, os, sys
"""make_figures.py: วาดรูปของเล่มเป็น SVG (TH Sarabun New 16px, viewBox กว้าง 415 = 14.65 ซม. พิมพ์ที่ 16 pt)
  python scripts/make_figures.py [ชื่อรูป ...]  ->  book/figures/*.svg, *.png (4x), figures.json
  ตรวจเรขาคณิตทุกรูป (ข้อความล้น เส้นทะลุกล่อง ป้ายทับเส้น เส้นตัดกัน จุดต่อชิด อักขระที่ฟอนต์ไม่มี) หยุดถ้ามีข้อผิดพลาด"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dg import *

NUM = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "book", "numbers.json"), encoding="utf-8"))
SIM = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "evidence", "coverage_simulation.json"), encoding="utf-8"))
GAP = 22


def stack(f, specs, x, w, y0=6, gap=GAP, **kw):
    """วางกล่องเรียงลงตามลำดับ คืนรายการกล่อง"""
    out, y = [], y0
    for sp in specs:
        id, lines, fill = sp[:3]
        extra = sp[3] if len(sp) > 3 else {}
        b = f.box(id, x, y, w, lines, fill, **{**kw, **extra}); out.append(b); y += b.h + gap
    return out


def wrap_items(items, width, sep=" · "):
    lines, cur = [], ""
    for it in items:
        t = it if not cur else cur + sep + it
        if cur and tw(t) > width: lines.append(cur); cur = it
        else: cur = t
    if cur: lines.append(cur)
    return lines


def hconn(f, r, x, **k):
    """ลูกศรแนวนอนจากขอบขวาของ r ไปขอบซ้ายของ x ที่ความสูงกึ่งกลางของ r (ต้องอยู่ในช่วงของ x)"""
    y = r.y + r.h / 2
    if not (x.y + 5 <= y <= x.y + x.h - 5): f.errs.append(f"hconn {r.id}->{x.id}: ความสูงไม่อยู่ในช่วง")
    return f.arrow([(r.x + r.w, y), (x.x, y)], r.id, x.id, **k)


def down(f, a, b, **k): return f.arrow([a.bottom(), b.top()], a.id, b.id, **k)


META = {}
FIGS = {}


def fig(name, caption, alt):
    def deco(fn):
        FIGS[name] = (fn, caption, alt); return fn
    return deco


# ---------------------------------------------------------------- กรอบแนวคิด
@fig("fig_framework", "กรอบแนวคิดของการศึกษา",
     "ห้ากล่องเรียงจากบนลงล่าง ข้อมูลเข้า วิเคราะห์หลักฐาน ตรวจด้วยกฎ R0 ถึง R7 จัดแผนการเรียนรู้ และรายงานรายบุคคล ข้อกำหนดอ้างอิง 600 ข้อจาก O*NET 31.0 ป้อนเข้าขั้นวิเคราะห์และขั้นตรวจ คำถามการวิจัยข้อ 1 ประเมินสถานะที่ได้จากการตรวจ และข้อ 2 ประเมินแผนในรายงาน")
def framework():
    f = Fig("fig_framework", 372)
    mx, mw = 120, 175
    ch = stack(f, [("i", ["ข้อมูลเข้า", "เรซูเม PDF และอาชีพ", "เป้าหมาย เวลาที่เรียนได้"], "grey", dict(bold_first=True)),
                   ("a", ["วิเคราะห์หลักฐาน", "โมเดล 3 ตัวอ่านแยกกัน", "ยกข้อความจากเอกสาร"], "blue", dict(bold_first=True)),
                   ("v", ["ตรวจด้วยกฎ R0 ถึง R7", "คำและความหมาย", "รวมเสียง ยังสรุปไม่ได้"], "blue", dict(bold_first=True)),
                   ("p", ["จัดแผนการเรียนรู้", "จากคลังที่กำหนดรุ่นคงที่ไว้", "ภายในเวลาที่มี"], "amber", dict(bold_first=True)),
                   ("o", ["รายงานรายบุคคล", "สถานะรายข้อ หลักฐาน", "แผนและเหตุผล"], "green", dict(bold_first=True))], mx, mw)
    i, a, v, p, o = ch
    for u, d in zip(ch, ch[1:]): down(f, u, d)
    r = f.box("r", 303, a.y, 104, ["ข้อกำหนด", "อ้างอิง", "600 ข้อ", "O*NET 31.0"], "white", h=v.y + v.h - a.y)
    f.arrow([r.left(a.h / 2), a.right()], "r", "a")
    f.arrow([r.left(r.h - v.h / 2), v.right()], "r", "v")
    q1 = f.box("q1", 8, v.y, 104, ["RQ1", "สถานะถูกต้อง"], "purple", h=v.h)
    q2 = f.box("q2", 8, o.y, 104, ["RQ2", "แผนเหมาะสม", "5 มิติ"], "purple", h=o.h)
    f.arrow([q1.right(), v.left()], "q1", "v", dashed=True, head=False)
    f.arrow([q2.right(), o.left()], "q2", "o", dashed=True, head=False)
    f.H = o.y + o.h + 6
    return f


# ---------------------------------------------------------------- ขั้นตอนวิจัย
@fig("fig_process", "ขั้นตอนการดำเนินการวิจัยเจ็ดขั้น",
     "เจ็ดขั้นเรียงจากบนลงล่าง สองขั้นแรกสีฟ้าคือการกำหนดเกณฑ์และการสร้างระบบซึ่งเป็นเนื้อหาของรายงานนี้ ขั้นที่สามสีเหลืองคือการยื่นขอรับรองจริยธรรม ขั้นที่สี่ถึงเจ็ดสีเขียวทำกับผู้เข้าร่วม ได้แก่ ทดลองนำร่อง กำหนดรุ่นคงที่ เก็บข้อมูลกลุ่มหลัก และวิเคราะห์")
def process():
    f = Fig("fig_process", 400)
    st = [(["1  กำหนดนิยาม เกณฑ์ และตัวชี้วัดก่อนเก็บข้อมูล"], "blue"),
          (["2  สร้างข้อมูลอ้างอิงและระบบ", "ทดสอบด้วยเทสต์อัตโนมัติและเรซูเมสังเคราะห์"], "blue"),
          (["3  ยื่นขอรับรองจริยธรรม"], "amber"),
          (["4  ทดลองนำร่อง 5 คน ปรับถ้อยคำและเกณฑ์"], "green"),
          (["5  กำหนดรุ่นคงที่ของ prompt กฎ เกณฑ์ คลัง และแบบประเมิน"], "green"),
          (["6  เก็บข้อมูลกลุ่มหลัก 30 คน", "ให้รหัสชุดคำตอบอ้างอิงโดยไม่เห็นผลของระบบ"], "green"),
          (["7  วิเคราะห์ RQ1 และ RQ2 และเขียนรายงานผล"], "green")]
    bs = stack(f, [(f"s{k}", l, c) for k, (l, c) in enumerate(st)], 16, 383, gap=18, align="l")
    for u, d in zip(bs, bs[1:]): down(f, u, d)
    f.H = bs[-1].y + bs[-1].h + 6
    return f


# ---------------------------------------------------------------- ข้อกำหนดอ้างอิง
@fig("fig_requirements", "การคัดข้อกำหนดอ้างอิงจาก O*NET 31.0",
     "เจ็ดขั้นจากบนลงล่าง จากฐานข้อมูล O*NET 31.0 และ 20 อาชีพ เลือกองค์ประกอบที่ค่าความสำคัญ IM ตั้งแต่ 3.0 ใช้สี่โดเมนยกเว้น Abilities กำหนดโควตาโดเมนละอย่างน้อย 3 ข้อ เรียง IM แล้วเลือก 30 ข้อต่ออาชีพ คำนวณน้ำหนัก ได้ข้อกำหนดอ้างอิง 600 ข้อ")
def requirements():
    f = Fig("fig_requirements", 400)
    ch = stack(f, [("a", ["O*NET 31.0 · 20 อาชีพไอที"], "grey"),
                   ("b", ["เลือกองค์ประกอบที่ IM ≥ 3.0"], "blue"),
                   ("c", ["ใช้ 4 โดเมน", "Work Activities · Essential Skills", "Transferable Skills · Knowledge"], "blue", dict(bold_first=True)),
                   ("e", ["โควตาโดเมนละอย่างน้อย 3 ข้อ"], "blue"),
                   ("f", ["เรียง IM จากมากไปน้อย", "เท่ากันใช้รหัสองค์ประกอบ", "เลือก 30 ข้อแรกต่ออาชีพ"], "blue"),
                   ("g", ["น้ำหนัก w = IM ÷ ผลรวม IM ของ 30 ข้อ"], "blue"),
                   ("h", ["ข้อกำหนดอ้างอิง 600 ข้อ", NUM['onet_label']], "green", dict(bold_first=True))], 10, 290)
    for u, d in zip(ch, ch[1:]): down(f, u, d)
    c = ch[2]
    x = f.box("x", 322, 0, 83, ["ไม่ใช้", "กลุ่ม", "Abilities"], "red")
    x.y = c.y + c.h / 2 - x.h / 2
    f.arrow([c.right(), x.left()], "c", "x", dashed=True)
    f.H = ch[-1].y + ch[-1].h + 6
    return f


# ---------------------------------------------------------------- สถาปัตยกรรม
@fig("fig_architecture", "สถาปัตยกรรมสามส่วนของระบบ",
     "สามส่วนเรียงจากบนลงล่าง Google Workspace มี Forms Sheets Drive และ Gmail ทำงานร่วมกับ workflow เดียวใน n8n ซึ่งเรียก Document AI อ่านข้อความจากภาพ และโมเดล A B C สามผู้ให้บริการที่ทั้งวิเคราะห์และตรวจความหมาย")
def architecture():
    f = Fig("fig_architecture", 420)
    gf = f.box("gf", 6, 4, 403, [], "white", frame=True, h=122)
    f.text("gt", 16, 8, "Google Workspace ในบัญชีของผู้วิจัย", bold=True)
    bx = [("form", ["Forms", "รับเรซูเม", "และเงื่อนไข"]), ("sh", ["Sheets", "เก็บผล", f"{NUM['tabs_total']} แท็บ"]),
          ("dr", ["Drive", "เก็บไฟล์", "และรายงาน"]), ("gm", ["Gmail", "ส่งรายงาน", "ให้ผู้เรียน"])]
    G = {}
    for k, (id, ln) in enumerate(bx):
        G[id] = f.box(id, 14 + k * 98, 38, 92, ln, "blue", bold_first=True)
    wf = f.box("wf", 6, 172, 403, [f"n8n {NUM['n8n_version']} ในเครื่องผู้วิจัย", f"workflow เดียวสำหรับทั้งระบบ", f"แบ่งเป็น {NUM['wf_sections']} ช่วงการทำงาน", "ตรรกะตรวจและจัดแผนอยู่ในโปรแกรมของโครงการ"], "amber", bold_first=True)
    xf = f.box("xf", 6, 300, 403, [], "white", frame=True, h=130)
    ocr = f.box("ocr", 14, 312, 187, ["Document AI", "อ่านข้อความ", "จากภาพ"], "green", bold_first=True)
    llm = f.box("llm", 214, 312, 187, ["โมเดล A B C", "สามผู้ให้บริการ", "วิเคราะห์และตรวจ", "ความหมาย"], "green", bold_first=True)
    f.text("xt", 16, 312 + 86 + 6, "บริการภายนอก", bold=True)
    both = {"form": False, "sh": True, "dr": True, "gm": False}
    for id in G:
        b = G[id]
        if id == "gm": f.arrow([wf.top(b.x + b.w / 2 - wf.x), b.bottom()], "wf", id)
        else: f.arrow([b.bottom(), wf.top(b.x + b.w / 2 - wf.x)], id, "wf", both=both[id])
    f.arrow([wf.bottom(ocr.x + ocr.w / 2 - wf.x), ocr.top()], "wf", "ocr", both=True)
    f.arrow([wf.bottom(llm.x + llm.w / 2 - wf.x), llm.top()], "wf", "llm", both=True)
    f.H = xf.y + xf.h + 6
    return f


# ---------------------------------------------------------------- workflow
@fig("fig_workflow", "เจ็ดช่วงของ workflow พร้อมขั้นตอนสำคัญ",
     "เจ็ดกล่องเรียงจากบนลงล่างตามช่วงของ workflow แต่ละกล่องมีชื่อช่วงและขั้นตอนสำคัญ ช่วงที่ 6 วนกลับช่วงที่ 1 เพื่อทำงานถัดไป และข้อผิดพลาดจากทุกช่วงไปที่ช่วงที่ 7")
def workflow():
    cols = ["blue", "green", "amber", "purple", "green", "blue", "red"]
    f = Fig("fig_workflow", 500)
    ids = [("s1", "1 รับข้อมูล", 0, ["รับคำตอบแบบฟอร์ม", "ตรวจแถวข้อมูล", "วนทีละงาน", "ตรวจไฟล์ PDF"]),
           ("s2", "2 อ่านและปิดบังข้อมูล", 0, ["ดึงชั้นข้อความ", "อ่านด้วย Document AI", "ปิดบังข้อมูลส่วนบุคคล", "บันทึกข้อความหลังปิดบัง"]),
           ("s3", "3 วิเคราะห์ 3 โมเดล", 0, ["โหลดข้อกำหนดอ้างอิง", "สร้าง prompt", "เรียกโมเดลสามราย", "บันทึกการเรียกโมเดล"]),
           ("s4", "4 ตรวจและรวมผล", 0, ["เตรียมรายการตรวจความหมาย", "เรียกโมเดลผู้ตรวจ", "ใช้กฎตรวจหลักฐาน", "บันทึกคำตัดสิน"]),
           ("s5", "5 จัดแผน", 0, ["จัดแผนการเรียนรู้", "บันทึกรายการในแผน", "กำหนดข้อมูลรายงาน"]),
           ("s6", "6 ส่งรายงาน", 0, ["สร้างรายงานภาษาไทย", "ส่งออกเป็น PDF", "ส่งอีเมลรายงาน", "บันทึกการส่ง"]),
           ("s7", "7 บันทึกและข้อผิดพลาด", 0, ["ดักข้อผิดพลาด", "จัดประเภทข้อผิดพลาด", "ทำเครื่องหมายงานล้ม", "แจ้งผู้วิจัย"])]
    x0, w = 72, 323
    specs = [(i, [t] + wrap_items(l, w - 2 * PAD - 4), c, dict(bold_first=True)) for (i, t, n, l), c in zip(ids, cols)]
    bs = stack(f, specs, x0, w, gap=16)
    for u, d in zip(bs[:6], bs[1:6]): down(f, u, d)
    s7 = bs[6]
    lx = 38
    f.arrow([bs[5].left(), (lx, bs[5].y + bs[5].h / 2), (lx, bs[0].y + bs[0].h / 2), bs[0].left()], "s6", "s1", label="ถัดไป", at=(lx, (bs[0].y + bs[5].y + bs[5].h) / 2))
    tx = 403
    for b in bs[:6]:
        f.arrow([b.right(), (tx, b.y + b.h / 2)], b.id, None, head=False, soft=True, dashed=True)
    f.arrow([(tx, bs[0].y + bs[0].h / 2), (tx, s7.y + s7.h / 2), s7.right()], None, "s7", dashed=True, soft=True)
    f.H = s7.y + s7.h + 6
    return f


# ---------------------------------------------------------------- เส้นทางข้อมูล
@fig("fig_dataflow", "เส้นทางข้อมูลของผู้เข้าร่วมและผู้รับข้อมูลภายนอก",
     "ผู้เข้าร่วมส่งเรซูเมและความยินยอมผ่านแบบฟอร์มไปยังที่เก็บของผู้วิจัย n8n ในเครื่องผู้วิจัยประมวลผล ส่งไฟล์ภาพสแกนต้นฉบับให้ Document AI ก่อนปิดบังข้อมูล และส่งเฉพาะข้อความหลังปิดบังให้โมเดลสามราย แล้วส่งรายงานทางอีเมลกลับไปยังผู้เข้าร่วม")
def dataflow():
    f = Fig("fig_dataflow", 415)
    a = f.box("a", 10, 6, 235, ["ผู้เข้าร่วม", "ส่งเรซูเม PDF และความยินยอม"], "grey", bold_first=True)
    b = f.box("b", 10, 6 + a.h + 26, 235, ["ที่เก็บของผู้วิจัย", "แบบฟอร์ม ไฟล์ และตารางผล", "ในบัญชีของผู้วิจัย"], "blue", bold_first=True)
    c = f.box("c", 10, b.y + b.h + 26, 235, ["n8n ในเครื่องผู้วิจัย", "ดึงข้อความจากไฟล์", "ปิดบังข้อมูล 4 รูปแบบ", "ใช้กฎตรวจและจัดแผน", "สร้างรายงาน PDF"], "amber", bold_first=True, h=172)
    d = f.box("d", 10, c.y + c.h + 26, 235, ["ส่งรายงานทางอีเมล", "ถึงผู้เข้าร่วมทีละฉบับ"], "blue", bold_first=True)
    e = f.box("e", 285, c.y, 120, ["Document AI", "ได้ PDF ต้นฉบับ", "เฉพาะไฟล์สแกน", "ก่อนปิดบัง"], "red", bold_first=True)
    g = f.box("g", 285, c.y + c.h - 0, 120, ["โมเดลสามราย", "ได้เฉพาะข้อความ", "หลังปิดบัง"], "green", bold_first=True)
    g.y = c.y + c.h - g.h
    down(f, a, b); down(f, b, c); down(f, c, d)
    y1 = e.y + e.h / 2; y2 = g.y + g.h / 2
    f.arrow([(c.x + c.w, y1), (e.x, y1)], "c", "e", both=True)
    f.arrow([(c.x + c.w, y2), (g.x, y2)], "c", "g", both=True)
    f.H = d.y + d.h + 6
    return f


# ---------------------------------------------------------------- กฎ A
RX = 282; RW = 125
@fig("fig_rules_a", "ลำดับกฎรายข้อสรุปตั้งแต่ R0 จนถึงการรวมเสียง",
     "ลำดับจากบนลงล่าง R0 ตรวจผลตอบกลับทั้งชุด R2 ตรวจข้อความที่ยก R3a ตรวจคำที่ตรงกับข้อกำหนด ถ้าคำไม่ตรงส่งให้ R3b ตรวจความหมาย แล้วรวมเสียงด้วย R1 และ R4 ด้านขวาแสดงผลเมื่อไม่ผ่านแต่ละกฎ")
def rules_a():
    f = Fig("fig_rules_a", 500)
    ch = stack(f, [("m", ["ผลตอบกลับของโมเดลหนึ่งชุด"], "grey"),
                   ("r0", ["R0 ผลตอบกลับทั้งชุด", "JSON ตรงรูปแบบ", "รหัสอาชีพและข้อกำหนดตรง", "ตอบอย่างน้อยครึ่งหนึ่ง"], "blue", dict(bold_first=True)),
                   ("r2", ["R2 ข้อสรุปรายข้อ", "ข้อความที่ยกมาปรากฏจริง"], "blue", dict(bold_first=True)),
                   ("r3a", ["R3a ข้อสรุปรายข้อ", "คำตรงกับข้อกำหนดถึงเกณฑ์"], "blue", dict(bold_first=True)),
                   ("r3b", ["R3b ข้อสรุปรายข้อ", "โมเดลอื่นตรวจความหมาย"], "blue", dict(bold_first=True)),
                   ("r1", ["R1 รวมเสียงของทุกโมเดล", "ได้สถานะอย่างน้อยสองเสียง", "ไม่นับเสียงที่ตรวจไม่ได้"], "blue", dict(bold_first=True)),
                   ("r4", ["R4 สัดส่วนโมเดลที่เห็นตรงกัน", "ใช้แสดงในรายงาน"], "blue", dict(bold_first=True)),
                   ("e", ["สถานะหลังรวมเสียง", "ส่งต่อกฎ R5 R6 R7 (รูปที่ 3.7)"], "green", dict(bold_first=True))], 52, 212, gap=24)
    m, r0, r2, r3a, r3b, r1, r4, e = ch
    for b in (r3b, r1, r4, e): b.y += 18
    for u, d in zip(ch, ch[1:]):
        if u.id != "r3a": down(f, u, d)
    f.arrow([r3a.bottom(), r3b.top()], "r3a", "r3b", label="ไม่ผ่าน", at=(r3a.x + r3a.w / 2, (r3a.y + r3a.h + r3b.y) / 2))
    f.arrow([r3a.left(), (24, r3a.y + r3a.h / 2), (24, r1.y + r1.h / 2), r1.left()], "r3a", "r1", label="ผ่าน", at=(24, (r3a.y + r1.y + r1.h) / 2 - 20))
    SX, SW = 282, 125
    def side(id, r, lines, fill, bold=False, dy=0):
        h = len(lines) * LH + 10
        b = f.box(id, SX, r.y + r.h / 2 - h / 2 + dy, SW, lines, fill, bold_first=bold)
        return b
    x0 = side("x0", r0, ["ไม่ผ่าน", "ผลของโมเดลนี้", "ใช้ไม่ได้ทั้งชุด"], "red")
    x2 = side("x2", r2, ["ไม่ผ่าน", "เสียงเปลี่ยนเป็น", "missing นับใน U"], "red")
    x3 = side("x3", r3b, ["ผลของ R3b", "บางส่วน: ลดเป็น", "partially", "ไม่เกี่ยว: missing", "ไม่ตอบ: ตรวจ", "ไม่ได้"], "amber", True, dy=-8)
    x1 = side("x1", r1, ["ไม่ผ่าน", "ได้สถานะ", "abstained", "(ยังสรุปไม่ได้)"], "amber", dy=28)
    for r, x in ((r0, x0), (r2, x2), (r3b, x3), (r1, x1)): hconn(f, r, x, dashed=True)
    f.H = e.y + e.h + 6
    return f


# ---------------------------------------------------------------- กฎ B
@fig("fig_rules_b", "ลำดับกฎหลังรวมเสียง R5 R6 และ R7",
     "ลำดับจากบนลงล่างหลังรวมเสียง R5 ตรวจใบรับรองในเรซูเม R6 ตรวจกิจกรรมการทำงานที่เชื่อมกับทักษะพื้นฐาน R7 ตรวจบทบาทและข้อความซ้ำ ด้านขวาแสดงผลเมื่อพบเงื่อนไข ทุกกฎปรับสถานะเป็น partially แล้วได้สถานะสุดท้าย")
def rules_b():
    f = Fig("fig_rules_b", 500)
    RX2, RW2 = 246, 161
    ch = stack(f, [("m", ["สถานะหลังรวมเสียงของแต่ละข้อ"], "grey"),
                   ("r5", ["R5 ใบรับรองในเรซูเม", "ข้อที่ยัง missing", "หรือ abstained", "พบใบรับรองในคลังที่ตรงกัน"], "blue", dict(bold_first=True)),
                   ("r6", ["R6 ทักษะพื้นฐาน", "ข้อที่ยัง missing", "หรือ abstained", "กิจกรรมการทำงานที่เชื่อมกัน", "ได้ evidenced"], "blue", dict(bold_first=True)),
                   ("r7a", ["R7 บทบาท", "ข้อที่ evidenced จากข้อความ", "ของโมเดล", "บทบาทเสียงข้างมากถึงเกณฑ์"], "blue", dict(bold_first=True)),
                   ("r7b", ["R7 ข้อความซ้ำ", "ข้อความเดียวกันหรือช่วง", "ที่ซ้อนกัน ตั้งแต่ร้อยละ 60"], "blue", dict(bold_first=True)),
                   ("e", ["สถานะสุดท้าย", "evidenced partially", "missing abstained"], "green", dict(bold_first=True))], 8, 224, gap=22)
    m, r5, r6, r7a, r7b, e = ch
    for u, d in zip(ch, ch[1:]): down(f, u, d)
    outs = [(r5, ["พบ: ได้ partially"]), (r6, ["พบ: ได้ partially"]),
            (r7a, ["ข้อเชิงปฏิบัติต้อง", "performed", "ข้อ LV ตั้งแต่ 5.0 ต้อง", "อย่างน้อย led", "ไม่ถึงเกณฑ์", "ลดเป็น partially"]),
            (r7b, ["เป็นหลักฐานเต็มได้", "ไม่เกิน 2 ข้อ", "ข้อที่เกินลดเป็น", "partially"])]
    for r, ln in outs:
        h = len(ln) * LH + 10
        dy = {"r7a": -14, "r7b": 12}.get(r.id, 0)
        x = f.box("x_" + r.id, RX2, r.y + r.h / 2 - h / 2 + dy, RW2, ln, "amber")
        f.arrow([r.right(), (x.x, r.y + r.h / 2)] if x.y + 5 <= r.y + r.h / 2 <= x.y + x.h - 5 else [r.right(), x.left()], r.id, x.id, dashed=True)
    f.H = e.y + e.h + 6
    return f


# ---------------------------------------------------------------- ชุดคำตอบอ้างอิง
@fig("fig_coding", "การจัดทำชุดคำตอบอ้างอิงโดยผู้วิจัยคนเดียว",
     "ลำดับจากบนลงล่าง จัดทำไฟล์ให้รหัสที่ไม่มีผลของระบบ ผู้วิจัยให้รหัสรอบที่ 1 ทุกคนในกลุ่มหลัก ให้รหัสซ้ำรอบที่ 2 อย่างน้อยร้อยละ 20 ไม่น้อยกว่า 6 คน ห่างจากรอบแรกอย่างน้อย 14 วัน คำนวณ kappa ถ้าต่ำกว่า 0.61 ทบทวนคู่มือแล้วให้รหัสรอบที่ 2 ใหม่ ถ้าผ่านใช้รหัสรอบที่ 1 เป็นชุดคำตอบอ้างอิง แล้วเปิดผลของระบบเพื่อเทียบ")
def coding():
    f = Fig("fig_coding", 500)
    ch = stack(f, [("f", ["ไฟล์ให้รหัส", "เรซูเมและข้อกำหนดอ้างอิง 30 ข้อ", "ไม่มีคอลัมน์ผลของระบบ"], "grey", dict(bold_first=True)),
                   ("c1", ["รอบที่ 1", "ผู้วิจัยให้รหัสทุกคนในกลุ่มหลัก", "ก่อนเปิดผลของระบบ"], "blue", dict(bold_first=True)),
                   ("c2", ["รอบที่ 2", "ให้รหัสซ้ำ ≥ 20% ไม่น้อยกว่า 6 คน", "ห่างจากรอบแรก ≥ 14 วัน สลับแถว"], "blue", dict(bold_first=True)),
                   ("k", ["ค่า kappa ของสองรอบ", "เกณฑ์ขั้นต่ำ 0.61"], "amber", dict(bold_first=True)),
                   ("g", ["ชุดคำตอบอ้างอิง = รหัสรอบที่ 1", "รายการที่ต่างกันใช้ข้อยุติ", "เก็บรหัสเดิมของทั้งสองรอบ"], "green", dict(bold_first=True)),
                   ("s", ["เปิดผลของระบบแล้วเทียบ", "Macro-F1 และอัตราการงดสรุป"], "purple", dict(bold_first=True))], 10, 255, gap=24)
    fi, c1, c2, k, g, s = ch
    g.y += 18; s.y += 18
    for u, d in zip(ch, ch[1:]):
        if u.id == "k": f.arrow([u.bottom(), d.top()], "k", "g", label="ผ่าน", at=(u.x + u.w / 2, (u.y + u.h + d.y) / 2))
        else: down(f, u, d)
    x = f.box("rv", 296, 0, 111, ["ต่ำกว่า 0.61", "ทบทวนคู่มือ", "ให้รหัสรอบที่ 2", "ใหม่"], "red", bold_first=True)
    x.y = k.y + k.h / 2 - x.h / 2
    f.arrow([k.right(), x.left()], "k", "rv", dashed=True)
    f.arrow([x.top(), (x.x + x.w / 2, c2.y + c2.h / 2), c2.right()], "rv", "c2", dashed=True)
    f.H = s.y + s.h + 6
    return f


# ---------------------------------------------------------------- แบบแผนประเมิน
@fig("fig_evaluation", "แบบแผนการประเมินตามคำถามการวิจัยสองข้อ",
     "การวิเคราะห์หนึ่งรอบของผู้เข้าร่วมหนึ่งคนให้สถานะสุดท้าย 30 ข้อและแผนที่ส่งให้ผู้เข้าร่วม สถานะเทียบกับชุดคำตอบอ้างอิงเพื่อตอบคำถามข้อ 1 ส่วนแผนประเมินด้วยแบบประเมินเพื่อตอบคำถามข้อ 2 ช่องว่างที่ระบบระบุเป็นตัวกำหนดแผน")
def evaluation():
    f = Fig("fig_evaluation", 400)
    run = f.box("run", 8, 6, 399, ["การวิเคราะห์หนึ่งรอบของผู้เข้าร่วมหนึ่งคน"], "grey", bold_first=True)
    dec = f.box("dec", 8, 70, 185, ["สถานะสุดท้าย 30 ข้อ"], "blue")
    plan = f.box("plan", 222, 70, 185, ["แผนที่ส่งให้ผู้เข้าร่วม", "จัดจากช่องว่างของระบบ"], "amber")
    plan.y = dec.y + dec.h / 2 - plan.h / 2
    q1 = f.box("q1", 8, 160, 185, ["RQ1", "เทียบชุดคำตอบอ้างอิง", "F1 รายสถานะ", "Macro-F1", "อัตราการงดสรุป"], "purple", bold_first=True)
    q2 = f.box("q2", 222, 160, 185, ["RQ2", "ตรงประเด็น", "ครอบคลุมช่องว่าง", "ข้อมูลรายการถูกต้อง", "เวลาเป็นไปได้", "ประโยชน์ที่รับรู้"], "purple", bold_first=True)
    f.arrow([run.bottom(dec.x + dec.w / 2 - run.x), dec.top()], "run", "dec")
    f.arrow([run.bottom(plan.x + plan.w / 2 - run.x), plan.top()], "run", "plan")
    f.arrow([dec.bottom(), q1.top()], "dec", "q1")
    f.arrow([plan.bottom(), q2.top()], "plan", "q2")
    f.arrow([dec.right(), plan.left()], "dec", "plan", dashed=True)
    f.H = q2.y + q2.h + 6
    return f


# ---------------------------------------------------------------- ความครอบคลุม (กราฟแท่ง)
@fig("fig_coverage", "ความครอบคลุมของแผนจำลองตามกรอบเวลาและชั่วโมงเรียนต่อสัปดาห์",
     "กราฟแท่งเจ็ดแท่ง แต่ละแท่งคือจำนวนข้อกำหนดอ้างอิงที่แผนจำลองครอบคลุม ที่ 6 เดือน 5 ชั่วโมงต่อสัปดาห์ได้ 528 ข้อ ที่ 6 เดือน 10 15 และ 20 ชั่วโมงต่อสัปดาห์ รวมถึง 12 18 และ 24 เดือนที่ 10 ชั่วโมงต่อสัปดาห์ ได้ครบ 600 ข้อ")
def coverage():
    f = Fig("fig_coverage", 270)
    rows = [(f"{x['months']}", "เดือน", f"{x['hours_per_week']} ชม.", x["covered"]) for x in SIM["by_capacity"]] + [(f"{x['months']}", "เดือน", "10 ชม.", x["covered"]) for x in SIM["by_months_10h"]]
    L, R, T, B = 40, 408, 14, 186
    ymax = 640
    yy = lambda v: B - (B - T) * v / ymax
    f.cov = dict(rows=rows, L=L, R=R, T=T, B=B, yy=yy)
    return f


def cov_svg(f):
    c = f.cov; L, R, T, B, yy = c["L"], c["R"], c["T"], c["B"], c["yy"]; rows = c["rows"]
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {f.H}" width="{W}" height="{f.H}" font-family="\'TH Sarabun New\', sans-serif" font-size="{FS}">',
         f'<rect width="{W}" height="{f.H}" fill="#ffffff"/>']
    for g in range(0, 601, 100):
        o.append(f'<line x1="{L}" x2="{R}" y1="{yy(g):g}" y2="{yy(g):g}" stroke="#e6e6e3" stroke-width="1"/>')
        o.append(f'<text x="{L - 5}" y="{yy(g):g}" text-anchor="end" dominant-baseline="central" fill="{MUTED}">{g}</text>')
    o.append(f'<line x1="{L}" x2="{L}" y1="{T}" y2="{B}" stroke="{MUTED}"/><line x1="{L}" x2="{R}" y1="{B}" y2="{B}" stroke="{MUTED}"/>')
    n = len(rows); slot = (R - L) / n; bw = slot * 0.58
    for i, (a1, a2, a3, v) in enumerate(rows):
        cx = L + slot * (i + .5)
        o.append(f'<rect x="{cx - bw / 2:g}" y="{yy(v):g}" width="{bw:g}" height="{B - yy(v):g}" fill="#2a78d6"/>')
        o.append(f'<text x="{cx:g}" y="{yy(v) + 11:g}" text-anchor="middle" dominant-baseline="central" fill="#ffffff">{v}</text>')
        o.append(f'<text x="{cx:g}" y="{B + 12}" text-anchor="middle" dominant-baseline="central" fill="#0b0b0b">{a1}</text>')
        o.append(f'<text x="{cx:g}" y="{B + 31}" text-anchor="middle" dominant-baseline="central" fill="#0b0b0b">{a2}</text>')
        o.append(f'<text x="{cx:g}" y="{B + 50}" text-anchor="middle" dominant-baseline="central" fill="{MUTED}">{a3}</text>')
    o.append(f'<line x1="{L}" x2="{R}" y1="{yy(600):g}" y2="{yy(600):g}" stroke="{MUTED}" stroke-dasharray="6 4"/>')
    o.append(f'<text x="{R}" y="{yy(600) - 10:g}" text-anchor="end" dominant-baseline="central" fill="{MUTED}">เป้า 600 ข้อ</text>')
    o.append(f'<text x="{(L + R) / 2:g}" y="{B + 73}" text-anchor="middle" dominant-baseline="central" fill="#0b0b0b">กรอบเวลา (เดือน) และชั่วโมงเรียนต่อสัปดาห์</text>')
    o.append("</svg>")
    return "\n".join(o)


def cov_check(f):
    c = f.cov; E = []
    n = len(c["rows"]); slot = (c["R"] - c["L"]) / n
    for a1, a2, a3, v in c["rows"]:
        for t in (a1, a2, a3):
            if tw(t) > slot - 2: E.append(f"ป้ายแกน '{t}' กว้าง {tw(t):.0f} > {slot - 2:.0f}")
    if missing_glyphs("".join(a + b + d for a, b, d, _ in c["rows"])): E.append("glyph")
    return E


if __name__ == "__main__":
    from PIL import Image
    ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
    out = os.path.join(ROOT, "book", "figures"); os.makedirs(out, exist_ok=True)
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    fn_map = dict(fig_framework=framework, fig_process=process, fig_requirements=requirements, fig_architecture=architecture,
                  fig_workflow=workflow, fig_rules_a=rules_a, fig_rules_b=rules_b, fig_coding=coding, fig_evaluation=evaluation, fig_dataflow=dataflow, fig_coverage=coverage)
    jp = os.path.join(out, "figures.json")
    meta = json.load(open(jp, encoding="utf-8")) if os.path.exists(jp) else {}
    meta.pop("fig_rules", None)
    bad = 0
    for name, fn in fn_map.items():
        if only and name not in only: continue
        f = fn()
        errs = cov_check(f) if name == "fig_coverage" else f.check()
        print(f"{name}: สูง {f.H:.0f} errors={len(errs)}")
        for e in errs: print("   -", e)
        bad += len(errs)
        if errs: continue
        sp = os.path.join(out, name + ".svg"); open(sp, "w", encoding="utf-8").write(cov_svg(f) if name == "fig_coverage" else f.svg())
        pp = os.path.join(out, name + ".png"); render_png(sp, pp, f.H)
        w, h = Image.open(pp).size
        cm = round(W / 72 * 2.54, 2)
        meta[name] = dict(file=f"figures/{name}.png", caption=FIGS[name][1], alt=FIGS[name][2], width_cm=cm, print_font_pt=16.0, px=[w, h])
        print(f"   {w}x{h}px กว้างพิมพ์ {cm} ซม. สูง {h / w * cm:.1f} ซม.")
    json.dump(meta, open(jp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    if bad: sys.exit(f"มี {bad} ข้อผิดพลาด")
