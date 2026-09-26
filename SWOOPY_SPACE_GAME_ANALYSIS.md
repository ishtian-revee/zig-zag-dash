# Swoopy Space — Game Breakdown

> Source: "Swoopy Space - Gameplay (iOS)" by TapGameplay — https://www.youtube.com/watch?v=xAHjwyBvaWE
> Length: 4:43, 1280×720 landscape recording of a portrait (9:16) iPhone game, centered with blurred side bars.
> Method: I went through the whole video frame by frame (50 keyframes plus about 60 full-resolution close-ups of the game area). Timestamps (`m:ss`) point to the moments in the video. There is no narration in the video, and I didn't listen to the audio (see §10).

---

## 1. What the game is

Swoopy Space is an endless, one-tap arcade game with a pixel-art look. You steer a small round character (the default one is **"Comet"**, a white moon-ball with a pink tongue) upward through a crowded field of glowing planets, moons, asteroids, lasers and rockets. The character always moves forward and curves ("swoops") left or right. **Each tap flips which way it curves**, so the whole game is about timing those flips to weave through the gaps.

The goals:
- **Survive** as long as you can. Touching any wall or object ends the run.
- **Collect diamonds** for points (score).
- **Collect coins** to unlock new playable characters.

Genre: hyper-casual / one-tap endless runner (like Flappy Bird or ZigZag), with a scrolling map and character skins you unlock.

---

## 2. Game flow / screens

```
Title / Main Menu ──(Play)──► [Tutorial, first time] ──► READY screen ──(tap)──► GO ──► Gameplay
        ▲                                                                              │
        │                                                                        (collision)
        └──────────(Back)──────── GAME OVER screen ◄──────────── death explosion ◄─────┘
                                     │  (Play) ──► READY … (instant retry)
```

A run from death to retry takes only a few seconds. The video shows about 9 runs back to back.

### 2.1 Main Menu (0:00–0:20)
Top to bottom:
- **Coin counter**, top-left: a small gold coin icon plus the total (0 at the start of the video).
- **Logo**: "SWOOPY SPACE" in big chunky pixel letters, dark grey fill with a white outline and an orange/gold drop shadow. It sits on a deep purple space background with a glowing **blue planet** on the left and a **magenta planet** on the right.
- **Small white moons drift across the logo** and **burst into pixel debris** when they hit the letters (visible at 0:06 and 0:16). It's a bit of ambient menu animation.
- **Character selector strip**: a slightly lighter horizontal band with the character's **name** in white pixel caps and a **row of round character icons you swipe through**. The selected character sits in the middle. Locked ones show a **price in coins** underneath (e.g. `● 1000`).
- **Play button**: a big red/coral rounded-square button with a white ▶ triangle.
- **Bottom row of 5 square outlined icon buttons** (left to right):
  1. ⚙ Settings (gear)
  2. 🔊 Sound on/off (speaker)
  3. "NO ADS" (remove-ads purchase)
  4. ★ Rate the game (star)
  5. 📶 Leaderboard (bar chart, Game Center style)
- The background has scattered small **grey asteroid dots**, twinkling **tiny coloured star sparkles** (✦ in pink, green, yellow, blue) and faint dark horizontal "cloud" bands.

### 2.2 Tutorial (0:21–0:28; first launch only)
A black screen titled **"TUTORIAL"** (cyan pixel letters) with three bordered panels that animate in one by one, followed by a Play button:

| Panel | Header text (orange pixel font) | Illustration |
|---|---|---|
| 1 | **TAP TO CHANGE DIRECTION** | The character moving across a small starfield while a finger taps at the bottom |
| 2 | **COLLECT DIAMONDS FOR POINTS** / **COINS TO UNLOCK CHARACTERS** (split by a diagonal line) | Cyan diamond **×1**, green diamond **×2**, pink/magenta diamond **×3**, a green ✔ check mark, and a cluster of 5 gold coins |
| 3 | **AVOID WALLS AND OBJECTS** | A magenta planet, a red ✖ and a green laser beam with a dark mechanical emitter |

### 2.3 READY screen (before every run; 0:29, 1:31, 2:03, 3:10 …)
- **"READY"** in large red pixel letters near the top.
- The play area has **thin glowing red vertical borders** on the left and right: these are the **walls**.
- The character sits in the middle with a small **orange arrow** showing the direction it's facing.
- A **dotted zig-zag guide line** comes out of the character, with **"TAP" labels** at each corner. It shows how every tap bends the path the other way.
- A large cartoon **finger** at the bottom prompts you to tap.
- On the first tap, **"GO"** appears in big cyan pixel letters and the run starts (0:32).

