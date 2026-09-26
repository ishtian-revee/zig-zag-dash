import { CONFIG } from '../config';
import { hueShift, rgba } from './art';
import { makeCanvas } from './sprites';

const W = CONFIG.view.width;
const H = CONFIG.view.height;

function hash(n: number): number {
  n = (n ^ 61) ^ (n >>> 16);
  n = (n + (n << 3)) | 0;
  n ^= n >>> 4;
  n = Math.imul(n, 0x27d4eb2d);
  n ^= n >>> 15;
  return (n >>> 0) / 4294967296;
}

const SPARK_COLORS = ['#ff6fd0', '#3dff5a', '#ffe14d', '#3aa0ff', '#f4f4ff', '#3ff0ff'];

/** Deep indigo gradient, nebula bands with parallax, twinkling sparkles, sector hue shift. */
export class Background {
  private hue = 0;
  private targetHue = 0;
  private gradKey = '';
  private grad: HTMLCanvasElement = makeCanvas(1, H);

  setHue(deg: number, instant = false): void {
    this.targetHue = deg;
    if (instant) this.hue = deg;
  }

  update(dt: number): void {
    this.hue += (this.targetHue - this.hue) * Math.min(1, dt * 1.5);
  }

  private gradient(): HTMLCanvasElement {
    const key = Math.round(this.hue / 2).toString();
    if (key !== this.gradKey) {
      this.gradKey = key;
      const h = Math.round(this.hue / 2) * 2;
      const c = makeCanvas(1, H);
      const g = c.getContext('2d')!;
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, hueShift(CONFIG.palette.bgTop, h));
      gr.addColorStop(1, hueShift(CONFIG.palette.bgBottom, h));
      g.fillStyle = gr;
      g.fillRect(0, 0, 1, H);
      this.grad = c;
    }
    return this.grad;
  }

  /** camY: world y of the screen top (scroll position); time for twinkle. */
  draw(ctx: CanvasRenderingContext2D, camY: number, time: number, reduce: boolean): void {
    ctx.drawImage(this.gradient(), 0, 0, W, H);
    this.bands(ctx, camY * 0.35, 'rgba(6,4,22,0.42)', 150, 11);
    this.bands(ctx, camY * 0.6, 'rgba(10,6,34,0.35)', 110, 23);
    this.stars(ctx, camY * 0.25, time, 22, 1, reduce);
    this.stars(ctx, camY * 0.5, time, 14, 2, reduce);
  }

  private bands(ctx: CanvasRenderingContext2D, scroll: number, color: string, spacing: number, salt: number): void {
    ctx.fillStyle = color;
    const first = Math.floor(scroll / spacing) - 1;
    for (let i = first; i <= first + Math.ceil(H / spacing) + 2; i++) {
      const r = hash(i * 7919 + salt);
      if (r < 0.25) continue;
      const cy = i * spacing - scroll + r * spacing * 0.5;
      const thick = 10 + r * 26;
      const phase = r * 50;
      for (let x = 0; x < W; x += 4) {
        const wob = Math.sin(x * 0.045 + phase) * 4 + Math.sin(x * 0.11 + phase * 2) * 2;
        const top = Math.round(cy + wob);
        const h = Math.round(thick + Math.sin(x * 0.07 + phase) * 4);
        ctx.fillRect(x, top, 4, h);
        // Softer fringe
        ctx.fillRect(x, top - 2, 4, 1);
        ctx.fillRect(x, top + h + 1, 4, 1);
      }
    }
  }

  private stars(ctx: CanvasRenderingContext2D, scroll: number, time: number, perTile: number, layer: number, reduce: boolean): void {
    const tile = 160;
    const first = Math.floor(scroll / tile);
    for (let t = first; t <= first + Math.ceil(H / tile) + 1; t++) {
      for (let k = 0; k < perTile; k++) {
        const seed = t * 1009 + k * 31 + layer * 100003;
        const x = Math.floor(hash(seed) * W);
        const y = Math.round(t * tile + hash(seed + 1) * tile - scroll);
        if (y < -2 || y > H + 2) continue;
        const col = SPARK_COLORS[Math.floor(hash(seed + 2) * SPARK_COLORS.length)];
        const tw = reduce ? 0.6 : 0.5 + 0.5 * Math.sin(time * (1 + hash(seed + 3) * 2.5) + hash(seed + 4) * 20);
        const big = layer === 2 && hash(seed + 5) > 0.55;
        ctx.fillStyle = tw > 0.25 ? col : rgba(col, 0.4);
        ctx.fillRect(x, y, 1, 1);
        if (big && tw > 0.6) {
          ctx.fillStyle = rgba(col, 0.7);
          ctx.fillRect(x - 1, y, 1, 1);
          ctx.fillRect(x + 1, y, 1, 1);
          ctx.fillRect(x, y - 1, 1, 1);
          ctx.fillRect(x, y + 1, 1, 1);
          if (tw > 0.9) {
            ctx.fillStyle = rgba(col, 0.35);
            ctx.fillRect(x - 2, y, 1, 1);
            ctx.fillRect(x + 2, y, 1, 1);
            ctx.fillRect(x, y - 2, 1, 1);
            ctx.fillRect(x, y + 2, 1, 1);
          }
        }
      }
    }
  }
}
