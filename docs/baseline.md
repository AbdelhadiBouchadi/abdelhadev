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

SEO 66 is expected: `is-crawlable` fails by design while `INDEXABLE` is false (`noindex, nofollow`). Every individual SEO audit that CI asserts passes.

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
| Lighthouse | Accessibility 100, Best Practices at least 95, SEO audits individually while `INDEXABLE` is false |

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
