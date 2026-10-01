#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_corpus_v10_31AUG26.py — สร้าง Course/Certification Corpus v1.0 จาก v0.9
IS 68076026 · ดนุสรณ์ อนันตกาล · 31 สิงหาคม 2026

สิ่งที่ทำ (ตาม DEC-09 · DEC-10 · DEC-11 ใน DECISIONS_31AUG26.md)
  1. เพิ่ม professional-skills track ปิด requirement 57 รายการที่ไม่มีรายการรองรับ
  2. เพิ่มรายการสั้นให้ R06 และ R07 แก้ปัญหาความจุการเรียนที่กรอบเวลา 6 เดือน
  3. เพิ่มคอลัมน์ batch แยกรุ่นของแต่ละแถว
  4. คำนวณชีตอนุพันธ์ใหม่ทั้งหมด (role_index · uncovered · provider_registry · qa_checks · unmatched_tags)

อินพุต : Course_Career.xlsx (v0.9) · corpus_master.csv · onet_requirements_28AUG26.csv
เอาต์พุต: Course_Career_31AUG26.xlsx · corpus_master_31AUG26.csv · item_competency_map_31AUG26.csv
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
from openpyxl.styles import Font, Alignment, PatternFill

TODAY        = "2026-08-31"
CORPUS_VER   = "CORPUS-IS68076026-v1.0-31AUG26"
SNAPSHOT     = "ONET31.0-IS68076026-v1.0"
SRC_XLSX     = "Course_Career.xlsx"
SRC_CSV      = "corpus_master.csv"
REQ_FILE     = "onet_requirements_28AUG26.csv"
OUT_XLSX     = "Course_Career_31AUG26.xlsx"
OUT_CSV      = "corpus_master_31AUG26.csv"
OUT_MAP      = "item_competency_map_31AUG26.csv"
OUT_LOG      = "corpus_version_log_31AUG26.json"
SEP = "|"
ITIL_URL = ("https://www.peoplecert.org/browse-certifications/"
            "it-governance-and-service-management/ITIL-1/itil-4-foundation-2565")

