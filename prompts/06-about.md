# 06-about

Branch: `feat/06-about`

## Git rules for this run (they override AGENTS.md)

The owner reviews the diff and commits by hand. You do **not** run `git add`, `git commit`, `git push`, `git stash`, `git checkout`, `git reset` or anything that changes branches or history. Leave every change in the working tree. At the end, give `git status --short` and a proposed commit split.

## Lean testing policy (applies to this run even if AGENTS.md does not say so yet)

The owner's machine is slow and every full run costs time and tokens. Pull requests run only a small smoke in CI; the full suite runs separately.

- While iterating: `pnpm typecheck` and the single spec you are working on, on one project (`--project=1440`, then once on `--project=390`).
- Before replying, run only: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm check:tokens`, `pnpm check:i18n`, `pnpm test`, `pnpm build`, **this branch's own spec** (`about.spec.ts`) at 390 and 1440, and the three pull-request smoke specs (`foundation`, `no-js`, `a11y`) at 1440 only, because the footer changes on every page.
- Do **not** run the full `pnpm test:e2e` and do **not** run `pnpm lhci`. List them under "Not verified" as "runs in e2e-full".
- Never re-run something that already passed unless you changed code that it covers. No exploratory measurements, traces, cross-browser runs or repeat-each loops.
- Motion evidence is capped: at most three short clips and three stills (1440, plus one 390 still).
- Keep your reply short: no file-by-file narration, no pasted command output beyond the last line of each check.
- Never report a gate as passing that you did not run.

## Before you start (the owner has done this)

`feat/05-case-study` is merged into `main`. You are on a new branch `feat/06-about` with a clean tree. Check `git status` and `git branch --show-current`; if either is wrong, stop and say so.

## Skills and docs

Run `/skills`. Invoke `frontend-design`, `gsap-scrolltrigger` and `gsap-react`.

## Read first

1. `AGENTS.md`, `docs/decisions.md`, `docs/content.md`, `docs/primitives.md`
2. The prototype as the visual spec: `docs/prototype/about.html`, the rules for `.dawn`, `.arcs`, `.arc`, `.dawn-copy`, `.chapters`, `.chapter*`, `.statement`, `.timeline`, `.stack-group*`, `.now*`, `.chip`, `.steps` in `docs/prototype/assets/site.css`, and `Pages.about` in `docs/prototype/assets/site.js`
3. `docs/choreography.md` (About), `src/lib/site.ts`, `src/lib/content/`, `src/components/sections/case/` (the adaptation cards and the facts row are patterns to reuse), `src/primitives/*`, the existing `about` route and its `@footer` page

## Goal

The about page at `/fr/a-propos` and `/en/about`, ported from the prototype and extended for four audiences: small clients (a website with a custom admin), clinics, recruiters, and peers on LinkedIn. It tells who Abdelhadi is, what he builds (in a fixed order), how a project runs from first call to delivery, his experience, his stack, and what he is doing now. It also puts the real LinkedIn, GitHub and WhatsApp links into the site, and adds the CV download.

## Facts supplied by the owner (the only facts you may publish; everything else is a visible `[TODO: …]`)

- Title: **full-stack developer**, from Agadir, independent (auto-entrepreneur). He works as a freelancer **since late 2022**, alone, for French, English and Moroccan clients.
- Education: computer engineering. **The university and the graduation year are never shown.** The words "ingénieur", "engineer", "student", "étudiant" and any year of study appear nowhere on the site until the owner confirms his degree status (see Open questions). Show only "Formation en génie informatique" / "Computer engineering background".
- Languages: French, English, Arabic (Darija), all fluent. Reachable in the Morocco time zone. Works remotely; not available on site. Open to freelance projects and open to a remote position (say "parlons-en" / "let's talk"; do not mention studies, full-time or hours).
- What he builds, in this order: (1) management systems for clinics and health services, (2) AI-powered web apps, (3) online shops, (4) websites with a custom admin panel, (5) other web projects ("anything web").
- Stack he uses daily: Next.js, TypeScript, tRPC, Drizzle ORM, PostgreSQL (Neon), Better Auth, Arcjet, shadcn/ui. Per project: AI SDK, OpenAI API, Shopify headless through its GraphQL API (online shops), WordPress as a CMS when a client insists, GSAP. Exploring: Trigger.dev and Browserbase, by building a browser-automation app (never presented as a product).
- Websites: Next.js with PostgreSQL (Neon) and a custom admin panel so the client manages everything.
- Process: he listens first; within 24 hours turns the notes into a technical plan, models the data and splits the project into small tasks; sends a quote (devis) 24 to 48 hours after the first conversation; after the client accepts and signs, an advance invoice, then development; just before launch, the balance invoice and delivery of everything. **Do not publish the percentages of the payments.**
- Why clinics: part of his circle are doctors. He built **HMS**, a management system for a hospital ophthalmology service (patient data, appointments, eye images and medical records; only the medical staff have access), for friends who are residents there. **DentaFlow** was born from his brother's dental clinic, which showed him what dentists need. He wants healthcare staff to save time for what matters.
- Another client project: a website with a fully custom admin panel for a festival-organisation company in Morocco.
- Links: LinkedIn `https://www.linkedin.com/in/abdelhadi-bouchadi-904b5b359/`, GitHub `https://github.com/AbdelhadiBouchadi`, WhatsApp Business `+212637025032`.
- **Never publish:** the names of the hospital, of the friend who is a resident, of the festival company, or of the clinic on this page; the owner's personal Gmail address; any claim that HMS is currently in use; any claim about income, savings or results for clinics; photos of the owner (P9 holds).

## Step 0. Housekeeping

1. `docs/decisions.md`: P3 becomes "Based in Agadir, Morocco. The university and the graduation year are not published; the degree is not named as ingénieur or student until the owner confirms." The rule "No claim of full-time availability" in `docs/content.md` becomes "Open to freelance projects and to a remote position, said without hours or studies." Add that a quote 24 to 48 hours after the first conversation may be stated (it is his process, not a reply-time promise), and that payment percentages are not published.
2. `docs/content.md`: replace the About section with the facts above and remove the "Not yet supplied" items that are now supplied (LinkedIn, GitHub, WhatsApp). Update the HMS row of the projects table.
3. **Fix a failing check from the 05 merge first.** `e2e-full` fails `reduced-motion.spec.ts` on `/fr/projets/dentaflow` at 390 and 1440: 6 elements are hidden, expected 0. The count matches the six nodes of the architecture diagram, but check, do not assume. Find which elements are hidden and make them visible under reduced motion and without JavaScript, in CSS, so the page is complete without GSAP. Do not change the test. Verify with `reduced-motion.spec.ts` for the dentaflow route at 1440 and the reduced-motion test of `case.spec.ts` at 1440. Keep it as its own commit in your proposed split (`fix(case): …`).
4. Search the repository (`src`, `messages`, `docs`, `tests`, `README.md`; not `AGENTS.md`, which you must not edit) for "third-year", "third year", "troisième année", "Karabuk" and "bachelor"; remove or rewrite every occurrence. Report anything you find in `AGENTS.md` for the owner to edit.

## Scope

### A. Site constants (`src/lib/site.ts`)

Add `linkedin`, `github` and `whatsapp` (E.164 `+212637025032`, a `wa.me` link built from it, and a display form `+212 6 37 02 50 32`). Do **not** add the public email: it stays unset until the owner sets up a mailbox on the domain. Replace the footer's "link to come" lines for LinkedIn and GitHub with real links (`rel="noopener noreferrer"`, 44 px targets, an accessible name that says it opens in a new tab). Everything else in the shell stays as it is.

### B. CV

Two placeholder PDFs, `public/cv/abdelhadi-bouchadi-cv-fr.pdf` and `…-en.pdf`, generated by a dependency-free script `scripts/make-placeholder-cv.mjs` (a valid one-page PDF reading "CV placeholder, to be replaced"). `src/lib/content/cv.ts` records `status: "placeholder" | "final"` per locale; `todoReport()` lists a placeholder and `REQUIRE_CONTENT=1` fails the build while any is a placeholder, so it cannot ship by accident. The about page links to the file for the current locale (`download`, label "Télécharger mon CV (PDF)" / "Download my CV (PDF)").

### C. Copy (working draft, final in 08)

`messages/fr.json` and `messages/en.json`, identical keys, namespace `about`. Technology names are not translated. Anything not in the facts above is `[TODO: …]`.

| Key | FR | EN |
|---|---|---|
| `about.meta.title` | À propos | About |
| `about.meta.description` | Développeur full-stack indépendant à Agadir : systèmes de gestion, applications IA, boutiques en ligne et sites avec espace d'administration. | Independent full-stack developer in Agadir: management systems, AI apps, online shops and websites with an admin panel. |
| `about.title` | Un développeur d'Agadir qui construit des logiciels auxquels on confie son travail | A developer from Agadir, building software people trust with their work |
| `about.lead` | Je suis Abdelhadi Bouchadi. Je conçois et construis des applications web de la base de données au dernier écran, pour des cabinets, des services de santé et des petites équipes. | I'm Abdelhadi Bouchadi. I design and build web applications from the data model to the last screen, for clinics, health services and small teams. |
| `about.facts` (language / time zone / mode) | Langues : français, anglais, arabe (darija) · Fuseau horaire du Maroc · À distance | Languages: French, English, Arabic (Darija) · Morocco time zone · Remote |
| chapter 1 label / text | Qui je suis / Je suis d'Agadir, développeur full-stack indépendant. Je construis des applications web de bout en bout avec Next.js et TypeScript, pour des personnes qui n'ont pas le temps d'apprendre des outils compliqués. | Who I am / I'm from Agadir, an independent full-stack developer. I build web applications end to end with Next.js and TypeScript, for people who have no time to learn complicated tools. |
| chapter 2 label / text | Comment je travaille / Je commence par vous écouter. Je modélise ensuite vos données et je découpe le projet en tâches. Vous recevez un devis 24 à 48 heures après notre premier échange, puis je construis et je livre. | How I work / I start by listening. Then I model your data and split the project into tasks. You get a quote 24 to 48 hours after our first conversation, then I build and deliver. |
| chapter 3 label / text | Pourquoi les cabinets / Une partie de mon entourage est médecin. J'ai construit un outil pour un service d'ophtalmologie hospitalier, et DentaFlow est né de la clinique dentaire de mon frère. Je veux que les soignants gagnent du temps pour l'essentiel. | Why clinics / Part of my circle are doctors. I built a tool for a hospital ophthalmology service, and DentaFlow was born from my brother's dental clinic. I want healthcare staff to save time for what matters. |
| `about.services.title` | Ce que je construis | What I build |
| services 1 to 5 | Systèmes de gestion pour cabinets et services de santé : agenda, patients, dossiers et facturation, adaptés à chaque structure. / Applications web avec IA : des fonctions d'IA dans votre application, avec l'AI SDK ou l'API OpenAI. / Boutiques en ligne : Shopify en headless, relié à une interface Next.js par l'API GraphQL. / Sites web avec espace d'administration : un site Next.js et un espace d'administration sur mesure pour gérer tout le contenu. WordPress comme CMS si vous le préférez. / Autres projets web : tout ce qui touche au web, parlons-en. | Management systems for clinics and health services: agenda, patients, records and billing, adapted to each organisation. / AI-powered web apps: AI features inside your application, with the AI SDK or the OpenAI API. / Online shops: headless Shopify connected to a Next.js interface through the GraphQL API. / Websites with an admin panel: a Next.js site and a custom admin panel to manage all the content. WordPress as the CMS if you prefer. / Other web projects: anything web, let's talk. |
| `about.process.title` / lead | Comment se déroule un projet / De la première conversation à la livraison. | How a project runs / From the first conversation to delivery. |
| process 1 to 5 | Écoute : vous parlez, je prends des notes sur vos besoins. / Cadrage : en 24 heures, je traduis vos besoins en plan technique, je modélise les données et je découpe le projet en tâches. / Devis : vous recevez un devis 24 à 48 heures après notre premier échange. / Développement : après votre accord et votre signature, une facture d'acompte, puis je construis. / Livraison : juste avant la mise en ligne, la facture du solde, puis je vous livre tout. | Listen: you talk, I take notes on your needs. / Scoping: within 24 hours I turn your needs into a technical plan, model the data and split the project into tasks. / Quote: you receive a quote 24 to 48 hours after our first conversation. / Build: once you accept and sign, an advance invoice, then I build. / Delivery: just before launch, the balance invoice, then I hand over everything. |
| `about.experience.title` | Expérience | Experience |
| timeline 1 | Depuis fin 2022 / Développeur full-stack indépendant / Des applications web conçues seul, de bout en bout, pour des clients français, anglais et marocains. / Agadir, Maroc | Since late 2022 / Independent full-stack developer / Web applications designed alone, end to end, for French, English and Moroccan clients. / Agadir, Morocco |
| timeline 2 | `[TODO: year]` / DentaFlow / Un logiciel de gestion de cabinet dentaire, prêt à être adapté à de nouveaux cabinets. / Produit | same in English / Product |
| timeline 3 | `[TODO: year]` / HMS / Un système de gestion pour un service d'ophtalmologie hospitalier, réservé au personnel médical. / Santé | same in English / Healthcare |
| timeline 4 | `[TODO: year]` / Site web et espace d'administration sur mesure / Pour une société d'organisation de festivals au Maroc : un site et un espace d'administration pour gérer tous les contenus. / Client | same in English / Client |
| timeline 5 | Formation / Génie informatique / (no detail) / Formation | Education / Computer engineering / (no detail) / Education |
| `about.stack.title` and groups | Ce que j'utilise : Au quotidien (Next.js, TypeScript, tRPC, Drizzle ORM, PostgreSQL (Neon), Better Auth, Arcjet, shadcn/ui) · Selon le projet (AI SDK, OpenAI API, Shopify headless, WordPress, GSAP) · J'explore (Trigger.dev, Browserbase) | What I use: Every day · Per project · Exploring (same chips) |
| `about.now.title` | En ce moment | Right now |
| now cards | DentaFlow est prêt pour de nouveaux cabinets (chaque cabinet a son nom, sa base de données et son déploiement) + link to the case study / Ouvert aux projets freelance, et à un poste à distance : parlons-en. + Contact link / J'explore l'automatisation de navigateur : je me forme à Trigger.dev et Browserbase en construisant une application d'automatisation. | DentaFlow is ready for new clinics (each clinic has its own name, database and deployment) + case study link / Open to freelance projects, and to a remote position: let's talk. + Contact link / Exploring browser automation: learning Trigger.dev and Browserbase by building an automation app. |

Also fill the two keys that were `[TODO]` for HMS: `projects.hms.challenge` = "Donner à un service d'ophtalmologie un outil pour suivre ses patients, ses rendez-vous et ses images de l'œil." / "Give an ophthalmology service a tool to follow its patients, appointments and eye images." and `projects.hms.built` = "Un système de gestion réservé au personnel médical du service : données des patients, rendez-vous, imagerie de l'œil et dossiers médicaux." / "A management system for the service's medical staff only: patient data, appointments, eye imaging and medical records." Leave the other `[TODO]` strings of the other projects.

### D. Page and sections (`src/components/sections/about/`)

`about/page.tsx` stays thin and composes server-rendered sections with small client leaves for motion. Metadata through `lib/seo.ts`. Tones as in the prototype: dawn and chapters day, services/process/experience/stack day, "Right now" night, footer night. No new route: the `@footer` page for the about route already exists.

- **AboutHero:** four arcs rise and settle (2.2 s, stagger 0.14 from the outside); `SplitReveal` lines on the h1; lead and the facts row fade up; on scroll the arcs expand and fade (`Scrub`). After the loader is ready.
- **Chapters:** three chapters of 200 vh with a sticky stage (`StickyStage`); the label fades in, the statement lights up word by word (`WordsLight`, opacity floor 0.5 as set in 03).
- **Services:** an ordered list of the five items in the given order, each with its title and one line; `Reveal` stagger 0.08; a Contact `ArrowLink` at the end.
- **Process:** five numbered cards in the pattern of the adaptation cards on the case study; `Reveal` stagger 0.09.
- **Experience:** the prototype's timeline with the five entries; the CV link in the section head.
- **Stack:** three groups of chips.
- **Right now:** three night cards with the prototype's glyphs.
- Everything is complete without JavaScript and under reduced motion (no sticky stage, all text at full opacity). External links get `rel="noopener noreferrer"`. All link targets are at least 44 px.

## Tests (lean)

- Unit: `site.ts` (https URLs, E.164 number, no email key), the CV status gate, and that no message contains "Karabuk", "third year", "troisième année", "étudiant", "student" or "ingénieur".
- One spec, `tests/e2e/about.spec.ts`, projects 390 and 1440, `/fr/a-propos` and `/en/about`: arcs and h1 reach their end state after the loader; each chapter's statement lights up when scrolled; services, process, experience, stack and "Right now" reach their end state without console errors; the footer's LinkedIn and GitHub links and the CV link are correct for the locale and the CV file is served as a PDF; raw HTML without JavaScript contains every section title and the order of the five services; reduced motion complete and still; ScrollTrigger count returns to its baseline after leaving and returning; axe once at the top and once scrolled to "Right now" (night), no serious or critical issue. Report any contrast finding with element and ratio.
- Evidence: three clips at 1440 (dawn intro, chapters, timeline and "Right now") and stills at 1440 and 390.

## Decisions already made (do not re-decide)

All of `docs/decisions.md`, with the edits of Step 0. No prices, no payment percentages, no years of experience, no invented dates or clients, no photo of the owner, no testimonial on this page (08), no public email yet, WhatsApp reminders not live. Contact is the call-to-action word.

## Out of scope

The contact form and the WhatsApp composer (07), testimonials and real years (08), the public email and its routing, JSON-LD and OG images (09), budgets, any change to the shell beyond the footer links.

## Acceptance

1. The lean check list passes (last line of each). `e2e-full` and Lighthouse are listed as not run.
2. `/fr/a-propos` and `/en/about` match the prototype's structure at 1440 and 390, with the added services and process sections; no occurrence of the university, a year of study or the word "ingénieur" anywhere in the site.
3. The build with `REQUIRE_CONTENT=1` fails only on the listed `[TODO]` strings and the placeholder CV, and you list them.
4. `git status --short` is shown; nothing was committed or pushed.

## Reply format

Short. **Summary** (3 to 5 lines), **Files** (one line per folder), **Verification** (the lean list, last line each), **Skills used**, **Deviations**, **Open questions**, **Not verified**, **Evidence** (file list), **Proposed commits**, plus **TODO report** (the strings that block `REQUIRE_CONTENT=1`).