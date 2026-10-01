#!/usr/bin/env python3
"""make_sample_resumes.py — เรซูเมสมมติ (fictional) สำหรับซ้อม Demo 4 อาชีพ + ไฟล์สแกน 1 ไฟล์ (ทดสอบเส้นทาง OCR)
ทุกชื่อ/อีเมล/เบอร์เป็นข้อมูลสมมติ (.test) ไม่ใช่บุคคลจริง
ใช้: python demo/make_sample_resumes.py demo/samples
"""
import os, sys, subprocess
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfgen import canvas

OUT = sys.argv[1] if len(sys.argv) > 1 else 'samples'
os.makedirs(OUT, exist_ok=True)

R = {
 'AI_ML_Engineer': {
  'name': 'Narin Example', 'title': 'Data Analyst | Aspiring Machine Learning Engineer',
  'contact': 'narin.example@mail.test | +66 81 555 0101 | github.com/narin-example',
  'summary': 'Data analyst with 4 years of experience turning business data into models and dashboards. Looking to move into a machine learning engineering role.',
  'exp': [('Data Analyst, Example Retail Co., Ltd.', '2022 - present', [
      'Built a customer churn prediction model in Python with scikit-learn and pandas; improved retention campaign targeting by 18%.',
      'Designed and deployed a FastAPI service on AWS EC2 that serves the churn model to the CRM team.',
      'Wrote SQL queries and ETL jobs to clean, aggregate and validate sales data from four source systems.',
      'Analyzed A/B test results with statistical hypothesis testing and presented findings to the marketing director.',
      'Documented data pipelines and model assumptions so other analysts could reproduce the work.']),
    ('Junior Business Analyst, Example Logistics', '2020 - 2022', [
      'Created Power BI dashboards that tracked delivery KPIs for 12 regional managers.',
      'Gathered requirements from operations users and translated them into report specifications.'])],
  'edu': ['B.Sc. Statistics, Example University, 2020'],
  'skills': 'Python, pandas, scikit-learn, SQL, Power BI, FastAPI, Git, AWS EC2, basic TensorFlow',
  'certs': ['AWS Certified Cloud Practitioner (2023)', 'Google Data Analytics Professional Certificate (2021)'],
 },
 'Network_Engineer': {
  'name': 'Pimchanok Sample', 'title': 'Network Administrator',
  'contact': 'pimchanok.sample@mail.test | 089 555 0202 | linkedin.com/in/pimchanok-sample',
  'summary': 'Network administrator with 5 years of experience operating campus LAN/WAN for a 900-user organization.',
  'exp': [('Network Administrator, Example Hospital Group', '2021 - present', [
      'Configured Cisco Catalyst switches, VLANs and inter-VLAN routing for three hospital buildings.',
      'Maintained FortiGate firewall rules and site-to-site IPsec VPN tunnels between five branches.',
      'Monitored network performance with PRTG and resolved outages, reducing mean time to repair by 30%.',
      'Upgraded the core network and documented the topology diagrams, IP plan and change procedures.',
      'Trained helpdesk staff on first-level troubleshooting of Wi-Fi and LAN problems.']),
    ('IT Support Officer, Example School', '2019 - 2021', [
      'Installed and repaired desktop computers, printers and wireless access points.',
      'Set up user accounts in Active Directory and managed backups of file servers.'])],
  'edu': ['B.Eng. Computer Engineering, Example Institute of Technology, 2019'],
  'skills': 'Cisco IOS, VLAN, OSPF, FortiGate, IPsec VPN, PRTG, Windows Server, Active Directory, Linux basics',
  'certs': ['Cisco Certified Network Associate (CCNA) - 2022', 'Fortinet NSE 4 (2023)'],
 },
 'IT_Project_Manager': {
  'name': 'Thanakorn Mock', 'title': 'Senior Software Developer / Team Lead',
  'contact': 'thanakorn.mock@mail.test | +66 82 555 0303 | www.example.test/thanakorn',
  'summary': 'Software developer with 7 years of experience who now leads a delivery team of six engineers and wants to grow into IT project management.',
  'exp': [('Team Lead, Example Fintech Co., Ltd.', '2021 - present', [
      'Planned two-week sprints in Jira, assigned tasks to six engineers and tracked progress against release dates.',
      'Coordinated with product owners and business stakeholders to clarify scope and prioritize the backlog.',
      'Delivered a mobile banking feature set on schedule within a budget of 4.2 million baht.',
      'Identified project risks and escalated blockers in weekly status meetings with management.',
      'Reviewed code and mentored two junior developers on testing practices.']),
    ('Software Developer, Example Software House', '2018 - 2021', [
      'Developed REST APIs in Java Spring Boot and PostgreSQL for e-commerce clients.',
      'Wrote technical documentation and user manuals for client handover.'])],
  'edu': ['B.Sc. Computer Science, Example University, 2018'],
  'skills': 'Jira, Confluence, Scrum, Java, Spring Boot, PostgreSQL, Microsoft Excel, Microsoft Project',
  'certs': ['Professional Scrum Master I (PSM I) - 2022'],
 },
 'IT_Manager': {
  'name': 'Siriporn Example', 'title': 'IT Project Manager',
  'contact': 'siriporn.example@mail.test | 02 555 0404 | linkedin.com/in/siriporn-example',
  'summary': 'IT project manager with 10 years of experience in manufacturing, aiming for an IT manager position responsible for the whole IT department.',
  'exp': [('IT Project Manager, Example Manufacturing PCL', '2019 - present', [
      'Managed the ERP upgrade project with a budget of 15 million baht and a team of 12 internal staff and vendors.',
      'Negotiated vendor contracts and service level agreements for cloud hosting and helpdesk outsourcing.',
      'Prepared the annual IT budget and presented investment proposals to the executive committee.',
      'Wrote the information security policy and coordinated the first ISO 27001 gap assessment.',
      'Led the disaster recovery test for core systems and reported results to the audit committee.']),
    ('System Analyst, Example Bank', '2015 - 2019', [
      'Analyzed business requirements and designed workflows for the loan approval system.',
      'Supervised user acceptance testing with 40 business users.'])],
  'edu': ['M.Sc. Information Technology Management, Example Institute, 2017', 'B.B.A. Information Systems, Example University, 2014'],
  'skills': 'ERP (SAP), ITIL, vendor management, budgeting, risk management, Microsoft Project, Power BI',
  'certs': ['ITIL 4 Foundation (2020)', 'PMP preparation course (2023)'],
 },
}


