/* ==========================================================================
   Newsign Labs — content studio
   Edits content/site.js (window.__NL_CONTENT) field by field with live SEO
   guidance, previews drafts on the real site and publishes through the
   GitHub API as a single commit (content/site.js + index.html meta tags).
   ========================================================================== */

const SCHEMA = window.NL_SCHEMA || [];
const FIELDS = SCHEMA.flatMap((g) => g.fields.map((f) => ({ ...f, group: g.id })));
const BY_KEY = Object.fromEntries(FIELDS.map((f) => [f.key, f]));
const DRAFT_KEY = 'nl-content-draft';
const DRAFT_TIME = 'nl-content-draft-at';
const GH_KEY = 'nl-admin-gh';
const CONTENT_PATH = 'content/site.js';
const INDEX_PATH = 'index.html';

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let published = {};      // what the live content file holds
let draft = {};          // what the editor holds
let publishedSha = null; // git blob sha of the content file we loaded

/* ---------------------------------------------------------------- storage */
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* blocked */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* blocked */ } },
};
function ghSettings() {
  let s = null;
  try { s = JSON.parse(sessionStorage.getItem(GH_KEY) || store.get(GH_KEY) || 'null'); } catch { /* ignore */ }
  return { owner: 'newsignlabs', repo: 'code', branch: 'main', token: '', remember: false, ...(s || {}) };
}
function saveGhSettings(s) {
  const json = JSON.stringify(s);
  try { sessionStorage.setItem(GH_KEY, json); } catch { /* ignore */ }
  if (s.remember) store.set(GH_KEY, json); else store.del(GH_KEY);
}

