#!/usr/bin/env bash
# run_demo_mac.sh · เปิด WF_Demo บน n8n ในเครื่อง (macOS / Linux)
# ใช้: เปิด Terminal แล้วรัน   bash ~/Documents/Final_IS/demo/run_demo_mac.sh
#
# ทำอะไร
#   1) ตรวจ Node.js (n8n 2.39.9 ต้องการ Node 24 ขึ้นไป)
#   2) หยุด n8n ที่เปิดค้างอยู่ที่พอร์ต 5678 (นำเข้าด้วย CLI ขณะ n8n ทำงานทำให้ webhook ซ้อน)
#   3) สร้าง credential 2 ตัวที่ workflow อ้างถึง (id REPLACE_GEMINI_CRED / REPLACE_DRIVE_CRED)
#      เฉพาะตัวที่ยังไม่มี (รันซ้ำได้ ไม่ทับ credential ที่ตั้งค่าไว้แล้ว)
#      - Gemini: ถามคีย์ในเครื่อง (ไม่แสดงบนจอ ไม่เขียนลงไฟล์ถาวร) · กด Enter ข้ามได้ → ใช้กฎสำรอง
#      - Google Drive: สร้างเปล่าไว้ก่อน ใส่ Client ID/Secret และกด Sign in ใน n8n เอง (ดู demo/Setup_wf_demo.md)
#   4) นำเข้า demo/WF_Demo.json + publish → เริ่ม n8n → เปิด http://localhost:5678/webhook/is-demo
#
# ตัวเลือก: RESET_GEMINI_KEY=1 (เปลี่ยนคีย์) · SKIP_CREDS=1 (ไม่ตรวจ credential) · N8N_VERSION=2.39.9 · PORT=5678
set -euo pipefail

N8N_VERSION="${N8N_VERSION:-2.39.9}"
PORT="${PORT:-5678}"
WF_ID="is68WFDemo000001"
DEMO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WF_FILE="$DEMO_DIR/WF_Demo.json"
LOG="$DEMO_DIR/n8n_demo.log"

say()  { printf '\033[1;36m▶ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m✗ %s\033[0m\n' "$*"; exit 1; }

# ---------- 1. Node.js ----------
command -v node >/dev/null 2>&1 || fail "ไม่พบ Node.js → ติดตั้ง Node 24 LTS จาก https://nodejs.org (หรือ brew install node@24) แล้วรันใหม่"
NODE_V="$(node -p 'process.versions.node')"
node -e 'process.exit(Number(process.versions.node.split(".")[0])>=24?0:1)' \
  || fail "Node $NODE_V เก่าเกินไป n8n $N8N_VERSION ต้องใช้ Node 24 ขึ้นไป → ติดตั้งจาก https://nodejs.org (หรือ brew install node@24 แล้ว brew link --overwrite node@24) แล้วรันใหม่"
ok "Node $NODE_V"

if command -v n8n >/dev/null 2>&1 && [ "$(n8n --version 2>/dev/null | tail -1)" = "$N8N_VERSION" ]; then
  N8N=(n8n)
else
  N8N=(npx -y "n8n@$N8N_VERSION")
  say "ใช้ npx n8n@$N8N_VERSION (ครั้งแรกดาวน์โหลดและคอมไพล์นานราว 3–8 นาที)"
  "${N8N[@]}" --version >/dev/null 2>&1 || fail "ติดตั้ง n8n ไม่สำเร็จ → ถ้าข้อความมี gyp/isolated-vm ให้รัน  xcode-select --install  แล้วรันสคริปต์นี้ใหม่"
fi
# เก็บข้อมูล n8n (credential · workflow · ประวัติรัน) ไว้ที่เดียวเสมอ → รันซ้ำไม่ต้องตั้งค่าใหม่
export N8N_USER_FOLDER="${N8N_USER_FOLDER:-$HOME}"
export N8N_DIAGNOSTICS_ENABLED=false N8N_PERSONALIZATION_ENABLED=false GENERIC_TIMEZONE=Asia/Bangkok N8N_PORT="$PORT" N8N_LISTEN_ADDRESS="${N8N_LISTEN_ADDRESS:-127.0.0.1}"

# รุ่นของไฟล์ workflow ที่กำลังจะนำเข้า (DEC-59)
EXPECT="$(node -e 'try{const m=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).meta.is68;process.stdout.write([m.build_id,m.wf_version,m.engine_version,m.commit||"-"].join("|"))}catch(e){}' "$WF_FILE")"
EXPECT_BUILD="${EXPECT%%|*}"
say "WF_Demo.json รุ่น: $(echo "$EXPECT" | tr '|' ' · ')  (build · workflow · engine · commit)"

