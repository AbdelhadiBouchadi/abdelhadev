# 01-shell

Branch: `feat/01-shell`

## Git rules for this run (they override AGENTS.md)

The owner reviews the diff and commits by hand. You do **not** run `git add`, `git commit`, `git push`, `git stash`, `git checkout`, `git reset` or anything that changes branches or history. Leave every change in the working tree. At the end, give `git status --short` and a proposed commit split (Conventional Commit message plus the files for each commit) so the owner can commit in logical pieces. Step 0 removes the commit instruction from `AGENTS.md`.

## Before you start (the owner has done this)

`feat/00-foundation` is merged into `main`, and you are on a new branch `feat/01-shell` with a clean tree. Check `git status` and `git branch --show-current`. If the tree is not clean or the branch is not `feat/01-shell`, stop and say so. Read `docs/baseline.md` and the three reports in `docs/spikes/` (`r3f.md`, `route-curtain.md`, `loader-lcp.md`) before anything else.

## Skills and docs

Run `/skills`. Invoke `frontend-design` before any visual work and these GSAP skills before animation code: `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-react`, `gsap-performance`, `gsap-frameworks`. Look up current APIs through Context7 (Next.js 16, next-intl, Tailwind 4, `@gsap/react`, Lenis). If Context7 is not connected, say so in your reply and use the official documentation.

## Read first

1. `AGENTS.md`, `docs/decisions.md`, `docs/architecture.md`, `docs/quality.md`
2. `docs/choreography.md` (Motion system, Loader, Shell) and `docs/art-direction.md`
3. `docs/spikes/route-curtain.md` and `docs/spikes/loader-lcp.md`. Where a spike recommendation differs from `docs/architecture.md`, the spike wins and Step 0 records it.
4. The prototype, as the visual spec: `docs/prototype/index.html` (loader markup, header, mobile pill, cursor, footer), `docs/prototype/assets/site.css` (rules for `.loader*`, `.site-header`, `.brand`, `.nav-pill`, `.header-end`, `.clock-chip`, `.btn*`, `.pill*`, `.cursor`, `.site-footer`, `.foot-*`, `.footer-word*`) and `docs/prototype/assets/site.js` (`Loader`, the navigation click handler, `initTone`, `initCursor` including the magnetic buttons, `footerWord`, `fit`, the clock, the Lenis block).
5. `docs/content.md` (Legal) and the current `src/` from 00.

## Goal

The persistent shell around every page, ported from the prototype and working end to end: the loader on every page visit, the sunset curtain between routes, smooth scroll, the header with hide-on-scroll and tone switching, the mobile pill, the cursor, magnetic buttons, the real footer, and the real legal notice page. After this branch every route already feels like the finished site; later branches only fill the pages.

## Step 0. Housekeeping (docs and dependencies, before any feature code)

1. Decision **T6** becomes: plain `three` (no React Three Fiber, no drei), one scene on the home page, dynamic import, client only, poster fallback without WebGL and under reduced motion, chunk download started early. Status Fixed, reason: spike S1 (`docs/spikes/r3f.md`). Run `pnpm remove @react-three/fiber @react-three/drei`; keep `three` (and its types if used). Update the Stack line in `AGENTS.md`, `docs/architecture.md` (`components/three/`) and any mention in `docs/`.
2. Decision **T7** gains: the real page content (hero included) is painted under the loader overlay and the overlay is `inert`-covered, never hidden-until-ready, because text painted under the overlay counts as LCP and hiding it did not (spike S3). LCP is checked by an in-browser `PerformanceObserver` measurement in Playwright as well as Lighthouse. Decision **T8** is confirmed Fixed, with the S2 design.
3. Import boundary: `lib` may import `@/i18n/routing` and nothing else from the app. Change the table in `docs/architecture.md`, the sentence in `AGENTS.md` and the ESLint boundary block so all three say the same.
4. `AGENTS.md`: delete "Conventional Commits, small and focused, with the attribution lines the harness provides." and put in its place "You never run git add, commit or push; the owner commits. Propose a commit split in your reply." Add to Motion rules: "Never put Tailwind transform utilities (translate, scale, rotate) on an element GSAP animates; wrap it or use a child."
5. Add to `docs/content.md` under Projects: "A project is shown by name on a public page only after the owner confirms permission (Côte Royale first). Until then it is hidden from lists and the sitemap." Implement nothing for it in this branch.

