/* Placeholders for facts the owner has not supplied yet: "[" + MARK + ": what is missing]".
   The marker is assembled here, never spelled out in code, so `git grep` and the build report
   (scripts/report-todos.mjs) list real placeholders only. */
const MARK = "TODO";

export type Todo = `[${typeof MARK}: ${string}]`;

const PATTERN = new RegExp(`^\\[${MARK}: .+\\]$`);

export function isTodo(value: unknown): value is Todo {
  return typeof value === "string" && PATTERN.test(value);
}

const INSIDE = new RegExp(`\\[${MARK}\\b`);

/** Whether a text holds a placeholder anywhere (a sentence that still contains one). */
export function hasTodo(value: string): boolean {
  return INSIDE.test(value);
}
