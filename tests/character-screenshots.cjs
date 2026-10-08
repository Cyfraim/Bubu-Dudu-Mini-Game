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
const PORT     = 9444;
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

    const errors=[];
    ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);});
    for(const mode of ['hub','catch','picnic','runner','hug']){
      const url='file:///'+path.join(ROOT,mode==='hub'?'index.html':'arcade.html').replace(/\\/g,'/')+(mode==='hub'?'':'?mode='+(mode==='hug'?'catch':mode));
      await send('Page.navigate',{url});await sleep(1000);
      if(mode!=='hub')await evaluate(`(()=>{const button=[...document.querySelectorAll('button')].find(b=>/Got it/.test(b.textContent));if(button)button.click();ArcadeGame.launch();if(${JSON.stringify(mode)}==='hug')ArcadeGame.state.hug=100;})()`);
      await sleep(200);
      await evaluate('CharacterRenderer.validateSprites()');
      const shot=await send('Page.captureScreenshot',{format:'png'});
      fs.writeFileSync(path.join(__dirname,'character-'+mode+'.png'),Buffer.from(shot.data,'base64'));
      console.log('PASS screenshot '+mode);
    }
    if(errors.length)throw Error(errors.join('\n'));
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
