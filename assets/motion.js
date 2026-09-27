/* ==========================================================================
   Newsign Labs — motion layer
   Progressive enhancement on top of the compiled React app:
   intro loader, Lenis smooth scroll, a WebGL (three.js) stage with an
   iridescent "signal" sculpture + particle field, 3D tilt cards, magnetic
   buttons, custom cursor, scroll-linked 3D planes, marquee and count-ups.
   Everything degrades gracefully: no WebGL -> the original CSS orb stays.
   ========================================================================== */

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const isSmall = () => innerWidth < 768;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

const state = {
  scrollY: scrollY,
  velocity: 0,
  vh: innerHeight,
  mouseX: 0, // -1..1
  mouseY: 0,
  lenis: null,
};

const tickers = new Set();
function loop(time) {
  if (state.lenis) state.lenis.raf(time);
  for (const fn of tickers) fn(time);
  requestAnimationFrame(loop);
}

/* ---------------------------------------------------------------- loader */
const loader = document.querySelector('.nl-loader');
const loaderStart = performance.now();
// hold the hero entrance until the loader curtain lifts
if (loader && !reduceMotion) document.documentElement.classList.add('nl-loading');
let loaderProgress = 0;
const loaderTimer = loader && setInterval(() => {
  loaderProgress = Math.min(loaderProgress + Math.random() * 18, 92);
  setLoader(loaderProgress);
}, 120);
function setLoader(p) {
  if (!loader) return;
  const bar = loader.querySelector('.nl-loader__bar span');
  const count = loader.querySelector('.nl-loader__count');
  if (bar) bar.style.width = `${p}%`;
  if (count) count.textContent = `${String(Math.round(p)).padStart(3, '0')}%`;
}
function finishLoader() {
  if (!loader) return;
  clearInterval(loaderTimer);
  const wait = Math.max(0, 900 - (performance.now() - loaderStart));
  setTimeout(() => {
    setLoader(100);
    setTimeout(() => {
      loader.classList.add('is-done');
      document.documentElement.classList.remove('nl-loading');
      setTimeout(() => loader.remove(), 1200);
    }, 220);
  }, reduceMotion ? 0 : wait);
}

/* ------------------------------------------------------- wait for React */
function whenReady(selector) {
  return new Promise((resolve) => {
    const found = document.querySelector(selector);
    if (found) return resolve(found);
    const mo = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) { mo.disconnect(); resolve(el); }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  });
}

whenReady('#top').then(() => {
  const shell = document.querySelector('.site-shell');
  initSmoothScroll(shell);
  initPointer();
  initHero();
  initMarquee();
  initPlanes();
  initTilt();
  initMagnetic();
  initCursor();
  initCounters();
  initHeader();
  requestAnimationFrame(loop);
  Promise.race([
    initStage(shell),
    new Promise((r) => setTimeout(r, 2500)),
  ]).finally(finishLoader);
});

/* --------------------------------------------------------- smooth scroll */
function initSmoothScroll(shell) {
  addEventListener('scroll', () => { state.scrollY = scrollY; }, { passive: true });
  addEventListener('resize', () => { state.vh = innerHeight; });

  const headerOffset = () => -(document.querySelector('header')?.offsetHeight || 0);

  if (reduceMotion || !window.Lenis) return;

  const lenis = new window.Lenis({
    lerp: 0.085,
    smoothWheel: true,
    wheelMultiplier: 1,
    prevent: (node) => !!node.closest?.('[role="dialog"]'),
  });
  state.lenis = lenis;
  lenis.on('scroll', (l) => {
    state.scrollY = l.scroll;
    state.velocity = l.velocity;
  });

  // The app's nav calls el.scrollIntoView({behavior:'smooth'}): route it
  // through Lenis so it eases the same way and clears the fixed header.
  const native = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (arg) {
    if (arg && typeof arg === 'object' && arg.behavior === 'smooth' && state.lenis) {
      state.lenis.scrollTo(this, { offset: this.id === 'top' ? 0 : headerOffset(), duration: 1.6 });
      return;
    }
    return native.call(this, arg);
  };

  // Freeze page scroll while a modal is open.
  if (shell) {
    new MutationObserver(() => {
      if (shell.querySelector(':scope > [role="dialog"]')) lenis.stop();
      else lenis.start();
    }).observe(shell, { childList: true });
  }
}

