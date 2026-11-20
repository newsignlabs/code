// node --test .github/scripts/llms.test.mjs  (run by the production build before publishing)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent, buildLlmsTxt, buildLlmsFull, buildJsonLd, openIndexHtml, ROBOTS } from './llms.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const c = loadContent(root);

test('llms.txt follows llmstxt.org: H1, summary blockquote, link sections', () => {
  const t = buildLlmsTxt(c);
  assert.match(t, /^# Newsign Labs\n\n> \S/);
  assert.match(t, /\n## Pages\n\n- \[Full site copy\]\(https:\/\/www\.newsignlabs\.in\/llms-full\.txt\)/);
  assert.ok(!/undefined|null/.test(t));
});

test('llms-full.txt has every service and FAQ, and leaves out the placeholder testimonials', () => {
  const t = buildLlmsFull(c);
  for (let i = 0; c[`faq.${i}.q`]; i++) assert.ok(t.includes(c[`faq.${i}.q`]));
  for (let i = 0; c[`services.${i}.title`]; i++) assert.ok(t.includes(c[`services.${i}.title`]));
  assert.ok(!t.includes(c['receipts.quotes.0.quote']));
  assert.ok(!/undefined/.test(t));
});

test('JSON-LD is valid JSON and cannot close its <script> block', () => {
  const evil = { ...c, 'faq.0.a': '</script><script>alert(1)</script>' };
  const json = buildJsonLd(evil);
  assert.ok(!json.includes('</script'));
  assert.equal(JSON.parse(json)['@graph'][2].mainEntity[0].acceptedAnswer.text, evil['faq.0.a']);
});

test('index.html is opened: indexable, canonical, one H1, copy escaped', () => {
  const html = openIndexHtml(readFileSync(join(root, 'index.html'), 'utf8'), { ...c, 'hero.lead': '<img src=x onerror=alert(1)>' });
  assert.ok(html.includes('content="index, follow'));
  assert.ok(html.includes('<link rel="canonical" href="https://www.newsignlabs.in/" />'));
  assert.equal(html.match(/<h1[\s>]/g).length, 1);
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;') && !html.includes('<img src=x'));
});

test('Production robots.txt allows search and AI crawlers; Development robots.txt still blocks all', () => {
  assert.match(ROBOTS, /User-agent: \*\nAllow: \//);
  for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'OAI-SearchBot', 'Google-Extended']) assert.ok(ROBOTS.includes(`User-agent: ${bot}`));
  assert.match(readFileSync(join(root, 'robots.txt'), 'utf8'), /User-agent: \*\nDisallow: \/\s*$/);
});
