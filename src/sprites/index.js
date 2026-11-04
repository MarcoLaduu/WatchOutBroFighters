// Prepara tutte le immagini di ogni personaggio una volta sola, all'avvio.
// Oltre alla posa di guardia crea due varianti: senza il braccio avanti (per il pugno, ridisegnando
// lo sprite senza quel braccio) e senza la gamba avanti (per il calcio), così l'arto che colpisce si disegna a parte.
import { ROSTER } from '../data/roster.js';
import { outline, toCanvases, SW, SH } from './pix.js';

const clone = g => g.map(r => r.slice());

function withoutFrontLeg(g) {
  const out = clone(g);
  for (let y = 46; y < SH; y++) for (let x = 24; x <= 37; x++) out[y][x] = null;
  return out;
}

export const ART = {};

export function buildArt() {
  for (const ch of ROSTER) {
    const g = ch.draw();
    ART[ch.id] = {
      base: toCanvases(outline(g)),
      punch: toCanvases(outline(ch.draw({ noFrontArm: true }))),
      kick: toCanvases(outline(withoutFrontLeg(g))),
      portrait: portrait(outline(g), ch),
    };
  }
}

// Ritratto 28x28 centrato sulla testa, per la schermata di selezione e le barre della vita.
function portrait(g, ch) {
  const c = document.createElement('canvas');
  c.width = 28; c.height = 28;
  const ctx = c.getContext('2d');
  const top = Math.max(0, ch.oy - 4);
  for (let y = 0; y < 28; y++) for (let x = 0; x < 28; x++) {
    const col = g[top + y] && g[top + y][10 + x];
    if (!col) continue;
    ctx.fillStyle = col;
    ctx.fillRect(x, y, 1, 1);
  }
  return c;
}

export { SW, SH };
