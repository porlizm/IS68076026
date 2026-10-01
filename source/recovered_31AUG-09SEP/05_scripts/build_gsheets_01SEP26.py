# -*- coding: utf-8 -*-
"""
build_gsheets_01SEP26.py
รวมชุดข้อมูลทั้งหมดของงานวิจัยเป็นสมุดเดียวพร้อมนำเข้า Google Sheets

หลักการ
  1. เนื้อหาที่ตรึงแล้วห้ามเปลี่ยน — onet_requirements / element_aliases / excluded
     คงเดิมทุกไบต์ snapshot_version ยังเป็น ONET31.0-IS68076026-v1.0
  2. corpus_master เพิ่มคอลัมน์เดียวคือ competency_ids_l1 ซึ่งเป็นค่าที่คำนวณได้
     จาก item_competency_map อยู่แล้ว ไม่ใช่ข้อมูลใหม่ — ต้องได้ DEC-16 ก่อนถือเป็นทางการ
  3. ทุกคอลัมน์รหัสถูกบังคับเป็นข้อความ กัน Google Sheets ตีความเป็นตัวเลขหรือวันที่
"""
import pandas as pd, json, hashlib, datetime, glob, os, re
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

ROOT = os.path.expanduser("~/mnt/IS - n8n resume analysis")
OUT  = os.path.join(ROOT, "07_sheets_import")
os.makedirs(OUT, exist_ok=True)

PKG      = "SHEETS-IS68076026-v1.2-01SEP26"
SNAPSHOT = "ONET31.0-IS68076026-v1.0"
CORPUS   = "CORPUS-IS68076026-v1.3-01SEP26"
RULES    = "RULES-IS68076026-v1.0-31AUG26"

def rd(p, **kw): return pd.read_csv(os.path.join(ROOT,p), dtype=str, keep_default_na=False, **kw)

# ---------------- DatasetMaster ----------------
req = rd("02_dataset/onet_requirements_28AUG26.csv", encoding="utf-8-sig")
al  = rd("02_dataset/element_aliases_28AUG26.csv",  encoding="utf-8-sig")
exc = rd("02_dataset/onet_requirements_excluded_28AUG26.csv", encoding="utf-8-sig")
RM  = json.load(open(os.path.join(ROOT,"02_dataset/role_map_28AUG26.json"), encoding="utf-8"))
rmdf = pd.DataFrame([{
    "role_id":r["role_id"],"role_name_th":r["role_name_th"],"target_role":r["target_role"],
    "track":r["track"],"soc_code":r["soc_code"],"onet_title":r["onet_title"],
    "mapping_type":r["mapping_type"],"job_zone":r["job_zone"],
    "candidate_pool_im_ge_3":r["candidate_pool_im_ge_3"],
    "candidate_pool_after_dec07":r["candidate_pool_after_dec07"],
    "n_requirements_selected":r["n_requirements_selected"],
    "weight_share_of_pool":r["weight_share_of_pool"],
    "requirement_id_prefix":r["requirement_id_prefix"],
    "corpus_target_courses":r["corpus_target"]["courses"],
    "corpus_target_certifications":r["corpus_target"]["certifications"],
    "mapping_rationale":r["mapping_rationale"] or "",
    "snapshot_version":SNAPSHOT} for r in RM["roles"]])

# ---------------- CorpusMaster ----------------
cor = rd("03_corpus/corpus_master_v13_01SEP26.csv", encoding="utf-8-sig")
icm = rd("03_corpus/item_competency_map_v13_01SEP26.csv", encoding="utf-8-sig")
gapreq = rd("03_corpus/corpus_gap_request_01SEP26.csv", encoding="utf-8-sig")

# v1.3 มี competency_ids_l1 มาแล้วตาม DEC-16 — ตรวจซ้ำว่ายังตรงกับ item_competency_map
l1 = icm[icm.coverage_layer == "L1_researcher_tagged"]
_l1map = l1.groupby("item_id").requirement_id.apply(lambda s: "|".join(sorted(set(s)))).to_dict()
assert "competency_ids_l1" in cor.columns, "corpus v1.3 ต้องมี competency_ids_l1"
for _t in cor.itertuples():
    _exp = _l1map.get(_t.item_id, "")
    _got = "|".join(sorted(_t.competency_ids_l1.split("|"))) if _t.competency_ids_l1 else ""
    assert _exp == _got, f"competency_ids_l1 ไม่ตรงกับ map ที่ {_t.item_id}"
    if _t.competency_ids_l1:
        assert set(_t.competency_ids_l1.split("|")) <= set(_t.competency_ids.split("|")), _t.item_id

pending = cor[cor.verification_status != "verified"][
    ["item_id","role_id","item_type","title","provider","source_url","exam_code",
     "competency_ids_l1","verification_status"]].copy()
pending["reviewer_result"]=""; pending["verified_date"]=""; pending["reviewer_note"]=""

