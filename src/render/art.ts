// Procedural pixel art: planets, rings, moons, asteroids, glows. Cached by (type, size, colour, variant).
import { CONFIG } from '../config';
import { Rng } from '../core/rng';
import type { ColorName } from '../game/entities';
import { makeCanvas } from './sprites';

const cache = new Map<string, HTMLCanvasElement>();
function cached(key: string, make: () => HTMLCanvasElement): HTMLCanvasElement {
  let c = cache.get(key);
  if (!c) {
    c = make();
    cache.set(key, c);
  }
  return c;
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
export function shade(hex: string, f: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (f >= 0) return rgbToHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
  return rgbToHex(r * (1 + f), g * (1 + f), b * (1 + f));
}
export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/** Rotate a colour's hue by `deg`. */
export function hueShift(hex: string, deg: number): string {
  if (!deg) return hex;
  const [r0, g0, b0] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r0, g0, b0);
  const min = Math.min(r0, g0, b0);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r0 ? (g0 - b0) / d + (g0 < b0 ? 6 : 0) : max === g0 ? (b0 - r0) / d + 2 : (r0 - g0) / d + 4;
    h /= 6;
  }
  h = (((h * 360 + deg) % 360) + 360) % 360 / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return s === 0 ? rgbToHex(l * 255, l * 255, l * 255) : rgbToHex(f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255);
}

export function planetHex(c: ColorName): string {
  return CONFIG.palette[c];
}

/** Soft radial glow sprite (diameter = 2 × radius). */
export function glow(color: string, radius: number, alpha = 0.35): HTMLCanvasElement {
  const r = Math.max(2, Math.round(radius));
  return cached(`glow:${color}:${r}:${alpha}`, () => {
    const c = makeCanvas(r * 2, r * 2);
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, rgba(color, alpha));
    grad.addColorStop(0.45, rgba(color, alpha * 0.45));
    grad.addColorStop(1, rgba(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, r * 2, r * 2);
    return c;
  });
}

/** Pixel disc body with craters, rim jaggies and lighting. */
function paintBody(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, base: string, rng: Rng, craters: number): void {
  const light = shade(base, 0.35);
  const dark = shade(base, -0.35);
  const darker = shade(base, -0.55);
  const R = Math.ceil(r);
  const crs: [number, number, number][] = [];
  for (let i = 0; i < craters; i++) {
    const a = rng.range(0, Math.PI * 2);
    const d = rng.range(0, r * 0.7);
    crs.push([Math.cos(a) * d, Math.sin(a) * d, rng.range(r * 0.1, r * 0.24) + 0.6]);
  }
  for (let y = -R; y <= R; y++) {
    for (let x = -R; x <= R; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const d = Math.hypot(px, py);
      if (d > r) continue;
      // Jagged rim: drop some edge pixels
      if (d > r - 1 && rng.chance(0.35)) continue;
      let col = base;
      // Light from the top-left
      const lit = (-px - py) / (r * 1.414);
      if (lit > 0.45) col = (x + y) % 2 === 0 || lit > 0.65 ? light : base;
      else if (lit < -0.35) col = (x + y) % 2 === 0 || lit < -0.55 ? dark : base;
      for (const [ccx, ccy, cr] of crs) {
        const cd = Math.hypot(px - ccx, py - ccy);
        if (cd < cr) col = cd > cr - 1 ? darker : dark;
      }
      g.fillStyle = col;
      g.fillRect(cx + x, cy + y, 1, 1);
    }
  }
}

function paintRing(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, front: boolean): void {
  const R = r * 1.75;
  const tilt = -0.35;
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const n = Math.ceil(R * 8);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const isFront = Math.sin(a) > 0;
    if (isFront !== front) continue;
    for (const rr of [R, R - 1.2]) {
      const ex = Math.cos(a) * rr;
      const ey = Math.sin(a) * rr * 0.32;
      const x = ex * ct - ey * st;
      const y = ex * st + ey * ct;
      g.fillStyle = rr === R ? '#f4f4ff' : '#c9c3ee';
      g.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
    }
  }
}

/** Planet sprite (with optional ring). Returned canvas is centred on the planet. */
export function planetSprite(r: number, color: ColorName, ring: boolean, seed: number): HTMLCanvasElement {
  const rr = Math.round(r);
  const variant = seed % 6;
  return cached(`planet:${rr}:${color}:${ring}:${variant}`, () => {
    const pad = ring ? Math.ceil(rr * 0.9) + 2 : 2;
    const size = rr * 2 + pad * 2;
    const c = makeCanvas(size, size);
    const g = c.getContext('2d')!;
    const cx = Math.floor(size / 2);
    const rng = new Rng(seed * 31 + rr);
    if (ring) paintRing(g, cx, cx, rr, false);
    paintBody(g, cx, cx, rr, planetHex(color), rng, Math.max(2, Math.round(rr / 5)));
    if (ring) paintRing(g, cx, cx, rr, true);
    return c;
  });
}

export function moonSprite(r: number, seed: number): HTMLCanvasElement {
  const rr = Math.max(2, Math.round(r));
  const variant = seed % 4;
  return cached(`moon:${rr}:${variant}`, () => {
    const size = rr * 2 + 2;
    const c = makeCanvas(size, size);
    const g = c.getContext('2d')!;
    paintBody(g, Math.floor(size / 2), Math.floor(size / 2), rr, '#dcdcf0', new Rng(seed + rr), Math.max(1, Math.round(rr / 3)));
    return c;
  });
}

