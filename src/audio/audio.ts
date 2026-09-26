import { CONFIG } from '../config';

// Synthesized SFX (jsfxr-style parameter sets) and a procedural chiptune sequencer.

type Wave = 'square' | 'triangle' | 'sine' | 'sawtooth' | 'noise';

interface Tone {
  wave: Wave;
  freq: number;
  /** End frequency (exponential slide). */
  to?: number;
  dur: number;
  vol?: number;
  attack?: number;
  /** Delay before start (s). */
  at?: number;
  /** Noise filter: lowpass cutoff start/end. */
  cut?: number;
  cutTo?: number;
  band?: boolean;
  vibrato?: number;
}

export type SfxName =
  | 'tap'
  | 'coin'
  | 'gem'
  | 'magnet'
  | 'shield'
  | 'shieldPop'
  | 'whoosh'
  | 'explosion'
  | 'click'
  | 'unlock'
  | 'newBest'
  | 'warn'
  | 'go'
  | 'buy';

function sfxDef(name: SfxName, v = 1): Tone[] {
  switch (name) {
    case 'tap':
      return [{ wave: 'square', freq: 520, to: 780, dur: 0.05, vol: 0.12 }];
    case 'coin':
      return [
        { wave: 'square', freq: 988, dur: 0.05, vol: 0.12 },
        { wave: 'square', freq: 1319, dur: 0.09, vol: 0.12, at: 0.05 },
      ];
    case 'gem': {
      const base = 600 * (1 + 0.26 * (v - 1));
      return [
        { wave: 'triangle', freq: base, dur: 0.06, vol: 0.3 },
        { wave: 'triangle', freq: base * 1.26, dur: 0.06, vol: 0.3, at: 0.05 },
        { wave: 'triangle', freq: base * 1.5, dur: 0.12, vol: 0.3, at: 0.1 },
        { wave: 'square', freq: base * 3, dur: 0.08, vol: 0.05, at: 0.1 },
      ];
    }
    case 'magnet':
      return [{ wave: 'sawtooth', freq: 180, to: 900, dur: 0.35, vol: 0.12, vibrato: 18 }];
    case 'shield':
      return [{ wave: 'sine', freq: 400, to: 1300, dur: 0.28, vol: 0.3 }];
    case 'shieldPop':
      return [
        { wave: 'noise', freq: 0, dur: 0.18, vol: 0.35, cut: 6000, cutTo: 800 },
        { wave: 'sine', freq: 900, to: 260, dur: 0.22, vol: 0.3 },
      ];
    case 'whoosh':
      return [{ wave: 'noise', freq: 0, dur: 0.6, vol: 0.35, attack: 0.2, cut: 400, cutTo: 4000, band: true }];
    case 'explosion':
      return [
        { wave: 'noise', freq: 0, dur: 0.7, vol: 0.6, cut: 3000, cutTo: 120 },
        { wave: 'square', freq: 140, to: 35, dur: 0.45, vol: 0.18 },
      ];
    case 'click':
      return [{ wave: 'square', freq: 1100, to: 900, dur: 0.035, vol: 0.1 }];
    case 'unlock':
      return [523, 659, 784, 1047, 1319].map((f, i) => ({ wave: 'square' as Wave, freq: f, dur: i === 4 ? 0.3 : 0.09, vol: 0.12, at: i * 0.08 }));
    case 'newBest':
      return [784, 1047, 1319, 1568].map((f, i) => ({ wave: 'triangle' as Wave, freq: f, dur: i === 3 ? 0.35 : 0.1, vol: 0.3, at: i * 0.1 }));
    case 'warn':
      return [
        { wave: 'square', freq: 1400, dur: 0.06, vol: 0.07 },
        { wave: 'square', freq: 1400, dur: 0.06, vol: 0.07, at: 0.12 },
      ];
    case 'go':
      return [
        { wave: 'square', freq: 660, dur: 0.07, vol: 0.12 },
        { wave: 'square', freq: 990, dur: 0.14, vol: 0.12, at: 0.07 },
      ];
    case 'buy':
      return [
        { wave: 'square', freq: 880, dur: 0.05, vol: 0.12 },
        { wave: 'square', freq: 1175, dur: 0.05, vol: 0.12, at: 0.05 },
        { wave: 'square', freq: 1760, dur: 0.12, vol: 0.1, at: 0.1 },
      ];
  }
}

