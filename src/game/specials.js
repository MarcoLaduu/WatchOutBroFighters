// Mosse speciali e super di ogni personaggio, dal move set.
// Chiave = codice storico della mossa (era la combinazione: DF = ↓ →, BF = ← →, DB = ↓ ←, DD = ↓ ↓, + P/K).
// Ora le mosse si fanno con i tasti Speciale 1-4 (vedi slotCodes in fondo) e hanno un cooldown.
// "super" ha il suo tasto e si usa quando la barra super è piena: è una scena, il copione è in supers.js.
// kind dice come si comporta la mossa (vedi fighter.js); tempi in fotogrammi, danni prima della forza.
// anim: animazione usata [preparazione, colpo, recupero] (vedi anim/poses.js).

const hit = (dmg, o = {}) => ({ dmg, level: 'mid', hitstun: 16, blockstun: 10, push: 2.5, sfx: 'hit', ...o });

export const SPECIALS = {
  docLady: {
    DFK: { name: 'Pallone rossoblù', kind: 'proj', anim: 'kick', startup: 10, recovery: 18,
      proj: [{ type: 'ball', vx: 3.2, y: -16, w: 7, h: 7, hit: hit(8) }] },
    BFP: { name: 'Firewall', kind: 'barrier', anim: 'block', startup: 6, recovery: 14, dur: 90 },
    DBP: { name: 'Ctrl+Z', kind: 'rewind', anim: 'power', startup: 8, recovery: 12, back: 120, heal: 8 },
    super: { name: 'Schermata Blu', kind: 'cine' },
  },
  socioSpritzu: {
    DFP: { name: 'Flash', kind: 'proj', anim: 'punch', startup: 9, recovery: 16,
      proj: [{ type: 'flash', vx: 2.6, vy: -2.6, g: 0.16, y: -40, w: 5, h: 5, burst: 30, hit: hit(4, { effect: { blind: 75 } }) }] },
    DDK: { name: 'Bomba piazzata', kind: 'trap', anim: 'cpunch', startup: 10, recovery: 14, fuse: 180, r: 30,
      hit: hit(12, { knockdown: true, sfx: 'heavy' }) },
    BFP: { name: 'Bella soc!', kind: 'melee', anim: 'punch', startup: 8, active: 4, recovery: 16, shout: 'BELLA SOC!',
      box: [6, 32, -52, -30], hit: hit(4, { effect: { stun: 50 } }), whiffMeter: 15 },
    super: { name: 'Ace', kind: 'cine' },
  },
  ste: {
    DFP: { name: 'Differenziata', kind: 'proj', anim: 'punch', startup: 7, recovery: 22,
      proj: [
        { type: 'bagY', vx: 3.6, y: -30, w: 6, h: 6, hit: hit(3, { hitstun: 10 }) },
        { type: 'bagB', vx: 3.6, y: -30, w: 6, h: 6, delay: 7, hit: hit(3, { hitstun: 10 }) },
        { type: 'bagM', vx: 3.6, y: -30, w: 6, h: 6, delay: 14, hit: hit(3, { hitstun: 12 }) },
      ] },
    DDP: { name: 'Pala eolica', kind: 'rising', anim: 'spin', startup: 3, active: 24, recovery: 10, vy: -5.2, invuln: 8, every: 7,
      box: [-16, 18, -62, -8], hit: hit(4, { hitstun: 14 }) },
    BFK: { name: 'Sì fratello!', kind: 'dash', anim: 'dash', startup: 6, active: 16, recovery: 16, speed: 4.5, shout: 'SÌ FRATELLO!',
      box: [0, 22, -50, -10], hit: hit(11, { knockdown: true, sfx: 'heavy' }) },
    DDK: { name: 'Ultimo giro', kind: 'self', anim: 'drink', startup: 10, recovery: 20, cost: 50, shout: 'ULTIMO GIRO!',
      buff: { drunk: 600 } },
    super: { name: 'Sì fratello... NO.', kind: 'cine' },
  },
  sergenteArgus: {
    DBP: { name: 'Te lo ritorno', kind: 'counter', anim: 'block', startup: 3, active: 24, recovery: 14, shout: 'TE LO RITORNO!' },
    BFP: { name: 'Dai Doc!', kind: 'melee', anim: 'shout', startup: 10, active: 6, recovery: 18, shout: 'DAI DOC!', wave: true,
      box: [0, 54, -62, 0], hit: hit(5, { push: 6, hitstun: 18 }), bonusVs: 'ilDoc' },
    DDK: { name: 'Stacco da terra', kind: 'grab', anim: 'grab', startup: 6, active: 3, recovery: 20, range: 30, shout: 'STACCO!',
      hold: 40, hit: hit(14, { knockdown: true, sfx: 'heavy' }) },
    DFK: { name: 'Tiro calmante', kind: 'zone', anim: 'drink', startup: 12, recovery: 16, zone: { type: 'slow', dx: 0, r: 44, dur: 180 },
      heal: 6, meterCost: 20 },
    super: { name: 'Ordine del Sergente', kind: 'cine' },
  },
  ilDoc: {
    DFP: { name: 'Siringa', kind: 'proj', anim: 'punch', startup: 8, recovery: 16,
      proj: [{ type: 'syringe', vx: 4.2, y: -36, w: 8, h: 3, hit: hit(5, { effect: { slow: 180 } }) }] },
    BFP: { name: 'Defibrillatore', kind: 'melee', anim: 'grab', startup: 7, active: 4, recovery: 16, shout: 'LIBERA!',
      box: [6, 30, -50, -24], hit: hit(7, { effect: { stun: 45 } }) },
    DDK: { name: 'Diagnosi', kind: 'channel', anim: 'heal', startup: 4, active: 50, recovery: 8, heal: 14 },
    DFK: { name: 'Uso terapeutico', kind: 'zone', anim: 'shout', startup: 12, recovery: 16, zone: { type: 'invert', dx: 54, r: 34, dur: 180 } },
    super: { name: 'Oggi è Venerdoc!', kind: 'cine', shout: 'OGGI È VENERDOC!' },
  },
  brodiJ: {
    BFP: { name: 'Panca piana', kind: 'grab', anim: 'grab', startup: 6, active: 3, recovery: 22, range: 30, shout: 'PANCA PIANA!',
      hold: 46, hit: hit(15, { knockdown: true, sfx: 'heavy' }) },
    DFK: { name: 'Ancora una!', kind: 'chain', anim: 'kick', step: 14, max: 5, shout: 'ANCORA UNA!',
      box: [6, 40, -34, -12], hit: hit(4, { hitstun: 18 }), final: hit(6, { knockdown: true }) },
    DDP: { name: 'Pausa proteica', kind: 'self', anim: 'drink', startup: 12, recovery: 18, heal: 8, buff: { armor: 180 } },
    DBP: { name: 'Recupero tra le serie', kind: 'self', anim: 'drink', startup: 12, recovery: 18, buff: { reduce: 240, sluggish: 240 } },
    super: { name: 'Scheda di allenamento', kind: 'cine' },
  },
  bro: {
    BFK: { name: 'Placcaggio', kind: 'dash', anim: 'dash', startup: 6, active: 18, recovery: 18, speed: 5, shout: 'PLACCAGGIO!',
      box: [0, 22, -40, 0], hit: hit(12, { knockdown: true, sfx: 'heavy' }) },
    DFK: { name: 'Calcio di punizione', kind: 'proj', anim: 'kick', startup: 9, recovery: 18,
      proj: [{ type: 'rugby', vx: 3, vy: -3.4, g: 0.16, bounces: 2, y: -16, w: 7, h: 5, hit: hit(8) }] },
    DDP: { name: 'Mischia', kind: 'dash', anim: 'dash', startup: 6, active: 30, recovery: 14, speed: 2.2, armor: true, every: 10,
      box: [0, 22, -52, 0], hit: hit(4, { push: 3.5, hitstun: 14 }) },
    super: { name: 'Meta!', kind: 'cine' },
  },
  mc: {
    DFP: { name: 'Cortocircuito', kind: 'proj', anim: 'punch', startup: 8, recovery: 16,
      proj: [{ type: 'bolt', vx: 5, y: -34, w: 9, h: 5, life: 44, hit: hit(5, { effect: { stun: 30 } }) }] },
    BFK: { name: 'Dribbling', kind: 'teleport', anim: 'kick', startup: 10, active: 4, recovery: 14, range: 150, shout: 'TUNNEL!',
      box: [4, 34, -32, -10], hit: hit(8) },
    DDP: { name: 'Schedina', kind: 'random', anim: 'power', startup: 14, recovery: 20,
      win: hit(16, { unblockable: true, sfx: 'heavy', hitstun: 22 }), lose: 8 },
    super: { name: 'Il re del calcetto', kind: 'cine', shout: 'IL RE DEL CALCETTO!' },
  },
  drrrrrrago: {
    DFP: { name: 'Drrrrrrago!', kind: 'hold', anim: 'shout', startup: 8, max: 70, recovery: 12, every: 8,
      hit: hit(3, { hitstun: 12, push: 1.2 }) },
    BFP: { name: 'Gadget omaggio', kind: 'proj', anim: 'punch', startup: 8, recovery: 16,
      proj: [-1.6, -0.6, 0.4].map((vy, i) => ({ type: `gadget${i}`, vx: 3, vy, g: 0.06, y: -36, w: 5, h: 5, hit: hit(4, { hitstun: 10 }) })) },
    DDK: { name: 'In diretta', kind: 'self', anim: 'shout', startup: 10, recovery: 16, shout: 'IN DIRETTA!', buff: { live: 300 } },
    super: { name: 'Drago supremo', kind: 'cine', shout: 'DRRRRRRAGO SUPREMO!' },
  },
  piripinna: {
    // pallone schiacciato dall'alto: scende in diagonale, si para solo in piedi
    DFP: { name: 'Schiacciata', kind: 'proj', anim: 'uppercut', startup: 10, recovery: 18, shout: 'SCHIACCIATA!',
      proj: [{ type: 'volley', vx: 3.4, vy: 1.9, y: -62, w: 7, h: 7, life: 90, hit: hit(8, { level: 'high' }) }] },
    // salto a muro con le braccia alte: rimanda indietro i proiettili e colpisce chi salta
    BFK: { name: 'Muro', kind: 'rising', anim: 'lift', startup: 3, active: 18, recovery: 10, vy: -4.6, invuln: 4, every: 30, reflect: true,
      shout: 'MURO!', box: [-6, 20, -70, -30], hit: hit(7, { knockdown: true }) },
    // bagher basso: lancia l'avversario in aria
    DBP: { name: 'Bagher', kind: 'melee', anim: 'cpunch', startup: 7, active: 4, recovery: 18,
      box: [4, 30, -22, 0], hit: hit(7, { level: 'low', knockdown: true, launch: -4.6 }) },
    // gli dice una verità scomoda: per 4 secondi fa meno danni
    DDK: { name: 'Senza peli sulla lingua', kind: 'melee', anim: 'point', startup: 10, active: 6, recovery: 16, wave: true,
      shout: 'TE LO DICO IN FACCIA!', box: [0, 60, -62, 0], hit: hit(2, { push: 4, hitstun: 14, effect: { weak: 240 } }) },
    super: { name: 'Sentenza dell\'Aia', kind: 'cine', shout: 'SENTENZA!' },
  },
  pavone: {
    // tre piume a ventaglio
    DFP: { name: 'Piume', kind: 'proj', anim: 'punch', startup: 9, recovery: 16,
      proj: [-0.7, 0, 0.7].map(vy => ({ type: 'feather', vx: 3.8, vy, y: -34, w: 7, h: 3, life: 70, hit: hit(3, { hitstun: 12 }) })) },
    // apre la coda: rimanda indietro i proiettili e abbaglia chi è vicino
    DBK: { name: 'Ruota', kind: 'melee', anim: 'power', startup: 5, active: 22, recovery: 14, reflect: true, fan: true,
      box: [-4, 30, -64, 0], hit: hit(2, { push: 3, hitstun: 12, effect: { blind: 100 } }) },
    // provetta: dove si rompe resta una coltura che rallenta
    BFP: { name: 'Coltura batterica', kind: 'zone', anim: 'punch', startup: 10, recovery: 16, zone: { type: 'culture', dx: 70, r: 30, dur: 200 } },
    // si fa i complimenti da solo e si ricarica la barra
    DDP: { name: 'Grande davi!', kind: 'self', anim: 'victory', startup: 10, recovery: 18, shout: 'GRANDE DAVI!', meter: 25 },
    super: { name: 'Selezione naturale', kind: 'cine', shout: 'SELEZIONE NATURALE!' },
  },
  ilaryHead: {
    // nuvola di vapore che appanna la vista
    DFP: { name: 'Nuvola di IQOS', kind: 'zone', anim: 'drink', startup: 10, recovery: 14, zone: { type: 'smoke', dx: 44, r: 30, dur: 170 } },
    // scatto e timbro sul polso: lo stordisce un attimo
    BFK: { name: 'Sei in lista!', kind: 'dash', anim: 'dash', startup: 6, active: 16, recovery: 14, speed: 5, shout: 'SEI IN LISTA!',
      box: [0, 22, -46, -12], hit: hit(6, { effect: { stun: 40 } }) },
    // presa da educatrice: dietro la lavagna e qualche bacchettata
    DBP: { name: 'In castigo!', kind: 'grab', anim: 'grab', startup: 6, active: 3, recovery: 20, range: 30, shout: 'IN CASTIGO!',
      hold: 44, hit: hit(10, { effect: { stun: 50 } }) },
    // si ricarica ballando: ancora più veloce per qualche secondo
    DDK: { name: 'Dopo-serata', kind: 'self', anim: 'dance', startup: 12, recovery: 16, shout: 'DOPO-SERATA!', buff: { fast: 300 } },
    super: { name: 'Tutti in lista!', kind: 'cine', shout: 'TUTTI IN PISTA!' },
  },
  broddoris: {
    // un disco da 20 kg che rotola rasoterra: si para da accovacciati
    DFP: { name: 'Disco da 20', kind: 'proj', anim: 'sweep', startup: 12, recovery: 20,
      proj: [{ type: 'plate', vx: 3.2, y: -7, w: 9, h: 9, life: 110, hit: hit(9, { level: 'low', push: 2 }) }] },
    // avanza col bilanciere sulle spalle e non si ferma nemmeno se lo colpiscono
    BFP: { name: 'Walkout', kind: 'dash', anim: 'carry', startup: 8, active: 34, recovery: 16, speed: 2.4, armor: true, every: 12, barbell: true,
      shout: 'WALKOUT!', box: [0, 28, -60, -14], hit: hit(5, { push: 3 }) },
    // batte le mani piene di gesso: nuvola bianca che acceca chi è vicino
    DBK: { name: 'Magnesite', kind: 'melee', anim: 'power', startup: 8, active: 10, recovery: 16, chalk: true,
      box: [-6, 34, -60, 0], hit: hit(3, { push: 2, hitstun: 12, effect: { blind: 90 } }) },
    // si stringe la cintura da gara: meno danni e niente arretrare per 4 secondi
    DDP: { name: 'Cintura stretta', kind: 'self', anim: 'power', startup: 12, recovery: 16, shout: 'CINTURA STRETTA!', buff: { reduce: 240, armor: 200 } },
    super: { name: 'Tre luci bianche', kind: 'cine', shout: 'IN PEDANA!' },
  },
};

