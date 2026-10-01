# -*- coding: utf-8 -*-
"""
build_corpus_v13_01SEP26.py  ·  DEC-16 : Cross-role professional track
สร้าง corpus v1.3 จาก v1.2 โดยขยายรายการที่ "ผู้วิจัยเคยจัดให้ข้ามบทบาทอยู่แล้ว"
ไปยังบทบาทที่ยังขาดการครอบคลุมในชั้น L1

หลักการที่ทำให้ตรวจสอบได้
  * ไม่สร้างรายการใหม่ ไม่มี URL ที่เดาขึ้น — ทุกแถวใหม่คัดลอกจากแถวที่ verified แล้ว
    โดยคง title / provider / source_url / estimated_hours / cost / exam_code เดิมทุกตัว
  * เกณฑ์ความเหมาะสมมาจากการตัดสินใจที่ผู้วิจัยทำไว้เองแล้ว ไม่ใช่วิจารณญาณของเครื่อง
      T1  รายการนั้นถูกใช้ใน >= 2 track อยู่แล้ว  หรือ  อยู่ใน batch v1.0_gap_closure (DEC-09)
      T2  ขยายเข้า track ที่รายการนั้นยังไม่เคยอยู่ ทำได้เฉพาะเมื่อ
          รายการอยู่ใน >= 3 track อยู่แล้ว หรืออยู่ใน batch v1.0_gap_closure
  * แถว mapping ใหม่ประกาศที่มาชัดเจน mapping_rule = R23-crossrole
    mapping_method = crossrole_extension  และ mapping_status = pending_review
    coverage_layer ยังเป็น L1 เพราะการตัดสินว่า "รายการนี้สอน element นี้จริง"
    เป็นการตัดสินระดับ element ที่ผู้วิจัยทำไว้แล้ว ไม่ใช่การเดาของกฎ
"""
import pandas as pd, json, hashlib, datetime, os
from collections import defaultdict

ROOT=os.path.expanduser("~/mnt/IS - n8n resume analysis")
D=lambda *p: os.path.join(ROOT,*p)
CORPUS_V="CORPUS-IS68076026-v1.3-01SEP26"
SNAPSHOT="ONET31.0-IS68076026-v1.0"

req=pd.read_csv(D("02_dataset/onet_requirements_28AUG26.csv"),encoding="utf-8-sig",dtype=str,keep_default_na=False)
cor=pd.read_csv(D("03_corpus/corpus_master_v12_31AUG26.csv"),dtype=str,keep_default_na=False)
icm=pd.read_csv(D("03_corpus/item_competency_map_31AUG26.csv"),dtype=str,keep_default_na=False)

ver=set(cor[cor.verification_status=="verified"].item_id)
l1=icm[(icm.coverage_layer=="L1_researcher_tagged")&(icm.item_id.isin(ver))]
REQBY=req.groupby("role_id").element_id.apply(set).to_dict()
WEIGHT={(t.role_id,t.element_id):float(t.weight_renormalized) for t in req.itertuples()}
ENAME=dict(zip(req.element_id,req.element_name))
EDOM=dict(zip(req.element_id,req.domain))
EIM={(t.role_id,t.element_id):t.importance_im for t in req.itertuples()}
ROLEINFO=cor.groupby("role_id").first()[["role_name_th","target_role","soc_code","track","mapping_type"]]

# ---------- พูลรายการที่ขยายได้ ----------
cor["key"]=cor.title.str.strip()+" @@ "+cor.provider.str.strip()+" @@ "+cor.source_url.str.strip()
cv=cor[cor.item_id.isin(ver)]
g=cv.groupby("key").agg(n_tracks=("track","nunique"),tracks=("track",lambda s:set(s)),
                        batch=("batch","first"),roles=("role_id",lambda s:set(s)))
POOL=g[(g.n_tracks>=2)|(g.batch=="v1.0_gap_closure")]
k2i=defaultdict(list)
for t in cv.itertuples(): k2i[t.key].append(t.item_id)
# element ที่แต่ละ key ครอบคลุมในชั้น L1 พร้อมความแรง
kelem={}
for k in POOL.index:
    d={}
    for i in k2i[k]:
        for t in l1[l1.item_id==i].itertuples():
            d.setdefault(t.element_id,t.coverage_strength)
    kelem[k]=d

