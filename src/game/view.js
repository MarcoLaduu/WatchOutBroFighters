// Disegno del combattimento con Phaser: arena, ombre, lottatori animati, proiettili, effetti e scintille.
// La logica (fight.js, fighter.js) non sa nulla di Phaser: qui si legge il suo stato e si aggiornano gli oggetti.
import Phaser from 'phaser';
import { GROUND, S, W, H } from '../config.js';
import { FW, FH } from '../anim/frames.js';
import { ROOT_X, ROOT_Y } from '../anim/rig.js';

const three = (anim, t, S, A) => [anim, t < S ? 0 : t < S + A ? 1 : 2];

// Fotogramma per le mosse speciali e le super.
function specialFrame(f) {
  const d = f.sp, t = f.t, S = d.startup || 0;
  switch (d.kind) {
    case 'rising': return ['spin', Math.floor(t / 4) % 2];
    case 'chain': {
      const local = t - (f.spData.n || 0) * d.step, anim = f.spData.n % 2 ? 'punch' : 'kick';
      return [anim, local < 5 ? 0 : local < 8 ? 1 : 2];
    }
    case 'teleport': return t < S ? ['dash', 0] : three('kick', t, S, d.active);
    case 'hold': return ['shout', 0];
    case 'power': return ['power', t < S ? 0 : 1];
  }
  const a = d.anim;
  if (a === 'punch' || a === 'kick' || a === 'cpunch') return three(a, t, S, d.active || 6);
  if (a === 'power') return ['power', t < S ? 0 : 1];
  if (a === 'dash' || a === 'drink' || a === 'heal' || a === 'spin') return [a, Math.floor(t / 6) % 2];
  return [a, 0];
}

// Quale fotogramma mostrare per lo stato attuale del lottatore.
export function pickFrame(f) {
  const t = f.t;
  const lying = f.state === 'knockdown' || ((f.state === 'ko' || f.state === 'airhit') && f.grounded);
  switch (f.state) {
    case 'idle': return ['idle', Math.floor(t / 12) % 4];
    case 'walk': return [f.vx * f.face >= 0 ? 'walkF' : 'walkB', Math.floor(t / (f.st.slow ? 12 : 6)) % 6];
    case 'crouch': return ['crouch', 0];
    case 'block': case 'blockstun': return [f.crouching ? 'cblock' : 'block', 0];
    case 'jump': return ['jump', f.vy < -1.5 ? 0 : f.vy < 1.5 ? 1 : 2];
    case 'land': return ['land', 0];
    case 'getup': return ['getup', 0];
    case 'hit': return ['hit', t < 6 ? 0 : 1];
    case 'dizzy': return ['hit', 1];
    case 'held': return ['hurt', 0];
    case 'superheld': return f.crouching ? ['crouch', 0] : ['hit', Math.floor(t / 9) % 2];
    case 'grabbing': return ['grab', 0];
    case 'super': return ['power', 1];
    case 'special': return f.sp ? specialFrame(f) : ['idle', 0];
    case 'victory': return f.grounded ? ['victory', Math.floor(t / 15) % 2] : ['jump', 1];
    case 'attack': {
      const m = f.move, name = f.moveName;
      if (!m) return ['idle', 0];
      if (name === 'airkick') return ['airkick', t < m.startup ? 0 : 1];
      return [name, t < m.startup ? 0 : t < m.startup + m.active ? 1 : 2];
    }
    default: return ['hurt', 0, lying];
  }
}

export class FightView {
  constructor(scene, fight, frames) {
    this.scene = scene; this.fight = fight;
    this.root = scene.add.container(0, 0).setScale(S).setDepth(0);
    this.root.add(scene.add.image(0, 0, 'arena').setOrigin(0, 0).setDepth(-10));
    this.back = scene.add.graphics().setDepth(-5);   // ombre, zone, oscuramento della super
    this.root.add(this.back);
    this.sprites = fight.f.map(f => {
      const s = scene.add.sprite(f.x, f.y, `fr_${f.ch.id}`, 'idle_0');
      s.setOrigin(ROOT_X / FW, ROOT_Y / FH);
      this.root.add(s);
      return s;
    });
    this.fx = scene.add.graphics().setDepth(10);     // proiettili, scintille, effetti a tutto schermo
    this.root.add(this.fx);
    this.frames = frames;
  }

