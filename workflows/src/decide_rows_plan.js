// ถ้าแผนว่าง คืน [] และสาขานี้จบ (สาขาหลักยังเดินต่อ เพราะวางไว้คนละสาขา)
return $('Decide & Plan').first().json.plan_rows.map((r) => ({ json: r }));