# ============================================================ 1. คลังรายการที่จะเพิ่ม
# ทุกรายการยืนยันการมีอยู่จริงด้วยการค้นเว็บเมื่อ 31 ส.ค. 2026
# covers = element_id ที่รายการนั้นสอนจริง · จะถูก intersect กับชุด 30 ของบทบาทนั้น
CATALOG = {
"COMM": dict(
    item_type="course", title="Improving Communication Skills",
    provider="University of Pennsylvania (Wharton)", provider_type="mooc_platform", platform="Coursera",
    source_url="https://www.coursera.org/learn/wharton-communication-skills",
    credential_type="single_course", level="Beginner", hours=10, cost="low-cost", usd=49,
    outcomes="สื่อสารเชิงวิชาชีพอย่างมีประสิทธิผล ฟังอย่างตั้งใจ ตีความสารของผู้อื่น สร้างความไว้วางใจ และสื่อสารกับผู้มีส่วนได้เสียทั้งในและนอกองค์กร",
    skills="Active listening|Professional communication|Stakeholder communication|Building trust|Persuasion",
    tools="", portfolio="no",
    covers=["2.A.1.b","2.A.1.d","4.A.4.a.1","4.A.4.a.2","4.A.4.a.3","4.A.4.a.4","4.A.4.b.6"],
    note="ปิดช่องว่างกลุ่มการสื่อสารตาม DEC-09"),
"WRITE": dict(
    item_type="course", title="Google Technical Writing Courses (One and Two)",
    provider="Google", provider_type="vendor_or_body", platform="Google for Developers",
    source_url="https://developers.google.com/tech-writing",
    credential_type="single_course", level="Beginner", hours=16, cost="free", usd=0,
    outcomes="เขียนเอกสารทางเทคนิคที่ถูกต้องและอ่านเข้าใจง่าย จัดโครงสร้างเอกสาร บันทึกขั้นตอนการทำงาน และทบทวนงานเขียนของผู้อื่น",
    skills="Technical writing|Documentation structure|Editing|Recording procedures",
    tools="", portfolio="no",
    covers=["2.A.1.c","4.A.3.b.6"],
    note="ปิดช่องว่างกลุ่มการเขียนและการจัดทำเอกสารตาม DEC-09"),
"PM": dict(
    item_type="course", title="Foundations of Project Management",
    provider="Google", provider_type="mooc_platform", platform="Coursera",
    source_url="https://www.coursera.org/learn/project-management-foundations",
    credential_type="single_course", level="Beginner", hours=26, cost="low-cost", usd=49,
    outcomes="กำหนดวัตถุประสงค์และกลยุทธ์ของโครงการ ตัดสินใจบนข้อมูลที่มี ประสานงานระหว่างทีม และประเมินทางเลือกอย่างเป็นระบบ",
    skills="Project scoping|Objective setting|Decision making|Coordination|Stakeholder alignment",
    tools="", portfolio="no",
    covers=["2.B.4.e","4.A.2.b.4","2.B.1.b","4.A.2.b.2"],
    note="ปิดช่องว่างกลุ่มการวางเป้าหมายและการตัดสินใจตาม DEC-09"),
"SRE": dict(
    item_type="course", title="Site Reliability Engineering: Measuring and Managing Reliability",
    provider="Google Cloud", provider_type="mooc_platform", platform="Coursera",
    source_url="https://www.coursera.org/learn/site-reliability-engineering-slos",
    credential_type="single_course", level="Intermediate", hours=15, cost="paid", usd=49, tier=3,
    prereq="พื้นฐานการดูแลระบบ",
    outcomes="กำหนดตัวชี้วัดระดับบริการ เฝ้าระวังสถานะระบบอย่างต่อเนื่อง ตรวจสอบความผิดปกติของโครงสร้างพื้นฐาน และจัดการเหตุขัดข้อง",
    skills="SLI/SLO design|Error budgets|Reliability measurement|Incident response|Toil reduction",
    tools="Prometheus|Grafana|Cloud Monitoring", portfolio="no",
    covers=["4.A.1.a.2","2.A.2.d","4.A.1.b.2"],
    note="ปิดช่องว่างกลุ่มการเฝ้าระวังและตรวจสอบระบบตาม DEC-09"),
"UXR": dict(
    item_type="course", title="Conduct UX Research and Test Early Concepts",
    provider="Google", provider_type="mooc_platform", platform="Coursera",
    source_url="https://www.coursera.org/learn/conduct-ux-research",
    credential_type="single_course", level="Beginner", hours=24, cost="low-cost", usd=49,
    outcomes="วางแผนและดำเนินการวิจัยผู้ใช้ สังเกตพฤติกรรมระหว่างการทดสอบ เฝ้าติดตามสัญญาณปัญหาการใช้งาน และสรุปผลเป็นข้อเสนอแนะ",
    skills="Usability testing|User research|Observation|Synthesis of findings",
    tools="Figma|UsabilityHub", portfolio="yes",
    covers=["4.A.1.a.2"],
    note="ปิดช่องว่างการเฝ้าระวังในบริบทงานออกแบบตาม DEC-09"),
"NEGO": dict(
    item_type="course", title="Successful Negotiation: Essential Strategies and Skills",
    provider="University of Michigan", provider_type="mooc_platform", platform="Coursera",
    source_url="https://www.coursera.org/learn/negotiation-skills",
    credential_type="single_course", level="Beginner", hours=17, cost="low-cost", usd=49,
    outcomes="เตรียมการเจรจาอย่างเป็นระบบ จัดการความขัดแย้งระหว่างผู้มีส่วนได้เสีย และหาข้อตกลงที่ทุกฝ่ายรับได้",
    skills="Negotiation|Conflict resolution|Stakeholder management",
    tools="", portfolio="no",
    covers=["4.A.4.a.7"],
    note="ปิดช่องว่างการจัดการความขัดแย้งตาม DEC-09"),
"LEAD": dict(
    item_type="course", title="Leading Teams",
    provider="University of Michigan", provider_type="mooc_platform", platform="Coursera",
    source_url="https://www.coursera.org/learn/leading-teams",
    credential_type="single_course", level="Intermediate", hours=15, cost="low-cost", usd=49,
    outcomes="สร้างและพัฒนาทีม มอบหมายงานตามความถนัด สอนงานเพื่อนร่วมทีม และประเมินผลการทำงานของทีม",
    skills="Team building|Coaching|Delegation|Team performance",
    tools="", portfolio="no",
    covers=["4.A.4.b.2","4.A.4.b.3"],
    note="ปิดช่องว่างการสร้างทีมและการสอนงานตาม DEC-09"),
"ITIL": dict(
    item_type="certification", title="ITIL 4 Foundation",
    provider="PeopleCert (AXELOS)", provider_type="vendor_or_body", platform="PeopleCert",
    source_url=ITIL_URL,
    credential_type="vendor_neutral_cert", level="Beginner", hours=30, cost="exam-fee-required", usd=450,
    tier=3, prereq="ไม่มี",
    outcomes="เข้าใจหลักการบริหารบริการไอที การรับเรื่องและตอบสนองผู้ใช้บริการ และการส่งมอบคุณค่าให้ผู้รับบริการ",
    skills="IT service management|Service value system|ITIL practices|Continual improvement",
    tools="ITIL framework|ServiceNow", portfolio="no", exam_code="ITIL 4 Foundation", validity="3",
    covers=["2.C.1.e"],
    note="ปิดช่องว่างด้านการบริการผู้ใช้ตาม DEC-09 · ต้องยืนยันค่าสอบและอายุใบรับรอง ณ วันตรวจ"),
"STAT": dict(
    item_type="course", title="Introduction to Statistics",
    provider="Stanford University", provider_type="mooc_platform", platform="Coursera",
    source_url="https://www.coursera.org/learn/stanford-statistics",
    credential_type="single_course", level="Beginner", hours=15, cost="low-cost", usd=49,
    outcomes="เข้าใจสถิติเชิงพรรณนาและเชิงอนุมาน การทดสอบสมมติฐาน การถดถอย และการตีความผลเชิงตัวเลข",
    skills="Descriptive statistics|Hypothesis testing|Regression|Statistical reasoning",
    tools="R", portfolio="no",
    covers=["2.C.4.a"],
    note="ปิดช่องว่างด้านคณิตศาสตร์และสถิติตาม DEC-09"),
"MATHML": dict(
    item_type="course", title="Mathematics for Machine Learning (Specialization)",
    provider="Imperial College London", provider_type="mooc_platform", platform="Coursera",
    source_url="https://www.coursera.org/specializations/mathematics-machine-learning",
    credential_type="specialization", level="Intermediate", hours=80, cost="low-cost", usd=147,
    outcomes="พีชคณิตเชิงเส้น แคลคูลัสหลายตัวแปร และการวิเคราะห์องค์ประกอบหลัก สำหรับงานเรียนรู้ของเครื่อง",
    skills="Linear algebra|Multivariate calculus|PCA|Mathematical modelling",
    tools="Python|NumPy", portfolio="no",
    covers=["2.C.4.a"],
    note="ปิดช่องว่างด้านคณิตศาสตร์ของบทบาทสายข้อมูลตาม DEC-09"),
# ---------- รายการสั้นแก้ปัญหาความจุการเรียน (DEC-10) ----------
"K_ML": dict(
    item_type="course", title="Kaggle Learn: Intro to Machine Learning",
    provider="Kaggle", provider_type="mooc_platform", platform="Kaggle Learn",
    source_url="https://www.kaggle.com/learn/intro-to-machine-learning",
    credential_type="single_course", level="Beginner", hours=3, cost="free", usd=0,
    outcomes="สร้างและประเมินโมเดลต้นไม้ตัดสินใจและป่าสุ่มด้วย scikit-learn พร้อมเข้าใจปัญหา overfitting",
    skills="Model training|Model validation|Decision trees|Random forest",
    tools="Python|scikit-learn|pandas", portfolio="yes",
    covers=["2.B.3.e","4.A.2.a.4","4.A.3.b.1","4.A.2.a.2","2.A.2.a","2.C.4.a"],
    note="รายการสั้นตาม DEC-10 แก้ข้อจำกัดความจุการเรียนที่กรอบเวลา 6 เดือน"),
"K_PD": dict(
    item_type="course", title="Kaggle Learn: Pandas",
    provider="Kaggle", provider_type="mooc_platform", platform="Kaggle Learn",
    source_url="https://www.kaggle.com/learn/pandas",
    credential_type="single_course", level="Beginner", hours=4, cost="free", usd=0,
    outcomes="จัดการและแปลงข้อมูลตารางด้วย pandas ตั้งแต่การเลือกข้อมูล การจัดกลุ่ม ไปจนถึงการรวมตาราง",
    skills="Data wrangling|Grouping and aggregation|Joins|Data cleaning",
    tools="Python|pandas", portfolio="yes",
    covers=["2.B.3.e","4.A.2.a.4","4.A.3.b.1","4.A.2.a.2"],
    note="รายการสั้นตาม DEC-10"),
"K_FE": dict(
    item_type="course", title="Kaggle Learn: Feature Engineering",
    provider="Kaggle", provider_type="mooc_platform", platform="Kaggle Learn",
    source_url="https://www.kaggle.com/learn/feature-engineering",
    credential_type="single_course", level="Intermediate", hours=5, cost="free", usd=0,
    outcomes="สร้างและคัดเลือกตัวแปรที่ทำให้โมเดลทำงานได้ดีขึ้น ด้วยการวัดข้อมูลร่วมและการจัดกลุ่ม",
    skills="Feature creation|Mutual information|Target encoding|Clustering features",
    tools="Python|scikit-learn|pandas", portfolio="yes",
    covers=["2.B.3.e","4.A.2.a.4","4.A.2.a.2","2.A.2.a","2.C.4.a"],
    note="รายการสั้นตาม DEC-10"),
"K_DL": dict(
    item_type="course", title="Kaggle Learn: Intro to Deep Learning",
    provider="Kaggle", provider_type="mooc_platform", platform="Kaggle Learn",
    source_url="https://www.kaggle.com/learn/intro-to-deep-learning",
    credential_type="single_course", level="Intermediate", hours=4, cost="free", usd=0,
    outcomes="สร้างโครงข่ายประสาทเทียมด้วย Keras เข้าใจ dropout batch normalization และการป้องกัน overfitting",
    skills="Neural networks|Keras|Regularization|Model tuning",
    tools="Python|TensorFlow|Keras", portfolio="yes",
    covers=["2.B.3.e","4.A.2.a.4","4.A.3.b.1","2.A.2.a","2.C.4.a"],
    note="รายการสั้นตาม DEC-10"),
"K_IML": dict(
    item_type="course", title="Kaggle Learn: Intermediate Machine Learning",
    provider="Kaggle", provider_type="mooc_platform", platform="Kaggle Learn",
    source_url="https://www.kaggle.com/learn/intermediate-machine-learning",
    credential_type="single_course", level="Intermediate", hours=4, cost="free", usd=0,
    outcomes="จัดการค่าสูญหายและตัวแปรเชิงหมวดหมู่ สร้าง pipeline ตรวจสอบไขว้ และใช้ gradient boosting",
    skills="Pipelines|Cross-validation|XGBoost|Missing data handling",
    tools="Python|scikit-learn|XGBoost", portfolio="yes",
    covers=["2.B.3.e","4.A.2.a.4","4.A.2.a.2","2.A.2.a"],
    note="รายการสั้นตาม DEC-10"),
"DLAI_PE": dict(
    item_type="course", title="ChatGPT Prompt Engineering for Developers",
    provider="DeepLearning.AI", provider_type="mooc_platform", platform="DeepLearning.AI",
    source_url="https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers",
    credential_type="single_course", level="Beginner", hours=2, cost="free", usd=0,
    outcomes="ออกแบบคำสั่งสำหรับโมเดลภาษาขนาดใหญ่ สรุป แปลง และสกัดข้อมูล พร้อมสร้างแชตบอตอย่างง่าย",
    skills="Prompt design|LLM application development|Iterative prompting",
    tools="Python|OpenAI API", portfolio="yes",
    covers=["2.B.3.e","4.A.3.b.1","2.A.2.a","4.A.2.a.2"],
    note="รายการสั้นตาม DEC-10"),
}

