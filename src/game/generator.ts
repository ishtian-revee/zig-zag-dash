import { CONFIG } from '../config';
import { Rng } from '../core/rng';
import { CHUNKS, type Chunk } from './chunks';
import { spawnSpecs, type Ent } from './entities';

export interface PlacedChunk {
  chunk: Chunk;
  baseY: number;
  topY: number;
  mirror: boolean;
}

/** Weight of a chunk for a sector: prefers tiers near the sector's target tier. */
export function chunkWeight(c: Chunk, sector: number): number {
  const s = Math.max(0, sector);
  if (c.minSector > s) return 0;
  const targetTier = Math.min(5, 1 + s * 0.6);
  const d = c.tier - targetTier;
  let w = Math.exp(-(d * d) / 1.5);
  // Favour chunks that introduce the sector's new hazards.
  if (c.minSector === s && s > 0) w *= 2.2;
  if (c.rare) w *= 0.25;
  return w;
}

/** Seeded chunk generator. Places chunks upward from a starting base. */
export class Generator {
  readonly rng: Rng;
  nextBase: number;
  placed = 0;
  private lastId = '';

  constructor(
    readonly seed: number,
    startBase: number,
    private readonly library: readonly Chunk[] = CHUNKS,
  ) {
    this.rng = new Rng(seed);
    this.nextBase = startBase;
  }

  pick(sector: number): Chunk {
    const safe = this.placed < CONFIG.gen.safeStartChunks;
    const pool = safe ? this.library.filter((c) => c.safe) : this.library;
    const weights = pool.map((c) => (c.id === this.lastId ? 0 : safe ? 1 : chunkWeight(c, sector)));
    if (!weights.some((w) => w > 0)) return pool[0];
    return pool[this.rng.weighted(weights)];
  }

  /** Place the next chunk; returns its entities. */
  next(sector: number): { placed: PlacedChunk; ents: Ent[] } {
    const chunk = this.pick(sector);
    const mirror = this.rng.chance(0.5);
    const baseY = this.nextBase;
    const r = this.rng;
    const ents = spawnSpecs(chunk.e, baseY, { mirror, rand: () => r.next(), seed: r.int(0, 0x7fffffff) });
    this.nextBase = baseY - chunk.h;
    this.placed++;
    this.lastId = chunk.id;
    return { placed: { chunk, baseY, topY: this.nextBase, mirror }, ents };
  }
}
