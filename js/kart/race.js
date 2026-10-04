/* Pure, fixed-step arcade racing rules. No DOM, WebGL, network, or storage required. */
(function(K){'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 K.CONFIG=Object.freeze({laps:3,width:10,step:1/120,maxSpeed:23,acceleration:12,brake:25,coast:5,steerSpeed:7,driftTime:1.2});
 K.tracks=[
  {id:'garden',name:'Sunny Garden Circuit',description:'Gentle bends & picnic-day dreams',sky:'#dcedf3',ground:'#b7d39c',road:'#e5cbb1',accent:'#ef99b3',rx:66,rz:49,wave:4,hill:0,ai:19.3},
  {id:'honey',name:'Honey Hill Raceway',description:'Rolling hills & sticky little surprises',sky:'#f5e7c7',ground:'#c9cd8e',road:'#d8b17e',accent:'#e5ab4d',rx:61,rz:52,wave:12,hill:2.7,ai:19.8},
  {id:'moon',name:'Moonlight Love Lane',description:'Glowing gifts & winding night turns',sky:'#343652',ground:'#697e8d',road:'#9e91af',accent:'#e6a9d1',rx:58,rz:48,wave:17,hill:1.2,ai:20.3}
 ];
 K.itemNames={boost:'🍯 Honey Boost',shield:'♡ Heart Shield',cookie:'🍪 Cookie Trap'};
 K.createRace=function(track,length,kind,random=Math.random){
  const racers=[{name:kind==='bubu'?'Bubu':'Dudu',kind,player:true,color:kind==='bubu'?'#ef91af':'#e5ad5f'},
   {name:kind==='bubu'?'Dudu':'Bubu',kind:kind==='bubu'?'dudu':'bubu',color:kind==='bubu'?'#e5ad5f':'#ef91af'},
   {name:'Mint Buddy',kind:'bubu',color:'#83c8b3'},{name:'Berry Buddy',kind:'dudu',color:'#a59cd5'}];
  racers.forEach((r,i)=>Object.assign(r,{index:i,distance:-Math.floor(i/2)*3,speed:0,lane:i%2?1.7:-1.7,steer:0,drift:0,wasDrifting:false,boost:0,shield:0,stun:0,hitCooldown:0,item:null,finishTime:null,lap:1,aiTimer:2+i}));
  const boxes=[];for(const f of [.14,.38,.65,.85])for(const lane of [-2.8,0,2.8])boxes.push({s:length*f,lane,cooldown:0});
  const pads=[{s:length*.24,lane:-2.4},{s:length*.55,lane:2.4},{s:length*.92,lane:0}];
  const hazards=[];for(let i=0;i<(track.id==='garden'?3:6);i++)hazards.push({s:length*(.2+i*.105),lane:(i%3-1)*2.8});
  return {track,length,random,racers,boxes,pads,hazards,traps:[],mode:'countdown',countdown:3,time:0,events:[],rank:4};
 };
 K.wrap=(s,length)=>((s%length)+length)%length;
 K.gap=(a,b,length)=>{const d=Math.abs(K.wrap(a,length)-K.wrap(b,length));return Math.min(d,length-d);};
 K.ranking=race=>race.racers.slice().sort((a,b)=>a.finishTime!==null?(b.finishTime!==null?a.finishTime-b.finishTime:-1):b.finishTime!==null?1:b.distance-a.distance);
 K.hit=function(race,racer){
  if(racer.hitCooldown>0||racer.finishTime!==null)return false;
  if(racer.shield>0){racer.shield=0;racer.hitCooldown=1;race.events.push({type:'blocked',racer});return false;}
  racer.speed*=.45;racer.stun=.65;racer.hitCooldown=1.8;racer.drift=0;race.events.push({type:'hit',racer});return true;
 };
 K.useItem=function(race,racer){
  if(race.mode!=='racing'||!racer.item||racer.finishTime!==null)return false;
  const item=racer.item;racer.item=null;
  if(item==='boost')racer.boost=Math.max(racer.boost,2.3);
  if(item==='shield')racer.shield=8;
  if(item==='cookie')race.traps.push({s:K.wrap(racer.distance-3,race.length),lane:racer.lane,owner:racer.index,life:13});
  race.events.push({type:'use',racer,item});return true;
 };
 K.update=function(race,dt,input){
  if(race.mode==='countdown'){race.countdown-=dt;if(race.countdown<=0){race.mode='racing';race.countdown=0;race.events.push({type:'go'});}return;}
  if(race.mode!=='racing')return;
  const previousTime=race.time;race.time+=dt;
  race.boxes.forEach(b=>b.cooldown=Math.max(0,b.cooldown-dt));
  race.traps.forEach(t=>t.life-=dt);race.traps=race.traps.filter(t=>t.life>0);
  for(const r of race.racers){
   if(r.finishTime!==null)continue;
   for(const timer of ['boost','shield','stun','hitCooldown'])r[timer]=Math.max(0,r[timer]-dt);
   let steer,throttle,brake,drifting;
   if(r.player){steer=clamp(input.steer||0,-1,1);throttle=!!input.throttle;brake=!!input.brake;drifting=!!input.drift;if(input.use)K.useItem(race,r);}
   else{
    const ahead=race.hazards.concat(race.traps).find(h=>K.wrap(h.s-r.distance,race.length)<14&&Math.abs(h.lane-r.lane)<1.4);
    let target=Math.sin(r.distance*.025+r.index*2)*2.5;
    if(ahead)target=ahead.lane>0?-2.7:2.7;
    if(!r.item){const box=race.boxes.find(b=>b.cooldown<=0&&K.wrap(b.s-r.distance,race.length)<18);if(box&&!ahead)target=box.lane;}
    steer=clamp((target-r.lane)*.7,-1,1);throttle=true;brake=false;drifting=false;
    r.aiTimer-=dt;if(r.aiTimer<=0){if(r.item)K.useItem(race,r);r.aiTimer=2+race.random()*2;}
   }
   const onGrass=Math.abs(r.lane)>K.CONFIG.width/2-.6;
   const max=(r.player?K.CONFIG.maxSpeed:race.track.ai+r.index*.35)*(onGrass?.48:1)+(r.boost>0?11:0);
   r.speed=clamp(r.speed+(brake?-K.CONFIG.brake:throttle?K.CONFIG.acceleration:-K.CONFIG.coast)*dt,0,max);
   if(r.stun>0)r.speed=Math.min(r.speed,9);
   r.steer+=(steer-r.steer)*Math.min(1,dt*9);
   r.lane=clamp(r.lane+r.steer*K.CONFIG.steerSpeed*(.25+.75*r.speed/K.CONFIG.maxSpeed)*(drifting?.3:1)*dt,-6.8,6.8);
   const validDrift=drifting&&Math.abs(steer)>.15&&r.speed>12&&!onGrass&&r.stun===0;
   if(validDrift)r.drift=Math.min(2,r.drift+dt);
   if(r.wasDrifting&&!drifting){if(r.drift>=K.CONFIG.driftTime){r.boost=Math.max(r.boost,1.25);race.events.push({type:'drift',racer:r});}r.drift=0;}
   if(!validDrift&&!drifting)r.drift=0;
   r.wasDrifting=drifting;
   const old=r.distance;r.distance+=r.speed*dt;
   const lap=Math.min(K.CONFIG.laps,Math.floor(Math.max(0,r.distance)/race.length)+1);
   if(lap!==r.lap){r.lap=lap;race.events.push({type:'lap',racer:r});}
   if(r.distance>=race.length*K.CONFIG.laps){r.finishTime=previousTime+dt*(race.length*K.CONFIG.laps-old)/Math.max(.00001,r.distance-old);r.distance=race.length*K.CONFIG.laps;race.events.push({type:'finish',racer:r});continue;}
   for(const b of race.boxes)if(b.cooldown<=0&&!r.item&&K.gap(r.distance,b.s,race.length)<1.5&&Math.abs(r.lane-b.lane)<1){r.item=['boost','shield','cookie'][Math.min(2,Math.floor(race.random()*3))];b.cooldown=6;race.events.push({type:'pickup',racer:r,item:r.item});break;}
   for(const p of race.pads)if(K.gap(r.distance,p.s,race.length)<1.6&&Math.abs(r.lane-p.lane)<1.15)r.boost=Math.max(r.boost,.8);
   for(const h of race.hazards)if(K.gap(r.distance,h.s,race.length)<1.1&&Math.abs(r.lane-h.lane)<.95)K.hit(race,r);
   for(const t of race.traps)if(t.owner!==r.index&&t.life>0&&K.gap(r.distance,t.s,race.length)<1.2&&Math.abs(r.lane-t.lane)<1){K.hit(race,r);t.life=0;}
  }
  for(let i=0;i<race.racers.length;i++)for(let j=i+1;j<race.racers.length;j++){
   const a=race.racers[i],b=race.racers[j];if(a.finishTime!==null||b.finishTime!==null)continue;
   if(K.gap(a.distance,b.distance,race.length)<1.5&&Math.abs(a.lane-b.lane)<1.2){const direction=a.lane>=b.lane?1:-1;a.lane=clamp(a.lane+direction*dt*3,-6.8,6.8);b.lane=clamp(b.lane-direction*dt*3,-6.8,6.8);if(a.hitCooldown===0&&b.hitCooldown===0){a.speed*=.88;b.speed*=.88;a.hitCooldown=b.hitCooldown=.7;}}
  }
  const ranking=K.ranking(race);race.rank=ranking.findIndex(r=>r.player)+1;
  if(race.racers[0].finishTime!==null){race.mode='complete';race.events.push({type:'complete'});}
 };
})(globalThis.CozyKart=globalThis.CozyKart||{});