/* ------------------------------------------------------- content file I/O */
function parseContentFile(text) {
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('Content file is not in the expected format.');
  return JSON.parse(text.slice(a, b + 1));
}
function serializeContent(content) {
  const ordered = {};
  FIELDS.forEach((f) => { if (content[f.key] !== undefined) ordered[f.key] = content[f.key]; });
  Object.keys(content).forEach((k) => { if (!(k in ordered)) ordered[k] = content[k]; });
  return '/* Newsign Labs site copy. Edit it at /admin; publishing there rewrites this file. */\n' +
    'window.__NL_CONTENT = ' + JSON.stringify(ordered, null, 1) + ';\n';
}
async function gitBlobSha(text) {
  const body = new TextEncoder().encode(text);
  const head = new TextEncoder().encode(`blob ${body.length}\0`);
  const all = new Uint8Array(head.length + body.length);
  all.set(head); all.set(body, head.length);
  const hash = await crypto.subtle.digest('SHA-1', all);
  return [...new Uint8Array(hash)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
const withDefaults = (c) => Object.fromEntries(FIELDS.map((f) => [f.key, typeof c[f.key] === 'string' ? c[f.key] : f.default]));

async function loadPublished() {
  const res = await fetch('/' + CONTENT_PATH + '?t=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not load the content file (${res.status}).`);
  const text = await res.text();
  publishedSha = await gitBlobSha(text);
  published = withDefaults(parseContentFile(text));
}

/* ------------------------------------------------------------------ draft */
function saveDraft() {
  const changed = changedKeys();
  if (changed.length) {
    store.set(DRAFT_KEY, JSON.stringify(draft));
    store.set(DRAFT_TIME, new Date().toISOString());
  } else {
    store.del(DRAFT_KEY); store.del(DRAFT_TIME);
  }
}
const changedKeys = () => FIELDS.filter((f) => (draft[f.key] ?? '') !== (published[f.key] ?? '')).map((f) => f.key);

/* ============================================================ SEO checks */
const words = (s) => (s.toLowerCase().match(/[\p{L}\p{N}']+/gu) || []);
// "&" and "and" count as the same word when matching the focus keyword
const norm = (s) => (s || '').toLowerCase().replace(/\s*&\s*/g, ' and ').replace(/\s+/g, ' ').trim();
function kwMatch(text, kw) {
  if (!kw) return 'none';
  const t = norm(text);
  kw = norm(kw);
  if (t.includes(kw)) return 'exact';
  const kws = words(kw).filter((w) => w.length > 2);
  const tw = new Set(words(t));
  if (kws.length && kws.every((w) => tw.has(w) || tw.has(w.replace(/s$/, '')) || tw.has(w + 's'))) return 'partial';
  return 'missing';
}
const h1Text = () => ['hero.h1.line1', 'hero.h1.highlight', 'hero.h1.line3'].map((k) => draft[k] || '').join(' ').replace(/\s+/g, ' ').trim();

function fieldIssues(f, v) {
  const out = [];
  const val = (v || '').trim();
  const len = val.length;
  if (!val) {
    out.push(['warn', 'Empty: the site will show the built-in default text for this field.']);
    return out;
  }
  if (f.type === 'list') {
    const items = val.split('\n').map((s) => s.trim()).filter(Boolean);
    if (items.length < 2) out.push(['warn', 'Lists read best with at least two items.']);
    const long = items.filter((s) => s.length > 70);
    if (long.length) out.push(['warn', `${long.length} item${long.length > 1 ? 's are' : ' is'} over 70 characters; keep bullets short.`]);
    return out;
  }
  if (f.range) {
    const [min, max] = f.range;
    if (len > max) out.push([len > max * 1.25 ? 'bad' : 'warn', `${len - max} character${len - max > 1 ? 's' : ''} over the recommended ${max}.`]);
    else if (len < min) out.push(['warn', `Shorter than the recommended ${min} characters.`]);
  }
  const kw = (draft['seo.focusKeyword'] || '').trim();
  if (['title', 'metadesc', 'lead'].includes(f.el) && kw) {
    const m = kwMatch(val, kw);
    if (m === 'exact') out.push(['good', 'Contains the focus keyword.']);
    else if (m === 'partial') out.push(['warn', 'Has the focus keyword\'s words, but not as the exact phrase.']);
    else out.push(['bad', `Missing the focus keyword "${kw}".`]);
  }
  if (f.el === 'title' && !/newsign/i.test(val)) out.push(['warn', 'Add the brand name (usually at the end).']);
  if (f.el === 'alt') {
    if (/^(image|picture|photo|graphic) of\b/i.test(val)) out.push(['warn', 'Drop "image of": screen readers already announce it as an image.']);
    if (/\.(png|jpe?g|webp|svg|gif)$/i.test(val)) out.push(['bad', 'Looks like a file name; describe the image instead.']);
  }
  if (f.el === 'cta' && /^(click here|submit|read more|learn more|here)$/i.test(val)) out.push(['warn', 'Generic button text; say what happens next.']);
  if (f.el === 'h1' && f.key === 'hero.h1.line3') {
    const h = h1Text();
    if (h.length > 70) out.push(['warn', `The full H1 is ${h.length} characters; keep it under ~70.`]);
  }
  if (f.el === 'h2' && /h2b$/.test(f.key)) {
    const a = (draft[f.key.replace(/h2b$/, 'h2a')] || '').trim();
    const full = `${a} ${val}`.trim();
    if (full.length > 60) out.push(['warn', `Both heading lines together are ${full.length} characters; aim for under ~60.`]);
  }
  if (/\s{2,}/.test(v)) out.push(['warn', 'Contains double spaces.']);
  if (/!{2,}|\?{2,}/.test(val)) out.push(['warn', 'Repeated punctuation reads as shouting.']);
  return out;
}

function siteChecks() {
  const kw = (draft['seo.focusKeyword'] || '').trim();
  const res = [];
  const title = draft['seo.title'] || '', desc = draft['seo.description'] || '';
  const h1 = h1Text();
  const tLen = title.length, dLen = desc.length;
  res.push([tLen >= 30 && tLen <= 60 ? 'good' : tLen > 60 ? 'bad' : 'warn', `<b>Title</b> is ${tLen} characters (aim for 50–60).`]);
  res.push([dLen >= 120 && dLen <= 160 ? 'good' : dLen > 160 ? 'warn' : 'warn', `<b>Meta description</b> is ${dLen} characters (aim for 120–160).`]);
  if (kw) {
    const check = (label, text) => {
      const m = kwMatch(text, kw);
      res.push([m === 'exact' ? 'good' : m === 'partial' ? 'warn' : 'bad',
        m === 'exact' ? `Focus keyword is in the <b>${label}</b>.` : m === 'partial' ? `<b>${label}</b> has the keyword's words, not the exact phrase.` : `Focus keyword is missing from the <b>${label}</b>.`]);
    };
    check('title', title); check('meta description', desc); check('H1', h1); check('first paragraph', draft['hero.lead'] || '');
    const h2s = h2List().map((h) => h.text).join(' ');
    const kwWords = words(kw).filter((w) => w.length > 3);
    const h2hit = kwWords.some((w) => words(h2s).includes(w));
    res.push([h2hit ? 'good' : 'warn', h2hit ? 'A section heading (<b>H2</b>) uses a keyword word.' : 'No <b>H2</b> uses a word from the focus keyword; consider working one in.']);
    // density across visible copy
    const all = norm(FIELDS.filter((f) => !['admin', 'title', 'metadesc', 'ogtitle', 'ogdesc', 'aria'].includes(f.el)).map((f) => draft[f.key] || '').join(' '));
    const total = words(all).length || 1;
    const hits = all.split(norm(kw)).length - 1;
    const density = (hits * Math.max(1, words(kw).length) / total) * 100;
    res.push([density > 3 ? 'bad' : 'good', density > 3 ? `Keyword density is ${density.toFixed(1)}%: that reads as stuffing; use variations instead.` : `Keyword appears ${hits}× in ${total} words of copy (${density.toFixed(1)}%), natural use.`]);
  } else {
    res.push(['warn', 'Set a <b>focus keyword</b> to check the title, description, H1 and first paragraph.']);
  }
  res.push([h1.length && h1.length <= 70 ? 'good' : 'warn', `<b>H1</b> is ${h1.length} characters across its three parts (one H1 on the page).`]);
  const h2 = h2List();
  const dup = h2.filter((h, i) => h2.findIndex((x) => x.text.toLowerCase() === h.text.toLowerCase()) !== i);
  res.push([dup.length ? 'warn' : 'good', dup.length ? `Duplicate H2: "${esc(dup[0].text)}". Each section heading should be unique.` : `${h2.length} unique section headings (H2).`]);
  const alt = (draft['brand.logoAlt'] || '').trim();
  res.push([alt ? 'good' : 'bad', alt ? 'Logo has <b>alt text</b>.' : 'Logo <b>alt text</b> is empty.']);
  const empties = FIELDS.filter((f) => f.el !== 'admin' && !(draft[f.key] || '').trim()).length;
  if (empties) res.push(['warn', `${empties} empty field${empties > 1 ? 's' : ''} will fall back to default text.`]);
  return res;
}

function h2List() {
  return SCHEMA.filter((g) => g.id !== 'form').map((g) => {
    const a = g.fields.find((f) => /\.h2a$/.test(f.key)), b = g.fields.find((f) => /\.h2b$/.test(f.key));
    if (!a) return null;
    return { group: g, text: `${draft[a.key] || ''} ${b ? draft[b.key] || '' : ''}`.replace(/\s+/g, ' ').trim() };
  }).filter(Boolean);
}

/* ================================================================ render */
function fieldHTML(f) {
  const id = 'f-' + f.key.replace(/\W/g, '-');
  const v = draft[f.key] ?? '';
  const input = f.type === 'text'
    ? `<input id="${id}" data-key="${esc(f.key)}" type="text" value="${esc(v)}" spellcheck="true" />`
    : `<textarea id="${id}" data-key="${esc(f.key)}" rows="${f.type === 'list' ? Math.max(3, v.split('\n').length + 1) : 3}" spellcheck="true">${esc(v)}</textarea>`;
  return `
    <div class="field field--${f.el}" data-field="${esc(f.key)}">
      <div class="field__top">
        <label class="field__label" for="${id}">${esc(f.label)}</label>
        <span class="tag tag--${f.el}">${esc(f.tag)}</span>
        <span class="field__count" aria-live="off"></span>
      </div>
      ${input}
      <p class="field__note">${esc(f.note)}</p>
      <ul class="field__issues"></ul>
      <div class="field__foot"></div>
    </div>`;
}

function renderAll() {
  $('#groups').innerHTML = SCHEMA.map((g) => `
    <section class="group" id="g-${g.id}" data-group="${g.id}">
      <header class="group__head"><h2 class="group__title">${esc(g.title)}</h2><p class="group__intro">${esc(g.intro || '')}</p></header>
      <div class="fields">${g.fields.map(fieldHTML).join('')}</div>
    </section>`).join('');
  $('#side-list').innerHTML = SCHEMA.map((g) => `<li><a href="#g-${g.id}" data-nav="${g.id}"><span>${esc(g.title)}</span><span class="pill" hidden></span></a></li>`).join('');
  FIELDS.forEach((f) => updateField(f.key));
  updateGlobal();
}

function updateField(key) {
  const f = BY_KEY[key];
  const el = document.querySelector(`[data-field="${CSS.escape(key)}"]`);
  if (!f || !el) return;
  const v = draft[key] ?? '';
  const count = el.querySelector('.field__count');
  if (f.type === 'list') {
    const n = v.split('\n').map((s) => s.trim()).filter(Boolean).length;
    count.textContent = `${n} item${n === 1 ? '' : 's'}`; count.className = 'field__count';
  } else if (f.range) {
    const len = v.trim().length, [min, max] = f.range;
    count.textContent = `${len} / ${min}–${max}`;
    count.className = 'field__count ' + (len > max * 1.25 ? 'is-bad' : len > max || len < min ? 'is-warn' : 'is-ok');
  } else {
    count.textContent = `${v.trim().length}`; count.className = 'field__count';
  }
  const issues = fieldIssues(f, v);
  el.querySelector('.field__issues').innerHTML = issues.map(([lvl, msg]) => `<li class="${lvl}">${esc(msg)}</li>`).join('');
  el.dataset.issues = issues.filter(([l]) => l !== 'good').length;
  const changed = (v ?? '') !== (published[key] ?? '');
  el.classList.toggle('is-changed', changed);
  const foot = [];
  if (changed) foot.push(`<button class="link" type="button" data-revert="${esc(key)}">Undo change</button>`);
  if (v !== f.default) foot.push(`<button class="link" type="button" data-default="${esc(key)}">Use original text</button>`);
  el.querySelector('.field__foot').innerHTML = foot.join('');
}

function updateGlobal() {
  // sidebar counts
  SCHEMA.forEach((g) => {
    const a = document.querySelector(`[data-nav="${g.id}"]`);
    if (!a) return;
    const changed = g.fields.filter((f) => (draft[f.key] ?? '') !== (published[f.key] ?? '')).length;
    const warn = g.fields.reduce((n, f) => n + Number(document.querySelector(`[data-field="${CSS.escape(f.key)}"]`)?.dataset.issues || 0), 0);
    const pill = a.querySelector('.pill');
    if (changed) { pill.hidden = false; pill.className = 'pill pill--edit'; pill.textContent = changed; pill.title = `${changed} unpublished change${changed > 1 ? 's' : ''}`; }
    else if (warn) { pill.hidden = false; pill.className = 'pill pill--warn'; pill.textContent = warn; pill.title = `${warn} suggestion${warn > 1 ? 's' : ''}`; }
    else pill.hidden = true;
  });
  // status + publish button
  const n = changedKeys().length;
  setStatus(n ? `${n} unpublished change${n > 1 ? 's' : ''}` : 'Everything is published', n ? 'is-dirty' : 'is-clean');
  $('#btn-publish').disabled = !n;
  // seo panel
  if (document.activeElement !== $('#kw')) $('#kw').value = draft['seo.focusKeyword'] || '';
  $('#checks').innerHTML = siteChecks().map(([lvl, msg]) => `<li class="${lvl}"><span>${msg}</span></li>`).join('');
  const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
  $('#serp-url').textContent = location.host || 'your-site';
  $('#serp-title').textContent = clip(draft['seo.title'] || '', 60);
  $('#serp-desc').textContent = clip(draft['seo.description'] || '', 160);
  $('#og-title').textContent = clip(draft['seo.ogTitle'] || draft['seo.title'] || '', 60);
  $('#og-desc').textContent = clip(draft['seo.ogDescription'] || draft['seo.description'] || '', 110);
  const h2 = h2List();
  const seen = new Set();
  const h3For = (g) => g.fields.filter((f) => f.el === 'h3').map((f) => draft[f.key]).filter(Boolean);
  $('#outline').innerHTML = [`<li class="lvl-1"><span class="tag tag--h1">H1</span><span>${esc(h1Text())}</span></li>`]
    .concat(h2.flatMap((h) => {
      const dup = seen.has(h.text.toLowerCase()); seen.add(h.text.toLowerCase());
      return [`<li class="lvl-2${dup ? ' dup' : ''}"><span class="tag tag--h2">H2</span><a class="link" href="#g-${h.group.id}">${esc(h.text)}</a></li>`]
        .concat(h3For(h.group).map((t) => `<li class="lvl-3"><span class="tag tag--h3">H3</span><span>${esc(t)}</span></li>`));
    })).join('');
}

function setStatus(text, cls) {
  const s = $('#status');
  s.textContent = text;
  s.className = 'bar__status ' + (cls || '');
}
let toastTimer;
function toast(msg, ms = 4200) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}

/* ================================================================ events */
function bindEditor() {
  $('#groups').addEventListener('input', (e) => {
    const key = e.target.dataset?.key;
    if (!key) return;
    draft[key] = e.target.value;
    updateField(key);
    // fields whose checks depend on others
    if (key === 'seo.focusKeyword') ['seo.title', 'seo.description', 'hero.lead'].forEach(updateField);
    if (key.startsWith('hero.h1')) updateField('hero.h1.line3');
    if (/\.h2a$/.test(key)) updateField(key.replace(/h2a$/, 'h2b'));
    updateGlobal(); saveDraft();
  });
  $('#groups').addEventListener('click', (e) => {
    const r = e.target.closest('[data-revert],[data-default]');
    if (!r) return;
    const key = r.dataset.revert || r.dataset.default;
    draft[key] = r.dataset.revert ? published[key] : BY_KEY[key].default;
    const input = document.querySelector(`[data-key="${CSS.escape(key)}"]`);
    if (input) input.value = draft[key];
    updateField(key); updateGlobal(); saveDraft();
  });
  $('#kw').addEventListener('input', (e) => {
    draft['seo.focusKeyword'] = e.target.value;
    const input = document.querySelector('[data-key="seo.focusKeyword"]');
    if (input) input.value = e.target.value;
    ['seo.focusKeyword', 'seo.title', 'seo.description', 'hero.lead'].forEach(updateField);
    updateGlobal(); saveDraft();
  });
  $('#search').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    let any = false;
    SCHEMA.forEach((g) => {
      let shown = 0;
      g.fields.forEach((f) => {
        const el = document.querySelector(`[data-field="${CSS.escape(f.key)}"]`);
        const hit = !q || `${f.label} ${f.tag} ${g.title} ${draft[f.key] || ''}`.toLowerCase().includes(q);
        el.hidden = !hit; if (hit) shown++;
      });
      document.getElementById('g-' + g.id).hidden = !shown;
      any = any || shown > 0;
    });
    $('#empty').hidden = any;
  });
  // highlight the section in view
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === en.target.dataset.group));
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  document.querySelectorAll('.group').forEach((g) => io.observe(g));

  $('#btn-preview').addEventListener('click', () => {
    store.set(DRAFT_KEY, JSON.stringify(draft));
    window.open('/?preview=1', 'nl-preview');
  });
  $('#btn-discard').addEventListener('click', () => {
    if (!changedKeys().length) { toast('There are no unpublished changes.'); return; }
    if (!confirm('Discard all unpublished changes and go back to the published copy?')) return;
    draft = { ...published }; saveDraft(); renderAll(); $('#banner').hidden = true;
    toast('Unpublished changes discarded.');
  });
  $('#btn-download').addEventListener('click', () => {
    const blob = new Blob([serializeContent(draft)], { type: 'text/javascript' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'site.js' });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Downloaded site.js. Upload it to content/site.js in the repository to publish by hand.');
  });
  addEventListener('pagehide', saveDraft);
}

/* ========================================================= GitHub publish */
function gh(settings) {
  const base = `https://api.github.com/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}`;
  return async (path, opts = {}) => {
    const res = await fetch(base + path, {
      ...opts,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(settings.token ? { Authorization: `Bearer ${settings.token}` } : {}),
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(data?.message || `GitHub returned ${res.status}`);
      err.status = res.status; throw err;
    }
    return data;
  };
}
const b64decode = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), (c) => c.charCodeAt(0)));
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function updateIndexHtml(html, c) {
  const setMeta = (h, re, value) => (value ? h.replace(re, (m, a, _old, z) => `${a}${attr(value)}${z}`) : h);
  let out = html;
  if (c['seo.title']) out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${attr(c['seo.title'])}</title>`);
  out = setMeta(out, /(<meta name="description" content=")([^"]*)(")/, c['seo.description']);
  out = setMeta(out, /(<meta property="og:title" content=")([^"]*)(")/, c['seo.ogTitle']);
  out = setMeta(out, /(<meta property="og:description" content=")([^"]*)(")/, c['seo.ogDescription']);
  out = setMeta(out, /(<meta name="twitter:title" content=")([^"]*)(")/, c['seo.ogTitle']);
  out = setMeta(out, /(<meta name="twitter:description" content=")([^"]*)(")/, c['seo.ogDescription']);
  if (c['loader.word']) out = out.replace(/(<span class="nl-loader__word">)[\s\S]*?(<\/span>)/, `$1${attr(c['loader.word'])}$2`);
  return out;
}

async function publish(message, onStep) {
  const s = ghSettings();
  if (!s.token) throw new Error('Add a GitHub access token in Publishing settings first.');
  const api = gh(s);
  const branch = encodeURIComponent(s.branch);
  for (let attempt = 0; attempt < 2; attempt++) {
    onStep('Reading the latest version…');
    const ref = await api(`/git/ref/heads/${branch}`);
    const head = ref.object.sha;
    const commit = await api(`/git/commits/${head}`);
    const [remoteContent, remoteIndex] = await Promise.all([
      api(`/contents/${CONTENT_PATH}?ref=${head}`),
      api(`/contents/${INDEX_PATH}?ref=${head}`),
    ]);
    if (attempt === 0 && publishedSha && remoteContent.sha !== publishedSha) {
      const ok = confirm('The site copy was changed somewhere else since you opened this page. Publishing will overwrite those changes with what you see here. Continue?');
      if (!ok) throw new Error('Publishing cancelled. Reload the page to pick up the newer copy.');
    }
    const siteJs = serializeContent(draft);
    const indexHtml = updateIndexHtml(b64decode(remoteIndex.content), draft);
    onStep('Creating the commit…');
    const tree = await api('/git/trees', {
      method: 'POST',
      body: JSON.stringify({
        base_tree: commit.tree.sha,
        tree: [
          { path: CONTENT_PATH, mode: '100644', type: 'blob', content: siteJs },
          { path: INDEX_PATH, mode: '100644', type: 'blob', content: indexHtml },
        ],
      }),
    });
    const next = await api('/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: tree.sha, parents: [head] }) });
    onStep('Updating the branch…');
    try {
      await api(`/git/refs/heads/${branch}`, { method: 'PATCH', body: JSON.stringify({ sha: next.sha }) });
    } catch (err) {
      if (err.status === 422 && attempt === 0) continue; // branch moved underneath us: rebuild on the new head
      throw err;
    }
    return { sha: next.sha, siteJs };
  }
  throw new Error('The branch kept changing while publishing. Try again in a moment.');
}

function bindPublishing() {
  const dlgS = $('#dlg-settings'), formS = $('#form-settings');
  const fillSettings = () => {
    const s = ghSettings();
    ['owner', 'repo', 'branch', 'token'].forEach((k) => { formS.elements[k].value = s[k] || ''; });
    formS.elements.remember.checked = !!s.remember;
    $('#settings-msg').textContent = ''; $('#settings-msg').className = 'dlg__msg';
  };
  const readSettings = () => ({
    owner: formS.elements.owner.value.trim(), repo: formS.elements.repo.value.trim(), branch: formS.elements.branch.value.trim(),
    token: formS.elements.token.value.trim(), remember: formS.elements.remember.checked,
  });
  $('#btn-settings').addEventListener('click', () => { fillSettings(); dlgS.showModal(); });
  dlgS.addEventListener('close', () => {
    if (dlgS.returnValue === 'save') { saveGhSettings(readSettings()); toast('Publishing settings saved.'); }
  });
  $('#btn-test').addEventListener('click', async () => {
    const msg = $('#settings-msg');
    msg.className = 'dlg__msg'; msg.textContent = 'Checking…';
    try {
      const s = readSettings();
      const repo = await gh(s)('');
      await gh(s)(`/git/ref/heads/${encodeURIComponent(s.branch)}`);
      const canPush = repo.permissions ? repo.permissions.push : null;
      msg.className = 'dlg__msg ' + (canPush === false ? 'is-bad' : 'is-ok');
      msg.textContent = canPush === false ? 'Connected, but this token cannot write to the repository.' : `Connected to ${repo.full_name} (${s.branch}).`;
    } catch (err) {
      msg.className = 'dlg__msg is-bad';
      msg.textContent = err.status === 401 ? 'GitHub rejected the token.' : err.status === 404 ? 'Repository or branch not found (or the token cannot see it).' : err.message;
    }
  });

  const dlgP = $('#dlg-publish');
  $('#btn-publish').addEventListener('click', () => {
    const keys = changedKeys();
    if (!keys.length) return;
    if (!ghSettings().token) { fillSettings(); dlgS.showModal(); toast('Add a GitHub access token to publish.'); return; }
    const clip = (s) => (s.length > 140 ? s.slice(0, 139) + '…' : s);
    $('#publish-summary').textContent = `${keys.length} field${keys.length > 1 ? 's' : ''} changed. Publishing updates the live site after your host redeploys (usually under a minute).`;
    $('#publish-list').innerHTML = keys.map((k) => `<li><b>${esc(BY_KEY[k].label)} <span class="tag tag--${BY_KEY[k].el}">${esc(BY_KEY[k].tag)}</span></b><del>${esc(clip(published[k] || '∅'))}</del><br><ins>${esc(clip(draft[k] || '∅'))}</ins></li>`).join('');
    $('#publish-message').value = keys.length === 1 ? `Update ${BY_KEY[keys[0]].label.toLowerCase()}` : `Update site copy (${keys.length} fields)`;
    $('#publish-msg').textContent = ''; $('#publish-msg').className = 'dlg__msg';
    $('#btn-publish-go').disabled = false;
    dlgP.showModal();
  });
  $('#btn-publish-go').addEventListener('click', async () => {
    const msg = $('#publish-msg'), go = $('#btn-publish-go');
    go.disabled = true;
    setStatus('Publishing…', 'is-busy');
    try {
      const message = ($('#publish-message').value.trim() || 'Update site copy') + '\n\nPublished from the Newsign Labs content studio (/admin).';
      const { sha, siteJs } = await publish(message, (step) => { msg.className = 'dlg__msg'; msg.textContent = step; });
      published = { ...draft };
      publishedSha = await gitBlobSha(siteJs);
      saveDraft(); renderAll(); $('#banner').hidden = true;
      dlgP.close();
      toast(`Published (${sha.slice(0, 7)}). The live site updates once your host finishes redeploying.`, 7000);
    } catch (err) {
      msg.className = 'dlg__msg is-bad';
      msg.textContent = err.status === 401 ? 'GitHub rejected the token. Check Publishing settings.' : err.status === 403 || err.status === 404 ? 'This token cannot write to the repository. Give it Contents: Read and write.' : err.message;
      go.disabled = false;
      updateGlobal();
    }
  });
}

/* ================================================================== boot */
(async function init() {
  if (!FIELDS.length) { setStatus('Schema failed to load', ''); return; }
  try {
    await loadPublished();
  } catch (err) {
    published = withDefaults({});
    toast(err.message + ' Showing built-in defaults.', 8000);
  }
  draft = { ...published };
  const saved = store.get(DRAFT_KEY);
  if (saved) {
    try {
      const d = JSON.parse(saved);
      draft = { ...published, ...Object.fromEntries(Object.entries(d).filter(([k, v]) => k in BY_KEY && typeof v === 'string')) };
      const n = changedKeys().length;
      if (n) {
        const at = store.get(DRAFT_TIME);
        const when = at ? new Date(at).toLocaleString() : 'earlier';
        const b = $('#banner');
        b.innerHTML = `<span>Restored ${n} unpublished change${n > 1 ? 's' : ''} from ${esc(when)}.</span><button class="link" type="button" id="banner-discard">Discard them</button>`;
        b.hidden = false;
        $('#banner-discard').addEventListener('click', () => { draft = { ...published }; saveDraft(); renderAll(); b.hidden = true; });
      }
    } catch { /* ignore a corrupt draft */ }
  }
  renderAll();
  bindEditor();
  bindPublishing();
})();
