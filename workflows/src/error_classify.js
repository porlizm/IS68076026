// WF_Error · Classify Error — บั๊ก B11: หา run_id จากข้อมูลของ execution ที่ล้มเหลว (หรือข้อความ [run_id=...])
const trig = $('Error Trigger').first().json;
let execData = {};
try { execData = $('Get Failed Execution').first().json || {}; } catch (e) { execData = {}; }
const msg = String((trig.execution && trig.execution.error && trig.execution.error.message) || '');
const hay = msg + ' ' + JSON.stringify(execData).slice(0, 2000000);
// WF_Final_IS (DEC-37): ถ้าไม่มี [run_id=...] ในข้อความ ใช้งานล่าสุดที่ Loop Over Runs ปล่อยออก (execution เดียวอาจมีหลายงาน)
// ใน 5 workflow ไม่มีโหนดนี้ จึงข้ามไปใช้วิธีเดิม
let loopRunId = '';
try { const rd = execData.data.resultData.runData['Loop Over Runs']; loopRunId = String(rd[rd.length - 1].data.main[1][0].json.run_id || ''); } catch (e) { loopRunId = ''; }
const m = msg.match(/RUN-\d{14}-[0-9a-f]{8}/) || (/^RUN-\d{14}-[0-9a-f]{8}$/.test(loopRunId) ? [loopRunId] : null) || hay.match(/RUN-\d{14}-[0-9a-f]{8}/);
const run_id = m ? m[0] : 'UNKNOWN-' + ((trig.execution && trig.execution.id) || 'noexec');
const code = (msg.match(/\] ([a-z_]+):/) || [])[1]
  || (/ข้อผิดพลาดของข้อมูลอ้างอิง/.test(msg) ? 'reference_data_error' : (/download|drive/i.test(msg) ? 'file_download_failed' : 'unexpected_error'));
const now = new Date().toISOString();
const wf = (trig.workflow && trig.workflow.name) || '';
const node = (trig.execution && trig.execution.lastNodeExecuted) || '';
return [{ json: {
  run_update: { run_id, updated_at: now, stage: 'failed', error_code: code },
  audit: { ts: now, actor: 'WF_Error', run_id, event: 'workflow_error', detail: JSON.stringify({ workflow: wf, node, message: msg.slice(0, 500), execution_id: trig.execution && trig.execution.id }) },
  alert: { subject: `[IS68076026][ERROR] ${run_id} ${code}`, body: `workflow: ${wf}\nnode: ${node}\nerror: ${msg.slice(0, 800)}\nexecution: ${trig.execution && trig.execution.url || ''}\n\nผู้เข้าร่วมไม่ได้รับข้อความข้อผิดพลาดทางเทคนิค (ตาราง 3.22)` },
} }];
