// WF_IS_68076026_01OCT26 · Prepare Relevance Checks (DEC-51) — R0 → R2 → R3a ของทุกโมเดล แล้วรวบรวมข้อความที่ผ่าน R2 แต่คำไม่ตรง (R3a)
// ส่งให้โมเดลอื่นตรวจความหมายตามลำดับหมุนเวียน A→B · B→C · C→A (ถ้าผู้ตรวจล้มตอนวิเคราะห์ ใช้โมเดลที่เหลือ · ไม่ให้ตรวจตัวเอง)
const input = $('Start Evidence Check').first().json.payload;
const sig = SIGNALS_FOR(input.ctx.role_id);
const pv = ENGINE.prepareVerification({ roleId: input.ctx.role_id, requirements: input.requirements, text: input.text, modelResults: input.model_results,
  projectCfg: CFG.project, verifierTemplate: CFG.verifierPrompt, roleTasks: sig.roleTasks });
return [{ json: { ctx: input.ctx, requests: pv.requests, n_checks: pv.checks.length, n_unassigned: pv.n_unassigned } }];
