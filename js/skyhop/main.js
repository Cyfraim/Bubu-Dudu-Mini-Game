/* Loaded first: all tweakable gameplay constants live here. No module fetches. */
(function(S){
 'use strict';
 S.CONFIG=Object.freeze({gravity:22,moveSpeed:5.4,jumpVelocity:8.5,bubuJump:9.5,doubleJump:9,glideFall:3.2,duduFall:24,groundPound:23,coyoteTime:.1,jumpBuffer:.1,cameraDistance:9,cameraHeight:5,fixedStep:1/120,maxDelta:.05,radius:.34,height:1.65,fallZone:-12});
 S.state={mode:'menu',level:0,time:0,deaths:0,hearts:0,honey:0,checkpoint:null};
 S.reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 S.best={};try{S.best=JSON.parse(localStorage.getItem('skyHopBest')||'{}')||{};}catch(e){}
 S.start=function(index){
  S.input.clear();S.loadLevel(index);Object.assign(S.state,{mode:'playing',level:index,time:0,deaths:0,hearts:0,honey:0,checkpoint:S.level.spawn.slice()});
  S.player.kind='bubu';S.player.reset(S.level.spawn);S.cameraYaw=Math.PI;S.cameraPitch=.48;S.ui.hide();S.ui.toast(S.level.hint,7);S.audio.unlock();
 };
 S.pause=function(){if(S.state.mode==='playing'){S.state.mode='paused';S.input.clear();S.ui.pause();}else if(S.state.mode==='paused'){S.state.mode='playing';S.ui.hide();}};
 S.respawn=function(){if(S.state.mode!=='playing')return;S.state.deaths++;S.input.clear();S.player.reset(S.state.checkpoint);S.ui.fade();S.audio.play('respawn');S.ui.toast('A soft landing. Try again ♡');};
 S.complete=function(){if(S.state.mode!=='playing')return;S.state.mode='complete';S.input.clear();const key=S.state.level,old=S.best[key]||{};S.best[key]={time:Math.min(old.time||Infinity,S.state.time),hearts:Math.max(old.hearts||0,S.state.hearts)};try{localStorage.setItem('skyHopBest',JSON.stringify(S.best));}catch(e){}S.audio.play('complete');S.ui.summary();};
 S.boot=function(){
  try{
   S.renderer=new THREE.WebGLRenderer({canvas:document.getElementById('world'),antialias:true,alpha:true});
   S.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));S.renderer.shadowMap.enabled=true;S.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
   S.scene=new THREE.Scene();S.scene.fog=new THREE.Fog('#e3edf2',25,85);S.camera=new THREE.PerspectiveCamera(55,1,.1,150);
   S.scene.add(new THREE.HemisphereLight('#fff9ee','#9daeb4',.85));const sun=new THREE.DirectionalLight('#fff6df',.85);sun.position.set(-12,24,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;sun.shadow.bias=-.001;S.scene.add(sun);S.sun=sun;S.scene.add(sun.target);
   S.cameraYaw=Math.PI;S.cameraPitch=.48;S.input.init();S.ui.init();S.player.create();S.loadLevel(0);S.player.reset(S.level.spawn);S.ui.menu();
   const resize=()=>{S.renderer.setSize(innerWidth,innerHeight,false);S.camera.aspect=innerWidth/innerHeight;S.camera.updateProjectionMatrix();};window.addEventListener('resize',resize);window.addEventListener('orientationchange',resize);resize();
   document.addEventListener('visibilitychange',()=>{if(document.hidden&&S.state.mode==='playing')S.pause();});
   let last=performance.now(),acc=0;function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,S.CONFIG.maxDelta);last=now;if(S.state.mode==='playing'){acc+=dt;while(acc>=S.CONFIG.fixedStep){S.updateEntities(S.CONFIG.fixedStep);S.player.update(S.CONFIG.fixedStep);S.state.time+=S.CONFIG.fixedStep;acc-=S.CONFIG.fixedStep;if(S.state.mode!=='playing')break;}}else acc=0;S.visualTime=(S.visualTime||0)+dt;S.animateEntities(dt);S.player.animate(dt);S.followCamera(dt);S.ui.update(dt);S.renderer.render(S.scene,S.camera);}requestAnimationFrame(frame);
  }catch(e){console.error(e);document.getElementById('panel').innerHTML='<h2>The garden could not open</h2><p>Enable WebGL in your browser and reopen this page.</p><a href="index.html">Back to Arcade</a>';}
 };
 // Raycast every solid (including moving gates/crates); retract before a wall.
 S.followCamera=function(dt){const p=S.player.pos,target=new THREE.Vector3(p.x,p.y+1,p.z);const distance=S.CONFIG.cameraDistance;const offset=new THREE.Vector3(Math.sin(S.cameraYaw)*Math.cos(S.cameraPitch)*distance,Math.sin(S.cameraPitch)*distance+S.CONFIG.cameraHeight-4,Math.cos(S.cameraYaw)*Math.cos(S.cameraPitch)*distance);const ray=new THREE.Raycaster(target,offset.clone().normalize(),0,offset.length());const hits=ray.intersectObjects(S.entities.filter(e=>e.solid&&e.active).map(e=>e.mesh),true);if(hits.length)offset.setLength(Math.max(.45,hits[0].distance-.45));const wanted=target.clone().add(offset);S.camera.position.lerp(wanted,1-Math.exp(-9*dt));const segment=S.camera.position.clone().sub(target);ray.set(target,segment.clone().normalize());ray.far=segment.length();const obstruction=ray.intersectObjects(S.entities.filter(e=>e.solid&&e.active).map(e=>e.mesh),true);if(obstruction.length)S.camera.position.copy(target).add(segment.setLength(Math.max(.25,obstruction[0].distance-.3)));S.camera.lookAt(target);S.sun.position.set(p.x-12,p.y+24,p.z+10);S.sun.target.position.copy(target);};
})(window.SkyHop=window.SkyHop||{});