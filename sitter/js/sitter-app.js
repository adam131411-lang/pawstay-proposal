/* ============ 爪爪日常 保母端 App — 主程式 ============ */
'use strict';

const $view = document.getElementById('view');
const $tabbar = document.getElementById('tabbar');
const $sheetRoot = document.getElementById('sheet-root');
const $toastRoot = document.getElementById('toast-root');
const APP = { tab: 'hall', shiftDay: 0 };

/* ============ 小工具 ============ */
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  $toastRoot.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}
function openSheet(html) {
  $sheetRoot.innerHTML = `<div class="sheet-mask" data-action="close-sheet"></div>
    <div class="sheet" role="dialog" aria-modal="true"><div class="grip"></div>${html}</div>`;
}
function closeSheet() { $sheetRoot.innerHTML = ''; }
function jobById(id) { return DB.jobs.find(j => j.id === id); }
function speciesImg(sp) { return `assets/species/${sp === 'dog' ? 'dog' : sp === 'cat' ? 'cat' : 'exotic'}.png`; }
function starsTxt(r) { return '★'.repeat(Math.round(r)); }
function jobAmount(j) { return orderAmount(j.qp); }
function isLocked(j) { return j.requires === 'medical' && !DB.me.medical_certified; }
function isNight(t) { return t && (Number(t.split(':')[0]) >= 22 || Number(t.split(':')[0]) < 7); }
function jobBadges(j) {
  const b = [];
  if (HOLIDAYS.includes(j.qp.date)) b.push('<span class="chip">連假 ×1.5</span>');
  if (isNight(j.qp.time)) b.push('<span class="chip">夜間 +$150</span>');
  if (j.high_risk) b.push('<span class="chip no">⚠ 高風險犬</span>');
  if (j.requires === 'medical') b.push(`<span class="chip ${DB.me.medical_certified ? 'ok' : 'no'}">需醫療級</span>`);
  if ((j.qp.addons || []).length && j.requires !== 'medical') b.push('<span class="chip">含加值</span>');
  return b.join(' ');
}

function apphead(sub) {
  return `<div class="apphead"><img src="assets/logo/logo.png" alt="爪爪日常">
    <div><div class="brand">爪爪日常・保母端</div><div class="sub">${sub || 'Pawfect Sitter'}</div></div>
    <div class="spacer"></div><span class="chip">${esc(DB.me.cert_no)}</span></div>`;
}
function appfoot() {
  return `<footer class="appfoot"><div class="foot-slogan">✦ 自己家的毛孩，敢不敢交給這個人。</div>
    敢，才上架——每一單都是這句話的證明。<br>爪爪日常 Pawfect Life・保母工作台</footer>`;
}

/* ============ 導航 ============ */
function go(tab) {
  APP.tab = tab;
  document.querySelectorAll('#tabbar .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  closeSheet();
  render();
  window.scrollTo(0, 0);
}
$tabbar.addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) go(b.dataset.tab); });

function render() {
  clearInterval(render._timer);
  const fn = { hall: renderHall, shift: renderShift, job: renderJob, income: renderIncome, me: renderMe }[APP.tab];
  $view.innerHTML = `<div class="screen">${fn()}</div>`;
  updateBadges();
}
function updateBadges() {
  const hasActive = DB.jobs.some(j => j.status === 'active');
  const hasOffer = DB.online && DB.jobs.some(j => j.status === 'offer');
  [['job', hasActive], ['hall', hasOffer]].forEach(([tab, on]) => {
    const el = document.querySelector(`.tab[data-tab=${tab}]`);
    el.querySelector('.badge-dot')?.remove();
    if (on) { const d = document.createElement('i'); d.className = 'badge-dot'; el.appendChild(d); }
  });
}

