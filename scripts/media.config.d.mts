export const FOLDERS: readonly (readonly [folder: string, slug: string])[];
export const IMAGE_EXTENSIONS: readonly string[];
export const VIDEO_EXTENSIONS: readonly string[];
export const IMAGE: {
  widths: readonly number[];
  retina: { above: number; max: number; roles: "all" | readonly string[] };
  maxHeightRatio: number;
  avif: {
    start: number;
    min: number;
    step: number;
    effort: number;
    targetWidth: number;
    targetBytes: number;
  };
  webp: { quality: number; effort: number };
  blur: { width: number; quality: number };
};
export const VIDEO: {
  maxWidth: number;
  maxFps: number;
  maxBytes: number;
  warnSeconds: number;
  posterAt: number;
  h264: { crf: readonly number[]; preset: string };
  vp9: { crf: readonly number[]; cpuUsed: number };
};
export const PATHS: {
  public: string;
  outDir: string;
  manifest: string;
  map: string;
  local: string;
};
