// Mosse speciali e super di ogni personaggio, dal documento del move set.
// Comandi scritti per il personaggio rivolto a destra (→ = verso l'avversario).
export const MOVESETS = {
  docLady: {
    specials: [['Pallone rossoblù', '↓ → + K'], ['Firewall', '← → + P'], ['Ctrl+Z', '↓ ← + P']],
    super: 'Schermata Blu',
  },
  socioSpritzu: {
    specials: [['Flash', '↓ → + P'], ['Bomba piazzata', '↓ ↓ + K'], ['Bella soc!', '← → + P']],
    super: 'Ace',
  },
  ste: {
    specials: [['Differenziata', '↓ → + P'], ['Pala eolica', '↓ ↓ + P'], ['Sì fratello!', '← → + K'], ['Ultimo giro (mezza barra)', '↓ ↓ + K']],
    super: 'Sì fratello... NO.',
  },
  sergenteArgus: {
    passive: ['Rancore', 'i colpi subiti caricano la super il doppio'],
    specials: [['Te lo ritorno', '↓ ← + P'], ['Dai Doc!', '← → + P'], ['Stacco da terra', '↓ ↓ + K'], ['Tiro calmante', '↓ → + K']],
    super: 'Ordine del Sergente',
  },
  ilDoc: {
    passive: ['Ci sono rimasto male', 'dopo una combo subita, il colpo dopo è doppio'],
    specials: [['Siringa', '↓ → + P'], ['Defibrillatore', '← → + P'], ['Diagnosi', '↓ ↓ + K'], ['Uso terapeutico', '↓ → + K']],
    super: 'Oggi è Venerdoc!',
  },
  brodiJ: {
    specials: [['Panca piana', '← → + P'], ['Ancora una!', '↓ → + K'], ['Pausa proteica', '↓ ↓ + P'], ['Recupero tra le serie', '↓ ← + P']],
    super: 'Scheda di allenamento',
  },
  bro: {
    specials: [['Placcaggio', '← → + K'], ['Calcio di punizione', '↓ → + K'], ['Mischia', '↓ ↓ + P']],
    super: 'Meta!',
  },
  mc: {
    specials: [['Cortocircuito', '↓ → + P'], ['Dribbling', '← → + K'], ['Schedina', '↓ ↓ + P']],
    super: 'Il re del calcetto',
  },
  drrrrrrago: {
    passive: ['Doppio salto', 'può saltare di nuovo in aria'],
    specials: [['Drrrrrrago!', '↓ → + P (tieni)'], ['Gadget omaggio', '← → + P'], ['In diretta', '↓ ↓ + K']],
    super: 'Drago supremo',
  },
  piripinna: {
    passive: ['Ti ho già inquadrato', 'la prima mossa speciale subita in ogni round fa metà danno'],
    specials: [['Schiacciata', '↓ → + P'], ['Muro', '← → + K'], ['Bagher', '↓ ← + P'], ['Senza peli sulla lingua', '↓ ↓ + K']],
    super: 'Sentenza dell\'Aia',
  },
  pavone: {
    passive: ['Mimetismo', 'fermo 2 secondi diventa trasparente: il colpo dopo fa +30%'],
    specials: [['Piume', '↓ → + P'], ['Ruota', '↓ ← + K'], ['Coltura batterica', '← → + P'], ['Grande davi!', '↓ ↓ + P']],
    super: 'Selezione naturale',
  },
  ilaryHead: {
    passive: ['Sempre in lista', 'inizia ogni round con un quarto di barra super'],
    specials: [['Nuvola di IQOS', '↓ → + P'], ['Sei in lista!', '← → + K'], ['In castigo!', '↓ ← + P'], ['Dopo-serata', '↓ ↓ + K']],
    super: 'Tutti in lista!',
  },
};

// Mosse base, uguali per tutti e già attive.
export const BASE_MOVES = [
  ['Pugno', 'P'],
  ['Calcio', 'K'],
  ['Pugno basso', '↓ + P'],
  ['Spazzata (fa cadere)', '↓ + K'],
  ['Calcio volante', 'in salto P o K'],
  ['Parata alta / bassa', 'Parata / ↓ + Parata'],
];
