# -*- coding: utf-8 -*-
"""
build_corpus.py  (IS 68076026 · Final_IS · 01OCT26)

สร้างคลังรายการเรียนรู้และความเชื่อมโยงจากคลัง v1.3 ที่กู้ได้ (01SEP26) ตามลำดับที่ทำซ้ำได้

  v1.3 (กู้ได้)  ──► v1.4-R  (ตรวจ URL ตาม data/url_manual_check.csv)                  DEC-29
                 ──► v1.5-R  (DEC-18 foundation track 6 รายการ + DEC-19 promote 17 คู่)  DEC-29

ผลลัพธ์ (data/):
  corpus.csv, mappings.csv (mapping_status = pending_review ทุกแถว ตาม 3.3.2),
  corpus_change_log.csv, corpus_gap_request.csv, url_manual_check.csv (ถ้ายังไม่มี)

หลักที่ยึด:
  - ห้ามเดา URL (DEC-16) · รายการที่ยังไม่ได้ตรวจคงสถานะ pending_verification และระบบจะไม่นำไปแนะนำ
  - รายการที่ผู้วิจัยคัดเองจับคู่ L1 เท่านั้น ไม่ใช้กฎ L2 (R22-sup, DEC-18)
  - item.role_id == mapping.role_id ทุกแถว · L1 ต้องตรงกับ competency_ids_l1 (กฎ C4)

ใช้:  python scripts/build_corpus.py --src-dir <โฟลเดอร์ 03_corpus ที่กู้ได้> [--version v1.5] [--close-r14-repair]
"""
import argparse, csv, json, os, sys
import pandas as pd

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA = os.path.join(ROOT, "data")
TODAY = "2026-10-01"
V14 = "CORPUS-IS68076026-v1.4R-01OCT26"
V16 = "CORPUS_IS68076026-v1.6-03OCT26"  # DEC-62 ปรับคลังเป็นรุ่นปัจจุบัน + นับรายการใหม่ 14 รายการ
V15 = "CORPUS_IS68076026-v1.5-01OCT26"  # DEC-43 (เดิม CORPUS-IS68076026-v1.5R-01OCT26 ตาม DEC-31)

# ---------- DEC-18 foundation track (URL เปิดตรวจแล้ว 19SEP26 และตรวจซ้ำ 01OCT26) ----------
FOUNDATION = [
    dict(key="F1", title="Write Professional Emails in English", provider="Georgia Institute of Technology",
         url="https://www.coursera.org/learn/professional-emails-english", hours=20,
         hours_note="หน้าคอร์สระบุ 2 สัปดาห์ x 10 ชม./สัปดาห์ = 20 ชม.", elements=["2.C.7.a"],
         outcomes="เขียนอีเมลภาษาอังกฤษเชิงวิชาชีพได้ถูกต้องตามรูปแบบ น้ำเสียง และวัตถุประสงค์",
         skills="Professional email writing|Business English|Tone and register"),
    dict(key="F2", title="Understanding Research Methods", provider="University of London",
         url="https://www.coursera.org/learn/research-methods", hours=6,
         hours_note="หน้าคอร์สระบุ 6 ชม.", elements=["4.A.1.a.1", "4.A.2.a.2", "4.A.1.b.1", "4.A.2.a.4"],
         outcomes="ค้นหา คัดกรอง และประมวลสารสนเทศอย่างเป็นระบบ ตั้งคำถามและเลือกวิธีวิเคราะห์ข้อมูลได้เหมาะสม",
         skills="Literature search|Research design|Information processing|Data analysis basics"),
    dict(key="F3", title="Learning How to Learn: Powerful mental tools to help you master tough subjects",
         provider="Deep Teaching Solutions", url="https://www.coursera.org/learn/learning-how-to-learn", hours=20,
         hours_note="หน้าคอร์สระบุ 2 สัปดาห์ x 10 ชม./สัปดาห์ = 20 ชม.",
         elements=["4.A.2.b.3", "2.A.2.b", "2.A.1.a"],
         outcomes="ใช้เทคนิคการเรียนรู้ด้วยตนเอง การอ่านเชิงรุก และการทบทวนเพื่อปรับความรู้ให้ทันสมัยอย่างต่อเนื่อง",
         skills="Self-directed learning|Active reading|Spaced repetition"),
    dict(key="F4", title="Critical Thinking Skills for the Professional", provider="University of California, Davis",
         url="https://www.coursera.org/learn/critical-thinking-skills-for-professionals", hours=9,
         hours_note="หน้าคอร์สระบุ 9 ชม.", elements=["2.A.2.a", "2.B.2.i", "4.A.2.b.1"],
         outcomes="วิเคราะห์ปัญหา ประเมินทางเลือก และตัดสินใจอย่างมีเหตุผลในบริบทการทำงาน",
         skills="Critical thinking|Problem solving|Decision making"),
    dict(key="F5", title="Work Smarter, Not Harder: Time Management for Personal & Professional Productivity",
         provider="University of California, Irvine", url="https://www.coursera.org/learn/work-smarter-not-harder",
         hours=10, hours_note="หน้าคอร์สระบุ 1 สัปดาห์ x 10 ชม./สัปดาห์ = 10 ชม.", elements=["4.A.2.b.6", "4.A.2.b.5"],
         outcomes="จัดลำดับความสำคัญของงาน วางแผนและจัดตารางเวลาทำงานได้อย่างเป็นระบบ",
         skills="Time management|Prioritization|Scheduling"),
    dict(key="F6", title="Project Planning: Putting It All Together", provider="Google",
         url="https://www.coursera.org/learn/project-planning-google", hours=21,
         hours_note="หน้าคอร์สระบุ 21 ชม. (5 โมดูล)", elements=["4.A.1.b.3"],
         outcomes="ประมาณการเวลา ต้นทุน และทรัพยากรของงาน จัดทำแผนโครงการที่วัดผลได้",
         skills="Estimation|Project planning|Budgeting|Risk management"),
]

