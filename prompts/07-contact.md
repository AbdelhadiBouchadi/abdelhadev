# 07-contact

Branch: `feat/07-contact`

## Git rules for this run (they override AGENTS.md)

The owner reviews the diff and commits by hand. You do **not** run `git add`, `git commit`, `git push`, `git stash`, `git checkout`, `git reset` or anything that changes branches or history. Leave every change in the working tree. At the end, give `git status --short` and a proposed commit split.

## Lean testing policy (applies to this run even if AGENTS.md does not say so yet)

The owner's machine is slow and every full run costs time and tokens. Pull requests run only a small smoke in CI; the full suite runs separately.

- While iterating: `pnpm typecheck` and the single spec you are working on, on one project (`--project=1440`, then once on `--project=390`).
- Before replying, run only: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm check:tokens`, `pnpm check:i18n`, `pnpm test`, `pnpm build`, **this branch's own spec** (`contact.spec.ts`) at 390 and 1440, the three pull-request smoke specs (`foundation`, `no-js`, `a11y`) at 1440 only, and the `reduced-motion` spec for `/fr/contact` at 1440.
- Do **not** run the full `pnpm test:e2e` and do **not** run `pnpm lhci`. List them under "Not verified" as "runs in e2e-full".
- Never re-run something that already passed unless you changed code that it covers. No exploratory measurements, traces, cross-browser runs or repeat-each loops.
- Motion evidence is capped: at most three short clips and three stills (1440, plus one 390 still).
- Keep your reply short: no file-by-file narration, no pasted command output beyond the last line of each check.
- Never report a gate as passing that you did not run.

## Before you start (the owner has done this)

`feat/06-about` is merged into `main`. You are on a new branch `feat/07-contact` with a clean tree. Check `git status` and `git branch --show-current`; if either is wrong, stop and say so.

## Skills and docs

Run `/skills`. Invoke `frontend-design`, `gsap-scrolltrigger` and `gsap-react`. Use Context7 for the current Resend Node SDK (`emails.send`), the Arcjet Next.js SDK (rate limit and bot detection in a server action), and Next.js 16 server actions with `useActionState` and progressive enhancement. Do not guess an API from memory.

## Read first

1. `AGENTS.md` (the lines on env, secrets and the contact action), `docs/decisions.md`, `docs/content.md` (Contact, Legal), `docs/primitives.md`
2. The prototype as the visual spec: `docs/prototype/contact.html`, the rules for `.contact-hero`, `.contact-layout`, `.card`, `.form`, `.field`, `.hp`, `.form-foot`, `.form-done`, `.wa-card`, `.wa-preview`, `.next-steps` in `docs/prototype/assets/site.css`, and `initForms` and `Pages.contact` in `docs/prototype/assets/site.js`
3. `docs/choreography.md` (Contact), `src/lib/site.ts`, `src/lib/env.ts`, `src/actions/`, `src/components/sections/about/` (the process cards), the legal notice sources, `src/components/ui/`

## Goal

The contact page at `/fr/contact` and `/en/contact`, ported from the prototype and made real: an email form that sends through Resend, a WhatsApp card whose message follows the form live, and the project process shown beside them. It works for clinics and for small clients with the same form.

## What the owner sets up himself (do not ask for secrets; never write a real key anywhere)

Resend account and API key, the inbox that receives messages, an Arcjet key, and later the domain verification for sending from `@abdelhadev.me`. You only create the names in `.env.example` and the zod parsing. The owner fills `.env.local` and the Vercel variables.

## Step 0. Housekeeping

1. `docs/content.md`: update the Contact section: the process shown is the one on the about page (listen, scoping within 24 hours, quote 24 to 48 hours after the first conversation, advance invoice then build, balance invoice and delivery, no percentages); **remove "about thirty minutes"**; the form confirmation is on screen only (no automatic email to the visitor yet). Keep "No reply-time promises".
2. `docs/decisions.md`: add the decisions of this branch (rate limiting with Arcjet, a dry-run flag that can never be on in production, no auto-reply, the contact form sends to an inbox that is never published).

## Scope

### A. Environment (`src/lib/env.ts`, `.env.example`)

zod-parsed, server-only values never imported by client modules: `RESEND_API_KEY`, `CONTACT_TO` (the private inbox), `CONTACT_FROM` (default `Abdelhadev <onboarding@resend.dev>` until the domain is verified), `ARCJET_KEY`, and `CONTACT_DRY_RUN`. Rules: in production (`VERCEL_ENV === "production"`) the key, `CONTACT_TO` and `ARCJET_KEY` are required, and `CONTACT_DRY_RUN=1` there makes the app refuse to start with a clear message, so a dry run can never run in production. Outside production, missing keys are allowed and the action says so in a developer log without personal data. List names only in `.env.example`, with one comment line each. The Playwright web server sets `CONTACT_DRY_RUN=1`.

### B. Schema and action

- One zod schema shared by the form and the action (`src/lib/contact-schema.ts` or the existing schema folder): `name` (2 to 80 characters), `email` (valid, at most 120), `topic` (one of `clinic`, `ai`, `shop`, `website`, `other`), `message` (20 to 3000 characters), `company` (the honeypot, must be empty), and `locale`. Error messages are translation keys, rendered in the page language.
- `src/actions/contact.ts` (server action, `useActionState`): validates; a filled honeypot returns the success state without sending; Arcjet applies a rate limit (for example 5 messages per hour per IP) and bot detection, and fails open with a non-personal log line if Arcjet itself errors; then sends one plain-text email through Resend from `CONTACT_FROM` to `CONTACT_TO`, with `replyTo` set to the visitor's email, subject `[Abdelhadev] {topic label} · {name}`, and a body with the message, the topic, the page language and the time (no IP address). With `CONTACT_DRY_RUN=1` it validates and returns success without calling Resend or Arcjet. Resend errors map to a translated, user-safe error. **Never log the name, the email or the message**, and never return provider error text to the browser.
- A small `lib/mailer.ts` wrapper so the action is unit-testable without the network.
- The form works **without JavaScript** as a native post: the server renders the field errors and the success state. If Next 16 cannot do that for your setup, say so and keep the JavaScript path complete.

### C. WhatsApp composer (`src/lib/whatsapp.ts`, pure and unit-tested)

Builds the message from the fields, in the page language: greeting "Bonjour Abdelhadi," or "Hello Abdelhadi,"; the name and the topic label when present; the message. URL-encodes it onto `https://wa.me/<number from site.ts>?text=…`. The preview card updates live from the form (a small client leaf); without JavaScript the button opens `wa.me/<number>` with no text.

