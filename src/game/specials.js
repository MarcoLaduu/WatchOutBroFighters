// Mosse speciali e super di ogni personaggio, dal move set.
// Chiave = combinazione relativa al verso del lottatore + tasto:
//   DF = ↓ →   BF = ← →   DB = ↓ ←   DD = ↓ ↓      P = pugno, K = calcio
// "super" si fa con Pugno + Calcio insieme quando la barra super è piena: è una scena, il copione è in supers.js.
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
};

export const METER_MAX = 100;
