// pnpm media (scripts/media.mjs): the only hard-coded mapping, folder in ASSETS_DIR to project
// slug, and the encoding settings. File names are never written here: they are discovered at run
// time and mapped by hand in src/lib/content/media.map.json.

/** Folder in ASSETS_DIR, then project slug. A missing folder is a warning, never a failure. */
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
  /** Output widths, kept only up to the source width (never upscaled). */
  widths: [640, 960, 1440, 1920],
  /** A capture taller than its width times this is cut from the top: every frame on the site is
      landscape and shows the top of the screen (object-position: top), so the rest of a
      10 000 px page would only cost bytes, and could publish what nobody reviewed on screen. */
  maxHeightRatio: 1,
  /** AVIF quality: start here and step down until the 1440 px file is under `targetBytes`. */
  avif: { start: 60, min: 35, step: 5, effort: 4, targetWidth: 1440, targetBytes: 200 * 1024 },
  webp: { quality: 78, effort: 5 },
  /** The blur placeholder: a tiny WebP stored as a data URI in the manifest. */
  blur: { width: 16, quality: 40 },
};

export const VIDEO = {
  maxWidth: 1280,
  maxFps: 30,
  /** Every output must be under this many bytes (1.5 MB). */
  maxBytes: 1_500_000,
  /** Longer clips get a warning: a loop is a few seconds. */
  warnSeconds: 10,
  /** The poster frame, in seconds (0 for a clip shorter than this). */
  posterAt: 1,
  /** CRF values tried in order until the file fits (higher is smaller). */
  h264: { crf: [26, 29, 32, 35, 38, 41, 44], preset: "medium" },
  vp9: { crf: [38, 42, 46, 50, 54, 58, 62], cpuUsed: 4 },
};

/** Where the outputs go (served from /work/<slug>/) and where the manifest and the map live. */
export const PATHS = {
  public: "public",
  outDir: "work",
  manifest: "src/lib/content/media.manifest.json",
  map: "src/lib/content/media.map.json",
  local: "scripts/media.local.json",
};
