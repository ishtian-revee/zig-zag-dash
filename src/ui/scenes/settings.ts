import { CONFIG } from '../../config';
import { clearSave, defaultSave } from '../../core/storage';
import { drawText } from '../../render/font';
import type { App, Scene } from '../app';
import type { Button } from '../widgets';

const W = CONFIG.view.width;
const P = CONFIG.palette;

export class SettingsScene implements Scene {
  private confirmT = 0;
  constructor(private app: App) {}

  enter(): void {
    this.confirmT = 0;
  }

  private toggle(key: 'music' | 'sfx' | 'reduceEffects'): void {
    const app = this.app;
    const st = app.save.settings;
    st[key] = !st[key];
    app.audio.setMusic(st.music);
    app.audio.setSfx(st.sfx);
    app.applyEffects();
    app.persist();
    app.announce(`${key === 'reduceEffects' ? 'Reduce effects' : key === 'sfx' ? 'Sound effects' : 'Music'} ${st[key] ? 'on' : 'off'}`);
  }

  private reset(): void {
    const app = this.app;
    if (this.confirmT <= 0) {
      this.confirmT = 3;
      app.announce('Tap reset again to confirm');
      return;
    }
    clearSave();
    const fresh = defaultSave();
    // Keep audio/effects preferences; wipe progress.
    fresh.settings = { ...app.save.settings };
    Object.assign(app.save, fresh);
    app.persist();
    this.confirmT = 0;
    app.toast('PROGRESS RESET', P.readyRed);
    app.announce('Progress reset');
  }

  buttons(): Button[] {
    const st = this.app.save.settings;
    const row = (id: string, y: number, label: string, on: boolean, fn: () => void): Button => ({
      id,
      x: 20,
      y,
      w: W - 40,
      h: 22,
      label: `${label}  ${on ? 'ON' : 'OFF'}`,
      icon: on ? 'check' : 'cross',
      style: on ? 'blue' : 'dark',
      name: `${label} ${on ? 'on' : 'off'}`,
      onPress: fn,
    });
    return [
      row('set-music', 56, 'MUSIC', st.music, () => this.toggle('music')),
      row('set-sfx', 86, 'SFX', st.sfx, () => this.toggle('sfx')),
      row('set-reduce', 116, 'REDUCE EFFECTS', st.reduceEffects, () => this.toggle('reduceEffects')),
      {
        id: 'set-tutorial',
        x: 20,
        y: 158,
        w: W - 40,
        h: 22,
        label: 'REPLAY TUTORIAL',
        style: 'outline',
        onPress: () => this.app.go('tutorial'),
      },
      {
        id: 'set-reset',
        x: 20,
        y: 188,
        w: W - 40,
        h: 22,
        label: this.confirmT > 0 ? 'SURE? TAP AGAIN' : 'RESET PROGRESS',
        style: this.confirmT > 0 ? 'coral' : 'outline',
        name: this.confirmT > 0 ? 'Confirm reset progress' : 'Reset progress',
        onPress: () => this.reset(),
      },
      { id: 'set-back', x: W / 2 - 30, y: 272, w: 60, h: 24, icon: 'back', label: 'BACK', style: 'blue', onPress: () => this.back() },
    ];
  }

  update(dt: number): void {
    if (this.confirmT > 0) this.confirmT = Math.max(0, this.confirmT - dt);
  }

  back(): void {
    this.app.go('menu');
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const app = this.app;
    app.bg.draw(ctx, -app.time * 8, app.time, app.save.settings.reduceEffects);
    ctx.fillStyle = 'rgba(5,3,16,0.45)';
    ctx.fillRect(0, 0, W, CONFIG.view.height);
    drawText(ctx, 'SETTINGS', W / 2, 18, { scale: 2, align: 'center', color: '#ffffff', shadow: '#0b0820', shadowDepth: 2 });
    if (this.confirmT > 0) drawText(ctx, 'ALL PROGRESS WILL BE LOST', W / 2, 216, { align: 'center', color: P.readyRed, scale: 1 });
  }
}
