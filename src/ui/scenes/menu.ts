import { CONFIG } from '../../config';
import { sectorName } from '../../game/sectors';
import { glow, moonSprite, planetSprite } from '../../render/art';
import { drawText, textWidth } from '../../render/font';
import { drawCentered, makeCanvas } from '../../render/sprites';
import type { App, Scene } from '../app';
import { Carousel } from '../carousel';
import { coinCounter, type Button } from '../widgets';

const W = CONFIG.view.width;
const H = CONFIG.view.height;
const P = CONFIG.palette;

interface Logo {
  canvas: HTMLCanvasElement;
  mask: Uint8Array;
  x: number;
  y: number;
}

/** Bake the chunky "ZIG ZAG DASH" logo: dark bold fill, white outline, gold drop shadow. */
function bakeLogo(): Logo {
  const lines = ['ZIG ZAG', 'DASH'];
  const scale = 4;
  const lh = 7 * scale + 5;
  const w = Math.max(...lines.map((l) => textWidth(l, scale))) + 1 + 8;
  const h = lines.length * lh + 8;
  // Fill layer (bold: drawn twice, 1px apart)
  const fill = makeCanvas(w, h);
  const fg = fill.getContext('2d')!;
  lines.forEach((l, i) => {
    for (const dx of [0, 1]) drawText(fg, l, w / 2 + dx - 0.5, 3 + i * lh, { scale, align: 'center', color: '#241a44' });
  });
  const src = fg.getImageData(0, 0, w, h).data;
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 0;
  const out = makeCanvas(w, h);
  const og = out.getContext('2d')!;
  const mask = new Uint8Array(w * h);
  const outline = (x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (on(x + dx, y + dy)) return true;
    return false;
  };
  // Gold shadow (outline shape shifted down), then white outline, then fill with a light top edge.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (outline(x, y - 3) || outline(x, y - 2) || outline(x, y - 1)) {
        og.fillStyle = y % 2 === 0 ? P.gold : '#e08a00';
        og.fillRect(x, y, 1, 1);
      }
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (on(x, y)) {
        og.fillStyle = on(x, y - 1) ? '#241a44' : '#4a3d80';
        og.fillRect(x, y, 1, 1);
        mask[y * w + x] = 1;
      } else if (outline(x, y)) {
        og.fillStyle = '#ffffff';
        og.fillRect(x, y, 1, 1);
        mask[y * w + x] = 1;
      }
    }
  }
  return { canvas: out, mask, x: Math.round((W - w) / 2), y: 28 };
}

interface Moon {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  seed: number;
}

export class MenuScene implements Scene {
  private logo: Logo | null = null;
  private moons: Moon[] = [];
  private spawnT = 0.6;
  private carousel: Carousel;
  private t = 0;

  constructor(private app: App) {
    this.carousel = new Carousel(app, 'menu-car', 136);
  }

  enter(): void {
    this.app.audio.play('menu');
    this.app.audio.duck(false);
    this.app.bg.setHue(0, true);
    this.carousel.sync();
    this.logo ??= bakeLogo();
  }

  private play(): void {
    this.app.go(this.app.save.tutorialSeen ? 'ready' : 'tutorial');
  }

  buttons(): Button[] {
    const app = this.app;
    const st = app.save.settings;
    const sound = st.music || st.sfx;
    const by = 282;
    const bw = 30;
    const gap = 10;
    const x0 = (W - (bw * 4 + gap * 3)) / 2;
    return [
      ...this.carousel.buttons(),
      { id: 'menu-play', x: W / 2 - 46, y: 222, w: 92, h: 32, icon: 'play', label: 'PLAY', textScale: 2, style: 'coral', name: 'Play', onPress: () => this.play() },
      { id: 'menu-settings', x: x0, y: by, w: bw, h: 24, icon: 'gear', style: 'outline', name: 'Settings', onPress: () => app.go('settings') },
      { id: 'menu-sound', x: x0 + (bw + gap), y: by, w: bw, h: 24, icon: sound ? 'sound' : 'mute', style: 'outline', name: sound ? 'Sound on' : 'Sound off', onPress: () => app.toggleSound() },
      { id: 'menu-stats', x: x0 + (bw + gap) * 2, y: by, w: bw, h: 24, icon: 'stats', style: 'outline', name: 'Stats', onPress: () => app.go('stats') },
      {
        id: 'menu-share',
        x: x0 + (bw + gap) * 3,
        y: by,
        w: bw,
        h: 24,
        icon: 'share',
        style: 'outline',
        name: 'Share',
        onPress: () => void app.share(app.save.best, app.save.bestSector >= 0 ? sectorName(app.save.bestSector) : 'SPACE'),
      },
    ];
  }

