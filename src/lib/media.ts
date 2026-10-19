/* The manifest (written by pnpm media) and my hand-edited map are validated once at module load,
   so a broken file fails the build. Nothing else in the app names a file. */
import { z } from "zod";
import manifestJson from "@/lib/content/media.manifest.json" with { type: "json" };
import mapJson from "@/lib/content/media.map.json" with { type: "json" };

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const src = z.string().regex(/^\/work\/[a-z0-9-]+\/[a-z0-9-]+\.(?:avif|webp|mp4|webm)$/);
const blur = z.string().startsWith("data:image/webp;base64,");
const bytes = z.number().int().positive();
const size = { width: z.number().int().positive(), height: z.number().int().positive() };
const cache = { hash: z.string().regex(/^[0-9a-f]{16}$/), pipeline: z.string().min(1) };

const variant = z.object({ src, width: z.number().int().positive(), bytes }).strict();
const file = z.object({ src, bytes }).strict();

export const imageAsset = z
  .object({
    kind: z.literal("image"),
    ...size,
    ...cache,
    blur,
    avif: z.array(variant).min(1),
    webp: z.array(variant).min(1),
  })
  .strict();

export const videoAsset = z
  .object({
    kind: z.literal("video"),
    ...size,
    ...cache,
    duration: z.number().positive(),
    mp4: file,
    webm: file,
    poster: z.object({ avif: file, webp: file, blur }).strict(),
  })
  .strict();

export const mediaAsset = z.discriminatedUnion("kind", [imageAsset, videoAsset]);

/** Slug, then source file name. */
export const mediaManifest = z
  .object({ projects: z.record(slug, z.record(z.string().min(1), mediaAsset)) })
  .strict();

const messageKey = z.string().regex(/^work\.[a-z0-9-]+\.media\.\d+$/);
const fileName = z.string().min(1);

export const mapEntry = z.discriminatedUnion("role", [
  z.object({ file: fileName, role: z.literal("work"), key: messageKey }).strict(),
  z
    .object({
      file: fileName,
      role: z.literal("tour"),
      step: z.number().int().min(1),
      key: messageKey,
    })
    .strict(),
  z
    .object({
      file: fileName,
      role: z.literal("hero"),
      place: z.enum(["case", "home"]),
      key: messageKey,
    })
    .strict(),
  z.object({ file: fileName, role: z.literal("spare"), note: z.string().optional() }).strict(),
]);

export const mediaMap = z
  .object({ readme: z.string(), projects: z.record(slug, z.array(mapEntry)) })
  .strict();

export type ImageAsset = z.infer<typeof imageAsset>;
export type VideoAsset = z.infer<typeof videoAsset>;
export type MediaAsset = z.infer<typeof mediaAsset>;
export type MediaManifest = z.infer<typeof mediaManifest>;
export type MediaMap = z.infer<typeof mediaMap>;
export type MapEntry = z.infer<typeof mapEntry>;
export type HeroPlace = Extract<MapEntry, { role: "hero" }>["place"];

export const MANIFEST: MediaManifest = mediaManifest.parse(manifestJson);
export const MEDIA_MAP: MediaMap = mediaMap.parse(mapJson);

export interface ProjectMediaItem {
  key: string;
  asset: MediaAsset;
}

const entriesOf = (slug: string, map: MediaMap) => map.projects[slug] ?? [];

function resolve(
  slug: string,
  entry: { file: string; key: string },
  manifest: MediaManifest,
): ProjectMediaItem | null {
  const asset = manifest.projects[slug]?.[entry.file];
  return asset ? { key: entry.key, asset } : null;
}

/** A mapped file the manifest does not have yet is skipped, so its slot keeps the skeleton. */
export function workMedia(
  slug: string,
  map: MediaMap = MEDIA_MAP,
  manifest: MediaManifest = MANIFEST,
): ProjectMediaItem[] {
  return entriesOf(slug, map).flatMap((entry) => {
    if (entry.role !== "work") return [];
    const item = resolve(slug, entry, manifest);
    return item ? [item] : [];
  });
}

export function tourMedia(
  slug: string,
  map: MediaMap = MEDIA_MAP,
  manifest: MediaManifest = MANIFEST,
): ReadonlyMap<number, ProjectMediaItem> {
  const steps = new Map<number, ProjectMediaItem>();
  for (const entry of entriesOf(slug, map)) {
    if (entry.role !== "tour") continue;
    const item = resolve(slug, entry, manifest);
    if (item) steps.set(entry.step, item);
  }
  return steps;
}

export function heroMedia(
  slug: string,
  place: HeroPlace,
  map: MediaMap = MEDIA_MAP,
  manifest: MediaManifest = MANIFEST,
): ProjectMediaItem[] {
  return entriesOf(slug, map).flatMap((entry) => {
    if (entry.role !== "hero" || entry.place !== place) return [];
    const item = resolve(slug, entry, manifest);
    return item ? [item] : [];
  });
}

/** Throws on a missing key; the unit tests check every one. */
export function mediaCopy(messages: unknown, key: string): { alt: string; label?: string } {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    node = node !== null && typeof node === "object" ? Reflect.get(node, part) : undefined;
  }
  const alt: unknown = node !== null && typeof node === "object" ? Reflect.get(node, "alt") : null;
  const label: unknown =
    node !== null && typeof node === "object" ? Reflect.get(node, "label") : undefined;
  if (typeof alt !== "string" || alt === "") throw new Error(`messages: ${key}.alt is missing`);
  return typeof label === "string" ? { alt, label } : { alt };
}

export const srcSet = (variants: readonly { src: string; width: number }[]) =>
  variants.map((v) => `${v.src} ${String(v.width)}w`).join(", ");

export function largest<T extends { width: number }>(variants: readonly T[]): T | undefined {
  return variants.reduce<T | undefined>((a, b) => (a && a.width >= b.width ? a : b), undefined);
}
