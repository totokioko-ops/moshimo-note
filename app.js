'use strict';

const KEY = 'moshimo-vault';
const VAULTS = ['iPhoneの「パスワード」アプリ(iCloudキーチェーン)', '1Password', 'Bitwarden',
  'Googleパスワードマネージャー', 'ブラウザ(Chrome / Safari)に保存', '紙のメモ', '覚えている(どこにも書いていない)', 'その他'];
const CATS = {
  sub: { label: 'サブスク・契約', fields: [
    ['name', 'サービス名', 'text', 'Netflix、携帯、電気 など'],
    ['amount', '月額(円)', 'number', '980'],
    ['pay', '支払方法', 'text', '○○カード / 口座引落'],
    ['contact', '解約の連絡先・URL', 'text', 'https://… / 電話番号'],
    ['steps', '解約手順', 'area', '例: マイページ→契約情報→解約'],
    ['vault', 'パスワードの保管先', 'sel', VAULTS],
    ['login', '保管先での探し方', 'text', '例: 「Netflix」で検索 / 金庫の青いノート']] },
  net: { label: 'SNS・ネット', fields: [
    ['name', 'サービス名', 'text', 'Google、LINE、Instagram など'],
    ['id', 'ID・登録メールアドレス', 'text', '(パスワードは書かない)'],
    ['wish', 'どうしてほしいか', 'text', '削除 / 追悼アカウント / そのまま'],
    ['contact', '問い合わせ先・URL', 'text', ''],
    ['steps', '手続きの流れ', 'area', ''],
    ['vault', 'パスワードの保管先', 'sel', VAULTS],
    ['login', '保管先での探し方・2段階認証', 'text', '例: 「Google」で検索。2段階認証はスマホ']] },
  card: { label: 'クレジットカード', fields: [
    ['name', 'カード名・会社', 'text', ''],
    ['last4', 'カード番号 下4桁', 'text', '1234'],
    ['pay', '引落口座', 'text', ''],
    ['fee', '年会費', 'text', ''],
    ['contact', '連絡先(カード裏面の電話)', 'text', ''],
    ['purpose', '目的・用途', 'text', '日常の支払い / ネット専用 / 家族カード など'],
    ['note', 'メモ', 'area', '紐づいているサブスク・ETC・家族カードなど']] },
  bank: { label: '銀行', fields: [
    ['name', '銀行名', 'text', ''], ['branch', '支店名', 'text', ''],
    ['type', '種別', 'text', '普通 / 定期'],
    ['number', '口座番号(下4桁のみ推奨)', 'text', '****1234'],
    ['contact', '連絡先', 'text', ''],
    ['purpose', '目的・用途', 'text', '給与受取 / 生活費 / 貯蓄 / 公共料金の引落 など'],
    ['note', 'メモ', 'area', '通帳・印鑑の保管場所など']] },
  ins: { label: '保険', fields: [
    ['name', '保険会社', 'text', ''], ['product', '商品名', 'text', ''],
    ['no', '証券番号', 'text', ''], ['contact', '連絡先', 'text', ''],
    ['who', '受取人', 'text', ''],
    ['purpose', '目的・用途', 'text', '死亡保障 / 医療 / 老後資金 / 車 など'],
    ['note', 'メモ', 'area', '']] },
  sec: { label: '証券・投資', fields: [
    ['name', '会社名', 'text', ''], ['no', '口座番号(下4桁のみ推奨)', 'text', ''],
    ['contact', '連絡先', 'text', ''],
    ['purpose', '目的・用途', 'text', '老後資金 / 教育資金 / NISA / 運用中 など'],
    ['note', 'メモ', 'area', '']] },
  loan: { label: 'ローン・借入', fields: [
    ['name', '借入先', 'text', ''],
    ['kind', '種類', 'text', '住宅 / 車 / カード / 奨学金 / 友人など'],
    ['balance', '残高の目安', 'text', ''],
    ['pay', '返済口座・月額', 'text', ''],
    ['contact', '連絡先', 'text', ''],
    ['guarantor', '保証人・団体信用生命保険', 'text', '有無と内容'],
    ['note', 'メモ', 'area', '契約書の保管場所など']] },
  phone: { label: 'スマホ・端末', fields: [
    ['name', '端末', 'text', 'iPhone 15 など'],
    ['carrier', 'キャリア・契約者名', 'text', ''],
    ['unlock', 'ロック解除(パスコード)の所在', 'text', '番号は書かず、どこにあるかだけ'],
    ['twofa', '2段階認証・認証アプリの所在', 'text', 'スマホが開けないと入れなくなるサービスが多い'],
    ['note', 'メモ', 'area', 'データの扱い(消去・初期化・形見など)の希望']] },
  people: { label: '連絡先', fields: [
    ['name', '名前', 'text', ''], ['rel', '関係', 'text', '友人 / 会社 など'],
    ['phone', '電話・連絡方法', 'text', ''], ['note', '伝えてほしいこと', 'area', '']] },
  loc: { label: '保管場所', fields: [
    ['name', '何を', 'text', 'パスワード管理 / 印鑑 / 遺言書'],
    ['place', 'どこに', 'text', ''], ['note', '補足', 'area', '']] },
  msg: { label: 'メッセージ', fields: [
    ['name', '宛先', 'text', '家族へ'], ['note', '内容', 'area', '葬儀・医療の希望、感謝の言葉など']] },
};
// 解約先の目安。URLは各社の公式トップ(深いページは変わりやすいため)。手順は一般的な流れ
const CLOSE_NOTE = '契約者本人が亡くなった場合は、戸籍謄本などの書類を求められることが多い。事前に窓口へ確認する。';
const PRESETS = [
  ['動画', [
    ['Netflix', 'https://www.netflix.com/cancelplan', 'アカウント → メンバーシップ → メンバーシップのキャンセル'],
    ['Amazon Prime', 'https://www.amazon.co.jp/', 'アカウント&リスト → プライム会員情報 → 会員資格を終了'],
    ['Disney+', 'https://www.disneyplus.com/', 'アカウント → サブスクリプション → 解約(Apple/Google/キャリア経由の場合はその支払元で解約)'],
    ['U-NEXT', 'https://video.unext.jp/', 'アカウント設定 → 契約内容の確認・変更 → 解約'],
    ['Hulu', 'https://www.hulu.jp/', 'アカウント → 契約情報 → 解約']]],
  ['音楽・その他サブスク', [
    ['Spotify', 'https://www.spotify.com/jp/account/', 'アカウント → プランを管理 → プレミアムを解約'],
    ['YouTube Premium', 'https://www.youtube.com/paid_memberships', 'メンバーシップの管理 → 解約'],
    ['Apple Music / iCloud+ など', 'https://support.apple.com/ja-jp/', 'iPhone「設定」→ 上部の名前 → サブスクリプション → 該当を選び「サブスクリプションをキャンセル」'],
    ['Google Play 定期購入', 'https://play.google.com/store/account/subscriptions', 'Playストア → プロフィール → お支払いと定期購入 → 定期購入 → 解約'],
    ['Microsoft 365', 'https://account.microsoft.com/services', 'サービスとサブスクリプション → 管理 → 解約']]],
  ['携帯キャリア', [
    ['docomo', 'https://www.docomo.ne.jp/', '契約者本人がドコモショップ/電話/My docomoで手続き。端末の残債・オプションも要確認。' + CLOSE_NOTE],
    ['au', 'https://www.au.com/', '契約者本人がauショップ/電話/My auで手続き。端末の残債・オプションも要確認。' + CLOSE_NOTE],
    ['SoftBank', 'https://www.softbank.jp/', '契約者本人がソフトバンクショップ/電話/My SoftBankで手続き。端末の残債・オプションも要確認。' + CLOSE_NOTE],
    ['楽天モバイル', 'https://network.mobile.rakuten.co.jp/', 'my 楽天モバイルから手続き。楽天ポイントや楽天のサービスとの紐づけも要確認。' + CLOSE_NOTE]]],
  ['生活', [
    ['NHK', 'https://www.nhk.or.jp/', '住所変更・解約はNHKのお問い合わせまたは受信料の窓口へ連絡'],
    ['電気・ガス・水道', '', '検針票・契約書に記載の連絡先へ。引っ越し・解約日を伝えて停止手続き']]],
];
// 最初に見せる欄(残りは「くわしく入力する」に折りたたむ)
const CORE = {
  sub: ['name', 'amount', 'pay'], net: ['name', 'wish', 'vault'], card: ['name', 'last4'],
  bank: ['name', 'branch', 'purpose'], ins: ['name', 'who'], sec: ['name', 'purpose'],
  loan: ['name', 'balance'], phone: ['name', 'carrier'], people: ['name', 'phone'],
  loc: ['name', 'place'], msg: ['name', 'note'],
};
const MODES = { amount: 'numeric', last4: 'numeric', phone: 'tel' };
const NET_PRESETS = [
  ['SNS', [
    ['LINE', 'https://help.line.me/', '本人以外の削除は難しいので、生前にトーク履歴・アカウントの扱いを決めておく。亡くなった後は、公式ヘルプの案内から問い合わせる'],
    ['X(旧Twitter)', 'https://help.x.com/', '家族は、公式ヘルプの「故人のアカウント」の案内から、削除を問い合わせる'],
    ['Instagram', 'https://help.instagram.com/', '公式ヘルプの「追悼アカウント」または削除の案内から、家族が申請する'],
    ['Facebook', 'https://www.facebook.com/help/', '生前に「追悼アカウント管理人」を設定できる。設定がない場合は、家族が追悼または削除を申請する']]],
  ['アカウント・ID', [
    ['Google アカウント', 'https://myaccount.google.com/inactive', '生前に「無効化管理ツール」で、一定期間使わなかった場合のデータ共有・削除を設定しておける'],
    ['Apple ID', 'https://support.apple.com/ja-jp/', 'iPhone「設定」→ 名前 → サインインとセキュリティ →「デジタル遺産」で、故人アカウント管理連絡先を設定しておける'],
    ['Microsoft アカウント', 'https://account.microsoft.com/', '公式サポートの「故人のアカウント」の案内から、家族が問い合わせる'],
    ['Yahoo! JAPAN ID', 'https://support.yahoo-net.jp/', '公式ヘルプの案内から、家族が問い合わせる'],
    ['楽天ID・ポイント', 'https://www.rakuten.co.jp/', '楽天の窓口に、家族が問い合わせる。ポイント・楽天カード・楽天モバイルなどの紐づけも確認'],
    ['Amazon アカウント', 'https://www.amazon.co.jp/', 'カスタマーサービスに、家族が問い合わせる。Prime・Kindle・定期おトク便なども確認']]],
];
const BANK_STEPS = '名義人の死亡を窓口へ連絡すると口座が凍結される。相続手続きは、戸籍謄本・相続人の本人確認書類などを揃えて、窓口または相続専用の案内から進める(必要書類は事前に問い合わせる)';
const INS_STEPS = '保険会社へ連絡し、保険金の請求書類を取り寄せる。証券番号と死亡診断書などが必要。請求には期限があるので早めに連絡する';
const SEC_STEPS = '名義人の死亡を連絡すると取引が停止される。相続手続きで口座を移管、または売却・解約する。保有銘柄の一覧、NISA・特定口座の有無を伝える';
const pick = (steps, list) => list.map(([n, url]) => [n, url, steps]);
const BANK_PRESETS = [
  ['メガバンク・大手', pick(BANK_STEPS, [
    ['三菱UFJ銀行', 'https://www.bk.mufg.jp/'], ['三井住友銀行', 'https://www.smbc.co.jp/'],
    ['みずほ銀行', 'https://www.mizuhobank.co.jp/'], ['りそな銀行', 'https://www.resona-gr.co.jp/'],
    ['三井住友信託銀行', 'https://www.smtb.jp/'], ['ゆうちょ銀行', 'https://www.jp-bank.japanpost.jp/']])],
  ['ネット銀行', pick(BANK_STEPS, [
    ['楽天銀行', 'https://www.rakuten-bank.co.jp/'], ['PayPay銀行', 'https://www.paypay-bank.co.jp/'],
    ['住信SBIネット銀行', 'https://www.netbk.co.jp/'], ['ソニー銀行', 'https://moneykit.net/'],
    ['auじぶん銀行', 'https://www.jibunbank.co.jp/']])],
  ['その他', pick(BANK_STEPS, [['地方銀行・信用金庫・信用組合', '']])],
];
const INS_PRESETS = [
  ['生命保険', pick(INS_STEPS, [
    ['日本生命', 'https://www.nissay.co.jp/'], ['第一生命', 'https://www.dai-ichi-life.co.jp/'],
    ['明治安田生命', 'https://www.meijiyasuda.co.jp/'], ['住友生命', 'https://www.sumitomolife.co.jp/'],
    ['かんぽ生命', 'https://www.jp-life.japanpost.jp/'], ['アフラック', 'https://www.aflac.co.jp/'],
    ['ライフネット生命', 'https://www.lifenet-seimei.co.jp/']])],
  ['損害保険・共済', pick(INS_STEPS, [
    ['東京海上日動', 'https://www.tokiomarine-nichido.co.jp/'], ['損保ジャパン', 'https://www.sompo-japan.co.jp/'],
    ['三井住友海上', 'https://www.ms-ins.com/'], ['JA共済', 'https://www.ja-kyosai.or.jp/']])],
];
const SEC_PRESETS = [
  ['ネット証券', pick(SEC_STEPS, [
    ['SBI証券', 'https://www.sbisec.co.jp/'], ['楽天証券', 'https://www.rakuten-sec.co.jp/'],
    ['マネックス証券', 'https://www.monex.co.jp/'], ['松井証券', 'https://www.matsui.co.jp/']])],
  ['大手証券', pick(SEC_STEPS, [
    ['野村證券', 'https://www.nomura.co.jp/'], ['大和証券', 'https://www.daiwa.jp/'],
    ['SMBC日興証券', 'https://www.smbcnikko.co.jp/'], ['みずほ証券', 'https://www.mizuho-sc.com/']])],
];
const PRESET_MAP = { sub: PRESETS, net: NET_PRESETS, bank: BANK_PRESETS, ins: INS_PRESETS, sec: SEC_PRESETS };
const ICONS = { sub: '🔁', net: '🌐', card: '💳', bank: '🏦', ins: '🛡️', sec: '📈', loan: '🧾', phone: '📱', people: '👥', loc: '📍', msg: '✉️' };
const LOGO = '<svg viewBox="0 0 48 48"><rect width="48" height="48" rx="14" fill="#1c2b4a"/>' +
  '<path d="M24 9.5l11.5 4.2v9.3c0 8.2-5 13.4-11.5 15.5C17.5 36.4 12.5 31.2 12.5 23v-9.3z" fill="none" stroke="#d6b26a" stroke-width="2.2" stroke-linejoin="round"/>' +
  '<path d="M18.8 24l4 4 7-8" fill="none" stroke="#d6b26a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SUMMARY = { sub: 'name', net: 'name', card: 'name', bank: 'name', ins: 'name', sec: 'name', loan: 'name', phone: 'name', people: 'name', loc: 'name', msg: 'name' };
