import { coinArc, coinLine, coinPath, type Chunk } from './types';

// BETA+: rockets (moving) join the mix.
export const BETA_CHUNKS: Chunk[] = [
  {
    id: 'b-rocket-open',
    h: 260,
    tier: 2,
    minSector: 1,
    e: [
      { t: 'rocket', y: 150, side: 'L' },
      { t: 'asteroid', x: 150, y: 70, r: 3 },
      { t: 'asteroid', x: 30, y: 220, r: 3 },
      ...coinLine(60, 200, 120, 240, 4),
      { t: 'gem', x: 90, y: 110, v: 1 },
    ],
  },
  {
    id: 'b-rocket-pair',
    h: 300,
    tier: 2,
    minSector: 1,
    e: [
      { t: 'planet', x: 90, y: 150, r: 18, c: 'violet' },
      { t: 'rocket', y: 110, side: 'R', slope: 0.15 },
      { t: 'rocket', y: 240, side: 'L', slope: 0.2 },
      ...coinArc(90, 150, 32, 150, 30, 6),
      { t: 'gem', x: 90, y: 200, v: 2 },
    ],
  },
  {
    id: 'b-coin-lane',
    h: 280,
    tier: 2,
    minSector: 1,
    e: [
      ...coinPath([[40, 50], [140, 130], [40, 220]], 5),
      { t: 'rocket', y: 170, side: 'R', slope: 0.3, lead: 120 },
      { t: 'moon', x: 150, y: 220, r: 6 },
      { t: 'moon', x: 30, y: 120, r: 6 },
      { t: 'gem', x: 140, y: 140, v: 2 },
    ],
  },
  {
    id: 'b-planets-rocket',
    h: 300,
    tier: 3,
    minSector: 1,
    e: [
      { t: 'planet', x: 34, y: 100, r: 22, c: 'green' },
      { t: 'planet', x: 146, y: 200, r: 22, c: 'magenta', ring: true },
      { t: 'rocket', y: 150, side: 'R', slope: 0.1 },
      ...coinLine(110, 90, 70, 200, 5),
      { t: 'gem', x: 50, y: 250, v: 3 },
    ],
  },
  {
    id: 'b-rocket-dive',
    h: 260,
    tier: 3,
    minSector: 1,
    e: [
      { t: 'rocket', y: 200, side: 'L', slope: 0.55, lead: 150 },
      { t: 'asteroid', x: 60, y: 90, r: 3.5 },
      { t: 'asteroid', x: 120, y: 110, r: 3.5 },
      { t: 'asteroid', x: 90, y: 170, r: 3 },
      { t: 'gem', x: 150, y: 220, v: 2 },
      ...coinLine(30, 150, 30, 220, 3),
    ],
  },
  {
    id: 'b-shield-run',
    h: 280,
    tier: 2,
    minSector: 1,
    rare: true,
    e: [
      { t: 'shield', x: 90, y: 90 },
      { t: 'rocket', y: 160, side: 'L', slope: 0.2 },
      { t: 'rocket', y: 230, side: 'R', slope: 0.2 },
      ...coinArc(90, 90, 22, 0, 360, 8).slice(0, 7),
      { t: 'planet', x: 30, y: 230, r: 14, c: 'blue' },
    ],
  },
];
