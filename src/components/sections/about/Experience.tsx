/* A date I have not supplied shows as a placeholder chip, never an invented year. */
import { getTranslations } from "next-intl/server";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Chip } from "@/components/ui/Chip";
import type { Locale } from "@/i18n/routing";
import { EXPERIENCE } from "@/lib/content/about";
import { CV } from "@/lib/content/cv";
import { cvBytes, formatFileSize } from "@/lib/content/cv-file";
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
          <ArrowLink
            as="a"
            href={cv.href}
            download={cv.filename}
            hrefLang={locale}
            variant="download"
            type="application/pdf"
          >
            {t("cv", { size: formatFileSize(cvBytes(locale), locale) })}
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
