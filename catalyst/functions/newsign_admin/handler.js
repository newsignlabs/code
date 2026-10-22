'use strict';

const crypto = require('node:crypto');
const { verifyPassword, sign, verifyToken } = require('./auth');
const { hasAppConfig } = require('./github');
const C = require('./content');

const MAX_BODY = 1024 * 1024;
const SESSION_MS = 12 * 60 * 60 * 1000;
const LOGIN_ATTEMPTS_PER_HOUR = 10;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('too large'), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const clientIp = (req) =>
  String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'unknown';

/** The endpoint is the last path segment: /server/newsign_admin/login -> "login". */
const route = (url) => String(url || '').split('?')[0].replace(/\/+$/, '').split('/').pop();

/**
 * Routes (POST, JSON body; the session token travels in the body because Catalyst
 * treats an Authorization header as a Catalyst sign-in):
 *   login    {password}                       -> {token, expires}
 *   session  {token}                          -> {ok, expires}
 *   content  {token}                          -> {content, sha, commit}
 *   publish  {token, content, sha, note}      -> {commit, url} | 409 conflict | 400 validation
 */
function createHandler({ env, github, services, now = () => Date.now(), log = console }) {
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const secret = env.ADMIN_TOKEN_SECRET || '';
  const memoryAttempts = new Map(); // fallback when Catalyst Cache is unavailable

  return async function handle(req, res) {
    const origin = req.headers.origin;
    const headers = { 'Content-Type': 'application/json', Vary: 'Origin', 'Cache-Control': 'no-store' };
    // On Catalyst the gateway adds CORS headers for Authorized Domains; adding them here too
    // duplicates Access-Control-Allow-Origin and browsers reject the reply. CORS_HEADERS=on
    // is for running the function somewhere without gateway CORS (e.g. local tests).
    if (env.CORS_HEADERS === 'on' && origin && allowed.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type';
    }
    const send = (status, body) => {
      res.writeHead(status, headers);
      res.end(body === undefined ? '' : JSON.stringify(body));
    };

    if (req.method === 'OPTIONS') return send(204);
    if (origin && allowed.length && !allowed.includes(origin)) return send(403, { error: 'origin_not_allowed' });
    if (secret.length < 32 || !env.ADMIN_PASSWORD_HASH || !hasAppConfig(env)) {
      log.error('newsign_admin: missing configuration (ADMIN_TOKEN_SECRET, ADMIN_PASSWORD_HASH, GH_APP_ID, GH_INSTALLATION_ID, GH_PRIVATE_KEY)');
      return send(503, { error: 'not_configured' });
    }
    if (req.method !== 'POST') return send(405, { error: 'use_post' });

    let body;
    try {
      body = JSON.parse((await readBody(req)) || '{}');
    } catch (err) {
      return send(err.status || 400, { error: err.status ? 'too_large' : 'invalid_json' });
    }
    const name = route(req.url);

    // ---- sign in (no session yet) ----
    if (name === 'login') {
      const key = 'nla_' + crypto.createHash('sha256').update(clientIp(req)).digest('hex').slice(0, 24);
      let svc = null;
      try {
        svc = services ? services(req) : null;
      } catch { /* Catalyst Cache unavailable: count attempts in memory */ }
      let attempts = 0;
      try {
        attempts = Number((svc ? await svc.cacheGet(key) : memoryAttempts.get(key)) || 0);
      } catch { /* cache unavailable: allow */ }
      if (attempts >= LOGIN_ATTEMPTS_PER_HOUR) return send(429, { error: 'too_many_attempts' });
      if (typeof body.password !== 'string' || !verifyPassword(body.password, env.ADMIN_PASSWORD_HASH)) {
        try {
          if (svc) await svc.cachePut(key, String(attempts + 1), 1);
          else memoryAttempts.set(key, attempts + 1);
        } catch { /* non-fatal */ }
        await new Promise((r) => setTimeout(r, 400)); // slow down guessing
        log.info('newsign_admin: failed sign-in');
        return send(401, { error: 'invalid_password' });
      }
      const exp = now() + SESSION_MS;
      return send(200, { token: sign({ exp }, secret), expires: exp });
    }

    // ---- everything else needs a session ----
    const session = verifyToken(typeof body.token === 'string' ? body.token : '', secret, now());
    if (!session) return send(401, { error: 'unauthorized' });

    try {
      if (name === 'session') return send(200, { ok: true, expires: session.exp });

      if (name === 'content') {
        const tip = await github.head();
        const file = await github.readText(C.CONTENT_PATH, tip.commit);
        return send(200, { content: C.parseAssigned(file.text), sha: file.sha, commit: tip.commit });
      }

      if (name === 'publish') {
        const { content, sha } = body;
        if (typeof sha !== 'string') return send(400, { error: 'invalid_request' });
        const tip = await github.head();
        const [current, schema, index] = await Promise.all([
          github.readText(C.CONTENT_PATH, tip.commit),
          github.readText(C.SCHEMA_PATH, tip.commit),
          github.readText(C.INDEX_PATH, tip.commit),
        ]);
        const keys = C.schemaKeys(schema.text);
        const issues = C.validateContent(content, keys);
        if (issues.length) return send(400, { error: 'validation', issues });
        if (current.sha !== sha) return send(409, { error: 'conflict' });

        const files = [];
        const siteJs = C.serializeContent(content, keys);
        if (siteJs !== current.text) files.push({ path: C.CONTENT_PATH, content: siteJs });
        const html = C.updateIndexHtml(index.text, content);
        if (html !== index.text) files.push({ path: C.INDEX_PATH, content: html });
        if (!files.length) return send(200, { unchanged: true });

        const note = String(body.note || '').replace(/\s+/g, ' ').trim().slice(0, 120) || 'Update site copy';
        const result = await github.commit(files, `${note}\n\nPublished from the Newsign Labs content studio (/admin).`, tip);
        log.info('newsign_admin: published', result.sha);
        return send(200, { commit: result.sha, url: result.url, files: files.map((f) => f.path) });
      }

      return send(404, { error: 'not_found' });
    } catch (err) {
      log.error('newsign_admin: error', name, err && err.message);
      if (err && err.status === 409) return send(409, { error: 'conflict' });
      return send(502, { error: 'github' });
    }
  };
}

module.exports = { createHandler, route };
