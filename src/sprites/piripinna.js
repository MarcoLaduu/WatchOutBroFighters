// Piripinna: divisa da pallavolo blu col 15, ricci raccolti in una coda (sprite approvato). Parte 3 pixel più in basso.
import { grid, OUTLINE as OL } from './pix.js';

export function drawPiripinna(v = {}) {
  const { g, R0, R, P } = grid(3);
  const S = '#d9a27a', SS = '#b57b56', HR = '#1c1410', HL = '#3b2a20', EB = '#16100c', EY = '#4f8a3c', GOLD = '#e2b84c', WH = '#f4f2ee';
  const o = { top: '#2f6fd0', topS: '#1f4f9c', trim: '#f4f2ee', num: '#f4f2ee', bottom: '#1e1e26', bottomS: '#121218', shoe: '#f2f2f2', sole: '#c03a3a' };
  // gambe: pantaloncini, ginocchiere, calzini e scarpe da pallavolo
  R0(16, 41, 31, 47, o.bottom); R0(23, 45, 24, 47, o.bottomS);
  R0(17, 48, 22, 57, S); R0(25, 48, 30, 57, S); R0(22, 48, 22, 57, SS); R0(30, 48, 30, 57, SS);
  R0(17, 51, 22, 53, WH); R0(25, 51, 30, 53, WH); R0(17, 53, 22, 53, '#c9c6c0'); R0(25, 53, 30, 53, '#c9c6c0');
  R0(17, 56, 22, 57, WH); R0(25, 56, 30, 57, WH);
  R0(14, 58, 22, 60, o.shoe); R0(25, 58, 33, 60, o.shoe); R0(14, 61, 22, 61, o.sole); R0(25, 61, 33, 61, o.sole);
  R0(16, 59, 20, 59, o.top); R0(28, 59, 32, 59, o.top);
  // busto snello con vita stretta, maglia col 15
  R(15, 22, 32, 24, o.top); R(16, 22, 31, 30, o.top); R(17, 31, 30, 37, o.top); R(30, 24, 31, 30, o.topS); R(29, 31, 30, 37, o.topS); R(18, 36, 29, 37, o.topS);
  R(18, 29, 22, 29, o.topS); R(25, 29, 29, 29, o.topS); P(17, 28, o.topS); P(30, 28, o.topS);
  R(16, 22, 16, 30, o.trim); R(31, 22, 31, 30, o.trim);
  P(22, 28, o.num); P(21, 29, o.num); P(22, 29, o.num); P(22, 30, o.num); P(22, 31, o.num); R(21, 32, 22, 32, o.num);
  R(24, 28, 25, 28, o.num); P(24, 29, o.num); R(24, 30, 25, 30, o.num); P(25, 31, o.num); R(24, 32, 25, 32, o.num);
  R(16, 38, 31, 40, o.bottom);
  // collo e collana di perline bianche con ciondoli dorati
  R(22, 21, 25, 22, SS);
  P(20, 23, WH); P(21, 24, WH); P(22, 25, WH); P(23, 25, WH); P(24, 25, WH); P(25, 25, WH); P(26, 24, WH); P(27, 23, WH); P(23, 26, GOLD); P(24, 27, GOLD);
  function arm(m) {
    const X = x => m ? 47 - x : x;
    const A = (a, b, c, d, col) => { const x0 = Math.min(X(a), X(c)), x1 = Math.max(X(a), X(c)); R(x0, b, x1, d, col); };
    A(11, 24, 13, 31, S); A(11, 29, 16, 31, S); A(14, 24, 16, 30, S); A(11, 24, 11, 31, SS);
    A(11, 23, 14, 26, o.top); A(11, 26, 14, 26, o.topS);
    A(17, 24, 17, 31, OL);
    A(13, 19, 17, 23, S); A(13, 19, 13, 23, SS); A(14, 21, 16, 21, SS);
  }
  if (!v.noArms) { arm(0); if (!v.noFrontArm) arm(1); }
  // testa: viso dal mento stretto
  R(19, 6, 28, 17, S); R(18, 8, 29, 15, S); R(20, 18, 27, 18, S); R(21, 19, 26, 19, S); R(22, 20, 25, 20, S);
  // ricci scuri: volume ai lati del viso e coda dietro
  R(18, 2, 29, 6, HR); R(19, 1, 28, 1, HR); R(17, 3, 17, 9, HR); R(30, 3, 30, 8, HR);
  P(20, 1, HL); P(23, 2, HL); P(26, 1, HL); P(28, 3, HL); P(21, 4, HL); P(25, 4, HL); P(19, 3, HL);
  R(18, 7, 21, 7, HR); P(18, 8, HR); P(26, 7, HR); P(27, 7, HR); P(29, 8, HR);
  R(16, 4, 17, 17, HR); R(30, 4, 31, 17, HR); P(16, 18, HR); P(31, 18, HR); P(15, 6, HR); P(15, 11, HR); P(15, 15, HR); P(32, 7, HR); P(32, 12, HR);
  P(16, 8, HL); P(16, 13, HL); P(31, 10, HL); P(31, 15, HL);
  R(13, 4, 16, 8, HR); R(12, 6, 14, 12, HR); R(13, 13, 14, 14, HR); P(13, 6, HL); P(12, 9, HL); P(14, 11, HL); P(15, 5, HL);
  // sopracciglia ad arco, ciglia e occhi
  P(19, 9, EB); R(20, 8, 22, 8, EB); R(25, 8, 27, 8, EB); P(28, 9, EB);
  R(19, 10, 21, 10, EB); R(26, 10, 28, 10, EB); P(18, 10, EB); P(29, 10, EB);
  P(20, 11, '#ffffff'); P(21, 11, EY); P(26, 11, EY); P(27, 11, '#ffffff'); // occhi verdi
  // naso col piercing, sorriso, guance, orecchini
  P(24, 11, SS); P(24, 12, SS); P(23, 13, SS); P(24, 13, SS); P(22, 13, GOLD); // piercing al naso (a sinistra)
  R(21, 15, 26, 15, '#c4485a'); R(21, 16, 26, 16, WH); R(22, 17, 25, 17, '#c4485a'); P(20, 15, '#a83c4c'); P(27, 15, '#a83c4c');
  P(19, 14, '#e8907e'); P(28, 14, '#e8907e');
  P(17, 15, GOLD); P(30, 15, GOLD);
  return g;
}
