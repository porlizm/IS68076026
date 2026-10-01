// WF_IS_68076026_01OCT26 · Classify Error (DEC-48) — ต่อยอด error_classify.js (บั๊ก B11)
// 1) หา run_id ของงานที่ล้ม: [run_id=...] ในข้อความ → งานล่าสุดที่ Loop Over Requests ปล่อยออก → รหัสงานแรกที่พบในข้อมูล execution
// 3) ไม่รู้ run_id (ล้มที่ trigger) → ไม่เขียน runs · อีเมลไม่เกินชั่วโมงละครั้ง (static data ของ workflow)
// 2) งานที่ยังไม่ได้เริ่มใน execution เดียวกัน (ลูปหยุดเมื่อโหนดล้ม) ต้องไม่หายเงียบ: คืน pending_rows (แถว runs เต็ม stage=failed error_code=batch_aborted)
//    ให้ Record Aborted Requests บันทึก และระบุ run_id ในอีเมลถึงผู้วิจัยเพื่อให้ผู้เข้าร่วมส่งใหม่
const trig = $('Catch Workflow Error').first().json;
let execData = {};
try { execData = $('Get Failed Execution').first().json || {}; } catch (e) { execData = {}; }
// trigger ล้ม (poll อ่านชีตไม่ได้): Error Trigger ส่ง { trigger: { error } } ไม่มี execution (DEC-48: Get Failed Execution จึงต้องไม่เรียก /executions/ แบบรายการ)
const errObj = (trig.execution && trig.execution.error) || (trig.trigger && trig.trigger.error) || {};
const triggerFailed = !trig.execution && !!trig.trigger;
const msg = String(errObj.message || '') + (triggerFailed && errObj.description ? ' — ' + errObj.description : '');
const hay = msg + ' ' + JSON.stringify(execData).slice(0, 2000000);
const RID = /RUN-\d{14}-[0-9a-f]{8}/;
let runData = {};
try { runData = execData.data.resultData.runData || {}; } catch (e) { runData = {}; }
const loopRuns = (runData['Loop Over Requests'] || []).map((r) => { try { return String(r.data.main[1][0].json.run_id || ''); } catch (e) { return ''; } }).filter((x) => RID.test(x));
const loopRunId = loopRuns.length ? loopRuns[loopRuns.length - 1] : '';
const m = msg.match(RID) || (loopRunId ? [loopRunId] : null) || hay.match(RID);
const run_id = m ? m[0] : 'UNKNOWN-' + ((trig.execution && trig.execution.id) || 'noexec');
const code = (triggerFailed ? 'trigger_failed' : '') || (msg.match(/\] ([a-z_]+):/) || [])[1]
  || (/ข้อผิดพลาดของข้อมูลอ้างอิง/.test(msg) ? 'reference_data_error' : (/download|drive/i.test(msg) ? 'file_download_failed' : 'unexpected_error'));
const now = new Date().toISOString();
let accepted = [];
try { accepted = (runData['Validate Form Rows'][0].data.main[0] || []).map((i) => i.json).filter((j) => j.valid === true && j.not_duplicate === true && j.run_row); } catch (e) { accepted = []; }
const started = new Set([...loopRuns, run_id]);
const pending_rows = accepted.filter((j) => !started.has(j.run_id)).map((j) => ({ ...j.run_row, updated_at: now, stage: 'failed', error_code: 'batch_aborted' }));
// ล้มก่อนมีงาน (เช่น trigger อ่านชีตไม่ได้ทุกนาทีเพราะสิทธิ์/บริการขัดข้อง): ไม่เขียนแถว runs ปลอม (Is Run Known?) และแจ้งไม่เกินชั่วโมงละครั้ง
const run_known = RID.test(run_id) && run_id === (run_id.match(RID) || [''])[0];
let notify = true;
if (!run_known) {
  try {
    const sd = $getWorkflowStaticData('global');
    const last = Date.parse(sd.last_unknown_error_alert || '') || 0;
    if (Date.now() - last < 3600 * 1000) notify = false; else sd.last_unknown_error_alert = now;
  } catch (e) { notify = true; }
}
const wf = (trig.workflow && trig.workflow.name) || '';
const node = (trig.execution && trig.execution.lastNodeExecuted) || (triggerFailed ? 'Watch Form Responses' : '');
const pendTxt = pending_rows.length ? `\n\nงานในรอบเดียวกันที่ยังไม่ได้ประมวลผล (${pending_rows.length}) บันทึกเป็น failed/batch_aborted ให้ผู้เข้าร่วมส่งแบบฟอร์มใหม่:\n` + pending_rows.map((r) => `- ${r.run_id} ${r.email} ${r.role_id}`).join('\n') : '';
return [{ json: {
  run_update: { run_id, updated_at: now, stage: 'failed', error_code: code },
  run_known, notify,
  pending_rows,
  audit: { ts: now, actor: 'WF_IS_68076026_01OCT26', run_id, event: 'workflow_error', detail: JSON.stringify({ workflow: wf, node, message: msg.slice(0, 500), execution_id: trig.execution && trig.execution.id, batch_aborted: pending_rows.map((r) => r.run_id) }) },
  alert: { subject: `[IS68076026][ERROR] ${run_id} ${code}${pending_rows.length ? ' (+' + pending_rows.length + ' batch_aborted)' : ''}`, body: `workflow: ${wf}\nnode: ${node}\nerror: ${msg.slice(0, 800)}\nexecution: ${trig.execution && trig.execution.url || ''}${pendTxt}\n\nผู้เข้าร่วมไม่ได้รับข้อความข้อผิดพลาดทางเทคนิค (ตาราง 3.22)` },
} }];
