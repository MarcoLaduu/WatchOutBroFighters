// Un incontro: round, timer, colpi, K.O. e fine partita (solo logica e scritte).
import { W, H, GROUND, ROUND_TIME, ROUNDS_TO_WIN } from '../config.js';
import { Fighter } from './fighter.js';
import { METER_MAX } from './specials.js';
import { ART } from '../sprites/index.js';
import { text, box, P1C, P2C, CPUC } from '../ui.js';
import { sfx } from '../audio.js';

const overlap = (a, b) => a && b && a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

export class Fight {
  constructor(ch1, ch2, ctrl1, ctrl2, labels) {
    this.f = [new Fighter(ch1, 0, ctrl1), new Fighter(ch2, 1, ctrl2)];
    this.labels = labels;            // ['G1','CPU'] ecc.
    this.round = 1; this.sparks = [];
    this.startRound();
  }

  startRound() {
    for (const f of this.f) f.reset();
    this.phase = 'intro'; this.pt = 0; this.timer = ROUND_TIME * 60; this.hitstop = 0; this.shake = 0;
    this.winner = null; this.banner = '';
    this.projs = []; this.zones = []; this.traps = []; this.waves = []; this.says = []; this.overlays = [];
    this.freeze = null;
    sfx.round();
  }

  opp(f) { return this.f[1 - f.side]; }

  // ---------- oggetti delle mosse speciali ----------
  say(f, txt, dur = 40, replace = false) {
    if (replace) this.says = this.says.filter(s => s.f !== f);
    this.says.push({ f, txt, t: 0, dur });
  }
  overlay(type, dur, x = 0) { this.overlays.push({ type, t: 0, dur, x }); }
  addWave(f) { this.waves.push({ x: f.x + f.face * 8, y: f.y - 40, face: f.face, t: 0 }); }
  addZone(f, z) { this.zones.push({ owner: f, x: f.x + f.face * z.dx, r: z.r, type: z.type, t: 0, dur: z.dur, hitOnce: false }); }
  addTrap(f, d) { this.traps.push({ owner: f, x: f.x + f.face * 16, t: d.fuse, r: d.r, hit: d.hit }); }
  spawnProj(f, p) {
    this.projs.push({
      owner: f, ...p, x: f.x + f.face * 16, y: f.y + p.y, vx: p.vx * f.face, vy: p.vy || 0, face: f.face,
      delay: p.delay || 0, life: p.life || 400, ticks: 0, tick: 0, bounces: p.bounces || 0, done: false,
    });
  }

  // Applica un colpo (anche di proiettili, prese e trappole) e gestisce scintille, pausa, barra super.
  applyHit(att, def, hit, src) {
    const res = def.receive(att, hit, src);
    if (!res) return null;
    const hx = def.x - (src.face ?? att.face) * 6, hy = def.y - 34;
    if (res === 'counter') {
      this.say(def, 'TE LO RITORNO!', 40);
      def.sp = null; def.set('idle');
      this.applyHit(def, att, { dmg: Math.round(hit.dmg * 2), level: 'mid', hitstun: 20, push: 3, knockdown: true, unblockable: true, sfx: 'heavy' }, def);
      return 'counter';
    }
    this.sparks.push({ x: hx, y: hy, t: 0, block: res === 'block', absorb: res === 'absorb' });
    if (res === 'absorb') { this.say(def, 'BLOCCATO!', 30); sfx.block(); this.hitstop = 3; return res; }
    this.hitstop = Math.max(this.hitstop, res === 'block' ? 3 : res === 'ko' ? 14 : 5);
    if (res !== 'block') this.shake = res === 'ko' ? 12 : 4;
    const rancore = def.ch.id === 'sergenteArgus' ? 2 : 1;
    const gain = hit.noMeter ? 0 : 1; // durante le super chi attacca non ricarica la barra
    if (res === 'block') { att.addMeter(3 * gain); def.addMeter(2 * rancore); }
    else { att.addMeter(7 * gain); def.addMeter(4 * rancore); }
    return res;
  }

  startSuper(f) {
    f.meter = 0;
    const d = f.specials.super;
    f.sp = null; f.spCode = 'super'; f.box = null; f.move = null;
    f.set('super'); f.vx = 0; f.vy = 0; f.crouching = false;
    f.cine = { t: -1, fx: [] }; f.view = null;
    this.freeze = { f, t: 0, dur: 40, name: d.name };
    if (d.shout) this.say(f, d.shout, 60);
    sfx.round();
  }

