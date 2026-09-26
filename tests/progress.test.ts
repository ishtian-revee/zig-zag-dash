import { describe, expect, it } from 'vitest';
import { defaultSave } from '../src/core/storage';
import { buy, canBuy, CHARACTERS, characterById, checkMilestones } from '../src/game/characters';
import { applyRun } from '../src/game/progress';

const run = (o: Partial<Parameters<typeof applyRun>[1]> = {}) => ({ score: 0, coins: 0, gems: 0, sector: -1, playTime: 10, ...o });

describe('characters', () => {
  it('has 12 characters with unique ids, Zip free', () => {
    expect(CHARACTERS).toHaveLength(12);
    expect(new Set(CHARACTERS.map((c) => c.id)).size).toBe(12);
    expect(CHARACTERS[0].id).toBe('zip');
    expect(CHARACTERS[0].unlock.type).toBe('free');
  });

  it('buying spends coins, unlocks and selects', () => {
    const s = defaultSave();
    s.coins = 150;
    expect(canBuy(s, characterById('donut'))).toBe(true);
    expect(canBuy(s, characterById('slime'))).toBe(false);
    expect(buy(s, 'donut')).toBe(true);
    expect(s.coins).toBe(50);
    expect(s.unlocked).toContain('donut');
    expect(s.selectedCharacter).toBe('donut');
    expect(buy(s, 'donut')).toBe(false); // already owned
    expect(buy(s, 'slime')).toBe(false); // too expensive
    expect(buy(s, 'ghosty')).toBe(false); // milestone only
  });

  it('milestones unlock on their goals', () => {
    const s = defaultSave();
    expect(checkMilestones(s, { score: 10, sector: 1 })).toEqual([]);
    expect(checkMilestones(s, { score: 10, sector: 2 }).map((c) => c.id)).toEqual(['planetkid']);
    expect(checkMilestones(s, { score: 50, sector: 0 }).map((c) => c.id)).toEqual(['ghosty']);
    s.stats.runs = 25;
    expect(checkMilestones(s, { score: 0, sector: 0 }).map((c) => c.id)).toEqual(['rainbow']);
    expect(checkMilestones(s, { score: 99, sector: 9 })).toEqual([]);
  });
});

describe('applyRun', () => {
  it('adds coins, updates best and stats', () => {
    const s = defaultSave();
    const r1 = applyRun(s, run({ score: 5, coins: 12, gems: 3, sector: 1 }));
    expect(r1.newBest).toBe(true);
    expect(r1.newBestSector).toBe(true);
    expect(s.coins).toBe(12);
    expect(s.best).toBe(5);
    expect(s.bestSector).toBe(1);
    const r2 = applyRun(s, run({ score: 3, coins: 4, gems: 1, sector: 0 }));
    expect(r2.newBest).toBe(false);
    expect(r2.best).toBe(5);
    expect(r2.totalCoins).toBe(16);
    expect(s.bestSector).toBe(1);
    expect(s.stats).toMatchObject({ runs: 2, deaths: 2, totalCoins: 16, totalGems: 4, totalScore: 8, playTimeSec: 20 });
  });

  it('reports milestone unlocks on game over', () => {
    const s = defaultSave();
    const r = applyRun(s, run({ score: 51, sector: 2 }));
    expect(r.unlocked.map((c) => c.id).sort()).toEqual(['ghosty', 'planetkid']);
  });

  it('a zero-score first run is not a new best', () => {
    expect(applyRun(defaultSave(), run()).newBest).toBe(false);
  });
});

describe('quitting a run', () => {
  it('banks coins and records but is not a death', () => {
    const s = defaultSave();
    applyRun(s, run({ score: 4, coins: 9 }), true);
    expect(s.coins).toBe(9);
    expect(s.best).toBe(4);
    expect(s.stats.runs).toBe(1);
    expect(s.stats.deaths).toBe(0);
  });
});
