/* The shell (header, mobile pill, cursor) only knows day and night; a sheet reads as day. */

export type SectionTone = "day" | "night" | "sheet";
export type ShellTone = "day" | "night";

export const SHELL_ATTR = "data-shell";

export function shellToneOf(tone: SectionTone): ShellTone {
  return tone === "night" ? "night" : "day";
}

export const TONED_SELECTOR = "main > [data-tone], footer[data-tone]";

function isSectionTone(value: string | undefined): value is SectionTone {
  return value === "day" || value === "night" || value === "sheet";
}

/** Day when no toned section is under the line. */
export function toneAt(root: Pick<ParentNode, "querySelectorAll">, line: number): ShellTone {
  for (const el of root.querySelectorAll<HTMLElement>(TONED_SELECTOR)) {
    const { top, bottom } = el.getBoundingClientRect();
    const tone = el.dataset.tone;
    if (top <= line && bottom > line && isSectionTone(tone)) return shellToneOf(tone);
  }
  return "day";
}

export const TONE_TRIGGER_ATTR = "data-tone-trigger";

/** Skips sections with their own tone trigger: they take over when it fires, which can be later
    than their top reaching the line (the home dusk turns at its centre). */
export function untriggeredToneAt(
  root: Pick<ParentNode, "querySelectorAll">,
  line: number,
): ShellTone | null {
  for (const el of root.querySelectorAll<HTMLElement>(TONED_SELECTOR)) {
    if (el.querySelector(`:scope > [${TONE_TRIGGER_ATTR}]`)) continue;
    const { top, bottom } = el.getBoundingClientRect();
    const tone = el.dataset.tone;
    if (top <= line && bottom > line && isSectionTone(tone)) return shellToneOf(tone);
  }
  return null;
}

/** Their CSS transitions the colours. */
export function applyShellTone(root: Pick<ParentNode, "querySelectorAll">, tone: ShellTone): void {
  for (const el of root.querySelectorAll<HTMLElement>(`[${SHELL_ATTR}]`)) {
    if (el.dataset.tone !== tone) el.dataset.tone = tone;
  }
}
