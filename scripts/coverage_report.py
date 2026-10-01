# -*- coding: utf-8 -*-
"""coverage_report.py — เขียน evidence/coverage_600_<DDMMMYY>.md จากไฟล์ผลจริง (Phase 1.7)
  python scripts/coverage_report.py [--before <coverage_simulation.json ก่อนแก้>] [--before-review <mapping_review_summary.json ก่อนแก้>]"""
import argparse, datetime, json, os
import pandas as pd
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
J = lambda *p: json.load(open(os.path.join(ROOT, *p), encoding="utf-8"))
ap = argparse.ArgumentParser(); ap.add_argument("--before"); ap.add_argument("--before-review"); a = ap.parse_args()
n = J("book", "numbers.json"); sim = J("evidence", "coverage_simulation.json"); dg = J("evidence", "coverage_diagnostics.json")
wi = J("evidence", "coverage_whatif.json")
adds = pd.read_csv(os.path.join(ROOT, "data", "corpus_additions.csv"), dtype=str, keep_default_na=False)
req = pd.read_csv(os.path.join(ROOT, "data", "requirements.csv"), dtype=str, keep_default_na=False)
d = datetime.date.today(); tag = d.strftime("%d%b%y").upper()
L = [f"# หลักฐานการครอบคลุม 600 ข้อกำหนด · {tag}", "",
     "> สร้างด้วย `python scripts/coverage_report.py` จาก `evidence/coverage_simulation.json`, `coverage_whatif.json`, `coverage_diagnostics.json` และ `book/numbers.json`",
     "> นิยาม (DEC-41): **ความครอบคลุมของคลัง** = ข้อกำหนดที่มีรายการ L1 ผ่าน C1–C5 และ URL ผ่านการตรวจ ≥ 1 รายการ · **ความครอบคลุมของแผนจำลอง** = ผลรวม 20 อาชีพของข้อที่แผนครอบคลุมเมื่อขาดทั้ง 30 ข้อ ที่ 6 เดือน 10 ชม./สัปดาห์ (Hmax " + n["Hmax_6m10h"] + " ชม.) แบบ both", "",
     "## 1 · สรุป Gate G-600", "",
     "| ตัวชี้วัด | ก่อน Phase 1 | ปัจจุบัน (นับได้จริง) | ถ้าผู้วิจัยยืนยันรายการใหม่ + URL ค้าง | เป้า |", "|---|---|---|---|---|"]
b = json.load(open(a.before, encoding="utf-8")) if a.before else None
br = json.load(open(a.before_review, encoding="utf-8")) if a.before_review else None
bp = next((x["covered"] for x in b["by_capacity"] if x["months"] == 6 and x["hours_per_week"] == 10), "–") if b else "–"
L.append(f"| ความครอบคลุมของคลัง | {br['requirements_with_passed_item'] if br else '–'} | {n['cov_corpus']} | {n['cov_whatif_corpus']} | 600 |")
L.append(f"| ความครอบคลุมของแผนจำลอง | {bp} | {n['cov_plan']} | {n['cov_whatif_plan']} | 600 |")
ok = n["cov_corpus"] == "600" and n["cov_plan"] == "600"
L += ["", f"**Gate G-600: {'ผ่าน' if ok else 'ยังไม่ผ่าน'}** · {n['cov_status_note']}", "",
      "ตามกติกาข้อ 2–3 ของ Prompt_Report รายการใหม่ยังไม่นับจนผู้วิจัยเปิดหน้าเว็บยืนยันเอง ตัวเลขในคอลัมน์ขวาสุดเป็นการจำลองเพื่อวางแผน ห้ามรายงานเป็นผลในเล่ม", "",
      "## 2 · สิ่งที่เปลี่ยนใน Phase 1", "",
      f"1. **DEC-43** รหัสรุ่นคลัง `{n['corpus_version']}`",
      f"2. **DEC-45** รายการพื้นฐาน 6 รายการ (DEC-18, URL ตรวจแล้ว) map กับทุกอาชีพที่มีองค์ประกอบเดียวกัน ไม่ใช่เฉพาะข้อที่ยังว่าง · เพิ่มความเชื่อมโยง L1 {n['foundation_ext_maps']} แถว · คลัง {n['corpus_items']} รายการ / mapping {n['map_total']} / ผ่านตรวจ {n['map_passed']}",
      f"3. **DEC-46** coverage track: รายการเรียนรู้ใหม่ {n['add_total']} รายการ (ชั่วโมง {n['add_hours_lo']}–{n['add_hours_hi']}) ที่ Claude เปิดหน้าเว็บจริง 1 ต.ค. 2569 · ยืนยันแล้ว {n['add_confirmed']} · รอผู้วิจัย {n['add_pending']} (`data/corpus_additions.csv`)",
      f"4. **DEC-47** เทียบวิธีเลือก weighted_greedy / coverage_first / ILP แล้วคงสมการ d_k (weighted_greedy)",
      f"5. ตรวจ URL ค้าง 28 URL ด้วยเบราว์เซอร์ → `evidence/url_check/url_check_01OCT26.md` (รอผู้วิจัยกรอก researcher_result {n['url_pending_urls']} URL)", "",
      "## 3 · เทียบวิธีเลือกรายการ (แผนจำลอง 6 เดือน 10 ชม./สัปดาห์ both)", "",
      "| สถานการณ์ | weighted_greedy | coverage_first | ILP (สูงสุดตามทฤษฎี) |", "|---|---|---|---|"]
