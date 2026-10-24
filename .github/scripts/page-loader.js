(function () {
  // Loads this page's scripts (listed in data-load) in order. It is the only script the
  // Content-Security-Policy allows, by hash; 'strict-dynamic' then trusts what it loads.
  var me = document.currentScript, d = document;
  var build = (d.querySelector('meta[name="nl-build"]') || {}).content || '';
  // only this site's own .js files: a path from the root, never another host
  var own = function (u) {
    if (!/^\/(?!\/)[\w./-]+\.js$/.test(u)) throw new TypeError('Blocked script address: ' + u);
    // vendor libraries never change and are imported by their plain address elsewhere
    return u + (build && u.indexOf('/assets/vendor/') !== 0 ? '?v=' + build : '');
  };
  var policy = window.trustedTypes ? trustedTypes.createPolicy('nl-load', { createScriptURL: own }) : { createScriptURL: own };
  [].forEach.call(d.querySelectorAll('link[data-async-css]'), function (l) { l.media = 'all'; });
  JSON.parse(me.getAttribute('data-load')).forEach(function (item) {
    var kind = item.slice(0, 2), url = policy.createScriptURL(/^[mp]:/.test(item) ? item.slice(2) : item);
    if (kind === 'p:') {
      var l = d.createElement('link');
      l.rel = 'modulepreload';
      l.href = url;
      d.head.appendChild(l);
      return;
    }
    var s = d.createElement('script');
    if (kind === 'm:') s.type = 'module';
    s.async = false; // run in list order, like deferred scripts
    s.src = url;
    d.body.appendChild(s);
  });
})();
