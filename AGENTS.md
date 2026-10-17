# AGENTS.md — abdelhadev.me

Rules for every agent run in this repository. Read this file first, every run. Facts and specs live in `docs/`; this file holds the rules.

## The project

The portfolio of Abdelhadi Bouchadi, a full-stack developer based in Agadir, Morocco (brand: **Abdelhadev**). It has two jobs: win freelance clients and serve as a professional profile for LinkedIn, job portals and recruiters. It must feel like an award-level, scroll-driven experience that is warm and reassuring, and it must prove senior engineering: fast, accessible, secure, cleanly built.

French is the default language, English the second. Arabic comes later.

## How work runs

- One prompt per build in `prompts/NN-name.md`, one branch per prompt (`feat/NN-name`). The owner reviews, runs CodeRabbit and merges. You never merge and never push to `main`.
- Read the prompt's read-first list before writing code.
- Decisions in `docs/decisions.md` or in a prompt are made. Do not re-decide them. If the repo or a prompt contradicts a decision, stop and report it.
- Do not expand scope. List anything you notice outside the scope in your reply.
- Before replying, run exactly the commands in `.github/workflows/ci.yml`, in order. Never report a gate as passing that you did not run.
- Say plainly what you did not verify.
- You never run git add, commit or push; the owner commits. Propose a commit split in your reply.

## Where the design comes from

The approved design is an interactive prototype in `docs/prototype/` (open `index.html`, `work.html`, `dentaflow.html`, `about.html`, `contact.html`). Its values (colours, type, sizes, easings, durations, scroll distances, sequences) are the spec. `docs/art-direction.md` and `docs/choreography.md` describe them in words.

- You **port** the prototype to the stack. You do not redesign it, simplify it or replace its motion with something generic.
- Where the prototype and a doc disagree on a visual, the prototype wins. On a rule (accessibility, security, legal, content), the doc wins.
- The prototype's copy is placeholder. Real copy lives in `messages/fr.json` and `messages/en.json` and follows `docs/content.md`.
- Never import or link files from `docs/prototype/` at runtime.

## Skills

Before visual UI work, invoke the `frontend-design` skill. Before animation code, invoke the GSAP skills that apply (core, timeline, ScrollTrigger, plugins, React, performance). Your reply lists each skill used and one decision it changed. A skill never overrides this file, the docs or a prompt.

Look up current APIs through Context7 before using Next.js 16, next-intl, Tailwind 4, three.js, GSAP or Lenis. Do not write from memory.

## Stack (fixed)

Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4, next-intl, GSAP with `@gsap/react` (ScrollTrigger, SplitText, CustomEase, DrawSVGPlugin), Lenis, three.js (plain `three`, no React Three Fiber or drei; one home scene, always lazy-loaded), lucide-react (UI icons), zod, Resend, pnpm, Vitest, Playwright with axe, Lighthouse CI, ESLint flat config with Prettier. Hosting on Vercel. No database, no CMS.

Not allowed: framer-motion or `motion`, Locomotive, Spline runtime, Lottie, a second animation, icon or UI kit, CSS-in-JS, jQuery, `any`. Adding any other runtime dependency needs the owner's approval in the prompt.

## Architecture (details in `docs/architecture.md`)

```
src/
  app/[locale]/        routes only: layouts, pages, metadata, loading and error files
  app/                 favicon.ico, icon.svg, apple-icon.png, manifest.ts, robots.ts, sitemap.ts
  actions/             server actions (contact)
  components/
    brand/             Mark, Wordmark, generated SVG path data
    layout/            Header, MobileNav, Footer, Loader, Cursor, Sky
    sections/          page sections grouped by page: home/, work/, case/, about/, contact/
    three/             the three.js home scene (lazy, client only)
    ui/                Button, Chip, Field and other static building blocks
  primitives/          reusable GSAP-animated components
  hooks/               shared hooks
  lib/                 config and pure logic: gsap.ts, lenis.ts, motion.ts, fonts.ts, site.ts, seo.ts, env.ts, loader.ts, utils.ts, content/
  i18n/                next-intl routing, request config, navigation
  styles/              globals.css, tokens.css
messages/              fr.json, en.json
public/                brand/ and media/
brand/                 logo source kit and generator (not shipped)
```

Imports go one way: `app` → `components/sections` → `components/layout`, `components/ui`, `components/brand`, `primitives`, `three` → `hooks`, `lib`, `i18n`. Never upward, never sideways between page section folders. `lib` may import `@/i18n/routing` and nothing else from the app.

