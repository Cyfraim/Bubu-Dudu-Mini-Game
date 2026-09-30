(function(S){'use strict';
 S.physics={
 overlap(p,e){const r=S.CONFIG.radius,h=S.CONFIG.height;return p.x+r>e.pos.x-e.size.x/2&&p.x-r<e.pos.x+e.size.x/2&&p.z+r>e.pos.z-e.size.z/2&&p.z-r<e.pos.z+e.size.z/2&&p.y+h>e.pos.y-e.size.y/2&&p.y<e.pos.y+e.size.y/2;},
 move(player,dt){const pos=player.pos,vel=player.vel,r=S.CONFIG.radius,h=S.CONFIG.height;player.grounded=false;player.support=null;
  for(const axis of ['x','z','y']){const old=pos[axis];pos[axis]+=vel[axis]*dt;
   for(const e of S.entities){if(!e.solid||!e.active||!this.overlap(pos,e))continue;
    if(axis!=='y'){
     if(e.type==='crate'&&player.kind==='dudu'){const shift=pos[axis]-old,trial=e.pos.clone();trial[axis]+=shift;const blocked=S.entities.some(o=>o!==e&&o.active&&o.solid&&Math.abs(trial.x-o.pos.x)<(e.size.x+o.size.x)/2-.01&&Math.abs(trial.z-o.pos.z)<(e.size.z+o.size.z)/2-.01&&trial.y+e.size.y/2>o.pos.y-o.size.y/2+.02&&trial.y-e.size.y/2<o.pos.y+o.size.y/2-.02);if(!blocked){e.pos.copy(trial);e.mesh.position.copy(e.pos);}}
     pos[axis]=vel[axis]>0?e.pos[axis]-e.size[axis]/2-r:e.pos[axis]+e.size[axis]/2+r;
    }else if(vel.y<=0&&old>=e.pos.y+e.size.y/2-.12){
     if(e.type==='cracked'&&player.pounding&&player.kind==='dudu'){e.active=false;e.mesh.visible=false;S.audio.play('break');S.sparkle(e.pos);continue;}
     pos.y=e.pos.y+e.size.y/2;vel.y=0;player.grounded=true;player.support=e;
     if(e.type==='crumble'&&!e.triggered){e.triggered=true;e.delay=player.kind==='bubu'?2.2:.7;e.timer=0;}
    }else if(vel.y>0){pos.y=e.pos.y-e.size.y/2-h;vel.y=0;}else{pos.y=old;vel.y=0;}
   }
  }
 },
 triggers(player){const p=player.pos;for(const e of S.entities){if(!e.active||e.solid)continue;const dx=Math.abs(p.x-e.pos.x),dz=Math.abs(p.z-e.pos.z),dy=p.y-e.pos.y;
  if((e.type==='heart'||e.type==='honey')&&Math.hypot(dx,dz)<.8&&dy>-1.8&&dy<.5){e.active=false;e.mesh.visible=false;S.state[e.type==='heart'?'hearts':'honey']++;S.audio.play(e.type);S.sparkle(e.pos);}
  if(e.type==='checkpoint'&&dx<1.2&&dz<1&&Math.abs(dy)<1&&!e.triggered){e.triggered=true;S.state.checkpoint=e.pos.toArray();S.audio.play('checkpoint');S.ui.toast('Checkpoint! A little flower hug ✿');}
  if(e.type==='goal'&&dx<1.3&&dz<1.3&&Math.abs(dy)<1.5)S.complete();
  if(e.type==='bounce'&&dx<.9&&dz<.9&&dy>=-.1&&dy<.55&&player.vel.y<=0){player.vel.y=player.pounding?18:(e.props.power||12);player.grounded=false;player.jumps=1;player.pounding=false;S.audio.play('jump',player.kind);}
 }}
 };
})(window.SkyHop);