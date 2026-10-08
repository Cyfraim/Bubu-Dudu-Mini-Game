(function(D){'use strict';const C=D.CONFIG;
 D.definitions={heart:{pickup:true},honey:{pickup:true},gold:{pickup:true},puddle:{jump:.55},fence:{jump:1},branch:{duck:true},arch:{duck:true},narrow:{bubu:true},crate:{smash:true},rock:{smash:true},thorn:{},spring:{spring:true},gap:{jump:.45}};
 const E=D.entities={pools:{},particles:[],geometries:[],materials:[],root:null,matrix:new THREE.Object3D(),
  geometry(g){this.geometries.push(g);return g;},
  material(color){const m=new THREE.MeshLambertMaterial({color:color,flatShading:true});this.materials.push(m);return m;},
  init(){this.root=new THREE.Group();D.scene.add(this.root);
   const box=this.geometry(new THREE.BoxGeometry(1,1,1)),sphere=this.geometry(new THREE.IcosahedronGeometry(1,0)),cylinder=this.geometry(new THREE.CylinderGeometry(.45,.5,1,8)),ring=this.geometry(new THREE.TorusGeometry(.7,.19,4,10,Math.PI));
   const shape=new THREE.Shape();shape.moveTo(0,-.55);shape.bezierCurveTo(-1,.05,-.65,.85,0,.38);shape.bezierCurveTo(.65,.85,1,.05,0,-.55);
   const heart=this.geometry(new THREE.ExtrudeGeometry(shape,{depth:.15,bevelEnabled:false,steps:1,curveSegments:5}));
   const pink=this.material('#f099b8'),gold=this.material('#efc05b'),wood=this.material('#c8987f'),mint=this.material('#8dbd9d'),blue=this.material('#89c7de'),cream=this.material('#fff1d7'),rock=this.material('#a6b2c2'),dark=this.material('#7e6b7d');
   // Reusable component descriptors: geometry, material, position, scale, rotation.
   const specs={heart:[[heart,pink,0,0,0,.5,.5,.5]],gold:[[heart,gold,0,0,0,.75,.75,.75]],honey:[[cylinder,gold,0,.1,0,.7,.75,.7],[box,cream,0,.48,0,.65,.12,.65]],
    puddle:[[cylinder,blue,0,.015,0,2,.035,2]],gap:[[box,blue,0,-.015,0,2.2,.08,2.8]],fence:[[box,wood,0,.65,0,2,.2,.2],[box,wood,-.85,.5,0,.14,1,.14],[box,wood,.85,.5,0,.14,1,.14]],
    branch:[[box,wood,0,1.5,0,2.2,.4,.45],[sphere,mint,.6,1.8,0,.55,.3,.4]],arch:[[ring,pink,0,1.35,0,1.35,.8,.8],[box,cream,-.95,.65,0,.2,1.3,.2],[box,cream,.95,.65,0,.2,1.3,.2]],
    narrow:[[box,pink,-.78,1,0,.7,2,.35],[box,pink,.78,1,0,.7,2,.35],[box,cream,0,2,0,2.2,.15,.4]],crate:[[box,wood,0,.55,0,1.25,1.1,1.1],[box,cream,0,.55,.57,1.35,.13,.04,0,0,.65],[box,cream,0,.55,.58,1.35,.13,.04,0,0,-.65]],
    rock:[[sphere,rock,0,.6,0,.85,.7,.8],[box,dark,0,.8,.68,.07,.7,.05,0,0,.4]],thorn:[[sphere,mint,-.4,.45,0,.6,.65,.6],[sphere,mint,.4,.5,0,.6,.7,.6],[sphere,pink,0,.9,0,.2,.3,.2]],spring:[[cylinder,cream,0,.2,0,.4,.4,.4],[sphere,pink,0,.55,0,.85,.3,.8],[sphere,cream,.3,.75,.2,.13,.08,.13]]};
   for(const type in D.definitions){const capacity=type==='heart'?C.heartCapacity:C.entityCapacity,pool={records:[],parts:[]};for(let i=0;i<capacity;i++)pool.records.push({active:false,type:type,lane:0,z:0,y:1});
    for(const spec of specs[type]){const mesh=new THREE.InstancedMesh(spec[0],spec[1],capacity);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=!D.definitions[type].pickup;mesh.receiveShadow=true;mesh.count=0;this.root.add(mesh);pool.parts.push({mesh:mesh,spec:spec});}this.pools[type]=pool;
   }
   this.particleMesh=new THREE.InstancedMesh(heart,pink,C.particleCapacity);this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.particleMesh.frustumCulled=false;this.particleMesh.count=0;this.root.add(this.particleMesh);for(let i=0;i<C.particleCapacity;i++)this.particles.push({life:0,x:0,y:0,z:0,vx:0,vy:0});
  },
  dispose(){if(this.root){D.scene.remove(this.root);this.root.traverse(function(o){if(o.isInstancedMesh&&o.dispose)o.dispose();});}for(const g of this.geometries)g.dispose();for(const m of this.materials)m.dispose();this.geometries.length=0;this.materials.length=0;this.particles.length=0;this.pools={};},
  spawn(type,lane,z,y){const pool=this.pools[type];for(let i=0;i<pool.records.length;i++){const e=pool.records[i];if(!e.active){e.active=true;e.lane=lane;e.z=z;e.y=y===undefined?1:y;return e;}}console.error('Dash pool exhausted: '+type);return null;},
  burst(x,y,z){if(D.reduced)return;let count=0;for(let i=0;i<this.particles.length&&count<8;i++){const p=this.particles[i];if(p.life>0)continue;const angle=count*Math.PI/4;p.life=.65;p.x=x;p.y=y;p.z=z;p.vx=Math.cos(angle)*2;p.vy=2+Math.sin(angle)*1.5;count++;}},
  step(dt){const R=D.runner,s=D.state;for(const type in this.pools){const pool=this.pools[type],def=D.definitions[type];for(let i=0;i<pool.records.length;i++){const e=pool.records[i];if(!e.active)continue;const dz=e.z-s.distance,dx=Math.abs(e.lane*C.laneWidth-R.x);
     if(def.pickup){const range=s.hug>0?C.hugMagnetRange:C.magnetRange;if(Math.abs(dz)<range&&dx<range&&Math.abs(e.y-(R.y+1))<(s.hug>0?2.4:1.15)){e.active=false;D.collect(type,R.x,R.y+1);continue;}if(dz<-.9){e.active=false;if(type==='heart')D.breakCombo();}continue;}
     if(dz< -C.recycleBehind){e.active=false;continue;}if(Math.abs(dz)>.72||dx>C.collisionRadius)continue;
     if(def.spring){e.active=false;R.vy=C.springVelocity;R.jumps=1;R.slide=0;R.pound=false;continue;}
     if(def.jump&&R.y>def.jump)continue;if(def.duck&&R.slide>0&&R.y<.15)continue;if(def.bubu&&R.kind==='bubu')continue;
     if(def.smash&&R.kind==='dudu'&&(R.slide>0||(R.pound&&R.y<1.5))){e.active=false;D.smash(R.x);continue;}
     // Airborne runners may pass above crates, but only Dudu earns smash hearts.
     if(def.smash&&R.y>1.4)continue;e.active=false;R.hit();if(s.mode==='over')return;
    }}if(R.y===0)R.pound=false;
   for(let i=0;i<this.particles.length;i++){const p=this.particles[i];if(p.life<=0)continue;p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy-=6*dt;p.z+=s.speed*dt*.15;}
  },
  draw(){const s=D.state,o=this.matrix;for(const type in this.pools){const pool=this.pools[type],pickup=D.definitions[type].pickup;for(let part=0;part<pool.parts.length;part++){const item=pool.parts[part],a=item.spec;let n=0;for(let i=0;i<pool.records.length;i++){const e=pool.records[i];if(!e.active)continue;const z=s.distance-e.z;
      o.position.set(e.lane*C.laneWidth+D.track.bend(z)+a[2],D.track.hill(z)+a[3]+(pickup?e.y:0),z+a[4]);o.rotation.set(a[8]||0,a[9]||0,a[10]||0);o.scale.set(a[5],a[6],a[7]);o.updateMatrix();item.mesh.setMatrixAt(n++,o.matrix);
     }item.mesh.count=n;item.mesh.instanceMatrix.needsUpdate=true;}}
   let n=0;for(let i=0;i<this.particles.length;i++){const p=this.particles[i];if(p.life<=0)continue;o.position.set(p.x,p.y,p.z);o.rotation.set(0,0,p.life*3);const scale=p.life*.3;o.scale.set(scale,scale,scale);o.updateMatrix();this.particleMesh.setMatrixAt(n++,o.matrix);}this.particleMesh.count=n;this.particleMesh.instanceMatrix.needsUpdate=true;
  }
 };
})(window.Dash);