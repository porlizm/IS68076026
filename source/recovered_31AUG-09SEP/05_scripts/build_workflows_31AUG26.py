#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_workflows_31AUG26.py — สร้าง n8n workflow ฉบับปรับปรุง
IS 68076026 · ดนุสรณ์ อนันตกาล · 31 สิงหาคม 2026

แทนที่ชุดเดิม 4 ไฟล์ใน archive/2026-08_n8n_legacy/ ซึ่งมีปัญหาเชิงระเบียบวิธี 3 ข้อ
  1. ใช้ LLM (Claude Sonnet 5 Verifier) เป็นผู้ตัดสินชั้น validation → ขัด RQ2 โดยตรง
  2. เป็น monolith 44 โหนด แยกทดสอบกฎ R0–R3 ไม่ได้ตามที่ §3.5.3 กำหนด
  3. เก็บผลดิบรายโมเดลไม่ครบ → เงื่อนไข C1–C3 และ ablation C7–C9 คำนวณย้อนหลังไม่ได้

ผลลัพธ์ → 06_workflows/
  WF_SUB_GapEngine_31AUG26.json   แกนงานวิจัย · 3 analyst + validation ด้วยโค้ดล้วน
  WF_Main_31AUG26.json            intake → parse → เรียก sub → rank → pathway → report
  WF_ERR_Notifier_31AUG26.json    error workflow ที่ผูกกับทั้งสองตัว
"""
# ---------- bootstrap ----------
import os as _os
PROJECT_ROOT = _os.path.dirname(_os.path.abspath(__file__))
while not _os.path.isdir(_os.path.join(PROJECT_ROOT, "02_dataset")) and _os.path.dirname(PROJECT_ROOT) != PROJECT_ROOT:
    PROJECT_ROOT = _os.path.dirname(PROJECT_ROOT)
OUT = _os.path.join(PROJECT_ROOT, "06_workflows"); _os.makedirs(OUT, exist_ok=True)

import json, hashlib, datetime
TODAY = "2026-08-31"
SNAP  = "ONET31.0-IS68076026-v1.0"
CORP  = "CORPUS-IS68076026-v1.2-31AUG26"
RULES = "RULES-IS68076026-v1.0-31AUG26"
SHEET = "__SET_GOOGLE_SHEET_ID__"
GCP   = "__SET_GCP_PROJECT__"; PROC = "__SET_PROCESSOR_ID__"
PROCV = "__SET_PROCESSOR_VERSION__"   # ตรึงเวอร์ชัน processor — Google อัปเดตเงียบ ๆ ได้
SUBID = "__SET_SUB_GAPENGINE_WORKFLOW_ID__"
ERRID = "__SET_ERROR_WORKFLOW_ID__"

# ============================================================ ตัวช่วยสร้างโหนด
class WF:
    def __init__(self, name):
        self.name = name; self.nodes = []; self.conn = {}; self.x = 0
    def add(self, name, ntype, params, tv=1, x=None, y=0, extra=None):
        n = {"parameters": params, "id": hashlib.md5(f"{self.name}{name}".encode()).hexdigest()[:8],
             "name": name, "type": ntype, "typeVersion": tv,
             "position": [self.x if x is None else x, y]}
        if extra: n.update(extra)
        self.nodes.append(n); self.x += 220
        return name
    def link(self, a, b, out=0, idx=0):
        self.conn.setdefault(a, {"main": []})
        while len(self.conn[a]["main"]) <= out: self.conn[a]["main"].append([])
        self.conn[a]["main"][out].append({"node": b, "type": "main", "index": idx})
    def json(self, err=True, notes=None):
        d = {"name": self.name, "nodes": self.nodes, "connections": self.conn,
             "settings": {"executionOrder": "v1", "saveDataErrorExecution": "all",
                          "saveDataSuccessExecution": "all", "saveExecutionProgress": True},
             "meta": {"instanceId": "IS68076026",
                      "description": (notes or "") + f" · สร้าง {TODAY} · snapshot {SNAP} · corpus {CORP} · rules {RULES}"},
             "tags": [{"name": "IS68076026"}]}
        if err: d["settings"]["errorWorkflow"] = ERRID
        return d

CODE = "n8n-nodes-base.code"; HTTP = "n8n-nodes-base.httpRequest"; SHEETS = "n8n-nodes-base.googleSheets"
IF = "n8n-nodes-base.if"; GMAIL = "n8n-nodes-base.gmail"; MERGE = "n8n-nodes-base.merge"

def sheets_append(tab, cols):
    return {"operation": "append", "documentId": {"__rl": True, "value": SHEET, "mode": "id"},
            "sheetName": {"__rl": True, "value": tab, "mode": "name"},
            "columns": {"mappingMode": "autoMapInputData", "matchingColumns": [], "schema": []},
            "options": {"cellFormat": "RAW"}, "_note": "คอลัมน์ตาม sheet_headers_28AUG26.csv: " + cols}

def sheets_read(tab, filt=None):
    p = {"documentId": {"__rl": True, "value": SHEET, "mode": "id"},
         "sheetName": {"__rl": True, "value": tab, "mode": "name"},
         "options": {"returnAllMatches": True}}
    if filt: p["filtersUI"] = {"values": [{"lookupColumn": k, "lookupValue": v} for k, v in filt.items()]}
    return p

def llm(provider, model, temp, body_expr, timeout=180000):
    url = {"openai": "https://api.openai.com/v1/chat/completions",
           "anthropic": "https://api.anthropic.com/v1/messages",
           "google": f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
           "zhipu": "https://open.bigmodel.cn/api/paas/v4/chat/completions"}[provider]
    p = {"method": "POST", "url": url, "authentication": "genericCredentialType",
         "genericAuthType": "httpHeaderAuth", "sendBody": True, "specifyBody": "json",
         "jsonBody": body_expr, "options": {"timeout": timeout, "response": {"response": {"neverError": True}}}}
    if provider == "anthropic":
        p["sendHeaders"] = True
        p["headerParameters"] = {"parameters": [{"name": "anthropic-version", "value": "2023-06-01"}]}
    return p

# ============================================================ โค้ดของโหนด Code (JavaScript)
JS_BUILD_GAP_PROMPT = r"""
// สร้าง prompt เดียวใช้กับ analyst ทั้งสามตัว เพื่อให้ทุกเงื่อนไขได้อินพุตเดียวกัน (§3.8)
// จงใจไม่ส่ง weight และ element_aliases ให้โมเดลเห็น — weight ทำให้โมเดลจัดอันดับเอง
// ส่วน alias คือเฉลยของกฎ R3
const inp = $input.first().json;
const reqs = inp.requirements;                 // 30 แถวของบทบาทนั้น
const profile = inp.resume_profile;            // JSON จากขั้น parse
const evidenceCorpus = inp.evidence_corpus;    // ข้อความนิรนาม + profile JSON
const list = reqs.map(r =>
  `${r.requirement_id} | ${r.domain} | ${r.element_name} | ${r.element_description}`).join('\n');
