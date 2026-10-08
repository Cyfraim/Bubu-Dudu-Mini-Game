(function(D){'use strict';
 // All gameplay / rendering budgets live here. Physics stays on a straight axis.
 const CONFIG=D.CONFIG=Object.freeze({
  laneWidth:2.4,baseSpeed:10,maxSpeed:25,acceleration:.22,laneSlide:14,
  jumpVelocity:9.2,gravity:25,coyoteTime:.1,jumpBuffer:.1,jumpCooldown:.16,
  glideTime:.65,glideGravity:5,fastFall:17,poundSpeed:23,
  slideDuration:.7,slideCooldown:.85,invulnerability:1.65,lives:3,
  hugDuration:5,magnetRange:.8,hugMagnetRange:2.8,collisionRadius:.62,
  heartValue:10,honeyValue:25,smashHearts:3,comboEvery:3,maxCombo:5,
  chunkLength:36,spawnLookahead:180,recycleBehind:14,chunkMargin:8,
  tierDistance:650,biomeDistance:500,biomeTransition:85,springVelocity:12,
  fixedStep:1/120,maxStep:.05,maxPixelRatio:2,shadowMap:1024,
  entityCapacity:64,heartCapacity:192,particleCapacity:96,propCount:64,
  trackSegments:54,segmentLength:4,swipeThreshold:30,seed:20261006,
  debugFairness:true,uiInterval:.08,voiceLimit:3
 });
 D.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 D.state={mode:'menu',distance:0,points:0,score:0,chain:0,combo:1,hearts:0,hug:0,time:0,speed:CONFIG.baseSpeed,tier:0};
 D.settings={muted:false,voices:true,volume:.35};D.best=0;
 try{const saved=JSON.parse(localStorage.getItem('lovelyDashSettings'));if(saved){D.settings.muted=!!saved.muted;D.settings.voices=saved.voices!==false;D.settings.volume=Number.isFinite(saved.volume)?Math.max(0,Math.min(1,saved.volume)):.35;}D.best=Math.max(0,Number(localStorage.getItem('lovelyDashBest'))||0);}catch(e){}
 D.save=function(){try{localStorage.setItem('lovelyDashSettings',JSON.stringify(D.settings));localStorage.setItem('lovelyDashBest',String(D.best));}catch(e){}};
 let context=null;const voiceSlots=new Float64Array(CONFIG.voiceLimit);
 D.audio={
  unlock(){try{if(!context){context=new(window.AudioContext||window.webkitAudioContext)();VoiceManager.setAudioContext(context);}if(context.state==='suspended')context.resume().catch(function(){});VoiceManager.unlock();this.sync();}catch(e){}},
  sync(){VoiceManager.setMuted(D.settings.muted);VoiceManager.setVolume(D.settings.volume);if(VoiceManager.isOn()!==D.settings.voices)VoiceManager.toggle();},
  play(event){if(!context||D.settings.muted||!D.settings.voices)return;const now=performance.now();for(let i=0;i<voiceSlots.length;i++){if(voiceSlots[i]<=now){voiceSlots[i]=now+1100;VoiceManager.playBabble(D.runner.kind,event);return;}}},
  stop(){VoiceManager.stop();voiceSlots.fill(0);}
 };
 D.breakCombo=function(){D.state.chain=0;D.state.combo=1;};
 D.collect=function(type,x,y){const s=D.state,old=s.combo;if(type==='gold'){s.hug=CONFIG.hugDuration;D.audio.play('level');D.ui.toast('♡ Hug Mode · together is better!');}else{
  if(type==='heart'){s.hearts++;s.chain++;s.combo=Math.min(CONFIG.maxCombo,1+Math.floor(s.chain/CONFIG.comboEvery));}
  s.points+=(type==='honey'?CONFIG.honeyValue:CONFIG.heartValue)*s.combo*(s.hug>0?2:1);
  D.audio.play(s.combo>old?'combo':'catch');
 }D.entities.burst(x,y,0);};
 D.smash=function(x){for(let i=0;i<CONFIG.smashHearts;i++)D.collect('heart',x,1);};
 let raf=0,last=0,accumulator=0,uiClock=0;
 D.start=function(seed){D.audio.unlock();D.audio.stop();D.input.clear();
  Object.assign(D.state,{mode:'playing',distance:0,points:0,score:0,chain:0,combo:1,hearts:0,hug:0,time:0,speed:CONFIG.baseSpeed,tier:0});
  D.runner.reset();D.track.reset(seed===undefined?CONFIG.seed:seed);accumulator=0;last=0;uiClock=0;D.ui.mode();D.ui.toast('Sunny Meadow');D.canvas.focus();D.wake();
 };
 D.pause=function(){if(D.state.mode!=='playing'&&D.state.mode!=='paused')return;D.state.mode=D.state.mode==='playing'?'paused':'playing';D.input.clear();D.audio.stop();accumulator=0;last=0;D.ui.mode();if(D.state.mode==='playing')D.canvas.focus();};
 D.menu=function(){D.input.clear();D.audio.stop();D.runner.reset();D.state.mode='menu';D.state.hug=0;D.ui.mode();D.wake();};
 D.gameOver=function(){D.state.mode='over';D.input.clear();D.audio.stop();D.audio.play('gameOver');D.best=Math.max(D.best,Math.floor(D.state.score));D.save();D.ui.mode();};
 D.step=function(dt){const s=D.state;if(s.mode!=='playing')return;
  s.time+=dt;s.speed=Math.min(CONFIG.maxSpeed,CONFIG.baseSpeed+s.time*CONFIG.acceleration);s.distance+=s.speed*dt;s.hug=Math.max(0,s.hug-dt);
  s.score=s.distance+s.points;const tier=Math.min(2,Math.floor(s.distance/CONFIG.tierDistance));if(tier!==s.tier){s.tier=tier;D.audio.play('level');D.ui.toast('A little faster · keep together!');}
  D.runner.step(dt);D.track.step(dt);D.entities.step(dt);s.score=s.distance+s.points;
 };
 function frame(now){raf=0;if(document.hidden)return;const dt=last?Math.min(CONFIG.maxStep,(now-last)/1000):0;last=now;
  if(D.state.mode==='playing'){accumulator+=dt;while(accumulator>=CONFIG.fixedStep){D.step(CONFIG.fixedStep);accumulator-=CONFIG.fixedStep;}}
  D.track.draw(dt);D.runner.draw(dt);D.entities.draw();D.renderer.render(D.scene,D.camera);
  uiClock+=dt;if(uiClock>=CONFIG.uiInterval){D.ui.update(uiClock);uiClock=0;}raf=requestAnimationFrame(frame);
 }
 D.wake=function(){if(!raf&&!document.hidden){last=0;raf=requestAnimationFrame(frame);}};
 D.resize=function(){if(!D.renderer)return;const width=D.canvas.clientWidth,height=D.canvas.clientHeight;D.renderer.setPixelRatio(Math.min(CONFIG.maxPixelRatio,devicePixelRatio||1));D.renderer.setSize(width,height,false);D.camera.aspect=width/height;D.camera.fov=width<height?65:55;D.camera.updateProjectionMatrix();};
 function boot(){try{
  D.canvas=document.getElementById('garden');D.scene=new THREE.Scene();D.scene.fog=new THREE.Fog('#d9ebe1',30,160);
  D.renderer=new THREE.WebGLRenderer({canvas:D.canvas,alpha:true,antialias:false,powerPreference:'high-performance'});D.renderer.shadowMap.enabled=true;D.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  D.camera=new THREE.PerspectiveCamera(55,1,.1,230);D.camera.position.set(0,6.4,10.5);D.camera.lookAt(0,1,-14);
  D.scene.add(new THREE.HemisphereLight('#fff7e5','#91b5aa',.95));D.sun=new THREE.DirectionalLight('#fff3da',.8);D.sun.position.set(-6,14,3);D.sun.castShadow=true;D.sun.shadow.mapSize.set(CONFIG.shadowMap,CONFIG.shadowMap);D.sun.shadow.camera.left=-12;D.sun.shadow.camera.right=12;D.sun.shadow.camera.top=12;D.sun.shadow.camera.bottom=-12;D.sun.shadow.camera.far=40;D.sun.shadow.bias=-.001;D.scene.add(D.sun,D.sun.target);
  D.ui.init();D.runner.init();D.track.init();D.input.init();D.track.reset(CONFIG.seed);D.ui.mode();D.resize();D.wake();
  addEventListener('resize',D.resize);addEventListener('orientationchange',D.resize);
  addEventListener('blur',function(){D.input.clear();if(D.state.mode==='playing')D.pause();});
  document.addEventListener('visibilitychange',function(){if(document.hidden){if(D.state.mode==='playing')D.pause();D.input.clear();cancelAnimationFrame(raf);raf=0;last=0;}else D.wake();});
  D.canvas.addEventListener('webglcontextlost',function(e){e.preventDefault();if(D.state.mode==='playing')D.pause();document.getElementById('error').hidden=false;document.getElementById('error').textContent='The garden graphics paused. Reload this page to restore them.';});
 }catch(e){document.getElementById('error').hidden=false;document.getElementById('error').textContent='This garden needs WebGL. Please try a browser with hardware acceleration enabled. '+e.message;console.error(e);}}
 document.addEventListener('DOMContentLoaded',boot);
})(window.Dash=window.Dash||{});