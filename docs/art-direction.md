# Art direction

The visual spec is the prototype in `docs/prototype/` (`assets/site.css` holds every value). This file explains the system so agents keep it consistent.

## Concept: an Agadir day

Every page opens at dawn: the loader is night, the sun rises with the page's real loading progress, and the name builds letter by letter. The page lives in warm, sunlit paper. On the home page the sun sets as you scroll, the sky passes through sunset into night, and the night carries the product and the close. Leaving a page, the sun sets behind a curtain; arriving, it rises again. Warmth comes from light, not from a face.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F7F0E8` | day background |
| `--sheet` | `#FFFBF6` | project sheets, cards on day |
| `--sand` | `#EEDFCC` | media frames, quiet fills |
| `--sand-2` | `#E4D2BF` | secondary fill |
| `--sunset` | `#F1BC9C` | sky between day and night |
| `--glow` | `#FFB48A` | the sun: accents on night, night buttons, highlights |
| `--rose` | `#F3A28F` | gradient partner of glow only |
| `--ink` | `#2B1D1A` | text on day, day buttons |
| `--ink-soft` | `#6B564D` | secondary text on day |
| `--line` | `rgba(43,29,26,.12)` | hairlines on day |
| `--night` | `#1E1513` | night background, loader |
| `--night-2` | `#2B201C` | cards and frames on night |
| `--night-3` | `#382A25` | raised fill on night |
| `--moon` | `#F4E6D7` | text on night |
| `--moon-soft` | `#C2AC9D` | secondary text on night |
| `--line-night` | `rgba(244,230,215,.14)` | hairlines on night |
| `--majorelle` | `#3D52D5` | spot accent: logo horizon, cursor, focus ring, button hover sweep on day |
| `--majorelle-soft` | `#AEB7F4` | accent on night, data tints |
| `--danger` | `#B3261E` | form errors |

Majorelle is never a resting button fill. Buttons: espresso (`--ink`) on day, `--glow` on night; the hover is a fill that sweeps up from the bottom (Majorelle on day, moon on night).

## Type

- Display: **Bricolage Grotesque**, weights 500 to 800, `wdth` 84 to 100, `opsz` 24 to 96. Headings use negative tracking (`-0.03em` to `-0.05em`) and `text-wrap: balance`.
- Text: **Instrument Sans**, 400 to 700, base 17 px, line height 1.55, running text near 40 to 65 characters.
- Scale (from the prototype): hero wordmark fitted to the column width; `h-xl` clamp(44px, 8.4vw, 148px); `h-lg` clamp(38px, 6vw, 100px); `h-md` clamp(30px, 3.8vw, 58px); statement clamp(30px, 4.4vw, 66px); `h-sm` clamp(24px, 2.2vw, 32px); lead clamp(18px, 1.4vw, 21px).
- No uppercase eyebrow labels, no monospace labels, no single highlighted word in a headline.

## Shape and surface

- Pill buttons and chips (`999px`), sheets and cards 22 to 28 px radius, media frames 18 to 20 px, screens 12 px.
- Borders are hairlines from the line tokens; shadows only where a surface floats (mobile pill nav).
- The blueprint grid, mono labels and square corners from the old design system are retired.

## Imagery

- Real product screenshots with seeded fake data, inside rounded frames. Until they exist, the CSS placeholder screens from the prototype (`.screen`) are used and labelled "Screenshot to come".
- The home 3D scene: glossy floating slabs carrying UI screens (agenda, patient record, chart, invoice, AI chat, calendar) and two capsules (one Majorelle, one glow), warm key light and a cool rim light.
- No stock photos, no AI-generated people, no photos of the owner.

## Brand

- Mark: the sun (glow) above the horizon line (Majorelle) and its reflection (Majorelle at 55%).
- Lockups and icons in `brand/` and `public/brand/`; React components in `src/components/brand/`.
- Wordmark: "Abdelhadev", outlined from Bricolage Grotesque Bold, tracking `-0.03em`.

## Layout

- Max frame 1440 px, side gutter `max(clamp(16px, 4vw, 56px), safe-area inset)`.
- Type is left-weighted; centring is rare and deliberate.
- Header height 76 px desktop, 64 px under 760 px.
- Breakpoints: 760 px (mobile nav), 900 px (single column layouts, rail hidden), 1080 px (project head two columns).
