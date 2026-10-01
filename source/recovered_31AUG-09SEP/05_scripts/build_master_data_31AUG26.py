#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_master_data_31AUG26.py — สร้างชุด Master Data ที่ระบบและงานวิจัยต้องใช้
IS 68076026 · ดนุสรณ์ อนันตกาล · 31 สิงหาคม 2026

ครอบคลุมรายการ 2.1–2.6 · 2.9 · 2.10 และ 3.5 ตามรายการงานที่ตกลงกันไว้
เอาต์พุต: Master_Data_31AUG26.xlsx (14 ชีต) + CSV ราย sheet ในโฟลเดอร์ master_data_csv_31AUG26/
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
OUT_DIR = _os.path.join(PROJECT_ROOT, "04_master_data")
_os.makedirs(OUT_DIR, exist_ok=True)
_os.chdir(OUT_DIR)
__open = _b.open
def _resolve(f, mode):
    if isinstance(f, str) and not _os.path.isabs(f) and "/" not in f and "\\" not in f and not _os.path.exists(f):
        return _INDEX.get(f, f)
    return f
_b.open = lambda file, mode="r", *a, **k: __open(_resolve(file, mode), mode, *a, **k)
# ---------- จบ bootstrap ----------
import csv, os, json, hashlib, datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment

TODAY = "2026-08-31"
RULES_VERSION = "RULES-IS68076026-v1.0-31AUG26"
OUT_XLSX = "Master_Data_31AUG26.xlsx"
CSV_DIR  = "master_data_csv_31AUG26"
SHEETS = {}

def S(name, header, rows, widths=None, note=""):
    SHEETS[name] = dict(header=header, rows=rows, widths=widths or {}, note=note)

# ============================================================ 2.1 model_registry
S("model_registry",
 ["registry_id","stage","model_name","model_id","provider","temperature","reasoning_config",
  "output_used_for","price_in_usd_per_1m","price_out_usd_per_1m","access_date","verification_status","notes"],
 [
 ["MDL-01","document_ocr","Google Document AI","(processorId ที่จะตั้ง)","Google","—","—",
  "สกัดข้อความเท่านั้น ไม่ใช่โมเดลกำเนิดข้อความ","","",TODAY,"pending",
  "ต้องระบุ region และ processorId ก่อนใช้ · ตรวจตาม GATE-01 ข้อ 9"],
 ["MDL-02","resume_parser","GPT-5.6 Terra","gpt-5.6-terra","OpenAI","0","ไม่ส่งพารามิเตอร์ reasoning",
  "สร้าง structured profile เท่านั้น ไม่ตัดสินช่องว่าง","","",TODAY,"pending",
  "ห้ามใช้ alias gpt-5.6 · ต้องยืนยัน model id และราคาจริงตาม GATE-01 ข้อ 2"],
 ["MDL-03","analyst_a","GLM 5.2","glm-5.2","Zhipu AI (Z.ai)","0",'thinking:{"type":"disabled"}',
  "ข้อเสนอการตัดสินเท่านั้น ไม่ใช่ข้อสรุป","","",TODAY,"pending",
  "🚦 GATE-01 · ต้องได้คำยืนยัน EOL เป็นลายลักษณ์อักษร · ต้องพิสูจน์ reasoning_tokens = 0 จากการยิง API จริง"],
 ["MDL-04","analyst_b","Claude Sonnet 5","claude-sonnet-5","Anthropic","0","extended thinking ปิด (ไม่ส่ง thinking)",
  "ข้อเสนอการตัดสินเท่านั้น ไม่ใช่ข้อสรุป","","",TODAY,"pending",
  "ต้องยืนยัน output_config.format และการปิด extended thinking ตาม GATE-01 ข้อ 4"],
 ["MDL-05","analyst_c","Gemini 3.7 Flash","gemini-3.7-flash","Google","0",'thinkingLevel:"minimal"',
  "ข้อเสนอการตัดสินเท่านั้น ไม่ใช่ข้อสรุป","","",TODAY,"pending",
  "ปิด reasoning สนิทไม่ได้ · ระดับ minimal เป็นค่าต่ำสุด · ห้ามส่ง thinking_budget คู่กัน · ต้องพิสูจน์ด้วย PROTOCOL-01"],
 ["MDL-06","ranker","Claude Sonnet 5","claude-sonnet-5","Anthropic","0","extended thinking ปิด",
  "จัดอันดับเฉพาะ item_id ที่อยู่ใน whitelist","","",TODAY,"pending",
  "ห้ามสร้างชื่อหลักสูตร URL หรือรหัสรายการใหม่"],
 ["MDL-07","report_writer","GPT-5.6 Terra","gpt-5.6-terra","OpenAI","0.2","ไม่ส่งพารามิเตอร์ reasoning",
  "เรียบเรียงถ้อยคำเท่านั้น","","",TODAY,"pending",
  "ห้ามเพิ่มช่องว่างใหม่ เปลี่ยนคะแนน เลือกรายการใหม่ หรือแก้ timeline"],
 ], {"notes":60,"output_used_for":46,"reasoning_config":32},
 "ตรงกับภาคผนวก ข.1 ของเล่ม · LLM calls ต่อการส่งข้อมูลหนึ่งครั้ง = 6 (parse 1 + analyst 3 + rank 1 + report 1) ส่วน OCR ไม่นับเป็น LLM call")

