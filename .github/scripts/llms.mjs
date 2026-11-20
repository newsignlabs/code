#!/usr/bin/env node
// Builds what search engines and AI tools read on Production (newsignlabs.in), from the
// published site copy (content/site.js, with admin/schema.js defaults for empty fields):
//   llms.txt        the "AI & LLMs" admin fields, in the llmstxt.org format
//   llms-full.txt   the whole site copy as Markdown
//   sitemap.xml, robots.txt (open to search engines and AI crawlers)
//   index.html      index/follow, canonical link, JSON-LD, and the copy as plain HTML inside
//                   #root for crawlers that do not run JavaScript (React replaces it on start)
// The production build runs it before removing admin/:  node .github/scripts/llms.mjs <dir>
// Development is never built with it, so it stays closed to crawlers.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const SITE = 'https://www.newsignlabs.in';
const SOCIAL = [
  'https://www.instagram.com/newsignlabs/',
  'https://www.linkedin.com/company/newsignlabs/',
  'https://www.youtube.com/@newsignlabs',
];

/** `window.X = {...};` / `[...]` files (content/site.js, admin/schema.js). */
function parseAssigned(text) {
  const m = /window\.[A-Za-z_]+\s*=\s*/.exec(text);
  const start = m.index + m[0].length;
  return JSON.parse(text.slice(start, text.lastIndexOf(text[start] === '[' ? ']' : '}') + 1));
}

/** Published copy, with each schema default standing in for an empty field (as the site does). */
export function loadContent(dir) {
  const content = parseAssigned(readFileSync(join(dir, 'content/site.js'), 'utf8'));
  const fields = parseAssigned(readFileSync(join(dir, 'admin/schema.js'), 'utf8')).flatMap((g) => g.fields || []);
  const c = {};
  for (const f of fields) c[f.key] = typeof content[f.key] === 'string' && content[f.key].trim() ? content[f.key].trim() : (f.default || '').trim();
  return c;
}

