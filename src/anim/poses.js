// Le animazioni base, uguali per tutti i personaggi: una lista di pose per ogni animazione.
// Coordinate dello sprite rivolto a destra (x avanti, y in basso). Vedi rig.js per il significato dei campi.

const guard = { fB: [4, -3], fF: [-4, -3], aB: [0, 0], aF: [0, 0] };
const up = (p, o) => ({ ...guard, ...p, ...o });
// accovacciati i piedi restano sotto il corpo e le ginocchia vanno avanti e in alto
const crouchBase = { b: [0, 8], aB: [-1, 0], aF: [2, 0], kB: [1, -0.7], kF: [1, -0.7] };
const blockArms = { fB: [14, -8], fF: [-3, -9], eB: [0, 1], eF: [0, 1] };

function walk(dir) {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const ph = (i / 6) * Math.PI * 2 * dir;
    out.push(up({
      b: [0, -Math.round(Math.abs(Math.sin(ph)))],
      aF: [Math.round(4 * Math.sin(ph)), -Math.round(Math.max(0, Math.cos(ph)) * 2)],
      aB: [-Math.round(4 * Math.sin(ph)), -Math.round(Math.max(0, -Math.cos(ph)) * 2)],
      fF: [-4 + Math.round(Math.sin(ph)), -3], fB: [4 - Math.round(Math.sin(ph)), -3],
    }));
  }
  return out;
}

