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
