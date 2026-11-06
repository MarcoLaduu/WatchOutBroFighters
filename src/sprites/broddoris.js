// Broddoris: powerlifter, maglietta nera, cintura di cuoio, pantaloncini e fasce ai polsi (sprite approvato). Parte 3 pixel più in basso.
import { grid, OUTLINE as OL } from './pix.js';

export function drawBroddoris(v = {}) {
  const { g, R0, R, P } = grid(3);
  const S = '#efc4a2', SS = '#cf9c7a', SH = '#f8dcc4', HR = '#2a1a12', HL = '#4a3022', EB = '#24160e', EY = '#4a2a18', LP = '#b4626a';
  const L = { top: '#1e1e24', topS: '#121216', bottom: '#2a2a32', bottomS: '#1a1a20', shoe: '#2a2a2a', sole: '#e0e0e0', belt: '#6a3a1e' };
  // gambe grosse
  // pantaloncini e calzini scuri
  R0(14, 42, 33, 49, L.bottom); R0(23, 46, 24, 49, L.bottomS); R0(14, 50, 22, 57, S); R0(25, 50, 33, 57, S); R0(22, 50, 22, 57, SS); R0(33, 50, 33, 57, SS);
  R0(14, 56, 22, 57, '#2a2a2a'); R0(25, 56, 33, 57, '#2a2a2a');
  R0(12, 58, 22, 60, L.shoe); R0(25, 58, 35, 60, L.shoe); R0(12, 61, 22, 61, L.sole); R0(25, 61, 35, 61, L.sole);
  // busto largo e muscoloso
  // maglietta nera sul busto largo
  R(11, 21, 36, 24, L.top); R(12, 21, 35, 29, L.top); R(14, 30, 33, 33, L.top); R(15, 34, 32, 38, L.top);
  R(32, 23, 35, 29, L.topS); R(31, 30, 33, 38, L.topS); R(20, 21, 27, 22, S); R(21, 23, 26, 23, S);
  R(18, 28, 22, 28, L.topS); R(25, 28, 29, 28, L.topS);
  // cintura da gara
  // cintura di cuoio
  R(14, 36, 33, 40, L.belt); R(22, 37, 25, 39, '#c8c8d0'); R(23, 38, 24, 38, L.belt);
  function arm(m) {
    const X = x => m ? 47 - x : x;
    const A = (a, b, c, d, col) => { const x0 = Math.min(X(a), X(c)), x1 = Math.max(X(a), X(c)); R(x0, b, x1, d, col); };
    A(7, 22, 12, 31, S); A(7, 29, 16, 32, S); A(12, 24, 16, 31, S); A(7, 22, 7, 32, SS); A(9, 24, 10, 25, SH); A(8, 28, 11, 28, SS);
    A(7, 21, 12, 25, L.top); A(7, 21, 7, 25, L.topS);   // manica corta
    A(12, 31, 16, 32, '#3a3a44');                        // fasce ai polsi
    A(17, 24, 17, 32, OL);
    A(11, 18, 17, 23, S); A(11, 18, 11, 23, SS); A(12, 20, 16, 20, SS);
  }
  if (!v.noArms) { arm(0); if (!v.noFrontArm) arm(1); }
  // collo largo e testa tonda
  R(20, 18, 27, 21, SS);
  R(17, 8, 17, 14, S); R(30, 8, 30, 14, S); P(17, 11, SS); P(30, 11, SS);
  R(19, 4, 28, 18, S); R(18, 6, 29, 16, S); R(20, 19, 27, 19, S);
  // capelli ricci scuri e voluminosi, ciuffo sulla fronte
  R(18, 0, 20, 0, HR); R(23, 0, 25, 0, HR); R(28, 0, 29, 0, HR);           // ricci in cima
  R(17, 1, 30, 5, HR); R(16, 2, 31, 8, HR); R(16, 9, 17, 10, HR); R(30, 9, 31, 10, HR);
  P(15, 3, HR); P(15, 4, HR); P(15, 7, HR); P(15, 8, HR); P(32, 3, HR); P(32, 4, HR); P(32, 7, HR); P(32, 8, HR); P(16, 11, HR); P(31, 11, HR);
  R(18, 6, 28, 7, HR); P(18, 8, HR); P(20, 8, HR); P(22, 8, HR); P(25, 8, HR); P(27, 8, HR);   // ciuffo riccio sulla fronte
  [[19, 0], [24, 0], [28, 1], [18, 2], [21, 2], [26, 2], [30, 3], [17, 4], [20, 4], [23, 3], [27, 5], [16, 6], [22, 5], [25, 4], [19, 6], [29, 7], [21, 7], [15, 4], [32, 7]].forEach(([x, y]) => P(x, y, HL));
  // sopracciglia, occhi grandi
  R(19, 9, 22, 9, EB); R(25, 9, 28, 9, EB);
  P(20, 11, '#ffffff'); P(21, 11, EY); P(26, 11, EY); P(27, 11, '#ffffff'); P(21, 10, '#ffffff'); P(26, 10, '#ffffff');
  // guance piene, naso, bocca aperta
  R(18, 13, 19, 15, '#f2b49c'); R(28, 13, 29, 15, '#f2b49c');
  P(24, 11, SS); P(24, 12, SS); P(23, 13, SS); P(24, 13, SS); P(25, 13, SS);
  // bocca aperta: denti in alto, niente riga scura sopra (sembrava un paio di baffi)
  R(21, 15, 26, 15, '#ffffff'); R(21, 16, 26, 16, '#6a2028'); R(22, 17, 25, 17, '#d86a76'); P(20, 15, LP); P(27, 15, LP); P(20, 16, LP); P(27, 16, LP); R(22, 18, 25, 18, LP);
  return g;
}
