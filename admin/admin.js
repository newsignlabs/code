/* ==========================================================================
   Newsign Labs — content studio
   Edits content/site.js (window.__NL_CONTENT) field by field with live SEO
   guidance and previews drafts on the real site. Signing in and publishing go
   through the newsign_admin Catalyst function, which holds the GitHub App
   and commits content/site.js + the index.html meta tags (admin/README.md).
   ========================================================================== */

const SCHEMA = window.NL_SCHEMA || [];
const FIELDS = SCHEMA.flatMap((g) => g.fields.map((f) => ({ ...f, group: g.id })));
const BY_KEY = Object.fromEntries(FIELDS.map((f) => [f.key, f]));
const DRAFT_KEY = 'nl-content-draft';
const DRAFT_TIME = 'nl-content-draft-at';
const SESSION_KEY = 'nl-admin-session';
const API = String((window.NL_ADMIN && window.NL_ADMIN.api) || '').replace(/\/+$/, '');

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let published = {};      // what the live content file holds
let draft = {};          // what the editor holds
let publishedSha = null; // git blob sha of content/site.js on GitHub when we loaded it

/* ---------------------------------------------------------------- storage */
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* blocked */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* blocked */ } },
};
const session = {
  get() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      return s && s.expires > Date.now() ? s : null;
    } catch { return null; }
  },
  set(s) { try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* ignore */ } },
  clear() { try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ } },
};

