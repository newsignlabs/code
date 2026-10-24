/* Newsign Labs — standalone pages: the glass logo in 3D (shattered on 404, assembling on maintenance) */
import { initGlassLogo } from '/assets/glasslogo.js';

const page = document.documentElement.dataset.page;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mode = page === 'maintenance' ? 'assemble' : 'shattered';

import('/assets/vendor/three.module.min.js')
  .then((THREE) => initGlassLogo(THREE, { selector: '.nl-page-stage', mode, reduceMotion, fit: mode === 'shattered' ? 10.5 : 10 }))
  .catch(() => { /* no WebGL: the SVG logo stays */ });
