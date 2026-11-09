# WatchOut Bro Fighters

Picchiaduro 2D in pixel art con gli amici come personaggi, giocabile nel browser:
1 contro la CPU (Facile, Normale, Difficile) oppure 1 contro 1 sulla stessa tastiera o con due controller.

Gioca qui: **https://marcoladuu.github.io/WatchOutBroFighters/**

Progetto Vite + Phaser 4: la build finisce nella cartella `docs/`, pronta per GitHub Pages.

## Avvio

```bash
npm install      # la prima volta (e dopo ogni nuova libreria, es. peerjs per l'online)
npm run dev      # apre il gioco nel browser e lo ricarica a ogni modifica
npm run build    # crea la versione da pubblicare in docs/
npm run deploy   # build + commit + push: aggiorna il sito
```

Con `npm run deploy -- "messaggio"` si sceglie il messaggio del commit.

### Provarlo dal telefono sulla rete di casa

```bash
npm run dev:rete       # come dev, ma raggiungibile dagli altri dispositivi sulla stessa Wi-Fi
npm run preview:rete   # la versione finale (build), sempre sulla rete di casa
```

Nel terminale compare un indirizzo `Network: http://192.168.x.x:5173/`: aprilo dal telefono
(collegato alla stessa Wi-Fi). La prima volta Windows può chiedere il permesso nel firewall: consenti
le reti private. In locale (http) il tasto "copia il link" della stanza online non funziona: basta
dettare il codice all'amico.

## Pubblicazione su GitHub Pages

Repository: https://github.com/MarcoLaduu/WatchOutBroFighters

1. `npm run deploy` (crea `docs/` e la carica su GitHub).
2. Su GitHub: **Settings → Pages → Deploy from a branch**, branch **main**, cartella **/docs**.
3. Dopo circa un minuto il gioco è online all'indirizzo qui sopra.

## Comandi

| | Giocatore 1 | Giocatore 2 | Controller |
| --- | --- | --- | --- |
| Movimento | W A S D | Frecce | Levetta / croce |
| Pugno | F | K | Quadrato / X |
| Calcio | G | L | Croce / A |
| Parata | H | Ò | R1 / RB |
| Pausa | Esc | | Start |

Giù + Pugno è un pugno basso, Giù + Calcio una spazzata che fa cadere (si para solo accovacciati).
In salto Pugno o Calcio fanno un calcio volante (si para solo in piedi). Drrrrrrago ha il doppio salto.