  update() {
    const fight = this.fight, g = this.back, fx = this.fx;
    const sh = fight.shake ? (fight.shake % 2 ? 2 : -2) : 0;
    this.root.x = sh * S;
    const clock = fight.pt;

    g.clear(); fx.clear();
    if (fight.freeze) { g.fillStyle(0x000000, 0.55); g.fillRect(-10, 0, W + 20, H); }

    // zone (nuvole di fumo) e trappole
    for (const z of fight.zones) {
      const col = z.type === 'slow' ? 0xb8c8b0 : 0xc8a8e8, fade = Math.min(1, (z.dur - z.t) / 30);
      for (let i = 0; i < 9; i++) {
        const a = i * 0.7 + z.t * 0.02, rr = z.r * (0.35 + (i % 3) * 0.22);
        g.fillStyle(col, 0.22 * fade);
        g.fillCircle(z.x + Math.cos(a) * rr * 0.8, GROUND - 22 + Math.sin(a * 1.3) * 10, 10 + (i % 3) * 3);
      }
    }
    for (const tr of fight.traps) {
      g.fillStyle(0x1a1410, 1); g.fillRect(tr.x - 4, GROUND - 7, 8, 7);
      g.fillStyle(0x2a2a2a, 1); g.fillRect(tr.x - 3, GROUND - 6, 6, 5);
      if (Math.floor(tr.t / (tr.t < 60 ? 4 : 10)) % 2) { g.fillStyle(0xff3030, 1); g.fillRect(tr.x - 1, GROUND - 9, 2, 2); }
    }

    fight.f.forEach((f, i) => {
      const lift = Math.min(1, (GROUND - f.y) / 70);
      g.fillStyle(0x000000, 0.28);
      if (!(f.view && f.view.hide && f.state === 'super')) g.fillEllipse(Math.round(f.x), GROUND + 1, (15 - lift * 6) * 2, 6);

      const s = this.sprites[i];
      // durante una super la scena decide posa, rotazione e spostamenti (vedi supers.js)
      const v = (f.state === 'super' || f.state === 'superheld') ? f.view : null;
      let [anim, idx, lying] = v ? [v.anim, v.idx || 0, false] : pickFrame(f);
      const list = this.frames[f.ch.id][anim] || this.frames[f.ch.id].idle;
      s.setFrame(`${list === this.frames[f.ch.id][anim] ? anim : 'idle'}_${Math.min(idx, list.length - 1)}`);
      s.setFlipX(f.face < 0);
      let x = Math.round(f.x), y = Math.round(f.y), rot = 0;
      if (f.state === 'hit' || f.state === 'superheld') x -= f.face * (f.t % 9 < 4 ? 1 : 0);
      if (f.state === 'held') rot = -f.face * 0.4;
      if (f.state === 'ko' || f.state === 'airhit' || f.state === 'knockdown') {
        rot = -f.face * (lying ? Math.PI / 2 : Math.min(Math.PI / 2, f.t * 0.12));
        // sdraiato il corpo è lungo: lo si tiene dentro lo schermo anche vicino ai bordi
        if (lying) { y -= 16; x = f.face > 0 ? Math.max(62, x) : Math.min(W - 62, x); }
      }
      if (v) { rot = v.rot || 0; x += v.dx || 0; y += v.dy || 0; }
      s.setPosition(x, y).setRotation(rot);
      const blink = (f.invuln > 0 && f.state === 'special' && f.sp && f.sp.kind === 'teleport');
      s.setAlpha(v && v.alpha != null ? v.alpha : blink ? 0.4 : 1);
      s.setVisible(!(v && v.hide));
      if (v && v.tint != null && !(f.flash > 0)) s.setTint(v.tint).setTintMode(Phaser.TintModes.MULTIPLY);
      else if (f.flash > 0) s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      else if (f.st.venerdoc) s.setTint([0xff80ff, 0x80ffff, 0xffff80][Math.floor(clock / 8) % 3]).setTintMode(Phaser.TintModes.MULTIPLY);
      else if (f.countering) s.setTint(0xffe080).setTintMode(Phaser.TintModes.MULTIPLY);
      else if (f.st.armor > 2) s.setTint(0xffd0a0).setTintMode(Phaser.TintModes.MULTIPLY);
      else s.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
      s.setDepth(v && v.depth != null ? v.depth : ['attack', 'special', 'super', 'grabbing'].includes(f.state) ? 2 : 1);

      // firewall davanti a Doc Lady
      if (f.barrier > 0) {
        const bx = f.x + f.face * 18;
        for (let yy = 0; yy < 44; yy += 4) for (let xx = 0; xx < 6; xx += 3) {
          fx.fillStyle((xx + yy + Math.floor(clock / 4)) % 2 ? 0x3ddc84 : 0x1f8a4c, 0.85);
          fx.fillRect(bx + xx - 3, GROUND - 52 + yy, 2, 3);
        }
      }
      // stelline di chi è stordito
      if (f.state === 'dizzy') for (let k = 0; k < 3; k++) {
        const a = clock * 0.15 + k * 2.1;
        fx.fillStyle(0xffe066, 1); fx.fillRect(f.x + Math.cos(a) * 10 - 1, f.y - 64 + f.ch.oy + Math.sin(a) * 3, 3, 3);
      }
      // fiamma di Drrrrrrago
      if (f.state === 'special' && f.sp && f.sp.kind === 'hold' && f.spData.len && !f.spData.released) {
        const L = f.spData.len;
        for (let k = 0; k < L; k += 3) {
          const xx = f.x + f.face * (10 + k), hgt = 4 + (k / L) * 12 + ((k + clock) % 5);
          fx.fillStyle(k > L * 0.7 ? 0xff4a1a : k > L * 0.35 ? 0xff9a2a : 0xffe060, 1);
          fx.fillRect(Math.min(xx, xx + f.face * 3), f.y - 36 - hgt / 2, 4, hgt);
        }
      }
    });
    this.root.sort('depth');

    // onde dell'urlo
    for (const w of fight.waves) {
      fx.lineStyle(2, 0xfff0c0, 1 - w.t / 16);
      fx.beginPath(); fx.arc(w.x, w.y, 6 + w.t * 3, w.face > 0 ? -0.9 : Math.PI - 0.9, w.face > 0 ? 0.9 : Math.PI + 0.9); fx.strokePath();
    }
    for (const p of fight.projs) if (!p.delay) this.drawProj(fx, p, clock);

    for (const sp of fight.sparks) {
      const r = 3 + sp.t * 1.2;
      const col = sp.absorb ? 0x3ddc84 : sp.block ? 0xa8dcff : sp.t < 4 ? 0xffffff : 0xffd23a;
      fx.fillStyle(col, 1);
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4;
        fx.fillRect(Math.round(sp.x + Math.cos(a) * r) - 1, Math.round(sp.y + Math.sin(a) * r) - 1, 2, 2);
      }
      if (sp.t < 3) fx.fillRect(Math.round(sp.x) - 2, Math.round(sp.y) - 2, 4, 4);
    }
    for (const o of fight.overlays) this.drawOverlay(fx, o, clock);
    // effetti delle super in corso
    for (const f of fight.f) if (f.state === 'super' && f.cine && f.cine.fx) for (const e of f.cine.fx) this.drawCine(e.type === 'disco' ? g : fx, e, clock);
  }

  // Effetti delle scene delle super (li prepara supers.js in f.cine.fx a ogni fotogramma).
  drawCine(g, e, clock) {
    const R = (x, y, w, h, c, a = 1) => { g.fillStyle(c, a); g.fillRect(Math.round(x), Math.round(y), w, h); };
    switch (e.type) {
      case 'speed':
        for (let i = 0; i < 4; i++) R(e.x - e.face * (14 + ((i * 9 + clock * 3) % 16)) - (e.face > 0 ? 10 : 0), e.y - 52 + i * 12, 10, 1, 0xffffff, 0.6);
        break;
      case 'bits': {
        const n = 6;
        for (let i = 0; i < n; i++) {
          const k = ((e.t * 0.06 + i / n) % 1), x = e.x0 + (e.x1 - e.x0) * k, y = e.y + Math.sin(k * 9 + i) * 6;
          R(x - 1, y - 2, i % 2 ? 2 : 3, 4, i % 2 ? 0x7fe8ff : 0x3ddc84);
        }
        break;
      }
      case 'bsod': {
        const w = 56, h = 46, x0 = e.x - w / 2 + (e.glitch ? 3 : 0), y0 = GROUND - 100;
        R(x0 - 1, y0 - 1, w + 2, h + 2, 0x1a1410);
        R(x0, y0, w, h, e.glitch ? 0x2a60ff : 0x1040c0);
        // ":(" in grande
        R(x0 + 6, y0 + 6, 3, 3, 0xffffff); R(x0 + 6, y0 + 12, 3, 3, 0xffffff);
        R(x0 + 13, y0 + 5, 2, 2, 0xffffff); R(x0 + 12, y0 + 7, 2, 6, 0xffffff); R(x0 + 13, y0 + 13, 2, 2, 0xffffff);
        for (let i = 0; i < 4; i++) R(x0 + 6, y0 + 21 + i * 4, 18 + ((i * 11) % 24), 1, 0xffffff, 0.8);
        // QR code e barra di avanzamento
        for (let i = 0; i < 16; i++) if ((i * 7 + 3) % 5 < 3) R(x0 + w - 14 + (i % 4) * 2, y0 + 6 + Math.floor(i / 4) * 2, 2, 2, 0xffffff);
        R(x0 + 6, y0 + h - 6, w - 12, 3, 0x0a2a80); R(x0 + 6, y0 + h - 6, Math.round((w - 12) * e.k), 3, 0xffffff);
        if (e.glitch) for (let i = 0; i < 3; i++) R(x0 + ((i * 17 + clock) % w), y0 + ((i * 13 + clock * 3) % h), 10, 2, 0xff40c0, 0.8);
        break;
      }
      case 'cross': {
        const r = 9 + Math.sin(clock * 0.3) * 1.5;
        g.lineStyle(1, e.col, 1); g.strokeCircle(e.x, e.y, r);
        R(e.x - r - 4, e.y, 6, 1, e.col); R(e.x + r - 2, e.y, 6, 1, e.col);
        R(e.x, e.y - r - 4, 1, 6, e.col); R(e.x, e.y + r - 2, 1, 6, e.col);
        R(e.x - 1, e.y - 1, 2, 2, e.col);
        break;
      }
      case 'hearts':
        for (let i = 0; i < 3; i++) {
          const x = e.x + (i - 1) * 10 + Math.sin(e.t * 0.1 + i) * 2, y = e.y - ((e.t * 0.5 + i * 7) % 20);
          R(x - 3, y, 2, 2, 0xff5a8a); R(x + 1, y, 2, 2, 0xff5a8a); R(x - 3, y + 1, 6, 2, 0xff5a8a); R(x - 2, y + 3, 4, 1, 0xff5a8a); R(x - 1, y + 4, 2, 1, 0xff5a8a);
        }
        break;
      case 'rage':
        for (let i = 0; i < 4; i++) {
          const k = ((e.t * 0.05 + i / 4) % 1);
          g.fillStyle(0xff3030, 0.7 * (1 - k)); g.fillCircle(e.x + (i - 1.5) * 6, e.y - k * 14, 2 + k * 3);
        }
        R(e.x + 6, e.y - 4, 2, 6, 0xff2020); R(e.x + 4, e.y - 2, 6, 2, 0xff2020);
        break;
      case 'fists':
        for (let i = 0; i < 4; i++) {
          const yy = e.y + ((i * 7 + e.t * 5) % 22) - 10;
          R(e.x + e.face * ((i * 5 + e.t * 3) % 10) - 3, yy, 6, 4, 0xffe0c0, 0.75);
          R(e.x + e.face * ((i * 5 + e.t * 3) % 10) - 3 - e.face * 8, yy + 1, 8, 1, 0xffffff, 0.5);
        }
        break;
      case 'sweat':
        for (let i = 0; i < 3; i++) { const k = ((e.t * 0.04 + i / 3) % 1); R(e.x + (i - 1) * 5, e.y - 8 + k * 12, 2, 3, 0x9ad8ff, 1 - k); }
        break;
      case 'disco': {
        const x = W / 2, y = e.y;
        R(x, 0, 1, y - 8, 0xc8ccd0);
        for (let yy = -8; yy <= 8; yy += 2) for (let xx = -8; xx <= 8; xx += 2)
          if (xx * xx + yy * yy <= 72) R(x + xx - 1, y + yy - 1, 2, 2, ((xx + yy + Math.floor(clock / 4)) & 2) ? 0xf4f4f4 : 0x8a90a0);
        if (e.lights) for (let i = 0; i < 8; i++) {
          const a = clock * 0.05 + i * Math.PI / 4, col = [0xff40c0, 0x40e0ff, 0xffe040, 0x80ff60][i % 4];
          g.lineStyle(2, col, 0.35); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 260, y + Math.abs(Math.sin(a)) * 200 + 20); g.strokePath();
        }
        break;
      }
      case 'notes':
        for (let i = 0; i < 3; i++) {
          const k = ((e.t * 0.02 + i / 3) % 1), x = e.x + (i - 1) * 16 + Math.sin(k * 8) * 4, y = e.y - k * 30;
          const c = [0xff80ff, 0x80ffff, 0xffff80][i];
          R(x, y, 3, 2, c, 1 - k); R(x + 2, y - 6, 1, 7, c, 1 - k); R(x + 2, y - 6, 3, 1, c, 1 - k);
        }
        break;
      case 'jball': R(e.x - 3, e.y - 3, 7, 7, 0x1a1410); R(e.x - 2, e.y - 2, 5, 5, 0xf4f4f4); R(e.x, e.y - 1, 1, 2, 0x222222); break;
      case 'aura':
        for (let i = 0; i < 3; i++) {
          const k = ((e.t * 0.05 + i / 3) % 1);
          g.lineStyle(2, 0x60ff80, 0.8 * (1 - k)); g.strokeEllipse(e.x, e.y - 30, 30 + k * 30, 70 + k * 20);
        }
        for (let i = 0; i < 6; i++) R(e.x + ((i * 13 + e.t * 2) % 30) - 15, e.y - ((i * 9 + e.t * 3) % 60), 2, 4, 0xc0ffc8, 0.8);
        break;
      case 'dragon': this.drawDragon(g, e, clock); break;
    }
  }

  // Il drago della super di Drrrrrrago: un corpo a serpente che segue la testa, con fuoco dalla bocca.
  drawDragon(g, e, clock) {
    const R = (x, y, w, h, c, a = 1) => { g.fillStyle(c, a); g.fillRect(Math.round(x), Math.round(y), w, h); };
    const f = e.face, tr = e.trail;
    // corpo: dal fondo della coda verso la testa
    for (let i = Math.min(tr.length - 1, 56); i >= 4; i -= 4) {
      const [x, y] = tr[i], r = Math.max(4, 11 - i * 0.12);
      g.fillStyle(0x1a1410, 1); g.fillCircle(x, y, r + 1);
      g.fillStyle(i % 8 ? 0x3f9a4a : 0x2f7a3a, 1); g.fillCircle(x, y, r);
      g.fillStyle(0xf2c230, 1); g.fillRect(Math.round(x - r * 0.6), Math.round(y + r * 0.35), Math.round(r * 1.2), 2);
      if (i % 8 === 0) { g.fillStyle(0xe0582a, 1); g.fillTriangle(x - 3, y - r + 1, x + 3, y - r + 1, x - f * 2, y - r - 5); }
    }
    const [hx, hy] = tr[0];
    const open = Math.floor(clock / 6) % 2;
    // testa
    R(hx - 13, hy - 10, 26, 18, 0x1a1410);
    R(hx - 12, hy - 9, 24, 16, 0x3f9a4a);
    R(hx + (f > 0 ? 8 : -20), hy - 4 + open, 12, 9, 0x1a1410);            // muso
    R(hx + (f > 0 ? 9 : -19), hy - 3 + open, 10, 3, 0x3f9a4a);
    R(hx + (f > 0 ? 9 : -19), hy + 2 + open, 10, 2, 0xf4f4f4);            // denti
    R(hx + (f > 0 ? 2 : -6), hy - 6, 4, 3, 0xffe060); R(hx + (f > 0 ? 3 : -5), hy - 5, 2, 2, 0x1a1410); // occhio
    R(hx + (f > 0 ? -8 : 4), hy - 16, 3, 7, 0xe0582a); R(hx + (f > 0 ? -3 : -1), hy - 15, 3, 6, 0xe0582a); // corna
    for (let i = 0; i < 4; i++) R(hx - f * (6 + i * 4), hy - 12 - (i % 2) * 2, 2, 3, 0xe0582a);
    // baffi
    R(hx + (f > 0 ? 14 : -26), hy + 4 + Math.sin(clock * 0.3) * 2, 12, 1, 0xf2c230);
    // fuoco verso il basso davanti
    if (e.fire) for (let k = 0; k < 56; k += 3) {
      const xx = hx + f * (16 + k), yy = hy + 4 + k * 0.7, hh = 6 + k * 0.35 + ((k + clock) % 5);
      g.fillStyle(k > 36 ? 0xff4a1a : k > 16 ? 0xff9a2a : 0xffe060, 0.9);
      g.fillRect(Math.round(xx - 2), Math.round(yy - hh / 2), 5, Math.round(hh));
    }
  }

  drawProj(g, p, clock) {
    const R = (x, y, w, h, c, a = 1) => { g.fillStyle(c, a); g.fillRect(Math.round(p.x + x), Math.round(p.y + y), w, h); };
    switch (p.type) {
      case 'ball':
        if (p.trail) for (let k = 1; k < 5; k++) R(-p.face * k * 5 - 2, -1, 4, 3, p.gold ? 0xffe060 : 0xffffff, 0.5 - k * 0.1);
        R(-3, -2, 7, 5, 0x1a1410); R(-2, -3, 5, 7, 0x1a1410);
        if (p.gold) { R(-2, -2, 5, 5, clock % 6 < 3 ? 0xffd23a : 0xfff0a0); R(0, -1, 1, 2, 0x8a5a10); }
        else if (p.white) { R(-2, -2, 5, 5, 0xf4f4f4); R(0, -1, 1, 2, 0x222222); }
        else { R(-2, -2, 3, 5, 0xb3122e); R(1, -2, 2, 5, 0x1d2f6f); R(-2, -2, 5, 1, 0xffffff, 0.5); }
        break;
      case 'flash': R(-2, -2, 5, 5, 0x1a1410); R(-1, -1, 3, 3, 0x9aa0a6); R(-1, -3, 2, 1, 0xffe066); break;
      case 'bagY': case 'bagB': case 'bagM': {
        const c = { bagY: 0xf2c230, bagB: 0x2a6fd8, bagM: 0x7a4e2a }[p.type];
        R(-3, -3, 6, 6, 0x1a1410); R(-2, -2, 4, 4, c); R(-1, -4, 2, 2, 0x1a1410); break;
      }
      case 'syringe':
        R(-4 * p.face, -1, 1, 3, 0x1a1410); R(-4, -1, 8, 3, 0x1a1410); R(-3, 0, 6, 1, 0xf4f4f4); R(p.face > 0 ? 1 : -3, 0, 2, 1, 0xd03030); R(p.face > 0 ? 4 : -5, 0, 1, 1, 0xc8ccd0); break;
      case 'rugby':
        R(-4, -2, 8, 5, 0x1a1410); R(-3, -1, 6, 3, 0x8a4a22); R(-1, 0, 2, 1, 0xf4f4f4); break;
      case 'bolt': {
        const c = clock % 4 < 2 ? 0x7fe8ff : 0xffffff;
        for (let k = 0; k < 9; k += 2) R(-4 + k, ((k + clock) % 4 < 2 ? -2 : 1), 2, 2, c);
        R(-1, -1, 2, 2, 0xffffff);
        break;
      }
      case 'gadget0': R(-2, -2, 4, 4, 0xe0b84a); R(-1, -1, 2, 2, 0x7a3fc0); break;
      case 'gadget1': R(-1, -3, 2, 6, 0x2a5bd7); R(-1, -3, 2, 1, 0xf4f4f4); break;
      case 'gadget2': R(-2, -3, 4, 6, 0x3ddc84); R(-1, -4, 2, 1, 0xf4f4f4); break;
      case 'dragon': {
        const f = p.face;
        for (let k = 0; k < 30; k += 3) {
          const hh = 6 + Math.sin((k + clock) * 0.5) * 3 + k * 0.4;
          R(-f * (k + 10) - 2, -hh / 2, 4, hh, k > 18 ? 0xff4a1a : 0xff9a2a, 0.9);
        }
        R(f > 0 ? -12 : -12, -12, 24, 22, 0x1a1410);
        R(-11, -11, 22, 20, 0x3f9a4a);
        R(f > 0 ? 4 : -10, -7, 6, 3, 0xffe060); R(f > 0 ? 6 : -9, -6, 2, 2, 0x1a1410);
        R(f > 0 ? 6 : -11, 2, 5, 3, 0xf4f4f4);
        R(f > 0 ? -6 : 2, -15, 3, 4, 0xe0582a); R(f > 0 ? -1 : -3, -15, 3, 4, 0xe0582a);
        break;
      }
    }
  }

  drawOverlay(g, o, clock) {
    const k = 1 - o.t / o.dur;
    switch (o.type) {
      case 'flash': g.fillStyle(0xffffff, 0.85 * k); g.fillRect(-10, 0, W + 20, H); break;
      case 'rewind':
        for (let y = 0; y < H; y += 6) { g.fillStyle(0x7fe8ff, 0.18 * k); g.fillRect(-10, y + (o.t * 3) % 6, W + 20, 2); }
        break;
      case 'bsod': {
        g.fillStyle(0x1040c0, 0.9); g.fillRect(o.x - 26, GROUND - 72, 52, 72);
        g.fillStyle(0xffffff, 1);
        for (let i = 0; i < 5; i++) g.fillRect(o.x - 20, GROUND - 62 + i * 9, 20 + ((i * 13) % 20), 2);
        g.fillRect(o.x - 20, GROUND - 68, 8, 3);
        break;
      }
      case 'disco': {
        const cols = [0xff40c0, 0x40e0ff, 0xffe040, 0x80ff60];
        for (let i = 0; i < 6; i++) {
          const x = (Math.sin(clock * 0.04 + i * 1.7) * 0.5 + 0.5) * W, y = 60 + Math.cos(clock * 0.05 + i) * 40;
          g.fillStyle(cols[(i + Math.floor(clock / 10)) % 4], 0.18); g.fillCircle(x, y + 60, 28);
        }
        break;
      }
      case 'lightning': {
        g.fillStyle(0xfff6a0, k);
        let x = o.x;
        for (let y = 0; y < GROUND; y += 8) { const nx = o.x + ((y * 7 + o.t * 3) % 11) - 5; g.fillRect(Math.min(x, nx), y, Math.abs(nx - x) + 3, 9); x = nx; }
        g.fillStyle(0xffffff, 0.3 * k); g.fillRect(-10, 0, W + 20, H);
        break;
      }
      case 'boom':
        g.fillStyle(0xff9a2a, 0.8 * k); g.fillCircle(o.x, GROUND - 10, 8 + o.t * 2);
        g.fillStyle(0xffe060, 0.9 * k); g.fillCircle(o.x, GROUND - 10, 4 + o.t);
        break;
      case 'dust':
        g.fillStyle(0xd8c8b0, 0.6 * k);
        for (let i = 0; i < 5; i++) g.fillCircle(o.x + (i - 2) * 6, GROUND - 6 - (i % 2) * 4 - o.t * 0.5, 4);
        break;
    }
  }

  setVisible(v) { this.root.setVisible(v); }
  destroy() { this.root.destroy(); }
}
