# 03-home

Branch: `feat/03-home`

## Git rules for this run (they override AGENTS.md)

The owner reviews the diff and commits by hand. You do **not** run `git add`, `git commit`, `git push`, `git stash`, `git checkout`, `git reset` or anything that changes branches or history. Leave every change in the working tree. At the end, give `git status --short` and a proposed commit split.

Run only the targeted specs and checks for what you are changing while you iterate. Run the full `ci.yml` sequence once at the end, and again only if you changed code afterwards. The owner's machine is slow and a full run takes about nine minutes.

## Before you start (the owner has done this)

`feat/02-primitives` is merged into `main`. You are on a new branch `feat/03-home` with a clean tree. Check `git status` and `git branch --show-current`; if either is wrong, stop and say so. If `docs/primitives.md` does not exist, stop and say so.

## Skills and docs

Run `/skills`. Invoke `frontend-design`, then `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-react`, `gsap-performance`. Use Context7 for current Next.js 16, next-intl, `next/image`, `next/dynamic` and three.js (`WebGLRenderer`, disposal, `CanvasTexture`, `ExtrudeGeometry`) behaviour.

## Read first

1. `AGENTS.md`, `docs/decisions.md` (T6 plain three, T7 loader, D2, D3), `docs/architecture.md`, `docs/content.md` (Home beats, Projects), `docs/quality.md`
2. **`docs/primitives.md`**: the API contract for everything you animate. Compose these primitives; write your own GSAP only for what the document says is page-specific.
3. `docs/spikes/r3f.md` (chunk size, first frame, fallbacks), `docs/spikes/loader-lcp.md`, `docs/spikes/tbt.md`, `docs/baseline.md`
4. The prototype as the visual spec: `docs/prototype/index.html` (sections `#hero`, `#manifesto`, `#dusk`, `#build`, the `#sky` and `#sun` elements), `docs/prototype/assets/site.css` (rules for `.hero*`, `#sun`, `#sky`, `html.sky`, `#scene-wrap`, `.stage`, `.statement`, `.dusk*`, `.build*`, `.tiles`, `.tile`, `.features`), and `docs/prototype/assets/site.js` (`createScene` entirely, and `Pages.home`)
5. `docs/choreography.md` (Home table and the 3D layer paragraph)

## Goal

The home page, ported from the prototype and working end to end: a hero that opens with the sunrise handoff from the loader, a pinned manifesto, a dusk that turns the sky from paper to sunset to night, and a featured-work chapter with DentaFlow, with the one plain-three.js scene floating behind it all. It is the first page that looks like the finished site.

## Scope

### A. Page and sections

`src/app/[locale]/page.tsx` stays thin and composes server sections from `src/components/sections/home/` (`Hero`, `Manifesto`, `Dusk`, `Featured`), each with the smallest client leaf it needs. Use `ToneSection` for the tones: hero `day`, manifesto `day`, dusk `night` starting at `center 50px`, featured `night`; the shared footer is already night. Page metadata (title, description, canonical, alternates, Open Graph basics) through `lib/seo.ts`. One `h1`: the visual wordmark is `aria-hidden` and a screen-reader-only sentence carries the accessible name, as in the prototype, but without claiming a studio: "Abdelhadev, Abdelhadi Bouchadi, full-stack developer in Agadir" (and its French equivalent).

Composition and numbers come from `docs/choreography.md` (Home) and the prototype:

- **Hero** (100 svh): the `FitText` wordmark. Intro on ready: `--wdth 75 → 100` (1.9 s) with characters rising through masks (`SplitReveal` chars, 1.35 s, stagger 0.045), the sun glow rising (2.2 s), the 3D layer fading in (1.8 s, from 0.3 s), meta and foot fading up (`Reveal` ready, from 0.6 s). Scroll: the wordmark settles (`Scrub`: `yPercent -14`, scale 0.92), the meta fades out over the first 45 %, the sun sinks and fades from the hero to the dusk centre. The `--wdth` animation is the prototype's choreography and is allowed even though it reflows text: keep it inside the hero's box, and show that CLS stays at or below 0.02.
- **Manifesto** (240 vh, stage 100 svh): `WordsLight` across the section; the 3D slabs part and recede; the scene layer dims to 0.3 by the time the manifesto is pinned.
- **Dusk** (190 vh): `StickyStage` timeline as in the prototype: sky paper → sunset in the first 28 %, → night in the next 32 %, title lines rising (`SplitReveal` lines, scrub), text colours crossing from ink to moon and moon-soft, the sub line fading up. The header turns to night at the section centre. The slabs fly up and the canvas stops rendering at the end.
- **Featured** (300 vh desktop, auto on mobile): copy fades up, then four `Screen` placeholders open one after another (`clip-path` from the bottom, inner scale 1.22 → 1, stagger 0.32); on mobile each opens as it enters. Screens are the placeholders from 02 with captions Agenda, Patient record, Treatment plan, Invoice; real screenshots arrive in 08. The button goes to `/work/dentaflow` through `TransitionLink`, with cursor label from messages.
- **`Sky`** (`src/components/layout/Sky.tsx`, mounted by the home page only): the fixed background layer and sun from the prototype, colours from tokens read at runtime, `aria-hidden`. In reduced motion and without JavaScript each section has its own static tone background and every text is legible; there is no fixed sky.

### B. The 3D scene (`src/components/three/`)

Plain three.js (decision T6). Port `createScene` faithfully: rounded extruded slabs with canvas-drawn screen textures (agenda, patient, chart, invoice, ai, calendar), two capsules, the lights, six slabs on desktop and four at 0.6 scale on mobile, positions as fractions of the visible half-width and half-height, mouse parallax weighted by depth, idle float, the `part` and `exit` progress mapping, `renderStatic`.

- **Structure:** `HeroScene.tsx` (client component, default-exported only because `next/dynamic` needs it) is loaded with `next/dynamic` and `ssr: false`; the pure scene factory lives in `scene.ts` with its parts (`slabs.ts`, `textures.ts`, `lights.ts`) so it can be unit-tested with mocked three objects. The import of the chunk starts as early as possible after hydration (not when the hero scrolls into view), per spike S1.
- **Colours:** none as literals. Every colour the scene uses comes from CSS tokens read at runtime through a small `lib/css-tokens.ts` (browser only, tested). The prototype's untokenised scene colours (the light colours, the slab white, the pill colours, the texture greys) become a `--scene-*` group in `tokens.css`; list them in your reply. `check:tokens` must keep passing, including for `0x…` numbers.
- **Progress state:** `lib/scene-state.ts`, a framework-free store `{ p1, p2, p3 }` the sections write (from their ScrollTriggers or stage progress) and the scene reads each frame. Unit-tested.
- **Loop:** one render callback on `gsap.ticker` (no second rAF loop). Pixel ratio capped at 1.75. Stop rendering when `p3 ≥ 0.98`, when the document is hidden, and when the canvas is out of view (`IntersectionObserver`). Resize through `ResizeObserver`. Pointer parallax on fine pointers only.
- **Loader:** register a task of weight 3 with `useLoaderTask` that resolves after the first frame (shaders compiled, textures uploaded) or rejects on failure. The loader's ceiling still wins: if the scene is late, the page intro does not wait; the canvas fades in over 1.8 s when it is ready. Never pops in.
- **States** reflected on the wrapper as `data-scene="loading" | "live" | "still" | "poster"`: `live` runs the loop; `still` is reduced motion with WebGL (one frame, the `renderStatic` composition, no ticker, no pointer); `poster` is no WebGL, a failed context or a failed chunk.
- **Poster:** a pre-rendered transparent WebP/AVIF of the resting composition at desktop and mobile aspect ratios, rendered by the real scene through a script `scripts/capture-scene-poster.mjs` (Playwright; a dev tool, not part of CI). Files in `public/media/`. The poster `<img>` is server-rendered inside the wrapper (alt empty, decorative) and shown only for `poster` and for no JavaScript (a CSS rule on `html.js` hides it otherwise). Size the images small.
- **Disposal:** on unmount dispose geometries, materials, textures and the renderer, call `forceContextLoss`, remove listeners and the ticker callback. Prove it with a unit test on mocked objects, and say what you could not verify in a real browser.

