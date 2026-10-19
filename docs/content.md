# Content

## Positioning

Abdelhadi Bouchadi (brand **Abdelhadev**) is a full-stack developer based in Agadir, Morocco. He builds web applications people rely on every day: management systems, AI-powered apps, client platforms and websites, from the data model to the last screen, with Next.js and TypeScript.

- The home page speaks to everyone who needs serious software built: clinics, companies, startups, recruiters. It does not read as "a clinic software vendor".
- Clinic and hospital software is the strongest proof. It appears as featured work on the home page and as projects on the work page, with DentaFlow as the flagship case study.
- The prototype's copy leans on clinics because DentaFlow was the only detailed project. Final copy rebalances it; the agent writing sections uses `[TODO: …]` keys rather than reusing the prototype's clinic-specific lines as general statements.

## Voice

First person singular. Plain, specific, calm. Say what was built, for whom, with what, and what it changed. No emoji, no exclamation marks, no em dashes, no "passionate", "cutting-edge", "solutions", "synergy", no years of experience. French is written first; English is written, not translated word for word.

## Where copy lives

- Interface strings and page copy: `messages/fr.json`, `messages/en.json`, same keys in both.
- Structured data: `src/lib/content/` (projects, experience, stack), with translatable fields referenced by message keys.
- Identity and channels: `src/lib/site.ts`.
- Unknown facts are `[TODO: …]`; the build lists them and fails on them when `REQUIRE_CONTENT=1` (production, from the launch branch).

## Home beats (copy direction, final wording in 08)

1. Hero: the name, "Full-stack developer, Agadir", the three kinds of software (management systems, AI web apps, client platforms), a one-paragraph promise about careful work in visible stages, "Contact" and "See the work".
2. Manifesto: why people trust him with their data, their schedules and their operations (general, not clinic-only).
3. Dusk: the software keeps working after hours, on infrastructure that belongs to the client.
4. Featured work: DentaFlow as the first featured project, with a link to the case study; later, a second featured project once one has real material.
5. Footer CTA: "Have a project in mind?"

## Projects

Work page order (`WORK_ORDER` in `src/lib/content/projects.ts`): DentaFlow, MeetAI, Ophtachusm, Yoga booking, Côte Royale. All five are `permission: "confirmed"` (decisions P7, P17). The e-commerce project left the site in 08b; building online shops stays a service (about, services, contact topics). Never mention the internship project or its client.

Every fact below comes from the owner or from a code audit (08c). Nothing is strengthened: no "in production", "secure", "fast", users, clients or results.

### Where each fact lives

The sheet has six slots (name, kind, status chip, « L'enjeu » / "The challenge", « Ce que j'ai réalisé » / "What I built", stack). Since 08c the summary is in `projects.<slug>.challenge` and the points in `projects.<slug>.built`, as one paragraph; the stack is in `projects.ts`. Date, role, numbers and the architecture diagram have **no slot** on the sheet and live only here until the owner decides where they go (open question, 08c). Statuses stay `[TODO]`: the owner has not said live, ready or in progress for any project but DentaFlow.

| Slug | Name (FR / EN) | Kind (FR / EN) | Date | Role | Status |
|---|---|---|---|---|---|
| `dentaflow` | DentaFlow | Gestion de cabinet dentaire / Dental clinic management | Octobre 2026 / October 2026 | | `ready` |
| `meetai` | MeetAI | Application web avec agents IA / AI web app | Juin 2025 / June 2025 | Développement et déploiement / Development and deployment | `[TODO]` |
| `hms` | Ophtachusm | Gestion d'un service d'ophtalmologie / Ophthalmology department management | 2024 à 2025 / 2024 to 2025 (P18) | Conception et développement / Design and development | `[TODO]` |
| `yoga-booking` | Réservation de yoga / Yoga booking | Plateforme de réservation / Booking platform | 2025 à 2026 / 2025 to 2026 | Conception et développement / Design and development | `[TODO]` |
| `cote-royale` | Côte Royale | Site vitrine (projet de démonstration) / Showcase site (concept project) | 2025 | Conception et développement / Design and development | `[TODO]` |

