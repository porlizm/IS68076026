#!/bin/bash
# usage: reimport.sh <workflow.json> <id>  — หยุด n8n ก่อนนำเข้าด้วย CLI (นำเข้าขณะ server ทำงานทำให้มี poller ซ้อนสองตัว)
K=$(cat /home/claude/s6/apikey.txt)
for p in $(lsof -t -iTCP:5678 -sTCP:LISTEN 2>/dev/null); do kill $p; done
for i in $(seq 1 30); do sleep 1; lsof -t -iTCP:5678 -sTCP:LISTEN >/dev/null || break; done
/home/claude/s6/run_n8n.sh import:workflow --input=$1 2>&1 | tail -1
(nohup /home/claude/s6/run_n8n.sh start > /home/claude/s6/n8n.out 2>&1 &)
for i in $(seq 1 150); do sleep 2; curl -s --noproxy '*' http://127.0.0.1:5678/healthz | grep -q ok && break; done
for i in $(seq 1 60); do sleep 2; R=$(curl -s --noproxy "*" -X POST -H "X-N8N-API-KEY: $K" http://127.0.0.1:5678/api/v1/workflows/$2/activate); echo "$R" | grep -q "\"active\":true" && { echo active True; break; }; done
