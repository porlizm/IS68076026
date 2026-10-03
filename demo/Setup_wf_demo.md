# Setup WF_Demo · ติดตั้งและตั้งค่า n8n ในเครื่องจนรัน Demo ได้

> IS 68076026 · Skill-Gap Navigator (Demo รอบที่ 1 สำหรับคณะกรรมการ · DEC-39)
> ฉบับ 3 ต.ค. 2569 · ใช้กับ **macOS (Apple silicon) · Node.js 24 · n8n 2.39.9** · Windows ดูหัวข้อ 11
> เอกสารคู่กัน: `demo/README_Demo.md` (โครงสร้าง workflow · ลำดับโชว์ · ข้อจำกัด) · สคริปต์: `demo/run_demo_mac.sh`

---

## 0. ภาพรวม

```
[1] Node.js 24 ──▶ [2] Gemini API key ──▶ [3] run_demo_mac.sh ──▶ [4] บัญชีเจ้าของ n8n
                                            (n8n + credential +        │
                                             import + publish)         ▼
                     [6] ทดสอบ ◀── [5] Google Drive OAuth (ทางเลือก)
                         │
                         ▼
              http://localhost:5678/webhook/is-demo  ✔
```

| ขั้น | ทำครั้งเดียว/ทุกครั้ง | เวลาโดยประมาณ | จำเป็นไหม |
|---|---|---|---|
| 1 ติดตั้ง Node.js 24 | ครั้งเดียว | 5 นาที | จำเป็น |
| 2 สร้าง Gemini API key | ครั้งเดียว | 3 นาที | แนะนำ (ไม่มีก็รันได้ด้วยกฎสำรอง แต่อ่านไฟล์สแกนไม่ได้) |
| 3 รันสคริปต์ | ทุกครั้งที่เปิด Demo | ครั้งแรก 3–8 นาที · ครั้งต่อไป ~30 วินาที | จำเป็น |
| 4 ตั้งบัญชีเจ้าของ n8n | ครั้งเดียว | 1 นาที | จำเป็นถ้าจะเปิด editor (ดู canvas · แก้ credential) |
| 5 Google Drive OAuth | ครั้งเดียว (ต่ออายุทุก 7 วัน) | 15 นาที | เฉพาะถ้าจะโชว์ปุ่ม "บันทึกลง Google Drive" |
| 6 ทดสอบ | ทุกครั้งก่อนโชว์ | 5 นาที | จำเป็น |

**สิ่งที่ต้องมี** MacBook ที่ clone `Final_IS` แล้ว (อยู่ที่ `~/Documents/Final_IS`) · อินเทอร์เน็ต · บัญชี Google · พื้นที่ว่าง ~1.5 GB

---

## 1. ติดตั้ง Node.js 24

n8n 2.39.9 ประกาศ `engines: node >=24.0.0` ถ้าใช้ Node 22 จะขึ้น *"Your Node.js version … is currently not supported"* และไม่ยอมเริ่ม

ตรวจรุ่นที่มีอยู่:

```bash
node -v        # ต้องได้ v24.x.x
```

ถ้าไม่มีหรือต่ำกว่า 24 เลือกวิธีใดวิธีหนึ่ง

| วิธี | คำสั่ง / ขั้นตอน |
|---|---|
| **ก. ตัวติดตั้งทางการ (ง่ายสุด)** | เปิด https://nodejs.org → ดาวน์โหลด **LTS 24.x** สำหรับ macOS (.pkg) → ติดตั้ง → ปิดแล้วเปิด Terminal ใหม่ |
| ข. Homebrew | `brew install node@24` แล้ว `brew link --overwrite --force node@24` |
| ค. nvm (มีหลายโปรเจกต์) | `nvm install 24 && nvm use 24` |

> ใช้ **24** ตามค่าคงที่ของโครงการ (CLAUDE.md: n8n 2.39.9 / Node 24) ไม่ใช่รุ่นที่ใหม่กว่า · ไลบรารี `isolated-vm` ที่ n8n ใช้มีไฟล์คอมไพล์สำเร็จรูปสำหรับ macOS arm64 + Node 24 จึงไม่ต้องลง Xcode

