/* One project sheet (prototype .project), with soft corners: the head (title, kind, status chip,
   actions, then the challenge, what was built and the stack) and a 12-column grid of screens.
   - The head's items fade up on entry (Reveal enter, WORK.head, STAGGER.projectHead).
   - Each screen opens as it scrolls in (MediaReveal scrub): the declared span, frame tone and
     aspect come from lib/content/projects.ts. The slots take the project's real screens in the
     order of lib/content/media.map.json (sheetMedia); a slot without one keeps its skeleton.
   - Actions: the case study button only when the project has one (DentaFlow, with "Ask for a
     demo"); otherwise a link to the contact page.
   The sheet is an article named by its title, with the slug as its id: the rail and the hero link
   point at it, and a #slug URL lands on it after the loader. Copy comes from messages.projects. */
import { getMessages, getTranslations } from "next-intl/server";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { buttonClass, buttonSize, SunDot } from "@/components/ui/Button";
import { Chips, type ChipItem } from "@/components/ui/Chip";
import { Screen } from "@/components/ui/Screen";
import { hasMoreScreens, screenCount, sheetMedia } from "@/lib/content/projects";
import type { Project } from "@/lib/content/schema";
import { mediaCopy } from "@/lib/media";
import { STAGGER, WORK } from "@/lib/motion";
import { isTodo } from "@/lib/todo";
import { cn, isKeyOf } from "@/lib/utils";
import { MediaReveal } from "@/primitives/MediaReveal";
import { ProjectMedia } from "@/primitives/ProjectMedia";
import { Reveal } from "@/primitives/Reveal";
import { TransitionLink } from "@/primitives/TransitionLink";

export interface ProjectSheetProps {
  project: Project;
  /** The first sheet of the page: its first screen loads eagerly. */
  first?: boolean;
}

/** The image sizes of a frame: its share of the 12 columns from 761 px, full width below. */
const sizesFor = (span: number) =>
  `(min-width: 761px) ${String(Math.round((span / 12) * 100))}vw, 100vw`;

export async function ProjectSheet({ project, first = false }: ProjectSheetProps) {
  const t = await getTranslations("work");
  const messages = await getMessages();
  const { projects } = messages;
  const { slug } = project;
  if (!isKeyOf(projects, slug)) throw new Error(`messages.projects.${slug} is missing`);
  const copy = projects[slug];
  const real = sheetMedia(project);
  const controls = { play: t("video.play"), pause: t("video.pause") };
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
          const screen = real[i];
          const text = screen ? mediaCopy(messages, screen.key) : null;
          return (
            <MediaReveal
              key={key}
              variant="scrub"
              className="media-frame"
              data-span={item.span}
              data-frame={item.tone}
              data-cursor={screen ? undefined : t("screenshot")}
            >
              {screen && text ? (
                <Screen
                  aspect={item.layout}
                  // A loop's description is its hidden caption; an image's is its alt.
                  caption={screen.asset.kind === "video" ? text.alt : undefined}
                  captionHidden
                  className="h-full"
                  media={
                    <ProjectMedia
                      item={screen}
                      alt={text.alt}
                      label={text.label}
                      sizes={sizesFor(item.span)}
                      priority={first && i === 0}
                      controls={controls}
                    />
                  }
                />
              ) : (
                <Screen
                  layout={item.skeleton}
                  aspect={item.layout}
                  label={t("screenshot")}
                  className="h-full"
                />
              )}
            </MediaReveal>
          );
        })}
      </div>
      {hasMoreScreens(project) ? (
        <p className="media-more">
          <ArrowLink as={TransitionLink} href={caseStudy}>
            {t("allScreens", { count: screenCount(project) })}
          </ArrowLink>
        </p>
      ) : null}
    </article>
  );
}
