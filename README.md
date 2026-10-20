# abdelhadev.me

This is the source of my portfolio at [abdelhadev.me](https://abdelhadev.me). I'm Abdelhadi Bouchadi, a full-stack developer in Agadir, and the site has two jobs: bring me freelance clients and serve as my professional profile for recruiters. French is the default language (`/fr`), English the second (`/en`).

## What is in it

- Five pages: home, work, a case study, about, contact, plus the legal notice and a 404.
- The home page is a scroll story through one Agadir day, with a small three.js scene in the hero.
- The DentaFlow case study: the problem, a product tour that follows the step you are reading, what changes for each clinic, and an architecture diagram that draws itself.
- A contact form that works without JavaScript, and a WhatsApp link built from the same fields.
- A media pipeline that turns my screenshots and screen recordings into the files the site serves.

## Stack

- Next.js 16 (App Router) and React 19, TypeScript in strict mode.
- Tailwind CSS 4, with every colour, radius, easing and duration coming from tokens.
- next-intl for routing and copy in both languages.
- GSAP and Lenis for the motion; three.js for the home scene, loaded lazily on that page only.
- Resend with React Email for the contact form, Arcjet in front of it for rate limiting and bots.
- Vitest and Playwright (with axe), Lighthouse CI, hosted on Vercel.
- No database and no CMS: the content lives in typed data files and message files.

## Run it

You need Node 24 or later and pnpm 9 (`corepack enable` picks the pinned version).

```bash
pnpm install
cp .env.example .env.local
pnpm dev            # http://localhost:3000 redirects to /fr or /en
```

Every variable is optional locally. The names are in `.env.example`:

- `VERCEL_ENV`: set by Vercel. Only `production` is indexable; everything else is `noindex`.
- `REQUIRE_CONTENT`: `1` makes the build fail on any content placeholder left in the repo.
- `RESEND_API_KEY`, `CONTACT_TO`, `ARCJET_KEY`: send the contact form, to my private inbox, behind Arcjet. Required in production.
- `CONTACT_FROM`: the sender; defaults to Resend's own address until my domain is verified there.
- `CONTACT_DRY_RUN`: `1` validates the form and reports success without calling Resend or Arcjet. For local runs, previews and tests only; the server refuses to start with it in production.

## Scripts

| Script                | What it does                                                                     |
| --------------------- | -------------------------------------------------------------------------------- |
| `pnpm dev`            | Development server.                                                              |
| `pnpm build`          | Lists every content placeholder, then builds.                                    |
| `pnpm typecheck`      | Generates the route types and runs `tsc`.                                        |
| `pnpm lint`           | ESLint, including the import boundaries and banned libraries.                    |
| `pnpm test`           | Vitest unit tests.                                                               |
| `pnpm test:e2e`       | Playwright at 390 and 1440 against `pnpm start`, so build first.                 |
| `pnpm media`          | Optimises the screenshots and loops (see Media).                                 |
| `pnpm check:tokens`   | Colours, easings, durations and radii come from tokens only.                     |
| `pnpm check:i18n`     | French and English have the same keys, no empty values and no prices.            |
| `pnpm check:fr`       | The French copy follows `docs/french-style.md`.                                  |
| `pnpm check:comments` | Comments in `src`, `tests` and `scripts` stay free of process history and emoji. |

## How it is organised

```
src/
  app/[locale]/   routes only: layouts, pages, metadata, the @footer slot
  actions/        the contact form's server action
  components/     brand (mark, wordmark), layout (header, footer, loader, cursor),
                  sections (one folder per page), three (the home scene), ui
  primitives/     the reusable animated pieces: reveals, sticky stages, the route curtain
  hooks/          shared hooks
  lib/            config and pure logic: motion values, site facts, SEO, env, content data
  i18n/           next-intl routing, request config and navigation
  styles/         tokens.css (the only colour values) and the page stylesheets
messages/         fr.json and en.json
```

Imports go one way, from routes down to `lib`; ESLint enforces it. `docs/architecture.md` has the details.

## Content and languages

Every visible string lives in `messages/fr.json` and `messages/en.json`, with the same keys in both. Structured data (projects, case studies, testimonials, the CV) lives in `src/lib/content/`, and my identity and contact channels in `src/lib/site.ts`. A fact I haven't supplied yet stays a visible `[TODO: …]` placeholder.

French comes first and is written, not translated. `docs/french-style.md` holds the rules and the glossary, and `pnpm check:fr` fails on the phrases it bans.

To add a project: add it to `INPUT` and `WORK_ORDER` in `src/lib/content/projects.ts`, write its copy under `projects.<slug>` in both message files, map its screens in `src/lib/content/media.map.json` and run `pnpm media`. A case study also needs an entry in `src/lib/content/case-studies.ts`.

## Media

`pnpm media` reads my original screenshots and recordings from `ASSETS_DIR` (an environment variable, or a git-ignored `scripts/media.local.json`). It writes AVIF and WebP images, or MP4 and WebM loops with a poster, to `public/work/<slug>/` and describes them in `src/lib/content/media.manifest.json`. The originals never enter the repository, and only the files the map publishes are written.

## Tests and CI

On every pull request (`.github/workflows/ci.yml`): the secret scan, `typecheck`, `lint`, `format:check`, the four `check:*` scripts, the unit tests, a check that the generated wordmark paths are fresh, the build, and a Playwright smoke (foundation, no JavaScript, accessibility) at 1440.

On `main`, every Monday and on demand (`.github/workflows/e2e-full.yml`): the whole Playwright suite at 390 and 1440, and Lighthouse CI. These specs depend on timing, so they never block a pull request.

## Deploying

I host the site on Vercel. The environment variables:

- Production: `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` and `ARCJET_KEY`. The server refuses to start without `RESEND_API_KEY`, `CONTACT_TO` or `ARCJET_KEY`.
- Preview: the same four, plus `CONTACT_DRY_RUN=1`, so a preview never sends a real email.

`CONTACT_DRY_RUN` must never be set in Production: the form would report success and send nothing, so the server refuses to start with it.

Vercel sets `VERCEL_ENV`. The site is indexable only when it is `production`; every other deployment is `noindex`, and Arcjet only blocks bots in production.

I set `REQUIRE_CONTENT=1` on the Production build. The build then fails while any `[TODO: …]` placeholder or CV file is missing.

The domain is attached in the Vercel project settings, with DNS-only records at the registrar (no proxy in front of Vercel).

## Notes

The decisions behind the site are in `docs/decisions.md`. The ones that surprise people:

- No prices anywhere. The quote comes after scoping and data modelling.
- No database and no CMS. Content changes are commits.
- Unknown facts are never invented. They stay as placeholders, and `REQUIRE_CONTENT=1` on the production deployment makes the build fail on any that are left.
- Motion respects reduced motion: no smooth scroll, no scrubs, no moving 3D, everything visible and still. Without JavaScript the pages are complete.
- The locale switch is a plain link and a full page load, on purpose.
