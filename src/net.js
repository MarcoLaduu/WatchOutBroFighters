// Gioco online tra due amici, collegati direttamente (WebRTC con PeerJS).
// Chi crea la stanza è il G1 ("host"), chi entra con il codice è il G2.
// Durante il combattimento i due si scambiano solo i tasti premuti: ogni fotogramma si calcola
// quando si hanno i tasti di entrambi ("lockstep"), con un piccolo ritardo che assorbe la rete.
// Il server gratuito di PeerJS serve solo a presentare i due giocatori all'inizio.

const PREFIX = 'wobf-';                          // per non scontrarsi con altri siti che usano PeerJS
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // niente 0/O e 1/I, che si confondono
export const DELAY = 4;                          // ritardo di partenza dei tasti in fotogrammi (~67 ms); poi si adatta al ping
const ACTS = ['left', 'right', 'up', 'down', 'punch', 'kick', 'block'];

import { TURN } from './turn.js';

let Peer = null;

// Server per attraversare le reti: STUN di Google (gratis) e, se configurato, il TURN di Metered (turn.js).
let iceCache = null;
async function iceServers() {
  if (iceCache) return iceCache;
  const list = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
  if (TURN.username && TURN.credential) {
    // credenziali fisse dalla dashboard di Metered
    list.push({ urls: TURN.urls, username: TURN.username, credential: TURN.credential });
  } else if (TURN.app && TURN.apiKey) {
    try {
      const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch(`https://${TURN.app}.metered.live/api/v1/turn/credentials?apiKey=${encodeURIComponent(TURN.apiKey)}`, { signal: ctrl.signal });
      clearTimeout(tm);
      if (r.ok) { const turn = await r.json(); if (Array.isArray(turn)) list.push(...turn); }
    } catch { /* senza TURN si prova lo stesso col collegamento diretto */ }
  } else {
    // server TURN pubblici di PeerJS (gratuiti ma non sempre affidabili)
    list.push({ urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' });
  }
  iceCache = list;
  return list;
}
export const hasTurn = () => !!((TURN.username && TURN.credential) || (TURN.app && TURN.apiKey));
async function loadPeer() {
  if (Peer) return Peer;
  if (window.__MockPeer) return (Peer = window.__MockPeer); // solo per i test
  const m = await import('peerjs');
  Peer = m.Peer || m.default;
  return Peer;
}

export const randomCode = () => Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
export const cleanCode = s => (s || '').toUpperCase().replace(/^.*#/, '').replace(/^BRO-?/, '').replace(/[^A-Z0-9]/g, '').slice(0, 4);
export function shareLink(code) {
  const u = new URL(location.href); u.hash = `BRO-${code}`; return u.toString();
}

// Tasti in un numero: 7 bit "tenuti" + 7 bit "appena premuti".
export function packInput(held, pressed) {
  let b = 0;
  ACTS.forEach((a, i) => { if (held[a]) b |= 1 << i; if (pressed[a]) b |= 1 << (i + 7); });
  return b;
}
export function unpackInput(b) {
  const held = {}, pressed = {};
  ACTS.forEach((a, i) => { held[a] = !!(b & (1 << i)); pressed[a] = !!(b & (1 << (i + 7))); });
  return { held, pressed };
}

// Una sessione online. Eventi: onStatus(testo), onMessage(msg), onClose(motivo).
export class NetSession {
  constructor() {
    this.peer = null; this.conn = null; this.inConn = null; this.host = false; this.code = '';
    this.status = 'idle';   // idle | connecting | waiting | connected | closed
    this.error = '';
    this.onMessage = () => {}; this.onClose = () => {};
    this.lastRecv = 0;
    this.rtt = 0;           // tempo di andata e ritorno (ms), media mobile
    this.rttMax = 0;        // picco recente: serve a scegliere il ritardo
    this.resetLockstep(DELAY);
  }

  // ---------- collegamento ----------
  async host_() {
    this.host = true;
    const P = await loadPeer();
    const config = { iceServers: await iceServers() };
    for (let tries = 0; tries < 5; tries++) {
      this.code = randomCode();
      const ok = await new Promise(res => {
        this.status = 'connecting';
        const peer = new P(PREFIX + this.code, { debug: 1, config });
        peer.on('open', () => { this.peer = peer; res(true); });
        peer.on('error', e => {
          if (this.status === 'connected') return; // a partita avviata conta solo il collegamento diretto
          if (e.type === 'unavailable-id') { peer.destroy(); res(false); return; }
          if (this.peer === peer || !this.peer) this.fail(errText(e));
          res(false);
        });
      });
      if (ok) break;
      if (this.status === 'closed') return;
    }
    if (!this.peer) return this.fail('Impossibile creare la stanza');
    this.status = 'waiting';
    this.peer.on('connection', conn => {
      // due canali: "ctl" affidabile per i messaggi, "in" veloce (senza ritrasmissioni) per i tasti
      if (conn.label === 'in') { if (this.conn && conn.peer === this.conn.peer) this.attachIn(conn); else conn.close(); return; }
      if (this.conn) { conn.on('open', () => { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 300); }); return; }
      this.attach(conn);
    });
    this.peer.on('disconnected', () => { if (this.status === 'waiting') this.peer.reconnect(); });
  }

  async join(code) {
    this.host = false; this.code = code;
    this.status = 'connecting';
    const P = await loadPeer();
    const config = { iceServers: await iceServers() };
    const peer = new P(undefined, { debug: 1, config });
    this.peer = peer;
    peer.on('error', e => { if (this.status !== 'connected') this.fail(errText(e)); });
    peer.on('open', () => {
      const conn = peer.connect(PREFIX + code, { label: 'ctl', reliable: true, serialization: 'json' });
      this.attach(conn);
      setTimeout(() => { if (this.status === 'connecting') this.fail(hasTurn() ? 'L\'amico non risponde' : 'Collegamento non riuscito: per giocare da reti diverse serve il server TURN (vedi src/turn.js)'); }, 15000);
    });
  }

  attach(conn) {
    this.conn = conn;
    conn.on('open', () => {
      this.status = 'connected'; this.lastRecv = performance.now();
      this.send({ t: 'hello', v: 2 });
      if (!this.host) this.attachIn(this.peer.connect(conn.peer, { label: 'in', reliable: false, serialization: 'json' }));
      this.ping();
    });
    conn.on('data', d => this.receive(d));
    conn.on('close', () => this.fail('L\'avversario si è scollegato'));
    conn.on('error', () => this.fail('Collegamento interrotto'));
  }

  // canale dei tasti: se si chiude si continua sul canale affidabile
  attachIn(conn) {
    this.inConn = conn;
    conn.on('data', d => this.receive(d));
    conn.on('close', () => { if (this.inConn === conn) this.inConn = null; });
    conn.on('error', () => { if (this.inConn === conn) this.inConn = null; });
  }

  receive(d) {
    this.lastRecv = performance.now();
    if (!d || typeof d !== 'object') return;
    switch (d.t) {
      case 'in': return this.receiveInputs(d);
      case 'ping': return this.send({ t: 'pong', s: d.s });
      case 'pong': {
        const r = performance.now() - d.s;
        this.rtt = this.rtt ? this.rtt * 0.8 + r * 0.2 : r;
        this.rtts = (this.rtts || []).concat(r).slice(-20);
        this.rttMax = Math.max(...this.rtts);
        return;
      }
      case 'full': return this.fail('La stanza è già piena');
    }
    this.onMessage(d);
  }

  send(msg) { if (this.conn && this.conn.open) try { this.conn.send(msg); } catch { /* chiuso */ } }
  sendFast(msg) {
    if (this.inConn && this.inConn.open) { try { this.inConn.send(msg); return; } catch { /* uso l'altro */ } }
    this.send(msg);
  }
  ping() { this._ping = performance.now(); this.send({ t: 'ping', s: this._ping }); }

  fail(why) {
    if (this.status === 'closed') return;
    this.status = 'closed'; this.error = why;
    this.close();
    this.onClose(why);
  }

  close() {
    for (const c of [this.inConn, this.conn]) try { if (c) c.close(); } catch { /* già chiuso */ }
    try { if (this.peer) this.peer.destroy(); } catch { /* già chiuso */ }
    this.conn = null; this.inConn = null; this.peer = null;
    if (this.status !== 'closed') this.status = 'closed';
  }

  // Da chiamare a ogni fotogramma: misura il ping, tiene viva la connessione e si accorge se cade.
  keepAlive(now = performance.now()) {
    if (this.status !== 'connected') return;
    if (!this._ping || now - this._ping > 500) this.ping();
    if (now - this.lastRecv > 8000) this.fail('Connessione persa');
  }

  get mySide() { return this.host ? 0 : 1; }

  // Ritardo dei tasti adatto a questa connessione: copre metà del ping più i suoi sbalzi.
  suggestDelay() {
    if (!this.rtts || !this.rtts.length) return DELAY;
    const sorted = [...this.rtts].sort((x, y) => x - y);
    const p90 = sorted[Math.floor((sorted.length - 1) * 0.9)];   // un ping "cattivo" ma non il picco isolato
    return Math.max(3, Math.min(12, Math.ceil((p90 / 2 + 16) / 16.7)));
  }

  // ---------- lockstep del combattimento ----------
  resetLockstep(delay = DELAY) {
    this.delay = delay;
    this.local = new Map(); this.remote = new Map();
    this.next = 0;         // prossimo fotogramma da calcolare
    this.pending = 0;      // tasti "appena premuti" non ancora spediti
    this.recvUpTo = 0;     // ho tutti i tasti dell'altro fino a qui (escluso)
    this.peerAck = 0;      // l'altro ha tutti i miei fino a qui (escluso)
    for (let f = 0; f < delay; f++) { this.local.set(f, 0); this.remote.set(f, 0); }
    this.gen = delay;      // prossimo fotogramma a cui assegnare i miei tasti
    this.recvUpTo = delay; this.peerAck = delay;
  }

  // Prende i miei tasti di questo fotogramma e li spedisce (per il fotogramma gen).
  pushLocal(bits) {
    this.pending |= bits & ~0x7f;                    // un tocco veloce non va perso se non spedisco subito
    // il mio "orologio" va avanti a ogni giro anche se per un attimo manca un tasto dell'altro
    // (si recupera col passo doppio); si ferma solo se l'altro è indietro di molto
    if (this.gen - this.next < this.delay + 10) {
      const b = (bits & 0x7f) | this.pending;
      this.pending = 0;
      this.local.set(this.gen, b);
      this.gen++;
    }
    this.flush();
  }

  // Spedisce tutti i miei tasti che l'altro non ha ancora confermato (un pacchetto perso non blocca niente).
  flush() {
    const from = Math.max(this.peerAck, this.gen - 40), b = [];
    for (let f = from; f < this.gen; f++) b.push(this.local.get(f) ?? 0);
    this.sendFast({ t: 'in', f0: from, b, a: this.recvUpTo });
  }

  receiveInputs(d) {
    if (typeof d.a === 'number' && d.a > this.peerAck) this.peerAck = d.a;
    if (Array.isArray(d.b)) d.b.forEach((b, i) => { const f = d.f0 + i; if (f >= this.next && !this.remote.has(f)) this.remote.set(f, b); });
    while (this.remote.has(this.recvUpTo)) this.recvUpTo++;
  }

  // Tasti dei due lati per il fotogramma next, oppure null se quelli dell'altro non sono ancora arrivati.
  ready() {
    const r = this.remote.get(this.next), l = this.local.get(this.next);
    if (r === undefined || l === undefined) return null;
    return this.host ? [l, r] : [r, l];
  }
  advance() {
    this.local.delete(this.next - 60); this.remote.delete(this.next - 60);
    this.next++;
  }
}

function errText(e) {
  switch (e && e.type) {
    case 'peer-unavailable': return 'Stanza non trovata: controlla il codice';
    case 'network': case 'server-error': case 'socket-error': case 'socket-closed': case 'disconnected':
      return 'Server di collegamento non raggiungibile';
    case 'browser-incompatible': return 'Questo browser non supporta il gioco online';
    case 'webrtc': return 'Collegamento diretto non riuscito (rete non compatibile)';
    default: return 'Errore di collegamento';
  }
}

// Numero casuale ripetibile: con lo stesso seme esce la stessa sequenza sui due dispositivi.
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Impronta dello stato del combattimento, per accorgersi se i due dispositivi divergono.
export function fightHash(fight) {
  let h = 2166136261;
  const mix = v => { h ^= (v | 0); h = Math.imul(h, 16777619); };
  for (const f of fight.f) { mix(f.hp); mix(Math.round(f.x * 100)); mix(Math.round(f.y * 100)); mix(f.meter); mix(f.wins); }
  mix(fight.timer); mix(fight.round); mix(fight.projs.length);
  return h >>> 0;
}
