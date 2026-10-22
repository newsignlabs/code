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

module.exports = { CONTENT_PATH, INDEX_PATH, SCHEMA_PATH, parseAssigned, schemaKeys, validateContent, serializeContent, updateIndexHtml };
