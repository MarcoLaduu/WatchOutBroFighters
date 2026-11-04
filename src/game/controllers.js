// Chi muove un lottatore: un giocatore umano (tastiera/controller) o la CPU.
import { isHeld, wasPressed } from '../input.js';

const ACTS = ['left', 'right', 'up', 'down', 'punch', 'kick', 'block'];

export function humanCtrl(p) {
  return {
    read() {
      const held = {}, pressed = {};
      for (const a of ACTS) { held[a] = isHeld(p, a); pressed[a] = wasPressed(p, a); }
      return { held, pressed };
    },
  };
}

// Livelli della CPU: ogni quanti fotogrammi decide, quanto para e quanto attacca.
export const LEVELS = [
  { name: 'Facile', think: 22, block: 0.15, aggro: 0.35, antiAir: 0.1, special: 0.06, super: 0.15 },
  { name: 'Normale', think: 12, block: 0.4, aggro: 0.55, antiAir: 0.35, special: 0.13, super: 0.35 },
  { name: 'Difficile', think: 6, block: 0.7, aggro: 0.75, antiAir: 0.65, special: 0.2, super: 0.6 },
];

const RANGED = new Set(['proj', 'zone', 'teleport', 'random', 'trap']);
const CLOSE = new Set(['grab', 'melee', 'dash', 'chain', 'rising', 'hold']);

// La CPU sceglie una mossa speciale adatta alla distanza (le mosse "su di sé" vanno bene sempre).
function pickSpecial(me, dist) {
  const codes = Object.keys(me.specials).filter(c => c !== 'super' && !(me.specials[c].cost > me.meter));
  const fit = codes.filter(c => {
    const k = me.specials[c].kind;
    if (dist > 70) return RANGED.has(k) || k === 'self' || k === 'barrier';
    if (dist < 40) return CLOSE.has(k) || k === 'counter';
    return k !== 'grab';
  });
  const list = fit.length ? fit : codes;
  return list[Math.floor(Math.random() * list.length)];
}

export function cpuCtrl(level) {
  const L = LEVELS[level];
  let plan = { held: {}, press: null, frames: 0 }, wait = 0;
  const r = Math.random;

  function decide(me, opp) {
    const dist = Math.abs(opp.x - me.x), fwd = me.face > 0 ? 'right' : 'left', back = me.face > 0 ? 'left' : 'right';
    if (me.meter >= 100 && me.specials.super && dist < 110 && r() < L.super) return { held: {}, special: 'super', frames: 30 };
    if (r() < L.special && me.specials) {
      const code = pickSpecial(me, dist);
      if (code) return { held: me.specials[code].kind === 'hold' ? { punch: true } : {}, special: code, frames: me.specials[code].kind === 'hold' ? 40 : 24 };
    }
    const oppAttacking = opp.state === 'attack' && opp.move;
    if (oppAttacking && dist < 70 && r() < L.block) {
      return { held: { block: true, down: opp.move.level === 'low' }, press: null, frames: 14 };
    }
    if (!opp.grounded && opp.vy < 0 && dist < 80 && r() < L.antiAir) {
      return { held: {}, press: 'punch', frames: 10 };
    }
    if (opp.state === 'knockdown' || opp.state === 'getup') {
      return { held: { [back]: dist < 50 }, press: null, frames: 16 };
    }
    if (dist > 70) {
      if (r() < 0.06) return { held: { up: true, [fwd]: true }, press: null, frames: 6 };
      return { held: { [fwd]: true }, press: null, frames: 12 };
    }
    if (dist > 38) {
      const x = r();
      if (x < L.aggro * 0.45) return { held: {}, press: 'kick', frames: 18 };
      if (x < L.aggro * 0.6) return { held: { down: true }, press: 'kick', frames: 22 };
      if (x < 0.8) return { held: { [fwd]: true }, press: null, frames: 10 };
      return { held: { [back]: true }, press: null, frames: 12 };
    }
    const x = r();
    if (x < L.aggro * 0.6) return { held: {}, press: 'punch', frames: 12 };
    if (x < L.aggro * 0.85) return { held: { down: true }, press: r() < 0.5 ? 'kick' : 'punch', frames: 16 };
    if (x < 0.85) return { held: { block: true }, press: null, frames: 12 };
    return { held: { [back]: true }, press: null, frames: 14 };
  }

  return {
    read(me, opp) {
      const held = {}, pressed = {};
      if (plan.frames <= 0 && --wait <= 0) { plan = decide(me, opp); wait = L.think; plan.first = true; }
      plan.frames--;
      for (const a of ACTS) held[a] = !!plan.held[a];
      let special = null;
      if (plan.first) {
        if (plan.press) pressed[plan.press] = held[plan.press] = true;
        if (plan.held.up) pressed.up = true;
        special = plan.special || null;
        plan.first = false;
      }
      return { held, pressed, special };
    },
  };
}
