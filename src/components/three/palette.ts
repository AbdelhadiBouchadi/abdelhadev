/* The --scene-* tokens cover the scene colours that had no token. */
export const SCENE_TOKENS = [
  "scene-light-ambient",
  "scene-light-sky",
  "scene-light-ground",
  "scene-light-key",
  "scene-light-rim",
  "scene-slab",
  "scene-screen",
  "scene-bar",
  "scene-pill",
  "scene-pill-soft",
  "scene-label",
  "scene-line",
  "scene-line-dark",
  "scene-tile",
  "scene-cell",
  "scene-cell-warm",
  "glow",
  "majorelle",
  "majorelle-soft",
  "ink",
] as const;

export type SceneToken = (typeof SCENE_TOKENS)[number];
export type SceneColors = Readonly<Record<SceneToken, string>>;
