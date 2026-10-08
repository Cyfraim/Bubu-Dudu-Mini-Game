/* Dependency-free Edge CDP tests. Open dash.html on debugging port 9333.
 * DASH_SOAK=1 additionally runs a real-time five-minute render/pool soak.
 */
'use strict';
const assert=require('node:assert/strict');
async function main(){
 const pages=await(await fetch('http://localhost:9333/json/list')).json(),page=pages.find(p=>p.type==='page'&&p.url.includes('dash.html'));assert(page,'Open dash.html in Edge on port 9333');
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));let id=0;const pending=new Map(),errors=[];
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(JSON.stringify(m.params.exceptionDetails));});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));}),wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 try{
  await send('Runtime.enable');await send('Page.enable');await send('Page.reload');await wait(1600);await evaluate(`document.querySelector('.product-modal:not([hidden]) button')?.click()`);
  console.log(await evaluate(`({mode:Dash.state.mode,renderer:!!Dash.renderer,error:document.getElementById('error').textContent})`));
  const results=await evaluate(`(()=>{
   const D=Dash,R=D.runner,C=D.CONFIG,check=(value,message)=>{if(!value)throw Error(message);out.push(message);},out=[];
   D.settings.muted=true;D.audio.sync();check(D.validateChunks().length===0,'12 chunk layouts and all boundary transitions pass fairness');
   const tick=n=>{for(let i=0;i<n;i++)D.step(C.fixedStep);};
   const clear=()=>{for(const key in D.entities.pools)for(const e of D.entities.pools[key].records)e.active=false;};
   D.start(123);const signature=D.track.chunks.filter(c=>c.active).map(c=>c.layout.name).join();D.start(123);check(signature===D.track.chunks.filter(c=>c.active).map(c=>c.layout.name).join(),'seeded chunk selection is reproducible');
   D.start();clear();R.jump();tick(20);const vy=R.vy;R.jump();tick(1);check(R.jumps===2&&R.vy>vy,'Bubu double jump');const y=R.y;R.swap();check(R.kind==='dudu'&&R.y===y,'mid-air swap preserves vertical state');R.jump();tick(1);check(R.jumps===2,'swap cannot reset jump budget');
   D.start();clear();R.swap();R.jump();tick(22);R.jump();tick(1);check(R.jumps===1,'Dudu has a single jump');D.input.down=true;R.jump();check(R.pound&&R.vy===-C.poundSpeed,'Dudu down+jump ground-pound');D.input.clear();
   D.start();clear();R.jump();tick(50);D.input.jumpHeld=true;const fall=R.vy;tick(10);check(R.glide>0&&R.vy>-3,'Bubu held-jump glide');D.input.clear();
   D.start();clear();R.swap();R.duck();D.entities.spawn('crate',0,D.state.distance+.1);D.entities.step(C.fixedStep);check(R.lives===3&&D.state.hearts===3,'Dudu ground slide smashes crates into bonus hearts');
   D.start();clear();D.entities.spawn('crate',0,.1);D.entities.step(C.fixedStep);check(R.lives===2&&D.state.hearts===0,'Bubu cannot smash crates');R.hit();check(R.lives===2,'post-hit invulnerability');
   D.start();clear();D.entities.spawn('narrow',0,.1);D.entities.step(C.fixedStep);check(R.lives===3,'Bubu fits narrow gaps');R.swap();D.entities.step(C.fixedStep);check(R.lives===2,'Dudu must avoid narrow gaps');
   D.start();clear();R.duck();D.entities.spawn('arch',0,.1);D.entities.step(C.fixedStep);check(R.lives===3,'sliding clears overhead arches');
   D.start();clear();D.entities.spawn('spring',0,.1);D.entities.step(C.fixedStep);check(R.vy===C.springVelocity,'spring launches runner');tick(35);check(R.y>.45,'spring clears short gap');
   D.start();clear();for(let i=0;i<15;i++)D.collect('heart',0,1);check(D.state.combo===5,'heart chain capped at x5');D.entities.spawn('heart',1,-2);D.entities.step(C.fixedStep);check(D.state.combo===1,'missed heart breaks combo');
   D.collect('gold',0,1);const points=D.state.points;D.entities.spawn('honey',1,.1);D.entities.step(C.fixedStep);check(D.state.hug===5&&D.state.points===points+50,'Hug doubles points and widens magnet');tick(601);check(D.state.hug===0,'Hug expires after five seconds');
   D.start();clear();R.invulnerable=0;R.hit();R.invulnerable=0;R.hit();R.invulnerable=0;R.hit();check(D.state.mode==='over'&&R.lives===0,'three hits end run');D.start();check(R.lives===3&&R.kind==='bubu'&&R.y===0&&R.slide===0&&R.invulnerable===0&&D.state.combo===1&&D.state.score===0&&D.state.hug===0,'restart / respawn resets all gameplay state');
   // Full five-minute simulated journeys: choose each authored clear corridor
   // only after the preceding chunk ends, using normal smooth lane physics.
   for(const lead of ['bubu','dudu']){D.start(765);if(lead==='dudu')R.swap();for(let i=0;i<36000;i++){for(const c of D.track.chunks)if(c.active&&D.state.distance>=c.start-6&&D.state.distance<c.start+C.chunkLength-6)R.lane=c.layout.safe;D.step(C.fixedStep);if(D.state.mode!=='playing')throw Error('Safe route failed for '+lead+' at '+D.state.distance);}check(R.lives===3&&D.state.distance>6000,lead+' leads a full five-minute simulated run without damage');}
   D.start();D.input.jumpHeld=true;D.pause();check(!D.input.jumpHeld&&D.state.mode==='paused','pause clears held inputs');D.pause();D.start();return out;
  })()`);console.log(results.map(x=>'PASS '+x).join('\n'));
  await evaluate('Dash.start();document.getElementById("garden").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'d',code:'KeyD'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'d',code:'KeyD'});assert.equal(await evaluate('Dash.runner.lane'),1);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'q',code:'KeyQ'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'q',code:'KeyQ'});assert.equal(await evaluate('Dash.runner.kind'),'dudu');
  await evaluate('document.querySelector("[data-setting=muted]").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'q',code:'KeyQ'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'q',code:'KeyQ'});assert.equal(await evaluate('Dash.runner.kind'),'dudu');console.log('PASS real keyboard lanes / swap and focused-button shortcut safety');
  await send('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:3,mobile:true});await send('Emulation.setTouchEmulationEnabled',{enabled:true});await wait(250);await evaluate('Dash.start()');
  const layout=await evaluate(`({fit:['hud','controls','settings'].every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.left>=0&&r.right<=360&&r.bottom<=800}),targets:Array.from(document.querySelectorAll('[data-action]')).every(b=>b.getBoundingClientRect().height>=44),dpr:Dash.renderer.getPixelRatio()})`);assert(layout.fit&&layout.targets&&layout.dpr===2,JSON.stringify(layout));
  async function touch(x,y,endX,endY){await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:endX,y:endY,id:1}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  await touch(150,450,155,450);assert.equal(await evaluate('Dash.runner.lane'),0,'tap must not swipe');await touch(150,450,240,450);assert.equal(await evaluate('Dash.runner.lane'),1,'right swipe');await touch(200,450,110,450);assert.equal(await evaluate('Dash.runner.lane'),0,'left swipe');await touch(180,460,180,380);await wait(100);assert(await evaluate('Dash.runner.y>0'),'up swipe jump');
  await evaluate('Dash.start()');await touch(180,380,180,460);assert(await evaluate('Dash.runner.slide>0'),'down swipe slide');
  const swap=await evaluate(`(()=>{const r=document.querySelector('[data-action="swap"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await touch(swap.x,swap.y,swap.x,swap.y);assert.equal(await evaluate('Dash.runner.kind'),'dudu');
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:160,y:400,id:1}]});await evaluate('Dash.pause()');assert(await evaluate('!Dash.canvas.hasPointerCapture(2)&&!Dash.input.jumpHeld'));await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});console.log('PASS 360px fit, 44px targets, DPR cap, real touch swipes, tap threshold, Swap, pause capture release');
  await send('Emulation.setDeviceMetricsOverride',{width:800,height:360,deviceScaleFactor:1,mobile:true});await wait(200);assert(await evaluate('Dash.camera.aspect>2'),'landscape resize');console.log('PASS orientation resize');
  const memory=await evaluate(`(()=>{const D=Dash,sample=()=>({geometries:D.renderer.info.memory.geometries,textures:D.renderer.info.memory.textures,programs:D.renderer.info.programs.length});D.start();D.track.draw();D.entities.draw();D.renderer.render(D.scene,D.camera);const before=sample();for(let i=0;i<20;i++){D.start();D.track.draw();D.entities.draw();D.renderer.render(D.scene,D.camera);}return {before,after:sample()};})()`);assert.deepEqual(memory.after,memory.before);console.log('PASS 20 restarts retain identical GPU resource counts',memory);
  if(process.env.DASH_SOAK==='1'){
   await send('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:2,mobile:true});
   await evaluate(`Dash.start(765);Dash.settings.muted=true;Dash.audio.sync();Dash.testOriginalStep=Dash.step;Dash.step=function(dt){for(let i=0;i<Dash.track.chunks.length;i++){const c=Dash.track.chunks[i];if(c.active&&Dash.state.distance>=c.start-6&&Dash.state.distance<c.start+Dash.CONFIG.chunkLength-6)Dash.runner.lane=c.layout.safe;}Dash.testOriginalStep(dt);};`);
   const samples=[];
   for(let minute=0;minute<=5;minute++){if(minute)await wait(60000);await send('HeapProfiler.collectGarbage');const sample=await evaluate(`({seconds:Dash.state.time,distance:Dash.state.distance,lives:Dash.runner.lives,heap:performance.memory.usedJSHeapSize,geometries:Dash.renderer.info.memory.geometries,textures:Dash.renderer.info.memory.textures,programs:Dash.renderer.info.programs.length,entities:Object.values(Dash.entities.pools).reduce((n,p)=>n+p.records.length,0),particles:Dash.entities.particles.length})`);samples.push(sample);console.log('SOAK '+minute+'m '+JSON.stringify(sample));}
   assert.equal(samples[5].lives,3);assert.equal(samples[5].geometries,samples[0].geometries);assert.equal(samples[5].entities,samples[0].entities);assert(samples[5].heap-samples[1].heap<2*1024*1024,'retained heap grows less than 2 MiB after warm-up');console.log('PASS real-time five-minute bounded-memory soak (not a physical-phone FPS benchmark)');await evaluate('Dash.step=Dash.testOriginalStep;delete Dash.testOriginalStep;Dash.pause()');
  }
  assert.equal(errors.length,0,errors.join('\n'));console.log('PASS no browser exceptions');
 }finally{ws.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});