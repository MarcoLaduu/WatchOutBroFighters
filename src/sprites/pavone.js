// Il Pavone: camice bianco da biologo con le provette nel taschino, occhiali scuri, mascella squadrata (sprite approvato).
import { grid, OUTLINE as OL } from './pix.js';

export function drawPavone(v = {}) {
  const { g, R0, R, P } = grid(0);
  const S = '#ecc6a6', SS = '#c99e7c', HR = '#2b1d16', HL = '#4a3328', EB = '#22160f', EY = '#4a2c1a', GL = '#1e1512';
  const L = { coat: '#f2f2ee', coatS: '#c8c8c2', shirt: '#2f8f8a', pants: '#3b4250', pantsS: '#2a303b', shoe: '#2a2a2a', sole: '#141414' };
  // gambe
  R(14, 41, 33, 45, L.pants); R(14, 43, 21, 57, L.pants); R(26, 43, 33, 57, L.pants); R(21, 46, 21, 57, L.pantsS); R(33, 46, 33, 57, L.pantsS);
  R(12, 58, 21, 60, L.shoe); R(26, 58, 35, 60, L.shoe); R(12, 61, 21, 61, L.sole); R(26, 61, 35, 61, L.sole);
  // busto
  R(13, 22, 34, 40, L.coat); R(12, 29, 35, 39, L.coat); R(32, 24, 34, 40, L.coatS); R(14, 39, 33, 40, L.coatS);
  R(21, 22, 26, 34, L.shirt);                                   // camicia/maglia sotto
  R(20, 22, 20, 36, L.coatS); R(27, 22, 27, 36, L.coatS);        // risvolti
  P(21, 22, L.coatS); P(26, 22, L.coatS);
  { R(28, 30, 31, 31, L.coatS); R(29, 26, 29, 30, '#7fd0c8'); P(29, 25, '#e04a4a'); R(30, 27, 30, 30, '#5aa0e0'); R(15, 30, 17, 31, L.coatS); } // tasca con provette
  R(13, 40, 34, 40, L.coatS);
  function arm(m) {
    const X = x => m ? 47 - x : x;
    const A = (a, b, c, d, col) => { const x0 = Math.min(X(a), X(c)), x1 = Math.max(X(a), X(c)); R(x0, b, x1, d, col); };
    A(9, 23, 12, 31, L.coat); A(9, 29, 16, 32, L.coat); A(13, 22, 16, 31, L.coat); A(9, 23, 9, 32, L.coatS);
    A(13, 23, 16, 24, L.coatS);
    A(17, 22, 17, 32, OL);
    A(12, 17, 17, 22, S); A(12, 17, 12, 22, SS); A(13, 19, 16, 19, SS);
  }
  if (!v.noArms) { arm(0); if (!v.noFrontArm) arm(1); }
  // testa
  R(17, 9, 17, 14, S); R(30, 9, 30, 14, S); P(17, 12, SS); P(30, 12, SS);
  R(19, 5, 28, 18, S); R(18, 7, 29, 19, S); R(19, 20, 28, 20, S); R(20, 21, 27, 21, S); // mascella larga e squadrata
  P(18, 18, SS); P(18, 19, SS); P(29, 18, SS); P(29, 19, SS); P(19, 20, SS); P(28, 20, SS); R(20, 21, 27, 21, SS);
  // capelli: corti ai lati (sfumati), più lunghi sopra e pettinati in avanti
  R(18, 2, 29, 4, HR); R(19, 1, 28, 1, HR); R(17, 3, 17, 7, HR); R(30, 3, 30, 6, HR);
  R(18, 5, 26, 5, HR); P(19, 6, HR); P(22, 6, HR); P(25, 6, HR);       // frangia in avanti
  P(20, 2, HL); P(23, 1, HL); P(25, 2, HL); P(21, 3, HL); P(27, 2, HL); P(24, 4, HL); P(26, 3, HL);
  R(17, 8, 17, 9, '#6a5246'); R(30, 7, 30, 8, '#6a5246');              // sfumatura
  // sopracciglia
  R(19, 8, 22, 8, EB); R(25, 8, 28, 8, EB);
  // occhiali scuri tondi
  R(18, 9, 22, 9, GL); R(25, 9, 29, 9, GL); P(18, 10, GL); P(18, 11, GL); P(22, 10, GL); P(22, 11, GL); P(25, 10, GL); P(25, 11, GL); P(29, 10, GL); P(29, 11, GL);
  R(19, 12, 21, 12, GL); R(26, 12, 28, 12, GL); R(23, 10, 24, 10, GL); P(17, 10, GL); P(30, 10, GL);
  P(20, 11, '#ffffff'); P(21, 11, EY); P(26, 11, EY); P(27, 11, '#ffffff'); P(19, 10, '#f6e2d0'); P(26, 10, '#f6e2d0'); // occhi e riflesso sulle lenti
  // naso e bocca: mezzo sorriso enigmatico
  P(24, 12, SS); P(24, 13, SS); P(23, 14, SS); P(24, 14, SS); P(25, 14, SS);
  R(22, 16, 26, 16, '#b47864'); P(26, 15, '#b47864'); P(21, 16, SS);
  // un filo di barba
  R(19, 18, 19, 19, '#d8b090'); R(28, 18, 28, 19, '#d8b090'); R(21, 20, 26, 20, '#d8b090');
  return g;
}
