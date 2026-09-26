import { CONFIG } from '../../config';
import { sectorName } from '../../game/sectors';
import { drawText } from '../../render/font';
import type { App, Scene } from '../app';
import { Carousel } from '../carousel';
import type { PlayScene } from './play';
import { coinCounter, panel, type Button } from '../widgets';

const W = CONFIG.view.width;
const H = CONFIG.view.height;
const P = CONFIG.palette;
const RETRY_KEYS = new Set(['Space', 'Enter']);

export class GameOverScene implements Scene {
  private t = 0;
  private carousel: Carousel;
  constructor(private app: App) {
    this.carousel = new Carousel(app, 'go-car', 150);
  }

  private get result() {
    return (this.app.scenes.play as PlayScene).lastResult;
  }

  enter(): void {
    this.t = 0;
    const app = this.app;
    const r = this.result;
    this.carousel.sync();
    app.audio.duck(true);
    if (r?.newBest) app.audio.sfx('newBest');
    for (const c of r?.unlocked ?? []) {
      app.toast(`NEW CHARACTER: ${c.name}!`, P.gold);
      app.audio.sfx('unlock');
      app.uiParticles.burst(W / 2, 70, 40, [P.gold, '#ffffff', P.cyan, P.magenta], 90);
    }
    if (r) app.announce(`Game over. Score ${r.score}. Best ${r.best}.${r.newBest ? ' New best!' : ''} Reached ${r.sector >= 0 ? sectorName(r.sector) : 'no sector'}.`);
  }

  retry(): void {
    this.app.go('ready');
  }

  private shareResult(): void {
    const r = this.result;
    const sector = r && r.sector >= 0 ? sectorName(r.sector) : 'SPACE';
    void this.app.share(r?.score ?? 0, sector);
  }

  buttons(): Button[] {
    return [
      ...this.carousel.buttons(),
      { id: 'go-share', x: 116, y: 124, w: 40, h: 18, icon: 'share', style: 'blue', name: 'Share result', onPress: () => this.shareResult() },
      { id: 'go-back', x: 20, y: 262, w: 40, h: 28, icon: 'back', style: 'blue', name: 'Back to menu', onPress: () => this.app.go('menu') },
      { id: 'go-play', x: 70, y: 258, w: 90, h: 32, icon: 'play', label: 'PLAY', textScale: 2, style: 'coral', name: 'Play again', onPress: () => this.retry() },
    ];
  }

  update(dt: number): void {
    this.t += dt;
    this.carousel.update(dt);
    this.app.run.update(dt, true);
  }

  pointerDown(x: number, y: number): void {
    this.carousel.pointerDown(x, y);
  }
  pointerMove(x: number): void {
    this.carousel.pointerMove(x);
  }
  pointerUp(x: number): void {
    this.carousel.pointerUp(x);
  }

  key(code: string): boolean {
    if (this.carousel.key(code)) return true;
    if (RETRY_KEYS.has(code)) {
      this.retry();
      return true;
    }
    return false;
  }

  back(): void {
    this.app.go('menu');
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const app = this.app;
    const run = app.run;
    run.draw(ctx, run.world.sector >= 0 ? app.accent(run.world.sector) : P.readyRed, false);
    ctx.fillStyle = 'rgba(5,3,16,0.72)';
    ctx.fillRect(0, 0, W, H);
    const r = this.result;
    const pop = Math.min(1, this.t * 4);
    drawText(ctx, 'GAME OVER', W / 2, 16, { scale: 3, align: 'center', color: P.readyRed, shadow: '#5a0716', shadowDepth: 3, alpha: pop });
    // Gold score panel
    panel(ctx, 22, 50, 136, 50, P.gold, '#0b0820');
    drawText(ctx, 'SCORE', 56, 56, { align: 'center', color: '#5a2d00' });
    drawText(ctx, 'BEST', 124, 56, { align: 'center', color: '#5a2d00' });
    ctx.fillStyle = '#d98a00';
    ctx.fillRect(90, 55, 1, 40);
    const score = r?.score ?? 0;
    const best = r?.best ?? app.save.best;
    drawText(ctx, String(score), 56, 71, { scale: 2, align: 'center', color: '#ffffff', shadow: '#8a4a00', shadowDepth: 2 });
    drawText(ctx, String(best), 124, 71, { scale: 2, align: 'center', color: '#ffffff', shadow: '#8a4a00', shadowDepth: 2 });
    if (r?.newBest && Math.floor(this.t * 3) % 2 === 0) {
      panel(ctx, 136, 44, 26, 11, P.readyRed);
      drawText(ctx, 'NEW!', 149, 46, { align: 'center', color: '#ffffff' });
    }
    // Sector line
    const reached = r && r.sector >= 0 ? sectorName(r.sector) : '-';
    const bestSec = app.save.bestSector >= 0 ? sectorName(app.save.bestSector) : '-';
    drawText(ctx, `REACHED ${reached}`, W / 2, 106, { align: 'center', color: '#ffffff', shadow: '#0b0820' });
    drawText(ctx, `BEST SECTOR ${bestSec}`, W / 2, 115, { align: 'center', color: r?.newBestSector ? P.gold : '#c9c3ee', shadow: '#0b0820' });
    // Coin total
    panel(ctx, 24, 124, 84, 18, '#1c1640');
    coinCounter(ctx, 32, 129, app.save.coins);
    if (r && r.coins > 0) drawText(ctx, `+${r.coins}`, 104, 129, { align: 'right', color: P.gold });
    this.carousel.draw(ctx, app.time);
  }
}
