# -*- coding: utf-8 -*-
"""
make_validation_resumes.py — เรซูเมสังเคราะห์สำหรับตรวจความตรงของคะแนน (DEC-57 · 3 ต.ค. 2569)

  4 บุคคลสมมติ (ตรงกับ 4 อาชีพใน WF_Demo) × 3 สไตล์การเขียน ของข้อเท็จจริงชุดเดียวกัน
    onet  : ประโยคสั้น ใช้กริยาใกล้คำของ O*NET (แบบชุดทดสอบเดิม)
    star  : เน้นผลงานและตัวเลข (แบบเรซูเมจริงที่พบใน Gap_03OCT26)
    list  : รายการทักษะ/คำสำคัญ ไม่มีบริบทการใช้งาน
  → synthetic/validation/<persona>_<style>.txt + .pdf + manifest.json

ใช้ร่วมกับ scripts/validate_scoring.mjs (ส่งเข้า WF_Demo ที่รันกับ Gemini จริง)
  known-group     : เรซูเมของคนที่ทำอาชีพนั้นอยู่แล้ว ต้องได้ T ของอาชีพตัวเองสูงสุด และ R ไม่ต่ำกว่าอาชีพอื่น
  style-invariance: ข้อเท็จจริงเดียวกัน |R(onet) − R(star)| ≤ 10
ข้อมูลทั้งหมดเป็นบุคคลสมมติ · ไม่ใช่ข้อมูลผู้เข้าร่วม
"""
import json, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "synthetic", "validation")

P = {
 "pm": {"role_id": "R19", "name": "Arisa Example", "title": "IT Project Manager", "contact": "arisa.example@mail.test | +66 81 000 1919",
  "jobs": [("IT Project Manager, Example Retail Group", "2019 - present"), ("Business Analyst, Example Software House", "2016 - 2019")],
  "edu": "M.Sc. Information Technology Management, Example Institute, 2018", "certs": ["Project Management Professional (PMP), 2022"],
  "facts": [
   ("Managed project scope, schedule and budget for ERP and e-commerce projects.", "Delivered a THB 12M ERP rollout across 40 stores three weeks early and 9% under budget.", "Scope, schedule and budget management"),
   ("Coordinated the work of developers, testers and vendors on four concurrent projects.", "Ran four concurrent projects with 26 developers, testers and vendor staff on a single release calendar.", "Multi-project coordination"),
   ("Communicated project status and risks to executives and stakeholders every week.", "Briefed the CIO and five business heads weekly on status, risks and budget variance, cutting escalations by 40%.", "Stakeholder reporting"),
   ("Gathered requirements from business users and documented specifications.", "Led 30 requirement workshops and turned them into signed-off specifications for the merchandising team.", "Requirements gathering, specifications"),
   ("Monitored project milestones and deliverables using Jira and Microsoft Project.", "Tracked 120 milestones in Jira and Microsoft Project, keeping 95% on time across two years.", "Jira, Microsoft Project, Confluence"),
   ("Negotiated contracts and change requests with vendors.", "Negotiated change requests with three vendors and saved THB 1.8M against the original contract value.", "Vendor negotiation"),
   ("Guided and mentored team members and resolved conflicts within the team.", "Coached six junior analysts, two of whom were promoted within a year.", "Team leadership, mentoring"),
   ("Analyzed data to identify project risks and solve problems.", "Built a risk dashboard in SQL and Excel that flagged slipping tasks two weeks earlier than before.", "SQL, Excel, risk analysis"),
  ]},
 "net": {"role_id": "R15", "name": "Krit Example", "title": "Network Engineer", "contact": "krit.example@mail.test | +66 82 000 1515",
  "jobs": [("Network Engineer, Example Telecom", "2018 - present"), ("System Administrator, Example Hospital", "2015 - 2018")],
  "edu": "B.Eng. Computer Engineering, Example University, 2015", "certs": ["Cisco Certified Network Associate (CCNA), 2019"],
  "facts": [
   ("Designed and configured LAN and WAN networks with routing and switching.", "Redesigned a 60-site WAN with BGP and OSPF, cutting average latency from 48 ms to 19 ms.", "LAN, WAN, BGP, OSPF, routing, switching"),
   ("Implemented firewall rules, VPN and network security measures.", "Rolled out FortiGate firewalls and site-to-site VPN for 60 branches with zero security incidents in two years.", "Firewall, VPN, network security"),
   ("Monitored network performance and troubleshot network problems.", "Cut mean time to repair for network incidents from 4 hours to 50 minutes with PRTG alerting and runbooks.", "Network monitoring, troubleshooting, PRTG"),
   ("Automated network configuration with Python and Ansible.", "Automated configuration backups for 800 devices with Python and Ansible, saving 30 hours a month.", "Python, Ansible, automation"),
   ("Developed disaster recovery plans for network infrastructure.", "Wrote and tested the disaster recovery plan for the core data centre, restoring service in 35 minutes during the annual drill.", "Disaster recovery"),
   ("Coordinated network installation and upgrades with vendors.", "Led the core switch upgrade with two vendors over three weekends without unplanned downtime.", "Vendor coordination, upgrades"),
   ("Documented network diagrams and procedures.", "Produced up-to-date diagrams and 40 procedures in Confluence used by the 24x7 operations desk.", "Documentation, Visio, Confluence"),
   ("Evaluated network capacity and recommended equipment.", "Ran a capacity study that justified a THB 6M bandwidth upgrade approved by the CTO.", "Capacity planning"),
  ]},
 "ml": {"role_id": "R07", "name": "Ploy Example", "title": "Machine Learning Engineer", "contact": "ploy.example@mail.test | +66 83 000 0707",
  "jobs": [("Machine Learning Engineer, Example Fintech", "2021 - present"), ("Data Scientist, Example Bank", "2019 - 2021")],
  "edu": "M.Sc. Computer Science, Example University, 2019", "certs": ["AWS Certified Machine Learning - Specialty, 2023"],
  "facts": [
   ("Developed machine learning models for credit risk using Python.", "Built a gradient-boosting credit model in Python that raised approval accuracy by 6 points on 2M applications.", "Python, scikit-learn, XGBoost"),
   ("Deployed models to production on AWS.", "Shipped 9 models to production on AWS SageMaker with p95 latency under 80 ms.", "AWS, SageMaker, Docker"),
   ("Built data pipelines to process large data sets.", "Rewrote feature pipelines in Spark, cutting nightly processing from 6 hours to 40 minutes.", "Spark, SQL, data pipelines"),
   ("Evaluated model performance and monitored model drift.", "Set up drift monitoring that caught a data shift two weeks before it hurt approval rates.", "Model evaluation, monitoring"),
   ("Applied deep learning and natural language processing.", "Fine-tuned a Thai-English transformer that auto-classified 70% of support tickets.", "PyTorch, NLP, transformers"),
   ("Communicated model results to business stakeholders.", "Presented model impact monthly to the risk committee and wrote model documentation for audit.", "Stakeholder communication"),
   ("Researched new algorithms and kept up to date with AI developments.", "Prototyped a retrieval-augmented assistant that answered 80% of policy questions correctly in a pilot.", "LLM, RAG, research"),
   ("Wrote unit tests and reviewed code.", "Raised test coverage of the ML codebase from 35% to 82% and reviewed 300 pull requests.", "Testing, code review, Git"),
  ]},
 "mgr": {"role_id": "R20", "name": "Somsak Example", "title": "IT Manager", "contact": "somsak.example@mail.test | +66 84 000 2020",
  "jobs": [("IT Manager, Example Manufacturing", "2016 - present"), ("IT Project Manager, Example Logistics", "2012 - 2016")],
  "edu": "MBA, Example Business School, 2014", "certs": ["ITIL 4 Foundation, 2020"],
  "facts": [
   ("Managed the IT department, staff and budget.", "Ran a 25-person IT department and a THB 40M annual budget, closing the year 4% under budget.", "IT department management, budgeting"),
   ("Developed IT strategy and policies aligned with business goals.", "Wrote the three-year IT strategy adopted by the board, including cloud migration and cybersecurity roadmaps.", "IT strategy, governance"),
   ("Directed information security and compliance programs.", "Led ISO 27001 certification on the first audit with zero major findings.", "ISO 27001, information security"),
   ("Negotiated contracts with vendors and service providers.", "Renegotiated hosting and helpdesk contracts, saving THB 5M a year.", "Vendor management, contracts"),
   ("Hired, trained and evaluated IT staff.", "Hired 11 engineers and introduced quarterly reviews that cut staff turnover from 22% to 9%.", "Hiring, staff development"),
   ("Oversaw IT service management and user support.", "Introduced ITIL service desk processes that raised SLA attainment from 81% to 97%.", "ITIL, service desk, SLA"),
   ("Planned and supervised infrastructure and ERP projects.", "Sponsored a SAP S/4HANA upgrade delivered on time for 1,200 users.", "SAP, ERP, infrastructure"),
   ("Reported IT performance to executives.", "Presented a monthly IT scorecard to the CEO and audit committee.", "Executive reporting, KPIs"),
  ]},
}
STYLE_TH = {"onet": "ภาษาใกล้ O*NET", "star": "เน้นผลงานและตัวเลข", "list": "รายการทักษะ"}


