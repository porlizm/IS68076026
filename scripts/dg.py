# -*- coding: utf-8 -*-
"""dg.py: ไลบรารีวาดแผนภาพ SVG (TH Sarabun New 16px, viewBox กว้าง 415) พร้อมตรวจเรขาคณิต"""
import json, os, subprocess, sys
from PIL import ImageFont

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
def _find(names):
    for base in (os.path.join(_ROOT, "assets", "fonts"), os.path.expanduser("~/.fonts"), "/root/.fonts"):
        for n in names:
            p = os.path.join(base, n)
            if os.path.exists(p): return p
    raise SystemExit("ไม่พบฟอนต์ TH Sarabun New: " + names[0])
FONT_R = os.environ.get("TH_R") or _find(["THSarabunNew.ttf", "THSarabunNew-webfont.ttf"])
FONT_B = os.environ.get("TH_B") or _find(["THSarabunNew Bold.ttf", "THSarabunNew_bold.ttf", "THSarabunNew-Bold.ttf", "THSarabunNew_bold-webfont.ttf"])
_FR = ImageFont.truetype(FONT_R, 160, layout_engine=ImageFont.Layout.RAQM)
_FB = ImageFont.truetype(FONT_B, 160, layout_engine=ImageFont.Layout.RAQM)
FS = 16; LH = 19; PAD = 6
W = 415
COL = dict(blue="#e8f0fb", green="#eaf6ee", amber="#fdf3e3", purple="#f6eaf6", grey="#f2f2f2", red="#fbe9e9", white="#ffffff")
STROKE = "#333333"; MUTED = "#52514e"


from fontTools.ttLib import TTFont as _TT
_CM = set(_TT(FONT_R).getBestCmap())
def missing_glyphs(t): return sorted({c for c in t if ord(c) not in _CM and not c.isspace()})


def tw(s, bold=False):
    return (_FB if bold else _FR).getlength(s) / 10.0


class Box:
    def __init__(s, id, x, y, w, lines, fill="white", bold_first=False, h=None, dashed=False, frame=False, align="c", plain=False):
        s.id, s.x, s.y, s.w = id, x, y, w
        s.lines = lines if isinstance(lines, list) else [lines]
        s.h = h if h else len(s.lines) * LH + 2 * PAD - 2
        s.fill, s.bold_first, s.dashed, s.frame, s.align, s.plain = COL.get(fill, fill), bold_first, dashed, frame, align, plain
    def top(s, dx=None): return (s.x + (s.w / 2 if dx is None else dx), s.y)
    def bottom(s, dx=None): return (s.x + (s.w / 2 if dx is None else dx), s.y + s.h)
    def left(s, dy=None): return (s.x, s.y + (s.h / 2 if dy is None else dy))
    def right(s, dy=None): return (s.x + s.w, s.y + (s.h / 2 if dy is None else dy))
    @property
    def rect(s): return (s.x, s.y, s.x + s.w, s.y + s.h)


class Arrow:
    def __init__(s, pts, src, dst, label=None, at=None, dashed=False, head=True, color=STROKE, both=False, soft=False):
        s.both, s.soft = both, soft
        s.pts, s.src, s.dst, s.label, s.at, s.dashed, s.head, s.color = pts, src, dst, label, at, dashed, head, color


