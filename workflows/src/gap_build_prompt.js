// WF_SUB_GapEngine · Build Prompt — อ่านข้อกำหนดด้วยรหัสอาชีพ (ไม่ใช้ฐานข้อมูลเวกเตอร์) · prompt ชุดเดียวทั้งสามโมเดล
const input = $('When Called by Main').first().json.payload;
const reqs = $('Read Requirements').all().map((i) => i.json).filter((r) => r.role_id === input.ctx.role_id);
if (reqs.length !== CFG.project.requirements_per_role) {
  throw new Error(`[run_id=${input.ctx.run_id}] ข้อผิดพลาดของข้อมูลอ้างอิง: ref_requirements ของ ${input.ctx.role_id} มี ${reqs.length} แถว (ต้อง ${CFG.project.requirements_per_role})`);
}
// DEC-55: งานหลักของอาชีพส่งเข้า prompt เดียวกัน (มีเฉพาะ workflow ที่ฝัง SIGNALS)
const tasks = typeof SIGNALS_FOR === 'function' ? SIGNALS_FOR(input.ctx.role_id).roleTasks : [];
const prompt = ENGINE.buildPrompt(CFG.prompt, input.ctx.role_id, reqs, input.text, tasks);
return [{ json: { ctx: input.ctx, text: input.text, text_sha256: input.text_sha256, requirements: reqs, prompt } }];
