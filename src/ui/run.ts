import { CONFIG } from '../config';
import { randomSeed } from '../core/rng';
import { characterById } from '../game/characters';
import { World, type GameEvent } from '../game/world';
import { drawRocketWarnings, drawWalls, drawWorld } from '../render/renderer';
import { Particles } from '../render/particles';
import type { App } from './app';

const P = CONFIG.palette;
const GEM_COLORS: Record<1 | 2 | 3, string[]> = {
  1: [P.cyan, '#ffffff', '#1ca8c0'],
  2: [P.green, '#b8ffc4', '#18a034'],
  3: ['#ff5ec8', '#ffffff', '#b8248a'],
};

/** One run: the world simulation plus its particles, effects and sounds. */
export class Run {
  world: World;
  particles = new Particles();
  shake = 0;
  flash = 0;
  private trailAcc = 0;
  private trailT = 0;
  playTime = 0;
  readonly seed: number;

  constructor(
    private app: App,
    seed = randomSeed(),
  ) {
    this.seed = seed;
    this.world = new World(seed);
    this.particles.density = app.save.settings.reduceEffects ? CONFIG.fx.reduceParticleFactor : 1;
  }

  get character(): string {
    return this.app.save.selectedCharacter;
  }

  /** World y of the screen top, including shake. */
  get cam(): number {
    return Math.round(this.world.cameraTop);
  }

  tap(): void {
    this.world.tap();
  }

  update(dt: number, simulate: boolean): void {
    if (simulate) {
      const events = this.world.step(dt);
      for (const e of events) this.handle(e);
      if (!this.world.dead) {
        this.playTime += dt;
        this.trail(dt);
      }
    }
    this.particles.update(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt);
  }

  private handle(e: GameEvent): void {
    const a = this.app.audio;
    const pt = this.particles;
    switch (e.type) {
      case 'tap':
        a.sfx('tap');
        break;
      case 'coin':
        a.sfx('coin');
        pt.burst(e.x, e.y, 6, [P.gold, '#ffe08a'], 35);
        break;
      case 'gem':
        a.sfx('gem', e.value);
        pt.burst(e.x, e.y, CONFIG.fx.pickupBurst, GEM_COLORS[e.value], 55);
        pt.floatText(`+${e.value}`, e.x, e.y - 4, GEM_COLORS[e.value][0]);
        break;
      case 'magnet':
        a.sfx('magnet');
        pt.burst(e.x, e.y, 14, [P.readyRed, P.uiBlue, '#ffffff'], 55);
        pt.floatText('MAGNET', e.x, e.y - 6, '#ffffff');
        break;
      case 'shield':
        a.sfx('shield');
        pt.burst(e.x, e.y, 14, [P.cyan, '#ffffff'], 55);
        pt.floatText('SHIELD', e.x, e.y - 6, P.cyan);
        break;
      case 'shieldPop':
        a.sfx('shieldPop');
        pt.burst(e.x, e.y, 26, [P.cyan, '#ffffff', '#9ff8ff'], 90);
        this.kick(0.15);
        break;
      case 'death': {
        a.sfx('explosion');
        const trail = characterById(this.character).trail.colors;
        const n = pt.count(CONFIG.death.shatterCount);
        const saved = pt.density;
        pt.density = 1;
        for (let i = 0; i < n; i++) {
          const ang = Math.random() * Math.PI * 2;
          const s = 25 + Math.random() * 75;
          pt.add({
            x: e.x + Math.cos(ang) * 2,
            y: e.y + Math.sin(ang) * 2,
            vx: Math.cos(ang) * s,
            vy: Math.sin(ang) * s,
            life: 0.6 + Math.random() * 0.7,
            color: i % 3 === 0 ? trail[i % trail.length] : '#ffffff',
            size: Math.random() < 0.5 ? 2 : 1,
            drag: 1.6,
            gravity: 30,
          });
        }
        pt.density = saved;
        this.kick(CONFIG.death.shakeTime);
        if (!this.app.save.settings.reduceEffects) this.flash = CONFIG.death.flashTime;
        break;
      }
      case 'sector': {
        a.sfx('whoosh');
        const colors = [P.magenta, P.violet, P.blue, P.cyan, '#ffffff'];
        const n = pt.count(CONFIG.sectors.confettiCount);
        const saved = pt.density;
        pt.density = 1;
        for (let i = 0; i < n; i++) {
          const dir = i % 2 ? 1 : -1;
          pt.add({
            x: CONFIG.view.width / 2 + (Math.random() - 0.5) * 40,
            y: e.y + (Math.random() - 0.5) * 3,
            vx: dir * (30 + Math.random() * 110),
            vy: (Math.random() - 0.5) * 30,
            life: 0.8 + Math.random() * 0.8,
            color: colors[i % colors.length],
            size: Math.random() < 0.4 ? 2 : 1,
            drag: 1.2,
            gravity: 18,
          });
        }
        pt.density = saved;
        this.app.onSector(e.index);
        break;
      }
      case 'rocketWarn':
        a.sfx('warn');
        break;
      case 'rocketLaunch':
        break;
    }
  }