ตรวจอีกครั้ง: `node -v` → `v24.x.x` และ `npx -v` ต้องตอบเลขรุ่นได้

---

## 2. สร้าง Gemini API key

Demo เรียก Gemini สามจุด: **Gemini Analyst** (วิเคราะห์ 30 ข้อกำหนด + งานหลัก 8 งาน · `ANALYST_RUNS` = 3 รอบ) · **Gemini Verifier** (ตรวจความหมายของข้อความที่คำไม่ตรง · R3b · DEC-51/58) และ **Gemini OCR** (อ่านไฟล์สแกน/รูป) · หนึ่งเรซูเมใช้ราว 4 คำขอ

1. เปิด https://aistudio.google.com/apikey → ล็อกอินบัญชี Google
2. กด **Create API key** → เลือกหรือสร้าง Google Cloud project → คัดลอกคีย์
3. เก็บคีย์ไว้ในตัวจัดการรหัสผ่าน **ห้ามใส่ในไฟล์ใน `Final_IS/`** (ไม่ commit ทั้ง `.env` และคีย์ใด ๆ)

ข้อควรรู้
- รุ่นโมเดลตั้งต้นของ Demo คือ `gemini-3.8-flash` (GA) ส่ง `thinkingLevel: low` และ **ไม่ส่ง temperature** ตามคำแนะนำของ Google สำหรับรุ่นนี้
- ระดับ thinking ที่รุ่นนี้รับ: `low` · `medium` · `high` (ค่า `minimal` จะได้ error)
- ฟรีเทียร์มีโควตาต่อนาที ถ้าโชว์ติดกันหลายรอบเร็ว ๆ อาจเจอ 429 (ดูหัวข้อ 10)

---

## 3. ติดตั้ง n8n + นำเข้า workflow ด้วยสคริปต์ (วิธีที่แนะนำ)

เปิด **Terminal** แล้วรัน:

```bash
bash ~/Documents/Final_IS/demo/run_demo_mac.sh
```

สคริปต์ทำ 5 อย่างตามลำดับ

| # | สคริปต์ทำอะไร | สิ่งที่เห็นบนจอ |
|---|---|---|
| 1 | ตรวจ Node ≥ 24 · ถ้าไม่มี `n8n` 2.39.9 ในเครื่อง จะใช้ `npx n8n@2.39.9` (ครั้งแรกดาวน์โหลด 3–8 นาที) | `✓ Node 24.x` |
| 2 | หยุดโปรแกรมที่ใช้พอร์ต 5678 อยู่ (นำเข้าด้วย CLI ขณะ n8n ทำงานทำให้ webhook ซ้อน) | `▶ พบโปรแกรมใช้พอร์ต 5678 …` (ถ้ามี) |
| 3 | สร้าง credential 2 ตัวที่ workflow อ้างถึง **เฉพาะตัวที่ยังไม่มี**: `Gemini API Key (x-goog-api-key)` (id `REPLACE_GEMINI_CRED`) และ `Google Drive OAuth2` (id `REPLACE_DRIVE_CRED`, ว่างไว้ก่อน) | ถามคีย์ → **วางคีย์แล้วกด Enter** (ตัวอักษรไม่แสดงบนจอ) · กด Enter เฉย ๆ = ข้าม |
| 4 | `import:workflow` → `publish:workflow` (id `is68WFDemo000001`) | `✓ publish แล้ว` |
| 5 | เริ่ม n8n (ฟังเฉพาะ 127.0.0.1) · รอจน webhook พร้อม · เปิดเบราว์เซอร์ | `✓ พร้อมแล้ว → http://localhost:5678/webhook/is-demo` |

ผลที่ถูกต้อง (ทดสอบแล้ว 3 ต.ค. 2569 บน n8n 2.39.9 + Node 24.21):