# ---------- DEC-19 promote L2 -> L1 (role, element, item_id, เหตุผล) · ชื่อรายการดูใน corpus.csv ----------
PROMOTE = [
    ("R07", "2.C.3.b", "CRT-R07-08", "ออกแบบและปรับแต่งระบบ LLM ระดับโปรดักชัน"),
    ("R10", "2.C.3.b", "CRS-R10-02", "ออกแบบสคีมาและโครงสร้างจัดเก็บข้อมูล"),
    ("R11", "2.C.3.b", "CRT-R11-01", "ออกแบบสถาปัตยกรรมความมั่นคงปลอดภัย"),
    ("R12", "2.C.3.b", "CRS-R12-06", "หลักการทำงานของกลไกป้องกันเชิงเทคนิค"),
    ("R13", "2.C.3.b", "CRS-R13-05", "เข้าใจกลไกทางเทคนิคของระบบเป้าหมายจึงออกแบบการทดสอบได้"),
    ("R10", "2.C.9.a", "CRT-R10-10", "VPC การแบ่งซับเน็ต และการเชื่อมต่อระหว่างบริการ"),
    ("R16", "2.C.9.a", "CRS-R16-08", "เครือข่ายบนคลาวด์และการกำหนดเส้นทาง"),
    ("R17", "2.C.9.a", "CRS-R17-05", "ตั้งค่าเครือข่ายระดับ OS และวินิจฉัยการเชื่อมต่อ"),
    ("R02", "2.B.3.a", "CRS-R02-02", "เดินครบวงจรจากรับความต้องการไปถึงออกแบบระบบ"),
    ("R04", "4.A.4.b.1", "CRS-R04-10", "จัดคิวงาน มอบหมายงาน และติดตามความคืบหน้าของทีม"),
    ("R17", "2.B.3.g", "CRS-R17-02", "กำหนด SLI/SLO และเฝ้าระวังสถานะบริการต่อเนื่อง"),
    ("R17", "2.B.3.m", "CRS-R17-06", "terraform validate/plan และการตรวจนโยบายก่อนขึ้นระบบจริง"),
    ("R14", "4.A.4.c.1", "CRT-R14-10", "บริหารแฟ้มคดี รักษาสายการครอบครองพยานหลักฐาน และจัดทำรายงาน"),
    ("R04", "4.A.2.a.1", "CRS-R04-02", "ประเมินคุณภาพซอฟต์แวร์ด้วยเกณฑ์และกรณีทดสอบ"),
    ("R07", "4.A.2.a.1", "CRS-R07-10", "ประเมินคุณภาพผลลัพธ์ของโมเดลด้วยเกณฑ์และชุดทดสอบ"),
    ("R18", "4.A.2.a.1", "CRT-R18-06", "IREB กำหนดเกณฑ์คุณภาพของข้อกำหนดและวิธีตรวจตามเกณฑ์นั้น"),
    ("R20", "4.A.2.a.1", "CRS-R20-06", "กำหนดระดับบริการและประเมินคุณภาพบริการที่ส่งมอบ"),
]
R14_REPAIR = ("R14", "4.A.3.b.5", "CRS-R14-04", "สวิตช์ CLOSE_R14_REPAIR (DEC-19) ตามนิยามกฎ R19-fix")

