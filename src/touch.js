// Comandi touch per telefono e tablet: croce a sinistra, Pugno / Calcio / Parata a destra,
// tasto Super quando la barra è piena e tasto pausa in alto. Sono elementi HTML sopra il gioco:
// scrivono nello stato del G1 in input.js. I tocchi fuori dai tasti servono per i menu.
import { W, H } from './config.js';
import { setTouch, releaseTouch, pushTap, isTouch, setTouchMode, padType, pushTouchSpecial } from './input.js';
import { METER_MAX, SPECIALS, slotCodes } from './game/specials.js';

let root = null, dpadKnob = null, superBtn = null, labels = {}, spBox = null, spFor = null, fsBox = null;
let askedFullscreen = false;

const el = (tag, cls, html = '') => { const e = document.createElement(tag); e.className = cls; e.innerHTML = html; return e; };
const buzz = () => { try { navigator.vibrate && navigator.vibrate(8); } catch { /* niente vibrazione */ } };

const canFullscreen = () => !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
const isFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
// aperto dall'icona sulla schermata Home (già a schermo intero, senza barre del browser)
const isStandalone = () => (typeof matchMedia !== 'undefined' && (matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches)) || navigator.standalone === true;
let fsDismissed = false;
try { fsDismissed = sessionStorage.getItem('wob-fs-ok') === '1'; } catch { /* niente memoria */ }

// Schermo intero e orizzontale, dove il browser lo permette (Android sì, iPhone no: lì si usa l'icona sulla Home).
function goFullscreen(force = false) {
  if (askedFullscreen && !force) return;
  askedFullscreen = true;
  const d = document.documentElement;
  const req = d.requestFullscreen || d.webkitRequestFullscreen;
  if (!req || isFullscreen()) return;
  try {
    const p = req.call(d, { navigationUI: 'hide' });
    if (p && p.then) p.then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {});
  } catch { /* non supportato */ }
}

function makeDpad() {
  const pad = el('div', 'tc-dpad', '<span class="u">▲</span><span class="d">▼</span><span class="l">◀</span><span class="r">▶</span>');
  dpadKnob = el('div', 'tc-knob');
  pad.appendChild(dpadKnob);
  let id = null;
  const dirs = { left: false, right: false, up: false, down: false };
  const apply = (nd) => {
    for (const k in dirs) if (nd[k] !== dirs[k]) { dirs[k] = nd[k]; setTouch(k, nd[k]); if (nd[k]) buzz(); }
  };
  const move = e => {
    const r = pad.getBoundingClientRect(), R = r.width / 2;
    let dx = (e.clientX - r.left - R) / R, dy = (e.clientY - r.top - R) / R;
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    dpadKnob.style.transform = `translate(${dx * R * 0.45}px, ${dy * R * 0.45}px)`;
    if (len < 0.28) return apply({ left: false, right: false, up: false, down: false });
    // 8 direzioni: una diagonale accende due frecce
    const a = Math.atan2(dy, dx), s = Math.PI / 8;
    apply({
      right: Math.abs(a) < 3 * s,
      left: Math.abs(a) > 5 * s,
      down: a > s && a < 7 * s,
      up: a < -s && a > -7 * s,
    });
  };
  const end = e => {
    if (e.pointerId !== id) return;
    id = null; dpadKnob.style.transform = '';
    apply({ left: false, right: false, up: false, down: false });
  };
  pad.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); goFullscreen();
    id = e.pointerId; pad.setPointerCapture(id); move(e);
  });
  pad.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
  pad.addEventListener('pointerup', end);
  pad.addEventListener('pointercancel', end);
  return pad;
}

// Un tasto: tiene premute una o più azioni finché il dito resta giù.
function makeButton(cls, label, actions) {
  const b = el('div', `tc-btn ${cls}`, `<span>${label}</span>`);
  const ids = new Set();
  const down = e => {
    e.preventDefault(); e.stopPropagation(); goFullscreen();
    ids.add(e.pointerId); b.setPointerCapture(e.pointerId);
    b.classList.add('on'); actions.forEach(a => setTouch(a, true)); buzz();
  };
  const up = e => {
    if (!ids.delete(e.pointerId) || ids.size) return;
    b.classList.remove('on'); actions.forEach(a => setTouch(a, false));
  };
  b.addEventListener('pointerdown', down);
  b.addEventListener('pointerup', up);
  b.addEventListener('pointercancel', up);
  return b;
}

// Safari su iPhone ignora "niente zoom" nel meta viewport: doppio tocco e pizzico vanno bloccati a mano.
// Il gioco usa i pointer event, quindi bloccare i gesti del browser non toglie nessun comando.
function blockBrowserZoom() {
  const typing = e => e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON');
  let lastEnd = 0;
  document.addEventListener('touchend', e => {
    const now = e.timeStamp;
    if (now - lastEnd < 400 && !typing(e)) e.preventDefault(); // doppio tocco
    lastEnd = now;
  }, { passive: false });
  document.addEventListener('touchmove', e => { if (!typing(e)) e.preventDefault(); }, { passive: false }); // pizzico e scorrimento
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });
  document.addEventListener('dblclick', e => { if (!typing(e)) e.preventDefault(); }, { passive: false });
}

