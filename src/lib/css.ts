/* Reads a design token in the browser, for the few tweens that need a token's value as a string
   GSAP can interpolate (a clip-path radius). Tokens never change at runtime, so each is read once.
   The server-side counterpart is lib/tokens.ts. */

const cache = new Map<string, string>();

/** The computed value of `--<name>` on the root element, e.g. readToken("r-media") → "18px". */
export function readToken(name: string): string {
  let value = cache.get(name);
  if (value === undefined) {
    value = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
    cache.set(name, value);
  }
  return value;
}

/** True when the boot script allowed motion (html.motion): the CSS start states apply. */
export function motionAllowed(): boolean {
  return document.documentElement.classList.contains("motion");
}
