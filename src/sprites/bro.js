// Bro: divisa da rugby a righe, dita fasciate e tacchetti (sprite approvato). Parte 3 pixel più in basso.
import { grid, OUTLINE as OL } from './pix.js';

export function drawBro(v = {}) {
  const o = { top:'#1f3a7a',topS:'#162b5c',hoopC:'#c0392b',collar:'#f2f2ee',pants:'#f2f2ee',pantsS:'#cfcfc8',sock:'#1f3a7a',sockS:'#c0392b',shoe:'#1b1b1b',sole:'#1b1b1b' };
  const { g, R0, R, P } = grid(3);
  const S='#e4b596',SS='#c1906f',SC='#d9aa8c',SH='#f2d2bc',FZ='#b8957d',ST='#b89278',BR='#2a1e16',EB='#1e1510',EY='#2a1a10',LP='#b06a58';
  R0(14,43,33,46,o.pants);
  if(!v.noLegs){
  R0(14,43,22,57,o.pants);R0(25,43,33,57,o.pants);R0(22,47,22,57,o.pantsS);R0(33,47,33,57,o.pantsS);
  R0(14,50,22,57,null);R0(25,50,33,57,null);R0(15,50,21,53,S);R0(21,50,21,53,SS);R0(26,50,32,53,S);R0(32,50,32,53,SS);R0(15,54,21,57,o.sock);R0(26,54,32,57,o.sock);R0(15,55,21,55,o.sockS);R0(26,55,32,55,o.sockS);
  R0(12,58,22,60,o.shoe);R0(25,58,35,60,o.shoe);R0(12,61,22,61,o.sole);R0(25,61,35,61,o.sole);
  [13,16,19,26,29,32].forEach(x=>R0(x,62,x,62,'#9aa0a6'));
  }
  R(12,21,35,24,o.top);R(13,21,34,30,o.top);R(14,31,33,38,o.top);
  for(let y=22;y<=38;y+=4){const a=y>=31?14:(y<=23?12:13),b=y>=31?33:(y<=23?35:34);R(a,y,b,Math.min(y+1,38),o.hoopC);}
  R(31,23,34,30,o.topS);R(31,31,33,38,o.topS);R(15,37,32,38,o.topS);
  R(21,20,26,21,SS);
  R(20,21,27,21,o.collar);
  R0(14,42,33,42,o.pantsS);
  function arm(m){const X=x=>m?47-x:x;const A=(a,b,c,d,col)=>{const x0=Math.min(X(a),X(c)),x1=Math.max(X(a),X(c));R(x0,b,x1,d,col);};
    A(8,22,12,31,S);A(8,29,16,32,S);A(13,24,16,31,S);A(8,22,8,32,SS);
    A(8,22,12,26,o.top);A(8,22,12,23,o.hoopC);A(8,26,12,26,o.topS);
    A(17,24,17,32,OL);
    A(12,18,17,23,S);A(12,18,12,23,SS);A(13,20,16,20,SS);
    A(13,19,16,19,'#f2f2ee');A(13,21,16,21,'#f2f2ee');}
  if(!v.noArms){arm(0);if(!v.noFrontArm)arm(1);}
  R(17,8,17,13,S);R(16,9,16,12,S);R(30,8,30,13,S);R(31,9,31,12,S);P(16,10,SS);P(31,10,SS);P(17,11,SS);P(30,11,SS);
  R(20,0,27,0,SC);R(19,1,28,1,SC);R(18,2,29,6,SC);R(19,5,28,17,S);R(18,7,29,15,S);R(20,18,27,18,S);R(21,19,26,19,S);
  R(18,6,29,7,S);
  [[20,1],[23,0],[26,1],[19,3],[28,3],[22,2],[25,2],[18,5],[29,5],[21,4],[27,4]].forEach(([x,y])=>P(x,y,FZ));
  R(21,1,23,1,SH);P(20,2,SH);P(21,2,SH);
  R(19,8,22,8,EB);R(25,8,28,8,EB);R(20,7,22,7,EB);R(25,7,27,7,EB);
  P(20,10,'#ffffff');P(21,10,EY);P(26,10,EY);P(27,10,'#ffffff');R(20,9,21,9,SS);R(26,9,27,9,SS);P(21,11,SS);P(26,11,SS);
  P(24,10,SS);P(24,11,SS);P(24,12,SS);P(23,13,SS);P(24,13,SS);P(22,13,SS);
  R(18,13,18,16,ST);R(29,13,29,16,ST);R(19,15,19,17,ST);R(28,15,28,17,ST);R(20,17,20,18,ST);R(27,17,27,18,ST);
  R(21,14,26,14,BR);P(21,15,BR);P(26,15,BR);R(22,15,25,15,LP);R(22,16,25,16,S);P(21,16,BR);P(26,16,BR);R(21,17,26,18,BR);P(23,16,BR);P(24,16,BR);
  return g;
}
