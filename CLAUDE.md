# nikbeat — Browser-based synthwave music production studio

> Parent context: `../CLAUDE.md` has universal preferences and conventions. Keep it updated with anything universal you learn here.

## What this is
A full-featured browser music studio: 16-step drum sequencer, melody synth (note picker per step), playable keyboard, sample pads, FX chain (reverb/delay/filter/distortion), preset save/load, beat generator with keyword search, custom sample upload. Undo/redo, tempo/swing/volume, real-time visualizer.

## Stack
- Vite + React 18 + TypeScript + Tailwind v3
- `base: '/nikbeat/'` in vite.config.ts
- Deployed to sakhalteam.github.io/nikbeat/

## Notable patterns
- Web Audio API with drift-compensated scheduling for precise sequencer timing
- Heavy state management (drums, melody, FX, presets) via refs + state
- Custom sample buffer management
- Modal dialogs for arrangements and presets
- localStorage-based pattern import/export
