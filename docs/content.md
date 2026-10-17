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
| `hms` | HMS | Hospital management system | `[TODO]` | Everything else `[TODO]` |
| `meetai` | MeetAI | AI web app | `[TODO]` | Everything else `[TODO]` |
| `flowshop` | FlowShop | E-commerce | `[TODO]` | Everything else `[TODO]` |
| `cote-royale` | Côte Royale | Website | `[TODO]` | Client permission to name `[TODO]` |

Never mention the internship project or its client.

A project is shown by name on a public page only after the owner confirms permission (Côte Royale first). Until then it is hidden from lists and the sitemap.

## About and experience

Known facts only: from Agadir; freelance full-stack developer (auto-entrepreneur); third-year Computer Engineering student at Karabuk University (named as the institution, never as a location); DentaFlow. Earlier roles and dates are `[TODO]` until the owner supplies them. No claim of full-time availability.

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

Public email, LinkedIn URL, GitHub URL, project details listed as `[TODO]`, real screenshots with seeded data, testimonial wording.
