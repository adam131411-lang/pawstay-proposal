/* ============ 爪爪日常 — AI 客服小幫手（原型：規則式知識庫，無後端） ============ */
'use strict';

/* ---- 真人客服聯絡方式（原型示意值） ---- */
const CS_PHONE_DISPLAY = '0800-520-885';
const CS_PHONE_TEL = 'tel:0800520885';
const CS_LINE_ID = '@pawfectlife';
const CS_LINE_URL = 'https://line.me/R/ti/p/@pawfectlife';
const CS_HOURS = '09:00–22:00（緊急送醫專線 24 小時）';

const humanAnswer = `當然可以，真人客服在這裡 👩‍💼
<div class="cb-contact">
  <a class="cb-contact-btn" href="${CS_PHONE_TEL}">📞 客服專線 ${CS_PHONE_DISPLAY}</a>
  <a class="cb-contact-btn" href="${CS_LINE_URL}" target="_blank" rel="noopener">💬 LINE 官方帳號 ${CS_LINE_ID}</a>
</div>
服務時間 ${CS_HOURS}。<br>進行中訂單的緊急狀況，請直接用「照護中」頁的 🆘 緊急聯絡按鈕，最快。`;

/* ---- 知識庫：keys 為關鍵詞（任一命中即得分），a 為回答（可含 HTML） ---- */
const CB_KB = [
  { id: 'human', keys: ['真人', '客服', '專員', '打電話', '電話', '轉接', '找人', 'LINE', '賴', '聯繫', '聯絡'],
    a: humanAnswer },
  { id: 'price', keys: ['多少錢', '價格', '收費', '費用', '價目', '牌價', '怎麼算'],
    a: `我們是<b>統一公開牌價</b>，不是保母自訂——誠信看得見 💰<br>
・喵皇居家照護：$400／次（30 分），多貓每加一隻 +$100<br>
・汪汪散步：小型犬 $600／時、中大型 $700、超大型 $800，第二隻 +$200／時<br>
・七日套票：貓 $2,520、狗 $5,670 起（9 折）<br>
完整加值項目價格在「預約」流程裡都看得到，金額明細會逐項列出。` },
  { id: 'surge', keys: ['連假', '過年', '春節', '漲價', '加價', '夜間', '跨區', '中秋'],
    a: `動態加價規則很簡單，而且<b>至少提前 14 天公告，絕不臨時漲價、絕不拒收</b>：<br>
・國定連假／春節 ×1.5<br>・夜間清晨（22:00–07:00）+$150／次<br>・跨區（超過 3km）+$30／km<br>
年費會員<b>免動態加價</b>，還能提前 30 天預約連假時段。` },
  { id: 'cancel', keys: ['取消', '退款', '退費', '改期', '延期', '臨時有事'],
    a: `取消與退款規則：<br>
・一般訂單：開始前 24 小時（含）前取消<b>全額退</b>、改期免費（限 2 次）；24 小時內退 50%；開始後不退<br>
・連假訂單：門檻提前至 <b>72 小時</b><br>
・套票：未用全退；已用按單次原價退差額<br>
・天災、緊急傷病（附證明）、平台原因：<b>全額退</b><br>
退款 7 個工作日內退回原付款方式。到「我的 → 取消／改期試算器」輸入時間，馬上算給你看 🧮` },
  { id: 'trust', keys: ['保母可信', '信任', '可信', '信得過', '安全嗎', '審查', '背景', '陌生人', '放心', '可靠'],
    a: `每位保母都通過<b>三道審查</b>才上架：<br>
1️⃣ 實名認證＋良民證<br>2️⃣ 專業資格（獸醫科系／證照優先，否則平台培訓）<br>3️⃣ 模擬照護實作考核<br>
一句話：自己家的毛孩，敢不敢交給這個人——敢，才上架。` },
  { id: 'insurance', keys: ['保險', '賠付', '賠償', '理賠', '出事', '受傷', '走失'],
    a: `雙層保障：<br>
1️⃣ 平台年度責任險（基礎保障）<br>
2️⃣ <b>安心賠付機制</b>：可歸責事故經數位軌跡定責後，每案最高賠付 <b>$50 萬</b>，7 個工作日內理賠決定<br>
年費會員案件優先走快速通道。` },
  { id: 'track', keys: ['怎麼知道', '有沒有做', '偷懶', '監督', '紀錄', '軌跡', '檢核', 'GPS', '直播', 'Live', '即時'],
    a: `全程<b>數位軌跡</b>，你在 App 都看得到 📱：<br>
・GPS 進退場打卡<br>・進門／餵食／清理／鎖門<b>逐項拍照上傳</b>（檢核表不可跳項）<br>・Live 畫面與散步 GPS 軌跡即時看<br>
服務結束自動生成照顧日誌（照片牆＋保母手記）。點下方「照護中」分頁就能看。` },
  { id: 'member', keys: ['會員', '訂閱', '方案', 'VIP', '權益', '划算'],
    a: `三種訂閱（純權益制）：<br>
・月 $299「萌爪體驗家」：3% 回饋、免金流手續費、$50 券×2／月<br>
・季 $799「金爪愛寵官」：5% 回饋、金牌保母優先媒合、智慧鎖免費租借<br>
・年 $2,499「尊榮白金爪主」：8% 回饋、連假免加價＋提前 30 天預約、理賠快速通道、獸醫圖文諮詢×2／月<br>
到「我的 → 會員方案比較」可以直接切換。` },
  { id: 'coin', keys: ['爪爪幣', '點數', '回饋', '折抵'],
    a: `爪爪幣 <b>1 幣 = 1 元</b>，完成服務後依會員等級回饋（月 3%／季 5%／年 8%），下次預約可折抵。餘額在「我的」頁最上方 🐾` },
  { id: 'emergency', keys: ['緊急', '送醫', '生病', '受傷了', '異常', '急診'],
    a: `保母發現異常會 <b>App 一鍵啟動緊急流程</b>：<br>
24 小時合作醫院綠色通道 → 醫療費平台先代墊 → 同步通知你＋緊急聯絡人。<br>你自己發現異常，也可以在「照護中」頁按 🆘 緊急聯絡。` },
  { id: 'area', keys: ['地區', '範圍', '桃園', '台中', '高雄', '外縣市', '哪裡有'],
    a: `目前服務範圍是<b>台北市・新北市</b>。其他縣市可以先在寵物檔案登記，開區時第一時間通知你 📍` },
  { id: 'entry', keys: ['鑰匙', '門禁', '密碼', '進門', '智慧鎖', '進出'],
    a: `門禁安全這樣做 🔐：<br>
・智慧鎖：系統發<b>限時一次性密碼</b>給保母，逾時自動失效<br>
・傳統鑰匙：放入平台密碼鎖、置於監視器可視範圍<br>
季／年會員可免費租借智慧藍牙鎖（「我的 → 攝影機／智慧鎖租借」申請）。` },
  { id: 'camera', keys: ['攝影機', '監視器', '鏡頭', '錄影', '影像'],
    a: `攝影機<b>免費租借</b>，也可以串聯你自有的攝影機。服務後影像歸你留存，或要求銷毀。到「我的 → 攝影機／智慧鎖租借」申請 📷` },
  { id: 'pack', keys: ['套票', '七日', '長期', '出國', '連續'],
    a: `出遠門推薦七日套票（9 折）✈️：<br>
・貓 $2,520：一日一訪 30 分<br>・狗 $5,670 起（小型犬）：一日兩訪 40 分快照護<br>
未用全退、剩餘場次可免費順延 1 次，彈性很夠。` },
  { id: 'private', keys: ['私下', '加保母', '保母的LINE', '保母的賴', '便宜', '繞過', '自己約'],
    a: `請一定在平台內完成交易 🙏 私下交易會<b>失去</b>：保險保障、送醫代墊、服務存證、爪爪幣回饋——出事就求助無門了。對話有敏感詞偵測，嚴重者停權。保障在平台內才有效。` },
  { id: 'dog_risk', keys: ['會咬人', '攻擊', '兇', '高風險', '惡犬'],
    a: `預約時<b>必須誠實揭露攻擊紀錄</b>（檔案表單有必填題）。有紀錄的犬隻會標示高風險：保母得拒接、平台不強制媒合，我們也不因危險性加價——安全優先於營收。隱瞞紀錄致事故，責任歸飼主。` },
  { id: 'medical', keys: ['餵藥', '點藥', '輸液', '皮下', '打針', '吃藥'],
    a: `醫療照顧加值：餵藥／點眼／擦藥 +$50–150；皮下輸液 +$150–250（依體型），<b>限醫療級保母＋獸醫書面指示</b>。<br>界線很清楚：安撫我們擅長，診斷交給醫生 🩺` },
  { id: 'groom', keys: ['洗澡', '美容', '剪指甲', '梳毛', '清耳'],
    a: `清潔美容加值 🛁：深層梳毛 +$100、洗澡吹乾 +$300／400／500（依體型，限具美容經驗保母）、剪指甲＋清耳 +$100、活動區深度清潔 +$100。預約流程第三步就能加選。` },
  { id: 'exotic', keys: ['異寵', '兔', '鼠', '鳥', '爬蟲', '鸚鵡', '刺蝟'],
    a: `異寵（兔、鼠、鳥、爬蟲等）採<b>專屬詢價</b>，由專責保母依物種評估。首頁點「異寵照護」留下資訊，客服 24 小時內回覆 🦜` },
  { id: 'booking', keys: ['怎麼預約', '如何預約', '預約流程', '下單', '怎麼用'],
    a: `預約超簡單，點下方「預約」分頁：<br>選服務 → 選毛孩 → 挑日期時段 → 加值項目 → 系統媒合 3km 內合格保母 → 金額明細 → 信用卡預授權完成 ✅<br>全程金額透明，完成服務後才實際扣款。` },
  { id: 'pay', keys: ['付款', '刷卡', '信用卡', '扣款', '金流'],
    a: `付款走第三方金流閘道（PCI-DSS），<b>平台不儲存完整卡號</b>。預約時信用卡預授權、服務完成後才自動扣款，訂閱會員免 2% 金流手續費 💳` },
  { id: 'greet', keys: ['你好', '嗨', 'hi', 'hello', '哈囉', '在嗎'],
    a: `你好呀 🐾 我是爪爪小幫手！價格、預約、取消規則、保母審查、保險賠付……都可以問我。也可以點下面的常見問題快速開始。` },
  { id: 'thanks', keys: ['謝謝', '感謝', '辛苦'],
    a: `不客氣！牠不是寵物，是家人——有任何問題隨時再找我 🧡` }
];