MAP_COLS = ["map_id", "item_id", "item_type", "role_id", "requirement_id", "domain", "element_id", "element_name",
            "importance_im", "weight_renormalized", "coverage_layer", "coverage_strength", "mapping_rule",
            "mapping_method", "mapping_status"]


def rd(p):
    return pd.read_csv(p, encoding="utf-8-sig", dtype=str, keep_default_na=False)


def recompute_derived(corpus, maps, req):
    """คำนวณคอลัมน์อนุพันธ์ของคลังใหม่ทั้งหมดจาก mappings + requirements"""
    w = req.set_index("requirement_id")
    weight = w.weight_renormalized.astype(float)
    name = w.element_name
    dom = w.domain
    g_all = maps.groupby("item_id").requirement_id.apply(list).to_dict()
    g_l1 = maps[maps.coverage_layer == "L1_researcher_tagged"].groupby("item_id").requirement_id.apply(list).to_dict()
    core = set(req[req.selected_reason == "domain_quota"].requirement_id)
    rows = []
    for _, it in corpus.iterrows():
        a = sorted(set(g_all.get(it.item_id, [])))
        l1 = sorted(set(g_l1.get(it.item_id, [])))
        it = it.copy()
        it["competency_ids"] = "|".join(a)
        it["competency_ids_l1"] = "|".join(l1)
        it["competency_names"] = "|".join(sorted({name[r] for r in a}))
        it["n_competencies"] = str(len(a))
        it["n_competencies_l1"] = str(len(l1))
        it["domains_covered"] = "|".join(sorted({dom[r] for r in a}))
        wc = sum(weight[r] for r in a); wl = sum(weight[r] for r in l1)
        it["weight_covered"] = f"{wc:.6f}"; it["weight_covered_l1"] = f"{wl:.6f}"
        it["expected_readiness_gain_pct"] = f"{wc*100:.2f}"
        it["expected_readiness_gain_core_pct"] = f"{wl*100:.2f}"
        rows.append(it)
    return pd.DataFrame(rows)[corpus.columns]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src-dir", required=True)
    ap.add_argument("--version", default="v1.5", choices=["v1.4", "v1.5"])
    ap.add_argument("--close-r14-repair", action="store_true")
    ap.add_argument("--foundation-uncovered-only", action="store_true",
                    help="ย้อนกลับ DEC-45: map foundation เฉพาะข้อที่ยังไม่มี L1 (แบบ DEC-18 เดิม)")
    ap.add_argument("--no-updates", action="store_true", help="ย้อนกลับ DEC-62: ไม่อ่าน data/corpus_updates_03OCT26.csv")
    ap.add_argument("--no-additions", action="store_true", help="ย้อนกลับ DEC-46: ไม่อ่าน data/corpus_additions.csv")
    a = ap.parse_args()

    req = rd(os.path.join(DATA, "requirements.csv"))
    corpus = rd(os.path.join(a.src_dir, "corpus_master_v13_01SEP26.csv"))
    maps = rd(os.path.join(a.src_dir, "item_competency_map_v13_01SEP26.csv"))
    assert (len(corpus), len(maps)) == (499, 6780), "ไม่ใช่คลัง v1.3 ที่คาดไว้"
    log = []

    # ---------------- v1.4R: URL verification ----------------
    chk_path = os.path.join(DATA, "url_manual_check.csv")
    if not os.path.exists(chk_path):
        pend = corpus[corpus.verification_status != "verified"]
        rows = []
        for url, g in pend.groupby("source_url"):
            rows.append(dict(source_url=url, item_ids="|".join(g.item_id), title=g.title.iloc[0],
                             provider=g.provider.iloc[0], n_items=len(g), auto_fetch_01OCT26="",
                             researcher_result="", corrected_url="", checked_by="", checked_at="", note=""))
        pd.DataFrame(rows).to_csv(chk_path, index=False, encoding="utf-8", lineterminator="\n")
    chk = rd(chk_path)
    for _, c in chk.iterrows():
        res = c.researcher_result.strip().upper()
        ids = c.item_ids.split("|")
        if res in ("LIVE", "OK", "VERIFIED"):
            new_url = c.corrected_url.strip() or c.source_url
            assert new_url.startswith("https://"), new_url
            m = corpus.item_id.isin(ids)
            corpus.loc[m, "source_url"] = new_url
            corpus.loc[m, "verification_status"] = "verified"
            corpus.loc[m, "verification_date"] = c.checked_at or TODAY
            corpus.loc[m, "verified_by"] = c.checked_by or "ผู้วิจัย"
            for i in ids: log.append(dict(version=V14, item_id=i, requirement_id="", change="url_verified",
                                          detail=new_url, decision="DEC-16/DEC-29"))
        elif res in ("DEAD", "REMOVE", "WRONG"):
            for i in ids: log.append(dict(version=V14, item_id=i, requirement_id="", change="url_failed_kept_pending",
                                          detail=c.note, decision="DEC-16/DEC-29"))
    corpus["corpus_version"] = V14

    if a.version == "v1.5":
        # ---------------- DEC-18 foundation ----------------
        L1 = maps[maps.coverage_layer == "L1_researcher_tagged"]
        covered = set(L1.requirement_id)
        unc = req[~req.requirement_id.isin(covered)]
        roles = json.load(open(os.path.join(DATA, "roles.json"), encoding="utf-8"))["roles"]
        rinfo = {r["role_id"]: r for r in roles}
        template = corpus.iloc[0].copy()
        new_items, new_maps = [], []
        for f in FOUNDATION:
            # DEC-45: ใช้กับทุกอาชีพที่มีองค์ประกอบตามรายการของ DEC-18 (เดิมเฉพาะข้อที่ยังไม่มี L1)
            tgt = (unc if a.foundation_uncovered_only else req)[
                (unc if a.foundation_uncovered_only else req).element_id.isin(f["elements"])]
            for rid, g in tgt.groupby("role_id"):
                r = rinfo[rid]
                it = template.copy()
                for k in it.index: it[k] = ""
                it.update(dict(item_id=f"CRS-{rid}-{f['key']}", item_type="course", role_id=rid,
                               role_name_th=r["role_name_th"], target_role=r["target_role"], soc_code=r["soc_code"],
                               track=r["track"], mapping_type=r["mapping_type"], priority_rank="90",
                               title=f["title"], provider=f["provider"], provider_type="mooc_platform",
                               platform="Coursera", source_url=f["url"], credential_type="single_course",
                               level="Beginner", difficulty_1_5="1", delivery_mode="self-paced online",
                               language="English", learning_outcomes_th=f["outcomes"], skills_taught=f["skills"],
                               tools_technologies="", produces_portfolio_artifact="no",
                               estimated_hours=str(f["hours"]), cost_category="free", cost_amount_usd="0",
                               prerequisites="ไม่มี", phase="foundation", recommendation_mode="course_only|both",
                               global_recognition_tier="2", verification_status="verified",
                               verification_date="2026-09-19",
                               verified_by="ผู้วิจัยเปิดหน้าคอร์สตรวจ 19 ก.ย. 2569 (DEC-18) · ตรวจซ้ำ 1 ต.ค. 2569: ชื่อ ผู้ให้บริการ และชั่วโมงตรง",
                               researcher_notes=f"foundation track {f['key']} · {f['hours_note']} · planning_estimate_not_provider_verified",
                               corpus_version=V15, snapshot_version="ONET31.0-IS68076026-v1.0",
                               batch="v1.5_foundation"))
                new_items.append(it)
                for _, q in g.iterrows():
                    new_maps.append(dict(map_id=f"{it.item_id}|{q.requirement_id}", item_id=it.item_id,
                                         item_type="course", role_id=rid, requirement_id=q.requirement_id,
                                         domain=q.domain, element_id=q.element_id, element_name=q.element_name,
                                         importance_im=q.importance_im, weight_renormalized=q.weight_renormalized,
                                         coverage_layer="L1_researcher_tagged", coverage_strength="supporting",
                                         mapping_rule="R24-foundation", mapping_method="foundation_track",
                                         mapping_status="pending_review"))
                    was = q.requirement_id in covered
                    log.append(dict(version=V15, item_id=it.item_id, requirement_id=q.requirement_id,
                                    change="foundation_L1_extended" if was else "foundation_L1_added",
                                    detail=f["title"], decision="DEC-45" if was else "DEC-18"))
        corpus = pd.concat([corpus, pd.DataFrame(new_items)], ignore_index=True)
        maps = pd.concat([maps, pd.DataFrame(new_maps)[MAP_COLS]], ignore_index=True)

        # ---------------- DEC-46 coverage track (data/corpus_additions.csv) ----------------
        # รายการใหม่ที่ Claude เปิดหน้าเว็บจริง (1 ต.ค. 2569) · เข้าคลังเมื่อผู้วิจัยกรอก researcher_result = LIVE เท่านั้น (DEC-16)
        # รายการที่ยังไม่ยืนยันไม่เข้าคลังเลย (ไม่กระทบเกณฑ์ 90% ของ DEC-21) · ผลถ้ายืนยันครบดูได้จาก scripts/coverage_diagnostics.py
        add_path = os.path.join(DATA, "corpus_additions.csv")
        if os.path.exists(add_path) and not a.no_additions:
            adds = rd(add_path)
            add_items, add_maps = [], []
            for _, f in adds.iterrows():
                confirmed = f.researcher_result.strip().upper() in ("LIVE", "OK", "VERIFIED")
                if not confirmed:
                    log.append(dict(version=V15, item_id=f"CRS-*-{f.key}", requirement_id="",
                                    change="coverage_item_pending_researcher", detail=f.title, decision="DEC-46"))
                    continue
                els = [e for e in f.elements.split("|") if e]
                tgt = req[req.element_id.isin(els)]
                for rid, g in tgt.groupby("role_id"):
                    r = rinfo[rid]
                    it = template.copy()
                    for k in it.index: it[k] = ""
                    it.update(dict(item_id=f"CRS-{rid}-{f.key}", item_type="course", role_id=rid,
                                   role_name_th=r["role_name_th"], target_role=r["target_role"], soc_code=r["soc_code"],
                                   track=r["track"], mapping_type=r["mapping_type"], priority_rank="95",
                                   title=f.title, provider=f.provider, provider_type="mooc_platform",
                                   platform=f.platform, source_url=f.source_url, credential_type="single_course",
                                   level="Beginner", difficulty_1_5="1", delivery_mode="self-paced online",
                                   language="English", learning_outcomes_th=f.learning_outcomes_th,
                                   skills_taught=f.skills_taught, tools_technologies="", produces_portfolio_artifact="no",
                                   estimated_hours=f.estimated_hours, cost_category=f.cost_category,
                                   cost_amount_usd=f.cost_amount_usd, prerequisites="ไม่มี", phase="foundation",
                                   recommendation_mode="course_only|both", global_recognition_tier="2",
                                   verification_status="verified", verification_date=f.researcher_checked_at or TODAY,
                                   verified_by=(f.note or "ผู้วิจัย (DEC-46)"),
                                   researcher_notes=f"coverage track {f.key} (DEC-46) · {f.hours_note} · Claude เปิดหน้า {f.claude_checked_at}: {f.claude_page_evidence}",
                                   corpus_version=V15, snapshot_version="ONET31.0-IS68076026-v1.0",
                                   batch="v1.5_coverage_track"))
                    add_items.append(it)
                    for _, q in g.iterrows():
                        add_maps.append(dict(map_id=f"{it.item_id}|{q.requirement_id}", item_id=it.item_id,
                                             item_type="course", role_id=rid, requirement_id=q.requirement_id,
                                             domain=q.domain, element_id=q.element_id, element_name=q.element_name,
                                             importance_im=q.importance_im, weight_renormalized=q.weight_renormalized,
                                             coverage_layer="L1_researcher_tagged", coverage_strength="supporting",
                                             mapping_rule="R25-coverage", mapping_method="coverage_track",
                                             mapping_status="pending_review"))
                        log.append(dict(version=V15, item_id=it.item_id, requirement_id=q.requirement_id,
                                        change="coverage_L1_added",
                                        detail=f.title, decision="DEC-46"))
            if add_items:
                corpus = pd.concat([corpus, pd.DataFrame(add_items)], ignore_index=True)
                maps = pd.concat([maps, pd.DataFrame(add_maps)[MAP_COLS]], ignore_index=True)

        # ---------------- DEC-19 promote ----------------
        todo = list(PROMOTE) + ([R14_REPAIR] if a.close_r14_repair else [])
        for rid, el, item_id, why in todo:
            m = ((maps.role_id == rid) & (maps.element_id == el) & (maps.coverage_layer == "L2_rule_augmented")
                 & (maps.item_id == item_id))
            hits = maps[m]
            assert len(hits) == 1, f"promote {rid} {el} {item_id}: พบ {len(hits)} แถว"
            ix = hits.index[0]
            maps.loc[ix, ["coverage_layer", "coverage_strength", "mapping_method"]] = [
                "L1_researcher_tagged", "supporting", "researcher_promoted"]
            log.append(dict(version=V15, item_id=maps.loc[ix, "item_id"], requirement_id=maps.loc[ix, "requirement_id"],
                            change="L2_to_L1_promoted", detail=why + f" (คง mapping_rule {maps.loc[ix,'mapping_rule']})",
                            decision="DEC-19"))
        corpus["corpus_version"] = V15

        # ---------------- DEC-62: ปรับคลังเป็นรุ่นปัจจุบัน (data/corpus_updates_03OCT26.csv) ----------------
        # กฎความสดใหม่: ใช้รุ่นที่มีผลถึง 30 พ.ย. 2569 · รุ่นที่มีผลหลังจากนั้นคงรุ่นเดิมและจดวันที่ไว้ใน researcher_notes
        upd_path = os.path.join(DATA, "corpus_updates_03OCT26.csv")
        if os.path.exists(upd_path) and not a.no_updates:
            upd = rd(upd_path)
            for _, u in upd.iterrows():
                m = (corpus.title == u.match_title) & (corpus.provider == u.match_provider)
                assert m.any(), f"DEC-62: ไม่พบรายการ {u.match_title} / {u.match_provider}"
                ids = list(corpus[m].item_id)
                old = f"{u.match_title} [{corpus.loc[m, 'exam_code'].iloc[0]}]"
                for col, val in (("title", u.new_title), ("provider", u.new_provider), ("exam_code", u.new_exam_code),
                                 ("source_url", u.new_url), ("platform", u.get("new_platform", "")),
                                 ("estimated_hours", u.get("new_hours", ""))):
                    if val: corpus.loc[m, col] = val
                if u.get("new_hours", ""):
                    corpus.loc[m, ["cost_category", "cost_amount_usd"]] = ["free_audit", "0"]
                    corpus.loc[m, "provider_type"] = "mooc_platform"
                tag = f"DEC-62 [{u.group}] " + " · ".join(filter(None, [u.effective, u.note_th])) + f" · ความมั่นใจ {u.confidence or '-'}"
                corpus.loc[m, "researcher_notes"] = corpus.loc[m, "researcher_notes"].map(lambda t: (t + " | " if t else "") + tag)
                corpus.loc[m, "verification_date"] = "2026-10-03"
                if u.group == "ก" and not u.new_title and u.confidence == "low":
                    corpus.loc[m, "verification_status"] = "pending_verification"
                for i in ids:
                    log.append(dict(version=V16, item_id=i, requirement_id="", change=f"update_group_{u.group}",
                                    detail=f"{old} -> {u.new_title or u.match_title} [{u.new_exam_code or '-'}]", decision="DEC-62"))
        corpus["corpus_version"] = V16

    maps["mapping_status"] = "pending_review"
    corpus = recompute_derived(corpus, maps, req)

    # ---------------- invariants ----------------
    ci = corpus.set_index("item_id")
    assert corpus.item_id.is_unique and maps.map_id.is_unique
    assert (maps.item_id.map(ci.role_id) == maps.role_id).all(), "C5 item.role_id != mapping.role_id"
    reqset = set(zip(req.role_id, req.requirement_id))
    assert all((r, q) in reqset for r, q in zip(maps.role_id, maps.requirement_id))
    l1 = maps[maps.coverage_layer == "L1_researcher_tagged"]
    for i, g in l1.groupby("item_id"):
        assert set(g.requirement_id) == set(filter(None, ci.loc[i, "competency_ids_l1"].split("|"))), f"C4 {i}"
    assert corpus.source_url.str.startswith("https://").all()

    # ---------------- gap request ----------------
    # ข้อกำหนดที่ยังไม่มีรายการ L1 ที่ verified รองรับ · คอลัมน์ proposed_items = รายการ coverage track ที่รอผู้วิจัยยืนยัน (DEC-46)
    ver = set(corpus[corpus.verification_status == "verified"].item_id)
    covered = set(l1[l1.item_id.isin(ver)].requirement_id)
    pend = l1[~l1.item_id.isin(ver)]
    prop = {}
    add_path = os.path.join(DATA, "corpus_additions.csv")
    if os.path.exists(add_path) and not a.no_additions:
        for _, f in rd(add_path).iterrows():
            if f.researcher_result.strip().upper() in ("LIVE", "OK", "VERIFIED"): continue
            for _, q in req[req.element_id.isin(f.elements.split("|"))].iterrows():
                prop[q.requirement_id] = "|".join(filter(None, [prop.get(q.requirement_id, ""), f.key]))
    gap = req[~req.requirement_id.isin(covered)]
    def why(q):
        if q.requirement_id in prop: return "มีรายการ coverage track รอผู้วิจัยยืนยันใน data/corpus_additions.csv"
        if q.requirement_id == "REQ-R14-4.A.3.b.5":
            return "ไม่มีรายการ verified ที่สอนการซ่อมบำรุงอุปกรณ์อิเล็กทรอนิกส์ (DEC-19)"
        if q.requirement_id in set(pend.requirement_id): return "มี L1 แต่รายการรอตรวจ URL (data/url_manual_check.csv)"
        return "ยังไม่มีรายการชั้น L1"
    gap_rows = [dict(requirement_id=q.requirement_id, role_id=q.role_id, element_id=q.element_id,
                     element_name=q.element_name, domain=q.domain, importance_im=q.importance_im,
                     rank_in_role=q.rank_in_role, selected_reason=q.selected_reason,
                     status="proposed" if q.requirement_id in prop else "open", reason=why(q),
                     proposed_items=prop.get(q.requirement_id, ""),
                     decision="DEC-46" if q.requirement_id in prop else "DEC-19") for _, q in gap.iterrows()]
    pd.DataFrame(gap_rows, columns=["requirement_id", "role_id", "element_id", "element_name", "domain",
                                    "importance_im", "rank_in_role", "selected_reason", "status", "reason",
                                    "proposed_items", "decision"]).to_csv(
        os.path.join(DATA, "corpus_gap_request.csv"), index=False, encoding="utf-8", lineterminator="\n")

    corpus.to_csv(os.path.join(DATA, "corpus.csv"), index=False, encoding="utf-8", lineterminator="\n")
    maps[MAP_COLS].to_csv(os.path.join(DATA, "mappings.csv"), index=False, encoding="utf-8", lineterminator="\n")
    pd.DataFrame(log, columns=["version", "item_id", "requirement_id", "change", "detail", "decision"]).to_csv(
        os.path.join(DATA, "corpus_change_log.csv"), index=False, encoding="utf-8", lineterminator="\n")

    hrs = corpus.estimated_hours.astype(float)
    print(json.dumps(dict(
        version=corpus.corpus_version.iloc[0], items=len(corpus),
        courses=int((corpus.item_type == "course").sum()), certs=int((corpus.item_type == "certification").sum()),
        verified=int((corpus.verification_status == "verified").sum()),
        mappings=len(maps), L1=len(l1), L2=int((maps.coverage_layer == "L2_rule_augmented").sum()),
        req_with_L1=len(covered), gap_open=len(gap), hours_mean=round(hrs.mean(), 1), hours_median=hrs.median(),
        hours_min=hrs.min(), hours_max=hrs.max(), items_lt20h=int((hrs < 20).sum()),
        free=int((corpus.cost_category == "free").sum())), ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
