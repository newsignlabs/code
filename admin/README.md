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

## Chat buttons, maintenance mode and the 404 page

- **Chat buttons** (group *Chat buttons*): fill in the WhatsApp number (country code + number,
  digits only, e.g. `919876543210`) and the round WhatsApp button appears bottom-right on every
  page, opening `wa.me/<number>` with your opening message. Fill in the Arattai number and the
  Arattai button appears; Arattai has no public click-to-chat link, so it shows the number with
  a **Copy** button and a link to get the app. If the Arattai Business app gives you a share
  link (`https://…`), paste it in *Arattai chat link* and the button opens it directly.
- **Maintenance mode**: switch it **On** and publish; within about a minute the homepage on both
  Development and Production sends visitors to `/maintenance.html`. Switch it **Off** and publish
  to bring the site back. `/admin/` keeps working throughout. Preview the page at
  `/maintenance.html?preview=1`.
- **404 page**: `404.html`; preview it at `/404.html?preview=1`. Catalyst Slate cannot be told
  to use it, so on newsignlabs.in the Cloudflare Worker serves it for unknown addresses
  (`.github/SECURITY.md`). Both pages are `noindex`.

## Journal (unlisted blog for search and AI)

Open **Journal** at the top of the editor's sidebar. Posts are stored in `content/blog.js` and
published with their own **Publish posts** button (one commit, separate from the site copy).

**Who sees them.** A published post gets a real page at `https://www.newsignlabs.in/blog/<address>/`.
The site's menu and homepage never link to it, so ordinary visitors only find it from search
results, AI answers or a link you share. Search engines and AI tools find every post through
`/sitemap.xml`, `/llms.txt`, the RSS feed `/blog/feed.xml`, the post list at `/blog/` and the
"Keep reading" links between posts. Showing pages to crawlers but hiding them from people
(cloaking) is against Google's rules and can get the whole site dropped, so posts are always
readable by anyone who has the link. **Drafts** never leave the repository, and the
Development site has no `/blog/` at all.

**Writing posts that rank:**
- **One question per post**, and one **focus keyword** per post (the phrase people search). The
  editor warns when two posts target the same keyword; they would compete with each other.
- **800–1,500 words** that answer the question completely. Under ~600 words rarely ranks.
- Put the keyword in the **title**, the **description**, the **first paragraph** and one
  **`##` subheading**, naturally. The title is the page's only H1; sections are `##`, sub-sections `###`.
- **Link at least twice to this site**: to other posts (`/blog/other-post/`) and to sections
  (`/#services`, `/#work`, `/#contact`). Links between posts are how search engines find unlisted pages.
- **Description**: 120–160 characters, as a promise of what the reader gets. It is the snippet in
  search results and the line AI tools quote.
- Keep the **address** once a post is published; changing it breaks links (the editor warns).
- Write from real experience; specific numbers and examples beat generic advice for both Google and AI tools.

**Scheduling:** set the status to Published with a future date. The post goes live with the first
publish (of anything) on or after that date.

**One-time step: upload the updated function.** The Journal needs the latest `newsign_admin`
(new `blog` and `blog-publish` endpoints). Download
<https://github.com/newsignlabs/code/raw/main/catalyst/newsign_admin.zip>, then Catalyst console
→ NewsignLabs → **Development** → Serverless → Functions → **newsign_admin → Upload**. Its
environment variables are kept. Until then the Journal says the admin service has no Journal yet.

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

### Production (newsignlabs.in) has no admin

The admin exists **only on the Development site** (`code-qdvm-vbgdtswa.onslate.in/admin/`).

- On every push to `main` (including every publish from the admin), the GitHub Actions
  workflow `.github/workflows/production-branch.yml` rebuilds the **`production`** branch from
  `main` **without** `admin/`, `catalyst/` and `.github/`, and checks that no public file
  links to `/admin/`.
- The **Production** Slate deployment builds from `production`; the Development one from `main`.
  So copy published in the Development admin reaches newsignlabs.in automatically, but the
  admin pages and function code never do.
- The `newsign_admin` function and its variables exist **only in Development**. Delete them
  from the Production environment.

One-time setup:
1. Repository **Settings → Actions → General → Workflow permissions: Read and write** (the
   workflow pushes the `production` branch). Run it once from **Actions → Build production
   branch → Run workflow** to create the branch.
2. Catalyst console → **Production** → **Slate** → new app from GitHub `newsignlabs/code`,
   branch **`production`**, framework **Static**, root `./`, auto deploy on.
3. Map `newsignlabs.in` (and `www`) on that **Production** app, not on Development.

### Search engines and AI tools

**Development** is kept out of every index: `robots.txt` disallows all crawling and pages carry
`noindex, nofollow`.

**Production (newsignlabs.in)** is open. Its build (`.github/scripts/llms.mjs`, run by the
production workflow on every publish) adds, from the published copy:

| File | For |
|---|---|
| `/robots.txt` | allows search engines and AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended…), points to the sitemap |
| `/llms.txt` | AI assistants: the **AI & LLMs** fields in the editor, in the llmstxt.org format |
| `/llms-full.txt` | AI assistants: the whole site copy as Markdown (the placeholder testimonials are left out) |
| `/sitemap.xml` | search engines |
| `index.html` | `index, follow`, a canonical link, JSON-LD (organisation, website, FAQ) and the copy as plain HTML for crawlers that do not run JavaScript |

Edit the AI text under **AI & LLMs** in the editor; it reaches `/llms.txt` with the next publish.
`404.html` and `maintenance.html` stay `noindex`.

One-time checks outside this repository:
- **Cloudflare** → newsignlabs.in → **Security → Bots** (also **AI Crawl Control** where shown):
  make sure **Block AI bots** / AI Scrapers and Crawlers is **off** and **Manage robots.txt**
  is **off**. Cloudflare turns these on for many zones and would block the AI crawlers or
  replace this robots.txt.
- **Google Search Console** and **Bing Webmaster Tools**: add `https://www.newsignlabs.in`,
  verify it (DNS TXT record in Cloudflare) and submit `https://www.newsignlabs.in/sitemap.xml`.

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
