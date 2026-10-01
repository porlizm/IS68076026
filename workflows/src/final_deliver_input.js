// WF_Final_IS · Deliver Input — แทน "When Called by Main" ของ WF_SUB_Deliver (DEC-37)
// ขาเข้าคือผลของ Return Report Payload { ctx, report_payload }
return [{ json: { payload: $input.first().json } }];
