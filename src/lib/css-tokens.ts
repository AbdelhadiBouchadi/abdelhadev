/* Colour tokens as values, for the 3D scene and the dusk sky tween, so nothing in TypeScript spells
   a colour. Browser only; the reader is injectable for the unit tests. */

export type TokenSource = (property: `--${string}`) => string;

export function rootTokenSource(root: Element = document.documentElement): TokenSource {
  const style = getComputedStyle(root);
  return (property) => style.getPropertyValue(property);
}

export class MissingTokenError extends Error {
  constructor(readonly names: readonly string[]) {
    super(`Missing colour token(s): ${names.map((n) => `--${n}`).join(", ")}`);
    this.name = "MissingTokenError";
  }
}

/** Throws MissingTokenError naming every empty or absent token, so the caller falls back as a
    whole (the scene shows its poster) instead of drawing with a missing colour. */
export function readColorTokens<const K extends string>(
  names: readonly K[],
  source: TokenSource = rootTokenSource(),
): Record<K, string> {
  const out: Partial<Record<K, string>> = {};
  const missing: K[] = [];
  for (const name of names) {
    const value = source(`--${name}`).trim();
    if (value === "") missing.push(name);
    else out[name] = value;
  }
  if (missing.length > 0) throw new MissingTokenError(missing);
  // Every name was assigned above, or the function threw.
  return out as Record<K, string>;
}
