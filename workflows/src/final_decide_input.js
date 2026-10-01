// WF_Final_IS · Decide Input — แทน "When Called by Main" ของ WF_SUB_Decide (DEC-37)
// ขาเข้าคือผลของ Assemble Model Results (ชุดเดียวกับที่ WF_SUB_GapEngine เคยคืนให้ WF_Main_Intake)
return [{ json: { payload: $input.first().json } }];
