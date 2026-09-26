import { CONFIG } from '../config';

export type ColorName = 'magenta' | 'violet' | 'blue' | 'green';
export const PLANET_COLORS: readonly ColorName[] = ['magenta', 'violet', 'blue', 'green'];

/** Chunk-local entity specs. x in [0, view width], y measured upward from the chunk base. */
export type Spec =
  | { t: 'planet'; x: number; y: number; r: number; c?: ColorName; ring?: boolean }
  | { t: 'moon'; x: number; y: number; r: number }
  | { t: 'bigmoon'; x: number; y: number; r: number; bob?: number }
  | { t: 'asteroid'; x: number; y: number; r: number }
  | { t: 'coin'; x: number; y: number }
  | { t: 'gem'; x: number; y: number; v: 1 | 2 | 3 }
  | { t: 'magnet'; x: number; y: number }
  | { t: 'shield'; x: number; y: number }
  /** Static laser gate: beams between consecutive nodes; every node is a solid emitter. */
  | { t: 'laser'; pts: [number, number][]; closed?: boolean }
  /** Laser gate sliding horizontally: offset = dx * sin(2π(time/period + phase)). */
  | { t: 'slider'; pts: [number, number][]; closed?: boolean; dx: number; period: number; phase?: number }
  /** Rotating laser around an emitter: beam spans ±len through the centre. spin in rad/s. */
  | { t: 'spinner'; x: number; y: number; len: number; spin: number; a0?: number }
  /** Rocket entering from a side at local y; fires when the player is `lead` px below its entry height. slope > 0 = downward. */
  | { t: 'rocket'; y: number; side: 'L' | 'R'; slope?: number; lead?: number };

export type Kind =
  | 'planet'
  | 'moon'
  | 'bigmoon'
  | 'asteroid'
  | 'coin'
  | 'gem'
  | 'magnet'
  | 'shield'
  | 'laser'
  | 'spinner'
  | 'rocket';

export interface Ent {
  kind: Kind;
  x: number;
  y: number;
  /** Visual radius (circles). */
  r: number;
  /** Rendering seed (craters, sparkle phase). */
  seed: number;
  color: ColorName;
  ring: boolean;
  value: 1 | 2 | 3;
  /** Collected / expired. */
  gone: boolean;
  /** White flash timer (death flash). */
  flash: number;
  // Motion
  baseX: number;
  baseY: number;
  bob: number;
  // Lasers: base nodes (world) and current nodes/segments
  basePts: { x: number; y: number }[];
  nodes: { x: number; y: number }[];
  closed: boolean;
  dx: number;
  period: number;
  phase: number;
  len: number;
  spin: number;
  angle: number;
  // Rockets
  side: 1 | -1; // +1 = enters from the left moving right
  vx: number;
  vy: number;
  triggerY: number;
  /** 0 waiting, 1 warning, 2 flying */
  state: 0 | 1 | 2;
  timer: number;
  /** Whether this obstacle's position was jittered (used by solvability margins). */
  jittered: boolean;
  /** Being pulled by the magnet. */
  pulled: boolean;
}

export const SOLID: ReadonlySet<Kind> = new Set<Kind>(['planet', 'moon', 'bigmoon', 'asteroid', 'laser', 'spinner', 'rocket']);
export const PICKUP: ReadonlySet<Kind> = new Set<Kind>(['coin', 'gem', 'magnet', 'shield']);

function blank(kind: Kind, x: number, y: number, r: number): Ent {
  return {
    kind,
    x,
    y,
    r,
    seed: 0,
    color: 'magenta',
    ring: false,
    value: 1,
    gone: false,
    flash: 0,
    baseX: x,
    baseY: y,
    bob: 0,
    basePts: [],
    nodes: [],
    closed: false,
    dx: 0,
    period: 1,
    phase: 0,
    len: 0,
    spin: 0,
    angle: 0,
    side: 1,
    vx: 0,
    vy: 0,
    triggerY: 0,
    state: 0,
    timer: 0,
    jittered: false,
    pulled: false,
  };
}

export interface SpawnOptions {
  mirror: boolean;
  /** Returns values in [0, 1) — used for jitter and colours. Omit for an exact (unjittered) spawn. */
  rand?: () => number;
  seed: number;
}

