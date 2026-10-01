/* ==========================================================================
   Newsign Labs — section content layer
   - 01 Toolkit: new layout with a stage for the glass 3D logo, animated
     motion icons on the service cards and an animated gradient edge
   - 03 How we move: each process step opens its own detail popup
   - New sections: engagement models, stack, FAQ (renumbers the contact eyebrow)
   - Footer social icons in plain white
   Everything is injected next to the compiled React tree without replacing
   any node React owns.
   ========================================================================== */

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function initSections() {
  initToolkit();
  initProcessPopups();
  initNewSections();
  initReveal();
}

/* ------------------------------------------------------------- open form */
// Re-use the app's own "Start a project" modal.
export function openProjectForm() {
  const btn = document.querySelector('[data-testid="button-open-project-header"]')
    || document.querySelector('[data-testid="button-open-project-contact"]');
  btn?.click();
}

/* =============================================================== TOOLKIT */
const ICONS = [
  // 01 Graphic systems: three layers that lift apart and settle
  `<svg class="nl-micon nl-micon--layers" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
     <path class="l3" d="M16 21.5 4.5 15.75 16 10l11.5 5.75L16 21.5Z" opacity=".45"/>
     <path class="l2" d="M16 21.5 4.5 15.75 16 10l11.5 5.75L16 21.5Z" opacity=".7"/>
     <path class="l1" d="M16 21.5 4.5 15.75 16 10l11.5 5.75L16 21.5Z" fill="currentColor" fill-opacity=".18"/>
   </svg>`,
  // 02 Web & product: a browser window whose content builds in, caret blinking
  `<svg class="nl-micon nl-micon--web" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
     <rect x="3.5" y="6" width="25" height="20" rx="3"/>
     <path d="M3.5 11h25"/>
     <circle cx="7" cy="8.5" r=".6" fill="currentColor"/><circle cx="9.4" cy="8.5" r=".6" fill="currentColor"/><circle cx="11.8" cy="8.5" r=".6" fill="currentColor"/>
     <path class="b1" d="M8 15.5h9"/><path class="b2" d="M8 19h13"/><path class="b3" d="M8 22.5h6"/>
     <path class="caret" d="M16.5 21v3"/>
   </svg>`,
  // 03 AI design lab: a spark that spins and breathes, with twinkling satellites
  `<svg class="nl-micon nl-micon--spark" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
     <path class="s1" d="M14 5.5c.9 4.6 2.9 6.6 7.5 7.5-4.6.9-6.6 2.9-7.5 7.5-.9-4.6-2.9-6.6-7.5-7.5 4.6-.9 6.6-2.9 7.5-7.5Z" fill="currentColor" fill-opacity=".2"/>
     <path class="s2" d="M23.5 18.5c.4 1.9 1.2 2.7 3.1 3.1-1.9.4-2.7 1.2-3.1 3.1-.4-1.9-1.2-2.7-3.1-3.1 1.9-.4 2.7-1.2 3.1-3.1Z"/>
     <circle class="s3" cx="24" cy="7.5" r="1.1" fill="currentColor" stroke="none"/>
   </svg>`,
  // 04 Sound & reach: an equaliser with bars on staggered beats
  `<svg class="nl-micon nl-micon--eq" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
     <path class="e1" d="M6 12v8"/><path class="e2" d="M11 8v16"/><path class="e3" d="M16 11v10"/><path class="e4" d="M21 6v20"/><path class="e5" d="M26 13v6"/>
   </svg>`,
];

function initToolkit() {
  const section = document.getElementById('services');
  if (!section || section.classList.contains('nl-toolkit')) return;
  section.classList.add('nl-toolkit');

  // glass logo stage sits between the heading and the intro copy
  const head = section.querySelector('.reveal.mb-14');
  if (head && head.children.length >= 2) {
    const stage = document.createElement('div');
    stage.className = 'nl-glass-stage';
    stage.setAttribute('aria-hidden', 'true');
    stage.innerHTML = '<div class="nl-glass-stage__ring"></div><div class="nl-glass-stage__ring nl-glass-stage__ring--2"></div>';
    head.children[0].after(stage);
  }

  // animated icons replace the static ones inside each card's icon tile
  section.querySelectorAll('.service-card').forEach((card, i) => {
    const tile = card.querySelector('span.grid');
    if (!tile || !ICONS[i]) return;
    tile.classList.add('nl-icon-tile');
    tile.insertAdjacentHTML('beforeend', ICONS[i]);
  });
}

