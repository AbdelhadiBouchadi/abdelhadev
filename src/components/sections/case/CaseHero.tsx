import { getMessages, getTranslations } from "next-intl/server";
import type { CaseStudyCopy } from "@/components/sections/case/case-copy";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Screen } from "@/components/ui/Screen";
import { statusKey } from "@/lib/content/projects";
import type { CaseStudy, Project } from "@/lib/content/schema";
import { heroMedia, mediaCopy } from "@/lib/media";
import { CASE, STAGGER } from "@/lib/motion";
import { MediaReveal } from "@/primitives/MediaReveal";
import { ProjectMedia } from "@/primitives/ProjectMedia";
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
  const messages = await getMessages();
  const shot = heroMedia(project.slug, "case")[0];
  const shotCopy = shot ? mediaCopy(messages, shot.key) : null;
  // The same label as the project's chip on the work page (statusKey).
  const status = work(`status.${statusKey(project)}`);
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
          data-cursor={shot ? undefined : work("screenshot")}
        >
          {shot && shotCopy ? (
            <Screen
              // A loop's description is its hidden caption; an image's is its alt.
              caption={shot.asset.kind === "video" ? shotCopy.alt : undefined}
              captionHidden
              media={
                <ProjectMedia
                  item={shot}
                  alt={shotCopy.alt}
                  label={shotCopy.label}
                  sizes="(min-width: 1440px) 1360px, 100vw"
                  priority
                  controls={{ play: work("video.play"), pause: work("video.pause") }}
                />
              }
            />
          ) : (
            <Screen layout={study.hero.skeleton} label={work("screenshot")} />
          )}
        </MediaReveal>
      </div>
      <div className="case-hero-tail" />
    </ToneSection>
  );
}
