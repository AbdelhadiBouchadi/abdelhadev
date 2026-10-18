/* One project sheet (prototype .project), with soft corners: the head (title, kind, status chip,
   actions, then the challenge, what was built and the stack) and a 12-column grid of screens.
   - The head's items fade up on entry (Reveal enter, WORK.head, STAGGER.projectHead).
   - Each screen opens as it scrolls in (MediaReveal scrub): the declared span, frame tone, aspect
     and skeleton come from lib/content/projects.ts; the placeholders stay until 08.
   - Actions: the case study button only when the project has one (DentaFlow, with "Ask for a
     demo"); otherwise a link to the contact page.
   The sheet is an article named by its title, with the slug as its id: the rail and the hero link
   point at it, and a #slug URL lands on it after the loader. Copy comes from messages.projects. */
import { getMessages, getTranslations } from "next-intl/server";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { buttonClass, buttonSize, SunDot } from "@/components/ui/Button";
import { Chips, type ChipItem } from "@/components/ui/Chip";
import { Screen } from "@/components/ui/Screen";
import { hasMoreScreens } from "@/lib/content/projects";
import type { Project } from "@/lib/content/schema";
import { STAGGER, WORK } from "@/lib/motion";
import { isTodo } from "@/lib/todo";
import { cn, isKeyOf } from "@/lib/utils";
import { MediaReveal } from "@/primitives/MediaReveal";
import { Reveal } from "@/primitives/Reveal";
import { TransitionLink } from "@/primitives/TransitionLink";

export interface ProjectSheetProps {
  project: Project;
}

export async function ProjectSheet({ project }: ProjectSheetProps) {
  const t = await getTranslations("work");
  const { projects } = await getMessages();
  const { slug } = project;
  if (!isKeyOf(projects, slug)) throw new Error(`messages.projects.${slug} is missing`);
  const copy = projects[slug];
  const captions: Record<string, string> = copy.media;
  const titleId = `${slug}-title`;

  // Only "ready" has a label so far; an unconfirmed status shows as a fact to confirm.
  const status: ChipItem | null = isTodo(project.status)
    ? { label: t("status.todo"), variant: "todo" }
    : project.status === "ready"
      ? { label: t("status.ready"), variant: "warm" }
      : null;
  const stack = typeof project.stack === "string" ? [project.stack] : project.stack;
  const caseStudy = { pathname: "/work/[slug]", params: { slug } } as const;

  return (
    <article className="project" id={slug} aria-labelledby={titleId}>
      <Reveal
        when="enter"
        y={WORK.head.y}
        stagger={STAGGER.projectHead}
        start={WORK.head.start}
        className="project-head"
      >
        <div className="project-title">
          <h2 id={titleId} className="project-name">
            {copy.name}
          </h2>
          <p className="project-kind">{copy.kind}</p>
          {status ? <Chips items={[status]} /> : null}
          <div className="project-actions">
            {project.caseStudy ? (
              <>
                <TransitionLink
                  href={caseStudy}
                  className={cn(buttonClass, buttonSize.sm)}
                  data-cursor={t("cursor.caseStudy")}
                >
                  <SunDot />
                  {t("caseStudy")}
                </TransitionLink>
                <ArrowLink as={TransitionLink} href="/contact">
                  {t("demo")}
                </ArrowLink>
              </>
            ) : (
              <ArrowLink as={TransitionLink} href="/contact">
                {t("ask")}
              </ArrowLink>
            )}
          </div>
        </div>
        <div className="project-col">
          <h3>{t("challenge")}</h3>
          <p>{copy.challenge}</p>
        </div>
        <div className="project-col">
          <h3>{t("built")}</h3>
          <p>{copy.built}</p>
        </div>
        <div className="project-col">
          <h3>{t("stack")}</h3>
          <Chips items={stack} />
        </div>
      </Reveal>

      <div className="media" role="group" aria-label={t("screens", { name: copy.name })}>
        {project.media.map((item, i) => {
          const key = `s${String(i + 1)}`;
          return (
            <MediaReveal
              key={key}
              variant="scrub"
              className="media-frame"
              data-span={item.span}
              data-frame={item.tone}
              data-cursor={t("screenshot")}
            >
              <Screen
                layout={item.skeleton}
                aspect={item.layout}
                label={t("screenshot")}
                caption={captions[key] ?? t("screenshot")}
                captionHidden
                className="h-full"
              />
            </MediaReveal>
          );
        })}
      </div>
      {hasMoreScreens(project) && project.screenCount !== undefined ? (
        <p className="media-more">
          <ArrowLink as={TransitionLink} href={caseStudy}>
            {t("allScreens", { count: project.screenCount })}
          </ArrowLink>
        </p>
      ) : null}
    </article>
  );
}
