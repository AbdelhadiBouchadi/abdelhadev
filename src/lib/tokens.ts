/* For the few places that need a raw colour outside CSS (the web manifest, the theme colour), so
   tokens.css stays the only source of colour values. Runs at build time. */
import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

let cache: string | undefined;

export function cssToken(name: string): string {
  cache ??= readFileSync(join(process.cwd(), "src/styles/tokens.css"), "utf8");
  const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(cache);
  if (!match?.[1]) throw new Error(`Token --${name} not found in tokens.css`);
  return match[1].trim();
}
