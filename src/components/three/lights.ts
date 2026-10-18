/* The lights of the home scene (prototype createScene): a warm ambient and hemisphere fill, a warm
   key light from the upper right and a cool Majorelle rim from the lower left.

   The prototype ran three r128, whose lights were "legacy": since r155 three.js uses physically
   based light units, in which the same look needs the ambient, hemisphere and directional
   intensities multiplied by π (three.js migration guide, r155). The prototype's numbers are kept
   and scaled here, so they can still be compared with docs/prototype/assets/site.js. */
import { AmbientLight, DirectionalLight, HemisphereLight, type Light, type Scene } from "three";
import type { SceneColors } from "@/components/three/palette";

export const LEGACY_LIGHT_SCALE = Math.PI;

export function addLights(scene: Scene, c: SceneColors): Light[] {
  const k = LEGACY_LIGHT_SCALE;
  const ambient = new AmbientLight(c["scene-light-ambient"], 0.55 * k);
  const hemisphere = new HemisphereLight(c["scene-light-sky"], c["scene-light-ground"], 0.55 * k);
  const key = new DirectionalLight(c["scene-light-key"], 1.05 * k);
  key.position.set(5, 6, 8);
  const rim = new DirectionalLight(c["scene-light-rim"], 0.38 * k);
  rim.position.set(-7, -3, 3);
  const lights = [ambient, hemisphere, key, rim];
  scene.add(...lights);
  return lights;
}
