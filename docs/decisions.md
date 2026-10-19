# Decisions

Made by the owner. Agents do not re-decide them. To change one, the owner edits this file first.
Status: **Fixed**, **Provisional** (fixed unless the named spike fails), **Open** (do not build around it).

## Product and positioning

| # | Decision | Status |
|---|---|---|
| P1 | Two jobs: win freelance clients and be a professional profile for LinkedIn, job portals and recruiters. | Fixed |
| P2 | Positioning is broad: a full-stack developer who builds web applications people rely on (management systems, AI-powered apps, client platforms, websites). Clinic and hospital software is the strongest proof and appears as featured work, not as the whole message. | Fixed |
| P3 | Based in Agadir, Morocco. The university and the graduation year are not published. The degree is stated only as "final year of a B.Eng in Computer Engineering". The owner is never called ingénieur, engineer, student or étudiant. | Fixed |
| P4 | Clinic offer: DentaFlow is prebuilt and adapted per clinic after a quote (own name, database, deployment). | Fixed |
| P5 | No prices anywhere. The process explains that the quote comes after scoping and data modelling. | Fixed |
| P6 | No years-of-experience claims. No invented metrics, clients, reviews or dates. Update (08a): project dates (month and year) supplied by the owner may be published, for DentaFlow (October 2026) and Ophtachusm (January 2025); years of experience still may not. | Fixed |
| P7 | The internship project and its client are never mentioned. A client project is named on a public page only with the client's permission: `permission: "confirmed"` in `src/lib/content/projects.ts`, read through `publicProjects()` by the work page, its rail and the sitemap. Update (04): the owner cleared Côte Royale; all five projects are `confirmed`, and the field stays as the switch for any future project that is not cleared. | Fixed |
| P8 | DentaFlow WhatsApp reminders are not presented as live. | Fixed |
| P9 | The owner does not appear on camera. Warmth comes from colour, light, copy, motion and the 3D scene. | Fixed |
| P10 | Testimonials show role and organisation only. The SOS Dental Clinic testimonial names no person. No personal name appears in any testimonial, or anywhere in the repository for a client: the testimonial data has no field for one. A testimonial is rendered only once it is `confirmed: true` (`src/lib/content/testimonials.ts`). | Fixed |
| P11 | Availability: open to freelance projects and to a remote position, said without hours or studies. | Fixed |
| P12 | The process may state that the quote arrives 24 to 48 hours after the first conversation: it is how he works, not a reply-time promise. The percentages of the advance and balance invoices are not published. | Fixed |
| P13 | The public email is `contact@abdelhadev.me` (replaces "no public email yet", 08a), in `src/lib/site.ts`, shown in the footer and the legal notice. It forwards to a private inbox that never appears in the repository, the messages, the docs or the tests. | Fixed |
| P14 | French copy is written natively under `docs/french-style.md`, never translated word for word from the English, and `pnpm check:fr` guards it (08a2). The degree is written in French as "Dernière année de Bachelor of Engineering (B.Eng)", never "licence". | Fixed |

## Design

| # | Decision | Status |
|---|---|---|
| D1 | The approved prototype in `docs/prototype/` is the visual spec. Agents port it; they do not redesign it. | Fixed |
| D2 | Concept: an Agadir day. Every page opens at dawn (the loader), lives in sunlit paper, and the evening and night carry the product and the close. | Fixed |
| D3 | Art-directed tones (day and night sections). No theme toggle. The header, mobile nav and cursor follow the section tone. | Fixed |
| D4 | Typefaces: Bricolage Grotesque (display) and Instrument Sans (text), via `next/font/google`. | Fixed |
| D5 | Palette and tokens as listed in `docs/art-direction.md`. Majorelle blue is a spot accent only, never a resting button fill. | Fixed |
| D6 | Soft, rounded shapes (pill buttons, rounded sheets). | Fixed |
| D7 | Brand mark: the sunset (sun on the Atlantic horizon). Source files in `brand/`, wordmark outlined from Bricolage Grotesque Bold. | Fixed |
| D8 | Desktop navigation: wordmark left, pill nav centre (Home, Work, About), Agadir clock and Contact button right. Mobile: wordmark and Contact button on top, floating pill at the bottom (Work, home mark, About). | Fixed |
| D9 | Every primary call to action says "Contact" (FR: "Contact") and goes to the contact page. The contact page offers the email form and WhatsApp. | Fixed |
| D10 | Word light floor: WordsLight's unlit words wait at opacity 0.14 (`REVEAL.wordsFrom`), the prototype value. It was 0.5 from 03 to 07 because 0.14 fails color contrast (1.32:1 on paper); the owner restored 0.14 to match the prototype, since the words are scrolled to full opacity before they are read and are plain, fully opaque text under reduced motion and without JavaScript (asserted in Playwright). The a11y spec excludes only `[data-words-light]` from axe's color-contrast rule. | Fixed |

## Technical

