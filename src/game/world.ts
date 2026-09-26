import { CONFIG } from '../config';
import { circlesOverlap } from '../core/math';
import { collide, pickupRadius } from './collision';
import type { Chunk } from './chunks';
import { PICKUP, updateEntity, type Ent } from './entities';
import { Generator, type PlacedChunk } from './generator';
import { createPlayer, flip, playerHitRadius, stepPlayer, type PlayerState } from './player';
import { sectorAt, sectorSpeed, sectorStart } from './sectors';

export type GameEvent =
  | { type: 'tap' }
  | { type: 'coin'; x: number; y: number }
  | { type: 'gem'; x: number; y: number; value: 1 | 2 | 3 }
  | { type: 'magnet'; x: number; y: number }
  | { type: 'shield'; x: number; y: number }
  | { type: 'shieldPop'; x: number; y: number }
  | { type: 'death'; x: number; y: number; ent: Ent | null }
  | { type: 'sector'; index: number; y: number }
  | { type: 'rocketWarn'; ent: Ent }
  | { type: 'rocketLaunch'; ent: Ent };

export interface WorldOptions {
  library?: readonly Chunk[];
}

/** The pure, deterministic game simulation (no rendering, no audio). */
export class World {
  readonly startY = 0;
  readonly player: PlayerState;
  ents: Ent[] = [];
  chunks: PlacedChunk[] = [];
  readonly gen: Generator;
  time = 0;
  speed = sectorSpeed(0);
  /** Current sector index (-1 before the ALPHA line). */
  sector = -1;
  score = 0;
  coins = 0;
  gems = 0;
  dead = false;
  deathTime = 0;
  magnetTime = 0;
  shield = false;
  invuln = 0;
  god = false;
  private pendingTap = false;

  constructor(
    readonly seed: number,
    opts: WorldOptions = {},
  ) {
    this.player = createPlayer(CONFIG.view.width / 2, this.startY);
    // The first chunk starts a little above the player so the start is open.
    this.gen = new Generator(seed, this.startY - 60, opts.library);
    this.fill();
  }

  get distance(): number {
    return this.startY - this.player.y;
  }

  /** World y of the top of the screen. */
  get cameraTop(): number {
    return this.player.y - CONFIG.view.height * CONFIG.movement.cameraAnchor;
  }

  tap(): void {
    if (!this.dead) this.pendingTap = true;
  }

  private fill(): void {
    const top = this.cameraTop - CONFIG.gen.lookAhead;
    while (this.gen.nextBase > top) {
      const sector = Math.max(0, sectorAt(this.startY - this.gen.nextBase));
      const { placed, ents } = this.gen.next(sector);
      this.chunks.push(placed);
      for (const e of ents) this.ents.push(e);
    }
  }

  step(dt: number): GameEvent[] {
    const ev: GameEvent[] = [];
    this.time += dt;
    const p = this.player;

    if (this.dead) {
      this.deathTime += dt;
      for (const e of this.ents) {
        updateEntity(e, this.time, dt, p.y);
        if (e.flash > 0) e.flash -= dt;
      }
      return ev;
    }

    if (this.pendingTap) {
      this.pendingTap = false;
      flip(p);
      ev.push({ type: 'tap' });
    }

    // Speed eases towards the current sector's speed.
    const target = sectorSpeed(Math.max(0, this.sector));
    const k = Math.min(1, dt / CONFIG.movement.speedEase);
    this.speed += (target - this.speed) * k;

    stepPlayer(p, dt, this.speed);

    for (const e of this.ents) {
      const r = updateEntity(e, this.time, dt, p.y);
      if (r === 'warn') ev.push({ type: 'rocketWarn', ent: e });
      else if (r === 'launch') ev.push({ type: 'rocketLaunch', ent: e });
    }

    // Sectors
    const s = sectorAt(this.distance);
    if (s > this.sector) {
      this.sector = s;
      ev.push({ type: 'sector', index: s, y: this.startY - sectorStart(s) });
    }

    this.pickups(ev);
    this.collisions(ev);

    if (this.magnetTime > 0) this.magnetTime = Math.max(0, this.magnetTime - dt);
    if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt);

