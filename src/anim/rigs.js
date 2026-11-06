// Come si scompone ogni personaggio: dove sono spalle e anche, quanto sono lunghe braccia e gambe
// e di che colore è ogni tratto (dalla spalla alla mano, dall'anca alla caviglia).
// Coordinate dello sprite 48x64 rivolto a destra, misurate sugli sprite approvati.
// neckY: ultima riga della testa. torsoBottom: ultima riga del busto (sotto partono le gambe).
// fistBox/bootBox: dove prendere pugno e scarpa dallo sprite (x0, y0, x1, y1).
// Bande: [inizio, fine, colore] lungo l'arto, da 0 (spalla/anca) a 1 (mano/caviglia).
// upperBandsB/F e foreBandsB/F servono quando le due braccia sono diverse.
import { drawBro } from '../sprites/bro.js';
import { drawDocLady } from '../sprites/docLady.js';
import { drawIlDoc } from '../sprites/ilDoc.js';
import { drawSocioSpritzu } from '../sprites/socioSpritzu.js';
import { drawSte } from '../sprites/ste.js';
import { drawMc } from '../sprites/mc.js';
import { drawSergenteArgus } from '../sprites/sergenteArgus.js';
import { drawDrrrrrrago } from '../sprites/drrrrrrago.js';
import { drawBrodiJ } from '../sprites/brodiJ.js';
import { drawPiripinna } from '../sprites/piripinna.js';
import { drawPavone } from '../sprites/pavone.js';
import { drawIlaryHead } from '../sprites/ilaryHead.js';
import { drawBroddoris } from '../sprites/broddoris.js';

const all = c => [[0, 1, c]];

