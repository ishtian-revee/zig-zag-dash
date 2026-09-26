import type { Spec } from '../entities';

export interface Chunk {
  id: string;
  /** Height in logical px. */
  h: number;
  /** Difficulty tier 1–5. */
  tier: 1 | 2 | 3 | 4 | 5;
  /** First sector index this chunk may appear in (0 = ALPHA). */
  minSector: number;
  /** Safe-start chunk (easy, open): used for the first chunks of a run. */
  safe?: boolean;
  /** Rare chunks get a lower pick weight. */
  rare?: boolean;
  e: Spec[];
}

type P = [number, number];

/** n coins along a straight line. */
export function coinLine(x0: number, y0: number, x1: number, y1: number, n: number): Spec[] {
  const out: Spec[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    out.push({ t: 'coin', x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t });
  }
  return out;
}

/** n coins along an arc around (cx, cy); angles in degrees, 0 = right, 90 = up. */
export function coinArc(cx: number, cy: number, r: number, a0: number, a1: number, n: number): Spec[] {
  const out: Spec[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const a = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
    out.push({ t: 'coin', x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return out;
}

/** Small coin cluster (plus shape) centred on (x, y). */
export function coinCluster(x: number, y: number): Spec[] {
  return [
    { t: 'coin', x, y },
    { t: 'coin', x: x - 7, y },
    { t: 'coin', x: x + 7, y },
    { t: 'coin', x, y: y - 7 },
    { t: 'coin', x, y: y + 7 },
  ];
}

/** Coins along a zig-zag swoop path through the given points. */
export function coinPath(pts: P[], perSegment: number): Spec[] {
  const out: Spec[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    for (let k = 0; k < perSegment; k++) {
      const t = k / perSegment;
      out.push({ t: 'coin', x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t });
    }
  }
  const last = pts[pts.length - 1];
  out.push({ t: 'coin', x: last[0], y: last[1] });
  return out;
}
