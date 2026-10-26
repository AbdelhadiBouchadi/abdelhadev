import { ABOUT } from "@/lib/motion";

export interface Point {
  x: number;
  y: number;
}

/** px. `view` is the window's size. */
export interface ZoneSize {
  width: number;
  height: number;
  viewWidth: number;
  viewHeight: number;
}

/** What a new size of the zone calls for. On a touch device, a window that changes height only is
    the address bar showing or hiding: the route stays, and the new size becomes the reference. */
export function resizeKind(
  built: ZoneSize,
  now: ZoneSize,
  touch: boolean,
): "same" | "viewport" | "rebuild" {
  const { width, height } = ABOUT.thread.minChange;
  const widthChanged = Math.abs(now.width - built.width) >= width;
  if (!widthChanged && Math.abs(now.height - built.height) < height) return "same";
  const barOnly = now.viewWidth === built.viewWidth && now.viewHeight !== built.viewHeight;
  if (touch && !widthChanged && barOnly) return "viewport";
  return "rebuild";
}

/** Cubic segments with vertical handles at half the height between points: soft S-curves. */
export function threadPath(points: readonly Point[]): string {
  const [first, ...rest] = points;
  if (!first) return "";
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(first.x)} ${f(first.y)}`;
  let a = first;
  for (const b of rest) {
    const m = (b.y - a.y) / 2;
    d += ` C${f(a.x)} ${f(a.y + m)} ${f(b.x)} ${f(b.y - m)} ${f(b.x)} ${f(b.y)}`;
    a = b;
  }
  return d;
}

/** The x for `fraction` of `width`. When the band of fractions would reach the content (its right
    edge at `contentRight`), the same alternation is mapped into the free part of the right margin
    instead, so the line keeps its curves without crossing the text. */
export function marginX(
  fraction: number,
  band: readonly number[],
  width: number,
  contentRight: number,
): number {
  const margin = Math.max(0, width - contentRight);
  const low = contentRight + margin * ABOUT.thread.clear;
  const high = width - Math.min(margin * (1 - ABOUT.thread.clear) * 0.5, ABOUT.thread.edge);
  const min = Math.min(...band);
  const max = Math.max(...band);
  if (width * min >= low) return Math.min(width * fraction, high);
  const t = max > min ? (fraction - min) / (max - min) : 1;
  return low + (high - low) * t;
}

/** The route before it is measured (no JavaScript), in a 1000 by 1000 box stretched over the
    zone: into the far right margin, down, and back to the centre at the end. */
export const FALLBACK_BOX = 1000;
const RIGHT = 985;
export const FALLBACK_PATH = threadPath([
  { x: FALLBACK_BOX / 2, y: 0 },
  { x: RIGHT, y: 60 },
  { x: RIGHT, y: 940 },
  { x: FALLBACK_BOX / 2, y: FALLBACK_BOX },
]);
