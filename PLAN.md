# Zig Zag Dash — Build Plan

A free, browser-based, one-tap vertical endless scroller with neon pixel art in space. It takes its vibe, mechanics and UX from *Swoopy Space* (see `SWOOPY_SPACE_GAME_ANALYSIS.md`), but the name, characters, logo and art are all **original**. It has **no ads, no monetisation, no accounts and no server.**

This file is the source of truth for the build. Values marked *(tunable)* live in one config module so the feel can be adjusted.

---

## 1. Tech & platform

- **Stack:** Vanilla **TypeScript + HTML5 Canvas 2D + Vite**. No game engine and no runtime dependencies. **Vitest** for unit tests.
- **Logical resolution:** **180×320** (9:16), drawn to an off-screen buffer and upscaled by a **whole-number factor** (nearest-neighbour, `imageSmoothingEnabled = false`), centered in the window.
- **Page layout:**
  - Desktop: the game is centered at the largest whole-number scale that fits the window height. The space on either side shows a **blurred, dimmed live copy of the game** (a second canvas with CSS `filter: blur()`, updated at a low rate).
  - Mobile: **letterboxed** at exactly 9:16, with the same blurred fill around it. No page scroll, no pinch zoom, `touch-action: none`, full `100dvh`.
  - If whole-number scaling leaves too much empty space on small screens, fall back to the largest fractional scale, but keep pixels crisp (CSS `image-rendering: pixelated`).
