// Mosse base comuni a tutti. Le hitbox sono relative ai piedi del personaggio rivolto a destra:
// x0..x1 in avanti dal centro, y0..y1 verso l'alto (valori negativi). Tempi in fotogrammi (60 al secondo).
// level: 'mid' si para in piedi o accovacciati, 'low' solo accovacciati, 'high' (dall'alto) solo in piedi.
export const MOVES = {
  punch:   { art: 'punch', startup: 4, active: 3, recovery: 8,  dmg: 6, x0: 8, x1: 38, y0: -50, y1: -32, level: 'mid',  hitstun: 14, blockstun: 9,  push: 2.2, sfx: 'hit' },
  cpunch:  { art: 'punch', startup: 4, active: 3, recovery: 9,  dmg: 5, x0: 8, x1: 36, y0: -36, y1: -22, level: 'mid',  hitstun: 13, blockstun: 8,  push: 2.0, sfx: 'hit', crouch: true },
  kick:    { art: 'kick',  startup: 7, active: 4, recovery: 13, dmg: 9, x0: 6, x1: 44, y0: -30, y1: -14, level: 'mid',  hitstun: 17, blockstun: 11, push: 3.2, sfx: 'heavy' },
  sweep:   { art: 'kick',  startup: 8, active: 4, recovery: 16, dmg: 7, x0: 6, x1: 42, y0: -10, y1: 0,   level: 'low',  hitstun: 20, blockstun: 11, push: 2.0, sfx: 'heavy', crouch: true, knockdown: true },
  airkick: { art: 'kick',  startup: 4, active: 12, recovery: 0, dmg: 8, x0: 4, x1: 36, y0: -30, y1: -6,  level: 'high', hitstun: 16, blockstun: 10, push: 2.4, sfx: 'heavy', air: true },
};
