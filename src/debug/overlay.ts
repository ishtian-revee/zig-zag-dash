// Dev-only debug overlay (loaded via import.meta.env.DEV, so it is tree-shaken from production builds).
import { CONFIG } from '../config';
import { obstacleRadius } from '../game/collision';
import { emitterNodes, laserSegments, SOLID } from '../game/entities';
import { playerHitRadius } from '../game/player';
import { drawText } from '../render/font';
import type { App } from '../ui/app';
import { Autopilot } from './autopilot';

export function installDebug(app: App): void {
  let on = false;
  let frames = 0;
  let fps = 0;
  let last = performance.now();
  const auto = new Autopilot();
  let idle = 0;
  const runs: number[] = [];

  const circle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  };

  app.debug = {
    tick(dt) {
      if (!auto.on) return;
      if (app.current === 'play') {
        if (auto.decide(app.run.world)) app.run.tap();
        idle = 0;
      } else if (app.current === 'ready' || app.current === 'gameover') {
        idle += dt;
        if (idle > 1.2) {
          idle = 0;
          if (app.current === 'gameover') {
            runs.push(app.run.world.sector);
            console.info(`[autopilot] run ${runs.length}: sector ${app.run.world.sector} score ${app.run.world.score} t=${app.run.playTime.toFixed(1)}s`);
          }
          app.keyDown('Space', new KeyboardEvent('keydown'));
        }
      }
    },
    key(code) {
      if (code === 'Backquote') {
        on = !on;
        return true;
      }
      if (!on) return false;
      const w = app.run.world;
      if (code === 'KeyG') {
        w.god = !w.god;
        app.toast(w.god ? 'GOD MODE ON' : 'GOD MODE OFF', CONFIG.palette.cyan);
        return true;
      }
      if (code === 'KeyN') {
        w.jumpToNextSector();
        return true;
      }
      if (code === 'KeyA') {
        auto.on = !auto.on;
        app.toast(auto.on ? 'AUTOPILOT ON' : 'AUTOPILOT OFF', CONFIG.palette.cyan);
        return true;
      }
      if (code === 'KeyC') {
        app.save.coins += 1000;
        app.persist();
        app.toast('+1000 COINS', CONFIG.palette.gold);
        return true;
      }
      return false;
    },
    draw(ctx) {
      frames++;
      const now = performance.now();
      if (now - last >= 500) {
        fps = Math.round((frames * 1000) / (now - last));
        frames = 0;
        last = now;
      }
      if (!on) return;
      const run = app.run;
      const w = run.world;
      const cam = run.cam;
      ctx.save();
      ctx.lineWidth = 1;
      if (app.current === 'play' || app.current === 'ready' || app.current === 'pause') {
        ctx.strokeStyle = 'rgba(255,60,60,0.9)';
        for (const e of w.ents) {
          if (!SOLID.has(e.kind)) continue;
          if (e.kind === 'laser' || e.kind === 'spinner') {
            for (const n of emitterNodes(e)) circle(ctx, n.x, n.y - cam, CONFIG.collision.emitterRadius);
            ctx.strokeStyle = 'rgba(255,200,60,0.9)';
            for (const [ax, ay, bx, by] of laserSegments(e)) {
              ctx.beginPath();
              ctx.moveTo(ax, ay - cam);
              ctx.lineTo(bx, by - cam);
              ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(255,60,60,0.9)';
          } else if (e.kind === 'rocket') {
            if (e.state === 2) circle(ctx, e.x, e.y - cam, CONFIG.collision.rocketRadius);
          } else circle(ctx, e.x, e.y - cam, obstacleRadius(e));
        }
        ctx.strokeStyle = 'rgba(60,255,120,0.9)';
        circle(ctx, w.player.x, w.player.y - cam, playerHitRadius());
      }
      ctx.restore();
      const lines = [
        `FPS ${fps}`,
        `ENTS ${w.ents.length} PT ${run.particles.list.length}`,
        `SEED ${run.seed}`,
        `SPD ${w.speed.toFixed(1)} SEC ${w.sector}`,
        `D ${Math.round(w.distance)}`,
        w.god ? 'GOD' : '',
        'G GOD N NEXT C +1000 A AUTO',
      ];
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 36, 110, lines.length * 9 + 2);
      lines.forEach((l, i) => drawText(ctx, l, 2, 38 + i * 9, { color: '#9fff9f' }));
    },
  };
}
