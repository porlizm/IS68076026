# ⛔ ไม่ใช้งาน · ห้ามนำเข้า n8n

ชุด 5 workflow เดิม (DEC-30) ย้ายมาเก็บที่นี่เมื่อ 1 ต.ค. 2569 (DEC-38) เพราะใช้ `workflows/WF_Final_IS.json` ไฟล์เดียวแทนแล้ว (DEC-37)

- ไฟล์ที่ใช้งานจริง: `workflows/WF_Final_IS.json`
- ห้ามนำเข้าไฟล์ในโฟลเดอร์นี้พร้อม WF_Final_IS (Google Sheets Trigger สองตัวจะอ่านแถวเดียวกันซ้ำ)
- ไฟล์ในนี้เป็นสำเนา ณ วันที่ย้าย ถ้าแก้ engine หรือ `workflows/src/` แล้วต้องการชุด 5 ไฟล์ล่าสุดเพื่อย้อนกลับ ให้สร้างใหม่:
  `node scripts/build_workflows.mjs --legacy <โฟลเดอร์ปลายทาง>` (ห้ามใช้ `workflows/`)
