// Scritte e riquadri disegnati sul canvas.
import { FONT, S, W } from './config.js';

// Press Start 2P è disegnato su una griglia di 8 pixel: la dimensione reale viene arrotondata
// a multipli di 8 pixel dello schermo, così le lettere restano nitide. Se la scritta non entra
// nella larghezza massima, si rimpicciolisce di un gradino alla volta.
const SCALE = 0.7;
function fontPx(size) { return Math.max(8, Math.round((size * S * SCALE) / 8) * 8); }

// Simboli che il carattere non ha (o che prenderebbe da un altro font, con misure diverse):
// li disegniamo noi in pixel, sulla stessa griglia 8x8 delle lettere.
const ICON_ROWS = {
  '→': ['....##..', '....###.', '########', '########', '....###.', '....##..'],
  '▶': ['.##.....', '.####...', '.######.', '.######.', '.####...', '.##.....'],
  '□': ['#######', '#######', '##...##', '##...##', '##...##', '#######', '#######'],
  '✕': ['##....##', '.##..##.', '..####..', '..####..', '.##..##.', '##....##'],
  '✔': ['......##', '.....##.', '##..##..', '.####...', '..##....', '........'],
};
const flipH = rows => rows.map(r => [...r].reverse().join(''));
const rot = rows => { // ruota di 90° in senso orario una griglia 8x6 portandola a 6x8
  const h = rows.length, w = rows[0].length, out = [];
  for (let x = 0; x < w; x++) { let r = ''; for (let y = h - 1; y >= 0; y--) r += rows[y][x]; out.push(r); }
  return out;
};
ICON_ROWS['←'] = flipH(ICON_ROWS['→']);
ICON_ROWS['◀'] = flipH(ICON_ROWS['▶']);
ICON_ROWS['↓'] = rot(ICON_ROWS['→']);
ICON_ROWS['↑'] = [...rot(ICON_ROWS['→'])].reverse();
const ICONS = new Set(Object.keys(ICON_ROWS));

function drawIcon(ctx, ch, x, y, em, color) {
  const rows = ICON_ROWS[ch], p = em / 8, h = rows.length;
  const top = y - p * (h + (8 - h) / 2) + p; // centrato sull'altezza delle maiuscole
  ctx.fillStyle = color;
  const left = x + ((8 - rows[0].length) / 2) * p;
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') ctx.fillRect(left + i * p, top + j * p, p, p); });
}

// Divide la scritta in pezzi di testo normale e simboli disegnati a mano.
function pieces(str) {
  const out = []; let buf = '';
  for (const c of str) { if (ICONS.has(c)) { if (buf) out.push(buf); out.push(c); buf = ''; } else buf += c; }
  if (buf) out.push(buf);
  return out;
}

export function text(ctx, str, x, y, { size = 8, color = '#fff', align = 'left', shadow = '#1a1020', maxW = W - 8, baseline = 'alphabetic' } = {}) {
  str = String(str);
  let real = fontPx(size);
  const parts = pieces(str);
  const plain = parts.length === 1 && !ICONS.has(parts[0]);
  ctx.textBaseline = baseline;
  let em = 0, width = 0;
  for (;;) {
    em = real / S;
    ctx.font = `${em}px ${FONT}`;
    width = parts.reduce((w, p) => w + (ICONS.has(p) ? em : ctx.measureText(p).width), 0);
    if (real <= 8 || width <= maxW) break;
    real -= 8;
  }
  if (plain) {
    ctx.textAlign = align;
    if (shadow) { ctx.fillStyle = shadow; ctx.fillText(str, x + 1, y + 1); }
    ctx.fillStyle = color; ctx.fillText(str, x, y);
    return;
  }
  ctx.textAlign = 'left';
  const x0 = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
  const pass = (dx, dy, col) => {
    let cx = x0 + dx;
    for (const p of parts) {
      if (ICONS.has(p)) { drawIcon(ctx, p, cx, y + dy, em, col); cx += em; }
      else { ctx.fillStyle = col; ctx.fillText(p, cx, y + dy); cx += ctx.measureText(p).width; }
    }
  };
  if (shadow) pass(1, 1, shadow);
  pass(0, 0, color);
}

export function box(ctx, x, y, w, h, fill = 'rgba(20,12,30,0.85)', border = '#f2c230') {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  if (border) { ctx.fillStyle = border; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h); }
}

export const P1C = '#ff5a4a', P2C = '#4aa8ff', CPUC = '#b8b8c8';
