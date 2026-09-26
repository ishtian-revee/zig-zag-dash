// Every tunable value in the game lives here (PLAN.md: values marked "tunable").

const DEG = Math.PI / 180;

export const CONFIG = {
  // --- Display (§1) ---
  view: {
    width: 180,
    height: 320,
    /** Small screens (fractional fit below this) always use a fractional, pixelated scale. */
    smallScreenScale: 2,
    /** On touch screens, use a fractional scale when the integer scale would fill less than this share of the fractional one. */
    minIntegerFill: 0.85,
    /** Blurred side-fill refresh rate (Hz). */
    blurFillHz: 8,
    blurPx: 14,
  },

  // --- Loop (§1) ---
  loop: {
    stepHz: 60,
    /** Largest frame gap simulated at once (s). */
    maxFrameGap: 0.25,
  },

  // --- Movement (§3.1) ---
  movement: {
    baseSpeed: 70, // px/s along the heading
    maxHeading: 60 * DEG, // target heading is ±this
    turnRate: 360 * DEG, // rad/s
    startHeadingSign: 1 as 1 | -1, // +1 = right
    cameraAnchor: 0.62, // player sits this far down the screen
    speedGrowthPerSector: 0.06,
    speedCapSector: 7, // index of the 8th sector (THETA)
    /** Seconds to ease between sector speeds. */
    speedEase: 1.0,
  },

  // --- Collision (§3.2) ---
  collision: {
    playerSpriteRadius: 5.5,
    playerHitboxScale: 0.75,
    obstacleHitboxScale: 0.9,
    laserThickness: 1.25, // half-width of a beam (px)
    emitterRadius: 3.5,
    rocketRadius: 2.5,
    pickupExtra: 2,
  },

  // --- Playfield (§4.1) ---
  field: {
    wallInset: 2, // wall line x from each edge
  },

  // --- Death (§3.3) ---
  death: {
    gameOverDelay: 0.6,
    shakeTime: 0.3,
    shakeAmp: 2.5,
    shatterCount: 26,
    flashTime: 0.15,
  },

  // --- Sectors (§4.3) ---
  sectors: {
    secondsPerSector: 20,
    /** Vertical share of speed while holding ±maxHeading (cos 60° = 0.5). Used to turn seconds into distance. */
    verticalFactor: Math.cos(60 * DEG),
    /** Distance from the start position to the ALPHA line. */
    firstLineDistance: 110,
    names: ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'EPSILON', 'ZETA', 'ETA', 'THETA', 'IOTA', 'KAPPA', 'LAMBDA', 'MU'],
    hueShiftPerSector: 12, // degrees per sector…
    hueShiftMax: 48, // …bouncing back and forth within this range so it stays subtle
    confettiCount: 60,
    /** Wall accent colour per sector (cycles). */
    accents: ['#3dff5a', '#ff2fb3', '#3ff0ff', '#8e3cff', '#ffae1a', '#3aa0ff'],
  },

  // --- Generation (§4.2) ---
  gen: {
    safeStartChunks: 2,
    /** Chance that a chunk slot is filled with a rare chunk (landmarks, power-up nests). */
    rareChance: 0.12,
    positionJitter: 3,
    sizeJitter: 0.08,
    lookAhead: 480, // keep chunks generated this far above the camera top
    despawnBelow: 60, // remove entities this far below the camera bottom
  },

  // --- Hazards (§4.4) ---
  rockets: {
    warningTime: 0.7,
    speed: 95,
  },

  // --- Power-ups (§4.5) ---
  powerups: {
    magnetTime: 6,
    magnetRadius: 60,
    magnetPull: 220, // px/s
    shieldInvuln: 1,
  },

  // --- Scoring (§4.5) ---
  scoring: {
    gemValues: { 1: 1, 2: 2, 3: 3 } as Record<1 | 2 | 3, number>,
  },

  // --- Screens (§7) ---
  ui: {
    fadeTime: 0.2,
    goTime: 0.7,
    toastTime: 1.6,
    shareUrl: 'https://example.com/zig-zag-dash', // placeholder until deployment
  },

  // --- Juice (§8) ---
  fx: {
    reduceParticleFactor: 0.4, // Reduce effects keeps ~40% of particles
    trailRate: 40, // particles per second
    pickupBurst: 12,
  },

  // --- Palette (§8) ---
  palette: {
    bgTop: '#140f2e',
    bgBottom: '#221a4a',
    magenta: '#ff2fb3',
    violet: '#8e3cff',
    blue: '#3aa0ff',
    green: '#3dff5a',
    gold: '#ffae1a',
    cyan: '#3ff0ff',
    white: '#f4f4ff',
    grey: '#5a5a70',
    coral: '#ff4d6d',
    uiBlue: '#2f8cff',
    readyRed: '#ff2d4a',
    pink: '#ff6fd0',
    dark: '#0b0820',
    orange: '#ff8a1f',
  },

  // --- Audio (§9) ---
  audio: {
    masterVolume: 0.8,
    musicVolume: 0.35,
    sfxVolume: 0.6,
    duckedMusic: 0.35, // share of music volume while paused / on Game Over
  },

  save: {
    key: 'zzd.save.v1',
  },
} as const;

export type Palette = typeof CONFIG.palette;