def allowed(k,role):
    """T2 — ขยายเข้า track ใหม่ได้เฉพาะรายการที่กว้างจริง"""
    tr=ROLEINFO.loc[role,"track"]
    if tr in POOL.loc[k,"tracks"]: return True
    return POOL.loc[k,"n_tracks"]>=3 or POOL.loc[k,"batch"]=="v1.0_gap_closure"

# ---------- ช่องว่างที่ต้องปิด ----------
covL1v=set(l1.requirement_id)
gaps=defaultdict(set)                       # role -> {element}
for t in req.itertuples():
    if t.requirement_id not in covL1v: gaps[t.role_id].add(t.element_id)

# ---------- greedy: ใช้รายการน้อยที่สุด ชั่วโมงน้อยที่สุด ----------
HOURS=cv.groupby("key").estimated_hours.first().astype(int).to_dict()
plan=defaultdict(list)                      # role -> [(key, {elements})]
for role in sorted(gaps):
    remain=set(gaps[role]) & REQBY[role]
    have={i for i in cv[cv.role_id==role].item_id}
    havekeys={cor.set_index("item_id").loc[i,"key"] for i in have}
    while remain:
        best=None;bestcov=set()
        for k in POOL.index:
            if k in havekeys: continue
            if not allowed(k,role): continue
            cov={e for e in remain if e in kelem[k]}
            if not cov: continue
            if (len(cov)>len(bestcov)) or (len(cov)==len(bestcov) and best and HOURS[k]<HOURS[best]):
                best,bestcov=k,cov
        if not best: break
        plan[role].append((best,bestcov)); remain-=bestcov; havekeys.add(best)
    if remain: plan[role].append((None,remain))     # ปิดไม่ได้

closed=sum(len(cv2) for role in plan for k,cv2 in plan[role] if k)
unclosed=[(role,e) for role in plan for k,cv2 in plan[role] if k is None for e in cv2]
newrows=sum(1 for role in plan for k,_ in plan[role] if k)
print(f"ช่องว่างเดิม {sum(len(v) for v in gaps.values())} คู่ · ปิดได้ {closed} · เหลือ {len(unclosed)}")
print(f"แถวใหม่ที่ต้องเพิ่มใน corpus: {newrows}  (431 -> {431+newrows})")
print(f"coverage L1+verified: 364 -> {364+closed}/600 = {(364+closed)/6:.1f}%")

# ---------- สร้างแถวใหม่ ----------
tmpl=cor.set_index("item_id")
nextn=defaultdict(int)
for t in cor.itertuples():
    p=t.item_id.split("-"); nextn[(t.role_id,p[0])]=max(nextn[(t.role_id,p[0])],int(p[2]))
rows=[];maps=[]
for role in sorted(plan):
    for k,els in plan[role]:
        if k is None: continue
        src=tmpl.loc[k2i[k][0]].copy()
        pre="CRS" if src.item_type=="course" else "CRT"
        nextn[(role,pre)]+=1
        iid=f"{pre}-{role}-{nextn[(role,pre)]:02d}"
        allel=[e for e in kelem[k] if e in REQBY[role]]
        l1el=sorted(allel)
        rid=[f"REQ-{role}-{e}" for e in l1el]
        w=sum(WEIGHT[(role,e)] for e in l1el)
        row=src.to_dict()
        row.update({
          "item_id":iid,"role_id":role,
          "role_name_th":ROLEINFO.loc[role,"role_name_th"],
          "target_role":ROLEINFO.loc[role,"target_role"],
          "soc_code":ROLEINFO.loc[role,"soc_code"],
          "track":ROLEINFO.loc[role,"track"],
          "mapping_type":ROLEINFO.loc[role,"mapping_type"],
          "priority_rank":str(nextn[(role,pre)]),
          "competency_ids":"|".join(rid),
          "competency_ids_l1":"|".join(rid),
          "competency_names":"|".join(ENAME[e] for e in l1el),
          "n_competencies":str(len(rid)),"n_competencies_l1":str(len(rid)),
          "domains_covered":"|".join(sorted({EDOM[e] for e in l1el})),
          "weight_covered":f"{w:.6f}","weight_covered_l1":f"{w:.6f}",
          "expected_readiness_gain_pct":f"{w*100:.2f}",
          "expected_readiness_gain_core_pct":f"{w*100:.2f}",
          "corpus_version":CORPUS_V,"batch":"v1.3_crossrole",
          "researcher_notes":(f"DEC-16 ขยายข้ามบทบาทจาก {k2i[k][0]} · "
             f"คงชื่อ ผู้ให้บริการ URL ชั่วโมง และค่าใช้จ่ายเดิมทุกค่า · "
             f"ต้องทบทวน mapping ก่อน FREEZE"),
        })
        rows.append(row)
        for e in l1el:
            maps.append({"map_id":f"MAP-{iid}-{e}","item_id":iid,"item_type":src.item_type,
              "role_id":role,"requirement_id":f"REQ-{role}-{e}","domain":EDOM[e],
              "element_id":e,"element_name":ENAME[e],"importance_im":EIM[(role,e)],
              "weight_renormalized":f"{WEIGHT[(role,e)]:.6f}",
              "coverage_layer":"L1_researcher_tagged",
              "coverage_strength":kelem[k][e],
              "mapping_rule":"R23-crossrole","mapping_method":"crossrole_extension",
              "mapping_status":"pending_review"})

