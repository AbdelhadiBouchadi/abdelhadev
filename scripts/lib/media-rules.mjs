// Pure, so tests/unit covers them without the originals, which never leave my machine.
import { extname } from "node:path";

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

/** "2-a" before "10-a". */
export function naturalCompare(a, b) {
  return collator.compare(a, b);
}

/** "01 Écran Agenda.PNG" -> "01-ecran-agenda" */
export function slugifyStem(fileName) {
  const stem = fileName.slice(0, fileName.length - extname(fileName).length);
  return stem
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function kindOf(fileName, { images, videos }) {
  const ext = extname(fileName).toLowerCase();
  if (images.includes(ext)) return "image";
  if (videos.includes(ext)) return "video";
  return null;
}

/** Never upscaled: a source narrower than the smallest step keeps its own width. With `retina`,
    a source wider than `above` also gets one variant at its own width, capped at `max`. */
export function imageWidths(sourceWidth, steps, retina) {
  const kept = steps.filter((w) => w <= sourceWidth);
  if (kept.length === 0) return [sourceWidth];
  if (retina && sourceWidth > retina.above) kept.push(Math.min(sourceWidth, retina.max));
  return [...new Set(kept)].sort((a, b) => a - b);
}

export function wantsRetina(entries, file, roles) {
  if (roles === "all") return true;
  return entries.some((e) => e.file === file && roles.includes(e.role));
}

/** height <= width * ratio */
export function croppedHeight(width, height, maxRatio) {
  return Math.min(height, Math.round(width * maxRatio));
}

export function qualitySteps({ start, min, step }) {
  const out = [];
  for (let q = start; q >= min; q -= step) out.push(q);
  return out;
}

/** `targetWidth`, or the largest output below it. */
export function budgetWidth(widths, targetWidth) {
  const below = widths.filter((w) => w <= targetWidth);
  return below.length > 0 ? Math.max(...below) : Math.min(...widths);
}

export function outputNames(stem, kind, widths = []) {
  if (kind === "image") return widths.flatMap((w) => [`${stem}-${w}.avif`, `${stem}-${w}.webp`]);
  return [`${stem}.mp4`, `${stem}.webm`, `${stem}-poster.avif`, `${stem}-poster.webp`];
}

/** "Duration: 00:00:08.73" from ffmpeg's banner, in seconds. */
export function parseDuration(stderr) {
  const m = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/** "Video: h264 ..., 1280x608, ..." from ffmpeg's banner. */
export function parseVideoSize(stderr) {
  const line = stderr.split("\n").find((l) => /Stream #.*Video:/.test(l));
  const m = line ? /, (\d+)x(\d+)[,\s]/.exec(line) : null;
  return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
}

/** Keys sorted at every level, arrays in order, so the manifest stays stable. */
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

/** "1.4 MB", "212 KB", "820 B" */
export function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/** Each once: a DentaFlow screen can be both on the sheet and in the tour. */
export function publishedFiles(entries = []) {
  const seen = new Set();
  for (const entry of entries) if (entry.role !== "spare") seen.add(entry.file);
  return [...seen];
}
