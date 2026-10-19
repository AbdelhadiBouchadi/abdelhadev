/* Renders nothing at all, no heading and no spacing, when no testimonial is confirmed. */
import { Reveal } from "@/primitives/Reveal";
import { ToneSection } from "@/primitives/ToneSection";

export interface TestimonialItem {
  id: string;
  role: string;
  organisation: string;
  text: string;
}

export interface TestimonialsProps {
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
