// Le super come piccole scene: ogni personaggio ha il suo copione, fotogramma per fotogramma.
// Il copione muove i due lottatori, sceglie le pose (f.view), assesta i colpi e mette gli effetti
// da disegnare in c.fx (vedi drawCine in view.js). Tempi in fotogrammi a 60 al secondo.
import { GROUND, WALL_L, WALL_R, W } from '../config.js';
import { sfx } from '../audio.js';

// colpo della scena: non si para, tiene fermo l'avversario e non ricarica la barra
const HIT = (dmg, o = {}) => ({ dmg, level: 'mid', hitstun: 20, blockstun: 10, push: 0, sfx: 'hit', unblockable: true, keepHeld: true, noMeter: true, ...o });
// colpo finale: manda a terra
const FINAL = (dmg, o = {}) => ({ dmg, level: 'mid', hitstun: 24, blockstun: 12, push: 2, sfx: 'heavy', unblockable: true, knockdown: true, noMeter: true, ...o });

const clampX = x => Math.max(WALL_L + 4, Math.min(WALL_R - 4, x));
const lerp = (a, b, k) => a + (b - a) * Math.max(0, Math.min(1, k));

// L'avversario si può prendere? (non a terra, non invulnerabile, non in aria)
function catchable(opp) {
  return !['knockdown', 'getup', 'ko', 'airhit'].includes(opp.state) && !(opp.invuln > 0) && opp.y >= GROUND - 2;
}

function grab(f, opp) {
  opp.set('superheld'); opp.holder = f; opp.vx = 0; opp.vy = 0; opp.crouching = false;
  opp.move = null; opp.sp = null; opp.box = null; opp.barrier = 0; opp.countering = false;
  opp.y = GROUND;
}

function hitOpp(f, opp, fight, dmg, o = {}) {
  const { stop, ...rest } = o;
  const r = fight.applyHit(f, opp, HIT(dmg, rest), f);
  if (stop != null) fight.hitstop = stop;
  return r;
}

function release(f, opp, fight, dmg, o = {}) {
  opp.holder = null; opp.view = null;
  if (opp.state === 'superheld') opp.state = 'idle';
  const r = fight.applyHit(f, opp, FINAL(dmg, o), f);
  fight.shake = Math.max(fight.shake, 8);
  return r;
}

export function finishSuper(f, opp) {
  f.cine = null; f.view = null; f.box = null; f.sp = null;
  if (opp && opp.holder === f) {
    opp.holder = null; opp.view = null;
    if (opp.state === 'superheld') opp.set('idle');
  }
  if (f.y < GROUND) { f.set('jump'); f.vy = 0; } else { f.y = GROUND; f.set('idle'); }
}

// Corsa verso l'avversario: 'go' finché corre, 'caught' se lo prende, 'miss' se va a vuoto o viene parata.
function rush(f, opp, fight, c, { speed = 6, max = 34, anim = 'dash' } = {}) {
  f.view = { anim, idx: Math.floor(c.t / 4) % 2 };
  f.x = clampX(f.x + f.face * speed);
  c.fx.push({ type: 'speed', x: f.x, y: f.y, face: f.face });
  const close = Math.abs(opp.x - f.x) < 28 && (opp.x - f.x) * f.face > -6;
  if (close) {
    if (opp.canBlock({ level: 'mid' }, f)) {
      fight.applyHit(f, opp, { dmg: 4, level: 'mid', hitstun: 10, blockstun: 18, push: 3, sfx: 'block' }, f);
      return 'miss';
    }
    if (catchable(opp)) { grab(f, opp); c.caught = true; c.t0 = c.t; return 'caught'; }
  }
  return c.t >= max ? 'miss' : 'go';
}

// Fine a vuoto: una piccola pausa e poi si torna liberi.
function whiff(f, opp, c, len = 24) {
  if (!c.missAt) c.missAt = c.t;
  f.view = { anim: 'land', idx: 0 };
  if (c.t - c.missAt > len) finishSuper(f, opp);
}

