(function(D){'use strict';const held=Object.create(null),canvasPointers=new Map(),buttonPointers=new Map();
 const I=D.input={jumpHeld:false,down:false,
  action(name){D.audio.unlock();if(name==='pause'){D.pause();return;}if(name==='mute'){D.ui.mute();return;}if(D.state.mode!=='playing')return;const R=D.runner;if(name==='left')R.laneMove(-1);else if(name==='right')R.laneMove(1);else if(name==='jump')R.jump();else if(name==='slide')R.duck();else if(name==='swap')R.swap();},
  clear(){for(const key in held)delete held[key];this.jumpHeld=false;this.down=false;canvasPointers.forEach(function(p,id){if(D.canvas.hasPointerCapture(id))D.canvas.releasePointerCapture(id);});canvasPointers.clear();buttonPointers.forEach(function(b,id){if(b.hasPointerCapture(id))b.releasePointerCapture(id);});buttonPointers.clear();},
  init(){const map={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump',ArrowDown:'slide',KeyS:'slide',KeyQ:'swap',Tab:'swap',KeyP:'pause',Escape:'pause',KeyM:'mute'};
   addEventListener('keydown',function(e){if(e.target.closest('button,input,select,textarea,a,summary,[contenteditable]'))return;const action=map[e.code];if(!action||e.ctrlKey||e.altKey||e.metaKey)return;e.preventDefault();if(held[e.code]||e.repeat)return;held[e.code]=true;I.jumpHeld=!!(held.Space||held.KeyW||held.ArrowUp);I.down=!!(held.KeyS||held.ArrowDown);I.action(action);});
   addEventListener('keyup',function(e){delete held[e.code];I.jumpHeld=!!(held.Space||held.KeyW||held.ArrowUp);I.down=!!(held.KeyS||held.ArrowDown);});
   document.addEventListener('pointerdown',function(){D.audio.unlock();},{once:true});
   D.canvas.addEventListener('pointerdown',function(e){if(D.state.mode!=='playing'||canvasPointers.size)return;D.canvas.focus();canvasPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});D.canvas.setPointerCapture(e.pointerId);});
   D.canvas.addEventListener('pointerup',function(e){const p=canvasPointers.get(e.pointerId);if(!p)return;const x=e.clientX-p.x,y=e.clientY-p.y;canvasPointers.delete(e.pointerId);if(D.canvas.hasPointerCapture(e.pointerId))D.canvas.releasePointerCapture(e.pointerId);if(Math.max(Math.abs(x),Math.abs(y))<D.CONFIG.swipeThreshold)return;I.action(Math.abs(x)>Math.abs(y)?(x<0?'left':'right'):(y<0?'jump':'slide'));});
   function cancel(e){canvasPointers.delete(e.pointerId);}
   D.canvas.addEventListener('pointercancel',cancel);D.canvas.addEventListener('lostpointercapture',cancel);
   document.querySelectorAll('[data-action]').forEach(function(b){b.addEventListener('pointerdown',function(e){e.preventDefault();if(D.state.mode!=='playing')return;buttonPointers.set(e.pointerId,b);b.setPointerCapture(e.pointerId);if(b.dataset.action==='jump')I.jumpHeld=true;if(b.dataset.action==='slide')I.down=true;I.action(b.dataset.action);});
    function release(e){buttonPointers.delete(e.pointerId);if(b.hasPointerCapture(e.pointerId))b.releasePointerCapture(e.pointerId);if(b.dataset.action==='jump')I.jumpHeld=false;if(b.dataset.action==='slide')I.down=false;D.canvas.focus();}
    b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',function(e){buttonPointers.delete(e.pointerId);if(b.dataset.action==='jump')I.jumpHeld=false;if(b.dataset.action==='slide')I.down=false;});b.addEventListener('click',function(e){if(e.detail===0)I.action(b.dataset.action);});
   });
  }
 };
})(window.Dash);