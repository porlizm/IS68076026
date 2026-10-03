// WF_SUB_GapEngine · To model_calls Rows — หนึ่งแถวต่อหนึ่งครั้งที่เรียก รวมครั้งที่ล้มเหลว
const rows = [];
for (const i of $('Wait for All Models').all()) rows.push(...i.json.result.calls.map((c) => Object.assign({ call_purpose: 'analyst' }, c)));
return rows.map((r) => ({ json: r }));
