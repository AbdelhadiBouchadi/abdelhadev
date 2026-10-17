import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DURATION, LENIS, LOADER, SCRUB, WARM_CURVE } from "@/lib/motion";

const tokens = readFileSync(new URL("../../src/styles/tokens.css", import.meta.url), "utf8");

function cssVar(name: string): string {
  const value = new RegExp(`--${name}:\\s*([^;]+);`).exec(tokens)?.[1];
  if (value === undefined) throw new Error(`--${name} missing from tokens.css`);
  return value.trim();
}

const camel = (s: string) => s.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

describe("motion.ts mirrors the CSS motion tokens", () => {
  it("--ease-warm is the warm curve", () => {
    const points = /cubic-bezier\(([^)]+)\)/.exec(cssVar("ease-warm"))?.[1]?.split(",").map(Number);
    expect(points).toEqual([...WARM_CURVE]);
  });

  it("every --dur-* token equals the DURATION entry of the same name", () => {
    const durations = [...tokens.matchAll(/--dur-([\w-]+):\s*([\d.]+)s;/g)];
    expect(durations.length).toBeGreaterThan(0);
    for (const [, name = "", seconds = ""] of durations) {
      const key = camel(name);
      expect(Object.hasOwn(DURATION, key), `DURATION.${key} for --dur-${name}`).toBe(true);
      expect(DURATION[key as keyof typeof DURATION]).toBe(Number(seconds)); // key checked just above
    }
  });

  it("keeps the documented system values", () => {
    expect(DURATION.base).toBe(0.6);
    expect(SCRUB).toBe(0.8);
    expect(LENIS.lerp).toBe(0.1);
    expect(LOADER).toMatchObject({
      floorFirstMs: 1600,
      floorRouteMs: 700,
      ceilingMs: 4500,
      weights: { fonts: 3, load: 2, image: 1, scene: 3 },
    });
  });
});
