# Spike S2: GSAP curtain route transitions

Branch `feat/00-foundation`, 2026-10-17. Throwaway code under `/[locale]/lab/curtain/a` and `/[locale]/lab/curtain/b`, removed before the branch was finished.

## Question

Can a GSAP curtain (decision T8, provisional) drive App Router navigations with next-intl: cover, navigate, arrive with the short loader, lift? Verify Back and Forward, scroll position, focus, no flash of the new page, StrictMode double effects, and ScrollTrigger cleanup.

## What was built

- **`TransitionProvider`** (client), mounted in a layout shared by both routes, as it will be in `[locale]/layout.tsx`. It owns the curtain (a night panel with the mark, the sun clipped at the horizon) and a small state machine: `idle`, `leaving`, `covered`, `arriving`.
  - **Leave**: the panel rises from the bottom with a curved top edge (`yPercent 100 → 0`, top radius `50% 14vh → 50% 0vh`, 0.8 s, `warm`) while the sun sets (`y 0 → 19`, 0.7 s, `power2.in`, at 0.2 s). Then `router.push(url, { scroll: false })`.
  - **Arrive**: a `useLayoutEffect` keyed on the pathname. If the navigation did not come through `leave()` (Back, Forward), it sets the curtain over the viewport before the browser paints. Then the short loader from `lib/loader.ts` runs (`reset("route")`, 700 ms floor; fonts and the new page's images tracked), the page scrolls to the top or to the hash, `ScrollTrigger.refresh()`, focus moves to `main h1` (`preventScroll`), and the panel lifts (`yPercent 0 → -100`, bottom radius `50% 14vh`, 1.15 s, `warm`).
  - **Reduced motion**: the curtain is set without animation and fades out in 0.25 s.
- **`TransitionLink`**: next-intl's `Link` with an `onClick` that ignores modified clicks, middle clicks and `target="_blank"`, prevents the default and calls `leave()`. Without JavaScript it is a plain link.
- Each route renders a `TriggerProbe`: a scoped `useGSAP` with `gsap.matchMedia()` creating one scrubbed ScrollTrigger (and a plain one under reduced motion).

## Verification

Playwright, Chromium, 1440 x 900. A `requestAnimationFrame` sampler records, every frame, whether the arriving page is in the DOM and whether the curtain covers the whole viewport; "no flash" means the first frame with the new page already has the curtain over it.

| Check | Production build | `next dev` (StrictMode) |
| --- | --- | --- |
| Link A → B, from 1200 px down | covered on first frame, scroll 0, focus "S2 page B", 1 trigger | same |
| Back B → A (popstate) | covered on first frame, scroll 0, focus h1, 1 trigger | same |
| Forward A → B | covered on first frame, scroll 0, focus h1, 1 trigger | same |
| Link B → A with hash `#part` | lands with `#part` at the top (offset 0 px) | same |
| Arrivals for 4 navigations | 4 | **4** (StrictMode's double effects are no-ops) |
| Reduced motion A → B | covered on first frame, 0.65 s total | not run |
| Page errors, console errors, hydration warnings | none | none |

Timings: link navigation 2.8 s from click to idle (0.8 s cover, the 700 ms floor, 1.15 s lift, plus navigation); Back and Forward 1.9 s (no cover animation). A video of a link navigation and a Back navigation was saved to `test-results/spikes/s2-video/` (not committed).

## Findings that shape 01

1. **Tailwind 4 transforms and GSAP do not mix on the same element.** Tailwind 4's `translate-*`, `scale-*` and `rotate-*` utilities set the CSS `translate`, `scale` and `rotate` properties, not `transform`. GSAP read `translate-y-full` into its own `y` (904 px) and kept it while animating `yPercent`, so the curtain never covered the screen: the first run of the flash test failed on exactly this. Rule for 01: **an element GSAP animates gets its start state from GSAP (or from CSS under `html.motion`), never from a Tailwind transform utility.** Worth an ESLint or review rule.
2. **`router.push` takes a narrower href than `Link`.** next-intl's `Link` accepts a full `UrlObject` (with `hash`); the typed `router.push` accepts only `{ pathname, params, query }`. `TransitionLink` therefore takes `href` with the router's type plus a separate `hash` prop, and the provider resolves the final URL with `getPathname({ locale, href })` and pushes the string with Next's router. Without JavaScript, the `Link` renders the same URL with the hash.
3. **Key the arrival on the pathname value, not on "first run".** Comparing against the previous pathname in a ref makes the layout effect idempotent under StrictMode's double invocation. A "skip the first run" flag would fire a false arrival in development.
4. **`useLayoutEffect` is what prevents the flash on Back and Forward.** The new route and the provider's pathname commit together, so a layout effect can put the curtain up before the first paint of the new page.
5. **React Compiler lint rejects `contextSafe` wrappers created during render.** `eslint-plugin-react-hooks` 7 (`react-hooks/refs`) flags `const leave = contextSafe(() => ...)` because the wrapped functions read refs and are created at render time. 01 should create the handlers inside the `useGSAP` callback (where `contextSafe` is passed as the second argument) and store them in a ref, or wrap at call time inside event handlers.
6. **The curtain's mark must come from `components/brand`.** The spike drew the animated mark inline, which the inline-SVG rule rejects outside `components/brand/`. 01 needs an animated mark component there (sun disc clipped at the horizon, horizon and reflection with ids or data attributes for GSAP), shared by the loader and the curtain.
7. `scroll: false` is required on push; otherwise Next scrolls the old page before the curtain is up.

## Recommendation

**Keep decision T8.** The curtain works with the App Router and next-intl, including Back and Forward, without a flash, with correct focus and scroll, and it survives StrictMode. Final design for 01:

- `primitives/TransitionProvider.tsx` in `[locale]/layout.tsx`, wrapping the page and rendering the curtain from a shared `components/brand` animated mark. It shares one loader registry with the `Loader` (the first-visit loader and the route loader are the same registry with `reset("first" | "route")`).
- `primitives/TransitionLink.tsx`: next-intl `Link` + `onClick` → `leave(href, hash)`; same-page hash links scroll instead (prototype behaviour).
- Arrival in a `useLayoutEffect` keyed on pathname: cover if needed, `reset("route")`, wait, scroll top or hash, `ScrollTrigger.refresh()`, focus `main h1`, lift. Lenis stops in `leave()` and in the cover path and starts after the lift.
- Leave and arrival handlers created inside `useGSAP` (finding 5). No Tailwind transform utilities on animated elements (finding 1).
- The full-page locale switch stays a plain `<a>` (decision T2), outside this system.
