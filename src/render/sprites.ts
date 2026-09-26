// Pixel-grid sprites (all original), baked once into off-screen canvases.

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  return c;
}

export type Grid = readonly string[];
export type PalMap = Record<string, string>;

/** Bake a grid: each char maps to a palette colour; '.' and ' ' are transparent. */
export function bake(grid: Grid, pal: PalMap): HTMLCanvasElement {
  const h = grid.length;
  const w = Math.max(...grid.map((r) => r.length));
  const c = makeCanvas(w, h);
  const g = c.getContext('2d')!;
  for (let y = 0; y < h; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const col = pal[row[x]];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

/** A flat-colour silhouette of a baked sprite. */
export function silhouette(src: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const c = makeCanvas(src.width, src.height);
  const g = c.getContext('2d')!;
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

// ---------------------------------------------------------------- characters (11×11)

const K = '#1a1030';

const CHAR_GRIDS: Record<string, { grid: Grid; pal: PalMap }> = {
  zip: {
    grid: [
      '...wwwww...',
      '..wwwwwww..',
      '.wwwwwwwww.',
      'wwwkwwwkwww',
      'wwwkwwwkwws',
      'wwwwwwwwwws',
      'wkwwwwwwkws',
      'wwkkkkkkwss',
      '.wwwwppwss.',
      '..wwwwsss..',
      '...sssss...',
    ],
    pal: { w: '#f4f4ff', s: '#b9b9d6', k: K, p: '#ff6fa8' },
  },
  donut: {
    grid: [
      '...ddddd...',
      '..dgggggd..',
      '.dggyggcgd.',
      'dgcggggyggd',
      'dggg...gcgd',
      'dgyg...ggdD',
      'dggg...gydD',
      'dggcgggggdD',
      '.dggygcgdD.',
      '..ddgggdD..',
      '...DDDDD...',
    ],
    pal: { d: '#e0a060', D: '#a8662e', g: '#ff7ac8', y: '#ffe14d', c: '#3ff0ff' },
  },
  slime: {
    grid: [
      '....ggg....',
      '..ggggggg..',
      '.glggggggg.',
      '.glggggggG.',
      'gggkgggkggG',
      'gggkgggkggG',
      'ggggggggggG',
      'ggggkkkgggG',
      'gggggggggGG',
      'GgggggggGGG',
      '.GGG.GG.GG.',
    ],
    pal: { g: '#3dff5a', G: '#1fae3a', l: '#c8ffd2', k: K },
  },
  pumpkin: {
    grid: [
      '.....s.....',
      '..ooosooo..',
      '.oooOoOooo.',
      'ooOooOooOoo',
      'oyyOoooOyyo',
      'ooyOoooOyoo',
      'oOoooyoooOo',
      'oyyOyyyOyyo',
      '.oOyoyoyOo.',
      '..OoooooO..',
      '...OOOOO...',
    ],
    pal: { o: '#ff8a1f', O: '#c95a0a', y: '#ffe14d', s: '#3dff5a' },
  },
  catorb: {
    grid: [
      'gg.......gg',
      'gpgggggggpg',
      '.ggggggggg.',
      'gggkgggkggg',
      'gggkgggkggG',
      'gggggpggggG',
      'wwgggkgggww',
      'ggggkgkgggG',
      '.gggggggGG.',
      '..ggggGGG..',
      '...GGGGG...',
    ],
    pal: { g: '#a4a4c0', G: '#6c6c88', p: '#ff9ad0', k: K, w: '#f4f4ff' },
  },
  ember: {
    grid: [
      '...r...r...',
      '..rr.r.rr..',
      '.rorrorror.',
      'rrooyoyoorr',
      'royykyykyor',
      'royyyyyyyor',
      'royywwwyyor',
      'rooywwwyoor',
      '.rooyyyoor.',
      '..rrooorr..',
      '...rrrrr...',
    ],
    pal: { r: '#ff3b2f', o: '#ff8a1f', y: '#ffe14d', w: '#fff6c0', k: K },
  },
  ice: {
    grid: [
      '...ccccc...',
      '..cwcccCc..',
      '.cwwcccCCc.',
      'cwcCccccCcb',
      'cccbcCcbccb',
      'cccbcCcbccb',
      'cCcccCcccCb',
      'ccCcbbbcCbb',
      '.ccCcccCbb.',
      '..cccCbbb..',
      '...bbbbb...',
    ],
    pal: { c: '#bff6ff', C: '#6fd6ff', b: '#3a8fd0', w: '#ffffff' },
  },
  bot: {
    grid: [
      '.....r.....',
      '.....S.....',
      '.SsssssssS.',
      'SsbbsssbbsS',
      'SsbbsssbbsS',
      'SsssssssssS',
      'SskkkkkkksS',
      'SsksksksksS',
      'SskkkkkkksS',
      '.SsssssssS.',
      '..SSSSSSS..',
    ],
    pal: { s: '#d0d0e4', S: '#8a8aa6', b: '#3aa0ff', k: K, r: '#ff2d4a' },
  },
  robogold: {
    grid: [
      '.....r.....',
      '.....S.....',
      '.SsssssssS.',
      'SsbbsssbbsS',
      'SsbbsssbbsS',
      'SsssssssssS',
      'SskkkkkkksS',
      'SsksksksksS',
      'SskkkkkkksS',
      '.SsssssssS.',
      '..SSSSSSS..',
    ],
    pal: { s: '#ffd34d', S: '#c98a12', b: '#3ff0ff', k: K, r: '#ff4d6d' },
  },
  planetkid: {
    grid: [
      '...mmmmm...',
      '..mmmmmmm..',
      '.mmkmmmkmM.',
      '.mmkmmmkmM.',
      'wmmmmmmmmMw',
      'wwwwwwwwwww',
      '.wwmmmmmww.',
      '.mmmmmmmmM.',
      '..mmmmmmM..',
      '...MMMMM...',
      '...........',
    ],
    pal: { m: '#ff2fb3', M: '#b01f86', w: '#f4f4ff', k: K },
  },
  ghosty: {
    grid: [
      '...ggggg...',
      '..ggggggg..',
      '.ggggggggg.',
      'ggkkgggkkgG',
      'ggkkgggkkgG',
      'gggggggggGG',
      'ggggkkkgggG',
      'gggggggggGG',
      'gggggggggGG',
      'ggGggGggGGG',
      'g.Gg.gG.gG.',
    ],
    pal: { g: '#e6e0ff', G: '#a89adc', k: K },
  },
  rainbow: {
    grid: (() => {
      const mask = ['...xxxxx...', '..xxxxxxx..', '.xxxxxxxxx.', 'xxxxxxxxxxx', 'xxxxxxxxxxx', 'xxxxxxxxxxx', 'xxxxxxxxxxx', 'xxxxxxxxxxx', '.xxxxxxxxx.', '..xxxxxxx..', '...xxxxx...'];
      const bands = '123456';
      return mask.map((row, y) =>
        [...row]
          .map((ch, x) => {
            if (ch === '.') return '.';
            if ((y === 4 || y === 5) && (x === 3 || x === 7)) return 'k';
            return bands[Math.floor((x + y) / 2.4) % 6];
          })
          .join(''),
      );
    })(),
    pal: { '1': '#ff3b3b', '2': '#ff8a1f', '3': '#ffe14d', '4': '#3dff5a', '5': '#3aa0ff', '6': '#8e3cff', k: K },
  },
};

const charCache = new Map<string, HTMLCanvasElement>();
const charSilCache = new Map<string, HTMLCanvasElement>();

export function charSprite(id: string): HTMLCanvasElement {
  let c = charCache.get(id);
  if (!c) {
    const d = CHAR_GRIDS[id] ?? CHAR_GRIDS.zip;
    c = bake(d.grid, d.pal);
    charCache.set(id, c);
  }
  return c;
}

export function charSilhouette(id: string): HTMLCanvasElement {
  let c = charSilCache.get(id);
  if (!c) {
    c = silhouette(charSprite(id), '#2a2350');
    charSilCache.set(id, c);
  }
  return c;
}

export const CHARACTER_GRID_IDS = Object.keys(CHAR_GRIDS);
export function charGrid(id: string): Grid {
  return CHAR_GRIDS[id].grid;
}

// ---------------------------------------------------------------- items

const GRIDS = {
  gem1: {
    grid: ['.WcccC.', 'WWccCCC', 'ccccccC', '.cccCC.', '..ccC..', '...C...'],
    pal: { W: '#ffffff', c: '#3ff0ff', C: '#1ca8c0' },
  },
  gem2: {
    grid: ['..lgg..', '.llggG.', 'lllgggG', 'lggggGG', 'gggggGG', '.ggGGG.', '..GGG..'],
    pal: { l: '#b8ffc4', g: '#3dff5a', G: '#18a034' },
  },
  gem3: {
    grid: ['.pp.pp.', 'pWpppPp', 'pWppppP', 'ppppppP', '.ppppP.', '..ppP..', '...P...'],
    pal: { W: '#ffffff', p: '#ff5ec8', P: '#b8248a' },
  },
  coin: {
    grid: ['..ooo..', '.oyyyo.', 'oylyyyo', 'oylyyyo', 'oyyyyyo', '.oyyyo.', '..ooo..'],
    pal: { o: '#c46d00', y: '#ffae1a', l: '#ffe08a' },
  },
  magnet: {
    grid: ['..rrbb..', '.rrrbbb.', 'rrr..bbb', 'rr....bb', 'rr....bb', 'rr....bb', 'ss....ss', 'ss....ss'],
    pal: { r: '#ff2d4a', b: '#2f8cff', s: '#e8e8f4' },
  },
  rocket: {
    grid: ['rr........', 'rwwwwwwr..', '.wwwwbwwrr', 'rwwwwwwr..', 'rr........'],
    pal: { r: '#ff2d4a', w: '#f4f4ff', b: '#3aa0ff' },
  },
  finger: {
    grid: [
      '....kkk.......',
      '...kwwwk......',
      '...kwwwk......',
      '...kwwwk......',
      '...kwwwkkk....',
      '...kwwwwwwkkk.',
      '.kkkwwwwwwwwwk',
      'kwwkwwwwwwwwwk',
      'kwwwwwwwwwwwwk',
      '.kwwwwwwwwwwwk',
      '..kwwwwwwwwwk.',
      '...kwwwwwwwk..',
      '....kwwwwwk...',
      '....kkkkkkk...',
    ],
    pal: { k: '#1a1030', w: '#fbe3cf' },
  },
  mouse: {
    grid: ['.kkkkk.', 'kwwkwwk', 'kwwkwwk', 'kwwkwwk', 'kkkkkkk', 'kwwwwwk', 'kwwwwwk', 'kwwwwwk', 'kwwwwwk', '.kkkkk.'],
    pal: { k: '#1a1030', w: '#f4f4ff' },
  },
  mouseClick: {
    grid: ['.kkkkk.', 'kcckwwk', 'kcckwwk', 'kcckwwk', 'kkkkkkk', 'kwwwwwk', 'kwwwwwk', 'kwwwwwk', 'kwwwwwk', '.kkkkk.'],
    pal: { k: '#1a1030', w: '#f4f4ff', c: '#3ff0ff' },
  },
} satisfies Record<string, { grid: Grid; pal: PalMap }>;

// UI icons: one colour, '#' = on.
const ICONS = {
  gear: ['....#....', '.#.###.#.', '..#####..', '.##...##.', '###...###', '.##...##.', '..#####..', '.#.###.#.', '....#....'],
  sound: ['...#...#.', '..##.#..#', '####..#.#', '####..#.#', '####..#.#', '..##.#..#', '...#...#.'],
  mute: ['...#.....', '..##.....', '####.#.#.', '####..#..', '####.#.#.', '..##.....', '...#.....'],
  stats: ['......##.', '......##.', '...##.##.', '...##.##.', '##.##.##.', '##.##.##.', '#########'],
  share: ['....#....', '...###...', '..#.#.#..', '....#....', '#...#...#', '#...#...#', '#.......#', '#.......#', '#########'],
  play: ['#......', '###....', '#####..', '#######', '#####..', '###....', '#......'],
  back: ['..#......', '.##......', '#########', '.##......', '..#......'],
  pause: ['##.##', '##.##', '##.##', '##.##', '##.##', '##.##'],
  left: ['...##', '..##.', '.##..', '##...', '.##..', '..##.', '...##'],
  right: ['##...', '.##..', '..##.', '...##', '..##.', '.##..', '##...'],
  lock: ['.###.', '#...#', '#...#', '#####', '##.##', '##.##', '#####'],
  check: ['.......#', '......##', '#....##.', '##..##..', '.####...', '..##....'],
  cross: ['#.....#', '##...##', '.##.##.', '..###..', '.##.##.', '##...##', '#.....#'],
  arrowUp: ['..#..', '.###.', '#####', '..#..', '..#..'],
} satisfies Record<string, Grid>;

export type SpriteName = keyof typeof GRIDS;
export type IconName = keyof typeof ICONS;

const spriteCache = new Map<string, HTMLCanvasElement>();

export function sprite(name: SpriteName): HTMLCanvasElement {
  let c = spriteCache.get(name);
  if (!c) {
    c = bake(GRIDS[name].grid, GRIDS[name].pal);
    spriteCache.set(name, c);
  }
  return c;
}

export function gemSprite(v: 1 | 2 | 3): HTMLCanvasElement {
  return sprite(v === 1 ? 'gem1' : v === 2 ? 'gem2' : 'gem3');
}

export function icon(name: IconName, color: string): HTMLCanvasElement {
  const key = `icon:${name}:${color}`;
  let c = spriteCache.get(key);
  if (!c) {
    c = bake(ICONS[name], { '#': color });
    spriteCache.set(key, c);
  }
  return c;
}

/** Draw a baked sprite centred at (x, y), snapped to whole pixels. */
export function drawCentered(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, x: number, y: number, sx = 1, sy = sx): void {
  const w = img.width * Math.abs(sx);
  const h = img.height * Math.abs(sy);
  if (sx < 0 || sy < 0) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(Math.sign(sx) || 1, Math.sign(sy) || 1);
    ctx.drawImage(img, Math.round(-w / 2), Math.round(-h / 2), w, h);
    ctx.restore();
    return;
  }
  ctx.drawImage(img, Math.round(x - w / 2), Math.round(y - h / 2), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}
