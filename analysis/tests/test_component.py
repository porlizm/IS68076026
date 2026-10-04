import unittest, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import component_analysis as ca
from synth_data import make_tables


class TestComponent(unittest.TestCase):
    def test_r1_majority_and_abstain(self):
        self.assertEqual(ca.r1(["evidenced", "evidenced", "missing"]), "evidenced")
        self.assertEqual(ca.r1(["evidenced", "unverified", "unverified"]), "abstained")
        self.assertEqual(ca.r1(["evidenced", "partially", "missing"]), "abstained")

    def test_false_evidence(self):
        self.assertAlmostEqual(ca.false_evidence([("missing", "evidenced"), ("evidenced", "evidenced")]), 0.5)
        self.assertIsNone(ca.false_evidence([("missing", "missing")]))

    def test_analyse_synthetic(self):
        t, cohort = make_tables()
        res = ca.analyse(t, cohort, b=200)
        self.assertEqual(set(res["conditions"]), set(ca.CONDITIONS))
        self.assertEqual(res["n_participants"], len(cohort))
        self.assertIsNone(res["conditions"]["full"]["diff_vs_full"])
        self.assertGreater(res["claim_level"]["n_claims"], 0)


if __name__ == "__main__":
    unittest.main()
