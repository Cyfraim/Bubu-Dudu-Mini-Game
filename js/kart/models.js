(function(K){'use strict';
 const box=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,12,8),wheel=new THREE.CylinderGeometry(.32,.32,.23,12),materials={};
 function material(color){return materials[color]||(materials[color]=new THREE.MeshLambertMaterial({color}));}
 function part(parent,geometry,color,x,y,z,sx,sy,sz){const m=new THREE.Mesh(geometry,material(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
 function raw(track,t){const a=t*Math.PI*2;return new THREE.Vector3(Math.sin(a)*(track.rx+Math.sin(a*3)*track.wave),track.hill*(1-Math.cos(a*2)),Math.cos(a)*track.rz);}
 K.makePath=function(track){
  const points=[],distances=[0],segments=720;let length=0;
  for(let i=0;i<=segments;i++){points.push(raw(track,i/segments));if(i){length+=points[i].distanceTo(points[i-1]);distances.push(length);}}
  return {length,points,at(s,lane=0){s=K.wrap(s,length);let lo=0,hi=segments;while(lo+1<hi){const mid=(lo+hi)>>1;if(distances[mid]<=s)lo=mid;else hi=mid;}const f=(s-distances[lo])/(distances[lo+1]-distances[lo]);const center=points[lo].clone().lerp(points[lo+1],f),forward=points[lo+1].clone().sub(points[lo]).normalize(),right=new THREE.Vector3(forward.z,0,-forward.x).normalize();return {position:center.addScaledVector(right,lane),forward,right};}};
 };
 function ribbon(path,width,color,height){const positions=[],indices=[],n=360;
  for(let i=0;i<=n;i++){for(const side of [-1,1]){const p=path.at(i/n*path.length,side*width/2).position;positions.push(p.x,p.y+height,p.z);}if(i<n){const v=i*2;indices.push(v,v+1,v+2,v+1,v+3,v+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color,side:THREE.DoubleSide}));m.userData.owned=true;return m;
 }
 K.place=function(mesh,path,s,lane,height=0){const f=path.at(s,lane);mesh.position.copy(f.position);mesh.position.y+=height;mesh.rotation.y=Math.atan2(f.forward.x,f.forward.z);return f;};
 K.buildWorld=function(track){
  if(K.world){K.world.traverse(m=>{if(m.userData.owned){m.geometry.dispose();m.material.dispose();}});K.scene.remove(K.world);}
  const root=K.world=new THREE.Group(),path=K.path=K.makePath(track);K.scene.add(root);
  K.scene.background=new THREE.Color(track.sky);K.scene.fog=new THREE.Fog(track.sky,85,230);
  part(root,box,track.ground,0,-1.1,0,400,2,400);
  root.add(ribbon(path,13,track.accent,.012),ribbon(path,10,track.road,.035));
  for(let i=0;i<110;i++){
   const s=i/110*path.length;const line=new THREE.Group();part(line,box,'#fff8e8',0,0,0,.18,.035,1.25);K.place(line,path,s,0,.07);root.add(line);
   for(const side of [-1,1]){const curb=new THREE.Group();part(curb,box,i%2?'#fff8e8':track.accent,0,0,0,.6,.13,path.length/110*.8);K.place(curb,path,s,side*5.25,.08);root.add(curb);}
   if(i%2===0){const tree=new THREE.Group(),scale=.8+(i%5)*.18;part(tree,box,'#aa8060',0,1,0,.5,2,.5);part(tree,sphere,track.id==='moon'?'#8196b1':i%3?'#8abf92':'#e9b4bf',0,3,0,1.7,1.9,1.7);tree.scale.setScalar(scale);const p=path.at(s,(i%4<2?-1:1)*(10+i%7*2));tree.position.copy(p.position);root.add(tree);}
   if(i%3===0){for(const side of [-1,1]){const flower=new THREE.Group();part(flower,box,'#6c9c79',0,.4,0,.12,.8,.12);part(flower,sphere,i%2?'#f8db8b':'#f2afc6',0,.9,0,.4,.25,.4);K.place(flower,path,s,side*7.4);root.add(flower);}}
  }
  for(let i=0;i<12;i++){const hill=new THREE.Group();part(hill,sphere,track.id==='moon'?'#596a88':'#a3c788',0,0,0,16,8,16);const a=i/12*Math.PI*2;hill.position.set(Math.sin(a)*130,0,Math.cos(a)*110);root.add(hill);}
  const start=new THREE.Group();for(let x=0;x<10;x++)for(let z=0;z<2;z++)part(start,box,(x+z)%2?'#fff8ec':'#695867',x-4.5,.09,z-.5,1,.05,1);K.place(start,path,0,0,.06);root.add(start);
  const arch=new THREE.Group();for(const x of [-6.8,6.8])part(arch,box,'#fff1da',x,3,0,.45,6,.45);part(arch,box,track.accent,0,5.8,0,14,.85,.5);for(let i=0;i<9;i++)part(arch,box,i%2?'#fff7ea':'#795269',i*1.25-5,5.8,.28,.7,.45,.03);K.place(arch,path,0);root.add(arch);
  K.dynamic=new THREE.Group();root.add(K.dynamic);K.decorations={boxes:[],pads:[],hazards:[],traps:[]};
 };
 K.makeKart=function(racer){
  const root=new THREE.Group();part(root,box,racer.color,0,.55,0,1.35,.5,1.8);part(root,box,'#fff2d8',0,.62,1,.9,.22,.3);part(root,box,racer.color,0,.8,-.85,1.8,.16,.3);part(root,box,'#55414d',0,.68,0,.65,.2,.7);
  const wheels=[];for(const x of [-.8,.8])for(const z of [-.6,.65]){const w=part(root,wheel,'#493d49',x,.32,z,1,1,1);w.rotation.z=Math.PI/2;wheels.push(w);part(root,sphere,'#fff0d7',x*1.12,.32,z,.13,.16,.16);}
  const buddy=SkyHop.character(racer.kind);buddy.scale.setScalar(.72);buddy.position.set(0,.63,-.1);root.add(buddy);
  const shield=new THREE.Mesh(new THREE.SphereGeometry(1.45,16,12),new THREE.MeshBasicMaterial({color:'#f6c1de',wireframe:true,transparent:true,opacity:.35}));shield.position.y=.95;shield.visible=false;root.add(shield);shield.userData.owned=true;
  root.userData={...root.userData,wheels,buddy,shield};K.dynamic.add(root);return root;
 };
 K.addRaceModels=function(race){
  K.karts=race.racers.map(K.makeKart);
  for(const b of race.boxes){const m=new THREE.Group();part(m,box,'#f5bfda',0,0,0,.85,.85,.85);for(const z of [-.44,.44])part(m,box,'#fff5dc',0,0,z,.2,.86,.02);K.place(m,K.path,b.s,b.lane,1.1);K.dynamic.add(m);K.decorations.boxes.push(m);}
  for(const p of race.pads){const m=new THREE.Group();part(m,box,'#91d7cc',0,0,0,2,.055,3);for(let i=0;i<3;i++){const arrow=part(m,box,'#fff7cf',0,.05,i*.7-.7,1.2,.025,.15);arrow.rotation.y=.25;}K.place(m,K.path,p.s,p.lane,.1);K.dynamic.add(m);K.decorations.pads.push(m);}
  for(const h of race.hazards){const m=new THREE.Group();part(m,sphere,'#d6a357',0,.25,0,.85,.27,.85);part(m,sphere,'#edc274',0,.44,0,.4,.15,.4);K.place(m,K.path,h.s,h.lane,.08);K.dynamic.add(m);K.decorations.hazards.push(m);}
 };
 K.animateModels=function(dt,time){
  const race=K.race;if(!race)return;
  race.racers.forEach((r,i)=>{const m=K.karts[i],f=K.place(m,K.path,r.distance,r.lane,.06);m.rotation.y+=r.steer*(r.wasDrifting?-.26:-.07);m.rotation.z=r.steer*-.035;m.rotation.x=-Math.atan2(f.forward.y,Math.hypot(f.forward.x,f.forward.z));m.userData.shield.visible=r.shield>0;m.userData.shield.rotation.y=time;m.userData.wheels.forEach(w=>w.rotation.x-=r.speed*dt*3);m.userData.buddy.userData.head.rotation.z=K.reduced?0:Math.sin(time*3+i)*.03;m.scale.setScalar(r.stun>0?1+Math.sin(time*35)*.025:1);});
  race.boxes.forEach((b,i)=>{const m=K.decorations.boxes[i];m.visible=b.cooldown<=0;if(!K.reduced){m.rotation.y=time*.9;m.position.y=K.path.at(b.s,b.lane).position.y+1.1+Math.sin(time*2+i)*.13;}});
  while(K.decorations.traps.length<race.traps.length){const m=new THREE.Group();part(m,sphere,'#be8558',0,.2,0,.65,.2,.65);for(let i=0;i<5;i++)part(m,sphere,'#694738',Math.sin(i*2)*.4,.38,Math.cos(i*2)*.4,.085,.03,.085);K.dynamic.add(m);K.decorations.traps.push(m);}
  K.decorations.traps.forEach((m,i)=>{m.visible=!!race.traps[i]&&race.traps[i].life>0;if(m.visible)K.place(m,K.path,race.traps[i].s,race.traps[i].lane,.1);});
 };
})(window.CozyKart);