const system = [
  'You assess whether a resume shows evidence for each required competency.',
  'Rules you MUST follow:',
  '1. Use ONLY the requirement_id values given below. Never invent one.',
  '2. status must be one of: evidenced, partially, missing.',
  '3. For evidenced or partially you MUST quote text that appears VERBATIM in the resume.',
  '4. Never paraphrase a quote. Never infer a skill from a related tool.',
  '5. Return strict JSON only, no prose.'
].join('\n');
const user = [
  'REQUIREMENTS (requirement_id | domain | name | description):', list, '',
  'RESUME PROFILE (JSON):', JSON.stringify(profile), '',
  'RESUME TEXT (anonymised):', evidenceCorpus, '',
  'Return: {"claims":[{"requirement_id":"...","status":"...","evidence_quote":"...","confidence":0.0}]}'
].join('\n');
return [{ json: { ...inp, system_prompt: system, user_prompt: user,
                  prompt_version: 'P2-v0.9-draft' } }];
"""

JS_VALIDATE = r"""
// ============================================================================
// Deterministic Validation — กฎ R0 ถึง R4 · Readiness · ablation · เงื่อนไข C1–C4
// ห้ามมี LLM ในชั้นนี้โดยเด็ดขาด (RQ2) · ทุกค่าคงที่อ่านจาก config ที่ฉีดเข้ามา
// ============================================================================
const merged = $input.all().map(i => i.json);
const base = merged.find(m => m.requirements) || merged[0];
const CFG = base.config;                       // จาก config_master
const THETA = Number(CFG.THETA);
const reqs = base.requirements;
const allow = new Set(reqs.map(r => r.requirement_id));
const byId = Object.fromEntries(reqs.map(r => [r.requirement_id, r]));
const prefix = 'REQ-' + base.role_id + '-';
const corpusText = (base.evidence_corpus || '').toLowerCase();

// ---------- ตัวช่วย ----------
const stem = w => w.replace(/(ing|ed|es|s|ment|tion|ions)$/,'');
const toks = s => (s||'').toLowerCase().match(/[a-z0-9ก-๙]+/g)?.map(stem) || [];
function parseModel(raw) {
  // ทนต่อ code fence และข้อความห่อหุ้ม
  if (!raw) return [];
  let t = String(raw).trim().replace(/^```(json)?/,'').replace(/```$/,'');
  const s = t.indexOf('{'), e = t.lastIndexOf('}');
  if (s < 0 || e < 0) return [];
  try { const o = JSON.parse(t.slice(s, e+1)); return Array.isArray(o.claims) ? o.claims : []; }
  catch { return []; }
}
const MODELS = [
  { key:'A', cond:'glm_only',    label:'glm-5.2',          raw: base.raw_a },
  { key:'B', cond:'sonnet_only', label:'claude-sonnet-5',  raw: base.raw_b },
  { key:'C', cond:'gemini_only', label:'gemini-3.7-flash', raw: base.raw_c },
];
const parsed = {}, failed = [];
for (const m of MODELS) {
  const c = parseModel(m.raw);
  parsed[m.key] = c;
  if (!c.length) failed.push(m.key);
}
if (failed.length === MODELS.length) throw new Error('ERR-GAPENGINE-FAILED: ทุกโมเดลคืนผลที่อ่านไม่ได้');
const tierCap = failed.length > 0 ? 'medium' : 'high';   // CFG-08

// ---------- R2 · หลักฐานปรากฏจริงในข้อความหรือไม่ ----------
const quoteOk = q => !!q && corpusText.includes(String(q).toLowerCase().trim());

// ---------- R3 · ความสอดคล้องเชิงความหมาย ----------
function relevance(q, r) {
  const tq = toks(q), td = toks(r.element_name + ' ' + r.element_description);
  if (!tq.length || !td.length) return { ov:0, alias:false, ok:false };
  const inter = tq.filter(t => td.includes(t)).length;
  const ov = inter / Math.min(tq.length, td.length);
  const aliases = String(r.element_aliases||'').split('|').map(a=>a.trim().toLowerCase()).filter(Boolean);
  const ql = String(q).toLowerCase();
  const alias = aliases.some(a => ql.includes(a) || toks(a).every(t => tq.includes(t)));
  return { ov, alias, ok: ov >= THETA || alias };
}

// ---------- รวมข้ออ้างของทุกโมเดล ----------
const claimsByReq = {};           // requirement_id -> { A:{...}, B:{...}, C:{...} }
const outOfScope = { A:0, B:0, C:0 };
const totals    = { A:0, B:0, C:0 };
const gapClaims = { A:0, B:0, C:0 };
for (const m of MODELS) {
  for (const c of parsed[m.key]) {
    totals[m.key]++;
    const id = String(c.requirement_id||'').trim();
    const status = String(c.status||'').toLowerCase();
    if (status === 'missing' || status === 'partially') gapClaims[m.key]++;
    // ---------- R0 · ขอบเขต (DEC-08) ----------
    if (!id.startsWith(prefix) || !allow.has(id)) { outOfScope[m.key]++; continue; }
    (claimsByReq[id] = claimsByReq[id] || {})[m.key] = c;
  }
}

// ---------- ตัดสินรายข้อกำหนด ----------
const rows = [];
let abl = { A1:0, A2:0, A3:0 };
for (const rid of Object.keys(claimsByReq)) {
  const r = byId[rid], votes = claimsByReq[rid];
  const keys = Object.keys(votes);
  const tally = {};
  for (const k of keys) { const s = String(votes[k].status||'').toLowerCase(); tally[s] = (tally[s]||0) + 1; }
  const ranked = Object.entries(tally).sort((a,b) => b[1]-a[1]);
  const top = ranked[0], tie = ranked.length > 1 && ranked[1][1] === top[1];

  let status = top[0], supporters = keys.filter(k => String(votes[k].status).toLowerCase() === status);
  let excl = '', tier = '', ov = 0, alias = false, quote = '', ok = true;

  // ---------- R1 · เสียงข้างมาก ----------
  if (tie)                { excl = 'EX-R1-TIED'; ok = false; }
  else if (top[1] < 2)    { excl = 'EX-R1-NO-MAJORITY'; ok = false; }
  if (ok) abl.A1++;

  // ---------- R2 · หลักฐานตรงตัว ----------
  if (ok && status !== 'missing') {
    quote = votes[supporters[0]].evidence_quote || '';
    if (!quoteOk(quote)) { excl = 'EX-R2-QUOTE-NOT-FOUND'; ok = false; }
  }
  if (ok) abl.A2++;

  // ---------- R3 · ความสอดคล้อง ----------
  if (ok && status !== 'missing') {
    const rel = relevance(quote, r); ov = rel.ov; alias = rel.alias;
    if (!rel.ok) { excl = 'EX-R3-RELEVANCE-BELOW-THETA'; ok = false; }
  }
  if (ok) abl.A3++;

  // ---------- R4 · ระดับความเชื่อมั่น ----------
  if (ok) tier = (top[1] >= 3 && tierCap === 'high') ? 'high' : 'medium';

  rows.push({
    submission_id: base.submission_id, run_index: base.run_index || 1, role_id: base.role_id,
    snapshot_version: base.snapshot_version, rules_version: base.rules_version,
    validated_at: new Date().toISOString(), requirement_id: rid,
    domain: r.domain, element_name: r.element_name, weight: Number(r.weight_renormalized),
    final_status: ok ? status : 'excluded', confidence_tier: tier, exclusion_reason: excl,
    supporting_models: supporters.map(k => MODELS.find(m=>m.key===k).label).join('|'),
    evidence_id: ok && quote ? 'EV-' + rid : '', evidence_quote: quote,
    rationale: ok ? '' : excl,
    per_model_json: JSON.stringify({ votes, ov: Number(ov.toFixed(4)), al: alias, tie }),
    ablation_A1: !tie && top[1] >= 2 ? 1 : 0,
    ablation_A2: (!tie && top[1] >= 2 && (status === 'missing' || quoteOk(quote))) ? 1 : 0,
    ablation_A3: ok ? 1 : 0,
  });
}

