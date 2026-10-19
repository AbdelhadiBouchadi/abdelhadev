// Rules behind `pnpm media` (scripts/media.mjs). Pure functions so tests/unit can cover them
// without the originals, which never leave the owner's machine.
import { extname } from "node:path";

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

/** Natural sort by name: "2-a" before "10-a". */
export function naturalCompare(a, b) {
  return collator.compare(a, b);
}

/** "01 Écran Agenda.PNG" -> "01-ecran-agenda": the output names of a source. */
export function slugifyStem(fileName) {
  const stem = fileName.slice(0, fileName.length - extname(fileName).length);
  return stem
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "image", "video" or null, from the extension (case-insensitive). */
export function kindOf(fileName, { images, videos }) {
  const ext = extname(fileName).toLowerCase();
  if (images.includes(ext)) return "image";
  if (videos.includes(ext)) return "video";
  return null;
}

/** The output widths for a source: the configured steps up to the source width; a source
    narrower than the smallest step is written at its own width. Never upscaled. With `retina`
    ({ above, max }), a source wider than `above` also gets one variant at its own width capped at
    `max`, for dense screens (08c). */
export function imageWidths(sourceWidth, steps, retina) {
  const kept = steps.filter((w) => w <= sourceWidth);
  if (kept.length === 0) return [sourceWidth];
  if (retina && sourceWidth > retina.above) kept.push(Math.min(sourceWidth, retina.max));
  return [...new Set(kept)].sort((a, b) => a - b);
}

/** Whether a published file gets the retina variant: `roles` "all", or the roles listed, of
    any of the file's map entries. */
export function wantsRetina(entries, file, roles) {
  if (roles === "all") return true;
  return entries.some((e) => e.file === file && roles.includes(e.role));
}

/** The height kept after cutting a tall capture from the top (height <= width * ratio). */
export function croppedHeight(width, height, maxRatio) {
  return Math.min(height, Math.round(width * maxRatio));
}

/** The AVIF qualities to try, from `start` down to `min`. */
export function qualitySteps({ start, min, step }) {
  const out = [];
  for (let q = start; q >= min; q -= step) out.push(q);
  return out;
}

/** The width the AVIF budget is measured on: `targetWidth`, or the largest output below it. */
export function budgetWidth(widths, targetWidth) {
  const below = widths.filter((w) => w <= targetWidth);
  return below.length > 0 ? Math.max(...below) : Math.min(...widths);
}

/** The output file names of one source (relative to its project folder). */
export function outputNames(stem, kind, widths = []) {
  if (kind === "image") return widths.flatMap((w) => [`${stem}-${w}.avif`, `${stem}-${w}.webp`]);
  return [`${stem}.mp4`, `${stem}.webm`, `${stem}-poster.avif`, `${stem}-poster.webp`];
}

/** Parses "Duration: 00:00:08.73" from ffmpeg's banner, in seconds. */
export function parseDuration(stderr) {
  const m = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/** Parses the first video stream's size ("Video: h264 ..., 1280x608, ...") from ffmpeg's banner. */
export function parseVideoSize(stderr) {
  const line = stderr.split("\n").find((l) => /Stream #.*Video:/.test(l));
  const m = line ? /, (\d+)x(\d+)[,\s]/.exec(line) : null;
  return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
}

/** JSON with object keys sorted at every level (arrays keep their order): a stable manifest. */
export function stableStringify(value) {
  const sort = (v) => {
    if (Array.isArray(v)) return v.map(sort);
    if (v !== null && typeof v === "object") {
      return Object.fromEntries(
        Object.keys(v)
          .sort()
          .map((k) => [k, sort(v[k])]),
      );
    }
    return v;
  };
  return `${JSON.stringify(sort(value), null, 2)}\n`;
}

/** "1.4 MB", "212 KB", "820 B". */
export function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/** The files of a project's map entries that are published (role work or tour), in map order,
    each once (a DentaFlow screen can be both on the sheet and in the tour). */
export function publishedFiles(entries = []) {
  const seen = new Set();
  for (const entry of entries) if (entry.role !== "spare") seen.add(entry.file);
  return [...seen];
}