```
✓ Node 24.21.0
▶ นำเข้า credential
✓ credential พร้อม
▶ นำเข้า …/demo/WF_Demo.json
✓ publish แล้ว
▶ เริ่ม n8n (log: …/demo/n8n_demo.log)
✓ พร้อมแล้ว → http://localhost:5678/webhook/is-demo
```

**ปล่อยหน้าต่าง Terminal นี้เปิดไว้** ตลอดการใช้ Demo · ปิด n8n: กด `Ctrl+C`

ตัวเลือกของสคริปต์

| ต้องการ | คำสั่ง |
|---|---|
| เปลี่ยน Gemini API key | `RESET_GEMINI_KEY=1 bash ~/Documents/Final_IS/demo/run_demo_mac.sh` |
| ไม่ตรวจ credential เลย (เร็วขึ้น ~10 วินาที) | `SKIP_CREDS=1 bash …/run_demo_mac.sh` |
| ใช้พอร์ตอื่น | `PORT=5679 bash …/run_demo_mac.sh` (Drive OAuth ต้องใช้ redirect URL ตามพอร์ตนี้) |

> รันซ้ำได้ทุกครั้ง: credential ที่มีอยู่แล้ว (รวม Drive ที่เชื่อมบัญชีแล้ว) **จะไม่ถูกทับ** · workflow ถูกนำเข้าทับด้วย `WF_Demo.json` ล่าสุดเสมอ
> ข้อมูลของ n8n (ฐานข้อมูล SQLite · credential ที่เข้ารหัส · กุญแจเข้ารหัส) อยู่ที่ `~/.n8n/` นอกโฟลเดอร์ `Final_IS` จึงไม่เข้า git

### 3.1 ทำเองทีละคำสั่ง (ถ้าไม่อยากใช้สคริปต์)

```bash
cd ~/Documents/Final_IS
npx -y n8n@2.39.9 import:workflow --input=demo/WF_Demo.json
npx -y n8n@2.39.9 publish:workflow --id=is68WFDemo000001
N8N_LISTEN_ADDRESS=127.0.0.1 GENERIC_TIMEZONE=Asia/Bangkok npx -y n8n@2.39.9 start
```

จากนั้นสร้าง credential เองในหัวข้อ 4.2 · ต้องหยุด n8n ก่อนรัน `import:workflow` ทุกครั้ง

---

## 4. เปิด editor และตั้งบัญชีเจ้าของ n8n

### 4.1 บัญชีเจ้าของ (ครั้งแรกเท่านั้น)

1. เปิด http://localhost:5678
2. หน้า **Set up owner account** → กรอกอีเมล ชื่อ รหัสผ่านของคุณเอง → Next (ข้ามแบบสอบถามได้)
3. หน้า *Overview* ต้องเห็น workflow **WF_Demo · Skill-Gap Navigator (IS 68076026)** สถานะ Published

บัญชีนี้อยู่ในเครื่องเท่านั้น (ไม่ใช่บัญชี n8n cloud) · หน้า Demo ที่ `/webhook/is-demo` ใช้ได้แม้ยังไม่ตั้งบัญชี

### 4.2 ตรวจ credential Gemini

1. เมนูซ้าย **Overview → Credentials** → เปิด **Gemini API Key (x-goog-api-key)**
2. ต้องเป็นชนิด *Header Auth* · Name = `x-goog-api-key` · Value = คีย์ของคุณ (ถ้าข้ามตอนรันสคริปต์ ใส่คีย์ที่นี่แล้ว Save)
3. เปิด workflow → ดับเบิลคลิกโหนด **Gemini Analyst** **Gemini Verifier** และ **Gemini OCR** → ช่อง *Credential for Header Auth* ต้องเป็นตัวนี้ (สคริปต์ผูกไว้ให้แล้วด้วย id)

> ห้ามแก้โค้ดในโหนด Code ของ n8n โดยตรง (CLAUDE.md) · การเลือก credential และค่าในโหนดที่ไม่ใช่ Code ทำใน UI ได้ แต่จะหายเมื่อรันสคริปต์นำเข้าใหม่ ค่าที่ต้องคงอยู่ให้แก้ที่ต้นฉบับตามหัวข้อ 8

