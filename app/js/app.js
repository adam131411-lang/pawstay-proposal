/* ============ 爪爪日常 飼主端 App — 主程式 ============ */
'use strict';

const $view = document.getElementById('view');
const $tabbar = document.getElementById('tabbar');
const $sheetRoot = document.getElementById('sheet-root');
const $toastRoot = document.getElementById('toast-root');

const APP = { tab: 'home', careLogId: null };

/* ---- 預約流程狀態 ---- */
let BK = null;
function newBK(service) {
  return { step: service ? 1 : 0, service: service || null, petIds: [], date: '', time: '',
           hours: 1, addons: [], distanceKm: 1, sitterId: null, couponCount: 0 };
}

/* ---- 寵物表單狀態 ---- */
let PF = null;
function newPF() { return { step: 0, d: { health: [], tags: [], diet: [], special: [], cleaning: [] } }; }

/* ============ 小工具 ============ */
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  $toastRoot.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
function openSheet(html) {
  $sheetRoot.innerHTML = `<div class="sheet-mask" data-action="close-sheet"></div>
    <div class="sheet" role="dialog" aria-modal="true"><div class="grip"></div>${html}</div>`;
}
function closeSheet() { $sheetRoot.innerHTML = ''; }
function petById(id) { return DB.pets.find(p => p.id === id); }
function sitterById(id) { return DB.sitters.find(s => s.id === id); }
function speciesImg(sp) { return `assets/species/${sp === 'dog' ? 'dog' : sp === 'cat' ? 'cat' : 'exotic'}.png`; }
function speciesName(sp) { return sp === 'dog' ? '狗' : sp === 'cat' ? '貓' : '異寵'; }
function isHighRisk(p) { return p.species === 'dog' && p.dog && p.dog.aggression_record && p.dog.aggression_record !== 'none'; }
function starsTxt(r) { return '★'.repeat(Math.round(r)); }
function statusChip(st) {
  return { pending: '<span class="chip">媒合中</span>', matched: '<span class="chip ok">已媒合</span>',
           in_service: '<span class="chip dark">服務中</span>', done: '<span class="chip">已完成</span>',
           cancelled: '<span class="chip no">已取消</span>' }[st] || '';
}
function setCTA(html) {
  document.querySelectorAll('.cta-bar').forEach(e => e.remove());
  document.body.classList.remove('has-cta');
  if (!html) return;
  const bar = document.createElement('div');
  bar.className = 'cta-bar'; bar.innerHTML = html;
  document.getElementById('phone').appendChild(bar);
  document.body.classList.add('has-cta');
}