/** Journal posts that are published and due (content/blog.js), newest first. */
export function loadPosts(dir, today = new Date().toISOString().slice(0, 10)) {
  const file = join(dir, 'content/blog.js');
  if (!existsSync(file)) return [];
  return parseAssigned(readFileSync(file, 'utf8'))
    .filter((p) => p.status === 'published' && /^\d{4}-\d{2}-\d{2}$/.test(p.published || '') && p.published <= today)
    .map((p) => ({
      ...p,
      title: p.title.trim(),
      description: (p.description || '').trim(),
      tags: (p.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      updated: p.updated && p.updated >= p.published ? p.updated : p.published,
      author: (p.author || '').trim() || 'Newsign Labs',
      url: `${SITE}/blog/${p.slug}/`,
    }))
    .sort((a, b) => (a.published < b.published ? 1 : a.published > b.published ? -1 : 0));
}

const lines = (s) => (s || '').split('\n').map((x) => x.trim()).filter(Boolean);
const each = (c, prefix, field) => { const out = []; for (let i = 0; c[`${prefix}.${i}.${field}`]; i++) out.push(i); return out; };
const h1 = (c) => [c['hero.h1.line1'], c['hero.h1.highlight'], c['hero.h1.line3']].join(' ').replace(/\s+/g, ' ').trim();
const h2 = (c, p) => `${c[`${p}.h2a`]} ${c[`${p}.h2b`]}`.replace(/\s+/g, ' ').trim();
const plainTitle = (s) => s.replace(/\s*\/\s*/, ': ').replace(/\b([A-Z]{2,})\b/g, (w) => w[0] + w.slice(1).toLowerCase());

export function buildLlmsTxt(c, posts = []) {
  const out = ['# Newsign Labs', '', `> ${c['llms.summary']}`, '', c['llms.about'], ''];
  const section = (title, body) => { if (body.length) out.push(`## ${title}`, '', ...body, ''); };
  section('Services', lines(c['llms.services']).map((s) => `- ${s}`));
  section('Who we work with', [c['llms.audience']].filter(Boolean));
  section('Key facts', lines(c['llms.facts']).map((s) => `- ${s}`));
  section('Contact', [c['llms.contact']].filter(Boolean));
  section('Notes', [c['llms.notes']].filter(Boolean));
  section('Pages', [
    `- [Full site copy](${SITE}/llms-full.txt): services, selected work, process, ways to work and FAQ in one Markdown file`,
    `- [Home](${SITE}/): ${c['seo.description']}`,
    `- [Services](${SITE}/#services): ${c['services.intro']}`,
    `- [Selected work](${SITE}/#work): product, design-system and messaging projects`,
    `- [Process](${SITE}/#approach): discovery sprint, prototype and design, build and launch`,
    `- [Start a project](${SITE}/#contact): ${c['contact.text']}`,
  ]);
  section('Articles', posts.map((p) => `- [${p.title}](${p.url})${p.description ? `: ${p.description}` : ''}`));
  section('Optional', SOCIAL.map((u) => `- [${/instagram/.test(u) ? 'Instagram' : /linkedin/.test(u) ? 'LinkedIn' : 'YouTube'}](${u})`));
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export function buildLlmsFull(c, posts = []) {
  const o = [`# Newsign Labs: ${c['seo.title'].replace(/^Newsign Labs\s*·\s*/, '')}`, '', `> ${c['llms.summary']}`, '',
    `## ${h1(c)}`, '', c['hero.lead'], '', c['llms.about'], ''];
  o.push(`## Services: ${h2(c, 'services')}`, '', c['services.intro'], '');
  for (const i of each(c, 'services', 'title')) o.push(`### ${c[`services.${i}.title`]}`, '', c[`services.${i}.text`], '');
  o.push(`## Selected work: ${h2(c, 'work')}`, '');
  for (const i of each(c, 'projects', 'name')) {
    const p = (k) => c[`projects.${i}.${k}`];
    o.push(`### ${plainTitle(p('name'))}`, '', `*${p('type')}*`, '', p('summary'), '', `- Scope: ${p('scope')}`, `- Result: ${p('result')}`, '');
  }
  o.push(`## How we work: ${h2(c, 'approach')}`, '');
  for (const i of each(c, 'process', 'phase')) {
    const step = c[`approach.steps.${i}.title`];
    o.push(`### ${i + 1}. ${c[`process.${i}.phase`]} (${c[`process.${i}.time`]})${step ? `: ${step}` : ''}`, '', c[`process.${i}.lead`], '',
      'What happens:', ...lines(c[`process.${i}.happens`]).map((s) => `- ${s}`), '', 'What you get:', ...lines(c[`process.${i}.get`]).map((s) => `- ${s}`), '');
  }
  o.push(`## Ways to work: ${h2(c, 'engage')}`, '', c['engage.intro'], '');
  for (const i of each(c, 'engage', 'name')) {
    o.push(`### ${c[`engage.${i}.name`]} (${c[`engage.${i}.time`]})`, '', c[`engage.${i}.text`], '', ...lines(c[`engage.${i}.items`]).map((s) => `- ${s}`), '');
  }
  o.push('## Frequently asked questions', '');
  for (const i of each(c, 'faq', 'q')) o.push(`### ${c[`faq.${i}.q`]}`, '', c[`faq.${i}.a`], '');
  o.push(`## Contact: ${h2(c, 'contact')}`, '', c['contact.text'], '', c['llms.contact'], '');
  if (posts.length) {
    o.push('## Journal articles', '');
    for (const p of posts) o.push(`### [${p.title}](${p.url})`, '', `*${p.published}${p.tags.length ? ` · ${p.tags.join(', ')}` : ''}*`, '', p.description, '');
  }
  return o.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The copy as plain semantic HTML for crawlers without JavaScript; React replaces it on start. */
export function buildStaticHtml(c) {
  const p = (s) => `<p>${esc(s)}</p>`;
  const o = [`<main class="nl-static">`, `<h1>${esc(h1(c))}</h1>`, p(c['hero.lead']),
    `<section id="services"><h2>${esc(h2(c, 'services'))}</h2>${p(c['services.intro'])}`,
    ...each(c, 'services', 'title').map((i) => `<h3>${esc(c[`services.${i}.title`])}</h3>${p(c[`services.${i}.text`])}`), '</section>',
    `<section id="work"><h2>${esc(h2(c, 'work'))}</h2>`,
    ...each(c, 'projects', 'name').map((i) => `<h3>${esc(plainTitle(c[`projects.${i}.name`]))}</h3>${p(c[`projects.${i}.summary`])}${p(c[`projects.${i}.result`])}`), '</section>',
    `<section id="approach"><h2>${esc(h2(c, 'approach'))}</h2>`,
    ...each(c, 'process', 'phase').map((i) => `<h3>${esc(c[`process.${i}.phase`])}</h3>${p(c[`process.${i}.lead`])}`), '</section>',
    `<section id="engage"><h2>${esc(h2(c, 'engage'))}</h2>${p(c['engage.intro'])}`,
    ...each(c, 'engage', 'name').map((i) => `<h3>${esc(c[`engage.${i}.name`])}</h3>${p(c[`engage.${i}.text`])}`), '</section>',
    `<section id="faq"><h2>${esc(h2(c, 'faq'))}</h2>`,
    ...each(c, 'faq', 'q').map((i) => `<h3>${esc(c[`faq.${i}.q`])}</h3>${p(c[`faq.${i}.a`])}`), '</section>',
    `<section id="contact"><h2>${esc(h2(c, 'contact'))}</h2>${p(c['contact.text'])}</section>`, '</main>'];
  return o.join('');
}

export function buildJsonLd(c) {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'Newsign Labs', url: `${SITE}/`, logo: `${SITE}/assets/logo.svg`,
        description: c['llms.summary'], foundingDate: '2024', sameAs: SOCIAL },
      { '@type': 'WebSite', '@id': `${SITE}/#site`, url: `${SITE}/`, name: 'Newsign Labs', inLanguage: 'en', publisher: { '@id': `${SITE}/#org` } },
      { '@type': 'FAQPage', '@id': `${SITE}/#faq`, mainEntity: each(c, 'faq', 'q').map((i) => ({
        '@type': 'Question', name: c[`faq.${i}.q`], acceptedAnswer: { '@type': 'Answer', text: c[`faq.${i}.a`] } })) },
    ],
  };
  // inside a <script> block: never let copy close it
  return JSON.stringify(graph).replace(/</g, '\\u003c');
}

