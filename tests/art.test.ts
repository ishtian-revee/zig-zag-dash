import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../src/game/characters';
import { CONFIG } from '../src/config';
import { SUPPORTED_CHARS } from '../src/render/font';
import { CHARACTER_GRID_IDS, charGrid } from '../src/render/sprites';

describe('art data', () => {
  it('every character has an 11×11 pixel grid', () => {
    for (const c of CHARACTERS) {
      expect(CHARACTER_GRID_IDS).toContain(c.id);
      const g = charGrid(c.id);
      expect(g, c.id).toHaveLength(11);
      for (const row of g) expect(row.length, `${c.id}: ${row}`).toBe(11);
    }
  });

  it('the font covers every character, sector name and UI string', () => {
    const strings = [
      ...CHARACTERS.map((c) => c.name),
      ...CHARACTERS.map((c) => (c.unlock.type === 'milestone' ? c.unlock.label : '')),
      ...CONFIG.sectors.names,
      "HOW TO PLAY TAP TO SWITCH DIRECTION GRAB GEMS FOR POINTS COINS UNLOCK CHARACTERS AVOID WALLS AND OBJECTS ×1 ×2 ×3 BUY ● 100 COPIED! COULDN'T SHARE 0:14 2/12 +3 NEW! GAME OVER READY GO PAUSED",
    ];
    for (const s of strings) for (const ch of s) expect(SUPPORTED_CHARS.includes(ch), `'${ch}' in "${s}"`).toBe(true);
  });
});