Mosse speciali: combinazioni ↓ →, ← →, ↓ ←, ↓ ↓ + Pugno o Calcio (→ = verso l'avversario).
Super: Pugno + Calcio insieme con la barra super piena (si carica colpendo e venendo colpiti).
L'elenco completo di ogni personaggio è nel menu di pausa, alla voce "Mosse dei lottatori";
nei menu i tasti mostrati cambiano da soli tra tastiera, controller Xbox e PlayStation.

### Online con un amico

Menu principale → **Online con un amico**:

1. Uno sceglie **Crea una stanza** e ottiene un codice tipo `BRO-K7PQ`. Con Pugno/Invio (o toccando il
   codice sul telefono) copia/condivide il link della stanza.
2. L'altro apre il link, oppure sceglie **Entra con un codice** e lo scrive.
3. Ognuno sceglie il suo lottatore e si combatte, ognuno dal suo dispositivo (anche PC contro telefono).

I due dispositivi si collegano direttamente (WebRTC, libreria [PeerJS](https://peerjs.com)): il server
gratuito di PeerJS serve solo a presentarli all'inizio, poi si scambiano solo i tasti premuti.
Ogni fotogramma si calcola quando arrivano i tasti di entrambi, con un piccolo ritardo sui tasti che
assorbe la rete: si sceglie a ogni partita in base al ping misurato (da 3 a 12 fotogrammi, `suggestDelay`
in `src/net.js`); in basso durante il combattimento si vedono ping e ritardo. I tasti viaggiano su un
canale veloce senza ritrasmissioni e ogni pacchetto ripete quelli non ancora confermati, così un pacchetto
perso non blocca la partita. Se uno dei due mette in pausa, la partita si ferma per tutti e due.
Per giocare da reti diverse (es. Wi-Fi di casa contro 4G) serve un server TURN che faccia da ponte quando
il collegamento diretto non riesce: si usa Open Relay di Metered, gratis fino a 20 GB al mese (una partita
usa pochi MB). Crea un account su https://dashboard.metered.ca/signup?tool=turnserver e copia username,
password e indirizzi delle credenziali TURN in `src/turn.js`. Senza, l'online funziona di sicuro solo sulla stessa rete.

### Account, ranked e amici

Menu principale → **Ranked**, **Classifica** o **Account e amici**. Ognuno accede con il suo account Google;
al primo accesso compare "Benvenuto!" e si sceglie il nome da lottatore con cui si compare online (da 3 a 12
caratteri, unico; viene proposto il nome dell'account Google). Poi:

- **Ranked**: si entra in coda e si gioca contro il primo che cerca partita. Chi vince prende **+30 coppe**,
  chi perde ne lascia **20** (mai sotto zero). Anche la rivincita vale coppe.
- **Amici**: nel pannello si aggiunge un amico con il suo nome da lottatore; lui accetta la richiesta.
  Il pallino verde dice chi è online. **Sfida** gli manda un invito: gli compare un avviso con
  "Accetta". Anche le sfide tra amici valgono coppe.
- **Classifica** (voce del menu): tutti i lottatori che hanno fatto l'accesso, in ordine di coppe, con
  vittorie, sconfitte e pallino verde per chi è online. Si vede anche senza accesso; la tua riga è evidenziata.

A fine partita ognuno dei due manda al server il vincitore: se coincidono arrivano le coppe, se non
coincidono la partita si annulla. Chi esce o si scollega a partita iniziata perde (vittoria a tavolino per
l'altro). Se uno dei due non manda mai il risultato, la partita si chiude dopo 5 minuti con quello dell'altro.
Il combattimento resta diretto tra i due dispositivi (come l'online con il codice); il server tiene solo
account, amici, coda, inviti e coppe. Le regole stanno nelle funzioni di `supabase/schema.sql`: il browser
non può scrivere direttamente nelle tabelle.

**Configurazione (una volta sola, gratis)** con [Supabase](https://supabase.com):

1. Crea un account su Supabase e un nuovo progetto (piano Free, regione Europa).
2. **SQL Editor** → New query → incolla tutto `supabase/schema.sql` → **Run**.
3. Su [Google Cloud Console](https://console.cloud.google.com): crea un progetto, poi
   **APIs & Services → OAuth consent screen** (tipo External, nome "WatchOut Bro Fighters", la tua email),
   e **Credentials → Create credentials → OAuth client ID** → tipo *Web application*. In
   *Authorized redirect URIs* metti `https://<il-tuo-progetto>.supabase.co/auth/v1/callback`
   (l'indirizzo esatto lo mostra Supabase nella pagina del provider Google). Copia Client ID e Client secret.
   Nella schermata di consenso servono i link: home page `https://marcoladuu.github.io/WatchOutBroFighters/`,
   privacy `https://marcoladuu.github.io/WatchOutBroFighters/privacy.html`, termini
   `https://marcoladuu.github.io/WatchOutBroFighters/termini.html` (pagine in `public/`), dominio autorizzato
   `marcoladuu.github.io`. Poi premi **Publish app**: in modalità "Testing" possono entrare solo
   gli utenti di prova aggiunti a mano.
4. Supabase → **Authentication → Sign In / Providers → Google**: attivalo e incolla Client ID e secret.
5. Supabase → **Authentication → URL Configuration**: *Site URL*
   `https://marcoladuu.github.io/WatchOutBroFighters/`; in *Redirect URLs* aggiungi lo stesso indirizzo e,
   per le prove in locale, `http://localhost:5173/` (e l'indirizzo di rete di `npm run dev:rete`, tipo
   `http://192.168.1.10:5173/`).
6. Supabase → **Project Settings**: copia il *Project URL* (sezione *Data API*) e la **Publishable key**
   (sezione *API Keys*, inizia con `sb_publishable_`) in `src/supabase-config.js`. La publishable è fatta
   per stare nel browser; **mai** la *Secret key* (`sb_secret_...`).
7. `npm run deploy`.

Senza configurazione il resto del gioco funziona come prima. Sul piano gratuito Supabase mette in pausa
il progetto dopo 7 giorni senza attività (manda prima una email): si riattiva dalla dashboard.

### Da telefono o tablet

Con lo schermo in orizzontale compaiono i comandi touch (per il Giocatore 1, contro la CPU):
croce a sinistra, Pugno (rosso), Calcio (blu) e Parata a destra, tasto **SUPER** quando la barra è piena
e **II** in alto a sinistra per la pausa. In combattimento, a destra, ci sono anche i tasti azzurri con le
mosse speciali del proprio lottatore (nome e combinazione): si possono lanciare con un tocco, anche online.

All'avvio il telefono chiede di passare a schermo intero (Android). Su iPhone Safari non lo permette alle
pagine: si aggiunge il gioco alla schermata Home (Condividi → "Aggiungi alla schermata Home") e dall'icona
si apre a schermo intero, senza barre (`public/manifest.webmanifest`, icone `public/icon-*.png`). Nei menu si toccano direttamente le voci; nella scelta del
lottatore un tocco lo seleziona e un secondo tocco lo conferma. Al primo tocco il gioco va a schermo
intero dove il browser lo permette (Android sì, iPhone no). Con un controller collegato o una tastiera
i comandi touch spariscono.

## Personaggi

| Personaggio | Mosse speciali | Super |
| --- | --- | --- |
| Doc Lady | Pallone rossoblù, Firewall, Ctrl+Z | Schermata Blu |
| Socio Spritzu | Flash, Bomba piazzata, Bella soc! | Ace |
| Ste | Differenziata, Pala eolica, Sì fratello!, Ultimo giro | Sì fratello... NO. |
| Sergente Argus | Te lo ritorno, Dai Doc!, Stacco da terra, Tiro calmante | Ordine del Sergente |
| Il Doc | Siringa, Defibrillatore, Diagnosi, Uso terapeutico | Oggi è Venerdoc! |
| Brodi J | Panca piana, Ancora una!, Pausa proteica, Recupero tra le serie | Scheda di allenamento |
| Bro | Placcaggio, Calcio di punizione, Mischia | Meta! |
| Mc | Cortocircuito, Dribbling, Schedina | Il re del calcetto |
| Drrrrrrago | Drrrrrrago!, Gadget omaggio, In diretta | Drago supremo |
| Piripinna | Schiacciata, Muro, Bagher, Senza peli sulla lingua | Sentenza dell'Aia |
| Il Pavone | Piume, Ruota, Coltura batterica, Grande davi! | Selezione naturale |
| Ilary Head | Nuvola di IQOS, Sei in lista!, In castigo!, Dopo-serata | Tutti in lista! |
| Broddoris | Disco da 20, Walkout, Magnesite, Cintura stretta | Tre luci bianche |

Ogni super è una piccola scena animata, con pose ed effetti propri.

## Struttura

```
index.html           pagina del gioco (font Press Start 2P)
public/
  music/             musiche: main (menu) e fight (combattimento), in OGG e MP3
scripts/
  deploy.js          build + commit + push per GitHub Pages
supabase/
  schema.sql         tabelle e funzioni del server: profili, amici, coda ranked, inviti, coppe
src/
  main.js            avvio di Phaser: BootScene prepara immagini e fotogrammi, GameScene fa girare il gioco
  config.js          risoluzione, gravità, durata dei round
  input.js           tastiera, controller e touch dei due giocatori
  touch.js           comandi sullo schermo per telefono e tablet
  net.js             gioco online: collegamento PeerJS, codici stanza, lockstep dei tasti
  turn.js            dati del server TURN (Metered) per giocare online da reti diverse
  account.js         account su Supabase: accesso con Google, profilo e coppe, chiamate al server
  account-ui.js      pannello "Account e amici" (amici, classifica) e avviso delle sfide ricevute
  supabase-config.js indirizzo e chiave anon del progetto Supabase
  audio.js           effetti sonori sintetizzati e musica in giro continuo
  screens.js         titolo, menu, comandi, selezione, VS, pausa, mosse, fine incontro
  ui.js              scritte (Press Start 2P + frecce e simboli disegnati in pixel) e riquadri
  data/              personaggi (statistiche, colori) e move set mostrati nei menu
  sprites/           lo sprite 48x64 approvato di ogni personaggio
  anim/
    rig.js           personaggio "a pezzi": testa e busto dallo sprite, braccia e gambe ridisegnate per posa
    rigs.js          come si scompone ogni personaggio
    poses.js         tutte le pose: base, mosse speciali e super
    frames.js        crea tutti i fotogrammi di ogni personaggio
  game/
    fighter.js       stato, fisica e colpi di un lottatore
    moves.js         mosse base: tempi, danni e hitbox
    specials.js      mosse speciali di ogni personaggio (dati)
    supers.js        le super: una scena per personaggio, con pose ed effetti propri
    fight.js         round, timer, K.O., barre della vita e barra super
    view.js          disegno del combattimento con Phaser (arena, lottatori, proiettili, effetti)
    controllers.js   giocatore umano e CPU (Facile, Normale, Difficile)
    arena.js         lo scenario
```

Per animare un nuovo personaggio basta aggiungere la sua voce in `anim/rigs.js`
(spalle, anche, lunghezze e colori di braccia e gambe).

## Musica

Brani creati con Suno, in `public/music/` (OGG, con l'MP3 di riserva per Safari).
Ogni brano parte dall'inizio e poi si ripete tra `loopStart` e `loopEnd` (in `src/audio.js`, `TRACKS`);
il volume rispetto agli effetti è `MUSIC_VOL`. In pausa la musica si abbassa.

## Prossimi passi

- Altre arene
- Rollback per l'online (meno ritardo sui tasti)

---

Gioco tra amici: i personaggi e i riferimenti sono ispirati a persone reali.
