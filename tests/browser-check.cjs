/* No dependencies. Run with Node 22+ while Edge has remote debugging on 9222. */
const fs=require('node:fs');
async function main(){
 const pages=await(await fetch('http://localhost:9222/json/list')).json();const page=pages.find(p=>p.type==='page'&&p.url.endsWith('sky-hop.html'));if(!page)throw Error('Open sky-hop.html in the debugging browser first');
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));let id=0;const pending=new Map(),errors=[];
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 await send('Runtime.enable');
 async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 const result=await evaluate(`(()=>{
 const S=SkyHop,results=[];const assert=(v,m)=>{if(!v)throw Error(m);results.push(m);};
 assert(THREE.REVISION==='128','local Three.js r128 loaded from file');assert(S.renderer&&S.player.meshes,'WebGL game booted');
 const dt=S.CONFIG.fixedStep;function step(n){for(let i=0;i<n;i++){S.updateEntities(dt);S.player.update(dt);}};
 for(let level=0;level<3;level++)for(const kind of ['bubu','dudu']){S.start(level);S.player.kind=kind;step(10);assert(S.player.grounded,'level '+(level+1)+' '+kind+' spawn grounded');const spawn=S.state.checkpoint.slice();S.player.pos.y=-20;step(1);assert(S.state.deaths===1&&S.player.pos.distanceTo(new THREE.Vector3(...spawn))<.1,'level '+(level+1)+' '+kind+' fall respawn');
 const cp=S.entities.find(e=>e.type==='checkpoint');S.player.reset(cp.pos.toArray());S.physics.triggers(S.player);assert(S.state.checkpoint[2]===cp.pos.z,'level '+(level+1)+' '+kind+' checkpoint');S.respawn();assert(S.player.pos.z===cp.pos.z,'level '+(level+1)+' '+kind+' checkpoint respawn');}
 S.start(0);S.player.kind='dudu';S.player.reset([0,.54,0]);S.player.vel.y=-1;S.input.jump=true;step(12);assert(S.player.vel.y>0,'jump buffer fires after landing');S.player.reset([0,2,0]);S.player.kind='dudu';S.player.coyote=.08;S.input.jump=true;step(1);assert(S.player.vel.y>0,'coyote-time jump');
 S.start(1);const crumb=S.entities.find(e=>e.type==='crumble');S.player.reset([0,.8,6]);step(2);assert(crumb.triggered&&crumb.delay===2.2,'Bubu crumble delay');S.player.pos.x=20;for(let i=0;i<280;i++)S.updateEntities(dt);assert(!crumb.active,'crumbling island falls');for(let i=0;i<500;i++)S.updateEntities(dt);assert(crumb.active&&!crumb.triggered&&crumb.pos.y===crumb.home.y,'crumbling island respawns');
 S.start(0);step(10);S.input.jump=true;step(1);assert(S.player.vel.y>0,'Bubu first jump');S.input.jump=true;step(1);assert(S.player.jumps===2,'Bubu double jump');S.player.vel.y=-9;S.input.jumpHeld=true;step(1);assert(S.player.vel.y>=-S.CONFIG.glideFall,'Bubu glide fall cap');
 S.player.swap();assert(S.player.kind==='dudu'&&S.player.ghosts.bubu.visible,'air swap leaves nonblocking ghost');S.player.pos.y=4;S.input.pound=true;S.input.jump=true;step(1);assert(S.player.pounding,'Dudu ground pound');
 S.start(1);let plate=S.entities.find(e=>e.id==='light-plate');S.player.pos.set(plate.pos.x,1.5,plate.pos.z);S.player.grounded=true;S.updateEntities(dt);assert(plate.triggered,'light plate opens gate');S.player.pos.x=20;S.updateEntities(dt);assert(plate.triggered,'light plate latches');
 S.start(2);plate=S.entities.find(e=>e.id==='heavy-plate');S.player.pos.set(0,.5,6);S.player.kind='bubu';S.player.grounded=true;S.updateEntities(dt);assert(!plate.pressed,'Bubu cannot press heavy plate');S.player.kind='dudu';S.updateEntities(dt);assert(plate.pressed,'Dudu presses heavy plate');const crate=S.entities.find(e=>e.type==='crate');crate.pos.set(0,1.15,6);S.player.pos.x=4;S.updateEntities(dt);assert(plate.pressed,'crate keeps heavy plate pressed');
 const lid=S.entities.find(e=>e.type==='cracked');S.player.reset([0,3.55,43]);S.player.kind='dudu';S.player.pounding=true;S.player.vel.y=-23;S.physics.move(S.player,dt);assert(!lid.active,'ground pound breaks tower lid');
 S.start(0);const mushroom=S.entities.find(e=>e.type==='bounce');S.player.reset([0,mushroom.pos.y+.2,30]);S.player.kind='dudu';S.player.pounding=true;S.player.vel.y=-23;S.physics.triggers(S.player);assert(S.player.vel.y===18,'pounded mushroom boosts launch');
 const moving=S.entities.find(e=>e.type==='moving');S.player.reset([moving.pos.x,moving.pos.y+.5,moving.pos.z]);S.player.grounded=true;S.player.support=moving;const old=S.player.pos.z;step(1);assert(S.player.pos.z!==old,'player rides moving platform');
 // Test real fixed-step jump trajectories between island edges, not teleported goals.
 const originalAxes=S.input.axes;
 function hop(level,fromId,toId,kind,double=false,boost=0){
  S.start(level);S.player.kind=kind;const from=S.entities.find(e=>e.id===fromId),to=S.entities.find(e=>e.id===toId);
  if(level===1){S.entities.find(e=>e.type==='plate').triggered=true;for(let i=0;i<150;i++)S.updateEntities(dt);}
  if(level===2){const c=S.entities.find(e=>e.type==='crate');c.pos.set(0,1.15,6);for(let i=0;i<150;i++)S.updateEntities(dt);}
  // Freeze path motion during this reachability check; riding is tested separately.
  if(from.type==='moving')from.type='platform';if(to.type==='moving')to.type='platform';
  const dir=to.pos.clone().sub(from.pos);dir.y=0;dir.normalize();const start=from.pos.clone().addScaledVector(dir,Math.min(from.size.x,from.size.z)/2-.45);start.y=from.pos.y+from.size.y/2;
  S.player.reset(start.toArray());S.player.grounded=true;S.player.support=from;S.input.jump=!boost;if(boost){S.player.vel.y=boost;S.player.grounded=false;S.player.jumps=1;}
  const separation=Math.hypot(to.pos.x-from.pos.x,to.pos.z-from.pos.z);const close=separation<(Math.min(from.size.x,from.size.z)+Math.min(to.size.x,to.size.z))/2+.5;
  const target=close?to.pos.clone():to.pos.clone().addScaledVector(dir,-Math.min(to.size.x,to.size.z)/2+.55);
  S.input.axes=()=>{const dx=target.x-S.player.pos.x,dz=target.z-S.player.pos.z,n=Math.hypot(dx,dz);return n<.05?{x:0,y:0}:{x:-dx/Math.max(n,.4),y:-dz/Math.max(n,.4)};};
  let landed=false;for(let i=0;i<330;i++){if(double&&i===42)S.input.jump=true;step(1);if(S.player.grounded&&S.player.support===to){landed=true;break;}if(S.state.deaths)break;}
  S.input.axes=originalAxes;assert(landed,'route '+(level+1)+' '+kind+' '+fromId+' → '+toId+(double?' (double jump)':''));
 }
 for(const kind of ['bubu','dudu'])for(const pair of [['start','step1'],['step1','step2'],['step2','step3'],['step3','sun-moving'],['sun-moving','rest'],['rest','mushroom-home'],['high','turn'],['turn','finish']])hop(0,...pair,kind);
 for(const kind of ['bubu','dudu'])hop(0,'mushroom-home','high',kind,false,13);
 for(const kind of ['bubu','dudu'])for(const pair of [['start','crumble1'],['crumble1','crumble2'],['crumble2','crumble3'],['crumble3','plate-island'],['gap-end','finish']])hop(1,...pair,kind);
 for(const kind of ['bubu','dudu']){hop(1,'plate-island','lift',kind);hop(1,'lift','gap-start',kind);hop(2,'start','tower-lift',kind);hop(2,'tower-lift','launch',kind);}
 hop(1,'gap-start','gap-end','bubu',true);hop(2,'launch','landing','bubu',true);for(const kind of ['bubu','dudu'])hop(2,'landing','top',kind);hop(2,'top','tower-lid','bubu');
 S.start(2);S.player.reset([0,3.55,43]);S.player.kind='dudu';S.player.vel.y=-23;S.player.pounding=true;step(100);assert(S.state.mode==='complete','Dudu smashes lid and descends into enclosed goal');
 S.start(2);S.player.kind='dudu';S.player.reset([0,.5,1.9]);S.input.axes=()=>({x:0,y:-1});step(75);S.input.axes=originalAxes;assert(S.entities.find(e=>e.type==='crate').pos.z>5.1,'Dudu physically pushes crate onto heavy plate');
 for(let level=0;level<3;level++)for(const kind of ['bubu','dudu']){S.start(level);S.player.kind=kind;S.player.pos.set(...S.level.goal.position);S.physics.triggers(S.player);assert(S.state.mode==='complete','level '+(level+1)+' '+kind+' goal summary');}
 S.start(0);S.pause();assert(S.state.mode==='paused','pause overlay');S.pause();assert(S.state.mode==='playing','resume');return results;
 })()`);console.log(result.map(r=>'PASS '+r).join('\n'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Emulation.setTouchEmulationEnabled',{enabled:true});await evaluate('SkyHop.start(0)');await new Promise(r=>setTimeout(r,200));
 const touch=await evaluate(`(()=>{const j=document.getElementById('joystick').getBoundingClientRect(),b=document.getElementById('touch-jump').getBoundingClientRect();return {display:getComputedStyle(document.getElementById('touch')).display,j:{x:j.x+j.width/2,y:j.y+j.height/2},b:{x:b.x+b.width/2,y:b.y+b.height/2}}})()`);if(touch.display==='none')throw Error('Touch controls not visible');
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touch.j.x,y:touch.j.y,id:1}]});await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touch.j.x+28,y:touch.j.y,id:1}]});if(!(await evaluate('SkyHop.input.axes().x>.5')))throw Error('Joystick not responding');await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touch.b.x,y:touch.b.y,id:2}]});if(!(await evaluate('SkyHop.input.jumpHeld')))throw Error('Touch jump not responding');await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});console.log('PASS mobile 390x844 layout, real touch joystick and Jump');
 const swap=await evaluate(`(()=>{const r=document.getElementById('touch-swap').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...swap,id:3}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await new Promise(r=>setTimeout(r,100));if(!(await evaluate('SkyHop.player.kind==="dudu"')))throw Error('Touch swap failed');
 const yaw=await evaluate('SkyHop.cameraYaw');await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:150,y:280,id:4}]});await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y:280,id:4}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});if(await evaluate('SkyHop.cameraYaw')===yaw)throw Error('Touch orbit failed');console.log('PASS real touch Swap and camera orbit');
 await new Promise(r=>setTimeout(r,500));const image=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(require('node:path').join(__dirname,'mobile-check.png'),Buffer.from(image.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:true});await new Promise(r=>setTimeout(r,150));if(!(await evaluate('Math.abs(SkyHop.camera.aspect-844/390)<.01')))throw Error('Landscape resize failed');console.log('PASS mobile landscape resize');
 await send('Page.navigate',{url:page.url.replace('sky-hop.html','index.html')});await new Promise(r=>setTimeout(r,800));
  if(!(await evaluate('document.querySelectorAll(".mode-card").length===ArcadeModes.length&&ArcadeModes.every(m=>document.querySelector("[data-mode="+m.id+"]").getAttribute("href")===m.url)')))throw Error('Hub navigation missing');console.log('PASS catalog-driven hub navigation');
 await send('Page.navigate',{url:page.url});await new Promise(r=>setTimeout(r,500));
 if(errors.length)throw Error(errors.join('\n'));console.log('PASS no browser runtime exceptions');ws.close();
}
main().catch(e=>{console.error(e);process.exit(1);});