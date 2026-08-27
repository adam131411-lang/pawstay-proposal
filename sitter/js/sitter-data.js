/* ============ 爪爪日常 保母端 — 假資料層 ============ */
/* 原型無後端，資料存 localStorage；「我的」頁可重設。
   服務目錄/牌價/連假日與飼主端同源（勾稽《APP開發交接.md》§3）。 */

/* ---- 與飼主端共用的目錄常數（pricing.js 依賴） ---- */
const SERVICES = {
  cat_care:  { name: '喵皇居家無憂照護' },
  dog_walk:  { name: '汪汪活力放電散步' },
  pack7:     { name: '七日套票' },
  exotic:    { name: '異寵照護' }
};
const DOG_WALK_PRICE = { small: 600, medium: 700, xlarge: 800 };
const SIZE_LABEL = { small: '小型犬 <15kg', medium: '中大型犬 15–30kg', xlarge: '超大型犬 >30kg' };
const ADDONS = [
  { id: 'med_feed',   group: '醫療照顧加值', name: '餵藥（口服）',      price: 50,  note: '依獸醫指示餵服' },
  { id: 'med_eye',    group: '醫療照顧加值', name: '點眼藥／擦藥',      price: 100, note: '依獸醫指示執行' },
  { id: 'med_fluid',  group: '醫療照顧加值', name: '皮下輸液',          price: 200, note: '限「醫療級保母」＋獸醫書面指示；平台不診斷', limit: 'medical', bySize: { small: 150, medium: 200, xlarge: 250 } },
  { id: 'groom_brush',group: '清潔美容',     name: '深層梳毛',          price: 100 },
  { id: 'groom_bath', group: '清潔美容',     name: '洗澡吹乾',          price: 300, note: '限具美容經驗保母', limit: 'groom', bySize: { small: 300, medium: 400, xlarge: 500 } },
  { id: 'groom_nail', group: '清潔美容',     name: '剪指甲＋清耳',      price: 100 },
  { id: 'clean_zone', group: '清潔美容',     name: '活動區深度清潔',    price: 100 },
  { id: 'life_hand',  group: '生活支援',     name: '順手服務（10 分內）', price: 50, note: '訂單外事項一律禁止' },
  { id: 'life_buy',   group: '生活支援',     name: '用品代購跑腿',      price: 100 },
  { id: 'life_vet',   group: '生活支援',     name: '陪同就醫（每時）',  price: 500 },
  { id: 'photo_set',  group: '影像紀念',     name: '客製寫真',          price: 200, note: '需影像授權' },
  { id: 'photo_fest', group: '影像紀念',     name: '節慶佈置',          price: 300, note: '需影像授權' }
];
const PLANS = {
  none:  { name: '一般會員', price: '免費', rebate: 0 },
  month: { name: '月・萌爪體驗家', price: '$299／月', rebate: 0.03, perks: [] },
  quarter: { name: '季・金爪愛寵官', price: '$799／季', rebate: 0.05, perks: [] },
  year: { name: '年・尊榮白金爪主', price: '$2,499／年', rebate: 0.08, perks: [] }
};
const HOLIDAYS = ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28'];

/* ---- 拆帳（§3.7）：平台 25%／保母 75%（課稅勞務報酬） ----
   原型假設：分潤基礎 = 訂單額（服務費＋加值＋動態加價），
   不含飼主端金流手續費與平台折價券（平台行銷成本，不影響保母分潤）。 */
const SPLIT = 0.75;
function payout(orderAmount) { return Math.round(orderAmount * SPLIT); }
function platformFee(orderAmount) { return orderAmount - payout(orderAmount); }

/* 訂單額：用與飼主端完全相同的 computeQuote 引擎推算（不吃會員權益/券） */
function orderAmount(qp) {
  const q = computeQuote({ ...qp, tier: 'month', couponCount: 0 });
  return q.service + q.addonsSum + q.surge;
}

