(function(S){'use strict';
 // Positions are centers; spawn/checkpoint positions are at the player's feet.
 const platform=(id,x,y,z,w=4,d=4,props={})=>({id,type:'platform',position:[x,y,z],size:[w,1,d],properties:props});
 const entity=(id,type,position,size,properties={})=>({id,type,position,size,properties});
 S.levels=[
 {name:'Sunny Steps',spawn:[0,.5,0],hint:'Follow the pink hearts! Space jumps; Q swaps your buddy. Drag to look around.',checkpoints:[{id:'sun-arch',position:[0,2,24]}],goal:{position:[0,4,49]},entities:[
  platform('start',0,0,0,7,7,{rounded:true}),platform('step1',0,.3,6),platform('step2',3,.6,11),platform('step3',0,.9,16),
  entity('sun-moving','moving',[0,1.1,20],[3,1,3],{path:[0,0,2],speed:1.1}),platform('rest',0,1.5,24,7,6,{rounded:true}),
  platform('mushroom-home',0,1.8,30,5,5),entity('sun-bounce','bounce',[0,2.4,30],[1.6,.3,1.6],{power:13}),platform('high',0,4,35,5,5),platform('turn',3,3.6,40),platform('finish',0,3.5,47,7,7,{rounded:true}),
  ...[[0,1.5,6],[3,1.8,11],[0,2.1,16],[0,2.7,24],[0,5.2,35],[3,4.8,40],[0,4.7,47]].map((p,i)=>entity('sun-heart'+i,'heart',p,[.5,.5,.5])),entity('sun-honey','honey',[2,2.7,24],[.5,.5,.5])]},
 {name:'Honey Hill',spawn:[0,.5,0],hint:'Crumble tiles wait longer for Bubu. The mint plate opens a gate permanently. Hold Jump to glide!',checkpoints:[{id:'hill-arch',position:[0,1.5,20]}],goal:{position:[0,2,50]},entities:[
  platform('start',0,0,0,7,7,{rounded:true}),entity('crumble1','crumble',[0,.3,6],[3.5,1,3.5]),entity('crumble2','crumble',[2,.6,11],[3.5,1,3.5]),entity('crumble3','crumble',[0,.8,16],[3.5,1,3.5]),platform('plate-island',0,1,21,7,8),
  entity('light-plate','plate',[0,1.58,20],[1.5,.16,1.5],{targets:['hill-gate','lift'],latch:true}),entity('hill-gate','gate',[0,3,24],[7,4,.5]),
  entity('lift','lift',[0,-1,28],[4,1,4],{raisedY:1}),platform('gap-start',0,1,31,5,4),platform('gap-end',0,1,42,6,4),platform('finish',0,1.5,49,7,7,{rounded:true}),
  ...[[0,1.6,6],[2,1.8,11],[0,2,16],[0,2.3,21],[0,2.3,31],[0,3,37],[0,2.3,42],[0,2.7,49]].map((p,i)=>entity('hill-heart'+i,'heart',p,[.5,.5,.5])),entity('hill-honey','honey',[2,2.3,42],[.5,.5,.5])]},
 {name:'Together Tower',spawn:[0,.5,0],hint:'Dudu: push the crate straight ahead onto the gold plate. Bubu: double-jump the long gap. Dudu: smash the pink lid!',checkpoints:[{id:'tower-arch',position:[0,1.5,27]},{id:'top-arch',position:[0,1.5,35]}],goal:{position:[0,0,44]},entities:[
  platform('start',0,0,3,9,13,{rounded:true}),entity('crate','crate',[0,1.15,3],[1.3,1.3,1.3]),entity('heavy-plate','plate',[0,.58,6],[2,.16,2],{heavy:true,targets:['tower-gate','tower-lift']}),
  entity('tower-gate','gate',[0,2,9],[9,4,.5]),entity('tower-lift','lift',[0,-3,12],[5,1,5],{raisedY:.5}),platform('launch',0,1,16,5,4),platform('landing',0,1,27,7,4,{rounded:true}),platform('top',0,1,35,6,6),
  // A surrounding wall and solid lid make the pound mandatory; the flag is inside.
  entity('left-wall','platform',[-2.5,1.75,43],[1,3.5,9]),entity('right-wall','platform',[2.5,1.75,43],[1,3.5,9]),entity('back-wall','platform',[0,1.75,47],[6,3.5,1]),entity('front-wall','platform',[0,1.75,39],[6,3.5,1]),platform('floor',0,-.5,43,6,9),entity('tower-lid','cracked',[0,3,43],[4,1,7]),
  ...[[2,1.6,0],[0,2.5,3],[0,1.7,6],[0,2.2,16],[0,3,21],[0,2.2,27],[0,2.2,35],[0,4.5,43]].map((p,i)=>entity('tower-heart'+i,'heart',p,[.5,.5,.5])),entity('tower-honey','honey',[1,1,44],[.5,.5,.5])]}];
})(window.SkyHop);