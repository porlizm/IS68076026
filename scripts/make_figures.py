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
    d += f'wf [label="workflow เดียว\\nWF_IS68076026\\n7 ช่วง\\nengine.js + config/", fillcolor="{C["c"]}"]; }}\n'
    d += f'subgraph cluster_x {{ label="บริการภายนอก"; fontname="{FONT}"; fontsize={FS}; style="rounded,dashed"; color="#7a8aa6";\n'
    d += f'ocr [label="Document AI\\nอ่านข้อความจากภาพ", fillcolor="{C["b"]}"]; llm [label="โมเดล A B C\\nสามผู้ให้บริการ", fillcolor="{C["b"]}"]; }}\n'
    d += 'form -> sheets [style=dotted, constraint=false]; form -> drive [style=dotted, constraint=false];\n'
    d += 'sheets -> wf [dir=both]; drive -> wf [dir=both]; gmail -> wf [dir=back];\n'
    d += 'wf -> ocr; wf -> llm;\n}'
    render("fig_architecture", d, "สถาปัตยกรรมของระบบ", "แผนภาพสามส่วนจากซ้ายไปขวา: Google Workspace (Forms Sheets Drive Gmail) เชื่อมกับ workflow เดียวใน n8n ซึ่งเป็นจุดเดียวที่เรียก Document AI และโมเดลสามผู้ให้บริการ")


def fig_workflow():
    wf = J("workflows", "WF_IS68076026.json"); secs = wf["meta"]["is68"]["sections"]
    show = {"S1": ["Watch Form Responses", "Validate Form Rows", "Loop Over Requests", "Check PDF File"],
            "S2": ["Extract Text Layer", "Run Document AI OCR", "Mask Personal Data", "Save Masked Text"],
            "S3": ["Load Requirements", "Build Prompt", "Call Model A · B · C", "Record Model Calls"],
            "S4": ["Apply Rules R0-R4", "Record Findings", "Record Decisions"],
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
    d = head("TB", 'ranksep=0.32;')
    d += f'm [label="ผลตอบกลับของโมเดลหนึ่งชุด", fillcolor="{C["e"]}"];\n'
    d += 'r0 [label="1  R0  JSON ตรงรูปแบบ\\nรหัสอาชีพและข้อกำหนดตรง"]; r2 [label="2  R2  ข้อความที่ยกมา\\nปรากฏจริงในเอกสาร"];\n'
    d += 'r3 [label="3  R3  เกี่ยวข้องกับข้อกำหนด\\nคะแนน ov ≥ 0.15"]; r1 [label="4  R1  อย่างน้อย\\nสองเสียงตรงกัน", fillcolor="#e1ebf8"];\n'
    d += f'r4 [label="5  R4  บันทึกสัดส่วน\\nความเห็นตรงกัน", fillcolor="#e1ebf8"]; out [label="สถานะสุดท้าย\\nevidenced · partially · missing", fillcolor="{C["b"]}"];\n'
    d += f'x0 [label="ผลของโมเดลนี้\\nใช้ไม่ได้ทั้งชุด", fillcolor="{C["r"]}"]; x2 [label="เสียงนี้เป็น missing\\nนับใน U", fillcolor="{C["r"]}"]; x1 [label="ระบบยังสรุปไม่ได้\\n(abstained)", fillcolor="{C["c"]}"];\n'
    d += 'm -> r0; r0 -> r2 [label="ผ่าน"]; r2 -> r3 [label="ผ่าน"]; r3 -> r1 [label="รวมเสียงทุกโมเดล"]; r1 -> r4 [label="ผ่าน"]; r4 -> out;\n'
    d += 'r0 -> x0 [label="ไม่ผ่าน"]; r2 -> x2 [label="ไม่ผ่าน"]; r3 -> x2 [label="ไม่ผ่าน"]; x2 -> r1 [style=dashed]; r1 -> x1 [label="ไม่ผ่าน"];\n'
    d += '{rank=same; r0; x0;} {rank=same; r3; x2;} {rank=same; r1; x1;}\n}'
    render("fig_rules", d, "ลำดับการตรวจหลักฐานด้วยกฎ R0 ถึง R4", "ลำดับห้าขั้นจากบนลงล่าง R0 R2 R3 R1 R4 ด้านขวาแสดงผลเมื่อไม่ผ่าน: ผลทั้งชุดใช้ไม่ได้ เสียงเปลี่ยนเป็น missing หรือข้อกำหนดได้สถานะระบบยังสรุปไม่ได้")


if __name__ == "__main__":
    ensure_font(); os.makedirs(OUT, exist_ok=True)
    which = sys.argv[1:] or [k[4:] for k in list(globals()) if k.startswith("fig_")]
    old = J("book", "figures", "figures.json") if os.path.exists(os.path.join(OUT, "figures.json")) else {}
    for k in which: globals()["fig_" + k]()
    old.update(META)
    json.dump(old, open(os.path.join(OUT, "figures.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
