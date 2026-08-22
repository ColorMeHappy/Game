import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

async function unpackModels(){const bin=atob(window.BIOCORE_MODELS_GZ);const u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);const ds=new DecompressionStream('gzip');const out=await new Response(new Blob([u8]).stream().pipeThrough(ds)).text();window.BIOCORE_MODELS=JSON.parse(out);}

const TOWERS={
 plasma:{name:'Plasma Cannon',role:'Core DPS',cost:52,range:142,rate:'1.00/s',damage:26,color:'#43d9ff',modelKey:'plasma',desc:'Twin plasma emitters, rotating armored mount and luminous reactor core.',shot:'plasma'},
 frost:{name:'Frost Tower',role:'Control',cost:78,range:118,rate:'1.15/s',damage:0,color:'#91f3ff',modelKey:'frost',desc:'Cryogenic cannon with coolant chambers, frozen muzzle assembly and area-control pulse.',shot:'frost'},
 sniper:{name:'Sniper Rail',role:'Boss Killer',cost:132,range:245,rate:'0.54/s',damage:86,color:'#b786ff',modelKey:'sniper',desc:'Long rail assembly with precision optics and emissive accelerator channels.',shot:'sniper'},
 tesla:{name:'Electro Tower',role:'Energy Chain',cost:124,range:176,rate:'0.85/s',damage:22,color:'#59e9ff',modelKey:'tesla',desc:'Tall energy reactor with six coil pylons and chain-lightning discharge crown.',shot:'tesla'},
 cannon:{name:'Cannon Tower',role:'Area Damage',cost:148,range:226,rate:'0.62/s',damage:58,color:'#ff9b2d',modelKey:'cannon',desc:'Heavy artillery turret with massive recoil barrel, reinforced armor and explosive muzzle.',shot:'cannon'}
};
const order=Object.keys(TOWERS), $=id=>document.getElementById(id);
const ui={dock:$('dock'),name:$('name'),role:$('role'),type:$('type'),cost:$('cost'),range:$('range'),rate:$('rate'),damage:$('damage'),desc:$('desc'),combat:$('combat'),idle:$('idle'),loader:$('loader')};
let current='plasma', mode='combat', active=null, turret=null, muzzles=[], enemies=[], particles=[], beams=[], cooldown=.2, last=performance.now();

for(const id of order){const t=TOWERS[id],b=document.createElement('button');b.className='card'+(id===current?' active':'');b.dataset.id=id;b.style.setProperty('--ca',t.color);b.innerHTML=`<div class="preview"><div class="mini"></div></div><b>${t.name}</b><span>${t.role}</span>`;b.onclick=()=>select(id);ui.dock.appendChild(b)}
ui.combat.onclick=()=>{mode='combat';ui.combat.classList.add('active');ui.idle.classList.remove('active')};ui.idle.onclick=()=>{mode='idle';ui.idle.classList.add('active');ui.combat.classList.remove('active')};

