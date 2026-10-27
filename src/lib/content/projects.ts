/* Only the facts in docs/content.md; anything else is a placeholder. Parsed at module load, so an
   invalid entry fails the build. A sheet slot without a real screen keeps its skeleton. */
import { CASE_STUDIES } from "@/lib/content/case-studies";
import { tourMedia, workMedia, type ProjectMediaItem } from "@/lib/media";
import {
  projectStatus,
  projects as projectsSchema,
  type MediaItem,
  type Project,
  type ProjectInput,
  type ProjectStatus,
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
    stack: [
      "Next.js",
      "TypeScript",
      "tRPC",
      "Drizzle",
      "PostgreSQL (Neon)",
      "Better Auth",
      "WhatsApp (Twilio)",
    ],
    media: media(
      { span: 7, tone: "warm", skeleton: "agenda" },
      { span: 5, tone: "plain", skeleton: "record" },
      { span: 4, tone: "plain", skeleton: "plan" },
      { span: 4, tone: "blue", skeleton: "invoice" },
      { span: 4, tone: "plain", skeleton: "chart" },
    ),
    features: ["agenda", "records", "treatments", "invoices"],
    copyKey: "projects.dentaflow",
  },
  {
    slug: "meetai",
    featured: false,
    status: "test-mode",
    permission: "confirmed",
    caseStudy: false,
    stack: [
      "Next.js 15",
      "React 19",
      "TypeScript",
      "tRPC",
      "Drizzle",
      "Neon (PostgreSQL)",
      "Better Auth",
      "Stream",
      "OpenAI",
      "Inngest",
      "Polar",
      "shadcn/ui",
      "Tailwind 4",
    ],
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
    status: "used",
    permission: "confirmed",
    caseStudy: false,
    stack: [
      "Next.js 14",
      "TypeScript",
      "Prisma",
      "MongoDB",
      "Auth.js",
      "UploadThing",
      "Zod",
      "shadcn/ui",
      "Tailwind 3",
    ],
    media: media(
      { span: 8, tone: "dark", skeleton: "chart" },
      { span: 4, tone: "warm", skeleton: "record" },
      { span: 6, tone: "plain", skeleton: "agenda" },
      { span: 6, tone: "blue", skeleton: "plan" },
    ),
    copyKey: "projects.hms",
  },
  {
    slug: "yoga-booking",
    featured: false,
    status: "working",
    // Shown without the studio's name (docs/decisions.md).
    permission: "confirmed",
    caseStudy: false,
    stack: [
      "Next.js 15",
      "React 19",
      "TypeScript",
      "Tailwind 4",
      "shadcn/ui",
      "Prisma",
      "PostgreSQL (Neon)",
      "Better Auth",
      "next-intl",
      "Resend",
      "React Email",
      "UploadThing",
      "Arcjet",
    ],
    media: media(
      { span: 7, tone: "warm", skeleton: "site" },
      { span: 5, tone: "plain", skeleton: "chart" },
      { span: 6, tone: "blue", skeleton: "list" },
      { span: 6, tone: "plain", skeleton: "agenda" },
    ),
    copyKey: "projects.yoga-booking",
  },
  {
    slug: "cote-royale",
    featured: false,
    status: "concept",
    // A concept project with no client, shown on purpose (docs/decisions.md).
    permission: "confirmed",
    caseStudy: false,
    stack: [
      "Next.js 15",
      "React 19",
      "TypeScript",
      "Tailwind 4",
      "GSAP (ScrollTrigger)",
      "Lenis",
      "Prismic",
    ],
    media: media(
      { span: 12, tone: "warm", skeleton: "site", layout: "wide" },
      { span: 6, tone: "plain", skeleton: "site" },
      { span: 6, tone: "blue", skeleton: "plan" },
    ),
    copyKey: "projects.cote-royale",
  },
];

/** A slug missing from INPUT is skipped; a project missing from this list fails the build. */
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

/** The projects I may name publicly: the work page, its rail and the sitemap. */
export function publicProjects(list: readonly Project[] = PROJECTS): Project[] {
  return list.filter((p) => p.permission === "confirmed");
}

/** Any other slug is a 404. */
export function caseStudyProjects(list: readonly Project[] = PROJECTS): Project[] {
  return publicProjects(list).filter((p) => p.caseStudy);
}

export function sheetMedia(p: Project): ProjectMediaItem[] {
  return workMedia(p.slug).slice(0, p.media.length);
}

/** The case study tour's screens when it has some, else the sheet's. */
export function screenCount(p: Project): number {
  return p.caseStudy && Object.hasOwn(CASE_STUDIES, p.slug)
    ? tourMedia(p.slug).size
    : sheetMedia(p).length;
}

export function hasMoreScreens(p: Project): boolean {
  return p.caseStudy && screenCount(p) > sheetMedia(p).length;
}

/** Each one has its label at work.status.<status>. */
export const LABELLED_STATUSES = projectStatus.options;

export type LabelledStatus = ProjectStatus;

export function statusKey(p: Project): LabelledStatus {
  return p.status;
}

/** null for the last one: the case study's next link then goes to the work page. */
export function nextProject(slug: string, list: readonly Project[] = PROJECTS): Project | null {
  const shown = publicProjects(list);
  const i = shown.findIndex((p) => p.slug === slug);
  return i === -1 ? null : (shown[i + 1] ?? null);
}
