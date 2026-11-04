// Crea tutti i fotogrammi di ogni personaggio, nello stesso formato (128x80, piedi in ROOT_X/ROOT_Y).
// - I personaggi con un "rig" (per ora Bro) hanno le animazioni vere, pose per pose.
// - Gli altri usano ancora la posa di guardia approvata, con il braccio o la gamba che colpisce
//   aggiunti sopra: si sostituiscono man mano che si animano.
import { ROSTER } from '../data/roster.js';
import { ART } from '../sprites/index.js';
import { OUTLINE } from '../sprites/pix.js';
import { buildRig, renderPose, FW, FH } from './rig.js';
import { RIGS } from './rigs.js';
import { ANIMS } from './poses.js';

export { FW, FH };
export const ANIM_NAMES = Object.keys(ANIMS);

const OX = 40, OY = 17;

function canvas() {
  const c = document.createElement('canvas');
  c.width = FW; c.height = FH;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

// Un fotogramma "vecchio stile": sprite di guardia (o una sua variante) più eventuali arti aggiunti.
function legacyFrame(ch, { art = 'base', dx = 0, dy = 0, sy = 1, punch = 0, kick = 0, kickY = 44, shield = false } = {}) {
  const { c, ctx } = canvas();
  const img = ART[ch.id][art].right;
  const h = Math.round(64 * sy), top = OY + 64 - h + dy, left = OX + dx;
  ctx.drawImage(img, left, top, 48, h);
  const rect = (px0, py0, px1, py1, col) => {
    const y0 = Math.floor(top + py0 * sy), y1 = Math.ceil(top + (py1 + 1) * sy);
    ctx.fillStyle = OUTLINE; ctx.fillRect(left + px0 - 1, y0 - 1, px1 - px0 + 3, y1 - y0 + 2);
    ctx.fillStyle = col; ctx.fillRect(left + px0, y0, px1 - px0 + 1, y1 - y0);
  };
  const oy = ch.oy;
  if (punch) {
    const end = 32 + Math.round(punch * 18);
    rect(29, 23 + oy, end, 26 + oy, ch.arm);
    rect(end, 21 + oy, end + 5, 27 + oy, ch.fist);
  }
  if (kick) {
    const end = 30 + Math.round(kick * 16);
    rect(24, kickY, end, kickY + 5, ch.leg);
    rect(end, kickY - 1, end + 5, kickY + 6, ch.shoe);
  }
  if (shield) {
    ctx.fillStyle = 'rgba(120,190,255,0.45)';
    ctx.fillRect(left + 40, top + Math.round(12 * sy), 3, Math.round(40 * sy));
  }
  return c;
}

function legacyAnims(ch) {
  const F = o => legacyFrame(ch, o);
  const crouch = { sy: 0.8 };
  return {
    idle: [F(), F(), F({ dy: 1 }), F({ dy: 1 })],
    walkF: [F(), F({ dy: -1 }), F(), F({ dy: -1 }), F(), F({ dy: -1 })],
    walkB: [F(), F({ dy: -1 }), F(), F({ dy: -1 }), F(), F({ dy: -1 })],
    crouch: [F(crouch)],
    jump: [F(), F(), F()],
    land: [F({ sy: 0.92 })],
    punch: [F({ art: 'punch', punch: 0.4 }), F({ art: 'punch', punch: 1 }), F({ art: 'punch', punch: 0.5 })],
    cpunch: [F({ art: 'punch', punch: 0.4, ...crouch }), F({ art: 'punch', punch: 1, ...crouch }), F({ art: 'punch', punch: 0.5, ...crouch })],
    kick: [F({ art: 'kick', kick: 0.4 }), F({ art: 'kick', kick: 1 }), F({ art: 'kick', kick: 0.5 })],
    sweep: [F({ art: 'kick', kick: 0.4, kickY: 52, ...crouch }), F({ art: 'kick', kick: 1, kickY: 52, ...crouch }), F({ art: 'kick', kick: 0.5, kickY: 52, ...crouch })],
    airkick: [F({ art: 'kick', kick: 0.6, kickY: 46 }), F({ art: 'kick', kick: 1, kickY: 46 })],
    block: [F({ shield: true })],
    cblock: [F({ shield: true, ...crouch })],
    hit: [F({ dx: -2 }), F({ dx: -1 })],
    hurt: [F()],
    getup: [F(crouch)],
    victory: [F(), F({ dy: 1 })],
  };
}

// Restituisce { idPersonaggio: { nomeAnimazione: [canvas, ...] } }
export function buildFrames() {
  const out = {};
  for (const ch of ROSTER) {
    if (RIGS[ch.id]) {
      const rig = buildRig(RIGS[ch.id]);
      out[ch.id] = Object.fromEntries(Object.entries(ANIMS).map(([k, poses]) => [k, poses.map(p => renderPose(rig, p))]));
    } else out[ch.id] = legacyAnims(ch);
  }
  return out;
}
