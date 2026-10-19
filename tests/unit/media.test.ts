// The real screens (prompts/08b-media.md, "Tests"): the manifest passes its schema and agrees with
// the map; every file it references exists under public/work/ and nothing else is there; no raw
// png or jpeg is published; every video output is under 1.5 MB; every work and tour entry has its
// alt text (and a video its label) in both locales; the discovered file names appear only in the
// map and the manifest. The pipeline's own rules run on fixtures: the originals never leave the
// owner's machine, so nothing here reads them, and no assertion names a screenshot file.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
import manifestJson from "@/lib/content/media.manifest.json" with { type: "json" };
import mapJson from "@/lib/content/media.map.json" with { type: "json" };
import { getProject, sheetMedia } from "@/lib/content/projects";
import { getCaseStudy } from "@/lib/content/case-studies";
import { MAX_SHEET_MEDIA } from "@/lib/content/schema";
import {
  MANIFEST,
  MEDIA_MAP,
  mediaCopy,
  mediaManifest,
  mediaMap,
  tourMedia,
  workMedia,
  type MediaAsset,
  type MediaManifest,
  type MediaMap,
} from "@/lib/media";
import { IMAGE, VIDEO } from "@scripts/media.config.mjs";
import {
  budgetWidth,
  croppedHeight,
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
} from "@scripts/lib/media-rules.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const PUBLIC = join(ROOT, "public");
const OUT = join(PUBLIC, "work");

