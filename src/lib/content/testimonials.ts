/* A testimonial names a role and an organisation, never a person: the schema has no field for one
   and refuses unknown keys. Only confirmed ones render, so the build report ignores the
   placeholders of the others. */
import { z } from "zod";
import { hasTodo } from "@/lib/todo";

const FIELDS = ["role", "organisation", "text"] as const;
type Field = (typeof FIELDS)[number];

export const TESTIMONIAL_IDS = ["festival", "ophtachusm", "sos-dental"] as const;
export type TestimonialId = (typeof TESTIMONIAL_IDS)[number];

const id = z.enum(TESTIMONIAL_IDS);

export const testimonial = z
  .object({
    id,
    role: z.string(),
    organisation: z.string(),
    text: z.string(),
    /** I approved the wording and the client agreed to its publication. */
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
  entry("festival", true),
  entry("ophtachusm", true),
  entry("sos-dental", true),
]);

export function publicTestimonials(list: readonly Testimonial[] = TESTIMONIALS): Testimonial[] {
  return list.filter((item) => item.confirmed);
}

export type TestimonialCatalog = Readonly<{
  testimonials: Readonly<Record<string, Readonly<Partial<Record<Field, string>>>>>;
}>;

/** Unconfirmed ones are never shown, so they are ignored. */
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
