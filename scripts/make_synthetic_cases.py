# -*- coding: utf-8 -*-
"""
make_synthetic_cases.py — ชุดทดสอบสังเคราะห์สามกรณี (หัวข้อ 3.7) สร้างตามลำดับที่กันเฉลยรั่ว

  ขั้น 1  กำหนดเฉลย: ข้อกำหนดใดควรได้สถานะใด และหลักฐานอยู่ในประโยคใด     -> answer_key.csv
  ขั้น 2  ประกอบประโยคขึ้นจากเฉลย (ประโยคเดียวต่อข้อกำหนดที่ไม่ใช่ missing)   -> resume.txt
  ขั้น 3  บันทึกตำแหน่งตัวอักษรของหลักฐานในข้อความหลังเตรียมข้อความ+ปิดบัง  -> answer_key.csv
  ขั้น 4  แปลงเป็น PDF สองแบบ: มีชั้นข้อความ และสแกนภาพล้วน (สัญญาณรบกวน + เอียง)
  ขั้น 5  ผลตอบกลับจำลองของโมเดล A/B/C (mock_responses/) สร้างจากเฉลยด้วยการเบี่ยงเบนที่ประกาศไว้

เฉลยเก็บแยกจาก prompt และไม่ถูกส่งเข้าโมเดลใด · ข้อมูลทั้งหมดเป็นบุคคลสมมติ
กรณี A: R01 ผู้พัฒนาซอฟต์แวร์ หลักฐานชัดหลายข้อ
กรณี B: R06 สายข้อมูล เรซูเมสั้น หลักฐานน้อย
กรณี C: R18 นักวิเคราะห์ระบบ ไฟล์สแกน + โมเดล C ตอบ 429 ทุกครั้ง (เหลือ 2 โมเดล)
กรณี D: R19 ผู้จัดการโครงการไอที เขียนแบบเน้นผลงานและตัวเลข (ภาษาไม่ตรงกับ O*NET) — DEC-51/52/57
        ใช้ทดสอบ R3 สองชั้น การซ่อม quote ฐานขั้นต่ำ R5 และกรณีผู้ตรวจตอบผิดรูปแบบ

รุ่น 3 ต.ค. 2569 (DEC-53/55): ผลตอบกลับจำลองเป็น analyst_v1.1 (quotes · evidence_type · task_assessments)
  task_key.csv = เฉลยงานหลักของอาชีพ · mock_responses/verifier.json = ผู้ตรวจจำลองแบบ oracle จากเฉลย (scripts/run_local.mjs)
"""
import csv, json, os, random, sys
import pandas as pd

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "synthetic")
sys.path.insert(0, os.path.join(ROOT, "scripts", "lib"))

HEADER = {
    "A": ("Somchai Example", "somchai.example@mail.test", "+66 81 234 5678", "linkedin.com/in/somchai-example",
          "Backend Software Engineer"),
    "B": ("Warunee Sample", "warunee.sample@mail.test", "089-765-4321", "github.com/warunee-sample", "Junior Data Analyst"),
    "C": ("Kittipong Mock", "kittipong.mock@mail.test", "02 123 4567", "https://www.linkedin.com/in/kittipong-mock",
          "IT Systems / Business Analyst"),
    "D": ("Napat Sample", "napat.sample@mail.test", "+66 86 555 0199", "linkedin.com/in/napat-sample",
          "Senior IT Project Manager"),
}