---

## 5. ตั้งค่า Google Drive (ทางเลือก · สำหรับปุ่ม "บันทึกลง Google Drive")

ข้ามได้ถ้าโชว์แค่ *ดาวน์โหลด PDF* · ถ้าข้าม ปุ่ม Drive จะขึ้น toast แจ้งข้อผิดพลาด แต่ส่วนอื่นทำงานปกติ

### 5.1 Google Cloud Console

ใช้ project เดียวกับ Gemini key หรือ project ของ `WF_IS_68076026` ก็ได้

1. https://console.cloud.google.com → เลือก project
2. **APIs & Services → Library** → ค้น **Google Drive API** → **Enable**
3. **APIs & Services → OAuth consent screen** (Google Auth Platform) → **Get started**
   - App name: `IS68076026 Demo` · User support email: อีเมลของคุณ
   - Audience: **External**
   - Contact email → ยอมรับนโยบาย → **Create**
4. **Audience → Test users → Add users** → ใส่อีเมล Google ที่จะใช้เก็บรายงาน → Save
5. **Clients → Create client**
   - Application type: **Web application** · Name: `n8n local`
   - **Authorized redirect URIs**: `http://localhost:5678/rest/oauth2-credential/callback`
   - **Create** → คัดลอก **Client ID** และ **Client secret**

### 5.2 ใน n8n

1. **Credentials → Google Drive OAuth2** (สคริปต์สร้างไว้แล้ว)
2. ตรวจว่า *OAuth Redirect URL* ที่ n8n แสดง ตรงกับข้อ 5.1-5 ทุกตัวอักษร
3. วาง **Client ID** และ **Client Secret** → **Sign in with Google** → เลือกบัญชี test user → ยอมรับสิทธิ์ (ถ้าขึ้น "Google hasn't verified this app" กด *Continue* เพราะเป็นแอปของคุณเองในโหมด Testing)
4. ต้องขึ้น **Account connected** → Save

### 5.3 โฟลเดอร์ปลายทาง

ค่าตั้งต้นคือ `root` (My Drive) · ถ้าจะเก็บในโฟลเดอร์เฉพาะ
1. สร้างโฟลเดอร์ใน Drive → เปิด → คัดลอก ID จาก URL (`https://drive.google.com/drive/folders/<ID>`)
2. ซ้อมครั้งเดียว: แก้ช่อง *Folder* ในโหนด **Upload PDF to Drive** ใน UI ได้
3. ให้คงอยู่ถาวร: แก้ `folderId` ใน `demo/build_wf_demo.mjs` แล้ว build ใหม่ตามหัวข้อ 8

> แอปโหมด Testing แบบ External: **โทเคนหมดอายุทุก 7 วัน** → ก่อนวันโชว์ให้เปิด credential แล้วกด Sign in ใหม่

---

## 6. ทดสอบว่าพร้อมใช้

### 6.1 ทดสอบเร็วด้วย Terminal (หน้าต่างที่สอง)

```bash
cd ~/Documents/Final_IS
curl -s -o /dev/null -w "page %{http_code}\n" http://localhost:5678/webhook/is-demo
curl -s -X POST http://localhost:5678/webhook/is-demo-analyze \
  -F role_id=R19 -F months=12 -F hours_per_week=10 -F mode=both -F consent=true \
  -F "resume=@demo/samples/resume_IT_Project_Manager.pdf;type=application/pdf" \
  | python3 -c "import json,sys;d=json.load(sys.stdin);a=d['analyst'];print('ok',d['ok'],'| source',a['source'],'| model',a['model'],'| readiness',d['scores']['readiness_pct'],'| plan items',len(d['plan']['items']));print('fallback:',a.get('fallback_reason',''))"
```

| ผล | ความหมาย |
|---|---|
| `page 200` | หน้าเว็บพร้อม |
| `source` ไม่ใช่ `offline_rules` และ `fallback:` ว่าง | Gemini ทำงาน ✔ |
| `source offline_rules` + `fallback: 403 …` / `400 …` | คีย์ผิดหรือยังไม่ได้ใส่ → หัวข้อ 4.2 |
| `source offline_rules` + `fallback: 404 …` | ชื่อรุ่นโมเดลใช้ไม่ได้ → หัวข้อ 8 |

