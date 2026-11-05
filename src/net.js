// Gioco online tra due amici, collegati direttamente (WebRTC con PeerJS).
// Chi crea la stanza è il G1 ("host"), chi entra con il codice è il G2.
// Durante il combattimento i due si scambiano solo i tasti premuti: ogni fotogramma si calcola
// quando si hanno i tasti di entrambi ("lockstep"), con un piccolo ritardo che assorbe la rete.
// Il server gratuito di PeerJS serve solo a presentare i due giocatori all'inizio.

const PREFIX = 'wobf-';                          // per non scontrarsi con altri siti che usano PeerJS
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // niente 0/O e 1/I, che si confondono
export const DELAY = 4;                          // ritardo degli input in fotogrammi (~67 ms)
const ACTS = ['left', 'right', 'up', 'down', 'punch', 'kick', 'block'];

let Peer = null;
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
    this.peer = null; this.conn = null; this.host = false; this.code = '';
    this.status = 'idle';   // idle | connecting | waiting | connected | closed
    this.error = '';
    this.onMessage = () => {}; this.onClose = () => {};
    this.lastRecv = 0;
    this.resetLockstep();
  }

  // ---------- collegamento ----------
  async host_() {
    this.host = true;
    const P = await loadPeer();
    for (let tries = 0; tries < 5; tries++) {
      this.code = randomCode();
      const ok = await new Promise(res => {
        this.status = 'connecting';
        const peer = new P(PREFIX + this.code, { debug: 1 });
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
      if (this.conn) { conn.on('open', () => { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 300); }); return; }
      this.attach(conn);
    });
    this.peer.on('disconnected', () => { if (this.status === 'waiting') this.peer.reconnect(); });
  }

  async join(code) {
    this.host = false; this.code = code;
    this.status = 'connecting';
    const P = await loadPeer();
    const peer = new P(undefined, { debug: 1 });
    this.peer = peer;
    peer.on('error', e => { if (this.status !== 'connected') this.fail(errText(e)); });
    peer.on('open', () => {
      const conn = peer.connect(PREFIX + code, { reliable: true, serialization: 'json' });
      this.attach(conn);
      // se in 15 secondi non risponde nessuno, lasciamo perdere
      setTimeout(() => { if (this.status === 'connecting') this.fail('L\'amico non risponde'); }, 15000);
    });
  }

  attach(conn) {
    this.conn = conn;
    conn.on('open', () => {
      this.status = 'connected'; this.lastRecv = performance.now();
      this.send({ t: 'hello', v: 1 });
    });
    conn.on('data', d => {
      this.lastRecv = performance.now();
      if (!d || typeof d !== 'object') return;
      if (d.t === 'full') return this.fail('La stanza è già piena');
      if (d.t === 'in') { for (const [f, b] of d.i) this.remote.set(f, b); return; }
      if (d.t === 'ping') return;
      this.onMessage(d);
    });
    conn.on('close', () => this.fail('L\'avversario si è scollegato'));
    conn.on('error', () => this.fail('Collegamento interrotto'));
  }

  send(msg) { if (this.conn && this.conn.open) try { this.conn.send(msg); } catch { /* chiuso */ } }

  fail(why) {
    if (this.status === 'closed') return;
    this.status = 'closed'; this.error = why;
    this.close();
    this.onClose(why);
  }

  close() {
    try { if (this.conn) this.conn.close(); } catch { /* già chiuso */ }
    try { if (this.peer) this.peer.destroy(); } catch { /* già chiuso */ }
    this.conn = null; this.peer = null;
    if (this.status !== 'closed') this.status = 'closed';
  }

  // Da chiamare a ogni fotogramma: tiene viva la connessione e si accorge se cade.
  keepAlive(now = performance.now()) {
    if (this.status !== 'connected') return;
    if (!this._ping || now - this._ping > 1000) { this._ping = now; this.send({ t: 'ping' }); }
    if (now - this.lastRecv > 8000) this.fail('Connessione persa');
  }

  get mySide() { return this.host ? 0 : 1; }

  // ---------- lockstep del combattimento ----------
  resetLockstep() {
    this.local = new Map(); this.remote = new Map();
    this.gen = 0;          // prossimo fotogramma a cui assegnare i miei tasti
    this.next = 0;         // prossimo fotogramma da calcolare
    this.pending = 0;      // tasti "appena premuti" non ancora spediti
    this.unacked = [];     // ultimi input spediti: si rimandano un paio di volte per sicurezza
    for (let f = 0; f < DELAY; f++) { this.local.set(f, 0); this.remote.set(f, 0); }
    this.gen = DELAY;
    this.stalls = 0;
  }

  // Prende i miei tasti di questo fotogramma e li spedisce (per il fotogramma gen).
  pushLocal(bits) {
    this.pending |= bits & ~0x7f;                    // un tocco veloce non va perso se non spedisco subito
    if (this.gen - this.next > DELAY + 6) return;    // l'altro è indietro: aspetto
    const b = (bits & 0x7f) | this.pending;
    this.pending = 0;
    this.local.set(this.gen, b);
    this.unacked.push([this.gen, b]);
    if (this.unacked.length > 3) this.unacked.shift();
    this.send({ t: 'in', i: this.unacked });
    this.gen++;
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
