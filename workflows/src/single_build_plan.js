// WF_IS68076026 · Build Learning Plan — ช่องว่าง · Hmax · เลือกรายการจาก L1 ที่ผ่านตรวจ (ช่วงที่ 5 · UC-05) แล้วตรึงชุดข้อมูลรายงาน
const a = $('Apply Rules R0-R4').first().json;
const input = a.input; const ev = a.eval; const now = a.now;
const corpus = $('Load Corpus').all().map((i) => i.json);
const mapsRaw = $('Load Mappings').all().map((i) => i.json);
if (corpus.length !== CFG.expected.corpus_rows || mapsRaw.length !== CFG.expected.mapping_rows) {
  throw new Error(`[run_id=${input.ctx.run_id}] ข้อผิดพลาดของข้อมูลอ้างอิง: ref_corpus ${corpus.length}/${CFG.expected.corpus_rows} ref_mappings ${mapsRaw.length}/${CFG.expected.mapping_rows} (นำเข้าไม่ครบ)`);
}
// DEC-21: ตรวจสถานะที่นำเข้าไว้ในแท็บ ref_mappings
const mappings = ENGINE.mergeMappingReview(mapsRaw, mapsRaw.map((m) => ({ map_id: m.map_id, mapping_status: m.mapping_status })), CFG.project.min_approved_share_of_L1);
const plan = ENGINE.buildPlan({ decisions: ev.decisions, corpus, mappings, mode: input.ctx.mode, months: input.ctx.timeline_months, hoursPerWeek: input.ctx.hours_per_week, projectCfg: CFG.project, roleId: input.ctx.role_id });
const refs = Object.assign({}, CFG.refs, { role_name_th: CFG.roleNames[input.ctx.role_id] || '' });
const payload = ENGINE.freezeReport({ ctx: input.ctx, ocr: { engine: input.ctx.ocr_engine, engine_version: input.ctx.ocr_engine_version, text_sha256: input.text_sha256 }, evalResult: ev, plan, modelCalls: input.model_calls, refs });
const s = ev.scores;
const runRow = ENGINE.runRowFrom(input.ctx, { stage: 'ready', updated_at: now, ocr_engine: input.ctx.ocr_engine, model_status: ENGINE.modelStatusSummary(ev),
  readiness_pct: s.readiness_pct, weighted_coverage: s.weighted_coverage, n_evidenced: s.n_evidenced, n_partially: s.n_partially, n_missing: s.n_missing,
  n_abstained: s.n_abstained, unsupported_claims: s.unsupported_claims, report_hash: payload.report_hash });
const audit = { ts: now, actor: 'WF_IS68076026', run_id: input.ctx.run_id, event: ev.halted ? 'halted_min_models' : 'decided',
  detail: JSON.stringify({ m: ev.m, U: s.U, plan_items: plan.items.length, strategy: plan.strategy, notice: plan.notice }) };
return [{ json: { ctx: input.ctx, plan_rows: ENGINE.planRowsFrom(input.ctx, plan), run_row: runRow, audit, report_payload: payload } }];
