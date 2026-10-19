/* Unknown facts are placeholders (src/lib/todo.ts), accepted wherever a value is not supplied yet. */
import { z } from "zod";
import { isTodo, type Todo } from "@/lib/todo";

export const todo = z.custom<Todo>(isTodo, {
  message: "Expected a placeholder",
});

export const projectStatus = z.enum([
  "live",
  "ready",
  "in-progress",
  "test-mode",
  "used",
  "working",
  "concept",
]);

export type ProjectStatus = z.infer<typeof projectStatus>;

/** The full set lives in the case study. */
export const MAX_SHEET_MEDIA = 5;

export const frameTone = z.enum(["plain", "warm", "blue", "dark"]);

export const screenSkeleton = z.enum([
  "agenda",
  "record",
  "plan",
  "invoice",
  "list",
  "chart",
  "chat",
  "site",
]);

export const mediaItem = z
  .object({
    /** Columns out of 12. */
    span: z.union([
      z.literal(4),
      z.literal(5),
      z.literal(6),
      z.literal(7),
      z.literal(8),
      z.literal(12),
    ]),
    tone: frameTone,
    layout: z.enum(["default", "tall", "wide"]),
    skeleton: screenSkeleton,
    kind: z.enum(["image", "video"]).default("image"),
  })
  .strict();

export const project = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    featured: z.boolean(),
    status: z.union([projectStatus, todo]),
    /** Only "confirmed" projects appear on the work page, its rail and the sitemap. */
    permission: z.enum(["confirmed", "pending"]),
    caseStudy: z.boolean(),
    /** Never invented: absent until I supply it. */
    year: z.number().int().min(2000).max(2100).optional(),
    stack: z.union([z.array(z.string().min(1)).min(1), todo]),
    links: z
      .object({
        demo: z.url().optional(),
        repo: z.url().optional(),
        live: z.url().optional(),
      })
      .strict()
      .optional(),
    media: z.array(mediaItem).max(MAX_SHEET_MEDIA),
    /** A placeholder until I confirm the list. */
    features: z
      .object({
        items: z.array(z.string().regex(/^[a-z]+$/)).min(1),
        confirmed: z.union([z.literal(true), todo]),
      })
      .strict()
      .optional(),
    copyKey: z.string().regex(/^projects\.[a-z0-9-]+$/),
  })
  .strict();

export const projects = z.array(project).superRefine((list, ctx) => {
  const slugs = new Set<string>();
  for (const item of list) {
    if (slugs.has(item.slug))
      ctx.addIssue({ code: "custom", message: `Duplicate slug ${item.slug}` });
    slugs.add(item.slug);
    if (item.copyKey !== `projects.${item.slug}`) {
      ctx.addIssue({
        code: "custom",
        message: `copyKey of ${item.slug} must be projects.${item.slug}`,
      });
    }
  }
});

const copyKey = z.string().regex(/^[a-z]+$/);

export const caseScreen = z.object({ tone: frameTone, skeleton: screenSkeleton }).strict();

export const TOUR_STEPS = { min: 3, max: 8 } as const;

export const ADAPT_STEPS = 4;

const uniqueKeys = (keys: readonly string[]) => new Set(keys).size === keys.length;

export const caseStudy = z
  .object({
    hero: caseScreen,
    tour: z
      .array(caseScreen.extend({ key: copyKey }).strict())
      .min(TOUR_STEPS.min)
      .max(TOUR_STEPS.max)
      .refine((steps) => uniqueKeys(steps.map((s) => s.key)), "Duplicate tour key"),
    adapt: z.array(copyKey).length(ADAPT_STEPS).refine(uniqueKeys, "Duplicate adaptation key"),
    arch: z
      .object({ listKeys: z.array(copyKey).min(1).refine(uniqueKeys, "Duplicate list key") })
      .strict(),
  })
  .strict();

export const caseStudies = z.record(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), caseStudy);

export type CaseStudy = z.infer<typeof caseStudy>;
export type CaseScreen = z.infer<typeof caseScreen>;

/** As written in projects.ts: media `kind` may be left out. */
export type ProjectInput = z.input<typeof project>;
export type Project = z.infer<typeof project>;
export type MediaItem = z.infer<typeof mediaItem>;