/* ============ 導航 ============ */
function go(tab) {
  APP.tab = tab;
  document.querySelectorAll('#tabbar .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  closeSheet(); setCTA(null);
  render();
  $view.scrollTop = 0; window.scrollTo(0, 0);
}
$tabbar.addEventListener('click', e => {
  const b = e.target.closest('.tab'); if (b) go(b.dataset.tab);
});

function render() {
  clearInterval(render._timer);
  const fn = { home: renderHome, book: renderBook, care: renderCare, pets: renderPets, me: renderMe }[APP.tab];
  $view.innerHTML = `<div class="screen">${fn()}</div>`;
  if (APP.tab === 'care') startLiveClock();
  updateCareBadge();
}
function updateCareBadge() {
  const live = DB.bookings.some(b => b.status === 'in_service');
  const careTab = document.querySelector('.tab[data-tab=care]');
  careTab.querySelector('.badge-dot')?.remove();
  if (live) { const d = document.createElement('i'); d.className = 'badge-dot'; careTab.appendChild(d); }
}

function apphead(sub) {
  return `<div class="apphead"><img src="assets/logo/logo.png" alt="爪爪日常">
    <div><div class="brand">爪爪日常</div><div class="sub">${sub || 'Pawfect Life'}</div></div>
    <div class="spacer"></div><span class="chip">台北市・新北市</span></div>`;
}
function appfoot() {
  return `<footer class="appfoot"><div class="foot-slogan">✦ 牠不是寵物，是家人。</div>
    出門的時候，把家交給我們。<br>爪爪日常 Pawfect Life・不出門的五星級照顧</footer>`;
}

/* ============ Tab 1 首頁 ============ */
function renderHome() {
  const live = DB.bookings.find(b => b.status === 'in_service');
  const liveCard = live ? (() => {
    const s = sitterById(live.sitter_id), pet = petById(live.pet_ids[0]);
    const done = live.checklist.filter(c => c.done).length;
    return `<div class="hero-status" data-action="goto-care" role="button" tabindex="0">
      <img class="hs-img" src="${live.live_url}" alt="即時照護畫面">
      <div class="hs-body">
        <span class="live-badge">LIVE</span>
        <div style="margin-top:10px;font-weight:900;font-size:1.05rem">${esc(pet.name)} 正在被好好照顧中</div>
        <div style="font-size:.8rem;opacity:.85;margin-top:4px">${esc(live.service_name)}・保母 ${esc(s.name)}（${s.cert_no}）・檢核 ${done}/${live.checklist.length}</div>
        <div style="margin-top:10px"><span class="chip dark">👁 點我看 Live 與 GPS 軌跡 →</span></div>
      </div></div>`;
  })() : `<div class="card" style="display:flex;gap:14px;align-items:center">
      <img src="assets/species/cat.png" alt="" style="width:64px">
      <div><div style="font-weight:900">今天沒有進行中的照護</div>
      <div class="muted">你不在家的日子，牠依然被好好愛著。</div>
      <button class="btn btn-soft btn-sm" style="margin-top:8px" data-action="start-book">預約到府照護</button></div></div>`;

  const svcCards = [
    ['cat_care', SERVICES.cat_care], ['dog_walk', SERVICES.dog_walk],
    ['pack7', SERVICES.pack7], ['exotic', SERVICES.exotic]
  ].map(([k, s]) => `<button class="svc-card" data-action="pick-service" data-svc="${k}">
      <img src="${s.img}" alt=""><div class="sc-body"><div class="sc-name">${s.name}</div>
      <div class="sc-price">${s.tagline}</div></div></button>`).join('');

  return `${apphead('不出門的五星級照顧')}
    <h1 class="pagetitle">牠不是寵物，<br>是家人。</h1>
    <p class="pagesub">到府照護媒合・3 公里內合格保母・全程透明回報</p>
    ${liveCard}
    <div class="sec-label">✦ 選擇服務</div>
    <div class="svc-grid">${svcCards}</div>
    <div class="sec-label">✦ 安心，看得見</div>
    <div class="trust-band">
      <div><div class="tb-num">三道審查</div><div class="tb-cap">實名良民證・專業資格・實作考核</div></div>
      <div><div class="tb-num">$50 萬</div><div class="tb-cap">安心賠付每案最高額度</div></div>
      <div><div class="tb-num">GPS 打卡</div><div class="tb-cap">進退場定位＋逐項拍照上傳</div></div>
      <div><div class="tb-num">7 日</div><div class="tb-cap">理賠決定・退款作業時限</div></div>
    </div>
    <div class="sec-label">✦ 公告</div>
    <div class="card notice-card">
      <div style="font-weight:900">📢 中秋連假動態加價預告</div>
      <div class="muted" style="margin-top:6px">9/25（五）–9/28（一）連假期間服務費 ×1.5，依承諾<b>提前 14 天公告</b>。絕不臨時漲價、絕不拒收。年費會員免動態加價並可提前 30 天預約。</div>
    </div>
    <div class="card" style="margin-top:12px">
      <div style="font-weight:900">誠信看得見，消費好安心</div>
      <div class="muted" style="margin-top:4px">公開透明的統一牌價，是我們預防誤會的最佳承諾。<b style="color:var(--wood-deep)" data-action="open-pricing-sheet" role="button" tabindex="0">點我看細節 →</b></div>
    </div>
    ${appfoot()}`;
}

/* ============ Tab 2 預約流程 ============ */
function renderBook() {
  if (!BK) BK = newBK();
  const stepsBar = `<div class="steps">${[1,2,3,4,5,6].map(i => `<i class="${BK.step >= i ? 'done' : ''}"></i>`).join('')}</div>`;
  const head = `${apphead('預約到府照護')}${BK.step > 0 ? `<button class="back-link" data-action="bk-back">← 上一步</button>` : ''}`;
  let body = '';
  switch (BK.step) {
    case 0: body = bkStepService(); break;
    case 1: body = bkStepPets(); break;
    case 2: body = bkStepTime(); break;
    case 3: body = bkStepAddons(); break;
    case 4: body = bkStepSitter(); break;
    case 5: body = bkStepQuote(); break;
    case 6: body = bkStepPay(); break;
    case 7: body = bkStepDone(); break;
  }
  return head + (BK.step > 0 && BK.step < 7 ? stepsBar : '') + body;
}

function bkStepService() {
  const opts = [
    ['cat_care', '喵皇居家無憂照護', '$400／次（30 分）・多貓 +$100/隻'],
    ['dog_walk', '汪汪活力放電散步', '$600–800／時依體型・第二隻 +$200/時'],
    ['pack7_cat', '七日套票（貓）', '$2,520（原 $2,800・9 折）一日一訪'],
    ['pack7_dog', '七日套票（狗）', '$5,670 起（小型犬）一日兩訪 40 分'],
    ['exotic', '異寵照護', '兔・鼠・鳥・爬蟲等，專屬詢價']
  ].map(([k, n, d]) => `<button class="opt" style="text-align:left;padding:14px 16px" data-action="bk-service" data-svc="${k}">
      <b>${n}</b><span class="opt-sub">${d}</span></button>`).join('');
  return `<h1 class="pagetitle">要為毛孩安排哪種照顧？</h1>
    <p class="pagesub">統一公開牌價，不是保母自訂——誠信看得見。</p>
    <div style="display:grid;gap:10px">${opts}</div>`;
}

function bkNeedSpecies() {
  return { cat_care: 'cat', pack7_cat: 'cat', dog_walk: 'dog', pack7_dog: 'dog' }[BK.service];
}
function bkStepPets() {
  const need = bkNeedSpecies();
  const list = DB.pets.filter(p => p.species === need);
  const maxSel = BK.service === 'dog_walk' ? 2 : 99;
  const cards = list.map(p => `
    <div class="pet-card ${BK.petIds.includes(p.id) ? 'selected' : ''}" data-action="bk-pet" data-id="${p.id}" role="button" tabindex="0">
      ${isHighRisk(p) ? '<span class="risk">高風險</span>' : ''}
      <img src="${speciesImg(p.species)}" alt=""><div class="pc-name">${esc(p.name)}</div>
      <div class="pc-meta">${esc(p.breed)}${p.size_tier ? '・' + SIZE_LABEL[p.size_tier].split(' ')[0] : ''}</div>
    </div>`).join('');
  const riskSel = BK.petIds.map(petById).filter(isHighRisk);
  const riskNote = riskSel.length ? `<div class="card" style="border-color:var(--no);margin-top:12px">
      <b style="color:var(--no)">⚠ 已標示高風險犬隻（曾有攻擊紀錄）</b>
      <div class="muted" style="margin-top:4px">保母得拒接、平台不強制媒合；我們不因危險性加價，安全優先於營收（§惡犬拒接原則）。媒合等待可能較久。</div></div>` : '';
  const dogPackNote = BK.service === 'pack7_dog' ? `<div class="muted" style="margin-top:10px">※ 七日套票（狗）$5,670 為小型犬；中大型以上依級距另計（原型以小型犬示範）。</div>` : '';
  return `<h1 class="pagetitle">這次照顧誰？</h1>
    <p class="pagesub">選擇要照顧的${speciesName(need)}${BK.service === 'dog_walk' ? '（散步一位保母至多 2 隻）' : '（可複選）'}</p>
    ${list.length ? `<div class="pet-pick">${cards}</div>` : `<div class="card">還沒有${speciesName(need)}的檔案。</div>`}
    ${riskNote}${dogPackNote}
    <button class="btn btn-ghost btn-sm" style="margin-top:16px" data-action="goto-pets-new">＋ 開始建立寵物檔案</button>
    <div style="margin-top:20px"><button class="btn btn-primary" data-action="bk-next" ${BK.petIds.length ? '' : 'disabled'}>下一步：選日期時段</button></div>
    <p class="muted" style="margin-top:8px">${BK.service === 'dog_walk' && BK.petIds.length >= maxSel ? '已達 2 隻上限（散步 SOP：一人至多 2 隻）。' : ''}</p>`;
}

function bkStepTime() {
  const today = new Date(); today.setDate(today.getDate() + 1);
  const min = today.toISOString().slice(0, 10);
  const slots = ['07:30', '10:00', '13:00', '15:30', '18:00', '20:30', '22:30'];
  const holiday = isHolidayDate(BK.date);
  const night = BK.time && isNightTime(BK.time);
  const isDog = BK.service === 'dog_walk';
  return `<h1 class="pagetitle">什麼時候到府？</h1>
    <p class="pagesub">連假 ×1.5・夜間清晨（22:00–07:00）+$150・跨區（>3km）+$30/km</p>
    <div class="field"><label class="req">日期</label>
      <input type="date" id="bk-date" min="${min}" value="${BK.date}" data-action-change="bk-date"></div>
    ${holiday ? `<div class="card notice-card" style="margin-bottom:14px"><b>📢 你選的是國定連假時段</b><div class="muted">服務費 ×1.5（已提前 14 天公告）；取消門檻提前至 72 小時。年費會員免此加價。</div></div>` : ''}
    <div class="field"><label class="req">時段</label>
      <div class="slot-grid">${slots.map(t => `<button class="opt ${BK.time === t ? 'selected' : ''}" data-action="bk-time" data-t="${t}">${t}${(Number(t.split(':')[0]) >= 22 || Number(t.split(':')[0]) < 7) ? '<span class="opt-sub">夜間 +$150</span>' : ''}</button>`).join('')}</div></div>
    ${isDog ? `<div class="field"><label>散步時長（基本 1 小時，可半小時累加）</label>
      <div class="opt-grid cols3">${[1, 1.5, 2].map(h => `<button class="opt ${BK.hours === h ? 'selected' : ''}" data-action="bk-hours" data-h="${h}">${h} 小時</button>`).join('')}</div></div>` : ''}
    <div class="field"><label>距離最近合格保母（示範滑桿・實際由系統定位）</label>
      <input type="range" min="1" max="8" step="1" value="${BK.distanceKm}" data-action-change="bk-dist" style="width:100%">
      <div class="muted">約 ${BK.distanceKm} km${BK.distanceKm > 3 ? `・跨區加價 +$30 × ${Math.ceil(BK.distanceKm - 3)} km` : '（3 km 內免加價）'}</div></div>
    <button class="btn btn-primary" data-action="bk-next" ${BK.date && BK.time ? '' : 'disabled'}>下一步：加值項目</button>`;
}

function bkStepAddons() {
  const sizeTier = petById(BK.petIds[0])?.size_tier || null;
  const groups = {};
  ADDONS.forEach(a => { (groups[a.group] = groups[a.group] || []).push(a); });
  const html = Object.entries(groups).map(([g, items]) => `
    <div class="sec-label">✦ ${g}</div><div class="card" style="padding:4px 16px">
    ${items.map(a => {
      const sel = BK.addons.includes(a.id);
      const p = addonPrice(a.id, sizeTier);
      return `<div class="addon-row ${sel ? 'selected' : ''}" data-action="bk-addon" data-id="${a.id}" role="button" tabindex="0">
        <span class="ar-check">${sel ? '✓' : ''}</span>
        <span><span class="ar-name">${a.name}</span>${a.note ? `<div class="ar-note">${a.note}</div>` : ''}</span>
        <span class="ar-price">+$${p}</span></div>`;
    }).join('')}</div>`).join('');
  return `<h1 class="pagetitle">需要加值服務嗎？</h1>
    <p class="pagesub">安撫我們擅長，診斷交給醫生——醫療界線清楚標示。</p>
    ${html}
    <div style="margin-top:20px"><button class="btn btn-primary" data-action="bk-next">下一步：媒合保母</button></div>`;
}

function bkStepSitter() {
  const needMedical = BK.addons.includes('med_fluid');
  const needGroom = BK.addons.includes('groom_bath');
  const tier = DB.user.membership.tier;
  const goldFirst = tier === 'quarter' || tier === 'year';
  let list = DB.sitters.filter(s => (!needMedical || s.medical_certified) && (!needGroom || s.skills.some(k => k.includes('洗澡') || k.includes('美容'))));
  list = [...list].sort((a, b) => goldFirst ? (b.gold - a.gold || b.rating - a.rating) : a.dist_km - b.dist_km);
  const cards = list.map(s => `
    <div class="sitter-card ${BK.sitterId === s.id ? 'selected' : ''}" data-action="bk-sitter" data-id="${s.id}" role="button" tabindex="0">
      <div class="avatar">${esc(s.name[0])}</div>
      <div style="flex:1">
        <div style="font-weight:900">${esc(s.name)} <span class="muted">${s.cert_no}</span>
          ${s.gold ? '<span class="chip" style="font-size:.62rem;padding:2px 8px">🏅 金牌</span>' : ''}
          ${s.medical_certified ? '<span class="chip ok" style="font-size:.62rem;padding:2px 8px">醫療級</span>' : ''}</div>
        <div class="muted" style="margin-top:2px"><span class="star">${starsTxt(s.rating)}</span> ${s.rating}・${s.orders_count} 次服務・${s.dist_km} km</div>
        <div class="muted" style="margin-top:2px">${s.skills.map(k => `<span class="chip" style="font-size:.62rem;padding:2px 8px;margin-right:4px">${k}</span>`).join('')}</div>
      </div></div>`).join('');
  return `<h1 class="pagetitle">3 公里內的合格保母</h1>
    <p class="pagesub">自己家的毛孩，敢不敢交給這個人——三道審查全數通過才上架。</p>
    ${goldFirst ? '<div class="chip ok" style="margin-bottom:12px">會員權益：金牌保母（4.8★↑）優先媒合・等待時間 -50%</div>' : ''}
    ${needMedical ? '<div class="chip no" style="margin-bottom:12px">已選皮下輸液：僅顯示醫療級保母（需獸醫書面指示）</div>' : ''}
    ${list.length ? cards : '<div class="card">條件內暫無保母，請調整加值項目。</div>'}
    <p class="muted" style="margin-top:10px">保母為承攬制、可自由拒單；媒合等待時間 SLA 待定（原型示意）。點選保母可看個人介紹。</p>
    <div style="margin-top:16px"><button class="btn btn-primary" data-action="bk-next" ${BK.sitterId ? '' : 'disabled'}>下一步：金額明細</button></div>`;
}

function bkQuote() {
  return computeQuote({
    service: BK.service, pets: BK.petIds.map(petById), date: BK.date, time: BK.time,
    hours: BK.hours, addons: BK.addons, distanceKm: BK.distanceKm,
    tier: DB.user.membership.tier, couponCount: BK.couponCount
  });
}
function quoteLinesHtml(q) {
  return q.lines.map(l => `<div class="quote-line"><span class="q-label">${l.label}</span>
    <span class="${l.cls || ''}">${l.amount < 0 ? '−' : ''}${fmtMoney(Math.abs(l.amount))}</span></div>`).join('');
}
function bkStepQuote() {
  const q = bkQuote();
  const tier = DB.user.membership.tier;
  const availCp = DB.user.coupons.length;
  return `<h1 class="pagetitle">金額明細</h1>
    <p class="pagesub">疊算順序（系統自動）：會員權益 ＞ 套票折扣 ＞ 動態加價</p>
    <div class="card">${quoteLinesHtml(q)}
      <div class="quote-line total"><span>總計</span><span class="price">${fmtMoney(q.total)}</span></div></div>
    ${availCp ? `<div class="card" style="margin-top:12px"><b>折價券（可用 ${availCp} 張）</b>
      <div class="opt-grid cols3" style="margin-top:10px">${[0, 1, 2].filter(n => n <= availCp).map(n =>
        `<button class="opt ${BK.couponCount === n ? 'selected' : ''}" data-action="bk-coupon" data-n="${n}">${n === 0 ? '不使用' : `用 ${n} 張`}</button>`).join('')}</div></div>` : ''}
    ${q.rebate ? `<div class="result-box">🐾 ${PLANS[tier].name}回饋：完成服務後預計入帳 <b>${q.rebate} 爪爪幣</b>（1 幣 = 1 元）</div>` : ''}
    ${q.notes.map(n => `<p class="muted" style="margin-top:8px">※ ${n}</p>`).join('')}
    <div style="margin-top:18px"><button class="btn btn-primary" data-action="bk-next">確認，前往付款</button></div>`;
}

function bkStepPay() {
  const q = bkQuote();
  const s = sitterById(BK.sitterId);
  return `<h1 class="pagetitle">確認付款</h1>
    <p class="pagesub">信用卡預授權，服務完成後才自動扣款。</p>
    <div class="card">
      <div class="quote-line"><span class="q-label">服務</span><span>${SERVICES[BK.service.startsWith('pack7') ? 'pack7' : BK.service]?.name || ''}${BK.service === 'pack7_cat' ? '（貓）' : BK.service === 'pack7_dog' ? '（狗）' : ''}</span></div>
      <div class="quote-line"><span class="q-label">毛孩</span><span>${BK.petIds.map(id => esc(petById(id).name)).join('、')}</span></div>
      <div class="quote-line"><span class="q-label">時間</span><span>${BK.date} ${BK.time}</span></div>
      <div class="quote-line"><span class="q-label">保母</span><span>${esc(s.name)}（${s.cert_no}）</span></div>
      <div class="quote-line total"><span>預授權金額</span><span class="price">${fmtMoney(q.total)}</span></div></div>
    <div class="card" style="margin-top:12px">
      <b>💳 付款方式</b>
      <div class="addon-row selected" style="margin-top:6px"><span class="ar-check">✓</span>
        <span><span class="ar-name">信用卡 •••• 4021</span><div class="ar-note">第三方金流閘道（PCI-DSS）・平台不儲存完整卡號・完成服務後自動扣款</div></span></div></div>
    <div class="muted" style="margin-top:12px">按下確認即同意<b data-action="open-terms" role="button" tabindex="0" style="color:var(--wood-deep)">《服務條款與取消政策》</b>：一般訂單 24 小時前取消全額退；連假訂單 72 小時前。</div>
    <div style="margin-top:16px"><button class="btn btn-primary" data-action="bk-pay">確認預約並預授權 ${fmtMoney(q.total)}</button></div>`;
}

function bkStepDone() {
  const b = DB.bookings[DB.bookings.length - 1];
  return `<div class="success-burst"><div class="sb-ico">✓</div>
    <h1 class="pagetitle" style="text-align:center">預約完成！</h1>
    <p class="pagesub" style="text-align:center">已通知保母，訂單編號 ${b.id}<br>服務前會收到保母確認與到府提醒。</p></div>
    <div class="card"><b>接下來會發生什麼？</b>
      <ul class="checklist" style="margin-top:6px">
        <li><span class="ck" style="background:var(--ok);border-color:var(--ok)">✓</span><span><span class="ck-name">預授權完成</span><div class="ck-ts">服務完成後才實際扣款</div></span></li>
        <li><span class="ck">2</span><span><span class="ck-name">保母確認接單</span><div class="ck-ts">承攬制・保母自由接單</div></span></li>
        <li><span class="ck">3</span><span><span class="ck-name">服務當天全程透明回報</span><div class="ck-ts">GPS 打卡＋檢核表逐項拍照</div></span></li>
      </ul></div>
    <div style="margin-top:16px;display:grid;gap:10px">
      <button class="btn btn-primary" data-action="goto-me-orders">查看我的訂單</button>
      <button class="btn btn-ghost" data-action="bk-reset">回到預約首頁</button></div>`;
}

/* 預約流程事件邏輯 */
function bkNext() {
  if (BK.step === 3 && BK.addons.includes('med_fluid')) {
    toast('提醒：皮下輸液需上傳獸醫書面指示（原型示意）');
  }
  BK.step++; render();
}
function bkHandle(action, el) {
  switch (action) {
    case 'bk-service': {
      const svc = el.dataset.svc;
      if (svc === 'exotic') return openExoticSheet();
      BK = newBK(svc); render(); break;
    }
    case 'bk-pet': {
      const id = el.dataset.id;
      const i = BK.petIds.indexOf(id);
      if (i >= 0) BK.petIds.splice(i, 1);
      else {
        if (BK.service === 'dog_walk' && BK.petIds.length >= 2) { toast('散步 SOP：一位保母至多 2 隻'); return; }
        BK.petIds.push(id);
        const p = petById(id);
        if (isHighRisk(p)) toast('此犬隻具攻擊紀錄，已標示高風險：保母得拒接、平台不強制媒合');
      }
      render(); break;
    }
    case 'bk-time': BK.time = el.dataset.t; render(); break;
    case 'bk-hours': BK.hours = Number(el.dataset.h); render(); break;
    case 'bk-addon': {
      const a = ADDONS.find(x => x.id === el.dataset.id);
      const i = BK.addons.indexOf(a.id);
      if (i >= 0) BK.addons.splice(i, 1);
      else {
        BK.addons.push(a.id);
        if (a.limit === 'medical') toast('皮下輸液：限醫療級保母＋獸醫書面指示，平台不診斷');
        if (a.limit === 'groom') toast('洗澡吹乾：僅媒合具美容經驗的保母');
      }
      render(); break;
    }
    case 'bk-sitter': {
      const s = sitterById(el.dataset.id);
      if (BK.sitterId === s.id) { openSitterSheet(s); }
      else { BK.sitterId = s.id; render(); }
      break;
    }
    case 'bk-coupon': BK.couponCount = Number(el.dataset.n); render(); break;
    case 'bk-next': bkNext(); break;
    case 'bk-back': BK.step = Math.max(0, BK.step - 1); render(); break;
    case 'bk-pay': doPay(); break;
    case 'bk-reset': BK = newBK(); render(); break;
  }
}
function doPay() {
  const q = bkQuote();
  const id = 'B-' + (1000 + DB.bookings.length + Math.floor(Math.random() * 900));
  DB.bookings.push({
    id, service: BK.service,
    service_name: BK.service === 'cat_care' ? '喵皇居家無憂照護' : BK.service === 'dog_walk' ? '汪汪活力放電散步' :
      BK.service === 'pack7_cat' ? '七日套票（貓）' : '七日套票（狗）',
    pet_ids: [...BK.petIds], sitter_id: BK.sitterId,
    slots: [{ date: BK.date, time: BK.time, hours: BK.hours }],
    addons: BK.addons.map(aid => ({ id: aid, name: ADDONS.find(a => a.id === aid).name, price: addonPrice(aid, petById(BK.petIds[0])?.size_tier) })),
    pricing: { base: q.service, size_adj: 0, multi_pet: 0, addons: q.addonsSum, surge: q.surge, member_discount: 0, total: q.total },
    status: 'matched', is_holiday: isHolidayDate(BK.date),
    is_package: BK.service.startsWith('pack7'),
    pkg: BK.service === 'pack7_cat' ? { price: 2520, perVisit: 400, totalSessions: 7, usedSessions: 0 }
       : BK.service === 'pack7_dog' ? { price: 5670, perVisit: 450, totalSessions: 14, usedSessions: 0 } : null
  });
  if (BK.couponCount) DB.user.coupons.splice(0, BK.couponCount);
  saveState();
  BK.step = 7; render();
  toast('預授權成功！服務完成後才會實際扣款');
}
function openExoticSheet() {
  openSheet(`<h3>異寵照護・專屬詢價</h3>
    <img src="assets/svc/svc-exotic.jpg" alt="" style="width:100%;border-radius:12px">
    <p class="muted" style="margin:12px 0">兔、鼠、鳥、爬蟲等異寵照護需依物種評估，由專責保母一對一報價。留下毛孩資訊，客服 24 小時內回覆。</p>
    <button class="btn btn-primary" data-action="exotic-ask">送出詢價（原型示意）</button>`);
}
function openSitterSheet(s) {
  openSheet(`<h3>${esc(s.name)} <span class="muted" style="font-size:.85rem">${s.cert_no}</span></h3>
    <div class="muted"><span class="star">${starsTxt(s.rating)}</span> ${s.rating}・服務 ${s.orders_count} 次・年資 ${s.years} 年・距離 ${s.dist_km} km</div>
    <div style="margin:10px 0">${s.gold ? '<span class="chip">🏅 金牌保母 4.8★↑</span> ' : ''}${s.medical_certified ? '<span class="chip ok">醫療級認證</span>' : ''}</div>
    <p style="font-size:.9rem;line-height:1.7">${esc(s.intro)}</p>
    <div class="hr"></div>
    <p class="muted">✓ 實名認證＋良民證　✓ 專業資格審查　✓ 模擬照護實作考核<br>✓ 服務數位軌跡：進門/餵食/清理/鎖門逐項拍照＋GPS 打卡</p>
    <button class="btn btn-primary" style="margin-top:10px" data-action="close-sheet">選擇這位保母</button>`);
}

/* ============ Tab 3 照護中 ============ */
function renderCare() {
  const live = DB.bookings.find(b => b.status === 'in_service');
  const logs = DB.bookings.filter(b => b.status === 'done');
  let liveHtml = '';
  if (live) {
    const s = sitterById(live.sitter_id), pet = petById(live.pet_ids[0]);
    const done = live.checklist.filter(c => c.done).length;
    liveHtml = `
      <div class="live-wrap">
        <img src="${live.live_url}" alt="照護即時畫面">
        <div class="live-overlay"><span class="live-badge">LIVE</span><span class="chip dark">${esc(pet.name)}・${esc(live.service_name)}</span></div>
        <span class="ts" id="live-ts">--:--:--</span>
      </div>
      <div class="card" style="margin-top:12px">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="avatar">${esc(s.name[0])}</div>
          <div><b>${esc(s.name)}</b> <span class="muted">${s.cert_no}</span>
          <div class="muted"><span class="star">${starsTxt(s.rating)}</span> ${s.rating}・GPS 已進場打卡</div></div>
          <span style="margin-left:auto" class="chip ok">服務中</span></div></div>
      <div class="sec-label">✦ GPS 散步軌跡</div>
      <div class="gps-map">${gpsSvg()}</div>
      <div class="sec-label">✦ 檢核表（逐項拍照上傳）</div>
      <div class="card"><ul class="checklist">
        ${live.checklist.map(c => `<li class="${c.done ? 'done' : ''}">
          <span class="ck">${c.done ? '✓' : ''}</span>
          <span><span class="ck-name">${c.item}</span>${c.done ? `<div class="ck-ts">${c.ts} 完成</div>` : '<div class="ck-ts">待完成</div>'}</span>
          ${c.done && c.photo ? '<span class="ck-photo">📷 已附照片</span>' : ''}</li>`).join('')}
      </ul>
      <div class="muted" style="margin-top:6px">檢核 ${done}/${live.checklist.length}・完成後自動生成照顧日誌</div>
      <button class="btn btn-soft btn-sm" style="margin-top:10px" data-action="care-sim">▶ 模擬保母回報下一項（示範）</button></div>
      <div style="margin-top:16px"><button class="emg-btn" data-action="care-emg">🆘 緊急聯絡・一鍵啟動送醫流程</button></div>`;
  } else {
    liveHtml = `<div class="card" style="text-align:center;padding:30px 16px">
      <img src="assets/species/dog.png" alt="" style="width:70px;opacity:.8">
      <div style="font-weight:900;margin-top:8px">目前沒有進行中的服務</div>
      <div class="muted" style="margin-top:4px">服務開始後，這裡會出現 Live 畫面、GPS 軌跡與檢核表。</div>
      <button class="btn btn-soft btn-sm" style="margin-top:12px" data-action="start-book">預約到府照護</button></div>`;
  }
  const logHtml = logs.length ? logs.map(b => {
    const s = sitterById(b.sitter_id), pet = petById(b.pet_ids[0]);
    const d = resolveDate(b.slots[0].date);
    return `<div class="card" data-action="open-carelog" data-id="${b.id}" role="button" tabindex="0" style="cursor:pointer">
      <div style="display:flex;gap:8px;align-items:center"><b>${esc(pet.name)}</b><span class="muted">${esc(b.service_name)}</span>
        <span style="margin-left:auto" class="muted">${fmtDate(d)}</span></div>
      <div class="muted" style="margin-top:4px">保母 ${esc(s.name)}・${b.care_log && b.care_log.rating_owner ? '已評價 ' + starsTxt(b.care_log.rating_owner) : '待你評價'}・點我看日誌 →</div></div>`;
  }).join('') : '<div class="muted">還沒有完成的服務。</div>';
  return `${apphead('全程透明回報')}
    <h1 class="pagetitle">照護中</h1>
    <p class="pagesub">看得見的安心：Live 畫面・GPS 軌跡・逐項檢核。</p>
    ${liveHtml}
    <div class="sec-label">✦ 照顧日誌</div>${logHtml}${appfoot()}`;
}
function gpsSvg() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  return `<svg viewBox="0 0 360 190" width="100%" role="img" aria-label="散步 GPS 軌跡示意圖">
    <defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0H0V24" fill="none" stroke="rgba(163,98,29,.14)" stroke-width="1"/></pattern></defs>
    <rect width="360" height="190" fill="#F2EADC"/><rect width="360" height="190" fill="url(#grid)"/>
    <rect x="30" y="26" width="86" height="52" rx="6" fill="#E8DCC4"/><rect x="240" y="110" width="90" height="56" rx="6" fill="#E8DCC4"/>
    <text x="73" y="56" font-size="11" fill="#8D7458" text-anchor="middle">大安公園</text>
    <text x="285" y="142" font-size="11" fill="#8D7458" text-anchor="middle">住家</text>
    <path id="walkpath" d="M285 120 C 250 90, 210 130, 170 110 S 110 60, 78 66" fill="none" stroke="#C87A16" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="1 7"/>
    <circle cx="285" cy="120" r="6" fill="#3A7D44"/><text x="285" y="105" font-size="10" fill="#3A7D44" text-anchor="middle">出發 15:34</text>
    <circle r="7" fill="#B2492C" stroke="#fff" stroke-width="2">${reduce ? '<animate attributeName="r" values="7" dur="1s"/>' : '<animateMotion dur="9s" repeatCount="indefinite"><mpath href="#walkpath"/></animateMotion>'}</circle>
    <text x="14" y="180" font-size="10" fill="#8D7458">全程 GPS 記錄・防掙脫雙扣胸背帶（平台配發）</text></svg>`;
}
function startLiveClock() {
  const tick = () => {
    const el = document.getElementById('live-ts');
    if (el) el.textContent = new Date().toLocaleTimeString('zh-TW', { hour12: false });
  };
  tick();
  render._timer = setInterval(tick, 1000);
}
function careSim() {
  const live = DB.bookings.find(b => b.status === 'in_service');
  if (!live) return;
  const next = live.checklist.find(c => !c.done);
  if (next) {
    next.done = true; next.photo = true;
    next.ts = new Date().toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' });
    toast(`保母已回報：${next.item} ✓（照片已上傳）`);
  }
  if (!live.checklist.some(c => !c.done)) {
    live.status = 'done';
    live.care_log = {
      photos: ['assets/app/livecam.jpg', 'assets/svc/svc-dog.jpg', 'assets/bg/final-cat.jpg'],
      notes: '金豆今天放電成功！公園來回約 2.8 公里，途中大小便各一次已清理。回家擦腳、補水，狀態很好。',
      rating_owner: 0, rating_sitter: 5
    };
    toast('服務完成！已生成照顧日誌，並自動完成扣款');
  }
  saveState(); render();
}
function openCareLog(id) {
  const b = DB.bookings.find(x => x.id === id);
  const s = sitterById(b.sitter_id), pet = petById(b.pet_ids[0]);
  const log = b.care_log;
  openSheet(`<h3>照顧日誌・${esc(pet.name)}</h3>
    <div class="muted">${esc(b.service_name)}・保母 ${esc(s.name)}（${s.cert_no}）</div>
    <div class="photo-wall" style="margin:12px 0">${log.photos.map(p => `<img src="${p}" alt="照護照片">`).join('')}</div>
    <div class="card"><b>📔 保母手記</b><p style="font-size:.88rem;line-height:1.8;margin-top:6px">${esc(log.notes)}</p></div>
    <div class="card" style="margin-top:10px"><b>雙向評價</b>
      <div class="muted" style="margin:8px 0 4px">你給保母的評價${log.rating_owner ? '' : '（點星星）'}</div>
      <div class="rate-stars" data-action-stars="${b.id}">${[1,2,3,4,5].map(i => `<span class="${log.rating_owner >= i ? 'on' : ''}" data-star="${i}">★</span>`).join('')}</div>
      <div class="muted" style="margin-top:10px">保母給${esc(pet.name)}的評價：<span class="star">${starsTxt(log.rating_sitter)}</span>（天使毛孩）</div></div>
    <p class="muted" style="margin-top:10px">影像歸你留存，也可要求銷毀（§門禁與金流安全）。</p>`);
}
function openEmergency() {
  openSheet(`<h3 style="color:var(--no)">🆘 緊急送醫流程</h3>
    <ul class="checklist">
      <li class="done"><span class="ck">1</span><span><span class="ck-name">保母發現異常，App 一鍵啟動</span><div class="ck-ts">同步通知你與緊急聯絡人（${esc(DB.user.emergency_contact)}）</div></span></li>
      <li class="done"><span class="ck">2</span><span><span class="ck-name">24 小時合作醫院・綠色通道</span><div class="ck-ts">最近合作院所：大安 毛安動物醫院（1.1 km）</div></span></li>
      <li class="done"><span class="ck">3</span><span><span class="ck-name">醫療費平台先行代墊</span><div class="ck-ts">單據透明、事後結算</div></span></li>
    </ul>
    <div class="hr"></div>
    <button class="btn btn-danger" style="width:100%" data-action="emg-call">📞 立即聯絡平台 24 小時緊急專線（原型示意）</button>
    <button class="btn btn-ghost" style="width:100%;margin-top:10px" data-action="close-sheet">關閉</button>`);
}

