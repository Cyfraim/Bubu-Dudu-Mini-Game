/* Dependency-free steering-frame and opponent-model regression checks. */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
global.THREE=require(path.join(__dirname,'..','vendor','three.min.js'));
require(path.join(__dirname,'..','js','kart','race.js'));
const K=globalThis.CozyKart;
global.window={CozyKart:K,SkyHop:{}};
require(path.join(__dirname,'..','js','skyhop','characters.js'));
global.SkyHop=window.SkyHop;
require(path.join(__dirname,'..','js','kart','models.js'));
for(const track of K.tracks){
 const route=K.makePath(track);
 for(let i=0;i<24;i++){
  const distance=route.length*i/24,frame=route.at(distance);
  const cameraRight=frame.forward.clone().cross(new THREE.Vector3(0,1,0)).normalize();
  assert.ok(frame.right.dot(cameraRight)>.999,'lane right matches chase-camera right');
  for(const steer of [-1,1]){
   const race=K.createRace(track,route.length,'bubu');race.mode='racing';
   race.boxes=[];race.pads=[];race.hazards=[];
   const player=race.racers[0];player.distance=distance;player.lane=0;player.speed=23;
   race.racers.slice(1).forEach(r=>r.finishTime=0);
   K.update(race,K.CONFIG.step,{throttle:true,steer});
   const offset=route.at(distance,player.lane).position.sub(frame.position);
   assert.ok(offset.dot(cameraRight)*steer>0,'steering moves toward the requested camera-relative side');
  }
 }
 console.log('PASS '+track.id+' left/right steering across 24 track positions');
}
for(const kind of ['bubu','dudu']){
 const race=K.createRace(K.tracks[0],400,kind);
 K.dynamic=new THREE.Group();
 const karts=race.racers.map(K.makeKart);
 const expected=['#83c8b3','#a59cd5'];
 for(let i=2;i<4;i++){
  const buddy=karts[i].userData.buddy,color=new THREE.Color(expected[i-2]).getHex();
  for(const name of ['body','head-fur','left-ear','right-ear','left-arm','right-arm','left-foot','right-foot','tail']){
   assert.equal(buddy.getObjectByName(name).material.color.getHex(),color,name+' has opponent fur color');
  }
  assert.ok(buddy.getObjectByName('left-inner-ear'));
  assert.equal(buddy.userData.eyes.length,2);
 }
 const player=karts[0].userData.buddy.getObjectByName('body');
 assert.equal(player.material.color.getHex(),new THREE.Color(kind==='bubu'?'#fffaf2':'#c8906a').getHex());
 assert.notEqual(player.material,karts[2].userData.buddy.getObjectByName('body').material);
 console.log('PASS '+kind+' player retains original fur; mint and berry opponents have distinct bear models');
}