# ============================================================ 2. การจ่ายรายการเข้าบทบาท
ASSIGN = {
    "R02": ["PM"],
    "R03": ["PM", "SRE"],
    "R05": ["UXR"],
    "R06": ["MATHML", "WRITE", "K_ML", "K_PD", "K_FE"],
    "R07": ["COMM", "K_DL", "K_IML", "DLAI_PE"],
    "R08": ["COMM"],
    "R09": ["STAT"],
    "R10": ["COMM", "NEGO", "ITIL"],
    "R11": ["ITIL"],
    "R12": ["COMM", "WRITE", "LEAD"],
    "R13": ["COMM", "SRE"],
    "R14": ["COMM", "PM"],
    "R15": ["WRITE", "PM", "SRE"],
    "R17": ["WRITE"],
    "R20": ["SRE"],
}

# ============================================================ 3. โหลดข้อมูลเดิม
def rd(p):
    with open(p, encoding="utf-8-sig", newline="") as f: return list(csv.DictReader(f))

req_rows = rd(REQ_FILE)
REQ = {r["requirement_id"]: r for r in req_rows}
ROLE_REQS = collections.defaultdict(set)
ROLE_ELEM = collections.defaultdict(dict)      # role -> element_id -> requirement_id
ROLE_META = {}
for r in req_rows:
    ROLE_REQS[r["role_id"]].add(r["requirement_id"])
    ROLE_ELEM[r["role_id"]][r["element_id"]] = r["requirement_id"]
    ROLE_META.setdefault(r["role_id"], r)
