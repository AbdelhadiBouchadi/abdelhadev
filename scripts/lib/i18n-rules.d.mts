export function flatten(messages: Record<string, unknown>, prefix?: string): [string, unknown][];
export function checkMessages(
  byLocale: Record<string, Record<string, unknown>>,
  options?: { requireContent?: boolean },
): string[];
