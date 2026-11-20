'use strict';

/*
 * The only files the admin may write, and how:
 *   content/site.js  window.__NL_CONTENT = { "<key>": "<text>", ... }  (every key must exist in admin/schema.js)
 *   index.html       only <title>, the description / og / twitter meta tags and the loader word
 */
const CONTENT_PATH = 'content/site.js';
const INDEX_PATH = 'index.html';
const SCHEMA_PATH = 'admin/schema.js';
const MAX_VALUE = 4000;

const HEADER = '/* Newsign Labs site copy. Edit it at /admin; publishing there rewrites this file. */\n';

/** Parses `... = {json};` files (content/site.js, admin/schema.js). */
function parseAssigned(text) {
  const m = /window\.[A-Za-z_]+\s*=\s*/.exec(text);
  if (!m) throw new Error('unexpected file format');
  const start = m.index + m[0].length;
  const open = text[start];
  const b = text.lastIndexOf(open === '[' ? ']' : '}');
  if ((open !== '{' && open !== '[') || b < start) throw new Error('unexpected file format');
  return JSON.parse(text.slice(start, b + 1));
}

/** Field keys in admin order, from admin/schema.js (window.NL_SCHEMA = [groups]). */
function schemaKeys(schemaText) {
  const groups = parseAssigned(schemaText);
  return groups.flatMap((g) => (g.fields || []).map((f) => f.key));
}

/** Returns a list of problems; empty when the content can be written. */
function validateContent(content, keys) {
  const issues = [];
  if (!content || typeof content !== 'object' || Array.isArray(content)) return ['content must be an object of text fields'];
  const known = new Set(keys);
  for (const [k, v] of Object.entries(content)) {
    if (!known.has(k)) issues.push(`unknown field "${k}"`);
    else if (typeof v !== 'string') issues.push(`"${k}" must be text`);
    else if (v.length > MAX_VALUE) issues.push(`"${k}" is longer than ${MAX_VALUE} characters`);
  }
  return issues;
}

/** Same layout as the admin's "Download content file": schema order, one key per line. */
function serializeContent(content, keys) {
  const ordered = {};
  for (const k of keys) if (typeof content[k] === 'string') ordered[k] = content[k];
  return HEADER + 'window.__NL_CONTENT = ' + JSON.stringify(ordered, null, 1) + ';\n';
}

const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Writes the SEO fields into index.html so crawlers see them without running JavaScript. */
function updateIndexHtml(html, c) {
  const val = (k) => (typeof c[k] === 'string' && c[k].trim() ? c[k].trim() : null);
  const meta = (h, re, v) => (v ? h.replace(re, (m, a, _old, z) => `${a}${attr(v)}${z}`) : h);
  let out = html;
  if (val('seo.title')) out = out.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${attr(val('seo.title'))}</title>`);
  out = meta(out, /(<meta name="description" content=")([^"]*)(")/, val('seo.description'));
  out = meta(out, /(<meta property="og:title" content=")([^"]*)(")/, val('seo.ogTitle'));
  out = meta(out, /(<meta property="og:description" content=")([^"]*)(")/, val('seo.ogDescription'));
  out = meta(out, /(<meta name="twitter:title" content=")([^"]*)(")/, val('seo.ogTitle'));
  out = meta(out, /(<meta name="twitter:description" content=")([^"]*)(")/, val('seo.ogDescription'));
  if (val('loader.word')) out = out.replace(/(<span class="nl-loader__word">)[\s\S]*?(<\/span>)/, (m, a, z) => `${a}${attr(val('loader.word'))}${z}`);
  return out;
}

/*
 * Journal (unlisted blog): content/blog.js  window.__NL_BLOG = [ {post}, ... ]
 * The production build turns published posts into /blog/<slug>/ pages (.github/scripts/blog.mjs).
 */
const BLOG_PATH = 'content/blog.js';
const BLOG_HEADER = '/* Newsign Labs Journal posts. Edit them at /admin (Journal); publishing there rewrites this file. */\n';
const BLOG_FIELDS = ['slug', 'status', 'title', 'seoTitle', 'description', 'focusKeyword', 'tags', 'published', 'updated', 'author', 'body'];
const BLOG_LIMITS = { body: 40000, default: 400 };
const MAX_POSTS = 200;
const MAX_BLOG_FILE = 1024 * 1024;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Returns a list of problems; empty when the posts can be written. */
function validateBlog(posts) {
  if (!Array.isArray(posts)) return ['posts must be a list'];
  if (posts.length > MAX_POSTS) return [`at most ${MAX_POSTS} posts`];
  const issues = [];
  const slugs = new Set();
  posts.forEach((p, i) => {
    const at = `post ${i + 1}`;
    if (!p || typeof p !== 'object' || Array.isArray(p)) { issues.push(`${at} must be an object`); return; }
    for (const [k, v] of Object.entries(p)) {
      if (!BLOG_FIELDS.includes(k)) issues.push(`${at}: unknown field "${k}"`);
      else if (typeof v !== 'string') issues.push(`${at}: "${k}" must be text`);
      else if (v.length > (BLOG_LIMITS[k] || BLOG_LIMITS.default)) issues.push(`${at}: "${k}" is too long`);
    }
    if (typeof p.slug !== 'string' || !SLUG.test(p.slug) || p.slug.length > 80) issues.push(`${at}: the address must be lowercase words joined by hyphens`);
    else if (slugs.has(p.slug)) issues.push(`${at}: the address "${p.slug}" is used twice`);
    else slugs.add(p.slug);
    if (!['draft', 'published'].includes(p.status)) issues.push(`${at}: status must be draft or published`);
    if (typeof p.title !== 'string' || !p.title.trim()) issues.push(`${at}: a title is required`);
    for (const k of ['published', 'updated']) if (p[k] && !DATE.test(p[k])) issues.push(`${at}: "${k}" must be a date (YYYY-MM-DD)`);
    if (p.status === 'published' && !DATE.test(p.published || '')) issues.push(`${at}: a published post needs a publish date`);
  });
  return issues;
}

/** Fixed field order, one post per block, so diffs stay readable. */
function serializeBlog(posts) {
  const ordered = posts.map((p) => Object.fromEntries(BLOG_FIELDS.filter((k) => typeof p[k] === 'string').map((k) => [k, p[k]])));
  const text = BLOG_HEADER + 'window.__NL_BLOG = ' + JSON.stringify(ordered, null, 1) + ';\n';
  if (Buffer.byteLength(text) > MAX_BLOG_FILE) throw Object.assign(new Error('blog file too large'), { status: 413 });
  return text;
}

module.exports = {
  CONTENT_PATH, INDEX_PATH, SCHEMA_PATH, parseAssigned, schemaKeys, validateContent, serializeContent, updateIndexHtml,
  BLOG_PATH, BLOG_FIELDS, validateBlog, serializeBlog,
};
