/**
 * js/voices.js – Web Audio API voice babble synthesizer
 *
 * ── Overview ─────────────────────────────────────────────────────────
 * Character voice for catch / combo / level events plays the two
 * recorded clips in the root sfx/ folder:
 *   bubu-dudu-atata-sfx.mp3      → catch
 *   bubu-dudu-tata-lala-sfx.mp3  → combo, level
 * Every other event (wrong, hug, lostHeart, gameOver) uses the Web
 * Audio API babble synth below, which also acts as the fallback
 * whenever a clip fails to load (e.g. offline / missing file).
 *
 * Clips load through pooled <audio> elements, not fetch(). Chrome and
 * Edge reject fetch() on file:// origins ("Failed to fetch"), which
 * would silently drop the game back to the synth whenever the player
 * double-clicks the HTML. Elements work on both file:// and http://.
 * Verified with tests/clip-check.cjs in headless Edge.
 *
 * Clips play with a slight random playbackRate variation so repeated
 * triggers don't sound mechanical.
 *
 * ⚠️  Licensing: these clips are user-supplied. Confirm you hold the
 * rights to redistribute them before publishing this repo — the
 * "a-ta-ta" style voice is associated with the Reels cartoon
 * characters by Huang Xiao B (黄小B). To go fully self-contained,
 * clear every path in SOUND_FILES and the synth alone will carry the
 * voices.
 *
 * ── Syllable anatomy ─────────────────────────────────────────────────
 * Each syllable = a short "t" click (10-20 ms high-pass noise burst)
 *               + an "a" vowel (sawtooth/triangle through 2 parallel
 *                 bandpass filters at ~800 Hz and ~1200 Hz).
 * Rapid staccato: 5-8 syllables in ~0.6 s.
 *
 * ── Per-character pitch ───────────────────────────────────────────────
 * bubu (Yier the panda)  : higher, squeakier  ~520–700 Hz
 * dudu (Bubu the bear)   : lower, rounder     ~340–460 Hz
 * ±8% random pitch jitter per syllable; slight upward glide on last.
 *
 * ── Tweakable constants ───────────────────────────────────────────────
 * VOICE_STYLE.bubu / .dudu  — baseFreq, jitter, vowelType, volume
 * MAX_VOICES = 3            — simultaneous voice limit
 */

/* ────────────────────────────────────────────────────────────────────── */
/*  Optional file overrides                                               */
/*  Set a path to an audio file you own; leave '' to use the synth.      */
/* ────────────────────────────────────────────────────────────────────── */
const SOUND_FILES = {
  catch:    'sfx/bubu-dudu-atata-sfx.mp3',
  combo:    'sfx/bubu-dudu-tata-lala-sfx.mp3',
  wrong:    '',
  hug:      '',
  lostHeart:'',
  level:    'sfx/bubu-dudu-tata-lala-sfx.mp3',
  gameOver: '',
};

/* ────────────────────────────────────────────────────────────────────── */
/*  Tweakable voice parameters                                            */
/* ────────────────────────────────────────────────────────────────────── */
const VOICE_STYLE = Object.freeze({
  bubu: {   // Yier the panda – higher, squeakier
    baseFreq:   600,    // Hz centre for the vowel formant
    jitter:     0.08,   // ±fraction random pitch per syllable
    vowelType:  'triangle',
    f1:         820,    // first formant bandpass Hz
    f2:        1250,    // second formant bandpass Hz
    clickFreq: 4800,    // click HP cutoff Hz
    volume:     0.10,   // gain (keep quieter than SFX)
    syllables:  6,      // per staccato burst
    burstMs:    620,    // total burst duration ms
  },
  dudu: {   // Bubu the bear – lower, rounder
    baseFreq:   400,
    jitter:     0.08,
    vowelType:  'sawtooth',
    f1:         750,
    f2:        1100,
    clickFreq: 3200,
    volume:     0.10,
    syllables:  6,
    burstMs:    640,
  },
});