/* ============ Tab 4 毛孩 ============ */
function renderPets() {
  if (PF) return renderPetForm();
  const cards = DB.pets.map(p => `
    <div class="card" style="display:flex;gap:14px;align-items:center">
      <img src="${speciesImg(p.species)}" alt="" style="width:56px;height:56px;object-fit:contain">
      <div style="flex:1">
        <b>${esc(p.name)}</b> <span class="muted">${esc(p.breed || speciesName(p.species))}・${esc(p.age_band)}</span>
        ${isHighRisk(p) ? '<span class="chip no" style="margin-left:4px">高風險</span>' : ''}
        <div style="margin-top:5px">${(p.temperament.tags || []).slice(0, 3).map(t => `<span class="chip" style="font-size:.66rem;padding:2px 8px;margin-right:4px">${esc(t)}</span>`).join('')}</div>
        <div class="muted" style="margin-top:5px">疫苗：${esc(p.vaccines || '未填')}・醫院：${esc(p.vet_clinic || '未填')}</div>
      </div></div>`).join('');
  return `${apphead('毛孩檔案')}
    <h1 class="pagetitle">我的毛孩</h1>
    <p class="pagesub">完整檔案讓保母照著牠的習慣照顧——照護來適應寵物。</p>
    ${cards}
    <div style="margin-top:16px"><button class="btn btn-primary" data-action="pf-start">＋ 開始建立寵物檔案</button></div>
    ${appfoot()}`;
}

