/* Without JavaScript and under reduced motion there is no fixed sky: every section keeps its own
   background and the sun is a still glow inside the hero. */
import { SkyMotion } from "@/components/layout/SkyMotion";

export function Sky() {
  return (
    <>
      <div id="sky" className="sky-layer" aria-hidden="true" />
      {/* The sun is two layers: the outer one sinks with the scroll, the glow inside rises with
          the intro, so the two never tween the same properties. */}
      <div id="sun" className="sun-layer" aria-hidden="true">
        <div className="sun-glow" />
      </div>
      <SkyMotion />
    </>
  );
}
