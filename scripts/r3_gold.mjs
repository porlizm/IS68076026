// r3_gold.mjs — ชุดคู่ (ข้อความอ้างอิง, ข้อกำหนด) สำหรับเลือกและตรวจเกณฑ์ R3 (DEC-57 · 3 ต.ค. 2569)
//   node scripts/r3_gold.mjs build                 สร้าง evidence/r3_gold/gold_pairs_synthetic.csv จากกรณีสังเคราะห์ A–D (ป้าย = เฉลยของกรณี)
//   node scripts/r3_gold.mjs eval <file.csv> [...]  precision/recall/F1 ของ R3 แบบต่าง ๆ + κ ระหว่างผู้ให้ป้าย + θ sweep
// คอลัมน์: pair_id,source,role_id,element_id,target_kind,quote,label_key,rater_1,rater_2,final_label,verifier_verdict
//   ป้าย relevant | partial | unrelated · final_label ว่าง → ใช้ rater_1 = rater_2 ถ้าตรงกัน ไม่เช่นนั้นใช้ label_key
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ENGINE as E, loadRefs, readCSV, toCSV } from './lib/refs.mjs';

const refs = loadRefs();
const cfg = refs.projectCfg;
const COLS = ['pair_id', 'source', 'role_id', 'element_id', 'target_kind', 'quote', 'label_key', 'rater_1', 'rater_2', 'final_label', 'verifier_verdict'];
const reqOf = (rid, el) => refs.requirements.find((r) => r.role_id === rid && r.element_id === el);

function build() {
  const rows = []; let n = 0;
  for (const c of ['A', 'B', 'C', 'D']) {
    const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'synthetic', 'case_' + c, 'meta.json'), 'utf8'));
    const key = Object.fromEntries(readCSV('synthetic', 'case_' + c, 'answer_key.csv').map((r) => [r.element_id, r]));
    const f = readCSV('evidence', 'run_local', 'case_' + c, 'findings.csv').filter((x) => x.target_kind !== 'task' && x.claimed_status !== 'missing' && x.quote_verified === 'true');
    const seen = new Set();
    for (const x of f) {
      const el = x.requirement_id.split('-').slice(2).join('-');
      const sig = el + '|' + x.quote; if (seen.has(sig)) continue; seen.add(sig);
      const k = key[el]; const exact = k && k.evidence_sentence && (x.quote.includes(k.evidence_sentence) || k.evidence_sentence.includes(x.quote));
      const lab = !exact ? 'unrelated' : k.expected_status === 'evidenced' ? 'relevant' : k.expected_status === 'partially' ? 'partial' : 'unrelated';
      rows.push({ pair_id: 'S' + String(++n).padStart(3, '0'), source: 'synthetic_case_' + c + (meta.style ? ':' + meta.style : ''), role_id: meta.role_id, element_id: el, target_kind: 'requirement', quote: x.quote, label_key: lab, rater_1: '', rater_2: '', final_label: '', verifier_verdict: x.verifier_verdict || '' });
    }
  }
  const out = path.join(ROOT, 'evidence', 'r3_gold', 'gold_pairs_synthetic.csv');
  fs.writeFileSync(out, toCSV(rows, COLS));
  console.log('เขียน', path.relative(ROOT, out), rows.length, 'คู่');
}

function kappa(a, b) {
  const L = [...new Set([...a, ...b])]; const n = a.length; if (!n) return null;
  const po = a.filter((x, i) => x === b[i]).length / n;
  const pe = L.reduce((s, l) => s + (a.filter((x) => x === l).length / n) * (b.filter((x) => x === l).length / n), 0);
  return pe === 1 ? 1 : (po - pe) / (1 - pe);
}
function evalFile(file) {
  const rows = readCSV(path.relative(ROOT, path.resolve(file)));
  const lab = (r) => r.final_label || (r.rater_1 && r.rater_1 === r.rater_2 ? r.rater_1 : '') || r.label_key;
  const rated = rows.filter((r) => r.rater_1 && r.rater_2);
  const res = { file: path.relative(ROOT, path.resolve(file)), n_pairs: rows.length, n_double_rated: rated.length, kappa: rated.length ? +kappa(rated.map((r) => r.rater_1), rated.map((r) => r.rater_2)).toFixed(3) : null, methods: {} };
  const score = (r, stem) => E.overlapScore(r.quote, reqOf(r.role_id, r.element_id), { ...cfg, r3_stemming: stem }).score;
  const methods = {
    r3_lexical_v1: (r) => score(r, false) >= cfg.theta,
    r3a_stemmed: (r) => score(r, true) >= cfg.theta,
    r3_hybrid: (r) => score(r, true) >= cfg.theta || ['supports', 'partially_supports'].includes(r.verifier_verdict),
  };
  for (const [m, pass] of Object.entries(methods)) {
    if (m === 'r3_hybrid' && !rows.some((r) => r.verifier_verdict)) continue;
    let tp = 0, fp = 0, fn = 0, tn = 0;
    for (const r of rows) { const pos = lab(r) !== 'unrelated'; const p = pass(r); if (pos && p) tp++; else if (!pos && p) fp++; else if (pos) fn++; else tn++; }
    const P = tp + fp ? tp / (tp + fp) : null; const R = tp + fn ? tp / (tp + fn) : null;
    res.methods[m] = { tp, fp, fn, tn, precision: P === null ? null : +P.toFixed(3), recall: R === null ? null : +R.toFixed(3), f1: P && R ? +((2 * P * R) / (P + R)).toFixed(3) : null };
  }
  res.theta_sweep = [0.05, 0.1, 0.15, 0.2, 0.3].map((t) => {
    let tp = 0, fp = 0, fn = 0;
    for (const r of rows) { const pos = lab(r) !== 'unrelated'; const p = score(r, true) >= t; if (pos && p) tp++; else if (!pos && p) fp++; else if (pos) fn++; }
    return { theta: t, precision: tp + fp ? +(tp / (tp + fp)).toFixed(3) : null, recall: tp + fn ? +(tp / (tp + fn)).toFixed(3) : null };
  });
  return res;
}

const [cmd, ...files] = process.argv.slice(2);
if (cmd === 'build') build();
else if (cmd === 'eval') { const all = files.map(evalFile); console.log(JSON.stringify(all, null, 1)); fs.writeFileSync(path.join(ROOT, 'evidence', 'r3_gold', 'eval_latest.json'), JSON.stringify(all, null, 1)); }
else { console.error('ใช้: node scripts/r3_gold.mjs build | eval <csv>...'); process.exit(1); }