### 2.4 Game Over screen (1:17, 1:43, 2:31, 3:51, 4:20, 4:43 …)
- **"GAME OVER"** in large red pixel letters.
- **Orange/gold panel** with two columns: **SCORE** (this run) and **BEST** (high score), numbers in white pixel font.
- **Coin total box** (dark, rounded) showing your total coins, e.g. `● 85`.
- Next to it, two blue buttons: **Share** (box with an up arrow) and **Like** (thumbs-up; probably a social or "like us" link).
- In some runs the coin box turns into a purple **"EARN 50 ●"** button (4:20). This is a rewarded-ad offer: watch an ad for +50 coins.
- The **character selector strip** again (you can change character straight from here).
- Bottom action row: **← Back** (to the menu), **▶ Play** (retry, red), **🎁 Gift** (blue present button, a free coin gift; sometimes it has a small label/timer above it, 3:51).
- The same 5-icon row as the menu (Settings, Sound, No Ads, Rate, Leaderboard).
- When you die, the gameplay view **fades to dark** and the Game Over screen appears over a dimmed backdrop. There's a short **fade to black** between screens.

---

## 3. Controls

- **One input only: tap anywhere on the screen.**
- Each tap **reverses the direction the character curves** (left curve ↔ right curve).
- You can't stop, slow down or aim directly. You only choose *when* to flip.
- The zig-zag dotted line on the READY screen shows that each tap produces a new diagonal leg of movement.

---

## 4. Core mechanics

### 4.1 Movement
- The character **always moves forward/up** at a steady speed, and the camera scrolls with it.
- Its path is a **smooth diagonal arc**, not a hard angle. The trail curves after each tap, which is where the name "swoopy" comes from.
- A **particle trail** of small white pixels follows it and fades out behind.
- The camera keeps the character roughly in the vertical middle of the screen.

### 4.2 The playfield
- A vertical strip of space with **glowing coloured side walls** (red on the READY screen; walls glowing green or purple show up during play). Touching a wall kills you.
- Obstacles are **placed by hand or procedurally in patterns**. They are **not** random noise: coins come in arcs and lines, planets are set up to leave narrow paths.

### 4.3 Hazards ("walls and objects")
Everything solid kills you on contact:

| Hazard | Look | Behaviour |
|---|---|---|
| **Side walls** | Thin neon vertical lines at the screen edges | Fixed boundaries |
| **Planets** | Big glowing spheres in **magenta/pink, purple/violet, blue/cyan, green**, pixel-art craters, fuzzy outline, soft coloured glow | Main static obstacles. Various sizes. |
| **Ringed planets** | Magenta (sometimes green) planet with a **white tilted ring** (Saturn-style) | Obstacle; coins often arc around it |
| **Small white moons** | White/light grey pixel spheres | Obstacles (the character shatters on one at 4:42) |
| **Giant smiling moon** | Huge white pixel moon with a **cartoon face** (black square eyes, open pink/purple mouth) | Rare, large obstacle/landmark (0:50, 1:16, 2:30, 4:40) |
| **Grey asteroids** | Small dark-grey pixel rocks scattered everywhere | Small obstacles/filler |
| **Laser walls** | **Bright green laser beams** in zig-zag / diamond "<>" shapes, connected at glowing green nodes | Static barriers you have to thread through. They often form a chevron gate with coins in the middle (1:17, 2:30, 3:40, 4:38) |
| **Laser emitters / satellites** | Dark grey mechanical blocks with red lights | Sit on the laser lines; count as "objects" (tutorial panel 3) |
| **Rockets** | Small **white/red pixel rockets** with a red flame exhaust | **Moving** hazards that fly diagonally across the field (0:56, 2:18, 3:28, 3:34, 4:04, 4:20) |

### 4.4 Collectibles

| Item | Look | Effect |
|---|---|---|
| **Cyan/light-blue diamond** | Small faceted cyan gem | **+1 point** |
| **Green diamond** | Green gem | **+2 points** |
| **Pink/magenta diamond** | Magenta gem | **+3 points** |
| **Gold coins** | Small spinning gold coins (they look thin and edge-on mid-spin, then full orange ovals) | +1 coin each; currency for unlocking characters. They come in **arcs, lines and curves**, often wrapped around planets or sitting between laser gates. |
| **Magnet (power-up)** | Red and blue **horseshoe magnet** icon | Seen floating in the field (3:40, 4:16). Almost certainly a coin/diamond **magnet power-up**; the video doesn't clearly show it being collected. |

