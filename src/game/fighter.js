// Un lottatore: stato, fisica, attacchi base, mosse speciali e super. Il disegno è in view.js (Phaser).
import { GROUND, GRAVITY, WALL_L, WALL_R } from '../config.js';
import { MOVES } from './moves.js';
import { SPECIALS, METER_MAX } from './specials.js';
import { sfx } from '../audio.js';
import { SCRIPTS, finishSuper } from './supers.js';

const FREE = new Set(['idle', 'walk', 'crouch', 'block']);
const UNGRABBABLE = new Set(['knockdown', 'getup', 'ko', 'held', 'superheld', 'super', 'airhit', 'jump']);

export class Fighter {
  constructor(ch, side, ctrl) {
    this.ch = ch; this.side = side; this.ctrl = ctrl;
    const st = ch.stats;
    this.hpMax = 70 + st.vita * 12;
    this.walk = 0.8 + st.velocita * 0.22;
    this.jumpV = 4.4 + st.salto * 0.38;
    this.dmgMul = 0.7 + st.forza * 0.1;
    this.specials = SPECIALS[ch.id] || {};
    this.wins = 0; this.meter = 0;
    this.reset();
  }

  reset() {
    this.x = this.side ? 260 : 124; this.y = GROUND;
    this.vx = 0; this.vy = 0; this.face = this.side ? -1 : 1;
    this.hp = this.hpMax; this.shownHp = this.hpMax;
    this.state = 'idle'; this.t = 0; this.move = null; this.hitDone = false;
    this.stun = 0; this.flash = 0; this.airJumps = 0; this.airAttackUsed = false;
    this.crouching = false;
    this.st = {};                 // effetti a tempo: slow, blind, invert, armor, drunk, reduce, sluggish, venerdoc, crown, live
    this.clock = 0; this.dirHist = []; this.posHist = []; this.lastP = -99; this.lastK = -99;
    this.barrier = 0; this.invuln = 0; this.countering = false;
    this.comboTaken = 0; this.bonusNext = false;
    this.sp = null; this.spData = {}; this.box = null; this.holder = null;
    this.cine = null; this.view = null; // super in corso (vedi supers.js) e posa imposta dalla scena
    this.reflect = 0;            // Muro / Ruota: rimanda indietro i proiettili
    this.readDone = false;       // Piripinna: "Ti ho già inquadrato" usato in questo round
    this.stillT = 0; this.camo = false; // Il Pavone: Mimetismo
    if (this.ch.id === 'ilaryHead') this.meter = Math.max(this.meter || 0, 25); // Ilary Head: Sempre in lista
  }

  get grounded() { return this.y >= GROUND && this.vy >= 0; }
  set(state) { this.state = state; this.t = 0; }
  addMeter(n) { this.meter = Math.min(METER_MAX, this.meter + n * (this.st.live ? 2 : 1)); }
  speed() { return (this.st.slow ? 0.5 : 1) * (this.st.sluggish ? 0.6 : 1) * (this.st.venerdoc ? 1.2 : 1) * (this.st.crown ? 1.3 : 1) * (this.st.fast ? 1.35 : 1); }
  dmgOut() { return this.dmgMul * (this.st.drunk ? 1.5 : 1) * (this.st.venerdoc ? 1.6 : 1) * (this.st.weak ? 0.6 : 1); }

  // Riquadro colpibile del corpo, in coordinate del mondo.
  hurtbox() {
    const oy = this.ch.oy;
    const lying = this.state === 'knockdown' || this.state === 'ko';
    const h = lying ? 16 : this.crouching ? 42 - oy * 0.5 : 60 - oy;
    return { x0: this.x - 11, x1: this.x + 11, y0: this.y - h, y1: this.y };
  }

  // Colpo attivo in questo fotogramma: { box, hit } oppure null.
  currentHit() {
    if (this.state === 'attack') {
      const m = this.move;
      if (!m || this.t < m.startup || this.t >= m.startup + m.active) return null;
      return { box: this.makeBox([m.x0, m.x1, m.y0, m.y1]), hit: m };
    }
    if (this.box) return this.box;
    return null;
  }