### D. Copy (working draft, final in 08)

`messages/fr.json` and `messages/en.json`, identical keys, namespace `contact`. Process steps are read from `about.process` (do not duplicate them); show steps 1 to 4 only.

| Key | FR | EN |
|---|---|---|
| `contact.meta.title` / description | Contact / Écrivez-moi pour parler de votre projet : logiciel de gestion, application IA, boutique en ligne ou site web. | Contact / Write to me about your project: management software, AI app, online shop or website. |
| `contact.title` | Parlons de votre projet | Let's talk about your project |
| `contact.lead` | Écrivez-moi par email avec le formulaire, ou continuez sur WhatsApp. Dans les deux cas, je lis chaque message moi-même. | Write to me by email with the form, or continue on WhatsApp. Either way, I read every message myself. |
| `contact.form.title` / intro | Envoyer un message / Il arrive directement dans ma boîte de réception. | Send a message / It reaches my inbox directly. |
| labels | Votre nom / Email / Votre projet / De quoi avez-vous besoin ? | Your name / Email / Your project / What do you need? |
| topic options | Un logiciel de gestion pour mon cabinet ou mon service de santé / Une application web avec IA / Une boutique en ligne / Un site web avec espace d'administration / Autre chose | Management software for my clinic or health service / An AI-powered web app / An online shop / A website with an admin panel / Something else |
| `contact.form.hint` | Décrivez comment votre équipe travaille aujourd'hui et ce qui vous ralentit : c'est un excellent début. | How your team works today and what slows you down is a perfect start. |
| errors | Indiquez votre nom pour que je sache à qui répondre. / Indiquez une adresse email comme nom@exemple.ma. / Choisissez l'option la plus proche. / Dites-m'en un peu plus, au moins deux phrases. | Enter your name so I know who to reply to. / Enter an email address like name@example.com. / Choose the closest option. / Tell me a little more, at least a couple of sentences. |
| `contact.form.privacy` | Vos informations servent uniquement à vous répondre. | Your details are only used to reply to you. |
| submit / sending | Envoyer le message / Envoi en cours… | Send message / Sending… |
| success title / text | Message envoyé / Merci. Je vous réponds personnellement. | Message sent / Thank you. I will reply to you personally. |
| success action | Écrire un autre message | Write another message |
| send error | Le message n'a pas pu être envoyé. Vos mots sont conservés : réessayez, ou écrivez-moi sur WhatsApp. | The message could not be sent. Your words are kept: try again, or write to me on WhatsApp. |
| rate-limit error | Trop de messages en peu de temps. Réessayez plus tard ou écrivez-moi sur WhatsApp. | Too many messages in a short time. Try again later or write to me on WhatsApp. |
| WhatsApp card | Plutôt WhatsApp ? / Le message du formulaire est copié ici, pour l'envoyer sur WhatsApp à la place. / Continuer sur WhatsApp | Prefer WhatsApp? / Your message from the form is copied here, so you can send it on WhatsApp instead. / Continue on WhatsApp |
| next steps title | Et ensuite ? | What happens next? |

