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

| Slug | Name | Kind | Status | What is known |
|---|---|---|---|---|
| `dentaflow` | DentaFlow | Dental clinic management | Ready for clinics | Agenda, patients, treatments, billing (owner confirms the list); adapted per clinic with its own name, database and deployment; Next.js, TypeScript, tRPC, Drizzle, PostgreSQL (Neon), Better Auth. WhatsApp reminders are not live. |
| `hms` | Ophtachusm | Hospital management system | `[TODO]` | A management system for a hospital ophthalmology service: patient data, appointments, eye images and medical records; only the medical staff have access. Built for friends who are residents there. Date: January 2025 (08a). The display name replaced "HMS" in 08a; the slug `hms` and the `#hms` anchor stay. Never name the hospital or the resident, never claim it is in use. Status and stack `[TODO]`. |
| `meetai` | MeetAI | AI web app | `[TODO]` | Everything else `[TODO]` |
| `cote-royale` | Côte Royale | Website | `[TODO]` | Client permission to name `[TODO]` |

Work page order (08b): DentaFlow, MeetAI, Ophtachusm, the yoga booking platform (from 08c), Côte Royale (`WORK_ORDER` in `src/lib/content/projects.ts`). The e-commerce project left the site in 08b; building online shops stays a service (about, services, contact topics).

Never mention the internship project or its client.

DentaFlow's date is October 2026 (08a). Project dates (month and year) may be published once the owner supplies them; years of experience may not (decision P6).

### Pending projects (not on the work page yet)

Copy comes from the owner's briefing (08c). They are not in `src/lib/content/projects.ts` yet.

- **Yoga session booking platform** (name `[TODO]`): for a client, a friend of a family member. Users book sessions from the available slots; a fully custom admin panel with role-based access (admin, instructors and others) where sessions are created and edited. Stack: Next.js, shadcn/ui, server actions, a data access layer, Prisma, PostgreSQL on Neon, Better Auth. Name, year, client permission and screenshots `[TODO]`.

A project is shown by name on a public page only after the owner confirms permission (Côte Royale first). Until then it is hidden from lists and the sitemap.

## About and experience

The only facts that may be published (supplied by the owner in 06). Everything else stays a visible `[TODO: …]`.

- **Who:** full-stack developer from Agadir, independent (auto-entrepreneur). Freelancer since late 2022, working alone, for French, English and Moroccan clients.
- **Education:** final year of a B.Eng in Computer Engineering (supplied in 08a). On the timeline, "Génie informatique" / "Dernière année de Bachelor of Engineering (B.Eng)" / "Formation" and "Computer engineering" / "Final year of a B.Eng" / "Education" (08a2: a B.Eng is not a French "licence", `docs/french-style.md`). The degree is stated in that education entry only. The university and the graduation year are never shown. The owner is never called "ingénieur", "engineer", "student" or "étudiant" (decision P3).
- **Languages and availability:** French, English and Arabic (Darija), all fluent. Morocco time zone. Remote only, not on site. Open to freelance projects and to a remote position, said without hours or studies ("parlons-en" / "let's talk", decision P11).
- **What he builds, in this order:** (1) management systems for clinics and health services, (2) AI-powered web apps, (3) online shops, (4) websites with a custom admin panel, (5) other web projects ("anything web").
- **Stack:** every day Next.js, TypeScript, tRPC, Drizzle ORM, PostgreSQL (Neon), Better Auth, Arcjet, shadcn/ui. Per project AI SDK, OpenAI API, Shopify headless through its GraphQL API (online shops), WordPress as a CMS when a client insists, GSAP. Exploring Trigger.dev and Browserbase by building a browser-automation app (never presented as a product).
- **Websites:** Next.js with PostgreSQL (Neon) and a custom admin panel so the client manages everything.
- **Process:** he listens first; within 24 hours he turns the notes into a technical plan, models the data and splits the project into small tasks; the quote (devis) arrives 24 to 48 hours after the first conversation (decision P12); after the client accepts and signs, an advance invoice, then development; just before launch, the balance invoice and delivery of everything. The payment percentages are not published.
- **Why clinics:** part of his circle are doctors. He built Ophtachusm for a hospital ophthalmology service, for friends who are residents there. DentaFlow was born from his brother's dental clinic, which showed him what dentists need. He wants healthcare staff to save time for what matters.
- **Other client work:** the Dérive Casablancaise festival left the about timeline in 08b; its name remains only in the hidden `festival` testimonial entry.
- **Never publish:** the names of the hospital, of the resident friend, of any client as a person, or of the clinic on the about page; the private inbox the public email forwards to; any claim that Ophtachusm is in use; any claim about income, savings or results for clinics; photos of the owner (decision P9).
- Earlier roles and the CV itself are `[TODO]` until the owner supplies them (the CV is a placeholder file, `src/lib/content/cv.ts`).

## Screenshots and loops (08b)

- `pnpm media` (`scripts/media.mjs`) reads the owner's originals from `ASSETS_DIR` (environment variable, or the git-ignored `scripts/media.local.json`), writes AVIF and WebP (images) or MP4 and WebM under 1.5 MB with a poster (loops) to `public/work/<slug>/`, and describes them in `src/lib/content/media.manifest.json`. The originals never enter the repository.
- `src/lib/content/media.map.json` is the only place the discovered file names are written: role `work` (the sheet, in order), `tour` (a case study step) or `spare` (never published, with the reason). The owner edits it by hand and runs `pnpm media` again. Alt texts and loop labels are messages at `work.<slug>.media.<n>`.
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