/* ────────────────────────────────────────────────────────────────────── */
/*  VoiceManager IIFE                                                     */
/* ────────────────────────────────────────────────────────────────────── */
window.VoiceManager = (function () {
  'use strict';

  const MAX_VOICES   = 3;
  const LS_KEY       = 'bubuVoicesEnabled';
  // Recorded clips are mastered audio, so they play much louder than the
  // synth's ~0.10 Web Audio gain. Tweak this to taste (0…1).
  const CLIP_VOLUME = 0.55;

  let _ctx           = null;   // shared AudioContext (set by host page)
  let _voicesOn      = true;   // toggled by the 💬 button
  let _activeVoices  = 0;
  let _bubbleCallback= null;   // function(text, x, y) for speech-bubble popups
  let _cachedBuffers = {};     // decoded AudioBuffers keyed by event name (http:// only)
  let _clipPool      = {};     // path -> ready HTMLAudioElement(s) (works on file://)
  let _clipFailed    = {};     // paths that failed on both load paths
  const _loading = new Set();
  let _activeClip = null;
  let _clipPriority = 0;
  let _muted = false;
  let _volume = 1;

  function stop() {
    if (_activeClip) {
      try { if (_activeClip.pause) { _activeClip.pause(); _activeClip.currentTime = 0; } else _activeClip.stop(); } catch {}
      _activeClip = null;
    }
    _clipPriority = 0;
  }

  function setMuted(value) { _muted = Boolean(value); if (_muted) stop(); }
  function setVolume(value) {
    if (!Number.isFinite(value)) return;
    _volume = Math.max(0, Math.min(1, value));
    if (_volume === 0) stop();
    else if (_activeClip && _activeClip.pause) _activeClip.volume = CLIP_VOLUME * _volume;
  }

  // Restore saved preference
  try { _voicesOn = localStorage.getItem(LS_KEY) !== 'false'; } catch {}

  // ── AudioContext handoff from main page ──────────────────────────
  function setAudioContext(ctx) { _ctx = ctx; }

  function unlock() {
    if (_ctx && _ctx.state === 'suspended') _ctx.resume().catch(() => {});
    Object.keys(SOUND_FILES).forEach(_preload);
  }

  // ── Load a clip ─────────────────────────────────────────────────
// Two strategies, because fetch() is blocked on file:// origins in
// Chrome/Edge while a plain <audio> element still loads there:
//
//   1. <audio> element  — works on file:// AND http://, so it is tried
//      first. Elements are pooled (a few per clip) so overlapping
//      triggers can retrigger without cutting each other off.
//   2. fetch + decodeAudioData — only used if the element path fails;
//      gives exact Web Audio timing, so it is the http:// path.
//
// Either way, a failure is silent and the synth takes over.
function _loadClipElement(path) {
  return new Promise((resolve) => {
    let el;
    try { el = new Audio(path); } catch { resolve(false); return; }
    el.preload = 'auto';
    const done = (ok) => { clearTimeout(timer); el.removeEventListener('canplaythrough', onOk); el.removeEventListener('error', onErr); resolve(ok); };
    const onOk  = () => done(el.readyState >= 2);
    const onErr = () => done(false);
    // Generous timeout: a slow disk should not permanently disable a clip.
    const timer = setTimeout(() => done(el.readyState >= 2), 8000);
    el.addEventListener('canplaythrough', onOk);
    el.addEventListener('error', onErr);
    try { el.load(); } catch { done(false); }
  });
}

function _loadClipBuffer(path) {
  return fetch(path)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(ab => _ctx && _ctx.decodeAudioData(ab))
    .then(buf => buf || null)
    .catch(() => null);
}

function _preload(event) {
    const path = SOUND_FILES[event];
    if (!path || _clipPool[path] || _cachedBuffers[path] || _clipFailed[path] || _loading.has(path)) return;
    _loading.add(path);
    _loadClipElement(path).then((ok) => {
      if (ok) {
        _loading.delete(path);
        // Warm a small pool so rapid repeats do not cut each other off.
        _clipPool[path] = [];
        for (let i = 0; i < 3; i++) {
          const el = new Audio(path);
          el.preload = 'auto';
          try { el.load(); } catch {}
          _clipPool[path].push(el);
        }
        return;
      }
      // Element route failed; try the Web Audio route before giving up.
      if (location.protocol === 'file:') { _clipFailed[path] = true; _loading.delete(path); return; }
      _loadClipBuffer(path).then((buf) => {
        _loading.delete(path);
        if (buf) _cachedBuffers[path] = buf;
        else _clipFailed[path] = true;
      });
    });
  }

  // ── Play a clip from the <audio> element pool ───────────────────────
  // Returns true only if playback actually started, so the caller knows
  // whether to fall back to the synth.
  function _playClipElement(path, volume) {
    const pool = _clipPool[path];
    if (!pool || !pool.length) return false;
    // Prefer an element that is not already playing; otherwise reuse one
    // (restarting it) so rapid triggers are never dropped.
    let el = pool.find((e) => e.paused || e.ended);
    if (!el) el = pool[0];
    try {
      el.currentTime = 0;
      el.volume = Math.max(0, Math.min(1, volume));
      // Small pitch variation so repeats do not sound mechanical.
      el.playbackRate = 1 + (Math.random() - 0.5) * 0.06;
      _activeClip = el;
      el.onended = () => { if (_activeClip === el) { _activeClip = null; _clipPriority = 0; } };
      const p = el.play();
      // play() returns a promise on modern browsers; swallow rejections
      // (e.g. autoplay policy) without breaking the caller.
      if (p && typeof p.catch === 'function') p.catch(() => { if (_activeClip === el) stop(); });
      return true;
    } catch { return false; }
  }

  // ── Play a clip for an event, whichever route is available ──────────
  function _playClip(event, volume) {
    const path = SOUND_FILES[event];
    if (!path || _clipFailed[path]) return false;
    const priority = event === 'level' ? 3 : event === 'combo' ? 2 : 1;
    // Drop repeated pickups; celebrations may interrupt a lower-priority clip.
    if (_activeClip && priority <= _clipPriority) return true;
    if (!_clipPool[path] && !_cachedBuffers[path]) return false;
    stop();
    const played = _playClipElement(path, volume) || (_cachedBuffers[path] && _playBuffer(_cachedBuffers[path], volume));
    if (played) _clipPriority = priority;
    return Boolean(played);
  }

  // ── Play a preloaded AudioBuffer (Web Audio path) ────────────────────
  function _playBuffer(buf, volume) {
    if (!_ctx || _ctx.state !== 'running') return false;
    try {
      const src  = _ctx.createBufferSource();
      const gain = _ctx.createGain();
      src.buffer = buf;
      src.playbackRate.value = 1 + (Math.random() - 0.5) * 0.10;
      gain.gain.value = volume;
      src.connect(gain);
      gain.connect(_ctx.destination);
      _activeClip = src;
      src.onended = () => { src.disconnect(); gain.disconnect(); if (_activeClip === src) { _activeClip = null; _clipPriority = 0; } };
      src.start();
      return true;
    } catch { return false; }
  }

  // ── Synth: single syllable "ta" ───────────────────────────────────
  // click (noise burst) + vowel (filtered osc)
  function _syllable(style, startTime, freq, isLast) {
    if (!_ctx) return;
    const t   = startTime;
    const vol = style.volume;

    // Click – short high-passed white-noise burst
    try {
      const bufLen = Math.round(_ctx.sampleRate * 0.016);
      const nBuf   = _ctx.createBuffer(1, bufLen, _ctx.sampleRate);
      const data   = nBuf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);
      const nSrc  = _ctx.createBufferSource();
      nSrc.buffer = nBuf;
      const hp    = _ctx.createBiquadFilter();
      hp.type     = 'highpass';
      hp.frequency.value = style.clickFreq;
      const nGain = _ctx.createGain();
      nGain.gain.setValueAtTime(vol * 0.6, t);
      nGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);
      nSrc.connect(hp); hp.connect(nGain); nGain.connect(_ctx.destination);
      nSrc.start(t); nSrc.stop(t + 0.020);
    } catch {}

    // Vowel – osc through two parallel bandpass filters
    const vowelDur = isLast ? 0.16 : 0.075;
    const glide    = isLast ? freq * 1.18 : freq;
    try {
      const osc  = _ctx.createOscillator();
      osc.type   = style.vowelType;
      osc.frequency.setValueAtTime(freq, t + 0.012);
      if (isLast) osc.frequency.linearRampToValueAtTime(glide, t + 0.012 + vowelDur * 0.7);

      for (const fHz of [style.f1, style.f2]) {
        const bp    = _ctx.createBiquadFilter();
        bp.type     = 'bandpass';
        bp.frequency.value = fHz;
        bp.Q.value  = 3.5;
        const g     = _ctx.createGain();
        g.gain.setValueAtTime(0.0001, t + 0.010);
        g.gain.exponentialRampToValueAtTime(vol * 0.55, t + 0.022);
        g.gain.exponentialRampToValueAtTime(0.0001,     t + 0.012 + vowelDur);
        osc.connect(bp); bp.connect(g); g.connect(_ctx.destination);
      }
      osc.start(t + 0.010);
      osc.stop(t + 0.015 + vowelDur + 0.02);
    } catch {}
  }

  // ── Synth: staccato babble burst ─────────────────────────────────
  function _synthBabble(kind, pattern, options) {
    if (!_ctx || _ctx.state !== 'running') return;
    const style    = VOICE_STYLE[kind] || VOICE_STYLE.dudu;
    const count    = pattern === 'single' ? 1
                   : pattern === 'long'   ? 2
                   : style.syllables;
    const interval = style.burstMs / 1000 / count;
    const now      = _ctx.currentTime;

    _activeVoices++;
    for (let i = 0; i < count; i++) {
      const jitter  = 1 + (Math.random() * 2 - 1) * style.jitter;
      const freq    = style.baseFreq * jitter;
      _syllable(style, now + i * interval, freq, i === count - 1);
    }
    // Release voice slot after burst
    setTimeout(() => { _activeVoices = Math.max(0, _activeVoices - 1); },
               style.burstMs + 200);
  }

  // ── Synth: special event sounds ──────────────────────────────────
  function _synthEvent(kind, event) {
    if (!_ctx || _ctx.state !== 'running') return;
    const style = VOICE_STYLE[kind] || VOICE_STYLE.dudu;
    const vol   = style.volume;
    const now   = _ctx.currentTime;

    const tone = (freq, t, dur, type, v, endFreq) => {
      try {
        const o = _ctx.createOscillator();
        const g = _ctx.createGain();
        o.type = type || 'sine';
        o.frequency.setValueAtTime(freq, t);
        if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(v || vol, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(_ctx.destination);
        o.start(t); o.stop(t + dur + 0.02);
      } catch {}
    };

    if (event === 'wrong') {
      // Rising "eh?" squeak
      tone(style.baseFreq * 0.9, now,      0.08, 'sine', vol * 0.7);
      tone(style.baseFreq * 1.3, now + 0.09, 0.14, 'sine', vol * 0.7);
    } else if (event === 'hug') {
      // Long soft "awww" – both voices layered
      const f1 = (VOICE_STYLE.bubu.baseFreq + VOICE_STYLE.dudu.baseFreq) / 2;
      tone(f1,        now,       0.55, 'triangle', vol * 0.65);
      tone(f1 * 1.25, now + 0.05, 0.50, 'sine',     vol * 0.40);
    } else if (event === 'lostHeart') {
      // Falling "uwaa"
      tone(style.baseFreq * 1.1, now,      0.14, 'sine', vol * 0.8, style.baseFreq * 0.65);
      tone(style.baseFreq * 0.7, now + 0.12, 0.22, 'sine', vol * 0.7, style.baseFreq * 0.4);
    } else if (event === 'level') {
      // Fast giggle – 4 quick rising notes
      [1.0, 1.15, 1.32, 1.50].forEach((r, i) =>
        tone(style.baseFreq * r, now + i * 0.09, 0.10, 'triangle', vol * 0.75)
      );
    } else if (event === 'gameOver') {
      // Soft "mmm" sigh
      tone(style.baseFreq * 0.88, now,      0.40, 'sine', vol * 0.5, style.baseFreq * 0.6);
    }
  }

  // ── Public: playBabble ────────────────────────────────────────────
  /**
   * Called by the main game via speak(event).
   * @param {'bubu'|'dudu'} character
   * @param {'catch'|'combo'|'wrong'|'hug'|'lostHeart'|'level'|'gameOver'} event
   * @param {{isMuted?:boolean, x?:number, y?:number}} options
   */
  function playBabble(character, event, options = {}) {
    if (!_voicesOn || _muted || _volume === 0 || options.isMuted) return;
    if (_activeVoices >= MAX_VOICES)    return;
    // A running AudioContext is required for the synth, but NOT for a
    // recorded clip (those play through an <audio> element), so only
    // bail early when there is no context at all.
    if (!_ctx) return;
    if (_ctx.state !== 'running' && !SOUND_FILES[event]) return;

    const kind = (character === 'bubu' || character === 'dudu') ? character : 'bubu';

    // Preload lazily (no-op once the pool is warm or the path is empty)
    _preload(event);

    // Try the recorded clip first, fall back to the synth.
    // VOICE_STYLE.volume is a Web Audio gain for the synth; a recorded
    // clip is already at full scale, so it gets its own level.
    const style = VOICE_STYLE[kind] || VOICE_STYLE.dudu;
    let played = _playClip(event, CLIP_VOLUME * _volume);

    if (!played) {
      // Choose synth branch by event type
      if (['wrong','hug','lostHeart','level','gameOver'].includes(event)) {
        _synthEvent(kind, event);
      } else {
        // catch / combo / generic → staccato babble
        const pattern = event === 'hug' ? 'long' : event === 'catch' ? 'single' : 'burst';
        _synthBabble(kind, pattern, options);
      }
    }

    // Speech-bubble popup
    if (_bubbleCallback && options.x != null && options.y != null) {
      const bubble = {
        catch:    'a-ta!',
        combo:    'a-ta-ta!',
        wrong:    'eh~?',
        hug:      'aww~',
        lostHeart:'uwaa!',
        level:    'hehe!',
        gameOver: 'mmm…',
      }[event];
      if (bubble) {
        try { _bubbleCallback(bubble, options.x, options.y); } catch {}
      }
    }
  }

  // ── Toggle & UI ───────────────────────────────────────────────────
  function toggle() {
    _voicesOn = !_voicesOn;
    if (!_voicesOn) stop();
    try { localStorage.setItem(LS_KEY, String(_voicesOn)); } catch {}
    updateVoiceUI();
  }

  function updateVoiceUI() {
    const btn = document.getElementById('voice');
    if (!btn) return;
    btn.textContent = _voicesOn ? '💬' : '💬̸';
    btn.setAttribute('aria-pressed', String(_voicesOn));
    btn.setAttribute('aria-label', _voicesOn ? 'Mute character voices' : 'Unmute character voices');
    btn.title = _voicesOn ? 'Voices on (V)' : 'Voices off (V)';
  }

  function setBubbleCallback(fn) { _bubbleCallback = fn; }

  // 3D games retain their own synth effects if a recording is unavailable.
  function playClip(event) {
    if (!_voicesOn || _muted || _volume === 0) return false;
    _preload(event);
    return _playClip(event, CLIP_VOLUME * _volume);
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

  // ── Public API ────────────────────────────────────────────────────
  return {
    setAudioContext,
    unlock,
    stop,
    setMuted,
    setVolume,
    playClip,
    playBabble,
    toggle,
    updateVoiceUI,
    setBubbleCallback,
    isOn: () => _voicesOn,
    VOICE_STYLE,   // expose for tweaking
    SOUND_FILES,   // expose for tweaking
    // Diagnostic: what the clip loader currently believes it has.
    clipState: () => ({
      pool: Object.keys(_clipPool).map((k) => ({ path: k, size: _clipPool[k].length })),
      buffers: Object.keys(_cachedBuffers),
      failed: Object.keys(_clipFailed),
    }),
  };
}());

// Expose the top-level playBabble shortcut used by speak() in the main game
window.playBabble = window.VoiceManager.playBabble.bind(window.VoiceManager);
