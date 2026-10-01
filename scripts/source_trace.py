# -*- coding: utf-8 -*-
"""
source_trace.py — สร้าง evidence/Source_Trace.md: ทุก {{key}} และทุกการอ้างอิงในเล่ม → แหล่งที่มา (Prompt_Report หัวข้อ 1 และ 10 ข้อ ก)

  python scripts/source_trace.py      (รันหลัง scripts/book_numbers.py)

แหล่งที่มาของแต่ละ key ระบุตามกลุ่มชื่อ key ใน SOURCES (ตรงกับที่ scripts/book_numbers.py อ่าน)
ถ้ามี key ที่ไม่เข้ากลุ่มใด สคริปต์จะล้ม เพื่อบังคับให้เพิ่มแหล่งที่มาก่อนใช้ในเล่ม
"""
import datetime, glob, json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SOURCES = [  # (regex ของ key, แหล่งข้อมูล, สคริปต์/ฟังก์ชันที่คำนวณ, DEC)
    (r"^(cov_corpus|cov_corpus_gap|cov_plan|cov_plan_gap|cov_plan_\d+m\d+h|cov_plan_mean_\w+|sim_\w+|Hmax_\w+|plan_strategy)$",
     "evidence/coverage_simulation.json", "scripts/simulate_coverage.mjs → engine.buildPlan (กรณีเลวร้ายที่สุด)", "DEC-41 · DEC-47"),
    (r"^(cov_whatif_\w+|cov_plan_cf)$", "evidence/coverage_whatif.json", "scripts/simulate_coverage.mjs --what-if (สถานการณ์สมมติ)", "DEC-46 · DEC-47"),
    (r"^(ilp_\w+|cause_\w+)$", "evidence/coverage_diagnostics.json", "scripts/coverage_diagnostics.py (PuLP/CBC · ilp_min_*, ilp_max_cov, cause_* ใช้ฉาก before_track)", "DEC-41 · DEC-47"),
    (r"^(cov_status_note|cov_24m_note|coverage_role_table)$", "evidence/coverage_simulation.json + coverage_diagnostics.json", "scripts/book_numbers.py (ประโยคที่สร้างจากตัวเลข)", "DEC-41"),
    (r"^(add_\w+|additions_table)$", "data/corpus_additions.csv", "scripts/book_numbers.py (นับ researcher_result)", "DEC-46"),
    (r"^(foundation_\w+)$", "data/corpus.csv · data/mappings.csv · data/corpus_change_log.csv", "scripts/build_corpus.py (foundation track)", "DEC-45"),
    (r"^(c[ABC]_\w+|synthetic_table)$", "evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv", "scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง)", "—"),
    (r"^(map_\w+|items_in_passed|req_covered|req_uncovered\w*|per_role_\w+|promoted|review_date_th)$",
     "evidence/mapping_review_summary.json · data/mappings.csv", "scripts/review_mappings.py (เกณฑ์ C1–C5)", "DEC-11 · DEC-21"),
    (r"^(corpus_\w+|hours_\w+|course_hours_mean|cert_hours_mean|url_pending_items)$", "data/corpus.csv · data/manifest.json", "scripts/build_corpus.py", "DEC-43"),
    (r"^(url_pending_urls)$", "data/url_manual_check.csv", "นับแถวที่ researcher_result ยังว่าง", "DEC-16"),
    (r"^(dom_\w+|domain_table|req_r01_table|wsp_\w+)$", "data/requirements.csv", "scripts/build_reference_data.py", "—"),
    (r"^(roles_\w+|soc_proxy_table)$", "data/roles.json", "scripts/build_reference_data.py", "—"),
    (r"^(tests_\w+)$", "evidence/test_summary.json", "bash scripts/run_all_checks.sh (node --test)", "—"),
    (r"^(wf_\w+|n8n_version|engine_version|trace_rows)$", "workflows/manifest.json · workflows/WF_IS_68076026_01OCT26.json · evidence/WF_analysis.md",
     "scripts/build_workflows.mjs · scripts/validate_workflows.mjs", "DEC-42 · DEC-48"),
    (r"^(n8n_cases|n8n_pass)$", "evidence/n8n_test_summary.json · evidence/n8n_test_01OCT26.md", "evidence/n8n_s6/s6_suite.py + make_report.py (n8n 2.39.9 จริง · บริการจำลอง)", "DEC-48"),
    (r"^(retry_backoff_text)$", "config/models.json (defaults.retry_backoff_ms)", "scripts/book_numbers.py", "DEC-48"),
    (r"^(tabs_\w+|data_dictionary)$", "config/sheets.json", "scripts/book_numbers.py", "—"),
    (r"^(config_table|theta|retention_days|deletion_contact|text_layer_min_chars)$", "config/project.json · config/models.json", "scripts/book_numbers.py", "—"),
    (r"^(manifest_\w+)$", "data/manifest.json", "scripts/update_manifest.py", "—"),
]


