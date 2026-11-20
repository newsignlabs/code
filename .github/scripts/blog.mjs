#!/usr/bin/env node
// Journal (unlisted blog) for Production: turns the published posts in content/blog.js into
//   /blog/<slug>/index.html   one page per post (indexable, canonical, JSON-LD BlogPosting)
//   /blog/index.html          the hub listing every post (not linked from the site)
//   /blog/feed.xml            RSS
// The pages reuse the site's CSP and page loader from 404.html, so csp.mjs hashes cover them.
// llms.mjs adds the posts to sitemap.xml, llms.txt and llms-full.txt.
// Run by the production build:  node .github/scripts/blog.mjs <dir>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderMarkdown, readingMinutes, wordCount, esc } from '../../assets/markdown.js';
import { SITE, loadContent, loadPosts } from './llms.mjs';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const human = (d) => { const [y, m, day] = d.split('-').map(Number); return `${day} ${MONTHS[m - 1]} ${y}`; };
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

/** Related: most shared tags first, then newest. */
export function related(post, posts, n = 3) {
  return posts.filter((p) => p.slug !== post.slug)
    .map((p) => ({ p, score: p.tags.filter((t) => post.tags.includes(t)).length }))
    .sort((a, b) => b.score - a.score || (a.p.published < b.p.published ? 1 : -1))
    .slice(0, n).map((x) => x.p);
}

/** CSP meta, build meta and the page loader, copied from 404.html so the hash always matches. */
function securityParts(dir) {
  const html = readFileSync(join(dir, '404.html'), 'utf8');
  const csp = /<meta http-equiv="Content-Security-Policy" content="[^"]*" \/>/.exec(html)[0];
  const loader = /<script data-load='[^']*'>([\s\S]*?)<\/script>/.exec(html)[1];
  return { csp, loader };
}

function page({ dir, title, description, canonical, type = 'website', extraMeta = '', jsonLd, body }) {
  const { csp, loader } = securityParts(dir);
  const load = JSON.stringify(['/assets/vendor/purify.min.js', '/content/site.js', '/assets/chat-buttons.js']);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    ${csp}
    <meta name="nl-build" content="" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="theme-color" content="#100d15" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${esc(canonical)}" />
    <link rel="alternate" type="application/rss+xml" title="Newsign Labs Journal" href="${SITE}/blog/feed.xml" />
    <meta property="og:type" content="${type}" />
    <meta property="og:site_name" content="Newsign Labs" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${esc(canonical)}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />${extraMeta}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <!-- display=optional: article text never reflows when the web font arrives (no layout shift) -->
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=optional" rel="stylesheet">
    <link rel="stylesheet" href="/assets/pages.css" />
    <link rel="stylesheet" href="/assets/chat-buttons.css" />
    <script type="application/ld+json">${json(jsonLd)}</script>
  </head>
  <body class="nl-journal">
    <div class="nl-page__bg" aria-hidden="true"><span class="nl-page__glow nl-page__glow--a"></span><span class="nl-page__glow nl-page__glow--b"></span></div>
    <header class="nl-page__head">
      <a class="nl-page__brand" href="/"><img src="/assets/logo.svg" alt="Newsign Labs logo" width="34" height="34" /><span>NEWSIGN LABS</span></a>
      <a class="nl-post__journal" href="/blog/">Journal</a>
    </header>
${body}
    <footer class="nl-post__foot"><span>© Newsign Labs</span><a href="/">Home</a><a href="/#services">Services</a><a href="/#work">Work</a><a href="/blog/">Journal</a><a href="/#contact">Contact</a></footer>
    <script data-load='${load}'>${loader}</script>
  </body>
</html>
`;
}

const org = { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'Newsign Labs', url: `${SITE}/`, logo: `${SITE}/assets/logo.svg` };

export function postPage(dir, post, posts, c) {
  const more = related(post, posts);
  const title = (post.seoTitle || '').trim() || `${post.title} · Newsign Labs`;
  const description = post.description || post.title;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BlogPosting', '@id': `${post.url}#post`, headline: post.title, description, url: post.url, mainEntityOfPage: post.url,
        datePublished: post.published, dateModified: post.updated, inLanguage: 'en', wordCount: wordCount(post.body),
        keywords: post.tags.join(', ') || undefined, author: post.author === 'Newsign Labs' ? { '@id': `${SITE}/#org` } : { '@type': 'Person', name: post.author },
        publisher: { '@id': `${SITE}/#org` }, isPartOf: { '@id': `${SITE}/blog/#blog` } },
      org,
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Journal', item: `${SITE}/blog/` },
        { '@type': 'ListItem', position: 3, name: post.title, item: post.url },
      ] },
    ],
  };
  const extraMeta = `\n    <meta property="article:published_time" content="${post.published}" />\n    <meta property="article:modified_time" content="${post.updated}" />`
    + post.tags.map((t) => `\n    <meta property="article:tag" content="${esc(t)}" />`).join('');
  const meta = [`<time datetime="${post.published}">${human(post.published)}</time>`, `${readingMinutes(post.body)} min read`, ...post.tags.map(esc)].join(' · ');
  const body = `    <main class="nl-post">
      <nav class="nl-post__crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/blog/">Journal</a></nav>
      <article class="nl-post__article">
        <p class="nl-page__eyebrow">${meta}</p>
        <h1 class="nl-post__title">${esc(post.title)}</h1>
        ${post.description ? `<p class="nl-post__lead">${esc(post.description)}</p>` : ''}
        <div class="nl-prose">
${renderMarkdown(post.body)}
        </div>
        ${post.updated !== post.published ? `<p class="nl-post__updated">Updated <time datetime="${post.updated}">${human(post.updated)}</time></p>` : ''}
      </article>
      ${more.length ? `<aside class="nl-post__related" aria-labelledby="related-h"><h2 id="related-h">Keep reading</h2><ul>${more.map((p) => `<li><a href="/blog/${p.slug}/">${esc(p.title)}</a>${p.description ? `<p>${esc(p.description)}</p>` : ''}</li>`).join('')}</ul></aside>` : ''}
      <section class="nl-post__cta" aria-labelledby="cta-h">
        <h2 id="cta-h">${esc(`${c['contact.h2a']} ${c['contact.h2b']}`)}</h2>
        <p>${esc(c['contact.text'])}</p>
        <a class="nl-page__btn nl-page__btn--primary" href="/#contact">${esc(c['contact.cta'] || 'Start a project')}</a>
      </section>
    </main>`;
  return page({ dir, title, description, canonical: post.url, type: 'article', extraMeta, jsonLd, body });
}

