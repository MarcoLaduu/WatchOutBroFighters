// Pannello "Account e amici" (sopra il gioco, in HTML): accesso con Google, nome da lottatore,
// coppe, amici (aggiungi, accetta, sfida) e classifica. Più l'avviso delle sfide ricevute.
import { acct, configured, loggedIn, loginGoogle, logout, rpc, errText, onAccount, refreshAccount, suggestedName } from './account.js';

let panel = null, friends = [], msg = '', msgErr = false, timer = null, unsub = null, suggest = null;
let handlers = { onChallenge: () => {}, onClose: () => {} };

export const accountOpen = () => !!panel;

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function openAccount(h = {}) {
  handlers = { onChallenge: () => {}, onClose: () => {}, ...h };
  if (panel) return;
  panel = document.createElement('div');
  panel.className = 'acc';
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') closeAccount(); e.stopPropagation(); });
  panel.addEventListener('click', onClick);
  panel.addEventListener('submit', onSubmit);
  // i tocchi sul pannello non devono arrivare al gioco
  for (const ev of ['touchstart', 'touchmove', 'touchend', 'pointerdown', 'dblclick']) panel.addEventListener(ev, e => e.stopPropagation(), { passive: true });
  document.body.appendChild(panel);
  msg = acct.error || '';
  msgErr = !!msg;
  unsub = onAccount(render);
  render();
  loadTab();
  timer = setInterval(() => { if (loggedIn() && acct.profile && acct.profile.username) loadTab(true); }, 5000);
}

export function closeAccount() {
  if (!panel) return;
  panel.remove(); panel = null;
  clearInterval(timer); timer = null;
  if (unsub) unsub(); unsub = null;
  handlers.onClose();
}

async function loadTab(quiet) {
  if (!loggedIn() || !acct.profile || !acct.profile.username) return;
  try {
    friends = await rpc('friend_list') || [];
    if (!quiet) msg = '';
  } catch (e) { if (!quiet) say(errText(e), true); }
  render();
}

function say(t, err) { msg = t; msgErr = !!err; render(true); }

function render(force) {
  if (!panel) return;
  // mentre si scrive in un campo non si ridisegna da soli; se serve, il testo scritto si rimette a posto
  const focused = panel.querySelector('input:focus');
  if (!force && focused && focused.value) return;
  const typed = {};
  panel.querySelectorAll('form[data-f]').forEach(f => { typed[f.dataset.f] = f.querySelector('input').value; });
  const p = acct.profile;
  let body = '';
  if (!configured()) {
    body = `<p>Gli account non sono ancora configurati.</p><p class="acc-dim">Chi gestisce il gioco deve collegare Supabase (vedi il README, sezione "Account e ranked").</p>`;
  } else if (!loggedIn()) {
    body = `<p>Accedi per avere il tuo account con le coppe, aggiungere amici e giocare le ranked.</p>
      <button class="acc-big" data-a="google"><span class="acc-g">G</span> Accedi con Google</button>
      <p class="acc-dim" style="text-align:center">Accedendo accetti i <a class="acc-link" href="./termini.html" target="_blank" rel="noopener">termini</a> e l'<a class="acc-link" href="./privacy.html" target="_blank" rel="noopener">informativa sulla privacy</a>.</p>`;
  } else if (!p) {
    body = `<p>Carico il profilo...</p>`;
  } else if (!p.username) {
    // primo accesso: si sceglie il nome con cui si compare online (proposto dal nome Google)
    if (suggest === null) { suggest = ''; suggestedName().then(n => { suggest = n; const i = panel && panel.querySelector('form[data-f=name] input'); if (i && !i.value) i.value = n; }); }
    body = `<div class="acc-welcome">BENVENUTO!</div>
      <p>Scegli il tuo nome da lottatore: è quello con cui comparirai online, nella classifica e agli amici.</p>
      <form data-f="name" class="acc-row"><input name="n" maxlength="12" placeholder="Il tuo nome" value="${esc(suggest)}" autocomplete="off" spellcheck="false" /><button>Conferma</button></form>
      <p class="acc-dim">Da 3 a 12 caratteri: lettere, numeri, _ e . — deve essere unico.</p>`;
  } else {
    body = `<div class="acc-me"><span class="acc-name">${esc(p.username)}</span>
      <span class="acc-cup">🏆 ${p.trophies}</span><span class="acc-dim">${p.wins} V · ${p.losses} S</span></div>
      <div class="acc-sub" style="margin-top:4px">Amici${acct.requests ? ` <b class="acc-badge">${acct.requests}</b>` : ''}</div>`;
    body += friendsHtml();
  }
  const links = `<a class="acc-link" href="./privacy.html" target="_blank" rel="noopener">Privacy</a> · <a class="acc-link" href="./termini.html" target="_blank" rel="noopener">Termini</a>`;
  const foot = (loggedIn() && configured()
    ? `<button class="acc-link" data-a="delete">Elimina account</button> · <button class="acc-link" data-a="logout">Esci dall'account</button><br>`
    : '') + links;
  panel.innerHTML = `<div class="acc-box">
    <div class="acc-head"><span>ACCOUNT E AMICI</span><button class="acc-x" data-a="close" aria-label="Chiudi">✕</button></div>
    <div class="acc-body">${body}</div>
    ${msg ? `<div class="acc-msg ${msgErr ? 'err' : ''}">${esc(msg)}</div>` : ''}
    <div class="acc-foot">${foot}</div></div>`;
  panel.querySelectorAll('form[data-f]').forEach(f => { if (typed[f.dataset.f]) f.querySelector('input').value = typed[f.dataset.f]; });
  const inp = panel.querySelector('input');
  if (inp && (focused || !panel.dataset.shown) && !('ontouchstart' in window)) setTimeout(() => inp.focus(), 30);
  panel.dataset.shown = '1';
}

