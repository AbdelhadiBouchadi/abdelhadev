# 05-case-study

Branch: `feat/05-case-study`

## Git rules for this run (they override AGENTS.md)

The owner reviews the diff and commits by hand. You do **not** run `git add`, `git commit`, `git push`, `git stash`, `git checkout`, `git reset` or anything that changes branches or history. Leave every change in the working tree. At the end, give `git status --short` and a proposed commit split.

## Lean testing policy (applies to this run even if AGENTS.md does not say so yet)

The owner's machine is slow and every full run costs time and tokens. Pull requests run only a small smoke in CI; the full suite runs separately.

- While iterating: `pnpm typecheck` and the single spec you are working on, on one project (`--project=1440`, then once on `--project=390`).
- Before replying, run only: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm check:tokens`, `pnpm check:i18n`, `pnpm test`, `pnpm build`, **this branch's own spec** (`case.spec.ts`) at 390 and 1440, and, because this branch changes the route list, the three pull-request smoke specs (`foundation`, `no-js`, `a11y`) at 1440 only.
- Do **not** run the full `pnpm test:e2e` and do **not** run `pnpm lhci`. List them under "Not verified" as "runs in e2e-full".
- Never re-run something that already passed unless you changed code that it covers.
- No exploratory measurements, traces, cross-browser runs or repeat-each loops unless this prompt asks for them.
- Motion evidence is capped: at most three short clips and three stills (1440, plus one 390 still).
- Keep your reply short: no file-by-file narration, no pasted command output beyond the last line of each check.
- Never report a gate as passing that you did not run.

## Before you start (the owner has done this)

`feat/04-work` is merged into `main`. You are on a new branch `feat/05-case-study` with a clean tree. Check `git status` and `git branch --show-current`; if either is wrong, stop and say so.

## Skills and docs

Run `/skills`. Invoke `frontend-design`, `gsap-scrolltrigger`, `gsap-react` and the GSAP plugins skill (for DrawSVG). Use Context7 only for `generateStaticParams` / `dynamicParams` in Next.js 16 and next-intl if you are unsure.

## Read first

1. `AGENTS.md`, `docs/decisions.md` (P4, P5, P6, P8 especially), `docs/content.md`, `docs/primitives.md`
2. The prototype as the visual spec: `docs/prototype/dentaflow.html`, the rules for `.case-*`, `.facts`, `.tour*`, `.steps`, `.arch*`, `.diagram*`, `.next-project`, `.back-link`, `.statement` in `docs/prototype/assets/site.css`, and `Pages.case` in `docs/prototype/assets/site.js`
3. `docs/choreography.md` (Case study), `src/lib/content/`, `src/app/[locale]/work/[slug]/page.tsx`, `src/components/sections/work/`, `src/primitives/*`, `src/components/ui/{Screen,Chip,ArrowLink}.tsx`

## Goal

The DentaFlow case study at `/fr/projets/dentaflow` and `/en/work/dentaflow`, ported from the prototype: a night hero with the product name and its first screen opening, a statement, a scroll-driven product tour (a sticky frame that follows the step being read on desktop, an inline screen per step on mobile), the four adaptation cards, the architecture diagram that draws as you scroll, and a link to the next project. Only projects with `caseStudy: true` have a route; today that is DentaFlow alone.

## Step 0. Housekeeping

1. `src/app/[locale]/work/[slug]/page.tsx` today builds a "case study coming" placeholder for every public project. Replace it: `generateStaticParams` returns only `caseStudyProjects()` (public projects with `caseStudy: true`), `dynamicParams = false`, anything else is a 404. The sitemap lists the case-study URLs of those projects only. Update `tests/e2e/routes.ts` and every unit test that listed the other project URLs, so the route-wide specs stop visiting four empty pages.
2. Remove the lab, as `docs/decisions.md` says: its `LineDraw` block is now covered by the architecture diagram on this page. Delete what the lab still holds, move its assertions to `case.spec.ts`, update `foundation.spec.ts`, the sitemap and robots expectations, and the docs. If something in `foundation.spec.ts` still depends on a lab page for the tokens, type or brand check, keep only that and say so in your reply.
3. Update `docs/primitives.md` (usage matrix: `MediaReveal` intro mode, `LineDraw`, `useScrollSpy`, `SplitReveal` are now used by this page) and `docs/architecture.md` (case-study data shape).

## Scope

### A. Data (`src/lib/content/`)

Add `case-studies.ts`, zod-validated at load and keyed by project slug, for DentaFlow only: `hero: { tone, skeleton }`, `tour: { key, tone, skeleton }[]` (3 to 8 items; DentaFlow has 7, below), `adapt: string[]` (4 keys), `arch: { listKeys }`. Real images arrive in 08; use `Screen` placeholders with the skeletons already available.

Tour steps, in order, with skeletons: `agenda` (calendar), `list` (patients), `record` (patient file), `plan` (odontogram), `list` (acts catalogue), `invoice` (documents), `chart` (statistics).

`caseStudyProjects()` is derived from the projects data (`caseStudy === true`). Replace the optional stored `screenCount` on projects by a value derived from the case-study data (`tour.length`), so the "See all N screens" link under DentaFlow's work sheet now renders and goes to the case study. Update the schema rule and the unit tests that depended on the stored field.

### B. Copy (working draft, final in 08)

`messages/fr.json` and `messages/en.json`, identical keys, namespace `case` plus `projects.dentaflow.case.*`. The descriptions below only say what the owner's screens show. **Add no claim beyond them**; every other fact is a visible `[TODO: …]` string. Do not reuse the prototype's lines about "clinics I meet", drag-and-drop, colours or handover.

| Key | FR | EN |
|---|---|---|
| `case.back` | Tous les projets | All projects |
| `case.facts.role` / `status` / `delivery` / `stack` | Rôle / Statut / Livraison / Stack | Role / Status / Delivery / Stack |
| `case.facts.roleValue` | Développement full-stack | Full-stack development |
| `case.facts.deliveryValue` | Un déploiement et une base de données par cabinet | One deployment and one database per clinic |
| `projects.dentaflow.case.lead` | Un système de gestion pour cabinets dentaires : agenda, patients, soins et facturation. Adapté à chaque cabinet avant la mise en service, avec sa propre base de données et son propre déploiement. | A management system for dental clinics: agenda, patients, treatments and billing. Adapted to each clinic before launch, with its own database and its own deployment. |
| problem statement | reuse `projects.dentaflow.challenge` | reuse `projects.dentaflow.challenge` |
| `case.tour.label` (screen-reader heading) | Ce que fait DentaFlow | What DentaFlow does |
| tour 1 | L'agenda du cabinet. Les rendez-vous de la journée et de la semaine, avec leur type. | The clinic agenda. The day's and week's appointments, with their type. |
| tour 2 | Tous les patients. La liste des patients du cabinet, avec leurs étiquettes et leur assurance. | Every patient. The clinic's patient list, with their tags and insurance. |
| tour 3 | Un dossier par patient. Les documents et l'imagerie d'un patient réunis dans son dossier. | One record per patient. A patient's documents and imaging in one record. |
| tour 4 | Le schéma dentaire. L'odontogramme du patient, dent par dent. | The dental chart. The patient's odontogram, tooth by tooth. |
| tour 5 | Le catalogue des actes. Les actes du cabinet, avec l'import de la nomenclature NGAP. | The acts catalogue. The clinic's treatments, with NGAP nomenclature import. |
| tour 6 | Les documents. Ordonnances, devis, factures et certificats au même endroit. | Documents. Prescriptions, quotes, invoices and certificates in one place. |
| tour 7 | Les statistiques. L'activité et les encaissements du cabinet, en chiffres et en graphiques. | Statistics. The clinic's activity and payments, in figures and charts. |
| `case.adapt.title` / lead | Adapté à chaque cabinet / DentaFlow est prêt. Ce qui change pour chaque cabinet se fait avant la mise en service. | Adapted to each clinic / DentaFlow is ready. What changes for each clinic happens before launch. |
| adapt 1 | Le nom du cabinet. Le nom du cabinet apparaît dans l'application. | The clinic's name. The clinic's name appears in the application. |
| adapt 2 | Sa propre base de données. Une base de données séparée pour chaque cabinet. | Its own database. A separate database for each clinic. |
| adapt 3 | Son propre déploiement. Un déploiement propre à chaque cabinet. | Its own deployment. A deployment of its own for each clinic. |
| adapt 4 | `[TODO: fourth step title and text]` | same |
| `case.arch.title` / lead | Comment c'est construit / Typé de la base de données à l'écran, pour qu'un changement soit vérifié partout. | How it's built / Typed from the database to the screen, so a change is checked everywhere. |
| arch list 1 | Une base de données par cabinet. PostgreSQL, accessible avec Drizzle. | One database per clinic. PostgreSQL, accessed through Drizzle. |
| arch list 2 | Des types de bout en bout. tRPC partage les mêmes types entre le serveur et l'interface. | End-to-end types. tRPC shares the same types between the server and the interface. |
| arch list 3 | `[TODO: access and roles, owner to confirm]` | same |
| diagram nodes | Technology names stay as they are (Next.js, tRPC, Drizzle ORM, PostgreSQL, Better Auth, Browser/Navigateur); short subtitles come from messages. The `aria-label` describes the flow: browser, Next.js app, tRPC procedures, Drizzle, each clinic's PostgreSQL database, with Better Auth beside the app. | same |
| `case.next` | Projet suivant | Next project |
| footer heading for this page | DentaFlow dans votre cabinet ? | DentaFlow in your clinic? |
| `projects.dentaflow.case.meta` | description = the lead | same |
| per-screen alt/caption | one `[TODO: describe the screen]` per figure until 08 | same |

WhatsApp reminders are not live and appear nowhere (P8). No prices (P5), no numbers, no client names.

### C. Page and sections (`src/components/sections/case/`)

`work/[slug]/page.tsx` stays thin and composes the sections below (server components, small client leaves for motion). Metadata through `lib/seo.ts`. Tones: hero night, statement day, tour day, adaptation day, architecture night, next project day, footer night.

- **CaseHero (night):** back link (44 px target) to the work page; the product name rises letter by letter (`SplitReveal` in chars mode with a mask; extend the primitive minimally if it lacks it and report); lead and facts fade up (`Reveal`, stagger 0.07); the first screen opens with the `MediaReveal` intro mode (clip from `inset(30% 8% 0 8%)`, inner scale 1.2 → 1, 1.6 to 1.8 s), all after the loader is ready. Facts: role, status (reuse `work.status.ready`), delivery, stack from the data.
- **Statement:** `WordsLight` on the problem statement.
- **ProductTour:** desktop ≥ 901 px: steps in a column, a sticky framed stage on the right with all screens stacked; `useScrollSpy` (the step crossing 55 % of the viewport) sets the active step; the active screen crossfades in (0.7 s, scale 0.97 → 1) and the active step is full strength. Mobile: each step shows its own `Screen` inline, no stage. The stage is `aria-hidden` (the step text carries the meaning); inline screens have alt text. **Contrast:** dimming inactive steps must keep text at 4.5:1 or better. Compute the lowest opacity that does and use it; if that is too close to full to read as dimmed, dim with scale and the step number instead. Report the value. Without JavaScript and under reduced motion: the stage is hidden, every step shows its inline screen, nothing is dimmed.
- **Adaptation:** four cards, `Reveal` fade-up with stagger 0.09; `ol`, numbered by CSS as in the prototype.
- **Architecture (night):** the SVG diagram ported from the prototype with token colours only; nodes arrive in order and wires draw on scrub (`LineDraw` for the wires; a sequenced scrub for the nodes, as one timeline per diagram, scrub 0.8; if the primitives cannot express it, add the smallest client leaf and say why). The list fades up beside it. The diagram scrolls horizontally inside its box below 520 px, as in the prototype, and is complete without JavaScript.
- **NextProject:** a giant link to the next public project's sheet on the work page (hash link through `TransitionLink`, so the curtain runs and the destination sheet is in view clear of the header after the loader); its lines rise on entry. If DentaFlow is the last project, link to the work page instead. 44 px target.
- **Footer:** use the shell footer. If it supports a per-page heading, pass the one above; if not, add the smallest optional prop and report it. Do not change anything else in the shell.
- Cursor labels come from messages. Everything is complete without JavaScript and under reduced motion.

## Tests (lean)

- Unit: `caseStudyProjects()`, the derived screen count, the case-study schema, the sitemap list (DentaFlow case URL present, `hms` absent).
- One spec, `tests/e2e/case.spec.ts`, projects 390 and 1440, `/fr/projets/dentaflow` and `/en/work/dentaflow`: the hero name and first screen reach their end state after the loader; desktop tour: scrolling makes the matching step active and the matching stage screen visible (one at a time), mobile: no stage and one inline screen per step; the diagram's wires are fully drawn and its nodes visible at the end; the next-project link arrives on the right sheet of the work page through the curtain; `/fr/projets/hms` is a 404 and is not in the sitemap; raw HTML names the product and every tour title without JavaScript; reduced motion complete and still; ScrollTrigger count returns to its baseline after leaving and returning; axe once at the top and once scrolled to the architecture, no serious or critical issue, with the dimmed steps in their default state. Report any contrast finding with element and ratio; do not change a colour without saying so.
- Evidence: three clips at 1440 (hero intro, tour, architecture) and stills at 1440 and 390.

## Decisions already made (do not re-decide)

All of `docs/decisions.md`. The prototype is the visual spec. No prices, no years of experience, no invented metrics, no client names, no testimonial on this page, WhatsApp reminders not presented as live. Contact is the call-to-action word.

## Out of scope

Real screenshots and final copy (08), the contact form (07), the about page (06), JSON-LD and OG images (09), budgets, a second case study, a testimonial block, any change to the shell or primitives beyond the two small items named above.

## Acceptance

1. The lean check list passes (last line of each). `e2e-full` and Lighthouse are listed as not run.
2. `/fr/projets/dentaflow` and `/en/work/dentaflow` match the prototype's case page at 1440 and 390; the other four project slugs are 404; the lab is gone as described.
3. `git status --short` is shown; nothing was committed or pushed.

## Reply format

Short. **Summary** (3 to 5 lines), **Files** (one line per folder), **Verification** (the lean list, last line each), **Skills used**, **Deviations**, **Open questions**, **Not verified**, **Evidence** (file list), **Proposed commits**.