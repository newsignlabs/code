/* ==========================================================================
   Newsign Labs — content lookup for the motion layer
   All editable copy lives in content/site.js (window.__NL_CONTENT), written
   by the /admin page. Each call passes the built-in text as the fallback, so
   the site still renders if the content file is missing or a key is blank.
   ========================================================================== */

const store = () => window.__NL_CONTENT || {};

export function t(key, fallback) {
  const v = store()[key];
  return typeof v === 'string' && v.trim() !== '' ? v : fallback;
}

// list fields are stored one item per line
export function list(key, fallback) {
  const v = store()[key];
  if (typeof v !== 'string' || v.trim() === '') return fallback;
  return v.split('\n').map((s) => s.trim()).filter(Boolean);
}