/* ======================================================= PROCESS POPUPS */
const STEPS = [
  {
    num: '01', accent: '#ffe878', phase: 'Discovery sprint', time: 'Week 1–2',
    title: 'Find the sharp edge',
    lead: 'Before a single pixel, we find the one idea worth building around. Short, focused and evidence-led.',
    happens: ['Kick-off workshop with your decision makers', 'Audience and competitor teardown', 'Analytics and funnel audit of what exists today', 'Positioning and message hierarchy'],
    get: ['Positioning one-pager', 'Creative and technical brief', 'Success metrics we will be measured on', 'Scope and timeline you can plan around'],
  },
  {
    num: '02', accent: '#62b7ff', phase: 'Prototype & design', time: 'Week 2–5',
    title: 'Make it tangible',
    lead: 'A clickable prototype in your hands early, so feedback is about the real thing and not a slide.',
    happens: ['Wireframes to high-fidelity design in weekly loops', 'Interactive prototype tested with real users', 'Design system foundations: type, colour, components', 'Technical spike for anything risky (3D, integrations, data)'],
    get: ['Interactive prototype', 'Visual direction and design system', 'Content plan and copy drafts', 'Build plan with fixed milestones'],
  },
  {
    num: '03', accent: '#c68cff', phase: 'Build, launch & amplify', time: 'Week 5+',
    title: 'Turn up the signal',
    lead: 'We engineer it fast, accessible and measurable, then make sure the right people actually see it.',
    happens: ['Production build with performance budgets', 'Accessibility and cross-device QA', 'Analytics, SEO and CMS hand-over', 'Launch campaign, motion assets and outreach'],
    get: ['Live product on your domain', 'Launch kit: social, motion, email', 'Training and documentation', '90-day growth and iteration plan'],
  },
];

let modal;
function initProcessPopups() {
  const rows = [...document.querySelectorAll('[data-testid^="row-process-"]')];
  if (!rows.length) return;
  rows.forEach((row, i) => {
    row.classList.add('nl-row-clickable');
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.setAttribute('aria-haspopup', 'dialog');
    row.setAttribute('aria-label', `${STEPS[i].title}: view details`);
    const hint = document.createElement('span');
    hint.className = 'nl-row-hint';
    hint.textContent = 'View details';
    row.querySelector('div')?.append(hint);
    row.addEventListener('click', () => openStep(i, row));
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openStep(i, row); }
    });
  });
}

function openStep(i, opener) {
  closeStep(true);
  const s = STEPS[i];
  const list = (items) => items.map((t) => `<li>${esc(t)}</li>`).join('');
  modal = document.createElement('div');
  modal.className = 'nl-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', `${s.title} details`);
  modal.style.setProperty('--accent', s.accent);
  modal.innerHTML = `
    <div class="nl-modal__panel" data-lenis-prevent>
      <button class="nl-modal__close" type="button" aria-label="Close">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="nl-modal__art" aria-hidden="true">
        <span class="nl-modal__num">${s.num}</span>
        <span class="nl-modal__orbit"></span><span class="nl-modal__orbit nl-modal__orbit--2"></span>
        <span class="nl-modal__steps">${STEPS.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</span>
      </div>
      <p class="eyebrow nl-modal__eyebrow">Step ${s.num} · ${esc(s.phase)} · ${esc(s.time)}</p>
      <h2 class="nl-modal__title">${esc(s.title)}</h2>
      <p class="nl-modal__lead">${esc(s.lead)}</p>
      <div class="nl-modal__cols">
        <div><p class="eyebrow">What happens</p><ul>${list(s.happens)}</ul></div>
        <div><p class="eyebrow">What you get</p><ul>${list(s.get)}</ul></div>
      </div>
      <div class="nl-modal__actions">
        <button type="button" class="gradient-button nl-modal__cta">Start with this step
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M7 7h10v10"/></svg>
        </button>
        ${i < STEPS.length - 1 ? `<button type="button" class="nl-modal__next">Next: ${esc(STEPS[i + 1].title)} →</button>` : ''}
      </div>
    </div>`;
  document.body.append(modal);
  modal._opener = opener;
  requestAnimationFrame(() => modal.classList.add('is-open'));
  window.__nlLenis?.stop();

  modal.addEventListener('click', (e) => { if (e.target === modal) closeStep(); });
  modal.querySelector('.nl-modal__close').addEventListener('click', () => closeStep());
  modal.querySelector('.nl-modal__cta').addEventListener('click', () => { closeStep(); setTimeout(openProjectForm, 200); });
  modal.querySelector('.nl-modal__next')?.addEventListener('click', () => {
    const rows = document.querySelectorAll('[data-testid^="row-process-"]');
    openStep(i + 1, rows[i + 1]);
  });
  modal.querySelector('.nl-modal__close').focus();
}

