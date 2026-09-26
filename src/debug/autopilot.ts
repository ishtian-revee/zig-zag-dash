// Dev-only autopilot for playtesting long runs: greedy lookahead using the real movement + collision code.
import { CONFIG } from '../config';
import { collide } from '../game/collision';
import { playerHitRadius, stepPlayer, type PlayerState } from '../game/player';
import type { World } from '../game/world';

const STEP = 1 / 60;
const HORIZON = 90; // frames
const DECIDE = 3; // frames between decisions

/** Frames survived when following a tap schedule (frame offsets). */
function survive(w: World, start: PlayerState, taps: number[]): number {
  const p = { ...start };
  const r = playerHitRadius() + 0.8;
  let k = 0;
  for (let f = 0; f < HORIZON; f++) {
    if (k < taps.length && taps[k] === f) {
      p.target = p.target === 1 ? -1 : 1;
      k++;
    }
    stepPlayer(p, STEP, w.speed);
    if (collide(p.x, p.y, r, w.ents)) return f;
  }
  // Prefer ending away from walls
  return HORIZON + Math.min(p.x, CONFIG.view.width - p.x) / 100;
}

export class Autopilot {
  private frame = 0;
  on = false;

  /** Returns true if it wants to tap this frame. */
  decide(w: World): boolean {
    if (!this.on || w.dead) return false;
    if (this.frame++ % DECIDE !== 0) return false;
    const p = w.player;
    const schedules: number[][] = [[]];
    for (let a = 6; a < HORIZON; a += 8) {
      schedules.push([a]);
      for (let b = a + 12; b < HORIZON; b += 14) schedules.push([a, b]);
    }
    let bestKeep = -1;
    let bestTap = -1;
    for (const s of schedules) {
      bestKeep = Math.max(bestKeep, survive(w, p, s));
      bestTap = Math.max(bestTap, survive(w, p, [0, ...s.filter((x) => x > 0)]));
    }
    // Human-like: only tap when holding course leads to trouble within the horizon.
    if (bestKeep >= HORIZON) return false;
    return bestTap > bestKeep;
  }
}
