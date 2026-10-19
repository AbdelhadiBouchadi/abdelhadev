# 08c-project-copy

Branch: `feat/08c-project-copy`

## Git rules for this run (they override AGENTS.md)

The owner reviews the diff and commits by hand. You do **not** run `git add`, `git commit`, `git push`, `git stash`, `git checkout`, `git reset` or anything that changes branches or history. Leave every change in the working tree. At the end, give `git status --short` and a proposed commit split.

## Lean testing policy

- While iterating: `pnpm typecheck` and the single spec you are working on, `--project=1440`, then once on `--project=390`.
- Before replying, run only: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm check:tokens`, `pnpm check:i18n`, `pnpm check:fr`, `pnpm test`, `pnpm build`, the specs this branch touches (`work`, `case`, `about`, and the home spec if you changed the home page) at 390 and 1440, and the three pull-request smoke specs (`foundation`, `no-js`, `a11y`) at 1440 only.
- Do **not** run the full `pnpm test:e2e` and do **not** run `pnpm lhci`. List them under "Not verified" as "runs in e2e-full".
- Never re-run something that already passed unless you changed code that covers it. Keep the reply short: only the last line of each check. Never report a gate as passing that you did not run.

## Before you start

`feat/08b-media` is merged into `main`. You are on a new branch `feat/08c-project-copy` with a clean tree. Check `git status` and `git branch --show-current`; if either is wrong, stop and say so.

## Skills and docs

Run `/skills`. Invoke `frontend-design` and the `french-copy-quality` skill.

Read first: `AGENTS.md`, `docs/decisions.md` (up to P15), `docs/content.md`, `docs/french-style.md`, `docs/french-audit.md`, `prompts/04-work.md`, `prompts/06-about.md`, `src/lib/content/` (`schema.ts`, `projects.ts`, `about.ts`, `media.map.json`), the work page sections, the about timeline, `messages/fr.json`, `messages/en.json`, `src/lib/site.ts`.

## Goal

Write the real copy and data of the work page for the five projects, in this order: DentaFlow, MeetAI, Ophtachusm, Yoga booking, Côte Royale. Add the `yoga-booking` project, fix the headings, add a GitHub link, and close three small follow-ups from 08b.

## Rules for all copy

- French is written first, natively, under `docs/french-style.md` (cabinet, typage strict, de bout en bout, espace d'administration, sur mesure; never "implémenter", "customisé", "scalable"). English is written, not translated word for word. `pnpm check:fr` must pass.
- Plain, specific, calm. Vous. No em dashes, no exclamation marks, no emoji, no marketing words, no prices, no years of experience, no invented numbers, clients, users or results.
- Every claim below comes from a code audit or from the owner. Do not add claims, do not strengthen them ("in production", "used by many", "secure", "fast"). If a field of the schema has no fact below, keep its existing value or `[TODO: …]`.
- Use the existing project schema and the existing layout. If a piece of content below has no field to live in, do **not** change the layout: put it in `docs/content.md` under that project and list it under Open questions.
- Text goes through message keys in both languages, same keys. Keep slugs; the Ophtachusm slug stays `hms`.
- DentaFlow: its copy, tour descriptions and case study are **not touched** (the owner reworks them). Only its position, media and the follow-ups below.
- No studio, hospital, professor, client or personal name in any copy. The Ophtachusm name stays as the display name.

## Step 1. Headings and GitHub link

1. The work page heading, and any section heading that currently reads like a plain "the projects" / « Les projets », becomes: FR « Quelques projets que j'ai développés », EN "Some projects I've built". The featured-work heading on the home page follows the same idea if it says "projects" alone (keep it short and keep its structure). The page `<title>` and meta description stay short and factual.
2. The work-page lead (it still mentions online shops) becomes: FR « Des systèmes de gestion, des applications IA, des plateformes de réservation et des sites qui racontent une marque. » EN "Management systems, AI apps, booking platforms and sites that tell a brand's story." Update the work meta description so it lists these kinds, with no shop.
3. Under the project list, a quiet link (the existing `ArrowLink` style) to the owner's GitHub profile from `site.ts`: FR « Plus de projets sur GitHub » / EN "More projects on GitHub". External: `rel="noopener noreferrer"`, new tab, 44 px target, an accessible name that says it opens in a new tab, server-rendered. If `site.ts` has no GitHub URL, use the existing `[TODO]` mechanism and report it.

## Step 2. Project data and copy

For each project below, fill the fields the schema has (name, kind, date, role, summary, points, stack, numbers, status). Slug, order and media are already in place; add `yoga-booking` to `projects.ts` in 4th position (the order list already names it) with the media of its map.

Permission: `yoga-booking` and `cote-royale` are `confirmed` (the owner decided to show them; Côte Royale has no client). Keep `meetai` and `hms` as they are if already confirmed, otherwise set `confirmed` and record it as an owner decision.

### MeetAI (`meetai`)

- Kind: FR « Application web avec agents IA » / EN "AI web app". Date: FR « Juin 2025 » / EN "June 2025". Role: FR « Développement et déploiement » / EN "Development and deployment".
- Summary FR: « Une application où l'on crée des agents IA, planifie des réunions avec eux et les rejoint en appel vidéo. L'agent répond à voix haute ; à la fin, l'application produit l'enregistrement, la transcription, un résumé et un chat pour interroger la réunion. »
  EN: "An app where you create AI agents, schedule meetings with them and join them on a video call. The agent answers out loud; afterwards the app produces the recording, the transcript, a summary and a chat to ask questions about the meeting."
- Four points (FR then EN):
  1. « Un cycle de réunion piloté par des webhooks signés : à venir, en cours, en traitement, terminée. » / "A meeting lifecycle driven by signed webhooks: upcoming, active, processing, completed."
  2. « Résumé généré en tâche de fond, en étapes qui peuvent être rejouées (Inngest). » / "Summary generated as a background job, in retryable steps (Inngest)."
  3. « Chaque requête filtrée par utilisateur côté serveur, limites du plan gratuit vérifiées avant l'écriture. » / "Every request scoped to the user on the server, free-plan limits checked before the write."
  4. « Abonnement géré avec Polar, en mode test. » / "Subscription handled with Polar, in test mode."
- Stack: Next.js 15, React 19, TypeScript, tRPC, Drizzle, Neon (PostgreSQL), Better Auth, Stream (appel vidéo et chat), OpenAI, Inngest, Polar, shadcn/ui, Tailwind 4.
- Numbers: 8 pages, 16 procédures tRPC / tRPC procedures, 6 tables, 1 tâche de fond / background job.
- Never write: "en production", "utilisateurs", "paiements réels", the plan prices, the live URL.
- Diagram nodes (docs only unless a slot exists): Navigateur → Next.js et tRPC → Better Auth → Neon (Drizzle); Stream (vidéo, chat) → webhooks signés → Next.js → OpenAI (voix, résumé, chat); Inngest (résumé); Polar (abonnement, test).

### Ophtachusm (`hms`)

- Kind: FR « Gestion d'un service d'ophtalmologie » / EN "Ophthalmology department management". Date: FR « 2024 à 2025 » / EN "2024 to 2025" (this replaces "Janvier 2025" / "January 2025" everywhere: work data, about timeline, docs, tests; record it in `decisions.md`). Role: FR « Conception et développement » / EN "Design and development".
- Context: FR « Conçu pour le service d'ophtalmologie d'un hôpital d'Agadir, utilisé par l'équipe pendant plusieurs mois. » EN "Built for the ophthalmology department of a hospital in Agadir and used by its team for several months." This is a fact stated by the owner; use it as is and add nothing about the hospital or its current use.
- Summary FR: « Une application pour gérer le quotidien d'un service d'ophtalmologie : dossiers patients, comptes rendus, images de l'œil, rendez-vous et statistiques. Les nouveaux comptes attendent la validation d'un administrateur avant d'accéder aux données. » EN: "An app to run the daily work of an ophthalmology department: patient files, medical records, eye images, appointments and statistics. New accounts wait for an administrator's approval before they can see any data."
- Four points:
  1. « Un calendrier de rendez-vous qui suit le fonctionnement du service : consultation, spécialité, chirurgie et professeur, validés selon le type. » / "An appointment calendar that follows how the department works: consultation, specialty, surgery and professor, validated by type."
  2. « Images de l'œil téléversées et annotées par œil, type et description. » / "Eye images uploaded and annotated by eye, type and description."
  3. « Statistiques calculées côté serveur : douze mois et variation d'un mois à l'autre. » / "Statistics computed on the server: twelve months and month-over-month change."
  4. « Validation des nouveaux comptes par un administrateur. » / "New accounts approved by an administrator."
- Stack: Next.js 14, TypeScript, Prisma, MongoDB, Auth.js, UploadThing, Zod, shadcn/ui, Tailwind 3. Numbers: 11 pages, 9 modèles / data models, 31 actions serveur / server actions, 1 langue (français) / 1 language (French).
- Never write: "sécurisé", "conforme", "données médicales chiffrées", "utilisé aujourd'hui", the hospital's or the professors' names.
- Diagram nodes: Navigateur → Next.js (pages serveur et actions) → Auth.js → MongoDB via Prisma; UploadThing pour les images.

### Yoga booking (`yoga-booking`)

- Kind: FR « Plateforme de réservation » / EN "Booking platform". Date: FR « 2025 à 2026 » / EN "2025 to 2026". Role: FR « Conception et développement » / EN "Design and development". Display name: **Yoga booking** (French: « Réservation de yoga »); never the studio's name.
- Summary FR: « Une plateforme de réservation pour un studio de yoga. Les élèves consultent les séances, réservent une place ou rejoignent la liste d'attente, et annulent avant l'échéance fixée par séance. Le studio gère tout depuis un espace d'administration sur mesure : séances, catégories, intervenants, élèves, réservations et document de menu à télécharger. »
  EN: "A booking platform for a yoga studio. Students browse sessions, book a place or join the waiting list, and cancel before each session's deadline. The studio runs everything from a custom admin panel: sessions, categories, instructors, students, bookings and a downloadable menu document."
- Four points:
  1. « Une réservation vérifiée côté serveur en une seule transaction : séance publiée, places restantes, puis confirmation ou liste d'attente. » / "A booking checked on the server in a single transaction: published session, remaining places, then confirmation or waiting list."
  2. « Liste d'attente automatique : quand une place se libère, la première personne en file est confirmée, et une contrainte en base empêche les doublons. » / "Automatic waiting list: when a place frees up, the first person in line is confirmed, and a database constraint prevents duplicates."
  3. « Droits d'administration vérifiés en base de données à chaque action, pas seulement dans l'interface. » / "Admin rights checked against the database on every action, not only in the interface."
  4. « Bilingue dès le modèle de données : chaque séance, catégorie et intervenant existe en français et en anglais. » / "Bilingual from the data model: every session, category and instructor exists in French and English."
- Roles: the people who use it are students and the admin. Instructors are public profiles managed by the admin, not accounts. Write nothing that suggests instructors log in.
- Stack: Next.js 15, React 19, TypeScript, Tailwind 4, shadcn/ui, Prisma, PostgreSQL (Neon), Better Auth, next-intl, Resend et React Email, UploadThing, Arcjet. Numbers: 11 modèles / data models, 2 langues / languages, 23 pages (10 publiques, 13 d'administration), environ 50 fonctions serveur (write "plus de 50" only if the schema takes a free string; otherwise omit this one).
- Never write: paiements, rappels, avis, séances récurrentes, instructor accounts, "en ligne", the live URL, the studio's name.
- Diagram nodes: Navigateur (FR/EN) → Next.js (pages serveur et actions) → Better Auth (e-mail, Google, code) → PostgreSQL via Prisma; Resend (e-mails); UploadThing (images, PDF); Arcjet (limitation, bots).

### Côte Royale (`cote-royale`)

- Kind: FR « Site vitrine (projet de démonstration) » / EN "Showcase site (concept project)". Date: « 2025 ». Role: FR « Conception et développement » / EN "Design and development". There is no client: remove the old "client permission to name" TODO.
- Summary FR: « Un site vitrine pour une marque de parfum imaginaire, pensé pour pousser l'animation. Le défilement est fluide, les lettres s'allument au fil du scroll et les pages se fondent l'une dans l'autre. Les parfums et les textes se gèrent depuis Prismic, sans toucher au code. » EN: "A showcase site for an imaginary perfume brand, built to push animation. Scrolling is smooth, letters light up as you scroll and pages blend into one another. Fragrances and text are managed from Prismic, with no code changes."
- Four points:
  1. « Animation pilotée par le défilement : GSAP et ScrollTrigger, défilement fluide avec Lenis, et transitions de page natives qui laissent la navigation immobile. » / "Scroll-driven animation: GSAP and ScrollTrigger, smooth scrolling with Lenis, and native page transitions that keep the navigation still."
  2. « Des composants d'animation réutilisables, avec une version simplifiée pour les personnes qui réduisent les animations. » / "Reusable animation components, with a simplified version for people who reduce motion."
  3. « Contenu piloté par Prismic : une page d'accueil composée de six blocs, des pages parfum générées à l'avance et mises à jour dès qu'un éditeur publie. » / "Content driven by Prismic: a home page built from six blocks, fragrance pages generated ahead of time and refreshed when an editor publishes."
  4. « Vidéo chargée seulement à l'approche de l'écran, pour garder un premier affichage léger. » / "Video loaded only when it nears the screen, to keep the first load light."
- Stack: Next.js 15, React 19, TypeScript, Tailwind 4, GSAP (ScrollTrigger), Lenis, Prismic. Numbers: 3 pages, 3 types de contenu / content types, 6 blocs / blocks, 6 composants animés / animated components, 1 langue (anglais) / 1 language (English).
- Never write: boutique, panier, paiement, avis, "en ligne", any claim of full reduced-motion support, any brand claim beyond "imaginary".

## Step 3. About timeline and docs

1. About timeline (real work only): Ophtachusm now reads « 2024 à 2025 » / "2024 to 2025"; add a **Yoga booking** entry « 2025 à 2026 » / "2025 to 2026", label « Client » / "Client", one line: FR « Une plateforme de réservation et son espace d'administration pour un studio de yoga. » EN "A booking platform and its admin panel for a yoga studio." No link, no name. Do not add MeetAI or Côte Royale (personal projects). Keep the existing entries and their order by date.
2. `docs/content.md`: rewrite the Projects table for the five projects (status, kind, facts above); remove "pending projects"; record that MeetAI is described as built and deployed by the owner, Ophtachusm as used by the department for several months, Côte Royale as a concept project.
3. `docs/decisions.md`: add P16 (heading wording and the GitHub link), P17 (yoga shown without the studio's name; Côte Royale is a concept project with no client; MeetAI wording), P18 (Ophtachusm date "2024 to 2025"). One line each.

## Step 4. Three follow-ups from 08b

1. **Axe on the case study.** `case.spec` "axe at the top…" fails on the WordsLight problem statement (decision D10, contrast floor 0.14). Apply the same exclusion `a11y.spec` already uses (`[data-words-light]`), nothing else. Both widths must pass.
2. **`hero` role in the media map.** Add the role `hero` to `media.map.json` and its schema. Use it for the DentaFlow case-study hero and the home page featured screens, which are still skeletons. Choose the screenshot by looking at the images (do not name files in code); the best candidate for a hero is a full-width view that shows the product at a glance without personal data. If no suitable file exists, keep the skeleton and say so.
3. **Retina size.** In `scripts/media.config.mjs`, when a source image is wider than 1440 px, also write one variant at the source width capped at 2400 px. Run `pnpm media` once (it reprocesses everything; the owner's `ASSETS_DIR` is already configured) and report the new total size of `public/work/` per project. If the total grows by more than 3 MB, keep the variant only for the `hero` role.

## Step 5. Report

Run the TODO report (`todoReport()`): list every string that still blocks `REQUIRE_CONTENT=1`, grouped by who must supply it (owner facts, owner wording, legal, screenshots). Do not fix them.

## Tests (lean)

- Unit: the projects table has exactly the five slugs in the right order; no project text contains the banned words (`flowshop`, `ingénieur`, `étudiant`, `student`, prices, "en production", the studio, hospital and professor names); every project has FR and EN for each field it uses; the `yoga-booking` media entries resolve in the manifest; `check:fr` passes.
- E2E at 390 and 1440 (`work.spec`, `about.spec`, `case.spec`): the new heading is present in both locales; the five projects appear in order with their names; the GitHub link points to the owner's profile with the right attributes; the about timeline shows the yoga entry and no festival; the case-study hero and home screens render real media where mapped; axe passes on the case study.
- Read expectations from the messages and the manifest; assert no screenshot file name.
- The three smoke specs at 1440.

## Out of scope

SEO, OG images and JSON-LD (09), real CV (09), launch gates (10), the DentaFlow case-study copy, testimonial text, the legal retention period, new case-study pages for other projects.

## Acceptance

1. The lean list passes (last line of each). `e2e-full` and Lighthouse listed as not run.
2. The work page shows five projects in order with real copy in both languages and the new heading and GitHub link.
3. `grep -rni flowshop` outside `docs/prototype/` finds nothing; the yoga studio, the hospital and the professors are named nowhere in copy.
4. The TODO report lists what remains. `git status --short` is shown; nothing was committed or pushed.

## Reply format

Short. **Summary** (3 lines), **Copy** (a table per project: field, FR, EN, only where you made a choice), **Verification**, **Open questions** (long strings, fields without a slot, starred wording), **Not verified**, **TODO report**, **Totals** (public/work size per project), **Proposed commits**, `git status --short`.