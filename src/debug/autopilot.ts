// Dev-only autopilot for playtesting long runs: greedy lookahead using the real movement,
// entity motion and collision code.
import { CONFIG } from '../config';
import { collide } from '../game/collision';
import { SOLID, updateEntity, type Ent } from '../game/entities';
import { playerHitRadius, stepPlayer, type PlayerState } from '../game/player';
import type { World } from '../game/world';

const STEP = 1 / 60;
const HORIZON = 132; // frames
const DECIDE = 3; // frames between decisions
const SAMPLE = 2; // collision check every n frames

function cloneEnt(e: Ent): Ent {
  return { ...e, nodes: e.nodes.map((n) => ({ ...n })) };
}

export class Autopilot {
  private frame = 0;
  on = false;

  /** Returns true if it wants to tap this frame. */
  decide(w: World): boolean {
    if (!this.on || w.dead) return false;
    if (this.frame++ % DECIDE !== 0) return false;
    const p = w.player;
    // Obstacles near the player's future path.
    const near = w.ents.filter((e) => {
      if (!SOLID.has(e.kind) || e.gone) return false;
      const ys = e.kind === 'laser' ? e.basePts.map((n) => n.y) : [e.y - e.r - e.len, e.y + e.r + e.len];
      return Math.min(...ys) < p.y + 30 && Math.max(...ys) > p.y - 230;
    });
    const moving = near.some((e) => e.kind === 'rocket' || e.kind === 'spinner' || e.kind === 'bigmoon' || (e.kind === 'laser' && e.dx));
    // Precompute obstacle snapshots per sampled frame (they don't depend on the player's choice,
    // except rocket triggers, which we approximate with the current player y path).
    const frames: Ent[][] = [];
    if (moving) {
      const sim = near.map(cloneEnt);
      const py = { y: p.y };
      for (let f = 0; f < HORIZON; f++) {
        py.y -= w.speed * 0.7 * STEP;
        for (const e of sim) updateEntity(e, w.time + (f + 1) * STEP, STEP, py.y);
        if (f % SAMPLE === 0) frames.push(sim.map(cloneEnt));
      }
    }
    const survive = (start: PlayerState, taps: number[]): number => {
      const q = { ...start };
      const r = playerHitRadius() + 0.8;
      let k = 0;
      for (let f = 0; f < HORIZON; f++) {
        if (k < taps.length && taps[k] === f) {
          q.target = q.target === 1 ? -1 : 1;
          k++;
        }
        stepPlayer(q, STEP, w.speed);
        if (f % SAMPLE === 0 && collide(q.x, q.y, r, moving ? frames[f / SAMPLE] : near)) return f;
      }
      return HORIZON + Math.min(q.x, CONFIG.view.width - q.x) / 100;
    };
    const schedules: number[][] = [[]];
    for (let a = 6; a < HORIZON; a += 9) {
      schedules.push([a]);
      for (let b = a + 12; b < HORIZON; b += 12) schedules.push([a, b]);
    }
    let bestKeep = -1;
    let bestTap = -1;
    for (const s of schedules) {
      bestKeep = Math.max(bestKeep, survive(p, s));
      bestTap = Math.max(bestTap, survive(p, [0, ...s]));
    }
    // Human-like: only tap when holding course leads to trouble within the horizon.
    if (bestKeep >= HORIZON) return false;
    return bestTap > bestKeep;
  }
}