# ---------------- ขั้น 1–2: เฉลยและประโยคหลักฐาน ----------------
# (element_id, status, sentence)  sentence ต้องมีคำพ้อง (alias) หรือคำจากชื่อ/คำอธิบายองค์ประกอบ
KEY = {
 "A": ("R01", [
  ("2.B.3.e", "evidenced", "Built and deployed a Python programming service for batch data processing used by 40 internal teams."),
  ("4.A.3.b.1", "evidenced", "Configured Linux servers and set up computer systems networks for the staging and production environments."),
  ("2.C.3.a", "evidenced", "Maintained operating system images and server hardware inventory for 120 Linux and Windows hosts."),
  ("4.A.2.a.2", "evidenced", "Designed an ETL pipeline that transformed data from five source systems into a PostgreSQL warehouse."),
  ("4.A.2.b.1", "evidenced", "Diagnosed production problems during on-call rotations and applied problem solving to restore service within SLA."),
  ("2.B.2.i", "evidenced", "Debugged memory leaks in a Java microservice and resolved the incident by performing root cause analysis with heap dumps."),
  ("2.B.3.b", "evidenced", "Led the system design of an event-driven order service and wrote the technical design document reviewed by architects."),
  ("4.A.2.b.2", "evidenced", "Designed databases and REST APIs for a new loyalty application from scratch."),
  ("4.A.3.b.6", "evidenced", "Wrote documentation and runbooks for deployment procedures that reduced onboarding time for new engineers."),
  ("4.A.1.a.2", "evidenced", "Set up observability dashboards and alerting in Grafana and monitored systems for latency regressions."),
  ("2.B.4.h", "evidenced", "Ran benchmarking and load tests to measure system performance before each quarterly release."),
  ("4.A.2.a.4", "evidenced", "Analyzed API latency data and query plans to identify slow endpoints, improving p95 response time by 35 percent."),
  ("4.A.4.a.2", "evidenced", "Coordinated with product owners and QA peers in daily stand-up meetings to report progress and blockers."),
  ("4.A.2.b.6", "evidenced", "Organized sprint backlog grooming and prioritized technical debt items with the team lead."),
  ("2.B.4.g", "evidenced", "Performed impact analysis and data flow modelling before migrating the monolith billing module."),
  ("2.A.1.a", "evidenced", "Read specifications and RFC documents to implement OAuth 2.0 and OpenID Connect correctly."),
  ("2.A.2.b", "partially", "Completed course: AWS Cloud Practitioner Essentials (online, 2025)."),
  ("2.C.4.a", "partially", "Coursework in statistics and linear algebra during the B.Eng. program."),
  ("4.A.2.a.3", "partially", "Familiar with code review checklists and audit logging requirements."),
  ("2.A.2.a", "partially", "Skills: critical thinking, teamwork, time management."),
  ("4.A.2.b.5", "partially", "Helped maintain the release schedule calendar for the platform team."),
  ("2.B.4.e", "partially", "Participated in architecture meetings where the team selected approach options for caching."),
 ]),
 "B": ("R06", [
  ("2.B.3.e", "evidenced", "Wrote Python scripts with pandas to clean survey data and automate weekly sales reports."),
  ("4.A.2.a.4", "evidenced", "Analyzed customer churn data in SQL and presented the findings to the marketing manager."),
  ("4.A.2.a.2", "evidenced", "Performed data cleaning and aggregated data from three spreadsheets into a single reporting table."),
  ("2.C.4.a", "partially", "Relevant courses: Probability, Statistics for Business, Calculus I."),
  ("2.A.1.e", "partially", "Background in applied mathematics from undergraduate studies."),
  ("2.A.2.b", "partially", "Completed course: Google Data Analytics Certificate (in progress)."),
  ("2.C.7.a", "partially", "Languages: Thai (native), English (TOEIC 785)."),
  ("2.A.1.d", "partially", "Gave a short presentation of a class project to fellow students."),
 ]),
 "C": ("R18", [
  ("4.A.1.a.1", "evidenced", "Gathered requirements from finance and procurement users through workshops and translated them into user stories."),
  ("2.A.1.b", "evidenced", "Conducted stakeholder interviews with 25 end users to understand pain points in the purchasing process."),
  ("2.B.4.g", "evidenced", "Produced process modeling diagrams and data flow analysis for the ERP procurement module."),
  ("4.A.3.b.6", "evidenced", "Documented functional specifications and test scenarios for three ERP change requests."),
  ("2.C.1.e", "evidenced", "Provided user support and handled service desk tickets for the finance system after go-live."),
  ("4.A.4.a.1", "evidenced", "Explained technical details of the new workflow to non-technical managers in monthly briefings."),
  ("2.A.1.a", "evidenced", "Reviewed requirements documents and vendor specifications to confirm scope before sign-off."),
  ("4.A.2.a.3", "evidenced", "Carried out a compliance check of approval workflows against the internal audit policy."),
  ("4.A.2.a.4", "evidenced", "Analyzed transaction logs in Excel to find duplicate invoices and reported a 12 percent error rate."),
  ("4.A.2.b.6", "evidenced", "Planned and prioritized the backlog for two release cycles with the project manager."),
  ("2.A.1.d", "partially", "Presented project status updates at team meetings."),
  ("2.A.1.c", "partially", "Contributed to user guide drafts reviewed by the documentation team."),
  ("4.A.2.a.1", "partially", "Participated in vendor evaluation for a document management system."),
  ("2.A.2.b", "partially", "Completed course: IIBA ECBA preparation (self-study)."),
  ("2.C.7.a", "partially", "English: good command, IELTS 6.5."),
  ("4.A.1.a.2", "partially", "Monitored systems and job queues on the reporting server during month-end."),
 ]),
 "D": ("R19", [
  ("4.A.4.b.1", "evidenced", "Cut purchase-order cycle time from 30 days to 9 by redesigning the requisition-to-payment process with finance and warehouse leads."),
  ("4.A.4.a.2", "evidenced", "Presented weekly status, risks and budget variance to the steering committee and escalated scope changes for approval."),
  ("4.A.1.a.1", "evidenced", "Ran requirement elicitation workshops with 40 business users and turned ambiguous requests into signed-off specifications."),
  ("4.A.2.b.6", "evidenced", "Ran the Agile delivery cycle for 4 concurrent client projects, owning the backlog, sprint cadence and release milestones."),
  ("4.A.3.b.1", "evidenced", "Integrated SAP Business One with the e-procurement platform through a nightly reconciliation job."),
  ("4.A.2.b.5", "evidenced", "Ran the Agile delivery cycle for 4 concurrent client projects, owning the backlog, sprint cadence and release milestones."),
  ("4.A.4.b.2", "evidenced", "Grew and mentored a delivery team from 6 to 18 people with no regretted attrition."),
  ("4.A.2.b.1", "evidenced", "Cut purchase-order cycle time from 30 days to 9 by redesigning the requisition-to-payment process with finance and warehouse leads."),
  ("4.A.2.b.3", "partially", "M.Sc. Information Technology Management, Example Institute, 2016"),
  ("4.A.4.c.3", "evidenced", "Delivered a THB 8M e-procurement platform for a retail group one month ahead of go-live at 22% under the agreed delivery budget."),
  ("4.A.2.b.4", "evidenced", "Defined the 3-year roadmap for the procurement platform and aligned it with group finance objectives."),
  ("4.A.4.a.1", "evidenced", "Ran requirement elicitation workshops with 40 business users and turned ambiguous requests into signed-off specifications."),
  ("4.A.4.a.4", "partially", "Acted as the single point of contact between client stakeholders and engineering across 5 regulated industries."),
  ("4.A.1.b.1", "evidenced", "Tracked incident queues and service dashboards daily to spot delivery risks early."),
  ("4.A.4.b.4", "evidenced", "Directed 5 system analysts, 10 developers and 3 QA engineers, running quarterly performance reviews and training needs analysis."),
  ("2.C.1.e", "evidenced", "Hosted fortnightly customer advisory sessions to collect feedback and reprioritise features."),
  ("4.A.4.a.7", "evidenced", "Negotiated change requests and payment milestones with three vendors, keeping the programme within contract value."),
  ("2.C.3.a", "partially", "Tools: Jira, Confluence, Microsoft Project, SQL, Excel"),
  ("4.A.3.b.6", "evidenced", "Wrote SRS documents and kept a requirements traceability matrix for every release."),
  ("4.A.2.a.4", "evidenced", "Built a demand forecasting dashboard with SQL that reduced forecast error from 35% to 9% for 120 branches."),
  ("4.A.2.a.2", "evidenced", "Integrated SAP Business One with the e-procurement platform through a nightly reconciliation job."),
  ("4.A.4.a.3", "evidenced", "Acted as the single point of contact between client stakeholders and engineering across 5 regulated industries."),
  ("2.A.2.a", "evidenced", "Facilitated root cause analysis sessions after production incidents and tracked corrective actions to closure."),
  ("4.A.1.a.2", "evidenced", "Tracked incident queues and service dashboards daily to spot delivery risks early."),
  ("2.A.1.a", "partially", "Wrote SRS documents and kept a requirements traceability matrix for every release."),
  ("2.A.1.b", "evidenced", "Ran requirement elicitation workshops with 40 business users and turned ambiguous requests into signed-off specifications."),
  ("2.B.1.b", "evidenced", "Cut purchase-order cycle time from 30 days to 9 by redesigning the requisition-to-payment process with finance and warehouse leads."),
  ("2.B.5.a", "partially", "Delivered a THB 8M e-procurement platform for a retail group one month ahead of go-live at 22% under the agreed delivery budget."),
  ("2.B.5.d", "evidenced", "Directed 5 system analysts, 10 developers and 3 QA engineers, running quarterly performance reviews and training needs analysis."),
 ]),
}

