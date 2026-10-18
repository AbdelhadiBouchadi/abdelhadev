/* The home dusk (prototype #dusk): a 190 vh night section with a sticky stage, where the day ends.
   Its stage timeline (DuskMotion) turns the sky from paper to sunset to night, crosses the text
   colours from ink to moon and fades the sub line up; the title lines rise (SplitReveal lines,
   scrubbed on the section); the slabs fly up and the canvas stops (p3). The shell turns to night
   at the section's centre (the ToneSection around the stage, start "center 50px").

   Without the fixed sky (no JavaScript, reduced motion) the section is plain night with moon text,
   in normal flow. */
import { getTranslations } from "next-intl/server";
import { DuskMotion } from "@/components/sections/home/DuskMotion";
import { HOME } from "@/lib/motion";
import { SplitReveal } from "@/primitives/SplitReveal";
import { StickyStage } from "@/primitives/StickyStage";
import { ToneSection } from "@/primitives/ToneSection";

export async function Dusk() {
  const t = await getTranslations("home.dusk");
  return (
    // StickyStage declares a tone from the section's top; the dusk takes over at its centre, so the
    // tone sits on a wrapper of the same height.
    <ToneSection as="div" tone="night" start={HOME.dusk.toneStart} data-dusk-tone="">
      <StickyStage
        id="dusk"
        height="190vh"
        aria-label={t("label")}
        stageClassName="wrap dusk-stage"
      >
        <div className="dusk-inner">
          <SplitReveal
            type="lines"
            when="scrub"
            trigger="#dusk"
            start={HOME.dusk.linesStart}
            end={HOME.dusk.linesEnd}
            className="dusk-title display h-lg"
            data-dusk-title=""
          >
            {t("title")}
          </SplitReveal>
          <p className="dusk-sub" data-dusk-sub="">
            {t("sub")}
          </p>
        </div>
        <DuskMotion />
      </StickyStage>
    </ToneSection>
  );
}