### DentaFlow

Agenda, patients, treatments, billing (owner confirms the list); adapted per clinic with its own name, database and deployment; Next.js, TypeScript, tRPC, Drizzle, PostgreSQL (Neon), Better Auth. WhatsApp reminders are not live (P8). Its copy, tour and case study are the owner's to rework; 08c changed only its position, its case hero screen and the home tiles.

### MeetAI

- Described as built and deployed by the owner (P17). Create AI agents, schedule meetings with them, join them on a video call; the agent answers out loud; afterwards the recording, the transcript, a summary and a chat about the meeting.
- Points: meeting lifecycle driven by signed webhooks (upcoming, active, processing, completed); summary as a background job in retryable steps (Inngest); every request scoped to the user on the server, free-plan limits checked before the write; subscription with Polar, in test mode.
- Stack: Next.js 15, React 19, TypeScript, tRPC, Drizzle, Neon (PostgreSQL), Better Auth, Stream (video call and chat; the chip reads "Stream" because chips are not translated), OpenAI, Inngest, Polar, shadcn/ui, Tailwind 4.
- Numbers (no slot): 8 pages, 16 tRPC procedures, 6 tables, 1 background job.
- Diagram (no slot): Navigateur → Next.js et tRPC → Better Auth → Neon (Drizzle); Stream (vidéo, chat) → webhooks signés → Next.js → OpenAI (voix, résumé, chat); Inngest (résumé); Polar (abonnement, test).
- Never write: "en production", users, real payments, the plan prices, the live URL.

### Ophtachusm (`hms`)