export function asteroidSprite(r: number, seed: number): HTMLCanvasElement {
  const rr = Math.max(2, Math.round(r));
  const variant = seed % 6;
  return cached(`ast:${rr}:${variant}`, () => {
    const size = rr * 2 + 3;
    const c = makeCanvas(size, size);
    const g = c.getContext('2d')!;
    const rng = new Rng(variant * 97 + rr);
    const lobes = [rng.range(0.75, 1.15), rng.range(0.75, 1.15), rng.range(0.75, 1.15), rng.range(0.75, 1.15), rng.range(0.75, 1.15)];
    const cx = size / 2;
    const base = CONFIG.palette.grey;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cx;
        const a = Math.atan2(dy, dx);
        const t = ((a + Math.PI) / (Math.PI * 2)) * lobes.length;
        const i = Math.floor(t) % lobes.length;
        const f = t - Math.floor(t);
        const k = lobes[i] * (1 - f) + lobes[(i + 1) % lobes.length] * f;
        const d = Math.hypot(dx, dy);
        if (d > (rr + 0.4) * k) continue;
        const lit = (-dx - dy) / (rr * 1.4);
        g.fillStyle = lit > 0.35 ? shade(base, 0.25) : lit < -0.3 ? shade(base, -0.35) : base;
        g.fillRect(x, y, 1, 1);
      }
    }
    // A pit or two
    g.fillStyle = shade(base, -0.45);
    g.fillRect(Math.floor(cx), Math.floor(cx - 1), 1, 1);
    if (rr > 2) g.fillRect(Math.floor(cx - 1), Math.floor(cx + 1), 1, 1);
    return c;
  });
}

/** The big moon landmark: an original sleepy face with a nightcap. */
export function bigMoonSprite(r: number): HTMLCanvasElement {
  const rr = Math.round(r);
  return cached(`bigmoon:${rr}`, () => {
    const size = rr * 2 + 14;
    const c = makeCanvas(size, size);
    const g = c.getContext('2d')!;
    const cx = Math.floor(size / 2);
    const cy = Math.floor(size / 2) + 3;
    paintBody(g, cx, cy, rr, '#ececfa', new Rng(7 + rr), 0);
    // Craters off to the side (away from the face)
    const px = (x: number, y: number, w: number, h: number, col: string) => {
      g.fillStyle = col;
      g.fillRect(cx + x, cy + y, w, h);
    };
    const cr = '#c3c3dc';
    px(-Math.round(rr * 0.7), -Math.round(rr * 0.35), 4, 3, cr);
    px(Math.round(rr * 0.55), Math.round(rr * 0.45), 3, 3, cr);
    px(-Math.round(rr * 0.45), Math.round(rr * 0.6), 3, 2, cr);
    // Sleepy closed eyes: downward arcs
    const ey = -Math.round(rr * 0.12);
    const ex = Math.round(rr * 0.33);
    const eye = '#2a2350';
    for (const s of [-1, 1]) {
      const x0 = s * ex - 3;
      px(x0, ey, 1, 1, eye);
      px(x0 + 1, ey + 1, 5, 1, eye);
      px(x0 + 6, ey, 1, 1, eye);
      // eyelashes
      px(x0 + 1, ey + 2, 1, 1, eye);
      px(x0 + 5, ey + 2, 1, 1, eye);
    }
    // Rosy cheeks
    const blush = '#ff9ad0';
    px(-ex - 5, ey + 5, 4, 2, blush);
    px(ex + 1, ey + 5, 4, 2, blush);
    // Small wavy smile
    const my = Math.round(rr * 0.3);
    px(-3, my, 1, 1, eye);
    px(-2, my + 1, 2, 1, eye);
    px(0, my, 1, 1, eye);
    px(1, my + 1, 2, 1, eye);
    px(3, my, 1, 1, eye);
    // Striped nightcap on the top-right with a pom-pom
    const capCol = ['#3aa0ff', '#f4f4ff'];
    for (let i = 0; i < 12; i++) {
      const w = 12 - i;
      g.fillStyle = capCol[Math.floor(i / 2) % 2];
      g.fillRect(cx + Math.round(rr * 0.15) + i, cy - rr - 3 + Math.floor(i * 0.6), w, 2);
    }
    g.fillStyle = '#ffe14d';
    g.fillRect(cx + Math.round(rr * 0.15) + 12, cy - rr + 3, 3, 3);
    return c;
  });
}

/** Bubble (shield) sprite: pixel ring with a highlight. */
export function bubbleSprite(r: number, color: string): HTMLCanvasElement {
  const rr = Math.round(r);
  return cached(`bubble:${rr}:${color}`, () => {
    const size = rr * 2 + 2;
    const c = makeCanvas(size, size);
    const g = c.getContext('2d')!;
    const cx = size / 2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cx);
        if (d > rr) continue;
        if (d > rr - 1) g.fillStyle = color;
        else g.fillStyle = rgba(color, 0.18);
        g.fillRect(x, y, 1, 1);
      }
    }
    g.fillStyle = '#ffffff';
    g.fillRect(Math.round(cx - rr * 0.5), Math.round(cx - rr * 0.55), 2, 1);
    g.fillRect(Math.round(cx - rr * 0.6), Math.round(cx - rr * 0.35), 1, 2);
    return c;
  });
}

/** Emitter block sprite (dark mechanical box). */
export function emitterSprite(size: number): HTMLCanvasElement {
  return cached(`emitter:${size}`, () => {
    const c = makeCanvas(size, size);
    const g = c.getContext('2d')!;
    g.fillStyle = '#4a4468';
    g.fillRect(0, 0, size, size);
    g.fillStyle = '#2a2640';
    g.fillRect(1, 1, size - 2, size - 2);
    g.fillStyle = '#6a6490';
    g.fillRect(1, 1, size - 2, 1);
    g.fillStyle = '#16132a';
    g.fillRect(0, size - 1, size, 1);
    return c;
  });
}
