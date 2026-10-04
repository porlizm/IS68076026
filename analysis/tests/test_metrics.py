# -*- coding: utf-8 -*-
"""เป้าทดสอบคำนวณด้วยมือ (Analysis_Plan.md ภาคผนวก ก)"""
import os, sys, tempfile, unittest, csv, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from metrics import confusion, macro_f1, abstain_rate, cohen_kappa, rq2, likert_items  # noqa: E402
from bootstrap import bootstrap_ci, mean_of  # noqa: E402
import coding_sheets  # noqa: E402
from run_analysis import analyse  # noqa: E402
from synth_data import make_tables  # noqa: E402


def ex_pairs():
    # ตัวอย่าง ก.1: 20 รายการ
    P = []
    P += [("evidenced", "evidenced")] * 6 + [("evidenced", "partially")] * 1 + [("evidenced", "abstained")] * 1
    P += [("partially", "partially")] * 3 + [("partially", "missing")] * 2 + [("partially", "evidenced")] * 1
    P += [("missing", "missing")] * 5 + [("missing", "abstained")] * 1
    return P


class TestRQ1(unittest.TestCase):
    def test_worked_example(self):
        m = confusion(ex_pairs())
        r = macro_f1(m)
        ps = r["per_status"]
        # evidenced: TP 6, pred 7 (6+1), ref decided 7 -> P=6/7 R=6/7 F1=6/7
        self.assertAlmostEqual(ps["evidenced"]["f1"], 6 / 7, places=9)
        # partially: TP 3, pred 4 (1+3), ref decided 6 -> P=0.75 R=0.5 F1=0.6
        self.assertAlmostEqual(ps["partially"]["f1"], 0.6, places=9)
        # missing: TP 5, pred 7 (2+5), ref decided 5 -> P=5/7 R=1 F1=10/12
        self.assertAlmostEqual(ps["missing"]["f1"], 5 / 6, places=9)
        self.assertAlmostEqual(r["macro_f1"], (6 / 7 + 0.6 + 5 / 6) / 3, places=9)  # 0.7635
        self.assertEqual(round(r["macro_f1"], 4), 0.7635)
        a = abstain_rate(m)
        self.assertEqual((a["numerator"], a["denominator"]), (2, 20))
        s = macro_f1(m, supplementary=True)["per_status"]
        # ประกอบ: evidenced R = 6/8 · missing R = 5/6
        self.assertAlmostEqual(s["evidenced"]["recall"], 0.75)
        self.assertAlmostEqual(s["missing"]["recall"], 5 / 6)

    def test_zero_denominators(self):
        m = confusion([("evidenced", "evidenced"), ("missing", "missing")])
        r = macro_f1(m)
        self.assertIsNone(r["per_status"]["partially"]["f1"])  # เฉลยไม่มี -> N/A
        self.assertEqual(r["n_statuses"], 2)
        m2 = confusion([("evidenced", "missing"), ("missing", "missing")])
        self.assertEqual(macro_f1(m2)["per_status"]["evidenced"]["f1"], 0.0)  # ระบบไม่เคยให้ -> 0

    def test_kappa(self):
        # ตัวอย่าง ก.2: 10 คู่ po = 0.8 · pe = 0.34 -> kappa = 0.46/0.66
        a = ["evidenced"] * 4 + ["partially"] * 3 + ["missing"] * 3
        b = ["evidenced"] * 3 + ["partially"] + ["partially"] * 2 + ["missing"] + ["missing"] * 3
        k = cohen_kappa(a, b)
        self.assertAlmostEqual(k["observed_agreement"], 0.8)
        # pe = .4*.3 + .3*.3 + .3*.4 = 0.33
        self.assertAlmostEqual(k["expected_agreement"], 0.33)
        self.assertAlmostEqual(k["kappa"], (0.8 - 0.33) / 0.67)


