import { CONFIG } from '../../config';
import { easeOutBack } from '../../core/math';
import { emitterSprite, glow, planetSprite } from '../../render/art';
import { drawText } from '../../render/font';
import { charSprite, drawCentered, gemSprite, icon, sprite } from '../../render/sprites';
import type { App, Scene } from '../app';
import { panel, type Button } from '../widgets';

const W = CONFIG.view.width;
const P = CONFIG.palette;

const PANEL_Y = [34, 118, 202];
const PANEL_H = 76;
const STAGGER = 0.45;

export class TutorialScene implements Scene {
  private t = 0;
  constructor(private app: App) {}

  enter(): void {
    this.t = 0;
    this.app.announce('How to play. Tap to switch direction. Grab gems for points; coins unlock characters. Avoid walls and objects.');
  }

  private done(): void {
    this.app.save.tutorialSeen = true;
    this.app.persist();
    this.app.go('ready');
  }

  buttons(): Button[] {
    if (this.t < STAGGER * 3) return [];
    return [{ id: 'tut-play', x: W / 2 - 40, y: 286, w: 80, h: 26, icon: 'play', label: 'PLAY', textScale: 2, style: 'coral', name: 'Play', onPress: () => this.done() }];
  }

  update(dt: number): void {
    this.t += dt;
  }

  key(code: string): boolean {
    if ((code === 'Space' || code === 'Enter') && this.t > 0.3) {
      if (this.t < STAGGER * 3) this.t = STAGGER * 3 + 0.3;
      else this.done();
      return true;
    }
    return false;
  }

  pointerDown(): void {
    // Tapping anywhere skips the intro animation.
    if (this.t < STAGGER * 3) this.t = STAGGER * 3 + 0.3;
  }

  back(): void {
    this.app.go('menu');
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#05030f';
    ctx.fillRect(0, 0, W, CONFIG.view.height);
    drawText(ctx, 'HOW TO PLAY', W / 2, 10, { scale: 2, align: 'center', color: P.cyan, shadow: '#0a5a66', shadowDepth: 2 });
    for (let i = 0; i < 3; i++) {
      const k = (this.t - i * STAGGER) / 0.35;
      if (k <= 0) continue;
      const e = easeOutBack(Math.min(1, k));
      const dir = i % 2 === 0 ? -1 : 1;
      const x = 10 + (1 - e) * dir * 190;
      ctx.save();
      ctx.translate(Math.round(x - 10), 0);
      this.panelN(ctx, i, PANEL_Y[i]);
      ctx.restore();
    }
  }

  private panelN(ctx: CanvasRenderingContext2D, i: number, y: number): void {
    const t = this.app.time;
    panel(ctx, 10, y, W - 20, PANEL_H, '#140f2e', '#3a3170', false);
    ctx.fillStyle = '#3a3170';
    ctx.fillRect(10, y, W - 20, 1);
    const head = (text: string, yy: number) => drawText(ctx, text, W / 2, yy, { align: 'center', color: P.orange, shadow: '#0b0820' });
    if (i === 0) {
      head('TAP TO SWITCH DIRECTION', y + 5);
      // Mini starfield with a zig-zagging character
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let s = 0; s < 14; s++) ctx.fillRect(18 + ((s * 37) % 140), y + 18 + ((s * 23) % 52), 1, 1);
      // Faint zig-zag guide
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let d = 0; d < 70; d += 3) {
        ctx.fillRect(44 + d, y + 56 - Math.round(d * 0.45), 1, 1);
        ctx.fillRect(114 - d, y + 24 + 8 - Math.round(d * 0.1), 1, 1);
      }
      const period = 1.6;
      const ph = (t % period) / period;
      const tri = ph < 0.5 ? ph * 2 : 2 - ph * 2;
      const cx = 44 + tri * 70;
      const cy = y + 54 - ((t * 10) % 6);
      // Dotted path trail
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let d = 1; d < 8; d++) {
        const p2 = ph - d * 0.03;
        const pp = ((p2 % 1) + 1) % 1;
        const tr = pp < 0.5 ? pp * 2 : 2 - pp * 2;
        ctx.fillRect(Math.round(44 + tr * 70), Math.round(cy + d * 2), 1, 1);
      }
      drawCentered(ctx, charSprite('zip'), cx, cy);
      // Tapping finger / cursor that taps at the turn points
      const near = Math.min(Math.abs(ph - 0.5), ph, 1 - ph) < 0.06;
      if (this.app.touch) drawCentered(ctx, sprite('finger'), 148, y + 56 + (near ? 2 : 0));
      else drawCentered(ctx, sprite(near ? 'mouseClick' : 'mouse'), 148, y + 54);
      if (near) drawText(ctx, 'TAP!', 148, y + 34, { align: 'center', color: '#ffffff' });
    } else if (i === 1) {
      head('GRAB GEMS FOR POINTS', y + 5);
      const gy = y + 26;
      ([1, 2, 3] as const).forEach((v, k) => {
        const gx = 36 + k * 50;
        const bob = Math.round(Math.sin(t * 3 + k) * 1);
        drawCentered(ctx, gemSprite(v), gx, gy + bob);
        drawText(ctx, `×${v}`, gx + 7, gy - 3, { color: '#ffffff' });
      });
      // Diagonal divider
      ctx.fillStyle = '#3a3170';
      for (let d = 0; d < 140; d += 2) ctx.fillRect(20 + d, y + 42 - Math.floor(d / 20), 1, 1);
      head('COINS UNLOCK CHARACTERS', y + 48);
      for (let k = 0; k < 5; k++) {
        const sx = Math.cos(t * 5 + k);
        drawCentered(ctx, sprite('coin'), 62 + k * 12, y + 65, Math.max(1 / 7, Math.round(Math.abs(sx) * 7) / 7), 1);
      }
      drawCentered(ctx, charSprite('donut'), 130, y + 65);
    } else {
      head('AVOID WALLS AND OBJECTS', y + 5);
      // Wall
      ctx.fillStyle = P.readyRed;
      ctx.fillRect(22, y + 18, 1, 52);
      ctx.fillStyle = 'rgba(255,45,74,0.3)';
      ctx.fillRect(23, y + 18, 2, 52);
      // Planet
      ctx.drawImage(glow(P.magenta, 22, 0.35), 60 - 22, y + 44 - 22);
      drawCentered(ctx, planetSprite(12, 'magenta', false, 2), 60, y + 44);
      // Laser with emitters
      const lx0 = 104;
      const lx1 = 150;
      const ly = y + 44;
      ctx.fillStyle = 'rgba(61,255,90,0.35)';
      ctx.fillRect(lx0, ly - 1, lx1 - lx0, 3);
      ctx.fillStyle = '#d8ffe0';
      ctx.fillRect(lx0, ly, lx1 - lx0, 1);
      for (const ex of [lx0, lx1]) {
        ctx.drawImage(emitterSprite(7), ex - 3, ly - 3);
        ctx.fillStyle = P.readyRed;
        ctx.fillRect(ex - 1, ly - 1, 2, 2);
      }
      // Red crosses
      const blink = Math.floor(t * 3) % 2 === 0;
      if (blink) {
        drawCentered(ctx, icon('cross', P.readyRed), 34, y + 30);
        drawCentered(ctx, icon('cross', P.readyRed), 76, y + 30);
        drawCentered(ctx, icon('cross', P.readyRed), 127, y + 32);
      }
    }
  }
}
