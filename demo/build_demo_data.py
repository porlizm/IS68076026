#!/usr/bin/env python3
"""build_demo_data.py — สร้าง demo_data.json (ข้อมูลจริงที่ hardcode ลง WF_Demo)

แหล่งข้อมูล (อ่านอย่างเดียว):
  - Data_Set.xlsx           : 01_Role_Master, 04_Role_Technology, 05_Role_Tasks, 06_Role_Job_Titles, 07_Role_Education
  - data/requirements.csv   : 30 ข้อกำหนดต่ออาชีพ + น้ำหนัก (สมการ 3.1) + คำพ้อง (สร้างจาก Data_Set.xlsx แล้ว)
  - data/corpus.csv         : คอร์ส/ใบรับรองที่ verified (DEC-16 ห้ามเดา URL)
  - data/mappings.csv + data/mapping_review.csv : ความเชื่อมโยง L1 ที่ผ่านตรวจ (DEC-21)
  - data/role_tasks.csv · role_technology.csv · skill_links.csv : งานหลัก 8 งาน · เทคโนโลยีที่ตลาดต้องการ · ทักษะ→กิจกรรม (DEC-54/55)

ใช้:  python demo/build_demo_data.py  (รันจากโฟลเดอร์ Final_IS)  → demo/build/demo_data.json
"""
import csv, json, os, sys, hashlib, datetime, math, collections
import openpyxl

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
DATASET = os.path.join(ROOT, 'source/project_files/Data_Set.xlsx')
if not os.path.exists(DATASET):
    DATASET = os.path.join(ROOT, 'Data_Set.xlsx')
OUT = os.path.join(ROOT, 'demo/build/demo_data.json') if len(sys.argv) < 3 else sys.argv[2]

ROLES = {  # ตัวเลือกบนฟอร์ม → role_id ใน Data_Set.xlsx
    'R07': {'key': 'ai_ml', 'label_th': 'วิศวกร AI / Machine Learning', 'icon': 'brain'},
    'R15': {'key': 'network', 'label_th': 'วิศวกรเครือข่าย', 'icon': 'network'},
    'R19': {'key': 'it_pm', 'label_th': 'ผู้จัดการโครงการไอที', 'icon': 'kanban'},
    'R20': {'key': 'it_mgr', 'label_th': 'ผู้จัดการฝ่ายไอที', 'icon': 'building'},
}
# DEC-59 · ข้อกำหนดเชิงปฏิบัติ (hands-on): ต้องเห็นว่าผู้สมัคร "ลงมือทำเอง" จึงนับเป็นหลักฐานเต็ม · คำนำหน้า element_id ตามโครงสร้าง O*NET
HANDS_ON_PREFIX = ('2.C.3.', '2.C.4.', '2.C.9.', '2.A.1.e', '2.B.3.', '2.B.4.g', '2.B.4.h', '4.A.1.b.2', '4.A.3.b.1', '4.A.3.b.5')
TASK_MIN_ACTOR = {'R07': 'performed', 'R15': 'performed', 'R19': 'led', 'R20': 'led'}  # อาชีพเชิงเทคนิคต้อง performed · อาชีพบริหารรับ led
H_TECH_N = 10   # H ใช้เทคโนโลยีที่ตลาดต้องการ 10 รายการแรก · ถ้าอาชีพมีน้อยกว่านี้ → "ข้อมูลไม่พอ"
APPROVED = {'source_checked_by_script', 'expert_reviewed'}
L1 = 'L1_researcher_tagged'


def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        h.update(f.read())
    return h.hexdigest()


def sheet(wb, name):
    it = wb[name].iter_rows(values_only=True)
    hdr = next(it)
    return [dict(zip(hdr, r)) for r in it if r and r[0] is not None]


def num(x, d=0.0):
    try:
        return float(x)
    except (TypeError, ValueError):
        return d


