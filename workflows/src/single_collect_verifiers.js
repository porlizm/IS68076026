// WF_IS_68076026_01OCT26 · Collect Verifier Results (DEC-51) — รวมคำตอบของผู้ตรวจแยกตามโมเดล ส่งให้ Apply Rules R0-R7
const verifier_results = {}; const verifier_calls = []; const summary = {};
for (const i of $('Wait for All Verifiers').all()) {
  const r = i.json.result;
  if (r.status !== 'skipped') verifier_results[i.json.model_key] = { status: r.status, output: r.output };
  verifier_calls.push(...r.calls.map((c) => Object.assign({ call_purpose: 'verifier' }, c)));
  summary[i.json.model_key] = { n_checks: i.json.n_checks, status: r.status };
}
return [{ json: { verifier_results, verifier_calls, summary } }];