  update() {
    this.pt++;
    for (const s of this.sparks) s.t++;
    this.sparks = this.sparks.filter(s => s.t < 10);
    for (const s of this.says) s.t++;
    this.says = this.says.filter(s => s.t < s.dur);
    for (const o of this.overlays) o.t++;
    this.overlays = this.overlays.filter(o => o.t < o.dur);
    if (this.shake > 0) this.shake--;
    const [a, b] = this.f;

    if (this.phase === 'intro') {
      if (this.pt > 100) { this.phase = 'fight'; this.pt = 0; }
      for (const f of this.f) f.shownHp += (f.hp - f.shownHp) * 0.2;
      return;
    }
    if (this.freeze) { if (++this.freeze.t >= this.freeze.dur) this.freeze = null; return; }
    if (this.hitstop > 0) { this.hitstop--; return; }

    if (this.phase === 'fight' || this.phase === 'ko') {
      if (this.phase === 'ko' && this.pt % 2) return; // rallentatore dopo il K.O.
      a.update(b, this); b.update(a, this);
      this.separate();
      if (this.phase === 'fight') {
        this.resolveHits(a, b); this.resolveHits(b, a);
        this.updateObjects();
        if (--this.timer <= 0) this.endRound(true);
        else if (a.hp <= 0 || b.hp <= 0) this.endRound(false);
      }
      if (this.phase === 'ko' && this.pt > 150) this.afterRound();
      return;
    }
    if (this.phase === 'roundover') {
      a.update(b, this); b.update(a, this);
      if (this.pt > 110) this.afterRound();
    }
  }

  updateObjects() {
    const overlap2 = (p, f) => overlap({ x0: p.x - p.w / 2, x1: p.x + p.w / 2, y0: p.y - p.h / 2, y1: p.y + p.h / 2 }, f.hurtbox());
    for (const p of this.projs) {
      if (p.delay > 0) { p.delay--; if (p.delay === 0) { p.x = p.owner.x + p.owner.face * 16; p.y = p.owner.y + (p.y - GROUND); } continue; }
      p.tick++;
      p.vy += p.g || 0; p.x += p.vx; p.y += p.vy;
      if (--p.life <= 0 || p.x < -30 || p.x > W + 30) p.done = true;
      if (p.y >= GROUND - 2) {
        if (p.burst) { this.burst(p); continue; }
        if (p.bounces > 0) { p.bounces--; p.y = GROUND - 2; p.vy = -Math.abs(p.vy) * 0.6; }
        else if (p.g) p.done = true;
      }
      const target = this.opp(p.owner);
      if (!p.done && overlap2(p, target)) {
        if (p.burst) { this.burst(p); continue; }
        if (p.multi) {
          if ((p.cool = (p.cool || 0) - 1) <= 0 && p.ticks < p.multi) { p.ticks++; p.cool = p.every; this.applyHit(p.owner, target, p.hit, p); }
        } else { const r = this.applyHit(p.owner, target, p.hit, p); if (r) p.done = true; }
      }
    }
    // proiettili che si scontrano si annullano (quelli enormi passano)
    for (const p of this.projs) for (const q of this.projs) {
      if (p === q || p.owner === q.owner || p.done || q.done || p.delay || q.delay) continue;
      if (Math.abs(p.x - q.x) < (p.w + q.w) / 2 && Math.abs(p.y - q.y) < (p.h + q.h) / 2) {
        if (!p.pierce) p.done = true;
        if (!q.pierce) q.done = true;
        this.sparks.push({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, t: 0 });
      }
    }
    this.projs = this.projs.filter(p => !p.done);

    for (const z of this.zones) {
      z.t++;
      const o = this.opp(z.owner);
      if (Math.abs(o.x - z.x) < z.r && o.hp > 0) {
        if (z.type === 'slow') o.st.slow = Math.max(o.st.slow || 0, 30);
        if (z.type === 'invert' && !z.hitOnce) { z.hitOnce = true; o.st.invert = 180; this.say(o, '?!', 40); }
      }
    }
    this.zones = this.zones.filter(z => z.t < z.dur);

    for (const tr of this.traps) {
      if (--tr.t > 0) continue;
      const o = this.opp(tr.owner);
      this.overlay('boom', 18, tr.x);
      this.shake = 8; sfx.heavy();
      if (Math.abs(o.x - tr.x) < tr.r) this.applyHit(tr.owner, o, tr.hit, { x: tr.x, face: Math.sign(o.x - tr.x) || 1 });
    }
    this.traps = this.traps.filter(tr => tr.t > 0);
    for (const w of this.waves) w.t++;
    this.waves = this.waves.filter(w => w.t < 16);
  }

