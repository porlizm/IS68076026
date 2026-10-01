#!/usr/bin/env python3
"""S6 suite: ทดสอบ WF_IS_68076026_01OCT26 ใน n8n 2.39.9 จริงกับบริการจำลอง (mock/server.mjs)
แต่ละกรณี: ตั้ง fault → เพิ่มแถวแบบฟอร์ม → รอ poll (ทุก 1 นาที) → รอ execution จบ → ตรวจแถวในชีตจำลอง/ไฟล์/อีเมล"""
import json, sys, time, datetime
import h

WF_ID = 'is68Single000001'
results = []

def state():
    return h.ctl('/state')

def delta(before, after):
    d = {}
    for t, rows in after['tabs'].items():
        d[t] = rows[len(before['tabs'][t]):]
    d['mail'] = after['mail'][len(before['mail']):]
    d['models'] = after['models'][len(before['models']):]
    d['docai'] = after['docai'][len(before['docai']):]
    d['files'] = [f for f in after['files'] if f['id'] not in {x['id'] for x in before['files']}]
    return d

def runs_now(after, ids):
    return [r for r in after['tabs']['runs'] if r['run_id'] in ids]

def case(no, title, rows, faults=None, want_exec=1, timeout=260):
    h.ctl('/faults', faults or {})
    b = state(); before_ex = [x['id'] for x in h.executions(100)]
    h.ctl('/form', {'rows': rows})
    t0 = time.time()
    done = h.wait_new(before_ex, timeout=timeout, want=want_exec)
    time.sleep(3)
    a = state(); h.ctl('/faults', {})
    exs = []
    for x in sorted(done, key=lambda x: int(x['id'])):
        s, e = h.summarize(x['id'])
        exs.append({'id': s['id'], 'mode': s['mode'], 'status': s['status'], 'error': s['error'], 'lastNode': s['lastNode'], 'nodes_run': len(s['nodes']),
                    'non_success': [n for n in s['nodes'] if ' success ' not in n]})
    d = delta(b, a)
    new_ids = {r['run_id'] for r in d['runs']} | {r['run_id'] for r in d['deliveries']} | {r['run_id'] for r in d['ocr_results']}
    return {'no': no, 'title': title, 'elapsed_s': round(time.time() - t0, 1), 'executions': exs, 'delta': d, 'runs': runs_now(a, new_ids), 'state': a}

def trigger_outage():
    b = state(); before_ex = [x['id'] for x in h.executions(100)]
    h.ctl('/faults', {'sheet_read_fail': 'form_responses'})
    t0 = time.time(); time.sleep(170)
    h.ctl('/faults', {}); time.sleep(20)
    a = state()
    exs = []
    for x in sorted([x for x in h.executions(100) if x['id'] not in before_ex], key=lambda x: int(x['id'])):
        s, e = h.summarize(x['id'])
        exs.append({'id': s['id'], 'mode': s['mode'], 'status': s['status'], 'error': s['error'], 'lastNode': s['lastNode'], 'nodes_run': len(s['nodes']), 'non_success': [n for n in s['nodes'] if ' success ' not in n]})
    return {'no': 14, 'title': 'trigger อ่านชีตไม่ได้ต่อเนื่อง ~3 นาที', 'elapsed_s': round(time.time() - t0, 1), 'executions': exs, 'delta': delta(b, a), 'runs': [], 'state': a}

def check(res, cond, label):
    res.setdefault('checks', []).append({'ok': bool(cond), 'check': label})

def summary_runs(res):
    return [{k: r[k] for k in ('run_id', 'stage', 'ocr_engine', 'model_status', 'readiness_pct', 'n_abstained', 'email_status', 'pdf_file_id', 'error_code')} for r in res['runs']]

