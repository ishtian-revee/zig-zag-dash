import { CONFIG } from '../../config';
import { drawText } from '../../render/font';
import type { App, Scene } from '../app';
import type { Button } from '../widgets';

const W = CONFIG.view.width;

/** Placeholder menu (replaced by the full menu in M3). */
export class MenuScene implements Scene {
  constructor(private app: App) {}
  enter(): void {
    this.app.audio.play('menu');
    this.app.audio.duck(false);
  }
  buttons(): Button[] {
    return [{ id: 'menu-play', x: W / 2 - 40, y: 200, w: 80, h: 30, icon: 'play', style: 'coral', name: 'Play', onPress: () => this.app.go('ready') }];
  }
  update(): void {}
  key(code: string): boolean {
    if (code === 'Space' || code === 'Enter') {
      this.app.go('ready');
      return true;
    }
    return false;
  }
  draw(ctx: CanvasRenderingContext2D): void {
    this.app.bg.draw(ctx, -this.app.time * 10, this.app.time, false);
    drawText(ctx, 'ZIG ZAG', W / 2, 80, { scale: 3, align: 'center', color: '#1c1640', outline: '#ffffff', shadow: CONFIG.palette.gold, shadowDepth: 3 });
    drawText(ctx, 'DASH', W / 2, 108, { scale: 3, align: 'center', color: '#1c1640', outline: '#ffffff', shadow: CONFIG.palette.gold, shadowDepth: 3 });
  }
}
