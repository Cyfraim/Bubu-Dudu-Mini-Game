/* Dependency-free mesh/animation regression checks using the shipped Three.js. */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
global.THREE=require(path.join(__dirname,'..','vendor','three.min.js'));
global.window={SkyHop:{}};
require(path.join(__dirname,'..','js','skyhop','characters.js'));
const S=window.SkyHop;
const models=[];
for(const kind of ['bubu','dudu'])for(const ghost of [false,true]){
 const model=S.character(kind,ghost);models.push(model);
 assert.equal(model.userData.eyes.length,2);
 assert.equal(model.userData.arms.length,2);
 assert.equal(model.userData.head.name,'head');
 for(const name of ['body','head-fur','left-ear','right-ear','left-cheek','right-cheek','smile','tail'])assert.ok(model.getObjectByName(name),name);
 assert.equal(!!model.getObjectByName('bow-knot'),kind==='bubu');
 assert.equal(!!model.getObjectByName('left-inner-ear'),kind==='dudu');
 assert.equal(model.getObjectByName('head-fur').material.wireframe,ghost);
 model.traverse(mesh=>{
  if(!mesh.isMesh)return;
  for(const attribute of Object.values(mesh.geometry.attributes))for(const value of attribute.array)assert.ok(Number.isFinite(value),'finite mesh attribute');
  assert.ok(mesh.scale.x>0&&mesh.scale.y>0&&mesh.scale.z>0);
 });
 model.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(model);
 assert.ok(bounds.min.y>=-.001&&bounds.max.y<1.8,'original grounded height envelope');
 assert.ok(bounds.max.x<.7&&bounds.min.x>-.7,'original width envelope');
 // Facial details must be in front of the head at their centers.
 for(const name of ['left-eye','right-eye','left-cheek','right-cheek']){
  const feature=model.getObjectByName(name),center=feature.getWorldPosition(new THREE.Vector3());
  const ray=new THREE.Raycaster(new THREE.Vector3(center.x,center.y,3),new THREE.Vector3(0,0,-1));
  const hits=ray.intersectObjects([feature,model.getObjectByName('head-fur')]);
  assert.ok(hits.length&&hits[0].object===feature,name+' visible in front of fur');
 }
 for(const reduced of [false,true]){
  S.reduced=reduced;
  for(const args of [[1,0,true,0,false],[4.6,0,true,1,true],[2,3,false,0,true]]){
   model.position.set(0,0,0);S.animateCharacter(model,...args);
   assert.ok(Number.isFinite(model.position.y)&&model.scale.y>0);
  }
 }
 console.log('PASS '+kind+(ghost?' ghost':' solid')+' geometry, reference details, bounds, face visibility, and animation');
}
assert.equal(models[0].getObjectByName('head-fur').geometry,models[2].getObjectByName('head-fur').geometry);
assert.equal(models[0].getObjectByName('smile').geometry,models[2].getObjectByName('smile').geometry);
assert.equal(models[0].getObjectByName('collar').geometry.type,'TorusGeometry');
assert.equal(models[1].getObjectByName('body').material,models[3].getObjectByName('body').material);
console.log('PASS shared geometry and ghost materials');