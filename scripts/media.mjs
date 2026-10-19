// pnpm media [--only <slug>] [--force]
// The originals stay in ASSETS_DIR, outside the repository; nothing is copied from there as is.
// Only files the map publishes (role work or tour) are written. A file is redone only when its
// content or the settings change, and outputs nobody maps any more are deleted.
// Paths go through node:path only, so it runs the same in PowerShell and on Linux.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import {
  budgetWidth,
  croppedHeight,
  formatBytes,
  imageWidths,
  kindOf,
  naturalCompare,
  outputNames,
  parseDuration,
  parseVideoSize,
  publishedFiles,
  qualitySteps,
  slugifyStem,
  stableStringify,
  wantsRetina,
} from "./lib/media-rules.mjs";
import {
  FOLDERS,
  IMAGE,
  IMAGE_EXTENSIONS,
  PATHS,
  VIDEO,
  VIDEO_EXTENSIONS,
} from "./media.config.mjs";

const root = resolve(import.meta.dirname, "..");
const EXT = { images: IMAGE_EXTENSIONS, videos: VIDEO_EXTENSIONS };

const { values: args } = parseArgs({
  options: { only: { type: "string" }, force: { type: "boolean", default: false } },
});

function assetsDir() {
  let dir = process.env.ASSETS_DIR;
  const local = join(root, PATHS.local);
  if (!dir && existsSync(local)) dir = JSON.parse(readFileSync(local, "utf8")).assetsDir;
  if (!dir) {
    fail(
      `ASSETS_DIR is not set. Set the environment variable, or create ${PATHS.local} (git-ignored) ` +
        `with { "assetsDir": "<folder holding ${FOLDERS.map(([f]) => f).join(", ")}>" }.`,
    );
  }
  if (!existsSync(dir) || !statSync(dir).isDirectory()) fail(`ASSETS_DIR does not exist: ${dir}`);
  return dir;
}

function fail(message) {
  console.error(`media: ${message}`);
  process.exit(1);
}

const sha = (data) => createHash("sha256").update(data).digest("hex");

/** Changes with any setting, so every file is redone. */
const PIPELINE = sha(JSON.stringify({ IMAGE, VIDEO, v: 1 })).slice(0, 12);

const readJson = (path, fallback) =>
  existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback;

/** `ffmpeg -i file` alone exits 1 after printing the stream info, hence `allowFail`. */
function ffmpeg(argv, { allowFail = false } = {}) {
  return new Promise((done, reject) => {
    const child = spawn(ffmpegPath, ["-hide_banner", ...argv], { windowsHide: true });
    const out = [];
    let err = "";
    child.stdout.on("data", (c) => out.push(c));
    child.stderr.on("data", (c) => (err += c));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0 && !allowFail)
        reject(new Error(`ffmpeg exited ${code}:\n${err.slice(-1200)}`));
      else done({ stdout: Buffer.concat(out), stderr: err });
    });
  });
}

const probe = async (file) => (await ffmpeg(["-i", file], { allowFail: true })).stderr;

async function processImage(source, slug, stem, outDir, retina) {
  const meta = await sharp(source).metadata();
  const width = meta.width;
  const height = croppedHeight(width, meta.height, IMAGE.maxHeightRatio);
  const base = () => sharp(source).extract({ left: 0, top: 0, width, height });
  const widths = imageWidths(width, IMAGE.widths, retina ? IMAGE.retina : undefined);

  // The AVIF quality: the highest that keeps the budget width under its byte target.
  const probeWidth = budgetWidth(widths, IMAGE.avif.targetWidth);
  let quality = IMAGE.avif.min;
  for (const q of qualitySteps(IMAGE.avif)) {
    const buf = await base()
      .resize({ width: probeWidth })
      .avif({ quality: q, effort: IMAGE.avif.effort })
      .toBuffer();
    quality = q;
    if (buf.length <= IMAGE.avif.targetBytes) break;
  }

  const avif = [];
  const webp = [];
  for (const w of widths) {
    const resized = () => base().resize({ width: w, withoutEnlargement: true });
    const a = await resized().avif({ quality, effort: IMAGE.avif.effort }).toBuffer();
    const p = await resized().webp(IMAGE.webp).toBuffer();
    writeFileSync(join(outDir, `${stem}-${w}.avif`), a);
    writeFileSync(join(outDir, `${stem}-${w}.webp`), p);
    avif.push({ src: `/${PATHS.outDir}/${slug}/${stem}-${w}.avif`, width: w, bytes: a.length });
    webp.push({ src: `/${PATHS.outDir}/${slug}/${stem}-${w}.webp`, width: w, bytes: p.length });
  }
  const blur = await base()
    .resize({ width: IMAGE.blur.width })
    .webp({ quality: IMAGE.blur.quality })
    .toBuffer();

  const cropped = height < meta.height ? ` cut from ${meta.width}×${meta.height}` : "";
  return {
    entry: {
      kind: "image",
      width,
      height,
      blur: `data:image/webp;base64,${blur.toString("base64")}`,
      avif,
      webp,
    },
    note: `${width}×${height}${cropped}, avif q${quality}`,
  };
}

