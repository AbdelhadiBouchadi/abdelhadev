# Choreography

What moves, when, and by how much. Values come from `docs/prototype/assets/site.js`; read the function named in each section before porting it.

## Motion system

| Name | Value | Where |
|---|---|---|
| House ease `warm` | CustomEase `0.625, 0.05, 0, 1` (CSS `cubic-bezier(.625,.05,0,1)`) | default for everything |
| Default duration | 0.6 s | hovers, small moves |
| Intro durations | 1.0 to 2.2 s | page intros, loader |
| Scrub | 0.8 | all scroll-linked timelines |
| Lenis | `lerp 0.1`, `autoRaf false`, driven by `gsap.ticker`, `lagSmoothing(0)` | all pages, stopped during loader and curtain |
| Cursor follow | lerp 0.16 per frame, frame-rate independent | fine pointers only |
| Magnetic pull | 22 % horizontal, 30 % vertical of the pointer offset, `quickTo` 0.6 s | primary buttons |
| Line reveal | SplitText lines with mask, `yPercent 110 → 0`, 1.2 s, stagger 0.08 | headings |
| Word light | SplitText words, opacity `0.14 → 1`, stagger 0.1, scrubbed (the prototype value, D10 in `docs/decisions.md`) | statements |
| Media reveal | `clip-path inset(18% 6% 0 6% round 18px) → inset(0)`, inner screen scale `1.16 → 1`, scrubbed from `top 95%` to `top 45%` | project media |

## Loader (every page) — `Loader` in site.js

1. Present at first paint (night panel, dawn glow at the bottom, mark with the sun below the horizon, wordmark letters hidden, counter `000`).
2. First visit: the horizon and reflection draw from the centre (0.9 s, stagger 0.08).
3. Real progress (fonts weight 3, window load 2, each critical image 1, home 3D scene 3) is tweened (`power2.out`, 0.8 s) and drives: the counter, the bottom bar, the sun rising (`y 19 → 0` in mark units), and one wordmark letter per tenth of progress (`opacity 0 → 1`, `y 26 → 0`, 0.7 s).
4. Floor 1600 ms on the first visit, 700 ms on a route change; ceiling 3300 ms, the latest moment the exit starts (the registry stops waiting for tasks 0.45 s earlier, so the final push still plays). Exit start plus the exit (1.45 s) is 4.75 s, under the 5 s limit.
5. Exit: letters lift out (`y -30`, stagger 0.025, `power3.in`), mark lifts, meta fades, then the panel slides up (`yPercent -100`, 1.15 s, `warm`) with its bottom edge curving (`border-bottom radius 50% 14vh`). The page intro starts 0.55 s into the exit.
6. Leaving a page (curtain): the panel rises from the bottom with a curved top edge (0.8 s), the sun sets (`y 0 → 19`, 0.7 s, `power2.in`), then navigation happens and the arriving page runs the short loader.
7. Reduced motion: no drawing or rising; a 250 ms fade when ready.

## Shell

- Header hides when scrolling down past 240 px and returns on any upward scroll; never hides while focus is inside it.
- Tone switching: each top-level section declares `day` or `night` (and optionally the point where it takes over); the header, the mobile pill and the cursor transition their colours over 0.6 s.
- Footer: the CTA heading reveals by lines when it enters; the giant wordmark rises from `yPercent 60` to `14` as the footer scrolls in.

## Home — `Pages.home`

| Beat | Section height | Sticky | What happens |
|---|---|---|---|
| Hero | 100 svh | no | Intro: wordmark `wdth 75 → 100` (1.9 s) while letters rise through masks (1.35 s, stagger 0.045); the sun glow rises (2.2 s); the 3D layer fades in (1.8 s); meta and foot fade up. Scroll: the wordmark settles back (`yPercent -14`, scale 0.92), meta fades out. |
| Manifesto | 240 vh | stage 100 svh | Words light up across the section. The 3D slabs part outwards (×1.55) and recede (z −1.6); the 3D layer dims to 0.3 so the text stays readable. |
| Dusk | 190 vh | stage 100 svh | The sky goes paper → sunset (first 28 %) → night (next 32 %); the sun sinks and fades (it started sinking at the hero); lines rise; text colours cross from ink to moon; the header turns to night at the section centre. The 3D slabs fly up and the canvas stops rendering. |
| Featured work | 300 vh desktop, auto mobile | stage 100 svh on desktop | Copy fades up, then four screens open one after another (`clip-path` from the bottom, inner scale 1.22 → 1, stagger 0.32). On mobile each screen reveals as it enters. |
| Footer | auto | no | Shared footer. |

The 3D layer: positions are fractions of the visible half-width and half-height so the composition holds at every aspect ratio; mouse parallax depth-weighted; idle float `sin(t·0.6)·0.08`. Mobile uses four slabs at 60 % scale.

## Work — `Pages.work`

- Intro: heading lines rise, the lead and link fade up.
- Rail (desktop ≥ 900 px): sticky; the active project (the one crossing 45 % of the viewport) gets a pill and a Majorelle dot; a thin progress line fills with the scroll through the projects.
- Each project sheet: header items fade up on entry (stagger 0.07); media reveal as described above.

## Case study — `Pages.case`