**Pickup feedback:** grabbing a diamond sets off a **burst of pixel particles in the diamond's colour** (cyan, green or pink squares) plus a small **floating number** ("1", "2") that fades out (1:47, 2:24, 3:34, 4:26, 4:41).

### 4.5 Sectors / distance milestones
- As you fly up you cross **horizontal dotted lines** that span the screen, each with a sector name in white pixel caps in the middle:
  **ALPHA → BETA → GAMMA → DELTA** (the Greek alphabet, so presumably Epsilon and so on after that).
- These work like **distance checkpoints / zone markers**. When you cross one, a stream of **coloured confetti pixels** (magenta, purple, blue) flies along the line (0:40, 1:25, 2:06, 2:47).
- In the best runs of the video: ALPHA at about 10–15 coins collected, BETA at about 20–27, GAMMA at about 30–33, DELTA at about 50 (4:32, the deepest point reached).
- When you reach a new sector, its name also shows **in the top-centre of the HUD** (e.g. "GAMMA" at 2:03, "DELTA" at 4:32).

### 4.6 Death
- On contact, the character **explodes into a burst of white square pixels** (0:50, 1:17, 1:31, 4:42), and nearby planets briefly flash white.
- The screen dims, then the Game Over panel appears.

---

## 5. Point / economy system

| Resource | How you earn it | What it's for | Where it shows |
|---|---|---|---|
| **Score** | Diamonds: cyan = 1, green = 2, pink = 3 | Ranking, BEST record, leaderboard | Game Over panel (SCORE/BEST). The in-run HUD top-right shows the **diamond count** |
| **Best** | Highest score so far | Personal record | Game Over panel |
| **Coins** | Coins picked up during runs, the **Gift** button, **EARN 50** (rewarded ad) | Buying characters (500 or 1000 coins) | Top-left of the HUD during runs; total on the menu and Game Over |

The in-run coin count **adds to your saved total** after each run. In the video the total goes 0 → 6 → 23 → 85 → 113 → 144 → 224 → 263 → 274 → 350 across the runs.

Scores recorded in the video: 1, 6, 8 (new best), 1, 5, 11 (new best), 15 (new best), 4, 16 (new best, final). Each new record updates BEST straight away.

**HUD during play:**
- Top-left: gold coin icon plus this run's coin count.
- Top-right: this run's diamond count plus a cyan diamond icon.
- Top-centre: current sector name (once you've reached one).
- A thin darker bar sits behind the HUD at the very top.

---

## 6. Characters (unlockable skins)

Characters are **round ball-sprites** (about the same size in-game). Each one is shown as a small circular icon, and many icons are split diagonally into two colours. You pick one in the swipeable strip on the Menu or Game Over screen.

| Name | Price | Notes from the icon |
|---|---|---|
| **Comet** | Free (default) | White moon-ball with a pink tongue/face; used in every run in the video |
| **Doughnut** | **500** coins | Orange/cream icon |
| **Gold Robot** | 1000 | Orange/gold icon |
| **Ghost** | 1000 | White/grey striped icon |
| **Unicorn** | 1000 | White/pink icon with a small golden horn tip |
| **Easter Egg** | 1000 | Pastel/lilac-striped icon |
| **Zombie** | 1000 | Green icon |
| **Silver Robot** | 1000 | Grey/silver icon (last in the list) |

Other icons in the strip that weren't named on screen: green/lime, cyan/teal, orange-red, purple, dark brown/chocolate, beige/tan and multi-striped. There are **about 15–20 characters** in total. Icons seem to change when you can afford them (a small spark shows above the one you're focused on).

---

## 7. Visual style