# เฉลยงานหลักของอาชีพ (DEC-55) · (onet_task_id, status, sentence) · ประโยคต้องอยู่ในเรซูเม
TASK_KEY = {
 "A": [(21670, "evidenced", "Debugged memory leaks in a Java microservice and resolved the incident by performing root cause analysis with heap dumps."),
       (21669, "evidenced", "Wrote documentation and runbooks for deployment procedures that reduced onboarding time for new engineers."),
       (21664, "partially", "Coordinated with product owners and QA peers in daily stand-up meetings to report progress and blockers."),
       (21676, "evidenced", "Designed an ETL pipeline that transformed data from five source systems into a PostgreSQL warehouse."),
       (21667, "partially", "Led the system design of an event-driven order service and wrote the technical design document reviewed by architects.")],
 "B": [(21823, "evidenced", "Wrote Python scripts with pandas to clean survey data and automate weekly sales reports."),
       (21826, "evidenced", "Wrote Python scripts with pandas to clean survey data and automate weekly sales reports."),
       (21829, "partially", "Analyzed customer churn data in SQL and presented the findings to the marketing manager.")],
 "C": [(3464, "evidenced", "Provided user support and handled service desk tickets for the finance system after go-live."),
       (3474, "evidenced", "Produced process modeling diagrams and data flow analysis for the ERP procurement module."),
       (3469, "partially", "Explained technical details of the new workflow to non-technical managers in monthly briefings."),
       (3465, "partially", "Monitored systems and job queues on the reporting server during month-end.")],
 "D": [(16169, "evidenced", "Delivered a THB 8M e-procurement platform for a retail group one month ahead of go-live at 22% under the agreed delivery budget."),
       (16154, "evidenced", "Facilitated root cause analysis sessions after production incidents and tracked corrective actions to closure."),
       (16157, "evidenced", "Ran the Agile delivery cycle for 4 concurrent client projects, owning the backlog, sprint cadence and release milestones."),
       (16152, "evidenced", "Set up UAT sign-off checklists so every deliverable met the agreed acceptance criteria before release."),
       (16155, "evidenced", "Hosted fortnightly customer advisory sessions to collect feedback and reprioritise features."),
       (16159, "evidenced", "Presented weekly status, risks and budget variance to the steering committee and escalated scope changes for approval."),
       (16156, "partially", "Presented weekly status, risks and budget variance to the steering committee and escalated scope changes for approval."),
       (16163, "evidenced", "Directed 5 system analysts, 10 developers and 3 QA engineers, running quarterly performance reviews and training needs analysis.")],
}
# บรรทัดเพิ่มที่ไม่ใช่หลักฐานในเฉลยโดยตรง (ใบรับรองใช้ทดสอบ R5)
EXTRA = {"D": ["CERTIFICATIONS", "Project Management Professional (PMP), PMI, 2023", "Professional Scrum Master I (PSM I), 2021"]}