### C. Copy (working draft, final wording in 08)

Add a `home` namespace to `messages/fr.json` and `messages/en.json`, identical keys, written natively (French first). Follow `docs/content.md`: broad positioning, no client or years claims, no emoji, no exclamation marks, no em dashes. Use this draft; improve phrasing if you find an error, but do not add facts:

| Key | FR | EN |
|---|---|---|
| `hero.metaLeft` | Développeur full-stack / Agadir, Maroc / Heure locale {time} | Full-stack developer / Agadir, Morocco / Local time {time} |
| `hero.metaRight` | Systèmes de gestion / Applications web IA / Plateformes clients | Management systems / AI web apps / Client platforms |
| `hero.intro` | Je conçois des applications web sur lesquelles on s'appuie au quotidien : systèmes de gestion, applications dopées à l'IA et plateformes clients, du modèle de données jusqu'au dernier écran. Un travail soigné, expliqué simplement, livré par étapes que vous voyez. | I build web applications that people rely on every day: management systems, AI-powered apps and client platforms, from the data model to the last screen. Careful work, explained simply, delivered in stages you can see. |
| `hero.seeWork` | Voir les projets | See the work |
| `manifesto.statement` | On confie à un logiciel ses plannings, ses données et son activité de tous les jours. Je construis des applications qui méritent cette confiance : sûres dès la conception, et assez simples pour qu'on n'ait jamais besoin d'un manuel. | People trust software with their schedules, their data and their daily operations. I build applications that deserve that trust: secure by design, and simple enough that nobody needs a manual. |
| `dusk.title` | Quand le bureau ferme, le logiciel continue de travailler. | When the office closes, the software keeps working. |
| `dusk.sub` | Agendas, dossiers et factures restent en ordre toute la nuit, sur une infrastructure qui vous appartient. | Agendas, records and invoices stay in order overnight, on infrastructure that belongs to you. |
| `featured.product` | DentaFlow | DentaFlow |
| `featured.title` | Un logiciel pour cabinets dentaires | Software for dental clinics |
| `featured.body` | DentaFlow organise la journée d'un cabinet, du premier rendez-vous à la dernière facture. Je l'adapte à chaque cabinet avant la mise en service. | DentaFlow runs the day of a clinic, from the first appointment to the last invoice. I adapt it to each clinic before it goes live. |
| `featured.features` | Agenda et rendez-vous / Dossiers patients / Plans de traitement / Factures et paiements | Agenda and appointments / Patient records / Treatment plans / Invoices and payments |
| `featured.adapt` | Le nom de votre cabinet, **vos données**, votre propre serveur. | Your clinic's name, **your data**, your own server. |
| `featured.cta` | Lire l'étude de cas | Read the case study |
| `featured.captions` | Agenda / Dossier patient / Plan de traitement / Facture | Agenda / Patient record / Treatment plan / Invoice |
| `featured.placeholder` | Capture à venir | Screenshot to come |
| `meta.title` | Développeur full-stack à Agadir | Full-stack developer in Agadir |
| `meta.description` | Abdelhadi Bouchadi conçoit des applications web fiables : systèmes de gestion, applications IA et plateformes clients, du modèle de données au dernier écran. | Abdelhadi Bouchadi builds dependable web applications: management systems, AI apps and client platforms, from the data model to the last screen. |

The DentaFlow feature list is unconfirmed by the owner: keep it in `lib/content/projects.ts` as the single source (with a `[TODO: confirm feature list]` marker in a comment or field that `todoReport()` lists), and let the section read it from there.

### D. Lab

