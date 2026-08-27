/* ============ 爪爪日常 — 定價引擎（§3 商業規則） ============ */
/* 疊算順序（§3.3）：會員權益 ＞ 套票折扣 ＞ 動態加價 */
/* 原型假設值（§9 待組內拍板，皆已標註）：
   - 連假 ×1.5 加成計算基礎 = 服務費（基本+體型+多寵），不含加值項目。
   - 年費會員「免動態加價」= 免連假 ×1.5；夜間/跨區加價仍計。
   - 免 2% 金流手續費：付費會員皆免（一般會員收 2%）。
   - 七日套票（狗）原型以小型犬示範；中大型以上「依級距另計」。 */

const SURGE = { holidayX: 1.5, night: 150, crossPerKm: 30, freeKm: 3 };
const NIGHT_START = 22, NIGHT_END = 7; // 22:00–07:00

function isNightTime(timeStr) {
  const h = Number(timeStr.split(':')[0]);
  return h >= NIGHT_START || h < NIGHT_END;
}
function isHolidayDate(dateStr) { return HOLIDAYS.includes(dateStr); }

function addonPrice(addonId, sizeTier) {
  const a = ADDONS.find(x => x.id === addonId);
  if (!a) return 0;
  if (a.bySize && sizeTier) return a.bySize[sizeTier] ?? a.price;
  return a.price;
}

/**
 * 金額試算。
 * @param {Object} q {service, pets[], date, time, hours, addons[], distanceKm, tier, couponCount}
 * @returns {Object} {lines:[{label,amount,cls?}], total, rebate, notes[]}
 */
function computeQuote(q) {
  const lines = [];
  const notes = [];
  const tier = q.tier || DB.user.membership.tier || 'none';
  let service = 0;      // 服務費（基本+體型+多寵）
  let addonsSum = 0;

  if (q.service === 'cat_care') {
    const n = q.pets.length;
    service = 400 + Math.max(0, n - 1) * 100;
    lines.push({ label: '喵皇居家照護 $400／次（30 分）', amount: 400 });
    if (n > 1) lines.push({ label: `多貓加價 +$100 ×${n - 1} 隻`, amount: (n - 1) * 100, cls: 'plus' });
  } else if (q.service === 'dog_walk') {
    const hours = q.hours || 1;
    const sizes = q.pets.map(p => p.size_tier || 'small');
    const rank = { small: 0, medium: 1, xlarge: 2 };
    const maxSize = sizes.sort((a, b) => rank[b] - rank[a])[0];
    const perHour = DOG_WALK_PRICE[maxSize];
    service = perHour * hours;
    lines.push({ label: `散步 ${SIZE_LABEL[maxSize]} $${perHour}/時 ×${hours} 時`, amount: perHour * hours });
    if (q.pets.length > 1) { // 至多 2 隻（UI 已限制）
      service += 200 * hours;
      lines.push({ label: `第二隻同行 +$200/時 ×${hours} 時`, amount: 200 * hours, cls: 'plus' });
    }
  } else if (q.service === 'pack7_cat') {
    service = 2520;
    lines.push({ label: '七日套票（貓）一日一訪 30 分', amount: 2800 });
    lines.push({ label: '套票 9 折優惠', amount: -280, cls: 'minus' });
    notes.push('套票折扣先於動態加價疊算（§3.3）。');
  } else if (q.service === 'pack7_dog') {
    service = 5670;
    lines.push({ label: '七日套票（狗・小型犬）一日兩訪 40 分', amount: 6300 });
    lines.push({ label: '套票 9 折優惠', amount: -630, cls: 'minus' });
    notes.push('中大型以上依級距另計（原型以小型犬示範）。');
  }

  // 加值項目
  const sizeTier = q.pets[0] ? q.pets[0].size_tier : null;
  (q.addons || []).forEach(id => {
    const a = ADDONS.find(x => x.id === id);
    if (!a) return;
    const p = addonPrice(id, sizeTier);
    addonsSum += p;
    lines.push({ label: `加值・${a.name}`, amount: p, cls: 'plus' });
  });

  // ---- 動態加價（§3.2）----
  let surge = 0;
  const holiday = isHolidayDate(q.date);
  if (holiday) {
    if (tier === 'year') {
      lines.push({ label: '連假加價 ×1.5（年費會員豁免）', amount: 0, cls: 'minus' });
      notes.push('會員權益優先於動態加價：年費會員免連假加價。');
    } else {
      const s = Math.round(service * (SURGE.holidayX - 1));
      surge += s;
      lines.push({ label: '國定連假動態加價 ×1.5', amount: s, cls: 'plus' });
      notes.push('連假加價已於 14 天前公告（§3.2）。');
    }
  }
  if (q.time && isNightTime(q.time)) {
    surge += SURGE.night;
    lines.push({ label: '夜間清晨時段（22:00–07:00）+$150／次', amount: SURGE.night, cls: 'plus' });
  }
  if (q.distanceKm > SURGE.freeKm) {
    const km = Math.ceil(q.distanceKm - SURGE.freeKm);
    surge += km * SURGE.crossPerKm;
    lines.push({ label: `跨區加價 +$30/km ×${km} km（超出 3km）`, amount: km * SURGE.crossPerKm, cls: 'plus' });
  }

  let total = service + addonsSum + surge;

  // ---- 會員權益 / 優惠券 ----
  const couponUse = Math.min(q.couponCount || 0, DB.user.coupons.length);
  if (couponUse > 0) {
    const cv = couponUse * 50;
    total -= cv;
    lines.push({ label: `折價券 $50 ×${couponUse}`, amount: -cv, cls: 'minus' });
  }
  if (tier === 'none') {
    const fee = Math.round(total * 0.02);
    total += fee;
    lines.push({ label: '金流手續費 2%（訂閱會員免收）', amount: fee, cls: 'plus' });
  }
  total = Math.max(0, total);

  const rebate = Math.round(total * (PLANS[tier]?.rebate || 0));
  return { lines, total, rebate, notes, service, addonsSum, surge };
}

