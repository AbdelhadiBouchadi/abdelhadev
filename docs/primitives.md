# Primitives

The reusable motion and UI building blocks that the page branches compose (built in 02). A section is written by composing these; it writes its own GSAP only for a choreography that exists on one page only. Values are the prototype's (`docs/prototype/assets/site.js`); every number is a constant in `src/lib/motion.ts`, named below.

Since 03 the home page exercises SplitReveal, WordsLight, Reveal, StickyStage and Scrub, and their end-to-end checks moved there (`tests/e2e/home.spec.ts`, motion evidence in `tests/e2e/home-motion.spec.ts`). Since 04 the work page exercises MediaReveal (scrub) and useScrollSpy (`tests/e2e/work.spec.ts`, motion evidence in `tests/e2e/work-motion.spec.ts`). Since 05 the case study exercises SplitReveal (chars, `ready`, and lines, `enter`), MediaReveal (`intro`), LineDraw and useScrollSpy (`SPY.tour`), and their end-to-end checks live there (`tests/e2e/case.spec.ts`, motion evidence in `tests/e2e/case-motion.spec.ts`). The lab bench and its specs (`primitives.spec.ts`, `primitives-motion.spec.ts`) were removed in 05: every primitive now has a real page. Unit tests: `tests/unit/primitives.test.ts`.

## How every primitive is built

- **Server markup, client leaf.** The primitive (`SplitReveal`, `Reveal`, …) is a Server Component that renders the element with its content, so the content is in the HTML without JavaScript. Right after the element it renders a hidden, empty client leaf (`…Motion.tsx`) that finds the element through `previousElementSibling` and animates it. Only the leaf hydrates. The leaf is `display: none`, so it is not a grid or flex item; prefer `gap` over `space-*` utilities next to a primitive, because a sibling selector would still see the leaf.
- **`useMotion`** (`src/hooks/useMotion.ts`) is the setup all leaves share: `useGSAP` with a scope, one `gsap.matchMedia()` with a motion branch and, where something could be left hidden, a reduced-motion branch, and cleanup on unmount (StrictMode included). The setup itself does not run inside React's hydration commit: it is queued with `afterCommit` (`src/lib/schedule.ts`) and every queued setup runs together in the next task, under the loader overlay or the route curtain, before the intro may start. This keeps GSAP's style writes and ScrollTrigger's layout reads out of the commit (`docs/spikes/tbt.md`). A queued setup that is cancelled (unmount) never runs.
- **Hidden start states are CSS** under `html.motion` (`src/styles/primitives.css`), so they are in place at first paint and absent without JavaScript or under reduced motion. The tweens are `fromTo` with explicit end values. If reduced motion is switched on mid-visit (`html.motion` stays), the reduced branch pins the elements at rest.
- **Ready-time intros** wait for the loader through `useReadyGate` (`src/hooks/useReadyGate.ts`, built on `useLoaderReady`): the animation is created paused under the overlay and plays at the ready signal (0.55 s into the loader exit or the curtain lift).
- **SplitText and DrawSVGPlugin load on demand** (`loadSplitText()`, `loadDrawSVG()` in `src/lib/gsap.ts`). Every SplitText use has `autoSplit: true` and builds its tween in `onSplit`, so line breaks stay right after a resize or a font swap.
- **Scrubs** always use `SCRUB` (0.8). **Triggers** are the element itself by default; a `trigger` prop takes a selector, resolved as the nearest matching ancestor, else the first match on the page (`resolveTrigger` in `src/lib/scroll.ts`).
- **Leaving a page:** each leaf's triggers belong to its `useGSAP` context and die with it; nothing calls `ScrollTrigger.killAll()`. The home spec checks that the ScrollTrigger count returns to its baseline after the home → work → back round trip.

## Motion primitives (`src/primitives/`)

### SplitReveal

Masked text reveal by lines or characters. Ports `linesUp` and the letter reveals of `Pages.home` (hero wordmark) and `Pages.case` (product name).