const SUB2 = { sub: 'amount', net: 'wish', card: 'last4', bank: 'branch', ins: 'product', sec: 'no', loan: 'kind', phone: 'carrier', people: 'rel', loc: 'place', msg: 'note' };

const $app = document.getElementById('app');
const enc = new TextEncoder(), dec = new TextDecoder();
let cryptoKey = null, salt = null, db = { items: [] };
let tab = 'sub', lockTimer = null;

// ---------- crypto ----------
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function deriveKey(pass, saltBytes) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: saltBytes, iterations: 300000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function seal() {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, enc.encode(JSON.stringify(db))));
  return JSON.stringify({ v: 1, salt: b64(salt), iv: b64(iv), ct: b64(ct) });
}
async function save() { localStorage.setItem(KEY, await seal()); }
async function openBlob(blobText, pass) {
  const o = JSON.parse(blobText);
  const s = unb64(o.salt), k = await deriveKey(pass, s);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, k, unb64(o.ct));
  salt = s; cryptoKey = k; db = JSON.parse(dec.decode(plain));
}

// ---------- ui helpers ----------
function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of kids.flat(Infinity)) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
function logo() { const s = h('span', { class: 'ico' }); s.innerHTML = LOGO; return s; }
function mount(...nodes) { $app.replaceChildren(...nodes.flat(Infinity).filter(Boolean)); window.scrollTo(0, 0); }
function resetLockTimer() {
  clearTimeout(lockTimer);
  if (cryptoKey) lockTimer = setTimeout(lock, 3 * 60 * 1000);
}
function lock() { cryptoKey = null; db = { items: [] }; clearTimeout(lockTimer); lockScreen(); }
['click', 'keydown', 'touchstart'].forEach((ev) => document.addEventListener(ev, resetLockTimer, { passive: true }));
document.addEventListener('visibilitychange', () => { if (document.hidden && cryptoKey) lock(); });

