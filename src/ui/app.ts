import { AudioEngine } from '../audio/audio';
import { CONFIG } from '../config';
import { loadSave, writeSave, type SaveData } from '../core/storage';
import { Background } from '../render/background';
import { Particles } from '../render/particles';
import { drawText, textWidth } from '../render/font';
import { Run } from './run';
import { drawButton, hit, roundRect, type Button } from './widgets';

export type SceneName = 'menu' | 'tutorial' | 'ready' | 'play' | 'pause' | 'gameover' | 'settings' | 'stats';

export interface Scene {
  enter?(from: SceneName | null): void;
  exit?(): void;
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
  buttons(): Button[];
  /** Pointer press not on a button. */
  pointerDown?(x: number, y: number): void;
  pointerMove?(x: number, y: number): void;
  pointerUp?(x: number, y: number): void;
  /** Return true if handled. */
  key?(code: string): boolean;
  /** Escape / back behaviour. */
  back?(): void;
}

interface Toast {
  text: string;
  t: number;
  color: string;
}

export class App {
  readonly save: SaveData;
  readonly audio = new AudioEngine();
  readonly bg = new Background();
  /** Screen-space particles for UI (unlock bursts, menu moons). */
  readonly uiParticles = new Particles();
  time = 0;
  run: Run;
  scenes = {} as Record<SceneName, Scene>;
  current: SceneName | null = null;
  private fadeT = 0;
  private fadeNext: SceneName | null = null;
  private fadeIn = 0;
  private toasts: Toast[] = [];
  private focus = -1;
  private keyboardNav = false;
  private pressTimes = new Map<string, number>();
  /** Coarse pointer (touch) → show finger, else mouse icon. */
  readonly touch: boolean;
  debug: { draw(ctx: CanvasRenderingContext2D): void; key(code: string): boolean; tick(dt: number): void } | null = null;

  constructor(
    readonly ctx: CanvasRenderingContext2D,
    private live: HTMLElement | null,
  ) {
    this.save = loadSave();
    this.touch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
    this.audio.setMusic(this.save.settings.music);
    this.audio.setSfx(this.save.settings.sfx);
    this.run = new Run(this);
    this.applyEffects();
  }

  register(name: SceneName, s: Scene): void {
    this.scenes[name] = s;
  }

  get scene(): Scene | null {
    return this.current ? this.scenes[this.current] : null;
  }

  persist(): void {
    writeSave(this.save);
  }

  announce(text: string): void {
    if (this.live) this.live.textContent = text;
  }

  toast(text: string, color = '#ffffff'): void {
    this.toasts.push({ text, t: CONFIG.ui.toastTime, color });
  }

  /** Switch scene with a quick fade. `instant` skips the fade (overlays). */
  go(name: SceneName, instant = false): void {
    if (instant || !this.current) {
      this.switchTo(name);
      return;
    }
    if (this.fadeNext) return;
    this.fadeNext = name;
    this.fadeT = CONFIG.ui.fadeTime / 2;
  }

  private switchTo(name: SceneName): void {
    const from = this.current;
    this.scene?.exit?.();
    this.current = name;
    this.focus = -1;
    this.scenes[name].enter?.(from);
  }

  /** Apply the Reduce effects setting to particle systems. */
  applyEffects(): void {
    const d = this.save.settings.reduceEffects ? CONFIG.fx.reduceParticleFactor : 1;
    this.run.particles.density = d;
    this.uiParticles.density = d;
  }