// ---------- Readiness · เหนือ validated เท่านั้น (§3.6) ----------
const validated = rows.filter(r => r.final_status !== 'excluded');
const excluded  = rows.filter(r => r.final_status === 'excluded');
const score = s => s === 'evidenced' ? 1 : (s === 'partially' ? 0.5 : 0);
const denom = validated.reduce((a,r) => a + r.weight, 0);
const numer = validated.reduce((a,r) => a + r.weight * score(r.final_status), 0);
const readiness = denom > 0 ? 100 * numer / denom : 0;

// ---------- เงื่อนไข C1–C4 ----------
const cond = MODELS.map(m => ({
  submission_id: base.submission_id, run_index: base.run_index || 1, condition: m.cond,
  n_claims: totals[m.key], n_gap_claims: gapClaims[m.key],
  n_out_of_scope_claims: outOfScope[m.key],
  out_of_scope_claim_rate: totals[m.key] ? outOfScope[m.key] / totals[m.key] : 0,
  rules_version: base.rules_version, theta: THETA,
}));
cond.push({
  submission_id: base.submission_id, run_index: base.run_index || 1, condition: 'framework',
  n_claims: rows.length, n_gap_claims: validated.filter(r => r.final_status !== 'evidenced').length,
  n_out_of_scope_claims: 0,                    // เป็น 0 โดยโครงสร้างเพราะกฎ R0 (DEC-08)
  out_of_scope_claim_rate: 0, rules_version: base.rules_version, theta: THETA,
});

return [{ json: {
  ...base, gap_result: rows, condition_result: cond,
  readiness_pct: Number(readiness.toFixed(2)),
  n_validated: validated.length, n_excluded: excluded.length,
  weight_share_of_pool: base.weight_share_of_pool,
  ablation: abl, analyst_failures: failed,
  verified_gaps: validated.filter(r => r.final_status !== 'evidenced')
                          .map(r => ({ requirement_id: r.requirement_id, weight: r.weight,
                                       element_name: r.element_name, status: r.final_status })),
} }];
"""

JS_INIT = r"""
// รับจากฟอร์ม → ตรวจความยินยอมและชนิดไฟล์ → ตั้ง submission_id → ฉีด config
const f = $input.first().json;
const bin = $input.first().binary || {};
const CFG = { THETA: 0.15, EVIDENCE_RATIO_MIN: 0.60, TEXT_DENSITY_MIN: 200,
              WEEKS_PER_MONTH: 4.33, RULES_VERSION: '__RULES__' };   // config_master
const consent = String(f.consent || '').trim();
const fileKey = Object.keys(bin)[0];
const fileName = fileKey ? (bin[fileKey].fileName || '') : '';
const isPdf = /\.pdf$/i.test(fileName) || (fileKey && bin[fileKey].mimeType === 'application/pdf');
let error_type = '';
if (consent !== 'ยินยอม' && consent.toLowerCase() !== 'i consent') error_type = 'ERR-CONSENT-DECLINED';
else if (!isPdf) error_type = 'ERR-INVALID-FILE-TYPE';
const id = 'SUB-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' +
           Math.random().toString(36).slice(2,8).toUpperCase();