- Built for the ophthalmology department of a hospital in Agadir and used by its team for several months (owner, verbatim; P18). Nothing more about the hospital or its current use. The display name replaced "HMS" in 08a; the slug `hms` and the `#hms` anchor stay.
- Patient files, medical records, eye imaging, appointments and statistics; new accounts wait for an administrator's approval before they see any data.
- Points: an appointment calendar that follows how the department works (consultation, specialty, surgery and professor, validated by type); eye images uploaded and annotated by eye, type and description; statistics computed on the server (twelve months, month-over-month change); new accounts approved by an administrator (already said in the summary, so left out of the sheet's paragraph).
- French: « imagerie oculaire » (glossary of `docs/french-style.md`), not « images de l'œil ».
- Stack: Next.js 14, TypeScript, Prisma, MongoDB, Auth.js, UploadThing, Zod, shadcn/ui, Tailwind 3.
- Numbers (no slot): 11 pages, 9 data models, 31 server actions, 1 language (French).
- Diagram (no slot): Navigateur → Next.js (pages serveur et actions) → Auth.js → MongoDB via Prisma; UploadThing pour les images.
- Never write: "sécurisé", "conforme", "données médicales chiffrées", "utilisé aujourd'hui", the hospital's, the professors' or the residents' names.

### Yoga booking (`yoga-booking`)

- For a yoga studio (a client), shown without the studio's name (P17). Participants (« élèves ») browse sessions, book a place or join the waiting list, and cancel before each session's deadline; the studio runs everything from a custom admin panel (sessions, categories, instructors, participants, bookings, a downloadable menu document).
- Roles: the people who log in are the participants and the admin. Instructors are public profiles managed by the admin, not accounts.
- Points: booking checked on the server in one transaction (published session, remaining places, then confirmation or waiting list); automatic waiting list, first in line confirmed when a place frees up, a database constraint prevents duplicates; admin rights checked against the database on every action; bilingual from the data model (FR and EN for every session, category and instructor).
- Stack: Next.js 15, React 19, TypeScript, Tailwind 4, shadcn/ui, Prisma, PostgreSQL (Neon), Better Auth, next-intl, Resend, React Email, UploadThing, Arcjet.
- Numbers (no slot): 11 data models, 2 languages, 23 pages (10 public, 13 admin), about 50 server functions.
- Diagram (no slot): Navigateur (FR/EN) → Next.js (pages serveur et actions) → Better Auth (e-mail, Google, code) → PostgreSQL via Prisma; Resend (e-mails); UploadThing (images, PDF); Arcjet (limitation, bots).
- On the about timeline (client work): « 2025 à 2026 », label « Client ».
- Never write: payments, reminders, reviews, recurring sessions, instructor accounts, "en ligne", the live URL, the studio's name. In English, "student" is never used (it is banned for the owner and the unit test reads every project text), so the studio's « élèves » are "participants".

### Côte Royale

- A concept project for an imaginary perfume brand, with no client (P17). Built to push animation: smooth scrolling, letters that light up as you scroll, pages that blend into one another; fragrances and text managed from Prismic.
- Points: scroll-driven animation (GSAP and ScrollTrigger, Lenis, native page transitions that keep the navigation still); reusable animation components with a simplified version under reduced motion; content driven by Prismic (a home page of six blocks, fragrance pages generated ahead of time and refreshed when an editor publishes); video loaded only when it nears the screen.
- Stack: Next.js 15, React 19, TypeScript, Tailwind 4, GSAP (ScrollTrigger), Lenis, Prismic.
- Numbers (no slot): 3 pages, 3 content types, 6 blocks, 6 animated components, 1 language (English).
- Never write: shop, cart, payment, reviews, "en ligne", any claim of full reduced-motion support, any brand claim beyond "imaginary".

Project dates may be published once the owner supplies them; years of experience may not (decision P6).

## About and experience

The only facts that may be published (supplied by the owner in 06). Everything else stays a visible `[TODO: …]`.

- **Who:** full-stack developer from Agadir, independent (auto-entrepreneur). Freelancer since late 2022, working alone, for French, English and Moroccan clients.
- **Education:** final year of a B.Eng in Computer Engineering (supplied in 08a). On the timeline, "Génie informatique" / "Dernière année de Bachelor of Engineering (B.Eng)" / "Formation" and "Computer engineering" / "Final year of a B.Eng" / "Education" (08a2: a B.Eng is not a French "licence", `docs/french-style.md`). The degree is stated in that education entry only. The university and the graduation year are never shown. The owner is never called "ingénieur", "engineer", "student" or "étudiant" (decision P3).
- **Languages and availability:** French, English and Arabic (Darija), all fluent. Morocco time zone. Remote only, not on site. Open to freelance projects and to a remote position, said without hours or studies ("parlons-en" / "let's talk", decision P11).
- **What he builds, in this order:** (1) management systems for clinics and health services, (2) AI-powered web apps, (3) online shops, (4) websites with a custom admin panel, (5) other web projects ("anything web").
- **Stack:** every day Next.js, TypeScript, tRPC, Drizzle ORM, PostgreSQL (Neon), Better Auth, Arcjet, shadcn/ui. Per project AI SDK, OpenAI API, Shopify headless through its GraphQL API (online shops), WordPress as a CMS when a client insists, GSAP. Exploring Trigger.dev and Browserbase by building a browser-automation app (never presented as a product).
- **Websites:** Next.js with PostgreSQL (Neon) and a custom admin panel so the client manages everything.
- **Process:** he listens first; within 24 hours he turns the notes into a technical plan, models the data and splits the project into small tasks; the quote (devis) arrives 24 to 48 hours after the first conversation (decision P12); after the client accepts and signs, an advance invoice, then development; just before launch, the balance invoice and delivery of everything. The payment percentages are not published.
- **Why clinics:** part of his circle are doctors. He built Ophtachusm for a hospital ophthalmology department in Agadir, for friends who are residents there; its team used it for several months (P18). DentaFlow was born from his brother's dental clinic, which showed him what dentists need. He wants healthcare staff to save time for what matters.
- **Other client work:** the Dérive Casablancaise festival left the about timeline in 08b; its name remains only in the hidden `festival` testimonial entry.
- **Never publish:** the names of the hospital, of the resident friend, of any client as a person, or of the clinic on the about page; the private inbox the public email forwards to; any claim that Ophtachusm is in use today; any claim about income, savings or results for clinics; photos of the owner (decision P9).
- Earlier roles and the CV itself are `[TODO]` until the owner supplies them (the CV is a placeholder file, `src/lib/content/cv.ts`).

## Screenshots and loops (08b)

- `pnpm media` (`scripts/media.mjs`) reads the owner's originals from `ASSETS_DIR` (environment variable, or the git-ignored `scripts/media.local.json`), writes AVIF and WebP (images) or MP4 and WebM under 1.5 MB with a poster (loops) to `public/work/<slug>/`, and describes them in `src/lib/content/media.manifest.json`. The originals never enter the repository.
- `src/lib/content/media.map.json` is the only place the discovered file names are written: role `work` (the sheet, in order), `tour` (a case study step), `hero` (08c: `place: "case"` opens the case study, `place: "home"` fills the home featured tiles in order) or `spare` (never published, with the reason). DentaFlow's case hero is the dashboard (the whole product at a glance, amounts masked); the home tiles are the calendar, a patient file, the odontogram and the documents.
- A source wider than 1440 px also gets one variant at its own width, capped at 2400 px, for dense screens (08c). The owner edits it by hand and runs `pnpm media` again. Alt texts and loop labels are messages at `work.<slug>.media.<n>`.
- Never published (`spare`): a price or a plan price of a product the owner sells (P5), the owner's photo (P9), anyone else's face except in Côte Royale's own campaign, real email addresses, phone numbers or names of staff and patients (the owner's own email only as truncated in an app sidebar). What the owner allowed in 08b is in `docs/decisions.md` (P15).
- A capture taller than it is wide is cut to a square from the top: only that part is published and reviewed.

