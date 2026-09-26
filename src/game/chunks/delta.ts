import { coinArc, coinLine, type Chunk } from './types';

// DELTA+: moving and rotating lasers, denser mixes.
export const DELTA_CHUNKS: Chunk[] = [
  {
    id: 'd-spinner',
    h: 260,
    tier: 3,
    minSector: 3,
    e: [
      { t: 'spinner', x: 90, y: 130, len: 30, spin: 1.6 },
      ...coinArc(90, 130, 44, 200, 340, 5),
      { t: 'gem', x: 90, y: 215, v: 2 },
    ],
  },
  {
    id: 'd-slider-gate',
    h: 280,
    tier: 3,
    minSector: 3,
    e: [
      { t: 'slider', pts: [[-24, 140], [66, 140]], dx: 28, period: 3.2 },
      { t: 'slider', pts: [[114, 140], [204, 140]], dx: 28, period: 3.2 },
      ...coinLine(90, 100, 90, 180, 5),
      { t: 'gem', x: 40, y: 230, v: 1 },
      { t: 'gem', x: 140, y: 230, v: 1 },
    ],
  },
  {
    id: 'd-twin-spinners',
    h: 300,
    tier: 4,
    minSector: 3,
    e: [
      { t: 'spinner', x: 55, y: 100, len: 24, spin: 1.8 },
      { t: 'spinner', x: 125, y: 210, len: 24, spin: -1.8, a0: 1.2 },
      ...coinLine(140, 70, 140, 130, 3),
      ...coinLine(40, 180, 40, 240, 3),
      { t: 'gem', x: 90, y: 155, v: 3 },
    ],
  },
  {
    id: 'd-sliding-diamond',
    h: 280,
    tier: 3,
    minSector: 3,
    e: [
      { t: 'slider', pts: [[90, 100], [114, 140], [90, 180], [66, 140]], closed: true, dx: 40, period: 4 },
      { t: 'gem', x: 90, y: 140, v: 2 },
      ...coinLine(90, 200, 90, 250, 3),
    ],
  },
  {
    id: 'd-spinner-planets',
    h: 320,
    tier: 4,
    minSector: 3,
    e: [
      { t: 'planet', x: 26, y: 90, r: 20, c: 'magenta' },
      { t: 'spinner', x: 120, y: 160, len: 26, spin: 1.4 },
      { t: 'planet', x: 40, y: 250, r: 16, c: 'green', ring: true },
      ...coinLine(80, 110, 80, 210, 5),
      { t: 'gem', x: 150, y: 250, v: 2 },
    ],
  },
  {
    id: 'd-rocket-slider',
    h: 300,
    tier: 4,
    minSector: 3,
    e: [
      { t: 'slider', pts: [[4, 110], [70, 110]], dx: 20, period: 2.6, phase: 0.25 },
      { t: 'slider', pts: [[118, 110], [176, 110]], dx: 20, period: 2.6, phase: 0.25 },
      { t: 'rocket', y: 230, side: 'R', slope: 0.2 },
      ...coinLine(94, 80, 94, 140, 4),
      { t: 'gem', x: 60, y: 200, v: 2 },
    ],
  },
];
