// run_local.mjs — รันเส้นทางเต็มในเครื่องด้วยผลตอบกลับสังเคราะห์ (ภาคผนวก ค)
// ใช้ engine.js ไฟล์เดียวกับที่ฝังใน workflow · ไม่เรียกบริการจริง · ไม่ใช่ผลจากผู้เข้าร่วม
//   node scripts/run_local.mjs            -> evidence/run_local/<case>/... + evidence/run_local/table_C1.csv
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ENGINE, loadRefs, refsForRun, readCSV, toCSV } from './lib/refs.mjs';

export function mockSender(mock) {
  let n = 0;
  return async () => {
    n++;
    if (mock.simulate === 'http_error' && n <= mock.times) { const e = new Error('HTTP ' + mock.status); e.httpCode = mock.status; throw e; }
    if (mock.simulate === 'timeout' && n <= mock.times) { const e = new Error('ETIMEDOUT'); e.code = 'ETIMEDOUT'; throw e; }
    const payload = mock.response_after || mock;
    return { latency_ms: 1000 + n, json: { choices: [{ message: { content: payload.text }, finish_reason: payload.finish_reason }], usage: { prompt_tokens: payload.input_tokens, completion_tokens: payload.output_tokens }, model: 'mock-model' } };
  };
}

export async function runCase(caseDir, refs, opts = {}) {
  const meta = JSON.parse(fs.readFileSync(path.join(caseDir, 'meta.json'), 'utf8'));
  const raw = fs.readFileSync(path.join(caseDir, 'resume.txt'), 'utf8');
  const nowIso = opts.nowIso || '2026-10-01T10:00:00+07:00';
  const ctx = { timestamp: meta.timestamp, email: meta.email, file_id: meta.file_id, role_id: meta.role_id, mode: meta.mode,
    timeline_months: meta.timeline_months, hours_per_week: meta.hours_per_week, consent: true };
  ctx.response_id = ENGINE.responseId(ctx);
  ctx.created_at = nowIso;
  ctx.run_id = ENGINE.makeRunId(ctx.response_id, nowIso);
  const prep = ENGINE.prepareText(raw);
  const ocr = { engine: meta.ocr_engine, engine_version: 'fixture', text_sha256: prep.text_sha256 };
  const requirements = refs.requirements.filter((r) => r.role_id === ctx.role_id);
  const prompt = ENGINE.buildPrompt(refs.prompt, ctx.role_id, requirements, prep.text);
  // ใช้ openai-shaped mock สำหรับทุกโมเดลเพื่อทดสอบตรรกะ (การแปลงผลรายผู้ให้บริการทดสอบแยกใน tests/providers.test.mjs)
  const modelsCfg = JSON.parse(JSON.stringify(refs.modelsCfg));
  for (const k of ENGINE.MODEL_KEYS) modelsCfg.models[k].api = 'openai_chat_completions';
  const modelResults = {}; const modelCalls = [];
  let sendCount = 0;
  await Promise.all(ENGINE.MODEL_KEYS.map(async (k) => {
    const mock = JSON.parse(fs.readFileSync(path.join(caseDir, 'mock_responses', k + '.json'), 'utf8'));
    const req = ENGINE.buildProviderRequest(k, modelsCfg, prompt, { MODEL_A_ID: 'mock-a', MODEL_B_ID: 'mock-b', MODEL_C_ID: 'mock-c' });
    const send = mockSender(mock);
    const r = await ENGINE.callModelWithRetry(k, modelsCfg, req, async (...a) => { sendCount++; return send(...a); }, ctx.run_id, () => nowIso);
    modelResults[k] = r; modelCalls.push(...r.calls);
  }));
  modelCalls.sort((a, b) => (a.model_key + a.attempt).localeCompare(b.model_key + b.attempt));
  const out = ENGINE.decideAndPlan({ ctx, requirements, text: prep.text, modelResults, corpus: refs.corpus, mappings: refs.mappings, projectCfg: refs.projectCfg, nowIso });
  const payload = ENGINE.freezeReport({ ctx, ocr, evalResult: out.eval, plan: out.plan, modelCalls, refs: refsForRun(refs, ctx.role_id) });
  const html = ENGINE.renderReportHTML(payload, refs.projectCfg);
  // เทียบกับเฉลยของชุดทดสอบ (ไม่ใช่ชุดคำตอบอ้างอิงตาม 3.8.2)
  const key = Object.fromEntries(readCSV(path.relative(ROOT, path.join(caseDir, 'answer_key.csv'))).map((r) => [r.requirement_id, r.expected_status]));
  const decided = out.eval.decisions.filter((d) => d.final_status !== 'abstained');
  const correct = decided.filter((d) => key[d.requirement_id] === d.final_status).length;
  const summary = {
    case: meta.case, role_id: ctx.role_id, run_id: ctx.run_id, usable_models: out.eval.m, decided: decided.length, total: requirements.length,
    correct_on_decided: correct, accuracy_on_decided: decided.length ? +(correct / decided.length).toFixed(3) : null,
    R: out.eval.scores.readiness_pct, C: out.eval.scores.weighted_coverage, unsupported_claims: out.eval.scores.unsupported_claims,
    n_claims: out.eval.scores.n_claims, plan_items: out.plan.items.length, plan_hours: out.plan.total_hours, Hmax: out.plan.Hmax,
    gaps: out.plan.n_gaps, gap_coverage: out.plan.gap_coverage, gap_coverage_with_candidate: out.plan.gap_coverage_with_candidate,
    uncovered_no_candidate: out.plan.uncovered_no_candidate.length, uncovered_over_capacity: out.plan.uncovered_over_capacity.length,
    pii_masked: prep.pii_masked_count, model_calls: modelCalls.length, send_calls: sendCount, report_hash: payload.report_hash,
  };
  return { ctx, prep, out, payload, html, modelCalls, summary };
}