class Fig:
    def __init__(s, name, H):
        s.name, s.H, s.boxes, s.arrows, s.texts, s.errs = name, H, {}, [], [], []
    def box(s, id, *a, **k):
        b = Box(id, *a, **k); s.boxes[id] = b; return b
    def arrow(s, pts, src=None, dst=None, **k):
        a = Arrow(pts, src, dst, **k); s.arrows.append(a); return a
    def text(s, id, x, y, lines, anchor="start", bold=False, color="#0b0b0b"):
        lines = lines if isinstance(lines, list) else [lines]
        w = max(tw(l, bold) for l in lines)
        x0 = x if anchor == "start" else (x - w / 2 if anchor == "middle" else x - w)
        s.texts.append(dict(id=id, x=x, y=y, lines=lines, anchor=anchor, bold=bold, color=color, rect=(x0, y, x0 + w, y + len(lines) * LH)))

    # ---------- ตรวจเรขาคณิต ----------
    def check(s):
        E = s.errs
        def inter(r1, r2, m=0):
            return not (r1[2] <= r2[0] - m or r2[2] <= r1[0] - m or r1[3] <= r2[1] - m or r2[3] <= r1[1] - m)
        solid = [b for b in s.boxes.values() if not b.frame]
        alltxt = "".join("".join(b.lines) for b in s.boxes.values()) + "".join("".join(t["lines"]) for t in s.texts) + "".join(a.label or "" for a in s.arrows)
        if missing_glyphs(alltxt): E.append(f"ฟอนต์ไม่มีอักขระ {missing_glyphs(alltxt)}")
        for b in s.boxes.values():
            x0, y0, x1, y1 = b.rect
            if x0 < 1 or x1 > W - 1 or y0 < 0 or y1 > s.H: E.append(f"{b.id}: เกินขอบภาพ {b.rect}")
            if not b.frame:
                for i, l in enumerate(b.lines):
                    bold = b.bold_first and i == 0
                    if tw(l, bold) > b.w - 2 * PAD + 1: E.append(f"{b.id}: บรรทัด '{l}' กว้าง {tw(l, bold):.0f} > {b.w - 2 * PAD}")
                if len(b.lines) * LH > b.h - 2: E.append(f"{b.id}: สูงไม่พอ")
        for t in s.texts:
            r = t["rect"]
            if r[0] < 1 or r[2] > W - 1 or r[3] > s.H: E.append(f"{t['id']}: ข้อความเกินขอบภาพ")
            for b in solid:
                if inter(r, b.rect, 1): E.append(f"{t['id']}: ข้อความทับกล่อง {b.id}")
        for i, a in enumerate(solid):
            for b in solid[i + 1:]:
                if inter(a.rect, b.rect, 4): E.append(f"กล่อง {a.id} ชน/ใกล้ {b.id} (< 4px)")
        # frame ต้องไม่ตัดกล่องที่ไม่ได้อยู่ข้างใน
        for f in [b for b in s.boxes.values() if b.frame]:
            for b in solid:
                inside = f.x <= b.x and f.y <= b.y and b.x + b.w <= f.x + f.w and b.y + b.h <= f.y + f.h
                if not inside and inter(f.rect, b.rect): E.append(f"กรอบ {f.id} ตัดกล่อง {b.id}")
            for t in s.texts:
                r = t["rect"]; inside = f.x <= r[0] and f.y <= r[1] and r[2] <= f.x + f.w and r[3] <= f.y + f.h
                if not inside and inter(f.rect, r): E.append(f"กรอบ {f.id} ตัดข้อความ {t['id']}")
        segs_all = []
        for k, a in enumerate(s.arrows):
            tag = f"ลูกศร{k}({a.src}->{a.dst})"
            P = a.pts
            for j in range(len(P) - 1):
                (x0, y0), (x1, y1) = P[j], P[j + 1]
                if abs(x0 - x1) > .01 and abs(y0 - y1) > .01: E.append(f"{tag}: ส่วนที่ {j} ไม่ตั้งฉาก")
                seg = (min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1))
                segs_all.append((k, j, seg))
                for b in solid:
                    if b.id in (a.src, a.dst):
                        # ส่วนที่ไม่ใช่ปลายต้องไม่ผ่านกล่องตัวเอง
                        if j not in (0, len(P) - 2) and inter(seg, b.rect, -0.5): E.append(f"{tag}: ผ่านกล่อง {b.id}")
                        elif j in (0, len(P) - 2):
                            # ส่วนปลายอาจแตะขอบกล่องตัวเองแต่ไม่วิ่งผ่านเข้าไปในกล่อง
                            inner = (b.x + 1, b.y + 1, b.x + b.w - 1, b.y + b.h - 1)
                            if inter(seg, inner, 0): E.append(f"{tag}: เข้าไปในกล่อง {b.id}")
                    elif inter(seg, b.rect, 2): E.append(f"{tag}: ผ่านกล่อง {b.id}")
                for t in s.texts:
                    if inter(seg, t["rect"], 2): E.append(f"{tag}: ทับข้อความ {t['id']}")
            for end, bid in ((P[0], a.src), (P[-1], a.dst)):
                if bid and bid in s.boxes:
                    b = s.boxes[bid]; x, y = end
                    on = (abs(x - b.x) < .6 or abs(x - b.x - b.w) < .6) and b.y - .6 <= y <= b.y + b.h + .6 or \
                         (abs(y - b.y) < .6 or abs(y - b.y - b.h) < .6) and b.x - .6 <= x <= b.x + b.w + .6
                    if not on: E.append(f"{tag}: ปลาย {end} ไม่อยู่บนขอบ {bid}")
        # ป้ายบนเส้น
        labels = []
        for k, a in enumerate(s.arrows):
            if a.label:
                cx, cy = a.at; lw = tw(a.label) + 8
                r = (cx - lw / 2, cy - LH / 2, cx + lw / 2, cy + LH / 2)
                on = any(min(p[0], q[0]) - .6 <= cx <= max(p[0], q[0]) + .6 and min(p[1], q[1]) - .6 <= cy <= max(p[1], q[1]) + .6 for p, q in zip(a.pts, a.pts[1:]))
                if not on: E.append(f"ป้าย '{a.label}': ไม่อยู่บนเส้น")
                if r[0] < 1 or r[2] > W - 1 or r[1] < 0 or r[3] > s.H: E.append(f"ป้าย '{a.label}' เกินขอบภาพ")
                for b in solid:
                    if inter(r, b.rect, 1): E.append(f"ป้าย '{a.label}' ทับกล่อง {b.id}")
                for t in s.texts:
                    if inter(r, t["rect"], 1): E.append(f"ป้าย '{a.label}' ทับข้อความ {t['id']}")
                for (k2, j2, seg) in segs_all:
                    if k2 != k and inter(r, seg, 1): E.append(f"ป้าย '{a.label}' ทับเส้นของลูกศร{k2}")
                for r2, l2 in labels:
                    if inter(r, r2, 1): E.append(f"ป้าย '{a.label}' ทับป้าย '{l2}'")
                labels.append((r, a.label))
        # เส้นตัดกัน
        for (k1, j1, a1) in segs_all:
            for (k2, j2, a2) in segs_all:
                if k1 < k2 and not s.arrows[k1].soft and not s.arrows[k2].soft and inter(a1, a2, -0.01):
                    # ใช้ปลายร่วมได้ (แตกแขนง) ถ้าเริ่มหรือจบจุดเดียวกัน
                    P1, P2 = s.arrows[k1].pts, s.arrows[k2].pts
                    shared = {P1[0], P1[-1]} & {P2[0], P2[-1]}
                    if shared: continue
                    E.append(f"เส้นลูกศร{k1} ตัดลูกศร{k2}")
        # จุดต่อบนขอบเดียวกันต้องห่าง >= 12px
        pts = {}
        for k, a in enumerate(s.arrows):
            for end, bid in ((a.pts[0], a.src), (a.pts[-1], a.dst)):
                if bid: pts.setdefault(bid, set()).add((round(end[0], 1), round(end[1], 1)))
        for bid, ps in pts.items():
            ps = sorted(ps)
            for p, q in zip(ps, ps[1:]):
                if (p[0] == q[0] or p[1] == q[1]) and abs(p[0] - q[0]) + abs(p[1] - q[1]) < 12 and p != q:
                    E.append(f"จุดต่อบน {bid} ใกล้กันเกินไป {p} {q}")
        return E

    # ---------- SVG ----------
    def svg(s, font_face=False):
        o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {s.H}" width="{W}" height="{s.H}" font-family="\'TH Sarabun New\', \'THSarabunNew\', sans-serif" font-size="{FS}">']
        o.append(f'<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1L10 5L0 9z" fill="{STROKE}"/></marker></defs>')
        o.append(f'<rect width="{W}" height="{s.H}" fill="#ffffff"/>')
        for b in s.boxes.values():
            if b.frame:
                o.append(f'<rect x="{b.x}" y="{b.y}" width="{b.w}" height="{b.h}" rx="8" fill="none" stroke="#7a8aa6" stroke-width="1.2" stroke-dasharray="5 4"/>')
        for k, a in enumerate(s.arrows):
            d = "M" + " L".join(f"{x:g} {y:g}" for x, y in a.pts)
            da = ' stroke-dasharray="5 3"' if a.dashed else ""
            mk = (' marker-end="url(#ah)"' if a.head else "") + (' marker-start="url(#ah)"' if a.both else "")
            o.append(f'<path d="{d}" fill="none" stroke="{a.color}" stroke-width="1.3"{da}{mk} stroke-linejoin="round"/>')
        for a in s.arrows:
            if a.label:
                cx, cy = a.at; lw = tw(a.label) + 8
                o.append(f'<rect x="{cx - lw / 2:g}" y="{cy - LH / 2:g}" width="{lw:g}" height="{LH}" fill="#ffffff"/>')
                o.append(f'<text x="{cx:g}" y="{cy:g}" text-anchor="middle" dominant-baseline="central" fill="{MUTED}">{esc(a.label)}</text>')
        for b in s.boxes.values():
            if b.frame: continue
            if not b.plain:
                o.append(f'<rect x="{b.x}" y="{b.y}" width="{b.w}" height="{b.h}" rx="6" fill="{b.fill}" stroke="{STROKE}" stroke-width="1.2"' + (' stroke-dasharray="5 3"' if b.dashed else "") + "/>")
            n = len(b.lines); y0 = b.y + b.h / 2 - n * LH / 2 + LH / 2
            for i, l in enumerate(b.lines):
                bold = b.bold_first and i == 0
                if b.align == "c": x, anc = b.x + b.w / 2, "middle"
                else: x, anc = b.x + PAD + 2, "start"
                o.append(f'<text x="{x:g}" y="{y0 + i * LH:g}" text-anchor="{anc}" dominant-baseline="central" fill="#0b0b0b"' + (' font-weight="bold"' if bold else "") + f'>{esc(l)}</text>')
        for t in s.texts:
            for i, l in enumerate(t["lines"]):
                o.append(f'<text x="{t["x"]:g}" y="{t["y"] + LH / 2 + i * LH:g}" text-anchor="{t["anchor"]}" dominant-baseline="central" fill="{t["color"]}"' + (' font-weight="bold"' if t["bold"] else "") + f'>{esc(l)}</text>')
        o.append("</svg>")
        return "\n".join(o)


def esc(t): return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def render_png(svg_path, png_path, H, scale=4):
    from playwright.sync_api import sync_playwright
    svg = open(svg_path, encoding="utf-8").read()
    css = (f"@font-face{{font-family:'TH Sarabun New';src:url('file://{FONT_R}');font-weight:normal}}"
           f"@font-face{{font-family:'TH Sarabun New';src:url('file://{FONT_B}');font-weight:bold}}")
    html = f"<html><head><style>{css} body{{margin:0}}</style></head><body>{svg}</body></html>"
    hp = svg_path + ".html"; open(hp, "w", encoding="utf-8").write(html)
    with sync_playwright() as p:
        br = p.chromium.launch(executable_path="/opt/pw-browsers/chromium") if os.path.exists("/opt/pw-browsers/chromium") else p.chromium.launch()
        pg = br.new_page(viewport={"width": W, "height": int(H)}, device_scale_factor=scale)
        pg.goto("file://" + hp); pg.wait_for_timeout(400)
        pg.evaluate("document.fonts.ready")
        pg.screenshot(path=png_path, clip={"x": 0, "y": 0, "width": W, "height": H})
        br.close()
    os.remove(hp)
