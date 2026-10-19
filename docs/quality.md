# Quality

## Commands (run in this order by CI)

| Command | Does |
|---|---|
| `pnpm install --frozen-lockfile` | install |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint flat config with import boundaries, max warnings 0 |
| `pnpm format:check` | Prettier |
| `pnpm check:tokens` | no colour literals outside `src/styles/`; no easing or duration literals outside `src/lib/motion.ts` and the CSS tokens; no `rounded-*` value outside the token scale |
| `pnpm check:i18n` | `fr.json` and `en.json` have identical keys and no empty values; no price words or currency symbols; `[TODO` allowed in development only |
| `pnpm check:fr` | `fr.json` never uses a phrase `docs/french-style.md` bans (fails, naming the key and the phrase); a regular space before `:` `;` `?` `!` is a warning |
| `pnpm check:comments` | comments in `src`, `tests` and `scripts` never narrate the repository's history (who asked for what, prompts, build numbers, decision ids) and hold no emoji (fails); filler words and banners are warnings |
| `pnpm test` | Vitest |
| `pnpm build` | production build; lists every `[TODO` in content and `site.ts`, and fails on them when `REQUIRE_CONTENT=1` |
| `pnpm test:e2e` | Playwright, the CI suite below (390 and 1440, no motion evidence) |
| `pnpm lhci` | Lighthouse CI against the production build; on failure CI prints every failing accessibility audit with its elements and values (`node scripts/lh-failures.mjs`) and uploads `.lighthouseci/reports` |

Local only, not in CI: `pnpm test:e2e:full` (the CI suite plus responsive and accessibility at 360 and 430) and `pnpm test:motion` (the motion evidence). Run both before handing over a UI branch.

CI: one job on every pull request, `check-build-smoke` (with a secret scan): the static checks, unit tests, the build and a Playwright smoke (foundation, no JavaScript, a11y) at 1440. The full ci suite and Lighthouse run in `e2e-full.yml`, on `main`, weekly and on demand.

## Playwright suites

Three entry points share one configuration (`playwright.config.ts`, `e2eConfig(suite)`):

| Suite | Command | Where | Runs |
| --- | --- | --- | --- |
| ci | `pnpm test:e2e` | CI and local | every behaviour spec at 390 and 1440 (Playwright's default worker count in CI, browsers cached per Playwright version) |
| full | `pnpm test:e2e:full` | local | the ci suite, plus responsive and accessibility at 360 and 430 |
| motion | `pnpm test:motion` | local | the motion evidence (videos and screenshots in `test-results/motion/`), at 1440, one worker |

- Responsive: every route, both locales, at 390 and 1440 px in CI, and also 360 and 430 px in the full suite. No horizontal overflow, primary tap targets at least 44 px, screenshots saved.
- Accessibility: axe with no serious or critical violation on every route, after the loader has finished, in day and night sections (390 and 1440 in CI, also 360 and 430 in the full suite). Skip link, visible focus, one `h1`, `lang` matches the locale.
- No JavaScript: content, footer legal name and navigation work without scripts; the loader is not shown.
- Reduced motion: nothing hidden, no smooth scroll, loader fades.
- Loader: it finishes before the ceiling, and it never covers content for more than 5 s.
- Legal: the raw HTML of every route contains `Abdelhadi Bouchadi` in the footer.
- Motion evidence (UI branches): short videos of the listed interactions in `test-results/motion/`, recorded with `pnpm test:motion` (not in CI: they assert nothing and record video with software WebGL, which made them the slowest and least stable part of the CI run).

## Budgets

I set them after a baseline is measured (decision lesson: never gate on an unmeasured number). Starting proposals:

| Metric | Proposal |
|---|---|
| LCP (lab, mobile) | warn above 2.5 s, error above 3.5 s, measured per S3's method |
| CLS | at most 0.02 |
| TBT | at most 200 ms |
| JavaScript, initial route without the 3D chunk | measured in the baseline, then baseline + 15 % |
| 3D chunk (home only, lazy) | measured in the baseline and reported separately |
| Lighthouse | Accessibility 100, Best Practices at least 95, SEO audits individually (not the category) outside production (`VERCEL_ENV` is not `production`) |

## Security

Secret scan in CI. Security headers in `next.config.ts` (content type, referrer policy, permissions policy, frame ancestors). A strict CSP with hashes for the boot script lands before launch.
