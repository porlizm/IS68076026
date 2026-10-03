// validate_scoring.mjs — ตรวจความตรงของคะแนนกับ WF_Demo ที่รันกับ Gemini จริง (DEC-57 · 3 ต.ค. 2569)
//   ต้องเปิด WF_Demo ไว้ก่อน (demo/run_demo_mac.sh) · ใช้เรซูเมสมมติใน synthetic/validation/ (scripts/make_validation_resumes.py)
//   node scripts/validate_scoring.mjs [--base http://localhost:5678/webhook] [--only known|style|stability] [--repeat 3]
// เกณฑ์ (เสนอ · รอผู้วิจัย/อาจารย์ยืนยันใน DEC-57)
//   K1 known-group: ทุกบุคคล T ของอาชีพตัวเองสูงสุดในสี่อาชีพ
//   K2 known-group: ทุกบุคคล R ของอาชีพตัวเอง ≥ ค่ามัธยฐานของอีกสามอาชีพ + 10
//   S1 style-invariance: |R(onet) − R(star)| ≤ 10 ทุกบุคคล (สไตล์ list รายงานแต่ไม่ใช้ตัดสิน · คาดว่าต่ำกว่าเพราะเป็นรายการทักษะ = บางส่วน)
//   T3 stability: บุคคล pm สไตล์ star อาชีพ R19 รันซ้ำ → สถานะรายข้อตรงกันทุกรอบ ≥ 85%
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:5678/webhook');
const ONLY = arg('only', '');
const REPEAT = Number(arg('repeat', 3));
const VD = path.join(ROOT, 'synthetic', 'validation');
const man = JSON.parse(fs.readFileSync(path.join(VD, 'manifest.json'), 'utf8'));
const ROLES = ['R07', 'R15', 'R19', 'R20'];

async function analyze(file, roleId) {
  const fd = new FormData();
  fd.append('role_id', roleId); fd.append('months', '12'); fd.append('hours_per_week', '10'); fd.append('mode', 'both'); fd.append('consent', 'true');
  fd.append('resume', new Blob([fs.readFileSync(path.join(VD, file))], { type: 'application/pdf' }), file);
  const t0 = Date.now();
  const res = await fetch(BASE + '/is-demo-analyze', { method: 'POST', body: fd });
  const j = await res.json();
  if (!res.ok || !j.ok) throw new Error(file + ' ' + roleId + ': HTTP ' + res.status + ' ' + JSON.stringify(j.errors || j.message || ''));
  if (j.analyst.source !== 'gemini') throw new Error(file + ': ใช้กฎสำรอง (' + j.analyst.fallback_reason + ') — ตรวจ Gemini key ก่อน');
  return { R: j.scores.readiness_pct, C: j.scores.weighted_coverage, T: j.scores.role_task_index, H: j.scores.n_tech_found + '/' + j.scores.n_tech_total,
    R_lex: j.scores.ablation.r3_lexical_only, U: j.guard.U, statuses: j.requirements.map((r) => r.status), sec: Math.round((Date.now() - t0) / 1000) };
}
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };

const out = { at: new Date().toISOString(), base: BASE, known: {}, style: {}, stability: null, verdict: {} };
const log = (...a) => console.log(...a);
if (!ONLY || ONLY === 'known') {
  for (const [k, p] of Object.entries(man.personas)) {
    out.known[k] = { own: p.role_id, by_role: {} };
    for (const r of ROLES) { const x = await analyze(p.files.star, r); out.known[k].by_role[r] = x; log('known', k, r, 'R', x.R, 'T', x.T, 'R_lex', x.R_lex, x.sec + 's'); }
    const br = out.known[k].by_role; const own = p.role_id; const others = ROLES.filter((r) => r !== own);
    out.known[k].K1 = others.every((r) => (br[own].T ?? -1) > (br[r].T ?? -1));
    out.known[k].K2 = (br[own].R ?? -1) >= med(others.map((r) => br[r].R ?? 0)) + 10;
  }
  out.verdict.K1 = Object.values(out.known).every((x) => x.K1); out.verdict.K2 = Object.values(out.known).every((x) => x.K2);
}
if (!ONLY || ONLY === 'style') {
  for (const [k, p] of Object.entries(man.personas)) {
    out.style[k] = {};
    for (const st of ['onet', 'star', 'list']) { const x = (out.known[k] && st === 'star') ? out.known[k].by_role[p.role_id] : await analyze(p.files[st], p.role_id); out.style[k][st] = x; log('style', k, st, 'R', x.R, 'T', x.T); }
    out.style[k].S1 = Math.abs((out.style[k].onet.R ?? 0) - (out.style[k].star.R ?? 0)) <= 10;
  }
  out.verdict.S1 = Object.values(out.style).every((x) => x.S1);
}
if (!ONLY || ONLY === 'stability') {
  const runs = []; for (let i = 0; i < REPEAT; i++) { runs.push(await analyze(man.personas.pm.files.star, 'R19')); log('stability', i + 1, 'R', runs[i].R); }
  const n = runs[0].statuses.length; const same = runs[0].statuses.filter((s, i) => runs.every((r) => r.statuses[i] === s)).length;
  out.stability = { runs: runs.map((r) => ({ R: r.R, T: r.T })), agreement: +(same / n).toFixed(3) };
  out.verdict.T3 = out.stability.agreement >= 0.85;
}
const d = new Date(); const tag = String(d.getDate()).padStart(2, '0') + ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getMonth()] + String(d.getFullYear() % 100);
fs.mkdirSync(path.join(ROOT, 'evidence'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'evidence', `scoring_validation_${tag}.json`), JSON.stringify(out, null, 1));
let md = `# ผลตรวจความตรงของคะแนน · ${tag}\n\n> WF_Demo + Gemini จริง · เรซูเมสมมติ synthetic/validation/ · scripts/validate_scoring.mjs (DEC-57)\n\n`;
md += `| เกณฑ์ | ผล |\n|---|---|\n` + Object.entries(out.verdict).map(([k, v]) => `| ${k} | ${v ? '✅ ผ่าน' : '❌ ไม่ผ่าน'} |`).join('\n') + '\n\n';
if (Object.keys(out.known).length) { md += `## Known-group (สไตล์ star · R / T)\n\n| บุคคล | ` + ROLES.join(' | ') + ' | K1 | K2 |\n|---|' + ROLES.map(() => '---').join('|') + '|---|---|\n';
  for (const [k, x] of Object.entries(out.known)) md += `| ${k} (${x.own}) | ` + ROLES.map((r) => `${x.by_role[r].R ?? 'N/A'} / ${x.by_role[r].T ?? 'N/A'}`).join(' | ') + ` | ${x.K1 ? '✅' : '❌'} | ${x.K2 ? '✅' : '❌'} |\n`; md += '\n'; }
if (Object.keys(out.style).length) { md += `## Style-invariance (อาชีพตัวเอง · R · R ถ้าใช้ R3 คำซ้ำอย่างเดียว)\n\n| บุคคล | onet | star | list | S1 |\n|---|---|---|---|---|\n`;
  for (const [k, x] of Object.entries(out.style)) md += `| ${k} | ${x.onet.R} (${x.onet.R_lex}) | ${x.star.R} (${x.star.R_lex}) | ${x.list.R} (${x.list.R_lex}) | ${x.S1 ? '✅' : '❌'} |\n`; md += '\n'; }
if (out.stability) md += `## ความคงที่\n\nรัน ${REPEAT} รอบ · R ${out.stability.runs.map((r) => r.R).join(' / ')} · สถานะตรงกันทุกรอบ ${(out.stability.agreement * 100).toFixed(1)}%\n`;
fs.writeFileSync(path.join(ROOT, 'evidence', `scoring_validation_${tag}.md`), md);
log('\n' + md);
