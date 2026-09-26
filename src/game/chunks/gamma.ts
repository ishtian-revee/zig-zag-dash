import { coinCluster, coinLine, type Chunk } from './types';

// GAMMA+: static laser gates with emitters.
export const GAMMA_CHUNKS: Chunk[] = [
  {
    id: 'g-chevron',
    h: 260,
    tier: 2,
    minSector: 2,
    e: [
      { t: 'laser', pts: [[4, 110], [58, 140]] },
      { t: 'laser', pts: [[122, 140], [176, 110]] },
      ...coinCluster(90, 140),
      { t: 'gem', x: 90, y: 200, v: 2 },
      { t: 'asteroid', x: 30, y: 220, r: 3 },
    ],
  },
  {
    id: 'g-diamond',
    h: 280,
    tier: 2,
    minSector: 2,
    e: [
      { t: 'laser', pts: [[90, 90], [118, 140], [90, 190], [62, 140]], closed: true },
      { t: 'gem', x: 90, y: 140, v: 3 },
      ...coinLine(30, 110, 30, 170, 4),
      ...coinLine(150, 110, 150, 170, 4),
      { t: 'moon', x: 150, y: 240, r: 6 },
    ],
  },
  {
    id: 'g-offset-gate',
    h: 260,
    tier: 3,
    minSector: 2,
    e: [
      { t: 'laser', pts: [[4, 140], [52, 140]] },
      { t: 'laser', pts: [[104, 140], [176, 140]] },
      ...coinLine(78, 110, 78, 170, 4),
      { t: 'planet', x: 140, y: 220, r: 16, c: 'green' },
      { t: 'gem', x: 70, y: 225, v: 1 },
    ],
  },
  {
    id: 'g-double-gate',
    h: 300,
    tier: 3,
    minSector: 2,
    e: [
      { t: 'laser', pts: [[4, 100], [96, 100]] },
      { t: 'laser', pts: [[146, 100], [176, 100]] },
      { t: 'laser', pts: [[4, 220], [34, 220]] },
      { t: 'laser', pts: [[84, 220], [176, 220]] },
      ...coinLine(121, 80, 59, 240, 6),
      { t: 'gem', x: 90, y: 160, v: 2 },
    ],
  },
  {
    id: 'g-zigzag-beams',
    h: 300,
    tier: 3,
    minSector: 2,
    e: [
      { t: 'laser', pts: [[4, 80], [100, 130]] },
      { t: 'laser', pts: [[176, 170], [80, 220]] },
      ...coinLine(150, 90, 150, 150, 3),
      ...coinLine(30, 190, 30, 250, 3),
      { t: 'gem', x: 90, y: 175, v: 2 },
    ],
  },
  {
    id: 'g-gate-planets',
    h: 300,
    tier: 3,
    minSector: 2,
    e: [
      { t: 'planet', x: 30, y: 90, r: 18, c: 'violet' },
      { t: 'planet', x: 150, y: 90, r: 18, c: 'blue' },
      { t: 'laser', pts: [[60, 190], [90, 170], [120, 190]] },
      { t: 'gem', x: 90, y: 150, v: 1 },
      ...coinLine(35, 180, 35, 250, 4),
      ...coinLine(145, 180, 145, 250, 4),
    ],
  },
  {
    id: 'g-magnet-gate',
    h: 280,
    tier: 2,
    minSector: 2,
    e: [
      { t: 'magnet', x: 90, y: 60 },
      { t: 'laser', pts: [[4, 160], [66, 160]] },
      { t: 'laser', pts: [[114, 160], [176, 160]] },
      ...coinLine(20, 190, 160, 190, 8),
      ...coinLine(20, 125, 160, 125, 8),
      { t: 'gem', x: 90, y: 230, v: 3 },
    ],
  },
];
