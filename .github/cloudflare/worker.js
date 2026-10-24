/* ==========================================================================
   Newsign Labs — Cloudflare Worker for newsignlabs.in (Production)
   Catalyst Slate serves the static site but lets a static app set neither
   response headers nor its 404 page (checked: it ignores _headers, _redirects
   and slate-config.toml). Cloudflare already sits in front of the domain, so
   this Worker does it on the way out:
   - unknown addresses get the site's own /404.html, with a real 404 status;
   - security headers: COOP, CORP, Referrer-Policy, Permissions-Policy, and the
     page's Content-Security-Policy as a header too (copied from its <meta> tag,
     so the script hash can never go stale) plus frame-ancestors 'none';
   - caching: Slate sends "max-age=1 year" for everything, so browsers would keep
     old pages. Pages and unversioned files are revalidated on each visit
     (a quick 304 when unchanged); ?v=<commit> files and vendor libraries keep
     the long cache.
   Setup: .github/SECURITY.md → "Cloudflare Worker".
   ========================================================================== */

const SECURITY_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'X-Content-Type-Options': 'nosniff',
};
const CSP_META = /<meta http-equiv="Content-Security-Policy" content="([^"]*)"/;

export default {
  async fetch(request) {
    try {
      return await handle(request);
    } catch {
      return fetch(request); // never take the site down: fall back to Slate as it is
    }
  },
};

async function handle(request) {
    const url = new URL(request.url);
    let res = await fetch(request);

    // Slate's own 404 page -> the site's 404 page, still a 404
    if (res.status === 404 && (request.method === 'GET' || request.method === 'HEAD')) {
      const page = await fetch(new URL('/404.html', url), { headers: { Accept: 'text/html' } });
      if (page.ok) res = new Response(page.body, { status: 404, statusText: 'Not Found', headers: page.headers });
    }

    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
    headers.delete('Set-Cookie'); // the static site needs none of the host's cookies

    const versioned = url.searchParams.has('v') || url.pathname.startsWith('/assets/vendor/');
    if (!versioned) headers.set('Cache-Control', 'no-cache');

    if ((headers.get('Content-Type') || '').includes('text/html')) {
      const html = await res.text();
      const csp = CSP_META.exec(html);
      if (csp) headers.set('Content-Security-Policy', `${csp[1].replace(/&#39;|&apos;/g, "'")}; frame-ancestors 'none'`);
      return new Response(request.method === 'HEAD' ? null : html, { status: res.status, statusText: res.statusText, headers });
    }
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
