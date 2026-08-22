import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ASSETS, T } from './data.js?v=safari2';

export async function createTowerFactory(ctx) {
  const { mobile, mat, mesh, box, cyl, towerRoot } = ctx;
  const loader = new GLTFLoader();
  const loaded = {};

  function loadAsset(key, url, timeoutMs = mobile ? 2600 : 4200) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (scene = null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (scene) loaded[key] = scene;
        resolve();
      };
      const timer = setTimeout(() => finish(null), timeoutMs);
      try {
        loader.load(
          url,
          (g) => {
            g.scene.traverse((n) => {
              if (n.isMesh) {
                n.castShadow = !mobile;
                n.receiveShadow = !mobile;
              }
            });
            finish(g.scene);
          },
          undefined,
          () => finish(null)
        );
      } catch {
        finish(null);
      }
    });
  }

  await Promise.all(Object.entries(ASSETS).map(([k, url]) => loadAsset(k, url)));

  function recolor(o, t) {
    o.traverse((n) => {
      if (!n.isMesh || !n.material) return;
      const m = n.material.clone();
      const c = m.color || new THREE.Color(1, 1, 1);
      if (c.r + c.g + c.b > 2.1) m.color.setHex(t.body);
      else m.color.lerp(new THREE.Color(t.dark), .3);
      m.metalness = .38;
      m.roughness = .34;
      n.material = m;
    });
  }

  function asset(k, t, s) {
    if (!loaded[k]) return null;
    const o = loaded[k].clone(true);
    recolor(o, t);
    o.scale.setScalar(s);
    return o;
  }

  function base(t) {
    const g = new THREE.Group();
    const dark = mat(t.dark, .5, .32);
    const body = mat(t.body, .32, .31);
    const trim = mat(t.trim, .25, .32, t.trim, .45);
    const energy = mat(0xffffff, .05, .16, t.glow, 3.4);
    g.add(cyl(3.1, 3.55, .95, 8, dark, [0, .48, 0]), cyl(2.55, 2.9, .48, 8, body, [0, 1.08, 0]));
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      g.add(box(1.1, .26, 1.65, trim, [Math.cos(a) * 2.55, .38, Math.sin(a) * 2.55], [0, -a, 0]));
    }
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      g.add(box(.18, .5, .34, energy, [Math.cos(a) * 2.18, 1.05, Math.sin(a) * 2.18], [0, -a, 0]));
    }
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      g.add(box(.26, .16, .85, i % 2 ? trim : dark, [Math.cos(a) * 2.45, .95, Math.sin(a) * 2.45], [0, -a, 0]));
    }
    return g;
  }

  let turret = null;
  let core = null;
  let spin = [];

  function build(id) {
    while (towerRoot.children.length) towerRoot.remove(towerRoot.children[0]);
    spin = [];
    const t = T[id];
    const g = base(t);
    const body = mat(t.body, .34, .3);
    const dark = mat(t.dark, .48, .3);
    const metal = mat(0xbfc8d4, .55, .23);
    const energy = mat(0xffffff, .04, .13, t.glow, 4);
    const trim = mat(t.trim, .25, .28, t.trim, .6);
    turret = new THREE.Group();
    turret.position.y = 1.35;
    g.add(turret);

    if (id === 'plasma') {
      const a = asset('double', t, 2);
      if (a) { a.position.y = .35; a.rotation.y = Math.PI; turret.add(a); }
      else turret.add(cyl(1.45, 1.65, 1.1, 10, body, [0, .35, 0]));
      core = mesh(new THREE.SphereGeometry(.46, 20, 20), energy, [0, 1.55, .05]);
      turret.add(core);
      for (const s of [-1, 1]) {
        const arm = new THREE.Group();
        arm.position.set(s * .8, 1.05, .35);
        arm.add(box(.45, .38, 1.1, dark, [0, 0, .5]));
        arm.add(cyl(.14, .2, 3.5, 10, metal, [0, 0, 2.05], [Math.PI / 2, 0, 0]));
        arm.add(cyl(.19, .19, .18, 10, energy, [0, 0, 3.82], [Math.PI / 2, 0, 0]));
        turret.add(arm);
      }
      for (let i = 0; i < 3; i++) {
        const r = mesh(new THREE.TorusGeometry(.72 + i * .13, .055, 8, 24), energy, [0, 1.55, .05], [Math.PI / 2, 0, 0]);
        turret.add(r); spin.push(r);
      }
    }

    if (id === 'frost') {
      const a = asset('dishLarge', t, 2.1);
      if (a) { a.position.y = .35; turret.add(a); }
      turret.add(cyl(1.35, 1.55, .85, 10, body, [0, .35, 0]));
      core = mesh(new THREE.OctahedronGeometry(.78, 1), energy, [0, 1.55, 0]);
      turret.add(core);
      for (let i = 0; i < 4; i++) {
        const a2 = i * Math.PI / 2;
        const f = box(.2, 1.2, 1.45, metal, [Math.cos(a2), 1.35, Math.sin(a2)], [0, -a2, i % 2 ? .18 : -.18]);
        turret.add(f); spin.push(f);
      }
      const r = mesh(new THREE.TorusGeometry(1.4, .08, 8, 30), energy, [0, 1.4, 0], [Math.PI / 2, 0, 0]);
      turret.add(r); spin.push(r);
    }

    if (id === 'sniper') {
      const a = asset('single', t, 2.2);
      if (a) { a.position.y = .25; a.rotation.y = Math.PI; turret.add(a); }
      turret.add(
        cyl(1.25, 1.45, .86, 10, body, [0, .3, 0]),
        box(1.15, .62, 1.8, dark, [0, 1, .15]),
        cyl(.16, .22, 5.4, 10, metal, [0, 1.05, 2.6], [Math.PI / 2, 0, 0])
      );
      core = cyl(.21, .21, 1, 10, energy, [0, 1.35, 1], [Math.PI / 2, 0, 0]);
      turret.add(core);
      for (let z = -.55; z < 2.2; z += .55) turret.add(box(.5, .06, .08, trim, [0, .68, z]));
    }

    if (id === 'tesla') {
      const a = asset('dish', t, 1.8);
      if (a) { a.position.y = .25; turret.add(a); }
      turret.add(cyl(1.38, 1.6, .9, 10, body, [0, .36, 0]));
      core = mesh(new THREE.SphereGeometry(.55, 20, 20), energy, [0, 1.65, 0]);
      turret.add(core);
      for (let i = 0; i < 4; i++) {
        const a2 = i * Math.PI / 2;
        const c = new THREE.Group();
        c.position.set(Math.cos(a2) * 1.05, 1.35, Math.sin(a2) * 1.05);
        c.add(cyl(.07, .07, 1.2, 7, metal, [0, 0, 0]));
        c.add(mesh(new THREE.TorusGeometry(.22, .055, 6, 14), energy, [0, .62, 0], [Math.PI / 2, 0, 0]));
        turret.add(c); spin.push(c);
      }
    }

    if (id === 'cannon') {
      const a = asset('single', t, 2.25);
      if (a) { a.position.y = .25; a.rotation.y = Math.PI; turret.add(a); }
      turret.add(
        cyl(1.5, 1.72, .95, 10, body, [0, .32, 0]),
        box(1.3, .75, 1.75, dark, [0, 1.05, .25]),
        cyl(.34, .42, 4.35, 14, metal, [0, 1.08, 2.25], [Math.PI / 2, 0, 0])
      );
      core = cyl(.43, .43, .25, 14, energy, [0, 1.08, 4.48], [Math.PI / 2, 0, 0]);
      turret.add(core);
      for (const s of [-1, 1]) turret.add(box(.22, .5, 1.1, trim, [s * .72, .85, .6]));
    }

    towerRoot.add(g);
    return g;
  }

  function animate(t, dt, target, mode) {
    if (core) {
      const p = 1 + Math.sin(t * 5) * .08;
      core.scale.setScalar(p);
    }
    spin.forEach((o, i) => { o.rotation.y += dt * (i % 2 ? -.8 : .8); });
    if (turret) {
      if (mode === 'combat' && target) {
        const a = Math.atan2(target.position.x, target.position.z);
        turret.rotation.y = THREE.MathUtils.lerp(turret.rotation.y, a, dt * 3.2);
      } else {
        turret.rotation.y += dt * .22;
      }
    }
  }

  return { build, animate, assetCount: Object.keys(loaded).length };
}
