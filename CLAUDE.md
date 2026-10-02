# nikbeat — Browser-based synthwave music production studio

> Parent context: `../CLAUDE.md` has universal preferences and conventions. Keep it updated with anything universal you learn here.

## What this is
A full-featured browser music studio: 16-step drum sequencer, melody synth (note picker per step), playable keyboard, sample pads, FX chain (reverb/delay/filter/distortion), preset save/load, beat generator with keyword search, custom sample upload. Undo/redo, tempo/swing/volume, real-time visualizer.

## Stack
- Vite + React 19 + TypeScript + Tailwind v4 (via `@tailwindcss/vite` plugin, NOT PostCSS)
- `base: '/nikbeat/'` in vite.config.ts
- Deployed to sakhalteam.github.io/nikbeat/

## Notable patterns
- Web Audio API with drift-compensated scheduling for precise sequencer timing
- Heavy state management (drums, melody, FX, presets) via refs + state
- Custom sample buffer management
- Modal dialogs for arrangements and presets
- localStorage-based pattern import/export


## How to end your messages — the "For Nic" block (org-wide rule)

Nic has severe ADHD and loses mid-run asides ("by the way...", "one thing to check
before you...") and anything buried in closing prose. **This is not a request to be
less detailed** — keep the full explanation, reasoning and tradeoffs. Just always end
the turn with a landing pad, as the LAST thing in the message:

```
---
**For Nic:**
1. <verb-first action> — <why, one short clause>
2. ❓ <decision only Nic can make> — <option A vs option B>
3. ⏸️ <parked / needs its own session>
```

- Every "by the way" you had this turn lands here, or assume he never read it.
- Numbered not bulleted; verb first; max 5, most important first.
- No recap of what you already did — that's the body's job. This is Nic's list.
- **Don't force it.** Only what Nic actually needs to notice or act on. It's a TL;DR + call to action, not a test of how many todos you can come up with — one real item (or "Nothing — all clear") beats five padded ones.
- Nothing for him? Still write it: `**For Nic:** Nothing — all clear.`

Full spec lives in the universal `~/.claude/CLAUDE.md` (and `Code/CLAUDE.md`).
