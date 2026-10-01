// WF_Final_IS · GapEngine Input — แทน "When Called by Main" ของ WF_SUB_GapEngine (DEC-37)
// สัญญาข้อมูลเดิม { payload: gap_input } · Loop Over Runs ส่งงานทีละ 1 รายการ จึงมีผลของ Prepare Text & Mask PII รายการเดียวในรอบนี้
return [{ json: { payload: $('Prepare Text & Mask PII').first().json.gap_input } }];
