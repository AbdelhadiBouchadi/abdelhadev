/* Renders nothing at all, no heading and no spacing, when no testimonial is confirmed. Every window
   is lit by default; under html.motion it waits unlit (home.css) until TestimonialsMotion lights it. */
import { Lamp } from "@/components/brand/Lamp";
import { TestimonialsMotion } from "@/components/sections/home/TestimonialsMotion";
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
        <h2 id="testimonials-title" className="testimonials-title display h-md">
          {title}
        </h2>
        <div className="panes">
          {items.map((item) => (
            <figure key={item.id} className="pane" data-testimonial={item.id}>
              <div className="pane-glass">
                <Lamp className="lamp" />
                <blockquote>
                  <p>{item.text}</p>
                </blockquote>
              </div>
              <figcaption>
                <span className="pane-line" aria-hidden="true" />
                <span className="pane-role">{item.role}</span>
                <span className="pane-org">{item.organisation}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <TestimonialsMotion />
      </div>
    </ToneSection>
  );
}