/* ---- 寵物檔案多步驟表單（§5，24 題，種類動態出題） ---- */
const PF_STEPS = ['牠是誰', '體格健康', '個性', '照護', '環境', '飼主資訊'];
function pfOpt(field, val, label, sub) {
  const cur = PF.d[field];
  const sel = Array.isArray(cur) ? cur.includes(val) : cur === val;
  return `<button class="opt ${sel ? 'selected' : ''}" data-action="pf-opt" data-f="${field}" data-v="${esc(val)}" data-multi="${Array.isArray(cur) ? 1 : 0}">${label}${sub ? `<span class="opt-sub">${sub}</span>` : ''}</button>`;
}
function pfInput(field, label, opts = {}) {
  return `<div class="field"><label class="${opts.req ? 'req' : ''}">${label}</label>
    <input type="${opts.type || 'text'}" data-action-input="pf-in" data-f="${field}" value="${esc(PF.d[field] || '')}" placeholder="${esc(opts.ph || '')}"></div>`;
}
function pfArea(field, label, ph) {
  return `<div class="field"><label>${label}</label>
    <textarea data-action-input="pf-in" data-f="${field}" placeholder="${esc(ph || '')}">${esc(PF.d[field] || '')}</textarea></div>`;
}
function renderPetForm() {
  const d = PF.d;
  const isDog = d.species === 'dog', isCat = d.species === 'cat', isExotic = d.species === 'exotic';
  let body = '';
  switch (PF.step) {
    case 0: body = `
      <div class="field"><label class="req">1. 牠是哪種毛孩？</label>
        <div class="opt-grid cols3">${pfOpt('species','cat','🐱 貓')}${pfOpt('species','dog','🐶 狗')}${pfOpt('species','exotic','🦜 異寵')}</div></div>
      ${isExotic ? pfInput('exotic_kind', '2. 異寵物種', { ph: '例：兔、天竺鼠、玄鳳鸚鵡', req: true }) : ''}
      ${pfInput('name', `${isExotic ? 3 : 2}. 牠的名字`, { req: true, ph: '例：麻糬' })}
      <div class="field"><label>年齡階段</label>
        <div class="opt-grid">${pfOpt('age_band','幼年','幼年')}${pfOpt('age_band','成年','成年')}${pfOpt('age_band','熟齡','熟齡')}${pfOpt('age_band','不確定','不確定')}</div></div>
      <div class="field"><label>性別與絕育</label>
        <div class="opt-grid">${pfOpt('sex_neutered','公・已絕育','公・已絕育')}${pfOpt('sex_neutered','公・未絕育','公・未絕育')}${pfOpt('sex_neutered','母・已絕育','母・已絕育')}${pfOpt('sex_neutered','母・未絕育','母・未絕育')}</div></div>
      ${pfInput('breed', '品種', { ph: '例：米克斯、柴犬' })}`; break;
    case 1: body = `
      ${isDog ? `<div class="field"><label class="req">體型級距（影響散步計價）</label>
        <div class="opt-grid cols3">${pfOpt('size_tier','small','小型','<15kg')}${pfOpt('size_tier','medium','中大型','15–30kg')}${pfOpt('size_tier','xlarge','超大型','>30kg')}</div></div>`
      : '<p class="muted" style="margin-bottom:14px">貓與異寵免體型級距。</p>'}
      ${pfInput('vaccines', '疫苗接種狀況', { ph: '例：三合一、狂犬病（年份）' })}
      <div class="field"><label>健康狀況（複選）</label>
        <div class="opt-grid">${['健康良好','慢性病','皮膚敏感','關節問題','腸胃敏感','視聽力退化'].map(v => pfOpt('health', v, v)).join('')}</div></div>
      ${pfInput('meds', '目前用藥', { ph: '無則填「無」' })}
      ${pfInput('vet_clinic', '固定就醫的動物醫院', { ph: '例：大安 毛安動物醫院' })}`; break;
    case 2: body = `
      <div class="field"><label>對陌生人的反應</label>
        <div class="opt-grid">${['友善主動','慢熟觀察','緊張躲藏','可能哈氣/低吼'].map(v => pfOpt('stranger', v, v)).join('')}</div></div>
      <div class="field"><label>活動量</label>
        <div class="opt-grid cols3">${['低','中','高'].map(v => pfOpt('energy', v, v)).join('')}</div></div>
      <div class="field"><label>個性標籤（複選）</label>
        <div class="opt-grid">${['愛撒嬌','獨立','貪吃','愛玩','膽小','愛講話'].map(v => pfOpt('tags', v, v)).join('')}</div></div>
      ${pfArea('taboos', '牠的地雷（簡答）', '例：不喜歡被摸肚子、怕吸塵器')}
      ${isDog ? `
      <div class="field"><label>與其他犬隻相處</label>
        <div class="opt-grid">${['可同行','需保持距離','不確定'].map(v => pfOpt('dog_social', v, v)).join('')}</div></div>
      <div class="field"><label class="req">攻擊紀錄揭露（預約強制揭露）</label>
        <div class="opt-grid">${pfOpt('aggression','none','從未有攻擊紀錄')}${pfOpt('aggression','yes','曾有咬人/咬寵物紀錄')}</div>
        ${d.aggression === 'yes' ? `<div class="card" style="border-color:var(--no);margin-top:10px"><b style="color:var(--no)">將標示為高風險犬隻</b><div class="muted" style="margin-top:4px">保母得拒接、平台不強制媒合；我們不因危險性加價，安全優先於營收。隱瞞攻擊紀錄致事故，責任歸飼主（§保險與賠付）。</div></div>` : ''}
      </div>` : ''}`; break;
    case 3: body = `
      ${pfInput('feeding', '餵食頻率', { ph: '例：一日 2 餐（乾糧+罐頭）' })}
      <div class="field"><label>飲食內容（複選）</label>
        <div class="opt-grid">${['一般乾糧','處方乾糧','主食罐','鮮食','冷凍生食'].map(v => pfOpt('diet', v, v)).join('')}</div></div>
      ${isDog ? `${pfInput('walk', '散步需求', { ph: '例：每日 1 次、每次 1 小時' })}
      ${pfArea('walk_route', '習慣路線與牽繩位置', '例：走大安公園，牽繩掛門後')}` : ''}
      <div class="field"><label>特殊照護（複選）</label>
        <div class="opt-grid">${['餵藥','點眼藥','皮下輸液','高齡照護','術後照護'].map(v => pfOpt('special', v, v)).join('')}</div></div>
      <div class="field"><label>清潔需求（複選）</label>
        <div class="opt-grid">${(isCat ? ['鏟砂','換水','梳毛','環境整理'] : ['擦腳','梳毛','換水','環境整理']).map(v => pfOpt('cleaning', v, v)).join('')}</div></div>`; break;
    case 4: body = `
      <div class="field"><label>居住型態</label>
        <div class="opt-grid">${['電梯大樓','公寓','透天','套房'].map(v => pfOpt('home_type', v, v)).join('')}</div></div>
      <div class="field"><label>保母進出方式</label>
        <div class="opt-grid">${['智慧密碼鎖','鑰匙寄放密碼盒','管理室代轉','我會在場'].map(v => pfOpt('entry', v, v)).join('')}</div>
        <p class="muted" style="margin-top:8px">智慧鎖採「限時一次性密碼」，逾時自動失效；傳統鑰匙放平台密碼鎖並置於監視器可視範圍。</p></div>
      <div class="field"><label>監視器需求</label>
        <div class="opt-grid">${['已有攝影機（願意串聯）','需要免費租借','不需要'].map(v => pfOpt('camera', v, v)).join('')}</div></div>
      ${pfArea('home_notes', '環境注意事項', '例：玄關左手邊是貓砂區、陽台門保持關閉')}`; break;
    case 5: body = `
      ${pfInput('owner_name', '飼主姓名', { req: true })}
      ${pfInput('owner_phone', '手機', { req: true, type: 'tel', ph: '09xx-xxx-xxx' })}
      ${pfInput('owner_line', 'LINE ID')}
      <div class="field"><label class="req">服務地區</label>
        <div class="opt-grid cols3">${['台北市','新北市','其他（先登記）'].map(v => pfOpt('area', v, v)).join('')}</div></div>
      ${pfInput('emg', '緊急聯絡人', { ph: '姓名＋電話' })}
      <div class="field"><label>從哪裡得知爪爪日常？</label>
        <div class="opt-grid">${['朋友推薦','社群廣告','搜尋','其他'].map(v => pfOpt('channel', v, v)).join('')}</div></div>
      <div class="addon-row ${d.agree ? 'selected' : ''}" data-action="pf-agree" role="button" tabindex="0">
        <span class="ar-check">${d.agree ? '✓' : ''}</span>
        <span><span class="ar-name">我已閱讀並同意服務條款 *</span><div class="ar-note">含取消/改期政策、安心賠付機制與影像授權說明</div></span></div>`; break;
  }
  const canNext = pfValid();
  return `${apphead('建立寵物檔案')}
    <button class="back-link" data-action="pf-back">← ${PF.step === 0 ? '取消' : '上一步'}</button>
    <h1 class="pagetitle">Step ${PF.step + 1}・${PF_STEPS[PF.step]}</h1>
    <div class="steps">${PF_STEPS.map((_, i) => `<i class="${PF.step >= i ? 'done' : ''}"></i>`).join('')}</div>
    ${body}
    <div style="margin-top:20px"><button class="btn btn-primary" data-action="pf-next" ${canNext ? '' : 'disabled'}>${PF.step === 5 ? '完成建立' : '下一步'}</button></div>`;
}
function pfValid() {
  const d = PF.d;
  switch (PF.step) {
    case 0: return !!d.species && !!(d.name || '').trim() && (d.species !== 'exotic' || !!(d.exotic_kind || '').trim());
    case 1: return d.species !== 'dog' || !!d.size_tier;
    case 2: return d.species !== 'dog' || !!d.aggression;
    case 5: return !!(d.owner_name || '').trim() && !!(d.owner_phone || '').trim() && !!d.area && !!d.agree;
    default: return true;
  }
}
function pfFinish() {
  const d = PF.d;
  DB.pets.push({
    id: 'P-' + String(DB.pets.length + 1).padStart(3, '0'), owner_id: DB.user.id,
    species: d.species, name: d.name.trim(), age_band: d.age_band || '不確定',
    sex_neutered: d.sex_neutered || '未填', breed: d.breed || (d.exotic_kind || ''),
    size_tier: d.species === 'dog' ? d.size_tier : null,
    vaccines: d.vaccines || '', health: d.health, meds: d.meds || '', vet_clinic: d.vet_clinic || '',
    temperament: { stranger: d.stranger || '', energy: d.energy || '', tags: d.tags, taboos: d.taboos || '' },
    dog: d.species === 'dog' ? { social: d.dog_social || '', walk: d.walk || '', aggression_record: d.aggression === 'yes' ? 'disclosed' : 'none' } : null,
    care: { feeding: d.feeding || '', diet: d.diet, special: d.special, cleaning: d.cleaning },
    home: { type: d.home_type || '', entry: d.entry || '', camera: d.camera || '', notes: d.home_notes || '' }
  });
  saveState();
  const wasRisk = d.aggression === 'yes';
  PF = null; render();
  toast(wasRisk ? `已建立 ${d.name} 的檔案（標示高風險，媒合時保母得拒接）` : `已建立 ${d.name} 的檔案！`);
}

