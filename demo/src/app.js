/* Skill-Gap Navigator · client (vanilla JS, ไม่มี build step)
 * หน้าเว็บถูกเสิร์ฟจาก n8n (Webhook → Respond to Webhook) ภายใต้ CSP sandbox ของ n8n:
 *   - origin เป็น opaque (null) → localStorage อาจใช้ไม่ได้ (ห่อ try/catch ทุกจุด)
 *   - fetch ไป /webhook/... ได้ เพราะ n8n ตอบ Access-Control-Allow-Origin ตาม Origin (null)
 */
(function () {
  'use strict';
  var BOOT = window.__BOOT__ || {};
  var ROLES = BOOT.roles || [];
  var qs = new URLSearchParams(location.search);
  var TEST = qs.has('test') || BOOT.test === true;
  var PREFIX = TEST ? '/webhook-test/' : '/webhook/';
  var EP_ANALYZE = PREFIX + (BOOT.paths && BOOT.paths.analyze || 'is-demo-analyze');
  var EP_SAVE = '/webhook/' + (BOOT.paths && BOOT.paths.save || 'is-demo-save-pdf');
  var PDF_LIBS = {
    htmlToImage: ['https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.13/html-to-image.min.js', 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.js'],
    jspdf: ['https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.2.1/jspdf.umd.min.js', 'https://cdn.jsdelivr.net/npm/jspdf@4.2.1/dist/jspdf.umd.min.js']
  };
  var WPM = 4.33;
  var state = { role: null, months: 12, hours: 10, mode: 'both', file: null, consent: false };
  var REPORT = null;
  var Q = function (s, r) { return (r || document).querySelector(s); };
  var QA = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmt(n, d) { if (n == null || isNaN(n)) return '—'; return Number(n).toLocaleString('th-TH', { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d || 0 }); }
  function pct(x, d) { return x == null ? '—' : fmt(x * 100, d == null ? 0 : d) + '%'; }
  function bytes(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }

  /* ---------------- icons ---------------- */
  var I = {
    cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    network: '<rect x="9" y="2.5" width="6" height="5" rx="1.2"/><rect x="2.5" y="16.5" width="6" height="5" rx="1.2"/><rect x="15.5" y="16.5" width="6" height="5" rx="1.2"/><path d="M12 7.5V12M5.5 16.5V12h13v4.5"/>',
    kanban: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 7v7M12 7v4M16 7v9"/>',
    building: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 9h3a1 1 0 0 1 1 1v11M2 21h20M8 7h4M8 11h4M8 15h4"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    half: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
    minus: '<circle cx="12" cy="12" r="8"/><path d="M8.5 12h7"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6.5a3.5 3.5 0 0 0 0-7h-5a3.5 3.5 0 0 1 0-7H16"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    layers: '<path d="M12 3 2 8l10 5 10-5z"/><path d="M2 13l10 5 10-5"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    spark: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/>',
    loader: '<path d="M12 3a9 9 0 1 0 9 9"/>',
    upload: '<path d="M12 15V4"/><path d="M7 9l5-5 5 5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cloud: '<path d="M7 18a5 5 0 0 1-.6-10A6 6 0 0 1 18 8.5a4.5 4.5 0 0 1-.5 9"/><path d="M12 12v8"/><path d="M9 15l3-3 3 3"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>'
  };
  function ic(n, s, w) { return '<svg width="' + (s || 16) + '" height="' + (s || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[n] || '') + '</svg>'; }
  var ROLE_ICON = { brain: 'cpu', network: 'network', kanban: 'kanban', building: 'building' };
  var STATUS = {
    evidenced: { th: 'มีหลักฐาน', icon: 'check' }, partially: { th: 'บางส่วน', icon: 'half' },
    missing: { th: 'ช่องว่าง', icon: 'minus' }, abstained: { th: 'ยังยืนยันไม่ได้', icon: 'info' }
  };
  var DOMAIN_TH = { 'Essential Skills': 'ทักษะพื้นฐาน', 'Transferable Skills': 'ทักษะถ่ายโอนได้', 'Knowledge': 'องค์ความรู้', 'Work Activities': 'กิจกรรมการทำงาน' };
  var PHASE_COLOR = { foundation: 'var(--series-1)', core_gap_closure: 'var(--series-2)', advanced_or_cert_prep: 'var(--series-3)' };
  function stPill(s) { var m = STATUS[s] || STATUS.abstained; return '<span class="st ' + s + '">' + ic(m.icon, 13, 2.4) + m.th + '</span>'; }

  /* ---------------- theme ---------------- */
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('sgn-theme', t); } catch (e) {}
  }
  Q('#themeBtn').addEventListener('click', function () {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
  if (TEST) { Q('#envChip').classList.add('test'); Q('#envTxt').textContent = 'n8n · Test URL'; }

  /* ---------------- toast & tooltip ---------------- */
  function toast(msg, kind, ms) {
    var el = document.createElement('div');
    el.className = 'toast glass ' + (kind || 'info');
    el.innerHTML = ic(kind === 'ok' ? 'check' : kind === 'err' ? 'alert' : 'info', 18) + '<div>' + msg + '</div>';
    Q('#toasts').appendChild(el);
    setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 400); }, ms || 5200);
    return el;
  }
  var tipBox = Q('#tipBox');
  document.addEventListener('mousemove', function (e) {
    var t = e.target.closest && e.target.closest('[data-tip]');
    if (t) {
      tipBox.innerHTML = t.getAttribute('data-tip'); tipBox.classList.add('on');
      var x = Math.min(e.clientX + 14, innerWidth - tipBox.offsetWidth - 10), y = e.clientY + 16;
      if (y + tipBox.offsetHeight > innerHeight - 8) y = e.clientY - tipBox.offsetHeight - 12;
      tipBox.style.left = x + 'px'; tipBox.style.top = y + 'px';
    } else tipBox.classList.remove('on');
    var s = e.target.closest && e.target.closest('.spot');
    if (s) { var r = s.getBoundingClientRect(); s.style.setProperty('--mx', (e.clientX - r.left) + 'px'); s.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
  }, { passive: true });

  /* ---------------- reveal on scroll ---------------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.08 }) : null;
  function observe(root) { QA('.reveal', root).forEach(function (el, i) { el.style.transitionDelay = Math.min(i * 40, 240) + 'ms'; if (io && !reduce) io.observe(el); else el.classList.add('in'); }); }
  observe(document);

  /* ---------------- FORM ---------------- */
  var nItems = ROLES.reduce(function (s, r) { return s + (r.n_items || 0); }, 0);
  QA('.hero-meta .chip')[2].textContent = 'คลังคอร์ส/ใบรับรอง verified ' + nItems + ' รายการ';
  Q('#roles').innerHTML = ROLES.map(function (r) {
    return '<button type="button" class="role spot" role="radio" aria-checked="false" data-id="' + esc(r.role_id) + '">' +
      '<span class="check">' + ic('check', 13, 3) + '</span>' +
      '<div class="role-ico">' + ic(ROLE_ICON[r.icon] || 'target', 20) + '</div>' +
      '<h4>' + esc(r.label_th) + '</h4><div class="en">' + esc(r.name_en) + '</div>' +
      '<div class="meta"><span class="tag mono">SOC ' + esc(r.soc) + '</span><span class="tag">Job Zone ' + r.job_zone + '</span>' +
      (r.mapping_type === 'proxy' ? '<span class="tag warn" data-tip="' + esc(r.mapping_note_th) + '">proxy</span>' : '') +
      '<span class="tag">' + r.n_items + ' คอร์ส/ใบรับรอง</span></div></button>';
  }).join('');
  QA('.role').forEach(function (b) {
    b.addEventListener('click', function () {
      QA('.role').forEach(function (x) { x.classList.remove('sel'); x.setAttribute('aria-checked', 'false'); });
      b.classList.add('sel'); b.setAttribute('aria-checked', 'true'); state.role = b.getAttribute('data-id'); sync();
    });
  });

  function seg(id, key, cast) {
    var root = Q(id), pill = Q('.pill', root), btns = QA('button', root);
    function paint() {
      btns.forEach(function (b, i) {
        var on = String(state[key]) === b.getAttribute('data-v'); b.setAttribute('aria-pressed', on);
        if (on) { pill.style.width = b.offsetWidth + 'px'; pill.style.transform = 'translateX(' + (b.offsetLeft - 4) + 'px)'; }
      });
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { state[key] = cast(b.getAttribute('data-v')); paint(); sync(); }); });
    window.addEventListener('resize', paint); setTimeout(paint, 30); return paint;
  }
  var paintMonths = seg('#segMonths', 'months', Number);
  var paintMode = seg('#segMode', 'mode', String);

  var hrs = Q('#hrs'), hrsNum = Q('#hrsNum');
  function setHours(v, from) {
    v = Math.max(1, Math.min(60, Math.round(Number(v) || 1))); state.hours = v;
    if (from !== 'range') hrs.value = Math.min(v, 40);
    if (from !== 'num') hrsNum.value = v;
    hrs.style.setProperty('--p', ((Math.min(v, 40) - 1) / 39 * 100) + '%'); sync();
  }
  hrs.addEventListener('input', function () { setHours(hrs.value, 'range'); });
  hrsNum.addEventListener('input', function () { setHours(hrsNum.value, 'num'); });
  QA('#presets button').forEach(function (b) { b.addEventListener('click', function () { setHours(b.getAttribute('data-v')); }); });

  var capShown = 0;
  function animateNum(el, to, ms, d) {
    if (reduce) { el.textContent = fmt(to, d); return; }
    var from = Number(el.getAttribute('data-v') || 0), t0 = performance.now(); el.setAttribute('data-v', to);
    (function step(t) {
      var k = Math.min(1, (t - t0) / (ms || 900)), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(from + (to - from) * e, d);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  var file = Q('#file'), drop = Q('#drop');
  function setFile(f) {
    if (!f) { state.file = null; Q('#fileChip').classList.remove('on'); drop.style.display = ''; file.value = ''; sync(); return; }
    var okType = /^(application\/pdf|image\/(png|jpeg))$/.test(f.type) || /\.(pdf|png|jpe?g)$/i.test(f.name);
    if (!okType) { toast('รองรับเฉพาะไฟล์ PDF, PNG หรือ JPG', 'err'); return; }
    if (f.size > 10485760) { toast('ไฟล์ใหญ่เกิน 10 MB', 'err'); return; }
    state.file = f;
    var isPdf = /pdf/.test(f.type) || /\.pdf$/i.test(f.name);
    Q('#fileIco').textContent = isPdf ? 'PDF' : 'IMG'; Q('#fileIco').className = 'fi' + (isPdf ? '' : ' img');
    Q('#fileName').textContent = f.name; Q('#fileMeta').textContent = bytes(f.size) + (isPdf ? ' · PDF' : ' · รูปภาพ (จะใช้ OCR)');
    Q('#fileChip').classList.add('on'); drop.style.display = 'none'; sync();
  }
  file.addEventListener('change', function () { setFile(file.files[0]); });
  Q('#fileClear').addEventListener('click', function () { setFile(null); });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); });
  Q('#consent').addEventListener('change', function (e) { state.consent = e.target.checked; sync(); });

  function sync() {
    var H = Math.round(state.months * WPM * state.hours * 100) / 100;
    if (H !== capShown) { animateNum(Q('#capH'), H, 600, 0); capShown = H; }
    Q('#capEq').textContent = 'Hmax = ' + state.months + ' × 4.33 × ' + state.hours + ' = ' + fmt(H, 2);
    Q('#st1').classList.toggle('done', !!state.role);
    Q('#st2').classList.add('done');
    Q('#st3').classList.toggle('done', !!state.file && state.consent);
    var r = ROLES.filter(function (x) { return x.role_id === state.role; })[0];
    var ready = !!(state.role && state.file && state.consent);
    Q('#submitBtn').disabled = !ready;
    Q('#formSum').innerHTML = !r ? 'เลือกอาชีพเป้าหมายเพื่อเริ่มต้น'
      : '<b>' + esc(r.label_th) + '</b> · ' + state.months + ' เดือน · ' + state.hours + ' ชม./สัปดาห์' + (state.file ? '' : ' · <span>ยังไม่ได้อัปโหลดเรซูเม</span>') + (state.file && !state.consent ? ' · <span>ยังไม่ได้ยินยอม</span>' : '');
  }
  setHours(10); sync();

  /* ---------------- PROCESSING ---------------- */
  var STEPS = [
    { k: 'up', t: 'อัปโหลดไปยัง n8n', s: 'Webhook รับไฟล์ + ตรวจชนิด/ขนาด', d: 1.2, i: 'upload' },
    { k: 'ocr', t: 'อ่านข้อความ (OCR)', s: 'text layer หรือ Gemini OCR', d: 3, i: 'file' },
    { k: 'pii', t: 'ปิดบังข้อมูลส่วนบุคคล', s: 'EMAIL · PHONE · URL · ID', d: 1, i: 'lock' },
    { k: 'ai', t: 'Gemini วิเคราะห์หลักฐาน', s: '30 ข้อกำหนด + 8 งานหลักของอาชีพ · หลายรอบแล้วโหวต', d: 40, i: 'spark' },
    { k: 'guard', t: 'ตรวจ R2 · R3 คำ + ความหมาย', s: 'ข้อความที่คำไม่ตรงส่งให้ Gemini อีกรอบตรวจความหมาย', d: 12, i: 'shield' },
    { k: 'plan', t: 'จัดแผนการเรียนรู้', s: 'Greedy d_k ภายใน Hmax', d: 1.2, i: 'route' }
  ];
  var TIPS = [
    'R2 ตรวจว่า “ข้อความอ้างอิง” ที่ AI คัดมา มีอยู่ในเรซูเมจริงทุกตัวอักษร ถ้าไม่พบ ระบบจะไม่นับเป็นหลักฐาน',
    'R3 ตรวจสองชั้น: คำตรงกับ O*NET (θ = 0.15) ก่อน ถ้าคำไม่ตรง (เช่นเขียนแบบเน้นผลงาน) ให้ Gemini อีกรอบตรวจความหมาย',
    'ใบรับรองที่พบในเรซูเมนับเป็นหลักฐาน "บางส่วน" ของข้อกำหนดที่ใบรับรองนั้นครอบคลุม (R5)',
    'น้ำหนักของแต่ละข้อกำหนดมาจากค่าความสำคัญ (IM) ของ O*NET ตามสมการ 3.1',
    'คอร์สและใบรับรองทุกรายการมาจากคลังที่ผู้วิจัยตรวจ URL แล้ว AI ไม่สามารถแต่งลิงก์ขึ้นเองได้',
    'ระบบเต็มของงานวิจัยใช้ 3 โมเดลคนละผู้ให้บริการโหวตกัน (R1) และให้โมเดลอื่นตรวจกัน Demo ใช้ Gemini ตัวเดียวหลายรอบ'
  ];
  var procTimer = null, tipTimer = null, t0 = 0;
  function startProc() {
    var isImg = state.file && !/pdf/.test(state.file.type) && !/\.pdf$/i.test(state.file.name);
    STEPS[1].d = isImg ? 14 : 3;
    Q('#steps').innerHTML = '<span class="beam" id="beam"></span>' + STEPS.map(function (s, i) {
      return '<li data-i="' + i + '"><span class="si">' + ic(s.i, 16) + '</span><div><b>' + s.t + '</b><small>' + s.s + '</small></div><span class="t num"></span></li>';
    }).join('');
    t0 = performance.now(); var cur = -1, acc = 0, bounds = [];
    STEPS.forEach(function (s) { bounds.push(acc += s.d); });
    var ti = 0; Q('#tip').textContent = TIPS[0];
    tipTimer = setInterval(function () { var t = Q('#tip'); t.style.opacity = 0; setTimeout(function () { ti = (ti + 1) % TIPS.length; t.textContent = TIPS[ti]; t.style.opacity = 1; }, 400); }, 5200);
    procTimer = setInterval(function () {
      var el = (performance.now() - t0) / 1000; Q('#elapsed').textContent = el.toFixed(1);
      var idx = 0; while (idx < STEPS.length - 1 && el > bounds[idx]) idx++;
      idx = Math.min(idx, 3); // ค้างที่ขั้น AI จนกว่า n8n จะตอบกลับ
      if (idx !== cur) { cur = idx; markSteps(idx, false); }
    }, 100);
  }
  function markSteps(active, all) {
    var lis = QA('#steps li');
    lis.forEach(function (li, i) {
      li.classList.toggle('ok', all || i < active); li.classList.toggle('act', !all && i === active);
      Q('.si', li).innerHTML = ic((all || i < active) ? 'check' : (i === active ? 'loader' : STEPS[i].i), 16, (all || i < active) ? 3 : 2);
    });
    var target = all ? lis[lis.length - 1] : lis[active];
    if (target) Q('#beam').style.height = (target.offsetTop + 18 - 18) + 'px';
  }
  function stopProc() { clearInterval(procTimer); clearInterval(tipTimer); }
  function show(id) { QA('.view').forEach(function (v) { v.classList.toggle('on', v.id === id); }); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }

  Q('#mainForm').addEventListener('submit', function (e) {
    e.preventDefault(); if (Q('#submitBtn').disabled) return;
    analyze('');
  });
  // DEC-58 Open Learner Model: ส่งเรซูเมเดิม + หลักฐานที่ผู้เรียนพิมพ์เพิ่ม แล้วให้ระบบตรวจด้วยกฎเดียวกัน
  function analyze(supplement) {
    var fd = new FormData();
    fd.append('role_id', state.role); fd.append('months', state.months); fd.append('hours_per_week', state.hours);
    fd.append('mode', state.mode); fd.append('client_build', BOOT.build || ''); fd.append('consent', state.consent ? 'true' : 'false');
    if (supplement) fd.append('supplement', supplement);
    fd.append('resume', state.file, state.file.name);
    show('vProc'); startProc();
    Q('#procRun').textContent = 'POST ' + EP_ANALYZE;
    var ctl = new AbortController(); var to = setTimeout(function () { ctl.abort(); }, 300000);
    fetch(EP_ANALYZE, { method: 'POST', body: fd, signal: ctl.signal })
      .then(function (res) {
        return res.text().then(function (txt) {
          var j = null; try { j = JSON.parse(txt); } catch (err) {}
          if (!res.ok || !j || j.ok === false) {
            var msg = j && j.errors && j.errors.length ? j.errors.join('<br>') :
              res.status === 404 ? (TEST ? 'ยังไม่ได้กด “Execute workflow” ใน n8n (โหมดทดสอบรับได้ครั้งเดียวต่อการกด)' : 'ไม่พบ webhook — ต้อง Publish workflow ใน n8n ก่อน') :
              (j && j.message) ? esc(j.message) : 'n8n ตอบกลับผิดพลาด (HTTP ' + res.status + ')';
            throw new Error(msg);
          }
          return j;
        });
      })
      .then(function (j) {
        clearTimeout(to); markSteps(STEPS.length, true); stopProc();
        setTimeout(function () { REPORT = j; renderReport(j); show('vReport'); Q('#dock').classList.add('on'); }, reduce ? 0 : 650);
      })
      .catch(function (err) {
        clearTimeout(to); stopProc(); show('vForm');
        toast('<b>วิเคราะห์ไม่สำเร็จ</b><br>' + (err.name === 'AbortError' ? 'หมดเวลารอ (5 นาที)' : (err.message || 'เชื่อมต่อ n8n ไม่ได้')), 'err', 9000);
      });
  }

  /* ---------------- REPORT ---------------- */
  function ring(v, size, stroke, id) {
    var r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(100, v || 0)) / 100);
    return '<svg viewBox="0 0 ' + size + ' ' + size + '"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset=".5" stop-color="#8b5cf6"/><stop offset="1" stop-color="#0ea5b7"/></linearGradient></defs>' +
      '<circle class="trk" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="#8a93a8" stroke-opacity=".2" stroke-width="' + stroke + '"/>' +
      '<circle class="val" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="url(#' + id + ')" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + c.toFixed(2) + '" data-off="' + off.toFixed(2) + '"/></svg>';
  }

  function renderReport(r) {
    var S = r.scores, G = r.guard, P = r.plan, C = r.candidate, RO = r.role, A = r.analyst;
    var gaps = S.n_missing + S.n_partially;
    var dt = new Date(r.generated_at);
    var isOffline = A.source !== 'gemini';
    var h = '';
    h += '<div class="pdf-only pdf-head"><b>รายงานความพร้อมสู่อาชีพเป้าหมาย · Skill-Gap Navigator</b><span>' + esc(r.run_id) + ' · ' + dt.toLocaleString('th-TH') + '</span></div>';
    h += '<div class="rep-top no-pdf"><h2>ผลการวิเคราะห์ · <span class="mono">' + esc(r.run_id) + '</span></h2><span class="chip">' + ic('clock', 13) + ' ' + fmt(r.elapsed_ms / 1000, 1) + ' วินาที</span></div>';


    // DEC-59 · ตรวจรุ่น workflow ที่ตอบกลับ เทียบกับหน้าเว็บที่โหลดมา
    var VR = r.version || {}; var vIssues = (r.ver_issues || []).slice();
    if (VR.client_match === false) vIssues.push('หน้าเว็บ (build ' + esc(VR.client_build) + ') ไม่ตรงกับ workflow ที่ตอบ (build ' + esc(VR.build_id) + ') — กด Refresh แล้ววิเคราะห์ใหม่');
    if (vIssues.length) h += '<div class="note reveal" style="margin-bottom:14px;border-color:#e0a030">' + ic('alert', 18) + '<div><b>รุ่นของ workflow ไม่สอดคล้องกัน:</b> ' + vIssues.map(esc).join(' · ') + '<br>อาจมี session/โหนดเก่าค้างอยู่ — Unpublish → Import WF_Demo.json ใหม่ → Publish แล้วลองอีกครั้ง</div></div>';
    else if (VR.build_id) h += '<div class="src-note" style="margin-bottom:10px">' + ic('check', 13) + ' workflow v' + esc(VR.wf_version) + ' · ' + esc(VR.build_id) + ' · engine ' + esc(VR.engine_version) + (VR.commit ? ' · ' + esc(VR.commit) : '') + ' — รุ่นตรงกับหน้าเว็บ</div>';
    if (isOffline) h += '<div class="note reveal" style="margin-bottom:14px">' + ic('alert', 18) + '<div><b>โหมดสำรอง:</b> ใช้กฎจับคู่คำพ้อง (ไม่ใช้ LLM) เพราะ ' + esc(A.fallback_reason || '-') + '</div></div>';

    // hero
    h += '<div class="hero-card glass reveal spot">' +
      '<div class="ring" id="ringMain">' + ring(S.role_fit, 168, 14, 'gR') + '<div class="lbl"><div><b class="num" data-count="' + (S.role_fit || 0) + '">0</b><span>Role-Fit / 100</span></div></div></div>' +
      '<div class="hc-main"><div class="kicker"><span class="tag mono">' + esc(RO.role_id) + ' · SOC ' + esc(RO.soc) + '</span><span class="tag">Job Zone ' + RO.job_zone + '</span>' +
      (RO.mapping_type === 'proxy' ? '<span class="tag warn" data-tip="' + esc(RO.mapping_note_th) + '">' + ic('alert', 12) + ' proxy · ' + esc(RO.onet_title) + '</span>' : '') + '</div>' +
      '<h1>' + esc(RO.name_en) + '</h1><div class="th">' + esc(RO.name_th) + '</div>' +
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px"><span class="verdict ' + r.verdict.key + '">' + ic(r.verdict.key === 'high' ? 'check' : r.verdict.key === 'mid' ? 'half' : 'alert', 14, 2.4) + r.verdict.th + '</span>' +
      '<span class="src-note">' + ic('file', 13) + esc(r.input.file_name) + ' · ' + (r.ocr.method === 'gemini_ocr' ? 'Gemini OCR' : 'PDF text layer') + '</span></div>' +
      (C.headline_th ? '<p class="headline">' + esc(C.headline_th) + '</p>' : '') + '</div>' +
      '<div class="proj" data-tip="ดัชนีงานหลักของอาชีพ (T) วัดหลักฐานของงาน Core 8 งานที่ O*NET ระบุสำหรับอาชีพนี้โดยเฉพาะ อ่านแยกจากคะแนนความพร้อม"><small style="margin:0 0 4px">งานหลัก (T) · ความตรงอาชีพ (R-role) ' + fmt(S.r_role, 0) + ' · ความพร้อมรวม (R) ' + fmt(S.readiness_pct, 0) + '</small><div class="from-to"><span class="b num">' + fmt(S.role_task_index, 0) + '</span></div><small>สรุปได้ ' + (S.n_role_tasks_decided || 0) + '/' + (S.n_role_tasks || 0) + ' งาน<br>สรุปข้อกำหนดได้ ' + pct(S.weighted_coverage) + ' ของน้ำหนัก</small></div>' +
      '</div>';

    // KPIs
    var segW = function (n) { return (n / 30 * 100).toFixed(2) + '%'; };
    h += '<div class="kpis">' +
      kpi('target', 'ข้อกำหนดที่มีหลักฐาน', '<span class="num" data-count="' + S.n_evidenced + '">0</span><small> / 30</small>', 'บางส่วน ' + S.n_partially + ' · ช่องว่าง ' + S.n_missing + (S.n_abstained ? ' · ยังยืนยันไม่ได้ ' + S.n_abstained : ''),
        '<div class="mini-bar" data-tip="มีหลักฐาน ' + S.n_evidenced + ' · บางส่วน ' + S.n_partially + ' · ช่องว่าง ' + S.n_missing + ' · ยังยืนยันไม่ได้ ' + S.n_abstained + '"><i style="width:' + segW(S.n_evidenced) + ';background:var(--good)"></i><i style="width:' + segW(S.n_partially) + ';background:var(--warn)"></i><i style="width:' + segW(S.n_missing) + ';background:var(--bad)"></i><i style="width:' + segW(S.n_abstained) + ';background:var(--ink-3);opacity:.35"></i></div>') +
      kpi('layers', 'ช่องว่างที่ต้องปิด', '<span class="num" data-count="' + gaps + '">0</span><small> ข้อ</small>', 'แผนครอบคลุม ' + P.n_covered + ' ข้อ (' + pct(P.gap_coverage) + ')', '') +
      kpi('shield', 'หลักฐานผ่านการตรวจ', '<span class="num" data-count="' + G.n_passed + '">0</span><small> / ' + G.n_claims + '</small>', 'ตัดทิ้ง ' + G.n_rejected + ' · ยังยืนยันไม่ได้ ' + G.n_unverified + ' · U = ' + (G.U == null ? '—' : fmt(G.U * 100, 1) + '%'), '') +
      kpi('route', 'ชั่วโมงในแผน', '<span class="num" data-count="' + P.total_hours + '">0</span><small> / ' + fmt(P.Hmax, 0) + '</small>', P.items.length + ' รายการ · ใช้ ' + pct(P.utilization) + ' ของเวลา', '') +
      '</div>';

    // candidate + domains
    var certs = (C.certifications || []).map(function (c) {
      return '<span class="cert ' + (c.verified ? 'ok' : 'no') + '" data-tip="' + (c.verified ? 'พบชื่อนี้ในเรซูเมตรงตัวอักษร (R2)' : 'ไม่พบตรงตัวอักษรในเรซูเม จึงไม่แสดงเป็นข้อเท็จจริง') + '">' + ic(c.verified ? 'award' : 'x', 13) + esc(c.name) + '</span>';
    }).join('');
    h += '<div class="grid2">' +
      '<div class="card glass reveal spot"><div class="sec-h"><h3><span class="hi">' + ic('user') + '</span>สรุปผู้สมัคร</h3><span class="src-note">' + ic('spark', 12) + (C.summary_source === 'gemini' ? 'สรุปโดย Gemini · ไม่ใช้คำนวณคะแนน' : 'สรุปจากกฎ') + '</span></div>' +
      '<p class="summary-text">' + esc(C.summary_th) + '</p>' +
      '<div class="facts"><div class="fact"><small>ตำแหน่งปัจจุบัน</small><b>' + esc(C.current_role || '—') + '</b></div><div class="fact"><small>ประสบการณ์</small><b>' + (C.years_experience == null ? '—' : fmt(C.years_experience, 0) + ' ปี') + '</b></div><div class="fact"><small>PII ที่ถูกปิดบัง</small><b>' + C.pii_masked_count + ' จุด</b></div></div>' +
      '<div class="label" style="margin-bottom:8px">คุณวุฒิ/ใบรับรองที่พบ</div><div class="cert-list">' + (certs || '<span class="src-note">ไม่พบ</span>') + '</div></div>' +
      '<div class="card glass reveal spot"><div class="sec-h"><h3><span class="hi">' + ic('layers') + '</span>ความพร้อมรายโดเมน</h3><p>ถ่วงน้ำหนัก IM</p></div>' +
      S.by_domain.map(function (d) {
        return '<div class="dbar" data-tip="' + esc(d.domain) + '<br>มีหลักฐาน ' + d.n_evidenced + ' · บางส่วน ' + d.n_partially + ' · ช่องว่าง ' + d.n_missing + '<br>น้ำหนักรวม ' + pct(d.weight_share, 1) + '"><div class="dn">' + esc(DOMAIN_TH[d.domain] || d.domain) + '<small>' + esc(d.domain) + ' · ' + d.n + ' ข้อ</small></div><div class="tr"><i data-w="' + (d.readiness_pct || 0) + '%"></i></div><div class="dv">' + fmt(d.readiness_pct, 0) + '%</div></div>';
      }).join('') +
      '<div class="legend"><span>คะแนน: มีหลักฐาน = 1 · บางส่วน = 0.5 · ช่องว่าง = 0 (สมการ 3.4)</span></div></div>' +
      '</div>';

    // requirements
    var cnt = function (s) { return r.requirements.filter(function (x) { return x.status === s; }).length; };
    h += '<div class="card glass section reveal"><div class="sec-h"><h3><span class="hi">' + ic('target') + '</span>ผลรายข้อกำหนด O*NET (30 ข้อ)</h3>' +
      '<div class="filters no-pdf" id="reqFilters">' +
      '<button class="fbtn" data-f="all" aria-pressed="true">ทั้งหมด <span class="c">30</span></button>' +
      '<button class="fbtn" data-f="evidenced" aria-pressed="false">มีหลักฐาน <span class="c">' + cnt('evidenced') + '</span></button>' +
      '<button class="fbtn" data-f="partially" aria-pressed="false">บางส่วน <span class="c">' + cnt('partially') + '</span></button>' +
      '<button class="fbtn" data-f="missing" aria-pressed="false">ช่องว่าง <span class="c">' + cnt('missing') + '</span></button>' +
      (cnt('abstained') ? '<button class="fbtn" data-f="abstained" aria-pressed="false">ยังยืนยันไม่ได้ <span class="c">' + cnt('abstained') + '</span></button>' : '') + '</div></div>' +
      '<div class="reqs" id="reqList">' + r.requirements.slice().sort(function (a, b) { return a.rank - b.rank; }).map(function (q, i) { return reqRow(q, i + 1); }).join('') + '</div></div>';

    // guard
    var V = r.verifier || {};
    h += '<div class="card glass section reveal"><div class="sec-h"><h3><span class="hi">' + ic('shield') + '</span>ตัวกรอง Hallucination (R0 · R2 · R3 คำ + ความหมาย · R1)</h3><p>' + (isOffline ? 'กฎสำรอง' : esc(A.model) + ' × ' + A.runs_usable + ' รอบ') + ' · prompt ' + esc(A.prompt_version) + '</p></div>' +
      '<div class="guard-flow">' +
      '<div class="gnode"><b class="num">' + G.n_claims + '</b><small>คำกล่าวอ้างว่ามีหลักฐาน<br>(ทุกรอบรวมกัน)</small></div><div class="garrow">' + ic('arrow') + '</div>' +
      '<div class="gnode bad"><b class="num">' + G.n_rejected_r2 + '</b><small>R2 ตัดทิ้ง<br>quote ไม่มีในเรซูเม</small></div><div class="garrow">' + ic('arrow') + '</div>' +
      '<div class="gnode bad"><b class="num">' + G.n_rejected_r3 + '</b><small>R3 ตัดทิ้ง<br>ตรวจแล้วไม่เกี่ยว</small></div><div class="garrow">' + ic('arrow') + '</div>' +
      '<div class="gnode good"><b class="num">' + G.n_passed + '</b><small>ผ่านการตรวจ<br>(ด้วยความหมาย ' + G.n_semantic_pass + ')</small></div></div>' +
      '<div class="note info">' + ic('info', 18) + '<div>' + (V.called ? 'ข้อความที่ผ่าน R2 แต่คำไม่ตรงกับ O*NET ' + V.n_checks + ' ชิ้น ส่งให้ ' + esc(V.model) + ' ตรวจความหมายอีกรอบ' + (V.error ? ' — <b>ผู้ตรวจไม่ตอบ (' + esc(V.error) + ') ข้อเหล่านั้นจึง “ยังยืนยันไม่ได้”</b>' : '') + ' · Demo ใช้โมเดลเดียวจึงเป็นการตรวจตัวเอง ระบบเต็มให้โมเดลคนละผู้ให้บริการตรวจกัน' : 'รอบนี้ไม่มีข้อความที่ต้องตรวจความหมาย') +
      (G.n_repaired ? ' · ซ่อมรูปคำ (R2) ' + G.n_repaired + ' ชิ้น' : '') +
      (S.ablation && S.ablation.r3_lexical_only != null ? '<br>ถ้าใช้ R3 แบบคำซ้ำอย่างเดียว (รุ่นเดิม) คะแนนจะเป็น <b>' + fmt(S.ablation.r3_lexical_only, 0) + '</b> แทน ' + fmt(S.readiness_pct, 0) : '') + '</div></div>' +
      (G.rejected.length ? '<div class="label">คำกล่าวอ้างที่ถูกตัดทิ้ง</div>' + G.rejected.map(function (x) {
        return '<div class="rej-item"><div class="rh"><b>' + esc(x.name) + '</b><span class="st missing">' + ic('x', 12, 2.6) + x.rule + ' · ' + esc(x.reason) + '</span></div><div class="quote rej">' + esc(x.quote || '(ว่าง)') + '</div><small class="src-note">รอบ ' + esc(x.run || '') + ' โมเดลบอกว่า “' + (STATUS[x.claimed] || {}).th + '” → เสียงนี้นับเป็น “ช่องว่าง”</small></div>';
      }).join('') : '<div class="empty">' + ic('check', 16) + ' ไม่มีคำกล่าวอ้างถูกตัดทิ้งในรอบนี้ — ทุกข้อความอ้างอิงพบในเรซูเมตรงตัวอักษรและเกี่ยวข้องกับข้อกำหนด</div>') +
      '</div>';

    // role tasks (T · DEC-55)
    var TK = r.tasks || [];
    if (TK.length) h += '<div class="card glass section reveal"><div class="sec-h"><h3><span class="hi">' + ic('briefcase') + '</span>งานหลักของอาชีพ (O*NET Core Tasks)</h3><p>ดัชนี T = ' + fmt(S.role_task_index, 0) + ' · อ่านแยกจากคะแนนความพร้อม</p></div><div class="reqs">' +
      TK.map(function (t, i) { return '<div class="req open" data-s="' + t.status + '"><div class="req-h"><span class="rk">' + (i + 1) + '</span><div class="rn"><b>' + esc(t.task) + '</b></div>' + stPill(t.status) + '</div>' + (t.quote ? '<div class="req-b"><div><div class="inner"><div class="quote">“' + esc(t.quote) + '”</div></div></div></div>' : '') + '</div>'; }).join('') + '</div></div>';

    // plan
    var M = P.months, step = M <= 12 ? 1 : M <= 18 ? 2 : 3, ticks = '';
    for (var m = 0; m <= M; m += step) ticks += '<span style="left:' + (m / M * 100) + '%">' + (m === 0 ? 'เริ่ม' : 'ด.' + m) + '</span>';
    var phases = [['foundation', 'ปูพื้นฐาน'], ['core_gap_closure', 'ปิดช่องว่างหลัก'], ['advanced_or_cert_prep', 'ขั้นสูง / เตรียมสอบ']];
    h += '<div class="card glass section reveal"><div class="sec-h"><h3><span class="hi">' + ic('route') + '</span>เส้นทางการเรียนรู้เฉพาะบุคคล</h3><p>' + ({ both: 'คอร์ส + ใบรับรอง', course_only: 'คอร์สอย่างเดียว', certification_only: 'ใบรับรองอย่างเดียว' })[P.mode] + ' · ' + M + ' เดือน · ' + P.hours_per_week + ' ชม./สัปดาห์</p></div>' +
      '<div class="plan-strip">' +
      '<div class="fact"><small>ชั่วโมงสูงสุด (Hmax)</small><b class="num">' + fmt(P.Hmax, 0) + ' ชม.</b></div>' +
      '<div class="fact"><small>ชั่วโมงในแผน</small><b class="num">' + fmt(P.total_hours, 0) + ' ชม. · ' + fmt(P.weeks_needed, 0) + ' สัปดาห์</b></div>' +
      '<div class="fact"><small>คอร์ส / ใบรับรอง</small><b class="num">' + P.n_courses + ' / ' + P.n_certs + '</b></div>' +
      '<div class="fact"><small>ค่าใช้จ่ายโดยประมาณ (USD)</small><b class="num">' + (P.cost_usd ? '$' + fmt(P.cost_usd, 0) : 'ไม่มี') + '</b></div></div>';
    if (P.items.length) {
      h += '<div class="gantt" style="--gstep:' + (100 / M * step) + '%"><div class="g-axis">' + ticks + '</div>' +
        P.items.map(function (it) {
          var l = it.start_month / M * 100, w = Math.max(0.8, (it.end_month - it.start_month) / M * 100);
          return '<div class="g-row"><div class="gl" title="' + esc(it.title) + '">' + it.seq + '. ' + esc(it.title) + '</div><div class="gt"><span class="gb" style="left:' + l + '%;width:' + w + '%;background:' + PHASE_COLOR[it.phase] + '" data-tip="<b>' + esc(it.title) + '</b><br>' + esc(it.phase_th) + ' · ' + fmt(it.hours, 0) + ' ชม.<br>สัปดาห์ที่ ' + fmt(it.start_week, 1) + '–' + fmt(it.end_week, 1) + '"></span></div></div>';
        }).join('') +
        '<div class="legend">' + phases.map(function (p) { return '<span><i style="background:' + PHASE_COLOR[p[0]] + '"></i>' + p[1] + '</span>'; }).join('') + '</div></div>';
      h += '<div class="items">' + P.items.map(itemCard).join('') + '</div>';
    }
    if (P.notice) h += '<div class="note">' + ic('alert', 18) + '<div>' + esc(P.notice) + '</div></div>';
    if (P.owned.length) h += '<div class="note info">' + ic('award', 18) + '<div><b>ใบรับรองที่มีอยู่แล้ว (ไม่ใส่ในแผน):</b> ' + P.owned.map(function (o) { return esc(o.title); }).join(', ') + '</div></div>';
    if (P.uncovered_over_capacity.length) h += '<div class="note">' + ic('clock', 18) + '<div><b>มีคอร์สรองรับแต่เกินเวลาที่มี (' + P.uncovered_over_capacity.length + ' ข้อ):</b> ' + P.uncovered_over_capacity.map(function (o) { return esc(o.name); }).join(', ') + ' — เพิ่มชั่วโมงต่อสัปดาห์หรือระยะเวลาเพื่อครอบคลุม</div></div>';
    if ((P.uncovered_level_filtered || []).length) h += '<div class="note info">' + ic('info', 18) + '<div><b>มีหลักฐานบางส่วนแล้ว และคลังมีเฉพาะรายการระดับเริ่มต้น (' + P.uncovered_level_filtered.length + ' ข้อ · ไม่ใส่ในแผนเพราะมีประสบการณ์ ' + fmt(P.learner.years_experience, 0) + ' ปี):</b> ' + P.uncovered_level_filtered.map(function (o) { return esc(o.name); }).join(', ') + '</div></div>';
    if (P.n_unverified) h += '<div class="note info">' + ic('info', 18) + '<div><b>ข้อที่ยังยืนยันไม่ได้ ' + P.n_unverified + ' ข้อไม่ใส่ในแผน</b> — ถ้ามีประสบการณ์ข้อเหล่านี้ เพิ่มหลักฐานในหัวข้อด้านล่างแล้ววิเคราะห์ใหม่</div></div>';
    if (P.uncovered_no_candidate.length) h += '<div class="note info">' + ic('info', 18) + '<div><b>ยังไม่มีคอร์สในคลังที่เชื่อมโยงผ่านการตรวจ (' + P.uncovered_no_candidate.length + ' ข้อ):</b> ' + P.uncovered_no_candidate.map(function (o) { return esc(o.name); }).join(', ') + '</div></div>';
    h += '</div>';

    // role context
    var found = (r.tech && r.tech.found) || [];
    var tech = RO.hot_tech.map(function (t) { var got = found.indexOf(t.name) >= 0; return '<span class="tech' + (got ? ' got' : '') + '" data-tip="' + esc(t.category) + (t.in_demand ? '<br>In Demand (O*NET)' : '') + (got ? '<br>พบในเรซูเม' : '') + '">' + (t.in_demand ? '<span class="fire"></span>' : '') + (got ? ic('check', 11, 3) : '') + esc(t.name) + '</span>'; }).join('');
    h += '<div class="card glass section reveal"><div class="sec-h"><h3><span class="hi">' + ic('briefcase') + '</span>บริบทอาชีพจาก O*NET 31.0</h3><p>' + esc(RO.onet_title) + '</p></div>' +
      '<p class="summary-text">' + esc(RO.description) + '</p>' +
      '<h5 style="margin:0 0 6px;font-size:13px;color:var(--ink-3)">เทคโนโลยีที่ตลาดใช้ (Hot Technology · จุดส้ม = In Demand · ✓ = พบในเรซูเม · ที่ตลาดต้องการพบ ' + (r.tech ? r.tech.n_found + '/' + r.tech.n_total : '—') + ')</h5>' +
      '<div class="marquee"><div class="mt">' + tech + '<span class="dup" style="display:contents">' + tech + '</span></div></div>' +
      '<div class="ctx"><div><h5>งานหลักของอาชีพ (Task IM สูงสุด)</h5><ol>' + RO.tasks.map(function (t) { return '<li>' + esc(t.task) + ' <span class="tag num">IM ' + fmt(t.im, 2) + '</span></li>'; }).join('') + '</ol></div>' +
      '<div><h5>ระดับการศึกษาของผู้ทำงานจริง</h5>' + RO.education.map(function (e) { return '<div class="edu"><span>' + esc(e.level) + '</span><b class="num">' + fmt(e.pct, 0) + '%</b><div class="tr"><i style="width:' + e.pct + '%"></i></div></div>'; }).join('') +
      '<h5 style="margin-top:16px">ชื่อตำแหน่งที่พบในตลาด</h5><div class="cert-list">' + RO.job_titles.slice(0, 8).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div></div></div></div>';

    // Open Learner Model (DEC-58)
    var olmRows = r.requirements.filter(function (q) { return q.status !== 'evidenced'; }).sort(function (a, b) { return b.w - a.w; });
    if (olmRows.length) h += '<div class="card glass section reveal no-pdf" id="olm"><div class="sec-h"><h3><span class="hi">' + ic('user') + '</span>ระบบยังไม่เห็นหลักฐานของคุณ?</h3><p>เพิ่มเป็นประโยคที่บอกสิ่งที่ทำจริง แล้ววิเคราะห์ใหม่ด้วยกฎเดียวกัน</p></div>' +
      '<p class="src-note" style="margin:0 0 10px">หลักฐานที่พิมพ์เพิ่มจะถูกต่อท้ายเรซูเม ตรวจด้วย R2/R3 เหมือนข้อความในเรซูเม และติดป้าย “หลักฐานที่คุณเพิ่ม” ในรายงาน — ไม่ใช่การแก้ผลด้วยมือ</p>' +
      '<div class="olm-list">' + olmRows.slice(0, 12).map(function (q) { return '<label class="olm-row"><span>' + stPill(q.status) + ' <b>' + esc(q.name) + '</b></span><textarea rows="2" maxlength="400" data-name="' + esc(q.name) + '" placeholder="เช่น สิ่งที่ทำ · เครื่องมือ · ผลลัพธ์ (ภาษาอังกฤษหรือไทย)"></textarea></label>'; }).join('') + '</div>' +
      '<div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn btn-primary btn-sm" id="olmGo" type="button">' + ic('spark', 15) + 'วิเคราะห์ใหม่พร้อมหลักฐานเพิ่มเติม</button></div></div>';


    // D6/D7 · H + ตารางโทเคน
    var TKN = r.tokens;
    h += '<div class="card glass section reveal"><div class="sec-h"><h3><span class="hi">' + ic('cpu') + '</span>ตัวชี้วัดเสริมและโทเคนที่ใช้</h3><p>Role-Fit F = ½·R-role + ½·T · R-role ถ่วงด้วย idf (ทักษะที่เฉพาะอาชีพมีน้ำหนักมากกว่าทักษะที่ทุกอาชีพมี)</p></div>' +
      '<div class="src-note">Role-Fit ' + fmt(S.role_fit, 1) + ' · R-role ' + fmt(S.r_role, 1) + ' · T ' + fmt(S.role_task_index, 1) + ' · R ' + fmt(S.readiness_pct, 1) + ' · เทคโนโลยี (H) ' +
      (S.h_sufficient ? S.n_tech_found + '/' + S.n_tech_total : 'ข้อมูลไม่พอ (ตลาดระบุเพียง ' + S.n_tech_total + ' รายการ)') +
      (S.adjust ? ' · ปรับด้วยกฎผู้ลงมือ ' + S.adjust.n_actor + ' ข้อ · จำกัดข้อความซ้ำ ' + S.adjust.n_reuse + ' ข้อ' : '') + '</div>';
    if (TKN) {
      h += '<table class="tbl"><tr><th>ขั้นตอน</th><th>เรียก</th><th>Input</th><th>Output</th><th>Thinking</th><th>รวม</th></tr>' +
        TKN.stages.map(function (x) { return '<tr><td>' + esc(x.stage) + '</td><td>' + x.calls + '</td><td>' + fmt(x.input) + '</td><td>' + fmt(x.output) + '</td><td>' + fmt(x.thinking) + '</td><td>' + fmt(x.total) + '</td></tr>'; }).join('') +
        '<tr><th>รวม</th><th>' + TKN.total.calls + '</th><th>' + fmt(TKN.total.input) + '</th><th>' + fmt(TKN.total.output) + '</th><th>' + fmt(TKN.total.thinking) + '</th><th>' + fmt(TKN.total.total) + '</th></tr></table>' +
        '<p class="src-note">ตรวจความหมายจาก cache ' + (TKN.cached_checks || 0) + ' ข้อ · เรียกใหม่ ' + (TKN.fresh_checks || 0) + ' ข้อ' + (TKN.cost_usd != null ? ' · ประมาณ $' + TKN.cost_usd : '') + '</p>';
    }
    h += '</div>';

    // provenance
    var pv = r.provenance;
    h += '<div class="prov-foot glass reveal"><div><b>แหล่งข้อมูล</b>' + esc(pv.onet) + '<br>' + esc(pv.snapshot) + ' · ' + esc(pv.corpus) + '<br>Data_Set.xlsx sha256 ' + esc(pv.dataset_sha256) + '…</div>' +
      '<div><b>วิธีการ</b>' + esc(pv.policy) + '<br>' + esc(pv.rules) + '</div>' +
      '<div><b>การประมวลผล</b>' + esc(r.run_id) + ' · ' + dt.toLocaleString('th-TH') + '<br>' + (r.ocr.method === 'gemini_ocr' ? 'OCR: Gemini' : 'OCR: PDF text layer') + ' · โมเดล: ' + esc(A.model) + '<br>' + esc(pv.note) + '<br>workflow v' + esc(VR.wf_version || '') + ' · ' + esc(VR.build_id || '') + '</div></div>';

    var root = Q('#report'); root.innerHTML = h;
    observe(root);
    var og = Q('#olmGo', root);
    if (og) og.addEventListener('click', function () {
      var lines = QA('#olm textarea', root).map(function (t) { var v = t.value.trim(); return v ? '- ' + t.getAttribute('data-name') + ': ' + v : ''; }).filter(Boolean);
      if (!lines.length) { toast('พิมพ์หลักฐานอย่างน้อย 1 ข้อก่อน', 'err', 4000); return; }
      Q('#dock').classList.remove('on'); analyze(lines.join('\n'));
    });
    // animations
    setTimeout(function () {
      QA('.ring .val', root).forEach(function (c) { c.style.strokeDashoffset = c.getAttribute('data-off'); });
      QA('[data-count]', root).forEach(function (el) { animateNum(el, Number(el.getAttribute('data-count')), 1400, 0); });
      QA('.dbar .tr i', root).forEach(function (el) { el.style.width = el.getAttribute('data-w'); });
      QA('.gb', root).forEach(function (el, i) { setTimeout(function () { el.classList.add('in'); }, 120 + i * 70); });
    }, 120);
    QA('.req-h', root).forEach(function (hd) { hd.addEventListener('click', function () { hd.parentNode.classList.toggle('open'); hd.setAttribute('aria-expanded', hd.parentNode.classList.contains('open')); }); });
    QA('#reqFilters .fbtn', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-f');
        QA('#reqFilters .fbtn', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        QA('.req', root).forEach(function (rw) { rw.style.display = (f === 'all' || rw.getAttribute('data-s') === f) ? '' : 'none'; });
      });
    });
  }
  function kpi(icon, k, v, s, extra) {
    return '<div class="kpi glass reveal spot"><div class="k">' + ic(icon, 15) + k + '</div><div class="v">' + v + '</div><div class="s">' + s + '</div>' + (extra || '') + '</div>';
  }
  function reqRow(q, idx) {
    var body = '';
    body += '<div style="color:var(--ink-3);font-size:12.5px">' + esc(q.desc) + '</div>';
    if (q.quote) body += '<div class="quote">“' + esc(q.quote) + '”</div>';
    var fl = [];
    var has = function (f) { return q.flags.indexOf(f) >= 0; };
    var GOOD = 'style="background:var(--good-bg);color:var(--good-ink)"', BAD = 'style="background:var(--bad-bg);color:var(--bad-ink)"';
    var SRC = { credential: 'จากใบรับรองในเรซูเม (R5)', linkage: 'อนุมานจากกิจกรรมที่มีหลักฐาน (R6 · O*NET)', learner: 'หลักฐานที่คุณเพิ่ม' };
    if (q.source && SRC[q.source]) fl.push('<span class="tag" ' + GOOD + '>' + ic('award', 11) + ' ' + SRC[q.source] + '</span>');
    if (q.verified === true) fl.push('<span class="tag" ' + GOOD + '>' + ic('check', 11, 3) + (has('R2_repaired') ? ' R2 พบในเรซูเม (ซ่อมรูปคำ)' : ' R2 พบตรงตัวอักษร') + '</span>');
    if (q.r3_layer === 'lexical') fl.push('<span class="tag">R3 คำตรง overlap ' + fmt(q.overlap, 2) + '</span>');
    if (has('R3b_supports') || has('R3b_partial')) fl.push('<span class="tag" ' + GOOD + '>R3 ผ่านด้วยความหมาย (Gemini ตรวจ)' + (has('R3b_partial') ? ' · บางส่วน' : '') + '</span>');
    if (has('R2_quote_not_found')) fl.push('<span class="tag" ' + BAD + '>R2 ไม่พบ quote ในเรซูเม</span>');
    if (has('R3b_unrelated')) fl.push('<span class="tag" ' + BAD + '>R3 ตรวจความหมายแล้วไม่เกี่ยว</span>');
    if (has('R3_low_overlap')) fl.push('<span class="tag" ' + BAD + '>R3 คำไม่ตรง (กฎสำรอง)</span>');
    if (has('R3b_unavailable')) fl.push('<span class="tag">ผู้ตรวจความหมายไม่ตอบ</span>');
    if (q.status === 'abstained') fl.push('<span class="tag">รอบวิเคราะห์เห็นตรงกันไม่พอ (' + (q.n_votes || 0) + ' เสียงที่นับได้) → ยังยืนยันไม่ได้</span>');
    if (q.status === 'missing' && q.claimed === 'missing') fl.push('<span class="tag">โมเดลไม่พบหลักฐานในเรซูเม</span>');
    if (q.n_runs > 1 && q.status !== 'abstained') fl.push('<span class="tag">เห็นตรงกัน ' + fmt((q.agreement || 0) * 100, 0) + '% ของ ' + q.n_votes + ' รอบ</span>');
    if (q.confidence != null) fl.push('<span class="tag">ความมั่นใจของโมเดล ' + fmt(q.confidence, 2) + '</span>');
    fl.push('<span class="tag mono">' + esc(q.element_id) + '</span><span class="tag">IM ' + fmt(q.im, 2) + '</span>');
    body += '<div class="flags">' + fl.join('') + '</div>';
    return '<div class="req" data-s="' + q.status + '"><div class="req-h" role="button" tabindex="0" aria-expanded="false"><span class="rk">' + idx + '</span><div class="rn"><b>' + esc(q.name) + '</b><small>' + esc(DOMAIN_TH[q.domain] || q.domain) + '</small></div>' +
      '<span class="wt" data-tip="น้ำหนักตามสมการ 3.1 (IM ÷ ผลรวม IM ของ 30 ข้อ)">w ' + fmt(q.w * 100, 2) + '%</span>' + stPill(q.status) + '<span class="chev">' + ic('chev', 16) + '</span></div>' +
      '<div class="req-b"><div><div class="inner">' + body + '</div></div></div></div>';
  }
  function itemCard(it) {
    var cert = it.type === 'certification';
    return '<div class="item spot" style="page-break-inside:avoid"><div class="ih"><span class="seq" style="background:' + PHASE_COLOR[it.phase] + '">' + it.seq + '</span><div style="min-width:0">' +
      '<h4>' + (it.url ? '<a href="' + esc(it.url) + '" target="_blank" rel="noopener">' + esc(it.title) + ' ' + ic('ext', 12) + '</a>' : esc(it.title)) + '</h4>' +
      '<div class="prov">' + esc(it.provider) + (it.platform && it.platform !== it.provider ? ' · ' + esc(it.platform) : '') + '</div></div></div>' +
      (it.outcome_th ? '<p class="outc">' + esc(it.outcome_th) + '</p>' : '') +
      '<div class="im"><span class="tag">' + (cert ? ic('award', 11) + ' ใบรับรอง' : ic('book', 11) + ' คอร์ส') + '</span><span class="tag num">' + fmt(it.hours, 0) + ' ชม.</span>' +
      (it.level ? '<span class="tag">' + esc(it.level) + '</span>' : '') + '<span class="tag">' + esc(it.phase_th) + '</span>' +
      (it.cost_usd ? '<span class="tag num">$' + fmt(it.cost_usd, 0) + '</span>' : (it.cost_cat ? '<span class="tag">' + esc(it.cost_cat) + '</span>' : '')) +
      (it.exam_code ? '<span class="tag mono">' + esc(it.exam_code) + '</span>' : '') + '</div>' +
      '<div class="cov"><b>ปิดช่องว่าง ' + it.covers.length + ' ข้อ:</b> ' + it.covers.map(function (c) { return esc(c.name); }).join(' · ') + '</div>' +
      '<div class="cov">d<sub>k</sub> = ' + fmt(it.d_k * 1000, 3) + '×10⁻³ · สัปดาห์ที่ ' + fmt(it.start_week, 1) + '–' + fmt(it.end_week, 1) + ' · URL ตรวจเมื่อ ' + esc(it.verified_on) + '</div></div>';
  }

  /* ---------------- PDF / DRIVE ----------------
   * n8n เสิร์ฟหน้านี้ภายใต้ CSP sandbox (ไม่มี allow-same-origin) → html2canvas/html2pdf ใช้ไม่ได้
   * (มันโคลนหน้าใส่ iframe ซึ่งกลายเป็น cross-origin) จึงใช้ html-to-image (SVG foreignObject → canvas)
   * + jsPDF และตัดหน้าเองโดยไม่ตัดกลางการ์ด/แถว
   */
  function loadOne(urls, test) {
    return new Promise(function (resolve, reject) {
      if (test()) return resolve();
      var i = 0;
      (function next() {
        if (i >= urls.length) return reject(new Error('โหลดไลบรารีสร้าง PDF ไม่ได้ (ต้องต่ออินเทอร์เน็ต)'));
        var s = document.createElement('script'); s.src = urls[i++]; s.async = true;
        s.onload = function () { test() ? resolve() : next(); }; s.onerror = next;
        document.head.appendChild(s);
      })();
    });
  }
  var libPromise = null;
  function loadPdfLib() {
    if (!libPromise) {
      libPromise = Promise.all([
        loadOne(PDF_LIBS.htmlToImage, function () { return !!window.htmlToImage; }),
        loadOne(PDF_LIBS.jspdf, function () { return !!(window.jspdf && window.jspdf.jsPDF); })
      ]).catch(function (e) { libPromise = null; throw e; });
    }
    return libPromise;
  }
  function fileName() {
    var r = REPORT; if (!r) return 'report.pdf';
    return 'IS68076026_' + r.role.role_id + '_' + r.role.name_en.replace(/[^A-Za-z0-9]+/g, '-').replace(/-+$/, '') + '_' + r.run_id + '.pdf';
  }
  var AVOID = '.pdf-head, .hero-card, .kpi, .card > .sec-h, .fact, .dbar, .req, .gnode, .rej-item, .g-row, .item, .note, .ctx > div, .marquee, .prov-foot, .summary-text, .edu, .legend, .cert-list';
  var fontCssCache = null;
  function nextFrame() { return new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); }); }
  function buildPdf() {
    var html = document.documentElement, prevTheme = html.getAttribute('data-theme');
    var hidden = QA('.req').filter(function (x) { return x.style.display === 'none'; });
    var el = Q('#report');
    return loadPdfLib().then(function () {
      html.setAttribute('data-theme', 'light'); html.classList.add('pdf-mode');
      hidden.forEach(function (x) { x.style.display = ''; });
      QA('.gb').forEach(function (x) { x.classList.add('in'); });
      return (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(nextFrame);
    }).then(function () {
      // จุดตัดหน้าที่ปลอดภัย: ไม่ตกอยู่กลางองค์ประกอบใน AVOID
      var base = el.getBoundingClientRect();
      var W = el.offsetWidth, H = el.scrollHeight;
      var boxes = QA(AVOID, el).map(function (n) { var r = n.getBoundingClientRect(); return [r.top - base.top, r.bottom - base.top]; });
      var pr = Math.max(0.6, Math.min(2, 16000 / H)); // html-to-image จำกัดด้านยาว canvas ที่ 16384px
      var opts = { pixelRatio: pr, backgroundColor: '#ffffff', cacheBust: false, width: W, height: H,
        filter: function (n) { return !(n.classList && n.classList.contains('no-pdf')); } };
      var fontP = fontCssCache ? Promise.resolve(fontCssCache) : window.htmlToImage.getFontEmbedCSS(el).then(function (c) { fontCssCache = c; return c; }).catch(function () { return ''; });
      return fontP.then(function (css) {
        if (css) opts.fontEmbedCSS = css; else opts.skipFonts = true;
        return window.htmlToImage.toCanvas(el, opts);
      }).then(function (canvas) {
        var JsPDF = window.jspdf.jsPDF;
        var pdf = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
        var M = { l: 9, r: 9, t: 10, b: 13 }, pw = 210 - M.l - M.r, ph = 297 - M.t - M.b;
        var pxPerMm = W / pw, pageH = ph * pxPerMm;
        var cuts = [0], y = 0;
        while (y < H - 1) {
          var cut = y + pageH;
          if (cut >= H) cut = H;
          else {
            // ย้ายจุดตัดขึ้นไปที่ขอบบนขององค์ประกอบที่ถูกตัดกลาง (ผ่านเดียว ไม่ไล่ต่อเนื่อง)
            var lim = cut;
            for (var i = 0; i < boxes.length; i++) {
              var bx = boxes[i];
              if (bx[0] < lim && bx[1] > lim && bx[1] - bx[0] < pageH * 0.9 && bx[0] > y + 40) cut = Math.min(cut, bx[0] - 1);
            }
            if (cut <= y + 80) cut = y + pageH;
          }
          cuts.push(cut); y = cut;
        }
        var n = cuts.length - 1;
        var ky = canvas.height / H, kx = canvas.width / W; // อัตราส่วนจริงของ canvas (อาจถูกย่อ)
        for (var p = 0; p < n; p++) {
          var sy = cuts[p], sh = cuts[p + 1] - sy;
          var c = document.createElement('canvas');
          c.width = canvas.width; c.height = Math.max(1, Math.round(sh * ky));
          var g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
          g.drawImage(canvas, 0, Math.round(sy * ky), c.width, c.height, 0, 0, c.width, c.height); void kx;
          if (p > 0) pdf.addPage();
          pdf.addImage(c.toDataURL('image/jpeg', 0.9), 'JPEG', M.l, M.t, pw, sh / pxPerMm, undefined, 'FAST');
          pdf.setFontSize(8); pdf.setTextColor(120);
          pdf.text('IS 68076026 · Skill-Gap Navigator · ' + (REPORT ? REPORT.run_id : ''), M.l, 297 - 6);
          pdf.text('Page ' + (p + 1) + ' / ' + n, 210 - M.r, 297 - 6, { align: 'right' });
        }
        pdf.setProperties({ title: fileName().replace(/\.pdf$/, ''), subject: 'Skill-gap report', creator: 'WF_Demo · n8n' });
        return pdf;
      });
    }).finally(function () {
      html.classList.remove('pdf-mode'); html.setAttribute('data-theme', prevTheme);
      hidden.forEach(function (x) { x.style.display = 'none'; });
    });
  }
  function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
  }
  function busy(btn, on, label) {
    btn.disabled = on;
    if (on) { btn.setAttribute('data-l', btn.innerHTML); btn.innerHTML = '<span style="display:inline-flex;animation:spin 1s linear infinite">' + ic('loader', 16) + '</span>' + label; }
    else if (btn.getAttribute('data-l')) btn.innerHTML = btn.getAttribute('data-l');
  }
  Q('#btnPdf').addEventListener('click', function () {
    var b = this; busy(b, true, 'กำลังสร้าง PDF…');
    buildPdf().then(function (pdf) { downloadBlob(pdf.output('blob'), fileName()); toast('ดาวน์โหลด <b>' + esc(fileName()) + '</b> แล้ว', 'ok'); })
      .catch(function (e) { toast(esc(e.message || e) + ' — ใช้การพิมพ์ของเบราว์เซอร์ (Save as PDF) แทน', 'err', 9000); try { window.print(); } catch (x) {} })
      .finally(function () { busy(b, false); });
  });
  Q('#btnDrive').addEventListener('click', function () {
    var b = this; busy(b, true, 'กำลังอัปโหลด…');
    buildPdf().then(function (pdf) { var blob = pdf.output('blob');
      var fd = new FormData(); fd.append('pdf', new File([blob], fileName(), { type: 'application/pdf' }));
      fd.append('filename', fileName()); fd.append('run_id', REPORT ? REPORT.run_id : '');
      return fetch(EP_SAVE, { method: 'POST', body: fd });
    }).then(function (res) {
      return res.text().then(function (t) { var j = null; try { j = JSON.parse(t); } catch (e) {}
        if (!res.ok || !j || !j.ok) throw new Error(j && j.errors ? j.errors.join(' ') : (res.status === 404 ? 'ไม่พบ webhook บันทึก PDF — ต้อง Publish workflow ก่อน' : 'อัปโหลดไม่สำเร็จ (HTTP ' + res.status + ')'));
        return j; });
    }).then(function (j) {
      toast('บันทึกลง Google Drive แล้ว · <a href="' + esc(j.web_view_link) + '" target="_blank" rel="noopener">เปิดไฟล์ ' + ic('ext', 12) + '</a>', 'ok', 12000);
    }).catch(function (e) { toast(esc(e.message), 'err', 9000); })
      .finally(function () { busy(b, false); });
  });
  Q('#btnNew').addEventListener('click', function () { Q('#dock').classList.remove('on'); show('vForm'); setTimeout(function () { paintMonths(); paintMode(); }, 50); });
  document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('req-h')) { e.preventDefault(); e.target.click(); } });
})();
