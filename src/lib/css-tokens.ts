/* Reads colour tokens from src/styles/tokens.css at runtime, for code that needs a colour as a
   value rather than as CSS: the home 3D scene (three.js materials, lights and canvas textures) and
   the dusk sky tween. Browser only. Keeps tokens.css the only source of colour values: nothing in
   TypeScript spells a colour (pnpm check:tokens).

   The reader is injectable so tests/unit can drive it without a DOM. */

/** Reads the raw value of a custom property, e.g. "--glow" → its hex value. */
export type TokenSource = (property: `--${string}`) => string;

/** The computed custom properties of the root element. Browser only. */
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

/** The values of `names` (token names without the leading "--"), trimmed. Throws
    MissingTokenError naming every token that is empty or absent, so a caller can fall back as a
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
  // Every name was assigned above (or the function threw), so the partial record is complete.
  return out as Record<K, string>;
}
