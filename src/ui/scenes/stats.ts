import { CONFIG } from '../../config';
import { sectorName } from '../../game/sectors';
import { drawText } from '../../render/font';
import type { App, Scene } from '../app';
import { panel, type Button } from '../widgets';

const W = CONFIG.view.width;

function formatTime(sec: number): string {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}

export class StatsScene implements Scene {
  constructor(private app: App) {}

  enter(): void {
    const s = this.app.save;
    this.app.announce(`Stats. Runs ${s.stats.runs}. Best score ${s.best}. Total coins ${s.stats.totalCoins}.`);
  }

  buttons(): Button[] {
    return [{ id: 'stats-back', x: W / 2 - 30, y: 272, w: 60, h: 24, icon: 'back', label: 'BACK', style: 'blue', onPress: () => this.back() }];
  }

  update(): void {}

  back(): void {
    this.app.go('menu');
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const app = this.app;
    const s = app.save;
    app.bg.draw(ctx, -app.time * 8, app.time, s.settings.reduceEffects);
    ctx.fillStyle = 'rgba(5,3,16,0.45)';
    ctx.fillRect(0, 0, W, CONFIG.view.height);
    drawText(ctx, 'STATS', W / 2, 18, { scale: 2, align: 'center', color: '#ffffff', shadow: '#0b0820', shadowDepth: 2 });
    const rows: [string, string][] = [
      ['RUNS', String(s.stats.runs)],
      ['BEST SCORE', String(s.best)],
      ['BEST SECTOR', s.bestSector >= 0 ? sectorName(s.bestSector) : '-'],
      ['TOTAL COINS', String(s.stats.totalCoins)],
      ['TOTAL GEMS', String(s.stats.totalGems)],
      ['TOTAL SCORE', String(s.stats.totalScore)],
      ['PLAY TIME', formatTime(s.stats.playTimeSec)],
      ['CHARACTERS', `${s.unlocked.length}/12`],
    ];
    panel(ctx, 16, 50, W - 32, rows.length * 20 + 10, '#1c1640');
    rows.forEach(([k, v], i) => {
      const y = 58 + i * 20;
      drawText(ctx, k, 26, y, { color: '#c9c3ee' });
      drawText(ctx, v, W - 26, y, { color: '#ffffff', align: 'right' });
      if (i < rows.length - 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(24, y + 13, W - 48, 1);
      }
    });
  }
}
