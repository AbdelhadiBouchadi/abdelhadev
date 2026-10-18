/* Data shapes from docs/architecture.md ("Data shapes"), validated at build time.
   Unknown facts are placeholders (src/lib/todo.ts), accepted wherever a value is not yet supplied. */
import { z } from "zod";
import { isTodo, type Todo } from "@/lib/todo";

export const todo = z.custom<Todo>(isTodo, {
  message: "Expected a placeholder",
});

export const projectStatus = z.enum(["live", "ready", "in-progress"]);

export const mediaItem = z.object({
  /** Path under /public/media. */
  path: z.string().startsWith("/media/"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Columns out of 12 on the project sheet (prototype .m-4 to .m-12). */
  span: z.union([
    z.literal(4),
    z.literal(5),
    z.literal(6),
    z.literal(7),
    z.literal(8),
    z.literal(12),
  ]),
});

export const project = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  featured: z.boolean(),
  status: z.union([projectStatus, todo]),
  /** Never invented: absent until the owner supplies it. */
  year: z.number().int().min(2000).max(2100).optional(),
  stack: z.union([z.array(z.string().min(1)).min(1), todo]),
  links: z
    .object({
      demo: z.url().optional(),
      repo: z.url().optional(),
      live: z.url().optional(),
    })
    .strict(),
  media: z.array(mediaItem),
  /** The features a page lists (the home featured work), as keys of the page's messages, and
      whether the owner has confirmed the list (a placeholder until then). */
  features: z
    .object({
      items: z.array(z.string().regex(/^[a-z]+$/)).min(1),
      confirmed: z.union([z.literal(true), todo]),
    })
    .strict()
    .optional(),
  /** Whether the client allows the project to be named publicly. */
  clientPermission: z.union([z.boolean(), todo]).optional(),
  /** Points at messages.projects.<slug> for the localised name, kind and texts. */
  copyKey: z.string().regex(/^projects\.[a-z0-9-]+$/),
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

export type Project = z.infer<typeof project>;