function files(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

/** Every served path an asset references. */
function srcs(asset: MediaAsset): string[] {
  if (asset.kind === "image") return [...asset.avif, ...asset.webp].map((v) => v.src);
  return [asset.mp4.src, asset.webm.src, asset.poster.avif.src, asset.poster.webp.src];
}

const assets = Object.entries(MANIFEST.projects).flatMap(([slug, byFile]) =>
  Object.values(byFile).map((asset) => ({ slug, asset })),
);

// ---------- the committed manifest and outputs ----------

describe("the media manifest", () => {
  it("passes its schema, and so does the map", () => {
    expect(mediaManifest.safeParse(manifestJson).success).toBe(true);
    expect(mediaMap.safeParse(mapJson).success).toBe(true);
    expect(assets.length).toBeGreaterThan(0);
  });

  it("is written with sorted keys (stable diffs)", () => {
    const raw = readFileSync(join(ROOT, "src/lib/content/media.manifest.json"), "utf8");
    expect(raw).toBe(stableStringify(JSON.parse(raw)));
  });

  it("references files that exist under public/work/, and nothing else is there", () => {
    const referenced = new Set(assets.flatMap(({ asset }) => srcs(asset)));
    for (const src of referenced) expect(existsSync(join(PUBLIC, src)), src).toBe(true);
    const onDisk = files(OUT).map((f) => `/${relative(PUBLIC, f).replaceAll("\\", "/")}`);
    expect(onDisk.toSorted()).toEqual([...referenced].toSorted());
  });

  it("records the bytes of every output as they are on disk", () => {
    for (const { asset } of assets) {
      const list =
        asset.kind === "image"
          ? [...asset.avif, ...asset.webp]
          : [asset.mp4, asset.webm, asset.poster.avif, asset.poster.webp];
      for (const { src, bytes } of list) expect(statSync(join(PUBLIC, src)).size, src).toBe(bytes);
    }
  });

  it("publishes no raw png, jpg or jpeg (originals never enter the repository)", () => {
    expect(files(OUT).filter((f) => /\.(?:png|jpe?g)$/i.test(f))).toEqual([]);
  });

  it(`keeps every video output under ${String(VIDEO.maxBytes)} bytes, at most ${String(VIDEO.maxWidth)} px wide`, () => {
    for (const { asset } of assets) {
      if (asset.kind !== "video") continue;
      for (const { src } of [asset.mp4, asset.webm]) {
        expect(statSync(join(PUBLIC, src)).size, src).toBeLessThan(VIDEO.maxBytes);
      }
      expect(asset.width).toBeLessThanOrEqual(VIDEO.maxWidth);
    }
  });

  it("never upscales an image: no variant wider than the image", () => {
    for (const { asset } of assets) {
      if (asset.kind !== "image") continue;
      for (const v of [...asset.avif, ...asset.webp])
        expect(v.width).toBeLessThanOrEqual(asset.width);
    }
  });
});

describe("the media map", () => {
  it("agrees with the manifest: the same published files, per project", () => {
    const slugs = new Set([...Object.keys(MEDIA_MAP.projects), ...Object.keys(MANIFEST.projects)]);
    for (const slug of slugs) {
      const published = publishedFiles(MEDIA_MAP.projects[slug]).toSorted();
      expect(Object.keys(MANIFEST.projects[slug] ?? {}).toSorted(), slug).toEqual(published);
    }
  });

  it("gives every work and tour entry an alt text in both locales, and a video its label", () => {
    for (const [slug, entries] of Object.entries(MEDIA_MAP.projects)) {
      for (const entry of entries) {
        if (entry.role === "spare") continue;
        expect(entry.key.startsWith(`work.${slug}.media.`), entry.key).toBe(true);
        const asset = MANIFEST.projects[slug]?.[entry.file];
        for (const messages of [fr, en]) {
          const copy = mediaCopy(messages, entry.key);
          expect(copy.alt.length, entry.key).toBeLessThanOrEqual(140);
          if (asset?.kind === "video") expect(copy.label, entry.key).toBeTruthy();
        }
      }
    }
  });

  it("maps each tour step at most once, inside the case study's tour", () => {
    for (const [slug, entries] of Object.entries(MEDIA_MAP.projects)) {
      const steps = entries.flatMap((e) => (e.role === "tour" ? [e.step] : []));
      expect(new Set(steps).size, slug).toBe(steps.length);
      if (steps.length > 0) {
        const tour = getCaseStudy(slug)?.tour.length ?? 0;
        for (const step of steps) expect(step, slug).toBeLessThanOrEqual(tour);
      }
    }
  });

  it(`never puts more than ${String(MAX_SHEET_MEDIA)} real screens on a sheet`, () => {
    for (const slug of Object.keys(MEDIA_MAP.projects)) {
      const project = getProject(slug);
      if (project) expect(sheetMedia(project).length).toBeLessThanOrEqual(MAX_SHEET_MEDIA);
    }
  });

  it("is the only place a discovered file name is written (besides the manifest)", () => {
    const names = new Set(
      Object.values(MEDIA_MAP.projects).flatMap((entries) => entries.map((e) => e.file)),
    );
    const skip = new Set(["src/lib/content/media.map.json", "src/lib/content/media.manifest.json"]);
    const sources = ["src", "tests", "messages"].flatMap((dir) => files(join(ROOT, dir)));
    for (const file of sources) {
      const path = relative(ROOT, file).replaceAll("\\", "/");
      if (skip.has(path) || /\.(?:png|jpe?g|webp|avif|ico|pdf|woff2?)$/i.test(path)) continue;
      const text = readFileSync(file, "utf8");
      for (const name of names) expect(text.includes(name), `${name} in ${path}`).toBe(false);
    }
  });
});

// ---------- the helpers, on fixtures ----------

const image = (src: string): MediaAsset => ({
  kind: "image",
  width: 1200,
  height: 750,
  hash: "0123456789abcdef",
  pipeline: "test",
  blur: "data:image/webp;base64,AA",
  avif: [{ src: `/work/x/${src}-640.avif`, width: 640, bytes: 1 }],
  webp: [{ src: `/work/x/${src}-640.webp`, width: 640, bytes: 1 }],
});

const FIXTURE_MAP: MediaMap = {
  readme: "",
  projects: {
    x: [
      { file: "b.png", role: "work", key: "work.x.media.2" },
      { file: "a.png", role: "work", key: "work.x.media.1" },
      { file: "gone.png", role: "work", key: "work.x.media.3" },
      { file: "a.png", role: "tour", step: 2, key: "work.x.media.1" },
      { file: "c.png", role: "spare", note: "a face" },
    ],
  },
};
const FIXTURE_MANIFEST: MediaManifest = {
  projects: { x: { "a.png": image("a"), "b.png": image("b") } },
};

describe("workMedia and tourMedia", () => {
  it("follow the map's order, skip spare entries and files the manifest lacks", () => {
    const work = workMedia("x", FIXTURE_MAP, FIXTURE_MANIFEST);
    expect(work.map((m) => m.key)).toEqual(["work.x.media.2", "work.x.media.1"]);
    const tour = tourMedia("x", FIXTURE_MAP, FIXTURE_MANIFEST);
    expect([...tour.keys()]).toEqual([2]);
    expect(workMedia("nope", FIXTURE_MAP, FIXTURE_MANIFEST)).toEqual([]);
  });

  it("reads alt and label from the messages, and throws on a missing alt", () => {
    const messages = { work: { x: { media: { 1: { alt: "A", label: "L" }, 2: { alt: "B" } } } } };
    expect(mediaCopy(messages, "work.x.media.1")).toEqual({ alt: "A", label: "L" });
    expect(mediaCopy(messages, "work.x.media.2")).toEqual({ alt: "B" });
    expect(() => mediaCopy(messages, "work.x.media.3")).toThrow(/media\.3\.alt/);
  });

  it("rejects a map entry without its key, or a tour entry without its step", () => {
    expect(
      mediaMap.safeParse({ readme: "", projects: { x: [{ file: "a", role: "work" }] } }).success,
    ).toBe(false);
    expect(
      mediaMap.safeParse({
        readme: "",
        projects: { x: [{ file: "a", role: "tour", key: "work.x.media.1" }] },
      }).success,
    ).toBe(false);
  });
});

describe("pnpm media rules", () => {
  const EXT = { images: [".png", ".jpg", ".jpeg", ".webp"], videos: [".mp4", ".mov", ".webm"] };

  it("sorts names naturally and slugifies stems", () => {
    expect(["10-b.png", "2-a.png", "1-c.png"].sort(naturalCompare)).toEqual([
      "1-c.png",
      "2-a.png",
      "10-b.png",
    ]);
    expect(slugifyStem("01 Écran Agenda (final).PNG")).toBe("01-ecran-agenda-final");
    expect(kindOf("a.JPG", EXT)).toBe("image");
    expect(kindOf("a.mov", EXT)).toBe("video");
    expect(kindOf("a.gif", EXT)).toBeNull();
  });

  it("never upscales, keeps the source width under the smallest step, cuts tall captures", () => {
    expect(imageWidths(2800, IMAGE.widths)).toEqual([640, 960, 1440, 1920]);
    expect(imageWidths(1900, IMAGE.widths)).toEqual([640, 960, 1440]);
    expect(imageWidths(500, IMAGE.widths)).toEqual([500]);
    expect(croppedHeight(1900, 10330, 1)).toBe(1900);
    expect(croppedHeight(1920, 911, 1)).toBe(911);
  });

  it("steps the AVIF quality down and measures it on the 1440 px file", () => {
    expect(qualitySteps({ start: 60, min: 45, step: 5 })).toEqual([60, 55, 50, 45]);
    expect(budgetWidth([640, 960, 1440, 1920], 1440)).toBe(1440);
    expect(budgetWidth([500], 1440)).toBe(500);
  });

  it("names the outputs from the stem", () => {
    expect(outputNames("s", "image", [640])).toEqual(["s-640.avif", "s-640.webp"]);
    expect(outputNames("s", "video")).toEqual([
      "s.mp4",
      "s.webm",
      "s-poster.avif",
      "s-poster.webp",
    ]);
  });

  it("reads ffmpeg's duration and the video stream's size, not the codec tag", () => {
    const banner = [
      "  Duration: 00:00:08.73, start: 0.000000, bitrate: 7431 kb/s",
      "  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(progressive), 1280x610 [SAR 1:1 DAR 128:61], 400 kb/s, 30 fps",
    ].join("\n");
    expect(parseDuration(banner)).toBeCloseTo(8.73);
    expect(parseVideoSize(banner)).toEqual({ width: 1280, height: 610 });
    expect(parseDuration("nothing")).toBeNull();
  });

  it("publishes each mapped file once and never a spare one", () => {
    expect(
      publishedFiles([
        { file: "a", role: "work" },
        { file: "a", role: "tour" },
        { file: "b", role: "spare" },
      ]),
    ).toEqual(["a"]);
  });

  it("writes JSON with sorted keys at every level", () => {
    expect(stableStringify({ b: 1, a: { d: [2, 1], c: 0 } })).toBe(
      `${JSON.stringify({ a: { c: 0, d: [2, 1] }, b: 1 }, null, 2)}\n`,
    );
  });
});
