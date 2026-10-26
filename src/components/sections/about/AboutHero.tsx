import { getTranslations } from "next-intl/server";
import { DawnMotion } from "@/components/sections/about/DawnMotion";
import { ABOUT, STAGGER } from "@/lib/motion";
import { Reveal } from "@/primitives/Reveal";
import { SplitReveal } from "@/primitives/SplitReveal";
import { ToneSection } from "@/primitives/ToneSection";

const FACTS = ["languages", "timeZone", "mode"] as const;
const ARCS = [0, 1, 2, 3] as const;

export async function AboutHero() {
  const t = await getTranslations("about");
  return (
    <ToneSection tone="day" className="dawn">
      <div className="arcs" aria-hidden="true">
        {ARCS.map((key) => (
          <span key={key} className="arc">
            <span className="arc-light" />
          </span>
        ))}
      </div>
      <div className="dawn-copy wrap">
        <div className="dawn-lift">
          <SplitReveal
            as="h1"
            type="lines"
            when="ready"
            delay={ABOUT.dawn.titleDelay}
            tabIndex={-1}
            className="dawn-title display h-xl"
          >
            {t("title")}
          </SplitReveal>
          <Reveal
            as="p"
            targets="self"
            when="ready"
            y={ABOUT.dawn.laterY}
            delay={ABOUT.dawn.laterDelay}
            className="lead"
          >
            {t("lead")}
          </Reveal>
        </div>
        {/* One stagger step after the lead, as when they were one group. */}
        <Reveal
          as="dl"
          targets="self"
          when="ready"
          y={ABOUT.dawn.laterY}
          delay={ABOUT.dawn.laterDelay + STAGGER.reveal}
          className="about-facts"
        >
          {FACTS.map((key) => (
            <div key={key}>
              <dt>{t(`facts.${key}.term`)}</dt>
              <dd>{t(`facts.${key}.value`)}</dd>
            </div>
          ))}
        </Reveal>
      </div>
      <DawnMotion />
    </ToneSection>
  );
}
