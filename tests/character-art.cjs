'use strict';
const assert=require('node:assert/strict');
global.window={DEBUG:true};
require('../js/characters.js');
const R=window.CharacterRenderer;
assert.equal(R.validateSprites(),true);
for(const kind of ['bubu','dudu']){
 const rows=R.PIXEL_SPRITES[kind],palette=R.getPixelPalette(kind);
 assert.equal(rows.length,24);
 rows.forEach(row=>{assert.equal(row.length,24);for(const key of row)assert.ok(key==='.'||palette[key]);});
 // Exercise both static and animated paths with finite canvas coordinates.
 let saves=0,calls=0;
 const ctx=new Proxy({}, {get(target,key){if(key in target)return target[key];return (...args)=>{calls++;args.forEach(a=>{if(typeof a==='number')assert.ok(Number.isFinite(a),key+' finite');});if(key==='save')saves++;if(key==='restore')saves--;};},set(target,key,value){target[key]=value;return true;}});
 R.draw(ctx,100,100,kind,1,1,.12,false);
 R.draw(ctx,100,100,kind,3,0,0,true);
 assert.equal(saves,0);assert.ok(calls>50);
 assert.equal(R.CHARACTER_STYLE[kind].catchlight,false);
 console.log('PASS '+kind+' 24x24 palette, finite drawing coordinates, balanced canvas state');
}
assert.notEqual(R.getPixelPalette('bubu').F,R.getPixelPalette('dudu').F);
console.log('PASS character artwork checks');