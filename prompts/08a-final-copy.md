# 08a-final-copy

Branch: `feat/08a-final-copy`

## Git rules for this run (they override AGENTS.md)

The owner reviews the diff and commits by hand. You do **not** run `git add`, `git commit`, `git push`, `git stash`, `git checkout`, `git reset` or anything that changes branches or history. Leave every change in the working tree. At the end, give `git status --short` and a proposed commit split.

## Lean testing policy (applies to this run even if AGENTS.md does not say so yet)

The owner's machine is slow and every full run costs time and tokens. Pull requests run only a small smoke in CI; the full suite runs separately.

- While iterating: `pnpm typecheck` and the single spec you are working on, on one project (`--project=1440`, then once on `--project=390`).
- Before replying, run only: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm check:tokens`, `pnpm check:i18n`, `pnpm test`, `pnpm build`, the specs this branch touches (`about.spec.ts`, and the home spec if you changed the home page) at 390 and 1440, and the three pull-request smoke specs (`foundation`, `no-js`, `a11y`) at 1440 only, because the footer and the home page change.
- Do **not** run the full `pnpm test:e2e` and do **not** run `pnpm lhci`. List them under "Not verified" as "runs in e2e-full".
- Never re-run something that already passed unless you changed code that it covers. No exploratory measurements, traces, cross-browser runs or repeat-each loops.
- Motion evidence is capped: at most one still of the testimonials section (see Step C) and one of the about timeline, at 1440.
- Keep your reply short: no file-by-file narration, no pasted command output beyond the last line of each check.
- Never report a gate as passing that you did not run.

## Before you start (the owner has done this)

`feat/07-contact` is merged into `main`. You are on a new branch `feat/08a-final-copy` with a clean tree. Check `git status` and `git branch --show-current`; if either is wrong, stop and say so.

## Skills and docs

Run `/skills`. Invoke `frontend-design`.

## Read first

1. `AGENTS.md`, `docs/decisions.md`, `docs/content.md`, `docs/primitives.md`
2. `src/lib/site.ts`, `src/lib/content/` (including `todoReport()`), `messages/fr.json`, `messages/en.json`, the about, home and legal sections, the footer, `tests/e2e/about.spec.ts`

## Goal

Turn the working copy into final copy wherever the owner has now supplied the facts, show the real public email, add a testimonials block that stays invisible until real, confirmed testimonials exist, and report exactly what is still a `[TODO]`.

## Facts supplied by the owner (the only new facts you may publish)

- **Education:** "last year of a B.Eng in Computer Engineering". FR: "Dernière année de licence en génie informatique". The university and the graduation year are still **never** shown. The words "ingénieur" and "engineer" as a title for the owner, "étudiant" and "student" still appear nowhere.
- **Dates:** DentaFlow, **October 2026**. The hospital ophthalmology system: **January 2025**, and its display name is now **Ophtachusm** (it replaces "HMS" everywhere the name is displayed; the internal slug `hms` and the `#hms` anchor stay as they are).
- **Festival website:** its name is **Dérive Casablancaise**, it is live at `https://derive-casablancaise.com`. No year was supplied: the year stays `[TODO: year]`. The festival site name and link may now be published; the client's personal name is **never** put in the repository.
- **Public email:** `contact@abdelhadev.me`. It is routed to a private inbox. The private inbox address never appears in the repository, in messages, in docs or in tests.
- **A new project exists** (a yoga session-booking platform for a client, a friend of a family member): users book sessions from the available slots; a fully custom admin panel with role-based access (admin, instructors and others) where sessions are created and edited. Stack: Next.js, shadcn/ui, server actions, a data access layer, Prisma, PostgreSQL on Neon, Better Auth. Its name, year, client permission and screenshots are not supplied yet.
- **Testimonials:** the owner will paste the real texts by hand later. Until then, placeholders only.
- The seven DentaFlow tour descriptions, the fourth adaptation step and the roles line are correct but the owner will rework them: **leave their text and their `[TODO]` markers exactly as they are.**

## Step 0. Housekeeping

1. `docs/decisions.md`:
   - P3 becomes: "Based in Agadir, Morocco. The university and the graduation year are not published. The degree is stated only as 'final year of a B.Eng in Computer Engineering'. The owner is never called ingénieur, engineer, student or étudiant."
   - Add: project dates (month and year) may be published for DentaFlow and Ophtachusm; years of experience still may not.
   - Add: the public email is `contact@abdelhadev.me` (replaces "no public email yet").
   - P10 gains: no personal name appears in any testimonial or anywhere in the repository for a client; a testimonial shows role and organisation only.
2. `docs/content.md`:
   - Replace the About paragraph (it still says third-year student at Karabuk, which is obsolete) with the facts above.
   - Rename the `hms` row to Ophtachusm (slug unchanged) and note its date.
   - Add the festival site and the yoga platform as "pending projects, not on the work page yet, copy comes from the owner's briefing" with the facts above. Do not add them to `projects.ts`.
   - Update the Testimonial section: confirmed-only rendering, placeholders, role and organisation only.
   - Remove "Public email" from "Not yet supplied".
3. Search `src`, `messages`, `docs`, `tests`, `README.md` (not `AGENTS.md`) for the display name "HMS" and replace it with "Ophtachusm" where it is shown to a visitor or asserted by a test (read test headings from the messages files, never hard-code). Keep slugs, anchors and file names.

## Scope

### A. Education, dates, festival link (about page)