const CB_FALLBACK = `這題我還在學習中 🙈 換個關鍵字試試（例如「價格」「取消」「保險」），或點下方常見問題。<br>需要的話也可以直接找真人客服：<br>
<div class="cb-contact">
  <a class="cb-contact-btn" href="${CS_PHONE_TEL}">📞 ${CS_PHONE_DISPLAY}</a>
  <a class="cb-contact-btn" href="${CS_LINE_URL}" target="_blank" rel="noopener">💬 LINE ${CS_LINE_ID}</a>
</div>`;

const CB_CHIPS = ['怎麼收費？', '如何取消退款？', '保母可以信任嗎？', '連假會加價嗎？', '聯繫真人客服'];

function cbAnswer(text) {
  const t = text.toLowerCase();
  let best = null, bestScore = 0;
  for (const item of CB_KB) {
    const score = item.keys.reduce((s, k) => s + (t.includes(k.toLowerCase()) ? (k.length >= 2 ? 2 : 1) : 0), 0);
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return best ? best.a : CB_FALLBACK;
}

/* ============ UI：可拖曳圓鈕 + 聊天面板 ============ */
const CB_POS_KEY = 'pawfect-fab-pos';
let cbOpen = false;
let cbGreeted = false;

function cbInit() {
  const fab = document.createElement('button');
  fab.id = 'cb-fab';
  fab.setAttribute('aria-label', 'AI 客服小幫手');
  fab.innerHTML = `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M4 13a8 8 0 0 1 16 0"/>
    <rect x="2.5" y="12" width="4" height="6.5" rx="2"/>
    <rect x="17.5" y="12" width="4" height="6.5" rx="2"/>
    <path d="M20 18.5v1a3 3 0 0 1-3 3h-3"/></svg>`;
  document.body.appendChild(fab);

  const panel = document.createElement('div');
  panel.id = 'cb-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'AI 客服對話');
  panel.hidden = true;
  panel.innerHTML = `
    <div class="cb-head">
      <span class="cb-ava">🐾</span>
      <div><b>爪爪小幫手</b><div class="cb-sub">AI 客服・原型示範</div></div>
      <button class="cb-x" data-cb="close" aria-label="關閉">✕</button>
    </div>
    <div class="cb-msgs" id="cb-msgs"></div>
    <div class="cb-chips" id="cb-chips">${CB_CHIPS.map(c => `<button class="cb-chip" data-cb="chip">${c}</button>`).join('')}</div>
    <div class="cb-inputrow">
      <input id="cb-in" type="text" placeholder="輸入你的問題…" maxlength="100" aria-label="輸入問題">
      <button class="cb-send" data-cb="send" aria-label="送出">➤</button>
    </div>`;
  document.body.appendChild(panel);

  restoreFabPos(fab);
  makeDraggable(fab);

  panel.addEventListener('click', e => {
    const el = e.target.closest('[data-cb]');
    if (!el) return;
    if (el.dataset.cb === 'close') cbToggle(false);
    if (el.dataset.cb === 'chip') cbAsk(el.textContent);
    if (el.dataset.cb === 'send') cbSendInput();
  });
  panel.querySelector('#cb-in').addEventListener('keydown', e => { if (e.key === 'Enter') cbSendInput(); });
}

function cbToggle(open) {
  cbOpen = open;
  const panel = document.getElementById('cb-panel');
  panel.hidden = !open;
  document.getElementById('cb-fab').classList.toggle('open', open);
  if (open && !cbGreeted) {
    cbGreeted = true;
    cbBot('嗨，我是爪爪小幫手 🐾 關於照護服務的大小事都可以問我；想找真人也沒問題，跟我說一聲就好！');
  }
  if (open) setTimeout(() => panel.querySelector('#cb-in')?.focus(), 150);
}

function cbBubble(html, who) {
  const box = document.getElementById('cb-msgs');
  const b = document.createElement('div');
  b.className = 'cb-msg ' + who;
  b.innerHTML = html;
  box.appendChild(b);
  box.scrollTop = box.scrollHeight;
  return b;
}
function cbBot(html) {
  const typing = cbBubble('<span class="cb-typing"><i></i><i></i><i></i></span>', 'bot');
  setTimeout(() => { typing.innerHTML = html; document.getElementById('cb-msgs').scrollTop = 1e6; }, 450);
}
function cbAsk(q) {
  cbBubble(q.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])), 'user');
  cbBot(cbAnswer(q));
}
function cbSendInput() {
  const inp = document.getElementById('cb-in');
  const q = inp.value.trim();
  if (!q) return;
  inp.value = '';
  cbAsk(q);
}