| Prop | Type | Default | Notes |
|---|---|---|---|
| `type` | `"lines" \| "chars"` | required | |
| `when` | `"ready" \| "enter" \| "scrub"` | required | |
| `as` | `"h1"` to `"h4"` | `"h2"` | headings only, see accessibility |
| `delay` | seconds | `0` | `ready` only; pass a `lib/motion.ts` constant |
| `start` | ScrollTrigger start | `REVEAL.enterStart` (`"top 85%"`) | `enter`, `scrub` |
| `end` | ScrollTrigger end | `"bottom top"` | `scrub` |
| `trigger` | selector | the heading | `enter`, `scrub` |
| `pace` | `"hero" \| "case"` | `"hero"` | chars only: `CHARS_PACE` |
| other | heading attributes | | `className`, `id`, `tabIndex`, `data-*` |

- Lines: `yPercent REVEAL.linesYPercent (110) → 0`, `DURATION.lines` (1.2 s), `STAGGER.lines` (0.08), mask on lines.
- Chars: `yPercent REVEAL.charsYPercent (115) → 0`; `CHARS_PACE.hero` = 1.35 s, stagger 0.045 (`DURATION.heroLetters`, `STAGGER.heroLetters`); `CHARS_PACE.case` = 1.3 s, stagger 0.05 (`DURATION.caseLetters`, `STAGGER.caseLetters`). Mask on chars, `smartWrap`.
- `ready`: the text is painted under the overlay (it may be the LCP element, decision T7), split and hidden under it, and revealed at the ready signal. `enter`: plays once at `start`. `scrub`: tied to `start`..`end`. Once an `enter` or `ready` reveal has played, a re-split leaves the text in place.
- Accessibility: SplitText's default `aria: "auto"` stays, so the heading's accessible name is its original text (tested, including after a resize). That puts an `aria-label` on the split element, which ARIA prohibits on paragraphs and generic elements (axe `aria-prohibited-attr`), hence headings only.
- Reduced motion and no JavaScript: plain, visible, unsplit text.

### WordsLight

Scrubbed word-by-word lighting. Ports `wordsLight`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `as` | `"p" \| "h2" \| "h3" \| "blockquote"` | `"p"` | |
| `trigger` | selector | the statement | the home manifesto uses `"[data-stage]"` (its whole sticky section) |
| `start` | ScrollTrigger start | `REVEAL.wordsStart` (`"top 75%"`) | manifesto `STAGE.start`; case problem `"top 70%"`; about chapters `"top 20%"` |
| `end` | ScrollTrigger end | `REVEAL.wordsEnd` (`"bottom 40%"`) | manifesto `STAGE.end`; case problem `"bottom 55%"`; about chapters `"bottom bottom"` |

- Words: `opacity REVEAL.wordsFrom (0.5) → 1`, `STAGGER.words` (0.1), `EASE.none`, `SCRUB`.
- Words are split as inline spans with `aria: "none"`: the words stay in the accessibility tree in order, and the statement can stay a paragraph.
- Reduced motion and no JavaScript: plain text at full opacity.
- Contrast: unlit words start at 0.5 (ink on paper about 3.1:1, moon on night about 4.5:1, over the 3:1 for large text). The prototype's 0.14 measured 1.32:1 on paper and 1.44:1 on night and failed Lighthouse's color-contrast audit on the home manifesto; the owner raised it to 0.5 in 03.

### Reveal

Fade-and-rise for a group. Ports `fadeUpOnEnter` and the "later" groups of the page intros.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `when` | `"ready" \| "enter"` | required | always once |
| `as` | `"div" \| "ul" \| "ol" \| "dl" \| "p" \| "section" \| "header"` | `"div"` | |
| `targets` | `"children" \| "self"` | `"children"` | each child element, or the element itself |
| `y` | px | `REVEAL.fadeY` (28) | intros use 18 to 40 |
| `duration` | seconds | `DURATION.fadeUp` (1) | contact cards use 1.1 |
| `stagger` | seconds | `STAGGER.reveal` (0.08) | project heads `STAGGER.projectHead` (0.07) |
| `delay` | seconds | `0` | |
| `start` | ScrollTrigger start | `REVEAL.enterStart` (`"top 85%"`) | `enter`; project heads `"top 80%"`, about chapter label `"top 60%"` |

