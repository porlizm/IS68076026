// ─────────────────────────────────────────────────────────────────────────────
// Build Report · รวมผลเป็น JSON เดียวให้หน้าเว็บแสดงผล (ไม่มีการคำนวณใหม่ในหน้าเว็บ)
// ─────────────────────────────────────────────────────────────────────────────
const v = $('Config & Validate').first().json;
const rd = $('Load Role Data (O*NET 31.0)').first().json;
const prep = $('Clean Text & Mask PII').first().json;
const p = $input.first().json;
const role = rd.role;
const R = p.scores.readiness_pct;
const Cw = p.scores.weighted_coverage;
// ป้ายสำหรับแสดงผลใน Demo เท่านั้น (ไม่ใช่เกณฑ์ของงานวิจัย) · ถ้าสรุปได้ไม่ถึง 60% ของน้ำหนัก ไม่ติดป้ายระดับ
const band = R === null ? { key: 'na', th: 'ประเมินไม่ได้' }
  : (Cw !== null && Cw < 0.6) ? { key: 'na', th: 'หลักฐานยังไม่พอสรุป' }
  : R >= 75 ? { key: 'high', th: 'พร้อมสูง' }
  : R >= 50 ? { key: 'mid', th: 'ใกล้พร้อม' }
  : { key: 'low', th: 'ต้องพัฒนาเพิ่ม' };

const report = {
  ok: true,
  run_id: v.run_id,
  generated_at: new Date().toISOString(),
  elapsed_ms: Date.now() - new Date(v.received_at).getTime(),
  input: { ...v.input, file_name: v.file.name, file_mime: v.file.mime, file_size: v.file.size },
  role: {
    role_id: role.role_id, label_th: role.label_th, name_th: role.name_th, name_en: role.name_en, soc: role.soc,
    onet_title: role.onet_title, mapping_type: role.mapping_type, mapping_note_th: role.mapping_note_th,
    job_zone: role.job_zone, job_zone_name: role.job_zone_name, description: role.description,
    education_modal: role.education_modal, education_pct: role.education_pct, education: role.education,
    tasks: role.tasks, hot_tech: role.hot_tech, job_titles: role.job_titles, counts: role.counts,
  },
  verdict: band,
  ocr: prep.ocr,
  analyst: p.analyst,
  scores: p.scores,
  guard: p.guard,
  verifier: p.verifier,
  tasks: p.tasks,
  tech: p.tech,
  candidate: p.candidate,
  requirements: p.requirements.map(({ desc, ...r }) => ({ ...r, desc })),
  plan: p.plan,
  provenance: {
    onet: rd.data_meta.onet_version, snapshot: rd.data_meta.snapshot_version, corpus: rd.data_meta.corpus_version,
    dataset_sha256: (rd.data_meta.sha256['Data_Set.xlsx'] || '').slice(0, 12),
    policy: rd.data_meta.policy, built_at: rd.data_meta.built_at,
    rules: 'R0 → R2 (ซ่อมรูปคำ) → R3a คำซ้ำ θ = ' + v.cfg.THETA + ' → R3b Gemini ตรวจความหมาย → R1 โหวต ' + p.analyst.runs_usable + ' รอบ → R5/R6 · ' + (v.project_cfg.rules_version || ''),
    note: 'Demo ใช้ Gemini ตัวเดียวหลายรอบ (ระบบเต็มใช้ 3 โมเดลคนละผู้ให้บริการและให้โมเดลอื่นตรวจกัน) · ข้อมูลอ้างอิงเป็นของจริงแบบ hardcode · ไม่บันทึกเรซูเมลงฐานข้อมูล',
  },
};
return [{ json: report }];
