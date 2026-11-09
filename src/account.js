// Account del giocatore su Supabase: accesso con Google, profilo con le coppe, chiamate al server.
// Si usano direttamente le API REST di Supabase (niente librerie): il login (/auth/v1) e le funzioni
// del database (/rest/v1/rpc/...), scritte in supabase/schema.sql.
import { SUPABASE } from './supabase-config.js';

const STORE = 'wobf-session';
const BEAT_MS = 5000;   // ogni quanto si dice al server "sono online" (e si scoprono inviti e richieste)

export const acct = {
  session: null,        // { access_token, refresh_token, expires_at }
  profile: null,        // { id, username, trophies, wins, losses }
  invites: [],          // sfide ricevute in attesa di risposta
  requests: 0,          // richieste d'amicizia ricevute
  justLogged: false,    // appena tornati dalla pagina di Google
  error: '',
};
const listeners = new Set();
export const onAccount = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const notify = () => listeners.forEach(fn => { try { fn(acct); } catch { /* ok */ } });

export const configured = () => !!(SUPABASE.url && SUPABASE.anonKey);
export const loggedIn = () => !!acct.session;
export const myName = () => (acct.profile && acct.profile.username) || '';
const base = () => SUPABASE.url.replace(/\/+$/, '');

function save() {
  try { if (acct.session) localStorage.setItem(STORE, JSON.stringify(acct.session)); else localStorage.removeItem(STORE); } catch { /* ok */ }
}
function load() {
  try { const s = JSON.parse(localStorage.getItem(STORE) || 'null'); if (s && s.access_token) acct.session = s; } catch { /* ok */ }
}

// Al ritorno da Google l'indirizzo finisce con #access_token=...: si salva e si pulisce l'indirizzo.
// Va chiamata prima di tutto il resto (anche prima di guardare i link #BRO-XXXX).
export function initAccount() {
  if (!configured()) return;
  load();
  const h = location.hash || '';
  if (/access_token=|error_description=/.test(h)) {
    const p = new URLSearchParams(h.replace(/^#/, ''));
    if (p.get('access_token')) {
      acct.session = {
        access_token: p.get('access_token'),
        refresh_token: p.get('refresh_token') || '',
        expires_at: Date.now() + (Number(p.get('expires_in')) || 3600) * 1000,
      };
      acct.justLogged = true;
      save();
    } else acct.error = p.get('error_description') || 'Accesso non riuscito';
    try { history.replaceState(null, '', location.pathname + location.search); } catch { location.hash = ''; }
  }
  if (acct.session) beat();
  setInterval(() => { if (acct.session && document.visibilityState !== 'hidden') beat(); }, BEAT_MS);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && acct.session) beat(); });
}

export function loginGoogle() {
  if (!configured()) return;
  const back = location.origin + location.pathname;
  location.href = `${base()}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(back)}`;
}

export function logout() {
  const s = acct.session;
  acct.session = null; acct.profile = null; acct.invites = []; acct.requests = 0;
  save(); notify();
  if (s) fetch(`${base()}/auth/v1/logout`, { method: 'POST', headers: { apikey: SUPABASE.anonKey, Authorization: `Bearer ${s.access_token}` } }).catch(() => {});
}

// il gettone d'accesso dura un'ora: poco prima della scadenza se ne chiede uno nuovo
let refreshing = null;
async function token() {
  const s = acct.session;
  if (!s) throw new Error('not_logged');
  if (s.expires_at - Date.now() > 60000) return s.access_token;
  if (!refreshing) {
    refreshing = (async () => {
      const r = await fetch(`${base()}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST', headers: { apikey: SUPABASE.anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: s.refresh_token }),
      });
      if (!r.ok) { if (r.status === 400 || r.status === 401) logout(); throw new Error('not_logged'); }
      const j = await r.json();
      acct.session = { access_token: j.access_token, refresh_token: j.refresh_token || s.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000 };
      save();
    })().finally(() => { refreshing = null; });
  }
  await refreshing;
  return acct.session.access_token;
}

// Chiama una funzione del database. In caso di errore lancia un Error con il codice (es. 'name_taken').
// pub: si può chiamare anche senza accesso (es. la classifica)
export async function rpc(name, args = {}, pub = false) {
  if (!configured()) throw new Error('not_configured');
  // la chiave publishable va solo in "apikey"; in "Authorization" va solo il gettone di chi ha fatto l'accesso
  const headers = { apikey: SUPABASE.anonKey, 'Content-Type': 'application/json' };
  if (!(pub && !acct.session)) headers.Authorization = `Bearer ${await token()}`;
  let r;
  try {
    r = await fetch(`${base()}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(args),
    });
  } catch { throw new Error('network'); }
  const txt = await r.text();
  let j = null;
  try { j = txt ? JSON.parse(txt) : null; } catch { j = txt; }
  if (!r.ok) {
    if (r.status === 401) { logout(); throw new Error('not_logged'); }
    throw new Error((j && (j.message || j.error)) || `http_${r.status}`);
  }
  return j;
}

// Nome proposto al primo accesso, preso dal nome dell'account Google (solo lettere e numeri, max 12).
export async function suggestedName() {
  try {
    const r = await fetch(`${base()}/auth/v1/user`, { headers: { apikey: SUPABASE.anonKey, Authorization: `Bearer ${await token()}` } });
    if (!r.ok) return '';
    const u = await r.json(), m = u.user_metadata || {};
    const raw = m.given_name || m.name || m.full_name || (u.email || '').split('@')[0] || '';
    return raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_.]/g, '').slice(0, 12);
  } catch { return ''; }
}

let beating = false;
async function beat() {
  if (beating) return;
  beating = true;
  try {
    const r = await rpc('heartbeat');
    acct.profile = r.profile; acct.invites = r.invites || []; acct.requests = r.requests || 0; acct.error = '';
    notify();
  } catch (e) {
    if (e.message === 'network') acct.error = 'Server non raggiungibile';
    else if (e.message === 'not_configured' || e.message === 'not_logged') { /* ok */ }
    else acct.error = errText(e);
    notify();
  } finally { beating = false; }
}
export const refreshAccount = beat;

// testi degli errori del server, per i giocatori
const ERR = {
  not_logged: 'Devi accedere con il tuo account',
  not_configured: 'Account non configurati (vedi README)',
  network: 'Server non raggiungibile, controlla la connessione',
  bad_name: 'Nome da 3 a 12 caratteri: lettere, numeri, _ e .',
  name_taken: 'Questo nome è già preso',
  no_user: 'Nessun giocatore con questo nome',
  self: 'Non puoi aggiungere te stesso',
  no_username: 'Prima scegli il tuo nome da lottatore',
  not_friend: 'Potete sfidarvi solo tra amici',
  no_match: 'Partita non trovata',
};
export const errText = e => ERR[e && e.message] || ERR[e] || 'Errore del server';