const canvas=$('scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
const scene=new THREE.Scene();scene.background=new THREE.Color('#09111e');scene.fog=new THREE.FogExp2('#09111e',.022);
const camera=new THREE.PerspectiveCamera(43,1,.1,140);camera.position.set(11,9.5,13);
const controls=new OrbitControls(camera,canvas);controls.target.set(0,2.2,0);controls.enableDamping=true;controls.minDistance=8;controls.maxDistance=24;controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=Math.PI*.16;

scene.add(new THREE.HemisphereLight('#c9e9ff','#141018',1.15));
const sun=new THREE.DirectionalLight('#fff1d8',3.0);sun.position.set(8,14,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-14;sun.shadow.camera.right=14;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-14;scene.add(sun);
const rim=new THREE.DirectionalLight('#54bdff',2.0);rim.position.set(-8,8,-10);scene.add(rim);
const warm=new THREE.PointLight('#ff8b28',18,15,2);warm.position.set(-6,2.2,-4);scene.add(warm);
const cool=new THREE.PointLight('#31ccff',16,16,2);cool.position.set(5,3,4);scene.add(cool);

const world=new THREE.Group();scene.add(world);const fx=new THREE.Group();scene.add(fx);const modelRoot=new THREE.Group();scene.add(modelRoot);const enemyRoot=new THREE.Group();scene.add(enemyRoot);
function mat(color,metal=.35,rough=.5,emissive=null,ei=1){return new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough,emissive:emissive||'#000000',emissiveIntensity:emissive?ei:0})}
function addBox(s,pos,scale,m,rot=[0,0,0]){const o=new THREE.Mesh(new THREE.BoxGeometry(...scale),m);o.position.set(...pos);o.rotation.set(...rot);o.castShadow=o.receiveShadow=true;s.add(o);return o}
function addCrystal(x,z,s=1){const g=new THREE.Group();g.position.set(x,0,z);for(let i=0;i<5;i++){const h=(1.0+Math.random()*1.6)*s;const o=new THREE.Mesh(new THREE.ConeGeometry(.25*s,h,6),mat('#37cfff',.1,.16,'#177fff',1.8));o.position.set((Math.random()-.5)*1.2*s,h/2,(Math.random()-.5)*1.2*s);o.rotation.z=(Math.random()-.5)*.35;o.castShadow=true;g.add(o)}world.add(g)}
function makeWorld(){
 const terrain=new THREE.Mesh(new THREE.CircleGeometry(34,48),mat('#171821',.05,.95));terrain.rotation.x=-Math.PI/2;terrain.position.y=-.18;terrain.receiveShadow=true;world.add(terrain);
 const pad=new THREE.Mesh(new THREE.CylinderGeometry(6.2,6.7,.36,8),mat('#666d78',.25,.65));pad.position.y=.02;pad.receiveShadow=true;world.add(pad);
 const inner=new THREE.Mesh(new THREE.CylinderGeometry(5.65,5.9,.17,8),mat('#a5a9ae',.12,.78));inner.position.y=.25;inner.receiveShadow=true;world.add(inner);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;addBox(world,[Math.sin(a)*5.8,.37,Math.cos(a)*5.8],[1.45,.18,.28],mat(i%2?'#1ecfff':'#ff9a2b',.12,.3,i%2?'#1ecfff':'#ff9a2b',1.3),[0,a,0]);}
 for(const [x,z,ry] of [[-8,-5,.25],[8,-4,-.18],[-7,6,-.16],[7,6,.16]]){addBox(world,[x,1.3,z],[4.4,2.6,1.0],mat('#252d38',.58,.42),[0,ry,0]);for(let k=-1;k<=1;k++)addBox(world,[x+k*1.15,1.4,z-.52],[.72,.24,.08],mat('#3ee9ff',.08,.22,'#30cfff',1.6),[0,ry,0])}
 addCrystal(-8.5,2.6,1.1);addCrystal(8.5,2.5,.9);addCrystal(-7.3,-8,.8);addCrystal(7.8,-8.2,.7);
 for(let i=0;i<30;i++){const a=Math.random()*Math.PI*2,r=8+Math.random()*14;const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.2+Math.random()*.55,0),mat(Math.random()>.5?'#292a32':'#34323a',.02,.95));rock.scale.y=.5+Math.random()*.8;rock.position.set(Math.cos(a)*r,.12,Math.sin(a)*r);rock.rotation.set(Math.random(),Math.random(),Math.random());rock.castShadow=true;world.add(rock)}
}
makeWorld();

function makeEnemy(i){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.IcosahedronGeometry(i===0?.62:.38,1),mat(i===0?'#4a1c5e':'#28172e',.3,.45,'#5d154f',.3));body.scale.set(1,0.72,1.28);body.position.y=.55;body.castShadow=true;g.add(body);const head=new THREE.Mesh(new THREE.IcosahedronGeometry(i===0?.36:.25,1),mat('#351637',.28,.42));head.position.set(0,.56,.48);g.add(head);for(let j=0;j<6;j++){const side=j<3?-1:1,k=j%3;const leg=new THREE.Mesh(new THREE.CylinderGeometry(.035,.055,.88,6),mat('#141116',.5,.55));leg.rotation.z=side*(.75+k*.14);leg.rotation.x=(k-1)*.55;leg.position.set(side*(.37+k*.11),.28,(k-1)*.28);g.add(leg)}for(const x of [-.11,.11]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.045,6,6),mat('#ff5538',.05,.15,'#ff341d',3));eye.position.set(x,.63,.70);g.add(eye)}g.userData={a:i*(Math.PI*2/26),r:7.3+(i%5)*.75,s:.09+(i%6)*.008,bob:Math.random()*6};enemyRoot.add(g);enemies.push(g)}
for(let i=0;i<26;i++)makeEnemy(i);

const loader=new GLTFLoader();
function loadGLB(key){return new Promise((resolve,reject)=>{try{const b64=window.BIOCORE_MODELS[key];const bin=atob(b64);const u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);loader.parse(u8.buffer,'',resolve,reject)}catch(e){reject(e)}})}
function clearModel(){while(modelRoot.children.length)modelRoot.remove(modelRoot.children[0]);active=null;turret=null;muzzles=[]}
async function select(id){current=id;const t=TOWERS[id];document.querySelectorAll('.card').forEach(c=>c.classList.toggle('active',c.dataset.id===id));ui.name.textContent=t.name;ui.type.textContent=id.toUpperCase();ui.role.textContent=t.role;ui.cost.textContent=t.cost;ui.range.textContent=t.range;ui.rate.textContent=t.rate;ui.damage.textContent=t.damage;ui.desc.textContent=t.desc;ui.loader.style.display='grid';clearModel();try{const gltf=await loadGLB(t.modelKey);active=gltf.scene;active.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material&&o.material.emissive){o.material.emissiveIntensity=Math.max(o.material.emissiveIntensity||0,1.35)}}});modelRoot.add(active);turret=active.getObjectByName('TurretRoot')||active;muzzles=[];for(let i=0;i<8;i++){const m=active.getObjectByName('Muzzle_'+i);if(m)muzzles.push(m)}if(!muzzles.length){const m=active.getObjectByName('Muzzle_0');if(m)muzzles=[m]}cooldown=.2;requestAnimationFrame(()=>{ui.loader.style.opacity='0';setTimeout(()=>{ui.loader.style.display='none';ui.loader.style.opacity='1'},330)})}catch(e){console.error(e);ui.loader.querySelector('b').textContent='MODEL LOAD ERROR';ui.loader.querySelector('span').textContent=String(e)}}