async function encodeUnderBudget(label, out, crfs, argvFor) {
  for (const crf of crfs) {
    await ffmpeg(argvFor(crf));
    const bytes = statSync(out).size;
    if (bytes < VIDEO.maxBytes) return { crf, bytes };
  }
  rmSync(out, { force: true });
  throw new Error(
    `${label} stays over ${formatBytes(VIDEO.maxBytes)} even at CRF ${crfs.at(-1)}. ` +
      `Record a shorter clip (a few seconds) and run pnpm media again.`,
  );
}

async function processVideo(source, slug, stem, outDir, label) {
  const info = await probe(source);
  const duration = parseDuration(info) ?? 0;
  const warnings = [];
  if (duration > VIDEO.warnSeconds) {
    warnings.push(
      `${label} lasts ${duration.toFixed(1)} s (over ${VIDEO.warnSeconds} s): a loop is a few seconds`,
    );
  }

  const scale = `scale='min(${VIDEO.maxWidth},iw)':-2:flags=lanczos`;
  const common = [
    "-y",
    "-i",
    source,
    "-an",
    "-sn",
    "-dn",
    "-map_metadata",
    "-1",
    "-vf",
    scale,
    "-fpsmax",
    String(VIDEO.maxFps),
  ];

  const mp4 = join(outDir, `${stem}.mp4`);
  const h264 = await encodeUnderBudget(`${label} (MP4)`, mp4, VIDEO.h264.crf, (crf) => [
    ...common,
    "-c:v",
    "libx264",
    "-preset",
    VIDEO.h264.preset,
    "-crf",
    String(crf),
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    mp4,
  ]);
  const webm = join(outDir, `${stem}.webm`);
  const vp9 = await encodeUnderBudget(`${label} (WebM)`, webm, VIDEO.vp9.crf, (crf) => [
    ...common,
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "0",
    "-crf",
    String(crf),
    "-row-mt",
    "1",
    "-deadline",
    "good",
    "-cpu-used",
    String(VIDEO.vp9.cpuUsed),
    "-pix_fmt",
    "yuv420p",
    webm,
  ]);

  const size = parseVideoSize(await probe(mp4));
  if (!size) throw new Error(`${label}: could not read the encoded size`);

  // The poster: one frame of the encoded MP4 (same size as the video), at about 1 s.
  const at = duration > VIDEO.posterAt ? VIDEO.posterAt : 0;
  const { stdout: frame } = await ffmpeg([
    "-ss",
    String(at),
    "-i",
    mp4,
    "-frames:v",
    "1",
    "-f",
    "image2pipe",
    "-vcodec",
    "png",
    "pipe:1",
  ]);
  const poster = {};
  for (const format of ["avif", "webp"]) {
    const buf =
      format === "avif"
        ? await sharp(frame)
            .avif({ quality: IMAGE.avif.start, effort: IMAGE.avif.effort })
            .toBuffer()
        : await sharp(frame).webp(IMAGE.webp).toBuffer();
    writeFileSync(join(outDir, `${stem}-poster.${format}`), buf);
    poster[format] = {
      src: `/${PATHS.outDir}/${slug}/${stem}-poster.${format}`,
      bytes: buf.length,
    };
  }
  const blur = await sharp(frame)
    .resize({ width: IMAGE.blur.width })
    .webp({ quality: IMAGE.blur.quality })
    .toBuffer();
  poster.blur = `data:image/webp;base64,${blur.toString("base64")}`;

  return {
    entry: {
      kind: "video",
      width: size.width,
      height: size.height,
      duration: Math.round(duration * 100) / 100,
      mp4: { src: `/${PATHS.outDir}/${slug}/${stem}.mp4`, bytes: h264.bytes },
      webm: { src: `/${PATHS.outDir}/${slug}/${stem}.webm`, bytes: vp9.bytes },
      poster,
    },
    note: `${size.width}×${size.height}, ${duration.toFixed(1)} s, mp4 crf ${h264.crf} ${formatBytes(h264.bytes)}, webm crf ${vp9.crf} ${formatBytes(vp9.bytes)}`,
    warnings,
  };
}

function entryOutputs(stem, entry) {
  return entry.kind === "image"
    ? outputNames(
        stem,
        "image",
        entry.avif.map((a) => a.width),
      )
    : outputNames(stem, "video");
}

