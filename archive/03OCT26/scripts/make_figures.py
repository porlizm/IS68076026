# -*- coding: utf-8 -*-
"""
make_figures.py — สร้างรูปของเล่มจากข้อมูลและ workflow จริง (Phase 2.8 / 3) · ป้ายภาษาไทย TH Sarabun New
  python scripts/make_figures.py      -> book/figures/*.png (300 dpi) + book/figures/figures.json (ชื่อรูป alt text ความกว้างพิมพ์)
กติกา: กว้างพิมพ์ ≤ 14.65 ซม. · ตัวอักษรเมื่อพิมพ์ ≥ 12 pt (สคริปต์คำนวณจากขนาดจริงของภาพและหยุดถ้าไม่ผ่าน)
"""
import json, os, shutil, subprocess, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "book", "figures")
FONT = "TH Sarabun New"; FS = 24; DPI = 300; MAXW_CM = 14.65
J = lambda *p: json.load(open(os.path.join(ROOT, *p), encoding="utf-8"))
C = dict(a="#e8f0fb", b="#eaf6ee", c="#fdf3e3", d="#f6eaf6", e="#f2f2f2", r="#fbe9e9", line="#333333")


def ensure_font():
    home = os.path.expanduser("~/.fonts"); os.makedirs(home, exist_ok=True)
    src = os.path.join(ROOT, "assets", "fonts")
    for f in os.listdir(src) if os.path.isdir(src) else []:
        if f.endswith(".ttf") and not os.path.exists(os.path.join(home, f)): shutil.copy(os.path.join(src, f), home)
    subprocess.run(["fc-cache", "-f", home], capture_output=True)
    if "TH Sarabun New" not in subprocess.run(["fc-list"], capture_output=True, text=True).stdout:
        sys.exit("ไม่พบฟอนต์ TH Sarabun New (assets/fonts/)")


def head(rankdir="LR", extra=""):
    return (f'digraph G {{ rankdir={rankdir}; bgcolor="white"; pad=0.15; nodesep=0.35; ranksep=0.45; {extra}\n'
            f'node [shape=box, style="rounded,filled", fillcolor="{C["a"]}", color="{C["line"]}", penwidth=1.2, fontname="{FONT}", fontsize={FS}, margin="0.18,0.08"];\n'
            f'edge [color="{C["line"]}", penwidth=1.2, arrowsize=0.8, fontname="{FONT}", fontsize={FS - 2}];\n')


META = {}


def render(name, dot, caption, alt, min_fs=FS - 2):
    path = os.path.join(OUT, name + ".png")
    r = subprocess.run(["dot", "-Tpng:cairo", f"-Gdpi={DPI}", "-o", path], input=dot, text=True, capture_output=True)
    if r.returncode: sys.exit(f"{name}: {r.stderr}")
    w, h = Image.open(path).size
    nat_cm = w / DPI * 2.54
    width_cm = min(nat_cm, MAXW_CM)
    eff = min_fs * width_cm / nat_cm
    if eff < 12: sys.exit(f"{name}: ตัวอักษรเมื่อพิมพ์ {eff:.1f} pt < 12 pt (กว้างจริง {nat_cm:.1f} ซม.)")
    META[name] = dict(file=f"figures/{name}.png", caption=caption, alt=alt, width_cm=round(width_cm, 2), print_font_pt=round(eff, 1), px=[w, h])
    print(f"{name:28s} {w}x{h}px กว้างพิมพ์ {width_cm:.2f} ซม. ตัวอักษร {eff:.1f} pt")


