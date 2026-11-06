// Ilary Head: top nero scollato, jeans, sneakers e braccialetto dorato della lista (sprite approvato). Bassa: parte 6 pixel più in basso.
import { grid, OUTLINE as OL } from './pix.js';

export function drawIlaryHead(v = {}) {
  const { g, R0, R, P } = grid(6);
  const S = '#f2cdb4', SS = '#d8a88c', HR = '#6e4127', HL = '#94603c', HD = '#4e2c1a', EB = '#5a3420', EY = '#4a2c1a', GL = '#2a1c18', WH = '#f6f4f0';
  const L = { top: '#1e1a24', topS: '#110e16', bottom: '#7d9ccb', bottomS: '#5d7aa6', shoe: '#f0f0f0', sole: '#a0a0a0' };
  // gambe (più corte: è bassa)
  R0(15, 46, 32, 48, L.bottom); R0(15, 46, 22, 57, L.bottom); R0(25, 46, 32, 57, L.bottom); R0(22, 49, 22, 57, L.bottomS); R0(32, 49, 32, 57, L.bottomS);
  R0(13, 58, 22, 60, L.shoe); R0(25, 58, 34, 60, L.shoe); R0(13, 61, 22, 61, L.sole); R0(25, 61, 34, 61, L.sole);
  // busto: seno pieno, vita stretta
  R(15, 22, 32, 24, L.top); R(15, 25, 32, 30, L.top); R(17, 31, 30, 37, L.top);
  R(30, 25, 32, 30, L.topS); R(29, 31, 30, 37, L.topS); R(18, 36, 29, 37, L.topS);
  R(16, 31, 22, 31, L.topS); R(25, 31, 31, 31, L.topS); P(23, 27, L.topS); P(24, 27, L.topS); // linea del seno
  { R(20, 22, 27, 23, S); P(21, 24, S); P(26, 24, S); R(22, 24, 25, 25, S); } // scollo a V
  R(17, 38, 30, 39, L.bottom);
  function arm(m) {
    const X = x => m ? 47 - x : x;
    const A = (a, b, c, d, col) => { const x0 = Math.min(X(a), X(c)), x1 = Math.max(X(a), X(c)); R(x0, b, x1, d, col); };
    A(11, 24, 13, 31, S); A(11, 29, 16, 31, S); A(14, 24, 16, 30, S); A(11, 24, 11, 31, SS);
    A(17, 24, 17, 31, OL);
    A(13, 19, 17, 23, S); A(13, 19, 13, 23, SS); A(14, 21, 16, 21, SS);
    if (m) { A(14, 24, 16, 25, '#f2c230'); A(14, 24, 14, 24, '#fff2b0'); A(16, 25, 16, 25, '#b8901e'); } // braccialetto della lista, sul polso davanti
  }
  // capelli lunghi lisci dietro le spalle (disegnati prima delle braccia)
  R(15, 6, 17, 30, HR); R(30, 6, 32, 30, HR); P(16, 31, HR); P(31, 31, HR);
  P(16, 12, HL); P(16, 20, HL); P(31, 15, HL); P(31, 24, HL); R(15, 26, 15, 30, HD); R(32, 26, 32, 30, HD);
  if (!v.noArms) { arm(0); if (!v.noFrontArm) arm(1); }
  // testa
  R(19, 6, 28, 17, S); R(18, 8, 29, 15, S); R(20, 18, 27, 18, S); R(21, 19, 26, 19, S); R(22, 20, 25, 20, S);
  R(22, 21, 25, 21, SS);
  // capelli castano chiaro con la riga in mezzo
  R(18, 2, 29, 6, HR); R(19, 1, 28, 1, HR); R(17, 3, 17, 14, HR); R(30, 3, 30, 14, HR);
  R(18, 7, 19, 9, HR); R(28, 7, 29, 9, HR); P(18, 10, HR); P(29, 10, HR);
  R(23, 2, 24, 5, '#e8c0a4');                                    // riga
  P(20, 2, HL); P(21, 4, HL); P(26, 2, HL); P(27, 4, HL); P(19, 5, HL); P(28, 6, HL);
  // sopracciglia sottili
  R(20, 8, 22, 8, EB); R(25, 8, 27, 8, EB);
  // occhiali tondi scuri
  R(19, 9, 21, 9, GL); R(26, 9, 28, 9, GL); P(18, 10, GL); P(18, 11, GL); P(22, 10, GL); P(22, 11, GL); P(25, 10, GL); P(25, 11, GL); P(29, 10, GL); P(29, 11, GL);
  R(19, 12, 21, 12, GL); R(26, 12, 28, 12, GL); R(23, 10, 24, 10, GL); P(17, 10, GL); P(30, 10, GL);
  P(20, 11, '#ffffff'); P(21, 11, EY); P(26, 11, EY); P(27, 11, '#ffffff'); P(19, 10, '#fbe6d8'); P(26, 10, '#fbe6d8');
  // naso, guance rosate e sorriso grande
  P(24, 13, SS); P(23, 14, SS);
  R(19, 13, 20, 14, '#eba0a0'); R(27, 13, 28, 14, '#eba0a0');
  R(21, 15, 26, 15, '#d06a76'); R(21, 16, 26, 16, WH); R(22, 17, 25, 17, '#d06a76'); P(20, 15, '#b85a66'); P(27, 15, '#b85a66');
  return g;
}