  // La granata flash scoppia: chi è vicino resta accecato.
  burst(p) {
    p.done = true;
    this.overlay('flash', 14, p.x);
    const o = this.opp(p.owner);
    if (Math.abs(o.x - p.x) < p.burst + 12) { this.applyHit(p.owner, o, p.hit, p); this.say(o, 'NON VEDO!', 40); }
  }

  separate() {
    const [a, b] = this.f;
    const free = f => !['knockdown', 'ko', 'held', 'superheld', 'grabbing', 'super'].includes(f.state);
    if (!free(a) || !free(b)) return;
    if (a.state === 'special' && a.sp && a.sp.kind === 'teleport') return;
    if (b.state === 'special' && b.sp && b.sp.kind === 'teleport') return;
    const dx = b.x - a.x, min = 20;
    const vert = Math.abs(a.y - b.y) < 40;
    if (vert && Math.abs(dx) < min) {
      const push = (min - Math.abs(dx)) / 2 * (dx >= 0 ? 1 : -1);
      a.x -= push; b.x += push;
    }
  }

  resolveHits(att, def) {
    if (att.hitDone) return;
    const cur = att.currentHit();
    if (!cur || !overlap(cur.box, def.hurtbox())) return;
    att.hitDone = true;
    const res = this.applyHit(att, def, cur.hit, att);
  }

  endRound(timeUp) {
    const [a, b] = this.f;
    const ra = a.hp / a.hpMax, rb = b.hp / b.hpMax;
    let w = null;
    if (a.hp <= 0 && b.hp > 0) w = 1;
    else if (b.hp <= 0 && a.hp > 0) w = 0;
    else if (Math.abs(ra - rb) > 0.001) w = ra > rb ? 0 : 1;
    this.winner = w;
    if (w != null) this.f[w].wins++;
    this.phase = timeUp ? 'roundover' : 'ko'; this.pt = 0;
    this.banner = timeUp ? 'TEMPO!' : (a.hp <= 0 && b.hp <= 0 ? 'DOPPIO K.O.' : 'K.O.!');
  }

  afterRound() {
    const champ = this.f.findIndex(f => f.wins >= ROUNDS_TO_WIN);
    if (champ >= 0) {
      this.phase = 'match'; this.pt = 0; this.champ = champ;
      this.f[champ].set('victory');
      return;
    }
    if (this.winner != null && this.f[this.winner].hp > 0) this.f[this.winner].set('victory');
    this.round++;
    this.startRound();
  }

  // Fase "match": chi ha vinto resta a festeggiare, il gioco decide quando tornare al menu.
  updateMatch() {
    this.pt++;
    const [a, b] = this.f;
    a.update(b, this); b.update(a, this);
  }

  // Barre della vita, timer e scritte. Arena e lottatori li disegna view.js con Phaser.
  drawUi(ctx, { banner = true } = {}) {
    this.drawHud(ctx);
    this.drawWorldText(ctx);
    if (banner) this.drawBanner(ctx);
  }

  // Nomi delle mosse sopra la testa, effetti attivi e scritta della super.
  drawWorldText(ctx) {
    const TAGS = { slow: 'LENTO', blind: 'CIECO', invert: 'CONFUSO', drunk: 'UBRIACO', armor: 'ARMATURA', reduce: 'RECUPERO', venerdoc: 'VENERDOC', crown: 'RE', live: 'LIVE' };
    for (const f of this.f) {
      const top = f.y - 66 + f.ch.oy;
      const tags = Object.keys(f.st).filter(k => TAGS[k] && !(k === 'armor' && f.st.armor <= 2)).map(k => TAGS[k]);
      if (f.state === 'dizzy') tags.push('STORDITO');
      if (f.barrier > 0) tags.push('FIREWALL');
      if (tags.length) text(ctx, tags.join(' '), f.x, top - 2, { size: 4, align: 'center', color: '#a8dcff', maxW: 120 });
      const mine = this.says.filter(s => s.f === f);
      mine.forEach((s, i) => {
        const rise = Math.min(6, s.t / 3);
        text(ctx, s.txt, f.x, top - 10 - rise - (mine.length - 1 - i) * 9, { size: s.txt.length <= 2 ? 12 : 6, align: 'center', color: '#f2c230', shadow: '#3a1020', maxW: 180 });
      });
    }
    if (this.freeze) {
      const fr = this.freeze, k = Math.min(1, fr.t / 8);
      text(ctx, 'SUPER', W / 2, 74, { size: 9, align: 'center', color: '#ff5a4a', shadow: '#000' });
      text(ctx, fr.name.toUpperCase(), W / 2 + (1 - k) * 200, 96, { size: 16, align: 'center', color: '#f2c230', shadow: '#000' });
    }
  }

