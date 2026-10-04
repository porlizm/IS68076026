#!/usr/bin/env python3
"""S6 harness: ควบคุม mock + อ่าน execution จาก n8n public API"""
import json, sys, time, urllib.request

N8N = 'http://127.0.0.1:5678/api/v1'
CTL = 'http://127.0.0.1:8999'
KEY = open('/home/claude/s6/apikey.txt').read().strip()
op = urllib.request.build_opener(urllib.request.ProxyHandler({}))

def req(url, data=None, method=None, headers=None):
    h = {'Content-Type': 'application/json', **(headers or {})}
    r = urllib.request.Request(url, data=json.dumps(data).encode() if data is not None else None, method=method or ('POST' if data is not None else 'GET'), headers=h)
    with op.open(r, timeout=60) as f:
        b = f.read()
        return json.loads(b) if b else {}

def n8n(path, data=None, method=None):
    return req(N8N + path, data, method, {'X-N8N-API-KEY': KEY})

def ctl(path, data=None):
    return req(CTL + path, data)

ROLE = {'R01': 'R01 วิศวกรซอฟต์แวร์', 'R06': 'R06 นักวิทยาศาสตร์ข้อมูล', 'R18': 'R18 นักวิเคราะห์ระบบคอมพิวเตอร์', 'R19': 'R19 ผู้จัดการโครงการไอที'}
FILE = {'A': ('SYNTH_FILE_A_0000000000000000000000', 'R01'), 'B': ('SYNTH_FILE_B_0000000000000000000000', 'R06'), 'C': ('SYNTH_FILE_C_0000000000000000000000', 'R18'), 'D': ('SYNTH_FILE_D_0000000000000000000000', 'R19'), 'SIX': ('SYNTH_FILE_SIXPAGES_000000000000000', 'R01'), 'SIXOBJ': ('SYNTH_FILE_SIXOBJSTM_00000000000000', 'R01')}

def form_row(case, email=None, consent='ข้าพเจ้ายินยอมตามข้อ 1 และข้อ 2', months='6 เดือน', hours=10, mode='ทั้งสองประเภท'):
    fid, role = FILE[case]
    return {'Email Address': email or f'participant.{case.lower()}@mail.test', 'อัปโหลดเรซูเม (PDF)': f'https://drive.google.com/open?id={fid}',
            'อาชีพเป้าหมาย': ROLE[role], 'ระยะเวลาที่ต้องการใช้เรียนรู้': months, 'ชั่วโมงที่เรียนได้ต่อสัปดาห์': hours,
            'สิ่งที่ต้องการให้แนะนำ': mode, 'ความยินยอม': consent}

def executions(limit=20, wf=None):
    q = f'/executions?limit={limit}&includeData=false' + (f'&workflowId={wf}' if wf else '')
    return n8n(q)['data']

def execution(eid):
    return n8n(f'/executions/{eid}?includeData=true')

def summarize(eid):
    e = execution(eid)
    rd = (e.get('data') or {}).get('resultData', {})
    out = {'id': e['id'], 'mode': e.get('mode'), 'status': e.get('status'), 'finished': e.get('finished'), 'error': (rd.get('error') or {}).get('message'), 'lastNode': rd.get('lastNodeExecuted')}
    nodes = []
    for name, runs in (rd.get('runData') or {}).items():
        for i, r in enumerate(runs):
            items = sum(len(o or []) for o in ((r.get('data') or {}).get('main') or []))
            nodes.append((r.get('startTime', 0), name, i, r.get('executionStatus'), items, (r.get('error') or {}).get('message', '')[:200]))
    nodes.sort()
    out['nodes'] = [f'{n[1]}#{n[2]} {n[3]} items={n[4]} {n[5]}' for n in nodes]
    return out, e

def wait_new(after_ids, timeout=240, want=1):
    t0 = time.time()
    while time.time() - t0 < timeout:
        ex = [x for x in executions(50) if x['id'] not in after_ids]
        done = [x for x in ex if x.get('stoppedAt')]
        if len(done) >= want and len(done) == len(ex):
            return done
        time.sleep(5)
    return [x for x in executions(50) if x['id'] not in after_ids]

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'ex':
        for x in executions(30): print(x['id'], x.get('mode'), x.get('status'), x.get('startedAt'), x.get('stoppedAt'))
    elif cmd == 'show':
        s, _ = summarize(sys.argv[2]); print(json.dumps(s, ensure_ascii=False, indent=1))
    elif cmd == 'state':
        print(json.dumps(ctl('/state'), ensure_ascii=False, indent=1)[:int(sys.argv[2]) if len(sys.argv) > 2 else 6000])
