#!/usr/bin/env python3
"""สร้าง evidence/n8n_test_01OCT26.md + evidence/n8n_test_summary.json จากผล s6_suite.py"""
import json, sys
src = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/s6/s6_results.json'
out_dir = sys.argv[2] if len(sys.argv) > 2 else '/home/claude/fis/evidence'
R = json.load(open(src))
cases = [r for r in R if r['no'] != 1]
ok = lambda r: all(c['ok'] for c in r.get('checks', []))
summary = {'date': '2026-10-01', 'n8n_version': '2.39.9', 'node_version': '24.21.0', 'workflow': 'WF_IS_68076026_01OCT26', 'decision': 'DEC-48',
           'cases': len(R), 'pass': sum(ok(r) for r in R), 'checks': sum(len(r.get('checks', [])) for r in R), 'checks_pass': sum(c['ok'] for r in R for c in r.get('checks', [])),
           'services': 'mock (evidence/n8n_s6/mock_server.mjs) — ไม่ใช่บริการจริงของ Google/OpenAI/Anthropic',
           'per_case': [{'no': r['no'], 'title': r['title'], 'pass': ok(r)} for r in R]}
json.dump(summary, open(f'{out_dir}/n8n_test_summary.json', 'w'), ensure_ascii=False, indent=1)

L = []
L.append('# ทดสอบ WF_IS_68076026_01OCT26 ใน n8n 2.39.9 จริง (DEC-48)\n')
L.append(f"> สถานะ: **{'✅ ผ่าน' if summary['pass'] == summary['cases'] else '❌ ไม่ผ่านบางกรณี'} {summary['pass']}/{summary['cases']} กรณี · {summary['checks_pass']}/{summary['checks']} จุดตรวจ** · 1 ต.ค. 2569 · n8n 2.39.9 (npm) · Node 24.21.0 · task runner ค่าเริ่มต้น · SQLite")
L.append('> บริการภายนอกเป็น**บริการจำลอง**ทั้งหมด (Google OAuth/Sheets/Drive/Gmail/Document AI · OpenAI · Anthropic · Gemini · OCR ในเครื่อง) ด้วย `evidence/n8n_s6/mock_server.mjs` · n8n เรียกโดเมนจริง (`sheets.googleapis.com` ฯลฯ) ผ่าน HTTPS โดยใช้ `/etc/hosts` เฉพาะ process ของ n8n และ CA ทดสอบ (`NODE_EXTRA_CA_CERTS`) · โหนด Google ของ n8n จึงทำงานจริงทุกขั้น (JWT ของบัญชีบริการ · OAuth2 · resumable upload · values:append)')
L.append('> ยังไม่ได้ยืนยัน: บัญชี Google จริง · Google Forms จริง · โมเดลจริงทั้งสาม (P1 smoke test) · temperature 0\n')
L.append('## วิธีทดสอบ\n')
L.append('1. ติดตั้ง `n8n@2.39.9` บน Node 24 · env ตาม `config/env_template.env` (`N8N_BLOCK_ENV_ACCESS_IN_NODE=false`, `N8N_CONCURRENCY_PRODUCTION_LIMIT=1`)')
L.append('2. `n8n import:credentials` 4 ชุด (id ตรง placeholder `CRED_*` ใน workflow) · `n8n import:workflow --input=workflows/WF_IS_68076026_01OCT26.json` · เปิดใช้งานผ่าน public API')
L.append('3. แต่ละกรณี: ตั้ง fault ของบริการจำลอง → เพิ่มแถวในแท็บ form_responses → รอ Google Sheets Trigger (poll ทุก 1 นาที) → รอทุก execution จบ → ตรวจแถวที่เกิดในทุกแท็บ ไฟล์ใน Drive และอีเมล (`evidence/n8n_s6/s6_suite.py`)\n')
L.append('## ผลรายกรณี\n')
L.append('| # | กรณี | ผล | execution (mode/status) | จุดตรวจ |')
L.append('|---|---|---|---|---|')
for r in R:
    ex = ' · '.join(f"#{e['id']} {e['mode']}/{e['status']}" for e in r.get('executions', [])) or '—'
    chk = '<br>'.join(('✅ ' if c['ok'] else '❌ ') + c['check'].replace('|', '/') for c in r.get('checks', []))
    L.append(f"| {r['no']} | {r['title']} | {'ผ่าน' if ok(r) else 'ไม่ผ่าน'} | {ex} | {chk} |")
L.append('\n## สิ่งที่พบใน n8n จริงและแก้แล้ว (รุ่น DEC-42 → DEC-48)\n')
L.append('รายละเอียดอยู่ใน `evidence/WF_analysis.md` หัวข้อ 3 · สรุป: (1) รหัส HTTP ของ error หายเมื่อส่งข้าม task runner → 429 ไม่ถูกเรียกซ้ำ (2) PDF แบบ object stream นับหน้าไม่ได้ (3) งานที่เหลือในรอบที่ล้มหายเงียบ (4) ส่งรายงานไม่สำเร็จไม่มีใครรู้ (5) trigger ล้มทุกนาทีเขียนแถว runs ปลอมและส่งอีเมลทุกนาที (6) OCR สำรองล้มไม่มีรหัสสาเหตุ (7) append ของ Sheets เสี่ยงเขียนทับเมื่อมีหลาย execution')
L.append('\nกรณี "อัปโหลด PDF ล้ม" ในเอกสารฉบับก่อนให้ตั้ง `DRIVE_REPORT_FOLDER_ID` ผิด แต่โฟลเดอร์นั้นใช้สร้าง Google Doc ชั่วคราวด้วย จึงไม่มี PDF ให้แนบอีเมล (ทดสอบแยกเป็นกรณี 13) · กรณี 9 จึงจำลองให้ Drive ปฏิเสธเฉพาะขั้นอัปโหลด PDF\n')
L.append('## ทำซ้ำบนเครื่องผู้วิจัยกับบริการจริง (👤)\n')
L.append('ตาม `docs/Setup_Guide.md` ข้อ 3–5 · ใช้บัญชี Google จริงและ `email_enabled=false` · กรณี 2, 3, 4, 5, 6 ทำได้ทันทีด้วยแบบฟอร์มจริง · บันทึก execution id ต่อท้ายตารางนี้')
open(f'{out_dir}/n8n_test_01OCT26.md', 'w').write('\n'.join(L) + '\n')
print(json.dumps({k: summary[k] for k in ('cases', 'pass', 'checks', 'checks_pass')}))
