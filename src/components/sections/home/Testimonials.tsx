/* Testimonials on the home page, between the featured work and the footer call to action, night
   like both neighbours so there is no seam. Only confirmed testimonials reach it (decision P10,
   src/lib/content/testimonials.ts): with none, it renders nothing at all, no heading, no wrapper
   and no spacing. Each one is a figure: the quote large in the display face, with a hanging
   opening mark in the glow colour, and a caption with the role and the organisation, never a
   person's name. Several stack vertically, no carousel. They fade up as they enter (Reveal);
   without JavaScript and under reduced motion they are simply there.

   A pure Server Component: the page resolves the messages and passes the items, so it renders
   the same from fixtures in the unit tests. */
import { Reveal } from "@/primitives/Reveal";
import { ToneSection } from "@/primitives/ToneSection";

export interface TestimonialItem {
  id: string;
  role: string;
  organisation: string;
  text: string;
}

export interface TestimonialsProps {
  /** The section heading (messages home.testimonials.title). */
  title: string;
  items: readonly TestimonialItem[];
}

export function Testimonials({ title, items }: TestimonialsProps) {
  if (items.length === 0) return null;
  return (
    <ToneSection
      tone="night"
      id="testimonials"
      aria-labelledby="testimonials-title"
      className="testimonials"
    >
      <div className="testimonials-inner wrap">
        <h2 id="testimonials-title" className="testimonials-title">
          {title}
        </h2>
        <Reveal when="enter" className="testimonial-list">
          {items.map((item) => (
            <figure key={item.id} className="testimonial" data-testimonial={item.id}>
              <blockquote>
                <p>{item.text}</p>
              </blockquote>
              <figcaption>
                <span>{item.role}</span>
                <span>{item.organisation}</span>
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </div>
    </ToneSection>
  );
}