# ---------- 2. หยุด n8n ที่เปิดอยู่ ----------
# เผื่อมี session ค้าง: หยุด n8n ที่ยังรันอยู่ (ทั้งที่ใช้พอร์ตและที่ไม่ใช้) ก่อนนำเข้า
if pgrep -f "n8n start" >/dev/null 2>&1; then say "พบ n8n start ค้างอยู่ → หยุด"; pkill -f "n8n start" 2>/dev/null || true; sleep 2; fi
PIDS="$(lsof -t -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$PIDS" ]; then
  say "พบโปรแกรมใช้พอร์ต $PORT อยู่ (pid $PIDS) → หยุดก่อนนำเข้า"
  kill $PIDS || true
  for _ in $(seq 1 30); do sleep 1; lsof -t -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1 || break; done
  lsof -t -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1 && fail "หยุดโปรแกรมที่พอร์ต $PORT ไม่ได้ ปิดเองแล้วรันใหม่ (ถ้าเป็น n8n Desktop/Docker ให้ปิดแอปนั้น)"
  ok "พอร์ต $PORT ว่างแล้ว"
fi

# ---------- 3. credential ----------
if [ "${SKIP_CREDS:-0}" != "1" ]; then
  TMP="$(mktemp -d)"; chmod 700 "$TMP"
  trap 'rm -rf "$TMP"' EXIT
  # ตรวจว่ามี credential ของ Demo อยู่แล้วหรือไม่ (ส่งออกแบบเข้ารหัส อ่านเฉพาะ id แล้วลบทิ้ง)
  "${N8N[@]}" export:credentials --all --output="$TMP/existing.json" >/dev/null 2>&1 || echo '[]' > "$TMP/existing.json"
  HAVE="$(node -e '
    let a=[]; try { a=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); } catch(e) {}
    if (!Array.isArray(a)) a=[a];
    process.stdout.write(a.map(c=>c&&c.id).filter(Boolean).join(" "));' "$TMP/existing.json")"
  rm -f "$TMP/existing.json"
  NEED_GEMINI=1; NEED_DRIVE=1
  case " $HAVE " in *" REPLACE_GEMINI_CRED "*) NEED_GEMINI=0;; esac
  case " $HAVE " in *" REPLACE_DRIVE_CRED "*) NEED_DRIVE=0;; esac
  [ "${RESET_GEMINI_KEY:-0}" = "1" ] && NEED_GEMINI=1

  GEMINI_KEY=""
  if [ "$NEED_GEMINI" = "1" ]; then
    # หาคีย์ตามลำดับ: ตัวแปรสภาพแวดล้อม → Keychain (macOS) → ไฟล์ ~/.is68/gemini_key → .env ของโปรเจกต์ → ถามครั้งเดียวแล้วจำไว้ใน Keychain
    GEMINI_KEY="${GEMINI_API_KEY:-}"
    [ -z "$GEMINI_KEY" ] && command -v security >/dev/null 2>&1 && GEMINI_KEY="$(security find-generic-password -a "$USER" -s is68-gemini-key -w 2>/dev/null || true)"
    [ -z "$GEMINI_KEY" ] && [ -f "$HOME/.is68/gemini_key" ] && GEMINI_KEY="$(head -n1 "$HOME/.is68/gemini_key" | tr -d '[:space:]')"
    [ -z "$GEMINI_KEY" ] && [ -f "$DEMO_DIR/../.env" ] && GEMINI_KEY="$(grep -E '^(export )?(GEMINI_API_KEY|GOOGLE_API_KEY)=' "$DEMO_DIR/../.env" | head -n1 | cut -d= -f2- | tr -d "\"' \r")"
    if [ -n "$GEMINI_KEY" ]; then
      ok "พบ Gemini API key ในเครื่อง (ไม่ต้องกรอก)"
    else
      printf '\nวาง Gemini API key (จาก https://aistudio.google.com/apikey) แล้วกด Enter\n'
      printf 'กด Enter เฉย ๆ = ไม่ใช้ Gemini (วิเคราะห์ด้วยกฎสำรอง · ใช้ได้เฉพาะ PDF ที่มีข้อความ)\n> '
      IFS= read -rs GEMINI_KEY || GEMINI_KEY=""
      echo
      if [ -n "$GEMINI_KEY" ] && command -v security >/dev/null 2>&1; then
        security add-generic-password -U -a "$USER" -s is68-gemini-key -w "$GEMINI_KEY" >/dev/null 2>&1 && ok "จำคีย์ไว้ใน Keychain แล้ว (รันครั้งหน้าไม่ต้องกรอก)"
      fi
    fi
  else
    ok "มี credential Gemini อยู่ใน n8n แล้ว (เปลี่ยนคีย์: RESET_GEMINI_KEY=1 bash $0)"
  fi
  [ "$NEED_DRIVE" = "0" ] && ok "มี credential Google Drive อยู่แล้ว (ไม่แตะ)"

  if [ "$NEED_GEMINI" = "1" ] || [ "$NEED_DRIVE" = "1" ]; then
    GEMINI_KEY="${GEMINI_KEY:-NO_KEY_SET}" NEED_GEMINI=$NEED_GEMINI NEED_DRIVE=$NEED_DRIVE node -e '
      const fs = require("fs");
      const now = new Date().toISOString();
      const creds = [];
      if (process.env.NEED_GEMINI === "1") creds.push({ id: "REPLACE_GEMINI_CRED", name: "Gemini API Key (x-goog-api-key)",
        type: "httpHeaderAuth", data: { name: "x-goog-api-key", value: process.env.GEMINI_KEY }, createdAt: now, updatedAt: now });
      if (process.env.NEED_DRIVE === "1") creds.push({ id: "REPLACE_DRIVE_CRED", name: "Google Drive OAuth2",
        type: "googleDriveOAuth2Api", data: { clientId: "", clientSecret: "" }, createdAt: now, updatedAt: now });
      fs.writeFileSync(process.argv[1], JSON.stringify(creds), { mode: 0o600 });
    ' "$TMP/creds.json"
    unset GEMINI_KEY
    say "นำเข้า credential"
    "${N8N[@]}" import:credentials --input="$TMP/creds.json" 2>&1 | grep -v '^$' | tail -1
    rm -f "$TMP/creds.json"
    ok "credential พร้อม"
  fi
