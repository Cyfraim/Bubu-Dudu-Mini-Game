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

const ROOT     = path.join(__dirname, '..');
const PORT     = 9333;
const PROFILE  = fs.mkdtempSync(path.join(os.tmpdir(), 'shot-'));
const PAGE_URL = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/');
const OUT      = process.argv[2] || path.join(__dirname, 'pixel-shot.png');

const chrome = spawn(EDGE, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`,
  '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', '--mute-audio',
  '--window-size=760,560',
  '--allow-file-access-from-files',
  PAGE_URL,
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdpTargets() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://localhost:${PORT}/json/list`);
      return await r.json();
    } catch { await sleep(250); }
  }
  throw new Error('browser never came up');
}

(async () => {
  let code = 0;
  try {
    const targets = await cdpTargets();
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

    await send('Page.enable');
    await send('Runtime.enable');
    await sleep(1500);

    // Report what the renderer actually loaded, so a broken sprite is visible.
    const info = await evaluate(`(() => {
      const R = window.CharacterRenderer;
      if (!R) return { error: 'CharacterRenderer missing' };
      const out = { api: Object.keys(R) };
      for (const k of ['bubu', 'dudu']) {
        const rows = R.PIXEL_SPRITES[k];
        out[k] = { rows: rows.length, widths: [...new Set(rows.map(r => r.length))] };
      }
      return out;
    })()`);
    console.log('renderer:', JSON.stringify(info));

    // Drive the game into the pixel mode used for the screenshot.
    const mode = await evaluate(`(() => {
      const names = [...document.querySelectorAll('button, a')]
        .map(n => (n.textContent || '').trim())
        .filter(Boolean);
      return names;
    })()`);
    console.log('controls:', JSON.stringify(mode));

    const started = await evaluate(`(() => {
      const btn = [...document.querySelectorAll('button, a')]
        .find(n => /pixel picnic|together run/i.test(n.textContent || ''));
      if (!btn) return 'no pixel mode button';
      btn.click();
      return 'clicked ' + (btn.textContent || '').trim();
    })()`);
    console.log('mode start:', started);
    await sleep(1200);

    // Press play so the characters are on screen rather than the menu.
    await evaluate(`(() => {
      const p = document.getElementById('play');
      if (p) { p.click(); return true; }
      return false;
    })()`);
    await sleep(2500);

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
    console.log('wrote', OUT);
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