ค่าอ้างอิงจากการทดสอบโหมดกฎสำรอง (ไม่มี Gemini): R19 · 12 เดือน · 10 ชม./สัปดาห์ → readiness 29.38 · แผน 12 รายการ · ถ้าใช้ Gemini ตัวเลขจะต่างจากนี้ได้

### 6.2 ทดสอบในเบราว์เซอร์ (ชุดซ้อมก่อนโชว์)

เปิด http://localhost:5678/webhook/is-demo แล้วทำตามตาราง

| # | ทำ | คาดว่า | ☐ |
|---|---|---|---|
| 1 | เลือก IT Project Manager · 12 เดือน · 10 ชม. · ติ๊กยินยอม · อัปโหลด `samples/resume_IT_Project_Manager.pdf` · กดวิเคราะห์ | หน้ารายงานภายใน ~10–40 วินาที · **ไม่มีป้าย "โหมดสำรอง"** | ☐ |
| 2 | เลื่อนดูส่วน *ตัวกรอง Hallucination* | มีจำนวนคำกล่าวอ้างที่ R2/R3 ตัด · quote ที่ไม่ผ่านถูกขีดฆ่า | ☐ |
| 3 | อัปโหลด `samples/resume_AI_ML_Engineer_scan.png` (อาชีพ AI/ML) | ผ่านเส้นทาง Gemini OCR ได้รายงาน | ☐ |
| 4 | ส่งฟอร์มโดยไม่ติ๊กยินยอม | ข้อความเตือนภาษาไทย ไม่เรียกโมเดล | ☐ |
| 5 | สลับ Light/Dark → **ดาวน์โหลด PDF** | ได้ PDF A4 7–8 หน้า | ☐ |
| 6 | **บันทึกลง Google Drive** (ถ้าทำหัวข้อ 5) | toast มีลิงก์ · เปิดแล้วเห็นไฟล์ใน Drive | ☐ |
| 7 | editor → **Executions** | เห็นรายการรันสถานะ Success | ☐ |

### 6.3 โหมด Canvas (ให้กรรมการเห็นโหนดวิ่ง)

1. เปิด editor ไว้จอหนึ่ง → กด **Execute workflow**
2. อีกจอเปิด `http://localhost:5678/webhook/is-demo?test=1` → ส่งฟอร์ม → โหนดเขียวทีละตัวบน canvas
3. รับได้ 1 ครั้งต่อการกด Execute (ส่งซ้ำต้องกดใหม่)

---

## 7. การใช้งานครั้งต่อไป

| สถานการณ์ | ทำ |
|---|---|
| เปิดเครื่องใหม่ จะโชว์ Demo | `bash ~/Documents/Final_IS/demo/run_demo_mac.sh` (ไม่ถามคีย์ซ้ำ) |
| ดึงงานล่าสุดจาก GitHub แล้ว `WF_Demo.json` เปลี่ยน | รันสคริปต์เดิม (นำเข้าทับให้เอง) |
| ล้าง n8n ทั้งหมดเริ่มใหม่ | ปิด n8n → `mv ~/.n8n ~/.n8n_backup_$(date +%d%b%y)` → รันสคริปต์ (ต้องตั้งบัญชีเจ้าของ + Drive ใหม่) |
| ลบประวัติการรัน (มีข้อความเรซูเมอยู่) | editor → **Executions** → เลือกทั้งหมด → Delete |

---

## 8. เปลี่ยนค่าตั้งของ Demo (แก้ที่ต้นฉบับ)

ค่าตั้งทั้งหมดอยู่ใน `CONFIG` ของ `demo/src/config_validate.js`

