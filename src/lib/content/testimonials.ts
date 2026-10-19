/* Testimonials (docs/content.md, "Testimonial"; decision P10). A testimonial shows a role and an
   organisation, never a person's name: the schema has no field for one and refuses unknown keys.
   Every text lives in messages (testimonials.<id>.role, .organisation, .text, same keys in both
   locales). Only a testimonial the owner has confirmed (`confirmed: true`) is rendered; until then
   its texts are placeholders that never ship, so the build report (scripts/report-todos.mjs)
   ignores them, and lists any placeholder left inside a confirmed one. */
import { z } from "zod";
import { hasTodo } from "@/lib/todo";

const FIELDS = ["role", "organisation", "text"] as const;
type Field = (typeof FIELDS)[number];

/** The testimonials that have messages (testimonials.<id>). */
export const TESTIMONIAL_IDS = ["sos-dental", "festival"] as const;
export type TestimonialId = (typeof TESTIMONIAL_IDS)[number];

const id = z.enum(TESTIMONIAL_IDS);

export const testimonial = z
  .object({
    id,
    /** Message keys: testimonials.<id>.role, .organisation and .text. */
    role: z.string(),
    organisation: z.string(),
    text: z.string(),
    /** The owner has supplied and approved the wording, and the client agreed to its publication. */
    confirmed: z.boolean(),
  })
  .strict()
  .superRefine((item, ctx) => {
    for (const field of FIELDS) {
      if (item[field] !== `testimonials.${item.id}.${field}`) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `${field} of ${item.id} must be testimonials.${item.id}.${field}`,
        });
      }
    }
  });

export const testimonials = z.array(testimonial).superRefine((list, ctx) => {
  const ids = new Set<string>();
  for (const item of list) {
    if (ids.has(item.id)) ctx.addIssue({ code: "custom", message: `Duplicate id ${item.id}` });
    ids.add(item.id);
  }
});

export type Testimonial = z.infer<typeof testimonial>;

const entry = (key: TestimonialId, confirmed: boolean) => ({
  id: key,
  role: `testimonials.${key}.role`,
  organisation: `testimonials.${key}.organisation`,
  text: `testimonials.${key}.text`,
  confirmed,
});

export const TESTIMONIALS: readonly Testimonial[] = testimonials.parse([
  entry("sos-dental", false),
  entry("festival", false),
]);

/** The testimonials that may be shown: the confirmed ones, in order. */
export function publicTestimonials(list: readonly Testimonial[] = TESTIMONIALS): Testimonial[] {
  return list.filter((item) => item.confirmed);
}

/** A message catalog, as far as testimonials are concerned. */
export type TestimonialCatalog = Readonly<{
  testimonials: Readonly<Record<string, Readonly<Partial<Record<Field, string>>>>>;
}>;

/** Lists every placeholder (or missing text) inside a confirmed testimonial, as
    `testimonials.<id>.<field> (<locale>): <value>`. Unconfirmed ones are never shown, so they are
    ignored. */
export function todoReport(
  catalogs: Readonly<Record<string, TestimonialCatalog>>,
  list: readonly Testimonial[] = TESTIMONIALS,
): string[] {
  return publicTestimonials(list).flatMap((item) =>
    Object.entries(catalogs).flatMap(([locale, catalog]) =>
      FIELDS.flatMap((field) => {
        const value = catalog.testimonials[item.id]?.[field];
        return value === undefined || value.trim() === "" || hasTodo(value)
          ? [`testimonials.${item.id}.${field} (${locale}): ${value ?? "missing"}`]
          : [];
      }),
    ),
  );
}