function friendsHtml() {
  const inc = friends.filter(f => f.status === 'incoming');
  const out = friends.filter(f => f.status === 'outgoing');
  const fr = friends.filter(f => f.status === 'friend');
  let h = `<form data-f="add" class="acc-row"><input name="n" maxlength="12" placeholder="Nome dell'amico" autocomplete="off" spellcheck="false" /><button>Aggiungi</button></form>`;
  if (inc.length) h += `<div class="acc-sub">Richieste ricevute</div>` + inc.map(f => `<div class="acc-fr">
      <span class="acc-fn">${esc(f.username)}</span><span class="acc-cup">🏆 ${f.trophies}</span>
      <button data-a="accept" data-id="${f.id}">Accetta</button><button class="acc-no" data-a="remove" data-id="${f.id}">✕</button></div>`).join('');
  if (!fr.length) h += `<p class="acc-dim">Ancora nessun amico: aggiungili con il loro nome da lottatore.</p>`;
  h += fr.map(f => `<div class="acc-fr">
      <span class="acc-dot ${f.online ? 'on' : ''}" title="${f.online ? 'Online' : 'Offline'}"></span>
      <span class="acc-fn">${esc(f.username)}</span><span class="acc-cup">🏆 ${f.trophies}</span>
      <button data-a="challenge" data-id="${f.id}" ${f.online ? '' : 'disabled'}>Sfida</button>
      <button class="acc-no" data-a="remove" data-id="${f.id}" data-ask="1" title="Togli dagli amici">✕</button></div>`).join('');
  if (out.length) h += `<div class="acc-sub">In attesa di risposta</div>` + out.map(f => `<div class="acc-fr">
      <span class="acc-fn">${esc(f.username)}</span><span class="acc-dim">richiesta inviata</span>
      <button class="acc-no" data-a="remove" data-id="${f.id}">Annulla</button></div>`).join('');
  return h;
}

async function onClick(e) {
  const b = e.target.closest('[data-a]');
  if (!b || b.disabled) return;
  const a = b.dataset.a, id = b.dataset.id;
  try {
    if (a === 'close') return closeAccount();
    if (a === 'google') return loginGoogle();
    if (a === 'delete') {
      if (!window.confirm('Eliminare il tuo account? Perderai nome, coppe, amici e partite. Non si può annullare.')) return;
      await rpc('delete_account'); logout(); friends = []; suggest = null; return say('Account eliminato');
    }
    if (a === 'logout') { logout(); friends = []; suggest = null; return say(''); }
    if (a === 'accept') { await rpc('friend_accept', { p_id: id }); say('Ora siete amici!'); refreshAccount(); return loadTab(true); }
    if (a === 'remove') {
      const f = friends.find(x => x.id === id);
      if (b.dataset.ask && !window.confirm(`Togliere ${f ? f.username : ''} dagli amici?`)) return;
      await rpc('friend_remove', { p_id: id }); refreshAccount(); return loadTab(true);
    }
    if (a === 'challenge') {
      const f = friends.find(x => x.id === id);
      if (!f) return;
      const h = handlers; closeAccount(); h.onChallenge(f);
    }
  } catch (err) { say(errText(err), true); }
}

async function onSubmit(e) {
  e.preventDefault();
  const form = e.target, v = (form.querySelector('input').value || '').trim();
  if (!v) return;
  try {
    if (form.dataset.f === 'name') {
      await rpc('set_username', { p_name: v });
      form.querySelector('input').value = '';
      await refreshAccount(); say(`Benvenuto, ${v}! Ora sei in classifica.`); loadTab(true);
    } else if (form.dataset.f === 'add') {
      const r = await rpc('friend_add', { p_name: v });
      form.querySelector('input').value = '';
      say(r && r.status === 'friend' ? `Ora tu e ${v} siete amici!` : `Richiesta mandata a ${v}`);
      loadTab(true);
    }
  } catch (err) { say(errText(err), true); }
}

// ---------- avviso di sfida ricevuta ----------
let toast = null, toastId = null;
const dismissed = new Set();
// mostra (o toglie) l'avviso per la prima sfida in attesa; onAccept/onDecline(invito)
export function syncInviteToast(allowed, onAccept, onDecline) {
  const inv = allowed ? acct.invites.find(i => !dismissed.has(i.id)) : null;
  if (!inv) { if (toast) { toast.remove(); toast = null; toastId = null; } return; }
  if (toast && toastId === inv.id) return;
  if (toast) toast.remove();
  toastId = inv.id;
  toast = document.createElement('div');
  toast.className = 'acc-toast';
  toast.innerHTML = `<div><b>${esc(inv.from)}</b> ti sfida!</div><div class="acc-dim">Partita ranked</div>
    <div class="acc-row"><button data-a="yes">Accetta</button><button class="acc-no" data-a="no">No</button></div>`;
  for (const ev of ['touchstart', 'touchend', 'pointerdown']) toast.addEventListener(ev, e => e.stopPropagation());
  toast.addEventListener('click', e => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    dismissed.add(inv.id);
    toast.remove(); toast = null; toastId = null;
    acct.invites = acct.invites.filter(i => i.id !== inv.id);
    if (b.dataset.a === 'yes') onAccept(inv); else onDecline(inv);
  });
  document.body.appendChild(toast);
}