fi

# ---------- 4. workflow ----------
say "นำเข้า $WF_FILE"
"${N8N[@]}" import:workflow --input="$WF_FILE" 2>&1 | grep -v '^$' | tail -2
if "${N8N[@]}" publish:workflow --id="$WF_ID" >/dev/null 2>&1; then
  ok "publish แล้ว"
else
  "${N8N[@]}" update:workflow --id="$WF_ID" --active=true 2>&1 | tail -1
  ok "เปิดใช้ workflow แล้ว"
fi

# ---------- 5. เริ่ม n8n ----------
say "เริ่ม n8n (log: $LOG)"
"${N8N[@]}" start >"$LOG" 2>&1 &
N8N_PID=$!
trap 'echo; say "หยุด n8n"; kill $N8N_PID 2>/dev/null; rm -rf "${TMP:-/nonexistent}"' EXIT INT TERM
for _ in $(seq 1 120); do
  sleep 2
  curl -s "http://127.0.0.1:$PORT/healthz" | grep -q ok && break
  kill -0 $N8N_PID 2>/dev/null || { tail -20 "$LOG"; fail "n8n หยุดทำงาน ดู log ด้านบน"; }
done
# webhook ลงทะเบียนหลัง healthz ราว 2–10 วินาที → รอหน้า Demo ตอบ 200
for _ in $(seq 1 30); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/webhook/is-demo")"
  [ "$CODE" = "200" ] && break; sleep 2
done
[ "$CODE" = "200" ] || { tail -20 "$LOG"; fail "หน้า Demo ตอบ HTTP $CODE (คาดว่า 200)"; }

# ตรวจรุ่นที่ n8n เสิร์ฟจริง เทียบกับไฟล์ที่นำเข้า (DEC-59)
GOT="$(curl -s "http://127.0.0.1:$PORT/webhook/is-demo-version" || true)"
GOT_BUILD="$(printf '%s' "$GOT" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{process.stdout.write(JSON.parse(d).build_id||"")}catch(e){}})')"
if [ -n "$EXPECT_BUILD" ] && [ "$GOT_BUILD" = "$EXPECT_BUILD" ]; then
  ok "รุ่น workflow ที่รันอยู่ตรงกับไฟล์: $GOT_BUILD"
else
  printf '\033[1;31m✗ รุ่นไม่ตรง: ไฟล์ = %s · ที่ n8n เสิร์ฟ = %s\033[0m\n' "$EXPECT_BUILD" "${GOT_BUILD:-ไม่ตอบ}"
  echo "   อาจมี workflow รุ่นเก่าค้างในฐานข้อมูล n8n → เปิด editor แล้ว Unpublish/ลบ WF_Demo เก่า จากนั้นรันสคริปต์นี้ใหม่"
  fail "ยกเลิก (กันการทดสอบด้วยรุ่นเก่า)"
fi

URL="http://localhost:$PORT/webhook/is-demo"
ok "พร้อมแล้ว → $URL"
echo "   editor: http://localhost:$PORT   (ครั้งแรกให้ตั้งบัญชีเจ้าของ n8n)"
echo "   ไฟล์ทดสอบ: $DEMO_DIR/samples/"
echo "   ปิด n8n: กด Ctrl+C ในหน้าต่างนี้"
command -v open >/dev/null 2>&1 && open "$URL" || true
wait $N8N_PID
