/* The projects, with only the facts in docs/content.md. Everything else is a placeholder
   until the owner supplies it. Parsed at module load, so an invalid entry fails the build.
   The media are the work page sheets of the prototype (docs/prototype/work.html): span, frame
   tone, aspect and placeholder skeleton, in grid order. Since 08b the slots take the real screens
   of lib/content/media.map.json in order (sheetMedia); a slot without one keeps its skeleton. */
import { CASE_STUDIES } from "@/lib/content/case-studies";
import { tourMedia, workMedia, type ProjectMediaItem } from "@/lib/media";
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
    slug: "hms",
    featured: false,
    status: "[TODO: Ophtachusm status (live, ready or in-progress)]",
    permission: "confirmed",
    caseStudy: false,
    stack: "[TODO: Ophtachusm stack]",
    media: media(
      { span: 8, tone: "dark", skeleton: "chart" },
      { span: 4, tone: "warm", skeleton: "record" },
      { span: 6, tone: "plain", skeleton: "agenda" },
      { span: 6, tone: "blue", skeleton: "plan" },
    ),
    copyKey: "projects.hms",
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

/** The work page order (08b). It may name a project that is not in INPUT yet (yoga-booking
    arrives in 08c): an absent slug is skipped. A project missing from this list fails the build. */
export const WORK_ORDER = ["dentaflow", "meetai", "hms", "yoga-booking", "cote-royale"] as const;

const rank = (slug: string) => (WORK_ORDER as readonly string[]).indexOf(slug);

export const PROJECTS: readonly Project[] = projectsSchema
  .parse(INPUT)
  .sort((a, b) => rank(a.slug) - rank(b.slug));

for (const p of PROJECTS) {
  if (rank(p.slug) === -1) throw new Error(`${p.slug} is missing from WORK_ORDER`);
}

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

/** The real screens on a project's sheet: the map's work entries, in order, up to its slots. */
export function sheetMedia(p: Project): ProjectMediaItem[] {
  return workMedia(p.slug).slice(0, p.media.length);
}

/** Every real screen of a project, from the media manifest (08b): the case study tour's when it
    has one, else the sheet's. */
export function screenCount(p: Project): number {
  return p.caseStudy && Object.hasOwn(CASE_STUDIES, p.slug)
    ? tourMedia(p.slug).size
    : sheetMedia(p).length;
}

/** Whether a sheet links to the case study for the screens it does not show. */
export function hasMoreScreens(p: Project): boolean {
  return p.caseStudy && screenCount(p) > sheetMedia(p).length;
}

/** The public project after `slug` on the work page, or null when it is the last one (the case
    study's next-project link then goes to the work page). */
export function nextProject(slug: string, list: readonly Project[] = PROJECTS): Project | null {
  const shown = publicProjects(list);
  const i = shown.findIndex((p) => p.slug === slug);
  return i === -1 ? null : (shown[i + 1] ?? null);
}
