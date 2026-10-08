(function(D){'use strict';const C=D.CONFIG;
 const R=D.runner={kind:'bubu',lane:0,x:0,y:0,vy:0,lives:C.lives,jumps:0,slide:0,slideReady:0,jumpReady:0,invulnerable:0,buffer:0,coyote:C.coyoteTime,glide:0,pound:false,impact:0,models:[],positions:new Float32Array(2),
  init(){this.models.push(D.character('bubu'),D.character('dudu'));for(let i=0;i<2;i++){const m=this.models[i];m.rotation.y=Math.PI;D.scene.add(m);}this.reset();},
  reset(){this.kind='bubu';this.lane=0;this.x=0;this.y=0;this.vy=0;this.lives=C.lives;this.jumps=0;this.slide=0;this.slideReady=0;this.jumpReady=0;this.invulnerable=0;this.buffer=0;this.coyote=C.coyoteTime;this.glide=0;this.pound=false;this.impact=0;this.positions[0]=0;this.positions[1]=1.15;},
  laneMove(direction){this.lane=Math.max(-1,Math.min(1,this.lane+direction));},
  swap(){this.kind=this.kind==='bubu'?'dudu':'bubu';if(this.kind==='bubu')this.pound=false;D.entities.burst(this.x,this.y+1,0);},
  jump(){this.buffer=C.jumpBuffer;if(this.kind==='dudu'&&this.y>0&&D.input.down){this.pound=true;this.vy=-C.poundSpeed;this.buffer=0;}},
  duck(){if(this.y>0){this.vy=-C.fastFall;if(this.kind==='dudu'&&D.input.jumpHeld){this.pound=true;this.vy=-C.poundSpeed;}}else if(this.slideReady<=0){this.slide=C.slideDuration;this.slideReady=C.slideCooldown;}},
  hit(){if(this.invulnerable>0)return;this.lives--;this.invulnerable=C.invulnerability;D.breakCombo();D.audio.play('lostHeart');D.ui.flash();if(this.lives<=0)D.gameOver();},
  step(dt){this.x+=(this.lane*C.laneWidth-this.x)*Math.min(1,C.laneSlide*dt);this.invulnerable=Math.max(0,this.invulnerable-dt);this.slide=Math.max(0,this.slide-dt);this.slideReady=Math.max(0,this.slideReady-dt);this.jumpReady=Math.max(0,this.jumpReady-dt);this.impact=Math.max(0,this.impact-dt*4);
   if(this.y===0)this.coyote=C.coyoteTime;else this.coyote=Math.max(0,this.coyote-dt);
   if(this.buffer>0&&this.jumpReady===0&&(this.coyote>0||(this.kind==='bubu'&&this.jumps<2))){this.vy=C.jumpVelocity;this.jumps++;this.buffer=0;this.slide=0;this.pound=false;this.coyote=0;this.jumpReady=C.jumpCooldown;}
   this.buffer=Math.max(0,this.buffer-dt);
   if(this.y>0||this.vy>0){let gravity=C.gravity;if(this.kind==='bubu'&&D.input.jumpHeld&&this.vy<0&&this.glide<C.glideTime){gravity=C.glideGravity;this.glide+=dt;this.vy=Math.max(this.vy,-2.2);}this.vy-=gravity*dt;this.y+=this.vy*dt;if(this.y<=0){this.y=0;this.vy=0;this.jumps=0;this.glide=0;this.impact=1;/* Pound survives the landing collision tick. */}}
  },
  draw(dt){const s=D.state,menu=s.mode==='menu',time=s.time;
   for(let i=0;i<2;i++){const m=this.models[i],lead=(i===0)===(this.kind==='bubu'),target=lead?0:1.15;this.positions[i]+=(target-this.positions[i])*Math.min(1,dt*12);
    const z=menu?1:(s.hug>0?0:this.positions[i]),x=menu?(i===0?-1:1):this.x+(s.hug>0?(i===0?-.58:.58):0);
    m.position.set(x,this.y,z);m.rotation.y=menu?.25:Math.PI+(s.hug>0?(i===0?.12:-.12):0);m.visible=this.invulnerable<=0||Math.floor(this.invulnerable*14)%2===0;
    const impact=this.impact,duck=this.slide>0?.48:1,stretch=this.y>0&&this.vy>0?1.09:1;
    m.scale.set(1+impact*.16,duck*stretch*(1-impact*.2),1+impact*.1);m.userData.head.rotation.z=D.reduced?0:Math.sin(time*9+i)*.035;
    if(!D.reduced&&this.y===0&&s.mode==='playing')m.position.y+=Math.abs(Math.sin(time*12+i))*.055;
    const blink=time%4.7>4.56;for(let e=0;e<m.userData.eyes.length;e++)m.userData.eyes[e].scale.y=blink?.009:.055;
   }
  }
 };
})(window.Dash);