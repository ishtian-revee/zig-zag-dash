import { CONFIG } from '../../config';
import { applyRun, type RunResult } from '../../game/progress';
import { drawText } from '../../render/font';
import type { App, Scene } from '../app';
import { drawHud, pauseButton } from '../hud';
import type { Button } from '../widgets';

const W = CONFIG.view.width;
const P = CONFIG.palette;
const TAP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);

export class PlayScene implements Scene {
  private goT = 0;
  private ended = false;
  lastResult: RunResult | null = null;
  private pauseBtn: Button;

  constructor(private app: App) {
    this.pauseBtn = pauseButton(() => this.pause());
  }

  enter(from: string | null): void {
    if (from === 'pause') return;
    this.goT = CONFIG.ui.goTime;
    this.ended = false;
    this.app.audio.duck(false);
  }

  buttons(): Button[] {
    return this.app.run.world.dead ? [] : [this.pauseBtn];
  }

  pause(): void {
    if (this.app.run.world.dead) return;
    this.app.go('pause', true);
  }

  update(dt: number): void {
    const run = this.app.run;
    if (this.goT > 0) this.goT -= dt;
    run.update(dt, true);
    const w = run.world;
    if (w.dead && !this.ended && w.deathTime >= CONFIG.death.gameOverDelay) {
      this.ended = true;
      this.finish();
    }
  }

  private finish(): void {
    this.record(false);
    this.app.go('gameover');
  }

  /** Save the current run's results (also used when quitting from the pause menu). */
  record(quit: boolean): void {
    const app = this.app;
    const w = app.run.world;
    this.lastResult = applyRun(
      app.save,
      { score: w.score, coins: w.coins, gems: w.gems, sector: w.sector, playTime: app.run.playTime },
      quit,
    );
    app.persist();
    if (quit) for (const c of this.lastResult.unlocked) app.toast(`NEW CHARACTER: ${c.name}!`, P.gold);
  }

  pointerDown(): void {
    this.app.run.tap();
  }

  key(code: string): boolean {
    if (TAP_KEYS.has(code)) {
      this.app.run.tap();
      return true;
    }
    if (code === 'Escape' || code === 'KeyP') {
      this.pause();
      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const run = this.app.run;
    const w = run.world;
    run.draw(ctx, w.sector >= 0 ? this.app.accent(w.sector) : P.readyRed);
    drawHud(ctx, w);
    if (this.goT > 0) {
      const t = this.goT / CONFIG.ui.goTime;
      drawText(ctx, 'GO', W / 2, 60 - (1 - t) * 10, { scale: 4, align: 'center', color: P.cyan, shadow: '#0a5a66', shadowDepth: 3, alpha: Math.min(1, t * 2.5) });
    }
    if (w.dead) {
      const k = Math.min(1, w.deathTime / CONFIG.death.gameOverDelay);
      ctx.fillStyle = `rgba(5,3,16,${k * 0.55})`;
      ctx.fillRect(0, 0, W, CONFIG.view.height);
    }
  }
}