## Testimonials

`src/lib/content/testimonials.ts`: `{ id, role, organisation, text, confirmed }`, every text through `messages testimonials.<id>.*`, validated with zod. There is no field for a person's name (decision P10): a testimonial shows role and organisation only, and no client's personal name is ever put in the repository.

- Two entries, both `confirmed: false`: `sos-dental` (SOS Dental Clinic, Agadir) and `festival` (Dérive Casablancaise). Role and text are placeholders until the owner pastes the real, approved wording. Praise is never written by an agent.
- Confirmed-only rendering: `publicTestimonials()` returns the confirmed entries, and the home section (between the featured work and the footer call to action) renders nothing at all while there are none. The build report ignores the placeholders of unconfirmed entries (they never ship) and lists any placeholder left in a confirmed one.

## Contact

- Channels: the contact form (email through Resend) and WhatsApp. The WhatsApp number and the public email address (`contact@abdelhadev.me`, decision P13, shown in the footer and the legal notice) are in `src/lib/site.ts`, supplied by the owner.
- The form sends to a private inbox (`CONTACT_TO`) that is never published. Its topics follow what he builds: clinic or health-service management software, an AI-powered web app, an online shop, a website with an admin panel, something else.
- The process shown is the about page's own (`about.process`, steps 1 to 4, read from the same messages): he listens; within 24 hours he turns the notes into a technical plan, models the data and splits the project into tasks; the quote arrives 24 to 48 hours after the first conversation; after acceptance and signature, an advance invoice, then development. The about page adds the last step: the balance invoice and delivery. No payment percentages (decision P12).
- The form confirmation is on screen only ("Message sent"). There is no automatic email to the visitor yet.
- No reply-time promises.

## Legal

- Footer on every page: `© {year} Abdelhadi Bouchadi`, auto-entrepreneur, and a link to the legal notice. Server-rendered text.
- Legal notice (fr `/mentions-legales`, en `/legal-notice`): publisher (legal name, status, contact email), publication director, host (Vercel, details copied from Vercel's published legal page), intellectual property, personal data for the contact form, cookies and local storage, external links, last updated. No ID, registration or ICE numbers, no street address. `legalReview: "pending"` until the owner confirms.

## Not yet supplied by the owner

Project details and years listed as `[TODO]`, the final CV, real screenshots with seeded data, testimonial wording. Supplied in 06: LinkedIn, GitHub and WhatsApp (`src/lib/site.ts`).
