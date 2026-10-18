/* Data shapes from docs/architecture.md ("Data shapes"), validated at build time.
   Unknown facts are placeholders (src/lib/todo.ts), accepted wherever a value is not yet supplied. */
import { z } from "zod";
import { isTodo, type Todo } from "@/lib/todo";

export const todo = z.custom<Todo>(isTodo, {
  message: "Expected a placeholder",
});

export const projectStatus = z.enum(["live", "ready", "in-progress"]);

/** The work page shows at most this many media per project; the full set lives in the case study. */
export const MAX_SHEET_MEDIA = 5;

export const mediaItem = z
  .object({
    /** Columns out of 12 on the project sheet (prototype .m-4 to .m-12). */
    span: z.union([
      z.literal(4),
      z.literal(5),
      z.literal(6),
      z.literal(7),
      z.literal(8),
      z.literal(12),
    ]),
    /** The frame around the screen (prototype .media figure, .warm, .blue, .dark). */
    tone: z.enum(["plain", "warm", "blue", "dark"]),
    /** The screen's aspect (Screen `aspect`): 16 / 10, 4 / 5 or 21 / 10. */
    layout: z.enum(["default", "tall", "wide"]),
    /** The placeholder skeleton drawn until 08 brings the real screenshot (Screen `layout`). */
    skeleton: z.enum(["agenda", "record", "plan", "invoice", "list", "chart", "chat", "site"]),
    /** Only the field exists for now: video rendering arrives in 08. */
    kind: z.enum(["image", "video"]).default("image"),
  })
  .strict();

export const project = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    featured: z.boolean(),
    status: z.union([projectStatus, todo]),
    /** Whether the client allows the project to be named publicly (decision P7). Only
        "confirmed" projects appear on the work page, its rail and the sitemap. */
    permission: z.enum(["confirmed", "pending"]),
    /** Whether the project has a case study page (05). */
    caseStudy: z.boolean(),
    /** Never invented: absent until the owner supplies it. */
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
    /** The curated screens of the work page sheet, in grid order. */
    media: z.array(mediaItem).max(MAX_SHEET_MEDIA),
    /** The total number of screens that exist, when it is larger than `media.length`. */
    screenCount: z.number().int().positive().optional(),
    /** The features a page lists (the home featured work), as keys of the page's messages, and
        whether the owner has confirmed the list (a placeholder until then). */
    features: z
      .object({
        items: z.array(z.string().regex(/^[a-z]+$/)).min(1),
        confirmed: z.union([z.literal(true), todo]),
      })
      .strict()
      .optional(),
    /** Points at messages.projects.<slug> for the localised name, kind and texts. */
    copyKey: z.string().regex(/^projects\.[a-z0-9-]+$/),
  })
  .refine((p) => p.screenCount === undefined || p.screenCount > p.media.length, {
    message: "screenCount is only set when it is larger than the media shown",
    path: ["screenCount"],
  });

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

/** A project as written in projects.ts (media `kind` may be left out). */
export type ProjectInput = z.input<typeof project>;
export type Project = z.infer<typeof project>;
export type MediaItem = z.infer<typeof mediaItem>;
