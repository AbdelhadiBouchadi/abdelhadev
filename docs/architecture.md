# Architecture

## Principles

1. Routes are thin. A page composes sections; it holds no logic and no animation code.
2. Server first. Sections are Server Components that render content and pass it to small client primitives that animate it.
3. One source per fact: identity in `lib/site.ts`, copy in `messages/`, structured data in `lib/content/`, colours in `styles/tokens.css`, easings and durations in `lib/motion.ts`.
4. Reusable motion lives in `primitives/`. A section composes primitives; it writes its own GSAP only for a choreography unique to that section.
5. Heavy things are opt-in: three.js loads only on the home page, after the shell, through a dynamic import.

## Folder layout

```
abdelhadev/
├── AGENTS.md
├── brand/                      logo source kit and generator script (not shipped)
├── docs/
│   ├── decisions.md  architecture.md  art-direction.md  choreography.md  content.md  quality.md
│   ├── prototype/              approved HTML prototype, reference only
│   └── spikes/
├── messages/                   fr.json, en.json
├── prompts/                    NN-name.md
├── public/
│   ├── brand/                  logo lockups (SVG), icon-192.png, icon-512.png, icon-maskable-512.png
│   └── media/                  screenshots, posters (AVIF/WebP), never real patient data
├── scripts/                    check-tokens.mjs, check-i18n.mjs, build-brand-paths.mjs
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx              html, fonts, providers, boot script, header, footer, loader
│   │   │   ├── page.tsx                home
│   │   │   ├── work/page.tsx   work index
│   │   │   ├── work/[slug]/page.tsx   case study
│   │   │   ├── about/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── legal/page.tsx  legal notice
│   │   │   ├── not-found.tsx  error.tsx
│   │   ├── favicon.ico  icon.svg  apple-icon.png  manifest.ts  robots.ts  sitemap.ts
│   ├── actions/contact.ts
│   ├── components/
│   │   ├── brand/      Mark.tsx, Wordmark.tsx, wordmark-paths.ts (generated)
│   │   ├── layout/     Header.tsx, MobileNav.tsx, Footer.tsx, Loader.tsx, Cursor.tsx, Sky.tsx, SkipLink.tsx
│   │   ├── sections/   home/, work/, case/, about/, contact/
│   │   ├── three/      HeroScene.tsx (+ its parts), loaded with next/dynamic, ssr: false
│   │   └── ui/         Button.tsx, Chip.tsx, Field.tsx, Screen.tsx (placeholder screen)
│   ├── primitives/     SmoothScroll, TransitionProvider, TransitionLink, SplitReveal, WordsLight,
│   │                   MaskReveal, StickyStage, Magnetic, FitText, LineDraw, ToneSection
│   ├── hooks/          useLenis, useReducedMotion, useMediaQuery, usePointer, useLoaderReady,
│   │                   useIsomorphicLayoutEffect
│   ├── lib/
│   │   ├── gsap.ts     plugin registration, CustomEase "warm", exports
│   │   ├── lenis.ts    Lenis factory and ticker wiring
│   │   ├── motion.ts   EASE, DURATION, SCRUB, STAGGER, LOADER timings (mirror of the CSS tokens)
│   │   ├── loader.ts   task registry: track(weight, promise), progress, ready signal
│   │   ├── fonts.ts    next/font definitions
│   │   ├── site.ts     identity, contact channels, social links, INDEXABLE flag
│   │   ├── seo.ts      metadata helpers, alternates, JSON-LD builders
│   │   ├── env.ts      zod-validated environment (server-only parts guarded)
│   │   ├── utils.ts    cn() and small pure helpers
│   │   └── content/    projects.ts, experience.ts, stack.ts, schema.ts (zod)
│   ├── i18n/           routing.ts, request.ts, navigation.ts
│   └── styles/         globals.css, tokens.css (the only colour source)
└── tests/              unit/, e2e/
```

## Import boundaries (enforced by ESLint)

| From | May import |
|---|---|
| `app` | everything below |
| `components/sections/<page>` | `components/layout`, `components/ui`, `components/brand`, `components/three`, `primitives`, `hooks`, `lib`, `i18n` (never another page's sections) |
| `components/layout`, `components/three` | `components/ui`, `components/brand`, `primitives`, `hooks`, `lib`, `i18n` |
| `primitives` | `hooks`, `lib`, `i18n` (navigation only) |
| `components/ui`, `components/brand` | `lib` |
| `hooks` | `lib` |
| `lib` | external packages only |

All cross-folder imports use the `@/` alias.

## Routing

Localised pathnames in `src/i18n/routing.ts`:

| Key | fr | en |
|---|---|---|
| `/` | `/fr` | `/en` |
| `/work` | `/fr/projets` | `/en/work` |
| `/work/[slug]` | `/fr/projets/[slug]` | `/en/work/[slug]` |
| `/about` | `/fr/a-propos` | `/en/about` |
| `/contact` | `/fr/contact` | `/en/contact` |
| `/legal` | `/fr/mentions-legales` | `/en/legal-notice` |

`/` redirects by `Accept-Language` (fallback `fr`) in `src/proxy.ts`. Case studies are statically generated from `lib/content/projects.ts`.

## Brand assets: where each file goes

| Brand kit file | Destination | Why |
|---|---|---|
| `favicons/favicon.ico` | `src/app/favicon.ico` | Next metadata file convention |
| `favicons/favicon.svg` | `src/app/icon.svg` | Modern browsers, follows the tab theme |
| `favicons/apple-touch-icon.png` | `src/app/apple-icon.png` | Next convention for Apple touch icon |
| `favicons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | `public/brand/` | Referenced from `src/app/manifest.ts` |
| `logo-*.svg`, `wordmark-*.svg` | `public/brand/` | Static use: emails, CV, downloads, press |
| `og-image.png` | `src/app/[locale]/opengraph-image.png` until 09 generates localised images | Next convention |
| `logo-mark-animated.svg`, `wordmark-animated.svg` | `src/components/brand/` as React components, paths generated into `wordmark-paths.ts` by `scripts/build-brand-paths.mjs` | Inline SVG so GSAP can animate the sun and each letter; colours via tokens and `currentColor` |
| `build_brand.py`, `README.md` and all originals | `brand/` at the repo root | Source of truth to regenerate the kit |

## Rendering, loader and transitions

- The root layout renders the loader overlay on the server so it is present at first paint, under `html.js`. A blocking boot script sets `js`, `motion` (unless reduced motion), and `arriving` (when a curtain started on the previous page).
- `lib/loader.ts` holds a task registry. The layout registers fonts; sections register their critical images; the home page registers the 3D scene. The Loader component reads progress and plays the sunrise; when done it signals `ready`, and page intros start through `useLoaderReady()`.
- Route changes: `TransitionLink` asks the `TransitionProvider` to cover (sunset curtain), then calls next-intl `router.push`. The new route's sections register their tasks, the short loader runs, then the curtain lifts. Back and Forward use the same short path. Focus moves to the main heading after arrival.

## Data shapes

- `lib/content/projects.ts`: `slug`, `featured`, `status` (`live`, `ready`, `in-progress`), `year` (optional, never invented), `stack[]`, `links` (demo, repo, live; optional), `media[]` (path, width, height, layout span), and a `copyKey` pointing at `messages.projects.<slug>` for the localised name, kind, challenge, built, role and alt texts. Validated with zod at build time.
- Placeholders: any value the owner has not supplied is the literal `[TODO: …]`; the build lists them and fails when `REQUIRE_CONTENT=1`.
