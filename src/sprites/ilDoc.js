// Il Doc: camice, divisa verde e stetoscopio (sprite approvato, faccia v2).
import { grid, OUTLINE as OL } from './pix.js';

export function drawIlDoc(v = {}) {
  const o = { top: '#f1f3f4', topS: '#cfd4d8', sleeve: 'long', coat: true, scrub: '#4f9d8c', pants: '#4f9d8c', pantsS: '#3b7a6c', shoe: '#f1f3f4', sole: '#b9bec3' };
  const { g, R, P } = grid(0);
  const S='#e3b08e',SS='#c08c6a',ST='#c59a7a',HR='#2b1e17',HL='#4a3629',HF='#7a6352',EY='#2e1d12',LP='#b0705a';
  R(15,40,32,43,o.pants);R(15,40,22,58,o.pants);R(25,40,32,58,o.pants);R(22,44,22,58,o.pantsS);R(32,44,32,58,o.pantsS);
  R(13,59,22,60,o.shoe);R(25,59,34,60,o.shoe);R(13,61,22,61,o.sole);R(25,61,34,61,o.sole);
  R(13,21,34,23,o.top);R(14,21,33,30,o.top);R(15,31,32,38,o.top);
  R(31,23,33,30,o.topS);R(31,31,32,38,o.topS);
  R(15,39,32,39,o.topS);
  R(22,20,25,20,SS);
  R(14,39,33,48,o.top);R(23,39,24,48,o.pants);R(31,39,33,48,o.topS);R(22,21,25,38,o.topS);R(21,21,26,24,o.scrub);R(22,25,25,27,o.scrub);R(23,28,24,29,o.scrub);
  R(28,32,31,34,o.topS);P(29,31,'#2a5bd7');
  const SG='#8b9198';P(20,21,SG);P(19,22,SG);P(19,23,SG);P(19,24,SG);P(19,25,SG);P(20,26,SG);P(27,21,SG);P(28,22,SG);P(28,23,SG);P(28,24,SG);P(28,25,SG);P(28,26,SG);R(27,27,29,28,'#c7ccd1');
  function arm(m){
    const X=x=>m?47-x:x;
    const A=(a,b,c,d,col)=>{const x0=Math.min(X(a),X(c)),x1=Math.max(X(a),X(c));R(x0,b,x1,d,col);};
    A(10,22,13,31,o.top);A(10,29,16,32,o.top);A(13,24,16,31,o.top);A(10,22,10,32,o.topS);
    A(13,24,16,25,o.topS);
    A(17,24,17,32,OL);
    A(12,18,17,23,S);A(12,18,12,23,SS);A(13,20,16,20,SS);
  }
  if(!v.noArms){arm(0);if(!v.noFrontArm)arm(1);}
  R(18,10,18,13,S);R(29,10,29,13,S);P(18,12,SS);P(29,12,SS);
  R(19,6,28,16,S);R(20,17,27,18,S);R(21,19,26,19,S);
  P(19,13,SS);P(28,13,SS);
  R(19,14,19,16,ST);R(28,14,28,16,ST);R(20,17,20,18,ST);R(27,17,27,18,ST);R(21,19,26,19,ST);R(22,15,25,15,ST);
  R(20,0,27,0,HR);R(18,1,29,5,HR);R(17,3,17,5,HR);R(30,3,30,4,HR);
  R(18,6,18,9,HF);R(29,6,29,9,HF);
  R(19,6,28,6,HR);R(20,7,28,7,HR);R(23,8,28,8,HR);P(28,9,HR);P(22,7,S);
  P(21,2,HL);P(22,3,HL);P(25,2,HL);P(26,4,HL);P(23,6,HL);P(20,1,HL);
  R(20,9,22,9,HR);R(25,9,27,9,HR);
  P(20,11,'#ffffff');P(21,11,EY);P(26,11,EY);P(27,11,'#ffffff');
  P(24,10,SS);P(24,11,SS);P(24,12,SS);P(24,13,SS);P(23,14,SS);P(24,14,SS);
  R(22,16,25,16,LP);P(21,15,LP);P(26,15,LP);
  return g;
}
