'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const elements = [], listeners = {};
class Audio {
  constructor(src) { this.src=src; this.paused=true; this.readyState=4; this.currentTime=0; this.events={}; this.plays=0; elements.push(this); }
  addEventListener(name, fn) { this.events[name]=fn; }
  removeEventListener(name) { delete this.events[name]; }
  load() { queueMicrotask(()=>this.events.canplaythrough?.()); }
  play() { this.paused=false; this.plays++; return Promise.resolve(); }
  pause() { this.paused=true; }
}
const sandbox = { window:{}, Audio, location:{protocol:'file:'}, localStorage:{getItem:()=>null,setItem(){}}, document:{hidden:false,addEventListener:(n,f)=>listeners[n]=f,getElementById:()=>null}, setTimeout,clearTimeout,console };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'js/voices.js'),'utf8'),sandbox);
async function main() {
  const V=sandbox.window.VoiceManager;
  for (const file of new Set(Object.values(V.SOUND_FILES).filter(Boolean))) assert.ok(fs.statSync(path.join(root,file)).size>0);
  V.unlock(); V.unlock();
  await new Promise(r=>setImmediate(r));
  assert.equal(elements.length,8,'one probe and three pooled elements per distinct MP3');
  assert.equal(V.clipState().pool.length,2);
  assert.ok(V.playClip('catch'));
  const short=elements.find(e=>!e.paused);
  assert.ok(short.src.endsWith('atata-sfx.mp3'));
  V.playClip('catch'); assert.equal(short.plays,1,'repeat pickup is suppressed');
  V.playClip('combo'); assert.ok(short.paused,'combo interrupts pickup');
  const celebration=elements.find(e=>!e.paused);
  V.playClip('catch'); assert.equal(elements.filter(e=>!e.paused).length,1);
  V.setVolume(.2); assert.equal(celebration.volume,.55*.2);
  V.setMuted(true); assert.ok(elements.every(e=>e.paused)); assert.equal(V.playClip('level'),false);
  V.setMuted(false); V.setVolume(0); assert.equal(V.playClip('catch'),false);
  V.setVolume(1); V.playClip('level'); V.toggle(); assert.ok(elements.every(e=>e.paused));
  V.toggle(); V.playClip('catch'); sandbox.document.hidden=true; listeners.visibilitychange(); assert.ok(elements.every(e=>e.paused));
  V.playClip('catch'); const active=elements.find(e=>!e.paused); active.paused=true; active.onended(); assert.ok(V.playClip('catch'),'ended clip releases slot'); V.stop();
  // Check each 3D adapter with its existing synth disabled and recorded playback observed.
  for (const [file,global,method,events] of [['js/skyhop/audio.js','SkyHop','play',['heart','honey','checkpoint','complete']],['js/kart/main.js','CozyKart','tone',['pickup','go','lap','finish']]]) {
    const calls=[];
    const context={state:'running',createGain:()=>({gain:{value:0},connect(){}}),createOscillator(){throw Error('Synth disabled in adapter test');}};
    const win={VoiceManager:{setAudioContext(){},setMuted:v=>calls.push(['mute',v]),setVolume:v=>calls.push(['volume',v]),unlock(){},playClip:e=>calls.push(['clip',e])},AudioContext:function(){return context;}};
    win[global]={ui:{sound(){}}};
    const box={window:win,VoiceManager:win.VoiceManager,document:{getElementById:()=>({setAttribute(){}})},matchMedia:()=>({matches:false}),localStorage:{getItem:()=>null},console:{error(){}}};
    vm.createContext(box);
    let source=fs.readFileSync(path.join(root,file),'utf8');
    if(global==='CozyKart') source=source.replace(/^\s*boot\(\);\s*$/m,'');
    vm.runInContext(source,box);
    const audio=win[global].audio; audio.unlock();
    events.forEach(e=>audio[method](e)); assert.equal(calls.filter(c=>c[0]==='clip').length,4,file+' event mapping');
    audio.toggle(); assert.ok(calls.some(c=>c[0]==='mute'&&c[1]===true));
    audio.setVolume(.15); assert.ok(calls.some(c=>c[0]==='volume'&&c[1]===.15));
  }
  console.log('PASS MP3 paths, deduplicated preload, playback priorities, end cleanup, volume, mute, visibility, and both 3D audio adapters');
}
main().catch(e=>{console.error(e);process.exitCode=1;});