## Scope

### A. Foundations the shell needs

- `hooks/`: `useReducedMotion`, `useMediaQuery`, `useIsomorphicLayoutEffect`, `useLoaderReady` (runs a callback once when the loader signals ready, safe under StrictMode), `useLoaderTask(weight, promiseFactory)` (registers a task in `lib/loader.ts` for the current page).
- `lib/loader.ts` and `lib/boot.ts`: extend only if the spike recommends it; keep them framework-free and tested.
- `primitives/SmoothScroll.tsx`: mounts Lenis through `lib/lenis.ts`, stopped until the loader is ready and while a curtain is on screen, started on ready, not created under reduced motion, `history.scrollRestoration = "manual"`. Exposes `useSmoothScroll()` with `scrollTo(target | 0, { immediate })` using the prototype's 1.6 s ease-out-quart; without Lenis it falls back to native scrolling.
- `primitives/TransitionProvider.tsx` and `primitives/TransitionLink.tsx`: the S2 design. Built on `@/i18n/navigation`, never raw `next/link`. Typed `href` plus a separate `hash` prop (router.push cannot carry a hash). Modified clicks (cmd, ctrl, shift, alt, middle button), `target="_blank"`, external, `mailto:` and `tel:` links are left alone. A link to the current page with a hash scrolls through Lenis without a curtain. Clicks during a curtain are ignored. Back and Forward follow the spike's short path. After arrival: scroll to top (or to the hash), focus moves to the new `h1` (`tabindex="-1"`), the old page's ScrollTriggers are killed by their own scopes (never `ScrollTrigger.killAll()`), then `ScrollTrigger.refresh()`.
- `primitives/Magnetic.tsx`: pointer-pull on a wrapper per the Motion table (22 % / 30 %, `quickTo` 0.6 s, `warm`). Fine pointers only, off under reduced motion, reset on leave.
- `primitives/ToneSection.tsx`: a section wrapper that declares `day`, `night` or `sheet` (and an optional `start`), renders `data-tone` for its own styling and, as a ScrollTrigger, sets the tone of the elements marked `data-shell` (header, mobile pill, cursor) with a 0.6 s colour transition, exactly like `initTone`. Server-rendered markup; the client part is a leaf.
- `primitives/FitText.tsx`: the `fit()` behaviour (font size so the word fills its column, re-fit on fonts ready and on resize) as a client leaf; the text itself is server-rendered.
- Add the missing primitives to the lint boundary only as `docs/architecture.md` already lists them. The other primitives (SplitReveal, WordsLight, MaskReveal, StickyStage, LineDraw) belong to 02. Do not build them.
- Icons come from `lucide-react` (add it if used). No hand-drawn SVG outside `components/brand/`.

### B. Brand animation parts

`components/brand/AnimatedMark.tsx` (it must live here: the S2 report says so): the loader mark with refs or classes for sun disc, horizon and reflection, same geometry as the prototype loader `viewBox 0 0 64 64`, colours from tokens. Reuse `Wordmark` for the loader letters (`data-letter`). Static `Mark` stays as is.

### C. Loader (`components/layout/Loader.tsx`)

Port `Loader` from `site.js` with every number from `docs/choreography.md` ("Loader"), driven by `lib/motion.ts` constants and `lib/loader.ts`:

- Rendered on the server inside the locale layout, present at first paint under `html.js`, absent without JavaScript. The blocking boot script from 00 still sets `js`, `motion` and `arriving`; keep its 7 s fail-safe.
- Tasks registered by the layout: fonts (weight 3), window `load` (2), every `img[data-critical]` decoded (1 each). The home scene registers itself in 03.
- Progress is real (settled weight over total, never backwards). Counter `000`, bottom bar, sun rising, one letter per tenth of progress. First visit of the session: horizon and reflection draw from the centre, floor 1600 ms. Route change or `arriving`: floor 700 ms, and no draw-in. Ceiling 4500 ms.
- Exit as in the prototype: letters lift, mark lifts, meta fades, the panel slides up with its bottom edge curving, the page intro starts 0.55 s into the exit (that is when `useLoaderReady` fires and `html.ready` is set).
- The real page content is already in the DOM and painted under the overlay (spike S3). While the loader or a curtain is on screen, the header, `main`, footer and mobile pill are `inert`; the loader has `role="status"` text that announces "Loading, 50 percent" and "100 percent" through messages (both locales). `inert` is removed on exit and never left behind on error or on bfcache restore (`pageshow` with `persisted`).
- Reduced motion: no drawing, no rise; a 250 ms fade when ready. The content is never hidden for longer than the ceiling.

