import { getTranslations } from "next-intl/server";
import { pick, type CaseStudyCopy } from "@/components/sections/case/case-copy";
import type { CaseStudy } from "@/lib/content/schema";
import { STAGGER } from "@/lib/motion";
import { Reveal } from "@/primitives/Reveal";
import { ToneSection } from "@/primitives/ToneSection";

export interface AdaptationProps {
  study: CaseStudy;
  copy: CaseStudyCopy;
}

export async function Adaptation({ study, copy }: AdaptationProps) {
  const t = await getTranslations("case.adapt");
  return (
    <ToneSection tone="day" className="case-pad" aria-labelledby="adapt-title">
      <div className="wrap">
        <div className="section-head">
          <h2 id="adapt-title" className="display h-md">
            {t("title")}
          </h2>
          <p className="lead muted">{t("lead")}</p>
        </div>
        <Reveal as="ol" when="enter" stagger={STAGGER.adapt} className="steps">
          {study.adapt.map((key) => {
            const step = pick(copy.case.adapt, key, "adapt");
            return (
              <li key={key}>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            );
          })}
        </Reveal>
      </div>
    </ToneSection>
  );
}