/* ============ Tab 1 接單大廳 ============ */
function renderHall() {
  const offers = DB.jobs.filter(j => j.status === 'offer');
  const cards = DB.online ? offers.map(j => {
    const amt = jobAmount(j);
    const locked = isLocked(j);
    return `<div class="job-card ${locked ? 'locked' : ''}" data-action="open-job" data-id="${j.id}" role="button" tabindex="0">
      <div class="jc-top"><span class="jc-svc">${esc(j.service_name)}</span>${jobBadges(j)}</div>
      <div class="jc-meta">
        <img src="${speciesImg(j.pet.species)}" alt="" style="width:18px;vertical-align:-4px"> ${esc(j.pet.name)}（${esc(j.pet.breed)}・${esc(j.pet.age)}）
        ・${fmtDate(resolveDate(j.slot.date))} ${j.slot.time}・${j.slot.dur}<br>
        📍 ${esc(j.owner_area)}・距你 ${j.dist_km} km</div>
      <div class="jc-pay"><span class="muted">訂單額 ${fmtMoney(amt)} →</span>
        <span class="price">你的分潤 ${fmtMoney(payout(amt))}</span><span class="muted">（75%）</span>
        ${locked ? '<span class="chip no" style="margin-left:auto">🔒 需醫療級認證</span>' : ''}</div>
    </div>`;
  }).join('') : '';
  return `${apphead('自由接單・透明分潤')}
    <h1 class="pagetitle">接單大廳</h1>
    <p class="pagesub">承攬制：完全自由上下線、可拒單，拒接不影響評分、無任何懲罰。</p>
    <div class="online-card">
      <div class="oc-txt"><div class="oc-state" style="color:${DB.online ? 'var(--ok)' : 'var(--ink-soft)'}">${DB.online ? '接單中' : '已下線'}</div>
        <div class="muted">${DB.online ? '系統會推播 3 公里內符合你資格的訂單' : '下線期間不會收到任何訂單，也不影響任何權益'}</div></div>
      <button class="switch ${DB.online ? 'on' : ''}" data-action="toggle-online" aria-label="上線開關"></button>
    </div>
    <div class="sec-label">✦ 3 公里內的新訂單${DB.online ? `（${offers.length}）` : ''}</div>
    ${DB.online ? (cards || '<div class="card muted">目前沒有新訂單，稍後再看看。</div>')
                : '<div class="card muted">你已下線。想接單時再打開開關即可——上下線完全自由。</div>'}
    ${appfoot()}`;
}