def fig_architecture():
    d = head("LR", 'compound=true; ranksep=0.9;')
    d += f'subgraph cluster_g {{ label="Google Workspace\\nบัญชีของผู้วิจัย"; fontname="{FONT}"; fontsize={FS}; style="rounded,dashed"; color="#7a8aa6";\n'
    d += 'form [label="Google Forms\\nรับเรซูเมและเงื่อนไข"]; sheets [label="Google Sheets\\nฐานข้อมูลของระบบ"]; drive [label="Google Drive\\nไฟล์และรายงาน"]; gmail [label="Gmail\\nส่งรายงาน"]; }\n'
    d += f'subgraph cluster_n {{ label="n8n 2.39.9\\nในเครื่องผู้วิจัย"; fontname="{FONT}"; fontsize={FS}; style="rounded,dashed"; color="#7a8aa6";\n'
    d += f'wf [label="workflow เดียว\\n{J("workflows", "manifest.json")["workflow"]["file"][:-5]}\\n7 ช่วง\\nengine.js + config/", fillcolor="{C["c"]}"]; }}\n'
    d += f'subgraph cluster_x {{ label="บริการภายนอก"; fontname="{FONT}"; fontsize={FS}; style="rounded,dashed"; color="#7a8aa6";\n'
    d += f'ocr [label="Document AI\\nอ่านข้อความจากภาพ", fillcolor="{C["b"]}"]; llm [label="โมเดล A B C\\nสามผู้ให้บริการ", fillcolor="{C["b"]}"]; }}\n'
    d += 'form -> sheets [style=dotted, constraint=false]; form -> drive [style=dotted, constraint=false];\n'
    d += 'sheets -> wf [dir=both]; drive -> wf [dir=both]; gmail -> wf [dir=back];\n'
    d += 'wf -> ocr; wf -> llm;\n}'
    render("fig_architecture", d, "สถาปัตยกรรมของระบบ", "แผนภาพสามส่วนจากซ้ายไปขวา: Google Workspace (Forms Sheets Drive Gmail) เชื่อมกับ workflow เดียวใน n8n ซึ่งเป็นจุดเดียวที่เรียก Document AI และโมเดลสามผู้ให้บริการ")


def fig_workflow():
    wf = J("workflows", J("workflows", "manifest.json")["import"]); secs = wf["meta"]["is68"]["sections"]
    show = {"S1": ["Watch Form Responses", "Validate Form Rows", "Loop Over Requests", "Check PDF File"],
            "S2": ["Extract Text Layer", "Run Document AI OCR", "Mask Personal Data", "Save Masked Text"],
            "S3": ["Load Requirements", "Build Prompt", "Call Model A · B · C", "Record Model Calls"],
            "S4": ["Prepare Relevance Checks", "Call Verifier A · B · C", "Apply Rules R0-R7", "Record Decisions"],
            "S5": ["Build Learning Plan", "Record Plan Items", "Freeze Report Payload"],
            "S6": ["Render Thai Report", "Export Report PDF", "Send Report Email", "Record Delivery"],
            "S7": ["Catch Workflow Error", "Classify Error", "Mark Run Failed", "Notify Researcher"]}
    cols = [C["a"], C["b"], C["c"], C["d"], C["b"], C["a"], C["r"]]
    def box(i, span=1):
        sx = secs[i]
        body = "<br/>".join(f'<font point-size="{FS - 2}">{x}</font>' for x in show[sx["key"]])
        return (f'<td colspan="{span}" bgcolor="{cols[i]}" style="rounded" border="1" cellpadding="8">'
                f'<b>{i + 1} {sx["th"]}</b> <font point-size="{FS - 2}">({len(sx["nodes"])} โหนด)</font><br/>{body}</td>')
    A = lambda t: f'<td border="0"><font point-size="{FS + 6}">{t}</font></td>'
    E = '<td border="0"></td>'
    rows = [box(0) + A("→") + box(1), E + E + A("↓"), box(3) + A("←") + box(2), A("↓") + E + E, box(4) + A("→") + box(5),
            E + E + f'<td border="0"><font point-size="{FS - 2}">↺ วนกลับช่วงที่ 1 เพื่อทำงานถัดไป</font></td>',
            f'<td colspan="3" border="0"><font point-size="{FS - 2}">ข้อผิดพลาดจากทุกช่วงไปที่ช่วงที่ 7 ↓</font></td>', box(6, 3)]
    lab = '<<table border="0" cellspacing="6">' + "".join(f"<tr>{r}</tr>" for r in rows) + '</table>>'
    d = head("TB") + f'g [shape=plaintext, style="", label={lab}];\n}}'
    render("fig_workflow", d, f'ช่วงการทำงาน 7 ช่วงของ workflow {wf["name"]}', "เจ็ดกล่องเรียงตามลำดับงาน แต่ละกล่องระบุชื่อช่วง จำนวนโหนด และโหนดสำคัญ ช่วงที่หกวนกลับไปช่วงแรกเพื่อทำงานถัดไป ช่วงที่เจ็ดรับข้อผิดพลาด")


