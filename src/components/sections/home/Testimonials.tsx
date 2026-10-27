/* Renders nothing at all, no heading and no spacing, when no testimonial is confirmed. Without
   motion it is a plain list; with it the quotes replace each other in a sticky stage, driven only
   by CSS scroll-driven animations (home.css). */
import { quoteTiming } from "@/lib/quotes";
import type { CSSVars } from "@/lib/utils";
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

/** Words at even indexes, the spaces between them at odd ones. Only plain spaces split, so a
    non-breaking space keeps its punctuation on the word. */
const splitWords = (text: string) => text.trim().split(/( +)/);

const wordStyle = (w: number): CSSVars => ({ "--w": String(w) });

const pad = (n: number) => String(n).padStart(2, "0");

function quoteStyle(index: number, count: number, words: number): CSSVars {
  const { start, fade, stagger } = quoteTiming(index, count, words);
  return {
    "--a": `${String(start)}%`,
    "--s": `${String(stagger)}%`,
    ...(fade === null ? {} : { "--o": `${String(fade)}%` }),
  };
}

export function Testimonials({ title, items }: TestimonialsProps) {
  if (items.length === 0) return null;
  return (
    <ToneSection
      tone="night"
      id="testimonials"
      aria-labelledby="testimonials-title"
      className="quotes"
    >
      <div className="quotes-track">
        <div className="quotes-stage">
          <div className="quotes-head wrap">
            <h2 id="testimonials-title" className="display h-md">
              {title}
            </h2>
          </div>
          <div className="quotes-list">
            {items.map((item, i) => {
              const parts = splitWords(item.text);
              const words = Math.ceil(parts.length / 2);
              const last = i === items.length - 1;
              return (
                <figure
                  key={item.id}
                  className={last ? "q" : "q q-fade"}
                  data-testimonial={item.id}
                  style={quoteStyle(i, items.length, words)}
                >
                  <span className="q-mark" aria-hidden="true">
                    &ldquo;
                  </span>
                  <blockquote>
                    <p>
                      {parts.map((part, j) =>
                        j % 2 === 1 ? (
                          part
                        ) : (
                          <span key={j} className="w" style={wordStyle(j / 2)}>
                            <span>{part}</span>
                          </span>
                        ),
                      )}
                    </p>
                  </blockquote>
                  <figcaption>
                    <span className="q-no" aria-hidden="true">
                      {`${pad(i + 1)} / ${pad(items.length)}`}
                    </span>
                    <span className="q-role">{item.role}</span>
                    <span className="q-org">{item.organisation}</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
          <div className="q-bar" aria-hidden="true">
            <span />
          </div>
        </div>
      </div>
    </ToneSection>
  );
}