// ---------- lock / setup ----------
function lockScreen() {
  const has = !!localStorage.getItem(KEY);
  const pass = h('input', { type: 'password', placeholder: '合言葉', autocomplete: 'off' });
  const pass2 = h('input', { type: 'password', placeholder: '合言葉(確認)', autocomplete: 'off' });
  const msg = h('p', { class: 'sub' });
  const go = async () => {
    msg.textContent = '';
    try {
      if (has) {
        await openBlob(localStorage.getItem(KEY), pass.value);
      } else {
        if (pass.value.length < 8) { msg.textContent = '合言葉は8文字以上にしてください'; return; }
        if (pass.value !== pass2.value) { msg.textContent = '確認用と一致しません'; return; }
        salt = crypto.getRandomValues(new Uint8Array(16));
        cryptoKey = await deriveKey(pass.value, salt);
        db = { items: [] };
        await save();
      }
      resetLockTimer(); home();
    } catch { msg.textContent = '合言葉が違うか、データが壊れています'; }
  };
  pass.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  mount(h('div', { class: 'lock' },
    h('div', { class: 'logo' }, logo()),
    h('h1', {}, 'おまもり帳'),
    h('p', { class: 'sub' }, has ? '合言葉を入力して開きます' : 'はじめに、このノートを守る合言葉を決めます'),
    h('div', { class: 'card' }, pass, has ? null : pass2, h('button', { onclick: go }, has ? '開く' : '作成する'), msg),
    has ? h('button', { class: 'ghost', onclick: importScreen }, 'バックアップから復元') : null,
    h('div', { class: 'card warn' },
      h('b', {}, '大切なこと'),
      h('p', {}, '・合言葉を忘れるとデータは誰にも復元できません。紙に書いて金庫など家族が分かる場所に保管してください。'),
      h('p', {}, '・パスワードや暗証番号そのものは入力せず、「どこにあるか」だけを書いてください。'))
  ));
}

