import type { FxEnabled, FxValues, KbVoiceId } from './data';

// ─── SINGLETON STATE ─────────────────────────────────────────────────────────

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let reverbNode: ConvolverNode | null = null;
let delayNode: DelayNode | null = null;
let filterNode: BiquadFilterNode | null = null;
let distortNode: WaveShaperNode | null = null;

const sustainedNotes: Record<string, () => void> = {};

export function getCtx(): AudioContext | null { return ctx; }

export function setMasterVolume(vol: number): void {
  if (masterGain) masterGain.gain.value = vol;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

export function initAudio(): void {
  if (ctx) return;
  ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

  masterGain = ctx.createGain();
  masterGain.gain.value = 0.9;
  masterGain.connect(ctx.destination);

  // Reverb impulse
  const rvLen = ctx.sampleRate * 2.5;
  const rvBuf = ctx.createBuffer(2, rvLen, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = rvBuf.getChannelData(c);
    for (let i = 0; i < rvLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rvLen, 3);
  }
  reverbNode = ctx.createConvolver();
  reverbNode.buffer = rvBuf;

  // Delay with feedback
  delayNode = ctx.createDelay(1.0);
  delayNode.delayTime.value = 0.375;
  const fb = ctx.createGain();
  fb.gain.value = 0.4;
  delayNode.connect(fb);
  fb.connect(delayNode);

  // Filter
  filterNode = ctx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.frequency.value = 1200;
  filterNode.Q.value = 4;

  // Distortion
  distortNode = ctx.createWaveShaper();
  distortNode.curve = makeDistCurve(50);
  distortNode.oversample = '2x';
}

// ─── FX CHAIN ────────────────────────────────────────────────────────────────

function makeDistCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 256;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    c[i] = (Math.PI + amount) * x / (Math.PI + amount * Math.abs(x));
  }
  return c;
}

let currentFx: FxEnabled = { reverb: false, delay: false, filter: false, distort: false };

function getOut(): AudioNode {
  if (!ctx || !masterGain) throw new Error('Audio not initialized');
  const chain: AudioNode[] = [];
  if (currentFx.filter && filterNode) chain.push(filterNode);
  if (currentFx.distort && distortNode) chain.push(distortNode);
  if (currentFx.reverb && reverbNode) chain.push(reverbNode);
  if (currentFx.delay && delayNode) chain.push(delayNode);

  [filterNode, distortNode, reverbNode, delayNode].forEach(n => {
    if (n) try { n.disconnect(); } catch (_) { /* already disconnected */ }
  });

  if (!chain.length) return masterGain;
  for (let i = 0; i < chain.length - 1; i++) chain[i].connect(chain[i + 1]);
  chain[chain.length - 1].connect(masterGain);
  return chain[0];
}

export function applyFX(enabled: FxEnabled, values: FxValues, bpm: number): void {
  if (!ctx || !filterNode || !distortNode || !delayNode) return;
  currentFx = enabled;
  filterNode.frequency.value = 200 + (values.filter / 100) * 8000;
  distortNode.curve = makeDistCurve(1 + values.distort * 1.5);
  if (enabled.delay) delayNode.delayTime.value = (60 / bpm) * 0.75;
}

// ─── NOISE HELPER ────────────────────────────────────────────────────────────

