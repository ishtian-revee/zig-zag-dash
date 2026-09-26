import { CONFIG } from '../config';
import { circlesOverlap, distSqPointSegment } from '../core/math';
import { emitterNodes, laserSegments, type Ent } from './entities';

export type Hit = { type: 'wall'; side: -1 | 1 } | { type: 'ent'; ent: Ent } | null;

export function wallHit(x: number, r: number): -1 | 1 | 0 {
  const inset = CONFIG.field.wallInset;
  if (x - r < inset) return -1;
  if (x + r > CONFIG.view.width - inset) return 1;
  return 0;
}

export function obstacleRadius(e: Ent): number {
  return e.r * CONFIG.collision.obstacleHitboxScale;
}

/** Does a player circle at (x, y, r) touch this solid entity? `margin` is added for jittered obstacles. */
export function hitsEntity(e: Ent, x: number, y: number, r: number, margin = 0): boolean {
  const c = CONFIG.collision;
  switch (e.kind) {
    case 'planet':
    case 'moon':
    case 'bigmoon':
    case 'asteroid':
      return circlesOverlap(x, y, r + (e.jittered ? margin : 0), e.x, e.y, obstacleRadius(e));
    case 'rocket':
      return e.state === 2 && circlesOverlap(x, y, r, e.x, e.y, c.rocketRadius);
    case 'laser':
    case 'spinner': {
      for (const n of emitterNodes(e)) if (circlesOverlap(x, y, r, n.x, n.y, c.emitterRadius)) return true;
      const rr = r + c.laserThickness;
      for (const [ax, ay, bx, by] of laserSegments(e)) {
        if (distSqPointSegment(x, y, ax, ay, bx, by) < rr * rr) return true;
      }
      return false;
    }
    default:
      return false;
  }
}

/** First solid thing the player touches, if any. */
export function collide(x: number, y: number, r: number, ents: readonly Ent[], margin = 0): Hit {
  const side = wallHit(x, r);
  if (side) return { type: 'wall', side };
  for (const e of ents) {
    if (e.gone) continue;
    // Cheap vertical reject
    if (e.kind !== 'laser' && e.kind !== 'spinner' && Math.abs(e.y - y) > e.r + r + margin + 4) continue;
    if (hitsEntity(e, x, y, r, margin)) return { type: 'ent', ent: e };
  }
  return null;
}

export function pickupRadius(e: Ent): number {
  return e.r + CONFIG.collision.pickupExtra;
}