async function processProject(slug, folder, entries, previous, report) {
  const outDir = join(root, PATHS.public, PATHS.outDir, slug);
  const files = readdirSync(folder, { withFileTypes: true })
    .filter((d) => d.isFile() && kindOf(d.name, EXT))
    .map((d) => d.name)
    .sort(naturalCompare);

  const wanted = publishedFiles(entries);
  const named = new Set(entries.map((e) => e.file));
  for (const file of files) {
    if (!named.has(file))
      report.warnings.push(
        `${slug}/${file} is not in media.map.json: treated as spare, not published`,
      );
  }
  for (const file of wanted) {
    if (!files.includes(file))
      report.warnings.push(`${slug}/${file} is mapped but not in the folder: skipped`);
  }
  const spare = files.filter((f) => !wanted.includes(f));
  if (spare.length > 0)
    console.log(`  ${slug}: ${spare.length} spare, not published: ${spare.join(", ")}`);

  const stems = new Map();
  const result = {};
  const keep = new Set();
  mkdirSync(outDir, { recursive: true });

  for (const file of wanted.filter((f) => files.includes(f))) {
    const label = `${slug}/${file}`;
    const stem = slugifyStem(file);
    if (stems.has(stem))
      throw new Error(`${label} and ${slug}/${stems.get(stem)} share the output name ${stem}`);
    stems.set(stem, file);

    const source = join(folder, file);
    const hash = sha(readFileSync(source)).slice(0, 16);
    const old = previous?.[file];
    const fresh =
      !args.force &&
      old?.hash === hash &&
      old?.pipeline === PIPELINE &&
      entryOutputs(stem, old).every((name) => existsSync(join(outDir, name)));

    let entry;
    if (fresh) {
      entry = old;
      console.log(`  ${label}  unchanged`);
    } else {
      const kind = kindOf(file, EXT);
      const done =
        kind === "image"
          ? await processImage(
              source,
              slug,
              stem,
              outDir,
              wantsRetina(entries, file, IMAGE.retina.roles),
            )
          : await processVideo(source, slug, stem, outDir, label);
      entry = { ...done.entry, hash, pipeline: PIPELINE };
      report.warnings.push(...(done.warnings ?? []));
      report.changed++;
      const bytes = entryOutputs(stem, entry).reduce(
        (n, name) => n + statSync(join(outDir, name)).size,
        0,
      );
      console.log(`  ${label}  ${kind} ${done.note}  ${formatBytes(bytes)}`);
    }
    for (const name of entryOutputs(stem, entry)) keep.add(name);
    result[file] = entry;
  }

  // Outputs whose source disappeared, or that are no longer mapped.
  for (const name of readdirSync(outDir)) {
    if (!keep.has(name)) {
      rmSync(join(outDir, name), { force: true });
      report.deleted.push(`${slug}/${name}`);
    }
  }
  if (readdirSync(outDir).length === 0) rmSync(outDir, { recursive: true, force: true });
  return result;
}

async function main() {
  if (!ffmpegPath || !existsSync(ffmpegPath))
    fail("ffmpeg-static has no binary: run pnpm install again.");
  const dir = assetsDir();
  const mapPath = join(root, PATHS.map);
  const manifestPath = join(root, PATHS.manifest);
  const map = readJson(mapPath, { projects: {} }).projects ?? {};
  const manifest = readJson(manifestPath, { projects: {} });
  const projects = new Map(Object.entries(manifest.projects ?? {}));

  if (args.only && !FOLDERS.some(([, slug]) => slug === args.only)) {
    fail(`--only ${args.only}: no such slug (${FOLDERS.map(([, s]) => s).join(", ")})`);
  }

  const report = { warnings: [], deleted: [], changed: 0 };
  console.log(`media: ${dir}${args.force ? " (--force)" : ""}`);
  for (const [folderName, slug] of FOLDERS) {
    if (args.only && slug !== args.only) continue;
    const folder = join(dir, folderName);
    if (!existsSync(folder)) {
      report.warnings.push(`folder ${folderName} (${slug}) is missing in ASSETS_DIR: skipped`);
      continue;
    }
    const result = await processProject(slug, folder, map[slug] ?? [], projects.get(slug), report);
    if (Object.keys(result).length > 0) projects.set(slug, result);
    else projects.delete(slug);
  }

  const next = stableStringify({ projects: Object.fromEntries(projects) });
  const before = existsSync(manifestPath) ? readFileSync(manifestPath, "utf8") : "";
  if (next !== before) writeFileSync(manifestPath, next);

  for (const w of report.warnings) console.warn(`  warning: ${w}`);
  for (const d of report.deleted) console.log(`  deleted: ${d}`);

  console.log("\nmedia: bytes in public/work/");
  let total = 0;
  for (const [, slug] of FOLDERS) {
    const out = join(root, PATHS.public, PATHS.outDir, slug);
    if (!existsSync(out)) continue;
    const names = readdirSync(out);
    const bytes = names.reduce((n, name) => n + statSync(join(out, name)).size, 0);
    total += bytes;
    console.log(
      `  ${slug.padEnd(14)} ${String(names.length).padStart(3)} files  ${formatBytes(bytes)}`,
    );
  }
  console.log(`  ${"total".padEnd(14)}            ${formatBytes(total)}`);
  console.log(
    `media: ${report.changed} file(s) processed, ${report.deleted.length} deleted, ` +
      `manifest ${next === before ? "unchanged" : "updated"}.`,
  );
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
