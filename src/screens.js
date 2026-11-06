// Schermate: titolo, menu, comandi, selezione personaggi, presentazione, combattimento e pausa.
// Tutto quello che è testo e menu si disegna qui su un canvas; arena e lottatori li disegna Phaser (game/view.js).
import { W, H } from './config.js';
import { ROSTER } from './data/roster.js';
import { MOVESETS, BASE_MOVES } from './data/movesets.js';
import { ART } from './sprites/index.js';
import { wasPressed, anyPressed, confirm as pressConfirm, cancel, padType, takeTap, isTouch, isHeld } from './input.js';
import { NetSession, packInput, unpackInput, makeRng, fightHash, shareLink, cleanCode } from './net.js';
import { humanCtrl, cpuCtrl, LEVELS } from './game/controllers.js';
import { Fight } from './game/fight.js';
import { arenaCanvas } from './game/arena.js';
import { text, box, P1C, P2C, CPUC } from './ui.js';
import { sfx, music } from './audio.js';

const STAT_NAMES = [['vita', 'Vita'], ['forza', 'Forza'], ['velocita', 'Velocità'], ['salto', 'Salto']];
const COLS = 4, TILE = 36; // griglia di selezione 4 x 3 (12 lottatori)

export function createScenes() {
  const G = {
    scene: 'title', t: 0, mode: 1, level: 1, menuIdx: 0,
    sel: [0, 1], locked: [false, false], fight: null, pauseIdx: 0, endIdx: 0, movesSide: 0,
    // online (mode 3): sessione, voce del menu online, messaggio, codice da un link condiviso
    net: null, netPause: [false, false], onlineIdx: 0, netMsg: '', netEvents: [], autoJoin: null, rematch: [false, false], copied: 0,
  };
  // aperto da un link condiviso (…#BRO-K7PQ): si entra direttamente nella stanza dell'amico
  {
    const m = /BRO-?([A-Z0-9]{4})/i.exec(location.hash || '');
    if (m) { G.autoJoin = m[1].toUpperCase(); try { history.replaceState(null, '', location.pathname + location.search); } catch { /* ok */ } }
  }
  const go = s => { G.scene = s; G.t = 0; };
  const vertical = () => (anyPressed('down') ? 1 : 0) - (anyPressed('up') ? 1 : 0);
  const horizontal = () => (anyPressed('right') ? 1 : 0) - (anyPressed('left') ? 1 : 0);

  function startFight() {
    const c1 = ROSTER[G.sel[0]], c2 = ROSTER[G.sel[1]];
    if (G.mode === 3) {
      // online: i tasti di entrambi arrivano dal lockstep (G.netIn), stesso seme sui due dispositivi
      const netCtrl = side => ({ read: () => G.netIn[side] });
      const me = G.net.mySide;
      G.fight = new Fight(c1, c2, netCtrl(0), netCtrl(1), me === 0 ? ['TU', 'AMICO'] : ['AMICO', 'TU'], { rng: makeRng(G.seed) });
      G.netHashes = new Map(); G.desync = false; G.netPause = [false, false]; G.netIn = [unpackInput(0), unpackInput(0)];
      G.rematch = [false, false];
      go('fight');
      return;
    }
    const ctrl2 = G.mode === 1 ? cpuCtrl(G.level) : humanCtrl(1);
    G.fight = new Fight(c1, c2, humanCtrl(0), ctrl2, ['G1', G.mode === 1 ? 'CPU' : 'G2']);
    go('fight');
  }

  // ---------- online ----------
  const ONLINE_MENU = ['Crea una stanza', 'Entra con un codice', 'Indietro'];
  const PAUSE_ITEMS = () => G.mode === 3 ? ['Riprendi', 'Mosse dei lottatori', 'Esci dalla partita'] : ['Riprendi', 'Mosse dei lottatori', 'Cambia lottatori', 'Menu principale'];
  const END_ITEMS = () => G.mode === 3 ? ['Rivincita', 'Cambia lottatori', 'Esci dalla partita'] : ['Rivincita', 'Cambia lottatori', 'Menu principale'];

  function newSession() {
    if (G.net) G.net.close();
    const n = new NetSession();
    n.onMessage = m => G.netEvents.push(m);
    n.onClose = why => G.netEvents.push({ t: 'closed', why });
    G.net = n; G.netEvents = [];
    return n;
  }
  function leaveOnline(msg) {
    if (G.net) { G.net.send({ t: 'quit' }); const n = G.net; setTimeout(() => n.close(), 200); }
    G.net = null; G.mode = 1; G.netPause = [false, false]; hideCodeInput();
    if (msg) { G.netMsg = msg; go('netmsg'); } else go('menu');
  }
  function startHost() { newSession().host_(); go('netwait'); }
  function startJoin(code) {
    code = cleanCode(code);
    if (code.length !== 4) { G.netMsg = 'Il codice è di 4 caratteri'; return; }
    hideCodeInput();
    G.joinCode = code; newSession().join(code); go('netconnect');
  }
  // quando i due sono collegati: tutti e due alla scelta dei lottatori
  function onConnected() {
    G.mode = 3; G.locked = [false, false]; G.sel = [0, 1]; G.rematch = [false, false];
    go('select');
  }
  // Il G1 (host) decide quando si parte e con quale seme.
  function hostStart() {
    if (!G.net.host) return;
    const seed = (Math.random() * 2 ** 32) >>> 0;
    // ritardo dei tasti scelto in base al ping misurato finora (uguale per tutti e due)
    const delay = G.net.suggestDelay();
    G.net.send({ t: 'start', sel: G.sel, seed, delay });
    // il lockstep riparte qui (e dall'altra parte quando arriva 'start'), prima del combattimento
    G.net.resetLockstep(delay);
    G.seed = seed; go('vs');
    // l'altro riceve il via con mezzo ping di ritardo: parto un po' dopo anch'io, così si inizia insieme
    G.t = -Math.round(G.net.rtt / 2 / 16.7);
  }
  function shareRoom() {
    const url = shareLink(G.net.code);
    const done = () => { G.copied = G.t || 1; };
    if (navigator.share && isTouch()) navigator.share({ title: 'WatchOut Bro Fighters', text: `Sfidami! Codice stanza BRO-${G.net.code}`, url }).then(done).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(done).catch(() => {});
  }

  // Messaggi arrivati dall'altro giocatore (o dalla rete), gestiti al passo di gioco.
  function handleNetEvents() {
    const n = G.net;
    if (!n) return;
    while (G.netEvents.length) {
      const m = G.netEvents.shift();
      switch (m.t) {
        case 'closed': return leaveOnline(m.why);
        case 'quit': return leaveOnline('L\'avversario è uscito dalla partita');
        case 'hello': break;
        case 'pause': G.netPause[1 - n.mySide] = !!m.on; if (m.on) sfx.move(); break;
        case 'sel': {
          const o = 1 - n.mySide;
          G.sel[o] = m.sel; G.locked[o] = m.locked;
          if (n.host && G.scene === 'select' && G.locked[0] && G.locked[1]) G.selDone = G.t;
          break;
        }
        case 'start': G.sel = m.sel; G.seed = m.seed; n.resetLockstep(m.delay || 4); go('vs'); break;
        case 'reselect': G.locked = [false, false]; go('select'); break;
        case 'rematch':
          G.rematch[1 - n.mySide] = true;
          if (n.host && G.rematch[0] && G.rematch[1]) hostStart();
          break;
        case 'hash': {
          const mine = G.netHashes && G.netHashes.get(m.f);
          if (mine !== undefined && mine !== m.h) G.desync = true;
          else if (G.netHashes) G.netHashes.set('r' + m.f, m.h);
          break;
        }
      }
    }
  }

  // Pausa online: chi la mette ferma la partita a tutti e due (si riparte quando nessuno è in pausa).
  function setMyPause(on) {
    const me = G.net.mySide;
    if (G.netPause[me] === on) return;
    G.netPause[me] = on;
    G.net.send({ t: 'pause', on });
  }
  const netPaused = () => G.netPause[0] || G.netPause[1];

  // Un passo del combattimento online: spedisce i miei tasti e calcola i fotogrammi pronti.
  function netFightStep(acceptInput) {
    const n = G.net, f = G.fight;
    if (f.phase === 'match') return;
    if (netPaused()) { G.netStall = 0; G.netLag = false; return; } // tutto fermo finché qualcuno è in pausa
    const held = {}, pressed = {};
    for (const a of ['left', 'right', 'up', 'down', 'punch', 'kick', 'block']) {
      held[a] = acceptInput && (isHeld(0, a) || isHeld(1, a));
      pressed[a] = acceptInput && (wasPressed(0, a) || wasPressed(1, a));
    }
    n.pushLocal(packInput(held, pressed));
    // al massimo 2 fotogrammi per giro: se si è rimasti indietro si recupera senza salti bruschi
    let stepped = 0;
    for (let steps = 0; steps < 2; steps++) {
      // si calcola solo fino al "mio" tempo (gen - ritardo): il margine per la rete non si consuma mai
      if (n.next >= n.gen - n.delay) break;
      const ins = n.ready();
      if (!ins) break;
      G.netIn = ins.map(unpackInput);
      f.update();
      n.advance(); stepped++;
      if (n.next % 120 === 0) {
        const h = fightHash(f);
        const r = G.netHashes.get('r' + n.next);
        if (r !== undefined && r !== h) G.desync = true;
        G.netHashes.set(n.next, h);
        n.send({ t: 'hash', f: n.next, h });
      }
      if (f.phase === 'match') break;
    }
    // l'avviso compare solo se si aspetta davvero (più di un quarto di secondo)
    G.netStall = stepped ? 0 : (G.netStall || 0) + 1;
    G.netLag = G.netStall > 15;
  }

  // Campo di testo per il codice (tastiera vera o quella del telefono).
  let codeBox = null;
  function showCodeInput() {
    if (codeBox) return;
    codeBox = document.createElement('div');
    codeBox.className = 'net-code';
    codeBox.innerHTML = '<input maxlength="8" placeholder="CODICE" autocomplete="off" autocapitalize="characters" spellcheck="false" /><button>Entra</button>';
    document.body.appendChild(codeBox);
    const inp = codeBox.querySelector('input');
    const go2 = () => startJoin(inp.value);
    codeBox.querySelector('button').addEventListener('click', go2);
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') go2();
      if (e.key === 'Escape') { hideCodeInput(); go('online'); }
      e.stopPropagation();
    });
    inp.addEventListener('input', () => { inp.value = inp.value.toUpperCase(); G.netMsg = ''; });
    setTimeout(() => inp.focus(), 50);
  }
  function hideCodeInput() { if (codeBox) { codeBox.remove(); codeBox = null; } }

  const MENU = () => [
    '1 giocatore contro la CPU',
    '2 giocatori',
    'Online con un amico',
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
        const i = tapItem(tap, 5, 78);
        if (i >= 0) { G.menuIdx = i; tapOk = true; } // sulla difficoltà: la cambia
        break;
      }
      case 'pause': { const i = tapItem(tap, PAUSE_ITEMS().length, 100); if (i >= 0) { G.pauseIdx = i; tapOk = true; } break; }
      case 'end': { const i = tapItem(tap, END_ITEMS().length, 100); if (i >= 0) { G.endIdx = i; tapOk = true; } break; }
      case 'online': { const i = tapItem(tap, 3, 92); if (i >= 0) { G.onlineIdx = i; tapOk = true; } break; }
      case 'netwait': if (tap.y > 60 && tap.y < 130) tapOk = true; break;
      case 'netmsg': tapOk = true; break;
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
        const i = G.mode === 3 ? G.net.mySide : G.mode === 2 ? 0 : (G.locked[0] ? 1 : 0);
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
    if (G.net) { G.net.keepAlive(); handleNetEvents(); }
    if (G.autoJoin && G.scene === 'title') { const c = G.autoJoin; G.autoJoin = null; startJoin(c); }
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
        if (v) { G.menuIdx = (G.menuIdx + v + 5) % 5; sfx.move(); }
        const h = horizontal();
        if (G.menuIdx === 3 && h) { G.level = (G.level + h + 3) % 3; sfx.move(); }
        if (confirm()) {
          sfx.select();
          if (G.menuIdx === 0 || G.menuIdx === 1) {
            G.mode = G.menuIdx === 0 ? 1 : 2; G.locked = [false, false];
            go('select');
          } else if (G.menuIdx === 2) { G.onlineIdx = 0; go('online'); }
          else if (G.menuIdx === 3) G.level = (G.level + 1) % 3;
          else go('controls');
        }
        if (cancel()) go('title');
        break;
      }
      case 'controls':
        if (confirm() || cancel()) go('menu');
        break;
      case 'online': {
        const v = vertical();
        if (v) { G.onlineIdx = (G.onlineIdx + v + 3) % 3; sfx.move(); }
        if (confirm()) {
          sfx.select();
          if (G.onlineIdx === 0) startHost();
          else if (G.onlineIdx === 1) { G.netMsg = ''; go('netjoin'); showCodeInput(); }
          else go('menu');
        } else if (cancel()) go('menu');
        break;
      }
      case 'netwait':
        if (G.net && G.net.status === 'connected') { sfx.select(); onConnected(); break; }
        if (G.t > 10 && confirm() && G.net && G.net.code && G.net.status === 'waiting') shareRoom();
        if (G.t > 10 && cancel()) leaveOnline();
        break;
      case 'netjoin':
        if (!codeBox) showCodeInput();
        if (G.t > 10 && (anyPressed('back') || wasPressed(0, 'kick') && document.activeElement?.tagName !== 'INPUT')) { hideCodeInput(); go('online'); }
        break;
      case 'netconnect':
        if (G.net && G.net.status === 'connected') { sfx.select(); onConnected(); break; }
        if (G.t > 10 && cancel()) leaveOnline();
        break;
      case 'netmsg':
        if (G.t > 20 && (confirm() || cancel())) go('online');
        break;
      case 'select':
        updateSelect();
        break;
      case 'vs':
        if (G.t > 110 || (G.mode !== 3 && G.t > 20 && confirm())) startFight();
        break;
      case 'fight': {
        const f = G.fight;
        if (G.mode === 3) {
          if (G.desync) { G.desync = false; return leaveOnline('I due giochi si sono desincronizzati. Riprovate!'); }
          if (f.phase !== 'match' && (anyPressed('back') || anyPressed('start'))) { G.pauseIdx = 0; setMyPause(true); go('pause'); sfx.move(); break; }
          if (f.phase !== 'match') { netFightStep(true); break; }
        }
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
        // online la partita non si ferma: il menu sta sopra e intanto il tuo lottatore resta fermo
        const resume = () => { G.scene = 'fight'; if (G.mode === 3) setMyPause(false); };
        const n = PAUSE_ITEMS().length;
        const v = vertical();
        if (v) { G.pauseIdx = (G.pauseIdx + v + n) % n; sfx.move(); }
        if (anyPressed('back')) { resume(); break; }
        if (confirm()) {
          sfx.select();
          if (G.pauseIdx === 0) resume();
          else if (G.pauseIdx === 1) { G.movesSide = 0; go('moves'); }
          else if (G.mode === 3) leaveOnline();
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
        if (confirm() && G.mode === 3) {
          sfx.select();
          const me = G.net.mySide;
          if (G.endIdx === 0 && !G.rematch[me]) {
            G.rematch[me] = true; G.net.send({ t: 'rematch' });
            if (G.net.host && G.rematch[0] && G.rematch[1]) hostStart();
          } else if (G.endIdx === 1) { G.net.send({ t: 'reselect' }); G.locked = [false, false]; go('select'); }
          else if (G.endIdx === 2) leaveOnline();
        } else if (confirm()) {
          sfx.select();
          if (G.endIdx === 0) go('vs');
          else if (G.endIdx === 1) { G.locked = [false, false]; go('select'); }
          else go('menu');
        }
        break;
      }
    }
  }

  // Online: ognuno sceglie il suo lottatore con i suoi comandi; l'host fa partire quando sono pronti tutti e due.
  function updateOnlineSelect() {
    const me = G.net.mySide;
    const before = [G.sel[me], G.locked[me]];
    if (!G.locked[me]) {
      const dx = (anyPressed('right') ? 1 : 0) - (anyPressed('left') ? 1 : 0);
      const dy = (anyPressed('down') ? 1 : 0) - (anyPressed('up') ? 1 : 0);
      if (dx || dy) {
        let c = G.sel[me] % COLS, r = Math.floor(G.sel[me] / COLS);
        c = (c + dx + COLS) % COLS; r = (r + dy + 3) % 3;
        G.sel[me] = r * COLS + c; sfx.move();
      }
      if (confirm()) { G.locked[me] = true; sfx.select(); }
      else if (G.t > 10 && anyPressed('back')) return leaveOnline();
    } else if (cancel()) G.locked[me] = false;
    if (before[0] !== G.sel[me] || before[1] !== G.locked[me]) G.net.send({ t: 'sel', sel: G.sel[me], locked: G.locked[me] });
    if (G.net.host && G.locked[0] && G.locked[1]) {
      if (G.selDone === undefined) G.selDone = G.t;
      if (G.t - G.selDone > 30) { G.selDone = undefined; hostStart(); }
    } else G.selDone = undefined;
  }

  // In modalità 1 giocatore il G1 sceglie prima sé stesso e poi l'avversario della CPU.
  function updateSelect() {
    if (G.mode === 3) return updateOnlineSelect();
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
    // tutti i lottatori in fila, la prima metà guarda a destra e la seconda a sinistra
    const n = ROSTER.length, step = (W - 56) / (n - 1);
    ROSTER.forEach((ch, i) => {
      const img = ART[ch.id].base[i < n / 2 ? 'right' : 'left'];
      ctx.drawImage(img, Math.round(4 + i * step), 128 + (i % 2 ? 4 : 0));
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
    drawMenuList(ctx, MENU(), G.menuIdx, 78);
    if (G.menuIdx === 3) text(ctx, '◀ ▶ per cambiare', W / 2, 176, { size: 7, align: 'center', color: '#b8a8c8' });
    text(ctx, isTouch() ? 'Tocca una voce per sceglierla' : 'Su/Giù per scegliere · Pugno o Invio per confermare', W / 2, 200, { size: 7, align: 'center', color: '#b8a8c8' });
  }

  // Tabella di tutti i comandi con i tasti veri. La colonna del controller mostra i tasti
  // del controller collegato (PlayStation o Xbox), oppure entrambi se non ce n'è nessuno.
  function drawControls(ctx) {
    ctx.fillStyle = '#140c1e'; ctx.fillRect(0, 0, W, H);
    text(ctx, 'COMANDI', W / 2, 22, { size: 12, align: 'center', color: '#f2c230' });
    if (isTouch() && !padType(0)) return drawTouchControls(ctx);
    // solo tasti veri: le colonne della tastiera, più una per ogni controller collegato (con i suoi simboli)
    const PADS = {
      ps: { name: 'PlayStation', P: '□', K: '✕', B: 'R1', start: 'Options' },
      xbox: { name: 'Xbox', P: 'X', K: 'A', B: 'RB', start: 'Menu' },
    };
    const cols = [
      { name: 'Tastiera G1', mv: 'W A S D', up: 'W', dn: 'S', P: 'F', K: 'G', B: 'H', start: 'Esc' },
      { name: 'Tastiera G2', mv: '← → ↑ ↓', up: '↑', dn: '↓', P: 'K', K: 'L', B: 'Ò', start: 'Esc' },
    ];
    [padType(0), padType(1)].forEach((t, i) => {
      if (t) cols.push({ ...PADS[t], name: `${PADS[t].name} G${i + 1}`, mv: '← → ↑ ↓', up: '↑', dn: '↓' });
    });
    const rows = [
      ['Movimento', c => c.mv],
      ['Salto', c => c.up],
      ['Pugno', c => c.P],
      ['Calcio', c => c.K],
      ['Parata', c => c.B],
      ['Pugno basso', c => `${c.dn} + ${c.P}`],
      ['Spazzata', c => `${c.dn} + ${c.K}`],
      ['Calcio volante', c => `${c.up}, ${c.P} o ${c.K}`],
      ['Parata bassa', c => `${c.dn} + ${c.B}`],
      ['Super', c => `${c.P} + ${c.K}`],
      ['Pausa', c => c.start],
    ];
    const x0 = 12, labelW = 100, cw = (W - x0 - labelW - 8) / cols.length;
    cols.forEach((c, j) => text(ctx, c.name, x0 + labelW + j * cw, 44, { size: 5, color: '#f2c230', maxW: cw - 6 }));
    rows.forEach(([name, get], i) => {
      const y = 58 + i * 13;
      text(ctx, name, x0, y, { size: 7, color: '#f2c230', maxW: labelW - 6 });
      cols.forEach((c, j) => text(ctx, get(c), x0 + labelW + j * cw, y, { size: 7, maxW: cw - 6 }));
    });
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
    const online = G.mode === 3, me = online ? G.net.mySide : 0;
    const cursor = (i, col) => {
      const x = gx + (G.sel[i] % COLS) * TILE, y = gy + Math.floor(G.sel[i] / COLS) * TILE;
      const blink = G.locked[i] || Math.floor(G.t / 8) % 2;
      if (!blink) return;
      ctx.fillStyle = col;
      const o = i ? 1 : 0;
      ctx.fillRect(x + o, y + o, TILE - o * 2, 2); ctx.fillRect(x + o, y + TILE - 2 - o, TILE - o * 2, 2);
      ctx.fillRect(x + o, y + o, 2, TILE - o * 2); ctx.fillRect(x + TILE - 2 - o, y + o, 2, TILE - o * 2);
    };
    const showSecond = G.mode >= 2 || G.locked[0];
    cursor(0, P1C);
    if (showSecond) cursor(1, c2);
    const lab = i => online ? (i === me ? 'TU' : 'AMICO') : i === 0 ? 'G1' : G.mode === 1 ? 'CPU' : 'G2';
    drawPreview(ctx, 0, 64, false, P1C, lab(0));
    if (showSecond) drawPreview(ctx, 1, W - 64, true, c2, lab(1));
    else { text(ctx, 'CPU', W - 64, 24, { size: 9, align: 'center', color: CPUC }); text(ctx, '?', W - 64, 110, { size: 40, align: 'center', color: '#3a2c4a', shadow: null }); }
    const hint = online ? (G.locked[me] ? (G.locked[1 - me] ? 'Si parte!' : 'Aspetta che l\'amico scelga') : 'Scegli il tuo lottatore') : G.mode === 1 ? (G.locked[0] ? 'Ora scegli l\'avversario della CPU' : 'Scegli il tuo lottatore') : 'Ognuno sceglie con i suoi comandi';
    text(ctx, hint, W / 2, 168, { size: 7, align: 'center', color: '#d8c8e8', maxW: 148 });
    text(ctx, isTouch() ? 'Tocca due volte per confermare' : 'Pugno conferma · Calcio annulla', W / 2, 180, { size: 5, align: 'center', color: '#b8a8c8', maxW: 148 });
  }

  function drawVs(ctx) {
    ctx.fillStyle = '#140c1e'; ctx.fillRect(0, 0, W, H);
    const k = Math.max(0, Math.min(1, G.t / 20));
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
    // CPU, amico online o tu: si mostrano sempre i tasti veri di chi sta guardando (G1)
    if (G.fight.labels[side] === 'CPU' || G.mode === 3) side = 0;
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
    text(ctx, 'MOSSE SPECIALI', 12, y, { size: 7, color: col }); y += 11;
    for (const [n, c] of ms.specials) { row(y, n, c, '#fff'); y += 9; }
    row(y, `Super: ${ms.super}`, 'P + K', '#7fe8ff'); y += 11;
    if (ms.passive && !ch.doubleJump) text(ctx, `Abilità passiva · ${ms.passive[0]}: ${ms.passive[1]}`, 12, y, { size: 5, color: '#a898b8' });

    text(ctx, isTouch() ? 'Tocca per tornare' : 'Pugno o Calcio per tornare', W / 2, 207, { size: 5, align: 'center', color: '#8a7a9a' });
  }

  function onlineBg(ctx, title) {
    ctx.drawImage(arenaCanvas(), 0, 0);
    ctx.fillStyle = 'rgba(16,8,24,0.78)'; ctx.fillRect(0, 0, W, H);
    text(ctx, title, W / 2, 40, { size: 16, align: 'center', color: '#f2c230', weight: 700, maxW: 360 });
  }
  function drawOnline(ctx) {
    onlineBg(ctx, 'ONLINE');
    text(ctx, 'Gioca con un amico, ognuno dal suo dispositivo', W / 2, 62, { size: 6, align: 'center', color: '#d8c8e8' });
    drawMenuList(ctx, ONLINE_MENU, G.onlineIdx, 92);
    text(ctx, 'Chi crea la stanza manda il codice (o il link) all\'altro', W / 2, 168, { size: 5, align: 'center', color: '#b8a8c8' });
  }
  function drawNetWait(ctx) {
    onlineBg(ctx, 'STANZA');
    const n = G.net;
    if (!n || !n.code || n.status === 'connecting') {
      text(ctx, 'Creo la stanza...', W / 2, 100, { size: 9, align: 'center' });
    } else {
      text(ctx, 'Codice della stanza', W / 2, 66, { size: 6, align: 'center', color: '#d8c8e8' });
      box(ctx, W / 2 - 80, 74, 160, 34, 'rgba(242,194,48,0.15)', '#f2c230');
      text(ctx, `BRO-${n.code}`, W / 2, 98, { size: 18, align: 'center', color: '#f2c230' });
      const copied = G.copied && G.t - G.copied < 120;
      text(ctx, copied ? 'Link copiato! Mandalo all\'amico' : (isTouch() ? 'Tocca il codice per condividere il link' : 'Pugno o Invio: copia il link da mandare'), W / 2, 124, { size: 6, align: 'center', color: copied ? '#7fe8ff' : '#e6d8f0' });
      const dots = '.'.repeat(1 + Math.floor(G.t / 20) % 3);
      text(ctx, `In attesa dell'amico${dots}`, W / 2, 150, { size: 8, align: 'center' });
    }
    text(ctx, 'Calcio o Esc per annullare', W / 2, 200, { size: 5, align: 'center', color: '#b8a8c8' });
  }
  function drawNetJoin(ctx) {
    onlineBg(ctx, 'ENTRA');
    text(ctx, 'Scrivi il codice che ti ha mandato l\'amico', W / 2, 66, { size: 6, align: 'center', color: '#d8c8e8' });
    if (G.netMsg) text(ctx, G.netMsg, W / 2, 150, { size: 6, align: 'center', color: '#ff7a6a' });
    text(ctx, 'Oppure apri direttamente il link che ti ha mandato', W / 2, 176, { size: 5, align: 'center', color: '#b8a8c8' });
    text(ctx, 'Esc per tornare indietro', W / 2, 200, { size: 5, align: 'center', color: '#b8a8c8' });
  }
  function drawNetMsg(ctx, title, lines, foot) {
    onlineBg(ctx, title);
    lines.forEach((l, i) => text(ctx, l, W / 2, 96 + i * 14, { size: 8, align: 'center', maxW: 340 }));
    if (G.scene === 'netconnect') { const dots = '.'.repeat(1 + Math.floor(G.t / 20) % 3); text(ctx, dots, W / 2, 120, { size: 8, align: 'center' }); }
    text(ctx, foot, W / 2, 200, { size: 5, align: 'center', color: '#b8a8c8' });
  }

  function draw(ctx) {
    if (G.mode === 3 && G.netLag && ['fight', 'pause'].includes(G.scene) && G.fight && G.fight.phase !== 'match') {
      // disegnato dopo: avviso di rete lenta
      const r = drawScene(ctx);
      text(ctx, 'Aspetto l\'avversario...', W / 2, 206, { size: 6, align: 'center', color: '#ff7a6a' });
      return r;
    }
    const r = drawScene(ctx);
    // online: l'amico ha messo in pausa
    if (G.mode === 3 && G.net && G.scene === 'fight' && G.netPause[1 - G.net.mySide]) {
      ctx.fillStyle = 'rgba(10,6,16,0.7)'; ctx.fillRect(0, 0, W, H);
      text(ctx, 'PAUSA', W / 2, 96, { size: 16, align: 'center', color: '#f2c230', weight: 700 });
      text(ctx, 'L\'amico ha messo in pausa', W / 2, 118, { size: 8, align: 'center' });
      text(ctx, 'Si riparte quando riprende', W / 2, 134, { size: 6, align: 'center', color: '#b8a8c8' });
      return r;
    }
    // online: ping e ritardo dei tasti, piccoli in basso
    if (G.mode === 3 && G.net && G.scene === 'fight' && G.fight && G.fight.phase !== 'match') {
      text(ctx, `ping ${Math.round(G.net.rtt)} ms · ritardo ${G.net.delay}`, W / 2, 212, { size: 5, align: 'center', color: '#8a7a9a', shadow: null });
    }
    return r;
  }

  function drawScene(ctx) {
    switch (G.scene) {
      case 'title': return drawTitle(ctx);
      case 'menu': return drawMenu(ctx);
      case 'controls': return drawControls(ctx);
      case 'select': return drawSelect(ctx);
      case 'vs': return drawVs(ctx);
      case 'fight': return G.fight.drawUi(ctx);
      case 'pause': return drawPause(ctx, 'PAUSA', PAUSE_ITEMS(), G.pauseIdx);
      case 'online': return drawOnline(ctx);
      case 'netwait': return drawNetWait(ctx);
      case 'netjoin': return drawNetJoin(ctx);
      case 'netconnect': return drawNetMsg(ctx, 'COLLEGAMENTO', [`Mi collego alla stanza BRO-${G.joinCode}...`], 'Calcio per annullare');
      case 'netmsg': return drawNetMsg(ctx, 'ONLINE', [G.netMsg], 'Premi un tasto per continuare');
      case 'moves': return drawMoves(ctx);
      case 'end': {
        drawPause(ctx, `${G.fight.f[G.fight.champ].ch.name} vince!`, END_ITEMS(), G.endIdx);
        if (G.mode === 3 && G.rematch.some(Boolean)) {
          const me = G.net.mySide;
          text(ctx, G.rematch[me] ? 'Rivincita chiesta: aspetto l\'amico...' : 'L\'amico vuole la rivincita!', W / 2, 168, { size: 7, align: 'center', color: '#7fe8ff' });
        }
        return;
      }
    }
  }

  // Con queste schermate sotto i menu si vede il combattimento disegnato da Phaser.
  const worldVisible = () => ['fight', 'pause', 'moves', 'end'].includes(G.scene);

  return { update, draw, G, worldVisible, debug: { cpuCtrl } };
}