/** Turn chunk specs into world entities. The chunk base sits at world y = baseY. */
export function spawnSpecs(specs: readonly Spec[], baseY: number, opt: SpawnOptions): Ent[] {
  const W = CONFIG.view.width;
  const g = CONFIG.gen;
  const mx = (x: number) => (opt.mirror ? W - x : x);
  const wy = (y: number) => baseY - y;
  const rand = opt.rand;
  // Position jitter is a random offset of length <= positionJitter (so solvability margins can cover it).
  const jit = (): [number, number] => {
    if (!rand) return [0, 0];
    const a = rand() * Math.PI * 2;
    const m = rand() * g.positionJitter;
    return [Math.cos(a) * m, Math.sin(a) * m];
  };
  const shrink = () => (rand ? 1 - rand() * g.sizeJitter : 1);
  const out: Ent[] = [];
  let seed = opt.seed;
  for (const s of specs) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    switch (s.t) {
      case 'planet':
      case 'moon':
      case 'asteroid': {
        const [jx, jy] = jit();
        const e = blank(s.t, mx(s.x) + jx, wy(s.y) + jy, s.r * shrink());
        e.jittered = !!rand;
        if (s.t === 'planet') {
          e.ring = !!s.ring;
          e.color = s.c ?? (rand ? PLANET_COLORS[Math.floor(rand() * 4)] : 'magenta');
          // Colour swap variation
          if (s.c && rand && rand() < 0.35) e.color = PLANET_COLORS[Math.floor(rand() * 4)];
        }
        e.seed = seed;
        out.push(e);
        break;
      }
      case 'bigmoon': {
        const e = blank('bigmoon', mx(s.x), wy(s.y), s.r);
        e.bob = s.bob ?? 0;
        e.seed = seed;
        out.push(e);
        break;
      }
      case 'coin':
      case 'magnet':
      case 'shield': {
        const e = blank(s.t, mx(s.x), wy(s.y), s.t === 'coin' ? 3 : 4.5);
        e.seed = seed;
        out.push(e);
        break;
      }
      case 'gem': {
        const e = blank('gem', mx(s.x), wy(s.y), 3.5);
        e.value = s.v;
        e.seed = seed;
        out.push(e);
        break;
      }
      case 'laser':
      case 'slider': {
        const pts = s.pts.map(([x, y]) => ({ x: mx(x), y: wy(y) }));
        const e = blank('laser', pts[0].x, pts[0].y, 0);
        e.basePts = pts;
        e.nodes = pts.map((p) => ({ ...p }));
        e.closed = !!s.closed;
        if (s.t === 'slider') {
          e.dx = opt.mirror ? -s.dx : s.dx;
          e.period = s.period;
          e.phase = s.phase ?? 0;
        }
        e.seed = seed;
        out.push(e);
        break;
      }
      case 'spinner': {
        const e = blank('spinner', mx(s.x), wy(s.y), 0);
        e.len = s.len;
        e.spin = opt.mirror ? -s.spin : s.spin;
        e.phase = opt.mirror ? Math.PI - (s.a0 ?? 0) : s.a0 ?? 0;
        e.angle = e.phase;
        e.seed = seed;
        out.push(e);
        break;
      }
      case 'rocket': {
        let side: 1 | -1 = s.side === 'L' ? 1 : -1;
        if (opt.mirror) side = side === 1 ? -1 : 1;
        const e = blank('rocket', side === 1 ? -8 : W + 8, wy(s.y), CONFIG.collision.rocketRadius);
        e.side = side;
        const slope = s.slope ?? 0.25;
        const sp = CONFIG.rockets.speed;
        const n = Math.hypot(1, slope);
        e.vx = (side * sp) / n;
        e.vy = (sp * slope) / n;
        e.triggerY = e.y + (s.lead ?? 110);
        e.seed = seed;
        out.push(e);
        break;
      }
    }
  }
  return out;
}

/** Update moving entities. `time` is the world clock (s). */
export function updateEntity(e: Ent, time: number, dt: number, playerY: number): 'warn' | 'launch' | null {
  switch (e.kind) {
    case 'bigmoon':
      if (e.bob) e.y = e.baseY + Math.sin(time * 0.9 + e.seed * 0.001) * e.bob;
      return null;
    case 'laser':
      if (e.dx) {
        const off = e.dx * Math.sin(Math.PI * 2 * (time / e.period + e.phase));
        for (let i = 0; i < e.nodes.length; i++) {
          e.nodes[i].x = e.basePts[i].x + off;
          e.nodes[i].y = e.basePts[i].y;
        }
      }
      return null;
    case 'spinner':
      e.angle = e.phase + e.spin * time;
      return null;
    case 'rocket':
      if (e.state === 0) {
        if (playerY <= e.triggerY) {
          e.state = 1;
          e.timer = CONFIG.rockets.warningTime;
          return 'warn';
        }
      } else if (e.state === 1) {
        e.timer -= dt;
        if (e.timer <= 0) {
          e.state = 2;
          return 'launch';
        }
      } else {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (e.x < -20 || e.x > CONFIG.view.width + 20) e.gone = true;
      }
      return null;
    default:
      return null;
  }
}

/** Current beam segments of a laser or spinner as [ax, ay, bx, by]. */
export function laserSegments(e: Ent): [number, number, number, number][] {
  if (e.kind === 'spinner') {
    const c = Math.cos(e.angle) * e.len;
    const s = Math.sin(e.angle) * e.len;
    return [[e.x - c, e.y - s, e.x + c, e.y + s]];
  }
  const out: [number, number, number, number][] = [];
  const n = e.nodes;
  for (let i = 0; i + 1 < n.length; i++) out.push([n[i].x, n[i].y, n[i + 1].x, n[i + 1].y]);
  if (e.closed && n.length > 2) out.push([n[n.length - 1].x, n[n.length - 1].y, n[0].x, n[0].y]);
  return out;
}

/** Solid emitter positions of a laser or spinner. */
export function emitterNodes(e: Ent): { x: number; y: number }[] {
  if (e.kind === 'spinner') return [{ x: e.x, y: e.y }];
  return e.nodes;
}