| ค่า | ตั้งต้น | ใช้เมื่อ |
|---|---|---|
| `GEMINI_MODEL_ANALYST` / `GEMINI_MODEL_OCR` | `gemini-3.8-flash` | บัญชีใช้รุ่นนี้ไม่ได้ (404) |
| `GEMINI_THINKING_LEVEL` | `medium` | ห้ามใช้ `minimal` กับ 3.8 Flash · `low` = เร็วขึ้นแต่พิจารณาทักษะพื้นฐานจากกิจกรรมน้อยลง |
| `USE_GEMINI_ANALYST` | `true` | `false` = ไม่เรียก LLM เลย (ไม่มีเน็ต) |
| `ANALYST_RUNS` | 3 | จำนวนรอบวิเคราะห์ที่นำมาโหวต (R1) · 1 = เร็ว/ประหยัดโควตา แต่ไม่มีการโหวต |
| `USE_GEMINI_VERIFIER` / `GEMINI_MODEL_VERIFIER` | `true` / `gemini-3.8-flash` | `false` = ข้อที่คำไม่ตรงขึ้นเป็น "ยังยืนยันไม่ได้" แทนการตรวจความหมาย |
| `OCR_MIN_CHARS` | 300 | ข้อความใน PDF น้อยกว่านี้ → ส่ง OCR |

ขั้นตอน (จากโฟลเดอร์ `Final_IS` · ใช้ venv ตาม `docs/Setup_Guide.md` ข้อ 0)

```bash
python demo/build_demo_data.py        # สร้าง demo/build/demo_data.json (โฟลเดอร์ build ไม่เข้า git)
node   demo/build_wf_demo.mjs         # สร้าง demo/WF_Demo.json + ตรวจ syntax/การอ้างโหนด
git diff --stat demo/WF_Demo.json     # ควรเปลี่ยนเฉพาะส่วนที่ตั้งใจแก้
bash   demo/run_demo_mac.sh           # นำเข้าใหม่
```

การเปลี่ยนนี้กระทบเฉพาะ Demo · ถ้าเป็นการเปลี่ยนที่จะเก็บไว้ ให้บันทึกใน `docs/LOG.md` (และ DEC ถ้าเกี่ยวกับตรรกะหรือ prompt)

---

## 9. ข้อมูลส่วนบุคคลและความปลอดภัย

- ก่อนได้หนังสือรับรองจริยธรรม ใช้ **เรซูเมสมมติใน `demo/samples/` เท่านั้น** · ถ้ากรรมการขอลองเรซูเมจริง ให้แจ้งว่าข้อความจะถูกส่งไป Gemini และค้างใน Executions
- Demo ปิดบัง PII 4 รูปแบบก่อนส่ง Gemini แต่ **execution log ของ n8n เก็บไฟล์ที่ส่งเข้ามา** → ลบหลังโชว์ (หัวข้อ 7)
- คีย์และ OAuth secret อยู่ใน `~/.n8n` (เข้ารหัส) เท่านั้น · ห้ามเขียนลงไฟล์ใน `Final_IS/` · ห้ามแชร์จอขณะเปิดหน้า credential
- n8n ฟังเฉพาะ `127.0.0.1` เครื่องอื่นใน Wi-Fi เดียวกันเข้าไม่ได้

---

