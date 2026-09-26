import { CONFIG } from '../../config';
import { drawText } from '../../render/font';
import type { App, Scene } from '../app';
import { drawHud } from '../hud';
import { panel, type Button } from '../widgets';

const W = CONFIG.view.width;
const H = CONFIG.view.height;

export class PauseScene implements Scene {
  constructor(private app: App) {}

  enter(): void {
    this.app.audio.duck(true);
    this.app.announce('Paused');
  }

  resume(): void {
    this.app.audio.duck(false);
    this.app.go('play', true);
  }

  buttons(): Button[] {
    const app = this.app;
    const sound = app.save.settings.music || app.save.settings.sfx;
    return [
      { id: 'pause-resume', x: W / 2 - 50, y: 132, w: 100, h: 22, label: 'RESUME', icon: 'play', style: 'coral', onPress: () => this.resume() },
      {
        id: 'pause-sound',
        x: W / 2 - 50,
        y: 162,
        w: 100,
        h: 20,
        label: sound ? 'SOUND ON' : 'SOUND OFF',
        icon: sound ? 'sound' : 'mute',
        style: 'blue',
        name: sound ? 'Sound on' : 'Sound off',
        onPress: () => app.toggleSound(),
      },
      {
        id: 'pause-quit',
        x: W / 2 - 50,
        y: 190,
        w: 100,
        h: 20,
        label: 'QUIT TO MENU',
        style: 'outline',
        onPress: () => {
          app.audio.duck(false);
          app.go('menu');
        },
      },
    ];
  }

  update(dt: number): void {
    this.app.run.update(dt, false);
  }

  key(code: string): boolean {
    if (code === 'Escape' || code === 'KeyP' || code === 'Space') {
      this.resume();
      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const run = this.app.run;
    run.draw(ctx, run.world.sector >= 0 ? this.app.accent(run.world.sector) : CONFIG.palette.readyRed);
    drawHud(ctx, run.world);
    ctx.fillStyle = 'rgba(5,3,16,0.62)';
    ctx.fillRect(0, 0, W, H);
    panel(ctx, W / 2 - 62, 84, 124, 138, '#221a4a');
    drawText(ctx, 'PAUSED', W / 2, 96, { scale: 2, align: 'center', color: '#ffffff', shadow: '#0b0820', shadowDepth: 2 });
  }
}
