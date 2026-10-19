export interface Range {
  start: string;
  end: string;
}

/** "top 45%" to "bottom 45%" for a line at 0.45. */
export function lineRange(line: number): Range {
  if (!Number.isFinite(line) || line < 0 || line > 1) {
    throw new RangeError(`line must be between 0 and 1, got ${String(line)}`);
  }
  const at = `${String(Math.round(line * 1000) / 10)}%`;
  return { start: `top ${at}`, end: `bottom ${at}` };
}

export type StageCondition = "desktop" | "mobile" | "reduced";

/** Reduced motion wins over the width conditions. With nothing matched, the still state is the
    safe one. */
export function stageCondition(
  conditions: Partial<Record<StageCondition, boolean>>,
): StageCondition {
  if (conditions.reduced) return "reduced";
  if (conditions.desktop) return "desktop";
  if (conditions.mobile) return "mobile";
  return "reduced";
}

export interface SpyState {
  /** -1 before any element has crossed the line. */
  active: number;
  /** Oldest first. */
  crossing: readonly number[];
}

export const SPY_START: SpyState = { active: -1, crossing: [] };

/** The latest element to start crossing is active. When it stops, the most recent one still
    crossing takes over; in a gap, the last active one stays. */
export function spyReduce(state: SpyState, index: number, isActive: boolean): SpyState {
  const others = state.crossing.filter((i) => i !== index);
  if (isActive) return { active: index, crossing: [...others, index] };
  const latest = others.at(-1);
  return { active: latest ?? state.active, crossing: others };
}

/** inset(t% r% b% l% round radius) */
export function insetClip(inset: readonly number[], radius: string): string {
  const [top = 0, right = 0, bottom = 0, left = 0] = inset;
  return `inset(${String(top)}% ${String(right)}% ${String(bottom)}% ${String(left)}% round ${radius})`;
}

/** An Element, or a stand-in in tests. */
export interface TriggerSource {
  closest: (selector: string) => Element | null;
  ownerDocument: Pick<Document, "querySelector">;
}

/** Itself, the nearest ancestor matching `selector`, or else the first match in the document. */
export function resolveTrigger<T extends TriggerSource>(
  el: T,
  selector?: string,
): T | Element | null {
  if (!selector) return el;
  return el.closest(selector) ?? el.ownerDocument.querySelector(selector);
}
