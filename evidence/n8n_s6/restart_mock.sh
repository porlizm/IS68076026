#!/bin/bash
for p in $(lsof -t -iTCP:8999 -sTCP:LISTEN 2>/dev/null; lsof -t -iTCP:443 -sTCP:LISTEN 2>/dev/null; lsof -t -iTCP:80 -sTCP:LISTEN 2>/dev/null); do kill $p; done; sleep 1
cd /home/claude/s6 && SHEET_ID=SHEET_IS68_TEST nohup /home/claude/tools/node24/bin/node mock/server.mjs > mock/server.out 2>&1 &
sleep 1; cat /home/claude/s6/mock/server.out
