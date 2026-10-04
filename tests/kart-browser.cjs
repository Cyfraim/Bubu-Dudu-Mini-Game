/* Dependency-free CDP checks. Open cozy-kart.html in Edge/Chromium on port 9222. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
async function main(){
 const pages=await(await fetch('http://localhost:9222/json/list')).json(),page=pages.find(p=>p.type==='page'&&p.url.endsWith('cozy-kart.html'));
 if(!page)throw Error('Open cozy-kart.html in a debugging browser on port 9222');
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));let id=0;const pending=new Map(),errors=[];
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(JSON.stringify(m.params.exceptionDetails));});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 try{
  await send('Runtime.enable');await send('Page.enable');await send('Page.reload');await wait(1200);
  const checks=await evaluate(`(()=>{const K=CozyKart,out=[],assert=(v,m)=>{if(!v)throw Error(m);out.push(m);};
   assert(THREE.REVISION==='128'&&K.renderer&&K.path.length>300,'local file boot and WebGL scene');
   assert(document.querySelectorAll('[data-track]').length===3&&document.querySelectorAll('[data-kind]').length===2,'three tracks and both buddies selectable');
   for(let i=0;i<3;i++)for(const kind of ['bubu','dudu']){K.selection.track=i;K.selection.kind=kind;K.start();assert(K.karts.length===4&&K.race.racers[0].kind===kind,'track '+i+' '+kind+' builds four karts');const a=K.path.at(0).position,b=K.path.at(K.path.length-.001).position;assert(a.distanceTo(b)<.01,'track '+i+' path closes');}
   K.selection.track=0;K.selection.kind='bubu';K.selection.auto=false;K.start();for(let i=0;i<361;i++)K.update(K.race,K.CONFIG.step,{});assert(K.race.mode==='racing','three-second countdown completes');K.pause();const d=K.race.racers[0].distance;K.update(K.race,1,{throttle:true});assert(K.race.racers[0].distance===d&&document.getElementById('resume'),'pause freezes race');K.pause();assert(K.race.mode==='racing','resume returns to race');
   K.race.racers[0].item='shield';K.useItem(K.race,K.race.racers[0]);assert(K.race.racers[0].shield===8,'shield activates');
   return out;})()`);console.log(checks.map(x=>'PASS '+x).join('\n'));
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'w',code:'KeyW'});await wait(600);if(!(await evaluate('CozyKart.race.racers[0].speed>2')))throw Error('Keyboard throttle failed');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'d',code:'KeyD'});await wait(350);if(!(await evaluate('CozyKart.controls().steer===1')))throw Error('Keyboard steering failed');
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'w',code:'KeyW'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'d',code:'KeyD'});console.log('PASS real keyboard throttle and steering');
  await evaluate('CozyKart.pause(); document.getElementById("restart").click()');if(!(await evaluate('CozyKart.race.mode==="countdown"&&CozyKart.race.time===0')))throw Error('Replay failed');
  await evaluate('CozyKart.race.mode="racing"; CozyKart.race.racers[0].distance=CozyKart.race.length*3-.02; CozyKart.race.racers[0].speed=23; CozyKart.selection.auto=true');await wait(250);
  if(!(await evaluate('CozyKart.race.mode==="complete"&&!!document.getElementById("again")&&Number.isFinite(CozyKart.best.garden)')))throw Error('Finish summary/storage failed');
  await evaluate('document.getElementById("next").click()');if(!(await evaluate('CozyKart.selection.track===1&&CozyKart.race.mode==="countdown"')))throw Error('Next track failed');console.log('PASS replay, live three-lap finish, best time, and next track');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Emulation.setTouchEmulationEnabled',{enabled:true});await evaluate('CozyKart.start(); CozyKart.race.mode="racing"');await wait(250);
  const touch=await evaluate(`(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}};return {left:rect('[data-hold="left"]'),drift:rect('[data-hold="drift"]'),go:rect('[data-hold="throttle"]'),display:getComputedStyle(document.getElementById('touch')).display}})()`);
  if(touch.display==='none')throw Error('Mobile controls hidden');
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...touch.left,id:1},{...touch.drift,id:2},{...touch.go,id:3}]});
  if(!(await evaluate('CozyKart.controls().steer===-1&&CozyKart.controls().drift&&CozyKart.controls().throttle')))throw Error('Multitouch driving failed');
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});if(!(await evaluate('CozyKart.controls().steer===0&&!CozyKart.controls().drift')))throw Error('Touch release stuck');
  await evaluate('CozyKart.race.racers[0].item="boost"');await wait(80);const item=await evaluate(`(()=>{const r=document.getElementById('item').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...item,id:4}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(100);if(!(await evaluate('CozyKart.race.racers[0].boost>0&&!CozyKart.race.racers[0].item')))throw Error('Touch item failed');
  const layout=await evaluate(`(()=>{const ids=['hud','race-bottom','minimap','touch'];return ids.every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1;})})()`);if(!layout)throw Error('Mobile HUD outside viewport');
  const image=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,'kart-mobile.png'),Buffer.from(image.data,'base64'));console.log('PASS mobile 390x844 layout, simultaneous steering/drift/gas, release, and item use');
  await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:true});await wait(200);if(!(await evaluate('Math.abs(CozyKart.camera.aspect-844/390)<.01')))throw Error('Landscape resize failed');
  await evaluate('CozyKart.pause(); document.getElementById("choose").click()');if(!(await evaluate('CozyKart.race.mode==="menu"&&!!document.getElementById("start")')))throw Error('Return to menu failed');
  console.log('PASS landscape resize and track menu');
  await send('Page.navigate',{url:page.url.replace('cozy-kart.html','index.html')});await wait(700);
  const arcade=await evaluate(`(()=>{const buttons=[...document.querySelectorAll('[data-mode]')];if(buttons.length!==3||!document.querySelector('a[href="cozy-kart.html"]')||!document.querySelector('a[href="sky-hop.html"]'))throw Error('Navigation missing');for(const b of buttons){b.click();document.getElementById('play').click();if(!document.getElementById('overlay').classList.contains('hidden'))throw Error('Original mode failed');document.getElementById('menu').click();}return document.getElementById('cardTag').textContent})()`);if(!arcade.includes('Five'))throw Error('Mode count not updated');console.log('PASS all three existing 2D modes and both 3D menu links');
  await send('Page.navigate',{url:page.url.replace('cozy-kart.html','sky-hop.html')});await wait(800);if(!(await evaluate('SkyHop.renderer&&SkyHop.player&&SkyHop.state.mode==="menu"')))throw Error('Sky Hop regression');console.log('PASS existing Sky Garden Hop boots');
  await send('Page.navigate',{url:page.url});await wait(500);if(errors.length)throw Error(errors.join('\n'));console.log('PASS no browser runtime exceptions');
 }finally{ws.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});