import { CONFIG } from '../config';
import { sectorName } from '../game/sectors';
import type { World } from '../game/world';
import { bubbleSprite } from '../render/art';
import { drawText, textWidth } from '../render/font';
import { drawCentered, gemSprite, sprite } from '../render/sprites';
import { coinCounter, type Button } from './widgets';

const W = CONFIG.view.width;
const P = CONFIG.palette;

export const HUD_BAR = 14;

export function pauseButton(onPress: () => void): Button {
  return { id: 'hud-pause', x: W / 2 - 7, y: 1, w: 14, h: 11, icon: 'pause', style: 'dark', onPress, name: 'Pause' };
}

/** Ring of pixels around (cx, cy) filled clockwise for `frac` of a turn. */
function ring(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, frac: number, color: string): void {
  const n = Math.round(r * 7);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    ctx.fillStyle = t < frac ? color : 'rgba(255,255,255,0.15)';
    const a = -Math.PI / 2 + t * Math.PI * 2;
    ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1);
  }
}

export function drawHud(ctx: CanvasRenderingContext2D, w: World): void {
  ctx.fillStyle = 'rgba(8,5,24,0.72)';
  ctx.fillRect(0, 0, W, HUD_BAR);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, HUD_BAR, W, 1);
  coinCounter(ctx, 5, 4, w.coins);
  // Gems: number then icon, right aligned
  const t = String(w.score);
  const tw = textWidth(t);
  drawText(ctx, t, W - 15 - tw, 4, { color: '#ffffff', shadow: '#0b0820' });
  drawCentered(ctx, gemSprite(1), W - 8.5, 7.5);
  // Sector
  if (w.sector >= 0) drawText(ctx, sectorName(w.sector), W / 2, HUD_BAR + 4, { align: 'center', color: '#ffffff', shadow: '#0b0820', alpha: 0.9 });
  // Power-up timers
  let px = 10;
  if (w.magnetTime > 0) {
    drawCentered(ctx, sprite('magnet'), px, HUD_BAR + 11);
    ring(ctx, px, HUD_BAR + 11, 7.5, w.magnetTime / CONFIG.powerups.magnetTime, P.gold);
    px += 18;
  }
  if (w.shield) {
    drawCentered(ctx, bubbleSprite(5, P.cyan), px, HUD_BAR + 11);
  }
}
