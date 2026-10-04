/* Check all page headers and render the local SVG through a debugging browser. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
async function main(){
 for(const name of ['index.html','BubuDudu.html','sky-hop.html','cozy-kart.html']){
  const html=fs.readFileSync(path.join(root,name),'utf8'),head=html.split('</head>')[0];
  assert.match(head,/<link rel="icon" type="image\/svg\+xml" sizes="any" href="favicon.svg">/);
  console.log('PASS '+name+' favicon declaration');
 }
 const pages=await(await fetch('http://localhost:9222/json/list')).json();
 const page=pages.find(p=>p.type==='page');assert.ok(page,'debugging browser page');
 const ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 try{
  const svg=fs.readFileSync(path.join(root,'favicon.svg'),'utf8');
  const expression=`(async()=>{const svg=${JSON.stringify(svg)};const doc=new DOMParser().parseFromString(svg,'image/svg+xml');if(doc.querySelector('parsererror'))throw Error('Invalid SVG');const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await img.decode();const sizes=[];for(const size of [16,32,64]){const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,size,size);const pixels=ctx.getImageData(0,0,size,size).data;if(!pixels.some((v,i)=>i%4===3&&v>0))throw Error('Empty icon');sizes.push(size);}return sizes;})()`;
  const result=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Browser check timed out')),15000);
   ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id===1){clearTimeout(timer);m.error?reject(Error(m.error.message)):resolve(m.result);}});
   ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression,awaitPromise:true,returnByValue:true}}));
  });
  assert.ok(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));
  assert.deepEqual(result.result.value,[16,32,64]);
  console.log('PASS valid SVG renders at 16, 32, and 64 pixels');
 }finally{ws.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});