import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { SCENE_TOKENS } from "@/components/three/palette";
import { MissingTokenError, readColorTokens, rootTokenSource } from "@/lib/css-tokens";

const tokensCss = readFileSync(new URL("../../src/styles/tokens.css", import.meta.url), "utf8");

/** With the leading space getComputedStyle keeps. */
const fromTokensCss = (property: string) => {
  const match = new RegExp(`${property}:\\s*([^;]+);`).exec(tokensCss);
  return match?.[1] ? ` ${match[1]}` : "";
};

describe("readColorTokens", () => {
  it("returns the trimmed values by name", () => {
    // Token values are opaque strings to the reader; these stand in for colours.
    const values: Record<string, string> = { "--glow": " glow-value ", "--ink": "ink-value" };
    const source = vi.fn((p: string) => values[p] ?? "");
    expect(readColorTokens(["glow", "ink"], source)).toEqual({
      glow: "glow-value",
      ink: "ink-value",
    });
    expect(source).toHaveBeenCalledWith("--glow");
    expect(source).toHaveBeenCalledWith("--ink");
  });

  it("throws one error naming every missing or empty token", () => {
    const source = (p: string) => (p === "--glow" ? "glow-value" : p === "--ink" ? "   " : "");
    let caught: unknown;
    try {
      readColorTokens(["glow", "ink", "nope"], source);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(MissingTokenError);
    if (!(caught instanceof MissingTokenError)) return;
    expect(caught.names).toEqual(["ink", "nope"]);
    expect(caught.message).toBe("Missing colour token(s): --ink, --nope");
  });

  it("reads the root element's computed style by default", () => {
    const getPropertyValue = vi.fn(() => " root-value");
    vi.stubGlobal("getComputedStyle", () => ({ getPropertyValue }));
    const root = {} as Element; // only passed through to the stubbed getComputedStyle
    expect(readColorTokens(["glow"], rootTokenSource(root))).toEqual({ glow: "root-value" });
    expect(getPropertyValue).toHaveBeenCalledWith("--glow");
    vi.unstubAllGlobals();
  });
});

describe("scene tokens", () => {
  it("every token the scene reads exists in tokens.css", () => {
    expect(() => readColorTokens(SCENE_TOKENS, fromTokensCss)).not.toThrow();
  });

  it("every --scene-* token in tokens.css is read by the scene (no orphans)", () => {
    const declared = [...tokensCss.matchAll(/--(scene-[\w-]+):/g)].map((m) => m[1]);
    expect(declared.length).toBeGreaterThan(0);
    for (const name of declared) expect(SCENE_TOKENS).toContain(name);
  });
});
