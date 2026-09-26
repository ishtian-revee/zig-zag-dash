import type { SaveData } from '../core/storage';

export type TrailStyle = 'sparkle' | 'sprinkle' | 'drip' | 'ember' | 'paw' | 'fire' | 'snow' | 'spark' | 'dust' | 'mist' | 'rainbow';

export type Unlock = { type: 'free' } | { type: 'coins'; price: number } | { type: 'milestone'; kind: 'sector' | 'score' | 'runs'; value: number; label: string };

export interface CharacterDef {
  id: string;
  name: string;
  unlock: Unlock;
  trail: { style: TrailStyle; colors: string[] };
}

export const CHARACTERS: readonly CharacterDef[] = [
  { id: 'zip', name: 'ZIP', unlock: { type: 'free' }, trail: { style: 'sparkle', colors: ['#f4f4ff', '#c9c9ff'] } },
  { id: 'donut', name: 'DONUT', unlock: { type: 'coins', price: 100 }, trail: { style: 'sprinkle', colors: ['#ff7ac8', '#ffe14d', '#3ff0ff', '#3dff5a'] } },
  { id: 'slime', name: 'SLIME', unlock: { type: 'coins', price: 200 }, trail: { style: 'drip', colors: ['#3dff5a', '#1fae3a'] } },
  { id: 'pumpkin', name: 'PUMPKIN', unlock: { type: 'coins', price: 300 }, trail: { style: 'ember', colors: ['#ff8a1f', '#ffe14d', '#ff3b2f'] } },
  { id: 'catorb', name: 'CAT-ORB', unlock: { type: 'coins', price: 400 }, trail: { style: 'paw', colors: ['#b4b4d0', '#ff9ad0'] } },
  { id: 'ember', name: 'EMBER', unlock: { type: 'coins', price: 500 }, trail: { style: 'fire', colors: ['#ffe14d', '#ff8a1f', '#ff3b2f'] } },
  { id: 'ice', name: 'ICE', unlock: { type: 'coins', price: 600 }, trail: { style: 'snow', colors: ['#ffffff', '#bff6ff', '#6fd6ff'] } },
  { id: 'bot', name: 'BOT', unlock: { type: 'coins', price: 700 }, trail: { style: 'spark', colors: ['#3aa0ff', '#9fd4ff', '#ffffff'] } },
  { id: 'robogold', name: 'ROBO-GOLD', unlock: { type: 'coins', price: 1000 }, trail: { style: 'spark', colors: ['#ffd34d', '#ffae1a', '#fff3b0'] } },
  {
    id: 'planetkid',
    name: 'PLANET-KID',
    unlock: { type: 'milestone', kind: 'sector', value: 2, label: 'REACH GAMMA' },
    trail: { style: 'dust', colors: ['#f4f4ff', '#ff2fb3', '#8e3cff'] },
  },
  {
    id: 'ghosty',
    name: 'GHOSTY',
    unlock: { type: 'milestone', kind: 'score', value: 50, label: 'SCORE 50' },
    trail: { style: 'mist', colors: ['#e6e0ff', '#a89adc'] },
  },
  {
    id: 'rainbow',
    name: 'RAINBOW',
    unlock: { type: 'milestone', kind: 'runs', value: 25, label: 'PLAY 25 RUNS' },
    trail: { style: 'rainbow', colors: ['#ff3b3b', '#ff8a1f', '#ffe14d', '#3dff5a', '#3aa0ff', '#8e3cff'] },
  },
];

export function characterById(id: string): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

export function isUnlocked(save: SaveData, id: string): boolean {
  return save.unlocked.includes(id);
}

export function canBuy(save: SaveData, c: CharacterDef): boolean {
  return c.unlock.type === 'coins' && !isUnlocked(save, c.id) && save.coins >= c.unlock.price;
}

/** Spend coins to unlock and select a character. Returns false if not possible. */
export function buy(save: SaveData, id: string): boolean {
  const c = characterById(id);
  if (!canBuy(save, c) || c.unlock.type !== 'coins') return false;
  save.coins -= c.unlock.price;
  save.unlocked.push(c.id);
  save.selectedCharacter = c.id;
  return true;
}

/** Unlock any milestone characters whose goal is met. Returns the newly unlocked ones. */
export function checkMilestones(save: SaveData, run: { score: number; sector: number }): CharacterDef[] {
  const out: CharacterDef[] = [];
  for (const c of CHARACTERS) {
    if (c.unlock.type !== 'milestone' || isUnlocked(save, c.id)) continue;
    const u = c.unlock;
    const met =
      (u.kind === 'sector' && Math.max(save.bestSector, run.sector) >= u.value) ||
      (u.kind === 'score' && run.score >= u.value) ||
      (u.kind === 'runs' && save.stats.runs >= u.value);
    if (met) {
      save.unlocked.push(c.id);
      out.push(c);
    }
  }
  return out;
}
