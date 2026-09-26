import { CONFIG } from '../config';

export interface PlayerState {
  x: number;
  y: number;
  /** Heading in radians from straight up; positive = right. */
  heading: number;
  /** +1 or -1: which way the heading is turning towards. */
  target: 1 | -1;
}

export function createPlayer(x: number, y: number, target: 1 | -1 = CONFIG.movement.startHeadingSign): PlayerState {
  return { x, y, heading: target * CONFIG.movement.maxHeading, target };
}

export function flip(p: PlayerState): void {
  p.target = p.target === 1 ? -1 : 1;
}

/**
 * Advance the player one logic step. Pure apart from mutating `p`.
 * Vertical speed is constant (speed · cos maxHeading) so the camera scroll never surges during a turn;
 * only the horizontal component follows the heading, reaching speed · sin maxHeading on the diagonal.
 */
export function stepPlayer(p: PlayerState, dt: number, speed: number): void {
  const m = CONFIG.movement;
  const goal = p.target * m.maxHeading;
  const d = goal - p.heading;
  const maxTurn = m.turnRate * dt;
  p.heading = Math.abs(d) <= maxTurn ? goal : p.heading + Math.sign(d) * maxTurn;
  p.x += speed * Math.sin(p.heading) * dt;
  p.y -= speed * Math.cos(m.maxHeading) * dt;
}

export function playerHitRadius(): number {
  return CONFIG.collision.playerSpriteRadius * CONFIG.collision.playerHitboxScale;
}