### D. Header and mobile pill (`components/layout/Header.tsx`, `MobileNav.tsx`)

- Desktop per decision D8 and the prototype: brand (mark and "Abdelhadev") left, pill nav in the centre (Home, Work, About) with the active link marked by `aria-current="page"` from the localised pathname, the Agadir clock chip and the Contact button right. The clock formats `Africa/Casablanca` time on the client after mount (no hydration mismatch) and updates every 30 s.
- Mobile per D8: brand and Contact button on top; the floating pill at the bottom (Work, the home mark, About) with safe-area inset, tap targets of at least 44 px, hidden/shown exactly like the prototype.
- Every link is a `TransitionLink`. The Contact button is the shared `Button` (sun dot, hover sweep) with `data-cursor` label from messages (FR "Écrivez-moi", EN "Write to me").
- Behaviour: hides on scroll down past 240 px and returns on any upward scroll, never while focus is inside it; tone switching via `data-shell`; `html.motion` only for hidden/animated states.
- Locale switch: small text control "FR / EN" in the desktop header between the clock and Contact, and in the footer (all sizes). It stays a plain full-page link (T2) to the same page in the other locale. This placement is not in the prototype; list it under deviations.

### E. Cursor (`components/layout/Cursor.tsx`)

Port `initCursor`: fine pointer only, off under reduced motion, lerp 0.16 per frame frame-rate independent via `gsap.ticker`, label from `data-cursor` on the hovered element using event delegation (works for elements mounted later), tone-aware through `data-shell`, hidden when the pointer leaves the window. `aria-hidden`.

### F. Footer (`components/layout/Footer.tsx`, replaces the 00 footer)

Night tone, from the prototype: CTA heading ("Un projet en tête ?" / "Have a project in mind?") revealed by lines on enter, large Contact button (`btn-xl`, `Magnetic`), a secondary "See the work" link; columns: Pages (Home, Work, About, Contact, Legal notice), Elsewhere (LinkedIn and GitHub from `lib/site.ts`; a value that is still a `[TODO …]` renders as the visible placeholder text in development and the build reports it; never an empty link), Agadir, Morocco with the live local time, and Legal. The giant wordmark (`FitText`) rises from `yPercent 60` to `14` as the footer scrolls in. Copy is short and makes no availability or client claims (decision P6, `docs/content.md`).

Rules that must keep holding: `© {year} Abdelhadi Bouchadi, auto-entrepreneur` and the legal link are server-rendered plain text in the footer of every page. Add bottom padding on small screens so the mobile pill never covers footer content.

### G. Layout wiring (`app/[locale]/layout.tsx`)

Compose: boot script, Loader, skip link, Header, MobileNav, Cursor, `SmoothScroll` and `TransitionProvider` around `main`, Footer. Providers are client leaves; the layout stays a Server Component. The `lab` page gets tall `ToneSection` blocks (day, night, sheet) with a button and a `data-cursor` element so tone switching, hide-on-scroll and the cursor can be tested; it uses `useLoaderReady` for a simple intro fade. The lab is still removed in 03.

### H. Legal notice page (`/fr/mentions-legales`, `/en/legal-notice`)

