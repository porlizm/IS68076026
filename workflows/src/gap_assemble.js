// WF_SUB_GapEngine · Assemble Model Results — คืนผลให้ WF_Main_Intake พร้อม requirements (บั๊ก B2) และคำพ้อง (บั๊ก B4)
const d = $('Build Prompt').first().json;
const model_results = {}; const model_calls = [];
for (const i of $('Wait for All Models').all()) {
  model_results[i.json.model_key] = { status: i.json.result.status, output: i.json.result.output };
  model_calls.push(...i.json.result.calls);
}
return [{ json: { ctx: d.ctx, text: d.text, text_sha256: d.text_sha256, requirements: d.requirements, model_results, model_calls } }];
