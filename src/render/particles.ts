import { drawText } from './font';

export type Shape = 'sq' | 'plus' | 'spark';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  gravity: number;
  drag: number;
  shape: Shape;
  /** Fade alpha over life. */
  fade: boolean;
}

interface FloatText {
  text: string;
  x: number;
  y: number;
  life: number;
  max: number;
  color: string;
}

const MAX_PARTICLES = 900;

/** Particles and floating numbers, in world coordinates. */
export class Particles {
  list: Particle[] = [];
  texts: FloatText[] = [];
  /** Share of requested particles actually spawned (Reduce effects). */
  density = 1;
  private acc = 0;

  /** Returns how many of n to spawn given density (stochastic rounding). */
  count(n: number): number {
    this.acc += n * this.density;
    const k = Math.floor(this.acc);
    this.acc -= k;
    return k;
  }

  add(p: Partial<Particle> & { x: number; y: number }): void {
    if (this.list.length >= MAX_PARTICLES) this.list.shift();
    const life = p.life ?? 0.6;
    this.list.push({
      vx: 0,
      vy: 0,
      color: '#ffffff',
      size: 1,
      gravity: 0,
      drag: 0,
      shape: 'sq',
      fade: false,
      ...p,
      life,
      max: life,
    });
  }

  burst(x: number, y: number, n: number, colors: readonly string[], speed = 50, opts: Partial<Particle> = {}): void {
    const k = this.count(n);
    for (let i = 0; i < k; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random() * 0.8);
      this.add({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.35 + Math.random() * 0.4,
        color: colors[i % colors.length],
        size: Math.random() < 0.3 ? 2 : 1,
        drag: 2.5,
        ...opts,
      });
    }
  }

  floatText(text: string, x: number, y: number, color: string): void {
    this.texts.push({ text, x, y, life: 0.8, max: 0.8, color });
  }

  update(dt: number): void {
    const out: Particle[] = [];
    for (const p of this.list) {
      p.life -= dt;
      if (p.life <= 0) continue;
      p.vy += p.gravity * dt;
      if (p.drag) {
        const k = Math.max(0, 1 - p.drag * dt);
        p.vx *= k;
        p.vy *= k;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      out.push(p);
    }
    this.list = out;
    this.texts = this.texts.filter((t) => {
      t.life -= dt;
      t.y -= 18 * dt;
      return t.life > 0;
    });
  }

  clear(): void {
    this.list = [];
    this.texts = [];
  }

  /** Draw with a world→screen y offset (camTop). */
  draw(ctx: CanvasRenderingContext2D, camTop: number, camX = 0): void {
    for (const p of this.list) {
      const x = Math.round(p.x - camX);
      const y = Math.round(p.y - camTop);
      if (y < -4 || y > 330) continue;
      const t = p.life / p.max;
      ctx.globalAlpha = p.fade ? Math.min(1, t * 1.6) : 1;
      ctx.fillStyle = p.color;
      const s = p.size;
      if (p.shape === 'plus') {
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      } else if (p.shape === 'spark') {
        ctx.fillRect(x, y, 1, 1);
        if (t > 0.5) {
          ctx.fillRect(x - 1, y, 1, 1);
          ctx.fillRect(x + 1, y, 1, 1);
          ctx.fillRect(x, y - 1, 1, 1);
          ctx.fillRect(x, y + 1, 1, 1);
        }
      } else {
        const sz = t < 0.35 && s > 1 ? s - 1 : s;
        ctx.fillRect(x - (sz >> 1), y - (sz >> 1), sz, sz);
      }
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) {
      const a = Math.min(1, (t.life / t.max) * 2);
      drawText(ctx, t.text, t.x - camX, t.y - camTop - 3, { color: t.color, align: 'center', alpha: a, shadow: '#140f2e' });
    }
  }
}
