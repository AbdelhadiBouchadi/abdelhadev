# 00-foundation

Branch: `feat/00-foundation`

## Before you start (the owner has done this)

The repository is new and contains only: `AGENTS.md`, `docs/` (including `docs/prototype/`), `prompts/`, and `brand/` (the logo kit with `build_brand.py` and `README.md`). If any of these is missing, stop and say which.

## Skills and docs

Run `/skills`. Invoke `frontend-design`. GSAP skills are needed only for spike S2. Look up current APIs through Context7 for Next.js 16 (App Router, `proxy.ts`, metadata files, `next/font`), next-intl (routing, localised pathnames, `createNavigation`), Tailwind CSS 4, React Three Fiber and drei, Lenis, `@gsap/react`.

## Read first

1. `AGENTS.md`
2. `docs/decisions.md`, `docs/architecture.md`, `docs/quality.md`
3. `docs/art-direction.md`, then open `docs/prototype/assets/site.css` (the token values and type scale)
4. `docs/choreography.md` (motion system table and the Loader section), then `docs/prototype/assets/site.js` (`Loader`, `createScene`)
5. `brand/README.md`

## Goal

A wired, empty site that every later branch only adds to: the stack installed with strict settings, the folder architecture with enforced boundaries, design tokens and fonts matching the prototype, the brand integrated, i18n with localised routes, the motion and loader foundations as tested pure modules, quality gates running in CI, and three spikes that de-risk the shell and the home page.

## Scope

### 1. Scaffold and tooling

