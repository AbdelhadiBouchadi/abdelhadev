import { getMessages, getTranslations } from "next-intl/server";
import { nextProject } from "@/lib/content/projects";
import { isKeyOf } from "@/lib/utils";
import { SplitReveal } from "@/primitives/SplitReveal";
import { ToneSection } from "@/primitives/ToneSection";
import { TransitionLink } from "@/primitives/TransitionLink";

export interface NextProjectProps {
  slug: string;
}

export async function NextProject({ slug }: NextProjectProps) {
  const t = await getTranslations("case");
  const work = await getTranslations("work");
  const { projects } = await getMessages();
  const next = nextProject(slug);
  const target =
    next && isKeyOf(projects, next.slug)
      ? { slug: next.slug, name: projects[next.slug].name }
      : null;

  return (
    <ToneSection tone="day" aria-label={t("next")}>
      <div className="wrap">
        <TransitionLink
          href="/work"
          hash={target?.slug}
          className="next-project"
          data-cursor={t("cursor.next")}
        >
          <span className="next-project-label muted">{target ? t("next") : t("back")}</span>
          <SplitReveal as="h2" type="lines" when="enter" className="next-project-name display h-xl">
            {target ? target.name : work("projects")}
          </SplitReveal>
        </TransitionLink>
      </div>
    </ToneSection>
  );
}
