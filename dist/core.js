/* Restored from the public DIGIDICE WordPress source. See ../RECOVERY.md.
   Physical geometry and launch distributions are the surviving original values.
   No independent random face is chosen: the orientation determines the result. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./vendor/three-r110.min.js'), require('./vendor/cannon-0.6.2.min.js'));
  } else root.DigidiceCore = factory(root.THREE, root.CANNON);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (THREE, CANNON) {
  'use strict';
  const TYPES = Object.freeze({coin:{sides:2,label:'D2 Coin'},tetra:{sides:4,label:'D4 Tetrahedron'},tjtetra:{sides:4,label:'D4 TeeJayhedron'},dice:{sides:6,label:'D6 Cube'},octahedron:{sides:8,label:'D8 Octahedron'}});
  const MAX_AMOUNT = 12;
  const TETRA_UVS = [[[1,0],[.5,.5],[0,0]],[[0,0],[.5,.5],[0,1]],[[0,1],[.5,.5],[1,1]],[[1,1],[.5,.5],[1,0]]];
  const OCTA_UVS = [[[1,0],[.5,.25],[0,0]],[[0,0],[.5,.25],[0,.5]],[[.5,.75],[0,.5],[.5,.25]],[[0,.5],[.5,.75],[0,1]],[[0,1],[.5,.75],[1,1]],[[1,1],[.5,.75],[1,.5]],[[.5,.25],[1,.5],[.5,.75]],[[1,.5],[.5,.25],[1,0]]];
  const TETRA_VALUES = [2,3,1,4];
  // Atlas values follow the original UV triangle order (V=0 is image bottom).
  const OCTA_VALUES = [5,3,2,6,8,7,1,4];
  const INNER_ROTATION = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2, Math.PI/2, Math.PI/2));
  function normalizeSettings(settings, player) {
    if (!TYPES[settings.type]) throw new Error('Choose a dice type for set ' + player + '.');
    const raw = String(settings.amount).trim();
    const amount = Number(raw);
    if (raw === '' || !Number.isInteger(amount) || amount < 0 || amount > MAX_AMOUNT) throw new Error('Set ' + player + ': enter a whole amount from 0 to ' + MAX_AMOUNT + '.');
    if (!/^#[0-9a-f]{6}$/i.test(settings.color)) throw new Error('Choose a colour for set ' + player + '.');
    return {type:settings.type, amount, color:settings.color, player};
  }
  function geometry(type) {
    let g;
    if (type === 'dice') return new THREE.BoxGeometry(2,2,2);
    if (type === 'coin') return new THREE.CylinderGeometry(1.5,1.5,.4,32);
    if (type === 'tetra' || type === 'tjtetra') g = new THREE.TetrahedronGeometry(type === 'tetra' ? 2 : 3.5);
    else if (type === 'octahedron') g = new THREE.OctahedronGeometry(2);
    else throw new Error('Unknown dice geometry.');
    g.faceVertexUvs[0] = (type === 'octahedron' ? OCTA_UVS : TETRA_UVS).map(face => face.map(uv => new THREE.Vector2(uv[0],uv[1])));
    g.uvsNeedUpdate = true;
    // A single atlas material covers every triangular face.
    g.faces.forEach(face => { face.materialIndex = 0; });
    return g;
  }
  function convex(g) {
    return new CANNON.ConvexPolyhedron(g.vertices.map(v => new CANNON.Vec3(v.x,v.y,v.z)),g.faces.map(f => [f.a,f.b,f.c]));
  }
  function createWorld() {
    const world = new CANNON.World();
    world.gravity.set(0,-9.82,0);
    world.allowSleep = true;
    const ground = new CANNON.Body({mass:0,shape:new CANNON.Plane()});
    ground.quaternion.setFromEuler(-Math.PI/2,0,0);
    world.addBody(ground);
    // Original tray bounds and ceiling. Dice collide at x/z = ±10.
    const walls = [[0,-55,-11,0,0,0],[0,-55,11,0,0,0],[-11,0,0,0,Math.PI/2,0],[11,0,0,0,-Math.PI/2,0],[0,100,0,Math.PI/2,0,0]];
    walls.forEach(w => {
      const wall = new CANNON.Body({mass:0,shape:new CANNON.Box(new CANNON.Vec3(100,500,1))});
      wall.position.set(w[0],w[1],w[2]); wall.quaternion.setFromEuler(w[3],w[4],w[5]); world.addBody(wall);
    });
    return world;
  }
  function createBody(type, g, rng = Math.random) {
    const shape = type === 'dice' ? new CANNON.Box(new CANNON.Vec3(1,1,1)) : type === 'coin' ? new CANNON.Cylinder(1.5,1.5,.4,32) : convex(g);
    const body = new CANNON.Body({mass:type === 'dice' ? 8 : type === 'coin' ? 15 : 1,shape,allowSleep:true,sleepSpeedLimit:.2,sleepTimeLimit:1.2});
    const rotation = () => body.quaternion.setFromEuler((rng()*2-1)*Math.PI,(rng()*2-1)*Math.PI,(rng()*2-1)*Math.PI);
    if (type === 'dice') {
      body.position.set((rng()-.5)*15,5,(rng()-.5)*15);
      rotation();
      body.angularVelocity.set((rng()-.5)*25,(rng()-.5)*25,(rng()-.5)*25);
      body.velocity.set((rng()-.5)*100,(rng()-2)*20,(rng()-.5)*100);
    } else {
      rotation();
      body.position.set((rng()-.5)*15,8,(rng()-.5)*15);
      body.angularVelocity.set(rng()*20,rng()*20,rng()*20);
      if (type === 'coin') body.angularDamping = .3;
      body.velocity.set((rng()*2-1)*10,(rng()*2-1)*10,(rng()*2-1)*10);
    }
    return body;
  }
  function faceResult(type, g, body, underneath = false) {
    const q = new THREE.Quaternion(body.quaternion.x,body.quaternion.y,body.quaternion.z,body.quaternion.w);
    const view = new THREE.Vector3(0,underneath ? -1 : 1,0);
    if (type === 'coin') {
      // Cannon cylinders use local Z; Three cylinders use Y. Original mesh adds Rx(π/2).
      const dot = new THREE.Vector3(0,0,1).applyQuaternion(q).dot(view);
      return {value:Math.abs(dot) >= .92 ? (dot > 0 ? 2 : 1) : null, alignment:Math.abs(dot)};
    }
    if (type === 'dice') {
      const normals = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
      let best = -Infinity, value = null;
      normals.forEach((n,i) => {const dot = new THREE.Vector3(...n).applyQuaternion(q).dot(view);if (dot > best) {best = dot;value = i+1;}});
      return {value:best >= .92 ? value : null,alignment:best};
    }
    if (type === 'tjtetra' && !underneath) q.multiply(INNER_ROTATION);
    let best = -Infinity, faceIndex = 0;
    g.faces.forEach((f,i) => {const dot=f.normal.clone().applyQuaternion(q).dot(view);if(dot>best){best=dot;faceIndex=i;}});
    return {value:best >= .92 ? (type === 'octahedron' ? OCTA_VALUES : TETRA_VALUES)[faceIndex] : null,alignment:best};
  }
  function applyMotion(records, acceleration, underneath) {
    if (!acceleration || !Number.isFinite(acceleration.x) || !Number.isFinite(acceleration.y)) return false;
    const x = THREE.Math.clamp(acceleration.x,-15,15), y = THREE.Math.clamp(acceleration.y,-15,15);
    if (Math.abs(x)+Math.abs(y)<.15) return false;
    records.forEach(record => {
      record.body.wakeUp();
      const scale=record.body.mass*2;
      record.body.applyForce(new CANNON.Vec3(x*scale,0,y*scale*(underneath ? -1 : 1)),record.body.position);
    });
    return true;
  }
  return {TYPES,MAX_AMOUNT,TETRA_VALUES,OCTA_VALUES,INNER_ROTATION,normalizeSettings,geometry,createWorld,createBody,faceResult,applyMotion};
});