function closeStep(instant = false) {
  if (!modal) return;
  const m = modal;
  modal = null;
  m._opener?.focus?.({ preventScroll: true });
  window.__nlLenis?.start();
  if (instant) { m.remove(); return; }
  m.classList.remove('is-open');
  setTimeout(() => m.remove(), 400);
}

addEventListener('keydown', (e) => {
  if (!modal) return;
  if (e.key === 'Escape') closeStep();
  if (e.key === 'Tab') {
    const f = [...modal.querySelectorAll('button')];
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ========================================================= NEW SECTIONS */
const ENGAGEMENTS = [
  {
    name: 'Launch Sprint', time: '2–4 weeks', color: '#ffe878', badge: 'Fast start',
    text: 'A sharp first version of your brand or site, shipped while the idea is still hot.',
    items: ['Brand starter or landing page', 'One round of user feedback', 'Launch-ready assets', 'Clear next-step roadmap'],
  },
  {
    name: 'Product Build', time: '6–12 weeks', color: '#62b7ff', badge: 'Most chosen',
    text: 'A full website or web app, designed and engineered end-to-end by one senior crew.',
    items: ['Discovery, design and build', 'Design system and CMS', '3D, motion and interactions', 'Performance and accessibility QA'],
    featured: true,
  },
  {
    name: 'Signal Partner', time: 'Monthly', color: '#c68cff', badge: 'Ongoing',
    text: 'An embedded studio for teams that ship every month and want it to keep getting better.',
    items: ['Reserved senior capacity', 'Experiments and CRO', 'Campaign and content drops', 'Monthly growth review'],
  },
];

const STACK = [
  { group: 'Front-end', color: '#62b7ff', items: ['React', 'Next.js', 'Vue', 'Astro', 'TypeScript', 'Tailwind'] },
  { group: '3D & motion', color: '#c68cff', items: ['Three.js', 'WebGL / GLSL', 'GSAP', 'Lottie', 'Spline', 'Rive'] },
  { group: 'Back-end & data', color: '#ff964d', items: ['Node.js', 'Python', 'PostgreSQL', 'Supabase', 'GraphQL', 'Zoho Catalyst'] },
  { group: 'Commerce & content', color: '#ffe878', items: ['Shopify', 'Webflow', 'Sanity', 'WordPress', 'Stripe', 'Contentful'] },
];

const FAQ = [
  ['How long does a website take?', 'A focused marketing site usually takes 4–8 weeks from kick-off to launch. Larger products and web apps run 8–12 weeks, and we ship a working prototype in the first few weeks either way.'],
  ['How do you price projects?', 'We scope every project after a short call, then quote a fixed price per phase so there are no surprise invoices. Ongoing partnerships are a simple monthly fee for reserved capacity.'],
  ['Can you work with our existing team or codebase?', 'Yes. We regularly slot in alongside in-house designers and engineers, work in your repositories and follow your conventions, or hand over cleanly documented code to your team.'],
  ['Will our site be fast, even with 3D and motion?', 'Performance is part of the design. We set budgets up front, lazy-load heavy scenes, respect reduced-motion settings and test on real mid-range phones before launch.'],
  ['What happens after launch?', 'You get training, documentation and 30 days of included support. Many clients keep us on as a Signal Partner to run experiments, add features and keep the brand moving.'],
];

function initNewSections() {
  const contact = document.getElementById('contact');
  if (!contact || document.getElementById('engage')) return;

  const engage = document.createElement('section');
  engage.id = 'engage';
  engage.className = 'section-pad relative nl-section';
  engage.innerHTML = `
    <div class="mx-auto max-w-[1240px]">
      <div class="nl-reveal mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p class="eyebrow mb-5" style="color:#ffe878">05 / Ways to work</p>
          <h2 class="nl-h2">Pick a pace.<br><span class="gradient-ink">We bring the momentum.</span></h2>
        </div>
        <p class="nl-copy max-w-[320px]">Three ways to start. Every engagement is led by senior people from first call to launch day.</p>
      </div>
      <div class="nl-engage-grid">
        ${ENGAGEMENTS.map((e, i) => `
          <article class="nl-card nl-engage nl-reveal${e.featured ? ' is-featured' : ''}" style="--accent:${e.color};--delay:${i * 0.08}s">
            <div class="nl-engage__top">
              <span class="nl-engage__badge">${esc(e.badge)}</span>
              <span class="nl-engage__time">${esc(e.time)}</span>
            </div>
            <h3 class="nl-engage__name">${esc(e.name)}</h3>
            <p class="nl-engage__text">${esc(e.text)}</p>
            <ul class="nl-engage__list">${e.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
            <button type="button" class="nl-engage__cta" data-engage="${esc(e.name)}">Start a ${esc(e.name.toLowerCase())}
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M7 7h10v10"/></svg>
            </button>
          </article>`).join('')}
      </div>
    </div>`;

  const stack = document.createElement('section');
  stack.id = 'stack';
  stack.className = 'section-pad relative nl-section';
  stack.innerHTML = `
    <div class="mx-auto max-w-[1240px]">
      <div class="nl-reveal mb-14 nl-split">
        <div>
          <p class="eyebrow mb-5" style="color:#62b7ff">06 / The stack</p>
          <h2 class="nl-h2">Modern tools.<br><span style="color:#8e8799">Zero lock-in.</span></h2>
        </div>
        <div class="nl-perf">
          ${[['95+', 'Lighthouse target'], ['<2.5s', 'LCP budget'], ['AA', 'WCAG 2.2 standard']].map(([n, l]) => `
            <div class="nl-perf__item"><p class="nl-perf__num">${n}</p><p class="nl-perf__label">${l}</p></div>`).join('')}
        </div>
      </div>
      <div class="nl-stack-grid">
        ${STACK.map((g, i) => `
          <div class="nl-card nl-stack nl-reveal" style="--accent:${g.color};--delay:${i * 0.07}s">
            <p class="nl-stack__group"><span></span>${esc(g.group)}</p>
            <div class="nl-stack__chips">${g.items.map((t, k) => `<span style="--i:${k}">${esc(t)}</span>`).join('')}</div>
          </div>`).join('')}
      </div>
    </div>`;

  const faq = document.createElement('section');
  faq.id = 'faq';
  faq.className = 'section-pad relative nl-section';
  faq.innerHTML = `
    <div class="mx-auto max-w-[1240px] nl-faq-layout">
      <div class="nl-reveal">
        <p class="eyebrow mb-5" style="color:#ff964d">07 / Good questions</p>
        <h2 class="nl-h2">Before you<br><span class="gradient-ink">ask.</span></h2>
        <p class="nl-copy mt-6 max-w-[320px]">Still curious? Send us the brief and we will answer with a useful first thought within two working days.</p>
        <button type="button" class="nl-faq__cta gradient-hover">Ask us directly →</button>
      </div>
      <div class="nl-faq nl-reveal">
        ${FAQ.map(([q, a], i) => `
          <details class="nl-faq__item"${i === 0 ? ' open' : ''}>
            <summary><span class="nl-faq__num">${String(i + 1).padStart(2, '0')}</span><span class="nl-faq__q">${esc(q)}</span><span class="nl-faq__icon" aria-hidden="true"></span></summary>
            <div class="nl-faq__a"><p>${esc(a)}</p></div>
          </details>`).join('')}
      </div>
    </div>`;

  contact.before(engage, stack, faq);

  // renumber the closing section to follow the new ones
  const eyebrow = [...contact.querySelectorAll('.eyebrow')].find((p) => /^05 \/ Your turn$/.test(p.textContent.trim()));
  if (eyebrow) eyebrow.textContent = '08 / Your turn';

  engage.querySelectorAll('.nl-engage__cta').forEach((b) => b.addEventListener('click', openProjectForm));
  faq.querySelector('.nl-faq__cta').addEventListener('click', openProjectForm);

  // one FAQ open at a time, with a smooth height animation
  faq.querySelectorAll('.nl-faq__item').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (!d.open) return;
      faq.querySelectorAll('.nl-faq__item[open]').forEach((o) => { if (o !== d) o.open = false; });
    });
  });
}

/* --------------------------------------------------------------- reveal */
function initReveal() {
  const els = document.querySelectorAll('.nl-reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  els.forEach((el) => io.observe(el));
}
