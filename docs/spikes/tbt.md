# Spike: TBT and the slow-phone loader (01b)

Branch `feat/01b-shell-performance`, 2026-10-17 and 18. Every number in sections 1 to 4 was measured on the unchanged `main` (01 merged) before any code changed; this file was written up after the fixes, with their results in section 5.

## Question

`docs/baseline.md` (01) recorded a Lighthouse TBT of about 1.4 s on every route (00: about 50 ms) and, on the throttled profile, a loader overlay that stayed up for 6.4 to 6.8 s. What causes it, and what fixes it without changing what the visitor sees?

## Methods

- **A. Lighthouse**, as in the baseline: Lighthouse 12.6.1, default mobile profile (simulated 150 ms RTT, 1.6 Mbps, 4x CPU), production build on localhost. `pnpm lhci` (3 runs per route) and the same Lighthouse through its Node API for N runs of `/fr`.
- **B. Real throttling** with Playwright and CDP: 390 x 844, 150 ms RTT, 1.6 Mbps, CPU 4x. A `longtask` PerformanceObserver gives the real TBT (sum of each task's time over 50 ms); a CPU profile gives JavaScript self time per function; the html classes give when the intro starts (`ready`) and when the overlay is gone (`loader-off`).
- **C. DevTools trace** (same profile): each task over 50 ms broken into script evaluation, function calls, style recalculation and layout, with the JavaScript frame that forced each one.
- **Interleaved A/B**: when comparing builds, a frozen copy of the `main` build was served next to the new one and runs alternated between them, so both see the same machine state (section 3 explains why that was necessary).

## 1. The 1.4 s does not reproduce on the committed code

| Measurement (unchanged `main`) | Result |
| --- | --- |
| `pnpm lhci`, 3 runs per route | TBT `/fr` 98 ms, `/en` 79 ms, `/fr/projets` 85 ms, `/fr/mentions-legales` 101 ms |
| Lighthouse, `/fr`, 5 runs | 571, 112, 107, 140, 157 ms: **median 140 ms** |
| The same with 10 of the 12 CPU threads busy (synthetic load) | 124, 116, 114 ms: median 116 ms |
| Method B, `/fr` first visit, 5 runs | real TBT 270, 235, 188, 182, 162 ms: median 188 ms; overlay gone 4.71 to 4.88 s |

So the 1.4 s is not a property of the code as merged, and plain CPU contention from other processes does not inflate it either.

## 2. Where the main-thread time goes (method C, first visit, 4x CPU)

| Starts at | Duration | What | Owner |
| --- | --- | --- | --- |
| 0.55 s | 51 ms | first style recalculation of the parsed page | browser |
| 0.63 s | 127 ms | first layout and paint | browser |
| 2.27 s | 150 ms | evaluation of the react-dom chunk (72 KB gzip) | framework |
| 2.47 s | 109 ms | React hydration render | framework |
| 2.71 s | 289 ms | React hydration commit, which runs the shell's layout effects. Inside it: a style recalculation forced by GSAP's first `getComputedStyle` (42 to 78 ms), FitText's read-write-read-write (25 ms), ScrollTrigger's scroll and viewport reads (about 30 ms), Lenis reading `scrollY` (16 ms) | framework, shell |
| 3.00 s | 80 ms | the first GSAP ticker frame (loader painting, tweens) | shell |
| 3.08 s | 80 ms | React passive effects | framework |

Roughly 60 % of the long-task time is React itself (evaluating react-dom, hydrating, committing). The shell's share is the setup inside the commit (about 110 to 150 ms of forced style and layout plus GSAP's own JavaScript) and the loader's first frame. The idle page afterwards does no work. The message payload is small (about 6 KB per locale in the RSC payload) and the `inert` toggle touches four elements.

### Each suspect on its own (method B, 9 runs each, flipped off in a temporary build)

| Variant | Real TBT, median | JS self time, median | Note |
| --- | --- | --- | --- |
| baseline (start of the series) | 300 ms | 1065 ms | |
| only `loader` and `common` messages on the client | 262 ms | 1034 ms | |
| no Lenis | 246 ms | 1023 ms | |
| no `inert` toggling | 274 ms | 981 ms | |
| no Loader GSAP setup | 257 ms | 832 ms | the overlay then never exits (the boot fail-safe lifts it at 7 s); the largest JavaScript share |
| no footer motion (SplitText) | 253 ms | 967 ms | |
| no tone triggers, no header trigger | 262 ms | 1012 ms | |
| no FitText | 236 ms | 951 ms | |
| no DrawSVGPlugin import | 265 ms | 1000 ms | |
| no cursor, no magnetic | 530 ms | 1698 ms | measured in a slow phase, not comparable |
| loader paints only the counter | 595 ms | 1713 ms | measured in a slow phase, not comparable |
| baseline (end of the same series) | **949 ms** | **2108 ms** | same code as the first row |

No suspect moves TBT by more than the spread between runs. The Loader's own setup is the largest JavaScript cost (about 230 ms at 4x), and it cannot go: it drives what is on screen at that moment. 01 had already ruled out link prefetching and moving setup into idle tasks.

## 3. The cause of the recorded numbers: the measuring machine

The last row of the table above is the same build as the first, measured half an hour later: TBT 949 ms instead of 300 ms. Further checks:

