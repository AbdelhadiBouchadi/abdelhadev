/* The case study hero (prototype .case-hero), night. After the loader's ready signal: the product
   name rises letter by letter through masks (SplitReveal chars, CHARS_PACE.case), the back link,
   then the lead and the facts fade up one STAGGER.caseLater apart (Reveal), and the first screen
   opens from inset(30% 8% 0 8%) while it settles from 1.2 (MediaReveal intro). Everything is
   painted under the loader overlay and complete without JavaScript and under reduced motion.
   Facts: role and delivery from messages, status as on the work page, stack from the data. */
import { getTranslations } from "next-intl/server";
import type { CaseStudyCopy } from "@/components/sections/case/case-copy";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Screen } from "@/components/ui/Screen";
import type { CaseStudy, Project } from "@/lib/content/schema";
import { CASE, STAGGER } from "@/lib/motion";
import { MediaReveal } from "@/primitives/MediaReveal";
import { Reveal } from "@/primitives/Reveal";
import { SplitReveal } from "@/primitives/SplitReveal";
import { ToneSection } from "@/primitives/ToneSection";
import { TransitionLink } from "@/primitives/TransitionLink";

export interface CaseHeroProps {
  project: Project;
  study: CaseStudy;
  copy: CaseStudyCopy;
}

export async function CaseHero({ project, study, copy }: CaseHeroProps) {
  const t = await getTranslations("case");
  const work = await getTranslations("work");
  // Only "ready" has a label so far; anything else shows as a fact to confirm (as on the sheet).
  const status = project.status === "ready" ? work("status.ready") : work("status.todo");
  const stack = typeof project.stack === "string" ? project.stack : project.stack.join(", ");
  const facts = [
    { term: t("facts.role"), value: t("facts.roleValue") },
    { term: t("facts.status"), value: status },
    { term: t("facts.delivery"), value: t("facts.deliveryValue") },
    { term: t("facts.stack"), value: stack },
  ];

  return (
    <ToneSection tone="night" className="case-hero">
      <div className="wrap">
        <Reveal when="ready" targets="self" y={CASE.hero.laterY} delay={CASE.hero.laterDelay}>
          <ArrowLink as={TransitionLink} href="/work" variant="back">
            {t("back")}
          </ArrowLink>
        </Reveal>
        <SplitReveal
          as="h1"
          type="chars"
          when="ready"
          pace="case"
          tabIndex={-1}
          className="case-word"
        >
          {copy.name}
        </SplitReveal>
        <Reveal
          when="ready"
          y={CASE.hero.laterY}
          delay={CASE.hero.laterDelay + STAGGER.caseLater}
          stagger={STAGGER.caseLater}
          className="case-intro"
        >
          <p className="lead">{copy.case.lead}</p>
          <dl className="facts">
            {facts.map(({ term, value }) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
        <MediaReveal
          variant="intro"
          className="case-shot"
          data-frame={study.hero.tone}
          data-cursor={work("screenshot")}
        >
          <Screen
            layout={study.hero.skeleton}
            label={work("screenshot")}
            caption={copy.case.screens.hero}
            captionHidden
          />
        </MediaReveal>
      </div>
      <div className="case-hero-tail" />
    </ToneSection>
  );
}
