ASSETS_DIR: <"C:\Users\DELL\Desktop\abdelhadev_assets">

# 08b-media

Branch: `feat/08b-media`

If `ASSETS_DIR` above is still the placeholder, or the folder does not exist, stop and say so.

## Git rules for this run (they override AGENTS.md)

The owner reviews the diff and commits by hand. You do **not** run `git add`, `git commit`, `git push`, `git stash`, `git checkout`, `git reset` or anything that changes branches or history. Leave every change in the working tree. At the end, give `git status --short` and a proposed commit split.

## Lean testing policy

The owner's machine is slow; every full run costs time and tokens.

- While iterating: `pnpm typecheck` and the single spec you are working on, `--project=1440`, then once on `--project=390`.
- Before replying, run only: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm check:tokens`, `pnpm check:i18n`, `pnpm check:fr`, `pnpm test`, `pnpm build`, the specs this branch touches (`work`, `case-study`, `about`) at 390 and 1440, and the three pull-request smoke specs (`foundation`, `no-js`, `a11y`) at 1440 only.
- Do **not** run the full `pnpm test:e2e` and do **not** run `pnpm lhci`. List them under "Not verified" as "runs in e2e-full".
- Never re-run something that already passed unless you changed code it covers. No exploratory traces or repeat loops.
- Keep the reply short: no file-by-file narration, only the last line of each check. Never report a gate as passing that you did not run.

## Before you start

`main` is up to date. You are on a new branch `feat/08b-media` with a clean tree. Check `git status` and `git branch --show-current`; if either is wrong, stop and say so.

## Skills and docs

Run `/skills`. Invoke `frontend-design` and the `french-copy-quality` skill (for the French alt texts).

Read first: `AGENTS.md`, `docs/decisions.md`, `docs/content.md`, `docs/french-style.md`, `docs/primitives.md`, `prompts/04-work.md` and `prompts/05-case-study.md` (what the work page and the DentaFlow tour expect), `src/lib/content/` (projects, case-studies, schema), the work page and case-study components, `MediaReveal`, the UI Screen skeletons, `messages/fr.json`, `messages/en.json`.

## Goal

Replace the placeholder screens with the owner's real screenshots and short video loops, through a repeatable `pnpm media` pipeline that optimises everything, writes a manifest, and keeps originals out of the repository. Also apply four content removals and one reordering.

## Rule about file names

**Never hard-code a screenshot or video file name** in code, tests, docs or messages. The owner named the files himself and they may change. The only hard-coded mapping allowed is folder to project slug (Step 2). Everything else is discovered at run time and recorded in an editable map file (Step 3).

## Step 0. Removals and order (small, do these first)

1. **FlowShop leaves the project.** Remove the `flowshop` project from the project data, the messages in both languages, the work-page order and rail, the sitemap, every test that mentions it, and `docs/content.md`, `docs/decisions.md` and any other doc. Keep the *e-commerce* capability wherever the about, services or experience copy says the owner builds online shops. Do not touch `docs/prototype/` (it is the frozen visual reference). Afterwards, a case-insensitive search for `flowshop` in `src`, `messages`, `tests`, `docs` (except `docs/prototype/`), `README.md` and `scripts` must find nothing. Report the search.
2. **The festival leaves the about timeline.** Remove the Dérive Casablancaise timeline entry, its external link, its `[TODO: year]`, the messages for it, and the assertions about it in `about.spec.ts`. If the external-link component was used only there, remove it as dead code; if it is generic and used elsewhere, keep it. In `docs/content.md`, remove the festival from "pending projects". **Keep** the `festival` testimonial entry (organisation "Dérive Casablancaise", `confirmed: false`) in `testimonials.ts`: the name now appears only there. Update `decisions.md` accordingly in one line.
3. **Work-page order** becomes: `dentaflow`, `meetai`, `hms` (displayed Ophtachusm), `yoga-booking`, `cote-royale`. `yoga-booking` is not added to `projects.ts` in this branch (08c adds it with its copy); the order list and the media config may already contain its slug, and nothing may break while the project is absent. Update the rail, anchors, tests that assert the order, and docs.
4. Do not change any copy beyond these removals (08c rewrites the project copy and the work-page headings).

## Step 1. The pipeline: `pnpm media`

`scripts/media.mjs`, added to `package.json` as `media`. Dev dependencies allowed: `sharp` and `ffmpeg-static` (so the owner does not install ffmpeg). Add no other dependency.

Behaviour:

- Reads originals from `ASSETS_DIR` (read from an environment variable `ASSETS_DIR`, falling back to the value at the top of this prompt written to `.env.local`-style docs only; the path is never committed anywhere: put it in `scripts/media.local.json` and add that file to `.gitignore`). The script prints a clear message if it is missing.
- Options: `--only <slug>` to process one project, `--force` to ignore the cache. Without options it processes only files whose content hash changed (store hashes in the manifest). Print one compact line per file and a final summary; no per-pixel chatter.
- **Images** (png, jpg, jpeg, webp): strip all metadata; never upscale; write AVIF and WebP at widths 640, 960, 1440 and 1920 (only widths up to the source width, always include the source width if smaller than 640); quality chosen so a 1440 AVIF stays under 200 KB where possible; compute a 16 px wide blur placeholder as a base64 WebP data URI stored in the manifest; record intrinsic width and height.
- **Videos** (mp4, mov, webm): no audio track; maximum width 1280; frame rate capped at 30; produce an H.264 MP4 (`yuv420p`, `+faststart`) and a VP9 WebM; each output must be **under 1.5 MB**: if it is larger, retry with a higher CRF in steps until it fits, and fail with a clear message if it cannot (suggesting a shorter clip). Warn when a clip is longer than 10 seconds. Extract a poster frame at about one second as WebP (and AVIF) plus its blur placeholder. Record duration, dimensions and bytes.
- Outputs go to `public/work/<slug>/` with names derived from the slugified source stem. Never copy an original into `public/`. Delete outputs whose source disappeared.
- Writes `src/lib/content/media.manifest.json` (sorted keys, stable, committed). Validate it with zod in `src/lib/media.ts`, which exposes typed helpers to the rest of the app.
- The script must run on Windows (PowerShell) and Linux: use Node path APIs only.

## Step 2. Folder to project mapping

In `scripts/media.config.mjs`, the single hard-coded table (folder, then slug):

| Folder in `ASSETS_DIR` | Slug |
|---|---|
| `dentaflow` | `dentaflow` |
| `meetai` | `meetai` |
| `ophtachusm` | `hms` |
| `yoga-booking` | `yoga-booking` |
| `cote-royale` | `cote-royale` |

A missing folder prints a warning and is skipped; it never fails the run.

## Step 3. Discover, look, map (this is where file names come from)

1. List every file in each folder (natural sort by name). **Look at each image yourself** (open it) and at one frame of each video, and for each file write a one-line neutral description of what the screen shows (what it is, not praise).
2. Create `src/lib/content/media.map.json`: for every slug an ordered list of entries `{ "file": "<discovered name>", "role": "work" | "tour" | "spare", "step": <number, tour only> }`, plus FR and EN alt-text keys. This file is the only place discovered file names appear, and the owner may edit it by hand. `pnpm media` reads it; a file in a folder that is not in the map is processed as `spare` and reported.
3. Slot counts to fill, in order of the folder's natural sort unless the content clearly says otherwise (explain any reordering in one line):

   | Slug | Work page | Other |
   |---|---|---|
   | `dentaflow` | 5 | the seven steps of the case-study tour (map each tour step to the screenshot that best shows it; if none fits a step, leave that step on its skeleton) |
   | `meetai` | 3 | |
   | `hms` | 4 | |
   | `yoga-booking` | 4 | |
   | `cote-royale` | 3 video loops | stills, if any, are `spare` and may serve as fallback posters |

4. **Do not publish** an image that shows a price or a plan price (decision P5), a real person's face or webcam image, or an unmasked real email, phone number or patient name. Mark it `spare` and list it under Open questions with the reason. Exception already decided by the owner: his own email visible in the MeetAI sidebar is acceptable. For `hms`, also report any visible hospital, department, partner logo or professor name, without changing the image.
5. Alt texts: for each `work` and `tour` entry write a French and an English alt text that says what the screen shows (module and what is visible), under 140 characters, no marketing words, French written natively under `docs/french-style.md`. Store them as message keys (`work.<slug>.media.<index>.alt` and for videos also `.label`), not in the map. Mark any alt text you are unsure about with a star in your reply.

## Step 4. Render the media

1. A `ProjectMedia` component (or the existing `MediaReveal` extended) that renders a manifest entry:
   - **Image:** `<picture>` with AVIF then WebP sources, `srcset` and `sizes`, explicit `width` and `height` (no layout shift), the blur placeholder as the background until loaded, `loading="lazy"` and `decoding="async"` except the first media of the first project in view. Do not also run it through `next/image` optimisation (it is already optimised).
   - **Video:** `<video muted loop playsinline preload="none">` with MP4 and WebM sources and the poster; it starts only when at least half visible (IntersectionObserver) and pauses when not visible; a visible **pause/play button** (44 px target, accessible name from a message key) is always present because the loops autoplay (WCAG 2.2.2); with `prefers-reduced-motion` it never autoplays and shows the poster with the play button; without JavaScript the poster is shown. Give it an `aria-label` from the `.label` key.
   - Keep the existing reveal behaviour of `MediaReveal`; add no new motion tokens or colours.
2. **Work page:** for each project, replace the skeleton screens with the real media of the `work` role, in map order, up to the slot count; if fewer files exist than slots, show the real ones and keep skeletons for the rest; never show more than 5 per project. Derive any "screens" count shown on the page from the manifest, not from a constant.
3. **DentaFlow case study:** replace the tour skeletons with the mapped `tour` images; steps without an image keep their skeleton.
4. Layout, spacing, rail and everything else stay as they are. No change to the prototype's visual design.

## Step 5. Tests (lean)

- Unit: the manifest passes its zod schema; every file it references exists under `public/work/`; no raw `png`, `jpg` or `jpeg` exists under `public/work/`; every video output is under 1.5 MB; every `work` and `tour` map entry has FR and EN alt keys present in both message files; every file named in `media.map.json` is mentioned nowhere else in `src`, `tests` or `messages` (grep test); `media.map.json` and the manifest agree on the same files. Mock the filesystem or use small fixtures: the real originals are not available in CI.
- E2E (`work.spec.ts`, `case-study.spec.ts`) at 390 and 1440: media renders in the server HTML with non-empty alt, intrinsic `width` and `height`; each video has a poster, an `aria-label` and a pause/play button; with `reducedMotion: "reduce"` no video is playing; no horizontal overflow at 390; the work-page order matches Step 0.3; no text `flowshop` in the page.
- Do not write assertions that name a screenshot file. Read what to expect from the manifest.
- The three smoke specs at 1440.

## Decisions already made (do not re-decide)

All of `docs/decisions.md`. No prices anywhere (P5), no personal client names, no owner on camera (P9), "Contact" is the call to action word. The owner works on Windows PowerShell on a slow machine.

## Out of scope

Project copy, the work-page headings and the GitHub link (08c), adding `yoga-booking` to `projects.ts` (08c), architecture diagrams, SEO and OG images (09), launch gates (10), the diagram focus-stop tidy.

## Acceptance

1. The lean list passes (last line of each). `e2e-full` and Lighthouse listed as not run.
2. `pnpm media` runs from a clean state, is idempotent (a second run changes nothing), and prints a summary with total bytes per project.
3. The work page and the DentaFlow tour show real media where mapped; skeletons remain only where no file exists.
4. A search for `flowshop` finds nothing outside `docs/prototype/`; the festival is gone from the about timeline and remains only as a hidden testimonial entry.
5. No original screenshot or video is inside the repository. `git status --short` is shown; nothing was committed or pushed.

## Reply format

Short. **Summary** (3 lines), **Mapping** (a table per project: discovered file, role, one-line description, with stars on uncertain alt texts), **Verification**, **Flagged images** (anything not published and why), **Open questions**, **Not verified**, **Totals** (bytes in `public/work/` per project), **Proposed commits**, `git status --short`.