- **Art direction:** 2D **pixel art**, neon-on-dark "synthwave space".
- **Background:** deep navy/indigo (#1a1a3a-ish) that gets more purple towards the top of the menu, with:
  - tiny twinkling 4-point star sparkles in several colours,
  - faint darker horizontal "nebula/cloud" bands that scroll with parallax,
  - **big blurred coloured glows** behind the planets.
- **Palette:** saturated magenta (#ff2fb3-ish), violet (#8e3cff), sky blue (#3aa0ff), lime green (#3dff5a), gold/orange coins (#ffae1a), cyan diamonds (#3ff0ff), white moons, mid-grey asteroids.
- **Planets:** a flat base colour, darker pixel craters, a slightly fuzzy/jagged edge and a strong outer glow.
- **Typography:** blocky pixel fonts throughout. Red for READY / GAME OVER, cyan for GO / TUTORIAL, orange for tutorial headers, white for names and numbers.
- **UI:** rounded-square buttons with thick outlines. Primary action is red/coral, secondary actions are blue, utility icons are outlined grey on dark.
- **Juice / feedback effects:**
  - character trail particles,
  - diamond pickup bursts in the gem's colour, with a floating number,
  - confetti streams when you cross a sector line,
  - white pixel shatter on death,
  - moons breaking against the logo on the menu,
  - coins spinning (the sprite squashes as it turns),
  - fades and flashes between screens.
- **Layout:** portrait only. The game area is a narrow vertical strip.

---

## 8. Level design observations

- Coins are laid out as **guide rails**: arcs that curve around planets and lines that follow a good swoop path. They teach you the "right" route.
- **Laser gates** (green chevrons/diamonds) set the rhythm with forced timing, often with coins in the middle as a reward for going through.
- Density goes up with distance: early runs have open space, later sectors have tighter clusters, more lasers and rockets.
- Big planets and small moons are mixed so there are both **wide lanes and narrow squeezes**.
- Rockets are the only thing that moves, so you have to react instead of just memorising.

---

## 9. Monetisation / meta features seen

- **"NO ADS"** button (in-app purchase to remove ads).
- **Rewarded ad**: "EARN 50" coins on the Game Over screen.
- **Gift** button (a free periodic coin gift, sometimes with a countdown).
- **Rate** (★), **Share**, **Like** (👍) and **Leaderboard** buttons.
- **Character shop** priced in coins (500–1000), which encourages grinding for coins and watching ads.

---

## 10. Sound

The video has an audio track that **plays continuously** (I checked: no silent gaps longer than a second anywhere in the 4:43), so there's always background music/ambience. I didn't transcribe or listen to it, so I can't describe specific sound effects or the music style from this video.

If you're making a similar game, the usual audio for this genre and these visuals is a looping chiptune/synth track, plus short retro "blip" sounds for tapping, coin chimes, a gem sparkle for diamonds, a whoosh for sector lines and an 8-bit explosion on death. Treat that as a design suggestion, not something I observed. There's a Sound toggle on the menu (§2.1).

---

## 11. Timeline of the video

| Time | What happens |
|---|---|
| 0:00–0:20 | Main menu; swipes through characters (Comet, Doughnut 500, Gold Robot, Ghost, Unicorn, Easter Egg, Zombie, Silver Robot); moons break against the logo |
| 0:21–0:28 | Tutorial panels animate in |
| 0:29–0:32 | READY → GO |
| 0:32–0:50 | Run 1: coins/diamonds, first ALPHA line at 0:40; dies near the giant smiling moon (score 1) |
| 0:50–1:17 | Runs 2–3: BETA reached (0:56) with a rocket passing; dies at a laser gate. Game Over: score 8, best 8, coins 85 |
| 1:20–1:43 | Run 4: ALPHA and BETA; Game Over score 1, best 8, coins 113 |
| 1:47–2:31 | Runs 5–6: GAMMA reached (2:03–2:06); laser walls and rockets. Score 5, then 11 |
| 2:35–3:51 | Run 7: GAMMA again with more rockets; the magnet shows up (3:40). **Score 15 (new best), 274 coins** |
| 3:51–4:20 | Run 8: short; Game Over shows the **"EARN 50"** reward. Score 4 |
| 4:20–4:43 | Run 9: reaches **DELTA** (4:32), 50+ coins and 16 diamonds; shatters on a white moon near the giant smiling moon. Final Game Over: **score 16 (best), 350 coins** |

---

## 12. Key takeaways for building a clone / inspired game

1. **One mechanic:** a constantly moving ball; a tap flips the direction it curves (smooth arc, not a sharp turn).
2. **Vertical endless scroller** with neon side walls, planets, moons, asteroids, laser gates and flying rockets.
3. **Two currencies:** diamonds give points (1/2/3 by colour), coins buy skins.
4. **Named sector checkpoints** (Alpha, Beta, Gamma, Delta…) with a confetti line give you a sense of progress.
5. **Instant retry loop**: Game Over (Score/Best, coins, share, gift, rewarded ad) → READY → GO.
6. **Pixel-art neon look** with lots of particle effects on every event.
7. **Skins** priced at 500–1000 coins and picked from a swipeable strip on the menu and Game Over screens.
