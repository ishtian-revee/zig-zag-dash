import { CONFIG } from '../../config';
import { sectorName } from '../../game/sectors';
import { drawText } from '../../render/font';
import type { App, Scene } from '../app';
import type { PlayScene } from './play';
import { coinCounter, panel, type Button } from '../widgets';

const W = CONFIG.view.width;
const H = CONFIG.view.height;
const P = CONFIG.palette;
const RETRY_KEYS = new Set(['Space', 'Enter']);

export class GameOverScene implements Scene {
  private t = 0;
  constructor(private app: App) {}

  private get result() {
    return (this.app.scenes.play as PlayScene).lastResult;
  }

  enter(): void {
    this.t = 0;
    const app = this.app;
    const r = this.result;
    app.audio.duck(true);
    if (r?.newBest) app.audio.sfx('newBest');
    for (const c of r?.unlocked ?? []) {
      app.toast('NEW CHARACTER!', P.gold);
      app.toast(c.name, '#ffffff');
      app.audio.sfx('unlock');
    }
    if (r) app.announce(`Game over. Score ${r.score}. Best ${r.best}.${r.newBest ? ' New best!' : ''}`);
  }

  retry(): void {
    this.app.go('ready');
  }

  buttons(): Button[] {
    return [
      { id: 'go-back', x: 22, y: 262, w: 40, h: 24, icon: 'back', style: 'blue', name: 'Back to menu', onPress: () => this.app.go('menu') },
      { id: 'go-play', x: 70, y: 258, w: 88, h: 30, icon: 'play', label: 'PLAY', textScale: 2, style: 'coral', name: 'Play again', onPress: () => this.retry() },
    ];
  }

  update(dt: number): void {
    this.t += dt;
    this.app.run.update(dt, true);
  }

  key(code: string): boolean {
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
    ctx.fillStyle = 'rgba(5,3,16,0.7)';
    ctx.fillRect(0, 0, W, H);
    const r = this.result;
    drawText(ctx, 'GAME', W / 2, 26, { scale: 3, align: 'center', color: P.readyRed, shadow: '#5a0716', shadowDepth: 3 });
    drawText(ctx, 'OVER', W / 2, 52, { scale: 3, align: 'center', color: P.readyRed, shadow: '#5a0716', shadowDepth: 3 });
    // Gold score panel
    panel(ctx, 22, 88, 136, 56, P.gold, '#0b0820');
    drawText(ctx, 'SCORE', 56, 95, { align: 'center', color: '#5a2d00' });
    drawText(ctx, 'BEST', 124, 95, { align: 'center', color: '#5a2d00' });
    ctx.fillStyle = '#d98a00';
    ctx.fillRect(90, 94, 1, 42);
    const score = r?.score ?? 0;
    const best = r?.best ?? app.save.best;
    drawText(ctx, String(score), 56, 110, { scale: 2, align: 'center', color: '#ffffff', shadow: '#8a4a00', shadowDepth: 2 });
    drawText(ctx, String(best), 124, 110, { scale: 2, align: 'center', color: '#ffffff', shadow: '#8a4a00', shadowDepth: 2 });
    if (r?.newBest && Math.floor(this.t * 3) % 2 === 0) {
      panel(ctx, 138, 82, 26, 11, P.readyRed);
      drawText(ctx, 'NEW!', 151, 84, { align: 'center', color: '#ffffff' });
    }
    // Sector line
    const reached = r && r.sector >= 0 ? sectorName(r.sector) : '-';
    const bestSec = app.save.bestSector >= 0 ? sectorName(app.save.bestSector) : '-';
    drawText(ctx, `SECTOR ${reached}`, W / 2, 152, { align: 'center', color: '#ffffff', shadow: '#0b0820' });
    drawText(ctx, `BEST SECTOR ${bestSec}`, W / 2, 162, { align: 'center', color: '#c9c3ee', shadow: '#0b0820' });
    // Coin total
    panel(ctx, W / 2 - 34, 176, 68, 16, '#1c1640');
    coinCounter(ctx, W / 2 - 24, 180, app.save.coins);
    if (r && r.coins > 0) drawText(ctx, `+${r.coins}`, W / 2 + 40, 180, { color: P.gold, shadow: '#0b0820' });
  }
}
