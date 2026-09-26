import { CONFIG } from '../config';
import { shade } from '../render/art';
import { drawText, textWidth } from '../render/font';
import { drawCentered, icon, sprite, type IconName } from '../render/sprites';

const P = CONFIG.palette;

export type ButtonStyle = 'coral' | 'blue' | 'outline' | 'gold' | 'dark' | 'purple';

export interface Button {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  icon?: IconName;
  style: ButtonStyle;
  onPress: () => void;
  disabled?: boolean;
  /** Accessible name (for focus announcements). */
  name?: string;
  textScale?: number;
  /** Draw a coin symbol before the label. */
  coin?: boolean;
}

const FILL: Record<ButtonStyle, string> = {
  coral: P.coral,
  blue: P.uiBlue,
  outline: '#1c1640',
  gold: P.gold,
  dark: '#1c1640',
  purple: P.violet,
};

/** Pixel rounded rectangle (corners cut by `r` px). */
export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, r = 2): void {
  x = Math.round(x);
  y = Math.round(y);
  w = Math.round(w);
  h = Math.round(h);
  ctx.fillStyle = color;
  ctx.fillRect(x + r, y, w - r * 2, h);
  ctx.fillRect(x, y + r, w, h - r * 2);
  if (r >= 2) {
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  }
}

/** Panel with an outline and a darker bottom lip. */
export function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, outline = '#0b0820', lip = true): void {
  roundRect(ctx, x - 1, y - 1, w + 2, h + 3, outline, 3);
  if (lip) roundRect(ctx, x, y, w, h + 1, shade(fill, -0.35), 2);
  roundRect(ctx, x, y, w, h, fill, 2);
}

export function hit(b: Button, x: number, y: number): boolean {
  return x >= b.x - 2 && x < b.x + b.w + 2 && y >= b.y - 2 && y < b.y + b.h + 2;
}

/** Draw a button. `press` in [0, 1] = recent press squash amount; `focused` shows a focus ring. */
export function drawButton(ctx: CanvasRenderingContext2D, b: Button, press: number, focused: boolean, time: number): void {
  const sq = press > 0 ? 1 : 0;
  const x = b.x + sq;
  const y = b.y + sq * 2;
  const w = b.w - sq * 2;
  const h = b.h - sq * 2;
  const fill = b.disabled ? '#3a3560' : FILL[b.style];
  if (b.style === 'outline') {
    roundRect(ctx, x - 1, y - 1, w + 2, h + 3, '#0b0820', 3);
    roundRect(ctx, x, y, w, h + 1, '#8a84b8', 2);
    roundRect(ctx, x + 1, y + 1, w - 2, h - 2, fill, 1);
  } else {
    panel(ctx, x, y, w, h, fill, '#0b0820', !sq);
    // Top highlight
    ctx.fillStyle = shade(fill, 0.25);
    ctx.fillRect(Math.round(x) + 2, Math.round(y) + 1, Math.round(w) - 4, 1);
  }
  const fg = b.disabled ? '#8a84b8' : b.style === 'gold' ? '#3a1d00' : '#ffffff';
  const cx = x + w / 2;
  const cy = y + h / 2;
  const scale = b.textScale ?? 1;
  if (b.icon && b.label) {
    const img = icon(b.icon, fg);
    const tw = textWidth(b.label, scale);
    const total = img.width + 4 + tw;
    drawCentered(ctx, img, cx - total / 2 + img.width / 2, cy);
    drawText(ctx, b.label, cx - total / 2 + img.width + 4, cy - 3.5 * scale, { color: fg, scale });
  } else if (b.icon) {
    drawCentered(ctx, icon(b.icon, fg), cx, cy);
  } else if (b.label) {
    if (b.coin) {
      const tw = textWidth(b.label, scale);
      const total = 7 + 3 + tw;
      drawCentered(ctx, sprite('coin'), cx - total / 2 + 3.5, cy);
      drawText(ctx, b.label, cx - total / 2 + 10, cy - 3.5 * scale, { color: fg, scale });
    } else drawText(ctx, b.label, cx, cy - 3.5 * scale, { color: fg, scale, align: 'center' });
  }
  if (focused) {
    const on = Math.floor(time * 3) % 2 === 0;
    ctx.fillStyle = on ? '#ffffff' : P.cyan;
    const fx = Math.round(b.x) - 3;
    const fy = Math.round(b.y) - 3;
    const fw = Math.round(b.w) + 6;
    const fh = Math.round(b.h) + 7;
    ctx.fillRect(fx + 1, fy, fw - 2, 1);
    ctx.fillRect(fx + 1, fy + fh - 1, fw - 2, 1);
    ctx.fillRect(fx, fy + 1, 1, fh - 2);
    ctx.fillRect(fx + fw - 1, fy + 1, 1, fh - 2);
  }
}

/** Coin icon + number. Returns the drawn width. */
export function coinCounter(ctx: CanvasRenderingContext2D, x: number, y: number, n: number, align: 'left' | 'right' = 'left'): number {
  const t = String(n);
  const w = 7 + 3 + textWidth(t);
  const left = align === 'left' ? x : x - w;
  drawCentered(ctx, sprite('coin'), left + 3.5, y + 3.5);
  drawText(ctx, t, left + 10, y, { color: '#ffffff', shadow: '#0b0820' });
  return w;
}