/* ============ Tab 5 我的 ============ */
function renderMe() {
  const m = DB.user.membership, plan = PLANS[m.tier];
  const orders = [...DB.bookings].reverse();
  const orderCards = orders.map(b => {
    const pet = petById(b.pet_ids[0]);
    const d = resolveDate(b.slots[0].date);
    const cancellable = b.status === 'matched' || b.status === 'pending';
    return `<div class="card order-card">
      <div class="oc-top"><b>${esc(b.service_name)}</b><span class="oc-status">${statusChip(b.status)}</span></div>
      <div class="muted" style="margin-top:4px">${b.id}・${esc(pet ? pet.name : '')}・${fmtDate(d)} ${b.slots[0].time}・${fmtMoney(b.pricing.total)}${b.is_holiday ? '・<b style="color:var(--wood-deep)">連假單</b>' : ''}</div>
      ${cancellable ? `<button class="btn btn-ghost btn-sm" style="margin-top:10px" data-action="open-refund" data-id="${b.id}">取消／改期試算</button>` : ''}
    </div>`;
  }).join('');
  return `${apphead('會員中心')}
    <h1 class="pagetitle">我的</h1>
    <div class="member-card">
      <div class="mc-tier">${plan.name}</div>
      <div style="font-size:.78rem;opacity:.8;margin-top:2px">${esc(DB.user.name)}・${m.tier === 'none' ? '尚未訂閱' : '效期至 ' + m.expiry}</div>
      <div style="margin-top:14px;display:flex;gap:10px;align-items:center">
        <span class="coin-pill">🐾 ${m.paw_coins.toLocaleString()} 爪爪幣</span>
        <span style="font-size:.72rem;opacity:.75">1 幣 = 1 元</span></div>
      <button class="btn btn-soft btn-sm" style="margin-top:14px" data-action="open-plans">會員方案比較・訂閱切換</button>
    </div>
    <div class="sec-label">✦ 訂單紀錄</div>
    ${orderCards || '<div class="muted">尚無訂單。</div>'}
    <div class="sec-label">✦ 取消／改期試算器</div>
    <div class="card">
      <div class="muted">輸入訂單條件，立刻算出可退金額與規則依據。</div>
      <button class="btn btn-primary btn-sm" style="margin-top:10px" data-action="open-refund">開啟試算器</button></div>
    <div class="sec-label">✦ 服務與設定</div>
    <div class="card" style="padding:4px 16px">
      <button class="list-row" data-action="open-coupons"><span class="lr-ico">🎟</span>優惠券（${DB.user.coupons.length} 張可用）<span class="lr-arrow">›</span></button>
      <button class="list-row" data-action="open-rental"><span class="lr-ico">📷</span>攝影機／智慧鎖租借<span class="lr-arrow">›</span></button>
      <button class="list-row" data-action="open-faq"><span class="lr-ico">💬</span>常見問題 FAQ<span class="lr-arrow">›</span></button>
      <button class="list-row" data-action="open-terms"><span class="lr-ico">📄</span>服務條款・取消政策・安心賠付<span class="lr-arrow">›</span></button>
      <button class="list-row" data-action="contact-cs"><span class="lr-ico">🎧</span>聯絡客服<span class="lr-arrow">›</span></button>
      <button class="list-row" data-action="reset-demo"><span class="lr-ico">♻️</span>重設示範資料（原型）<span class="lr-arrow">›</span></button>
    </div>${appfoot()}`;
}