# ---------- เติม competency_ids_l1 ให้แถวเดิม ----------
l1all=icm[icm.coverage_layer=="L1_researcher_tagged"]
l1by=l1all.groupby("item_id").requirement_id.apply(lambda s:"|".join(sorted(set(s)))).to_dict()
cor2=cor.drop(columns=["key"]).copy()
cor2.insert(cor2.columns.get_loc("competency_ids")+1,"competency_ids_l1",
            cor2.item_id.map(l1by).fillna(""))
new=pd.DataFrame(rows)[cor2.columns]
out=pd.concat([cor2,new],ignore_index=True).sort_values(["role_id","item_type","item_id"])
icm2=pd.concat([icm,pd.DataFrame(maps)[icm.columns]],ignore_index=True).sort_values(["role_id","item_id","element_id"])

# ---------- ตรวจก่อนเขียน ----------
assert out.item_id.is_unique
assert icm2.map_id.is_unique
for t in out.itertuples():
    ids=[i for i in t.competency_ids.split("|") if i]
    assert all(i.startswith(f"REQ-{t.role_id}-") for i in ids), t.item_id
    assert set(i for i in t.competency_ids_l1.split("|") if i) <= set(ids), t.item_id
assert set(icm2.item_id)<=set(out.item_id) and set(icm2.requirement_id)<=set(req.requirement_id)
pm=set(zip(icm2.item_id,icm2.requirement_id))
pc=set((t.item_id,i) for t in out.itertuples() for i in t.competency_ids.split("|") if i)
assert pm==pc, f"map/corpus ไม่ตรง {len(pm-pc)} / {len(pc-pm)}"

OUT=D("03_corpus")
out.to_csv(os.path.join(OUT,"corpus_master_v13_01SEP26.csv"),index=False,encoding="utf-8-sig")
icm2.to_csv(os.path.join(OUT,"item_competency_map_v13_01SEP26.csv"),index=False,encoding="utf-8-sig")

# ---------- worklist ของช่องว่างที่เหลือ ----------
wl=defaultdict(list)
for role,e in unclosed: wl[e].append(role)
wldf=pd.DataFrame([{"element_id":e,"element_name":ENAME[e],"domain":EDOM[e],
  "n_roles":len(v),"roles":",".join(sorted(v)),
  "weight_at_stake_pct":round(sum(WEIGHT[(ro,e)] for ro in v)*100,2),
  "item_needed":"","provider":"","source_url":"","estimated_hours":"",
  "cost_category":"","verified_date":"","researcher_note":""}
  for e,v in sorted(wl.items(),key=lambda x:-len(x[1]))])
wldf.to_csv(os.path.join(OUT,"corpus_gap_request_01SEP26.csv"),index=False,encoding="utf-8-sig")