  makeBox([x0, x1, y0, y1]) {
    const a = this.x + this.face * x0, b = this.x + this.face * x1;
    return { x0: Math.min(a, b), x1: Math.max(a, b), y0: this.y + y0, y1: this.y + y1 };
  }

  startAttack(name) {
    this.move = MOVES[name]; this.moveName = name;
    this.set('attack'); this.hitDone = false;
    this.crouching = !!this.move.crouch;
    if (this.move.air) this.airAttackUsed = true; else this.vx = 0;
    sfx.whoosh();
  }

  // ---------- comandi ----------
  readInput(opp) {
    const inp = this.ctrl.read(this, opp);
    const swap = o => ({ ...o, left: o.right, right: o.left });
    let held = inp.held, pressed = inp.pressed;
    if (this.st.invert) { held = swap(held); pressed = swap(pressed); }
    if (this.st.drunk && Math.floor(this.clock / 40) % 5 === 3) { held = swap(held); pressed = swap(pressed); }
    return { held, pressed, special: inp.special };
  }

  // Ricorda le direzioni premute (relative al verso) per riconoscere ↓ →, ← →, ↓ ←, ↓ ↓.
  trackDirections(p) {
    const fwd = this.face > 0 ? 'right' : 'left', back = this.face > 0 ? 'left' : 'right';
    const add = d => { this.dirHist.push({ d, t: this.clock }); if (this.dirHist.length > 6) this.dirHist.shift(); };
    if (p.down) add('D');
    if (p[fwd]) add('F');
    if (p[back]) add('B');
    if (p.up) add('U');
    if (p.punch) this.lastP = this.clock;
    if (p.kick) this.lastK = this.clock;
  }

  motionCode(btn) {
    const h = this.dirHist, n = h.length;
    if (n < 2) return null;
    const a = h[n - 2], b = h[n - 1];
    if (b.t - a.t > 18 || this.clock - b.t > 14) return null;
    const code = a.d + b.d + btn;
    return this.specials[code] ? code : null;
  }

  wantsSuper(p) {
    if (this.meter < METER_MAX || !this.specials.super) return false;
    return (p.punch && this.clock - this.lastK <= 5) || (p.kick && this.clock - this.lastP <= 5);
  }