# ============================================================ 2.2 prompt_registry
S("prompt_registry",
 ["prompt_id","stage","used_by","prompt_version","file_path","sha256","frozen_at","word_budget",
  "variables_injected","guardrails","status"],
 [
 ["PR-01","parse_profile","MDL-02","P1-v0.9-draft","prompts/PR-01_parse_profile_v0.9.txt","","","—",
  "resume_text_anonymised | role_id | target_role",
  "ต้องคืน evidence_text ที่เป็นข้อความจริงจากเรซูเมเท่านั้น ห้ามสรุปความ · ห้ามเดาข้อมูลที่ไม่มีในเอกสาร","draft"],
 ["PR-02","gap_analysis","MDL-03 | MDL-04 | MDL-05","P2-v0.9-draft","prompts/PR-02_gap_analysis_v0.9.txt","","","—",
  "requirement_set_30 | resume_profile_json | evidence_corpus",
  "เลือก requirement_id จากชุด 30 ที่ให้ไปเท่านั้น · ต้องอ้าง evidence_id และ quote ที่เป็นข้อความจริง · ห้ามเห็น weight และห้ามเห็น element_aliases","draft"],
 ["PR-03","rank_recommendations","MDL-06","P3-v0.9-draft","prompts/PR-03_rank_v0.9.txt","","","—",
  "verified_gaps | candidate_item_ids | recommendation_mode | learning_capacity_hours",
  "จัดอันดับได้เฉพาะ item_id ที่อยู่ในรายการที่ให้ไป · ห้ามสร้างรายการใหม่ · ห้ามแก้ estimated_hours","draft"],
 ["PR-04","report_writer","MDL-07","P4-v0.9-draft","prompts/PR-04_report_v0.9.txt","","","ตรึงหลัง pilot (CFG-19)",
  "profile_summary | validated_gaps | readiness | selected_item_ids | pathway_phases | transparency_notes",
  "ห้ามเพิ่ม gap ใหม่ · ห้ามเปลี่ยนคะแนน · ห้ามเลือกรายการใหม่ · ห้ามแก้ timeline · อ้างได้เฉพาะรหัสที่อยู่ใน payload","draft"],
 ["PR-05","corpus_builder","(ใช้นอก pipeline)","P5-v0.9-draft","prompts/PR-05_corpus_builder_v0.9.txt","","","—",
  "role_id | requirement_set_30 | role_technology | role_tasks_top5",
  "ประกาศผลเป็นร่างให้มนุษย์ตรวจ · competency_ids เลือกจาก whitelist เท่านั้น · ไม่แน่ใจ URL หรือ exam code ให้เว้นว่าง ห้ามเดา · ต้องระบุ confidence และ researcher_notes","draft"],
 ["PR-06","report_fallback_template","(โค้ดล้วน ไม่เรียกโมเดล)","P6-v0.9-draft","prompts/PR-06_fallback_template.txt","","","—",
  "validated_gaps | selected_item_ids | pathway_phases",
  "ใช้เมื่อ reporter ล้มเหลวหรืออ้างรหัสที่ไม่มีจริง · ตั้ง report_mode = deterministic_fallback","draft"],
 ], {"guardrails":72,"variables_injected":44,"file_path":42},
 "🧊 ต้อง FREEZE ทั้ง 6 ตัวหลัง pilot (Phase 3 ข้อ 3.3) พร้อมคำนวณ SHA-256 และบันทึก frozen_at · ห้ามแก้หลังเริ่มเก็บข้อมูล")

# ============================================================ 2.3 config_master
S("config_master",
 ["config_id","parameter","value","unit","source_of_truth","frozen","freeze_stage","affects","notes"],
 [
 ["CFG-01","THETA","0.15","สัดส่วน","เล่ม §3.5.4","pending","หลัง pilot (3.3)","กฎ R3 Evidence Relevance",
  "จูนด้วย n8n Evaluations บน pilot ก่อนตรึง · หาจุดที่ recall cost ต่ำสุดโดย hallucination ไม่ขึ้น"],
 ["CFG-02","EVIDENCE_VERIFIED_RATIO_MIN","0.60","สัดส่วน","n8n README §3","pending","W3","Evidence Quality Gate",
  "ต่ำกว่านี้แปลว่า parser แต่งข้อความ หยุดก่อนเสียโควตา analyst · ยังไม่มีในเล่ม ต้องเพิ่ม"],
 ["CFG-03","TEXT_DENSITY_MIN","200","ตัวอักษร/หน้า","n8n README §3","pending","W3","Text Density Gate → OCR",
  "ต่ำกว่านี้ถือว่าเป็น PDF สแกน · ยังไม่มีในเล่ม ต้องเพิ่ม"],
 ["CFG-04","R3_OVERLAP_FORMULA",
  "overlap = |tokens(quote) ∩ tokens(element_name + element_description)| ÷ min(|tokens(quote)|, |tokens(desc)|)",
  "สูตร","n8n README §2.3","pending","W3","กฎ R3",
  "ตัวหารใช้ min() เพราะคำอธิบาย O*NET ยาว 20–30 คำ แต่ quote ยาวประโยคเดียว · token ผ่าน light stemmer ก่อนเทียบ"],
 ["CFG-05","R3_PASS_CONDITION","overlap ≥ THETA OR alias_hit","เงื่อนไข","n8n README §2.3","pending","W3","กฎ R3",
  "alias_hit ผ่านได้ทั้งแบบวลีตรงและแบบทุก token ของ alias ปรากฏครบ"],
 ["CFG-06","TIER_HIGH_RULE","3 จาก 3 โมเดลเห็นตรงกัน และหลักฐานผ่าน R2 R3","เงื่อนไข","เล่ม §3.5.4","yes","—","Confidence Tier",""],
 ["CFG-07","TIER_MEDIUM_RULE","2 จาก 3 โมเดลเห็นตรงกัน และหลักฐานผ่าน","เงื่อนไข","เล่ม §3.5.4","yes","—","Confidence Tier",""],
 ["CFG-08","API_FAILURE_TIER_CAP","medium","ระดับ","เล่ม §3.5.4","yes","—","Confidence Tier",
  "ถ้า analyst ล้ม 1 ตัว เดินต่อด้วย 2 ตัวได้ แต่เพดานความเชื่อมั่นคือ medium"],
 ["CFG-09","CAPACITY_FORMULA","timeline_months × 4.33 × hours_per_week","สูตร","เล่ม §3.5.5","yes","—","Pathway planner",""],
 ["CFG-10","WEEKS_PER_MONTH","4.33","สัปดาห์","เล่ม §3.5.5","yes","—","Pathway planner",""],
 ["CFG-11","ANALYST_TEMPERATURE","0","—","DEC-04","yes","—","MDL-03 MDL-04 MDL-05","SA v3 §15 ต้องแก้จาก 0.2 เป็น 0"],
 ["CFG-12","PARSE_TEMPERATURE","0","—","Workflow v2 ข้อ 5","yes","—","MDL-02","parse ต้อง deterministic เพราะผลิต evidence_text ที่กฎ R2 ตรวจ verbatim และมี gate 0.60"],
    ["CFG-12b","REPORT_TEMPERATURE","0.2","—","ภาคผนวก ข.1","yes","—","MDL-07","ขั้นเขียนรายงานมี Reference Check คุมท้ายอยู่แล้ว"],
 ["CFG-13","REPEAT_RUN_K","3","รอบ","Development_Process 4.3","yes","—","Repeat-run stability",""],
 ["CFG-14","REPEAT_RUN_SUBSAMPLE","0.20","สัดส่วน","Development_Process 4.3","yes","—","Repeat-run stability","6 รายจาก 30"],
 ["CFG-15","REASONING_TOKEN_MAX_RATIO","0.05","สัดส่วนของ output token","PROTOCOL-01","yes","—","GATE-P",
  "ระวังตัวเชื่อมที่แปลง disabled เป็น low เงียบ ๆ ต้องดูตัวเลขไม่ใช่ดูว่า API ไม่ error"],
 ["CFG-16","RECALL_COST_THRESHOLD","0.10","สัดส่วน","เล่ม §3.8","yes","—","เกณฑ์ตีความ a priori",
  "เกณฑ์คู่: hallucination ต่ำกว่าทุก baseline และ recall cost ≤ 10%"],
 ["CFG-17","EVIDENCE_RATIO_GATE_P","0.90","สัดส่วน","GATE-P","yes","—","เกณฑ์ผ่าน pilot",""],
 ["CFG-18","RATER_SAMPLE","0.20","สัดส่วน","เล่ม §3.7","yes","—","intra-rater และ inter-rater","180 ข้อจาก 900"],
 ["CFG-19","COHEN_KAPPA_MIN","0.70","ค่า kappa","เล่ม §3.7","yes","—","ความน่าเชื่อถือของ ground truth",
  "ต่ำกว่าเกณฑ์ต้องปรับ codebook แล้วทำซ้ำ"],
 ["CFG-20","REPORT_WORD_BUDGET","(ตรึงหลัง pilot)","คำต่อหัวข้อ","Development_Process 3.3","pending","หลัง pilot","PR-04",
  "สำคัญต่อ RQ3 เพราะความยาวรายงานกระทบคะแนนการรับรู้"],
 ["CFG-21","ACCEPTED_FILE_TYPES","pdf","ชนิดไฟล์","n8n README §4","yes","—","Form + Intake",
  "ไม่รับ DOCX เพราะสกัดข้อความไม่น่าเชื่อถือและ Document AI ไม่รองรับ · ต้องระบุใน §1.5 §3.5.2 และเอกสารชี้แจง"],
 ["CFG-22","BOOTSTRAP_ITERATIONS","10000","รอบ","SA v3 §12.4","yes","—","analysis_v5.py","seed ต้องตรึงและบันทึก"],
 ["CFG-23","RULES_VERSION",RULES_VERSION,"รหัส","เอกสารนี้","pending","พร้อม THETA","gap_result.rules_version",
  "คอลัมน์ rules_version ใน gap_result ต้องชี้มาที่แถวชุดนี้"],
 ], {"value":58,"notes":62,"parameter":30,"source_of_truth":24},
 "ค่าทั้งหมดนี้เดิมกระจายอยู่ใน Code node ของ n8n ซึ่งแก้เมื่อไรก็ได้โดยไม่มีร่องรอย · ต้องอ่านจากตารางนี้แทน")

