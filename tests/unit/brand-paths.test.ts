import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { WORDMARK_PATHS, WORDMARK_VIEWBOX } from "@/components/brand/wordmark-paths";
import { parseWordmark, roundPath } from "@scripts/build-brand-paths.mjs";

describe("build-brand-paths", () => {
  it("rounds path numbers to 2 decimals and drops trailing zeros", () => {
    expect(roundPath("M41.800000000000004 68.0L-1.5 13.799999999999997")).toBe(
      "M41.8 68L-1.5 13.8",
    );
  });

  it("reads one path per letter of Abdelhadev, in order", () => {
    const svg = readFileSync(new URL("../../brand/wordmark-animated.svg", import.meta.url), "utf8");
    const { viewBox, paths } = parseWordmark(svg);
    expect(viewBox).toBe("0 0 496 72");
    expect(paths).toHaveLength("Abdelhadev".length);
    // The committed file is what the generator produces (CI also diffs it).
    expect(WORDMARK_VIEWBOX).toBe(viewBox);
    expect(WORDMARK_PATHS).toEqual(paths);
  });
});
