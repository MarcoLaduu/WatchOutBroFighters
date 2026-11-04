// Punto di ingresso: crea il gioco Phaser.
// BootScene prepara immagini e fotogrammi, GameScene fa girare tutto a 60 passi al secondo.
import './style.css';
import Phaser from 'phaser';
import { W, H, S, FONT } from './config.js';
import { pollInput } from './input.js';
import { initTouch, syncTouch } from './touch.js';
import { buildArt } from './sprites/index.js';
import { buildFrames, FW, FH } from './anim/frames.js';
import { arenaCanvas } from './game/arena.js';
import { createScenes } from './screens.js';
import { FightView } from './game/view.js';

let FRAMES = null;

class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }
  async create() {
    try { await Promise.race([document.fonts.load(`16px ${FONT}`), new Promise(r => setTimeout(r, 1500))]); } catch { /* carattere di riserva */ }
    buildArt();
    FRAMES = buildFrames();
    // un'unica immagine per personaggio con tutti i fotogrammi in fila, poi un frame Phaser per ognuno
    for (const [id, anims] of Object.entries(FRAMES)) {
      const all = Object.entries(anims).flatMap(([k, list]) => list.map((c, i) => [`${k}_${i}`, c]));
      const sheet = document.createElement('canvas');
      // a griglia (16 per riga): una sola riga lunghissima supera la dimensione massima delle texture
      const COLS = 16, rows = Math.ceil(all.length / COLS);
      sheet.width = FW * Math.min(COLS, all.length); sheet.height = FH * rows;
      const sctx = sheet.getContext('2d');
      const at = i => [(i % COLS) * FW, Math.floor(i / COLS) * FH];
      all.forEach(([, c], i) => sctx.drawImage(c, ...at(i)));
      const tex = this.textures.addCanvas(`fr_${id}`, sheet);
      all.forEach(([name], i) => tex.add(name, 0, ...at(i), FW, FH));
    }
    this.textures.addCanvas('arena', arenaCanvas());
    this.scene.start('game');
  }
}

class GameScene extends Phaser.Scene {
  constructor() { super('game'); }
  create() {
    this.screens = createScenes();
    window.__game = this.screens; // utile per il debug dalla console
    this.ui = this.textures.createCanvas('ui', W * S, H * S);
    this.uiImage = this.add.image(0, 0, 'ui').setOrigin(0, 0).setDepth(100);
    this.view = null; this.viewFight = null;
    this.acc = 0;
  }

  update(time, delta) {
    const STEP = 1000 / 60;
    this.acc += Math.min(100, delta);
    while (this.acc >= STEP) { pollInput(); this.screens.update(); this.acc -= STEP; }

    const { G } = this.screens;
    if (G.fight && G.fight !== this.viewFight) {
      if (this.view) this.view.destroy();
      this.view = new FightView(this, G.fight, FRAMES);
      this.viewFight = G.fight;
    }
    const showWorld = this.screens.worldVisible();
    if (this.view) { this.view.setVisible(showWorld); if (showWorld) this.view.update(); }

    const ctx = this.ui.context;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W * S, H * S);
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.imageSmoothingEnabled = false;
    this.screens.draw(ctx);
    this.ui.refresh();
    syncTouch(G);
  }
}

initTouch();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'stage',
  width: W * S,
  height: H * S,
  backgroundColor: '#0b0710',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { keyboard: false, gamepad: false }, // tastiera e controller li legge input.js
  scene: [BootScene, GameScene],
});
