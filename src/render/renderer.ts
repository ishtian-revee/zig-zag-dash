import { CONFIG } from '../config';
import { emitterNodes, laserSegments, type Ent } from '../game/entities';
import { sectorName, sectorStart } from '../game/sectors';
import type { World } from '../game/world';
import { asteroidSprite, bigMoonSprite, bubbleSprite, emitterSprite, glow, moonSprite, planetHex, planetSprite, rgba } from './art';
import { drawText, textWidth } from './font';
import { charSprite, drawCentered, gemSprite, makeCanvas, sprite } from './sprites';

const W = CONFIG.view.width;
const H = CONFIG.view.height;
const P = CONFIG.palette;

export interface ViewState {
  /** Screen shake offset. */
  shakeX: number;
  shakeY: number;
  character: string;
  wallColor: string;
  reduceEffects: boolean;
  /** Draw the player sprite. */
  showPlayer: boolean;
}

const whiteCache = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
function whiteOf(img: HTMLCanvasElement): HTMLCanvasElement {
  let c = whiteCache.get(img);
  if (!c) {
    c = makeCanvas(img.width, img.height);
    const g = c.getContext('2d')!;
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, c.width, c.height);
    whiteCache.set(img, c);
  }
  return c;
}

/** Pixel line (1px) between two points. */
export function pixelLine(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number): void {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay))));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    ctx.fillRect(Math.round(ax + (bx - ax) * t), Math.round(ay + (by - ay) * t), 1, 1);
  }
}

export function drawWalls(ctx: CanvasRenderingContext2D, color: string, time: number, reduce: boolean): void {
  const inset = CONFIG.field.wallInset;
  const pulse = reduce ? 0.3 : 0.25 + 0.1 * Math.sin(time * 3);
  for (const x of [inset - 1, W - inset]) {
    const dir = x < W / 2 ? 1 : -1;
    for (let i = 1; i <= 4; i++) {
      ctx.fillStyle = rgba(color, pulse * (1 - i / 5));
      ctx.fillRect(x + dir * i, 0, 1, H);
    }
    ctx.fillStyle = color;
    ctx.fillRect(x, 0, 1, H);
    ctx.fillStyle = rgba('#ffffff', 0.5);
    ctx.fillRect(x, 0, 1, H);
    ctx.fillStyle = color;
    ctx.fillRect(x - dir, 0, 1, H);
  }
}

/** Dotted full-width sector line with the name in the middle (screen y). */
export function drawSectorLine(ctx: CanvasRenderingContext2D, y: number, name: string): void {
  const tw = textWidth(name) + 8;
  const gap0 = W / 2 - tw / 2;
  const gap1 = W / 2 + tw / 2;
  ctx.fillStyle = rgba('#ffffff', 0.85);
  for (let x = 4; x < W - 4; x += 4) {
    if (x + 2 > gap0 && x < gap1) continue;
    ctx.fillRect(x, Math.round(y), 2, 1);
  }
  drawText(ctx, name, W / 2, y - 3, { align: 'center', color: '#ffffff', shadow: '#140f2e' });
}

export function drawEntity(ctx: CanvasRenderingContext2D, e: Ent, cam: number, time: number): void {
  const x = e.x;
  const y = e.y - cam;
  const flash = e.flash > 0;
  switch (e.kind) {
    case 'planet': {
      const img = planetSprite(e.r, e.color, e.ring, e.seed);
      drawCentered(ctx, flash ? whiteOf(img) : img, x, y);
      break;
    }
    case 'moon': {
      const img = moonSprite(e.r, e.seed);
      drawCentered(ctx, flash ? whiteOf(img) : img, x, y);
      break;
    }
    case 'bigmoon': {
      const img = bigMoonSprite(e.r);
      drawCentered(ctx, flash ? whiteOf(img) : img, x, y - 3);
      break;
    }
    case 'asteroid': {
      const img = asteroidSprite(e.r, e.seed);
      drawCentered(ctx, flash ? whiteOf(img) : img, x, y);
      break;
    }
    case 'coin': {
      const img = sprite('coin');
      const sx = Math.cos(time * 5 + e.seed * 0.01);
      const w = Math.max(1 / 7, Math.round(Math.abs(sx) * 7) / 7);
      drawCentered(ctx, img, x, y, w, 1);
      break;
    }
    case 'gem': {
      const bob = Math.round(Math.sin(time * 3 + e.seed * 0.01) * 1);
      drawCentered(ctx, gemSprite(e.value), x, y + bob);
      if (Math.sin(time * 4 + e.seed) > 0.92) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(x) + 2, Math.round(y) - 3 + bob, 1, 1);
      }
      break;
    }
    case 'magnet': {
      const bob = Math.round(Math.sin(time * 3) * 1.5);
      ctx.drawImage(glow(P.readyRed, 10, 0.35), Math.round(x) - 10, Math.round(y) - 10 + bob);
      drawCentered(ctx, sprite('magnet'), x, y + bob);
      break;
    }
    case 'shield': {
      const bob = Math.round(Math.sin(time * 3) * 1.5);
      ctx.drawImage(glow(P.cyan, 10, 0.35), Math.round(x) - 10, Math.round(y) - 10 + bob);
      drawCentered(ctx, bubbleSprite(5, P.cyan), x, y + bob);
      break;
    }
    case 'laser':
    case 'spinner':
      drawLaser(ctx, e, cam, time);
      break;
    case 'rocket':
      if (e.state === 2) drawRocket(ctx, e, cam, time);
      break;
  }
}

