/* ==========================================================================
   Newsign Labs — "How we move" lab
   A WebGL scene for the section-03 card. A swarm of glossy blocks
   re-assembles into one form per process step:
     01 Find the sharp edge -> a faceted crystal
     02 Make it tangible    -> a solid voxel block
     03 Turn up the signal  -> pulsing signal rings
   Auto-cycles while visible; hovering a process row jumps to its step.
   ========================================================================== */

const STEPS = [
  { title: 'Find the sharp edge', tag: 'Crystal · faceted' },
  { title: 'Make it tangible', tag: 'Voxel · assembled' },
  { title: 'Turn up the signal', tag: 'Signal · broadcasting' },
];
const BRAND = [0xffe878, 0xff964d, 0x62b7ff, 0xc68cff];

export function initLab(THREE, { reduceMotion = false } = {}) {
  const scene3d = document.querySelector('#approach .model-scene');
  const card = scene3d?.parentElement;
  if (!card || card.querySelector('.nl-lab-canvas')) return;

  const small = innerWidth < 768;
  const SIDE = small ? 6 : 7;
  const N = SIDE ** 3;

  /* ---------- DOM ---------- */
  const canvas = document.createElement('canvas');
  canvas.className = 'nl-lab-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  scene3d.after(canvas);

  const hud = document.createElement('div');
  hud.className = 'nl-lab-hud';
  hud.setAttribute('aria-hidden', 'true');
  hud.innerHTML = `
    <div class="nl-lab-hud__step"><span class="nl-lab-hud__num">01</span><span class="nl-lab-hud__title"></span></div>
    <div class="nl-lab-hud__bars">${STEPS.map(() => '<i><b></b></i>').join('')}</div>`;
  const readout = document.createElement('div');
  readout.className = 'nl-lab-readout';
  readout.setAttribute('aria-hidden', 'true');
  card.append(hud, readout);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    canvas.remove(); hud.remove(); readout.remove();
    return;
  }
  card.classList.add('nl-lab');
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(0, 1.6, 11);
  camera.lookAt(0, 0, 0);

  /* ---------- lights ---------- */
  scene.add(new THREE.HemisphereLight(0xd9c8ff, 0x120e1a, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 6, 5);
  scene.add(key);
  const pYellow = new THREE.PointLight(BRAND[0], 40, 14, 1.6);
  const pBlue = new THREE.PointLight(BRAND[2], 46, 14, 1.6);
  const pPurple = new THREE.PointLight(BRAND[3], 40, 14, 1.6);
  scene.add(pYellow, pBlue, pPurple);

  const world = new THREE.Group();
  scene.add(world);

  /* ---------- the swarm ---------- */
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ metalness: 0.45, roughness: 0.22, envMapIntensity: 1 });
  const mesh = new THREE.InstancedMesh(geo, mat, N);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  world.add(mesh);

  // deterministic random so the layout is stable between reloads
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const brandAt = (t) => {
    t = ((t % 1) + 1) % 1 * BRAND.length;
    const i = Math.floor(t);
    return new THREE.Color(BRAND[i]).lerp(new THREE.Color(BRAND[(i + 1) % BRAND.length]), t - i);
  };

  /* layouts: each is { pos: Vector3[], scale: number[], color: Color[] } */
  function crystal() {
    // uniform samples over the faces of a tall octahedron, plus a dense core seam
    const pos = [], scale = [], color = [];
    const R = 1.75, H = 2.45;
    const verts = [
      [R, 0, 0], [-R, 0, 0], [0, 0, R], [0, 0, -R], [0, H, 0], [0, -H, 0],
    ].map((v) => new THREE.Vector3(...v));
    const faces = [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]];
    for (let i = 0; i < N; i++) {
      const f = faces[i % 8];
      let a = rand(), b = rand();
      if (a + b > 1) { a = 1 - a; b = 1 - b; }
      // bias toward the edges so the silhouette reads sharp
      if (i % 3 === 0) { if (a > b) b *= 0.15; else a *= 0.15; }
      const p = verts[f[0]].clone()
        .add(verts[f[1]].clone().sub(verts[f[0]]).multiplyScalar(a))
        .add(verts[f[2]].clone().sub(verts[f[0]]).multiplyScalar(b));
      pos.push(p);
      scale.push(0.13 + rand() * 0.11);
      color.push(brandAt(0.05 + (p.y / H + 1) * 0.22 + Math.atan2(p.z, p.x) / (Math.PI * 8)));
    }
    return { pos, scale, color };
  }

  function voxel() {
    const pos = [], scale = [], color = [];
    const gap = small ? 0.5 : 0.44;
    const half = (SIDE - 1) / 2;
    for (let x = 0; x < SIDE; x++) for (let y = 0; y < SIDE; y++) for (let z = 0; z < SIDE; z++) {
      const p = new THREE.Vector3((x - half) * gap, (y - half) * gap, (z - half) * gap);
      pos.push(p);
      scale.push(gap * 0.82);
      color.push(brandAt(0.1 + ((x + y + z) / (3 * (SIDE - 1))) * 0.75));
    }
    return { pos, scale, color };
  }

  function signal() {
    const pos = [], scale = [], color = [];
    const radii = [0.35, 0.95, 1.6, 2.25, 2.9];
    const total = radii.reduce((s, r) => s + r, 0);
    let i = 0;
    radii.forEach((r, ri) => {
      const count = ri === radii.length - 1 ? N - i : Math.round((r / total) * N);
      for (let k = 0; k < count; k++, i++) {
        const a = (k / count) * Math.PI * 2;
        pos.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
        scale.push(0.16 - ri * 0.012);
        color.push(brandAt(0.55 + ri * 0.09 + (k / count) * 0.15));
      }
    });
    return { pos, scale, color };
  }

  const layouts = [crystal(), voxel(), signal()];

  // per-instance motion data
  const delay = new Float32Array(N);
  const spinAxis = [];
  for (let i = 0; i < N; i++) {
    spinAxis.push(new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize());
  }
  const setDelays = (target) => {
    // stagger from the centre outwards so each form "grows"
    const L = layouts[target];
    let max = 0;
    for (let i = 0; i < N; i++) max = Math.max(max, L.pos[i].length());
    for (let i = 0; i < N; i++) delay[i] = (L.pos[i].length() / max) * 0.55 + rand() * 0.25;
  };

  /* idle motion layered on each form */
  const idle = (state, i, base, t, out) => {
    out.copy(base);
    if (state === 0) {
      const s = Math.sin(t * 1.4 + base.y * 1.6) * 0.05;
      out.multiplyScalar(1 + s);
    } else if (state === 1) {
      const w = Math.sin(t * 2.2 - (base.x + base.y + base.z) * 1.7);
      out.multiplyScalar(1 + Math.max(0, w) * 0.1);
    } else {
      const r = Math.hypot(base.x, base.z);
      out.y = Math.sin(r * 2.6 - t * 3.2) * 0.32;
    }
    return out;
  };

  /* ---------- blueprint frames per form ---------- */
  const lineMat = (c) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false });
  const crystalFrame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.OctahedronGeometry(1, 0).scale(2.05, 2.85, 2.05)), lineMat(0xffe878));
  const voxelFrame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1).scale(...Array(3).fill(SIDE * (small ? 0.5 : 0.44) + 0.25))), lineMat(0x62b7ff));
  const frames = [crystalFrame, voxelFrame, null];
  world.add(crystalFrame, voxelFrame);

  // signal pulses: expanding rings on the floor plane
  const pulses = [0, 1, 2].map((k) => {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(0.98, 1, 128),
      new THREE.MeshBasicMaterial({ color: BRAND[[3, 2, 0][k]], transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.userData.phase = k / 3;
    world.add(m);
    return m;
  });

  // glowing core
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.34, 4),
    new THREE.MeshStandardMaterial({ color: 0x8f6bff, emissive: 0xc68cff, emissiveIntensity: 0.6, roughness: 0.15, metalness: 0.2 })
  );
  world.add(core);

  // floor glow + dust
  const glowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,0.9)');
    grd.addColorStop(0.4, 'rgba(255,255,255,0.25)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({ map: glowTex, color: 0x8a6cff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.9;
  scene.add(floor);

  const DUST = 260;
  const dGeo = new THREE.BufferGeometry();
  const dPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    dPos[i * 3] = (rand() - 0.5) * 12;
    dPos[i * 3 + 1] = (rand() - 0.5) * 8;
    dPos[i * 3 + 2] = (rand() - 0.5) * 8;
  }
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({
    color: 0xf5f0e7, size: 0.035, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(dust);

  /* ---------- state machine ---------- */
  let from = 1, to = 1;       // start as the block; morphs to the crystal on first view
  let morphStart = -10;       // seconds (scene clock)
  const MORPH = reduceMotion ? 0.001 : 1.5;
  const HOLD = 4.2;
  let lastSwitch = 0, pinnedUntil = 0, time = 0;

  const rows = [...document.querySelectorAll('[data-testid^="row-process-"]')];
  const hudNum = hud.querySelector('.nl-lab-hud__num');
  const hudTitle = hud.querySelector('.nl-lab-hud__title');
  const bars = [...hud.querySelectorAll('.nl-lab-hud__bars i')];

  function goTo(step) {
    if (step === to && time - morphStart < MORPH + 1) return;
    from = to;
    to = step;
    morphStart = time;
    lastSwitch = time;
    setDelays(to);
    hudNum.textContent = String(step + 1).padStart(2, '0');
    hudTitle.textContent = STEPS[step].title;
    bars.forEach((b, i) => b.classList.toggle('is-active', i === step));
    rows.forEach((r, i) => r.classList.toggle('nl-row-active', i === step));
    hud.classList.remove('is-swap');
    void hud.offsetWidth;
    hud.classList.add('is-swap');
  }

  rows.forEach((row, i) => {
    row.addEventListener('pointerenter', () => { pinnedUntil = time + 6; goTo(i); });
    row.addEventListener('focusin', () => { pinnedUntil = time + 6; goTo(i); });
  });

  // pointer parallax over the card
  let px = 0, py = 0, tx = 0, ty = 0;
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  card.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
  card.addEventListener('click', () => { pinnedUntil = time + 6; goTo((to + 1) % STEPS.length); });

  /* ---------- sizing / visibility ---------- */
  const resize = () => {
    const w = card.clientWidth, h = card.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the forms framed whatever the card's shape
    camera.position.z = w / h < 1.1 ? 13.5 : 11;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(card);
  resize();

  let visible = false;
  new IntersectionObserver(([entry]) => {
    const was = visible;
    visible = entry.isIntersecting;
    if (visible && !was && morphStart < 0) goTo(0);
  }, { threshold: 0.15 }).observe(card);

  /* ---------- frame loop ---------- */
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vP = new THREE.Vector3(), vS = new THREE.Vector3();
  const cTmp = new THREE.Color();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clock = new THREE.Clock();

  // seed colours so the first frame is not black
  for (let i = 0; i < N; i++) mesh.setColorAt(i, layouts[1].color[i]);

  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible || document.hidden) return;
    time += reduceMotion ? 0 : dt;

    if (!reduceMotion && time > pinnedUntil && time - lastSwitch > MORPH + HOLD) goTo((to + 1) % STEPS.length);

    const A = layouts[from], B = layouts[to];
    const elapsed = time - morphStart;
    let overall = 0;

    for (let i = 0; i < N; i++) {
      const local = reduceMotion ? 1 : Math.min(1, Math.max(0, (elapsed - delay[i]) / MORPH));
      const e = ease(local);
      overall += e;
      idle(from, i, A.pos[i], time, vA);
      idle(to, i, B.pos[i], time, vB);
      vP.lerpVectors(vA, vB, e);
      // arc outwards mid-flight
      const lift = Math.sin(Math.PI * e);
      vP.addScaledVector(spinAxis[i], lift * 0.9);
      const s = THREE.MathUtils.lerp(A.scale[i], B.scale[i], e) * (1 - lift * 0.35);
      vS.setScalar(s);
      q.setFromAxisAngle(spinAxis[i], lift * Math.PI * 1.5);
      m4.compose(vP, q, vS);
      mesh.setMatrixAt(i, m4);
      cTmp.copy(A.color[i]).lerp(B.color[i], e);
      mesh.setColorAt(i, cTmp);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    const progress = overall / N;

    // frames and pulses fade with the active form
    frames.forEach((f, k) => {
      if (!f) return;
      const w = (k === to ? progress : 0) + (k === from ? 1 - progress : 0);
      f.material.opacity = w * 0.35;
      f.rotation.y = -time * 0.05;
    });
    const sigW = (to === 2 ? progress : 0) + (from === 2 ? 1 - progress : 0);
    pulses.forEach((p) => {
      const ph = (time * 0.35 + p.userData.phase) % 1;
      p.scale.setScalar(0.4 + ph * 3.6);
      p.material.opacity = sigW * (1 - ph) * 0.7;
    });
    core.scale.setScalar(0.45 + sigW * 0.45 + Math.sin(time * 3) * 0.05 * sigW);
    core.material.emissiveIntensity = 0.25 + sigW * 0.55;

    // group motion
    px += (tx - px) * 0.06;
    py += (ty - py) * 0.06;
    world.rotation.y = time * 0.22 + px * 0.6;
    world.rotation.x = 0.18 + py * 0.25 + (to === 2 ? 0.25 * progress : 0);
    world.position.y = Math.sin(time * 0.8) * 0.08;
    dust.rotation.y = time * 0.02;

    // lights orbit so the facets catch colour
    pYellow.position.set(Math.cos(time * 0.7) * 4, 2.5, Math.sin(time * 0.7) * 4);
    pBlue.position.set(Math.cos(time * 0.7 + 2.1) * 4, -1.5, Math.sin(time * 0.7 + 2.1) * 4);
    pPurple.position.set(Math.cos(time * 0.7 + 4.2) * 4, 1, Math.sin(time * 0.7 + 4.2) * 4);

    bars.forEach((b, i) => {
      const fill = i === to ? Math.min(1, Math.max(0, (time - lastSwitch) / (MORPH + HOLD))) : 0;
      b.firstElementChild.style.transform = `scaleX(${fill})`;
    });
    readout.textContent = `${N} units · ${STEPS[to].tag} · ${String(Math.round(progress * 100)).padStart(3, '0')}%`;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
