# 04-work

Branch: `feat/04-work`

## Git rules for this run (they override AGENTS.md)

The owner reviews the diff and commits by hand. You do **not** run `git add`, `git commit`, `git push`, `git stash`, `git checkout`, `git reset` or anything that changes branches or history. Leave every change in the working tree. At the end, give `git status --short` and a proposed commit split.

## Lean testing policy (permanent from this branch; Step 0 writes it into AGENTS.md)

The owner's machine is slow and every full run costs time and tokens. CI runs the full suite and Lighthouse on every pull request, so you do not repeat them locally.

- While iterating: `pnpm typecheck` and the single spec you are working on, on one project (`--project=1440`, then once on `--project=390`).
- Before replying, run only: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm check:tokens`, `pnpm check:i18n`, `pnpm test`, `pnpm build`, and **this branch's own e2e spec(s)** at 390 and 1440. Do **not** run the full `pnpm test:e2e` and do **not** run `pnpm lhci`. List them under "Not verified" as "runs in CI".
- Never re-run something that already passed unless you changed code that it covers.
- No exploratory measurements, traces, cross-browser runs or repeat-each loops unless this prompt asks for them.
- Motion evidence is capped: at most three short clips and three stills, desktop 1440 plus one 390 still.
- Keep your reply short: no file-by-file narration, no pasted command output beyond the last line of each check.

## Before you start (the owner has done this)

`feat/03-home` is merged into `main`. You are on a new branch `feat/04-work` with a clean tree. Check `git status` and `git branch --show-current`; if either is wrong, stop and say so.

## Skills and docs

Run `/skills`. Invoke `frontend-design`, then `gsap-scrolltrigger` and `gsap-react`. Use Context7 only for next-intl ICU plurals and `generateStaticParams`/`dynamicParams` if you are unsure.

## Read first

1. `AGENTS.md`, `docs/decisions.md`, `docs/content.md` (Projects, Testimonial), `docs/primitives.md`
2. The prototype as the visual spec: `docs/prototype/work.html` and the rules for `.work-hero*`, `.work-layout`, `.rail*`, `.projects`, `.project*`, `.media*`, `.chip*` in `docs/prototype/assets/site.css`, and `Pages.work` in `docs/prototype/assets/site.js`
3. `docs/choreography.md` (Work) and the existing `src/lib/content/` files, `src/app/[locale]/work/` placeholders, `src/components/ui/{Screen,Chip,ArrowLink}.tsx`

## Goal

The work page, ported from the prototype: a hero, a sticky project rail on desktop that follows the scroll, and one rounded sheet per project with its challenge, what was built, the stack, and a staggered grid of screens that open as you scroll. The page speaks for everything built, with DentaFlow first and clearly strongest.

## Step 0. Housekeeping

1. In `AGENTS.md`, replace "Before replying, run exactly the commands in `.github/workflows/ci.yml`, in order" and the "Quality gates" paragraph with the Lean testing policy above, in your own concise words. Keep the rule that you never report a gate as passing that you did not run.
2. `docs/decisions.md`: the lab is now removed in 05 (it keeps only the `LineDraw` block), because `MediaReveal` and `useScrollSpy` are used by this page. Remove their lab blocks and move their assertions to the work spec.

## Scope

### A. Data (`src/lib/content/`)

Extend `schema.ts` and `projects.ts` (zod-validated at load) so a project carries: `slug`, `featured`, `status`, `permission` (`"confirmed"` or `"pending"`), `caseStudy` (boolean), `stack[]`, `links` (optional), `media[]` as `{ span: 4|5|6|7|8|12, tone: "plain"|"warm"|"blue"|"dark", layout: "default"|"tall"|"wide", skeleton: "agenda"|"record"|"plan"|"invoice"|"list" }` (no real images yet), `screenCount` (optional: the total number of screens that exist when it is larger than `media.length`), and `copyKey`. Each media item also carries `kind: "image" | "video"` (default `"image"`; only the field exists now, video rendering arrives in 08). The work page shows at most 5 curated media per project (the schema rejects more); the full set lives in the case study (05). Port the five projects with the media layouts of the prototype (DentaFlow 7 warm, 5, 4, 4 blue, 4; HMS 8 dark, 4 warm, 6, 6 blue; MeetAI 5 blue, 7, 12 warm; FlowShop 6 warm, 6, 4 blue, 8; Côte Royale 12 warm and the rest as in the prototype). Add `publicProjects()`: only `permission === "confirmed"` appear in the work page, the rail and the sitemap. `publicProjects()` is also what 05 will use for `generateStaticParams`. This branch creates **no per-project route**: the four projects without a case study live only as sheets on the work page (hash anchors such as `#hms`). If a `work/[slug]` placeholder already exists from an earlier branch, leave it as it is, make sure it returns 404 for a slug that is not public, and say in your reply what it contains. The case-study button on DentaFlow links to that route through the localized pathname helper. Set all five projects to `confirmed`: the owner decided to show Côte Royale, and the field stays as the switch for any future project that is not cleared. Côte Royale's stack starts with `GSAP` and `TypeScript`; the rest of its stack is `[TODO: …]`. Unit-test `publicProjects()` with a fixture that includes a `pending` project. Unit-test this and update the sitemap expectations. Only DentaFlow has `caseStudy: true`.

