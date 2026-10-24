# Content studio (`/admin`)

Edit every piece of text on the site, with SEO guidance under each field, preview it on
the real site, then publish. Publishing is a normal Git commit to `main`; Catalyst Slate
redeploys the site from it (usually within a minute).

```
/admin (static page on Slate) ──password──▶ Catalyst function newsign_admin ──GitHub App──▶ newsignlabs/code (main)
                                                                                                 │
                                                                                     Slate redeploys the site
```

- **No GitHub tokens for editors.** The admin signs in with one password. The function
  holds the GitHub App's private key and uses short-lived installation tokens (renewed
  hourly); nothing GitHub-related reaches the browser.
- **The function can only write two files:** `content/site.js` (every key must be a field
  in `admin/schema.js`, text only) and the `<title>`, description, social tags and loader
  word in `index.html`. It cannot change code, styles or anything else.
- **Safe sign-in:** the password is stored only as a hash (PBKDF2 or scrypt). Sessions last
  12 hours; sign-in attempts are limited to 10 per hour per IP address.
- **No lost edits:** if the copy was changed elsewhere since you opened the editor,
  publishing stops and offers **Load latest copy**, which keeps your edits on top.

## How the content works

- All site copy lives in `content/site.js` (`window.__NL_CONTENT`, one key per field). The app
  bundle and the motion scripts read from it and fall back to their built-in text if a key is
  missing or blank.
- `admin/schema.js` lists every field: key, label, the HTML element it renders as (H1, H2,
  alt, meta…), the recommended length and the SEO note shown in the editor.
- **Preview** keeps your draft in this browser and opens `/?preview=1`, which shows it on the
  real site (a yellow badge marks preview mode). Nobody else sees it.
- Unpublished edits are kept in this browser until you publish or discard them.

---

## One-time setup (developer)

Everything below works in a browser, including on a phone. Use the **NewsignLabs** Catalyst
project, the one that hosts the Slate site.

### 1. Create the GitHub App

GitHub → the `newsignlabs` organisation (or your profile) → **Settings → Developer settings →
GitHub Apps → New GitHub App**

| Setting | Value |
|---|---|
| GitHub App name | e.g. `newsign-labs-admin` (must be unique on GitHub) |
| Homepage URL | the site URL, e.g. `https://code-qdvm-vbgdtswa.onslate.in` |
| Callback URL | leave empty |
| Expire user authorization tokens | leave as it is (ticked). It only affects user sign-in tokens, which this setup never uses |
| Request user authorization (OAuth) during installation | unticked |
| Enable Device Flow | unticked |
| Setup URL | leave empty |
| Webhook | untick **Active** (the admin only calls GitHub; it never receives events) |
| Repository permissions → **Contents** | **Read and write** |
| Repository permissions → Metadata | Read-only (always on) |
| Everything else | No access |
| Where can this GitHub App be installed? | **Only on this account** |

Then **Create GitHub App**, and on the app's page:

1. Note the **App ID**.
2. **Generate a private key**. A `.pem` file downloads; keep it safe.
3. **Install App** → **Only select repositories** → `code` → **Install**. The page you land on
   ends in `/installations/<number>`: that number is the **Installation ID**.

The function never uses user tokens or refresh tokens: it signs a short JWT with the private
key and exchanges it for an installation token that lasts one hour, renewed automatically.
Nothing expires that you have to renew; only the private key matters, and you can rotate it
on the app page at any time (generate a new key, update `GH_PRIVATE_KEY`, delete the old key).

If `main` is protected later, add the app to the branch rule's bypass list.

### 2. Choose the admin password

Open **`/admin/?setup`** on the site, type the password twice and press **Generate values**.
The page shows `ADMIN_PASSWORD_HASH` and `ADMIN_TOKEN_SECRET`. It runs only in your browser
and sends nothing. (On a computer you can instead run
`node catalyst/functions/newsign_admin/hash-password.js`.)

To change the password later, repeat this step and replace both values in step 3b.
Replacing `ADMIN_TOKEN_SECRET` also signs everyone out.

### 3. Create the Catalyst function

