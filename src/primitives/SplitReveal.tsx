/* Masked text reveal (prototype linesUp, and the letter reveals of Pages.home and Pages.case).
   Server-rendered heading with the text in it; the client leaf right after it splits the text
   with SplitText and plays the reveal. Without JavaScript, or under reduced motion, the heading is
   plain text and never split.

   Only headings: SplitText's default `aria: "auto"` puts the original text in an aria-label on the
   split element (and hides the pieces), and ARIA prohibits aria-label on paragraphs and generic
   elements, so a split <p> would fail axe's aria-prohibited-attr. */
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { SplitRevealMotion, type SplitRevealMotionProps } from "@/primitives/SplitRevealMotion";

export type SplitRevealTag = "h1" | "h2" | "h3" | "h4";

export interface SplitRevealProps
  extends Omit<ComponentPropsWithoutRef<"h2">, "children">, SplitRevealMotionProps {
  as?: SplitRevealTag;
  /** Plain text (it is split into lines or characters). */
  children: ReactNode;
}

export function SplitReveal({
  as: Tag = "h2",
  type,
  when,
  delay,
  start,
  end,
  trigger,
  pace,
  children,
  ...props
}: SplitRevealProps) {
  return (
    <>
      <Tag {...props} data-split-reveal={type}>
        {children}
      </Tag>
      <SplitRevealMotion
        type={type}
        when={when}
        delay={delay}
        start={start}
        end={end}
        trigger={trigger}
        pace={pace}
      />
    </>
  );
}
