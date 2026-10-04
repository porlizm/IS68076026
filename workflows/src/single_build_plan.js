// WF_IS68076026 · Build Learning Plan — ช่องว่าง · Hmax · เลือกรายการจาก L1 ที่ผ่านตรวจ ตามระดับผู้เรียน (ช่วงที่ 5 · UC-05 · DEC-56) แล้วตรึงชุดข้อมูลรายงาน
const a = $('Apply Rules R0-R7').first().json;
const input = a.input; const ev = a.eval; const now = a.now;
const corpus = $('Load Corpus').all().map((i) => i.json);
const mapsRaw = $('Load Mappings').all().map((i) => i.json);
const mappings = ENGINE.mergeMappingReview(mapsRaw, mapsRaw.map((m) => ({ map_id: m.map_id, mapping_status: m.mapping_status })), CFG.project.min_approved_share_of_L1);
const learner = { years_experience: ENGINE.estimateYearsExperience(input.text, now.slice(0, 4)) };
const plan = ENGINE.buildPlan({ decisions: ev.decisions, corpus, mappings, mode: input.ctx.mode, months: input.ctx.timeline_months, hoursPerWeek: input.ctx.hours_per_week, projectCfg: CFG.project, roleId: input.ctx.role_id, learner });
const refs = Object.assign({}, CFG.refs, { role_name_th: CFG.roleNames[input.ctx.role_id] || '', stamp: STAMP });
const payload = ENGINE.freezeReport({ ctx: input.ctx, ocr: { engine: input.ctx.ocr_engine, engine_version: input.ctx.ocr_engine_version, text_sha256: input.text_sha256 }, evalResult: ev, plan, modelCalls: a.model_calls_all, refs });
const s = ev.scores;
const runRow = ENGINE.runRowFrom(input.ctx, { stage: 'ready', updated_at: now, ocr_engine: input.ctx.ocr_engine, model_status: ENGINE.modelStatusSummary(ev),
  readiness_pct: s.readiness_pct, weighted_coverage: s.weighted_coverage, n_evidenced: s.n_evidenced, n_partially: s.n_partially, n_missing: s.n_missing,
  n_abstained: s.n_abstained, unsupported_claims: s.unsupported_claims, role_task_index: s.role_task_index, tech_match_pct: s.tech_match_pct, report_hash: payload.report_hash,
  stamp: STAMP, model_ids: payload.model_ids, tokens: payload.tokens });
const audit = { ts: now, actor: 'WF_IS_68076026_01OCT26', run_id: input.ctx.run_id, event: ev.halted ? 'halted_min_models' : 'decided',
  detail: JSON.stringify({ m: ev.m, U: s.U, checks: ev.n_checks, unverified: s.n_unverified_votes, ablation: s.ablation, r7: { actor: s.n_r7_actor, reuse: s.n_r7_reuse, task_actor: s.n_r7_task_actor, actor_unknown: s.n_actor_unknown }, role_fit: s.role_fit, tokens: payload.tokens.total, T: s.role_task_index, plan_items: plan.items.length, strategy: plan.strategy, level_filter: plan.learner.level_filter_applied, notice: plan.notice }) };
return [{ json: { ctx: input.ctx, plan_rows: ENGINE.planRowsFrom(input.ctx, plan), run_row: runRow, audit, report_payload: payload } }];