# ============================================================ 2.4 pii_masking_rules
S("pii_masking_rules",
 ["rule_id","target","pattern_type","pattern","replacement_token","applies_to","affects_R2","notes"],
 [
 ["PII-01","ชื่อ-นามสกุลผู้สมัคร","field",
  "ค่าที่ผู้เข้าร่วมกรอกในฟอร์ม + บรรทัดหัวเรซูเม","[NAME]","ข้อความก่อนส่งเข้าทุก LLM call","Y",
  "ใช้ค่าจากฟอร์มเป็นหลัก เพราะ regex จับชื่อไทยได้ไม่แม่น"],
 ["PII-02","อีเมล","regex",r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}","[EMAIL]","เหมือนกัน","Y",""],
 ["PII-03","เบอร์โทรศัพท์ไทย","regex",r"(\+66|0)\s?\d{1,2}[-\s]?\d{3}[-\s]?\d{3,4}","[PHONE]","เหมือนกัน","Y",""],
 ["PII-04","เลขประจำตัวประชาชน","regex",r"\b\d{1}[-\s]?\d{4}[-\s]?\d{5}[-\s]?\d{2}[-\s]?\d{1}\b","[NATIONAL_ID]","เหมือนกัน","Y",
  "13 หลัก · ต้องมาก่อนกฎเบอร์โทรในลำดับการแทนที่"],
 ["PII-05","ที่อยู่","regex",
  r"(บ้านเลขที่|หมู่|ซอย|ถนน|ตำบล|แขวง|อำเภอ|เขต|จังหวัด)[^\n]{0,60}","[ADDRESS]","เหมือนกัน","Y",""],
 ["PII-06","รหัสไปรษณีย์","regex",r"\b\d{5}\b(?=\s*(ไทย|Thailand)?)","[POSTCODE]","เหมือนกัน","Y",
  "ระวังชนกับตัวเลขปี พ.ศ. ต้องทดสอบกับเรซูเมจริงก่อนตรึง"],
 ["PII-07","URL โปรไฟล์ส่วนบุคคล","regex",
  r"https?://(www\.)?(linkedin\.com/in|github\.com|facebook\.com)/[^\s]+","[PROFILE_URL]","เหมือนกัน","Y",
  "เก็บชื่อแพลตฟอร์มไว้ในโทเคนเพื่อไม่ให้เสียหลักฐานว่ามีผลงานสาธารณะ"],
 ["PII-08","วันเดือนปีเกิด","regex",r"(วันเกิด|Date of Birth|DOB)\s*[:：]?\s*[^\n]{0,30}","[DOB]","เหมือนกัน","Y",""],
 ["PII-09","รูปถ่ายบุคคล","binary","ภาพในไฟล์ PDF","(ตัดออกตอนสกัดข้อความ)","ขั้น OCR","N",
  "Document AI คืนเฉพาะข้อความ ภาพไม่ถูกส่งต่อ"],
 ["PII-10","ชื่อสถานศึกษาและชื่อบริษัท","—","ไม่ปิดบัง","—","—","—",
  "ตั้งใจไม่ปิดบัง เพราะเป็นหลักฐานที่กฎ R2 R3 ต้องใช้ · ต้องระบุข้อนี้ในเอกสารชี้แจงผู้เข้าร่วม"],
 ], {"pattern":58,"notes":54,"target":26},
 "⚠ กฎ R2 ตรวจ evidence quote แบบ substring กับข้อความ 'ที่ปิดบังแล้ว' การเปลี่ยนกฎชุดนี้จึงเปลี่ยนผลการทดลอง ต้องตรึงพร้อม rules_version")

