/* ==========================================================================
   Newsign Labs — content boot (classic script, runs before the app)
   1. Preview mode: /?preview=1 swaps in the unpublished draft saved by /admin
      in this browser, and shows a small badge.
   2. Applies the SEO fields (title, description, social tags) and the loader
      name, so a preview shows them too. Published values are also written
      straight into index.html by the admin, for crawlers.
   ========================================================================== */
(function () {
  var preview = false;
  try {
    if (/[?&]preview=1\b/.test(location.search)) {
      var draft = localStorage.getItem('nl-content-draft');
      if (draft) {
        window.__NL_CONTENT = Object.assign({}, window.__NL_CONTENT || {}, JSON.parse(draft));
        preview = true;
      }
    }
  } catch (e) { /* storage blocked or bad JSON: show the published copy */ }

  var c = window.__NL_CONTENT || {};
  var get = function (k) { return typeof c[k] === 'string' && c[k].trim() ? c[k] : null; };
  var meta = function (attr, name, value) {
    if (!value) return;
    var el = document.querySelector('meta[' + attr + '="' + name + '"]');
    if (el) el.setAttribute('content', value);
  };

  if (get('seo.title')) document.title = get('seo.title');
  meta('name', 'description', get('seo.description'));
  meta('property', 'og:title', get('seo.ogTitle'));
  meta('property', 'og:description', get('seo.ogDescription'));
  meta('name', 'twitter:title', get('seo.ogTitle'));
  meta('name', 'twitter:description', get('seo.ogDescription'));

  document.addEventListener('DOMContentLoaded', function () {
    var word = document.querySelector('.nl-loader__word');
    if (word && get('loader.word')) word.textContent = get('loader.word');
    if (!preview) return;
    var b = document.createElement('a');
    b.href = location.pathname;
    b.textContent = 'Preview: unpublished changes · exit';
    b.setAttribute('style', 'position:fixed;left:16px;bottom:16px;z-index:300;padding:10px 14px;border-radius:999px;' +
      'background:#ffe878;color:#100d15;font:600 11px/1 system-ui,sans-serif;letter-spacing:.04em;text-decoration:none;' +
      'box-shadow:0 10px 30px #0008');
    document.body.appendChild(b);
  });
})();
