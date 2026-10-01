// check_traceability.mjs — ตรวจตาราง traceability ใน evidence/WF_analysis.md (Prompt_Report 2.3)
//   ทุกแถวมีครบสามช่อง · ทุกโหนดมีใน workflows/WF_IS68076026.json · ทุก T:<ชื่อเทสต์> ตรงกับ test(...) ใน tests/*.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const md = fs.readFileSync(path.join(ROOT, 'evidence', 'WF_analysis.md'), 'utf8');
const wf = JSON.parse(fs.readFileSync(path.join(ROOT, 'workflows', 'WF_IS68076026.json'), 'utf8'));
const names = new Set(wf.nodes.map((n) => n.name));
const titles = fs.readdirSync(path.join(ROOT, 'tests')).filter((f) => f.endsWith('.test.mjs'))
  .flatMap((f) => [...fs.readFileSync(path.join(ROOT, 'tests', f), 'utf8').matchAll(/^test\((['`])(.*?)\1/gm)].map((m) => m[2]));
const sec = md.split('## 2 · Traceability')[1].split('\n## ')[0];
const rows = sec.split('\n').filter((l) => l.startsWith('|') && !/^\|\s*-/.test(l)).slice(1).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
const errs = []; const used = new Set();
for (const [s, req, nodes, tests] of rows) {
  if (!s || !req || !nodes || !tests) { errs.push(`แถวไม่ครบ: ${req}`); continue; }
  for (const n of nodes.split(' · ')) { if (!names.has(n)) errs.push(`${req}: ไม่มีโหนด "${n}"`); used.add(n); }
  for (const t of tests.split(' · ')) {
    if (t.startsWith('T:')) { if (!titles.some((x) => x.includes(t.slice(2)))) errs.push(`${req}: ไม่พบเทสต์ "${t.slice(2)}"`); }
    else if (!t.startsWith('V:')) errs.push(`${req}: เทสต์ต้องขึ้นต้น T: หรือ V: (${t})`);
  }
}
const real = wf.nodes.filter((n) => n.type !== 'n8n-nodes-base.stickyNote').map((n) => n.name);
const orphan = real.filter((n) => !used.has(n));
if (orphan.length) errs.push('โหนดที่ไม่อยู่ในตาราง traceability: ' + orphan.join(', '));
if (errs.length) { console.error('ไม่ผ่าน:\n  ' + errs.join('\n  ')); process.exit(1); }
console.log(`ผ่าน · traceability ${rows.length} แถว ครบสามช่อง · ครอบคลุม ${used.size}/${real.length} โหนด`);
