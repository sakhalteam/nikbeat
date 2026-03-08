// ─── TYPES ───────────────────────────────────────────────────────────────────

export type DrumTrackId = 'kick' | 'snare' | 'hihat' | 'openhat' | 'clap' | 'perc' | 'bass';
export type DrumPattern = Record<DrumTrackId, number[]>;
export type Note = { name: string; freq: number };
export type MelodyPattern = (Note | null)[];
export type FxKey = 'reverb' | 'delay' | 'filter' | 'distort';
export type FxEnabled = Record<FxKey, boolean>;
export type FxValues = Record<FxKey, number>;
export type KbVoiceId = '8bit' | 'organ' | 'fmbell' | 'pad' | 'lead';
export type ScaleId = 'minor' | 'major' | 'penta' | 'blues' | 'dorian';

export interface Sample {
  icon: string;
  label: string;
  fn: number;
  customLabel?: string;
}

export interface PresetState {
  drumPattern: DrumPattern;
  melodyPattern: MelodyPattern;
  bpm: number;
  key: string;
  scale: ScaleId;
  oct: string;
  fxEnabled: FxEnabled;
  fxValues: FxValues;
  padLayout: number[][];
}

// ─── DRUM TRACKS ─────────────────────────────────────────────────────────────

export const DRUM_TRACKS: { id: DrumTrackId; label: string }[] = [
  { id: 'kick',    label: 'KICK' },
  { id: 'snare',   label: 'SNR'  },
  { id: 'hihat',   label: 'HH'   },
  { id: 'openhat', label: 'OH'   },
  { id: 'clap',    label: 'CLP'  },
  { id: 'perc',    label: 'PERC' },
  { id: 'bass',    label: 'BASS' },
];

export const STEPS = 16;

// ─── SAMPLE LIBRARY (2 pages × 18) ──────────────────────────────────────────

export const ALL_SAMPLES: Sample[] = [
  // Page 1
  { icon: '🎚', label: 'VINYL',   fn: 0  }, { icon: '🚀', label: 'RISER',   fn: 1  }, { icon: '⚡', label: 'LASER',   fn: 2  },
  { icon: '🐱', label: 'MEOW',    fn: 3  }, { icon: '🔔', label: 'CRASH',   fn: 4  }, { icon: '💥', label: 'SUB',     fn: 5  },
  { icon: '🌀', label: 'GLITCH',  fn: 6  }, { icon: '🎼', label: 'ARP',     fn: 7  }, { icon: '🥁', label: 'SHAKER',  fn: 8  },
  { icon: '🌊', label: 'SWELL',   fn: 9  }, { icon: '🌩', label: 'THUNDER', fn: 10 }, { icon: '🪐', label: 'SPACE',   fn: 11 },
  { icon: '🔮', label: 'CRYSTAL', fn: 12 }, { icon: '🎛', label: 'NOISE',   fn: 13 }, { icon: '📡', label: 'SIGNAL',  fn: 14 },
  { icon: '🌀', label: 'SWEEP',   fn: 15 }, { icon: '💣', label: 'IMPACT',  fn: 16 }, { icon: '🎆', label: 'BLOOM',   fn: 17 },
  // Page 2
  { icon: '🐶', label: 'RUFF',    fn: 18 }, { icon: '🎸', label: 'PLUCK',   fn: 19 }, { icon: '🪘', label: 'BONGO',   fn: 20 },
  { icon: '👶', label: 'BABY',    fn: 21 }, { icon: '🔑', label: 'BELL',    fn: 22 }, { icon: '🥁', label: 'RIMSHOT', fn: 23 },
  { icon: '🎵', label: 'CHORD',   fn: 24 }, { icon: '🌟', label: 'ZAPPER',  fn: 25 }, { icon: '👾', label: 'BIT',     fn: 26 },
  { icon: '🎺', label: 'BRASS',   fn: 27 }, { icon: '🎻', label: 'STRING',  fn: 28 }, { icon: '🎹', label: 'STAB',    fn: 29 },
  { icon: '🥁', label: 'COWBELL', fn: 30 }, { icon: '🎙', label: 'VOCAL',   fn: 31 }, { icon: '🎷', label: 'SAX',     fn: 32 },
  { icon: '🛸', label: 'UFO',     fn: 33 }, { icon: '🌈', label: 'CHORD2',  fn: 34 }, { icon: '🎤', label: 'CHANT',   fn: 35 },
];

