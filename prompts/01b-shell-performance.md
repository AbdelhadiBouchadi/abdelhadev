# 01b-shell-performance

Branch: `feat/01b-shell-performance`

## Git rules for this run (they override AGENTS.md)

The owner reviews the diff and commits by hand. You do **not** run `git add`, `git commit`, `git push`, `git stash`, `git checkout`, `git reset` or anything that changes branches or history. Leave every change in the working tree. At the end, give `git status --short` and a proposed commit split.

## Before you start (the owner has done this)

`feat/01-shell` is merged into `main` and you are on a new branch `feat/01b-shell-performance` with a clean tree. Check `git status` and `git branch --show-current`; if either is wrong, stop and say so.

## Skills and docs

Run `/skills`. Invoke `gsap-performance`, `gsap-react` and `gsap-scrolltrigger`. Use Context7 for current Next.js 16, next-intl and React guidance on hydration and client boundaries.

## Read first

1. `AGENTS.md`, `docs/decisions.md` (T7), `docs/quality.md`
2. `docs/baseline.md` (the 01 section: TBT, slow-phone loader, JavaScript delta) and `docs/spikes/loader-lcp.md`
3. `src/lib/shell.ts`, `src/lib/gsap.ts`, `src/lib/loader.ts`, `src/lib/motion.ts`, `src/components/layout/*`, `src/primitives/*`, `src/app/[locale]/layout.tsx`

## Goal

The shell from 01 is correct and looks right. It is too heavy for phones: Lighthouse TBT rose from about 50 ms to about 1.4 s, and on the throttled profile (4x CPU, 1.6 Mbps) the overlay stays up for 6.4 to 6.8 s. Find the cause, fix it, and keep every visible behaviour exactly as it is. This is a performance branch: no new features, no visual change.

## Scope

### 1. Diagnose before changing anything

- Record a trace of `/fr` on the production build with the mobile profile (Lighthouse trace, or Chromium DevTools protocol tracing from Playwright), 5 runs, and report the median TBT.
- Attribute the long tasks: which script, which function, what share of the total. Say whether the cost is hydration, forced layout (layout reads interleaved with writes), GSAP/ScrollTrigger setup, Lenis, `inert` toggling on large subtrees, the size of the message payload passed to the client, module evaluation of unused GSAP plugins, or something else. Test each suspect on its own (flip it off, measure); do not guess.
- Write the findings, with numbers, to `docs/spikes/tbt.md` **before** the fixes. Note that 01 already tried turning off link prefetch and moving setup into idle tasks, and neither helped, so the cause is elsewhere.

### 2. Fix the causes you found

Allowed techniques, in the order of least change: pass only the message namespaces each client component needs instead of the whole catalogue; batch layout reads and writes (measure first, then mutate); narrow client boundaries so less hydrates; load plugins and leaves only where they are used (for example the cursor only for fine pointers, loaded dynamically after ready; SplitText and DrawSVG registered by the code that needs them without breaking the "register once in `lib/gsap.ts`" rule, for example through lazy registration functions exported from that file); avoid work during the hydration commit that can wait for `ready`; reduce `ScrollTrigger.refresh()` calls to the necessary ones.

Not allowed: removing or simplifying a behaviour from `docs/choreography.md`, changing a duration or easing, hiding content until ready, or loosening a test. If a fix would change what the user sees, stop and report it instead.

### 3. Loader ceiling includes the exit

`docs/quality.md` says the loader never covers content for more than 5 s. Today the ceiling (4.5 s) is when the exit starts, and the exit adds about 1.45 s. Make the ceiling the moment the exit **starts**, set so that start plus exit stays at or under 5 s (about 3.5 s). Update `LOADER` in `lib/motion.ts`, decision T7 in `docs/decisions.md`, `docs/choreography.md` and the loader spec. The floors (1600 ms first visit, 700 ms route change) do not change. Verify on the throttled profile that the overlay is gone by 5 s.

### 4. Close the gaps 01 listed as not verified

- bfcache: a test that navigates away and back so `pageshow` with `persisted` runs, and asserts the overlay is gone, `inert` is removed and scrolling works. If Chromium in Playwright cannot enable bfcache, say so and test the handler directly.
- `next dev` under StrictMode: run the dev server once, walk through the loader, a route change with the curtain, Back and Forward, and report any double-effect problem (duplicate triggers, listeners, a double curtain).
- Firefox and WebKit: install them with Playwright if the environment allows, and run a smoke spec (loader exits, curtain navigates, header hides, mobile pill works at 390). This is a one-off local run, not a CI job. Report what you could not run.

### 5. Measure and record

Update `docs/baseline.md`: TBT median before and after (same method, same machine), LCP, JavaScript transfer, loader durations on the normal and throttled profiles. Lighthouse CI keeps measuring and asserting only what it asserted before; you do not set budgets. Propose budgets in your reply.

## Decisions already made (do not re-decide)

All of `docs/decisions.md`. The `NEXT_LOCALE` cookie stays (a language preference the visitor can set; the legal notice names it). The reduced-motion global rule stays as it is.

## Out of scope

Page sections, the other primitives, copy, new budgets, new visuals.

## Acceptance

1. Every command in `ci.yml` passes locally, in order. Paste the last lines of each.
2. `docs/spikes/tbt.md` exists with the attribution table and the before/after for every fix.
3. Median TBT on `/fr`, mobile profile: as low as the causes allow, aiming under 200 ms. If something stays above, state what and why.
4. On the 4x-CPU, 1.6 Mbps profile the overlay is gone within 5 s.
5. The motion videos from 01 are re-recorded and show the same behaviour.
6. `git status --short` is shown and nothing was committed or pushed.

## Reply format

As in `AGENTS.md`, plus **Findings** (the attribution table in short), **Measured** (before/after), **Proposed budgets**, and **Proposed commits**.