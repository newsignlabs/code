/* ==========================================================================
   Newsign Labs — content boot (classic script, runs before the app)
   1. Preview mode: /?preview=1 swaps in the unpublished draft saved by /admin
      in this browser, and shows a small badge.
   2. Applies the SEO fields (title, description, social tags) and the loader
      name, so a preview shows them too. Published values are also written
      straight into index.html by the admin, for crawlers.
   3. Maintenance mode (site.maintenance = "on"): the homepage hands over to
      /maintenance.html, and that page returns home once it is switched off.
      Preview skips the hand-over.
   4. Unknown paths and unknown subdomains show the 404 page (see below).
   5. Standalone pages (<html data-page="notfound|maintenance">) take their
      tab title and every [data-k] text from their own keys instead.
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

  var page = document.documentElement.getAttribute('data-page');
  var maintenance = get('site.maintenance') === 'on';
  var go = function (to) {
    document.documentElement.style.visibility = 'hidden';
    location.replace(to);
  };
  // Unknown addresses show the 404 page. A host that answers every path with index.html
  // (single-page-app fallback) lands here; so does any subdomain of newsignlabs.in other
  // than www, once DNS sends it to this site. The address bar keeps what was typed.
  var host = location.hostname.toLowerCase();
  var badHost = /(^|\.)newsignlabs\.in$/.test(host) && host !== 'newsignlabs.in' && host !== 'www.newsignlabs.in';
  var badPath = !page && !/^\/(index\.html)?$/.test(location.pathname);
  if (page !== 'notfound' && (badHost || badPath)) {
    try { sessionStorage.setItem('nl-404-from', location.href); } catch (e) { /* the 404 then shows its own address */ }
    return go('/404.html');
  }
  // the app's router only knows "/": show /index.html as the homepage at "/"
  if (!page && location.pathname === '/index.html') history.replaceState(null, '', '/' + location.search + location.hash);
  if (page === 'notfound') {
    try {
      var from = sessionStorage.getItem('nl-404-from');
      sessionStorage.removeItem('nl-404-from');
      if (from && from.indexOf(location.origin + '/') === 0) history.replaceState(null, '', from);
    } catch (e) { /* keep /404.html in the address bar */ }
  }

  if (!preview && !/[?&]preview=1\b/.test(location.search)) {
    if (maintenance && !page) return go('/maintenance.html');
    if (!maintenance && page === 'maintenance') return go('/');
  }

  if (page) {
    if (get(page + '.pageTitle')) document.title = get(page + '.pageTitle');
    document.addEventListener('DOMContentLoaded', function () {
      [].forEach.call(document.querySelectorAll('[data-k]'), function (el) {
        var k = el.getAttribute('data-k');
        if (typeof c[k] !== 'string') return;
        // a blank optional line (data-optional) hides its element; others keep the built-in text
        if (!c[k].trim()) { if (el.hasAttribute('data-optional')) el.hidden = true; return; }
        el.textContent = c[k];
      });
      if (preview) badge();
    });
    return;
  }

  if (get('seo.title')) document.title = get('seo.title');
  meta('name', 'description', get('seo.description'));
  meta('property', 'og:title', get('seo.ogTitle'));
  meta('property', 'og:description', get('seo.ogDescription'));
  meta('name', 'twitter:title', get('seo.ogTitle'));
  meta('name', 'twitter:description', get('seo.ogDescription'));

  document.addEventListener('DOMContentLoaded', function () {
    var word = document.querySelector('.nl-loader__word');
    if (word && get('loader.word')) word.textContent = get('loader.word');
    if (preview) badge();
  });

  function badge() {
    var b = document.createElement('a');
    b.href = location.pathname;
    b.textContent = 'Preview: unpublished changes · exit';
    b.setAttribute('style', 'position:fixed;left:16px;bottom:16px;z-index:300;padding:10px 14px;border-radius:999px;' +
      'background:#ffe878;color:#100d15;font:600 11px/1 system-ui,sans-serif;letter-spacing:.04em;text-decoration:none;' +
      'box-shadow:0 10px 30px #0008');
    document.body.appendChild(b);
  }
})();
