// WF_IS68076026 · Apply Rules R0-R4 — R0→R2→R3→R1→R4 · คะแนน R C U (ช่วงที่ 4 ตรวจและรวมผล · UC-04)
const input = $('Start Evidence Check').first().json.payload;
if (!Array.isArray(input.requirements) || input.requirements.length !== CFG.project.requirements_per_role) {
  throw new Error(`[run_id=${input.ctx && input.ctx.run_id}] payload ไม่มี requirements ครบ ${CFG.project.requirements_per_role} ข้อ (บั๊ก B2)`);
}
const now = new Date().toISOString();
const ev = ENGINE.evaluateRun({ runId: input.ctx.run_id, roleId: input.ctx.role_id, requirements: input.requirements, text: input.text, modelResults: input.model_results, projectCfg: CFG.project, nowIso: now });
return [{ json: { input, eval: ev, now } }];
