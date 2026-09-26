# Zig Zag Dash

A free, one-tap, neon pixel-art space dash for the browser. Tap to flip your swoop direction, weave through planets, lasers and rockets, grab gems for points and coins to unlock characters. No ads, no accounts, no server.

Built with TypeScript + Canvas 2D + Vite, no runtime dependencies. All art, text and audio are generated in code. See [PLAN.md](PLAN.md) for the design (and its **Deviations** section).

## Run it

Requires Node 22.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests: movement, collision, scoring, saves, generator, chunk solvability
npm run build      # static build in dist/ (relative paths, deployable anywhere)
npm run preview    # serve dist/
```

## Controls

| Action | Input |
|---|---|
| Flip direction / start on READY | Click, tap, `Space`, `↑`, `W` |
| Pause / resume | `Esc`, `P`, pause button |
| Retry on Game Over | `Space`, `Enter`, Play |
| Character carousel | Swipe / drag, arrow buttons, `←` `→` |
| Menu buttons | `Tab` / `Shift+Tab` then `Enter` |
| Debug overlay (dev build only) | `` ` `` then `G` god mode, `N` next sector, `C` +1000 coins, `A` autopilot |

## Tuning

Every tunable (speeds, angles, hitboxes, sector length, palette, spawn rates, audio levels, …) lives in [`src/config.ts`](src/config.ts). Chunks are data in [`src/game/chunks/`](src/game/chunks); `npm test` checks each one (and its mirror) is solvable.

A headless soak run with the autopilot:

```bash
SOAK=1 npx vitest run tests/soak.scratch.test.ts --silent=false
```
