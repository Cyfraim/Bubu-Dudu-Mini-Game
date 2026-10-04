/* Render a front/side/back model sheet in the existing debugging browser. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
async function main(){
 const pages=await(await fetch('http://localhost:9222/json/list')).json();
 const page=pages.find(p=>p.type==='page'&&p.url.endsWith('sky-hop.html'));
 if(!page)throw Error('Open sky-hop.html in Chromium/Edge with remote debugging on port 9222');
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));
 let id=0;const pending=new Map();
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 try{
  await send('Emulation.setDeviceMetricsOverride',{width:1200,height:720,deviceScaleFactor:1,mobile:false});
  const result=await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{
   const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
   renderer.setSize(1200,720);renderer.setClearColor('#f3ede6');
   const sheet=document.createElement('div');sheet.style.cssText='position:fixed;inset:0;z-index:99999;background:#f3ede6;pointer-events:none';
   sheet.appendChild(renderer.domElement);document.body.appendChild(sheet);
   renderer.setScissorTest(true);
   for(let row=0;row<2;row++)for(let col=0;col<3;col++){
    const scene=new THREE.Scene(),kind=row?'dudu':'bubu',model=SkyHop.character(kind);
    model.rotation.y=[0,Math.PI/2,Math.PI][col];scene.add(model);
    scene.add(new THREE.HemisphereLight('#fffaf1','#b3a0a0',.85));
    const light=new THREE.DirectionalLight('#ffffff',.65);light.position.set(-3,5,5);scene.add(light);
    const camera=new THREE.OrthographicCamera(-1.12,1.12,1.01,-1.01,.1,20);camera.position.set(0,.9,5);camera.lookAt(0,.9,0);
    renderer.setViewport(col*400,(1-row)*360,400,360);renderer.setScissor(col*400,(1-row)*360,400,360);renderer.render(scene,camera);
    const label=document.createElement('div');label.textContent=(row?'Dudu':'Bubu')+' — '+['Front','Side','Back'][col];
    label.style.cssText='position:absolute;top:'+(row*360+330)+'px;left:'+(col*400)+'px;width:400px;text-align:center;font:18px sans-serif;color:#57362a';sheet.appendChild(label);
   }
   return 'Rendered both models from three angles';
  })()`});
  if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));
  const shot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(__dirname,'character-models.png'),Buffer.from(shot.data,'base64'));
  console.log('PASS '+result.result.value+'; saved tests/character-models.png');
 }finally{
  await send('Emulation.clearDeviceMetricsOverride');await send('Page.reload');ws.close();
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});