// ---------- home ----------
function home() {
  const items = db.items.filter((i) => i.cat === tab);
  const subs = db.items.filter((i) => i.cat === 'sub');
  const yen = (v) => Number(String(v || '').replace(/[^\d.]/g, '')) || 0;
  const total = subs.reduce((s, i) => s + yen(i.d.amount), 0);
  const tabs = h('div', { class: 'tabs' }, Object.entries(CATS).map(([k, c]) =>
    h('button', { class: k === tab ? 'on' : '', onclick: () => { tab = k; home(); } },
      ICONS[k] + ' ' + c.label, h('i', {}, db.items.filter((i) => i.cat === k).length || ''))));
  const action = (ico, label, fn) => h('button', { class: 'row-btn', onclick: fn },
    h('span', { class: 'ri' }, ico), h('span', {}, label), h('span', { class: 'chev' }, '›'));
  const meta = (i) => tab === 'card' ? [i.d.last4 && '**** ' + i.d.last4, i.d.pay].filter(Boolean).join(' ・ ')
    : tab === 'sub'
    ? [yen(i.d.amount) ? '¥' + yen(i.d.amount).toLocaleString() + ' / 月' : '', i.d.pay].filter(Boolean).join(' ・ ')
    : String(i.d[SUB2[tab]] || '');
  mount(
    h('header', { class: 'top' },
      h('div', { class: 'brand' }, logo(), 'おまもり帳'),
      h('button', { class: 'icon-btn', onclick: lock, 'aria-label': 'ロック' }, '🔒')),
    h('section', { class: 'hero' },
      h('div', { class: 'hero-l' }, 'サブスク・契約  月額合計'),
      h('div', { class: 'hero-n' }, h('small', {}, '¥'), total.toLocaleString()),
      h('div', { class: 'hero-s' }, '年額 ¥' + (total * 12).toLocaleString() + '  ・  登録 ' + db.items.length + ' 件')),
    db.items.length ? null : h('div', { class: 'start' },
      h('b', {}, 'はじめましょう'),
      h('p', { class: 'sub' }, '名前だけでも大丈夫です。あとから足せます。まず3つ入れてみましょう。'),
      h('div', { class: 'rows' },
        [['sub', 'サブスク・契約を入れる'], ['bank', '銀行を入れる'], ['people', '連絡してほしい人を入れる']]
          .map(([k, label], n) => action(ICONS[k], (n + 1) + '. ' + label, () => { tab = k; editScreen(null); })))),
    tabs,
    h('div', { class: 'sect' }, CATS[tab].label),
    items.length
      ? items.map((i) => h('div', { class: 'item', onclick: () => editScreen(i) },
        h('div', { class: 'ic' }, ICONS[tab]),
        h('div', { class: 'tx' }, h('b', {}, i.d[SUMMARY[tab]] || '(無題)'), h('span', { class: 'm' }, meta(i))),
        h('span', { class: 'chev' }, '›')))
      : h('div', { class: 'empty' }, h('div', {}, ICONS[tab]), 'まだ登録がありません', h('br'), '右下の ＋ から追加できます'),
    h('div', { class: 'sect' }, '家族に渡す・保存する'),
    h('div', { class: 'rows' },
      action('🖨️', '印刷 / PDF にする', printView),
      action('💾', '暗号化バックアップを書き出す', exportBackup),
      action('📂', 'バックアップから復元', importScreen),
      action('🔑', '合言葉を変更', changePass)),
    h('p', { class: 'foot' }, '3分操作がない、またはアプリを離れると自動でロックします'),
    h('button', { class: 'fab', onclick: () => editScreen(null), 'aria-label': CATS[tab].label + 'を追加' }, '+')
  );
}

