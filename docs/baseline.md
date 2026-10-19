# Performance baseline (00-foundation)

Measured 2026-10-17 on `feat/00-foundation`, so the owner can set budgets (decision: no budget is enforced before it is measured). Nothing here is a gate yet; Lighthouse CI asserts only accessibility 100, CLS at most 0.02 and the individual SEO audits except `is-crawlable`.

## How it was measured

- `pnpm build && pnpm lhci` (config: `lighthouserc.cjs`): Lighthouse 12.6.1, mobile form factor, simulated throttling (150 ms RTT, 1.6 Mbps, 4x CPU), 3 runs per route, median. Medians printed by `node scripts/lh-baseline.mjs`.
- Local machine (Windows 11, Node 24.21), production server on `localhost`. CI runners will differ; re-measure there before setting final numbers.
- The pages are the placeholder pages of this branch: one heading, one sentence, the minimal footer. No header, loader, smooth scroll, GSAP or 3D yet, so these numbers are the shell's floor, not the final site.

## Results

| Route | LCP (simulated) | LCP (observed) | FCP (simulated) | TBT | CLS | JS transfer | Fonts transfer | Perf | A11y | BP | SEO |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/fr` | 2.58 s | 0.13 s | 0.77 s | 47 ms | 0.000 | 154.9 KiB | 185.1 KiB | 97 | 100 | 100 | 66 |
| `/en` | 3.01 s | 0.10 s | 0.76 s | 52 ms | 0.000 | 154.9 KiB | 185.1 KiB | 94 | 100 | 100 | 66 |
| `/fr/projets` | 3.02 s | 0.15 s | 0.77 s | 43 ms | 0.000 | 154.9 KiB | 185.1 KiB | 94 | 100 | 100 | 66 |
| `/fr/mentions-legales` | 3.02 s | 0.14 s | 0.77 s | 65 ms | 0.000 | 154.9 KiB | 185.1 KiB | 94 | 100 | 100 | 66 |

Other medians, identical on every route: CSS 6.1 KiB, HTML 5.5 KiB, Speed Index 0.77 s, Time to Interactive 3.0 s. The LCP element is the lead paragraph on every route.

SEO 66 is expected: `is-crawlable` fails by design outside production (`VERCEL_ENV` is not `production`) (`noindex, nofollow`). Every individual SEO audit that CI asserts passes.

## Reading the numbers

- **Observed LCP equals FCP** (0.10 to 0.15 s): the text paints at once. The **simulated** LCP of 2.6 to 3.0 s is Lighthouse's estimate on a slow phone, where Lighthouse attributes 82 % to "render delay": the page waits on two preloaded font files and the JavaScript before its estimated largest paint.
- **Fonts are the largest transfer (185 KiB).** Bricolage Grotesque with its `opsz` and `wdth` axes is one 129 KiB file; Instrument Sans with `wdth` is 56 KiB. `next/font` only accepts extra axes when the weight is variable, so the full weight range ships (Bricolage 200 to 800 instead of the 500 to 800 the design uses). Options for the owner: keep it; drop the `opsz` axis (the design uses `opsz` 24 to 96 for optical sizing, so this is a visual trade); or self-host a subset file with `next/font/local` and a tool such as `fonttools` limited to the used weight and width ranges (likely the largest saving).
- **JavaScript is the framework floor** (155 KiB transferred on every route: React, Next's App Router, next-intl's client provider and the locale switch). GSAP, Lenis and the loader arrive in 01; the 3D chunk (185 to 243 KiB gzip, measured in `docs/spikes/r3f.md`) is home-only and lazy.
- **Lighthouse can miss LCP regressions caused by the loader** (`docs/spikes/loader-lcp.md`): gate LCP with the PerformanceObserver method from S3, not with Lighthouse alone.

## Proposals for the owner (from docs/quality.md, adjusted to these numbers)

| Metric | Proposal |
| --- | --- |
| LCP, Lighthouse simulated mobile | warn above 3.5 s; trend only, not a gate |
| LCP, S3 method (observer, throttled first visit) | error above 1.5 s, element must be the hero |
| CLS | at most 0.02 (already asserted) |
| TBT | at most 200 ms |
| JavaScript transfer, initial route without the 3D chunk | 155 KiB today; set after 01 adds GSAP and Lenis, then that number + 15 % |
| Fonts transfer | 185 KiB today; decide on the axes above, then that number + 5 % |
| 3D chunk (home only, lazy) | reported separately: 185 KiB gzip with plain three.js, 243 KiB with R3F |
| Lighthouse | Accessibility 100, Best Practices at least 95, SEO audits individually outside production (`VERCEL_ENV` is not `production`) |

## 01-shell (2026-10-17)

Same method and machine as above (`pnpm build && pnpm lhci`, Lighthouse 12.6.1, mobile, simulated throttling, 3 runs, median), on `feat/01-shell`: the loader, curtain, header, mobile pill, cursor, Lenis, the real footer and the legal page. Lighthouse CI assertions (accessibility 100, CLS at most 0.02, the individual SEO audits) pass on every route.

| Route | LCP (simulated) | LCP (observed) | FCP (simulated) | TBT | CLS | JS transfer | Speed Index | TTI | Perf | A11y |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/fr` | 4.05 s | 0.76 s | 0.96 s | 1447 ms | 0.000 | 231.7 KiB | 5.09 s | 5.20 s | 58 | 100 |
| `/en` | 4.04 s | 0.78 s | 0.94 s | 1399 ms | 0.000 | 231.7 KiB | 5.11 s | 5.26 s | 58 | 100 |
| `/fr/projets` | 4.05 s | 0.72 s | 0.91 s | 1449 ms | 0.000 | 231.7 KiB | 5.26 s | 5.21 s | 58 | 100 |
| `/fr/mentions-legales` | 4.07 s | 0.76 s | 0.96 s | 1463 ms | 0.000 | 231.7 KiB | 5.83 s | 5.30 s | 56 | 100 |

