(function(D){'use strict';const C=D.CONFIG;
 const T=D.track={seed:1,next:0,chunks:[],root:null,geometries:[],materials:[],props:[],matrix:new THREE.Object3D(),biome:-1,
  themes:[{name:'Sunny Meadow',sky:'#acdce9',fog:'#d9ebe1',grass:'#b8d5ad',path:'#f5e3ca'},{name:'Honey Orchard',sky:'#eedbb1',fog:'#e7dfb9',grass:'#bccc99',path:'#ecd2ae'},{name:'Pink Sunset Lane',sky:'#dfa9c5',fog:'#edc5cf',grass:'#bcb8cf',path:'#f5d6cb'},{name:'Starry Night Garden',sky:'#333d68',fog:'#777aab',grass:'#7e9aab',path:'#b7b6d0'}],colors:[],fog:new THREE.Color(),sky:new THREE.Color(),low:new THREE.Color('#fff0de'),
  random(){let n=this.seed+=0x6D2B79F5;n=Math.imul(n^n>>>15,n|1);n^=n+Math.imul(n^n>>>7,n|61);return((n^n>>>14)>>>0)/4294967296;},
  bend(z){const ahead=Math.max(0,-z);return Math.sin(D.state.distance*.004+ahead*.018)*ahead*ahead*.00048;},
  hill(z){const ahead=Math.max(0,-z);return Math.sin(D.state.distance*.003+ahead*.027)*ahead*ahead*.00012;},
  init(){for(const theme of this.themes)this.colors.push({sky:new THREE.Color(theme.sky),fog:new THREE.Color(theme.fog),grass:new THREE.Color(theme.grass),path:new THREE.Color(theme.path)});D.validateChunks();},
  dispose(){if(this.root){D.scene.remove(this.root);this.root.traverse(function(o){if(o.isInstancedMesh&&o.dispose)o.dispose();});}for(const g of this.geometries)g.dispose();for(const m of this.materials)m.dispose();this.geometries.length=0;this.materials.length=0;this.props.length=0;this.chunks.length=0;},
  build(){this.root=new THREE.Group();D.scene.add(this.root);const box=new THREE.BoxGeometry(1,1,1),ball=new THREE.IcosahedronGeometry(1,0),cone=new THREE.ConeGeometry(1,1,7),circle=new THREE.CircleGeometry(1,16);circle.rotateX(-Math.PI/2);this.geometries.push(box,ball,cone,circle);
   const mat=color=>{const m=new THREE.MeshLambertMaterial({color:color,flatShading:true});this.materials.push(m);return m;};this.grass=mat('#b8d5ad');this.path=mat('#f5e3ca');const leaf=mat('#a0c9b0'),trunk=mat('#bd967d'),pink=mat('#ecb3c9'),cream=mat('#fff2df'),white=mat('#fff9ef');
   const inst=(g,m,n)=>{const mesh=new THREE.InstancedMesh(g,m,n);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.receiveShadow=true;this.root.add(mesh);return mesh;};
   this.ground=inst(box,this.grass,C.trackSegments);this.road=inst(box,this.path,C.trackSegments);this.lanes=inst(box,cream,C.trackSegments*2);
   // Repeated scenery uses fixed instanced pools, never individual mesh churn.
   this.propParts=[{mesh:inst(box,trunk,C.propCount),kind:0,x:0,y:1,sx:.22,sy:2,sz:.22},{mesh:inst(ball,leaf,C.propCount),kind:0,x:0,y:2.5,sx:1.2,sy:1.5,sz:1.2},{mesh:inst(ball,pink,C.propCount),kind:1,x:0,y:.45,sx:.4,sy:.28,sz:.4},{mesh:inst(box,trunk,C.propCount),kind:2,x:0,y:.6,sx:2,sy:.16,sz:.16},{mesh:inst(box,cream,C.propCount),kind:2,x:-.8,y:.4,sx:.12,sy:.8,sz:.12},{mesh:inst(box,cream,C.propCount),kind:2,x:.8,y:.4,sx:.12,sy:.8,sz:.12},{mesh:inst(box,cream,C.propCount),kind:3,x:0,y:.65,sx:1.5,sy:1.3,sz:1.5},{mesh:inst(cone,pink,C.propCount),kind:3,x:0,y:1.7,sx:2.1,sy:1.2,sz:2.1},{mesh:inst(box,trunk,C.propCount),kind:3,x:0,y:.4,sx:.4,sy:.8,sz:1.52}];
   for(let i=0;i<C.propCount;i++)this.props.push({z:i*3.4-12,x:(i%2?-1:1)*(5+(i%5)*1.5),kind:i%4});
   this.clouds=inst(ball,white,18);this.petals=inst(ball,pink,36);this.stars=inst(ball,cream,32);
   const shadowMat=new THREE.MeshBasicMaterial({color:'#665565',transparent:true,opacity:.2,depthWrite:false});this.materials.push(shadowMat);this.blobs=inst(circle,shadowMat,2);this.blobs.receiveShadow=false;
   for(let i=0;i<8;i++)this.chunks.push({active:false,start:0,layout:null});
  },
  reset(seed){this.dispose();D.entities.dispose();this.seed=seed>>>0;this.next=24;this.biome=-1;this.build();D.entities.init();this.step(0);},
  step(){const s=D.state;for(let i=0;i<this.chunks.length;i++){const c=this.chunks[i];if(c.active&&c.start+C.chunkLength<s.distance-C.recycleBehind)c.active=false;}
   while(this.next<s.distance+C.spawnLookahead){let free=null;for(let i=0;i<this.chunks.length;i++)if(!this.chunks[i].active){free=this.chunks[i];break;}if(!free)break;const tier=Math.min(2,Math.floor(this.next/C.tierDistance)),pool=D.chunks[tier],layout=pool[Math.floor(this.random()*pool.length)];free.active=true;free.start=this.next;free.layout=layout;for(let i=0;i<layout.items.length;i++){const e=layout.items[i];D.entities.spawn(e[0],e[1],this.next+e[2],e[3]);}this.next+=C.chunkLength;}
   for(let i=0;i<this.props.length;i++)if(this.props[i].z<s.distance-C.recycleBehind)this.props[i].z+=C.propCount*3.4;
  },
  put(mesh,index,x,y,z,sx,sy,sz){const o=this.matrix;o.position.set(x+this.bend(z),y+this.hill(z),z);o.scale.set(sx,sy,sz);o.rotation.set(0,0,0);o.updateMatrix();mesh.setMatrixAt(index,o.matrix);},
  draw(){const s=D.state,offset=s.distance%C.segmentLength;
   for(let i=0;i<C.trackSegments;i++){const z=12-i*C.segmentLength+offset;this.put(this.ground,i,0,-.28,z,65,.4,C.segmentLength+.2);this.put(this.road,i,0,-.035,z,C.laneWidth*3+.5,.12,C.segmentLength+.2);this.put(this.lanes,i*2,-C.laneWidth/2,.031,z,.035,.015,1);this.put(this.lanes,i*2+1,C.laneWidth/2,.031,z,.035,.015,1);}
   this.ground.instanceMatrix.needsUpdate=true;this.road.instanceMatrix.needsUpdate=true;this.lanes.instanceMatrix.needsUpdate=true;
   for(let p=0;p<this.propParts.length;p++){const part=this.propParts[p];let n=0;for(let i=0;i<this.props.length;i++){const prop=this.props[i];if(prop.kind!==part.kind)continue;this.put(part.mesh,n++,prop.x+part.x,part.y,s.distance-prop.z,part.sx,part.sy,part.sz);}part.mesh.count=n;part.mesh.instanceMatrix.needsUpdate=true;}
   for(let i=0;i<18;i++)this.put(this.clouds,i,Math.sin(i*2.3)*25,10+i%4,-25-i*9,3+i%3,1,1.5);this.clouds.instanceMatrix.needsUpdate=true;
   for(let i=0;i<36;i++){const t=D.reduced?0:s.time;this.put(this.petals,i,Math.sin(i*9+t*.3)*10,1+(i*.4-t*.3%4+4)%4,-(i*7-s.distance*.4)%150,.09,.035,.07);}this.petals.instanceMatrix.needsUpdate=true;
   for(let i=0;i<32;i++)this.put(this.stars,i,Math.sin(i*7)*40,8+i%9,-40-i*4,.08,.08,.08);this.stars.instanceMatrix.needsUpdate=true;
   const phase=s.distance/C.biomeDistance,index=Math.floor(phase)%4,prev=(index+3)%4,blend=Math.min(1,(s.distance%C.biomeDistance)/C.biomeTransition),a=this.colors[s.distance<C.biomeDistance?index:prev],b=this.colors[index];
   this.grass.color.copy(a.grass).lerp(b.grass,blend);this.path.color.copy(a.path).lerp(b.path,blend);D.scene.fog.color.copy(a.fog).lerp(b.fog,blend);this.sky.copy(a.sky).lerp(b.sky,blend);this.stars.visible=index===3;
   // CSS sky updates are throttled by UI, rather than allocating strings each frame.
   if(index!==this.biome){this.biome=index;D.ui.toast(this.themes[index].name);}
   const R=D.runner;for(let i=0;i<2;i++)this.put(this.blobs,i,s.mode==='menu'?(i?1:-1):R.x+(s.hug>0?(i?.58:-.58):0),.04,s.mode==='menu'?1:(s.hug>0?0:R.positions[i]),.58,1,.4);this.blobs.instanceMatrix.needsUpdate=true;
   D.sun.position.x=R.x-6;D.sun.target.position.x=R.x;D.sun.target.updateMatrixWorld();
  }
 };
})(window.Dash);