/* --------------------------------------------------------------- pointer */
function initPointer() {
  addEventListener('pointermove', (e) => {
    state.mouseX = (e.clientX / innerWidth) * 2 - 1;
    state.mouseY = -((e.clientY / innerHeight) * 2 - 1);
  }, { passive: true });
}

/* ------------------------------------------------------------------ hero */
function initHero() {
  const hero = document.getElementById('top');
  const content = hero.querySelector(':scope > .relative.z-10');
  const bottom = hero.querySelector(':scope > .absolute.bottom-8');
  if (content) content.classList.add('nl-hero-content');
  if (reduceMotion) return;
  tickers.add(() => {
    const p = clamp(state.scrollY / state.vh, 0, 1.2);
    if (content) {
      content.style.transform = `translate3d(0, ${p * 140}px, 0) scale(${1 - p * 0.06})`;
      content.style.opacity = `${1 - p * 1.1}`;
    }
    if (bottom) bottom.style.opacity = `${1 - p * 3}`;
  });
}

/* --------------------------------------------------------------- marquee */
function initMarquee() {
  const hero = document.getElementById('top');
  if (!hero || document.querySelector('.nl-marquee')) return;
  const words = ['Websites that move', 'Web development', '3D & motion', 'E-commerce', 'Brand systems', 'Product design', 'AI design lab'];
  const group = words.map((w) => `<span class="nl-marquee__item">${w}<i class="nl-marquee__star"></i></span>`).join('');
  const band = document.createElement('div');
  band.className = 'nl-marquee';
  band.setAttribute('aria-hidden', 'true');
  band.innerHTML = `<div class="nl-marquee__rail"><div class="nl-marquee__track">${group}${group}</div></div>`;
  hero.insertAdjacentElement('afterend', band);

  if (reduceMotion) return;
  // scroll velocity nudges the band's speed and skew
  let skew = 0;
  tickers.add(() => {
    skew = lerp(skew, clamp(state.velocity * 0.35, -8, 8), 0.1);
    band.firstElementChild.style.transform = `rotateX(18deg) rotateZ(-2.2deg) skewX(${-skew}deg) scale(1.04)`;
  });
}

/* --------------------------------------------------- scroll-linked planes */
function initPlanes() {
  if (reduceMotion) return;
  const planes = [
    document.querySelector('#services .grid'),
    document.querySelector('#work .grid'),
    document.querySelector('#approach .relative.grid'),
  ].filter(Boolean);
  planes.forEach((el) => el.classList.add('nl-plane'));

  let tops = [];
  const measure = () => {
    tops = planes.map((el) => {
      let y = 0, n = el;
      while (n) { y += n.offsetTop; n = n.offsetParent; }
      return y;
    });
  };
  measure();
  addEventListener('resize', measure);
  new ResizeObserver(measure).observe(document.body);

  tickers.add(() => {
    planes.forEach((el, i) => {
      const top = tops[i] - state.scrollY;
      const p = clamp((state.vh - top) / (state.vh * 0.6), 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.style.setProperty('--nl-p-inv', (1 - eased).toFixed(4));
    });
  });
}

/* ------------------------------------------------------------ tilt cards */
function initTilt() {
  if (!finePointer || reduceMotion) return;
  const cards = document.querySelectorAll('.service-card, .work-tile, [data-testid^="card-testimonial"]');
  cards.forEach((card) => {
    card.classList.add('nl-tilt');
    const max = card.classList.contains('work-tile') ? 6 : 10;
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.classList.add('is-tilting');
      card.style.setProperty('--ry', `${(x - 0.5) * max * 2}deg`);
      card.style.setProperty('--rx', `${(0.5 - y) * max * 2}deg`);
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
      card.style.setProperty('--glare', '1');
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--glare', '0');
    });
  });
}

