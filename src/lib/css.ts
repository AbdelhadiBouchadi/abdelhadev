/* Tokens never change at runtime, so each is read once. The server side is lib/tokens.ts. */

const cache = new Map<string, string>();

/** readToken("r-media") → "18px" */
export function readToken(name: string): string {
  let value = cache.get(name);
  if (value === undefined) {
    value = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
    cache.set(name, value);
  }
  return value;
}

export function motionAllowed(): boolean {
  return document.documentElement.classList.contains("motion");
}
