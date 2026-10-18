// The home 3D scene's progress store (src/lib/scene-state.ts).
import { describe, expect, it } from "vitest";
import { createSceneState, duskToP3, sceneState } from "@/lib/scene-state";

describe("createSceneState", () => {
  it("starts at the top of the page", () => {
    expect(createSceneState().progress).toEqual({ p1: 0, p2: 0, p3: 0 });
  });

  it("sets each value and keeps the same record, so a frame can read it by reference", () => {
    const state = createSceneState();
    const record = state.progress;
    state.set("p1", 0.25);
    state.set("p2", 0.5);
    state.set("p3", 0.75);
    expect(record).toBe(state.progress);
    expect(record).toEqual({ p1: 0.25, p2: 0.5, p3: 0.75 });
  });

  it("clamps to [0, 1] and treats a non-finite value as 0", () => {
    const state = createSceneState();
    state.set("p1", 1.4);
    state.set("p2", -0.2);
    state.set("p3", Number.NaN);
    expect(state.progress).toEqual({ p1: 1, p2: 0, p3: 0 });
    state.set("p3", Number.POSITIVE_INFINITY);
    expect(state.progress.p3).toBe(0);
  });

  it("resets every value", () => {
    const state = createSceneState();
    state.set("p1", 1);
    state.set("p2", 1);
    state.set("p3", 1);
    state.reset();
    expect(state.progress).toEqual({ p1: 0, p2: 0, p3: 0 });
  });

  it("gives independent stores", () => {
    const a = createSceneState();
    const b = createSceneState();
    a.set("p1", 1);
    expect(b.progress.p1).toBe(0);
  });

  it("exports the one shared store", () => {
    sceneState.reset();
    expect(sceneState.progress).toEqual({ p1: 0, p2: 0, p3: 0 });
  });
});

describe("duskToP3", () => {
  // The dusk stage runs from "top bottom" to "bottom top" (height + viewport); p3 runs from "top
  // bottom" to "center center" (half of that), so p3 is twice the stage progress, capped at 1.
  it("is twice the stage progress, capped at 1", () => {
    expect(duskToP3(0)).toBe(0);
    expect(duskToP3(0.25)).toBe(0.5);
    expect(duskToP3(0.5)).toBe(1);
    expect(duskToP3(0.9)).toBe(1);
  });

  it("matches the range arithmetic for the 190 vh dusk", () => {
    const vh = 900;
    const height = 1.9 * vh;
    const stageLength = height + vh;
    const p3Length = height / 2 + vh / 2;
    for (const scrolled of [0, 300, 900, p3Length, 2000]) {
      expect(duskToP3(scrolled / stageLength)).toBeCloseTo(Math.min(1, scrolled / p3Length), 10);
    }
  });
});
