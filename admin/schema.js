/* Newsign Labs content schema: every editable field, the HTML element it renders as,
   its recommended length and the SEO note shown under it in /admin. Add a field here
   (and read its key in the site code) to make new copy editable. */
window.NL_SCHEMA = [
 {
  "id": "seo",
  "title": "SEO & sharing",
  "intro": "How the site appears in search results, browser tabs and shared links. These are written into index.html on publish, so crawlers see them without running JavaScript.",
  "fields": [
   {
    "key": "seo.focusKeyword",
    "label": "Focus keyword",
    "el": "admin",
    "tag": "admin only",
    "default": "web design and engineering studio",
    "note": "Not shown on the site. Used by the SEO checks on this page: the admin checks the title, description, H1 and first paragraph for this phrase.",
    "type": "text"
   },
   {
    "key": "seo.title",
    "label": "Page title",
    "el": "title",
    "tag": "<title>",
    "default": "Newsign Labs · Web design & engineering studio",
    "note": "Shown as the blue clickable headline in Google results and as the browser-tab name. Aim for 50–60 characters: Google cuts titles at roughly 600px (~60 characters). Lead with the main keyword and end with the brand name.",
    "range": [
     30,
     60
    ],
    "type": "text"
   },
   {
    "key": "seo.description",
    "label": "Meta description",
    "el": "metadesc",
    "tag": "meta description",
    "default": "Newsign Labs is an independent web development and design studio building fast, expressive websites, 3D and motion experiences, brand systems and digital products.",
    "note": "The snippet Google usually shows under the title. 120–160 characters. Summarise what you offer, use the focus keyword once, and end with a reason to click. It is not a ranking factor, but a good one raises click-through.",
    "range": [
     120,
     160
    ],
    "type": "textarea"
   },
   {
    "key": "seo.ogTitle",
    "label": "Social share title",
    "el": "ogtitle",
    "tag": "og:title",
    "default": "Newsign Labs",
    "note": "Headline used when the page is shared on LinkedIn, WhatsApp, X or Slack. Keep it under 60 characters; it can be punchier than the search title.",
    "range": [
     20,
     60
    ],
    "type": "text"
   },
   {
    "key": "seo.ogDescription",
    "label": "Social share description",
    "el": "ogdesc",
    "tag": "og:description",
    "default": "Newsign Labs is an independent web development and design studio building fast, expressive websites, 3D and motion experiences, brand systems and digital products.",
    "note": "Text under the shared-link headline. Social cards cut this around 100–110 characters on mobile, so put the hook first.",
    "range": [
     60,
     110
    ],
    "type": "textarea"
   },
   {
    "key": "loader.word",
    "label": "Loading screen name",
    "el": "small",
    "tag": "span",
    "default": "Newsign Labs",
    "note": "Small supporting text. Minimal SEO weight; keep it brief. Shown under the animated logo while the page loads.",
    "range": [
     1,
     50
    ],
    "type": "text"
   }
  ]
 },
 {
  "id": "brand",
  "title": "Brand & navigation",
  "intro": "Logo text, logo alt text and the top navigation.",
  "fields": [
   {
    "key": "brand.logoAlt",
    "label": "Logo alt text",
    "el": "alt",
    "tag": "img alt",
    "default": "Newsign Labs logo",
    "note": "Alternative text, read aloud by screen readers and used by Google Images. Describe the image in under 125 characters. For a logo use '[Brand] logo'. Do not start with 'image of' or stuff keywords. Used for the header and footer logo.",
    "range": [
     5,
     125
    ],
    "type": "text"
   },
   {
    "key": "brand.wordmark1",
    "label": "Wordmark (first word)",
    "el": "small",
    "tag": "span",
    "default": "NEWSIGN",
    "note": "Small supporting text. Minimal SEO weight; keep it brief. Header wordmark, shown in capitals.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "brand.wordmark2",
    "label": "Wordmark (second word)",
    "el": "small",
    "tag": "span",
    "default": "LABS",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "nav.services",
    "label": "Nav: services link",
    "el": "link",
    "tag": "a · link",
    "default": "Services",
    "note": "Navigation link text. Short, literal words that match the section heading help users and give search engines anchor-text context for that section.",
    "range": [
     2,
     24
    ],
    "type": "text"
   },
   {
    "key": "nav.work",
    "label": "Nav: work link",
    "el": "link",
    "tag": "a · link",
    "default": "Selected work",
    "note": "Navigation link text. Short, literal words that match the section heading help users and give search engines anchor-text context for that section.",
    "range": [
     2,
     24
    ],
    "type": "text"
   },
   {
    "key": "nav.approach",
    "label": "Nav: approach link",
    "el": "link",
    "tag": "a · link",
    "default": "Approach",
    "note": "Navigation link text. Short, literal words that match the section heading help users and give search engines anchor-text context for that section.",
    "range": [
     2,
     24
    ],
    "type": "text"
   },
   {
    "key": "header.cta",
    "label": "Header button",
    "el": "cta",
    "tag": "button",
    "default": "Start a project",
    "note": "Button text. Use a specific action ('Brief us on your next move') rather than 'Click here' or 'Submit'. Descriptive button and link text helps accessibility and tells search engines what happens next.",
    "range": [
     3,
     32
    ],
    "type": "text"
   }
  ]
 },
 {
  "id": "hero",
  "title": "Hero",
  "intro": "The first screen. The H1 here is the most important heading on the page.",
  "fields": [
   {
    "key": "hero.eyebrow",
    "label": "Eyebrow",
    "el": "eyebrow",
    "tag": "p · label",
    "default": "Web design & engineering studio · Est. 2019",
    "note": "Small label above a heading. It is a paragraph, not a heading, so it carries little SEO weight. Keep it short and scannable (under ~40 characters); the number keeps the section order clear.",
    "range": [
     3,
     45
    ],
    "type": "text"
   },
   {
    "key": "hero.h1.line1",
    "label": "H1, line 1",
    "el": "h1",
    "tag": "H1",
    "default": "Make your",
    "note": "Part of the page's only H1, the strongest on-page signal of what the page is about. The three H1 parts are read as one heading; keep the whole headline under ~70 characters and include the focus keyword or a close variant.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "hero.h1.highlight",
    "label": "H1, highlighted words",
    "el": "h1",
    "tag": "H1",
    "default": "next move",
    "note": "Part of the page's only H1, the strongest on-page signal of what the page is about. The three H1 parts are read as one heading; keep the whole headline under ~70 characters and include the focus keyword or a close variant. Shown in the gradient colour.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "hero.h1.line3",
    "label": "H1, line 3",
    "el": "h1",
    "tag": "H1",
    "default": "impossible to miss.",
    "note": "Part of the page's only H1, the strongest on-page signal of what the page is about. The three H1 parts are read as one heading; keep the whole headline under ~70 characters and include the focus keyword or a close variant.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "hero.lead",
    "label": "Intro paragraph",
    "el": "lead",
    "tag": "p · first paragraph",
    "default": "We design and engineer websites, products and brand systems for ambitious teams. Built to load fast, read clearly and move people to act.",
    "note": "The first paragraph on the page. Search engines weigh it heavily when judging relevance, and it is often quoted as the snippet when the meta description does not match a query. Include the focus keyword naturally; aim for 120–160 characters.",
    "range": [
     110,
     170
    ],
    "type": "textarea"
   },
   {
    "key": "hero.cta",
    "label": "Button",
    "el": "cta",
    "tag": "button",
    "default": "Brief us on your next move",
    "note": "Button text. Use a specific action ('Brief us on your next move') rather than 'Click here' or 'Submit'. Descriptive button and link text helps accessibility and tells search engines what happens next.",
    "range": [
     3,
     32
    ],
    "type": "text"
   },
   {
    "key": "hero.aside1",
    "label": "Side note, line 1",
    "el": "small",
    "tag": "span",
    "default": "Strategy, design, code",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "hero.aside2",
    "label": "Side note, line 2",
    "el": "small",
    "tag": "span",
    "default": "and the space between.",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "hero.scroll",
    "label": "Scroll hint",
    "el": "small",
    "tag": "span",
    "default": "Scroll to explore",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   }
  ]
 },
 {
  "id": "services",
  "title": "01 · The toolkit",
  "intro": "Section heading, intro and the four service cards.",
  "fields": [
   {
    "key": "services.eyebrow",
    "label": "Eyebrow",
    "el": "eyebrow",
    "tag": "p · label",
    "default": "01 / The toolkit",
    "note": "Small label above a heading. It is a paragraph, not a heading, so it carries little SEO weight. Keep it short and scannable (under ~40 characters); the number keeps the section order clear.",
    "range": [
     3,
     45
    ],
    "type": "text"
   },
   {
    "key": "services.h2a",
    "label": "H2, line 1",
    "el": "h2",
    "tag": "H2",
    "default": "Design and code,",
    "note": "Half of a section heading (H2). H2s are the outline search engines and screen readers use to understand the page. Say plainly what the section covers and work in a secondary keyword where it reads naturally. Both lines together should stay under ~60 characters.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "services.h2b",
    "label": "H2, line 2",
    "el": "h2",
    "tag": "H2",
    "default": "in the same room.",
    "note": "Half of a section heading (H2). H2s are the outline search engines and screen readers use to understand the page. Say plainly what the section covers and work in a secondary keyword where it reads naturally. Both lines together should stay under ~60 characters.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "services.intro",
    "label": "Intro",
    "el": "p",
    "tag": "p",
    "default": "One senior crew across strategy, design and engineering. The people who sketch it are the people who ship it, so nothing gets lost between agencies.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "services.0.title",
    "label": "Service 1: title",
    "el": "h3",
    "tag": "H3",
    "default": "Brand systems",
    "note": "Sub-heading for one item inside a section. Short and specific: name the thing, not a slogan. A relevant keyword here helps search engines match the item to queries. Also used as an option in the project form.",
    "range": [
     2,
     45
    ],
    "type": "text"
   },
   {
    "key": "services.0.text",
    "label": "Service 1: description",
    "el": "p",
    "tag": "p",
    "default": "Identity, type and design systems built to scale cleanly from favicon to billboard, and from your first hire to your fiftieth.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "services.0.tag1",
    "label": "Service 1: tag 1",
    "el": "tag",
    "tag": "span · chip",
    "default": "Identity",
    "note": "Small chip/tag. Decorative label with little SEO weight; one or two words.",
    "range": [
     2,
     24
    ],
    "type": "text"
   },
   {
    "key": "services.0.tag2",
    "label": "Service 1: tag 2",
    "el": "tag",
    "tag": "span · chip",
    "default": "Design systems",
    "note": "Small chip/tag. Decorative label with little SEO weight; one or two words.",
    "range": [
     2,
     24
    ],
    "type": "text"
   },
   {
    "key": "services.1.title",
    "label": "Service 2: title",
    "el": "h3",
    "tag": "H3",
    "default": "Websites & web apps",
    "note": "Sub-heading for one item inside a section. Short and specific: name the thing, not a slogan. A relevant keyword here helps search engines match the item to queries. Also used as an option in the project form.",
    "range": [
     2,
     45
    ],
    "type": "text"
   },
   {
    "key": "services.1.text",
    "label": "Service 2: description",
    "el": "p",
    "tag": "p",
    "default": "Marketing sites, platforms and SaaS products engineered in React and Next.js: fast, accessible and built to turn visits into pipeline.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "services.1.tag1",
    "label": "Service 2: tag 1",
    "el": "tag",
    "tag": "span · chip",
    "default": "Next.js builds",
    "note": "Small chip/tag. Decorative label with little SEO weight; one or two words.",
    "range": [
     2,
     24
    ],
    "type": "text"
   },
   {
    "key": "services.1.tag2",
    "label": "Service 2: tag 2",
    "el": "tag",
    "tag": "span · chip",
    "default": "Custom SaaS",
    "note": "Small chip/tag. Decorative label with little SEO weight; one or two words.",
    "range": [
     2,
     24
    ],
    "type": "text"
   },
   {
    "key": "services.2.title",
    "label": "Service 3: title",
    "el": "h3",
    "tag": "H3",
    "default": "3D & AI lab",
    "note": "Sub-heading for one item inside a section. Short and specific: name the thing, not a slogan. A relevant keyword here helps search engines match the item to queries. Also used as an option in the project form.",
    "range": [
     2,
     45
    ],
    "type": "text"
   },
   {
    "key": "services.2.text",
    "label": "Service 3: description",
    "el": "p",
    "tag": "p",
    "default": "WebGL scenes, product configurators and AI-assisted tools that make complex products instantly legible and genuinely fun to explore.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "services.2.tag1",
    "label": "Service 3: tag 1",
    "el": "tag",
    "tag": "span · chip",
    "default": "Three.js / WebGL",
    "note": "Small chip/tag. Decorative label with little SEO weight; one or two words.",
    "range": [
     2,
     24
    ],
    "type": "text"
   },
   {
    "key": "services.2.tag2",
    "label": "Service 3: tag 2",
    "el": "tag",
    "tag": "span · chip",
    "default": "AI prototyping",
    "note": "Small chip/tag. Decorative label with little SEO weight; one or two words.",
    "range": [
     2,
     24
    ],
    "type": "text"
   },
   {
    "key": "services.3.title",
    "label": "Service 4: title",
    "el": "h3",
    "tag": "H3",
    "default": "Motion & launch",
    "note": "Sub-heading for one item inside a section. Short and specific: name the thing, not a slogan. A relevant keyword here helps search engines match the item to queries. Also used as an option in the project form.",
    "range": [
     2,
     45
    ],
    "type": "text"
   },
   {
    "key": "services.3.text",
    "label": "Service 4: description",
    "el": "p",
    "tag": "p",
    "default": "Motion systems, sonic logos and launch campaigns that carry the brand beyond the browser and into feeds, inboxes and pitch rooms.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "services.3.tag1",
    "label": "Service 4: tag 1",
    "el": "tag",
    "tag": "span · chip",
    "default": "Motion & sound",
    "note": "Small chip/tag. Decorative label with little SEO weight; one or two words.",
    "range": [
     2,
     24
    ],
    "type": "text"
   },
   {
    "key": "services.3.tag2",
    "label": "Service 4: tag 2",
    "el": "tag",
    "tag": "span · chip",
    "default": "Launch campaigns",
    "note": "Small chip/tag. Decorative label with little SEO weight; one or two words.",
    "range": [
     2,
     24
    ],
    "type": "text"
   }
  ]
 },
 {
  "id": "marquee",
  "title": "Scrolling band",
  "intro": "The slanted band of words under the hero.",
  "fields": [
   {
    "key": "marquee.items",
    "label": "Words",
    "el": "list",
    "tag": "ul · one item per line",
    "default": "Websites that convert\nWeb apps & SaaS\nWebGL & 3D\nHeadless commerce\nBrand systems\nMotion design\nAI prototyping",
    "note": "One item per line; each line becomes a bullet (<li>). Short, parallel phrases scan best, and lists are easy for search engines to lift into rich results. Decorative and hidden from screen readers, so it carries no SEO weight; keep each item to two or three words.",
    "type": "list"
   }
  ]
 },
 {
  "id": "work",
  "title": "02 · Selected work",
  "intro": "Case-study tiles and their popups.",
  "fields": [
   {
    "key": "work.eyebrow",
    "label": "Eyebrow",
    "el": "eyebrow",
    "tag": "p · label",
    "default": "02 / Proof of signal",
    "note": "Small label above a heading. It is a paragraph, not a heading, so it carries little SEO weight. Keep it short and scannable (under ~40 characters); the number keeps the section order clear.",
    "range": [
     3,
     45
    ],
    "type": "text"
   },
   {
    "key": "work.h2a",
    "label": "H2, line 1",
    "el": "h2",
    "tag": "H2",
    "default": "Selected",
    "note": "Half of a section heading (H2). H2s are the outline search engines and screen readers use to understand the page. Say plainly what the section covers and work in a secondary keyword where it reads naturally. Both lines together should stay under ~60 characters.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "work.h2b",
    "label": "H2, line 2",
    "el": "h2",
    "tag": "H2",
    "default": "frequencies.",
    "note": "Half of a section heading (H2). H2s are the outline search engines and screen readers use to understand the page. Say plainly what the section covers and work in a secondary keyword where it reads naturally. Both lines together should stay under ~60 characters.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "work.hint",
    "label": "Hover hint",
    "el": "small",
    "tag": "span",
    "default": "hover to shift the frame",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "projects.0.name",
    "label": "Project 1: name",
    "el": "h3",
    "tag": "H3",
    "default": "NEW STUDIO / ALBUMS, LAID OUT",
    "note": "Sub-heading for one item inside a section. Short and specific: name the thing, not a slogan. A relevant keyword here helps search engines match the item to queries. Shown as H3 on the tile and H2 in the case-study popup. Format: NAME / TAGLINE.",
    "range": [
     2,
     45
    ],
    "type": "text"
   },
   {
    "key": "projects.0.type",
    "label": "Project 1: category",
    "el": "eyebrow",
    "tag": "p · label",
    "default": "Product platform · Installable web app",
    "note": "Small label above a heading. It is a paragraph, not a heading, so it carries little SEO weight. Keep it short and scannable (under ~40 characters); the number keeps the section order clear.",
    "range": [
     3,
     45
    ],
    "type": "text"
   },
   {
    "key": "projects.0.summary",
    "label": "Project 1: summary",
    "el": "p",
    "tag": "p",
    "default": "A browser-based studio for designing photo albums and print-ready layered layouts. Photos never leave the device while the layout syncs, AI beautifies pages on request, and a built-in Newlance marketplace lets studios hire layout artists with escrow-protected payouts.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "projects.0.scope",
    "label": "Project 1: scope",
    "el": "small",
    "tag": "span",
    "default": "Product design / Web app engineering / Payments & escrow / AI tooling",
    "note": "Small supporting text. Minimal SEO weight; keep it brief. Separate items with \" / \".",
    "range": [
     10,
     110
    ],
    "type": "text"
   },
   {
    "key": "projects.0.result",
    "label": "Project 1: outcome",
    "el": "p",
    "tag": "p",
    "default": "Album design, freelance hiring and secure payouts in one workflow, instead of three tools and a chat thread.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "projects.1.name",
    "label": "Project 2: name",
    "el": "h3",
    "tag": "H3",
    "default": "NEWBRUSH / ONE CLASS, NEW SKIN",
    "note": "Sub-heading for one item inside a section. Short and specific: name the thing, not a slogan. A relevant keyword here helps search engines match the item to queries. Shown as H3 on the tile and H2 in the case-study popup. Format: NAME / TAGLINE.",
    "range": [
     2,
     45
    ],
    "type": "text"
   },
   {
    "key": "projects.1.type",
    "label": "Project 2: category",
    "el": "eyebrow",
    "tag": "p · label",
    "default": "Design framework · Developer tooling",
    "note": "Small label above a heading. It is a paragraph, not a heading, so it carries little SEO weight. Keep it short and scannable (under ~40 characters); the number keeps the section order clear.",
    "range": [
     3,
     45
    ],
    "type": "text"
   },
   {
    "key": "projects.1.summary",
    "label": "Project 2: summary",
    "el": "p",
    "tag": "p",
    "default": "A token-driven design framework that pairs a full component library with a utility toolkit. Change one class and the whole interface becomes minimal, glassmorphic, neumorphic, neon, cyber or pixel, while a built-in AI bridge lets agents generate on-brand UI on demand.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "projects.1.scope",
    "label": "Project 2: scope",
    "el": "small",
    "tag": "span",
    "default": "Design tokens / Component library / Design styles / AI-agent tooling",
    "note": "Small supporting text. Minimal SEO weight; keep it brief. Separate items with \" / \".",
    "range": [
     10,
     110
    ],
    "type": "text"
   },
   {
    "key": "projects.1.result",
    "label": "Project 2: outcome",
    "el": "p",
    "tag": "p",
    "default": "One markup, six personalities: a team can restyle an entire product by changing a single class instead of rewriting its styles.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "projects.2.name",
    "label": "Project 3: name",
    "el": "h3",
    "tag": "H3",
    "default": "BIZMSGS / TWO CHANNELS, ONE INBOX",
    "note": "Sub-heading for one item inside a section. Short and specific: name the thing, not a slogan. A relevant keyword here helps search engines match the item to queries. Shown as H3 on the tile and H2 in the case-study popup. Format: NAME / TAGLINE.",
    "range": [
     2,
     45
    ],
    "type": "text"
   },
   {
    "key": "projects.2.type",
    "label": "Project 3: category",
    "el": "eyebrow",
    "tag": "p · label",
    "default": "Business messaging · Multi-channel",
    "note": "Small label above a heading. It is a paragraph, not a heading, so it carries little SEO weight. Keep it short and scannable (under ~40 characters); the number keeps the section order clear.",
    "range": [
     3,
     45
    ],
    "type": "text"
   },
   {
    "key": "projects.2.summary",
    "label": "Project 3: summary",
    "el": "p",
    "tag": "p",
    "default": "One workspace for businesses to message customers on the two chat apps they already use. Team members sign in with a one-time code delivered on the app they choose: no passwords, no SMS bills.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "projects.2.scope",
    "label": "Project 3: scope",
    "el": "small",
    "tag": "span",
    "default": "Channel integrations / One-time-code sign-in / Templates & consent / Shared inbox",
    "note": "Small supporting text. Minimal SEO weight; keep it brief. Separate items with \" / \".",
    "range": [
     10,
     110
    ],
    "type": "text"
   },
   {
    "key": "projects.2.result",
    "label": "Project 3: outcome",
    "el": "p",
    "tag": "p",
    "default": "Templates, bulk sends, a shared reply inbox and delivery tracking across both channels, with per-channel customer consent built in.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "modal.scopeLabel",
    "label": "Popup: scope label",
    "el": "eyebrow",
    "tag": "p · label",
    "default": "Scope",
    "note": "Small label above a heading. It is a paragraph, not a heading, so it carries little SEO weight. Keep it short and scannable (under ~40 characters); the number keeps the section order clear.",
    "range": [
     3,
     45
    ],
    "type": "text"
   },
   {
    "key": "modal.signalLabel",
    "label": "Popup: outcome label",
    "el": "eyebrow",
    "tag": "p · label",
    "default": "Signal",
    "note": "Small label above a heading. It is a paragraph, not a heading, so it carries little SEO weight. Keep it short and scannable (under ~40 characters); the number keeps the section order clear.",
    "range": [
     3,
     45
    ],
    "type": "text"
   },
   {
    "key": "modal.cta",
    "label": "Popup: button",
    "el": "cta",
    "tag": "button",
    "default": "Start a similar project",
    "note": "Button text. Use a specific action ('Brief us on your next move') rather than 'Click here' or 'Submit'. Descriptive button and link text helps accessibility and tells search engines what happens next.",
    "range": [
     3,
     32
    ],
    "type": "text"
   }
  ]
 },
 {
  "id": "approach",
  "title": "03 · How we move",
  "intro": "Process rows, their detail popups and the 3D card.",
  "fields": [
   {
    "key": "approach.eyebrow",
    "label": "Eyebrow",
    "el": "eyebrow",
    "tag": "p · label",
    "default": "03 / How we move",
    "note": "Small label above a heading. It is a paragraph, not a heading, so it carries little SEO weight. Keep it short and scannable (under ~40 characters); the number keeps the section order clear.",
    "range": [
     3,
     45
    ],
    "type": "text"
   },
   {
    "key": "approach.h2a",
    "label": "H2, line 1",
    "el": "h2",
    "tag": "H2",
    "default": "The work gets",
    "note": "Half of a section heading (H2). H2s are the outline search engines and screen readers use to understand the page. Say plainly what the section covers and work in a secondary keyword where it reads naturally. Both lines together should stay under ~60 characters.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "approach.h2b",
    "label": "H2, line 2",
    "el": "h2",
    "tag": "H2",
    "default": "better in motion.",
    "note": "Half of a section heading (H2). H2s are the outline search engines and screen readers use to understand the page. Say plainly what the section covers and work in a secondary keyword where it reads naturally. Both lines together should stay under ~60 characters.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "approach.modelLabel",
    "label": "3D card caption",
    "el": "small",
    "tag": "span",
    "default": "live working model · 3D geometry online",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "approach.modelAria",
    "label": "3D card accessible name",
    "el": "aria",
    "tag": "aria-label",
    "default": "Animated 3D geometry",
    "note": "Accessible name read by screen readers only; it is never shown. Say what the element is or does. No direct ranking effect, but accessibility is part of page quality.",
    "range": [
     5,
     80
    ],
    "type": "text"
   },
   {
    "key": "approach.steps.0.title",
    "label": "Step 1: title",
    "el": "h3",
    "tag": "H3",
    "default": "Find the sharp edge",
    "note": "Sub-heading for one item inside a section. Short and specific: name the thing, not a slogan. A relevant keyword here helps search engines match the item to queries. Also the title of its detail popup and of the 3D card.",
    "range": [
     2,
     45
    ],
    "type": "text"
   },
   {
    "key": "approach.steps.0.text",
    "label": "Step 1: summary",
    "el": "p",
    "tag": "p",
    "default": "Workshops, audits and audience research that distil what you really sell into one idea worth building around.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "process.0.phase",
    "label": "Step 1 popup: phase",
    "el": "small",
    "tag": "span",
    "default": "Discovery sprint",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "process.0.time",
    "label": "Step 1 popup: timing",
    "el": "small",
    "tag": "span",
    "default": "Week 1–2",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "process.0.lead",
    "label": "Step 1 popup: intro",
    "el": "p",
    "tag": "p",
    "default": "Before a single pixel, we find the one idea worth building around. Short, focused and evidence-led.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "process.0.happens",
    "label": "Step 1 popup: what happens",
    "el": "list",
    "tag": "ul · one item per line",
    "default": "Kick-off workshop with your decision makers\nAudience and competitor teardown\nAnalytics and funnel audit of what exists today\nPositioning and message hierarchy",
    "note": "One item per line; each line becomes a bullet (<li>). Short, parallel phrases scan best, and lists are easy for search engines to lift into rich results.",
    "type": "list"
   },
   {
    "key": "process.0.get",
    "label": "Step 1 popup: what you get",
    "el": "list",
    "tag": "ul · one item per line",
    "default": "Positioning one-pager\nCreative and technical brief\nSuccess metrics we will be measured on\nScope and timeline you can plan around",
    "note": "One item per line; each line becomes a bullet (<li>). Short, parallel phrases scan best, and lists are easy for search engines to lift into rich results.",
    "type": "list"
   },
   {
    "key": "approach.lab.0.tag",
    "label": "Step 1: 3D card readout",
    "el": "small",
    "tag": "span",
    "default": "Crystal · faceted",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "approach.steps.1.title",
    "label": "Step 2: title",
    "el": "h3",
    "tag": "H3",
    "default": "Make it tangible",
    "note": "Sub-heading for one item inside a section. Short and specific: name the thing, not a slogan. A relevant keyword here helps search engines match the item to queries. Also the title of its detail popup and of the 3D card.",
    "range": [
     2,
     45
    ],
    "type": "text"
   },
   {
    "key": "approach.steps.1.text",
    "label": "Step 2: summary",
    "el": "p",
    "tag": "p",
    "default": "Clickable prototypes from week two. You react to the real product, not a slide deck describing it.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "process.1.phase",
    "label": "Step 2 popup: phase",
    "el": "small",
    "tag": "span",
    "default": "Prototype & design",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "process.1.time",
    "label": "Step 2 popup: timing",
    "el": "small",
    "tag": "span",
    "default": "Week 2–5",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "process.1.lead",
    "label": "Step 2 popup: intro",
    "el": "p",
    "tag": "p",
    "default": "A clickable prototype in your hands early, so feedback is about the real thing and not a slide.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "process.1.happens",
    "label": "Step 2 popup: what happens",
    "el": "list",
    "tag": "ul · one item per line",
    "default": "Wireframes to high-fidelity design in weekly loops\nInteractive prototype tested with real users\nDesign system foundations: type, colour, components\nTechnical spike for anything risky (3D, integrations, data)",
    "note": "One item per line; each line becomes a bullet (<li>). Short, parallel phrases scan best, and lists are easy for search engines to lift into rich results.",
    "type": "list"
   },
   {
    "key": "process.1.get",
    "label": "Step 2 popup: what you get",
    "el": "list",
    "tag": "ul · one item per line",
    "default": "Interactive prototype\nVisual direction and design system\nContent plan and copy drafts\nBuild plan with fixed milestones",
    "note": "One item per line; each line becomes a bullet (<li>). Short, parallel phrases scan best, and lists are easy for search engines to lift into rich results.",
    "type": "list"
   },
   {
    "key": "approach.lab.1.tag",
    "label": "Step 2: 3D card readout",
    "el": "small",
    "tag": "span",
    "default": "Voxel · assembled",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "approach.steps.2.title",
    "label": "Step 3: title",
    "el": "h3",
    "tag": "H3",
    "default": "Turn up the signal",
    "note": "Sub-heading for one item inside a section. Short and specific: name the thing, not a slogan. A relevant keyword here helps search engines match the item to queries. Also the title of its detail popup and of the 3D card.",
    "range": [
     2,
     45
    ],
    "type": "text"
   },
   {
    "key": "approach.steps.2.text",
    "label": "Step 3: summary",
    "el": "p",
    "tag": "p",
    "default": "Production engineering, launch campaigns and the analytics to prove what is working, from first pixel to follow-up email.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "process.2.phase",
    "label": "Step 3 popup: phase",
    "el": "small",
    "tag": "span",
    "default": "Build, launch & amplify",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "process.2.time",
    "label": "Step 3 popup: timing",
    "el": "small",
    "tag": "span",
    "default": "Week 5+",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "process.2.lead",
    "label": "Step 3 popup: intro",
    "el": "p",
    "tag": "p",
    "default": "We engineer it fast, accessible and measurable, then make sure the right people actually see it.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "process.2.happens",
    "label": "Step 3 popup: what happens",
    "el": "list",
    "tag": "ul · one item per line",
    "default": "Production build with performance budgets\nAccessibility and cross-device QA\nAnalytics, SEO and CMS hand-over\nLaunch campaign, motion assets and outreach",
    "note": "One item per line; each line becomes a bullet (<li>). Short, parallel phrases scan best, and lists are easy for search engines to lift into rich results.",
    "type": "list"
   },
   {
    "key": "process.2.get",
    "label": "Step 3 popup: what you get",
    "el": "list",
    "tag": "ul · one item per line",
    "default": "Live product on your domain\nLaunch kit: social, motion, email\nTraining and documentation\n90-day growth and iteration plan",
    "note": "One item per line; each line becomes a bullet (<li>). Short, parallel phrases scan best, and lists are easy for search engines to lift into rich results.",
    "type": "list"
   },
   {
    "key": "approach.lab.2.tag",
    "label": "Step 3: 3D card readout",
    "el": "small",
    "tag": "span",
    "default": "Signal · broadcasting",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "process.labels.hint",
    "label": "Row hint",
    "el": "small",
    "tag": "span",
    "default": "View details",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "process.labels.step",
    "label": "Popup: \"Step\" word",
    "el": "small",
    "tag": "span",
    "default": "Step",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "process.labels.happens",
    "label": "Popup: first list heading",
    "el": "eyebrow",
    "tag": "p · label",
    "default": "What happens",
    "note": "Small label above a heading. It is a paragraph, not a heading, so it carries little SEO weight. Keep it short and scannable (under ~40 characters); the number keeps the section order clear.",
    "range": [
     3,
     45
    ],
    "type": "text"
   },
   {
    "key": "process.labels.get",
    "label": "Popup: second list heading",
    "el": "eyebrow",
    "tag": "p · label",
    "default": "What you get",
    "note": "Small label above a heading. It is a paragraph, not a heading, so it carries little SEO weight. Keep it short and scannable (under ~40 characters); the number keeps the section order clear.",
    "range": [
     3,
     45
    ],
    "type": "text"
   },
   {
    "key": "process.labels.cta",
    "label": "Popup: button",
    "el": "cta",
    "tag": "button",
    "default": "Start with this step",
    "note": "Button text. Use a specific action ('Brief us on your next move') rather than 'Click here' or 'Submit'. Descriptive button and link text helps accessibility and tells search engines what happens next.",
    "range": [
     3,
     32
    ],
    "type": "text"
   },
   {
    "key": "process.labels.next",
    "label": "Popup: next link prefix",
    "el": "small",
    "tag": "span",
    "default": "Next:",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   }
  ]
 },
 {
  "id": "receipts",
  "title": "04 · The receipts",
  "intro": "Stats and testimonials.",
  "fields": [
   {
    "key": "receipts.eyebrow",
    "label": "Eyebrow",
    "el": "eyebrow",
    "tag": "p · label",
    "default": "04 / The receipts",
    "note": "Small label above a heading. It is a paragraph, not a heading, so it carries little SEO weight. Keep it short and scannable (under ~40 characters); the number keeps the section order clear.",
    "range": [
     3,
     45
    ],
    "type": "text"
   },
   {
    "key": "receipts.h2a",
    "label": "H2, line 1",
    "el": "h2",
    "tag": "H2",
    "default": "Proof,",
    "note": "Half of a section heading (H2). H2s are the outline search engines and screen readers use to understand the page. Say plainly what the section covers and work in a secondary keyword where it reads naturally. Both lines together should stay under ~60 characters.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "receipts.h2b",
    "label": "H2, line 2",
    "el": "h2",
    "tag": "H2",
    "default": "not promises.",
    "note": "Half of a section heading (H2). H2s are the outline search engines and screen readers use to understand the page. Say plainly what the section covers and work in a secondary keyword where it reads naturally. Both lines together should stay under ~60 characters.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "receipts.stats.0.value",
    "label": "Stat 1: number",
    "el": "stat",
    "tag": "p · stat",
    "default": "3.4×",
    "note": "Headline number. Keep it short and make sure you can back it up: unverifiable claims erode trust with readers and reviewers.",
    "range": [
     1,
     8
    ],
    "type": "text"
   },
   {
    "key": "receipts.stats.0.label",
    "label": "Stat 1: label",
    "el": "small",
    "tag": "span",
    "default": "average launch lift",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "receipts.stats.1.value",
    "label": "Stat 2: number",
    "el": "stat",
    "tag": "p · stat",
    "default": "18",
    "note": "Headline number. Keep it short and make sure you can back it up: unverifiable claims erode trust with readers and reviewers.",
    "range": [
     1,
     8
    ],
    "type": "text"
   },
   {
    "key": "receipts.stats.1.label",
    "label": "Stat 2: label",
    "el": "small",
    "tag": "span",
    "default": "markets reached",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "receipts.stats.2.value",
    "label": "Stat 3: number",
    "el": "stat",
    "tag": "p · stat",
    "default": "41k",
    "note": "Headline number. Keep it short and make sure you can back it up: unverifiable claims erode trust with readers and reviewers.",
    "range": [
     1,
     8
    ],
    "type": "text"
   },
   {
    "key": "receipts.stats.2.label",
    "label": "Stat 3: label",
    "el": "small",
    "tag": "span",
    "default": "hours of build time",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "receipts.quotes.0.quote",
    "label": "Testimonial 1: quote",
    "el": "quote",
    "tag": "blockquote-style p",
    "default": "They gave the brand a spine. Suddenly every decision got easier.",
    "note": "Testimonial. Real quotes with real names and roles build trust (E-E-A-T, which Google uses to judge credibility). Only publish quotes you have permission to use; never invent them.",
    "range": [
     30,
     180
    ],
    "type": "textarea"
   },
   {
    "key": "receipts.quotes.0.name",
    "label": "Testimonial 1: name",
    "el": "small",
    "tag": "span",
    "default": "Maya Rao",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "receipts.quotes.0.role",
    "label": "Testimonial 1: role, company",
    "el": "small",
    "tag": "span",
    "default": "Founder, Aster House",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "receipts.quotes.1.quote",
    "label": "Testimonial 2: quote",
    "el": "quote",
    "tag": "blockquote-style p",
    "default": "The rare team that can talk conversion rates and kerning in the same breath.",
    "note": "Testimonial. Real quotes with real names and roles build trust (E-E-A-T, which Google uses to judge credibility). Only publish quotes you have permission to use; never invent them.",
    "range": [
     30,
     180
    ],
    "type": "textarea"
   },
   {
    "key": "receipts.quotes.1.name",
    "label": "Testimonial 2: name",
    "el": "small",
    "tag": "span",
    "default": "Jon Bell",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "receipts.quotes.1.role",
    "label": "Testimonial 2: role, company",
    "el": "small",
    "tag": "span",
    "default": "Growth lead, Orbit",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "receipts.quotes.2.quote",
    "label": "Testimonial 3: quote",
    "el": "quote",
    "tag": "blockquote-style p",
    "default": "We shipped in six weeks and looked like we had been around for ten years.",
    "note": "Testimonial. Real quotes with real names and roles build trust (E-E-A-T, which Google uses to judge credibility). Only publish quotes you have permission to use; never invent them.",
    "range": [
     30,
     180
    ],
    "type": "textarea"
   },
   {
    "key": "receipts.quotes.2.name",
    "label": "Testimonial 3: name",
    "el": "small",
    "tag": "span",
    "default": "Nikhil Shah",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "receipts.quotes.2.role",
    "label": "Testimonial 3: role, company",
    "el": "small",
    "tag": "span",
    "default": "CEO, Sola",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   }
  ]
 },
 {
  "id": "engage",
  "title": "05 · Ways to work",
  "intro": "Engagement options.",
  "fields": [
   {
    "key": "engage.eyebrow",
    "label": "Eyebrow",
    "el": "eyebrow",
    "tag": "p · label",
    "default": "05 / Ways to work",
    "note": "Small label above a heading. It is a paragraph, not a heading, so it carries little SEO weight. Keep it short and scannable (under ~40 characters); the number keeps the section order clear.",
    "range": [
     3,
     45
    ],
    "type": "text"
   },
   {
    "key": "engage.h2a",
    "label": "H2, line 1",
    "el": "h2",
    "tag": "H2",
    "default": "Pick a pace.",
    "note": "Half of a section heading (H2). H2s are the outline search engines and screen readers use to understand the page. Say plainly what the section covers and work in a secondary keyword where it reads naturally. Both lines together should stay under ~60 characters.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "engage.h2b",
    "label": "H2, line 2",
    "el": "h2",
    "tag": "H2",
    "default": "We bring the momentum.",
    "note": "Half of a section heading (H2). H2s are the outline search engines and screen readers use to understand the page. Say plainly what the section covers and work in a secondary keyword where it reads naturally. Both lines together should stay under ~60 characters.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "engage.intro",
    "label": "Intro",
    "el": "p",
    "tag": "p",
    "default": "Start small and prove it, build the whole thing, or keep us on the bench. Every engagement is led by senior people from first call to launch day.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "engage.0.name",
    "label": "Option 1: name",
    "el": "h3",
    "tag": "H3",
    "default": "Launch Sprint",
    "note": "Sub-heading for one item inside a section. Short and specific: name the thing, not a slogan. A relevant keyword here helps search engines match the item to queries.",
    "range": [
     2,
     45
    ],
    "type": "text"
   },
   {
    "key": "engage.0.badge",
    "label": "Option 1: badge",
    "el": "tag",
    "tag": "span · chip",
    "default": "Fast start",
    "note": "Small chip/tag. Decorative label with little SEO weight; one or two words.",
    "range": [
     2,
     24
    ],
    "type": "text"
   },
   {
    "key": "engage.0.time",
    "label": "Option 1: duration",
    "el": "small",
    "tag": "span",
    "default": "2–4 weeks",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "engage.0.text",
    "label": "Option 1: description",
    "el": "p",
    "tag": "p",
    "default": "A sharp first version of your brand, landing page or prototype, shipped while the idea is still hot and the budget is still small.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "engage.0.items",
    "label": "Option 1: includes",
    "el": "list",
    "tag": "ul · one item per line",
    "default": "Brand starter or landing page\nOne round of user feedback\nLaunch-ready assets\nClear next-step roadmap",
    "note": "One item per line; each line becomes a bullet (<li>). Short, parallel phrases scan best, and lists are easy for search engines to lift into rich results.",
    "type": "list"
   },
   {
    "key": "engage.0.cta",
    "label": "Option 1: button",
    "el": "cta",
    "tag": "button",
    "default": "Start a launch sprint",
    "note": "Button text. Use a specific action ('Brief us on your next move') rather than 'Click here' or 'Submit'. Descriptive button and link text helps accessibility and tells search engines what happens next.",
    "range": [
     3,
     32
    ],
    "type": "text"
   },
   {
    "key": "engage.1.name",
    "label": "Option 2: name",
    "el": "h3",
    "tag": "H3",
    "default": "Product Build",
    "note": "Sub-heading for one item inside a section. Short and specific: name the thing, not a slogan. A relevant keyword here helps search engines match the item to queries.",
    "range": [
     2,
     45
    ],
    "type": "text"
   },
   {
    "key": "engage.1.badge",
    "label": "Option 2: badge",
    "el": "tag",
    "tag": "span · chip",
    "default": "Most chosen",
    "note": "Small chip/tag. Decorative label with little SEO weight; one or two words.",
    "range": [
     2,
     24
    ],
    "type": "text"
   },
   {
    "key": "engage.1.time",
    "label": "Option 2: duration",
    "el": "small",
    "tag": "span",
    "default": "6–12 weeks",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "engage.1.text",
    "label": "Option 2: description",
    "el": "p",
    "tag": "p",
    "default": "A full website, platform or web app, from discovery to launch, designed and engineered by one senior crew under one contract.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "engage.1.items",
    "label": "Option 2: includes",
    "el": "list",
    "tag": "ul · one item per line",
    "default": "Discovery, design and build\nDesign system and CMS\n3D, motion and interactions\nPerformance and accessibility QA",
    "note": "One item per line; each line becomes a bullet (<li>). Short, parallel phrases scan best, and lists are easy for search engines to lift into rich results.",
    "type": "list"
   },
   {
    "key": "engage.1.cta",
    "label": "Option 2: button",
    "el": "cta",
    "tag": "button",
    "default": "Start a product build",
    "note": "Button text. Use a specific action ('Brief us on your next move') rather than 'Click here' or 'Submit'. Descriptive button and link text helps accessibility and tells search engines what happens next.",
    "range": [
     3,
     32
    ],
    "type": "text"
   },
   {
    "key": "engage.2.name",
    "label": "Option 3: name",
    "el": "h3",
    "tag": "H3",
    "default": "Signal Partner",
    "note": "Sub-heading for one item inside a section. Short and specific: name the thing, not a slogan. A relevant keyword here helps search engines match the item to queries.",
    "range": [
     2,
     45
    ],
    "type": "text"
   },
   {
    "key": "engage.2.badge",
    "label": "Option 3: badge",
    "el": "tag",
    "tag": "span · chip",
    "default": "Ongoing",
    "note": "Small chip/tag. Decorative label with little SEO weight; one or two words.",
    "range": [
     2,
     24
    ],
    "type": "text"
   },
   {
    "key": "engage.2.time",
    "label": "Option 3: duration",
    "el": "small",
    "tag": "span",
    "default": "Monthly",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "engage.2.text",
    "label": "Option 3: description",
    "el": "p",
    "tag": "p",
    "default": "Your embedded design and engineering team for products that ship every month and should get measurably better each time.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "engage.2.items",
    "label": "Option 3: includes",
    "el": "list",
    "tag": "ul · one item per line",
    "default": "Reserved senior capacity\nExperiments and CRO\nCampaign and content drops\nMonthly growth review",
    "note": "One item per line; each line becomes a bullet (<li>). Short, parallel phrases scan best, and lists are easy for search engines to lift into rich results.",
    "type": "list"
   },
   {
    "key": "engage.2.cta",
    "label": "Option 3: button",
    "el": "cta",
    "tag": "button",
    "default": "Start a signal partner",
    "note": "Button text. Use a specific action ('Brief us on your next move') rather than 'Click here' or 'Submit'. Descriptive button and link text helps accessibility and tells search engines what happens next.",
    "range": [
     3,
     32
    ],
    "type": "text"
   }
  ]
 },
 {
  "id": "faq",
  "title": "06 · Good questions",
  "intro": "FAQ section.",
  "fields": [
   {
    "key": "faq.eyebrow",
    "label": "Eyebrow",
    "el": "eyebrow",
    "tag": "p · label",
    "default": "06 / Good questions",
    "note": "Small label above a heading. It is a paragraph, not a heading, so it carries little SEO weight. Keep it short and scannable (under ~40 characters); the number keeps the section order clear.",
    "range": [
     3,
     45
    ],
    "type": "text"
   },
   {
    "key": "faq.h2a",
    "label": "H2, line 1",
    "el": "h2",
    "tag": "H2",
    "default": "Before you",
    "note": "Half of a section heading (H2). H2s are the outline search engines and screen readers use to understand the page. Say plainly what the section covers and work in a secondary keyword where it reads naturally. Both lines together should stay under ~60 characters.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "faq.h2b",
    "label": "H2, line 2",
    "el": "h2",
    "tag": "H2",
    "default": "ask.",
    "note": "Half of a section heading (H2). H2s are the outline search engines and screen readers use to understand the page. Say plainly what the section covers and work in a secondary keyword where it reads naturally. Both lines together should stay under ~60 characters.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "faq.intro",
    "label": "Intro",
    "el": "p",
    "tag": "p",
    "default": "Still curious? Send us the brief and we will answer with a useful first thought within two working days.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "faq.cta",
    "label": "Link text",
    "el": "cta",
    "tag": "button",
    "default": "Ask us directly →",
    "note": "Button text. Use a specific action ('Brief us on your next move') rather than 'Click here' or 'Submit'. Descriptive button and link text helps accessibility and tells search engines what happens next.",
    "range": [
     3,
     32
    ],
    "type": "text"
   },
   {
    "key": "faq.0.q",
    "label": "Question 1",
    "el": "faqq",
    "tag": "summary · question",
    "default": "How long does a website take?",
    "note": "FAQ question. Phrase it the way people search ('How long does a website take?'). Question-style copy can earn 'People also ask' placements.",
    "range": [
     15,
     80
    ],
    "type": "text"
   },
   {
    "key": "faq.0.a",
    "label": "Answer 1",
    "el": "faqa",
    "tag": "p · answer",
    "default": "A focused marketing site usually takes 4–8 weeks from kick-off to launch. Larger products and web apps run 8–12 weeks, and we ship a working prototype in the first few weeks either way.",
    "note": "FAQ answer. Answer directly in the first sentence, then add detail; 40–60 words is the sweet spot for featured snippets.",
    "range": [
     120,
     320
    ],
    "type": "textarea"
   },
   {
    "key": "faq.1.q",
    "label": "Question 2",
    "el": "faqq",
    "tag": "summary · question",
    "default": "How do you price projects?",
    "note": "FAQ question. Phrase it the way people search ('How long does a website take?'). Question-style copy can earn 'People also ask' placements.",
    "range": [
     15,
     80
    ],
    "type": "text"
   },
   {
    "key": "faq.1.a",
    "label": "Answer 2",
    "el": "faqa",
    "tag": "p · answer",
    "default": "We scope every project after a short call, then quote a fixed price per phase so there are no surprise invoices. Ongoing partnerships are a simple monthly fee for reserved capacity.",
    "note": "FAQ answer. Answer directly in the first sentence, then add detail; 40–60 words is the sweet spot for featured snippets.",
    "range": [
     120,
     320
    ],
    "type": "textarea"
   },
   {
    "key": "faq.2.q",
    "label": "Question 3",
    "el": "faqq",
    "tag": "summary · question",
    "default": "Can you work with our existing team or codebase?",
    "note": "FAQ question. Phrase it the way people search ('How long does a website take?'). Question-style copy can earn 'People also ask' placements.",
    "range": [
     15,
     80
    ],
    "type": "text"
   },
   {
    "key": "faq.2.a",
    "label": "Answer 3",
    "el": "faqa",
    "tag": "p · answer",
    "default": "Yes. We regularly slot in alongside in-house designers and engineers, work in your repositories and follow your conventions, or hand over cleanly documented code to your team.",
    "note": "FAQ answer. Answer directly in the first sentence, then add detail; 40–60 words is the sweet spot for featured snippets.",
    "range": [
     120,
     320
    ],
    "type": "textarea"
   },
   {
    "key": "faq.3.q",
    "label": "Question 4",
    "el": "faqq",
    "tag": "summary · question",
    "default": "Will our site be fast, even with 3D and motion?",
    "note": "FAQ question. Phrase it the way people search ('How long does a website take?'). Question-style copy can earn 'People also ask' placements.",
    "range": [
     15,
     80
    ],
    "type": "text"
   },
   {
    "key": "faq.3.a",
    "label": "Answer 4",
    "el": "faqa",
    "tag": "p · answer",
    "default": "Performance is part of the design. We set budgets up front, lazy-load heavy scenes, respect reduced-motion settings and test on real mid-range phones before launch.",
    "note": "FAQ answer. Answer directly in the first sentence, then add detail; 40–60 words is the sweet spot for featured snippets.",
    "range": [
     120,
     320
    ],
    "type": "textarea"
   },
   {
    "key": "faq.4.q",
    "label": "Question 5",
    "el": "faqq",
    "tag": "summary · question",
    "default": "What happens after launch?",
    "note": "FAQ question. Phrase it the way people search ('How long does a website take?'). Question-style copy can earn 'People also ask' placements.",
    "range": [
     15,
     80
    ],
    "type": "text"
   },
   {
    "key": "faq.4.a",
    "label": "Answer 5",
    "el": "faqa",
    "tag": "p · answer",
    "default": "You get training, documentation and 30 days of included support. Many clients keep us on as a Signal Partner to run experiments, add features and keep the brand moving.",
    "note": "FAQ answer. Answer directly in the first sentence, then add detail; 40–60 words is the sweet spot for featured snippets.",
    "range": [
     120,
     320
    ],
    "type": "textarea"
   }
  ]
 },
 {
  "id": "contact",
  "title": "07 · Your turn",
  "intro": "Closing call to action.",
  "fields": [
   {
    "key": "contact.eyebrow",
    "label": "Eyebrow",
    "el": "eyebrow",
    "tag": "p · label",
    "default": "07 / Your turn",
    "note": "Small label above a heading. It is a paragraph, not a heading, so it carries little SEO weight. Keep it short and scannable (under ~40 characters); the number keeps the section order clear.",
    "range": [
     3,
     45
    ],
    "type": "text"
   },
   {
    "key": "contact.h2a",
    "label": "H2, line 1",
    "el": "h2",
    "tag": "H2",
    "default": "Have a good",
    "note": "Half of a section heading (H2). H2s are the outline search engines and screen readers use to understand the page. Say plainly what the section covers and work in a secondary keyword where it reads naturally. Both lines together should stay under ~60 characters.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "contact.h2b",
    "label": "H2, line 2",
    "el": "h2",
    "tag": "H2",
    "default": "problem?",
    "note": "Half of a section heading (H2). H2s are the outline search engines and screen readers use to understand the page. Say plainly what the section covers and work in a secondary keyword where it reads naturally. Both lines together should stay under ~60 characters.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "contact.text",
    "label": "Text",
    "el": "p",
    "tag": "p",
    "default": "Tell us what you are building, what is stuck, or what should exist but does not yet. Within two working days you will get a senior reply with a first useful thought, not a sales script.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "contact.cta",
    "label": "Button",
    "el": "cta",
    "tag": "button",
    "default": "Start a project",
    "note": "Button text. Use a specific action ('Brief us on your next move') rather than 'Click here' or 'Submit'. Descriptive button and link text helps accessibility and tells search engines what happens next.",
    "range": [
     3,
     32
    ],
    "type": "text"
   },
   {
    "key": "contact.bookingLabel",
    "label": "Availability label",
    "el": "small",
    "tag": "span",
    "default": "Currently booking",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "contact.bookingValue",
    "label": "Availability value",
    "el": "small",
    "tag": "span",
    "default": "Q4 / 2026",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   }
  ]
 },
 {
  "id": "form",
  "title": "Project form",
  "intro": "The \"Start a project\" popup.",
  "fields": [
   {
    "key": "form.ariaLabel",
    "label": "Popup accessible name",
    "el": "aria",
    "tag": "aria-label",
    "default": "Start a project",
    "note": "Accessible name read by screen readers only; it is never shown. Say what the element is or does. No direct ranking effect, but accessibility is part of page quality.",
    "range": [
     5,
     80
    ],
    "type": "text"
   },
   {
    "key": "form.eyebrow",
    "label": "Eyebrow",
    "el": "eyebrow",
    "tag": "p · label",
    "default": "New signal incoming",
    "note": "Small label above a heading. It is a paragraph, not a heading, so it carries little SEO weight. Keep it short and scannable (under ~40 characters); the number keeps the section order clear.",
    "range": [
     3,
     45
    ],
    "type": "text"
   },
   {
    "key": "form.h2a",
    "label": "Heading, line 1",
    "el": "h2",
    "tag": "H2",
    "default": "Let's make",
    "note": "Half of a section heading (H2). H2s are the outline search engines and screen readers use to understand the page. Say plainly what the section covers and work in a secondary keyword where it reads naturally. Both lines together should stay under ~60 characters. This heading is inside a popup, so it only appears after a click; it adds little SEO weight.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "form.h2b",
    "label": "Heading, line 2",
    "el": "h2",
    "tag": "H2",
    "default": "it real.",
    "note": "Half of a section heading (H2). H2s are the outline search engines and screen readers use to understand the page. Say plainly what the section covers and work in a secondary keyword where it reads naturally. Both lines together should stay under ~60 characters.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "form.intro",
    "label": "Intro",
    "el": "p",
    "tag": "p",
    "default": "A few details is enough. We reply within two working days.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "form.nameLabel",
    "label": "Name label",
    "el": "label",
    "tag": "label",
    "default": "Your name",
    "note": "Form field label. Visible labels are required for accessibility; keep them short and literal.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "form.namePlaceholder",
    "label": "Name placeholder",
    "el": "placeholder",
    "tag": "placeholder",
    "default": "Name / studio",
    "note": "Example text inside an empty field. It disappears when typing, so never put instructions here that the label does not also say.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "form.serviceLabel",
    "label": "Service label",
    "el": "label",
    "tag": "label",
    "default": "What are we making?",
    "note": "Form field label. Visible labels are required for accessibility; keep them short and literal.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "form.otherOption",
    "label": "Extra service option",
    "el": "label",
    "tag": "label",
    "default": "Something wonderfully specific",
    "note": "Form field label. Visible labels are required for accessibility; keep them short and literal. Last option in the service list, after the four service titles.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "form.emailLabel",
    "label": "Email label",
    "el": "label",
    "tag": "label",
    "default": "Email",
    "note": "Form field label. Visible labels are required for accessibility; keep them short and literal.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "form.emailPlaceholder",
    "label": "Email placeholder",
    "el": "placeholder",
    "tag": "placeholder",
    "default": "you@company.com",
    "note": "Example text inside an empty field. It disappears when typing, so never put instructions here that the label does not also say.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "form.submit",
    "label": "Submit button",
    "el": "cta",
    "tag": "button",
    "default": "Send the brief",
    "note": "Button text. Use a specific action ('Brief us on your next move') rather than 'Click here' or 'Submit'. Descriptive button and link text helps accessibility and tells search engines what happens next.",
    "range": [
     3,
     32
    ],
    "type": "text"
   },
   {
    "key": "form.successTitle",
    "label": "Success: title",
    "el": "h2",
    "tag": "H2",
    "default": "Signal received.",
    "note": "Half of a section heading (H2). H2s are the outline search engines and screen readers use to understand the page. Say plainly what the section covers and work in a secondary keyword where it reads naturally. Both lines together should stay under ~60 characters.",
    "range": [
     2,
     40
    ],
    "type": "text"
   },
   {
    "key": "form.successText",
    "label": "Success: text",
    "el": "p",
    "tag": "p",
    "default": "We'll read the brief, gather the right minds and come back with a useful first move.",
    "note": "Body copy that search engines index as page content. Write for people first: use the keyword and related terms naturally, never stuffed. One to three sentences reads best on a phone.",
    "range": [
     40,
     240
    ],
    "type": "textarea"
   },
   {
    "key": "form.successBack",
    "label": "Success: button",
    "el": "cta",
    "tag": "button",
    "default": "Back to the studio",
    "note": "Button text. Use a specific action ('Brief us on your next move') rather than 'Click here' or 'Submit'. Descriptive button and link text helps accessibility and tells search engines what happens next.",
    "range": [
     3,
     32
    ],
    "type": "text"
   }
  ]
 },
 {
  "id": "footer",
  "title": "Footer",
  "intro": "Footer links and social labels.",
  "fields": [
   {
    "key": "footer.copyright",
    "label": "Copyright line",
    "el": "small",
    "tag": "span",
    "default": "Newsign Labs / 2026",
    "note": "Small supporting text. Minimal SEO weight; keep it brief.",
    "range": [
     1,
     50
    ],
    "type": "text"
   },
   {
    "key": "footer.services",
    "label": "Link: services",
    "el": "link",
    "tag": "a · link",
    "default": "Services",
    "note": "Navigation link text. Short, literal words that match the section heading help users and give search engines anchor-text context for that section.",
    "range": [
     2,
     24
    ],
    "type": "text"
   },
   {
    "key": "footer.work",
    "label": "Link: work",
    "el": "link",
    "tag": "a · link",
    "default": "Work",
    "note": "Navigation link text. Short, literal words that match the section heading help users and give search engines anchor-text context for that section.",
    "range": [
     2,
     24
    ],
    "type": "text"
   },
   {
    "key": "footer.contact",
    "label": "Link: contact",
    "el": "link",
    "tag": "a · link",
    "default": "Contact",
    "note": "Navigation link text. Short, literal words that match the section heading help users and give search engines anchor-text context for that section.",
    "range": [
     2,
     24
    ],
    "type": "text"
   },
   {
    "key": "footer.ariaLinkedIn",
    "label": "LinkedIn icon name",
    "el": "aria",
    "tag": "aria-label",
    "default": "Newsign Labs on LinkedIn",
    "note": "Accessible name read by screen readers only; it is never shown. Say what the element is or does. No direct ranking effect, but accessibility is part of page quality.",
    "range": [
     5,
     80
    ],
    "type": "text"
   },
   {
    "key": "footer.ariaYouTube",
    "label": "YouTube icon name",
    "el": "aria",
    "tag": "aria-label",
    "default": "Newsign Labs on YouTube",
    "note": "Accessible name read by screen readers only; it is never shown. Say what the element is or does. No direct ranking effect, but accessibility is part of page quality.",
    "range": [
     5,
     80
    ],
    "type": "text"
   },
   {
    "key": "footer.ariaInstagram",
    "label": "Instagram icon name",
    "el": "aria",
    "tag": "aria-label",
    "default": "Newsign Labs on Instagram",
    "note": "Accessible name read by screen readers only; it is never shown. Say what the element is or does. No direct ranking effect, but accessibility is part of page quality.",
    "range": [
     5,
     80
    ],
    "type": "text"
   }
  ]
 }
];
