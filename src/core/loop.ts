import { CONFIG } from '../config';

/** requestAnimationFrame loop with a fixed logic step and decoupled rendering. */
export function startLoop(update: (dt: number) => void, render: (alpha: number, frameDt: number) => void): void {
  const step = 1 / CONFIG.loop.stepHz;
  let acc = 0;
  let last = performance.now();
  const frame = (now: number) => {
    let gap = (now - last) / 1000;
    last = now;
    if (gap > CONFIG.loop.maxFrameGap) gap = CONFIG.loop.maxFrameGap;
    if (gap < 0) gap = 0;
    acc += gap;
    let n = 0;
    while (acc >= step && n < 20) {
      update(step);
      acc -= step;
      n++;
    }
    render(acc / step, gap);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