def main(only=None):
    wf = h.n8n(f'/workflows/{WF_ID}')
    real = [n for n in wf['nodes'] if n['type'] != 'n8n-nodes-base.stickyNote']
    r1 = {'no': 1, 'title': 'นำเข้าและเปิดใช้งาน (import:workflow + activate)', 'executions': [], 'runs': []}
    check(r1, wf['name'] == 'WF_IS_68076026_01OCT26', f"ชื่อ {wf['name']}")
    check(r1, len(real) == 69 and len(wf['nodes']) - len(real) == 7, f'{len(real)} โหนด + {len(wf["nodes"]) - len(real)} sticky note')
    check(r1, wf['active'] is True, 'active=true (n8n ตรวจพารามิเตอร์ trigger ผ่าน)')
    results.append(r1)

    plan = [
        (2, 'เรซูเม A มีชั้นข้อความ', lambda: case(2, 'เรซูเม A มีชั้นข้อความ', [h.form_row('A')])),
        (3, 'เรซูเม C สแกน + โมเดล C ตอบ 429 ทุกครั้ง', lambda: case(3, 'เรซูเม C สแกน + โมเดล C ตอบ 429 ทุกครั้ง', [h.form_row('C')])),
        (4, 'สองแถวในการ poll เดียว', lambda: case(4, 'สองแถวในการ poll เดียว', [h.form_row('A', email='two.a@mail.test'), h.form_row('B', email='two.b@mail.test')])),
        (5, 'ไม่ให้ความยินยอม', lambda: case(5, 'ไม่ให้ความยินยอม', [h.form_row('A', email='no.consent@mail.test', consent='ไม่ยินยอม')])),
        (6, 'ไฟล์ 6 หน้า', lambda: case(6, 'ไฟล์ 6 หน้า', [h.form_row('SIX', email='six@mail.test')], want_exec=2)),
        (7, 'ล้มกลางลูป (สองงาน · อ่าน ref_corpus ไม่ได้)', lambda: case(7, 'ล้มกลางลูป (สองงาน · อ่าน ref_corpus ไม่ได้)', [h.form_row('A', email='loop.a@mail.test'), h.form_row('B', email='loop.b@mail.test')], faults={'sheet_read_fail': 'ref_corpus'}, want_exec=2)),
        (8, 'โมเดลล้มครบสามตัว (401)', lambda: case(8, 'โมเดลล้มครบสามตัว (401)', [h.form_row('A', email='allfail@mail.test')], faults={'models_all_fail': True})),
        (9, 'อัปโหลด PDF ล้ม (Drive ตอบ 403 quota ที่ขั้นอัปโหลด PDF)', lambda: case(9, 'อัปโหลด PDF ล้ม (Drive ตอบ 403 quota ที่ขั้นอัปโหลด PDF)', [h.form_row('A', email='upfail@mail.test')], faults={'drive_pdf_upload_fail': True})),
        (10, 'Document AI ล้ม → OCR ในเครื่อง', lambda: case(10, 'Document AI ล้ม → OCR ในเครื่อง', [h.form_row('C', email='docai.down@mail.test')], faults={'docai_fail': True})),
        (11, 'OCR ล้มทั้งหลักและสำรอง', lambda: case(11, 'OCR ล้มทั้งหลักและสำรอง', [h.form_row('C', email='ocr.down@mail.test')], faults={'docai_fail': True, 'local_ocr_fail': True}, want_exec=2)),
        (13, 'โฟลเดอร์รายงานผิด (สร้าง Doc ชั่วคราวไม่ได้ → ไม่มี PDF)', lambda: case(13, 'โฟลเดอร์รายงานผิด (สร้าง Doc ชั่วคราวไม่ได้ → ไม่มี PDF)', [h.form_row('A', email='badfolder@mail.test')], faults={'drive_bad_folder': 'REPORT_FOLDER'})),
        (14, 'trigger อ่านชีตไม่ได้ต่อเนื่อง ~3 นาที', lambda: trigger_outage()),
        (12, 'PDF 6 หน้าแบบ object stream (นับด้วย regex ไม่ได้)', lambda: case(12, 'PDF 6 หน้าแบบ object stream', [h.form_row('SIXOBJ', email='objstm@mail.test')], want_exec=2)),
    ]
    for no, title, fn in plan:
        if only and no not in only:
            continue
        print(f'--- case {no}: {title}', flush=True)
        r = fn(); d = r['delta']; ex = r['executions']
        trig = [e for e in ex if e['mode'] == 'trigger']; err = [e for e in ex if e['mode'] == 'error']
        R = r['runs']
        if no in (2, 3, 8, 9, 10):
            run = R[0] if R else {}
            check(r, len(trig) == 1 and trig[0]['status'] == 'success' and not err, 'execution trigger สำเร็จ ไม่มี error execution')
            check(r, run.get('stage') == 'delivered', f"runs.stage = {run.get('stage')}")
            check(r, len(d['deliveries']) == 1, f"deliveries {len(d['deliveries'])} แถว")
            check(r, len(d['decisions']) == 30, f"decisions {len(d['decisions'])} แถว")
            check(r, len([m for m in d['mail'] if m['has_pdf']]) == 1, f"อีเมลแนบ PDF {len([m for m in d['mail'] if m['has_pdf']])} ฉบับ")
        if no == 2:
            check(r, d['ocr_results'][0]['engine'] == 'pdf_text_layer', 'ocr_results.engine = pdf_text_layer')
            check(r, run.get('pdf_file_id', '').startswith('mockpdf_') and run.get('error_code') == '', f"pdf_file_id={run.get('pdf_file_id')} error_code='{run.get('error_code')}'")
            check(r, run.get('readiness_pct') == 66.25, f"R = {run.get('readiness_pct')} (ตรง run_local 66.25)")
            check(r, len(d['plan_items']) == 7, f"plan_items {len(d['plan_items'])} (ตรง run_local 7)")
            check(r, not [f for f in r['state']['files'] if f['mimeType'] == 'application/vnd.google-apps.document'], 'ลบ Google Doc ชั่วคราวแล้ว')
        if no == 3:
            c_calls = [c for c in d['model_calls'] if c['model_key'] == 'C']
            check(r, d['ocr_results'][0]['engine'] == 'google_document_ai', f"ocr engine = {d['ocr_results'][0]['engine']}")
            check(r, [c['attempt'] for c in c_calls] == [1, 2, 3] and all(c['error_code'] == '429' for c in c_calls), f"model_calls C: {[(c['attempt'], c['error_code']) for c in c_calls]}")
            ts = [datetime.datetime.fromisoformat(c['created_at'].replace('Z', '+00:00')) for c in c_calls]
            gaps = [round((ts[i + 1] - ts[i]).total_seconds(), 1) for i in range(len(ts) - 1)]
            check(r, len(gaps) == 2 and gaps[0] >= 5 and gaps[1] >= 15, f'ช่วงรอก่อนเรียกซ้ำ {gaps} วินาที (retry_backoff_ms 5000/15000)')
            check(r, str(run.get('model_status', '')).startswith('m=2'), f"model_status {run.get('model_status')}")
            check(r, run.get('readiness_pct') == 38.57, f"R = {run.get('readiness_pct')} (ตรง run_local 38.57)")
        if no == 4:
            check(r, len(trig) == 1 and trig[0]['status'] == 'success', 'execution เดียวทำครบสองงาน')
            check(r, len(R) == 2 and len({x['run_id'] for x in R}) == 2 and all(x['stage'] == 'delivered' for x in R), f"runs {[(x['run_id'][-8:], x['stage']) for x in R]}")
            check(r, len(d['deliveries']) == 2 and len(d['decisions']) == 60, f"deliveries {len(d['deliveries'])} · decisions {len(d['decisions'])}")
            check(r, sorted(x['readiness_pct'] for x in R) == [19.63, 66.25], f"R ของสองงาน {[x['readiness_pct'] for x in R]} (ไม่ปนกัน)")
        if no == 5:
            check(r, len(d['runs']) == 0, f"ไม่มีแถว runs ({len(d['runs'])})")
            check(r, [a['event'] for a in d['audit_log']] == ['rejected_input'] and 'consent_not_given' in d['audit_log'][0]['detail'], f"audit {[a['event'] for a in d['audit_log']]}")
            check(r, len(d['mail']) == 0, 'ไม่ส่งอีเมล')
        if no in (6, 12):
            run = R[0] if R else {}
            check(r, len(trig) == 1 and trig[0]['status'] == 'error' and len(err) == 1 and err[0]['status'] == 'success', f"trigger={[e['status'] for e in trig]} error={[e['status'] for e in err]}")
            check(r, run.get('stage') == 'failed' and run.get('error_code') == 'too_many_pages', f"runs {run.get('stage')} / {run.get('error_code')}")
            check(r, len(d['mail']) == 1 and 'too_many_pages' in str(trig[0]['error']), 'แจ้งผู้วิจัย 1 ฉบับ')
            if no == 12:
                check(r, 'extractFromFile' in str(trig[0]['error']), f"ตรวจพบที่ {trig[0]['lastNode']}: {trig[0]['error']}")
        if no == 7:
            first = [x for x in R if 'loop.a' in x.get('email', '')]; second = [x for x in R if 'loop.b' in x.get('email', '')]
            check(r, len(trig) == 1 and trig[0]['status'] == 'error' and len(err) == 1 and err[0]['status'] == 'success', 'trigger ล้ม · Error Trigger ทำงานสำเร็จ')
            check(r, first and first[0]['stage'] == 'failed' and first[0]['error_code'] == 'unexpected_error', f"งานที่ล้ม {[(x['run_id'][-8:], x['stage'], x['error_code']) for x in first]}")
            check(r, second and second[0]['stage'] == 'failed' and second[0]['error_code'] == 'batch_aborted', f"งานที่ยังไม่เริ่ม {[(x['run_id'][-8:], x['stage'], x['error_code']) for x in second]}")
            ev = [a for a in d['audit_log'] if a['event'] == 'workflow_error']
            check(r, ev and ev[0]['run_id'] == (first[0]['run_id'] if first else '') , 'audit_log workflow_error ระบุ run_id ของงานที่ล้ม')
            check(r, len(d['mail']) == 1, f"อีเมลแจ้งผู้วิจัย {len(d['mail'])} ฉบับ")
        if no == 8:
            check(r, run.get('n_abstained') == 30 and run.get('readiness_pct') == 'N/A', f"abstained {run.get('n_abstained')} · R {run.get('readiness_pct')}")
            check(r, len(d['model_calls']) == 3 and len(d['findings']) == 0, f"model_calls {len(d['model_calls'])} (401 ไม่เรียกซ้ำ) · findings {len(d['findings'])}")
        if no == 9:
            check(r, run.get('error_code') == 'pdf_upload_failed' and run.get('email_status') == 'sent', f"error_code {run.get('error_code')} email {run.get('email_status')}")
        if no == 13:
            run = R[0] if R else {}
            check(r, len(trig) == 1 and trig[0]['status'] == 'success' and not err, 'execution สำเร็จ (ส่งไม่สำเร็จไม่ใช่ error ของ n8n)')
            check(r, run.get('stage') == 'failed' and run.get('email_status') == 'failed', f"runs {run.get('stage')} / email {run.get('email_status')}")
            check(r, len(d['deliveries']) == 1, f"deliveries {len(d['deliveries'])} แถว (บันทึกครั้งเดียว)")
            check(r, len(d['mail']) == 1 and not d['mail'][0]['has_pdf'] and d['mail'][0]['to'] == 'researcher@mail.test', f"แจ้งผู้วิจัย {[(m['to'], m['has_pdf']) for m in d['mail']]}")
        if no == 14:
            te = [e for e in ex if e['mode'] == 'trigger']; ee = [e for e in ex if e['mode'] == 'error']
            check(r, len(te) >= 2 and all(e['status'] == 'error' for e in te), f"poll ล้ม {len(te)} ครั้ง")
            check(r, len(ee) == len(te) and all(e['status'] == 'success' for e in ee), f"Error Trigger ทำงาน {len(ee)} ครั้ง สำเร็จทุกครั้ง")
            check(r, len(d['runs']) == 0, f"ไม่มีแถว runs ปลอม ({len(d['runs'])})")
            check(r, len(d['audit_log']) == len(te), f"audit_log {len(d['audit_log'])} แถว")
            check(r, len(d['mail']) == 1, f"อีเมลถึงผู้วิจัย {len(d['mail'])} ฉบับ (ไม่เกินชั่วโมงละครั้ง)")
        if no == 10:
            check(r, d['ocr_results'][0]['engine'] == 'local_ocr', f"ocr engine = {d['ocr_results'][0]['engine']}")
        if no == 11:
            run = R[0] if R else {}
            check(r, run.get('stage') == 'failed' and run.get('error_code') == 'ocr_failed', f"runs {run.get('stage')} / {run.get('error_code')}")
        r.pop('state', None)
        r['runs'] = summary_runs(r)
        r['delta'] = {k: (len(v) if isinstance(v, list) else v) for k, v in d.items()}
        print(json.dumps({'no': no, 'checks': r['checks'], 'executions': ex}, ensure_ascii=False, indent=1), flush=True)
        results.append(r)
    out = '/home/claude/s6/s6_results.json'
    json.dump(results, open(out, 'w'), ensure_ascii=False, indent=1)
    print('PASS' if all(c['ok'] for r in results for c in r.get('checks', [])) else 'FAIL', out)

if __name__ == '__main__':
    main([int(x) for x in sys.argv[1].split(',')] if len(sys.argv) > 1 else None)
