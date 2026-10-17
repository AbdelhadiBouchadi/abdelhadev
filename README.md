# abdelhadev.me

The portfolio of Abdelhadi Bouchadi (brand **Abdelhadev**), a full-stack developer in Agadir, Morocco. It wins freelance clients and serves as a professional profile, as a scroll-driven site that has to stay fast, accessible and secure.

French is the default language (`/fr`), English the second (`/en`).

**Agents and contributors: read [`AGENTS.md`](AGENTS.md) first.** It holds the rules; `docs/` holds the facts and specs (decisions, architecture, art direction, choreography, content, quality) and the approved prototype in `docs/prototype/`.

## Stack

Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, next-intl, GSAP with `@gsap/react`, Lenis, React Three Fiber (home scene only, lazy), zod, Vitest, Playwright with axe, Lighthouse CI. Hosted on Vercel. No database, no CMS.

## Run it

Requires Node 24 and pnpm 9 (`corepack enable` picks the pinned version).

```bash
pnpm install
pnpm dev            # http://localhost:3000 redirects to /fr or /en
```

The design lab with the tokens, type scale and brand is at `/fr/lab` (not in production).

Environment variable names are in [`.env.example`](.env.example); copy it to `.env.local` and fill in values when a feature needs them. Never commit values.

## Checks

CI runs these in order (`.github/workflows/ci.yml`); run them locally before opening a pull request:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm format:check
pnpm check:tokens   # colours, easings, durations and radii only from tokens
pnpm check:i18n     # fr and en have the same keys, no prices
pnpm test           # Vitest
pnpm build          # lists every content placeholder; fails on them with REQUIRE_CONTENT=1
pnpm test:e2e       # Playwright: responsive, accessibility, no JavaScript, reduced motion, legal
pnpm lhci           # Lighthouse CI against the production build
```

`pnpm brand:paths` regenerates `src/components/brand/wordmark-paths.ts` from `brand/wordmark-animated.svg`; CI fails if the committed file is stale.

## How work happens

- One prompt per build in `prompts/NN-name.md`, one branch per prompt (`feat/NN-name`).
- The owner reviews, runs CodeRabbit and merges. Nobody pushes to `main` directly.
- Conventional Commits, small and focused.
- Content the owner has not supplied yet stays a visible placeholder; facts are never invented.

## Layout

```
src/app/[locale]/   routes (thin: they compose sections)
src/components/     brand, layout, sections (per page), three, ui
src/primitives/     reusable GSAP-animated components
src/hooks/          shared hooks
src/lib/            config and pure logic (motion, gsap, lenis, loader, site, seo, env, content)
src/i18n/           next-intl routing, request config, navigation
src/styles/         tokens.css (the only colour source) and globals.css
messages/           fr.json, en.json
brand/              logo source kit and generator (not shipped)
docs/               decisions, architecture, specs, prototype, spike reports, baseline
```