async function main() {
  const refs = loadRefs();
  const base = path.join(ROOT, 'evidence', 'run_local');
  fs.mkdirSync(base, { recursive: true });
  const rows = [];
  for (const c of ['A', 'B', 'C']) {
    const r = await runCase(path.join(ROOT, 'synthetic', 'case_' + c), refs);
    const d = path.join(base, 'case_' + c);
    fs.mkdirSync(d, { recursive: true });
    const cols = refs.sheetsCfg.tabs;
    fs.writeFileSync(path.join(d, 'findings.csv'), toCSV(r.out.eval.findings, cols.findings.columns));
    fs.writeFileSync(path.join(d, 'decisions.csv'), toCSV(r.out.eval.decisions, cols.decisions.columns));
    fs.writeFileSync(path.join(d, 'plan_items.csv'), toCSV(r.out.planRows, cols.plan_items.columns));
    fs.writeFileSync(path.join(d, 'model_calls.csv'), toCSV(r.modelCalls, cols.model_calls.columns));
    fs.writeFileSync(path.join(d, 'report_payload.json'), JSON.stringify(r.payload, null, 1));
    fs.writeFileSync(path.join(d, 'report.html'), r.html);
    fs.writeFileSync(path.join(d, 'summary.json'), JSON.stringify(r.summary, null, 1));
    rows.push(r.summary);
    console.log(`case ${c} ${r.summary.role_id}: m=${r.summary.usable_models} decided ${r.summary.decided}/30 correct ${r.summary.correct_on_decided} acc ${r.summary.accuracy_on_decided} R ${r.summary.R} C ${r.summary.C} U ${r.summary.unsupported_claims} plan ${r.summary.plan_items} items ${r.summary.plan_hours}h / Hmax ${r.summary.Hmax} gapcov ${r.summary.gap_coverage} (${r.summary.gap_coverage_with_candidate})`);
  }
  fs.writeFileSync(path.join(base, 'table_C1.csv'), toCSV(rows));
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });
