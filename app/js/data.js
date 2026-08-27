/* ============ 爪爪日常 — 假資料層（§6 資料模型） ============ */
/* 注意：原型無後端，資料存 localStorage；「重設示範資料」在「我的」頁。 */

const SEED = {
  user: {
    id: 'U-001', name: '林雅琪', phone: '0912-345-678', line_id: 'yachi_lin',
    area: '台北市・大安區', emergency_contact: '林先生 0987-654-321',
    membership: { tier: 'quarter', expiry: '2026-11-05', paw_coins: 1280 },
    coupons: [
      { id: 'CP-1', name: '$50 折價券（會員月贈）', value: 50, expiry: '2026-08-31' },
      { id: 'CP-2', name: '$50 折價券（會員月贈）', value: 50, expiry: '2026-08-31' }
    ]
  },

  pets: [
    {
      id: 'P-001', owner_id: 'U-001', species: 'cat', name: '麻糬', age_band: '成年',
      sex_neutered: '母・已絕育', breed: '美國短毛貓', size_tier: null,
      vaccines: '三合一（2026-03 補強）', health: ['健康良好'], meds: '無', vet_clinic: '大安 毛安動物醫院',
      temperament: { stranger: '慢熟，需 10 分鐘暖場', energy: '中', tags: ['愛撒嬌', '怕吸塵器'], taboos: '不喜歡被摸肚子' },
      dog: null,
      care: { feeding: '一日 2 餐（乾糧+罐頭）', diet: ['處方乾糧'], special: [], cleaning: ['鏟砂', '換水'] },
      home: { type: '電梯大樓', entry: '智慧密碼鎖', camera: '已有攝影機（願意串聯）', notes: '玄關左手邊是貓砂區' }
    },
    {
      id: 'P-002', owner_id: 'U-001', species: 'dog', name: '金豆', age_band: '成年',
      sex_neutered: '公・已絕育', breed: '柴犬', size_tier: 'small',
      vaccines: '八合一+狂犬病（2026-01）', health: ['健康良好'], meds: '無', vet_clinic: '大安 毛安動物醫院',
      temperament: { stranger: '友善，見人就搖尾巴', energy: '高', tags: ['貪吃', '愛跑步'], taboos: '打雷會緊張' },
      dog: { social: '可與其他狗同行', walk: '每日 1 次、每次 1 小時', aggression_record: 'none' },
      care: { feeding: '一日 2 餐', diet: ['一般乾糧'], special: [], cleaning: ['擦腳', '梳毛'] },
      home: { type: '電梯大樓', entry: '智慧密碼鎖', camera: '需要免費租借', notes: '牽繩掛在門後掛勾' }
    }
  ],

  sitters: [
    { id: 'S-01', name: '林佳蓉', cert_no: 'PL-0087', years: 4, skills: ['貓行為安撫', '餵藥', '皮下輸液'], rating: 4.9, orders_count: 512, medical_certified: true, gold: true, dist_km: 1.2, intro: '獸醫助理出身，擅長慢熟貓與醫療照護。' },
    { id: 'S-02', name: '張士豪', cert_no: 'PL-0132', years: 3, skills: ['大型犬散步', '基礎美容', '洗澡吹乾'], rating: 4.8, orders_count: 386, medical_certified: false, gold: true, dist_km: 2.1, intro: '前寵物美容師，中大型犬放電專家。' },
    { id: 'S-03', name: '黃郁婷', cert_no: 'PL-0215', years: 1, skills: ['貓照護', '異寵照護'], rating: 4.6, orders_count: 97, medical_certified: false, gold: false, dist_km: 2.8, intro: '完成平台培訓與實作考核，細心負責。' }
  ],

  bookings: [
    { // 進行中：驅動首頁狀態卡與照護中畫面
      id: 'B-1001', service: 'dog_walk', service_name: '汪汪活力放電散步', pet_ids: ['P-002'], sitter_id: 'S-02',
      slots: [{ date: 'TODAY', time: '15:30', hours: 1 }], addons: [],
      pricing: { base: 600, size_adj: 0, multi_pet: 0, addons: 0, surge: 0, member_discount: 0, total: 600 },
      status: 'in_service', is_holiday: false, live_url: 'assets/app/livecam.jpg',
      checklist: [
        { item: 'GPS 進場打卡・進門', done: true, ts: '15:28', photo: true },
        { item: '確認毛孩狀態・上胸背帶', done: true, ts: '15:34', photo: true },
        { item: '散步中・全程 GPS 記錄', done: true, ts: '15:40', photo: true },
        { item: '回程・擦腳與飲水', done: false, ts: null, photo: false },
        { item: '鎖門・GPS 退場打卡', done: false, ts: null, photo: false }
      ],
      gps_track: true
    },
    { // 已媒合（未開始）：驅動取消/改期試算
      id: 'B-1002', service: 'cat_care', service_name: '喵皇居家無憂照護', pet_ids: ['P-001'], sitter_id: 'S-01',
      slots: [{ date: '+2d', time: '10:00', hours: 0.5 }], addons: [{ id: 'med_feed', name: '餵藥', price: 50 }],
      pricing: { base: 400, size_adj: 0, multi_pet: 0, addons: 50, surge: 0, member_discount: 0, total: 450 },
      status: 'matched', is_holiday: false
    },
    { // 已完成：驅動照顧日誌
      id: 'B-1003', service: 'cat_care', service_name: '喵皇居家無憂照護', pet_ids: ['P-001'], sitter_id: 'S-01',
      slots: [{ date: '-3d', time: '10:00', hours: 0.5 }], addons: [],
      pricing: { base: 400, size_adj: 0, multi_pet: 0, addons: 0, surge: 0, member_discount: 0, total: 400 },
      status: 'done', is_holiday: false,
      care_log: {
        photos: ['assets/svc/svc-cat.jpg', 'assets/bg/final-cat.jpg', 'assets/app/livecam.jpg'],
        notes: '麻糬今天狀態很好，暖場 5 分鐘後就主動蹭人。乾糧吃了 8 成、罐頭全吃完，水碗換新。砂盆兩處都清了，尿量正常。離開前陪玩逗貓棒 10 分鐘，有確實鎖門。',
        rating_owner: 0, rating_sitter: 5
      }
    }
  ]
};

