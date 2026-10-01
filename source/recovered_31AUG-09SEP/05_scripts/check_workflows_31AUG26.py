#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ตรวจ workflow JSON ใน 06_workflows/ — โครงสร้าง การเชื่อมโหนด และไวยากรณ์ JavaScript"""
import os, re, sys, json, glob, subprocess, tempfile
ROOT = os.path.dirname(os.path.abspath(__file__))
while not os.path.isdir(os.path.join(ROOT, "02_dataset")) and os.path.dirname(ROOT) != ROOT:
    ROOT = os.path.dirname(ROOT)
WD = os.path.join(ROOT, "06_workflows")
FORBID = ["gpt-5.5", "ChatGPT 5.5", "gemini-3.1", "Hybrid Verifier", "Verifier"]
bad = 0
for fn in sorted(glob.glob(os.path.join(WD, "*.json"))):
    d = json.load(open(fn, encoding="utf-8")); base = os.path.basename(fn)
    names = {n["name"] for n in d["nodes"]}
    miss = [t["node"] for v in d["connections"].values() for o in v["main"] for t in (o or [])
            if t["node"] not in names]
    tgt = {t["node"] for v in d["connections"].values() for o in v["main"] for t in (o or [])}
    orph = [n for n in names if n not in tgt and n not in d["connections"]]
    blob = json.dumps(d, ensure_ascii=False)
    hits = [w for w in FORBID if w in blob]
    js_bad = []
    for n in d["nodes"]:
        js = n["parameters"].get("jsCode")
        if not js: continue
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
            f.write("async function _w(){\n" + js + "\n}\n"); p = f.name
        if subprocess.run(["node", "--check", p], capture_output=True).returncode: js_bad.append(n["name"])
        os.unlink(p)
    ph = sorted(set(re.findall(r"__SET_[A-Z_]+__", blob)))
    print(f"{base:<34} {len(d['nodes']):>2} โหนด · เชื่อมผิด {len(miss)} · ลอย {len(orph)} · "
          f"JS ผิด {len(js_bad)} · คำต้องห้าม {len(hits)}")
    if ph: print("      placeholder ที่ต้องแทนค่า:", ", ".join(ph))
    for lbl, v in (("ปลายทางไม่พบ", miss), ("โหนดลอย", orph), ("JS ผิด", js_bad), ("คำต้องห้าม", hits)):
        if v: print(f"      {lbl}: {v}"); bad += 1
print("\nสรุป:", "ผ่าน" if not bad else f"ไม่ผ่าน {bad} ข้อ")
sys.exit(1 if bad else 0)
