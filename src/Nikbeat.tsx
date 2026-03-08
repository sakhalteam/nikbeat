import { useState, useRef, useEffect, useCallback } from 'react';
import {
  DRUM_TRACKS, STEPS, ALL_SAMPLES, DEFAULT_PAD_LAYOUT, PAD_COLORS,
  NOTE_NAMES, SCALE_INTERVALS, KB_WHITES, KB_BLACKS, KB_VOICES, KEY_MAP,
  PRESETS, VIZ_COLORS, makeEmptyDrumPattern, getNotes,
  type DrumPattern, type MelodyPattern, type Note, type FxEnabled,
  type FxValues, type FxKey, type KbVoiceId, type ScaleId, type PresetState,
  type Sample,
} from './data';
import {
  initAudio, playDrum, playSample, playNote, startKbNote, stopKbNote, applyFX,
} from './audio';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function cloneDrumPattern(p: DrumPattern): DrumPattern {
  const out = {} as DrumPattern;
  DRUM_TRACKS.forEach(t => { out[t.id] = [...p[t.id]]; });
  return out;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function Nikbeat() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [drumPattern, setDrumPattern] = useState<DrumPattern>(() => {
    const p = makeEmptyDrumPattern();
    DRUM_TRACKS.forEach(t => { p[t.id] = [...PRESETS.outrun[t.id]]; });
    return p;
  });
  const [melodyPattern, setMelodyPattern] = useState<MelodyPattern>(Array(STEPS).fill(null));
  const [bpm, setBpm] = useState(90);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingStep, setPlayingStep] = useState<number | null>(null);

  const [fxEnabled, setFxEnabled] = useState<FxEnabled>({ reverb: false, delay: false, filter: false, distort: false });
  const [fxValues, setFxValues]   = useState<FxValues>({ reverb: 40, delay: 30, filter: 60, distort: 20 });

  const [padLayout, setPadLayout]   = useState<number[][]>(DEFAULT_PAD_LAYOUT.map(p => [...p]));
  const [currentPage, setCurrentPage] = useState(0);

  const [kbVoice, setKbVoice]       = useState<KbVoiceId>('8bit');
  const [pressedKeyIds, setPressedKeyIds] = useState<string[]>([]);

  const [melKey, setMelKey]         = useState('C');
  const [melScale, setMelScale]     = useState<ScaleId>('minor');
  const [melOct, setMelOct]         = useState('4');
  const [openPickerStep, setOpenPickerStep] = useState<number | null>(null);

  const [userPresets, setUserPresets] = useState<Record<string, PresetState>>({});
  const [pendingDeletes, setPendingDeletes] = useState<Record<string, number>>({});

  const [saveModalOpen, setSaveModalOpen]     = useState(false);
  const [arrangeModalOpen, setArrangeModalOpen] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');

  const [aiInput, setAiInput]   = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [toast, setToast] = useState({ msg: '', visible: false });

  // Custom sample buffers (not React state — no re-render needed on load)
  const customBuffersRef = useRef<Record<number, AudioBuffer>>({});
  const [customSampleLabels, setCustomSampleLabels] = useState<Record<number, string>>({});
  const uploadTargetIdxRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Arrange modal drag state
  const arrangeDragSrc = useRef<{ page: number; slot: number } | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  // ── Refs for sequencer (avoid stale closures) ──────────────────────────────
  const drumPatternRef  = useRef(drumPattern);
  const melodyPatternRef = useRef(melodyPattern);
  const bpmRef          = useRef(bpm);
  const fxEnabledRef    = useRef(fxEnabled);
  const fxValuesRef     = useRef(fxValues);
  const isPlayingRef    = useRef(false);
  const currentStepRef  = useRef(0);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTimersRef = useRef<Record<string, { timer: ReturnType<typeof setTimeout>; iv: ReturnType<typeof setInterval> }>>({});

  useEffect(() => { drumPatternRef.current = drumPattern; },  [drumPattern]);
  useEffect(() => { melodyPatternRef.current = melodyPattern; }, [melodyPattern]);
  useEffect(() => { bpmRef.current = bpm; },                  [bpm]);
  useEffect(() => { fxEnabledRef.current = fxEnabled; },      [fxEnabled]);
  useEffect(() => { fxValuesRef.current = fxValues; },        [fxValues]);

  // ── Toast ──────────────────────────────────────────────────────────────────
  function showToast(msg: string) {
    setToast({ msg, visible: true });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2800);
  }

  // ── Sequencer ─────────────────────────────────────────────────────────────
  const doTick = useCallback(() => {
    const step = currentStepRef.current;
    setPlayingStep(step);
    DRUM_TRACKS.forEach(track => {
      if (drumPatternRef.current[track.id][step]) playDrum(track.id);
    });
    const note = melodyPatternRef.current[step];
    if (note) playNote(note.freq, bpmRef.current);
    currentStepRef.current = (step + 1) % STEPS;
  }, []);

  function startPlay() {
    initAudio();
    applyFX(fxEnabledRef.current, fxValuesRef.current, bpmRef.current);
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    const ms = (60000 / bpmRef.current) / 4;
    doTick();
    intervalRef.current = setInterval(doTick, ms);
  }

  function pausePlay() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    isPlayingRef.current = false;
    setIsPlaying(false);
    setPlayingStep(null);
  }

  function stopPlay() {
    pausePlay();
    currentStepRef.current = 0;
  }

  function handleBpmChange(newBpm: number) {
    setBpm(newBpm);
    bpmRef.current = newBpm;
    if (isPlayingRef.current) {
      pausePlay();
      // small delay so state clears before restarting
      setTimeout(() => {
        isPlayingRef.current = false;
        startPlay();
      }, 10);
    }
  }

  // Cleanup on unmount
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  // ── FX ────────────────────────────────────────────────────────────────────
  function toggleFx(fx: FxKey) {
    setFxEnabled(prev => {
      const next = { ...prev, [fx]: !prev[fx] };
      initAudio();
      applyFX(next, fxValuesRef.current, bpmRef.current);
      return next;
    });
  }

  function handleFxValue(fx: FxKey, val: number) {
    setFxValues(prev => {
      const next = { ...prev, [fx]: val };
      if (fxValuesRef.current) applyFX(fxEnabledRef.current, next, bpmRef.current);
      return next;
    });
  }

  // ── Drum pattern ──────────────────────────────────────────────────────────
  function toggleDrumStep(trackId: string, step: number) {
    setDrumPattern(prev => {
      const next = cloneDrumPattern(prev);
      next[trackId as keyof DrumPattern][step] ^= 1;
      return next;
    });
  }

  // ── Melody ────────────────────────────────────────────────────────────────
  function handleCellClick(step: number) {
    setOpenPickerStep(prev => prev === step ? null : step);
  }

  function selectNote(step: number, note: Note) {
    setMelodyPattern(prev => {
      const next = [...prev];
      next[step] = note;
      return next;
    });
    setOpenPickerStep(null);
    initAudio();
    playNote(note.freq, bpmRef.current);
  }

  function clearNote(step: number) {
    setMelodyPattern(prev => {
      const next = [...prev];
      next[step] = null;
      return next;
    });
    setOpenPickerStep(null);
  }

  // Close open picker when clicking elsewhere
  useEffect(() => {
    if (openPickerStep === null) return;
    const close = () => setOpenPickerStep(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openPickerStep]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  function pressKey(keyId: string, freq: number) {
    setPressedKeyIds(prev => prev.includes(keyId) ? prev : [...prev, keyId]);
    startKbNote(freq, keyId, kbVoice);
  }

  function releaseKey(keyId: string) {
    setPressedKeyIds(prev => prev.filter(k => k !== keyId));
    stopKbNote(keyId);
  }

  useEffect(() => {
    const pressedKeys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      const km = KEY_MAP[k];
      if (!km || pressedKeys.has(k)) return;
      pressedKeys.add(k);
      initAudio();
      pressKey(km.id, km.freq);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const km = KEY_MAP[k];
      if (!km) return;
      pressedKeys.delete(k);
      releaseKey(km.id);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [kbVoice]); // re-bind when voice changes so pressKey uses the latest voice

  // ── Presets ───────────────────────────────────────────────────────────────
  function captureState(): PresetState {
    return {
      drumPattern: cloneDrumPattern(drumPatternRef.current),
      melodyPattern: melodyPatternRef.current.map(n => n ? { ...n } : null),
      bpm: bpmRef.current,
      key: melKey,
      scale: melScale,
      oct: melOct,
      fxEnabled: { ...fxEnabledRef.current },
      fxValues: { ...fxValuesRef.current },
      padLayout: padLayout.map(p => [...p]),
    };
  }

  function applyState(s: PresetState) {
    setDrumPattern(cloneDrumPattern(s.drumPattern));
    setMelodyPattern(s.melodyPattern.map(n => n ? { ...n } : null));
    setBpm(s.bpm); bpmRef.current = s.bpm;
    setMelKey(s.key);
    setMelScale(s.scale);
    setMelOct(s.oct);
    setFxEnabled({ ...s.fxEnabled });
    setFxValues({ ...s.fxValues });
    setPadLayout(s.padLayout.map(p => [...p]));
    if (isPlayingRef.current) { pausePlay(); setTimeout(startPlay, 20); }
  }

  function loadBuiltinPreset(name: string) {
    const p = PRESETS[name];
    if (!p) return;
    const next = makeEmptyDrumPattern();
    DRUM_TRACKS.forEach(t => { next[t.id] = [...p[t.id]]; });
    setDrumPattern(next);
    showToast('Loaded: ' + name.toUpperCase());
  }

  function saveUserPreset() {
    const name = presetNameInput.trim();
    if (!name) { showToast('Enter a name'); return; }
    setUserPresets(prev => ({ ...prev, [name]: captureState() }));
    setSaveModalOpen(false);
    setPresetNameInput('');
    showToast('Saved: ' + name.toUpperCase());
  }

  function deletePreset(name: string) {
    let remaining = 4;
    const iv = setInterval(() => {
      remaining--;
      setPendingDeletes(pd => ({ ...pd, [name]: remaining }));
    }, 1000);
    const timer = setTimeout(() => {
      clearInterval(iv);
      delete pendingTimersRef.current[name];
      setPendingDeletes(pd => { const n = { ...pd }; delete n[name]; return n; });
      setUserPresets(up => { const n = { ...up }; delete n[name]; return n; });
      showToast('Deleted: ' + name);
    }, 4000);
    pendingTimersRef.current[name] = { timer, iv };
    setPendingDeletes(pd => ({ ...pd, [name]: remaining }));
  }

  function undoDelete(name: string) {
    const t = pendingTimersRef.current[name];
    if (t) { clearTimeout(t.timer); clearInterval(t.iv); delete pendingTimersRef.current[name]; }
    setPendingDeletes(pd => { const n = { ...pd }; delete n[name]; return n; });
    showToast('Kept: ' + name.toUpperCase());
  }

  // ── Clear pattern ─────────────────────────────────────────────────────────
  function clearPattern() {
    setDrumPattern(makeEmptyDrumPattern());
    setMelodyPattern(Array(STEPS).fill(null));
    showToast('Pattern cleared');
  }

  // ── AI generation ─────────────────────────────────────────────────────────
  async function generateBeat() {
    const input = aiInput.trim();
    if (!input) { showToast('Describe your vibe first'); return; }
    setAiLoading(true);
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: `Classify this beat vibe: "${input}" into one of: outrun, darksynth, vaporwave, miami, minimal. Pick BPM 70-140. Respond ONLY valid JSON: {"preset":"outrun","bpm":95}. No markdown.`,
          }],
        }),
      });
      const data = await resp.json();
      const text = (data.content?.[0]?.text || '').replace(/```json?|```/g, '').trim();
      const parsed = JSON.parse(text);
      if (parsed.preset && PRESETS[parsed.preset]) {
        loadBuiltinPreset(parsed.preset);
        if (parsed.bpm) handleBpmChange(parseInt(parsed.bpm));
        showToast(`AI: ${parsed.preset.toUpperCase()} @ ${parsed.bpm} BPM`);
      }
    } catch (_) {
      showToast('Generation failed — try again');
    } finally {
      setAiLoading(false);
    }
  }

  // ── Custom sample upload ──────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || uploadTargetIdxRef.current === null) return;
    initAudio();
    try {
      const ab = await file.arrayBuffer();
      // getCtx() is called indirectly via initAudio, access ctx via the module
      const { getCtx } = await import('./audio');
      const audioCtx = getCtx();
      if (!audioCtx) { showToast('Audio not ready'); return; }
      const decoded = await audioCtx.decodeAudioData(ab);
      const idx = uploadTargetIdxRef.current;
      customBuffersRef.current[idx] = decoded;
      const label = file.name.replace(/\.[^.]+$/, '').slice(0, 8).toUpperCase();
      setCustomSampleLabels(prev => ({ ...prev, [idx]: label }));
      showToast('Loaded: ' + label);
    } catch (_) {
      showToast('Could not decode audio file');
    }
    e.target.value = '';
  }

  function triggerUpload(sampleIdx: number) {
    uploadTargetIdxRef.current = sampleIdx;
    fileInputRef.current?.click();
  }

  // ── Arrange modal drag-drop ────────────────────────────────────────────────
  function swapPads(srcPage: number, srcSlot: number, dstPage: number, dstSlot: number) {
    if (srcPage === dstPage && srcSlot === dstSlot) return;
    setPadLayout(prev => {
      const next = prev.map(p => [...p]);
      [next[srcPage][srcSlot], next[dstPage][dstSlot]] = [next[dstPage][dstSlot], next[srcPage][srcSlot]];
      return next;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const notes = getNotes(melKey, melScale, melOct);

  function renderDrumGrid() {
    return (
      <>
        {/* Beat markers */}
        <div className="bm-row">
          <div />
          {Array.from({ length: STEPS }, (_, i) => (
            <div key={i} className={`bm ${i % 4 === 0 ? 'bm-b' : 'bm-s'}`} />
          ))}
        </div>
        {/* Tracks */}
        {DRUM_TRACKS.map(track => (
          <div key={track.id} className={`track t-${track.id}`}>
            <div className="tname">{track.label}</div>
            {Array.from({ length: STEPS }, (_, i) => (
              <div
                key={i}
                className={`step${drumPattern[track.id][i] ? ' active' : ''}${playingStep === i ? ' playing' : ''}`}
                onMouseDown={() => toggleDrumStep(track.id, i)}
              />
            ))}
          </div>
        ))}
      </>
    );
  }

  function renderMelodyGrid() {
    return (
      <div className="mel-row">
        <div className="mel-lbl">SYNTH</div>
        {Array.from({ length: STEPS }, (_, i) => (
          <div
            key={i}
            className={`ncell${melodyPattern[i] ? ' has-note' : ''}${playingStep === i ? ' playing' : ''}`}
            onClick={e => { e.stopPropagation(); handleCellClick(i); }}
          >
            {melodyPattern[i]?.name ?? ''}
            {openPickerStep === i && (
              <div className="npicker open" onClick={e => e.stopPropagation()}>
                {notes.map(note => (
                  <div
                    key={note.name}
                    className={`nopt${melodyPattern[i]?.name === note.name ? ' sel' : ''}`}
                    onClick={e => { e.stopPropagation(); selectNote(i, note); }}
                  >
                    {note.name}
                  </div>
                ))}
                <div className="nopt clr" onClick={e => { e.stopPropagation(); clearNote(i); }}>
                  × CLR
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  function renderKeyboard() {
    return (
      <div className="kb-wrap">
        <div className="kb-whites">
          {KB_WHITES.map(k => (
            <div
              key={k.key}
              className={`kw${pressedKeyIds.includes('w_' + k.key) ? ' pressed' : ''}`}
              data-key={k.key}
              onMouseDown={e => { e.preventDefault(); initAudio(); pressKey('w_' + k.key, k.freq); }}
              onMouseUp={() => releaseKey('w_' + k.key)}
              onMouseLeave={() => releaseKey('w_' + k.key)}
            >
              <div className="kw-lbl">{k.key.toUpperCase()}</div>
            </div>
          ))}
        </div>
        <div className="kb-blacks">
          {KB_BLACKS.map((k, idx) => (
            <div key={idx} className="kb-bp">
              {k && (
                <div
                  className={`kb${pressedKeyIds.includes('b_' + k.key) ? ' pressed' : ''}`}
                  data-key={k.key}
                  onMouseDown={e => { e.stopPropagation(); e.preventDefault(); initAudio(); pressKey('b_' + k.key, k.freq); }}
                  onMouseUp={() => releaseKey('b_' + k.key)}
                  onMouseLeave={() => releaseKey('b_' + k.key)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderFxPanel() {
    const fxDefs: { key: FxKey; label: string; sliderLabel: string }[] = [
      { key: 'reverb', label: 'REVERB', sliderLabel: 'reverbAmt' },
      { key: 'delay',  label: 'DELAY',  sliderLabel: 'delayAmt' },
      { key: 'filter', label: 'FILTER', sliderLabel: 'filterAmt' },
      { key: 'distort',label: 'DIST',   sliderLabel: 'distortAmt' },
    ];
    return (
      <div className="fx-rows">
        {fxDefs.map(({ key, label }) => (
          <div className="fx-row" key={key}>
            <div
              className={`fx-tog${fxEnabled[key] ? ' on' : ''}`}
              onClick={() => toggleFx(key)}
            />
            <span className="fx-name">{label}</span>
            <input
              type="range"
              className="fx-slider"
              min={0} max={100}
              value={fxValues[key]}
              onChange={e => handleFxValue(key, parseInt(e.target.value))}
            />
            <span className="fx-val">{fxValues[key]}%</span>
          </div>
        ))}
      </div>
    );
  }

  function renderPads() {
    return (
      <div className="pads-grid">
        {padLayout[currentPage].map((sampleIdx, slot) => {
          const s: Sample = { ...ALL_SAMPLES[sampleIdx] };
          const hasCustom = !!customBuffersRef.current[sampleIdx];
          const label = hasCustom ? (customSampleLabels[sampleIdx] ?? 'CUST') : s.label;
          return (
            <div
              key={slot}
              className={`pad ${PAD_COLORS[slot % 18]}`}
              onClick={() => {
                initAudio();
                applyFX(fxEnabledRef.current, fxValuesRef.current, bpmRef.current);
                playSample(s.fn, customBuffersRef.current[sampleIdx]);
              }}
            >
              <div className="pad-icon">{s.icon}</div>
              {label}
              {hasCustom && <span className="pad-custom-lbl">📂</span>}
            </div>
          );
        })}
      </div>
    );
  }

  function renderArrangeModal() {
    return (
      <div className={`modal-overlay${arrangeModalOpen ? ' open' : ''}`} onClick={() => setArrangeModalOpen(false)}>
        <div className="modal arrange-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-title p">⠿ ARRANGE SAMPLE PADS</div>
          <p style={{ fontSize: 10, color: 'var(--dim)', marginBottom: 16 }}>
            Drag pads between pages · long-press to upload your own audio
          </p>
          <div className="arr-pages">
            {['PAGE 1', 'PAGE 2'].map((lbl, pi) => (
              <div className="arr-page" key={pi}>
                <div className="arr-page-lbl">{lbl}</div>
                <div
                  className={`arr-grid${dragOverKey === `page-${pi}` ? ' doz' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOverKey(`page-${pi}`); }}
                  onDragLeave={() => setDragOverKey(null)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragOverKey(null);
                    if (!arrangeDragSrc.current) return;
                    const { page: sp, slot: ss } = arrangeDragSrc.current;
                    // drop on the page itself (empty area) — find first empty slot or swap last
                    swapPads(sp, ss, pi, padLayout[pi].length - 1);
                    arrangeDragSrc.current = null;
                  }}
                >
                  {padLayout[pi].map((sampleIdx, slot) => {
                    const s = ALL_SAMPLES[sampleIdx];
                    const hasCustom = !!customBuffersRef.current[sampleIdx];
                    const label = hasCustom ? (customSampleLabels[sampleIdx] ?? 'CUST') : s.label;
                    const dragKey = `${pi}-${slot}`;
                    return (
                      <div
                        key={dragKey}
                        className={`arr-pad ${PAD_COLORS[slot % 18]}${dragOverKey === dragKey ? ' dov' : ''}`}
                        draggable
                        onDragStart={() => { arrangeDragSrc.current = { page: pi, slot }; }}
                        onDragEnd={() => { arrangeDragSrc.current = null; setDragOverKey(null); }}
                        onDragOver={e => { e.preventDefault(); setDragOverKey(dragKey); }}
                        onDragLeave={() => setDragOverKey(null)}
                        onDrop={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverKey(null);
                          if (!arrangeDragSrc.current) return;
                          const { page: sp, slot: ss } = arrangeDragSrc.current;
                          swapPads(sp, ss, pi, slot);
                          arrangeDragSrc.current = null;
                        }}
                        onContextMenu={e => { e.preventDefault(); triggerUpload(sampleIdx); }}
                      >
                        <div style={{ fontSize: 15 }}>{s.icon}</div>
                        <span style={{ fontSize: 8 }}>{label}</span>
                        {hasCustom && <span style={{ fontSize: 7, opacity: .5 }}>📂</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="upload-hint">
            💡 <strong style={{ color: 'var(--pc)' }}>Custom samples:</strong> right-click any pad to replace with your own audio (.wav .mp3 .ogg).
          </div>
          <div className="mactions">
            <button className="btn mcc" onClick={() => setArrangeModalOpen(false)}>CLOSE</button>
          </div>
        </div>
      </div>
    );
  }

  function renderUserPresets() {
    return Object.keys(userPresets).map(name => {
      const isPending = name in pendingDeletes;
      return (
        <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <button
            className="btn pbtn user"
            style={isPending ? { opacity: .45, textDecoration: 'line-through', cursor: 'default' } : {}}
            onClick={() => {
              if (isPending) return;
              applyState(userPresets[name]);
              showToast('Loaded: ' + name.toUpperCase());
            }}
          >
            {name.toUpperCase()}
          </button>
          {isPending ? (
            <>
              <span style={{ fontSize: 9, color: 'var(--pk)', minWidth: 14, textAlign: 'center' }}>
                {pendingDeletes[name]}
              </span>
              <span
                style={{ fontSize: 9, color: 'var(--pc)', cursor: 'pointer', padding: '0 3px', border: '1px solid var(--pc)', borderRadius: 2 }}
                onClick={() => undoDelete(name)}
              >
                UNDO
              </span>
            </>
          ) : (
            <span className="pbtn-del" onClick={() => deletePreset(name)}>✕</span>
          )}
        </span>
      );
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="console">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="header">
        <div className="logo-area">
          <div className={`pulse${isPlaying ? '' : ' off'}`} />
          <div>
            <div className="logo">NIKBEAT</div>
            <div className="logo-sub">Synthwave Studio v1.0</div>
          </div>
        </div>
        <div className="hctrl">
          <div className="tempo-wrap">
            <span className="tempo-lbl">BPM</span>
            <input
              type="range" id="tempoSlider" min={60} max={180} value={bpm}
              onChange={e => handleBpmChange(parseInt(e.target.value))}
            />
            <div className="tempo-val">{bpm}</div>
          </div>
          <div className="transport">
            <button className="btn play" onClick={() => isPlaying ? pausePlay() : startPlay()}>
              {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
            </button>
            <button className="btn stop" onClick={stopPlay}>■ STOP</button>
            <button className="btn" onClick={clearPattern}>✕ CLR</button>
            <button className="btn savebtn" onClick={() => { setPresetNameInput(''); setSaveModalOpen(true); }}>★ SAVE</button>
          </div>
        </div>
      </div>

      {/* ── AI Bar ─────────────────────────────────────────────────────────── */}
      <div className="ai-bar">
        <span className="ai-lbl">✦ AI GEN</span>
        <input
          className="ai-input"
          value={aiInput}
          onChange={e => setAiInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generateBeat()}
          placeholder="describe your vibe... (e.g. 'dark synthwave', 'miami nights')"
          autoComplete="off"
        />
        <button className="btn gen" onClick={generateBeat} disabled={aiLoading}>
          {aiLoading ? '...GEN...' : 'GENERATE'}
        </button>
      </div>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <div className="main">
        {/* Left: Sequencer */}
        <div className="seq-section">
          <div className="sec-lbl">Drum Sequencer — 16 Steps</div>
          {renderDrumGrid()}

          {/* Melody */}
          <div className="melody-section">
            <div className="sec-lbl" style={{ marginTop: 10 }}>
              Synth Melody — click step · assign note · plays in sync
            </div>
            <div className="mc-row">
              <span className="mc-lbl">KEY</span>
              <select className="mc-sel" value={melKey} onChange={e => setMelKey(e.target.value)}>
                {NOTE_NAMES.map(n => <option key={n}>{n}</option>)}
              </select>
              <span className="mc-lbl">SCALE</span>
              <select className="mc-sel" value={melScale} onChange={e => setMelScale(e.target.value as ScaleId)}>
                {(Object.keys(SCALE_INTERVALS) as ScaleId[]).map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <span className="mc-lbl">OCT</span>
              <select className="mc-sel" value={melOct} onChange={e => setMelOct(e.target.value)}>
                {['3', '4', '5'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            {renderMelodyGrid()}
          </div>

          {/* Keyboard */}
          <div className="kb-section">
            <div className="sec-lbl">Playable Keyboard</div>
            <div className="kb-header">
              <span className="mc-lbl">VOICE</span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {KB_VOICES.map(v => (
                  <button
                    key={v.id}
                    className={`kb-vbtn${kbVoice === v.id ? ' active' : ''}`}
                    onClick={() => setKbVoice(v.id)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            {renderKeyboard()}
            <div className="kb-hint">click or hold · keyboard: A S D F G H J = white · W E T Y U = black</div>
          </div>
        </div>

        {/* Right: FX + Pads */}
        <div className="right-panel">
          <div>
            <div className="sec-lbl">Master FX</div>
            {renderFxPanel()}
          </div>
          <div className="pads-section">
            <div className="pads-hdr">
              <div className="pads-hdr-lbl">Sample Pads</div>
            </div>
            <div className="pads-ctrl">
              {['P1', 'P2'].map((lbl, i) => (
                <button
                  key={i}
                  className={`pgdot${currentPage === i ? ' active' : ''}`}
                  onClick={() => setCurrentPage(i)}
                >
                  {lbl}
                </button>
              ))}
              <button className="btn arr-btn" onClick={() => setArrangeModalOpen(true)}>⠿ ARRANGE</button>
            </div>
            {renderPads()}
          </div>
        </div>
      </div>

      {/* ── Visualizer ─────────────────────────────────────────────────────── */}
      <div className="viz">
        {Array.from({ length: STEPS }, (_, i) => (
          <div
            key={i}
            className="vbar"
            style={{
              left: `${(i / STEPS) * 100}%`,
              background: VIZ_COLORS[i],
              opacity: playingStep === i ? 1 : 0,
            }}
          />
        ))}
      </div>

      {/* ── Presets Bar ────────────────────────────────────────────────────── */}
      <div className="presets-bar">
        <span className="pre-lbl">PRESETS:</span>
        {Object.keys(PRESETS).map(name => (
          <button key={name} className="btn pbtn" onClick={() => loadBuiltinPreset(name)}>
            {name.toUpperCase()}
          </button>
        ))}
        {Object.keys(userPresets).length > 0 && (
          <span className="pre-lbl" style={{ marginLeft: 8, borderLeft: '1px solid var(--border)', paddingLeft: 10 }}>
            CUSTOM:
          </span>
        )}
        {renderUserPresets()}
      </div>

      {/* ── Save Modal ─────────────────────────────────────────────────────── */}
      <div className={`modal-overlay${saveModalOpen ? ' open' : ''}`} onClick={() => setSaveModalOpen(false)}>
        <div className="modal save-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-title y">★ SAVE PRESET</div>
          <div className="mfield">
            <div className="mlbl">PRESET NAME</div>
            <input
              className="minput"
              maxLength={20}
              placeholder="e.g. MY BANGER"
              value={presetNameInput}
              onChange={e => setPresetNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveUserPreset()}
              autoFocus
            />
          </div>
          <div className="mactions">
            <button className="btn mcc" onClick={() => setSaveModalOpen(false)}>CANCEL</button>
            <button className="btn mc" onClick={saveUserPreset}>SAVE</button>
          </div>
        </div>
      </div>

      {/* ── Arrange Modal ──────────────────────────────────────────────────── */}
      {renderArrangeModal()}

      {/* ── Hidden file input ──────────────────────────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      <div className={`toast${toast.visible ? ' show' : ''}`}>{toast.msg}</div>

    </div>
  );
}