- Next.js 16, React 19, TypeScript, App Router, `src/`, `@/*` alias, pnpm (pin `packageManager`).
- `tsconfig`: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`, `noFallthroughCasesInSwitch`.
- ESLint flat config: Next, typescript-eslint strict, jsx-a11y, Prettier compatibility, the import boundaries from `docs/architecture.md` (parent-relative imports banned, `@/` everywhere), bans on the libraries `AGENTS.md` forbids, a ban on importing `gsap` packages outside `src/lib/gsap.ts`, a ban on raw `next/link` (use `@/i18n/navigation`), a ban on inline `<svg>` outside `src/components/brand/` and `src/components/sections/**/diagrams/`.
- Prettier (with the Tailwind plugin), `.editorconfig`, `.gitattributes` forcing LF, `.gitignore` (keeps `.env.example`), and Prettier ignores for `docs/` and `brand/`.
- The folder skeleton from `docs/architecture.md`. Empty folders hold a `.gitkeep` only where needed.
- Scripts exactly as listed in `docs/quality.md`.

### 2. Tokens, styles and fonts

- `src/styles/tokens.css`: every token from `docs/art-direction.md` on `:root`, plus the motion custom properties (`--ease-warm`, durations), the gutter and the header height. It is the only file with colour values besides `globals.css`.
- `src/styles/globals.css`: Tailwind 4 import, `@theme inline` mapping the tokens to utilities (clear Tailwind's default palette, radii, shadows and easings so only tokens exist), base styles from the prototype (`body`, focus ring, `[hidden]`, `.sr`, Lenis classes), the tone classes (`[data-tone="day"|"night"|"sheet"]`), and the type utilities (`display`, `h-xl`, `h-lg`, `h-md`, `h-sm`, `statement`, `lead`) with the prototype's exact clamp values.
- `src/lib/fonts.ts`: Bricolage Grotesque (variable, `opsz` and `wdth` axes, weights 500 to 800) and Instrument Sans (variable, `wdth`, 400 to 700), Latin subset, `display: swap`, CSS variables `--display` and `--text`. If `next/font` cannot expose an axis, report it and what you did.
- `scripts/check-tokens.mjs` per `docs/quality.md`, with a unit test of its rules.

### 3. Brand integration

Place the brand kit exactly as the table "Brand assets: where each file goes" in `docs/architecture.md` says:

- `src/app/favicon.ico`, `src/app/icon.svg`, `src/app/apple-icon.png`, `src/app/manifest.ts` (name, short name, `theme_color` and `background_color` paper, icons from `public/brand/`).
- `public/brand/`: the lockups, mark and wordmark SVGs and the three PNG app icons.
- `src/app/[locale]/opengraph-image.png` (with `opengraph-image.alt.txt` in each locale's wording if supported; otherwise one alt text and say so).
- `scripts/build-brand-paths.mjs`: reads `brand/wordmark-animated.svg` and writes `src/components/brand/wordmark-paths.ts` (viewBox and one path per letter, rounded to 2 decimals). Commit the generated file; CI fails if it is stale.
- `src/components/brand/Mark.tsx` (static mark, colours from tokens, `title` optional, decorative by default) and `Wordmark.tsx` (inline SVG from the generated paths, `currentColor` fill, `data-letter` index on each path for animation, accessible name "Abdelhadev" unless decorative).

### 4. i18n and routes

- next-intl with `fr` (default) and `en`, `localePrefix: "always"`, the localised pathnames table from `docs/architecture.md`, `src/i18n/navigation.ts` exports (`Link`, `redirect`, `usePathname`, `useRouter`, `getPathname`).
- `src/proxy.ts`: `/` redirects by cookie, then `Accept-Language`, then `fr`.
- `messages/fr.json` and `messages/en.json` with only the keys this branch uses, plus `scripts/check-i18n.mjs` per `docs/quality.md`.
- Placeholder pages for every route in the table (one heading and a sentence each, from messages), so routing, sitemap and the responsive gate have real routes. They are replaced later.
- The locale switch is a plain full-page link (decision T2).

### 5. Root layout

- `src/app/[locale]/layout.tsx`: `<html lang>` with the font variables, `generateStaticParams` for the locales, metadata base and title template from `lib/seo.ts`, the boot script copied from the prototype (`docs/prototype/index.html`, the first `<script>`: sets `js`, `motion`, `arriving`, and the 7 s fail-safe), a skip link, `<main id="main">`, and a minimal server-rendered footer with `© {year} Abdelhadi Bouchadi` and a link to the legal route (01 replaces it with the real footer).
- No header, loader UI, cursor or smooth scroll yet (01).
- A temporary lab page at `/[locale]/lab` showing the tokens as swatches on day and night, the type scale, the Mark and Wordmark at several sizes, and a static button in both tones. It returns `notFound()` when `VERCEL_ENV` is `production`, is `noindex`, is excluded from the sitemap, and is removed in 03.

### 6. Library modules (pure, unit-tested)

- `src/lib/gsap.ts`: registers ScrollTrigger, SplitText, CustomEase, DrawSVGPlugin and `useGSAP` once (browser only), creates the `warm` ease, sets `gsap.defaults({ ease: "warm", duration: 0.6 })`, `ScrollTrigger.config({ ignoreMobileResize: true })`, and re-exports them.
- `src/lib/motion.ts`: `EASE`, `DURATION`, `SCRUB` (0.8), `STAGGER`, `LENIS` (`lerp: 0.1`), `CURSOR` (0.16), `MAGNETIC` (0.22, 0.3), `LOADER` (`floorFirstMs: 1600`, `floorRouteMs: 700`, `ceilingMs: 4500`, weights for fonts 3, load 2, image 1, scene 3). A unit test asserts these mirror the CSS custom properties in `tokens.css` where both exist.
- `src/lib/lenis.ts`: a factory returning a Lenis instance driven by `gsap.ticker` (`autoRaf: false`, `lagSmoothing(0)`, `ScrollTrigger.update` on scroll) and a teardown function. Not mounted yet.
- `src/lib/loader.ts`: the task registry as a framework-free module: `track(weight, promise)`, `progress` subscription, `whenReady`, floor and ceiling from `LOADER`, `markVisited` / `isFirstVisit` via guarded `sessionStorage`. Unit tests cover weights, ceiling, floor, rejected tasks, and reset for a route change.
- `src/lib/site.ts`: legal name, brand name, city, country, WhatsApp number, public email, LinkedIn and GitHub URLs, `INDEXABLE = false`. Unknown values are `[TODO: …]` (the owner fills them; never invent). `todoReport()` lists them; the build prints them and fails when `REQUIRE_CONTENT=1`.
- `src/lib/env.ts`: zod parsing with a `server-only` guard; Resend variables optional until 07.
- `src/lib/seo.ts`: metadata base, alternates helper, robots that follow `INDEXABLE`.
- `src/lib/content/schema.ts` and `projects.ts`: the zod schema from `docs/architecture.md` ("Data shapes") and the five projects with only the facts in `docs/content.md`; everything else `[TODO: …]`.
- `src/lib/utils.ts`: `cn()`.

### 7. Quality and CI

- Vitest config and the unit tests above.
- Playwright config with projects at 360, 390, 430 and 1440 px and the suites listed in `docs/quality.md` that apply to what exists now (responsive, accessibility, no JavaScript, reduced motion, legal). The loader and motion-evidence suites are added in 01.
- Lighthouse CI: **measure, don't gate**. Run against `/fr`, `/en`, `/fr/projets`, `/fr/mentions-legales` (mobile profile, 3 runs) and assert only accessibility 100, CLS at most 0.02, and the individual SEO audits except `is-crawlable`. Write the measured medians (LCP, TBT, JavaScript transfer per route) to `docs/baseline.md` so the owner can set budgets.
- `.github/workflows/ci.yml`: two jobs, `check-build-e2e` (frozen install, secret scan, the commands in order, the `wordmark-paths.ts` freshness check) and `lighthouse`.
- `next.config.ts`: next-intl plugin, security headers (content type options, referrer policy, permissions policy, frame ancestors), no experimental flags beyond what next-intl requires. `cacheComponents` stays off (decision T11).
- `.env.example` (names only) and `README.md` (what the project is, how to run it, the branch workflow, a pointer to `AGENTS.md`).

### 8. Spikes (throwaway code under `/[locale]/lab/…`, removed before you finish; reports stay)

- **S1, React Three Fiber.** Install `three`, `@react-three/fiber`, `@react-three/drei`. Port a minimal version of the prototype's `createScene` (two slabs with a canvas texture, one capsule, the lights) as a client component loaded with `next/dynamic` (`ssr: false`). Measure: the lazy chunk size (gzip), time to first frame on the mobile profile, behaviour without WebGL (render the poster fallback) and under reduced motion (one still frame). Recommend whether R3F holds for 03 or whether plain three.js is leaner. `docs/spikes/r3f.md`.
- **S2, route curtain.** Two lab routes. A `TransitionLink` built on next-intl's `Link` and router: on click it plays a curtain (panel from the bottom, 0.8 s, `warm`), then `router.push`; the arriving route detects the pending transition, runs a short version of the loader (registry from `lib/loader.ts`, 700 ms floor) and lifts the curtain. Verify: Back and Forward, scroll position on arrival (top, unless a hash), focus on the new `h1`, no flash of the new page before the curtain, StrictMode double effects, and that `ScrollTrigger` instances from the old page are cleaned up. Recommend the final design for 01. `docs/spikes/route-curtain.md`.
- **S3, loader and LCP.** A lab route with the prototype's loader overlay covering a text hero. Measure with Lighthouse whether the covered hero text counts as LCP and what LCP is on a first visit with the loader versus without. Recommend how 01 keeps LCP honest (for example, painting the real hero under the overlay). `docs/spikes/loader-lcp.md`.

## Decisions already made (do not re-decide)

All of `docs/decisions.md`. In particular: pnpm; `fr` default with localised pathnames; no theme toggle; Bricolage Grotesque and Instrument Sans; tokens exactly as listed; the `warm` ease; loader floors and ceiling; no `cacheComponents`; `proxy.ts`; no budgets enforced before the owner sets them from `docs/baseline.md`.

## Out of scope

Header, mobile nav, the real footer, loader UI in production routes, cursor, smooth scroll mounting, primitives, any page section, copy beyond placeholders, the contact action, analytics, Arabic.

## Acceptance

1. Every command in `ci.yml` passes locally, in order. Paste the last lines of each.
2. The lab page shows the tokens, type scale, Mark and Wordmark matching the prototype (screenshots at 1440 and 390 in `test-results/foundation/`).
3. A colour literal in a component and a `gsap` import outside `lib/gsap.ts` each make the checks fail (show both, then revert).
4. `/` redirects to `/fr` or `/en`; every localised route renders; the sitemap lists them with alternates; robots says `noindex` while `INDEXABLE` is false.
5. With JavaScript disabled every route shows its content and the footer legal name.
6. The favicon, Apple icon and manifest are served (show the HTML `<head>` of `/fr`).
7. `wordmark-paths.ts` regenerates with no diff.
8. `docs/baseline.md` and the three spike reports exist, each spike with a recommendation.
9. `git grep -n "\[TODO" -- src messages` lists only values the owner must supply (show the list).

## Reply format

As in `AGENTS.md`, plus **Spike results** (one paragraph each with the recommendation) and **Versions** (next, react, typescript, tailwindcss, next-intl, gsap, @gsap/react, lenis, three, @react-three/fiber, @react-three/drei, playwright).
