'use strict';
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');

const { hashPassword, verifyPassword, sign, verifyToken } = require('../auth');
const { normalizePem, appJwt, createGitHub } = require('../github');
const C = require('../content');
const { createHandler, route } = require('../handler');

const ROOT = path.resolve(__dirname, '../../../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const gitSha = (t) => crypto.createHash('sha1').update(`blob ${Buffer.byteLength(t)}\0`).update(t).digest('hex');

test('passwords: scrypt and browser PBKDF2 hashes verify; wrong ones do not', () => {
  const h = hashPassword('correct horse battery');
  assert.ok(verifyPassword('correct horse battery', h));
  assert.ok(!verifyPassword('wrong', h));
  const salt = crypto.randomBytes(16);
  const bits = crypto.pbkdf2Sync('pw from browser!', salt, 310000, 32, 'sha256');
  const p = `pbkdf2$310000$${salt.toString('hex')}$${bits.toString('hex')}`;
  assert.ok(verifyPassword('pw from browser!', p));
  assert.ok(!verifyPassword('pw from browser?', p));
  assert.ok(!verifyPassword('x', 'pbkdf2$1000$00$00'), 'weak iteration counts are refused');
});

test('session tokens expire and cannot be forged', () => {
  const secret = 'a'.repeat(64);
  const t = sign({ exp: 2000 }, secret);
  assert.ok(verifyToken(t, secret, 1000));
  assert.equal(verifyToken(t, secret, 3000), null);
  assert.equal(verifyToken(t, 'b'.repeat(64), 1000), null);
  assert.equal(verifyToken(t.replace(/.$/, 'x'), secret, 1000), null);
});

test('private keys pasted with spaces or \\n still sign a JWT', () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const pemText = privateKey.export({ type: 'pkcs1', format: 'pem' });
  for (const pasted of [pemText, pemText.replace(/\n/g, ' '), pemText.replace(/\n/g, '\\n')]) {
    const jwt = appJwt(123, pasted, 1_700_000_000_000);
    const [h, c, s] = jwt.split('.');
    assert.ok(crypto.createVerify('RSA-SHA256').update(`${h}.${c}`).verify(publicKey, Buffer.from(s, 'base64url')));
    assert.equal(JSON.parse(Buffer.from(c, 'base64url')).iss, '123');
  }
  assert.throws(() => normalizePem('not a key'));
});

test('content: real site.js and schema parse; validation and serialisation round-trip', () => {
  const keys = C.schemaKeys(read('admin/schema.js'));
  const content = C.parseAssigned(read('content/site.js'));
  assert.ok(keys.length > 150);
  assert.deepEqual(C.validateContent(content, keys), []);
  assert.equal(C.serializeContent(content, keys), read('content/site.js'), 'writer matches the committed file byte for byte');
  assert.match(C.validateContent({ 'evil.key': 'x' }, keys)[0], /unknown field/);
  assert.match(C.validateContent({ 'hero.lead': 5 }, keys)[0], /must be text/);
  assert.match(C.validateContent({ 'hero.lead': 'x'.repeat(5000) }, keys)[0], /longer/);
  assert.deepEqual(C.validateContent([], keys), ['content must be an object of text fields']);
});

test('index.html: only SEO tags and loader word change, values are escaped', () => {
  const html = read('index.html');
  const out = C.updateIndexHtml(html, { 'seo.title': 'A & B <x>', 'seo.description': 'say "hi"', 'seo.ogTitle': 'OG', 'loader.word': 'Hello' });
  assert.match(out, /<title>A &amp; B &lt;x&gt;<\/title>/);
  assert.match(out, /<meta name="description" content="say &quot;hi&quot;" \/>/);
  assert.match(out, /<meta property="og:title" content="OG" \/>/);
  assert.match(out, /<meta name="twitter:title" content="OG" \/>/);
  assert.match(out, /<span class="nl-loader__word">Hello<\/span>/);
  const strip = (h) => h.replace(/<title>.*<\/title>/, '').replace(/<meta (name|property)="(description|og:title|og:description|twitter:title|twitter:description)" content="[^"]*" \/>/g, '').replace(/nl-loader__word">[^<]*/, '');
  assert.equal(strip(out), strip(html));
  assert.equal(C.updateIndexHtml(html, {}), html);
});

test('route takes the last path segment', () => {
  assert.equal(route('/server/newsign_admin/login'), 'login');
  assert.equal(route('/server/newsign_admin/publish/?x=1'), 'publish');
});

