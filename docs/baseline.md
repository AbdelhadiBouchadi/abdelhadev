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