## TypeScript and React

- `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`. No `any`. No `as` casts or non-null `!` without a comment explaining why they are safe.
- Server Components by default. `"use client"` only on the smallest leaf that needs state, effects, GSAP, Lenis or WebGL.
- Named exports; default exports only where Next requires them. No barrel files. Exported props are named interfaces.
- Validate every external input with zod (env, form data, route params).

## Design tokens

- Colour values exist only in `src/styles/tokens.css` (the tokens listed in `docs/art-direction.md`) and `src/styles/globals.css`. Everywhere else uses tokens. `pnpm check:tokens` enforces it.
- Easing and duration values exist only in `src/lib/motion.ts` and the matching CSS custom properties. No string literals for easings or durations in components.
- Fonts: Bricolage Grotesque (display, variable with `opsz`, `wdth`, `wght`) and Instrument Sans (text). Loaded with `next/font`, no layout shift.
- Tones are art-directed: day sections (paper) and night sections (ink-brown). There is no theme toggle. The header, mobile nav and cursor follow the tone of the section under them.

## Motion rules (details in `docs/choreography.md`)

- GSAP is the only animation engine. Plugins are registered once in `src/lib/gsap.ts`. The house ease `warm` (CustomEase `0.625, 0.05, 0, 1`) is defined there.
- Before writing GSAP in a section, check `docs/primitives.md`; compose a primitive when one fits.
- Every animation: `useGSAP` with a scope, inside `gsap.matchMedia()` with a reduced-motion branch, cleaned up on unmount. Never kill all ScrollTriggers.
- Scroll storytelling is scrubbed (`scrub: 0.8`) inside sticky stages. Time-based animation is for intros, hovers, menus, the loader and route transitions.
- Never put Tailwind transform utilities (translate, scale, rotate) on an element GSAP animates; wrap it or use a child.
- Prefer `transform` and `opacity`. `clip-path` is allowed for media reveals. Never animate layout properties.
- Content is never hidden without JavaScript: hidden start states are CSS under `html.motion` (set before first paint) and the page is complete when JavaScript or the animation library is missing.
- Reduced motion: no smooth scroll, no scrubs, no 3D movement; everything visible and still.
- Lenis runs from `gsap.ticker` and is stopped while the loader or a curtain is on screen.

## Content, identity and legal (details in `docs/content.md`)

- No user-facing string in a component: copy lives in `messages/*.json`, structured data in `src/lib/content/`. Both locales always have the same keys (`pnpm check:i18n`).
- Voice: first person singular, plain and specific. No emoji, no exclamation marks, no buzzwords, no em dashes in copy.
- Never invent facts, metrics, clients, testimonials, dates or years of experience. Unknown values stay as visible `[TODO: …]` placeholders; the build warns about each one and fails when `REQUIRE_CONTENT=1` (set on the production deployment from the launch branch).
- No prices anywhere. The quote comes after scoping and data modelling.
- The legal name `Abdelhadi Bouchadi` appears as plain, server-rendered text in the footer of every page and on the legal notice page. Never in an image, an SVG or a client-only component.
- Never publish ID, registration or ICE numbers, a street address or bank details.
- Never mention the internship project or its client, anywhere (copy, metadata, comments, commits).
- Identity, contact channels and URLs come from `src/lib/site.ts` only.

## Security and privacy

- No secrets in the repo; `.env.example` lists names only. Env is parsed once with zod in `src/lib/env.ts`, and server-only values never reach client modules.
- The contact action validates with the same zod schema as the form, has a honeypot, rate limiting and translated errors, and never logs personal data.
- Analytics, when added, are cookie-free. No script that needs a consent banner.

## Quality gates (details in `docs/quality.md`)

A branch is ready only when the CI commands pass and the reply shows them: typecheck, lint, format, `check:tokens`, `check:i18n`, unit tests, build, Playwright (responsive at 360, 390 and 430 px with no horizontal scroll, axe with no serious or critical issue, no-JavaScript, reduced motion, legal name) and Lighthouse budgets. If a budget fails, report the measurement and cause; never loosen a budget yourself.

Every UI branch also saves screenshots and short Playwright videos of its motion to `test-results/` and lists them, so the owner can compare them with the prototype.

## Reply format

1. **Summary**
2. **Files** created, changed, deleted
3. **Verification**: each CI command in order with its result
4. **Skills used**: name and one decision each changed
5. **Prototype fidelity**: what matches, what differs and why
6. **Decisions followed / deviations**
7. **Open questions and risks**
8. **Not verified**
