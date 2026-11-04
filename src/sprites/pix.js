// Strumenti comuni per gli sprite in pixel art (48x64, posa di guardia rivolta a destra).
export const SW = 48, SH = 64, OUTLINE = '#1a1410';

// Griglia vuota con le funzioni R (rettangolo) e P (pixel). oy sposta tutto in basso.
export function grid(oy = 0) {
  const g = [];
  for (let y = 0; y < SH; y++) g.push(new Array(SW).fill(null));
  const R0 = (a, b, c, d, col) => {
    for (let y = b; y <= d; y++) for (let x = a; x <= c; x++)
      if (x >= 0 && x < SW && y >= 0 && y < SH) g[y][x] = col;
  };
  const R = (a, b, c, d, col) => R0(a, b + oy, c, d + oy, col);
  const P = (x, y, c) => R(x, y, x, y, c);
  return { g, R0, R, P };
}

// Aggiunge il contorno scuro attorno a tutti i pixel pieni.
export function outline(g) {
  const out = g.map(r => r.slice());
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    if (g[y][x]) continue;
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const yy = y + dy, xx = x + dx;
      return yy >= 0 && yy < SH && xx >= 0 && xx < SW && g[yy][xx];
    });
    if (near) out[y][x] = OUTLINE;
  }
  return out;
}

// Trasforma una griglia in canvas: normale, specchiato e sagoma bianca (per il lampo del colpo).
export function toCanvases(g) {
  const make = (flip, white) => {
    const c = document.createElement('canvas');
    c.width = SW; c.height = SH;
    const ctx = c.getContext('2d');
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      const col = g[y][x];
      if (!col) continue;
      ctx.fillStyle = white ? '#ffffff' : col;
      ctx.fillRect(flip ? SW - 1 - x : x, y, 1, 1);
    }
    return c;
  };
  return { right: make(false, false), left: make(true, false), whiteR: make(false, true), whiteL: make(true, true) };
}
