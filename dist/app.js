(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const core = window.DigidiceCore;
  const canvas = $('diceCanvas'), tray = $('diceRollerContainer'), status = $('trayStatus');
  const rollButton = $('rollButton'), notice = $('errorLog');
  let scene, camera, renderer, world, textures, geometries = {}, edges = {};
  let records = [], introObjects = [], mode = 'loading', underneath = false;
  let lastFrame = 0, nextIntro = 0, quietTime = 0, resultsShown = false;
  let motionActive = false, musicPlaying = false, motionLast = 0, motionReading = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Edge on the Xbox One (the console kit, through console.js; it runs first): its user agent never says Xbox.
  const onConsole = () => Boolean(window.DigidiceConsole && window.DigidiceConsole.isConsole());
  const assetNames = {
    dice:['d3fe6-img_1554-1.png','c424a-img_1555-1.png','c84d5-img_1556-1.png','8c6ff-img_1557-1.png','c3f09-img_1558-1.png','d2b7f-img_1559-1.png'],
    coin:['4e0d5-img_1604-1.png','3663e-img_1596-1.png','7d532-img_1598-1.png'],
    tetra:['16fd7-untitled-03-21-2024-05-43-48-1.png'],
    tjtetra:['1f143-untitled-03-21-2024-07-52-27-1.png'],
    octahedron:['a52d2-untitled-03-21-2024-09-02-47-1-1.png']
  };
  function say(message) { notice.textContent = message; }
  function pressed(button, active, label) {
    button.setAttribute('aria-pressed',String(active));
    if (label) button.innerHTML = label + ' <span>' + (active ? 'ON' : 'OFF') + '</span>';
  }
  function resize() {
    const width=tray.clientWidth, height=tray.clientHeight;
    if (!renderer || !width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,onConsole()?1:2));
    renderer.setSize(width,height,false);
    const aspect=width/height, size=12.2;
    camera.left=-size*Math.max(1,aspect); camera.right=-camera.left;
    camera.top=size*Math.max(1,1/aspect); camera.bottom=-camera.top;
    camera.updateProjectionMatrix(); renderer.render(scene,camera);
  }
  async function loadTextures() {
    const loader = new THREE.TextureLoader(), loaded = {};
    await Promise.all(Object.entries(assetNames).map(async ([type,files]) => {
      loaded[type] = await Promise.all(files.map(file => new Promise((resolve,reject) => {
        // Data URLs allow the standalone index.html to work without a web server.
        loader.load(window.DIGIDICE_TEXTURES[file],texture => {
          texture.minFilter=THREE.NearestFilter; texture.magFilter=THREE.LinearFilter;
          resolve(texture);
        },undefined,() => reject(new Error('Could not load the original dice artwork.')));
      })));
    }));
    return loaded;
  }
  function makeMesh(type,color,g) {
    const transparent = type==='tjtetra';
    const mats=textures[type].map(map => new THREE.MeshBasicMaterial({map,color,transparent,opacity:transparent ? .5 : 1,depthWrite:!transparent,side:transparent ? THREE.DoubleSide : THREE.FrontSide}));
    const group=new THREE.Group(), mesh=new THREE.Mesh(g,mats);
    group.add(mesh);
    if (type === 'coin') mesh.rotation.x=Math.PI/2;
    if (type === 'tjtetra') {
      const inside=new THREE.Mesh(geometries.tetra,textures.tetra.map(map=>new THREE.MeshBasicMaterial({map,color})));
      // Original inner radius: 3.5 × 0.33333. The standard tetra has radius 2.
      inside.scale.setScalar(3.5*.33333/2);
      if (!underneath) inside.quaternion.copy(core.INNER_ROTATION);
      group.add(inside);
    }
    if (type !== 'coin') {
      const outline=new THREE.LineSegments(edges[type],new THREE.LineBasicMaterial({color:0x080909,transparent:true,opacity:transparent ? .55 : .8}));
      group.add(outline);
    }
    return group;
  }
  function release(group, ownGeometry) {
    scene.remove(group);
    group.traverse(object => {
      if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m=>m.dispose());
      if (ownGeometry && object.geometry) object.geometry.dispose();
    });
  }
  function clearScene() {
    records.forEach(record=>{world.removeBody(record.body);release(record.mesh,false);});
    introObjects.forEach(record=>{world.removeBody(record.body);release(record.mesh,true);});
    records=[]; introObjects=[]; motionReading=null; quietTime=0; resultsShown=false;
  }
  function createFallingDie(initial = false) {
    const size=Math.random()+1.5;
    const g=new THREE.BoxGeometry(size,size,size);
    const color='#'+Array.from({length:6},()=> '0123456789ABCDEF'[Math.floor(Math.random()*16)]).join('');
    const mesh=new THREE.Mesh(g,textures.dice.map(map=>new THREE.MeshBasicMaterial({map,color})));
    const body=new CANNON.Body({mass:5,shape:new CANNON.Box(new CANNON.Vec3(size*.5,size*.5,size*.5))});
    body.position.set((Math.random()-.5)*20,initial ? 456+Math.random()*20 : 485,(Math.random()-.5)*20);
    body.quaternion.setFromEuler((Math.random()*2-1)*Math.PI,(Math.random()*2-1)*Math.PI,(Math.random()*2-1)*Math.PI);
    body.angularVelocity.set((Math.random()-.5)*25,(Math.random()-.5)*25,(Math.random()-.5)*25);
    body.velocity.set((Math.random()-.5)*10,(Math.random()-.5)*10,(Math.random()-.5)*10);
    world.addBody(body); scene.add(mesh); introObjects.push({body,mesh});
  }
  function sync(record) {
    record.mesh.position.copy(record.body.position); record.mesh.quaternion.copy(record.body.quaternion);
  }
  function settings() {
    return [1,2].map(player=>core.normalizeSettings({type:$('type'+player).value,color:$('color'+player).value,amount:$('amount'+player).value},player));
  }
  function pendingResults() {
    $('results').replaceChildren();
    const text=document.createElement('p'); text.className='ready-note'; text.textContent='LET THEM SETTLE.'; $('results').append(text);
  }
  function showResults() {
    const container=$('results'); container.replaceChildren(); let tilted=false;
    [1,2].forEach(player => {
      const group=records.filter(record=>record.player===player);
      if (!group.length) return;
      const row=document.createElement('div'); row.className='result-row';row.dataset.set=String(player);
      const label=document.createElement('span');label.className='result-label';label.textContent='SET '+(player===1?'ONE':'TWO');row.append(label);
      group.forEach(record => {
        const result=core.faceResult(record.type,record.geometry,record.body,underneath);
        const chip=document.createElement('span');chip.className='result-die';chip.textContent=result.value===null?'?':String(result.value);
        chip.setAttribute('aria-label',core.TYPES[record.type].label+': '+(result.value===null?'tilted; reroll to resolve':result.value));
        row.append(chip); if(result.value===null) tilted=true;
      }); container.append(row);
    });
    if (tilted) {const text=document.createElement('span');text.className='result-note';text.textContent='? = tilted. Reroll to resolve.';container.append(text);}
    status.textContent=tilted?'TILTED · REROLL':'SETTLED';
    tray.dataset.resultState=tilted?'tilted':'settled';
    tray.dataset.results=JSON.stringify(records.map(record=>core.faceResult(record.type,record.geometry,record.body,underneath).value));
    resultsShown=true;
  }
  function sound(audio) {
    audio.currentTime=0;
    const playback=audio.play(); if(playback) playback.catch(()=>say('Sound could not play in this browser. The dice still work.'));
  }
  function rollObjects(event) {
    if (event) event.preventDefault();
    if (!renderer || mode==='loading') return;
    let chosen;
    [1,2].forEach(p=>$('amount'+p).removeAttribute('aria-invalid'));
    try {chosen=settings();} catch(error) {
      say(error.message);
      const match=/Set (\d)/i.exec(error.message);if(match){$('amount'+match[1]).setAttribute('aria-invalid','true');$('amount'+match[1]).focus();}
      return;
    }
    if(!chosen.some(set=>set.amount)){say('Add at least one die to either set.');$('amount1').focus();return;}
    say(''); clearScene(); underneath=chosen.some(set=>set.type==='tetra' && set.amount>0);
    camera.position.set(0,underneath?-450:450,0);camera.up.set(0,0,underneath?1:-1);camera.lookAt(0,0,0);
    chosen.forEach(set=> {
      for(let i=0;i<set.amount;i++) {
        const g=geometries[set.type], mesh=makeMesh(set.type,set.color,g), body=core.createBody(set.type,g);
        const record={type:set.type,player:set.player,color:set.color,geometry:g,mesh,body};
        world.addBody(body);scene.add(mesh);sync(record);records.push(record);
      }
    });
    if(chosen.some(set=>set.amount && set.type!=='coin')) sound($('rollSound'));
    if(chosen.some(set=>set.amount && set.type==='coin')) sound($('coinSound'));
    mode='roll';tray.dataset.mode='roll';tray.dataset.count=String(records.length);
    tray.dataset.types=records.map(record=>record.type).join(',');tray.dataset.worldBodies=String(world.bodies.length);
    tray.dataset.view=underneath?'underside':'top';tray.dataset.resultState='rolling';delete tray.dataset.results;
    $('viewLabel').textContent=underneath?'UNDERSIDE VIEW · D4':'TOP VIEW';
    status.textContent='ROLLING'; pendingResults();renderer.render(scene,camera);
  }
  function frame(time) {
    requestAnimationFrame(frame);
    const delta=lastFrame?Math.min((time-lastFrame)/1000,.1):1/60;lastFrame=time;
    if(document.hidden)return;
    let moving = false;
    if(mode==='intro') {
      if(!reducedMotion) {
        moving = true;
        if(time>=nextIntro && introObjects.length<24){createFallingDie();nextIntro=time+450;}
        world.step(1/60,delta,6);
        for(let i=introObjects.length-1;i>=0;i--){const obj=introObjects[i];if(obj.body.position.y<443){world.removeBody(obj.body);release(obj.mesh,true);introObjects.splice(i,1);}}
      }
      introObjects.forEach(sync);
    } else if(mode==='roll') {
      if(motionActive && motionReading && time-motionLast<180 && core.applyMotion(records,motionReading,underneath)) {quietTime=0;if(resultsShown){resultsShown=false;pendingResults();status.textContent='IN MOTION';}}
      const awake=records.some(record=>record.body.sleepState!==CANNON.Body.SLEEPING);
      moving = awake;
      if(awake)world.step(1/60,delta,6);
      records.forEach(sync);
      const quiet=records.every(record=>record.body.velocity.lengthSquared()<.04 && record.body.angularVelocity.lengthSquared()<.04);
      quietTime=quiet?quietTime+delta:0;
      if(!quiet && resultsShown){resultsShown=false;pendingResults();status.textContent='ROLLING';}
      if(!resultsShown && quietTime>.65)showResults();
    }
    // Settled dice need no repeated WebGL draws; resize and reroll render immediately.
    if(moving)renderer.render(scene,camera);
  }
  function motionEvent(event) {
    const a=event.accelerationIncludingGravity;
    if(!a || a.x===null || a.y===null)return;
    motionReading={x:a.x,y:a.y};motionLast=performance.now();
  }
  function disableMotion() {window.removeEventListener('devicemotion',motionEvent);motionActive=false;motionReading=null;pressed($('requestPermission'),false,'MOTION');}
  async function toggleMotionControls() {
    const button=$('requestPermission');
    if(motionActive){disableMotion();say('');return;}
    if(!window.isSecureContext){say('Motion needs a secure browser context. Use the localhost preview or HTTPS.');return;}
    if(typeof window.DeviceMotionEvent==='undefined'){say('Motion sensors are unavailable in this browser. Use ROLL or Space.');return;}
    button.disabled=true;
    try {
      if(typeof window.DeviceMotionEvent.requestPermission==='function') {
        const permission=await window.DeviceMotionEvent.requestPermission();
        if(permission!=='granted'){say('Motion permission was declined. You can still roll with the button.');return;}
      }
      window.addEventListener('devicemotion',motionEvent);motionActive=true;pressed(button,true,'MOTION');
      say('Tilt your device to move the dice.');
    } catch(error) {disableMotion();say('Motion could not start. Check this browser’s sensor permissions.');}
    finally {button.disabled=false;}
  }
  async function toggleMusic() {
    const button=$('enableSound'), music=$('music');
    if(musicPlaying){music.pause();musicPlaying=false;pressed(button,false,'MUSIC');return;}
    button.disabled=true;
    try {music.volume=.4;await music.play();musicPlaying=true;pressed(button,true,'MUSIC');say('');}
    catch(error){say('Music could not play. Check this browser’s sound permissions.');}
    finally{button.disabled=false;}
  }
  function fullscreenState() {
    const active=Boolean(document.fullscreenElement||document.webkitFullscreenElement||$('fullScreenContainer').classList.contains('fullscreen-fallback'));
    pressed($('toggleFullscreen'),active);$('toggleFullscreen').setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');
    document.querySelector('.fullscreen-label').textContent=active?'EXIT':'FULLSCREEN';resize();
  }
  function fullscreenFallback(active) {
    $('fullScreenContainer').classList.toggle('fullscreen-fallback',active);document.body.style.overflow=active?'hidden':'';fullscreenState();
  }
  async function toggleFullscreen() {
    const app=$('fullScreenContainer');
    if(app.classList.contains('fullscreen-fallback')){fullscreenFallback(false);return;}
    if(document.fullscreenElement || document.webkitFullscreenElement){const exit=document.exitFullscreen||document.webkitExitFullscreen;if(exit)await exit.call(document);return;}
    const enter=app.requestFullscreen||app.webkitRequestFullscreen;
    if(!enter){fullscreenFallback(true);return;}
    try {await enter.call(app);fullscreenState();}
    catch(error){fullscreenFallback(true);say('Using the expanded tray view in this browser.');}
  }
  function setAmountButtons(player) {
    const value=Number($('amount'+player).value);
    document.querySelectorAll('[data-player="'+player+'"]').forEach(button=> {button.disabled=Number(button.dataset.step)<0 ? value<=0 : value>=core.MAX_AMOUNT;});
  }
  function setupControls() {
    $('ui').addEventListener('submit',rollObjects);
    [1,2].forEach(player=> {
      $('amount'+player).addEventListener('input',()=>setAmountButtons(player));
      $('color'+player).addEventListener('input',()=>{$('colourLabel'+player).textContent=$('color'+player).value.toUpperCase();});
      setAmountButtons(player);
    });
    document.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=> {
      const p=button.dataset.player,input=$('amount'+p),value=Number(input.value);
      input.value=String(Math.max(0,Math.min(core.MAX_AMOUNT,Math.trunc(Number.isFinite(value)?value:0)+Number(button.dataset.step))));
      input.removeAttribute('aria-invalid');setAmountButtons(p);
    }));
    $('enableSound').addEventListener('click',toggleMusic);
    $('requestPermission').addEventListener('click',toggleMotionControls);
    $('toggleFullscreen').addEventListener('click',()=>toggleFullscreen().catch(()=>say('Fullscreen could not change in this browser.')));
    document.addEventListener('fullscreenchange',fullscreenState);document.addEventListener('webkitfullscreenchange',fullscreenState);
    window.addEventListener('keydown',event=> {
      if(event.key==='Escape' && $('fullScreenContainer').classList.contains('fullscreen-fallback'))fullscreenFallback(false);
      if(event.code!=='Space'||event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;
      if(event.target.closest && event.target.closest('input,select,button,textarea,a,[contenteditable="true"]'))return;
      event.preventDefault();rollObjects();
    });
    window.addEventListener('resize',resize);new ResizeObserver(resize).observe(tray);
    window.addEventListener('pagehide',()=>{disableMotion();$('music').pause();});
  }
  async function init() {
    try {
      if(!core || !window.THREE || !window.CANNON)throw new Error('A local app file is missing. Keep index.html, scripts, assets and vendor folders together.');
      scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-12,12,12,-12,1,1000);
      camera.position.set(0,465,100);camera.lookAt(0,465,0);
      try{try{renderer=new THREE.WebGLRenderer({canvas,antialias:!onConsole(),alpha:true});}catch{renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:true});}renderer.setClearColor(0x000000,0);}catch{let ctx2d=canvas.getContext('2d');if(!ctx2d){const alt=canvas.cloneNode(false);canvas.replaceWith(alt);ctx2d=alt.getContext('2d');}renderer={setClearColor(){},setPixelRatio(){},setSize(w,h){canvas.width=w;canvas.height=h;},render(){if(!ctx2d)return;ctx2d.clearRect(0,0,canvas.width,canvas.height);records.forEach(r=>{const x=(r.body.position.x/24+.5)*canvas.width,y=(r.body.position.z/24+.5)*canvas.height;ctx2d.fillStyle=r.color||'#7de2d1';ctx2d.fillRect(x-16,y-16,32,32);});}};}
      world=core.createWorld();textures=await loadTextures();
      $('rollSound').volume=.5;
      Object.keys(core.TYPES).forEach(type=>{geometries[type]=core.geometry(type);if(type!=='coin')edges[type]=new THREE.EdgesGeometry(geometries[type]);});
      setupControls();resize();
      mode='intro';tray.dataset.mode='intro';status.textContent='READY TO ROLL';
      for(let i=0;i<8;i++)createFallingDie(true);
      introObjects.forEach(sync);renderer.render(scene,camera);
      rollButton.disabled=false;requestAnimationFrame(frame);
    } catch(error) {
      status.textContent='UNAVAILABLE';say(error.message || '3D rendering is unavailable. Try a browser with WebGL enabled.');rollButton.disabled=true;
    }
  }
  init();
})();
