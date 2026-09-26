import { CONFIG } from '../config';
import { collide } from './collision';
import type { Chunk } from './chunks';
import { spawnSpecs, updateEntity, type Ent } from './entities';
import { createPlayer, playerHitRadius, stepPlayer, type PlayerState } from './player';

/** Chunks are entered/exited at least this far from either edge (room to turn away from a wall at top speed). */
export const ENTRY_LO = 30;

export interface Entry {
  x: number;
  target: 1 | -1;
}

export interface SolveParams {
  speed: number;
  /** World clock at entry (moving hazards). */
  t0: number;
  /** Frames between tap decisions. */
  decisionFrames?: number;
  /** Exit window: must leave the chunk top with x inside [lo, hi]. */
  exitLo?: number;
  exitHi?: number;
  /** Search budget (states expanded). */
  budget?: number;
}

interface Node {
  p: PlayerState;
  t: number;
  /** Trigger time per rocket (NaN = not triggered yet). */
  trig: number[];
  taps: number[];
}

export interface SolveResult {
  ok: boolean;
  expanded: number;
  /** Times (s after entry) of the taps on the found path. */
  taps?: number[];
}

/**
 * Search over discretised tap times using the real movement and collision code:
 * is there at least one way through the chunk from `entry`?
 */
export function solveChunk(chunk: Chunk, mirror: boolean, entry: Entry, prm: SolveParams): SolveResult {
  const step = 1 / CONFIG.loop.stepHz;
  const every = prm.decisionFrames ?? 4;
  const lo = prm.exitLo ?? ENTRY_LO;
  const hi = prm.exitHi ?? CONFIG.view.width - ENTRY_LO;
  const budget = prm.budget ?? 400000;
  const margin = CONFIG.gen.positionJitter;
  const r = playerHitRadius();

  const ents: Ent[] = spawnSpecs(chunk.e, 0, { mirror, seed: 1 });
  // In a real run these get up to positionJitter of offset: test them with that margin.
  for (const e of ents) if (e.kind === 'planet' || e.kind === 'moon' || e.kind === 'asteroid') e.jittered = true;
  const rockets = ents.filter((e) => e.kind === 'rocket');
  const rocketStart = rockets.map((e) => ({ x: e.x, y: e.y }));
  const moving = ents.some((e) => e.kind === 'spinner' || e.kind === 'bigmoon' || (e.kind === 'laser' && e.dx !== 0));
  const timeMatters = moving || rockets.length > 0;
  const topY = -chunk.h;

  const setRockets = (n: Node) => {
    for (let i = 0; i < rockets.length; i++) {
      const e = rockets[i];
      const tt = n.trig[i];
      const fly = Number.isNaN(tt) ? -1 : n.t - tt - CONFIG.rockets.warningTime;
      if (fly < 0) {
        e.state = Number.isNaN(tt) ? 0 : 1;
        e.x = rocketStart[i].x;
        e.y = rocketStart[i].y;
      } else {
        e.state = 2;
        e.x = rocketStart[i].x + e.vx * fly;
        e.y = rocketStart[i].y + e.vy * fly;
      }
    }
  };

  const visited = new Set<string>();
  const start: Node = {
    p: createPlayer(entry.x, 0, entry.target),
    t: 0,
    trig: rockets.map(() => NaN),
    taps: [],
  };
  const stack: Node[] = [start];
  let expanded = 0;

  while (stack.length) {
    const n = stack.pop()!;
    if (++expanded > budget) return { ok: false, expanded };

    // Advance `every` frames without input.
    let alive = true;
    for (let f = 0; f < every; f++) {
      stepPlayer(n.p, step, prm.speed);
      n.t += step;
      for (let i = 0; i < rockets.length; i++) {
        if (Number.isNaN(n.trig[i]) && n.p.y <= rockets[i].triggerY) n.trig[i] = n.t;
      }
      if (moving) for (const e of ents) if (e.kind !== 'rocket') updateEntity(e, prm.t0 + n.t, step, n.p.y);
      setRockets(n);
      if (collide(n.p.x, n.p.y, r, ents, margin)) {
        alive = false;
        break;
      }
      if (n.p.y <= topY) break;
    }
    if (!alive) continue;
    if (n.p.y <= topY) {
      if (n.p.x >= lo && n.p.x <= hi) return { ok: true, expanded, taps: n.taps };
      continue;
    }

    const hq = Math.round((n.p.heading * 180) / Math.PI / 6);
    let key = `${Math.round(n.p.x)},${Math.round(n.p.y)},${hq},${n.p.target}`;
    if (timeMatters) key += `,${Math.round(n.t * 20)},${n.trig.map((v) => (Number.isNaN(v) ? '-' : Math.round(v * 10))).join('/')}`;
    if (visited.has(key)) continue;
    visited.add(key);

    // Children: keep going, or tap now. Push "tap" first so "no tap" is explored first (DFS).
    const tapped: Node = { p: { ...n.p, target: n.p.target === 1 ? -1 : 1 }, t: n.t, trig: [...n.trig], taps: [...n.taps, n.t] };
    const straight: Node = { p: { ...n.p }, t: n.t, trig: [...n.trig], taps: n.taps };
    stack.push(tapped, straight);
  }
  return { ok: false, expanded };
}

/** Standard entry states used by the solvability test. */
export function standardEntries(): Entry[] {
  const out: Entry[] = [];
  for (const x of [ENTRY_LO, 60, 90, 120, CONFIG.view.width - ENTRY_LO]) for (const target of [1, -1] as const) out.push({ x, target });
  return out;
}

/** Does this chunk contain anything whose behaviour depends on the world clock? */
export function isTimed(chunk: Chunk): boolean {
  return chunk.e.some((s) => s.t === 'slider' || s.t === 'spinner' || s.t === 'rocket' || (s.t === 'bigmoon' && !!s.bob));
}
