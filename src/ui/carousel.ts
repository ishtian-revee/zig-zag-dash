import { CONFIG } from '../config';
import { buy, canBuy, CHARACTERS, isUnlocked, type CharacterDef } from '../game/characters';
import { drawText } from '../render/font';
import { charSilhouette, charSprite, drawCentered, icon, sprite } from '../render/sprites';
import type { App } from './app';
import type { Button } from './widgets';

const W = CONFIG.view.width;
const P = CONFIG.palette;
const SPACING = 34;

/** Swipeable character strip: name, icons, price / lock state and a BUY button. */
export class Carousel {
  /** Index being viewed. */
  index = 0;
  /** Animated (float) index. */
  private pos = 0;
  private dragX: number | null = null;
  private dragStart = 0;
  private dragDelta = 0;
  private pulse = 0;

  constructor(
    private app: App,
    private idPrefix: string,
    /** Top of the strip band. */
    public y: number,
  ) {}

  /** Reset the view to the selected character. */
  sync(): void {
    const i = CHARACTERS.findIndex((c) => c.id === this.app.save.selectedCharacter);
    this.index = Math.max(0, i);
    this.pos = this.index;
  }

  get current(): CharacterDef {
    return CHARACTERS[this.index];
  }

  get height(): number {
    return 64;
  }

  private contains(y: number): boolean {
    return y >= this.y && y < this.y + 50;
  }

  go(delta: number): void {
    const n = CHARACTERS.length;
    const next = Math.max(0, Math.min(n - 1, this.index + delta));
    if (next === this.index) return;
    this.index = next;
    this.app.audio.sfx('click');
    const c = this.current;
    if (isUnlocked(this.app.save, c.id)) {
      this.app.save.selectedCharacter = c.id;
      this.app.persist();
    }
    this.app.announce(this.describe(c));
  }

  describe(c: CharacterDef): string {
    const s = this.app.save;
    if (isUnlocked(s, c.id)) return `${c.name}${s.selectedCharacter === c.id ? ', selected' : ''}`;
    if (c.unlock.type === 'coins') return `${c.name}, locked, costs ${c.unlock.price} coins`;
    if (c.unlock.type === 'milestone') return `${c.name}, locked, ${c.unlock.label.toLowerCase()} to unlock`;
    return c.name;
  }

  buttons(): Button[] {
    const c = this.current;
    const out: Button[] = [
      { id: `${this.idPrefix}-left`, x: 6, y: this.y + 16, w: 14, h: 18, icon: 'left', style: 'dark', name: 'Previous character', onPress: () => this.go(-1), disabled: this.index === 0 },
      {
        id: `${this.idPrefix}-right`,
        x: W - 20,
        y: this.y + 16,
        w: 14,
        h: 18,
        icon: 'right',
        style: 'dark',
        name: 'Next character',
        onPress: () => this.go(1),
        disabled: this.index === CHARACTERS.length - 1,
      },
    ];
    if (canBuy(this.app.save, c) && c.unlock.type === 'coins') {
      const price = c.unlock.price;
      out.push({
        id: `${this.idPrefix}-buy`,
        x: W / 2 - 34,
        y: this.y + 50,
        w: 68,
        h: 14,
        label: `BUY ● ${price}`,
        coin: false,
        style: 'gold',
        name: `Buy ${c.name} for ${price} coins`,
        onPress: () => this.buy(),
      });
    }
    return out;
  }

  private buy(): void {
    const app = this.app;
    const c = this.current;
    if (!buy(app.save, c.id)) return;
    app.persist();
    app.audio.sfx('unlock');
    app.uiParticles.burst(W / 2, this.y + 30, 40, [P.gold, '#ffffff', P.cyan, P.magenta], 90);
    app.toast(`${c.name} UNLOCKED!`, P.gold);
    app.announce(`${c.name} unlocked and selected`);
    this.pulse = 0.4;
  }

