import { CONFIG } from './config';
import { attachInput } from './core/input';
import { startLoop } from './core/loop';
import { App } from './ui/app';
import { GameOverScene } from './ui/scenes/gameover';
import { MenuScene } from './ui/scenes/menu';
import { PauseScene } from './ui/scenes/pause';
import { PlayScene } from './ui/scenes/play';
import { ReadyScene } from './ui/scenes/ready';
import { SettingsScene } from './ui/scenes/settings';
import { StatsScene } from './ui/scenes/stats';
import { TutorialScene } from './ui/scenes/tutorial';

const W = CONFIG.view.width;
const H = CONFIG.view.height;

const canvas = document.getElementById('game') as HTMLCanvasElement;
const fill = document.getElementById('fill') as HTMLCanvasElement;
const ctx = canvas.getContext('2d', { alpha: false })!;
ctx.imageSmoothingEnabled = false;
const fctx = fill.getContext('2d')!;

const coarse = matchMedia('(pointer: coarse)').matches;

/** Largest whole-number scale that fits; fractional (still pixelated) on small screens where that leaves too much empty space. */
function computeScale(vw: number, vh: number): number {
  const v = CONFIG.view;
  const frac = Math.min(vw / W, vh / H);
  const int = Math.floor(frac);
  if (frac < v.smallScreenScale) return frac;
  if (coarse && int / frac < v.minIntegerFill) return frac;
  return int;
}

function layout(): void {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  // Snap the CSS scale so the device-pixel scale is whole when possible.
  let s = computeScale(vw, vh);
  if (!Number.isInteger(s)) s = Math.max(1 / dpr, Math.floor(s * dpr) / dpr);
  canvas.style.width = `${Math.round(W * s)}px`;
  canvas.style.height = `${Math.round(H * s)}px`;
  fill.width = Math.max(1, Math.ceil((vw + 80) / 8));
  fill.height = Math.max(1, Math.ceil((vh + 80) / 8));
  updateFill();
}

function updateFill(): void {
  const fw = fill.width;
  const fh = fill.height;
  const s = Math.max(fw / W, fh / H);
  fctx.imageSmoothingEnabled = true;
  fctx.drawImage(canvas, (fw - W * s) / 2, (fh - H * s) / 2, W * s, H * s);
}

const app = new App(ctx, document.getElementById('live'));
app.register('menu', new MenuScene(app));
app.register('ready', new ReadyScene(app));
app.register('play', new PlayScene(app));
app.register('pause', new PauseScene(app));
app.register('gameover', new GameOverScene(app));
app.register('tutorial', new TutorialScene(app));
app.register('settings', new SettingsScene(app));
app.register('stats', new StatsScene(app));
app.go('menu', true);

attachInput(canvas, {
  pointerDown: (x, y) => app.pointerDown(x, y),
  pointerMove: (x, y) => app.pointerMove(x, y),
  pointerUp: (x, y) => app.pointerUp(x, y),
  keyDown: (code, e) => app.keyDown(code, e),
  gesture: () => app.audio.unlock(),
});

// Auto-pause when the tab is hidden or the window loses focus.
const autoPause = () => {
  if (import.meta.env.DEV && (window as unknown as { __noAutoPause?: boolean }).__noAutoPause) return;
  if (app.current === 'play' && !app.run.world.dead) app.go('pause', true);
};
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    autoPause();
    app.audio.suspend();
  } else app.audio.resume();
});
window.addEventListener('blur', autoPause);
window.addEventListener('resize', layout);
window.visualViewport?.addEventListener('resize', layout);
layout();
canvas.focus();

let fillAcc = 0;
startLoop(
  (dt) => app.update(dt),
  (_alpha, frameDt) => {
    app.draw();
    fillAcc += frameDt;
    if (fillAcc >= 1 / CONFIG.view.blurFillHz) {
      fillAcc = 0;
      updateFill();
    }
  },
);

if (import.meta.env.DEV) {
  void import('./debug/overlay').then((m) => m.installDebug(app));
  (window as unknown as { __app: App }).__app = app;
}