export const ROBOTS = `# Newsign Labs (Production): open to search engines and AI tools.
# Development keeps its own robots.txt, which blocks everything.
User-agent: *
Allow: /
Disallow: /404.html
Disallow: /maintenance.html

# AI search, AI assistants fetching a page for a person, and AI training: all welcome.
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: GPTBot
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: ClaudeBot
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: CCBot
Allow: /
Disallow: /404.html
Disallow: /maintenance.html

Sitemap: ${SITE}/sitemap.xml
`;

export function buildSitemap(date, posts = []) {
  const url = (loc, mod) => `  <url><loc>${loc}</loc><lastmod>${mod}</lastmod></url>`;
  const newest = posts.reduce((m, p) => (p.updated > m ? p.updated : m), '');
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', url(`${SITE}/`, date),
    ...(posts.length ? [url(`${SITE}/blog/`, newest), ...posts.map((p) => url(p.url, p.updated))] : []), '</urlset>', ''].join('\n');
}

/** index.html for Production: indexable, canonical, structured data, static copy in #root. */
export function openIndexHtml(html, c) {
  const must = (cond, what) => { if (!cond) throw new Error(`index.html: ${what} not found`); };
  must(html.includes('<meta name="robots" content="noindex, nofollow" />'), 'robots meta');
  must(html.includes('<div id="root"></div>'), 'empty #root');
  must(html.includes('</head>'), '</head>');
  return html
    .replace('<meta name="robots" content="noindex, nofollow" />', '<meta name="robots" content="index, follow, max-image-preview:large" />')
    .replace('</head>', `    <link rel="canonical" href="${SITE}/" />\n    <script type="application/ld+json">${buildJsonLd(c)}</script>\n  </head>`)
    .replace('<div id="root"></div>', () => `<div id="root">${buildStaticHtml(c)}</div>`);
}

export function build(dir, date = new Date().toISOString().slice(0, 10)) {
  const c = loadContent(dir);
  const posts = loadPosts(dir, date);
  writeFileSync(join(dir, 'llms.txt'), buildLlmsTxt(c, posts));
  writeFileSync(join(dir, 'llms-full.txt'), buildLlmsFull(c, posts));
  writeFileSync(join(dir, 'sitemap.xml'), buildSitemap(date, posts));
  writeFileSync(join(dir, 'robots.txt'), ROBOTS);
  writeFileSync(join(dir, 'index.html'), openIndexHtml(readFileSync(join(dir, 'index.html'), 'utf8'), c));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = process.argv[2] || '.';
  build(dir);
  console.log(`llms.txt, llms-full.txt, sitemap.xml, robots.txt and index.html written in ${dir}`);
}