FILLER = {
 "A": ["EDUCATION", "B.Eng. Computer Engineering, Example University, 2019", "EXPERIENCE",
       "Software Engineer, Example Commerce Co., Ltd., 2021-present", "Junior Developer, Example Startup, 2019-2021"],
 "B": ["EDUCATION", "B.Sc. Economics, Example University, 2024", "EXPERIENCE", "Data Intern, Example Retail Co., 2024"],
 "C": ["EDUCATION", "B.B.A. Information Systems, Example University, 2018", "EXPERIENCE",
       "IT Business Analyst, Example Manufacturing Co., 2020-present", "System Support Officer, Example Bank, 2018-2020"],
 "D": ["EDUCATION", "B.Sc. Computer Science, Example University, 2012", "EXPERIENCE",
       "Senior IT Project Manager, Example Retail Group, 2019-present", "IT Project Manager, Example Software House, 2014-2019"],
}

# ---------------- ขั้น 5: การเบี่ยงเบนของโมเดลจำลอง (ประกาศล่วงหน้า) ----------------
# ชนิด: flip:<status> = เปลี่ยนสถานะ (quote เดิม) · paraphrase = quote ถอดความ (R2 ต้องไม่ผ่าน)
#       generic:<status> = อ้างข้อความทั่วไปที่ปรากฏจริงแต่ไม่เกี่ยว (R3 ต้องไม่ผ่าน) · drop = ไม่ตอบข้อนี้
DEVIATIONS = {
 "A": {"A": {}, "B": {"2.B.4.e": "flip:evidenced", "4.A.2.b.5": "paraphrase", "4.A.2.b.4": "generic:partially", "2.A.2.b": "flip:evidenced"},
       "C": {"2.A.2.b": "flip:evidenced", "2.A.2.a": "flip:missing", "2.C.4.a": "flip:evidenced", "4.A.4.a.1": "generic:evidenced", "2.B.4.g": "paraphrase"}},
 "B": {"A": {}, "B": {"2.A.1.d": "flip:missing", "4.A.2.b.1": "generic:evidenced"},
       "C": {"2.C.4.a": "flip:evidenced", "2.A.1.e": "paraphrase", "4.A.1.a.1": "generic:partially"}},
 "C": {"A": {"4.A.1.a.2": "flip:evidenced"},
       "B": {"4.A.2.a.1": "flip:evidenced", "4.A.2.b.2": "generic:partially"},
       "C": "HTTP_429"},
 # D: tense = เปลี่ยนรูปกริยาคำแรก (R2 ต้องซ่อมได้ · DEC-52) · ผู้ตรวจ C ตอบผิดรูปแบบ (VERIFIER_DEV)
 "D": {"A": {"2.B.5.a": "flip:missing", "4.A.4.b.1": "tense"},
       "B": {"2.C.7.a": "generic:partially", "2.A.2.a": "flip:missing"},
       "C": {"4.A.1.b.1": "paraphrase"}},
}
VERIFIER_DEV = {"A": [], "B": [], "C": [], "D": ["C"]}
GENERIC = {"A": "Software Engineer, Example Commerce Co., Ltd., 2021-present",
           "B": "Data Intern, Example Retail Co., 2024",
           "C": "IT Business Analyst, Example Manufacturing Co., 2020-present",
           "D": "Senior IT Project Manager, Example Retail Group, 2019-present"}


