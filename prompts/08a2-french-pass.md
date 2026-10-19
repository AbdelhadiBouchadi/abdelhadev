# 08a2-french-pass

Branch: `chore/08a2-french-pass`

## Git rules for this run (they override AGENTS.md)

The owner reviews the diff and commits by hand. You do **not** run `git add`, `git commit`, `git push`, `git stash`, `git checkout`, `git reset` or anything that changes branches or history. Leave every change in the working tree. At the end, give `git status --short` and a proposed commit split.

## Lean testing policy

Before replying, run only: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm check:i18n`, `pnpm check:fr` (new), `pnpm test`, `pnpm build`, and the three pull-request smoke specs (`foundation`, `no-js`, `a11y`) at 1440 only. No full `test:e2e`, no `lhci`, no videos. Never report a gate as passing that you did not run. Keep your reply short.

## Before you start

`feat/08a-final-copy` is merged into `main`. You are on a new branch `chore/08a2-french-pass` with a clean tree. Check `git status` and `git branch --show-current`; if either is wrong, stop and say so.

## Read first

`AGENTS.md`, `docs/decisions.md`, `docs/content.md`, `messages/fr.json`, `messages/en.json`, `src/lib/content/`, `src/lib/seo.ts`, `src/emails/`, the legal notice, the error and not-found pages.

## Goal

The French on the site was drafted from English and reads like a literal translation (for example "clinique dentaire" where a French-speaking dentist says "cabinet dentaire", "typé" for type safety, "licence" for a B.Eng). French is the primary language: it must read as written natively by a developer in Morocco for French-speaking clients. This branch removes the existing problems, writes the rules down, and adds a check so they do not come back.

## Step 1. `docs/french-style.md`

Create it with these rules and this glossary (you may add rows you find while auditing, never remove these).

**Rules**
1. Write the French from the meaning and the situation, never by translating the English sentence word for word. The English is the intent, not the source text.
2. Address clients with "vous". Plain, specific, calm; no em dashes, no exclamation marks, no empty marketing words.
3. Prefer the word a French-speaking professional really uses. Keep common English technical terms that French-speaking developers keep (full-stack, front-end, back-end, server actions, data access layer, API, GraphQL, stack names). Translate everything a client reads.
4. Typography: « guillemets » with no-break spaces inside; a no-break space before `:` `;` `?` `!` and `»`; months in lower case ("octobre 2026"); no capital letters on every word of a heading.
5. Never invent facts while rewording. Keep every `[TODO …]` marker, proper noun and number exactly as it is.

**Glossary**

| Meaning | Write | Never write |
|---|---|---|
| dental practice or dental clinic (private) | cabinet dentaire | clinique dentaire |
| clinic (a health structure) | cabinet, or clinique only inside a proper name or for an inpatient facility | clinique by default |
| type safety, type-safe | typage strict, typage de bout en bout | typé, sécurité de type |
| end to end | de bout en bout | |
| admin panel | espace d'administration (to a client), back-office (technical line) | panneau d'administration, panneau admin |
| dashboard | tableau de bord | |
| to book, booking, available slots | réserver, réservation, créneaux disponibles | booker |
| appointment | rendez-vous | |
| patient file, medical record | dossier patient, dossier médical | |
| treatment plan | plan de traitement | |
| quote, advance invoice, balance invoice | devis, facture d'acompte, facture de solde | |
| to deliver, hand over | livrer, remettre | délivrer |
| custom, tailor-made | sur mesure | customisé |
| to implement | développer, mettre en place | implémenter |
| to support (a feature) | prendre en charge | supporter |
| scalable | évolutif | scalable |
| real time | en temps réel | |
| roles and permissions | rôles et droits d'accès | |
| scope, scoping | périmètre, cadrage | scope |
| launch, go live | mise en ligne | |
| degree | "Bachelor of Engineering (B.Eng)" kept in English; never "licence", never "ingénieur" for the owner | licence, diplôme d'ingénieur |

## Step 2. `pnpm check:fr`

`scripts/check-fr.mjs`, added to `package.json` as `check:fr`, and added to the pull-request workflow next to `check:i18n`. It reads every string value of `messages/fr.json` and fails (naming the key and the phrase) on any of: `clinique dentaire`, `dernière année de licence`, `licence en génie`, `customisé`, `implémenter`, `délivrer`, `scalable`, `panneau d'administration`, `booker`. Proper nouns are not affected (for example "SOS Dental Clinic" is English). Also print, as a **warning only**, the keys whose text has a regular space before `:` `;` `?` `!`. A unit test covers the script's matching on a small fixture.

## Step 3. Audit and rewrite

1. Go through **every** French string a visitor can read: `messages/fr.json`, French fields in `src/lib/content/*`, `src/lib/seo.ts` titles and descriptions, the contact email template, the legal notice, the error and not-found pages, `aria-label` and alt texts, the sitemap-visible titles. For each, read the English next to it for the intent, then judge the French against `docs/french-style.md` and rewrite it where it reads as translated.
2. Required fix: the education entry. Title "Génie informatique", detail "Dernière année de Bachelor of Engineering (B.Eng)", label "Formation". The words "licence" and "ingénieur" must not describe the owner's degree anywhere (update the unit test that bans words accordingly).
3. Do not change keys, the English, facts, placeholders, proper nouns or layout structure. If a rewritten string is clearly longer than the original and could break a layout, say so under Open questions.
4. Write `docs/french-audit.md`: one table with key, before, after, reason, for **every** string you changed. The owner reviews it there. Mark the strings you are least sure about with a star.
5. Add one line to `docs/decisions.md`: French copy is written natively under `docs/french-style.md`, and `check:fr` guards it.

## Decisions already made (do not re-decide)

All of `docs/decisions.md`. No prices, no payment percentages, no years of experience, no invented facts, no personal client names, Contact is the call-to-action word.

## Out of scope

English copy, new copy, the media pipeline, project copy (08c), any layout or motion change.

## Acceptance

1. The lean list passes (last line of each).
2. `check:fr` passes and fails on a planted bad phrase in its unit test.
3. `docs/french-style.md` and `docs/french-audit.md` exist. `git status --short` is shown; nothing was committed or pushed.

## Reply format

Short. **Summary** (3 lines), **Verification**, **Open questions** (starred strings, long strings), **Not verified**, **Proposed commits**, and the one-line text the owner should paste into `AGENTS.md`: "French copy is written natively, never translated word for word. Read docs/french-style.md before writing any French string and run pnpm check:fr."