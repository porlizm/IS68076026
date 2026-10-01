// WF_Main_Intake · Parse & Validate (runOnceForAllItems) — บั๊ก B6: ประมวลผลทุกแถวของ trigger ไม่ใช่เฉพาะแถวแรก
const now = new Date().toISOString();
const runs = $('Read Runs').all().map((i) => i.json);
const seen = new Set();
const out = [];
for (const it of $('Form Row Trigger').all()) {
  const ctx = ENGINE.parseFormRow(it.json, CFG.sheets);
  const v = ENGINE.validateIntake(ctx, CFG.project, CFG.roleIds);
  ctx.response_id = ENGINE.responseId(ctx);
  ctx.created_at = now;
  ctx.run_id = ENGINE.makeRunId(ctx.response_id, now);
  const dup = ENGINE.isDuplicate(ctx.response_id, runs) || seen.has(ctx.response_id);
  seen.add(ctx.response_id);
  // บั๊ก B1: ส่งค่า boolean จริงให้ IF node (ไม่ใช่สตริง "true")
  const valid = v.ok === true;
  const notDuplicate = dup === false;
  const event = !valid ? 'rejected_input' : (dup ? 'skipped_duplicate' : 'accepted');
  out.push({ json: {
    ...ctx, valid, not_duplicate: notDuplicate, reject_reason: v.errors.join('|'),
    run_row: ENGINE.runRowFrom(ctx, { stage: 'running' }),
    audit: { ts: now, actor: 'WF_Main_Intake', run_id: ctx.run_id, event, detail: JSON.stringify({ reasons: v.errors, response_id: ctx.response_id }) },
  } });
}
return out;
