/* ==========================================================================
   Newsign Labs — content studio: Journal (unlisted blog)
   Posts live in content/blog.js and are published through the newsign_admin
   function (blog / blog-publish). The production build turns published posts
   into /blog/<slug>/ pages: public to anyone with the link and to search
   engines, but not linked from the site's menu or homepage.
   The preview uses the same Markdown renderer as the build (/assets/markdown.js).
   ========================================================================== */

import { setHTML } from '/assets/safe-html.js';
import { renderMarkdown, wordCount, readingMinutes } from '/assets/markdown.js';

const SITE = 'https://www.newsignlabs.in';
const DRAFT_KEY = 'nl-journal-draft';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FIELDS = ['slug', 'status', 'title', 'seoTitle', 'description', 'focusKeyword', 'tags', 'published', 'updated', 'author', 'body'];

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/, '');
const clean = (p) => Object.fromEntries(FIELDS.filter((k) => typeof p[k] === 'string' && (p[k] !== '' || ['slug', 'status', 'title', 'body'].includes(k))).map((k) => [k, p[k]]));
const same = (a, b) => JSON.stringify(a.map(clean)) === JSON.stringify(b.map(clean));

let deps;            // { api, toast, onAuthError, kwMatch }
let base = [];       // posts as published (content/blog.js on GitHub)
let posts = [];      // posts in the editor
let sha = null;      // blob sha of content/blog.js when loaded (null: no file yet)
let current = -1;    // index of the post being edited
let loaded = false;
const slugTouched = new WeakSet(); // posts whose address was typed by hand

/* ---------------------------------------------------------------- storage */
const store = {
  get() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; } },
  set(v) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(v)); } catch { /* blocked */ } },
  del() { try { localStorage.removeItem(DRAFT_KEY); } catch { /* blocked */ } },
};
function saveDraft() {
  if (same(posts, base)) store.del();
  else store.set({ posts: posts.map(clean), baseSha: sha, at: new Date().toISOString() });
}