### E. Page and sections (`src/components/sections/contact/`)

`contact/page.tsx` stays thin: `ContactHero`, `ContactForm` (client), `WhatsAppCard` (night), `NextSteps`. Metadata through `lib/seo.ts`. Tones as in the prototype: hero and form day, WhatsApp card night, footer night. The `@footer` page for this route already exists.

- **Hero:** `SplitReveal` lines on the h1; lead and the two cards fade up (`Reveal`, delay 0.35 and 0.45, stagger 0.1), after the loader.
- **Form:** labels, `aria-describedby` for hints and errors, `aria-invalid`, errors announced and focus moved to the first invalid field, the honeypot hidden from everyone, a submit button with a visible pending state that is disabled while sending, success replaces the form in place and moves focus to its heading, "Write another message" resets and refocuses. Keep the prototype's look; colours from tokens only (`--danger` already exists).
- **WhatsApp card:** the live preview in a polite live region, the button with the cursor label, the number as text (`+212 6 37 02 50 32`), and the process steps.
- Everything is complete without JavaScript and under reduced motion. All targets are at least 44 px.

### F. Legal notice

Update the personal-data paragraph of the legal notice (both languages) to say what the form really does: name, email, project type and message are sent through Resend to the owner's inbox; Arcjet processes the IP address for rate limiting and bot protection; nothing is stored on the site. Leave the retention period as `[TODO: retention period]` and `legalReview: "pending"` as they are.

## Tests (lean)

- Unit: the schema (each field, both locales' error keys), the action with `CONTACT_DRY_RUN` (valid, invalid, honeypot returns success without calling the mailer, rate-limited, mailer failure maps to the translated error, no personal data in logs), `whatsapp.ts` (greeting by locale, encoding, empty fields), and `env.ts` (dry run in production refuses).
- One spec, `tests/e2e/contact.spec.ts`, projects 390 and 1440, `/fr/contact` and `/en/contact`: invalid submit shows errors, sets `aria-invalid` and focuses the first invalid field; typing updates the WhatsApp preview and link in the page language; a valid submit (dry run) shows the success state and focuses its heading; "Write another message" resets; without JavaScript the raw HTML contains the form and a native post returns the success state; reduced motion is complete; the page has no horizontal overflow at 390; axe once with the errors visible, no serious or critical issue. Report any contrast finding with element and ratio.
- Evidence: two clips at 1440 (intro, validation then success) and stills at 1440 and 390.

## Decisions already made (do not re-decide)

All of `docs/decisions.md`. The prototype is the visual spec. No prices, no payment percentages, no public email address, no reply-time promise, WhatsApp reminders not live. Contact is the call-to-action word.

## Out of scope

Routing mail on the domain and verifying the Resend domain (the owner), an automatic reply to the visitor, a CAPTCHA, analytics, calendar booking, testimonials and final copy (08), JSON-LD and OG images (09), budgets.

## Acceptance

1. The lean check list passes (last line of each). `e2e-full` and Lighthouse are listed as not run.
2. `/fr/contact` and `/en/contact` match the prototype's contact page at 1440 and 390 with the changes above; the action validates, rate-limits, sends through Resend when keys exist and never logs personal data; `.env.example` lists names only.
3. `git status --short` is shown; nothing was committed or pushed; no secret appears anywhere in the diff.

## Reply format

Short. **Summary** (3 to 5 lines), **Files** (one line per folder), **Verification** (the lean list, last line each), **Skills used**, **Deviations**, **Open questions**, **Not verified**, **Evidence** (file list), **Proposed commits**, plus **Setup the owner must do** (the exact env names and where to set them).