# French style

French is the site's primary language. It is written natively, by a developer in Morocco, for French-speaking clients. Read this file before writing any French string; `pnpm check:fr` guards the phrases it bans (scripts/lib/fr-rules.mjs).

## Rules

1. Write the French from the meaning and the situation, never by translating the English sentence word for word. The English is the intent, not the source text.
2. Address clients with "vous". Plain, specific, calm; no em dashes, no exclamation marks, no empty marketing words.
3. Prefer the word a French-speaking professional really uses. Keep common English technical terms that French-speaking developers keep (full-stack, front-end, back-end, server actions, data access layer, API, GraphQL, stack names). Translate everything a client reads.
4. Typography: « guillemets » with no-break spaces inside; a no-break space before `:` `;` `?` `!` and `»`; months in lower case ("octobre 2026"); no capital letters on every word of a heading.
5. Never invent facts while rewording. Keep every `[TODO …]` marker, proper noun and number exactly as it is.

### Typography in practice

- In `messages/fr.json` the no-break space is written as the escape ` ` (for example `"Un projet en tête ?"`), so it is visible in review. `check:fr` warns about any regular space before `:` `;` `?` `!`.
- A month starts with a capital only where the label starts with it ("Octobre 2026" alone on a timeline line); inside a sentence it is lower case.
- "e-mail" with a hyphen ("adresse e-mail", label "E-mail").

## Glossary

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
| degree | "Bachelor of Engineering (B.Eng)" kept in English; never "licence", never "ingénieur" for me | licence, diplôme d'ingénieur |
| to build (software) | développer, réaliser, concevoir | construire (une application, un logiciel) |
| secure by design | sécurisé dès la conception | sûr dès la conception |
| based in (a city) | installé à (legal text), à (elsewhere) | basé à, in a legal text |
| within 24 hours | sous 24 heures | en 24 heures (that is a duration) |
| freelance projects | missions freelance | projets freelance, in an availability line |
| the challenge (project sheet heading) | l'enjeu | le défi |
| eye images, eye imaging | imagerie oculaire | images de l'œil |
| first conversation (with a client) | premier échange | première conversation |
| email | e-mail | email |
