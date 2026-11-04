// Schermate: titolo, menu, comandi, selezione personaggi, presentazione, combattimento e pausa.
// Tutto quello che è testo e menu si disegna qui su un canvas; arena e lottatori li disegna Phaser (game/view.js).
import { W, H } from './config.js';
import { ROSTER } from './data/roster.js';
import { MOVESETS, BASE_MOVES } from './data/movesets.js';
import { ART } from './sprites/index.js';
import { wasPressed, anyPressed, confirm as pressConfirm, cancel, padType, takeTap, isTouch } from './input.js';
import { humanCtrl, cpuCtrl, LEVELS } from './game/controllers.js';
import { Fight } from './game/fight.js';
import { arenaCanvas } from './game/arena.js';
import { text, box, P1C, P2C, CPUC } from './ui.js';
import { sfx, music } from './audio.js';

const STAT_NAMES = [['vita', 'Vita'], ['forza', 'Forza'], ['velocita', 'Velocità'], ['salto', 'Salto']];
const COLS = 3, TILE = 36;

export function createScenes() {
  const G = {
    scene: 'title', t: 0, mode: 1, level: 1, menuIdx: 0,
    sel: [0, 1], locked: [false, false], fight: null, pauseIdx: 0, endIdx: 0, movesSide: 0,
  };
  const go = s => { G.scene = s; G.t = 0; };
  const vertical = () => (anyPressed('down') ? 1 : 0) - (anyPressed('up') ? 1 : 0);
  const horizontal = () => (anyPressed('right') ? 1 : 0) - (anyPressed('left') ? 1 : 0);

  function startFight() {
    const c1 = ROSTER[G.sel[0]], c2 = ROSTER[G.sel[1]];
    const ctrl2 = G.mode === 1 ? cpuCtrl(G.level) : humanCtrl(1);
    G.fight = new Fight(c1, c2, humanCtrl(0), ctrl2, ['G1', G.mode === 1 ? 'CPU' : 'G2']);
    go('fight');
  }

  const MENU = () => [
    '1 giocatore contro la CPU',
    '2 giocatori',
    `Difficoltà CPU: ${LEVELS[G.level].name}`,
    'Comandi',
  ];

  // Tocco sul telefono: un tocco su una voce la sceglie e la conferma (vedi handleTap).
  let tapOk = false;
  const confirm = p => pressConfirm(p) || (tapOk && (p == null || p === 0));
  // indice della voce di un elenco di drawMenuList toccata, o -1
  const tapItem = (tap, n, y0) => {
    for (let i = 0; i < n; i++) {
      const y = y0 + i * 18 - 11;
      if (tap.x >= W / 2 - 100 && tap.x <= W / 2 + 100 && tap.y >= y - 2 && tap.y <= y + 17) return i;
    }
    return -1;
  };
  function handleTap(tap) {
    tapOk = false;
    if (!tap) return;
    switch (G.scene) {
      case 'title': case 'controls': case 'vs': tapOk = true; break;
      case 'menu': {
        const i = tapItem(tap, 4, 82);
        if (i === 2) { G.menuIdx = 2; tapOk = true; } // cambia la difficoltà
        else if (i >= 0) { G.menuIdx = i; tapOk = true; }
        break;
      }
      case 'pause': { const i = tapItem(tap, 4, 100); if (i >= 0) { G.pauseIdx = i; tapOk = true; } break; }
      case 'end': { const i = tapItem(tap, 3, 100); if (i >= 0) { G.endIdx = i; tapOk = true; } break; }
      case 'fight': if (G.fight && G.fight.phase === 'match') tapOk = true; break;
      case 'moves':
        if (tap.y < 34 && tap.x > W / 2) { G.movesSide = 1 - G.movesSide; sfx.move(); }
        else tapOk = true;
        break;
      case 'select': {
        // primo tocco sceglie il lottatore, secondo tocco sullo stesso lo conferma
        const gx = W / 2 - (COLS * TILE) / 2, gy = 50;
        const c = Math.floor((tap.x - gx) / TILE), r = Math.floor((tap.y - gy) / TILE);
        if (c < 0 || c >= COLS || r < 0 || r >= 3) break;
        const i = G.mode === 2 ? 0 : (G.locked[0] ? 1 : 0);
        if (G.locked[i]) break;
        const k = r * COLS + c;
        if (G.sel[i] === k) tapOk = true; else { G.sel[i] = k; sfx.move(); }
        break;
      }
    }
  }

  function update() {
    G.t++;
    handleTap(takeTap());
    // musica: quella del menu fuori dal combattimento, quella del combattimento in partita (più bassa in pausa)
    const inFight = ['fight', 'pause', 'moves'].includes(G.scene);
    music.play(inFight ? 'fight' : 'main');
    music.duck(G.scene === 'pause' || G.scene === 'moves');
    switch (G.scene) {
      case 'title':
        if (confirm()) { sfx.select(); go('menu'); }
        break;
      case 'menu': {
        const v = vertical();
        if (v) { G.menuIdx = (G.menuIdx + v + 4) % 4; sfx.move(); }
        const h = horizontal();
        if (G.menuIdx === 2 && h) { G.level = (G.level + h + 3) % 3; sfx.move(); }
        if (confirm()) {
          sfx.select();
          if (G.menuIdx === 0 || G.menuIdx === 1) {
            G.mode = G.menuIdx === 0 ? 1 : 2; G.locked = [false, false];
            go('select');
          } else if (G.menuIdx === 2) G.level = (G.level + 1) % 3;
          else go('controls');
        }
        if (cancel()) go('title');
        break;
      }
      case 'controls':
        if (confirm() || cancel()) go('menu');
        break;
      case 'select':
        updateSelect();
        break;
      case 'vs':
        if (G.t > 110 || (G.t > 20 && confirm())) startFight();
        break;
      case 'fight': {
        const f = G.fight;
        if (f.phase === 'match') {
          f.updateMatch();
          if (f.pt > 90 && confirm()) { sfx.select(); G.endIdx = 0; go('end'); }
          break;
        }
        if (anyPressed('back') || anyPressed('start')) { G.pauseIdx = 0; go('pause'); sfx.move(); break; }
        f.update();
        break;
      }
      case 'pause': {
        const v = vertical();
        if (v) { G.pauseIdx = (G.pauseIdx + v + 4) % 4; sfx.move(); }
        if (anyPressed('back')) { G.scene = 'fight'; break; }
        if (confirm()) {
          sfx.select();
          if (G.pauseIdx === 0) G.scene = 'fight';
          else if (G.pauseIdx === 1) { G.movesSide = 0; go('moves'); }
          else if (G.pauseIdx === 2) { G.locked = [false, false]; go('select'); }
          else go('menu');
        }
        break;
      }
      case 'moves': {
        const h = horizontal();
        if (h) { G.movesSide = (G.movesSide + 2 + h) % 2; sfx.move(); }
        if (G.t > 5 && (confirm() || cancel())) { G.scene = 'pause'; sfx.move(); }
        break;
      }
      case 'end': {
        G.fight.updateMatch();
        const v = vertical();
        if (v) { G.endIdx = (G.endIdx + v + 3) % 3; sfx.move(); }
        if (confirm()) {
          sfx.select();
          if (G.endIdx === 0) go('vs');
          else if (G.endIdx === 1) { G.locked = [false, false]; go('select'); }
          else go('menu');
        }
        break;
      }
    }
  }

  // In modalità 1 giocatore il G1 sceglie prima sé stesso e poi l'avversario della CPU.
  function updateSelect() {
    const move = (i, p) => {
      const dx = (wasPressed(p, 'right') ? 1 : 0) - (wasPressed(p, 'left') ? 1 : 0);
      const dy = (wasPressed(p, 'down') ? 1 : 0) - (wasPressed(p, 'up') ? 1 : 0);
      if (!dx && !dy) return;
      let c = G.sel[i] % COLS, r = Math.floor(G.sel[i] / COLS);
      c = (c + dx + COLS) % COLS; r = (r + dy + 3) % 3;
      G.sel[i] = r * COLS + c; sfx.move();
    };
    if (G.mode === 2) {
      if (!G.locked[0] && !G.locked[1] && wasPressed(0, 'back')) { go('menu'); return; }
      for (let p = 0; p < 2; p++) {
        if (!G.locked[p]) { move(p, p); if (confirm(p)) { G.locked[p] = true; sfx.select(); } }
        else if (cancel(p)) G.locked[p] = false;
      }
    } else {
      const i = G.locked[0] ? 1 : 0;
      if (!G.locked[i]) {
        move(i, 0);
        if (confirm(0)) { G.locked[i] = true; sfx.select(); }
        if (cancel(0)) { if (i === 1) G.locked[0] = false; else go('menu'); }
      }
    }
    if (G.locked[0] && G.locked[1]) { if (G.selDone === undefined) G.selDone = G.t; if (G.t - G.selDone > 30) { G.selDone = undefined; go('vs'); } }
    else G.selDone = undefined;
  }

  // ---------- disegno ----------
  function drawTitle(ctx) {
    ctx.drawImage(arenaCanvas(), 0, 0);
    ctx.fillStyle = 'rgba(16,8,24,0.55)'; ctx.fillRect(0, 0, W, H);
    text(ctx, 'WATCHOUT BRO', W / 2, 52, { size: 30, maxW: 360, align: 'center', color: '#f2c230', shadow: '#3a1020', weight: 700 });
    text(ctx, 'FIGHTERS', W / 2, 80, { size: 20, align: 'center', color: '#ff5a4a', shadow: '#3a1020', weight: 700 });
    ROSTER.forEach((ch, i) => {
      const img = ART[ch.id].base[i < 4 ? 'right' : i > 4 ? 'left' : 'right'];
      ctx.drawImage(img, 8 + i * 40, 128);
    });
    if (Math.floor(G.t / 30) % 2) text(ctx, isTouch() ? 'Tocca lo schermo' : 'Premi Invio o Pugno', W / 2, 112, { size: 9, align: 'center' });
  }

  function drawMenuList(ctx, items, idx, y0) {
    items.forEach((s, i) => {
      const on = i === idx;
      if (on) box(ctx, W / 2 - 100, y0 + i * 18 - 11, 200, 15, 'rgba(242,194,48,0.18)', '#f2c230');
      text(ctx, s, W / 2, y0 + i * 18, { size: 9, align: 'center', color: on ? '#f2c230' : '#e6d8f0' });
    });
  }

  function drawMenu(ctx) {
    ctx.drawImage(arenaCanvas(), 0, 0);
    ctx.fillStyle = 'rgba(16,8,24,0.7)'; ctx.fillRect(0, 0, W, H);
    text(ctx, 'WATCHOUT BRO FIGHTERS', W / 2, 40, { size: 18, maxW: 360, align: 'center', color: '#f2c230', weight: 700 });
    drawMenuList(ctx, MENU(), G.menuIdx, 82);
    if (G.menuIdx === 2) text(ctx, '◀ ▶ per cambiare', W / 2, 168, { size: 7, align: 'center', color: '#b8a8c8' });
    text(ctx, isTouch() ? 'Tocca una voce per sceglierla' : 'Su/Giù per scegliere · Pugno o Invio per confermare', W / 2, 200, { size: 7, align: 'center', color: '#b8a8c8' });
  }

  // Tabella di tutti i comandi con i tasti veri. La colonna del controller mostra i tasti
  // del controller collegato (PlayStation o Xbox), oppure entrambi se non ce n'è nessuno.
  function drawControls(ctx) {
    ctx.fillStyle = '#140c1e'; ctx.fillRect(0, 0, W, H);
    text(ctx, 'COMANDI', W / 2, 22, { size: 12, align: 'center', color: '#f2c230' });
    if (isTouch() && !padType(0)) return drawTouchControls(ctx);
    const pad = padType(0) || padType(1);
    const PB = { ps: ['□', '✕', 'R1'], xbox: ['X', 'A', 'RB'] };
    const [pp, pk, pb] = pad ? PB[pad] : ['□/X', '✕/A', 'R1/RB'];
    const padName = pad === 'ps' ? 'PlayStation' : pad === 'xbox' ? 'Xbox' : 'Controller';
    const rows = [
      ['', 'Giocatore 1', 'Giocatore 2', padName],
      ['Movimento', 'W A S D', '← → ↑ ↓', 'Croce/levetta'],
      ['Salto', 'W', '↑', '↑'],
      ['Pugno', 'F', 'K', pp],
      ['Calcio', 'G', 'L', pk],
      ['Parata', 'H', 'Ò', pb],
      ['Pugno basso', 'S + F', '↓ + K', `↓ + ${pp}`],
      ['Spazzata', 'S + G', '↓ + L', `↓ + ${pk}`],
      ['Calcio volante', 'W, F o G', '↑, K o L', `↑, ${pp} o ${pk}`],
      ['Parata bassa', 'S + H', '↓ + Ò', `↓ + ${pb}`],
      ['Pausa', 'Esc', '', 'Start'],
    ];
    const cols = [12, 112, 204, 296];
    rows.forEach((r, i) => r.forEach((c, j) => text(ctx, c, cols[j], 46 + i * 14, {
      size: i === 0 ? 5 : 7, color: i === 0 || j === 0 ? '#f2c230' : '#fff', maxW: j === 0 ? 98 : 88,
    })));
    text(ctx, 'La spazzata si para solo accovacciati, il calcio volante solo in piedi', W / 2, 198, { size: 5, align: 'center', color: '#d8c8e8' });
    text(ctx, 'Premi un tasto per tornare', W / 2, 209, { size: 5, align: 'center', color: '#b8a8c8' });
  }

  // Sul telefono: i comandi sullo schermo.
  function drawTouchControls(ctx) {
    const rows = [
      ['Movimento', 'Croce a sinistra (trascina il dito)'],
      ['Salto', '↑ sulla croce'],
      ['Pugno / Calcio', 'Tasti rosso e blu a destra'],
      ['Parata', 'Tasto grigio (↓ + Parata = parata bassa)'],
      ['Pugno basso', '↓ + Pugno'],
      ['Spazzata', '↓ + Calcio'],
      ['Mosse speciali', 'es. ↓ → + Pugno (→ verso l\'avversario)'],
      ['Super', 'Tasto SUPER, compare con la barra piena'],
      ['Pausa', 'Tasto II in alto a destra'],
    ];
    rows.forEach(([a, b], i) => {
      text(ctx, a, 20, 50 + i * 15, { size: 7, color: '#f2c230', maxW: 110 });
      text(ctx, b, 136, 50 + i * 15, { size: 6, maxW: W - 150 });
    });
    text(ctx, 'Nei menu tocca direttamente le voci · Tocca per tornare', W / 2, 205, { size: 5, align: 'center', color: '#b8a8c8' });
  }

  function drawPreview(ctx, i, x, flip, col, label) {
    const ch = ROSTER[G.sel[i]];
    const img = ART[ch.id].base[flip ? 'left' : 'right'];
    ctx.drawImage(img, x - 36, 50, 72, 96);
    box(ctx, x - 54, 148, 108, 60, 'rgba(20,12,30,0.85)', col);
    text(ctx, `${label}${G.locked[i] ? ' ✔' : ''}`, x, 24, { size: 8, align: 'center', color: col });
    text(ctx, ch.name, x, 160, { size: 7, align: 'center', maxW: 102 });
    text(ctx, ch.style, x, 170, { size: 5, align: 'center', color: '#d8c8e8', maxW: 102 });
    STAT_NAMES.forEach(([k, n], j) => {
      text(ctx, n, x - 49, 182 + j * 7, { size: 5, color: '#b8a8c8', shadow: null });
      for (let s = 0; s < 5; s++) { ctx.fillStyle = s < ch.stats[k] ? col : '#3a2c4a'; ctx.fillRect(x - 12 + s * 12, 177 + j * 7, 10, 4); }
    });
  }

  function drawSelect(ctx) {
    ctx.fillStyle = '#140c1e'; ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 8) { ctx.fillStyle = y % 16 ? '#181026' : '#1c1230'; ctx.fillRect(0, y, W, 8); }
    text(ctx, 'SCEGLI IL LOTTATORE', W / 2, 20, { size: 11, align: 'center', color: '#f2c230' });
    const gx = W / 2 - (COLS * TILE) / 2, gy = 50;
    ROSTER.forEach((ch, i) => {
      const x = gx + (i % COLS) * TILE, y = gy + Math.floor(i / COLS) * TILE;
      box(ctx, x + 1, y + 1, TILE - 2, TILE - 2, '#2a1c3a', '#4a3a5a');
      ctx.drawImage(ART[ch.id].portrait, x + 4, y + 4);
    });
    const c2 = G.mode === 1 ? CPUC : P2C;
    const cursor = (i, col) => {
      const x = gx + (G.sel[i] % COLS) * TILE, y = gy + Math.floor(G.sel[i] / COLS) * TILE;
      const blink = G.locked[i] || Math.floor(G.t / 8) % 2;
      if (!blink) return;
      ctx.fillStyle = col;
      const o = i ? 1 : 0;
      ctx.fillRect(x + o, y + o, TILE - o * 2, 2); ctx.fillRect(x + o, y + TILE - 2 - o, TILE - o * 2, 2);
      ctx.fillRect(x + o, y + o, 2, TILE - o * 2); ctx.fillRect(x + TILE - 2 - o, y + o, 2, TILE - o * 2);
    };
    const showSecond = G.mode === 2 || G.locked[0];
    cursor(0, P1C);
    if (showSecond) cursor(1, c2);
    drawPreview(ctx, 0, 64, false, P1C, 'G1');
    if (showSecond) drawPreview(ctx, 1, W - 64, true, c2, G.mode === 1 ? 'CPU' : 'G2');
    else { text(ctx, 'CPU', W - 64, 24, { size: 9, align: 'center', color: CPUC }); text(ctx, '?', W - 64, 110, { size: 40, align: 'center', color: '#3a2c4a', shadow: null }); }
    const hint = G.mode === 1 ? (G.locked[0] ? 'Ora scegli l\'avversario della CPU' : 'Scegli il tuo lottatore') : 'Ognuno sceglie con i suoi comandi';
    text(ctx, hint, W / 2, 168, { size: 7, align: 'center', color: '#d8c8e8', maxW: 148 });
    text(ctx, isTouch() ? 'Tocca due volte per confermare' : 'Pugno conferma · Calcio annulla', W / 2, 180, { size: 5, align: 'center', color: '#b8a8c8', maxW: 148 });
  }

  function drawVs(ctx) {
    ctx.fillStyle = '#140c1e'; ctx.fillRect(0, 0, W, H);
    const k = Math.min(1, G.t / 20);
    const a = ROSTER[G.sel[0]], b = ROSTER[G.sel[1]];
    ctx.fillStyle = '#3a1020'; ctx.fillRect(0, 0, W / 2, H);
    ctx.fillStyle = '#10203a'; ctx.fillRect(W / 2, 0, W / 2, H);
    ctx.drawImage(ART[a.id].base.right, -96 + k * 140, 40, 96, 128);
    ctx.drawImage(ART[b.id].base.left, W - k * 140, 40, 96, 128);
    text(ctx, a.name, 90, 186, { size: 12, align: 'center', color: P1C });
    text(ctx, b.name, W - 90, 186, { size: 12, align: 'center', color: G.mode === 1 ? CPUC : P2C });
    if (G.t > 20) text(ctx, 'VS', W / 2, 112, { size: 34, align: 'center', color: '#f2c230', shadow: '#000', weight: 700 });
  }

  function drawPause(ctx, title, items, idx) {
    G.fight.drawUi(ctx, { banner: false });
    ctx.fillStyle = 'rgba(10,6,16,0.7)'; ctx.fillRect(0, 0, W, H);
    text(ctx, title, W / 2, 70, { size: 16, align: 'center', color: '#f2c230' });
    drawMenuList(ctx, items, idx, 100);
  }

  // Elenco mosse del lottatore G1 o G2 della partita in corso. ◀ ▶ cambia lottatore.
  // Come si scrivono i comandi per ogni modo di giocare: tasti al posto di P, K e Parata,
  // e per il G1 anche le direzioni (WASD). Le direzioni valgono con il personaggio rivolto a destra.
  const SCHEMES = {
    kb1: { name: 'Tastiera G1', P: 'F', K: 'G', Parata: 'H', '↓': 'S', '→': 'D', '←': 'A', '↑': 'W' },
    kb2: { name: 'Tastiera G2', P: 'K', K: 'L', Parata: 'Ò' },
    touch: { name: 'Comandi touch', P: 'Pugno', K: 'Calcio', Parata: 'Parata' },
    xbox: { name: 'Controller Xbox', P: 'X', K: 'A', Parata: 'RB' },
    ps: { name: 'Controller PlayStation', P: '□', K: '✕', Parata: 'R1' },
    cpu: { name: 'CPU', P: 'P', K: 'K', Parata: 'Parata' },
  };
  const fmt = (cmd, sc) => cmd.split(' ').map(t => sc[t] ?? t).join(' ');
  function schemeFor(side) {
    if (G.fight.labels[side] === 'CPU') return SCHEMES.cpu;
    // in modalità 1 giocatore la CPU non usa controller: il primo controller è del G1
    const pad = padType(side);
    if (pad) return SCHEMES[pad];
    if (side === 0 && isTouch()) return SCHEMES.touch;
    return side === 0 ? SCHEMES.kb1 : SCHEMES.kb2;
  }
  function drawMoves(ctx) {
    G.fight.drawUi(ctx, { banner: false });
    ctx.fillStyle = 'rgba(10,6,16,0.95)'; ctx.fillRect(0, 0, W, H);
    const side = G.movesSide, f = G.fight.f[side], ch = f.ch, ms = MOVESETS[ch.id];
    const cpu = G.fight.labels[side] === 'CPU';
    const col = side === 0 ? P1C : cpu ? CPUC : P2C;
    ctx.drawImage(ART[ch.id].portrait, 12, 6);
    text(ctx, ch.name, 46, 18, { size: 9, color: col, maxW: 200 });
    text(ctx, `${G.fight.labels[side]} · ${ch.style}`, 46, 30, { size: 5, color: '#d8c8e8', maxW: 200 });
    text(ctx, '◀ ▶ cambia lottatore', W - 12, 18, { size: 5, align: 'right', color: '#b8a8c8' });
    ctx.fillStyle = '#4a3a5a'; ctx.fillRect(12, 37, W - 24, 1);

    const CX = 214;
    const sc = schemeFor(side);
    const row = (y, name, cmd, color = '#fff') => {
      text(ctx, name, 16, y, { size: 7, color, maxW: CX - 22 });
      text(ctx, fmt(cmd, sc), CX, y, { size: 7, color: '#f2c230', maxW: W - CX - 14 });
    };
    let y = 50;
    text(ctx, 'MOSSE BASE', 12, y, { size: 7, color: col }); y += 11;
    for (const [n, c] of BASE_MOVES) { row(y, n, c); y += 9; }
    if (ch.doubleJump) { row(y, 'Doppio salto', '↑ in aria'); y += 9; }
    y += 5;
    text(ctx, 'MOSSE SPECIALI', 12, y, { size: 7, color: col });
    text(ctx, 'Super: con la barra piena', W - 12, y, { size: 5, align: 'right', color: '#7fe8ff' }); y += 11;
    for (const [n, c] of ms.specials) { row(y, n, c, '#fff'); y += 9; }
    row(y, `Super: ${ms.super}`, 'P + K', '#7fe8ff'); y += 11;
    if (ms.passive && !ch.doubleJump) text(ctx, `Abilità passiva · ${ms.passive[0]}: ${ms.passive[1]}`, 12, y, { size: 5, color: '#a898b8' });

    const legend = sc === SCHEMES.cpu ? 'P = pugno · K = calcio · direzioni con il lottatore rivolto a destra'
      : `${sc.name} · direzioni con il lottatore rivolto a destra`;
    text(ctx, legend, W / 2, 196, { size: 5, align: 'center', color: '#b8a8c8' });
    text(ctx, 'La barra super si carica colpendo e venendo colpiti · Pugno o Calcio per tornare', W / 2, 207, { size: 5, align: 'center', color: '#8a7a9a' });
  }

  function draw(ctx) {
    switch (G.scene) {
      case 'title': return drawTitle(ctx);
      case 'menu': return drawMenu(ctx);
      case 'controls': return drawControls(ctx);
      case 'select': return drawSelect(ctx);
      case 'vs': return drawVs(ctx);
      case 'fight': return G.fight.drawUi(ctx);
      case 'pause': return drawPause(ctx, 'PAUSA', ['Riprendi', 'Mosse dei lottatori', 'Cambia lottatori', 'Menu principale'], G.pauseIdx);
      case 'moves': return drawMoves(ctx);
      case 'end': return drawPause(ctx, `${G.fight.f[G.fight.champ].ch.name} vince!`, ['Rivincita', 'Cambia lottatori', 'Menu principale'], G.endIdx);
    }
  }

  // Con queste schermate sotto i menu si vede il combattimento disegnato da Phaser.
  const worldVisible = () => ['fight', 'pause', 'moves', 'end'].includes(G.scene);

  return { update, draw, G, worldVisible, debug: { cpuCtrl } };
}