for sc in ["current", "url_verified", "additions_confirmed", "url_and_additions"]:
    v = wi["scenarios"][sc]
    L.append(f"| {sc} | {v['weighted_greedy']['primary_6m10h_both']['covered']} | {v['coverage_first']['primary_6m10h_both']['covered']} | {dg['scenarios'][sc]['totals']['ilp']} |")
L += ["", "ILP ใช้เป็นตัวเทียบเท่านั้น เพราะ Code node ใน n8n ไม่มีตัวแก้ ILP และเมื่อมีรายการสั้นครบ ทั้งสองวิธีให้ผลเท่า ILP", "",
      "## 4 · ตัวชี้วัดรอง (ข้อมูลปัจจุบัน · รายงานตามจริง ไม่บังคับ 600)", "",
      "| เงื่อนไข | ครอบคลุม |", "|---|---|"]
for h in (5, 10, 15, 20):
    L.append(f"| 6 เดือน {h} ชม./สัปดาห์ both | {n['cov_plan'] if h == 10 else n['cov_plan_6m%dh' % h]} |")
for m in (12, 18, 24): L.append(f"| {m} เดือน 10 ชม./สัปดาห์ both | {n['cov_plan_%dm10h' % m]} |")
L += [f"| 6 เดือน 10 ชม. course_only | {n['sim_course_6m10h']} |", f"| 6 เดือน 10 ชม. certification_only | {n['sim_cert_6m10h']} |", "",
      "## 5 · ILP รายอาชีพ (ข้อมูลปัจจุบัน)", "", n["coverage_role_table"], "",
      f"ชั่วโมงขั้นต่ำเพื่อครอบคลุมทุกข้อของอาชีพหนึ่งอยู่ที่ {n['ilp_min_lo']}–{n['ilp_min_hi']} ชม. ทุกอาชีพเกิน Hmax ({n['ilp_fit_roles']}/20 อาชีพอยู่ใน Hmax) · ถ้ายืนยันรายการใหม่ครบจะเหลือ {n['ilp_min_lo_add']}–{n['ilp_min_hi_add']} ชม. ({n['ilp_fit_roles_add']}/20)", "",
      f"สาเหตุของข้อที่แผนจำลองยังไม่ครอบคลุม (ข้อมูลปัจจุบัน): ไม่มีรายการ {n['cause_no_item']} · ชั่วโมงไม่พอแม้เลือกแบบเหมาะที่สุด {n['cause_hours']} · ลำดับการเลือก {n['cause_selection']}", "",
      "## 6 · รายการใหม่ที่รอผู้วิจัยยืนยัน (👤)", "",
      "| รหัส | ชื่อ | ผู้ให้บริการ | ชม. | องค์ประกอบ O*NET | ข้อกำหนดที่ได้ | สิ่งที่ Claude เห็นบนหน้าเว็บ |", "|---|---|---|---|---|---|---|"]
names = dict(zip(req.element_id, req.element_name))
for f in adds.itertuples():
    els = f.elements.split("|"); nreq = int(req.element_id.isin(els).sum())
    L.append(f"| {f.key} | [{f.title}]({f.source_url}) | {f.provider} | {f.estimated_hours} | {'; '.join(e + ' ' + names.get(e, '') for e in els)} | {nreq} | {f.claude_page_evidence} |")
L += ["", "วิธียืนยัน: เปิด URL ด้วยตัวเอง ตรวจชื่อ ผู้ให้บริการ ชั่วโมง ราคา และเนื้อหาว่าสอนองค์ประกอบที่ระบุจริง → กรอก `researcher_result` = LIVE (หรือ DEAD) และ `researcher_checked_at` ใน `data/corpus_additions.csv` (แก้ด้วยโปรแกรมแก้ข้อความ) → ตัดองค์ประกอบที่ไม่เห็นด้วยออกจากคอลัมน์ `elements` ได้ → `python scripts/build_data_all.py` → `bash scripts/run_all_checks.sh` → `python scripts/coverage_report.py`"]
out = os.path.join(ROOT, "evidence", f"coverage_600_{tag}.md"); open(out, "w", encoding="utf-8").write("\n".join(L) + "\n"); print("เขียน", os.path.relpath(out, ROOT))