def fig_rules():
    d = head("TB", 'ranksep=0.30;')
    d += f'm [label="ผลตอบกลับของโมเดลหนึ่งชุด", fillcolor="{C["e"]}"];\n'
    d += 'r0 [label="1  R0  JSON ตรงรูปแบบ\\nรหัสอาชีพและรหัสข้อกำหนดอ้างอิงตรง"]; r2 [label="2  R2  ข้อความที่ยกมาปรากฏจริง\\n(ตรงตัว · ยุบช่องว่าง · ซ่อมรูปคำ)"];\n'
    d += 'r3a [label="3  R3a  คำตรงกับข้อกำหนดอ้างอิง\\nคะแนน ov ≥ 0.15"]; r3b [label="4  R3b  โมเดลอื่นตรวจความหมาย\\nรองรับ · บางส่วน · ไม่เกี่ยว"];\n'
    d += 'r1 [label="5  R1  อย่างน้อยสองเสียงตรงกัน\\n(ไม่นับเสียงที่ตรวจไม่ได้)", fillcolor="#e1ebf8"]; r4 [label="6  R4  บันทึกสัดส่วน\\nความเห็นตรงกัน", fillcolor="#e1ebf8"];\n'
    d += f'r5 [label="7  R5 R6  ใบรับรองในเรซูเม ·\\nทักษะพื้นฐานจากกิจกรรม → partially", fillcolor="#e1ebf8"]; out [label="สถานะสุดท้าย\\nevidenced · partially · missing · abstained", fillcolor="{C["b"]}"];\n'
    d += f'x0 [label="ผลของโมเดลนี้\\nใช้ไม่ได้ทั้งชุด", fillcolor="{C["r"]}"]; x2 [label="เสียงนี้เป็น missing\\nนับใน U", fillcolor="{C["r"]}"]; xu [label="เสียงที่ตรวจไม่ได้\\nไม่นับ", fillcolor="{C["c"]}"]; x1 [label="ระบบยังสรุปไม่ได้\\n(abstained)", fillcolor="{C["c"]}"];\n'
    d += 'm -> r0; r0 -> r2 [label="ผ่าน"]; r2 -> r3a [label="ผ่าน"]; r3a -> r1 [label="ผ่าน · รวมเสียง"]; r3a -> r3b [label="คำไม่ตรง"]; r3b -> r1 [label="รองรับ"]; r1 -> r4 [label="ผ่าน"]; r4 -> r5; r5 -> out;\n'
    d += 'r0 -> x0 [label="ไม่ผ่าน"]; r2 -> x2 [label="ไม่ผ่าน"]; r3b -> x2 [label="ไม่เกี่ยว"]; r3b -> xu [label="ไม่ตอบ"]; x2 -> r1 [style=dashed]; r1 -> x1 [label="ไม่ผ่าน"]; x1 -> r5 [style=dashed];\n'
    d += '{rank=same; r0; x0;} {rank=same; r2; x2;} {rank=same; r3b; xu;} {rank=same; r1; x1;}\n}'
    render("fig_rules", d, "ลำดับการตรวจหลักฐานด้วยกฎ R0 ถึง R6", "ลำดับจากบนลงล่าง R0 R2 R3a R3b R1 R4 R5 R6 ด้านขวาแสดงผลเมื่อไม่ผ่าน: ผลทั้งชุดใช้ไม่ได้ เสียงเปลี่ยนเป็น missing เสียงที่ตรวจไม่ได้ไม่ถูกนับ หรือข้อกำหนดอ้างอิงได้สถานะระบบยังสรุปไม่ได้ ข้อที่ยัง missing หรือ abstained อาจได้ partially จาก R5 R6")