/**
 * 取消/改期試算（§3.4）。
 * @param {Object} p {kind:'normal'|'holiday'|'package', total, hoursBefore, exception,
 *                    pkg:{price, perVisit, totalSessions, usedSessions}}
 */
function refundCalc(p) {
  const r = { refund: 0, percent: 0, rule: '', extra: [] };
  if (p.exception) {
    r.refund = p.kind === 'package'
      ? Math.max(0, p.pkg.price - p.pkg.usedSessions * p.pkg.perVisit)
      : p.total;
    r.percent = 100;
    r.rule = '例外事由全額退款：天災（依停班停課公告）、寵物或飼主緊急傷病（附證明）、平台/保母原因（另補折價券）。';
    r.extra.push('退款於 7 個工作日內退回原付款方式。');
    return r;
  }
  if (p.kind === 'package') {
    const used = p.pkg.usedSessions;
    if (used === 0) {
      r.refund = p.pkg.price; r.percent = 100;
      r.rule = '套票未使用：全額退款。';
    } else {
      r.refund = Math.max(0, p.pkg.price - used * p.pkg.perVisit);
      r.rule = `套票已使用 ${used} 次：已用場次按單次「原價」$${p.pkg.perVisit} 計算，退還差額。`;
    }
    r.extra.push('剩餘場次可免費順延 1 次（原場次 24 小時前提出）。');
    r.extra.push('退款於 7 個工作日內退回原付款方式。');
    return r;
  }
  const threshold = p.kind === 'holiday' ? 72 : 24;
  if (p.hoursBefore < 0) {
    r.refund = 0; r.percent = 0;
    r.rule = '服務開始後取消：不予退款。';
  } else if (p.hoursBefore >= threshold) {
    r.refund = p.total; r.percent = 100;
    r.rule = p.kind === 'holiday'
      ? '連假訂單於開始前 72 小時（含）前取消：全額退款。'
      : '開始前 24 小時（含）前取消：全額退款；改期免費（限 2 次）。';
  } else {
    r.refund = Math.round(p.total * 0.5); r.percent = 50;
    r.rule = p.kind === 'holiday'
      ? '連假訂單於 72 小時內取消：退款 50%。'
      : '開始前 24 小時內取消：退款 50%。';
  }
  r.extra.push('退款於 7 個工作日內退回原付款方式。');
  return r;
}

function fmtMoney(n) { return 'NT$ ' + n.toLocaleString('zh-TW'); }
