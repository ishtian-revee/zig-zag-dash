import { ALPHA_CHUNKS } from './alpha';
import { BETA_CHUNKS } from './beta';
import { DELTA_CHUNKS } from './delta';
import { EPSILON_CHUNKS } from './epsilon';
import { GAMMA_CHUNKS } from './gamma';
import type { Chunk } from './types';

export const CHUNKS: readonly Chunk[] = [...ALPHA_CHUNKS, ...BETA_CHUNKS, ...GAMMA_CHUNKS, ...DELTA_CHUNKS, ...EPSILON_CHUNKS];
export type { Chunk } from './types';