# คำพ้องที่ถูกใช้ร่วมกันโดย element มากกว่าหนึ่งตัว — ต้องให้ผู้วิจัยตัดสินก่อน FREEZE
from collections import defaultdict
_own=defaultdict(list)
for _e,_n,_s in zip(al.element_id, al.element_name, al.element_aliases):
    for _a in _s.split("|"): _own[_a.strip().lower()].append((_e,_n))
alias_coll = pd.DataFrame([{"alias":a,"n_elements":len(v),
   "element_ids":" | ".join(x[0] for x in v),
   "element_names":" | ".join(x[1] for x in v),
   "reviewer_decision":"","reviewer_note":""}
   for a,v in sorted(_own.items()) if len(v)>1])

corpus_errors = pd.DataFrame(columns=[
 "item_id","role_id","field","error_type","error_detail","detected_at","resolved"])

# ---------------- MasterData ----------------
MD = {}
for f in sorted(glob.glob(os.path.join(ROOT,"04_master_data/master_data_csv_31AUG26/*.csv"))):
    name = re.sub(r"_31AUG26\.csv$","",os.path.basename(f))
    MD[name] = pd.read_csv(f, dtype=str, keep_default_na=False)

# ---------------- ResearchEval ----------------
gt  = rd("04_master_data/ground_truth_template_31AUG26.csv", encoding="utf-8-sig").iloc[0:0]
gtx = rd("04_master_data/ground_truth_extraction_template_31AUG26.csv", encoding="utf-8-sig").iloc[0:0]
evalm = pd.DataFrame(columns=[
 "metric_id","condition","submission_id","run_index","value","n","computed_at","rules_version"])

# ---------------- PipelineData (แท็บเปล่า) ----------------
HEAD = {
 "pipeline_run":"submission_id,run_index,role_id,snapshot_version,consent_at,file_sha256,page_count,char_density_per_page,ocr_used,ocr_engine,ocr_processor_version,pii_redactions,evidence_verified_ratio,n_evidence_claimed,n_evidence_verified,readiness_pct,n_validated,n_excluded,recommendation_mode,timeline_months,hours_per_week,learning_capacity_hours,planned_hours,timeline_feasible,whitelist_compliance,recommendation_mode_compliance,gap_coverage_l1,gap_coverage_any,no_candidate_found,report_mode,report_reference_validity,report_violations,report_markdown_sha256,report_markdown,completed_at",
 "gap_result":"submission_id,run_index,role_id,snapshot_version,rules_version,validated_at,requirement_id,domain,element_name,weight,final_status,confidence_tier,exclusion_reason,supporting_models,evidence_id,evidence_quote,rationale,per_model_json,ablation_A1,ablation_A2,ablation_A3",
 "condition_result":"submission_id,run_index,condition,n_claims,n_gap_claims,n_out_of_scope_claims,out_of_scope_claim_rate,rules_version,theta",
 "recommendation_result":"submission_id,run_index,role_id,rank,item_id,item_type,title,provider,phase,estimated_hours,covers_requirement_ids,covers_requirement_ids_l1,status",
 "model_call_log":"submission_id,run_index,role_id,stage,model_id,provider,temperature,latency_ms,input_tokens,output_tokens,reasoning_tokens,prompt_version,snapshot_version,access_date,raw_response_sha256,raw_response_truncated,raw_response",
 "audit_log":"submission_id,role_id,stage,error_type,error_message,node,execution_id,logged_at",
}

# ---------------- ประกอบสมุด ----------------
GROUPS = [
 ("DatasetMaster", [("onet_requirements",req),("element_aliases",al),
                    ("onet_requirements_excluded",exc),("role_map",rmdf)]),
 ("CorpusMaster",  [("recommendation_master",cor),("item_competency_map",icm),
                    ("corpus_build_errors",corpus_errors),("corpus_gap_request",gapreq)]),
 ("MasterData",    [(k,v) for k,v in MD.items()]),
 ("PipelineData",  [(k,pd.DataFrame(columns=v.split(","))) for k,v in HEAD.items()]),
 ("ResearchEval",  [("ground_truth",gt),("ground_truth_extraction",gtx),
                    ("evaluation_metrics",evalm)]),
 ("Review",        [("corpus_pending_verification",pending),
                    ("alias_collision_review",alias_coll)]),
]

TEXT = {"requirement_id","role_id","element_id","soc_code","snapshot_version","item_id",
        "requirement_id_prefix","map_id","exam_code","corpus_version","rules_version",
        "submission_id","config_id","registry_id","prompt_id","rule_id","mode_id",
        "timeline_id","condition_id","metric_id","provider_id","code","model_id"}
FILL = PatternFill("solid", fgColor="1F3864")
FONT = Font(color="FFFFFF", bold=True, size=10)

