// Mc: il re del calcetto, maglia oro numero 10 e corona (sprite approvato). Parte 3 pixel più in basso.
import { grid, OUTLINE as OL } from './pix.js';

export function drawMc(v = {}) {
  const o = { top:'#e0b53a',topS:'#b8902a',trim:'#1b1b1b',pants:'#1b1b1b',pantsS:'#111111',sock:'#e0b53a',sockS:'#1b1b1b',shoe:'#1b1b1b',sole:'#e0e0e0',stripe:'#e0b53a' };
  const { g, R0, R, P } = grid(3);
  const S='#e2b192',SS='#bf8e6e',HR='#1f1712',HL='#3a2b22',HF='#6e5a4e',BR='#261b15',BL='#43322a',EB='#1a120e',EY='#2a1a10',LP='#b06a58',FR='#151515';
  R0(15,43,32,46,o.pants);R0(15,43,22,57,o.pants);R0(25,43,32,57,o.pants);R0(22,47,22,57,o.pantsS);R0(32,47,32,57,o.pantsS);
  R0(15,50,22,57,null);R0(25,50,32,57,null);R0(16,50,21,54,S);R0(21,50,21,54,SS);R0(26,50,31,54,S);R0(31,50,31,54,SS);R0(16,54,21,57,o.sock);R0(26,54,31,57,o.sock);R0(16,55,21,55,o.sockS);R0(26,55,31,55,o.sockS);
  R0(13,58,22,60,o.shoe);R0(25,58,34,60,o.shoe);R0(13,61,22,61,o.sole);R0(25,61,34,61,o.sole);
  R0(15,59,19,59,o.stripe);R0(28,59,32,59,o.stripe);
  R(14,22,33,24,o.top);R(15,22,32,38,o.top);R(30,24,32,38,o.topS);R(16,37,31,38,o.topS);
  R(21,21,26,22,SS);
  R(15,22,15,38,o.trim);R(32,22,32,38,o.trim);R(20,22,27,22,o.trim);const N=o.trim;R(20,27,20,33,N);R(23,27,25,27,N);R(23,33,25,33,N);R(23,27,23,33,N);R(25,27,25,33,N);
  function arm(m){const X=x=>m?47-x:x;const A=(a,b,c,d,col)=>{const x0=Math.min(X(a),X(c)),x1=Math.max(X(a),X(c));R(x0,b,x1,d,col);};
    A(11,23,14,31,S);A(11,29,17,32,S);A(14,24,17,31,S);A(11,23,11,32,SS);
    A(11,23,14,27,o.top);A(11,27,14,27,o.topS);
    A(18,24,18,32,OL);
    A(13,18,18,23,S);A(13,18,13,23,SS);A(14,20,17,20,SS);}
  if(!v.noArms){arm(0);if(!v.noFrontArm)arm(1);}
  R(17,9,17,13,S);R(30,9,30,13,S);P(17,11,SS);P(30,11,SS);
  R(19,5,28,17,S);R(18,7,29,15,S);
  R(19,1,28,1,HR);R(18,2,29,4,HR);R(18,5,18,8,HF);R(29,5,29,8,HF);R(19,5,20,5,HR);R(27,5,28,5,HR);
  P(20,2,HL);P(22,1,HL);P(24,2,HL);P(26,1,HL);P(21,3,HL);P(25,3,HL);P(23,2,HL);
  R(19,7,22,7,EB);R(25,7,28,7,EB);
  R(19,9,22,9,FR);R(19,12,22,12,FR);R(19,9,19,12,FR);R(22,9,22,12,FR);R(25,9,28,9,FR);R(25,12,28,12,FR);R(25,9,25,12,FR);R(28,9,28,12,FR);R(23,10,24,10,FR);P(18,10,FR);P(29,10,FR);
  R(20,10,21,11,'#efd2bf');R(26,10,27,11,'#efd2bf');P(20,11,'#ffffff');P(21,11,EY);P(26,11,EY);P(27,11,'#ffffff');
  P(24,12,SS);P(24,13,SS);P(23,14,SS);P(24,14,SS);
  R(18,12,18,14,BL);R(29,12,29,14,BL);R(18,15,19,18,BR);R(28,15,29,18,BR);R(18,17,29,18,BR);R(19,19,28,19,BR);R(21,20,26,20,BR);
  R(20,15,27,15,BR);R(19,16,20,16,BR);R(27,16,28,16,BR);R(21,16,26,16,LP);P(26,15,LP);
  P(20,18,BL);P(24,19,BL);P(27,17,BL);
  const G='#f2c230',GD='#c8962a';R(20,-2,27,0,G);P(20,-3,G);P(23,-3,G);P(24,-3,G);P(27,-3,G);R(20,0,27,0,GD);P(22,-1,'#c0392b');P(25,-1,'#2a5bd7');
  return g;
}