/* ----------------------------------------------------------------- checks */
const words = (s) => (String(s).toLowerCase().match(/[\p{L}\p{N}']+/gu) || []);
function postChecks(p, all) {
  const out = [];
  const kw = (p.focusKeyword || '').trim();
  const title = (p.seoTitle || '').trim() || `${p.title} · Newsign Labs`;
  const desc = (p.description || '').trim();
  const body = p.body || '';
  const wc = wordCount(body);

  if (!p.title.trim()) out.push(['bad', 'Add a title: it is the page\'s H1.']);
  if (!SLUG.test(p.slug || '')) out.push(['bad', 'The address must be lowercase words joined by hyphens.']);
  else if (all.filter((x) => x.slug === p.slug).length > 1) out.push(['bad', `Another post already uses /blog/${p.slug}/.`]);
  if (p.__base && p.__base.status === 'published' && p.__base.slug !== p.slug) out.push(['warn', `The address changed from /blog/${p.__base.slug}/: links and search results pointing there will break.`]);

  const tl = title.length;
  out.push([tl >= 30 && tl <= 60 ? 'good' : tl > 60 ? 'bad' : 'warn', `Search title is ${tl} characters (aim for 30–60).${p.seoTitle ? '' : ' Built from the title; set an SEO title to control it.'}`]);
  const dl = desc.length;
  out.push([dl >= 120 && dl <= 160 ? 'good' : dl ? 'warn' : 'bad', dl ? `Description is ${dl} characters (aim for 120–160).` : 'Add a description: search results and the post list show it.']);

  if (kw) {
    const check = (label, text) => {
      const m = deps.kwMatch(text, kw);
      out.push([m === 'exact' ? 'good' : m === 'partial' ? 'warn' : 'bad', m === 'exact' ? `Focus keyword is in the ${label}.` : m === 'partial' ? `The ${label} has the keyword's words, not the exact phrase.` : `Focus keyword is missing from the ${label}.`]);
    };
    check('title', `${p.title} ${p.seoTitle || ''}`);
    check('description', desc);
    check('first 100 words', words(body).slice(0, 100).join(' '));
    const subheads = (body.match(/^#{2,3}\s+.+$/gm) || []).join(' ');
    out.push([deps.kwMatch(subheads, kw) !== 'missing' ? 'good' : 'warn', deps.kwMatch(subheads, kw) !== 'missing' ? 'A subheading uses the focus keyword.' : 'No ## subheading uses the focus keyword; work it into one.']);
    const others = all.filter((x) => x !== p && (x.focusKeyword || '').trim().toLowerCase() === kw.toLowerCase());
    if (others.length) out.push(['warn', `"${others[0].title}" targets the same keyword; two posts competing for one search split the ranking.`]);
  } else {
    out.push(['warn', 'Set a focus keyword: the search phrase this post should rank for.']);
  }

  if (/^#\s/m.test(body)) out.push(['warn', 'A line starts with a single #. The title is the only H1; use ## for sections.']);
  const levels = (body.match(/^(#{2,4})\s/gm) || []).map((h) => h.trim().length);
  if (levels.some((l, i) => l - (i ? levels[i - 1] : 2) > 1)) out.push(['warn', 'A heading skips a level (## then ####). Go one level at a time.']);
  if (!levels.length && wc > 250) out.push(['warn', 'Break the text up with ## subheadings.']);

  out.push([wc >= 600 ? 'good' : wc >= 300 ? 'warn' : 'bad', `${wc} words, ${readingMinutes(body)} min read${wc < 600 ? ': posts under ~600 words rarely rank; aim for 800–1,500 that answer the question fully.' : '.'}`]);
  const internal = (body.match(/\]\(\/(?!\/)[^)]*\)/g) || []).length;
  out.push([internal >= 2 ? 'good' : 'warn', internal >= 2 ? `${internal} links to this site.` : `${internal} link${internal === 1 ? '' : 's'} to this site: add at least two, to other posts (/blog/…/) or sections (/#services, /#contact).`]);
  if (/\]\((?!\/|https:\/\/|#)[^)]*\)/.test(body)) out.push(['bad', 'A link is not /… or https://…; it will show as plain text.']);
  if (p.status === 'published' && p.published > today()) out.push(['warn', `Scheduled: goes live with the first publish on or after ${p.published}.`]);
  return out;
}

/* ----------------------------------------------------------------- render */
function render() {
  const root = $('#journal');
  const dirty = !same(posts, base);
  setHTML(root, `
    <header class="group__head journal__head">
      <div>
        <h2 class="group__title">Journal</h2>
        <p class="group__intro">Articles for search engines and AI tools. Published posts get their own page at <b>newsignlabs.in/blog/…</b>: anyone with the link can read them, but the site's menu and homepage do not link to them. They are listed in the sitemap, /llms.txt and an RSS feed, so search engines find them. Development never shows them.</p>
      </div>
      <div class="journal__actions">
        <button class="btn btn--ghost" type="button" data-j="new"><span>New post</span></button>
        <button class="btn btn--primary" type="button" data-j="publish"${dirty ? '' : ' disabled'}><span>Publish posts</span></button>
      </div>
    </header>
    <div class="banner" id="journal-banner" hidden></div>
    <ol class="journal__list">${posts.map((p, i) => `
      <li><button type="button" class="journal__item${i === current ? ' is-active' : ''}" data-open="${i}">
        <span class="journal__status journal__status--${p.status === 'published' ? (p.published > today() ? 'scheduled' : 'live') : 'draft'}">${p.status === 'published' ? (p.published > today() ? 'Scheduled' : 'Published') : 'Draft'}</span>
        <b>${esc(p.title || 'Untitled')}</b>
        <small>/blog/${esc(p.slug || '…')}/ · ${esc(p.published || 'no date')}${changed(p) ? ' · <i>unpublished change</i>' : ''}</small>
      </button></li>`).join('') || '<li class="journal__empty">No posts yet. Start with <b>New post</b>.</li>'}
    </ol>
    <div id="journal-editor"></div>`);
  renderEditor();
}

const changed = (p) => !p.__base || JSON.stringify(clean(p)) !== JSON.stringify(clean(p.__base));

function field(key, label, note, input) {
  return `<div class="field" data-jf="${key}"><div class="field__top"><label class="field__label" for="j-${key}">${label}</label></div>${input}${note ? `<p class="field__note">${note}</p>` : ''}</div>`;
}
const text = (key, p, attrs = '') => `<input id="j-${key}" data-k="${key}" type="text" value="${esc(p[key] || '')}" ${attrs} />`;

function renderEditor() {
  const ed = $('#journal-editor');
  const p = posts[current];
  if (!p) { setHTML(ed, ''); return; }
  setHTML(ed, `
    <section class="journal__editor">
      <div class="grid2">
        ${field('title', 'Title', 'The page\'s H1. Say what the reader gets: "How to keep 3D websites fast on phones".', text('title', p))}
        ${field('slug', 'Address', `Becomes <b>/blog/<span data-slug>${esc(p.slug)}</span>/</b>. Short, lowercase, hyphenated; keep it once published.`, text('slug', p, 'spellcheck="false"'))}
      </div>
      <div class="grid2">
        ${field('seoTitle', 'SEO title (optional)', 'The blue headline in Google, 30–60 characters. Empty: the title plus "· Newsign Labs".', text('seoTitle', p))}
        ${field('focusKeyword', 'Focus keyword', 'The search phrase this post should rank for. One per post.', text('focusKeyword', p))}
      </div>
      ${field('description', 'Description', 'Meta description and summary in lists and /llms.txt: 120–160 characters that make someone click.', `<textarea id="j-description" data-k="description" rows="2">${esc(p.description || '')}</textarea>`)}
      <div class="grid4">
        ${field('status', 'Status', '', `<select id="j-status" data-k="status"><option value="draft"${p.status !== 'published' ? ' selected' : ''}>Draft (not on the site)</option><option value="published"${p.status === 'published' ? ' selected' : ''}>Published</option></select>`)}
        ${field('published', 'Publish date', '', `<input id="j-published" data-k="published" type="date" value="${esc(p.published || '')}" />`)}
        ${field('updated', 'Updated (optional)', '', `<input id="j-updated" data-k="updated" type="date" value="${esc(p.updated || '')}" />`)}
        ${field('tags', 'Tags', 'Comma-separated; related posts share tags.', text('tags', p))}
      </div>
      <div class="journal__write">
        ${field('body', 'Article', '<b>## Section</b>, <b>### Subsection</b>, <b>- list</b>, <b>1. list</b>, <b>&gt; quote</b>, <b>**bold**</b>, <b>*italic*</b>, <b>[link](/blog/other-post/)</b>. Blank line between paragraphs.', `<textarea id="j-body" data-k="body" rows="24" spellcheck="true">${esc(p.body || '')}</textarea>`)}
        <div class="journal__preview" aria-label="Preview">
          <p class="journal__preview-label">Preview</p>
          <article class="nl-prose-admin"><h1 data-preview-title></h1><div data-preview-body></div></article>
        </div>
      </div>
      <div class="panel"><h3 class="panel__title">SEO checks for this post</h3><ul class="checks" id="journal-checks"></ul></div>
      <div class="journal__foot">
        <button class="link" type="button" data-j="copy">Copy link</button>
        <button class="link" type="button" data-j="revert"${p.__base && changed(p) ? '' : ' hidden'}>Undo changes to this post</button>
        <button class="link journal__delete" type="button" data-j="delete">Delete post</button>
      </div>
    </section>`);
  refresh(p);
}

let previewTimer;
function refresh(p) {
  setHTML($('#journal-checks'), postChecks(p, posts).map(([lvl, msg]) => `<li class="${lvl}"><span>${esc(msg)}</span></li>`).join(''));
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    $('[data-preview-title]').textContent = p.title || 'Untitled';
    setHTML($('[data-preview-body]'), renderMarkdown(p.body));
  }, 120);
  const slugEl = $('[data-slug]'); if (slugEl) slugEl.textContent = p.slug;
  const pub = $('[data-j="publish"]'); if (pub) pub.disabled = same(posts, base);
  const row = document.querySelector(`[data-open="${current}"]`);
  if (row) {
    row.querySelector('b').textContent = p.title || 'Untitled';
    row.querySelector('small').textContent = `/blog/${p.slug || '…'}/ · ${p.published || 'no date'}${changed(p) ? ' · unpublished change' : ''}`;
  }
  updateNavPill();
}

function updateNavPill() {
  const pill = $('#nav-journal .pill');
  if (!pill) return;
  const n = posts.filter(changed).length + base.filter((b) => !posts.some((p) => p.__base === b)).length;
  pill.hidden = !n; pill.textContent = n; pill.className = 'pill pill--edit';
}

/* ----------------------------------------------------------------- events */
function bind() {
  const root = $('#journal');
  root.addEventListener('input', (e) => {
    const k = e.target.dataset.k; const p = posts[current];
    if (!k || !p) return;
    p[k] = e.target.value;
    if (k === 'slug') { slugTouched.add(p); }
    if (k === 'title' && !slugTouched.has(p) && !(p.__base && p.__base.status === 'published')) {
      p.slug = slugify(p.title); const s = $('#j-slug'); if (s) s.value = p.slug;
    }
    if (k === 'status' && p.status === 'published' && !p.published) { p.published = today(); $('#j-published').value = p.published; }
    refresh(p); saveDraft();
  });
  root.addEventListener('click', async (e) => {
    const open = e.target.closest('[data-open]');
    if (open) { current = Number(open.dataset.open); render(); $('#journal-editor').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const act = e.target.closest('[data-j]')?.dataset.j;
    if (!act) return;
    const p = posts[current];
    if (act === 'new') {
      posts.unshift({ slug: '', status: 'draft', title: '', seoTitle: '', description: '', focusKeyword: '', tags: '', published: today(), updated: '', author: '', body: '' });
      current = 0; render(); saveDraft(); $('#j-title').focus();
    } else if (act === 'delete' && p) {
      if (!confirm(`Delete "${p.title || 'Untitled'}"?${p.__base && p.__base.status === 'published' ? ' Its page goes offline with the next publish.' : ''}`)) return;
      posts.splice(current, 1); current = -1; render(); saveDraft();
    } else if (act === 'revert' && p && p.__base) {
      posts[current] = withBase({ ...p.__base }, p.__base); render(); saveDraft();
    } else if (act === 'copy' && p) {
      const url = `${SITE}/blog/${p.slug}/`;
      try { await navigator.clipboard.writeText(url); deps.toast(`Copied ${url}`); } catch { deps.toast(url, 8000); }
    } else if (act === 'publish') {
      openPublish();
    } else if (act === 'reload') {
      await reloadKeepingEdits();
    }
  });
}

/* ---------------------------------------------------------- load & publish */
const withBase = (p, b) => { Object.defineProperty(p, '__base', { value: b, enumerable: false, writable: true }); return p; };

async function load() {
  const { status, json } = await deps.api('blog');
  if (status === 404) throw new Error('The admin service has no Journal yet: upload the latest newsign_admin.zip (admin/README.md).');
  if (status !== 200) throw new Error('Could not load the Journal. Please try again.');
  return { posts: json.posts || [], sha: json.sha ?? null };
}

function adopt(serverPosts, serverSha) {
  base = serverPosts.map((p) => ({ ...p }));
  sha = serverSha;
  posts = base.map((b) => withBase({ ...b }, b));
}

async function open() {
  if (!loaded) {
    try {
      const r = await load();
      adopt(r.posts, r.sha);
      const saved = store.get();
      if (saved && Array.isArray(saved.posts) && !same(saved.posts, base)) {
        // restore unpublished edits, matching posts to their published versions by address
        posts = saved.posts.map((sp) => withBase({ ...sp }, base.find((b) => b.slug === sp.slug)));
        deps.toast('Restored your unpublished Journal changes.');
      }
      loaded = true;
    } catch (err) {
      if (err.name === 'AuthError' || err.constructor?.name === 'AuthError') { deps.onAuthError(err.message); return; }
      setHTML($('#journal'), `<p class="banner">${esc(err.message)}</p>`);
      return;
    }
  }
  render();
}

// After a conflict: take the latest posts from GitHub and lay this browser's edits on top.
async function reloadKeepingEdits() {
  const r = await load();
  const edited = posts.filter(changed);
  const deleted = base.filter((b) => !posts.some((p) => p.__base === b)).map((b) => b.slug);
  adopt(r.posts, r.sha);
  posts = posts.filter((p) => !deleted.includes(p.slug));
  for (const e of edited) {
    const at = posts.findIndex((p) => p.slug === (e.__base ? e.__base.slug : e.slug));
    if (at >= 0) posts[at] = withBase({ ...clean(e) }, posts[at].__base);
    else posts.unshift(withBase({ ...clean(e) }, undefined));
  }
  current = -1; render(); saveDraft();
  deps.toast('Loaded the latest posts with your changes on top. Check them, then publish again.', 7000);
}

function openPublish() {
  const problems = posts.flatMap((p) => postChecks(p, posts).filter(([l, m]) => l === 'bad' && /address|title: it is|Another post|plain text/.test(m)).map(([, m]) => `${p.title || 'Untitled'}: ${m}`));
  if (problems.length) { deps.toast(`Fix first: ${problems[0]}`, 8000); return; }
  const dlg = $('#dlg-journal');
  const added = posts.filter((p) => !p.__base), edited = posts.filter((p) => p.__base && changed(p));
  const removed = base.filter((b) => !posts.some((p) => p.__base === b));
  setHTML($('#journal-summary'), [
    ...added.map((p) => `<li><b>New:</b> ${esc(p.title || 'Untitled')} <small>(${p.status})</small></li>`),
    ...edited.map((p) => `<li><b>Changed:</b> ${esc(p.title || 'Untitled')} <small>(${p.status})</small></li>`),
    ...removed.map((b) => `<li><b>Deleted:</b> ${esc(b.title)}</li>`),
  ].join(''));
  $('#journal-msg').textContent = '';
  $('#journal-note').value = '';
  dlg.showModal();
}

async function publish() {
  const btn = $('#btn-journal-go'), msg = $('#journal-msg');
  btn.disabled = true; msg.className = 'dlg__msg'; msg.textContent = 'Publishing…';
  try {
    const { status, json } = await deps.api('blog-publish', { posts: posts.map(clean), sha, note: $('#journal-note').value.trim() });
    if (status === 409) {
      msg.className = 'dlg__msg is-bad';
      msg.textContent = 'The Journal was changed somewhere else since you opened it.';
      $('#btn-journal-reload').hidden = false;
      return;
    }
    if (status === 400) { msg.className = 'dlg__msg is-bad'; msg.textContent = (json.issues || ['The posts could not be saved.']).slice(0, 3).join(' · '); return; }
    if (status === 404) { msg.className = 'dlg__msg is-bad'; msg.textContent = 'The admin service has no Journal yet: upload the latest newsign_admin.zip (admin/README.md).'; return; }
    if (status !== 200) { msg.className = 'dlg__msg is-bad'; msg.textContent = 'Publishing failed. Please try again.'; return; }
    const r = await load();
    adopt(r.posts, r.sha); store.del(); current = -1;
    $('#dlg-journal').close(); render();
    deps.toast(json.unchanged ? 'Nothing to publish.' : 'Published. Live posts appear on newsignlabs.in/blog/ in a couple of minutes.', 7000);
  } catch (err) {
    if (err.constructor?.name === 'AuthError') { $('#dlg-journal').close(); deps.onAuthError(err.message); return; }
    msg.className = 'dlg__msg is-bad'; msg.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
}

/* ------------------------------------------------------------------- view */
function show(journal) {
  document.body.classList.toggle('is-journal', journal);
  $('#journal').hidden = !journal;
  $('#nav-journal').classList.toggle('is-active', journal);
  $('#nav-copy').classList.toggle('is-active', !journal);
  if (journal) open();
}

export function initJournal(d) {
  deps = d;
  bind();
  $('#nav-journal').addEventListener('click', () => show(true));
  $('#nav-copy').addEventListener('click', () => show(false));
  $('#btn-journal-go').addEventListener('click', publish);
  $('#btn-journal-reload').addEventListener('click', async () => { $('#dlg-journal').close(); $('#btn-journal-reload').hidden = true; await reloadKeepingEdits(); });
  addEventListener('pagehide', () => { if (loaded) saveDraft(); });
  if (location.hash === '#journal') show(true);
}

export { postChecks, slugify };
