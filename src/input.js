// Comandi dei due giocatori: tastiera e controller.
// G1: WASD + F pugno, G calcio, H parata, R T Y U mosse speciali 1-4, E super.
// G2: frecce + K pugno, L calcio, Ò parata, I O P È mosse speciali 1-4, J super (o tastierino: 1 2 3, 4-7, 0).
// Controller: il primo collegato è il G1, il secondo il G2. Quadrato/X pugno, Croce/A calcio, R1/RB parata,
// Triangolo/Y, Cerchio/B, L1/LB, L2/LT mosse speciali 1-4, R2/RT super.
// Touch (telefono): i comandi sullo schermo (touch.js) sono del G1, e i tocchi sui menu arrivano come "tap".
import { unlockAudio } from './audio.js';

const ACTIONS = ['left', 'right', 'up', 'down', 'punch', 'kick', 'block', 'sp1', 'sp2', 'sp3', 'sp4', 'super', 'start', 'back'];
const KEYMAP = [
  { KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down', KeyF: 'punch', KeyG: 'kick', KeyH: 'block',
    KeyR: 'sp1', KeyT: 'sp2', KeyY: 'sp3', KeyU: 'sp4', KeyE: 'super', Enter: 'start', Space: 'start', Escape: 'back' },
  { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', KeyK: 'punch', KeyL: 'kick', Semicolon: 'block', Quote: 'block',
    KeyI: 'sp1', KeyO: 'sp2', KeyP: 'sp3', BracketLeft: 'sp4', KeyJ: 'super',
    Numpad1: 'punch', Numpad2: 'kick', Numpad3: 'block', Numpad4: 'sp1', Numpad5: 'sp2', Numpad6: 'sp3', Numpad7: 'sp4', Numpad0: 'super',
    NumpadEnter: 'start' },
];

const mk = () => Object.fromEntries(ACTIONS.map(a => [a, false]));
const keyState = [mk(), mk()], padState = [mk(), mk()], touchState = mk();
// un tasto premuto e rilasciato tra due fotogrammi conta lo stesso come premuto
const latch = [mk(), mk()];
const held = [mk(), mk()], prev = [mk(), mk()];
export const pressed = [mk(), mk()];

addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return; // si sta scrivendo (codice online)
  unlockAudio();
  touchMode = false; // si gioca con una tastiera vera: niente comandi sullo schermo
  for (let p = 0; p < 2; p++) {
    const a = KEYMAP[p][e.code];
    if (a) { keyState[p][a] = true; if (!e.repeat) latch[p][a] = true; e.preventDefault(); }
  }
});
addEventListener('keyup', e => {
  for (let p = 0; p < 2; p++) { const a = KEYMAP[p][e.code]; if (a) keyState[p][a] = false; }
});
addEventListener('blur', () => { for (const k of keyState) for (const a in k) k[a] = false; });

// Tipo di controller del giocatore p (null se non ne ha uno): 'ps' per PlayStation, altrimenti 'xbox'.
// Nota: i browser rendono visibile un controller solo dopo che si è premuto un suo tasto.
export function padType(p) {
  if (!navigator.getGamepads) return null;
  const g = [...navigator.getGamepads()].filter(x => x && x.connected)[p];
  if (!g) return null;
  if (/xbox|xinput|045e/i.test(g.id)) return 'xbox';
  return /054c|playstation|dualshock|dualsense|wireless controller/i.test(g.id) ? 'ps' : 'xbox';
}

function readPads() {
  for (const s of padState) for (const a in s) s[a] = false;
  if (!navigator.getGamepads) return;
  const pads = [...navigator.getGamepads()].filter(g => g && g.connected);
  pads.slice(0, 2).forEach((g, p) => {
    const b = i => !!(g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.5));
    const ax = g.axes[0] || 0, ay = g.axes[1] || 0;
    const s = padState[p];
    s.left = b(14) || ax < -0.5; s.right = b(15) || ax > 0.5;
    s.up = b(12) || ay < -0.6; s.down = b(13) || ay > 0.6;
    s.punch = b(2); s.kick = b(0); s.block = b(5);
    s.sp1 = b(3); s.sp2 = b(1); s.sp3 = b(4); s.sp4 = b(6); s.super = b(7);
    s.start = b(9); s.back = b(8);
    if (Object.values(s).some(Boolean)) unlockAudio();
  });
}

// Da chiamare una volta per fotogramma: aggiorna tasti tenuti e appena premuti.
export function pollInput() {
  readPads();
  for (let p = 0; p < 2; p++) for (const a of ACTIONS) {
    const now = keyState[p][a] || padState[p][a] || (p === 0 && touchState[a]);
    pressed[p][a] = (now && !prev[p][a]) || latch[p][a];
    latch[p][a] = false;
    held[p][a] = now;
    prev[p][a] = now;
  }
}

export const isHeld = (p, a) => held[p][a];
export const wasPressed = (p, a) => pressed[p][a];
export const anyPressed = a => pressed[0][a] || pressed[1][a];
export const confirm = p => p == null ? (anyPressed('start') || anyPressed('punch')) : (pressed[p].start || pressed[p].punch);
export const cancel = p => p == null ? (anyPressed('back') || anyPressed('kick')) : (pressed[p].back || pressed[p].kick);

// ---------- touch ----------
// true quando si gioca toccando lo schermo (telefono o tablet senza tastiera)
let touchMode = typeof matchMedia !== 'undefined' && matchMedia('(any-pointer: coarse)').matches && navigator.maxTouchPoints > 0;
export const isTouch = () => touchMode;
export function setTouchMode(on) { touchMode = on; }

// Un tasto sullo schermo premuto o rilasciato (sempre del G1).
export function setTouch(a, on) {
  if (on && !touchState[a]) latch[0][a] = true;
  touchState[a] = on;
  if (on) unlockAudio();
}
export function releaseTouch() { for (const a in touchState) touchState[a] = false; }

// Tocco su un punto del gioco (coordinate interne W x H), per scegliere le voci dei menu.
let tap = null;
export function pushTap(x, y) { tap = { x, y }; unlockAudio(); }
export function takeTap() { const t = tap; tap = null; return t; }

// Tasto di una mossa speciale sullo schermo (telefono): la mossa parte senza fare la combinazione.
let touchSpecial = null;
export function pushTouchSpecial(code) { touchSpecial = code; unlockAudio(); }
export function takeTouchSpecial() { const c = touchSpecial; touchSpecial = null; return c; }