return [{ json: {
  submission_id: id, run_index: 1, consent_at: new Date().toISOString(),
  role_id: f.role_id, recommendation_mode: f.recommendation_mode,
  timeline_months: Number(f.timeline_months), hours_per_week: Number(f.hours_per_week),
  learning_capacity_hours: Number(f.timeline_months) * CFG.WEEKS_PER_MONTH * Number(f.hours_per_week),
  participant_name: f.name || '', participant_email: f.email || '',
  file_name: fileName, binary_property: fileKey || '',
  config: CFG, rules_version: CFG.RULES_VERSION,
  snapshot_version: '__SNAP__', corpus_version: '__CORP__',
  error_type, ok: error_type === '',
  stage: 'intake', logged_at: new Date().toISOString(),
}, binary: $input.first().binary }];
"""

JS_ANONYMISE = r"""
// ปิดบัง PII ตาม pii_masking_rules → ตรวจความหนาแน่นข้อความ → สร้าง parse prompt
// ⚠ ลำดับการแทนที่สำคัญ: เลขบัตรประชาชนต้องมาก่อนเบอร์โทร
const j = $input.first().json;
let text = String(j.text || j.ocr_text || '');
const rules = [
  ['PII-04', /\b\d{1}[-\s]?\d{4}[-\s]?\d{5}[-\s]?\d{2}[-\s]?\d{1}\b/g, '[NATIONAL_ID]'],
  ['PII-02', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[EMAIL]'],
  ['PII-03', /(\+66|0)\s?\d{1,2}[-\s]?\d{3}[-\s]?\d{3,4}/g, '[PHONE]'],
  ['PII-07', /https?:\/\/(www\.)?(linkedin\.com\/in|github\.com|facebook\.com)\/[^\s]+/gi, '[PROFILE_URL]'],
  ['PII-05', /(บ้านเลขที่|หมู่|ซอย|ถนน|ตำบล|แขวง|อำเภอ|เขต|จังหวัด)[^\n]{0,60}/g, '[ADDRESS]'],
  ['PII-08', /(วันเกิด|Date of Birth|DOB)\s*[:：]?\s*[^\n]{0,30}/gi, '[DOB]'],
];
let n = 0;
for (const [, re, tok] of rules) { text = text.replace(re, () => { n++; return tok; }); }
if (j.participant_name) {                       // PII-01 ใช้ค่าจากฟอร์มเพราะ regex จับชื่อไทยไม่แม่น
  const parts = String(j.participant_name).split(/\s+/).filter(p => p.length > 1);
  for (const p of parts) { const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');
                           text = text.replace(re, () => { n++; return '[NAME]'; }); }
}
const system = 'Extract a structured profile from the resume. Every evidence_text you output MUST appear ' +
               'verbatim in the resume. Never paraphrase. Never invent. Return strict JSON only.';
const user = 'RESUME (anonymised):\n' + text + '\n\nReturn: {"skills":[{"name":"...","evidence_text":"..."}],' +
             '"experience":[{"title":"...","evidence_text":"..."}],"education":[...],"certifications":[...]}';
// ไม่คำนวณ density/needs_ocr ซ้ำที่นี่ — ค่าจาก Density Check คือค่าที่อธิบายว่าทำไมถึงเรียก OCR
// การคำนวณใหม่หลัง mask PII จะทับค่านั้นด้วยตัวเลขที่ไม่มีความหมายในบันทึก pipeline_run
return [{ json: { ...j, anonymised_text: text, pii_redactions: n,
                  system_prompt: system, user_prompt: user, prompt_version: 'P1-v0.9-draft' } }];
"""

JS_VALIDATE_PROFILE = r"""
// ตรวจว่า evidence_text ทุกข้อเป็นข้อความจริงในเรซูเมนิรนาม → คำนวณ evidence_verified_ratio
const j = $input.first().json;
const CFG = j.config;
const raw = j.llm_raw || '';
let profile = {};
try { const s = raw.indexOf('{'), e = raw.lastIndexOf('}'); profile = JSON.parse(raw.slice(s, e+1)); }
catch { return [{ json: { ...j, ok:false, error_type:'ERR-PARSER-FAILED', stage:'parse' } }]; }
const hay = String(j.anonymised_text||'').toLowerCase();
let claimed = 0, verified = 0;
const walk = o => { if (!o || typeof o !== 'object') return;
  if (Array.isArray(o)) return o.forEach(walk);
  if (o.evidence_text) { claimed++; if (hay.includes(String(o.evidence_text).toLowerCase().trim())) verified++; }
  Object.values(o).forEach(walk); };
walk(profile);
const ratio = claimed ? verified / claimed : 0;
const pass = ratio >= CFG.EVIDENCE_RATIO_MIN;
return [{ json: { ...j, resume_profile: profile, n_evidence_claimed: claimed,
  n_evidence_verified: verified, evidence_verified_ratio: Number(ratio.toFixed(4)),
  evidence_corpus: j.anonymised_text + '\n' + JSON.stringify(profile),
  ok: pass, error_type: pass ? '' : 'ERR-EVIDENCE-RATIO-LOW', stage: 'parse' } }];
"""

JS_PREFILTER = r"""
// กรอง corpus ด้วยโค้ด แล้วส่งเฉพาะ item_id ที่อนุญาตให้โมเดลจัดอันดับ
// DEC-11: รับเฉพาะ verification_status = verified และนับความครอบคลุมจากชั้น L1 เท่านั้น
// competency_ids_l1 คือชุด requirement_id ชั้น L1 ที่ DEC-16 เพิ่มเข้ามาใน corpus v1.3
// competency_ids (L1+L2) ยังคำนวณคู่กันไว้เพื่อรายงานสองค่าตาม §3.8
const j = $input.first().json;
const rows = $input.all().map(i => i.json).filter(r => r.item_id);
const mode = j.recommendation_mode;
const gapIds = new Set(j.verified_gaps.map(g => g.requirement_id));
const wByReq = Object.fromEntries(j.verified_gaps.map(g => [g.requirement_id, g.weight]));
const eligible = rows.filter(r =>
  r.role_id === j.role_id &&
  String(r.verification_status) === 'verified' &&                       // DEC-11 / GATE-C
  String(r.recommendation_mode||'').split('|').includes(mode) &&
  String(r.competency_ids_l1||'').split('|').some(c => gapIds.has(c)));
const scored = eligible.map(r => {
  const covered    = String(r.competency_ids_l1||'').split('|').filter(c => gapIds.has(c));
  const coveredAny = String(r.competency_ids||'').split('|').filter(c => gapIds.has(c));
  return { item_id: r.item_id, item_type: r.item_type, title: r.title, provider: r.provider,
           estimated_hours: Number(r.estimated_hours), phase: r.phase,
           covers_requirement_ids_l1: covered.join('|'),
           covers_requirement_ids: coveredAny.join('|'),
           gap_weight_covered: covered.reduce((a,c) => a + (wByReq[c]||0), 0),
           is_prerequisite: r.is_prerequisite || 'no' };
}).sort((a,b) => b.gap_weight_covered - a.gap_weight_covered ||
                 a.estimated_hours - b.estimated_hours);           // ลำดับ deterministic สำรอง
const whitelist = scored.slice(0, 40);                              // จำกัด payload ไม่ให้ prompt ยาวเกิน
const system = 'Rank the given learning items. You may ONLY return item_id values from the provided list. ' +
               'Never invent an item. Never change estimated_hours. Return strict JSON only.';
const user = 'VERIFIED GAPS:\n' + JSON.stringify(j.verified_gaps) +
             '\n\nALLOWED ITEMS:\n' + JSON.stringify(whitelist) +
             '\n\nMODE: ' + mode + '   CAPACITY_HOURS: ' + j.learning_capacity_hours +
             '\n\nReturn: {"ranked":[{"item_id":"...","rank":1,"why":"..."}]}';
return [{ json: { ...j, whitelist, whitelist_ids: whitelist.map(w => w.item_id),
                  no_candidate_found: whitelist.length === 0,
                  system_prompt: system, user_prompt: user, prompt_version: 'P3-v0.9-draft' } }];
"""

JS_RANK_POST = r"""
// ตรวจ whitelist ซ้ำ → เติมรายการที่โมเดลตกหล่นด้วยลำดับ deterministic → ตัดตามความจุ → แบ่ง phase
const j = $input.first().json;
const allowed = new Set(j.whitelist_ids);
const byId = Object.fromEntries(j.whitelist.map(w => [w.item_id, w]));
let ranked = [];
try { const raw = j.llm_raw || ''; const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
      ranked = JSON.parse(raw.slice(s, e+1)).ranked || []; } catch { ranked = []; }
const kept = [], rejected = [];
for (const r of ranked) { if (allowed.has(r.item_id)) kept.push(r.item_id); else rejected.push(r.item_id); }
for (const w of j.whitelist) if (!kept.includes(w.item_id)) kept.push(w.item_id);   // เติมส่วนที่ขาด
const whitelist_compliance = ranked.length ? (ranked.length - rejected.length) / ranked.length : 1;
const mode = j.recommendation_mode;
const mode_ok = kept.every(id => String(byId[id].item_type) === (mode === 'certification_only' ? 'certification'
                 : mode === 'course_only' ? 'course' : byId[id].item_type) || byId[id].is_prerequisite === 'yes');
const PHASE = { foundation: 1, core_gap_closure: 2, advanced_or_cert_prep: 3 };
const ordered = kept.map(id => byId[id]).sort((a,b) => (PHASE[a.phase]||9) - (PHASE[b.phase]||9) ||
                                                        b.gap_weight_covered - a.gap_weight_covered);
const cap = Number(j.learning_capacity_hours);
let used = 0; const selected = [], deferred = [];
for (const it of ordered) {
  if (used + it.estimated_hours <= cap) { used += it.estimated_hours; selected.push(it); }
  else deferred.push({ ...it, defer_reason: 'เกินความจุการเรียนที่ผู้เข้าร่วมระบุ' });
}
const coveredL1  = new Set(selected.flatMap(s => String(s.covers_requirement_ids_l1||'').split('|')).filter(Boolean));
const coveredAny = new Set(selected.flatMap(s => String(s.covers_requirement_ids).split('|')).filter(Boolean));
const nGap = j.verified_gaps.length;
const gap_coverage_l1  = nGap ? j.verified_gaps.filter(g => coveredL1.has(g.requirement_id)).length / nGap : 0;
const gap_coverage_any = nGap ? j.verified_gaps.filter(g => coveredAny.has(g.requirement_id)).length / nGap : 0;
return [{ json: { ...j, selected, deferred, planned_hours: used,
  timeline_feasible: used <= cap, whitelist_compliance,
  recommendation_mode_compliance: mode_ok ? 1 : 0,
  gap_coverage_l1:  Number(gap_coverage_l1.toFixed(4)),
  gap_coverage_any: Number(gap_coverage_any.toFixed(4)),
  recommendation_result: selected.map((s, i) => ({
    submission_id: j.submission_id, run_index: j.run_index, role_id: j.role_id, rank: i + 1,
    item_id: s.item_id, item_type: s.item_type, title: s.title, provider: s.provider,
    phase: s.phase, estimated_hours: s.estimated_hours,
    covers_requirement_ids: s.covers_requirement_ids,
    covers_requirement_ids_l1: s.covers_requirement_ids_l1, status: 'selected' })) } }];
"""

JS_REPORT_PROMPT = r"""
// สร้าง payload ให้ผู้เขียนรายงาน — โมเดลเรียบเรียงถ้อยคำเท่านั้น ห้ามเพิ่มหรือแก้ข้อมูล
const j = $input.first().json;
const proxy = $input.all().map(i => i.json).find(r => r.role_id === j.role_id && r.transparency_text_th);
const payload = {
  role: j.role_id, readiness_pct: j.readiness_pct,
  weight_share_of_pool: j.weight_share_of_pool,
  n_validated: j.n_validated, n_excluded: j.n_excluded,
  gaps: j.verified_gaps, items: j.selected, deferred: j.deferred,
  timeline_months: j.timeline_months, planned_hours: j.planned_hours,
  capacity_hours: j.learning_capacity_hours,
};
const transparency = [
  proxy ? proxy.transparency_text_th : '',
  'ค่าความพร้อมคำนวณจากชุดข้อกำหนด 30 รายการที่ตรึงไว้ ซึ่งครอบคลุมน้ำหนักของบทบาทนี้ ' +
  (Number(j.weight_share_of_pool)*100).toFixed(1) + ' เปอร์เซ็นต์ จึงไม่ใช่คะแนนความสามารถหรือโอกาสได้งาน',
  'ข้อเสนอแนะทั้งหมดเลือกจากคลังที่ตรึงไว้เท่านั้น ระบบไม่สร้างชื่อหลักสูตรหรือใบรับรองขึ้นเอง',
  'This page includes information from O*NET 31.0 Database by USDOL/ETA. Used under CC BY 4.0.',
].filter(Boolean).join('\n');
const system = 'Write a Thai-language report from the JSON payload. You may ONLY use ids, numbers and item ' +
               'titles that appear in the payload. Never add a gap, change a score, select a new item, or ' +
               'alter the timeline. Keep each section within its word budget.';
const user = 'PAYLOAD:\n' + JSON.stringify(payload) + '\n\nTRANSPARENCY NOTES (include verbatim):\n' +
             transparency + '\n\nWORD BUDGET: สรุปภาพรวม 120 คำ · ช่องว่างที่พบ 200 คำ · แผนการเรียน 200 คำ';
return [{ json: { ...j, report_payload: payload, transparency_text: transparency,
                  system_prompt: system, user_prompt: user, prompt_version: 'P4-v0.9-draft' } }];
"""

JS_REFCHECK = r"""
// ตรวจว่ารหัสทุกตัวในรายงานมีอยู่จริงใน payload — ถ้าไม่ตรงให้ทิ้งแล้วใช้ template
const j = $input.first().json;
const md = String(j.llm_raw || '');
const known = new Set([...j.selected.map(s => s.item_id), ...j.verified_gaps.map(g => g.requirement_id)]);
const found = md.match(/\b(CRS|CRT|SUP)-R\d{2}-\d{2}\b|\bREQ-R\d{2}-[\d.A-Za-z]+\b/g) || [];
const bad = [...new Set(found.filter(x => !known.has(x)))];
let report = md, mode = 'llm';
if (!md.trim() || bad.length) {
  mode = 'deterministic_fallback';
  report = ['# รายงานวิเคราะห์ช่องว่างทักษะ', '',
    'ความพร้อมของบทบาทนี้ ' + j.readiness_pct + ' เปอร์เซ็นต์ ' +
    '(จากข้อกำหนดที่ผ่านการตรวจสอบ ' + j.n_validated + ' รายการ)', '',
    '## ช่องว่างที่พบ',
    ...j.verified_gaps.map(g => '- ' + g.requirement_id + ' · ' + g.element_name + ' · ' + g.status),
    '', '## แผนการเรียนที่แนะนำ',
    ...j.selected.map((s,i) => (i+1) + '. ' + s.title + ' (' + s.item_id + ') · ' + s.estimated_hours + ' ชั่วโมง'),
    '', '## หมายเหตุความโปร่งใส', j.transparency_text].join('\n');
}
return [{ json: { ...j, report_markdown: report, report_mode: mode,
                  report_reference_validity: bad.length ? 0 : 1,
                  report_violations: bad.join('|'), completed_at: new Date().toISOString() } }];
"""

# ============================================================ ตัวช่วยเชื่อมผลลัพธ์ LLM กลับเข้ากับ item เดิม
def with_llm(js, src):
    """โหนด HTTP แทนที่ item เดิม จึงต้องดึง item เดิมกลับมาจากโหนดต้นทางที่ระบุ"""
    pre = ("// ดึงข้อความจากผลตอบของผู้ให้บริการ (รองรับทั้ง 3 รูปแบบ) แล้วผูกกลับเข้ากับ item เดิม\n"
           "const _r = $input.first().json;\n"
           "const _txt = _r?.choices?.[0]?.message?.content ?? _r?.content?.[0]?.text ?? "
           "_r?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';\n"
           f"const j = {{ ...$('{src}').first().json, llm_raw: _txt, "
           "llm_usage: _r?.usage ?? _r?.usageMetadata ?? {} };\n")
    return pre + js.replace("const j = $input.first().json;\n", "", 1)

TAG = ("const _r = $input.first().json;\n"
       "const _t = _r?.choices?.[0]?.message?.content ?? _r?.content?.[0]?.text ?? "
       "_r?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';\n"
       "const _u = _r?.usage ?? _r?.usageMetadata ?? {};\n"
       "return [{ json: %s }];\n")

# ============================================================ WF_SUB_GapEngine
sub = WF("WF_SUB_GapEngine_31AUG26")
t = sub.add("When Executed by Another Workflow", "n8n-nodes-base.executeWorkflowTrigger",
            {"workflowInputs": {"values": [{"name": "submission_id"}, {"name": "role_id"},
             {"name": "resume_profile"}, {"name": "evidence_corpus"}, {"name": "config"},
             {"name": "rules_version"}, {"name": "snapshot_version"}, {"name": "run_index"}]}}, tv=1.1)
lr = sub.add("Load Requirements (30)", SHEETS, sheets_read("onet_requirements"), tv=4.5, y=0)
bp = sub.add("Build Gap Prompt", CODE, {"jsCode": JS_BUILD_GAP_PROMPT
     .replace("const inp = $input.first().json;",
              "const inp = $('When Executed by Another Workflow').first().json;")
     .replace("const reqs = inp.requirements;",
              "const reqs = $input.all().map(i=>i.json).filter(r=>r.requirement_id && r.role_id===inp.role_id);")
     .replace("const profile = inp.resume_profile;", "const profile = inp.resume_profile;")
     .replace("return [{ json: { ...inp,", "return [{ json: { ...inp, requirements: reqs,")}, tv=2)
sub.link(t, lr); sub.link(lr, bp)

BODY = {
 "A": ("zhipu", "glm-5.2", "={{ JSON.stringify({ model:'glm-5.2', temperature:0, "
       "thinking:{type:'disabled'}, messages:[{role:'system',content:$json.system_prompt},"
       "{role:'user',content:$json.user_prompt}] }) }}"),
 "B": ("anthropic", "claude-sonnet-5", "={{ JSON.stringify({ model:'claude-sonnet-5', max_tokens:8000, "
       "temperature:0, system:$json.system_prompt, messages:[{role:'user',content:$json.user_prompt}] }) }}"),
 "C": ("google", "gemini-3.7-flash", "={{ JSON.stringify({ generationConfig:{temperature:0,"
       "thinkingConfig:{thinkingLevel:'minimal'}}, systemInstruction:{parts:[{text:$json.system_prompt}]}, "
       "contents:[{role:'user',parts:[{text:$json.user_prompt}]}] }) }}"),
}
NAMES = {"A": "Call GLM 5.2 (analyst A)", "B": "Call Sonnet 5 (analyst B)", "C": "Call Gemini 3.7 Flash (analyst C)"}
TAGJS = {
 "A": TAG % ("{ ...$('Build Gap Prompt').first().json, raw_a:_t, usage_a:_u, model_a:'glm-5.2' }"),
 "B": TAG % ("{ raw_b:_t, usage_b:_u, model_b:'claude-sonnet-5' }"),
 "C": TAG % ("{ raw_c:_t, usage_c:_u, model_c:'gemini-3.7-flash' }"),
}
mg = "Merge Analyst Outputs"
sub.add(mg, MERGE, {"mode": "combine", "combineBy": "combineByPosition", "numberInputs": 3},
        tv=3, x=1500, y=0)
for i, k in enumerate("ABC"):
    prov, mdl, body = BODY[k]
    h = sub.add(NAMES[k], HTTP, llm(prov, mdl, 0, body), tv=4.2, x=900, y=i*180)
    g = sub.add(f"Tag {k}", CODE, {"jsCode": TAGJS[k]}, tv=2, x=1200, y=i*180)
    sub.link(bp, h); sub.link(h, g); sub.link(g, mg, 0, i)
vd = sub.add("Deterministic Validation (R0–R4)", CODE, {"jsCode": JS_VALIDATE}, tv=2, x=1750)
w1 = sub.add("Write gap_result", SHEETS, sheets_append("gap_result",
      "submission_id,run_index,role_id,snapshot_version,rules_version,validated_at,requirement_id,domain,"
      "element_name,weight,final_status,confidence_tier,exclusion_reason,supporting_models,evidence_id,"
      "evidence_quote,rationale,per_model_json,ablation_A1,ablation_A2,ablation_A3"), tv=4.5, x=2000, y=-160)
w2 = sub.add("Write condition_result", SHEETS, sheets_append("condition_result",
      "submission_id,run_index,condition,n_claims,n_gap_claims,n_out_of_scope_claims,"
      "out_of_scope_claim_rate,rules_version,theta"), tv=4.5, x=2000, y=0)
w3 = sub.add("Write model_call_log", SHEETS, sheets_append("model_call_log",
      "submission_id,run_index,role_id,stage,model_id,provider,temperature,latency_ms,input_tokens,"
      "output_tokens,reasoning_tokens,prompt_version,snapshot_version,access_date,raw_response_sha256,raw_response_truncated,raw_response"), tv=4.5, x=2000, y=160)
rt = sub.add("Return to Main", CODE, {"jsCode":
      "return [{ json: $('Deterministic Validation (R0–R4)').first().json }];"}, tv=2, x=2250)
sub.link(mg, vd)
for w in (w1, w2, w3): sub.link(vd, w)
sub.link(w1, rt)

# ============================================================ WF_Main
main = WF("WF_Main_31AUG26")
ft = main.add("On Resume Submission", "n8n-nodes-base.formTrigger", {
    "formTitle": "การวิเคราะห์ช่องว่างทักษะจากเรซูเม (IS 68076026)",
    "formFields": {"values": [
        {"fieldLabel": "consent", "fieldType": "dropdown", "requiredField": True,
         "fieldOptions": {"values": [{"option": "ยินยอม"}, {"option": "ไม่ยินยอม"}]}},
        {"fieldLabel": "name", "requiredField": True},
        {"fieldLabel": "email", "fieldType": "email", "requiredField": True},
        {"fieldLabel": "resume", "fieldType": "file", "requiredField": True,
         "multipleFiles": False, "acceptFileTypes": ".pdf"},
        {"fieldLabel": "role_id", "fieldType": "dropdown", "requiredField": True,
         "fieldOptions": {"values": [{"option": f"R{i:02d}"} for i in range(1, 21)]}},
        {"fieldLabel": "recommendation_mode", "fieldType": "dropdown", "requiredField": True,
         "fieldOptions": {"values": [{"option": "course_only"}, {"option": "certification_only"},
                                     {"option": "both"}]}},
        {"fieldLabel": "timeline_months", "fieldType": "dropdown", "requiredField": True,
         "fieldOptions": {"values": [{"option": "6"}, {"option": "12"}, {"option": "18"}, {"option": "24"}]}},
        {"fieldLabel": "hours_per_week", "fieldType": "number", "requiredField": True},
    ]}, "options": {}}, tv=2.2)
init = main.add("Init Submission & Gate", CODE, {"jsCode": JS_INIT
        .replace("__RULES__", RULES).replace("__SNAP__", SNAP).replace("__CORP__", CORP)}, tv=2)
gate = main.add("Consent & File Type OK?", IF, {"conditions": {"options": {"version": 2},
        "conditions": [{"leftValue": "={{ $json.ok }}", "rightValue": True,
                        "operator": {"type": "boolean", "operation": "true", "singleValue": True}}]}}, tv=2.2)
audit = main.add("Write audit_log", SHEETS, sheets_append("audit_log",
        "submission_id,role_id,stage,error_type,error_message,node,execution_id,logged_at"), tv=4.5, y=260)
ext = main.add("Extract PDF Text", "n8n-nodes-base.extractFromFile",
        {"operation": "pdf", "binaryPropertyName": "={{ $json.binary_property }}",
         "options": {}}, tv=1)
dens = main.add("Density Check", CODE, {"jsCode":
        "const b = $('Init Submission & Gate').first().json;\n"
        "const r = $input.first().json;\n"
        "const text = String(r.text || '');\n"
        "const pages = Number(r.numpages || 1);\n"
        "const d = pages ? text.replace(/\\s/g,'').length / pages : 0;\n"
        "return [{ json: { ...b, text, page_count: pages, char_density_per_page: Math.round(d),\n"
        "                  needs_ocr: d < b.config.TEXT_DENSITY_MIN, ocr_used: false },\n"
        "          binary: $('Init Submission & Gate').first().binary }];"}, tv=2)
needocr = main.add("Needs OCR?", IF, {"conditions": {"options": {"version": 2}, "conditions": [
        {"leftValue": "={{ $json.needs_ocr }}", "rightValue": True,
         "operator": {"type": "boolean", "operation": "true", "singleValue": True}}]}}, tv=2.2)
# auth: ต้องใช้ Google Service Account credential ของ n8n (เปิด "use in HTTP Request node"
#       + scope https://www.googleapis.com/auth/cloud-platform) เพราะ bearer token ของ GCP
#       หมดอายุทุก 1 ชั่วโมง — httpHeaderAuth แบบค้างค่าใช้ได้แค่ชั่วโมงแรกแล้วพังเงียบ
# binary: อ่านจาก Init โดยตรง เพราะ Extract PDF Text และ Density Check ไม่ส่ง binary ต่อ
# version: ตรึง processorVersion เพื่อให้ replay ได้ตาม §3.5.7
ocr = main.add("Google Document AI OCR", HTTP, {"method": "POST",
        "url": f"https://us-documentai.googleapis.com/v1/projects/{GCP}/locations/us/"
               f"processors/{PROC}/processorVersions/{PROCV}:process",
        "authentication": "predefinedCredentialType", "nodeCredentialType": "googleApi",
        "sendBody": True, "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ rawDocument: { content: "
                    "$('Init Submission & Gate').first().binary[$json.binary_property].data, "
                    "mimeType: 'application/pdf' }, skipHumanReview: true }) }}",
        "options": {"timeout": 180000}}, tv=4.2, y=200)
ocrn = main.add("Normalize OCR Output", CODE, {"jsCode":
        "const b = $('Density Check').first().json;\n"
        "const t = $input.first().json?.document?.text || '';\n"
        "// ERR-OCR-EMPTY อยู่ใน enum_error_type อยู่แล้วแต่ไม่เคยถูกยิง — ยิงที่นี่\n"
        "if (!String(t).trim()) throw new Error('ERR-OCR-EMPTY: Document AI คืนข้อความว่าง');\n"
        "return [{ json: { ...b, text: t, ocr_used: true, ocr_engine: 'google-document-ai',\n"
        "                  ocr_processor_version: '" + PROCV + "' } }];"}, tv=2, y=200)
anon = main.add("Anonymise & Build Parse Prompt", CODE, {"jsCode": JS_ANONYMISE}, tv=2, y=0)
# temperature 0: ขั้นนี้ผลิต evidence_text ที่กฎ R2 เอาไปเช็ค verbatim — ต้องรันซ้ำได้
parse = main.add("Call GPT-5.6 Terra (parse)", HTTP, llm("openai", "gpt-5.6-terra", 0,
        "={{ JSON.stringify({ model:'gpt-5.6-terra', temperature:0, "
        "response_format:{type:'json_object'}, "
        "messages:[{role:'system',content:$json.system_prompt},{role:'user',content:$json.user_prompt}] }) }}"), tv=4.2)
vprof = main.add("Validate Profile", CODE,
        {"jsCode": with_llm(JS_VALIDATE_PROFILE, "Anonymise & Build Parse Prompt")}, tv=2)
egate = main.add("Evidence Quality Gate", IF, {"conditions": {"options": {"version": 2}, "conditions": [
        {"leftValue": "={{ $json.ok }}", "rightValue": True,
         "operator": {"type": "boolean", "operation": "true", "singleValue": True}}]}}, tv=2.2)
callsub = main.add("Call SUB_GapEngine", "n8n-nodes-base.executeWorkflow", {
        "workflowId": {"__rl": True, "value": SUBID, "mode": "id"},
        "workflowInputs": {"mappingMode": "autoMapInputData", "value": {}},
        "options": {"waitForSubWorkflow": True}}, tv=1.2)
lcorp = main.add("Load Corpus (verified only)", SHEETS,
        sheets_read("recommendation_master"), tv=4.5)
pre = main.add("Pre-filter Corpus & Build Rank Prompt", CODE,
        {"jsCode": JS_PREFILTER.replace("const j = $input.first().json;",
                                        "const j = $('Call SUB_GapEngine').first().json;")}, tv=2)
rank = main.add("Call Sonnet 5 (rank)", HTTP, llm("anthropic", "claude-sonnet-5", 0,
        "={{ JSON.stringify({ model:'claude-sonnet-5', max_tokens:4000, temperature:0, "
        "system:$json.system_prompt, messages:[{role:'user',content:$json.user_prompt}] }) }}"), tv=4.2)
rpost = main.add("Rank Post-Validation & Pathway", CODE,
        {"jsCode": with_llm(JS_RANK_POST, "Pre-filter Corpus & Build Rank Prompt")}, tv=2)
lprox = main.add("Load proxy_mapping_log", SHEETS, sheets_read("proxy_mapping_log"), tv=4.5)
rprompt = main.add("Build Report Prompt", CODE,
        {"jsCode": JS_REPORT_PROMPT.replace("const j = $input.first().json;",
                    "const j = $('Rank Post-Validation & Pathway').first().json;")}, tv=2)
rep = main.add("Call GPT-5.6 Terra (report)", HTTP, llm("openai", "gpt-5.6-terra", 0.2,
        "={{ JSON.stringify({ model:'gpt-5.6-terra', temperature:0.2, "
        "messages:[{role:'system',content:$json.system_prompt},{role:'user',content:$json.user_prompt}] }) }}"), tv=4.2)
ref = main.add("Reference Check & Fallback", CODE,
        {"jsCode": with_llm(JS_REFCHECK, "Build Report Prompt")}, tv=2)
wrun = main.add("Write pipeline_run", SHEETS, sheets_append("pipeline_run",
        "submission_id,run_index,role_id,snapshot_version,consent_at,file_sha256,page_count,"
        "char_density_per_page,ocr_used,ocr_engine,ocr_processor_version,pii_redactions,evidence_verified_ratio,"
        "n_evidence_claimed,n_evidence_verified,readiness_pct,n_validated,n_excluded,recommendation_mode,"
        "timeline_months,hours_per_week,learning_capacity_hours,planned_hours,timeline_feasible,"
        "whitelist_compliance,recommendation_mode_compliance,gap_coverage_l1,gap_coverage_any,no_candidate_found,report_mode,"
        "report_reference_validity,report_violations,report_markdown_sha256,report_markdown,completed_at"), tv=4.5, y=-160)
wrec = main.add("Write recommendation_result", SHEETS, sheets_append("recommendation_result",
        "submission_id,run_index,role_id,rank,item_id,item_type,title,provider,phase,estimated_hours,"
        "covers_requirement_ids,covers_requirement_ids_l1,status"), tv=4.5, y=0)
mail = main.add("Send Report Email", GMAIL, {"sendTo": "={{ $json.participant_email }}",
        "subject": "=รายงานวิเคราะห์ช่องว่างทักษะ · {{ $json.submission_id }}",
        "emailType": "text", "message": "={{ $json.report_markdown }}", "options": {}}, tv=2.1, y=160)

main.link(ft, init); main.link(init, gate)
main.link(gate, ext, 0); main.link(gate, audit, 1)
main.link(ext, dens); main.link(dens, needocr)
main.link(needocr, ocr, 0); main.link(ocr, ocrn); main.link(ocrn, anon)
main.link(needocr, anon, 1)
main.link(anon, parse); main.link(parse, vprof); main.link(vprof, egate)
main.link(egate, callsub, 0); main.link(egate, audit, 1)
main.link(callsub, lcorp); main.link(lcorp, pre); main.link(pre, rank)
main.link(rank, rpost); main.link(rpost, lprox); main.link(lprox, rprompt)
main.link(rprompt, rep); main.link(rep, ref)
main.link(ref, wrun); main.link(ref, wrec); main.link(wrun, mail)

# ============================================================ WF_ERR
err = WF("WF_ERR_Notifier_31AUG26")
et = err.add("Error Trigger", "n8n-nodes-base.errorTrigger", {})
ec = err.add("Format Error Row", CODE, {"jsCode":
     "const e = $input.first().json;\n"
     "const KNOWN = ['ERR-CONSENT-DECLINED','ERR-INVALID-FILE-TYPE','ERR-DUPLICATE-SUBMISSION',\n"
     "  'ERR-PDF-UNREADABLE','ERR-OCR-EMPTY','ERR-PARSER-FAILED','ERR-EVIDENCE-RATIO-LOW',\n"
     "  'ERR-ANALYST-TIMEOUT','ERR-GAPENGINE-FAILED','ERR-RANKER-FAILED','ERR-NO-CANDIDATE-FOUND',\n"
     "  'ERR-REPORTER-FAILED','ERR-SHEETS-WRITE-FAILED'];   // enum_error_type\n"
     "const msg = e.execution?.error?.message || '';\n"
     "const code = KNOWN.find(k => msg.includes(k)) || 'ERR-UNCLASSIFIED';\n"
     "return [{ json: { submission_id: e.execution?.customData?.submission_id || '',\n"
     "  role_id: '', stage: e.execution?.lastNodeExecuted || '', error_type: code,\n"
     "  error_message: msg.slice(0,500), node: e.execution?.lastNodeExecuted || '',\n"
     "  execution_id: e.execution?.id || '', logged_at: new Date().toISOString() } }];"}, tv=2)
ew = err.add("Write audit_log", SHEETS, sheets_append("audit_log",
     "submission_id,role_id,stage,error_type,error_message,node,execution_id,logged_at"), tv=4.5)
em = err.add("Notify Researcher", GMAIL, {"sendTo": "__SET_RESEARCHER_EMAIL__",
     "subject": "=[IS68076026] {{ $json.error_type }} · {{ $json.execution_id }}",
     "emailType": "text", "message": "={{ JSON.stringify($json, null, 2) }}", "options": {}}, tv=2.1)
err.link(et, ec); err.link(ec, ew); err.link(ew, em)

# ============================================================ เขียนไฟล์ + ตรวจความถูกต้อง
files = {"WF_SUB_GapEngine_31AUG26.json": sub.json(notes="แกนงานวิจัย · analyst 3 ตัว + validation ด้วยโค้ดล้วน"),
         "WF_Main_31AUG26.json":          main.json(notes="intake → parse → GapEngine → rank → pathway → report"),
         "WF_ERR_Notifier_31AUG26.json":  err.json(err=False, notes="error workflow กลาง")}
for fn, d in files.items():
    json.dump(d, open(_os.path.join(OUT, fn), "w", encoding="utf-8"), ensure_ascii=False, indent=2)

print(f"เขียน workflow {len(files)} ไฟล์ → 06_workflows/\n")
ok = True
for fn, d in files.items():
    names = {n["name"] for n in d["nodes"]}
    bad = [t["node"] for v in d["connections"].values() for o in v["main"] for t in (o or [])
           if t["node"] not in names]
    tgt = {t["node"] for v in d["connections"].values() for o in v["main"] for t in (o or [])}
    orphan = [n for n in names if n not in tgt and n not in d["connections"]]
    code_lines = sum(len(n["parameters"].get("jsCode","").splitlines()) for n in d["nodes"])
    llmn = sum(1 for n in d["nodes"] if n["type"].endswith("httpRequest") and "generativelanguage" in
               json.dumps(n) or n["type"].endswith("httpRequest"))
    print(f"  {fn:<34} {len(d['nodes']):>2} โหนด · Code {code_lines:>3} บรรทัด · "
          f"เชื่อมผิด {len(bad)} · โหนดลอย {len(orphan)}")
    if bad: print("      ปลายทางไม่พบ:", bad); ok = False
    if orphan: print("      โหนดลอย:", orphan); ok = False
print("\nตรวจโครงสร้าง:", "ผ่าน" if ok else "ไม่ผ่าน")