def fig_framework():
    d = head("TB", 'ranksep=0.35;')
    d += f'i [label="ข้อมูลเข้า\\nเรซูเม PDF\\nอาชีพเป้าหมาย\\nเวลาที่เรียนได้", fillcolor="{C["e"]}"];\n'
    d += 'a [label="วิเคราะห์หลักฐาน\\nโมเดล 3 ตัวอ่านแยกกัน\\nยกข้อความจากเอกสาร"];\n'
    d += 'v [label="ตรวจด้วยกฎ R0–R6\\nคำ + ความหมาย · รวมเสียง ≥ 2\\nแยกสถานะยังสรุปไม่ได้"];\n'
    d += f'p [label="จัดแผนการเรียนรู้\\nคลังที่ตรึงไว้\\nภายใน Hmax", fillcolor="{C["c"]}"];\n'
    d += f'o [label="รายงานรายบุคคล\\nสถานะรายข้อ + หลักฐาน\\nแผนและเหตุผล", fillcolor="{C["b"]}"];\n'
    d += f'q1 [shape=note, fillcolor="{C["d"]}", label="RQ1 ความถูกต้อง\\nของสถานะ"]; q2 [shape=note, fillcolor="{C["d"]}", label="RQ2 ความเหมาะสม\\nของแผน 5 มิติ"];\n'
    d += 'i -> a -> v -> p -> o; v -> q1 [style=dashed, arrowhead=none]; o -> q2 [style=dashed, arrowhead=none];\n'
    d += 'r [shape=note, fillcolor="#ffffff", label="ข้อกำหนดอ้างอิง 600 ข้อ\\nO*NET 31.0"]; r -> a [style=dotted]; r -> v [style=dotted]; {rank=same; a; r;} {rank=same; v; q1;} {rank=same; o; q2;}\n}'
    render("fig_framework", d, "กรอบแนวคิดของการศึกษา", "ห้ากล่องเรียงซ้ายไปขวา ข้อมูลเข้า วิเคราะห์หลักฐาน ตรวจด้วยกฎ จัดแผน รายงาน โดยคำถามการวิจัยข้อ 1 ผูกกับขั้นตรวจ และข้อ 2 ผูกกับรายงานและแผน", min_fs=FS - 2)


def fig_process():
    d = head("TB", 'ranksep=0.28;')
    st = [("กำหนดนิยาม เกณฑ์ และตัวชี้วัดก่อนเก็บข้อมูล", "a"), ("สร้างข้อมูลอ้างอิงและระบบ\\nทดสอบด้วยเทสต์อัตโนมัติและเรซูเมสังเคราะห์", "a"),
          ("ยื่นขอรับรองจริยธรรม", "c"), ("ทดลองนำร่อง 5 คน ปรับถ้อยคำและเกณฑ์", "b"), ("ตรึงรุ่น prompt กฎ เกณฑ์ คลัง และแบบประเมิน", "b"),
          ("เก็บข้อมูลกลุ่มหลัก 30 คน\\nให้รหัสชุดคำตอบอ้างอิงโดยไม่เห็นผลระบบ", "b"), ("วิเคราะห์ RQ1 และ RQ2 · เขียนบทที่ 4–5", "b")]
    for i, (t, c) in enumerate(st): d += f's{i} [label="{i + 1}  {t}", fillcolor="{C[c]}"];\n'
    d += " -> ".join(f"s{i}" for i in range(len(st))) + ";\n"
    d += '}'
    render("fig_process", d, "ขั้นตอนการดำเนินการวิจัย", "เจ็ดขั้นเรียงบนลงล่าง สีฟ้าคือสองขั้นที่ทำในเล่มนี้ สีเหลืองคือการยื่นจริยธรรม สีเขียวคือขั้นที่ทำหลังได้หนังสือรับรอง")


def fig_requirements():
    d = head("TB", 'ranksep=0.28;')
    d += f'a [label="O*NET 31.0 · 20 อาชีพไอที", fillcolor="{C["e"]}"]; b [label="เลือกองค์ประกอบที่ IM ≥ 3.0"];\n'
    d += 'c [label="ใช้ 4 โดเมน\\nWork Activities · Essential Skills · Transferable Skills · Knowledge"]; e [label="โควตาโดเมนละอย่างน้อย 3 ข้อ"];\n'
    d += 'f [label="เรียง IM จากมากไปน้อย · เท่ากันใช้รหัสองค์ประกอบ\\nเลือก 30 ข้อแรกต่ออาชีพ"]; g [label="น้ำหนัก w = IM ÷ ผลรวม IM ของ 30 ข้อ"];\n'
    d += f'h [label="ข้อกำหนดอ้างอิง 600 ข้อ  ONET31.0-IS68076026-v1.0", fillcolor="{C["b"]}"]; x [label="ไม่ใช้ Abilities", fillcolor="{C["r"]}"];\n'
    d += 'a -> b -> c -> e -> f -> g -> h; c -> x [style=dashed]; {rank=same; c; x;}\n}'
    render("fig_requirements", d, "การคัดข้อกำหนดอ้างอิงจาก O*NET 31.0", "ขั้นตอนเจ็ดขั้นจากฐานข้อมูล O*NET 31.0 ถึงข้อกำหนดอ้างอิง 600 ข้อ มีกล่องข้างแสดงว่าไม่ใช้กลุ่ม Abilities")


