#!/bin/bash
# n8n ในเนมสเปซของตัวเอง: /etc/hosts เฉพาะ process นี้ชี้โดเมน Google/โมเดลไปบริการจำลอง (127.0.0.2) ไม่กระทบระบบ
exec unshare -m sh -c 'mount --bind /home/claude/s6/hosts.n8n /etc/hosts && exec env -i $(cat /home/claude/s6/n8n.env | xargs) /home/claude/tools/node24/bin/node /home/claude/tools/n8n/node_modules/n8n/bin/n8n "$@"' sh "$@"
