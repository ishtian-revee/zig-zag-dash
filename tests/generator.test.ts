import { describe, expect, it } from 'vitest';
import { CHUNKS } from '../src/game/chunks';
import { Generator } from '../src/game/generator';
import type { Spec } from '../src/game/entities';

function kindsAt(sector: number, n = 400, seed = 9): Set<Spec['t']> {
  const g = new Generator(seed, 0);
  g.placed = 5; // past the safe start
  const kinds = new Set<Spec['t']>();
  for (let i = 0; i < n; i++) for (const s of g.pick(sector).e) kinds.add(s.t);
  return kinds;
}

describe('generator', () => {
  it('has a full library of 30+ chunks', () => {
    expect(CHUNKS.length).toBeGreaterThanOrEqual(30);
  });

  it('introduces hazards by sector', () => {
    const alpha = kindsAt(0);
    for (const k of ['planet', 'moon', 'asteroid', 'coin', 'gem', 'bigmoon'] as const) expect(alpha.has(k), k).toBe(true);
    for (const k of ['rocket', 'laser', 'slider', 'spinner'] as const) expect(alpha.has(k), k).toBe(false);
    const beta = kindsAt(1);
    expect(beta.has('rocket')).toBe(true);
    expect(beta.has('laser')).toBe(false);
    const gamma = kindsAt(2);
    expect(gamma.has('laser')).toBe(true);
    expect(gamma.has('spinner') || gamma.has('slider')).toBe(false);
    const delta = kindsAt(3);
    expect(delta.has('spinner')).toBe(true);
    expect(delta.has('slider')).toBe(true);
    const eps = kindsAt(5);
    for (const k of ['rocket', 'laser', 'slider', 'spinner', 'magnet', 'shield'] as const) expect(eps.has(k), k).toBe(true);
  });

  it('starts every run with safe chunks', () => {
    for (let seed = 1; seed < 30; seed++) {
      const g = new Generator(seed, 0);
      expect(g.next(0).placed.chunk.safe).toBe(true);
      expect(g.next(0).placed.chunk.safe).toBe(true);
    }
  });

  it('prefers harder tiers in later sectors', () => {
    const avgTier = (sector: number) => {
      const g = new Generator(3, 0);
      g.placed = 5;
      let t = 0;
      for (let i = 0; i < 500; i++) t += g.pick(sector).tier;
      return t / 500;
    };
    expect(avgTier(6)).toBeGreaterThan(avgTier(0) + 1);
  });

  it('never repeats the same chunk twice in a row', () => {
    const g = new Generator(5, 0);
    let last = '';
    for (let i = 0; i < 300; i++) {
      const { placed } = g.next(i % 8);
      expect(placed.chunk.id).not.toBe(last);
      last = placed.chunk.id;
    }
  });
});
