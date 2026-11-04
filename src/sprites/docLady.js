// Doc Lady: maglia rossoblù, jeans e scarpe bianche (sprite approvato).
import { grid, OUTLINE as OL } from './pix.js';


export function drawDocLady(v = {}) {
  const o = { shirt: '#b3122e', shirtS: '#7d0c20', right: '#1d2f6f', rightS: '#121e4a', collar: '#f2f2ee', pants: '#3a5a8c', pantsS: '#2b4670', shoe: '#ececec', sole: '#9a9a9a', stripe: '#c0392b' };
  const { g, R, P } = grid(0);
  const S = '#e8b896', SS = '#c9946f', HR = '#2a1d16', HL = '#47322a', EY = '#3a2414';
  R(14,41,33,45,o.pants);R(14,43,21,57,o.pants);R(26,43,33,57,o.pants);R(21,46,21,57,o.pantsS);R(33,46,33,57,o.pantsS);
  R(12,58,21,60,o.shoe);R(26,58,35,60,o.shoe);R(12,61,21,61,o.sole);R(26,61,35,61,o.sole);
  R(14,59,18,59,o.stripe);R(29,59,33,59,o.stripe);
  R(13,22,34,40,o.shirt);R(12,29,35,39,o.shirt);
  R(24,22,34,40,o.right);R(24,29,35,39,o.right);
  R(33,24,35,39,o.rightS);R(15,39,23,40,o.shirtS);R(24,39,32,40,o.rightS);
  R(20,22,27,22,o.collar);
  R(13,41,34,42,'#3a2a20');R(23,41,24,42,'#c8a24a');
  function arm(m){
    const X=x=>m?47-x:x;
    const A=(a,b,c,d,col)=>{const x0=Math.min(X(a),X(c)),x1=Math.max(X(a),X(c));R(x0,b,x1,d,col);};
    const sl=m?o.right:o.shirt,sls=m?o.rightS:o.shirtS;
    A(9,23,12,31,S);A(9,29,16,32,S);A(13,22,16,31,S);A(9,23,9,32,SS);
    A(9,23,13,27,sl);A(9,27,13,27,sls);
    A(17,22,17,32,OL);
    A(12,17,17,22,S);A(12,17,12,22,SS);A(13,19,16,19,SS);
  }
  if(!v.noArms){arm(0);if(!v.noFrontArm)arm(1);}
  R(16,11,16,14,S);R(31,11,31,14,S);P(16,13,SS);P(31,13,SS);
  R(18,6,29,19,S);R(17,8,30,17,S);
  R(17,3,30,7,HR);R(18,2,29,2,HR);R(17,8,17,11,HR);R(30,8,30,11,HR);R(20,3,24,3,HL);P(26,4,HL);
  R(19,10,22,10,HR);R(25,10,28,10,HR);
  P(20,12,'#ffffff');P(21,12,EY);P(26,12,EY);P(27,12,'#ffffff');P(20,11,SS);P(27,11,SS);
  P(24,12,SS);P(24,13,SS);P(23,14,SS);P(24,14,SS);
  R(17,14,18,18,HR);R(29,14,30,18,HR);R(17,15,30,18,HR);R(18,19,29,19,HR);R(19,20,28,20,HR);R(21,21,26,21,HR);
  R(21,16,26,16,'#5a2a20');R(22,16,25,16,'#ffffff');
  P(20,18,HL);P(24,19,HL);P(27,17,HL);P(19,16,HL);
  return g;
}
