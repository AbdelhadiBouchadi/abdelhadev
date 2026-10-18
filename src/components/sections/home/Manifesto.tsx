/* The home manifesto (prototype #manifesto): a 240 vh day section with a sticky stage. The
   statement's words light up across the whole section (WordsLight on the StickyStage range), the
   3D slabs part and recede with the section's progress (SceneProgress p2), and the 3D layer has
   dimmed to 0.3 by the time the stage is pinned (the Scrub around the layer, in Hero). Without
   JavaScript and under reduced motion the section is in normal flow with the statement at full
   opacity. */
import { getTranslations } from "next-intl/server";
import { SceneProgress } from "@/components/sections/home/SceneProgress";
import { STAGE } from "@/lib/motion";
import { StickyStage } from "@/primitives/StickyStage";
import { WordsLight } from "@/primitives/WordsLight";

export async function Manifesto() {
  const t = await getTranslations("home.manifesto");
  return (
    <StickyStage
      tone="day"
      id="manifesto"
      height="240vh"
      aria-label={t("label")}
      stageClassName="wrap manifesto-stage"
    >
      <WordsLight
        trigger="[data-stage]"
        start={STAGE.start}
        end={STAGE.end}
        className="manifesto-statement statement"
      >
        {t("statement")}
      </WordsLight>
      <SceneProgress value="p2" trigger="#manifesto" start="top bottom" end="bottom bottom" />
    </StickyStage>
  );
}
