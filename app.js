'use strict';

const KEY = 'moshimo-vault';
const CATS = {
  sub: { label: 'サブスク・契約', fields: [
    ['name', 'サービス名', 'text', 'Netflix、携帯、電気 など'],
    ['amount', '月額(円)', 'number', '980'],
    ['pay', '支払方法', 'text', '○○カード / 口座引落'],
    ['contact', '解約の連絡先・URL', 'text', 'https://… / 電話番号'],
    ['steps', '解約手順', 'area', '例: マイページ→契約情報→解約'],
    ['login', 'ログイン情報の所在', 'text', '例: 1Passwordの「Netflix」']] },
  bank: { label: '銀行', fields: [
    ['name', '銀行名', 'text', ''], ['branch', '支店名', 'text', ''],
    ['type', '種別', 'text', '普通 / 定期'],
    ['number', '口座番号(下4桁のみ推奨)', 'text', '****1234'],
    ['contact', '連絡先', 'text', ''], ['note', 'メモ', 'area', '通帳・印鑑の保管場所など']] },
  ins: { label: '保険', fields: [
    ['name', '保険会社', 'text', ''], ['product', '商品名', 'text', ''],
    ['no', '証券番号', 'text', ''], ['contact', '連絡先', 'text', ''],
    ['who', '受取人', 'text', ''], ['note', 'メモ', 'area', '']] },
  sec: { label: '証券・投資', fields: [
    ['name', '会社名', 'text', ''], ['no', '口座番号(下4桁のみ推奨)', 'text', ''],
    ['contact', '連絡先', 'text', ''], ['note', 'メモ', 'area', '']] },
  people: { label: '連絡先', fields: [
    ['name', '名前', 'text', ''], ['rel', '関係', 'text', '友人 / 会社 など'],
    ['phone', '電話・連絡方法', 'text', ''], ['note', '伝えてほしいこと', 'area', '']] },
  loc: { label: '保管場所', fields: [
    ['name', '何を', 'text', 'パスワード管理 / 印鑑 / 遺言書'],
    ['place', 'どこに', 'text', ''], ['note', '補足', 'area', '']] },
  msg: { label: 'メッセージ', fields: [
    ['name', '宛先', 'text', '家族へ'], ['note', '内容', 'area', '葬儀・医療の希望、感謝の言葉など']] },
};
const SUMMARY = { sub: 'name', bank: 'name', ins: 'name', sec: 'name', people: 'name', loc: 'name', msg: 'name' };
const SUB2 = { sub: 'amount', bank: 'branch', ins: 'product', sec: 'no', people: 'rel', loc: 'place', msg: 'note' };

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
  mount(
    h('h1', {}, 'もしもノート'),
    h('p', { class: 'sub' }, has ? '合言葉を入力して開きます。' : 'はじめに、このノートを守る合言葉を決めます。'),
    h('div', { class: 'card' }, pass, has ? null : pass2, h('button', { onclick: go }, has ? '開く' : '作成する'), msg),
    has ? h('button', { class: 'ghost', onclick: importScreen }, 'バックアップから復元') : null,
    h('div', { class: 'card warn' },
      h('b', {}, '大切なこと'),
      h('p', {}, '・合言葉を忘れるとデータは誰にも復元できません。紙に書いて金庫など家族が分かる場所に保管してください。'),
      h('p', {}, '・パスワードや暗証番号そのものは入力せず、「どこにあるか」だけを書いてください。'))
  );
}

// ---------- home ----------
function home() {
  const items = db.items.filter((i) => i.cat === tab);
  const subs = db.items.filter((i) => i.cat === 'sub');
  const total = subs.reduce((s, i) => s + (Number(i.d.amount) || 0), 0);
  const tabs = h('div', { class: 'tabs' }, Object.entries(CATS).map(([k, c]) =>
    h('button', { class: k === tab ? 'on' : '', onclick: () => { tab = k; home(); } },
      c.label + ' ' + db.items.filter((i) => i.cat === k).length)));
  mount(
    h('div', { class: 'row' }, h('h1', {}, 'もしもノート'), h('button', { class: 'ghost', onclick: lock }, 'ロック')),
    h('div', { class: 'card' }, h('span', { class: 'sub' }, 'サブスク・契約の月額合計'),
      h('div', { class: 'total' }, total.toLocaleString() + ' 円 / 月'),
      h('span', { class: 'sub' }, '年額 ' + (total * 12).toLocaleString() + ' 円')),
    tabs,
    items.length ? items.map((i) => h('div', { class: 'card item', onclick: () => editScreen(i) },
      h('b', {}, i.d[SUMMARY[tab]] || '(無題)'),
      h('span', {}, (tab === 'sub' && i.d.amount ? Number(i.d.amount).toLocaleString() + '円/月 ' : '') +
        (tab === 'sub' ? '' : String(i.d[SUB2[tab]] || '').slice(0, 40))))) : h('p', { class: 'sub' }, 'まだ登録がありません。'),
    h('button', { onclick: () => editScreen(null) }, '+ ' + CATS[tab].label + 'を追加'),
    h('h2', {}, '家族に渡す・保存する'),
    h('button', { class: 'ghost', onclick: printView }, '印刷 / PDF にする'),
    h('button', { class: 'ghost', onclick: exportBackup }, '暗号化バックアップを書き出す'),
    h('button', { class: 'ghost', onclick: importScreen }, '復元'),
    h('button', { class: 'ghost', onclick: changePass }, '合言葉を変更'),
    h('p', { class: 'sub' }, '※ 3分操作がない、またはアプリを離れると自動でロックされます。')
  );
}

// ---------- edit ----------
function editScreen(item) {
  const cat = item ? item.cat : tab;
  const inputs = {};
  const form = CATS[cat].fields.map(([k, label, type, ph]) => {
    const el = type === 'area' ? h('textarea', { placeholder: ph }) : h('input', { type: type === 'number' ? 'number' : 'text', inputmode: type === 'number' ? 'numeric' : null, placeholder: ph });
    el.value = item ? item.d[k] || '' : '';
    inputs[k] = el;
    return [h('label', {}, label), el];
  });
  const onSave = async () => {
    const d = {}; for (const k in inputs) d[k] = inputs[k].value.trim();
    if (item) item.d = d; else db.items.push({ id: crypto.randomUUID(), cat, d });
    await save(); home();
  };
  const onDel = async () => {
    if (!confirm('削除しますか?')) return;
    db.items = db.items.filter((i) => i !== item); await save(); home();
  };
  mount(
    h('h1', {}, CATS[cat].label + (item ? 'を編集' : 'を追加')),
    h('div', { class: 'card warn' }, 'パスワード・暗証番号・カード番号の全桁は入力しないでください。所在(例:「1Passwordに保管」)だけを書きます。'),
    h('div', { class: 'card' }, form),
    h('button', { onclick: onSave }, '保存'),
    h('button', { class: 'ghost', onclick: home }, '戻る'),
    item ? h('button', { class: 'danger', onclick: onDel }, '削除') : null
  );
}

// ---------- print ----------
function printView() {
  const out = h('div', { id: 'print' }, h('h1', {}, 'もしもノート — 家族へ'),
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
  const a = h('a', { href: URL.createObjectURL(blob), download: 'moshimo-backup-' + new Date().toISOString().slice(0, 10) + '.json' });
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
