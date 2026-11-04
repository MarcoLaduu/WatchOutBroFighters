// Ste: tuta sportiva blu (sprite approvato). Più basso: parte 6 pixel più in basso.
import { grid, OUTLINE as OL } from './pix.js';

export function drawSte(v = {}) {
  const o = { top:'#1d4fa0',topS:'#153a78',zip:'#d8d8d8',trim:'#f2f2ee',cuff:'#f2f2ee',pants:'#1d4fa0',pantsS:'#153a78',legStripe:'#f2f2ee',shoe:'#ececec',sole:'#9a9a9a',stripe:'#1d4fa0' };
  const { g, R0, R, P } = grid(6);
  const S='#dcaa86',SS='#b88663',HR='#211813',HL='#3d2c22',EB='#1e1510',EY='#2a1a10';
  R0(15,46,32,48,o.pants);R0(15,46,22,57,o.pants);R0(25,46,32,57,o.pants);R0(22,49,22,57,o.pantsS);R0(32,49,32,57,o.pantsS);
  R0(15,46,15,57,o.legStripe);R0(32,46,32,57,o.legStripe);
  R0(13,58,22,60,o.shoe);R0(25,58,34,60,o.shoe);R0(13,61,22,61,o.sole);R0(25,61,34,61,o.sole);
  R0(15,59,19,59,o.stripe);R0(28,59,32,59,o.stripe);
  R(13,22,34,24,o.top);R(14,22,33,37,o.top);R(31,24,33,37,o.topS);R(15,36,32,37,o.topS);
  R(21,21,26,22,SS);
  R(23,22,24,37,o.zip);R(20,22,27,22,o.trim);R(15,36,32,37,o.trim);
  R(14,38,33,39,o.pants);
  function arm(m){const X=x=>m?47-x:x;const A=(a,b,c,d,col)=>{const x0=Math.min(X(a),X(c)),x1=Math.max(X(a),X(c));R(x0,b,x1,d,col);};
    A(10,23,13,31,o.top);A(10,29,16,32,o.top);A(13,24,16,31,o.top);A(10,23,10,32,o.topS);
    A(13,24,16,25,o.cuff);
    A(10,23,10,31,o.trim);
    A(17,24,17,32,OL);
    A(12,18,17,23,S);A(12,18,12,23,SS);A(13,20,16,20,SS);}
  if(!v.noArms){arm(0);if(!v.noFrontArm)arm(1);}
  R(17,10,17,14,S);R(30,10,30,14,S);P(17,12,SS);P(30,12,SS);
  R(19,6,28,18,S);R(18,8,29,16,S);R(20,19,27,20,S);
  R(18,2,29,6,HR);R(19,1,28,1,HR);R(17,4,17,8,HR);R(30,4,30,8,HR);R(18,7,19,7,HR);R(28,7,29,7,HR);
  P(20,2,HL);P(22,1,HL);P(24,2,HL);P(26,1,HL);P(27,3,HL);P(21,4,HL);P(25,4,HL);P(19,3,HL);
  R(19,9,22,9,EB);R(25,9,28,9,EB);P(19,10,EB);P(28,10,EB);
  P(20,11,'#ffffff');P(21,11,EY);P(26,11,EY);P(27,11,'#ffffff');R(20,12,21,12,SS);R(26,12,27,12,SS);
  P(24,11,SS);P(24,12,SS);P(23,13,SS);P(24,13,SS);
  const BS='#4a3628',BM='#5e4636',LP='#b8705a';
  R(18,14,18,17,BS);R(29,14,29,17,BS);R(19,17,19,18,BS);R(28,17,28,18,BS);R(20,19,20,19,BS);R(27,19,27,19,BS);R(21,19,26,20,BS);P(23,18,BM);P(24,18,BM);
  R(21,14,26,14,BM);P(20,15,'#6a3428');P(27,15,'#6a3428');R(21,15,26,15,LP);R(21,16,26,16,'#ffffff');R(22,17,25,17,LP);
  P(17,15,'#cfd3d8');P(17,16,'#9aa0a6');
  return g;
}