Replace the placeholder with the real page, FR and EN, plain sentences, from `docs/content.md` (Legal): publisher (Abdelhadi Bouchadi, auto-entrepreneur, contact email from `site.ts`), publication director, host (Vercel Inc., details taken from Vercel's own published legal page: fetch it, cite the URL in your reply, and if you cannot fetch it leave `[TODO: …]`), intellectual property, personal data handled by the contact form (what is collected, why, the processor Resend; retention period is `[TODO: …]` for the owner, never invented), cookies and local storage (the only storage is the session flag that shortens the loader), external links, last updated. No ID, registration or ICE numbers, no street address. Add `legalReview: "pending"` to `lib/site.ts`; `todoReport()` lists it and `REQUIRE_CONTENT=1` fails the build while it is pending. Headings are real `h1`/`h2`; layout uses the existing type utilities.

### I. Styles

Components use Tailwind utilities mapped to tokens. Complex state-driven rules (loader panel, cursor, header states, pill) may live in `src/styles/shell.css`, imported from `globals.css`, written with tokens only. No colour literal, easing literal or duration literal outside `tokens.css`, `globals.css` and `lib/motion.ts` (`check:tokens` enforces it). Logical CSS properties (`inline`, `block`, `start`, `end`) throughout.

### J. Messages

Add the keys for nav, header, footer, loader, cursor labels, skip link and the legal page to `messages/fr.json` and `messages/en.json`, identical keys, no price words. French first, written natively; English written, not translated word for word. No emoji, exclamation marks or em dashes.

## Testing and evidence

- Unit tests for anything new in `lib/` and for pure helpers (tone mapping, hash and modifier-click detection, clock formatting).
- Existing Playwright suites must stay green and must not slow down: they wait for `html.ready` (never fixed timeouts) and use `addInitScript` to mark the session as visited (short loader) or run with reduced motion. No test-only switches in application code.
- New specs: **loader** (first visit uses the full sequence and the floor, route change uses the short one, it finishes before 4.5 s, it never covers content for more than 5 s, reduced motion fades, no JavaScript shows no loader, `inert` is gone afterwards, the hero text is in the DOM and painted under the overlay); **shell** (header hides and returns, never hides with focus inside, tone follows the section on the lab page, active link, locale switch keeps the page, mobile pill at 360/390/430, cursor label appears on a fine pointer); **transition** (click Work: curtain, then the new page, scroll top, focus on `h1`; Back and Forward; hash link on the same page does not show a curtain; modified click opens normally; double click does not double navigate; no flash of the new page before the curtain covers); **a11y** (axe on every route after the loader, skip link first in tab order, visible focus, `lang`, one `h1`); **LCP probe** (a `PerformanceObserver` records `largest-contentful-paint` on first visit and on a route change, throttled to the mobile profile if possible, and writes the numbers to `test-results/shell/lcp.json`; it asserts only that the value exists and is below the loader ceiling plus 1 s, because budgets are set by the owner).
- **Motion evidence**, as short Playwright videos and screenshots in `test-results/motion/`: first-visit loader to hero (desktop and 390), route curtain out and in, header hide and return, tone switch (day to night on the lab page), mobile pill, cursor label, magnetic button, footer reveal. List every file in your reply.
- Lighthouse CI keeps measuring and asserting only what 00 asserted (accessibility 100, CLS at most 0.02, individual SEO audits). Update `docs/baseline.md` with the new medians (LCP, TBT, JavaScript transfer per route) and the delta from the 00 baseline, including how much of the delta is GSAP and Lenis.

## Decisions already made (do not re-decide)

All of `docs/decisions.md` including Step 0's changes. Contact is the only primary call to action word (D9). The curtain is GSAP (T8), not the View Transitions API. No theme toggle. The prototype is the visual spec (D1).

## Out of scope

Page sections of any page, the other primitives (02), the home scene and `Sky` (03), the contact action and form (07), final copy (08), analytics, Arabic, new budgets. If you see something that belongs elsewhere, list it.

## Acceptance

1. Every command in `ci.yml` passes locally, in order. Paste the last lines of each.
2. First visit to `/fr` shows the full loader and exits into the page; clicking Work shows the curtain, the short loader and the new page with focus on its `h1`; Back and Forward work. Show the videos.
3. The header hides on scroll down, returns on scroll up, and its colours follow day and night sections on the lab page.
4. Without JavaScript every route shows content, header links, the footer with the legal name and no loader. With reduced motion nothing is hidden or smoothed.
5. `/fr/mentions-legales` and `/en/legal-notice` render the full notice; `legalReview` pending is reported by the build and fails it under `REQUIRE_CONTENT=1`.
6. Lint fails on raw `next/link`, on an inline `<svg>` outside `components/brand`, on a colour literal and on a `gsap` import outside `lib/gsap.ts` (show one, then revert).
7. `docs/baseline.md` updated; `test-results/shell/lcp.json` exists.
8. `git status --short` is shown and nothing was committed or pushed.

## Reply format

As in `AGENTS.md`, plus: **Measured** (loader durations first visit and route change, LCP from the probe, JavaScript delta), **Motion evidence** (file list), and **Proposed commits** (message plus files for each).