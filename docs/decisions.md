# Decisions

Made by the owner. Agents do not re-decide them. To change one, the owner edits this file first.
Status: **Fixed**, **Provisional** (fixed unless the named spike fails), **Open** (do not build around it).

## Product and positioning

| # | Decision | Status |
|---|---|---|
| P1 | Two jobs: win freelance clients and be a professional profile for LinkedIn, job portals and recruiters. | Fixed |
| P2 | Positioning is broad: a full-stack developer who builds web applications people rely on (management systems, AI-powered apps, client platforms, websites). Clinic and hospital software is the strongest proof and appears as featured work, not as the whole message. | Fixed |
| P3 | Based in Agadir, Morocco. Karabuk is never shown as a location; the degree names the university only on the about page and the CV. | Fixed |
| P4 | Clinic offer: DentaFlow is prebuilt and adapted per clinic after a quote (own name, database, deployment). | Fixed |
| P5 | No prices anywhere. The process explains that the quote comes after scoping and data modelling. | Fixed |
| P6 | No years-of-experience claims. No invented metrics, clients, reviews or dates. | Fixed |
| P7 | The internship project and its client are never mentioned. | Fixed |
| P8 | DentaFlow WhatsApp reminders are not presented as live. | Fixed |
| P9 | The owner does not appear on camera. Warmth comes from colour, light, copy, motion and the 3D scene. | Fixed |
| P10 | Testimonials show role and organisation only. The SOS Dental Clinic testimonial names no person. | Fixed |

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

## Technical

| # | Decision | Status |
|---|---|---|
| T1 | Next.js 16 App Router, React 19, strict TypeScript, Tailwind 4, pnpm, Vercel. | Fixed |
| T2 | next-intl, `fr` default and `en`, `localePrefix: "always"`, localised pathnames (see `docs/architecture.md`). Locale switch is a full page load. Use logical CSS properties for later RTL. | Fixed |
| T3 | No database, no CMS. Structured data in `src/lib/content/`, copy in `messages/*.json`. | Fixed |
| T4 | The Next 16 request interceptor file is `src/proxy.ts` (formerly `middleware.ts`). | Fixed |
| T5 | GSAP (ScrollTrigger, SplitText, CustomEase, DrawSVGPlugin) and Lenis on `gsap.ticker`, as in the prototype. | Fixed |
| T6 | 3D with React Three Fiber and drei, one scene on the home page, dynamic import, client only, poster fallback without WebGL and under reduced motion. | Provisional (spike S1) |
| T7 | Loader on every page visit: full sequence on the first visit of a session, short sequence on route changes. Progress comes from real tasks (fonts, critical images, the 3D scene), never a timer alone. Floor 1600 ms first visit, 700 ms route change, ceiling 4500 ms. | Fixed |
| T8 | Route transitions are a GSAP curtain (the sun sets on leave, rises on arrival) driven by a `TransitionLink` and a transition provider, using next-intl navigation. Not the View Transitions API. | Provisional (spike S2) |
| T9 | Contact form: server action, shared zod schema, honeypot, rate limit, Resend from a verified `abdelhadev.me` domain. WhatsApp composer builds a `wa.me` link from the same fields. | Fixed |
| T10 | Analytics: cookie-free (Plausible or Umami). | Open (before launch) |
| T11 | `cacheComponents` stays off unless the foundation finds a reason to enable it (the old repo showed it makes `notFound()` pages need JavaScript). | Fixed |

## Lessons from the first attempt (kept so we do not repeat them)

- Budgets must be measured before they become gates. The foundation measures a baseline; the owner sets budgets from it.
- Lighthouse SEO fails by design while the site is `noindex`; gate the individual SEO audits until launch.
- Lenis driven from `gsap.ticker` with `autoRaf: false` and `lagSmoothing(0)` behaved correctly under StrictMode.
- A client-side locale switch re-rendered the root layout and dropped the `html` classes set before paint; the locale switch is a full page load.
- Tooling must never write rules into `AGENTS.md`.

## Branch order

`00-foundation`, `01-shell` (header, nav, footer, loader, curtain, cursor, smooth scroll, legal page), `02-primitives`, `03-home`, `04-work`, `05-case-study`, `06-about`, `07-contact`, `08-copy-and-media` (final FR and EN copy, real screenshots), `09-seo-og-cv`, `10-launch`.

## Spikes the foundation settles

| # | Question | Output |
|---|---|---|
| S1 | React Three Fiber on Next 16 and React 19: bundle cost of the lazy chunk, time to first frame, fallback path. | `docs/spikes/r3f.md` |
| S2 | A GSAP curtain route transition with the App Router and next-intl navigation: cover, navigate, arrival, Back and Forward, scroll restoration, focus. | `docs/spikes/route-curtain.md` |
| S3 | Loader and LCP: does text painted under a covering loader count as LCP in Lighthouse, and what does the first visit measure? | `docs/spikes/loader-lcp.md` |