def draw(c, d):
    W, H = A4
    c.setFillColor(colors.HexColor('#1e293b')); c.rect(0, H - 34 * mm, W, 34 * mm, stroke=0, fill=1)
    c.setFillColor(colors.white); c.setFont('Helvetica-Bold', 20); c.drawString(18 * mm, H - 16 * mm, d['name'])
    c.setFont('Helvetica', 11); c.drawString(18 * mm, H - 23 * mm, d['title'])
    c.setFont('Helvetica', 9); c.drawString(18 * mm, H - 29 * mm, d['contact'])
    y = H - 44 * mm
    def head(t):
        nonlocal y
        c.setFillColor(colors.HexColor('#4338ca')); c.setFont('Helvetica-Bold', 11); c.drawString(18 * mm, y, t.upper())
        c.setStrokeColor(colors.HexColor('#c7d2fe')); c.line(18 * mm, y - 2, W - 18 * mm, y - 2); y -= 7 * mm
        c.setFillColor(colors.HexColor('#0f172a'))
    def para(t, font='Helvetica', size=9.5, indent=0, bullet=False):
        nonlocal y
        from reportlab.lib.utils import simpleSplit
        lines = simpleSplit(t, font, size, W - 36 * mm - indent - (4 * mm if bullet else 0))
        c.setFont(font, size)
        for i, ln in enumerate(lines):
            x = 18 * mm + indent
            if bullet and i == 0: c.drawString(x, y, '-')
            c.drawString(x + (4 * mm if bullet else 0), y, ln); y -= 4.6 * mm
        y -= 1 * mm
    head('Summary'); para(d['summary'])
    head('Experience')
    for role, years, bullets in d['exp']:
        c.setFont('Helvetica-Bold', 10); c.drawString(18 * mm, y, role); c.setFont('Helvetica', 9); c.drawRightString(W - 18 * mm, y, years); y -= 5.5 * mm
        for b in bullets: para(b, bullet=True, indent=2 * mm)
        y -= 1.5 * mm
    head('Education')
    for e in d['edu']: para(e)
    head('Skills'); para(d['skills'])
    head('Certifications')
    for e in d['certs']: para(e, bullet=True, indent=2 * mm)
    c.setFont('Helvetica-Oblique', 7.5); c.setFillColor(colors.HexColor('#64748b'))
    c.drawString(18 * mm, 10 * mm, 'Fictional sample resume for the IS 68076026 demo - not a real person.')


for key, d in R.items():
    p = os.path.join(OUT, 'resume_' + key + '.pdf')
    c = canvas.Canvas(p, pagesize=A4); c.setTitle('Sample resume ' + key); draw(c, d); c.showPage(); c.save()
    print('->', p)

# ไฟล์สแกน: แปลง PDF ของ AI/ML เป็นรูป (PNG) และ PDF ที่ไม่มี text layer → บังคับเส้นทาง Gemini OCR
src = os.path.join(OUT, 'resume_AI_ML_Engineer.pdf')
png_base = os.path.join(OUT, 'resume_AI_ML_Engineer_scan')
subprocess.run(['pdftoppm', '-png', '-r', '110', '-singlefile', src, png_base], check=True)
try:
    from PIL import Image
    im = Image.open(png_base + '.png').convert('RGB')
    im.save(os.path.join(OUT, 'resume_AI_ML_Engineer_scanned.pdf'), 'PDF', resolution=110)
    print('->', os.path.join(OUT, 'resume_AI_ML_Engineer_scanned.pdf'))
except Exception as e:
    print('skip scanned pdf:', e)
print('->', png_base + '.png')