export function hubPage(dir, posts) {
  const description = 'Notes from Newsign Labs on web design, engineering, 3D, motion and launching digital products.';
  const jsonLd = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Blog', '@id': `${SITE}/blog/#blog`, name: 'Newsign Labs Journal', url: `${SITE}/blog/`, description, publisher: { '@id': `${SITE}/#org` },
      blogPost: posts.map((p) => ({ '@id': `${p.url}#post` })) },
    org,
  ] };
  const body = `    <main class="nl-post">
      <nav class="nl-post__crumbs" aria-label="Breadcrumb"><a href="/">Home</a></nav>
      <h1 class="nl-post__title">Journal</h1>
      <p class="nl-post__lead">${esc(description)}</p>
      <ul class="nl-post__list">${posts.map((p) => `
        <li><a href="/blog/${p.slug}/"><span class="nl-page__eyebrow"><time datetime="${p.published}">${human(p.published)}</time> · ${readingMinutes(p.body)} min read</span><strong>${esc(p.title)}</strong>${p.description ? `<span>${esc(p.description)}</span>` : ''}</a></li>`).join('')}
      </ul>
    </main>`;
  return page({ dir, title: 'Journal · Newsign Labs', description, canonical: `${SITE}/blog/`, jsonLd, body });
}

export function feed(posts) {
  const rfc = (d) => new Date(`${d}T09:00:00Z`).toUTCString();
  const x = (s) => esc(s);
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Newsign Labs Journal</title>
    <link>${SITE}/blog/</link>
    <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <description>Notes from Newsign Labs on web design, engineering, 3D, motion and launching digital products.</description>
    <language>en</language>${posts[0] ? `\n    <lastBuildDate>${rfc(posts[0].updated)}</lastBuildDate>` : ''}${posts.map((p) => `
    <item>
      <title>${x(p.title)}</title>
      <link>${p.url}</link>
      <guid isPermaLink="true">${p.url}</guid>
      <pubDate>${rfc(p.published)}</pubDate>
      <description>${x(p.description)}</description>${p.tags.map((t) => `\n      <category>${x(t)}</category>`).join('')}
    </item>`).join('')}
  </channel>
</rss>
`;
}

/** Writes the Journal into dir; returns the published posts (for the sitemap and llms files). */
export function build(dir, today) {
  const posts = loadPosts(dir, today);
  if (!posts.length) return posts;
  const c = loadContent(dir);
  for (const p of posts) {
    mkdirSync(join(dir, 'blog', p.slug), { recursive: true });
    writeFileSync(join(dir, 'blog', p.slug, 'index.html'), postPage(dir, p, posts, c));
  }
  writeFileSync(join(dir, 'blog', 'index.html'), hubPage(dir, posts));
  writeFileSync(join(dir, 'blog', 'feed.xml'), feed(posts));
  return posts;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = process.argv[2] || '.';
  const posts = build(dir);
  console.log(`Journal: ${posts.length} published post${posts.length === 1 ? '' : 's'} written in ${dir}/blog`);
}