- Intro (night): the product name rises letter by letter; back link, lead and facts fade up; the hero screenshot opens from `inset(30% 8% 0 8%)` with its inner scale `1.2 → 1` (1.6 to 1.8 s).
- Problem statement: words light up.
- Product tour (desktop): steps scroll past a sticky framed screen; the active step is full opacity, others 0.35; the screen crossfades (0.7 s). Mobile: each step shows its own screenshot inline.
- Adaptation steps: cards fade up in sequence.
- Architecture (night): nodes arrive in order and wires draw (DrawSVG) on scrub.
- Next project: a giant link whose lines rise on entry.

## About — `Pages.about`

- Dawn hero, a sunrise in five beats (`DawnMotion`, values in `ABOUT.dawn`). The section is 420 svh (340 svh under 761 px) with a CSS sticky stage of one screen, not a GSAP pin. One timeline, `scrub 0.6` on top of Lenis, `invalidateOnRefresh`, runs from `"top top"` to the section height minus two screens; ranges are in its progress units:

| Beat | Range | What happens |
|---|---|---|
| Arrival | time, after the loader | The bottom glow rises in (`scaleY 0.6 → 1` from the bottom, opacity 0 → 1, 2 s `power2.out`); heading lines rise (0.3 s); the lead, then the facts row, fade up (0.8 s, 0.88 s). The scrub grows the glow's inner layer, so a scroll during the arrival composes with it. |
| Copy leaves, sky warms | 0 to 0.24 | The copy block travels up (`yPercent -28`) and fades out (0 to 0.2); the glow grows to `scaleY 2.4` from the bottom (0 to 0.22); the sunset layer fades in over it (0.04 to 0.24). |
| Halos | 0.12 to 0.9 | Four soft rings centred just below the bottom edge, 0.12 apart, each scale `0.08 → 1.9` over 0.42 (`power1.in`), fade in over 0.08 and out over 0.14 from 0.28 after their start. Each ring is one element: a conic gradient of two brand tones cut to a ring by a radial `mask`, no blur. `will-change` is on the halos only while the scene is active. |
| Sun settles | 0.66 to 0.92 | The sky turns from `--sunset` to `--sheet` and the glow softens to 0.55 (0.66 to 0.86); the Majorelle horizon draws out (`scaleX 0 → 1`, 0.7), the half sun rises behind it from its clip (0.74 to 0.92), the reflection draws out (0.8). It is the brand mark at large size, in its own proportions. The timeline is held to 1. |
| Hand-off | the last screen | The thread zone (the chapters to the stack) has a top margin of minus one screen, the paper background, `--r-section` top corners and a soft shadow, so it slides over the still sunrise like a sheet of paper: no seam, no gap. |

  Reduced motion and no JavaScript: no tall section, no sticky stage, no overlap. One still screen: the copy at the top, two small static halos, the sun mark set on its horizon below the copy.
- Three chapters (200 vh each, sticky stage): the label fades in, the statement's words light up.
- The thread (`ThreadZone`, `ThreadMotion`, values in `ABOUT.thread`): one line drawn through the day sections, from the chapters to the stack, with a small sun on its tip. The zone wraps those sections and carries their paper (the sections inside are transparent, `data-tone` stays on them), so the line shows behind the text; the SVG sits at `z-index: 0` under the sections, `aria-hidden`, without pointer events, and is hidden in print. "Right now" stays outside the zone.
  - Route, measured from the layout and rebuilt on a resize of the zone (`ResizeObserver`, debounced 200 ms), after fonts and after images: from the top centre, under the sun; one point per chapter (30 % of the first's height, 55 % of the others'); the middle of services and of process; the top and the bottom of the experience timeline; 24 px below the stack; the bottom centre. The x alternate in a narrow band near the right edge (desktop 0.945 to 0.98 of the width, under 761 px 0.958 to 0.972). Where that band would reach a section's content, the same alternation is mapped into the free part of the right margin (from 40 % of the margin past the content to at most 16 px from the edge), so the line never crosses the text: with the current gutter and frame this applies below about 1630 px, and the prototype's values show from there. Cubic segments with vertical handles at half the height (`C x0 y0+m x1 y1-m x1 y1`) make soft S-curves.
  - One timeline on one ScrollTrigger: the zone, `"top 55%"` to `"bottom 75%"`, `scrub 0.6`. DrawSVG draws the path `0% 0%` → `0% 100%` and MotionPathPlugin moves the sun along it (`align`, `alignOrigin [0.5, 0.5]`, no rotation), both `ease: none` over the whole progress; the sun fades in at 0 (0.02) and out from 0.96 (0.04), so the line ends above the dark section with no sun. A faint dotted ghost of the whole route shows where it goes. The plugins load on demand with the leaf (`loadDrawSVG`, `loadMotionPath`).

  Reduced motion and no JavaScript: the line is fully drawn and still, and there is no sun. Without JavaScript the server's rough route is shown (into the far right margin, down, back to the centre), stretched over the zone.
- Experience, stack and "Right now" groups fade up on entry.

## Contact — `Pages.contact`

- Heading lines rise, lead and the two cards fade up.
- The WhatsApp preview updates live from the form fields.
- Success replaces the form in place and moves focus to its heading.

## Reduced motion and no JavaScript

Every page is complete: no loader (no JavaScript) or a short fade (reduced motion), no smooth scroll, no sticky scroll stages, all text at full opacity, the 3D scene as a single still frame or its poster.