**a. Upload it.** Download
<https://github.com/newsignlabs/code/raw/main/catalyst/newsign_admin.zip>.
Catalyst console → **NewsignLabs** → **Serverless → Functions → Create Function** → **File upload**:

| Setting | Value |
|---|---|
| Function name | `newsign_admin` |
| Type | **Advanced I/O** |
| Stack | **Node.js 20** |
| Upload | `newsign_admin.zip` |

Authentication for the function must be **optional/public**: the admin page calls it
without a Catalyst sign-in, and the function checks its own password.

**b. Environment variables:** open **newsign_admin → Configuration → Environment variables**.
The zip pre-fills `GITHUB_REPO`, `GITHUB_BRANCH` and `ALLOWED_ORIGINS` (as AK's does), and the
code defaults to `newsignlabs/code` and `main` anyway; check they are there and add the five secrets:

| Variable | Value |
|---|---|
| `GH_APP_ID` | App ID from step 1 |
| `GH_INSTALLATION_ID` | Installation ID from step 1 |
| `GH_PRIVATE_KEY` | the whole `.pem` file, from `-----BEGIN` to `-----END … KEY-----` (line breaks turned into spaces are fine) |
| `ADMIN_PASSWORD_HASH` | from step 2 |
| `ADMIN_TOKEN_SECRET` | from step 2 |
| `GITHUB_REPO` | pre-filled: `newsignlabs/code`. **Owner/repo** together, not just `code` |
| `GITHUB_BRANCH` | pre-filled: `main` (just the branch name) |
| `ALLOWED_ORIGINS` | pre-filled: `https://code-qdvm-vbgdtswa.onslate.in`. The site's address only: `https://` + host, no `/admin`, no trailing slash. Comma-separate several (e.g. add a custom domain later) |

**c. Function access:** in the function's **Security rules**, authentication must be
**optional** (the admin page calls it without a Catalyst sign-in; the function checks its
own password). Make sure the function shows as **deployed**.

The site and the function live on different addresses, so the browser only accepts the
function's replies when they carry an `Access-Control-Allow-Origin` header for the site. The
function adds it itself for every address in `ALLOWED_ORIGINS`; nothing else needs setting up.
(Only if a gateway in front of it already adds that header, set `CORS_HEADERS` = `off`, or
browsers reject the duplicated header.)

### 4. Point the admin page at the function

`admin/config.js` holds the function URL. It is preset to this project's address:

```js
window.NL_ADMIN = { api: "https://newsignlabs-60086752536.development.catalystserverless.in/server/newsign_admin" };
```

If the function page in the console shows a different URL, edit this file on github.com
(pencil icon → paste → **Commit changes** to `main`).

Then open `/admin/`, sign in, and publish a small change to check everything works.

### Updating the function later

When the code under `catalyst/functions/newsign_admin/` changes, rebuild the zip with
`catalyst/package.sh` (runs the tests first) and upload it again in the console
(**newsign_admin → Upload**). Environment variables are kept. On a computer with the
Catalyst CLI you can instead run `catalyst deploy --only functions` from `catalyst/`.

### Troubleshooting

| Message in /admin | Cause |
|---|---|
| "Could not reach the admin service" | `ALLOWED_ORIGINS` does not list the site's address exactly (`https://` + host, no path, no trailing slash), the URL in `admin/config.js` is wrong, or the function is not deployed |
| "This site address is not allowed…" | Add the site origin to `ALLOWED_ORIGINS` (3b) |
| "The admin service is not configured yet" | One of the variables in 3b is missing; `ADMIN_TOKEN_SECRET` must be 32+ characters |
| "Publishing failed (GitHub did not accept…)" | App not installed on `code`, Contents not **Read and write**, or a wrong App ID / Installation ID / key. Check the function's logs in the console |
| "Too many attempts" | 10 wrong passwords from one address in an hour; wait an hour |

## Adding a new editable field

1. Read it in code: `__nlc("my.key", "Default text")` in the bundle, or `t('my.key', 'Default')`
   from `assets/content.js` in the motion scripts.
2. Add the field to `admin/schema.js` (key, label, `el`, `tag`, `type`, `range`, `default`, `note`).
   The function only accepts keys listed there.
3. Add the key with its text to `content/site.js`.
