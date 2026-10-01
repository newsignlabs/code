/* ==========================================================================
   Newsign Labs — glass 3D logo
   The four-tile mark rebuilt as bevelled glass blocks. Each tile carries the
   exact gradient from logo.svg (baked into vertex colours), refracts a soft
   brand-coloured backdrop and catches an environment of coloured light.
   The tiles breathe apart and back together and follow the pointer.
   ========================================================================== */

// Tile layout and gradients taken from assets/logo.svg (500 x 500 viewBox).
const SIZE = 244.4;
const RADIUS = 23.8;
const TILES = [
  // centre (svg px), gradient start -> end (svg px), colours
  { c: [122.2, 122.5], from: [122.2, 367.1], to: [366.9, 122.5], c0: 0xffff00, c1: 0xff9900, dir: [-1, 1] },
  { c: [377.7, 122.5], from: [133.0, 122.5], to: [377.7, 367.1], c0: 0xff9900, c1: 0x00ffff, dir: [1, 1] },
  { c: [122.2, 377.5], from: [366.9, 377.5], to: [122.2, 132.9], c0: 0x9900ff, c1: 0xffff00, dir: [-1, -1] },
  { c: [377.7, 377.5], from: [377.7, 132.9], to: [133.0, 377.5], c0: 0x00ffff, c1: 0x9900ff, dir: [1, -1] },
];