  // ---------- aggiornamento ----------
  update(opp, fight) {
    this.fight = fight;
    const inp = this.readInput(opp);
    const fwd = this.face > 0 ? 'right' : 'left', back = this.face > 0 ? 'left' : 'right';
    this.t++; this.clock++;
    if (this.flash > 0) this.flash--;
    if (this.invuln > 0) this.invuln--;
    if (this.barrier > 0) this.barrier--;
    if (this.reflect > 0) this.reflect--;
    // Il Pavone, Mimetismo: fermo per 2 secondi diventa semitrasparente
    if (this.ch.id === 'pavone' && !this.camo) {
      const still = this.state === 'idle' && !Object.values(inp.held).some(Boolean);
      this.stillT = still ? this.stillT + 1 : 0;
      if (this.stillT >= 120) { this.camo = true; fight.say(this, '...', 30); }
    }
    for (const k in this.st) if (this.st[k] > 0 && --this.st[k] <= 0) delete this.st[k];
    this.trackDirections(inp.pressed);
    this.posHist.push([this.x, this.y]); if (this.posHist.length > 121) this.posHist.shift();
    this.box = null; this.countering = false;
    const canAct = !this.st.blind;

    switch (this.state) {
      case 'ko':
      case 'knockdown':
      case 'airhit':
        if (this.grounded && this.state === 'airhit') { this.set('knockdown'); this.vx *= 0.3; }
        if (this.grounded) this.vx *= 0.85;
        if (this.state === 'knockdown' && this.t > 40) { this.set('getup'); this.invuln = 20; }
        break;
      case 'getup':
        if (this.t > 14) this.set('idle');
        break;
      case 'hit':
      case 'blockstun':
      case 'dizzy':
        this.vx *= 0.82;
        if (--this.stun <= 0) { this.comboTaken = 0; this.set(this.state === 'blockstun' && inp.held.block ? 'block' : 'idle'); }
        break;
      case 'held':
      case 'superheld':
        this.vx = 0;
        break;
      case 'victory':
        if (this.grounded && this.t % 50 === 0) this.vy = -3;
        break;
      case 'attack': {
        const m = this.move;
        if (this.t <= 4 && !m.air && this.wantsSuper(inp.pressed)) { fight.startSuper(this); break; }
        if (m.air) { if (this.grounded) { this.set('land'); this.move = null; } }
        else if (this.t >= m.startup + m.active + m.recovery) { this.move = null; this.set(this.crouching && inp.held.down ? 'crouch' : 'idle'); }
        break;
      }
      case 'special': this.updateSpecial(opp, fight, inp); break;
      case 'grabbing': this.updateGrab(opp, fight); break;
      case 'super': {
        const c = this.cine;
        if (!c) { this.set('idle'); break; }
        c.t++; c.fx = []; this.invuln = Math.max(this.invuln, 2); this.vx = 0; this.vy = 0;
        if (c.caught && opp.state === 'ko') { finishSuper(this, opp); break; }
        (SCRIPTS[this.ch.id] || finishSuper)(this, opp, fight, c);
        break;
      }
      case 'land':
        this.vx = 0;
        if (this.t > 4) this.set('idle');
        break;
      case 'jump':
        if (this.grounded && this.t > 2) { this.set('land'); break; }
        if (canAct && (inp.pressed.punch || inp.pressed.kick) && !this.airAttackUsed) this.startAttack('airkick');
        else if (inp.pressed.up && this.ch.doubleJump && this.airJumps > 0) {
          this.airJumps--; this.vy = -this.jumpV * 0.85;
          this.vx = (inp.held.right ? 1 : inp.held.left ? -1 : 0) * this.walk * 1.1 * this.speed(); sfx.jump();
        }
        break;
      default: { // libero a terra
        this.crouching = false;
        if (canAct) {
          if (inp.special === 'super' || this.wantsSuper(inp.pressed)) { if (this.meter >= METER_MAX && this.specials.super) { fight.startSuper(this); break; } }
          const code = inp.special && inp.special !== 'super' ? inp.special
            : inp.pressed.punch ? this.motionCode('P') : inp.pressed.kick ? this.motionCode('K') : null;
          if (code && this.startSpecial(code, fight)) break;
          if (inp.pressed.punch) { this.startAttack(inp.held.down ? 'cpunch' : 'punch'); break; }
          if (inp.pressed.kick) { this.startAttack(inp.held.down ? 'sweep' : 'kick'); break; }
        }
        const sp = this.walk * this.speed();
        if (inp.held.up && this.grounded) {
          this.set('jump'); this.vy = -this.jumpV; this.airAttackUsed = false; this.airJumps = this.ch.doubleJump ? 1 : 0;
          this.vx = (inp.held.right ? 1 : inp.held.left ? -1 : 0) * sp * 1.15; sfx.jump();
          break;
        }
        if (inp.held.block) { this.crouching = inp.held.down; if (this.state !== 'block') this.set('block'); this.vx = 0; }
        else if (inp.held.down) { this.crouching = true; if (this.state !== 'crouch') this.set('crouch'); this.vx = 0; }
        else if (inp.held[fwd]) { if (this.state !== 'walk') this.set('walk'); this.vx = this.face * sp; }
        else if (inp.held[back]) { if (this.state !== 'walk') this.set('walk'); this.vx = -this.face * sp * 0.75; }
        else { if (this.state !== 'idle') this.set('idle'); this.vx = 0; }
      }
    }

    // Fisica
    const pinned = this.state === 'held' || this.state === 'superheld' || this.state === 'grabbing' || this.state === 'super';
    if (!pinned) {
      if (!this.grounded || this.vy < 0) { this.vy += GRAVITY; }
      this.y += this.vy; this.x += this.vx;
      if (this.y >= GROUND) { this.y = GROUND; if (this.vy > 0) this.vy = 0; }
    }
    this.x = Math.max(WALL_L, Math.min(WALL_R, this.x));

    // Si gira verso l'avversario solo quando è libero a terra
    if ((FREE.has(this.state) || this.state === 'land') && this.grounded) this.face = opp.x >= this.x ? 1 : -1;
    this.shownHp += (this.hp - this.shownHp) * 0.12;
  }