/* -------------------------------------------------------------- magnetic */
function initMagnetic() {
  if (!finePointer || reduceMotion) return;
  const els = document.querySelectorAll([
    '[data-testid="button-open-project-header"]',
    '[data-testid="button-open-project-hero"]',
    '[data-testid="button-open-project-contact"]',
    '[data-testid="button-logo-home"]',
    '.social-gradient-link',
  ].join(','));
  els.forEach((el) => {
    el.classList.add('nl-magnetic');
    const strength = el.matches('.social-gradient-link') ? 0.5 : 0.3;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.classList.add('is-pulled');
      el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-pulled');
      el.style.transform = '';
    });
  });
}

/* ---------------------------------------------------------------- cursor */
function initCursor() {
  if (!finePointer || reduceMotion) return;
  const ring = document.createElement('div');
  const dot = document.createElement('div');
  ring.className = 'nl-cursor';
  dot.className = 'nl-cursor-dot';
  document.body.append(ring, dot);
  document.documentElement.classList.add('nl-has-cursor');

  let x = -100, y = -100, rx = -100, ry = -100;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    ring.classList.add('is-visible');
    dot.classList.add('is-visible');
  }, { passive: true });
  document.addEventListener('pointerleave', () => {
    ring.classList.remove('is-visible');
    dot.classList.remove('is-visible');
  });
  addEventListener('pointerdown', () => ring.classList.add('is-down'));
  addEventListener('pointerup', () => ring.classList.remove('is-down'));
  document.addEventListener('pointerover', (e) => {
    const hit = e.target.closest?.('a, button, select, label, [role="button"]');
    ring.classList.toggle('is-hover', !!hit);
    dot.classList.toggle('is-hover', !!hit);
  });

  tickers.add(() => {
    rx = lerp(rx, x, 0.18);
    ry = lerp(ry, y, 0.18);
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });
}