/* ---- 會員方案 ---- */
function openPlans() {
  const cur = DB.user.membership.tier;
  const cards = ['month', 'quarter', 'year'].map(k => {
    const p = PLANS[k];
    return `<div class="plan-card ${cur === k ? 'current' : ''}">
      ${cur === k ? '<span class="chip ok" style="position:absolute;top:12px;right:12px">目前方案</span>' : ''}
      <div class="pl-name">${p.name}</div><div class="pl-price">${p.price}</div>
      <ul>${p.perks.map(x => `<li>${x}</li>`).join('')}</ul>
      ${cur === k ? '' : `<button class="btn btn-primary btn-sm" style="margin-top:12px;width:100%" data-action="switch-plan" data-tier="${k}">${k === 'month' ? '月度訂閱' : k === 'quarter' ? '季度訂閱' : '年度訂閱'}</button>`}
    </div>`;
  }).join('');
  openSheet(`<h3>訂閱會員・純權益制</h3>
    <p class="muted" style="margin-bottom:12px">爪爪幣 1 幣 = 1 元。疊算順序：會員權益 ＞ 套票折扣 ＞ 動態加價。</p>
    ${cards}
    ${cur !== 'none' ? '<button class="btn btn-ghost btn-sm" style="width:100%;margin-top:12px" data-action="switch-plan" data-tier="none">取消訂閱（轉一般會員）</button>' : ''}`);
}
function switchPlan(tier) {
  const m = DB.user.membership;
  m.tier = tier;
  if (tier !== 'none') {
    const d = new Date();
    d.setMonth(d.getMonth() + (tier === 'month' ? 1 : tier === 'quarter' ? 3 : 12));
    m.expiry = d.toISOString().slice(0, 10);
  }
  saveState(); closeSheet(); render();
  toast(tier === 'none' ? '已取消訂閱，回饋與權益即刻停止' : `已切換為「${PLANS[tier].name}」！權益立即生效`);
}

