/* The stage repeats the inline screens for sighted readers only (aria-hidden). Stage copies load
   only where the stage shows and inline ones only where it does not: lazy images in a hidden box
   are not fetched. */
import { getMessages, getTranslations } from "next-intl/server";
import { pick, type CaseStudyCopy } from "@/components/sections/case/case-copy";
import { TourMotion } from "@/components/sections/case/TourMotion";
import { Screen } from "@/components/ui/Screen";
import type { CaseStudy } from "@/lib/content/schema";
import { mediaCopy, tourMedia } from "@/lib/media";
import { ProjectMedia } from "@/primitives/ProjectMedia";
import { ToneSection } from "@/primitives/ToneSection";

export interface ProductTourProps {
  slug: string;
  study: CaseStudy;
  copy: CaseStudyCopy;
}

/** 7 of 12 columns from 901 px (case.css), full width below. */
const SIZES = "(min-width: 901px) 58vw, 100vw";

export async function ProductTour({ slug, study, copy }: ProductTourProps) {
  const t = await getTranslations("case.tour");
  const work = await getTranslations("work");
  const messages = await getMessages();
  const label = work("screenshot");
  const controls = { play: work("video.play"), pause: work("video.pause") };
  const screens = tourMedia(slug);
  const steps = study.tour.map((step, i) => {
    const media = screens.get(i + 1);
    return {
      ...step,
      id: `tour-${step.key}`,
      num: String(i + 1).padStart(2, "0"),
      copy: pick(copy.case.tour, step.key, "tour"),
      media: media ? { item: media, text: mediaCopy(messages, media.key) } : null,
    };
  });

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
                  {step.media ? (
                    <Screen
                      media={
                        <ProjectMedia
                          item={step.media.item}
                          alt={step.media.text.alt}
                          label={step.media.text.label}
                          sizes={SIZES}
                          controls={controls}
                        />
                      }
                    />
                  ) : (
                    <Screen layout={step.skeleton} label={label} />
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="tour-stage" aria-hidden="true">
            <div className="tour-frame">
              {steps.map((step) => (
                <div key={step.key} className="tour-slot" data-tour-slot={step.key}>
                  {step.media ? (
                    <Screen
                      media={
                        <ProjectMedia
                          item={step.media.item}
                          alt=""
                          label={step.media.text.label}
                          sizes={SIZES}
                          controls={controls}
                        />
                      }
                    />
                  ) : (
                    <Screen layout={step.skeleton} label={label} />
                  )}
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