The lab no longer needs the shell and primitive blocks that real pages now exercise. Remove those blocks and their tests, **after** moving each assertion to the home page (header hide and return, tone switching day to night, cursor label, `Reveal`, `SplitReveal`, `WordsLight`, `StickyStage`, `Scrub`, and the leak and StrictMode checks). Keep only the blocks for primitives no real page uses yet (`MediaReveal`, `LineDraw`, `useScrollSpy`); the lab and its 404-in-production rule are removed in 05. Update decision text accordingly and say what coverage moved where.

## Testing and evidence

- Unit tests: `scene-state`, `css-tokens`, scene math (position mapping, `part` and `exit`, mobile spec selection), disposal with mocks.
- Playwright **home** spec at 1440 and 390, both locales: loader to hero intro; each beat reaches its end state when scrolled; the header turns night at the dusk centre and back to day nowhere else before the footer; the featured screens open; the scene wrapper reports `data-scene="live"`; with WebGL blocked (override `getContext` before load) it reports `poster` and the poster is visible; with reduced motion it reports `still` (or `poster`) with no ticker work and nothing sticky; with JavaScript disabled the page is complete (h1, all four sections' text, DentaFlow block, footer legal name) and the poster is visible; no console errors; ScrollTrigger count returns to baseline after leaving the page and coming back.
- Axe on the home page in both locales after the loader, including text over the canvas and the moon-coloured dusk text. Report any contrast finding with element and ratio instead of altering a colour.
- LCP probe on `/fr` and `/en` first visit and visited: record the LCP element and time. The hero intro paragraph is expected to be the LCP element; if the scene or a hero element becomes it, report that.
- Motion evidence in `test-results/motion/` (webm and png): hero intro handoff at 1440 and 390; hero scroll settle; manifesto word light with slabs parting; dusk sky turning to night with header tone change; featured screens opening (desktop and mobile); reduced-motion still; poster fallback.
- Poster images and the capture script's output committed under `public/media/`.
- Update `docs/baseline.md`: JavaScript transfer for `/fr` without the 3D chunk, **the 3D chunk (gzip) separately**, TBT, LCP (element and time), CLS, time to first frame of the scene on normal and throttled profiles, and loader duration on `/fr` first visit. Propose budgets in your reply. Lighthouse CI keeps asserting only what it asserted before.

## Decisions already made (do not re-decide)

All of `docs/decisions.md`. Contact is the only primary call to action word (D9). No theme toggle. No portrait or face (P9). Positioning is broad (P2); clinic software is the featured work, not the page's message. Prices, years of experience and client counts do not appear. No new runtime dependency beyond what is installed (`three` is).

## Out of scope

The work, case-study, about and contact pages (04 to 07), real screenshots and final copy (08), JSON-LD and OG images (09), new budgets, any change to the shell or primitives other than bug fixes you report.

## Acceptance

1. The full `ci.yml` sequence passes once at the end. Paste the last lines of each.
2. `/fr` and `/en` show the complete home as described, with the sunrise handoff from the loader into the hero intro, the scrubbed beats and the night close, on desktop and at 390 px. Show the videos.
3. The scene is a lazy chunk, absent from the initial JavaScript; its gzip size is reported; no WebGL gives the poster, reduced motion gives one still frame, no JavaScript gives the poster and complete text.
4. `git grep -nE "0x[0-9a-fA-F]{6}|#[0-9a-fA-F]{3,8}" -- src/components/three src/lib/css-tokens.ts` finds no colour literal; `pnpm check:tokens` passes.
5. CLS on `/fr` at most 0.02 with the `--wdth` intro in place.
6. `git status --short` is shown and nothing was committed or pushed.

## Reply format

As in `AGENTS.md`, plus **Measured** (JavaScript without the scene, scene chunk, TBT, LCP element and time, CLS, first frame, loader duration), **Scene tokens added**, **Coverage moved from the lab**, **Motion evidence** (file list), **Proposed budgets**, and **Proposed commits**.