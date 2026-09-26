import { CONFIG } from '../config';

export interface InputHandlers {
  /** Pointer pressed at logical coords (may be outside 0..W / 0..H when on the side fill). */
  pointerDown(x: number, y: number, id: number): void;
  pointerMove(x: number, y: number, id: number): void;
  pointerUp(x: number, y: number, id: number): void;
  /** Key pressed (auto-repeat ignored). */
  keyDown(key: string, e: KeyboardEvent): void;
  /** Any first user gesture (unlocks audio). */
  gesture(): void;
}

/**
 * Pointer events only (they unify mouse + touch, so nothing fires twice).
 * Input counts on press, never on release; key auto-repeat is ignored.
 */
export function attachInput(canvas: HTMLCanvasElement, h: InputHandlers): void {
  const toLogical = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * CONFIG.view.width,
      y: ((e.clientY - r.top) / r.height) * CONFIG.view.height,
    };
  };
  const target = window;
  target.addEventListener(
    'pointerdown',
    (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      h.gesture();
      const p = toLogical(e);
      h.pointerDown(p.x, p.y, e.pointerId);
    },
    { passive: false },
  );
  target.addEventListener('pointermove', (e) => {
    const p = toLogical(e);
    h.pointerMove(p.x, p.y, e.pointerId);
  });
  const up = (e: PointerEvent) => {
    const p = toLogical(e);
    h.pointerUp(p.x, p.y, e.pointerId);
  };
  target.addEventListener('pointerup', up);
  target.addEventListener('pointercancel', up);
  // Block synthetic mouse events, double-tap zoom and scrolling on touch devices.
  for (const type of ['touchstart', 'touchmove', 'touchend', 'gesturestart', 'dblclick'] as const) {
    target.addEventListener(type, (e) => e.preventDefault(), { passive: false });
  }
  target.addEventListener('contextmenu', (e) => e.preventDefault());
  target.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const handled = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Escape'].includes(e.code);
    if (handled) e.preventDefault();
    if (e.repeat) return;
    h.gesture();
    h.keyDown(e.code, e);
  });
}
