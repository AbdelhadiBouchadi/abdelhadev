/* The five projects, with only the facts in docs/content.md. Everything else is a placeholder
   until the owner supplies it. Parsed at module load, so an invalid entry fails the build.
   The media are the work page sheets of the prototype (docs/prototype/work.html): span, frame
   tone, aspect and placeholder skeleton, in grid order, until 08 brings the real screenshots. */
import { CASE_STUDIES } from "@/lib/content/case-studies";
import {
  projects as projectsSchema,
  type MediaItem,
  type Project,
  type ProjectInput,
} from "@/lib/content/schema";

type Media = Omit<MediaItem, "kind" | "layout"> & Partial<Pick<MediaItem, "kind" | "layout">>;

const media = (...items: Media[]) => items.map((item) => ({ layout: "default" as const, ...item }));

const INPUT: ProjectInput[] = [
  {
    slug: "dentaflow",
    featured: true,
    status: "ready",
    permission: "confirmed",
    caseStudy: true,
    stack: ["Next.js", "TypeScript", "tRPC", "Drizzle", "PostgreSQL (Neon)", "Better Auth"],
    media: media(
      { span: 7, tone: "warm", skeleton: "agenda" },
      { span: 5, tone: "plain", skeleton: "record" },
      { span: 4, tone: "plain", skeleton: "plan" },
      { span: 4, tone: "blue", skeleton: "invoice" },
      { span: 4, tone: "plain", skeleton: "chart" },
    ),
    // Listed on the home featured work (messages: home.featured.features.<item>).
    features: {
      items: ["agenda", "records", "plans", "invoices"],
      confirmed:
        "[TODO: confirm the DentaFlow feature list (agenda, patient records, treatment plans, invoices)]",
    },
    copyKey: "projects.dentaflow",
  },
  {
    slug: "hms",
    featured: false,
    status: "[TODO: HMS status (live, ready or in-progress)]",
    permission: "confirmed",
    caseStudy: false,
    stack: "[TODO: HMS stack]",
    media: media(
      { span: 8, tone: "dark", skeleton: "chart" },
      { span: 4, tone: "warm", skeleton: "record" },
      { span: 6, tone: "plain", skeleton: "agenda" },
      { span: 6, tone: "blue", skeleton: "plan" },
    ),
    copyKey: "projects.hms",
  },
  {
    slug: "meetai",
    featured: false,
    status: "[TODO: MeetAI status (live, ready or in-progress)]",
    permission: "confirmed",
    caseStudy: false,
    stack: "[TODO: MeetAI stack]",
    media: media(
      { span: 5, tone: "blue", skeleton: "chat" },
      { span: 7, tone: "plain", skeleton: "chart" },
      { span: 12, tone: "warm", skeleton: "site", layout: "wide" },
    ),
    copyKey: "projects.meetai",
  },
  {
    slug: "flowshop",
    featured: false,
    status: "[TODO: FlowShop status (live, ready or in-progress)]",
    permission: "confirmed",
    caseStudy: false,
    stack: "[TODO: FlowShop stack]",
    media: media(
      { span: 6, tone: "warm", skeleton: "list" },
      { span: 6, tone: "plain", skeleton: "invoice" },
      { span: 4, tone: "blue", skeleton: "chart" },
      { span: 8, tone: "plain", skeleton: "list" },
    ),
    copyKey: "projects.flowshop",
  },
  {
    slug: "cote-royale",
    featured: false,
    status: "[TODO: Côte Royale status (live, ready or in-progress)]",
    // The owner cleared naming Côte Royale (docs/decisions.md, P7, update in 04).
    permission: "confirmed",
    caseStudy: false,
    stack: ["GSAP", "TypeScript", "[TODO: the rest of the Côte Royale stack]"],
    media: media(
      { span: 12, tone: "warm", skeleton: "site", layout: "wide" },
      { span: 6, tone: "plain", skeleton: "site" },
      { span: 6, tone: "blue", skeleton: "plan" },
    ),
    copyKey: "projects.cote-royale",
  },
];

export const PROJECTS: readonly Project[] = projectsSchema.parse(INPUT);

// A case study exists exactly for the projects that say so, or the build fails.
for (const p of PROJECTS) {
  if (p.caseStudy !== Object.hasOwn(CASE_STUDIES, p.slug)) {
    throw new Error(
      `${p.slug}: caseStudy is ${String(p.caseStudy)} but its case study data says otherwise`,
    );
  }
}
for (const slug of Object.keys(CASE_STUDIES)) {
  if (!PROJECTS.some((p) => p.slug === slug)) throw new Error(`Case study ${slug} has no project`);
}

export const PROJECT_SLUGS = PROJECTS.map((p) => p.slug);

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

/** The projects the client allows to be named (decision P7): the work page, its rail and the
    sitemap. */
export function publicProjects(list: readonly Project[] = PROJECTS): Project[] {
  return list.filter((p) => p.permission === "confirmed");
}

/** The public projects with a case study page: the case study's generateStaticParams, the
    sitemap and the route list of the tests. Any other slug is a 404. */
export function caseStudyProjects(list: readonly Project[] = PROJECTS): Project[] {
  return publicProjects(list).filter((p) => p.caseStudy);
}

/** Every screen of a project: the case study's tour when it has one, else the sheet's media. */
export function screenCount(p: Project): number {
  const study = p.caseStudy ? CASE_STUDIES[p.slug] : undefined;
  return study ? study.tour.length : p.media.length;
}

/** Whether a sheet links to the case study for the screens it does not show. */
export function hasMoreScreens(p: Project): boolean {
  return p.caseStudy && screenCount(p) > p.media.length;
}

/** The public project after `slug` on the work page, or null when it is the last one (the case
    study's next-project link then goes to the work page). */
export function nextProject(slug: string, list: readonly Project[] = PROJECTS): Project | null {
  const shown = publicProjects(list);
  const i = shown.findIndex((p) => p.slug === slug);
  return i === -1 ? null : (shown[i + 1] ?? null);
}
