/* ==========================================================================
   Newsign Labs — floating chat buttons (WhatsApp, Arattai)
   Classic script for every public page. Reads content/site.js (editable at /admin):
     chat.enabled            "on" | "off"
     chat.whatsapp.number    country code + number, digits only (e.g. 919876543210)
     chat.whatsapp.message   text pre-filled in the WhatsApp chat
     chat.arattai.number     country code + number, shown to copy (Arattai has no public
                             click-to-chat link like wa.me)
     chat.arattai.link       optional: a chat/profile link from the Arattai Business app;
                             when set, the button opens it directly
   A button stays hidden until its number (or link) is filled in.
   ========================================================================== */
(function () {
  // reuse this script's ?v= stamp (production builds) for its stylesheet
  var ver = ((document.currentScript && document.currentScript.src) || '').split('?')[1];
  var c = window.__NL_CONTENT || {};
  var get = function (k, d) { var v = c[k]; return typeof v === 'string' && v.trim() ? v.trim() : d; };
  if (get('chat.enabled', 'on') !== 'on') return;

  var digits = function (s) { return String(s || '').replace(/\D/g, ''); };
  var wa = digits(get('chat.whatsapp.number', ''));
  var ar = digits(get('chat.arattai.number', ''));
  var arLink = get('chat.arattai.link', '');
  if (arLink && !/^https:\/\//i.test(arLink)) arLink = '';
  if (wa.length < 8 && ar.length < 8 && !arLink) return;

  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); };
  var pretty = function (d) { return d.length > 10 ? '+' + d.slice(0, d.length - 10) + ' ' + d.slice(-10, -5) + ' ' + d.slice(-5) : d; };

  var WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5.1 5.24-1.37A9.9 9.9 0 1 0 12.04 2Zm0 18.1c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.1.82.83-3.03-.2-.31a8.2 8.2 0 1 1 7.02 3.86Zm4.5-6.15c-.25-.12-1.46-.72-1.69-.8-.22-.09-.39-.13-.55.12-.16.25-.63.8-.78.96-.14.17-.29.19-.53.06a6.7 6.7 0 0 1-3.34-2.92c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.42-.06-.13-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.04 0 1.2.88 2.37 1 2.53.12.16 1.73 2.64 4.19 3.7 1.56.67 2.17.73 2.95.61.47-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z"/></svg>';
  var AR_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.2 3.6c-.5.4-1.3.1-1.3-.6V16A2.5 2.5 0 0 1 4 13.5v-8Z"/><path d="M9 12.5 11.2 7l2.2 5.5M9.8 10.7h2.8"/><circle cx="16" cy="8" r=".9" fill="currentColor" stroke="none"/></svg>';

  function build() {
    if (document.querySelector('.nl-chat')) return;
    // the styles load only when a button is shown, and never block the first paint
    var box = document.createElement('div');
    box.className = 'nl-chat';
    if (!document.querySelector('link[href^="/assets/chat-buttons.css"]')) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = '/assets/chat-buttons.css' + (ver ? '?' + ver : '');
      box.style.visibility = 'hidden';
      css.onload = css.onerror = function () { box.style.visibility = ''; };
      document.head.appendChild(css);
    }
    var html = '';
    if (wa.length >= 8) {
      var msg = get('chat.whatsapp.message', '');
      var href = 'https://wa.me/' + wa + (msg ? '?text=' + encodeURIComponent(msg) : '');
      var label = get('chat.whatsapp.label', 'Chat on WhatsApp');
      html += '<a class="nl-chat__btn nl-chat__btn--wa" href="' + esc(href) + '" target="_blank" rel="noopener" aria-label="' + esc(label) + '">' + WA_ICON + '<span class="nl-chat__label">' + esc(label) + '</span></a>';
    }
    if (arLink || ar.length >= 8) {
      var alabel = get('chat.arattai.label', 'Chat on Arattai');
      if (arLink) {
        html += '<a class="nl-chat__btn nl-chat__btn--ar" href="' + esc(arLink) + '" target="_blank" rel="noopener" aria-label="' + esc(alabel) + '">' + AR_ICON + '<span class="nl-chat__label">' + esc(alabel) + '</span></a>';
      } else {
        html += '<button class="nl-chat__btn nl-chat__btn--ar" type="button" aria-expanded="false" aria-controls="nl-chat-ar" aria-label="' + esc(alabel) + '">' + AR_ICON + '<span class="nl-chat__label">' + esc(alabel) + '</span></button>' +
          '<div class="nl-chat__pop" id="nl-chat-ar" role="dialog" aria-label="' + esc(alabel) + '" hidden>' +
            '<p class="nl-chat__pop-title">' + esc(alabel) + '</p>' +
            '<p class="nl-chat__pop-text">' + esc(get('chat.arattai.note', 'Search this number in Arattai to message us:')) + '</p>' +
            '<p class="nl-chat__num">' + esc(pretty(ar)) + '</p>' +
            '<div class="nl-chat__pop-actions"><button type="button" class="nl-chat__copy">' + esc(get('chat.arattai.copy', 'Copy number')) + '</button>' +
            '<a href="https://www.arattai.in/" target="_blank" rel="noopener">' + esc(get('chat.arattai.get', 'Get Arattai')) + '</a></div>' +
          '</div>';
      }
    }
    // Trusted Types: markup goes in only through DOMPurify (loaded before this file)
    box.innerHTML = window.DOMPurify.sanitize(html, { ADD_ATTR: ['target'], RETURN_TRUSTED_TYPE: true });
    document.body.appendChild(box);

    var arBtn = box.querySelector('button.nl-chat__btn--ar');
    var pop = box.querySelector('.nl-chat__pop');
    if (arBtn && pop) {
      var close = function () { pop.hidden = true; arBtn.setAttribute('aria-expanded', 'false'); };
      arBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        pop.hidden = !pop.hidden;
        arBtn.setAttribute('aria-expanded', String(!pop.hidden));
      });
      document.addEventListener('click', function (e) { if (!pop.hidden && !pop.contains(e.target)) close(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
      box.querySelector('.nl-chat__copy').addEventListener('click', function () {
        var b = this, done = function () { b.textContent = get('chat.arattai.copied', 'Copied'); };
        if (navigator.clipboard) navigator.clipboard.writeText('+' + ar).then(done, function () {});
        else done();
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
