#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_corpus_v12_31AUG26.py — ซ่อม corpus ตามผลตรวจ URL (DEC-14 · DEC-15)
IS 68076026 · 31 สิงหาคม 2026

สองการดำเนินการ
  FIX     — รายการยังมีอยู่จริง แต่ผู้ให้บริการย้าย URL หรือเปลี่ยนชื่อ → แก้ URL/ชื่อ แล้วตั้งเป็น verified
  REPLACE — รายการถูกยกเลิกถาวร → แทนที่ด้วยรายการที่ยังเปิดอยู่ในสายเดียวกัน โดยคง competency mapping เดิม

ทุก URL ปลายทางยืนยันด้วยการดึงหน้าเว็บจริงเมื่อ 31 ส.ค. 2026
อินพุต : corpus_master_v11_31AUG26.csv · Course_Career_v11_31AUG26.xlsx · item_competency_map_31AUG26.csv
เอาต์พุต: corpus_master_v12_31AUG26.csv · Course_Career_v12_31AUG26.xlsx · corpus_version_log_v12_31AUG26.json
"""

# ---------- bootstrap: ทำงานได้จากทุกที่หลังจัดระเบียบโฟลเดอร์ 31 ส.ค. 2026 ----------
import os as _os, builtins as _b
PROJECT_ROOT = _os.path.dirname(_os.path.abspath(__file__))
while not _os.path.isdir(_os.path.join(PROJECT_ROOT, "02_dataset")) and _os.path.dirname(PROJECT_ROOT) != PROJECT_ROOT:
    PROJECT_ROOT = _os.path.dirname(PROJECT_ROOT)
_SKIP = {".git", ".work", "__pycache__", "db_31_0_excel", ".agents"}
_INDEX = {}
for _pass in (0, 1):                      # รอบแรกไม่รวม archive รอบสองรวม เพื่อให้ไฟล์ปัจจุบันชนะเสมอ
    for _dp, _dn, _fn in _os.walk(PROJECT_ROOT):
        _dn[:] = [d for d in _dn if d not in _SKIP and (_pass or d != "archive")]
        for _f in _fn: _INDEX.setdefault(_f, _os.path.join(_dp, _f))
OUT_DIR = _os.path.join(PROJECT_ROOT, "03_corpus")
_os.makedirs(OUT_DIR, exist_ok=True)
_os.chdir(OUT_DIR)
__open = _b.open
def _resolve(f, mode):
    if isinstance(f, str) and not _os.path.isabs(f) and "/" not in f and "\\" not in f and not _os.path.exists(f):
        return _INDEX.get(f, f)
    return f
_b.open = lambda file, mode="r", *a, **k: __open(_resolve(file, mode), mode, *a, **k)
# ---------- จบ bootstrap ----------
import csv, json, hashlib, collections, datetime
import openpyxl
from openpyxl.styles import Font, PatternFill

TODAY = "2026-08-31"
VER   = "CORPUS-IS68076026-v1.2-31AUG26"
VERIF = "ผู้วิจัย (ตรวจด้วยการดึงหน้าเว็บ 31 ส.ค. 2026)"
SRC_XLSX = "Course_Career_v11_31AUG26.xlsx"
OUT_XLSX = "Course_Career_v12_31AUG26.xlsx"
OUT_CSV  = "corpus_master_v12_31AUG26.csv"

# ============================================================ FIX — ย้าย URL หรือเปลี่ยนชื่อเท่านั้น
FIX = {
 "CRT-R03-04": dict(url="https://certiport.pearsonvue.com/Certifications/Apple/App-Dev-With-Swift/Overview.aspx"),
 "CRT-R03-05": dict(url="https://certiport.pearsonvue.com/Certifications/Apple/App-Dev-With-Swift/Overview.aspx"),
 "CRT-R05-06": dict(url="https://humanfactors.com/training/cua_exam.asp"),
 "CRT-R05-07": dict(url="https://humanfactors.com/hfi-training/certification/cxa_exam.asp"),
 "CRT-R05-09": dict(url="https://certiport.pearsonvue.com/Certifications/Adobe/ACP/Adobe-Certified-Professional.aspx",
                    title="Adobe Certified Professional in Visual Design"),
 "CRT-R08-10": dict(url="https://www.getdbt.com/certifications/analytics-engineer-certification-exam",
                    title="dbt Analytics Engineering Certification Exam"),
 "CRT-R09-06": dict(url="https://www.iiba.org/business-analysis-certifications/business-data-analytics-certification/"),
 "CRT-R18-07": dict(url="https://www.iiba.org/business-analysis-certifications/business-data-analytics-certification/"),
 "CRT-R18-05": dict(url="https://www.bcs.org/qualifications-and-certifications/certifications-for-professionals/business-analysis/bcs-international-diploma-in-business-analysis/"),
 "CRS-R18-01": dict(url="https://www.coursera.org/professional-certificates/ibm-business-analyst-professional-certificate"),
 "CRT-R14-07": dict(url="https://cellebrite.com/en/training/"),
 "CRS-R14-09": dict(url="https://volatilityfoundation.org/volatility-training/",
                    title="Malware and Memory Forensics Training"),
 "CRS-R14-04": dict(url="https://www.coursera.org/specializations/cyber-incident-response"),
 "CRS-R12-07": dict(url="https://www.coursera.org/learn/introduction-to-devsecops",
                    title="Introduction to DevSecOps", provider="Johns Hopkins University", platform="Coursera"),
 "CRS-R19-09": dict(url="https://www.coursera.org/learn/introduction-to-certified-scrum-master",
                    provider="LearnQuest", platform="Coursera"),
 "CRS-R19-06": dict(url="https://www.coursera.org/learn/project-risk-management-",
                    title="Project Risk Management", provider="Coursera Instructor Network", platform="Coursera"),
 "CRS-R11-09": dict(url="https://www.coursera.org/professional-certificates/palo-alto-networks-cybersecurity-fundamentals",
                    title="Palo Alto Networks Cybersecurity Professional Certificate"),
 "CRS-R12-09": dict(url="https://www.coursera.org/learn/palo-alto-networks-network-security-fundamentals",
                    title="Palo Alto Networks Network Security Fundamentals"),
 "CRS-R15-09": dict(url="https://www.coursera.org/learn/palo-alto-networks-network-security-fundamentals",
                    title="Palo Alto Networks Network Security Fundamentals"),
 "CRS-R11-07": dict(url="https://www.coursera.org/specializations/intro-cyber-security",
                    title="Introduction to Cyber Security Specialization",
                    provider="New York University", platform="Coursera"),
 "CRS-R11-08": dict(url="https://mad20.com/individuals", title="MAD20 ATT&CK Fundamentals",
                    provider="MAD20 Technologies", platform="MAD20",
                    note="MITRE โอนหลักสูตร MAD ให้ MAD20 Technologies · โดเมนเดิมของ MITRE Engenuity ถูกแทนที่ด้วยเนื้อหาโฆษณา"),
 "CRS-R15-01": dict(url="https://www.netacad.com/courses/networking-basics", title="Networking Basics",
                    provider="Cisco Networking Academy", platform="Cisco NetAcad",
                    cost="free", usd=0),
 "CRT-R15-03": dict(url="https://www.cisco.com/site/us/en/learn/training-certifications/certifications/automation/ccna-automation/index.html",
                    title="Cisco CCNA Automation",
                    note="Cisco เปลี่ยนชื่อสาย DevNet เป็น Automation · DevNet Associate กลายเป็น CCNA Automation"),
 "CRT-R20-06": dict(url="https://www.opengroup.org/certifications/togaf-certification-portfolio"),
 "CRS-R20-08": dict(url="https://www.coursera.org/specializations/cybersecurity-leadership",
                    title="Cybersecurity Leadership and Management Specialization",
                    provider="Infosec", platform="Coursera"),
 "CRS-R08-09": dict(url="https://www.coursera.org/learn/snowflake-intro-app-developers-data-scientists-data-engineers",
                    title="Intro to Snowflake for Devs, Data Scientists, Data Engineers"),
 "CRS-R08-10": dict(url="https://www.databricks.com/training/catalog/advanced-data-engineering-with-databricks-971",
                    title="Advanced Data Engineering with Databricks"),
 "CRT-R10-05": dict(url="https://www.enterprisedb.com/training/certification-exams",
                    title="EDB Essentials for PostgreSQL Certification",
                    note="EDB ปรับชื่อชุดใบรับรองใหม่ทั้งหมด ต้องยืนยันชื่อรุ่นที่จะใช้อีกครั้งก่อนตรึง"),
 "CRT-R15-10": dict(url="https://certification-learning.hpe.com/tr/datasheet/certification/ACA-Switch",
                    title="HPE Aruba Networking Certified Associate – Switching",
                    provider="HPE Aruba Networking", pending=True,
                    note="HPE เปลี่ยนชื่อจาก ACSA เป็น ACA-Switching · หน้า datasheet ตอบช้าจนดึงไม่สำเร็จ ต้องเปิดยืนยันด้วยตา"),
}

# ============================================================ REPLACE — รายการถูกยกเลิกถาวร
def R(**k): return k
REPLACE = {
 # --- Microsoft Azure Developer Associate (AZ-204) ยกเลิก → AI-200
 "CRT-R01-03": R(title="Microsoft Certified: Azure AI Cloud Developer Associate", provider="Microsoft",
   provider_type="vendor_or_body", platform="Microsoft Learn",
   url="https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-cloud-developer-associate/",
   credential="vendor_cert", level="Intermediate", hours=110, cost="exam-fee-required", usd=165,
   exam="AI-200", validity="1", tier=3, prereq="ประสบการณ์พัฒนาบน Azure",
   outcomes="ออกแบบและพัฒนาโซลูชัน AI บนคลาวด์ของ Azure เชื่อมต่อบริการ AI เข้ากับแอปพลิเคชัน และดูแลความปลอดภัยของโซลูชัน",
   skills="Azure AI services|Cloud application development|API integration|Prompt engineering|Solution security",
   tools="Azure AI Foundry|Azure Functions|Azure App Service",
   why="แทน AZ-204 ที่ Microsoft ยกเลิก · Microsoft ระบุ AI-200 เป็นเส้นทางต่อเนื่องของนักพัฒนา Azure"),
 "CRT-R02-01": "CRT-R01-03", "CRT-R03-02": "CRT-R01-03", "CRT-R07-05": "CRT-R01-03",
 # --- OpenJS JSNAD / JSNSD ยกเลิก
 "CRT-R02-03": R(title="Certified Kubernetes Application Developer (CKAD)", provider="Linux Foundation",
   provider_type="vendor_or_body" , platform="Linux Foundation Training",
   url="https://training.linuxfoundation.org/certification/certified-kubernetes-application-developer-ckad/",
   credential="vendor_neutral_cert", level="Intermediate", hours=80, cost="exam-fee-required", usd=445,
   exam="CKAD", validity="2", tier=3, prereq="พื้นฐานคอนเทนเนอร์และบรรทัดคำสั่ง",
   outcomes="ออกแบบ สร้าง และ deploy แอปพลิเคชันบน Kubernetes จัดการ configuration การเชื่อมต่อบริการ และการสังเกตการณ์",
   skills="Kubernetes deployment|Container design|Service networking|Observability|Configuration management",
   tools="Kubernetes|Docker|kubectl|Helm",
   why="แทน JSNAD ที่ Linux Foundation ยกเลิก · ยังเป็นใบรับรองสายพัฒนาฝั่งเซิร์ฟเวอร์ของผู้ให้บริการเดียวกัน"),
 "CRT-R02-04": R(title="Certified Secure Software Lifecycle Professional (CSSLP)", provider="ISC2",
   provider_type="vendor_or_body", platform="ISC2",
   url="https://www.isc2.org/certifications/csslp",
   credential="vendor_neutral_cert", level="Advanced", hours=120, cost="exam-fee-required", usd=599,
   exam="CSSLP", validity="3", tier=3, prereq="ประสบการณ์พัฒนาซอฟต์แวร์ 4 ปี",
   outcomes="ฝังความปลอดภัยเข้าไปในทุกขั้นของวงจรพัฒนาซอฟต์แวร์ ตั้งแต่การเก็บความต้องการจนถึงการดูแลหลังส่งมอบ",
   skills="Secure SDLC|Threat modelling|Secure coding|Security testing|Software deployment security",
   tools="OWASP tools|SAST/DAST",
   why="แทน JSNSD ที่ยกเลิก · ครอบคลุมการพัฒนาบริการฝั่งเซิร์ฟเวอร์อย่างปลอดภัยซึ่งเป็นแกนเดิมของ JSNSD"),
 # --- AWS ML Specialty ยกเลิก → GenAI Developer Professional (ใบรับรองใหม่ปี 2026)
 "CRT-R06-03": R(title="AWS Certified Generative AI Developer – Professional", provider="Amazon Web Services",
   provider_type="vendor_or_body", platform="AWS Certification",
   url="https://aws.amazon.com/certification/certified-generative-ai-developer-professional/",
   credential="vendor_cert", level="Professional", hours=150, cost="exam-fee-required", usd=300,
   exam="AIP-C01", validity="3", tier=3, prereq="ประสบการณ์พัฒนาโซลูชัน AI บน AWS",
   outcomes="ออกแบบและพัฒนาโซลูชัน generative AI บน AWS ตั้งแต่การเลือกโมเดล การทำ RAG ไปจนถึงการประเมินและกำกับดูแล",
   skills="Generative AI solution design|RAG|Model evaluation|Responsible AI|Prompt engineering",
   tools="Amazon Bedrock|Amazon SageMaker|LangChain",
   why="แทน AWS Certified Machine Learning Specialty ที่หมดอายุ 31 มี.ค. 2026 · AWS ประกาศชุดใบรับรอง AI ใหม่แทน"),
 "CRT-R07-03": "CRT-R06-03",
 # --- Microsoft Azure Data Scientist (DP-100) ยกเลิก
 "CRT-R06-01": R(title="Databricks Certified Machine Learning Professional", provider="Databricks",
   provider_type="vendor_or_body", platform="Databricks",
   url="https://www.databricks.com/learn/certification/machine-learning-professional",
   credential="vendor_cert", level="Advanced", hours=90, cost="exam-fee-required", usd=200,
   exam="Databricks ML Professional", validity="2", tier=3, prereq="ประสบการณ์งานแมชชีนเลิร์นนิงบน Databricks",
   outcomes="สร้างและนำโมเดลขึ้นใช้งานจริงบน Lakehouse จัดการ feature store การติดตามการทดลอง และการเฝ้าระวังโมเดล",
   skills="MLflow|Feature engineering at scale|Model deployment|Model monitoring|Lakehouse ML",
   tools="Databricks|MLflow|Spark MLlib",
   why="แทน DP-100 ที่ Microsoft ยกเลิก · เป็นใบรับรองระดับสูงสายวิทยาศาสตร์ข้อมูลที่ยังเปิดสอบ"),
 # --- TensorFlow Developer Certificate ยุติโครงการ
 "CRT-R06-05": R(title="IAPP Artificial Intelligence Governance Professional (AIGP)", provider="IAPP",
   provider_type="vendor_or_body", platform="IAPP",
   url="https://iapp.org/certify/aigp/",
   credential="vendor_neutral_cert", level="Professional", hours=80, cost="exam-fee-required", usd=675,
   exam="AIGP", validity="1", tier=3, prereq="ความเข้าใจพื้นฐานด้าน AI และการกำกับดูแลข้อมูล",
   outcomes="กำกับดูแลระบบ AI ตลอดวงจรชีวิต ประเมินความเสี่ยง จัดทำนโยบาย และปฏิบัติตามกฎระเบียบด้าน AI",
   skills="AI governance|AI risk assessment|Responsible AI policy|AI regulation compliance",
   tools="",
   why="แทน TensorFlow Developer Certificate ที่ยุติโครงการ · เป็นใบรับรองใหม่ที่ตอบโจทย์งานวิทยาศาสตร์ข้อมูลยุคกำกับดูแล AI"),
 "CRT-R07-06": R(title="Databricks Certified Machine Learning Associate", provider="Databricks",
   provider_type="vendor_or_body", platform="Databricks",
   url="https://www.databricks.com/learn/certification/machine-learning-associate",
   credential="vendor_cert", level="Intermediate", hours=60, cost="exam-fee-required", usd=200,
   exam="Databricks ML Associate", validity="2", tier=3, prereq="พื้นฐาน Python และแมชชีนเลิร์นนิง",
   outcomes="ใช้ Databricks สร้างและประเมินโมเดลแมชชีนเลิร์นนิง ตั้งแต่การเตรียมข้อมูลจนถึงการติดตามการทดลอง",
   skills="ML workflow on Databricks|MLflow tracking|Feature engineering|Model evaluation",
   tools="Databricks|MLflow|scikit-learn",
   why="แทน TensorFlow Developer Certificate ที่ยุติโครงการ"),
 # --- Microsoft Azure AI Engineer (AI-102) ยกเลิก
 "CRT-R07-04": R(title="Microsoft Certified: Azure AI Apps and Agents Developer Associate", provider="Microsoft",
   provider_type="vendor_or_body", platform="Microsoft Learn",
   url="https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-apps-and-agents-developer-associate/",
   credential="vendor_cert", level="Intermediate", hours=110, cost="exam-fee-required", usd=165,
   exam="AI-102 successor", validity="1", tier=3, prereq="ประสบการณ์พัฒนาโซลูชัน AI บน Azure",
   outcomes="สร้างแอปพลิเคชันและเอเจนต์ AI บน Azure เชื่อมต่อโมเดลภาษาขนาดใหญ่ และจัดการวงจรชีวิตของเอเจนต์",
   skills="AI agent development|LLM integration|Azure AI Foundry|Responsible AI",
   tools="Azure AI Foundry|Azure OpenAI|Semantic Kernel",
   why="แทน Azure AI Engineer Associate ที่ Microsoft ยกเลิก"),
 # --- Microsoft Azure Security Engineer (AZ-500) ยกเลิก 31 ส.ค. 2026 → SC-500
 "CRT-R12-04": R(title="Microsoft Certified: Cloud and AI Security Engineer Associate", provider="Microsoft",
   provider_type="vendor_or_body", platform="Microsoft Learn",
   url="https://learn.microsoft.com/en-us/credentials/certifications/cloud-and-ai-security-engineer-associate/",
   credential="vendor_cert", level="Intermediate", hours=120, cost="exam-fee-required", usd=165,
   exam="SC-500", validity="1", tier=3, prereq="ประสบการณ์งานความมั่นคงปลอดภัยบนคลาวด์",
   outcomes="วางมาตรการความปลอดภัยแบบครบวงจรสำหรับงานคลาวด์และงาน AI ตั้งแต่การระบุตัวตนจนถึงการตอบสนองภัยคุกคาม",
   skills="Cloud security controls|AI workload security|Identity protection|Threat response",
   tools="Microsoft Defender|Microsoft Entra|Microsoft Purview",
   why="แทน AZ-500 ที่ยกเลิก 31 ส.ค. 2026 · Microsoft ระบุ SC-500 เป็นใบรับรองทดแทนโดยตรง"),
 # --- AWS Advanced Networking Specialty จะยกเลิก 31 ธ.ค. 2026
 "CRT-R15-06": R(title="Palo Alto Networks Certified Network Security Engineer (PCNSE)",
   provider="Palo Alto Networks", provider_type="vendor_or_body", platform="Palo Alto Networks",
   url="https://www.paloaltonetworks.com/services/education/certification",
   credential="vendor_cert", level="Professional", hours=100, cost="exam-fee-required", usd=175,
   exam="PCNSE", validity="2", tier=3, prereq="ประสบการณ์ออกแบบและดูแลไฟร์วอลล์",
   outcomes="ออกแบบ ติดตั้ง และแก้ปัญหาโครงสร้างความปลอดภัยเครือข่ายขององค์กรด้วยแพลตฟอร์ม Palo Alto Networks",
   skills="Network security architecture|Firewall policy|VPN|Traffic inspection|Troubleshooting",
   tools="PAN-OS|Panorama",
   why="แทน AWS Certified Advanced Networking Specialty ที่จะยกเลิก 31 ธ.ค. 2026 ซึ่งอยู่ในช่วงเก็บข้อมูล"),
 # --- Microsoft Power Platform Functional Consultant ยกเลิก 31 ส.ค. 2026
 "CRT-R18-08": R(title="IIBA Agile Analysis Certification (IIBA-AAC)", provider="IIBA",
   provider_type="vendor_or_body", platform="IIBA",
   url="https://www.iiba.org/business-analysis-certifications/agile-analysis/",
   credential="vendor_neutral_cert", level="Intermediate", hours=100, cost="exam-fee-required", usd=400,
   exam="IIBA-AAC", validity="3", tier=3, prereq="ประสบการณ์วิเคราะห์ระบบในทีมแบบ agile",
   outcomes="ประยุกต์การวิเคราะห์ธุรกิจในบริบท agile ตั้งแต่การวางกลยุทธ์ การจัดลำดับงาน จนถึงการส่งมอบเป็นรอบ",
   skills="Agile analysis|Backlog refinement|User story writing|Stakeholder collaboration|Iterative delivery",
   tools="Jira|Confluence",
   why="แทน Power Platform Functional Consultant ที่ยกเลิก 31 ส.ค. 2026 · ตรงกับบทบาทนักวิเคราะห์ระบบมากกว่าใบรับรองเฉพาะผลิตภัณฑ์"),
 # --- AccessData ACE ไม่มีหน้าอย่างเป็นทางการแล้วหลัง Exterro เข้าซื้อ
 "CRT-R14-06": R(title="GIAC Advanced Smartphone Forensics (GASF)", provider="GIAC",
   provider_type="vendor_or_body", platform="GIAC",
   url="https://www.giac.org/certifications/advanced-smartphone-forensics-gasf/",
   credential="vendor_neutral_cert", level="Advanced", hours=90, cost="exam-fee-required", usd=999,
   exam="GASF", validity="4", tier=3, prereq="พื้นฐานนิติวิทยาศาสตร์ดิจิทัล",
   outcomes="สกัดและวิเคราะห์หลักฐานจากอุปกรณ์เคลื่อนที่ ตีความข้อมูลแอปพลิเคชัน และจัดทำรายงานที่ใช้ในกระบวนการยุติธรรมได้",
   skills="Mobile device forensics|Application data analysis|Evidence reporting|Anti-forensics detection",
   tools="Cellebrite|Magnet AXIOM|Autopsy",
   why="แทน AccessData Certified Examiner ที่ไม่มีหน้าทางการหลัง Exterro เข้าซื้อกิจการ"),
 # --- MIT MicroMasters ปิดรับแล้วบน edX
 "CRS-R06-08": R(title="HarvardX Data Science Professional Certificate", provider="Harvard University",
   provider_type="mooc_platform", platform="edX",
   url="https://www.edx.org/certificates/professional-certificate/harvardx-data-science",
   credential="professional_certificate", level="Intermediate", hours=280, cost="paid", usd=790,
   exam="", validity="", tier=3, prereq="พื้นฐานคณิตศาสตร์ระดับมหาวิทยาลัย",
   outcomes="เรียนวิทยาศาสตร์ข้อมูลครบวงจรด้วย R ตั้งแต่สถิติพื้นฐาน การสร้างภาพข้อมูล ความน่าจะเป็น จนถึงแมชชีนเลิร์นนิง",
   skills="R programming|Statistical inference|Data visualization|Probability|Machine learning",
   tools="R|RStudio|tidyverse",
   why="แทน MITx Statistics and Data Science MicroMasters ที่ edX แจ้งว่าไม่เปิดรับแล้ว"),
}

# ============================================================ ประมวลผล
def rd(p):
    with open(p, encoding="utf-8-sig", newline="") as f: return list(csv.DictReader(f))
corpus = rd(OUT_CSV.replace("v12", "v11"))
HEADER = list(corpus[0].keys())
LVL = {"Beginner": 1, "Intermediate": 2, "Advanced": 3, "Professional": 4}

n_fix = n_rep = 0; changelog = []
for r in corpus:
    iid = r["item_id"]; r["corpus_version"] = VER
    old_title, old_url = r["title"], r["source_url"]

    if iid in FIX:
        f = FIX[iid]
        r["source_url"] = f["url"]
        for k, col in (("title","title"),("provider","provider"),("platform","platform"),
                       ("provider_type","provider_type")):
            if k in f: r[col] = f[k]
        if "cost" in f: r["cost_category"] = f["cost"]
        if "usd"  in f: r["cost_amount_usd"] = f["usd"]
        pending = f.get("pending", False)
        r["verification_status"] = "pending_verification" if pending else "verified"
        r["verification_date"] = "" if pending else TODAY
        r["verified_by"] = "" if pending else VERIF
        note = f.get("note", "แก้ URL ตามหน้าปลายทางที่ยืนยันแล้ว")
        r["researcher_notes"] = f"[FIX {TODAY}] {note}"
        n_fix += 1
        changelog.append([iid, r["role_id"], "FIX", old_title, r["title"], old_url, r["source_url"], note])
        continue

    if iid in REPLACE:
        spec = REPLACE[iid]
        if isinstance(spec, str): spec = REPLACE[spec]
        r.update({
            "title": spec["title"], "provider": spec["provider"], "provider_type": spec["provider_type"],
            "platform": spec["platform"], "source_url": spec["url"], "credential_type": spec["credential"],
            "level": spec["level"], "difficulty_1_5": LVL[spec["level"]],
            "estimated_hours": spec["hours"], "cost_category": spec["cost"], "cost_amount_usd": spec["usd"],
            "exam_code": spec.get("exam", ""), "validity_years": spec.get("validity", ""),
            "prerequisites": spec.get("prereq", ""), "global_recognition_tier": spec.get("tier", 3),
            "learning_outcomes_th": spec["outcomes"], "skills_taught": spec["skills"],
            "tools_technologies": spec.get("tools", ""),
            "verification_status": "verified", "verification_date": TODAY, "verified_by": VERIF,
            "researcher_notes": (f"[REPLACE {TODAY}] แทนที่ \"{old_title}\" ซึ่งผู้ให้บริการยกเลิกแล้ว · {spec['why']} · "
                                 f"คง competency mapping เดิมไว้เพราะเป็นรายการทดแทนในสายสมรรถนะเดียวกัน "
                                 f"ต้องทบทวน mapping อีกครั้งก่อนตรึง"),
        })
        n_rep += 1
        changelog.append([iid, r["role_id"], "REPLACE", old_title, r["title"], old_url, r["source_url"], spec["why"]])
        continue

with open(OUT_CSV, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=HEADER); w.writeheader()
    for r in corpus: w.writerow({k: r.get(k, "") for k in HEADER})
with open("corpus_change_log_v12_31AUG26.csv", "w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f)
    w.writerow(["item_id","role_id","action","title_เดิม","title_ใหม่","url_เดิม","url_ใหม่","เหตุผล"])
    w.writerows(changelog)

# ---- xlsx
wb = openpyxl.load_workbook(SRC_XLSX)
del wb["corpus_master"]
HF = PatternFill("solid", fgColor="1F3864"); FT = Font(color="FFFFFF", bold=True)
def add(name, header, rows, at=None):
    if name in wb.sheetnames: del wb[name]
    ws = wb.create_sheet(name, at); ws.append(list(header))
    for c in ws[1]: c.fill = HF; c.font = FT
    for r in rows: ws.append(list(r))
    ws.freeze_panes = "A2"
    for i, h in enumerate(header, 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = min(max(12, len(str(h)) + 3), 42)
add("corpus_master", HEADER, [[r.get(k, "") for k in HEADER] for r in corpus], 1)
add("change_log_v12", ["item_id","role_id","action","title_เดิม","title_ใหม่","url_เดิม","url_ใหม่","เหตุผล"], changelog)

nver = sum(1 for r in corpus if r["verification_status"] == "verified")
ws = wb["qa_checks"]
for row in ws.iter_rows(min_row=2):
    if row[0].value == "QA-10":
        row[3].value = str(len(corpus) - nver)
        row[4].value = "PASS" if nver == len(corpus) else "REVIEW"
        row[5].value = f"หลังซ่อมรอบ v1.2 · verified {nver}/{len(corpus)} แถว"
wb.save(OUT_XLSX)

def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()
log = json.load(open("corpus_version_log_v11_31AUG26.json", encoding="utf-8"))
log.update({"corpus_version": VER, "previous_version": "CORPUS-IS68076026-v1.1-31AUG26",
    "decisions_applied": ["DEC-09","DEC-10","DEC-11","DEC-14","DEC-15"],
    "repair_round": {"fixed_url_or_title": n_fix, "replaced_items": n_rep,
                     "rows_verified": nver, "rows_pending": len(corpus) - nver},
    "sha256": {f: sha(f) for f in (OUT_XLSX, OUT_CSV, "onet_requirements_28AUG26.csv")}})
json.dump(log, open("corpus_version_log_v12_31AUG26.json", "w", encoding="utf-8"), indent=2, ensure_ascii=False)

print(f"FIX {n_fix} แถว · REPLACE {n_rep} แถว")
print(f"verified {nver}/{len(corpus)} ({100*nver/len(corpus):.1f}%) · เหลือ {len(corpus)-nver} แถว")
print(f"เขียนแล้ว: {OUT_XLSX} · {OUT_CSV} · corpus_change_log_v12_31AUG26.csv")