  /** Returns true if the press was consumed by the strip. */
  pointerDown(x: number, y: number): boolean {
    if (!this.contains(y)) return false;
    this.dragX = x;
    this.dragStart = x;
    this.dragDelta = 0;
    return true;
  }

  pointerMove(x: number): void {
    if (this.dragX === null) return;
    this.dragDelta = x - this.dragStart;
  }

  pointerUp(x: number): void {
    if (this.dragX === null) return;
    const d = x - this.dragStart;
    this.dragX = null;
    this.dragDelta = 0;
    if (Math.abs(d) > 8) {
      const steps = -Math.round(d / SPACING) || -Math.sign(d);
      this.go(steps);
    } else {
      // Tap on a neighbour selects it.
      const off = Math.round((x - W / 2) / SPACING);
      if (off) this.go(off);
    }
  }

  key(code: string): boolean {
    if (code === 'ArrowLeft') {
      this.go(-1);
      return true;
    }
    if (code === 'ArrowRight') {
      this.go(1);
      return true;
    }
    return false;
  }

  update(dt: number): void {
    const target = this.index - (this.dragX !== null ? this.dragDelta / SPACING : 0);
    this.pos += (target - this.pos) * Math.min(1, dt * 14);
    if (this.pulse > 0) this.pulse = Math.max(0, this.pulse - dt);
  }

  draw(ctx: CanvasRenderingContext2D, time: number): void {
    const save = this.app.save;
    const y = this.y;
    // Band
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, y, W, 50);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, y, W, 1);
    ctx.fillRect(0, y + 49, W, 1);
    const c = this.current;
    const unlocked = isUnlocked(save, c.id);
    drawText(ctx, c.name, W / 2, y + 4, { align: 'center', color: unlocked ? '#ffffff' : '#8a84b8', shadow: '#0b0820' });
    // Icons
    ctx.save();
    ctx.beginPath();
    ctx.rect(22, y, W - 44, 50);
    ctx.clip();
    for (let i = 0; i < CHARACTERS.length; i++) {
      const off = i - this.pos;
      if (Math.abs(off) > 3) continue;
      const ch = CHARACTERS[i];
      const x = W / 2 + off * SPACING;
      const center = Math.abs(off) < 0.5;
      const scale = center ? 2 : 1;
      const own = isUnlocked(save, ch.id);
      const img = own ? charSprite(ch.id) : charSilhouette(ch.id);
      const bob = center && own ? Math.round(Math.sin(time * 3) * 1) : 0;
      const pop = center && this.pulse > 0 ? 1 + this.pulse : 1;
      drawCentered(ctx, img, x, y + 28 + bob, scale * pop);
      if (!own) drawCentered(ctx, icon('lock', center ? '#c9c3ee' : '#6a6490'), x, y + 28 + (center ? 1 : 0));
      if (own && save.selectedCharacter === ch.id && !center) {
        ctx.fillStyle = P.cyan;
        ctx.fillRect(Math.round(x) - 1, y + 38, 2, 2);
      }
    }
    ctx.restore();
    // Price / milestone / selected label
    const ly = y + 42;
    if (unlocked) {
      if (save.selectedCharacter === c.id) drawText(ctx, 'SELECTED', W / 2, ly, { align: 'center', color: P.cyan, shadow: '#0b0820' });
    } else if (c.unlock.type === 'coins') {
      if (!canBuy(save, c)) {
        const t = String(c.unlock.price);
        drawCentered(ctx, sprite('coin'), W / 2 - (t.length * 6) / 2 - 3, ly + 3.5);
        drawText(ctx, t, W / 2 + 3, ly, { align: 'center', color: '#c9c3ee', shadow: '#0b0820' });
      }
    } else if (c.unlock.type === 'milestone') {
      drawText(ctx, c.unlock.label, W / 2, ly, { align: 'center', color: P.gold, shadow: '#0b0820' });
    }
  }
}
