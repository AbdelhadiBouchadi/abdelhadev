/* The five projects, with only the facts in docs/content.md. Everything else is a placeholder
   until the owner supplies it. Parsed at module load, so an invalid entry fails the build.
   The media are the work page sheets of the prototype (docs/prototype/work.html): span, frame
   tone, aspect and placeholder skeleton, in grid order, until 08 brings the real screenshots. */
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

export const PROJECT_SLUGS = PROJECTS.map((p) => p.slug);

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

/** The projects the client allows to be named (decision P7): the work page, its rail, the sitemap
    and, from 05, the case study's generateStaticParams. */
export function publicProjects(list: readonly Project[] = PROJECTS): Project[] {
  return list.filter((p) => p.permission === "confirmed");
}

/** Whether a sheet links to the case study for the screens it does not show. */
export function hasMoreScreens(p: Project): boolean {
  return p.caseStudy && p.screenCount !== undefined && p.screenCount > p.media.length;
}
