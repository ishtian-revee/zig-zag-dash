import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { collide, hitsEntity, wallHit } from '../src/game/collision';
import { spawnSpecs, updateEntity } from '../src/game/entities';
import { playerHitRadius } from '../src/game/player';

const R = playerHitRadius();
const one = (spec: Parameters<typeof spawnSpecs>[0][number]) => spawnSpecs([spec], 0, { mirror: false, seed: 1 })[0];

describe('collision', () => {
  it('player hitbox is 75% of the sprite radius', () => {
    expect(R).toBeCloseTo(CONFIG.collision.playerSpriteRadius * 0.75);
  });

  it('side walls kill', () => {
    expect(wallHit(90, R)).toBe(0);
    expect(wallHit(CONFIG.field.wallInset + R - 0.1, R)).toBe(-1);
    expect(wallHit(CONFIG.view.width - CONFIG.field.wallInset - R + 0.1, R)).toBe(1);
    expect(collide(1, 0, R, [])).toEqual({ type: 'wall', side: -1 });
  });

  it('planet hitbox is 90% of its visual radius', () => {
    const p = one({ t: 'planet', x: 90, y: 0, r: 20 });
    const edge = 20 * 0.9 + R;
    expect(hitsEntity(p, 90 + edge - 0.05, 0, R)).toBe(true);
    expect(hitsEntity(p, 90 + edge + 0.05, 0, R)).toBe(false);
  });

  it('lasers are thick segments and emitters are solid', () => {
    const l = one({ t: 'laser', pts: [[40, 0], [140, 0]] });
    const reach = R + CONFIG.collision.laserThickness;
    expect(hitsEntity(l, 90, reach - 0.05, R)).toBe(true);
    expect(hitsEntity(l, 90, reach + 0.05, R)).toBe(false);
    expect(hitsEntity(l, 40 - CONFIG.collision.emitterRadius - R + 0.1, 0, R)).toBe(true);
  });

  it('rockets only hit once flying', () => {
    const r = one({ t: 'rocket', y: 0, side: 'L', slope: 0, lead: 50 });
    r.x = 90;
    expect(hitsEntity(r, 90, 0, R)).toBe(false);
    r.state = 2;
    expect(hitsEntity(r, 90, 0, R)).toBe(true);
  });

  it('spinner beam rotates with time', () => {
    const s = one({ t: 'spinner', x: 90, y: 0, len: 30, spin: Math.PI / 2, a0: 0 });
    updateEntity(s, 0, 0, 0);
    expect(hitsEntity(s, 115, 0, R)).toBe(true); // horizontal beam
    updateEntity(s, 1, 0, 0); // rotated 90°
    expect(hitsEntity(s, 115, 0, R)).toBe(false);
    expect(hitsEntity(s, 90, 25, R)).toBe(true);
  });

  it('mirroring flips x', () => {
    const [a] = spawnSpecs([{ t: 'moon', x: 30, y: 10, r: 5 }], 100, { mirror: true, seed: 1 });
    expect(a.x).toBe(CONFIG.view.width - 30);
    expect(a.y).toBe(90);
  });
});