### B. Copy (working draft, final in 08)

`messages/fr.json` and `messages/en.json`, identical keys, namespace `work` and `projects.<slug>`. Only facts from `docs/content.md`; every other fact is a visible `[TODO: …]` string (allowed in development, listed by `todoReport()`). Draft:

| Key | FR | EN |
|---|---|---|
| `work.title` | Des logiciels sur lesquels on s'appuie au quotidien | Software people rely on every day |
| `work.lead` | {count, plural, one {# projet} other {# projets}}, du logiciel de cabinet et d'hôpital aux outils IA et aux boutiques en ligne. Chacun construit de bout en bout, du modèle de données au dernier écran. | {count, plural, one {# project} other {# projects}}, from clinic and hospital software to AI tools and online shops. Each one built end to end, from the data model to the last screen. |
| `work.start` | Commencer par DentaFlow | Start with DentaFlow |
| `work.rail` | Projets sur cette page | Projects on this page |
| `work.challenge` / `built` / `stack` | Le défi / Ce que j'ai construit / Stack | The challenge / What I built / Stack |
| `work.caseStudy` / `demo` / `ask` | Étude de cas / Demander une démo / Poser une question sur ce projet | Case study / Ask for a demo / Ask about this project |
| `work.status.ready` / `todo` | Prêt pour les cabinets / Détails à confirmer | Ready for clinics / Details to confirm |
| `work.screenshot` | Capture à venir | Screenshot to come |
| `projects.dentaflow.kind` | Gestion de cabinet dentaire | Dental clinic management |
| `projects.dentaflow.challenge` | Faire tourner toute la journée d'un cabinet dentaire au même endroit : rendez-vous, patients, soins et facturation. | Run the full day of a dental clinic in one place: appointments, patients, treatments and billing. |
| `projects.dentaflow.built` | Un système de gestion adapté à chaque cabinet avant la mise en service, avec sa propre base de données, son propre déploiement et le nom du cabinet. | A management system adapted to each clinic before launch, with its own database, its own deployment and the clinic's name on it. |
| `projects.hms.kind` / `meetai.kind` / `flowshop.kind` / `cote-royale.kind` | Système de gestion hospitalière / Application web IA / E-commerce / Site web | Hospital management system / AI web app / E-commerce / Website |
| `projects.cote-royale.built` | Une expérience pilotée par l'interface, animée avec GSAP et TypeScript, pour un design et une UX soignés. (brouillon, à confirmer en 08) | An interface-driven experience animated with GSAP and TypeScript, for a polished design and UX. (draft, confirm in 08) |
| `work.allScreens` | Voir les {count} écrans | See all {count} screens |
| other `challenge`, `built` | `[TODO: …]` per project | `[TODO: …]` per project |
| media alt/caption | one `[TODO: describe the screen]` per figure until 08 | same |

### C. Page and sections (`src/components/sections/work/`)

`src/app/[locale]/work/page.tsx` stays thin and composes `WorkHero`, `ProjectRail`, `ProjectList` (server components; small client leaves for motion). Metadata through `lib/seo.ts` (title "Projets"/"Work", description from messages). Tones: all day; footer night.

- **Hero:** `SplitReveal` lines (ready) on the `h1`; lead and link fade up (`Reveal` ready, delay 0.35). The link jumps to `#dentaflow` through the hash link of `TransitionLink` (Lenis, no curtain).
- **Rail (≥ 900 px):** sticky nav, one link per public project; the active project is the one crossing 45 % of the viewport (`useScrollSpy`), shown with the pill and a Majorelle dot; a thin progress line fills across the projects (`Scrub` `scaleY 0 → 1`, scrub 0.6). Below 900 px the rail is hidden exactly as in the prototype. `aria-current="true"` on the active link; real anchors that work without JavaScript.
- **Project sheets:** `article` with `aria-labelledby`, `scroll-margin-top` for the header; head items fade up on entry (`Reveal` enter, stagger 0.07, start `top 80%`); title, kind, status chip, actions (case-study button only when `caseStudy` is true, else `ArrowLink` to the contact page; DentaFlow also "Ask for a demo"); three columns (challenge, built, stack chips); 12-column media grid with `Screen` placeholders using the declared span, tone, layout and skeleton, revealed by `MediaReveal` scrub. When `screenCount` exceeds the media shown and `caseStudy` is true, a link under the grid (`work.allScreens`) goes to the case study. Cursor labels from messages. Hash links to `#slug` arrive on the right sheet after the loader.
- Everything is complete without JavaScript and under reduced motion (no clip, nothing hidden, rail still works as anchors).

## Tests (lean)

- Unit: `publicProjects()` and schema validation, sitemap list, the plural in the lead.
- One spec, `tests/e2e/work.spec.ts`, projects 390 and 1440, `/fr/projets` and `/en/work`: five sheets and five rail links; the rail follows the scroll and the progress line fills (desktop); the hero link lands on DentaFlow; the media reveal reaches its end state; complete without JavaScript (raw HTML contains each public project name) and under reduced motion; ScrollTrigger count returns to baseline after leaving and returning; axe once on `/fr/projets` with no serious or critical issue, including the `todo` chip and the muted text. Report any contrast finding with element and ratio; do not change a colour.
- Evidence: three clips at 1440 (hero intro, rail following the scroll, media reveal) and stills at 1440 and 390.

## Decisions already made (do not re-decide)

All of `docs/decisions.md`. The prototype is the visual spec. No prices, no years of experience, no client names without permission (P7; the owner has cleared Côte Royale, record this in `docs/decisions.md` as an update to P7), no invented project facts. Contact is the call-to-action word.

## Out of scope

The case-study page and any per-project route (05), the contact form (07), real screenshots and final copy (08), JSON-LD (09), budgets, any change to the shell or primitives beyond bug fixes you report.

## Acceptance

1. The lean check list passes (last line of each). Full e2e and Lighthouse are left to CI and listed as such.
2. `/fr/projets` and `/en/work` match the prototype's work page at 1440 and 390; all five projects are listed; the lab keeps only `LineDraw`.
3. `git status --short` is shown; nothing was committed or pushed.

## Reply format

Short. **Summary** (3 to 5 lines), **Files** (one line per folder), **Verification** (the lean list, last line each), **Skills used**, **Deviations**, **Open questions**, **Not verified**, **Evidence** (file list), **Proposed commits**.