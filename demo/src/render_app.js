// ─────────────────────────────────────────────────────────────────────────────
// Render App HTML · เสิร์ฟหน้าเว็บ (ฟอร์ม + หน้ารายงาน) จาก n8n
//   เปิด: http://localhost:5678/webhook/is-demo            (โหมด Production · ต้อง Publish)
//         http://localhost:5678/webhook/is-demo?test=1     (ส่งฟอร์มไป /webhook-test/ → ดูโหนดวิ่งบน canvas)
//   ต้นฉบับ: demo/src/app.html + app.css + app.js → build_wf_demo.mjs (ห้ามแก้ HTML ในโหนดนี้ด้วยมือ)
// ─────────────────────────────────────────────────────────────────────────────
const HTML = /*@@APP_HTML@@*/'';
const ROLES = /*@@ROLE_CARDS@@*/[];
const q = ($input.first().json && $input.first().json.query) || {};
const boot = {
  roles: ROLES,
  test: Object.prototype.hasOwnProperty.call(q, 'test'),
  paths: { analyze: 'is-demo-analyze', save: 'is-demo-save-pdf', version: 'is-demo-version' },
  build: /*@@BUILD_ID@@*/'',
  version: /*@@STAMP_JSON@@*/{},
};
const json = JSON.stringify(boot).replace(/</g, '\\u003c');
return [{ json: { html: HTML.replace('"__BOOT__"', () => json) } }];
