# ชุดทดสอบ S6 ใน n8n 2.39.9 จริง (DEC-48)

เครื่องมือที่ใช้สร้าง `evidence/n8n_test_01OCT26.md` · รันบน Linux (คลาวด์ของ Claude) 1 ต.ค. 2569 · **ไม่ใช่บริการจริง**

| ไฟล์ | หน้าที่ |
|---|---|
| `mock_server.mjs` | บริการจำลอง HTTPS (127.0.0.2:443): OAuth token · Sheets v4 (values get/append/batchUpdate · spreadsheets get/batchUpdate) · Drive v3 (download · multipart · resumable · export · delete) · Gmail send · Document AI · OpenAI/Anthropic/Gemini (ตอบจาก `synthetic/case_*/mock_responses/`) · OCR ในเครื่อง · control API http://127.0.0.1:8999 (`/form` `/faults` `/state` `/reset`) |
| `hosts.n8n` + `run_n8n.sh` | รัน n8n ใน mount namespace ของตัวเอง แล้ว bind `/etc/hosts` เฉพาะ process ให้โดเมนจริงชี้บริการจำลอง (ไม่แตะ /etc/hosts ของเครื่อง) |
| `reimport.sh` | หยุด n8n → `n8n import:workflow` → เริ่ม n8n → activate (นำเข้าขณะ server ทำงานทำให้ poller ซ้อน) |
| `h.py` · `s6_suite.py` | ส่งแถวแบบฟอร์ม · ตั้ง fault · รอ poll · อ่าน execution จาก public API · ตรวจแถวทุกแท็บ/ไฟล์/อีเมล → `s6_results.json` |
| `make_report.py` | `s6_results.json` → `evidence/n8n_test_01OCT26.md` + `evidence/n8n_test_summary.json` (book_numbers อ่านไฟล์นี้) |

## ตั้งค่า (ย่อ)
1. Node 24 + `npm i n8n@2.39.9` (ต้องมี header ของ Node สำหรับ isolated-vm: `npm_config_nodedir=<node24>`)
2. CA ทดสอบ: `openssl req -x509 ... -out ca.crt` แล้วออกใบรับรองเซิร์ฟเวอร์ที่มี SAN ของทุกโดเมนใน `hosts.n8n` · n8n ใช้ `NODE_EXTRA_CA_CERTS=ca.crt` · คีย์บัญชีบริการทดสอบ `openssl genrsa` (ไม่เก็บใน repo)
3. env ของ n8n ตาม `config/env_template.env` + ค่าทดสอบ (SHEET_ID=SHEET_IS68_TEST, DRIVE_*_FOLDER_ID, MODEL_*_ID, คีย์ปลอม) · `N8N_LISTEN_ADDRESS=127.0.0.1`
4. owner + API key ผ่าน `/rest/owner/setup` และ `/rest/api-keys` · credential 4 ชุดนำเข้าด้วย id `CRED_*` ตรงกับ workflow (googleApi เปิด httpNode + scope)
5. `node mock_server.mjs` → `reimport.sh workflows/WF_IS_68076026_01OCT26.json is68Single000001` → รอ poll แรก → `python3 s6_suite.py` → `python3 make_report.py`

พาธในสคริปต์เป็นของเครื่องทดสอบ (`/home/claude/...`) แก้ตามเครื่องที่ใช้