| # | Decision | Status |
|---|---|---|
| T1 | Next.js 16 App Router, React 19, strict TypeScript, Tailwind 4, pnpm, Vercel. | Fixed |
| T2 | next-intl, `fr` default and `en`, `localePrefix: "always"`, localised pathnames (see `docs/architecture.md`). Locale switch is a full page load. Use logical CSS properties for later RTL. | Fixed |
| T3 | No database, no CMS. Structured data in `src/lib/content/`, copy in `messages/*.json`. | Fixed |
| T4 | The Next 16 request interceptor file is `src/proxy.ts` (formerly `middleware.ts`). | Fixed |
| T5 | GSAP (ScrollTrigger, SplitText, CustomEase, DrawSVGPlugin) and Lenis on `gsap.ticker`, as in the prototype. | Fixed |
| T6 | 3D with plain `three` (no React Three Fiber, no drei), one scene on the home page, dynamic import, client only, poster fallback without WebGL and under reduced motion, chunk download started early. Reason: spike S1 (`docs/spikes/r3f.md`). | Fixed |
| T7 | Loader on every page visit: full sequence on the first visit of a session, short sequence on route changes. Progress comes from real tasks (fonts, critical images, the 3D scene), never a timer alone. Floor 1600 ms first visit, 700 ms route change, ceiling 3300 ms: the latest moment the exit starts, so that with the 1.45 s exit the overlay never covers content for more than 5 s, with 250 ms left for a busy main thread (until 01b the ceiling was 4500 ms and marked when the final push began, which let the overlay stay up to about 6.4 s). The real page content (hero included) is painted under the loader overlay, and the content under it is `inert` while it is on screen; it is never hidden until ready, because text painted under the overlay counts as LCP and hiding it did not (spike S3). LCP is checked by an in-browser `PerformanceObserver` measurement in Playwright as well as by Lighthouse. | Fixed |
| T8 | Route transitions are a GSAP curtain (the sun sets on leave, rises on arrival) driven by a `TransitionLink` and a transition provider, using next-intl navigation. Not the View Transitions API. Built to the S2 design (`docs/spikes/route-curtain.md`). | Fixed |
| T9 | Contact form: server action, shared zod schema, honeypot, rate limit, Resend from a verified `abdelhadev.me` domain. WhatsApp composer builds a `wa.me` link from the same fields. | Fixed |
| T10 | Analytics: cookie-free (Plausible or Umami). | Open (before launch) |
| T11 | `cacheComponents` stays off unless the foundation finds a reason to enable it (the old repo showed it makes `notFound()` pages need JavaScript). | Fixed |
| T12 | The contact form's rate limit and bot detection are Arcjet (`@arcjet/next`, about 5 messages an hour per IP address, every automated client refused). If Arcjet itself errors, the form fails open with a log line that holds no personal data. The rate limit is `LIVE`; bot detection ships in `DRY_RUN` (logged in Arcjet, never blocking) and is switched to `LIVE` in `10-launch` after the owner has reviewed the Arcjet dashboard. | Fixed |
| T13 | `CONTACT_DRY_RUN=1` validates and reports success without calling Resend or Arcjet (the Playwright web server sets it). It can never run in production: with `VERCEL_ENV=production` the environment parser refuses it and the server does not start (`src/lib/env.ts`, `src/instrumentation.ts`). | Fixed |
| T14 | No automatic reply to the visitor: the confirmation is on screen only, until the owner decides otherwise. | Fixed |
| T15 | The contact form sends to a private inbox (`CONTACT_TO`, an environment variable) that is never published on the site, in the repo or in a client bundle. Until `abdelhadev.me` is verified in Resend, mail goes out from `Abdelhadev <onboarding@resend.dev>` (`CONTACT_FROM`). | Fixed |
| T16 | The contact email (`src/emails/contact-form.tsx`, sent with a plain-text twin) is for the owner only, so it is always in French, whatever the page language. Its values are copied from the tokens and inlined, because email clients ignore CSS variables. | Fixed |
| T17 | The contact toast (Sonner, mounted only in the contact form) is additive: it repeats the inline confirmation or error line, which stay the accessible, no-JavaScript source of truth. A toast is never the only feedback. | Fixed |

## Lessons from the first attempt (kept so we do not repeat them)

- Budgets must be measured before they become gates. The foundation measures a baseline; the owner sets budgets from it.
- Lighthouse SEO fails by design while the site is `noindex`; gate the individual SEO audits until launch.
- Lenis driven from `gsap.ticker` with `autoRaf: false` and `lagSmoothing(0)` behaved correctly under StrictMode.
- A client-side locale switch re-rendered the root layout and dropped the `html` classes set before paint; the locale switch is a full page load.
- Tooling must never write rules into `AGENTS.md`.

## Branch order

`00-foundation`, `01-shell` (header, nav, footer, loader, curtain, cursor, smooth scroll, legal page), `02-primitives`, `03-home`, `04-work`, `05-case-study`, `06-about`, `07-contact`, `08-copy-and-media` (final FR and EN copy, real screenshots), `09-seo-og-cv`, `10-launch`.

The design lab (`/[locale]/lab`, development and preview only) is removed in 05. Since 04 it keeps only the `LineDraw` block (and the night section the hash-link tests use): the work page uses `MediaReveal` (scrub) and `useScrollSpy`, and their assertions live in `tests/e2e/work.spec.ts`.

## Spikes the foundation settles

| # | Question | Output |
|---|---|---|
| S1 | React Three Fiber on Next 16 and React 19: bundle cost of the lazy chunk, time to first frame, fallback path. | `docs/spikes/r3f.md` |
| S2 | A GSAP curtain route transition with the App Router and next-intl navigation: cover, navigate, arrival, Back and Forward, scroll restoration, focus. | `docs/spikes/route-curtain.md` |
| S3 | Loader and LCP: does text painted under a covering loader count as LCP in Lighthouse, and what does the first visit measure? | `docs/spikes/loader-lcp.md` |