// ---------- edit ----------
function editScreen(item) {
  const cat = item ? item.cat : tab;
  const inputs = {};
  const rows = CATS[cat].fields.map(([k, label, type, ph]) => {
    const el = type === 'area' ? h('textarea', { placeholder: ph })
      : type === 'sel' ? h('select', {}, h('option', { value: '' }, '選ばない'), ph.map((o) => h('option', { value: o }, o)))
      : h('input', { type: 'text', inputmode: MODES[k] || null, placeholder: ph, autocomplete: 'off', autocapitalize: 'off', enterkeyhint: 'next' });
    el.value = item ? item.d[k] || '' : (k === 'vault' ? db.vaultDefault || '' : '');
    inputs[k] = el;
    return { k, node: [h('label', {}, label + (k === 'name' ? ' *' : '')), el] };
  });
  const core = CORE[cat];
  const more = rows.filter((r) => !core.includes(r.k));
  const form = rows.filter((r) => core.includes(r.k)).map((r) => r.node);
  const details = more.length
    ? h('details', { class: 'more', open: item && more.some((r) => inputs[r.k].value) ? '' : null },
      h('summary', {}, 'くわしく入力する(任意)'), more.map((r) => r.node))
    : null;
  const err = h('p', { class: 'err' });
  let picker = null;
  const presets = PRESET_MAP[cat];
  if (presets) {
    const sel = h('select', {}, h('option', { value: '' }, '選んで自動入力…'),
      presets.map(([g, list]) => h('optgroup', { label: g },
        list.map(([n], i) => h('option', { value: g + '|' + i }, n)))));
    sel.addEventListener('change', () => {
      if (!sel.value) return;
      const [g, i] = sel.value.split('|');
      const [name, contact, steps] = presets.find((p) => p[0] === g)[1][i];
      inputs.name.value = name;
      if (!inputs.contact.value) inputs.contact.value = contact;
      const steps_el = inputs.steps || inputs.note;
      if (steps_el && !steps_el.value) steps_el.value = steps;
      if (details) details.open = true;
    });
    picker = [h('label', {}, '一覧から選ぶ(任意)'), sel,
      h('p', { class: 'sub' }, '※ 内容は目安です。URLや手順は変わることがあるので、公式サイトで確認してください。')];
  }
  const onSave = async () => {
    const d = {}; for (const k in inputs) d[k] = inputs[k].value.trim();
    if (!d.name) { err.textContent = CATS[cat].fields[0][1] + 'を入力してください'; inputs.name.focus(); return; }
    if (d.vault) db.vaultDefault = d.vault;
    if (item) item.d = d; else db.items.push({ id: crypto.randomUUID(), cat, d });
    await save(); home();
  };
  const onDel = async () => {
    if (!confirm('削除しますか?')) return;
    db.items = db.items.filter((i) => i !== item); await save(); home();
  };
  mount(
    h('h1', {}, CATS[cat].label + (item ? 'を編集' : 'を追加')),
    h('p', { class: 'hint' }, '🔒 パスワード・暗証番号は書かず、「保管先」だけ記録します。'),
    h('div', { class: 'card' }, picker, form, details, err),
    item ? h('button', { class: 'danger', onclick: onDel }, 'この項目を削除') : null,
    h('div', { class: 'savebar' },
      h('button', { class: 'ghost', onclick: home }, '戻る'),
      h('button', { onclick: onSave }, '保存'))
  );
}

