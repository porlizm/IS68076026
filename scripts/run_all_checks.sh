#!/usr/bin/env bash
# run_all_checks.sh — ตรวจรับทั้งโครงการในคำสั่งเดียว (ใช้ก่อน commit และก่อน build เล่ม)
#   bash scripts/run_all_checks.sh
set -euo pipefail
cd "$(dirname "$0")/.."
echo "▶ manifest";          python3 scripts/update_manifest.py --check
echo "▶ run_local";         node scripts/run_local.mjs
echo "▶ coverage";          node scripts/simulate_coverage.mjs && node scripts/simulate_coverage.mjs --what-if > /dev/null
echo "▶ coverage ILP";      python3 scripts/coverage_diagnostics.py
echo "▶ workflows";         node scripts/validate_workflows.mjs
echo "▶ tests (node)";      node --test --test-reporter=tap tests/*.test.mjs > evidence/test_report.tap || true
python3 - <<'EOF'
import json,re
t=open('evidence/test_report.tap',encoding='utf-8').read()
g=lambda k:int(re.search(r'^# '+k+r' (\d+)',t,re.M).group(1))
s={"tests":g("tests"),"pass":g("pass"),"fail":g("fail")}
json.dump(s,open('evidence/test_summary.json','w'),indent=1); print("  ",s)
if s["fail"]: raise SystemExit("มีเทสต์ไม่ผ่าน ดู evidence/test_report.tap")
EOF
echo "▶ analysis tests";    python3 -m unittest discover -s analysis/tests -t . -q
echo "▶ book numbers";      python3 scripts/book_numbers.py
echo "✔ ผ่านทั้งหมด"
