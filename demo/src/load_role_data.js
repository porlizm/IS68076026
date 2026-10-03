// ─────────────────────────────────────────────────────────────────────────────
// Load Role Data (O*NET 31.0) · ข้อมูลจริงที่ hardcode สำหรับ Demo รอบแรก
//   ที่มา: Data_Set.xlsx (O*NET 31.0) · data/requirements.csv (Top-30, สมการ 3.1)
//          data/corpus.csv (verified) · data/mappings.csv + mapping_review.csv (L1 ผ่านตรวจ)
//   สร้างโดย demo/build_demo_data.py — ห้ามแก้ข้อมูลในโหนดนี้ด้วยมือ
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_DATA = /*@@DEMO_DATA@@*/null;

const v = $('Config & Validate').first().json;
const role = DEMO_DATA.roles[v.input.role_id];
if (!role) throw new Error('ไม่พบข้อมูลอาชีพ ' + v.input.role_id);
return [{ json: { data_meta: DEMO_DATA.meta, role, skill_links: DEMO_DATA.skill_links || [] } }];
