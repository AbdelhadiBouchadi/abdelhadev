/* The home 3D scene's scroll progress, framework-free (no React, no GSAP, no three), as the
   prototype's `scene.state`. The home sections write it from their ScrollTriggers and stage
   progress; the scene reads it on every frame it renders. A plain mutable record read by
   reference, so a frame costs no allocation and no subscription.

   - p1: the hero, from its top at the top of the viewport to its bottom there (the slabs part a
     little as the hero leaves).
   - p2: the manifesto, from its top at the bottom of the viewport to its bottom there (the slabs
     part outwards and recede).
   - p3: the dusk, from its top at the bottom of the viewport to its centre at the centre (the slabs
     fly up; the canvas stops rendering near 1). */

export interface SceneProgress {
  p1: number;
  p2: number;
  p3: number;
}

export type SceneKey = keyof SceneProgress;

export interface SceneState {
  /** The live record. Read it each frame; never keep a copy. */
  readonly progress: Readonly<SceneProgress>;
  /** Sets one value, clamped to [0, 1] (a non-finite value counts as 0). */
  set: (key: SceneKey, value: number) => void;
  /** Back to the top of the page: every value 0. */
  reset: () => void;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function createSceneState(): SceneState {
  const progress: SceneProgress = { p1: 0, p2: 0, p3: 0 };
  return {
    progress,
    set(key, value) {
      progress[key] = clamp01(value);
    },
    reset() {
      progress.p1 = 0;
      progress.p2 = 0;
      progress.p3 = 0;
    },
  };
}

/** The dusk's p3 from its stage progress. The stage runs from "top bottom" to "bottom top" (the
    section's height plus one viewport); p3 runs from "top bottom" to "center center", which is
    exactly half of that range. */
export function duskToP3(stageProgress: number): number {
  return clamp01(stageProgress * 2);
}

/** The one scene the home page has. */
export const sceneState: SceneState = createSceneState();