## 10. แก้ปัญหา

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| `Node … เก่าเกินไป` / *not supported by n8n* | ติดตั้ง Node 24 (หัวข้อ 1) แล้วเปิด Terminal ใหม่ |
| ดาวน์โหลดค้างนาน / error มีคำว่า `gyp` หรือ `isolated-vm` | ตรวจว่าเป็น Node **24** (มีไฟล์สำเร็จรูป) · ถ้ายังไม่ได้ `xcode-select --install` แล้วรันใหม่ |
| `หยุดโปรแกรมที่พอร์ต 5678 ไม่ได้` | มี n8n อื่นเปิดอยู่ (n8n Desktop / Docker) → ปิดแอปนั้น หรือใช้ `PORT=5679` |
| `หน้า Demo ตอบ HTTP 404` | workflow ไม่ถูก publish → ดู `demo/n8n_demo.log` · รันสคริปต์ใหม่ · หรือเปิด editor กด **Publish** |
| หน้าเว็บขาว / ฟอนต์ไม่สวย | ไม่มีอินเทอร์เน็ต (Google Fonts · cdnjs) · ใช้เบราว์เซอร์ Chrome/Safari รุ่นปัจจุบัน |
| ป้าย "โหมดสำรอง" + `403` / `400 API key not valid` | คีย์ผิด → `RESET_GEMINI_KEY=1 bash …/run_demo_mac.sh` หรือแก้ใน Credentials |
| ป้าย "โหมดสำรอง" + `404 model not found` | เปลี่ยนชื่อรุ่นตามหัวข้อ 8 |
| ป้าย "โหมดสำรอง" + `400 … thinking` | ตั้ง `GEMINI_THINKING_LEVEL` เป็น `low`/`medium`/`high` |
| ป้าย "โหมดสำรอง" + `429` | เกินโควตาต่อนาทีของฟรีเทียร์ → รอ 1 นาที หรือเปิด billing ใน AI Studio |
| ไฟล์สแกนขึ้น "อ่านเอกสารไม่สำเร็จ" | Gemini OCR ใช้ไม่ได้ (คีย์/โควตา) · โชว์ด้วย PDF ที่มีข้อความแทน |
| ส่งฟอร์ม `?test=1` แล้วขึ้น "ยังไม่ได้กด Execute workflow" | กด **Execute workflow** ใน editor ก่อนทุกครั้ง |
| Google: `Error 400: redirect_uri_mismatch` | redirect URI ใน Google Cloud ต้องเป็น `http://localhost:5678/rest/oauth2-credential/callback` ตรงทุกตัวอักษร (พอร์ตต้องตรง) |
| Google: `Error 403: access_denied` | อีเมลที่ล็อกอินไม่อยู่ใน **Test users** (หัวข้อ 5.1-4) |
| บันทึก Drive ไม่สำเร็จหลังใช้มาหลายวัน | โทเคนโหมด Testing หมดอายุ 7 วัน → Sign in ใหม่ |
| ต้องการดู log | `tail -f ~/Documents/Final_IS/demo/n8n_demo.log` |

---

## 11. ถ้าใช้ Windows

สคริปต์เป็น bash ใช้บน macOS/Linux · บน Windows (PowerShell) ทำตามหัวข้อ 3.1 แทน:

```powershell
cd "$HOME\Documents\Final_IS"
npx -y n8n@2.39.9 import:workflow --input=demo/WF_Demo.json
npx -y n8n@2.39.9 publish:workflow --id=is68WFDemo000001
$env:N8N_LISTEN_ADDRESS="127.0.0.1"; $env:GENERIC_TIMEZONE="Asia/Bangkok"; npx -y n8n@2.39.9 start
```

แล้วสร้าง credential **Header Auth** ชื่อ `Gemini API Key (x-goog-api-key)` (Name `x-goog-api-key`) และ **Google Drive OAuth2 API** ใน UI → เลือกในโหนด Gemini Analyst · Gemini Verifier · Gemini OCR · Upload PDF to Drive → Publish

---

## 12. หลักฐานการทดสอบเอกสารนี้ (3 ต.ค. 2569)

ทดสอบ `run_demo_mac.sh` บน Linux x64 (คลาวด์ของ Claude) · Node 24.21.0 · n8n 2.39.9 · `~/.n8n` ว่าง

| กรณี | ผล |
|---|---|
| รันครั้งแรก ใส่คีย์ทดสอบ | credential 2 ตัว · import · publish · หน้า `/webhook/is-demo` 200 |
| POST `is-demo-analyze` (R19 · 12 เดือน · 10 ชม. · PDF ข้อความ) | 200 · รายงานครบ (เครื่องทดสอบบล็อก Gemini จึงวิ่งกฎสำรอง: readiness 29.38 · แผน 12 รายการ) |
| รันซ้ำ | หยุด n8n เดิม · **ไม่ถามคีย์ซ้ำ ไม่ทับ credential** · publish · 200 |
| Node 22 | สคริปต์หยุดพร้อมข้อความให้ติดตั้ง Node 24 |

