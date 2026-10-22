'use strict';

const crypto = require('node:crypto');

const b64url = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');
const UA = 'newsign-labs-admin';

/**
 * Rebuilds a valid PEM from a pasted private key: the Catalyst console (especially on a
 * phone) can turn the .pem's line breaks into spaces or literal "\n".
 */
function normalizePem(raw) {
  const text = String(raw || '').replace(/\\n/g, '\n').trim();
  const m = text.match(/-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/);
  if (!m) throw new Error('GH_PRIVATE_KEY is not a PEM private key (paste the whole .pem file).');
  const body = m[2].replace(/\s+/g, '').match(/.{1,64}/g).join('\n');
  return `-----BEGIN ${m[1]}-----\n${body}\n-----END ${m[1]}-----\n`;
}

/** Short-lived JWT (RS256) that identifies the GitHub App itself. */
function appJwt(appId, privateKey, nowMs = Date.now()) {
  const now = Math.floor(nowMs / 1000);
  const unsigned = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({ iat: now - 60, exp: now + 540, iss: String(appId) })}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(normalizePem(privateKey)).toString('base64url');
  return `${unsigned}.${signature}`;
}

const hasAppConfig = (env) => Boolean(env.GH_APP_ID && env.GH_INSTALLATION_ID && env.GH_PRIVATE_KEY);

/**
 * Minimal GitHub client authenticated as the GitHub App installation. Installation
 * tokens last an hour; they are cached and renewed 5 minutes before they expire.
 */
function createGitHub({ appId, installationId, privateKey, repo, branch, fetch, apiUrl = 'https://api.github.com', now = () => Date.now() }) {
  let cached = null;

  async function token() {
    if (cached && cached.expires - now() > 5 * 60 * 1000) return cached.token;
    const res = await fetch(`${apiUrl}/app/installations/${encodeURIComponent(installationId)}/access_tokens`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${appJwt(appId, privateKey, now())}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': UA },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.token) throw Object.assign(new Error(`GitHub App token request failed (${res.status}): ${json.message || ''}`), { status: 502 });
    cached = { token: json.token, expires: Date.parse(json.expires_at) || now() + 55 * 60 * 1000 };
    return cached.token;
  }

  async function call(method, path, body) {
    const res = await fetch(`${apiUrl}/repos/${repo}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${await token()}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': UA,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(`GitHub ${method} ${path} -> ${res.status}: ${json.message || ''}`), { status: res.status });
    return json;
  }

  async function head() {
    const ref = await call('GET', `/git/ref/heads/${encodeURIComponent(branch)}`);
    const commit = await call('GET', `/git/commits/${ref.object.sha}`);
    return { commit: ref.object.sha, tree: commit.tree.sha };
  }

  /** Text of a file at a commit, with its blob sha. */
  async function readText(path, ref) {
    const f = await call('GET', `/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(ref)}`);
    return { text: Buffer.from(f.content, 'base64').toString('utf8'), sha: f.sha };
  }

  /** Commits utf-8 files on top of `tip`; status 409 if the branch moved meanwhile. */
  async function commit(files, message, tip) {
    const tree = await call('POST', '/git/trees', {
      base_tree: tip.tree,
      tree: files.map((f) => ({ path: f.path, mode: '100644', type: 'blob', content: f.content })),
    });
    const c = await call('POST', '/git/commits', { message, tree: tree.sha, parents: [tip.commit] });
    try {
      await call('PATCH', `/git/refs/heads/${encodeURIComponent(branch)}`, { sha: c.sha, force: false });
    } catch (err) {
      if (err.status === 422) err.status = 409; // not a fast-forward: someone else pushed
      throw err;
    }
    return { sha: c.sha, url: c.html_url };
  }

  return { head, readText, commit };
}

module.exports = { normalizePem, appJwt, hasAppConfig, createGitHub };
