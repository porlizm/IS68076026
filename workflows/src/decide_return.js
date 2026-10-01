// WF_SUB_Decide · Return Report Payload — ส่งชุดข้อมูลรายงานรุ่นคงที่กลับ WF_Main_Intake
const d = $('Decide & Plan').first().json;
return [{ json: { ctx: d.ctx, report_payload: d.report_payload } }];