def build_text(case):
    name, email, phone, url, headline = HEADER[case]
    role, rows = KEY[case]
    lines = [name, headline, f"Email: {email} | Phone: {phone} | {url}", "", "SUMMARY",
             f"{headline} seeking growth in the {role} target occupation.", ""]
    lines += FILLER[case][:2] + [""] + FILLER[case][2:] + [""]
    lines.append("KEY ACHIEVEMENTS AND SKILLS")
    seen = set()
    for s in [x[2] for x in rows] + [x[2] for x in TASK_KEY.get(case, [])]:
        if s in seen: continue
        seen.add(s); lines.append("- " + s)
    if EXTRA.get(case): lines += [""] + EXTRA[case]
    return "\n".join(lines) + "\n"


def ev_type(st, s):
    if st == "missing": return ""
    if s.startswith("Tools:") or s.startswith("Skills:") or s.startswith("Languages:"): return "tool_list"
    if s.startswith("Completed course") or "Certificate" in s or "IELTS" in s: return "credential"
    if s.startswith("M.Sc.") or s.startswith("B.") or "Coursework" in s or "Relevant courses" in s or "Background in" in s: return "education"
    return "result" if any(ch.isdigit() for ch in s) else "action"


def mock_response(case, model, role, req_ids, key_rows, text, task_ids=None):
    dev = DEVIATIONS[case][model]
    if dev == "HTTP_429":
        return {"simulate": "http_error", "status": 429, "times": 3}
    key = {el: (st, s) for el, st, s in key_rows}
    out = []
    for rid in req_ids:
        el = rid.split("-", 2)[2]
        st, s = key.get(el, ("missing", ""))
        quote = s if st != "missing" else ""
        d = dev.get(el)
        if d == "drop": continue
        if d and d.startswith("flip:"):
            st = d.split(":")[1]; quote = s if st != "missing" else ""
            if st != "missing" and not quote: quote = GENERIC[case]
        elif d == "paraphrase":
            quote = "The candidate " + s[0].lower() + s[1:-1].replace("and", "&") + " (summarised)"
        elif d == "tense":
            w = s.split(" ", 1); quote = (w[0] + "s" if not w[0].endswith("s") else w[0][:-1]) + " " + w[1]
        elif d and d.startswith("generic:"):
            st = d.split(":")[1]; quote = GENERIC[case]
        out.append({"requirement_id": rid, "status": st, "quotes": [quote] if st != "missing" and quote else [],
                    "evidence_type": ev_type(st, s if quote == s else quote),
                    "confidence": 0.9 if st == "evidenced" else (0.6 if st == "partially" else 0.8)})
    tkey = {f"TASK-{role}-{tid}": (st, s) for tid, st, s in TASK_KEY.get(case, [])}
    tasks = []
    for tid in task_ids or []:
        st, s = tkey.get(tid, ("missing", ""))
        tasks.append({"task_id": tid, "status": st, "quotes": [s] if st != "missing" else [], "confidence": 0.85 if st != "missing" else 0.8})
    body = {"schema_version": "analyst_v1.1", "role_id": role, "assessments": out, "task_assessments": tasks}
    return {"simulate": "ok", "text": json.dumps(body, ensure_ascii=False), "input_tokens": 8000 + len(text) // 4,
            "output_tokens": 2500, "finish_reason": "stop"}