function noise(dur: number): AudioBuffer {
  if (!ctx) throw new Error('Audio not initialized');
  const l = Math.max(4, Math.floor(ctx.sampleRate * dur));
  const b = ctx.createBuffer(1, l, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < l; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

// ─── DRUM SOUNDS ─────────────────────────────────────────────────────────────

export function playDrum(type: string): void {
  if (!ctx) return;
  const out = getOut();
  const n = ctx.currentTime;

  const osc = (t: OscillatorType, f: number) => {
    const o = ctx!.createOscillator(); const g = ctx!.createGain();
    o.type = t; o.frequency.value = f; o.connect(g); g.connect(out); return { o, g };
  };
  const ns = (d: number, hp = 0) => {
    const s = ctx!.createBufferSource(); const f = ctx!.createBiquadFilter(); const g = ctx!.createGain();
    s.buffer = noise(d);
    if (hp) { f.type = 'highpass'; f.frequency.value = hp; s.connect(f); f.connect(g); } else s.connect(g);
    g.connect(out); return { s, g };
  };

  switch (type) {
    case 'kick': {
      const { o, g } = osc('sine', 80);
      o.frequency.exponentialRampToValueAtTime(0.01, n + 0.45);
      g.gain.setValueAtTime(1.2, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.45);
      o.start(n); o.stop(n + 0.45); break;
    }
    case 'snare': {
      const { o, g } = osc('sine', 180);
      g.gain.setValueAtTime(0.4, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.15);
      o.start(n); o.stop(n + 0.15);
      const { s, g: ng } = ns(0.18);
      ng.gain.setValueAtTime(0.4, n); ng.gain.exponentialRampToValueAtTime(0.01, n + 0.18); s.start(n); break;
    }
    case 'hihat': {
      const { s, g } = ns(0.06, 9000);
      g.gain.setValueAtTime(0.18, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.06); s.start(n); break;
    }
    case 'openhat': {
      const { s, g } = ns(0.35, 8000);
      g.gain.setValueAtTime(0.14, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.35); s.start(n); break;
    }
    case 'clap': {
      for (let i = 0; i < 3; i++) {
        const t = n + i * 0.01; const { s, g } = ns(0.07);
        g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.07); s.start(t);
      } break;
    }
    case 'perc': {
      const { o, g } = osc('triangle', 400);
      o.frequency.exponentialRampToValueAtTime(100, n + 0.1);
      g.gain.setValueAtTime(0.5, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.1);
      o.start(n); o.stop(n + 0.12); break;
    }
    case 'bass': {
      const o = ctx.createOscillator(); const f = ctx.createBiquadFilter(); const g = ctx.createGain();
      o.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.value = 400; f.Q.value = 2;
      o.connect(f); f.connect(g); g.connect(out);
      o.frequency.setValueAtTime(55, n); o.frequency.exponentialRampToValueAtTime(40, n + 0.2);
      g.gain.setValueAtTime(0.6, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.25);
      o.start(n); o.stop(n + 0.25); break;
    }
  }
}

// ─── 36 PAD SOUNDS ───────────────────────────────────────────────────────────

export function playSample(fnIdx: number, customBuffer?: AudioBuffer): void {
  if (!ctx) return;
  if (customBuffer) {
    const out = getOut(); const src = ctx.createBufferSource(); const g = ctx.createGain();
    src.buffer = customBuffer; g.gain.value = 0.8; src.connect(g); g.connect(out); src.start(); return;
  }
  const out = getOut(); const n = ctx.currentTime;

  const osc = (type: OscillatorType, freq: number) => {
    const o = ctx!.createOscillator(); const g = ctx!.createGain();
    o.type = type; o.frequency.value = freq; o.connect(g); g.connect(out); return { o, g };
  };
  const ns = (dur: number, hp = 0) => {
    const s = ctx!.createBufferSource(); const f = ctx!.createBiquadFilter(); const g = ctx!.createGain();
    s.buffer = noise(dur);
    if (hp) { f.type = 'highpass'; f.frequency.value = hp; s.connect(f); f.connect(g); } else s.connect(g);
    g.connect(out); return { s, g };
  };

  const fns: (() => void)[] = [
    // 0 VINYL
    () => {
      const scratch = (t: number, up: boolean) => {
        const o = ctx!.createOscillator(); const f = ctx!.createBiquadFilter(); const g = ctx!.createGain();
        o.type = 'sawtooth'; f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 6;
        o.connect(f); f.connect(g); g.connect(out);
        o.frequency.setValueAtTime(up ? 240 : 680, t); o.frequency.linearRampToValueAtTime(up ? 680 : 200, t + 0.07);
        g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        o.start(t); o.stop(t + 0.09);
        const { s, g: ng } = ns(0.07, 400); ng.gain.setValueAtTime(0.14, t); ng.gain.exponentialRampToValueAtTime(0.01, t + 0.07); s.start(t);
      };
      scratch(n, false); scratch(n + 0.1, true); scratch(n + 0.24, false); scratch(n + 0.34, true);
    },
    // 1 RISER
    () => { const { o, g } = osc('sawtooth', 120); o.frequency.exponentialRampToValueAtTime(900, n + 0.45); g.gain.setValueAtTime(0.12, n); g.gain.linearRampToValueAtTime(0.22, n + 0.35); g.gain.exponentialRampToValueAtTime(0.01, n + 0.5); o.start(n); o.stop(n + 0.5); },
    // 2 LASER
    () => { const { o, g } = osc('square', 1400); o.frequency.exponentialRampToValueAtTime(100, n + 0.15); g.gain.setValueAtTime(0.35, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.15); o.start(n); o.stop(n + 0.16); },
    // 3 MEOW
    () => {
      const carrier = ctx!.createOscillator(); carrier.type = 'sawtooth';
      carrier.frequency.setValueAtTime(260, n); carrier.frequency.linearRampToValueAtTime(520, n + 0.1); carrier.frequency.linearRampToValueAtTime(340, n + 0.28);
      const f1 = ctx!.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.setValueAtTime(900, n); f1.frequency.linearRampToValueAtTime(2200, n + 0.1); f1.frequency.linearRampToValueAtTime(1600, n + 0.28); f1.Q.value = 8;
      const f2 = ctx!.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 3400; f2.Q.value = 12;
      const { s: ns1, g: ng1 } = ns(0.32, 800); ng1.gain.setValueAtTime(0.06, n); ng1.gain.setValueAtTime(0.08, n + 0.08); ng1.gain.exponentialRampToValueAtTime(0.01, n + 0.32); ns1.start(n);
      const g = ctx!.createGain(); carrier.connect(f1); f1.connect(f2); f2.connect(g); g.connect(out);
      const gBody = ctx!.createGain(); gBody.gain.value = 0.4; f1.connect(gBody); gBody.connect(out);
      g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(0.55, n + 0.04); g.gain.setValueAtTime(0.5, n + 0.2); g.gain.exponentialRampToValueAtTime(0.001, n + 0.38);
      carrier.start(n); carrier.stop(n + 0.4);
    },
    // 4 CRASH
    () => { const { s, g } = ns(0.9, 6000); g.gain.setValueAtTime(0.45, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.9); s.start(n); },
    // 5 SUB
    () => {
      const { o, g } = osc('sine', 55); const o2 = ctx!.createOscillator(); const g2 = ctx!.createGain();
      o2.type = 'sine'; o2.frequency.value = 110; o2.connect(g2); g2.connect(out);
      g2.gain.setValueAtTime(0.3, n); g2.gain.exponentialRampToValueAtTime(0.01, n + 0.4);
      o.frequency.exponentialRampToValueAtTime(22, n + 0.55); g.gain.setValueAtTime(1.6, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.55);
      o.start(n); o.stop(n + 0.55); o2.start(n); o2.stop(n + 0.4);
    },
    // 6 GLITCH
    () => { for (let i = 0; i < 8; i++) { const t = n + i * 0.025; const { o, g } = osc(i % 2 ? 'square' : 'sawtooth', 200 + Math.random() * 600); g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.018); o.start(t); o.stop(t + 0.02); } },
    // 7 ARP
    () => { [440, 550, 660, 880].forEach((fr, i) => { const t = n + i * 0.06; const { o, g } = osc('square', fr); g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1); o.start(t); o.stop(t + 0.1); }); },
    // 8 SHAKER
    () => { for (let i = 0; i < 3; i++) { const t = n + i * 0.04; const { s, g } = ns(0.05, 7000); g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.05); s.start(t); } },
    // 9 SWELL
    () => { const { o, g } = osc('sine', 120); o.frequency.linearRampToValueAtTime(60, n + 1.2); g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(0.4, n + 0.6); g.gain.exponentialRampToValueAtTime(0.01, n + 1.3); o.start(n); o.stop(n + 1.3); },
    // 10 THUNDER
    () => { const s = ctx!.createBufferSource(); const f = ctx!.createBiquadFilter(); const g = ctx!.createGain(); s.buffer = noise(0.8); f.type = 'lowpass'; f.frequency.value = 300; s.connect(f); f.connect(g); g.connect(out); g.gain.setValueAtTime(0.7, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.8); s.start(n); },
    // 11 SPACE
    () => { for (let i = 0; i < 5; i++) { const t = n + i * 0.09; const { o, g } = osc('sine', 80 + i * 30); g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.start(t); o.stop(t + 0.3); } },
    // 12 CRYSTAL
    () => { const { o, g } = osc('sine', 880); o.frequency.linearRampToValueAtTime(1760, n + 0.05); o.frequency.linearRampToValueAtTime(880, n + 0.1); g.gain.setValueAtTime(0.3, n); g.gain.exponentialRampToValueAtTime(0.001, n + 0.5); o.start(n); o.stop(n + 0.5); },
    // 13 NOISE
    () => { const { s, g } = ns(0.3); g.gain.setValueAtTime(0.3, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.3); s.start(n); },
    // 14 SIGNAL
    () => { const { o, g } = osc('sine', 440); for (let i = 0; i < 6; i++) o.frequency.linearRampToValueAtTime(200 + Math.random() * 800, n + i * 0.05); g.gain.setValueAtTime(0.2, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.35); o.start(n); o.stop(n + 0.35); },
    // 15 SWEEP
    () => {
      const { o, g: _g } = osc('sawtooth', 40); o.frequency.exponentialRampToValueAtTime(4000, n + 0.4);
      const f = ctx!.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(200, n); f.frequency.exponentialRampToValueAtTime(4000, n + 0.4); f.Q.value = 8;
      o.disconnect(); const gg = ctx!.createGain(); o.connect(f); f.connect(gg); gg.connect(out);
      gg.gain.setValueAtTime(0.55, n); gg.gain.exponentialRampToValueAtTime(0.01, n + 0.42); o.start(n); o.stop(n + 0.42);
    },
    // 16 IMPACT
    () => {
      const { o, g } = osc('sine', 80); o.frequency.exponentialRampToValueAtTime(25, n + 0.4); g.gain.setValueAtTime(1.4, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.5); o.start(n); o.stop(n + 0.5);
      const { s, g: ng } = ns(0.25, 200); ng.gain.setValueAtTime(0.6, n); ng.gain.exponentialRampToValueAtTime(0.01, n + 0.25); s.start(n);
      const { s: s2, g: ng2 } = ns(0.05, 5000); ng2.gain.setValueAtTime(0.5, n); ng2.gain.exponentialRampToValueAtTime(0.01, n + 0.05); s2.start(n);
    },
    // 17 BLOOM
    () => { const { o, g } = osc('sine', 200); o.frequency.linearRampToValueAtTime(80, n + 0.3); const { s, g: ng } = ns(0.3, 3000); ng.gain.setValueAtTime(0.2, n); ng.gain.exponentialRampToValueAtTime(0.01, n + 0.3); g.gain.setValueAtTime(0.55, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.4); o.start(n); o.stop(n + 0.4); s.start(n); },
    // 18 RUFF
    () => {
      const { o, g } = osc('square', 180); o.frequency.exponentialRampToValueAtTime(80, n + 0.08); g.gain.setValueAtTime(0.6, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.1); o.start(n); o.stop(n + 0.1);
      const { s, g: ng } = ns(0.1, 300); ng.gain.setValueAtTime(0.35, n); ng.gain.exponentialRampToValueAtTime(0.01, n + 0.1); s.start(n);
      const { o: o2, g: g2 } = osc('square', 160); o2.frequency.exponentialRampToValueAtTime(70, n + 0.21); g2.gain.setValueAtTime(0.4, n + 0.14); g2.gain.exponentialRampToValueAtTime(0.01, n + 0.22); o2.start(n + 0.14); o2.stop(n + 0.23);
    },
    // 19 PLUCK (Karplus-Strong)
    () => {
      const freq = 220 + Math.random() * 200; const bufLen = Math.floor(ctx!.sampleRate / freq);
      const buf = ctx!.createBuffer(1, bufLen, ctx!.sampleRate); const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx!.createBufferSource(); src.buffer = buf; src.loop = true;
      const dly = ctx!.createDelay(); dly.delayTime.value = 1 / freq;
      const fbk = ctx!.createGain(); fbk.gain.value = 0.97;
      const g = ctx!.createGain(); g.gain.setValueAtTime(0.65, n); g.gain.exponentialRampToValueAtTime(0.001, n + 1.2);
      src.connect(dly); dly.connect(fbk); fbk.connect(dly); dly.connect(g); g.connect(out); src.start(n); src.stop(n + 1.2);
    },
    // 20 BONGO
    () => {
      const hit = (t: number, freq: number, vol: number) => {
        const { o, g } = osc('sine', freq); const o2 = ctx!.createOscillator(); const g2 = ctx!.createGain();
        o2.type = 'triangle'; o2.frequency.value = freq * 1.5; o2.connect(g2); g2.connect(out);
        o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.15); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        g2.gain.setValueAtTime(vol * 0.4, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        o.start(t); o.stop(t + 0.26); o2.start(t); o2.stop(t + 0.13);
        const { s, g: ng } = ns(0.04, 1000); ng.gain.setValueAtTime(vol * 0.3, t); ng.gain.exponentialRampToValueAtTime(0.01, t + 0.04); s.start(t);
      };
      hit(n, 260, 0.85); hit(n + 0.16, 340, 0.75);
    },
    // 21 BABY
    () => {
      const carr = ctx!.createOscillator(); carr.type = 'sawtooth'; carr.frequency.setValueAtTime(420, n);
      carr.frequency.linearRampToValueAtTime(380, n + 0.05); carr.frequency.linearRampToValueAtTime(430, n + 0.18);
      const f1 = ctx!.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.setValueAtTime(400, n); f1.frequency.linearRampToValueAtTime(1000, n + 0.08); f1.frequency.linearRampToValueAtTime(600, n + 0.22); f1.Q.value = 6;
      const f2 = ctx!.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 2600; f2.Q.value = 10;
      const g = ctx!.createGain(); g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(0.7, n + 0.03); g.gain.setValueAtTime(0.65, n + 0.16); g.gain.exponentialRampToValueAtTime(0.001, n + 0.35);
      const { s: ns1, g: ng1 } = ns(0.35, 1000); ng1.gain.setValueAtTime(0.04, n); ng1.gain.exponentialRampToValueAtTime(0.001, n + 0.35); ns1.start(n);
      carr.connect(f1); f1.connect(f2); f2.connect(g); g.connect(out); carr.start(n); carr.stop(n + 0.36);
    },
    // 22 BELL
    () => { [523, 659, 784, 1047].forEach(fr => { const { o, g } = osc('sine', fr); g.gain.setValueAtTime(0.15, n); g.gain.exponentialRampToValueAtTime(0.001, n + 0.8); o.start(n); o.stop(n + 0.8); }); },
    // 23 RIMSHOT
    () => {
      const { o, g } = osc('sine', 400); o.frequency.exponentialRampToValueAtTime(200, n + 0.025); g.gain.setValueAtTime(0.9, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.04); o.start(n); o.stop(n + 0.04);
      const { s, g: ng } = ns(0.04, 2000); ng.gain.setValueAtTime(0.75, n); ng.gain.exponentialRampToValueAtTime(0.01, n + 0.04); s.start(n);
      const { o: o2, g: g2 } = osc('sine', 220); o2.frequency.exponentialRampToValueAtTime(80, n + 0.05); g2.gain.setValueAtTime(0.5, n); g2.gain.exponentialRampToValueAtTime(0.01, n + 0.06); o2.start(n); o2.stop(n + 0.06);
    },
    // 24 CHORD
    () => {
      const roots = [261.6, 293.7, 329.6, 349.2, 392, 440, 493.9];
      const root = roots[Math.floor(Math.random() * roots.length)];
      const types = [[0,4,7],[0,3,7],[0,4,7,11],[0,3,7,10],[0,5,7]];
      const t = types[Math.floor(Math.random() * types.length)];
      const inv = Math.floor(Math.random() * 3);
      t.forEach((semi, i) => {
        const freq = root * Math.pow(2, semi / 12) * (i < inv ? 2 : 1);
        const { o, g } = osc('sawtooth', freq); const f = ctx!.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800; f.Q.value = 1.5;
        o.disconnect(); o.connect(f); f.connect(g);
        g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(0.18, n + 0.02); g.gain.setValueAtTime(0.15, n + 0.2); g.gain.exponentialRampToValueAtTime(0.001, n + 0.6); o.start(n); o.stop(n + 0.62);
      });
    },
    // 25 ZAPPER
    () => { for (let i = 0; i < 4; i++) { const t = n + i * 0.07; const { o, g } = osc('square', 110 * Math.pow(2, i * 0.5)); g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1); o.start(t); o.stop(t + 0.1); } },
    // 26 BIT
    () => { for (let i = 0; i < 12; i++) { const t = n + i * 0.02; const { o, g } = osc('square', Math.round(Math.random() * 3) * 100 + 100); g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.015); o.start(t); o.stop(t + 0.015); } },
    // 27 BRASS
    () => { [220, 277, 330].forEach((fr, i) => { const t = n + i * 0.02; const { o, g } = osc('sawtooth', fr); const f = ctx!.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2000; o.disconnect(); o.connect(f); f.connect(g); g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4); o.start(t); o.stop(t + 0.42); }); },
    // 28 STRING
    () => { [196, 247, 294].forEach(fr => { const { o, g } = osc('sawtooth', fr); g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(0.15, n + 0.05); g.gain.exponentialRampToValueAtTime(0.001, n + 0.5); o.start(n); o.stop(n + 0.5); }); },
    // 29 STAB
    () => { [261.6, 329.6, 392].forEach(fr => { const { o, g } = osc('square', fr); g.gain.setValueAtTime(0.2, n); g.gain.exponentialRampToValueAtTime(0.001, n + 0.15); o.start(n); o.stop(n + 0.16); }); },
    // 30 COWBELL
    () => {
      [562, 845].forEach(fr => { const { o, g } = osc('square', fr); const f = ctx!.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fr; f.Q.value = 3; o.disconnect(); o.connect(f); f.connect(g); g.gain.setValueAtTime(0.4, n); g.gain.exponentialRampToValueAtTime(0.001, n + 0.6); o.start(n); o.stop(n + 0.62); });
      const { s, g: ng } = ns(0.05, 2000); ng.gain.setValueAtTime(0.1, n); ng.gain.exponentialRampToValueAtTime(0.01, n + 0.05); s.start(n);
    },
    // 31 VOCAL
    () => {
      const carr = ctx!.createOscillator(); carr.type = 'sawtooth'; carr.frequency.setValueAtTime(180, n);
      const f1 = ctx!.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.setValueAtTime(800, n); f1.frequency.linearRampToValueAtTime(1200, n + 0.1); f1.Q.value = 5;
      const f2 = ctx!.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 2400; f2.Q.value = 8;
      const g = ctx!.createGain(); g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(0.5, n + 0.03); g.gain.setValueAtTime(0.45, n + 0.12); g.gain.exponentialRampToValueAtTime(0.001, n + 0.3);
      carr.connect(f1); f1.connect(f2); f2.connect(g); g.connect(out); carr.start(n); carr.stop(n + 0.31);
    },
    // 32 SAX
    () => {
      const { o, g } = osc('sawtooth', 293); const f = ctx!.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 4;
      o.disconnect(); o.connect(f); f.connect(g);
      g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(0.35, n + 0.04); g.gain.setValueAtTime(0.3, n + 0.3); g.gain.exponentialRampToValueAtTime(0.001, n + 0.55); o.start(n); o.stop(n + 0.56);
      const { s, g: ng } = ns(0.55, 2000); ng.gain.setValueAtTime(0.05, n); ng.gain.exponentialRampToValueAtTime(0.001, n + 0.55); s.start(n);
    },
    // 33 UFO
    () => { const { o, g } = osc('sine', 300); o.frequency.linearRampToValueAtTime(600, n + 0.5); o.frequency.linearRampToValueAtTime(200, n + 1.0); g.gain.setValueAtTime(0.3, n); g.gain.exponentialRampToValueAtTime(0.001, n + 1.1); o.start(n); o.stop(n + 1.1); },
    // 34 CHORD2
    () => {
      const roots = [220, 246.9, 261.6, 277.2, 293.7, 311.1, 329.6];
      const root = roots[Math.floor(Math.random() * roots.length)];
      const chords = [[0,4,7,11],[0,3,7,10],[0,4,7,9],[0,3,6,10],[0,2,7]];
      const chord = chords[Math.floor(Math.random() * chords.length)];
      chord.forEach(semi => {
        const { o, g } = osc('triangle', root * Math.pow(2, semi / 12));
        g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(0.15, n + 0.05); g.gain.setValueAtTime(0.12, n + 0.4); g.gain.exponentialRampToValueAtTime(0.001, n + 0.8); o.start(n); o.stop(n + 0.81);
      });
    },
    // 35 CHANT
    () => {
      const carr = ctx!.createOscillator(); carr.type = 'sawtooth'; carr.frequency.value = 220;
      const vib = ctx!.createOscillator(); const vm = ctx!.createGain(); vib.type = 'sine'; vib.frequency.value = 5; vm.gain.value = 4; vib.connect(vm); vm.connect(carr.frequency);
      const f1 = ctx!.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 700; f1.Q.value = 6;
      const g = ctx!.createGain(); g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(0.4, n + 0.1); g.gain.setValueAtTime(0.35, n + 0.4); g.gain.exponentialRampToValueAtTime(0.001, n + 0.7);
      carr.connect(f1); f1.connect(g); g.connect(out); carr.start(n); vib.start(n); carr.stop(n + 0.71); vib.stop(n + 0.71);
    },
  ];

  if (fns[fnIdx]) fns[fnIdx]();
}

