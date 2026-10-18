/* The home page's sky (prototype #sky and #sun), mounted by the home hero only. While motion runs
   it is a fixed layer behind the whole page: the sky's colour turns from paper to sunset to night
   with the dusk (the dusk's stage timeline tweens it), and the sun glow rises with the hero intro
   and sinks and fades from the hero to the dusk's centre (SkyMotion). The sections become
   transparent over it (`html.sky`, styles/home.css).

   Without JavaScript, and under reduced motion, there is no fixed sky: every section keeps its own
   tone background, and the sun is a still glow inside the hero. Decorative, hidden from assistive
   technology. Colours come from the tokens (--paper, --sun-*). */
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