# ============================================================ 2.5 proxy_mapping_log
S("proxy_mapping_log",
 ["role_id","target_role","soc_code","onet_title","closeness","supporting_evidence","risk_to_report","transparency_text_th"],
 [
 ["R03","Application / Mobile Developer","15-1251.00","Computer Programmers","ปานกลาง",
  "Programming IM = 4.75 สูงสุดในกลุ่ม · reported titles มี Java Developer, Application Programmer",
  "ไม่ครอบคลุมทักษะเฉพาะ mobile (Android/iOS SDK, store deployment)",
  "บทบาทนี้ใช้รหัสอาชีพ Computer Programmers เป็นตัวแทน เนื่องจาก O*NET ยังไม่มีรหัสเฉพาะสำหรับนักพัฒนาแอปพลิเคชันมือถือ ผลการประเมินจึงไม่ครอบคลุมทักษะเฉพาะของแพลตฟอร์มมือถือ"],
 ["R07","Machine Learning / AI Engineer","15-1221.00","Computer and Information Research Scientists","ปานกลาง",
  "In-Demand มี AWS SageMaker, Spark, Kafka · Knowledge: Mathematics IM = 4.06",
  "Job Zone 5 (ปริญญาเอก) สูงกว่าตำแหน่งในอุตสาหกรรมจริง อาจทำให้ Readiness ต่ำเกินจริง",
  "บทบาทนี้ใช้รหัสอาชีพ Computer and Information Research Scientists เป็นตัวแทน ซึ่งกำหนดระดับการศึกษาไว้สูงกว่าตำแหน่งในอุตสาหกรรมจริง ค่าความพร้อมที่ได้จึงมีแนวโน้มต่ำกว่าความเป็นจริง"],
 ["R08","Data Engineer","15-1243.00","Database Architects","สูง",
  "ตาราง Sample of Reported Titles ระบุ Data Engineer ไว้ภายใต้รหัสนี้โดยตรง",
  "น้ำหนักเอียงไปทางการออกแบบฐานข้อมูลมากกว่างาน pipeline และ streaming",
  "บทบาทนี้ใช้รหัสอาชีพ Database Architects เป็นตัวแทน น้ำหนักสมรรถนะจึงเอียงไปทางการออกแบบฐานข้อมูลมากกว่างานสร้างสายท่อข้อมูล"],
 ["R16","Cloud Engineer / Solutions Architect","15-1299.08","Computer Systems Engineers/Architects","สูง",
  "reported titles มี Solutions Architect, IT Architect · In-Demand มี AWS CloudFormation, Terraform",
  "Job Zone 3 อาจต่ำกว่าความคาดหวังของตำแหน่งสถาปนิกคลาวด์จริง",
  "บทบาทนี้ใช้รหัสอาชีพ Computer Systems Engineers/Architects เป็นตัวแทน ซึ่งกำหนดระดับประสบการณ์ไว้ต่ำกว่าตำแหน่งสถาปนิกคลาวด์ในอุตสาหกรรมจริง"],
 ["R17","DevOps / Site Reliability Engineer","15-1244.00","Network and Computer Systems Administrators","ปานกลาง",
  "Troubleshooting / Systems Analysis / Systems Evaluation IM = 4.00 · In-Demand มี Ansible, Bash",
  "DevOps Engineer ปรากฏเป็น reported title ของ 15-1252.00 ด้วย การจับคู่จึงมีความคลุมเครือ",
  "บทบาทนี้ใช้รหัสอาชีพ Network and Computer Systems Administrators เป็นตัวแทน ซึ่งเน้นงานดูแลระบบมากกว่างานวิศวกรรมความน่าเชื่อถือ ผลการประเมินจึงไม่ครอบคลุมงานด้าน SRE ทั้งหมด"],
 ], {"supporting_evidence":50,"risk_to_report":50,"transparency_text_th":80},
 "Workflow D และ G ต้องดึง transparency_text_th มาแสดงในรายงานเมื่อผู้เข้าร่วมเลือกบทบาทเหล่านี้ · ต้นทางคือชีต 09_Proxy_Mapping_Log ของ Data_Set.xlsx")

# ============================================================ 2.6 mode_rules + timeline_master
S("mode_rules",
 ["mode_id","mode","include_item_type","exclude_item_type","exception","ordering_rule","metric_checked","notes"],
 [
 ["MODE-01","course_only","course","certification",
  "รายการที่ is_prerequisite = Y ยังใส่ได้แม้เป็น certification",
  "เรียงตาม weight ของช่องว่างที่ปิดได้ มากไปน้อย แล้วเวลาเรียนน้อยไปมาก",
  "Recommendation-mode compliance","ความครอบคลุมของโหมดนี้ = 556/600 requirement"],
 ["MODE-02","certification_only","certification","course",
  "หลักสูตรที่บันทึกเป็น prerequisite ของใบรับรองนั้นยังใส่ได้",
  "เรียงตาม weight มากไปน้อย แล้วเวลาเตรียมสอบน้อยไปมาก",
  "Recommendation-mode compliance","ความครอบคลุมของโหมดนี้ = 518/600 requirement"],
 ["MODE-03","both","course | certification","—","—",
  "ปิด core gap ก่อน (phase = core_gap_closure) แล้วจึงเป็นการเตรียมใบรับรอง (advanced_or_cert_prep)",
  "Recommendation-mode compliance","ความครอบคลุมของโหมดนี้ = 600/600 requirement"],
 ], {"exception":52,"ordering_rule":58,"notes":40},
 "ตัวกรองต้องรับเฉพาะแถวที่ verification_status = verified และ coverage_layer = L1_researcher_tagged (DEC-11)")