/* ---------- handler, end to end against a fake GitHub ---------- */
function fakeRepo() {
  const files = { 'content/site.js': read('content/site.js'), 'admin/schema.js': read('admin/schema.js'), 'index.html': read('index.html') };
  const state = { head: 'c1', commits: [], moveHeadOnce: false };
  const github = {
    async head() { return { commit: state.head, tree: 't-' + state.head }; },
    async readText(p) { return { text: files[p], sha: gitSha(files[p]) }; },
    async commit(list, message, tip) {
      if (state.moveHeadOnce) { state.moveHeadOnce = false; throw Object.assign(new Error('moved'), { status: 409 }); }
      assert.equal(tip.commit, state.head);
      list.forEach((f) => { files[f.path] = f.content; });
      state.head = 'c' + (state.commits.length + 2);
      state.commits.push({ message, paths: list.map((f) => f.path) });
      return { sha: state.head, url: 'u' };
    },
  };
  return { files, state, github };
}
function call(handle, pathName, body, extra = {}) {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]);
  Object.assign(req, { method: 'POST', url: '/server/newsign_admin/' + pathName, headers: { 'x-forwarded-for': extra.ip || '1.2.3.4', ...(extra.headers || {}) } });
  return new Promise((resolve) => {
    const res = { headersSent: false, writeHead(s, h) { this.status = s; this.headers = h; }, end(b) { resolve({ status: this.status, headers: this.headers, json: b ? JSON.parse(b) : null }); } };
    handle(req, res);
  });
}
const ENV = {
  ADMIN_PASSWORD_HASH: hashPassword('a strong admin password'),
  ADMIN_TOKEN_SECRET: 'f'.repeat(64),
  GH_APP_ID: '1', GH_INSTALLATION_ID: '2', GH_PRIVATE_KEY: 'k',
  ALLOWED_ORIGINS: 'https://site.example',
};
const quiet = { info() {}, error() {} };

test('handler: sign in, load, publish, conflict, validation', async () => {
  const repo = fakeRepo();
  const handle = createHandler({ env: ENV, github: repo.github, services: null, log: quiet });

  assert.equal((await call(handle, 'content', {})).status, 401, 'needs a session');
  assert.equal((await call(handle, 'login', { password: 'nope' })).status, 401);
  const login = await call(handle, 'login', { password: 'a strong admin password' });
  assert.equal(login.status, 200);
  const token = login.json.token;
  assert.equal((await call(handle, 'session', { token })).json.ok, true);

  const loaded = await call(handle, 'content', { token });
  assert.equal(loaded.status, 200);
  assert.equal(loaded.json.content['hero.h1.line1'], 'Make your');

  const content = { ...loaded.json.content, 'hero.h1.line1': 'Build your', 'seo.title': 'New title | Newsign Labs' };
  const pub = await call(handle, 'publish', { token, content, sha: loaded.json.sha, note: 'Hero tweak' });
  assert.equal(pub.status, 200, JSON.stringify(pub.json));
  assert.deepEqual(pub.json.files.sort(), ['content/site.js', 'index.html']);
  assert.match(repo.files['content/site.js'], /"hero.h1.line1": "Build your"/);
  assert.match(repo.files['index.html'], /<title>New title \| Newsign Labs<\/title>/);
  assert.match(repo.state.commits[0].message, /^Hero tweak\n/);

  // the old sha is now stale -> conflict, nothing written
  const stale = await call(handle, 'publish', { token, content: { ...content, 'hero.lead': 'x' }, sha: loaded.json.sha });
  assert.equal(stale.status, 409);
  assert.equal(repo.state.commits.length, 1);

  // unknown keys are refused
  const fresh = await call(handle, 'content', { token });
  const bad = await call(handle, 'publish', { token, content: { ...fresh.json.content, 'x.y': 'z' }, sha: fresh.json.sha });
  assert.equal(bad.status, 400);
  assert.equal(bad.json.error, 'validation');

  // nothing changed -> no commit
  const same = await call(handle, 'publish', { token, content: fresh.json.content, sha: fresh.json.sha });
  assert.deepEqual(same.json, { unchanged: true });

  // branch moved during the commit -> 409
  repo.state.moveHeadOnce = true;
  const raced = await call(handle, 'publish', { token, content: { ...fresh.json.content, 'hero.lead': 'Raced' }, sha: fresh.json.sha });
  assert.equal(raced.status, 409);
});

