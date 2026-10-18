/* The sticky project rail (prototype .rail), from 901 px; hidden below, as in the prototype. One
   link per public project (RailLinks, the only client part), and a thin progress line that fills
   while the projects cross the spy line (Scrub scaleY 0 → 1 over the [data-projects] list). */
import { getMessages, getTranslations } from "next-intl/server";
import { RailLinks } from "@/components/sections/work/RailLinks";
import { publicProjects } from "@/lib/content/projects";
import { WORK } from "@/lib/motion";
import { isKeyOf } from "@/lib/utils";
import { Scrub } from "@/primitives/Scrub";

export async function ProjectRail() {
  const t = await getTranslations("work");
  const { projects } = await getMessages();
  const items = publicProjects().map(({ slug }) => ({
    id: slug,
    label: isKeyOf(projects, slug) ? projects[slug].name : slug,
  }));

  return (
    <nav className="rail" aria-label={t("rail")}>
      <RailLinks items={items} />
      <div className="rail-progress" aria-hidden="true">
        <Scrub
          as="span"
          className="rail-fill"
          data-rail-fill=""
          from={{ scaleY: 0 }}
          to={{ scaleY: 1 }}
          trigger="[data-projects]"
          start={WORK.progress.start}
          end={WORK.progress.end}
        >
          {null}
        </Scrub>
      </div>
    </nav>
  );
}
