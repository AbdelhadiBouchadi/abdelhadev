/* The work hero (prototype .work-hero), day. The title lines rise at the loader's ready signal
   (SplitReveal); the lead and the link fade up after them (Reveal, WORK.hero). The link scrolls
   to the DentaFlow sheet through the transition link's hash (same page: Lenis, no curtain); without
   JavaScript it is a plain #dentaflow anchor. */
import { getTranslations } from "next-intl/server";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { WORK } from "@/lib/motion";
import { Reveal } from "@/primitives/Reveal";
import { SplitReveal } from "@/primitives/SplitReveal";
import { ToneSection } from "@/primitives/ToneSection";
import { TransitionLink } from "@/primitives/TransitionLink";

/** The sheet the hero link jumps to: the flagship, first on the page. */
const START = "dentaflow";

export async function WorkHero() {
  const t = await getTranslations("work");

  return (
    <ToneSection tone="day" className="work-hero">
      <div className="wrap">
        <SplitReveal
          as="h1"
          type="lines"
          when="ready"
          tabIndex={-1}
          className="work-title display h-xl"
        >
          {t("title")}
        </SplitReveal>
        <Reveal
          when="ready"
          y={WORK.hero.laterY}
          delay={WORK.hero.laterDelay}
          className="work-hero-row"
        >
          <p className="lead muted">{t("lead")}</p>
          <ArrowLink as={TransitionLink} href="/work" hash={START}>
            {t("start")}
          </ArrowLink>
        </Reveal>
      </div>
    </ToneSection>
  );
}
