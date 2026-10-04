// refs.mjs — ตัวโหลดข้อมูลอ้างอิงกลาง (DEC-21) ใช้ร่วมกันโดย run_local, tests และ build_workflows
// ห้าม fallback เงียบ ๆ: ถ้า mapping_review.csv หาย ว่าง หรือผ่านการตรวจ < 90% ของ L1 ให้ throw
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(import.meta.url);
export const ENGINE = require(path.join(ROOT, 'engine', 'engine.js'));

export function parseCSV(text) {
  const rows = []; let row = []; let f = ''; let q = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  const [h, ...body] = rows.filter((r) => !(r.length === 1 && r[0] === ''));
  return body.map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] === undefined ? '' : r[i]])));
}
export function toCSV(rows, cols) {
  const c = cols || (rows[0] ? Object.keys(rows[0]) : []);
  const esc = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [c.join(','), ...rows.map((r) => c.map((k) => esc(r[k])).join(','))].join('\n') + '\n';
}
export const readJSON = (...p) => JSON.parse(fs.readFileSync(path.join(ROOT, ...p), 'utf8'));
export const readCSV = (...p) => parseCSV(fs.readFileSync(path.join(ROOT, ...p), 'utf8'));

export function loadRefs() {
  const projectCfg = readJSON('config', 'project.json');
  const modelsCfg = readJSON('config', 'models.json');
  const sheetsCfg = readJSON('config', 'sheets.json');
  const roles = readJSON('data', 'roles.json').roles;
  const requirements = readCSV('data', 'requirements.csv');
  const corpus = readCSV('data', 'corpus.csv');
  const rawMappings = readCSV('data', 'mappings.csv');
  const rvPath = path.join(ROOT, 'data', 'mapping_review.csv');
  if (!fs.existsSync(rvPath)) throw new Error('ข้อผิดพลาดของข้อมูลอ้างอิง: ไม่พบ data/mapping_review.csv (รัน python scripts/review_mappings.py)');
  const review = parseCSV(fs.readFileSync(rvPath, 'utf8'));
  const mappings = ENGINE.mergeMappingReview(rawMappings, review, projectCfg.min_approved_share_of_L1);
  const manifest = readJSON('data', 'manifest.json');
  const prompt = fs.readFileSync(path.join(ROOT, 'prompts', projectCfg.prompt_version + '.txt'), 'utf8');
  const verifierPrompt = fs.readFileSync(path.join(ROOT, 'prompts', projectCfg.verifier_prompt_version + '.txt'), 'utf8');
  // DEC-54/55: ข้อมูลชุดที่ 3 (scripts/build_role_signals.py)
  const roleTasks = readCSV('data', 'role_tasks.csv');
  const roleTech = readCSV('data', 'role_technology.csv');
  const skillLinks = readCSV('data', 'skill_links.csv');
  return { projectCfg, modelsCfg, sheetsCfg, roles, requirements, corpus, mappings, rawMappings, review, manifest, prompt, verifierPrompt,
    roleTasks, roleTech, skillLinks, promptSha: ENGINE.sha256Hex(prompt), verifierPromptSha: ENGINE.sha256Hex(verifierPrompt) };
}
// ข้อมูลเฉพาะอาชีพสำหรับ evaluateRun (DEC-54/55)
export function signalsFor(refs, roleId) {
  return { roleTasks: refs.roleTasks.filter((t) => t.role_id === roleId), roleTech: refs.roleTech.filter((t) => t.role_id === roleId), skillLinks: refs.skillLinks, specificity: ENGINE.buildSpecificity(refs.requirements) };
}
export function refsForRun(refs, roleId) {
  const role = refs.roles.find((r) => r.role_id === roleId);
  return {
    role_name_th: role ? role.role_name_th : '', manifest_files: refs.manifest.files, prompt_sha256: refs.promptSha, verifier_prompt_sha256: refs.verifierPromptSha,
    dataset_version: refs.manifest.dataset_version, corpus_version: refs.manifest.corpus_version,
    prompt_version: refs.projectCfg.prompt_version + '+' + refs.projectCfg.verifier_prompt_version, rules_version: refs.projectCfg.rules_version,
  };
}