S("timeline_master",
 ["timeline_id","timeline_months","weeks","capacity_5h","capacity_10h","capacity_15h","phase_plan","notes"],
 [
 ["TL-06","6","25.98","129.9","259.8","389.7","foundation → core_gap_closure",
  "กรอบเวลาแคบสุด · ทุกบทบาทต้องจัดแผนได้อย่างน้อย 3 รายการ (QA-16)"],
 ["TL-12","12","51.96","259.8","519.6","779.4","foundation → core_gap_closure → advanced_or_cert_prep",""],
 ["TL-18","18","77.94","389.7","779.4","1169.1","สามระยะ เว้นช่วงเตรียมสอบ",""],
 ["TL-24","24","103.92","519.6","1039.2","1558.8","สามระยะ เผื่อใบรับรองระดับ Professional",""],
 ], {"phase_plan":52,"notes":56},
 "capacity = timeline_months × 4.33 × hours_per_week (CFG-09) · รายการที่เกิน capacity ย้ายไป deferred recommendations พร้อมเหตุผล ห้ามบีบแผนให้เกินข้อจำกัดของผู้เรียน")

# ============================================================ 2.9 conditions_master + metric_registry
S("conditions_master",
 ["condition_id","name","description_th","data_source","extra_api_calls","rq","notes"],
 [
 ["C1","glm_only","ผลดิบของ GLM 5.2 ไม่ผ่าน validation","gap_result.per_model_json (A)","ไม่","RQ2","baseline"],
 ["C2","sonnet_only","ผลดิบของ Claude Sonnet 5 ไม่ผ่าน validation","gap_result.per_model_json (B)","ไม่","RQ2","baseline"],
 ["C3","gemini_only","ผลดิบของ Gemini 3.7 Flash ไม่ผ่าน validation","gap_result.per_model_json (C)","ไม่","RQ2","baseline"],
 ["C4","framework","ผ่านกฎ R0 → R4 ครบ","gap_result.final_status","ไม่","RQ2","เงื่อนไขหลักของงานวิจัย"],
 ["C5","tradeoff","วัด recall cost และ false exclusion ของ C4 เทียบ ground truth",
  "gap_result.exclusion_reason + ground_truth","ไม่","RQ2","ต้องรายงานคู่กับ hallucination rate เสมอ"],
 ["C6","extraction","วัด precision recall F1 ของขั้นสกัดทักษะ","resume_profile + ground_truth (extraction set)","ไม่","RQ1",""],
 ["C7","ablation_A1","ใช้เพียงกฎความเห็นพ้อง (R1)","gap_result.ablation_A1","ไม่","RQ2","คำนวณจาก log เดิม"],
 ["C8","ablation_A2","R1 + การตรวจข้อความหลักฐาน (R2)","gap_result.ablation_A2","ไม่","RQ2","คำนวณจาก log เดิม"],
 ["C9","ablation_A3","R1 + R2 + ความสอดคล้องเชิงความหมาย (R3)","gap_result.ablation_A3","ไม่","RQ2",
  "ห้ามตัดออกจากแผนแม้เวลาไม่พอ เพราะตอบ RQ2 โดยตรงและไม่มีต้นทุน API"],
 ["C10","robustness","สุ่ม 10 เรซูเมด้วย seed ที่บันทึก แล้วรันสามโมเดลโดยเปิด reasoning ต่ำสุด",
  "รันใหม่ 30 API calls","ใช่ (30 calls)","อภิปราย",
  "อยู่ในบทที่ 5 ไม่ใช่ผลการวิจัย · n=10 ไม่มี power · เป็นรายการแรกที่ตัดได้ถ้าเวลาไม่พอ"],
 ], {"description_th":56,"data_source":40,"notes":50},
 "ทุกเงื่อนไขต้องได้อินพุตเดียวกัน · SUB_GapEngine เรียก analyst ชุดเดียวต่อการส่งข้อมูลหนึ่งครั้ง แล้วสร้างทุกเงื่อนไขจาก raw response ชุดนั้น")