In `messages/fr.json` and `messages/en.json` only (same keys):

| Entry | FR | EN |
|---|---|---|
| timeline DentaFlow date | Octobre 2026 | October 2026 |
| timeline Ophtachusm date and name | Janvier 2025 / Ophtachusm | January 2025 / Ophtachusm |
| timeline festival | `[TODO: year]` / Dérive Casablancaise / Un site et un espace d'administration sur mesure pour un festival au Maroc, pour gérer tous les contenus. / Client | `[TODO: year]` / Dérive Casablancaise / A website and a custom admin panel for a festival in Morocco, to manage all the content. / Client |
| timeline festival link | Voir le site | Visit the site |
| education | Computer engineering / Final year of a B.Eng / Formation | Computer engineering / Final year of a B.Eng / Education |

The festival entry gets an external link to `https://derive-casablancaise.com` (`rel="noopener noreferrer"`, opens in a new tab, 44 px target, accessible name saying it opens in a new tab). Keep the voice rules: no em dashes, no exclamation marks.

### B. Public email (`src/lib/site.ts`, footer, legal notice)

Add `email: "contact@abdelhadev.me"` to `site.ts`. Footer: a `mailto:` link with the address as its text, next to LinkedIn and GitHub, 44 px target, server-rendered. Legal notice: fill the publisher's contact email with it. Do not add it anywhere else (no contact page change, no JSON-LD: that is 09).

### C. Testimonials (`src/lib/content/testimonials.ts`, a section on the home page)

- Data: `{ id, role, organisation, text, confirmed }`, all text through message keys (`testimonials.<id>.*`), zod-validated at load. **There is no field for a person's name.** Two entries, both `confirmed: false`: `sos-dental` (organisation "SOS Dental Clinic, Agadir"; role `[TODO: role]`; text `[TODO: testimonial text]` / `[TODO: texte du témoignage]`) and `festival` (organisation "Dérive Casablancaise"; role `[TODO: role]`; same placeholder text). **Do not invent praise.** The placeholders are the only text.
- `publicTestimonials()` returns only `confirmed: true` entries. `todoReport()` lists a `[TODO` inside a **confirmed** testimonial and ignores unconfirmed ones (they are hidden, so they never ship).
- Section `Testimonials` (a pure Server Component that receives its items as a prop, so it can be tested with fixtures), placed on the home page between Featured work and the footer CTA. It must render **nothing at all** (no heading, no wrapper, no extra spacing) when the list is empty. When there are items: a `<figure>` with a `<blockquote>` and a `<figcaption>` showing role and organisation, a calm large quote in the display font, existing primitives only (`SplitReveal` or `Reveal`), the tone that matches the neighbouring home sections so there is no visible seam, no new colours. Two or more items stack vertically (no carousel). Complete without JavaScript and under reduced motion.
- Evidence: temporarily set one entry to `confirmed: true` locally to take **one** still of the section at 1440, then **revert it** and say so in the reply.

### D. Report

Produce the TODO report: every string that still blocks `REQUIRE_CONTENT=1`, grouped by who must supply it (owner facts, owner wording, screenshots, legal). Do not fix any of them beyond this prompt.

## Tests (lean)

- Unit: `site.ts` has the public email and no other email-like string; no file under `src`, `messages`, `docs`, `public` contains "gmail.com"; the banned-word test still bans "Karabuk", "third year", "troisième année", "étudiant", "student", "ingénieur" and allows "B.Eng" and "licence" only in the education entry; testimonials schema has no name field; `publicTestimonials()` with a confirmed and an unconfirmed fixture; `todoReport()` ignores unconfirmed testimonials and lists a confirmed one with a `[TODO`; the `Testimonials` component renders an empty string for no items and a figure with role and organisation for one item.
- `about.spec.ts` at 390 and 1440: the festival link points to `https://derive-casablancaise.com` with the right attributes; the footer email link is a `mailto:` for the public address; the legal notice shows it; the timeline shows the two dates.
- The home spec: no testimonials markup in the raw HTML while none is confirmed; the existing home assertions still pass.
- The three smoke specs at 1440.

## Decisions already made (do not re-decide)

All of `docs/decisions.md`, with the edits of Step 0. No prices, no payment percentages, no years of experience, no invented dates, clients or praise, no photo of the owner, no personal client names, WhatsApp reminders not live. Contact is the call-to-action word.

## Out of scope

The festival site and the yoga platform as work-page projects and their copy (08c, from the owner's briefings), the copy of Côte Royale, MeetAI, FlowShop and HMS beyond the rename, the media pipeline and screenshots (08b), the diagram focus-stop tidy, JSON-LD and OG images and the real CV (09), budgets and the launch gate (10), any change to the contact page.

## Acceptance

1. The lean check list passes (last line of each). `e2e-full` and Lighthouse are listed as not run.
2. The about page shows the education line, the two project dates, the festival entry with its link; "Ophtachusm" replaces "HMS" wherever a visitor sees a name.
3. The footer and the legal notice show `contact@abdelhadev.me`; the private inbox address appears nowhere.
4. No testimonial is visible anywhere in the built site while both are unconfirmed.
5. The TODO report lists what remains. `git status --short` is shown; nothing was committed or pushed.

## Reply format

Short. **Summary** (3 to 5 lines), **Files** (one line per folder), **Verification** (the lean list, last line each), **Deviations**, **Open questions**, **Not verified**, **Evidence** (file list), **Proposed commits**, plus **TODO report**.