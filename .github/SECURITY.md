# Security model

The site is static, but it runs a fair amount of JavaScript (React app, 3D scenes, the admin), so it
is locked down in the page itself and with response headers.

## 1. Content-Security-Policy (XSS)

Every page carries this policy in a `<meta http-equiv="Content-Security-Policy">` tag
(the admin adds its function to `connect-src`):

```
default-src 'self'; script-src 'sha256-gR8GGMcb/fy7lpXKMFEZdn8OIVbyPI/3rcATZXhMJX4=' 'strict-dynamic' 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-src 'none'; worker-src 'none'; manifest-src 'self'; require-trusted-types-for 'script'; trusted-types nl-load dompurify; upgrade-insecure-requests
```

- **Scripts:** exactly one inline script per page, the page loader
  (`<script data-load='[...]'>`, source in `.github/scripts/page-loader.js`), is allowed by its
  SHA-256 hash. It loads the files listed in `data-load`, only same-site paths ending in `.js`,
  and `'strict-dynamic'` extends trust to them and to the modules they import. Injected
  `<script>` tags, inline event handlers (`onerror=`…), `javascript:` URLs, `eval` and
  `new Function` are all refused. (`'self'` only matters to old browsers without
  `'strict-dynamic'`.)
- **Styles:** files from this site and Google Fonts only. Inline `style="…"` attributes are
  refused, so code sets styles through `el.style` instead.
- `object-src 'none'`, `base-uri 'none'`, `form-action 'self'`, `frame-src 'none'`.

**Adding a script to a page:** add its path to that page's `data-load` list (`m:` = ES module,
`p:` = modulepreload). Do not add `<script>` tags. **Changing the loader:** run
`node .github/scripts/csp.mjs`, which rewrites the hash in every page; the production build
runs it with `--check` and stops if a hash is stale.

## 2. Trusted Types (DOM XSS)

The policy enforces `require-trusted-types-for 'script'`: `innerHTML`, `script.src`, string
`setTimeout` and the other DOM sinks refuse plain strings. Only two policies may exist
(`trusted-types nl-load dompurify`):

- `nl-load` (the page loader) turns a same-site `.js` path into a script URL;
- `dompurify` (DOMPurify 3.2.6, `assets/vendor/purify.min.js`) sanitises HTML.

Site code writes HTML only through `setHTML(el, html)` from `assets/safe-html.js`, which runs
DOMPurify and returns TrustedHTML. Admin-editable copy is escaped as well, so markup typed in the
admin shows as text.

## 3. Response headers (COOP, clickjacking, HSTS)

These cannot be set from a `<meta>` tag. What the hosts send today (run **Actions → Site check**
to see the live headers):

| Header | Development (onslate.in) | Production (newsignlabs.in, via Cloudflare) |
|---|---|---|
| Strict-Transport-Security | sent by Slate (`max-age=64072000; includeSubDomains; preload`) | same |
| X-Frame-Options: DENY | sent by Slate | same |
| X-Content-Type-Options: nosniff | sent by Slate | same |
| Cross-Origin-Opener-Policy | only if Slate reads `_headers` | add in Cloudflare (below) |
| Content-Security-Policy header | meta tag only | add in Cloudflare (below) |

### Cloudflare (production) — one-time

Cloudflare dashboard → **newsignlabs.in** → **Rules → Transform Rules → Modify Response Header →
Create rule**. Name it *Security headers*; *If incoming requests match*: **All incoming requests**;
then **Set static** for each:

| Header name | Value |
|---|---|
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` |
| `Content-Security-Policy` | the policy above, with `; frame-ancestors 'none'` added at the end |

The CSP header must change whenever the loader hash changes (only when
`.github/scripts/page-loader.js` is edited); a stale header would block the site.
