/* Pure helpers behind the primitives (docs/primitives.md): scroll ranges, the stage's media
   condition, scroll-spy selection, clip-path strings and trigger lookup. No React, no GSAP, so
   tests/unit covers them. */

// ---------- ranges ----------

export interface Range {
  start: string;
  end: string;
}

/** The ScrollTrigger range during which an element crosses a horizontal line placed `line` (a
    fraction of the viewport height) from the top: "top 45%" to "bottom 45%". */
export function lineRange(line: number): Range {
  if (!Number.isFinite(line) || line < 0 || line > 1) {
    throw new RangeError(`line must be between 0 and 1, got ${String(line)}`);
  }
  const at = `${String(Math.round(line * 1000) / 10)}%`;
  return { start: `top ${at}`, end: `bottom ${at}` };
}

// ---------- the stage's media condition ----------

export type StageCondition = "desktop" | "mobile" | "reduced";

/** The active condition from gsap.matchMedia's `context.conditions`. Reduced motion wins over the
    width conditions; with nothing matched (should not happen) the still state is the safe one. */
export function stageCondition(
  conditions: Partial<Record<StageCondition, boolean>>,
): StageCondition {
  if (conditions.reduced) return "reduced";
  if (conditions.desktop) return "desktop";
  if (conditions.mobile) return "mobile";
  return "reduced";
}

// ---------- scroll spy ----------

export interface SpyState {
  /** The active index, or -1 before any element has crossed the line. */
  active: number;
  /** Indices currently crossing the line, oldest first. */
  crossing: readonly number[];
}

export const SPY_START: SpyState = { active: -1, crossing: [] };

/** Next spy state after the element at `index` starts or stops crossing the line. The latest
    element to start crossing is active; when it stops, the most recent one still crossing takes
    over; in a gap between elements, the last active one stays (prototype Pages.work rail). */
export function spyReduce(state: SpyState, index: number, isActive: boolean): SpyState {
  const others = state.crossing.filter((i) => i !== index);
  if (isActive) return { active: index, crossing: [...others, index] };
  const latest = others.at(-1);
  return { active: latest ?? state.active, crossing: others };
}

// ---------- clip paths ----------

/** `inset(t% r% b% l% round radius)`, the shape MediaReveal tweens. */
export function insetClip(inset: readonly number[], radius: string): string {
  const [top = 0, right = 0, bottom = 0, left = 0] = inset;
  return `inset(${String(top)}% ${String(right)}% ${String(bottom)}% ${String(left)}% round ${radius})`;
}

// ---------- triggers ----------

/** What resolveTrigger needs from an element (an Element, or a stand-in in tests). */
export interface TriggerSource {
  closest: (selector: string) => Element | null;
  ownerDocument: Pick<Document, "querySelector">;
}

/** The element a primitive's ScrollTrigger follows: itself, or the nearest ancestor matching
    `selector`, or else the first match in the document (a section elsewhere on the page). */
export function resolveTrigger<T extends TriggerSource>(
  el: T,
  selector?: string,
): T | Element | null {
  if (!selector) return el;
  return el.closest(selector) ?? el.ownerDocument.querySelector(selector);
}
