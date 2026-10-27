import { QUOTES } from "@/lib/motion";

export interface QuoteTiming {
  /** Percent of the track's cover range. */
  start: number;
  /** Null for the last quote, which stays. */
  fade: number | null;
  /** Percent between two words, cut to three decimals downwards so the last word never lands late. */
  stagger: number;
}

const LAST_START = QUOTES.starts[QUOTES.starts.length - 1] ?? 0;

/** A long quote gets a tighter stagger, so its last word still lands `hold` before it fades. */
export function quoteTiming(index: number, count: number, words: number): QuoteTiming {
  const start = QUOTES.starts[index] ?? LAST_START;
  const fade = index < count - 1 ? (QUOTES.fades[index] ?? null) : null;
  const doneBy = (fade ?? QUOTES.end) - QUOTES.hold;
  const fit = words > 1 ? (doneBy - start - QUOTES.word) / (words - 1) : QUOTES.stagger;
  const stagger = Math.max(0, Math.floor(Math.min(QUOTES.stagger, fit) * 1000) / 1000);
  return { start, fade, stagger };
}
