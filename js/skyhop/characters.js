(function(S){'use strict';
 // Shared geometry/materials keep the four kart racers and swap ghosts inexpensive.
 const sphere=new THREE.SphereGeometry(1,24,16),materials={};let smileGeometry;
 const collarGeometry=new THREE.TorusGeometry(.30,.018,8,40);
 collarGeometry.rotateX(Math.PI/2);
 const headShape=new THREE.SphereGeometry(1,32,24);
 const vertices=headShape.attributes.position;
 for(let i=0;i<vertices.count;i++){
  const rounded=v=>Math.sign(v)*Math.pow(Math.abs(v),.82);
  vertices.setXYZ(i,rounded(vertices.getX(i)),rounded(vertices.getY(i)),rounded(vertices.getZ(i)));
 }
 // Analytic normals avoid a shading seam at the sphere's duplicated UV edge.
 const normals=headShape.attributes.normal,normal=new THREE.Vector3();
 for(let i=0;i<vertices.count;i++){
  const slope=v=>Math.sign(v)*Math.pow(Math.abs(v),2/.82-1);
  normal.set(slope(vertices.getX(i)),slope(vertices.getY(i)),slope(vertices.getZ(i))).normalize();
  normals.setXYZ(i,normal.x,normal.y,normal.z);
 }
 const ghostMaterial=new THREE.MeshBasicMaterial({color:'#edb6cf',wireframe:true,transparent:true,opacity:.2,depthWrite:false});
 const styles={
  bubu:{fur:'#fffaf2',dark:'#49312b',ear:'#49312b',blush:'#eea0a8',inner:null},
  dudu:{fur:'#c8906a',dark:'#57362a',ear:'#c8906a',blush:'#f3ce87',inner:'#88533d'}
 };
 S.material=function(color){return materials[color]||(materials[color]=new THREE.MeshLambertMaterial({color}));};
 S.character=function(kind,ghost){
  const root=new THREE.Group(),style=styles[kind]||styles.dudu;
  root.userData.eyes=[];root.userData.arms=[];
  function part(parent,name,color,pos,scale,geometry=sphere){
   const mesh=new THREE.Mesh(geometry,ghost?ghostMaterial:S.material(color));
   mesh.name=name;mesh.position.set(...pos);mesh.scale.set(...scale);mesh.castShadow=!ghost;mesh.receiveShadow=!ghost;parent.add(mesh);return mesh;
  }
  // A subtly squared plush head, rather than a ball with a separate muzzle.
  part(root,'body',style.fur,[0,.48,0],[.39,.4,.29]);
  const head=new THREE.Group();head.name='head';head.position.y=1.15;root.add(head);
  part(head,'head-fur',style.fur,[0,0,0],[.64,.57,.49],headShape);
  // Project facial details onto the head so they remain visible from the sides.
  const power=2/.82;
  function surface(x,y){return .49*Math.pow(Math.max(0,1-Math.pow(Math.abs(x/.64),power)-Math.pow(Math.abs(y/.57),power)),1/power);}
  function face(name,color,x,y,sx,sy,sz){
   const z=surface(x,y),mesh=part(head,name,color,[x,y,z+.006],[sx,sy,sz]);
   const gradient=(v,r)=>Math.sign(v)*Math.pow(Math.abs(v/r),power-1)/r;
   const normal=new THREE.Vector3(gradient(x,.64),gradient(y,.57),gradient(z,.49)).normalize();
   mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);return mesh;
  }
  for(const side of [-1,1]){
   const label=side<0?'left':'right';
   part(head,label+'-ear',style.ear,[side*.46,.46,-.035],[.145,.155,.105]);
   if(style.inner)part(head,label+'-inner-ear',style.inner,[side*.46,.475,.057],[.088,.099,.025]);
   const arm=part(root,label+'-arm',style.fur,[side*.405,.55,.01],[.115,.23,.135]);
   arm.rotation.z=side*.25;root.userData.arms.push(arm);
   part(root,label+'-foot',style.fur,[side*.225,.14,.055],[.17,.14,.215]);
   if(kind==='bubu')part(root,label+'-foot-tip',style.dark,[side*.225,.044,.072],[.154,.044,.19]);
   root.userData.eyes.push(face(label+'-eye',style.dark,side*.245,-.115,.047,.055,.024));
   face(label+'-cheek',style.blush,side*.423,-.265,.115,.125,.028);
  }
  // Two joined shallow curves form the reference's tiny omega smile (no nose).
  const mouthPoints=[];
  for(const side of [-1,1])for(let i=side<0?0:1;i<=8;i++){
   const t=i/8,x=side<0?-.07+.07*t:.07*t;
   const y=-.145-.026*4*t*(1-t);
   mouthPoints.push(new THREE.Vector3(x,y,surface(x,y)+.015));
  }
  if(!smileGeometry)smileGeometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mouthPoints),24,.009,6,false);
  part(head,'smile',style.dark,[0,0,0],[1,1,1],smileGeometry);
  if(kind==='bubu'){
   part(root,'collar',style.dark,[0,.76,0],[1,1,.82],collarGeometry);
   for(const side of [-1,1]){
    const bow=part(root,side<0?'left-bow':'right-bow',style.dark,[side*.074,.61,.303],[.088,.068,.04]);
    bow.rotation.z=side*-.4;
   }
   part(root,'bow-knot',style.dark,[0,.615,.34],[.038,.042,.03]);
  }
  part(root,'tail',style.fur,[0,.3,-.285],[.09,.085,.075]);
  root.userData.head=head;return root;
 };
 S.animateCharacter=function(mesh,time,velocity,grounded,impact,moving){const bounce=S.reduced?0:Math.sin(time*3)*.018;mesh.scale.set(1+impact*.22,1-impact*.28,1+impact*.15);mesh.position.y+=grounded?bounce:0;mesh.userData.head.rotation.z=moving?Math.sin(time*9)*.06:Math.sin(time*1.7)*.025;const blink=time%4.7>4.56;mesh.userData.eyes.forEach(eye=>eye.scale.y=blink?.009:.055);if(!grounded&&velocity>1)mesh.scale.set(.94,1.08,.94);};
})(window.SkyHop);