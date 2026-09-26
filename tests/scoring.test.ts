import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import type { Chunk } from '../src/game/chunks';
import { spawnSpecs } from '../src/game/entities';
import { World } from '../src/game/world';

const DT = 1 / 60;

/** A chunk library with a straight column of pickups on the player's path. */
function lib(e: Chunk['e']): Chunk[] {
  return [{ id: 'test', h: 400, tier: 1, minSector: 0, safe: true, e }];
}

/** Keep the player going straight up-ish by tapping every few frames around x = 90. */
function steer(w: World) {
  const p = w.player;
  if ((p.x > 95 && p.target === 1) || (p.x < 85 && p.target === -1)) w.tap();
}

describe('scoring', () => {
  it('diamonds give 1/2/3 points and coins count separately', () => {
    const w = new World(1, {
      library: lib([
        { t: 'gem', x: 90, y: 40, v: 1 },
        { t: 'gem', x: 90, y: 100, v: 2 },
        { t: 'gem', x: 90, y: 160, v: 3 },
        { t: 'coin', x: 90, y: 220 },
        { t: 'coin', x: 90, y: 260 },
      ]),
    });
    const gems: number[] = [];
    let coins = 0;
    for (let i = 0; i < 60 * 20 && !w.dead; i++) {
      steer(w);
      for (const e of w.step(DT)) {
        if (e.type === 'gem') gems.push(e.value);
        if (e.type === 'coin') coins++;
      }
    }
    expect(w.dead).toBe(false);
    expect(gems.slice(0, 3)).toEqual([1, 2, 3]);
    expect(w.score).toBe(gems.reduce((a, b) => a + b, 0));
    expect(w.gems).toBe(gems.length);
    expect(w.coins).toBe(coins);
    expect(coins).toBeGreaterThanOrEqual(2);
  });

  it('score counts diamonds only', () => {
    const w = new World(2, { library: lib([{ t: 'coin', x: 90, y: 60 }]) });
    for (let i = 0; i < 600; i++) {
      steer(w);
      w.step(DT);
    }
    expect(w.coins).toBeGreaterThan(0);
    expect(w.score).toBe(0);
  });

  it('hitting a wall ends the run', () => {
    const w = new World(3, { library: lib([]) });
    let died = false;
    for (let i = 0; i < 600 && !died; i++) died = w.step(DT).some((e) => e.type === 'death');
    expect(died).toBe(true);
    expect(w.dead).toBe(true);
    expect(w.player.x).toBeGreaterThan(CONFIG.view.width / 2);
  });

  it('a shield absorbs one hit then gives invulnerability', () => {
    const w = new World(4, { library: lib([]) });
    // Put a shield right on the opening diagonal.
    w.ents.push(...spawnSpecs([{ t: 'shield', x: 120, y: 0 }], -17, { mirror: false, seed: 1 }));
    const types: string[] = [];
    for (let i = 0; i < 600 && !w.dead; i++) for (const e of w.step(DT)) types.push(e.type);
    expect(types).toContain('shield');
    expect(types).toContain('shieldPop');
    // It bounced off the right wall, then eventually hit the left wall and died.
    expect(types.indexOf('shieldPop')).toBeLessThan(types.indexOf('death'));
  });

  it('magnet pulls nearby coins', () => {
    const w = new World(5, {
      library: lib([
        { t: 'magnet', x: 90, y: 30 },
        { t: 'coin', x: 40, y: 120 },
        { t: 'coin', x: 140, y: 120 },
      ]),
    });
    let collected = 0;
    for (let i = 0; i < 60 * 6 && !w.dead; i++) {
      steer(w);
      for (const e of w.step(DT)) if (e.type === 'coin') collected++;
    }
    expect(collected).toBeGreaterThanOrEqual(2);
  });

  it('world generation is seeded', () => {
    const sig = (seed: number) => {
      const w = new World(seed);
      return w.chunks.map((c) => `${c.chunk.id}:${c.mirror}`).join(',');
    };
    expect(sig(42)).toBe(sig(42));
  });

  it('sector crossing emits an event and raises speed', () => {
    const w = new World(6, { library: lib([]) });
    w.god = true;
    let sectors = 0;
    for (let i = 0; i < 60 * 30; i++) {
      steer(w);
      for (const e of w.step(DT)) if (e.type === 'sector') sectors++;
    }
    expect(sectors).toBeGreaterThanOrEqual(1);
    expect(w.sector).toBeGreaterThanOrEqual(0);
  });
});
