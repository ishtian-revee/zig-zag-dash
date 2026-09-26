import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { defaultSave, loadSave, sanitize, writeSave, type KV } from '../src/core/storage';

function mem(): KV & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe('save', () => {
  it('round-trips through storage under the versioned key', () => {
    const s = mem();
    const d = defaultSave();
    d.coins = 123;
    d.best = 9;
    d.unlocked.push('donut');
    expect(writeSave(d, s)).toBe(true);
    expect(s.data.has(CONFIG.save.key)).toBe(true);
    expect(loadSave(s)).toEqual(d);
  });

  it('falls back to defaults on missing or corrupt data', () => {
    const s = mem();
    expect(loadSave(s)).toEqual(defaultSave());
    s.setItem(CONFIG.save.key, '{not json');
    expect(loadSave(s)).toEqual(defaultSave());
    s.setItem(CONFIG.save.key, '[1,2,3]');
    expect(loadSave(s)).toEqual(defaultSave());
  });

  it('repairs partial / invalid fields', () => {
    const r = sanitize({ coins: -5, best: 'x', selectedCharacter: 'ghosty', unlocked: ['donut', 7], settings: { music: false } });
    expect(r.coins).toBe(0);
    expect(r.best).toBe(0);
    expect(r.unlocked).toEqual(['zip', 'donut']);
    expect(r.selectedCharacter).toBe('zip'); // not unlocked
    expect(r.settings).toEqual({ music: false, sfx: true, reduceEffects: false });
  });

  it('works when storage is unavailable or throws', () => {
    const broken: KV = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {},
    };
    expect(loadSave(broken)).toEqual(defaultSave());
    expect(writeSave(defaultSave(), broken)).toBe(false);
    expect(loadSave(null)).toEqual(defaultSave());
  });
});
