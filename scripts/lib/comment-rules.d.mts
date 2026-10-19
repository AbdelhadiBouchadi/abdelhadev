export const FAIL: readonly { rule: string; pattern: RegExp }[];
export const WARN: readonly { rule: string; pattern: RegExp }[];
export function extractComments(path: string, text: string): { line: number; text: string }[];
export function checkComments(
  path: string,
  text: string,
): {
  errors: string[];
  warnings: string[];
};
