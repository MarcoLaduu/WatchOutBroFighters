// Sistema di animazione "a pezzi": il personaggio approvato viene scomposto in testa e busto
// (presi pari pari dallo sprite) e in braccia e gambe, ridisegnate a ogni posa come segmenti
// spessi in pixel. Le pose dicono dove stanno pugni e piedi; gomiti e ginocchia si calcolano da soli.
// Il risultato è un canvas per fotogramma, usabile da qualsiasi motore (Phaser incluso).
import { OUTLINE } from '../sprites/pix.js';

export const FW = 128, FH = 80;           // misura di un fotogramma
const OX = 40, OY = 17;                    // spostamento dalle coordinate dello sprite 48x64 al fotogramma
export const ROOT_X = 24 + OX, ROOT_Y = 61 + OY; // punto tra i piedi, a terra

// Copia di una zona della griglia dello sprite: { x, y, w, h, px[][] }
function cut(g, x0, y0, x1, y1, keep = () => true) {
  const px = [];
  for (let y = y0; y <= y1; y++) {
    const row = [];
    for (let x = x0; x <= x1; x++) row.push(g[y] && g[y][x] && keep(x, y) ? g[y][x] : null);
    px.push(row);
  }
  return { x: x0, y: y0, px };
}

const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * k))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
};

// Prepara i pezzi di un personaggio a partire dalla sua definizione (vedi rigs.js).
export function buildRig(def) {
  const full = def.draw();
  const body = def.draw({ noArms: true, noLegs: true });
  const split = def.neckY;
  return {
    def,
    head: cut(body, 0, 0, 47, split, (x, y) => y <= split),
    torso: cut(body, 0, split + 1, 47, def.torsoBottom ?? 50),
    fist: cut(full, ...def.fistBox),
    boot: cut(full, ...def.bootBox),
  };
}

// Calcolo a due ossa (spalla-gomito-pugno, anca-ginocchio-caviglia). Se il bersaglio è troppo
// lontano, l'arto si allunga un po' (stile cartone), fino a un massimo.
function ik(base, target, a, b, hint) {
  let dx = target[0] - base[0], dy = target[1] - base[1];
  let d = Math.hypot(dx, dy) || 0.001;
  let k = 1;
  if (d > a + b) { k = Math.min(1.4, d / (a + b)); a *= k; b *= k; if (d > a + b) { dx *= (a + b) / d; dy *= (a + b) / d; d = a + b; } }
  d = Math.max(Math.abs(a - b) + 0.01, d);
  const th = Math.atan2(dy, dx);
  const al = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  const pick = s => [base[0] + Math.cos(th + s * al) * a, base[1] + Math.sin(th + s * al) * a];
  const e1 = pick(1), e2 = pick(-1);
  const score = e => (e[0] - base[0]) * hint[0] + (e[1] - base[1]) * hint[1];
  const elbow = score(e1) >= score(e2) ? e1 : e2;
  return { elbow, end: [base[0] + dx, base[1] + dy] };
}

// Disegna un arto (più segmenti spessi) come un'unica forma: prima il bordo scuro di tutti
// i segmenti, poi il colore, così non restano linee scure sulle articolazioni.
function limb(put, segs, dark) {
  const walk = (p0, p1, fn) => {
    const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), steps = Math.max(2, Math.ceil(len * 2));
    for (let i = 0; i <= steps; i++) { const t = i / steps; fn(p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, t); }
  };
  const stamp = (cx, cy, size, col) => {
    const h = size / 2;
    for (let y = Math.round(cy - h); y < Math.round(cy + h); y++)
      for (let x = Math.round(cx - h); x < Math.round(cx + h); x++) put(x, y, col);
  };
  for (const [p0, p1, w] of segs) walk(p0, p1, (x, y) => stamp(x, y, w + 2, OUTLINE));
  for (const [p0, p1, w, bands] of segs) walk(p0, p1, (x, y, t) => {
    const band = bands.find(([a, b]) => t >= a && t <= b) || bands[bands.length - 1];
    stamp(x, y, w, dark < 1 ? shade(band[2], dark) : band[2]);
  });
}

