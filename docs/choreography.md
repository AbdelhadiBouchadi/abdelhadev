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
| Word light | SplitText words, opacity `0.5 → 1`, stagger 0.1, scrubbed (the prototype's 0.14 failed color-contrast, 1.32:1; changed in 03) | statements |
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

- Dawn hero: four concentric arcs rise and settle (2.2 s, stagger 0.14 from the outside); heading lines rise; lead fades. Scroll: the arcs expand and fade.
- Three chapters (200 vh each, sticky stage): the label fades in, the statement's words light up.
- Experience, stack and "Right now" groups fade up on entry.

## Contact — `Pages.contact`

- Heading lines rise, lead and the two cards fade up.
- The WhatsApp preview updates live from the form fields.
- Success replaces the form in place and moves focus to its heading.

## Reduced motion and no JavaScript

Every page is complete: no loader (no JavaScript) or a short fade (reduced motion), no smooth scroll, no sticky scroll stages, all text at full opacity, the 3D scene as a single still frame or its poster.
