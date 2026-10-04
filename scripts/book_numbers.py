# -*- coding: utf-8 -*-
"""
book_numbers.py — คำนวณตัวเลขทุกตัวที่เล่มอ้าง จากไฟล์จริง (ไม่พิมพ์ตัวเลขลงเล่มด้วยมือ)
  python scripts/book_numbers.py   -> book/numbers.json
แหล่ง: data/*.csv · data/manifest.json · evidence/mapping_review_summary.json · evidence/coverage_simulation.json
       evidence/run_local/case_*/summary.json · evidence/test_summary.json
ตัวเลขในเล่มเขียนเป็น {{key}} และ scripts/build_book.py แทนค่าตอน build ถ้าไม่มี key ใด build จะหยุด
"""
import json, os, datetime
import pandas as pd

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
J = lambda *p: json.load(open(os.path.join(ROOT, *p), encoding="utf-8"))
TH_MONTH = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]


def term_th(t):
    """คำศัพท์ตาม Prompt_Report 8.4 สำหรับข้อความที่มาจากไฟล์ข้อมูล (ไม่แก้ไฟล์ข้อมูล)"""
    for a, b in (("การจับคู่", "การเทียบรหัส"), ("ตามข้อกำหนด", "ตามความต้องการของงาน")): t = t.replace(a, b)
    return t


def fmt(x, d=0):
    if isinstance(x, str): return x
    return f"{x:,.{d}f}"


