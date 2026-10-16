# Content studio (`/admin`)

Edit every piece of text on the site, with SEO guidance under each field, then publish.

## How it works

- All site copy lives in `content/site.js` (`window.__NL_CONTENT`, one key per field).
  The app bundle and the motion scripts read from it and fall back to their built-in text
  if a key is missing or blank.
- `admin/schema.js` lists every field: its key, label, the HTML element it renders as
  (H1, H2, alt, meta…), the recommended length and the SEO note shown in the editor.
- **Preview** saves your draft in this browser and opens `/?preview=1`, which shows the
  draft on the real site (a yellow badge marks preview mode). Nobody else sees it.
- **Publish** makes one commit to the repository that rewrites `content/site.js` and the
  title/description/social tags in `index.html`. The host redeploys from `main` automatically.
- Unpublished edits are kept in this browser until you publish or discard them.

## One-time setup: GitHub token

1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate.
2. Repository access: **Only select repositories** → this site's repository.
3. Permissions → Repository permissions → **Contents: Read and write**. Nothing else.
4. In `/admin`, open **Publishing**, paste the token, check owner/repo/branch, **Test connection**, **Save**.

The token is kept only in your browser (for the tab session, or on the device if you tick
*Remember*) and is sent only to GitHub. Anyone with the token can change the site: revoke it
in GitHub if a device is lost. The admin page itself is public but cannot change anything
without a token; it is excluded from search engines (`noindex` and `robots.txt`).

## Adding a new editable field

1. Read it in code: `__nlc("my.key", "Default text")` in the bundle, or `t('my.key', 'Default')`
   from `assets/content.js` in the motion scripts.
2. Add the field to `admin/schema.js` (key, label, `el`, `tag`, `type`, `range`, `default`, `note`).
3. Add the key with its text to `content/site.js`.
