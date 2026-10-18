/* The dawn (prototype .dawn), day. Four concentric arcs of light behind the copy rise and settle at
   the loader's ready signal (DawnArcsMotion); as the dawn scrolls away they expand and fade
   (Scrub, SETTLE.arcs). The title lines rise ABOUT.dawn.titleDelay after ready (SplitReveal), the
   lead and the facts row fade up after them (Reveal). Everything is painted under the loader
   overlay, and complete without JavaScript and under reduced motion. The arcs are decorative. */
import { getTranslations } from "next-intl/server";
import { DawnArcsMotion } from "@/components/sections/about/DawnArcsMotion";
import { ABOUT, SETTLE } from "@/lib/motion";
import { Reveal } from "@/primitives/Reveal";
import { Scrub } from "@/primitives/Scrub";
import { SplitReveal } from "@/primitives/SplitReveal";
import { ToneSection } from "@/primitives/ToneSection";

const FACTS = ["languages", "timeZone", "mode"] as const;

export async function AboutHero() {
  const t = await getTranslations("about");
  return (
    <ToneSection tone="day" className="dawn">
      <Scrub
        className="arcs"
        aria-hidden="true"
        to={SETTLE.arcs}
        trigger=".dawn"
        start={ABOUT.dawn.scrubStart}
        end={ABOUT.dawn.scrubEnd}
      >
        <span className="arc" />
        <span className="arc" />
        <span className="arc" />
        <span className="arc" />
        <DawnArcsMotion />
      </Scrub>
      <div className="dawn-copy wrap">
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
          when="ready"
          y={ABOUT.dawn.laterY}
          delay={ABOUT.dawn.laterDelay}
          className="grid gap-6"
        >
          <p className="lead">{t("lead")}</p>
          <dl className="about-facts">
            {FACTS.map((key) => (
              <div key={key}>
                <dt>{t(`facts.${key}.term`)}</dt>
                <dd>{t(`facts.${key}.value`)}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </ToneSection>
  );
}