def make_pdfs(text, folder, scanned):
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    p = os.path.join(folder, "resume_text.pdf")
    c = canvas.Canvas(p, pagesize=A4); c.setTitle("Synthetic resume (fictional)"); c.setAuthor("IS68076026 synthetic")
    y = 800
    for line in text.split("\n"):
        while len(line) > 95:
            cut = line.rfind(" ", 0, 95); c.drawString(40, y, line[:cut]); y -= 14; line = line[cut + 1:]
        c.drawString(40, y, line); y -= 14
        if y < 50: c.showPage(); y = 800
    c.save()
    if scanned:
        try:
            import pymupdf as fitz
            from PIL import Image, ImageFilter
            doc = fitz.open(p); imgs = []
            rnd = random.Random(68076026)
            for page in doc:
                pix = page.get_pixmap(dpi=120)
                im = Image.frombytes("RGB", [pix.width, pix.height], pix.samples).convert("L")
                px = im.load()
                for _ in range(int(im.width * im.height * 0.004)):
                    px[rnd.randrange(im.width), rnd.randrange(im.height)] = rnd.choice([0, 255])
                im = im.rotate(0.8, expand=False, fillcolor=255).filter(ImageFilter.GaussianBlur(0.4))
                imgs.append(im)
            import io
            out = fitz.open()
            for im in imgs:
                buf = io.BytesIO(); im.save(buf, format="PNG")
                pg = out.new_page(width=595, height=842)
                pg.insert_image(pg.rect, stream=buf.getvalue())
            out.save(os.path.join(folder, "resume_scanned.pdf"))
        except ImportError:
            print("  (ข้าม resume_scanned.pdf: ต้องมี PyMuPDF และ Pillow)")


