/* No payment percentages (docs/decisions.md). */
import { getTranslations } from "next-intl/server";
import { PROCESS } from "@/lib/content/about";
import { ABOUT } from "@/lib/motion";
import { Reveal } from "@/primitives/Reveal";
import { ToneSection } from "@/primitives/ToneSection";

export async function Process() {
  const t = await getTranslations("about.process");
  return (
    <ToneSection tone="day" id="process" className="about-pad pt-0" aria-labelledby="process-title">
      <div className="wrap">
        <div className="section-head">
          <h2 id="process-title" className="display h-md">
            {t("title")}
          </h2>
          <p className="lead muted">{t("lead")}</p>
        </div>
        <Reveal
          as="ol"
          when="enter"
          stagger={ABOUT.stagger.process}
          className="steps"
          data-count={PROCESS.length}
        >
          {PROCESS.map((key) => (
            <li key={key}>
              <h3>{t(`steps.${key}.title`)}</h3>
              <p>{t(`steps.${key}.text`)}</p>
            </li>
          ))}
        </Reveal>
      </div>
    </ToneSection>
  );
}