// ---------- print ----------
function printView() {
  const out = h('div', { id: 'print' }, h('h1', {}, 'おまもり帳 — 家族へ'),
    h('p', {}, '作成日: ' + new Date().toLocaleDateString('ja-JP')));
  for (const [k, c] of Object.entries(CATS)) {
    const list = db.items.filter((i) => i.cat === k);
    if (!list.length) continue;
    out.append(h('h2', {}, c.label));
    for (const i of list) out.append(h('div', { class: 'card' },
      c.fields.filter(([f]) => i.d[f]).map(([f, l]) => h('div', { class: 'pf' }, h('em', {}, l + ': '), i.d[f]))));
  }
  const back = h('div', {}, h('button', { onclick: home }, '戻る'),
    h('p', { class: 'sub' }, '印刷ダイアログで「PDFとして保存」もできます。この書類には機密情報が含まれます。保管に注意してください。'));
  mount(back, out);
  setTimeout(() => window.print(), 100);
}

// ---------- backup ----------
async function exportBackup() {
  const blob = new Blob([await seal()], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: 'omamori-backup-' + new Date().toISOString().slice(0, 10) + '.json' });
  document.body.append(a); a.click(); a.remove();
}
function importScreen() {
  const file = h('input', { type: 'file', accept: '.json,application/json' });
  const pass = h('input', { type: 'password', placeholder: 'バックアップ作成時の合言葉' });
  const msg = h('p', { class: 'sub' });
  const go = async () => {
    try {
      const text = await file.files[0].text();
      await openBlob(text, pass.value);
      localStorage.setItem(KEY, text); resetLockTimer(); home();
    } catch { msg.textContent = '復元できません。ファイルまたは合言葉を確認してください。'; }
  };
  mount(h('h1', {}, '復元'),
    h('div', { class: 'card warn' }, '現在の端末内データは置き換えられます。'),
    h('div', { class: 'card' }, file, pass, h('button', { onclick: go }, '復元する'), msg),
    h('button', { class: 'ghost', onclick: () => (cryptoKey ? home() : lockScreen()) }, '戻る'));
}
function changePass() {
  const p1 = h('input', { type: 'password', placeholder: '新しい合言葉(8文字以上)' });
  const p2 = h('input', { type: 'password', placeholder: '確認' });
  const msg = h('p', { class: 'sub' });
  const go = async () => {
    if (p1.value.length < 8 || p1.value !== p2.value) { msg.textContent = '8文字以上で、確認と一致させてください'; return; }
    salt = crypto.getRandomValues(new Uint8Array(16));
    cryptoKey = await deriveKey(p1.value, salt);
    await save(); alert('変更しました。古いバックアップは古い合言葉のままです。新しく書き出し直してください。'); home();
  };
  mount(h('h1', {}, '合言葉を変更'), h('div', { class: 'card' }, p1, p2, h('button', { onclick: go }, '変更'), msg),
    h('button', { class: 'ghost', onclick: home }, '戻る'));
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
lockScreen();
