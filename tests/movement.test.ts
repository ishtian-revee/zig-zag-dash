import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { createPlayer, flip, stepPlayer } from '../src/game/player';
import { MAX_SPEED, sectorAt, sectorLength, sectorName, sectorSpeed, sectorStart } from '../src/game/sectors';

const DT = 1 / 60;
const MAX = CONFIG.movement.maxHeading;

describe('movement', () => {
  it('starts heading right at +60°', () => {
    const p = createPlayer(90, 0);
    expect(p.target).toBe(1);
    expect(p.heading).toBeCloseTo(MAX);
  });

  it('always moves upward and never exceeds ±60°', () => {
    const p = createPlayer(90, 0);
    let lastY = p.y;
    for (let i = 0; i < 600; i++) {
      if (i % 17 === 0) flip(p);
      stepPlayer(p, DT, 70);
      expect(p.y).toBeLessThan(lastY);
      expect(Math.abs(p.heading)).toBeLessThanOrEqual(MAX + 1e-9);
      lastY = p.y;
    }
  });

  it('turns at 360°/s after a tap and then holds the new heading', () => {
    const p = createPlayer(90, 0);
    flip(p);
    stepPlayer(p, DT, 70);
    expect(p.heading).toBeCloseTo(MAX - CONFIG.movement.turnRate * DT, 6);
    // 120° at 360°/s = 1/3 s = 20 frames
    for (let i = 0; i < 25; i++) stepPlayer(p, DT, 70);
    expect(p.heading).toBeCloseTo(-MAX, 9);
    const x = p.x;
    stepPlayer(p, DT, 70);
    expect(p.x - x).toBeCloseTo(70 * Math.sin(-MAX) * DT, 9);
  });

  it('moves at speed along the diagonal', () => {
    const p = createPlayer(90, 0);
    stepPlayer(p, DT, 70);
    expect(Math.hypot(p.x - 90, p.y)).toBeCloseTo(70 * DT, 9);
  });

  it('keeps a constant vertical (scroll) speed through a turn', () => {
    const p = createPlayer(90, 0);
    const vy = 70 * Math.cos(MAX);
    flip(p);
    for (let i = 0; i < 30; i++) {
      const y = p.y;
      stepPlayer(p, DT, 70);
      expect((y - p.y) / DT).toBeCloseTo(vy, 9);
    }
  });

  it('is deterministic', () => {
    const run = () => {
      const p = createPlayer(90, 0);
      for (let i = 0; i < 300; i++) {
        if (i % 23 === 5) flip(p);
        stepPlayer(p, DT, 80);
      }
      return [p.x, p.y, p.heading];
    };
    expect(run()).toEqual(run());
  });
});

describe('sectors', () => {
  it('names loop with II suffixes', () => {
    expect(sectorName(0)).toBe('ALPHA');
    expect(sectorName(3)).toBe('DELTA');
    expect(sectorName(12)).toBe('ALPHA II');
    expect(sectorName(-1)).toBe('');
  });

  it('speed grows 6% per sector, capped at the 8th sector', () => {
    const b = CONFIG.movement.baseSpeed;
    expect(sectorSpeed(0)).toBeCloseTo(b);
    expect(sectorSpeed(1)).toBeCloseTo(b * 1.06);
    expect(sectorSpeed(7)).toBeCloseTo(b * 1.06 ** 7);
    expect(sectorSpeed(20)).toBeCloseTo(sectorSpeed(7));
    expect(MAX_SPEED).toBeCloseTo(sectorSpeed(7));
  });

  it('sector lengths match 20 s of flight', () => {
    expect(sectorLength(0)).toBeCloseTo(20 * CONFIG.movement.baseSpeed * 0.5);
    expect(sectorStart(1) - sectorStart(0)).toBeCloseTo(sectorLength(0));
    expect(sectorAt(0)).toBe(-1);
    expect(sectorAt(sectorStart(0))).toBe(0);
    expect(sectorAt(sectorStart(2) + 1)).toBe(2);
  });
});
