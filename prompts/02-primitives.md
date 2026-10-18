# 02-primitives

Branch: `feat/02-primitives`

## Git rules for this run (they override AGENTS.md)

The owner reviews the diff and commits by hand. You do **not** run `git add`, `git commit`, `git push`, `git stash`, `git checkout`, `git reset` or anything that changes branches or history. Leave every change in the working tree. At the end, give `git status --short` and a proposed commit split.

## Before you start (the owner has done this)

`feat/01-shell` and `feat/01b-shell-performance` are merged into `main`. You are on a new branch `feat/02-primitives` with a clean tree. Check `git status` and `git branch --show-current`; if either is wrong, stop and say so. Read the TBT section of `docs/baseline.md` and `docs/spikes/tbt.md`: every primitive you add must respect what 01b learned (no layout reads interleaved with writes during hydration, no work that can wait for `ready`).

## Skills and docs

Run `/skills`. Invoke `frontend-design`, then `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-react` and `gsap-performance`. Use Context7 for current `SplitText` (including `autoSplit`, `onSplit`, `mask`, `aria`), `ScrollTrigger`, `DrawSVGPlugin` and `@gsap/react` behaviour. Do not write them from memory.

## Read first

1. `AGENTS.md`, `docs/decisions.md`, `docs/architecture.md`, `docs/choreography.md` (Motion system and every page section)
2. The prototype as spec: `docs/prototype/assets/site.js` functions `linesUp`, `wordsLight`, `fadeUpOnEnter`, `revealMedia`, `footerWord`, and the `Pages.home`, `Pages.work`, `Pages.case`, `Pages.about` bodies (read how each beat uses them); `docs/prototype/assets/site.css` rules `.screen*`, `.ui-*`, `.sk*`, `.chip*`, `.link`
3. The existing primitives and hooks from 01 (`SmoothScroll`, `TransitionProvider`, `ToneSection`, `FitText`, `Magnetic`, `useLoaderReady`, `lib/shell.ts`) and `src/components/layout/FooterMotion.tsx`

## Goal

The reusable motion and UI building blocks that the four page branches compose, built once, tested once, documented once. After this branch a section is written by composing primitives; it writes its own GSAP only for a choreography that exists on one page only. No page section is built here.

## Scope

### A. Primitives (`src/primitives/`)

