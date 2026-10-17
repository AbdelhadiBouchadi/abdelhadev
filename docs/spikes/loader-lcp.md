# Spike S3: the loader and LCP

Branch `feat/00-foundation`, 2026-10-17. Throwaway code under `/[locale]/lab/lcp/*`, removed before the branch was finished.

## Question

Does text painted under a covering loader count as LCP, and what does LCP measure on a first visit with the loader versus without? How does 01 keep LCP honest?

## What was built

A port of the prototype's dawn loader (`Loader` in `docs/prototype/assets/site.js`): server-rendered night panel shown by CSS under `html.js`, the dawn glow, the mark with the sun below the horizon, the wordmark letters hidden under `html.motion`, the counter and the bar. It runs on the task registry from `lib/loader.ts` (fonts weight 3, window load weight 2, first-visit floor 1600 ms, ceiling 4500 ms), paints the counter, bar, sun and one letter per tenth of progress, and exits as in the prototype (letters and mark lift, the panel slides up with a curved bottom edge, `ready` is added 0.55 s into the exit).

Under it, the same text hero in three variants, with the real home copy (`h1` at the `h-xl` size and the lead):

- **none**: no loader.
- **covered**: the loader over a hero that is painted normally underneath it.
- **hidden**: the loader over a hero marked `data-intro`, hidden (`visibility: hidden` under `html.motion:not(.ready)`) until the loader exits, as the prototype does for page intros.

## Results

### A PerformanceObserver over 8 s (the ground truth)

Every `largest-contentful-paint` entry, first visit (fresh context, empty `sessionStorage`), 412 x 823, network 150 ms RTT and 1.6 Mbps, CPU slowed 4x.

| Variant | LCP entries | Final LCP |
| --- | --- | --- |
| none | `h1` at 0.70 to 0.73 s | **0.71 s** |
| covered | `h1` at 0.73 to 0.74 s | **0.74 s** |
| hidden | loader counter `000` at 0.69 s, then `h1` at 5.21 to 5.31 s | **5.26 s** |

### Lighthouse (mobile, simulated throttling, 3 runs)

| Variant | LCP (simulated) | LCP (observed) | LCP element named by Lighthouse | Performance |
| --- | --- | --- | --- | --- |
| none | 2.4 to 3.0 s | 0.15 to 0.30 s | the hero `h1` | 94 to 98 |
| covered | 3.3 to 3.5 s | 0.18 to 0.33 s | the hero `h1` | 91 to 92 |
| hidden | 3.3 to 3.5 s | 0.18 s | **the loader counter** | 91 to 92 |

## What this means

1. **Yes: text painted under a covering loader counts as LCP.** Chrome does not consider occlusion. With the hero painted under the overlay, LCP is the hero at first paint, the same as with no loader (0.74 s against 0.71 s).
2. **Hiding the hero until the loader is done costs about 4.5 s of LCP on a first visit** (5.26 s): the hero's first paint becomes the loader's exit, which waits for the 1600 ms floor and real progress on a slow network.
3. **Lighthouse alone does not catch it.** In the hidden variant its trace ends before the loader exits, so it reports the loader's counter (a 1216 px² text node) as LCP and a good number. Its simulated LCP is also driven by font and script downloads rather than by the loader. A Lighthouse LCP budget would pass a page whose real LCP is 5 s.
4. The loader's own elements are poor candidates: the wordmark is SVG paths (not eligible), the counter is small text. They do not mask the problem, they hide it from Lighthouse.
5. The loader adds no LCP cost by itself; the "covered" variant's slightly higher simulated LCP comes from the extra client JavaScript (the loader component and GSAP), about 0.3 s simulated.

## Recommendation for 01

- **Paint the real hero under the overlay.** The loader is a cover, not a gate: the LCP element (the hero heading, or the hero lead if the giant wordmark is not text) must be painted at first paint, at its final position, under the night panel. Never put `data-intro` (or `opacity: 0`, or a mask that clips it to nothing) on the LCP element.
- Page intros start their hidden state only on elements that are not the LCP candidate, or animate the LCP element from a painted state (a transform or a font-variation change such as the hero's `wdth 75 → 100`, which keeps it painted). The prototype's "letters rise through masks" on the hero wordmark needs care in 03: if the wordmark is text, its masked start state may delay LCP; verify it with the observer test below before keeping it.
- **Measure LCP with a PerformanceObserver in Playwright**, as above, on a first visit with throttling, and gate on the final entry (for example "final LCP entry before 1.5 s and its element is the hero"). Keep the Lighthouse LCP as a trend, not as the gate. This is the "measured per S3's method" referenced in `docs/quality.md`.
- Keep the loader's own text out of the candidate set by making the hero bigger than the counter (it is), and keep the loader's counter `aria-hidden` (it is).
