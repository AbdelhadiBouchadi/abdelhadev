// File names are never written here: they are discovered at run time and mapped by hand in
// src/lib/content/media.map.json.

/** A missing folder is a warning, never a failure. */
export const FOLDERS = [
  ["dentaflow", "dentaflow"],
  ["meetai", "meetai"],
  ["ophtachusm", "hms"],
  ["yoga-booking", "yoga-booking"],
  ["cote-royale", "cote-royale"],
];

export const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
export const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm"];

export const IMAGE = {
  /** Never upscaled. */
  widths: [640, 960, 1440, 1920],
  /** `roles`: "all", or the map roles that get the retina variant. */
  retina: { above: 1440, max: 2400, roles: "all" },
  /** Every frame on the site shows the top of the screen, so the rest of a 10 000 px capture would
      only cost bytes, and could publish what nobody reviewed on screen. */
  maxHeightRatio: 1,
  /** Steps down until the 1440 px file is under `targetBytes`. */
  avif: { start: 60, min: 35, step: 5, effort: 4, targetWidth: 1440, targetBytes: 200 * 1024 },
  webp: { quality: 78, effort: 5 },
  /** A tiny WebP stored as a data URI in the manifest. */
  blur: { width: 16, quality: 40 },
};

export const VIDEO = {
  maxWidth: 1280,
  maxFps: 30,
  /** 1.5 MB */
  maxBytes: 1_500_000,
  /** A loop is a few seconds. */
  warnSeconds: 10,
  /** Seconds; 0 for a clip shorter than this. */
  posterAt: 1,
  /** Tried in order until the file fits (higher is smaller). */
  h264: { crf: [26, 29, 32, 35, 38, 41, 44], preset: "medium" },
  vp9: { crf: [38, 42, 46, 50, 54, 58, 62], cpuUsed: 4 },
};

export const PATHS = {
  public: "public",
  outDir: "work",
  manifest: "src/lib/content/media.manifest.json",
  map: "src/lib/content/media.map.json",
  local: "scripts/media.local.json",
};
