(function(D){'use strict';
 // [type, lane (-1..1), local distance, pickup height]. The named clear
 // corridor is safe for BOTH leads without an ability. Eight-unit entry/exit
 // aprons allow even a two-lane change at maximum speed between any chunks.
 D.chunks=[
  [
   {name:'First flowers',safe:0,items:[['puddle',-1,12],['fence',1,24],['heart',0,10],['heart',0,15],['heart',0,20],['honey',0,26]]},
   {name:'Little orchard',safe:-1,items:[['crate',0,12],['branch',1,24],['heart',-1,10],['heart',-1,16],['heart',-1,22],['gold',-1,27]]},
   {name:'Panda gate',safe:1,items:[['narrow',0,14],['thorn',-1,26],['heart',1,10],['heart',1,16],['heart',1,22],['heart',0,14]]},
   {name:'Spring picnic',safe:0,items:[['spring',-1,10],['gap',-1,14],['heart',-1,14,2.4],['heart',-1,18,2.8],['rock',1,25],['heart',0,12],['heart',0,19],['honey',0,26]]}
  ],
  [
   {name:'Honey steps',safe:-1,items:[['fence',0,10],['arch',1,22],['crate',0,27],['heart',-1,10],['heart',-1,15],['heart',-1,20],['honey',-1,26],['heart',0,11,2.2]]},
   {name:'Pink windows',safe:1,items:[['narrow',0,12],['branch',-1,24],['rock',0,26],['heart',1,10],['heart',1,16],['heart',1,22],['gold',1,27]]},
   {name:'Petal puddles',safe:0,items:[['puddle',-1,10],['thorn',1,16],['fence',-1,26],['heart',0,10],['heart',0,15],['heart',0,20],['honey',0,26]]},
   {name:'Mushroom post',safe:-1,items:[['spring',1,10],['gap',1,14],['heart',1,15,2.5],['heart',1,19,2.6],['crate',0,26],['heart',-1,11],['heart',-1,17],['heart',-1,23]]}
  ],
  [
   {name:'Starlight arches',safe:1,items:[['arch',0,10],['thorn',-1,10],['crate',0,26],['branch',-1,26],['heart',1,10],['heart',1,15],['heart',1,20],['gold',1,26]]},
   {name:'Moonlit gates',safe:0,items:[['narrow',-1,10],['rock',1,10],['fence',-1,26],['puddle',1,26],['heart',0,10],['heart',0,15],['heart',0,20],['honey',0,26]]},
   {name:'Bear necessities',safe:-1,items:[['crate',0,10],['rock',1,14],['arch',0,26],['thorn',1,26],['heart',-1,10],['heart',-1,15],['heart',-1,20],['honey',-1,26]]},
   {name:'Wish upon a spring',safe:1,items:[['spring',-1,10],['gap',-1,14],['heart',-1,15,2.6],['heart',-1,19,2.8],['narrow',0,12],['branch',0,27],['heart',1,10],['heart',1,16],['heart',1,22],['gold',1,27]]}
  ]
 ];
 D.validateChunks=function(){const errors=[],C=D.CONFIG,harmless=['heart','honey','gold','spring'];
  for(let t=0;t<D.chunks.length;t++)for(const chunk of D.chunks[t]){
   if(![-1,0,1].includes(chunk.safe))errors.push(chunk.name+': missing clear corridor');
   for(const e of chunk.items){if(!D.definitions[e[0]]||![-1,0,1].includes(e[1])||e[2]<C.chunkMargin||e[2]>C.chunkLength-C.chunkMargin)errors.push(chunk.name+': invalid entity / apron');
    if(!harmless.includes(e[0])&&e[1]===chunk.safe)errors.push(chunk.name+': obstructed safe lane');
    if(e[0]==='gap'&&!chunk.items.some(s=>s[0]==='spring'&&s[1]===e[1]&&e[2]-s[2]>=3&&e[2]-s[2]<=5))errors.push(chunk.name+': gap without spring');
   }
  }
  // Worst-case travel to within collision clearance of the opposite lane.
  const transition=Math.log(2*C.laneWidth/C.collisionRadius)/C.laneSlide;
  if(2*C.chunkMargin/C.maxSpeed<transition+.2)errors.push('Chunk boundaries do not allow a safe lane transition');
  if(C.debugFairness){if(errors.length)console.error('Dash fairness failures:',errors);else console.info('Dash fairness: all 12 layouts and all tier boundaries pass for both leads.');}return errors;
 };
})(window.Dash);