Each is a Server-Component-friendly wrapper where possible (server-rendered markup, content present without JavaScript) with the smallest client leaf doing the GSAP. All use `useGSAP` with a scope, `gsap.matchMedia` with a reduced-motion branch, clean up on unmount, never `ScrollTrigger.killAll()`, and take numbers from `lib/motion.ts`. All must be safe under StrictMode and survive the route curtain (old page's triggers die with their scope).

1. **`SplitReveal`**: masked text reveal, the prototype's `linesUp` and the character version used by the hero and case-study words.
   - `type: "lines" | "chars"`; `when: "ready" | "enter" | "scrub"`.
   - `ready` waits for the loader (`useLoaderReady`) and accepts `delay`; `enter` plays once at `start` (default `top 85%`); `scrub` ties the reveal to a range.
   - Lines: `yPercent 110 → 0`, 1.2 s, stagger 0.08. Chars: `yPercent 115 → 0` with the numbers from `Pages.home` and `Pages.case`.
   - Use `SplitText` with `autoSplit: true` and rebuild the tween in `onSplit`, so line breaks stay right after resize and font load. Keep SplitText's default `aria` handling and prove the accessible name stays the original text.
   - Reduced motion and no JavaScript: text is plain, visible, unsplit.
2. **`WordsLight`**: scrubbed word-by-word lighting (`opacity 0.14 → 1`, stagger 0.1, `ease: none`, `scrub 0.8`). Props for the trigger element and `start`/`end`, because home uses a whole sticky section as the trigger and the case study and about page use their own ranges. Same SplitText `autoSplit` rule.
3. **`Reveal`**: fade-and-rise for a group (`y 28 → 0`, opacity, 1 s, stagger 0.08 default), the prototype's `fadeUpOnEnter` and the "later" groups of the intros. `when: "ready" | "enter"`, `once` always, children or the element itself as targets, `delay`.
4. **`MediaReveal`**: the clip-path media reveal. Variants: `scrub` (`inset(18% 6% 0 6% round 18px) → inset(0)`, inner scale `1.16 → 1`, from `top 95%` to `top 45%`) and `intro` (case-study hero: `inset(30% 8% 0 8% round 26px)`, inner scale `1.2 → 1`, 1.6 to 1.8 s after ready). The inner element is found by a `data-media-inner` attribute. Radius values come from tokens, not literals.
5. **`StickyStage`**: a tall section with a sticky full-viewport stage, as used by the home manifesto (240 vh), dusk (190 vh), featured work (300 vh desktop only), the about chapters (200 vh) and the case-study tour.
   - Server markup: `section` with the configured height, an inner sticky `100svh` stage, children. Props: `height`, `mobileHeight` (for example `"auto"`), optional `tone`.
   - A client hook, `useStageTimeline(build, options)`, gives the section's content a scrubbed timeline (`scrub: 0.8`) bound to the stage with configurable `start`/`end` (home dusk uses `top bottom` to `bottom top`, the manifesto uses `top top` to `bottom bottom`), and exposes `progress` for things that are not tweens (the 3D scene in 03 will read it). It reports which media condition is active (desktop, mobile, reduced) so featured work can switch to per-element reveals on mobile.
   - Reduced motion and no JavaScript: no sticky, no extra height, everything at its final state in normal flow.
6. **`Scrub`**: a thin wrapper that scrubs one element between two sets of tween vars over a trigger range (`start`, `end`, `trigger` defaults to itself). It covers the simple scrubs: hero word settling (`yPercent -14`, scale 0.92), hero meta fading out, the about arcs expanding. Props are plain serialisable objects so a Server Component can pass them. Anything with several coordinated elements stays a section's own timeline; do not turn `Scrub` into a configuration language.
7. **`LineDraw`**: DrawSVG for diagrams. A wrapper that finds `[data-wire]` paths and `[data-node]` elements inside it and, scrubbed over its range, brings nodes in order (`opacity 0 → 1`, `y 16 → 0`, 0.4 each, 0.35 apart) and draws wires (`drawSVG 0% → 100%`, 0.5 each, offset 0.2 + 0.35 per wire), as in `Pages.case` architecture. Reduced motion: fully drawn.
8. **`useScrollSpy`** in `src/hooks/`: given an ordered list of element ids and an activation line (default 45 % of the viewport for lists, 55 % for the tour), returns the active id and index through ScrollTrigger `onToggle`. It serves the work rail (04) and the product tour (05). It cleans up its triggers and updates nothing when the page is not scrollable.

Existing 01 primitives stay as they are. If `FooterMotion` duplicates what `SplitReveal` or `Scrub` now does, make the footer use the primitives and delete the duplicate; behaviour and numbers must not change.

### B. UI building blocks (`src/components/ui/`)

Static, server-renderable, no GSAP, colours from tokens only (the prototype uses a few raw colours for its placeholder screens: map them to the nearest tokens, `sheet`, `sand`, `glow`, `ink-soft` with `color-mix`, and list the mapping).

- **`Screen`**: the framed product screen (`.screen`, `.screen-inner`, `.ui-bar`, aspect variants `default`, `tall`, `wide`). With `src` it renders a real image through `next/image` (required `alt`, `width`, `height`, `sizes`); without it, a placeholder skeleton in one of four layouts (agenda grid, record split, plan list, invoice) that the prototype used, marked clearly as placeholder for 08. The inner element carries `data-media-inner`. Optional `figcaption`.
- **`Chip`** (`.chip`, `is-warm`, and a `todo` state for unconfirmed values, drawn with a token and `color-mix`, not the prototype's raw blue) and a `Chips` list.
- **`ArrowLink`**: the prototype's `.link` and `.back-link` as one component with a `lucide-react` arrow, using `@/i18n/navigation` through `TransitionLink` for internal links.

### C. The bench (`/[locale]/lab`)

Extend the lab page from 01 into a bench with one titled block per primitive, each in a day and a night section, using the real tokens: SplitReveal lines and chars in the three `when` modes, WordsLight inside a `StickyStage`, Reveal groups, MediaReveal in both variants with `Screen` placeholders and with a real image, a StickyStage with a stage timeline and a mobile fallback, Scrub, LineDraw with a small diagram built from `<path>` elements in `src/components/sections/lab/diagrams/` (inline `<svg>` is allowed only there), `useScrollSpy` driving a rail. It stays 404 in production and is removed in 03.

### D. Documentation

Create `docs/primitives.md`: for each primitive its purpose, props table, the prototype function it ports, defaults (with the `lib/motion.ts` constant names), reduced-motion and no-JS behaviour, and a **usage matrix** mapping each primitive to the page beats that will use it (use the table in the owner's brief below). Add one line to `AGENTS.md` under Motion rules: "Before writing GSAP in a section, check `docs/primitives.md`; compose a primitive when one fits." Update `docs/architecture.md` primitives list to match what exists.

Usage matrix to put in the document:

| Primitive | Used by |
|---|---|
| `SplitReveal` chars, `ready` | home hero wordmark, case-study product name |
| `SplitReveal` lines, `ready` | work hero, about dawn, contact hero, case-study intro |
| `SplitReveal` lines, `enter` | footer CTA, case-study next project, home featured heading |
| `SplitReveal` lines, `scrub` | home dusk title |
| `WordsLight` | home manifesto, case-study problem, the three about chapters |
| `Reveal` `ready` | hero meta and foot, work lead, case-study back link and facts, about lead, contact lead and cards |
| `Reveal` `enter` | work project heads, case-study steps and architecture list, about timeline, stack groups and "right now" |
| `MediaReveal` scrub | work project media, case-study media |
| `MediaReveal` intro | case-study hero screenshot |
| `StickyStage` | home manifesto, dusk and featured work, about chapters, case-study tour |
| `Scrub` | home hero settle and meta fade, about arcs, home 3D layer dim |
| `LineDraw` | case-study architecture diagram |
| `useScrollSpy` | work rail, case-study tour |
| `Screen` | home featured work, work media, case-study hero and tour |
| `Chip` | work projects (stack), case-study facts |
| `ArrowLink` | case-study back link, work links, footer secondary link |

## Testing and evidence

- Unit tests for any pure logic (range parsing, condition handling, spy index selection).
- Playwright **primitives** spec on the bench, desktop 1440 and mobile 390: each primitive reaches its end state when scrolled; each is complete without JavaScript; under reduced motion everything is visible and nothing is sticky; SplitReveal keeps the original accessible name and reflows correctly after a viewport resize; ScrollTrigger count returns to its baseline after navigating from the lab to another route and back (no leaks, also under StrictMode); no console errors.
- **Axe** on the bench with the loader finished. WordsLight starts at opacity 0.14, which may fail colour contrast before it is scrubbed: if axe flags it, do not change the prototype value silently; report the rule, element and contrast ratio in your reply so the owner decides.
- Motion evidence in `test-results/motion/` (webm and png): each `SplitReveal` mode, `WordsLight`, `MediaReveal` scrub and intro, `StickyStage` (desktop and mobile fallback), `Scrub`, `LineDraw`, `useScrollSpy`.
- Lighthouse CI keeps measuring and asserting only what it asserted before. Update `docs/baseline.md` with the JavaScript transfer and TBT after this branch on `/fr` (the primitives must not raise TBT noticeably on routes that do not use them: report the delta).

## Decisions already made (do not re-decide)

All of `docs/decisions.md`. `scrub` is always `SCRUB` (0.8). GSAP stays the only animation engine and `lib/gsap.ts` the only import point. No new runtime dependency except `lucide-react` if not yet installed.

## Out of scope

Any page section, the home scene and `Sky` (03), the work rail itself (04), the product tour and architecture diagram content (05), the about arcs component (06), the contact `Field` and form (07), real copy and screenshots (08), new budgets.

## Acceptance

1. Every command in `ci.yml` passes locally, in order. Paste the last lines of each.
2. Every primitive is exercised on the bench, and the primitives spec, axe run and no-JavaScript run pass.
3. `docs/primitives.md` exists with the usage matrix; `AGENTS.md` and `docs/architecture.md` are updated.
4. `FooterMotion` uses the primitives, and its behaviour and numbers are unchanged (compare the 01 footer video).
5. Lint still fails on a `gsap` import outside `lib/gsap.ts` and on an inline `<svg>` outside `components/brand` and `sections/**/diagrams` (show one, then revert).
6. `git status --short` is shown and nothing was committed or pushed.

## Reply format

As in `AGENTS.md`, plus **Measured** (JavaScript and TBT delta), **Motion evidence** (file list), **Axe findings** (if any), and **Proposed commits**.