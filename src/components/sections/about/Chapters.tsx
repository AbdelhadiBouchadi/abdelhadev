/* The three chapters (prototype .chapters), day: who I am, how I work, why clinics. Each is a
   200 vh section with a sticky, viewport-tall stage (StickyStage): its label fades up when it
   reaches 60 % of the viewport (Reveal), and its statement's words light up from the chapter's
   "top 20%" to its "bottom bottom" (WordsLight, unlit words at REVEAL.wordsFrom). Without
   JavaScript and under reduced motion each chapter is in normal flow, nothing sticky, every word
   at full opacity. The label is the chapter's heading. */
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