S("metric_registry",
 ["metric_id","metric_name","definition_th","numerator","denominator","rq","computed_by","reported_in","notes"],
 [
 ["MT-01","Extraction precision","จำนวนทักษะที่สกัดถูกต้อง หารด้วยจำนวนทักษะทั้งหมดที่ระบบสกัด",
  "ทักษะที่สกัดถูกต้อง","ทักษะทั้งหมดที่ระบบสกัด","RQ1","analysis_v5.py","§4.2",""],
 ["MT-02","Extraction recall","จำนวนทักษะที่สกัดถูกต้อง หารด้วยจำนวนทักษะทั้งหมดใน ground truth",
  "ทักษะที่สกัดถูกต้อง","ทักษะทั้งหมดใน ground truth","RQ1","analysis_v5.py","§4.2",""],
 ["MT-03","Extraction F1","ค่า harmonic mean ของ precision และ recall","—","—","RQ1","analysis_v5.py","§4.2",""],
 ["MT-04","Gap accuracy","จำนวนสถานะช่องว่างที่ตรงกับ ground truth หารด้วยข้อกำหนดทั้งหมดที่ประเมิน",
  "สถานะที่ตรงกัน","30 รายการ × จำนวนผู้เข้าร่วม","RQ1","Workflow H + analysis_v5.py","§4.2",""],
 ["MT-05","Hallucination rate","ข้ออ้างช่องว่างที่ไม่มีหลักฐาน หารด้วยข้ออ้างช่องว่างทั้งหมดในเงื่อนไขนั้น",
  "ข้ออ้างที่ไม่มีหลักฐาน","ข้ออ้างช่องว่างทั้งหมดในเงื่อนไขนั้น","RQ2","Workflow H + analysis_v5.py","§4.3",
  "เกณฑ์ a priori: ของกรอบต้องต่ำกว่าทุก baseline"],
 ["MT-06","Out-of-scope claim rate","ข้ออ้างที่กล่าวถึงสมรรถนะนอกชุด 30 ที่ตรึงไว้ หารด้วยข้ออ้างทั้งหมดในเงื่อนไขนั้น",
  "ข้ออ้างนอกชุด 30","ข้ออ้างทั้งหมดในเงื่อนไขนั้น","RQ2","condition_result","§4.3",
  "ของกรอบต้องเป็น 0 โดยโครงสร้าง · ถ้าไม่เป็น 0 คือบั๊กของกฎ R0 ไม่ใช่ผลการทดลอง"],
 ["MT-07","Validation recall cost","ช่องว่างจริงที่ validation ตัดออก หารด้วยช่องว่างจริงทั้งหมดใน ground truth",
  "ช่องว่างจริงที่ถูกตัด","ช่องว่างจริงทั้งหมด","RQ2","analysis_v5.py","§4.3",
  "เกณฑ์ a priori ≤ 10% (CFG-16) · ต้องรายงานคู่กับ MT-05 เสมอ"],
 ["MT-08","False-exclusion rate","ข้ออ้างที่ถูกตัดออกแต่เป็นข้ออ้างจริง หารด้วยข้ออ้างที่ถูกตัดทั้งหมด",
  "ข้ออ้างที่ถูกตัดแต่จริง","ข้ออ้างที่ถูกตัดทั้งหมด","RQ2","analysis_v5.py","§4.3","ใช้ exclusion_reason ในการแยกกลุ่ม"],
 ["MT-09","Whitelist compliance","รายการแนะนำที่อยู่ใน frozen corpus หารด้วยรายการแนะนำทั้งหมด",
  "รายการที่อยู่ใน corpus","รายการแนะนำทั้งหมด","RQ3","pipeline_run","§4.4","1 ใน 5 ตัวของ recommendation validity"],
 ["MT-10","Recommendation-mode compliance","รายการแนะนำที่ตรงกับ mode ที่ผู้ใช้เลือก หารด้วยรายการแนะนำทั้งหมด",
  "รายการที่ตรง mode","รายการแนะนำทั้งหมด","RQ3","pipeline_run","§4.4","เทียบกับ mode_rules"],
 ["MT-11","Gap coverage","ช่องว่างที่ผ่าน validation และมีรายการเรียนอย่างน้อยหนึ่งรายการ หารด้วยช่องว่างที่มี candidate ใน corpus",
  "ช่องว่างที่มีรายการรองรับ","ช่องว่างที่มี candidate","RQ3","pipeline_run","§4.4",
  "🔴 ต้องรายงานสองค่าตาม DEC-11: นับเฉพาะ mapping ชั้น L1 (อนุรักษ์นิยม) และนับ L1+L2 (ขอบบน)"],
 ["MT-12","Timeline feasibility","เวลารวมของรายการที่เลือกต้องไม่เกิน learning capacity ของผู้ใช้",
  "แผนที่ไม่เกิน capacity","แผนทั้งหมด","RQ3","pipeline_run","§4.4","capacity ตาม CFG-09"],
 ["MT-13","Report-reference validity","รหัส คะแนน และรายการ timeline ในรายงานต้องตรงกับ verified JSON payload",
  "รายงานที่รหัสตรงทั้งหมด","รายงานทั้งหมด","RQ3","pipeline_run.report_reference_validity","§4.4",""],
 ["MT-14","Evidence verified ratio","ข้อความหลักฐานที่ตรวจพบจริงในเรซูเมฉบับนิรนาม หารด้วยข้อความหลักฐานทั้งหมดที่ขั้น parsing สร้าง",
  "หลักฐานที่ตรวจพบจริง","หลักฐานทั้งหมดที่ parser สร้าง","RQ1 · GATE-P","pipeline_run","§4.5",
  "เกณฑ์ผ่าน pilot ≥ 0.90 (CFG-17) · เกณฑ์หยุด pipeline < 0.60 (CFG-02)"],
 ], {"definition_th":66,"numerator":30,"denominator":32,"notes":52},
 "ตรงกับภาคผนวก ง.1 ของเล่มทุกตัว · Workflow H และ analysis_v5.py ต้องคำนวณจากนิยามเดียวกันนี้ ถ้าได้เลขต่างกันแปลว่าฝั่งใดฝั่งหนึ่งผิด")

# ============================================================ 2.10 enum tables
S("enum_exclusion_reason",
 ["code","rule","description_th","counts_toward_recall_cost","counts_toward_out_of_scope","notes"],
 [
 ["EX-R0-OUT-OF-SCOPE","R0","requirement_id ไม่ขึ้นต้นด้วย REQ-<role_id>- หรือไม่อยู่ในชุด 30 ที่ตรึงไว้","ไม่","ใช่",
  "ตัดออกก่อนนับเสียง · เป็นตัวตั้งของ MT-06"],
 ["EX-R1-NO-MAJORITY","R1","มีโมเดลสนับสนุนเพียงตัวเดียว","ใช่","ไม่",""],
 ["EX-R1-TIED","R1","เสียงเท่ากันจนไม่มีข้างมาก","ใช่","ไม่",
  "ต้องแยกออกจาก EX-R1-NO-MAJORITY เพราะเป็นคนละสาเหตุ"],
 ["EX-R2-QUOTE-NOT-FOUND","R2","evidence quote ไม่พบเป็น substring ในข้อความนิรนาม","ใช่","ไม่",
  "ตรวจกับข้อความหลังปิดบัง PII ตาม pii_masking_rules"],
 ["EX-R3-RELEVANCE-BELOW-THETA","R3","overlap ต่ำกว่า THETA และไม่มี alias hit","ใช่","ไม่",
  "เป็นตัวตั้งหลักของ MT-07 · ใช้จูน THETA"],
 ["EX-API-MODEL-FAILURE","—","โมเดลตัวใดตัวหนึ่งเรียกไม่สำเร็จ","ไม่","ไม่",
  "ไม่นับเป็น recall cost เพราะไม่ใช่การตัดสินของชั้น validation · เพดาน tier = medium"],
 ["EX-PARSE-LOW-EVIDENCE-RATIO","—","evidence_verified_ratio ต่ำกว่า 0.60 จนหยุดก่อนเรียก analyst","ไม่","ไม่",
  "บันทึกเป็น audit_log ด้วย"],
 ], {"description_th":58,"notes":48},
 "🔴 คอลัมน์ exclusion_reason ใน gap_result ต้องรับเฉพาะค่าในตารางนี้ · ถ้าปล่อยเป็นข้อความอิสระจะจัดกลุ่มย้อนหลังเพื่อคำนวณ recall cost ไม่ได้")

