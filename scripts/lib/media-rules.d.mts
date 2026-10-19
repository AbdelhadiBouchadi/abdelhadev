export function naturalCompare(a: string, b: string): number;
export function slugifyStem(fileName: string): string;
export function kindOf(
  fileName: string,
  extensions: { images: readonly string[]; videos: readonly string[] },
): "image" | "video" | null;
export function imageWidths(
  sourceWidth: number,
  steps: readonly number[],
  retina?: { above: number; max: number },
): number[];
export function wantsRetina(
  entries: readonly { file: string; role: string }[],
  file: string,
  roles: "all" | readonly string[],
): boolean;
export function croppedHeight(width: number, height: number, maxRatio: number): number;
export function qualitySteps(range: { start: number; min: number; step: number }): number[];
export function budgetWidth(widths: readonly number[], targetWidth: number): number;
export function outputNames(
  stem: string,
  kind: "image" | "video",
  widths?: readonly number[],
): string[];
export function parseDuration(stderr: string): number | null;
export function parseVideoSize(stderr: string): { width: number; height: number } | null;
export function stableStringify(value: unknown): string;
export function formatBytes(bytes: number): string;
export function publishedFiles(entries?: readonly { file: string; role: string }[]): string[];