export function initGlassLogo(THREE, { reduceMotion = false } = {}) {
  const stage = document.querySelector('.nl-glass-stage');
  if (!stage || stage.querySelector('canvas')) return;

  const canvas = document.createElement('canvas');
  stage.append(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    canvas.remove();
    return;
  }
  stage.classList.add('is-live');
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0, 13);

  /* --- environment: a dark room with coloured light panels, pre-filtered --- */
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x0e0b14);
  const panel = (color, intensity, pos, scale) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.scale.set(...scale);
    m.lookAt(0, 0, 0);
    envScene.add(m);
  };
  panel(0xffffff, 3.5, [0, 6, 4], [10, 2, 1]);
  panel(0xffe878, 2.2, [-7, 2, 2], [3, 8, 1]);
  panel(0x62b7ff, 2.4, [7, -1, 3], [3, 8, 1]);
  panel(0xc68cff, 2.0, [0, -6, -3], [10, 3, 1]);
  panel(0xff964d, 1.6, [-4, -3, -6], [5, 4, 1]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(envScene, 0.02).texture;
  scene.environment = envTex;

  /* --- backdrop the glass refracts: soft brand blobs --- */
  const backTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d');
    const blob = (x, y, r, col) => {
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, col);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 512, 512);
    };
    blob(150, 150, 200, 'rgba(255,232,120,.55)');
    blob(370, 160, 210, 'rgba(98,183,255,.55)');
    blob(170, 380, 210, 'rgba(198,140,255,.55)');
    blob(360, 370, 190, 'rgba(255,150,77,.5)');
    // fade every edge to nothing so the plane never shows as a square
    g.globalCompositeOperation = 'destination-in';
    const mask = g.createRadialGradient(256, 256, 0, 256, 256, 256);
    mask.addColorStop(0, 'rgba(0,0,0,1)');
    mask.addColorStop(0.55, 'rgba(0,0,0,.8)');
    mask.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = mask;
    g.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(c);
  })();
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({ map: backTex, transparent: true, opacity: 0.9, depthWrite: false })
  );
  backdrop.position.z = -3;
  scene.add(backdrop);

  /* --- tiles --- */
  const DEPTH = 0.55, BEVEL = 0.16, BEVEL_SIZE = BEVEL * 0.9;
  // inset by the bevel so the finished tile matches the svg size and gaps
  const S = SIZE / 100, R = Math.max(0.05, RADIUS / 100 - BEVEL_SIZE * 0.5);
  const shape = new THREE.Shape();
  const h = S / 2 - BEVEL_SIZE;
  shape.moveTo(-h + R, -h);
  shape.lineTo(h - R, -h);
  shape.quadraticCurveTo(h, -h, h, -h + R);
  shape.lineTo(h, h - R);
  shape.quadraticCurveTo(h, h, h - R, h);
  shape.lineTo(-h + R, h);
  shape.quadraticCurveTo(-h, h, -h, h - R);
  shape.lineTo(-h, -h + R);
  shape.quadraticCurveTo(-h, -h, -h + R, -h);

  const logo = new THREE.Group();
  scene.add(logo);

  const tiles = TILES.map((t) => {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL_SIZE,
      bevelSegments: 8, curveSegments: 18,
    });
    geo.translate(0, 0, -DEPTH / 2);
    geo.computeVertexNormals();

    // bake the svg gradient into vertex colours
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const c0 = new THREE.Color(t.c0), c1 = new THREE.Color(t.c1), tmp = new THREE.Color();
    const gx = t.to[0] - t.from[0], gy = t.to[1] - t.from[1];
    const len2 = gx * gx + gy * gy;
    for (let i = 0; i < pos.count; i++) {
      const sx = t.c[0] + pos.getX(i) * 100; // svg x
      const sy = t.c[1] - pos.getY(i) * 100; // svg y (down)
      const k = Math.min(1, Math.max(0, ((sx - t.from[0]) * gx + (sy - t.from[1]) * gy) / len2));
      tmp.copy(c0).lerp(c1, k);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      metalness: 0,
      roughness: 0.06,
      transmission: 0.55,
      thickness: 0.9,
      ior: 1.45,
      attenuationDistance: 2.2,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      iridescence: 0.35,
      iridescenceIOR: 1.3,
      envMapIntensity: 1.6,
      specularIntensity: 1,
      transparent: true,
      opacity: 0.96,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const base = new THREE.Vector3((t.c[0] - 250) / 100, (250 - t.c[1]) / 100, 0);
    mesh.position.copy(base);
    mesh.userData = { base, dir: new THREE.Vector3(t.dir[0], t.dir[1], 0).normalize(), seed: Math.random() * 10 };
    logo.add(mesh);
    return mesh;
  });

  // thin bright edge glints on the front face of each tile
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 });
  tiles.forEach((mesh) => {
    const pts = shape.getPoints(24).map((p) => new THREE.Vector3(p.x * 0.985, p.y * 0.985, DEPTH / 2 + BEVEL + 0.002));
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), edgeMat);
    mesh.add(line);
  });

  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-3, 5, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0x62b7ff, 25, 20, 1.5);
  rim.position.set(4, -2, 3);
  scene.add(rim);

  /* --- interaction + sizing --- */
  let tx = 0, ty = 0, px = 0, py = 0, hover = 0, hoverT = 0;
  const section = stage.closest('section') || stage;
  section.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    tx = Math.max(-1, Math.min(1, ((e.clientX - (r.left + r.width / 2)) / (r.width / 2))));
    ty = Math.max(-1, Math.min(1, ((e.clientY - (r.top + r.height / 2)) / (r.height / 2))));
  });
  section.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
  stage.addEventListener('pointerenter', () => { hoverT = 1; });
  stage.addEventListener('pointerleave', () => { hoverT = 0; });

  const resize = () => {
    const w = stage.clientWidth, hh = stage.clientHeight;
    if (!w || !hh) return;
    renderer.setSize(w, hh, false);
    camera.aspect = w / hh;
    // fit the 5-unit logo (plus breathing room) into the stage
    const fitH = 7.4 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const fitW = fitH / Math.min(1, camera.aspect);
    camera.position.z = Math.max(fitH, fitW);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 }).observe(stage);

  const clock = new THREE.Clock();
  let time = 0;
  const render = () => {
    requestAnimationFrame(render);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible || document.hidden) return;
    if (!reduceMotion) time += dt;

    px += (tx - px) * 0.06;
    py += (ty - py) * 0.06;
    hover += (hoverT - hover) * 0.08;

    // breathe: tiles drift apart along their diagonals, then lock back in
    const cycle = reduceMotion ? 0 : (Math.sin(time * 0.9) * 0.5 + 0.5);
    const spread = 0.04 + cycle * 0.32 + hover * 0.35;
    tiles.forEach((m, i) => {
      const { base, dir, seed } = m.userData;
      m.position.copy(base).addScaledVector(dir, spread);
      m.position.z = Math.sin(time * 1.3 + seed) * 0.18 + hover * (i % 2 ? 0.35 : -0.35);
      m.rotation.x = Math.sin(time * 0.8 + seed) * 0.08 * (1 + hover * 2);
      m.rotation.y = Math.cos(time * 0.7 + seed) * 0.1 * (1 + hover * 2);
    });

    logo.rotation.y = -0.45 + Math.sin(time * 0.35) * 0.25 + px * 0.5;
    logo.rotation.x = 0.28 + Math.cos(time * 0.3) * 0.08 + py * 0.35;
    logo.position.y = Math.sin(time * 0.9) * 0.08;
    backdrop.rotation.z = time * 0.05;

    renderer.render(scene, camera);
  };
  requestAnimationFrame(render);
}
