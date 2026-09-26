import { it } from 'vitest';
import { Autopilot } from '../src/debug/autopilot';
import { World } from '../src/game/world';

it('soak', () => {
  const out: string[] = [];
  for (let seed = 1; seed <= 12; seed++) {
    const w = new World(seed * 7777);
    const ap = new Autopilot();
    ap.on = true;
    let t = 0;
    let killer = '';
    while (t < 200 && !w.dead) {
      if (ap.decide(w)) w.tap();
      for (const e of w.step(1 / 60)) if (e.type === 'death') killer = e.ent ? e.ent.kind : 'wall';
      t += 1 / 60;
    }
    const ch = w.chunks.map((c) => c.chunk.id).slice(-3).join(',');
    out.push(`vf=${(w.distance / (t * w.speed)).toFixed(2)} seed ${seed}: t=${t.toFixed(0)} sector=${w.sector} score=${w.score} coins=${w.coins} ${w.dead ? 'died:' + killer + ' near ' + ch : 'alive'}`);
  }
  console.log(out.join('\n'));
});