// ─── MELODY NOTE ─────────────────────────────────────────────────────────────

export function playNote(freq: number, bpm: number): void {
  if (!ctx) return;
  const out = getOut(); const n = ctx.currentTime;
  const dur = 60 / bpm;
  const o1 = ctx.createOscillator(); const o2 = ctx.createOscillator();
  const g = ctx.createGain(); const g2 = ctx.createGain(); const f = ctx.createBiquadFilter();
  o1.type = 'sawtooth'; o1.frequency.value = freq;
  o2.type = 'square';   o2.frequency.value = freq * 1.002;
  g2.gain.value = 0.4; f.type = 'lowpass';
  f.frequency.setValueAtTime(3000, n); f.frequency.exponentialRampToValueAtTime(600, n + dur * 0.8); f.Q.value = 3;
  o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(f); f.connect(out);
  g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(0.25, n + 0.01);
  g.gain.setValueAtTime(0.25, n + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.001, n + dur * 1.1);
  o1.start(n); o2.start(n); o1.stop(n + dur * 1.1); o2.stop(n + dur * 1.1);
}

// ─── KEYBOARD VOICES ─────────────────────────────────────────────────────────

export function startKbNote(freq: number, keyId: string, voice: KbVoiceId): void {
  if (!ctx || sustainedNotes[keyId]) return;
  const out = getOut(); const n = ctx.currentTime;
  let stopFn: () => void;

  switch (voice) {
    case '8bit': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'square'; o.frequency.value = freq; o.connect(g); g.connect(out);
      g.gain.setValueAtTime(0.3, n); o.start(n);
      stopFn = () => { const t = ctx!.currentTime; g.gain.setValueAtTime(g.gain.value, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05); o.stop(t + 0.06); };
      break;
    }
    case 'organ': {
      const nodes: { o: OscillatorNode; g: GainNode }[] = [];
      [1, 2, 3, 4, 6].forEach((h, i) => {
        const o = ctx!.createOscillator(); const g = ctx!.createGain();
        o.type = 'sine'; o.frequency.value = freq * h; o.connect(g); g.connect(out);
        g.gain.setValueAtTime([0.3, 0.2, 0.15, 0.1, 0.06][i], n); o.start(n); nodes.push({ o, g });
      });
      stopFn = () => { const t = ctx!.currentTime; nodes.forEach(({ o, g }) => { g.gain.setValueAtTime(g.gain.value, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.08); o.stop(t + 0.09); }); };
      break;
    }
    case 'fmbell': {
      const car = ctx.createOscillator(); const mod = ctx.createOscillator();
      const modG = ctx.createGain(); const g = ctx.createGain();
      car.type = 'sine'; car.frequency.value = freq;
      mod.type = 'sine'; mod.frequency.value = freq * 3.5;
      modG.gain.setValueAtTime(freq * 3, n); mod.connect(modG); modG.connect(car.frequency);
      car.connect(g); g.connect(out); g.gain.setValueAtTime(0.4, n); mod.start(n); car.start(n);
      stopFn = () => { const t = ctx!.currentTime; g.gain.setValueAtTime(g.gain.value, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4); mod.stop(t + 0.41); car.stop(t + 0.41); };
      break;
    }
    case 'pad': {
      const nodes: { o: OscillatorNode; g: GainNode }[] = [];
      [1, 1.003, 0.998, 2].forEach((d, i) => {
        const o = ctx!.createOscillator(); const g = ctx!.createGain(); const f = ctx!.createBiquadFilter();
        o.type = i < 3 ? 'sawtooth' : 'sine'; o.frequency.value = freq * d;
        f.type = 'lowpass'; f.frequency.value = 1800; f.Q.value = 2;
        o.connect(f); f.connect(g); g.connect(out); g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(0.1, n + 0.08); o.start(n); nodes.push({ o, g });
      });
      stopFn = () => { const t = ctx!.currentTime; nodes.forEach(({ o, g }) => { g.gain.setValueAtTime(g.gain.value, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.stop(t + 0.31); }); };
      break;
    }
    case 'lead': {
      const o1 = ctx.createOscillator(); const o2 = ctx.createOscillator(); const o3 = ctx.createOscillator();
      o1.type = 'sawtooth'; o1.frequency.value = freq;
      o2.type = 'sawtooth'; o2.frequency.value = freq * 1.007;
      o3.type = 'square';   o3.frequency.value = freq * 0.5;
      const vib = ctx.createOscillator(); const vibG = ctx.createGain();
      vib.type = 'sine'; vib.frequency.value = 5.5;
      vibG.gain.setValueAtTime(0, n); vibG.gain.linearRampToValueAtTime(freq * 0.012, n + 0.15);
      vib.connect(vibG); vibG.connect(o1.frequency); vibG.connect(o2.frequency);
      const filt = ctx.createBiquadFilter(); filt.type = 'lowpass';
      filt.frequency.setValueAtTime(300, n); filt.frequency.linearRampToValueAtTime(4800, n + 0.04); filt.Q.value = 6;
      const g1 = ctx.createGain(); const g2 = ctx.createGain(); const g3 = ctx.createGain(); const master = ctx.createGain();
      g1.gain.value = 0.4; g2.gain.value = 0.4; g3.gain.value = 0.18;
      o1.connect(g1); o2.connect(g2); o3.connect(g3);
      g1.connect(filt); g2.connect(filt); g3.connect(filt); filt.connect(master); master.connect(out);
      master.gain.setValueAtTime(0, n); master.gain.linearRampToValueAtTime(0.55, n + 0.02);
      o1.start(n); o2.start(n); o3.start(n); vib.start(n);
      stopFn = () => {
        const t = ctx!.currentTime;
        master.gain.setValueAtTime(master.gain.value, t); master.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        filt.frequency.setValueAtTime(filt.frequency.value, t); filt.frequency.exponentialRampToValueAtTime(200, t + 0.08);
        o1.stop(t + 0.09); o2.stop(t + 0.09); o3.stop(t + 0.09); vib.stop(t + 0.09);
      };
      break;
    }
    default: return;
  }
  sustainedNotes[keyId] = stopFn;
}

export function stopKbNote(keyId: string): void {
  if (sustainedNotes[keyId]) { sustainedNotes[keyId](); delete sustainedNotes[keyId]; }
}
