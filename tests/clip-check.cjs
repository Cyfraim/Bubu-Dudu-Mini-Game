/**
 * clip-check.cjs — finds out whether the recorded clips actually play,
 * and if not, exactly why.
 *
 * Loads index.html in headless Edge the way a player would (file://) and
 * reports, for each clip in SOUND_FILES:
 *   - can fetch() read it and decodeAudioData() parse it?
 *   - what does VoiceManager actually play for catch/combo/level,
 *     the recorded buffer or the synth?
 *
 * Usage:
 *   node tests/clip-check.cjs            real double-click (default)
 *   node tests/clip-check.cjs --relaxed  add --allow-file-access-from-files
 */
'use strict';
const fs   = require('node:fs');
const path = require('node:path');
const os   = require('node:os');
const { spawn } = require('node:child_process');

const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => fs.existsSync(p));
if (!EDGE) { console.error('No Chromium browser found'); process.exit(1); }

const ROOT    = path.join(__dirname, '..');
const PORT    = 9334;
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'clip-'));
const PAGE    = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/');
const RELAXED = process.argv.includes('--relaxed');
const sleep   = (ms) => new Promise((r) => setTimeout(r, ms));

console.log(`mode: ${RELAXED ? 'relaxed (--allow-file-access-from-files)' : 'default (real double-click)'}`);

const chrome = spawn(EDGE, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`,
  '--no-first-run', '--no-default-browser-check',
  '--autoplay-policy=no-user-gesture-required',
  '--window-size=760,560',
  ...(RELAXED ? ['--allow-file-access-from-files'] : []),
  PAGE,
], { stdio: 'ignore' });

const PROBE = `(async () => {
  const out = { protocol: location.protocol, clips: {} };
  const V = window.VoiceManager;
  if (!V) return { error: 'VoiceManager missing' };
  out.soundFiles = { ...V.SOUND_FILES };
  const paths = [...new Set(Object.values(V.SOUND_FILES).filter(Boolean))];

  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
  out.contextState = ctx.state;
  V.setAudioContext(ctx); V.unlock();

  // Count the synth (Web Audio) path only. Clip playback goes through
  // <audio> elements now, which never touch this context.
  const played = { synthOscillators: 0 };
  const osc = ctx.createOscillator.bind(ctx);
  ctx.createOscillator = function () { played.synthOscillators++; return osc(); };

  // Watch every <audio> element the page creates to see if one plays.
  out.audioPlays = [];
  const RealAudio = window.Audio;
  window.Audio = function (src) {
    const el = new RealAudio(src);
    const play = el.play.bind(el);
    el.play = function () {
      out.audioPlays.push({ src: String(src), volume: el.volume, rate: +el.playbackRate.toFixed(3) });
      return play();
    };
    return el;
  };
  window.Audio.prototype = RealAudio.prototype;

  // The pool is only built as a side effect of the first playBabble for
  // each event, so kick that off, wait for the pool to warm, then measure.
  for (const ev of ['catch', 'combo', 'level']) V.playBabble('bubu', ev, {});
  await new Promise(r => setTimeout(r, 2500));
  out.clipStateAfterWarm = V.clipState ? V.clipState() : 'no clipState()';
  out.apiKeys = Object.keys(V);
  out.scriptSrcs = [...document.querySelectorAll('script[src]')].map(s => s.getAttribute('src'));

  for (const ev of ['catch', 'combo', 'level']) {
    V.stop();
    out.audioPlays.length = 0;
    played.synthOscillators = 0;
    V.playBabble('bubu', ev, {});
    await new Promise(r => setTimeout(r, 300));
    out[ev] = { elementPlays: out.audioPlays.slice(), synthOsc: played.synthOscillators };
  }

  window.Audio = RealAudio;

  // Inspect the real element state directly, bypassing our wrapper.
  out.directElementProbe = await (async () => {
    const res = {};
    for (const p of paths) {
      const a = new RealAudio(p);
      a.preload = 'auto';
      res[p] = await new Promise((r) => {
        const to = setTimeout(() => r({ readyState: a.readyState, timeout: true,
                                        networkState: a.networkState,
                                        err: a.error && a.error.code }), 6000);
        a.addEventListener('canplaythrough', () => {
          clearTimeout(to);
          r({ readyState: a.readyState, duration: +a.duration.toFixed(3) });
        }, { once: true });
        a.addEventListener('error', () => {
          clearTimeout(to);
          r({ readyState: a.readyState, mediaError: a.error && a.error.code,
              msg: a.error && a.error.message });
        }, { once: true });
        a.load();
      });
    }
    return res;
  })();
  return out;
})()`;

(async () => {
  let code = 0;
  try {
    let targets;
    for (let i = 0; i < 60; i++) {
      try {
        targets = await (await fetch(`http://localhost:${PORT}/json/list`)).json();
        break;
      } catch { await sleep(250); }
    }
    if (!targets) throw new Error('browser never came up');

    const page = targets.find((t) => t.type === 'page');
    if (!page) throw new Error('no page target');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));

    let id = 0;
    const pending = new Map();
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id); pending.delete(m.id);
        m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result);
      }
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const n = ++id; pending.set(n, { resolve, reject });
      ws.send(JSON.stringify({ id: n, method, params }));
    });
    const evaluate = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
      return r.result.value;
    };

    await send('Runtime.enable');
    await send('Network.enable').catch(() => {});
    await send('Network.setCacheDisabled', { cacheDisabled: true }).catch(() => {});
    await send('Page.enable');
    // Force a fresh load so we test the file on disk, not a cached copy.
    await send('Page.reload', { ignoreCache: true }).catch(() => {});
    await sleep(2500);

    // Surface page-side diagnostics instead of guessing.
    await send('Log.enable').catch(() => {});
    const logs = [];
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.method === 'Runtime.consoleAPICalled') {
        logs.push('[console] ' + (m.params.args || []).map((a) => a.value ?? a.description).join(' '));
      }
      if (m.method === 'Log.entryAdded') {
        logs.push('[log:' + m.params.entry.level + '] ' + m.params.entry.text);
      }
    });

    const report = await evaluate(PROBE);
    console.log(JSON.stringify(report, null, 2));

    const events = ['catch', 'combo', 'level'];
    let elementPlays = 0, synthUse = 0;
    for (const ev of events) {
      const r = report[ev] || {};
      elementPlays += (r.elementPlays || []).length;
      synthUse += r.synthOsc || 0;
    }
    console.log('\n--- verdict ---');
    for (const ev of events) {
      const r = report[ev] || {};
      const p = (r.elementPlays || [])[0];
      console.log(`  ${ev.padEnd(6)} element plays: ${(r.elementPlays || []).length}` +
                  (p ? ` (${p.src} vol=${p.volume} rate=${p.rate})` : '') +
                  ` | synth osc: ${r.synthOsc || 0}`);
    }
    console.log(`TOTAL element plays: ${elementPlays} | TOTAL synth osc: ${synthUse}`);
    if (elementPlays >= events.length && synthUse === 0) {
      console.log('=> OK: all three events play the recorded clips, no synth.');
    } else if (elementPlays > 0) {
      console.log('=> PARTIAL: some events still fall back to the synth.');
      code = 1;
    } else {
      console.log('=> FAIL: no clip playback at all.');
      code = 1;
    }
    ws.close();
  } catch (err) {
    console.error('FAILED:', err.message);
    code = 1;
  } finally {
    chrome.kill();
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  }
  process.exit(code);
})();