/* ------------------------------------------------------------- counters */
function initCounters() {
  const nums = [...document.querySelectorAll('section p.font-display')]
    .filter((p) => /^\d+(\.\d+)?[×xk]?$/.test(p.textContent.trim()));
  if (!nums.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      const el = entry.target;
      const original = el.textContent;
      if (reduceMotion) return;
      const m = original.trim().match(/^(\d+(?:\.(\d+))?)(.*)$/);
      const target = parseFloat(m[1]);
      const decimals = m[2] ? m[2].length : 0;
      const suffix = m[3];
      el.classList.add('nl-count');
      const t0 = performance.now();
      const dur = 1600;
      const step = (now) => {
        const t = clamp((now - t0) / dur, 0, 1);
        const e = 1 - Math.pow(1 - t, 4);
        el.textContent = t < 1 ? `${(target * e).toFixed(decimals)}${suffix}` : original;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  nums.forEach((n) => io.observe(n));
}

/* ---------------------------------------------------------------- header */
function initHeader() {
  const header = document.querySelector('header');
  if (!header || reduceMotion) return;
  header.style.transition = 'transform .6s cubic-bezier(.2,.75,.2,1), background-color .4s';
  let last = 0, hidden = false;
  tickers.add(() => {
    const y = state.scrollY;
    const menuOpen = header.children.length > 1;
    const shouldHide = !menuOpen && y > state.vh * 0.9 && y > last + 2;
    const shouldShow = menuOpen || y < last - 2 || y < state.vh * 0.9;
    if (shouldHide && !hidden) { header.style.transform = 'translate3d(0,-100%,0)'; hidden = true; }
    else if (shouldShow && hidden) { header.style.transform = ''; hidden = false; }
    last = y;
  });
}

/* ================================================================= WebGL */
async function initStage(shell) {
  if (!shell) return;
  let THREE;
  try {
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return;
    THREE = await import('./vendor/three.module.min.js');
  } catch (err) {
    console.warn('[motion] WebGL stage disabled:', err);
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'nl-stage';
  canvas.setAttribute('aria-hidden', 'true');
  shell.prepend(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    canvas.remove();
    console.warn('[motion] WebGL stage disabled:', err);
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, isSmall() ? 1.5 : 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  const BRAND = [0xffe878, 0xff964d, 0x62b7ff, 0xc68cff].map((c) => new THREE.Color(c));
  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.24 },
    uMouse: { value: new THREE.Vector3() },
    uOpacity: { value: 1 },
    uC0: { value: BRAND[0] }, uC1: { value: BRAND[1] }, uC2: { value: BRAND[2] }, uC3: { value: BRAND[3] },
  };

  /* --- the signal sculpture: noise-displaced iridescent sphere --- */
  const NOISE = /* glsl */`
    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){
      const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
      vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
      vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
      vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
      i=mod289(i);
      vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
      float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
      vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
      vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
      vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
      vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
      p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
      vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
      return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }`;

  const blobVertex = /* glsl */`
    uniform float uTime; uniform float uAmp; uniform vec3 uMouse;
    varying vec3 vNormal; varying vec3 vWorldPos; varying float vNoise;
    ${NOISE}
    float field(vec3 p){
      float n = snoise(p*0.75 + vec3(0.0, uTime*0.18, uTime*0.12));
      n += 0.18*snoise(p*1.9 - vec3(uTime*0.22));
      float pull = smoothstep(1.4, 0.0, distance(normalize(p), normalize(uMouse + vec3(0.0001))));
      return n*uAmp + pull*length(uMouse)*0.18;
    }
    vec3 displace(vec3 p){ return p + normalize(p) * field(p); }
    void main(){
      vec3 p = displace(position);
      vec3 t = normalize(cross(normal, abs(normal.y) < 0.99 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0)));
      vec3 b = normalize(cross(normal, t));
      float e = 0.01;
      vec3 pt = displace(position + t*e);
      vec3 pb = displace(position + b*e);
      vec3 n = normalize(cross(pt - p, pb - p));
      if (dot(n, normal) < 0.0) n = -n;
      vNoise = field(position);
      vNormal = normalize(mat3(modelMatrix) * n);
      vec4 world = modelMatrix * vec4(p, 1.0);
      vWorldPos = world.xyz;
      gl_Position = projectionMatrix * viewMatrix * world;
    }`;

  const blobFragment = /* glsl */`
    uniform float uTime; uniform float uOpacity;
    uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
    varying vec3 vNormal; varying vec3 vWorldPos; varying float vNoise;
    vec3 brand(float t){
      t = fract(t) * 4.0;
      if (t < 1.0) return mix(uC0, uC1, smoothstep(0.0,1.0,t));
      if (t < 2.0) return mix(uC1, uC2, smoothstep(1.0,2.0,t));
      if (t < 3.0) return mix(uC2, uC3, smoothstep(2.0,3.0,t));
      return mix(uC3, uC0, smoothstep(3.0,4.0,t));
    }
    void main(){
      vec3 N = normalize(vNormal);
      vec3 V = normalize(cameraPosition - vWorldPos);
      float ndv = max(dot(N, V), 0.0);
      float fres = pow(1.0 - ndv, 2.4);
      float band = dot(N, normalize(vec3(0.4, 0.9, 0.3))) * 0.45 + vNoise * 0.8 + uTime * 0.04 + fres * 0.6;
      vec3 base = brand(band);
      vec3 L = normalize(vec3(-0.6, 0.8, 0.9));
      float lam = max(dot(N, L), 0.0);
      vec3 H = normalize(L + V);
      float spec = pow(max(dot(N, H), 0.0), 60.0);
      vec3 ink = vec3(0.063, 0.051, 0.082);
      vec3 col = mix(ink, base, 0.25 + 0.75 * lam);
      col += brand(band + 0.5) * fres * 1.1;
      col += vec3(1.0, 0.97, 0.9) * spec * 0.9;
      col = mix(col, col * 0.55, smoothstep(0.35, 0.0, lam) * (1.0 - fres));
      gl_FragColor = vec4(col, uOpacity);
    }`;

  const hero = new THREE.Group();
  scene.add(hero);

  const detail = isSmall() ? 36 : 56;
  const blob = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.25, detail),
    new THREE.ShaderMaterial({ uniforms, vertexShader: blobVertex, fragmentShader: blobFragment, transparent: true })
  );
  hero.add(blob);

  // halo glow behind the sculpture
  const glowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, 'rgba(160,140,255,0.55)');
    grd.addColorStop(0.35, 'rgba(98,183,255,0.18)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }));
  glow.scale.setScalar(7.5);
  glow.position.z = -1.5;
  hero.add(glow);

  // orbit rings
  const rings = [];
  [[2.05, 0xffe878, 1.15, 0.35], [2.45, 0x62b7ff, -0.6, 1.2], [2.8, 0xc68cff, 0.3, -0.9]].forEach(([r, c, rx, ry], i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, i === 0 ? 0.012 : 0.007, 12, 220),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: i === 0 ? 0.75 : 0.45, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    ring.rotation.set(rx, ry, 0);
    ring.userData.speed = (i % 2 ? -1 : 1) * (0.12 + i * 0.05);
    hero.add(ring);
    rings.push(ring);
  });

  // satellites riding the rings
  const satellites = rings.map((ring, i) => {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(i === 0 ? 0.07 : 0.05, 16, 16),
      new THREE.MeshBasicMaterial({ color: BRAND[[0, 2, 3][i]] })
    );
    ring.add(s);
    s.userData.r = ring.geometry.parameters.radius;
    s.userData.offset = i * 2.1;
    return s;
  });

  // wire shell
  const shellWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.75, 1)),
    new THREE.LineBasicMaterial({ color: 0xf5f0e7, transparent: true, opacity: 0.08 })
  );
  hero.add(shellWire);

  /* --- closing sculpture: a torus knot that floats behind the contact panel --- */
  const knotUniforms = { ...uniforms, uAmp: { value: 0.06 }, uOpacity: { value: 0.9 } };
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.9, 0.28, isSmall() ? 180 : 320, 40, 2, 3),
    new THREE.ShaderMaterial({ uniforms: knotUniforms, vertexShader: blobVertex, fragmentShader: blobFragment, transparent: true })
  );
  scene.add(knot);

  /* --- particle field that runs the full length of the page --- */
  const COUNT = isSmall() ? 700 : 1800;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(COUNT * 3);
  const pCol = new Float32Array(COUNT * 3);
  const pSize = new Float32Array(COUNT);
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSize, 1));
  const pMat = new THREE.ShaderMaterial({
    uniforms: { uTime: uniforms.uTime, uPixel: { value: renderer.getPixelRatio() } },
    vertexShader: /* glsl */`
      uniform float uTime; uniform float uPixel;
      attribute float aSize; varying vec3 vColor; varying float vFade;
      void main(){
        vColor = color;
        vec3 p = position;
        p.x += sin(uTime * 0.2 + position.y * 0.5) * 0.15;
        p.y += cos(uTime * 0.15 + position.x * 0.4) * 0.12;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPixel * (14.0 / -mv.z);
        vFade = smoothstep(26.0, 6.0, -mv.z);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vColor; varying float vFade;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, a * a * 0.85 * vFade);
      }`,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* --- layout: map page pixels to world units --- */
  const PARALLAX = 0.72; // camera travels slower than the page -> depth
  let unitsPerPx = 0, halfW = 0, halfH = 0, pageH = 0, knotY = 0, knotX = 0;
  const heroBase = new THREE.Vector3();
  let heroScale = 1;

  function layout() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    halfW = halfH * camera.aspect;
    unitsPerPx = (halfH * 2) / h;
    pageH = document.documentElement.scrollHeight;

    if (w < 768) {
      heroBase.set(halfW * 0.38, -halfH * 0.52, 0);
      heroScale = Math.min(1, (halfW * 0.9) / 2.8);
      uniforms.uOpacity.value = 0.85;
    } else {
      heroBase.set(halfW * 0.44, halfH * 0.02, 0);
      heroScale = Math.min(1.1, (halfH * 0.86) / 2.8);
      uniforms.uOpacity.value = 1;
    }
    hero.scale.setScalar(heroScale);

    const contact = document.getElementById('contact');
    if (contact) {
      let y = 0, n = contact;
      while (n) { y += n.offsetTop; n = n.offsetParent; }
      const centreScroll = y + contact.offsetHeight / 2 - h / 2;
      knotY = -centreScroll * unitsPerPx * PARALLAX;
      knotX = w < 768 ? halfW * 0.45 : halfW * 0.5;
      knot.scale.setScalar(w < 768 ? 0.75 : 1.1);
    }

    // particles cover the whole scroll distance
    const depth = pageH * unitsPerPx * PARALLAX + halfH * 2;
    for (let i = 0; i < COUNT; i++) {
      const z = -Math.random() * 16 + 2.5;
      const spread = (camera.position.z - z) / camera.position.z;
      pPos[i * 3] = (Math.random() * 2 - 1) * halfW * spread * 1.1;
      pPos[i * 3 + 1] = halfH * 1.2 - Math.random() * depth;
      pPos[i * 3 + 2] = z;
      const c = BRAND[(Math.random() * 4) | 0].clone().lerp(new THREE.Color(0xf5f0e7), Math.random() * 0.5);
      pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b;
      pSize[i] = Math.random() < 0.08 ? 2.4 + Math.random() * 2 : 0.6 + Math.random() * 1.1;
    }
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.color.needsUpdate = true;
    pGeo.attributes.aSize.needsUpdate = true;
    pGeo.computeBoundingSphere();
  }
  layout();
  let resizeRaf = 0;
  const scheduleLayout = () => { cancelAnimationFrame(resizeRaf); resizeRaf = requestAnimationFrame(layout); };
  addEventListener('resize', scheduleLayout);
  let lastPageH = pageH;
  new ResizeObserver(() => {
    const h = document.documentElement.scrollHeight;
    if (Math.abs(h - lastPageH) > 40) { lastPageH = h; scheduleLayout(); }
  }).observe(document.body);

  /* --- animate --- */
  const clock = new THREE.Clock();
  let mx = 0, my = 0, vel = 0, running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) clock.getDelta();
  });

  tickers.add(() => {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const speed = reduceMotion ? 0 : 1;
    uniforms.uTime.value += dt * speed;

    mx = lerp(mx, state.mouseX, 0.05);
    my = lerp(my, state.mouseY, 0.05);
    vel = lerp(vel, clamp(Math.abs(state.velocity) / 40, 0, 1), 0.08);
    uniforms.uAmp.value = 0.24 + vel * 0.22;
    uniforms.uMouse.value.set(mx * 1.4, my * 1.4, 1.2);

    // camera travels down with the page (slower -> parallax depth)
    const camY = -state.scrollY * unitsPerPx * PARALLAX;
    camera.position.x = lerp(camera.position.x, mx * 0.35, 0.06);
    camera.position.y = camY + my * 0.25;
    camera.lookAt(camera.position.x * 0.5, camY, 0);

    // hero sculpture: drifts back and spins as the hero scrolls away
    const hp = clamp(state.scrollY / state.vh, 0, 1.5);
    hero.position.set(heroBase.x + mx * 0.25, heroBase.y + my * 0.2 + hp * 0.9, heroBase.z - hp * 2.2);
    blob.rotation.y += dt * 0.12 * speed;
    blob.rotation.x = my * 0.25 + hp * 0.8;
    blob.rotation.z = mx * 0.15;
    shellWire.rotation.y -= dt * 0.08 * speed;
    shellWire.rotation.x = hp * 1.4;
    rings.forEach((ring, i) => {
      ring.rotation.z += dt * ring.userData.speed * speed;
      ring.rotation.x += (my * 0.2 - ring.rotation.x + [1.15, -0.6, 0.3][i] + hp * 0.6) * 0.04;
      const s = satellites[i];
      const a = uniforms.uTime.value * (0.6 + i * 0.25) + s.userData.offset;
      s.position.set(Math.cos(a) * s.userData.r, Math.sin(a) * s.userData.r, 0);
    });

    // contact knot
    knot.position.set(knotX + mx * 0.2, knotY + my * 0.2, -1);
    knot.rotation.x = uniforms.uTime.value * 0.2 * speed + (state.scrollY * 0.0008);
    knot.rotation.y = uniforms.uTime.value * 0.15 * speed + mx * 0.4;

    particles.rotation.y = mx * 0.04;

    renderer.render(scene, camera);
  });

  document.documentElement.classList.add('webgl-on');
  requestAnimationFrame(() => canvas.classList.add('is-ready'));
}