def main():
    wb = openpyxl.load_workbook(DATASET, read_only=True, data_only=True)
    rd = lambda n: list(csv.DictReader(open(os.path.join(ROOT, 'data', n), encoding='utf-8')))
    rtasks, rtech, links = rd('role_tasks.csv'), rd('role_technology.csv'), rd('skill_links.csv')
    master = {r['role_id']: r for r in sheet(wb, '01_Role_Master')}
    tasks = sheet(wb, '05_Role_Tasks')
    tech = sheet(wb, '04_Role_Technology')
    titles = sheet(wb, '06_Role_Job_Titles')
    edu = sheet(wb, '07_Role_Education')

    req_path = os.path.join(ROOT, 'data/requirements.csv')
    reqs = [r for r in csv.DictReader(open(req_path, encoding='utf-8')) if r['role_id'] in ROLES]
    all_reqs = list(csv.DictReader(open(req_path, encoding='utf-8')))
    n_roles = len({r['role_id'] for r in all_reqs})
    df = collections.Counter(r['element_id'] for r in all_reqs)  # จำนวนอาชีพที่มีองค์ประกอบนี้ใน Top-30 (ความเฉพาะ · D2)
    corpus = [r for r in csv.DictReader(open(os.path.join(ROOT, 'data/corpus.csv'), encoding='utf-8')) if r['role_id'] in ROLES]
    review = {r['map_id']: r for r in csv.DictReader(open(os.path.join(ROOT, 'data/mapping_review.csv'), encoding='utf-8'))}
    maps = [m for m in csv.DictReader(open(os.path.join(ROOT, 'data/mappings.csv'), encoding='utf-8')) if m['role_id'] in ROLES]
    approved = [m for m in maps if m['map_id'] in review and review[m['map_id']]['mapping_status'] in APPROVED
                and review[m['map_id']]['coverage_layer'] == L1]
    cover = {}
    for m in approved:
        cover.setdefault(m['item_id'], set()).add(m['requirement_id'])

    out = {'meta': {
        'built_at': datetime.datetime.now().isoformat(timespec='seconds'),
        'onet_version': 'O*NET 31.0 Database (August 2026 Release) · CC BY 4.0',
        'snapshot_version': reqs[0]['snapshot_version'],
        'corpus_version': corpus[0]['corpus_version'],
        'sha256': {
            'Data_Set.xlsx': sha(DATASET), 'requirements.csv': sha(req_path),
            'corpus.csv': sha(os.path.join(ROOT, 'data/corpus.csv')),
            'mappings.csv': sha(os.path.join(ROOT, 'data/mappings.csv')),
            'mapping_review.csv': sha(os.path.join(ROOT, 'data/mapping_review.csv')),
        },
        'policy': 'Top-30 ต่ออาชีพ (IM ≥ 3.0 · 4 โดเมน · ไม่รวม Abilities) · น้ำหนักตามสมการ 3.1 · ความเชื่อมโยงเฉพาะ L1 ที่ผ่านตรวจ',
    }, 'roles': {}}

    for rid, ui in ROLES.items():
        m = master[rid]
        rq = sorted([r for r in reqs if r['role_id'] == rid], key=lambda r: int(r['rank_in_role']))
        assert len(rq) == 30, (rid, len(rq))
        t = sorted([x for x in tasks if x['role_id'] == rid], key=lambda x: -num(x['task_importance_im']))
        tc = [x for x in tech if x['role_id'] == rid and x['hot_technology'] == 'Y']
        tc.sort(key=lambda x: (x['in_demand'] != 'Y', x['technology_example']))
        seen, hot = set(), []
        for x in tc:
            if x['technology_example'] not in seen:
                seen.add(x['technology_example'])
                hot.append({'name': x['technology_example'], 'category': x['technology_category'], 'in_demand': x['in_demand'] == 'Y'})
        jt = [x['short_title'] or x['job_title'] for x in titles if x['role_id'] == rid]
        jt = list(dict.fromkeys(jt))
        ed = sorted([x for x in edu if x['role_id'] == rid and num(x['percent_of_respondents']) > 0],
                    key=lambda x: -num(x['percent_of_respondents']))
        items = []
        for c in corpus:
            if c['role_id'] != rid or c['verification_status'] != 'verified' or num(c['estimated_hours']) <= 0:
                continue
            cov = sorted(cover.get(c['item_id'], []))
            items.append({
                'id': c['item_id'], 'type': c['item_type'], 'title': c['title'], 'provider': c['provider'],
                'platform': c['platform'], 'url': c['source_url'], 'credential': c['credential_type'],
                'level': c['level'], 'difficulty': int(num(c['difficulty_1_5'], 0)), 'delivery': c['delivery_mode'],
                'language': c['language'], 'outcome_th': c['learning_outcomes_th'],
                'skills': [s for s in c['skills_taught'].split('|') if s][:6],
                'tools': [s for s in c['tools_technologies'].split('|') if s][:6],
                'hours': num(c['estimated_hours']), 'cost_cat': c['cost_category'],
                'cost_usd': num(c['cost_amount_usd'], 0), 'exam_code': c['exam_code'],
                'validity_years': c['validity_years'], 'prereq': c['prerequisites'], 'phase': c['phase'],
                'modes': [s for s in c['recommendation_mode'].split('|') if s], 'portfolio': c['produces_portfolio_artifact'] == 'yes',
                'tier': c['global_recognition_tier'], 'verified_on': c['verification_date'],
                'covers_l1': cov,
            })
        out['roles'][rid] = {
            'role_id': rid, 'key': ui['key'], 'label_th': ui['label_th'], 'icon': ui['icon'],
            'name_th': m['role_name_th'], 'name_en': m['role_name_en'], 'track_th': m['track_th'],
            'soc': m['onet_soc_code'], 'onet_title': m['onet_title'], 'mapping_type': m['mapping_type'],
            'mapping_note_th': m['mapping_rationale_th'] or '', 'job_zone': int(num(m['job_zone'])),
            'job_zone_name': m['job_zone_name'], 'svp': m['svp_range'], 'description': m['onet_description'],
            'education_modal': m['typical_education_modal'], 'education_pct': num(m['typical_education_pct']),
            'counts': {k: m[k] for k in ['n_competencies_total', 'n_competencies_im_ge_3', 'n_tasks', 'n_software',
                                         'n_hot_technology', 'n_in_demand_technology', 'n_job_titles']},
            'requirements': [{
                'id': r['requirement_id'], 'domain': r['domain'], 'element_id': r['element_id'],
                'name': r['element_name'], 'desc': r['element_description'], 'im': num(r['importance_im']),
                'lv': num(r['level_lv']), 'rank': int(r['rank_in_role']), 'w': num(r['weight_renormalized']),
                'aliases': r['element_aliases'],
                'df': df[r['element_id']], 'idf': round(math.log((n_roles + 1) / (df[r['element_id']] + 0.5)), 4),
                'hands_on': r['element_id'].startswith(HANDS_ON_PREFIX),
            } for r in rq],
            'n_roles': n_roles, 'task_min_actor': TASK_MIN_ACTOR[rid],
            'tasks': [{'task': x['task'], 'im': num(x['task_importance_im']), 'type': x['task_type']} for x in t[:6]],
            'hot_tech': hot[:18],
            'job_titles': jt[:10],
            'education': [{'level': x['education_level'], 'pct': num(x['percent_of_respondents'])} for x in ed[:4]],
            'items': items,
            # DEC-55: งานหลัก 8 งาน (ใช้ประเมิน T) และเทคโนโลยีที่ตลาดต้องการพร้อมคำค้น (ใช้นับ H)
            'signal_tasks': [{'task_id': x['task_id'], 'task_text': x['task_text']} for x in rtasks if x['role_id'] == rid],
            'signal_tech': [{'technology': x['technology'], 'match_keys': x['match_keys']} for x in rtech if x['role_id'] == rid][:H_TECH_N],
            'signal_tech_available': len([x for x in rtech if x['role_id'] == rid]),
        }
    out['skill_links'] = [{'skill_element_id': x['skill_element_id'], 'activity_element_id': x['activity_element_id']} for x in links]
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=None, separators=(',', ':'))
    for rid, r in out['roles'].items():
        n_cov = sum(1 for i in r['items'] if i['covers_l1'])
        print(rid, r['name_en'], '| req', len(r['requirements']), '| items', len(r['items']), '(with L1', n_cov, ')',
              '| tasks', len(r['tasks']), '| hot', len(r['hot_tech']), '| T', len(r['signal_tasks']), '| H', len(r['signal_tech']))
    print('->', OUT, os.path.getsize(OUT), 'bytes')


if __name__ == '__main__':
    main()
