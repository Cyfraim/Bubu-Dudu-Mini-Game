(function(S){
 'use strict';
 const keys=Object.create(null),captures=new Map();let joyId=null,rescueId=null,tap=0;const I=S.input={x:0,y:0,action:false,joyX:0,joyY:0};
 I.clear=function(){for(const k in keys)delete keys[k];for(const [id,el] of captures){try{if(el.hasPointerCapture(id))el.releasePointerCapture(id);}catch(e){}}captures.clear();joyId=rescueId=null;tap=0;I.x=I.y=I.joyX=I.joyY=0;I.action=false;const stick=document.getElementById('stick');if(stick)stick.style.transform='';};
 I.read=function(dt){I.x=I.joyX+(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);I.y=I.joyY+(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);const n=Math.hypot(I.x,I.y);if(n>1){I.x/=n;I.y/=n;}I.action=!!keys.KeyE||rescueId!==null||tap>0;tap=Math.max(0,tap-dt);};
 I.init=function(){const shortcuts=['Space','KeyR','KeyP','Escape','KeyM'],moves=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE'];
  window.addEventListener('keydown',e=>{if(e.ctrlKey||e.altKey||e.metaKey||e.target.closest('button,a,input,textarea,select'))return;if(!shortcuts.includes(e.code)&&!moves.includes(e.code))return;e.preventDefault();if(e.repeat)return;if(e.code==='KeyM'){S.ui.mute();return;}if(e.code==='KeyP'||e.code==='Escape'){S.pause();return;}if(S.state.mode!=='playing')return;S.audio.unlock();if(e.code==='Space')S.player.swap();else if(e.code==='KeyR')S.returnCheckpoint();else keys[e.code]=true;});
  window.addEventListener('keyup',e=>{delete keys[e.code];});window.addEventListener('blur',()=>{I.clear();if(S.state.mode==='playing')S.pause();});
  const joy=document.getElementById('joystick'),stick=document.getElementById('stick'),rescue=document.getElementById('rescue');
  function capture(el,e){try{el.setPointerCapture(e.pointerId);captures.set(e.pointerId,el);}catch(err){}}
  function point(e){const r=joy.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,n=Math.hypot(dx,dy),max=r.width*.32,f=n>max?max/n:1;I.joyX=dx*f/max;I.joyY=dy*f/max;stick.style.transform='translate('+dx*f+'px,'+dy*f+'px)';}
  joy.addEventListener('pointerdown',e=>{if(S.state.mode!=='playing'||joyId!==null)return;e.preventDefault();joyId=e.pointerId;capture(joy,e);point(e);S.audio.unlock();});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)point(e);});
  function release(e){captures.delete(e.pointerId);if(e.pointerId===joyId){joyId=null;I.joyX=I.joyY=0;stick.style.transform='';}if(e.pointerId===rescueId)rescueId=null;try{if(e.target.hasPointerCapture(e.pointerId))e.target.releasePointerCapture(e.pointerId);}catch(err){}}
  for(const el of [joy,rescue])for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,release);
  rescue.addEventListener('pointerdown',e=>{if(S.state.mode!=='playing')return;e.preventDefault();rescueId=e.pointerId;tap=S.CONFIG.rescueHold+S.CONFIG.toolHold+.2;capture(rescue,e);S.audio.unlock();});rescue.addEventListener('click',()=>{if(S.state.mode==='playing')tap=S.CONFIG.rescueHold+S.CONFIG.toolHold+.2;});
  document.getElementById('swap').onclick=()=>S.player.swap();document.getElementById('character').onclick=()=>S.player.swap();document.getElementById('checkpoint').onclick=S.returnCheckpoint;
 };
})(window.Rescue);