function worldPos(obj){const v=new THREE.Vector3();obj.getWorldPosition(v);return v}
function nearestEnemy(){return enemies.reduce((best,e)=>!best||e.position.distanceToSquared(modelRoot.position)<best.position.distanceToSquared(modelRoot.position)?e:best,null)}
function spawnProjectile(start,end,color,kind){const mesh=new THREE.Mesh(new THREE.SphereGeometry(kind==='cannon'?.16:.11,8,8),new THREE.MeshBasicMaterial({color}));mesh.position.copy(start);fx.add(mesh);particles.push({mesh,start:start.clone(),end:end.clone(),t:0,kind,color});}
function spawnBeam(start,end,color,life=.1){const geo=new THREE.BufferGeometry().setFromPoints([start,end]);const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color,transparent:true,opacity:1}));fx.add(line);beams.push({obj:line,life,max:life})}
function lightning(start,end,color){const pts=[start.clone()];for(let i=1;i<7;i++){const t=i/7;const p=start.clone().lerp(end,t);p.x+=(Math.random()-.5)*.32;p.y+=(Math.random()-.5)*.32;p.z+=(Math.random()-.5)*.32;pts.push(p)}pts.push(end.clone());const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color,transparent:true,opacity:1}));fx.add(line);beams.push({obj:line,life:.12,max:.12})}
function fire(){if(!active||!muzzles.length)return;const t=TOWERS[current],target=nearestEnemy();if(!target)return;const end=target.position.clone().add(new THREE.Vector3(0,.55,0));if(current==='tesla'){for(let i=0;i<Math.min(3,muzzles.length);i++)lightning(worldPos(muzzles[i]),end,t.color)}else if(current==='sniper'){spawnBeam(worldPos(muzzles[0]),end,t.color,.08)}else if(current==='frost'){spawnBeam(worldPos(muzzles[0]),end,t.color,.16);const ring=new THREE.Mesh(new THREE.RingGeometry(.2,1.4,24),new THREE.MeshBasicMaterial({color:t.color,transparent:true,opacity:.55,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.copy(end);fx.add(ring);beams.push({obj:ring,life:.5,max:.5,grow:true})}else spawnProjectile(worldPos(muzzles[0]),end,t.color,current==='cannon'?'cannon':'plasma')}

function update(dt,time){controls.update();enemies.forEach((e,i)=>{const d=e.userData;d.a+=d.s*dt;e.position.set(Math.sin(d.a)*d.r,.08+Math.sin(time*3+d.bob)*.04,Math.cos(d.a)*d.r);e.lookAt(0,.3,0)});if(active){if(mode==='idle'){if(turret)turret.rotation.y+=dt*.32}else{const target=nearestEnemy();if(target&&turret){const p=target.position;const a=Math.atan2(p.x,p.z);turret.rotation.y=THREE.MathUtils.lerp(turret.rotation.y,a,dt*3)}cooldown-=dt;if(cooldown<=0){fire();cooldown={plasma:.58,frost:1.05,sniper:1.45,tesla:.78,cannon:1.15}[current]}}}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.t+=dt*(p.kind==='cannon'?1.35:2.6);if(p.t>=1){fx.remove(p.mesh);particles.splice(i,1);continue}const q=p.start.clone().lerp(p.end,p.t);if(p.kind==='cannon')q.y+=Math.sin(p.t*Math.PI)*1.5;p.mesh.position.copy(q)}
 for(let i=beams.length-1;i>=0;i--){const b=beams[i];b.life-=dt;if(b.life<=0){fx.remove(b.obj);beams.splice(i,1);continue}b.obj.material.opacity=b.life/b.max;if(b.grow)b.obj.scale.multiplyScalar(1+dt*2.4)}
}
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
await unpackModels();
select(current);
function loop(now){requestAnimationFrame(loop);const dt=Math.min((now-last)/1000,.033);last=now;update(dt,now/1000);renderer.render(scene,camera)}requestAnimationFrame(loop);