def fig_coding():
    d = head("TB", 'ranksep=0.35;')
    d += f'pdf [label="PDF ต้นฉบับ\\nของผู้เข้าร่วม", fillcolor="{C["e"]}"]; sheet [label="ไฟล์ให้รหัส\\nเอกสาร + ข้อกำหนดอ้างอิง 30 ข้อ\\nไม่มีคอลัมน์ผลระบบ"];\n'
    d += 'c1 [label="ผู้ให้รหัสคนที่ 1\\nผู้วิจัย · ทุกคน"]; c2 [label="ผู้ตรวจคนที่ 2\\n≥ 20% · 6 คน 180 รายการ"];\n'
    d += f'k [label="κ ≥ 0.61\\nหาข้อยุติ เก็บรหัสเดิม", fillcolor="{C["c"]}"]; gt [label="ชุดคำตอบอ้างอิง\\n3 สถานะ", fillcolor="{C["b"]}"];\n'
    d += f'sys [label="ผลของระบบ\\n(เปิดหลังให้รหัสรอบแรก)", fillcolor="{C["d"]}"]; m [label="Macro-F1\\nอัตราการไม่สรุป", fillcolor="{C["b"]}"];\n'
    d += 'pdf -> sheet; sheet -> c1; sheet -> c2; c1 -> k; c2 -> k; k -> gt; gt -> m; sys -> m;\n}'
    render("fig_coding", d, "การจัดทำชุดคำตอบอ้างอิงโดยไม่เห็นผลของระบบ", "เอกสารต้นฉบับเข้าสู่ไฟล์ให้รหัสที่ไม่มีผลระบบ ผู้ให้รหัสสองคนให้รหัสแยกกัน ตรวจความสอดคล้องด้วย kappa แล้วจึงเทียบกับผลของระบบ")


def fig_evaluation():
    d = head("TB", 'ranksep=0.35;')
    d += f'run [label="หนึ่งรอบการวิเคราะห์ของผู้เข้าร่วมหนึ่งคน", fillcolor="{C["e"]}"];\n'
    d += 'dec [label="สถานะสุดท้าย 30 ข้อ"]; plan [label="แผนที่ส่งให้ผู้เข้าร่วมจริง"];\n'
    d += f'q1 [label="RQ1\\nเทียบชุดคำตอบอ้างอิง\\nF1 รายสถานะ · Macro-F1\\nอัตราการไม่สรุป", fillcolor="{C["d"]}"];\n'
    d += f'q2 [label="RQ2\\nตรงประเด็น · ครอบคลุมช่องว่าง\\nข้อมูลรายการถูกต้อง · เวลาเป็นไปได้\\nประโยชน์ที่ผู้เรียนรับรู้", fillcolor="{C["d"]}"];\n'
    d += 'run -> dec; run -> plan; dec -> q1; plan -> q2; dec -> plan [style=dashed, label="ช่องว่างของระบบ"];\n}'
    render("fig_evaluation", d, "แบบแผนการประเมินตามคำถามการวิจัยสองข้อ", "ผลการวิเคราะห์หนึ่งรอบแยกเป็นสถานะสุดท้ายซึ่งใช้ตอบคำถามข้อ 1 และแผนการเรียนรู้ซึ่งใช้ตอบคำถามข้อ 2")