S("enum_error_type",
 ["code","stage","description_th","halts_pipeline","notify_researcher","notes"],
 [
 ["ERR-CONSENT-DECLINED","intake","ผู้เข้าร่วมไม่ยินยอม","ใช่","ไม่","บันทึก consent_log แล้วหยุด"],
 ["ERR-INVALID-FILE-TYPE","intake","ไฟล์ที่อัปโหลดไม่ใช่ PDF","ใช่","ไม่","ตาม CFG-21"],
 ["ERR-DUPLICATE-SUBMISSION","intake","พบ submission ซ้ำ","ใช่","ใช่","บันทึก duplicate_log"],
 ["ERR-PDF-UNREADABLE","parse","เปิดไฟล์ PDF ไม่ได้","ใช่","ใช่",""],
 ["ERR-OCR-EMPTY","parse","OCR คืนข้อความว่าง","ใช่","ใช่",""],
 ["ERR-PARSER-FAILED","parse","parser คืน JSON ที่ไม่ผ่าน schema","ใช่","ใช่",""],
 ["ERR-EVIDENCE-RATIO-LOW","parse","evidence_verified_ratio < 0.60","ใช่","ใช่","หยุดก่อนเสียโควตา analyst"],
 ["ERR-ANALYST-TIMEOUT","gap","analyst ตัวใดตัวหนึ่งหมดเวลา","ไม่","ใช่","เดินต่อด้วย 2 ตัว เพดาน tier = medium"],
 ["ERR-GAPENGINE-FAILED","gap","SUB_GapEngine ล้มทั้งตัว","ใช่","ใช่",""],
 ["ERR-RANKER-FAILED","recommend","ranker ล้มหรือคืน item_id ที่ไม่มีใน corpus","ไม่","ใช่",
  "ใช้ลำดับ deterministic แทน (weight มากก่อน แล้วเวลาน้อยก่อน)"],
 ["ERR-NO-CANDIDATE-FOUND","recommend","ไม่มี candidate ที่ผ่านเกณฑ์ใน corpus","ไม่","ใช่",
  "บันทึก no_candidate_found = true · ห้ามสร้างรายการทดแทนเอง"],
 ["ERR-REPORTER-FAILED","report","reporter ล้มหรืออ้างรหัสที่ไม่มีจริง","ไม่","ใช่",
  "ใช้ template · ตั้ง report_mode = deterministic_fallback"],
 ["ERR-SHEETS-WRITE-FAILED","log","เขียน Google Sheets ไม่สำเร็จ","ใช่","ใช่","ต้องรู้ภายในวันเดียวกัน"],
 ], {"description_th":52,"notes":56},
 "audit_log.error_type ต้องรับเฉพาะค่าในตารางนี้ · Workflow I ผูกเป็น Error Workflow ของทุก workflow รวม SUB_GapEngine")

# ============================================================ 3.5 provider_policy_register
S("provider_policy_register",
 ["provider_id","provider","service_used","policy_url","accessed_at","trains_on_customer_data",
  "retention_stated","data_location","key_quote","evidence_for_consent_form"],
 [
 ["PROV-01","OpenAI","GPT-5.6 Terra (parse และ report writer)","https://openai.com/enterprise-privacy/",TODAY,
  "ไม่ใช้โดยค่าเริ่มต้น","เก็บ input และ output ได้ไม่เกิน 30 วัน","สหรัฐอเมริกา (ตามที่ผู้ให้บริการกำหนด)",
  '"By default, we do not use your business data for training our models." · "OpenAI may securely retain API inputs and outputs for up to 30 days to provide the services and to identify abuse."',
  "ระบุในหนังสือยินยอมว่าข้อความจากเรซูเมที่ปิดบังข้อมูลส่วนบุคคลแล้วจะถูกส่งไปยัง OpenAI และผู้ให้บริการเก็บไว้ไม่เกิน 30 วันเพื่อป้องกันการใช้งานผิดวัตถุประสงค์"],
 ["PROV-02","Anthropic","Claude Sonnet 5 (analyst B และ ranker)",
  "https://platform.claude.com/docs/en/manage-claude/api-and-data-retention",TODAY,
  "ไม่ใช้โดยไม่ได้รับอนุญาตชัดแจ้ง","ตามนโยบายรายฟีเจอร์ · มีตัวเลือก zero data retention",
  "สหรัฐอเมริกา (ตามที่ผู้ให้บริการกำหนด)",
  '"Retained data is never used for model training without your express permission."',
  "ระบุว่าข้อมูลไม่ถูกนำไปฝึกโมเดลโดยไม่ได้รับอนุญาต และผู้วิจัยจะไม่ให้ความยินยอมดังกล่าว"],
 ["PROV-03","Google","Gemini 3.7 Flash (analyst C)","https://ai.google.dev/gemini-api/terms",TODAY,
  "บริการแบบมีค่าใช้จ่ายไม่นำไปปรับปรุงผลิตภัณฑ์ · บริการฟรีนำไปใช้ได้",
  "เก็บเพื่อตรวจการละเมิดนโยบายเป็นระยะเวลาจำกัด","ตามที่ผู้ให้บริการกำหนด",
  '"Google doesn\'t use your prompts...or responses to improve our products." (Paid Services) · "Do not submit sensitive, confidential, or personal information to the Unpaid Services."',
  "🔴 ต้องใช้บริการแบบมีค่าใช้จ่ายเท่านั้น · ถ้าใช้ระดับฟรี ข้อมูลของผู้เข้าร่วมจะถูกนำไปพัฒนาผลิตภัณฑ์ ซึ่งขัดกับข้อความในหนังสือยินยอม"],
 ["PROV-04","Zhipu AI (Z.ai)","GLM 5.2 (analyst A)","https://docs.z.ai/legal-agreement/privacy-policy",TODAY,
  "ไม่ใช้ · ระบุว่าไม่จัดเก็บเนื้อหาที่ประมวลผลแบบเรียลไทม์","ประมวลผลเรียลไทม์ ไม่บันทึกลงเซิร์ฟเวอร์",
  "สิงคโปร์",
  '"The Company do not store any of the content the Customer or its End Users provide or generate while using our Services... This information is processed in real-time... and is not saved on our servers." · "generally processed in Singapore"',
  "ระบุประเทศที่ประมวลผลข้อมูล (สิงคโปร์) ในหนังสือยินยอมตามข้อกำหนด PDPA เรื่องการส่งข้อมูลออกนอกราชอาณาจักร"],
 ["PROV-05","Google Cloud","Document AI (OCR)","https://cloud.google.com/terms/data-processing-addendum",TODAY,
  "ต้องยืนยัน","ต้องยืนยัน","ต้องระบุ region ตอนตั้ง processor",
  "(ยังไม่ได้ตรวจ — หน้า data-governance เดิมของ Document AI ตอบ 404)",
  "🔴 ต้องตรวจและกรอกให้ครบก่อนยื่นจริยธรรม · region ของ processor เป็นข้อมูลที่คณะกรรมการจะถาม"],
 ], {"key_quote":80,"evidence_for_consent_form":72,"policy_url":56,"retention_stated":38},
 "ทุก URL เข้าถึงและอ่านเนื้อหาจริงเมื่อ 31 ส.ค. 2026 ยกเว้น PROV-05 · ต้องตรวจซ้ำและอัปเดต accessed_at ก่อนยื่นเอกสารจริยธรรม เพราะนโยบายเปลี่ยนได้")

