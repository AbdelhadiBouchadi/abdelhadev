import { getTranslations } from "next-intl/server";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { WORK } from "@/lib/motion";
import { Reveal } from "@/primitives/Reveal";
import { SplitReveal } from "@/primitives/SplitReveal";
import { ToneSection } from "@/primitives/ToneSection";
import { TransitionLink } from "@/primitives/TransitionLink";

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
