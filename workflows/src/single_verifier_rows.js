// WF_IS_68076026_01OCT26 · Build Verifier Call Rows (DEC-51) — แถว model_calls ของการตรวจความเกี่ยวข้อง (call_purpose = verifier) · ว่างได้เมื่อไม่มีข้อให้ตรวจ
const rows = [];
for (const i of $('Wait for All Verifiers').all()) rows.push(...i.json.result.calls);
return rows.map((r) => ({ json: Object.assign({ call_purpose: 'verifier' }, r) }));