  private kick(t: number): void {
    if (!this.app.save.settings.reduceEffects) this.shake = Math.max(this.shake, t);
  }

  private trail(dt: number): void {
    const def = characterById(this.character).trail;
    const cols = def.colors;
    const p = this.world.player;
    this.trailT += dt;
    this.trailAcc += dt * CONFIG.fx.trailRate;
    const n = this.particles.count(Math.floor(this.trailAcc));
    this.trailAcc -= Math.floor(this.trailAcc);
    // Emit from behind the player
    const bx = p.x - Math.sin(p.heading) * 4;
    const by = p.y + Math.cos(p.heading) * 4;
    const pick = () => cols[Math.floor(Math.random() * cols.length)];
    const j = () => (Math.random() - 0.5) * 3;
    for (let i = 0; i < n; i++) {
      switch (def.style) {
        case 'sparkle':
          this.particles.add({ x: bx + j(), y: by + j(), life: 0.5, color: pick(), shape: Math.random() < 0.3 ? 'spark' : 'sq', fade: true });
          break;
        case 'sprinkle':
          this.particles.add({ x: bx + j(), y: by + j(), vx: (Math.random() - 0.5) * 16, vy: (Math.random() - 0.5) * 16, drag: 3, life: 0.6, color: pick() });
          break;
        case 'drip':
          this.particles.add({ x: bx + j(), y: by, vy: 5, gravity: 60, life: 0.55, color: pick(), size: Math.random() < 0.4 ? 2 : 1 });
          break;
        case 'ember':
          this.particles.add({ x: bx + j(), y: by + j(), vx: (Math.random() - 0.5) * 10, vy: -12, life: 0.7, color: pick(), fade: true });
          break;
        case 'paw':
          if (Math.random() < 0.35) {
            const side = Math.floor(this.trailT * 6) % 2 ? 2 : -2;
            const nx = Math.cos(p.heading) * side;
            const ny = Math.sin(p.heading) * side;
            this.particles.add({ x: bx + nx, y: by + ny, life: 0.8, color: cols[0], size: 2, fade: true });
            this.particles.add({ x: bx + nx, y: by + ny - 2, life: 0.8, color: cols[1], size: 1, fade: true });
          }
          break;
        case 'fire':
          this.particles.add({ x: bx + j(), y: by + j(), vx: (Math.random() - 0.5) * 14, vy: -6 - Math.random() * 14, life: 0.35, color: pick(), size: Math.random() < 0.5 ? 2 : 1 });
          break;
        case 'snow':
          this.particles.add({ x: bx + j() * 2, y: by + j(), vx: (Math.random() - 0.5) * 8, vy: 4, life: 0.8, color: pick(), shape: Math.random() < 0.25 ? 'plus' : 'sq', fade: true });
          break;
        case 'spark': {
          const a = Math.random() * Math.PI * 2;
          this.particles.add({ x: bx, y: by, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40, drag: 6, life: 0.25, color: pick() });
          break;
        }
        case 'dust': {
          const s = Math.random() < 0.5 ? -1 : 1;
          this.particles.add({ x: bx, y: by, vx: s * (14 + Math.random() * 10), vy: (Math.random() - 0.5) * 4, drag: 3, life: 0.6, color: pick(), fade: true });
          break;
        }
        case 'mist':
          this.particles.add({ x: bx + j() * 2, y: by + j(), vx: (Math.random() - 0.5) * 6, vy: 3, life: 0.9, color: pick(), size: 2, fade: true });
          break;
        case 'rainbow': {
          const idx = Math.floor(this.trailT * 14) % cols.length;
          this.particles.add({ x: bx, y: by, life: 0.55, color: cols[idx], size: 2 });
          break;
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, wallColor: string, showPlayer = true): void {
    const app = this.app;
    const reduce = app.save.settings.reduceEffects;
    let sx = 0;
    let sy = 0;
    if (this.shake > 0 && !reduce) {
      const k = (this.shake / CONFIG.death.shakeTime) * CONFIG.death.shakeAmp;
      sx = Math.round((Math.random() - 0.5) * 2 * k);
      sy = Math.round((Math.random() - 0.5) * 2 * k);
    }
    const cam = this.cam;
    ctx.save();
    ctx.translate(sx, sy);
    app.bg.draw(ctx, cam, app.time, reduce);
    drawWorld(ctx, this.world, cam, {
      shakeX: sx,
      shakeY: sy,
      character: this.character,
      wallColor,
      reduceEffects: reduce,
      showPlayer,
    });
    this.particles.draw(ctx, cam);
    ctx.restore();
    drawWalls(ctx, wallColor, app.time, reduce);
    drawRocketWarnings(ctx, this.world, cam);
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${(this.flash / CONFIG.death.flashTime) * 0.35})`;
      ctx.fillRect(0, 0, CONFIG.view.width, CONFIG.view.height);
    }
  }
}
