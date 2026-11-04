# Picchiaduro Occhio Bro

Picchiaduro 2D in pixel art con gli amici come personaggi, giocabile nel browser.
Progetto Vite + Phaser 4: la build finisce nella cartella `docs/`, pronta per GitHub Pages.

## Avvio

```bash
npm install      # solo la prima volta
npm run dev      # apre il gioco nel browser e lo ricarica a ogni modifica
npm run build    # crea la versione da pubblicare in docs/
npm run deploy   # build + commit + push (serve il repository GitHub collegato)
```

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
L'elenco completo di ogni personaggio è nel menu di pausa, alla voce "Mosse dei lottatori".

## Struttura

```
src/
  main.js            avvio di Phaser: BootScene prepara immagini e fotogrammi, GameScene fa girare il gioco
  config.js          risoluzione, gravità, durata dei round
  input.js           tastiera e controller dei due giocatori
  audio.js           effetti sonori sintetizzati e musica (main nel menu, fight in partita, in giro continuo)
  screens.js         titolo, menu, comandi, selezione, VS, pausa, mosse, fine incontro
  ui.js              scritte (Press Start 2P + frecce e simboli disegnati in pixel) e riquadri
  data/              personaggi (statistiche, colori) e move set
  sprites/           lo sprite 48x64 approvato di ogni personaggio
  anim/
    rig.js           personaggio "a pezzi": testa e busto dallo sprite, braccia e gambe ridisegnate per posa
    rigs.js          come si scompone ogni personaggio
    poses.js         le animazioni base, uguali per tutti
    frames.js        crea tutti i fotogrammi (animati per chi ha il rig, posa fissa per gli altri)
  game/
    fighter.js       stato, fisica e colpi di un lottatore
    moves.js         mosse base: tempi, danni e hitbox
    specials.js      mosse speciali di ogni personaggio (dati)
    supers.js        le super: una scena per personaggio, con pose ed effetti propri
    fight.js         round, timer, K.O., barre della vita
    view.js          disegno del combattimento con Phaser (arena, ombre, lottatori, scintille)
    controllers.js   giocatore umano e CPU (Facile, Normale, Difficile)
    arena.js         lo scenario
```

Per animare un nuovo personaggio basta aggiungere la sua voce in `anim/rigs.js`
(spalle, anche, lunghezze e colori di braccia e gambe).

## Prossimi passi

- Altre arene, musica, controlli touch
- Gioco online tra amici

## Musica

I brani sono in `public/music/` (`main` e `fight`, in OGG con l'MP3 di riserva per Safari).
I punti del giro sono in `src/audio.js` (`TRACKS`): il brano parte dall'inizio e poi si ripete
tra `loopStart` e `loopEnd`. Il volume è `MUSIC_VOL`.
