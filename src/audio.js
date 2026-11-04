// Effetti sonori sintetizzati con Web Audio e musiche di sottofondo (public/music).
let ac = null;

export function unlockAudio() {
  if (!ac) {
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  }
  if (ac.state === 'suspended') ac.resume();
}

function tone(freq, dur, type = 'square', vol = 0.12, slide = 0) {
  if (!ac) return;
  const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t); o.stop(t + dur);
}

function noise(dur, vol = 0.15) {
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ac.createBufferSource(), g = ac.createGain();
  s.buffer = buf; g.gain.value = vol;
  s.connect(g).connect(ac.destination);
  s.start();
}

export const sfx = {
  move: () => tone(520, 0.05, 'square', 0.06),
  select: () => { tone(660, 0.07, 'square', 0.08); setTimeout(() => tone(990, 0.09, 'square', 0.08), 60); },
  whoosh: () => tone(300, 0.08, 'triangle', 0.05, -180),
  hit: () => { noise(0.08, 0.18); tone(140, 0.1, 'square', 0.1, -80); },
  heavy: () => { noise(0.14, 0.22); tone(90, 0.16, 'sawtooth', 0.12, -50); },
  block: () => tone(880, 0.05, 'square', 0.06, -300),
  jump: () => tone(260, 0.08, 'triangle', 0.05, 200),
  ko: () => { noise(0.4, 0.25); tone(200, 0.6, 'sawtooth', 0.12, -170); },
  round: () => { tone(440, 0.1, 'square', 0.08); setTimeout(() => tone(660, 0.18, 'square', 0.08), 120); },
};

// ---------- musica ----------
// Ogni brano parte dall'inizio e poi si ripete tra loopStart e loopEnd (secondi): i punti sono scelti
// dove la musica combacia, e la fine del file sfuma già nel punto di ripresa, così il giro non si sente.
const TRACKS = {
  main: { file: 'main', loopStart: 34.5, loopEnd: 129.298 },
  fight: { file: 'fight', loopStart: 42.18, loopEnd: 118.966 },
};
const MUSIC_VOL = 0.4;     // rispetto agli effetti
const buffers = {}, loading = {};
let master = null, current = null, wanted = null, ducked = false;

function ext() {
  const a = document.createElement('audio');
  return a.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3';
}

function load(name) {
  if (loading[name]) return;
  loading[name] = fetch(`music/${TRACKS[name].file}.${ext()}`)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(b => new Promise((res, rej) => ac.decodeAudioData(b, res, rej)))
    .then(buf => { buffers[name] = buf; if (wanted === name && (!current || current.name !== name)) start(name); })
    .catch(() => { loading[name] = null; });
}

function start(name) {
  const buf = buffers[name], tr = TRACKS[name], t = ac.currentTime;
  if (current) {
    const old = current;
    old.gain.gain.cancelScheduledValues(t);
    old.gain.gain.setValueAtTime(old.gain.gain.value, t);
    old.gain.gain.linearRampToValueAtTime(0, t + 0.6);
    old.src.stop(t + 0.65);
  }
  const src = ac.createBufferSource(), gain = ac.createGain();
  src.buffer = buf; src.loop = true;
  src.loopStart = tr.loopStart; src.loopEnd = Math.min(tr.loopEnd, buf.duration);
  gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(1, t + 0.4);
  src.connect(gain).connect(master);
  src.start(t);
  current = { name, src, gain };
}

export const music = {
  // Da chiamare a ogni fotogramma con il brano che deve suonare: cambia solo quando serve.
  play(name) {
    wanted = name;
    if (!ac || ac.state !== 'running') return;
    if (!master) {
      master = ac.createGain(); master.gain.value = MUSIC_VOL; master.connect(ac.destination);
      Object.keys(TRACKS).forEach(load);
    }
    if (current && current.name === name) return;
    if (buffers[name]) start(name); else load(name);
  },
  // Musica più bassa (menu di pausa)
  duck(on) {
    if (!master || on === ducked) return;
    ducked = on;
    master.gain.setTargetAtTime(MUSIC_VOL * (on ? 0.35 : 1), ac.currentTime, 0.15);
  },
};