/* ---- 服務目錄（§3.1 牌價） ---- */
const SERVICES = {
  cat_care:  { name: '喵皇居家無憂照護', tagline: '$400／次（30 分）', img: 'assets/svc/svc-cat.jpg',  species: 'cat' },
  dog_walk:  { name: '汪汪活力放電散步', tagline: '$600 起／時',        img: 'assets/svc/svc-dog.jpg',  species: 'dog' },
  pack7:     { name: '七日套票',         tagline: '貓 $2,520・狗 $5,670 起', img: 'assets/svc/svc-pack.jpg', species: 'any' },
  exotic:    { name: '異寵照護',         tagline: '專屬詢價',            img: 'assets/svc/svc-exotic.jpg', species: 'exotic' }
};

const DOG_WALK_PRICE = { small: 600, medium: 700, xlarge: 800 };
const SIZE_LABEL = { small: '小型犬 <15kg', medium: '中大型犬 15–30kg', xlarge: '超大型犬 >30kg' };

/* ---- 加值項目（§3.1）。limit: 醫療級/美容經驗限制 ---- */
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

/* ---- 會員方案（§3.3） ---- */
const PLANS = {
  none:    { name: '一般會員', price: '免費', rebate: 0 },
  month:   { name: '月・萌爪體驗家',   price: '$299／月',   rebate: 0.03, perks: ['爪爪幣 3% 回饋', '免 2% 金流手續費', '$50 折價券 ×2／月'] },
  quarter: { name: '季・金爪愛寵官',   price: '$799／季',   rebate: 0.05, perks: ['爪爪幣 5% 回饋', '金牌保母（4.8★↑）優先媒合・等待 -50%', '智慧藍牙鎖免費租借'] },
  year:    { name: '年・尊榮白金爪主', price: '$2,499／年', rebate: 0.08, perks: ['爪爪幣 8% 回饋', '連假提前 30 天預約＋免動態加價', '安心賠付優先快速理賠通道', '獸醫圖文諮詢每月 2 次'] }
};

/* ---- 連假日（示範用假設值：2026 中秋＋教師節連假） ---- */
const HOLIDAYS = ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28'];

/* ---- localStorage 狀態 ---- */
const LS_KEY = 'pawfect-app-v1';
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* 壞資料就重來 */ }
  return JSON.parse(JSON.stringify(SEED));
}
function saveState() { localStorage.setItem(LS_KEY, JSON.stringify(DB)); }
function resetState() { localStorage.removeItem(LS_KEY); location.reload(); }
let DB = loadState();

/* 相對日期解析（讓示範資料永遠「活著」） */
function resolveDate(tag) {
  const d = new Date();
  if (tag === 'TODAY') return d;
  const m = /^([+-])(\d+)d$/.exec(tag);
  if (m) { d.setDate(d.getDate() + (m[1] === '+' ? 1 : -1) * Number(m[2])); return d; }
  return new Date(tag);
}
function fmtDate(d) {
  return `${d.getMonth() + 1}/${d.getDate()}（${'日一二三四五六'[d.getDay()]}）`;
}
function bookingStart(b) {
  const d = resolveDate(b.slots[0].date);
  const [h, mi] = b.slots[0].time.split(':').map(Number);
  d.setHours(h, mi, 0, 0);
  return d;
}