/* ---- 拖曳：位移 > 8px 視為拖曳（放開自動吸邊），否則視為點擊開關 ---- */
function fabBounds(fab) {
  const phone = document.getElementById('phone').getBoundingClientRect();
  const m = 10, size = fab.offsetWidth;
  return { minX: phone.left + m, maxX: phone.right - size - m, minY: m + 60, maxY: innerHeight - size - 76 };
}
function placeFab(fab) {
  let pos = null;
  try { pos = JSON.parse(localStorage.getItem(CB_POS_KEY)); } catch (e) {}
  const b = fabBounds(fab);
  const x = Math.min(b.maxX, Math.max(b.minX, pos ? pos.x : b.maxX));
  const y = Math.min(b.maxY, Math.max(b.minY, pos ? pos.y : b.maxY - 20));
  fab.style.left = x + 'px'; fab.style.top = y + 'px';
}
function restoreFabPos(fab) {
  placeFab(fab); // 立即定位（不能依賴 rAF：背景分頁不會觸發）
  addEventListener('load', () => placeFab(fab));
  addEventListener('resize', () => placeFab(fab));
}
function makeDraggable(fab) {
  let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false, moved = false;
  fab.addEventListener('pointerdown', e => {
    dragging = true; moved = false;
    sx = e.clientX; sy = e.clientY;
    const r = fab.getBoundingClientRect();
    ox = r.left; oy = r.top;
    try { fab.setPointerCapture(e.pointerId); } catch (err) { /* 合成事件無 pointer 時忽略 */ }
    fab.classList.add('dragging');
  });
  fab.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;
    if (!moved) return;
    const b = fabBounds(fab);
    fab.style.left = Math.min(b.maxX, Math.max(b.minX, ox + dx)) + 'px';
    fab.style.top = Math.min(b.maxY, Math.max(b.minY, oy + dy)) + 'px';
  });
  fab.addEventListener('pointerup', () => {
    dragging = false;
    fab.classList.remove('dragging');
    if (!moved) { cbToggle(!cbOpen); return; }
    // 吸附最近的左右邊
    const b = fabBounds(fab);
    const r = fab.getBoundingClientRect();
    const x = (r.left - b.minX < b.maxX - r.left) ? b.minX : b.maxX;
    fab.style.left = x + 'px';
    localStorage.setItem(CB_POS_KEY, JSON.stringify({ x, y: r.top }));
  });
}

cbInit();