const SEED = {
  user: { membership: { tier: 'none' }, coupons: [] }, // pricing.js 相容用，保母端不使用
  online: true,
  declineCount: 0,
  me: {
    id: 'S-02', name: '張士豪', cert_no: 'PL-0132', years: 3, rating: 4.8, orders_count: 386,
    skills: ['大型犬散步', '基礎美容', '洗澡吹乾'], medical_certified: false, gold: true,
    review_steps: [
      { step: '實名認證＋良民證', done: true, ts: '2023-06' },
      { step: '專業資格審查（寵物美容師證照）', done: true, ts: '2023-06' },
      { step: '模擬照護實作考核', done: true, ts: '2023-07' }
    ],
    payout_account: '中國信託 ****3721（週結）'
  },
  jobs: [
    { // 一般貓照護（可接）
      id: 'J-2001', status: 'offer', service_name: '喵皇居家無憂照護', dist_km: 0.8,
      qp: { service: 'cat_care', pets: [{ size_tier: null }], date: '+1d', time: '10:00', addons: [], distanceKm: 0.8 },
      slot: { date: '+1d', time: '10:00', dur: '30 分' },
      pet: { species: 'cat', name: '布丁', breed: '橘貓', age: '成年', tags: ['慢熟', '愛講話'],
             taboos: '不喜歡陌生人直視', feeding: '一日 2 餐（乾糧+罐頭）', entry: '智慧密碼鎖', aggression: null },
      owner_area: '大安區・和平東路二段'
    },
    { // 連假夜間中大型犬散步（高分潤示範）
      id: 'J-2002', status: 'offer', service_name: '汪汪活力放電散步', dist_km: 2.1,
      qp: { service: 'dog_walk', pets: [{ size_tier: 'medium' }], date: '2026-09-26', time: '22:30', hours: 1.5, addons: [], distanceKm: 2.1 },
      slot: { date: '2026-09-26', time: '22:30', dur: '1.5 小時' },
      pet: { species: 'dog', name: '嚕嚕', breed: '哈士奇', age: '成年', size_tier: 'medium', tags: ['活動量高', '愛玩'],
             taboos: '看到貓會暴衝，請握緊牽繩', feeding: '—', entry: '飼主在場', aggression: null },
      owner_area: '大安區・信義路四段'
    },
    { // 含皮下輸液（未認證 → 鎖定示範）
      id: 'J-2003', status: 'offer', service_name: '喵皇居家無憂照護', dist_km: 1.5, requires: 'medical',
      qp: { service: 'cat_care', pets: [{ size_tier: null }], date: '+2d', time: '13:00', addons: ['med_fluid'], distanceKm: 1.5 },
      slot: { date: '+2d', time: '13:00', dur: '30 分' },
      pet: { species: 'cat', name: '雪球', breed: '波斯貓', age: '熟齡', tags: ['腎貓', '溫馴'],
             taboos: '輸液時需毛巾包裹', feeding: '處方乾糧', entry: '管理室代轉', aggression: null,
             vet_note: '已附獸醫書面指示單（每日皮下輸液 100ml）' },
      owner_area: '信義區・松仁路'
    },
    { // 高風險犬（拒接示範）
      id: 'J-2004', status: 'offer', service_name: '汪汪活力放電散步', dist_km: 2.6, high_risk: true,
      qp: { service: 'dog_walk', pets: [{ size_tier: 'xlarge' }], date: '+1d', time: '18:00', hours: 1, addons: [], distanceKm: 2.6 },
      slot: { date: '+1d', time: '18:00', dur: '1 小時' },
      pet: { species: 'dog', name: '大寶', breed: '高加索犬', age: '成年', size_tier: 'xlarge', tags: ['護食', '領域性強'],
             taboos: '對其他公犬敏感',
             feeding: '—', entry: '飼主在場交接',
             aggression: '2025-11 曾咬傷散步中靠近的陌生犬隻（飼主已依規定揭露）' },
      owner_area: '中山區・民權東路'
    },
    { // 進行中（與飼主端 B-1001 金豆散步對戲）
      id: 'J-1001', status: 'active', service_name: '汪汪活力放電散步', dist_km: 1.2,
      qp: { service: 'dog_walk', pets: [{ size_tier: 'small' }], date: 'TODAY', time: '15:30', hours: 1, addons: [], distanceKm: 1.2 },
      slot: { date: 'TODAY', time: '15:30', dur: '1 小時' },
      pet: { species: 'dog', name: '金豆', breed: '柴犬', age: '成年', size_tier: 'small', tags: ['貪吃', '愛跑步'],
             taboos: '打雷會緊張', feeding: '散步後補水', entry: '智慧密碼鎖', aggression: null },
      owner_area: '大安區・復興南路二段', owner_name: '林雅琪',
      otp: '4 7 2 9 1 6', otp_expire_min: 30,
      checkin_ts: '15:28',
      checklist: [
        { item: 'GPS 進場打卡・進門', done: true, ts: '15:28', photo: true },
        { item: '確認毛孩狀態・上胸背帶', done: true, ts: '15:34', photo: true },
        { item: '散步中・全程 GPS 記錄', done: true, ts: '15:40', photo: true },
        { item: '回程・擦腳與飲水', done: false, ts: null, photo: false },
        { item: '鎖門・GPS 退場打卡', done: false, ts: null, photo: false }
      ],
      notes: ''
    },
    /* ---- 本月已完成（收入頁示範） ---- */
    { id: 'J-1801', status: 'done', service_name: '喵皇居家無憂照護', done_date: '-2d',
      qp: { service: 'cat_care', pets: [{ size_tier: null }], date: '-2d', time: '10:00', addons: [], distanceKm: 1 },
      pet: { species: 'cat', name: '麻糬' } },
    { id: 'J-1802', status: 'done', service_name: '喵皇居家無憂照護（餵藥）', done_date: '-4d',
      qp: { service: 'cat_care', pets: [{ size_tier: null }], date: '-4d', time: '10:00', addons: ['med_feed'], distanceKm: 1 },
      pet: { species: 'cat', name: '雪球' } },
    { id: 'J-1803', status: 'done', service_name: '汪汪活力放電散步（兩隻）', done_date: '-7d',
      qp: { service: 'dog_walk', pets: [{ size_tier: 'small' }, { size_tier: 'medium' }], date: '-7d', time: '15:00', hours: 1, addons: [], distanceKm: 2 },
      pet: { species: 'dog', name: '金豆＋嚕嚕' } },
    { id: 'J-1804', status: 'done', service_name: '汪汪活力放電散步（夜間）', done_date: '-10d',
      qp: { service: 'dog_walk', pets: [{ size_tier: 'medium' }], date: '-10d', time: '22:30', hours: 1, addons: [], distanceKm: 4.2 },
      pet: { species: 'dog', name: '嚕嚕' } },
    { id: 'J-1805', status: 'done', service_name: '汪汪活力放電散步（洗澡吹乾）', done_date: '-14d',
      qp: { service: 'dog_walk', pets: [{ size_tier: 'small' }], date: '-14d', time: '10:00', hours: 1, addons: ['groom_bath'], distanceKm: 1 },
      pet: { species: 'dog', name: '金豆' } }
  ],
  messages: [
    { from: 'owner', text: '士豪你好，明天布丁就麻煩你了！罐頭在流理台左邊櫃子。' },
    { from: 'mine', text: '收到！我會依照檔案上的習慣先暖場再餵食，服務中照片都會即時上傳 App。' }
  ]
};

/* 敏感詞（§3.7 私下交易防制） */
const SENSITIVE_WORDS = ['LINE', 'line', '賴', '電話', '手機號', '匯款', '轉帳', '私下', '加我'];

/* ---- localStorage 狀態 ---- */
const LS_KEY = 'pawfect-sitter-v1';
function loadState() {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
  return JSON.parse(JSON.stringify(SEED));
}
function saveState() { localStorage.setItem(LS_KEY, JSON.stringify(DB)); }
function resetState() { localStorage.removeItem(LS_KEY); location.reload(); }
let DB = loadState();

/* 相對日期（與飼主端同款 helper） */
function resolveDate(tag) {
  const d = new Date();
  if (tag === 'TODAY') return d;
  const m = /^([+-])(\d+)d$/.exec(tag);
  if (m) { d.setDate(d.getDate() + (m[1] === '+' ? 1 : -1) * Number(m[2])); return d; }
  return new Date(tag);
}
function fmtDate(d) { return `${d.getMonth() + 1}/${d.getDate()}（${'日一二三四五六'[d.getDay()]}）`; }
