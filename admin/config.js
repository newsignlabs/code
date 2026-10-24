/*
 * Address of the newsign_admin Catalyst function (admin/README.md).
 * The admin exists only on the Development site: the Production site (newsignlabs.in) is
 * built from the `production` branch, which has no admin/ folder (.github/workflows/production-branch.yml).
 * If the console shows a different function URL, change it here (no trailing slash).
 */
window.NL_ADMIN = {
  api: 'https://newsignlabs-60086752536.development.catalystserverless.in/server/newsign_admin',
  environment: 'Development',
};
