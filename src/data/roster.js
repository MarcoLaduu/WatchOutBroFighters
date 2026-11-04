// I 9 personaggi: statistiche dal move set (da 1 a 5, 14 punti in totale) e dati per le animazioni.
import { drawDocLady } from '../sprites/docLady.js';
import { drawIlDoc } from '../sprites/ilDoc.js';
import { drawSocioSpritzu } from '../sprites/socioSpritzu.js';
import { drawSte } from '../sprites/ste.js';
import { drawMc } from '../sprites/mc.js';
import { drawSergenteArgus } from '../sprites/sergenteArgus.js';
import { drawBro } from '../sprites/bro.js';
import { drawDrrrrrrago } from '../sprites/drrrrrrago.js';
import { drawBrodiJ } from '../sprites/brodiJ.js';

// oy: di quanti pixel lo sprite parte più in basso (personaggi più bassi).
// arm/fist: colori del braccio che tira il pugno. leg/shoe: colori della gamba che calcia.
export const ROSTER = [
  { id: 'docLady', name: 'Doc Lady', draw: drawDocLady, oy: 0,
    stats: { vita: 5, forza: 3, velocita: 3, salto: 3 },
    style: 'Stratega a distanza', win: 'Hai provato a spegnere e riaccendere?',
    arm: '#e8b896', fist: '#e8b896', leg: '#3a5a8c', shoe: '#ececec' },
  { id: 'socioSpritzu', name: 'Socio Spritzu', draw: drawSocioSpritzu, oy: 0,
    stats: { vita: 4, forza: 4, velocita: 3, salto: 3 },
    style: 'Tuttofare robusto', win: 'Bella soc, alla prossima.',
    arm: '#2f3a44', fist: '#22262b', leg: '#1f2328', shoe: '#2a2a2a' },
  { id: 'ste', name: 'Ste', draw: drawSte, oy: 6,
    stats: { vita: 2, forza: 3, velocita: 5, salto: 4 },
    style: 'Aggressivo e velocissimo', win: 'Sì fratello, sì.',
    arm: '#1d4fa0', fist: '#dcaa86', leg: '#1d4fa0', shoe: '#ececec' },
  { id: 'sergenteArgus', name: 'Sergente Argus', draw: drawSergenteArgus, oy: 3,
    stats: { vita: 4, forza: 5, velocita: 3, salto: 2 },
    style: 'Contrattaccante rabbioso', win: "Me l'avevi fatta. Te l'ho ritornata.",
    arm: '#ebbd9f', fist: '#ebbd9f', leg: '#6d7a48', shoe: '#1e1a16' },
  { id: 'ilDoc', name: 'Il Doc', draw: drawIlDoc, oy: 0,
    stats: { vita: 3, forza: 4, velocita: 3, salto: 4 },
    style: 'Lungo e tecnico', win: 'Oggi è Venerdoc.',
    arm: '#f1f3f4', fist: '#e3b08e', leg: '#4f9d8c', shoe: '#f1f3f4' },
  { id: 'brodiJ', name: 'Brodi J', draw: drawBrodiJ, oy: 3,
    stats: { vita: 5, forza: 5, velocita: 2, salto: 2 },
    style: 'Lottatore pesante', win: 'Brodi brodi. Domani gambe.',
    arm: '#d39d77', fist: '#d39d77', leg: '#d39d77', shoe: '#2a2a2a' },
  { id: 'bro', name: 'Bro', draw: drawBro, oy: 3,
    stats: { vita: 4, forza: 4, velocita: 4, salto: 2 },
    style: 'Caricatore', win: 'Oh Bro, terzo tempo?',
    arm: '#e4b596', fist: '#e4b596', leg: '#1f3a7a', shoe: '#1b1b1b' },
  { id: 'mc', name: 'Mc', draw: drawMc, oy: 3,
    stats: { vita: 3, forza: 3, velocita: 4, salto: 4 },
    style: 'Tecnico e azzardato', win: 'Mc, il re del calcetto. E pure del ring.',
    arm: '#e2b192', fist: '#e2b192', leg: '#e0b53a', shoe: '#1b1b1b' },
  { id: 'drrrrrrago', name: 'Drrrrrrago', draw: drawDrrrrrrago, oy: 0, doubleJump: true,
    stats: { vita: 2, forza: 3, velocita: 4, salto: 5 },
    style: 'Caotico e aereo', win: 'Mettete like! Drrrrrrago!',
    arm: '#e8b898', fist: '#e8b898', leg: '#c9b48a', shoe: '#ececec' },
];
