import { CONFIG } from '../config';

export function sectorName(i: number): string {
  const names = CONFIG.sectors.names;
  if (i < 0) return '';
  const lap = Math.floor(i / names.length);
  const base = names[i % names.length];
  return lap === 0 ? base : `${base} ${'I'.repeat(lap + 1)}`;
}

/** Forward speed (px/s) in sector i. Before the ALPHA line counts as sector 0. */
export function sectorSpeed(i: number): number {
  const m = CONFIG.movement;
  const idx = Math.max(0, Math.min(i, m.speedCapSector));
  return m.baseSpeed * Math.pow(1 + m.speedGrowthPerSector, idx);
}

export const MAX_SPEED = sectorSpeed(CONFIG.movement.speedCapSector);

/** Vertical length of sector i: its flight time at its speed, converted to distance. */
export function sectorLength(i: number): number {
  const s = CONFIG.sectors;
  return s.secondsPerSector * sectorSpeed(i) * s.verticalFactor;
}

const boundaryCache: number[] = [CONFIG.sectors.firstLineDistance];

/** Distance from the start at which sector i begins (the line with its name). */
export function sectorStart(i: number): number {
  while (boundaryCache.length <= i) {
    const k = boundaryCache.length - 1;
    boundaryCache.push(boundaryCache[k] + sectorLength(k));
  }
  return boundaryCache[i];
}

/** Sector index at a travelled distance (-1 before the ALPHA line). */
export function sectorAt(distance: number): number {
  if (distance < sectorStart(0)) return -1;
  let i = 0;
  while (sectorStart(i + 1) <= distance) i++;
  return i;
}
