#!/usr/bin/env node
// Keeps every page's Content-Security-Policy in step with its inline page loader.
//
// Each page has one inline script, <script data-load='[...]'>, whose text is
// .github/scripts/page-loader.js. The CSP <meta> allows exactly that script by its SHA-256
// hash; 'strict-dynamic' then trusts the files it loads. After editing the loader run
//   node .github/scripts/csp.mjs           (rewrites the pages)
// The production build runs it with --check and stops if a hash does not match.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PAGES = ['index.html', '404.html', 'maintenance.html', 'admin/index.html'];
const check = process.argv.includes('--check');
const loader = readFileSync(join(root, '.github/scripts/page-loader.js'), 'utf8').trim();
const SCRIPT = /(<script data-load='[^']*'>)([\s\S]*?)(<\/script>)/;
const HASH = /'sha256-[A-Za-z0-9+/=]*'/;

let failed = false;
for (const page of PAGES) {
  const file = join(root, page);
  let html;
  try { html = readFileSync(file, 'utf8'); } catch { continue; } // admin/ is absent on the production branch
  const m = SCRIPT.exec(html);
  const csp = /<meta http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(html);
  if (!m || !csp || !HASH.test(csp[1])) { console.error(`${page}: missing page loader or CSP meta`); failed = true; continue; }
  const want = `'sha256-${createHash('sha256').update(loader).digest('base64')}'`;
  const inPage = `'sha256-${createHash('sha256').update(m[2]).digest('base64')}'`;
  if (check) {
    if (m[2] !== loader || !csp[1].includes(inPage)) { console.error(`${page}: loader or CSP hash out of date (run node .github/scripts/csp.mjs)`); failed = true; }
    else console.log(`${page}: ok ${want}`);
    continue;
  }
  const out = html
    .replace(SCRIPT, (_, a, _b, c) => a + loader + c)
    .replace(csp[0], csp[0].replace(HASH, want));
  writeFileSync(file, out);
  console.log(`${page}: ${want}`);
}
process.exit(failed ? 1 : 0);