/* ------------------------------------------------------------ function API */
class AuthError extends Error {}
// A "simple" POST (text/plain body, session token inside it): no CORS preflight, and no
// Authorization header, which Catalyst would treat as its own sign-in.
async function api(name, payload = {}) {
  const s = session.get();
  let res;
  try {
    res = await fetch(`${API}/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(s && name !== 'login' ? { ...payload, token: s.token } : payload),
    });
  } catch {
    throw new Error('Could not reach the admin service. Check your connection; if it keeps failing, check the function URL in admin/config.js and that ALLOWED_ORIGINS on the function lists this site\'s address exactly.');
  }
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && name !== 'login') { session.clear(); throw new AuthError('Your session has ended. Please sign in again.'); }
  return { status: res.status, json };
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
const withDefaults = (c) => Object.fromEntries(FIELDS.map((f) => [f.key, typeof c[f.key] === 'string' ? c[f.key] : f.default]));

// Reads the copy from GitHub through the function (always the latest, even before the
// host has redeployed), with the sha used to detect edits made elsewhere.
async function loadPublished() {
  const { status, json } = await api('content');
  if (status === 503) throw new Error('The admin service is not configured yet (see admin/README.md).');
  if (status !== 200) throw new Error('Could not load the site copy. Please try again.');
  published = withDefaults(json.content || {});
  publishedSha = json.sha;
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

/* ================================================================ publish */
function bindPublishing() {
  $('#btn-logout').addEventListener('click', () => {
    saveDraft(); session.clear();
    location.reload();
  });

  const dlgP = $('#dlg-publish');
  $('#btn-publish').addEventListener('click', () => {
    const keys = changedKeys();
    if (!keys.length) return;
    const clip = (s) => (s.length > 140 ? s.slice(0, 139) + '…' : s);
    $('#publish-summary').textContent = `${keys.length} field${keys.length > 1 ? 's' : ''} changed. The live site updates after your host redeploys (usually under a minute).`;
    $('#publish-list').innerHTML = keys.map((k) => `<li><b>${esc(BY_KEY[k].label)} <span class="tag tag--${BY_KEY[k].el}">${esc(BY_KEY[k].tag)}</span></b><del>${esc(clip(published[k] || '∅'))}</del><br><ins>${esc(clip(draft[k] || '∅'))}</ins></li>`).join('');
    $('#publish-message').value = keys.length === 1 ? `Update ${BY_KEY[keys[0]].label.toLowerCase()}` : `Update site copy (${keys.length} fields)`;
    $('#publish-msg').textContent = ''; $('#publish-msg').className = 'dlg__msg';
    $('#btn-publish-go').disabled = false;
    $('#btn-publish-reload').hidden = true;
    dlgP.showModal();
  });

  $('#btn-publish-go').addEventListener('click', async () => {
    const msg = $('#publish-msg'), go = $('#btn-publish-go');
    go.disabled = true;
    msg.className = 'dlg__msg'; msg.textContent = 'Publishing…';
    setStatus('Publishing…', 'is-busy');
    try {
      const { status, json } = await api('publish', { content: draft, sha: publishedSha, note: $('#publish-message').value.trim() });
      if (status === 409) {
        msg.className = 'dlg__msg is-bad';
        msg.textContent = 'The site copy was changed somewhere else since you opened the editor. Load the latest copy (your edits are kept), check it, then publish again.';
        $('#btn-publish-reload').hidden = false;
        return;
      }
      if (status === 400 && json.error === 'validation') throw new Error('Not saved: ' + (json.issues || []).slice(0, 3).join('; '));
      if (status !== 200) throw new Error(status === 503 ? 'The admin service is not configured yet.' : 'Publishing failed (GitHub did not accept the change). Please try again.');
      if (json.unchanged) { dlgP.close(); toast('Nothing to publish: the site already has this copy.'); updateGlobal(); return; }
      published = { ...draft };
      await loadPublished().catch(() => {}); // pick up the new sha
      saveDraft(); renderAll(); $('#banner').hidden = true;
      dlgP.close();
      toast(`Published (${String(json.commit).slice(0, 7)}). The live site updates once your host finishes redeploying.`, 7000);
    } catch (err) {
      if (err instanceof AuthError) { dlgP.close(); showLogin(err.message); return; }
      msg.className = 'dlg__msg is-bad';
      msg.textContent = err.message;
    } finally {
      go.disabled = false;
      updateGlobal();
    }
  });

  // after a conflict: take the latest copy, keep this editor's changes on top of it
  $('#btn-publish-reload').addEventListener('click', async () => {
    const mine = Object.fromEntries(changedKeys().map((k) => [k, draft[k]]));
    try {
      await loadPublished();
      draft = { ...published, ...mine };
      saveDraft(); renderAll();
      dlgP.close();
      toast('Loaded the latest copy with your changes on top. Review them, then publish again.', 6000);
    } catch (err) {
      $('#publish-msg').textContent = err.message;
    }
  });
}

/* ================================================================= sign in */
function showLogin(message) {
  const gate = $('#gate');
  gate.hidden = false;
  $('#gate-msg').textContent = message || '';
  $('#gate-msg').className = 'gate__msg' + (message ? ' is-bad' : '');
  setTimeout(() => $('#gate-password').focus(), 50);
}

function bindLogin(onSignedIn) {
  $('#gate-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#gate-submit'), msg = $('#gate-msg');
    const password = $('#gate-password').value;
    if (!password) return;
    btn.disabled = true; msg.className = 'gate__msg'; msg.textContent = 'Signing in…';
    try {
      const { status, json } = await api('login', { password });
      if (status === 200 && json.token) {
        session.set({ token: json.token, expires: json.expires });
        $('#gate-password').value = '';
        $('#gate').hidden = true;
        await onSignedIn();
        return;
      }
      msg.className = 'gate__msg is-bad';
      msg.textContent = status === 401 ? 'Wrong password.'
        : status === 429 ? 'Too many attempts. Try again in an hour.'
        : status === 503 ? 'The admin service is not configured yet (see admin/README.md).'
        : status === 403 ? 'This site address is not allowed to use the admin service (ALLOWED_ORIGINS).'
        : 'Sign-in failed. Please try again.';
    } catch (err) {
      msg.className = 'gate__msg is-bad'; msg.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
}

/* ============================================ /admin/?setup: password values */
function showSetup() {
  $('#setup').hidden = false;
  $('#setup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const a = $('#setup-pw').value, b = $('#setup-pw2').value, msg = $('#setup-msg');
    msg.className = 'gate__msg is-bad';
    if (a.length < 12) { msg.textContent = 'Use at least 12 characters.'; return; }
    if (a !== b) { msg.textContent = 'The two passwords do not match.'; return; }
    msg.className = 'gate__msg'; msg.textContent = 'Generating…';
    const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(a), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 310000 }, key, 256);
    $('#setup-hash').value = `pbkdf2$310000$${hex(salt)}$${hex(bits)}`;
    $('#setup-secret').value = hex(crypto.getRandomValues(new Uint8Array(32)));
    $('#setup-out').hidden = false;
    msg.textContent = 'Done. Nothing was sent anywhere; copy both values into the function now.';
  });
  document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const input = $(b.dataset.copy);
    try { await navigator.clipboard.writeText(input.value); b.textContent = 'Copied'; } catch { input.select(); }
  }));
}

/* ================================================================== boot */
async function startEditor() {
  setStatus('Loading…', 'is-busy');
  try {
    await loadPublished();
  } catch (err) {
    if (err instanceof AuthError) { showLogin(err.message); return; }
    setStatus('Could not load', '');
    toast(err.message, 9000);
    return;
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
  document.body.classList.add('is-ready');
  renderAll();
  if (!startEditor.bound) { bindEditor(); bindPublishing(); startEditor.bound = true; }
}

(async function init() {
  if (window.NL_ADMIN && window.NL_ADMIN.environment) $('.bar__brand small').textContent = `Newsign Labs · ${window.NL_ADMIN.environment}`;
  if (!FIELDS.length) { setStatus('Schema failed to load', ''); return; }
  if (new URLSearchParams(location.search).has('setup')) { showSetup(); return; }
  if (!API) {
    showLogin('The admin service address is not set yet: put the newsign_admin function URL in admin/config.js (see admin/README.md).');
    $('#gate-submit').disabled = true;
    return;
  }
  bindLogin(startEditor);
  if (session.get()) await startEditor();
  else showLogin();
})();
