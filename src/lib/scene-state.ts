/* A plain mutable record read by reference, so a frame costs no allocation and no subscription.
   p1: the hero leaving the top of the viewport. p2: the manifesto crossing the viewport. p3: the
   dusk, from its top at the bottom of the viewport to its centre at the centre. */

export interface SceneProgress {
  p1: number;
  p2: number;
  p3: number;
}

export type SceneKey = keyof SceneProgress;

export interface SceneState {
  /** Read it each frame; never keep a copy. */
  readonly progress: Readonly<SceneProgress>;
  /** Clamped to [0, 1]; a non-finite value counts as 0. */
  set: (key: SceneKey, value: number) => void;
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

/** p3 runs from "top bottom" to "center center", exactly half of the stage's range. */
export function duskToP3(stageProgress: number): number {
  return clamp01(stageProgress * 2);
}

export const sceneState: SceneState = createSceneState();