    this.fill();
    this.despawn();
    return ev;
  }

  private pickups(ev: GameEvent[]): void {
    const p = this.player;
    const pr = CONFIG.collision.playerSpriteRadius;
    const pw = CONFIG.powerups;
    const magnet = this.magnetTime > 0;
    for (const e of this.ents) {
      if (e.gone || !PICKUP.has(e.kind)) continue;
      if (magnet && (e.kind === 'coin' || e.kind === 'gem')) {
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const d = Math.hypot(dx, dy);
        if (e.pulled || d < pw.magnetRadius) {
          e.pulled = true;
          const stepLen = Math.min(d, (pw.magnetPull + this.speed) / CONFIG.loop.stepHz);
          if (d > 0) {
            e.x += (dx / d) * stepLen;
            e.y += (dy / d) * stepLen;
          }
        }
      }
      if (!circlesOverlap(p.x, p.y, pr, e.x, e.y, pickupRadius(e))) continue;
      e.gone = true;
      switch (e.kind) {
        case 'coin':
          this.coins++;
          ev.push({ type: 'coin', x: e.x, y: e.y });
          break;
        case 'gem':
          this.score += CONFIG.scoring.gemValues[e.value];
          this.gems++;
          ev.push({ type: 'gem', x: e.x, y: e.y, value: e.value });
          break;
        case 'magnet':
          this.magnetTime = pw.magnetTime;
          ev.push({ type: 'magnet', x: e.x, y: e.y });
          break;
        case 'shield':
          this.shield = true;
          ev.push({ type: 'shield', x: e.x, y: e.y });
          break;
      }
    }
  }

  private collisions(ev: GameEvent[]): void {
    const p = this.player;
    const r = playerHitRadius();
    const hit = collide(p.x, p.y, r, this.ents);
    if (!hit) return;
    if (hit.type === 'wall' && (this.invuln > 0 || this.shield || this.god)) {
      // Bounce off the wall instead of dying.
      const inset = CONFIG.field.wallInset;
      p.x = hit.side < 0 ? inset + r + 0.01 : CONFIG.view.width - inset - r - 0.01;
      p.target = hit.side < 0 ? 1 : -1;
      if (this.shield && this.invuln <= 0 && !this.god) this.popShield(ev);
      return;
    }
    if (this.invuln > 0 || this.god) return;
    if (this.shield) {
      this.popShield(ev);
      return;
    }
    this.dead = true;
    this.deathTime = 0;
    const ent = hit.type === 'ent' ? hit.ent : null;
    // Flash nearby obstacles.
    for (const e of this.ents) {
      if (Math.abs(e.y - p.y) < 70 && Math.abs(e.x - p.x) < 90) e.flash = CONFIG.death.flashTime;
    }
    ev.push({ type: 'death', x: p.x, y: p.y, ent });
  }

  private popShield(ev: GameEvent[]): void {
    this.shield = false;
    this.invuln = CONFIG.powerups.shieldInvuln;
    ev.push({ type: 'shieldPop', x: this.player.x, y: this.player.y });
  }

  private despawn(): void {
    const limit = this.cameraTop + CONFIG.view.height + CONFIG.gen.despawnBelow;
    this.ents = this.ents.filter((e) => {
      if (e.gone) return false;
      if (e.kind === 'laser') return e.basePts.some((n) => n.y < limit);
      if (e.kind === 'spinner') return e.y - e.len < limit;
      if (e.kind === 'rocket' && e.state < 2) return e.y < limit;
      return e.y - e.r < limit;
    });
    this.chunks = this.chunks.filter((c) => c.topY < limit);
  }

  /** Debug: skip to just below the next sector line. */
  jumpToNextSector(): void {
    const next = Math.max(0, sectorAt(this.distance + 41) + 1);
    this.player.y = this.startY - sectorStart(next) + 40;
    this.ents = [];
    this.chunks = [];
    this.gen.nextBase = this.player.y - 70;
    this.fill();
  }
}
