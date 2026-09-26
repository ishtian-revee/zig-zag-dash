// Original 5×7 bitmap font. '#' = pixel on. Narrow glyphs have fewer columns.
const G: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '!': ['#', '#', '#', '#', '#', '.', '#'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '.': ['.', '.', '.', '.', '.', '.', '#'],
  ',': ['..', '..', '..', '..', '..', '.#', '#.'],
  ':': ['.', '#', '.', '.', '.', '#', '.'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '-': ['....', '....', '....', '####', '....', '....', '....'],
  '×': ['.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '.....'],
  '●': ['.....', '.###.', '#####', '#####', '#####', '.###.', '.....'],
  "'": ['#', '#', '.', '.', '.', '.', '.'],
  '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  '%': ['##..#', '##..#', '...#.', '..#..', '.#...', '#..##', '#..##'],
  ' ': ['..', '..', '..', '..', '..', '..', '..'],
};

export const GLYPH_H = 7;
const SPACING = 1;

interface Atlas {
  canvas: HTMLCanvasElement;
  pos: Map<string, { x: number; w: number }>;
}

const layout = (() => {
  const pos = new Map<string, { x: number; w: number }>();
  let x = 0;
  for (const [ch, rows] of Object.entries(G)) {
    const w = rows[0].length;
    pos.set(ch, { x, w });
    x += w + 1;
  }
  return { pos, width: x };
})();

const atlases = new Map<string, Atlas>();

function atlas(color: string): Atlas {
  let a = atlases.get(color);
  if (a) return a;
  const c = document.createElement('canvas');
  c.width = layout.width;
  c.height = GLYPH_H;
  const g = c.getContext('2d')!;
  g.fillStyle = color;
  for (const [ch, rows] of Object.entries(G)) {
    const { x } = layout.pos.get(ch)!;
    rows.forEach((row, y) => {
      for (let i = 0; i < row.length; i++) if (row[i] === '#') g.fillRect(x + i, y, 1, 1);
    });
  }
  a = { canvas: c, pos: layout.pos };
  atlases.set(color, a);
  return a;
}

function glyphOf(ch: string): { x: number; w: number } {
  return layout.pos.get(ch) ?? layout.pos.get(ch.toUpperCase()) ?? layout.pos.get('?')!;
}

/** Width in pixels of text at a scale. */
export function textWidth(text: string, scale = 1): number {
  let w = 0;
  for (const ch of text) w += glyphOf(ch).w + SPACING;
  return Math.max(0, w - SPACING) * scale;
}

export interface TextOpts {
  color?: string;
  scale?: number;
  align?: 'left' | 'center' | 'right';
  /** Drop shadow colour (offset 1 × scale down). */
  shadow?: string;
  /** 1px outline colour (in scaled px). */
  outline?: string;
  /** Extra shadow depth in px (default = scale). */
  shadowDepth?: number;
  alpha?: number;
}

function raw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, scale: number): void {
  const a = atlas(color);
  let cx = x;
  for (const ch of text) {
    const g = glyphOf(ch);
    ctx.drawImage(a.canvas, g.x, 0, g.w, GLYPH_H, cx, y, g.w * scale, GLYPH_H * scale);
    cx += (g.w + SPACING) * scale;
  }
}

/** Draw pixel text. (x, y) is the top-left (or top-centre / top-right by align). */
export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, o: TextOpts = {}): void {
  const scale = o.scale ?? 1;
  const w = textWidth(text, scale);
  let left = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  left = Math.round(left);
  y = Math.round(y);
  const prevAlpha = ctx.globalAlpha;
  if (o.alpha !== undefined) ctx.globalAlpha = prevAlpha * o.alpha;
  if (o.shadow) {
    const d = o.shadowDepth ?? scale;
    for (let i = 1; i <= d; i++) {
      if (o.outline) {
        for (const [dx, dy] of OUTLINE) raw(ctx, text, left + dx, y + dy + i, o.shadow, scale);
      } else raw(ctx, text, left, y + i, o.shadow, scale);
    }
  }
  if (o.outline) for (const [dx, dy] of OUTLINE) raw(ctx, text, left + dx, y + dy, o.outline, scale);
  raw(ctx, text, left, y, o.color ?? '#f4f4ff', scale);
  ctx.globalAlpha = prevAlpha;
}

const OUTLINE: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

export const SUPPORTED_CHARS = Object.keys(G).join('');