  drawHud(ctx) {
    const [a, b] = this.f;
    const bar = (f, x, flip, col) => {
      const w = 140, ratio = Math.max(0, f.hp / f.hpMax), shown = Math.max(0, f.shownHp / f.hpMax);
      box(ctx, x, 10, w + 2, 9, '#1a1020', '#f2e6d0');
      ctx.fillStyle = '#c0392b';
      const sw = Math.round(w * shown), rw = Math.round(w * ratio);
      ctx.fillRect(flip ? x + 1 + w - sw : x + 1, 11, sw, 7);
      ctx.fillStyle = ratio > 0.3 ? '#f2c230' : '#ff7a3a';
      ctx.fillRect(flip ? x + 1 + w - rw : x + 1, 11, rw, 7);
      const p = ART[f.ch.id].portrait;
      const px = flip ? x + w - 26 : x;
      box(ctx, px, 21, 28, 28, '#2a1c3a', col);
      if (flip) { ctx.save(); ctx.translate(px + 28, 21); ctx.scale(-1, 1); ctx.drawImage(p, 0, 0); ctx.restore(); }
      else ctx.drawImage(p, px, 21);
      text(ctx, f.ch.name, flip ? x + w - 30 : x + 31, 31, { size: 7, align: flip ? 'right' : 'left', maxW: 108 });
      text(ctx, this.labels[f.side], flip ? x + w - 30 : x + 31, 41, { size: 5, color: col, align: flip ? 'right' : 'left' });
      // barra super
      const mw = 60, mx = flip ? x + w + 2 - mw : x, full = f.meter >= METER_MAX;
      box(ctx, mx, 52, mw, 5, '#1a1020', '#6a5a7a');
      ctx.fillStyle = full ? (Math.floor(this.pt / 6) % 2 ? '#7fe8ff' : '#3fb8ff') : '#2a7fc8';
      const fw = Math.round((mw - 2) * f.meter / METER_MAX);
      ctx.fillRect(flip ? mx + mw - 1 - fw : mx + 1, 53, fw, 3);
      if (full) text(ctx, 'SUPER!', flip ? mx - 3 : mx + mw + 3, 57, { size: 4, color: '#7fe8ff', align: flip ? 'right' : 'left' });
      for (let i = 0; i < ROUNDS_TO_WIN; i++) {
        const dx = flip ? x + w - 34 - i * 8 - 6 : x + 31 + i * 8;
        ctx.fillStyle = i < f.wins ? '#f2c230' : '#3a2c4a';
        ctx.fillRect(dx, 44, 6, 4);
      }
    };
    const c2 = this.labels[1] === 'CPU' ? CPUC : P2C;
    bar(a, 8, false, P1C);
    bar(b, W - 150, true, c2);
    const secs = Math.ceil(this.timer / 60);
    box(ctx, W / 2 - 14, 8, 28, 18, '#1a1020', '#f2e6d0');
    text(ctx, String(Math.max(0, secs)).padStart(2, '0'), W / 2, 22, { size: 14, align: 'center', color: secs <= 10 ? '#ff7a3a' : '#fff' });
  }

  drawBanner(ctx) {
    let msg = '', sub = '';
    if (this.phase === 'intro') msg = this.pt < 60 ? `ROUND ${this.round}` : 'VIA!';
    else if (this.phase === 'ko' || this.phase === 'roundover') {
      msg = this.banner;
      if (this.pt > 60) sub = this.winner == null ? 'Pareggio' : `${this.f[this.winner].ch.name} vince il round`;
    } else if (this.phase === 'match') {
      const w = this.f[this.champ];
      msg = `${w.ch.name.toUpperCase()} VINCE!`;
      sub = `"${w.ch.win}"`;
    }
    if (!msg) return;
    text(ctx, msg, W / 2, 92, { size: msg.length > 14 ? 18 : 26, align: 'center', color: '#f2c230', shadow: '#3a1020' });
    if (sub) text(ctx, sub, W / 2, 110, { size: 9, align: 'center' });
    if (this.phase === 'match' && this.pt > 90 && Math.floor(this.pt / 30) % 2)
      text(ctx, 'Premi Pugno o Invio per continuare', W / 2, 130, { size: 8, align: 'center', color: '#e6d8f0' });
  }
}

export { GROUND, H };