ยังไม่ได้ทดสอบ: Gemini API จริง · Google Drive จริง · บน MacBook ของผู้วิจัย → ทำตามหัวข้อ 6.2 แล้วบันทึกผลใน `docs/LOG.md`

### แหล่งอ้างอิง
- Gemini 3.8 Flash (model id · thinking level · temperature): https://ai.google.dev/gemini-api/docs/generate-content/latest-model
- n8n Google OAuth (self-hosted · redirect URL · Testing 7 วัน): https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/
- Gemini API key: https://aistudio.google.com/apikey

## รุ่น 3 ต.ค. 2569 (DEC-58 · หลัง Gap_03OCT26)
- ถ้าแก้ `engine/engine.js` หรือ `demo/src/` ให้สร้างใหม่ด้วย `node demo/build_wf_demo.mjs .` แล้วรันสคริปต์ import ซ้ำ (id เดิม ทับรุ่นเก่า)
- รายงานแสดง R · C · U · **T** (งานหลักของอาชีพ) · **H** (เทคโนโลยีที่ตลาดต้องการ) · ป้าย "ยังยืนยันไม่ได้" เมื่อความครอบคลุมการตรวจ C < 0.6 · ไม่มี "หลังเรียนจบ → 100" แล้ว
- ส่วน **เพิ่มหลักฐานด้วยตัวเอง** (Open Learner Model): พิมพ์ข้อความเพิ่ม (เช่น ใบรับรองที่ไม่ได้อยู่ในเรซูเม) แล้วกดวิเคราะห์ใหม่ · ข้อความผ่านกฎ R0–R6 เหมือนเรซูเม
- ตรวจความตรงของคะแนน: เปิด Demo ไว้แล้วรัน `node scripts/validate_scoring.mjs` (ใช้ `synthetic/validation/`) → `evidence/scoring_validation_<วันที่>.md`


## ตรวจรุ่นหลังเปิด (DEC-59)
`run_demo_mac.sh` จะพิมพ์รุ่นของไฟล์ก่อนนำเข้า และเทียบกับ `http://localhost:5678/webhook/is-demo-version` หลังเริ่ม n8n — ถ้าไม่ตรงสคริปต์หยุดพร้อมวิธีแก้ (ลบ/Unpublish workflow เก่าใน editor แล้วรันใหม่)

## ดูโหนดวิ่งบน canvas (โหมดทดสอบ) — ทำตามลำดับนี้
ปุ่ม *Execute workflow* ฟังได้ **ครั้งเดียวต่อหนึ่ง webhook** และจะขึ้น "Waiting for you to call the Test URL" ไปเรื่อย ๆ จนกว่าจะมีคนเรียก — ไม่ใช่ค้าง
1. เปิดหน้าเว็บจาก production: `http://localhost:5678/webhook/is-demo?test=1` (หน้านี้ไม่ต้องกด Execute)
2. กลับมาที่ editor → เลือก **Execute workflow from POST /is-demo-analyze** (เลือกจากเมนูลูกศรข้างปุ่ม)
3. กลับหน้าเว็บ → อัปโหลดเรซูเม → วิเคราะห์ → โหนดจะวิ่งทีละตัวบน canvas · รันรอบใหม่ต้องกด Execute ใหม่ทุกครั้ง

## ตั้งค่า credential ครั้งเดียว
- Gemini: สคริปต์หาคีย์เองตามลำดับ ตัวแปร `GEMINI_API_KEY` → Keychain (`is68-gemini-key`) → `~/.is68/gemini_key` → `.env` → ถามครั้งเดียวแล้วจำใน Keychain · credential อยู่ในฐานข้อมูล n8n (`~/.n8n`) รันครั้งต่อไปไม่ถามอีก (`RESET_GEMINI_KEY=1` เมื่อต้องการเปลี่ยน)
- Google Drive: ต้อง Sign in OAuth ใน n8n เองครั้งเดียว (ทำอัตโนมัติไม่ได้) หลังจากนั้นถูกเก็บถาวร