- Per-run real TBT for identical code ranged from **180 ms to 1964 ms** in one interleaved series.
- Within two minutes, `main` measured 1837 ms then 266 ms (overlay 6.97 s, then 4.85 s).
- In a slow phase, the unchanged code reproduces the 01 numbers exactly: real TBT about 1.8 s and the overlay gone at 6.7 s (median of 6 runs).
- With nothing of ours running, the machine's CPU utility was 57 to 72 %. A Windows COM surrogate (`dllhost`) was using about 0.75 of a core continuously (about 2600 CPU seconds over 70 minutes).
- In slow runs the same functions simply cost about twice as much; no extra code runs. The slow phase stretches React's commit into one task of 300 to 940 ms.

**Finding: the 1.4 s TBT and the 6.4 to 6.8 s overlay in `docs/baseline.md` were measured during a slow phase of this machine.** Lighthouse's simulated TBT multiplies what the host actually observed, so it inherits that slowness. Anyone measuring locally should check the machine's idle load first and compare builds interleaved, never minutes apart.

## 4. The overlay on a slow phone (before any change)

The loader was ready at the 4500 ms ceiling at the latest, but then played the 0.45 s final push and the 1.45 s exit, so a slow task kept the overlay up until about 6.4 s (`docs/quality.md` allows 5 s). With the font files held for 8 s (CPU unthrottled), `main` lifted the overlay at 6.41, 6.41 and 6.42 s.

## 5. Fixes and their measured effect

| Fix | Change | Measured |
| --- | --- | --- |
| Client messages | `NextIntlClientProvider` gets only the `loader` and `common` namespaces (`src/i18n/client-messages.ts`; a unit test fails when a Client Component uses another one) | `/fr` HTML with the RSC payload: 47.6 KB → 42.4 KB |
| Lazy plugins | SplitText and DrawSVGPlugin are imported and registered on first use by `loadSplitText()` and `loadDrawSVG()` in `lib/gsap.ts` (still the only place plugins are registered); FooterMotion awaits SplitText | GSAP chunk 53.1 KB → 48.6 KB gzip; SplitText (3.3 KB) loads after hydration; DrawSVGPlugin no longer loads |
| FitText | reads width, room and current size, then writes once (a single line scales linearly, letter spacing is in em) instead of writing a 100 px probe and reading again | one forced layout less per fit; fitted sizes match the old method within 0.12 px at 360, 390, 430 and 1440 px |
| Loader ceiling | `LOADER.ceilingMs` = 3300 is the latest moment the exit starts; the registry stops waiting at 2850 ms so the final push still plays; ceiling plus exit = 4.75 s, leaving 250 ms for a busy main thread | fonts held 8 s: overlay gone at 4.76, 4.77 and 4.78 s (`main`: 6.41 s) |

**Combined, interleaved with `main`:**

| | `main` | after |
| --- | --- | --- |
| Lighthouse TBT, `/fr`, 7 runs each, alternating | **133 ms** (94 to 159) | **104 ms** (83 to 110) |
| Lighthouse LCP, `/fr` (simulated) | 3.62 s | 3.62 s |
| Real TBT, 12 alternating pairs, first visit: 25th percentile / median | 316 / 389 ms | 250 / 400 ms |
| Real TBT, 12 alternating pairs, visited: 25th percentile / median | 321 / 927 ms | 232 / 630 ms |
| Overlay gone, normal profile, first visit (median of 5) | 3.50 s | 3.50 s |
| Overlay gone, 4x CPU and 1.6 Mbps, 8 alternating pairs: median (range) | 4.90 s (4.72 to 5.14) | 4.91 s (4.79 to 5.52) |

The 25th percentile shows the machine's quiet runs, where the difference is visible; the medians are dominated by slow phases.

### Tried and reverted

- **One `ScrollTrigger.refresh()` per cycle** (a route arrival refreshes under the panel and again when the loader finishes). The second one is needed: while the shell is busy `.lenis-stopped` hides the scrollbar, and when Lenis starts the scrollbar comes back and narrows the page on systems with classic scrollbars. A comment in `Loader.tsx` now says so.
- **Running non-urgent leaves in a task after the commit** (footer motion, header and tone triggers, magnetic, cursor, FitText). The commit lost FitText's and ScrollTrigger's forced layouts, but a three-way interleaved series (10 rounds) showed no gain: 25th percentile / median TBT 346 / 570 ms against 268 / 463 ms for the other fixes alone. Reverted, which agrees with 01's result for idle tasks.
- **Loading the cursor dynamically** was not done. Its setup is one `matchMedia` check on touch devices, so it costs nothing on the profile in question, and its flip-off measurement fell into a slow phase.

## What remains

- Lighthouse TBT on `/fr` is about 100 ms, under the 200 ms proposal. What is left is mostly React's hydration of the shell: evaluating react-dom, the render and the commit (about 60 % of the long-task time at 4x). Shrinking it further means hydrating less (fewer or smaller client components in the layout), which is a structural change for a later branch.
- On the 4x CPU and 1.6 Mbps profile the overlay is scheduled to be gone by 4.75 s, but in practice it ends between 4.7 and 5.5 s. That time follows the end of hydration, and after the ceiling the 0.45 s push and the 1.45 s exit still have to play. Guaranteeing 5 s on that profile would mean shortening the choreography or hydrating faster; neither was in scope.
- A real bfcache restore could not be tested. Playwright's Chromium reports `BackForwardCacheDisabledForDelegate` even with `--disable-back-forward-cache` removed, on any site; Firefox and WebKit under Playwright reloaded the page instead of restoring it. `tests/e2e/bfcache.spec.ts` drives the `pageshow` handler directly.
