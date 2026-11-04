// Comandi touch per telefono e tablet: croce a sinistra, Pugno / Calcio / Parata a destra,
// tasto Super quando la barra è piena e tasto pausa in alto. Sono elementi HTML sopra il gioco:
// scrivono nello stato del G1 in input.js. I tocchi fuori dai tasti servono per i menu.
import { W, H } from './config.js';
import { setTouch, releaseTouch, pushTap, isTouch, setTouchMode, padType } from './input.js';
import { METER_MAX } from './game/specials.js';

let root = null, dpadKnob = null, superBtn = null, labels = {};
let askedFullscreen = false;

const el = (tag, cls, html = '') => { const e = document.createElement(tag); e.className = cls; e.innerHTML = html; return e; };
const buzz = () => { try { navigator.vibrate && navigator.vibrate(8); } catch { /* niente vibrazione */ } };

// Al primo tocco: schermo intero e orizzontale, dove il browser lo permette (Android sì, iPhone no).
function goFullscreen() {
  if (askedFullscreen) return;
  askedFullscreen = true;
  const d = document.documentElement;
  const req = d.requestFullscreen || d.webkitRequestFullscreen;
  if (!req || document.fullscreenElement) return;
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

export function initTouch() {
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
  document.body.appendChild(root);
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

// A ogni fotogramma: mostra i comandi giusti per la schermata in corso.
export function syncTouch(G) {
  if (!root) return;
  const on = isTouch() && !padType(0);
  document.body.classList.toggle('touch-on', on);
  if (!on) return;
  const fighting = G.scene === 'fight' && G.fight && G.fight.phase !== 'match';
  root.classList.toggle('menu', !fighting);
  const me = G.fight && G.fight.f[0];
  superBtn.classList.toggle('ready', !!(fighting && me && me.meter >= METER_MAX && G.fight.phase === 'fight'));
  labels.P.textContent = fighting ? 'Pugno' : 'OK';
  labels.K.textContent = fighting ? 'Calcio' : 'Indietro';
}