// ------------------------------------------------------------------ music data

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
// A minor: Am F C G (roots)
const ROOTS = [45, 41, 48, 43];
const CHORDS: number[][] = [
  [57, 60, 64],
  [53, 57, 60],
  [55, 60, 64],
  [55, 59, 62],
];

export type Track = 'menu' | 'game' | null;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxGain!: GainNode;
  private musicGain!: GainNode;
  private layer: GainNode[] = [];
  private noise!: AudioBuffer;
  private musicOn = true;
  private sfxOn = true;
  private ducked = false;
  private track: Track = null;
  private wantTrack: Track = null;
  private step = 0;
  private nextTime = 0;
  private timer: number | null = null;
  private layers = 0;

  get ready(): boolean {
    return !!this.ctx && this.ctx.state === 'running';
  }

  /** Create/resume the context. Call from a user gesture. */
  unlock(): void {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        const c = this.ctx;
        this.master = c.createGain();
        this.master.gain.value = CONFIG.audio.masterVolume;
        this.master.connect(c.destination);
        this.sfxGain = c.createGain();
        this.sfxGain.connect(this.master);
        this.musicGain = c.createGain();
        this.musicGain.connect(this.master);
        for (let i = 0; i < 4; i++) {
          const g = c.createGain();
          g.gain.value = 0;
          g.connect(this.musicGain);
          this.layer.push(g);
        }
        const len = c.sampleRate;
        this.noise = c.createBuffer(1, len, c.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.applyVolumes();
        if (this.wantTrack) this.play(this.wantTrack);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  setMusic(on: boolean): void {
    this.musicOn = on;
    this.applyVolumes();
  }
  setSfx(on: boolean): void {
    this.sfxOn = on;
    this.applyVolumes();
  }
  duck(on: boolean): void {
    this.ducked = on;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx) return;
    const a = CONFIG.audio;
    const t = this.ctx.currentTime;
    const music = this.musicOn ? a.musicVolume * (this.ducked ? a.duckedMusic : 1) : 0;
    this.musicGain.gain.setTargetAtTime(music, t, 0.08);
    this.sfxGain.gain.setTargetAtTime(this.sfxOn ? a.sfxVolume : 0, t, 0.02);
  }

  /** Suspend everything (tab hidden). */
  suspend(): void {
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend();
  }
  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  sfx(name: SfxName, v = 1): void {
    if (!this.ctx || !this.sfxOn || this.ctx.state !== 'running') return;
    const t0 = this.ctx.currentTime + 0.005;
    for (const tone of sfxDef(name, v)) this.tone(tone, t0, this.sfxGain);
  }

  private tone(o: Tone, t0: number, out: AudioNode): void {
    const c = this.ctx!;
    const start = t0 + (o.at ?? 0);
    const end = start + o.dur;
    const g = c.createGain();
    const vol = o.vol ?? 0.2;
    const atk = o.attack ?? 0.004;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(vol, start + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    g.connect(out);
    if (o.wave === 'noise') {
      const src = c.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const f = c.createBiquadFilter();
      f.type = o.band ? 'bandpass' : 'lowpass';
      f.frequency.setValueAtTime(o.cut ?? 4000, start);
      if (o.cutTo) f.frequency.exponentialRampToValueAtTime(o.cutTo, end);
      if (o.band) f.Q.value = 1.2;
      src.connect(f);
      f.connect(g);
      src.start(start, Math.random() * 0.5);
      src.stop(end + 0.02);
      return;
    }
    const osc = c.createOscillator();
    osc.type = o.wave;
    osc.frequency.setValueAtTime(o.freq, start);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, end);
    if (o.vibrato) {
      const lfo = c.createOscillator();
      const lg = c.createGain();
      lfo.frequency.value = 14;
      lg.gain.value = o.vibrato;
      lfo.connect(lg);
      lg.connect(osc.frequency);
      lfo.start(start);
      lfo.stop(end);
    }
    osc.connect(g);
    osc.start(start);
    osc.stop(end + 0.02);
  }

  // ---------------------------------------------------------------- music

  play(track: Track): void {
    this.wantTrack = track;
    if (!this.ctx) return;
    if (track === this.track) return;
    this.track = track;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.setLayers(this.layers);
    if (track) this.timer = window.setInterval(() => this.schedule(), 25);
  }

  /** Gameplay layers: 0 = base, 1 = + drums (BETA), 2 = + arpeggio/lead (GAMMA). */
  setLayers(n: number): void {
    this.layers = n;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const menu = this.track === 'menu';
    const levels = menu ? [0.9, 0, 0, 0.7] : [1, n >= 1 ? 0.9 : 0, n >= 2 ? 0.7 : 0, 0];
    levels.forEach((v, i) => this.layer[i].gain.setTargetAtTime(v, t, 0.3));
  }

  private schedule(): void {
    const c = this.ctx;
    if (!c || !this.track || c.state !== 'running') return;
    const bpm = this.track === 'menu' ? 84 : 126;
    const sixteenth = 60 / bpm / 4;
    while (this.nextTime < c.currentTime + 0.15) {
      if (this.musicOn) this.note(this.step, this.nextTime, sixteenth);
      this.nextTime += sixteenth;
      this.step = (this.step + 1) % 64;
    }
  }

  private note(step: number, t: number, len: number): void {
    const bar = Math.floor(step / 16) % 4;
    const s = step % 16;
    const root = ROOTS[bar];
    const chord = CHORDS[bar];
    const [bass, drums, lead, pad] = this.layer;
    if (this.track === 'menu') {
      if (s === 0 || s === 8) this.tone({ wave: 'triangle', freq: midi(root), dur: len * 7, vol: 0.35, attack: 0.02 }, t, bass);
      if (s % 4 === 0) {
        const n = chord[(s / 4) % 3] + 12;
        this.tone({ wave: 'square', freq: midi(n), dur: len * 3, vol: 0.05, attack: 0.03 }, t, pad);
      }
      if (s === 14 && bar % 2 === 1) this.tone({ wave: 'triangle', freq: midi(chord[2] + 24), dur: len * 2, vol: 0.08 }, t, pad);
      return;
    }
    // Game: driving bass on eighths
    if (s % 2 === 0) {
      const oct = s % 4 === 2 ? 12 : 0;
      this.tone({ wave: 'triangle', freq: midi(root + oct), dur: len * 1.6, vol: 0.4 }, t, bass);
      this.tone({ wave: 'square', freq: midi(root + oct), dur: len * 1.2, vol: 0.04 }, t, bass);
    }
    // Drums (BETA+): kick on beats, snare-ish noise on 2 & 4, hats on eighths
    if (s % 4 === 0) this.tone({ wave: 'sine', freq: 150, to: 40, dur: 0.12, vol: 0.6 }, t, drums);
    if (s === 4 || s === 12) this.tone({ wave: 'noise', freq: 0, dur: 0.12, vol: 0.25, cut: 5000, cutTo: 1200 }, t, drums);
    if (s % 2 === 1) this.tone({ wave: 'noise', freq: 0, dur: 0.03, vol: 0.1, cut: 9000, cutTo: 7000 }, t, drums);
    // Arpeggio + lead (GAMMA+)
    const arp = chord[s % 3] + 12 + (s >= 8 ? 12 : 0);
    this.tone({ wave: 'square', freq: midi(arp), dur: len * 0.8, vol: 0.045 }, t, lead);
    const melody = [0, -1, 2, -1, 1, -1, 2, -1, 0, -1, 1, -1, 2, 1, 0, -1];
    const m = melody[s];
    if (m >= 0 && step % 32 >= 16) this.tone({ wave: 'triangle', freq: midi(chord[m] + 24), dur: len * 1.6, vol: 0.12 }, t, lead);
  }
}
