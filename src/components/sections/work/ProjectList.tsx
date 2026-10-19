/* The project sheets, one per public project (decision P7), in the work order (WORK_ORDER). [data-projects] is
   the range the rail's progress line fills over. */
import { ProjectSheet } from "@/components/sections/work/ProjectSheet";
import { publicProjects } from "@/lib/content/projects";

export function ProjectList() {
  return (
    <div className="projects" data-projects="">
      {publicProjects().map((project, i) => (
        <ProjectSheet key={project.slug} project={project} first={i === 0} />
      ))}
    </div>
  );
}
