/* Experience (prototype .timeline), day: five rows, when / what / where, fading up one
   ABOUT.stagger.timeline apart when the list enters (Reveal). The section head carries the CV
   download for the page's locale (src/lib/content/cv.ts). A date the owner has not supplied shows
   as a visible placeholder chip, never an invented year (decision P6); the education row names
   no university and no year (decision P3). */
import { getTranslations } from "next-intl/server";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Chip } from "@/components/ui/Chip";
import type { Locale } from "@/i18n/routing";
import { EXPERIENCE } from "@/lib/content/about";
import { CV } from "@/lib/content/cv";
import { ABOUT } from "@/lib/motion";
import { isTodo } from "@/lib/todo";
import { Reveal } from "@/primitives/Reveal";
import { ToneSection } from "@/primitives/ToneSection";

export interface ExperienceProps {
  locale: Locale;
}

export async function Experience({ locale }: ExperienceProps) {
  const t = await getTranslations("about.experience");
  const cv = CV[locale];
  return (
    <ToneSection
      tone="day"
      id="experience"
      className="about-pad pt-0"
      aria-labelledby="experience-title"
    >
      <div className="wrap">
        <div className="about-head">
          <h2 id="experience-title" className="display h-md">
            {t("title")}
          </h2>
          <ArrowLink as="a" href={cv.href} download variant="download" type="application/pdf">
            {t("cv")}
          </ArrowLink>
        </div>
        <Reveal as="ol" when="enter" stagger={ABOUT.stagger.timeline} className="timeline">
          {EXPERIENCE.map((entry) => {
            const when = t(`items.${entry.key}.when`);
            return (
              <li key={entry.key}>
                <span className="when">
                  {isTodo(when) ? <Chip variant="todo">{when}</Chip> : when}
                </span>
                <div>
                  <h3>{t(`items.${entry.key}.title`)}</h3>
                  {entry.detail ? <p>{t(`items.${entry.key}.text`)}</p> : null}
                </div>
                <span className="where">{t(`items.${entry.key}.where`)}</span>
              </li>
            );
          })}
        </Reveal>
      </div>
    </ToneSection>
  );
}
