import { CONFIG } from '../../config';
import { createPlayer, flip, stepPlayer } from '../../game/player';
import { sectorSpeed } from '../../game/sectors';
import { drawText } from '../../render/font';
import { drawCentered, sprite } from '../../render/sprites';
import type { App, Scene } from '../app';
import { drawHud } from '../hud';
import type { Button } from '../widgets';

const P = CONFIG.palette;
const W = CONFIG.view.width;
const H = CONFIG.view.height;

const START_KEYS = new Set(['Space', 'ArrowUp', 'KeyW', 'Enter']);

/** Pre-computed zig-zag guide: dots along the real movement path with taps at turn points. */
function guidePath(): { dots: [number, number][]; taps: [number, number][] } {
  const p = createPlayer(W / 2, 0);
  const dots: [number, number][] = [];
  const taps: [number, number][] = [];
  const speed = sectorSpeed(0);
  let dist = 0;
  let lastX = p.x;
  let lastY = p.y;
  for (let i = 0; i < 60 * 6 && p.y > -118; i++) {
    if ((p.target === 1 && p.x > W / 2 + 34) || (p.target === -1 && p.x < W / 2 - 34)) {
      flip(p);
      taps.push([p.x, p.y]);
    }
    stepPlayer(p, 1 / 60, speed);
    dist += Math.hypot(p.x - lastX, p.y - lastY);
    lastX = p.x;
    lastY = p.y;
    if (dist >= 5) {
      dist = 0;
      dots.push([p.x, p.y]);
    }
  }
  return { dots, taps };
}

const GUIDE = guidePath();

export class ReadyScene implements Scene {
  private t = 0;
  constructor(private app: App) {}

  enter(): void {
    this.t = 0;
    this.app.newRun();
    this.app.audio.play('game');
    this.app.audio.setLayers(0);
    this.app.audio.duck(true);
  }

  buttons(): Button[] {
    return [];
  }

  update(dt: number): void {
    this.t += dt;
    this.app.run.update(dt, false);
  }

  private start(): void {
    if (this.t < 0.15) return; // ignore the tap that opened this screen
    this.app.audio.sfx('go');
    this.app.audio.duck(false);
    this.app.go('play', true);
  }

  pointerDown(): void {
    this.start();
  }

  key(code: string): boolean {
    if (START_KEYS.has(code)) {
      this.start();
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
    run.draw(ctx, P.readyRed);
    drawHud(ctx, run.world);
    const p = run.world.player;
    const py = p.y - run.cam;
    // Dotted zig-zag guide (animated marching dots)
    const phase = Math.floor(this.t * 8) % 2;
    GUIDE.dots.forEach(([x, y], i) => {
      if (i < 1) return;
      ctx.fillStyle = (i + phase) % 2 === 0 ? '#ffffff' : 'rgba(255,255,255,0.35)';
      ctx.fillRect(Math.round(x), Math.round(py + y), 1, 1);
    });
    for (const [x, y] of GUIDE.taps) {
      const right = x > W / 2;
      drawText(ctx, 'TAP', x + (right ? 5 : -5), py + y - 3, { align: right ? 'left' : 'right', color: P.gold, shadow: '#0b0820' });
    }
    // Facing arrow (orange) to the upper right
    const a = p.heading;
    const ax = p.x + Math.sin(a) * 11;
    const ay = py - Math.cos(a) * 11;
    ctx.fillStyle = P.orange;
    for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(p.x + Math.sin(a) * (6 + i)), Math.round(py - Math.cos(a) * (6 + i)), 1, 1);
    ctx.fillRect(Math.round(ax) - 1, Math.round(ay), 3, 1);
    ctx.fillRect(Math.round(ax), Math.round(ay) - 1, 1, 3);
    ctx.fillRect(Math.round(ax) + 1, Math.round(ay) - 2, 1, 1);
    // READY
    const pop = Math.min(1, this.t * 5);
    drawText(ctx, 'READY', W / 2, 44, { scale: 3, align: 'center', color: P.readyRed, shadow: '#5a0716', shadowDepth: 3, alpha: pop });
    // Tapping finger or mouse
    const cycle = (this.t % 1.0) / 1.0;
    const down = cycle > 0.45 && cycle < 0.65;
    const fy = H - 52 + (down ? 3 : 0);
    if (app.touch) {
      drawCentered(ctx, sprite('finger'), W / 2 + 4, fy);
      if (down) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        const cx = W / 2 - 1;
        const cy = fy - 10;
        for (const [dx, dy] of [
          [-5, 0],
          [5, 0],
          [0, -5],
          [-4, -4],
          [4, -4],
        ])
          ctx.fillRect(cx + dx, cy + dy, 1, 1);
      }
    } else {
      drawCentered(ctx, sprite(down ? 'mouseClick' : 'mouse'), W / 2, fy);
      drawText(ctx, 'CLICK OR SPACE', W / 2, fy + 10, { align: 'center', color: '#c9c3ee', shadow: '#0b0820' });
    }
  }
}
