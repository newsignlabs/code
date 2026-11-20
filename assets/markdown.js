/* ==========================================================================
   Newsign Labs — Journal Markdown, one renderer for the admin preview and the
   production build (.github/scripts/blog.mjs), so the preview is the page.
   A small, safe subset:
     ## Heading / ### Subheading     paragraphs (blank line between)
     - item / 1. item                 > quote
     **bold**  *italic*  `code`       [text](/path or https://…)
   Everything is escaped; raw HTML is shown as text. Links go only to paths on this
   site (/blog/…, /#services) or https:// addresses; anything else stays plain text.
   ========================================================================== */

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Site path or https URL, else null. */
export function safeHref(url) {
  const u = String(url).trim();
  if (/^\/(?!\/)[^\s]*$/.test(u) || /^#[\w-]+$/.test(u)) return u;
  if (/^https:\/\/[^\s/]+\.[^\s]+$/i.test(u)) return u;
  return null;
}

/** Inline marks inside one block; text is escaped before marks are applied. */
function inline(text) {
  const codes = [];
  let s = String(text).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
  const links = [];
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
    const href = safeHref(url);
    if (!href) return label;
    return `\u0001${links.push({ label, href }) - 1}\u0001`;
  });
  s = esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  s = s.replace(/\u0001(\d+)\u0001/g, (_, i) => {
    const { label, href } = links[i];
    const ext = /^https:/i.test(href);
    return `<a href="${esc(href)}"${ext ? ' rel="noopener" target="_blank"' : ''}>${inline(label)}</a>`;
  });
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[i])}</code>`);
}

/** Markdown -> HTML string (safe to insert; still goes through setHTML in the admin). */
export function renderMarkdown(md) {
  const blocks = String(md || '').replace(/\r\n?/g, '\n').split(/\n{2,}/);
  const out = [];
  for (const raw of blocks) {
    const ls = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    // headings may sit directly above other lines; each becomes its own element
    let h;
    while (ls.length && (h = /^(#{1,4})\s+(.+)$/.exec(ls[0]))) {
      const level = Math.max(2, h[1].length); // the post title is the page's only H1
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      ls.shift();
    }
    if (!ls.length) continue;
    if (ls.every((l) => /^[-*]\s+/.test(l))) {
      out.push(`<ul>${ls.map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul>`);
    } else if (ls.every((l) => /^\d+[.)]\s+/.test(l))) {
      out.push(`<ol>${ls.map((l) => `<li>${inline(l.replace(/^\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`);
    } else if (ls.every((l) => /^>\s?/.test(l))) {
      out.push(`<blockquote><p>${inline(ls.map((l) => l.replace(/^>\s?/, '')).join(' '))}</p></blockquote>`);
    } else {
      out.push(`<p>${inline(ls.join(' '))}</p>`);
    }
  }
  return out.join('\n');
}

/** Plain words, for counts and reading time. */
export function plainText(md) {
  return String(md || '').replace(/`[^`]*`/g, ' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[#>*_`-]/g, ' ').replace(/\s+/g, ' ').trim();
}
export const wordCount = (md) => (plainText(md).match(/[\p{L}\p{N}'’]+/gu) || []).length;
export const readingMinutes = (md) => Math.max(1, Math.round(wordCount(md) / 220));