export const SCRIPTS = {
  // ---------- Doc Lady: Schermata Blu ----------
  // Scrive al portatile, all'avversario esce la schermata blu sopra la testa e si blocca;
  // gli errori fanno danni a ogni aggiornamento, poi "spegni e riaccendi" e va giù.
  docLady(f, opp, fight, c) {
    const t = c.t;
    f.view = { anim: 'typing', idx: Math.floor(t / 4) % 2 };
    if (t < 22) {
      c.fx.push({ type: 'bits', x0: f.x + f.face * 14, x1: opp.x, y: f.y - 34, t });
      if (t === 21) {
        if (catchable(opp)) { grab(f, opp); c.caught = true; fight.say(f, 'CTRL+ALT+CANC', 40); sfx.select(); }
        else { fight.say(f, 'NESSUN BERSAGLIO', 30); c.miss = true; }
      }
      return;
    }
    if (c.miss) return whiff(f, opp, c);
    const k = (t - 22) / 70;
    opp.view = { anim: 'hit', idx: 1, tint: 0x8090ff };
    c.fx.push({ type: 'bsod', x: opp.x, k: Math.min(1, k), glitch: t % 12 < 2 });
    if (t >= 30 && t <= 78 && (t - 30) % 12 === 0) {
      hitOpp(f, opp, fight, 4);
      fight.say(opp, ['0x0000007B', 'IRQL_NOT_LESS', 'KERNEL PANIC', 'DRIVER_IRQL', 'MEMORY_DUMP'][(t - 30) / 12], 12, true);
    }
    if (t === 90) { fight.say(f, 'SPEGNI E RIACCENDI', 40); fight.overlay('flash', 14); }
    if (t === 96) release(f, opp, fight, 14);
    if (t >= 96) f.view = { anim: 'punch', idx: 1 };
    if (t > 122) finishSuper(f, opp);
  },

  // ---------- Socio Spritzu: Ace ----------
  // Prende la mira, poi compare a destra e a sinistra dell'avversario: un'uccisione per colpo, fino all'ACE.
  socioSpritzu(f, opp, fight, c) {
    const t = c.t;
    if (t < 20) {
      f.view = { anim: 'aim', idx: 0 };
      c.fx.push({ type: 'cross', x: lerp(f.x + f.face * 30, opp.x, t / 16), y: opp.y - 40, col: 0xff4a4a });
      if (t === 19) {
        if (catchable(opp)) { grab(f, opp); c.caught = true; sfx.select(); }
        else { fight.say(f, 'MANCATO', 30); c.miss = true; }
      }
      return;
    }
    if (c.miss) return whiff(f, opp, c);
    opp.view = { anim: 'hit', idx: Math.floor(t / 6) % 2 };
    const i = Math.floor((t - 20) / 12), local = (t - 20) % 12;
    if (i < 5) {
      if (local === 0) {
        fight.overlay('dust', 10, f.x);
        let side = i % 2 ? 1 : -1;
        let nx = opp.x + side * 24;
        if (nx < WALL_L + 6 || nx > WALL_R - 6) { side = -side; nx = opp.x + side * 24; }
        f.x = clampX(nx); f.face = opp.x >= f.x ? 1 : -1;
        sfx.whoosh();
      }
      f.view = local < 3 ? { anim: 'dash', idx: 0, alpha: 0.5 } : { anim: i % 2 ? 'punch' : 'kick', idx: local < 8 ? 1 : 2 };
      if (local === 4) { hitOpp(f, opp, fight, 4); fight.say(f, `${i + 1} KILL`, 12, true); }
      return;
    }
    // ACE
    f.view = { anim: 'aim', idx: 0 };
    if (t < 98) c.fx.push({ type: 'cross', x: opp.x, y: opp.y - 40, col: 0xffe060 });
    if (t === 90) fight.say(f, 'ACE!', 40, true);
    if (t === 98) { release(f, opp, fight, 14); fight.overlay('flash', 10); }
    if (t > 124) finishSuper(f, opp);
  },

  // ---------- Ste: Sì fratello... NO. ----------
  // Corre, abbraccia l'avversario ("SÌ FRATELLO!"), poi cambia faccia: raffica di pugni e testata.
  ste(f, opp, fight, c) {
    if (!c.caught && !c.miss) {
      const r = rush(f, opp, fight, c, { speed: 6.5, max: 30 });
      if (r === 'caught') fight.say(f, 'SÌ FRATELLO!', 40);
      if (r === 'miss') c.miss = true;
      return;
    }
    if (c.miss) return whiff(f, opp, c);
    const t = c.t - c.t0;
    opp.x = clampX(f.x + f.face * (t < 44 ? 15 : 20));
    if (t < 44) {
      f.view = { anim: 'grab', idx: 0 };
      opp.view = { anim: 'idle', idx: 0 };
      c.fx.push({ type: 'hearts', x: (f.x + opp.x) / 2, y: f.y - 62, t });
      return;
    }
    if (t === 44) { fight.say(f, '...NO.', 40, true); fight.shake = 10; sfx.heavy(); }
    if (t < 60) {
      f.view = { anim: 'idle', idx: 0, tint: 0xff5050 };
      opp.view = { anim: 'hit', idx: 0 };
      c.fx.push({ type: 'rage', x: f.x, y: f.y - 66 + f.ch.oy, t });
      return;
    }
    if (t < 104) {
      const k = t - 60;
      f.view = { anim: k % 8 < 4 ? 'punch' : 'cpunch', idx: 1, tint: 0xff8080 };
      opp.view = { anim: 'hit', idx: k % 8 < 4 ? 0 : 1 };
      c.fx.push({ type: 'fists', x: f.x + f.face * 18, y: f.y - 40, face: f.face, t });
      if (k % 4 === 0) hitOpp(f, opp, fight, 2, { stop: 2 });
      return;
    }
    if (t < 112) { f.view = { anim: 'headbutt', idx: 0, tint: 0xff8080 }; opp.view = { anim: 'hit', idx: 1 }; return; }
    if (t === 112) release(f, opp, fight, 14);
    f.view = { anim: 'headbutt', idx: 1 };
    if (t > 136) finishSuper(f, opp);
  },

  // ---------- Sergente Argus: Ordine del Sergente ----------
  // Indica e urla: l'avversario si butta a terra a fare flessioni contate, il sergente lo pesta a ogni conta.
  sergenteArgus(f, opp, fight, c) {
    const t = c.t;
    if (t < 20) {
      f.view = { anim: 'point', idx: 0 };
      if (t === 2) fight.say(f, 'A TERRA! FLESSIONI!', 50);
      if (t % 6 === 2) fight.addWave(f);
      if (t === 19) {
        if (catchable(opp)) { grab(f, opp); c.caught = true; opp.face = f.face; }
        else { fight.say(f, 'TORNA QUI!', 30); c.miss = true; }
      }
      return;
    }
    if (c.miss) return whiff(f, opp, c);
    // l'avversario a pancia in giù, girato dall'altra parte
    const k = t - 20, up = Math.floor(k / 7) % 2;
    opp.view = { anim: 'hurt', idx: 0, rot: opp.face * (up ? 1.32 : 1.5), dy: up ? -15 : -14 };
    c.fx.push({ type: 'sweat', x: opp.x + opp.face * 42, y: GROUND - 20, t });
    // il sergente va a mettersi sopra, poi conta e pesta
    const target = clampX(opp.x - opp.face * 4);
    if (c.ta == null) {
      if (Math.abs(f.x - target) > 3 && k < 60) { f.x += Math.sign(target - f.x) * 4; f.face = Math.sign(target - f.x) || f.face; f.view = { anim: 'walkF', idx: Math.floor(t / 4) % 6 }; return; }
      f.x = target; c.ta = t;
    }
    f.face = opp.face;
    const q = t - c.ta, n = Math.floor((q - 8) / 14), local = (q - 8) % 14;
    if (q < 8) { f.view = { anim: 'point', idx: 0 }; return; }
    if (n < 5) {
      f.view = { anim: 'stomp', idx: local < 7 ? 0 : 1 };
      if (local === 7) { hitOpp(f, opp, fight, 4); fight.say(opp, `${(n + 1) * 10}!`, 12, true); }
      return;
    }
    if (q < 90) { f.view = { anim: 'stomp', idx: 0 }; if (q === 80) fight.say(f, 'DAI DOC!', 30); return; }
    if (q === 90) { release(f, opp, fight, 14); fight.overlay('dust', 16, opp.x + opp.face * 20); }
    f.view = { anim: 'stomp', idx: 1 };
    if (q > 112) finishSuper(f, opp);
  },

  // ---------- Il Doc: Oggi è Venerdoc! ----------
  // Scende la palla da discoteca, il Doc balla e l'avversario resta abbagliato; poi parte il potenziamento.
  ilDoc(f, opp, fight, c) {
    const t = c.t;
    c.fx.push({ type: 'disco', y: lerp(-20, 68, t / 28), t, lights: t > 28 });
    if (t < 28) { f.view = { anim: 'point', idx: 0 }; return; }
    if (t === 28) {
      fight.overlay('disco', 420);
      if (catchable(opp)) { opp.set('dizzy'); opp.stun = 96; opp.vx = 0; opp.move = null; opp.sp = null; opp.box = null; fight.say(opp, 'CHE LUCI...', 40); }
    }
    f.view = { anim: 'dance', idx: Math.floor((t - 28) / 9) % 4 };
    c.fx.push({ type: 'notes', x: f.x, y: f.y - 60, t });
    if (t === 60) fight.say(f, 'VENERDOC!', 30, true);
    if (t === 104) { Object.assign(f.st, { venerdoc: 360 }); f.flash = 6; sfx.select(); }
    if (t > 112) finishSuper(f, opp);
  },

  // ---------- Brodi J: Scheda di allenamento ----------
  // Prende l'avversario, lo alza sopra la testa e lo usa come bilanciere: squat contati, poi lo lancia.
  brodiJ(f, opp, fight, c) {
    if (!c.caught && !c.miss) {
      const r = rush(f, opp, fight, c, { speed: 5.5, max: 32 });
      if (r === 'caught') fight.say(f, 'BRODI BRODI', 30);
      if (r === 'miss') c.miss = true;
      return;
    }
    if (c.miss) return whiff(f, opp, c);
    const t = c.t - c.t0;
    // l'avversario in orizzontale sopra la testa
    const k = Math.min(1, t / 14);
    let bar = 0;
    if (t < 14) f.view = { anim: 'grab', idx: 0 };
    else {
      const s = Math.floor((t - 14) / 18), local = (t - 14) % 18;
      if (s < 4) {
        const down = local >= 6 && local < 13;
        f.view = { anim: 'lift', idx: down ? 1 : 0 };
        bar = down ? 6 : 0;
        if (local === 9) { hitOpp(f, opp, fight, 4); fight.say(f, `SQUAT ${s + 1}!`, 12, true); }
      } else f.view = { anim: 'lift', idx: 0 };
    }
    opp.view = { anim: 'hurt', idx: 0, rot: f.face * Math.PI / 2 * k, depth: 3 };
    opp.x = f.x - f.face * lerp(-14, 24, k);
    opp.y = lerp(GROUND, f.y - 64 + f.ch.oy + bar, k);
    if (t === 86) fight.say(f, 'ANCORA UNA!', 20, true);
    if (t === 98) {
      opp.x = clampX(f.x + f.face * 6);
      const r = release(f, opp, fight, 14);
      if (r && opp.state === 'airhit') { opp.vx = f.face * 3.4; opp.vy = -3; }
    }
    if (t >= 98) f.view = { anim: 'punch', idx: 1 };
    if (t > 126) finishSuper(f, opp);
  },

  // ---------- Bro: Meta! ----------
  // Placcaggio, si carica l'avversario in spalla, corre fino al muro e si tuffa a schiacciarlo: META!
  bro(f, opp, fight, c) {
    if (!c.caught && !c.miss) {
      const r = rush(f, opp, fight, c, { speed: 6.5, max: 30 });
      if (r === 'caught') fight.say(f, 'OH BRO!', 30);
      if (r === 'miss') c.miss = true;
      return;
    }
    if (c.miss) return whiff(f, opp, c);
    const t = c.t - c.t0;
    const goal = f.face > 0 ? WALL_R - 52 : WALL_L + 52;
    if (!c.dive) {
      const k = Math.min(1, t / 10);
      f.view = t < 10 ? { anim: 'grab', idx: 0 } : { anim: 'carry', idx: Math.floor(t / 5) % 2 };
      opp.view = { anim: 'hurt', idx: 0, rot: f.face * Math.PI / 2 * k, depth: 3 };
      if (t >= 10) {
        f.x = clampX(f.x + f.face * 3.4);
        c.fx.push({ type: 'speed', x: f.x, y: f.y, face: f.face });
        if (t % 12 === 0 && (c.bumps = (c.bumps || 0) + 1) <= 4) hitOpp(f, opp, fight, 4, { stop: 2 });
      }
      opp.x = f.x - f.face * lerp(-14, 26, k);
      opp.y = lerp(GROUND, f.y - 60 + f.ch.oy, k);
      if ((t >= 10 && (f.x - goal) * f.face >= 0) || t > 90) { c.dive = t; while ((c.bumps || 0) < 4) { c.bumps = (c.bumps || 0) + 1; hitOpp(f, opp, fight, 4, { stop: 0 }); } }
      return;
    }
    const d = t - c.dive;
    if (d < 16) {
      // tuffo: arco in avanti e giù
      const k = d / 16;
      f.x = clampX(f.x + f.face * 1.6);
      f.y = GROUND - 4 * k * (1 - k) * 16; // arco (senza seno: uguale su tutti i browser, serve all'online)
      f.view = { anim: 'dash', idx: 1, rot: f.face * k * 1.1 };
      opp.view = { anim: 'hurt', idx: 0, rot: f.face * Math.PI / 2, depth: 3 };
      opp.x = f.x - f.face * lerp(26, 0, k) + f.face * 8 * k;
      opp.y = lerp(f.y - 60 + f.ch.oy, GROUND - 14, k);
      return;
    }
    if (d === 16) {
      f.y = GROUND;
      opp.y = GROUND; opp.x = clampX(f.x);
      fight.say(f, 'META!', 50, true);
      fight.overlay('dust', 20, f.x); fight.overlay('flash', 8);
      release(f, opp, fight, 18);
      if (opp.state === 'airhit') { opp.vy = -1; opp.vx = f.face * 0.6; }
    }
    f.view = d < 34 ? { anim: 'dash', idx: 1, rot: f.face * 1.1, dy: -4 } : { anim: 'getup', idx: 0 };
    if (d > 46) finishSuper(f, opp);
  },

  // ---------- Mc: Il re del calcetto ----------
  // Palleggi contati col pallone, poi tre tiri al volo e l'ultimo (d'oro) manda a terra. Poi la corona.
  mc(f, opp, fight, c) {
    const t = c.t;
    if (t < 64) {
      const ph = t % 16;
      f.view = { anim: 'juggle', idx: ph < 5 ? 0 : 1 };
      c.fx.push({ type: 'jball', x: f.x + f.face * 9, y: f.y - 14 - Math.sin(ph / 16 * Math.PI) * 34 });
      if (ph === 2) fight.say(f, String(Math.floor(t / 16) + 1), 12, true);
      return;
    }
    const k = t - 64;
    f.view = { anim: 'kick', idx: k % 12 < 4 ? 0 : k % 12 < 9 ? 1 : 2 };
    if (k % 12 === 4 && k < 36) {
      const last = k >= 24;
      fight.spawnProj(f, { type: 'ball', white: !last, gold: last, vx: last ? 7 : 6, y: -22, w: 8, h: 8, trail: true,
        hit: last ? { dmg: 12, level: 'mid', hitstun: 24, blockstun: 14, push: 3, knockdown: true, sfx: 'heavy', noMeter: true }
          : { dmg: 8, level: 'mid', hitstun: 20, blockstun: 12, push: 1.5, sfx: 'hit', noMeter: true } });
      sfx.whoosh();
      if (last) fight.say(f, 'GOOOL!', 40, true);
    }
    if (k === 40) { Object.assign(f.st, { crown: 300 }); fight.say(f, 'IL RE!', 30); sfx.select(); }
    if (k > 48) finishSuper(f, opp);
  },

  // ---------- Drrrrrrago: Drago supremo ----------
  // Si carica, sparisce in un lampo e un drago enorme attraversa l'arena sputando fuoco.
  drrrrrrago(f, opp, fight, c) {
    const t = c.t;
    if (t < 30) {
      f.view = { anim: 'power', idx: Math.floor(t / 5) % 2, tint: t % 6 < 3 ? 0x80ff90 : undefined };
      c.fx.push({ type: 'aura', x: f.x, y: f.y, t });
      if (t === 29) { fight.overlay('flash', 12); sfx.heavy(); }
      return;
    }
    const k = t - 30;
    if (!c.dragon) c.dragon = { x: f.x - f.face * 70, trail: [] };
    const D = c.dragon;
    // vola fino a sopra l'avversario, si ferma a sputare fuoco e poi se ne va
    const stopX = opp.x - f.face * 34;
    if (!D.hover && (D.x - stopX) * f.face >= 0 && k > 6) D.hover = k;
    D.x += f.face * (D.hover && k - D.hover < 42 ? 0.4 : 5);
    const y = GROUND - 64 + Math.sin(k * 0.12) * 10;
    D.trail.unshift([D.x, y]); if (D.trail.length > 60) D.trail.pop();
    const inside = D.x > -60 && D.x < W + 60;
    f.view = { anim: 'idle', idx: 0, hide: true };
    c.fx.push({ type: 'dragon', trail: D.trail, face: f.face, t, fire: inside });
    // fuoco davanti alla bocca, in basso
    const fx0 = D.x + f.face * 10, fx1 = D.x + f.face * 64;
    const inFire = (opp.x - Math.min(fx0, fx1)) > -8 && (Math.max(fx0, fx1) - opp.x) > -8;
    if (inside && inFire && k % 8 === 0 && (c.hits = c.hits || 0) < 7) {
      const r = fight.applyHit(f, opp, { dmg: 4, level: 'mid', hitstun: 18, blockstun: 10, push: 0.4, sfx: 'hit', noMeter: true, knockdown: c.hits === 6 }, { x: D.x, face: f.face });
      if (r) c.hits++;
    }
    if (k === 20) fight.say(f, 'DRRRRRRRRAGO!', 50, true);
    if (!inside && k > 40 || k > 140) {
      if (!c.back) { c.back = t; fight.overlay('flash', 8); }
      f.view = { anim: 'victory', idx: Math.floor((t - c.back) / 8) % 2 };
      if (t - c.back > 24) finishSuper(f, opp);
    }
  },

  // ---------- Piripinna: Sentenza dell'Aia ----------
  // Apre il fascicolo e legge i capi d'accusa (un colpo per accusa), martelletto: COLPEVOLE!
  // Scendono le sbarre della cella e lei chiude con una schiacciata.
  piripinna(f, opp, fight, c) {
    const t = c.t;
    if (t < 18) {
      f.view = { anim: 'typing', idx: 0 };
      c.fx.push({ type: 'dossier', x: f.x + f.face * 14, y: f.y - 38 + f.ch.oy, face: f.face, open: Math.min(1, t / 10) });
      if (t === 17) {
        if (catchable(opp)) { grab(f, opp); c.caught = true; c.x0 = f.x; sfx.select(); }
        else { fight.say(f, 'ASSOLTO... PER ORA', 30); c.miss = true; }
      }
      return;
    }
    if (c.miss) return whiff(f, opp, c);
    const CHARGES = ['SPAM DI MOSSE!', 'PARATA CONTINUA!', 'TROPPI SALTI!', 'ZERO RISPETTO!'];
    if (t < 100) {
      opp.view = { anim: 'hit', idx: Math.floor(t / 7) % 2 };
      const i = Math.floor((t - 24) / 14), local = (t - 24) % 14;
      f.view = t >= 24 && i < 4 && local < 6 ? { anim: 'point', idx: 0 } : { anim: 'typing', idx: 0 };
      if (t < 80) c.fx.push({ type: 'dossier', x: f.x + f.face * 14, y: f.y - 38 + f.ch.oy, face: f.face, open: 1 });
      if (t >= 24 && i < 4 && local === 0) { fight.say(opp, CHARGES[i], 14, true); hitOpp(f, opp, fight, 5); }
      if (t >= 78) c.fx.push({ type: 'gavel', x: opp.x, y: opp.y - 76 + opp.ch.oy, k: Math.min(1, (t - 78) / 8) });
      if (t === 86) { fight.say(f, 'COLPEVOLE!', 40, true); fight.overlay('flash', 8); fight.shake = 8; sfx.heavy(); }
      if (t >= 86) c.fx.push({ type: 'bars', x: opp.x, k: Math.min(1, (t - 86) / 8) });
      return;
    }
    // salto e schiacciata
    const k = Math.min(1, (t - 100) / 24);
    c.fx.push({ type: 'bars', x: opp.x, k: 1 - Math.max(0, (t - 112) / 8) });
    opp.view = { anim: 'hit', idx: 1 };
    if (t <= 124) {
      f.x = clampX(lerp(c.x0, opp.x - f.face * 20, Math.min(1, k * 2)));
      f.y = GROUND - 4 * k * (1 - k) * 44;
      f.view = { anim: 'uppercut', idx: t < 112 ? 0 : 1 };
      if (t < 112) c.fx.push({ type: 'jball', x: f.x + f.face * 6, y: f.y - 66 + f.ch.oy });
    }
    if (t === 112) { fight.say(f, 'SCHIACCIATA!', 30, true); release(f, opp, fight, 14); }
    if (t > 124) { f.y = GROUND; f.view = { anim: 'land', idx: 0 }; }
    if (t > 136) finishSuper(f, opp);
  },

  // ---------- Il Pavone: Selezione naturale ----------
  // Apre una coda enorme che ipnotizza, poi una doppia elica di DNA avvolge l'avversario. GRANDE DAVI!
  pavone(f, opp, fight, c) {
    const t = c.t;
    const fan = k => c.fx.push({ type: 'fan', x: f.x - f.face * 4, y: f.y - 34, k, big: true });
    if (t < 24) {
      f.view = { anim: 'power', idx: Math.floor(t / 6) % 2 };
      fan(t / 24);
      if (t === 23) {
        if (catchable(opp)) { grab(f, opp); c.caught = true; sfx.select(); }
        else { fight.say(f, 'MMH.', 30); c.miss = true; }
      }
      return;
    }
    if (c.miss) { fan(Math.max(0, 1 - (c.t - 24) / 10)); return whiff(f, opp, c); }
    fan(t < 112 ? 1 : Math.max(0, 1 - (t - 112) / 16));
    if (t < 60) {
      f.view = { anim: 'power', idx: 1 };
      opp.view = { anim: 'hit', idx: 1 };
      c.fx.push({ type: 'spiral', x: opp.x, y: opp.y - 54 + opp.ch.oy, t });
      if (t === 30) fight.say(opp, 'OOOH...', 30);
      return;
    }
    opp.view = { anim: 'hurt', idx: 0 };
    if (t < 112) {
      f.view = { anim: 'point', idx: 0 };
      c.fx.push({ type: 'dna', x: opp.x, y: opp.y + opp.ch.oy, t, k: Math.min(1, (t - 60) / 12) });
      if (t >= 64 && (t - 64) % 10 === 0 && t <= 104) hitOpp(f, opp, fight, 4, { stop: 3 });
      return;
    }
    if (t === 112) fight.say(f, 'GRANDE DAVI!', 40, true);
    f.view = { anim: 'victory', idx: 0 };
    if (t === 118) { release(f, opp, fight, 14); fight.overlay('flash', 8); }
    if (t > 134) finishSuper(f, opp);
  },

  // ---------- Ilary Head: Tutti in lista! ----------
  // Musica e luci, "TUTTI IN PISTA!": piovono flyer e una folla travolge l'avversario.
  // Finale nel privè: la bottiglia con le stelline esplode.
  ilaryHead(f, opp, fight, c) {
    const t = c.t;
    c.fx.push({ type: 'strobe', t });
    if (t < 20) {
      f.view = { anim: 'shout', idx: 0 };
      c.fx.push({ type: 'megaphone', x: f.x + f.face * 12, y: f.y - 46 + f.ch.oy, face: f.face, t });
      if (t === 4) fight.say(f, 'DJ, ALZA!', 24, true);
      if (t === 19) {
        if (catchable(opp)) { grab(f, opp); c.caught = true; sfx.select(); }
        else { fight.say(f, 'NON SEI IN LISTA', 30); c.miss = true; }
      }
      return;
    }
    if (c.miss) return whiff(f, opp, c);
    c.fx.push({ type: 'flyers', t });
    if (t < 84) {
      f.view = { anim: 'dance', idx: Math.floor(t / 8) % 4 };
      opp.view = { anim: 'hit', idx: Math.floor(t / 5) % 2 };
      c.fx.push({ type: 'crowd', x0: f.x - f.face * 40, x1: opp.x + f.face * 60, y: GROUND, t: t - 20, face: f.face });
      if (t >= 30 && (t - 30) % 10 === 0 && t <= 70) { hitOpp(f, opp, fight, 4, { stop: 3 }); if (t === 50) fight.say(opp, 'AIUTO!', 20); }
      return;
    }
    f.view = { anim: 'lift', idx: 0 };
    opp.view = { anim: 'hit', idx: 1 };
    if (t < 100) c.fx.push({ type: 'sparkler', x: f.x + f.face * 2, y: f.y - 70 + f.ch.oy, t });
    if (t === 86) fight.say(f, 'SI VA NEL PRIVÈ!', 30, true);
    if (t === 100) { fight.overlay('boom', 18, opp.x); release(f, opp, fight, 14); }
    if (t > 124) finishSuper(f, opp);
  },

  // ---------- Broddoris: Tre luci bianche ----------
  // Sale in pedana, afferra l'avversario e lo alza come un bilanciere: a ogni alzata un giudice
  // accende la luce bianca (BUONA!). Con tre luci: NUOVO RECORD! e lo lascia cadere.
  broddoris(f, opp, fight, c) {
    if (!c.caught && !c.miss) {
      const r = rush(f, opp, fight, c, { speed: 4.5, max: 36, anim: 'walkF' });
      if (r === 'caught') { fight.say(f, 'IN PEDANA!', 30); c.lights = [false, false, false]; c.px = f.x; }
      if (r === 'miss') c.miss = true;
      return;
    }
    if (c.miss) return whiff(f, opp, c);
    const t = c.t - c.t0;
    c.fx.push({ type: 'platform', x: c.px });
    c.fx.push({ type: 'judges', lights: c.lights });
    // tre alzate da 28 fotogrammi: giù (accosciato) e su (braccia in alto)
    const rep = Math.floor(t / 28), local = t % 28;
    let k = 0; // 0 = a terra, 1 = sopra la testa
    if (rep < 3) {
      k = local < 8 ? 0 : Math.min(1, (local - 8) / 10);
      f.view = local < 8 ? { anim: 'crouch', idx: 0 } : { anim: 'lift', idx: k < 1 ? 1 : 0 };
      if (local === 20) {
        c.lights[rep] = true; fight.say(f, 'BUONA!', 16, true); sfx.select();
        hitOpp(f, opp, fight, 6, { stop: 4 });
      }
    } else {
      k = 1; f.view = { anim: 'lift', idx: 0 };
      if (t === 86) { fight.say(f, 'NUOVO RECORD!', 40, true); fight.overlay('flash', 8); }
    }
    // l'avversario come bilanciere: orizzontale, da terra a sopra la testa
    opp.view = { anim: 'hurt', idx: 0, rot: f.face * Math.PI / 2, depth: 3 };
    opp.x = f.x - f.face * 26;
    opp.y = lerp(GROUND - 8, f.y - 66 + f.ch.oy, k);
    if (t === 100) {
      opp.y = GROUND - 6; opp.x = clampX(f.x + f.face * 4);
      release(f, opp, fight, 16);
      fight.overlay('dust', 18, opp.x); fight.shake = 12;
    }
    if (t >= 100) f.view = { anim: 'victory', idx: 0 };
    if (t > 128) finishSuper(f, opp);
  },
};
