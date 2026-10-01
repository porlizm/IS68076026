// WF_SUB_Decide · Decide & Plan — กฎ R0→R2→R3→R1→R4 · สมการ 3.1–3.8 · ชุดข้อมูลรายงานรุ่นคงที่ (UC-03/04/05)
const input = $('When Called by Main').first().json.payload;
if (!Array.isArray(input.requirements) || input.requirements.length !== CFG.project.requirements_per_role) {
  throw new Error(`[run_id=${input.ctx && input.ctx.run_id}] payload ไม่มี requirements ครบ ${CFG.project.requirements_per_role} ข้อ (บั๊ก B2)`);
}
const corpus = $('Read Corpus').all().map((i) => i.json);
const mapsRaw = $('Read Mappings').all().map((i) => i.json);
if (corpus.length !== CFG.expected.corpus_rows || mapsRaw.length !== CFG.expected.mapping_rows) {
  throw new Error(`[run_id=${input.ctx.run_id}] ข้อผิดพลาดของข้อมูลอ้างอิง: ref_corpus ${corpus.length}/${CFG.expected.corpus_rows} ref_mappings ${mapsRaw.length}/${CFG.expected.mapping_rows} (นำเข้าไม่ครบ)`);
}
// DEC-21: ตรวจสถานะที่นำเข้าไว้ในแท็บ ref_mappings (merge จาก mapping_review.csv ตอนสร้างไฟล์นำเข้า)
const mappings = ENGINE.mergeMappingReview(mapsRaw, mapsRaw.map((m) => ({ map_id: m.map_id, mapping_status: m.mapping_status })), CFG.project.min_approved_share_of_L1);
const now = new Date().toISOString();
const out = ENGINE.decideAndPlan({ ctx: input.ctx, requirements: input.requirements, text: input.text, modelResults: input.model_results, corpus, mappings, projectCfg: CFG.project, nowIso: now });
const refs = Object.assign({}, CFG.refs, { role_name_th: CFG.roleNames[input.ctx.role_id] || '' });
const payload = ENGINE.freezeReport({ ctx: input.ctx, ocr: { engine: input.ctx.ocr_engine, engine_version: input.ctx.ocr_engine_version, text_sha256: input.text_sha256 }, evalResult: out.eval, plan: out.plan, modelCalls: input.model_calls, refs });
const s = out.eval.scores;
const runRow = ENGINE.runRowFrom(input.ctx, { stage: 'ready', updated_at: now, ocr_engine: input.ctx.ocr_engine, model_status: ENGINE.modelStatusSummary(out.eval),
  readiness_pct: s.readiness_pct, weighted_coverage: s.weighted_coverage, n_evidenced: s.n_evidenced, n_partially: s.n_partially, n_missing: s.n_missing,
  n_abstained: s.n_abstained, unsupported_claims: s.unsupported_claims, report_hash: payload.report_hash });
const audit = { ts: now, actor: 'WF_SUB_Decide', run_id: input.ctx.run_id, event: out.eval.halted ? 'halted_min_models' : 'decided',
  detail: JSON.stringify({ m: out.eval.m, U: s.U, plan_items: out.plan.items.length, notice: out.plan.notice }) };
return [{ json: { ctx: input.ctx, findings: out.eval.findings, decisions: out.eval.decisions, plan_rows: out.planRows, run_row: runRow, audit, report_payload: payload } }];
