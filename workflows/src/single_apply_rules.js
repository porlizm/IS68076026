// WF_IS_68076026_01OCT26 · Apply Rules R0-R6 — R0→R2→R3 (R3a คำซ้ำ · R3b ผลของผู้ตรวจ)→R1→R4→R5/R6 · คะแนน R C U · ดัชนี T H (ช่วงที่ 4 · UC-04 · DEC-51–55)
const input = $('Start Evidence Check').first().json.payload;
if (!Array.isArray(input.requirements) || input.requirements.length !== CFG.project.requirements_per_role) {
  throw new Error(`[run_id=${input.ctx && input.ctx.run_id}] payload ไม่มี requirements ครบ ${CFG.project.requirements_per_role} ข้อ (บั๊ก B2)`);
}
const vr = $('Collect Verifier Results').first().json;
const corpus = $('Load Corpus').all().map((i) => i.json);
const mapsRaw = $('Load Mappings').all().map((i) => i.json);
if (corpus.length !== CFG.expected.corpus_rows || mapsRaw.length !== CFG.expected.mapping_rows) {
  throw new Error(`[run_id=${input.ctx.run_id}] ข้อผิดพลาดของข้อมูลอ้างอิง: ref_corpus ${corpus.length}/${CFG.expected.corpus_rows} ref_mappings ${mapsRaw.length}/${CFG.expected.mapping_rows} (นำเข้าไม่ครบ)`);
}
// DEC-21: ตรวจสถานะที่นำเข้าไว้ในแท็บ ref_mappings
const mappings = ENGINE.mergeMappingReview(mapsRaw, mapsRaw.map((m) => ({ map_id: m.map_id, mapping_status: m.mapping_status })), CFG.project.min_approved_share_of_L1);
const now = new Date().toISOString();
const ev = ENGINE.evaluateRun({ runId: input.ctx.run_id, roleId: input.ctx.role_id, requirements: input.requirements, text: input.text, modelResults: input.model_results,
  verifierResults: vr.verifier_results, ...SIGNALS_FOR(input.ctx.role_id), corpus, mappings, projectCfg: CFG.project, nowIso: now });
return [{ json: { input, eval: ev, now, mappings_ok: true, model_calls_all: (input.model_calls || []).concat(vr.verifier_calls || []) } }];
