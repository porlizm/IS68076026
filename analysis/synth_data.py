# -*- coding: utf-8 -*-
"""synth_data.py — ข้อมูลสังเคราะห์ 30 + 5 คนสำหรับซ้อมขั้นตอนวิเคราะห์ (ไม่ใช่ผลวิจัย ไม่ใช่ข้อมูลบุคคล)
สร้างแท็บ runs, decisions, ground_truth, plan_items, pathway_review, ref_corpus, evaluation_responses แบบกำหนดค่าได้ซ้ำ (seed)"""
import random

SEED = 68076026
ST = ["evidenced", "partially", "missing"]


def make_tables(n_main=30, n_pilot=5, seed=SEED):
    rnd = random.Random(seed)
    T = {k: [] for k in ["runs", "decisions", "ground_truth", "plan_items", "pathway_review", "ref_corpus", "evaluation_responses"]}
    for i in range(40):
        T["ref_corpus"].append(dict(item_id=f"ITEM-{i:03d}", title=f"Course {i}", provider="P", source_url=f"https://example.org/{i}", verification_status="verified"))
    cohort = []
    for p in range(n_main + n_pilot):
        rid = f"RUN-2026110{p // 10}0900{p % 10}0-{p:08x}"
        is_main = p < n_main
        if is_main: cohort.append(rid)
        T["runs"].append(dict(run_id=rid, stage="delivered", created_at=f"2026-11-{1 + p:02d}T09:00:00", role_id=f"R{1 + p % 20:02d}", file_id=f"F{p}", timeline_months="6", hours_per_week="10"))
        gaps = []
        for q in range(30):
            req = f"REQ-{p}-{q}"
            ref = rnd.choices(ST, weights=[0.35, 0.25, 0.40])[0]
            sys_ = ref if rnd.random() < 0.8 else rnd.choice(ST + ["abstained"])
            T["decisions"].append(dict(run_id=rid, requirement_id=req, final_status=sys_))
            c2 = ref if rnd.random() < 0.85 else rnd.choice(ST)
            T["ground_truth"].append(dict(run_id=rid, requirement_id=req, reference_status=ref, coder_1_status=ref,
                                          coder_2_status=c2 if p % 5 == 0 else "", participant_disagreed="false"))
            if ref != "evidenced": gaps.append(req)
        cum = 0
        for k in range(rnd.randint(0, 6)):
            h = rnd.choice([6, 10, 20, 40, 60]); cum += h
            if cum > 259.8: break
            it = T["ref_corpus"][rnd.randrange(40)]
            cov = "|".join(rnd.sample(gaps, min(2, len(gaps)))) if gaps else ""
            T["plan_items"].append(dict(run_id=rid, rank=k + 1, item_id=it["item_id"], title=it["title"], provider=it["provider"], source_url=it["source_url"], estimated_hours=h, covers_requirements=cov))
            for rq in filter(None, cov.split("|")):
                T["pathway_review"].append(dict(run_id=rid, item_id=it["item_id"], requirement_id=rq, relevant_to_reference_gap=str(rnd.random() < 0.85).lower()))
        if rnd.random() < 0.9:
            T["evaluation_responses"].append({"รหัสงานที่ปรากฏในรายงาน": rid, "ข้อ 1 ช่วยระบุสิ่งที่ควรเริ่มเรียน": str(rnd.choice([3, 4, 4, 5, 5])),
                                              "ข้อ 2 ช่วยจัดลำดับการพัฒนาทักษะ": rnd.choice(["3", "4", "5", "ประเมินไม่ได้"]),
                                              "ข้อ 3 เหมาะกับเวลาที่จัดสรรได้": str(rnd.choice([2, 3, 4, 5]))})
    return T, cohort