def src_of(k):
    for pat, f, how, dec in SOURCES:
        if re.match(pat, k): return f, how, dec
    return None


def main():
    nums = json.load(open(os.path.join(ROOT, "book", "numbers.json"), encoding="utf-8"))
    files = [f for f in sorted(glob.glob(os.path.join(ROOT, "book", "0*.md"))) if "outline" not in f and "fact_sheet" not in f]
    used, cites = {}, {}
    for f in files:
        t = re.sub(r"<!--.*?-->", "", open(f, encoding="utf-8").read(), flags=re.S)
        for k in re.findall(r"\{\{(\w+)\}\}", t): used.setdefault(k, set()).add(os.path.basename(f))
        for k in re.findall(r"\[@(\w+)\]", t): cites.setdefault(k, set()).add(os.path.basename(f))
    unknown = [k for k in used if src_of(k) is None]
    missing = [k for k in used if k not in nums]
    if unknown or missing: sys.exit(f"key ไม่มีแหล่งที่มา {unknown} · ไม่มีใน numbers.json {missing}")
    refs = dict(re.findall(r"^\[@(\w+)\]\s+(.+)$", open(os.path.join(ROOT, "book", "04_references.md"), encoding="utf-8").read(), re.M))
    L = ["# Source Trace · เล่ม IS 68076026 (Final)", "",
         f"> สร้างโดย `scripts/source_trace.py` เมื่อ {datetime.date.today().isoformat()} · ใช้แทน Change Log เทียบเล่มเดิม (Prompt_Report หัวข้อ 1)",
         "> ตัวเลขผลลัพธ์ทุกค่าในเล่มมาจาก `{{key}}` ใน `book/numbers.json` ซึ่ง `scripts/book_numbers.py` อ่านจากไฟล์ด้านล่าง", "",
         f"## 1 · ตัวเลขและตารางที่สร้างจากข้อมูล ({len(used)} key)", "",
         "| key | ค่าในเล่ม | ใช้ในไฟล์ | แหล่งข้อมูล | คำนวณโดย | DEC |", "|---|---|---|---|---|---|"]
    for k in sorted(used):
        v = str(nums[k]).replace("\n", " ").replace("|", "/")
        v = v if len(v) <= 60 else (f"ตาราง {str(nums[k]).count(chr(10)) - 1} แถว" if str(nums[k]).startswith("|") else v[:57] + "…")
        f, how, dec = src_of(k)
        L.append(f"| `{k}` | {v} | {', '.join(sorted(used[k]))} | `{f}` | {how} | {dec} |")
    L += ["", "## 2 · ค่าคงที่ของการออกแบบที่เขียนเป็นตัวอักษรในเล่ม", "",
          "ค่าเหล่านี้เป็นข้อกำหนดของงานวิจัย ไม่ใช่ผลลัพธ์ จึงพิมพ์ตรงได้ ทุกค่ามีแหล่งใน `book/00_fact_sheet.md`", "",
          "| ค่า | ความหมาย | แหล่ง |", "|---|---|---|",
          "| 20 อาชีพ · 30 ข้อ · 600 ข้อ | ขอบเขตข้อกำหนดอ้างอิง | fact sheet F5 · data/requirements.csv |",
          "| 3 โมเดล · อย่างน้อย 2 โมเดลเห็นตรงกัน | การรวมผล R1 · min_usable_models | fact sheet F13 · config/project.json |",
          "| θ = 0.15 · เพดาน 25 คำ · คำพ้อง ≥ 4 อักขระ | กฎ R3 สมการที่ 3.2 | fact sheet F13–F14 · config/project.json · engine.js |",
          "| 6/12/18/24 เดือน · 4.33 สัปดาห์ต่อเดือน | H_max สมการที่ 3.7 | fact sheet F14–F15 · engine.capacityHours |",
          "| PDF ≤ 10 MB ≤ 5 หน้า | เงื่อนไขไฟล์ | fact sheet F5 · config/project.json |",
          "| นำร่อง 5 คน · กลุ่มหลัก 30 คน · κ ≥ 0.61 | แผนการประเมิน | fact sheet F18 · DEC-32 |",
          "| เก็บข้อมูล 90 วัน | จริยธรรมและ PDPA | fact sheet F19 · config/project.json (retention_days) |", "",
          f"## 3 · เอกสารอ้างอิง ({len(cites)} รายการ · ตรวจว่ามีจริงเมื่อ 1 ต.ค. 2569)", "",
          "| key | อ้างในไฟล์ | รายการ (ย่อ) |", "|---|---|---|"]
    for k in cites:
        L.append(f"| `{k}` | {', '.join(sorted(cites[k]))} | {refs.get(k, '⚠ ไม่มีในรายการ')[:110].replace('|', '/')} |")
    L += ["", "## 4 · จุดที่แหล่งข้อมูลขัดกันและวิธีตัดสิน", "",
          "| เรื่อง | แหล่ง A | แหล่ง B | ใช้ค่า | เหตุผล |", "|---|---|---|---|---|",
          f"| จำนวนรายการในคลัง | Prompt_Report ภาคผนวก ก: 571 | numbers.json: {nums['corpus_items']} | numbers.json | คลังรุ่น v1.5 เพิ่มรายการพื้นฐาน (DEC-45) และ Prompt สั่งให้เชื่อ numbers.json |",
          f"| จำนวน mapping | Prompt_Report: 6,883 | numbers.json: {nums['map_total']} | numbers.json | สร้างใหม่จาก build_corpus.py รุ่น v1.5 |",
          f"| แผนจำลอง 6 เดือน 10 ชม. | Prompt_Report: 489 | numbers.json: {nums['cov_plan']} | numbers.json | ขยายรายการพื้นฐานไปทุกอาชีพ (DEC-45) · ยังไม่รวมรายการใหม่ที่รอผู้วิจัยยืนยัน (DEC-46) |",
          f"| ความครอบคลุมของคลัง | เป้า 600 (DEC-41) | numbers.json: {nums['cov_corpus']} | numbers.json | ห้ามนับรายการที่ยังไม่ยืนยัน (กติกาข้อ 2–3) · เล่มรายงานตามจริงผ่าน cov_status_note |",
          "| ผลของ de Quadros et al. | fact sheet F2: ต่างกันอย่างมีนัยสำคัญ | — | เขียนว่า ให้ผลต่างกัน | ไม่ได้ตรวจการทดสอบสถิติในต้นฉบับ จึงไม่ใช้คำว่ามีนัยสำคัญ (Prompt_Report 8.2) |",
          "| เลขเทสต์ | Prompt_Report: 51 ผ่าน (รุ่น WF_Final_IS) | numbers.json: " + f"{nums['tests_pass']}/{nums['tests_total']}" + " | numbers.json | เพิ่มเทสต์ workflow เดียวและ plan_strategy ใน Phase 2 |", ""]
    open(os.path.join(ROOT, "evidence", "Source_Trace.md"), "w", encoding="utf-8").write("\n".join(L))
    print(f"เขียน evidence/Source_Trace.md · key {len(used)} · อ้างอิง {len(cites)}")


if __name__ == "__main__":
    main()
