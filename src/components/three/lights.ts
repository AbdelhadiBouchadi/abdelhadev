/* three.js has used physical light units since r155, so the intensities of the original r128
   scene are multiplied by π here (three.js migration guide). */
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
