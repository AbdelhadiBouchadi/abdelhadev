/* The problem statement (prototype .problem), day: the project's challenge, its words lighting
   up as the section scrolls by (WordsLight, CASE.problem range). Plain, fully opaque text without
   JavaScript and under reduced motion. */
import { getTranslations } from "next-intl/server";
import type { CaseStudyCopy } from "@/components/sections/case/case-copy";
import { CASE } from "@/lib/motion";
import { ToneSection } from "@/primitives/ToneSection";
import { WordsLight } from "@/primitives/WordsLight";

export interface CaseProblemProps {
  copy: CaseStudyCopy;
}

export async function CaseProblem({ copy }: CaseProblemProps) {
  const t = await getTranslations("case");
  return (
    <ToneSection tone="day" className="case-problem case-pad" aria-label={t("problem")}>
      <div className="wrap">
        <WordsLight
          trigger=".case-problem"
          start={CASE.problem.start}
          end={CASE.problem.end}
          className="statement"
        >
          {copy.challenge}
        </WordsLight>
      </div>
    </ToneSection>
  );
}