def build(key, style):
    p = P[key]
    L = [p["name"], p["title"], p["contact"], "", "EXPERIENCE"]
    for j, d in p["jobs"]: L.append(f"{j}, {d}")
    L += ["", "KEY ACHIEVEMENTS" if style != "list" else "SKILLS"]
    idx = {"onet": 0, "star": 1, "list": 2}[style]
    if style == "list": L.append(", ".join(f[idx] for f in p["facts"]))
    else: L += ["- " + f[idx] for f in p["facts"]]
    L += ["", "EDUCATION", p["edu"], "", "CERTIFICATIONS"] + p["certs"]
    return "\n".join(L) + "\n"


def pdf(text, path):
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    c = canvas.Canvas(path, pagesize=A4); c.setTitle("Synthetic validation resume (fictional)"); y = 800
    for line in text.split("\n"):
        while len(line) > 95:
            cut = line.rfind(" ", 0, 95); c.drawString(40, y, line[:cut]); y -= 14; line = line[cut + 1:]
        c.drawString(40, y, line); y -= 14
        if y < 50: c.showPage(); y = 800
    c.save()


def main():
    os.makedirs(OUT, exist_ok=True)
    man = {"purpose": "DEC-57 known-group + style-invariance", "fictional": True, "personas": {}}
    for k, p in P.items():
        man["personas"][k] = {"role_id": p["role_id"], "title": p["title"], "files": {}}
        for st in ["onet", "star", "list"]:
            t = build(k, st)
            base = os.path.join(OUT, f"{k}_{st}")
            open(base + ".txt", "w", encoding="utf-8", newline="\n").write(t)
            pdf(t, base + ".pdf")
            man["personas"][k]["files"][st] = f"{k}_{st}.pdf"
    man["style_th"] = STYLE_TH
    json.dump(man, open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("เขียน", OUT, "· 4 บุคคล × 3 สไตล์ = 12 ไฟล์")


if __name__ == "__main__":
    main()
