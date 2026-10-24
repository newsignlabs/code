/* Newsign Labs — standalone pages: the glass logo in 3D (shattered on 404, assembling on maintenance) */
import { initGlassLogo } from '/assets/glasslogo.js?v=98d3e82';
import { hasFastWebGL } from '/assets/webgl.js?v=98d3e82';

const page = document.documentElement.dataset.page;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mode = page === 'maintenance' ? 'assemble' : 'shattered';

if (hasFastWebGL()) import('/assets/vendor/three.custom.min.js')
  .then((THREE) => initGlassLogo(THREE, { selector: '.nl-page-stage', mode, reduceMotion, fit: mode === 'shattered' ? 10.5 : 10 }))
  .catch(() => { /* no WebGL: the SVG logo stays */ });
