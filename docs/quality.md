# Quality

## Commands (created in 00-foundation, run in this order by CI)

| Command | Does |
|---|---|
| `pnpm install --frozen-lockfile` | install |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint flat config with import boundaries, max warnings 0 |
| `pnpm format:check` | Prettier |
| `pnpm check:tokens` | no colour literals outside `src/styles/`; no easing or duration literals outside `src/lib/motion.ts` and the CSS tokens; no `rounded-*` value outside the token scale |
| `pnpm check:i18n` | `fr.json` and `en.json` have identical keys and no empty values; no price words or currency symbols; `[TODO` allowed in development only |
| `pnpm test` | Vitest |
| `pnpm build` | production build; lists every `[TODO` in content and `site.ts`, and fails on them when `REQUIRE_CONTENT=1` |
| `pnpm test:e2e` | Playwright suites below |
| `pnpm lhci` | Lighthouse CI against the production build |

CI: two jobs on every pull request, `check-build-e2e` (with a secret scan) and `lighthouse`. Both required.

## Playwright suites

- Responsive: every route, both locales, at 360, 390, 430 and 1440 px. No horizontal overflow, primary tap targets at least 44 px, screenshots saved.
- Accessibility: axe with no serious or critical violation on every route, after the loader has finished, in day and night sections. Skip link, visible focus, one `h1`, `lang` matches the locale.
- No JavaScript: content, footer legal name and navigation work without scripts; the loader is not shown.
- Reduced motion: nothing hidden, no smooth scroll, loader fades.
- Loader: it finishes before the ceiling, and it never covers content for more than 5 s.
- Legal: the raw HTML of every route contains `Abdelhadi Bouchadi` in the footer.
- Motion evidence (UI branches): short videos of the listed interactions in `test-results/motion/`.

## Budgets

Set by the owner after the foundation measures a baseline (decision lesson: never gate on an unmeasured number). Starting proposals for the owner:

| Metric | Proposal |
|---|---|
| LCP (lab, mobile) | warn above 2.5 s, error above 3.5 s, measured per S3's method |
| CLS | at most 0.02 |
| TBT | at most 200 ms |
| JavaScript, initial route without the 3D chunk | measured in 00, then baseline + 15 % |
| 3D chunk (home only, lazy) | measured in 00 and reported separately |
| Lighthouse | Accessibility 100, Best Practices at least 95, SEO audits individually (not the category) while `INDEXABLE` is false |

## Security

Secret scan in CI. Security headers in `next.config.ts` (content type, referrer policy, permissions policy, frame ancestors). A strict CSP with hashes for the boot script lands before launch.
