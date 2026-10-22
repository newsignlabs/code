'use strict';

/*
 * newsign_admin: Catalyst Advanced I/O function behind the /admin content studio.
 * Checks the admin password, then reads and commits the site copy through a GitHub App.
 * Setup: admin/README.md. Environment variables:
 *   ADMIN_PASSWORD_HASH  from /admin/?setup (or node hash-password.js)
 *   ADMIN_TOKEN_SECRET   from /admin/?setup (64 hex characters; signs sessions)
 *   GH_APP_ID, GH_INSTALLATION_ID, GH_PRIVATE_KEY   the GitHub App
 *   GITHUB_REPO (default newsignlabs/code), GITHUB_BRANCH (default main)
 *   ALLOWED_ORIGINS      site origins allowed to call this function, comma-separated
 */
const { createHandler } = require('./handler');
const { createGitHub } = require('./github');

let catalyst = null;
try {
  catalyst = require('zcatalyst-sdk-node'); // used for the shared sign-in attempt counter
} catch {
  catalyst = null;
}

const env = process.env;

const handle = createHandler({
  env,
  github: createGitHub({
    appId: env.GH_APP_ID,
    installationId: env.GH_INSTALLATION_ID,
    privateKey: env.GH_PRIVATE_KEY,
    repo: env.GITHUB_REPO || 'newsignlabs/code',
    branch: env.GITHUB_BRANCH || 'main',
    apiUrl: env.GH_API_URL || 'https://api.github.com',
    fetch: globalThis.fetch,
  }),
  services: catalyst
    ? (req) => {
        const segment = catalyst.initialize(req).cache().segment();
        return {
          cacheGet: (key) => segment.getValue(key),
          cachePut: (key, value, hours) => segment.put(key, value, hours),
        };
      }
    : null,
});

module.exports = (req, res) => {
  handle(req, res).catch((err) => {
    console.error('newsign_admin: unhandled error', err && err.message);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'internal' }));
    }
  });
};