export const METER_MAX = 100;

// ---------- tasti e cooldown ----------
// Le mosse speciali si fanno con i tasti Speciale 1-4: per tutti la 1 è quella che si ricarica prima,
// la 4 quella che ci mette di più (di solito il potenziamento). A parità, l'ordine scritto qui sopra.

// Dopo l'uso una mossa speciale resta ferma per un po' (fotogrammi, 60 = 1 secondo), contro lo spam.
// Il tempo dipende dal tipo di mossa; una mossa può avere un suo "cd" che vale al posto di questo.
const COOLDOWN = {
  proj: 120, melee: 180, dash: 180, rising: 180, teleport: 180, counter: 180, chain: 210,
  grab: 240, hold: 300, channel: 300, zone: 360, trap: 360, barrier: 360, random: 420, rewind: 600, self: 720,
};
export const cooldownOf = d => d.cd ?? (d.wave ? 480 : COOLDOWN[d.kind] ?? 240);
const slotCache = {};
export const slotCodes = id => slotCache[id] || (slotCache[id] = Object.keys(SPECIALS[id] || {})
  .filter(c => c !== 'super').map((c, i) => [c, i])
  .sort((a, b) => cooldownOf(SPECIALS[id][a[0]]) - cooldownOf(SPECIALS[id][b[0]]) || a[1] - b[1]).map(x => x[0]));
