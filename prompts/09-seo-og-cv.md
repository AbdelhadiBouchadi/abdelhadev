# 09-seo-og-cv

Branch: `feat/09-seo-og-cv`

## Git rules for this run (they override AGENTS.md)

The owner reviews the diff and commits by hand. You do **not** run `git add`, `git commit`, `git push`, `git stash`, `git checkout`, `git reset` or anything that changes branches or history. Leave every change in the working tree. At the end, give `git status --short` and a proposed commit split.

## Lean testing policy

- While iterating: `pnpm typecheck` and the single spec or unit file you are working on. SEO checks do not depend on layout: use Playwright's `request` fixture (no browser) wherever the HTML or a response is enough, on one project only.
- Before replying, run only: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm check:tokens`, `pnpm check:i18n`, `pnpm check:fr`, `pnpm test`, `pnpm build`, the new `seo` spec at 1440, the specs this branch touches (`about`, `work`, `case`) at 1440 only, and the three pull-request smoke specs (`foundation`, `no-js`, `a11y`) at 1440 only.
- Do **not** run the full `pnpm test:e2e` and do **not** run `pnpm lhci`. List them under "Not verified" as "runs in e2e-full".
- Never re-run something that already passed unless you changed code that covers it. Keep the reply short: only the last line of each check. Never report a gate as passing that you did not run.

## Before you start

`feat/08c-project-copy` is merged into `main`. You are on a new branch `feat/09-seo-og-cv` with a clean tree. Check `git status` and `git branch --show-current`; if either is wrong, stop and say so.

## Skills and docs

Run `/skills`. Invoke `frontend-design` (for the OG images) and `french-copy-quality`.

Read first: `AGENTS.md`, `docs/decisions.md`, `docs/content.md`, `docs/french-style.md`, `src/lib/site.ts`, `src/lib/seo.ts` (if present), `src/lib/content/` (`projects.ts`, `cv.ts`, `testimonials.ts`), `src/app` (layouts, pages, `not-found`, `error`, `global-error`, `sitemap`, `robots`, icons, manifest if any), `next.config.*`, the i18n routing and pathnames config, `messages/*.json`, the prototype's header mark in `docs/prototype/`, the font setup.

## Goal

Make the site findable, shareable and complete: correct metadata in both languages, hreflang, sitemap and robots (with production-only indexing), structured data, Open Graph images, icons and manifest, finished error pages, and a real CV download. No invented facts anywhere.

## Step 0. Fill the four statuses (carry-over from 08c)

The statuses of MeetAI, Ophtachusm, Yoga booking and Côte Royale are still `[TODO]` and block `REQUIRE_CONTENT=1`. Follow the mechanism DentaFlow's status (`ready`) already uses to be shown in both languages (add values or labels only if it needs them; do not change the layout):

| Project | FR | EN |
|---|---|---|
| MeetAI | Déployé, abonnement en mode test | Deployed, subscription in test mode |
| Ophtachusm | Utilisé par le service pendant plusieurs mois | Used by the department for several months |
| Yoga booking | Fonctionnel, sans paiement en ligne | Working, without online payments |
| Côte Royale | Projet de démonstration | Concept project |

These are the owner's wording to confirm; mark them with a star in the reply. Remove the four TODO lines and keep the unit tests green.

## Step 1. Metadata for every page, both languages

1. `metadataBase` from `site.ts` (`https://abdelhadev.me`). One typed helper (in `src/lib/seo.ts`) builds the metadata for a page from its message keys: title, description, canonical, alternates, Open Graph, Twitter. Pages call it in `generateMetadata`; no page writes metadata by hand.
2. Titles: a template `"%s | Abdelhadev"` (home uses a full title of its own), at most 60 characters each. Descriptions: 110 to 160 characters, specific, no marketing words, no prices, no years of experience, no claim about clients or results. Written natively in French first (`docs/french-style.md`), English written, not translated. Pages: home, work, each case study (`/work/dentaflow`), about, contact, legal notice, 404.
3. Canonical per locale. **hreflang** alternates between the French and English version of every page, using the localised pathnames from the i18n config (never guess a path), plus `x-default` pointing to French. Alternates must be reciprocal.
4. Open Graph: `og:type` `website` (`article` is not needed), `og:locale` `fr_FR` / `en_US` with the other as `alternateLocale`, `og:site_name` "Abdelhadev", Twitter card `summary_large_image`.
5. The legal notice and the 404 are `noindex`. Everything else is indexable **only in production**: when `VERCEL_ENV` is not `production` (previews, local), every page sends `noindex, nofollow`.

## Step 2. Sitemap and robots

1. `sitemap.ts`: every indexable page in both locales with `alternates.languages`, built from the same route list the tests use (public projects with a case study only, never a hidden or unconfirmed one). No `lastModified` unless it is truthful.
2. `robots.ts`: in production allow all and point to the sitemap; elsewhere `Disallow: /`. Never list private paths in it.
3. `X-Robots-Tag: noindex` for `/cv/*` (headers in the Next config), so the CV files are downloadable but not indexed.

## Step 3. Structured data (JSON-LD, server-rendered)

A small `JsonLd` server component that serialises safely (escape `<`). Types, all built from `site.ts` and message keys, no invented fact:

- Home: `Person` (name "Abdelhadi Bouchadi", `jobTitle` "Développeur full-stack" / "Full-stack developer", `url`, `sameAs` with the LinkedIn and GitHub URLs from `site.ts`, `address` Agadir, MA, `email` the public address, `knowsAbout` limited to technologies named on the site) and `WebSite` (name, url, `inLanguage`).
- Work and each case study: `BreadcrumbList`.
- Forbidden everywhere: `aggregateRating`, `review`, `offers`, `price`, `alumniOf`, `worksFor`, `award`, any year of experience, any employer or client name. A unit test asserts none of these keys can appear.

## Step 4. Open Graph images

1. `opengraph-image` routes via `next/og` (1200 × 630 PNG), generated at build, one per locale for: home, work, about, contact, and the DentaFlow case study. Alt text through message keys.
2. Design (use `frontend-design`): the "An Agadir day" look of the site: its dark and warm tokens, Bricolage Grotesque for the title and Instrument Sans for the line, the name Abdelhadev and the page title in the page's language, one calm composition, no stock imagery, no faces, no screenshots with personal data. Use the design tokens (no new colours). Text must be readable at 600 px wide.
3. Fonts: `next/og` needs TTF, OTF or WOFF (not WOFF2). Load them from the repository without any network call at build time. If the font files in the repo are WOFF2 only, add the static WOFF files through the existing font package or a dev-only copy under `src/assets/og/`, and say so; keep the licence (OFL) file next to them.
4. Verify by saving each generated image once to `test-results/09/` and looking at them (one still per type, at full size).

## Step 5. Icons and manifest

1. Favicon: derive from the site's header mark in the prototype. Provide `icon.svg`, `apple-icon.png` (180), and `icon-192.png` / `icon-512.png`. If the prototype has no mark, use a simple monogram "A" in Bricolage Grotesque on the night token, and say so.
2. `manifest.webmanifest` (name "Abdelhadev", short name, `theme_color` and `background_color` from the tokens, the icons). Add `theme-color` meta that follows the colour scheme if the site has one.

## Step 6. Error pages

Check and finish: the localised `not-found` (reached from any unknown path, status 404, with a link home and a link to the work page, in the visitor's language), `error.tsx` (a retry button) and `global-error.tsx`. Use existing primitives and tokens, calm French written natively, `noindex`, accessible (one `h1`, focus lands sensibly), complete without JavaScript where the framework allows. No new motion.

## Step 7. The CV

1. `cv.ts` already tells a placeholder from a real file. Keep the mechanism: the files live at `public/cv/abdelhadi-bouchadi-cv-fr.pdf` and `public/cv/abdelhadi-bouchadi-cv-en.pdf` (create the folder; if placeholders exist, leave them; **do not write a CV**: the owner supplies both PDFs).
2. The download link (wherever it already appears: about, footer or contact) points to the file for the visitor's language, has the `download` attribute with a clean filename, shows the language and the file size computed at build time, and has a 44 px target.
3. Unit test: when a real file exists it starts with `%PDF` and is under 2 MB; with `REQUIRE_CONTENT=1` the placeholder still fails the build (existing behaviour, keep its test).
4. Add to `todoReport()` the owner action "place the two CV PDFs in `public/cv/`" if they are still placeholders.

## Tests (lean)

- Unit: titles under 60 characters and descriptions 110 to 160 for every page in both locales; titles unique per locale; hreflang pairs reciprocal and use real localised paths; the sitemap contains only public indexable pages with both alternates and none of the hidden ones; `robots` disallows everything outside production and allows it in production; no forbidden JSON-LD key can be produced; the helper escapes `<`; the four statuses are no longer TODO; `check:fr` passes.
- E2E `seo.spec.ts` with the `request` fixture (no browser), on home, work, about, contact, the case study and the legal notice in both locales: one `canonical`, the right `hreflang` set including `x-default`, `og:image` and `twitter:image` URLs that return 200 with `image/png`, JSON-LD that parses as JSON with the expected `@type`, `noindex` on the legal notice and 404; `/robots.txt`, `/sitemap.xml` and `/manifest.webmanifest` return 200; an unknown path returns 404; `/cv/*` carries `X-Robots-Tag: noindex`.
- `about.spec` / `work.spec` / `case.spec`: only what you changed (the CV link, the statuses), at 1440.
- The three smoke specs at 1440.

## Decisions already made (do not re-decide)

All of `docs/decisions.md` (to P18). No prices, no years of experience, no invented facts, no personal client names, no owner on camera, Contact is the call to action word, the university and graduation year never shown, "ingénieur / engineer / student / étudiant" never used for the owner. French is written natively.

## Out of scope

The full CI gate, `REQUIRE_CONTENT=1` in the pipeline, bot-detection mode, the domain and `www` redirect, analytics, Search Console, the legal review (10); Arabic and RTL; per-project pages for the other projects; any change to the contact form; DentaFlow copy.

## Acceptance

1. The lean list passes (last line of each). `e2e-full` and Lighthouse listed as not run.
2. Every page has correct, unique metadata in both languages with reciprocal hreflang; previews are `noindex`; production is indexable.
3. The sitemap, robots, manifest, icons, JSON-LD and OG images exist and are served; stills of the OG images are in `test-results/09/`.
4. The 404 and error pages are localised and finished. The CV link works for the language and the TODO report says what is left. `git status --short` is shown; nothing was committed or pushed.

## Reply format

Short. **Summary** (3 lines), **Pages** (a table: page, FR title, EN title, description lengths), **Verification**, **Stars** (wording you are unsure of, including the four statuses), **Open questions**, **Not verified**, **TODO report**, **Evidence** (file list), **Proposed commits**, `git status --short`.