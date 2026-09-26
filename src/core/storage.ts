import { CONFIG } from '../config';

export interface SaveData {
  version: 1;
  coins: number;
  best: number;
  /** Furthest sector index reached (-1 = none yet). */
  bestSector: number;
  selectedCharacter: string;
  unlocked: string[];
  stats: {
    runs: number;
    totalCoins: number;
    totalGems: number;
    totalScore: number;
    deaths: number;
    playTimeSec: number;
  };
  settings: { music: boolean; sfx: boolean; reduceEffects: boolean };
  tutorialSeen: boolean;
}

export const DEFAULT_CHARACTER = 'zip';

export function defaultSave(): SaveData {
  return {
    version: 1,
    coins: 0,
    best: 0,
    bestSector: -1,
    selectedCharacter: DEFAULT_CHARACTER,
    unlocked: [DEFAULT_CHARACTER],
    stats: { runs: 0, totalCoins: 0, totalGems: 0, totalScore: 0, deaths: 0, playTimeSec: 0 },
    settings: { music: true, sfx: true, reduceEffects: false },
    tutorialSeen: false,
  };
}

const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Migration hook: upgrade older save shapes to the current version. */
const MIGRATIONS: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {
  // 1: (raw) => ({ ...raw, version: 2, newField: ... }),
};

/** Turn any parsed JSON into a valid SaveData, filling gaps with defaults. */
export function sanitize(input: unknown): SaveData {
  let raw = obj(input);
  let v = num(raw.version, 1);
  while (MIGRATIONS[v]) {
    raw = MIGRATIONS[v](raw);
    v = num(raw.version, v + 1);
  }
  const d = defaultSave();
  const stats = obj(raw.stats);
  const settings = obj(raw.settings);
  const unlocked = Array.isArray(raw.unlocked) ? raw.unlocked.filter((x): x is string => typeof x === 'string') : [];
  if (!unlocked.includes(DEFAULT_CHARACTER)) unlocked.unshift(DEFAULT_CHARACTER);
  const selected = typeof raw.selectedCharacter === 'string' && unlocked.includes(raw.selectedCharacter) ? raw.selectedCharacter : DEFAULT_CHARACTER;
  return {
    version: 1,
    coins: Math.max(0, Math.floor(num(raw.coins, d.coins))),
    best: Math.max(0, Math.floor(num(raw.best, d.best))),
    bestSector: Math.max(-1, Math.floor(num(raw.bestSector, d.bestSector))),
    selectedCharacter: selected,
    unlocked: [...new Set(unlocked)],
    stats: {
      runs: num(stats.runs, 0),
      totalCoins: num(stats.totalCoins, 0),
      totalGems: num(stats.totalGems, 0),
      totalScore: num(stats.totalScore, 0),
      deaths: num(stats.deaths, 0),
      playTimeSec: num(stats.playTimeSec, 0),
    },
    settings: {
      music: bool(settings.music, d.settings.music),
      sfx: bool(settings.sfx, d.settings.sfx),
      reduceEffects: bool(settings.reduceEffects, d.settings.reduceEffects),
    },
    tutorialSeen: bool(raw.tutorialSeen, false),
  };
}

export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

function defaultStore(): KV | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadSave(store: KV | null = defaultStore()): SaveData {
  try {
    const text = store?.getItem(CONFIG.save.key);
    if (!text) return defaultSave();
    return sanitize(JSON.parse(text));
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData, store: KV | null = defaultStore()): boolean {
  try {
    store?.setItem(CONFIG.save.key, JSON.stringify(data));
    return !!store;
  } catch {
    return false;
  }
}

export function clearSave(store: KV | null = defaultStore()): void {
  try {
    store?.removeItem(CONFIG.save.key);
  } catch {
    /* storage unavailable */
  }
}
