/* The marker is assembled here, never spelled out in code, so git grep and the build report list
   real placeholders only. */
const MARK = "TODO";

export type Todo = `[${typeof MARK}: ${string}]`;

const PATTERN = new RegExp(`^\\[${MARK}: .+\\]$`);

export function isTodo(value: unknown): value is Todo {
  return typeof value === "string" && PATTERN.test(value);
}

const INSIDE = new RegExp(`\\[${MARK}\\b`);

export function hasTodo(value: string): boolean {
  return INSIDE.test(value);
}
