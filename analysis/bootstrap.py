# -*- coding: utf-8 -*-
"""bootstrap.py — ช่วงความไม่แน่นอนแบบเปอร์เซ็นไทล์ที่ระดับผู้เข้าร่วม (หัวข้อ 3.9.4)
สุ่มผู้เข้าร่วมแบบแทนที่ n คนต่อรอบ · 2,000 รอบ · รายงานเปอร์เซ็นไทล์ 2.5–97.5 · seed ตรึงไว้ 68076026"""
import random

SEED, B = 68076026, 2000


def percentile(sorted_vals, q):
    if not sorted_vals: return None
    k = (len(sorted_vals) - 1) * q
    f, c = int(k), min(int(k) + 1, len(sorted_vals) - 1)
    return sorted_vals[f] + (sorted_vals[c] - sorted_vals[f]) * (k - f)


def bootstrap_ci(units, stat, b=B, seed=SEED, alpha=0.05):
    """units: list ของข้อมูลรายผู้เข้าร่วม · stat: ฟังก์ชันจาก list -> ค่า (None = ไม่นิยาม ไม่นับ)"""
    rnd = random.Random(seed)
    n = len(units)
    vals = []
    for _ in range(b):
        s = stat([units[rnd.randrange(n)] for _ in range(n)])
        if s is not None: vals.append(s)
    vals.sort()
    return dict(estimate=stat(units), lower=percentile(vals, alpha / 2), upper=percentile(vals, 1 - alpha / 2),
                n_boot_valid=len(vals), b=b, seed=seed)


def mean_of(key):
    def f(rows):
        v = [r[key] for r in rows if r.get(key) is not None]
        return sum(v) / len(v) if v else None
    return f