def fig_coverage():
    # วาดด้วย PIL + libraqm (จัดสระและวรรณยุกต์ไทยถูกต้อง) · สีตามชุดสีอ้างอิงของ dataviz: series-1 #2a78d6 · ตัวอักษร #0b0b0b/#52514e
    from PIL import ImageDraw, ImageFont
    sim = J("evidence", "coverage_simulation.json")
    rows = [(f"6 เดือน", f"{x['hours_per_week']} ชม.", x["covered"]) for x in sim["by_capacity"]] + [(f"{x['months']} เดือน", "10 ชม.", x["covered"]) for x in sim["by_months_10h"]]
    W, H = int(14.6 / 2.54 * DPI), int(8.6 / 2.54 * DPI)
    pt = lambda p: int(round(p / 72 * DPI))
    fr = ImageFont.truetype(os.path.join(ROOT, "assets", "fonts", "THSarabunNew.ttf"), pt(14), layout_engine=ImageFont.Layout.RAQM)
    im = Image.new("RGB", (W, H), "white"); dr = ImageDraw.Draw(im)
    L, R, T, B = pt(54), W - pt(8), pt(20), H - pt(46)
    ymax = 640; y = lambda v: B - (B - T) * v / ymax
    for g in range(0, 601, 100):
        dr.line([(L, y(g)), (R, y(g))], fill="#e6e6e3", width=2)
        dr.text((L - pt(6), y(g)), f"{g}", font=fr, fill="#52514e", anchor="rm")
    dr.line([(L, T), (L, B)], fill="#52514e", width=2); dr.line([(L, B), (R, B)], fill="#52514e", width=2)
    n_ = len(rows); slot = (R - L) / n_; bw = slot * 0.58
    for i, (a1, a2, v) in enumerate(rows):
        cx = L + slot * (i + 0.5)
        dr.rounded_rectangle([cx - bw / 2, y(v), cx + bw / 2, B], radius=6, fill="#2a78d6")
        dr.rectangle([cx - bw / 2, y(v) + 8, cx + bw / 2, B], fill="#2a78d6")
        dr.text((cx, y(v) + pt(4)), f"{v}", font=fr, fill="#ffffff", anchor="mt")
        dr.text((cx, B + pt(4)), a1, font=fr, fill="#0b0b0b", anchor="mt"); dr.text((cx, B + pt(22)), a2, font=fr, fill="#52514e", anchor="mt")
    yy = y(600)
    for x0 in range(int(L), int(R), 24): dr.line([(x0, yy), (min(x0 + 12, R), yy)], fill="#52514e", width=2)
    dr.text((L + slot * 0.5, yy - pt(2)), "เป้า 600", font=fr, fill="#52514e", anchor="mb")
    lab = Image.new("RGBA", (pt(260), pt(22)), (255, 255, 255, 0)); ImageDraw.Draw(lab).text((lab.width / 2, lab.height / 2), "ข้อกำหนดอ้างอิงที่แผนจำลองครอบคลุม", font=fr, fill="#0b0b0b", anchor="mm")
    lab = lab.rotate(90, expand=True); im.paste(lab, (pt(2), int((T + B) / 2 - lab.height / 2)), lab)
    path = os.path.join(OUT, "fig_coverage.png"); im.save(path, dpi=(DPI, DPI))
    META["fig_coverage"] = dict(file="figures/fig_coverage.png", caption="ความครอบคลุมของแผนจำลองตามกรอบเวลาและชั่วโมงเรียนต่อสัปดาห์ (ข้อมูลที่นับได้จริง)",
                                alt="กราฟแท่งเจ็ดแท่ง แต่ละแท่งคือจำนวนข้อกำหนดอ้างอิงที่แผนจำลองครอบคลุมในเงื่อนไขหนึ่ง เส้นประแสดงเป้า 600 ข้อ", width_cm=14.6, print_font_pt=14.0, px=[W, H])
    print(f"fig_coverage                 {W}x{H}px กว้างพิมพ์ 14.60 ซม. ตัวอักษร 14 pt")

if __name__ == "__main__":
    ensure_font(); os.makedirs(OUT, exist_ok=True)
    which = sys.argv[1:] or [k[4:] for k in list(globals()) if k.startswith("fig_")]
    old = J("book", "figures", "figures.json") if os.path.exists(os.path.join(OUT, "figures.json")) else {}
    for k in which: globals()["fig_" + k]()
    old.update(META)
    json.dump(old, open(os.path.join(OUT, "figures.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
