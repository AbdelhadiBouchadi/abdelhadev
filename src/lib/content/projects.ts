/* The five projects, with only the facts in docs/content.md. Everything else is a placeholder
   until the owner supplies it. Parsed at module load, so an invalid entry fails the build. */
import { projects as projectsSchema, type Project } from "@/lib/content/schema";

export const PROJECTS: readonly Project[] = projectsSchema.parse([
  {
    slug: "dentaflow",
    featured: true,
    status: "ready",
    stack: ["Next.js", "TypeScript", "tRPC", "Drizzle", "PostgreSQL (Neon)", "Better Auth"],
    links: {},
    media: [],
    copyKey: "projects.dentaflow",
  },
  {
    slug: "hms",
    featured: false,
    status: "[TODO: HMS status (live, ready or in-progress)]",
    stack: "[TODO: HMS stack]",
    links: {},
    media: [],
    copyKey: "projects.hms",
  },
  {
    slug: "meetai",
    featured: false,
    status: "[TODO: MeetAI status (live, ready or in-progress)]",
    stack: "[TODO: MeetAI stack]",
    links: {},
    media: [],
    copyKey: "projects.meetai",
  },
  {
    slug: "flowshop",
    featured: false,
    status: "[TODO: FlowShop status (live, ready or in-progress)]",
    stack: "[TODO: FlowShop stack]",
    links: {},
    media: [],
    copyKey: "projects.flowshop",
  },
  {
    slug: "cote-royale",
    featured: false,
    status: "[TODO: Côte Royale status (live, ready or in-progress)]",
    stack: "[TODO: Côte Royale stack]",
    links: {},
    media: [],
    clientPermission: "[TODO: confirm the client allows naming Côte Royale]",
    copyKey: "projects.cote-royale",
  },
]);

export const PROJECT_SLUGS = PROJECTS.map((p) => p.slug);

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
