# ผลเปิด URL ค้างตรวจด้วยเบราว์เซอร์ · 1 ต.ค. 2569 (Phase 1.2)

> Claude เปิดทุก URL ใน `data/url_manual_check.csv` ด้วย Browser pane ของ Claude desktop (และ WebFetch 1 รายการ) แล้วบันทึกผลในคอลัมน์ `note`
> **ไม่ได้กรอก `researcher_result`** · ตามกติกา DEC-16 ผู้วิจัยต้องเปิดดูเองแล้วกรอก LIVE/DEAD (+ corrected_url) ก่อนรายการจะนับได้
> ภาพหน้าจอ: ⏳ เครื่องมือเบราว์เซอร์ใน session นี้บันทึกภาพเป็นไฟล์ไม่ได้ ผู้วิจัยแคปตอนตรวจด้วยตาแล้ววางในโฟลเดอร์นี้

สรุป: ยืนยันไม่ได้ 8 · เปลี่ยนชื่อ 5 · ไม่พบหน้า 4 · ตรงชื่อ 3 · URL ไม่เจาะจง 3 · ตรงชื่อ (redirect) 3 · ตรงชื่อ (URL ใหม่) 2

| URL เดิม | รายการ | ผล | สิ่งที่เห็น | URL ที่พบ (ให้ผู้วิจัยตัดสิน) |
|---|---|---|---|---|
| https://academy.tricentis.com/ | CRT-R04-09 | ยืนยันไม่ได้ | redirect ไปหน้า login ของ Tricentis Support Hub ต้องมีบัญชี |  |
| https://certification-learning.hpe.com/tr/datasheet/certification/ACA-Switch | CRT-R15-10 | ตรงชื่อ | title: HPE Aruba Networking Certified Associate - Switching | Certification and Learning |  |
| https://education.oracle.com/oracle-certification-path/pFamily_48 | CRT-R01-04|CRT-R03-01 | ยืนยันไม่ได้ | Oracle University แจ้งปิดปรับปรุงเว็บ (maintenance) ต้องเปิดซ้ำ |  |
| https://education.oracle.com/oracle-database-administration-2019-certified-professional/trackp_DBA19OCP | CRT-R10-02 | ยืนยันไม่ได้ | Oracle University ปิดปรับปรุงเว็บ ต้องเปิดซ้ำ |  |
| https://education.oracle.com/oracle-database-sql/pexam_1Z0-071 | CRT-R10-03 | ยืนยันไม่ได้ | Oracle University ปิดปรับปรุงเว็บ ต้องเปิดซ้ำ |  |
| https://isqi.org/en/certification/a4q-selenium-tester-foundation | CRT-R04-08 | ไม่พบหน้า | 404 Page not found |  |
| https://learn.getdbt.com/ | CRS-R08-08 | URL ไม่เจาะจง | หน้าแรก redirect ไป catalog · พบหน้าคอร์ส dbt Fundamentals (dbt Studio) ระบุ approximately 5.0 hours | https://learn.getdbt.com/courses/dbt-fundamentals |
| https://learn.mongodb.com/pages/mongodb-associate-database-administrator-exam | CRT-R10-04 | เปลี่ยนชื่อ | redirect ไป MongoDB Database Administrator Exam (ไม่มีคำว่า Associate) ต้องตัดสินว่ายังเป็นรายการเดิมหรือไม่ | https://learn.mongodb.com/pages/mongodb-database-administrator-exam |
| https://learn.mongodb.com/pages/mongodb-associate-developer-exam | CRT-R02-10 | ตรงชื่อ | title: MongoDB Associate Developer Course Exam | MongoDB University |  |
| https://learningportal.juniper.net/ | CRS-R15-05 | URL ไม่เจาะจง | หน้าแรก HPE Networking Training Portal ยังไม่พบหน้าคอร์ส Introduction to Junos |  |
| https://nowlearning.servicenow.com/ | CRS-R18-09 | URL ไม่เจาะจง | redirect ไป learning.servicenow.com หน้าแรก (ServiceNow University) ยังไม่พบหน้าคอร์ส |  |
| https://www.accessibilityassociation.org/s/certified-professional | CRT-R05-04 | ตรงชื่อ (redirect) | redirect ไป /cpacc · หัวข้อ Certified Professional in Accessibility Core Competencies (CPACC) | https://www.accessibilityassociation.org/cpacc |
| https://www.accessibilityassociation.org/s/wascertification | CRT-R02-05|CRT-R05-05 | ตรงชื่อ (redirect) | redirect ไป /was-exam · หัวข้อ Web Accessibility Specialist (WAS) | https://www.accessibilityassociation.org/was-exam |
| https://www.cloudskillsboost.google/paths/34 | CRS-R12-08 | ยืนยันไม่ได้ | redirect ไป www.skills.google (เปลี่ยนชื่อเป็น Google Skills) ยังไม่พบ learning path เดิม |  |
| https://www.coursera.org/specializations/website-development | CRS-R02-07 | ไม่พบหน้า | redirect กลับหน้าแรก Coursera (น่าจะปิดรายการแล้ว) · ค้นชื่อแล้วไม่พบ specialization เดิม |  |
| https://www.istqb.org/certifications/performance-testing | CRT-R04-04 | ไม่พบหน้า | 404 · หน้ารายการใบรับรองลิงก์ไป URL ใหม่ | https://istqb.org/certifications/certified-tester-performance-testing-ct-pt/ |
| https://www.juniper.net/us/en/training/certification.html | CRT-R15-05 | ตรงชื่อ (redirect) | redirect ไป Certification Program Overview ใน learningportal.juniper.net · มีคำว่า JNCIA-Junos | https://learningportal.juniper.net/juniper/user_activity_info.aspx?id=14346 |
| https://www.netacad.com/courses/switching-routing-wireless-essentials | CRS-R15-04 | ยืนยันไม่ได้ | หน้าแสดง Oh no, Something went wrong (SPA โหลดไม่สำเร็จ) ต้องเปิดซ้ำ |  |
| https://www.offsec.com/courses/web-200/ | CRT-R13-02 | ตรงชื่อ | WEB-200: Web Attacks with Kali Linux → OSWA · starting at $1,749 · 173h of content (WebFetch) |  |
| https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL | CRT-R20-05|CRS-R20-06 | ยืนยันไม่ได้ | HTTP 500 จาก PeopleCert ต้องเปิดซ้ำหรือหา URL ใหม่ |  |
| https://www.peoplecert.org/browse-certifications/project-programme-and-portfolio-management/PRINCE2 | CRT-R19-04|CRT-R19-05|CRS-R19-08 | ยืนยันไม่ได้ | HTTP 500 จาก PeopleCert ต้องเปิดซ้ำหรือหา URL ใหม่ |  |
| https://www.redhat.com/en/services/certification/rhce | CRT-R17-08 | เปลี่ยนชื่อ | redirect ไปหน้ารวมใบรับรอง · RHCE แสดงเป็น Red Hat Certified Engineer in Enterprise Linux / EX294 | https://www.redhat.com/en/services/certification/red-hat-certified-engineer-in-enterprise-linux |
| https://www.scrum.org/assessments/professional-scrum-developer-i-assessment | CRT-R01-10|CRT-R03-09|CRT-R04-10 | เปลี่ยนชื่อ | 404 · หน้าใหม่ชื่อ Professional Scrum Developer Certification (ไม่มี I) $200 60 นาที | https://www.scrum.org/assessments/professional-scrum-developer-certification |
| https://www.scrum.org/assessments/professional-scrum-master-i-assessment | CRT-R19-07 | ตรงชื่อ (URL ใหม่) | 404 · หน้าใหม่ Professional Scrum Master I Certification $200 60 นาที | https://www.scrum.org/assessments/professional-scrum-master-i-certification |
| https://www.scrum.org/assessments/professional-scrum-product-owner-i-assessment | CRT-R05-10|CRT-R18-10 | ตรงชื่อ (URL ใหม่) | 404 · หน้าใหม่ Professional Scrum Product Owner I Certification $200 60 นาที | https://www.scrum.org/assessments/professional-scrum-product-owner-i-certification |
| https://www.tableau.com/learn/certification/certified-data-analyst | CRT-R09-03 | เปลี่ยนชื่อ | redirect ไป Trailhead Academy: Salesforce Certified Tableau Data Analyst (DA-201) | https://trailheadacademy.salesforce.com/certificate/exam-tableau-data-analyst---Analytics-DA-201 |
| https://www.tableau.com/learn/certification/desktop-specialist | CRT-R09-04 | เปลี่ยนชื่อ | redirect ไป Salesforce Certified Tableau Desktop Foundations (Analytics-101) ชื่อเดิม Desktop Specialist | https://trailheadacademy.salesforce.com/certificate/exam-tableau-desktop-found---Analytics-101 |
| https://www.udacity.com/course/build-native-mobile-apps-with-flutter--ud905 | CRS-R03-06 | ไม่พบหน้า | redirect ไปหน้ารวม School of Programming (น่าจะปิดคอร์สแล้ว) |  |
