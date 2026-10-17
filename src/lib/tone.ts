/* Section tones and the shell tone (prototype `initTone`). Sections are day, night or sheet; the
   shell (header, mobile pill, cursor) only knows day and night, and a sheet reads as day. */

export type SectionTone = "day" | "night" | "sheet";
export type ShellTone = "day" | "night";

/** Elements that follow the tone of the section under them carry this attribute. */
export const SHELL_ATTR = "data-shell";

export function shellToneOf(tone: SectionTone): ShellTone {
  return tone === "night" ? "night" : "day";
}

/** The top-level toned elements, as in the prototype's initTone. */
export const TONED_SELECTOR = "main > [data-tone], footer[data-tone]";

function isSectionTone(value: string | undefined): value is SectionTone {
  return value === "day" || value === "night" || value === "sheet";
}

/** The shell tone of the top-level section under `line` px from the top of the viewport. Day when
    none is (a page without toned sections). */
export function toneAt(root: Pick<ParentNode, "querySelectorAll">, line: number): ShellTone {
  for (const el of root.querySelectorAll<HTMLElement>(TONED_SELECTOR)) {
    const { top, bottom } = el.getBoundingClientRect();
    const tone = el.dataset.tone;
    if (top <= line && bottom > line && isSectionTone(tone)) return shellToneOf(tone);
  }
  return "day";
}

/** Sets `data-tone` on every shell element; their CSS transitions the colours. */
export function applyShellTone(root: Pick<ParentNode, "querySelectorAll">, tone: ShellTone): void {
  for (const el of root.querySelectorAll<HTMLElement>(`[${SHELL_ATTR}]`)) {
    if (el.dataset.tone !== tone) el.dataset.tone = tone;
  }
}
