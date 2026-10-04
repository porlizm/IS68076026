// WF_IS_68076026_01OCT26 · Prepare Relevance Checks (DEC-51 · DEC-60) — R0 → R2 → R3a ของทุกโมเดล แล้วรวบรวมข้อความที่ผ่าน R2 แต่คำไม่ตรง (R3a)
// ส่งให้โมเดลอื่นตรวจความหมายตามลำดับหมุนเวียน A→B · B→C · C→A (ถ้าผู้ตรวจล้มตอนวิเคราะห์ ใช้โมเดลที่เหลือ · ไม่ให้ตรวจตัวเอง)
// DEC-60: ข้อที่เคยตรวจแล้ว (hash ของ prompt + รหัสรุ่นผู้ตรวจ + ข้อกำหนด + quote ตรงกัน) ใช้คำตัดสินเดิม ไม่เรียกผู้ตรวจซ้ำ · ปิดได้ที่ config verifier_cache.enabled
const input = $('Start Evidence Check').first().json.payload;
const bad = ENGINE.versionIssues(STAMP, [input.ctx.stamp], CFG.project.freeze);
if (bad.length) throw new Error(`[run_id=${input.ctx.run_id}] version_mismatch: ${bad.join(' · ')}`);
const sig = SIGNALS_FOR(input.ctx.role_id);
const cc = ENGINE.cacheCfg(CFG.project);
let entries = null;
if (cc.enabled) { try { entries = $getWorkflowStaticData('global').verifierCache || {}; } catch (e) { entries = null; } }
const cache = entries ? { enabled: true, entries, prompt_id: CFG.project.verifier_prompt_version, model_ids: { A: $env.MODEL_A_ID, B: $env.MODEL_B_ID, C: $env.MODEL_C_ID } } : null;
const pv = ENGINE.prepareVerification({ roleId: input.ctx.role_id, requirements: input.requirements, text: input.text, modelResults: input.model_results,
  projectCfg: CFG.project, verifierTemplate: CFG.verifierPrompt, cache, ...sig });
return [{ json: { ctx: input.ctx, requests: pv.requests, n_checks: pv.checks.length, n_unassigned: pv.n_unassigned, cached: pv.cached, cache_keys: pv.cache_keys, n_cached: pv.n_cached } }];