export function initTouch() {
  blockBrowserZoom();
  root = el('div', 'tc');
  root.appendChild(makeDpad());
  const right = el('div', 'tc-right');
  const P = makeButton('punch', 'Pugno', ['punch']);
  const K = makeButton('kick', 'Calcio', ['kick']);
  const B = makeButton('block', 'Parata', ['block']);
  superBtn = makeButton('super', 'SUPER', ['punch', 'kick']);
  labels = { P: P.firstChild, K: K.firstChild };
  right.append(B, K, P, superBtn);
  root.appendChild(right);
  root.appendChild(makeButton('pause', 'II', ['back']));
  // tasti delle mosse speciali: si riempiono col lottatore in campo (syncTouch)
  spBox = el('div', 'tc-sp');
  root.appendChild(spBox);
  document.body.appendChild(root);
  // invito a giocare a schermo intero (telefono)
  fsBox = el('div', 'tc-fs');
  fsBox.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    const ok = e.target.closest('.tc-fs-skip');
    if (canFullscreen() && !ok) { goFullscreen(true); return; }
    fsDismissed = true; try { sessionStorage.setItem('wob-fs-ok', '1'); } catch { /* ok */ }
  });
  document.body.appendChild(fsBox);
  document.body.appendChild(el('div', 'tc-rotate', '<div>↻</div><p>Gira il telefono<br>in orizzontale</p>'));

  // tocchi fuori dai tasti: servono per scegliere nei menu
  document.getElementById('stage').addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && !isTouch()) return;
    if (e.pointerType !== 'mouse') setTouchMode(true);
    goFullscreen();
    const c = document.querySelector('#stage canvas');
    if (!c) return;
    const r = c.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
    if (x >= 0 && y >= 0 && x <= W && y <= H) pushTap(x, y);
  });
  addEventListener('touchstart', () => setTouchMode(true), { passive: true });
  addEventListener('blur', releaseTouch);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseTouch(); });
}

// Riempie i tasti delle mosse speciali con quelle del lottatore (nome, e i secondi di ricarica dopo l'uso).
let spBtns = [];
function fillSpecials(id) {
  spFor = id;
  spBox.innerHTML = '';
  spBtns = [];
  const sp = SPECIALS[id] || {};
  for (const code of slotCodes(id)) {
    const b = el('div', 'tc-spb', `<b>${sp[code].name}</b><i></i>`);
    spBtns.push({ code, b, i: b.querySelector('i'), last: null });
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation();
      pushTouchSpecial(code); buzz(); b.classList.add('on');
      setTimeout(() => b.classList.remove('on'), 120);
    });
    spBox.appendChild(b);
  }
}

// Messaggio per lo schermo intero: tasto su Android, istruzioni per l'icona sulla Home su iPhone.
function syncFullscreen(on) {
  const need = on && !isFullscreen() && !isStandalone() && !fsDismissed;
  document.body.classList.toggle('fs-ask', need);
  if (!need) return;
  const mode = canFullscreen() ? 'fs' : 'ios';
  if (fsBox.dataset.mode === mode) return;
  fsBox.dataset.mode = mode;
  fsBox.innerHTML = mode === 'fs'
    ? '<div class="tc-fs-in"><div class="big">⛶</div><p>Tocca per giocare<br>a schermo intero</p><span class="tc-fs-skip">continua senza</span></div>'
    : '<div class="tc-fs-in"><p>Per giocare a schermo intero<br>aggiungi il gioco alla Home:</p><p class="small">Safari → tasto Condividi (□↑)<br>→ "Aggiungi alla schermata Home"<br>e aprilo dall\'icona</p><span class="tc-fs-skip">continua così</span></div>';
}

// A ogni fotogramma: mostra i comandi giusti per la schermata in corso.
export function syncTouch(G) {
  if (!root) return;
  const on = isTouch() && !padType(0);
  document.body.classList.toggle('touch-on', on);
  syncFullscreen(on);
  if (!on) return;
  const fighting = G.scene === 'fight' && G.fight && G.fight.phase !== 'match';
  root.classList.toggle('menu', !fighting);
  const me = G.fight && G.fight.f[0];
  superBtn.classList.toggle('ready', !!(fighting && me && me.meter >= METER_MAX && G.fight.phase === 'fight'));
  // tasti delle mosse speciali del mio lottatore
  const mine = G.fight && G.fight.f[G.mode === 3 && G.net ? G.net.mySide : 0];
  if (fighting && mine && mine.ch.id !== spFor) fillSpecials(mine.ch.id);
  // ricarica: tasto spento con i secondi che mancano
  if (fighting && mine) for (const s of spBtns) {
    const left = Math.ceil((mine.cd[s.code] || 0) / 60);
    if (left === s.last) continue;
    s.last = left;
    s.b.classList.toggle('cd', left > 0);
    s.i.textContent = left > 0 ? `${left}s` : '';
  }
  labels.P.textContent = fighting ? 'Pugno' : 'OK';
  labels.K.textContent = fighting ? 'Calcio' : 'Indietro';
}
