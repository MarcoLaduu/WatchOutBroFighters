// Sergente Argus: mimetica, gradi, piastrine e berretto (sprite approvato). Parte 3 pixel più in basso.
import { grid, OUTLINE as OL } from './pix.js';

export function drawSergenteArgus(v = {}) {
  const o = { top:'#5b6b3a',topS:'#46532c',capC:'#5b6b3a',capS:'#46532c',camo:'#3a4524',pants:'#6d7a48',pantsS:'#56613a',shoe:'#1e1a16',sole:'#0f0d0b' };
  const { g, R0, R, P } = grid(3);
  const S='#ebbd9f',SS='#c9967a',ST='#d4a98c',HR='#5a4434',HL='#7a604c',HD='#3e2e22',HF='#8a7262',MU='#2a1e16',EB='#3a2a1f',EY='#4f6170',LP='#b06a58';
  R0(14,43,33,46,o.pants);R0(14,43,22,57,o.pants);R0(25,43,33,57,o.pants);R0(22,47,22,57,o.pantsS);R0(33,47,33,57,o.pantsS);
  [[16,45],[19,48],[15,51],[20,54],[27,46],[30,49],[26,52],[31,55],[18,56],[29,57]].forEach(([x,y])=>{R0(x,y,x+1,y+1,o.camo)});
  R0(14,54,22,57,o.shoe);R0(25,54,33,57,o.shoe);
  R0(12,58,22,60,o.shoe);R0(25,58,35,60,o.shoe);R0(12,61,22,61,o.sole);R0(25,61,35,61,o.sole);
  R(12,21,35,24,o.top);R(13,21,34,30,o.top);R(14,31,33,38,o.top);R(31,23,34,30,o.topS);R(31,31,33,38,o.topS);R(15,37,32,38,o.topS);
  R(21,20,26,21,SS);
  const T='#b9bec3';P(21,22,T);P(22,23,T);P(23,24,T);P(24,24,T);P(25,23,T);P(26,22,T);R(23,25,24,27,'#d8dce0');
  R0(14,42,33,42,'#2a2018');R0(23,42,24,42,'#9aa0a6');
  function arm(m){const X=x=>m?47-x:x;const A=(a,b,c,d,col)=>{const x0=Math.min(X(a),X(c)),x1=Math.max(X(a),X(c));R(x0,b,x1,d,col);};
    A(8,22,12,31,S);A(8,29,16,32,S);A(13,24,16,31,S);A(8,22,8,32,SS);
    A(8,22,12,26,o.top);A(8,26,12,26,o.topS);A(9,24,11,24,'#e0b84a');P(X(10),25,'#e0b84a');
    A(17,24,17,32,OL);
    A(12,18,17,23,S);A(12,18,12,23,SS);A(13,20,16,20,SS);}
  if(!v.noArms){arm(0);if(!v.noFrontArm)arm(1);}
  R(17,9,17,13,S);R(30,9,30,13,S);P(17,11,SS);P(30,11,SS);
  R(19,5,28,17,S);R(18,7,29,15,S);R(19,16,28,18,S);R(20,19,27,19,S);
  R(19,1,28,1,HR);R(18,2,29,5,HR);R(18,6,18,8,HF);R(29,6,29,8,HF);R(19,6,19,6,HR);
  P(21,2,HD);P(21,3,HD);P(22,4,HD);P(20,1,HL);P(23,1,HL);P(24,2,HL);P(26,2,HL);P(27,3,HL);P(25,4,HL);P(19,3,HL);
  R(19,8,22,8,EB);R(25,8,28,8,EB);
  P(20,10,'#ffffff');P(21,10,EY);P(26,10,EY);P(27,10,'#ffffff');R(20,9,21,9,SS);R(26,9,27,9,SS);
  P(24,10,SS);P(24,11,SS);P(24,12,SS);P(23,13,SS);P(24,13,SS);
  R(19,16,19,18,ST);R(28,16,28,18,ST);R(21,18,26,19,ST);R(20,18,20,18,ST);R(27,18,27,18,ST);
  R(20,14,27,14,MU);R(19,15,22,15,MU);R(25,15,28,15,MU);P(19,16,MU);P(28,16,MU);
  R(22,16,25,16,LP);P(23,15,'#d9a58a');P(24,15,'#d9a58a');
  R(18,0,29,4,o.capC);R(17,3,30,4,o.capC);R(17,5,31,5,o.capS);R(20,0,27,0,o.capS);[[20,2],[24,1],[27,3]].forEach(([x,y])=>P(x,y,o.camo));
  return g;
}
