// node --test .github/scripts/blog.test.mjs  (run by the production build before publishing)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { renderMarkdown } from '../../assets/markdown.js';
import { build } from './blog.mjs';
import { loadPosts, buildSitemap, buildLlmsTxt, loadContent } from './llms.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('Markdown: raw HTML is shown as text, unsafe links are dropped', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[a](javascript:alert(1)) [b](//evil.example) [c](data:text/html,x) [ok](/blog/x/) [out](https://example.org)');
  assert.ok(!/<script|<img|href="javascript|href="\/\/|href="data/i.test(html));
  assert.match(html, /<a href="\/blog\/x\/">ok<\/a>/);
  assert.match(html, /<a href="https:\/\/example\.org" rel="noopener" target="_blank">out<\/a>/);
  assert.match(renderMarkdown('# Title'), /^<h2>/, 'the post title is the only H1');
});

function site(posts) {
  const dir = mkdtempSync(join(tmpdir(), 'journal-'));
  for (const f of ['404.html', 'content', 'admin/schema.js']) cpSync(join(root, f), join(dir, f), { recursive: true });
  writeFileSync(join(dir, 'content/blog.js'), `window.__NL_BLOG = ${JSON.stringify(posts)};\n`);
  return dir;
}
const post = (slug, extra = {}) => ({ slug, status: 'published', title: `Title ${slug}`, description: `About ${slug}`, published: '2026-11-10', tags: 'web', body: '## Part\n\nText', ...extra });

test('only published, due posts are built; pages carry SEO tags and a valid CSP hash', () => {
  const dir = site([post('one'), post('two', { published: '2026-11-12' }), post('draft', { status: 'draft' }), post('later', { published: '2099-01-01' })]);
  const posts = build(dir, '2026-11-20');
  assert.deepEqual(posts.map((p) => p.slug), ['two', 'one']);
  assert.ok(!existsSync(join(dir, 'blog/draft')) && !existsSync(join(dir, 'blog/later')));
  const html = readFileSync(join(dir, 'blog/one/index.html'), 'utf8');
  assert.equal(html.match(/<h1[\s>]/g).length, 1);
  assert.ok(html.includes('<link rel="canonical" href="https://www.newsignlabs.in/blog/one/" />'));
  assert.ok(html.includes('content="index, follow'));
  assert.ok(html.includes('href="/blog/two/"'), 'related posts link to each other');
  const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1]);
  assert.equal(ld['@graph'][0]['@type'], 'BlogPosting');
  const loader = /<script data-load='[^']*'>([\s\S]*?)<\/script>/.exec(html)[1];
  assert.ok(html.includes(`'sha256-${createHash('sha256').update(loader).digest('base64')}'`), 'CSP allows the page loader');
  assert.match(readFileSync(join(dir, 'blog/feed.xml'), 'utf8'), /<link>https:\/\/www\.newsignlabs\.in\/blog\/two\/<\/link>/);
  assert.match(readFileSync(join(dir, 'blog/index.html'), 'utf8'), /href="\/blog\/one\/"/);
});

test('sitemap and llms.txt list published posts only', () => {
  const dir = site([post('one'), post('draft', { status: 'draft' })]);
  const posts = loadPosts(dir, '2026-11-20');
  const map = buildSitemap('2026-11-20', posts);
  assert.ok(map.includes('/blog/one/') && map.includes('/blog/</loc>') && !map.includes('draft'));
  const llms = buildLlmsTxt(loadContent(dir), posts);
  assert.match(llms, /## Articles\n\n- \[Title one\]\(https:\/\/www\.newsignlabs\.in\/blog\/one\/\): About one/);
});

test('no posts: no /blog, sitemap is the homepage only', () => {
  const dir = site([]);
  assert.deepEqual(build(dir, '2026-11-20'), []);
  assert.ok(!existsSync(join(dir, 'blog')));
  assert.ok(!buildSitemap('2026-11-20', []).includes('/blog/'));
});
