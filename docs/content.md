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
| `hms` | HMS | Hospital management system | `[TODO]` | A management system for a hospital ophthalmology service: patient data, appointments, eye images and medical records; only the medical staff have access. Built for friends who are residents there. Never name the hospital or the resident, never claim it is in use. Status, stack and year `[TODO]`. |
| `meetai` | MeetAI | AI web app | `[TODO]` | Everything else `[TODO]` |
| `flowshop` | FlowShop | E-commerce | `[TODO]` | Everything else `[TODO]` |
| `cote-royale` | Côte Royale | Website | `[TODO]` | Client permission to name `[TODO]` |

Never mention the internship project or its client.

A project is shown by name on a public page only after the owner confirms permission (Côte Royale first). Until then it is hidden from lists and the sitemap.

## About and experience

The only facts that may be published (supplied by the owner in 06). Everything else stays a visible `[TODO: …]`.

- **Who:** full-stack developer from Agadir, independent (auto-entrepreneur). Freelancer since late 2022, working alone, for French, English and Moroccan clients.
- **Education:** "Formation en génie informatique" / "Computer engineering background" only. The university and the graduation year are never shown. The words "ingénieur", "engineer", "student", "étudiant" and any year of study appear nowhere until the owner confirms his degree status (decision P3).
- **Languages and availability:** French, English and Arabic (Darija), all fluent. Morocco time zone. Remote only, not on site. Open to freelance projects and to a remote position, said without hours or studies ("parlons-en" / "let's talk", decision P11).
- **What he builds, in this order:** (1) management systems for clinics and health services, (2) AI-powered web apps, (3) online shops, (4) websites with a custom admin panel, (5) other web projects ("anything web").
- **Stack:** every day Next.js, TypeScript, tRPC, Drizzle ORM, PostgreSQL (Neon), Better Auth, Arcjet, shadcn/ui. Per project AI SDK, OpenAI API, Shopify headless through its GraphQL API (online shops), WordPress as a CMS when a client insists, GSAP. Exploring Trigger.dev and Browserbase by building a browser-automation app (never presented as a product).
- **Websites:** Next.js with PostgreSQL (Neon) and a custom admin panel so the client manages everything.
- **Process:** he listens first; within 24 hours he turns the notes into a technical plan, models the data and splits the project into small tasks; the quote (devis) arrives 24 to 48 hours after the first conversation (decision P12); after the client accepts and signs, an advance invoice, then development; just before launch, the balance invoice and delivery of everything. The payment percentages are not published.
- **Why clinics:** part of his circle are doctors. He built HMS for a hospital ophthalmology service, for friends who are residents there. DentaFlow was born from his brother's dental clinic, which showed him what dentists need. He wants healthcare staff to save time for what matters.
- **Other client work:** a website with a fully custom admin panel for a festival-organisation company in Morocco.
- **Never publish:** the names of the hospital, of the resident friend, of the festival company, or of the clinic on the about page; the owner's personal email address; any claim that HMS is in use; any claim about income, savings or results for clinics; photos of the owner (decision P9).
- Years of the projects, earlier roles and the CV itself are `[TODO]` until the owner supplies them (the CV is a placeholder file, `src/lib/content/cv.ts`).

## Testimonial

SOS Dental Clinic, Agadir. Role and organisation only, no personal name. The wording of the role and what was delivered are `[TODO]` until the owner confirms. The section renders only when the data says `confirmed: true`.

## Contact

- Channels: the contact form (email through Resend) and WhatsApp. The WhatsApp number and the public email address are in `src/lib/site.ts`, supplied by the owner.
- The process shown: I reply with questions, we talk (about thirty minutes), I model your data and show how it would work, you get a quote for that scope, in stages.
- No reply-time promises.

## Legal

- Footer on every page: `© {year} Abdelhadi Bouchadi`, auto-entrepreneur, and a link to the legal notice. Server-rendered text.
- Legal notice (fr `/mentions-legales`, en `/legal-notice`): publisher (legal name, status, contact email), publication director, host (Vercel, details copied from Vercel's published legal page), intellectual property, personal data for the contact form, cookies and local storage, external links, last updated. No ID, registration or ICE numbers, no street address. `legalReview: "pending"` until the owner confirms.

## Not yet supplied by the owner

Public email (unset until a mailbox exists on the domain), project details and years listed as `[TODO]`, the final CV, real screenshots with seeded data, testimonial wording. Supplied in 06: LinkedIn, GitHub and WhatsApp (`src/lib/site.ts`).