/* ---- 取消/改期試算器 ---- */
let RC = null;
function openRefund(bookingId) {
  const b = bookingId ? DB.bookings.find(x => x.id === bookingId) : null;
  RC = {
    bookingId: b ? b.id : null,
    kind: b ? (b.is_package ? 'package' : b.is_holiday ? 'holiday' : 'normal') : 'normal',
    total: b ? b.pricing.total : 600,
    start: b ? bookingStart(b) : (() => { const d = new Date(); d.setDate(d.getDate() + 2); d.setHours(10, 0, 0, 0); return d; })(),
    used: b && b.pkg ? b.pkg.usedSessions : 0,
    pkg: b ? b.pkg : null,
    exception: false
  };
  renderRefundSheet();
}
function renderRefundSheet() {
  const hoursBefore = Math.round((RC.start - Date.now()) / 36e5 * 10) / 10;
  const pkg = RC.kind === 'package'
    ? (RC.pkg || { price: 2520, perVisit: 400, totalSessions: 7, usedSessions: RC.used })
    : null;
  if (pkg) pkg.usedSessions = RC.used;
  const r = refundCalc({ kind: RC.kind, total: RC.total, hoursBefore, exception: RC.exception, pkg });
  const startLocal = new Date(RC.start.getTime() - RC.start.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  openSheet(`<h3>取消／改期試算器</h3>
    ${RC.bookingId ? `<p class="muted">訂單 ${RC.bookingId}（已代入條件）</p>` : ''}
    <div class="field"><label>訂單類型</label>
      <div class="opt-grid cols3">
        <button class="opt ${RC.kind === 'normal' ? 'selected' : ''}" data-action="rc-kind" data-v="normal">一般</button>
        <button class="opt ${RC.kind === 'holiday' ? 'selected' : ''}" data-action="rc-kind" data-v="holiday">連假</button>
        <button class="opt ${RC.kind === 'package' ? 'selected' : ''}" data-action="rc-kind" data-v="package">套票</button></div></div>
    ${RC.kind === 'package' ? `
      <div class="field"><label>已使用場次（共 ${pkg.totalSessions} 次，單次原價 $${pkg.perVisit}）</label>
        <input type="range" min="0" max="${pkg.totalSessions}" value="${RC.used}" data-action-change="rc-used" style="width:100%">
        <div class="muted">已用 ${RC.used} 次</div></div>`
    : `
      <div class="field"><label>服務開始時間</label>
        <input type="datetime-local" value="${startLocal}" data-action-change="rc-start"></div>
      <div class="field"><label>訂單金額</label>
        <input type="number" value="${RC.total}" min="0" data-action-change="rc-total"></div>
      <div class="muted">距服務開始：${hoursBefore >= 0 ? `約 ${hoursBefore} 小時` : '已開始'}</div>`}
    <div class="addon-row ${RC.exception ? 'selected' : ''}" style="margin-top:6px" data-action="rc-exc" role="button" tabindex="0">
      <span class="ar-check">${RC.exception ? '✓' : ''}</span>
      <span><span class="ar-name">符合例外事由</span><div class="ar-note">天災停班停課／寵物或飼主緊急傷病（附證明）／平台或保母原因</div></span></div>
    <div class="result-box">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <b>可退金額</b><span class="price" style="font-size:1.5rem">${fmtMoney(r.refund)}</span></div>
      <div class="muted" style="margin-top:8px"><b>規則依據：</b>${r.rule}</div>
      ${r.extra.map(x => `<div class="muted" style="margin-top:4px">・${x}</div>`).join('')}
    </div>
    ${RC.bookingId ? `<div style="display:flex;gap:10px;margin-top:14px">
      <button class="btn btn-ghost btn-sm" style="flex:1" data-action="rc-reschedule">改期（免費，限 2 次）</button>
      <button class="btn btn-danger btn-sm" style="flex:1" data-action="rc-cancel">確認取消並退 ${fmtMoney(r.refund)}</button></div>` : ''}`);
}
function rcCancel() {
  const b = DB.bookings.find(x => x.id === RC.bookingId);
  const hoursBefore = Math.round((RC.start - Date.now()) / 36e5 * 10) / 10;
  const pkg = RC.kind === 'package' ? (RC.pkg || { price: 2520, perVisit: 400, totalSessions: 7 }) : null;
  if (pkg) pkg.usedSessions = RC.used;
  const r = refundCalc({ kind: RC.kind, total: RC.total, hoursBefore, exception: RC.exception, pkg });
  b.status = 'cancelled';
  saveState(); closeSheet(); render();
  toast(`已取消 ${b.id}，${fmtMoney(r.refund)} 將於 7 個工作日內退回原付款方式`);
}

/* ---- 其他 sheets ---- */
function openCoupons() {
  openSheet(`<h3>優惠券</h3>
    ${DB.user.coupons.length ? DB.user.coupons.map(c => `<div class="card" style="margin-top:10px;display:flex;align-items:center;gap:12px">
      <span style="font-family:var(--serif);font-size:1.3rem;font-weight:700;color:var(--wood-deep)">$${c.value}</span>
      <span><b>${esc(c.name)}</b><div class="muted">效期至 ${c.expiry}・結帳時折抵</div></span></div>`).join('')
    : '<p class="muted">目前沒有可用的優惠券。訂閱月方案每月贈 $50 券 ×2。</p>'}`);
}
function openRental() {
  openSheet(`<h3>攝影機／智慧鎖租借</h3>
    <div class="card" style="margin-top:10px"><b>📷 居家攝影機</b><div class="muted" style="margin-top:4px">免費租借，或串聯你自有的攝影機。服務結束後影像歸你留存或銷毀。</div>
      <button class="btn btn-soft btn-sm" style="margin-top:10px" data-action="rent-cam">申請免費租借（原型示意）</button></div>
    <div class="card" style="margin-top:10px"><b>🔐 智慧藍牙鎖</b><div class="muted" style="margin-top:4px">系統發「限時一次性密碼」給保母，逾時自動失效。季／年會員免費租借。</div>
      <button class="btn btn-soft btn-sm" style="margin-top:10px" data-action="rent-lock">申請租借（原型示意）</button></div>
    <p class="muted" style="margin-top:12px">傳統鑰匙可放入平台密碼鎖，置於監視器可視範圍。</p>`);
}
const FAQS = [
  ['保母可信嗎？', '每位保母通過三道審查：實名＋良民證、專業資格（獸醫科系/證照優先，否則平台培訓）、模擬照護實作考核。一句話：自己家的毛孩，敢不敢交給這個人——敢，才上架。'],
  ['我怎麼知道服務有確實做？', '全程數位軌跡：GPS 進退場打卡、進門/餵食/清理/鎖門逐項拍照上傳、檢核表強制勾稽，你在 App 即時看得到。'],
  ['出事怎麼辦？', '雙層保障：平台年度責任險＋安心賠付機制（可歸責事故每案最高 $50 萬，數位軌跡定責，7 個工作日內理賠決定）。緊急狀況保母一鍵啟動送醫流程，24 小時合作醫院綠色通道、醫療費平台代墊。'],
  ['臨時要取消怎麼算？', '一般訂單：開始前 24 小時（含）前全額退、改期免費（限 2 次）；24 小時內退 50%；開始後不退。連假訂單門檻提前至 72 小時。天災、緊急傷病、平台原因則全額退。'],
  ['連假會漲價嗎？', '會，×1.5，但至少提前 14 天公告——絕不臨時漲價、絕不拒收。年費會員免動態加價且可提前 30 天預約。'],
  ['可以加保母的 LINE 私下約嗎？', '不行。私下交易會失去保險保障、送醫代墊、服務存證與回饋，對話有敏感詞偵測，嚴重者停權。在平台內完成，保障才在。']
];
function openFaq() {
  openSheet(`<h3>常見問題</h3>
    ${FAQS.map((f, i) => `<div class="faq-q" data-action="faq-toggle" data-i="${i}">${f[0]} <span style="float:right;color:var(--ink-soft)">＋</span></div>
      <div class="faq-a" data-faq="${i}" hidden>${f[1]}</div>`).join('')}
    <p class="muted" style="margin-top:12px">完整 21+1 題請見官網 FAQ。</p>`);
}
function openTerms() {
  openSheet(`<h3>服務條款重點（原型摘錄）</h3>
    <div class="card" style="margin-top:10px"><b>取消／改期</b><p class="muted" style="margin-top:4px">一般單 24h 前全退／24h 內 50%／開始後不退；連假單門檻 72h；套票未用全退、已用按單次原價退差額、剩餘可免費順延 1 次；退款 7 個工作日內退回原付款方式。</p></div>
    <div class="card" style="margin-top:10px"><b>保險與賠付（雙層架構）</b><p class="muted" style="margin-top:4px">平台年度責任險＋安心賠付機制：可歸責事故每案最高 $50 萬，財源為抽成提撥 3%「爪爪安心儲備基金」，7 個工作日內理賠決定。年費會員優先快速通道。</p></div>
    <div class="card" style="margin-top:10px"><b>責任原則</b><p class="muted" style="margin-top:4px">平台與保母為承攬關係，保母故意過失自負；飼主隱瞞犬隻攻擊紀錄致事故，責任歸飼主。具攻擊性犬隻標示高風險、保母得拒接——安全優先於營收。</p></div>
    <div class="card" style="margin-top:10px"><b>金流安全</b><p class="muted" style="margin-top:4px">第三方金流閘道（PCI-DSS）、信用卡預授權＋完成後自動扣款、平台不儲存完整卡號。</p></div>`);
}

/* ============ 事件委派 ============ */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (el) {
    const a = el.dataset.action;
    if (a.startsWith('bk-')) return bkHandle(a, el);
    switch (a) {
      case 'close-sheet': closeSheet(); break;
      case 'goto-care': go('care'); break;
      case 'start-book': BK = newBK(); go('book'); break;
      case 'pick-service':
        if (el.dataset.svc === 'exotic') { openExoticSheet(); break; }
        if (el.dataset.svc === 'pack7') { BK = newBK(); go('book'); break; }
        BK = newBK(el.dataset.svc); go('book'); break;
      case 'open-pricing-sheet': BK = newBK(); go('book'); break;
      case 'goto-pets-new': PF = newPF(); go('pets'); break;
      case 'goto-me-orders': BK = newBK(); go('me'); break;
      case 'care-sim': careSim(); break;
      case 'care-emg': openEmergency(); break;
      case 'emg-call': toast('已通知平台 24 小時緊急專線與緊急聯絡人（原型示意）'); closeSheet(); break;
      case 'open-carelog': openCareLog(el.dataset.id); break;
      case 'pf-start': PF = newPF(); render(); break;
      case 'pf-back': PF.step === 0 ? (PF = null, render()) : (PF.step--, render()); break;
      case 'pf-next': PF.step === 5 ? pfFinish() : (PF.step++, render()); break;
      case 'pf-agree': PF.d.agree = !PF.d.agree; render(); break;
      case 'pf-opt': {
        const f = el.dataset.f, v = el.dataset.v;
        if (el.dataset.multi === '1') {
          const arr = PF.d[f]; const i = arr.indexOf(v);
          i >= 0 ? arr.splice(i, 1) : arr.push(v);
        } else PF.d[f] = v;
        render(); break;
      }
      case 'open-plans': openPlans(); break;
      case 'switch-plan': switchPlan(el.dataset.tier); break;
      case 'open-refund': openRefund(el.dataset.id || null); break;
      case 'rc-kind': RC.kind = el.dataset.v; renderRefundSheet(); break;
      case 'rc-exc': RC.exception = !RC.exception; renderRefundSheet(); break;
      case 'rc-cancel': rcCancel(); break;
      case 'rc-reschedule': toast('改期免費（限 2 次）：請透過客服或重新選擇時段（原型示意）'); break;
      case 'open-coupons': openCoupons(); break;
      case 'open-rental': openRental(); break;
      case 'open-faq': openFaq(); break;
      case 'open-terms': openTerms(); break;
      case 'contact-cs': toast('客服 LINE：@pawfectlife（原型示意）'); break;
      case 'exotic-ask': closeSheet(); toast('已送出詢價，客服將於 24 小時內回覆（原型示意）'); break;
      case 'rent-cam': toast('已申請攝影機免費租借，出貨前客服會與你確認（原型示意）'); break;
      case 'rent-lock': toast('已申請智慧鎖租借（季／年會員免費）（原型示意）'); break;
      case 'reset-demo': resetState(); break;
      case 'faq-toggle': {
        const ans = document.querySelector(`[data-faq="${el.dataset.i}"]`);
        if (ans) ans.hidden = !ans.hidden;
        break;
      }
    }
    return;
  }
  const stars = e.target.closest('[data-action-stars]');
  if (stars && e.target.dataset.star) {
    const b = DB.bookings.find(x => x.id === stars.dataset.actionStars);
    b.care_log.rating_owner = Number(e.target.dataset.star);
    saveState(); openCareLog(b.id); render();
    toast('感謝評價！雙向評價讓媒合更精準');
  }
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-action-change]');
  if (!el) return;
  switch (el.dataset.actionChange) {
    case 'bk-date': BK.date = el.value; render(); break;
    case 'bk-dist': BK.distanceKm = Number(el.value); render(); break;
    case 'rc-start': RC.start = new Date(el.value); renderRefundSheet(); break;
    case 'rc-total': RC.total = Number(el.value) || 0; renderRefundSheet(); break;
    case 'rc-used': RC.used = Number(el.value); renderRefundSheet(); break;
  }
});
document.addEventListener('input', e => {
  const el = e.target.closest('[data-action-input]');
  if (!el) return;
  if (el.dataset.actionInput === 'pf-in') {
    PF.d[el.dataset.f] = el.value;
    // 只在影響「下一步」可否按時重繪按鈕狀態，避免打字時失焦
    const btn = document.querySelector('[data-action="pf-next"]');
    if (btn) btn.disabled = !pfValid();
  }
});
document.addEventListener('input', e => {
  const el = e.target.closest('[data-action-change="bk-dist"], [data-action-change="rc-used"]');
  if (el) el.dispatchEvent(new Event('change', { bubbles: true }));
});

/* ============ 啟動 ============ */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
go('home');