def sha(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for b in iter(lambda:f.read(1<<20),b""):h.update(b)
    return h.hexdigest()
verset=set(out[out.verification_status=="verified"].item_id)
l1n=icm2[icm2.coverage_layer=="L1_researcher_tagged"]
cov_l1v=len(set(l1n[l1n.item_id.isin(verset)].requirement_id))
cov_any=len(set(icm2[icm2.item_id.isin(verset)].requirement_id))
log={"corpus_version":CORPUS_V,"snapshot_version":SNAPSHOT,
 "previous_version":"CORPUS-IS68076026-v1.2-31AUG26",
 "decisions_applied":["DEC-09","DEC-10","DEC-11","DEC-14","DEC-15","DEC-16"],
 "built_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),
 "row_count":{"corpus_master":len(out),"item_competency_map":len(icm2),
   "rows_added_by_DEC16":len(new),"maps_added_by_DEC16":len(maps)},
 "coverage":{"L1_and_verified_pct":round(cov_l1v/6,1),"L1_and_verified_n":cov_l1v,
   "any_layer_verified_pct":round(cov_any/6,1),"any_layer_verified_n":cov_any,
   "remaining_gap_pairs":len(unclosed)},
 "sha256":{"corpus_master_v13_01SEP26.csv":sha(os.path.join(OUT,"corpus_master_v13_01SEP26.csv")),
   "item_competency_map_v13_01SEP26.csv":sha(os.path.join(OUT,"item_competency_map_v13_01SEP26.csv"))},
 "frozen_at":None,
 "note":("frozen_at ยังเป็น null — ต้องทบทวน mapping ของแถว batch v1.3_crossrole "
         f"({len(new)} แถว) และปิดช่องว่างที่เหลือตาม corpus_gap_request_01SEP26.csv ก่อนตรึง")}
json.dump(log,open(os.path.join(OUT,"corpus_version_log_v13_01SEP26.json"),"w",encoding="utf-8"),
          ensure_ascii=False,indent=2)
print(f"\ncorpus {len(cor)} -> {len(out)} · map {len(icm)} -> {len(icm2)}")
print(f"coverage L1+verified {cov_l1v}/600 = {cov_l1v/6:.1f}%  ·  any+verified {cov_any}/600 = {cov_any/6:.1f}%")
print(f"เหลือช่องว่าง {len(unclosed)} คู่ ใน {len(wl)} element -> corpus_gap_request_01SEP26.csv")

# ---------------------------------------------------------------------------
# สมุด Course_Career v1.3 — คงโครงชีตเดิมของ v1.2 ทุกชีต เปลี่ยนเฉพาะที่ต้องเปลี่ยน
# ---------------------------------------------------------------------------
SRC=D("03_corpus/Course_Career_v12_31AUG26.xlsx")
DST=D("03_corpus/Course_Career_v13_01SEP26.xlsx")
xl=pd.ExcelFile(SRC)
sheets={s:pd.read_excel(SRC,sheet_name=s,dtype=str,keep_default_na=False) for s in xl.sheet_names}
sheets["corpus_master"]=out
sheets["item_competency_map"]=icm2

# role_index: คำนวณใหม่จาก v1.3
ri=sheets["role_index"].copy()
cnt=out.groupby("role_id").size()
ccnt=out[out.item_type=="course"].groupby("role_id").size()
tcnt=out[out.item_type=="certification"].groupby("role_id").size()
l1n2=icm2[icm2.coverage_layer=="L1_researcher_tagged"]
verset2=set(out[out.verification_status=="verified"].item_id)
for col,ser in [("n_items",cnt),("n_courses",ccnt),("n_certifications",tcnt)]:
    if col in ri.columns: ri[col]=ri.role_id.map(ser).fillna(0).astype(int).astype(str)
def _cov(role,layer_only,ver_only):
    mm=icm2[icm2.role_id==role]
    if layer_only: mm=mm[mm.coverage_layer=="L1_researcher_tagged"]
    if ver_only:   mm=mm[mm.item_id.isin(verset2)]
    return len(set(mm.requirement_id))
# ใช้ชื่อฟิลด์ให้ตรงกับที่ check_corpus_31AUG26.py ตรวจ (CHK-10)
REQBY_N={r:len(v) for r,v in REQBY.items()}
for role in ri.role_id:
    cov=_cov(role,False,False); covl1=_cov(role,True,False); n=REQBY_N[role]
    ri.loc[ri.role_id==role,"requirements_covered"]=str(cov)
    ri.loc[ri.role_id==role,"requirements_covered_l1"]=str(covl1)
    ri.loc[ri.role_id==role,"requirements_uncovered"]=str(n-cov)
    ri.loc[ri.role_id==role,"corpus_gap_coverage_pct"]=f"{100*cov/n:.1f}"
    ri.loc[ri.role_id==role,"covered_l1_verified"]=str(_cov(role,True,True))
    ri.loc[ri.role_id==role,"covered_any_verified"]=str(_cov(role,False,True))
sheets["role_index"]=ri

# uncovered_requirements คงนิยามเดิมตามที่ CHK-11 ตรวจ = ไม่มีรายการรองรับเลย ทุกชั้น ทุกสถานะ
cov_any_set=set(icm2.requirement_id)
unc=req[~req.requirement_id.isin(cov_any_set)][
    ["role_id","requirement_id","domain","element_name","importance_im","weight_renormalized"]].copy()
sheets["uncovered_requirements"]=unc
# ช่องว่างชั้น L1+verified ซึ่งเป็นค่าที่ pipeline ใช้จริง อยู่ในชีต corpus_gap_request แยกต่างหาก

# mapping_rules: เพิ่มกฎใหม่
mrl=sheets["mapping_rules"].copy()
mrl=pd.concat([mrl,pd.DataFrame([{"rule_id":"R23-crossrole",
  "elements_assigned":"—","condition_summary":"ขยายรายการที่ verified แล้วจากบทบาทหนึ่งไปอีกบทบาท ตามเกณฑ์ T1/T2 ของ DEC-16",
  "rationale_th":("ปิดช่องว่างการครอบคลุมชั้น L1 โดยไม่สร้างรายการใหม่และไม่มี URL ที่เดาขึ้น "
                  "เกณฑ์อิงจากการที่ผู้วิจัยเคยจัดรายการนั้นให้ข้ามบทบาทอยู่แล้ว"),
  "n_mappings_created":str(len(maps))}])],ignore_index=True)
sheets["mapping_rules"]=mrl

# corpus_gap_request: ชีตใหม่
sheets["corpus_gap_request"]=wldf

# qa_checks / freeze_manifest: ให้สะท้อน v1.3
fm=sheets["freeze_manifest"].copy()
fm=pd.concat([fm,pd.DataFrame([
 {"file":"corpus_master_v13_01SEP26.csv","sheet":"corpus_master","row_count":str(len(out)),
  "sha256_of_file":sha(os.path.join(OUT,"corpus_master_v13_01SEP26.csv")),"frozen_at":"",
  "note":"DEC-16 · ยังไม่ตรึง"},
 {"file":"item_competency_map_v13_01SEP26.csv","sheet":"item_competency_map","row_count":str(len(icm2)),
  "sha256_of_file":sha(os.path.join(OUT,"item_competency_map_v13_01SEP26.csv")),"frozen_at":"",
  "note":"DEC-16 · ยังไม่ตรึง"}])],ignore_index=True)
sheets["freeze_manifest"]=fm

rd0=sheets["README"].copy()
rd0.loc[len(rd0)]=["corpus_version",CORPUS_V]
rd0.loc[len(rd0)]=["ครอบคลุม L1 + verified (Workflow F ใช้จริง)",f"{cov_l1v}/600 = {cov_l1v/6:.1f}%"]
rd0.loc[len(rd0)]=["ครอบคลุมทุกชั้น + verified",f"{cov_any}/600 = {cov_any/6:.1f}%"]
rd0.loc[len(rd0)]=["ช่องว่างที่เหลือ",f"{len(unclosed)} คู่ — ดูชีต corpus_gap_request"]
sheets["README"]=rd0

with pd.ExcelWriter(DST, engine="openpyxl") as w:
    for name,df in sheets.items(): df.to_excel(w, sheet_name=name, index=False)
print(f"\nเขียนสมุด {os.path.basename(DST)} · {len(sheets)} ชีต")
log["sha256"]["Course_Career_v13_01SEP26.xlsx"]=sha(DST)
json.dump(log,open(os.path.join(OUT,"corpus_version_log_v13_01SEP26.json"),"w",encoding="utf-8"),
          ensure_ascii=False,indent=2)