function openJobSheet(id) {
  const j = jobById(id);
  const amt = jobAmount(j);
  const q = computeQuote({ ...j.qp, tier: 'month', couponCount: 0 });
  const locked = isLocked(j);
  const aggBox = j.pet.aggression ? `<div class="card" style="border-color:var(--no);margin-top:10px">
      <b style="color:var(--no)">⚠ 高風險犬隻・攻擊紀錄揭露</b>
      <div class="muted" style="margin-top:4px">${esc(j.pet.aggression)}</div>
      <div class="muted" style="margin-top:6px"><b>你可以拒接，無任何懲罰、不影響評分。</b>平台不強制媒合、不因危險性加價——安全優先於營收。</div></div>` : '';
  const vetBox = j.pet.vet_note ? `<div class="card" style="margin-top:10px"><b>📋 獸醫書面指示</b><div class="muted" style="margin-top:4px">${esc(j.pet.vet_note)}</div></div>` : '';
  openSheet(`<h3>${esc(j.service_name)} <span class="muted" style="font-size:.8rem">${j.id}</span></h3>
    <div style="margin:6px 0">${jobBadges(j)}</div>
    <div class="card" style="display:flex;gap:12px;align-items:center">
      <img src="${speciesImg(j.pet.species)}" alt="" style="width:48px">
      <div><b>${esc(j.pet.name)}</b> <span class="muted">${esc(j.pet.breed)}・${esc(j.pet.age)}</span>
        <div style="margin-top:4px">${(j.pet.tags || []).map(t => `<span class="chip" style="font-size:.64rem;padding:2px 8px;margin-right:4px">${esc(t)}</span>`).join('')}</div></div></div>
    ${aggBox}${vetBox}
    <div class="card" style="margin-top:10px">
      <div class="quote-line"><span class="q-label">時間</span><span>${fmtDate(resolveDate(j.slot.date))} ${j.slot.time}・${j.slot.dur}</span></div>
      <div class="quote-line"><span class="q-label">地點</span><span>${esc(j.owner_area)}（${j.dist_km} km）</span></div>
      <div class="quote-line"><span class="q-label">進出方式</span><span>${esc(j.pet.entry)}</span></div>
      <div class="quote-line"><span class="q-label">地雷提醒</span><span style="text-align:right;max-width:60%">${esc(j.pet.taboos || '—')}</span></div></div>
    <div class="card" style="margin-top:10px">
      ${q.lines.map(l => `<div class="quote-line"><span class="q-label">${l.label}</span><span class="${l.cls || ''}">${l.amount < 0 ? '−' : ''}${fmtMoney(Math.abs(l.amount))}</span></div>`).join('')}
      <div class="quote-line"><span class="q-label">訂單額</span><span>${fmtMoney(amt)}</span></div>
      <div class="quote-line"><span class="q-label">平台服務費 25%</span><span class="plus">−${fmtMoney(platformFee(amt))}</span></div>
      <div class="quote-line total"><span>你的分潤（75%）</span><span class="price">${fmtMoney(payout(amt))}</span></div></div>
    ${locked ? `<div class="result-box" style="margin-top:12px"><b>🔒 此單含「皮下輸液」，僅醫療級保母可接。</b>
        <div class="muted" style="margin-top:4px">完成醫療照護培訓＋考核即可解鎖此類訂單（含輸液加值分潤）。</div>
        <button class="btn btn-soft btn-sm" style="margin-top:10px" data-action="goto-training">查看醫療級培訓 →</button></div>
      <button class="btn btn-ghost" style="width:100%;margin-top:12px" data-action="close-sheet">關閉</button>`
    : `<div style="display:flex;gap:10px;margin-top:14px">
        <button class="btn btn-ghost btn-sm" style="flex:1" data-action="decline-ask" data-id="${j.id}">拒接</button>
        <button class="btn btn-primary btn-sm" style="flex:2" data-action="accept-job" data-id="${j.id}">接單・分潤 ${fmtMoney(payout(amt))}</button></div>`}`);
}
function declineAsk(id) {
  const j = jobById(id);
  openSheet(`<h3>確定拒接這張單？</h3>
    <p class="muted" style="margin:8px 0 4px">${esc(j.service_name)}・${esc(j.pet.name)}・${fmtDate(resolveDate(j.slot.date))} ${j.slot.time}</p>
    <div class="result-box"><b>拒接完全沒有懲罰。</b>
      <div class="muted" style="margin-top:4px">承攬制保障：不影響評分、不降低媒合順位、不會被停權。訂單會轉給其他保母。</div></div>
    <div style="display:flex;gap:10px;margin-top:14px">
      <button class="btn btn-ghost btn-sm" style="flex:1" data-action="open-job" data-id="${j.id}">再想想</button>
      <button class="btn btn-danger btn-sm" style="flex:1" data-action="decline-job" data-id="${j.id}">確定拒接</button></div>`);
}