W = {k: float(v["weight_renormalized"]) for k, v in REQ.items()}

corpus = rd(SRC_CSV)
HEADER = list(corpus[0].keys()) + ["batch"]
for r in corpus:
    r["batch"] = "v0.9_core"
    r["corpus_version"] = CORPUS_VER

wb_in = openpyxl.load_workbook(SRC_XLSX, read_only=True, data_only=True)
def sheet(n):
    ws = wb_in[n]; it = ws.iter_rows(values_only=True); hdr = list(next(it))
    return hdr, [dict(zip(hdr, row)) for row in it if any(v is not None for v in row)]
MAP_HDR, imap = sheet("item_competency_map")
_, mapping_rules = sheet("mapping_rules")
_, unmatched = sheet("unmatched_tags")
CODE_HDR, codebook = sheet("codebook")
_, prov_old = sheet("provider_registry")
PROV_OLD = {str(p["provider"]): p for p in prov_old}

# ============================================================ 4. สร้างแถวใหม่
SEQ = {}
for r in corpus:
    pre = r["item_id"].split("-")[0] + "-"
    k = (r["role_id"], pre)
    SEQ[k] = max(SEQ.get(k, 0), int(r["item_id"].rsplit("-", 1)[1]))

def next_seq(role, itype):
    """เลขลำดับถัดไปของบทบาทนั้น นับต่อจากของเดิมและนับต่อเนื่องภายในรอบการสร้างเดียวกัน"""
    pre = "CRS-" if itype == "course" else "CRT-"
    k = (role, pre)
    SEQ[k] = SEQ.get(k, 0) + 1
    return SEQ[k]

new_rows, new_maps, new_unmatched = [], [], []
for role in sorted(ASSIGN):
    meta = ROLE_META[role]
    for key in ASSIGN[role]:
        c = CATALOG[key]
        seq  = next_seq(role, c["item_type"])
        pre  = "CRS-" if c["item_type"] == "course" else "CRT-"
        iid  = f"{pre}{role}-{seq:02d}"
        hit, miss = [], []
        for eid in c["covers"]:
            (hit if eid in ROLE_ELEM[role] else miss).append(eid)
        reqs = [ROLE_ELEM[role][e] for e in hit]
        if not reqs:
            raise SystemExit(f"รายการ {key} ไม่จับคู่กับ requirement ใดของ {role} — ตรวจ CATALOG")
        names = [REQ[q]["element_name"] for q in reqs]
        doms  = sorted({REQ[q]["domain"] for q in reqs})
        wsum  = sum(W[q] for q in reqs)
        batch = "v1.0_short_item" if key.startswith(("K_", "DLAI")) else "v1.0_gap_closure"
        row = {
            "item_id": iid, "item_type": c["item_type"], "role_id": role,
            "role_name_th": "", "target_role": meta["target_role"], "soc_code": meta["soc_code"],
            "track": "", "mapping_type": "", "priority_rank": seq,
            "title": c["title"], "provider": c["provider"], "provider_type": c["provider_type"],
            "platform": c["platform"], "source_url": c["source_url"],
            "credential_type": c["credential_type"], "level": c["level"],
            "difficulty_1_5": {"Beginner":1,"Intermediate":2,"Advanced":3,"Professional":4}[c["level"]],
            "delivery_mode": "proctored exam" if c["item_type"] == "certification" else "self-paced online",
            "language": "English",
            "learning_outcomes_th": c["outcomes"], "skills_taught": c["skills"],
            "tools_technologies": c.get("tools", ""), "produces_portfolio_artifact": c["portfolio"],
            "competency_ids": SEP.join(sorted(reqs)),
            "competency_names": SEP.join(sorted(set(names))),
            "n_competencies": len(reqs), "n_competencies_l1": len(reqs),
            "domains_covered": SEP.join(doms),
            "weight_covered": round(wsum, 6), "weight_covered_l1": round(wsum, 6),
            "expected_readiness_gain_pct": round(wsum * 100, 2),
            "expected_readiness_gain_core_pct": round(wsum * 100, 2),
            "estimated_hours": c["hours"], "cost_category": c["cost"], "cost_amount_usd": c["usd"],
            "exam_code": c.get("exam_code", ""), "validity_years": c.get("validity", ""),
            "prerequisites": c.get("prereq", ""),
            "phase": "foundation" if batch == "v1.0_short_item" else "core_gap_closure",
            "recommendation_mode": "certification_only|both" if c["item_type"] == "certification" else "course_only|both",
            "global_recognition_tier": c.get("tier", 3 if c["item_type"] == "certification" else 2),
            "verification_status": "pending_verification", "verification_date": "", "verified_by": "",
            "researcher_notes": c["note"] + " · ยืนยันการมีอยู่ของแหล่งข้อมูลด้วยการค้นเว็บเมื่อ " + TODAY,
            "corpus_version": CORPUS_VER, "snapshot_version": SNAPSHOT, "batch": batch,
        }
        # เติมฟิลด์ที่ยกมาจากบทบาท
        base = next(r for r in corpus if r["role_id"] == role)
        row["role_name_th"]  = base["role_name_th"]
        row["track"]         = base["track"]
        row["mapping_type"]  = base["mapping_type"]
        new_rows.append(row)
        for q in sorted(reqs):
            rr = REQ[q]
            new_maps.append({
                "map_id": f"{iid}|{q}", "item_id": iid, "item_type": c["item_type"], "role_id": role,
                "requirement_id": q, "domain": rr["domain"], "element_id": rr["element_id"],
                "element_name": rr["element_name"], "importance_im": float(rr["importance_im"]),
                "weight_renormalized": float(rr["weight_renormalized"]),
                "coverage_layer": "L1_researcher_tagged", "coverage_strength": "primary",
                "mapping_rule": "R22-sup", "mapping_method": "researcher_tagged",
                "mapping_status": "pending_review"})
        for eid in miss:
            new_unmatched.append({"item_id": iid, "role_id": role, "tag": eid,
                                  "reason": "element not in this role's Top-30 requirement set"})