test('handler: rate limits sign-in, checks origin, refuses when not configured', async () => {
  const repo = fakeRepo();
  const handle = createHandler({ env: ENV, github: repo.github, services: null, log: quiet });
  for (let i = 0; i < 10; i++) assert.equal((await call(handle, 'login', { password: 'bad' }, { ip: '9.9.9.9' })).status, 401);
  assert.equal((await call(handle, 'login', { password: 'a strong admin password' }, { ip: '9.9.9.9' })).status, 429);
  assert.equal((await call(handle, 'login', { password: 'a strong admin password' }, { ip: '8.8.8.8' })).status, 200);
  assert.equal((await call(handle, 'login', {}, { headers: { origin: 'https://evil.example' } })).status, 403);
  const off = createHandler({ env: { ...ENV, ADMIN_PASSWORD_HASH: '' }, github: repo.github, log: quiet });
  assert.equal((await call(off, 'login', { password: 'x' })).status, 503);
});

test('GitHub client: app token is cached, commit builds tree -> commit -> ref', async () => {
  const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const calls = [];
  const fetch = async (url, opts) => {
    calls.push(`${opts.method || 'GET'} ${url.replace('https://api.github.com', '')}`);
    const J = (o, s = 200) => ({ ok: s < 300, status: s, json: async () => o });
    if (url.endsWith('/access_tokens')) return J({ token: 'inst', expires_at: new Date(Date.now() + 3600e3).toISOString() });
    if (url.includes('/git/ref/heads/main')) return J({ object: { sha: 'H' } });
    if (url.endsWith('/git/commits/H')) return J({ tree: { sha: 'T' } });
    if (url.endsWith('/git/trees')) { assert.equal(JSON.parse(opts.body).base_tree, 'T'); return J({ sha: 'T2' }); }
    if (url.endsWith('/git/commits')) return J({ sha: 'C2', html_url: 'x' });
    if (url.includes('/git/refs/heads/main')) return J({});
    return J({ message: 'nope' }, 404);
  };
  const gh = createGitHub({ appId: 1, installationId: 2, privateKey: privateKey.export({ type: 'pkcs1', format: 'pem' }), repo: 'o/r', branch: 'main', fetch });
  const tip = await gh.head();
  const out = await gh.commit([{ path: 'content/site.js', content: 'x' }], 'm', tip);
  assert.equal(out.sha, 'C2');
  assert.equal(calls.filter((c) => c.endsWith('/access_tokens')).length, 1, 'token fetched once and reused');
  assert.deepEqual(calls.slice(-3), ['POST /repos/o/r/git/trees', 'POST /repos/o/r/git/commits', 'PATCH /repos/o/r/git/refs/heads/main']);
});

test('handler: CORS headers are in the response headers for allowed origins', async () => {
  const repo = fakeRepo();
  const handle = createHandler({ env: ENV, github: repo.github, log: quiet });
  const site = { headers: { origin: 'https://site.example' } };
  const login = await call(handle, 'login', { password: 'a strong admin password' }, site);
  assert.equal(login.status, 200);
  assert.equal(login.headers['Access-Control-Allow-Origin'], 'https://site.example');
  const bad = await call(handle, 'login', { password: 'nope' }, site);
  assert.equal(bad.headers['Access-Control-Allow-Origin'], 'https://site.example', 'errors are readable by the page too');
  const req = Readable.from([]);
  Object.assign(req, { method: 'OPTIONS', url: '/server/newsign_admin/login', headers: { origin: 'https://site.example' } });
  const pre = await new Promise((resolve) => handle(req, { writeHead(st, h) { this.s = st; this.h = h; }, end() { resolve({ status: this.s, headers: this.h }); } }));
  assert.equal(pre.status, 204);
  assert.equal(pre.headers['Access-Control-Allow-Origin'], 'https://site.example');
  assert.match(pre.headers['Access-Control-Allow-Methods'], /POST/);
  const evil = await call(handle, 'login', {}, { headers: { origin: 'https://evil.example' } });
  assert.equal(evil.status, 403);
  assert.equal(evil.headers['Access-Control-Allow-Origin'], undefined);
  const off = createHandler({ env: { ...ENV, CORS_HEADERS: 'off' }, github: repo.github, log: quiet });
  assert.equal((await call(off, 'login', { password: 'x' }, site)).headers['Access-Control-Allow-Origin'], undefined);
});