export const DEFAULT_PAD_LAYOUT: number[][] = [
  [0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17],
  [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
];

export const PAD_COLORS = [
  'pc1','pc2','pc3','pc4','pc5','pc6',
  'pc7','pc8','pc9','pc10','pc11','pc12',
  'pc1','pc2','pc3','pc4','pc5','pc6',
];

// ─── SCALES ──────────────────────────────────────────────────────────────────

export const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

export const SCALE_INTERVALS: Record<ScaleId, number[]> = {
  minor:  [0,2,3,5,7,8,10,12],
  major:  [0,2,4,5,7,9,11,12],
  penta:  [0,2,4,7,9,12],
  blues:  [0,3,5,6,7,10,12],
  dorian: [0,2,3,5,7,9,10,12],
};

// ─── KEYBOARD ────────────────────────────────────────────────────────────────

export const KB_WHITES = [
  { note: 'C4', freq: 261.6, key: 'a' },
  { note: 'D4', freq: 293.7, key: 's' },
  { note: 'E4', freq: 329.6, key: 'd' },
  { note: 'F4', freq: 349.2, key: 'f' },
  { note: 'G4', freq: 392.0, key: 'g' },
  { note: 'A4', freq: 440.0, key: 'h' },
  { note: 'B4', freq: 493.9, key: 'j' },
  { note: 'C5', freq: 523.3, key: ';' },
];

export const KB_BLACKS: ({ note: string; freq: number; key: string } | null)[] = [
  { note: 'C#4', freq: 277.2, key: 'w' },
  { note: 'D#4', freq: 311.1, key: 'e' },
  null,
  { note: 'F#4', freq: 370.0, key: 't' },
  { note: 'G#4', freq: 415.3, key: 'y' },
  { note: 'A#4', freq: 466.2, key: 'u' },
  null,
];

export const KEY_MAP: Record<string, { freq: number; id: string }> = {};
KB_WHITES.forEach(k => { KEY_MAP[k.key] = { freq: k.freq, id: 'w_' + k.key }; });
KB_BLACKS.forEach(k => { if (k) KEY_MAP[k.key] = { freq: k.freq, id: 'b_' + k.key }; });

export const KB_VOICES: { id: KbVoiceId; label: string }[] = [
  { id: '8bit',  label: '8-BIT'     },
  { id: 'organ', label: '70S ORGAN' },
  { id: 'fmbell',label: 'FM BELL'   },
  { id: 'pad',   label: 'SYNTH PAD' },
  { id: 'lead',  label: 'LEAD'      },
];

// ─── BUILT-IN PRESETS ────────────────────────────────────────────────────────

type BuiltinPreset = Record<DrumTrackId, number[]>;

export const PRESETS: Record<string, BuiltinPreset> = {
  outrun: {
    kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
    snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    hihat:   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
    openhat: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
    clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    perc:    [0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0],
    bass:    [1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
  },
  darksynth: {
    kick:    [1,0,0,0,1,0,1,0,1,0,0,0,1,0,0,1],
    snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    hihat:   [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
    openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
    clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    perc:    [1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0],
    bass:    [1,0,1,0,0,0,0,0,1,0,0,0,0,1,0,0],
  },
  vaporwave: {
    kick:    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    hihat:   [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
    openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    clap:    [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
    perc:    [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
    bass:    [1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
  },
  miami: {
    kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
    snare:   [0,0,0,0,1,0,0,1,0,0,0,0,1,0,1,0],
    hihat:   [1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
    openhat: [0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0],
    clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    perc:    [0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0],
    bass:    [1,0,1,0,0,0,1,0,1,0,0,0,0,1,0,0],
  },
  minimal: {
    kick:    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    snare:   [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    hihat:   [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
    openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    clap:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    perc:    [0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0],
    bass:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  },
};

// ─── BEAT POOL (for AI GEN bar) ─────────────────────────────────────────────

export interface BeatPreset {
  name: string;
  tags: string[];
  bpm: number;
  drums: Record<DrumTrackId, number[]>;
}

export const BEAT_POOL: BeatPreset[] = [
  {
    name: 'Midnight Drive',
    tags: ['outrun','drive','night','midnight','cruising','highway','retro','80s','synthwave'],
    bpm: 110,
    drums: {
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      openhat: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      perc:    [0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0],
      bass:    [1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
    },
  },
  {
    name: 'Neon Funk',
    tags: ['funk','funky','groove','dance','neon','party','disco','bounce'],
    bpm: 118,
    drums: {
      kick:    [1,0,0,1,0,0,1,0,0,0,1,0,0,0,1,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],
      hihat:   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      perc:    [0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0],
      bass:    [1,0,0,1,0,0,1,0,0,0,1,0,0,0,0,1],
    },
  },
  {
    name: 'Dark Ritual',
    tags: ['dark','darksynth','horror','evil','heavy','industrial','goth','intense','aggressive'],
    bpm: 130,
    drums: {
      kick:    [1,0,0,0,1,0,1,0,1,0,0,0,1,0,0,1],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
      clap:    [0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0],
      perc:    [1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0],
      bass:    [1,0,1,0,0,0,0,0,1,0,0,0,0,1,0,0],
    },
  },
  {
    name: 'Vapor Lounge',
    tags: ['vaporwave','vapor','chill','lounge','slow','dreamy','aesthetic','lo-fi','lofi','lazy','relaxed'],
    bpm: 78,
    drums: {
      kick:    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
      perc:    [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
      bass:    [1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
    },
  },
  {
    name: 'Miami Vice',
    tags: ['miami','vice','beach','tropical','sun','summer','hot','latin','salsa'],
    bpm: 122,
    drums: {
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,1,0,0,0,0,1,0,1,0],
      hihat:   [1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
      openhat: [0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      perc:    [0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0],
      bass:    [1,0,1,0,0,0,1,0,1,0,0,0,0,1,0,0],
    },
  },
  {
    name: 'Ghost Protocol',
    tags: ['minimal','ghost','minimal','quiet','sparse','clean','simple','subtle','soft','ambient'],
    bpm: 90,
    drums: {
      kick:    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      snare:   [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      hihat:   [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      clap:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      perc:    [0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0],
      bass:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    },
  },
  {
    name: 'Cyber Chase',
    tags: ['fast','chase','cyber','action','run','running','energy','hyper','speed','rush'],
    bpm: 140,
    drums: {
      kick:    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      clap:    [0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,1],
      perc:    [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      bass:    [1,0,0,1,0,0,0,1,0,0,1,0,0,1,0,0],
    },
  },
  {
    name: 'Sunset Cruise',
    tags: ['sunset','cruise','smooth','mellow','calm','warm','golden','evening','easy'],
    bpm: 95,
    drums: {
      kick:    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      clap:    [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
      perc:    [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
      bass:    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    },
  },
  {
    name: 'Arcade Boss',
    tags: ['arcade','game','8bit','chiptune','retro','pixel','boss','gaming','nintendo','sega'],
    bpm: 135,
    drums: {
      kick:    [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,1,0],
      hihat:   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      openhat: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      perc:    [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,1],
      bass:    [1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0],
    },
  },
  {
    name: 'Blade Runner',
    tags: ['blade','runner','dystopia','rain','noir','moody','cinematic','film','movie','cyberpunk'],
    bpm: 85,
    drums: {
      kick:    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
      hihat:   [0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      clap:    [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
      perc:    [0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
      bass:    [1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
    },
  },
  {
    name: 'Techno Grid',
    tags: ['techno','electronic','club','rave','warehouse','underground','detroit','berlin','house'],
    bpm: 128,
    drums: {
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      hihat:   [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      perc:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      bass:    [1,0,0,1,0,0,1,0,0,0,1,0,0,0,0,0],
    },
  },
  {
    name: 'Reggaeton Neon',
    tags: ['reggaeton','latin','dembow','perreo','urban','trap','hip-hop','hiphop','rap','boom','bap'],
    bpm: 96,
    drums: {
      kick:    [1,0,0,1,0,0,1,0,0,0,1,0,1,0,0,0],
      snare:   [0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],
      hihat:   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      openhat: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
      clap:    [0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],
      perc:    [0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0],
      bass:    [1,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0],
    },
  },
  {
    name: 'Space Drift',
    tags: ['space','cosmic','galaxy','stars','alien','ufo','float','drift','atmospheric','ambient','ethereal'],
    bpm: 72,
    drums: {
      kick:    [1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      hihat:   [0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0],
      openhat: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
      clap:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      perc:    [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
      bass:    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    },
  },
  {
    name: 'Breakbeat Fury',
    tags: ['breakbeat','break','breaks','dnb','drum','jungle','fast','crazy','wild','chaos'],
    bpm: 138,
    drums: {
      kick:    [1,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0],
      hihat:   [1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1],
      openhat: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      perc:    [0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0],
      bass:    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0],
    },
  },
  {
    name: 'Synth Pop',
    tags: ['pop','synthpop','catchy','upbeat','happy','bright','cheerful','fun','80s','new wave','newwave'],
    bpm: 116,
    drums: {
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      perc:    [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
      bass:    [1,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0],
    },
  },
  {
    name: 'Witch House',
    tags: ['witch','occult','dark','creepy','scary','spooky','halloween','haunted','slow','doom'],
    bpm: 75,
    drums: {
      kick:    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
      snare:   [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      hihat:   [0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      clap:    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      perc:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
      bass:    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    },
  },
  {
    name: 'Future Bass',
    tags: ['future','bass','edm','wobble','wub','drop','festival','loud','epic','massive'],
    bpm: 132,
    drums: {
      kick:    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,0],
      openhat: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      perc:    [0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
      bass:    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    },
  },
  {
    name: 'Lo-Fi Tape',
    tags: ['lofi','lo-fi','tape','study','homework','chill','coffee','rain','cozy','bedroom','jazz'],
    bpm: 82,
    drums: {
      kick:    [1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      clap:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      perc:    [0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0],
      bass:    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
    },
  },
];

export const VIZ_COLORS = [
  '#ff2d78','#ff2d78','#ff2d78','#ff2d78',
  '#ff8844','#ff8844','#ff8844','#ff8844',
  '#ffe600','#ffe600','#ffe600','#ffe600',
  '#00f5ff','#00f5ff','#00f5ff','#00f5ff',
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function makeEmptyDrumPattern(): DrumPattern {
  const p = {} as DrumPattern;
  DRUM_TRACKS.forEach(t => { p[t.id] = new Array(STEPS).fill(0); });
  return p;
}

export function getNotes(key: string, scale: ScaleId, oct: string): Note[] {
  const root = NOTE_NAMES.indexOf(key);
  const octNum = parseInt(oct);
  return SCALE_INTERVALS[scale].map(semitones => {
    const noteIdx = (root + semitones) % 12;
    const octaveOffset = Math.floor((root + semitones) / 12);
    const freq = 440 * Math.pow(2, (noteIdx + (octNum + octaveOffset) * 12 - 69) / 12);
    return { name: NOTE_NAMES[noteIdx] + (octNum + octaveOffset), freq };
  });
}