  // ---------- mosse speciali ----------
  startSpecial(code, fight) {
    const d = this.specials[code];
    if (!d) return false;
    if (d.cost && this.meter < d.cost) return false;
    if (d.cost) this.meter -= d.cost;
    this.sp = d; this.spCode = code; this.spData = { n: 0, hits: 0 };
    this.set('special'); this.hitDone = false; this.vx = 0; this.crouching = d.anim === 'cpunch';
    if (d.shout) fight.say(this, d.shout);
    sfx.whoosh();
    return true;
  }

  endSpecial() { this.sp = null; this.box = null; this.set(this.grounded ? 'idle' : 'jump'); this.crouching = false; }

  updateSpecial(opp, fight, inp) {
    const d = this.sp, t = this.t, S = d.startup || 0;
    const end = (n) => { if (t >= n) this.endSpecial(); };
    const activeWindow = a => t >= S && t < S + a;
    switch (d.kind) {
      case 'proj':
        if (t === S) d.proj.forEach(p => fight.spawnProj(this, p));
        end(S + d.recovery);
        break;
      case 'barrier':
        if (t === S) { this.barrier = d.dur; fight.say(this, 'FIREWALL'); }
        end(S + d.recovery);
        break;
      case 'rewind':
        if (t === S) {
          const [x, y] = this.posHist[0] || [this.x, this.y];
          this.x = x; this.y = Math.min(GROUND, y); this.vy = 0;
          this.hp = Math.min(this.hpMax, this.hp + d.heal); this.flash = 6; this.invuln = 10;
          fight.say(this, 'CTRL+Z'); fight.overlay('rewind', 12);
        }
        end(S + d.recovery);
        break;
      case 'self':
        if (t === S) {
          if (d.heal) this.hp = Math.min(this.hpMax, this.hp + d.heal);
          if (d.meter) this.meter = Math.min(METER_MAX, this.meter + d.meter);
          Object.assign(this.st, d.buff || {});
          sfx.select();
        }
        end(S + d.recovery);
        break;
      case 'zone':
        if (t === S) {
          fight.addZone(this, d.zone);
          if (d.heal) this.hp = Math.min(this.hpMax, this.hp + d.heal);
          if (d.meterCost) this.meter = Math.max(0, this.meter - d.meterCost);
        }
        end(S + d.recovery);
        break;
      case 'trap':
        if (t === S) fight.addTrap(this, d);
        end(S + d.recovery);
        break;
      case 'melee':
        if (activeWindow(d.active) && !this.hitDone) this.box = { box: this.makeBox(d.box), hit: d.hit, sp: d };
        if (d.reflect && activeWindow(d.active)) this.reflect = 2;
        if (d.wave && t === S) fight.addWave(this);
        if (t === S + d.active && !this.hitDone && d.whiffMeter) this.addMeter(d.whiffMeter);
        end(S + d.active + d.recovery);
        break;
      case 'dash':
        if (activeWindow(d.active)) {
          this.vx = this.face * d.speed * this.speed();
          if (d.armor) this.st.armor = Math.max(this.st.armor || 0, 2);
          if (d.every && (t - S) % d.every === 0) this.hitDone = false;
          if (!this.hitDone) this.box = { box: this.makeBox(d.box), hit: d.hit, sp: d };
        } else this.vx *= 0.7;
        if (this.hitDone && !d.every && t < S + d.active) { this.vx = 0; this.t = S + d.active; }
        end(S + d.active + d.recovery);
        break;
      case 'grab':
        if (t === S) {
          const close = Math.abs(opp.x - this.x) < d.range && Math.abs(opp.y - this.y) < 10;
          if (close && !UNGRABBABLE.has(opp.state) && !opp.invuln) {
            this.set('grabbing'); this.spData.hold = d.hold;
            opp.set('held'); opp.holder = this; opp.crouching = false;
            return;
          }
        }
        end(S + d.active + d.recovery);
        break;
      case 'counter':
        this.countering = activeWindow(d.active);
        end(S + d.active + d.recovery);
        break;
      case 'channel':
        if (activeWindow(d.active) && (t - S) % 10 === 0) this.hp = Math.min(this.hpMax, this.hp + Math.round(d.heal / 5));
        end(S + d.active + d.recovery);
        break;
      case 'rising':
        if (t === S) { this.vy = d.vy; this.vx = this.face * 1.2; this.invuln = d.invuln; }
        if (activeWindow(d.active)) {
          if (d.reflect) this.reflect = 2;
          if ((t - S) % d.every === 0) this.hitDone = false;
          if (!this.hitDone) this.box = { box: this.makeBox(d.box), hit: d.hit, sp: d };
        }
        if (t > S + 4 && this.grounded) { this.sp = null; this.set('land'); }
        break;
      case 'chain': {
        const step = d.step, local = t - this.spData.n * step;
        if (inp.pressed.kick && this.spData.n < d.max - 1) this.spData.queued = true;
        if (local >= 5 && local < 8 && !this.hitDone) {
          const last = this.spData.n === d.max - 1;
          this.box = { box: this.makeBox(d.box), hit: last ? d.final : d.hit, sp: d };
        }
        if (local >= step) {
          if (this.spData.queued) { this.spData.n++; this.spData.queued = false; this.hitDone = false; fight.say(this, d.shout); sfx.whoosh(); }
          else this.endSpecial();
        }
        break;
      }
      case 'teleport':
        if (t === 2) {
          const dist = Math.abs(opp.x - this.x);
          if (dist < d.range) {
            const side = Math.sign(opp.x - this.x) || 1;
            this.x = Math.max(WALL_L, Math.min(WALL_R, opp.x + side * 22));
            this.face = opp.x >= this.x ? 1 : -1; this.invuln = 8;
            fight.overlay('dust', 10, this.x);
          }
        }
        if (activeWindow(d.active) && !this.hitDone) this.box = { box: this.makeBox(d.box), hit: d.hit, sp: d };
        end(S + d.active + d.recovery);
        break;
      case 'random':
        if (t === S) {
          const roll = ['1', 'X', '2'][Math.floor(fight.rng() * 3)];
          fight.say(this, roll, 18);
          if (roll === '1') { fight.overlay('lightning', 16, opp.x); fight.applyHit(this, opp, d.win, { x: opp.x - this.face, face: this.face }); }
          if (roll === '2') { this.hp = Math.max(1, this.hp - d.lose); this.flash = 5; fight.overlay('lightning', 16, this.x); sfx.hit(); }
        }
        end(S + d.recovery);
        break;
      case 'hold': {
        const D = this.spData;
        if (t >= S && !D.released) {
          if (!inp.held.punch && t > S + 6 || t >= S + d.max) D.released = t;
          D.len = Math.min(92, 18 + (t - S) * 1.3);
          if ((t - S) % d.every === 0) this.hitDone = false;
          if (!this.hitDone) this.box = { box: this.makeBox([10, 10 + D.len, -46, -24]), hit: d.hit, sp: d };
          if ((t - S) % 10 === 0) fight.say(this, 'D' + 'R'.repeat(Math.min(9, 2 + Math.floor((t - S) / 8))) + 'AGO!', 10, true);
        }
        if (D.released && t >= D.released + d.recovery) this.endSpecial();
        break;
      }
      default: this.endSpecial();
    }
  }