class TestRQ2(unittest.TestCase):
    def test_rq2_example(self):
        corpus = {"I1": dict(title="A", provider="P", source_url="https://a", verification_status="verified"),
                  "I2": dict(title="B", provider="P", source_url="https://b", verification_status="verified")}
        plans = {"R1": [dict(item_id="I1", title="A", provider="P", source_url="https://a", estimated_hours=100, covers_requirements="g1|g2"),
                        dict(item_id="I1", title="A", provider="P", source_url="https://a", estimated_hours=100, covers_requirements="g1|g2"),
                        dict(item_id="I2", title="WRONG", provider="P", source_url="https://b", estimated_hours=40, covers_requirements="g3")],
                 "R2": []}
        reviews = [dict(run_id="R1", item_id="I1", requirement_id="g1", relevant_to_reference_gap="true"),
                   dict(run_id="R1", item_id="I1", requirement_id="g2", relevant_to_reference_gap="false"),
                   dict(run_id="R1", item_id="I2", requirement_id="g3", relevant_to_reference_gap="false")]
        gaps = {"R1": {"g1", "g2", "g3", "g4"}, "R2": set()}
        r = rq2(plans, reviews, gaps, corpus, {"R1": 150, "R2": 150})
        self.assertEqual((r["relevance"]["numerator"], r["relevance"]["denominator"]), (1, 2))
        self.assertEqual((r["gap_coverage"]["numerator"], r["gap_coverage"]["denominator"]), (1, 4))
        self.assertEqual((r["item_accuracy"]["numerator"], r["item_accuracy"]["denominator"]), (1, 2))
        self.assertEqual((r["time_feasibility"]["numerator"], r["time_feasibility"]["denominator"]), (1, 1))
        self.assertEqual(r["special_cases"], {"empty_plan_no_gap": 1})

    def test_likert(self):
        L = likert_items([{"q": "5"}, {"q": "3"}, {"q": "ประเมินไม่ได้"}, {"q": ""}], ["q"])["q"]
        self.assertEqual((L["mean"], L["n"], L["cannot_assess"]), (4.0, 2, 1))
        self.assertAlmostEqual(L["sd"], 2 ** 0.5)


class TestBootstrapAndCoding(unittest.TestCase):
    def test_bootstrap_deterministic(self):
        units = [dict(v=x / 10) for x in range(10)]
        a = bootstrap_ci(units, mean_of("v")); b = bootstrap_ci(units, mean_of("v"))
        self.assertEqual(a, b); self.assertAlmostEqual(a["estimate"], 0.45)
        self.assertTrue(a["lower"] < 0.45 < a["upper"]); self.assertEqual(a["b"], 2000)

    def test_coding_blind_and_merge(self):
        d = tempfile.mkdtemp()
        runs = [dict(run_id=f"RUN-{i}", stage="delivered", created_at=f"2026-11-{i + 1:02d}", role_id="R01", file_id=f"F{i}") for i in range(10)]
        reqs = [dict(role_id="R01", requirement_id=f"REQ-R01-{q}", element_name="E", element_description="D") for q in range(3)]
        for name, rows in [("runs", runs), ("ref_requirements", reqs)]:
            with open(os.path.join(d, name + ".csv"), "w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
        out = os.path.join(d, "coding")
        sample = coding_sheets.make(d, out)
        self.assertEqual(len(sample), 2)  # 20% ของ 10
        hdr = open(os.path.join(out, "coder_all.csv"), encoding="utf-8").readline()
        self.assertNotIn("final_status", hdr)
        for fn, st in [("coder_all.csv", "evidenced"), ("recode_sample.csv", "missing")]:
            p = os.path.join(out, fn); rows = list(csv.DictReader(open(p, encoding="utf-8")))
            for r in rows: r["status"] = st; r["coded_on"] = "2026-11-01" if fn == "coder_all.csv" else "2026-11-20"
            with open(p, "w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
        gt, dis, k = coding_sheets.merge(out)
        self.assertEqual(len(dis), 6)  # 2 คน x 3 ข้อ รหัสสองรอบไม่ตรงกัน -> รอข้อยุติ
        self.assertEqual(len(gt), 24)
        self.assertTrue(json.load(open(os.path.join(out, "agreement.json")))["pass_threshold"] is False)
        # รอบที่ 2 ต้องห่างจากรอบที่ 1 อย่างน้อย 14 วัน
        p = os.path.join(out, "recode_sample.csv"); rows = list(csv.DictReader(open(p, encoding="utf-8")))
        for r in rows: r["coded_on"] = "2026-11-05"
        with open(p, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
        with self.assertRaises(SystemExit): coding_sheets.merge(out)
        # ลำดับแถวของไฟล์รอบที่ 2 ต้องไม่เรียงเหมือนรอบที่ 1
        first = [(r["run_id"], r["requirement_id"]) for r in csv.DictReader(open(os.path.join(out, "coder_all.csv"), encoding="utf-8"))]
        again = [(r["run_id"], r["requirement_id"]) for r in rows]
        self.assertNotEqual([x for x in first if x in set(again)], again)


class TestRehearsal(unittest.TestCase):
    def test_synthetic_30_plus_5(self):
        T, cohort = make_tables()
        self.assertEqual(len(cohort), 30)
        res = analyse(T, cohort)
        self.assertEqual(res["n_main"], 30)
        self.assertEqual(res["rq1"]["n_participants"], 30)
        self.assertEqual(res["rq1"]["abstain_pooled"]["denominator"], 900)
        self.assertIsNotNone(res["rq1"]["ci_macro_f1_mean"]["lower"])
        self.assertEqual(res["kappa"]["n"], 6 * 30)


if __name__ == "__main__":
    unittest.main()
