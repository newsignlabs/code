/* ==========================================================================
   Newsign Labs — the one way site code writes HTML into the page.
   The Content-Security-Policy enforces Trusted Types: innerHTML only accepts
   TrustedHTML, never a plain string. setHTML() runs the markup through
   DOMPurify (assets/vendor/purify.min.js, loaded before every module), which
   strips scripts, event handlers and javascript: links and returns TrustedHTML.
   ========================================================================== */
const CONFIG = { ADD_ATTR: ['target'], RETURN_TRUSTED_TYPE: true };

export function setHTML(el, html) {
  el.innerHTML = window.DOMPurify.sanitize(html, CONFIG);
}
