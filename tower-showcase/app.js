import * as THREE from 'three';
import { T } from './data.js?v=safari2';
import { createScene } from './scene.js?v=safari2';
import { createTowerFactory } from './towers.js?v=safari2';

const $ = (id) => document.getElementById(id);
const els = {
  statusText: $('statusText'),
  name: $('name'),
  role: $('role'),
  cost: $('cost'),
  range: $('range'),
  rate: $('rate'),
  damage: $('damage'),
  desc: $('desc'),
  combat: $('combat'),
  idle: $('idle'),
  dock: $('dock'),
  loader: $('loader'),
};

function hideLoader() {
  if (!els.loader) return;
  els.loader.style.opacity = '0';
  els.loader.style.pointerEvents = 'none';
  window.__biocoreReady = true;
}

function showRuntimeError(err) {
  console.error('[BioCore Showcase]', err);
  if (els.statusText) els.statusText.textContent = 'SAFE FALLBACK ACTIVE';
  hideLoader();
}

try {
  const ctx = createScene();
  const { mobile, mat, mesh, cyl, enemyRoot, fxRoot, towerRoot, render } = ctx;
  const factory = await createTowerFactory(ctx);

  if (els.statusText) {
    els.statusText.textContent = factory.assetCount
      ? `GAME ASSETS ONLINE · ${factory.assetCount}`
      : 'PROCEDURAL FALLBACK ACTIVE';
  }

  const enemies = [];
  function enemy(i) {
    const g = new THREE.Group();
    const boss = i === 0;
    const elite = i % 13 === 0;
    const scale = boss ? 1.8 : elite ? 1.25 : .78 + Math.random() * .28;
    const skin = mat(boss ? 0x411b1e : 0x251318, .22, .48, boss ? 0x5a130e : 0x250404, .25);
    const armor = mat(boss ? 0x5e2325 : 0x3a1b20, .45, .35, boss ? 0xff551f : 0xff3d1b, .18);
    const eye = mat(0xffd5ad, .02, .12, 0xff5b20, 4);
    g.add(
      mesh(new THREE.SphereGeometry(.7, 10, 8), skin, [0, .55, 0]),
      mesh(new THREE.SphereGeometry(.45, 8, 6), armor, [0, .78, .32])
    );
    for (let l = 0; l < 6; l++) {
      const a = -1.45 + l * .58;
      g.add(cyl(.055, .08, .9, 5, mat(0x0f1013, .35, .65), [Math.sin(a) * .55, .3, Math.cos(a) * .55], [0, 0, a * .45]));
    }
    for (const s of [-1, 1]) {
      g.add(mesh(new THREE.ConeGeometry(.13, .52, 5), armor, [s * .42, 1, -.2], [s * .25, 0, s * .25]));
    }
    g.add(mesh(new THREE.SphereGeometry(.11, 8, 8), eye, [.18, .84, .66]));
    g.scale.setScalar(scale);
    g.userData = {
      angle: i / 48 * Math.PI * 2,
      radius: 8.2 + (i % 6) * 1.02,
      speed: .07 + Math.random() * .055,
      bob: Math.random() * Math.PI * 2,
    };
    enemyRoot.add(g);
    enemies.push(g);
  }
  for (let i = 0; i < (mobile ? 26 : 48); i++) enemy(i);

  const impacts = [];
  const projectiles = [];

  function impact(pos, color, size = .75) {
    const group = new THREE.Group();
    group.position.copy(pos);
    const m = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: .9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = mesh(new THREE.RingGeometry(size * .35, size, 24), m, [0, .04, 0], [-Math.PI / 2, 0, 0]);
    const orb = mesh(new THREE.SphereGeometry(size * .2, 10, 8), m, [0, .25, 0]);
    group.add(ring, orb);
    group.userData = { life: .28, ring, orb };
    fxRoot.add(group);
    impacts.push(group);
  }

  function beam(from, to, color, life = .11) {
    const o = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([from, to]),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending })
    );
    o.userData = { life };
    fxRoot.add(o);
    impacts.push(o);
  }

  function lightning(from, to, color) {
    const pts = [];
    for (let i = 0; i <= 7; i++) {
      const k = i / 7;
      pts.push(new THREE.Vector3().lerpVectors(from, to, k).add(new THREE.Vector3((Math.random() - .5) * .32, (Math.random() - .5) * .24, (Math.random() - .5) * .32)));
    }
    const o = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending })
    );
    o.userData = { life: .12 };
    fxRoot.add(o);
    impacts.push(o);
  }

  function shoot(t, target) {
    if (!target) return;
    const start = new THREE.Vector3();
    towerRoot.getWorldPosition(start);
    start.y += 3.2;
    const end = target.position.clone();
    end.y += .65;

    if (t.id === 'sniper') {
      beam(start, end, t.glow, .12);
      impact(end, t.glow, .8);
      return;
    }
    if (t.id === 'tesla') {
      lightning(start, end, t.glow);
      const near = enemies
        .filter((e) => e !== target)
        .sort((a, b) => a.position.distanceTo(target.position) - b.position.distanceTo(target.position))
        .slice(0, 2);
      let prev = end;
      for (const e of near) {
        const next = e.position.clone().add(new THREE.Vector3(0, .65, 0));
        lightning(prev, next, t.glow);
        prev = next;
      }
      impact(end, t.glow, .7);
      return;
    }
    if (t.id === 'frost') {
      impact(end, t.glow, 1.5);
      return;
    }

    const orb = mesh(
      new THREE.SphereGeometry(t.id === 'cannon' ? .24 : .17, 10, 8),
      new THREE.MeshBasicMaterial({ color: t.glow, blending: THREE.AdditiveBlending }),
      start.toArray()
    );
    fxRoot.add(orb);
    projectiles.push({ mesh: orb, start: start.clone(), target, t: 0, type: t.id, color: t.glow });
  }

  for (const t of Object.values(T)) {
    const c = document.createElement('div');
    c.className = 'card';
    c.dataset.id = t.id;
    c.style.setProperty('--glow', t.hex);
    c.style.setProperty('--trim', '#' + t.trim.toString(16).padStart(6, '0'));
    c.innerHTML = `<div class="thumb"><div class="base"></div><div class="body"></div><div class="core"></div><div class="gun"></div></div><b>${t.name}</b><span>${t.role}</span>`;
    c.addEventListener('click', () => select(t.id));
    els.dock?.appendChild(c);
  }

  let current = 'plasma';
  let mode = 'combat';
  let cooldown = .35;

  function select(id) {
    current = id;
    const t = T[id];
    factory.build(id);
    document.querySelectorAll('.card').forEach((c) => c.classList.toggle('on', c.dataset.id === id));
    if (els.name) els.name.textContent = t.name;
    if (els.role) els.role.textContent = t.role;
    if (els.cost) els.cost.textContent = t.cost;
    if (els.range) els.range.textContent = t.range;
    if (els.rate) els.rate.textContent = t.rate.toFixed(2) + '/s';
    if (els.damage) els.damage.textContent = t.damage;
    if (els.desc) els.desc.textContent = t.desc;
    cooldown = .18;
  }

  els.combat?.addEventListener('click', () => {
    mode = 'combat';
    els.combat.classList.add('on');
    els.idle?.classList.remove('on');
  });
  els.idle?.addEventListener('click', () => {
    mode = 'idle';
    els.idle.classList.add('on');
    els.combat?.classList.remove('on');
  });

  select(current);

  const clock = new THREE.Clock();
  let elapsed = 0;
  let firstFrame = true;

  function tick() {
    requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), .033);
    elapsed += dt;

    enemies.forEach((e, i) => {
      const d = e.userData;
      d.angle += d.speed * dt;
      const r = d.radius + Math.sin(elapsed * .55 + i) * .18;
      e.position.set(Math.cos(d.angle) * r, .06 + Math.sin(elapsed * 3 + d.bob) * .04, Math.sin(d.angle) * r);
      e.rotation.y = -d.angle + Math.PI / 2;
    });

    const target = enemies.reduce((a, b) => (!a || b.position.length() < a.position.length() ? b : a), null);
    factory.animate(elapsed, dt, target, mode);

    if (mode === 'combat' && target) {
      cooldown -= dt;
      if (cooldown <= 0) {
        shoot(T[current], target);
        cooldown = { plasma: .62, frost: .9, sniper: 1.28, tesla: .68, cannon: 1.05 }[current];
      }
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.t += dt * (p.type === 'cannon' ? 1.05 : 2);
      const end = p.target.position.clone().add(new THREE.Vector3(0, .65, 0));
      if (p.t >= 1) {
        impact(end, p.color, p.type === 'cannon' ? 1.45 : .9);
        fxRoot.remove(p.mesh);
        projectiles.splice(i, 1);
        continue;
      }
      const pos = p.start.clone().lerp(end, p.t);
      if (p.type === 'cannon') pos.y += Math.sin(p.t * Math.PI) * 2.7;
      p.mesh.position.copy(pos);
    }

    for (let i = impacts.length - 1; i >= 0; i--) {
      const o = impacts[i];
      o.userData.life -= dt;
      if (o.userData.life <= 0) {
        fxRoot.remove(o);
        impacts.splice(i, 1);
        continue;
      }
      if (o.isLine) {
        o.material.opacity = Math.min(1, o.userData.life * 8);
      } else if (o.userData.ring) {
        o.userData.ring.scale.addScalar(dt * 3);
        o.userData.ring.material.opacity = o.userData.life * 3;
        o.userData.orb.scale.addScalar(dt * 2);
        o.userData.orb.material.opacity = o.userData.life * 2.4;
      }
    }

    render();
    if (firstFrame) {
      firstFrame = false;
      requestAnimationFrame(hideLoader);
    }
  }

  tick();
} catch (err) {
  showRuntimeError(err);
}