def main():
    import subprocess
    req = pd.read_csv(os.path.join(ROOT, "data", "requirements.csv"), dtype=str)
    rtasks = pd.read_csv(os.path.join(ROOT, "data", "role_tasks.csv"), dtype=str)
    for case in ["A", "B", "C", "D"]:
        role, rows = KEY[case]
        folder = os.path.join(OUT, f"case_{case}")
        os.makedirs(os.path.join(folder, "mock_responses"), exist_ok=True)
        text = build_text(case)
        open(os.path.join(folder, "resume.txt"), "w", encoding="utf-8", newline="\n").write(text)
        prep = json.loads(subprocess.run(["node", "-e", "const E=require('./engine/engine.js');let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.stringify(E.prepareText(s))))"],
                                         input=text, capture_output=True, text=True, cwd=ROOT, check=True).stdout)
        masked = prep["text"]
        R = req[req.role_id == role]
        req_ids = list(R.requirement_id)
        assert all(f"REQ-{role}-{el}" in req_ids for el, _, _ in rows), case
        with open(os.path.join(folder, "answer_key.csv"), "w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh, lineterminator="\n")
            w.writerow(["requirement_id", "element_id", "element_name", "expected_status", "evidence_sentence", "char_start", "char_end"])
            key = {el: (st, s) for el, st, s in rows}
            for _, r in R.iterrows():
                st, s = key.get(r.element_id, ("missing", ""))
                i = masked.find(s) if s else -1
                assert s == "" or i >= 0, (case, r.element_id)
                w.writerow([r.requirement_id, r.element_id, r.element_name, st, s, i, (i + len(s)) if s else -1])
        TT = rtasks[rtasks.role_id == role]
        task_ids = list(TT.task_id)
        tkey = {f"TASK-{role}-{tid}": (st, s) for tid, st, s in TASK_KEY.get(case, [])}
        assert all(t in task_ids for t in tkey), (case, "task_key ต้องอยู่ใน role_tasks")
        with open(os.path.join(folder, "task_key.csv"), "w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh, lineterminator="\n")
            w.writerow(["task_id", "task_text", "expected_status", "evidence_sentence", "char_start", "char_end"])
            for _, r in TT.iterrows():
                st, s = tkey.get(r.task_id, ("missing", ""))
                i = masked.find(s) if s else -1
                assert s == "" or i >= 0, (case, r.task_id)
                w.writerow([r.task_id, r.task_text, st, s, i, (i + len(s)) if s else -1])
        json.dump({"mode": "oracle", "rule": "quote ตรงกับประโยคเฉลยของข้อนั้น → supports (evidenced) / partially_supports (partially) · ไม่ตรง → unrelated",
                   "invalid_for": VERIFIER_DEV.get(case, [])}, open(os.path.join(folder, "mock_responses", "verifier.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        for mk in ["A", "B", "C"]:
            resp = mock_response(case, mk, role, req_ids, rows, masked, task_ids)
            json.dump(resp, open(os.path.join(folder, "mock_responses", f"{mk}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        meta = dict(case=case, role_id=role, mode="both", timeline_months=6 if case != "D" else 12, hours_per_week=10,
                    email=HEADER[case][1], timestamp=f"2026-10-01T09:0{ord(case)-64}:00+07:00", file_id=f"SYNTH_FILE_{case}_0000000000000000000000",
                    ocr_engine="text_layer_fixture" if case != "C" else "scanned_fixture (ต้องผ่าน OCR จริงใน S6)",
                    pii_expected=prep["pii_counts"], deviations=DEVIATIONS[case], verifier_invalid_for=VERIFIER_DEV.get(case, []), fictional=True,
                    style="achievement_metrics" if case == "D" else "onet_vocabulary")
        json.dump(meta, open(os.path.join(folder, "meta.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        make_pdfs(text, folder, scanned=(case == "C"))
        print(f"case {case} {role}: {sum(1 for r in rows if r[1]=='evidenced')} evidenced · {sum(1 for r in rows if r[1]=='partially')} partially · PII {prep['pii_counts']}")


if __name__ == "__main__":
    main()
