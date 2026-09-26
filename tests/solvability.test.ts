import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { CHUNKS } from '../src/game/chunks';
import { spawnSpecs } from '../src/game/entities';
import { MAX_SPEED, sectorSpeed } from '../src/game/sectors';
import { isTimed, solveChunk, standardEntries } from '../src/game/solver';

const W = CONFIG.view.width;

describe('chunk library', () => {
  it('has unique ids and valid tiers', () => {
    const ids = new Set(CHUNKS.map((c) => c.id));
    expect(ids.size).toBe(CHUNKS.length);
    for (const c of CHUNKS) {
      expect(c.tier).toBeGreaterThanOrEqual(1);
      expect(c.tier).toBeLessThanOrEqual(5);
    }
    expect(CHUNKS.filter((c) => c.safe).length).toBeGreaterThanOrEqual(2);
  });

  it('keeps obstacles inside chunk bounds', () => {
    for (const c of CHUNKS) {
      for (const e of spawnSpecs(c.e, 0, { mirror: false, seed: 1 })) {
        const ys = e.kind === 'laser' ? e.basePts.map((p) => -p.y) : e.kind === 'spinner' ? [-e.y - e.len, -e.y + e.len] : [-e.y - e.r, -e.y + e.r];
        for (const y of ys) {
          expect(y, `${c.id} ${e.kind}`).toBeGreaterThanOrEqual(0);
          expect(y, `${c.id} ${e.kind}`).toBeLessThanOrEqual(c.h);
        }
        if (e.kind !== 'rocket') {
          expect(e.x, `${c.id} ${e.kind}`).toBeGreaterThanOrEqual(0);
          expect(e.x, `${c.id} ${e.kind}`).toBeLessThanOrEqual(W);
        }
      }
    }
  });
});

describe('chunk solvability', () => {
  for (const chunk of CHUNKS) {
    for (const mirror of [false, true]) {
      it(`${chunk.id}${mirror ? ' (mirrored)' : ''}`, () => {
        const speeds = [...new Set([sectorSpeed(chunk.minSector), MAX_SPEED])];
        const t0s = isTimed(chunk) ? [0, 0.6, 1.2, 1.8, 2.4] : [0];
        for (const speed of speeds) {
          for (const t0 of t0s) {
            for (const entry of standardEntries()) {
              const r = solveChunk(chunk, mirror, entry, { speed, t0 });
              expect(r.ok, `entry x=${entry.x} dir=${entry.target} speed=${speed.toFixed(1)} t0=${t0}`).toBe(true);
            }
          }
        }
      });
    }
  }
});

describe('solver sanity', () => {
  it('rejects an impassable chunk (full-width laser)', () => {
    const wall = { id: 'x', h: 200, tier: 1 as const, minSector: 0, e: [{ t: 'laser' as const, pts: [[0, 100], [180, 100]] as [number, number][] }] };
    expect(solveChunk(wall, false, { x: 90, target: 1 }, { speed: 70, t0: 0 }).ok).toBe(false);
  });

  it('rejects a gap too narrow for the player', () => {
    const gap = {
      id: 'y',
      h: 200,
      tier: 1 as const,
      minSector: 0,
      e: [
        { t: 'laser' as const, pts: [[0, 100], [85, 100]] as [number, number][] },
        { t: 'laser' as const, pts: [[95, 100], [180, 100]] as [number, number][] },
      ],
    };
    expect(solveChunk(gap, false, { x: 90, target: 1 }, { speed: 70, t0: 0 }).ok).toBe(false);
  });

  it('finds a path through a gate gap', () => {
    const gap = {
      id: 'z',
      h: 200,
      tier: 1 as const,
      minSector: 0,
      e: [
        { t: 'laser' as const, pts: [[0, 120], [70, 120]] as [number, number][] },
        { t: 'laser' as const, pts: [[110, 120], [180, 120]] as [number, number][] },
      ],
    };
    const r = solveChunk(gap, false, { x: 20, target: -1 }, { speed: 70, t0: 0 });
    expect(r.ok).toBe(true);
    expect(r.taps!.length).toBeGreaterThan(0);
  });
});
