import { getTranslations } from "next-intl/server";
import { DawnMotion } from "@/components/sections/about/DawnMotion";
import { ABOUT, STAGGER } from "@/lib/motion";
import { Reveal } from "@/primitives/Reveal";
import { SplitReveal } from "@/primitives/SplitReveal";
import { ToneSection } from "@/primitives/ToneSection";

const FACTS = ["languages", "timeZone", "mode"] as const;
const HALOS = [0, 1, 2, 3] as const;

export async function AboutHero() {
  const t = await getTranslations("about");
  return (
    <ToneSection tone="day" className="dawn">
      <div className="dawn-stage">
        <div className="dawn-glow" aria-hidden="true">
          <span className="dawn-glow-light" />
        </div>
        <div className="dawn-sky" aria-hidden="true" />
        <div className="halos" aria-hidden="true">
          {HALOS.map((key) => (
            <span key={key} className="halo" />
          ))}
        </div>
        {/* The brand mark at large size, in its own proportions (components/brand/Mark). */}
        <div className="dawn-sun" aria-hidden="true">
          <div className="sun-mark">
            <div className="sun-clip">
              <span className="sun-disc" />
            </div>
            <span className="sun-horizon" />
            <span className="sun-reflection" />
          </div>
        </div>
        <div className="dawn-copy wrap">
          <SplitReveal
            as="h1"
            type="lines"
            when="ready"
            delay={ABOUT.dawn.titleDelay}
            tabIndex={-1}
            className="dawn-title display"
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
      </div>
      <DawnMotion />
    </ToneSection>
  );
}