- **Game loop:** `requestAnimationFrame` with a **fixed 60 Hz logic step** (accumulator) and rendering decoupled from logic. Clamp large frame gaps.
- **Persistence:** `localStorage` only, under one versioned key (`zzd.save.v1`). Every read and write is wrapped in try/catch; the game works if storage is unavailable (progress just won't be saved).
- **Deployment:** later (likely GitHub Pages). It must build to a plain static `dist/` with relative asset paths (`base: './'`).

## 2. Controls

| Action | Input |
|---|---|
| Flip swoop direction / start run on READY | Mouse click, touch tap (anywhere on the game), `Space`, `↑`, `W` |
| Pause / resume | `Esc`, `P`, on-screen pause button (top-centre HUD) |
| Auto-pause | `visibilitychange` (tab hidden) and window `blur` |
| Quick retry on Game Over | `Space` / `Enter` / tap the Play button |
| Carousel navigation | Swipe or click-drag, arrow buttons, `←` `→` keys |
| Debug overlay (dev only) | `` ` `` |

Input counts on **pointerdown/keydown** (not on release), with no double-fire when touch and mouse events both arrive. Ignore key auto-repeat.

## 3. Core mechanics

### 3.1 Movement *(tunable)*
- The player always moves **forward (up)** at `speed` px/s (logical px). Base speed about **70 px/s**.
- The heading is an angle from straight up. The **target heading** is **+60° or −60°**, and each tap flips the target.
- The heading rotates towards the target at **360°/s**, then holds at ±60° (it flies straight diagonally until the next tap). It never points downward and never loops.
- The first run starts heading **right** (+60°), shown by the arrow on READY.
- Velocity = `speed · (sin h, −cos h)`. The camera follows the player vertically, keeping it at about **62% down the screen** (more view ahead). No horizontal camera movement.
- Speed grows **+6% per sector**, capped at the 8th sector's speed.

### 3.2 Collision
- The player hitbox is a circle at **75%** of the sprite radius. Obstacle hitboxes are circles at **90%** of their visual radius. Lasers are line segments with a small thickness. Rockets are circles.
- Touching **side walls**, planets, moons, asteroids, lasers, emitters or rockets = death (unless shielded).
- Pickups use a generous circle (sprite radius + 2 px).

### 3.3 Death & retry
- Death: the character **shatters into white pixel squares** (plus its trail colour), with a brief white flash on nearby obstacles, a light screen shake (off with Reduce effects) and an explosion sound.
- After about **0.6 s** the game fades and dims into **Game Over**. `Space`/`Enter`/Play go to **READY**; a tap on READY starts the run with **"GO"**.
- **No continues and no revives.**

## 4. World & level generation

### 4.1 Playfield
- Neon **side walls** (1–2 px glowing lines) at the left and right edges. Red on READY; during play they tint to the current sector's accent colour.
- Background: deep indigo gradient, twinkling 4-point sparkles (several colours), faint dark horizontal nebula bands with parallax, and large soft colour glows behind planets.

### 4.2 Chunk-based generation
- A library of about **30–50 hand-designed chunks** written as data in code. Each chunk has: height, difficulty tier (1–5), minimum sector, list of entities (type, x, y, size, colour, params), and coin/gem layout.
- The generator picks chunks by **seeded RNG** (e.g. mulberry32), weighted towards the current sector's tiers. It applies variations: **horizontal mirroring**, colour swaps, small size/position jitter within safe limits.
- **Coins as guide rails:** arcs around planets, lines along a good swoop path, clusters inside laser gates.
- **Safe starts:** the first 1–2 chunks of every run are easy and open.
- **Solvability test (Vitest):** for each chunk (and its mirror), a search over tap timings (e.g. search over discretised tap times using the real movement code) proves at least one path gets through without collision, at the fastest speed the chunk can appear at.
- The generator is **seedable** so a daily mode can be added later (not in scope now).

### 4.3 Sectors
- Sector length about **20 s of flight** at that sector's speed (convert to distance).
- Names in order: **ALPHA, BETA, GAMMA, DELTA, EPSILON, ZETA, ETA, THETA, IOTA, KAPPA, LAMBDA, MU, …** (loop with "II" suffixes if ever exceeded).
- Crossing a boundary: a full-width **dotted line** with the sector name in the middle, a **confetti stream** along the line, a whoosh sound, the HUD top-centre label updates, a **subtle background hue shift** and a wall accent colour change.
- Hazard introduction:

| Sector | Adds |
|---|---|
| ALPHA | Planets (incl. ringed), small moons, grey asteroids, coins, diamonds |
| BETA | **Rockets** (moving) |
| GAMMA | **Laser gates** (static chevrons/diamonds with emitters) |
| DELTA | **Moving/rotating lasers**, denser mixes |
| EPSILON+ | Harder tiers, tighter spacing, more rockets; speed keeps ramping until the cap |

### 4.4 Hazards

| Hazard | Look | Behaviour |
|---|---|---|
| Side walls | Thin neon vertical lines | Fixed |
| Planets | Glowing magenta/violet/blue/green spheres, pixel craters, slightly jagged edge, soft glow | Static, various radii (10–34 px) |
| Ringed planets | Planet with a tilted white ring | Static; the ring is decorative (hitbox = planet body) |
| Small moons | White/light-grey spheres | Static |
| Big face moon (original design) | Large white pixel moon with its own original face | Rare landmark obstacle; can slowly bob |
| Asteroids | Small dark-grey pixel rocks | Static filler, small hitbox |
| Laser gates | Bright green beams between glowing nodes (chevron `<>` / diamond shapes) | Static (GAMMA+), moving/rotating (DELTA+) |
| Emitters | Dark mechanical blocks with red lights on laser nodes | Static, solid |
| Rockets | Small white/red pixel rockets with flame exhaust | Fly diagonally across the field; a brief **warning blip at the screen edge** shows about 0.7 s before they enter |

### 4.5 Collectibles & power-ups

| Item | Look (shapes differ for colour-blind accessibility) | Effect |
|---|---|---|
| Cyan diamond | Cyan **classic diamond** | +1 score |
| Green gem | Green **emerald cut** (octagon) | +2 score |
| Pink gem | Pink **heart gem** | +3 score |
| Coin | Gold coin with a spin animation (squash on the X axis) | +1 coin |
| **Magnet** | Red/blue horseshoe | 6 s: pulls coins and gems within about 60 px. HUD shows a draining ring icon |
| **Shield** (rare) | Cyan bubble orb | Absorbs one hit: the bubble pops with a burst and you get 1 s of invulnerability with blinking |

Pickup feedback: a **burst of pixels in the item's colour** + a **floating number** ("+1", "+2", "+3") that rises and fades, plus the matching sound.

## 5. Scoring, economy, persistence

- **Score** = sum of diamond values collected this run (diamonds only).
- **Best** = highest score. **Best sector** = furthest sector reached (index + name).
- **Coins**: in-run count shown in the HUD; added to the saved total when the run ends.
- **No** ads, rewarded ads, gifts, No-Ads, Rate or Like.
- **Save data** (`zzd.save.v1`):
  ```ts
  { version: 1, coins, best, bestSector, selectedCharacter, unlocked: string[],
    stats: { runs, totalCoins, totalGems, totalScore, deaths, playTimeSec },
    settings: { music: bool, sfx: bool, reduceEffects: bool },
    tutorialSeen: bool }
  ```
  Handle a missing or corrupt save by falling back to defaults (and keep a migration hook for future versions).

## 6. Characters (cosmetic only)

12 original round characters (about 10–12 px sprites), each with its **own trail colour/particle style**. All drawn in code as pixel grids.

| # | Name | Look | Trail | Unlock |
|---|---|---|---|---|
| 1 | **Zip** (default) | White orb, cheeky grin | White sparkles | Free |
| 2 | Donut | Pink-glazed donut with sprinkles | Sprinkles | 100 coins |
| 3 | Slime | Green jelly blob | Green drips | 200 |
| 4 | Pumpkin | Orange jack-o'-lantern | Orange embers | 300 |
| 5 | Cat-orb | Grey orb with ears and whiskers | Paw-ish pixels | 400 |
| 6 | Ember | Flame ball | Fire | 500 |
| 7 | Ice | Frosty crystal orb | Snowflakes | 600 |
| 8 | Bot | Silver robot head | Blue sparks | 700 |
| 9 | Robo-gold | Gold robot head | Gold sparks | 1000 |
| 10 | Planet-kid | Tiny ringed planet | Ring dust | Milestone: **reach GAMMA** |
| 11 | Ghosty | Little ghost | Faint mist | Milestone: **score 50 in a run** |
| 12 | Rainbow | Rainbow-striped orb | Rainbow trail | Milestone: **play 25 runs** |

- Locked characters show a darkened silhouette plus a price (`● 300`), or the milestone text ("REACH GAMMA").
- Tapping an affordable locked character shows a **BUY ● N** button; buying selects it straight away. Unlocking plays a celebratory sound and burst.
- Milestone unlocks trigger on Game Over with a "NEW CHARACTER!" toast.

## 7. Screens & UX flow

```
Boot → Menu ─Play→ [Tutorial if !tutorialSeen] → READY ─tap→ GO → Play ─death→ Game Over
  ▲                                                        │ pause ↕ Pause overlay
  └──────────── Back ─────────────── Game Over ─Play→ READY
```

All UI is drawn **on the canvas** in the pixel font (no DOM UI except the invisible accessibility helpers listed in §9).

- **Menu:**
  - Coin total at the top-left.
  - **"ZIG ZAG DASH"** chunky pixel logo (original: dark fill, white outline, gold drop shadow) with planets beside it and **small moons drifting in and shattering against the letters**.
  - Character strip: name + carousel (swipe/drag/arrows/keys) + price/lock state.
  - Big coral **Play** button.
  - Bottom row: **Settings, Sound (quick toggle), Stats, Share**.
- **Tutorial** (first launch, replay from Settings): black screen titled **"HOW TO PLAY"**, three panels animating in one after another:
  1. "TAP TO SWITCH DIRECTION" (animated character + tapping finger/cursor).
  2. "GRAB GEMS FOR POINTS" (×1 ×2 ×3 gems) / "COINS UNLOCK CHARACTERS".
  3. "AVOID WALLS AND OBJECTS" (planet + laser + ✖).

  Then a Play button.
- **READY:** red "READY", walls glowing red, character with a facing arrow, dotted zig-zag guide with "TAP" labels, animated tapping finger (a mouse-click icon on desktop). First tap → cyan **"GO"** and the run starts.
- **HUD:** top bar. Coins top-left, gems top-right, sector name top-centre (after ALPHA), small pause button, power-up timer icons.
- **Pause overlay:** "PAUSED", Resume, Quit to Menu, Sound toggle.
- **Game Over:** red "GAME OVER".
  - Gold panel with **SCORE / BEST** (with a "NEW!" badge when a record is broken).
  - **Best sector** line.
  - Coin total.
  - **Share** button.
  - Character strip.
  - **Back / Play** buttons.
- **Settings:** Music on/off, SFX on/off, Reduce effects, Replay tutorial, Reset progress (with a confirm step).
- **Stats:** runs, best score, best sector, total coins, total gems, play time.
- **Share:** `navigator.share` when available, otherwise copy to the clipboard with a "COPIED!" toast. Text: `I scored {score} and reached {SECTOR} in Zig Zag Dash! {URL}`; the URL is a config placeholder until deployment.
- **Transitions:** quick fades (about 150–250 ms) between screens.

## 8. Art direction (all generated in code)

- **Palette** (tunable):

  | Role | Colour |
  |---|---|
  | Background | `#140f2e` → `#221a4a` |
  | Magenta | `#ff2fb3` |
  | Violet | `#8e3cff` |
  | Blue | `#3aa0ff` |
  | Green | `#3dff5a` |
  | Coin gold | `#ffae1a` |
  | Cyan | `#3ff0ff` |
  | White | `#f4f4ff` |
  | Asteroid grey | `#5a5a70` |
  | Coral (primary button) | `#ff4d6d` |
  | UI blue | `#2f8cff` |
  | READY red | `#ff2d4a` |

- **Sprites:** characters, gems, coins, rockets, power-ups, UI icons and the finger/cursor are defined as **string pixel grids + palette maps** and baked once into off-screen canvases.
- **Procedural sprites:** planets (disc + crater dithering + jagged rim + radial glow), rings, moons, asteroids, laser beams and glow, nebula bands and starfield. Cache these by (type, size, colour).
- **Pixel font:** an original 5×7 (and a large 2× display variant) bitmap font defined in code: A–Z, 0–9 and `! ? . , : + - × ● ' / %`.
- **Juice:**
  - trails,
  - pickup bursts + floating numbers,
  - sector confetti,
  - death shatter,
  - coin spin,
  - button press squash,
  - light screen shake,
  - flashes.

  **Reduce effects** turns off shake and flashes and cuts particles by about 60%.
- Everything is placed on **whole pixels** (snap render positions) to avoid shimmer.

## 9. Audio (WebAudio, synthesized)

- A small synth/SFX engine (jsfxr-style parameters): **tap blip, coin, gem (pitch rises with value), magnet, shield pop, sector whoosh, explosion, UI click, unlock fanfare, new-best jingle.**
- **Music:** procedural chiptune sequencer (square/triangle/noise).
  - A calm **menu loop**.
  - A **gameplay loop** that adds **layers at BETA (drums) and GAMMA (arpeggio/lead)**.
  - Music ducks during pause and Game Over.
- Separate **Music** and **SFX** toggles (plus a quick sound toggle on the menu). The audio context unlocks on the first user gesture.
- Accessibility: the canvas has `role="img"` and an aria-label. Visible focus / keyboard support for all menu buttons (Tab / Enter). Keep a hidden live region for score announcements on Game Over.

## 10. Code architecture (suggested)

```
src/
  main.ts            // boot, canvas setup, scaling/letterbox, loop
  config.ts          // all tunables (speeds, angles, hitbox %, palette, sector length)
  core/              // loop, rng (seeded), input, storage, events, math
  game/              // world, player, camera, collision, spawner, chunks/, entities/
  render/            // pixel font, sprite baking, procedural art, particles, bg
  ui/                // scenes: menu, tutorial, ready, hud, pause, gameover, settings, stats
  audio/             // sfx synth, music sequencer
  debug/             // overlay (dev only, tree-shaken via import.meta.env.DEV)
tests/               // vitest: movement, collision, scoring, save/migrate, chunk solvability
```

- Scenes use a simple state machine. Keep game logic pure and deterministic (seeded RNG, fixed step) so it can be tested.
- **Debug overlay (dev only):** hitboxes, FPS/entity count, `G` god mode, `N` jump to next sector, `C` +1000 coins, seed display.

## 11. Milestones & done checks

Commit at the end of each milestone (and more often within one).

### M1 — Core loop
- Vite + TS + Vitest scaffold; scaled canvas with whole-number scaling, letterbox and blurred side fill; fixed-step loop.
- Player movement (§3.1) with every input source, walls, camera, planets/moons/asteroids, coins, the 3 gem types, score/coins HUD, collision/death shatter, a basic Game Over with retry, and a seeded chunk generator with about 10 starter chunks.
- **Done when:** you can play endless runs in the browser on desktop and mobile emulation; tap timing feels responsive; tests pass for movement, collision and scoring.

### M2 — Full world
- Sectors (names, lines, confetti, hue shift, speed ramp); rockets with warnings; laser gates + emitters; moving lasers; magnet + shield; big face moon; full chunk library (30+); solvability tests for every chunk; debug overlay.
- **Done when:** a run moves through ALPHA→DELTA+ with each sector's hazards appearing, and all chunk solvability tests pass.

### M3 — Complete game
- Menu (logo + moon shatter, carousel), tutorial, READY screen, pause, full Game Over, settings, stats, share; the 12 characters with trails, purchase and milestone unlocks; save/migrate; all audio; effects polish; Reduce effects; keyboard/focus accessibility; production build check.
- **Done when:** the whole flow in §7 works; progress survives a reload; the `npm run build` output runs from a static server; there are no console errors; 60 fps on a mid-range phone in emulation.

## 12. Out of scope (for now)

Ads, in-app purchases, rewarded videos, gifts, accounts, online leaderboards, daily challenge (the generator is seedable for later), PWA/offline, deployment.

## 13. Originality guardrails

Do **not** reuse the Swoopy Space name, logo, character names/designs ("Comet", etc.), text or art. Take mechanics and vibe only; all art, names, text, UI layout details and audio are our own.

---

## Deviations

Decisions that turned out not to work as written (or needed an interpretation), with the closest alternative chosen.

1. **HUD: pause button and sector name are both "top-centre".** They can't share the bar at 180 px wide, so the pause button sits in the centre of the top bar and the sector name sits directly below the bar, also centred.
2. **Scaling: "whole-number scale on desktop", "fractional on small screens".** Rule used: fractional (still pixelated) when the fractional fit is below 2× (`view.smallScreenScale`), or on touch screens when the whole-number scale would fill less than 85% (`view.minIntegerFill`). Otherwise the whole-number scale is used. On a 900 px-tall desktop window that means 2× with a wide blurred fill.
3. **Sector length "20 s of flight, converted to distance".** Distance = 20 s × sector speed × `sectors.verticalFactor` (cos 60° = 0.5). Since the vertical speed is constant (see 11), every sector takes exactly 20 s, however often you tap.
4. **Where ALPHA starts.** The run starts a short distance (`sectors.firstLineDistance` = 110 px) below the ALPHA line, so the first line crossing happens about 3 s in and names the sector, as in the reference. "Best sector" is −1 (shown as "-") if you die before it.
5. **Background hue shift per sector.** A straight +18° per sector drifted into brown/red by ZETA and stopped reading as "deep indigo". The shift now steps 12° per sector and bounces back and forth within 0–48° (`sectors.hueShiftPerSector`, `sectors.hueShiftMax`).
6. **Rare chunks.** With tier weighting, "rare" landmark chunks (big face moon, shield nests) almost never appeared in later sectors. Instead, each chunk slot has a `gen.rareChance` (12%) of being drawn from the rare pool (respecting `minSector`).
7. **Solvability test scope.** "Proves at least one path gets through" is tested from 10 standard entry states (x ∈ {20, 55, 90, 125, 160} × both headings). The path must exit the chunk top with x in [20, 160], so consecutive chunks chain. Each test runs at both the chunk's first-sector speed and the capped speed, and at 5 clock phases for chunks with moving hazards. Taps are decided every 4 frames (~67 ms). Planets, moons and asteroids get a margin equal to the position jitter, so every jittered variant stays solvable.
8. **Quit to Menu from Pause.** The plan doesn't say what happens to an abandoned run. Its coins and records are banked, and it counts as a run but not as a death.
9. **Big face moon design.** An original sleepy face (closed eyes, blush, small wavy smile) with a striped nightcap. It shares no features with the reference's open-mouthed moon.
10. **Debug overlay extras.** Besides G/N/C, `A` toggles a dev-only autopilot used for soak-testing long runs. `SOAK=1 npx vitest run tests/soak.scratch.test.ts` runs the same bot headless.
11. **Velocity formula and base speed (after playtest feedback).** With `velocity = speed · (sin h, −cos h)`, the camera scroll (the vertical component) doubled from 35 to 70 px/s every time the heading swept through straight-up during a turn, then dropped back. Each tap felt like a brief speed burst. The start also felt too slow. Now the vertical speed is constant at `speed · cos 60°`, only the horizontal component follows the heading (`speed · sin h`), and `movement.baseSpeed` is 100 (50 px/s scroll, 87 px/s across; capped at about 150 by THETA). The diagonal is unchanged; only the mid-turn surge is gone. To leave room to turn away from a wall at top speed, the solvability test's entry/exit window moved from x ∈ [20, 160] to [30, 150].
12. **Turn rate (after playtest feedback).** At the faster base speed, 360°/s turns felt sluggish (a flip took 0.33 s and drifted about 8 px the old way before reversing). `movement.turnRate` is now 720°/s: a flip takes 1/6 s and drifts about 4 px. All chunks remain solvable.