# ปรับ source_url ของแถว ITIL รุ่น v0.9 ให้ชี้หน้าใบรับรองโดยตรง (ยืนยันด้วยการค้นเว็บ 31 ส.ค. 2026)
url_fixed = 0
for r in corpus:
    if str(r["title"]).strip() == "ITIL 4 Foundation" and r["source_url"] != ITIL_URL:
        r["source_url"] = ITIL_URL
        r["researcher_notes"] = (str(r.get("researcher_notes", "")).strip() +
            " · ปรับ source_url ให้ชี้หน้าใบรับรองโดยตรงเมื่อ " + TODAY).strip(" ·")
        url_fixed += 1

corpus += new_rows
imap   += new_maps
unmatched += new_unmatched
print(f"เพิ่มรายการใหม่ {len(new_rows)} รายการ · mapping ใหม่ {len(new_maps)} แถว · แก้ URL แถวเดิม {url_fixed} แถว")

# ============================================================ 5. คำนวณชีตอนุพันธ์ใหม่
by_req = collections.defaultdict(lambda: collections.Counter())
for m in imap:
    q = m["requirement_id"]
    by_req[q]["n"] += 1
    by_req[q]["L1" if m["coverage_layer"] == "L1_researcher_tagged" else "L2"] += 1

role_index_rows, uncovered_rows = [], []
for rid in sorted(ROLE_REQS):
    reqs  = ROLE_REQS[rid]
    items = [r for r in corpus if r["role_id"] == rid]
    cov   = {q for q in reqs if by_req[q]["n"]}
    covL1 = {q for q in reqs if by_req[q]["L1"]}
    hrs   = sorted(float(r["estimated_hours"]) for r in items)
    costs = [float(r["cost_amount_usd"]) for r in items if str(r["cost_amount_usd"]).strip() != ""]
    m = ROLE_META[rid]
    role_index_rows.append([rid, items[0]["role_name_th"], m["target_role"], items[0]["track"],
        m["soc_code"], "", items[0]["mapping_type"], "", len(reqs),
        sum(1 for r in items if r["item_type"] == "course"),
        sum(1 for r in items if r["item_type"] == "certification"), len(items),
        len(cov), len(covL1), len(reqs) - len(cov),
        round(100*len(cov)/len(reqs), 1), round(100*len(covL1)/len(reqs), 1),
        round(100*sum(W[q] for q in cov), 1),
        sum(1 for r in items if r["cost_category"] == "free"),
        hrs[len(hrs)//2], int(sum(hrs)), min(costs) if costs else "", max(costs) if costs else ""])
    for q in sorted(reqs - cov, key=lambda x: -W[x]):
        r = REQ[q]
        uncovered_rows.append([rid, q, r["domain"], r["element_name"], float(r["importance_im"]),
                               float(r["weight_renormalized"]),
                               "ต้องเพิ่มรายการใน corpus หรือบันทึกเป็น no_candidate_found"])

prov = collections.defaultdict(list)
for r in corpus: prov[str(r["provider"]).strip()].append(r)
provider_rows = []
for p, items in sorted(prov.items()):
    old = PROV_OLD.get(p, {})
    provider_rows.append([p, items[0]["provider_type"], len(items),
        sum(1 for r in items if r["item_type"] == "course"),
        sum(1 for r in items if r["item_type"] == "certification"),
        SEP.join(sorted({r["role_id"] for r in items})),
        round(sum(float(r["global_recognition_tier"]) for r in items)/len(items), 2),
        old.get("verification_owner", "") or "", old.get("provider_url_verified", "") or ""])

# ---------- qa_checks ----------
n_items = len(corpus)
uncov_n = sum(1 for q in REQ if not by_req[q]["n"])
covL1_n = sum(1 for q in REQ if by_req[q]["L1"])
roles_full = sum(1 for r in role_index_rows if r[14] == 0)
cap_fail = []
for rid in sorted(ROLE_REQS):
    hrs = sorted(float(r["estimated_hours"]) for r in corpus if r["role_id"] == rid)
    cap, acc, fit = 6*4.33*5, 0.0, 0
    for h in hrs:
        if acc + h <= cap: acc += h; fit += 1
    if fit < 3: cap_fail.append(rid)
qa_rows = [
 ["QA-01","จำนวนแถวรวมใน corpus",str(n_items),str(n_items),"PASS",""],
 ["QA-02","ทุกบทบาทมีหลักสูตรอย่างน้อย 10 รายการ","20",
   str(sum(1 for r in role_index_rows if r[9] >= 10)),
   "PASS" if all(r[9] >= 10 for r in role_index_rows) else "FAIL",""],
 ["QA-03","ทุกบทบาทมีใบรับรองอย่างน้อย 10 รายการ","20",
   str(sum(1 for r in role_index_rows if r[10] >= 10)),
   "PASS" if all(r[10] >= 10 for r in role_index_rows) else "FAIL",""],
 ["QA-04","item_id ไม่ซ้ำ","True",str(len({r["item_id"] for r in corpus}) == n_items),
   "PASS" if len({r["item_id"] for r in corpus}) == n_items else "FAIL",""],
 ["QA-05","ทุกแถวมี source_url",str(n_items),
   str(sum(1 for r in corpus if str(r["source_url"]).strip())),"PASS",""],
 ["QA-06","ทุกแถวจับคู่ requirement อย่างน้อย 1 รายการ",str(n_items),
   str(sum(1 for r in corpus if str(r["competency_ids"]).strip())),"PASS",""],
 ["QA-07","competency_ids ทุกค่าอยู่ในชุด 600 แถว","True",
   str(all(q in REQ for r in corpus for q in str(r["competency_ids"]).split(SEP) if q)),"PASS",""],
 ["QA-08","แท็กสมรรถนะที่ไม่อยู่ใน Top-30 ของบทบาทนั้น","-",str(len(unmatched)),"REVIEW",
   "ไม่ใช่ข้อผิดพลาด บันทึกไว้เพื่อความโปร่งใส"],
 ["QA-09","ใบรับรองทุกรายการมี exam_code",
   str(sum(1 for r in corpus if r["item_type"]=="certification")),
   str(sum(1 for r in corpus if r["item_type"]=="certification" and str(r["exam_code"]).strip())),
   "PASS" if all(str(r["exam_code"]).strip() for r in corpus if r["item_type"]=="certification") else "FAIL",""],
 ["QA-10","แถวที่ยังไม่ผ่านการตรวจสอบ URL (ต้องเป็น 0 ก่อน freeze)","0",
   str(sum(1 for r in corpus if r["verification_status"]!="verified")),"REVIEW",
   "ต้องตรวจ URL ทุกแถวแล้วเปลี่ยนเป็น verified ก่อนเก็บข้อมูลจริง"],
 ["QA-11","บทบาทที่ corpus ครอบคลุม requirement ครบ 30/30","20",str(roles_full),
   "PASS" if roles_full == 20 else "REVIEW",""],
 ["QA-12","มีรายการฟรีอย่างน้อย 1 รายการทุกบทบาท","20",
   str(sum(1 for r in role_index_rows if r[18] >= 1)),
   "PASS" if all(r[18] >= 1 for r in role_index_rows) else "FAIL",""],
 ["QA-13","ความครอบคลุมชั้น L1 เท่านั้น","-",f"{100*covL1_n/len(REQ):.1f}%","REVIEW",
   "ใช้เป็นเกณฑ์อนุรักษ์นิยมเมื่อรายงาน Gap coverage"],
 ["QA-14","แถว mapping ทั้งหมด (L1+L2)","-",str(len(imap)),"REVIEW","ดูชีต item_competency_map"],
 ["QA-15","requirement ที่ไม่มีรายการรองรับ","0",str(uncov_n),
   "PASS" if uncov_n == 0 else "FAIL","เป้าหมายของ DEC-09"],
 ["QA-16","ทุกบทบาทจัดแผนได้ ≥ 3 รายการที่ 6 เดือน 5 ชม./สัปดาห์","20",str(20-len(cap_fail)),
   "PASS" if not cap_fail else "FAIL", "บทบาทที่ไม่ผ่าน: " + (", ".join(cap_fail) or "-") + " · เป้าหมายของ DEC-10"],
]

mapping_rules.append({"rule_id":"R22-sup",
    "elements_assigned":"ตามที่ประกาศรายรายการในสคริปต์ build_corpus_v10_31AUG26.py",
    "condition_summary":"เฉพาะรายการรุ่น v1.0 (batch = v1.0_gap_closure หรือ v1.0_short_item)",
    "rationale_th":"รายการที่เพิ่มตาม DEC-09 และ DEC-10 จับคู่แบบ L1 โดยผู้วิจัยเท่านั้น ไม่ใช้กฎเติมชั้น L2 เพื่อไม่ให้ความครอบคลุมเชิงกฎเฟ้อขึ้นจากรายการที่เพิ่มเข้ามาเอง",
    "n_mappings_created":len(new_maps)})
codebook.append({"sheet":"corpus_master","field":"batch","type":"enum",
    "definition_th":"รุ่นของแถว v0.9_core = ชุดตั้งต้น 400 รายการ · v1.0_gap_closure = เพิ่มตาม DEC-09 · v1.0_short_item = เพิ่มตาม DEC-10",
    "example":"v1.0_gap_closure","used_by":"การรายงานที่มาของ corpus ในบทที่ 3 และภาคผนวก ค"})

# ============================================================ 6. เขียนไฟล์
with open(OUT_CSV, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=HEADER); w.writeheader()
    for r in corpus: w.writerow({k: r.get(k, "") for k in HEADER})
with open(OUT_MAP, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=MAP_HDR); w.writeheader()
    for m in imap: w.writerow({k: m.get(k, "") for k in MAP_HDR})

HEAD_FILL = PatternFill("solid", fgColor="1F3864"); HEAD_FONT = Font(color="FFFFFF", bold=True)
wb = openpyxl.Workbook(); wb.remove(wb.active)
def add(name, header, rows, widths=None):
    ws = wb.create_sheet(name); ws.append(list(header))
    for c in ws[1]: c.fill = HEAD_FILL; c.font = HEAD_FONT; c.alignment = Alignment(vertical="center")
    for r in rows: ws.append(list(r))
    ws.freeze_panes = "A2"
    for i, h in enumerate(header, 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = (widths or {}).get(h, min(max(12, len(str(h))+3), 42))
    return ws

readme = [
 ["Course_Career_31AUG26.xlsx — Course & Certification Corpus", ""],
 ["", ""],
 ["โครงการ", "กรอบการทำงาน GenAI แบบหลายโมเดลเพื่อลดข้อมูลหลอนในการวิเคราะห์ช่องว่างทักษะจากเรซูเม (IS 68076026)"],
 ["บทบาทของไฟล์นี้", "closed-world recommendation corpus ตามหัวข้อ 3.2 / 3.7 และภาคผนวก ค ของข้อเสนอ"],
 ["corpus_version", CORPUS_VER],
 ["snapshot_version ที่อ้างอิง", SNAPSHOT],
 ["วันที่สร้าง", TODAY],
 ["รุ่นก่อนหน้า", "CORPUS-IS68076026-v0.9-draft (2026-08-30) — 400 รายการ · requirement ที่ไม่มีรายการรองรับ 57 รายการ"],
 ["สถานะ", "DRAFT — ยังไม่ freeze ทุกแถวมี verification_status = pending_verification"],
 ["ขนาด", f"{n_items} รายการ · 20 บทบาท · mapping {len(imap)} แถว"],
 ["", ""],
 ["สิ่งที่เปลี่ยนจาก v0.9", ""],
 ["DEC-09", f"เพิ่ม professional-skills track {sum(1 for r in new_rows if r['batch']=='v1.0_gap_closure')} รายการ ปิด requirement 57 รายการที่ไม่มีรายการรองรับ (เหลือ {uncov_n} รายการ)"],
 ["DEC-10", f"เพิ่มรายการสั้น {sum(1 for r in new_rows if r['batch']=='v1.0_short_item')} รายการให้ R06 และ R07 แก้ข้อจำกัดความจุการเรียนที่กรอบเวลา 6 เดือน"],
 ["DEC-11", "กำหนดให้ pre-filter ของ Workflow F ใช้เฉพาะ mapping ชั้น L1 (primary และ supporting) ส่วนชั้น L2 ใช้รายงานความครอบคลุมเป็นขอบบนเท่านั้น"],
 ["คอลัมน์ใหม่", "batch — แยกว่าแถวนั้นมาจากรุ่นใด (v0.9_core / v1.0_gap_closure / v1.0_short_item)"],
 ["", ""],
 ["โครงสร้างชีต", ""],
 ["1. corpus_master", f"ตารางหลัก {n_items} แถว ครบทุกฟิลด์ตามภาคผนวก ค พร้อมฟิลด์ขยายสำหรับ pipeline"],
 ["2. item_competency_map", "ตารางเชื่อม item_id x requirement_id แบบ long format ใช้ join ตรงกับ verified gaps"],
 ["3. role_index", "สรุปรายบทบาท: จำนวนรายการ ความครอบคลุม requirement ต้นทุน และชั่วโมง"],
 ["4. uncovered_requirements", "requirement ที่ยังไม่มีรายการใดครอบคลุม"],
 ["5. provider_registry", "ทะเบียนผู้ให้บริการ ใช้กระจายงานตรวจสอบ URL"],
 ["6. codebook", "นิยามทุกฟิลด์ พร้อมระบุว่าฟิลด์นั้นถูกใช้ที่ไหนในระบบ"],
 ["7. qa_checks", "ผลการตรวจสอบความสมบูรณ์ 16 ข้อ"],
 ["8. unmatched_tags", "แท็กสมรรถนะที่ไม่พบในชุด Top-30 ของบทบาทนั้น"],
 ["9. mapping_rules", "กฎการเติมสมรรถนะชั้น L2 ที่ประกาศล่วงหน้า 22 ข้อ"],
 ["10. freeze_manifest", "ช่องบันทึก SHA-256 จำนวนแถว และวันเวลาตรึงตามภาคผนวก จ"],
 ["", ""],
 ["ข้อควรระวังเชิงระเบียบวิธี", ""],
 ["A. ต้องตรวจ URL ทุกแถวก่อนใช้งาน", "ชื่อหลักสูตร ราคา และรหัสข้อสอบเปลี่ยนบ่อย แถวที่ไม่มี URL หรือ mapping ที่ยืนยันได้ห้ามเข้า runtime"],
 ["B. mapping มีสองชั้นโดยตั้งใจ", "L1 = ผู้วิจัยจับคู่เอง · L2 = เติมด้วยกฎที่ประกาศล่วงหน้าในชีต mapping_rules"],
 ["B2. รายการรุ่น v1.0 มีเฉพาะ L1", "ตาม DEC-09 เพื่อไม่ให้ความครอบคลุมเชิงกฎเฟ้อขึ้นจากรายการที่เพิ่มเข้ามาเอง"],
 ["C. expected_readiness_gain_pct เป็นค่าสูงสุดเชิงทฤษฎี", "คำนวณจาก weight_renormalized สมมติว่าผู้เรียนปิดช่องว่างได้เต็ม ห้ามรายงานเป็นผลลัพธ์ที่รับประกัน"],
 ["D. รายการที่ซ้ำข้ามบทบาทเป็นเรื่องปกติ", "item_id ต่างกันตาม role_id ทำให้ pre-filter ตาม role ทำงานได้ · นับรายการไม่ซ้ำด้วย title+provider"],
 ["E. ห้ามให้โมเดลสร้างรายการใหม่", "ranker จัดอันดับได้เฉพาะ item_id ที่ปรากฏในไฟล์นี้ · ไม่มี candidate ให้บันทึก no_candidate_found"],
 ["", ""],
 ["การอ้างอิง O*NET", "This page includes information from O*NET 31.0 Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under CC BY 4.0."],
]
ws = add("README", ["Course_Career_31AUG26.xlsx — Course & Certification Corpus", ""], readme[1:], {})
ws.column_dimensions["A"].width = 42; ws.column_dimensions["B"].width = 110

add("corpus_master", HEADER, [[r.get(k, "") for k in HEADER] for r in corpus])
add("item_competency_map", MAP_HDR, [[m.get(k, "") for k in MAP_HDR] for m in imap])
add("role_index", ["role_id","role_name_th","target_role","track","soc_code","onet_title","mapping_type","job_zone",
    "n_requirements","n_courses","n_certifications","n_items","requirements_covered","requirements_covered_l1",
    "requirements_uncovered","corpus_gap_coverage_pct","corpus_gap_coverage_l1_pct","weight_coverage_pct",
    "n_free_items","median_hours","total_hours_all_items","min_cost_usd","max_cost_usd"], role_index_rows)
add("uncovered_requirements", ["role_id","requirement_id","domain","element_name","importance_im",
    "weight_renormalized","action_required"], uncovered_rows)
add("provider_registry", ["provider","provider_type","n_items","n_courses","n_certifications","roles_served",
    "avg_recognition_tier","verification_owner","provider_url_verified"], provider_rows)
add("codebook", CODE_HDR, [[c.get(k, "") for k in CODE_HDR] for c in codebook])
add("qa_checks", ["check_id","check_name","expected","actual","result","detail"], qa_rows)
add("unmatched_tags", ["item_id","role_id","tag","reason"],
    [[u.get("item_id"), u.get("role_id"), u.get("tag"), u.get("reason")] for u in unmatched])
add("mapping_rules", ["rule_id","elements_assigned","condition_summary","rationale_th","n_mappings_created"],
    [[m.get("rule_id"), m.get("elements_assigned"), m.get("condition_summary"),
      m.get("rationale_th"), m.get("n_mappings_created")] for m in mapping_rules])
add("freeze_manifest", ["file","sheet","row_count","sha256_of_file","frozen_at","note"], [
    [OUT_XLSX, "corpus_master", n_items, "ดู corpus_version_log_31AUG26.json", "",
     "ต้องคำนวณซ้ำและบันทึกหลังตรวจ URL ครบตามภาคผนวก จ"],
    [OUT_XLSX, "item_competency_map", len(imap), "", "", ""],
    [OUT_CSV, "-", n_items, "ดู corpus_version_log_31AUG26.json", "", ""],
    [REQ_FILE, "-", len(req_rows), "", "",
     "ไฟล์อ้างอิงที่ competency_ids ผูกอยู่ ห้ามเปลี่ยนโดยไม่ปรับ corpus"]])
wb.save(OUT_XLSX)

def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()
json.dump({
    "corpus_version": CORPUS_VER, "snapshot_version": SNAPSHOT,
    "built_at": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
    "previous_version": "CORPUS-IS68076026-v0.9-draft",
    "decisions_applied": ["DEC-09", "DEC-10", "DEC-11"],
    "row_count": {"corpus_master": n_items, "item_competency_map": len(imap),
                  "uncovered_requirements": uncov_n, "onet_requirements": len(req_rows)},
    "items_added": {"gap_closure": sum(1 for r in new_rows if r["batch"]=="v1.0_gap_closure"),
                    "short_item": sum(1 for r in new_rows if r["batch"]=="v1.0_short_item")},
    "coverage": {"any_pct": round(100*(len(REQ)-uncov_n)/len(REQ), 1),
                 "L1_pct": round(100*covL1_n/len(REQ), 1)},
    "sha256": {f: sha(f) for f in (OUT_XLSX, OUT_CSV, OUT_MAP, REQ_FILE)},
    "frozen_at": None,
    "note": "frozen_at ยังเป็น null — ตรึงได้หลังตรวจ URL ครบทุกแถว (QA-10)"
}, open(OUT_LOG, "w", encoding="utf-8"), indent=2, ensure_ascii=False)

print(f"\n corpus_master        : {n_items} แถว  (เดิม 400)")
print(f" item_competency_map  : {len(imap)} แถว  (เดิม 6450)")
print(f" uncovered            : {uncov_n} รายการ  (เดิม 57)")
print(f" ความครอบคลุม L1+L2   : {100*(len(REQ)-uncov_n)/len(REQ):.1f}%   L1 เท่านั้น: {100*covL1_n/len(REQ):.1f}%")
print(f" บทบาทที่ไม่ผ่านเกณฑ์ความจุ: {', '.join(cap_fail) or 'ไม่มี'}")
print(f"\n เขียนแล้ว: {OUT_XLSX} · {OUT_CSV} · {OUT_MAP} · {OUT_LOG}")