export const RIGS = {
  bro: {
    draw: drawBro, neckY: 22, torsoBottom: 46,
    shoulderB: [10, 26], shoulderF: [37, 26],
    hipB: [18, 46], hipF: [29, 46], ankleB: [18, 57], ankleF: [29, 57],
    fistBox: [30, 21, 35, 26], bootBox: [25, 58, 35, 62], ankleInBoot: [29, 57],
    limbs: {
      upper: 7, fore: 9, wUpper: 5, wFore: 4,
      upperBands: [[0, 0.25, '#c0392b'], [0.25, 0.5, '#1f3a7a'], [0.5, 1, '#e4b596']],
      foreBands: all('#e4b596'),
      thigh: 6, shin: 6, wThigh: 7, wShin: 6,
      thighBands: [[0, 0.55, '#f2f2ee'], [0.55, 1, '#e4b596']],
      shinBands: [[0, 0.2, '#e4b596'], [0.2, 0.4, '#1f3a7a'], [0.4, 0.55, '#c0392b'], [0.55, 1, '#1f3a7a']],
    },
  },

  docLady: {
    draw: drawDocLady, neckY: 21, torsoBottom: 45, fistAdj: [0, -1.5],
    shoulderB: [10, 24], shoulderF: [37, 24],
    hipB: [17.5, 45], hipF: [29.5, 45], ankleB: [17.5, 57], ankleF: [29.5, 57],
    fistBox: [30, 17, 35, 22], bootBox: [26, 58, 35, 61], ankleInBoot: [30, 57],
    limbs: {
      upper: 7, fore: 10, wUpper: 4, wFore: 4,
      upperBandsB: [[0, 0.55, '#b3122e'], [0.55, 1, '#e8b896']],
      upperBandsF: [[0, 0.55, '#1d2f6f'], [0.55, 1, '#e8b896']],
      foreBands: all('#e8b896'),
      thigh: 6, shin: 6, wThigh: 8, wShin: 7,
      thighBands: all('#3a5a8c'), shinBands: all('#3a5a8c'),
    },
  },

  ilDoc: {
    draw: drawIlDoc, neckY: 19, torsoBottom: 48,
    shoulderB: [11, 23], shoulderF: [36, 23],
    hipB: [18.5, 44], hipF: [28.5, 44], ankleB: [18.5, 58], ankleF: [28.5, 58],
    fistBox: [30, 18, 35, 23], bootBox: [25, 59, 34, 61], ankleInBoot: [29, 58],
    limbs: {
      upper: 8, fore: 10, wUpper: 4, wFore: 4,
      upperBands: all('#f1f3f4'),
      foreBands: [[0, 0.85, '#f1f3f4'], [0.85, 1, '#cfd4d8']],
      thigh: 7, shin: 7, wThigh: 8, wShin: 7,
      thighBands: all('#4f9d8c'), shinBands: all('#4f9d8c'),
    },
  },

  socioSpritzu: {
    draw: drawSocioSpritzu, neckY: 20, torsoBottom: 45, fistAdj: [0, -0.5],
    shoulderB: [10, 24], shoulderF: [37, 24],
    hipB: [17.5, 45], hipF: [29.5, 45], ankleB: [17.5, 57], ankleF: [29.5, 57],
    fistBox: [30, 18, 35, 23], bootBox: [26, 58, 35, 61], ankleInBoot: [30, 57],
    limbs: {
      upper: 7, fore: 10, wUpper: 4, wFore: 4,
      upperBands: all('#2f3a44'),
      foreBands: [[0, 0.85, '#2f3a44'], [0.85, 1, '#3fe0c8']],
      thigh: 6, shin: 6, wThigh: 8, wShin: 7,
      thighBands: [[0, 0.45, '#1f2328'], [0.45, 1, '#15181c']], shinBands: all('#1f2328'),
    },
  },

  ste: {
    draw: drawSte, neckY: 26, torsoBottom: 47,
    shoulderB: [11, 29], shoulderF: [36, 29],
    hipB: [18.5, 47], hipF: [28.5, 47], ankleB: [18.5, 57], ankleF: [28.5, 57],
    fistBox: [30, 24, 35, 29], bootBox: [25, 58, 34, 61], ankleInBoot: [29, 57],
    limbs: {
      upper: 7, fore: 10, wUpper: 4, wFore: 4,
      upperBands: all('#1d4fa0'),
      foreBands: [[0, 0.85, '#1d4fa0'], [0.85, 1, '#f2f2ee']],
      thigh: 5, shin: 5, wThigh: 8, wShin: 7,
      thighBands: all('#1d4fa0'), shinBands: all('#1d4fa0'),
    },
  },

  mc: {
    draw: drawMc, neckY: 23, torsoBottom: 45,
    shoulderB: [12, 26], shoulderF: [35, 26],
    hipB: [18.5, 45], hipF: [28.5, 45], ankleB: [18.5, 57], ankleF: [28.5, 57],
    fistBox: [29, 21, 34, 26], bootBox: [25, 58, 34, 61], ankleInBoot: [29, 57],
    limbs: {
      upper: 7, fore: 10, wUpper: 4, wFore: 4,
      upperBands: [[0, 0.55, '#e0b53a'], [0.55, 1, '#e2b192']],
      foreBands: all('#e2b192'),
      thigh: 6, shin: 6, wThigh: 7, wShin: 6,
      thighBands: [[0, 0.6, '#1b1b1b'], [0.6, 1, '#e2b192']],
      shinBands: [[0, 0.25, '#e2b192'], [0.25, 0.45, '#e0b53a'], [0.45, 0.6, '#1b1b1b'], [0.6, 1, '#e0b53a']],
    },
  },

  sergenteArgus: {
    draw: drawSergenteArgus, neckY: 22, torsoBottom: 45,
    shoulderB: [10, 26], shoulderF: [37, 26],
    hipB: [18, 45], hipF: [29, 45], ankleB: [18, 57], ankleF: [29, 57],
    fistBox: [30, 21, 35, 26], bootBox: [25, 58, 35, 61], ankleInBoot: [29, 57],
    limbs: {
      upper: 7, fore: 10, wUpper: 5, wFore: 4,
      upperBands: [[0, 0.5, '#5b6b3a'], [0.5, 1, '#ebbd9f']],
      foreBands: all('#ebbd9f'),
      thigh: 6, shin: 6, wThigh: 9, wShin: 8,
      thighBands: all('#6d7a48'), shinBands: [[0, 0.55, '#6d7a48'], [0.55, 1, '#1e1a16']],
    },
  },

  drrrrrrago: {
    draw: drawDrrrrrrago, neckY: 19, torsoBottom: 42,
    shoulderB: [12, 23], shoulderF: [35, 23],
    hipB: [19, 42], hipF: [28, 42], ankleB: [19, 58], ankleF: [28, 58],
    fistBox: [29, 18, 34, 23], bootBox: [25, 59, 33, 61], ankleInBoot: [28, 58],
    limbs: {
      upper: 8, fore: 10, wUpper: 4, wFore: 4,
      upperBands: [[0, 0.6, '#7a3fc0'], [0.6, 1, '#e8b898']],
      foreBands: all('#e8b898'),
      thigh: 8, shin: 8, wThigh: 7, wShin: 6,
      thighBands: all('#c9b48a'), shinBands: all('#c9b48a'),
    },
  },

  brodiJ: {
    draw: drawBrodiJ, neckY: 22, torsoBottom: 47,
    shoulderB: [9, 26], shoulderF: [38, 26],
    hipB: [18, 46], hipF: [29, 46], ankleB: [18, 57], ankleF: [29, 57],
    fistBox: [30, 21, 36, 26], bootBox: [25, 58, 35, 61], ankleInBoot: [29, 57],
    limbs: {
      upper: 7, fore: 10, wUpper: 6, wFore: 5,
      upperBands: [[0, 0.3, '#d39d77'], [0.3, 0.45, '#3a4352'], [0.45, 0.7, '#d39d77'], [0.7, 0.8, '#3a4352'], [0.8, 1, '#d39d77']],
      foreBandsB: [[0, 0.2, '#d39d77'], [0.2, 0.32, '#3a4352'], [0.32, 0.45, '#d39d77'], [0.45, 0.58, '#3a4352'], [0.58, 0.7, '#d39d77'], [0.7, 0.8, '#3a4352'], [0.8, 1, '#d39d77']],
      foreBandsF: [[0, 0.2, '#d39d77'], [0.2, 0.32, '#3a4352'], [0.32, 0.45, '#d39d77'], [0.45, 0.58, '#3a4352'], [0.58, 0.75, '#d39d77'], [0.75, 0.88, '#1b1b1b'], [0.88, 1, '#d39d77']],
      thigh: 6, shin: 6, wThigh: 9, wShin: 8,
      thighBands: [[0, 0.35, '#1b1b1f'], [0.35, 1, '#d39d77']], shinBands: [[0, 0.85, '#d39d77'], [0.85, 1, '#f2f2ee']],
    },
  },

  piripinna: {
    draw: drawPiripinna, neckY: 23, torsoBottom: 45,
    shoulderB: [12, 27], shoulderF: [35, 27],
    hipB: [19.5, 45], hipF: [27.5, 45], ankleB: [19.5, 57], ankleF: [27.5, 57],
    fistBox: [30, 22, 34, 26], bootBox: [25, 58, 33, 61], ankleInBoot: [28, 57],
    limbs: {
      upper: 7, fore: 9, wUpper: 3, wFore: 3,
      upperBands: [[0, 0.4, '#2f6fd0'], [0.4, 1, '#d9a27a']],
      foreBands: all('#d9a27a'),
      thigh: 6, shin: 6, wThigh: 6, wShin: 6,
      thighBands: [[0, 0.4, '#1e1e26'], [0.4, 1, '#d9a27a']],
      shinBands: [[0, 0.3, '#f4f2ee'], [0.3, 0.8, '#d9a27a'], [0.8, 1, '#f4f2ee']],
    },
  },

  pavone: {
    draw: drawPavone, neckY: 21, torsoBottom: 45,
    shoulderB: [13, 24], shoulderF: [34, 24],
    hipB: [18.5, 45], hipF: [28.5, 45], ankleB: [18.5, 57], ankleF: [28.5, 57],
    fistBox: [30, 17, 35, 22], bootBox: [26, 58, 33, 61], ankleInBoot: [28.5, 57],
    limbs: {
      upper: 8, fore: 10, wUpper: 3, wFore: 3,
      upperBands: all('#f2f2ee'),
      foreBands: [[0, 0.85, '#f2f2ee'], [0.85, 1, '#c8c8c2']],
      thigh: 6, shin: 6, wThigh: 6, wShin: 6,
      thighBands: all('#3b4250'), shinBands: all('#3b4250'),
    },
  },

  ilaryHead: {
    draw: drawIlaryHead, neckY: 26, torsoBottom: 47,
    shoulderB: [12, 30], shoulderF: [35, 30],
    hipB: [18.5, 47], hipF: [28.5, 47], ankleB: [18.5, 57], ankleF: [28.5, 57],
    fistBox: [30, 25, 34, 29], bootBox: [25, 58, 34, 61], ankleInBoot: [28.5, 57],
    limbs: {
      upper: 6, fore: 8, wUpper: 3, wFore: 3,
      upperBands: all('#f2cdb4'),
      foreBandsB: all('#f2cdb4'),
      foreBandsF: [[0, 0.78, '#f2cdb4'], [0.78, 0.92, '#f2c230'], [0.92, 1, '#f2cdb4']],
      thigh: 5, shin: 5, wThigh: 8, wShin: 7,
      thighBands: all('#7d9ccb'), shinBands: all('#7d9ccb'),
    },
  },

  broddoris: {
    draw: drawBroddoris, neckY: 22, torsoBottom: 47,
    shoulderB: [9, 26], shoulderF: [38, 26],
    hipB: [18, 46], hipF: [29, 46], ankleB: [18, 57], ankleF: [29, 57],
    fistBox: [30, 21, 36, 26], bootBox: [25, 58, 35, 61], ankleInBoot: [29, 57],
    limbs: {
      upper: 7, fore: 10, wUpper: 6, wFore: 5,
      upperBands: [[0, 0.35, '#1e1e24'], [0.35, 1, '#efc4a2']],
      foreBands: [[0, 0.8, '#efc4a2'], [0.8, 0.95, '#3a3a44'], [0.95, 1, '#efc4a2']],
      thigh: 6, shin: 6, wThigh: 9, wShin: 8,
      thighBands: [[0, 0.5, '#2a2a32'], [0.5, 1, '#efc4a2']], shinBands: [[0, 0.8, '#efc4a2'], [0.8, 1, '#2a2a2a']],
    },
  },
};
