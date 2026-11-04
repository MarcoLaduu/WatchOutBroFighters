// Drrrrrrago: staff in fiera con badge al collo (sprite approvato). Alto e magro.
import { grid, OUTLINE as OL } from './pix.js';

export function drawDrrrrrrago(v = {}) {
  const o = { top:'#7a3fc0',topS:'#5e2f96',belt:'#2a2018',pants:'#c9b48a',pantsS:'#a8946c',shoe:'#ececec',sole:'#9a9a9a',stripe:'#7a3fc0' };
  const { g, R, P } = grid(0);
  const S='#e8b898',SS='#c69474',ST='#a8846c',HR='#4a3426',HL='#6e5040',HD='#33241a',EB='#2a1c14',EY='#2a1a10',LP='#b8705a';
  R(16,40,31,43,o.pants);R(16,40,22,58,o.pants);R(25,40,31,58,o.pants);R(22,44,22,58,o.pantsS);R(31,44,31,58,o.pantsS);
  R(14,59,22,60,o.shoe);R(25,59,33,60,o.shoe);R(14,61,22,61,o.sole);R(25,61,33,61,o.sole);
  R(16,60,19,60,o.stripe);R(28,60,31,60,o.stripe);
  R(14,21,33,23,o.top);R(15,21,32,30,o.top);R(16,31,31,38,o.top);R(30,23,32,30,o.topS);R(30,31,31,38,o.topS);
  R(21,21,26,21,o.topS);const L='#e0b84a';P(20,22,L);P(20,23,L);P(21,24,L);P(21,25,L);P(22,26,L);P(26,22,L);P(26,23,L);P(25,24,L);P(25,25,L);P(24,26,L);R(22,27,25,31,'#f2f2ee');R(23,28,24,29,'#2a5bd7');R(22,31,25,31,'#cfcfc8');R(16,37,31,38,o.topS);
  R(16,39,31,39,o.belt);R(23,39,24,39,'#9aa0a6');
  function arm(m){const X=x=>m?47-x:x;const A=(a,b,c,d,col)=>{const x0=Math.min(X(a),X(c)),x1=Math.max(X(a),X(c));R(x0,b,x1,d,col);};
    A(11,22,14,31,S);A(11,29,17,32,S);A(14,24,17,31,S);A(11,22,11,32,SS);
    A(11,22,14,27,o.top);A(11,27,14,27,o.topS);
    A(18,24,18,32,OL);
    A(13,18,18,23,S);A(13,18,13,23,SS);A(14,20,17,20,SS);}
  if(!v.noArms){arm(0);if(!v.noFrontArm)arm(1);}
  R(17,8,17,13,S);R(16,9,16,12,S);R(15,10,15,11,S);R(30,8,30,13,S);R(31,9,31,12,S);R(32,10,32,11,S);P(16,10,SS);P(16,11,SS);P(31,10,SS);P(31,11,SS);
  R(19,5,28,17,S);R(18,7,29,15,S);R(20,18,27,18,S);R(21,19,26,19,S);
  R(20,0,27,0,HR);R(19,1,28,1,HR);R(18,2,29,4,HR);R(18,5,20,5,HR);R(26,5,29,5,HR);R(22,5,24,5,HR);P(23,6,HR);R(18,6,18,7,HD);R(29,6,29,7,HD);
  P(21,0,HL);P(24,1,HL);P(26,0,HL);P(20,2,HL);P(23,3,HL);P(27,2,HL);P(25,4,HL);P(21,4,HL);
  R(19,8,22,8,EB);R(25,8,28,8,EB);P(19,7,EB);P(28,7,EB);
  R(20,10,21,10,EY);R(26,10,27,10,EY);P(20,9,SS);P(27,9,SS);R(19,11,21,11,SS);R(26,11,28,11,SS);
  P(24,10,SS);P(24,11,SS);P(24,12,SS);P(24,13,SS);P(23,13,SS);
  R(19,13,19,17,ST);R(28,13,28,17,ST);R(20,17,20,18,ST);R(27,17,27,18,ST);R(21,18,26,19,ST);R(21,14,26,14,ST);
  P(19,15,'#6a3428');P(28,15,'#6a3428');R(20,15,27,15,LP);R(20,16,27,16,'#ffffff');R(21,17,26,17,LP);
  return g;
}