def main():
    c = pd.read_csv(os.path.join(ROOT, "data", "corpus.csv"), dtype=str, keep_default_na=False)
    m = pd.read_csv(os.path.join(ROOT, "data", "mappings.csv"), dtype=str, keep_default_na=False)
    gap = pd.read_csv(os.path.join(ROOT, "data", "corpus_gap_request.csv"), dtype=str, keep_default_na=False)
    rv = J("evidence", "mapping_review_summary.json")
    man = J("data", "manifest.json")
    sim = J("evidence", "coverage_simulation.json")
    tests = J("evidence", "test_summary.json")
    h = c.estimated_hours.astype(float)
    n = {
        "corpus_version": man["corpus_version"], "corpus_items": fmt(len(c)),
        "corpus_courses": fmt((c.item_type == "course").sum()), "corpus_certs": fmt((c.item_type == "certification").sum()),
        "hours_min": fmt(h.min()), "hours_max": fmt(h.max()), "hours_median": fmt(h.median()),
        "cert_hours_mean": fmt(h[c.item_type == "certification"].mean()), "course_hours_mean": fmt(h[c.item_type == "course"].mean()),
        "map_total": fmt(len(m)), "map_L1": fmt((m.coverage_layer == "L1_researcher_tagged").sum()),
        "map_L2": fmt((m.coverage_layer == "L2_rule_augmented").sum()),
        "map_passed": fmt(rv["rows_passed"]), "map_failed_not_L1": fmt(rv["rows_failed_not_L1"]),
        "map_failed_L1_other": fmt(rv["rows_failed_L1_other"]), "items_in_passed": fmt(rv["items_in_passed_rows"]),
        "req_covered": fmt(rv["requirements_with_passed_item"]), "per_role_min": fmt(rv["per_role_min"]), "per_role_max": fmt(rv["per_role_max"]),
        "req_uncovered": fmt(600 - rv["requirements_with_passed_item"]),
        "req_uncovered_ids": ", ".join(gap.requirement_id) if len(gap) else "ไม่มี",
        "foundation_rows": fmt((c.batch == "v1.5_foundation").sum()), "foundation_maps": fmt((m.mapping_method == "foundation_track").sum()),
        "promoted": fmt((m.mapping_method == "researcher_promoted").sum()),
        "url_pending_items": fmt((c.verification_status != "verified").sum()),
        "tests_total": fmt(tests["pass"] + tests["fail"]), "tests_pass": fmt(tests["pass"]),
        "manifest_frozen": "ตรึงแล้ว" if man["frozen"] else "ยังไม่ตรึง (ตรึงหลังการทดสอบนำร่องตามหัวข้อ 3.7)",
    }
    d = datetime.date.fromisoformat(rv.get("reviewed_at", "2026-10-01")) if rv.get("reviewed_at") else datetime.date(2026, 10, 1)
    n["review_date_th"] = f"{d.day} {TH_MONTH[d.month]} {d.year + 543}"
    cap = {(s["months"], s["hours_per_week"]): s for s in sim["by_capacity"]}
    mode = {s["mode"]: s for s in sim["by_mode_6m10h"]}
    n["sim_both_6m10h"] = fmt(cap[(6, 10)]["covered"]); n["sim_both_6m5h"] = fmt(cap[(6, 5)]["covered"])
    n["sim_cert_6m10h"] = fmt(mode["certification_only"]["covered"]); n["sim_course_6m10h"] = fmt(mode["course_only"]["covered"])
    for k in "ABCD":
        s = J("evidence", "run_local", f"case_{k}", "summary.json")
        fx = lambda v: v if isinstance(v, str) else f"{v:.2f}"
        n.update({f"c{k}_Rlex": fx(s["R_lexical_only"]), f"c{k}_Rnor3": fx(s["R_no_r3"]), f"c{k}_checks": fmt(s["verifier_checks"]), f"c{k}_unverified": fmt(s["unverified_votes"]),
                  f"c{k}_repaired": fmt(s["repaired_quotes"]), f"c{k}_floors": f"{s['floor_credential']}/{s['floor_linkage']}", f"c{k}_T": fx(s["T"]),
                  f"c{k}_H": f"{s['H_found']}/{s['H_total']}", f"c{k}_accd": f"{s['accuracy_direct']:.3f}", f"c{k}_years": fmt(s["years_experience"]) if s["years_experience"] is not None else "N/A"})
        R = s["R"]
        n.update({f"c{k}_m": fmt(s["usable_models"]), f"c{k}_decided": fmt(s["decided"]), f"c{k}_correct": fmt(s["correct_on_decided"]),
                  f"c{k}_acc": f"{s['accuracy_on_decided']:.3f}", f"c{k}_R": R if isinstance(R, str) else f"{R:.2f}",
                  f"c{k}_C": f"{float(s['C']):.3f}", f"c{k}_U": fmt(s["unsupported_claims"]), f"c{k}_items": fmt(s["plan_items"]),
                  f"c{k}_hours": fmt(s["plan_hours"]), f"c{k}_abstained": fmt(s["total"] - s["decided"]),
                  f"c{k}_gapcov": s["gap_coverage"] if isinstance(s["gap_coverage"], str) else f"{s['gap_coverage']:.2f}",
                  f"c{k}_nocand": fmt(s["uncovered_no_candidate"])})
    # ---------- ความครอบคลุม 600 (DEC-41) ----------
    n["cov_corpus"] = fmt(sim["corpus_coverage"]); n["cov_plan"] = fmt(cap[(6, 10)]["covered"])
    n["cov_corpus_gap"] = fmt(600 - sim["corpus_coverage"]); n["cov_plan_gap"] = fmt(600 - cap[(6, 10)]["covered"])
    n["plan_strategy"] = sim.get("strategy", "weighted_greedy")
    for h in (5, 15, 20): n[f"cov_plan_6m{h}h"] = fmt(cap[(6, h)]["covered"])
    mon = {s["months"]: s for s in sim.get("by_months_10h", [])}
    for mm in (12, 18, 24): n[f"cov_plan_{mm}m10h"] = fmt(mon[mm]["covered"]) if mm in mon else "N/A"
    n["cov_plan_mean_items"] = f"{cap[(6, 10)]['mean_items_per_plan']:.1f}"; n["cov_plan_mean_hours"] = f"{cap[(6, 10)]['mean_hours_per_plan']:.1f}"
    n["Hmax_6m10h"] = f"{cap[(6, 10)]['Hmax']:.1f}"; n["Hmax_6m5h"] = f"{cap[(6, 5)]['Hmax']:.1f}"
    dg = J("evidence", "coverage_diagnostics.json")
    # base = คลังก่อนเพิ่มรายการ coverage track (DEC-46) ใช้กับย่อหน้าวินิจฉัยในหัวข้อ 3.2 เพื่อไม่ให้ตัวเลขเปลี่ยนเมื่อผู้วิจัยยืนยันรายการ
    base = dg["scenarios"].get("before_track", dg["scenarios"]["current"])
    cur, fut = dg["scenarios"]["current"], dg["scenarios"]["additions_confirmed"]
    n["ilp_max_cov_now"] = fmt(cur["totals"]["ilp"])
    wia = J("evidence", "coverage_whatif.json")["scenarios"]
    n["cov_plan_cf"] = fmt(wia["current"]["coverage_first"]["primary_6m10h_both"]["covered"])
    mins = [r["ilp_min_hours_all"] for r in base["roles"]]; fmins = [r["ilp_min_hours_all"] for r in fut["roles"]]
    n["ilp_min_lo"], n["ilp_min_hi"] = fmt(min(mins)), fmt(max(mins)); n["ilp_fit_roles"] = fmt(sum(r["fits_Hmax"] for r in base["roles"]))
    n["ilp_max_cov"] = fmt(base["totals"]["ilp"]); n["ilp_min_lo_add"], n["ilp_min_hi_add"] = fmt(min(fmins)), fmt(max(fmins))
    n["ilp_fit_roles_add"] = fmt(sum(r["fits_Hmax"] for r in fut["roles"]))
    n["cause_hours"] = fmt(base["totals"].get("cause_hours", 0)); n["cause_selection"] = fmt(base["totals"].get("cause_selection", 0))
    n["cause_no_item"] = fmt(base["totals"].get("cause_no_item", 0))
    adds = pd.read_csv(os.path.join(ROOT, "data", "corpus_additions.csv"), dtype=str, keep_default_na=False)
    conf = adds.researcher_result.str.strip().str.upper().isin(["LIVE", "OK", "VERIFIED"])
    n["add_total"] = fmt(len(adds)); n["add_confirmed"] = fmt(int(conf.sum())); n["add_pending"] = fmt(int((~conf).sum()))
    n["add_hours_lo"] = fmt(adds.estimated_hours.astype(float).min()); n["add_hours_hi"] = fmt(adds.estimated_hours.astype(float).max())
    n["foundation_ext_maps"] = fmt((pd.read_csv(os.path.join(ROOT, "data", "corpus_change_log.csv"), dtype=str).change == "foundation_L1_extended").sum())
    wi = wia["additions_confirmed"][n["plan_strategy"]]["primary_6m10h_both"]["covered"]
    n["cov_whatif_plan"] = fmt(wi); n["cov_whatif_corpus"] = fmt(fut["totals"]["coverable"])
    if sim["corpus_coverage"] == 600 and cap[(6, 10)]["covered"] == 600:
        n["cov_status_note"] = "ทั้งสองตัวชี้วัดถึงเป้า 600 ข้อ"
    else:
        n["cov_status_note"] = (f"ยังไม่ถึงเป้า เพราะรายการเรียนรู้ใหม่ {n['add_pending']} รายการยังรอผู้วิจัยเปิดตรวจยืนยัน "
                                f"ระบบจึงยังไม่นับรายการเหล่านี้ เมื่อยืนยันครบ การจำลองชุดเดียวกันให้ความครอบคลุมของคลัง "
                                f"{n['cov_whatif_corpus']} ข้อ และของแผนจำลอง {n['cov_whatif_plan']} ข้อ")
    m12, m18, m24 = (int(mon[x]["covered"]) for x in (12, 18, 24))
    n["cov_24m_note"] = (f"เมื่อเรียน 10 ชั่วโมงต่อสัปดาห์ แผน 12 18 และ 24 เดือนครอบคลุม {fmt(m12)} {fmt(m18)} และ {fmt(m24)} ข้อตามลำดับ"
                         + (" ข้อที่ยังขาดที่ 24 เดือนคือข้อที่คลังไม่มีรายการรองรับ" if m24 == int(sim["corpus_coverage"]) and m24 < 600 else ""))
    arow = ["| รหัส | รายการเรียนรู้ | ผู้ให้บริการ | ชั่วโมง | องค์ประกอบ O*NET | สถานะ |", "|---|---|---|---|---|---|"]
    for a, ok in zip(adds.itertuples(), conf):
        arow.append(f"| {a.key} | {a.title} | {a.provider} | {fmt(float(a.estimated_hours))} | {a.elements.replace('|', ', ')} | "
                    + ("Claude ตรวจหน้าเว็บ 3 ต.ค. 2569 ตามที่ผู้วิจัยมอบหมาย" if ok else "รอตรวจ") + " |")
    n["additions_table"] = "\n".join(arow)
    trow = ["| อาชีพ | ข้อที่มีรายการรองรับ | แผนจำลองครอบคลุม (ข้อ) | ชั่วโมงของแผน | ชั่วโมงขั้นต่ำเพื่อครบทุกข้อ (ILP) |", "|---|---|---|---|---|"]
    per = {r["role_id"]: r for r in sim["primary_6m10h_both"]["per_role"]}
    for r in cur["roles"]:
        trow.append(f"| {r['role_id']} | {r['coverable']} | {per[r['role_id']]['covered']} | {per[r['role_id']]['hours']:,.0f} | {r['ilp_min_hours_all']:,.0f} |")
    n["coverage_role_table"] = "\n".join(trow)
    url = pd.read_csv(os.path.join(ROOT, "data", "url_manual_check.csv"), dtype=str, keep_default_na=False)
    n["url_pending_urls"] = fmt(int((~url.researcher_result.str.strip().str.upper().isin(["LIVE", "OK", "VERIFIED"])).sum()))
    wm = J("workflows", "manifest.json")
    n["wf_name"] = wm["workflow"]["file"].replace(".json", ""); n["wf_nodes"] = fmt(wm["workflow"]["nodes"]); n["wf_notes"] = fmt(wm["workflow"]["sticky_notes"])
    n["wf_sections"] = fmt(len(wm["workflow"]["sections"])); n["n8n_version"] = wm["n8n_version"]; n["engine_version"] = wm["engine_version"]
    for i, s_ in enumerate(wm["workflow"]["sections"], 1): n[f"wf_s{i}_nodes"] = fmt(s_["nodes"]); n[f"wf_s{i}_th"] = s_["th"]
    n["wf_final_nodes"] = fmt(wm["superseded"]["WF_Final_IS"]["nodes"])
    n["text_layer_min_chars"] = fmt(J("config", "project.json")["text_layer_min_chars"])
    # DEC-48: ผลทดสอบใน n8n จริง (evidence/n8n_test_summary.json สร้างจากชุดทดสอบ evidence/n8n_s6/) และเวลารอก่อนเรียกซ้ำจาก config/models.json
    nt = J("evidence", "n8n_test_summary_03OCT26.json"); n["n8n_cases"] = fmt(nt["cases"]); n["n8n_pass"] = fmt(nt["pass"]); n["n8n_checks"] = fmt(nt["checks"]); n["n8n_checks_pass"] = fmt(nt["checks_pass"]); n["n8n_test_date"] = nt["date"]
    bo = J("config", "models.json")["defaults"]["retry_backoff_ms"]; n["retry_backoff_text"] = " และ ".join(fmt(x / 1000) for x in bo) + " วินาที"
    import re as _re
    tr = open(os.path.join(ROOT, "evidence", "WF_analysis.md"), encoding="utf-8").read().split("## 2 · Traceability")[1].split("\n## ")[0]
    n["trace_rows"] = fmt(len([l for l in tr.split("\n") if l.startswith("| ") and not l.startswith("| ช่วง")]))
    # ---------- ตัวอย่างเดินเรื่อง กรณี A (เรซูเมสังเคราะห์) ----------
    ra = os.path.join(ROOT, "evidence", "run_local", "case_A")
    da = pd.read_csv(os.path.join(ra, "decisions.csv")); pa = pd.read_csv(os.path.join(ra, "plan_items.csv")); sa = J("evidence", "run_local", "case_A", "summary.json")
    vc = da.final_status.value_counts()
    n.update(cA_ev=fmt(int(vc.get("evidenced", 0))), cA_pa=fmt(int(vc.get("partially", 0))), cA_mi=fmt(int(vc.get("missing", 0))),
             cA_gaps=fmt(sa["gaps"]), cA_claims=fmt(sa["n_claims"]), cA_overcap=fmt(sa["uncovered_over_capacity"]), cA_pii=fmt(sa["pii_masked"]),
             cA_Hmax=f"{sa['Hmax']:.1f}", cA_run_id=sa["run_id"])
    pr = da[da.requirement_id == "REQ-R01-2.B.3.e"].iloc[0]
    n.update(cA_prog_s=fmt(int(pr.evidence_char_start)), cA_prog_e=fmt(int(pr.evidence_char_end)), cA_prog_agree=f"{pr.agreement_level:.2f}")
    t = ["| ลำดับ | รายการเรียนรู้ | ชั่วโมง | ชั่วโมงสะสม | ช่องว่างที่ครอบคลุมเพิ่ม |", "|---|---|---|---|---|"]
    for r in pa.itertuples(): t.append(f"| {r.rank} | {r.title} ({r.item_id}) | {r.estimated_hours:,.0f} | {r.cumulative_hours:,.0f} | {r.n_new_requirements} |")
    n["cA_plan_table"] = "\n".join(t)
    t = ["| รายการ | กรณี A | กรณี B | กรณี C | กรณี D |", "|---|---|---|---|---|"]
    lab = [("อาชีพเป้าหมาย", None), ("โมเดลที่ใช้ได้ (m)", "m"), ("ข้อที่ระบบสรุปได้ จาก 30", "decided"), ("ข้อที่ตรงเฉลย จากข้อที่สรุปได้", "correct"),
           ("คะแนน R", "R"), ("R ถ้า R3 ใช้คำซ้ำอย่างเดียว", "Rlex"), ("สัดส่วน C", "C"), ("ข้อสรุปที่ไม่ผ่านเกณฑ์ตรวจหลักฐาน", "U"),
           ("ข้อความที่ส่งให้โมเดลอื่นตรวจความหมาย", "checks"), ("เสียงที่ตรวจความหมายไม่ได้", "unverified"), ("quote ที่ซ่อมรูปคำ", "repaired"),
           ("ฐานขั้นต่ำ R5/R6", "floors"), ("ดัชนีงานหลัก T", "T"), ("เทคโนโลยีที่ตลาดต้องการ H", "H"),
           ("รายการในแผน", "items"), ("ชั่วโมงของแผน", "hours"), ("ความครอบคลุมช่องว่างของแผน", "gapcov")]
    roles_ = {k: J("synthetic", f"case_{k}", "meta.json")["role_id"] for k in "ABCD"}
    for th, key in lab:
        t.append(f"| {th} | " + " | ".join(roles_[k] if key is None else n[f"c{k}_{key}"] for k in "ABCD") + " |")
    n["synthetic_table"] = "\n".join(t)
    # ---------- ตารางที่สร้างจากไฟล์ข้อมูล ----------
    R = J("data", "roles.json")["roles"]; rq = pd.read_csv(os.path.join(ROOT, "data", "requirements.csv"), dtype=str, keep_default_na=False)
    TRK = {"software": "ซอฟต์แวร์", "data": "ข้อมูล", "analytics": "วิเคราะห์ธุรกิจ", "security": "ความมั่นคงปลอดภัย", "network": "เครือข่าย", "cloud": "คลาวด์", "management": "บริหาร"}
    t = ["| รหัส | อาชีพเป้าหมาย | รหัส SOC | สายงาน | การเทียบรหัส |", "|---|---|---|---|---|"]
    for r in R: t.append(f"| {r['role_id']} | {r['role_name_th']} | {r['soc_code']} | {TRK.get(r['track'], r['track'])} | {'ตรงรหัส' if r['mapping_type'] == 'exact' else 'ใกล้เคียง'} |")
    n["roles_table"] = "\n".join(t); n["roles_proxy"] = fmt(sum(r["mapping_type"] != "exact" for r in R)); n["roles_proxy_ids"] = " ".join(r["role_id"] for r in R if r["mapping_type"] != "exact")
    t = ["| รหัส | อาชีพเป้าหมาย | ชื่อใน O*NET | เหตุผลของการเทียบ |", "|---|---|---|---|"]
    for r in R:
        if r["mapping_type"] != "exact": t.append(f"| {r['role_id']} {r['soc_code']} | {r['target_role']} | {r['onet_title']} | {term_th(r['mapping_rationale_th'])} |")
    n["soc_proxy_table"] = "\n".join(t)
    dom = rq.domain.value_counts()
    t = ["| โดเมน | กลุ่มรหัสใน O*NET | จำนวนข้อกำหนดอ้างอิง | สัดส่วน |", "|---|---|---|---|"]
    code = {"Work Activities": "4.A", "Essential Skills": "2.A", "Transferable Skills": "2.B", "Knowledge": "2.C"}
    for d_ in ["Work Activities", "Essential Skills", "Transferable Skills", "Knowledge"]: t.append(f"| {d_} | {code[d_]} | {int(dom[d_]):,} | {dom[d_] / len(rq) * 100:.1f}% |")
    t.append(f"| รวม | | {len(rq):,} | 100.0% |"); n["domain_table"] = "\n".join(t)
    n.update({f"dom_{k.split()[0].lower()}": fmt(int(dom[k])) for k in code})
    r1 = rq[rq.role_id == "R01"].copy(); r1["rk"] = r1.rank_in_role.astype(int); r1 = r1.sort_values("rk")
    pick = pd.concat([r1[r1.domain == d_].head(2) for d_ in code]).sort_values("rk")
    t = ["| รหัสข้อกำหนดอ้างอิง | โดเมน | องค์ประกอบ | IM | น้ำหนัก | ตัวอย่างคำพ้อง |", "|---|---|---|---|---|---|"]
    for r in pick.itertuples(): t.append(f"| {r.requirement_id} | {r.domain} | {r.element_name} | {float(r.importance_im):.2f} | {float(r.weight_renormalized):.4f} | {', '.join(r.element_aliases.split('|')[:3])} |")
    n["req_r01_table"] = "\n".join(t)
    ws = [r["weight_share_of_pool"] for r in R]; n["wsp_min"], n["wsp_max"] = f"{min(ws):.4f}", f"{max(ws):.4f}"
    SH = J("config", "sheets.json")["tabs"]
    GRP = {"operational": "ผลการทำงาน", "evaluation": "การประเมิน", "reference": "ข้อมูลอ้างอิง", "google_forms": "Google Forms เขียน"}
    USE = {"runs": "หนึ่งแถวต่องาน สถานะและสรุปผล", "ocr_results": "บริการอ่านข้อความ จำนวนจุดที่ปิดบัง ค่าแฮช", "model_calls": "การเรียกโมเดลทุกครั้งรวมครั้งที่ล้ม",
           "findings": "ข้อสรุปรายโมเดลและผลกฎ R2 R3 (ชั้นคำซ้ำและผู้ตรวจ)", "decisions": "สถานะสุดท้ายรายข้อกำหนดอ้างอิงและหลักฐาน", "role_task_decisions": "สถานะของงานหลักของอาชีพ 8 งาน", "plan_items": "รายการในแผนตามลำดับ", "deliveries": "ผลการส่งรายงาน",
           "audit_log": "เหตุการณ์ของระบบ", "ground_truth": "ชุดคำตอบอ้างอิงของผู้วิจัยและผลให้รหัสซ้ำ", "pathway_review": "ผลตรวจแผนของผู้ประเมิน",
           "ref_roles": "อาชีพ 20 อาชีพ", "ref_requirements": "ข้อกำหนดอ้างอิง 600 ข้อพร้อมคำพ้อง", "ref_corpus": "คลังรายการเรียนรู้", "ref_mappings": "ความเชื่อมโยงพร้อมสถานะการตรวจ",
           "form_responses": "คำตอบแบบฟอร์มรับเรซูเม", "evaluation_responses": "คำตอบแบบประเมินของผู้เข้าร่วม"}
    t = ["| แท็บ | กลุ่ม | คอลัมน์ | เก็บอะไร |", "|---|---|---|---|"]
    for k, v in SH.items(): t.append(f"| {k} | {GRP.get(v['group'], v['group'])} | {len(v['columns'])} | {USE.get(k, '')} |")
    n["tabs_table"] = "\n".join(t); n["tabs_total"] = fmt(len(SH)); n["tabs_operational"] = fmt(sum(v["group"] == "operational" for v in SH.values()))
    t = []
    for k, v in SH.items():
        t.append(f"**แท็บ {k}** ({GRP.get(v['group'], v['group'])} · เขียนแบบ {v['write_mode']}) คอลัมน์: " + ", ".join(v["columns"]))
    n["data_dictionary"] = "\n\n".join(t)
    PC = J("config", "project.json"); MC = J("config", "models.json")["defaults"]
    rowsC = [("requirements_per_role", PC["requirements_per_role"], "ข้อกำหนดอ้างอิงต่ออาชีพ"), ("max_file_bytes", f"{PC['max_file_bytes']:,}", "ขนาดไฟล์สูงสุด (ไบต์)"), ("max_pages", PC["max_pages"], "จำนวนหน้าสูงสุด"),
             ("text_layer_min_chars", PC["text_layer_min_chars"], "อักขระขั้นต่ำที่ถือว่า PDF มีชั้นข้อความ"), ("theta", PC["theta"], "เกณฑ์คะแนน ov ของกฎ R3"), ("overlap_denominator_cap", PC["overlap_denominator_cap"], "เพดานตัวหารของ ov"),
             ("alias_min_length", PC["alias_min_length"], "ความยาวคำพ้องขั้นต่ำ (อักขระ)"), ("r3_mode", PC["r3_mode"], "R3 สองชั้น: คำซ้ำแล้วจึงให้โมเดลอื่นตรวจความหมาย"),
             ("r3_stemming", "true" if PC["r3_stemming"] else "false", "ตัดคำต่อท้ายก่อนนับคำซ้ำ"), ("r2_repair_min_similarity", PC["r2_repair_min_similarity"], "สัดส่วนคำที่ต้องตรงเมื่อซ่อม quote"),
             ("max_quotes_per_claim", PC["max_quotes_per_claim"], "ข้อความอ้างอิงสูงสุดต่อข้อ"), ("role_tasks_per_role", PC["role_tasks_per_role"], "งานหลักต่ออาชีพสำหรับดัชนี T"),
             ("plan_experienced_years", PC["plan_experienced_years"], "ปีประสบการณ์ที่ไม่ใช้รายการระดับเริ่มต้นกับข้อที่มีหลักฐานบางส่วน"), ("min_usable_models", PC["min_usable_models"], "โมเดลที่ใช้ได้ขั้นต่ำ"), ("weeks_per_month", PC["weeks_per_month"], "สัปดาห์ต่อเดือนในสมการ Hmax"),
             ("allowed_months", " / ".join(map(str, PC["allowed_months"])), "กรอบเวลาที่เลือกได้ (เดือน)"), ("max_hours_per_week", PC["max_hours_per_week"], "ชั่วโมงต่อสัปดาห์สูงสุด"), ("plan_strategy", PC["plan_strategy"], "วิธีเลือกรายการเรียนรู้"),
             ("min_approved_share_of_L1", PC["min_approved_share_of_L1"], "สัดส่วน L1 ที่ต้องผ่านตรวจขั้นต่ำ"), ("retention_days", PC["retention_days"], "วันเก็บข้อมูลหลังส่งผล"),
             ("temperature", MC["temperature"], "ค่าความสุ่มของโมเดล (รอทดสอบเชื่อมต่อ)"), ("max_output_tokens", f"{MC['max_output_tokens']:,}", "ความยาวผลตอบกลับสูงสุดของการวิเคราะห์ (token)"),
             ("verifier_max_output_tokens", f"{MC['verifier_max_output_tokens']:,}", "ความยาวผลตอบกลับสูงสุดของการตรวจความหมาย (token)"), ("timeout_ms", f"{MC['timeout_ms']:,}", "เวลารอต่อการเรียก (มิลลิวินาที)"),
             ("max_attempts", MC["max_attempts"], "จำนวนครั้งที่เรียกซ้ำเมื่อ 429 หรือหมดเวลา"), ("retry_backoff_ms", " / ".join(f"{x:,}" for x in MC["retry_backoff_ms"]), "เวลารอก่อนเรียกซ้ำครั้งที่ 1 และ 2 (มิลลิวินาที)")]
    t = ["| พารามิเตอร์ | ค่า | ความหมาย |", "|---|---|---|"] + [f"| {a} | {b} | {c} |" for a, b, c in rowsC]
    n["config_table"] = "\n".join(t)
    n["max_output_tokens"] = f"{MC['max_output_tokens']:,}"; n["verifier_max_tokens"] = f"{MC['verifier_max_output_tokens']:,}"
    n["prompt_version"] = PC["prompt_version"]; n["verifier_prompt_version"] = PC["verifier_prompt_version"]; n["rules_version"] = PC["rules_version"]
    n["r2_repair_pct"] = fmt(PC["r2_repair_min_similarity"] * 100); n["plan_experienced_years"] = fmt(PC["plan_experienced_years"])
    n["role_tasks_total"] = fmt(len(pd.read_csv(os.path.join(ROOT, "data", "role_tasks.csv")))); n["role_tasks_per_role"] = fmt(PC["role_tasks_per_role"])
    n["role_tech_total"] = fmt(len(pd.read_csv(os.path.join(ROOT, "data", "role_technology.csv")))); n["skill_links_total"] = fmt(len(pd.read_csv(os.path.join(ROOT, "data", "skill_links.csv"))))
    gs = J("evidence", "r3_gold", "summary_03OCT26.json")
    n["real_claims"] = fmt(gs["claims_total"]); n["real_r3_rejected"] = fmt(gs["r3_rejected_in_demo"])
    n["real_rec_lex"] = f"{gs['real']['r3_lexical_v1']['recall']:.2f}"; n["real_rec_stem"] = f"{gs['real']['r3a_stemmed']['recall']:.2f}"; n["real_prec_lex"] = f"{gs['real']['r3_lexical_v1']['precision']:.2f}"
    n["real_R19"] = fmt(gs["demo_scores_03OCT26"]["R19_it_pm"]); n["real_R15"] = fmt(gs["demo_scores_03OCT26"]["R15_network"])
    n["real_R19_r2only"] = f"{gs['replay_R']['R19']['r2_only']:.1f}"; n["real_R15_r2only"] = f"{gs['replay_R']['R15']['r2_only']:.1f}"
    n["syn_pairs"] = fmt(gs["synthetic_pairs"]); n["syn_rec_lex"] = f"{gs['synthetic']['r3_lexical_v1']['recall']:.2f}"; n["syn_rec_hyb"] = f"{gs['synthetic']['r3_hybrid']['recall']:.2f}"
    n["syn_prec_hyb"] = f"{gs['synthetic']['r3_hybrid']['precision']:.2f}"; n["role_shared_19_15"] = fmt(gs["role_overlap"]["R19_R15_shared"]); n["role_shared_mean_pct"] = fmt(gs["role_overlap"]["mean_shared_fraction_all_pairs"] * 100)
    n["theta"] = str(PC["theta"]); n["retention_days"] = fmt(PC["retention_days"]); n["deletion_contact"] = PC["deletion_contact"]
    wfj = J("workflows", J("workflows", "manifest.json")["import"]); secn = {}
    for i, s_ in enumerate(wfj["meta"]["is68"]["sections"], 1):
        for x in s_["nodes"]: secn[x] = f"{i} {s_['th']}"
    TY = {"code": "Code", "googleSheets": "Google Sheets", "googleSheetsTrigger": "Google Sheets Trigger", "if": "IF", "splitInBatches": "Loop Over Items", "googleDrive": "Google Drive",
          "extractFromFile": "Extract From File", "httpRequest": "HTTP Request", "merge": "Merge", "gmail": "Gmail", "errorTrigger": "Error Trigger"}
    t = ["| ช่วง | โหนด | ชนิด | สิ่งที่โหนดอ่านหรือเขียน |", "|---|---|---|---|"]
    for nd in wfj["nodes"]:
        if nd["type"].endswith("stickyNote"): continue
        ty = nd["type"].split(".")[-1]; pr = nd.get("parameters", {}); what = ""
        if ty == "code":
            import re as _r; m_ = _r.search(r"NODE GLUE: (workflows/src/[\w.]+)", pr.get("jsCode", "")); what = m_.group(1).replace("workflows/src/", "") if m_ else ""
            if "ENGINE BEGIN" in pr.get("jsCode", ""): what += " + engine.js"
        elif ty in ("googleSheets",): what = f"แท็บ {pr['sheetName']['value']} ({pr['operation']})"
        elif ty == "googleSheetsTrigger": what = "แท็บ form_responses (แถวใหม่ ทุก 1 นาที)"
        elif ty == "httpRequest" and "documentai" in pr.get("url", ""): what = "Google Document AI processor (:process)"
        elif ty == "httpRequest": what = pr.get("url", "").replace("=", "", 1).split("?")[0].split("{{")[0][:60] or "LOCAL_OCR_URL"
        elif ty == "if":
            import re as _r; lv = pr["conditions"]["conditions"][0]["leftValue"]; m_ = _r.search(r"\$\('([^']+)'\)\.first\(\)\.json\.(\w+)", lv)
            what = "เงื่อนไข " + (f"{m_.group(2)} (จาก {m_.group(1)})" if m_ else lv.replace("={{ $json.", "").replace(" }}", ""))
        elif ty == "googleDrive": what = pr.get("operation", "")
        elif ty == "gmail": what = "ส่งอีเมล"
        elif ty == "merge": what = "รอทุกขาเข้า"
        elif ty == "splitInBatches": what = f"ทีละ {pr.get('batchSize')} งาน"
        elif ty == "extractFromFile": what = "ชั้นข้อความของ PDF"
        t.append(f"| {secn.get(nd['name'], '')} | {nd['name']} | {TY.get(ty, ty)} | {what} |")
    n["wf_node_table"] = "\n".join(t)
    rows = ["| ไฟล์ | จำนวนแถว | SHA-256 |", "|---|---|---|"]
    for f, v in man["files"].items(): rows.append(f"| {f} | {v['rows']:,} | {v['sha256']} |")
    n["manifest_table"] = "\n".join(rows)
    with open(os.path.join(ROOT, "book", "numbers.json"), "w", encoding="utf-8") as fh:
        json.dump(n, fh, ensure_ascii=False, indent=1); fh.write("\n")
    print(f"numbers.json · {len(n)} ค่า · corpus {n['corpus_items']} · map {n['map_total']} · passed {n['map_passed']} · req {n['req_covered']}/600 · tests {n['tests_total']}")


if __name__ == "__main__":
    main()
