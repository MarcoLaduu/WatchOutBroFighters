// Arena: una piazza sul mare al tramonto, disegnata una volta su un canvas a parte.
import { W, H, GROUND } from '../config.js';

let bg = null;

export function arenaCanvas() {
  if (bg) return bg;
  bg = document.createElement('canvas');
  bg.width = W; bg.height = H;
  const c = bg.getContext('2d');
  const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

  // cielo a fasce (prima un fondo pieno, così sotto le colline non resta nulla di trasparente)
  R(0, 0, W, H, '#f7b15a');
  const sky = ['#2a1b4a', '#3d2160', '#5a2a6e', '#7e3470', '#a8436a', '#d0605e', '#ee8a55', '#f7b15a'];
  sky.forEach((col, i) => R(0, i * 13, W, 13, col));
  // stelle
  for (let i = 0; i < 40; i++) R((i * 97) % W, (i * 37) % 34, 1, 1, i % 3 ? '#c9b8ff' : '#ffffff');
  // sole
  c.fillStyle = '#ffd27a';
  c.beginPath(); c.arc(292, 104, 22, 0, Math.PI * 2); c.fill();
  R(270, 100, 44, 2, '#f7b15a'); R(270, 108, 44, 2, '#f7b15a');
  // colline lontane
  c.fillStyle = '#5b2d5e';
  c.beginPath(); c.moveTo(0, 118);
  for (let x = 0; x <= W; x += 8) c.lineTo(x, 104 + Math.round(Math.sin(x / 37) * 8 + Math.sin(x / 13) * 3));
  c.lineTo(W, 130); c.lineTo(0, 130); c.fill();
  // mare
  R(0, 118, W, 40, '#3b4f8a');
  for (let y = 120; y < 158; y += 4) for (let x = (y * 7) % 16; x < W; x += 16) R(x, y, 6, 1, y < 130 ? '#f0a860' : '#5a6fb0');
  // nuraghe sulla collina a sinistra
  c.fillStyle = '#4a2a4c';
  c.beginPath(); c.moveTo(40, 118); c.lineTo(46, 92); c.lineTo(66, 92); c.lineTo(72, 118); c.fill();
  R(44, 90, 24, 3, '#4a2a4c'); R(53, 108, 6, 10, '#2a1830');
  // muretto e balaustra
  R(0, 152, W, 10, '#c9a27a'); R(0, 152, W, 2, '#e6c49a'); R(0, 160, W, 2, '#9c7552');
  for (let x = 6; x < W; x += 20) { R(x, 140, 4, 12, '#d8b58a'); R(x + 3, 140, 1, 12, '#a88360'); }
  R(0, 138, W, 3, '#e6c49a');
  // lampioni
  for (const lx of [24, 356]) {
    R(lx, 96, 3, 56, '#2a2030'); R(lx - 4, 92, 11, 5, '#2a2030'); R(lx - 3, 97, 9, 4, '#ffe9a0');
  }
  // pavimento in pietra
  R(0, 162, W, H - 162, '#8a6a58');
  for (let y = 162, row = 0; y < H; y += 9, row++) {
    R(0, y, W, 1, '#6e5242');
    for (let x = (row % 2) * 14; x < W; x += 28) R(x, y, 1, 9, '#6e5242');
  }
  R(0, 162, W, 2, '#a68472');
  // gente sullo sfondo (sagome)
  const crowd = [[96, '#3a2440'], [112, '#2e1d36'], [270, '#3a2440'], [286, '#2e1d36'], [302, '#3a2440']];
  for (const [x, col] of crowd) { R(x, 128, 8, 10, col); R(x + 2, 123, 4, 5, col); }
  R(0, GROUND + 2, 0, 0, '#000');
  return bg;
}
