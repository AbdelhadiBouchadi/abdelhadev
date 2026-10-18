/* The project sheets, one per public project (decision P7), DentaFlow first. [data-projects] is
   the range the rail's progress line fills over. */
import { ProjectSheet } from "@/components/sections/work/ProjectSheet";
import { publicProjects } from "@/lib/content/projects";

export function ProjectList() {
  return (
    <div className="projects" data-projects="">
      {publicProjects().map((project) => (
        <ProjectSheet key={project.slug} project={project} />
      ))}
    </div>
  );
}
