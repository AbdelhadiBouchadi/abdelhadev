export const BANNED_FR: readonly { phrase: string; pattern: RegExp }[];
export function checkFrench(messages: Record<string, unknown>): {
  errors: string[];
  warnings: string[];
};
