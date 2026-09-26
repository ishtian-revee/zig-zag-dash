import type { SaveData } from '../core/storage';
import { checkMilestones, type CharacterDef } from './characters';

export interface RunSummary {
  score: number;
  coins: number;
  gems: number;
  /** Sector index reached (-1 = none). */
  sector: number;
  playTime: number;
}

export interface RunResult extends RunSummary {
  best: number;
  newBest: boolean;
  newBestSector: boolean;
  totalCoins: number;
  unlocked: CharacterDef[];
}

/** Fold a finished run into the save. Pure apart from mutating `save`. */
export function applyRun(save: SaveData, run: RunSummary): RunResult {
  const prevBest = save.best;
  const newBest = run.score > prevBest;
  const newBestSector = run.sector > save.bestSector;
  save.coins += run.coins;
  if (newBest) save.best = run.score;
  if (newBestSector) save.bestSector = run.sector;
  const s = save.stats;
  s.runs += 1;
  s.deaths += 1;
  s.totalCoins += run.coins;
  s.totalGems += run.gems;
  s.totalScore += run.score;
  s.playTimeSec += run.playTime;
  const unlocked = checkMilestones(save, { score: run.score, sector: run.sector });
  return { ...run, best: save.best, newBest, newBestSector, totalCoins: save.coins, unlocked };
}