export const ANIMS = {
  idle: [up({}), up({ fF: [-4, -4] }), up({ b: [0, 1] }), up({ b: [0, 1], fB: [4, -2] })],
  walkF: walk(1),
  walkB: walk(-1),
  crouch: [up(crouchBase)],
  jump: [up({ aB: [0, -6], aF: [3, -8], kB: [1, -0.7], kF: [1, -0.7], fB: [4, -6], fF: [-4, -6] }), up({ aB: [0, -8], aF: [2, -9], kB: [1, -0.7], kF: [1, -0.7], fB: [4, -6], fF: [-4, -6] }), up({ aB: [-1, -3], aF: [2, -2], kB: [1, -0.5], kF: [1, -0.5] })],
  land: [up({ b: [0, 3], aB: [-1, 0], aF: [2, 0], kB: [1, -0.7], kF: [1, -0.7] })],
  punch: [
    up({ b: [1, 0], fF: [-6, -2] }),
    up({ b: [3, 0], h: [1, 0], fF: [15, -1], eF: [0, 1], aB: [-3, 0], aF: [3, 0] }),
    up({ b: [2, 0], h: [1, 0], fF: [8, -2], aB: [-3, 0], aF: [3, 0] }),
  ],
  cpunch: [
    up(crouchBase, { b: [1, 8], fF: [-6, -1] }),
    up(crouchBase, { b: [3, 8], h: [1, 0], fF: [15, 1], eF: [0, 1] }),
    up(crouchBase, { b: [2, 8], fF: [7, 0] }),
  ],
  kick: [
    up({ b: [-1, -1], aF: [6, -10], kF: [1, -1] }),
    up({ b: [-3, -1], h: [-1, 0], aF: [20, -14], aB: [-3, 0], kF: [0, -1], fF: [-5, -5] }),
    up({ b: [-2, 0], aF: [10, -7], kF: [1, -1] }),
  ],
  sweep: [
    up(crouchBase, { b: [0, 9], aF: [9, 0] }),
    up(crouchBase, { b: [-2, 9], aF: [21, 1], aB: [-1, 0], kF: [0, -1] }),
    up(crouchBase, { b: [-1, 9], aF: [12, 0] }),
  ],
  airkick: [up({ b: [-1, 0], aF: [7, -9], aB: [0, -8], kB: [1, -0.7], kF: [1, -1] }), up({ b: [-2, 0], aF: [17, -4], aB: [0, -9], kB: [1, -0.7], kF: [0, -1] })],
  block: [up({ b: [-1, 0], h: [-1, 0], ...blockArms })],
  cblock: [up(crouchBase, { b: [-1, 8], h: [-1, 0], ...blockArms })],
  hit: [up({ b: [-2, 0], h: [-2, 1], fB: [-2, 2], fF: [-8, 2], aF: [1, 0] }), up({ b: [-1, 0], h: [-1, 0], fB: [1, 0], fF: [-6, 0] })],
  hurt: [up({ b: [-2, 0], h: [-2, 0], fB: [-5, 6], fF: [-9, 6], aB: [-1, -2], aF: [4, -4], kB: [1, -0.5] })],
  getup: [up(crouchBase)],
  // pose delle mosse speciali
  dash: [up({ b: [3, 1], h: [2, 1], fF: [12, 0], fB: [10, -2], aB: [-6, 0], aF: [4, 0] }), up({ b: [4, 2], h: [3, 1], fF: [13, 1], fB: [11, -1], aB: [-7, 0], aF: [5, 0] })],
  grab: [up({ b: [2, 0], h: [1, 0], fF: [12, -3], fB: [15, -5], aB: [-3, 0], aF: [3, 0] })],
  drink: [up({ fF: [-11, -9], eF: [1, 0.4], h: [0, -1] }), up({ fF: [-11, -10], eF: [1, 0.4], h: [-1, -2] })],
  shout: [up({ b: [1, 0], h: [2, -1], fB: [-8, -4], eB: [-1, 0.3], fF: [9, -5], eF: [1, 0.3], aB: [-3, 0], aF: [3, 0] })],
  spin: [up({ fB: [-12, 0], eB: [-1, 0], fF: [12, 0], eF: [1, 0], aB: [-1, -4], aF: [2, -4] }), up({ fB: [-11, -6], eB: [-1, 0], fF: [11, 3], eF: [1, 0], aB: [0, -5], aF: [1, -3] })],
  power: [up({ b: [0, 3], h: [0, 1], fB: [-5, 2], fF: [-8, 2], aB: [-2, 0], aF: [2, 0], kB: [1, -0.6], kF: [1, -0.6] }), up({ b: [0, 2], fB: [2, -14], fF: [-2, -14], eB: [-1, 0], eF: [1, 0] })],
  heal: [up(crouchBase, { b: [0, 6], fB: [9, -3], fF: [-7, -2] }), up(crouchBase, { b: [0, 7], fB: [9, -2], fF: [-7, -1] })],
  // pose delle super
  typing: [up({ h: [1, 1], fB: [11, 4], eB: [0, 1], fF: [8, 3], eF: [0, 1] }), up({ h: [1, 1], fB: [11, 3], eB: [0, 1], fF: [8, 4], eF: [0, 1] })],
  aim: [up({ b: [1, 0], h: [1, 0], fB: [16, -5], eB: [0, 1], fF: [14, -6], eF: [0, 1], aB: [-3, 0], aF: [3, 0] })],
  headbutt: [up({ b: [-2, 0], h: [-3, -1], fB: [2, -4], fF: [-6, -4] }), up({ b: [3, 0], h: [6, 1], fB: [8, -1], fF: [-1, 0], aB: [-4, 0], aF: [3, 0] })],
  point: [up({ h: [1, -1], fF: [11, -13], eF: [1, 0], fB: [4, -3] })],
  stomp: [up({ b: [0, -1], aF: [6, -12], kF: [1, -1], fB: [-5, -5], fF: [6, -6] }), up({ b: [1, 1], aF: [9, 0], fB: [-4, -3], fF: [6, -3] })],
  dance: [
    up({ fB: [2, -15], eB: [-1, 0], aB: [-2, 0], aF: [3, 0] }),
    up({ b: [0, 1], fF: [-2, -15], eF: [1, 0], fB: [-6, 6], aB: [-3, 0], aF: [1, 0] }),
    up({ fB: [-10, -3], eB: [-1, 0], fF: [10, -3], eF: [1, 0], aB: [0, -2], aF: [2, 0] }),
    up({ b: [0, 1], fF: [11, -14], eF: [1, 0], fB: [-6, 7], aB: [-2, 0], aF: [2, -2] }),
  ],
  lift: [up({ fB: [3, -17], eB: [-1, 0], fF: [-3, -17], eF: [1, 0] }), up({ b: [0, 6], fB: [3, -17], eB: [-1, 0], fF: [-3, -17], eF: [1, 0], aB: [-4, 0], aF: [4, 0], kB: [1, -0.6], kF: [1, -0.6] })],
  juggle: [up({ aF: [5, -7], kF: [1, -1], fB: [-6, 0], eB: [-1, 0], fF: [7, -1], eF: [1, 0] }), up({ aF: [2, 0], fB: [-6, 0], eB: [-1, 0], fF: [7, -1], eF: [1, 0] })],
  uppercut: [up({ b: [1, 3], fF: [6, 2], fB: [4, -3] }), up({ b: [2, -1], h: [1, -2], fF: [8, -17], eF: [1, 0], fB: [4, -4] })],
  carry: [up({ b: [2, 0], fB: [2, -12], eB: [-1, 0], fF: [-4, -12], eF: [1, 0] }), up({ b: [2, -1], fB: [2, -12], eB: [-1, 0], fF: [-4, -12], eF: [1, 0], aB: [-4, -2], aF: [4, 0] })],
  victory: [up({ fB: [1, -15], fF: [-1, -15], eB: [-1, 0], eF: [1, 0] }), up({ b: [0, -1], fB: [1, -16], fF: [-1, -16], eB: [-1, 0], eF: [1, 0] })],
};