The LCP element is the hero text (the lead paragraph on the placeholder pages), painted under the loader as spike S3 recommends.

### Delta from 00

| Metric | 00 | 01 | Delta |
| --- | --- | --- | --- |
| JS transfer | 154.9 KiB | 231.7 KiB | +76.8 KiB |
| TBT (median of medians) | 50 ms | 1448 ms | +1.4 s |
| LCP, simulated | 3.0 s | 4.05 s | +1.0 s |
| LCP, observed | 0.13 s | 0.76 s | +0.6 s |
| Speed Index | 0.77 s | 5.1 to 5.8 s | the overlay covers the page until the loader exits (by design) |
| CLS | 0.000 | 0.000 | none |

**JavaScript delta, by source (gzip):** GSAP with ScrollTrigger, SplitText, CustomEase, DrawSVGPlugin and `@gsap/react` is one 53.1 KiB chunk; Lenis is about 8 KiB (its package's ESM file gzipped, less once minified). GSAP and Lenis together are therefore about 61 KiB, or 80 % of the +76.8 KiB. The remaining 16 KiB is the shell's own client code (loader, transition provider and link, smooth scroll, header, cursor and footer leaves, tone triggers).

**TBT, measured cause.** A CDP profile of a 4x-throttled first load (Playwright, 390 px) puts the long tasks in the hydration commit: react-dom (about 2.0 s of scripting at 4x across the load) running the shell's `useGSAP` layout effects inside it, where GSAP setup (`gsap.context().add`, tween rendering, `gsap.set`) interleaves style writes with the layout reads of `ScrollTrigger.create` and `SplitText`, followed by the loader's per-frame painting (counter text, bar, sun). An idle page afterwards does no work (0 layouts and 0 style recalculations in 2 s). Two attempts did not move the simulated TBT and were reverted: turning off `<Link>` prefetching (1346 ms) and moving the footer motion, the wordmark fit, the tone triggers and the header trigger into idle tasks after hydration (1342 ms). Promoting the loader glow and bar to their own layers is kept (it stops re-rastering a viewport-sized gradient each frame) but did not change TBT either.

**In-browser LCP (S3 method)**, `tests/e2e/lcp.spec.ts` writing `test-results/shell/lcp.json`, 390 px, 150 ms RTT, 1.6 Mbps, CPU 4x. Run alone: first visit 1.04 s, visited load 0.97 s. Run inside the full parallel suite (the file the last run left): 1.17 s and 0.81 s. The hero lead is the LCP element every time, and Chrome reports no LCP entry for the client-side route change. On that profile the loader is up until 6.4 s (first visit) and 6.8 s (visited) when run alone, and 7.9 s and 8.1 s inside the parallel suite: hydration arrives close to the 4.5 s ceiling, then the final push (0.45 s) and the exit (1.45 s) play. With 4x CPU and that network the boot script's 7 s fail-safe fired once in an earlier probe run of the production build.

### Proposals for the owner, updated

| Metric | Proposal |
| --- | --- |
| JavaScript transfer, initial route without the 3D chunk | 232 KiB measured; the 00 rule (+15 %) gives 267 KiB |
| TBT | the 200 ms proposal is not met (about 1.4 s simulated); decide whether to budget it now or after a pass that splits the shell's hydration work |
| LCP, S3 method | 1.04 s first visit on the mobile profile: under the 1.5 s proposal |
| Loader on a slow phone | decide whether the 4.5 s ceiling should include the 1.45 s exit (today the overlay can stay up to about 6 s on the mobile profile) |

## 01b-shell-performance (2026-10-18)

Same machine and tools. Full method and attribution: `docs/spikes/tbt.md`.

**Correction to the 01 section.** The 1.4 s TBT and the 6.4 to 6.8 s overlay above were measured during a slow phase of this machine (idle CPU utility 57 to 72 %, a Windows `dllhost` process using about 0.75 of a core). On the same committed code, `pnpm lhci` measures 79 to 101 ms, and the same build swung from 1837 ms to 266 ms of real TBT within two minutes. Builds are therefore compared **interleaved** (alternating runs against a frozen copy of the `main` build), never minutes apart.

### Before and after (interleaved, same machine)

| Metric | `main` (01) | 01b | Method |
| --- | --- | --- | --- |
| TBT, `/fr`, median | 133 ms (94 to 159) | **104 ms** (83 to 110) | Lighthouse mobile, 7 alternating runs each |
| TBT, all routes | 79 to 101 ms | 79 to 120 ms | `pnpm lhci`, 3 runs per route, not interleaved (within run-to-run spread) |
| LCP, simulated | 3.62 s | 3.62 s | Lighthouse mobile |
| LCP, in-browser (S3 method) | 1.04 s first visit, 0.97 s visited (01, alone) | 0.96 s first visit, 1.12 s visited (inside the parallel suite) | `tests/e2e/lcp.spec.ts`; the hero lead is the LCP element |
| JavaScript transfer, `/fr` | 231.7 KiB | 231.3 KiB | Lighthouse; SplitText now loads after hydration instead of with GSAP, so the total barely moves |
| GSAP chunk (critical path) | 53.1 KB gzip | 48.6 KB gzip | build output; SplitText is a 3.3 KB on-demand chunk, DrawSVGPlugin is no longer loaded |
| `/fr` HTML with RSC payload | 47.6 KB | 42.4 KB | only the `loader` and `common` messages reach the client |
| Overlay gone, normal profile, first visit / visited | 3.50 s / 2.61 s | 3.50 s / 2.61 s | method B unthrottled, median of 5 (floor-bound, unchanged) |
| Overlay gone, 4x CPU and 1.6 Mbps, first visit | 4.90 s (4.72 to 5.14) | 4.91 s (4.79 to 5.52) | method B, 8 alternating pairs, median (range) |
| Overlay gone, font files held 8 s | 6.41 s | **4.76 s** | unthrottled, 3 runs each |
| CLS | 0.000 | 0.000 | Lighthouse |

The loader ceiling now bounds when the exit starts (3300 ms), so a slow task can no longer keep the overlay up past 4.75 s plus main-thread lateness. On the throttled profile the overlay still ends between 4.7 and 5.5 s, because it follows the end of hydration (`docs/spikes/tbt.md`, "What remains").

### Proposals for the owner

| Metric | Proposal |
| --- | --- |
| TBT, Lighthouse mobile | error above 200 ms (all routes measure 79 to 120 ms) |
| JavaScript transfer, initial route without the 3D chunk | 232 KiB measured; 267 KiB (+15 %) |
| LCP, S3 method, first visit | error above 1.5 s, element must be the hero (0.96 to 1.17 s measured) |
| LCP, Lighthouse simulated | trend only (3.62 s, dominated by fonts and script download) |
| Overlay on the throttled profile | record, do not gate locally until measured on CI hardware: here it follows the machine state |

## 02-primitives (2026-10-18)

Same machine and tools. `/fr` uses no primitive except the footer (every page), whose `FooterMotion` was replaced by `SplitReveal` and `Scrub` with the same numbers; the primitives' setup now runs in one task after React's commit instead of inside it (`src/lib/schedule.ts`).

### Interleaved with `main`, `/fr`

Lighthouse mobile through its Node API, a frozen build of `main` (port 3200) and this branch (port 3100) alternating, 7 runs each, two series.

| Series | `main` TBT median (range) | 02 TBT median (range) | JS transfer `main` / 02 | LCP simulated |
| --- | --- | --- | --- | --- |
| 1 | 123 ms (112 to 206) | 126 ms (111 to 585) | 231.3 / 232.6 KiB | 3.63 / 3.63 s |
| 2 (noisier machine phase) | 194 ms (149 to 539) | 188 ms (111 to 334) | 231.3 / 232.6 KiB | 3.63 / 3.63 s |

**Delta:** JavaScript transfer +1.3 KiB on `/fr` (the primitive leaves the footer now uses, `useMotion`, `useReadyGate` and the scheduler, less `FooterMotion`). TBT: no measurable change; within each series the two builds are level, and both series swing with the machine (the two 578 and 585 ms branch runs in series 1 were the first requests to a server that had just started). LCP unchanged.

### `pnpm lhci` (3 runs per route, median)

Run with `--collect.startServerCommand="pnpm start --port 3100"` and the four URLs on port 3100, because a `next dev` server was holding port 3000; the configuration and its assertions are unchanged, and all of them pass.

| Route | LCP (simulated) | FCP | TBT | CLS | JS transfer | Perf | A11y |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/fr` | 3.63 s | 0.78 s | 171 ms | 0.000 | 232.6 KiB | 87 | 100 |
| `/en` | 3.62 s | 0.77 s | 130 ms | 0.000 | 232.6 KiB | 89 | 100 |
| `/fr/projets` | 3.62 s | 0.77 s | 155 ms | 0.000 | 232.6 KiB | 88 | 100 |
| `/fr/mentions-legales` | 3.63 s | 0.78 s | 153 ms | 0.000 | 232.6 KiB | 87 | 100 |

These are higher than the 79 to 120 ms of 01b's `pnpm lhci` run, but the interleaved series above show the same spread on `main`'s own build on the same afternoon: the difference follows the machine, not the branch. All routes stay under the proposed 200 ms TBT and the proposed 267 KiB JavaScript budget.

## 03-home (2026-10-18)

Same machine and tools. `/fr` and `/en` are now the real home page: the hero, the manifesto, the dusk and the featured work, the fixed sky and the plain three.js scene (lazy chunk). Methods: `pnpm lhci` (Lighthouse 12.6.1, mobile, 3 runs, median); the S3 in-browser LCP probe (`tests/e2e/lcp.spec.ts`, 390 px, 150 ms RTT, 1.6 Mbps, CPU 4x); a Playwright probe for JavaScript, the scene chunk, the first frame and the overlay (first visit, normal and the same throttled profile, 3 runs each). This machine swings between runs (see 01b); the throttled numbers below were measured on a quiet machine (CPU about 15 % idle load) and still moved by about 0.3 s between series.

### Measured

| Metric | `/fr` (home) | Note |
| --- | --- | --- |
| JavaScript, initial, without the 3D chunk | about 245.7 KiB transferred (Lighthouse 384.9 KiB minus the chunk); 235.5 KiB gzip of the 13 scripts loaded with WebGL blocked | 02: 232.6 KiB. Other routes: 244.5 KiB (Lighthouse) |
| 3D chunk (home only, lazy) | **139.2 KiB gzip**, 557.2 KiB raw, one chunk | spike S1 measured 184.8 KiB; named imports let three.js tree-shake. Requested after hydration, never without WebGL |
| TBT, Lighthouse | 498 ms `/fr`, 377 ms `/en` | other routes 112 and 139 ms. The largest task (444 ms, simulated) is the scene's first frame: shader compilation and texture upload inside HeroScene's effect |
| LCP, S3 method | **hero intro paragraph**, 1.08 s (fr first visit), 1.08 s (fr visited), 0.98 s (en first), 1.06 s (en visited) | painted under the loader; before the fix in this branch it was revealed by a fade and LCP was 5.1 to 6.0 s |
| LCP, Lighthouse simulated | 3.92 s, the hero intro paragraph | trend only (02: 3.63 s) |
| CLS | Lighthouse 0.000; in-browser 0.0001 at 1440 and 390 (normal); 0.012 at 1440 and 0.015 at 390 (throttled) | the throttled shifts are the web font swap and the first fit, before the intro. The `--wdth` intro itself adds no shift (letter boxes frozen, see HeroWordmark); animated naively it measured 0.058 |
| Scene, first frame (`data-scene="live"`) | 0.79 to 0.97 s normal; 6.36 to 6.51 s throttled | throttled, the chunk arrives during the loader's exit and compiles once the overlay is gone, then fades in |
| Overlay gone, first visit | 3.51 to 3.54 s normal; 5.33 to 5.40 s throttled | 01b: 4.91 s throttled median on the shell alone. The 5 s rule holds unthrottled (`loader.spec.ts`); throttled it is over |
| Lighthouse accessibility | `/fr` 96 (fails the 100 assertion), `/en` 100 | color-contrast on the manifesto's unlit words (WordsLight at 0.14 opacity, 1.32:1), reported, not changed |

### Proposed budgets (for the owner)

| Metric | Proposal |
| --- | --- |
| JavaScript, initial route without the 3D chunk | 280 KiB (245.7 KiB + 15 %) |
| 3D chunk, gzip | 160 KiB (139.2 KiB + 15 %), measured separately, home only |
| TBT, Lighthouse mobile | keep 200 ms for all routes except the home; home 500 ms until the scene's first frame is split (compileAsync, textures uploaded over several frames), then 200 ms |
| LCP, S3 method | error above 1.5 s, element must be the hero text (now 0.98 to 1.08 s) |
| CLS | at most 0.02 (in-browser throttled 0.015 at 390) |
| Scene first frame | record only: it follows the network and never holds the loader past its ceiling |
| Overlay on the throttled profile | record, do not gate locally (it follows the machine, 01b) |
