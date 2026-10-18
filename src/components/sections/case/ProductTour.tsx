/* The product tour (prototype .tour), day: what the product does, one step per screen, in the
   order of the case study data.
   - Motion on, from 901 px: the steps scroll past a sticky framed stage holding every screen;
     the step crossing 55 % of the viewport is active (TourMotion, useScrollSpy SPY.tour), its
     screen crossfades in and the other steps dim (src/styles/case.css for the layout).
   - Otherwise (no JavaScript, reduced motion, phones): no stage, each step shows its own screen.
   The stage repeats the inline screens for sighted readers only (aria-hidden); the step text and
   the inline screens carry the meaning. Placeholders until 08 brings the real screenshots. */
import { getTranslations } from "next-intl/server";
import { pick, type CaseStudyCopy } from "@/components/sections/case/case-copy";
import { TourMotion } from "@/components/sections/case/TourMotion";
import { Screen } from "@/components/ui/Screen";
import type { CaseStudy } from "@/lib/content/schema";
import { ToneSection } from "@/primitives/ToneSection";

export interface ProductTourProps {
  study: CaseStudy;
  copy: CaseStudyCopy;
}

export async function ProductTour({ study, copy }: ProductTourProps) {
  const t = await getTranslations("case.tour");
  const work = await getTranslations("work");
  const label = work("screenshot");
  const steps = study.tour.map((step, i) => ({
    ...step,
    id: `tour-${step.key}`,
    num: String(i + 1).padStart(2, "0"),
    copy: pick(copy.case.tour, step.key, "tour"),
    alt: pick(copy.case.screens, step.key, "screens"),
  }));

  return (
    <ToneSection tone="day" className="case-tour" aria-labelledby="tour-title" data-tour="">
      <div className="wrap">
        <h2 id="tour-title" className="sr">
          {t("label")}
        </h2>
        <div className="tour-grid">
          <div className="tour-steps">
            {steps.map((step) => (
              <article
                key={step.key}
                id={step.id}
                className="tour-step"
                aria-labelledby={`${step.id}-title`}
              >
                <span className="tour-num">{step.num}</span>
                <h3 id={`${step.id}-title`} className="display h-sm">
                  {step.copy.title}
                </h3>
                <p>{step.copy.text}</p>
                <div className="tour-shot" data-frame={step.tone}>
                  <Screen layout={step.skeleton} label={label} caption={step.alt} captionHidden />
                </div>
              </article>
            ))}
          </div>
          <div className="tour-stage" aria-hidden="true">
            <div className="tour-frame">
              {steps.map((step) => (
                <div key={step.key} className="tour-slot" data-tour-slot={step.key}>
                  <Screen layout={step.skeleton} label={label} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <TourMotion ids={steps.map((step) => step.id)} />
    </ToneSection>
  );
}