function drawLaser(ctx: CanvasRenderingContext2D, e: Ent, cam: number, time: number): void {
  const flick = 0.75 + 0.25 * Math.sin(time * 40 + e.seed);
  const segs = laserSegments(e);
  ctx.lineCap = 'round';
  for (const [ax, ay, bx, by] of segs) {
    ctx.strokeStyle = rgba(P.green, 0.18 * flick);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(ax, ay - cam);
    ctx.lineTo(bx, by - cam);
    ctx.stroke();
    ctx.strokeStyle = rgba(P.green, 0.55);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ax, ay - cam);
    ctx.lineTo(bx, by - cam);
    ctx.stroke();
    ctx.fillStyle = '#d8ffe0';
    pixelLine(ctx, ax, ay - cam, bx, by - cam);
  }
  if (e.kind === 'spinner') {
    for (const [ax, ay, bx, by] of segs) {
      for (const [px, py] of [
        [ax, ay],
        [bx, by],
      ]) {
        ctx.drawImage(glow(P.green, 5, 0.6), Math.round(px) - 5, Math.round(py - cam) - 5);
        ctx.fillStyle = '#d8ffe0';
        ctx.fillRect(Math.round(px) - 1, Math.round(py - cam) - 1, 2, 2);
      }
    }
  }
  const blink = Math.sin(time * 6 + e.seed) > 0;
  const size = e.kind === 'spinner' ? 9 : 7;
  for (const n of emitterNodes(e)) {
    const nx = Math.round(n.x);
    const ny = Math.round(n.y - cam);
    ctx.drawImage(glow(P.green, 7, 0.5), nx - 7, ny - 7);
    const img = emitterSprite(size);
    ctx.drawImage(img, nx - (size >> 1), ny - (size >> 1));
    ctx.fillStyle = blink ? P.readyRed : '#7a1020';
    ctx.fillRect(nx - 1, ny - 1, 2, 2);
    if (e.flash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(nx - (size >> 1), ny - (size >> 1), size, size);
    }
  }
}

function drawRocket(ctx: CanvasRenderingContext2D, e: Ent, cam: number, time: number): void {
  const a = Math.atan2(e.vy, e.vx);
  ctx.save();
  ctx.translate(Math.round(e.x), Math.round(e.y - cam));
  ctx.rotate(a);
  // Flame
  const f = Math.floor(time * 20) % 2;
  ctx.fillStyle = '#ffe14d';
  ctx.fillRect(-8, -1, 3, 3);
  ctx.fillStyle = '#ff8a1f';
  ctx.fillRect(-10 - f, 0, 2 + f, 1);
  ctx.fillRect(-9, -1, 1, 1);
  ctx.fillRect(-9, 1, 1, 1);
  ctx.drawImage(sprite('rocket'), -5, -2);
  ctx.restore();
}

/** Glows behind planets (drawn before entities). */
function drawGlows(ctx: CanvasRenderingContext2D, ents: readonly Ent[], cam: number): void {
  for (const e of ents) {
    if (e.kind !== 'planet' && e.kind !== 'bigmoon') continue;
    const y = e.y - cam;
    if (y < -e.r * 3 || y > H + e.r * 3) continue;
    const col = e.kind === 'planet' ? planetHex(e.color) : '#c9c3ee';
    const gr = Math.round(e.r * 2.4);
    ctx.drawImage(glow(col, gr, 0.3), Math.round(e.x) - gr, Math.round(y) - gr);
  }
}

export function drawWorld(ctx: CanvasRenderingContext2D, w: World, cam: number, v: ViewState): void {
  drawGlows(ctx, w.ents, cam);

  // Sector lines in view
  for (let i = Math.max(0, w.sector - 1); i <= w.sector + 2; i++) {
    const sy = w.startY - sectorStart(i) - cam;
    if (sy > -10 && sy < H + 10) drawSectorLine(ctx, sy, sectorName(i));
  }

  for (const e of w.ents) {
    const top = e.kind === 'laser' ? Math.min(...e.nodes.map((n) => n.y)) : e.y - (e.kind === 'spinner' ? e.len : e.r) - 12;
    const bottom = e.kind === 'laser' ? Math.max(...e.nodes.map((n) => n.y)) : e.y + (e.kind === 'spinner' ? e.len : e.r) + 12;
    if (bottom - cam < -10 || top - cam > H + 10) continue;
    drawEntity(ctx, e, cam, w.time);
  }

  // Player
  if (v.showPlayer && !w.dead) {
    const p = w.player;
    const blink = w.invuln > 0 && Math.floor(w.invuln * 12) % 2 === 0;
    if (!blink) drawCentered(ctx, charSprite(v.character), p.x, p.y - cam);
    if (w.shield) {
      const pulse = Math.sin(w.time * 6) > 0 ? 1 : 0;
      drawCentered(ctx, bubbleSprite(8 + pulse, P.cyan), p.x, p.y - cam);
    }
  }
}

/** Rocket warning blips at the screen edge. */
export function drawRocketWarnings(ctx: CanvasRenderingContext2D, w: World, cam: number): void {
  for (const e of w.ents) {
    if (e.kind !== 'rocket' || e.state !== 1) continue;
    const on = Math.floor(e.timer * 10) % 2 === 0;
    if (!on) continue;
    const y = Math.round(Math.max(20, Math.min(H - 8, e.y - cam)));
    const x = e.side === 1 ? 5 : W - 12;
    ctx.fillStyle = P.readyRed;
    ctx.fillRect(x, y - 3, 7, 7);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 3, y - 2, 1, 3);
    ctx.fillRect(x + 3, y + 2, 1, 1);
  }
}
