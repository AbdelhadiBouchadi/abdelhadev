import { getTranslations } from "next-intl/server";
import { CHAPTERS } from "@/lib/content/about";
import { ABOUT } from "@/lib/motion";
import { Reveal } from "@/primitives/Reveal";
import { StickyStage } from "@/primitives/StickyStage";
import { WordsLight } from "@/primitives/WordsLight";

export async function Chapters() {
  const t = await getTranslations("about.chapters");
  return (
    <div className="chapters">
      {CHAPTERS.map((key) => (
        <StickyStage
          key={key}
          tone="day"
          height="200vh"
          id={`chapter-${key}`}
          className="chapter"
          aria-labelledby={`chapter-${key}-label`}
          stageClassName="wrap chapter-stage"
        >
          <Reveal
            when="enter"
            targets="self"
            y={ABOUT.chapter.labelY}
            start={ABOUT.chapter.labelStart}
          >
            <h2 id={`chapter-${key}-label`} className="chapter-label">
              {t(`${key}.label`)}
            </h2>
          </Reveal>
          <WordsLight
            trigger=".chapter"
            start={ABOUT.chapter.wordsStart}
            end={ABOUT.chapter.wordsEnd}
            className="chapter-statement statement"
          >
            {t(`${key}.text`)}
          </WordsLight>
        </StickyStage>
      ))}
    </div>
  );
}