  /** Share a result: Web Share API when available, otherwise copy to the clipboard. */
  async share(score: number, sectorLabel: string): Promise<void> {
    const text = `I scored ${score} and reached ${sectorLabel} in Zig Zag Dash! ${CONFIG.ui.shareUrl}`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'Zig Zag Dash', text });
        return;
      }
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(text);
      this.toast('COPIED!', CONFIG.palette.cyan);
      this.announce('Result copied to the clipboard');
    } catch {
      this.toast("COULDN'T SHARE", CONFIG.palette.readyRed);
    }
  }

  newRun(): void {
    this.run = new Run(this);
    this.bg.setHue(0);
  }

  /** Accent colour for walls in sector i. */
  accent(i: number): string {
    const a = CONFIG.sectors.accents;
    return a[((Math.max(0, i) % a.length) + a.length) % a.length];
  }

  onSector(i: number): void {
    const s = CONFIG.sectors;
    const steps = Math.round(s.hueShiftMax / s.hueShiftPerSector);
    const k = i % (steps * 2);
    this.bg.setHue((k <= steps ? k : steps * 2 - k) * s.hueShiftPerSector);
    this.audio.setLayers(i >= 2 ? 2 : i >= 1 ? 1 : 0);
  }

  /** Quick sound toggle: both music and SFX on or off. */
  toggleSound(): void {
    const st = this.save.settings;
    const on = !(st.music || st.sfx);
    st.music = on;
    st.sfx = on;
    this.audio.setMusic(on);
    this.audio.setSfx(on);
    this.persist();
  }

  pressed(id: string): void {
    this.pressTimes.set(id, this.time);
  }

  // ------------------------------------------------------------ input

  private activate(b: Button): void {
    if (b.disabled) return;
    this.pressed(b.id);
    b.onPress();
  }

  pointerDown(x: number, y: number): void {
    if (this.fadeNext) return;
    this.keyboardNav = false;
    const s = this.scene;
    if (!s) return;
    for (const b of s.buttons()) {
      if (hit(b, x, y)) {
        if (!b.disabled) this.audio.sfx('click');
        this.activate(b);
        return;
      }
    }
    s.pointerDown?.(x, y);
  }

  pointerMove(x: number, y: number): void {
    this.scene?.pointerMove?.(x, y);
  }

  pointerUp(x: number, y: number): void {
    this.scene?.pointerUp?.(x, y);
  }

  keyDown(code: string, e: KeyboardEvent): void {
    if (this.debug?.key(code)) return;
    if (this.fadeNext) return;
    const s = this.scene;
    if (!s) return;
    const buttons = s.buttons().filter((b) => !b.disabled);
    if (code === 'Tab') {
      if (!buttons.length) return;
      this.keyboardNav = true;
      const dir = e.shiftKey ? -1 : 1;
      this.focus = this.focus < 0 ? (dir > 0 ? 0 : buttons.length - 1) : (this.focus + dir + buttons.length) % buttons.length;
      const b = buttons[this.focus];
      this.announce(b.name ?? b.label ?? b.id);
      return;
    }
    if (code === 'Enter' && this.keyboardNav && this.focus >= 0 && buttons[this.focus]) {
      this.audio.sfx('click');
      this.activate(buttons[this.focus]);
      return;
    }
    if (s.key?.(code)) return;
    if (code === 'Escape' && s.back) s.back();
  }

  // ------------------------------------------------------------ loop

  update(dt: number): void {
    this.time += dt;
    this.bg.update(dt);
    if (this.fadeNext) {
      this.fadeT -= dt;
      if (this.fadeT <= 0) {
        const n = this.fadeNext;
        this.fadeNext = null;
        this.switchTo(n);
        this.fadeIn = CONFIG.ui.fadeTime / 2;
      }
    } else if (this.fadeIn > 0) this.fadeIn = Math.max(0, this.fadeIn - dt);
    this.debug?.tick(dt);
    this.scene?.update(dt);
    this.uiParticles.update(dt);
    this.toasts = this.toasts.filter((t) => (t.t -= dt) > 0);
  }

  draw(): void {
    const ctx = this.ctx;
    const s = this.scene;
    if (!s) return;
    s.draw(ctx);
    // Buttons
    const buttons = s.buttons();
    const enabled = buttons.filter((b) => !b.disabled);
    const focused = this.keyboardNav && this.focus >= 0 ? enabled[this.focus] : null;
    for (const b of buttons) {
      const pt = this.pressTimes.get(b.id);
      const press = pt !== undefined && this.time - pt < 0.12 ? 1 : 0;
      drawButton(ctx, b, press, b === focused, this.time);
    }
    this.uiParticles.draw(ctx, 0);
    // Toasts
    let ty = 204;
    for (const t of this.toasts) {
      const a = Math.min(1, t.t * 4);
      const w = textWidth(t.text) + 12;
      ctx.globalAlpha = a;
      roundRect(ctx, CONFIG.view.width / 2 - w / 2, ty, w, 13, '#0b0820', 2);
      drawText(ctx, t.text, CONFIG.view.width / 2, ty + 3, { color: t.color, align: 'center' });
      ctx.globalAlpha = 1;
      ty -= 16;
    }
    this.debug?.draw(ctx);
    // Fade
    let f = 0;
    if (this.fadeNext) f = 1 - this.fadeT / (CONFIG.ui.fadeTime / 2);
    else if (this.fadeIn > 0) f = this.fadeIn / (CONFIG.ui.fadeTime / 2);
    if (f > 0) {
      ctx.fillStyle = `rgba(5,3,16,${Math.min(1, f)})`;
      ctx.fillRect(0, 0, CONFIG.view.width, CONFIG.view.height);
    }
  }
}