- Start state (CSS): `opacity: 0; transform: translateY(var(--reveal-y))`, with `--reveal-y` set inline from `y`.
- Reduced motion and no JavaScript: visible, in place.
- New constants a page branch needs for its own delays and offsets (for example the work intro's 0.35 s) go into `lib/motion.ts`, not into the section.

### MediaReveal

The clip-path media reveal. Ports `revealMedia` and the case study hero shot (`Pages.case`). The frame is the clipped element; the zoomed element inside is found by `data-media-inner` (`Screen` renders it).

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `"scrub" \| "intro"` | required | |
| `as` | `"div" \| "figure"` | `"div"` | use `div` around a captioned `Screen` (it renders its own `figure`) |

- `scrub` (`MEDIA_REVEAL.scrub`): `inset(18% 6% 0% 6% round var(--r-media))` → `inset(0%)`, inner `scale 1.16 → 1`, linear, scrubbed from `"top 95%"` to `"top 45%"`.
- `intro` (`MEDIA_REVEAL.intro`): `inset(30% 8% 0% 8% round var(--r-shot))` → `inset(0%)` over `DURATION.shotClip` (1.6 s), inner `scale 1.2 → 1` over `DURATION.shotScale` (1.8 s), `DELAY.shot` (0.5 s) after the ready signal, house ease.
- Radii come from the tokens (`--r-media` 18 px, `--r-shot` 26 px, added in 02 for the prototype's `.case-shot`), read once in the browser (`readToken`).
- Reduced motion and no JavaScript: fully open, no zoom.

### StickyStage and useStageTimeline

A tall section with a sticky, viewport-tall stage (home manifesto 240 vh, dusk 190 vh, featured work 300 vh on desktop, the about chapters 200 vh, the case study tour). `StickyStage` is server markup only; a section's client leaf animates it with `useStageTimeline`.

| `StickyStage` prop | Type | Default | Notes |
|---|---|---|---|
| `height` | `"240vh"`, `"190vh"`, … or `"auto"` | required | section height while motion runs |
| `mobileHeight` | same | `height` | under 761 px; `"auto"` puts the section in normal flow there with no sticky stage (featured work) |
| `tone` | `"day" \| "night" \| "sheet"` | none | renders a `ToneSection`, so the shell follows the section |
| `stageClassName` | string | | layout inside the stage (`wrap flex items-center`, …) |
| other | section attributes | | `id`, `className`, `data-*` |

`useStageTimeline(build, options)` returns `{ ref, progress, condition }`.

| Option | Default | Notes |
|---|---|---|
| `start` | `STAGE.start` (`"top top"`) | home dusk uses `"top bottom"` |
| `end` | `STAGE.end` (`"bottom bottom"`) | home dusk uses `"bottom top"` |
| `onUpdate(progress)` | none | called on every update |

- Attach `ref` to any element inside the `StickyStage`. `build({ timeline, condition, section, stage })` runs once per media condition: `desktop` (≥ 761 px, `MEDIA.desktop`), `mobile`, `reduced`. It may return a cleanup; what it creates is reverted when the condition changes and on unmount.
- `timeline` is a GSAP timeline scrubbed (`SCRUB`) over the section's range. It is `null` under reduced motion and on mobile when `mobileHeight` is `"auto"`: featured work then builds its per-element reveals there. Tweens in it get the house ease unless they set `ease: EASE.none` (the dusk sky).
- `progress.current` is the range's progress in [0, 1] (raw, as the prototype's 3D scene reads it), 1 under reduced motion. `condition` is the active condition for rendering, `null` until the first setup.
- Reduced motion and no JavaScript: no sticky, no extra height, the content in normal flow at its final state.

### Scrub

Scrubs one element between two sets of plain values over a range. For the simple scrubs only; anything with several coordinated elements is a section's `useStageTimeline`, not a Scrub.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `to` | `ScrubVars` | required | e.g. `SETTLE.heroWord` |
| `from` | `ScrubVars` | `{}` (the CSS state) | |
| `trigger` | selector | the Scrub element | the hero uses `"#hero"`-style selectors |
| `start` | ScrollTrigger start | `"top bottom"` | |
| `end` | ScrollTrigger end | `"bottom top"` | |
| `as` | `"div" \| "span" \| "p"` | `"div"` | |

- `ScrubVars` allows only `x`, `y`, `xPercent`, `yPercent`, `scale`, `scaleX`, `scaleY`, `rotation`, `opacity` (no layout properties). The values are plain objects, so a Server Component can pass them.
- The wrapper is the element that moves, so its children keep their own transforms. Linear (`EASE.none`), `SCRUB`.
- `SETTLE` holds the documented end states: `heroWord` (`yPercent -14`, `scale 0.92`), `heroMeta` (`opacity 0`, `y -30`), `arcs` (`yPercent -10`, `scale 1.25`, `opacity 0.25`).
- Reduced motion and no JavaScript: the element stays at its CSS state.

### LineDraw

DrawSVG for diagrams. Ports the architecture diagram of `Pages.case`. Inside it, elements marked `data-node` arrive in document order and paths marked `data-wire` draw, on one scrubbed timeline. The diagram's inline `<svg>` lives in a section's `diagrams/` folder (the only place ESLint allows it besides `components/brand`).

| Prop | Type | Default |
|---|---|---|
| `trigger` | selector | the LineDraw element (the case study passes its `.arch` grid, as the prototype) |
| `start` | ScrollTrigger start | `LINE_DRAW.start` (`"top 70%"`) |
| `end` | ScrollTrigger end | `LINE_DRAW.end` (`"bottom 60%"`) |

- Node `i`: `opacity 0 → 1`, `y LINE_DRAW.nodeY (16) → 0`, `DURATION.node` (0.4) at `i × LINE_DRAW.step` (0.35). Wire `i`: `drawSVG 0% → 100%`, `DURATION.wire` (0.5), linear, at `LINE_DRAW.wireOffset (0.2) + i × 0.35`.
- Wires must be single-segment paths with a stroke. Start state (CSS): nodes at opacity 0, wires hidden until DrawSVG has collapsed them.
- Reduced motion and no JavaScript: fully drawn.

### useScrollSpy (`src/hooks/useScrollSpy.ts`)

`useScrollSpy(ids, { line })` returns `{ activeIndex, activeId }`: which of the elements with these ids is crossing a horizontal line at `line` of the viewport height. One ScrollTrigger per element (`lineRange` gives `"top 45%"` to `"bottom 45%"`), selection through `onToggle` (`spyReduce`): the latest element to cross is active, in a gap the last one stays, and when it stops crossing the previous one still crossing takes over. `-1` / `null` before the first element reaches the line.

| Option | Default | Notes |
|---|---|---|
| `line` | `SPY.list` (0.45) | `SPY.tour` (0.55) for the case study tour |

Not an animation, so it runs with and without reduced motion. Its triggers die with the component, and it updates nothing while the page cannot scroll.

## UI building blocks (`src/components/ui/`)

Static, server-rendered, no GSAP. Styles in `src/styles/ui.css`, colours from tokens only.

### Screen

The framed product screen (`.screen`, `.screen-inner`, `.ui-bar`).

| Prop | Type | Notes |
|---|---|---|
| `aspect` | `"default" \| "tall" \| "wide"` | 16 / 10, 4 / 5, 21 / 10; a `className` such as `aspect-[16/8.5]` overrides (case study hero) |
| `src`, `alt`, `width`, `height`, `sizes`, `priority` | `next/image` props | a real screenshot; `alt`, `width`, `height` and `sizes` are required |
| `layout` | `"agenda" \| "record" \| "plan" \| "invoice" \| "list" \| "chart" \| "chat" \| "site"` | without `src`: the prototype's placeholder skeleton (the last four, added in 04, are the work page's shop tiles, bars, bubbles and site hero band) |
| `label` | string | required with `layout`: announced in place of the screenshot ("Screenshot to come", from messages) |
| `caption`, `captionHidden` | | renders a `figure` with a `figcaption` (visually hidden with `captionHidden`, as the prototype's work media) |

The inner element carries `data-media-inner` for `MediaReveal` and stage timelines. Placeholders carry `data-placeholder="screen"`, `role="img"` and the label, so 08 can find and replace every one of them.

Placeholder colours: the prototype drew its skeletons with raw colours; each maps to a token or a `color-mix` of tokens.

| Prototype | Used for | Token |
|---|---|---|
| `#FFFCF7` | screen | `--sheet` |
| `rgba(43,29,26,.06)` | screen hairline | `--ink` at 6 % |
| `#F3E8DC` | ui bar, tiles, bubbles | `--sand` 70 % with `--sheet` |
| `#DCC8B5` | ui bar pills | `--sand-2` 90 % with `--ink-soft` |
| `#EADBCB` | skeleton line | `--sand` |
| `#D9C2AC` | dark skeleton line | `--sand-2` 88 % with `--ink-soft` |
| `#F6EEE5` | empty agenda cell | `--sand` 35 % with `--sheet` |
| `#E8D5C2` | agenda cell `c` | `--sand-2` |
| `#2B1D1A` | invoice total | `--ink` |

### Chip and Chips

`Chip` (`.chip`) with `variant`: `default`, `warm` (glow at 30 %), `todo` (a value the owner has not confirmed: `--majorelle` at 8 % fill and 30 % ring with Majorelle text, `--majorelle-soft` on night, instead of the prototype's raw `rgba(61, 82, 213, …)`). `Chips` renders a list from `items` (strings or `{ label, variant }`) and marks every `[TODO: …]` label as `todo` by itself. On night, a `warm` chip uses `--moon` text (the prototype only used it on day, where it is ink).

### ArrowLink

The prototype's `.link` and `.back-link` as one component with a lucide-react arrow: `variant` `forward` (underlined, arrow after), `back` (quiet, arrow before), `external` (up-right arrow) or `download` (down arrow, for a file: the about page's CV, added in 06). The link element comes in through `as`: `TransitionLink` for internal links (route curtain, localised pathnames through `@/i18n/navigation`), `"a"` for external ones, because `components/ui` may import `lib` only (`docs/architecture.md`).

```tsx
<ArrowLink as={TransitionLink} href="/work" variant="back">{t("allProjects")}</ArrowLink>
```

## Usage matrix

| Primitive | Used by |
|---|---|
| `SplitReveal` chars, `ready` | case-study product name (the home hero wordmark has its own leaf, `HeroWordmark`: its width axis reflows the letters, and only a combined split with frozen letter boxes keeps that out of CLS) |
| `SplitReveal` lines, `ready` | work hero, about dawn, contact hero |
| `SplitReveal` lines, `enter` | footer CTA, case-study next project (the home featured heading fades up with its copy, as in the prototype) |
| `SplitReveal` lines, `scrub` | home dusk title |
| `WordsLight` | home manifesto, case-study problem, the three about chapters |
| `Reveal` `ready` | home hero meta and actions (not the intro paragraph: it is the LCP element, decision T7), work lead, case-study back link, lead and facts (`STAGGER.caseLater`), about lead, contact lead and cards |
| `Reveal` `enter` | work project heads, case-study adaptation cards (`STAGGER.adapt`) and architecture list (`STAGGER.archList`), about chapter labels, services, process cards, timeline, stack groups and "right now" (`ABOUT.stagger`) |
| `MediaReveal` scrub | work project media |
| `MediaReveal` intro | case-study hero screenshot |
| `StickyStage` | home manifesto, dusk and featured work, about chapters (not the case-study tour: as in the prototype, only its framed stage is sticky, inside the tour grid, `src/styles/case.css`) |
| `Scrub` | home hero settle and meta fade, about arcs, home 3D layer dim |
| `LineDraw` | case-study architecture diagram |
| `useScrollSpy` | work rail (`SPY.list`), case-study tour (`SPY.tour`, `TourMotion`: the active step and the stage crossfade) |
| `Screen` | home featured work, work media, case-study hero, tour stage and inline tour screens |
| `Chip` | work projects (stack), about stack groups and the timeline's unconfirmed years (`todo`); the case-study and about facts are plain text, as in the prototype's `dl.facts` |
| `ArrowLink` | case-study back link, work links, footer secondary link, about services Contact, CV download and "right now" links |

Already composed in 02: the footer CTA (`SplitReveal` lines, `enter`, `SHELL.footerCtaStart`) and the footer wordmark (`Scrub`, `yPercent SHELL.footerWordFrom → SHELL.footerWordTo`, the footer from `"top bottom"` to `"bottom bottom"`), which replaced `FooterMotion` with the same numbers.