  pointerDown(x: number, y: number): void {
    this.carousel.pointerDown(x, y);
  }
  pointerMove(x: number): void {
    this.carousel.pointerMove(x);
  }
  pointerUp(x: number): void {
    this.carousel.pointerUp(x);
  }

  key(code: string): boolean {
    if (this.carousel.key(code)) return true;
    if (code === 'Space' || code === 'Enter') {
      this.play();
      return true;
    }
    return false;
  }

  update(dt: number): void {
    this.t += dt;
    this.carousel.update(dt);
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = 1.4 + Math.random() * 1.6;
      const fromLeft = Math.random() < 0.5;
      const ty = 45 + Math.random() * 45;
      const x = fromLeft ? -8 : W + 8;
      const y = 10 + Math.random() * 110;
      const sp = 18 + Math.random() * 16;
      const dx = W / 2 + (Math.random() - 0.5) * 80 - x;
      const dy = ty - y;
      const d = Math.hypot(dx, dy);
      this.moons.push({ x, y, vx: (dx / d) * sp, vy: (dy / d) * sp, r: 2.5 + Math.random() * 2.5, seed: Math.floor(Math.random() * 100) });
    }
    const L = this.logo;
    this.moons = this.moons.filter((m) => {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.x < -20 || m.x > W + 20 || m.y < -20 || m.y > H + 20) return false;
      if (L) {
        const lx = Math.round(m.x - L.x + (m.vx > 0 ? m.r : -m.r) * 0.6);
        const ly = Math.round(m.y - L.y);
        if (lx >= 0 && ly >= 0 && lx < L.canvas.width && ly < L.canvas.height && L.mask[ly * L.canvas.width + lx]) {
          this.app.uiParticles.burst(m.x, m.y, 14, ['#ffffff', '#dcdcf0', '#a8a8c8'], 45, { gravity: 40 });
          return false;
        }
      }
      return true;
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const app = this.app;
    const reduce = app.save.settings.reduceEffects;
    app.bg.draw(ctx, -this.t * 8, app.time, reduce);
    // Planets beside the logo
    ctx.drawImage(glow(P.blue, 40, 0.35), 8 - 40, 92 - 40);
    drawCentered(ctx, planetSprite(18, 'blue', false, 3), 8, 92);
    ctx.drawImage(glow(P.magenta, 34, 0.35), 172 - 34, 30 - 34);
    drawCentered(ctx, planetSprite(14, 'magenta', true, 7), 172, 30);
    for (const m of this.moons) drawCentered(ctx, moonSprite(m.r, m.seed), m.x, m.y);
    if (this.logo) ctx.drawImage(this.logo.canvas, this.logo.x, this.logo.y + Math.round(Math.sin(this.t * 1.5) * 1));
    coinCounter(ctx, 6, 6, app.save.coins);
    if (app.save.best > 0) {
      const sec = app.save.bestSector >= 0 ? `  ${sectorName(app.save.bestSector)}` : '';
      drawText(ctx, `BEST ${app.save.best}${sec}`, W / 2, 116, { align: 'center', color: '#c9c3ee', shadow: '#0b0820' });
    }
    this.carousel.draw(ctx, app.time);
  }
}