  // Presa riuscita: l'avversario è tenuto davanti e poi lanciato a terra.
  updateGrab(opp, fight) {
    const d = this.sp;
    if (opp.state !== 'held') { this.endSpecial(); return; }
    opp.x = this.x + this.face * 16; opp.y = GROUND - Math.min(10, this.t);
    if (this.t >= this.spData.hold) {
      opp.y = GROUND; opp.holder = null; opp.set('idle');
      fight.applyHit(this, opp, { ...d.hit, unblockable: true }, this);
      this.endSpecial();
    }
  }

  // ---------- colpi ricevuti ----------
  // Il difensore para se sta parando, guarda chi colpisce e la parata è dell'altezza giusta.
  canBlock(m, src) {
    if (m.unblockable) return false;
    const blocking = this.state === 'block' || this.state === 'blockstun';
    if (!blocking || !this.grounded) return false;
    if ((src.x - this.x) * this.face < 0) return false;
    if (m.level === 'low') return this.crouching;
    if (m.level === 'high') return !this.crouching;
    return true;
  }

  receive(att, m = att.move, src = att) {
    const dir = src.face ?? att.face;
    if (this.state === 'knockdown' || this.state === 'getup' || this.state === 'ko') return null;
    if (this.invuln > 0) return null;
    if (this.state === 'held' && !m.unblockable) return null;
    const fromFront = (src.x - this.x) * this.face >= 0;
    if (this.barrier > 0 && fromFront && !m.unblockable) { this.barrier = 0; return 'absorb'; }
    if (this.countering && fromFront && !m.unblockable) return 'counter';
    if (this.canBlock(m, src)) {
      const chip = Math.max(1, Math.round(m.dmg * att.dmgOut() * 0.1));
      this.hp = Math.max(1, this.hp - chip);
      this.state = 'blockstun'; this.t = 0; this.stun = m.blockstun; this.vx = dir * m.push;
      sfx.block();
      return 'block';
    }
    let mul = att.dmgOut();
    // Il Pavone, Mimetismo: il primo colpo dopo essere sparito fa il 30% in più
    if (att.camo) { mul *= 1.3; att.camo = false; att.stillT = 0; }
    this.camo = false; this.stillT = 0;
    // Piripinna, Ti ho già inquadrato: la prima mossa speciale subita nel round fa metà danno
    if (this.ch.id === 'piripinna' && !this.readDone && (att.state === 'special' || src !== att)) {
      mul *= 0.5; this.readDone = true; att.fight && att.fight.say(this, 'TI HO INQUADRATO!', 30);
    }
    if (att.bonusNext) { mul *= 2; att.bonusNext = false; att.fight && att.fight.say(att, 'CI SONO RIMASTO MALE!', 30); }
    if (this.st.reduce) mul *= 0.5;
    const bonus = m.bonusVs && this.ch.id === m.bonusVs ? 5 : 0;
    const dmg = Math.max(1, Math.round((m.dmg + bonus) * mul));
    this.hp = Math.max(0, this.hp - dmg);
    this.flash = 4;
    sfx[m.sfx] ? sfx[m.sfx]() : sfx.hit();
    // con l'armatura (Pausa proteica, Mischia) si prende il danno ma non ci si ferma
    if (this.hp > 0 && this.st.armor && !m.knockdown && !m.keepHeld) return 'armor';
    this.move = null; this.sp = null; this.box = null;
    // combo subita (passiva del Doc: dopo 4 colpi di fila il prossimo suo colpo fa il doppio)
    this.comboTaken = this.state === 'hit' || this.state === 'superheld' ? this.comboTaken + 1 : 1;
    if (this.ch.id === 'ilDoc' && this.comboTaken >= 4) this.bonusNext = true;
    if (this.hp <= 0) { this.holder = null; this.set('ko'); this.y = Math.min(this.y, GROUND); this.vy = -3.6; this.vx = dir * 2.2; this.crouching = false; sfx.ko(); return 'ko'; }
    if (m.keepHeld) return 'hit';
    if (m.effect) {
      if (m.effect.stun) { this.state = 'dizzy'; this.t = 0; this.stun = m.effect.stun; this.vx = dir * 1; return 'hit'; }
      for (const k of ['slow', 'blind', 'invert', 'weak']) if (m.effect[k]) this.st[k] = Math.max(this.st[k] || 0, m.effect[k]);
    }
    if (m.knockdown) { this.set('airhit'); this.vy = m.launch ?? -2.4; this.vx = dir * 1.6; this.crouching = false; return 'hit'; }
    if (!this.grounded) { this.set('airhit'); this.vy = -2.8; this.vx = dir * 2; return 'hit'; }
    this.state = 'hit'; this.t = 0; this.stun = m.hitstun; this.vx = dir * m.push;
    return 'hit';
  }
}