/* ============ Tab 2 我的班表 ============ */
function renderShift() {
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });
  const jobsOf = d => DB.jobs.filter(j => (j.status === 'accepted' || j.status === 'active') &&
    resolveDate(j.slot.date).toDateString() === d.toDateString());
  const sel = days[APP.shiftDay];
  const strip = days.map((d, i) => `<button class="day-pill ${i === APP.shiftDay ? 'selected' : ''}" data-action="shift-day" data-i="${i}">
      <div class="dp-dow">${'日一二三四五六'[d.getDay()]}</div><div class="dp-d">${d.getDate()}</div>
      ${jobsOf(d).length ? '<div class="dp-dot"></div>' : ''}</button>`).join('');
  const list = jobsOf(sel).map(j => {
    const amt = jobAmount(j);
    return `<div class="job-card" data-action="open-shift-job" data-id="${j.id}" role="button" tabindex="0">
      <div class="jc-top"><span class="jc-svc">${esc(j.service_name)}</span>
        ${j.status === 'active' ? '<span class="chip dark">進行中</span>' : '<span class="chip ok">已接單</span>'}</div>
      <div class="jc-meta">${j.slot.time}・${j.slot.dur}・${esc(j.pet.name)}・📍 ${esc(j.owner_area)}</div>
      <div class="jc-pay"><span class="price">${fmtMoney(payout(amt))}</span><span class="muted">（75% 分潤）</span></div></div>`;
  }).join('');
  return `${apphead('班表與任務')}
    <h1 class="pagetitle">我的班表</h1>
    <p class="pagesub">點日期看當天任務；服務前 30 分鐘會發放門禁一次性密碼。</p>
    <div class="week-strip">${strip}</div>
    <div class="sec-label">✦ ${fmtDate(sel)} 的任務</div>
    ${list || '<div class="card muted">這天沒有排定的服務。</div>'}
    ${appfoot()}`;
}
function openShiftJob(id) {
  const j = jobById(id);
  const otpBox = j.status === 'active'
    ? `<div class="otp-box" style="margin-top:10px"><div class="muted" style="color:var(--paper);opacity:.8">🔐 門禁一次性密碼（限時，逾時自動失效）</div>
        <div class="otp">${esc(j.otp)}</div><div class="otp-cd" id="otp-cd">有效 30:00</div></div>`
    : `<div class="card" style="margin-top:10px"><b>🔐 門禁密碼</b><div class="muted" style="margin-top:4px">服務前 30 分鐘由系統發放限時一次性密碼；傳統鑰匙請至平台密碼鎖領取（監視器可視範圍）。</div></div>`;
  openSheet(`<h3>${esc(j.service_name)}</h3>
    <div class="muted">${fmtDate(resolveDate(j.slot.date))} ${j.slot.time}・${j.slot.dur}${j.owner_name ? '・飼主 ' + esc(j.owner_name) : ''}</div>
    <div class="card" style="margin-top:10px">
      <div class="quote-line"><span class="q-label">毛孩</span><span>${esc(j.pet.name)}（${esc(j.pet.breed)}）</span></div>
      <div class="quote-line"><span class="q-label">地雷提醒</span><span style="max-width:60%;text-align:right">${esc(j.pet.taboos || '—')}</span></div>
      <div class="quote-line"><span class="q-label">餵食/照護</span><span style="max-width:60%;text-align:right">${esc(j.pet.feeding || '依檔案')}</span></div>
      <div class="quote-line"><span class="q-label">進出方式</span><span>${esc(j.pet.entry)}</span></div>
      <div class="quote-line"><span class="q-label">地點</span><span>${esc(j.owner_area)}</span></div></div>
    ${otpBox}
    <div style="display:flex;gap:10px;margin-top:14px">
      <button class="btn btn-ghost btn-sm" style="flex:1" data-action="navigate-fake">🧭 導航前往</button>
      ${j.status === 'active' ? '<button class="btn btn-primary btn-sm" style="flex:2" data-action="goto-jobtab">前往服務中頁面 →</button>' : ''}</div>`);
  if (j.status === 'active') startOtpCountdown();
}
function startOtpCountdown() {
  let sec = 30 * 60;
  clearInterval(startOtpCountdown._t);
  startOtpCountdown._t = setInterval(() => {
    const el = document.getElementById('otp-cd');
    if (!el) { clearInterval(startOtpCountdown._t); return; }
    sec--;
    el.textContent = `有效 ${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  }, 1000);
}

/* ============ Tab 3 服務中 ============ */
function renderJob() {
  const j = DB.jobs.find(x => x.status === 'active');
  if (!j) {
    return `${apphead('服務執行')}
      <h1 class="pagetitle">服務中</h1>
      <div class="card" style="text-align:center;padding:30px 16px">
        <img src="assets/species/cat.png" alt="" style="width:70px;opacity:.8">
        <div style="font-weight:900;margin-top:8px">目前沒有進行中的服務</div>
        <div class="muted" style="margin-top:4px">接單後，到府時從這裡進場打卡開始服務。</div></div>${appfoot()}`;
  }
  const done = j.checklist.filter(c => c.done).length;
  const allDone = done === j.checklist.length;
  const amt = jobAmount(j);
  return `${apphead('服務執行')}
    <h1 class="pagetitle">服務中・${esc(j.pet.name)}</h1>
    <p class="pagesub">${esc(j.service_name)}・${j.slot.time} 開始・GPS 已於 ${esc(j.checkin_ts)} 進場打卡</p>
    <div class="card notice-card"><b>📸 數位軌跡進行中</b>
      <div class="muted" style="margin-top:4px">逐項拍照上傳＋GPS 定位，飼主端即時同步。檢核表不可跳項——這是雙方的保障。</div></div>
    <div class="sec-label">✦ 檢核表 ${done}/${j.checklist.length}</div>
    <div class="card"><ul class="checklist">
      ${j.checklist.map((c, i) => `<li class="${c.done ? 'done' : ''}">
        <span class="ck">${c.done ? '✓' : i + 1}</span>
        <span><span class="ck-name">${esc(c.item)}</span><div class="ck-ts">${c.done ? c.ts + ' 完成' : '待完成'}</div></span>
        ${c.done ? '<span class="ck-photo">📷 已上傳</span>'
          : (j.checklist.findIndex(x => !x.done) === i ? `<button class="btn btn-soft btn-sm" style="margin-left:auto" data-action="check-item">📷 拍照打卡</button>` : '')}
      </li>`).join('')}</ul></div>
    ${allDone ? `<div class="sec-label">✦ 照顧手記（同步到飼主的照顧日誌）</div>
      <div class="card"><textarea id="job-notes" style="width:100%;min-height:96px;font-family:var(--sans);font-size:.95rem;border:1px solid var(--hairline);border-radius:12px;padding:12px" placeholder="例：金豆今天放電成功！公園來回 2.8 公里…">${esc(j.notes)}</textarea>
      <button class="btn btn-primary" style="margin-top:12px" data-action="finish-job">完成服務・退場打卡（入帳 ${fmtMoney(payout(amt))}）</button></div>` : ''}
    <div style="margin-top:16px"><button class="emg-btn" data-action="emg-open">🆘 緊急送醫・一鍵啟動</button></div>
    ${appfoot()}`;
}
function checkItem() {
  const j = DB.jobs.find(x => x.status === 'active');
  const next = j.checklist.find(c => !c.done);
  if (!next) return;
  next.done = true; next.photo = true;
  next.ts = new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' });
  saveState(); render();
  toast(`已完成：${next.item}（照片已上傳，飼主端同步顯示）`);
}
function finishJob() {
  const j = DB.jobs.find(x => x.status === 'active');
  j.notes = document.getElementById('job-notes')?.value || '';
  j.status = 'done'; j.done_date = 'TODAY';
  saveState(); go('income');
  toast(`服務完成！${fmtMoney(payout(jobAmount(j)))} 已入帳（週結撥款）`);
}
function openEmergency() {
  openSheet(`<h3 style="color:var(--no)">🆘 緊急送醫流程</h3>
    <ul class="checklist">
      <li class="done"><span class="ck">1</span><span><span class="ck-name">一鍵啟動</span><div class="ck-ts">系統同步通知飼主＋緊急聯絡人</div></span></li>
      <li class="done"><span class="ck">2</span><span><span class="ck-name">24 小時合作醫院・綠色通道</span><div class="ck-ts">最近院所：大安 毛安動物醫院（1.1 km）</div></span></li>
      <li class="done"><span class="ck">3</span><span><span class="ck-name">醫療費平台代墊</span><div class="ck-ts">你不需先掏錢；單據拍照上傳即可</div></span></li>
    </ul>
    <p class="muted">安撫我們擅長，診斷交給醫生——請勿自行給藥或處置。</p>
    <button class="btn btn-danger" style="width:100%;margin-top:8px" data-action="emg-call">📞 啟動緊急流程（原型示意）</button>
    <button class="btn btn-ghost" style="width:100%;margin-top:10px" data-action="close-sheet">關閉</button>`);
}

/* ============ Tab 4 收入 ============ */
function renderIncome() {
  const dones = DB.jobs.filter(j => j.status === 'done');
  const rows = dones.map(j => ({ j, amt: jobAmount(j) }));
  const totalAmt = rows.reduce((s, r) => s + r.amt, 0);
  const totalPay = rows.reduce((s, r) => s + payout(r.amt), 0);
  const list = rows.map(({ j, amt }) => `<div class="card">
      <div class="oc-top" style="display:flex;gap:8px;align-items:center"><b>${esc(j.service_name)}</b>
        <span style="margin-left:auto" class="muted">${fmtDate(resolveDate(j.done_date))}</span></div>
      <div class="quote-line" style="padding-top:8px"><span class="q-label">訂單額</span><span>${fmtMoney(amt)}</span></div>
      <div class="quote-line"><span class="q-label">平台服務費 25%</span><span class="plus">−${fmtMoney(platformFee(amt))}</span></div>
      <div class="quote-line total" style="font-size:.95rem"><span>實拿</span><span class="price">${fmtMoney(payout(amt))}</span></div></div>`).join('');
  return `${apphead('透明分潤')}
    <h1 class="pagetitle">收入</h1>
    <p class="pagesub">每一單都看得到拆帳——平台 25%／你 75%，含所有動態加價。</p>
    <div class="income-hero">
      <div style="font-size:.78rem;opacity:.8">本月實拿（${dones.length} 單）</div>
      <div class="ih-num">${fmtMoney(totalPay)}</div>
      <div class="split-bar"><i class="mine"></i><i class="fee"></i></div>
      <div class="split-legend"><span>你的 75%：${fmtMoney(totalPay)}</span><span>平台 25%：${fmtMoney(totalAmt - totalPay)}</span></div>
      <div style="margin-top:12px;display:flex;gap:10px;align-items:center">
        <button class="btn btn-soft btn-sm" data-action="withdraw">提領・${esc(DB.me.payout_account)}</button></div></div>
    <div class="card" style="margin-top:12px"><b>🧾 課稅說明</b>
      <div class="muted" style="margin-top:4px">分潤屬「勞務報酬」，由平台開立扣繳憑單；承攬關係、非僱傭。提領週期為原型假設值（待組內拍板）。</div></div>
    <div class="sec-label">✦ 本月逐單明細</div>
    ${list || '<div class="card muted">本月尚無完成訂單。</div>'}
    ${appfoot()}`;
}

/* ============ Tab 5 我的 ============ */
function renderMe() {
  const m = DB.me;
  return `${apphead('保母中心')}
    <h1 class="pagetitle">我的</h1>
    <div class="member-card">
      <div style="display:flex;gap:14px;align-items:center">
        <div class="avatar" style="width:56px;height:56px;font-size:1.4rem">${esc(m.name[0])}</div>
        <div><div class="mc-tier">${esc(m.name)} <span style="font-size:.8rem;opacity:.8">${esc(m.cert_no)}</span></div>
          <div style="font-size:.8rem;opacity:.85;margin-top:2px"><span class="star">${starsTxt(m.rating)}</span> ${m.rating}・${m.orders_count} 次服務・年資 ${m.years} 年</div></div></div>
      <div style="margin-top:12px">
        ${m.gold ? '<span class="chip">🏅 金牌保母 4.8★↑</span> ' : ''}
        <span class="chip">✂️ 美容經驗</span>
        <span class="chip ${m.medical_certified ? 'ok' : 'no'}">${m.medical_certified ? '💉 醫療級' : '💉 醫療級未認證'}</span></div></div>
    <div class="sec-label">✦ 三道審查（全數通過才上架）</div>
    <div class="card"><ul class="cert-steps">
      ${m.review_steps.map(s => `<li><span class="ck" style="width:26px;height:26px;border-radius:50%;background:var(--ok);border:none;color:#fff;display:flex;align-items:center;justify-content:center;flex:none">✓</span>
        <span><b style="font-size:.9rem">${esc(s.step)}</b><div class="muted">${esc(s.ts)} 通過</div></span></li>`).join('')}
    </ul></div>
    <div class="sec-label">✦ 服務與設定</div>
    <div class="card" style="padding:4px 16px">
      <button class="list-row" data-action="goto-training"><span class="lr-ico">🎓</span>教育訓練・醫療級認證培訓<span class="lr-arrow">›</span></button>
      <button class="list-row" data-action="open-msg"><span class="lr-ico">💬</span>站內訊息（飼主聯繫）<span class="lr-arrow">›</span></button>
      <button class="list-row" data-action="open-rights"><span class="lr-ico">📄</span>承攬權益與服務條款<span class="lr-arrow">›</span></button>
      <button class="list-row" data-action="reset-demo"><span class="lr-ico">♻️</span>重設示範資料（原型）<span class="lr-arrow">›</span></button>
    </div>${appfoot()}`;
}
function openTraining() {
  openSheet(`<h3>🎓 醫療級認證培訓</h3>
    <p class="muted" style="margin:8px 0">完成培訓＋考核後可承接「皮下輸液」等醫療加值訂單（每次 +$150–250 分潤基礎）。</p>
    <ul class="checklist">
      <li class="done"><span class="ck">✓</span><span><span class="ck-name">線上課程：基礎照護與投藥</span><div class="ck-ts">已完成</div></span></li>
      <li><span class="ck">2</span><span><span class="ck-name">實作課程：皮下輸液操作（獸醫指導）</span><div class="ck-ts">可預約：每週六</div></span></li>
      <li><span class="ck">3</span><span><span class="ck-name">考核與授證</span><div class="ck-ts">通過後標示「醫療級」徽章</div></span></li>
    </ul>
    <p class="muted">合規紅線：輸液僅限醫療級保母＋獸醫書面指示，平台不診斷。</p>
    <button class="btn btn-primary" style="width:100%;margin-top:8px" data-action="training-book">預約實作課程（原型示意）</button>`);
}
function openMessages(warn) {
  openSheet(`<h3>💬 站內訊息・布丁的飼主</h3>
    <div class="msg-thread">
      ${DB.messages.map(m => `<div class="msg ${m.from === 'mine' ? 'mine' : 'owner'}">${esc(m.text)}</div>`).join('')}
      ${warn ? `<div class="msg-warn"><b>⚠ 偵測到敏感詞，訊息未送出。</b><br>為保障雙方（保險、送醫代墊、服務存證、回饋），請勿交換 LINE／電話或私下交易；再次觸發將提報審核，嚴重者停權。</div>` : ''}
    </div>
    <div class="msg-input">
      <input type="text" id="msg-in" placeholder="輸入訊息…（試試輸入「加LINE」）" maxlength="120">
      <button class="btn btn-primary btn-sm" data-action="msg-send">送出</button></div>
    <p class="muted" style="margin-top:10px">對話全程存證，作為服務糾紛與理賠的數位軌跡。</p>`);
  const inp = document.getElementById('msg-in');
  inp?.addEventListener('keydown', e => { if (e.key === 'Enter') document.querySelector('[data-action="msg-send"]').click(); });
}
function sendMsg() {
  const inp = document.getElementById('msg-in');
  const text = (inp?.value || '').trim();
  if (!text) return;
  if (SENSITIVE_WORDS.some(w => text.includes(w))) { openMessages(true); return; }
  DB.messages.push({ from: 'mine', text });
  saveState(); openMessages(false);
}
function openRights() {
  openSheet(`<h3>承攬權益重點（原型摘錄）</h3>
    <div class="card" style="margin-top:10px"><b>你的自由</b><p class="muted" style="margin-top:4px">完全自由上下線、可拒單；平台不得有任何強制接單懲罰。拒接不影響評分與媒合順位。</p></div>
    <div class="card" style="margin-top:10px"><b>拆帳與稅務</b><p class="muted" style="margin-top:4px">平台 25%／保母 75%，動態加價（連假／夜間／跨區）全額計入分潤基礎。分潤屬課稅勞務報酬，平台開立扣繳憑單。</p></div>
    <div class="card" style="margin-top:10px"><b>你的義務</b><p class="muted" style="margin-top:4px">服務數位軌跡（GPS 打卡＋逐項拍照）為強制項；散步用平台配發防掙脫雙扣胸背帶、一人至多 2 隻；訂單外事項一律禁止；故意過失自負（承攬關係）。</p></div>
    <div class="card" style="margin-top:10px"><b>私下交易防制</b><p class="muted" style="margin-top:4px">站內對話有敏感詞偵測；私下交易將失去保險、送醫代墊、存證與回饋保障，嚴重者停權。</p></div>`);
}

/* ============ 事件委派 ============ */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  switch (el.dataset.action) {
    case 'close-sheet': closeSheet(); break;
    case 'toggle-online': DB.online = !DB.online; saveState(); render();
      toast(DB.online ? '已上線，開始接收 3 公里內訂單推播' : '已下線——上下線完全自由，不影響任何權益'); break;
    case 'open-job': openJobSheet(el.dataset.id); break;
    case 'accept-job': {
      const j = jobById(el.dataset.id);
      j.status = 'accepted'; saveState(); closeSheet(); render();
      toast(`已接單 ${j.id}！已加入你的班表，服務前 30 分鐘發放門禁密碼`); break;
    }
    case 'decline-ask': declineAsk(el.dataset.id); break;
    case 'decline-job': {
      const j = jobById(el.dataset.id);
      j.status = 'declined'; DB.declineCount++; saveState(); closeSheet(); render();
      toast('已拒接。不影響評分、無任何懲罰，訂單已轉給其他保母'); break;
    }
    case 'shift-day': APP.shiftDay = Number(el.dataset.i); render(); break;
    case 'open-shift-job': openShiftJob(el.dataset.id); break;
    case 'goto-jobtab': go('job'); break;
    case 'navigate-fake': toast('已開啟導航（原型示意；正式版串接地圖 App）'); break;
    case 'check-item': checkItem(); break;
    case 'finish-job': finishJob(); break;
    case 'emg-open': openEmergency(); break;
    case 'emg-call': closeSheet(); toast('已啟動緊急流程：通知飼主與緊急聯絡人、醫院綠色通道待命（原型示意）'); break;
    case 'withdraw': toast('提領申請已送出，依週結排程撥款至 ' + DB.me.payout_account + '(原型示意)'); break;
    case 'goto-training': closeSheet(); openTraining(); break;
    case 'training-book': closeSheet(); toast('已預約週六實作課程，通過考核即解鎖醫療級訂單（原型示意）'); break;
    case 'open-msg': openMessages(false); break;
    case 'msg-send': sendMsg(); break;
    case 'open-rights': openRights(); break;
    case 'reset-demo': resetState(); break;
  }
});

/* ============ 啟動 ============ */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
go('hall');