# ============================================================ README + codebook
S("README", ["หัวข้อ","รายละเอียด"], [
 ["ไฟล์","Master_Data_31AUG26.xlsx"],
 ["โครงการ","IS 68076026 · ดนุสรณ์ อนันตกาล · ITM KMITL"],
 ["วันที่สร้าง",TODAY],
 ["rules_version",RULES_VERSION],
 ["ขอบเขต","ชุด Master Data ที่ระบบ runtime และงานวิจัยต้องอ้างถึง แต่เดิมกระจายอยู่ใน Code node ของ n8n หรือยังไม่มีเลย"],
 ["",""],
 ["ชีตในไฟล์นี้",""],
 ["model_registry","ทะเบียนโมเดล 7 แถว ตรงกับภาคผนวก ข.1 · ผูกกับ model_call_log.model_id"],
 ["prompt_registry","ทะเบียน prompt 6 ตัว พร้อมช่อง sha256 และ frozen_at · ต้องตรึงหลัง pilot"],
 ["config_master","ค่าคงที่ 23 ค่าที่กระทบผลการทดลอง · gap_result.rules_version ต้องชี้มาที่ชุดนี้"],
 ["pii_masking_rules","กฎปิดบังข้อมูลส่วนบุคคล 10 ข้อ · กระทบกฎ R2 โดยตรงจึงต้องตรึงพร้อม rules_version"],
 ["proxy_mapping_log","5 บทบาทที่ใช้รหัสอาชีพตัวแทน พร้อมข้อความโปร่งใสภาษาไทยสำหรับแสดงในรายงาน"],
 ["mode_rules","กติกาการกรองตาม recommendation mode 3 แบบ"],
 ["timeline_master","กรอบเวลา 4 แบบ พร้อมความจุการเรียนที่คำนวณไว้แล้ว"],
 ["conditions_master","เงื่อนไขการทดลอง C1–C10 พร้อมระบุว่าอ่านจากคอลัมน์ใด"],
 ["metric_registry","ตัวชี้วัด 14 ตัว ตรงกับภาคผนวก ง.1 พร้อมตัวตั้งตัวหารและผู้คำนวณ"],
 ["enum_exclusion_reason","ชุดค่าปิดของ gap_result.exclusion_reason · จำเป็นต่อการคำนวณ recall cost"],
 ["enum_error_type","ชุดค่าปิดของ audit_log.error_type"],
 ["provider_policy_register","นโยบายข้อมูลของผู้ให้บริการ 5 ราย พร้อมข้อความอ้างอิงจริงสำหรับเอกสารจริยธรรม"],
 ["",""],
 ["ข้อควรระวัง",""],
 ["1","ค่าที่ยังไม่ตรึง (frozen = pending) ห้ามใช้อ้างในเล่มจนกว่าจะผ่าน pilot"],
 ["2","pii_masking_rules เปลี่ยนเมื่อไร ผลของกฎ R2 เปลี่ยนตาม ต้องเพิ่มเลข rules_version ทุกครั้ง"],
 ["3","provider_policy_register ต้องตรวจซ้ำก่อนยื่นจริยธรรมและก่อนเริ่มเก็บข้อมูล เพราะนโยบายผู้ให้บริการเปลี่ยนได้"],
 ["4","Gemini ต้องใช้บริการแบบมีค่าใช้จ่ายเท่านั้น ระดับฟรีนำข้อมูลไปพัฒนาผลิตภัณฑ์"],
], {"หัวข้อ":26,"รายละเอียด":110})

# ============================================================ เขียนไฟล์
os.makedirs(CSV_DIR, exist_ok=True)
HF = PatternFill("solid", fgColor="1F3864"); FT = Font(color="FFFFFF", bold=True)
NF = PatternFill("solid", fgColor="FFF2CC")
wb = openpyxl.Workbook(); wb.remove(wb.active)
order = ["README","model_registry","prompt_registry","config_master","pii_masking_rules","proxy_mapping_log",
         "mode_rules","timeline_master","conditions_master","metric_registry",
         "enum_exclusion_reason","enum_error_type","provider_policy_register"]
for name in order:
    d = SHEETS[name]; ws = wb.create_sheet(name)
    r0 = 1
    if d["note"]:
        ws.cell(1, 1, "หมายเหตุ: " + d["note"]).fill = NF
        ws.cell(1, 1).font = Font(bold=True); ws.cell(1, 1).alignment = Alignment(wrap_text=False)
        r0 = 3
    ws.cell(r0, 1)
    for j, h in enumerate(d["header"], 1):
        c = ws.cell(r0, j, h); c.fill = HF; c.font = FT
    for i, row in enumerate(d["rows"], r0 + 1):
        for j, v in enumerate(row, 1): ws.cell(i, j, v)
    ws.freeze_panes = ws.cell(r0 + 1, 1)
    for j, h in enumerate(d["header"], 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(j)].width = d["widths"].get(h, min(max(12, len(str(h)) + 4), 40))
    if name != "README":
        with open(os.path.join(CSV_DIR, f"{name}_31AUG26.csv"), "w", encoding="utf-8-sig", newline="") as f:
            w = csv.writer(f); w.writerow(d["header"]); w.writerows(d["rows"])
wb.save(OUT_XLSX)

def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()
json.dump({"rules_version": RULES_VERSION, "built_at": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
           "sheets": {k: len(SHEETS[k]["rows"]) for k in order},
           "frozen_at": None, "sha256": {OUT_XLSX: sha(OUT_XLSX)},
           "note": "frozen_at ยังเป็น null — ตรึงได้หลัง pilot เมื่อ THETA และ word budget นิ่งแล้ว"},
          open("rules_version_log_31AUG26.json", "w", encoding="utf-8"), indent=2, ensure_ascii=False)

print(f"เขียน {OUT_XLSX} · {len(order)} ชีต")
for k in order:
    if k != "README": print(f"   {k:<28}{len(SHEETS[k]['rows']):>3} แถว")
print(f"CSV แยกไฟล์อยู่ใน {CSV_DIR}/ ({len(order)-1} ไฟล์)")
