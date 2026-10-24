/*
 * Address of the newsign_admin Catalyst function (admin/README.md).
 * The same files are served by the Development and the Production Slate deployments, so the
 * function is picked by the address the admin page is opened on:
 *   - the Development site  -> the function in Catalyst's Development environment
 *   - anything else (Production site, custom domain) -> the function in Production
 * If the console shows different function URLs, change them here (no trailing slash).
 */
(function () {
  var DEV_SITES = ['code-qdvm-vbgdtswa.onslate.in', 'localhost', '127.0.0.1'];
  var DEV_API = 'https://newsignlabs-60086752536.development.catalystserverless.in/server/newsign_admin';
  var PROD_API = 'https://newsignlabs-60086752536.catalystserverless.in/server/newsign_admin';
  window.NL_ADMIN = {
    api: DEV_SITES.indexOf(location.hostname) >= 0 ? DEV_API : PROD_API,
    environment: DEV_SITES.indexOf(location.hostname) >= 0 ? 'Development' : 'Production',
  };
})();