function blit(put, part, dx, dy, dark, outlineFirst) {
  part.px.forEach((row, j) => row.forEach((c, i) => {
    if (!c) return;
    const x = part.x + i + dx, y = part.y + j + dy;
    if (outlineFirst) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(x + ox, y + oy, OUTLINE);
  }));
  part.px.forEach((row, j) => row.forEach((c, i) => { if (c) put(part.x + i + dx, part.y + j + dy, dark < 1 ? shade(c, dark) : c); }));
}

// Disegna una posa e restituisce un canvas FW x FH.
// Pose (coordinate dello sprite rivolto a destra, y verso il basso):
//   b:  spostamento di busto e testa       h:  spostamento extra della testa
//   fB, fF: pugno dietro/avanti rispetto alla spalla corrispondente
//   aB, aF: caviglia dietro/avanti rispetto alla posizione in piedi (0,0 = piedi a terra)
//   eB, eF, kB, kF: da che parte piegare gomiti e ginocchia (vettori indicativi)
export function renderPose(rig, pose) {
  const d = rig.def, L = d.limbs;
  const grid = [];
  for (let y = 0; y < FH; y++) grid.push(new Array(FW).fill(null));
  const put = (x, y, c, onlyEmpty) => {
    const X = x + OX, Y = y + OY;
    if (X < 0 || Y < 0 || X >= FW || Y >= FH) return;
    if (onlyEmpty && grid[Y][X]) return;
    grid[Y][X] = c;
  };
  const b = pose.b || [0, 0], h = pose.h || [0, 0];
  const add = (p, o) => [p[0] + o[0], p[1] + o[1]];
  const sB = add(d.shoulderB, b), sF = add(d.shoulderF, b);
  const hB = add(d.hipB, b), hF = add(d.hipF, b);
  const ankle = (hip, a, home) => [home[0] + a[0], home[1] + a[1]];

  const drawLeg = (hip, home, a, kneeHint, dark) => {
    const r = ik(hip, ankle(hip, a || [0, 0], home), L.thigh, L.shin, kneeHint || [1, -0.3]);
    limb(put, [[hip, r.elbow, L.wThigh, L.thighBands], [r.elbow, r.end, L.wShin, L.shinBands]], dark);
    blit(put, rig.boot, Math.round(r.end[0] - d.ankleInBoot[0]), Math.round(r.end[1] - d.ankleInBoot[1]), dark, true);
  };
  const drawArm = (sh, f, elbowHint, dark, side) => {
    const r = ik(sh, add(add(sh, f), d.fistAdj || [0, 0]), L.upper, L.fore, elbowHint);
    const ub = L['upperBands' + side] || L.upperBands, fb = L['foreBands' + side] || L.foreBands;
    limb(put, [[sh, r.elbow, L.wUpper, ub], [r.elbow, r.end, L.wFore, fb]], dark);
    const fw = rig.fist.px[0].length, fh = rig.fist.px.length;
    blit(put, rig.fist, Math.round(r.end[0] - fw / 2 - rig.fist.x), Math.round(r.end[1] - fh / 2 - rig.fist.y), dark, true);
  };

  // Ordine: gambe, busto, testa, poi tutte e due le braccia davanti al corpo (come nello sprite di guardia).
  drawLeg(hB, d.ankleB, pose.aB, pose.kB, 0.85);
  drawLeg(hF, d.ankleF, pose.aF, pose.kF, 1);
  blit(put, rig.torso, Math.round(b[0]), Math.round(b[1]), 1, false);
  blit(put, rig.head, Math.round(b[0] + h[0]), Math.round(b[1] + h[1]), 1, false);
  drawArm(sB, pose.fB || [4, -3], pose.eB || [0, 1], 0.9, 'B');
  drawArm(sF, pose.fF || [-4, -3], pose.eF || [0, 1], 1, 'F');

  // contorno esterno
  const out = grid.map(r => r.slice());
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    if (grid[y][x]) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy] && grid[y + dy][x + dx])) out[y][x] = OUTLINE;
  }
  const c = document.createElement('canvas');
  c.width = FW; c.height = FH;
  const ctx = c.getContext('2d');
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (out[y][x]) { ctx.fillStyle = out[y][x]; ctx.fillRect(x, y, 1, 1); }
  return c;
}