wb = Workbook(); wb.remove(wb.active)
readme = wb.create_sheet("_README")
manifest_tabs=[]
for grp, tabs in GROUPS:
    for name, df in tabs:
        ws = wb.create_sheet(name)
        ws.append(list(df.columns))
        for ci in range(1,len(df.columns)+1):
            cc=ws.cell(1,ci); cc.fill=FILL; cc.font=FONT
        for rec in df.itertuples(index=False):
            ws.append(list(rec))
        for j,cn in enumerate(df.columns, start=1):
            if cn in TEXT:
                for i in range(2,len(df)+2): ws.cell(i,j).number_format="@"
            ws.column_dimensions[get_column_letter(j)].width=min(max(12,len(cn)+2),40)
        ws.freeze_panes="A2"
        if len(df): ws.auto_filter.ref=ws.dimensions
        manifest_tabs.append({"group":grp,"tab":name,"rows":len(df),"cols":len(df.columns)})

info=[["IS 68076026 · ชุดข้อมูลงานวิจัยฉบับสมบูรณ์ สำหรับนำเข้า Google Sheets",""],["",""],
 ["sheets_package_version",PKG],["snapshot_version (O*NET)",SNAPSHOT],
 ["corpus_version",CORPUS],["rules_version",RULES],
 ["packaged_at","2026-09-01T00:00:00+07:00"],
 ["ผู้จัดทำ","ดนุสรณ์ อนันตกาล (Danusorn Anantakan), 68076026"],
 ["license","O*NET 31.0 · CC BY 4.0 — U.S. Department of Labor / ETA"],["",""],
 ["กลุ่ม","แท็บ · แถว"]]
for grp,_ in GROUPS:
    ts=[t for t in manifest_tabs if t["group"]==grp]
    info.append([grp, " · ".join(f"{t['tab']} ({t['rows']})" for t in ts)])
info += [["",""],["หมายเหตุสำคัญ",""],
 ["competency_ids_l1","คอลัมน์ใหม่ใน recommendation_master · คำนวณจาก item_competency_map ชั้น L1 · ต้องได้ DEC-16 ก่อนถือเป็นทางการ"],
 ["gap_coverage_l1 / _any","pipeline_run แยกเป็นสองคอลัมน์ตาม DEC-11 ที่บังคับให้รายงานสองค่าเสมอ"],
 ["raw_response_sha256","กันเพดาน 50,000 ตัวอักษรต่อเซลล์ของ Google Sheets ที่ตัดข้อความทิ้งโดยไม่แจ้ง"]]
for r in info: readme.append(r)
readme["A1"].font=Font(bold=True,size=14)
readme.column_dimensions["A"].width=34; readme.column_dimensions["B"].width=110
wb._sheets.insert(0, wb._sheets.pop(wb._sheets.index(readme)))

xlsx=os.path.join(OUT,"IS68076026_ResearchData_01SEP26.xlsx")
wb.save(xlsx)

# CSV สำรอง
# corpus_master ฉบับเต็มอยู่ที่ 03_corpus/corpus_master_v13_01SEP26.csv แล้ว ไม่เขียนซ้ำ
pending.to_csv(os.path.join(OUT,"corpus_pending_verification_01SEP26.csv"),index=False,encoding="utf-8-sig")

def sha(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for b in iter(lambda:f.read(1<<20),b""):h.update(b)
    return h.hexdigest()

man={"sheets_package_version":PKG,"snapshot_version":SNAPSHOT,"corpus_version":CORPUS,
 "rules_version":RULES,"packaged_at":"2026-09-01T00:00:00+07:00",
 "tabs":manifest_tabs,
 "total_cells":sum(t["rows"]*t["cols"] for t in manifest_tabs),
 "files":{os.path.basename(xlsx):sha(xlsx)},
 "source_sha256_verified":{
   "Data_Set.xlsx":sha(os.path.join(ROOT,"02_dataset/Data_Set.xlsx")),
   "onet_requirements_28AUG26.csv":sha(os.path.join(ROOT,"02_dataset/onet_requirements_28AUG26.csv")),
   "corpus_master_v13_01SEP26.csv":sha(os.path.join(ROOT,"03_corpus/corpus_master_v13_01SEP26.csv")),
   "item_competency_map_v13_01SEP26.csv":sha(os.path.join(ROOT,"03_corpus/item_competency_map_v13_01SEP26.csv")),
   "Course_Career_v13_01SEP26.xlsx":sha(os.path.join(ROOT,"03_corpus/Course_Career_v13_01SEP26.xlsx")),
   "Master_Data_31AUG26.xlsx":sha(os.path.join(ROOT,"04_master_data/Master_Data_31AUG26.xlsx"))},
 "generated_at":datetime.datetime.now(datetime.timezone.utc).isoformat()}
json.dump(man,open(os.path.join(OUT,"sheets_package_log_01SEP26.json"),"w",encoding="utf-8"),
          ensure_ascii=False,indent=2)

print("WROTE", xlsx)
print("tabs", len(manifest_tabs), "| total cells", man["total_cells"])
for t in manifest_tabs: print(f"  {t['group']:14s} {t['tab']:30s} {t['rows']:5d} x {t['cols']}")
